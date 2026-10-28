const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../supabase");
const { authenticate } = require("../middleware/auth");
const { validateEmail, validatePassword } = require("../utils/validation");
const router = express.Router();

function issueToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: "8h", issuer: "recipe-finder" });
}
router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80) return res.status(400).json({ error: "Name must be 2–80 characters." });
    if (!validateEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
    if (!validatePassword(password)) return res.status(400).json({ error: "Password must be 8–128 characters." });
    const normalizedEmail = email.trim().toLowerCase();
    const { data: existing, error: lookupError } = await supabase.from("users").select("id").eq("email", normalizedEmail).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) return res.status(409).json({ error: "An account with this email already exists." });
    const password_hash = await bcrypt.hash(password, 12);
    const { data: user, error } = await supabase.from("users").insert({
      name: name.trim(), email: normalizedEmail, password_hash, role: "user"
    }).select("id,email,name,role").single();
    if (error) {
      if (error.code === "23505") return res.status(409).json({ error: "An account with this email already exists." });
      throw error;
    }
    res.status(201).json({ token: issueToken(user), user });
  } catch (err) { next(err); }
});
router.post("/signin", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!validateEmail(email) || !validatePassword(password)) return res.status(400).json({ error: "Enter a valid email and password (at least 8 characters)." });
    const { data: user, error } = await supabase.from("users")
      .select("id,email,name,role,password_hash").eq("email", email.trim().toLowerCase()).maybeSingle();
    if (error) throw error;
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: "Incorrect email or password." });
    const safeUser = { id: user.id, email: user.email, name: user.name, role: user.role };
    res.json({ token: issueToken(safeUser), user: safeUser });
  } catch (err) { next(err); }
});
router.get("/me", authenticate, (req, res) => res.json({ user: req.user }));
module.exports = router;
