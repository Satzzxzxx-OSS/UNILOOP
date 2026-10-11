import {test} from "node:test";
import assert from "node:assert/strict";
import {pageWindow,pageHref} from "../lib/pagination.ts";
import {authorizedJobRequest} from "../lib/jobs/cron-auth.ts";
test("page input is bounded and filters survive navigation",()=>{
 assert.deepEqual(pageWindow("2",24),{page:2,size:24,from:24,to:48});
 for(const raw of ["-1","Infinity","1e9","1 OR true",undefined])assert.equal(pageWindow(raw).page,1);
 assert.equal(pageWindow(999999).page,1000);
 assert.equal(pageHref("/explore",2,{q:"books & notes",mode:"rent",page:"99"}),"/explore?q=books+%26+notes&mode=rent&page=2");
});
test("job auth fails closed for missing/weak/mismatched credentials",()=>{
 const key="a".repeat(48);
 assert.equal(authorizedJobRequest("Bearer "+key,key),true);
 for(const header of [null,"Bearer "+"b".repeat(48),"Bearer x","bearer "+key])assert.equal(authorizedJobRequest(header,key),false);
 assert.equal(authorizedJobRequest("Bearer short","short"),false);
 assert.equal(authorizedJobRequest("Bearer "+key,undefined),false);
});
