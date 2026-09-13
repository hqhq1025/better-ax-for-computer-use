# Web AX and DOM for Computer Use

Use this guide for source-modifiable websites, web apps, and Electron renderers.
For a narrow repair, read only the affected sections. This is a repair and
verification workflow, not a browser-control API or a universal DOM extractor.

## Diagnose the Layer Before Repairing

```text
authoritative app state + DOM + styles + focus
  -> browser-computed accessibility tree
  -> platform bridge / consumer filtering and references
  -> target resolution
  -> executor-specific action checks and input delivery
  -> application commit and observable result
```

DOM-based role locators form a separate observation path: they compute semantics
from DOM and need not reproduce the browser's AX tree. A passing role locator
is useful evidence, not proof of native AX exposure.

For named-client interoperability, use [web-consumers.md](web-consumers.md)
to distinguish screenshot adapters, DOM tools, browser AX projections and
native tree APIs before deciding which application changes will help.

| Symptom | Inspect first | Repair or next check |
|---|---|---|
| Visible Save cannot be found by name | Computed name and its sources, not just `textContent` | Remove conflicting label override; retain visible wording |
| CSS selector works, role locator fails | Native element, naming, document/shadow scope | Fix semantics or report unsupported consumer scope |
| Role locator matches, AX omits node | `ignoredReasons`, inert/hidden ancestors, actual frame | Resolve the divergence before changing accessibility markup |
| AX sees a control, DOM client cannot | Shadow-root mode, virtual/generated AX nodes, backend mapping | Test supported consumer path; do not label this an app omission |
| Button found but click blocked | Overlay, modal state, hit testing, disabled state | Fix actual interaction; do not force-click to pass |
| Click succeeds but nothing saves | Hydration, handler readiness, validation, commit | Fix state/action lifecycle and verify persistence |
| Wrong row changed after re-render | Business identity and locator scope | Re-resolve by object, not position or stale handle |

Use source inspection and targeted runtime queries to explain a defect before
adding attributes. Keep raw values, labels and screenshots out of public logs.

## Names, Descriptions, and Relationships

- Prefer intrinsic HTML semantics and associated visible labels. A `button`
  already has button behavior; `role="button"` on a `div` adds no keyboard or
  form behavior. Navigation uses a real link with `href`; actions use buttons
  with deliberate `type`, especially inside forms.
- Inspect the computed accessible name, description and contributing sources.
  `aria-labelledby` and `aria-label` can override visible content; don't assume
  adding a label combines it with existing text. Keep visible wording in the
  name, localize it, and put supplemental help/errors in descriptions.
- Referenced hidden text may contribute to name/description even when it has
  no exposed AX node. Neither `hidden` nor `aria-hidden` is secret storage.
- Prefer a scoped label such as row "Annual report" plus button "Delete".
  Global uniqueness is not required. If the actual consumer drops row context,
  improve useful object context or report that limitation; don't append UUIDs,
  CSS paths, implementation details, or agent instructions to names.
- IDs for labels, controls and error relationships must resolve in the intended
  tree scope. Duplicate IDs and cross-root references can silently bind the wrong
  object. Test computed relationships after conditional rendering and remount.
- Don't implement a private accessible-name algorithm in application code.
  AccName 1.1 is a Recommendation; the reviewed 1.2 draft changes some empty
  `labelledby` fallback behavior. Diagnose the actual computed result and record
  browser/tool versions instead of treating a draft as shipped behavior.
- Accessible names, DOM IDs, React keys, test IDs, AXNodeIds and domain IDs have
  different purposes. A test ID can select a fixture while a separate assertion
  checks semantics; selecting by test ID alone cannot demonstrate AX readiness.

CDP `AXValue.sources`, `relatedNodes`, `ignoredReasons` and `backendDOMNodeId`
help locate causes. Some AX nodes have no DOM counterpart. Use the current
session and owning document; never turn backend IDs into saved selectors. [S1]

## State Must Match Behavior

| State/mechanism | Application obligation |
|---|---|
| Native `disabled` | Use for applicable native controls; test keyboard, pointer and submit behavior |
| `aria-disabled` | Communicates state but does not itself prevent activation; guard the real command path |
| `readonly` / `aria-readonly` | Use only supported controls/roles; distinguish reading/selecting from editing |
| `aria-pressed`, `checked`, `selected` | Reflect actual state, not a decorative class or optimistic guess |
| `aria-expanded`, `aria-controls` | Match the actual disclosure/popup and its current relationship |
| `aria-busy` | Exposes pending updates; does not disable a control or prove hydration/commit |
| `aria-modal` | Describes modality; does not implement focus trapping or block the background |
| `inert` | Use for surfaces that genuinely cannot be interacted with; verify focus and browser AX |

