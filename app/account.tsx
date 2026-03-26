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
import { Colors } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { File as ExpoFile } from 'expo-file-system';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, user, refreshProfile } = useAuth();

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
          Alert.alert('Error foto', e?.message ?? 'No se pudo procesar la foto');
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
        Alert.alert('Error', error.message);
      } else {
        await refreshProfile();
        Alert.alert('Listo', 'Perfil actualizado correctamente');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar');
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

  const roleName = profile?.role === 'admin' ? 'Administrador' : profile?.role === 'association' ? 'Asociacion' : 'Ciudadano';

  return (
    <ScrollView
      style={[s.container, { paddingTop: insets.top + 12 }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={s.title}>Cuenta</Text>
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
          <Ionicons name="camera-outline" size={16} color={Colors.primary} />
          <Text style={s.avatarBtnText}>Cambiar foto</Text>
        </Pressable>
      </View>

      {/* Campos */}
      <View style={s.section}>
        <Text style={s.label}>Nombre completo</Text>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          placeholder="Tu nombre"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={s.label}>Correo electronico</Text>
        <TextInput
          style={[s.input, { backgroundColor: Colors.borderLight }]}
          value={email}
          editable={false}
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={s.label}>Numero de contacto</Text>
        <TextInput
          style={s.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+52 000 000 0000"
          placeholderTextColor={Colors.textMuted}
          keyboardType="phone-pad"
        />

        <Text style={s.label}>Bio</Text>
        <TextInput
          style={[s.input, s.inputMultiline]}
          value={bio}
          onChangeText={setBio}
          placeholder="Cuentanos sobre ti"
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Info de cuenta */}
      <View style={s.section}>
        <View style={s.infoRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.textSecondary} />
          <Text style={s.infoLabel}>Rol</Text>
          <Text style={s.infoValue}>{roleName}</Text>
        </View>
        <View style={s.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
          <Text style={s.infoLabel}>Miembro desde</Text>
          <Text style={s.infoValue}>{memberSince}</Text>
        </View>
      </View>

      {/* Guardar */}
      <Pressable style={s.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.saveBtnText}>Guardar cambios</Text>
        )}
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
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
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
    backgroundColor: Colors.primary,
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
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  avatarBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Form
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
    marginTop: 12,
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
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },

  // Save
  saveBtn: {
    backgroundColor: Colors.primary,
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
