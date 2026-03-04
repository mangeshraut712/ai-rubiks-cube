---
description: How to perform security checks before commits and deployments using the vibe coding checklist.
---

1. View the `SECURITY.md` file in the root of the project to understand the Vibe Coding Security Checklist.
// turbo-all
2. Analyze the recent changes or the proposed deployment.
3. Compare the codebase changes against all 3 sections of the checklist: SECRETS & CONFIG, ACCESS & API, and USER INPUT.
4. If ANY item on the checklist is violated (e.g., hardcoded API keys, excessively permissive CORS, missing rate limits, unsanitized user inputs), stop the process immediately.
5. Provide a report to the user detailing the violations and refuse to proceed with the commit or deployment until they are fixed.
6. If all items pass, proceed with committing or deploying.
