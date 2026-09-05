import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { auditAxTree, captureTree, parseArgs } from './audit_chromium_ax.mjs';

const node = (nodeId, role, extra = {}) => ({
  nodeId, ignored: false, role: { type: 'role', value: role }, ...extra,
});
const name = (value) => ({ type: 'computedString', value });
const state = (key, value) => ({ name: key, value: { type: 'boolean', value } });
const goodTree = () => [
  node('root', 'RootWebArea', { frameId: 'top', childIds: ['main'] }),
  node('main', 'main', { parentId: 'root', childIds: ['save', 'check'] }),
  node('save', 'button', { parentId: 'main', name: name('Save') }),
  node('check', 'checkbox', {
    parentId: 'main', name: name('Enabled'), properties: [state('checked', false)],
  }),
];

function fakeBrowser(titles, { failures = [], tree = { nodes: goodTree() } } = {}) {
  const events = [];
  const record = (event) => {
    events.push(event);
    if (failures.includes(event)) throw new Error(`failed: ${event}`);
  };
  const session = {
    async send(method) {
      record(method);
      if (method === 'Accessibility.getFullAXTree') return tree;
      return {};
    },
    async detach() { record('detach'); },
  };
  const makePage = (title) => ({
    async title() { record(`title:${title}`); return title; },
    async goto(url) { record(`goto:${url}`); },
    async waitForTimeout(ms) { record(`wait:${ms}`); },
    async close() { record(`page.close:${title}`); },
  });
  const contexts = titles.map((entries, index) => {
    const pages = entries.map(makePage);
    return {
      pages: () => pages,
      async newPage() { record(`newPage:${index}`); return makePage('created'); },
      async newCDPSession(page) {
        assert.ok(pages.includes(page));
        record(`session:${index}:${pages.indexOf(page)}`);
        return session;
      },
      async close() { record(`context.close:${index}`); },
    };
  });
  const ownedPage = makePage('owned');
  const ownedContext = {
    async newPage() { record('owned.newPage'); return ownedPage; },
    async newCDPSession(page) {
      assert.equal(page, ownedPage);
      record('owned.session');
      return session;
    },
    async close() { record('owned.close'); },
  };
  const browser = {
    contexts: () => contexts,
    async newContext(options) {
      record('newContext');
      assert.deepEqual(options, { viewport: { width: 1280, height: 900 } });
      return ownedContext;
    },
    async close() { record('browser.close'); },
  };
  return {
    events,
    chromium: {
      async connectOverCDP() { record('connect'); return browser; },
      async launch() { record('launch'); return browser; },
    },
  };
}

test('normal AX tree passes the partial audit, including explicit false state', () => {
  const report = auditAxTree(goodTree());
  assert.deepEqual(report.problems, []);
  assert.equal(report.actionableNodeCount, 2);
  assert.equal(report.mainLandmarks[0].scope, 'frame:top');
  assert.deepEqual(report.warnings.missingState, []);
  assert.equal(report.fullComputerUseReadinessAssessed, false);
  assert.ok(report.limitations.length > 0);
});

test('unnamed actionable nodes fail; ignored controls do not count', () => {
  const report = auditAxTree([
    node('bad', 'button', { name: name('   '), backendDOMNodeId: 31 }),
    { nodeId: 'ignored', ignored: true },
  ]);
  assert.equal(report.actionableNodeCount, 1);
  assert.equal(report.problems[0].code, 'unnamed_actionable');
  assert.equal(report.problems[0].nodes[0].backendDOMNodeId, 31);
});

test('empty and entirely ignored trees cannot pass', () => {
  for (const tree of [[], [{ nodeId: 'ignored', ignored: true }]]) {
    const report = auditAxTree(tree);
    assert.equal(report.exposedNodeCount, 0);
    assert.equal(report.problems[0].code, 'empty_ax_tree');
  }
});

test('malformed inputs cannot silently pass', () => {
  for (const payload of [
    null, undefined, {}, { nodes: [] }, 'tree', [null], [true], [[]],
    [{}], [{ role: { value: 42 } }], [{ role: 'button' }],
    [{ role: { value: '' } }], [{ role: { value: '  ' } }],
    [node('x', 'button', { ignored: 'false' })],
    [node('x', 'button', { name: 42 })],
    [node('x', 'button', { properties: {} })],
    [node('x', 'button', { properties: [null] })],
    [node('x', 'button', { properties: [{ name: 'checked', value: false }] })],
    [node('x', 'main', { childIds: [null] })],
    [node('x', 'main', { frameId: 1 })],
    [node('x', 'main', { parentId: {} })],
    [node('x', 'main'), node('x', 'main')],
  ]) {
    assert.throws(() => auditAxTree(payload), /Malformed AX/);
  }
});

