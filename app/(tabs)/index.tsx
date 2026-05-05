import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Shadows, Spacing } from '@/constants/GhibliTheme';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    streak: 0,
    hours: 0,
    courses: 0,
    xp: 0,
    level: 1
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(profile);
      
      const { count: courseCount } = await supabase.from('courses').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

      setStats(prev => ({
        ...prev,
        streak: profile?.streak || 0,
        hours: profile?.study_hours || 0,
        courses: courseCount || 0,
        xp: profile?.xp || 0,
        level: profile?.level || 1,
      }));
    } catch (error) {
      console.log('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.green} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Level & XP */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {userProfile?.full_name?.split(' ')[0] || 'Aventurier'} ✨</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Niveau {stats.level}</Text>
            <View style={styles.xpBarContainer}>
              <View style={[styles.xpBarFill, { width: '65%' }]} />
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => handlePress('/profile')}>
          <View style={styles.avatarContainer}>
            <Text style={{fontSize: 24}}>🍃</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Main CTA: Commencer une session */}
      <TouchableOpacity
        style={styles.mainCTA}
        onPress={() => handlePress('/pomodoro')}
        activeOpacity={0.9}
      >
        <View style={styles.ctaContent}>
          <View>
            <Text style={styles.ctaTitle}>Prêt pour l'étude ?</Text>
            <Text style={styles.ctaSubtitle}>Lance une session Pomodoro</Text>
          </View>
          <View style={styles.ctaIconCircle}>
            <Ionicons name="play" size={28} color={Colors.green} />
          </View>
        </View>
      </TouchableOpacity>

      {/* Quick Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statItem, { backgroundColor: '#FFF5E6' }]}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={styles.statValue}>{stats.streak}</Text>
          <Text style={styles.statLabel}>Jours</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: '#E0F2F1' }]}>
          <Text style={styles.statEmoji}>⏱️</Text>
          <Text style={styles.statValue}>{stats.hours}h</Text>
          <Text style={styles.statLabel}>Focus</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: '#E3F2FD' }]}>
          <Text style={styles.statEmoji}>📚</Text>
          <Text style={styles.statValue}>{stats.courses}</Text>
          <Text style={styles.statLabel}>Cours</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: '#F3E5F5' }]}>
          <Text style={styles.statEmoji}>🏆</Text>
          <Text style={styles.statValue}>{stats.xp}</Text>
          <Text style={styles.statLabel}>XP Total</Text>
        </View>
      </View>

      {/* Features Grid */}
      <Text style={styles.sectionTitle}>Tes outils d'apprentissage</Text>
      <View style={styles.grid}>
        <FeatureCard
          title="Assistant IA"
          subtitle="Pose tes questions"
          icon="sparkles"
          color="#FDF2F8"
          iconColor="#DB2777"
          onPress={() => handlePress('/chatbot')}
        />
        <FeatureCard
          title="Mes Cours"
          subtitle={stats.courses + " matières"}
          icon="book"
          color="#EFF6FF"
          iconColor="#2563EB"
          onPress={() => handlePress('/courses')}
        />
        <FeatureCard
          title="Timeline"
          subtitle="Planning du jour"
          icon="calendar"
          color="#F0FDF4"
          iconColor="#16A34A"
          onPress={() => handlePress('/timeline')}
        />
        <FeatureCard
          title="Quiz Express"
          subtitle="Teste-toi !"
          icon="bulb"
          color="#FFFBEB"
          iconColor="#D97706"
          onPress={() => handlePress('/quiz')}
        />
      </View>

      {/* Weekly Progress Card */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Objectif Quotidien</Text>
          <Text style={styles.progressPercent}>75%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '75%' }]} />
        </View>
        <Text style={styles.progressSub}>Encore 45 minutes pour atteindre ton but ! 💪</Text>
      </View>
    </ScrollView>
  );
}

function FeatureCard({ title, subtitle, icon, color, iconColor, onPress }: any) {
  return (
    <TouchableOpacity
      style={[styles.featureCard, { backgroundColor: Colors.white }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.featureIconContainer, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={24} color={iconColor} />
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.tan} style={styles.featureArrow} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.beige },
  scrollContent: { padding: Spacing.md, paddingTop: Platform.OS === 'ios' ? 70 : 50, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: Colors.brown, marginBottom: 8 },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  levelText: { fontSize: 13, fontWeight: '700', color: Colors.greenDark },
  xpBarContainer: { width: 100, height: 6, backgroundColor: Colors.tanLight, borderRadius: 3, overflow: 'hidden' },
  xpBarFill: { height: '100%', backgroundColor: Colors.green, borderRadius: 3 },

  avatarContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', ...Shadows.small, borderWidth: 2, borderColor: Colors.greenLight },
  profileBtn: { padding: 2 },

  mainCTA: { backgroundColor: Colors.green, borderRadius: 24, padding: 20, marginBottom: 25, ...Shadows.green },
  ctaContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ctaTitle: { color: Colors.white, fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  ctaSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  ctaIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center' },

  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  statItem: { flex: 1, padding: 12, borderRadius: 20, alignItems: 'center', ...Shadows.small },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: Colors.brown },
  statLabel: { fontSize: 10, color: Colors.brownLight, textTransform: 'uppercase', fontWeight: '600' },

  sectionTitle: { fontSize: 19, fontWeight: 'bold', color: Colors.brown, marginBottom: 15, marginLeft: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 25 },
  featureCard: { width: CARD_WIDTH, borderRadius: 24, padding: 16, ...Shadows.small, position: 'relative' },
  featureIconContainer: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  featureTextContainer: { gap: 2 },
  featureTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.brown },
  featureSubtitle: { fontSize: 12, color: Colors.tan },
  featureArrow: { position: 'absolute', top: 16, right: 16 },

  progressCard: { backgroundColor: Colors.white, borderRadius: 24, padding: 20, ...Shadows.medium },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.brown },
  progressPercent: { fontSize: 16, fontWeight: 'bold', color: Colors.green },
  progressBarBg: { height: 10, backgroundColor: Colors.beige, borderRadius: 5, overflow: 'hidden', marginBottom: 12 },
  progressBarFill: { height: '100%', backgroundColor: Colors.green, borderRadius: 5 },
  progressSub: { fontSize: 13, color: Colors.brownLight, textAlign: 'center' },
});
