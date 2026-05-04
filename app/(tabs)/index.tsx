import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    streak: 0,
    hours: 0,
    courses: 0,
    quizzes: 0
  });

  useEffect(() => {
    fetchRealStats();
  }, []);

  const fetchRealStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch Profile (Streak & Hours)
      const { data: profile } = await supabase.from('profiles').select('streak, study_hours').eq('id', user.id).single();
      
      // Fetch Courses count
      const { count: courseCount } = await supabase.from('courses').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      
      // Fetch Tasks count (as a proxy for quizzes for now)
      const { count: taskCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

      setStats({
        streak: profile?.streak || 0,
        hours: profile?.study_hours || 0,
        courses: courseCount || 0,
        quizzes: taskCount || 0
      });
    } catch (error) {
      console.log('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const actions = [
    { id: 'focus', title: 'Mode Focus', icon: 'eye-off-outline', color: '#D1FFD7', route: '/focus' },
    { id: 'pomodoro', title: 'Pomodoro', icon: 'timer-outline', color: '#FFD1D1', route: '/pomodoro' },
    { id: 'courses', title: 'Mes Cours', icon: 'book-outline', color: '#D1E8FF', route: '/courses' },
    { id: 'chatbot', title: 'Assistant IA', icon: 'headset-outline', color: '#FFF4D1', route: '/chatbot' },
  ];

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#8BAF76" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header Area */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour ✨</Text>
          <Text style={styles.subtitle}>{"Ton aventure magique continue..."}</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/profile')}>
          <Ionicons name="person-circle-outline" size={36} color="#8B735B" />
        </TouchableOpacity>
      </View>

      {/* Stats Row (4 blocks) */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={styles.statVal}>{stats.streak}</Text>
          <Text style={styles.statLab}>Série</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>⏱️</Text>
          <Text style={styles.statVal}>{stats.hours}h</Text>
          <Text style={styles.statLab}>Étude</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>📚</Text>
          <Text style={styles.statVal}>{stats.courses}</Text>
          <Text style={styles.statLab}>Cours</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>🏆</Text>
          <Text style={styles.statVal}>{stats.quizzes}</Text>
          <Text style={styles.statLab}>Défis</Text>
        </View>
      </View>

      {/* Main Actions Grid (2x2) */}
      <Text style={styles.sectionTitle}>Que souhaites-tu accomplir ?</Text>
      <View style={styles.grid}>
        {actions.map((action) => (
          <TouchableOpacity 
            key={action.id} 
            style={[styles.actionCard, { backgroundColor: action.color }]}
            onPress={() => router.push(action.route as any)}
          >
            <View style={styles.iconCircle}>
              <Ionicons name={action.icon as any} size={24} color="#4A3728" />
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Ionicons name="arrow-forward-circle" size={20} color="#4A372840" style={styles.arrow} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Timeline Quick View */}
      <TouchableOpacity style={styles.timelineCard} onPress={() => router.push('/timeline')}>
        <View style={styles.timelineInfo}>
          <Ionicons name="calendar-outline" size={24} color="#8BAF76" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.timelineTitle}>Ma Timeline</Text>
            <Text style={styles.timelineSub}>Vérifie ton programme du jour</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#C4A882" />
      </TouchableOpacity>

      {/* Conseil du Jour at the Bottom (as a Reminder) */}
      <View style={styles.tipCard}>
        <View style={styles.tipHeader}>
          <Ionicons name="bulb-outline" size={20} color="#8BAF76" />
          <Text style={styles.tipTitle}>Rappel du jour</Text>
        </View>
        <Text style={styles.tipText}>
          {"\"Le voyage le plus long commence toujours par un petit pas. Fais une pause de 5 min toutes les 25 min d'étude.\" 🌿"}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  scrollContent: { padding: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#4A3728', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  subtitle: { fontSize: 14, color: '#8BAF76', fontWeight: '600' },
  profileBtn: { padding: 4 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#F0E6D2' },
  statIcon: { fontSize: 18, marginBottom: 4 },
  statVal: { fontSize: 16, fontWeight: 'bold', color: '#4A3728' },
  statLab: { fontSize: 10, color: '#8B735B', textTransform: 'uppercase' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#4A3728', marginBottom: 15, marginLeft: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  actionCard: { width: CARD_WIDTH, height: 120, borderRadius: 24, padding: 16, justifyContent: 'space-between', borderWidth: 1, borderColor: '#00000008' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff90', justifyContent: 'center', alignItems: 'center' },
  actionTitle: { fontSize: 16, fontWeight: 'bold', color: '#4A3728' },
  arrow: { position: 'absolute', bottom: 16, right: 16 },

  timelineCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#F0E6D2', marginBottom: 30 },
  timelineInfo: { flexDirection: 'row', alignItems: 'center' },
  timelineTitle: { fontSize: 16, fontWeight: 'bold', color: '#4A3728' },
  timelineSub: { fontSize: 12, color: '#8B735B' },

  tipCard: { backgroundColor: '#FDF6E3', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#E8D9C0', borderStyle: 'dashed' },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tipTitle: { fontSize: 14, fontWeight: 'bold', color: '#8BAF76' },
  tipText: { fontSize: 12, color: '#8B735B', fontStyle: 'italic', lineHeight: 18 },
});
