import { Slot } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform } from 'react-native';
import { useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

export default function TabLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(!isMobile);
  const slideAnim = useRef(new Animated.Value(isMobile ? -280 : 0)).current;

  const toggleMenu = () => {
    const toValue = isMenuOpen ? (isMobile ? -280 : -280) : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <View style={styles.container}>
      {/* Overlay pour fermer le menu sur mobile */}
      {isMobile && isMenuOpen && (
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={toggleMenu} 
        />
      )}

      {/* Barre Latérale Animée */}
      <Animated.View style={[
        styles.sidebarContainer, 
        { transform: [{ translateX: slideAnim }] },
        !isMobile && { position: 'relative', transform: [{ translateX: 0 }] }
      ]}>
        <Sidebar onClose={isMobile ? toggleMenu : undefined} />
      </Animated.View>
      
      <View style={styles.content}>
        {/* Bouton Menu (uniquement sur mobile ou si menu fermé) */}
        {(isMobile || !isMenuOpen) && (
          <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
            <Ionicons name="menu" size={28} color="#4A3728" />
          </TouchableOpacity>
        )}
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F9F6F0',
  },
  sidebarContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
    width: 280,
    backgroundColor: '#FDF6E3',
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  menuButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    zIndex: 90,
    backgroundColor: '#fff',
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0E6D2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 95,
  },
});
