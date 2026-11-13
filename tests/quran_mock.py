"""Offline stand-in for the AlQuran Cloud API, used ONLY by browser tests.

The text below is test data, not shipped content: surah 1 uses the well-known Al-Fatihah wording so layout can be judged
realistically; every other surah is generated filler marked "[test]" so no test can be mistaken for real Quran text.
Audio is a short generated tone so the recitation follow-along logic (highlight, centring, advance) is exercised for real.
"""
import io, json, math, re, struct, wave

FATIHA = [
    'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
    'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ',
    'ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
    'مَـٰلِكِ يَوْمِ ٱلدِّينِ',
    'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
    'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ',
    'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ',
]
FATIHA_EN = [
    'In the name of Allah, the Beneficent, the Merciful.',
    'Praise be to Allah, Lord of the Worlds,',
    'The Beneficent, the Merciful.',
    'Master of the Day of Judgment,',
    'Thee (alone) we worship; Thee (alone) we ask for help.',
    'Show us the straight path,',
    'The path of those whom Thou hast favoured; Not (the path) of those who earn Thine anger nor of those who go astray.',
]
BISMILLAH = FATIHA[0]
COUNTS = {1: 7, 2: 30, 3: 12, 9: 6}  # small, test-sized surahs; the list below still advertises 114 entries


def count(n):
    return COUNTS.get(n, 6)


def surah_list():
    return [{'number': n, 'name': f'سُورَةُ {n}', 'englishName': 'Al-Fatihah' if n == 1 else f'Test Surah {n}',
             'englishNameTranslation': 'The Opener' if n == 1 else f'Meaning {n}', 'numberOfAyahs': count(n),
             'revelationType': 'Meccan'} for n in range(1, 115)]


def surah_editions(n):
    meta = surah_list()[n - 1]
    ar, en = [], []
    for a in range(1, count(n) + 1):
        if n == 1:
            ta, te = FATIHA[a - 1], FATIHA_EN[a - 1]
        else:
            ta = FATIHA[(a - 1) % 7 + 0] if a > 1 else ('' if n == 9 else BISMILLAH + ' ') + 'الٓمٓ'
            te = f'[test] english meaning {n}:{a}'
        ar.append({'number': a, 'text': ta, 'numberInSurah': a, 'juz': 1, 'page': 1})
        en.append({'number': a, 'text': te, 'numberInSurah': a})
    base = {k: meta[k] for k in ('number', 'name', 'englishName', 'englishNameTranslation', 'revelationType')}
    base['numberOfAyahs'] = meta['numberOfAyahs']
    return [dict(base, edition={'identifier': 'quran-uthmani'}, ayahs=ar), dict(base, edition={'identifier': 'en.pickthall'}, ayahs=en)]


def tone_wav(seconds=1.2, freq=440):
    rate = 8000
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
        w.writeframes(b''.join(struct.pack('<h', int(3000 * math.sin(2 * math.pi * freq * i / rate))) for i in range(int(rate * seconds))))
    return buf.getvalue()


def install(page, seconds=1.2):
    """Route every AlQuran Cloud request (and the mock audio files) on this page to the offline fixtures."""
    wav = tone_wav(seconds)

    def api(route):
        path = re.sub(r'^https://api\.alquran\.cloud/v1', '', route.request.url)
        def ok(data): route.fulfill(status=200, content_type='application/json', headers={'Access-Control-Allow-Origin': '*'}, body=json.dumps({'code': 200, 'status': 'OK', 'data': data}))
        m = re.match(r'^/surah$', path)
        if m: return ok(surah_list())
        m = re.match(r'^/surah/(\d+)/editions/(.+)$', path)
        if m:
            eds = surah_editions(int(m.group(1)))
            return ok(eds if 'pickthall' in m.group(2) else eds[:1])
        m = re.match(r'^/surah/(\d+)/ar\.alafasy$', path)
        if m:
            n = int(m.group(1)); meta = surah_list()[n - 1]
            return ok(dict(meta, edition={'identifier': 'ar.alafasy'}, ayahs=[{'number': a, 'numberInSurah': a, 'text': 'x', 'audio': f'https://cdn.islamic.network/mock/{n}/{a}.wav'} for a in range(1, count(n) + 1)]))
        m = re.match(r'^/juz/(\d+)/quran-uthmani$', path)
        if m: return ok({'ayahs': [{'numberInSurah': 3, 'juz': int(m.group(1)), 'surah': {'number': 2, 'englishName': 'Test Surah 2'}}]})
        m = re.match(r'^/page/(\d+)/quran-uthmani$', path)
        if m: return ok({'ayahs': [{'numberInSurah': 2, 'juz': 1, 'surah': {'number': 3, 'englishName': 'Test Surah 3'}}]})
        route.fulfill(status=404, body='{}')
    page.route('https://api.alquran.cloud/**', api)
    page.route('https://cdn.islamic.network/mock/**', lambda r: r.fulfill(status=200, content_type='audio/wav', headers={'Access-Control-Allow-Origin': '*'}, body=wav))
