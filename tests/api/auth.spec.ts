import { test, expect } from "../fixtures/auth.fixture";

const uniqueEmail = () => `user_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`;
const PASSWORD = "TestPass123!";

test.describe("Auth API", () => {
  test("POST /auth/register - successful registration", async ({ apiClient }) => {
    const res = await apiClient.register(uniqueEmail(), PASSWORD);
    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.token).toBeTruthy();
    expect(body.email).toContain("@test.com");
    expect(body.message).toBe("User registered successfully");
  });

  test("POST /auth/register - duplicate email returns 409", async ({ apiClient }) => {
    const email = uniqueEmail();
    await apiClient.register(email, PASSWORD);

    const res = await apiClient.register(email, PASSWORD);
    expect(res.status()).toBe(409);

    const body = await res.json();
    expect(body.error).toBe("User already exists");
  });

  test("POST /auth/register - missing fields returns 400", async ({ apiClient }) => {
    const res = await apiClient.register("", "");
    expect(res.status()).toBe(400);
  });

  test("POST /auth/login - successful login", async ({ apiClient }) => {
    const email = uniqueEmail();
    await apiClient.register(email, PASSWORD);

    const res = await apiClient.login(email, PASSWORD);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.token).toBeTruthy();
    expect(body.message).toBe("Login successful");
  });

  test("POST /auth/login - invalid credentials returns 401", async ({ apiClient }) => {
    const res = await apiClient.login("nonexistent@test.com", "wrongpass");
    expect(res.status()).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("Invalid email or password");
  });
});
