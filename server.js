require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    "http://localhost:5500",
    "http://127.0.0.1:5500"
  ].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use("/api/auth",      require("./routes/auth"));
app.use("/api/papers",    require("./routes/papers"));
app.use("/api/bookmarks", require("./routes/bookmarks"));
app.use("/api/upvotes",   require("./routes/upvotes"));
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
  console.error("[ERROR]", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

module.exports = app;
