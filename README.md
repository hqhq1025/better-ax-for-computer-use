# Better AX for Computer Use

[English](README.md) | [简体中文](README.zh-CN.md)

[![Tests](https://github.com/hqhq1025/better-ax-for-computer-use/actions/workflows/test.yml/badge.svg)](https://github.com/hqhq1025/better-ax-for-computer-use/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Better AX for Computer Use is an open-source accessibility engineering skill
for AI coding agents. It helps developers audit and improve accessibility
trees, DOM/ARIA semantics, target identity, and action verification in web,
Electron, and native applications whose source they can modify.

Improve the app's real UI: meaningful controls, reliable state and focus,
unambiguous targets, and actions whose effects can be verified. AX here covers
browser accessibility trees and platform interfaces, including macOS AX,
Windows UIA, and Linux accessibility bridges.

This is a developer workflow with a small Chromium AX audit tool. It is not a
computer-control runtime, external adapter, or accessibility certification.

[Install](#install) · [Try the audit](#try-an-offline-ax-audit) ·
[Platform coverage](#platform-coverage) · [FAQ](#faq) · [Guides](#guides)

## When to Use It

- A Computer Use agent sees a button but cannot identify or operate it reliably.
- A React or Electron UI exposes missing labels, ambiguous controls, or stale
  targets after navigation or virtual-list recycling.
- A SwiftUI, Qt, Canvas, or other custom control needs native accessibility
  semantics tied to the same state and commit path as its visual UI.
- An action reports success but the intended setting or record is not saved.
- An activity-history consumer loses document identity, misses state transitions,
  or confuses an attempted action with its outcome.

For example, an unnamed Save button needs a meaningful name and usable state.
After activation, the workflow must also confirm that the intended record was
persisted. Passing a tree lint only addresses part of that contract.

## Install

Clone this repository into a skill directory recognized by your agent. For a
Codex user-level installation:

```sh
mkdir -p ~/.agents/skills
git clone https://github.com/hqhq1025/better-ax-for-computer-use.git \
  ~/.agents/skills/better-ax-for-computer-use
```

Do not overwrite an existing installation. Review local changes before updating.
The installed folder contains `SKILL.md`, supporting references, and scripts.
Use a new session if your client has not refreshed its skill list.

Example requests:

```text
Use $better-ax-for-computer-use to audit this Electron settings panel.
Report issues and missing evidence; do not change code.
```

```text
Use $better-ax-for-computer-use to repair this custom slider's semantics.
Verify that accessible adjustment updates and persists the real setting.
```

Other agents can load [SKILL.md](SKILL.md) and its relative references directly.
Client-specific discovery and invocation syntax may differ.

## Workflow

1. Inventory the requested surfaces and states.
2. Inspect what the actual accessibility consumer sees.
3. Repair semantics in the owning controls and authoritative application state.
4. Verify target identity, scope, focus, and supported actions.
5. Re-observe and assert the intended business effect.
6. Report measured coverage and remaining gaps.

| Concern | Requirement |
|---|---|
| Read-only audits | Findings do not authorize source edits or state-changing probes |
| Custom rendering | Native virtual semantics share the rendering state and action path |
| Target identity | Domain IDs are distinct from temporary node references |
| Multiple documents | Evaluate real document/frame/application scopes separately |
| Input and saving | Check controlled state and persistence, not only the visible value |
| Timeouts | Reconcile the outcome before retrying; no blind duplicate mutations |
| Record/replay | Re-resolve semantic targets instead of replaying old indexes or points |

Source-unmodifiable applications require a separately scoped adapter task.
The skill does not install private APIs, an MCP server, or a hidden agent UI.

## Web AX and DOM

Targeting TryCua or Codex? The [consumer guide](references/web-consumers.md)
separates screenshot, DOM, browser AX and native accessibility paths, and shows
how to identify what the selected adapter actually consumes.

The [Web engineering guide](references/web-ax-dom.md) covers computed names,
DOM versus browser AX, native/ARIA behavior, controlled input, hydration,
composite widgets, portals, frames, Shadow DOM and custom rendering.
It starts with the failing layer and ends with a verified application effect.

```text
Use $better-ax-for-computer-use to repair this web form.
Compare DOM role/label resolution with browser AX, then verify keyboard input,
validation and the committed result. Keep changes scoped to this form.
```

Optional real-browser probes demonstrate nine synthetic boundary cases:

```sh
# Requires Playwright and its Chromium installed in the invoking workspace.
node scripts/probe_web_contracts.mjs
# Or explicitly use an installed Google Chrome in a fresh isolated session:
WEB_AX_CHANNEL=chrome node scripts/probe_web_contracts.mjs
```

These probes do not connect to user tabs or record history. They are separate
from offline CI, report the exact browser/tool versions, and do not certify a
real app, OS accessibility bridge, screen reader, IME or cross-origin OOPIF.

## Activity History Readiness

For Computer History and other authorized activity-recording consumers, the
skill also covers accurate route/document identity, observable state changes,
window/frame attribution, privacy boundaries, and workflow reconstruction.

```text
Use $better-ax-for-computer-use to improve this app for Computer History.
Fix app-side semantics and compare synthetic navigation and save workflows.
Do not enable recording or read personal activity.
```

Use the [history-readiness guide](references/history-readiness.md) and
[test plan](references/history-readiness-test-plan.md). They distinguish
app-side repairs from OS integration, recorder policy, and summarization.
This is engineering guidance, not a recorder or Codex ingestion API.
The Chromium lint does not measure event delivery or recording quality.

## Chromium Audit Tool

Node.js 22 or newer is the supported baseline. Offline checks and unit tests
need no npm dependencies:

```sh
node scripts/audit_chromium_ax.mjs --tree-file ax-tree.json
node --test scripts/audit_chromium_ax.test.mjs
```

### Try an Offline AX Audit

The repository includes synthetic before/after fixtures:

```sh
# Reports unnamed controls and exits 1.
node scripts/audit_chromium_ax.mjs --tree-file examples/ax-before.json

# No blocking findings in the limited tree lint; exits 0.
node scripts/audit_chromium_ax.mjs --tree-file examples/ax-after.json
```

The after fixture adds accessible names and an explicit checkbox state.
It demonstrates the audit format, not a completed browser or business workflow.

The input is a CDP AX node array or an object containing `nodes`. For example:

```json
{
  "nodes": [
    {
      "nodeId": "1",
      "ignored": false,
      "role": {"type": "role", "value": "button"},
      "name": {"type": "computedString", "value": "Save"}
    }
  ]
}
```

For live capture, the target workspace must already have `playwright` or
`@playwright/test`. Launch mode also needs that package's Chromium browser:

```sh
# Run from the target workspace so its Playwright package can be resolved.
node ~/.agents/skills/better-ax-for-computer-use/scripts/audit_chromium_ax.mjs \
  --url http://127.0.0.1:3000

# Attach only to an already authorized debugging endpoint.
node ~/.agents/skills/better-ax-for-computer-use/scripts/audit_chromium_ax.mjs \
  --cdp http://127.0.0.1:9222 --page-title "My App"
```

Without a title selector, CDP mode requires exactly one context and one page.
With a title selector, exactly one page must match across all contexts. The
tool does not create or navigate existing user pages.

| Exit code | Meaning |
|---|---|
| `0` | No blocking findings in the tool's limited checks; review warnings |
| `1` | Empty effective tree or unnamed actionable nodes |
| `2` | Invalid arguments, malformed input, capture, or cleanup failure |

Multiple mains, duplicate names, and missing state are contextual warnings.
A zero exit code does not prove complete accessibility or Computer Use
readiness. The tool does not guarantee full iframe/OOPIF coverage, compare the
tree against every visible control, or verify keyboard behavior, native bridge
output, actions, freshness, or business effects.

Captured reports can contain names and labels from private data. Use synthetic
fixtures and review reports before sharing. `--output` writes the report to the
specified path and overwrites an existing file.

## Guides

- [Skill entry point](SKILL.md)
- [Developer checklist](references/developer-checklist.md)
- [Platform patterns](references/platform-patterns.md)
- [Web AX/DOM diagnostics and repair](references/web-ax-dom.md)
- [Consumer contract and negative cases](references/consumer-contract.md)
- [Activity history readiness](references/history-readiness.md)
- [Synthetic history test plan](references/history-readiness-test-plan.md)
- [Verification and completion gates](references/verification.md)
- [Public sources and ecosystem inputs](references/evidence-and-ecosystem.md)
- [Machine-readable project facts](project.json)
- [Plain-text documentation index](llms.txt)

## Platform Coverage

| Surface | Included guidance | Executable verification included |
|---|---|---|
| Web / React / Chromium | HTML, ARIA, computed names, input, hydration, frames, Shadow DOM | Partial AX lint, offline regressions and optional synthetic browser probes |
| Electron | Renderer semantics and native window/process boundaries | Chromium lint only; native bridge requires separate verification |
| macOS AppKit / SwiftUI | Native controls, virtual elements, representation and persistence | Guidance; no bundled native test runner |
| Windows UIA | Control types, patterns, state and identity | Guidance; no bundled UIA runner |
| Qt / GTK / custom rendering | Platform bridges and shared-state semantic representations | Guidance; no bundled platform runner |

Documentation coverage is not a claim that every platform or client has passed
end-to-end tests.

## FAQ

### How is this different from an accessibility checker?

A checker can detect some semantic defects. This skill guides source changes
and requires evidence about target resolution, input delivery, and the intended
business effect as well. It complements human accessibility testing; it does
not replace WCAG evaluation or assistive-technology testing.

### Does it control my computer or install an MCP server?

No. The skill guides an existing coding agent. The optional script reads saved
AX trees or captures Chromium AX through an authorized Playwright/CDP connection.
No computer-control runtime, background recorder, or MCP server is installed.

### Does it work with Codex and other coding agents?

The repository provides a `SKILL.md` entry point and Codex installation example.
Other agents can read the same instructions and references. Automatic discovery,
tool permissions, and invocation syntax depend on the client; cross-client
compatibility has not been end-to-end certified.

### Can it repair a closed-source app?

Source-level fixes require source access. External semantic adapters and
alternate automation APIs are different approaches outside this skill's scope.

### Does exit code zero mean my app is ready for Computer Use?

No. It means the script found no blocking issues in its limited snapshot checks.
Warnings, missing surfaces, keyboard/focus behavior, and action effects still
need review. See the [verification gates](references/verification.md).

### Where does this fit in the Computer Use ecosystem?

This project improves the application that an agent operates. Runtimes execute
actions; adapters compensate for inaccessible targets; recording tools capture
demonstrations. See [Awesome Computer Use Ecosystem](https://github.com/hqhq1025/awesome-computer-use-ecosystem)
for the broader taxonomy and the [source notes](references/evidence-and-ecosystem.md)
for the mechanisms that informed this skill.

## Validation and Contributions

The initial release includes 46 offline tests covering tree validation,
document scope, target selection, cleanup, and CLI behavior. Browser capture
tests use injected fakes; they do not replace real-browser or native-app E2E
validation. Text-based skill scenario checks likewise do not establish live
application compatibility.

For changes, run all repository checks:

```sh
node --test scripts/*.test.mjs
```

Add a regression for changed executable
behavior, keep guidance scoped to source-level semantics, and distinguish
verified runtime behavior from proposed acceptance criteria. Do not submit
private AX dumps, credentials, user screenshots, or proprietary binaries.
See [CONTRIBUTING.md](CONTRIBUTING.md) for issue and pull-request guidance.

## License

MIT. See [LICENSE](LICENSE).

Original guidance and tooling are licensed here; referenced projects and
standards retain their own licenses. No third-party runtime implementation is
bundled. This is an independent project and is not affiliated with OpenAI,
Apple, Microsoft, or the referenced ecosystem projects.

Created and maintained by [Haoqing Wang](https://github.com/hqhq1025).
