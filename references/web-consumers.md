# Match the Actual Computer Use Consumer

Use this guide when an application must work with a named Computer Use client,
especially TryCua or Codex. Apply only the relevant path; a product name alone
does not specify its model input, observation backend, or action mechanism.

## Establish the Contract

Record the deployed app and client versions, model/adapter, OS, browser channel,
permissions, and the selected surface. Trace one actual workflow through:

```text
app state
  -> pixels / DOM semantics / browser AX / native accessibility
  -> consumer filtering, scope, serialization and history budget
  -> model-visible observation
  -> target resolution and action delivery
  -> fresh observation and business effect
```

Inspect the payload supplied to the model, using synthetic or already-authorized
evidence. A tree endpoint existing in an SDK does not prove the agent calls it.
A correct raw AX tree does not prove the client keeps every property or node.
Treat unavailable permissions, unsupported platforms and truncated observations
as explicit coverage limits.

| Active path | Application-side requirements | Consumer-side checks |
|---|---|---|
| Screenshot and coordinate actions | Legible visible labels, stable layout, clear state, unobscured targets, visible errors/results | Image crop/scale, display/frame origin, coordinate mapping and fresh screenshot |
| Browser AX with indexed actions | Correct computed names, native states, real keyboard/actions, document and object context | Property projection, frame/shadow coverage, revision freshness and supported setters |
| DOM role/label locators | Native/ARIA contract, associated labels, actual interaction and commit | Locator algorithm, open/closed shadow scope, frames and method-specific actionability |
| Native AX/UIA/AT-SPI | Framework semantics, names, values, relationships, bounds and actual platform actions | OS implementation, permissions, bounds/coordinate units and tree budgets |
| Activity history | Useful document identity, focus/selection, observable outcomes and privacy | Event capture, source attribution, missing intervals and retention; not inferred from CU success |

Keep native semantics even when the selected screenshot adapter does not consume
them. Conversely, an ARIA-only name on an otherwise invisible icon does not give
a screenshot-only model visible wording. Use established visible labels or
discoverable tooltips where the product needs them, without introducing an
agent-only overlay.

## Browser AX Is an Intermediate Representation

Test the consumer projection separately from raw CDP or a DOM locator:

- Which role/name/value/state/relationship fields survive?
- Are active-descendant, read-only, selected and expanded states distinguishable?
- Are closed-shadow content, embedded documents and OOPIFs included?
- Are bounds, frame ownership and runtime identifiers sufficient for actions?
- Does sensitive-field redaction remove value or explanatory text?
- Is output a full snapshot or a diff against an earlier revision?

These are questions to measure, not promised capabilities of every client.
If correct `aria-activedescendant` or other semantics are omitted downstream,
retain them for assistive technology. Verify the actual keyboard flow and
committed selection; report the projection gap instead of replacing the
attribute with instructions in an accessible name.

Arbitrary `data-agent-*` metadata, React keys and test IDs are not automatically
part of browser or native AX. Use supported identity and relationships from the
same application state. Do not add hidden JSON mirrors, duplicate semantic trees,
or per-client selectors merely because a consumer loses context.

## TryCua: Choose the Implementation, Not Just the Name

Source review dated 2026-09-13, pinned to
`31c2184f860bac1fd7df42a75c47053ce3be48f9`. This is a static source audit,
not a live cross-platform interoperability test.

| Implementation | Actual observation contract | Consequence |
|---|---|---|
| Python `ComputerAgent` standard computer round | Action followed by screenshot as `input_image` | AX is not automatically attached; custom tools can add other context [T1] |
| Python Playwright `BrowserTool` | Screenshot, URL, coordinate mouse and keyboard commands | Using Playwright does not imply DOM role/name observations [T2] |
| Python native tree API | macOS AX; Linux simulated empty tree; Windows HWND child enumeration | Do not claim all OS implementations deliver equivalent AX/UIA; Python driver compatibility handler rejects this query [T3] |
| Rust driver native macOS | `get_window_state` supplies screenshot, `tree_markdown` and addressable `elements` | Discovery `get_accessibility_tree` is not the full window tree; keep reading content as well as actions [T4] |
| Rust browser `dom_refs_v1`, default | DOM-order refs with selected attributes as labels | Does not compute the accessible name or resolve `label`/`aria-labelledby` [T5] |
| Rust browser `semantic_v2`, explicit | Browser AX + DOM + layout/frame composition | Inspect `structuredContent`, coverage, ref actions and actual host forwarding [T6] |

