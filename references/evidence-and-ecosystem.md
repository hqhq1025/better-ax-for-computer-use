# Evidence and Ecosystem Inputs

Reviewed 2026-09-05. This is rationale for the skill's contracts, not an
installation list, universal runtime specification, or promise of current
project behavior. Re-check source revisions before relying on implementation
details. This skill requires no private runtime code or proprietary SDK.

## Engineering contracts

The workflow separates semantic observation, target resolution, action delivery,
and business-effect verification. These are proposed acceptance criteria to
test on the application's supported client, not universal claims about runtime
behavior. A named control does not establish how an executor delivers input;
a timeout does not establish cancellation. Validate both boundaries directly.

## Awesome repository

Canonical repository:
`https://github.com/hqhq1025/awesome-computer-use-ecosystem`

Reviewed repository snapshot at
`eaa97172f42d14902e6b38839f7ea65d5b6fd29b`.
This identifies the inspected snapshot, not a claim that remote HEAD was
unchanged afterward. The list supplies ecosystem categories; individual
mechanism claims below come from their primary documentation/source.

| Input | Verified mechanism | Reuse in this skill | Boundary |
|---|---|---|---|
| Apple accessibility representation | A semantic standard control can represent a custom view using shared state | Source-level custom controls and virtual semantics | Not an external adapter or independent hidden app state |
| Playwright ARIA snapshots | Snapshot construction derives roles/names/state from DOM | Separate DOM semantics, Chromium AX, native bridge, and business evidence | Does not prove macOS AX; no MCP installation required |
| Pi resource scheduler | Dispatch checks an observation epoch and advances it before writing | Test stale references and recycled targets | Executor responsibility; does not cover every external UI mutation |
| Open Codex Record & Replay | Generator drafts steps from events and flags missing semantic targets | Optional sanitized semantic regression inputs | Draft generation is not replay execution or success |

Primary sources inspected for these mechanisms:

- Apple API and shared-value example:
  `https://developer.apple.com/documentation/swiftui/view/accessibilityrepresentation(representation:)`
- Playwright snapshot implementation:
  `https://github.com/microsoft/playwright/blob/46cd5008d12d4e1297793d921e6cc3b595e388da/packages/injected/src/ariaSnapshot.ts`
- Playwright MCP ecosystem entry:
  `https://github.com/microsoft/playwright-mcp`
- Pi scheduler:
  `https://github.com/injaneity/pi-computer-use/blob/4b8dbd7eaa13328ab1a8a4b55d0be0b077de7d62/src/runtime.ts`
- Pi architecture:
  `https://github.com/injaneity/pi-computer-use/blob/4b8dbd7eaa13328ab1a8a4b55d0be0b077de7d62/docs/architecture.md`
- Independent replay draft generator:
  `https://github.com/hqhq1025/open-codex-record-and-replay/blob/bce89dd0f8666c29d2f295e3ecd2bd3c59d76728/open/skill-generator.mjs`

These were source/document reviews, not live interoperability tests of those
projects. The replay project is independent of official Codex.

## Standards correction

W3C's main-landmark example distinguishes nested document/application scopes
and describes labels for multiple main landmarks:
`https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/main.html`

Therefore, a global count across an Electron window with embedded documents
is not an adequate failure rule. Native windows need their platform structure,
not an imposed HTML `main` node.

## Exclusions

CLI-Anything, OpenCLI, WebMCP, and app-specific APIs can provide useful alternate
automation paths. A successful alternate path does not demonstrate that the
graphical interface exposes good AX. Do not replace a requested AX repair with
a CLI harness, private API, or new MCP server.

Computer History and record/replay are lifecycle capabilities. Use existing
sanitized traces where useful for validation; do not enable background capture
or persist real user activity as a side effect of this skill.
