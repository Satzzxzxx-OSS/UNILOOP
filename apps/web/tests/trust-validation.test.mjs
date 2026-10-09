import test from "node:test";
import assert from "node:assert/strict";
import {parseReportReason,parseReportDetails,cleanProfileName} from "../lib/trust/validation.ts";

test("report reason stays within policy vocabulary",()=>{
  assert.equal(parseReportReason("fraud"),"fraud");
  assert.equal(parseReportReason("admin"),null);
  assert.equal(parseReportReason(null),null);
});
test("report requires bounded meaningful details",()=>{
  assert.equal(parseReportDetails("  item may be misleading  "),"item may be misleading");
  assert.equal(parseReportDetails("too short"),null);
  assert.equal(parseReportDetails("z".repeat(1501)),null);
});
test("display name must be safe and bounded",()=>{
  assert.equal(cleanProfileName("  Mira   Kumar "),"Mira Kumar");
  assert.equal(cleanProfileName("x"),null);
  assert.equal(cleanProfileName("Hi\nthere"),"Hi there");
  assert.equal(cleanProfileName("x".repeat(61)),null);
});
