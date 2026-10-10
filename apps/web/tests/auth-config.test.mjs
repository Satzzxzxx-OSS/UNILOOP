import assert from "node:assert/strict";
import test from "node:test";
import { parsePublicSupabaseConfig } from "../lib/supabase/config.ts";
import {
  AUTH_FAILURE_PATH,
  AUTH_SUCCESS_PATH,
  isValidEmailTokenHash,
} from "../lib/auth/confirm.ts";

test("auth is disabled without valid public Supabase settings", () => {
  assert.equal(parsePublicSupabaseConfig(undefined, undefined), null);
  assert.equal(parsePublicSupabaseConfig("javascript:alert(1)", "sb_publishable_long-enough-key"), null);
  assert.equal(parsePublicSupabaseConfig("http://remote.test", "sb_publishable_long-enough-key"), null);
  assert.equal(parsePublicSupabaseConfig("https://example.test?token=secret", "sb_publishable_long-enough-key"), null);
  assert.equal(parsePublicSupabaseConfig("https://example.test", "sb_secret_not-for-browser"), null);
  assert.deepEqual(
    parsePublicSupabaseConfig("https://example.test", "sb_publishable_long-enough-key"),
    { url: "https://example.test", publishableKey: "sb_publishable_long-enough-key" },
  );
});

test("email confirmation checks hash format and never accepts redirect urls", () => {
  assert.equal(isValidEmailTokenHash("a".repeat(64)), true);
  assert.equal(isValidEmailTokenHash("../../../etc/passwd"), false);
  assert.equal(isValidEmailTokenHash(""), false);
  assert.equal(isValidEmailTokenHash("x".repeat(500)), false);
  assert.equal(AUTH_SUCCESS_PATH, "/dashboard");
  assert.equal(AUTH_FAILURE_PATH, "/account?error=link");
});
