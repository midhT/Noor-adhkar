/* Starter Morning/Evening adhkar set.
   IMPORTANT: this is a deliberately small starter list. The Arabic text, counts and references were entered
   by the developer assistant and have NOT yet been verified by a scholar or against a printed source (verified:false).
   Verify each entry, then set verified:true and extend the list. Only items that read identically in the
   morning and the evening are included; items with morning/evening wording differences must be added as separate entries. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NaseemAdhkarData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SHARED = [
    { id: 'ayat-al-kursi', title: 'Ayat al-Kursi', count: 1, verified: false,
      arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
      meaning: 'Surah Al-Baqarah, verse 255.', source: 'Qur’an 2:255' },
    { id: 'ikhlas', title: 'Surah Al-Ikhlas', count: 3, verified: false,
      arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ اللَّهُ الصَّمَدُ لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
      meaning: 'Surah 112, recited three times.', source: 'Qur’an 112 · Abu Dawud 5082, at-Tirmidhi 3575' },
    { id: 'falaq', title: 'Surah Al-Falaq', count: 3, verified: false,
      arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ مِن شَرِّ مَا خَلَقَ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ',
      meaning: 'Surah 113, recited three times.', source: 'Qur’an 113 · Abu Dawud 5082, at-Tirmidhi 3575' },
    { id: 'nas', title: 'Surah An-Nas', count: 3, verified: false,
      arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ مَلِكِ النَّاسِ إِلَٰهِ النَّاسِ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ مِنَ الْجِنَّةِ وَالنَّاسِ',
      meaning: 'Surah 114, recited three times.', source: 'Qur’an 114 · Abu Dawud 5082, at-Tirmidhi 3575' },
    { id: 'bismillah-protection', title: 'Protection from harm', count: 3, verified: false,
      arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
      meaning: 'In the name of Allah, with whose name nothing on earth or in heaven can cause harm, and He is the All-Hearing, the All-Knowing.', source: 'Abu Dawud 5088, at-Tirmidhi 3388' },
    { id: 'tasbih-100', title: 'Glorify Allah', count: 100, verified: false,
      arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
      meaning: 'Glory and praise be to Allah.', source: 'Muslim 2692' }
  ];
  const AFTER_SALAH = [
    { id:'after-istighfar', title:'Seek forgiveness', count:3, verified:false, arabic:'أَسْتَغْفِرُ اللّٰهَ', meaning:'I seek forgiveness from Allah.', source:'Sahih Muslim 591' },
    { id:'allahumma-antas-salam', title:'Allahumma anta as-salam', count:1, verified:false, arabic:'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ', meaning:'O Allah, You are Peace and from You is peace.', source:'Sahih Muslim 591' }
  ];
  const BEFORE_SLEEP = [
    { id:'sleep-bismika', title:'Before sleeping', count:1, verified:false, arabic:'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', meaning:'In Your name, O Allah, I die and I live.', source:'Sahih al-Bukhari 6324' },
    { id:'sleep-three-quls', title:'Recite the three Quls', count:3, verified:false, arabic:'قُلْ هُوَ اللَّهُ أَحَدٌ', meaning:'Recite Surah al-Ikhlas, al-Falaq and an-Nas, as reported in the Sunnah.', source:'Sahih al-Bukhari 5017' }
  ];
  const WAKING = [
    { id:'wake-hamd', title:'Upon waking', count:1, verified:false, arabic:'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', meaning:'Praise belongs to Allah who gave us life after causing us to die, and to Him is the resurrection.', source:'Sahih al-Bukhari 6312' }
  ];
  const TRAVEL = [
    { id:'travel-takbir', title:'Supplication when mounting a ride', count:1, verified:false, arabic:'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَىٰ رَبِّنَا لَمُنقَلِبُونَ', meaning:'Glory be to the One who has subjected this to us; we could not have done so ourselves, and surely to our Lord we will return.', source:'Qur’an 43:13–14' }
  ];
  const sessions = { morning: SHARED, evening: SHARED, after_salah: AFTER_SALAH, before_sleep: BEFORE_SLEEP, waking: WAKING, travel: TRAVEL };
  return { sessions, items: which => sessions[which] || [], starterSet: true };
});
