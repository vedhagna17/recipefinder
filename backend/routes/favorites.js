const express = require("express");
const supabase = require("../supabase");
const { authenticate } = require("../middleware/auth");
const router = express.Router();
router.use(authenticate);
router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("favorites").select("recipe_id, recipes(id,name,description,category,cooking_time,image_url,ingredients,steps)").eq("user_id", req.user.id);
    if (error) throw error;
    res.json({ favorites: data });
  } catch (err) { next(err); }
});
router.post("/", async (req, res, next) => {
  try {
    const id = req.body?.recipe_id;
    if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: "A valid recipe_id is required." });
    const { error } = await supabase.from("favorites").insert({ user_id: req.user.id, recipe_id: id });
    if (error?.code === "23505") return res.status(409).json({ error: "This recipe is already in your favorites." });
    if (error?.code === "23503") return res.status(404).json({ error: "Recipe not found." });
    if (error) throw error;
    res.status(201).json({ message: "Recipe added to favorites." });
  } catch (err) { next(err); }
});
router.delete("/:recipeId", async (req, res, next) => {
  try {
    const { error } = await supabase.from("favorites").delete().eq("user_id", req.user.id).eq("recipe_id", req.params.recipeId);
    if (error) throw error;
    res.json({ message: "Favorite removed." });
  } catch (err) { next(err); }
});
module.exports = router;
