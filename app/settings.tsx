import { useState, useRef, useCallback } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import Text from '../components/ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFontSize, FONT_STEP_COUNT } from '../contexts/FontSizeContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme, useColors } from '../contexts/ThemeContext';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { isDark, setDark } = useTheme();
  const C = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(true);
  const [radiusKm, setRadiusKm] = useState('2');
  const { step: fontStep, setStep: setFontStep, fs } = useFontSize();
  const [darkMode, setDarkMode] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const trackWidthRef = useRef(0);

  const onTrackLayout = useCallback((e: LayoutChangeEvent) => {
    trackWidthRef.current = e.nativeEvent.layout.width;
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gestureState) => {
        snapToStep(gestureState.x0);
      },
      onPanResponderMove: (_, gestureState) => {
        snapToStep(gestureState.moveX);
      },
    })
  ).current;

  const trackRef = useRef<View>(null);
  const snapToStep = (pageX: number) => {
    trackRef.current?.measureInWindow((x, _y, width) => {
      const rel = Math.max(0, Math.min(pageX - x, width));
      const step = Math.round((rel / width) * (FONT_STEP_COUNT - 1));
      setFontStep(step);
    });
  };

  const s = makeS(C);

  return (
    <ScrollView
      style={[s.container, { paddingTop: insets.top + 12 }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={s.title}>{t('settings_title')}</Text>
      </View>

      {/* Cuenta — navega a pantalla de cuenta */}
      <Pressable
        style={s.linkRow}
        onPress={() => router.push('/account' as any)}
      >
        <View style={s.linkIcon}>
          <Ionicons name="person-outline" size={20} color={C.primary} />
        </View>
        <View style={s.linkText}>
          <Text style={s.linkTitle}>{t('settings_account')}</Text>
          <Text style={s.linkHint}>{t('settings_account_hint')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
      </Pressable>

      {/* Notificaciones */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Ionicons name="notifications-outline" size={18} color={C.primary} />
          <Text style={s.sectionTitle}>{t('settings_notifications')}</Text>
        </View>

        <View style={s.row}>
          <View style={s.rowText}>
            <Text style={s.label}>{t('settings_notifications_alerts')}</Text>
            <Text style={s.hint}>{t('settings_notifications_hint')}</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: C.border, true: C.primary }}
            thumbColor="#fff"
          />
        </View>

        <Text style={s.label}>{t('settings_radius')}</Text>
        <TextInput
          style={s.input}
          value={radiusKm}
          onChangeText={setRadiusKm}
          keyboardType="numeric"
          placeholder="2"
          placeholderTextColor={C.textMuted}
        />
      </View>

      {/* Accesibilidad — Tamano de letra */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Ionicons name="text-outline" size={18} color={C.primary} />
          <Text style={s.sectionTitle}>{t('settings_font_size')}</Text>
        </View>

        {/* Labels */}
        <View style={s.sliderLabels}>
          <Text style={{ fontSize: 11, color: C.textMuted }}>A</Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: C.textMuted }}>A</Text>
        </View>

        {/* Track + Dots */}
        <View
          ref={trackRef}
          style={s.sliderTrack}
          onLayout={onTrackLayout}
          {...panResponder.panHandlers}
        >
          <View style={s.sliderRail} />
          <View style={[s.sliderRailFill, { width: `${(fontStep / (FONT_STEP_COUNT - 1)) * 100}%` }]} />
          {Array.from({ length: FONT_STEP_COUNT }).map((_, i) => {
            const left = `${(i / (FONT_STEP_COUNT - 1)) * 100}%` as `${number}%`;
            const active = i <= fontStep;
            const isCurrent = i === fontStep;
            return (
              <Pressable
                key={i}
                onPress={() => setFontStep(i)}
                style={[
                  s.sliderDot,
                  { left },
                  active && s.sliderDotActive,
                  isCurrent && s.sliderDotCurrent,
                ]}
              />
            );
          })}
        </View>

        {/* Preview */}
        <Text style={[s.hint, { fontSize: fs(14), marginTop: 14, textAlign: 'center' }]}>
          {t('settings_example_text')}
        </Text>
      </View>

      {/* Apariencia */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Ionicons name="moon-outline" size={18} color={C.primary} />
          <Text style={s.sectionTitle}>{t('settings_appearance')}</Text>
        </View>

        <View style={s.row}>
          <View style={s.rowText}>
            <Text style={s.label}>{t('settings_dark_mode')}</Text>
            <Text style={s.hint}>{t('settings_dark_hint')}</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={setDark}
            trackColor={{ false: C.border, true: C.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Idioma */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Ionicons name="language-outline" size={18} color={C.primary} />
          <Text style={s.sectionTitle}>{t('settings_language')}</Text>
        </View>

        <View style={s.langRow}>
          {(['es', 'yaq'] as const).map(lang => (
            <Pressable 
              key={lang} 
              style={[s.langChip, language === lang && s.langChipActive]}
              onPress={() => setLanguage(lang)}
            >
              <Text style={[s.langChipText, language === lang && s.langChipTextActive]}>
                {lang === 'es' ? t('settings_language_es') : t('settings_language_yaq')}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Cerrar sesion */}
      <Pressable style={s.logoutBtn} onPress={async () => {
        try { await signOut(); } catch {}
        router.replace('/login' as any);
      }}>
        <Ionicons name="log-out-outline" size={18} color={C.error} />
        <Text style={s.logoutText}>{t('settings_logout')}</Text>
      </Pressable>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const makeS = (C: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  content: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
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
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    backgroundColor: C.surface,
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
    borderBottomColor: C.borderLight,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
    marginBottom: 6,
  },
  hint: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 1,
  },
  input: {
    backgroundColor: C.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 12, default: 10 }),
    fontSize: 14,
    color: C.text,
    borderWidth: 1,
    borderColor: C.border,
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
    backgroundColor: C.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  langChipActive: {
    backgroundColor: C.primary,
  },
  langChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
  },
  langChipTextActive: {
    color: '#fff',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.error + '18',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginTop: 6,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.error,
  },

  // ===== Link row (Cuenta) =====
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
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
    backgroundColor: C.primaryLight,
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
    color: C.text,
  },
  linkHint: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },

  // ===== Font size slider =====
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sliderTrack: {
    height: 32,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderRail: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
  },
  sliderRailFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.primary,
  },
  sliderDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.border,
    marginLeft: -7,
    top: 9,
  },
  sliderDotActive: {
    backgroundColor: C.primary,
  },
  sliderDotCurrent: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginLeft: -11,
    top: 5,
    backgroundColor: C.primary,
    borderWidth: 3,
    borderColor: C.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});
