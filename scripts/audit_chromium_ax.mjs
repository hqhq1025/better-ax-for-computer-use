#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ACTIONABLE_ROLES = new Set([
  'button',
  'checkbox',
  'combobox',
  'link',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'radio',
  'searchbox',
  'slider',
  'spinbutton',
  'switch',
  'tab',
  'textbox',
  'treeitem',
]);

function usage() {
  return [
    'Run a lightweight, partial Chromium AX audit, not a full CU readiness check.',
    '',
    'Usage:',
    '  audit_chromium_ax.mjs --url <url> [options]',
    '  audit_chromium_ax.mjs --cdp <endpoint> [options]',
    '  audit_chromium_ax.mjs --tree-file <ax-tree.json> [options]',
    '',
    'Options:',
    '  --page-title <text>   With --cdp, require one matching title across all contexts',
    '  --width <px>          Viewport width for launched Chromium (default 1280)',
    '  --height <px>         Viewport height for launched Chromium (default 900)',
    '  --wait-ms <ms>        Wait before capture, 0..60000 (default 250)',
    '  --output <path>       Write the JSON report',
    '  --headed              Launch a visible browser',
    '  --help                Show this help',
  ].join('\n');
}

const DEFAULTS = { width: 1280, height: 900, waitMs: 250, headed: false };
const VALUE_FLAGS = new Map([
  ['--url', 'url'], ['--cdp', 'cdp'], ['--tree-file', 'treeFile'],
  ['--page-title', 'pageTitle'], ['--output', 'output'],
  ['--width', 'width'], ['--height', 'height'], ['--wait-ms', 'waitMs'],
]);

function validateOptions(input) {
  const options = { ...DEFAULTS, ...input };
  for (const key of ['url', 'cdp', 'treeFile', 'pageTitle', 'output']) {
    if (key in input && (typeof input[key] !== 'string' || !input[key].trim())) {
      throw new Error(`${key} must be a non-empty string.`);
    }
  }
  if ([options.url, options.cdp, options.treeFile].filter(Boolean).length !== 1) {
    throw new Error('Pass exactly one of --url, --cdp, or --tree-file.');
  }
  for (const key of ['width', 'height', 'waitMs']) {
    const min = key === 'waitMs' ? 0 : 1;
    const max = key === 'waitMs' ? 60000 : 16384;
    if (!Number.isInteger(options[key]) || options[key] < min || options[key] > max) {
      throw new Error(`${key} must be an integer in ${min}..${max}.`);
    }
  }
  if (typeof options.headed !== 'boolean') throw new Error('headed must be boolean.');
  if (options.pageTitle && !options.cdp) {
    throw new Error('--page-title requires --cdp.');
  }
  if (!options.url && ['width', 'height', 'headed'].some((key) => key in input)) {
    throw new Error('--width, --height and --headed require --url.');
  }
  if (options.treeFile && 'waitMs' in input) {
    throw new Error('--wait-ms cannot be used with --tree-file.');
  }
  for (const key of ['url', 'cdp']) {
    if (!options[key]) continue;
    let url;
    try {
      url = new URL(options[key]);
    } catch {
      throw new Error(`${key} must be an absolute URL.`);
    }
    const protocols = key === 'cdp'
      ? ['http:', 'https:', 'ws:', 'wss:']
      : ['http:', 'https:', 'file:', 'about:'];
    if (!protocols.includes(url.protocol)) {
      throw new Error(`Unsupported ${key} protocol: ${url.protocol}`);
    }
  }
  return options;
}

