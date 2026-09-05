import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (path) => readFile(resolve(root, path), 'utf8');

async function documents(dir = root) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) result.push(...await documents(path));
    else if (/\.(md|txt)$/.test(entry.name)) result.push(path);
  }
  return result;
}

test('relative documentation links point to existing repository files', async () => {
  for (const file of await documents()) {
    const text = await readFile(file, 'utf8');
    for (const [, raw] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^[a-z]+:|^#/i.test(raw)) continue;
      const target = resolve(dirname(file), decodeURIComponent(raw.split('#')[0]));
      assert.ok(target.startsWith(root), `Out-of-repository link: ${raw}`);
      await access(target);
    }
  }
});

test('structured project entrypoints and repository index links resolve', async () => {
  const project = JSON.parse(await read('project.json'));
  assert.equal(project.license, 'MIT');
  assert.match(await read('LICENSE'), /^MIT License/);
  const skill = await read(project.entrypoint);
  assert.ok(skill.includes(`name: ${project.slug}\n`));
  for (const path of [...Object.values(project.readme), project.documentationIndex]) {
    await access(resolve(root, path));
  }
  const prefix = `${project.repository}/blob/main/`;
  const index = await read(project.documentationIndex);
  for (const [, link] of index.matchAll(/\]\((https:\/\/[^)]+)\)/g)) {
    assert.ok(link.startsWith(prefix), `Unexpected index origin: ${link}`);
    const path = resolve(root, link.slice(prefix.length));
    assert.ok(path.startsWith(root));
    await access(path);
  }
});

test('documented synthetic examples return the advertised CLI outcomes', () => {
  const script = resolve(root, 'scripts/audit_chromium_ax.mjs');
  for (const [file, code] of [['ax-before.json', 1], ['ax-after.json', 0]]) {
    const result = spawnSync(process.execPath, [
      script, '--tree-file', resolve(root, 'examples', file),
    ], { encoding: 'utf8', timeout: 10000 });
    assert.equal(result.status, code, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.fullComputerUseReadinessAssessed, false);
    assert.equal(report.actionableNodeCount, 2);
    if (code === 1) {
      assert.equal(report.problems[0].code, 'unnamed_actionable');
      assert.equal(report.problems[0].nodes.length, 2);
    } else {
      assert.deepEqual(report.problems, []);
      assert.deepEqual(report.warnings.missingState, []);
    }
  }
});

test('public documentation contains no machine-local home paths', async () => {
  for (const file of await documents()) {
    assert.doesNotMatch(await readFile(file, 'utf8'), /\/(?:Users|home)\/[a-zA-Z0-9_.-]+\//,
      file.slice(root.length).split(sep).join('/'));
  }
});
