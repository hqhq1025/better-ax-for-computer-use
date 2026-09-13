# Component and Workflow Contracts

Use this when designing or repairing an application's controls. Select rows
matching the requested component; do not impose the entire matrix on every
change. For existing UI, trace the shared primitive and affected call sites.
For new UI, define expected state transitions before choosing markup.

## One State and Command Path

Visible UI, accessible properties and user actions should derive from the same
application state. A semantic representation for custom rendering is valid
when it uses that state and invokes the same guarded commands. An off-screen
copy with independent values or automation-only mutations is not.

Describe the component in ordinary project terms:

```text
object and context
  + state / allowed actions
  + focus and input behavior
  + expected transition or error
  + observation that demonstrates the result
```

This is a design aid, not a new runtime schema, ID system or production observer.

## Select the Affected Contract

| Component | Expose from actual state | Implement and test |
|---|---|---|
| Action or navigation | Name containing visible wording, correct button/link semantics, availability | Native activation, deliberate form behavior, real command guard or navigation |
| Toggle or choice | Applicable checked/pressed/selected state and group/object context | State changes through the supported input path; no decorative-only toggles |
| Field | Persistent label, current value, applicable editability, help and validation relationships | Focus, editing, framework state, validation and relevant submit/commit behavior |
| Composite widget | Owner, popup state, active item and selected value as distinct concepts | Pattern-appropriate arrows, commit, cancel and focus; don't invent a grid for a reading table |
| Dialog or sheet | Name, actual modality, owning context and actions | Initial focus, background isolation only when modal, dismissal and sensible focus return |
| Document or panel | Useful title, headings, structure and current selection | Navigation and content agree; evaluate document/application scopes separately |
| Collection | Row/object context, selection, hierarchy and available position/count information | Sorting/filtering/recycling cannot silently redirect an operation to another object |
| Async command | Pending, committed or error state and useful recovery | Success follows the actual commit; a timeout remains unknown until reconciled |
| Spatial/custom surface | Task-relevant objects, selection, bounds and actions | Shared model, keyboard/command alternatives where appropriate, current geometry and verified effect |

Read [Web AX/DOM](web-ax-dom.md) for browser-specific implementation traps or
[Platform patterns](platform-patterns.md) for native APIs. A correct role alone
does not add keyboard behavior, editable state or a supported native action.

## Identity and Context

Keep these purposes distinct:

| Identity | Purpose | Cannot establish |
|---|---|---|
| Visible/accessibility label | Human meaning, localized with the UI | Durable global identity or authorization |
| Domain object key | Which record/document the operation concerns | Validity of an old node handle |
| DOM ID or platform identifier | Relationships or supported application lookup | Automatic inclusion in every consumer's output |
| Runtime ref/index/token | Address a currently observed target | Stable identity across arbitrary navigation or replacement |

Use named rows/regions to distinguish repeated actions before lengthening every
label. Test how the supported consumer preserves that context. Avoid UUIDs,
implementation details and instructions embedded in accessible names.

For virtual lists, expose mounted relevant items and honest position/count
context; keep active items represented. Do not mount an entire hidden duplicate
list to satisfy a client. Include a sort, filter or recycled-row test when the
repair touches collection identity.

## Input and Feedback

An input's rendered value, framework state and persisted value can disagree.
Check the layers relevant to the task. A component that only edits a local draft
does not need an invented backend persistence test.

Choose keyboard, pointer, paste, composition or assistive actions from the
product's supported behavior. A synthetic replacement is not proof of IME,
undo or rich-text correctness. Keep focus, active descendant and selection
distinct in composite controls.

Busy, disabled, read-only, hidden and modal states have different behavior.
Keep state declarations and actual command guards consistent. Do not disable
every covered surface, trap focus in ordinary popovers, or steal focus on every
validation update.

Make meaningful outcomes readable through visible and accessible state. Avoid
per-keystroke announcements and success messages that precede persistence.
History-specific notification and attribution checks belong in
[History readiness](history-readiness.md), not in every form repair.

## Human Usability, Cost and Privacy

- Keep localized labels useful after truncation and layout changes. Include
  long labels, CJK or RTL only where supported by the product.
- Keep hit regions aligned with visible controls. A screenshot consumer needs
  visible context; an accessibility-only label may not change its observation.
- Remove duplicated or decorative semantic noise without discarding useful
  reading content or actionable descendants to meet a client's token budget.
- Keep lazy loading and the existing state lifecycle. Measure large-state tree
  or latency changes when relevant; don't add production traversal for ordinary
  native controls.
- Preserve secure-field semantics. Do not copy values into labels, URLs,
  diagnostics or hidden mirrors to improve observability.
- Do not redesign the app's permission system as an incidental repair. Existing
  permission and validation checks must also apply to accessibility actions.

For acceptance and report wording, use [Verification](verification.md).
For reference freshness, delivery and retries, use
[Consumer contract](consumer-contract.md); those are not guarantees that an
application obtains just by exposing correct ARIA.
