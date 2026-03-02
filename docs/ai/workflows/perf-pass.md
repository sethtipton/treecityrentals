# Performance Pass Workflow

## Purpose
Run a focused performance pass on a specific route or component without drifting into broad audits.

## When To Use
- A UI change risks render cost, bundle growth, or layout shift.
- A route has reported slowness, jank, or long interaction latency.
- Before/after proof is needed for a perf-related PR.

## Required Inputs
- Target route/page (for example: `/listings`).
- Scope (specific components or changed files).
- Mode (`quick`, `verify`, `baseline`).

## Steps
1. Baseline: capture current behavior for the target route only.
2. Measure: collect console timing and one trace before changes.
3. Improve: apply lowest-risk fixes in scoped files.
4. Verify: repeat the same measurement path after changes.
5. Report: update `/reports/ai/latest.json` and `/reports/ai/latest.md`.

## DevTools MCP Suggestions
- Console: capture runtime warnings and timing logs.
- Performance trace: take one before + one after trace for the same interaction.
- Keep trace scenarios identical so deltas are comparable.

## Output Checklist
- Mode and route scope recorded.
- Tools used and checks run listed.
- Before/after delta summarized in plain language.
- Findings limited to scoped files unless `baseline` mode.
- Next actions are concrete and short.

## Token Discipline
- Stay in delta scope; avoid repository-wide issue lists.
- Do not repeat unchanged findings from previous runs.
- Use `baseline` mode only when establishing an initial benchmark.
