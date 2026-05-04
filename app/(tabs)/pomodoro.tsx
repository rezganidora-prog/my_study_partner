import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Colors } from '@/constants/GhibliTheme';
import { Ionicons } from '@expo/vector-icons';

export default function PomodoroScreen() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        }
        if (seconds === 0) {
          if (minutes === 0) {
            clearInterval(interval!);
            setIsActive(false);
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        }
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, seconds, minutes]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.tab, styles.activeTab]}>
          <Text style={styles.activeTabText}>🍅 Temps de focus</Text>
        </View>
        <View style={styles.tab}>
          <Text style={styles.tabText}>☕ Petite pause</Text>
        </View>
        <View style={styles.tab}>
          <Text style={styles.tabText}>🌸 Grande pause</Text>
        </View>
      </View>

      <View style={styles.timerContainer}>
        <View style={styles.outerCircle}>
          <View style={styles.innerCircle}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>🍅</Text>
            <Text style={styles.timerText}>
              {minutes < 10 ? `0${minutes}` : minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </Text>
            <Text style={styles.statusLabel}>Temps de focus</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.iconButton} onPress={() => { setMinutes(25); setSeconds(0); setIsActive(false); }}>
            <Ionicons name="refresh-outline" size={28} color="#8B735B" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.playButton} 
            onPress={() => setIsActive(!isActive)}
          >
            <Ionicons name={isActive ? "pause" : "play"} size={32} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="arrow-forward-outline" size={28} color="#8B735B" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 20 }}>🌱</Text>
            <Text style={styles.progressTitle}>Sessions complétées</Text>
          </View>
          <Text style={styles.progressCount}>0</Text>
        </View>
        
        <View style={styles.dotsRow}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.dot} />
          ))}
        </View>
        
        <Text style={styles.progressHint}>🍃 4 session(s) avant la grande pause</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F6F0',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 50,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0E6D2',
  },
  activeTab: {
    backgroundColor: '#E8F5E9',
    borderColor: '#8BAF76',
  },
  tabText: {
    color: '#8B735B',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  timerContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#F0E6D2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 40,
  },
  outerCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
    borderColor: '#F2E8D5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  innerCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#4A3728',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  statusLabel: {
    fontSize: 16,
    color: '#C4A882',
    marginTop: 5,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0E6D2',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#8BAF76',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8BAF76',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  progressCard: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 450,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0E6D2',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A3728',
  },
  progressCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8BAF76',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },
  dot: {
    flex: 1,
    height: 8,
    backgroundColor: '#F2E8D5',
    borderRadius: 4,
  },
  progressHint: {
    fontSize: 13,
    color: '#8BAF76',
    fontWeight: '600',
  },
});
