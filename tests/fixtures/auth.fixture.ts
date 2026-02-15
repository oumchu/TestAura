import { test as base } from "@playwright/test";
import { ApiClient } from "./api-client";

type AuthFixtures = {
  apiClient: ApiClient;
  authenticatedApiClient: ApiClient;
};

export const test = base.extend<AuthFixtures>({
  apiClient: async ({ request }, use) => {
    const baseURL = process.env.BASE_URL || "http://localhost:3000";
    const client = new ApiClient(request, baseURL);
    await use(client);
  },

  authenticatedApiClient: async ({ request }, use) => {
    const baseURL = process.env.BASE_URL || "http://localhost:3000";
    const client = new ApiClient(request, baseURL);

    const email = `auto_${Date.now()}@test.com`;
    const password = "AutoTestPass123!";

    const registerRes = await client.register(email, password);
    const registerData = await registerRes.json();
    client.setToken(registerData.token);

    await use(client);
  },
});

export { expect } from "@playwright/test";
