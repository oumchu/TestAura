import express, { Request, Response, NextFunction } from "express";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── In-Memory Data Store ───────────────────────────────────────────

interface User {
  email: string;
  password: string;
  token: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
}

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

const users: User[] = [];
const carts: Map<string, CartItem[]> = new Map();

const products: Product[] = [
  { id: 1, name: "Wireless Headphones", price: 79.99, description: "Bluetooth over-ear headphones with noise cancellation", category: "Electronics" },
  { id: 2, name: "Running Shoes", price: 129.99, description: "Lightweight running shoes with cushioned sole", category: "Sports" },
  { id: 3, name: "Coffee Maker", price: 49.99, description: "12-cup programmable coffee maker", category: "Kitchen" },
  { id: 4, name: "Backpack", price: 59.99, description: "Water-resistant laptop backpack", category: "Accessories" },
  { id: 5, name: "Wireless Mouse", price: 29.99, description: "Ergonomic wireless mouse with USB receiver", category: "Electronics" },
];

// ─── Helper Functions ───────────────────────────────────────────────

function generateToken(email: string): string {
  return Buffer.from(`${email}:${Date.now()}`).toString("base64");
}

function wantsHtml(req: Request): boolean {
  const accept = req.headers.accept || "";
  return accept.includes("text/html");
}

function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
    return;
  }
  const token = authHeader.split(" ")[1];
  const user = users.find((u) => u.token === token);
  if (!user) {
    res.status(401).json({ error: "Unauthorized: Invalid token" });
    return;
  }
  (req as any).user = user;
  next();
}

// ─── HTML Layout ────────────────────────────────────────────────────

