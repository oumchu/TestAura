Senior QA Engineer AI-Assisted Automation Test (90
Minutes)
Purpose
This test is intentionally designed to allow and encourage the use of AI tools (ChatGPT,
Claude, Copilot, Cursor, etc.).
We are evaluating: - Automation-first QA mindset - Ability to design testable systems - Test
strategy & prioritization under time pressure - Ability to turn AI assistance into working
automated tests - Leadership-level judgment (what to test, what not to test)
Timebox
⏱ 90 minutes (strict) - You are not expected to finish everything - Trade-offs are expected
- Over-testing is discouraged - Signal > coverage
Scenario
You are the Senior QA Engineer for an E-commerce web app.
Primary user flow: - Register - Login - Find item (browse/search) - Add to cart
Your responsibility is to ensure confidence to ship through automation.
Critical context
• Business-critical flow: users must be able to login and purchase intent must be
trackable via cart actions
• Quality risks: auth issues, flaky UI, inconsistent test data, brittle selectors
• The engineering team moves fast; QA must protect core journeys with stable
automation
System Under Test (Given)
Assume the following exist (UI pages and/or APIs). You can test via UI, API, or both.
UI Pages (minimum)
• /register
• /login
• /products (browse)
• /search?q= (or a search UI on products page)
• /product/:id
• /cart
API (optional if available)
• POST /auth/register
• POST /auth/login
• GET /products
• GET /products/search?q=
• POST /cart/items
• GET /cart
Authentication can be mocked if needed.
Mandatory tooling
You may choose: - Playwright (preferred) - Cypress - REST-assured / SuperTest / k6
(API-level acceptable)
Automation language is your choice.
Task set — You have 90 minutes
You must complete ALL of Section A and ANY TWO of Section B / C / D.
Section A — Core Automation (Mandatory)
A1. Automation strategy (brief)
Explain: - What level you automate first (API / UI / E2E) - Why this choice makes sense for a
Clinic POS
Max 1 page.
A2. Critical test scenarios (required)
List 5–7 critical scenarios you would automate first.
At minimum include: - Register (happy path) OR login with seeded user - Login (happy path)
- Invalid login (error state) - Search or browse and open product detail - Add to cart and
verify cart contents (quantity, name, price) - Cart persistence behavior (same session;
optional: after refresh)
A3. Implement automated tests (required)
Implement at least 2 working automated tests.
Mandatory coverage: 1) Login flow (or register+login if you prefer) 2) Find an item and add
to cart, then assert cart contents
Notes: - UI-level tests with Playwright are preferred - API-level tests are acceptable if you
can demonstrate meaningful assertions - Tests must be runnable by another engineer
Section B — Test Architecture & Maintainability
Choose ONE:
B1. Test framework design
Show: - Folder structure - Reusable helpers / fixtures - Data seeding approach
OR
B2. Flaky test prevention
Explain: - Common causes of flakiness - Concrete techniques you use to prevent it
Section C — CI/CD & Execution
Choose ONE:
C1. CI integration
Explain: - How these tests run in CI - When they block deployment
OR
C2. Test data management
Explain: - How test data is created - How isolation is maintained - Cleanup strategy
Section D — Leadership & Quality Judgment
Choose ONE:
D1. What NOT to automate
List: - 3 things you intentionally would not automate - Why manual or monitoring is better
OR
D2. Quality metrics
Define: - 3 metrics you track as Lead QA - How they influence release decisions
Section E — Docker & Execution (Mandatory)
Your test project must be runnable by others.
Requirements: - Dockerfile for test runner - docker compose to run tests - One-command
execution (e.g., docker compose up test)
You may choose either: - Hosted SUT: tests point to a stable base URL via BASE_URL env
var - Local SUT: include a lightweight demo app container in compose
If you use a hosted SUT, you must: - Document the URL - Handle instability gracefully
(timeouts, robust waits, selector strategy)
Required deliverables
• /tests
• /docker
• README.md
• AI_PROMPTS.md
README.md (required)
Include:
- Automation approach (why UI vs API vs hybrid)
- Tools chosen and why
- How to run tests locally (Docker/Compose)
- Environment variables (e.g., BASE_URL, USER_EMAIL, USER_PASSWORD)
- How to view artifacts (screenshots/video) on failure
