# E-Commerce QA Automation Suite

Automated test suite for an e-commerce web application covering authentication, product browsing, search, and cart operations.

## Automation Approach

### Strategy: API-First + E2E Hybrid

**API tests run first** to validate backend contracts (status codes, response schemas, data integrity). **E2E tests run second** to confirm the UI correctly renders and interacts with API data.

**Why API-first:**
- API tests are faster (no browser overhead), more stable, and isolate backend logic
- Catches data contract issues before they surface as flaky UI failures
- E2E tests then focus only on user interaction and rendering — not re-testing API logic

**Why not UI-only:**
- UI tests are slower and more brittle
- A failing UI test gives ambiguous signals: is it the API? The selector? A timing issue?
- API tests provide precise failure signals

### Test Pyramid Applied

```
        /  E2E  \        ← 3 specs: login, search+cart, persistence
       /   API   \       ← 3 specs: auth, products, cart
      /  (mock)   \      ← Express mock server
```

## Tools

| Tool | Purpose |
|------|---------|
| **Playwright** | Test runner + browser automation + API testing |
| **TypeScript** | Type safety for test code |
| **Express** | Lightweight mock SUT (System Under Test) |
| **Docker Compose** | One-command test execution |

## Project Structure

```
├── tests/
│   ├── api/
│   │   ├── auth.spec.ts          # Register, login, invalid credentials
│   │   ├── products.spec.ts      # Product listing, search, detail
│   │   └── cart.spec.ts          # Add to cart, get cart, auth enforcement
│   ├── e2e/
│   │   ├── login.spec.ts         # Login happy path + error state
│   │   ├── search-and-cart.spec.ts   # Search → detail → add to cart → verify
│   │   └── cart-persistence.spec.ts  # Cart survives page refresh
│   └── fixtures/
│       ├── auth.fixture.ts       # Reusable auth Playwright fixture
│       ├── api-client.ts         # API wrapper with typed methods
│       └── test-data.ts          # Seeded product data + test constants
├── mock-server/
│   └── server.ts                 # Express mock with API + HTML pages
├── docker/
│   ├── Dockerfile.app            # Mock server image
│   └── Dockerfile.test           # Playwright test runner image
├── docker-compose.yml            # Orchestrates app + test containers
└── AI_PROMPTS.md
```

## How to Run

### Docker (recommended)

```bash
docker compose up --build --exit-code-from test
```

This starts the mock server and runs all tests. Exit code reflects test results.

### Local (requires Node.js 20+)

```bash
# Install dependencies
npm install
cd mock-server && npm install && cd ..

# Start mock server
cd mock-server && npx ts-node server.ts &
cd ..

# Install Playwright browsers
npx playwright install --with-deps chromium

# Run all tests
npx playwright test

# Run only API tests
npx playwright test tests/api/

# Run only E2E tests
npx playwright test tests/e2e/
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:3000` | Target application URL |
| `CI` | — | Set in CI to enable retries and stricter mode |

## Viewing Failure Artifacts

On test failure, Playwright captures:
- **Screenshots** → `test-results/` directory
- **Videos** → `test-results/` directory (on retry)
- **Traces** → `test-results/` directory (on retry)

View HTML report:
```bash
npx playwright show-report
```

In Docker, artifacts are mounted to `./test-results/` and `./playwright-report/` on the host.

## Example Output

```
Running 17 tests using 1 worker

  ✓ Auth API > POST /auth/register - successful registration (120ms)
  ✓ Auth API > POST /auth/login - successful login (85ms)
  ✓ Auth API > POST /auth/login - invalid credentials returns 401 (50ms)
  ✓ Products API > GET /products - returns all products (45ms)
  ✓ Products API > GET /products/search - filters by query (40ms)
  ✓ Cart API > POST /cart/items - add item to cart (90ms)
  ✓ Cart API > GET /cart - returns cart contents with total (100ms)
  ✓ Login E2E > successful login redirects to products page (1.2s)
  ✓ Login E2E > invalid credentials show error message (800ms)
  ✓ Search and Cart E2E > search for product and view details (1.5s)
  ✓ Search and Cart E2E > add product to cart and verify cart contents (1.8s)
  ✓ Cart Persistence E2E > cart contents persist after page refresh (1.3s)

  17 passed
```

---

## Section A1 — Automation Strategy

