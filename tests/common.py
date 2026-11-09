import os, subprocess, time, json
HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, '.build')
class Server:
    def __init__(self, port):
        self.port = port
        self.p = subprocess.Popen(['python3', '-m', 'http.server', str(port), '-d', BUILD + '/wwwtest'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(1)
    def url(self): return f'http://localhost:{self.port}/index.html'
    def stop(self): self.p.terminate()
class Results:
    def __init__(self): self.r = {}
    def ok(self, name, cond, extra=''):
        print(('PASS' if cond else 'FAIL'), name, extra); self.r[name] = bool(cond)
    def done(self, label):
        bad = [k for k, v in self.r.items() if not v]
        print(f'{label}:', 'ALL PASS' if not bad else f'FAILED {bad}', f'({sum(self.r.values())}/{len(self.r)})')
        return 0 if not bad else 1
def drag(cdp, y0, y1, x=200):
    cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y0}]})
    for i in range(1, 13):
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x, 'y': y0 + (y1 - y0) * i / 12}]}); time.sleep(0.016)
    cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); time.sleep(0.6)
def open_group(pg, gid):
    pg.click('.nav-item[data-screen="settingsScreen"]'); pg.wait_for_timeout(300)
    if not pg.evaluate(f"document.getElementById('{gid}').open"): pg.click(f'#{gid} > summary')
    pg.wait_for_timeout(250)
