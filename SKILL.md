---
name: better-ax-for-computer-use
description: Improve source-modifiable apps for Computer Use through reliable accessibility semantics, target identity, actions, focus, and observable effects. Use for AX/a11y/UIA audits or repairs, agent-operable UI, and Computer Use readiness in web, Electron, native, or custom-rendered apps. Not for operating an app or building external adapters for unmodifiable targets.
---

# Better AX for Computer Use

Make the application itself understandable and operable by Computer Use.
Implement this primarily through the application's native accessibility and
semantic UI layer; do not bolt on a second hidden control surface for the agent.
Native virtual accessibility elements or framework representations are valid
when they share rendering's authoritative state, actions, and permissions.

AX here includes browser accessibility trees and platform accessibility
interfaces, not only macOS AX. Preserve usability for human assistive technology.

## Boundary

Use this skill when the application's source can be changed.

When the target cannot be repaired in-process, report that an external adapter
is a separate task outside this skill. Custom rendering alone does not require
an external adapter when the application source is available.

An audit or review remains read-only. Implement fixes when requested; do not
expand an app semantics task into a CU runtime, MCP server, recording system,
or hidden automation API. A narrower requested scope needs only the relevant
workflow steps and checks below.

Treat WCAG as the human accessibility baseline, not the full Computer Use
acceptance test. Computer Use also needs complete workflow coverage, stable
target identity, exact window ownership, and observable post-action effects.

## Workflow

### 1. Establish the real surface inventory

Read the repository before editing.

Scope the inventory to the requested app, feature, or component. Record the
app/framework/build, OS, observation client/version, target window/tab, and
which capabilities and permissions are actually available. Build a measurable
inventory of:

- routes, pages, panels, tabs, menus, dialogs, sheets, secondary windows;
- all actionable component call sites, including controls hidden in unopened
  menus or conditional states;
- loading, empty, error, disabled, permission, onboarding, narrow-window, and
  long-content states;
- custom Canvas, WebGL, QML, owner-drawn, or virtualized surfaces;
- platform-specific implementations and packaged-app boundaries.

Do not claim "all pages and buttons" from a few happy-path screenshots. State
the source count, runtime surfaces, and states actually covered.

### 2. Capture the runtime semantic baseline

Inspect the real accessibility tree after an accessibility client is active.
For Chromium/Electron, use `scripts/audit_chromium_ax.mjs` as a partial tree
lint, not a full readiness certificate. For native apps,
use the platform inspector described in `references/platform-patterns.md`.

Record:

- exposed landmarks, windows, dialogs, and focused element;
- actionable nodes with role, name, state, value, actions, and bounds;
- unnamed or ambiguous actionable nodes;
- duplicate or nested `main` landmarks within the same document/application;
- controls visible on screen but absent from the tree;
- stale, duplicated, or host/renderer mirror nodes;
- whether names and state change correctly after interaction.

Distinguish an unavailable or partial observation from an empty UI. A provider
failure, permission denial, omitted iframe, or inactive AX subsystem does not
prove absent semantics. Inventory discovery is not guaranteed to enumerate
every user tab. Capture native and browser surfaces separately where needed.

### 3. Repair semantics at the source

Prefer this order:

```text
native framework control
  -> project design-system primitive with a tested semantic contract
  -> custom control implementing the platform accessibility API
  -> semantic representation for a custom-rendered domain surface
```

For every user-operable control, expose:

- correct role or control type;
- useful accessible name, matching the visible label where one exists;
- state and value (`checked`, `selected`, `expanded`, `pressed`, `busy`,
  `disabled`, validation state, current item, range value);
- supported actions and keyboard behavior;
- relationships (`labelledby`, `describedby`, owner, parent, controls);
- focus ownership and focus restoration;
- a stable business identifier when the framework supports one.

Read `references/developer-checklist.md` for the detailed requirement matrix.
Read `references/platform-patterns.md` for framework-specific implementation
patterns.

### 4. Make workflows discoverable, not merely clickable

