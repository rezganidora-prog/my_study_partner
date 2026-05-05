import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, View, ImageBackground, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface Props {
  children: React.ReactNode;
  overlayOpacity?: number;
}

export default function GhibliBackground({ children, overlayOpacity = 0.55 }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <ImageBackground
      source={require('@/assets/images/wallpaper.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      {/* Warm gradient overlay for readability */}
      <LinearGradient
        colors={[
          `rgba(253,246,227,${overlayOpacity})`,
          `rgba(232,213,183,${overlayOpacity + 0.1})`,
        ]}
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {children}
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, width, height },
  content: { flex: 1 },
});
