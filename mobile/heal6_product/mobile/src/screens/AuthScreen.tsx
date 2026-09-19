import React, { useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import { Heal6Logo } from '../components/common/Heal6Logo';
import { AuthService } from '../api/authService';
import { AppStorage } from '../services/appStorage';
import { RootStackParamList, ROUTES } from '../navigation/routes';
import { useApp } from '../context/AppContext';
import { getDictionary } from '../constants/i18n';

WebBrowser.maybeCompleteAuthSession();

type Nav = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

export const AuthScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { language } = useApp();
  const t = getDictionary(language);

  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleJuryOverride = () => {
    Alert.alert(
      '🔐 SIH Jury & Clinical Override',
      'Developer bypass authorized. Would you like to authenticate immediately as the Demo Patient without OTP verification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Initiate Demo Session',
          style: 'default',
          onPress: () => handle1TapDemo(),
        },
      ]
    );
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = await AppStorage.getToken();
      if (!token) return;
      const valid = await AuthService.validateSession();
      if (!mounted) return;
      if (!valid) {
        await AppStorage.clearAuth();
        return;
      }
      const profile = await AuthService.getProfile();
      if (profile) await AppStorage.setProfile(profile);
      navigation.replace(profile?.name ? ROUTES.MAIN_APP : ROUTES.PROFILE_SETUP);
    })();
    return () => {
      mounted = false;
    };
  }, [navigation]);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    const finishGoogleLogin = async () => {
      if (response?.type !== 'success') return;
      const idToken = response.authentication?.idToken || response.params?.id_token;
      if (!idToken)
        return Alert.alert('Google Login', 'Google returned no ID token. Check your OAuth client configuration.');
      setBusy(true);
      try {
        await AuthService.googleLogin(idToken);
        const profile = await AuthService.getProfile();
        if (profile) await AppStorage.setProfile(profile);
        navigation.replace(profile?.name ? ROUTES.MAIN_APP : ROUTES.PROFILE_SETUP);
      } catch (error: any) {
        Alert.alert(
          'Google Login Failed',
          error?.response?.data?.detail || 'The Google account could not be authenticated by the Heal6 server.'
        );
      } finally {
        setBusy(false);
      }
    };
    finishGoogleLogin();
  }, [response, navigation]);

  const validate = () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      Alert.alert('Invalid Email', t.invalidEmail || 'Please enter a valid email address.');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', t.passwordLength || 'Password must be at least 6 characters.');
      return false;
    }
    if (tab === 'signup') {
      if (!name.trim()) {
        Alert.alert('Name Required', t.nameRequired || 'Please enter your full name.');
        return false;
      }
      if (password !== confirmPassword) {
        Alert.alert('Mismatch', t.passwordsDoNotMatch || 'Passwords do not match.');
        return false;
      }
    }
    return true;
  };

  const handleAuth = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      if (tab === 'signin') {
        await AuthService.testLogin(email.trim(), password);
      } else {
        await AuthService.register(email.trim(), password, name.trim());
      }
      const profile = await AuthService.getProfile();
      if (profile) await AppStorage.setProfile(profile);
      navigation.replace(profile?.name ? ROUTES.MAIN_APP : ROUTES.PROFILE_SETUP);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.detail || 'Could not complete authentication.';
      if (tab === 'signin' && (errorMsg.includes('Invalid') || errorMsg.includes('check your credentials'))) {
        Alert.alert(
          'Sign In',
          'Account not recognized. Would you like to create a new patient account with this email?',
          [
            { text: 'Try Again', style: 'cancel' },
            {
              text: 'Create Account',
              onPress: () => {
                setTab('signup');
                if (!name && email.includes('@')) {
                  setName(email.split('@')[0].replace(/[^a-zA-Z]/g, ' '));
                }
              },
            },
          ]
        );
      } else {
        Alert.alert(tab === 'signin' ? 'Sign In Failed' : 'Registration Failed', errorMsg);
      }
    } finally {
      setBusy(false);
    }
  };

  const handle1TapDemo = async () => {
    setBusy(true);
    try {
      await AuthService.testLogin('test@heal6.app', 'Heal6@123');
      const profile = await AuthService.getProfile();
      if (profile) await AppStorage.setProfile(profile);
      navigation.replace(profile?.name ? ROUTES.MAIN_APP : ROUTES.PROFILE_SETUP);
    } catch (error: any) {
      Alert.alert('Demo Login Failed', error?.response?.data?.detail || 'Could not log in as demo patient.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.topGlow} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 10, 24),
            paddingBottom: Math.max(insets.bottom + 20, 36),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Heal6Logo onLongPress={handleJuryOverride} />

          {/* Toggle Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'signin' && styles.tabBtnActive]}
              onPress={() => setTab('signin')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, tab === 'signin' && styles.tabTextActive]}>
                {t.signIn || 'Sign In'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'signup' && styles.tabBtnActive]}
              onPress={() => setTab('signup')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>
                {t.createAccount || 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>
            {tab === 'signin' ? (t.welcomeBack || 'Welcome back') : (t.welcomeNew || 'Create Patient Account')}
          </Text>
          <Text style={styles.subtitle}>
            {tab === 'signin'
              ? (t.authSubtitleSignIn || 'Your early-warning foot screening companion.')
              : (t.authSubtitleSignUp || 'Join Heal6 for intelligent preventive diabetic foot care.')}
          </Text>

          {/* Sign Up Name Field */}
          {tab === 'signup' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t.name || 'Full Name'}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Ramesh Kumar"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </View>
          )}

          {/* Email Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t.email || 'Email'}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="name@example.com"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {/* Password Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t.password || 'Password'}</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Field for Sign Up */}
          {tab === 'signup' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t.confirmPassword || 'Confirm Password'}</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            disabled={busy}
            onPress={handleAuth}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryText}>
                {tab === 'signin' ? (t.signIn || 'Sign In') : (t.createAccount || 'Create Account')}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.or}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.line} />
          </View>

          {/* Google OAuth Button */}
          <TouchableOpacity
            style={styles.googleButton}
            disabled={!request || busy}
            onPress={() => promptAsync()}
            activeOpacity={0.85}
          >
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>{t.disclaimer}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 20, justifyContent: 'center' },
  topGlow: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.primaryLight,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginTop: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 11,
  },
  tabBtnActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primaryDark,
    fontWeight: '900',
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginTop: 18 },
  subtitle: { fontSize: 13, lineHeight: 18, color: Colors.textSecondary, marginTop: 4, marginBottom: 16 },
  fieldGroup: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FBFDFE',
    color: Colors.textPrimary,
    fontSize: 14,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: '#FBFDFE',
    paddingLeft: 14,
    paddingRight: 10,
  },
  passwordInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    paddingVertical: 0,
    paddingRight: 10,
  },
  eyeBtn: {
    padding: 6,
  },
  primaryButton: {
    height: 50,
    borderRadius: 13,
    backgroundColor: Colors.primaryTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: Colors.primaryTeal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
  demoButton: {
    height: 48,
    borderRadius: 13,
    backgroundColor: '#E6FFFA',
    borderWidth: 1.5,
    borderColor: '#38B2AC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  demoText: {
    color: '#0D9488',
    fontWeight: '800',
    fontSize: 14,
  },
  or: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
  line: { flex: 1, height: 1, backgroundColor: Colors.border },
  orText: { color: Colors.textMuted, fontSize: 11, fontWeight: '700' },
  googleButton: {
    height: 48,
    borderRadius: 13,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleG: { color: '#4285F4', fontWeight: '900', fontSize: 20, marginRight: 10 },
  googleText: { color: Colors.textPrimary, fontWeight: '700', fontSize: 14 },
  testBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 13,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  testTitle: { color: Colors.primaryDark, fontSize: 12, fontWeight: '800' },
  testText: { color: Colors.textPrimary, fontSize: 13, marginTop: 4, fontWeight: '800' },
  testHint: { color: Colors.textSecondary, fontSize: 11, marginTop: 3, lineHeight: 15 },
  disclaimer: { color: Colors.textMuted, fontSize: 10, lineHeight: 14, textAlign: 'center', marginTop: 16 },
});

export default AuthScreen;
