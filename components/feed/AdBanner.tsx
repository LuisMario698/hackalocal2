import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import Text from '../ScaledText';
import { Ionicons } from '@expo/vector-icons';

export interface AdData {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  sponsor: string;
  icon: string;
  gradient: [string, string];
}

export const SAMPLE_ADS: AdData[] = [
  {
    id: 'ad-1',
    title: 'Recicla y Gana',
    description: 'Lleva tus reciclables a EcoCenter y recibe 2x eco-puntos este mes. Plastico, vidrio y carton.',
    ctaText: 'Conocer ubicaciones',
    sponsor: 'EcoCenter Puerto Penasco',
    icon: 'leaf',
    gradient: ['#059669', '#10B981'],
  },
  {
    id: 'ad-2',
    title: 'Agua Purificada EcoAgua',
    description: 'Rellena tu garrrafon por solo $15 y ayuda a reducir el uso de botellas de plastico.',
    ctaText: 'Ver promocion',
    sponsor: 'EcoAgua - Agua sustentable',
    icon: 'water',
    gradient: ['#2563EB', '#3B82F6'],
  },
  {
    id: 'ad-3',
    title: 'Tienda Verde',
    description: 'Bolsas reutilizables, popotes de acero y productos eco-friendly. 10% de descuento con tu nivel de Social Clean.',
    ctaText: 'Ir a la tienda',
    sponsor: 'Tienda Verde PP',
    icon: 'storefront',
    gradient: ['#7C3AED', '#8B5CF6'],
  },
];

interface AdBannerProps {
  ad: AdData;
}

export default function AdBanner({ ad }: AdBannerProps) {
  return (
    <View style={[styles.container, { backgroundColor: ad.gradient[0] }]}>
      <View style={styles.sponsorRow}>
        <Ionicons name="megaphone-outline" size={11} color="rgba(255,255,255,0.7)" />
        <Text style={styles.sponsorLabel}>Patrocinado</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <Ionicons name={ad.icon as any} size={24} color={ad.gradient[0]} />
        </View>
        <View style={styles.textArea}>
          <Text style={styles.title}>{ad.title}</Text>
          <Text style={styles.description} numberOfLines={2}>{ad.description}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.sponsorName}>{ad.sponsor}</Text>
        <Pressable style={styles.ctaButton}>
          <Text style={[styles.ctaText, { color: ad.gradient[0] }]}>{ad.ctaText}</Text>
          <Ionicons name="arrow-forward" size={14} color={ad.gradient[0]} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sponsorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  sponsorLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  description: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sponsorName: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    flex: 1,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
