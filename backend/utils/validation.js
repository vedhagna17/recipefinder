const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const categories = ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert"];
function validateEmail(email) {
  return typeof email === "string" && email.length <= 254 && emailPattern.test(email);
}
function validatePassword(password) {
  return typeof password === "string" && password.length >= 8 && password.length <= 128;
}
function validateRecipe(body) {
  const errors = [];
  if (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 120) errors.push("Recipe name must be 2–120 characters.");
  if (!categories.includes(body.category)) errors.push("Choose a valid recipe category.");
  if (!Number.isInteger(Number(body.cooking_time)) || Number(body.cooking_time) < 1 || Number(body.cooking_time) > 600) errors.push("Cooking time must be between 1 and 600 minutes.");
  if (!Array.isArray(body.ingredients) || body.ingredients.length < 1 || body.ingredients.length > 60 || body.ingredients.some(x => typeof x !== "string" || !x.trim() || x.length > 200)) errors.push("Provide 1–60 valid ingredients.");
  if (!Array.isArray(body.steps) || body.steps.length < 1 || body.steps.length > 40 || body.steps.some(x => typeof x !== "string" || !x.trim() || x.length > 1000)) errors.push("Provide 1–40 valid preparation steps.");
  if (body.description != null && (typeof body.description !== "string" || body.description.length > 500)) errors.push("Description must be 500 characters or fewer.");
  if (body.image_url != null && body.image_url !== "") {
    try { const u = new URL(body.image_url); if (!["http:", "https:"].includes(u.protocol)) throw new Error(); }
    catch { errors.push("Image URL must be a valid HTTP or HTTPS URL."); }
  }
  return errors;
}
module.exports = { validateEmail, validatePassword, validateRecipe };
