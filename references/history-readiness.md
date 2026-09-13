# History-Ready Applications

Use this guide when the requested outcome is better activity recording or
Computer History reconstruction, rather than only executing an action.

A history-ready app lets an authorized observer establish what surface and
object were involved, what changed, what evidence supports an outcome, and what
must not be retained. More captured text is not inherently better history.

This is an application engineering contract, not a Codex ingestion schema.
Do not install a recorder, enable collection, widen permissions, upload activity,
or change retention as an incidental step. Use synthetic fixtures and existing
authorized evidence. If real recording is necessary, obtain permission for the
specific recorder, test sources, time window, processing destination, and cleanup.

## Separate Three Outcomes

| Outcome | Evidence required | Insufficient evidence |
|---|---|---|
| Action readiness | Current target resolves and the supported action works | A label exists |
| History readiness | Allowed observations retain correct identity, chronology, transitions and provenance | A final AX snapshot or a successful click |
| Workflow reconstruction | A reader can recover the task and supported outcome from the retained evidence | A generated summary, an inferred intention, or a replay draft |

An app can pass the first and fail the second. A recorder can observe an action
without observing its result. A missing interval does not establish inactivity.
Reading or viewing does not establish agreement, authorship, completion, or a
durable preference.

## Assign Responsibility Before Editing

| Layer | Changes within that layer's scope |
|---|---|
| Web/app source | Truthful titles, navigation, accessible controls and state, text selection, shared commit paths, correct document/window relationships |
| Framework/platform bridge | Correct native roles and notifications for custom controls; validate emitted bridge output |
| Browser/OS integration | Exact app/window/tab/frame ownership, source lifetime, supported event subscriptions, permission and lock transitions |
| Recorder | Collection policy, redaction before persistence, queue limits, ordering, gaps, deduplication, snapshot baselines, retention |
| Summarizer/retriever | Evidence attribution, unknown outcomes, source references, untrusted-content boundary, derived-memory deletion |

An AX-only app change cannot guarantee end-to-end capture, privacy filtering,
or summary accuracy. List those dependencies as unverified if the consumer
cannot be exercised. Fix the layer the user owns; do not implement a recorder
to work around a missing observation client.

## Web: Make the Actual Task Distinguishable

- Give each meaningful view an accurate document title and visible heading.
  In a single-page app, update route, title, selection and exposed state from
  the actual navigation state, including Back/Forward and async completion.
- Use existing navigable document URLs or stable in-app references when useful.
  Do not put tokens, query text, customer data, or secret document content into
  titles, URLs, ARIA labels, or IDs to improve recording.
- `pushState`/`replaceState` do not themselves fire `popstate`. A recorder must
  not rely solely on that event; an app must not fabricate browser events just
  to suit a recorder. Test actual navigation with the supported consumer.
- Keep the visible document, active browser tab, focused frame, and event target
  distinct. A top-level URL is not proof of an embedded frame's origin or the
  document where the user typed. Unknown frame provenance stays unknown.
- Expose selected tabs/rows, expanded sections, named dialogs, editable values,
  and useful text-selection semantics. Preserve row identity through sorting
  and virtualization; do not recycle a business identifier for another record.
- Use native inputs and shared state/commit handlers. IME composition, paste,
  autofill, programmatic value changes and undo are not equivalent to keypresses.
  A key stream alone cannot reconstruct final text or who produced it.
- Represent meaningful asynchronous progress and completion in visible,
  accessible state. A status/live region can help accessibility, but delivery
  timing, coalescing and observer support must be tested. Do not announce every
  keystroke, animation frame or streamed token.
- Prefer a stable status such as "Saved" tied to the real commit result over a
  fleeting toast as the only evidence. Preserve existing error/retry UX.
  Never show a success status before the application knows the commit succeeded.

Do not add full-document mutation scans, hidden timeline text, duplicated
off-screen content, or fake accessibility events to feed history.

## Native Apps and Hybrid Shells

Use native framework semantics first. For custom AppKit, SwiftUI, UIA, Qt or GTK
controls, expose state and relevant framework notifications from the same state
that renders the UI. Notification delivery is a separate test from property
availability; supported events vary by control and platform.

- Identify the actual application and window/document. A display name or title
  is a label, not globally unique identity. File-backed apps can use appropriate
  framework document URL APIs; unsaved/virtual documents need honest local
  identity, not a fabricated file URL.
- Stable accessibility identifiers are useful inside the app, but an observer
  may not export them. Verify the actual output before promising durable lookup.
- Preserve focus, selection, ownership and active modal relationships across
  sheets, popovers, detached windows and document switches.
