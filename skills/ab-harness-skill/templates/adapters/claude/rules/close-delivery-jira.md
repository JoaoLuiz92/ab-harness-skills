# Close delivery — Jira

When `JIRA_TASKS=ON` and card KEY is known:

1. Verify validation lane report APROVADO
2. Complete `.specs/features/<slug>/delivery.md` (sections 1–8; use for Jira comment body)
3. Comment on card with summary, technical notes, verification, docs; link lane report
4. Transition to PR Review when workflow allows
5. Update `.specs/quick/NEXT-ACTIONS.md`
6. If MCP unavailable: note MCP_PENDING; inform user

Link report: `.specs/testing/reports/<date>-<slug>.md`