test('duplicate names and missing states are contextual warnings, not failures', () => {
  const report = auditAxTree([
    node('one', 'button', { name: name('Edit') }),
    node('two', 'button', { name: name('Edit') }),
    ...['checkbox', 'radio', 'switch', 'option', 'tab'].map((role) =>
      node(role, role, { name: name(role) })),
  ]);
  assert.deepEqual(report.problems, []);
  assert.equal(report.warnings.duplicateActionableNames[0].count, 2);
  assert.equal(report.warnings.missingState.length, 5);
  assert.equal(report.warnings.requiresContextualReview, true);
});

test('all supported checked/selected states count as present, even false or mixed', () => {
  const report = auditAxTree([
    ...['checkbox', 'radio', 'switch', 'option', 'tab'].map((role) =>
      node(role, role, {
        name: name(role),
        properties: [state(['option', 'tab'].includes(role) ? 'selected' : 'checked', false)],
      })),
    node('mixed', 'checkbox', {
      name: name('Select all'),
      properties: [{ name: 'checked', value: { type: 'tristate', value: 'mixed' } }],
    }),
  ]);
  assert.deepEqual(report.problems, []);
  assert.deepEqual(report.warnings.missingState, []);
});

for (const useParentIds of [true, false]) {
  test(`iframe mains are separate through ${useParentIds ? 'parentId' : 'childIds'}`, () => {
    const nodes = [
      node('root', 'RootWebArea', { frameId: 'top' }),
      node('main', 'main'),
      node('iframe', 'Iframe'),
      node('inner', 'RootWebArea', { frameId: 'child' }),
      node('inner-main', 'main'),
    ];
    const edges = [[0, 1], [0, 2], [2, 3], [3, 4]];
    for (const [parent, child] of edges) {
      if (useParentIds) nodes[child].parentId = nodes[parent].nodeId;
      else (nodes[parent].childIds ??= []).push(nodes[child].nodeId);
    }
    const report = auditAxTree(nodes.reverse());
    assert.deepEqual(report.problems, []);
    assert.deepEqual(report.warnings.multipleMainLandmarks, []);
    assert.deepEqual(report.warnings.unknownMainLandmarkScopes, []);
    assert.deepEqual(new Set(report.mainLandmarks.map((entry) => entry.scope)),
      new Set(['frame:top', 'frame:child']));
  });
}

test('RootWebArea is a document boundary without frameId, even through ignored nodes', () => {
  const report = auditAxTree([
    node('root', 'RootWebArea', { childIds: ['main', 'ignored'] }),
    node('main', 'main'),
    { nodeId: 'ignored', ignored: true, childIds: ['inner'] },
    node('inner', 'RootWebArea', { childIds: ['inner-main'] }),
    node('inner-main', 'main'),
  ]);
  assert.deepEqual(report.warnings.multipleMainLandmarks, []);
  assert.deepEqual(report.mainLandmarks.map((entry) => entry.scope),
    ['document:root', 'document:inner']);
});

for (const role of ['document', 'application']) {
  test(`nested ${role} can have its own main in the same frame`, () => {
    const report = auditAxTree([
      node('root', 'RootWebArea', { frameId: 'top', childIds: ['outer', 'nested'] }),
      node('outer', 'main'),
      node('nested', role, { frameId: 'top', childIds: ['inner'] }),
      node('inner', 'main', { frameId: 'top' }),
    ]);
    assert.deepEqual(report.problems, []);
    assert.deepEqual(report.warnings.multipleMainLandmarks, []);
    assert.equal(report.mainLandmarks[1].scope, `${role}:nested`);
  });
}

test('main nodes with explicit frameId work without ancestry', () => {
  const report = auditAxTree([
    node('one', 'main', { frameId: 'a' }),
    node('two', 'main', { frameId: 'b' }),
  ]);
  assert.deepEqual(report.warnings.multipleMainLandmarks, []);
  assert.deepEqual(report.warnings.unknownMainLandmarkScopes, []);
});

for (const labels of [['First', 'Second'], ['', ''], ['Same', 'Same']]) {
  test(`multiple mains are review-only with labels ${JSON.stringify(labels)}`, () => {
    const report = auditAxTree([
      node('root', 'RootWebArea', { childIds: ['one', 'two'] }),
      node('one', 'main', { name: name(labels[0]) }),
      node('two', 'main', { name: name(labels[1]) }),
    ]);
    assert.deepEqual(report.problems, []);
    const warning = report.warnings.multipleMainLandmarks[0];
    assert.equal(warning.code, 'multiple_main_landmarks');
    assert.equal(warning.uniqueLabels, labels[0] === 'First');
    assert.equal(warning.nodes.length, 2);
  });
}

