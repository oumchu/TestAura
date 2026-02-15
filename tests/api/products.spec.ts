import { test, expect } from "../fixtures/auth.fixture";
import { SEEDED_PRODUCTS, SEARCH_TERM, EXPECTED_SEARCH_RESULTS } from "../fixtures/test-data";

test.describe("Products API", () => {
  test("GET /products - returns all products", async ({ apiClient }) => {
    const res = await apiClient.getProducts();
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.products).toHaveLength(SEEDED_PRODUCTS.length);

    for (const expected of SEEDED_PRODUCTS) {
      const found = body.products.find((p: any) => p.id === expected.id);
      expect(found).toBeTruthy();
      expect(found.name).toBe(expected.name);
      expect(found.price).toBe(expected.price);
    }
  });

  test("GET /products/search - filters by query", async ({ apiClient }) => {
    const res = await apiClient.searchProducts(SEARCH_TERM);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.products).toHaveLength(EXPECTED_SEARCH_RESULTS.length);
    expect(body.query).toBe(SEARCH_TERM);

    for (const product of body.products) {
      const nameOrDesc = (product.name + product.description).toLowerCase();
      expect(nameOrDesc).toContain(SEARCH_TERM);
    }
  });

  test("GET /products/search - empty query returns all", async ({ apiClient }) => {
    const res = await apiClient.searchProducts("");
    const body = await res.json();
    expect(body.products).toHaveLength(SEEDED_PRODUCTS.length);
  });

  test("GET /products/:id - returns single product", async ({ apiClient }) => {
    const res = await apiClient.getProduct(1);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.product.id).toBe(1);
    expect(body.product.name).toBe("Wireless Headphones");
    expect(body.product.price).toBe(79.99);
  });

  test("GET /products/:id - invalid id returns 404", async ({ apiClient }) => {
    const res = await apiClient.getProduct(999);
    expect(res.status()).toBe(404);
  });
});
