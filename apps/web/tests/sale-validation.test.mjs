import test from "node:test";
import assert from "node:assert/strict";
import {parseStars,parseReviewText,isStars} from "../lib/sales/validation.ts";

test("review rating must be 1 to 5",()=>{
  assert.equal(parseStars("5"),5);
  assert.equal(isStars(4),true);
  for(const value of ["0","6","2.5","05","abc",""])assert.equal(parseStars(value),null);
  assert.equal(isStars(4.5),false);
});
test("review text must be bounded",()=>{
  assert.equal(parseReviewText("  Great condition and friendly seller.  "),
    "Great condition and friendly seller.");
  assert.equal(parseReviewText("short"),null);
  assert.equal(parseReviewText("x".repeat(1001)),null);
});
