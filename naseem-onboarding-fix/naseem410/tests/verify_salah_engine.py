"""Cross-checks Noor's prayer engine (www/salah.js) against an independent solar model.
Reference: NOAA solar-calculator series (different from the model inside salah.js), exact hour-angle
solutions for each twilight / shadow angle, no rounding. Pass: every time within 1.0 minute (rounding to the
nearest minute accounts for up to 0.5, the two solar models for the rest)."""
import json, math, subprocess, os, sys, datetime
HERE=os.path.dirname(os.path.abspath(__file__))
WWW=os.path.join(HERE,'..','www','salah.js')
CITIES={'srinagar':(34.0837,74.7973,5.5),'delhi':(28.6139,77.2090,5.5),'makkah':(21.4225,39.8262,3.0),'dhaka':(23.8103,90.4125,6.0),'karachi':(24.8607,67.0011,5.0)}
METHODS={'karachi':(18,18),'mwl':(18,17),'isna':(15,15),'egypt':(19.5,17.5)}
js="""
const C=require(process.argv[1]);const out=[];
for(const id of %s){const loc=C.CITIES.find(c=>c.id===id);
 for(let doy=0;doy<365;doy+=9){const dt=new Date(Date.UTC(2026,0,1+doy));const y=dt.getUTCFullYear(),m=dt.getUTCMonth()+1,d=dt.getUTCDate();
  for(const meth of %s){for(const asr of ['hanafi','standard']){out.push({id,y,m,d,meth,asr,t:C.calculate(y,m,d,loc,meth,asr)});}}}}
console.log(JSON.stringify(out));"""%(json.dumps(list(CITIES)),json.dumps(list(METHODS)))
res=json.loads(subprocess.check_output(['node','-e',js,WWW]))
def sun(jd):
    """NOAA solar-calculator series (Meeus ch. 25 with true longitude, eccentricity and nutation terms)."""
    jc=(jd-2451545.0)/36525.0
    r=math.radians
    L0=(280.46646+jc*(36000.76983+jc*0.0003032))%360
    g=357.52911+jc*(35999.05029-0.0001537*jc)
    e=0.016708634-jc*(0.000042037+0.0000001267*jc)
    C=math.sin(r(g))*(1.914602-jc*(0.004817+0.000014*jc))+math.sin(r(2*g))*(0.019993-0.000101*jc)+math.sin(r(3*g))*0.000289
    lam=L0+C-0.00569-0.00478*math.sin(r(125.04-1934.136*jc))
    eps0=23+(26+(21.448-jc*(46.815+jc*(0.00059-jc*0.001813)))/60)/60
    eps=eps0+0.00256*math.cos(r(125.04-1934.136*jc))
    dec=math.asin(math.sin(r(eps))*math.sin(r(lam)))
    y=math.tan(r(eps/2))**2
    eq=4*math.degrees(y*math.sin(r(2*L0))-2*e*math.sin(r(g))+4*e*y*math.sin(r(g))*math.cos(r(2*L0))-0.5*y*y*math.sin(r(4*L0))-1.25*e*e*math.sin(r(2*g)))
    return eq,dec
def noaa(y,m,d,lat,lng,tz,fajr,isha,factor):
    jd0=(datetime.date(y,m,d)-datetime.date(2000,1,1)).days+2451544.5   # JD at 0h UT of that date
    phi=math.radians(lat)
    def state(local_h): return sun(jd0+(local_h-tz)/24.0)
    def noon():
        h=12.0
        for _ in range(4):
            eq,_d=state(h); h=(720-4*lng-eq)/60+tz
        return h
    def at(alt,before,guess):
        h=guess
        for _ in range(6):
            eq,dec=state(h); nn=(720-4*lng-eq)/60+tz
            c=(math.sin(math.radians(alt))-math.sin(phi)*math.sin(dec))/(math.cos(phi)*math.cos(dec))
            H=math.degrees(math.acos(c))/15
            h=nn+(-H if before else H)
        return h
    nn=noon(); eq,dec=state(15.0)
    alt=math.degrees(math.atan(1/(factor+math.tan(abs(phi-dec)))))
    return {'dhuhr':nn,'sunrise':at(-0.833,True,6),'maghrib':at(-0.833,False,18),'fajr':at(-fajr,True,5),'isha':at(-isha,False,19),'asr':at(alt,False,15)}
worst=0; n=0; bad=[]
for r in res:
    lat,lng,tz=CITIES[r['id']]; fa,is_=METHODS[r['meth']]
    try: ref=noaa(r['y'],r['m'],r['d'],lat,lng,tz,fa,is_,2 if r['asr']=='hanafi' else 1)
    except ValueError: continue
    for k,v in ref.items():
        h,mm=map(int,r['t'][k].split(':')); got=h*60+mm
        diff=abs(((got-v*60)+720)%1440-720); n+=1
        if diff>worst: worst=diff; wk=(r['id'],r['y'],r['m'],r['d'],r['meth'],r['asr'],k,r['t'][k],round(v*60))
        if diff>1.0: bad.append((r['id'],r['m'],r['d'],k,r['t'][k],round(v*60),round(diff,2)))
print(f'{n} comparisons; worst difference {worst:.2f} min at {wk}')
print('FAILED:',bad[:6] if bad else 'none (all within 1.0 min)')
sys.exit(1 if bad else 0)
