import { test, expect } from "../fixtures/auth.fixture";

test.describe("Cart API", () => {
  test("POST /cart/items - add item to cart", async ({ authenticatedApiClient }) => {
    const res = await authenticatedApiClient.addToCart(1, 2);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.message).toBe("Item added to cart");
    expect(body.cart).toHaveLength(1);
    expect(body.cart[0].productId).toBe(1);
    expect(body.cart[0].name).toBe("Wireless Headphones");
    expect(body.cart[0].price).toBe(79.99);
    expect(body.cart[0].quantity).toBe(2);
  });

  test("POST /cart/items - adding same product increases quantity", async ({ authenticatedApiClient }) => {
    await authenticatedApiClient.addToCart(1, 1);
    const res = await authenticatedApiClient.addToCart(1, 3);
    const body = await res.json();

    expect(body.cart).toHaveLength(1);
    expect(body.cart[0].quantity).toBe(4);
  });

  test("POST /cart/items - add multiple different products", async ({ authenticatedApiClient }) => {
    await authenticatedApiClient.addToCart(1, 1);
    const res = await authenticatedApiClient.addToCart(3, 2);
    const body = await res.json();

    expect(body.cart).toHaveLength(2);
    expect(body.cart[0].name).toBe("Wireless Headphones");
    expect(body.cart[1].name).toBe("Coffee Maker");
  });

  test("GET /cart - returns cart contents with total", async ({ authenticatedApiClient }) => {
    await authenticatedApiClient.addToCart(1, 2);
    await authenticatedApiClient.addToCart(3, 1);

    const res = await authenticatedApiClient.getCart();
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.cart).toHaveLength(2);
    // 79.99 * 2 + 49.99 * 1 = 209.97
    expect(body.total).toBe(209.97);
  });

  test("GET /cart - empty cart returns empty array", async ({ authenticatedApiClient }) => {
    const res = await authenticatedApiClient.getCart();
    const body = await res.json();

    expect(body.cart).toHaveLength(0);
    expect(body.total).toBe(0);
  });

  test("POST /cart/items - unauthenticated request returns 401", async ({ apiClient }) => {
    const res = await apiClient.addToCart(1, 1);
    expect(res.status()).toBe(401);
  });

  test("POST /cart/items - invalid product returns 404", async ({ authenticatedApiClient }) => {
    const res = await authenticatedApiClient.addToCart(999, 1);
    expect(res.status()).toBe(404);
  });
});