Ensure:

- web documents have a clear primary `main`; evaluate embedded documents and
  nested application roots separately, and do not impose HTML landmarks on
  native windows;
- nested pages use named regions, not additional `main` landmarks;
- neighboring actions with the same visible verb are disambiguated;
- tabs, navigation, selections, disclosures, and toggles expose current state;
- menus expose their items only through the real open state;
- dialogs are named, modal when appropriate, focus-trapped, and restorable;
- drag-only workflows have keyboard or command alternatives;
- virtualized lists expose the visible rows, position/count context, and stable
  selection without hiding actionable descendants;
- sensitive fields expose their role without leaking secrets.

### 5. Add Computer Use-specific guarantees

Design each action so an agent can:

1. observe a unique target;
2. invoke an action addressed to that semantic target;
3. re-observe fresh state;
4. verify an action-specific effect.

Do not accept transport success alone. Verify expected changes such as focus,
selection, value, dialog/window creation, row count, persisted data, or a
business-domain oracle.

Fail closed when the target is missing, duplicated, stale, disabled, obscured,
or unverifiable. Do not silently fall back from a failed semantic action to an
old coordinate.

Separate stable domain identity from runtime node IDs and snapshot indexes.
After navigation, row recycling, reload, or window replacement, resolve again.
AX grounding does not prove AXPress delivery: the client may use native actions,
CDP input, DOM operations, or PID-scoped events. Verify the path the supported
client actually uses; a transport ACK or `isTrusted` flag is not a business
effect. Do not require the app to reimplement the runtime's revision protocol.

For hybrid surfaces, text input, transient failures, or replay tests, read
`references/consumer-contract.md`. It contains the ownership boundaries,
failure cases, and a concrete observe/act/verify example.

### 6. Protect performance and loading behavior

Do not add a production DOM/AX walker, global `MutationObserver`, timer, polling
loop, OCR model, or accessibility dependency merely to "improve semantics."

Prefer native attributes and framework APIs that are already part of rendering.
Keep expensive tree traversal in tests and developer tooling.

Preserve lazy loading. Opening one page must not import every settings panel,
inspector, or accessibility fixture.

Avoid both extremes:

- enormous trees full of decorative nodes;
- aggressive pruning that removes actionable or state-bearing descendants.

### 7. Verify in layers

Use all applicable layers:

1. Existing framework-aware source checks for unnamed controls, generic clickable elements,
   invalid ARIA/UIA contracts, positive tab order, and untranslated labels.
2. Component tests for role/name/state/value and keyboard behavior.
3. Story/state catalog that opens interaction-driven final states.
4. Real runtime tree audit across all routes and responsive breakpoints.
5. End-to-end semantic actions with fresh observation and effect verification.
6. Native inspector spot checks on each supported operating system.
7. Packaged-app smoke when packaging, signing, sandboxing, or process
   boundaries can alter accessibility.

Read `references/verification.md` for the coverage matrix and completion gate.
Choose tests by blast radius. Do not introduce a new regex gate where the
project deliberately removed one. A broad readiness audit requires broad
coverage; a single-control repair does not require auditing the entire product.

Read `references/evidence-and-ecosystem.md` when choosing interoperability
tests or reviewing the public-source rationale. Its dated findings are
design inputs, not dependencies on any particular CU runtime.

## Deliverables

For a read-only audit, report measured coverage, defects with evidence, and
unverified areas. Audit completion does not mean the product passed readiness.
Do not edit source/tests or perform state-changing actions to satisfy a repair
gate. Use existing evidence or explicitly authorized probes.

For an authorized repair, leave:

- a source and runtime coverage inventory;
- root-cause fixes in shared primitives or owning pages;
- focused tests that fail on the original semantic defect;
- a runtime accessibility-tree audit;
- documentation of unsupported custom-rendered areas and residual risk;
- an explicit performance statement covering dependencies, observers, polling,
  bundle loading, and tree size.

Do not report full coverage beyond the measured source-defined and runtime
states.
