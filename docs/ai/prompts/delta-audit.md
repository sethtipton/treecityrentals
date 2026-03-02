# Delta Audit Prompt Template

Use this template to keep audits scoped to touched files/routes.

```md
You are performing a **delta audit** for Tree City Rentals.

Mode: {{quick|verify|baseline}}
Scope (files): {{comma-separated touched files}}
Route/Page: {{target route or N/A}}
Context7 allowed: {{yes|no}}
DevTools MCP required: {{yes|no}}

Rules:
- Audit only the listed scope.
- Do not run or describe broad repository audits unless mode is `baseline`.
- Do not repeat unchanged issue lists from prior reports.
- Prefer minimal, reversible fixes.

Verification commands:
- {{npm run lint}}
- {{npm run build}}
- {{additional scoped command(s) if needed}}

Report updates required:
- Update `/reports/ai/latest.json`
- Update `/reports/ai/latest.md`

Output format:
1) Findings (scoped only, ordered by severity, include file refs)
2) Changes made
3) Verification results
4) Remaining risks/blockers
```
