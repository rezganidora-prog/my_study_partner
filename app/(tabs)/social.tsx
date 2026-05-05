import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, TextInput, Modal, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';

const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes.buffer;
};

const FICTIONAL_PARTNERS = [
  {
    id: 'fictional-1',
    full_name: 'Sarah',
    username: 'sarah_maths',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/png?seed=Sarah&backgroundColor=b6e3f4',
    specialty: 'Génie Maths 🧮',
    responses: [
      "Bonne question ! En maths, il faut comprendre le concept avant tout 💡",
      "Moi je révise toujours avec des fiches récapitulatives 📝",
      "On peut faire un quiz ensemble ! 🎯",
      "Essaie les exercices du chapitre 3, ils sont vraiment bien 👍",
      "Tu veux qu'on fasse une session de révision ce soir ? 📚",
    ],
  },
  {
    id: 'fictional-2',
    full_name: 'Thomas',
    username: 'thomas_ai',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/png?seed=Thomas&backgroundColor=c0aede',
    specialty: 'IA & Algo 🤖',
    responses: [
      "En IA, la clé c'est la qualité des données 📊",
      "J'utilise Python pour tout, c'est tellement puissant ! 🐍",
      "Tu connais les réseaux de neurones convolutifs ? 🧠",
      "Je peux t'expliquer les algorithmes de tri si tu veux 😊",
      "ChatGPT c'est bien mais comprendre les bases c'est mieux 🔥",
    ],
  },
  {
    id: 'fictional-3',
    full_name: 'Léa',
    username: 'lea_design',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/png?seed=Lea&backgroundColor=ffd5dc',
    specialty: 'Design & UX 🎨',
    responses: [
      "Le design c'est avant tout penser à l'utilisateur ! 🎯",
      "J'adore Figma pour créer mes maquettes 💜",
      "On peut faire une session créative ensemble 🌟",
      "La couleur et la typographie, c'est 80% du design ! ✨",
      "Tu veux des retours sur ton interface ? Je peux regarder 👀",
    ],
  },
];

