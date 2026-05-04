import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [goals, setGoals] = useState("Réussir mes examens de fin d'année et maîtriser le développement mobile.");
  const [subjects, setSubjects] = useState("Développement Mobile, Mathématiques, IA, Philosophie");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile({ ...data, email: user.email });
        if (data.goals) setGoals(data.goals);
        if (data.subjects) setSubjects(data.subjects);
      } else {
        setProfile({ email: user.email });
      }
    }
  };

  const pickAndUploadPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', "Autorise l'accès à ta galerie pour choisir une photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) return;

    setUploadingPhoto(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      const uri = result.assets[0].uri;
      const fileName = `${user.id}/avatar.jpg`;

      const photoResponse = await fetch(uri);
      const blob = await photoResponse.blob();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);

      setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
    } catch (error: any) {
      Alert.alert('Erreur', error.message || "Impossible de mettre à jour la photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      const { error } = await supabase
        .from('profiles')
        .update({ goals, subjects })
        .eq('id', user.id);

      if (error) throw error;

      setIsEditing(false);
      Alert.alert('Succès ✨', 'Tes objectifs ont été sauvegardés !');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de sauvegarder.');
    } finally {
      setSavingProfile(false);
    }
  };

  const avatarUri = profile?.avatar_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=8BAF76&color=fff`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          <TouchableOpacity style={styles.editBadge} onPress={pickAndUploadPhoto} disabled={uploadingPhoto}>
            {uploadingPhoto
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="camera" size={16} color="#fff" />}
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{profile?.full_name || 'Étudiant'}</Text>
        <Text style={styles.userEmail}>{profile?.email || 'email@example.com'}</Text>
      </View>

      {/* Academic Info */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="school-outline" size={20} color="#8BAF76" />
          <Text style={styles.sectionTitle}>Parcours Académique</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Matières étudiées</Text>
          {isEditing ? (
            <TextInput style={styles.input} value={subjects} onChangeText={setSubjects} multiline />
          ) : (
            <Text style={styles.value}>{subjects}</Text>
          )}

          <View style={styles.divider} />

          <Text style={styles.label}>Objectifs d'apprentissage</Text>
          {isEditing ? (
            <TextInput style={styles.input} value={goals} onChangeText={setGoals} multiline />
          ) : (
            <Text style={styles.value}>{goals}</Text>
          )}
        </View>
      </View>

      {/* Progress Stats */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="stats-chart-outline" size={20} color="#8BAF76" />
          <Text style={styles.sectionTitle}>Statistiques de Réussite</Text>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{profile?.streak || 0}</Text>
            <Text style={styles.statLab}>Série (Jours)</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{profile?.study_hours || 0}h</Text>
            <Text style={styles.statLab}>Heures d'étude</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity
        style={styles.mainBtn}
        onPress={isEditing ? saveProfile : () => setIsEditing(true)}
        disabled={savingProfile}
      >
        {savingProfile
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.mainBtnText}>{isEditing ? "Sauvegarder les objectifs" : "Modifier mes buts"}</Text>}
      </TouchableOpacity>

      {isEditing && (
        <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}>
          <Text style={styles.cancelBtnText}>Annuler</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.logoutBtnText}>Se déconnecter</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>Projet GLSI2C - Groupe 2 ✨</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  scrollContent: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#fff' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#8BAF76', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#4A3728' },
  userEmail: { fontSize: 14, color: '#8B735B' },

  section: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#4A3728' },
  infoCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#F0E6D2' },
  label: { fontSize: 12, fontWeight: 'bold', color: '#8BAF76', textTransform: 'uppercase', marginBottom: 6 },
  value: { fontSize: 15, color: '#4A3728', lineHeight: 22 },
  input: { fontSize: 15, color: '#4A3728', borderBottomWidth: 1, borderBottomColor: '#8BAF76', paddingVertical: 5 },
  divider: { height: 1, backgroundColor: '#F9F6F0', marginVertical: 15 },

  statsGrid: { flexDirection: 'row', gap: 15 },
  statItem: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#F0E6D2' },
  statVal: { fontSize: 22, fontWeight: 'bold', color: '#8BAF76' },
  statLab: { fontSize: 12, color: '#8B735B' },

  mainBtn: { backgroundColor: '#8BAF76', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  mainBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { backgroundColor: '#fff', height: 48, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E8D9C0', marginBottom: 12 },
  cancelBtnText: { color: '#8B735B', fontSize: 15, fontWeight: '600' },
  logoutBtn: { backgroundColor: '#FDF6E3', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D48C8C' },
  logoutBtnText: { color: '#D48C8C', fontSize: 16, fontWeight: 'bold' },
  footerText: { textAlign: 'center', color: '#C4A882', fontSize: 12, marginTop: 20 },
});
