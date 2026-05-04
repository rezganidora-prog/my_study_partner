import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function TimelineScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [showAddModal, setShowAddModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [duration, setDuration] = useState('60');
  const [stats, setStats] = useState({ study_hours: 0, streak: 0 });
  const [tasks, setTasks] = useState<any[]>([]);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchTasks();
  }, [currentDate]);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('study_hours, streak').eq('id', user.id).single();
      if (data) setStats(data);
    }
  };

  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
    const { data } = await supabase.from('tasks').select('*').eq('user_id', user.id).gte('date', startOfMonth).lte('date', endOfMonth);
    if (data) setTasks(data);
  };

  const handleSaveSession = async () => {
    if (!sessionTitle || !selectedDay) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const taskDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay).toISOString().split('T')[0];
    
    if (editingTask) {
      // Mise à jour
      const { error } = await supabase.from('tasks').update({
        title: sessionTitle, 
        duration: parseInt(duration), 
        date: taskDate
      }).eq('id', editingTask.id);
      
      if (!error) {
        Alert.alert('Succès', 'Tâche mise à jour ! ✨');
      }
    } else {
      // Nouvel ajout
      const { error } = await supabase.from('tasks').insert({
        user_id: user.id, 
        title: sessionTitle, 
        duration: parseInt(duration), 
        date: taskDate, 
        category: 'Mathématiques'
      });
      
      if (!error) {
        Alert.alert('Succès', 'Tâche ajoutée ! 🌱');
      }
    }
    
    resetForm();
    fetchTasks();
    setLoading(false);
  };

  const handleDeleteTask = (id: string) => {
    Alert.alert(
      'Supprimer la tâche ?',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive', 
          onPress: async () => {
            const { error } = await supabase.from('tasks').delete().eq('id', id);
            if (!error) fetchTasks();
          } 
        },
      ]
    );
  };

  const openEditModal = (task: any) => {
    setEditingTask(task);
    setSessionTitle(task.title);
    setDuration(task.duration.toString());
    setShowAddModal(true);
  };

  const resetForm = () => {
    setSessionTitle('');
    setDuration('60');
    setEditingTask(null);
    setShowAddModal(false);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('fr-FR', { month: 'long' });
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const shift = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const getTasksForDay = (day: number) => {
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    return tasks.filter(t => t.date === dateStr);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Ma Timeline 🗓️</Text>
        <Text style={styles.subtitle}>Gère ton temps comme un expert</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={styles.statValue}>{stats.streak}</Text>
          <Text style={styles.statLabel}>Série</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⏱️</Text>
          <Text style={styles.statValue}>{stats.study_hours}h</Text>
          <Text style={styles.statLabel}>Étude</Text>
        </View>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => setCurrentDate(new Date(year, month - 1, 1))}><Ionicons name="chevron-back" size={24} color="#8B735B" /></TouchableOpacity>
          <Text style={styles.monthText}>{monthName.charAt(0).toUpperCase() + monthName.slice(1)} {year}</Text>
          <TouchableOpacity onPress={() => setCurrentDate(new Date(year, month + 1, 1))}><Ionicons name="chevron-forward" size={24} color="#8B735B" /></TouchableOpacity>
        </View>

        <View style={styles.daysRow}>
          {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map(d => <Text key={d} style={styles.dayOfWeekText}>{d}</Text>)}
        </View>

        <View style={styles.grid}>
          {Array.from({ length: shift }).map((_, i) => <View key={`e-${i}`} style={styles.dayCell} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayTasks = getTasksForDay(day);
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            
            return (
              <TouchableOpacity 
                key={day} 
                style={[styles.dayCell, selectedDay === day && styles.selectedDayCell, isToday && styles.todayCell]} 
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayNumber, selectedDay === day && styles.selectedDayText]}>{day}</Text>
                <View style={styles.taskContainer}>
                  {dayTasks.slice(0, 2).map((t, idx) => (
                    <View key={idx} style={[styles.taskMiniBar, { backgroundColor: idx === 0 ? '#8BAF76' : '#C4A882' }]} />
                  ))}
                  {dayTasks.length > 2 && <Text style={styles.moreText}>+{dayTasks.length - 2}</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {selectedDay && (
        <View style={styles.dailyTasksSection}>
          <View style={styles.dailyHeader}>
            <Text style={styles.dailyTitle}>Sessions du {selectedDay} {monthName}</Text>
            <TouchableOpacity style={styles.addSmallBtn} onPress={() => { resetForm(); setShowAddModal(true); }}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {getTasksForDay(selectedDay).length > 0 ? (
            getTasksForDay(selectedDay).map((t) => (
              <View key={t.id} style={styles.taskItem}>
                <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => openEditModal(t)}>
                  <View style={styles.taskIconBox}><Ionicons name="book" size={18} color="#8BAF76" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.taskItemTitle}>{t.title}</Text>
                    <Text style={styles.taskItemSub}>{t.category} • {t.duration} min</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteTask(t.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={20} color="#D48C8C" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noTasksText}>Aucune session prévue pour ce jour. ✨</Text>
          )}
        </View>
      )}

      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalDateTitle}>{editingTask ? 'Modifier la session' : 'Nouvelle session'}</Text>
                <Text style={styles.modalDateSub}>{selectedDay} {monthName} {year}</Text>
              </View>
              <TouchableOpacity onPress={resetForm} style={styles.closeBtn}><Ionicons name="close" size={20} color="#4A3728" /></TouchableOpacity>
            </View>
            <View style={styles.formContent}>
              <TextInput 
                style={styles.textInput} 
                placeholder="Titre (ex: Révision Algèbre)" 
                placeholderTextColor="#C4A882" 
                value={sessionTitle} 
                onChangeText={setSessionTitle} 
              />
              <View style={styles.pickerFake}><Text style={styles.pickerText}>Mathématiques</Text><Ionicons name="chevron-down" size={16} color="#8B735B" /></View>
              <View style={styles.durationRow}>
                <Text style={styles.durationLabel}>Durée (minutes) :</Text>
                <TextInput style={styles.durationInput} value={duration} onChangeText={setDuration} keyboardType="numeric" />
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.addBtn} onPress={handleSaveSession} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.addBtnText}>{editingTask ? 'Mettre à jour' : 'Ajouter'}</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}><Text style={styles.cancelBtnText}>Annuler</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  scrollContent: { padding: 16, paddingTop: 40, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#4A3728' },
  subtitle: { fontSize: 13, color: '#8B735B' },
  statsContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#F0E6D2' },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#4A3728' },
  statLabel: { fontSize: 10, color: '#8B735B' },
  calendarCard: { backgroundColor: '#fff', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: '#F0E6D2', marginBottom: 20 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  monthText: { fontSize: 18, fontWeight: 'bold', color: '#4A3728' },
  daysRow: { flexDirection: 'row', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F9F6F0', paddingBottom: 5 },
  dayOfWeekText: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 'bold', color: '#C4A882' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', height: 60, padding: 2, alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#FDF6E3' },
  dayNumber: { fontSize: 13, color: '#4A3728', fontWeight: '600' },
  selectedDayCell: { backgroundColor: '#FDF6E3', borderRadius: 8 },
  selectedDayText: { color: '#8BAF76', fontWeight: 'bold' },
  todayCell: { borderBottomWidth: 2, borderBottomColor: '#8BAF76' },
  taskContainer: { width: '100%', alignItems: 'center', marginTop: 2, gap: 2 },
  taskMiniBar: { width: '80%', height: 3, borderRadius: 2 },
  moreText: { fontSize: 8, color: '#C4A882', fontWeight: 'bold' },
  dailyTasksSection: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F0E6D2' },
  dailyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  dailyTitle: { fontSize: 15, fontWeight: 'bold', color: '#4A3728' },
  addSmallBtn: { backgroundColor: '#8BAF76', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  taskItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDF6E3', borderRadius: 15, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#F0E6D2' },
  taskIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  taskItemTitle: { fontSize: 14, fontWeight: 'bold', color: '#4A3728' },
  taskItemSub: { fontSize: 11, color: '#8B735B' },
  deleteBtn: { padding: 5 },
  noTasksText: { textAlign: 'center', color: '#C4A882', fontStyle: 'italic', padding: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FEF9F0', width: '90%', maxWidth: 400, borderRadius: 24, overflow: 'hidden' },
  modalHeader: { backgroundColor: '#FAF3E3', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalDateTitle: { fontSize: 18, fontWeight: 'bold', color: '#4A3728' },
  modalDateSub: { fontSize: 12, color: '#8B735B' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  formContent: { padding: 20 },
  textInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#8BAF76', borderRadius: 12, padding: 12, color: '#4A3728', marginBottom: 15 },
  pickerFake: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8D9C0', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  pickerText: { flex: 1, color: '#4A3728', fontSize: 14 },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 25 },
  durationLabel: { fontSize: 14, color: '#4A3728' },
  durationInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8D9C0', borderRadius: 10, padding: 8, width: 60, textAlign: 'center', fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row', gap: 10 },
  addBtn: { flex: 2, backgroundColor: '#BDD2B1', height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  cancelBtn: { flex: 1, backgroundColor: '#FDF6E3', height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E8D9C0' },
  cancelBtnText: { color: '#8B735B' },
});
