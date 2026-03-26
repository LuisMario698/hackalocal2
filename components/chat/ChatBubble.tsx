import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import Text from '../ScaledText';
import { useColors } from '../../contexts/ThemeContext';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

export default function ChatBubble({ role, content, imageUrl }: ChatBubbleProps) {
  const C = useColors();
  const styles = makeStyles(C);
  const isUser = role === 'user';

  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>SC</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.bubbleImage} />
        )}
        <Text style={[styles.text, isUser && styles.textUser]}>{content}</Text>
      </View>
    </View>
  );
}

const makeStyles = (C: any) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 16,
    maxWidth: '85%',
  },
  rowUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '100%',
  },
  bubbleUser: {
    backgroundColor: C.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: C.borderLight,
    borderBottomLeftRadius: 4,
  },
  bubbleImage: {
    width: 180,
    height: 180,
    borderRadius: 12,
    marginBottom: 8,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
    color: C.text,
  },
  textUser: {
    color: '#FFFFFF',
  },
});
