import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Text from '../ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReportData } from './FeedCard';

const COLORS = {
  primary: '#1D9E75',
  white: '#FFFFFF',
  textPrimary: '#1A1D21',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E8ECF0',
  category: {
    trash: '#E24B4A',
    water: '#378ADD',
    wildlife: '#BA7517',
    electronic: '#7F77DD',
    organic: '#1D9E75',
    other: '#6B7280',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  trash: 'Basura',
  water: 'Agua',
  wildlife: 'Vida silvestre',
  electronic: 'Electronico',
  organic: 'Organico',
  other: 'Otro',
};

const CATEGORIES = ['todos', 'trash', 'water', 'wildlife', 'electronic', 'organic'];
const CATEGORY_FILTER_LABELS: Record<string, string> = {
  todos: 'Todos',
  trash: 'Basura',
  water: 'Agua',
  wildlife: 'Vida silvestre',
  electronic: 'Electronico',
  organic: 'Organico',
};

interface SearchSheetProps {
  visible: boolean;
  reports: ReportData[];
  onClose: () => void;
  onSelectReport: (report: ReportData) => void;
}

export default function SearchSheet({
  visible,
  reports,
  onClose,
  onSelectReport,
}: SearchSheetProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');

  const filteredReports = reports.filter((r) => {
    const matchesQuery =
      !query.trim() ||
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      r.description.toLowerCase().includes(query.toLowerCase()) ||
      r.userName.toLowerCase().includes(query.toLowerCase()) ||
      r.location.toLowerCase().includes(query.toLowerCase());

    const matchesCategory =
      categoryFilter === 'todos' || r.category === categoryFilter;

    return matchesQuery && matchesCategory;
  });

  const handleSelect = (report: ReportData) => {
    setQuery('');
    setCategoryFilter('todos');
    onSelectReport(report);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Search header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </Pressable>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search" size={18} color={COLORS.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar reportes, usuarios, lugares..."
              placeholderTextColor={COLORS.textTertiary}
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Category filters */}
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesBar}
          contentContainerStyle={styles.categoriesContent}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const isActive = categoryFilter === item;
            const catColor = item === 'todos' ? COLORS.primary : (COLORS.category as any)[item];
            return (
              <Pressable
                style={[
                  styles.catPill,
                  isActive && { backgroundColor: catColor, borderColor: catColor },
                ]}
                onPress={() => setCategoryFilter(item)}
              >
                <Text
                  style={[
                    styles.catPillText,
                    isActive && { color: '#FFF' },
                  ]}
                >
                  {CATEGORY_FILTER_LABELS[item]}
                </Text>
              </Pressable>
            );
          }}
        />

        {/* Results */}
        <FlatList
          data={filteredReports}
          keyExtractor={(item) => item.id}
          style={styles.results}
          contentContainerStyle={filteredReports.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyTitle}>
                {query ? 'Sin resultados' : 'Busca reportes'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {query
                  ? `No se encontraron reportes para "${query}"`
                  : 'Escribe para buscar por titulo, usuario o ubicacion'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const catColor = (COLORS.category as any)[item.category] || COLORS.category.other;
            return (
              <Pressable style={styles.resultRow} onPress={() => handleSelect(item)}>
                <View style={styles.resultIcon}>
                  <Ionicons
                    name={
                      item.category === 'trash'
                        ? 'trash-outline'
                        : item.category === 'water'
                        ? 'water-outline'
                        : item.category === 'wildlife'
                        ? 'leaf-outline'
                        : item.category === 'electronic'
                        ? 'hardware-chip-outline'
                        : 'nutrition-outline'
                    }
                    size={22}
                    color={catColor}
                  />
                </View>
                <View style={styles.resultContent}>
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.resultMeta} numberOfLines={1}>
                    {item.userName} -- {item.location} -- {item.timeAgo}
                  </Text>
                </View>
                <View style={[styles.resultBadge, { backgroundColor: catColor + '18' }]}>
                  <Text style={[styles.resultBadgeText, { color: catColor }]}>
                    {CATEGORY_LABELS[item.category]}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  categoriesBar: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoriesContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  results: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  resultIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  resultMeta: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  resultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
