import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/GhibliTheme';

export default function QuizScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quiz IA 🧩</Text>
        <Text style={styles.subtitle}>
          Choisis un cours — Claude génère 5 questions sur mesure ✨
        </Text>
      </View>

      <TouchableOpacity style={styles.courseCard}>
        <View style={styles.courseIconContainer}>
          <Text style={styles.courseIcon}>📐</Text>
        </View>
        <View style={styles.courseInfo}>
          <Text style={styles.courseName}>BD (1)</Text>
          <View style={styles.tagContainer}>
            <Text style={styles.tagText}>📐 Mathématiques</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.howItWorksCard}>
        <Text style={styles.howItWorksTitle}>✨ Comment ça marche ?</Text>
        
        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <Text style={styles.stepIcon}>📚</Text>
            <Text style={styles.stepText}>Tu choisis un cours</Text>
          </View>
          
          <View style={styles.step}>
            <Text style={styles.stepIcon}>🤖</Text>
            <Text style={styles.stepText}>Claude analyse et génère 5 questions</Text>
          </View>
          
          <View style={styles.step}>
            <Text style={styles.stepIcon}>🏆</Text>
            <Text style={styles.stepText}>Tu réponds et vois ton score</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2', // Beige plus clair correspondant à l'image
    padding: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A3E3D', // Marron foncé
    marginBottom: 10,
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 16,
    color: '#8A7F7C', // Marron clair
    lineHeight: 24,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0EBE1',
  },
  courseIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#EEF2FF', // Bleu très clair
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  courseIcon: {
    fontSize: 28,
  },
  courseInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3E3D',
    marginBottom: 8,
  },
  tagContainer: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  tagText: {
    color: '#5C7CFA', // Bleu texte
    fontSize: 12,
    fontWeight: '600',
  },
  howItWorksCard: {
    backgroundColor: '#F0FDF4', // Vert très clair
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  howItWorksTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ADE80', // Vert soutenu
    marginBottom: 20,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  step: {
    flex: 1,
    minWidth: 90,
    alignItems: 'center',
    paddingHorizontal: 5,
    marginBottom: 15,
  },
  stepIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  stepText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  }
});
