import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

const PARTNERS = [
  { id: 'imen_id', name: 'Imen Othmen', status: 'En ligne ✨', avatar: 'https://ui-avatars.com/api/?name=Imen+O&background=8BAF76&color=fff' },
  { id: 'dorra_id', name: 'Dorra Rezgani', status: 'En ligne ✨', avatar: 'https://ui-avatars.com/api/?name=Dorra+R&background=C4A882&color=fff' },
];

export default function SocialScreen() {
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (activeRoom) {
      fetchMessages();
      const channel = supabase
        .channel(`public:messages:${activeRoom}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${activeRoom}` }, (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [activeRoom]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', activeRoom)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !activeRoom) return;
    const { error } = await supabase.from('messages').insert({
      user_id: user.id,
      room_id: activeRoom,
      content: newMessage,
      username: user.email.split('@')[0]
    });
    if (!error) setNewMessage('');
  };

  const openMeet = () => {
    Linking.openURL("https://meet.google.com/new");
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Study With Others 🤝</Text>
          <Text style={styles.subtitle}>Travaille en équipe avec tes collègues</Text>
        </View>

        {/* Study Rooms Section */}
        <Text style={styles.sectionTitle}>Study Rooms 📖</Text>
        <View style={styles.roomsGrid}>
          {[1, 2, 3].map(num => (
            <TouchableOpacity key={num} style={styles.roomCardSmall} onPress={() => setActiveRoom(`Study Room ${num}`)}>
              <Ionicons name="library" size={24} color="#8BAF76" />
              <Text style={styles.roomNameSmall}>Room {num}</Text>
              <Text style={styles.roomSub}>Entrer</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Partners / Colleagues Section */}
        <Text style={styles.sectionTitle}>Mes Collègues 👥</Text>
        <View style={styles.partnersList}>
          {PARTNERS.map(p => (
            <TouchableOpacity key={p.id} style={styles.partnerItem} onPress={() => setActiveRoom(p.name)}>
              <Image source={{ uri: p.avatar }} style={styles.avatar} />
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.partnerName}>{p.name}</Text>
                <Text style={styles.partnerStatus}>{p.status}</Text>
              </View>
              <View style={styles.chatIconBox}>
                <Ionicons name="chatbubbles" size={18} color="#8BAF76" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Unified Chat Modal */}
      <Modal visible={!!activeRoom} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => { setActiveRoom(null); setMessages([]); }}>
              <Ionicons name="chevron-down" size={28} color="#8B735B" />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.chatRoomName}>{activeRoom}</Text>
              <TouchableOpacity style={styles.meetBtn} onPress={openMeet}>
                <Ionicons name="videocam" size={14} color="#fff" />
                <Text style={styles.meetBtnText}>Lancer Google Meet</Text>
              </TouchableOpacity>
            </View>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesList}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 && (
              <Text style={styles.emptyText}>Commence la discussion avec {activeRoom}... ✨</Text>
            )}
            {messages.map((msg, idx) => (
              <View key={idx} style={[styles.messageBubble, msg.user_id === user?.id ? styles.myMessage : styles.theirMessage]}>
                <Text style={styles.messageUser}>{msg.username}</Text>
                <Text style={styles.messageText}>{msg.content}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputArea}>
            <TextInput 
              style={styles.chatInput} 
              placeholder="Écris ton message..." 
              value={newMessage}
              onChangeText={setNewMessage}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 30 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#4A3728' },
  subtitle: { fontSize: 14, color: '#8BAF76' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#4A3728', marginBottom: 15, marginTop: 10 },
  
  roomsGrid: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  roomCardSmall: { flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#F0E6D2' },
  roomNameSmall: { fontSize: 14, fontWeight: 'bold', color: '#4A3728', marginTop: 5 },
  roomSub: { fontSize: 11, color: '#8BAF76', fontWeight: 'bold' },

  partnersList: { gap: 12 },
  partnerItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#F0E6D2' },
  avatar: { width: 45, height: 45, borderRadius: 22.5 },
  partnerName: { fontSize: 16, fontWeight: 'bold', color: '#4A3728' },
  partnerStatus: { fontSize: 12, color: '#8BAF76' },
  chatIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F9F6F0', justifyContent: 'center', alignItems: 'center' },

  chatContainer: { flex: 1, backgroundColor: '#F9F6F0' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0E6D2' },
  chatRoomName: { fontSize: 18, fontWeight: 'bold', color: '#4A3728' },
  meetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#4285F4', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, marginTop: 4 },
  meetBtnText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  messagesList: { flex: 1, padding: 15 },
  emptyText: { textAlign: 'center', color: '#C4A882', fontStyle: 'italic', marginTop: 50 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 18, marginBottom: 10 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#8BAF76' },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: '#F0E6D2' },
  messageUser: { fontSize: 10, fontWeight: 'bold', marginBottom: 4, color: '#4A372850' },
  messageText: { fontSize: 14, color: '#4A3728' },
  inputArea: { flexDirection: 'row', padding: 15, paddingBottom: 30, backgroundColor: '#fff', alignItems: 'center', gap: 10 },
  chatInput: { flex: 1, backgroundColor: '#F9F6F0', borderRadius: 25, paddingHorizontal: 15, height: 45, color: '#4A3728' },
  sendBtn: { backgroundColor: '#8BAF76', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
});
