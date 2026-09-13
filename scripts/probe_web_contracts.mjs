#!/usr/bin/env node

// Synthetic browser-only probes. Never connect to an existing user session.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const requireFromWorkspace = createRequire(resolve(process.cwd(), 'package.json'));
const playwright = await import(pathToFileURL(requireFromWorkspace.resolve('playwright')).href);
const { chromium } = playwright.default ?? playwright;
const channel = process.env.WEB_AX_CHANNEL;
if (channel && !['chrome', 'chromium'].includes(channel)) {
  throw new Error('WEB_AX_CHANNEL must be chrome or chromium when set.');
}
const browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
const results = [];

async function probe(name, html, check) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    await page.setContent(html);
    const observation = await check(page, context);
    results.push({ name, result: 'pass', ...(observation ? { observation } : {}) });
  } catch (error) {
    results.push({ name, result: 'fail', error: error.message });
  } finally {
    await context.close();
  }
}

async function ax(page, context) {
  const session = await context.newCDPSession(page);
  try {
    await session.send('Accessibility.enable');
    return (await session.send('Accessibility.getFullAXTree')).nodes;
  } finally {
    try { await session.send('Accessibility.disable'); }
    finally { await session.detach(); }
  }
}

try {
  await probe('computed name overrides visible label; description is separate', `
    <button aria-label="Launch" aria-describedby="hint">Save</button>
    <p id="hint">Writes the current draft</p>
  `, async (page, context) => {
    assert.equal(await page.getByRole('button', { name: 'Save', exact: true }).count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Launch', exact: true }).count(), 1);
    const button = (await ax(page, context)).find(n => n.role?.value === 'button');
    assert.equal(button.name.value, 'Launch');
    assert.equal(button.description.value, 'Writes the current draft');
    await page.locator('button').evaluate(el => el.removeAttribute('aria-label'));
    assert.equal(await page.getByRole('button', { name: 'Save', exact: true }).count(), 1);
    assert.equal((await ax(page, context)).find(n => n.role?.value === 'button').name.value, 'Save');
  });

  await probe('hidden referenced text can contribute to name', `
    <span id="label" hidden>Synthetic archive</span>
    <button aria-labelledby="label"></button>
  `, async (page, context) => {
    assert.equal(await page.getByRole('button', { name: 'Synthetic archive' }).count(), 1);
    assert.equal((await ax(page, context)).find(n => n.role?.value === 'button').name.value,
      'Synthetic archive');
  });

  await probe('aria-disabled exposes intent but does not implement an event guard', `
    <button aria-disabled="true" onclick="this.dataset.count=Number(this.dataset.count||0)+1">
      Publish
    </button>
  `, async (page, context) => {
    const button = page.getByRole('button', { name: 'Publish' });
    assert.equal(await button.isDisabled(), true);
    const state = (await ax(page, context)).find(n => n.role?.value === 'button');
    assert.equal(state.properties.find(p => p.name === 'disabled').value.value, true);
    // Intentionally bypass automation guards to demonstrate application behavior.
    await button.evaluate(el => el.click());
    assert.equal(await button.getAttribute('data-count'), '1');
    await button.evaluate(el => { el.disabled = true; el.click(); });
    assert.equal(await button.getAttribute('data-count'), '1');
  });

  await probe('inert blocks focus and removes descendants from browser AX', `
    <button id="outside">Outside</button>
    <div inert><button id="inside">Inside</button></div>
  `, async (page, context) => {
    await page.getByRole('button', { name: 'Outside' }).focus();
    await page.locator('#inside').evaluate(el => el.focus());
    assert.equal(await page.evaluate(() => document.activeElement.id), 'outside');
    const domRoleMatches = await page.getByRole('button', { name: 'Inside' }).count();
    assert.equal((await ax(page, context)).filter(n =>
      !n.ignored && n.role?.value === 'button' && n.name?.value === 'Inside').length, 0);
    return { domRoleMatches, note: 'DOM role matching may include inert descendants; AX/focus are checked separately.' };
  });

  await probe('DOM open/closed shadow coverage differs from Chromium AX', `
    <div id="open"></div><div id="closed"></div>
    <script>
      document.querySelector('#open').attachShadow({mode:'open'}).innerHTML =
        '<button>Open control</button>';
      document.querySelector('#closed').attachShadow({mode:'closed'}).innerHTML =
        '<button>Closed control</button>';
    </script>
  `, async (page, context) => {
    assert.equal(await page.getByRole('button', { name: 'Open control' }).count(), 1);
    assert.equal(await page.getByRole('button', { name: 'Closed control' }).count(), 0);
    const names = (await ax(page, context)).filter(n =>
      !n.ignored && n.role?.value === 'button').map(n => n.name?.value);
    assert.ok(names.includes('Open control'));
    assert.ok(names.includes('Closed control'));
  });

  await probe('frame contents require document scope', `
    <button>Save</button>
    <iframe title="Synthetic editor" srcdoc="<button>Save</button>"></iframe>
  `, async page => {
    assert.equal(await page.getByRole('button', { name: 'Save' }).count(), 1);
    const framed = page.frameLocator('iframe[title="Synthetic editor"]')
      .getByRole('button', { name: 'Save' });
    await framed.waitFor({ state: 'visible' });
    assert.equal(await framed.count(), 1);
    await framed.focus();
    assert.equal(await page.evaluate(() => document.activeElement.tagName), 'IFRAME');
  });

  await probe('re-resolved role locator follows remount while a saved handle detaches', `
    <button data-record="alpha">Open Alpha</button>
  `, async page => {
    const locator = page.getByRole('button', { name: 'Open Alpha', exact: true });
    const old = await locator.elementHandle();
    assert.ok(old);
    try {
      await page.locator('button').evaluate(el => {
        const replacement = el.cloneNode(true);
        replacement.dataset.generation = '2';
        el.replaceWith(replacement);
      });
      assert.equal(await old.evaluate(el => el.isConnected), false);
      assert.equal(await locator.getAttribute('data-record'), 'alpha');
      assert.equal(await locator.getAttribute('data-generation'), '2');
    } finally { await old.dispose(); }
  });

  await probe('covered textbox: fill can work while pointer click is blocked', `
    <label for="draft">Draft</label><input id="draft">
    <div style="position:fixed;inset:0;z-index:10;background:white">Cover</div>
  `, async page => {
    const input = page.getByRole('textbox', { name: 'Draft' });
    let failure;
    try { await input.click({ trial: true, timeout: 400 }); }
    catch (error) { failure = error; }
    assert.equal(failure?.name, 'TimeoutError');
    assert.match(failure.message, /intercepts pointer events/);
    await input.fill('synthetic');
    assert.equal(await input.inputValue(), 'synthetic');
    // This is a method-boundary probe, not acceptance of typing behind a modal.
  });

  await probe('actionable pre-hydration button can accept a click with no business effect', `
    <button>Save</button><output id="result">Not saved</output>
  `, async page => {
    const button = page.getByRole('button', { name: 'Save' });
    await button.click();
    assert.equal(await page.locator('#result').textContent(), 'Not saved');
    await button.evaluate(el => el.addEventListener('click', () => {
      document.querySelector('#result').textContent = 'Saved';
    }));
    await button.click();
    assert.equal(await page.locator('#result').textContent(), 'Saved');
  });
} finally {
  const report = {
    kind: 'synthetic_web_contract_probes',
    playwright: requireFromWorkspace('playwright/package.json').version,
    chromium: browser.version(),
    channel: channel ?? 'bundled-headless-shell',
    limits: [
      'Local synthetic Chromium pages only; no production app or native OS AX.',
      'No cross-origin OOPIF, real IME, screen reader, history recording or persistence oracle.',
      'Passing probes demonstrate counterexamples and boundaries, not complete app readiness.',
    ],
    results,
  };
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}

if (results.some(result => result.result === 'fail')) process.exitCode = 1;
