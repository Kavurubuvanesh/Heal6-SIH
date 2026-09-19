import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import { Heal6Button } from '../components/common/Heal6Button';
import { ScanStackParamList, ROUTES } from '../navigation/routes';
import { useApp } from '../context/AppContext';
import { getDictionary } from '../constants/i18n';

type Props = NativeStackScreenProps<ScanStackParamList, 'ScannerInstructions'>;

export const ScannerInstructionsScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const { language } = useApp();
  const t = getDictionary(language);

  const [checklist, setChecklist] = useState({
    distance: false,
    lighting: false,
    marker: false,
    focus: false,
  });

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev: typeof checklist) => ({ ...prev, [key]: !prev[key] }));
  };

  const confirmAllAndProceed = () => {
    setChecklist({
      distance: true,
      lighting: true,
      marker: true,
      focus: true,
    });
    navigation.navigate(ROUTES.CAMERA_SCAN);
  };

  const allChecked = Object.values(checklist).every(Boolean);

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
        {/* Header */}
        <Text style={styles.title}>{t.cameraSetupGuidelines || 'Camera Setup Guidelines'}</Text>
        <Text style={styles.subtitle}>
          {t.followTheseSteps || 'Follow these steps to ensure reliable image capture.'}
        </Text>

        {/* Quick Start Action Bar */}
        <TouchableOpacity
          style={styles.quickStartBanner}
          onPress={confirmAllAndProceed}
          activeOpacity={0.88}
        >
          <View style={styles.quickStartIcon}>
            <Ionicons name="flash" size={22} color={Colors.white} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.quickStartTitle}>
              {t.confirmAllAndScan || 'Confirm All & Start Scan'}
            </Text>
            <Text style={styles.quickStartSubtitle}>
              Skip manual checklist for repeat scans & clinical trials
            </Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={26} color={Colors.white} />
        </TouchableOpacity>

        {/* Step 1 */}
        <View style={styles.guideStep}>
          <View style={styles.stepIconWrap}>
            <Ionicons name="expand-outline" size={24} color={Colors.primaryTeal} />
          </View>
          <View style={styles.stepTextContent}>
            <Text style={styles.stepTitle}>{t.distanceTitle || '1. Distance (~30 cm)'}</Text>
            <Text style={styles.stepDescription}>
              {t.distanceDesc || 'Position camera 30 cm away perpendicular to the plantar foot surface.'}
            </Text>
          </View>
        </View>

        {/* Step 2 */}
        <View style={styles.guideStep}>
          <View style={styles.stepIconWrap}>
            <Ionicons name="sunny-outline" size={24} color={Colors.primaryTeal} />
          </View>
          <View style={styles.stepTextContent}>
            <Text style={styles.stepTitle}>{t.lightingTitle || '2. Uniform Lighting'}</Text>
            <Text style={styles.stepDescription}>
              {t.lightingDesc || 'Avoid direct shadows over lesion sites. Use the flash toggle if in dim rooms.'}
            </Text>
          </View>
        </View>

        {/* Step 3 */}
        <View style={styles.guideStep}>
          <View style={styles.stepIconWrap}>
            <Ionicons name="qr-code-outline" size={24} color={Colors.primaryTeal} />
          </View>
          <View style={styles.stepTextContent}>
            <Text style={styles.stepTitle}>{t.markerTitle || '3. ArUco Marker Placement'}</Text>
            <Text style={styles.stepDescription}>
              {t.markerDesc || 'Place printable ArUco marker adjacent to foot within target indicator box for spatial scale reference.'}
            </Text>
          </View>
        </View>

        {/* Checklist */}
        <Text style={styles.checklistHeader}>
          {t.preScanChecklist || 'Pre-Scan Verification Checklist'}
        </Text>

        <TouchableOpacity style={styles.checkItem} onPress={() => toggleCheck('distance')} activeOpacity={0.75}>
          <Ionicons
            name={checklist.distance ? 'checkbox' : 'square-outline'}
            size={24}
            color={checklist.distance ? Colors.primaryTeal : Colors.textMuted}
          />
          <Text style={[styles.checkText, checklist.distance && styles.checkTextActive]}>
            {t.checkDistance || 'Foot fully framed at ~30 cm distance'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.checkItem} onPress={() => toggleCheck('lighting')} activeOpacity={0.75}>
          <Ionicons
            name={checklist.lighting ? 'checkbox' : 'square-outline'}
            size={24}
            color={checklist.lighting ? Colors.primaryTeal : Colors.textMuted}
          />
          <Text style={[styles.checkText, checklist.lighting && styles.checkTextActive]}>
            {t.checkLighting || 'Adequate lighting without glare'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.checkItem} onPress={() => toggleCheck('marker')} activeOpacity={0.75}>
          <Ionicons
            name={checklist.marker ? 'checkbox' : 'square-outline'}
            size={24}
            color={checklist.marker ? Colors.primaryTeal : Colors.textMuted}
          />
          <Text style={[styles.checkText, checklist.marker && styles.checkTextActive]}>
            {t.checkMarker || 'ArUco calibration marker in position'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.checkItem} onPress={() => toggleCheck('focus')} activeOpacity={0.75}>
          <Ionicons
            name={checklist.focus ? 'checkbox' : 'square-outline'}
            size={24}
            color={checklist.focus ? Colors.primaryTeal : Colors.textMuted}
          />
          <Text style={[styles.checkText, checklist.focus && styles.checkTextActive]}>
            {t.checkFocus || 'Camera lens clean and in clear focus'}
          </Text>
        </TouchableOpacity>

        {/* Guarded Clinical Action Button */}
        <TouchableOpacity
          disabled={!allChecked}
          onPress={() => navigation.navigate(ROUTES.CAMERA_SCAN)}
          style={[
            styles.continueBtn,
            !allChecked && styles.continueBtnDisabled,
          ]}
          activeOpacity={0.85}
        >
          <Ionicons
            name={allChecked ? 'camera' : 'lock-closed'}
            size={19}
            color={Colors.white}
          />
          <Text style={styles.continueBtnText}>
            {allChecked
              ? (t.continueToCamera || 'Continue to Camera')
              : `Verify All 4 Checklist Items (${Object.values(checklist).filter(Boolean).length}/4)`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 18, paddingBottom: 36 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, marginBottom: 16 },
  quickStartBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryTeal,
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    shadowColor: Colors.primaryTeal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  quickStartIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStartTitle: {
    color: Colors.white,
    fontWeight: '900',
    fontSize: 15,
  },
  quickStartSubtitle: {
    color: '#DCEFF6',
    fontSize: 11,
    marginTop: 2,
  },
  guideStep: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    alignItems: 'center',
  },
  stepIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTextContent: { marginLeft: 14, flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  stepDescription: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  checklistHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 14,
    marginBottom: 10,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
    borderRadius: 10,
    marginBottom: 6,
  },
  checkText: { fontSize: 13, color: Colors.textSecondary, marginLeft: 12, flex: 1, fontWeight: '600' },
  checkTextActive: { color: Colors.primaryDark, fontWeight: '700' },
  continueBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primaryTeal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 28,
    shadowColor: Colors.primaryTeal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  continueBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.65,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});

export default ScannerInstructionsScreen;
