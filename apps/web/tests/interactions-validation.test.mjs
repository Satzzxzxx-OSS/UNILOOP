import test from "node:test";
import assert from "node:assert/strict";
import { isUuid, parseMessage, parseOfferRupees, isDecision } from "../lib/interactions/validation.ts";

test("only UUIDs are valid identifiers", () => {
  assert.equal(isUuid("11111111-aaaa-4111-8111-111111111111"), true);
  assert.equal(isUuid("../../other-user"), false);
  assert.equal(isUuid({}), false);
});
test("message validation rejects blank/oversized and normalizes whitespace", () => {
  assert.equal(parseMessage("  Hello there  "), "Hello there");
  assert.equal(parseMessage("\n   \t"), null);
  assert.equal(parseMessage("z".repeat(2001)), null);
  assert.equal(parseMessage(123), null);
});
test("offer amount is exact integer rupees with bounds", () => {
  for (const wrong of ["0", "-1", "1.5", "01", "1e3", "10000001", "NaN", "", {}, null]) {
    assert.equal(parseOfferRupees(wrong), null, String(wrong));
  }
  assert.equal(parseOfferRupees("1234"), 1234);
  assert.equal(parseOfferRupees("10000000"), 10000000);
});
test("only approved offer decisions pass", () => {
  assert.equal(isDecision("accept"), true);
  assert.equal(isDecision("withdraw"), true);
  assert.equal(isDecision("counter"), false);
  assert.equal(isDecision("__proto__"), false);
});