test('unknown scopes do not cause window-wide multiple-main findings', () => {
  const report = auditAxTree([node('one', 'main'), node('two', 'main')]);
  assert.deepEqual(report.problems, []);
  assert.deepEqual(report.warnings.multipleMainLandmarks, []);
  assert.equal(report.warnings.unknownMainLandmarkScopes.length, 2);
});

test('cycles, conflicting ancestry and missing parents produce unknown scopes', () => {
  for (const nodes of [
    [node('a', 'main', { parentId: 'b' }), node('b', 'generic', { parentId: 'a' })],
    [node('a', 'main', { parentId: 'missing' })],
    [
      node('root', 'RootWebArea', { childIds: ['a'] }),
      node('other', 'RootWebArea'),
      node('a', 'main', { parentId: 'other' }),
    ],
    [
      node('root', 'RootWebArea', { frameId: 'one', childIds: ['a'] }),
      node('a', 'main', { frameId: 'two' }),
    ],
  ]) {
    assert.equal(auditAxTree(nodes).warnings.unknownMainLandmarkScopes.length, 1);
  }
});

test('CLI rejects missing, duplicate, unknown and incompatible arguments', () => {
  for (const args of [
    [], ['--url'], ['--cdp', '--page-title', 'x'], ['--tree-file', ''],
    ['--unknown'], ['--cdp', 'http://localhost:9222', '--cdp', 'http://localhost:9223'],
    ['--url', 'https://example.test', '--cdp', 'http://localhost:9222'],
    ['--url', 'https://example.test', '--page-title', 'x'],
    ['--cdp', 'http://localhost:9222', '--headed'],
    ['--cdp', 'http://localhost:9222', '--width', '1280'],
    ['--tree-file', 'tree.json', '--wait-ms', '0'],
    ['--url', 'not a URL'], ['--cdp', 'file:///tmp/browser'],
    ['--url', 'javascript:alert(1)'], ['--cdp', 'http://localhost:9222', '--page-title', ' '],
  ]) assert.throws(() => parseArgs(args));
});

test('CLI numeric arguments have bounded integer validation', () => {
  for (const [flag, values] of [
    ['--width', ['0', '-1', '1.5', 'Infinity', 'NaN', '16385', '']],
    ['--height', ['0', '-1', '1e3', '0x10', '16385']],
    ['--wait-ms', ['-1', '1.5', '60001', 'Infinity']],
  ]) {
    for (const value of values) {
      assert.throws(() => parseArgs(['--url', 'about:blank', flag, value]));
    }
  }
  assert.equal(parseArgs(['--url', 'about:blank', '--width', '1']).width, 1);
  assert.equal(parseArgs(['--url', 'about:blank', '--height', '16384']).height, 16384);
  assert.equal(parseArgs(['--url', 'about:blank', '--wait-ms', '0']).waitMs, 0);
  assert.equal(parseArgs(['--help']).help, true);
});

for (const titles of [[], [[]], [['one', 'two']], [['one'], ['two']], [['one'], []]]) {
  test(`ambiguous or empty CDP selection rejects without modifying pages: ${JSON.stringify(titles)}`, async () => {
    const fake = fakeBrowser(titles);
    await assert.rejects(captureTree({ cdp: 'http://localhost:9222' }, fake),
      /requires one context and one page/);
    assert.deepEqual(fake.events, ['connect', 'browser.close']);
  });
}

test('unique title selects across contexts before any AX session or wait', async () => {
  const fake = fakeBrowser([['other'], ['Target page', 'irrelevant']]);
  const result = await captureTree({
    cdp: 'http://localhost:9222', pageTitle: 'Target', waitMs: 0,
  }, fake);
  assert.deepEqual(result.nodes, goodTree());
  assert.deepEqual(fake.events, [
    'connect', 'title:other', 'title:Target page', 'title:irrelevant',
    'session:1:0', 'Accessibility.enable', 'Accessibility.getFullAXTree',
    'Accessibility.disable', 'detach', 'browser.close',
  ]);
});

for (const titles of [[['other']], [['Target'], ['Target']], [[]]]) {
  test(`failed title selection has no page mutations: ${JSON.stringify(titles)}`, async () => {
    const fake = fakeBrowser(titles);
    await assert.rejects(captureTree({
      cdp: 'http://localhost:9222', pageTitle: 'Target',
    }, fake), /Expected one page/);
    assert.deepEqual(fake.events, [
      'connect', ...titles.flat().map((title) => `title:${title}`), 'browser.close',
    ]);
  });
}

test('single existing page captures with explicit enable and correct cleanup order', async () => {
  const fake = fakeBrowser([['only']]);
  await captureTree({ cdp: 'http://localhost:9222' }, fake);
  assert.deepEqual(fake.events, [
    'connect', 'session:0:0', 'Accessibility.enable', 'wait:250',
    'Accessibility.getFullAXTree', 'Accessibility.disable', 'detach', 'browser.close',
  ]);
});

