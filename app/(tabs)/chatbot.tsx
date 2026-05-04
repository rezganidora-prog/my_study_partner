import React, { useRef, useState, useEffect } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Spacing } from '@/constants/GhibliTheme';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';

type Message = {
  id: string;
  text: string;
  isBot: boolean;
  attachment?: string;
};

const SUGGESTIONS = [
  { label: "📚 Résumer", action: "resume" },
  { label: "🧠 Créer un quiz", action: "quiz" },
  { label: "✨ Expliquer", action: "explain" },
];

export default function ChatbotScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      text: "Bonjour ! Je suis Hibou 🦉. Tu peux m'envoyer tes cours (PDF, Word) pour que je t'aide à les réviser !",
      isBot: true 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [attachedDoc, setAttachedDoc] = useState<{name: string, content: string} | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setIsUploading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Simulation d'extraction de texte (En prod: utiliser un Edge Function ou un parser local)
        // Pour cet exemple, on simule que le contenu est "Contenu du document..."
        // Dans une vraie app, on enverrait le fichier à Supabase Storage d'abord.

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const filePath = `${user.id}/${Date.now()}_${file.name}`;

          // Note: L'extraction de texte côté client en React Native est limitée.
          // On stocke le fichier dans le storage pour référence.
          setAttachedDoc({ name: file.name, content: "[Texte extrait du document: " + file.name + "]" });

          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: `Document attaché : ${file.name} 📄`,
            isBot: false,
            attachment: file.name
          }]);
        }
      }
    } catch (err) {
      console.log('Error picking document:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const sendMessage = async (actionType?: string) => {
    let text = inputText;
    if (actionType === 'resume') text = "Fais-moi un résumé structuré de ce document.";
    if (actionType === 'quiz') text = "Génère un quiz de 5 questions basé sur ce document.";
    if (actionType === 'explain') text = "Explique-moi les concepts clés de ce document simplement.";

    if (!text.trim() && !attachedDoc) return;
    if (isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMsg = { id: Date.now().toString(), text, isBot: false };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const context = attachedDoc ? `CONCOURS DE L'ÉTUDIANT (Document: ${attachedDoc.name}):\n${attachedDoc.content}\n\n` : "";

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: "Tu es Hibou, un assistant d'étude expert. Tu réponds aux questions de l'étudiant. S'il y a un document fourni, utilise-le comme source principale. Sois pédagogue et encourageant. Réponds en français."
            },
            { role: 'user', content: context + text }
          ],
        }),
      });

      const data = await response.json();
      const botText = data.choices?.[0]?.message?.content || "Je n'ai pas pu analyser le document. Réessaie ?";

      setMessages(prev => [...prev, { id: Date.now().toString(), text: botText, isBot: true }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: 'err', text: "Oups, Hibou a eu un problème technique. 🦉", isBot: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.brown} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Assistant Étude</Text>
          <Text style={styles.headerStatus}>{attachedDoc ? `Analyse : ${attachedDoc.name}` : 'Prêt à t\'aider 🦉'}</Text>
        </View>
        <TouchableOpacity onPress={pickDocument} disabled={isUploading}>
          {isUploading ? <ActivityIndicator size="small" color={Colors.green} /> : <Ionicons name="document-attach-outline" size={26} color={Colors.green} />}
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.isBot ? styles.botBubble : styles.userBubble]}>
            <Text style={[styles.messageText, item.isBot ? styles.botText : styles.userText]}>
              {item.text}
            </Text>
          </View>
        )}
      />

      <View style={styles.inputArea}>
        {attachedDoc && (
          <View style={styles.actionsContainer}>
            <Text style={styles.actionLabel}>Actions sur le document :</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionScroll}>
              {SUGGESTIONS.map((s, i) => (
                <TouchableOpacity key={i} style={styles.suggestionPill} onPress={() => sendMessage(s.action)}>
                  <Text style={styles.suggestionText}>{s.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.suggestionPill, {borderColor: Colors.accent}]} onPress={() => setAttachedDoc(null)}>
                <Text style={[styles.suggestionText, {color: Colors.accent}]}>Retirer le fichier</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Pose une question sur ton cours..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() && !attachedDoc) && { opacity: 0.5 }]}
            onPress={() => sendMessage()}
            disabled={(!inputText.trim() && !attachedDoc) || isLoading}
          >
            {isLoading ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="send" size={20} color="white" />}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.beige },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 15,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, ...Shadows.small
  },
  headerInfo: { flex: 1, marginLeft: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.brown },
  headerStatus: { fontSize: 12, color: Colors.green, fontWeight: '600' },
  listContent: { padding: 20, paddingBottom: 30 },
  bubble: { padding: 14, borderRadius: 20, marginBottom: 15, maxWidth: '85%', ...Shadows.small },
  botBubble: { alignSelf: 'flex-start', backgroundColor: Colors.white, borderBottomLeftRadius: 4 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: Colors.green, borderBottomRightRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 22 },
  botText: { color: Colors.brown },
  userText: { color: 'white', fontWeight: '500' },
  inputArea: { padding: 15, backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, ...Shadows.medium },
  actionsContainer: { marginBottom: 15 },
  actionLabel: { fontSize: 11, fontWeight: 'bold', color: Colors.tan, textTransform: 'uppercase', marginBottom: 8, marginLeft: 5 },
  suggestionScroll: { flexDirection: 'row' },
  suggestionPill: { backgroundColor: Colors.beige, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: Colors.border },
  suggestionText: { fontSize: 12, fontWeight: '700', color: Colors.brownLight },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, backgroundColor: Colors.beige, borderRadius: 15, paddingHorizontal: 15, paddingVertical: 12, maxHeight: 100, color: Colors.brown, fontSize: 15 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.green, justifyContent: 'center', alignItems: 'center', ...Shadows.green },
});
