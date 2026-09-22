import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { apiClient } from '../api/client';
import { useApp } from '../context/AppContext';
import { getDictionary } from '../constants/i18n';
import { AppStorage } from '../services/appStorage';
import { IsoDatePickerField } from '../components/common/IsoDatePickerField';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/routes';

type Props = NativeStackScreenProps<RootStackParamList, 'Appointment'>;

export const AppointmentScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const { language } = useApp();
  const t = getDictionary(language);

  const [reason, setReason] = useState('Screening follow-up');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const getPresetDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().split('T')[0];
  };

  const presetDates = [
    { label: t.presetTomorrow || 'Tomorrow', value: getPresetDate(1) },
    { label: t.presetIn3Days || 'In 3 Days', value: getPresetDate(3) },
    { label: t.presetNextWeek || 'Next Week', value: getPresetDate(7) },
  ];

  const reasons = [
    { key: 'Screening follow-up', label: t.reasonFollowUp || 'Screening follow-up' },
    { key: 'New concern / Ulcer', label: t.reasonNewConcern || 'New concern / Ulcer' },
    { key: 'Routine foot care', label: t.reasonRoutineCare || 'Routine foot care' },
  ];

  const submit = async () => {
    if (!date.trim()) {
      return Alert.alert('Missing Date', 'Please choose or enter a preferred date (YYYY-MM-DD).');
    }
    setBusy(true);
    const appointmentData = {
      reason,
      date,
      notes,
      timestamp: new Date().toISOString(),
    };
    try {
      await apiClient.post('/api/v1/appointments', {
        reason,
        preferred_date: date,
        notes,
      });
      await AppStorage.setLastAppointment(appointmentData);
      Alert.alert(t.requestSaved || 'Request Saved', t.appointmentBookedAlert || 'Your appointment request has been scheduled in the clinic triage queue.', [
        { text: t.done || 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch {
      await AppStorage.setLastAppointment(appointmentData);
      Alert.alert(
        'Saved Locally',
        'Your appointment request was queued locally and saved to your device. Please contact your clinic for urgent queries.',
        [{ text: t.done || 'Done', onPress: () => navigation.goBack() }]
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top + 8, 20),
          paddingBottom: Math.max(insets.bottom + 24, 36),
        },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity
        style={styles.back}
        onPress={() => navigation.goBack()}
        activeOpacity={0.75}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View style={styles.backIconBox}>
          <Ionicons name="chevron-back" size={20} color={Colors.primaryTeal} />
        </View>
        <Text style={styles.backText}>{t.cancel || 'Back'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t.bookAppointment || 'Book Appointment'}</Text>
      <Text style={styles.subtitle}>
        Create a request for clinical review. Scheduling is automatically coordinated with your primary clinic.
      </Text>

      <Text style={styles.label}>{t.reasonForVisit || 'Reason for Visit'}</Text>
      <View style={styles.chips}>
        {reasons.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.chip, reason === item.key && styles.active]}
            onPress={() => setReason(item.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, reason === item.key && styles.activeText]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t.preferredDateLabel || 'Preferred Date (ISO-8601 YYYY-MM-DD)'}</Text>
      <View style={styles.chips}>
        {presetDates.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.chip, date === item.value && styles.active]}
            onPress={() => setDate(item.value)}
            activeOpacity={0.75}
          >
            <Ionicons
              name="calendar-outline"
              size={14}
              color={date === item.value ? Colors.primaryDark : Colors.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.chipText, date === item.value && styles.activeText]}>
              {item.label} ({item.value.slice(5)})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <IsoDatePickerField
        label={t.customPreferredDate || 'Custom Preferred Date'}
        value={date}
        onChange={setDate}
        placeholder="YYYY-MM-DD"
        allowFuture={true}
      />

      <Text style={styles.label}>{t.clinicalNotesLabel || 'Clinical Notes / Symptoms'}</Text>
      <TextInput
        style={[styles.input, { height: 100, paddingTop: 12 }]}
        value={notes}
        onChangeText={setNotes}
        multiline
        textAlignVertical="top"
        placeholder={t.clinicalNotesPlaceholder || t.symptomsField || 'Anything the clinic should know about your symptoms'}
        placeholderTextColor={Colors.textMuted}
      />

      <TouchableOpacity style={styles.button} disabled={busy} onPress={submit} activeOpacity={0.85}>
        <Text style={styles.buttonText}>
          {busy ? (t.savingAppointment || 'Saving...') : (t.confirmAppointmentBtn || 'Confirm Appointment Request')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 18 },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  backText: { color: Colors.primaryTeal, fontWeight: '800', fontSize: 14 },
  title: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginTop: 4, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '800', color: Colors.textSecondary, marginTop: 14, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.white,
  },
  active: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryTeal },
  chipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700' },
  activeText: { color: Colors.primaryDark },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 11,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  button: {
    height: 52,
    borderRadius: 13,
    backgroundColor: Colors.primaryTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: Colors.primaryTeal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: { color: Colors.white, fontWeight: '900', fontSize: 15 },
});

export default AppointmentScreen;
