# Consumer Contract and Regression Cases

Use this when the app spans rendering backends, when a tree looks correct but
actions fail, or when building reusable workflow tests. These are engineering
acceptance criteria, not a claim that every CU runtime enforces them.

## Ownership

| Layer | Owns | Check without expanding scope |
|---|---|---|
| Application | Role, name, state, value, relationships, focus, actions, domain meaning | Fix the owning component and authoritative state |
| Platform bridge | DOM/ARIA to Chromium AX; framework to macOS AX/UIA/AT-SPI | Inspect the emitted runtime tree |
| CU observation client | Filtering, node indexes, revisions, scope, partial results | Check what the actual client sees, not only the raw tree |
| CU executor | Refetch, action routing, input delivery, settling, permissions | Run the supported client path and record limits |
| Test harness | Fixtures, effect oracle, retry reconciliation, safe traces | Assert workflow outcomes independently of transport ACKs |

Do not add a production observer or private command server just to compensate
for a test client that cannot read existing semantics. Conversely, a named
control is not sufficient if it cannot be reached or acted on by the intended
client. Report which layer owns the remaining gap.

## Observation and identity

Record available scope explicitly:

```text
native: app identity + PID/process lifetime + window identity
browser: provider + context/tab + frame/document lifetime
target: role/name/state + scoped domain identity + current runtime reference
observation: time/revision if supplied + covered surfaces + errors/omissions
```

These are conceptual fields, not a required new wire schema. Do not invent
revision tokens or process generations when the client does not expose them.

- Accessible names describe controls; localized names are not durable IDs.
- A domain ID preserves meaning across reflow, but does not authorize acting
  on an old node reference.
- DOM node IDs, AX element indexes, and UIA runtime IDs have backend-specific
  lifetimes. Re-resolve after navigation, remount, virtualization, or window
  replacement. Test that a recycled row does not target the previous object.
- Same-named controls can be valid under distinct labeled rows or regions.
  Test scoped resolution with the intended client before lengthening every name.
- Missing frame coverage and inventory failures are incomplete observations.
  Do not turn them into empty successful snapshots or silent coordinate input.

## Actions and input

Treat these as separate questions:

1. How was the target identified?
2. Which backend delivered the action?
3. Which authoritative state proves the intended effect?

A role/name locator can eventually dispatch pointer input. Browser value
replacement may use a DOM operation while typing uses an input protocol. Native
AX grounding can feed PID-scoped input. Do not label all of these `AXPress`.

For text fields, test the app's controlled state, input/change/blur/submit
behavior, and relevant IME/composition cases. Direct `.value` assignment can
leave framework or persisted state unchanged. An event's `isTrusted` flag is
diagnostic evidence, not the success oracle.

For synthetic keyboard input, establish the exact receiving window and element
at dispatch. If the mechanism relies on foreground input, verify foreground
ownership too. Do not impose global foreground activation on a backend proven
to deliver scoped input safely; do not infer safe scoped input from a PID alone.

For spatial controls, use current geometry bound to the current target and
scope, then verify the domain effect. A failed semantic lookup does not
authorize replaying an old point.

## Bounded recovery

After a timeout or lost response, the effect is unknown. A rejected promise
does not prove the underlying operation was cancelled.

Re-observe and reconcile the specific effect before retrying. For a
non-idempotent action such as create/delete/submit, stop if the result cannot
be established. Do not issue duplicate mutations to discover what happened.
Absence of an effect in one snapshot does not prove failure or prevent a late
commit. Require a known terminal outcome or existing idempotency protection
before retrying. Do not infer idempotency from an action's name, including Save.
Where the application already has operation IDs or idempotency support, use
that evidence in the test oracle without creating a new API for this skill.

Stop a diagnostic probe when ownership is ambiguous, the user changes the
active target, permission is denied, or evidence is unavailable. Report the
boundary instead of disabling runtime checks.

## Worked example

Constructed test scenario, not a captured Codex trace:

```text
Observation
  Settings document, current runtime snapshot
  textbox "Project name", value "Draft"
  button "Save", enabled

Action
  Resolve the textbox within Settings; replace with "Demo"

New observation
  textbox value "Demo"; controlled app state also "Demo"

Action
  Re-resolve Save; activate through the supported client

Verification
  Busy state clears; after the defined commit completes, an independent
  persistence read returns "Demo". A fresh instance without the prior
  in-memory state still loads "Demo"

Done
  The UI state and persistence oracle agree; transport success alone
  would not satisfy the test
```

Keep the independent oracle in tests. Do not expose test-only datastore access
as a hidden agent control surface in the application.

## Choose regression cases by risk

| Case | Required observation or outcome |
|---|---|
| Two same-named rows | Scoped locator selects exactly the intended row |
| Virtual row recycled | Old reference cannot silently change a different record |
| Navigation/reload | New document observed before a new action |
| Modal over editor | Modal owns interaction; background input is prevented |
| Multiple windows/tabs | No implicit last-window/page selection |
| Provider enumeration fails | Incomplete/unavailable is visible, not an empty UI |
| Controlled input | Rendered, application, and persisted values agree |
| Timeout with delayed effect | Reconcile to a known terminal outcome or use existing idempotency; otherwise stop |
| Layout/scale/scroll changes | Refresh target and geometry |
| User moves focus | No text delivered to an unverified recipient |

## Reusable traces

When regression capture is requested or already exists, store semantic intent,
target scope, relevant preconditions, action, expected effect, and observed
outcome. Replays must freshly resolve targets. Do not persist runtime indexes
or coordinates as durable selectors.

Use synthetic records and minimal, redacted diagnostics. Screenshots, trees,
typed text, account names, and URLs may contain private data. Do not enable
background Computer History or record real user sessions as part of an AX fix.
