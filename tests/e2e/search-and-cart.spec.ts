import { test, expect } from "@playwright/test";

const uniqueEmail = () => `cart_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`;
const PASSWORD = "CartTestPass123!";

test.describe("Search and Add to Cart E2E", () => {
  let authToken: string;
  let userEmail: string;

  test.beforeEach(async ({ page }) => {
    // Register and get token via API
    userEmail = uniqueEmail();
    const baseURL = process.env.BASE_URL || "http://localhost:3000";
    const res = await page.request.post(`${baseURL}/auth/register`, {
      data: { email: userEmail, password: PASSWORD },
    });
    const data = await res.json();
    authToken = data.token;

    // Set auth token in localStorage before navigating
    await page.goto("/login");
    await page.evaluate((token) => {
      localStorage.setItem("authToken", token);
    }, authToken);
  });

  test("search for product and view details", async ({ page }) => {
    await page.goto("/products");

    await page.getByTestId("search-input").fill("wireless");
    await page.getByTestId("search-submit").click();

    // Should show 2 results (Wireless Headphones + Wireless Mouse)
    const cards = page.getByTestId("product-card");
    await expect(cards).toHaveCount(2);

    // Click first product link
    await page.getByTestId("product-link-1").click();

    // Verify product detail page
    await expect(page.getByTestId("product-name")).toHaveText("Wireless Headphones");
    await expect(page.getByTestId("product-price")).toHaveText("$79.99");
  });

  test("add product to cart and verify cart contents", async ({ page }) => {
    // Navigate to product detail
    await page.goto("/products/1");

    // Set quantity and add to cart
    await page.getByTestId("quantity-input").fill("2");
    await page.getByTestId("add-to-cart").click();

    await expect(page.getByTestId("cart-success")).toBeVisible();

    // Navigate to cart page
    await page.goto("/cart");

    // Verify cart contents
    await expect(page.getByTestId("cart-item-name-0")).toHaveText("Wireless Headphones");
    await expect(page.getByTestId("cart-item-qty-0")).toHaveText("2");
    await expect(page.getByTestId("cart-item-price-0")).toHaveText("$79.99");
    await expect(page.getByTestId("cart-total")).toContainText("$159.98");
  });

  test("add multiple products to cart", async ({ page }) => {
    // Add first product
    await page.goto("/products/1");
    await page.getByTestId("quantity-input").fill("1");
    await page.getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-success")).toBeVisible();

    // Add second product
    await page.goto("/products/3");
    await page.getByTestId("quantity-input").fill("2");
    await page.getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-success")).toBeVisible();

    // Verify cart
    await page.goto("/cart");
    await expect(page.getByTestId("cart-item-name-0")).toHaveText("Wireless Headphones");
    await expect(page.getByTestId("cart-item-name-1")).toHaveText("Coffee Maker");
    await expect(page.getByTestId("cart-item-qty-1")).toHaveText("2");
    // Total: 79.99 + (49.99 * 2) = 179.97
    await expect(page.getByTestId("cart-total")).toContainText("$179.97");
  });
});
