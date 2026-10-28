const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const schemaSql = fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8");

test("schema matches the app's expected user and recipe columns", () => {
  assert.match(schemaSql, /CREATE TABLE IF NOT EXISTS public\.users/i);
  assert.match(schemaSql, /name TEXT NOT NULL/i);
  assert.match(schemaSql, /CREATE TABLE IF NOT EXISTS public\.recipes/i);
  assert.match(schemaSql, /name TEXT NOT NULL/i);
  assert.match(schemaSql, /cooking_time INTEGER/i);
  assert.doesNotMatch(schemaSql, /title TEXT NOT NULL/i);
  assert.doesNotMatch(schemaSql, /prep_minutes INTEGER/i);
});
