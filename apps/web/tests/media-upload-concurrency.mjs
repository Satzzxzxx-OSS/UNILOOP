// Direct metadata inserts are ONLY a disposable Storage fixture simulation.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
assert.equal(process.env.PGDATABASE,'uniloop_notifications_ci','Disposable CI database required');
assert(['localhost','127.0.0.1'].includes(process.env.PGHOST),'Local CI database required');
const actor='aaaaaaaa-6767-4767-8767-aaaaaaaaaaaa';
const campus='bbbbbbbb-6767-4767-8767-bbbbbbbbbbbb';
function sql(source){
 return new Promise((resolve,reject)=>{
  const child=spawn('psql',['-X','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose','-At'],{stdio:['pipe','pipe','pipe']});
  let output='',errors='';child.stdout.on('data',data=>{output+=data;});
  child.stderr.on('data',data=>{errors+=data;});child.on('error',reject);
  child.on('close',code=>resolve({code,output,errors}));child.stdin.end(source);
 });
}
const setup=await sql(`begin;
 insert into auth.users(id,email) values('${actor}','media-race@example.test');
 insert into public.campuses(id,name) values('${campus}','Media concurrency campus');
 insert into private.enabled_campuses(campus_id,enabled) values('${campus}',true);
 insert into public.campus_memberships(user_id,campus_id,status,verified_at)
 values('${actor}','${campus}','verified',now());
 insert into public.listings(id,owner_id,campus_id,category_slug,title,description,price_inr,item_condition)
 values('cccccccc-6767-4767-8767-cccccccccccc','${actor}','${campus}',
 'books-study','Concurrent photo book','A valid description for photo upload concurrency.',100,'good');
 insert into public.rental_listings(id,owner_id,campus_id,category_slug,title,description,daily_rate_inr,item_condition)
 values('dddddddd-6767-4767-8767-dddddddddddd','${actor}','${campus}',
 'books-study','Concurrent rental book','A valid description for rental photo concurrency.',100,'good');
 commit;`);
assert.equal(setup.code,0,'Disposable media setup failed');
for(const [bucket,parent] of [['listing-media','cccccccc-6767-4767-8767-cccccccccccc'],
 ['rental-media','dddddddd-6767-4767-8767-dddddddddddd']]){
 const fill=await sql(`insert into storage.objects(bucket_id,name,owner_id)
 select '${bucket}','${parent}/'||gen_random_uuid()::text||'.jpg','${actor}' from generate_series(1,4);`);
 assert.equal(fill.code,0);
 const fixedSnapshot=await sql(`begin isolation level repeatable read; set local role authenticated;
 select set_config('request.jwt.claim.sub','${actor}',true);
 select ${bucket==='listing-media'?'private.can_upload_listing_photo':'private.can_upload_rental_photo'}('${parent}/eeeeeeee-6767-4767-8767-eeeeeeeeeeee.jpg'); rollback;`);
 assert.equal(fixedSnapshot.code,0);assert.equal(fixedSnapshot.output.trim().split('\n').at(-2),'f',
  'Fixed snapshot authorization must fail closed');
 const upload=()=>sql(`begin; set local role authenticated;
 select set_config('request.jwt.claim.sub','${actor}',true);
 insert into storage.objects(bucket_id,name,owner_id)
 values('${bucket}','${parent}/'||gen_random_uuid()::text||'.jpg','${actor}');
 select pg_sleep(1); commit;`);
 const results=await Promise.all([upload(),upload()]);
 assert.equal(results.filter(result=>result.code===0).length,1,`${bucket}: one upload must commit`);
 assert.equal(results.filter(result=>result.code!==0&&result.errors.includes('42501')).length,1,
  `${bucket}: other upload must be denied by RLS`);
 const count=await sql(`select count(*) from storage.objects where bucket_id='${bucket}' and name like '${parent}/%';`);
 assert.equal(count.code,0);assert.equal(count.output.trim(),'5',`${bucket}: object count exceeded cap`);

}
console.log('Native sale/rental media concurrency: one commit, one RLS denial, five objects per parent.');