The Python trace hook that records an accessibility tree is distinct from the
standard screenshot observation. Don't use a trace file as proof that the
decision-making model saw AX. [T1]

For Rust browser semantic interoperability:

- Confirm `snapshot_format="semantic_v2"` in the existing authorized integration.
  The default `dom_refs_v1` reads attributes such as `aria-label`, placeholder,
  id and value, not computed name or button inner text. Do not compensate by
  adding redundant ARIA overrides throughout an already-correct application. [T5]
- Confirm the host forwards `structuredContent.outline`, `refs`, `content_refs`
  and coverage metadata. The text `content` is only a count summary; tool
  availability alone cannot establish model-visible semantics. [T6]
- The state whitelist is checked, disabled, editable, expanded, focused,
  focusable, pressed, required and selected. Description, invalid, read-only,
  live and relationship fields are not all independently preserved. Retain
  correct application semantics and test what arrives downstream. [T7]
- The default page budget is 300 selected candidates, with ancestor context
  retained in the outline. Inspect `complete`, `omitted`, OOPIF status and
  `continuation`; scoped/query results aren't full-page coverage. Unmounted
  virtual rows cannot be recovered merely by pagination. [T6, T7]
- Action refs and content refs serve different purposes. Respect the actions
  granted to a ref, and reacquire after a new snapshot or navigation. Browser
  ref clicks can still resolve to box-center CDP pointer events; semantic
  targeting does not establish hit success or a committed effect. [T8]
- Typed-browser binding and delivery restrictions remain runtime constraints,
  not DOM defects. Verify the supported Chromium/Electron target and platform;
  don't infer this path's support from Python BrowserTool's Firefox use. [T9]

For native macOS driver checks, actual AX actions or supported writable values
determine addressable rows. The reviewed walker defaults to 2000 visited nodes
and depth 25; static text can exist in `tree_markdown` without an addressable
entry in `elements`. Improve genuine hierarchy and remove duplicate semantics,
not useful document content just to fit a budget. [T4]

## Codex Product Boundaries

The public documentation reviewed on 2026-09-13 distinguishes desktop Computer
Use, the built-in browser, connected browser extensions, and a separate cloud
browser. Record which one is under test. A public Responses API computer tool
example does not specify the desktop browser implementation. [C1, C2]

Browser permission and full-CDP developer permission are separate. The built-in
browser uses a separate profile; existing user-browser access is a different
surface. Do not enable developer mode, import a profile, or request broader
access as an incidental accessibility repair. [C2]

Public product documentation does not specify an exhaustive AX serialization,
field allowlist, index lifetime, or custom-widget setter contract. Measure these
on the authorized deployed client and record the evidence level. Do not present
a local static implementation finding as a cross-version product guarantee.

For indexed semantic browser actions, distinguish:

- native inputs/selects from custom ARIA widgets;
- replace-value operations from typing, paste, composition and submission;
- editable plain text from a rich editor's structured model;
- target discovery from native AX actions, CDP input or DOM activation.

Test the application's supported action path. A generic set-value operation may
not exist for a custom combobox, multi-select or rich editor even when the tree
is correct. Use the widget's real keyboard/pointer contract; do not add a hidden
setter or flatten rich content to make a generic operation work.

## Focused Acceptance Scenarios

Choose scenarios from the supported product flow:

1. Find the named object, not merely the first matching control; act after
   filtering/remount and confirm the correct object changed.
2. Observe a custom combobox before opening, while navigating its popup, and
   after committing. Separate focus, active option and selected value.
3. Compare native input replacement with typing and submit. Check framework
   state and stored value, not only rendered text.
4. Repeat the relevant action while loading, covered, disabled or read-only.
   Establish which layer blocked it; transport success is not permission or
   business success.
5. Check the same workflow through required frame/shadow and native boundaries.
   Missing coverage stays explicit; don't bypass those boundaries to pass.
6. For visual clients, verify current geometry and visible outcome. For semantic
   clients, also inspect the projected observation. Neither substitutes for the
   other's evidence.

Use [web-ax-dom.md](web-ax-dom.md) for application repairs and
[consumer-contract.md](consumer-contract.md) for unknown outcomes and retry.
History-specific acceptance belongs in
[history-readiness.md](history-readiness.md); action traces do not certify
passive activity reconstruction.

