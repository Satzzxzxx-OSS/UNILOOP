import assert from "node:assert/strict";
import test from "node:test";
import {
  categories,
  cleanSearchQuery,
  exploreHref,
  parseCategory,
  parseMarketMode,
} from "../lib/catalog.ts";

test("market mode is allowlisted", () => {
  assert.equal(parseMarketMode("rent"), "rent");
  assert.equal(parseMarketMode("buy"), "buy");
  assert.equal(parseMarketMode("admin"), "buy");
  assert.equal(parseMarketMode(undefined), "buy");
});

test("search input is bounded and normalized", () => {
  assert.equal(cleanSearchQuery("  laptop   charger \n "), "laptop charger");
  assert.equal(cleanSearchQuery({ q: "laptop" }), "");
  assert.equal(cleanSearchQuery("x".repeat(250)).length, 100);
});

test("category values are restricted to known slugs", () => {
  assert.equal(parseCategory("books-study"), "books-study");
  assert.equal(parseCategory("javascript:alert(1)"), null);
  assert.equal(parseCategory(""), null);
  assert.equal(new Set(categories.map((c) => c.slug)).size, categories.length);
});

test("mode and category URLs are safely encoded", () => {
  assert.equal(exploreHref("rent", "books-study"), "/explore?mode=rent&category=books-study");
  assert.equal(exploreHref("buy", "not-a-real-category"), "/explore?mode=buy");
});
