const API = "/api";
const state = { token: localStorage.getItem("rf_token"), user: null, recipes: [], favorites: new Set(), authMode: "signin" };
const $ = (id) => document.getElementById(id);
const grid = $("recipeGrid"), favoritesGrid = $("favoritesGrid"), message = $("message");

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}
function toast(text) {
  const el = $("toast"); el.textContent = text; el.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2600);
}
async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && state.token) clearSession(false);
    throw new Error(data.error || "Something went wrong. Please try again.");
  }
  return data;
}
function showMessage(text, isError = true) {
  message.textContent = text; message.classList.remove("hidden", "success");
  if (!isError) message.classList.add("success");
}
function hideMessage() { message.classList.add("hidden"); }
function recipeCard(recipe, inFavorites = false) {
  const favorite = state.favorites.has(recipe.id);
  const emoji = ({Breakfast:"🥞",Lunch:"🥗",Dinner:"🍝",Snack:"🥪",Dessert:"🍓"})[recipe.category] || "🍲";
  const visual = recipe.image_url
    ? `<img src="${escapeHtml(recipe.image_url)}" alt="${escapeHtml(recipe.name)}" loading="lazy" onerror="this.remove()">`
    : `<span class="recipe-emoji" aria-hidden="true">${emoji}</span>`;
  return `<article class="recipe-card">
    <div class="recipe-visual">${visual}<span class="category-pill">${escapeHtml(recipe.category)}</span>
      <button class="favorite-button ${favorite ? "active" : ""}" data-favorite="${recipe.id}" aria-label="${favorite ? "Remove from" : "Add to"} favorites" title="Toggle favorite">${favorite ? "♥" : "♡"}</button>
    </div>
    <div class="recipe-content"><h3>${escapeHtml(recipe.name)}</h3><p>${escapeHtml(recipe.description || "A delicious recipe to try at home.")}</p>
      <div class="recipe-meta"><span>◷ ${Number(recipe.cooking_time)} min</span><strong>${(recipe.ingredients || []).length} ingredients</strong></div>
      <div class="card-actions"><button class="button button-outline" data-details="${recipe.id}">View recipe</button>
      ${inFavorites ? `<button class="button button-quiet" data-favorite="${recipe.id}">Remove</button>` : ""}
      ${state.user?.role === "admin" ? `<button class="button button-quiet" data-edit="${recipe.id}">Edit</button><button class="button button-quiet" data-delete="${recipe.id}">Delete</button>` : ""}</div>
    </div></article>`;
}
function renderRecipes(list = state.recipes) {
  $("resultCount").textContent = `${list.length} recipe${list.length === 1 ? "" : "s"} found`;
  grid.innerHTML = list.length ? list.map(r => recipeCard(r)).join("") : `<div class="empty-state"><strong>No recipes found yet</strong>Try a different name or ingredient.</div>`;
  renderFavorites();
}
function renderFavorites() {
  if (!state.user) {
    favoritesGrid.innerHTML = `<div class="empty-state"><strong>Your recipe box is waiting</strong>Sign in to save recipes for later.</div>`;
    return;
  }
  const saved = state.recipes.filter(r => state.favorites.has(r.id));
  favoritesGrid.innerHTML = saved.length ? saved.map(r => recipeCard(r, true)).join("") : `<div class="empty-state"><strong>No favorites yet</strong>Tap the heart on a recipe you love.</div>`;
}
function setAuthUI() {
  $("authButton").textContent = state.user ? `${state.user.name || state.user.email}` : "Sign in";
  $("logoutButton").classList.toggle("hidden", !state.user);
  $("adminSection").classList.toggle("hidden", state.user?.role !== "admin");
}
function clearSession(showToast = true) {
  state.token = null; state.user = null; state.favorites.clear(); localStorage.removeItem("rf_token");
  setAuthUI(); renderFavorites();
  if (showToast) toast("You have signed out.");
}
async function loadMe() {
  if (!state.token) { setAuthUI(); return; }
  try {
    const data = await api("/auth/me"); state.user = data.user;
    await loadFavorites(); setAuthUI();
  } catch { clearSession(false); }
}
async function loadRecipes() {
  try {
    const data = await api("/recipes"); state.recipes = data.recipes || []; renderRecipes();
    hideMessage();
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><strong>Could not load recipes</strong>${escapeHtml(err.message)} Check the server and Supabase setup.</div>`;
    $("resultCount").textContent = "Recipes unavailable";
  }
}
async function loadFavorites() {
  if (!state.user) return;
  const data = await api("/favorites"); state.favorites = new Set((data.favorites || []).map(r => r.recipe_id));
  renderRecipes();
}
function searchRecipes() {
  const query = $("searchInput").value.trim().toLowerCase();
  const ingredients = $("ingredientInput").value.split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
  const category = $("categoryFilter").value;
  const results = state.recipes.filter(r => {
    const textMatch = !query || r.name.toLowerCase().includes(query) || (r.description || "").toLowerCase().includes(query);
    const categoryMatch = !category || r.category === category;
    const available = (r.ingredients || []).join(" ").toLowerCase();
    const ingredientMatch = !ingredients.length || ingredients.some(item => available.includes(item));
    return textMatch && categoryMatch && ingredientMatch;
  });
  renderRecipes(results);
}
function openAuth(mode = "signin") {
  state.authMode = mode; $("authTitle").textContent = mode === "signin" ? "Sign in" : "Create your account";
  $("authIntro").textContent = mode === "signin" ? "Sign in to save your favorite recipes." : "Join us and keep your favorite meals close.";
  $("authSubmit").textContent = mode === "signin" ? "Sign in" : "Create account";
  $("nameWrap").classList.toggle("hidden", mode === "signin");
  $("authName").required = mode === "signup";
  $("authPassword").autocomplete = mode === "signin" ? "current-password" : "new-password";
  $("switchText").textContent = mode === "signin" ? "New here?" : "Already have an account?";
  $("switchAuth").textContent = mode === "signin" ? "Create an account" : "Sign in instead";
  $("authError").textContent = "";
  $("authDialog").showModal();
}
async function showRecipe(id) {
  const recipe = state.recipes.find(r => r.id === id);
  if (!recipe) return;
  const steps = (recipe.steps || []).map((step, i) => `<li><strong>Step ${i + 1}.</strong> ${escapeHtml(step)}</li>`).join("");
  const ingredients = (recipe.ingredients || []).map(item => `<li>${escapeHtml(item)}</li>`).join("");
  const detail = document.createElement("dialog"); detail.className = "dialog";
  detail.innerHTML = `<button class="dialog-close" aria-label="Close">×</button><span class="eyebrow">${escapeHtml(recipe.category)} · ${Number(recipe.cooking_time)} MINUTES</span><h2>${escapeHtml(recipe.name)}</h2><p>${escapeHtml(recipe.description || "")}</p><h3>Ingredients</h3><ul>${ingredients}</ul><h3>Preparation</h3><ol>${steps}</ol>`;
  document.body.appendChild(detail);
  detail.querySelector(".dialog-close").addEventListener("click", () => detail.close());
  detail.addEventListener("close", () => detail.remove());
  detail.showModal();
}
async function toggleFavorite(id) {
  if (!state.user) { openAuth(); toast("Sign in to save favorites."); return; }
  try {
    if (state.favorites.has(id)) {
      await api(`/favorites/${id}`, { method: "DELETE" }); state.favorites.delete(id); toast("Removed from favorites.");
    } else {
      await api("/favorites", { method: "POST", body: JSON.stringify({ recipe_id: id }) }); state.favorites.add(id); toast("Added to favorites.");
    }
    renderRecipes();
  } catch (err) { toast(err.message); }
}
grid.addEventListener("click", handleCardClick);
favoritesGrid.addEventListener("click", handleCardClick);
function handleCardClick(event) {
  const fav = event.target.closest("[data-favorite]");
  const detail = event.target.closest("[data-details]");
  const edit = event.target.closest("[data-edit]");
  const del = event.target.closest("[data-delete]");
  if (fav) toggleFavorite(fav.dataset.favorite);
  if (detail) showRecipe(detail.dataset.details);
  if (edit) startEdit(edit.dataset.edit);
  if (del) deleteRecipe(del.dataset.delete);
}
$("searchForm").addEventListener("submit", e => { e.preventDefault(); searchRecipes(); });
$("categoryFilter").addEventListener("change", searchRecipes);
$("authButton").addEventListener("click", () => state.user ? toast(`Signed in as ${state.user.email}`) : openAuth());
$("logoutButton").addEventListener("click", () => clearSession());
$("closeAuth").addEventListener("click", () => $("authDialog").close());
$("switchAuth").addEventListener("click", () => openAuth(state.authMode === "signin" ? "signup" : "signin"));
$("authForm").addEventListener("submit", async e => {
  e.preventDefault(); $("authError").textContent = ""; $("authSubmit").disabled = true;
  try {
    const mode = state.authMode;
    const body = { email: $("authEmail").value.trim(), password: $("authPassword").value };
    if (mode === "signup") body.name = $("authName").value.trim();
    const data = await api(`/auth/${mode}`, { method: "POST", body: JSON.stringify(body) });
    state.token = data.token; state.user = data.user; localStorage.setItem("rf_token", data.token);
    $("authDialog").close(); $("authForm").reset(); await loadFavorites(); setAuthUI(); renderRecipes();
    toast(mode === "signin" ? "Welcome back!" : "Account created successfully.");
  } catch (err) { $("authError").textContent = err.message; }
  finally { $("authSubmit").disabled = false; }
});
$("recipeForm").addEventListener("submit", async e => {
  e.preventDefault();
  const id = $("recipeId").value;
  const body = { name: $("recipeName").value.trim(), category: $("recipeCategory").value,
    cooking_time: Number($("recipeTime").value), image_url: $("recipeImage").value.trim() || null,
    ingredients: $("recipeIngredients").value.split("\n").map(x => x.trim()).filter(Boolean),
    steps: $("recipeSteps").value.split("\n").map(x => x.trim()).filter(Boolean),
    description: $("recipeDescription").value.trim() };
  try {
    await api(id ? `/recipes/${id}` : "/recipes", { method: id ? "PUT" : "POST", body: JSON.stringify(body) });
    $("recipeForm").reset(); $("recipeId").value = ""; $("cancelEdit").classList.add("hidden");
    await loadRecipes(); toast(id ? "Recipe updated." : "Recipe added.");
  } catch (err) { toast(err.message); }
});
$("cancelEdit").addEventListener("click", () => { $("recipeForm").reset(); $("recipeId").value = ""; $("cancelEdit").classList.add("hidden"); });
$("loadUsersButton").addEventListener("click", async () => {
  try {
    const data = await api("/admin/users");
    $("usersList").innerHTML = data.users.length ? data.users.map(u => `<div class="user-row"><span>${escapeHtml(u.name || "No name")}<br><small>${escapeHtml(u.email)}</small></span><span>${escapeHtml(u.role)}</span></div>`).join("") : "<p>No users yet.</p>";
  } catch (err) { toast(err.message); }
});
function startEdit(id) {
  const r = state.recipes.find(item => item.id === id);
  if (!r) return;
  $("recipeId").value = r.id; $("recipeName").value = r.name; $("recipeCategory").value = r.category;
  $("recipeTime").value = r.cooking_time; $("recipeImage").value = r.image_url || "";
  $("recipeIngredients").value = (r.ingredients || []).join("\\n");
  $("recipeSteps").value = (r.steps || []).join("\\n"); $("recipeDescription").value = r.description || "";
  $("cancelEdit").classList.remove("hidden"); $("adminSection").scrollIntoView({ behavior: "smooth" });
}
async function deleteRecipe(id) {
  if (!window.confirm("Delete this recipe? This also removes it from users' favorites.")) return;
  try { await api(`/recipes/${id}`, { method: "DELETE" }); await loadRecipes(); toast("Recipe deleted."); }
  catch (err) { toast(err.message); }
}
async function init() { await loadRecipes(); await loadMe(); renderRecipes(); }
init();
