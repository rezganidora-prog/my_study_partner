import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { useTheme, DarkColors, LightColors } from '../../context/ThemeContext';

type Message = {
  id: string;
  text: string;
  isBot: boolean;
};

type ApiMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export default function ChatbotScreen() {
  const { isDark } = useTheme();
  const theme = isDark ? DarkColors : LightColors;

  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      text: "Bonjour ! Je suis Hibou, ton assistant d'étude dédié. 🦉 Je suis là pour t'aider à réviser tes cours, expliquer des concepts complexes ou organiser ton planning. Comment puis-je t'accompagner dans tes révisions aujourd'hui ?", 
      isBot: true 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (inputText.trim() === '' || isLoading) return;

    const userText = inputText.trim();
    const newUserMsg: Message = { id: Date.now().toString(), text: userText, isBot: false };
    const updatedMessages = [...messages, newUserMsg];

    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const apiMessages: ApiMessage[] = updatedMessages.slice(-10).map(m => ({
        role: m.isBot ? 'assistant' : 'user',
        content: m.text,
      }));

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://studypartner.app',
          'X-Title': 'Study Partner Pro',
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: "Tu es Hibou, un assistant d'étude sérieux, bienveillant et expert en pédagogie. Ton objectif est d'aider les étudiants à comprendre leurs cours. Utilise un ton professionnel mais encourageant. Si on te demande d'expliquer un concept, utilise des analogies claires. Réponds toujours en français."
            },
            ...apiMessages
          ],
        }),
      });

      if (!response.ok) throw new Error(`Erreur API: ${response.status}`);

      const data = await response.json();
      const botText = data.choices?.[0]?.message?.content || "Je n'ai pas pu générer de réponse. Pourrais-tu reformuler ta question ?";

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: botText, isBot: true }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: 'Désolé, je rencontre une petite difficulté technique pour me connecter à mon cerveau IA. Vérifie ta connexion. 🦉',
        isBot: true,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const displayMessages = isLoading
    ? [...messages, { id: 'loading', text: '', isBot: true }]
    : messages;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={[styles.avatarContainer, { backgroundColor: isDark ? '#242424' : '#FDF6E3', borderColor: theme.border }]}>
          <Text style={{ fontSize: 30 }}>🦉</Text>
          <View style={styles.onlineDot} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Hibou</Text>
          <Text style={[styles.headerStatus, { color: theme.primary }]}>Assistant d'étude IA • En ligne</Text>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="ellipsis-horizontal" size={24} color={theme.subtext} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={displayMessages}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[
            styles.messageWrapper, 
            item.isBot ? { alignItems: 'flex-start' } : { alignItems: 'flex-end' }
          ]}>
            <View style={[
              styles.messageBubble, 
              item.isBot 
                ? [styles.botBubble, { backgroundColor: theme.card, borderColor: theme.border }] 
                : [styles.userBubble, { backgroundColor: theme.primary }]
            ]}>
              {item.id === 'loading' ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={[styles.loadingText, { color: theme.subtext }]}>Hibou réfléchit...</Text>
                </View>
              ) : (
                <Text style={[styles.messageText, { color: item.isBot ? theme.text : '#fff' }]}>
                  {item.text}
                </Text>
              )}
            </View>
            <Text style={styles.timestamp}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.messagesList}
      />

      <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <View style={[styles.inputContainer, { backgroundColor: isDark ? '#242424' : '#F0F2F5', borderColor: theme.border }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Pose ta question à Hibou..."
            placeholderTextColor={isDark ? '#555' : '#8E8E93'}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: theme.primary }, (isLoading || !inputText.trim()) && { opacity: 0.5 }]}
            onPress={sendMessage}
            disabled={isLoading || !inputText.trim()}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: Platform.OS === 'ios' ? 55 : 35,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CD964',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerTitle: { fontSize: 17, fontWeight: 'bold' },
  headerStatus: { fontSize: 11, fontWeight: '600' },
  headerAction: { padding: 5 },
  messagesList: { padding: 15, paddingBottom: 30 },
  messageWrapper: { marginBottom: 15, maxWidth: '85%' },
  messageBubble: {
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    minHeight: 40,
  },
  botBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  messageText: { fontSize: 15, lineHeight: 21 },
  timestamp: { fontSize: 10, color: '#8E8E93', marginTop: 4, marginHorizontal: 5 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 13, fontStyle: 'italic' },
  inputWrapper: {
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 35 : 15,
    borderTopWidth: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 12,
    borderWidth: 0.5,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 5,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
