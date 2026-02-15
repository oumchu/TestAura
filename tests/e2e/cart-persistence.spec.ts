import { test, expect } from "@playwright/test";

const uniqueEmail = () => `persist_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`;
const PASSWORD = "PersistTestPass123!";

test.describe("Cart Persistence E2E", () => {
  test("cart contents persist after page refresh", async ({ page }) => {
    // Register user via API
    const email = uniqueEmail();
    const baseURL = process.env.BASE_URL || "http://localhost:3000";
    const res = await page.request.post(`${baseURL}/auth/register`, {
      data: { email, password: PASSWORD },
    });
    const data = await res.json();
    const token = data.token;

    // Set auth in browser
    await page.goto("/login");
    await page.evaluate((t) => localStorage.setItem("authToken", t), token);

    // Add item to cart
    await page.goto("/products/2");
    await page.getByTestId("quantity-input").fill("3");
    await page.getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-success")).toBeVisible();

    // Go to cart and verify
    await page.goto("/cart");
    await expect(page.getByTestId("cart-item-name-0")).toHaveText("Running Shoes");
    await expect(page.getByTestId("cart-item-qty-0")).toHaveText("3");

    // Refresh page
    await page.reload();

    // Cart should still have the item (server-side persistence via token)
    await expect(page.getByTestId("cart-item-name-0")).toHaveText("Running Shoes");
    await expect(page.getByTestId("cart-item-qty-0")).toHaveText("3");
    await expect(page.getByTestId("cart-total")).toContainText("$389.97");
  });
});