## Sources and Evidence

- C1: [Official Computer Use documentation](https://developers.openai.com/codex/computer-use).
- C2: [Official Browser documentation](https://developers.openai.com/codex/browser).
- T1: [Python action and screenshot round](https://github.com/trycua/cua/blob/31c2184f860bac1fd7df42a75c47053ce3be48f9/libs/python/agent/cua_agent/agent.py#L752-L837)
  and [separate AX tracing](https://github.com/trycua/cua/blob/31c2184f860bac1fd7df42a75c47053ce3be48f9/libs/python/computer/computer/tracing.py#L356-L366).
- T2: [Python BrowserTool](https://github.com/trycua/cua/blob/31c2184f860bac1fd7df42a75c47053ce3be48f9/libs/python/agent/cua_agent/tools/browser_tool.py#L332-L506)
  and [browser command dispatcher](https://github.com/trycua/cua/blob/31c2184f860bac1fd7df42a75c47053ce3be48f9/libs/python/computer-server/computer_server/browser.py#L160-L219).
- T3: Python server handlers:
  [macOS](https://github.com/trycua/cua/blob/31c2184f860bac1fd7df42a75c47053ce3be48f9/libs/python/computer-server/computer_server/handlers/macos.py#L229-L547),
  [Linux](https://github.com/trycua/cua/blob/31c2184f860bac1fd7df42a75c47053ce3be48f9/libs/python/computer-server/computer_server/handlers/linux.py#L41-L63),
  [Windows](https://github.com/trycua/cua/blob/31c2184f860bac1fd7df42a75c47053ce3be48f9/libs/python/computer-server/computer_server/handlers/windows.py#L76-L142),
  [driver compatibility handler](https://github.com/trycua/cua/blob/31c2184f860bac1fd7df42a75c47053ce3be48f9/libs/python/computer-server/computer_server/handlers/cua_driver.py#L30-L50).
- T4: [Native window payload](https://github.com/trycua/cua/blob/31c2184f860bac1fd7df42a75c47053ce3be48f9/libs/cua-driver/rust/crates/platform-macos/src/tools/get_window_state.rs#L833-L945),
  [AX walker](https://github.com/trycua/cua/blob/31c2184f860bac1fd7df42a75c47053ce3be48f9/libs/cua-driver/rust/crates/platform-macos/src/ax/tree.rs),
  [lightweight discovery](https://github.com/trycua/cua/blob/31c2184f860bac1fd7df42a75c47053ce3be48f9/libs/cua-driver/rust/crates/platform-macos/src/tools/get_accessibility_tree.rs).
- T5: [v1 DOM collector](https://github.com/trycua/cua/blob/31c2184f860bac1fd7df42a75c47053ce3be48f9/libs/cua-driver/rust/crates/cua-driver-core/src/browser/engine.rs#L2768-L2880).
- T6: [Snapshot selection and structured payload](https://github.com/trycua/cua/blob/31c2184f860bac1fd7df42a75c47053ce3be48f9/libs/cua-driver/rust/crates/cua-driver-core/src/browser/tools.rs#L349-L440)
  and [ToolResult serialization](https://github.com/trycua/cua/blob/31c2184f860bac1fd7df42a75c47053ce3be48f9/libs/cua-driver/rust/crates/cua-driver-core/src/protocol.rs#L297-L329).
- T7: [Semantic composition, filters and state whitelist](https://github.com/trycua/cua/blob/31c2184f860bac1fd7df42a75c47053ce3be48f9/libs/cua-driver/rust/crates/cua-driver-core/src/browser/semantic.rs).
- T8: [Browser ref actions](https://github.com/trycua/cua/blob/31c2184f860bac1fd7df42a75c47053ce3be48f9/libs/cua-driver/rust/crates/cua-driver-core/src/browser/tools.rs#L951-L1288)
  and [snapshot store](https://github.com/trycua/cua/blob/31c2184f860bac1fd7df42a75c47053ce3be48f9/libs/cua-driver/rust/crates/cua-driver-core/src/browser/store.rs).
- T9: [Browser binding and background delivery](https://github.com/trycua/cua/blob/31c2184f860bac1fd7df42a75c47053ce3be48f9/docs/content/docs/concepts/browser-targeting-and-background-delivery.mdx).

This guide includes no proprietary runtime code or prompts. Its application
requirements are engineering guidance; interoperability claims require measured
client/version evidence.
