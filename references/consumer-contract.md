# Observation, Action and Outcome Boundaries

Use this when a correct-looking interface fails in a Computer Use workflow,
when targets can change, or when an operation's result is uncertain.
These are diagnostic and acceptance criteria, not claims that all clients
enforce the same protocol. For known implementations, consult
[Consumer profiles](web-consumers.md) and verify the deployed version.

## Trace the Actual Data

| Boundary | Ask | Inspect |
|---|---|---|
| Application to representation | Does the UI express the right object and state? | Rendering state, DOM/native semantics, focus, shared command |
| Representation to consumer | What was retained, omitted or transformed? | Pixels, DOM result, AX output, scope, redaction and completeness |
| Tool result to model | Did the model receive the useful payload? | Actual message/structured-result forwarding, not just tool availability |
| Observation to action | Is this still the intended object in the intended surface? | Current reference, scope, document/window lifetime, action support |
| Delivery to application | What actually arrived and where? | Native action, DOM operation, keyboard or coordinate event and recipient |
| Application to outcome | Was the promised effect committed or rejected? | State transition, error, persistence or other task-specific oracle |

Compare adjacent boundaries to locate the loss. If runtime access is unavailable,
use source evidence and mark the missing boundary; do not invent observations.
Correct app semantics plus a consumer omission may require zero app changes.

## Preserve Scope Without Inventing a Protocol

Record the scope fields the supported client actually provides:

```text
native: app + process lifetime + window
browser: provider/context + tab + frame/document
target: role/name/state + object context + current action reference
observation: available time/revision + covered surfaces + errors/omissions
```

Do not fabricate epochs or require apps to implement the runtime's revision
scheme. Backend IDs and tokens have backend-specific lifetimes. Re-resolve
after navigation, remount, row recycling or window replacement, and confirm
the business object as well as locator uniqueness.

Unavailable, empty, partial and privacy-suppressed are distinct observations.
Missing iframe content is not evidence that the document contains no controls.
A full snapshot and a diff have different baseline requirements.

If the target is ambiguous or stale, stop that mutation and obtain fresh
evidence. A failed semantic lookup does not authorize reuse of an old coordinate.
An inherently spatial task can use current target-bound geometry without
pretending it has a DOM or native action node.

## Test the Supported Input Method

Keep target identification separate from delivery. A semantic ref can result
in pointer input; replacement can use a native value setter or DOM operation;
typing may use another input protocol. None of these is universally AXPress.

For keyboard delivery, establish the actual receiving window and element.
Verify foreground ownership when the backend depends on it; do not impose
foreground activation on a verified scoped/background path. A PID alone is
not proof of correct focus routing.

For pointer delivery, check current geometry, display/frame mapping and
interference. For semantic actions, check actual supported actions and guards.
Method-specific success does not imply every pointer, keyboard or value-setter
path is valid. Keep bypasses such as forced clicks separate from acceptance.

An ACK, handler invocation, changed pixels or `isTrusted` flag can explain
delivery. None independently proves a persisted or business-domain result.
Test the component's real state and command path, including relevant editing,
validation and commit behavior.

## Reconcile Before Retry

A timeout or lost response leaves the outcome unknown. Promise rejection
does not establish cancellation; one unchanged snapshot does not exclude a
late commit.

Use fresh observation and an existing task-specific oracle to establish a
terminal result. Retry mutations only after confirmed non-application or under
verified existing idempotency protection. Do not infer idempotency from names
such as Save. If the result remains unknown, stop mutation retries and report
the missing evidence. Continue independent authorized work.

Stop a probe when target ownership changes unexpectedly, permission is denied
or the necessary observation is unavailable. Do not disable runtime checks
or widen permissions to make a readiness result pass.

## Worked Task

Constructed example, not a captured client trace:

| Step | Evidence |
|---|---|
| Observe | Settings for project Alpha; textbox "Name" contains "Draft" |
| Resolve and edit | Current field belongs to Alpha; supported editing changes its draft state to "Demo" |
| Submit | Re-resolved Save uses the application's guarded commit path |
| Observe result | Pending becomes committed, or an actual error is shown |
| Verify | Authorized test datastore/reload confirms Alpha is "Demo"; Beta is unchanged |
| Uncertain branch | Lost response with no terminal evidence remains unknown; no duplicate submit |

The independent oracle belongs in the test harness, not an agent-only production
API. Persistence is needed here because the task promised saving; a focus-only
task would have a different oracle.

When authorized traces already exist, reuse semantic intent, object scope,
preconditions and observed outcomes. Replays re-resolve targets; saved refs and
points are not durable selectors. Use synthetic or minimized redacted artifacts.
Record/replay is not permission to enable passive Computer History or retain
personal sessions.
