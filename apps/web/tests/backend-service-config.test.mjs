import assert from 'node:assert/strict';
import test from 'node:test';
import {parseBackendServiceConfig} from '../lib/jobs/service-config.ts';
const url='https://example.supabase.co';
const jwt=role=>'header.'+Buffer.from(JSON.stringify({role})).toString('base64url')+'.signature';

test('worker rejects publishable/anonymous/user keys before provider access',()=>{
 for(const key of ['sb_publishable_example_test_key',jwt('anon'),jwt('authenticated'),'invalid'])
  assert.throws(()=>parseBackendServiceConfig({SUPABASE_URL:url,SUPABASE_SERVICE_ROLE_KEY:key}),/service key/);
});
test('worker supports private secret and legacy service-role key shapes',()=>{
 for(const key of ['sb_secret_example_private_test_key',jwt('service_role')])
  assert.deepEqual(parseBackendServiceConfig({SUPABASE_URL:url,SUPABASE_SERVICE_ROLE_KEY:key}),{url,key});
});
test('worker database URL must be HTTPS origin without embedded credentials',()=>{
 for(const databaseUrl of ['http://example.test','https://user:key@example.test','https://example.test/path',
  'https://example.test?key=private'])
  assert.throws(()=>parseBackendServiceConfig({SUPABASE_URL:databaseUrl,SUPABASE_SERVICE_ROLE_KEY:jwt('service_role')}));
});
test('missing private configuration rejects without echoing a supplied key',()=>{
 assert.throws(()=>parseBackendServiceConfig({SUPABASE_SERVICE_ROLE_KEY:'private-test-key'}),error=>{
  assert.equal(error.message.includes('private-test-key'),false);return true;
 });
});
