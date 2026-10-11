import assert from 'node:assert/strict';
import test from 'node:test';
import {createNotificationEmailHandler} from '../lib/jobs/email-delivery.ts';
import {mutationErrorMessage} from '../lib/backend-error.ts';

const event={event_id:'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',lease_token:'bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb'};
const context={idempotencyKey:event.event_id,signal:new AbortController().signal};
const permitted={eligible:true,recipient_email:'member@example.test',title:'New private message',
 link_path:'/inbox/cccccccc-1111-4111-8111-cccccccccccc',suppression_code:null};
const config={apiKey:'re_test_only',from:'notifications@example.test',appUrl:'https://uniloop.example.test'};
const rpc=data=>async(name,args)=>{
 assert.equal(name,'get_notification_delivery_context');
 assert.equal(args.requested_event,event.event_id);assert.equal(args.requested_lease,event.lease_token);
 return {data:[data],error:null};
};
test('email handler resolves trusted recipient and uses stable provider idempotency',async()=>{
 let sent;
 const handler=createNotificationEmailHandler({...config,rpc:rpc(permitted),fetcher:async(url,init)=>{
  assert.equal(url,'https://api.resend.com/emails');assert.equal(init.redirect,'error');
  assert.equal(init.headers['Idempotency-Key'],'uniloop-notification/'+event.event_id);
  assert.equal(init.signal,context.signal);sent=JSON.parse(init.body);
  return new Response(JSON.stringify({id:'provider-accepted-id'}),{status:200});
 }});
 await handler(event,context);
 assert.deepEqual(sent.to,['member@example.test']);
 assert(sent.text.includes(config.appUrl+permitted.link_path));
 assert.equal(sent.text.includes('message_body'),false);
});
test('revocation/opt-out suppression never calls transport',async()=>{
 const handler=createNotificationEmailHandler({...config,rpc:rpc({eligible:false,recipient_email:null,
  title:null,link_path:null,suppression_code:'access_revoked'}),fetcher:async()=>{throw Error('must not send');}});
 await handler(event,context);
});
test('missing or malformed delivery context fails closed',async()=>{
 for(const data of [{...permitted,eligible:undefined},{...permitted,link_path:'https://evil.test'},
  {...permitted,recipient_email:'member@example.test\r\nBcc: other@example.test'},
  {...permitted,title:'Title\nInjected'}]){
  await assert.rejects(createNotificationEmailHandler({...config,rpc:rpc(data),fetcher:async()=>{
   throw Error('must not send');
  }})(event,context),/Invalid notification/);
 }
});
test('provider failure never leaks response body or credentials',async()=>{
 const handler=createNotificationEmailHandler({...config,rpc:rpc(permitted),fetcher:async()=>
  new Response('private key/email provider details',{status:429})});
 await assert.rejects(handler(event,context),error=>{
  assert.equal(error.message,'Notification transport rejected the request');return true;
 });
});
test('aborted delivery does not fetch recipient or send email',async()=>{
 const controller=new AbortController();controller.abort();
 const handler=createNotificationEmailHandler({...config,rpc:async()=>{throw Error('must not look up');}});
 await assert.rejects(handler(event,{...context,signal:controller.signal}),{name:'AbortError'});
});
test('unsafe configured origins and sender values reject before any claim',()=>{
 for(const bad of [{appUrl:'http://example.test'},{appUrl:'https://name:secret@example.test'},
  {appUrl:'https://example.test/evil'},{from:'a@example.test\nBcc:b@example.test'}])
  assert.throws(()=>createNotificationEmailHandler({...config,...bad,rpc:rpc(permitted)}));
});
test('mutation feedback hides database details and distinguishes quota failure',()=>{
 assert.match(mutationErrorMessage({code:'PT429',message:'private database details'},'fallback'),/limit/);
 assert.equal(mutationErrorMessage({code:'42501',message:'private data'},'fallback'),'fallback');
});
