import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [goals, setGoals] = useState("Réussir mes examens de fin d'année.");
  const [subjects, setSubjects] = useState("Développement Mobile, Mathématiques");
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
        if (data.full_name) setFullName(data.full_name);
        if (data.goals) setGoals(data.goals);
        if (data.subjects) setSubjects(data.subjects);
      } else {
        setProfile({ email: user.email });
      }
    }
  };

  const pickAndUploadPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permission requise');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true
    });

    if (result.canceled) return;

    setUploadingPhoto(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      const fileName = `${user.id}/avatar.jpg`;
      const arrayBuffer = decodeBase64(result.assets[0].base64!);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes.buffer;
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');
      const { error } = await supabase.from('profiles').update({ full_name: fullName, goals, subjects }).eq('id', user.id);
      if (error) throw error;
      setIsEditing(false);
      setProfile((prev: any) => ({ ...prev, full_name: fullName }));
      Alert.alert('Succès ✨', 'Ton profil a été mis à jour !');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const avatarUri = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'User')}&background=8BAF76&color=fff`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          <TouchableOpacity style={styles.editBadge} onPress={pickAndUploadPhoto} disabled={uploadingPhoto}>
            {uploadingPhoto ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={16} color="#fff" />}
          </TouchableOpacity>
        </View>
        {isEditing ? (
          <TextInput style={styles.nameInput} value={fullName} onChangeText={setFullName} placeholder="Ton Nom Complet" placeholderTextColor="#C4A882" />
        ) : (
          <Text style={styles.userName}>{fullName || 'Étudiant'}</Text>
        )}
        <Text style={styles.userEmail}>{profile?.email}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}><Ionicons name="school-outline" size={20} color="#8BAF76" /><Text style={styles.sectionTitle}>Parcours Académique</Text></View>
        <View style={styles.infoCard}>
          <Text style={styles.label}>Matières étudiées</Text>
          {isEditing ? <TextInput style={styles.input} value={subjects} onChangeText={setSubjects} multiline /> : <Text style={styles.value}>{subjects}</Text>}
          <View style={styles.divider} />
          <Text style={styles.label}>Objectifs d'apprentissage</Text>
          {isEditing ? <TextInput style={styles.input} value={goals} onChangeText={setGoals} multiline /> : <Text style={styles.value}>{goals}</Text>}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}><Ionicons name="stats-chart-outline" size={20} color="#8BAF76" /><Text style={styles.sectionTitle}>Statistiques</Text></View>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}><Text style={styles.statVal}>{profile?.streak || 0}</Text><Text style={styles.statLab}>Série (Jours)</Text></View>
          <View style={styles.statItem}><Text style={styles.statVal}>{profile?.study_hours || 0}h</Text><Text style={styles.statLab}>Heures d'étude</Text></View>
        </View>
      </View>

      <TouchableOpacity style={styles.mainBtn} onPress={isEditing ? saveProfile : () => setIsEditing(true)} disabled={savingProfile}>
        {savingProfile ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>{isEditing ? "Enregistrer" : "Modifier le profil"}</Text>}
      </TouchableOpacity>

      {isEditing && (
        <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}><Text style={styles.cancelBtnText}>Annuler</Text></TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={() => supabase.auth.signOut()}><Text style={styles.logoutBtnText}>Se déconnecter</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6E3' },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#fff' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#8BAF76', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#4A3728' },
  nameInput: { fontSize: 22, fontWeight: 'bold', color: '#4A3728', borderBottomWidth: 1, borderBottomColor: '#8BAF76', textAlign: 'center', minWidth: 200, marginBottom: 5 },
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
  logoutBtn: { backgroundColor: 'rgba(212,140,140,0.1)', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D48C8C' },
  logoutBtnText: { color: '#D48C8C', fontSize: 16, fontWeight: 'bold' },
});