export default function SocialScreen() {
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [realPartners, setRealPartners] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [unreadMap, setUnreadMap] = useState<{ [roomId: string]: number }>({});
  const [lastMsgMap, setLastMsgMap] = useState<{ [roomId: string]: string }>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const activeRoomRef = useRef<any>(null);

  useEffect(() => {
    initUser();
  }, []);

  const initUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    await fetchRealPartners(data.user?.id);
  };

  // Sync activeRoom to ref so subscription callback can read it
  useEffect(() => { activeRoomRef.current = activeRoom; }, [activeRoom]);

  // Global listener for unread messages
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('global-unread')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as any;
          const roomId: string = msg.room_id;
          // Only private rooms involving current user
          if (!roomId.includes(user.id)) return;
          // Ignore own messages
          if (msg.user_id === user.id) return;
          const cur = activeRoomRef.current;
          const activeId = cur
            ? (cur.type === 'user' ? getPrivateRoomId(user.id, cur.id) : cur.id)
            : null;
          if (activeId !== roomId) {
            setUnreadMap(prev => ({ ...prev, [roomId]: (prev[roomId] || 0) + 1 }));
            setLastMsgMap(prev => ({ ...prev, [roomId]: msg.content || '📷 Image' }));
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const openRoom = (room: any) => {
    setActiveRoom(room);
    if (room.type === 'user') {
      const roomId = getPrivateRoomId(user?.id, room.id);
      setUnreadMap(prev => ({ ...prev, [roomId]: 0 }));
    }
  };

  const getPrivateRoomId = (user1: string, user2: string) =>
    [user1, user2].sort().join('--');

  useEffect(() => {
    if (!activeRoom) return;

    if (activeRoom.id.startsWith('fictional-')) {
      const partner = FICTIONAL_PARTNERS.find((p) => p.id === activeRoom.id);
      setMessages([{
        id: 'm1',
        username: partner?.username,
        content: 'Salut ! On révise ensemble ? 👋',
        user_id: 'fictional',
      }]);
      return;
    }

    const roomId =
      activeRoom.type === 'user'
        ? getPrivateRoomId(user?.id, activeRoom.id)
        : activeRoom.id;

    fetchMessages(roomId);

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeRoom]);

  const fetchRealPartners = async (currentUserId?: string) => {
    setLoadingPartners(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url')
      .limit(30);
    if (!error && data) {
      setRealPartners(data.filter((p) => p.id !== currentUserId));
    }
    setLoadingPartners(false);
  };

  const fetchMessages = async (roomId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const sendMessage = async (
    content?: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video'
  ) => {
    if (!user || !activeRoom) return;
    if (!content?.trim() && !mediaUrl) return;

    if (activeRoom.id.startsWith('fictional-')) {
      const partner = FICTIONAL_PARTNERS.find((p) => p.id === activeRoom.id);
      const myMsg = {
        id: Date.now().toString(),
        username: user.email?.split('@')[0],
        content: content || '',
        media_url: mediaUrl || null,
        media_type: mediaType || null,
        user_id: user.id,
      };
      setMessages((prev) => [...prev, myMsg]);
      setNewMessage('');
      setTimeout(() => {
        const responses = partner?.responses ?? ['Super ! 👍'];
        const response = responses[Math.floor(Math.random() * responses.length)];
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          username: partner?.username,
          content: response,
          user_id: 'fictional',
        }]);
      }, 1500);
      return;
    }

    const roomId =
      activeRoom.type === 'user'
        ? getPrivateRoomId(user.id, activeRoom.id)
        : activeRoom.id;

    setNewMessage('');
    const { data, error } = await supabase
      .from('messages')
      .insert({
        user_id: user.id,
        room_id: roomId,
        content: content || '',
        username: user.email?.split('@')[0],
        media_url: mediaUrl || null,
        media_type: mediaType || null,
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) =>
        prev.some((m) => m.id === data.id) ? prev : [...prev, data]
      );
    }
  };

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', "Autorise l'accès à ta galerie.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) uploadMedia(result.assets[0]);
  };

  const uploadMedia = async (asset: any) => {
    setUploading(true);
    try {
      if (activeRoom?.id.startsWith('fictional-')) {
        await sendMessage('', asset.uri, 'image');
        return;
      }
      const filePath = `${user.id}/${Date.now()}.jpg`;
      const arrayBuffer = decodeBase64(asset.base64!);
      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, arrayBuffer, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('chat-media').getPublicUrl(filePath);
      await sendMessage('', data.publicUrl, 'image');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setUploading(false);
    }
  };

  const filteredPartners = realPartners.filter((p) =>
    (p.full_name || p.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const partnerDisplayName = activeRoom?.full_name || activeRoom?.name || 'Chat';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Study With Others 🤝</Text>
          <Text style={styles.subtitle}>Retrouve tes collègues et apprends ensemble</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8BAF76" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un collègue..."
            placeholderTextColor="#C4A882"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Salons publics */}
        <Text style={styles.sectionTitle}>Salons Publics 📖</Text>
        <View style={styles.roomsGrid}>
          {['Bibliothèque', 'Cafétéria'].map((name) => (
            <TouchableOpacity
              key={name}
              style={styles.roomCardSmall}
              onPress={() => openRoom({ id: name, name, type: 'room' })}
            >
              <Ionicons name="people" size={22} color="#8BAF76" />
              <Text style={styles.roomNameSmall}>{name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Partenaires Demo */}
        <Text style={styles.sectionTitle}>Partenaires Demo 🌟</Text>
        <View style={styles.partnersList}>
          {FICTIONAL_PARTNERS.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.partnerItem, styles.demoPartnerItem]}
              onPress={() => openRoom({ ...p, type: 'fictional' })}
            >
              <Image source={{ uri: p.avatar_url }} style={styles.avatar} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.partnerName}>{p.full_name}</Text>
                  <View style={styles.demoBadge}>
                    <Text style={styles.demoBadgeText}>DEMO</Text>
                  </View>
                </View>
                <Text style={styles.partnerStatus}>{p.specialty}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8BAF76" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Collègues réels */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Collègues Réels 👥</Text>
        {loadingPartners ? (
          <ActivityIndicator color="#8BAF76" style={{ marginVertical: 20 }} />
        ) : filteredPartners.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={32} color="#C4A882" />
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Aucun résultat pour cette recherche'
                : "Aucun collègue pour l'instant. Invite des amis !"}
            </Text>
          </View>
        ) : (
          <View style={styles.partnersList}>
            {filteredPartners.map((p) => {
              const roomId = getPrivateRoomId(user?.id, p.id);
              const unread = unreadMap[roomId] || 0;
              const lastMsg = lastMsgMap[roomId];
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.partnerItem, unread > 0 && styles.partnerItemUnread]}
                  onPress={() => openRoom({ id: p.id, name: p.full_name || p.username || 'Collègue', full_name: p.full_name, type: 'user' })}
                >
                  <View style={styles.avatarWrapper}>
                    <Image
                      source={{ uri: p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name || p.username || 'U')}&background=8BAF76&color=fff` }}
                      style={styles.avatar}
                    />
                    {unread > 0 && <View style={styles.onlineDot} />}
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.partnerName, unread > 0 && { color: '#4A3728', fontWeight: '800' }]}>
                      {p.full_name || p.username || 'Collègue'}
                    </Text>
                    <Text style={[styles.partnerStatus, unread > 0 && { color: '#8BAF76', fontWeight: '600' }]} numberOfLines={1}>
                      {lastMsg || 'Appuyer pour discuter →'}
                    </Text>
                  </View>
                  {unread > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{unread}</Text>
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color="#C4A882" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal Chat */}
      <Modal visible={!!activeRoom} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatContainer}
        >
          {/* Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => { setActiveRoom(null); setMessages([]); }}>
              <Ionicons name="chevron-down" size={28} color="#4A3728" />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <View style={styles.chatTitleRow}>
                <Text style={styles.chatRoomName}>{partnerDisplayName}</Text>
                {activeRoom?.id?.startsWith('fictional-') && (
                  <View style={[styles.demoBadge, { marginLeft: 8 }]}>
                    <Text style={styles.demoBadgeText}>DEMO</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.meetBtn}
                onPress={() => WebBrowser.openBrowserAsync('https://meet.google.com/landing')}
              >
                <Ionicons name="videocam" size={14} color="#fff" />
                <Text style={styles.meetBtnText}>Google Meet</Text>
              </TouchableOpacity>
            </View>
            <View style={{ width: 28 }} />
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesList}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg, idx) => {
              const isMine = msg.user_id === user?.id;
              return (
                <View
                  key={idx}
                  style={[
                    styles.msgWrapper,
                    isMine ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' },
                  ]}
                >
                  {!isMine && (
                    <Text style={styles.msgUsername}>{msg.username}</Text>
                  )}
                  <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
                    {msg.media_url && (
                      <Image
                        source={{ uri: msg.media_url }}
                        style={styles.msgImage}
                        resizeMode="cover"
                      />
                    )}
                    {msg.content ? (
                      <Text style={[styles.msgText, isMine && { color: '#fff' }]}>
                        {msg.content}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Zone de saisie */}
          <View style={styles.inputArea}>
            <TouchableOpacity style={styles.plusBtn} onPress={pickMedia} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator size="small" color="#8BAF76" />
              ) : (
                <Ionicons name="add-circle" size={30} color="#8BAF76" />
              )}
            </TouchableOpacity>
            <TextInput
              style={styles.chatInput}
              placeholder="Écris à ton collègue..."
              placeholderTextColor="#C4A882"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
              onPress={() => sendMessage(newMessage)}
              disabled={!newMessage.trim()}
            >
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
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 30 },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#4A3728' },
  subtitle: { fontSize: 13, color: '#8BAF76', fontWeight: '600', marginTop: 4 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 15, paddingHorizontal: 15, height: 50, marginBottom: 25,
    borderWidth: 1, borderColor: '#F0E6D2',
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#4A3728' },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#4A3728', marginBottom: 12 },
  roomsGrid: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  roomCardSmall: {
    flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#F0E6D2',
  },
  roomNameSmall: { fontSize: 13, fontWeight: 'bold', color: '#4A3728', marginTop: 4 },
  partnersList: { gap: 10, marginBottom: 10 },
  partnerItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 12, borderRadius: 20, borderWidth: 1, borderColor: '#F0E6D2',
  },
  demoPartnerItem: { backgroundColor: '#F1F8E9', borderColor: '#C8E6C9' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  partnerName: { fontSize: 15, fontWeight: 'bold', color: '#4A3728' },
  demoBadge: {
    backgroundColor: '#8BAF76', paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 8,
  },
  demoBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
  partnerStatus: { fontSize: 12, color: '#C4A882', marginTop: 2 },
  partnerItemUnread: { backgroundColor: '#F1F8E9', borderColor: '#8BAF76' },
  avatarWrapper: { position: 'relative' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#8BAF76', borderWidth: 2, borderColor: '#fff' },
  unreadBadge: { backgroundColor: '#D48C8C', minWidth: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  emptyState: {
    backgroundColor: '#fff', borderRadius: 16, padding: 25,
    alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#F0E6D2',
  },
  emptyText: { color: '#C4A882', fontSize: 14, textAlign: 'center' },
  chatContainer: { flex: 1, backgroundColor: '#FDF6E3' },
  chatHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 15, paddingTop: Platform.OS === 'ios' ? 55 : 25,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0E6D2',
  },
  chatTitleRow: { flexDirection: 'row', alignItems: 'center' },
  chatRoomName: { fontSize: 17, fontWeight: 'bold', color: '#4A3728' },
  meetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#4285F4',
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 15, marginTop: 5,
  },
  meetBtnText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  messagesList: { flex: 1, padding: 15 },
  msgWrapper: { marginBottom: 10, width: '100%' },
  msgUsername: { fontSize: 11, color: '#8B735B', marginBottom: 3, marginLeft: 4 },
  bubble: { maxWidth: '75%', padding: 10, borderRadius: 18 },
  myBubble: { backgroundColor: '#8BAF76' },
  theirBubble: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#F0E6D2' },
  msgText: { fontSize: 14, color: '#4A3728', lineHeight: 20 },
  msgImage: { width: 200, height: 150, borderRadius: 10, marginBottom: 5 },
  inputArea: {
    flexDirection: 'row', padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 35 : 15,
    backgroundColor: '#fff', alignItems: 'center', gap: 8,
    borderTopWidth: 1, borderTopColor: '#F0E6D2',
  },
  plusBtn: { padding: 2 },
  chatInput: {
    flex: 1, backgroundColor: '#F9F6F0', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 8, maxHeight: 80,
    color: '#4A3728', fontSize: 14,
  },
  sendBtn: {
    backgroundColor: '#8BAF76', width: 40, height: 40,
    borderRadius: 20, justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#C4A882' },
});
