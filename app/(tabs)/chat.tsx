import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { Card, TextInput, Button, List, ActivityIndicator, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useApp } from '@/contexts/AppContext';
import { ChatMessage } from '@/types';
import { aiService } from '@/services/aiService';

export default function ChatScreen() {
  const { t, i18n } = useTranslation();
  const { state, actions } = useApp();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const chatMessages = state.chatMessages;
  const userProfile = state.userProfile;
  const currentLanguage = i18n.language;

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message: message.trim(),
      sender: 'user',
      timestamp: new Date(),
      language: currentLanguage as 'en' | 'vi'
    };

    // Add user message immediately
    actions.addChatMessage(userMessage);
    const currentMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    try {
      // Get AI response
      const aiResponse = await aiService.sendMessage(
        currentMessage,
        userProfile,
        chatMessages,
        currentLanguage
      );

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
        language: currentLanguage as 'en' | 'vi'
      };

      actions.addChatMessage(aiMessage);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: t('common.error'),
        sender: 'ai',
        timestamp: new Date(),
        language: currentLanguage as 'en' | 'vi'
      };
      actions.addChatMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExamplePress = (exampleText: string) => {
    setMessage(exampleText);
  };

  const renderMessage = (msg: ChatMessage) => {
    const isUser = msg.sender === 'user';
    
    return (
      <View key={msg.id} style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.aiMessageContainer
      ]}>
        <Card style={[
          styles.messageCard,
          isUser ? styles.userMessageCard : styles.aiMessageCard
        ]}>
          <Card.Content>
            <ThemedText style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.aiMessageText
            ]}>
              {msg.message}
            </ThemedText>
            <ThemedText style={styles.messageTime}>
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </ThemedText>
          </Card.Content>
        </Card>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title">{t('chat.title')}</ThemedText>
        </View>

        {/* Chat Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {chatMessages.length === 0 ? (
            <View style={styles.welcomeContainer}>
              <ThemedText type="subtitle" style={styles.welcomeText}>
                {t('chat.title')}
              </ThemedText>
              <ThemedText style={styles.welcomeSubtext}>
                {t('chat.placeholder')}
              </ThemedText>
              
              {/* Example Questions */}
              <View style={styles.examplesContainer}>
                <ThemedText style={styles.examplesTitle}>
                  {t('chat.examples.title')}
                </ThemedText>
                <Chip 
                  style={styles.exampleChip}
                  onPress={() => handleExamplePress(t('chat.examples.recipe').replace(/"/g, ''))}
                >
                  {t('chat.examples.recipe')}
                </Chip>
                <Chip 
                  style={styles.exampleChip}
                  onPress={() => handleExamplePress(t('chat.examples.calories').replace(/"/g, ''))}
                >
                  {t('chat.examples.calories')}
                </Chip>
                <Chip 
                  style={styles.exampleChip}
                  onPress={() => handleExamplePress(t('chat.examples.plan').replace(/"/g, ''))}
                >
                  {t('chat.examples.plan')}
                </Chip>
              </View>
            </View>
          ) : (
            chatMessages.map(renderMessage)
          )}
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <Card style={styles.aiMessageCard}>
                <Card.Content style={styles.loadingContent}>
                  <ActivityIndicator size="small" />
                  <ThemedText style={styles.loadingText}>
                    {t('chat.typing')}
                  </ThemedText>
                </Card.Content>
              </Card>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={message}
            onChangeText={setMessage}
            placeholder={t('chat.placeholder')}
            mode="outlined"
            multiline
            maxLength={500}
            onSubmitEditing={handleSendMessage}
            disabled={isLoading}
          />
          <Button
            mode="contained"
            onPress={handleSendMessage}
            disabled={!message.trim() || isLoading}
            style={styles.sendButton}
          >
            {t('chat.send')}
          </Button>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    backgroundColor: '#4c669f',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 10,
    paddingBottom: 20,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageCard: {
    maxWidth: '80%',
    minWidth: '30%',
  },
  userMessageCard: {
    backgroundColor: '#4c669f',
  },
  aiMessageCard: {
    backgroundColor: '#fff',
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: 'white',
  },
  aiMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeText: {
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeSubtext: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 30,
  },
  examplesContainer: {
    alignItems: 'center',
    gap: 10,
  },
  examplesTitle: {
    fontWeight: '600',
    marginBottom: 10,
  },
  exampleChip: {
    marginVertical: 4,
  },
  loadingContainer: {
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'flex-end',
    gap: 10,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
  },
  sendButton: {
    alignSelf: 'flex-end',
  },
});
