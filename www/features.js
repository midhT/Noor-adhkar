(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const toast = message => { const el=$('toast'); if(!el)return; el.textContent=message; el.classList.add('show'); clearTimeout(el._timer); el._timer=setTimeout(()=>el.classList.remove('show'),2300); };

  // Feature hub: planned entries are honest UI previews, not simulated functionality.
  document.querySelectorAll('[data-open-feature]').forEach(button => button.addEventListener('click', () => switchScreen(button.dataset.openFeature)));
  document.querySelectorAll('[data-planned]').forEach(button => button.addEventListener('click', () => toast(`${button.dataset.planned} is under development.`)));

  // Add practical shortcuts below the existing home feature tiles.
  const home = $('homeScreen');
  if (home && ! $('homeFeatureShortcuts')) {
    const shortcuts = document.createElement('section');
    shortcuts.id = 'homeFeatureShortcuts';
    shortcuts.className = 'home-feature-shortcuts';
    shortcuts.innerHTML = `<div class="section-heading"><div><span class="eyebrow">USEFUL TOOLS</span><h2>Made for your day</h2></div><button type="button" class="subtle-link" id="openExplore">All features ↗</button></div><div class="home-tool-grid"><button type="button" class="home-tool" data-go-feature="qiblaScreen"><span class="home-tool-icon">⌖</span><span><strong>Qibla finder</strong><small>Find your direction</small></span><b>↗</b></button><button type="button" class="home-tool" data-go-feature="zakatScreen"><span class="home-tool-icon">◈</span><span><strong>Zakat calculator</strong><small>Estimate your Zakat</small></span><b>↗</b></button></div>`;
    home.appendChild(shortcuts);
    $('openExplore')?.addEventListener('click', () => switchScreen('featuresScreen'));
    shortcuts.querySelectorAll('[data-go-feature]').forEach(button => button.addEventListener('click', () => switchScreen(button.dataset.goFeature)));
  }

  // Replace the English prayer countdown ring with a compact Qibla compass.
  // The neighbouring Arabic countdown ring remains untouched.
  const homeQiblaRing = $('pdRingOne');
  if (homeQiblaRing) {
    homeQiblaRing.classList.add('pd-ring-home-qibla');
    homeQiblaRing.innerHTML = `<div class="home-qibla-content"><div class="home-qibla-dial"><span>N</span><i id="homeQiblaArrow"></i></div><strong id="homeQiblaMiniBearing">—°</strong><small id="homeQiblaMiniDirection">Qibla direction</small></div>`;
    homeQiblaRing.setAttribute('role','button');
    homeQiblaRing.setAttribute('tabindex','0');
    homeQiblaRing.setAttribute('aria-label','Open Qibla finder');
    homeQiblaRing.addEventListener('click',()=>switchScreen('qiblaScreen'));
    homeQiblaRing.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();switchScreen('qiblaScreen');}});
    const label=homeQiblaRing.parentElement?.querySelector('.pd-ring-label');
    if(label)label.textContent='QIBLA DIRECTION';
  }

  // ---------------- Zakat estimate ----------------
  const zakatIds = ['zCash','zGold','zSilver','zInvestments','zInventory','zReceivable','zDebts','zNisab'];
  const money = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number.isFinite(n)?n:0);
  const value = id => { const v=Number($(id)?.value||0); return Number.isFinite(v)&&v>0?v:0; };
  function calculateZakat() {
    const result = window.NaseemZakat.calculate({
      cash:value('zCash'), gold:value('zGold'), silver:value('zSilver'),
      investments:value('zInvestments'), inventory:value('zInventory'),
      receivable:value('zReceivable'), debts:value('zDebts'),
      nisab:value('zNisab'), haul:!!$('zHaul')?.checked
    });
    $('zNet').textContent = money(result.net);
    let note = '';
    if (!result.assets) note = 'Add your eligible asset values to begin.';
    else if (!result.nisab) note = 'Enter a current nisab value verified from a trusted source.';
    else if (!result.meetsNisab) note = 'Your entered net wealth is below the nisab value. No estimate is due under this simplified calculation.';
    else if (!result.haul) note = 'The entered wealth meets the nisab value, but the lunar-year condition is not marked as complete.';
    else note = 'Estimated at 2.5% of the net amount entered. Review asset-specific rules before relying on this figure.';
    $('zResult').textContent = money(result.due);
    $('zResultNote').textContent = note;
    return result;
  }
  $('zCalculate')?.addEventListener('click',()=>{calculateZakat();toast('Estimate updated. Please review the guidance note.');});
  zakatIds.forEach(id=>$(id)?.addEventListener('input',calculateZakat));
  $('zHaul')?.addEventListener('change',calculateZakat);
  $('zReset')?.addEventListener('click',()=>{zakatIds.forEach(id=>{if($(id))$(id).value='';});if($('zHaul'))$('zHaul').checked=false;calculateZakat();toast('Calculator cleared.');});
  calculateZakat();

  // ---------------- Qibla finder ----------------
  const normalize = window.NaseemQibla.normalize;
  const cardinal = window.NaseemQibla.cardinal;
  const qiblaBearing = window.NaseemQibla.bearing;
  const distanceKm = window.NaseemQibla.distanceKm;
  let location={lat:34.0837,lng:74.7973,name:'Srinagar, Kashmir',source:'saved'};
  let bearing=null, heading=null, sensorStarted=false, absoluteSeen=false, locationLabel='Approximate saved prayer-city coordinates';
  function renderQibla(){
    if(!Number.isFinite(location.lat)||!Number.isFinite(location.lng))return;
    bearing=qiblaBearing(location.lat,location.lng);
    $('qiblaBearing').textContent=`${Math.round(bearing)}°`;
    $('qiblaCardinal').textContent=`${cardinal(bearing)} · direction of Makkah`;
    $('qiblaPlace').textContent=location.name||'Selected location';
    $('qiblaCoords').textContent=locationLabel;
    $('qiblaDistance').textContent=`${Math.round(distanceKm(location.lat,location.lng)).toLocaleString('en-IN')} km`;
    const miniArrow=$('homeQiblaArrow'), miniBearing=$('homeQiblaMiniBearing'), miniDirection=$('homeQiblaMiniDirection');
    if(miniBearing)miniBearing.textContent=`${Math.round(bearing)}°`;
    if(miniDirection)miniDirection.textContent=heading===null?`${cardinal(bearing)} · compass off`:`${cardinal(bearing)} · live compass`;
    if(miniArrow)miniArrow.style.transform=`translate(-50%,-50%) rotate(${normalize(bearing-(heading??0))}deg)`;
    const rose=$('qiblaRose'), needle=$('qiblaNeedle');
    rose.style.transform=`rotate(${heading===null?0:-heading}deg)`;
    needle.style.transform=`translate(-50%,-50%) rotate(${normalize(bearing-(heading??0))}deg)`;
    if(heading===null){
      $('qiblaCompassState').textContent='Compass not enabled';
      $('qiblaAlignment').textContent='Enable the compass to align the dial with your phone.';
    } else {
      const relative=normalize(bearing-heading);
      const aligned=Math.min(relative,360-relative)<=5;
      $('qiblaCompassState').textContent='Compass active';
      $('qiblaAlignment').textContent=aligned?'You are facing the Qibla.':`Turn ${relative<180?'clockwise':'anticlockwise'} about ${Math.round(Math.min(relative,360-relative))}° to face the Qibla.`;
    }
  }
  function savedPrayerLocation(){
    try{const s=window.NoorSalah?.get?.();if(s?.loc&&Number.isFinite(Number(s.loc.lat))&&Number.isFinite(Number(s.loc.lng))){location={lat:Number(s.loc.lat),lng:Number(s.loc.lng),name:s.loc.name||'Saved prayer location',source:'saved'};locationLabel='Approximate saved prayer-city coordinates';}}catch{}
    renderQibla();
  }
  function applyHeading(event){
    if(event.type==='deviceorientation' && absoluteSeen)return;
    if(event.type==='deviceorientationabsolute' || event.absolute===true)absoluteSeen=true;
    let h=null;
    if(Number.isFinite(event.webkitCompassHeading)) h=event.webkitCompassHeading;
    else if(Number.isFinite(event.alpha)) {
      const screenAngle=Number(window.screen?.orientation?.angle ?? window.orientation ?? 0)||0;
      h=360-event.alpha+screenAngle;
    }
    if(h!==null && Number.isFinite(h)){
      heading=normalize(h);renderQibla();
      $('qiblaCompassState').textContent=event.absolute===false?'Compass active · approximate':'Compass active';
    }
  }
  async function enableCompass(){
    if(!('DeviceOrientationEvent' in window)){toast('This device does not expose a compass sensor to the app.');return;}
    try{
      if(typeof DeviceOrientationEvent.requestPermission==='function'){
        const permission=await DeviceOrientationEvent.requestPermission();
        if(permission!=='granted'){toast('Compass permission was not granted.');return;}
      }
      if(!sensorStarted){
        window.addEventListener('deviceorientationabsolute',applyHeading,true);
        window.addEventListener('deviceorientation',applyHeading,true);
        sensorStarted=true;
      }
      $('qiblaCompassState').textContent='Waiting for sensor…';
      toast('Move the phone gently to initialise the compass.');
      setTimeout(()=>{if(heading===null)$('qiblaCompassState').textContent='No compass reading yet';},3500);
    }catch(error){toast(error?.message||'Could not enable the compass.');}
  }
  function useDeviceLocation(){
    if(!navigator.geolocation){toast('Location services are not available in this app.');return;}
    $('qiblaPlace').textContent='Finding your location…';
    navigator.geolocation.getCurrentPosition(position=>{
      location={lat:position.coords.latitude,lng:position.coords.longitude,name:'Your current location',source:'gps'};
      locationLabel=`Device location · ±${Math.round(position.coords.accuracy||0)} m`;
      renderQibla();toast('Qibla direction updated using device location.');
    },error=>{
      const messages={1:'Location permission was denied.',2:'Your location could not be determined.',3:'Location request timed out.'};
      toast(messages[error.code]||'Could not get your location.');renderQibla();
    },{enableHighAccuracy:true,timeout:15000,maximumAge:60000});
  }
  $('qiblaEnableCompass')?.addEventListener('click',enableCompass);
  $('qiblaUseLocation')?.addEventListener('click',useDeviceLocation);
  window.addEventListener('noor:schedule',()=>{if(location.source==='saved')savedPrayerLocation();});
  savedPrayerLocation();
})();
