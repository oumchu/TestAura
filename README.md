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

I chose API-first because I want to make sure the backend sends correct data before testing anything on screen. API tests are fast and give clear answers — if something is wrong, I know it's a backend problem right away.

After that, I run E2E tests to check if the screen shows the same data the API returns. For example, if the API says a product is 299 baht, the screen should also show 299 baht. Simple as that.

## Section A2 — Critical Test Scenarios

These cover the main flow that every customer goes through when buying something:

1. **Register** — no account, no shopping
2. **Login** — can't do anything without logging in
3. **Search products** — users need to find what they want
4. **Product details** — correct name, price, and description must show up
5. **Add to cart** — first step toward buying
6. **Cart details** — users should see the right items and total
7. **Checkout** — this is where money is involved, must work perfectly
8. **Order status** — after paying, users need to know it went through

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

1. **Visual/UI layout** — things like font size, color, alignment look different on every browser and OS. A test can pass on Chrome but fail on Safari for no real reason. Better to check visually by human eyes.

2. **Optional features** — features that are nice to have but not core to the business (e.g. wishlist, theme settings, profile avatar). Automating these is low priority because even if they break, users can still shop and pay normally.

3. **Low frequency scenarios** — situations that rarely happen in real life (e.g. user changes currency three times in one session, or adds 100 items to cart). The effort to automate these is not worth it compared to focusing on flows that users do every day.

## Section D2 — Go-Live Criteria

Three things I check before releasing:

1. **Testing timeline** — all planned test cases have been executed. If critical tests haven't been run yet, we're not ready.

2. **Defect count and severity** — no critical or high-severity bugs left open. Some minor bugs may be acceptable if the team agrees.

3. **Backward compatibility** — the new version must not break what already works. Run regression tests to confirm old features still behave the same after the update.
