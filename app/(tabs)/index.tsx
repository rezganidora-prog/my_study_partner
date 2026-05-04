import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Colors } from '@/constants/GhibliTheme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const userName = user?.email?.split('@')[0] || 'Explorateur';

  return (
    <View style={styles.container}>
      {/* Icône de feuille flottante discrète */}
      <View style={styles.floatingLeaf}>
        <Ionicons name="leaf-outline" size={120} color="rgba(139, 175, 118, 0.08)" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Salut, <Text style={styles.name}>{userName}</Text> ✨</Text>
            <Text style={styles.subtitle}>Le voyage d'aujourd'hui commence ici 🌿</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <View style={styles.statIconHeader}>
              <Ionicons name="pizza-outline" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>0</Text>
            </View>
            <Text style={styles.statLabel}>Pomodoro</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <View style={styles.statIconHeader}>
              <Ionicons name="alarm-outline" size={24} color="#2196F3" />
              <Text style={styles.statValue}>0h</Text>
            </View>
            <Text style={styles.statLabel}>Heures</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <View style={styles.statIconHeader}>
              <Ionicons name="flame-outline" size={24} color="#FF9800" />
              <Text style={styles.statValue}>0</Text>
            </View>
            <Text style={styles.statLabel}>Série</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
            <View style={styles.statIconHeader}>
              <Ionicons name="school-outline" size={24} color="#9C27B0" />
              <Text style={styles.statValue}>0</Text>
            </View>
            <Text style={styles.statLabel}>Questions</Text>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>✨ Actions rapides</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#FFF0F0' }]}>
                <Ionicons name="pizza-outline" size={24} color="#FF5252" />
              </View>
              <Text style={styles.actionTitle}>Focus</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#F0F4FF' }]}>
                <Ionicons name="calendar-outline" size={24} color="#5C7CFA" />
              </View>
              <Text style={styles.actionTitle}>Timeline</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#FFF9DB' }]}>
                <Ionicons name="headset-outline" size={24} color="#FAB005" />
              </View>
              <Text style={styles.actionTitle}>Hibou</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Text style={{ fontSize: 24 }}>🌸</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>Conseil du jour</Text>
              <Text style={styles.tipText}>
                25 min de focus + 5 min de pause. Ton cerveau a besoin de cycles pour fleurir 🌿
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F6F0',
  },
  floatingLeaf: {
    position: 'absolute',
    top: -20,
    right: -20,
    zIndex: 0,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 80 : 70,
  },
  header: {
    marginBottom: 24,
    zIndex: 1,
  },
  greeting: {
    fontSize: 26,
    color: '#4A3728',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  name: {
    fontWeight: 'bold',
    color: '#8BAF76',
  },
  subtitle: {
    fontSize: 14,
    color: '#8B735B',
    marginTop: 4,
    opacity: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statIconHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3728',
  },
  statLabel: {
    fontSize: 11,
    color: '#8B735B',
    marginTop: 6,
    fontWeight: 'bold',
  },
  actionsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3728',
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionCard: {
    backgroundColor: '#fff',
    flex: 1,
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#F0E6D2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4A3728',
  },
  tipCard: {
    backgroundColor: '#F0FBFF',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E1F5FE',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#4A3728',
    lineHeight: 20,
    opacity: 0.8,
  },
});
