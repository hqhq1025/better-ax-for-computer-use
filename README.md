# Better AX for Computer Use

An agent skill for making source-modifiable applications understandable and
operable through accessibility semantics.

Improve the app's real UI: meaningful controls, reliable state and focus,
unambiguous targets, and actions whose effects can be verified. AX here covers
browser accessibility trees and platform interfaces, including macOS AX,
Windows UIA, and Linux accessibility bridges.

This is a developer workflow with a small Chromium AX audit tool. It is not a
computer-control runtime, external adapter, or accessibility certification.

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

## Chromium Audit Tool

Node.js 22 or newer is the supported baseline. Offline checks and unit tests
need no npm dependencies:

```sh
node scripts/audit_chromium_ax.mjs --tree-file ax-tree.json
node --test scripts/audit_chromium_ax.test.mjs
```

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
- [Consumer contract and negative cases](references/consumer-contract.md)
- [Verification and completion gates](references/verification.md)
- [Public sources and ecosystem inputs](references/evidence-and-ecosystem.md)

## Validation and Contributions

The initial release includes 46 offline tests covering tree validation,
document scope, target selection, cleanup, and CLI behavior. Browser capture
tests use injected fakes; they do not replace real-browser or native-app E2E
validation. Text-based skill scenario checks likewise do not establish live
application compatibility.

For changes, run the test command above. Add a regression for changed executable
behavior, keep guidance scoped to source-level semantics, and distinguish
verified runtime behavior from proposed acceptance criteria. Do not submit
private AX dumps, credentials, user screenshots, or proprietary binaries.

## License

MIT. See [LICENSE](LICENSE).

Original guidance and tooling are licensed here; referenced projects and
standards retain their own licenses. No third-party runtime implementation is
bundled. This is an independent project and is not affiliated with OpenAI,
Apple, Microsoft, or the referenced ecosystem projects.
