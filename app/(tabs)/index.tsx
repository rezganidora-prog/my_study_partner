import { Colors, Shadows, Spacing } from '@/constants/GhibliTheme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

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

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setUserProfile(profile);

      const { count: courseCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setStats({
        streak: profile?.streak ?? 0,
        hours: profile?.study_hours ?? 0,
        courses: courseCount ?? 0,
        xp: profile?.xp ?? 0,
        level: profile?.level ?? 1,
      });

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

  // ─── LOADING ─────────────────────────
  if (loading) {
    return (
      <View style={styles.loader}>
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
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Bonjour, {userProfile?.full_name?.split(' ')[0] || 'Aventurier'}
          </Text>

          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Niveau {stats.level}</Text>

            <View style={styles.xpBarContainer}>
              <View
                style={[
                  styles.xpBarFill,
                  { width: `${Math.min(stats.xp % 100, 100)}%` }
                ]}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={() => handlePress('/profile')}>
          <View style={styles.avatarContainer}>
            <Text style={{ fontSize: 24 }}>🍃</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* CTA */}
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

      {/* STATS */}
      <View style={styles.statsGrid}>
        {[
          { emoji: '🔥', value: stats.streak, label: 'Jours', bg: '#FFF5E6' },
          { emoji: '⏱️', value: stats.hours + 'h', label: 'Focus', bg: '#E0F2F1' },
          { emoji: '📚', value: stats.courses, label: 'Cours', bg: '#E3F2FD' },
          { emoji: '🏆', value: stats.xp, label: 'XP', bg: '#F3E5F5' },
        ].map((item, i) => (
          <View key={i} style={[styles.statItem, { backgroundColor: item.bg }]}>
            <Text style={styles.statEmoji}>{item.emoji}</Text>
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* FEATURES */}
      <Text style={styles.sectionTitle}>Tes outils</Text>

      <View style={styles.grid}>
        <FeatureCard title="Assistant IA" icon="sparkles" onPress={() => handlePress('/chatbot')} />
        <FeatureCard title="Mes Cours" icon="book" onPress={() => handlePress('/courses')} />
        <FeatureCard title="Timeline" icon="calendar" onPress={() => handlePress('/timeline')} />
        <FeatureCard title="Quiz" icon="bulb" onPress={() => handlePress('/quiz')} />
      </View>

      {/* PROGRESS */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Objectif Quotidien</Text>
          <Text style={styles.progressPercent}>75%</Text>
        </View>

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '75%' }]} />
        </View>

        <Text style={styles.progressSub}>
          Encore 45 min pour atteindre ton objectif
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── FEATURE CARD ─────────────────────
function FeatureCard({ title, icon, onPress }: any) {
  return (
    <TouchableOpacity style={styles.featureCard} onPress={onPress}>
      <Ionicons name={icon} size={22} color={Colors.green} />
      <Text style={styles.featureTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

// ─── STYLES ───────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.beige },

  scrollContent: {
    padding: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 70 : 55, // ✔ fix padding global
    paddingBottom: 40,
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.beige
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25
  },

  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.brown
  },

  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },

  levelText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.greenDark
  },

  xpBarContainer: {
    width: 100,
    height: 6,
    backgroundColor: Colors.tanLight,
    borderRadius: 3,
    overflow: 'hidden'
  },

  xpBarFill: {
    height: '100%',
    backgroundColor: Colors.green
  },

  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small
  },

  mainCTA: {
    backgroundColor: Colors.green,
    borderRadius: 24,
    padding: 20,
    marginBottom: 25
  },

  ctaContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  ctaTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold'
  },

  ctaSubtitle: {
    color: 'rgba(255,255,255,0.8)'
  },

  ctaIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center'
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 30
  },

  statItem: {
    flex: 1,
    padding: 12,
    borderRadius: 20,
    alignItems: 'center'
  },

  statEmoji: { fontSize: 20 },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 10 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },

  featureCard: {
    width: CARD_WIDTH,
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    gap: 8
  },

  featureTitle: {
    fontSize: 13,
    fontWeight: '600'
  },

  progressCard: {
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    backgroundColor: Colors.white
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  progressTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.brown,
  },

  progressPercent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.green,
  },

  progressBarBg: {
    height: 10,
    backgroundColor: Colors.beige,
    borderRadius: 5,
    marginVertical: 10
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.green
  },

  progressSub: {
    textAlign: 'center',
    fontSize: 12
  }
});