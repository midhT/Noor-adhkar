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
  /* Added in the final pass. verified:true = the Arabic and reference were read against Hisn al-Muslim (sunnah.com / surahquran.com copy) while writing this list.
     verified:false = standard wording typed from knowledge of the cited hadith; it shows "to be verified" in the app until checked against a printed source or a scholar. */
  const H = 'Hisn al-Muslim';
  const COMMON = [
    { id:'sayyid-istighfar', title:'Sayyid al-Istighfar', count:1, verified:true,
      arabic:'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
      meaning: 'O Allah, You are my Lord; none has the right to be worshipped but You. You created me and I am Your servant, and I keep Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favour upon me and I acknowledge my sin, so forgive me, for none forgives sins except You.', source:'Sahih al-Bukhari 6306 · ' + H },
    { id:'ma-afini', title:'Ask for well-being', count:3, verified:false,
      arabic:'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ',
      meaning:'O Allah, grant me health in my body. O Allah, grant me health in my hearing. O Allah, grant me health in my sight. There is no god but You.', source:'Abu Dawud 5090 · ' + H },
    { id:'radheetu', title:'Content with Allah as Lord', count:3, verified:false,
      arabic:'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا',
      meaning:'I am pleased with Allah as my Lord, Islam as my religion, and Muhammad (peace be upon him) as my Prophet.', source:'Abu Dawud 5072, at-Tirmidhi 3389 · ' + H },
    { id:'afw-afiyah', title:'Pardon and well-being', count:1, verified:false,
      arabic:'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ',
      meaning:'O Allah, I ask You for pardon and well-being in this world and the next.', source:'Abu Dawud 5074, Ibn Majah 3871 · ' + H },
    { id:'tahlil-10', title:'La ilaha illallah wahdahu', count:10, verified:false,
      arabic:'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
      meaning:'None has the right to be worshipped but Allah alone, with no partner. His is the dominion and His is the praise, and He has power over all things.', source:'Abu Dawud 5077, Ibn Majah 3867 · ' + H },
    { id:'istighfar-100', title:'Seek forgiveness', count:100, verified:false,
      arabic:'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
      meaning:'I seek forgiveness from Allah and turn to Him in repentance.', source:'Sahih al-Bukhari 6307' }
  ];
  const MORNING_ONLY = [
    { id:'m-asbahna', title:'We have reached the morning', count:1, verified:false,
      arabic:'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
      meaning:'We have reached the morning and the dominion belongs to Allah. All praise is for Allah. None has the right to be worshipped but Allah alone, with no partner.', source:'Sahih Muslim 2723 · ' + H },
    { id:'m-bika', title:'By You we reach the morning', count:1, verified:false,
      arabic:'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ',
      meaning:'O Allah, by You we reach the morning and by You we reach the evening; by You we live and by You we die, and to You is the resurrection.', source:'Abu Dawud 5068, at-Tirmidhi 3391 · ' + H }
  ];
  const EVENING_ONLY = [
    { id:'e-amsayna', title:'We have reached the evening', count:1, verified:false,
      arabic:'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
      meaning:'We have reached the evening and the dominion belongs to Allah. All praise is for Allah. None has the right to be worshipped but Allah alone, with no partner.', source:'Sahih Muslim 2723 · ' + H },
    { id:'e-bika', title:'By You we reach the evening', count:1, verified:false,
      arabic:'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ',
      meaning:'O Allah, by You we reach the evening and by You we reach the morning; by You we live and by You we die, and to You is the final return.', source:'Abu Dawud 5068, at-Tirmidhi 3391 · ' + H }
  ];
  const MORNING = MORNING_ONLY.concat(SHARED, COMMON);
  const EVENING = EVENING_ONLY.concat(SHARED, COMMON);
  const KURSI = SHARED[0];
  const AFTER_SALAH_FULL = AFTER_SALAH.concat([
    { id:'after-tasbih-33', title:'SubhanAllah', count:33, verified:true, arabic:'سُبْحَانَ اللَّهِ', meaning:'Glory be to Allah.', source:'Sahih Muslim 596 · ' + H + ' 69' },
    { id:'after-tahmid-33', title:'Alhamdulillah', count:33, verified:true, arabic:'الْحَمْدُ لِلَّهِ', meaning:'All praise is for Allah.', source:'Sahih Muslim 596 · ' + H + ' 69' },
    { id:'after-takbir-33', title:'Allahu Akbar', count:33, verified:true, arabic:'اللَّهُ أَكْبَرُ', meaning:'Allah is the Greatest.', source:'Sahih Muslim 596 · ' + H + ' 69' },
    { id:'after-tahlil', title:'Complete the hundred', count:1, verified:true, arabic:'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', meaning:'None has the right to be worshipped but Allah alone, with no partner. His is the dominion and His is the praise, and He has power over all things.', source:'Sahih Muslim 597 · ' + H + ' 69' },
    { id:'after-kursi', title:'Ayat al-Kursi', count:1, verified:false, arabic:KURSI.arabic, meaning:KURSI.meaning, source:'Qur’an 2:255 · an-Nasa’i, Amal al-Yawm wal-Layla 100' },
    { id:'after-ikhlas', title:'Surah Al-Ikhlas', count:1, verified:false, arabic:'قُلْ هُوَ اللَّهُ أَحَدٌ اللَّهُ الصَّمَدُ لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ', meaning:'Surah 112. The Prophet (peace be upon him) used to recite the Mu’awwidhat after every prayer.', source:'Qur’an 112 · Abu Dawud 1523' },
    { id:'after-shukr', title:'Help me remember You', count:1, verified:false, arabic:'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ', meaning:'O Allah, help me to remember You, to thank You, and to worship You well.', source:'Abu Dawud 1522, an-Nasa’i 1303' }
  ]);
  const TASBIH_FATIMA = [
    { id:'tf-subhanallah', title:'SubhanAllah', count:33, verified:false, arabic:'سُبْحَانَ اللَّهِ', meaning:'Glory be to Allah.', source:'Sahih al-Bukhari 3113, Sahih Muslim 2727' },
    { id:'tf-alhamdulillah', title:'Alhamdulillah', count:33, verified:false, arabic:'الْحَمْدُ لِلَّهِ', meaning:'All praise is for Allah.', source:'Sahih al-Bukhari 3113, Sahih Muslim 2727' },
    { id:'tf-allahu-akbar', title:'Allahu Akbar', count:34, verified:false, arabic:'اللَّهُ أَكْبَرُ', meaning:'Allah is the Greatest.', source:'Sahih al-Bukhari 3113, Sahih Muslim 2727' }
  ];
  const BEFORE_SLEEP_FULL = BEFORE_SLEEP.map(i => i.id === 'sleep-bismika' ? Object.assign({}, i, { verified:true, source:'Sahih al-Bukhari 6324 · ' + H + ' 105' }) : i).concat([
    { id:'sleep-kursi', title:'Ayat al-Kursi', count:1, verified:false, arabic:KURSI.arabic, meaning:'Reciting it at bedtime brings a guardian from Allah, and Shaytan does not come near until morning.', source:'Qur’an 2:255 · Sahih al-Bukhari 2311 · ' + H + ' 100' },
    { id:'sleep-baqarah-end', title:'Last two verses of Al-Baqarah', count:1, verified:false, arabic:'آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِّن رُّسُلِهِ وَقَالُوا سَمِعْنَا وَأَطَعْنَا غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا أَنتَ مَوْلَانَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ', meaning:'Surah al-Baqarah 2:285–286. Whoever recites them at night, they will suffice him.', source:'Qur’an 2:285–286 · Sahih al-Bukhari 5009, Sahih Muslim 807' },
    { id:'sleep-qini', title:'Protect me from Your punishment', count:3, verified:false, arabic:'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ', meaning:'O Allah, protect me from Your punishment on the Day You resurrect Your servants.', source:'Abu Dawud 5045, at-Tirmidhi 3398' }
  ]);
  const WAKING_FULL = [
    { id:'wake-hamd', title:'Upon waking', count:1, verified:true, arabic:'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', meaning:'All praise is for Allah who gave us life after having taken it from us, and to Him is the resurrection.', source:'Sahih al-Bukhari 6314, Sahih Muslim 2711 · ' + H },
    { id:'wake-health', title:'Thanks for health and soul', count:1, verified:true, arabic:'الْحَمْدُ لِلَّهِ الَّذِي عَافَانِي فِي جَسَدِي، وَرَدَّ عَلَيَّ رُوحِي، وَأَذِنَ لِي بِذِكْرِهِ', meaning:'All praise is for Allah who restored to me my health, returned my soul, and permitted me to remember Him.', source:'at-Tirmidhi 3401 · ' + H },
    { id:'wake-night', title:'On waking in the night', count:1, verified:true, arabic:'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ، رَبِّ اغْفِرْ لِي', meaning:'Then ask Allah for forgiveness or make any dua. It is hoped to be accepted.', source:'Sahih al-Bukhari 1154 · ' + H }
  ];
  const TRAVEL_FULL = [
    { id:'travel-takbir3', title:'Takbir', count:3, verified:true, arabic:'اللَّهُ أَكْبَرُ', meaning:'Allah is the Greatest. Say it three times, then the dua of riding.', source:'Sahih Muslim 1342 · ' + H + ' 97' }
  ].concat(TRAVEL, [
    { id:'travel-birr', title:'Goodness and piety on this journey', count:1, verified:false, arabic:'اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى', meaning:'O Allah, we ask You on this journey for goodness, piety, and deeds that please You.', source:'Sahih Muslim 1342 · ' + H + ' 97' },
    { id:'travel-easy', title:'Make this journey easy', count:1, verified:false, arabic:'اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ', meaning:'O Allah, make this journey easy for us and shorten its distance.', source:'Sahih Muslim 1342 · ' + H + ' 97' }
  ]);
  const DAILY_LIFE = [
    { id:'dl-leave-home', title:'Leaving the home', count:1, verified:true, arabic:'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', meaning:'In the name of Allah. I place my trust in Allah; there is no might and no power except by Allah.', source:'Abu Dawud 5095, at-Tirmidhi 3426 · ' + H + ' 16' },
    { id:'dl-enter-home', title:'Entering the home', count:1, verified:true, arabic:'بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى رَبِّنَا تَوَكَّلْنَا', meaning:'In the name of Allah we enter, in the name of Allah we leave, and upon our Lord we rely. Then greet your family.', source:'Abu Dawud 5096 · ' + H + ' 18' },
    { id:'dl-eat-before', title:'Before eating', count:1, verified:true, arabic:'بِسْمِ اللَّهِ', meaning:'In the name of Allah. If you forget at the start, say: Bismillahi awwalahu wa akhirahu.', source:'Abu Dawud 3767, at-Tirmidhi 1858 · ' + H },
    { id:'dl-eat-after', title:'After eating', count:1, verified:true, arabic:'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا، وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ', meaning:'All praise is for Allah who fed me this and provided it for me, with no power or might from myself.', source:'Abu Dawud 4025, at-Tirmidhi 3458, Ibn Majah 3285 · ' + H },
    { id:'dl-toilet-in', title:'Entering the toilet', count:1, verified:false, arabic:'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ', meaning:'O Allah, I seek refuge in You from the male and female evil ones.', source:'Sahih al-Bukhari 142, Sahih Muslim 375 · ' + H },
    { id:'dl-toilet-out', title:'Leaving the toilet', count:1, verified:false, arabic:'غُفْرَانَكَ', meaning:'I ask Your forgiveness.', source:'Abu Dawud 30, at-Tirmidhi 7 · ' + H }
  ];
  const sessions = { morning: MORNING, evening: EVENING, after_salah: AFTER_SALAH_FULL, tasbih_fatima: TASBIH_FATIMA, before_sleep: BEFORE_SLEEP_FULL, waking: WAKING_FULL, travel: TRAVEL_FULL, daily_life: DAILY_LIFE };
  function setCustomRoutines(list){Object.keys(sessions).filter(k=>k.startsWith('custom_')).forEach(k=>delete sessions[k]);(Array.isArray(list)?list:[]).forEach(r=>{if(!r||!r.id||!Array.isArray(r.items))return;sessions['custom_'+r.id]=r.items.map((it,i)=>({...it,id:String(it.id||`custom-${r.id}-${i+1}`),count:Math.max(1,Math.min(10000,Number(it.count)||1)),verified:false}));});}
  return { sessions, items: which => sessions[which] || [], setCustomRoutines, starterSet: true };
});
