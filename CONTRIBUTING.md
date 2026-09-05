# Contributing

Keep contributions focused on source-level accessibility semantics and
verifiable Computer Use workflows. A new runtime, adapter service, or recording
system belongs in a separate proposal, not an incidental skill change.

## Report an Issue

Include the app framework and version, operating system, observation client,
expected behavior, actual behavior, and the smallest synthetic reproduction.
Separate a DOM observation from Chromium AX or native AX/UIA evidence.

Do not post private trees, account names, tokens, screenshots, or real user
records. Reproduce the problem with synthetic labels and data first.

## Make a Change

1. Keep source guidance in `SKILL.md` concise; put platform detail in references.
2. Add regression tests for changed executable behavior.
3. Update both README languages when changing installation, scope, or limits.
4. Keep `project.json` and `llms.txt` aligned with visible documentation.
5. Run `node --test scripts/*.test.mjs`.

For a pull request, describe the problem, the change, tests run, and remaining
limits. Do not claim a native or browser E2E result from mocks or snapshots.

No npm install is needed for offline tests. Live capture uses the target
workspace's Playwright installation and requires authorization for its endpoint.
