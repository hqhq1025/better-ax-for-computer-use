# Verify the Claim You Intend to Make

Choose evidence from the task and changed contract. A source repair, consumer
integration result and history-quality result are independent claims. Do not
collapse them into one readiness score or require every layer for a narrow fix.

## Define Comparable Baseline and Candidate

For an existing defect, preserve the failing object, initial state, action and
expected outcome. Change only the relevant implementation or explicitly scoped
configuration. For new components, define expected behavior first and test
both valid and invalid transitions.

A compact record can be a test or a table:

| Task and object | Initial/adverse state | Observation path | Action path | Expected result | Actual evidence / gap |
|---|---|---|---|---|---|
| Rename Alpha | ready, then delayed commit | specified DOM/AX/visual client | supported edit and submit | Alpha persisted, Beta unchanged | fill from executed checks |
| Open dialog | opener later removed | relevant DOM/native tree | keyboard activation and dismiss | correct focus entry and sensible return | fill from executed checks |

These are examples, not mandatory workflows or a new machine-readable schema.
A single-label repair can use a focused regression without a separate report.

For product-wide work, enumerate source-defined routes, shared call sites,
dialogs, menus, secondary windows, critical conditional states, large-data
states and supported platforms. Mark measured, failed and untested coverage.
Do not claim all surfaces from a representative sample.

## Select Evidence by Failure Mode

| Claim | Appropriate evidence | What it cannot establish alone |
|---|---|---|
| Source/component contract repaired | Framework-aware test of name/state and actual behavior; regression against original defect | Platform AX or named-client compatibility |
| DOM consumer can resolve it | Scoped role/label result in the correct document/shadow scope | Browser AX equality or native bridge output |
| Platform semantics exposed | Browser AX or native inspector, actual state and ownership | Model-visible projection or business success |
| Named consumer can perform task | Actual projected observation, fresh target, supported action and expected outcome | Other adapters, versions or all application workflows |
| Promise of persistence satisfied | Independent authorized datastore check or fresh load after commit | Accessible discovery or input delivery |
| History readiness improved | Same synthetic task through app, capture and attribution checks | Accurate reconstruction without inspecting retained evidence |
| Reconstruction improved | Independent reader given permitted evidence, compared with task ground truth | Capture completeness or privacy outside tested paths |

When runtime access is unavailable, report source-level results and the exact
untested boundary. Do not fabricate a pass or install an inspector/recorder
without authority. A source-only audit can finish with open runtime questions.

## Exercise the Changed Contract

Use the real interaction-driven state, not merely a story URL or a component
that never opens its menu. Capture loading/error states deliberately; fixed
sleeps are not application readiness.

Select the relevant checks:

- Naming/structure: inspect computed names and relationships, ambiguous scoped
  targets, reading content and true document/application boundaries.
- Input: verify applicable keyboard/pointer behavior, focused recipient,
  rendered and framework state, validation and promised commit. Add real IME
  or rich-text checks only when relevant; fill is not a substitute.
- Modal/composite behavior: distinguish active item, selection and focus;
  verify actual background isolation and sensible focus return.
- Identity: repeat with duplicate labels, sorting, remount or recycled rows
  where these can redirect the operation.
- Consumer coverage: compare raw output with actual model input; identify
  omitted frames, unsupported fields, redaction, budgets and required baselines.
- Outcomes: observe the specific object and expected effect. Include a failed
  or delayed result where the change affects commit/retry behavior.

For visual consumers, verify visible discovery and current geometry; do not
pretend the model saw an AX name. Still preserve and test the application's
accessibility contract. For semantic consumers, also inspect the projection;
a raw-tree pass cannot replace it.

Reference freshness and fail-closed target resolution belong to the consumer.
Cancellation crosses layers: stopping a local wait or sending a cancel request
does not prove the application or server stopped its operation. Test the
relevant boundary, but do not claim ARIA fixes establish these guarantees.
For unknown outcomes, follow
[Consumer contract](consumer-contract.md).

## Use the Tools for Their Limited Purpose

From this repository, offline synthetic checks need only Node.js:

```sh
node scripts/audit_chromium_ax.mjs --tree-file examples/ax-before.json
node scripts/audit_chromium_ax.mjs --tree-file examples/ax-after.json
node --test scripts/*.test.mjs
```

The before fixture exits 1; the after fixture exits 0 for limited tree checks.
Neither is an application workflow. The lint detects an empty effective tree
and unnamed actionable nodes; contextual warnings still need review. It cannot
establish visible-control coverage, full frames/OOPIF, native AX, focus, action
delivery, privacy or business effects.

For permitted live Chromium capture, run from the target workspace with an
absolute path to the installed audit script so its Playwright can be resolved:

```sh
node ~/.agents/skills/better-ax-for-computer-use/scripts/audit_chromium_ax.mjs \
  --url http://127.0.0.1:3000
```

Connecting to an existing CDP endpoint also requires authorization and exact
page selection. Do not enable debugging on a user app just to run the lint.
See the repository README for CLI options and output/privacy behavior.

Use [Web AX/DOM](web-ax-dom.md)'s optional synthetic browser probes only to
investigate those method boundaries. They create isolated fixtures and have
separate browser dependencies; they do not test the target application.
Prefer existing framework-aware checks over adding regex-based semantic gates.

## Check Cost and Exposure

Inspect changed production dependencies, event subscriptions/observers, tree
construction and lazy-loading behavior. For shared primitives or large custom
surfaces, compare small/large states, node volume and observation latency where
relevant. A label-only change does not need an unrelated performance campaign.

Use synthetic values and minimized diagnostics. Inspect retained test artifacts
for secrets, typed text, titles, URLs, selections and screenshots. Correct
password semantics alone do not certify privacy. Do not enable background
recording for ordinary application verification.

When history is requested, use [History readiness](history-readiness.md) and
its [test plan](history-readiness-test-plan.md). Check changes, source attribution,
missing intervals, policy and reconstruction separately. A clicked Save cannot
be upgraded to "saved" by a recorder or summary without outcome evidence.

## Close with the Right Scope

An audit completes when it reports evidence-backed findings, responsibility and
coverage limits. It need not repair defects or run unauthorized interactions.

Design-only work completes with the requested contract, tradeoffs and acceptance
cases; do not imply implementation or live validation occurred.

For a repair or build, distinguish code implemented, checks passed and required
verification blocked. A stated blocker does not complete the overall request
when that verification is required. Continue independent authorized work, then
report exactly what remains and what would unblock it. Unrequested consumer
certification need not block a component fix. Name residual consumer constraints
separately from unresolved app defects; never count a missing check as a pass.

State what changed, what task/state/client was tested, what the evidence proves,
and what remains untested. Reserve a consumer-readiness claim for the actual
tested path and version. Reserve history/reconstruction claims for evidence
from those pipelines. Preserve exact test results instead of a generic "all
accessible" conclusion.
