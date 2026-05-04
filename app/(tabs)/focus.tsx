import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  BackHandler, Platform, Animated, Alert, ScrollView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Audio } from 'expo-av';

// ─── Constants ────────────────────────────────────────────────────────────────
const DURATIONS = [
  { label: '25 min', seconds: 25 * 60 },
  { label: '45 min', seconds: 45 * 60 },
  { label: '60 min', seconds: 60 * 60 },
];

const GHIBLI_MESSAGES = [
  '"Avance, même doucement. C\'est déjà voler." 🍃',
  '"Chaque seconde de silence est une graine de sagesse." 🌱',
  '"La forêt murmure : tu es capable." 🌲',
  '"Même Totoro travaille dans le calme." 🐾',
  '"Comme Chihiro, transforme l\'effort en magie." ✨',
  '"Le vent porte tes rêves vers demain." 🌙',
  '"Howl construisait ses châteaux un sort à la fois." 🔮',
  '"Le courage, c\'est continuer quand c\'est difficile." 🌸',
];

// Public lofi radio stream (icecast/shoutcast MP3)
const LOFI_STREAM = 'https://stream.zeno.fm/f3wvbbqmdg8uv';

type Phase = 'setup' | 'running' | 'paused' | 'done';

// ─── Component ────────────────────────────────────────────────────────────────
export default function FocusScreen() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [durationIdx, setDurationIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATIONS[0].seconds);
  const [isMuted, setIsMuted] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [message] = useState(
    () => GHIBLI_MESSAGES[Math.floor(Math.random() * GHIBLI_MESSAGES.length)]
  );

  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  const selectedDuration = DURATIONS[durationIdx];
  const progress = 1 - timeLeft / selectedDuration.seconds;
  const isFocusing = phase === 'running' || phase === 'paused' || phase === 'done';

  // ── Audio setup on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    setupAudio();
    return () => { void teardownAll(); };
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
      });
      const { sound } = await Audio.Sound.createAsync(
        { uri: LOFI_STREAM },
        { isLooping: true, volume: 0.45, isMuted: false, shouldPlay: false }
      );
      soundRef.current = sound;
      setAudioReady(true);
    } catch (_) {
      // Stream inaccessible, continue sans audio
    }
  };

  const teardownAll = async () => {
    clearTimer();
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    await deactivateKeepAwake().catch(() => {});
  };

  // ── Timer ──────────────────────────────────────────────────────────────────
  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    clearTimer();
    if (phase !== 'running') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearTimer();
          // Délais pour laisser le state se propager
          setTimeout(() => finishSession(), 50);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return clearTimer;
  }, [phase]);

  // ── Keep awake ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'running' || phase === 'paused') {
      activateKeepAwakeAsync().catch(() => {});
    } else {
      deactivateKeepAwake().catch(() => {});
    }
  }, [phase]);

  // ── Audio play/pause ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!soundRef.current) return;
    if (phase === 'running' && !isMuted) {
      soundRef.current.playAsync().catch(() => {});
    } else {
      soundRef.current.pauseAsync().catch(() => {});
    }
  }, [phase, isMuted]);

  // ── Pulse animation ────────────────────────────────────────────────────────
  useEffect(() => {
    pulseLoop.current?.stop();
    if (phase === 'running') {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 3500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 3500, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [phase]);

  // ── Block back button during focus ─────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        if (phase === 'running' || phase === 'paused') {
          confirmExit();
          return true;
        }
        return false;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [phase])
  );

  // ── Status bar ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isFocusing) {
      StatusBar.setHidden(true, 'fade');
    } else {
      StatusBar.setHidden(false, 'fade');
    }
    return () => { StatusBar.setHidden(false, 'fade'); };
  }, [isFocusing]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const startFocus = async () => {
    setTimeLeft(selectedDuration.seconds);
    setPhase('running');

    Alert.alert(
      '🔕 Mode silencieux',
      'Pense à activer le mode silencieux sur ton téléphone pour éviter les interruptions pendant ta session.',
      [{ text: 'Compris !', style: 'default' }],
      { cancelable: true }
    );
  };

  const togglePause = () => {
    setPhase((p) => (p === 'running' ? 'paused' : 'running'));
  };

  const finishSession = async () => {
    setPhase('done');
    clearTimer();
    await deactivateKeepAwake().catch(() => {});
    if (soundRef.current) soundRef.current.pauseAsync().catch(() => {});
  };

  const exitFocus = async () => {
    if (soundRef.current) soundRef.current.pauseAsync().catch(() => {});
    clearTimer();
    setPhase('setup');
    setTimeLeft(selectedDuration.seconds);
  };

  const confirmExit = () => {
    Alert.alert(
      '⚠️ Quitter le mode Focus ?',
      'Ta session sera perdue. Es-tu sûr·e ?',
      [
        { text: 'Continuer la session', style: 'cancel' },
        { text: 'Quitter', style: 'destructive', onPress: exitFocus },
      ]
    );
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // ─── Setup Screen ─────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🌿</Text>
          <Text style={styles.title}>Mode Focus</Text>
          <Text style={styles.subtitle}>Plonge dans un océan de calme Ghibli</Text>
        </View>

        {/* Duration selector */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Durée de concentration</Text>
          <View style={styles.durationRow}>
            {DURATIONS.map((d, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.durationBtn, durationIdx === i && styles.durationBtnActive]}
                onPress={() => { setDurationIdx(i); setTimeLeft(d.seconds); }}
              >
                <Text style={[styles.durationText, durationIdx === i && styles.durationTextActive]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preview timer */}
        <View style={styles.previewContainer}>
          <View style={styles.previewRing}>
            <Text style={styles.previewTime}>{formatTime(selectedDuration.seconds)}</Text>
            <Text style={styles.previewLabel}>durée sélectionnée</Text>
          </View>
        </View>

        {/* Features list */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Ce que le mode Focus active</Text>
          {[
            { icon: 'moon-outline',          text: 'Écran toujours allumé (expo-keep-awake)' },
            { icon: 'eye-off-outline',        text: 'Plein écran immersif — barre cachée' },
            { icon: 'lock-closed-outline',    text: 'Navigation verrouillée dans l\'app' },
            { icon: 'musical-notes-outline',  text: audioReady ? 'Musique lofi prête 🎵' : 'Musique lofi (chargement...)' },
            { icon: 'volume-mute-outline',    text: 'Pense à activer le mode silencieux 🔕' },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name={f.icon as any} size={20} color="#8BAF76" />
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Start button */}
        <TouchableOpacity style={styles.startBtn} onPress={startFocus} activeOpacity={0.85}>
          <Ionicons name="leaf-outline" size={24} color="#fff" />
          <Text style={styles.startBtnText}>Démarrer la session</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          La musique lofi démarre automatiquement.{'\n'}
          Active le mode silencieux pour éviter les interruptions.
        </Text>
      </ScrollView>

      {/* ─── Focus Overlay Modal ─────────────────────────────────────────── */}
      <Modal visible={isFocusing} animationType="fade" statusBarTranslucent hardwareAccelerated>
        {phase === 'done' ? (
          /* ─ Done screen ──────────────────────────────────────────────── */
          <View style={[styles.overlay, styles.doneOverlay]}>
            <View style={styles.doneContent}>
              <Text style={styles.doneEmoji}>🌸</Text>
              <Text style={styles.doneTitle}>Session terminée !</Text>
              <Text style={styles.doneSub}>
                Tu as accompli {selectedDuration.label} de concentration.{'\n'}
                Totoro est fier de toi ! 🍃
              </Text>
              <View style={styles.doneBadge}>
                <Ionicons name="checkmark-circle" size={22} color="#8BAF76" />
                <Text style={styles.doneBadgeText}>+{selectedDuration.label} de focus</Text>
              </View>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => { setPhase('setup'); setTimeLeft(selectedDuration.seconds); }}
              >
                <Text style={styles.doneBtnText}>Nouvelle session 🌱</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ─ Running / Paused screen ──────────────────────────────────── */
          <View style={styles.overlay}>
            {/* Top bar */}
            <View style={styles.topBar}>
              {/* Mute button */}
              <TouchableOpacity style={styles.muteBtn} onPress={() => setIsMuted((m) => !m)}>
                <Ionicons
                  name={isMuted ? 'volume-mute' : 'musical-notes'}
                  size={22}
                  color={isMuted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.85)'}
                />
                <Text style={[styles.muteBtnText, isMuted && { opacity: 0.4 }]}>
                  {isMuted ? 'Son coupé' : 'Lofi ♪'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.overlayTitle}>Mode Focus 🌿</Text>

              {/* Emergency exit */}
              <TouchableOpacity style={styles.emergencyBtn} onPress={confirmExit}>
                <Ionicons name="exit-outline" size={18} color="#D48C8C" />
                <Text style={styles.emergencyText}>Urgence</Text>
              </TouchableOpacity>
            </View>

            {/* Timer ring */}
            <View style={styles.timerSection}>
              <Animated.View
                style={[styles.timerRingOuter, { transform: [{ scale: pulseAnim }] }]}
              >
                <View style={[
                  styles.timerRingInner,
                  phase === 'paused' && { borderColor: 'rgba(196,168,130,0.6)' },
                ]}>
                  <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                  <Text style={styles.timerPhaseLabel}>
                    {phase === 'running' ? '✨ Concentration' : '⏸ En pause'}
                  </Text>
                </View>
              </Animated.View>

              {/* Message Ghibli */}
              <Text style={styles.ghibliMessage}>{message}</Text>

              {/* Pause/Resume */}
              <TouchableOpacity
                style={[styles.pauseBtn, phase === 'paused' && styles.pauseBtnPaused]}
                onPress={togglePause}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={phase === 'running' ? 'pause' : 'play'}
                  size={38}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>

            {/* Progress bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
              </View>
              <Text style={styles.progressLabel}>
                {Math.round(progress * 100)}% accompli
              </Text>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Setup screen
  container: { flex: 1, backgroundColor: '#FDF6E3' },
  scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 40 },

  header: { alignItems: 'center', marginBottom: 30 },
  emoji: { fontSize: 52, marginBottom: 8 },
  title: { fontSize: 30, fontWeight: 'bold', color: '#4A3728' },
  subtitle: { fontSize: 14, color: '#8BAF76', fontWeight: '600', marginTop: 5, textAlign: 'center' },

  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: '#F0E6D2', marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardLabel: { fontSize: 13, fontWeight: 'bold', color: '#8B735B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  durationRow: { flexDirection: 'row', gap: 10 },
  durationBtn: {
    flex: 1, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E8D9C0', backgroundColor: '#FAFAFA',
  },
  durationBtnActive: { backgroundColor: '#8BAF76', borderColor: '#8BAF76' },
  durationText: { fontSize: 15, fontWeight: 'bold', color: '#8B735B' },
  durationTextActive: { color: '#fff' },

  previewContainer: { alignItems: 'center', marginBottom: 20 },
  previewRing: {
    width: 130, height: 130, borderRadius: 65, borderWidth: 3, borderColor: '#8BAF76',
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff',
  },
  previewTime: { fontSize: 26, fontWeight: 'bold', color: '#4A3728' },
  previewLabel: { fontSize: 10, color: '#C4A882', marginTop: 2 },

  featuresCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: '#F0E6D2', marginBottom: 24, gap: 14,
  },
  featuresTitle: { fontSize: 13, fontWeight: 'bold', color: '#8B735B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { fontSize: 14, color: '#4A3728', flex: 1 },

  startBtn: {
    backgroundColor: '#8BAF76', height: 62, borderRadius: 20,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12,
    shadowColor: '#8BAF76', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
    marginBottom: 16,
  },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  hint: { textAlign: 'center', fontSize: 12, color: '#C4A882', lineHeight: 18 },

  // Focus overlay
  overlay: {
    flex: 1, backgroundColor: '#0D1F0A',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 40 : 55,
    paddingBottom: 40,
  },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
  },
  muteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
  },
  muteBtnText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  overlayTitle: { fontSize: 15, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  emergencyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(212,140,140,0.12)',
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
  },
  emergencyText: { color: '#D48C8C', fontSize: 12, fontWeight: 'bold' },

  timerSection: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 32 },
  timerRingOuter: {
    width: 280, height: 280, borderRadius: 140,
    borderWidth: 2, borderColor: 'rgba(139,175,118,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  timerRingInner: {
    width: 250, height: 250, borderRadius: 125,
    borderWidth: 8, borderColor: 'rgba(139,175,118,0.9)',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  timerText: { fontSize: 62, fontWeight: 'bold', color: '#FDF6E3', letterSpacing: 3 },
  timerPhaseLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase', letterSpacing: 3, marginTop: 8,
  },

  ghibliMessage: {
    fontSize: 17, color: 'rgba(255,255,255,0.75)',
    textAlign: 'center', lineHeight: 26, fontStyle: 'italic',
    maxWidth: 290,
  },

  pauseBtn: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(139,175,118,0.2)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(139,175,118,0.7)',
  },
  pauseBtnPaused: {
    backgroundColor: 'rgba(196,168,130,0.2)',
    borderColor: 'rgba(196,168,130,0.7)',
  },

  progressSection: { gap: 10 },
  progressTrack: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#8BAF76', borderRadius: 2 },
  progressLabel: { fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', letterSpacing: 1 },

  // Done screen
  doneOverlay: { justifyContent: 'center', alignItems: 'center' },
  doneContent: { alignItems: 'center', gap: 16, paddingHorizontal: 30 },
  doneEmoji: { fontSize: 72 },
  doneTitle: { fontSize: 32, fontWeight: 'bold', color: '#FDF6E3' },
  doneSub: { fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 24 },
  doneBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(139,175,118,0.15)',
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(139,175,118,0.4)',
  },
  doneBadgeText: { color: '#8BAF76', fontWeight: 'bold', fontSize: 15 },
  doneBtn: {
    backgroundColor: '#8BAF76', height: 58, borderRadius: 18,
    paddingHorizontal: 40, justifyContent: 'center', alignItems: 'center',
    marginTop: 8,
  },
  doneBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});
