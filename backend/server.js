require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const supabase = require("./supabase");
const authRoutes = require("./routes/auth");
const recipeRoutes = require("./routes/recipes");
const favoriteRoutes = require("./routes/favorites");
const adminRoutes = require("./routes/admin");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.startsWith("REPLACE_")) {
  throw new Error("Set JWT_SECRET to a random secret of at least 32 characters in backend/.env.");
}
const app = express();
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "20kb" }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Too many authentication attempts. Try again in 15 minutes." } });
app.use("/api/auth", authLimiter);
app.get("/api/health", async (req, res) => {
  try {
    const { error } = await supabase.from("recipes").select("id", { head: true, count: "exact" });
    if (error) throw error;
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "unavailable", message: "Check Supabase configuration and database schema." });
  }
});
app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/admin", adminRoutes);
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.use("/api", (req, res) => res.status(404).json({ error: "API endpoint not found." }));
app.use((err, req, res, next) => {
  // Log server-side details for the developer, not to the browser.
  console.error("Request failed:", err.message || "Unknown error");
  res.status(500).json({ error: "The server could not complete this request. Check the server terminal and configuration." });
});
const port = Number(process.env.PORT) || 3000;
if (require.main === module) {
  app.listen(port, () => console.log(`Recipe Finder running at http://localhost:${port}`));
}
module.exports = app;
