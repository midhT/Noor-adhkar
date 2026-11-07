"""Generates Android icon/splash PNGs and the focus ambient loop. Run: python3 tool/gen_assets.py
Needs Pillow + numpy. Source art: assets/icon.png (Noor V3 artwork)."""
import math, os, wave
import numpy as np
from PIL import Image, ImageDraw, ImageChops

RES = 'android/app/src/main/res'
GOLD = (229, 193, 123, 255)
STAR = (255, 240, 179, 255)

def crescent(size, fg=GOLD, star=True, scale=1.0):
    """Transparent RGBA canvas with a centred crescent (+ 4-point star)."""
    S = size * 4
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    r = S * 0.30 * scale
    cx, cy = S * 0.46, S * 0.52
    mask = Image.new('L', (S, S), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    cut = Image.new('L', (S, S), 0)
    cd = ImageDraw.Draw(cut)
    ox, oy, rr = r * 0.42, -r * 0.18, r * 0.86
    cd.ellipse([cx + ox - rr, cy + oy - rr, cx + ox + rr, cy + oy + rr], fill=255)
    mask = ImageChops.subtract(mask, cut)
    solid = Image.new('RGBA', (S, S), fg)
    im.paste(solid, (0, 0), mask)
    if star:
        sx, sy, sr = cx + r * 0.78, cy - r * 0.62, r * 0.30 * 1.0
        pts = []
        for i in range(8):
            ang = math.pi / 4 * i - math.pi / 2
            rad = sr if i % 2 == 0 else sr * 0.22
            pts.append((sx + rad * math.cos(ang), sy + rad * math.sin(ang)))
        d.polygon(pts, fill=STAR if fg == GOLD else fg)
    return im.resize((size, size), Image.LANCZOS)

def save(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)

# --- legacy launcher icons from V3 artwork
src = Image.open('assets/icon.png').convert('RGBA')
for dpi, px in {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}.items():
    save(src.resize((px, px), Image.LANCZOS), f'{RES}/mipmap-{dpi}/ic_launcher.png')
# --- adaptive foreground (108dp canvas, art inside the 66dp safe zone) + monochrome
for dpi, px in {'mdpi': 108, 'hdpi': 162, 'xhdpi': 216, 'xxhdpi': 324, 'xxxhdpi': 432}.items():
    save(crescent(px, scale=0.78), f'{RES}/mipmap-{dpi}/ic_launcher_foreground.png')
    save(crescent(px, fg=(255, 255, 255, 255), scale=0.78), f'{RES}/mipmap-{dpi}/ic_launcher_monochrome.png')
# --- notification small icon (white on transparent)
for dpi, px in {'mdpi': 24, 'hdpi': 36, 'xhdpi': 48, 'xxhdpi': 72, 'xxxhdpi': 96}.items():
    save(crescent(px, fg=(255, 255, 255, 255), star=False, scale=1.25), f'{RES}/drawable-{dpi}/ic_stat_noor.png')
# --- native splash logo (also used as Android 12 splash icon)
save(crescent(576, scale=0.95), f'{RES}/drawable-nodpi/splash_logo.png')

# --- focus ambient loop: seamless because every partial completes whole cycles in T seconds
SR, T = 22050, 24
t = np.arange(SR * T) / SR
def tone(f, amp, lfo_cycles, phase=0.0):
    f = round(f * T) / T                      # snap to whole cycles per loop
    lfo = 0.65 + 0.35 * np.sin(2 * np.pi * lfo_cycles * t / T + phase)
    return amp * lfo * np.sin(2 * np.pi * f * t + phase)
y = (tone(110.0, 0.30, 1, 0.0) + tone(110.4, 0.22, 2, 1.1) + tone(164.8, 0.18, 1, 2.0)
     + tone(220.0, 0.14, 3, 0.7) + tone(329.6, 0.06, 2, 2.6) + tone(55.0, 0.18, 1, 0.3))
y = y / np.max(np.abs(y)) * 0.32
pcm = (y * 32767).astype('<i2')
os.makedirs('assets/audio', exist_ok=True)
with wave.open('assets/audio/night_pad.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('seam jump:', abs(int(pcm[0]) - int(pcm[-1])), 'max step:', int(np.max(np.abs(np.diff(pcm.astype(int))))))
