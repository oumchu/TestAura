import { APIRequestContext } from "@playwright/test";

export class ApiClient {
  private baseURL: string;
  private request: APIRequestContext;
  private token: string | null = null;

  constructor(request: APIRequestContext, baseURL: string) {
    this.request = request;
    this.baseURL = baseURL;
  }

  private headers() {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.token) h["Authorization"] = `Bearer ${this.token}`;
    return h;
  }

  setToken(token: string) {
    this.token = token;
  }

  async register(email: string, password: string) {
    return this.request.post(`${this.baseURL}/auth/register`, {
      data: { email, password },
      headers: this.headers(),
    });
  }

  async login(email: string, password: string) {
    return this.request.post(`${this.baseURL}/auth/login`, {
      data: { email, password },
      headers: this.headers(),
    });
  }

  async getProducts() {
    return this.request.get(`${this.baseURL}/products`);
  }

  async searchProducts(query: string) {
    return this.request.get(`${this.baseURL}/products/search?q=${encodeURIComponent(query)}`);
  }

  async getProduct(id: number) {
    return this.request.get(`${this.baseURL}/products/${id}`);
  }

  async addToCart(productId: number, quantity: number) {
    return this.request.post(`${this.baseURL}/cart/items`, {
      data: { productId, quantity },
      headers: this.headers(),
    });
  }

  async getCart() {
    return this.request.get(`${this.baseURL}/cart`, {
      headers: this.headers(),
    });
  }
}
