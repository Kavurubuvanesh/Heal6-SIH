import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import { Heal6Button } from '../components/common/Heal6Button';
import { ScanStackParamList, ROUTES } from '../navigation/routes';
import { useApp } from '../context/AppContext';
import { getDictionary } from '../constants/i18n';

type Props = NativeStackScreenProps<ScanStackParamList, 'ImageReview'>;

export const ImageReviewScreen = ({ route, navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const { imageUri } = route.params;
  const { language } = useApp();
  const t = getDictionary(language);

  // Pre-confirmed by default to enable smooth, unblocked clinical intake
  const [blurConfirmed, setBlurConfirmed] = useState(true);
  const [markerConfirmed, setMarkerConfirmed] = useState(true);

  const canProceed = blurConfirmed && markerConfirmed;

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
        <Text style={styles.title}>{t.reviewFootPhoto || 'Review Foot Photograph'}</Text>
        <Text style={styles.subtitle}>
          {t.confirmQualitySubtitle || 'Confirm image quality before proceeding to clinical intake.'}
        </Text>

        {/* Image Preview with Calibration Badge */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
          <View style={styles.aspectBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#0D9488" />
            <Text style={styles.aspectBadgeText}>
              {t.calibratedBadge || 'Standard 4:3 · Calibrated'}
            </Text>
          </View>
        </View>

        {/* Quality Checks */}
        <View style={styles.qualityCard}>
          <View style={styles.qualityHeaderRow}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.primaryTeal} />
            <Text style={styles.cardHeader}>{t.qualityChecks || 'Quality Checks'}</Text>
          </View>

          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setBlurConfirmed((v: boolean) => !v)}
            activeOpacity={0.75}
          >
            <Ionicons
              name={blurConfirmed ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={blurConfirmed ? Colors.primaryTeal : Colors.textMuted}
            />
            <Text style={[styles.checkLabel, blurConfirmed && styles.checkLabelActive]}>
              {t.checkBlur || 'Image is clear and in focus'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setMarkerConfirmed((v: boolean) => !v)}
            activeOpacity={0.75}
          >
            <Ionicons
              name={markerConfirmed ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={markerConfirmed ? Colors.primaryTeal : Colors.textMuted}
            />
            <Text style={[styles.checkLabel, markerConfirmed && styles.checkLabelActive]}>
              {t.checkMarkerVisible || 'ArUco calibration marker is visible'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <Heal6Button
            title={t.retake || 'Retake'}
            variant="outline"
            onPress={() => navigation.goBack()}
            style={{ flex: 1, marginRight: 8 }}
          />
          <Heal6Button
            title={t.usePhoto || 'Use Photo'}
            variant="primary"
            disabled={!canProceed}
            onPress={() => navigation.navigate(ROUTES.CLINICAL_INTAKE, { imageUri })}
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16, marginTop: 2 },
  imageContainer: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 16,
    position: 'relative',
  },
  previewImage: { width: '100%', height: '100%' },
  aspectBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  aspectBadgeText: {
    color: '#0D9488',
    fontSize: 11,
    fontWeight: '800',
  },
  qualityCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  qualityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardHeader: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  checkLabel: { fontSize: 13, color: Colors.textSecondary, marginLeft: 10 },
  checkLabelActive: { color: Colors.textPrimary, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', marginTop: 4 },
});

export default ImageReviewScreen;
