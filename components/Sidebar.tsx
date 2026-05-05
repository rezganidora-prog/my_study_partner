import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Spacing } from '@/constants/GhibliTheme';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({ level: 1, xp: 0, nextLevelXp: 1000 });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase.from('profiles').select('level, xp').eq('id', user.id).single()
          .then(({ data }) => {
            if (data) {
              const lvl = data.level || 1;
              setStats({ level: lvl, xp: data.xp || 0, nextLevelXp: lvl * 1000 });
            }
          });
      }
    });
  }, []);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Explorateur';

  const MENU_ITEMS = [
    { name: 'Dashboard', icon: 'grid-outline', path: '/(tabs)' },
    { name: 'Focus Pomodoro', icon: 'timer-outline', path: '/(tabs)/pomodoro' },
    { name: 'Bibliothèque', icon: 'book-outline', path: '/(tabs)/courses' },
    { name: 'Planning', icon: 'calendar-outline', path: '/(tabs)/timeline' },
    { name: 'Assistant IA', icon: 'sparkles-outline', path: '/(tabs)/chatbot' },
    { name: 'Défis & Quiz', icon: 'trophy-outline', path: '/(tabs)/quiz' },
    { name: 'Communauté', icon: 'people-outline', path: '/(tabs)/social' },
  ];

  const handleNavigate = (path: string) => {
    router.push(path as any);
    if (onClose) onClose();
  };

  const xpPercentage = (stats.xp / stats.nextLevelXp) * 100;

  return (
    <View style={styles.container}>
      {/* User Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <Text style={{ fontSize: 24 }}>🍃</Text>
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
            <Text style={styles.userRank}>Apprenti Savant</Text>
          </View>
        </View>

        <View style={styles.xpSection}>
          <View style={styles.xpLabelRow}>
            <Text style={styles.xpLabel}>Niveau {stats.level}</Text>
            <Text style={styles.xpValue}>{stats.xp} / {stats.nextLevelXp} XP</Text>
          </View>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${xpPercentage}%` }]} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.menuSection} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Navigation</Text>
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.path || (item.path === '/(tabs)' && pathname === '/');
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.menuItem, isActive && styles.activeMenuItem]}
              onPress={() => handleNavigate(item.path)}
            >
              <View style={[styles.iconBox, isActive && styles.activeIconBox]}>
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={isActive ? Colors.white : Colors.tan}
                />
              </View>
              <Text style={[styles.menuText, isActive && styles.activeMenuText]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => handleNavigate('/(tabs)/profile')}
        >
          <Ionicons name="settings-outline" size={20} color={Colors.tan} />
          <Text style={styles.footerText}>Paramètres</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => supabase.auth.signOut()}>
          <Ionicons name="log-out-outline" size={20} color={Colors.accent} />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.beige,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  profileCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 25,
    ...Shadows.small,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.greenSoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.greenLight,
  },
  nameContainer: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.brown,
  },
  userRank: {
    fontSize: 12,
    color: Colors.green,
    fontWeight: '600',
  },
  xpSection: {
    marginTop: 5,
  },
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  xpLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.brownLight,
  },
  xpValue: {
    fontSize: 10,
    color: Colors.tan,
  },
  xpBarBg: {
    height: 6,
    backgroundColor: Colors.beige,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: Colors.green,
    borderRadius: 3,
  },
  menuSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.tan,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 4,
  },
  activeMenuItem: {
    backgroundColor: 'rgba(139, 175, 118, 0.1)',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  activeIconBox: {
    backgroundColor: Colors.green,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.brownLight,
    marginLeft: 12,
  },
  activeMenuText: {
    color: Colors.green,
    fontWeight: '700',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 5,
  },
  footerText: {
    fontSize: 14,
    color: Colors.brownLight,
    fontWeight: '600',
    marginLeft: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '700',
    marginLeft: 12,
  },
});
