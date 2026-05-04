import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "users.json");
const JWT_SECRET = process.env.JWT_SECRET || "lumina-secret-key-12345";

// Ensure users.json exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

app.use(express.json());
app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.url);
  next();
});
app.use(cookieParser());

// Helper to read/write users
const getUsers = () => JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
const saveUsers = (users: any) => fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// --- Auth Routes ---

app.post("/api/register", async (req, res) => {
  const { email, password, name } = req.body;
  const users = getUsers();

  if (users.find((u: any) => u.email === email)) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: Date.now().toString(), email, name, password: hashedPassword, wishlists: [], comparisons: [] };
  
  users.push(newUser);
  saveUsers(users);

  res.status(201).json({ message: "User created" });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const users = getUsers();
  const user = users.find((u: any) => u.email === email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
  
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

app.get("/api/me", authenticate, (req: any, res) => {
  res.json({ user: req.user });
});

app.post("/api/save-config", authenticate, (req: any, res) => {
  const { config } = req.body;
  const users = getUsers();
  const userIndex = users.findIndex((u: any) => u.id === req.user.id);

  if (userIndex === -1) return res.status(404).json({ message: "User not found" });

  if (!users[userIndex].savedConfigs) users[userIndex].savedConfigs = [];
  users[userIndex].savedConfigs.push({ ...config, id: Date.now().toString(), date: new Date().toISOString() });
  
  saveUsers(users);
  res.json({ message: "Configuration saved" });
});

app.get("/api/saved-configs", authenticate, (req: any, res) => {
  const users = getUsers();
  const user = users.find((u: any) => u.id === req.user.id);
  res.json({ configs: user?.savedConfigs || [] });
});

app.post("/api/save-comparison", authenticate, (req: any, res) => {
  const { modelIds } = req.body;
  const users = getUsers();
  const userIndex = users.findIndex((u: any) => u.id === req.user.id);

  if (userIndex === -1) return res.status(404).json({ message: "User not found" });

  if (!users[userIndex].savedComparisons) users[userIndex].savedComparisons = [];
  users[userIndex].savedComparisons.push({ modelIds, id: Date.now().toString(), date: new Date().toISOString() });
  
  saveUsers(users);
  res.json({ message: "Comparison saved" });
});

app.get("/api/saved-comparisons", authenticate, (req: any, res) => {
  const users = getUsers();
  const user = users.find((u: any) => u.id === req.user.id);
  res.json({ comparisons: user?.savedComparisons || [] });
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.get('*', async (req, res, next) => {
      try {
        console.log('Serving index.html for:', req.originalUrl);
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
