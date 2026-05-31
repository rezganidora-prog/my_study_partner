import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Shadows, Spacing } from '@/constants/GhibliTheme';
import { useRouter } from 'expo-router';
import { usePomodoro, TimerMode } from '@/context/PomodoroContext';

const { width } = Dimensions.get('window');
const TIMER_SIZE = width * 0.75;

export default function PomodoroScreen() {
  const router = useRouter();
  const {
    mode,
    isActive,
    timeLeft,
    sessionsDone,
    toggleTimer,
    resetTimer,
    skipTimer,
    switchMode,
    formatTime,
    config,
  } = usePomodoro();

  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const totalTime = config[mode].minutes * 60;
    Animated.timing(progressAnim, {
      toValue: timeLeft / totalTime,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [timeLeft, mode]);

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color={Colors.brown} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.modeTitle}>{config[mode].label}</Text>
        <Text style={styles.sessionCount}>Session {sessionsDone + 1} de 4</Text>
      </View>

      {/* Main Timer Display */}
      <View style={styles.timerContainer}>
        <View style={[styles.outerCircle, { borderColor: Colors.white }]}>
          <Animated.View
            style={[
              styles.innerCircle,
              {
                borderColor: config[mode].color,
                opacity: progressAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] })
              }
            ]}
          >
            <Ionicons name={config[mode].icon as any} size={32} color={config[mode].color} style={styles.timerIcon} />
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </Animated.View>
        </View>
      </View>

      {/* Mode Switcher (Tab-like) */}
      <View style={styles.modeSwitcher}>
        {(['focus', 'short', 'long'] as TimerMode[]).map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => switchMode(m)}
            style={[styles.modeTab, mode === m && { backgroundColor: config[m].color + '15' }]}
          >
            <Text style={[styles.modeTabText, { color: mode === m ? config[m].color : Colors.tan }]}>
              {config[m].label}
            </Text>
            {mode === m && <View style={[styles.activeDot, { backgroundColor: config[m].color }]} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={resetTimer}
        >
          <Ionicons name="refresh" size={24} color={Colors.brown} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.mainBtn} onPress={toggleTimer}>
          <View style={[styles.mainBtnInner, { backgroundColor: config[mode].color }]}>
            <Ionicons name={isActive ? "pause" : "play"} size={36} color="white" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={skipTimer}>
          <Ionicons name="play-skip-forward" size={24} color={Colors.brown} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.beige, alignItems: 'center', paddingHorizontal: 20 },
  backButton: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 20, zIndex: 10 },

  header: { marginTop: Platform.OS === 'ios' ? 120 : 100, alignItems: 'center', marginBottom: 40 },
  modeTitle: { fontSize: 28, fontWeight: 'bold', color: Colors.brown, letterSpacing: 1 },
  sessionCount: { fontSize: 14, color: Colors.tan, fontWeight: '600', marginTop: 5, textTransform: 'uppercase' },

  timerContainer: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.large,
  },
  outerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: TIMER_SIZE / 2,
    backgroundColor: Colors.white,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)'
  },
  innerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: (TIMER_SIZE - 30) / 2,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerIcon: { marginBottom: 10 },
  timerText: { fontSize: 60, fontWeight: '300', color: Colors.brown, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  modeSwitcher: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 20, padding: 5, marginTop: 50, marginBottom: 40 },
  modeTab: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 15, alignItems: 'center' },
  modeTabText: { fontSize: 13, fontWeight: '700' },
  activeDot: { width: 4, height: 4, borderRadius: 2, marginTop: 4 },

  controls: { flexDirection: 'row', alignItems: 'center', gap: 30 },
  mainBtn: { padding: 10 },
  mainBtnInner: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', ...Shadows.medium },
  secondaryBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', ...Shadows.small },
});
