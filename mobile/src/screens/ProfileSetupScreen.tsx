import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Heal6Logo } from '../components/common/Heal6Logo';
import { AuthService } from '../api/authService';
import { AppStorage } from '../services/appStorage';
import { UserProfile } from '../types/profile.types';
import { RootStackParamList, ROUTES } from '../navigation/routes';
import { useApp } from '../context/AppContext';
import { getDictionary } from '../constants/i18n';
import { IsoDatePickerField } from '../components/common/IsoDatePickerField';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const blank: UserProfile = {
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

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileSetup'>;

export const ProfileSetupScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const { language } = useApp();
  const t = getDictionary(language);
  const [profile, setProfile] = useState<UserProfile>(blank);

  const update = (key: keyof UserProfile, value: any) =>
    setProfile((p) => ({ ...p, [key]: value }));

  const save = async () => {
    if (
      !profile.name.trim() ||
      !profile.age.trim() ||
      !profile.heightCm.trim() ||
      !profile.weightKg.trim()
    ) {
      return Alert.alert('Missing details', 'Name, age, height, and weight are required.');
    }
    try {
      const saved = await AuthService.saveProfile(profile);
      await AppStorage.setProfile(saved);
      navigation.replace(ROUTES.MAIN_APP);
    } catch (error: any) {
      Alert.alert('Save failed', error?.response?.data?.detail || 'Could not save your profile.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top + 8, 22),
          paddingBottom: Math.max(insets.bottom + 24, 40),
        },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Heal6Logo />
      <Text style={styles.title}>Set up your details</Text>
      <Text style={styles.subtitle}>
        These details are attached to future screening reports and can be modified later in Settings.
      </Text>

      <Field label={`${t.name} *`} value={profile.name} onChange={(v: string) => update('name', v)} />
      <Field
        label={`${t.age} *`}
        value={profile.age}
        onChange={(v: string) => update('age', v)}
        keyboardType="numeric"
      />
      <Field
        label={t.gender}
        value={profile.gender}
        onChange={(v: string) => update('gender', v)}
        placeholder="e.g. Male / Female / Other"
      />
      <IsoDatePickerField
        label={t.dob}
        value={profile.dateOfBirth}
        onChange={(v: string) => {
          update('dateOfBirth', v);
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
          label={`${t.height} *`}
          value={profile.heightCm}
          onChange={(v: string) => update('heightCm', v)}
          keyboardType="numeric"
          style={{ flex: 1, marginRight: 6 }}
        />
        <Field
          label={`${t.weight} *`}
          value={profile.weightKg}
          onChange={(v: string) => update('weightKg', v)}
          keyboardType="numeric"
          style={{ flex: 1, marginLeft: 6 }}
        />
      </View>

      {/* Blood Group Chips */}
      <Text style={styles.label}>{t.bloodGroup}</Text>
      <View style={styles.chips}>
        {BLOOD_GROUPS.map((bg) => {
          const isSelected = profile.bloodGroup === bg;
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
            style={[styles.chip, profile.diabetesType === v && styles.chipActive]}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, profile.diabetesType === v && styles.chipTextActive]}>
              {l}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Field
        label={t.diabetesDuration}
        value={profile.diabetesDurationYears}
        onChange={(v: string) => update('diabetesDurationYears', v)}
        keyboardType="numeric"
      />

      <Text style={styles.label}>{t.previousUlcer}</Text>
      <View style={styles.chips}>
        <TouchableOpacity
          onPress={() => update('previousUlcer', true)}
          style={[styles.chip, profile.previousUlcer && styles.chipActive]}
          activeOpacity={0.75}
        >
          <Text style={[styles.chipText, profile.previousUlcer && styles.chipTextActive]}>Yes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => update('previousUlcer', false)}
          style={[styles.chip, !profile.previousUlcer && styles.chipActive]}
          activeOpacity={0.75}
        >
          <Text style={[styles.chipText, !profile.previousUlcer && styles.chipTextActive]}>No</Text>
        </TouchableOpacity>
      </View>

      <Field
        label={t.symptomsField}
        value={profile.symptoms}
        onChange={(v: string) => update('symptoms', v)}
        multiline
        placeholder="Anything the clinic should know about your symptoms"
      />
      <Field
        label={t.allergies}
        value={profile.allergies}
        onChange={(v: string) => update('allergies', v)}
        placeholder="None / list"
      />
      <Field
        label={t.phone}
        value={profile.phone}
        onChange={(v: string) => update('phone', v)}
        keyboardType="phone-pad"
      />
      <Field
        label={t.emergencyContact}
        value={profile.emergencyContact}
        onChange={(v: string) => update('emergencyContact', v)}
      />

      <TouchableOpacity style={styles.save} onPress={save} activeOpacity={0.85}>
        <Text style={styles.saveText}>{t.continue || 'Save Profile & Continue'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const Field = ({ label, value, onChange, placeholder, keyboardType, multiline, style }: any) => (
  <View style={style}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.multiline]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={Colors.textMuted}
      keyboardType={keyboardType}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 22, paddingBottom: 40 },
  title: { color: Colors.textPrimary, fontSize: 26, fontWeight: '800', marginTop: 22 },
  subtitle: { color: Colors.textSecondary, lineHeight: 20, fontSize: 13, marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '800', color: Colors.textSecondary, marginBottom: 6, marginTop: 12 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    borderRadius: 11,
    paddingHorizontal: 13,
    color: Colors.textPrimary,
  },
  multiline: { height: 84, paddingTop: 12 },
  row: { flexDirection: 'row' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  chipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryTeal },
  chipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: Colors.primaryDark, fontWeight: '800' },
  save: {
    marginTop: 24,
    height: 52,
    borderRadius: 13,
    backgroundColor: Colors.primaryTeal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryTeal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  saveText: { color: Colors.white, fontWeight: '800' },
});

export default ProfileSetupScreen;
