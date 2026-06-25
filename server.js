require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const morgan  = require("morgan");

const app = express();

// ── Helmet — disable headers that block cross-origin frontend access ──
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy:   false,
  contentSecurityPolicy:     false,
}));

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── CORS ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin.includes("riuc-frontend") ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      origin === process.env.FRONTEND_URL
    ) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ── Routes ────────────────────────────────────────────────────────────
app.use("/api/auth",      require("./routes/auth"));
app.use("/api/papers",    require("./routes/papers"));
app.use("/api/bookmarks", require("./routes/bookmarks"));
app.use("/api/upvotes",   require("./routes/upvotes"));
app.use("/api/users",     require("./routes/users"));
app.use("/api/upload",    require("./routes/upload"));

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "PastPapers RIUC API is running 🎓", version: "1.0.0" });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", uptime: process.uptime() });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found", path: req.originalUrl });
});

app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS policy violation" });
  }
  console.error("[ERROR]", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

module.exports = app;
