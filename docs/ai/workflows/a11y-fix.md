# Accessibility Fix Workflow

## Purpose
Apply and verify targeted accessibility fixes on touched UI without expanding scope unnecessarily.

## When To Use
- Any UI/form/navigation change may affect accessibility.
- Bugs reference keyboard traps, missing labels, poor focus, or unclear errors.
- A PR needs evidence of a11y validation for changed routes/components.

## Scope Guidance
- Start with changed files and directly affected route(s).
- Expand only to dependencies that share the same interaction pattern.
- Reserve broad audits for `baseline` mode.

## Checklist
- Semantic HTML is used before ARIA fallbacks.
- Inputs/buttons/controls have accessible names and labels.
- Keyboard path works end-to-end with visible focus states.
- Live regions announce dynamic status/error text when needed.
- Reduced-motion preferences are respected for non-essential animation.
- Invalid/error states are programmatically associated and visible.

## DevTools MCP Suggestions
- Inspect a11y tree/snapshot for affected controls.
- Run a targeted Lighthouse accessibility audit on scoped route(s).
- Check console for accessibility warnings and runtime errors.

## Verify + Patch Loop
1. Reproduce issue on scoped route.
2. Patch minimal files needed.
3. Re-run targeted checks (keyboard, a11y tree, console/Lighthouse).
4. Repeat until no new regression is introduced.

## Output Checklist
- Scope, mode, and tools used are documented.
- Checks run and outcome are explicit.
- Findings map to concrete files/components.
- Remaining risks or blockers are called out.
- Reports are updated in `/reports/ai/latest.json` and `/reports/ai/latest.md`.
