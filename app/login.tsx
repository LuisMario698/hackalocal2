import { useState } from 'react';
import {
  ActivityIndicator,
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

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, signUp, skipLogin } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);

  const canSubmit = mode === 'login'
    ? email.trim() && password.trim()
    : email.trim() && password.trim() && name.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);

    let error: string | null;
    if (mode === 'login') {
      error = await signIn(email.trim(), password.trim());
    } else {
      if (password.trim().length < 6) {
        Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
        setBusy(false);
        return;
      }
      error = await signUp(email.trim(), password.trim(), name.trim());
    }

    setBusy(false);

    if (error) {
      Alert.alert('Error', error);
    } else {
      router.replace('/(tabs)' as any);
    }
  };

  const handleSkip = () => {
    skipLogin();
    router.replace('/(tabs)' as any);
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
        <Text style={s.subtitle}>
          {mode === 'login' ? 'Inicio de sesion' : 'Crear cuenta'}
        </Text>
      </View>

      {/* Mode toggle */}
      <View style={s.toggleRow}>
        <Pressable
          style={[s.toggleBtn, mode === 'login' && s.toggleBtnActive]}
          onPress={() => setMode('login')}
        >
          <Text style={[s.toggleText, mode === 'login' && s.toggleTextActive]}>Iniciar sesion</Text>
        </Pressable>
        <Pressable
          style={[s.toggleBtn, mode === 'register' && s.toggleBtnActive]}
          onPress={() => setMode('register')}
        >
          <Text style={[s.toggleText, mode === 'register' && s.toggleTextActive]}>Registrarse</Text>
        </Pressable>
      </View>

      {/* Form */}
      <View style={s.form}>
        {mode === 'register' && (
          <View style={s.inputWrap}>
            <Ionicons name="person-outline" size={20} color={Colors.textMuted} style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="Nombre completo"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
        )}

        <View style={s.inputWrap}>
          <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder="Correo electronico"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
        </View>

        <View style={s.inputWrap}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder="Contraseña"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
          </Pressable>
        </View>

        <Pressable
          style={[s.loginBtn, (!canSubmit || busy) && s.loginBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.loginBtnText}>
              {mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Skip */}
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

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 11,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  toggleTextActive: {
    color: '#fff',
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
});
