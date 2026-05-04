import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions, ScrollView, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type TimerMode = 'focus' | 'short' | 'long';

export default function PomodoroScreen() {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [isActive, setIsActive] = useState(false);
  const [sessionsDone, setSessionsDone] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  // Temps personnalisés (en minutes)
  const [customTimes, setCustomTimes] = useState({
    focus: 25,
    short: 5,
    long: 15
  });

  const [timeLeft, setTimeLeft] = useState(customTimes.focus * 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const modeConfig = {
    focus: { color: '#FF5252', icon: 'pizza-outline', label: 'Focus' },
    short: { color: '#4FC3F7', icon: 'water-outline', label: 'Pause' },
    long: { color: '#F06292', icon: 'flower-outline', label: 'Longue' },
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, timeLeft]);

  const handleComplete = () => {
    setIsActive(false);
    if (mode === 'focus') {
      const nextSessions = (sessionsDone + 1) % 4;
      setSessionsDone(nextSessions);
      if (nextSessions === 0) {
        switchMode('long');
      } else {
        switchMode('short');
      }
    } else {
      switchMode('focus');
    }
  };

  const switchMode = (newMode: TimerMode) => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(customTimes[newMode] * 60);
  };

  const updateTime = (m: TimerMode, val: string) => {
    const num = parseInt(val) || 1;
    setCustomTimes(prev => ({ ...prev, [m]: num }));
    if (mode === m) setTimeLeft(num * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Onglets du haut */}
        <View style={styles.tabsContainer}>
          {(['focus', 'short', 'long'] as TimerMode[]).map(m => (
            <TouchableOpacity 
              key={m} 
              style={[styles.tab, mode === m && { backgroundColor: modeConfig[m].color + '15', borderColor: modeConfig[m].color }]}
              onPress={() => switchMode(m)}
            >
              <Ionicons name={modeConfig[m].icon as any} size={20} color={modeConfig[m].color} />
              <Text style={[styles.tabText, { color: mode === m ? modeConfig[m].color : '#8B735B' }]}>{modeConfig[m].label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Carte du minuteur principal */}
        <View style={styles.timerCard}>
          <View style={styles.settingsHeader}>
            <TouchableOpacity onPress={() => setShowSettings(true)}>
              <Ionicons name="settings-outline" size={24} color="#C4A882" />
            </TouchableOpacity>
          </View>

          <View style={styles.timerCircleOuter}>
            <View style={[styles.timerCircleInner, { borderColor: modeConfig[mode].color }]}>
              <Ionicons name={modeConfig[mode].icon as any} size={36} color={modeConfig[mode].color} />
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
              <Text style={styles.modeLabel}>{modeConfig[mode].label}</Text>
            </View>
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.smallControl} onPress={() => setTimeLeft(customTimes[mode] * 60)}>
              <Ionicons name="refresh" size={24} color="#8B735B" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.mainControl} onPress={() => setIsActive(!isActive)}>
              <Ionicons name={isActive ? "pause" : "play"} size={32} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.smallControl} onPress={handleComplete}>
              <Ionicons name="play-skip-forward" size={24} color="#8B735B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistiques des sessions */}
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="leaf-outline" size={20} color="#8BAF76" />
              <Text style={styles.statsTitle}>Sessions complétées</Text>
            </View>
            <Text style={styles.statsCount}>{sessionsDone}/4</Text>
          </View>
          
          <View style={styles.progressBars}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={[styles.barBase, i < sessionsDone && styles.barFilled]} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* MODAL DE RÉGLAGES */}
      <Modal visible={showSettings} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Réglages du temps ✨</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={24} color="#4A3728" />
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Focus (min)</Text>
              <TextInput 
                style={styles.settingInput} 
                keyboardType="numeric" 
                value={customTimes.focus.toString()}
                onChangeText={(v) => updateTime('focus', v)}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Petite Pause (min)</Text>
              <TextInput 
                style={styles.settingInput} 
                keyboardType="numeric" 
                value={customTimes.short.toString()}
                onChangeText={(v) => updateTime('short', v)}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Grande Pause (min)</Text>
              <TextInput 
                style={styles.settingInput} 
                keyboardType="numeric" 
                value={customTimes.long.toString()}
                onChangeText={(v) => updateTime('long', v)}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={() => setShowSettings(false)}>
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  scrollContent: { padding: 20, alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  tabsContainer: { flexDirection: 'row', gap: 12, marginBottom: 30, width: '100%', justifyContent: 'center' },
  tab: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1.5, borderColor: '#F0E6D2', gap: 8 },
  tabText: { fontSize: 14, fontWeight: 'bold' },
  timerCard: { backgroundColor: '#fff', width: '100%', maxWidth: 380, borderRadius: 30, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: '#F0E6D2', marginBottom: 20 },
  settingsHeader: { width: '100%', alignItems: 'flex-end', marginBottom: 10 },
  timerCircleOuter: { width: 200, height: 200, borderRadius: 100, borderWidth: 1, borderColor: '#F0E6D2', padding: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  timerCircleInner: { width: '100%', height: '100%', borderRadius: 90, borderWidth: 8, justifyContent: 'center', alignItems: 'center' },
  timerText: { fontSize: 42, fontWeight: 'bold', color: '#4A3728', marginVertical: 4 },
  modeLabel: { fontSize: 12, color: '#8B735B', fontWeight: '600', textTransform: 'uppercase' },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 25 },
  mainControl: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#8BAF76', justifyContent: 'center', alignItems: 'center' },
  smallControl: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F9F6F0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F0E6D2' },
  statsCard: { backgroundColor: '#fff', width: '100%', maxWidth: 380, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F0E6D2', marginBottom: 20 },
  statsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  statsTitle: { fontSize: 14, fontWeight: 'bold', color: '#4A3728' },
  statsCount: { fontSize: 20, fontWeight: 'bold', color: '#8BAF76' },
  progressBars: { flexDirection: 'row', gap: 8 },
  barBase: { flex: 1, height: 8, backgroundColor: '#F2E8D5', borderRadius: 4 },
  barFilled: { backgroundColor: '#8BAF76' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '85%', borderRadius: 25, padding: 25, borderWidth: 1, borderColor: '#F0E6D2' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#4A3728' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  settingLabel: { fontSize: 16, color: '#8B735B', fontWeight: '600' },
  settingInput: { backgroundColor: '#F9F6F0', width: 70, height: 45, borderRadius: 12, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#4A3728', borderWidth: 1, borderColor: '#F0E6D2' },
  saveButton: { backgroundColor: '#8BAF76', height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
