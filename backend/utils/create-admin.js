require("dotenv").config();
const bcrypt = require("bcryptjs");
const supabase = require("../supabase");

(async () => {
  try {
    const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || "";
    if (!email || password.length < 8 || password.startsWith("REPLACE_")) {
      throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 8 characters) in backend/.env first.");
    }
    const { data: existing, error: findError } = await supabase.from("users").select("id,email,role").eq("email", email).maybeSingle();
    if (findError) throw findError;
    const password_hash = await bcrypt.hash(password, 12);
    if (existing) {
      const { error } = await supabase.from("users").update({ role: "admin", password_hash }).eq("id", existing.id);
      if (error) throw error;
      console.log(`Updated existing account ${email} as admin.`);
    } else {
      const { error } = await supabase.from("users").insert({ email, name: "Recipe Finder Admin", role: "admin", password_hash });
      if (error) throw error;
      console.log(`Created admin account ${email}.`);
    }
    console.log("Keep the admin password private. Change it after your demonstration if it was temporary.");
  } catch (err) {
    console.error("Admin setup failed:", err.message);
    process.exitCode = 1;
  }
})();