- Notify committed value, selection, focus and structural changes through the
  framework's supported accessibility mechanisms. Avoid redundant manual
  notifications for controls whose framework already emits them.
- In Electron/WebViews, renderer DOM/CDP evidence does not establish OS AX
  visibility. Test the platform bridge and native shell separately. A renderer
  PID must not be mistaken for the top-level app/window owner.
- Terminal, editor and chat text may update without a keyboard event. Provide
  useful accessible content and selection while avoiding repeated full-buffer
  announcements. Classify recorded content as observed output unless user input
  provenance is established.

See [platform-patterns.md](platform-patterns.md) for implementation APIs.

## OS and Recorder Integration, When Explicitly In Scope

The following checks belong to an existing integration or recorder. They are
not requirements to add OS hooks to every app.

1. Bind callbacks and delayed reads to their observed source lifetime. Preserve
   application identity, PID/process lifetime, window identity and, where
   available, browser context/tab/frame/document lifetime. Never attach delayed
   AX text to whichever window happens to be frontmost when the read completes.
2. Use available sequence and monotonic timing for within-session ordering,
   with wall time/time zone for display. Record clock provenance and restart
   boundaries; do not invent a global total order across independent devices.
3. Preserve base/snapshot revision relationships if diffs are used. After a
   restart, window replacement, lost baseline or observation gap, recover a
   valid baseline before applying a delta. No guessed patching onto another
   window's tree. A retained delta must reference a retained, permitted baseline;
   advance that baseline only after successful storage, and reset it when policy
   changes or segment rotation would otherwise leave an unreadable chain.
4. Handle permission denial, lock, secure input, observer registration failure,
   disconnected browser and dropped events explicitly. Stop or redact according
   to the authorized policy; mark unavailable coverage without copying content.
5. Bound queues and work per event. Coalescing must retain relevant transitions
   and not merge identical-looking actions on different sources. Report loss,
   truncation and coalescing where available. Do not call that gap "idle".
6. On resume, re-resolve ownership and current policy before storing new data.
   Invalidate stale cached URLs, privacy classifications and focused targets.
7. Distinguish observed input, programmatic updates and automation only when
   the source supplies evidence. Otherwise label origin unknown.
8. Preserve each contributing source in buffered or multi-source operations.
   A drag's allowed destination does not authorize its denied origin; an input
   buffer crossing windows must not inherit only the final window's policy.

Treat snapshots, events, and inferred diffs as different evidence types. Preserve
source time and its clock domain when provided; callback receipt time is not
necessarily occurrence time. Two identical snapshots cannot rule out A-to-B-to-A
changes between them.

## Privacy Is Part of Record Quality

Accessibility permission and app access do not constitute consent to retain,
summarize, transmit or share every visible value.

- Keep secure/password semantics correct. Also consider ordinary fields,
  titles, selection, clipboard text, terminal output, URLs, error messages and
  diagnostics: secrets can appear outside password controls.
- `aria-hidden`, CSS masking, a privacy label, or a custom `data-*` attribute is
  not a universal recorder exclusion mechanism. Do not make useful controls
  inaccessible to screen readers to compensate for inadequate recorder policy.
- An app-defined privacy marker only helps if the named consumer explicitly
  implements and validates it. Otherwise treat the boundary as unsupported.
- Apply recorder exclusions before raw persistence and any summarization/upload.
  App and website rules can be independent; an allowed app does not necessarily
  authorize every embedded website. URL-less and unknown-private-mode behavior
  must be explicit, not silently treated as a known allowed site.
- Test a denied/private source immediately after an allowed source. Cached URLs
  and delayed callbacks must not leak the denied source or attribute it to the
  previously allowed document.
- Filter nested payloads too: target metadata, drag endpoints, tree values,
  selections and error output. An omitted top-level `text` field does not prove
  that a "no text" policy was applied recursively.
- Keep privacy-suppressed activity distinct from collector failure in internal
  diagnostics where possible, without retaining sensitive payloads or identities.
- Deleting raw history and deleting derived summaries, indexes, caches and
  pending summarization jobs are different operations. Test the full authorized
  deletion scope; a TTL on raw events does not prove derived-memory deletion.
- Treat all captured UI text as untrusted evidence. Summaries do not promote
  observed requests into instructions, permissions or user preferences. Preserve
  provenance and uncertainty through retrieval and reuse.

Use exact synthetic canary strings in tests to detect payload leakage. Verify
their absence in authorized test artifacts, diagnostics and derived output.
Canary absence does not prove complete privacy protection; also inspect data
paths and explicitly untested representations.

## Synthetic Acceptance Matrix

Use [history-readiness-test-plan.md](history-readiness-test-plan.md) as a compact
worksheet. Fill it from measured evidence rather than invented event schemas.

