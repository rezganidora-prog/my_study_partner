import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// ─── Types ────────────────────────────────────────────────────────────────────
type Ayat = {
  arabic: string;
  surah: string;
  translation: string;
};

// ─── 50 Ayats ─────────────────────────────────────────────────────────────────
const AYAT: Ayat[] = [
  { arabic: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ', surah: 'سورة الطلاق • آية ٣', translation: 'Celui qui met sa confiance en Allah, Il lui suffit' },
  { arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', surah: 'سورة الشرح • آية ٥', translation: 'Car avec la difficulté vient la facilité' },
  { arabic: 'وَقُل رَّبِّ زِدْنِي عِلْمًا', surah: 'سورة طه • آية ١١٤', translation: 'Dis : Seigneur, augmente mes connaissances' },
  { arabic: 'إِنَّ اللَّهَ لَا يُضَيِّعُ أَجْرَ الْمُحْسِنِينَ', surah: 'سورة التوبة • آية ١٢٠', translation: 'Allah ne laisse pas perdre la récompense des bienfaisants' },
  { arabic: 'وَاللَّهُ يُحِبُّ الصَّابِرِينَ', surah: 'سورة آل عمران • آية ١٤٦', translation: 'Allah aime ceux qui sont patients' },
  { arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', surah: 'سورة الشرح • آية ٦', translation: 'Oui, avec la difficulté vient la facilité' },
  { arabic: 'وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهو خَيْرٌ لَّكُمْ', surah: 'سورة البقرة • آية ٢١٦', translation: 'Il se peut que vous détestiez une chose qui est bonne pour vous' },
  { arabic: 'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ', surah: 'سورة النور • آية ٣٥', translation: 'Allah est la lumière des cieux et de la terre' },
  { arabic: 'وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ', surah: 'سورة الحديد • آية ٤', translation: 'Il est avec vous où que vous soyez' },
  { arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً', surah: 'سورة البقرة • آية ٢٠١', translation: 'Seigneur, accorde-nous le bien ici-bas' },
  { arabic: 'وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ', surah: 'سورة يوسف • آية ٨٧', translation: "Ne désespérez jamais de la miséricorde d'Allah" },
  { arabic: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ', surah: 'سورة البقرة • آية ١٥٣', translation: 'Allah est avec les patients' },
  { arabic: 'وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ', surah: 'سورة هود • آية ٨٨', translation: "Ma réussite ne vient que d'Allah" },
  { arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', surah: 'سورة آل عمران • آية ١٧٣', translation: 'Allah nous suffit, Il est le meilleur garant' },
  { arabic: 'وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ', surah: 'سورة النحل • آية ١٢٧', translation: "Sois patient, ta patience ne vient que d'Allah" },
  { arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ', surah: 'سورة البقرة • آية ١٥٢', translation: 'Invoquez-Moi, Je vous répondrai' },
  { arabic: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ', surah: 'سورة البقرة • آية ١٨٦', translation: "Quand Mes serviteurs t'interrogent sur Moi, Je suis proche" },
  { arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ', surah: 'سورة البقرة • آية ١٥٣', translation: 'Cherchez secours dans la patience et la prière' },
  { arabic: 'وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ', surah: 'سورة الضحى • آية ٥', translation: 'Ton Seigneur te donnera et tu seras satisfait' },
  { arabic: 'أَلَمْ يَجِدْكَ يَتِيمًا فَآوَىٰ', surah: 'سورة الضحى • آية ٦', translation: "Ne t'a-t-Il pas trouvé orphelin et recueilli" },
  { arabic: 'وَرَفَعْنَا لَكَ ذِكْرَكَ', surah: 'سورة الشرح • آية ٤', translation: 'Nous avons élevé ta renommée' },
  { arabic: 'إِنَّ الْإِنسَانَ لَفِي خُسْرٍ إِلَّا الَّذِينَ آمَنُوا', surah: 'سورة العصر • آية ٢-٣', translation: "L'homme est en perdition sauf ceux qui croient" },
  { arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ', surah: 'سورة الإخلاص • آية ١', translation: "Dis : Il est Allah, l'Unique" },
  { arabic: 'وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ', surah: 'سورة الذاريات • آية ٥٦', translation: "Je n'ai créé les djinns et les hommes que pour M'adorer" },
  { arabic: 'كُلُّ نَفْسٍ ذَائِقَةُ الْمَوْتِ', surah: 'سورة آل عمران • آية ١٨٥', translation: 'Toute âme goûtera la mort' },
  { arabic: 'وَمَا الْحَيَاةُ الدُّنْيَا إِلَّا مَتَاعُ الْغُرُورِ', surah: 'سورة آل عمران • آية ١٨٥', translation: "La vie d'ici-bas n'est que jouissance trompeuse" },
  { arabic: 'إِنَّ أَكْرَمَكُمْ عِندَ اللَّهِ أَتْقَاكُمْ', surah: 'سورة الحجرات • آية ١٣', translation: 'Le plus noble d\'entre vous est le plus pieux' },
  { arabic: 'وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ', surah: 'سورة البقرة • آية ٤٣', translation: 'Accomplissez la prière et acquittez la zakat' },
  { arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي', surah: 'سورة طه • آية ٢٥', translation: 'Seigneur, ouvre ma poitrine' },
  { arabic: 'وَيُعَلِّمُهُمُ الْكِتَابَ وَالْحِكْمَةَ', surah: 'سورة البقرة • آية ١٢٩', translation: 'Il leur enseigne le Livre et la Sagesse' },
  { arabic: 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ', surah: 'سورة العلق • آية ١', translation: 'Lis au nom de ton Seigneur qui a créé' },
  { arabic: 'عَلَّمَ الْإِنسَانَ مَا لَمْ يَعْلَمْ', surah: 'سورة العلق • آية ٥', translation: "Il a enseigné à l'homme ce qu'il ne savait pas" },
  { arabic: 'وَفَوْقَ كُلِّ ذِي عِلْمٍ عَلِيمٌ', surah: 'سورة يوسف • آية ٧٦', translation: "Au-dessus de tout savant, il y a un Omniscient" },
  { arabic: 'يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ', surah: 'سورة المجادلة • آية ١١', translation: 'Allah élève ceux qui croient et ceux qui ont le savoir' },
  { arabic: 'هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ', surah: 'سورة الزمر • آية ٩', translation: 'Sont-ils égaux ceux qui savent et ceux qui ne savent pas' },
  { arabic: 'وَقُلِ اعْمَلُوا فَسَيَرَى اللَّهُ عَمَلَكُمْ', surah: 'سورة التوبة • آية ١٠٥', translation: 'Agissez, Allah verra vos actes' },
  { arabic: 'إِنَّ اللَّهَ يُحِبُّ الْمُتَوَكِّلِينَ', surah: 'سورة آل عمران • آية ١٥٩', translation: 'Allah aime ceux qui Lui font confiance' },
  { arabic: 'وَمَن جَاهَدَ فَإِنَّمَا يُجَاهِدُ لِنَفْسِهِ', surah: 'سورة العنكبوت • آية ٦', translation: 'Celui qui se dépense le fait pour lui-même' },
  { arabic: 'إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا مَا بِأَنفُسِهِمْ', surah: 'سورة الرعد • آية ١١', translation: "Allah ne change pas l'état d'un peuple tant qu'il ne change pas lui-même" },
  { arabic: 'وَاللَّهُ غَالِبٌ عَلَىٰ أَمْرِهِ', surah: 'سورة يوسف • آية ٢١', translation: 'Allah est maître de Ses décisions' },
  { arabic: 'رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ', surah: 'سورة القصص • آية ٢٤', translation: 'Seigneur, j\'ai besoin du bien que Tu fais descendre' },
  { arabic: 'وَلَا تُفْسِدُوا فِي الْأَرْضِ بَعْدَ إِصْلَاحِهَا', surah: 'سورة الأعراف • آية ٥٦', translation: 'Ne semez pas la corruption sur terre après sa réforme' },
  { arabic: 'وَإِن تَعُدُّوا نِعْمَةَ اللَّهِ لَا تُحْصُوهَا', surah: 'سورة النحل • آية ١٨', translation: "Si vous comptez les bienfaits d'Allah vous ne pourrez les dénombrer" },
  { arabic: 'الْمَالُ وَالْبَنُونَ زِينَةُ الْحَيَاةِ الدُّنْيَا', surah: 'سورة الكهف • آية ٤٦', translation: "Les biens et les enfants sont l'ornement de la vie d'ici-bas" },
  { arabic: 'وَمَا أُوتِيتُم مِّن شَيْءٍ فَمَتَاعُ الْحَيَاةِ الدُّنْيَا', surah: 'سورة الشورى • آية ٣٦', translation: "Ce qu'on vous a donné n'est que jouissance de la vie présente" },
  { arabic: 'فَسَتَذْكُرُونَ مَا أَقُولُ لَكُمْ', surah: 'سورة غافر • آية ٤٤', translation: 'Vous vous souviendrez de ce que je vous dis' },
  { arabic: 'وَأَنَّ إِلَىٰ رَبِّكَ الْمُنتَهَىٰ', surah: 'سورة النجم • آية ٤٢', translation: 'Et que vers ton Seigneur est la finalité' },
  { arabic: 'فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ', surah: 'سورة الرحمن • آية ١٣', translation: 'Lequel des bienfaits de votre Seigneur nierez-vous' },
  { arabic: 'وَخُلِقَ الْإِنسَانُ ضَعِيفًا', surah: 'سورة النساء • آية ٢٨', translation: "L'homme a été créé faible" },
];

const COUNTDOWN_SECS = 4;

// ─── Component ────────────────────────────────────────────────────────────────
export default function SplashAyat() {
  const router = useRouter();
  const navigatedRef = useRef(false);

  const [ayat] = useState<Ayat>(
    () => AYAT[Math.floor(Math.random() * AYAT.length)]
  );
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  const navigate = useCallback(() => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    router.replace('/(tabs)' as any);
  }, [router]);

  useEffect(() => {
    // Entrée en douceur
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();

    // Barre de progression qui se vide
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: COUNTDOWN_SECS * 1000,
      useNativeDriver: false,
    }).start(() => navigate());

    // Décompte
    const interval = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden={false} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

          {/* ── Haut décoratif ── */}
          <View style={styles.topSection}>
            <View style={styles.starsRow}>
              {['✦', '✦', '✦', '✦', '✦'].map((s, i) => (
                <Text key={i} style={[styles.star, i === 2 && styles.starCenter]}>{s}</Text>
              ))}
            </View>
            <Text style={styles.bismillah}>
              {'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'}
            </Text>
          </View>

          {/* ── Séparateur ── */}
          <Ornament />

          {/* ── Carte Ayat ── */}
          <View style={styles.ayatCard}>
            {/* Texte arabe avec guillemets */}
            <View style={styles.arabicContainer}>
              <Text style={styles.quoteArabic}>﴾</Text>
              <Text style={styles.arabicText}>{ayat.arabic}</Text>
              <Text style={styles.quoteArabic}>﴿</Text>
            </View>

            {/* Badge Sourate */}
            <View style={styles.surahBadge}>
              <Text style={styles.surahText}>{ayat.surah}</Text>
            </View>
          </View>

          {/* ── Séparateur ── */}
          <Ornament />

          {/* ── Bouton ── */}
          <TouchableOpacity
            style={styles.button}
            onPress={navigate}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonArabic}>بِسْمِ اللَّه</Text>
            <View style={styles.buttonSeparator} />
            <Text style={styles.buttonFrench}>Commencer</Text>
          </TouchableOpacity>

          {/* ── Barre de progression ── */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.countdownText}>
            {countdown > 0 ? `Début dans ${countdown}s` : '...'}
          </Text>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Study Partner • بِإِذْنِ اللَّه</Text>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Ornement décoratif ───────────────────────────────────────────────────────
function Ornament() {
  return (
    <View style={styles.ornamentRow}>
      <View style={styles.ornamentLine} />
      <Text style={styles.ornamentDiamond}>❖</Text>
      <View style={styles.ornamentLine} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF6E3',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
  },

  // ── Haut ──
  topSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  star: {
    fontSize: 10,
    color: '#C4A882',
  },
  starCenter: {
    fontSize: 14,
    color: '#8BAF76',
  },
  bismillah: {
    fontSize: 22,
    color: '#4A3728',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 1,
    writingDirection: 'rtl',
  },

  // ── Ornement ──
  ornamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 18,
  },
  ornamentLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8D9C0',
  },
  ornamentDiamond: {
    fontSize: 14,
    color: '#8BAF76',
    marginHorizontal: 12,
  },

  // ── Carte Ayat ──
  ayatCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0E6D2',
    shadowColor: '#4A3728',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 4,
  },
  arabicContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  quoteArabic: {
    fontSize: 32,
    color: '#8BAF76',
    fontWeight: 'bold',
    marginHorizontal: 5,
  },
  arabicText: {
    fontSize: 32,
    color: '#4A3728',
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 56,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  surahBadge: {
    backgroundColor: '#F0F8EC',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  surahText: {
    fontSize: 15,
    color: '#8BAF76',
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
  },

  // ── Bouton ──
  button: {
    backgroundColor: '#8BAF76',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#8BAF76',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 20,
  },
  buttonArabic: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  buttonSeparator: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  buttonFrench: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // ── Progression ──
  progressTrack: {
    width: '60%',
    height: 3,
    backgroundColor: '#E8D9C0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8BAF76',
    borderRadius: 2,
  },
  countdownText: {
    fontSize: 12,
    color: '#C4A882',
    marginBottom: 24,
    letterSpacing: 0.5,
  },

  // ── Footer ──
  footer: {
    marginTop: 4,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0E6D2',
    width: '100%',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#C4A882',
    letterSpacing: 1,
  },
});
