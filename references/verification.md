# Verification and Completion Gate

## Coverage inventory

Create a table before claiming completion:

| Surface | States | Actions | Runtime tree | Effect oracle |
|---|---|---|---|---|
| Main navigation | default/current/collapsed | open route | checked | route changed |
| Settings page | loading/ready/error/narrow | edit/save | checked | persisted value |
| Dialog | opening/open/error/closing | confirm/cancel | checked | mutation/closed |
| Virtual list | empty/small/large/scrolled | select/open | checked | selection/content |

For an application-wide readiness claim, the inventory must include the
following. For a scoped repair, record the changed surface and affected shared
call sites, and explicitly exclude unmeasured areas:

- every source-defined route/page;
- every modal, sheet, menu, popover, and secondary window;
- all critical conditional states;
- responsive/narrow states;
- long-content and large-data states;
- custom-rendered areas;
- platform-specific implementations.

## Static verification

Search for:

- clickable generic elements;
- icon-only controls without names;
- fields without persistent labels;
- positive tab order;
- invalid role/state combinations;
- nested `main` landmarks;
- untranslated accessibility strings;
- design-system controls that bypass their required `label` contract.

Prefer existing AST or framework-aware checks. Do not resurrect a deliberately
removed regex gate. If an existing regex gate is maintained, use positive and
negative fixtures and do not mistake it for runtime coverage.

## Runtime tree verification

Keep the evidence layers separate:

| Evidence | Proves within tested scope | Does not substitute for |
|---|---|---|
| Playwright role/name/state and ARIA snapshot | DOM-derived semantic contract and browser interaction | Chromium AX output or native OS AX |
| CDP AX capture | Chromium's exposed accessibility nodes | Electron native menus/windows or full cross-frame coverage |
| Native AX/UIA/AT-SPI client | Platform bridge output and tested actions | Business effect or all supported OS versions |
| Business oracle | Intended state change/persistence | Discoverability or accessible input path |

Critical role-specific state must be asserted in component or workflow tests.
A lint report that leaves missing state as a warning does not waive it.

For each final state:

- activate the platform accessibility subsystem;
- capture the tree;
- fail on unnamed actionable nodes;
- inspect main landmarks within each document/application scope; review
  multiple mains and their labels instead of failing across unrelated frames;
- inspect duplicate role/name pairs for ambiguity;
- confirm current/selected/expanded/checked/busy/invalid/value state;
- confirm focused element and focused window;
- confirm hidden/inert surfaces are absent or ignored;
- confirm every visible critical action has a semantic node.

For Chromium/Electron:

```sh
node scripts/audit_chromium_ax.mjs --url http://127.0.0.1:3000
node scripts/audit_chromium_ax.mjs --cdp http://127.0.0.1:9222 --page-title "My App"
```

Run these from the target workspace so its Playwright package can be resolved;
use an absolute script path when needed. CDP access requires authorization and
an already exposed debugging endpoint. Do not enable it on a user's app merely
to run an audit. Use synthetic fixtures for captured trees and output files.

This helper checks a limited role/name/state subset. It cannot prove every
visible control is present, OOPIF coverage, focus, supported actions, geometry,
privacy, freshness, or workflow success. Empty, malformed, or unavailable
observations must not count as passes.

Run Storybook interaction/play steps before capturing final states. A screenshot
or story URL alone does not establish that the menu/dialog was opened. Test
narrow layouts below the actual breakpoint and capture loading/error states
deliberately rather than trusting a fixed sleep.

## Interaction verification

For each critical action:

1. Capture the exact target window and current tree.
2. Resolve one unique semantic node.
3. Invoke the supported client's target-addressed action.
4. Capture a fresh tree.
5. Assert an action-specific effect.

Examples:

- click tab -> selected tab and visible panel change;
- toggle -> checked/pressed state and persisted setting change;
- submit -> dialog closes and record count increases;
- type -> focused field owns the value;
- delete -> target record disappears;
- open secondary window -> exact new window and content appear;
- scroll -> visible range and domain position change.

Do not verify success with "some pixels changed."

Keep locating, delivery, and verification in separate trace fields. When
delivery is unknown, record it as unknown. For text, verify controlled state
and persisted value, not just the rendered input's `.value`; include relevant
input/change/blur/submit and composition behavior.

Add relevant negative cases from `consumer-contract.md`: duplicate rows,
recycled nodes, navigation, multiple windows, covered controls, focus moved by
the user, failed observation, timeout with delayed effect. If the runtime cannot
enforce a boundary, document it rather than attributing the guarantee to AX.

## Keyboard and focus verification

Test:

- Tab/Shift+Tab order;
- arrow-key behavior in composite controls;
- Enter/Space activation;
- Escape dismissal;
- focus entry into dialogs;
- focus restoration;
- no focusable nodes inside inert/hidden surfaces;
- no keyboard input unless focused element ownership is provable.

## Performance verification

Record:

- production dependencies added;
- new observers, timers, polling, OCR, or tree scans;
- initial and route-level bundle changes;
- whether unrelated panels are still lazy;
- tree node count in small and large states;
- observation latency in large states.

Treat production full-tree synthesis for ordinary controls as a design failure.

## Privacy verification

Inspect logs, traces, screenshots, CI artifacts, and persisted sessions for:

- passwords and secure values;
- typed text;
- raw accessibility values;
- coordinates;
- window titles and account names;
- private URLs and tokens.

Sanitize or disable persistence by default.

## Optional demonstration-derived regressions

When demonstrations or replay tests are already available, extract semantic
targets, preconditions, actions, and expected effects from a sanitized trace.
Flag missing semantic targets as gaps rather than preserving coordinates.
Replay from a fresh observation with changed row order or window position.
Report capture quality, target resolution, execution, and verified outcome
separately. Generating a replay skill is not proof that its workflow succeeds.
Do not add recording infrastructure unless requested.

## Completion gate

When history quality is requested, use the separate
[history-readiness guide](history-readiness.md) and
[synthetic test plan](history-readiness-test-plan.md). Verify state readability,
change observation, source attribution, privacy and reconstruction independently.
Neither an AX lint pass nor a successful action proves that the recorder retained
the transition or that a summary recovered the supported outcome.

An audit is complete when its requested scope, evidence, findings, and coverage
limits are reported. Defects and missing runtime evidence do not require
unauthorized repairs or interactions; label source-only or partial conclusions.

For an authorized repair, report that the measured scope passes readiness only
when:

- the requested scope's source inventory is complete and quantified;
- all measured final states pass the runtime tree gate;
- every critical action has a semantic path and an effect oracle;
- missing/ambiguous/stale targets fail closed;
- keyboard and focus behavior passes;
- custom-rendered gaps are repaired or explicitly documented;
- packaged/native platform checks pass where relevant;
- performance and privacy impacts are stated;
- residual unmeasured states are listed instead of hidden.
