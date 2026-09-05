# Developer Checklist

Use this as the detailed implementation and review matrix.

## 1. Window and document structure

- Expose the application, exact window, title, and modal relationship.
- Prefer one primary `main` in each web document/application scope; count
  nested documents separately. Use native window semantics for native apps.
- Use named regions for nested pages, inspectors, sidebars, and work areas.
- Give each page/dialog/window a distinct name.
- Preserve a useful heading hierarchy.
- Mark decorative content as decorative instead of giving it noisy names.
- Keep hidden or inert application surfaces out of the active tree.

## 2. Controls

For every action:

- Use a native button, link, checkbox, radio, switch, slider, tab, menu item,
  text field, or equivalent platform control type.
- Do not make a generic `div`, `span`, Canvas object, or image the only action
  target without implementing the full accessibility contract.
- Provide a non-empty accessible name.
- Keep the visible label inside the accessible name.
- Disambiguate repeated names through a named row/group or a useful object
  label, such as `Delete report.pdf`. Global name uniqueness is not required
  when the real client can resolve the row and its action unambiguously.
- Expose disabled and busy states.
- Expose pressed, checked, selected, current, and expanded state.
- Expose values and min/max/step for range controls.
- Expose the real semantic action; do not rely on pointer coordinates.
- Keep hit target and semantic target aligned.

## 3. Forms and text input

- Associate every field with a persistent label.
- Use placeholder text only as an example, never as the sole label.
- Connect help, limits, and errors with the field.
- Expose required, invalid, read-only, disabled, and busy states.
- Move focus to the invalid field or error summary on failed submission.
- Announce asynchronous validation without repeatedly interrupting the user.
- Preserve secure/password semantics; never expose the secret as a value.
- Before synthetic typing, make focused-window and focused-element ownership
  provable.

## 4. Navigation, tabs, lists, and selection

- Expose current navigation item (`aria-current` or platform equivalent).
- Expose selected tab/option/tree item.
- Use roving focus or the framework's native composite-control behavior.
- Support arrow, Home/End, Enter/Space, and Escape where the platform pattern
  expects them.
- Expose list/tree/grid hierarchy, level, position, and count where useful.
- Keep row selection separate from row actions.
- Provide names for trailing row actions.
- Give drag-and-drop a keyboard or command alternative.

## 5. Dialogs, sheets, popovers, and menus

- Name every dialog.
- Mark modal dialogs as modal.
- Move focus into the dialog deterministically.
- Trap focus only while modal.
- Restore focus to the opener on close.
- Expose close/cancel/confirm actions with task-specific names.
- Open a parent menu before expecting its child items to exist.
- Keep background windows and hidden overlays inert.
- Test attached sheets and secondary windows as distinct routing cases.

## 6. Dynamic state

- Announce meaningful loading, success, failure, and completion state.
- Use live regions/status events sparingly; do not announce every animation or
  token.
- Keep a pending action's accessible name stable; publish busy state separately.
- Update state/value after action completion.
- Preserve semantic identity across harmless layout reflow.
- Invalidate identity when the underlying object, process generation, or window
  changes.
- Do not let stale hidden nodes remain actionable.

## 7. Custom-rendered surfaces

For Canvas, WebGL, game scenes, diagrams, timelines, editors, or QML/custom
rendering:

- Expose a semantic object model separate from pixels.
- Give objects stable domain IDs.
- Expose role, name, state, value, actions, hierarchy, and fresh bounds.
- Expose selection and focus.
- Provide semantic commands for non-spatial operations.
- Derive geometry from current state only when an action is inherently spatial.
- Verify object mutation after action.
- Do not hard-code screen coordinates.

## 8. Virtualization

- Keep visible actionable rows in the tree.
- Expose total count and visible position where possible.
- Keep active selection and focused item mounted or represented.
- Do not recycle a semantic ID onto a different business object.
- Re-observe after scroll or recycling.
- Test first, middle, last, empty, loading, and large datasets.

## 9. Internationalization

- Localize accessibility-only strings with visible UI strings.
- Do not allow framework English fallbacks in a localized interface.
- Keep names meaningful after translation and truncation.
- Do not include hidden status text that changes the control's identity.
- Test long labels, CJK, RTL where supported, and mixed technical identifiers.

## 10. Computer Use action contract

For each critical workflow, define:

| Step | Requirement |
|---|---|
| Observe | Unique target in the exact window |
| Resolve | Current runtime reference, stable domain meaning, exact scope |
| Act | Semantic action preferred |
| Verify | Action-specific state or business effect |
| Retry | Re-observe and reconcile effects first; never blindly repeat a timeout |
| Fail | Missing/ambiguous/stale/unverifiable, never guess |

Runtime indexes are observation-local; domain IDs are not runtime action
handles. A changed row object must not inherit the previous row's identity.
Fail-closed resolution is a client/runtime property to validate, not something
ARIA alone can guarantee. Do not claim it from a source-only semantics fix.

Critical actions include create, edit, save, delete, submit, connect, install,
enable/disable, choose model/account, open/close modal, and navigation.

## 11. Performance

- No production full-tree scan to synthesize basic semantics.
- No global observer that watches every DOM mutation.
- No high-frequency accessibility polling.
- No eager import of every page merely for accessibility.
- No duplicated hidden "agent UI."
- Keep decoration out of the tree.
- Keep actionable and state-bearing descendants in the tree.
- Measure tree size and observation latency on large real states.

## 12. Privacy and safety

- Do not log raw accessibility values, typed text, passwords, window titles, or
  screenshots by default.
- Sanitize test artifacts and CI traces.
- Treat accessibility permission as a capability gate, not authorization for
  every action.
- Separate metadata reads, screenshots, pointer actions, text actions, and
  sensitive mutations in the product permission model.
- Require explicit confirmation for destructive or security-sensitive actions.
