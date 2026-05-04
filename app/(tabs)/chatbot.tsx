import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '@/constants/GhibliTheme';
import { Ionicons } from '@expo/vector-icons';

export default function ChatbotScreen() {
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hoo hoo ! 🦉 Je suis Hibou, ton assistant magique. Je peux t\'aider à réviser tes grimoires ou répondre à tes questions d\'étude. Que souhaites-tu explorer aujourd\'hui ?', isBot: true }
  ]);
  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    if (inputText.trim() === '') return;
    
    const newUserMsg = { id: Date.now().toString(), text: inputText, isBot: false };
    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    
    // Simulate bot response
    setTimeout(() => {
      const botMsg = { id: (Date.now() + 1).toString(), text: 'C\'est une excellente question. Laisse-moi chercher la réponse dans la bibliothèque des anciens...', isBot: true };
      setMessages(prev => [...prev, botMsg]);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={{ fontSize: 30 }}>🦉</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>Hibou</Text>
          <Text style={styles.headerStatus}>✨ Assistant IA magique</Text>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.messageBubble, item.isBot ? styles.botBubble : styles.userBubble]}>
            <Text style={[styles.messageText, !item.isBot && styles.userMessageText]}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={styles.messagesList}
      />
      
      <View style={styles.inputWrapper}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Pose ta question à Hibou..."
            placeholderTextColor="#C4A882"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Ionicons name="sparkles" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F6F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0E6D2',
    gap: 15,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FDF6E3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8D9C0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3728',
  },
  headerStatus: {
    fontSize: 12,
    color: '#8BAF76',
    fontWeight: '600',
  },
  messagesList: {
    padding: 20,
    paddingBottom: 40,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  botBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: '#F0E6D2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },
  userBubble: {
    backgroundColor: '#8BAF76',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
    shadowColor: '#8BAF76',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4A3728',
  },
  userMessageText: {
    color: '#fff',
    fontWeight: '500',
  },
  inputWrapper: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0E6D2',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF6E3',
    borderRadius: 15,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E8D9C0',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
    color: '#4A3728',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#8BAF76',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  }
});
