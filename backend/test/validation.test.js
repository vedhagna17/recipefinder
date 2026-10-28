const test = require("node:test");
const assert = require("node:assert/strict");
const { validateEmail, validatePassword, validateRecipe } = require("../utils/validation");

test("email validation accepts a normal address and rejects malformed input", () => {
  assert.equal(validateEmail("student@example.com"), true);
  assert.equal(validateEmail("not-an-email"), false);
});
test("password validation enforces the configured length", () => {
  assert.equal(validatePassword("strongpass123"), true);
  assert.equal(validatePassword("short"), false);
});
test("recipe validation accepts a complete recipe", () => {
  assert.deepEqual(validateRecipe({
    name: "Tomato pasta", category: "Dinner", cooking_time: 20,
    ingredients: ["Pasta", "Tomato"], steps: ["Boil pasta", "Cook sauce"],
    description: "Easy meal", image_url: null
  }), []);
});
test("recipe validation rejects invalid category and missing steps", () => {
  const errors = validateRecipe({ name: "X", category: "Invalid", cooking_time: 0, ingredients: [], steps: [] });
  assert.ok(errors.length >= 4);
});