for (const failure of [
  'title:only', 'session:0:0', 'Accessibility.enable', 'wait:250',
  'Accessibility.getFullAXTree', 'Accessibility.disable', 'detach', 'browser.close',
]) {
  test(`CDP failure cleans up without closing user pages: ${failure}`, async () => {
    const fake = fakeBrowser([['only']], { failures: [failure] });
    await assert.rejects(captureTree({
      cdp: 'http://localhost:9222', ...(failure === 'title:only' ? { pageTitle: 'only' } : {}),
    }, fake), /failed:/);
    assert.equal(fake.events.at(-1), 'browser.close');
    if (fake.events.includes('Accessibility.enable')) assert.ok(fake.events.includes('detach'));
    assert.ok(!fake.events.some((event) => /^(goto:|newPage:|page.close:|context.close:|newContext)/.test(event)));
  });
}

test('cleanup continues after multiple errors and preserves original failure', async () => {
  const fake = fakeBrowser([['only']], {
    failures: ['Accessibility.getFullAXTree', 'Accessibility.disable', 'detach', 'browser.close'],
  });
  await assert.rejects(captureTree({ cdp: 'http://localhost:9222', waitMs: 0 }, fake),
    (error) => error instanceof AggregateError && error.errors.length === 4 &&
      error.errors[0].message.includes('getFullAXTree'));
  assert.equal(fake.events.at(-1), 'browser.close');
});

test('malformed live AX responses reject and release connection', async () => {
  const fake = fakeBrowser([['only']], { tree: { nodes: [{}] } });
  await assert.rejects(captureTree({ cdp: 'http://localhost:9222', waitMs: 0 }, fake), /Malformed AX/);
  assert.deepEqual(fake.events.slice(-3), ['Accessibility.disable', 'detach', 'browser.close']);
});

test('invalid direct capture options are rejected before connecting', async () => {
  const fake = fakeBrowser([['only']]);
  for (const options of [
    { cdp: 'http://localhost:9222', url: 'about:blank' },
    { cdp: 'http://localhost:9222', waitMs: -1 },
    { cdp: 'http://localhost:9222', pageTitle: '' },
    { cdp: 'http://localhost:9222', height: 0 },
  ]) await assert.rejects(captureTree(options, fake));
  assert.deepEqual(fake.events, []);
});

test('URL mode only navigates a freshly created owned page', async () => {
  const fake = fakeBrowser([['existing']]);
  await captureTree({ url: 'https://example.test', waitMs: 0 }, fake);
  assert.deepEqual(fake.events, [
    'launch', 'newContext', 'owned.newPage', 'goto:https://example.test', 'owned.session',
    'Accessibility.enable', 'Accessibility.getFullAXTree', 'Accessibility.disable',
    'detach', 'owned.close', 'browser.close',
  ]);
});

for (const failure of ['newContext', 'owned.newPage', 'goto:https://example.test', 'owned.close']) {
  test(`URL mode releases owned resources on failure: ${failure}`, async () => {
    const fake = fakeBrowser([], { failures: [failure] });
    await assert.rejects(captureTree({ url: 'https://example.test', waitMs: 0 }, fake), /failed:/);
    assert.equal(fake.events.at(-1), 'browser.close');
    if (failure !== 'newContext') assert.ok(fake.events.includes('owned.close'));
  });
}

test('offline CLI reads arrays/envelopes, writes reports, and returns meaningful exit codes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ax-audit-test-'));
  const script = fileURLToPath(new URL('./audit_chromium_ax.mjs', import.meta.url));
  try {
    const input = join(dir, 'tree.json');
    const output = join(dir, 'report.json');
    for (const [payload, expectedCode] of [
      [goodTree(), 0], [{ nodes: goodTree() }, 0], [[], 1],
      [[{ ignored: true }], 1], [[node('bad', 'button')], 1],
      [[node('main', 'main')], 0], [{ wrong: [] }, 2],
      [null, 2], [[{ role: { value: 42 } }], 2], [[{}], 2],
    ]) {
      await writeFile(input, JSON.stringify(payload));
      const result = spawnSync(process.execPath, [script, '--tree-file', input, '--output', output],
        { encoding: 'utf8', timeout: 10000 });
      assert.equal(result.status, expectedCode, result.stderr);
      if (expectedCode !== 2) {
        assert.deepEqual(JSON.parse(result.stdout), JSON.parse(await readFile(output, 'utf8')));
      } else {
        assert.equal(result.stdout, '');
        assert.match(result.stderr, /Malformed AX/);
      }
    }
    await writeFile(input, '{bad json');
    const invalid = spawnSync(process.execPath, [script, '--tree-file', input],
      { encoding: 'utf8', timeout: 10000 });
    assert.equal(invalid.status, 2);
    assert.equal(invalid.stdout, '');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