I chose to start with API testing first because I need to make sure the backend is returning the correct data according to the API spec before anything else. API tests are faster to run since there's no browser involved, and when something fails, I know right away it's a backend issue — not a UI glitch or a timing problem.

Once the APIs are verified, I move on to E2E tests. The idea here is to compare what the API returns with what actually shows up on screen. For example, if the API says a product costs 299 baht, the E2E test checks that the user sees 299 baht on the page. This way I'm not duplicating effort — APIs handle the data correctness, E2E handles the user experience.

This follows the test pyramid approach: API tests form the solid base (fast, stable, many cases), and E2E tests sit on top (fewer tests, focused on real user flows).

## Section A2 — Critical Test Scenarios

These are the scenarios I consider critical because they represent the core purchasing flow that directly affects revenue and user trust:

1. **Register** — user must be able to create a new account, otherwise they can't use the platform at all
2. **Login** — authentication has to work; if users can't log in, everything else is blocked
3. **Search products** — users need to find what they're looking for quickly
4. **Product details** — the product page must show correct information (name, price, description) so users can make a buying decision
5. **Add product to cart** — this is the first step toward a purchase, it has to work reliably
6. **Cart details** — users need to see what's in their cart with the correct items and totals before they commit
7. **Checkout** — this is where the money flows; any bug here means lost revenue
8. **Order status** — after paying, users need to know their order went through and track it

I also included a couple of negative cases like logging in with wrong credentials, because those affect security and user trust.

## Section B1 — Test Framework Design

### Folder Structure
- `tests/api/` — API-level specs grouped by domain (auth, products, cart)
- `tests/e2e/` — UI specs grouped by user journey
- `tests/fixtures/` — Shared code: API client, auth fixtures, test data

### Reusable Helpers
- **`ApiClient`** — typed wrapper for all API calls, manages auth token
- **`auth.fixture.ts`** — Playwright custom fixture that auto-registers a user and provides an authenticated client
- **`test-data.ts`** — centralized product data + search expectations

### Data Seeding
- Mock server starts with pre-loaded product data (no database, no external setup)
- Each test creates its own user via API (unique email with timestamp)
- No shared mutable state between tests


## Section C1 — CI Integration

### Pipeline Design (GitHub Actions)

```yaml
name: QA Tests
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker compose up --build --exit-code-from test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-results
          path: test-results/
```

### When Tests Block Deployment
- **PR merge** — tests must pass before merge to main
- **Main branch** — tests run post-merge; failure triggers alert, blocks further deploys
- **API tests gate E2E** — if API tests fail, E2E tests do not run (configured via Playwright project dependencies)

## Section D1 — What NOT to Automate

### 1. Visual/UI layout and cosmetic appearance
I wouldn't automate visual checks like font sizes, colors, or element alignment. The reason is that pixel-level rendering behaves differently across browsers and operating systems — a test might pass on Chrome but fail on Safari just because of how fonts render. For visual stuff, it's more practical to do manual review during PRs or use dedicated visual regression tools like Percy if the team decides it's worth the investment.

### 2. Third-party payment gateway flows
Payment providers like Stripe or PayPal have their own UI that we don't control. They can change their interface anytime without telling us, which would break our tests even though nothing is wrong on our side. I'd automate everything up to the payment boundary (selecting payment method, filling in details) but let the actual payment processing be verified through webhooks and provider dashboards.

### 3. Email verification and OTP flows
Automating email or SMS verification requires connecting to external email services or phone APIs, which makes tests flaky and slow. Instead, I'd mock the email/OTP at the API level — verify that the system correctly triggers the email service, but don't actually wait for an email to arrive in a real inbox.

## Section D2 — Go-Live Criteria

These are the key things I'd check before deciding the application is ready to go live:

1. **Testing timeline and completion** — all planned test cases have been executed within the scheduled timeline. If we still have critical test scenarios that haven't been run, we're not ready to release.

2. **Defect status** — I'd look at how many defects were found and their severity. There should be no critical or high-severity bugs remaining open. If there are still major issues, we need to fix them before release. A reasonable number of low-priority bugs might be acceptable depending on the team's agreement.

3. **Regression / backward compatibility** — the new version should not break existing functionality. I'd run regression tests to confirm that features that worked in the previous version still work the same way after the update. If old features break because of new changes, that's a blocker.
