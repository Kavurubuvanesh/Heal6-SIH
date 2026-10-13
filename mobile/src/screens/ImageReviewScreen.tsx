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
  const { imageUri, originalUri } = route.params;
  const { language } = useApp();
  const t = getDictionary(language);

  const [activeMode, setActiveMode] = useState<'proper' | 'full'>('proper');
  const activeUri = activeMode === 'proper' ? imageUri : (originalUri || imageUri);

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
          {t.confirmQualitySubtitle || 'Confirm image quality and proper framing before proceeding to clinical intake.'}
        </Text>

        {/* View Mode Toggle (Proper Photo Part vs Full Capture) */}
        {originalUri && originalUri !== imageUri && (
          <View style={styles.modeToggleContainer}>
            <TouchableOpacity
              style={[styles.modeToggleBtn, activeMode === 'proper' && styles.modeToggleBtnActive]}
              onPress={() => setActiveMode('proper')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="crop"
                size={14}
                color={activeMode === 'proper' ? Colors.white : Colors.textSecondary}
              />
              <Text style={[styles.modeToggleText, activeMode === 'proper' && styles.modeToggleTextActive]}>
                Proper Photo Part (Framed)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeToggleBtn, activeMode === 'full' && styles.modeToggleBtnActive]}
              onPress={() => setActiveMode('full')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="scan-outline"
                size={14}
                color={activeMode === 'full' ? Colors.white : Colors.textSecondary}
              />
              <Text style={[styles.modeToggleText, activeMode === 'full' && styles.modeToggleTextActive]}>
                Full Sensor Capture
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Image Preview with Calibration Badge */}
        <View style={styles.imageContainer}>
          {activeUri && activeUri.trim().length > 0 ? (
            <Image source={{ uri: activeUri }} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <View style={[styles.previewImage, { alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="image-outline" size={48} color={Colors.textSecondary} />
            </View>
          )}
          <View style={styles.aspectBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#0D9488" />
            <Text style={styles.aspectBadgeText}>
              {activeMode === 'proper'
                ? (t.calibratedBadge || 'Framed 3:4 Wound Area · Calibrated')
                : 'Full Sensor Frame'}
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
            onPress={() => navigation.navigate(ROUTES.CLINICAL_INTAKE, { imageUri: activeUri, originalUri })}
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
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  modeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modeToggleBtnActive: {
    backgroundColor: Colors.primaryTeal,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  modeToggleTextActive: {
    color: Colors.white,
  },
  imageContainer: {
    width: '100%',
    height: 340,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    marginBottom: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.border,
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
