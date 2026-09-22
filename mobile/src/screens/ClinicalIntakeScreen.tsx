import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import { Heal6Button } from '../components/common/Heal6Button';
import { SinbadClinicalData } from '../types/sinbad.types';
import { ScanStackParamList, ROUTES } from '../navigation/routes';
import { useApp } from '../context/AppContext';
import { getDictionary } from '../constants/i18n';

type Props = NativeStackScreenProps<ScanStackParamList, 'ClinicalIntake'>;

export const ClinicalIntakeScreen = ({ route, navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const { imageUri } = route.params;
  const { symptomFlags, profile, language } = useApp();
  const t = getDictionary(language);

  const activeSymptomNames = Object.entries(symptomFlags || {})
    .filter(([_, v]) => Boolean(v))
    .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));

  const [patientId, setPatientId] = useState(profile?.name ? `PT-${profile.name.replace(/\s+/g, '').toUpperCase().slice(0, 6)}` : '');

  const hasInfection = Boolean(symptomFlags?.redness || symptomFlags?.warmth || symptomFlags?.swelling);
  const hasNeuropathy = Boolean(symptomFlags?.numbness || symptomFlags?.tingling);
  const hasUlcer = Boolean(symptomFlags?.ulcer);

  const [clinicalData, setClinicalData] = useState<SinbadClinicalData>(() => ({
    site: 'forefoot',
    ischemia: 'normal_pulse',
    neuropathy: hasNeuropathy ? 'loss_of_sensation' : 'protective_sensation_intact',
    bacterialInfection: hasInfection ? 'present' : 'none',
    area: hasUlcer ? 'greater_or_equal_1cm' : 'less_than_1cm',
    depth: 'superficial',
    has_infection: hasInfection,
    has_neuropathy: hasNeuropathy,
    symptomFlags: symptomFlags,
  }));

  const handleNext = () => {
    if (!patientId.trim()) {
      Alert.alert('Missing Information', 'Please enter a Patient Identifier.');
      return;
    }
    navigation.navigate(ROUTES.ANALYSIS_LOADING, { imageUri, patientId, clinicalData });
  };

  const renderSelectGroup = <T extends string>(
    title: string,
    currentValue: T,
    options: { label: string; value: T }[],
    onSelect: (val: T) => void
  ) => (
    <View style={styles.groupContainer}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.optionsRow}>
        {options.map((opt) => {
          const isSelected = currentValue === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.optionCard, isSelected && styles.optionCardSelected]}
              onPress={() => onSelect(opt.value)}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 6, 18),
            paddingBottom: 36 + insets.bottom,
          },
        ]}
      >
        {/* Visual Step Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '66.6%' }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressStepDone}>{t.stepPhoto || '✓ Photo'}</Text>
            <Text style={styles.progressStepActive}>{t.stepSinbad || 'Clinical SINBAD'}</Text>
            <Text style={styles.progressStepNext}>{t.stepAnalysis || 'Analysis'}</Text>
          </View>
        </View>

        {activeSymptomNames.length > 0 && (
          <View style={styles.calibrationCard}>
            <View style={styles.calibrationHeader}>
              <Ionicons name="sparkles" size={16} color={Colors.primaryTeal} />
              <Text style={styles.calibrationTitle}>{t.calibratedFromSymptoms || 'Calibrated from Home Symptoms'}</Text>
            </View>
            <Text style={styles.calibrationSubtitle}>
              {t.calibratedSubtitle || 'Default SINBAD indicators adjusted based on: '}{activeSymptomNames.join(', ')}
            </Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t.patientIdentifierLabel || 'Patient Identifier / MRN *'}</Text>
          <TextInput style={styles.textInput} placeholder="e.g., PT-88231" value={patientId} onChangeText={setPatientId} />
        </View>

        {renderSelectGroup(
          t.siteGroup || '1. Site of Ulcer/Lesion',
          clinicalData.site,
          [
            { label: t.siteForefoot || 'Forefoot', value: 'forefoot' },
            { label: t.siteMidfoot || 'Midfoot/Hindfoot', value: 'midfoot' },
            { label: t.siteNone || 'None Visible', value: 'none' },
          ],
          (site) => setClinicalData((prev: SinbadClinicalData) => ({ ...prev, site }))
        )}

        {renderSelectGroup(
          t.ischemiaGroup || '2. Ischemia (Pedal Pulses)',
          clinicalData.ischemia,
          [
            { label: t.ischemiaNormal || 'Normal Pulses', value: 'normal_pulse' },
            { label: t.ischemiaReduced || 'Reduced / Absent Pulse', value: 'reduced_or_absent' },
          ],
          (ischemia) => setClinicalData((prev: SinbadClinicalData) => ({ ...prev, ischemia }))
        )}

        {renderSelectGroup(
          t.neuropathyGroup || '3. Neuropathy (Monofilament Test)',
          clinicalData.neuropathy,
          [
            { label: t.neuropathyIntact || 'Sensation Intact', value: 'protective_sensation_intact' },
            { label: t.neuropathyLoss || 'Loss of Sensation', value: 'loss_of_sensation' },
          ],
          (neuropathy) => setClinicalData((prev: SinbadClinicalData) => ({ ...prev, neuropathy }))
        )}

        {renderSelectGroup(
          t.infectionGroup || '4. Bacterial Infection',
          clinicalData.bacterialInfection,
          [
            { label: t.infectionNone || 'None', value: 'none' },
            { label: t.infectionPresent || 'Present / Signs of Infection', value: 'present' },
          ],
          (bacterialInfection) => setClinicalData((prev: SinbadClinicalData) => ({ ...prev, bacterialInfection }))
        )}

        {renderSelectGroup(
          t.areaGroup || '5. Area of Lesion',
          clinicalData.area,
          [
            { label: t.areaLess || '< 1 cm²', value: 'less_than_1cm' },
            { label: t.areaGreater || '≥ 1 cm²', value: 'greater_or_equal_1cm' },
          ],
          (area) => setClinicalData((prev: SinbadClinicalData) => ({ ...prev, area }))
        )}

        {renderSelectGroup(
          t.depthGroup || '6. Depth',
          clinicalData.depth,
          [
            { label: t.depthSuperficial || 'Superficial (Skin/Subcutaneous)', value: 'superficial' },
            { label: t.depthDeep || 'Deep (Tendon/Bone)', value: 'deep_ulcer_or_bone' },
          ],
          (depth) => setClinicalData((prev: SinbadClinicalData) => ({ ...prev, depth }))
        )}

        <Heal6Button title={t.proceedToAnalysis || 'Proceed to Analysis'} onPress={handleNext} style={{ marginTop: 20, marginBottom: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  stepHeader: { fontSize: 13, fontWeight: '700', color: Colors.primaryTeal, marginBottom: 16 },
  calibrationCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  calibrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  calibrationTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
  },
  calibrationSubtitle: {
    fontSize: 12,
    color: '#0284C7',
    lineHeight: 16,
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6 },
  textInput: { height: 48, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, fontSize: 15, color: Colors.textPrimary },
  groupContainer: { marginBottom: 20 },
  groupTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionCard: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, flexGrow: 1, alignItems: 'center' },
  optionCardSelected: { borderColor: Colors.primaryTeal, backgroundColor: Colors.primaryLight },
  optionText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  optionTextSelected: { color: Colors.primaryDark, fontWeight: '700' },
  progressContainer: { marginBottom: 20 },
  progressTrack: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: 6, backgroundColor: Colors.primaryTeal, borderRadius: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressStepDone: { fontSize: 10, fontWeight: '700', color: Colors.success },
  progressStepActive: { fontSize: 10, fontWeight: '900', color: Colors.primaryTeal },
  progressStepNext: { fontSize: 10, fontWeight: '600', color: Colors.textMuted },
});
