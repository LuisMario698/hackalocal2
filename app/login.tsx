import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { setIsVerifier, setIsAdmin } = useAuth();

  const handleLogin = () => {
    const u = user.trim().toLowerCase();
    const p = pass.trim().toLowerCase();

    if (u === 'filtro' && p === 'filtro') {
      setIsVerifier(true);
      router.replace('/(tabs)' as any);
    } else if (u === 'admin' && p === 'admin') {
      setIsAdmin(true);
      router.replace('/admin' as any);
    } else {
      Alert.alert('Credenciales incorrectas', 'Usuario o contraseña invalidos');
    }
  };

  const handleSkip = () => {
    setIsVerifier(false);
    router.replace('/(tabs)' as any);
  }

  const goToAdmin = () => {
    setIsAdmin(true);
    router.replace('/admin' as any);
  };

  return (
    <KeyboardAvoidingView
      style={[s.screen, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Logo area */}
      <View style={s.logoArea}>
        <View style={s.logoCircle}>
          <Ionicons name="leaf" size={48} color="#fff" />
        </View>
        <Text style={s.appName}>Social Clean</Text>
        <Text style={s.subtitle}>Inicio de sesion</Text>
      </View>

      {/* Form */}
      <View style={s.form}>
        <View style={s.inputWrap}>
          <Ionicons name="person-outline" size={20} color={Colors.textMuted} style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder="Usuario"
            placeholderTextColor={Colors.textMuted}
            value={user}
            onChangeText={setUser}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={s.inputWrap}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder="Contraseña"
            placeholderTextColor={Colors.textMuted}
            value={pass}
            onChangeText={setPass}
            secureTextEntry={!showPass}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
          </Pressable>
        </View>

        <Pressable
          style={[s.loginBtn, (!user.trim() || !pass.trim()) && s.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={!user.trim() || !pass.trim()}
        >
          <Text style={s.loginBtnText}>Iniciar sesion</Text>
        </Pressable>
      </View>

      {/* Bottom buttons */}
      <View style={s.bottom}>
        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>o</Text>
          <View style={s.dividerLine} />
        </View>

        <Pressable style={s.skipBtn} onPress={handleSkip}>
          <Text style={s.skipBtnText}>Continuar como usuario</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
        </Pressable>

        <Pressable style={s.adminBtn} onPress={goToAdmin}>
          <Ionicons name="shield-half" size={18} color="#6B7280" />
          <Text style={s.adminBtnText}>Panel de Administrador</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },

  // Logo
  logoArea: {
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // Form
  form: {
    gap: 14,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  eyeBtn: {
    padding: 6,
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnDisabled: {
    opacity: 0.5,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Bottom
  bottom: {
    gap: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    height: 48,
  },
  skipBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderRadius: 14,
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  adminBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
});
