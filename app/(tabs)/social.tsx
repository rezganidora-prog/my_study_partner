import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Image, TextInput, Modal, KeyboardAvoidingView, 
  Platform, Alert, Linking, ActivityIndicator, Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

export default function SocialScreen() {
  const [activeRoom, setActiveRoom] = useState<any>(null); // { id, name, type: 'room'|'user' }
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetchPartners();
  }, []);

  useEffect(() => {
    if (activeRoom) {
      fetchMessages();
      const channel = supabase
        .channel(`public:messages:${activeRoom.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `room_id=eq.${activeRoom.id}` 
        }, (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [activeRoom]);

  const fetchPartners = async () => {
    const { data, error } = await supabase.from('profiles').select('*').limit(20);
    if (!error && data) {
      setPartners(data.filter(p => p.id !== user?.id));
    }
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', activeRoom.id)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const sendMessage = async (content?: string, mediaUrl?: string, mediaType?: 'image' | 'video') => {
    if (!user || !activeRoom) return;
    if (!content?.trim() && !mediaUrl) return;

    const { error } = await supabase.from('messages').insert({
      user_id: user.id,
      room_id: activeRoom.id,
      content: content || '',
      username: user.email.split('@')[0],
      media_url: mediaUrl || null,
      media_type: mediaType || null
    });

    if (error) {
      Alert.alert("Erreur 🛑", "Impossible d'envoyer le message. Vérifie ta config SQL !");
    } else {
      setNewMessage('');
    }
  };

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      uploadMedia(result.assets[0]);
    }
  };

  const uploadMedia = async (asset: any) => {
    try {
      setUploading(true);
      const fileExt = asset.uri.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      const type = asset.type === 'video' ? 'video' : 'image';

      // Conversion de l'URI en Blob (Méthode native Expo)
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, blob, {
          contentType: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('chat-media').getPublicUrl(filePath);
      sendMessage('', data.publicUrl, type);
    } catch (error: any) {
      Alert.alert('Erreur Upload 🛑', "Vérifie que le bucket 'chat-media' est créé sur ton Supabase !");
    } finally {
      setUploading(false);
    }
  };

  const openMeet = () => {
    const meetId = activeRoom?.id.replace(/\s/g, '-').toLowerCase();
    Linking.openURL(`https://meet.google.com/new`);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Study With Others 🤝</Text>
          <Text style={styles.subtitle}>Travaille avec tes vrais collègues</Text>
        </View>

        <Text style={styles.sectionTitle}>Salons d'étude 📖</Text>
        <View style={styles.roomsGrid}>
          {['Bibliothèque', 'Salle de Maths', 'Cafétéria'].map(name => (
            <TouchableOpacity 
              key={name} 
              style={styles.roomCardSmall} 
              onPress={() => setActiveRoom({ id: name, name, type: 'room' })}
            >
              <Ionicons name="people" size={24} color="#8BAF76" />
              <Text style={styles.roomNameSmall}>{name}</Text>
              <Text style={styles.roomSub}>Rejoindre</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Mes Collègues en ligne 👥</Text>
        <View style={styles.partnersList}>
          {partners.map(p => (
            <TouchableOpacity 
              key={p.id} 
              style={styles.partnerItem} 
              onPress={() => setActiveRoom({ id: p.id, name: p.full_name || p.username || 'Collègue', type: 'user' })}
            >
              <Image 
                source={{ uri: p.avatar_url || `https://ui-avatars.com/api/?name=${p.username}&background=random` }} 
                style={styles.avatar} 
              />
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.partnerName}>{p.full_name || p.username || 'Collègue'}</Text>
                <Text style={styles.partnerStatus}>✨ Prêt à réviser</Text>
              </View>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color="#8BAF76" />
            </TouchableOpacity>
          ))}
          {partners.length === 0 && <Text style={styles.emptyText}>Aucun autre étudiant trouvé... 🦉</Text>}
        </View>
      </ScrollView>

      <Modal visible={!!activeRoom} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => { setActiveRoom(null); setMessages([]); }}>
              <Ionicons name="chevron-down" size={28} color="#4A3728" />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.chatRoomName}>{activeRoom?.name}</Text>
              <TouchableOpacity style={styles.meetBtn} onPress={openMeet}>
                <Ionicons name="videocam" size={14} color="#fff" />
                <Text style={styles.meetBtnText}>Google Meet réel</Text>
              </TouchableOpacity>
            </View>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesList}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg, idx) => (
              <View key={idx} style={[styles.msgWrapper, msg.user_id === user?.id ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                <Text style={styles.msgUsername}>{msg.username}</Text>
                <View style={[styles.bubble, msg.user_id === user?.id ? styles.myBubble : styles.theirBubble]}>
                  {msg.media_url ? (
                    msg.media_type === 'image' ? (
                      <Image source={{ uri: msg.media_url }} style={styles.msgImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.videoPlaceholder}>
                        <Ionicons name="play-circle" size={40} color="#fff" />
                        <Text style={{ color: '#fff', fontSize: 10 }}>Vidéo reçue</Text>
                      </View>
                    )
                  ) : null}
                  {msg.content ? <Text style={[styles.msgText, msg.user_id === user?.id && { color: '#fff' }]}>{msg.content}</Text> : null}
                </View>
              </View>
            ))}
          </ScrollView>

          {uploading && <ActivityIndicator style={{ marginBottom: 10 }} color="#8BAF76" />}

          <View style={styles.inputArea}>
            <TouchableOpacity style={styles.plusBtn} onPress={pickMedia}>
              <Ionicons name="add-circle" size={30} color="#8BAF76" />
            </TouchableOpacity>
            <TextInput 
              style={styles.chatInput} 
              placeholder="Écris un message..." 
              placeholderTextColor="#C4A882"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={() => sendMessage(newMessage)}>
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6E3' },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#4A3728' },
  subtitle: { fontSize: 14, color: '#8BAF76', fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#4A3728', marginBottom: 15, marginTop: 10 },
  roomsGrid: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  roomCardSmall: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#F0E6D2' },
  roomNameSmall: { fontSize: 14, fontWeight: 'bold', color: '#4A3728', marginTop: 5 },
  roomSub: { fontSize: 11, color: '#8BAF76', fontWeight: 'bold' },
  partnersList: { gap: 12 },
  partnerItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 22, borderWidth: 1, borderColor: '#F0E6D2' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F9F6F0' },
  partnerName: { fontSize: 16, fontWeight: 'bold', color: '#4A3728' },
  partnerStatus: { fontSize: 12, color: '#8BAF76' },
  emptyText: { textAlign: 'center', color: '#C4A882', marginTop: 20, fontStyle: 'italic' },

  chatContainer: { flex: 1, backgroundColor: '#FDF6E3' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0E6D2' },
  chatRoomName: { fontSize: 18, fontWeight: 'bold', color: '#4A3728' },
  meetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#4285F4', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, marginTop: 4 },
  meetBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  messagesList: { flex: 1, padding: 15 },
  msgWrapper: { marginBottom: 15, width: '100%' },
  msgUsername: { fontSize: 10, color: '#C4A882', marginBottom: 4, marginLeft: 5 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 20, overflow: 'hidden' },
  myBubble: { backgroundColor: '#8BAF76', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#F0E6D2' },
  msgText: { fontSize: 15, lineHeight: 21, color: '#4A3728' },
  msgImage: { width: 220, height: 160, borderRadius: 12, marginBottom: 8 },
  videoPlaceholder: { width: 220, height: 160, backgroundColor: '#000', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  inputArea: { flexDirection: 'row', padding: 15, paddingBottom: Platform.OS === 'ios' ? 40 : 20, backgroundColor: '#fff', alignItems: 'center', gap: 10 },
  plusBtn: { padding: 5 },
  chatInput: { flex: 1, backgroundColor: '#F9F6F0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, maxHeight: 100, color: '#4A3728' },
  sendBtn: { backgroundColor: '#8BAF76', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
});