Native `disabled` also has focus and form-submission consequences. Do not replace
it with ARIA simply to make a test pass. If a disabled command must remain
discoverable/focusable, use the established component contract and enforce
pointer, keyboard and programmatic command guards.

CSS opacity, viewport intersection, AX exposure, DOM role matching and pointer
actionability are distinct. An off-screen list item can remain legitimate AX
content; do not remove useful semantics merely to reduce snapshot tokens. [S2]

## Forms and Editing

Use native input/select/textarea and proven editor components. Test:

1. Persistent label, required/invalid/help/error association, and correct input
   type. A password can be located by its associated label even when the client's
   implicit role mapping does not match ordinary textboxes.
2. Rendered value, framework state, validation and serialization. Direct `.value`
   assignment or dispatched events are diagnostic tools, not proof of real input.
3. Relevant paste, undo, composition and commit behavior. `fill()` is not an IME
   test, and dispatching composition events is not a real OS input-method run.
4. Submit via the user's supported path, including keyboard where applicable.
   Distinguish native constraint validation preventing submission from a server
   error. Expose actionable error text without announcing on every keystroke.
   Keep `aria-errormessage` consistent with `aria-invalid` and current accessible
   error content; don't mark untouched required fields invalid solely for being
   empty. Choose focus movement as an error-recovery strategy, not on every update.
5. Pending, committed, failed and unknown results. Confirm the correct record
   through an independent domain oracle and fresh state when persistence matters.

Rich-text editors need meaningful editable regions, selection, toolbar state,
and mode-specific keyboard behavior. Plain text extraction loses formatting,
selection ranges and embedded objects. Test the editor's real model and commit
API through its normal UI; do not graft an unrelated off-screen text mirror.

If a page renders before event handlers are ready, make affected controls
honestly unavailable until functional, or preserve working progressive HTML.
`load`, `networkidle`, a fixed delay, and `aria-busy=false` alone do not establish
application readiness. Fast interaction during delayed hydration is a regression
case; do not hide the defect with larger sleeps. [S3]

## Composite Widgets and Layered UI

Use the existing accessible component library or the applicable APG pattern;
ARIA roles do not install a state machine. [S4]

- Combobox: distinguish editable text, active option, selected value and popup
  state. For an `aria-activedescendant` pattern, DOM focus remains on the owning
  input; the referenced option must exist in the valid relationship and be
  scrolled into view. Don't require focus on the option as well.
- List/table versus grid: keep native structures for reading data and ordinary
  row actions. Use grid/treegrid only when the interaction needs their managed
  keyboard behavior, focus and selection model.
- Virtualization: position/count attributes do not create unmounted nodes.
  Keep active items represented correctly, re-resolve after recycling, and test
  filtering, sorting and boundary rows. Unknown totals must remain unknown.
- Dialog: prefer native `showModal()` or a proven primitive. Merely setting
  `open` is not the same as modal behavior. Test initial focus, Escape/cancel,
  submit, and return to the opener or a sensible next target if it was removed.
- Popover/disclosure is not automatically a modal dialog or application menu.
  Choose roles and keyboard behavior from the actual interaction.
- Portals change DOM ancestry even when framework ownership stays the same.
  Locate the real open popup/dialog and assert relationships; don't assume a
  component-scoped descendant locator reaches portaled content. Avoid `aria-owns`
  as a generic repair for arbitrary DOM placement.

## Frames, Shadow DOM, and Custom Rendering

Inventory actual documents and surfaces, including cross-origin frames,
out-of-process iframes (OOPIF), open/closed shadow roots, portals and popups.
Record observed coverage separately from supported capture capability.

- A frame title names the embedded frame, not all its document controls.
  Enter the actual frame scope for actions and reacquire after navigation.
  Parent `activeElement` may identify the iframe rather than the inner input.
- Playwright locators generally pierce open shadow roots, but XPath does not;
  closed roots are not supported by those DOM locators. A closed root can still
  expose browser AX. Do not open closed roots just to satisfy one test tool. [S2]
- For web components, use native internals or supported `ElementInternals`
  semantics. A host's ARIA role does not automatically supply keyboard handling,
  focus, form value, validity, reset or state restoration. Verify the chosen
  browser's form-associated custom-element and relationship behavior. [S5]
  Explicit element-reference properties and string IDREF attributes have
  different scope/reflection rules: an empty attribute alone does not prove
  the relationship is absent. Inspect supported properties and computed output.
- A host and its inner input should not become two competing unnamed or
  duplicate controls. Inspect the composed focus path and browser AX output;
  verify labels rather than assuming ID references cross shadow boundaries.
- Root `getFullAXTree` does not certify all frame contents. Capture each required
  document through its supported session/backend, preserving scope; do not
  concatenate independent node-ID spaces and call that one tree. [S1]
