import { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [radiusKm, setRadiusKm] = useState('2');
  const [accessible, setAccessible] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <ScrollView
      style={[s.container, { paddingTop: insets.top + 12 }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={s.title}>Configuracion</Text>
      </View>

      {/* Cuenta — navega a pantalla de cuenta */}
      <Pressable
        style={s.linkRow}
        onPress={() => router.push('/account' as any)}
      >
        <View style={s.linkIcon}>
          <Ionicons name="person-outline" size={20} color={Colors.primary} />
        </View>
        <View style={s.linkText}>
          <Text style={s.linkTitle}>Cuenta</Text>
          <Text style={s.linkHint}>Nombre, foto, correo, telefono</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </Pressable>

      {/* Notificaciones */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Ionicons name="notifications-outline" size={18} color={Colors.primary} />
          <Text style={s.sectionTitle}>Notificaciones</Text>
        </View>

        <View style={s.row}>
          <View style={s.rowText}>
            <Text style={s.label}>Alertas de reportes cercanos</Text>
            <Text style={s.hint}>Recibe notificaciones cuando haya reportes nuevos</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor="#fff"
          />
        </View>

        <Text style={s.label}>Radio de alertas (km)</Text>
        <TextInput
          style={s.input}
          value={radiusKm}
          onChangeText={setRadiusKm}
          keyboardType="numeric"
          placeholder="2"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {/* Accesibilidad */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Ionicons name="accessibility-outline" size={18} color={Colors.primary} />
          <Text style={s.sectionTitle}>Accesibilidad</Text>
        </View>

        <View style={s.row}>
          <View style={s.rowText}>
            <Text style={s.label}>Modo accesible</Text>
            <Text style={s.hint}>Textos grandes y alto contraste</Text>
          </View>
          <Switch
            value={accessible}
            onValueChange={setAccessible}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Apariencia */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Ionicons name="moon-outline" size={18} color={Colors.primary} />
          <Text style={s.sectionTitle}>Apariencia</Text>
        </View>

        <View style={s.row}>
          <View style={s.rowText}>
            <Text style={s.label}>Modo oscuro</Text>
            <Text style={s.hint}>Tema oscuro en toda la app</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Idioma */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Ionicons name="language-outline" size={18} color={Colors.primary} />
          <Text style={s.sectionTitle}>Idioma</Text>
        </View>

        <View style={s.langRow}>
          {['Espanol', 'Yaqui'].map(lang => (
            <View key={lang} style={s.langChip}>
              <Text style={s.langChipText}>{lang}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Cerrar sesion */}
      <Pressable style={s.logoutBtn}>
        <Ionicons name="log-out-outline" size={18} color={Colors.error} />
        <Text style={s.logoutText}>Cerrar sesion</Text>
      </Pressable>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  hint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 12, default: 10 }),
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  rowText: {
    flex: 1,
    marginRight: 12,
  },
  langRow: {
    flexDirection: 'row',
    gap: 8,
  },
  langChip: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  langChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginTop: 6,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },

  // ===== Link row (Cuenta) =====
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkText: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  linkHint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
