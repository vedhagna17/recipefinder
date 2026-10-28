const express = require("express");
const supabase = require("../supabase");
const { authenticate, requireAdmin } = require("../middleware/auth");
const router = express.Router();
router.get("/users", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("users").select("id,email,name,role,created_at").order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    res.json({ users: data });
  } catch (err) { next(err); }
});
module.exports = router;
