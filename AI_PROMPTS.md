# AI Prompts Documentation

## Tools Used
- **Claude Code (Claude Opus 4.6)** — primary AI assistant for code generation and test strategy

## Prompts Used

### Prompt 1: Exam Analysis
**Prompt:** "Read and summarize this exam for me" (pasted full exam text)
**Result:** AI provided structured summary of requirements, sections, and deliverables.
**Accepted:** Full summary used for planning.

### Prompt 2: Strategy Discussion
**Prompt:** Discussed API-first vs UI-first approach and critical test scenario list.
**Result:** AI validated the API-first choice, suggested adding invalid login and cart persistence scenarios (required by exam).
**Accepted:** Revised scenario list to match exam requirements.
**Rejected:** Removed checkout and order status scenarios (not in exam scope).

### Prompt 3: Full Project Build
**Prompt:** "Build the test project based on the plan" (after approving structured plan).
**Result:** AI generated complete project: mock server, API tests, E2E tests, fixtures, Docker setup, and documentation.

## How AI Accelerated Test Writing

1. **Mock server generation** — AI created a complete Express server with all required API endpoints and HTML pages with `data-testid` attributes in one pass. Manual effort: would take 1-2 hours.
2. **Test fixture pattern** — AI applied Playwright custom fixtures pattern for authenticated test contexts, reducing boilerplate across all test files.
3. **Docker orchestration** — AI set up health-check-based service dependency so tests wait for the app to be ready before running.
4. **Consistent `data-testid` usage** — AI generated matching selectors between mock server HTML and test files, eliminating selector mismatch bugs.

## AI Suggestions Rejected

1. **Checkout and Order Status scenarios** — AI initially kept these from my list. Removed because these endpoints/pages are not in the exam's System Under Test specification.
2. **Over-commenting style** — AI was instructed to avoid uncertain language ("I think...", "I will try...") and keep comments technical.

## How Correctness Was Validated

1. **API contract consistency** — verified mock server response shapes match what tests assert (field names, status codes, data types)
2. **Selector matching** — cross-checked `data-testid` values between `server.ts` HTML templates and `.spec.ts` test files
3. **Math verification** — manually calculated cart totals (e.g., 79.99 × 2 = 159.98) to confirm test assertions
4. **Docker compose flow** — verified service dependency chain: app starts → health check passes → tests run
