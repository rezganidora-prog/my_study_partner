import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/GhibliTheme';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const userName = user?.email?.split('@')[0] || 'Explorateur';

  const MENU_ITEMS = [
    { name: 'Accueil', icon: 'home-outline', path: '/(tabs)' },
    { name: 'Pomodoro', icon: 'pizza-outline', path: '/(tabs)/pomodoro' },
    { name: 'Timeline', icon: 'calendar-outline', path: '/(tabs)/timeline' },
    { name: 'Mes Cours', icon: 'book-outline', path: '/(tabs)/courses' },
    { name: 'Quiz', icon: 'bulb-outline', path: '/(tabs)/quiz' },
    { name: 'Chatbot IA', icon: 'headset-outline', path: '/(tabs)/chatbot' },
  ];

  const handleNavigate = (path: string) => {
    router.push(path as any);
    if (onClose) onClose();
  };

  return (
    <View style={styles.container}>
      {/* Header avec Profil plus visible */}
      <View style={styles.profileSection}>
        <View style={styles.avatarCircle}>
          <Text style={{ fontSize: 28 }}>🌸</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
          <Text style={styles.userStatus}>Apprenti Sorcier ✨</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#8B735B" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.menuSection} showsVerticalScrollIndicator={false}>
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.path || (item.path === '/(tabs)' && pathname === '/');
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.menuItem, isActive && styles.activeMenuItem]}
              onPress={() => handleNavigate(item.path)}
            >
              <Ionicons 
                name={item.icon as any} 
                size={24} 
                color={isActive ? '#fff' : '#8B735B'} 
              />
              <Text style={[styles.menuText, isActive && styles.activeMenuText]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity 
          style={[styles.menuItem, pathname === '/(tabs)/profile' && styles.activeMenuItem]}
          onPress={() => handleNavigate('/(tabs)/profile')}
        >
          <Ionicons name="person-outline" size={24} color={pathname === '/(tabs)/profile' ? '#fff' : '#8B735B'} />
          <Text style={[styles.menuText, pathname === '/(tabs)/profile' && styles.activeMenuText]}>Profil</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity style={styles.logoutButton} onPress={() => supabase.auth.signOut()}>
        <Ionicons name="log-out-outline" size={24} color="#D48C8C" />
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF6E3',
    paddingVertical: 25,
    paddingHorizontal: 18,
    borderRightWidth: 1,
    borderRightColor: '#F0E6D2',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginBottom: 35,
    marginTop: Platform.OS === 'ios' ? 40 : 10,
    gap: 15,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8D9C0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3728',
  },
  userStatus: {
    fontSize: 12,
    color: '#8BAF76',
    fontWeight: 'bold',
    marginTop: 2,
  },
  closeButton: {
    padding: 5,
  },
  menuSection: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 14,
    marginBottom: 8,
  },
  activeMenuItem: {
    backgroundColor: '#8BAF76',
    shadowColor: '#8BAF76',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B735B',
  },
  activeMenuText: {
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingVertical: 18,
    paddingHorizontal: 15,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0E6D2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D48C8C',
  },
});
