import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { LearnItem } from '../../constants/LearnData';
import { useColors } from '../../contexts/ThemeContext';

interface Props {
  item: LearnItem;
}

export default function LearnArticleCard({ item }: Props) {
  const C = useColors();
  const styles = makeStyles(C);
  const handlePress = async () => {
    try {
      await Linking.openURL(item.url);
    } catch (e) {
      console.warn('Cannot open URL:', e);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="document-text" size={24} color={C.primary} />
        </View>
        <View style={styles.tagContainer}>
          <Text style={styles.tagText}>Documento / Paper</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={3}>
          {item.title}
        </Text>
        <Text style={styles.source}>
          <Ionicons name="business-outline" size={14} color={C.textSecondary} /> {item.source}
        </Text>
        
        {item.summary && (
          <Text style={styles.summary} numberOfLines={3}>
            {item.summary}
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.readText}>Leer documento</Text>
        <Ionicons name="arrow-forward" size={16} color={C.primary} />
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (C: any) => StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  tagContainer: {
    backgroundColor: C.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    color: C.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  content: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: C.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  source: {
    fontSize: 14,
    color: C.textSecondary,
    fontWeight: '500',
    marginBottom: 8,
  },
  summary: {
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
    paddingTop: 12,
  },
  readText: {
    color: C.primary,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
});