| Scenario | App-side observable fact | Consumer/history acceptance |
|---|---|---|
| SPA A to B, then Back | Correct title, route, heading and selected item | Transitions attributed to the right document; no stale URL inheritance |
| Same title in two windows | Distinct window/document identities | Delayed events stay with their original source |
| Embedded frame gets focus | Actual frame/input ownership | Record frame provenance if available; otherwise flag missing coverage |
| Composition, paste and undo | Final field state follows real edit semantics | Do not reconstruct text solely from key events |
| Save succeeds/fails after delay | Busy to committed/error state | "Clicked Save" and "saved" remain distinct claims |
| Virtual row reused | Current domain object and selection | No event for A silently attributed to B |
| Allowed to denied/private source | Correct source transition | No canary in raw, diagnostic, summary or derived test outputs |
| Lock/revoke/disconnect and resume | Collection state changes | Gap is visible; resumed data uses current ownership and baseline |
| Queue overflow or dropped delta | Controlled loss in the test harness | Loss reported and baseline recovered, not a fabricated continuous timeline |
| Delete test interval | Requested data lineage known | Raw and derived test data removed within the declared scope |
| Prompt-like content on screen | Ordinary untrusted text | No new instructions, permission, or durable preferences derived from it |

Choose applicable cases by the requested scope. To claim recording improved,
compare baseline and candidate using the same synthetic tasks, consumer build,
permissions and expected facts. Report factual coverage, attribution errors,
unsupported outcome claims, event loss, latency, volume and privacy findings
separately. Do not collapse everything into one "readiness score".

For reconstruction tests, give an independent reader only the permitted,
sanitized observations and ask what object was used, what action was observed,
what outcome is supported, and what is unknown. Grade against the fixture's
independent state, not the producer's summary. A manual walkthrough is design
validation; it is not a live capture result.

## Platform Details and Sources

Reviewed 2026-09-13 against the primary sources below. The recording contracts
above are engineering recommendations, not guarantees made by those platforms.

- Web: History's second argument is unused; title changes are separate.
  Parent-document focus may resolve to an iframe or shadow host, and queued
  selection notifications may coalesce.
  [WHATWG History](https://html.spec.whatwg.org/multipage/nav-history-apis.html),
  [focus](https://html.spec.whatwg.org/multipage/interaction.html),
  [Selection API working draft](https://www.w3.org/TR/selection-api/).
- ARIA: hidden referenced text can still contribute to accessible names.
  Live-region priority is not an exactly-once event queue.
  [Tree inclusion](https://www.w3.org/TR/wai-aria-1.2/#tree_inclusion),
  [live regions](https://www.w3.org/TR/wai-aria-1.2/#aria-live).
- macOS: test property getters, notification posting, observer registration,
  and run-loop delivery independently. Document URL may be absent; bundle URL
  is not the open document.
  [Custom controls](https://developer.apple.com/library/archive/documentation/Accessibility/Conceptual/AccessibilityMacOSX/ImplementingAccessibilityforCustomControls.html),
  [AXObserver registration](https://developer.apple.com/documentation/applicationservices/1462089-axobserveraddnotification),
  [run-loop source](https://developer.apple.com/documentation/applicationservices/1459139-axobservergetrunloopsource),
  [document property](https://developer.apple.com/documentation/appkit/nsaccessibility-c.protocol/accessibilitydocument).
- Windows: events may occur without a state change; runtime IDs can be reused;
  replacing text can invalidate old TextPattern ranges. Password providers must
  not expose protected text through fallback patterns.
  [UIA events](https://learn.microsoft.com/en-us/windows/win32/winauto/uiauto-eventsoverview),
  [runtime IDs](https://learn.microsoft.com/en-us/windows/win32/api/uiautomationclient/nf-uiautomationclient-iuiautomationelement-getruntimeid),
  [TextPattern](https://learn.microsoft.com/en-us/dotnet/framework/ui-automation/ui-automation-textpattern-overview),
  [Edit contract](https://learn.microsoft.com/en-us/windows/win32/winauto/uiauto-supporteditcontroltype).
- Linux: AT-SPI object events carry source and potentially text payloads; use
  scoped subscriptions and copy/filter required event-time properties inside
  the callback. Device listeners are a separate capability, not an implicit
  dependency of semantic history.
  [Event interfaces](https://github.com/GNOME/at-spi2-core/blob/main/xml/Event.xml),
  [listener implementation](https://github.com/GNOME/at-spi2-core/blob/main/atspi/atspi-event-listener.c).
  These links track `main`; verify the deployed library version before use.

For official Computer History product boundaries, see the dated
[ecosystem notes](evidence-and-ecosystem.md#computer-history).