const htmlLayout = (title: string, body: string) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${title}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; }
  nav { background: #333; padding: 10px 20px; margin-bottom: 20px; }
  nav a { color: white; margin-right: 15px; text-decoration: none; }
  .product-card { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
  .cart-item { border-bottom: 1px solid #eee; padding: 10px 0; }
  input, button { padding: 10px; margin: 5px 0; font-size: 14px; }
  input { width: 300px; border: 1px solid #ccc; border-radius: 4px; }
  button { background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
  button:hover { background: #0056b3; }
  .error { color: red; margin: 10px 0; }
  .success { color: green; margin: 10px 0; }
</style>
</head>
<body>
<nav>
  <a href="/login" data-testid="nav-login">Login</a>
  <a href="/register" data-testid="nav-register">Register</a>
  <a href="/products" data-testid="nav-products">Products</a>
  <a href="/cart" data-testid="nav-cart">Cart</a>
</nav>
${body}
<script>
  window.authToken = localStorage.getItem('authToken');
  window.userEmail = localStorage.getItem('userEmail');
</script>
</body>
</html>`;

// ─── Auth Routes (API only) ─────────────────────────────────────────

app.post("/auth/register", (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  if (users.find((u) => u.email === email)) {
    res.status(409).json({ error: "User already exists" });
    return;
  }
  const token = generateToken(email);
  users.push({ email, password, token });
  res.status(201).json({ message: "User registered successfully", token, email });
});

app.post("/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  user.token = generateToken(email);
  res.status(200).json({ message: "Login successful", token: user.token, email });
});

// ─── Register Page (UI) ─────────────────────────────────────────────

app.get("/register", (_req: Request, res: Response) => {
  res.send(htmlLayout("Register", `
    <h1>Register</h1>
    <form id="register-form" data-testid="register-form">
      <div><input type="email" name="email" placeholder="Email" data-testid="register-email" required /></div>
      <div><input type="password" name="password" placeholder="Password" data-testid="register-password" required /></div>
      <div><button type="submit" data-testid="register-submit">Register</button></div>
    </form>
    <div id="message" data-testid="register-message"></div>
    <script>
      document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const res = await fetch('/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email.value, password: form.password.value })
        });
        const data = await res.json();
        const msg = document.getElementById('message');
        if (res.ok) {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('userEmail', data.email);
          msg.className = 'success';
          msg.textContent = 'Registration successful! Redirecting...';
          msg.setAttribute('data-testid', 'register-success');
          setTimeout(() => window.location.href = '/products', 1000);
        } else {
          msg.className = 'error';
          msg.textContent = data.error;
          msg.setAttribute('data-testid', 'register-error');
        }
      });
    </script>
  `));
});

// ─── Login Page (UI) ────────────────────────────────────────────────

app.get("/login", (_req: Request, res: Response) => {
  res.send(htmlLayout("Login", `
    <h1>Login</h1>
    <form id="login-form" data-testid="login-form">
      <div><input type="email" name="email" placeholder="Email" data-testid="login-email" required /></div>
      <div><input type="password" name="password" placeholder="Password" data-testid="login-password" required /></div>
      <div><button type="submit" data-testid="login-submit">Login</button></div>
    </form>
    <div id="message" data-testid="login-message"></div>
    <script>
      document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const res = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email.value, password: form.password.value })
        });
        const data = await res.json();
        const msg = document.getElementById('message');
        if (res.ok) {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('userEmail', data.email);
          msg.className = 'success';
          msg.textContent = 'Login successful! Redirecting...';
          msg.setAttribute('data-testid', 'login-success');
          setTimeout(() => window.location.href = '/products', 1000);
        } else {
          msg.className = 'error';
          msg.textContent = data.error;
          msg.setAttribute('data-testid', 'login-error');
        }
      });
    </script>
  `));
});

// ─── Products: serves HTML (browser) or JSON (API) ──────────────────

app.get("/products", (req: Request, res: Response) => {
  if (wantsHtml(req)) {
    res.send(htmlLayout("Products", `
      <h1>Products</h1>
      <form id="search-form" data-testid="search-form" style="margin-bottom:20px;">
        <input type="text" name="q" placeholder="Search products..." data-testid="search-input" />
        <button type="submit" data-testid="search-submit">Search</button>
      </form>
      <div id="products-list" data-testid="products-list"></div>
      <script>
        async function loadProducts(query) {
          const url = query ? '/products/search?q=' + encodeURIComponent(query) : '/api/products';
          const res = await fetch(url);
          const data = await res.json();
          const list = document.getElementById('products-list');
          list.innerHTML = data.products.map(p =>
            '<div class="product-card" data-testid="product-card">' +
            '<h3><a href="/products/' + p.id + '" data-testid="product-link-' + p.id + '">' + p.name + '</a></h3>' +
            '<p data-testid="product-price-' + p.id + '">$' + p.price.toFixed(2) + '</p>' +
            '<p>' + p.description + '</p>' +
            '<p><em>' + p.category + '</em></p>' +
            '</div>'
          ).join('');
          if (data.products.length === 0) {
            list.innerHTML = '<p data-testid="no-results">No products found</p>';
          }
        }
        document.getElementById('search-form').addEventListener('submit', (e) => {
          e.preventDefault();
          loadProducts(e.target.q.value);
        });
        loadProducts();
      </script>
    `));
    return;
  }
  res.json({ products });
});

// JSON-only endpoint for the HTML page's internal fetch calls
app.get("/api/products", (_req: Request, res: Response) => {
  res.json({ products });
});

// Products: Search (always JSON)
app.get("/products/search", (req: Request, res: Response) => {
  const query = (req.query.q as string || "").toLowerCase();
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
  );
  res.json({ products: filtered, query });
});

// ─── Product Detail ──────────────────────────────────────────────────

app.get("/products/:id", (req: Request, res: Response) => {
  const product = products.find((p) => p.id === parseInt(req.params.id as string));
  if (!product) {
    if (wantsHtml(req)) {
      res.status(404).send(htmlLayout("Not Found", "<h1>Product not found</h1>"));
    } else {
      res.status(404).json({ error: "Product not found" });
    }
    return;
  }
  if (wantsHtml(req)) {
    res.send(htmlLayout(product.name, `
      <h1 data-testid="product-name">${product.name}</h1>
      <p data-testid="product-price">$${product.price.toFixed(2)}</p>
      <p data-testid="product-description">${product.description}</p>
      <p data-testid="product-category">Category: ${product.category}</p>
      <div style="margin-top:20px;">
        <input type="number" id="quantity" value="1" min="1" max="10" data-testid="quantity-input" style="width:60px;" />
        <button id="add-to-cart" data-testid="add-to-cart">Add to Cart</button>
      </div>
      <div id="message" data-testid="cart-message"></div>
      <script>
        document.getElementById('add-to-cart').addEventListener('click', async () => {
          const token = localStorage.getItem('authToken');
          const msg = document.getElementById('message');
          if (!token) {
            msg.className = 'error';
            msg.textContent = 'Please login first';
            return;
          }
          const quantity = parseInt(document.getElementById('quantity').value);
          const res = await fetch('/cart/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ productId: ${product.id}, quantity })
          });
          const data = await res.json();
          if (res.ok) {
            msg.className = 'success';
            msg.textContent = 'Added to cart!';
            msg.setAttribute('data-testid', 'cart-success');
          } else {
            msg.className = 'error';
            msg.textContent = data.error;
          }
        });
      </script>
    `));
    return;
  }
  res.json({ product });
});

// ─── Cart: serves HTML (browser) or JSON (API with auth) ────────────

app.get("/cart", (req: Request, res: Response) => {
  if (wantsHtml(req)) {
    res.send(htmlLayout("Cart", `
      <h1>Shopping Cart</h1>
      <div id="cart-contents" data-testid="cart-contents"></div>
      <div id="cart-total" data-testid="cart-total" style="font-size:1.2em;font-weight:bold;margin-top:20px;"></div>
      <div id="message" data-testid="cart-message"></div>
      <script>
        async function loadCart() {
          const token = localStorage.getItem('authToken');
          const contents = document.getElementById('cart-contents');
          const totalEl = document.getElementById('cart-total');
          const msg = document.getElementById('message');
          if (!token) {
            msg.className = 'error';
            msg.textContent = 'Please login to view cart';
            return;
          }
          const res = await fetch('/api/cart', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const data = await res.json();
          if (data.cart.length === 0) {
            contents.innerHTML = '<p data-testid="empty-cart">Your cart is empty</p>';
            totalEl.textContent = '';
            return;
          }
          contents.innerHTML = data.cart.map((item, i) =>
            '<div class="cart-item" data-testid="cart-item-' + i + '">' +
            '<strong data-testid="cart-item-name-' + i + '">' + item.name + '</strong>' +
            ' | Qty: <span data-testid="cart-item-qty-' + i + '">' + item.quantity + '</span>' +
            ' | Price: <span data-testid="cart-item-price-' + i + '">$' + item.price.toFixed(2) + '</span>' +
            ' | Subtotal: $' + (item.price * item.quantity).toFixed(2) +
            '</div>'
          ).join('');
          totalEl.textContent = 'Total: $' + data.total.toFixed(2);
        }
        loadCart();
      </script>
    `));
    return;
  }
  // API mode: requires auth
  authenticateToken(req, res, () => {
    const user = (req as any).user as User;
    const cart = carts.get(user.email) || [];
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    res.json({ cart, total: Math.round(total * 100) / 100 });
  });
});

// JSON-only cart endpoint for the HTML page's internal fetch calls
app.get("/api/cart", authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const cart = carts.get(user.email) || [];
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  res.json({ cart, total: Math.round(total * 100) / 100 });
});

// Cart: Add item (API only, requires auth)
app.post("/cart/items", authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { productId, quantity } = req.body;

  if (!productId || !quantity || quantity < 1) {
    res.status(400).json({ error: "productId and quantity (>= 1) are required" });
    return;
  }

  const product = products.find((p) => p.id === productId);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const cart = carts.get(user.email) || [];
  const existingItem = cart.find((item) => item.productId === productId);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
    });
  }

  carts.set(user.email, cart);
  res.status(200).json({ message: "Item added to cart", cart });
});

// ─── Root Redirect ──────────────────────────────────────────────────

app.get("/", (_req: Request, res: Response) => {
  res.redirect("/login");
});

// ─── Start Server ───────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || "3000");
app.listen(PORT, () => {
  console.log(`Mock e-commerce server running on http://localhost:${PORT}`);
  console.log("Routes: /register, /login, /products, /product/:id, /cart");
  console.log("API: POST /auth/register, POST /auth/login, GET /products, GET /products/search?q=, POST /cart/items, GET /cart");
});
