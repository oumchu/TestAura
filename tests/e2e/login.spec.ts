import { test, expect } from "@playwright/test";

const uniqueEmail = () => `e2e_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`;
const PASSWORD = "E2ETestPass123!";

test.describe("Login E2E", () => {
  test.beforeEach(async ({ page }) => {
    const email = uniqueEmail();
    const baseURL = process.env.BASE_URL || "http://localhost:3000";
    await page.request.post(`${baseURL}/auth/register`, {
      data: { email, password: PASSWORD },
    });
    (test.info() as any).email = email;
  });

  test("successful login redirects to products page", async ({ page }) => {
    const email = (test.info() as any).email;
    await page.goto("/login");

    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(PASSWORD);
    await page.getByTestId("login-submit").click();

    await expect(page.getByTestId("login-success")).toBeVisible();
    await page.waitForURL("**/products", { timeout: 5000 });
  });

  test("invalid credentials show error message", async ({ page }) => {
    await page.goto("/login");

    await page.getByTestId("login-email").fill("wrong@email.com");
    await page.getByTestId("login-password").fill("wrongpassword");
    await page.getByTestId("login-submit").click();

    await expect(page.getByTestId("login-error")).toBeVisible();
    await expect(page.getByTestId("login-error")).toHaveText("Invalid email or password");
  });

  test("empty form submission does not proceed", async ({ page }) => {
    await page.goto("/login");

    await page.getByTestId("login-submit").click();

    // Should stay on login page (HTML5 validation prevents submission)
    expect(page.url()).toContain("/login");
  });
});
