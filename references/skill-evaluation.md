# Forward-Test Skill Changes

Maintainer material, not required context for ordinary skill use. Script tests
check executable tooling and links; these scenarios check whether the
instructions guide useful decisions. A textual test does not establish live
browser, native, consumer or recording behavior.

Give an independent evaluator the current skill, one prompt below and only its
provided facts. Keep the evaluation read-only or in an explicitly isolated
fixture workspace. Do not give it the review criteria until after it responds.
Record references loaded, proposed actions, conclusions and missing evidence.

## Prompts

1. "Only repair this React modal button's name. Source:
   `<button aria-label=\"Execute\">保存</button>`. Existing test finds Execute.
   No Computer Use client is installed."
2. "Design keyboard and AX interaction for our source-modifiable Canvas
   timeline. Nodes render from one store with selection and move commands.
   Do not introduce a backend service."
3. "Audit only from these facts: Save component tests pass; after choosing
   Alpha, a reordered list sends the old ref to Beta. HTTP timed out and might
   still commit. Do not run interactions or edit code."
4. "A screenshot-based agent cannot understand one toolbar icon. The button
   already has a correct aria-label. App code can change, the agent runtime
   cannot."
5. "Design our new notes app to be easier for activity history to understand.
   No recorder is selected yet. Do app-side design without requiring recording
   deployment."
6. "Improve Computer Use readiness across our Electron app. Evidence currently
   consists of three screenshots of Settings; CDP cannot see native dialogs."

## Review Criteria

Check the response against the facts, not prescribed wording:

| Scenario | Decision to look for | Regression signal |
|---|---|---|
| Narrow label | Repairs conflicting name and relevant assertion; preserves unrelated behavior | Requires installing a CU runtime or auditing all dialogs |
| Canvas design | Uses the existing store/commands, real focus/selection, supported semantic representation | Creates a hidden independent model or rejects all custom rendering |
| Audit and timeout | Separates app evidence, ref ownership, wrong-object risk and unknown commit; no mutation | Infers successful saving from component tests or blindly retries |
| Screenshot consumer | Checks visible discoverability and actual input path while retaining correct accessibility | Adds more hidden ARIA/JSON as the automatic solution |
| History without recorder | Designs honest identity/transitions/privacy at app layer; qualifies downstream claims | Blocks useful app design or claims capture/reconstruction success |
| Whole Electron app | Derives scope from source and includes native/renderer boundaries; reports missing evidence | Treats sample screenshots or renderer AX as complete application coverage |

For a substantive rewrite, use independent evaluators across narrow, broad,
design, read-only and consumer-limited cases. If a response proposes a plausible
but untested repair, record that as a proposal rather than a demonstrated fix.
Fix instructions only for supported decision failures; do not add universal
rules to force every response into the same outline.
