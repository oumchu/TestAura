export const TEST_USER = {
  email: `testuser_${Date.now()}@test.com`,
  password: "SecurePass123!",
};

export const SEEDED_PRODUCTS = [
  { id: 1, name: "Wireless Headphones", price: 79.99, category: "Electronics" },
  { id: 2, name: "Running Shoes", price: 129.99, category: "Sports" },
  { id: 3, name: "Coffee Maker", price: 49.99, category: "Kitchen" },
  { id: 4, name: "Backpack", price: 59.99, category: "Accessories" },
  { id: 5, name: "Wireless Mouse", price: 29.99, category: "Electronics" },
];

export const SEARCH_TERM = "wireless";
export const EXPECTED_SEARCH_RESULTS = SEEDED_PRODUCTS.filter((p) =>
  p.name.toLowerCase().includes(SEARCH_TERM)
);
