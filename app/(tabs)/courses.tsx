import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Colors } from '@/constants/GhibliTheme';
import { Ionicons } from '@expo/vector-icons';

const COURSES = [
  { id: '1', title: 'Magie Botanique', category: 'Nature', icon: 'leaf', color: '#E8F5E9' },
  { id: '2', title: 'Histoire des Esprits', category: 'Histoire', icon: 'book', color: '#FFF9DB' },
  { id: '3', title: 'Alchimie Avancée', category: 'Sciences', icon: 'flask', color: '#F3E5F5' },
  { id: '4', title: 'Théorie des Sorts', category: 'Théorie', icon: 'sparkles', color: '#E3F2FD' },
];

export default function CoursesScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mes Grimoires 📚</Text>
          <Text style={styles.subtitle}>Gère tes connaissances et tes cours</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Nouveau Grimoire</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {COURSES.map((course) => (
          <TouchableOpacity key={course.id} style={styles.courseCard}>
            <View style={[styles.iconContainer, { backgroundColor: course.color }]}>
              <Ionicons name={course.icon as any} size={30} color="#4A3728" />
            </View>
            <View style={styles.courseInfo}>
              <Text style={styles.courseCategory}>{course.category}</Text>
              <Text style={styles.courseTitle}>{course.title}</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '45%' }]} />
                </View>
                <Text style={styles.progressText}>45% complété</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F6F0',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    flexWrap: 'wrap',
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A3728',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  subtitle: {
    fontSize: 14,
    color: '#8B735B',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#8BAF76',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#8BAF76',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  courseCard: {
    backgroundColor: '#fff',
    width: Platform.OS === 'web' ? '48%' : '100%',
    minWidth: 300,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#F0E6D2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseInfo: {
    flex: 1,
  },
  courseCategory: {
    fontSize: 12,
    color: '#8BAF76',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3728',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#F2E8D5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8BAF76',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: '#8B735B',
    fontWeight: '600',
  },
});
