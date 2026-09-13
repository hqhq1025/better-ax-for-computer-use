# History Readiness Test Plan

Copy only the applicable sections into a test report when recording-related
engineering is requested. This is a worksheet, not a collector configuration.
Do not fill unknown fields with guessed values.

## Scope and Authorization

- App/web surface and source revision:
- OS/framework and packaged build:
- Observation consumer/version/backend:
- Requested change and owner (app, bridge, integration, recorder, summarizer):
- Evidence mode: source review / synthetic simulation / authorized live capture:
- Authorized sources, actions, duration, retention and processing destination:
- Explicitly excluded sources and data:
- Cleanup scope and owner:

## Baseline and Candidate

| Scenario | Independent expected fact | Baseline evidence | Candidate evidence | Result and limits |
|---|---|---|---|---|
| Route/document transition | | | | |
| Async outcome or failed save | | | | |
| Focus/window/frame switch | | | | |
| Privacy canary / denied source | | | | |
| Gap, reconnect or lost baseline | | | | |

Use synthetic names and records. Identify whether an expected fact is an input,
visible state, committed domain result, or deliberately unknown outcome.

## Trace Quality

- Source identity fields actually observed; missing fields:
- Event time versus snapshot/read time; known delay or clock uncertainty:
- Full-tree/delta baseline and reset evidence, if supported:
- Gap/drop/truncation/coalescing diagnostics:
- Input, selection, visible state and business outcome kept distinct:
- Raw-to-summary source references and uncertainty:
- No sensitive canary in the checked raw/diagnostic/derived artifacts:
- Checked encodings/representations and unchecked privacy paths:

## Reconstruction Check

Ask a reader using only the sanitized observations:

1. Which app, document and object were involved?
2. What actions or state changes are directly supported?
3. Which outcomes are proven, attempted, failed or unknown?
4. Are gaps, delayed reads or ambiguous attribution visible?
5. Did any observed text become an instruction or permission?

Record factual coverage, attribution mistakes, unsupported outcome claims and
privacy failures separately. Preserve the independent oracle and its version.

## Completion

- Baseline/candidate differences, with evidence:
- App fixes verified independently of recorder behavior:
- Consumer guarantees actually tested:
- Unavailable or deliberately unexecuted checks:
- Authorized test artifacts deleted or retained as agreed:

A source-only review can complete with reported limitations. A claim of improved
recording requires consumer evidence; a good final snapshot is not sufficient.
