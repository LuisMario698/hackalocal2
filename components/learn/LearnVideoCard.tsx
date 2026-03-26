import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { LearnItem } from '../../constants/LearnData';
import { useColors } from '../../contexts/ThemeContext';

interface Props {
  item: LearnItem;
}

export default function LearnVideoCard({ item }: Props) {
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
      <View style={styles.thumbnailContainer}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
            <Ionicons name="videocam-outline" size={40} color="#9ca3af" />
          </View>
        )}
        <View style={styles.playButtonContainer}>
          <View style={styles.playButton}>
            <Ionicons name="play" size={24} color="#fff" />
          </View>
        </View>
        {item.duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{item.duration}</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.tagContainer}>
          <Text style={styles.tagText}>Video Educativo</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.source}>
        <Ionicons name="business-outline" size={14} color={C.textSecondary} /> {item.source}
        </Text>
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
  },
  thumbnailContainer: {
    height: 180,
    width: '100%',
    backgroundColor: C.borderLight,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderThumbnail: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.border,
  },
  playButtonContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  tagContainer: {
    alignSelf: 'flex-start',
    backgroundColor: C.primary + '1A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  tagText: {
    color: C.primary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
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
  },
});
