import express from "express";
import cors from "cors";
import { readFileSync } from "fs";
import path from "path";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import habitRoutes from "./routes/habits.js";
import logRoutes from "./routes/logs.js";
import aiRoutes from "./routes/ai.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

// Explicitly load repo-root .env without adding any new dependencies
try {
  let envPath = path.resolve(process.cwd(), ".env");
  let raw;
  try {
    raw = readFileSync(envPath, "utf8");
  } catch (err) {
    // If not found in CWD, look in the parent directory of this script (repo root)
    envPath = path.resolve(import.meta.dirname, "../.env");
    raw = readFileSync(envPath, "utf8");
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
} catch (e) {
  console.warn("Warning: could not read .env from repo root. Backend may not start.");
}

const app = express();

// Configure allowed origins for CORS
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Middleware setup
app.use(cors(corsOptions));
// Express v5 needs a safer option handler than path-to-regexp "*".
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return cors(corsOptions)(req, res, next);
  }
  return next();
});
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/ai", aiRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Connect to the database and start the server
const PORT = process.env.PORT || 8000;

// IMPORTANT: Only start the server if DB connection succeeds
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("CRITICAL: Database connection failed. Server will not start.");
    process.exit(1);
  }
};

startServer();

