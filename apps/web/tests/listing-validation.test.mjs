import assert from "node:assert/strict";
import test from "node:test";
import {
  parseListingInput, isListingId, isTransitionTarget,
} from "../lib/listings/validation.ts";

const valid = {
  title: "Calculus textbook",
  description: "Original hardcover with a few pencil notes.",
  category: "books-study",
  price: "550",
  condition: "good",
};

test("valid input normalizes fields", () => {
  assert.deepEqual(parseListingInput({ ...valid, title: "  Calculus textbook  " }), {
    ok: true,
    value: {
      title: "Calculus textbook",
      description: valid.description,
      category_slug: "books-study",
      price_inr: 550,
      item_condition: "good",
    },
  });
});

test("rejects invalid price, category and condition", () => {
  for (const price of ["0", "-1", "1.99", "10000001", "01", "1e2", "3abc"]) {
    assert.equal(parseListingInput({ ...valid, price }).ok, false, price);
  }
  assert.equal(parseListingInput({ ...valid, category: "not-listed" }).ok, false);
  assert.equal(parseListingInput({ ...valid, condition: "admin" }).ok, false);
});

test("rejects too-short or too-long listing content", () => {
  assert.equal(parseListingInput({ ...valid, title: "a" }).ok, false);
  assert.equal(parseListingInput({ ...valid, title: "x".repeat(121) }).ok, false);
  assert.equal(parseListingInput({ ...valid, description: "short" }).ok, false);
  assert.equal(parseListingInput({ ...valid, description: "x".repeat(5001) }).ok, false);
});

test("rejects status and id injection", () => {
  assert.equal(isTransitionTarget("draft"), false);
  assert.equal(isTransitionTarget("active"), true);
  assert.equal(isTransitionTarget("sold"), true);
  assert.equal(isTransitionTarget("admin"), false);
  assert.equal(isListingId("11111111-aaaa-4111-8111-111111111111"), true);
  assert.equal(isListingId("../another-user"), false);
});
