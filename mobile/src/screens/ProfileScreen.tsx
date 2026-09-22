import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import { MainTabParamList, RootStackParamList, ROUTES } from '../navigation/routes';
import { useApp } from '../context/AppContext';
import { AppStorage, Language } from '../services/appStorage';
import { getDictionary } from '../constants/i18n';
import { UserProfile } from '../types/profile.types';
import { AuthService } from '../api/authService';

import { IsoDatePickerField } from '../components/common/IsoDatePickerField';

type Props = BottomTabScreenProps<MainTabParamList, 'Profile'>;

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const defaults: UserProfile = {
  name: '',
  age: '',
  gender: '',
  dateOfBirth: '',
  heightCm: '',
  weightKg: '',
  bloodGroup: '',
  diabetesType: 'type2',
  diabetesDurationYears: '',
  previousUlcer: false,
  symptoms: '',
  allergies: '',
  phone: '',
  emergencyContact: '',
};

export const ProfileScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const { language, setLanguage, profile, setProfile, refreshProfile, signOut } = useApp();
  const t = getDictionary(language);
  const [draft, setDraft] = useState<UserProfile>(profile || defaults);

  useEffect(() => {
    refreshProfile();
  }, []);

  useEffect(() => {
    if (profile) setDraft(profile);
  }, [profile]);

  const update = (key: keyof UserProfile, value: any) =>
    setDraft((p) => ({ ...p, [key]: value }));

  const save = async () => {
    try {
      const saved = await AuthService.saveProfile(draft);
      setProfile(saved);
      await AppStorage.setProfile(saved);
      Alert.alert('Saved', 'Profile details updated.');
    } catch (e: any) {
      Alert.alert('Save failed', e?.response?.data?.detail || 'Could not update profile.');
    }
  };

  const logout = async () => {
    await signOut();
    const root = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    root?.replace(ROUTES.AUTH);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top + 6, 18),
          paddingBottom: 110 + insets.bottom,
        },
      ]}
    >
      {/* Profile Avatar Header */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>
            {(draft.name || 'U').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.avatarName}>{draft.name || 'Your Name'}</Text>
        <Text style={styles.avatarSub}>{t.settingsSubtitle || 'Manage your clinical profile and account.'}</Text>
      </View>

      {/* Language Selector */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t.language}</Text>
        <View style={styles.langRow}>
          {(['english', 'hindi', 'odia'] as Language[]).map((lang) => (
            <TouchableOpacity
              key={lang}
              onPress={() => setLanguage(lang)}
              style={[styles.langBtn, language === lang && styles.langActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.langText, language === lang && styles.langActiveText]}>
                {lang === 'english' ? 'English' : lang === 'hindi' ? 'हिन्दी' : 'ଓଡ଼ିଆ'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Clinical Profile Details */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t.profileDetails}</Text>

        <Field label={t.name} value={draft.name} onChange={(v: string) => update('name', v)} />
        <Field
          label={t.age}
          value={draft.age}
          onChange={(v: string) => update('age', v)}
          keyboardType="numeric"
        />
        <Field label={t.gender} value={draft.gender} onChange={(v: string) => update('gender', v)} />
        <IsoDatePickerField
          label={t.dob}
          value={draft.dateOfBirth}
          onChange={(v: string) => {
            update('dateOfBirth', v);
            // Auto update age
            if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
              const y = parseInt(v.split('-')[0], 10);
              const calculatedAge = new Date().getFullYear() - y;
              if (calculatedAge > 0 && calculatedAge < 120) {
                update('age', String(calculatedAge));
              }
            }
          }}
        />

        <View style={styles.row}>
          <Field
            label={t.height}
            value={draft.heightCm}
            onChange={(v: string) => update('heightCm', v)}
            keyboardType="numeric"
            style={{ flex: 1, marginRight: 5 }}
          />
          <Field
            label={t.weight}
            value={draft.weightKg}
            onChange={(v: string) => update('weightKg', v)}
            keyboardType="numeric"
            style={{ flex: 1, marginLeft: 5 }}
          />
        </View>

        {/* Blood Group Chips Selector */}
        <Text style={styles.label}>{t.bloodGroup}</Text>
        <View style={styles.chips}>
          {BLOOD_GROUPS.map((bg) => {
            const isSelected = draft.bloodGroup === bg;
            return (
              <TouchableOpacity
                key={bg}
                onPress={() => update('bloodGroup', isSelected ? '' : bg)}
                style={[styles.chip, isSelected && styles.chipActive]}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{bg}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Diabetes Type Chips */}
        <Text style={styles.label}>{t.diabetesType}</Text>
        <View style={styles.chips}>
          {[
            ['type1', 'Type 1'],
            ['type2', 'Type 2'],
            ['gestational', 'Gestational'],
            ['other', 'Other'],
            ['not_sure', 'Not sure'],
          ].map(([v, l]) => (
            <TouchableOpacity
              key={v}
              onPress={() => update('diabetesType', v)}
              style={[styles.chip, draft.diabetesType === v && styles.chipActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, draft.diabetesType === v && styles.chipTextActive]}>
                {l}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Field
          label={t.diabetesDuration}
          value={draft.diabetesDurationYears}
          onChange={(v: string) => update('diabetesDurationYears', v)}
          keyboardType="numeric"
        />

        {/* Previous Ulcer Switch */}
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{t.previousUlcer}</Text>
            <Text style={styles.helper}>Use this to add context to future reports.</Text>
          </View>
          <Switch
            value={draft.previousUlcer}
            onValueChange={(v: boolean) => update('previousUlcer', v)}
            trackColor={{ false: Colors.disabled, true: Colors.primaryLight }}
            thumbColor={draft.previousUlcer ? Colors.primaryTeal : Colors.white}
          />
        </View>

        <Field
          label={t.symptomsField}
          value={draft.symptoms}
          onChange={(v: string) => update('symptoms', v)}
          multiline
          placeholder="Anything the clinic should know"
        />
        <Field
          label={t.allergies}
          value={draft.allergies}
          onChange={(v: string) => update('allergies', v)}
        />
        <Field
          label={t.phone}
          value={draft.phone}
          onChange={(v: string) => update('phone', v)}
          keyboardType="phone-pad"
        />
        <Field
          label={t.emergencyContact}
          value={draft.emergencyContact}
          onChange={(v: string) => update('emergencyContact', v)}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={save} activeOpacity={0.85}>
          <Ionicons name="save-outline" size={18} color={Colors.white} />
          <Text style={styles.saveText}>{t.saveChanges}</Text>
        </TouchableOpacity>
      </View>

      {/* Account / Logout */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() =>
            Alert.alert(t.logout, 'Are you sure you want to log out?', [
              { text: t.cancel, style: 'cancel' },
              { text: t.logout, style: 'destructive', onPress: logout },
            ])
          }
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>{t.logout}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const Field = ({ label, value, onChange, keyboardType, multiline, placeholder, style }: any) => (
  <View style={style}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.multiline]}
      value={value}
      onChangeText={onChange}
      keyboardType={keyboardType}
      multiline={multiline}
      placeholder={placeholder}
      placeholderTextColor={Colors.textMuted}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 30 },
  title: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, marginBottom: 12 },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: Colors.primaryTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 1,
  },
  avatarName: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  avatarSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 15,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: Colors.textPrimary, marginBottom: 8 },
  langRow: { flexDirection: 'row', gap: 8 },
  langBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 11,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  langActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryTeal },
  langText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '700' },
  langActiveText: { color: Colors.primaryDark, fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '800', color: Colors.textSecondary, marginTop: 11, marginBottom: 5 },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: '#FBFDFE',
    paddingHorizontal: 12,
    color: Colors.textPrimary,
  },
  multiline: { height: 80, paddingTop: 12 },
  row: { flexDirection: 'row' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  chipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryTeal },
  chipText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '700' },
  chipTextActive: { color: Colors.primaryDark, fontWeight: '900' },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  helper: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  saveBtn: {
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.primaryTeal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  saveText: { color: Colors.white, fontWeight: '900' },
  logoutBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFF4F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: { color: Colors.danger, fontWeight: '900' },
});

export default ProfileScreen;