- Canvas/WebGL should expose task-relevant objects, selection and commands from
  the same state as rendering, with real keyboard or in-app alternatives where
  appropriate. Browsers have no general web-author API to inject arbitrary CDP
  AX nodes. Use supported DOM/native accessibility mechanisms, not a private
  second app model. Keep genuinely spatial operations tied to current geometry.

No supported observation path is a coverage gap, not permission to bypass
browser security or secretly install another runtime.

## Verify the Actual Delivery Method

Playwright 1.57 documents different action checks: `click()` checks pointer event
receipt and stability; `fill()` does not perform those same checks; `press()`
and `dispatchEvent()` do not inherit the click gate. Thus a successful fill
behind an overlay cannot certify modal isolation or user-operable input. [S2]

Do not use `force`, DOM `click()`, synthetic event dispatch, or CSS removal to
make a failed readiness test pass. These can be controlled diagnostics: label
the bypass and still test the actual supported path separately.

Locators re-resolve on use, but an under-specified locator can resolve a new,
wrong business object. `.first()`/`.nth()` are not repairs for ambiguous target
identity. Recheck the object and scope after mutations and delayed work. [S2]

Observe again after delivery and assert the application-specific effect.
Transport ACK, focus movement, handler invocation and `isTrusted` are not
persistence or business success. Use [consumer-contract.md](consumer-contract.md)
for unknown outcomes and bounded retry.

## Practical Validation

Choose applicable checks, not a universal full-product gate:

| Layer | Evidence to keep |
|---|---|
| Source/component | Correct native/ARIA contract, reference resolution, shared state/action path |
| DOM consumer | Scoped role/label/state assertions; known frame/shadow omissions |
| Browser AX | Computed name/description/state/ignored reasons; owning document and fresh mapping |
| User interaction | Keyboard, pointer, overlay/focus and hydration behavior |
| Business outcome | Correct object changed and expected committed or failed state |
| Native/AT | Target platform and assistive technology where required by product scope |

For reading-heavy pages, verify useful headings, tables, lists and document
structure as well as controls. Do not gate only on the count of actionable nodes.

Run the included synthetic probes from a workspace that already has Playwright
and its browser:

```sh
node scripts/probe_web_contracts.mjs
# Explicit alternative when using an installed Chrome rather than bundled Chromium:
WEB_AX_CHANNEL=chrome node scripts/probe_web_contracts.mjs
```

The script creates only fresh isolated contexts and in-memory fixture pages.
It prints versions and individual outcomes; it does not read user tabs, store
screenshots/traces or record Computer History. It is opt-in and separate from
the dependency-free tests. Missing browser/dependency is an error, never a skip
reported as success. Probes demonstrate boundaries, not product conformance.

Measured on 2026-09-13 with Playwright 1.57.0 / Chrome 153.0.8010.36: a DOM role
locator matched an inert descendant while browser AX omitted it and focus was
blocked; a closed shadow button appeared in AX but not the DOM role locator.
These are version-qualified observations, not universal mappings.

If history quality is also requested, add [history-readiness.md](history-readiness.md).
Do not load or execute recording tests for an ordinary form or control repair.

## Primary Sources

Reviewed 2026-09-13. Recheck deployed versions; standards, browser implementations
and tools have distinct release timelines.

- [S1: CDP Accessibility](https://chromedevtools.github.io/devtools-protocol/tot/Accessibility/).
  Experimental, moving protocol; inspect actual browser support.
- [S2: Playwright 1.57 locators](https://github.com/microsoft/playwright/blob/v1.57.0/docs/src/locators.md)
  and [actionability](https://github.com/microsoft/playwright/blob/v1.57.0/docs/src/actionability.md).
  Version matches this research's installed Playwright, not a latest-release claim.
- [S3: Playwright 1.57 hydration](https://github.com/microsoft/playwright/blob/v1.57.0/docs/src/navigations.md#hydration).
- [S4: WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/patterns/),
  [ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/),
  [Accessible Name 1.1 Recommendation](https://www.w3.org/TR/accname-1.1/),
  [Accessible Name 1.2 Working Draft, 2026-08-27](https://www.w3.org/TR/2026/WD-accname-1.2-20260827/),
  [ARIA in HTML](https://www.w3.org/TR/html-aria/).
  APG is implementation guidance; check specification status and actual support.
- [S5: WHATWG custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html),
  [interaction/inert/focus](https://html.spec.whatwg.org/multipage/interaction.html),
  [dialog](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element).
  Also see [label association](https://html.spec.whatwg.org/multipage/forms.html#the-label-element)
  and [element-reference reflection](https://html.spec.whatwg.org/multipage/common-dom-interfaces.html#reflecting-content-attributes-in-idl-attributes).
