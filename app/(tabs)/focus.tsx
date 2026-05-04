import { Ionicons } from '@expo/vector-icons';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

// Palette Ghibli
const GHIBLI_COLORS = {
  background: '#FDF6E3', // Beige
  primary: '#8BAF76',    // Vert
  text: '#4A3728',       // Marron
  accent: '#C4A882',     // Sable
  danger: '#D48C8C',     // Rouge doux
};

const MESSAGES = [
  'Le vent murmure : tu peux le faire... 🌿',
  'Même les forêts silencieuses vibrent de sagesse. 🌳',
  'Chaque seconde d\'effort est une graine plantée. 🌱',
  'Tu avances, même quand tu ne t\'en rends pas compte. ✨',
  'Le calme est la force de l\'apprentissage. 🍃',
  'La magie opère dans le silence de ton travail. 🔮',
  'Comme un voyageur dans la forêt, reste concentré sur ton chemin. 🌸',
];

const DURATIONS = [25, 45, 60];

export default function FocusScreen() {
  const { isDark } = useTheme();
  const [duration, setDuration] = useState(25);
  const [isActive, setIsActive] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [msgIdx, setMsgIdx] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Gestion du Timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isRunning || !isActive || timeLeft <= 0) {
      if (timeLeft === 0 && isActive) void finishSession();
      return;
    }
    timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, isActive, timeLeft]);

  // ── Fonctions de contrôle ──────────────────────────────────────────────────
  const startFocus = async () => {
    // 1. Plein écran immersif
    StatusBar.setHidden(true, 'fade');

    // 2. Empêcher la mise en veille
    try {
      await activateKeepAwakeAsync();
    } catch (e) {}

    // Reset du timer et activation
    setTimeLeft(duration * 60);
    setMsgIdx(Math.floor(Math.random() * MESSAGES.length));
    setIsRunning(true);
    setIsActive(true);
  };

  const teardown = useCallback(async () => {
    StatusBar.setHidden(false, 'fade');
    setIsActive(false);
    setIsRunning(false);
    try {
      await deactivateKeepAwake();
    } catch (e) {}
  }, []);

  const finishSession = useCallback(async () => {
    await teardown();
    
    // Notification de fin via Alert (Compatible Expo Go SDK 53)
    Alert.alert(
      '🌿 Voyage terminé !',
      'Félicitations ! Tu as complété ta session de concentration avec succès. ✨',
      [{ text: 'Super !', onPress: () => {} }]
    );
  }, [teardown]);

  const handleEmergencyStop = () => {
    Alert.alert(
      '⚠️ Quitter le mode Focus ?',
      'Ta concentration est précieuse, es-tu sûr de vouloir t\'interrompre ?',
      [
        { text: 'Rester', style: 'cancel' },
        { text: 'Quitter', style: 'destructive', onPress: teardown },
      ]
    );
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const progress = Math.max(0, 1 - timeLeft / (duration * 60));

  return (
    <View style={[styles.container, { backgroundColor: GHIBLI_COLORS.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: GHIBLI_COLORS.text }]}>Focus Ghibli 🌿</Text>
          <Text style={[styles.subtitle, { color: GHIBLI_COLORS.primary }]}>Plonge dans un océan de calme</Text>
        </View>

        <View style={[styles.card, { borderColor: GHIBLI_COLORS.accent + '40' }]}>
          <Text style={[styles.cardLabel, { color: GHIBLI_COLORS.text }]}>Durée de concentration</Text>
          <View style={styles.durationRow}>
            {DURATIONS.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.durationBtn, duration === d && { backgroundColor: GHIBLI_COLORS.primary, borderColor: GHIBLI_COLORS.primary }]}
                onPress={() => { setDuration(d); setTimeLeft(d * 60); }}
              >
                <Text style={[styles.durationText, { color: duration === d ? '#fff' : GHIBLI_COLORS.text }]}>{d} min</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.infoBox}>
          {[
            { icon: 'notifications-off-outline', text: 'Distractions bloquées' },
            { icon: 'moon-outline', text: 'Écran toujours allumé' },
            { icon: 'eye-off-outline', text: 'Plein écran immersif' },
            { icon: 'lock-closed-outline', text: 'Navigation verrouillée' },
          ].map((item, i) => (
            <View key={i} style={styles.infoRow}>
              <Ionicons name={item.icon as any} size={22} color={GHIBLI_COLORS.primary} />
              <Text style={[styles.infoText, { color: GHIBLI_COLORS.text }]}>{item.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.startBtn, { backgroundColor: GHIBLI_COLORS.primary }]} onPress={startFocus}>
          <Ionicons name="leaf-outline" size={24} color="#fff" />
          <Text style={styles.startBtnText}>Démarrer la session</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Overlay qui bloque la navigation */}
      <Modal visible={isActive} animationType="fade" statusBarTranslucent>
        <View style={[styles.focusOverlay, { backgroundColor: '#1A2618' }]}>
          <View style={styles.overlayHeader}>
            <View style={{ width: 50 }} />
            <TouchableOpacity style={styles.emergencyBtn} onPress={handleEmergencyStop}>
              <Ionicons name="exit-outline" size={20} color={GHIBLI_COLORS.danger} />
              <Text style={styles.emergencyText}>Urgence</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timerContainer}>
            <View style={[styles.timerRing, { borderColor: GHIBLI_COLORS.primary + '30' }]}>
              <View style={[styles.timerInner, { borderColor: GHIBLI_COLORS.primary }]}>
                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                <Text style={styles.timerSubText}>{isRunning ? 'Concentration...' : 'En pause'}</Text>
              </View>
            </View>

            <Text style={styles.ghibliMessage}>{MESSAGES[msgIdx]}</Text>

            <TouchableOpacity style={styles.pauseBtn} onPress={() => setIsRunning(!isRunning)}>
              <Ionicons name={isRunning ? "pause" : "play"} size={40} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: GHIBLI_COLORS.primary }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress * 100)}% complété</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 25, paddingTop: 60 },
  header: { marginBottom: 35 },
  title: { fontSize: 32, fontWeight: 'bold' },
  subtitle: { fontSize: 16, fontWeight: '600', marginTop: 5 },
  card: { backgroundColor: '#fff', borderRadius: 25, padding: 22, borderWidth: 1, marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 18 },
  durationRow: { flexDirection: 'row', gap: 12 },
  durationBtn: { flex: 1, height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  durationText: { fontSize: 16, fontWeight: 'bold' },
  infoBox: { gap: 18, marginBottom: 40, paddingHorizontal: 5 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  infoText: { fontSize: 16, fontWeight: '500' },
  startBtn: { height: 65, borderRadius: 22, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  startBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  focusOverlay: { flex: 1, padding: 30, justifyContent: 'space-between' },
  overlayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20 },
  emergencyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(212,140,140,0.15)', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20 },
  emergencyText: { color: '#D48C8C', fontWeight: 'bold' },
  timerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  timerRing: { width: 290, height: 290, borderRadius: 145, borderWidth: 2, padding: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  timerInner: { width: '100%', height: '100%', borderRadius: 130, borderWidth: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  timerText: { fontSize: 68, fontWeight: 'bold', color: '#FDF6E3', letterSpacing: 4 },
  timerSubText: { fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 3, marginTop: 10 },
  ghibliMessage: { fontSize: 19, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 30, fontStyle: 'italic', marginBottom: 45, maxWidth: 300 },
  pauseBtn: { width: 85, height: 85, borderRadius: 42.5, backgroundColor: 'rgba(139,175,118,0.25)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#8BAF76' },
  progressSection: { width: '100%', paddingBottom: 20 },
  progressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', letterSpacing: 1 },
});
