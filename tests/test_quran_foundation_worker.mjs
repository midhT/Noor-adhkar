import assert from 'node:assert/strict';
const calls=[];
globalThis.fetch=async (url,options={})=>{
  calls.push({url:String(url),options});
  if(String(url).includes('/oauth2/token')){
    assert.equal(options.method,'POST');
    assert.match(options.headers.Authorization,/^Basic /);
    assert.match(String(options.body),/grant_type=client_credentials/);
    return new Response(JSON.stringify({access_token:'test-token',expires_in:3600}),{status:200,headers:{'Content-Type':'application/json'}});
  }
  assert.equal(options.headers['x-auth-token'],'test-token');
  assert.equal(options.headers['x-client-id'],'test-client');
  if(String(url).includes('/verses/by_page/1')){
    return new Response(JSON.stringify({verses:[{verse_key:'1:1',words:[{position:1,page_number:1,line_number:1,text_indopak_nastaleeq:'بِسْمِ',char_type_name:'word'}]}]}),{status:200,headers:{'Content-Type':'application/json'}});
  }
  if(String(url).includes('/pages/lookup')){
    return new Response(JSON.stringify({pages:{'44':{from:'2:255',to:'2:255'}}}),{status:200,headers:{'Content-Type':'application/json'}});
  }
  return new Response(JSON.stringify({chapters:[{id:1,name_arabic:'الفاتحة'}]}),{status:200,headers:{'Content-Type':'application/json'}});
};
const {default:worker}=await import('../quran-foundation-worker/src/index.js');
const env={QF_CLIENT_ID:'test-client',QF_CLIENT_SECRET:'test-secret',QF_ENV:'prelive',QF_SCOPE:'content.quran.read content.translations.read',ALLOWED_ORIGINS:'*'};
const page=await worker.fetch(new Request('https://worker.test/api/mushaf/page/1?mushaf=6&translation=131',{headers:{Origin:'https://localhost'}}),env);
assert.equal(page.status,200);
const pageData=await page.json();
assert.equal(pageData.verses[0].words[0].line_number,1);
assert.ok(calls.some(x=>x.url.includes('mushaf=6')));
const lookup=await worker.fetch(new Request('https://worker.test/api/mushaf/lookup?mushaf=6&from=2%3A255&to=2%3A255'),env);
assert.equal(lookup.status,200);
assert.ok((await lookup.json()).pages['44']);
const health=await worker.fetch(new Request('https://worker.test/health'),env);
assert.equal((await health.json()).configured,true);
assert.equal(calls.filter(x=>x.url.includes('/oauth2/token')).length,1,'token is cached within the Worker isolate');
console.log('Quran Foundation Worker mock integration checks passed.');
