import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Text from '../components/ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { File as ExpoFile } from 'expo-file-system';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, user, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const C = useColors();
  const s = makeS(C);

  const [name, setName] = useState(profile?.name ?? '');
  const [email] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url ?? null);
  const [saving, setSaving] = useState(false);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let newAvatarUrl = profile?.avatar_url ?? null;

      // Upload avatar to Supabase Storage if changed
      if (avatarUri && avatarUri !== profile?.avatar_url) {
        try {
          const fileName = `avatar-${user.id}-${Date.now()}.jpg`;
          const file = new ExpoFile(avatarUri);
          const arrayBuffer = await file.arrayBuffer();
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);
            newAvatarUrl = urlData.publicUrl;
          } else {
            console.warn('Avatar upload error:', uploadError.message);
          }
        } catch (e: any) {
          Alert.alert(t('acc_err_photo_title'), e?.message ?? t('acc_err_photo_desc'));
        }
      }

      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          name: name.trim() || profile?.name,
          avatar_url: newAvatarUrl,
          phone: phone.trim() || null,
          bio: bio.trim() || null,
        })
        .eq('id', user.id);

      if (error) {
        Alert.alert(t('error'), error.message);
      } else {
        await refreshProfile();
        Alert.alert(t('acc_success_title'), t('acc_success_desc'));
      }
    } catch (e: any) {
      Alert.alert(t('error'), e?.message ?? t('acc_err_save'));
    } finally {
      setSaving(false);
    }
  };

  const initials = (name || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2);

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const roleName = profile?.role === 'admin' ? t('acc_role_admin') : profile?.role === 'association' ? t('acc_role_assoc') : t('acc_role_citizen');

  return (
    <ScrollView
      style={[s.container, { paddingTop: insets.top + 12, backgroundColor: C.background }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={s.title}>{t('acc_title')}</Text>
      </View>

      {/* Avatar */}
      <View style={s.avatarSection}>
        <Pressable onPress={pickAvatar} style={s.avatarCircle}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={s.avatarImg} />
          ) : (
            <Text style={s.avatarText}>{initials}</Text>
          )}
          <View style={s.cameraOverlay}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </Pressable>
        <Pressable onPress={pickAvatar} style={s.avatarBtn}>
          <Ionicons name="camera-outline" size={16} color={C.primary} />
          <Text style={s.avatarBtnText}>{t('acc_change_photo')}</Text>
        </Pressable>
      </View>

      {/* Campos */}
      <View style={s.section}>
        <Text style={s.label}>{t('acc_name_label')}</Text>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          placeholder={t('acc_name_placeholder')}
          placeholderTextColor={C.textMuted}
        />

        <Text style={s.label}>{t('acc_email_label')}</Text>
        <TextInput
          style={[s.input, { backgroundColor: C.borderLight }]}
          value={email}
          editable={false}
          placeholderTextColor={C.textMuted}
        />

        <Text style={s.label}>{t('acc_phone_label')}</Text>
        <TextInput
          style={s.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+52 000 000 0000"
          placeholderTextColor={C.textMuted}
          keyboardType="phone-pad"
        />

        <Text style={s.label}>{t('acc_bio_label')}</Text>
        <TextInput
          style={[s.input, s.inputMultiline]}
          value={bio}
          onChangeText={setBio}
          placeholder={t('acc_bio_placeholder')}
          placeholderTextColor={C.textMuted}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Info de cuenta */}
      <View style={s.section}>
        <View style={s.infoRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color={C.textSecondary} />
          <Text style={s.infoLabel}>{t('acc_role_label')}</Text>
          <Text style={s.infoValue}>{roleName}</Text>
        </View>
        <View style={s.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={C.textSecondary} />
          <Text style={s.infoLabel}>{t('acc_member_since')}</Text>
          <Text style={s.infoValue}>{memberSince}</Text>
        </View>
      </View>

      {/* Guardar */}
      <Pressable style={s.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.saveBtnText}>{t('acc_save_btn')}</Text>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 26,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  avatarBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
  },

  // Form
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
    marginBottom: 6,
    marginTop: 12,
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
  },
  inputMultiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  infoLabel: {
    flex: 1,
    fontSize: 13,
    color: C.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
  },

  // Save
  saveBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
