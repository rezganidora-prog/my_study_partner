import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Alert, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '@/lib/supabase';

const SUBJECTS = [
  { id: 'maths', label: 'Mathématiques', icon: 'calculator-outline', color: '#E3F2FD' },
  { id: 'physics', label: 'Physique-Chimie', icon: 'flask-outline', color: '#FFF3E0' },
  { id: 'history', label: 'Histoire-Géo', icon: 'earth-outline', color: '#EFEBE9' },
  { id: 'languages', label: 'Langues', icon: 'language-outline', color: '#F3E5F5' },
  { id: 'biology', label: 'SVT / Biologie', icon: 'leaf-outline', color: '#E8F5E9' },
  { id: 'it', label: 'Informatique', icon: 'desktop-outline', color: '#E0F2F1' },
  { id: 'letters', label: 'Lettres', icon: 'book-outline', color: '#FFFDE7' },
  { id: 'philosophy', label: 'Philosophie', icon: 'flame-outline', color: '#FBE9E7' },
  { id: 'other', label: 'Autre', icon: 'apps-outline', color: '#FAFAFA' },
];

export default function CoursesScreen() {
  const [courses, setCourses] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Mathématiques');
  // Edit state
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('courses').select('*').eq('user_id', user.id);
      if (data) setCourses(data);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
        setCourseTitle(result.assets[0].name.replace('.pdf', ''));
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !courseTitle) return;
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: 'application/pdf',
      } as any);

      // Upload to Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('courses')
        .upload(fileName, formData);

      if (uploadError) throw uploadError;

      // Save to Database
      const { error: dbError } = await supabase.from('courses').insert({
        user_id: user.id,
        title: courseTitle,
        subject: selectedSubject,
        file_url: fileName
      });

      if (dbError) throw dbError;

      Alert.alert('Succès ✨', 'Le cours a été ajouté à ta bibliothèque !');
      setSelectedFile(null);
      setCourseTitle('');
      fetchCourses();
    } catch (error: any) {
      Alert.alert('Erreur upload', error.message);
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (course: any) => {
    setEditingCourse(course);
    setEditTitle(course.title);
    setEditSubject(course.subject || 'Mathématiques');
  };

  const handleEdit = async () => {
    if (!editTitle.trim() || !editingCourse) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('courses')
        .update({ title: editTitle.trim(), subject: editSubject })
        .eq('id', editingCourse.id);
      if (error) throw error;
      setEditingCourse(null);
      fetchCourses();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (course: any) => {
    Alert.alert(
      'Supprimer ce cours ?',
      `« ${course.title} » sera supprimé définitivement.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            // Delete from storage if file_url exists
            if (course.file_url) {
              await supabase.storage.from('courses').remove([course.file_url]).catch(() => {});
            }
            const { error } = await supabase.from('courses').delete().eq('id', course.id);
            if (!error) fetchCourses();
            else Alert.alert('Erreur', error.message);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Grimoires 📚</Text>
        <Text style={styles.subtitle}>Conserve tes PDFs comme des trésors dans ta bibliothèque 🌿</Text>
      </View>

      {/* Upload Section (Matches Photo) */}
      <View style={styles.uploadCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="leaf" size={20} color="#8BAF76" />
          <Text style={styles.sectionTitle}>Ajouter ce cours</Text>
        </View>

        {!selectedFile ? (
          <TouchableOpacity style={styles.dropZone} onPress={pickDocument}>
            <Ionicons name="cloud-upload-outline" size={40} color="#C4A882" />
            <Text style={styles.dropZoneText}>Sélectionne un fichier PDF</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.fileInfo}>
            <Ionicons name="document-text" size={32} color="#8BAF76" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.fileName}>{selectedFile.name}</Text>
              <Text style={styles.fileSize}>{(selectedFile.size / 1024).toFixed(1)} Ko</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedFile(null)}>
              <Ionicons name="close-circle" size={24} color="#D48C8C" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Titre du cours</Text>
          <TextInput 
            style={styles.textInput} 
            value={courseTitle} 
            onChangeText={setCourseTitle}
            placeholder="Donne un nom à ton grimoire..."
          />
        </View>

        <Text style={styles.inputLabel}>Matière</Text>
        <View style={styles.subjectGrid}>
          {SUBJECTS.map((s) => (
            <TouchableOpacity 
              key={s.id} 
              style={[
                styles.subjectBtn, 
                { backgroundColor: selectedSubject === s.label ? s.color : '#fff' },
                selectedSubject === s.label && { borderColor: '#8BAF76', borderWidth: 1 }
              ]}
              onPress={() => setSelectedSubject(s.label)}
            >
              <Ionicons name={s.icon as any} size={16} color="#8B735B" />
              <Text style={styles.subjectBtnText}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.saveBtn, !selectedFile && styles.disabledBtn]} 
            onPress={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.saveBtnText}>📚 Sauvegarder le cours</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedFile(null)}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Library Section */}
      <Text style={styles.libraryTitle}>Ma Bibliothèque ({courses.length})</Text>
      <View style={styles.libraryGrid}>
        {courses.map((c) => (
          <View key={c.id} style={styles.courseCard}>
            <View style={styles.courseIconBox}>
              <Ionicons name="journal" size={24} color="#8BAF76" />
            </View>
            <Text style={styles.courseTitle} numberOfLines={2}>{c.title}</Text>
            <Text style={styles.courseSub}>{c.subject}</Text>
            <View style={styles.courseActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(c)}>
                <Ionicons name="pencil-outline" size={16} color="#8BAF76" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(c)}>
                <Ionicons name="trash-outline" size={16} color="#D48C8C" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Edit Modal */}
      <Modal visible={!!editingCourse} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✏️ Modifier le cours</Text>
              <TouchableOpacity onPress={() => setEditingCourse(null)}>
                <Ionicons name="close" size={22} color="#4A3728" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Titre</Text>
            <TextInput
              style={styles.textInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Titre du cours"
              placeholderTextColor="#C4A882"
            />

            <Text style={styles.inputLabel}>Matière</Text>
            <View style={styles.subjectGrid}>
              {SUBJECTS.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.subjectBtn,
                    { backgroundColor: editSubject === s.label ? s.color : '#fff' },
                    editSubject === s.label && { borderColor: '#8BAF76' },
                  ]}
                  onPress={() => setEditSubject(s.label)}
                >
                  <Ionicons name={s.icon as any} size={14} color="#8B735B" />
                  <Text style={styles.subjectBtnText}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleEdit} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Enregistrer</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  scrollContent: { padding: 16, paddingTop: 40 },
  header: { marginBottom: 25 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#4A3728' },
  subtitle: { fontSize: 13, color: '#8BAF76', fontStyle: 'italic' },
  
  uploadCard: { backgroundColor: '#FFFBF0', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F0E6D2', marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#4A3728' },
  
  dropZone: { height: 120, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E8D9C0', borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', marginBottom: 20 },
  dropZoneText: { marginTop: 10, color: '#C4A882', fontWeight: '600' },
  
  fileInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAF3E3', padding: 15, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: '#E8D9C0' },
  fileName: { fontSize: 14, fontWeight: 'bold', color: '#4A3728' },
  fileSize: { fontSize: 12, color: '#8B735B' },
  
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#4A3728', marginBottom: 10 },
  textInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8D9C0', borderRadius: 12, padding: 12, color: '#4A3728' },
  
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 25 },
  subjectBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F0E6D2', minWidth: '48%' },
  subjectBtnText: { fontSize: 12, color: '#8B735B', fontWeight: '600' },
  
  actionRow: { flexDirection: 'row', gap: 12 },
  saveBtn: { flex: 2, backgroundColor: '#8BAF76', height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { flex: 1, backgroundColor: '#fff', height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F0E6D2' },
  cancelBtnText: { color: '#8B735B', fontWeight: '600' },
  disabledBtn: { backgroundColor: '#E8D9C0' },

  libraryTitle: { fontSize: 20, fontWeight: 'bold', color: '#4A3728', marginBottom: 15 },
  libraryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 40 },
  courseCard: { width: '47%', backgroundColor: '#fff', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: '#F0E6D2', alignItems: 'center' },
  courseIconBox: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#FDF6E3', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  courseTitle: { fontSize: 14, fontWeight: 'bold', color: '#4A3728', textAlign: 'center', marginBottom: 4 },
  courseSub: { fontSize: 11, color: '#C4A882', marginBottom: 10 },
  courseActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F0F8EC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D4EDCB' },
  deleteBtn: { backgroundColor: '#FFF0F0', borderColor: '#F5C6C6' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFFBF0', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#4A3728' },
});
