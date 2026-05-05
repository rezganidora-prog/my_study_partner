import { AYAT } from '@/constants/ayat';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SplashAyat() {
  const router = useRouter();
  const navigatedRef = useRef(false);

  const [ayat] = useState(
    () => AYAT[Math.floor(Math.random() * AYAT.length)]
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const navigate = useCallback(() => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    router.replace('/(tabs)' as any);
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

        {/* Bismillah */}
        <Text style={styles.bismillah}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </Text>

        {/* Ayat */}
        <Text style={styles.ayat}>
          {ayat.arabic}
        </Text>

        {/* Sourate */}
        <Text style={styles.surah}>
          {ayat.surah}
        </Text>

        {/* Button */}
        <TouchableOpacity style={styles.button} onPress={navigate}>
          <Text style={styles.buttonText}>Commencer</Text>
        </TouchableOpacity>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF6E3',
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  bismillah: {
    fontSize: 22,
    color: '#4A3728',
    textAlign: 'center',
    marginBottom: 40,
    writingDirection: 'rtl',
    fontWeight: '600',
  },

  ayat: {
    fontSize: 30,
    color: '#4A3728',
    textAlign: 'center',
    lineHeight: 52,
    writingDirection: 'rtl',
    marginBottom: 25,
    fontWeight: '600',
  },

  surah: {
    fontSize: 14,
    color: '#8BAF76',
    marginBottom: 50,
    textAlign: 'center',
  },

  button: {
    backgroundColor: '#8BAF76',
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 20,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});