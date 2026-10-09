import assert from "node:assert/strict";
import test from "node:test";
import {parseRentalInput,isCalendarDate,parseRentalDecision} from "../lib/rentals/validation.ts";
const valid={
  title:"Mirrorless camera kit",
  description:"A fully working camera kit with battery and bag.",
  category:"cameras-creative",daily_rate:"250",deposit:"0",min_days:"1",max_days:"10",condition:"good",
};
test("rental input validated with exact currency and durations",()=>{
  const result=parseRentalInput(valid);
  assert.equal(result.ok,true);
  if(result.ok){
    assert.equal(result.value.daily_rate_inr,250);
    assert.equal(result.value.refundable_deposit_inr,0);
    assert.equal(result.value.max_days,10);
  }
  for(const price of ["0","-50","1.5","1e3","1000001","01"])
    assert.equal(parseRentalInput({...valid,daily_rate:price}).ok,false,price);
  assert.equal(parseRentalInput({...valid,max_days:"0"}).ok,false);
  assert.equal(parseRentalInput({...valid,min_days:"14"}).ok,false);
  assert.equal(parseRentalInput({...valid,deposit:"10000001"}).ok,false);
});
test("calendar dates must be real ISO dates",()=>{
  assert.equal(isCalendarDate("2026-10-31"),true);
  for(const value of ["2026-02-30","31-10-2026","2026-13-01","../secret",undefined,"2026-10-9"])
    assert.equal(isCalendarDate(value),false,String(value));
});
test("rental status decisions deny arbitrary values",()=>{
  assert.equal(parseRentalDecision("approve"),"approve");
  assert.equal(parseRentalDecision("confirm_return"),"confirm_return");
  assert.equal(parseRentalDecision("approve_all"),null);
});
