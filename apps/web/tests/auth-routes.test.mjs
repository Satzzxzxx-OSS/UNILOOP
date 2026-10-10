import assert from "node:assert/strict";
import test from "node:test";
import {isWorkspacePath} from "../lib/auth/routes.ts";
test("workspace route boundaries distinguish public pages and exact prefixes",()=>{
 for(const p of ["/dashboard","/explore","/listing/a","/rent/post","/inbox/a","/saved","/transactions/a","/notifications"])assert.equal(isWorkspacePath(p),true,p);
 for(const p of ["/","/account","/login","/signup","/help","/safety","/auth/confirm","/rentals-other","/dashboard-other","/_next/static/file.js"])assert.equal(isWorkspacePath(p),false,p);
});
