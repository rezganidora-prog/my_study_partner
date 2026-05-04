import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/GhibliTheme';

const { width } = Dimensions.get('window');

export default function TimelineScreen() {
  const [currentMonth, setCurrentMonth] = useState('Mai 2026');

  // Days of the week
  const daysOfWeek = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
  
  // Generating a simple calendar grid for May 2026 (starts on a Friday)
  // For demo purposes, we just generate an array of days.
  const emptyDays = [1, 2, 3, 4]; // Padding before day 1 (May 1 2026 is Friday)
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ma Timeline 🗓️</Text>
        <Text style={styles.subtitle}>
          Planifie tes sessions comme les saisons qui passent 🍃
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🗓️</Text>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Jours d'étude</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⏱️</Text>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Minutes totales</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>✅</Text>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
      </View>

      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity style={styles.arrowButton}>
            <Ionicons name="chevron-back" size={20} color="#8A7F7C" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{currentMonth}</Text>
          <TouchableOpacity style={styles.arrowButton}>
            <Ionicons name="chevron-forward" size={20} color="#8A7F7C" />
          </TouchableOpacity>
        </View>

        <View style={styles.daysRow}>
          {daysOfWeek.map((day, index) => (
            <Text key={index} style={styles.dayOfWeek}>{day}</Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {emptyDays.map((_, index) => (
            <View key={`empty-${index}`} style={styles.dayCell} />
          ))}
          {days.map((day) => (
            <View key={day} style={[styles.dayCell, day === 3 && styles.activeDayCell]}>
              <Text style={[styles.dayNumber, day === 3 && styles.activeDayNumber]}>
                {day}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    padding: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A3E3D',
    marginBottom: 10,
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 16,
    color: '#8BAF76', // Vert doux
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0EBE1',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4A3E3D',
  },
  statLabel: {
    fontSize: 11,
    color: '#8A7F7C',
    marginTop: 5,
    textAlign: 'center',
  },
  calendarContainer: {
    backgroundColor: '#FDFBF7',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEAE0',
    overflow: 'hidden',
    marginBottom: 40,
  },
  calendarHeader: {
    backgroundColor: '#EAE1D2', // Couleur du header du calendrier
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  arrowButton: {
    backgroundColor: '#FFFFFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3E3D',
  },
  daysRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEAE0',
  },
  dayOfWeek: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 15,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#A09794',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 100% / 7
    aspectRatio: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EFEAE0',
    padding: 5,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A3E3D',
  },
  activeDayCell: {
    // Si on veut mettre un style sur la cellule, sinon juste le cercle
  },
  activeDayNumber: {
    backgroundColor: '#8BAF76',
    color: '#FFFFFF',
    width: 26,
    height: 26,
    borderRadius: 13,
    textAlign: 'center',
    lineHeight: 26,
    alignSelf: 'flex-end', // Aligné en haut à droite comme dans la maquette
  }
});
