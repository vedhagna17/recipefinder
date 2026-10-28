const express = require("express");
const supabase = require("../supabase");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { validateRecipe } = require("../utils/validation");
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("recipes").select("id,name,description,category,cooking_time,image_url,ingredients,steps,created_at,updated_at").order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ recipes: data });
  } catch (err) { next(err); }
});
router.post("/", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const errors = validateRecipe(req.body || {});
    if (errors.length) return res.status(400).json({ error: errors.join(" ") });
    const b = req.body;
    const { data, error } = await supabase.from("recipes").insert({
      name: b.name.trim(), description: (b.description || "").trim(), category: b.category,
      cooking_time: Number(b.cooking_time), image_url: b.image_url || null,
      ingredients: b.ingredients.map(x => x.trim()), steps: b.steps.map(x => x.trim())
    }).select().single();
    if (error) throw error;
    res.status(201).json({ recipe: data });
  } catch (err) { next(err); }
});
router.put("/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const errors = validateRecipe(req.body || {});
    if (errors.length) return res.status(400).json({ error: errors.join(" ") });
    const b = req.body;
    const { data, error } = await supabase.from("recipes").update({
      name: b.name.trim(), description: (b.description || "").trim(), category: b.category,
      cooking_time: Number(b.cooking_time), image_url: b.image_url || null,
      ingredients: b.ingredients.map(x => x.trim()), steps: b.steps.map(x => x.trim())
    }).eq("id", req.params.id).select().maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Recipe not found." });
    res.json({ recipe: data });
  } catch (err) { next(err); }
});
router.delete("/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("recipes").delete().eq("id", req.params.id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Recipe not found." });
    res.json({ message: "Recipe deleted." });
  } catch (err) { next(err); }
});
module.exports = router;
