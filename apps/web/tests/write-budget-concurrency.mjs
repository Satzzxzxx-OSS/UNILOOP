// Native PostgreSQL integration only; run against the disposable full-chain CI DB.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';

function sql(source){
 return new Promise((resolve,reject)=>{
  const process=spawn('psql',['-X','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose','-At'],{stdio:['pipe','pipe','pipe']});
  let output='',errors='';
  process.stdout.on('data',data=>{output+=data;});process.stderr.on('data',data=>{errors+=data;});
  process.on('error',reject);process.on('close',code=>resolve({code,output,errors}));
  process.stdin.end(source);
 });
}
const actor='aaaaaaaa-3434-4434-8434-aaaaaaaaaaaa';
const campus='cccccccc-3434-4434-8434-cccccccccccc';
const setup=await sql(`begin;
 insert into auth.users(id,email) values('${actor}','quota-concurrency@example.test');
 insert into public.campuses(id,name) values('${campus}','Concurrent budget campus');
 insert into private.enabled_campuses(campus_id,enabled) values('${campus}',true);
 insert into public.campus_memberships(user_id,campus_id,status,verified_at)
 values('${actor}','${campus}','verified',now());
 update private.marketplace_write_limits set max_writes=1 where operation='sale_draft';
 commit;`);
assert.equal(setup.code,0,'Disposable concurrency setup failed');
try{
 // Keep the two writes inside the same fixed hour, even near an hour rollover.
 const untilBoundary=3600000-Date.now()%3600000;
 if(untilBoundary<4000)await new Promise(resolve=>setTimeout(resolve,untilBoundary+100));
 const insert=label=>`begin; set local role authenticated;
 select set_config('request.jwt.claim.sub','${actor}',true);
 insert into public.listings(owner_id,campus_id,category_slug,title,description,price_inr,item_condition)
 values('${actor}','${campus}','books-study','Concurrent draft ${label}',
 'A sufficiently long valid description for native concurrency verification.',100,'good');
 select pg_sleep(1); commit;`;
 const results=await Promise.all([sql(insert('A')),sql(insert('B'))]);
 assert.equal(results.filter(result=>result.code===0).length,1,'Exactly one concurrent write must commit');
 assert.equal(results.filter(result=>result.code!==0&&result.errors.includes('PT429')).length,1,
  'Competing write must fail with the quota code');
 const persisted=await sql(`select count(*) from public.listings where owner_id='${actor}';
 select sum(used) from private.marketplace_write_usage where user_id='${actor}' and operation='sale_draft';`);
 assert.equal(persisted.code,0);assert.equal(persisted.output.trim(),'1\n1','Quota or listing count overshot');
 console.log('Native concurrent write budget: one commit, one PT429, one persisted usage.');
}finally{
 const restored=await sql("update private.marketplace_write_limits set max_writes=10 where operation='sale_draft';");
 assert.equal(restored.code,0,'Restore disposable budget configuration failed');
}