export function parseArgs(argv) {
  const options = {};
  const seen = new Set();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (seen.has(arg)) throw new Error(`Duplicate argument: ${arg}`);
    seen.add(arg);
    if (arg === '--help') options.help = true;
    else if (arg === '--headed') options.headed = true;
    else if (VALUE_FLAGS.has(arg)) {
      const value = argv[++index];
      if (value === undefined || value.startsWith('--') || !value.trim()) {
        throw new Error(`Missing value for ${arg}.`);
      }
      const key = VALUE_FLAGS.get(arg);
      if (['width', 'height', 'waitMs'].includes(key)) {
        if (!/^\d+$/.test(value)) throw new Error(`${arg} requires a decimal integer.`);
        options[key] = Number(value);
      } else {
        options[key] = value;
      }
    }
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!options.help) validateOptions(options);
  return options;
}

function axValue(value) {
  return value?.value;
}

function axString(value) {
  const raw = axValue(value);
  return typeof raw === 'string' ? raw.trim() : '';
}

function properties(node) {
  return new Map(
    (node.properties ?? []).map((property) => [
      property.name,
      axValue(property.value),
    ]),
  );
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateTree(nodes) {
  if (!Array.isArray(nodes)) throw new Error('Malformed AX input: expected a nodes array.');
  const ids = new Set();
  for (const [index, node] of nodes.entries()) {
    const invalid = (detail) => {
      throw new Error(`Malformed AX node at index ${index}: ${detail}.`);
    };
    if (!isObject(node)) invalid('expected an object');
    if ('ignored' in node && typeof node.ignored !== 'boolean') invalid('ignored must be boolean');
    // Ignored CDP nodes can omit their role; exposed nodes cannot pass without one.
    if (!node.ignored || 'role' in node) {
      if (!isObject(node.role) || typeof node.role.value !== 'string' || !node.role.value.trim()) {
        invalid('role.value must be a non-empty string');
      }
    }
    if ('name' in node && (!isObject(node.name) || typeof node.name.value !== 'string')) {
      invalid('name.value must be a string');
    }
    for (const key of ['nodeId', 'parentId', 'frameId']) {
      if (key in node && (typeof node[key] !== 'string' || !node[key].trim())) {
        invalid(`${key} must be a non-empty string`);
      }
    }
    if (node.nodeId !== undefined) {
      if (ids.has(node.nodeId)) invalid(`duplicate nodeId ${node.nodeId}`);
      ids.add(node.nodeId);
    }
    if ('childIds' in node && (!Array.isArray(node.childIds) ||
        node.childIds.some((id) => typeof id !== 'string' || !id.trim()))) {
      invalid('childIds must be an array of non-empty strings');
    }
    if ('properties' in node && (!Array.isArray(node.properties) ||
        node.properties.some((property) => !isObject(property) ||
          typeof property.name !== 'string' || !property.name.trim() ||
          !isObject(property.value)))) {
      invalid('properties must contain named AXValue objects');
    }
  }
}

function documentScopes(nodes) {
  const byId = new Map(nodes.filter((node) => node.nodeId !== undefined)
    .map((node) => [node.nodeId, node]));
  const parents = new Map();
  const addParent = (child, parent) => {
    const entries = parents.get(child) ?? new Set();
    entries.add(parent);
    parents.set(child, entries);
  };
  for (const node of nodes) {
    if (node.parentId) addParent(node, byId.get(node.parentId) ?? node.parentId);
    for (const childId of node.childIds ?? []) {
      const child = byId.get(childId);
      if (child) addParent(child, node);
    }
  }
  const rootIds = new Map(nodes.map((node, index) => [node, node.nodeId ?? `index-${index}`]));
  return (node) => {
    const seen = new Set();
    let current = node;
    let frameId;
    while (isObject(current) && !seen.has(current)) {
      seen.add(current);
      if (frameId && current.frameId && frameId !== current.frameId) return null;
      frameId ??= current.frameId;
      const role = axString(current.role);
      // Nested ARIA document/application roles can each own a main landmark.
      if (['document', 'application'].includes(role)) return `${role}:${rootIds.get(current)}`;
      if (role === 'RootWebArea') {
        return frameId ? `frame:${frameId}` : `document:${rootIds.get(current)}`;
      }
      const candidates = parents.get(current);
      if (!candidates) return frameId ? `frame:${frameId}` : null;
      if (candidates.size !== 1) return null;
      [current] = candidates;
    }
    return isObject(current) ? null : frameId ? `frame:${frameId}` : null;
  };
}

export function auditAxTree(nodes) {
  validateTree(nodes);
  const sourceNodes = nodes;
  const exposed = sourceNodes.filter(
    (node) => !node?.ignored,
  );
  const scopeFor = documentScopes(sourceNodes);
  const actionable = exposed.filter((node) =>
    ACTIONABLE_ROLES.has(axString(node.role)),
  );
  const unnamedActionable = actionable
    .filter((node) => axString(node.name).length === 0)
    .map((node) => ({
      nodeId: node.nodeId,
      role: axString(node.role),
      backendDOMNodeId: node.backendDOMNodeId,
    }));
  const mainLandmarks = exposed
    .filter((node) => axString(node.role) === 'main')
    .map((node) => ({
      nodeId: node.nodeId,
      name: axString(node.name),
      backendDOMNodeId: node.backendDOMNodeId,
      scope: scopeFor(node),
    }));

  const names = new Map();
  for (const node of actionable) {
    const role = axString(node.role);
    const name = axString(node.name);
    if (!name) continue;
    const key = `${role}\u0000${name}`;
    const entry = names.get(key) ?? { role, name, count: 0 };
    entry.count += 1;
    names.set(key, entry);
  }

  const missingState = [];
  for (const node of actionable) {
    const role = axString(node.role);
    const state = properties(node);
    if (['checkbox', 'radio', 'switch'].includes(role) && !state.has('checked')) {
      missingState.push({ nodeId: node.nodeId, role, name: axString(node.name), property: 'checked' });
    }
    if (['option', 'tab'].includes(role) && !state.has('selected')) {
      missingState.push({ nodeId: node.nodeId, role, name: axString(node.name), property: 'selected' });
    }
  }

  const problems = [];
  if (exposed.length === 0) {
    problems.push({
      code: 'empty_ax_tree',
      nodes: [],
    });
  }
  if (unnamedActionable.length > 0) {
    problems.push({
      code: 'unnamed_actionable',
      nodes: unnamedActionable,
    });
  }
  const mainsByScope = new Map();
  for (const landmark of mainLandmarks) {
    if (landmark.scope === null) continue;
    const group = mainsByScope.get(landmark.scope) ?? [];
    group.push(landmark);
    mainsByScope.set(landmark.scope, group);
  }
  const multipleMainLandmarks = [...mainsByScope]
    .filter(([, landmarks]) => landmarks.length > 1)
    .map(([scope, landmarks]) => ({
      code: 'multiple_main_landmarks',
      scope,
      uniqueLabels: landmarks.every((node) => node.name) &&
        new Set(landmarks.map((node) => node.name)).size === landmarks.length,
      nodes: landmarks,
    }));

  return {
    auditKind: 'lightweight_partial_chromium_ax',
    fullComputerUseReadinessAssessed: false,
    limitations: [
      'Only the supplied snapshot and a small set of AX roles, names and states are checked.',
      'No workflow, action/effect, keyboard, focus, visual coverage or full CU readiness verification.',
      'Live capture reads the root document; complete iframe/OOPIF coverage is not guaranteed.',
      'Main landmarks are compared only within inferred document/frame/application scopes. Unknown scopes are not compared.',
      'Missing or conflicting ancestry, cycles, or omitted frame/root data can prevent scope inference.',
      'Multiple mains, duplicate names and missingState require contextual review; they are not automatic failures or WCAG verdicts.',
    ],
    sourceNodeCount: sourceNodes.length,
    exposedNodeCount: exposed.length,
    actionableNodeCount: actionable.length,
    mainLandmarks,
    problems,
    warnings: {
      requiresContextualReview: true,
      multipleMainLandmarks,
      unknownMainLandmarkScopes: mainLandmarks.filter((node) => node.scope === null),
      duplicateActionableNames: [...names.values()].filter(
        (entry) => entry.count > 1,
      ),
      missingState,
    },
  };
}

async function loadChromium() {
  const requireFromWorkspace = createRequire(resolve(process.cwd(), 'package.json'));
  for (const packageName of ['playwright', '@playwright/test']) {
    try {
      const entry = requireFromWorkspace.resolve(packageName);
      const module = await import(pathToFileURL(entry).href);
      const chromium = module.chromium ?? module.default?.chromium;
      if (chromium) return chromium;
    } catch {
      // Try the next supported package.
    }
  }
  throw new Error(
    'Install playwright or @playwright/test in the target workspace before using --url or --cdp.',
  );
}

async function readTreeFile(path) {
  const payload = JSON.parse(await readFile(resolve(path), 'utf8'));
  const nodes = Array.isArray(payload) ? payload : isObject(payload) ? payload.nodes : undefined;
  validateTree(nodes);
  return nodes;
}

export async function captureTree(input, { chromium: injectedChromium } = {}) {
  const options = validateOptions(input);
  if (options.treeFile) return { nodes: await readTreeFile(options.treeFile) };

  const chromium = injectedChromium ?? await loadChromium();
  let browser;
  let ownedContext;
  let cdp;
  let accessibilityEnabled = false;
  let result;
  const errors = [];
  try {
    let context;
    let page;
    if (options.cdp) {
      browser = await chromium.connectOverCDP(options.cdp);
      const contexts = browser.contexts();
      const candidates = contexts.flatMap((entry) =>
        entry.pages().map((candidate) => ({ context: entry, page: candidate })));
      if (options.pageTitle) {
        const matches = [];
        for (const candidate of candidates) {
          if ((await candidate.page.title()).includes(options.pageTitle)) matches.push(candidate);
        }
        if (matches.length !== 1) {
          throw new Error(`Expected one page matching "${options.pageTitle}", found ${matches.length}.`);
        }
        ({ context, page } = matches[0]);
      } else {
        if (contexts.length !== 1 || candidates.length !== 1) {
          throw new Error(
            `CDP selection requires one context and one page without --page-title; found ${contexts.length} contexts and ${candidates.length} pages.`,
          );
        }
        ({ context, page } = candidates[0]);
      }
    } else {
      browser = await chromium.launch({ headless: !options.headed });
      ownedContext = await browser.newContext({
          viewport: { width: options.width, height: options.height },
        });
      context = ownedContext;
      page = await context.newPage();
      await page.goto(options.url, { waitUntil: 'load' });
    }
    cdp = await context.newCDPSession(page);
    await cdp.send('Accessibility.enable');
    accessibilityEnabled = true;
    if (options.waitMs > 0) await page.waitForTimeout(options.waitMs);
    result = await cdp.send('Accessibility.getFullAXTree');
    validateTree(result?.nodes);
  } catch (error) {
    errors.push(error);
  } finally {
    // Playwright Browser.close disconnects a connectOverCDP connection. Never
    // send CDP Browser.close or close an existing user's context/page.
    // https://playwright.dev/docs/api/class-browser#browser-close
    for (const cleanup of [
      () => accessibilityEnabled && cdp.send('Accessibility.disable'),
      () => cdp?.detach(),
      () => ownedContext?.close(),
      () => browser?.close(),
    ]) {
      try {
        await cleanup();
      } catch (error) {
        errors.push(error);
      }
    }
  }
  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) {
    throw new AggregateError(errors, errors.map((error) => error.message ?? String(error)).join('; '));
  }
  return result;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const tree = await captureTree(options);
  const report = auditAxTree(tree.nodes);
  const json = `${JSON.stringify(report, null, 2)}\n`;
  process.stdout.write(json);
  if (options.output) await writeFile(resolve(options.output), json, 'utf8');
  if (report.problems.length > 0) process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  });
}
