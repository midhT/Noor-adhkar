/* Public Naseem release checker. Public JSON only; no GitHub token or sign-in. */
(() => {
  'use strict';
  const CURRENT = document.querySelector('meta[name="naseem-version"]')?.content || '4.0.7';
  const RELEASE_JSON = 'https://raw.githubusercontent.com/midhT/Naseem-public/main/release.json';
  const RELEASES_PAGE = 'https://github.com/midhT/Noor-adhkar/releases/latest';
  const KEY = 'naseem-public-update-state-v1';
  const parse = v => String(v || '0').split(/[.+-]/).slice(0,3).map(x => Number.parseInt(x,10)||0);
  const newer = (a,b) => { const x=parse(a),y=parse(b); for(let i=0;i<3;i++){if(x[i]!==y[i])return x[i]>y[i];}return false; };
  const safeUrl = value => { try { const u=new URL(value); return u.protocol==='https:' && (u.hostname==='github.com' || u.hostname==='raw.githubusercontent.com') ? u.href : RELEASES_PAGE; } catch (_) { return RELEASES_PAGE; } };
  function show(version,url,notes){
    if(document.getElementById('naseemUpdateBanner'))return;
    const banner=document.createElement('aside');banner.id='naseemUpdateBanner';banner.className='naseem-update-banner';
    banner.innerHTML=`<div><strong>Naseem ${version} is available</strong><small>${String(notes||'A new version is ready to install.').slice(0,180).replace(/[<>]/g,'')}</small></div><button type="button">View update</button><button type="button" aria-label="Dismiss">×</button>`;
    document.querySelector('.app-shell')?.prepend(banner);
    const open=()=>window.open(url,'_system');banner.querySelector('button').addEventListener('click',open);banner.querySelectorAll('button')[1].addEventListener('click',()=>banner.remove());
    window.NoorNative?.notifications?.permission?.().then(permission=>{if(permission==='granted')window.NoorNative.notifications.announceUpdate?.(version,url);}).catch(()=>{});
  }
  async function check(force=false){
    let state={};try{state=JSON.parse(localStorage.getItem(KEY)||'{}');}catch(_){}
    if(!force&&Date.now()-Number(state.checkedAt||0)<12*60*60*1000)return;
    try{
      const response=await fetch(RELEASE_JSON,{cache:'no-store'});if(!response.ok)throw new Error('release feed unavailable');
      const release=await response.json();if(!release||typeof release.version!=='string')throw new Error('invalid release feed');
      state.checkedAt=Date.now();state.latest=release.version;localStorage.setItem(KEY,JSON.stringify(state));
      if(newer(release.version,CURRENT)&&state.notifiedVersion!==release.version){
        state.notifiedVersion=release.version;localStorage.setItem(KEY,JSON.stringify(state));
        show(release.version,safeUrl(release.downloadUrl||release.releaseUrl),release.notesSummary||'A new version is ready. Review the release notes before installing.');
      }
    }catch(_){state.checkedAt=Date.now();try{localStorage.setItem(KEY,JSON.stringify(state));}catch(__){}}
  }
  window.NaseemUpdates={check};
  window.addEventListener('online',()=>check(true));
  window.setTimeout(()=>check(false),5000);
})();
