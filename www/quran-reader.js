/* Naseem Quran Reader, recitation follow-along, memorisation and Quranic Dua additions.
   AlQuran Cloud API; opened Surah text is cached locally (and can be saved in full), while recitation is fetched on demand.
   Layout: Quran index (Surah / Juz / Page / Bookmarks / Memory) -> reader -> memorisation review. */
(() => {
  'use strict';
  const API='https://api.alquran.cloud/v1';
  const WORD_TIMING_BASE='https://cdn.jsdelivr.net/gh/its3li/quran-word-timings@v1.0.0/data/muhammad-al-luhaidan/quran-com';
  const QARIS=[
    {id:'muhammad-al-luhaidan',name:'Muhammad Al-Luhaidan',ini:'ML',edition:null,wordSync:true},
    {id:'ar.alafasy',name:'Mishary Rashid Alafasy',ini:'MA',edition:'ar.alafasy',wordSync:false},
    {id:'ar.sudais',name:'Abdurrahman Al-Sudais',ini:'AS',edition:'ar.sudais',wordSync:false},
    {id:'ar.husary',name:'Mahmoud Khalil Al-Husary',ini:'MH',edition:'ar.husary',wordSync:false},
    {id:'ar.minshawi',name:'Mohamed Siddiq Al-Minshawi',ini:'MM',edition:'ar.minshawi',wordSync:false},
    {id:'ar.shuraim',name:'Saud Al-Shuraim',ini:'SS',edition:'ar.shuraim',wordSync:false},
    {id:'ar.abdulbasit',name:'Abdul Basit Abdus-Samad',ini:'AB',edition:'ar.abdulbasit',wordSync:false},
    {id:'ar.abdulbasitmujawwad',name:'Abdul Basit (Mujawwad)',ini:'AM',edition:'ar.abdulbasitmujawwad',wordSync:false},
    {id:'ar.minshawimujawwad',name:'Al-Minshawi (Mujawwad)',ini:'MW',edition:'ar.minshawimujawwad',wordSync:false},
    {id:'ar.hudhaify',name:'Ali Al-Hudhaify',ini:'AH',edition:'ar.hudhaify',wordSync:false},
    {id:'ar.ajamy',name:'Ahmed Al-Ajamy',ini:'AJ',edition:'ar.ajamy',wordSync:false},
    {id:'ar.muhammadayoub',name:'Muhammad Ayyoub',ini:'MY',edition:'ar.muhammadayoub',wordSync:false},
    {id:'ar.muhammadjibreel',name:'Muhammad Jibreel',ini:'MJ',edition:'ar.muhammadjibreel',wordSync:false}
  ];
  const QARI_KEY='naseem-quran-reciter-v1';
  let selectedQari=(()=>{try{return localStorage.getItem(QARI_KEY)||'muhammad-al-luhaidan';}catch(_){return 'muhammad-al-luhaidan';}})();
  if(!QARIS.some(q=>q.id===selectedQari))selectedQari='muhammad-al-luhaidan';
  const qari=()=>QARIS.find(q=>q.id===selectedQari)||QARIS[0];
  // Compact, monochrome identity thumbnails: recognisable in the picker without inventing portraits.
  const qariAvatarHTML=(q,large=false)=>`<span class="qr-qari-thumb${large?' qr-qari-thumb-large':''}" aria-hidden="true"><svg viewBox="0 0 48 48"><circle cx="24" cy="17" r="8"/><path d="M8 42c1.8-9.5 7.2-14 16-14s14.2 4.5 16 14"/></svg><b>${q.ini}</b></span>`;
  const qariOptionHTML=q=>{const on=q.id===selectedQari;return `<button type="button" class="qr-qari-option${on?' selected':''}" role="option" aria-selected="${on}" data-qari-id="${q.id}">${qariAvatarHTML(q)}<span class="qr-qari-copy"><strong>${q.name}</strong>${q.wordSync?'<small class="qr-qari-capability">Word by word</small>':'<small class="qr-qari-mode">Verse by verse</small>'}</span><span class="qr-qari-selected">${on?'Selected':''}</span></button>`;};
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const request=async path=>{
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
    try{const r=await fetch(`${API}${path}`,{headers:{Accept:'application/json'},signal:controller.signal});if(!r.ok)throw new Error(`HTTP ${r.status}`);const j=await r.json();if(j.code&&j.code!==200)throw new Error('API response error');return j.data;}
    finally{clearTimeout(timer);}
  };
  const Mem=window.NaseemQuranMemory;
  const svg=(d,extra='')=>`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
  const waveSeekHTML=id=>`<div class="qr-wave-seek" id="${id}" role="slider" tabindex="0" aria-label="Seek recitation" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div>`;
  const setWaveSeek=(id,fraction)=>{const el=$(id);if(!el)return;const f=Math.max(0,Math.min(1,Number(fraction)||0));if(window.NaseemWave)window.NaseemWave.set(el,f);el.style.setProperty('--wave-progress',`${f*100}%`);el.setAttribute('aria-valuenow',String(Math.round(f*100)));};
  const bindWaveSeek=id=>{const el=$(id);if(!el)return;if(window.NaseemWave)window.NaseemWave.attach(el);const seekAt=x=>{if(!Number.isFinite(recitation.duration)||recitation.duration<=0)return;const r=el.getBoundingClientRect(),f=Math.max(0,Math.min(1,(x-r.left)/r.width));recitation.currentTime=f*recitation.duration;setWaveSeek(id,f);};let dragging=false;const wd=on=>{if(window.NaseemWave)window.NaseemWave.dragging(el,on);};el.addEventListener('pointerdown',e=>{dragging=true;wd(true);el.setPointerCapture?.(e.pointerId);seekAt(e.clientX);});el.addEventListener('pointermove',e=>{if(dragging)seekAt(e.clientX);});const end=()=>{dragging=false;wd(false);};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('keydown',e=>{if(!Number.isFinite(recitation.duration)||recitation.duration<=0)return;const step=e.shiftKey?10:3;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();recitation.currentTime=Math.max(0,Math.min(recitation.duration,recitation.currentTime+(e.key==='ArrowRight'?step:-step)));}});};
  const ICON={
    back:svg('<path d="m15 5-7 7 7 7"/>'),
    down:svg('<path d="m6 9 6 6 6-6"/>'),
    moon:svg('<path d="M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5z"/>'),
    lyrics:svg('<path d="M4 6h16M4 11h10M4 16h16M4 21h8"/>'),
    play:svg('<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>'),
    pause:svg('<path d="M8 5.5v13M16 5.5v13" stroke-width="3.2"/>'),
    prev:svg('<path d="M7 5.5v13M18 5.5 9.5 12l8.5 6.5z" fill="currentColor"/>'),
    next:svg('<path d="M17 5.5v13M6 5.5 14.5 12 6 18.5z" fill="currentColor"/>'),
    sliders:svg('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
    bookmark:svg('<path d="M7 4.5h10v15l-5-3.6-5 3.6z"/>'),
    bookmarkOn:svg('<path d="M7 4.5h10v15l-5-3.6-5 3.6z" fill="currentColor"/>'),
    plus:svg('<path d="M12 5v14M5 12h14"/>'),
    check:svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    close:svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    locate:svg('<circle cx="12" cy="12" r="6.2"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3"/>'),
    eyeOff:svg('<path d="M3 12s3.4-6 9-6 9 6 9 6-3.4 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.6"/><path d="M4 4l16 16"/>'),
    book:svg('<path d="M4 5.5c3.2-1.5 6-.8 8 1.2v13c-2-2-4.8-2.7-8-1.2z"/><path d="M20 5.5c-3.2-1.5-6-.8-8 1.2v13c2-2 4.8-2.7 8-1.2z"/>'),
    search:svg('<circle cx="11" cy="11" r="6.2"/><path d="m16 16 4 4"/>'),
    star:'<svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true"><path d="M20 2.5l4.6 5.2 6.9-.9.9 6.9 5.2 4.6-5.2 4.6-.9 6.9-6.9-.9L20 37.5l-4.6-5.2-6.9.9-.9-6.9L2.5 21.7 7.7 17.1l.9-6.9 6.9.9z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>'
  };
  const section=document.createElement('section');section.className='screen v404-screen';section.id='quranReaderScreen';
  section.innerHTML=`<div class="qr-home" id="quranHome">
      <div class="screen-heading quran-page-heading"><span class="eyebrow">THE HOLY QURAN</span><h1>Al-Quran</h1><p class="muted">Read, listen, memorise and return to where you left off.</p></div>
      <div class="quran-hero"><span class="quran-hero-mark">${ICON.book}</span><div class="quran-hero-copy"><span class="eyebrow" id="quranResumeLabel">BEGIN READING</span><strong id="quranResumeName">Al-Fatihah</strong><small id="quranResumeMeta">Ayah No. 1</small></div><button class="quran-resume" id="quranResume" type="button">Read</button></div>
      <button type="button" class="qr-due" id="quranDueChip" hidden></button>
      <div class="quran-tabs" role="tablist" aria-label="Quran navigation"><button type="button" class="selected" data-quran-view="surah" aria-selected="true">Surah</button><button type="button" data-quran-view="juz" aria-selected="false">Juz</button><button type="button" data-quran-view="page" aria-selected="false">Page</button><button type="button" data-quran-view="bookmarks" aria-selected="false">Bookmarks</button><button type="button" data-quran-view="memory" aria-selected="false">Memory</button></div>
      <div class="qr-panel" data-quran-panel="surah"><label class="qr-search">${ICON.search}<input id="quranSearch" type="search" placeholder="Search a surah by name or number" autocomplete="off" aria-label="Search surahs"></label><div id="quranSurahList" class="qr-list"><p class="v404-note">Loading surahs…</p></div></div>
      <div class="qr-panel" data-quran-panel="juz" hidden><div class="qr-juz-grid" id="quranJuzList">${Array.from({length:30},(_,i)=>`<button type="button" class="qr-juz" data-open-juz="${i+1}"><small>JUZ</small><strong>${i+1}</strong></button>`).join('')}</div></div>
      <div class="qr-panel qr-mushaf-panel" data-quran-panel="page" hidden>
        <label class="v404-label" for="quranMushaf">Mushaf edition</label>
        <select class="v404-input qr-mushaf-select" id="quranMushaf" aria-describedby="quranMushafNote">
          <option value="quran-uthmani" data-label="Madani">Madani · 604 pages</option>
          <option value="indopak" data-label="Indo-Pak">Indo-Pak · 604 pages</option>
          <option value="indopak15" data-label="Indo-Pak 15-line">Indo-Pak · 15 lines · 610 pages</option>
          <option value="indopak16" data-label="Indo-Pak 16-line">Indo-Pak · 16 lines · 548 pages</option>
        </select>
        <label class="v404-label" for="quranPage">Page number</label>
        <div class="qr-page-row"><input class="v404-input" id="quranPage" type="number" min="1" max="604" value="1" inputmode="numeric"><button class="v404-primary" id="quranOpenPage" type="button">Open page</button></div>
        <div class="qr-reading-modes" role="group" aria-label="Reading layout">
          <button type="button" data-reading-mode="page" class="selected" aria-pressed="true">Page reader</button>
          <button type="button" data-reading-mode="verse" aria-pressed="false">Verse reader</button>
          <button type="button" data-reading-mode="line" aria-pressed="false">15-line view</button>
        </div>
        <p class="v404-note" id="quranMushafNote">Madani page reader. Choose an edition to load its own verified page map.</p>
      </div>
      <div class="qr-panel" data-quran-panel="bookmarks" hidden><div id="quranBookmarkList" class="quran-bookmark-list"><p class="v404-note">Your saved verses will appear here.</p></div></div>
      <div class="qr-panel" data-quran-panel="memory" hidden><div id="quranMemory"></div></div>
      <div class="qr-offline"><button class="v404-secondary quran-download" id="quranDownloadOffline" type="button">Save Quran text offline</button><p class="v404-note" id="quranOfflineStatus" aria-live="polite">Offline text is optional and stored on this device, with English meanings. Recitation audio requires internet.</p><p class="v404-note" id="quranStatus" aria-live="polite"></p></div>
      <p class="v404-note qr-foot">Translation is an interpretation of meaning, not a replacement for the Arabic Qur’an. Quran text can be saved to this device for offline reading. Audio is fetched on first play and is not included in the offline text download. Provider and contributor acknowledgements are listed in Settings → About Naseem → Credits &amp; Acknowledgements.</p>
    </div>
    <div class="qr-reader" id="quranReader" hidden>
      <div class="qr-bar-spacer"></div>
      <div class="qr-settings" id="quranSettings" hidden>
        <div class="qr-set-row qr-qari-setting"><span>Reciter</span><button type="button" class="qr-qari-toggle" id="quranQariToggle" aria-expanded="false" aria-controls="quranQariMenu">Choose Qari <span aria-hidden="true">⌄</span></button></div>
        <div class="qr-qari-menu" id="quranQariMenu" role="listbox" aria-label="Quran reciters" hidden>
          ${QARIS.map(qariOptionHTML).join('')}
        </div>
        <div class="qr-set-row"><span>Arabic size</span><div class="qr-size"><small>A</small><input class="quran-font-range" id="quranFontSize" type="range" min="22" max="42" step="1" value="30" aria-label="Arabic text size"><b>A</b></div></div>
        <div class="qr-set-row"><span>Display</span><div class="qr-seg" id="quranEditionSeg"><button type="button" data-quran-edition="arabic">Arabic</button><button type="button" data-quran-edition="translation">+ English</button></div></div>
        <div class="qr-set-row qr-layout-row"><span>Reading layout</span><div class="qr-reading-modes" role="group" aria-label="Quran reading layout"><button type="button" data-reading-mode="page">Page</button><button type="button" data-reading-mode="verse">Verse</button><button type="button" data-reading-mode="line">15-line</button></div></div>
        <div class="qr-set-row"><span>Keep recitation centred</span><button type="button" class="qr-switch" id="quranFollow" role="switch" aria-checked="true" aria-label="Keep the recited ayah centred"><i></i></button></div>
        <div class="qr-set-row"><span>Memorise</span><div class="qr-seg qr-seg-actions"><button type="button" id="quranMemMode" aria-pressed="false">${ICON.eyeOff}<em>Hide text</em></button><button type="button" id="quranMemSurah">${ICON.plus}<em>Add surah</em></button></div></div>
        <p class="v404-note">Recitation follows each ayah as it is read. Tap the text size or display options to change how it looks.</p>
      </div>
      <p class="qr-status" id="quranReaderStatus" aria-live="polite"></p>
      <div id="quranSurahHead"></div>
      <div id="quranVerses" class="qr-verses"></div>
      <div class="qr-surah-nav"><button class="v404-secondary" id="quranPrev" type="button" disabled>Previous surah</button><button class="v404-secondary" id="quranNext" type="button" disabled>Next surah</button><button class="v404-secondary" id="quranBookmarkPage" type="button" hidden>Save page</button></div>
    </div>
    <div class="qr-review" id="quranReview" hidden></div>`;
  document.querySelector('main')?.appendChild(section);
  // Mini player lives outside the screen so it can float above the navigation bar.
  const player=document.createElement('div');player.id='quranPlayer';player.className='qr-player';player.hidden=true;
  player.innerHTML=`${waveSeekHTML("quranSeek")}<div class="qr-player-main"><span id="quranMiniAvatar" class="qr-mini-avatar" aria-hidden="true"></span><button type="button" class="qr-player-info" id="quranExpandPlayer" aria-label="Open full Quran player"><strong id="quranNowPlaying">Quran recitation</strong><small id="quranPlaybackStatus" aria-live="polite">Ready to play.</small></button><button type="button" class="qr-pbtn" id="quranLocate" aria-label="Centre the ayah being recited">${ICON.locate}</button><button type="button" class="qr-pbtn" id="quranPrevAyah" aria-label="Previous ayah">${ICON.prev}</button><button type="button" class="qr-pbtn qr-pmain" id="quranPauseResume" aria-label="Play">${ICON.play}</button><button type="button" class="qr-pbtn" id="quranNextAyah" aria-label="Next ayah">${ICON.next}</button><button type="button" class="qr-pbtn" id="quranStop" aria-label="Stop recitation">${ICON.close}</button></div><audio id="quranAudio" preload="none" aria-label="Quran recitation audio"></audio>`;
  { const miniSeek=player.querySelector('#quranSeek'); if(miniSeek) miniSeek.dataset.flat='1'; }
  const fullPlayer=document.createElement('section');fullPlayer.id='quranFullPlayer';fullPlayer.className='qr-full-player';fullPlayer.hidden=true;fullPlayer.setAttribute('aria-hidden','true');
  fullPlayer.innerHTML=`<div class="qr-full-sheet"><span class="qr-full-handle" aria-hidden="true"></span>
    <header class="qr-full-top"><button type="button" class="qr-full-icon" id="quranFullClose" aria-label="Close player">${ICON.down}</button><div><small>NOW PLAYING</small><strong>QURAN RECITATION</strong></div><button type="button" class="qr-full-icon" id="quranFullStop" aria-label="Stop recitation">${ICON.close}</button></header>
    <div class="qr-full-content"><div class="qr-full-stage">
      <div class="qr-full-hero"><div class="qr-full-art" aria-hidden="true"><span class="qr-art-mark" id="quranArtName">۞</span><span class="qr-art-caption" id="quranArtCaption">NASEEM · QURAN</span></div>
        <div class="qr-full-track"><span class="eyebrow">NOW RECITING</span><h2 id="quranFullTitle">Al-Quran</h2><p class="qr-full-reference" id="quranFullReference">Ready when you are</p>
          <div class="qr-full-identity"><span id="quranFullAvatar"></span><span class="qr-full-identity-copy"><small>RECITER</small><strong id="quranFullReciter">Muhammad Al-Luhaidan</strong></span><b id="quranFullMode" class="qr-mode">Word by word</b></div>
          <span id="quranFullStatus" class="qr-sr" aria-live="polite">Choose a surah to begin.</span></div></div>
      <div class="qr-lyrics-wrap" id="quranLyricsWrap"><div class="qr-lyrics-head"><strong id="quranLyricsTitle">Al-Quran</strong><small>Tap a verse to recite from it</small></div><div class="qr-lyrics" id="quranLyrics" role="list" aria-label="Verse by verse lyrics"></div></div>
    </div><div class="qr-full-transport">${waveSeekHTML("quranFullSeek")}<div class="qr-full-times"><span id="quranFullElapsed">0:00</span><span id="quranFullDuration">0:00</span></div>
      <div class="qr-full-controls"><button type="button" class="qr-full-side" id="quranLyricsToggle" aria-pressed="false" aria-label="Show verse by verse lyrics">${ICON.lyrics}</button><button type="button" class="qr-full-secondary" id="quranFullPrev" aria-label="Previous ayah">${ICON.prev}</button><button type="button" class="qr-full-play" id="quranFullToggle" aria-label="Play">${ICON.play}</button><button type="button" class="qr-full-secondary" id="quranFullNext" aria-label="Next ayah">${ICON.next}</button><button type="button" class="qr-full-side qr-full-qari" id="quranFullReciterBtn" aria-expanded="false" aria-label="Choose reciter"><span id="quranFullAvatarButton"></span></button></div>
      <div class="qr-sleep-row"><button type="button" class="qr-sleep-btn" id="quranSleepBtn" aria-haspopup="dialog" aria-expanded="false" aria-pressed="false">${ICON.moon}<span id="quranSleepLabel">Sleep</span></button><button type="button" class="qr-sleep-btn" id="quranQueueBtn" aria-haspopup="dialog" aria-expanded="false">${ICON.lyrics}<span>Up next</span></button></div>
      <p class="qr-full-note">Playback continues while you browse Naseem.</p></div></div>
    <div class="qr-qsheet-backdrop" id="quranQSheetBackdrop"></div><div class="qr-qsheet" id="quranFullQariSheet" role="dialog" aria-label="Choose reciter"><span class="qr-full-handle" aria-hidden="true"></span><strong class="qr-qsheet-title">Choose a reciter</strong><div class="qr-qsheet-list" id="quranFullQariList" role="listbox">${QARIS.map(qariOptionHTML).join('')}</div></div>
    <div class="qr-sleep-sheet" id="quranSleepSheet" role="dialog" aria-label="Sleep timer"><span class="qr-full-handle" aria-hidden="true"></span><strong class="qr-qsheet-title">Sleep timer</strong><div class="qr-qsheet-list" id="quranSleepList" role="radiogroup" aria-label="Stop recitation after">${(window.NaseemPlayerCore?window.NaseemPlayerCore.SLEEP_OPTIONS:[{id:'off',label:'Off'}]).map(o=>`<button type="button" class="qr-sleep-opt" role="radio" aria-checked="false" data-sleep="${o.id}">${o.label}</button>`).join('')}</div></div></div>`
  // The headers are fixed to the viewport. They live outside the screen element because the screen keeps a transform
  // after its entrance animation, which would turn "fixed" into "fixed to the screen".
  const readerBar=document.createElement('div');readerBar.id='quranReaderBar';readerBar.className='qr-bar';readerBar.hidden=true;
  readerBar.innerHTML=`<button type="button" class="qr-icon" id="quranBack" aria-label="Back to the Quran index">${ICON.back}</button><div class="qr-bar-title"><strong id="quranReaderTitle">Al-Quran</strong><small id="quranReaderSub"></small></div><button type="button" class="qr-icon" id="quranPlaySurah" aria-label="Play recitation">${ICON.play}</button><button type="button" class="qr-icon" id="quranSettingsBtn" aria-label="Reading settings" aria-expanded="false">${ICON.sliders}</button>`;
  const reviewBar=document.createElement('div');reviewBar.id='quranReviewBar';reviewBar.className='qr-bar';reviewBar.hidden=true;
  const shell=document.querySelector('.app-shell')||document.body;shell.appendChild(readerBar);shell.appendChild(reviewBar);shell.appendChild(player);shell.appendChild(fullPlayer);

  const PROGRESS_KEY='naseem-quran-progress-v1', CACHE_KEY='naseem-quran-cache-v1', BOOKMARK_KEY='naseem-quran-bookmarks-v1', FONT_KEY='naseem-quran-font-size-v1';
  const SURAHS_KEY='naseem-quran-surahs-v1', EDITION_KEY='naseem-quran-edition-v1', FOLLOW_KEY='naseem-quran-follow-v1', MEMORY_KEY='naseem-quran-memory-v1';
  const readJSON=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch(_){return fallback;}};
  const writeJSON=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}};
  const todayISO=()=>Mem.localISO(new Date());
  let surahs=readJSON(SURAHS_KEY,[]), current=1, busy=false, listLoaded=false, surahRenderToken=0, ayahRenderToken=0, searchTimer=null;
  let readingMode=(()=>{try{return ['verse','line','page'].includes(localStorage.getItem('naseem-quran-reading-mode'))?localStorage.getItem('naseem-quran-reading-mode'):'page';}catch(_){return 'page';}})(), currentPage=1, pageReading=false;
  const MUSHAF_CATALOG={
    'quran-uthmani':{id:1,label:'Madani',pages:604,kind:'madani',script:'text_uthmani'},
    'indopak':{id:3,label:'Indo-Pak',pages:604,kind:'indopak',script:'text_indopak_nastaleeq'},
    indopak15:{id:6,label:'Indo-Pak 15-line',pages:610,kind:'indopak-lines',lines:15,script:'text_indopak_nastaleeq'},
    indopak16:{id:7,label:'Indo-Pak 16-line',pages:548,kind:'indopak-page',lines:16,script:'text_indopak_nastaleeq'}
  };
  let mushafEdition=(()=>{try{const v=localStorage.getItem('naseem-quran-mushaf')||'quran-uthmani';return MUSHAF_CATALOG[v]?v:'quran-uthmani';}catch(_){return 'quran-uthmani';}})(), mushafLabel=MUSHAF_CATALOG[mushafEdition].label;
  const qfProxy=String(window.NASEEM_QF_PROXY_URL||'').replace(/\/$/,'');
  const mushafInfo=()=>MUSHAF_CATALOG[mushafEdition]||MUSHAF_CATALOG['quran-uthmani'];
  const mushafPageCount=()=>mushafInfo().pages;
  const qfCache=new Map();
  /* Where Mushaf editions come from. With NASEEM_QF_PROXY_URL set, the Naseem worker (official Quran Foundation API with credentials).
     Otherwise the app asks Quran.com's public, credential-free v4 API directly with the same parameters the worker would send,
     so the Indo-Pak editions work out of the box. The public API is the one Quran Foundation calls "the older unauthenticated API":
     if it ever goes away, deploying the worker (see its README) restores the feature without touching the app. */
  const QF_PUBLIC='https://api.quran.com/api/v4';
  function qfPublicUrl(path){
    const [route,qs='']=path.split('?'),q=new URLSearchParams(qs);
    if(route==='chapters')return `${QF_PUBLIC}/chapters?language=en`;
    const m=route.match(/^page\/(\d+)$/);
    if(m)return `${QF_PUBLIC}/verses/by_page/${m[1]}?${new URLSearchParams({mushaf:q.get('mushaf')||'',words:'true',word_fields:'text_indopak_nastaleeq,text_indopak,line_number,page_number,char_type_name',fields:'text_indopak_nastaleeq,text_indopak',translations:q.get('translation')||'131',per_page:'50'})}`;
    if(route==='lookup')return `${QF_PUBLIC}/pages/lookup?${new URLSearchParams({mushaf:q.get('mushaf')||'',from:q.get('from')||'',to:q.get('to')||q.get('from')||''})}`;
    throw new Error('Unknown Mushaf request');
  }
  async function qfRequest(path){
    const key=path;
    if(qfCache.has(key))return qfCache.get(key);
    const url=qfProxy?`${qfProxy}/api/mushaf/${path}`:qfPublicUrl(path);
    let response;
    try{response=await fetch(url,{headers:{Accept:'application/json'}});}
    catch(_){throw new Error('Could not reach the Quran page service. Check your connection and try again.');}
    if(!response.ok){let message=`Quran service returned ${response.status}`;try{const body=await response.json();message=body.message||body.error||message;}catch(_){}throw new Error(message);}
    const data=await response.json();qfCache.set(key,data);
    if(qfCache.size>30)qfCache.delete(qfCache.keys().next().value);
    return data;
  }
  let progress=readJSON(PROGRESS_KEY,{surah:1,ayah:1}), cache=readJSON(CACHE_KEY,{}), bookmarks=readJSON(BOOKMARK_KEY,[]);
  let memory=Mem.sanitize(readJSON(MEMORY_KEY,{}),todayISO());
  let edition=(()=>{try{return localStorage.getItem(EDITION_KEY)==='arabic'?'arabic':'translation';}catch(_){return 'translation';}})();
  let autoFollow=(()=>{try{return localStorage.getItem(FOLLOW_KEY)!=='0';}catch(_){return true;}})();
  let recitation=$('quranAudio'), audioQueue=[], audioIndex=0, playMode='surah', playToken=0, activeEl=null, activeWordEl=null, wordElements=new Map(), lastUserScroll=0, memoryMode=false, view='surah', surahMeta=null, session=null;
  let lyricsSurah=0, lyricWords=new Map(), activeLyricWordEl=null, lyricUserScroll=0, fullAnim=null, dragFull=null;
  recitation.preload='none';
  const DB_NAME='naseem-quran-offline-v1', DB_STORE='surahs';
  let dbPromise=null;
  function openOfflineDB(){if(!('indexedDB' in window))return Promise.reject(new Error('Offline storage is unavailable'));if(dbPromise)return dbPromise;dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(DB_STORE))req.result.createObjectStore(DB_STORE,{keyPath:'key'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Database open failed'));});return dbPromise;}
  async function getOfflineSurah(key){const db=await openOfflineDB();return new Promise((resolve,reject)=>{const req=db.transaction(DB_STORE,'readonly').objectStore(DB_STORE).get(key);req.onsuccess=()=>resolve(req.result?.payload||null);req.onerror=()=>reject(req.error);});}
  async function getOfflineSurahMap(){const db=await openOfflineDB();return new Promise((resolve,reject)=>{const req=db.transaction(DB_STORE,'readonly').objectStore(DB_STORE).getAll();req.onsuccess=()=>resolve(new Map((req.result||[]).map(row=>[row.key,row.payload])));req.onerror=()=>reject(req.error||new Error('Offline index read failed'));});}
  async function putOfflineSurahs(entries){if(!entries.length)return true;const db=await openOfflineDB();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite'),store=tx.objectStore(DB_STORE),savedAt=Date.now();for(const [key,payload] of entries)store.put({key,payload,savedAt});tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error||new Error('Offline save failed'));tx.onabort=()=>reject(tx.error||new Error('Offline save aborted'));});}
  async function putOfflineSurah(key,payload){return putOfflineSurahs([[key,payload]]);}
  const saveCache=(key,value)=>{try{cache[key]=value;const keys=Object.keys(cache);while(keys.length>10)delete cache[keys.shift()];localStorage.setItem(CACHE_KEY,JSON.stringify(cache));}catch(_){}};
  const surahName=n=>surahs[n-1]?.englishName||`Surah ${n}`;
  const status=m=>{if($('quranStatus'))$('quranStatus').textContent=m;if($('quranReaderStatus'))$('quranReaderStatus').textContent=m;};
  const notify=m=>{status(m);if(typeof window.toast==='function')try{window.toast(m);}catch(_){}};

  /* ---------- progress, hero and bookmarks ---------- */
  const saveProgress=(surah,ayah,juz=progress.juz||1)=>{progress={surah:Number(surah)||1,ayah:Number(ayah)||1,juz:Number(juz)||1,updatedAt:Date.now()};writeJSON(PROGRESS_KEY,progress);renderHero();};
  function renderHero(){
    const has=!!progress.updatedAt;
    $('quranResumeLabel').textContent=has?'CONTINUE READING':'BEGIN READING';
    $('quranResumeName').textContent=has?surahName(progress.surah||1):'Al-Fatihah';
    $('quranResumeMeta').textContent=`Ayah No. ${has?(progress.ayah||1):1}`;
  }
  const saveBookmarks=()=>writeJSON(BOOKMARK_KEY,bookmarks);
  const PAGE_BOOKMARK_KEY='naseem-quran-page-bookmarks-v1';
  let pageBookmarks=readJSON(PAGE_BOOKMARK_KEY,[]);
  const savePageBookmarks=()=>writeJSON(PAGE_BOOKMARK_KEY,pageBookmarks);
  const isPageBookmarked=(edition,page)=>pageBookmarks.some(x=>x.edition===edition&&Number(x.page)===Number(page));
  function syncPageBookmarkButton(){
    const button=$('quranBookmarkPage');if(!button)return;
    button.hidden=!pageReading;
    const saved=isPageBookmarked(mushafEdition,currentPage);
    button.textContent=saved?'Page saved':'Save page';
    button.setAttribute('aria-pressed',String(saved));
  }
  const isBookmarked=(surah,ayah)=>bookmarks.some(b=>b.surah===surah&&b.ayah===ayah);
  function renderBookmarks(){
    const host=$('quranBookmarkList');if(!host)return;
    const verseItems=bookmarks.map(b=>`<button type="button" class="quran-bookmark-item" data-open-bookmark="${Number(b.surah)}:${Number(b.ayah)}"><span class="qb-ic">${ICON.bookmarkOn}</span><span class="qb-copy"><strong>${esc(b.name||surahName(b.surah))}</strong><small>Ayah ${Number(b.ayah)} · ${Number(b.surah)}:${Number(b.ayah)}</small></span><span class="qb-go">Open</span></button>`);
    const pageItems=pageBookmarks.map(b=>`<button type="button" class="quran-bookmark-item" data-open-page-bookmark="${esc(b.edition)}:${Number(b.page)}"><span class="qb-ic">${ICON.bookmarkOn}</span><span class="qb-copy"><strong>${esc(MUSHAF_CATALOG[b.edition]?.label||b.edition)}</strong><small>Page ${Number(b.page)} · ${new Date(Number(b.savedAt)||Date.now()).toLocaleDateString()}</small></span><span class="qb-go">Open</span></button>`);
    host.innerHTML=[...pageItems,...verseItems].join('')||'<p class="v404-note">No saved pages or verses yet. Save a page or tap the bookmark beside an ayah.</p>';
  }

  /* ---------- Quran index ---------- */
  const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()));
  function surahSkeletonHTML(count=6){return Array.from({length:count},()=>'<div class="qr-skeleton-row"><i></i><span><b></b><small></small></span><em></em></div>').join('');}
  function ayahSkeletonHTML(count=5){return Array.from({length:count},()=>'<div class="qr-ayah-skeleton"><i></i><b></b><small></small></div>').join('');}
  async function renderSurahList(){
    const host=$('quranSurahList');if(!host)return;
    const token=++surahRenderToken;
    if(!surahs.length){host.innerHTML=surahSkeletonHTML(5);return;}
    const raw=($('quranSearch')?.value||'').trim(),q=raw.toLowerCase();
    const rows=surahs.filter(x=>!q||String(x.number)===q||String(x.englishName||'').toLowerCase().includes(q)||String(x.englishNameTranslation||'').toLowerCase().includes(q)||String(x.name||'').includes(raw));
    if(!rows.length){host.innerHTML='<p class="v404-note">No surah matches your search.</p>';return;}
    host.innerHTML='';
    const batchSize=24;
    for(let i=0;i<rows.length;i+=batchSize){
      if(token!==surahRenderToken)return;
      const html=rows.slice(i,i+batchSize).map(x=>{const n=Number(x.number);return `<div class="qr-row"><button type="button" class="qr-play" data-play-surah="${n}" aria-label="Play surah ${esc(x.englishName)}"><span class="qr-star">${ICON.star}</span><span class="qr-star-ic">${ICON.play}</span></button><button type="button" class="qr-row-main" data-open-surah="${n}"><strong>${n}. ${esc(x.englishName)}</strong><small>${esc(x.englishNameTranslation||'')} · ${Number(x.numberOfAyahs)} Ayahs</small></button><span class="qr-ar" lang="ar" dir="rtl" translate="no">${esc(x.name)}</span></div>`;}).join('');
      const chunk=document.createElement('div');chunk.innerHTML=html;host.append(...chunk.childNodes);
      if(i+batchSize<rows.length)await nextFrame();
    }
  }
  async function loadSurahList(){
    if(surahs.length)renderSurahList();else $('quranSurahList').innerHTML=surahSkeletonHTML(6);
    try{const rows=await request('/surah');if(!Array.isArray(rows)||rows.length!==114)throw new Error('Unexpected surah list');surahs=rows;writeJSON(SURAHS_KEY,rows);listLoaded=true;renderSurahList();renderHero();renderMemory();}
    catch(_){if(!surahs.length){renderSurahList();status('Could not load the Quran index. Check your connection and retry.');}}
  }
  function switchQuranView(next){
    view=next;
    document.querySelectorAll('[data-quran-view]').forEach(b=>{const on=b.dataset.quranView===next;b.classList.toggle('selected',on);b.setAttribute('aria-selected',String(on));});
    document.querySelectorAll('[data-quran-panel]').forEach(p=>p.hidden=p.dataset.quranPanel!==next);
    if(next==='bookmarks')renderBookmarks();if(next==='memory')renderMemory();
  }
  function syncImmersive(){const act=screenActive(),readerOn=act&&!$('quranReader').hidden,reviewOn=act&&!$('quranReview').hidden;document.body.classList.toggle('qr-immersive',readerOn||reviewOn);readerBar.hidden=!readerOn;reviewBar.hidden=!reviewOn;}
  const reduceMotion=()=>document.body.classList.contains('lite')||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  function miniInset(){const r=player.getBoundingClientRect();if(player.hidden||!r.width||!r.height)return null;return `inset(${Math.max(0,r.top)}px ${Math.max(0,innerWidth-r.right)}px ${Math.max(0,innerHeight-r.bottom)}px ${Math.max(0,r.left)}px round 20px)`;}
  function openFullPlayer(){
    if(!audioQueue.length||!fullPlayer.hidden)return;
    const from=reduceMotion()?null:miniInset();
    fullPlayer.hidden=false;fullPlayer.setAttribute('aria-hidden','false');document.body.classList.add('qr-full-player-open');fullPlayer.style.transform='';
    updatePlayerVisibility();syncFullPlayer();
    if(fullAnim){fullAnim.cancel();fullAnim=null;}
    if(from&&fullPlayer.animate){fullPlayer.classList.add('qr-opening');fullAnim=fullPlayer.animate([{clipPath:from,opacity:.55},{clipPath:'inset(0px 0px 0px 0px round 0px)',opacity:1}],{duration:480,easing:'cubic-bezier(.22,1,.36,1)'});const a=fullAnim;a.onfinish=()=>{if(fullAnim===a)fullAnim=null;fullPlayer.classList.remove('qr-opening');};a.oncancel=()=>fullPlayer.classList.remove('qr-opening');}
    if(fullPlayer.classList.contains('qr-lyrics-on')){const line=$('quranLyrics').querySelector('.qr-lyric.active');if(line)centerLyric(line,false,true);}
  }
  function closeFullPlayer(animated=false){
    if(fullPlayer.hidden)return;
    const finish=()=>{if(fullAnim){fullAnim.cancel();fullAnim=null;}fullPlayer.hidden=true;queueEl.hidden=true;fullPlayer.classList.remove('qr-queue-open');fullPlayer.setAttribute('aria-hidden','true');fullPlayer.classList.remove('qr-closing','qr-opening','qr-sheet-open','qr-sleep-open');fullPlayer.style.transform='';document.body.classList.remove('qr-full-player-open');updatePlayerVisibility();};
    if(fullAnim){fullAnim.cancel();fullAnim=null;}
    if(!animated||reduceMotion()||!fullPlayer.animate||!audioQueue.length){finish();return;}
    player.classList.remove('qr-player-away');const to=miniInset();
    if(!to){finish();return;}
    fullPlayer.classList.add('qr-closing');
    const a=fullPlayer.animate([{clipPath:'inset(0px 0px 0px 0px round 0px)',opacity:1},{clipPath:to,opacity:.5}],{duration:360,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
    fullAnim=a;a.onfinish=()=>{if(fullAnim===a)finish();};
  }
  const fmtTime=value=>{const n=Math.max(0,Math.floor(Number(value)||0));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;};
  function syncReciterUI(){const q=qari(),mode=$('quranFullMode');$('quranFullReciter').textContent=q.name;if(mode){mode.textContent=q.wordSync?'Word by word':'Verse by verse';mode.classList.toggle('is-word',q.wordSync);}$('quranFullAvatar').innerHTML=qariAvatarHTML(q,true);$('quranFullAvatarButton').innerHTML=qariAvatarHTML(q);$('quranMiniAvatar').innerHTML=qariAvatarHTML(q);$('quranMiniAvatar').setAttribute('aria-label',q.name);}
  function syncFullPlayer(){const item=audioQueue[audioIndex];if(!item)return;syncReciterUI();const surahNo=Number(item.surah)||current,ayahNo=Number(item.numberInSurah)||progress.ayah||1,total=surahs[surahNo-1]?.numberOfAyahs;$('quranFullTitle').textContent=`${surahNo}. ${surahName(surahNo)}`;$('quranLyricsTitle').textContent=`${surahNo}. ${surahName(surahNo)}`;$('quranFullReference').textContent=`Ayah ${ayahNo}${total?` of ${total}`:''}`;$('quranFullStatus').textContent=recitation.paused?'Paused':'Now reciting';morph($('quranFullToggle'),!recitation.paused);$('quranFullToggle').setAttribute('aria-label',recitation.paused?'Play':'Pause');syncArt(surahNo);renderQueue(surahNo);}
  /* ---------- artwork: the surah's own name over a per-surah gradient ---------- */
  const artOn=()=>{try{return localStorage.getItem('naseemArtV1')!=='off';}catch(_){return true;}};
  const artHue=n=>(140+((n*47)%100))%360;
  const plainName=n=>String(surahs[n-1]?.name||'').replace(/^\s*سُورَةُ\s*/,'').replace(/^\s*سورة\s*/,'').trim();
  function syncArt(n){const art=document.querySelector('.qr-full-art'),nm=$('quranArtName'),cap=$('quranArtCaption');if(!art||!nm)return;
    const on=artOn()&&plainName(n);fullPlayer.classList.toggle('qr-art-names',!!on);fullPlayer.style.setProperty('--art-h',artHue(n));
    nm.textContent=on?plainName(n):'۞';cap.textContent=on?`SURAH ${n} · ${surahs[n-1]?.numberOfAyahs||''} AYAHS`:'NASEEM · QURAN';}
  document.addEventListener('naseem:art-changed',()=>{const it=audioQueue[audioIndex];if(it)syncArt(Number(it.surah)||current);});
  /* ---------- Up next: the surahs that follow the current one ---------- */
  const queueEl=document.createElement('section');queueEl.className='qr-queue';queueEl.id='quranQueue';queueEl.hidden=true;queueEl.setAttribute('aria-label','Up next');
  queueEl.innerHTML=`<header class="qr-full-top"><button type="button" class="qr-full-icon" id="quranQueueClose" aria-label="Close queue">${ICON.back}</button><div><small>PLAYING QUEUE</small><strong id="quranQueueTitle">Up next</strong></div><span class="qr-top-spacer"></span></header><p class="qr-queue-note" id="quranQueueNote"></p><div class="qr-queue-list" id="quranQueueList" role="list"></div>`;
  fullPlayer.appendChild(queueEl);
  function renderQueue(n){const list=$('quranQueueList');if(!list)return;n=n||Number((audioQueue[audioIndex]||{}).surah)||current;
    const upto=Math.min(114,n+30),rows=[];
    for(let i=n;i<=upto;i++){const s=surahs[i-1]||{};const cur=i===n;
      rows.push(`<button type="button" class="qr-queue-row${cur?' current':''}" data-n="${i}" role="listitem" style="--art-h:${artHue(i)}"><span class="qr-queue-tile">${i}</span><span class="qr-queue-copy"><strong>${s.englishName||'Surah '+i}</strong><small>${cur?'Now playing · ':''}${s.numberOfAyahs||''} ayahs${s.revelationType?' · '+s.revelationType:''}</small></span><span class="qr-queue-ar">${plainName(i)}</span></button>`);}
    list.innerHTML=rows.join('');
    const left=114-n;$('quranQueueTitle').textContent=left>0?`Up next · ${left} surah${left===1?'':'s'}`:'Last surah';
    $('quranQueueNote').textContent=playMode==='surah'?(left>0?'Each surah continues into the next.':'End of the Quran.'):'Playing one verse at a time; the list shows what comes next in surah order.';}
  function toggleQueue(on){queueEl.hidden=!on;fullPlayer.classList.toggle('qr-queue-open',on);$('quranQueueBtn').setAttribute('aria-expanded',String(on));
    if(on){renderQueue();$('quranQueueList').scrollTop=0;}}
  $('quranQueueBtn').addEventListener('click',()=>toggleQueue(true));
  $('quranQueueClose').addEventListener('click',()=>toggleQueue(false));
  $('quranQueueList').addEventListener('click',async e=>{const r=e.target.closest('.qr-queue-row');if(!r)return;const n=Number(r.dataset.n);toggleQueue(false);
    if(r.classList.contains('current'))return;const ok=await loadSurah(n);if(ok!==false){await startPlayback(1);if(fullPlayer.hidden&&audioQueue.length)openFullPlayer();}});

  /* Short slide-in when moving between the surah index and the reader (transform + opacity only; skipped in Smooth / reduced-motion). */
  function qrSlideIn(el,back){if(!el)return;el.classList.remove('qr-in-next','qr-in-prev');if(reduceMotion())return;void el.offsetWidth;el.classList.add(back?'qr-in-prev':'qr-in-next');setTimeout(()=>el.classList.remove('qr-in-next','qr-in-prev'),340);}
  function showHome(){$('quranReader').hidden=true;$('quranReview').hidden=true;$('quranHome').hidden=false;syncImmersive();window.scrollTo(0,0);renderMemory();qrSlideIn($('quranHome'),true);}
  function showReader(){$('quranHome').hidden=true;$('quranReview').hidden=true;$('quranReader').hidden=false;syncImmersive();window.scrollTo(0,0);qrSlideIn($('quranReader'),false);}
  const readerOpen=()=>!$('quranReader').hidden;
  const screenActive=()=>document.querySelector('.screen.active')?.id==='quranReaderScreen';

  /* ---------- text loading ---------- */
  async function peekPayload(key){try{const p=await getOfflineSurah(key);if(p)return p;}catch(_){}return cache[key]||null;}
  async function getSurahData(n,ed){
    // Surah view uses AlQuran Cloud's script editions; page layout and line positions
    // are handled separately by the Quran Foundation Mushaf page API.
    const scriptEdition=mushafEdition==='quran-uthmani'?'quran-uthmani':'quran-indopak';
    const key=mushafEdition==='quran-uthmani'?`${n}:${ed}`:`${n}:${ed}:${scriptEdition}`;
    const editions=ed==='translation'?`${scriptEdition},en.pickthall`:scriptEdition;
    let payload=null,note='';
    try{payload=await getOfflineSurah(key);if(payload)note='Loaded from your saved Quran text.';}catch(_){}
    if(!payload){
      try{payload=await request(`/surah/${n}/editions/${editions}`);saveCache(key,payload);try{await putOfflineSurah(key,payload);}catch(_){}note='Loaded from AlQuran Cloud and saved on this device.';}
      catch(error){
        payload=cache[key];if(payload)note='Offline · showing recently cached text for this surah.';
        if(!payload&&ed==='translation'&&scriptEdition==='quran-uthmani'){const arabicOnly=await peekPayload(`${n}:arabic`);if(arabicOnly){payload=arabicOnly;note='Offline · English meaning is not saved for this surah, showing Arabic.';}}
        if(!payload)throw error;
      }
    }
    const items=Array.isArray(payload)?payload:[payload];
    const arabicItem=items.find(x=>String(x.edition?.identifier||'')===scriptEdition)||items.find(x=>String(x.edition?.identifier||'').includes(scriptEdition==='quran-indopak'?'indopak':'uthmani')||x.englishName||x.name)||items[0]||{};
    const arabic=arabicItem.ayahs||[];
    const english=items.find(x=>String(x.edition?.identifier||'').includes('pickthall'))?.ayahs||[];
    if(!arabic.length)throw new Error('No verses returned');
    return {arabic,english,meta:arabicItem,note};
  }

  /* ---------- reader ---------- */
  const markerHTML=n=>`<span class="qr-end" aria-hidden="true">﴿${Mem.toArabicDigits(n)}﴾</span>`;
  function ayahHTML(a,englishByNo,surahNo){
    const s=Number(a.surah?.number)||surahNo,n=Number(a.numberInSurah),parts=n===1?Mem.splitBismillah(s,a.text):{bismillah:'',rest:a.text};
    const inDeck=Mem.has(memory,s,n),marked=isBookmarked(s,n),id=s===current?`quran-ayah-${n}`:`quran-ayah-${s}-${n}`;
    const head=parts.bismillah?`<p class="qr-bismillah" lang="ar" dir="rtl" translate="no">${esc(parts.bismillah)}</p>`:'';
    const words=String(parts.rest||'').trim().split(/\s+/).filter(Boolean);
    const wordHTML=words.map((word,i)=>`<span class="qr-word" data-word-key="${s}:${n}:${i+1}">${esc(word)}</span>`).join(' ');
    const translation=englishByNo.get(`${s}:${n}`)??englishByNo.get(n);
    return `${head}<article class="quran-ayah" id="${id}" data-ayah="${n}" data-surah="${s}"><div class="qa-top"><span class="qa-badge">${s}:${n}</span><div class="quran-ayah-actions"><button type="button" class="qa-btn" data-play-ayah="${n}" data-play-surah="${s}" aria-label="Play recitation for ${s}:${n}">${ICON.play}</button><button type="button" class="qa-btn${marked?' on':''}" data-bookmark-ayah="${n}" data-bookmark-surah="${s}" aria-pressed="${marked}" aria-label="Save ${s}:${n}">${marked?ICON.bookmarkOn:ICON.bookmark}</button><button type="button" class="qa-btn${inDeck?' on':''}" data-mem-ayah="${n}" data-mem-surah="${s}" aria-pressed="${inDeck}" aria-label="${inDeck?'Remove from':'Add to'} memorisation ${s}:${n}">${inDeck?ICON.check:ICON.plus}</button></div></div><p class="v404-arabic quran-arabic" lang="ar" dir="rtl" translate="no">${wordHTML} ${markerHTML(n)}</p>${translation?`<p class="quran-translation">${esc(translation)}</p>`:''}<i class="qa-progress" aria-hidden="true"></i></article>`;
  }
  async function renderAyahsProgressively(host,ayahs,englishByNo,surahNo){
    const token=++ayahRenderToken;host.innerHTML=ayahSkeletonHTML(6);await nextFrame();
    if(token!==ayahRenderToken)return false;
    host.innerHTML='';wordElements.clear();activeWordEl=null;
    const batchSize=28;
    for(let i=0;i<ayahs.length;i+=batchSize){
      if(token!==ayahRenderToken)return false;
      const html=ayahs.slice(i,i+batchSize).map(a=>ayahHTML(a,englishByNo,surahNo)).join('');
      const chunk=document.createElement('div');chunk.innerHTML=html;host.append(...chunk.childNodes);
      if(i+batchSize<ayahs.length)await nextFrame();
    }
    host.querySelectorAll('[data-word-key]').forEach(el=>wordElements.set(el.dataset.wordKey,el));
    return true;
  }
  async function loadSurah(number,focusAyah=1){
    if(busy)return false;stopRecitation();busy=true;pageReading=false;
    current=Math.max(1,Math.min(114,Number(number)||1));
    const host=$('quranVerses');host.innerHTML=ayahSkeletonHTML(6);$('quranSurahHead').innerHTML='';
    $('quranPrev').textContent='Previous surah';$('quranNext').textContent='Next surah';$('quranPrev').disabled=current===1;$('quranNext').disabled=current===114;$('quranBookmarkPage').hidden=true;
    $('quranReaderTitle').textContent=`${current}. ${surahName(current)}`;$('quranReaderSub').textContent=surahs[current-1]?.englishNameTranslation||'';
    status('Loading surah…');
    let ok=false;
    try{
      const {arabic,english,meta,note}=await getSurahData(current,edition);
      surahMeta=meta;
      const englishByNo=new Map(english.map(x=>[`${current}:${Number(x.numberInSurah)}`,x.text]));
      const title=meta.englishName||surahs[current-1]?.englishName||`Surah ${current}`,trans=meta.englishNameTranslation||surahs[current-1]?.englishNameTranslation||'';
      $('quranReaderTitle').textContent=`${current}. ${title}`;$('quranReaderSub').textContent=`${trans?trans+' · ':''}${arabic.length} Ayahs · ${meta.revelationType||''}`.replace(/ · $/,'');
      const rendered=await renderAyahsProgressively(host,arabic,englishByNo,current);if(!rendered)throw new Error('Ayah rendering superseded');
      host.classList.toggle('quran-hide-text',memoryMode);
      status(/^Offline/.test(note)?note:'');saveProgress(current,focusAyah);ok=true;
      const target=$(`quran-ayah-${focusAyah}`);host.classList.toggle('qr-line-mode',readingMode==='line');
      if(target){target.classList.add('quran-last-read');if(focusAyah>1)setTimeout(()=>scrollToAyah(target),80);else window.scrollTo(0,0);}
    }catch(_){status('This surah is not cached yet. Connect to the internet and try again.');host.innerHTML='<div class="v404-card">Quran text is temporarily unavailable.</div>';}
    finally{busy=false;}
    return ok;
  }
  async function openReader(number,ayah=1,opts={}){
    showReader();const ok=await loadSurah(number,ayah);
    if(ok&&opts.play)await startPlayback(ayah);
    return ok;
  }
  async function loadMushafPage(page){
    const info=mushafInfo();
    if(busy)return false;
    page=Math.max(1,Math.min(info.pages,Number(page)||1));busy=true;stopRecitation();pageReading=true;currentPage=page;
    const host=$('quranVerses');host.innerHTML=ayahSkeletonHTML(info.kind==='indopak-lines'?15:7);$('quranSurahHead').innerHTML='';
    status(`Loading ${info.label} page ${page}…`);
    try{
      if(info.kind==='madani'){
        const [arPayload,enPayload]=await Promise.all([request(`/page/${page}/quran-uthmani`),request(`/page/${page}/en.pickthall`).catch(()=>null)]);
        const ar=arPayload?.ayahs||[],en=enPayload?.ayahs||[];
        if(!ar.length)throw new Error('Madani page unavailable');
        const first=ar[0],firstSurah=Number(first.surah?.number)||1;current=firstSurah;surahMeta=first.surah||{};
        const englishByNo=new Map(en.map(x=>[`${Number(x.surah?.number)||firstSurah}:${Number(x.numberInSurah)}`,x.text]));
        $('quranReaderTitle').textContent=`Madani Mushaf · Page ${page}`;
        $('quranReaderSub').textContent=`${ar.length} verses · 604-page Madani pagination`;
        const rendered=await renderAyahsProgressively(host,ar,englishByNo,firstSurah);if(!rendered)throw new Error('Page render superseded');
        if(readingMode==='page'){
          const pageShell=document.createElement('section');pageShell.className='qr-mushaf-page qr-mushaf-flow';pageShell.dataset.mushafPage=String(page);pageShell.setAttribute('aria-label',`Madani Mushaf page ${page}`);
          while(host.firstChild)pageShell.appendChild(host.firstChild);host.appendChild(pageShell);
        }
        saveProgress(firstSurah,Number(first.numberInSurah)||1,Number(first.juz)||progress.juz||1);
      }else{
        const payload=await qfRequest(`page/${page}?mushaf=${info.id}`);
        const verses=payload?.verses||[];
        if(!verses.length)throw new Error('No verses returned for this Mushaf page');
        if(info.kind!=='madani'&&!verses.some(v=>verseText(v,info)||(v.words||[]).some(w=>wordText(w,info))))throw new Error('The Quran service sent this page without Arabic text. Try again later.');
        const firstKey=String(verses[0].verse_key||'1:1').split(':').map(Number);
        current=firstKey[0]||1;surahMeta={number:current};
        const translationByKey=new Map();
        verses.forEach(v=>{const tr=v.translations?.[0]?.text;if(tr)translationByKey.set(v.verse_key,tr);});
        $('quranReaderTitle').textContent=`${info.label} Mushaf · Page ${page}`;
        $('quranReaderSub').textContent=`${verses.length} verses · ${info.pages} pages`;
        if(info.kind==='indopak-lines'&&readingMode==='line'){
          await renderIndoPakLines(host,verses,page);
        }else{
          await renderQfPageVerses(host,verses,translationByKey,info);
        }
        const [s,a]=firstKey;saveProgress(s||current,a||1,Number(verses[0].juz_number)||progress.juz||1);
      }
      host.classList.toggle('quran-hide-text',memoryMode);
      host.classList.toggle('qr-line-mode',info.kind==='indopak-lines'&&readingMode==='line');
      $('quranPrev').textContent='Previous page';$('quranNext').textContent='Next page';
      $('quranPrev').disabled=page<=1;$('quranNext').disabled=page>=info.pages;
      $('quranPage').value=String(page);$('quranPage').max=String(info.pages);
      status(`${info.label} · Page ${page} of ${info.pages}`);syncPageBookmarkButton();
      window.scrollTo(0,0);prefetchMushafPage(page+1);return true;
    }catch(error){
      console.error('[Naseem Mushaf]',error);
      status(error?.message||'This Mushaf page is unavailable.');
      host.innerHTML=`<div class="v404-card qr-mushaf-error"><strong>Unable to load this page</strong><p>${esc(error?.message||'Check your connection and try again.')}</p>${!qfProxy&&info.kind!=='madani'?'<p>Connect the Quran Foundation worker to enable Indo-Pak editions. Setup instructions are included in this source archive.</p>':''}</div>`;
      return false;
    }finally{busy=false;}
  }
  function wordText(word,info){
    return info.kind==='madani'?String(word.text_uthmani||word.text||''):String(word.text_indopak_nastaleeq||word.text_indopak||'');
  }
  function verseText(verse,info){
    if(info.kind==='madani')return String(verse.text_uthmani||verse.text||'');
    return String(verse.text_indopak_nastaleeq||verse.text_indopak||verse.text||'');
  }
  async function ensureIndoPakFont(){
    if(document.fonts?.check("28px 'NaseemIndoPak'"))return true;
    if(!window.__naseemIndoPakFontPromise){
      window.__naseemIndoPakFontPromise=(async()=>{
        const face=new FontFace('NaseemIndoPak',"url('https://verses.quran.foundation/fonts/quran/hafs/nastaleeq/indopak/indopak-nastaleeq-waqf-lazim-v4.2.1.woff2')");
        await face.load();document.fonts.add(face);return true;
      })().catch(error=>{window.__naseemIndoPakFontPromise=null;throw error;});
    }
    return window.__naseemIndoPakFontPromise;
  }
  function qfWordHTML(word,info){
    const [s,a]=String(word.verse_key||'1:1').split(':').map(Number);
    const pos=Number(word.position||word.location)||1;
    const text=wordText(word,info);
    if(!text)return '';
    if(word.char_type_name==='end')return `<span class="qr-verse-end qr-mushaf-end" data-verse-key="${s}:${a}" lang="ar" translate="no">${esc(text)}</span>`;
    return `<span class="qr-mushaf-word" data-word-key="${s}:${a}:${pos}" data-verse-key="${s}:${a}" lang="ar" translate="no">${esc(text)}</span>`;
  }
  async function renderIndoPakLines(host,verses,page){
    await ensureIndoPakFont();
    const lineMap=new Map();
    for(const verse of verses){
      for(const word of (verse.words||[])){
        if(word.char_type_name==='pause')continue;
        if(Number(word.page_number)!==page)continue;const line=Number(word.line_number);if(!line)continue;
        if(!lineMap.has(line))lineMap.set(line,[]);
        lineMap.get(line).push({...word,verse_key:verse.verse_key});
      }
    }
    if(!lineMap.size)throw new Error('This response has no verified printed line numbers.');
    const chapters=await qfRequest('chapters');
    const chapterMap=new Map((chapters.chapters||[]).map(c=>[Number(c.id),c]));
    const lineCount=page===1?8:15,rows=[];
    const chapterOf=w=>Number(String(w.verse_key).split(':')[0]);
    let pendingBismillah=false;
    for(let line=1;line<=lineCount;line++){
      const words=lineMap.get(line);
      if(words?.length){
        rows.push(`<div class="qr-mushaf-line" data-line="${line}" dir="rtl">${words.map(w=>qfWordHTML(w,MUSHAF_CATALOG.indopak15)).join(' ')}</div>`);
        continue;
      }
      if(pendingBismillah){
        rows.push('<div class="qr-mushaf-heading qr-bismillah" lang="ar" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>');
        pendingBismillah=false;continue;
      }
      let next=line+1;while(next<=lineCount&&!lineMap.has(next))next++;
      const nextChapter=next<=lineCount?chapterOf(lineMap.get(next)[0]):null;
      const previous=[...lineMap.entries()].filter(([n])=>n<line).pop();
      const previousChapter=previous?chapterOf(previous[1].at(-1)):null;
      const startsSurah=Boolean(nextChapter&&nextChapter!==previousChapter);
      const meta=chapterMap.get(nextChapter);
      if(startsSurah&&meta){
        rows.push(`<div class="qr-mushaf-heading qr-surah-heading" lang="ar" dir="rtl">${esc(meta.name_arabic||meta.name_simple||'')}</div>`);
        pendingBismillah=Boolean(meta.bismillah_pre);
      }else rows.push('<div class="qr-mushaf-line qr-mushaf-empty" aria-hidden="true"></div>');
    }
    host.innerHTML=`<section class="qr-mushaf-page qr-mushaf-indopak" data-mushaf-page="${page}" aria-label="Indo-Pak 15-line Mushaf page ${page}">${rows.join('')}</section>`;wordElements.clear();host.querySelectorAll('[data-word-key]').forEach(el=>wordElements.set(el.dataset.wordKey,el));
  }
  async function renderQfPageVerses(host,verses,translationByKey,info){
    if(info.kind!=='madani')await ensureIndoPakFont();
    const html=verses.map(v=>{
      const key=String(v.verse_key||'1:1'),[s,a]=key.split(':').map(Number);
      const text=verseText(v,info);
      const tr=translationByKey.get(key)||'';
      const words=(v.words||[]).filter(w=>Number(w.page_number)===currentPage&&w.char_type_name!=='pause');
      const wordHTML=words.length?words.map(w=>qfWordHTML({...w,verse_key:key},info)).join(' '):((Number(v.page_number)===currentPage)?esc(text):'');
      if(!wordHTML)return '';
      const hasEnd=words.some(w=>w.char_type_name==='end');
      const endMarker=hasEnd?'':` <span class="qr-verse-end">${a.toLocaleString('en-US')}</span>`;
      const actions=`<div class="quran-ayah-actions"><button type="button" class="qa-btn" data-play-ayah="${a}" data-play-surah="${s}" aria-label="Play ${key}">${ICON.play}</button><button type="button" class="qa-btn" data-bookmark-ayah="${a}" data-bookmark-surah="${s}" aria-label="Bookmark ${key}">${ICON.bookmark}</button><button type="button" class="qa-btn" data-mem-ayah="${a}" data-mem-surah="${s}" aria-label="Add ${key} to memorisation">${ICON.plus}</button></div>`;
      return `<article class="quran-ayah qr-page-verse" id="quran-ayah-${a}" data-ayah="${a}" data-surah="${s}"><div class="qa-top"><span class="qa-badge">${key}</span>${actions}</div><p class="v404-arabic quran-arabic" lang="ar" dir="rtl" translate="no">${wordHTML}${endMarker}</p>${edition==='translation'&&tr?`<p class="quran-translation">${esc(tr)}</p>`:''}</article>`;
    }).join('');
    const pageMarkup=readingMode==='verse'
      ? `<section class="qr-mushaf-verse-list" data-mushaf-page="${currentPage}" aria-label="${esc(info.label)} page ${currentPage}">${html}</section>`
      : `<section class="qr-mushaf-page qr-mushaf-flow" data-mushaf-page="${currentPage}" aria-label="${esc(info.label)} page ${currentPage}">${html}</section>`;
    host.innerHTML=pageMarkup;wordElements.clear();host.querySelectorAll('[data-word-key]').forEach(el=>wordElements.set(el.dataset.wordKey,el));
  }
  async function prefetchMushafPage(page){
    const info=mushafInfo();if(page<1||page>info.pages||info.kind==='madani'||!qfProxy)return;
    const path=`page/${page}?mushaf=${info.id}`;
    if(qfCache.has(path))return;
    qfRequest(path).catch(()=>{});
  }
  function syncReadingMode(){document.querySelectorAll('[data-reading-mode]').forEach(b=>{const on=b.dataset.readingMode===readingMode;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});$('quranVerses')?.classList.toggle('qr-line-mode',readingMode==='line'&&mushafEdition==='indopak15');}


  /* ---------- recitation: highlight + keep the ayah centred ---------- */
  function scrollToAyah(el){
    if(!el||!el.isConnected)return;
    const bar=$('quranReaderBar'),top=bar?bar.getBoundingClientRect().bottom:0;
    const bottom=!player.hidden&&!player.classList.contains('qr-player-away')?player.getBoundingClientRect().top:window.innerHeight;
    const r=el.getBoundingClientRect(),area=bottom-top;
    // A tall ayah is aligned to its start under the header; otherwise it is centred between header and player.
    const delta=r.height>=area-24?r.top-top-12:(r.top+r.height/2)-(top+area/2);
    if(Math.abs(delta)<4)return;
    window.scrollBy({top:delta,behavior:'smooth'});
  }
  const shouldFollow=()=>autoFollow&&readerOpen()&&screenActive()&&Date.now()-lastUserScroll>4500;
  const markUserScroll=()=>{lastUserScroll=Date.now();};
  window.addEventListener('touchstart',markUserScroll,{passive:true});window.addEventListener('touchmove',markUserScroll,{passive:true});window.addEventListener('wheel',markUserScroll,{passive:true});
  function clearPlaying(){
    document.querySelectorAll('#quranVerses .quran-ayah.quran-playing').forEach(el=>{el.classList.remove('quran-playing');el.style.removeProperty('--qp');});
    clearActiveWord();
    document.querySelectorAll('#quranVerses [data-play-ayah]').forEach(b=>{b.innerHTML=ICON.play;b.classList.remove('on');});
    activeEl=null;lastWordKey='';
  }
  const morphSVG=playing=>`<svg class="qr-morph" data-playing="${playing?1:0}" viewBox="0 0 24 24" aria-hidden="true"><path class="qm-a"/><path class="qm-b"/></svg>`;
  function morph(btn,playing){if(!btn)return;const el=btn.querySelector('.qr-morph');if(el)el.dataset.playing=playing?'1':'0';else btn.innerHTML=morphSVG(playing);}
  function setPlayIcon(playing){
    morph($('quranPauseResume'),playing);$('quranPauseResume').setAttribute('aria-label',playing?'Pause':'Play');
    morph($('quranFullToggle'),playing);$('quranFullToggle').setAttribute('aria-label',playing?'Pause':'Play');
    fullPlayer.classList.toggle('qr-is-playing',playing);
    $('quranPlaySurah').innerHTML=playing?ICON.pause:ICON.play;
    if(activeEl){const btn=activeEl.querySelector('[data-play-ayah]');if(btn){btn.innerHTML=playing?ICON.pause:ICON.play;btn.classList.toggle('on',playing);}}
  }
  function clearActiveWord(){for(const el of [activeWordEl,activeLyricWordEl]){if(el){el.classList.remove('qr-word-active');el.removeAttribute('aria-current');}}activeWordEl=activeLyricWordEl=null;}
  function markWord(key){const a=wordElements.get(key),b=lyricWords.get(key);if(!a&&!b)return false;clearActiveWord();if(a){a.classList.add('qr-word-active');a.setAttribute('aria-current','true');activeWordEl=a;}if(b){b.classList.add('qr-word-active');b.setAttribute('aria-current','true');activeLyricWordEl=b;}return true;}
  /* ---------- lyrics: verse by verse (every reciter) and word by word (word-synchronised reciter) ---------- */
  function buildLyrics(surahNo){
    const host=$('quranLyrics');if(!host)return;lyricWords=new Map();
    const bis=document.querySelector('#quranVerses .qr-bismillah');
    let html=bis?`<div class="qr-lyric qr-lyric-intro" aria-hidden="true"><p class="qr-lyric-ar" lang="ar" dir="rtl" translate="no">${esc(bis.textContent)}</p></div>`:'';
    html+=[...document.querySelectorAll('#quranVerses .quran-ayah')].map(a=>{const n=Number(a.dataset.ayah),s=Number(a.dataset.surah)||surahNo,ar=a.querySelector('.quran-arabic')?.innerHTML||'',tr=a.querySelector('.quran-translation')?.textContent||'';return `<div class="qr-lyric" role="listitem" tabindex="0" data-lyric-surah="${s}" data-lyric-ayah="${n}"><span class="qr-lyric-n">${s}:${n}</span><p class="qr-lyric-ar" lang="ar" dir="rtl" translate="no">${ar}</p>${tr?`<p class="qr-lyric-tr">${esc(tr)}</p>`:''}</div>`;}).join('');
    host.innerHTML=html;host.querySelectorAll('[data-word-key]').forEach(el=>lyricWords.set(el.dataset.wordKey,el));lyricsSurah=surahNo;host.scrollTop=0;
  }
  function centerLyric(line,smooth=true,force=false){
    const host=$('quranLyrics');if(!host||!line)return;if(!force&&Date.now()-lyricUserScroll<3500)return;
    const top=Math.max(0,line.offsetTop-(host.clientHeight-line.offsetHeight)/2);
    if(typeof host.scrollTo==='function')host.scrollTo({top,behavior:smooth&&!reduceMotion()?'smooth':'auto'});else host.scrollTop=top;
  }
  function setLyricActive(number,force){
    const host=$('quranLyrics');if(!host)return;host.querySelectorAll('.qr-lyric.active').forEach(e=>e.classList.remove('active'));
    const line=host.querySelector(`[data-lyric-ayah="${number}"]`);if(!line)return;line.classList.add('active');
    if(!fullPlayer.hidden&&fullPlayer.classList.contains('qr-lyrics-on'))centerLyric(line,true,!!force);
  }
  function toggleLyrics(force){
    const on=typeof force==='boolean'?force:!fullPlayer.classList.contains('qr-lyrics-on');
    fullPlayer.classList.toggle('qr-lyrics-on',on);$('quranLyricsToggle').setAttribute('aria-pressed',String(on));
    if(on){const line=$('quranLyrics').querySelector('.qr-lyric.active');if(line)centerLyric(line,false,true);}
  }
  function toggleQariSheet(open){fullPlayer.classList.toggle('qr-sheet-open',open);$('quranFullReciterBtn').setAttribute('aria-expanded',String(open));}
  /* ---------- Sleep timer (rules live in quran-player-core.js) ---------- */
  const PC=window.NaseemPlayerCore;let sleepState=null,sleepClock=null;
  function sleepRender(){const b=$('quranSleepBtn');if(!b)return;$('quranSleepLabel').textContent=PC?PC.sleepLabel(sleepState,Date.now()):'Sleep';b.classList.toggle('on',!!sleepState);b.setAttribute('aria-pressed',String(!!sleepState));document.querySelectorAll('#quranSleepList [data-sleep]').forEach(x=>x.setAttribute('aria-checked',String((sleepState?sleepState.id:'off')===x.dataset.sleep)));}
  function sleepCancel(){sleepState=null;if(sleepClock){clearInterval(sleepClock);sleepClock=null;}try{sleepRender();}catch(_){}}
  function sleepNote(){const t='Sleep timer finished. Recitation stopped.';status(t);$('quranPlaybackStatus').textContent=t;$('quranFullStatus').textContent=t;}
  function sleepFire(){
    const timed=!!sleepState&&sleepState.kind==='time';sleepCancel();
    if(timed&&!recitation.paused){const v0=recitation.volume;let n=0;const fade=setInterval(()=>{n++;recitation.volume=Math.max(0,v0*(1-n/20));if(n>=20){clearInterval(fade);recitation.pause();recitation.volume=v0;setPlayIcon(false);setTimeout(sleepNote,60);}},150);}
    else if(timed)sleepNote();
    else{finishQueue();sleepNote();}
  }
  function sleepEvent(evt){if(!PC||!sleepState)return false;if(PC.sleepShouldFire(sleepState,evt,Date.now())){sleepFire();return true;}return false;}
  function sleepSet(id){
    if(!PC)return;sleepState=PC.sleepStart(id,Date.now());if(sleepClock){clearInterval(sleepClock);sleepClock=null;}
    if(sleepState&&sleepState.kind==='time')sleepClock=setInterval(()=>{if(!sleepEvent('tick'))sleepRender();},1000);
    sleepRender();status(sleepState?`Sleep timer set: ${PC.SLEEP_OPTIONS.find(o=>o.id===sleepState.id)?.label||''}.`:'Sleep timer off.');
  }
  function toggleSleepSheet(open){fullPlayer.classList.toggle('qr-sleep-open',open);$('quranSleepBtn').setAttribute('aria-expanded',String(open));}

  /* ---------- Native media session: notification, lock-screen / headset buttons, background keep-alive ----------
     Only active inside the Android app (window.NoorNative.media comes from native.js); the browser build is unaffected. */
  let mediaListening=false,mediaLastAt=0,handedOff=null;
  const nativeMedia=()=>window.NoorNative&&window.NoorNative.media||null;
  function mediaOnAction(e){
    const a=e&&e.action;
    if(a==='play'){if(recitation.paused)$('quranPauseResume').click();}
    else if(a==='pause'){if(!recitation.paused)recitation.pause();}
    else if(a==='next')stepAyah(1);
    else if(a==='prev')stepAyah(-1);
    else if(a==='stop')userStop();
    else if(a==='seek'&&Number.isFinite(Number(e.positionMs))&&Number.isFinite(recitation.duration)){recitation.currentTime=Math.max(0,Math.min(recitation.duration,Number(e.positionMs)/1000));}
  }
  function mediaPush(force){
    const m=nativeMedia();if(!m||!audioQueue.length||handedOff)return;
    clearTimeout(mediaStopTimer);
    const now=Date.now();if(!force&&now-mediaLastAt<1000)return;mediaLastAt=now;
    if(!mediaListening){mediaListening=true;m.onAction(mediaOnAction);}
    const item=audioQueue[audioIndex]||{},surahNo=Number(item.surah)||current;
    m.update({title:`${surahNo}. ${surahName(surahNo)}`,artist:`Ayah ${item.numberInSurah||1} · ${qari().name}`,artText:surahs[surahNo-1]?.name||'',playing:!recitation.paused,positionMs:Math.round((recitation.currentTime||0)*1000),durationMs:Number.isFinite(recitation.duration)?Math.round(recitation.duration*1000):0});
  }
  let mediaStopTimer=0;
  /* delayMs>0: internal reloads (e.g. auto-continue to the next surah) wait so the service is not torn down between surahs while the app is in the background. */
  function mediaStop(delayMs){handedOff=null;const m=nativeMedia();if(!m)return;clearTimeout(mediaStopTimer);if(delayMs>0)mediaStopTimer=setTimeout(()=>{if(!audioQueue.length)m.stop();},delayMs);else m.stop();}
  function userStop(){sleepCancel();stopRecitation();mediaStop();clearResume();}

  /* ---------- Background hand-off ----------
     A WebView stops (or silently mutes) its own audio once the app is in the background, while the media notification
     keeps saying "playing". So when the app is hidden the rest of the recitation is handed to the native service,
     which plays it with a real MediaPlayer; when the app is shown again the native player stops and the web player
     continues from the exact position it reached. */
  let handoffChain=Promise.resolve();
  const inChain=fn=>{handoffChain=handoffChain.then(fn,fn);return handoffChain;};
  function buildHandoff(){
    const item=audioQueue[audioIndex];if(!item||!item.audio||recitation.paused)return null;
    const posMs=Math.round((recitation.currentTime||0)*1000),single=playMode==='single';
    const tail=sleepState&&sleepState.kind==='time'?sleepState.endsAt:-1;
    const atEnd=!!sleepState&&sleepState.kind==='surah';
    const ayahSleep=!!sleepState&&sleepState.kind==='ayah';
    const base={title:`${Number(item.surah)||current}. ${surahName(Number(item.surah)||current)}`,artText:surahs[(Number(item.surah)||current)-1]?.name||'',playing:true,sleepAtMs:tail,sleepAtEnd:atEnd};
    if(item.wordSynced){
      const stopAt=single||ayahSleep?Number(item.timestamp_to)||-1:-1;
      return {meta:{kind:'file',base:0},args:{...base,urls:[item.audio],artists:[`${qari().name}`],marks:single?[]:audioQueue.map(x=>Number(x.timestamp_from)||0),index:0,positionMs:posMs,stopAtMs:stopAt,sleepAtEnd:atEnd||(ayahSleep&&stopAt>0)}};
    }
    const list=(single||ayahSleep?audioQueue.slice(audioIndex,audioIndex+1):audioQueue.slice(audioIndex));
    return {meta:{kind:'ayahs',base:audioIndex},args:{...base,urls:list.map(x=>x.audio),artists:list.map(x=>`Ayah ${x.numberInSurah} · ${qari().name}`),marks:[],index:0,positionMs:posMs,stopAtMs:-1,sleepAtEnd:atEnd||ayahSleep}};
  }
  function handoffNow(){
    return inChain(async()=>{
      const m=nativeMedia();if(!m||!m.handoff||handedOff||!audioQueue.length||recitation.paused||!document.hidden)return;
      saveResume();
      const plan=buildHandoff();if(!plan)return;
      handedOff=plan.meta;
      const ok=await m.handoff(plan.args);
      if(!ok){handedOff=null;return;}
      recitation.pause();
    });
  }
  function reclaimNow(){
    return inChain(async()=>{
      const m=nativeMedia();if(!m||!m.reclaim||!handedOff)return;
      const meta=handedOff,r=await m.reclaim();handedOff=null;
      if(!r||!r.active||!audioQueue.length)return;
      const pos=Math.max(0,Number(r.positionMs)||0);
      if(meta.kind==='file'){
        let idx=-1;for(let i=audioQueue.length-1;i>=0;i--){if(pos>=Number(audioQueue[i].timestamp_from)-60){idx=i;break;}}
        audioIndex=Math.max(0,idx);
        const t=pos/1000;try{recitation.currentTime=t;}catch(_){}
        highlightPlayingAyah(Number(audioQueue[audioIndex].numberInSurah),true);
      }else{
        audioIndex=Math.max(0,Math.min(audioQueue.length-1,meta.base+(Number(r.index)||0)));
        if(!r.ended||r.reason==='sleep'||r.reason==='error'){
          await playQueueItem(true);
          try{recitation.currentTime=pos/1000;}catch(_){}
        }
      }
      if(r.ended){
        if(r.reason==='sleep'){sleepCancel();recitation.pause();setPlayIcon(false);sleepNote();saveResume();return;}
        if(r.reason==='queue'){
          if(playMode==='surah')continueToNextSurah();else finishQueue();return;
        }
        recitation.pause();setPlayIcon(false);saveResume();return;
      }
      if(r.playing){try{await recitation.play();}catch(_){setPlayIcon(false);}}
      else{recitation.pause();setPlayIcon(false);}
      mediaPush(true);saveResume();
    });
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)handoffNow();else reclaimNow();});
  window.addEventListener('pagehide',()=>{saveResume();});

  /* ---------- Resume point: where the recitation was, so it comes back after the app is closed ---------- */
  const RESUME_KEY='naseemQuranResumeV1';let resumeAt=0;
  function saveResume(force){
    if(!audioQueue.length||handedOff&&!force)return;
    const now=Date.now();if(!force&&now-resumeAt<2500)return;resumeAt=now;
    const item=audioQueue[audioIndex];if(!item)return;
    writeJSON(RESUME_KEY,{surah:Number(item.surah)||current,ayah:Number(item.numberInSurah)||1,timeMs:Math.round((recitation.currentTime||0)*1000),qari:selectedQari,mode:playMode,savedAt:now});
  }
  function clearResume(){try{localStorage.removeItem(RESUME_KEY);}catch(_){}resumeAt=0;}
  async function restoreResume(){
    const r=readJSON(RESUME_KEY,null);
    if(!r||!Number.isFinite(Number(r.surah))||r.qari!==selectedQari||Date.now()-Number(r.savedAt||0)>30*86400000)return;
    if(audioQueue.length||busy)return;
    try{
      const ok=await loadSurah(Number(r.surah),Number(r.ayah)||1);if(!ok)return;
      await startPlayback(Number(r.ayah)||1,{paused:true,seekMs:Number(r.timeMs)||0});
    }catch(_){}
  }
  window.addEventListener('naseem:restore-recitation',()=>restoreResume());

  async function chooseQari(next){
    if(!QARIS.some(q=>q.id===next)||next===selectedQari)return;
    const wasPlaying=audioQueue.length>0,wasPaused=recitation.paused,ayah=Number(audioQueue[audioIndex]?.numberInSurah)||progress.ayah||1;
    selectedQari=next;try{localStorage.setItem(QARI_KEY,next);}catch(_){}
    document.querySelectorAll('#quranQariMenu [data-qari-id],#quranFullQariList [data-qari-id]').forEach(b=>{const on=b.dataset.qariId===next;b.classList.toggle('selected',on);b.setAttribute('aria-selected',String(on));const mark=b.querySelector('.qr-qari-selected');if(mark)mark.textContent=on?'Selected':'';});
    $('quranQariToggle').textContent=qari().name+' ⌄';$('quranQariMenu').hidden=true;$('quranQariToggle').setAttribute('aria-expanded','false');syncReciterUI();
    if(wasPlaying){await startPlayback(ayah);if(wasPaused)recitation.pause();}
  }
  function highlightPlayingAyah(number,force){
    clearPlaying();
    const item=audioQueue[audioIndex],surahNo=item?.surah||current;
    $('quranNowPlaying').textContent=`${surahNo}. ${surahName(surahNo)} · ${qari().name}`;
    $('quranPlaybackStatus').textContent=`Reciting ayah ${number}`;
    syncFullPlayer();
    if(surahNo===current&&lyricsSurah!==surahNo)buildLyrics(surahNo);
    if(lyricsSurah===surahNo)setLyricActive(number,force);
    if(surahNo===current){
      const active=$(`quran-ayah-${number}`);
      if(active){active.classList.add('quran-playing');active.style.setProperty('--qp','0%');activeEl=active;if(force||shouldFollow())scrollToAyah(active);}
      saveProgress(current,number);
    }
    setPlayIcon(!recitation.paused);
  }
  function showPlayer(){player.hidden=false;updatePlayerVisibility();syncFullPlayer();}
  function updatePlayerVisibility(){player.classList.toggle('qr-player-away',fullPlayer.hidden===false||!audioQueue.length);syncImmersive();}
  async function playQueueItem(force=true,opts={}){
    const item=audioQueue[audioIndex];if(!item?.audio){finishQueue();return;}
    const token=++playToken;
    const sameSource=recitation.dataset.wordAudioUrl===item.audio;
    if(!sameSource){recitation.pause();recitation.src=item.audio;recitation.dataset.wordAudioUrl=item.audio;recitation.load();}
    setWaveSeek('quranSeek',0);setWaveSeek('quranFullSeek',0);highlightPlayingAyah(Number(item.numberInSurah),force);
    try{
      if(recitation.readyState<1){await new Promise((resolve,reject)=>{const ok=()=>{cleanup();resolve();},bad=()=>{cleanup();reject(new Error('Audio metadata unavailable'));},cleanup=()=>{recitation.removeEventListener('loadedmetadata',ok);recitation.removeEventListener('error',bad);};recitation.addEventListener('loadedmetadata',ok,{once:true});recitation.addEventListener('error',bad,{once:true});});}
      if(token!==playToken)return;
      recitation.currentTime=Math.max(0,(opts.seekMs!=null?Number(opts.seekMs):Number(item.timestamp_from||0))/1000);
      if(handedOff)return;
      if(opts.paused){recitation.pause();showPlayer();setPlayIcon(false);status('');syncFullPlayer();return;}
      await recitation.play();
      if(token!==playToken)return;
      showPlayer();setPlayIcon(true);status(`Playing recitation · ${item.surah||current}:${item.numberInSurah}`);
    }catch(_){if(token!==playToken)return;setPlayIcon(false);status('Recitation could not start. Check your connection and audio settings.');$('quranPlaybackStatus').textContent='Playback could not start.';}
  }
  function finishQueue(){clearResume();sleepCancel();audioQueue=[];audioIndex=0;playToken++;mediaStop();recitation.pause();player.hidden=true;setPlayIcon(false);$('quranPlaybackStatus').textContent='Recitation finished.';$('quranFullStatus').textContent='Recitation finished.';closeFullPlayer();clearPlaying();}
  function stopRecitation(){if(!recitation)return;mediaStop(20000);playToken++;recitation.pause();recitation.removeAttribute('src');delete recitation.dataset.wordAudioUrl;recitation.load();audioQueue=[];audioIndex=0;lyricsSurah=0;if(player)player.hidden=true;try{setPlayIcon(false);}catch(_){}closeFullPlayer();clearPlaying();}
  async function loadWordTimingSurah(surah){
    const key=`word-timing:${surah}`;let data=cache[key];
    if(!data){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),18000);try{const response=await fetch(`${WORD_TIMING_BASE}/${String(surah).padStart(3,'0')}.json`,{headers:{Accept:'application/json'},signal:controller.signal,cache:'force-cache'});if(!response.ok)throw new Error(`Timing data HTTP ${response.status}`);data=await response.json();if(Number(data.surah)!==Number(surah)||!data.audio_url||!Array.isArray(data.verse_timings))throw new Error('Invalid word timing data');saveCache(key,data);}finally{clearTimeout(timer);}}
    return data;
  }
  async function startPlayback(from=1,opts={}){
    const surah=current;status(qari().wordSync?'Loading word-synchronised recitation…':`Loading ${qari().name} recitation…`);
    if(qari().wordSync){
      let timing;try{timing=await loadWordTimingSurah(surah);}catch(_){status('Word-synchronised recitation is unavailable right now. Choose another reciter or try again.');return false;}
      if(surah!==current)return false;
      audioQueue=timing.verse_timings.filter(v=>v&&v.verse_key&&Array.isArray(v.segments)).map(v=>{const ayah=Number(String(v.verse_key).split(':')[1]);return {surah,numberInSurah:ayah,audio:timing.audio_url,timestamp_from:Number(v.timestamp_from)||Math.min(...v.segments.map(x=>Number(x[1])||0)),timestamp_to:Number(v.timestamp_to)||Math.max(...v.segments.map(x=>Number(x[2])||0)),segments:v.segments,verse_key:v.verse_key,wordSynced:true};}).filter(x=>x.numberInSurah>0&&x.timestamp_to>x.timestamp_from);
    }else{
      let data;try{data=await request(`/surah/${surah}/${encodeURIComponent(qari().edition)}`);}catch(_){status(`${qari().name} audio is unavailable. Try another reciter or check your connection.`);return false;}
      if(surah!==current)return false;
      audioQueue=(data.ayahs||[]).filter(a=>a.audio).map(a=>({surah,numberInSurah:Number(a.numberInSurah),audio:a.audio,timestamp_from:0,timestamp_to:0,segments:[],wordSynced:false}));
    }
    playMode='surah';audioIndex=Math.max(0,audioQueue.findIndex(x=>x.numberInSurah>=from));
    if(!audioQueue.length){status('No word timing segments were found for this surah.');return false;}
    showPlayer();await playQueueItem(true,opts);return true;
  }
  async function playSingleAyah(surah,ayah){
    if(qari().wordSync){
      let timing;try{timing=await loadWordTimingSurah(surah);}catch(_){notify('Word-synchronised recitation is unavailable right now.');return false;}
      const verse=(timing.verse_timings||[]).find(v=>v.verse_key===`${surah}:${ayah}`);if(!verse)return false;
      if(current!==surah||$('quranReader').hidden)await loadSurah(surah,ayah);
      const start=Number(verse.timestamp_from)||Math.min(...verse.segments.map(x=>Number(x[1])||0)),end=Number(verse.timestamp_to)||Math.max(...verse.segments.map(x=>Number(x[2])||0));
      audioQueue=[{surah,numberInSurah:ayah,audio:timing.audio_url,timestamp_from:start,timestamp_to:end,segments:verse.segments,verse_key:verse.verse_key,wordSynced:true}];
    }else{
      let data;try{data=await request(`/surah/${surah}/${encodeURIComponent(qari().edition)}`);}catch(_){notify(`${qari().name} audio is unavailable.`);return false;}
      const verse=(data.ayahs||[]).find(a=>Number(a.numberInSurah)===Number(ayah)&&a.audio);if(!verse)return false;
      if(current!==surah||$('quranReader').hidden)await loadSurah(surah,ayah);
      audioQueue=[{surah,numberInSurah:ayah,audio:verse.audio,timestamp_from:0,timestamp_to:0,segments:[],wordSynced:false}];
    }
    audioIndex=0;playMode='single';showPlayer();await playQueueItem(true);return true;
  }
  async function continueToNextSurah(){const next=current+1;if(next>114||playMode!=='surah'){finishQueue();return;}const ok=await loadSurah(next,1);if(ok)await startPlayback(1);else finishQueue();}
  function stepAyah(d){if(!audioQueue.length){startPlayback(Math.max(1,progress.surah===current?progress.ayah:1));return;}const i=audioIndex+d;if(i<0){audioIndex=0;}else if(i>=audioQueue.length){if(playMode==='single'){finishQueue();return;}continueToNextSurah();return;}else audioIndex=i;lastUserScroll=0;playQueueItem(true);}
  recitation.addEventListener('ended',()=>{if(handedOff)return;if(playMode==='single'){finishQueue();return;}if(audioQueue.length&&audioIndex<audioQueue.length-1){if(sleepEvent('ayah-end'))return;audioIndex++;playQueueItem(false);}else if(audioQueue.length){if(sleepEvent('ayah-end')||sleepEvent('surah-end'))return;continueToNextSurah();}});
  recitation.addEventListener('pause',()=>{if(audioQueue.length){setPlayIcon(false);mediaPush(true);if(!handedOff)saveResume(true);}});
  recitation.addEventListener('play',()=>{if(window.NaseemWave)window.NaseemWave.playing(true);setPlayIcon(true);if(!fullPlayer.hidden)syncFullPlayer();mediaPush(true);});
  recitation.addEventListener('seeked',()=>mediaPush(true));
  recitation.addEventListener('loadedmetadata',()=>{$('quranFullDuration').textContent=fmtTime(recitation.duration);mediaPush(true);});
  recitation.addEventListener('pause',()=>{if(window.NaseemWave)window.NaseemWave.playing(false);if(!fullPlayer.hidden)syncFullPlayer();});
  let lastWordKey='';
  recitation.addEventListener('timeupdate',()=>{
    if(!audioQueue.length||handedOff)return;
    saveResume();
    const ms=recitation.currentTime*1000;
    if(Number.isFinite(recitation.duration)&&recitation.duration>0){const frac=recitation.currentTime/recitation.duration;setWaveSeek('quranSeek',frac);setWaveSeek('quranFullSeek',frac);$('quranFullElapsed').textContent=fmtTime(recitation.currentTime);$('quranFullDuration').textContent=fmtTime(recitation.duration);if(activeEl)activeEl.style.setProperty('--qp',`${(frac*100).toFixed(1)}%`);}
    if(!audioQueue[audioIndex]?.wordSynced)return;
    let seekIndex=audioQueue.findIndex(x=>x.wordSynced&&ms>=Number(x.timestamp_from)&&ms<Number(x.timestamp_to));
    if(seekIndex<0){for(let i=audioQueue.length-1;i>=0;i--){if(ms>=Number(audioQueue[i].timestamp_from)){seekIndex=i;break;}}}
    if(seekIndex>=0&&seekIndex!==audioIndex){if(seekIndex===audioIndex+1&&sleepEvent('ayah-end'))return;audioIndex=seekIndex;highlightPlayingAyah(audioQueue[audioIndex].numberInSurah,false);mediaPush(true);}
    const item=audioQueue[audioIndex];
    const segment=item.segments?.findLast?item.segments.findLast(x=>Number(x[1])<=ms&&Number(x[2])>=ms):[...(item.segments||[])].reverse().find(x=>Number(x[1])<=ms&&Number(x[2])>=ms);
    if(segment){const key=`${item.surah}:${item.numberInSurah}:${Number(segment[0])}`;if(key!==lastWordKey&&markWord(key))lastWordKey=key;}
    if(item.timestamp_to&&ms>=Number(item.timestamp_to)-35){if(playMode==='single')finishQueue();else if(audioIndex<audioQueue.length-1){if(sleepEvent('ayah-end'))return;audioIndex++;playQueueItem(false);}else{if(sleepEvent('ayah-end')||sleepEvent('surah-end'))return;continueToNextSurah();}}
  });
  $('quranPauseResume').addEventListener('click',async()=>{if(recitation.paused){if(recitation.src){try{await recitation.play();}catch(_){status('Tap play again to resume recitation.');}}else if(audioQueue.length)playQueueItem();}else recitation.pause();});
  bindWaveSeek('quranSeek');bindWaveSeek('quranFullSeek');
  $('quranFullClose').addEventListener('click',()=>closeFullPlayer(true));
  $('quranFullToggle').addEventListener('click',()=>$('quranPauseResume').click());$('quranFullPrev').addEventListener('click',()=>$('quranPrevAyah').click());$('quranFullNext').addEventListener('click',()=>$('quranNextAyah').click());
  $('quranFullStop').addEventListener('click',()=>{userStop();$('quranFullStatus').textContent='Recitation stopped';});
  $('quranPrevAyah').addEventListener('click',()=>stepAyah(-1));$('quranNextAyah').addEventListener('click',()=>stepAyah(1));
  $('quranStop').addEventListener('click',userStop);
  $('quranLocate').addEventListener('click',()=>{lastUserScroll=0;if(activeEl)scrollToAyah(activeEl);});
  $('quranPlaySurah').addEventListener('click',()=>{if(audioQueue.length&&playMode==='surah'){$('quranPauseResume').click();}else startPlayback(Math.max(1,progress.surah===current?progress.ayah:1));});

  /* ---------- reader interactions ---------- */
  $('quranVerses').addEventListener('click',async e=>{
    const bookmark=e.target.closest('[data-bookmark-ayah]');
    if(bookmark){const ayah=Number(bookmark.dataset.bookmarkAyah),surah=Number(bookmark.dataset.bookmarkSurah)||current,index=bookmarks.findIndex(b=>b.surah===surah&&b.ayah===ayah);let on;if(index>=0){bookmarks.splice(index,1);on=false;}else{bookmarks.push({surah,ayah,name:surahName(surah)});on=true;}bookmark.classList.toggle('on',on);bookmark.setAttribute('aria-pressed',String(on));bookmark.innerHTML=on?ICON.bookmarkOn:ICON.bookmark;saveBookmarks();renderBookmarks();return;}
    const mem=e.target.closest('[data-mem-ayah]');
    if(mem){const ayah=Number(mem.dataset.memAyah),surah=Number(mem.dataset.memSurah)||current;let on;if(Mem.has(memory,surah,ayah)){Mem.remove(memory,surah,ayah);on=false;}else{Mem.add(memory,surah,ayah,todayISO());on=true;}saveMemory();mem.classList.toggle('on',on);mem.setAttribute('aria-pressed',String(on));mem.innerHTML=on?ICON.check:ICON.plus;notify(on?`Added ${surah}:${ayah} to your memorisation.`:`Removed ${surah}:${ayah} from your memorisation.`);return;}
    const play=e.target.closest('[data-play-ayah]'),verse=e.target.closest('[data-ayah]');
    if(verse&&memoryMode&&e.target.closest('.quran-arabic'))verse.classList.toggle('revealed');
    if(verse)saveProgress(Number(verse.dataset.surah)||current,Number(verse.dataset.ayah));
    if(!play)return;
    const n=Number(play.dataset.playAyah),playSurah=Number(play.dataset.playSurah)||current;
    if(audioQueue.length&&Number(audioQueue[audioIndex]?.numberInSurah)===n&&audioQueue[audioIndex]?.surah===playSurah){if(recitation.paused)recitation.play().catch(()=>{});else recitation.pause();return;}
    lastUserScroll=0;if(playSurah!==current||pageReading)await openReader(playSurah,n,{play:true});else await startPlayback(n);
  });
  $('quranBack').addEventListener('click',showHome);
  $('quranSettingsBtn').addEventListener('click',()=>{const box=$('quranSettings'),open=box.hidden;box.hidden=!open;$('quranSettingsBtn').setAttribute('aria-expanded',String(open));});
  $('quranQariToggle').textContent=qari().name+' ⌄';
  $('quranQariToggle').addEventListener('click',()=>{const menu=$('quranQariMenu'),open=menu.hidden;menu.hidden=!open;$('quranQariToggle').setAttribute('aria-expanded',String(open));});
  $('quranQariMenu').addEventListener('click',e=>{const o=e.target.closest('[data-qari-id]');if(o)chooseQari(o.dataset.qariId);});
  $('quranFullQariList').addEventListener('click',e=>{const o=e.target.closest('[data-qari-id]');if(!o)return;toggleQariSheet(false);chooseQari(o.dataset.qariId);});
  $('quranFullReciterBtn').addEventListener('click',()=>toggleQariSheet(!fullPlayer.classList.contains('qr-sheet-open')));
  $('quranQSheetBackdrop').addEventListener('click',()=>{toggleQariSheet(false);toggleSleepSheet(false);});
  $('quranSleepBtn').addEventListener('click',()=>toggleSleepSheet(!fullPlayer.classList.contains('qr-sleep-open')));
  $('quranSleepList').addEventListener('click',e=>{const o=e.target.closest('[data-sleep]');if(!o)return;sleepSet(o.dataset.sleep);toggleSleepSheet(false);});
  $('quranLyricsToggle').addEventListener('click',()=>toggleLyrics());
  player.addEventListener('click',e=>{if(e.target.closest('button:not(#quranExpandPlayer),input,.qr-wave-seek'))return;openFullPlayer();});
  const lyricsHost=$('quranLyrics');
  ['touchstart','wheel','pointerdown'].forEach(t=>lyricsHost.addEventListener(t,()=>{lyricUserScroll=Date.now();},{passive:true}));
  const playLyric=async line=>{const n=Number(line?.dataset.lyricAyah),s=Number(line?.dataset.lyricSurah)||lyricsSurah;if(!n||line.classList.contains('qr-lyric-intro'))return;lyricUserScroll=0;lastUserScroll=0;if(s!==current||pageReading){const ok=await loadSurah(s,n);if(!ok)return;}await startPlayback(n);};
  lyricsHost.addEventListener('click',e=>playLyric(e.target.closest('[data-lyric-ayah]')));
  lyricsHost.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const l=e.target.closest('[data-lyric-ayah]');if(l){e.preventDefault();playLyric(l);}}});
  /* Pull the player down (from its top bar or artwork) to close it, like other music players. */
  fullPlayer.addEventListener('pointerdown',e=>{if(e.button>0||e.target.closest('button,input,.qr-lyrics,.qr-qsheet,.qr-sleep-sheet'))return;if(!e.target.closest('.qr-full-top,.qr-full-handle,.qr-full-hero'))return;dragFull={y:e.clientY,id:e.pointerId,dy:0,on:false};});
  fullPlayer.addEventListener('pointermove',e=>{if(!dragFull||e.pointerId!==dragFull.id)return;const dy=e.clientY-dragFull.y;if(dy<=0&&!dragFull.on)return;if(!dragFull.on&&dy<8)return;if(!dragFull.on){dragFull.on=true;try{fullPlayer.setPointerCapture(e.pointerId);}catch(_){}fullPlayer.style.transition='none';}dragFull.dy=Math.max(0,dy);fullPlayer.style.transform=`translate3d(0,${dragFull.dy}px,0) scale(${1-Math.min(.07,dragFull.dy/2800)})`;fullPlayer.style.borderRadius=`${Math.min(30,dragFull.dy/4)}px`;});
  const endDrag=e=>{if(!dragFull||e.pointerId!==dragFull.id)return;const d=dragFull;dragFull=null;if(!d.on)return;fullPlayer.style.transition='';if(d.dy>110){fullPlayer.style.borderRadius='';fullPlayer.style.transform='';closeFullPlayer(true);}else{fullPlayer.style.transition='transform .45s cubic-bezier(.34,1.45,.64,1),border-radius .3s ease';fullPlayer.style.transform='';fullPlayer.style.borderRadius='';setTimeout(()=>{fullPlayer.style.transition='';},480);}};
  fullPlayer.addEventListener('pointerup',endDrag);fullPlayer.addEventListener('pointercancel',endDrag);
  syncReciterUI();
  $('quranPrev').addEventListener('click',()=>pageReading?loadMushafPage(currentPage-1):loadSurah(current-1));$('quranNext').addEventListener('click',()=>pageReading?loadMushafPage(currentPage+1):loadSurah(current+1));
  const recentreSoon=(()=>{let t=null;return()=>{clearTimeout(t);t=setTimeout(()=>{if(activeEl&&autoFollow){lastUserScroll=0;scrollToAyah(activeEl);}},260);};})();
  const applyFont=size=>{document.documentElement.style.setProperty('--quran-font-size',`${size}px`);};
  const fontStart=Math.max(22,Math.min(42,Number((()=>{try{return localStorage.getItem(FONT_KEY);}catch(_){return null;}})())||30));
  $('quranFontSize').value=String(fontStart);applyFont(fontStart);
  $('quranFontSize').addEventListener('input',e=>{const size=Math.max(22,Math.min(42,Number(e.target.value)||30));applyFont(size);try{localStorage.setItem(FONT_KEY,String(size));}catch(_){}recentreSoon();});
  function syncEditionButtons(){document.querySelectorAll('[data-quran-edition]').forEach(b=>{const on=b.dataset.quranEdition===edition;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});}
  syncEditionButtons();
  $('quranEditionSeg').addEventListener('click',e=>{const b=e.target.closest('[data-quran-edition]');if(!b||b.dataset.quranEdition===edition)return;edition=b.dataset.quranEdition;try{localStorage.setItem(EDITION_KEY,edition);}catch(_){}syncEditionButtons();loadSurah(current,progress.surah===current?progress.ayah:1);});
  function syncFollow(){const sw=$('quranFollow');sw.setAttribute('aria-checked',String(autoFollow));sw.classList.toggle('on',autoFollow);}
  syncFollow();
  $('quranFollow').addEventListener('click',()=>{autoFollow=!autoFollow;try{localStorage.setItem(FOLLOW_KEY,autoFollow?'1':'0');}catch(_){}syncFollow();if(autoFollow&&activeEl){lastUserScroll=0;scrollToAyah(activeEl);}});
  $('quranMemMode').addEventListener('click',()=>{memoryMode=!memoryMode;$('quranMemMode').setAttribute('aria-pressed',String(memoryMode));$('quranMemMode').classList.toggle('selected',memoryMode);$('quranVerses').classList.toggle('quran-hide-text',memoryMode);$('quranVerses').querySelectorAll('.quran-ayah.revealed').forEach(x=>x.classList.remove('revealed'));$('quranMemMode').querySelector('em').textContent=memoryMode?'Show text':'Hide text';status(memoryMode?'Memory mode: Arabic text is hidden. Tap an ayah’s text to reveal it.':'Arabic text is visible.');});
  $('quranMemSurah').addEventListener('click',()=>{const total=Number(surahMeta?.numberOfAyahs)||Number(surahs[current-1]?.numberOfAyahs)||document.querySelectorAll('#quranVerses .quran-ayah').length;if(!total)return;const before=Object.keys(memory).length;Mem.addMany(memory,current,total,todayISO());saveMemory();const added=Object.keys(memory).length-before;$('quranVerses').querySelectorAll('[data-mem-ayah]').forEach(b=>{b.classList.add('on');b.setAttribute('aria-pressed','true');b.innerHTML=ICON.check;});notify(added?`Added ${added} ayahs of ${surahName(current)} to your memorisation.`:`${surahName(current)} is already in your memorisation.`);});

  /* ---------- memorisation ---------- */
  function saveMemory(){writeJSON(MEMORY_KEY,memory);renderMemory();}
  function renderMemory(){
    const host=$('quranMemory'),chip=$('quranDueChip');if(!host)return;
    const st=Mem.stats(memory,todayISO());
    if(chip){chip.hidden=!st.due;chip.innerHTML=st.due?`<b>${st.due}</b> ayah${st.due===1?'':'s'} due for review<span>Review ↗</span>`:'';}
    const rows=st.surahs.map(s=>`<div class="qr-row qm-row"><button type="button" class="qr-row-main" data-open-surah="${s.surah}"><strong>${s.surah}. ${esc(surahName(s.surah))}</strong><small>${s.total} ayah${s.total===1?'':'s'} · ${s.due?`${s.due} due`:'none due'}</small></button><button type="button" class="qa-btn" data-mem-remove-surah="${s.surah}" aria-label="Remove ${esc(surahName(s.surah))} from memorisation">${ICON.close}</button></div>`).join('');
    host.innerHTML=`<div class="qm-stats"><div><strong>${st.total}</strong><small>In memory</small></div><div><strong>${st.due}</strong><small>Due today</small></div><div><strong>${st.strong}</strong><small>Well known</small></div></div>
      <button type="button" class="v404-primary qm-start" id="quranReviewStart"${st.due?'':' disabled'}>${st.due?`Review ${Math.min(st.due,30)} ayah${Math.min(st.due,30)===1?'':'s'} now`:(st.total?'Nothing due today':'Review')}</button>
      ${st.total?`<div class="qr-list qm-list">${rows}</div>`:'<p class="v404-note qm-empty">Build your memorisation list from the reader: tap + beside any ayah, or open Reading settings → Add surah. Each ayah comes back for review at growing intervals (1, 3, 7, 14, 30, then 60 days) as you recall it. Hide text in the reader to test yourself.</p>'}`;
  }
  const reviewHost=()=>$('quranReview');
  async function getAyahText(s,a){
    let data;try{data=await getSurahData(s,'arabic');}catch(_){return null;}
    const ar=data.arabic.find(x=>Number(x.numberInSurah)===a);if(!ar)return null;
    const payload=await peekPayload(`${s}:translation`);let english='';
    if(payload){const items=Array.isArray(payload)?payload:[payload];const en=items.find(x=>String(x.edition?.identifier||'').includes('pickthall'))?.ayahs?.find(x=>Number(x.numberInSurah)===a);english=en?.text||'';}
    const parts=a===1?Mem.splitBismillah(s,ar.text):{rest:ar.text};
    return {arabic:parts.rest,english};
  }
  function startReview(){
    const due=Mem.dueItems(memory,todayISO()).slice(0,30);if(!due.length)return;
    session={queue:due.map(i=>({s:i.s,a:i.a,retry:false})),pos:0,remembered:0,again:0,total:due.length,revealed:false};
    $('quranHome').hidden=true;$('quranReader').hidden=true;reviewHost().hidden=false;syncImmersive();window.scrollTo(0,0);renderReviewCard();
  }
  function endReview(){session=null;stopRecitationIfSingle();showHome();switchQuranView('memory');}
  function stopRecitationIfSingle(){if(playMode==='single')stopRecitation();}
  async function renderReviewCard(){
    const host=reviewHost();if(!session)return;
    const item=session.queue[session.pos];
    if(!item){
      reviewBar.innerHTML=`<button type="button" class="qr-icon" data-review-close aria-label="Close review">${ICON.close}</button><div class="qr-bar-title"><strong>Review complete</strong><small>${session.total} ayah${session.total===1?'':'s'} reviewed</small></div>`;
      host.innerHTML=`<div class="qr-bar-spacer"></div><div class="qrv-card qrv-done"><strong>${session.remembered}</strong><span>recalled</span><p class="v404-note">${session.again?`${session.again} ayah${session.again===1?'':'s'} will come back tomorrow so you can strengthen them.`:'Every ayah in this session was recalled.'}</p><button type="button" class="v404-primary" data-review-close>Done</button></div>`;
      return;
    }
    session.revealed=false;const done=session.pos,pct=Math.round(done/session.queue.length*100);
    reviewBar.innerHTML=`<button type="button" class="qr-icon" data-review-close aria-label="Close review">${ICON.close}</button><div class="qr-bar-title"><strong>${esc(surahName(item.s))} · ${item.s}:${item.a}</strong><small>${done+1} of ${session.queue.length}</small></div>`;
    host.innerHTML=`<div class="qr-bar-spacer"></div><div class="qrv-progress"><i style="width:${pct}%"></i></div>
      <div class="qrv-card"><span class="eyebrow">RECITE FROM MEMORY</span><p class="qrv-prompt">Say this ayah aloud, then reveal it to check yourself.</p><div class="qrv-hint" id="qrvHint" hidden></div><div class="qrv-text" id="qrvText" hidden></div>
      <div class="qrv-tools"><button type="button" class="v404-secondary" id="qrvHear">${ICON.play}<span>Hear it</span></button><button type="button" class="v404-secondary" id="qrvHintBtn">First word</button></div>
      <button type="button" class="v404-primary qrv-reveal" id="qrvReveal">Reveal</button>
      <div class="qrv-rate" id="qrvRate" hidden><button type="button" class="v404-secondary" data-review-rate="0">Not yet</button><button type="button" class="v404-primary" data-review-rate="1">Remembered</button></div></div>`;
    const token=session;const info=await getAyahText(item.s,item.a);
    if(session!==token||!reviewHost().querySelector('#qrvText'))return;
    session.text=info;
    if(!info){$('qrvText').hidden=false;$('qrvText').innerHTML='<p class="v404-note">This ayah’s text is not available offline yet. Connect once to load it.</p>';}
  }
  reviewBar.addEventListener('click',e=>{if(e.target.closest('[data-review-close]'))endReview();});
  reviewHost().addEventListener('click',async e=>{
    if(!session)return;
    if(e.target.closest('[data-review-close]')){endReview();return;}
    const item=session.queue[session.pos];if(!item)return;
    if(e.target.closest('#qrvHintBtn')){const t=session.text;const h=$('qrvHint');h.hidden=false;h.textContent=t?String(t.arabic).trim().split(/\s+/)[0]:'—';h.setAttribute('lang','ar');h.setAttribute('dir','rtl');return;}
    if(e.target.closest('#qrvReveal')){const t=session.text;const box=$('qrvText');box.hidden=false;box.innerHTML=t?`<p class="v404-arabic" lang="ar" dir="rtl" translate="no">${esc(t.arabic)} ${markerHTML(item.a)}</p>${t.english?`<p class="quran-translation">${esc(t.english)}</p>`:''}`:'<p class="v404-note">Text unavailable offline.</p>';$('qrvHint').hidden=true;$('qrvReveal').hidden=true;$('qrvRate').hidden=false;session.revealed=true;return;}
    if(e.target.closest('#qrvHear')){
      try{await playSingleAyah(item.s,item.a);}
      catch(_){notify('Word-synchronised recitation could not start. Check your connection.');}
      return;
    }
    const rate=e.target.closest('[data-review-rate]');
    if(rate&&session.revealed){
      const ok=rate.dataset.reviewRate==='1';
      if(ok){if(!item.retry)Mem.review(memory,item.s,item.a,true,todayISO());session.remembered++;}
      else{Mem.review(memory,item.s,item.a,false,todayISO());if(!item.retry){session.again++;session.queue.push({s:item.s,a:item.a,retry:true});}}
      writeJSON(MEMORY_KEY,memory);session.pos++;renderReviewCard();
    }
  });
  $('quranMemory').addEventListener('click',e=>{
    if(e.target.closest('#quranReviewStart')){startReview();return;}
    const rm=e.target.closest('[data-mem-remove-surah]');
    if(rm){const s=Number(rm.dataset.memRemoveSurah);Mem.removeSurah(memory,s);saveMemory();notify(`Removed ${surahName(s)} from your memorisation.`);return;}
    const open=e.target.closest('[data-open-surah]');if(open)openReader(Number(open.dataset.openSurah),1);
  });
  $('quranDueChip').addEventListener('click',()=>{switchQuranView('memory');startReview();});

  /* ---------- index interactions ---------- */
  $('quranSurahList').addEventListener('click',e=>{
    if(e.target.closest('[data-retry-surahs]')){loadSurahList();return;}
    const play=e.target.closest('[data-play-surah]');if(play){openReader(Number(play.dataset.playSurah),1,{play:true});return;}
    const open=e.target.closest('[data-open-surah]');if(open)openReader(Number(open.dataset.openSurah),1);
  });
  $('quranSearch').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(renderSurahList,90);});
  $('quranResume').addEventListener('click',()=>openReader(progress.surah||1,progress.ayah||1));
  async function openJuz(juz){
    juz=Number(juz)||1;status(`Finding the beginning of Juz ${juz}…`);
    try{const result=await request(`/juz/${juz}/quran-uthmani`),ayahs=result?.ayahs||[];if(!ayahs.length)throw new Error('No Juz data');const first=ayahs[0];
      saveProgress(first.surah?.number||current,first.numberInSurah||1,juz);await openReader(first.surah?.number||current,first.numberInSurah||1);status(`Juz ${juz} begins at Surah ${first.surah?.englishName||first.surah?.number}, Ayah ${first.numberInSurah}.`);}
    catch(_){notify('Juz navigation is unavailable. Check your connection and try again.');}
  }
  $('quranJuzList').addEventListener('click',e=>{const b=e.target.closest('[data-open-juz]');if(b)openJuz(b.dataset.openJuz);});
  // Ayah-jump controls are not part of this reader UI; do not bind listeners to absent elements.
  $('quranOpenPage').addEventListener('click',async()=>{const page=Number($('quranPage').value),max=mushafPageCount();if(!Number.isInteger(page)||page<1||page>max){notify(`Choose a page between 1 and ${max}.`);return;}currentPage=page;showReader();try{localStorage.setItem('naseem-quran-reading-mode',readingMode);}catch(_){}syncReadingMode();await loadMushafPage(page);});
  document.querySelectorAll('[data-reading-mode]').forEach(b=>b.addEventListener('click',async()=>{
    const next=b.dataset.readingMode;
    if(next==='line'&&mushafEdition!=='indopak15'){notify('The exact printed line layout is available in the Indo-Pak 15-line edition.');$('quranMushaf').value='indopak15';mushafEdition='indopak15';mushafLabel=MUSHAF_CATALOG.indopak15.label;try{localStorage.setItem('naseem-quran-mushaf',mushafEdition);}catch(_){}syncMushafControls();}
    readingMode=next;try{localStorage.setItem('naseem-quran-reading-mode',readingMode);}catch(_){}syncReadingMode();
    if(pageReading)await loadMushafPage(currentPage);else if(next==='page'||next==='line'){switchQuranView('page');notify('Choose a page in the selected Mushaf.');}
  }));
  $('quranMushaf').addEventListener('change',async e=>{
    const next=e.target.value;if(!MUSHAF_CATALOG[next])return;
    const old=mushafEdition;mushafEdition=next;mushafLabel=MUSHAF_CATALOG[next].label;
    try{localStorage.setItem('naseem-quran-mushaf',mushafEdition);}catch(_){}
    syncMushafControls();
    if(pageReading){
      try{
        const key=`${current}:${progress.ayah||1}`;let page=1;
        if(mushafEdition==='quran-uthmani'){const a=await request(`/ayah/${key}/quran-uthmani`);page=Number(a.ayah?.page)||1;}
        else{const lookup=await qfRequest(`lookup?mushaf=${mushafInfo().id}&from=${encodeURIComponent(key)}&to=${encodeURIComponent(key)}`);page=Number(Object.keys(lookup.pages||{})[0])||1;}
        await loadMushafPage(page);
      }catch(error){mushafEdition=old;mushafLabel=MUSHAF_CATALOG[old].label;e.target.value=old;syncMushafControls();notify(error.message||'Could not locate this verse in the selected Mushaf.');}
    }else if(readerOpen()&&mushafEdition==='quran-uthmani')await loadSurah(current,progress.ayah||1);
    else{switchQuranView('page');}
  });
  function syncMushafControls(){
    const select=$('quranMushaf');if(!select)return;
    const info=mushafInfo();select.value=mushafEdition;
    $('quranPage').max=String(info.pages);$('quranPage').value=String(Math.min(info.pages,Math.max(1,Number($('quranPage').value)||1)));
    $('quranPage').setAttribute('aria-label',`Mushaf page, 1 to ${info.pages}`);
    const lineButton=document.querySelector('[data-reading-mode="line"]');
    if(lineButton){lineButton.disabled=mushafEdition!=='indopak15';lineButton.title=lineButton.disabled?'Select Indo-Pak 15-line to use the exact printed line layout':'Exact printed 15-line layout';}
    const notes={
      'quran-uthmani':'Madani · 604 pages. Existing AlQuran Cloud page text and verse navigation.',
      indopak:'Indo-Pak · 604 pages. Quran Foundation page mapping and Nastaleeq script.',
      indopak15:'Indo-Pak 15-line · 610 pages. Exact printed line breaks and compatible Nastaleeq font.',
      indopak16:'Indo-Pak 16-line · 548 pages. Full-page reader with the edition’s own page boundaries.'
    };
    $('quranMushafNote').textContent=notes[mushafEdition]+(mushafEdition!=='quran-uthmani'&&!qfProxy?' Pages load from Quran.com when you open them.':'');
  }
  function discoverMushafEditions(){
    const select=$('quranMushaf');if(!select)return;
    if(!MUSHAF_CATALOG[mushafEdition])mushafEdition='quran-uthmani';
    mushafLabel=mushafInfo().label;select.value=mushafEdition;syncMushafControls();
  }

  $('quranBookmarkList').addEventListener('click',e=>{
    const pageItem=e.target.closest('[data-open-page-bookmark]');
    if(pageItem){const [edition,page]=pageItem.dataset.openPageBookmark.split(':');mushafEdition=MUSHAF_CATALOG[edition]?edition:'quran-uthmani';mushafLabel=mushafInfo().label;syncMushafControls();showReader();readingMode='page';syncReadingMode();loadMushafPage(Number(page));return;}
    const item=e.target.closest('[data-open-bookmark]');if(!item)return;const [surah,ayah]=item.dataset.openBookmark.split(':').map(Number);openReader(surah,ayah);
  });
  $('quranBookmarkPage').addEventListener('click',()=>{
    if(!pageReading)return;
    const key=`${mushafEdition}:${currentPage}`;
    if(isPageBookmarked(mushafEdition,currentPage))pageBookmarks=pageBookmarks.filter(x=>`${x.edition}:${x.page}`!==key);
    else pageBookmarks.unshift({edition:mushafEdition,page:currentPage,surah:current,ayah:progress.ayah||1,savedAt:Date.now()});
    savePageBookmarks();renderBookmarks();syncPageBookmarkButton();
    notify(isPageBookmarked(mushafEdition,currentPage)?'Page saved.':'Page bookmark removed.');
  });
  let pageSwipeStart=null;
  $('quranVerses').addEventListener('pointerdown',e=>{
    if(!pageReading||e.pointerType==='mouse'||e.target.closest('button,input,select,a'))return;
    pageSwipeStart={x:e.clientX,y:e.clientY};
  },{passive:true});
  $('quranVerses').addEventListener('pointerup',e=>{
    if(!pageSwipeStart||!pageReading)return;
    const dx=e.clientX-pageSwipeStart.x,dy=e.clientY-pageSwipeStart.y;pageSwipeStart=null;
    if(Math.abs(dx)<72||Math.abs(dx)<Math.abs(dy)*1.35)return;
    const next=currentPage+(dx<0?1:-1);
    if(next>=1&&next<=mushafPageCount())loadMushafPage(next);
  },{passive:true});
  $('quranVerses').addEventListener('pointercancel',()=>{pageSwipeStart=null;},{passive:true});
  document.querySelectorAll('[data-quran-view]').forEach(b=>b.addEventListener('click',()=>switchQuranView(b.dataset.quranView)));
  $('quranDownloadOffline').addEventListener('click',async()=>{
    const button=$('quranDownloadOffline'),label=$('quranOfflineStatus');if(button.disabled)return;button.disabled=true;
    try{
      const stored=await getOfflineSurahMap();let saved=0;
      // Keep one IndexedDB writer active at a time. This avoids overlapping
      // readwrite transactions on mobile Chromium while preserving resumable saves.
      for(let n=1;n<=114;n++){
        label.textContent=`Saving Quran text offline · ${n}/114 surahs`;
        const key=`${n}:translation`,arabicKey=`${n}:arabic`;
        let payload=stored.get(key);
        if(!payload){payload=await request(`/surah/${n}/editions/quran-uthmani,en.pickthall`);}
        const arabic=stored.get(arabicKey)||(Array.isArray(payload)?payload:[payload]).filter(x=>String(x.edition?.identifier||'').includes('uthmani'));
        const writes=[];
        if(!stored.has(key))writes.push([key,payload]);
        if(!stored.has(arabicKey)&&arabic.length)writes.push([arabicKey,arabic]);
        await putOfflineSurahs(writes);
        saved++;
      }
      label.textContent=`Complete Quran text with English meanings saved on this device (${saved} surahs). Audio is not downloaded.`;
    }catch(error){console.error('[Quran offline download]',error);label.textContent='Offline download paused: '+String(error?.message||error).slice(0,180);}
    finally{button.disabled=false;}
  });

  // Android back button / gesture: step out of the reader or review before leaving the Quran tab.
  document.addEventListener('naseem:back',e=>{
    if(!fullPlayer.hidden){e.preventDefault();e.stopImmediatePropagation();
      if(!queueEl.hidden){toggleQueue(false);return;}
      if(fullPlayer.classList.contains('qr-sleep-open')){toggleSleepSheet(false);return;}
      if(fullPlayer.classList.contains('qr-sheet-open')){toggleQariSheet(false);return;}
      closeFullPlayer();return;}
    if(!screenActive())return;
    if(!reviewHost().hidden){e.preventDefault();e.stopImmediatePropagation();endReview();return;}
    if(readerOpen()){e.preventDefault();e.stopImmediatePropagation();showHome();}
  },true);
  window.addEventListener('resize',()=>{if(activeEl&&shouldFollow())scrollToAyah(activeEl);});

  renderHero();renderBookmarks();renderMemory();renderSurahList();syncReadingMode();discoverMushafEditions();

  // Quranic supplications are retrieved verbatim from the API, not retyped or translated by Naseem.
  const duaRefs={7:[23],20:[25,26,27,28],25:[74],26:[83],28:[24],40:[7,8,9],60:[4,5]};
  const duaTitles={
    '7:23':'Repentance','20:25':'Ease and clarity','20:26':'Ease and clarity','20:27':'Ease and clarity','20:28':'Ease and clarity',
    '25:74':'Family and righteousness','26:83':'Wisdom and the righteous','28:24':'Provision and goodness',
    '40:7':'Mercy and forgiveness','40:8':'Righteous company','40:9':'Protection from wrongdoing',
    '60:4':'Trust in Allah','60:5':'Steadfastness'
  };
  let duasLoaded=false;
  async function loadQuranDuas(){
    if(duasLoaded||!window.NaseemV404?.duas)return;duasLoaded=true;
    const statusEl=$('duaFeedStatus');if(statusEl)statusEl.textContent='Loading additional Quranic supplications…';
    const additions=[];
    for(const [surah,verses] of Object.entries(duaRefs)){
      try{const editions=await request(`/surah/${surah}/editions/quran-uthmani,en.pickthall`);const items=Array.isArray(editions)?editions:[editions];
        const ar=items.find(x=>String(x.edition?.identifier||'').includes('uthmani'))?.ayahs||items[0]?.ayahs||[];
        const en=items.find(x=>String(x.edition?.identifier||'').includes('pickthall'))?.ayahs||[];const enMap=new Map(en.map(x=>[Number(x.numberInSurah),x.text]));
        for(const n of verses){const verse=ar.find(x=>Number(x.numberInSurah)===n);if(!verse)continue;const key=`${surah}:${n}`;additions.push({id:`api-quran-${surah}-${n}`,category:duaTitles[key]||'Quranic supplication',ar:verse.text,latin:'',meaning:enMap.get(n)||'English meaning unavailable.',ref:`Qur’an ${key}`});}
      }catch(_){/* Keep built-in duas available if a source request fails. */}
      await new Promise(resolve=>setTimeout(resolve,350));
    }
    if(additions.length){const list=window.NaseemV404.duas;const ids=new Set(list.map(x=>x.id));for(const d of additions)if(!ids.has(d.id))list.push(d);$('duaSearch')?.dispatchEvent(new Event('input'));window.NaseemQuranDuas=additions;if(statusEl)statusEl.textContent='Additional Quranic supplications loaded from AlQuran Cloud. English meanings: Pickthall. Online only; built-in duas remain available offline.';}
    else if(statusEl)statusEl.textContent='Could not load additional Quranic supplications. Built-in duas remain available offline.';
  }
  document.addEventListener('noor:screen',e=>{
    if(e.detail==='duaScreen')loadQuranDuas();
    if(e.detail==='quranReaderScreen'&&!listLoaded)loadSurahList();
    updatePlayerVisibility();
  });
  // Also cover app builds whose screen switch event is emitted before this module attaches.
  const duaEntry=document.querySelector('[data-open-v404="duas"]');duaEntry?.addEventListener('click',()=>setTimeout(loadQuranDuas,0));
  setTimeout(()=>{try{restoreResume();}catch(_){}},1800);
  window.NaseemQuran={restoreResume,loadSurah,loadSurahList,loadQuranDuas,openReader,startPlayback,scrollToAyah,source:'Muhammad Al-Luhaidan · CC0 word timings',state:()=>({current,audioIndex,queue:audioQueue.length,playMode,memory:Object.keys(memory).length})};
})();
