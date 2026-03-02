# Tree City Rentals Frontend Agent Guidelines

This repository is optimized for AI-assisted frontend development with strong accessibility and performance standards.

## Primary Goals
- Preserve production stability while iterating quickly.
- Keep accessibility first-class, not a later cleanup task.
- Measure performance before and after changes.
- Favor simple, maintainable React patterns over clever abstractions.

## Required Tooling
- `Context7 MCP`: pull current framework guidance and API patterns before major refactors.
- `Chrome DevTools MCP`: profile runtime behavior, inspect console output, and validate improvements.
- Local quality gates:
  - `npm run lint`
  - `npm run build`

## Modes
- `quick`:
  - Delta-only pass on touched files/routes.
  - No broad audits, no repeated backlog lists.
  - Use when implementing or checking a small change.
- `verify`:
  - `quick` mode plus targeted verification (`lint`, `build`, route-specific checks).
  - Use when preparing a handoff-ready patch.
- `baseline`:
  - Broader initial pass to establish current quality/perf posture.
  - Top issues only; avoid exhaustive inventories.
  - Use when no recent baseline exists.

## Tool Gating
- Use `Context7 MCP` only when API behavior is uncertain, unstable, or being refactored.
- Use `Chrome DevTools MCP` for runtime/perf/a11y evidence (console, traces, a11y tree).
- In `quick` mode, do not open DevTools unless a runtime bug claim needs proof.
- In `verify` mode, run targeted DevTools checks for touched routes.
- In `baseline` mode, capture before/after traces only for scoped routes, not the entire app.

## Token Budget Rules
- `quick` mode budget:
  - Keep prompt/context under ~3k tokens.
  - Report max 3 findings and max 3 actions.
- `verify` mode budget:
  - Keep prompt/context under ~6k tokens.
  - Report max 5 findings and max 5 actions.
- `baseline` mode budget:
  - Keep prompt/context under ~12k tokens.
  - Report top 5 issues per category only.
- Reporting limits:
  - Do not repeat unchanged findings across runs.
  - Keep report content scoped to changed files/routes unless in `baseline`.

## Output Contract
- Always write both:
  - `/reports/ai/latest.json` (machine-readable summary)
  - `/reports/ai/latest.md` (human-readable summary)
- Reports must include mode, scope, tools used, checks run, findings, next actions, and changed files.
- If tooling is blocked, record the blocker and fallback checks in both outputs.

## Local Scripts
- `npm run ai:preflight`: run fast local quality gates before reporting.
- `npm run ai:changed`: print staged + unstaged changed files for delta scope.
- `npm run ai:bundle-check`: run bundle budget scaffolding checks.

## Standard Workflow
1. Baseline:
   - Confirm package/runtime versions (`npm ls react react-dom`).
   - Capture current build output (bundle size and warnings).
2. Inspect:
   - Run a semantic HTML + keyboard + focus + forms accessibility pass.
   - Identify render hotspots, large lists, heavy images, and transition costs.
3. Measure:
   - Add temporary or guarded performance instrumentation.
   - Capture output in DevTools console/performance traces.
4. Improve:
   - Apply highest-impact low-risk fixes first.
   - Re-measure using the same scenarios.
5. Report:
   - Provide categorized findings.
   - Provide top 5 issues per category with file references.

## Accessibility Requirements
- Use semantic elements before ARIA.
- Every form control must have a label and associated error description when invalid.
- Provide keyboard-visible focus styles.
- Provide a skip link to main content.
- Use live regions for dynamic status/error messaging when appropriate.
- Avoid pointer-only interactions and hover-only affordances.

## Performance Requirements
- Guard instrumentation and debugging logs behind `import.meta.env.DEV`.
- Use deferred rendering (`useDeferredValue`) when filtering/searching larger lists.
- Avoid unnecessary effects and repeated expensive computations during render.
- Prefer predictable image sizing (`width`, `height`, `sizes`) to reduce layout shift.
- Keep route transitions measurable and bounded.

## React + Routing Guidance
- Keep components pure during render.
- Put timing and side-effectful telemetry in handlers/effects, not render paths.
- Memoize only where profiling shows meaningful wins.
- Split route/page concerns into focused components as the app grows.
- Keep unstable APIs documented with rationale where used.

## Commit/Change Hygiene
- Make small, reversible changes.
- Do not silently alter behavior outside the requested scope.
- Include file-level notes for every meaningful behavior change.
- If tooling is unavailable (e.g., DevTools MCP transport down), document the exact blocker and fallback checks performed.

## Definition of Done for Frontend Changes
- Lint passes.
- Build passes.
- No new accessibility regressions in touched UI.
- Performance impact is either improved or explained with tradeoff rationale.
