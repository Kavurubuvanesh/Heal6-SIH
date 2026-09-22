import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { getDictionary } from '../constants/i18n';

import * as Haptics from 'expo-haptics';

interface AccordionItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  tag: string;
  tagColor: string;
}

export const GuideScreen = () => {
  const insets = useSafeAreaInsets();
  const { language } = useApp();
  const t = getDictionary(language);

  // Hidden Jury Mode: Patients only see Patient Care Guide by default.
  // Tapping header 3 times rapidly reveals deep-tech Clinical & Jury Specs!
  const [juryModeUnlocked, setJuryModeUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'patient' | 'clinical'>('patient');
  const [expandedId, setExpandedId] = useState<string | null>('aruco');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const tapCountRef = React.useRef(0);
  const lastTapTimeRef = React.useRef(0);

  const handleHeaderTap = async () => {
    const now = Date.now();
    if (now - lastTapTimeRef.current < 600) {
      tapCountRef.current += 1;
    } else {
      tapCountRef.current = 1;
    }
    lastTapTimeRef.current = now;

    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      setJuryModeUnlocked(true);
      setActiveTab('clinical');
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Fallback on web/unsupported
      }
      setToastMessage(t.juryUnlockedToast || '🔓 SIH Jury & Clinician Mode Unlocked (Deep-Tech Specs)');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const patientTips = [
    {
      id: 'wash',
      icon: 'water' as const,
      iconColor: '#0284C7',
      bg: '#E0F2FE',
      step: t.step1Badge || 'Step 1',
      title: t.step1Title || 'Wash & Dry Gently Everyday',
      instructions: [
        t.step1Point1 || 'Wash feet daily in lukewarm water (test warmth with your elbow or thermometer, not your feet).',
        t.step1Point2 || 'Avoid soaking your feet for longer than 5 minutes to prevent skin softening and cracks.',
        t.step1Point3 || 'Pat dry thoroughly with a soft towel, paying extra attention to drying between each toe.',
        t.step1Point4 || 'Apply fragrance-free moisturizing lotion to heels and soles, but never between the toes.',
      ],
    },
    {
      id: 'inspect',
      icon: 'eye' as const,
      iconColor: '#059669',
      bg: '#DCFCE7',
      step: t.step2Badge || 'Step 2',
      title: t.step2Title || 'Daily Evening Visual Inspection',
      instructions: [
        t.step2Point1 || 'Inspect the soles, heels, and spaces between toes every evening under bright lighting.',
        t.step2Point2 || 'Use a hand mirror on the floor or ask a family member to check hard-to-see areas.',
        t.step2Point3 || 'Look closely for blisters, tiny cuts, skin redness, bruises, calluses, or unusual skin warmth.',
        t.step2Point4 || 'Never attempt to cut corns or calluses yourself with razor blades or chemical removers.',
      ],
    },
    {
      id: 'shoes',
      icon: 'shield-checkmark' as const,
      iconColor: '#7C3AED',
      bg: '#F3E8FF',
      step: t.step3Badge || 'Step 3',
      title: t.step3Title || 'Safe Footwear & Socks',
      instructions: [
        t.step3Point1 || 'Always wear clean, light-colored seamless cotton or moisture-wicking diabetic socks.',
        t.step3Point2 || 'Always reach inside your shoes with your hand before slipping your feet in to feel for pebbles or torn linings.',
        t.step3Point3 || 'Never walk barefoot, even indoors on carpets or tiled floors.',
        t.step3Point4 || 'Wear supportive, closed-toe shoes with cushioned soles that do not pinch your toes.',
      ],
    },
    {
      id: 'camera',
      icon: 'camera' as const,
      iconColor: Colors.primaryTeal,
      bg: '#CCFBF1',
      step: t.step4Badge || 'Step 4',
      title: t.step4Title || 'How to Take a Screening Photo',
      instructions: [
        t.step4Point1 || 'Sit comfortably and rest your foot on a clean, flat surface in a brightly lit room.',
        t.step4Point2 || 'Hold the phone 20–30 cm away, keeping the camera lens parallel to the sole of your foot.',
        t.step4Point3 || 'Place the 25mm Heal6 calibration marker flat next to your foot without covering any skin.',
        t.step4Point4 || 'Hold still for 1 second until the green alignment frame turns solid.',
      ],
    },
    {
      id: 'warning',
      icon: 'alert-circle' as const,
      iconColor: '#DC2626',
      bg: '#FEE2E2',
      step: t.step5Badge || 'Warning Signs',
      title: t.step5Title || 'When to Contact the Clinic Urgently',
      instructions: [
        t.step5Point1 || 'A sore or cut that does not improve after 48 hours.',
        t.step5Point2 || 'Spreading redness, swelling, or heat radiating from your foot.',
        t.step5Point3 || 'Any yellowish or cloudy fluid draining from a wound.',
        t.step5Point4 || 'Skin turning dark purple, blue, or black.',
      ],
    },
  ];

  const clinicalProtocols: AccordionItem[] = [
    {
      id: 'aruco',
      icon: 'qr-code-outline',
      title: t.arucoTitle || '1. ArUco Metric Spatial Calibration Pipeline',
      body:
        t.arucoBody ||
        'Heal6 utilizes a standardized 25mm ArUco fiducial marker placed coplanar with the plantar surface. The OpenCV module detects marker quad corners, computes pixel-to-millimeter ratio (PPM), and corrects affine/perspective tilt distortion. This guarantees millimeter-accurate ulcer surface area (cm²) measurement across heterogeneous mobile sensors.',
      tag: 'Computer Vision',
      tagColor: Colors.primaryTeal,
    },
    {
      id: 'sinbad',
      icon: 'calculator-outline',
      title: t.sinbadTitle || '2. Validated SINBAD 6-Factor Clinical Staging',
      body:
        t.sinbadBody ||
        'SINBAD evaluates 6 validated clinical factors (Site [midfoot/hindfoot], Ischemia [pulse deficit], Neuropathy [loss of protective sensation], Bacterial Infection [erythema/edema], Area [≥1 cm²], and Depth [subcutaneous/bone invasion]). Each scores 0 or 1 for a composite score of 0–6. Scores ≥3 mandate specialist escalation within 24h.',
      tag: 'Clinical Score',
      tagColor: '#D97706',
    },
    {
      id: 'ai_pipeline',
      icon: 'pulse-outline',
      title: t.escalationTitle || '3. Dual-Stage AI: ConvNeXt & UNet++ Architecture',
      body:
        t.escalationBody ||
        'Stage 1 uses a ConvNeXt-Tiny classifier for binary ulcer gating and deep-tissue bacterial infection risk probability. If abnormal tissue is identified, Stage 2 deploys a UNet++ multi-class segmentation network that segments wound margins and calculates exact proportional tissue composition (viable granulation vs slough vs necrotic eschar).',
      tag: 'Deep Learning',
      tagColor: '#2563EB',
    },
    {
      id: 'fhir',
      icon: 'git-network-outline',
      title: t.dailyCareTitle || '4. FHIR R4 Bundle Interoperability & Offline Sync',
      body:
        t.dailyCareBody ||
        'Clinical assessments are serialized into standard HL7 FHIR R4 Bundles containing Patient, Condition, and DiagnosticReport resources with LOINC and SNOMED-CT codings. All assessments are cached on-device in an encrypted offline store (IndexedDB/AsyncStorage) and pushed via idempotency keys when connectivity resumes.',
      tag: 'FHIR Interop',
      tagColor: '#7C3AED',
    },
  ];

  const appArchitectures = [
    {
      icon: 'camera-outline' as const,
      title: 'Computer Vision Calibration',
      body: 'Homography transformation with 25mm fiducial marker for angle & scale normalization.',
    },
    {
      icon: 'git-branch-outline' as const,
      title: 'SINBAD Clinical Escalation',
      body: 'Automated referral routing based on validated diabetic foot ulcer risk stratification.',
    },
    {
      icon: 'cloud-offline-outline' as const,
      title: 'Offline-First Local Caching',
      body: 'Zero-latency edge inferencing & local storage with automatic cloud synchronization.',
    },
    {
      icon: 'document-text-outline' as const,
      title: 'Automated Clinical PDF Generation',
      body: 'Physician-ready PDF reports with tissue breakdown, risk classification, and FHIR metadata.',
    },
  ];

  const toggleAccordion = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
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
      {/* Header with 3-Tap Hidden Jury Reveal Trigger */}
      <TouchableOpacity
        onPress={handleHeaderTap}
        activeOpacity={0.9}
        style={styles.headerTouchArea}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t.guideTitle || 'Foot Care & Clinical Guide'}</Text>
          {juryModeUnlocked && (
            <View style={styles.juryUnlockedPill}>
              <Ionicons name="lock-open" size={12} color="#0D9488" />
              <Text style={styles.juryUnlockedPillText}>Jury Mode</Text>
            </View>
          )}
        </View>
        <Text style={styles.lead}>{t.disclaimer}</Text>
      </TouchableOpacity>

      {/* Floating Reveal Toast */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Ionicons name="sparkles" size={16} color="#A7F3D0" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Segmented Mode Switcher: Hidden until 3-tap Jury reveal */}
      {juryModeUnlocked ? (
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'patient' && styles.tabBtnActive]}
            onPress={() => setActiveTab('patient')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="heart"
              size={16}
              color={activeTab === 'patient' ? Colors.white : Colors.textSecondary}
            />
            <Text style={[styles.tabBtnText, activeTab === 'patient' && styles.tabBtnTextActive]}>
              {t.patientCareGuide || 'Patient Care Guide'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'clinical' && styles.tabBtnActive]}
            onPress={() => setActiveTab('clinical')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="hardware-chip"
              size={16}
              color={activeTab === 'clinical' ? Colors.white : Colors.textSecondary}
            />
            <Text style={[styles.tabBtnText, activeTab === 'clinical' && styles.tabBtnTextActive]}>
              {t.clinicalJurySpecs || 'Clinical & Jury Specs'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.patientOnlyHeaderBadge}>
          <Ionicons name="shield-checkmark" size={15} color={Colors.primaryTeal} />
          <Text style={styles.patientOnlyHeaderBadgeText}>
            {t.diabeticSelfCareRoutine || 'Diabetic Foot Self-Care & Prevention Routine'}
          </Text>
        </View>
      )}

      {activeTab === 'patient' ? (
        /* Patient Friendly View */
        <View style={styles.patientContainer}>
          <View style={styles.patientBanner}>
            <View style={styles.patientBannerIcon}>
              <Ionicons name="sparkles" size={24} color={Colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.patientBannerTitle}>{t.dailyHabitsTitle || 'Daily Habits for Healthy Feet'}</Text>
              <Text style={styles.patientBannerSub}>
                {t.dailyHabitsSub || 'Simple daily routines prevent up to 85% of diabetic foot complications.'}
              </Text>
            </View>
          </View>

          {patientTips.map((tip) => (
            <View key={tip.id} style={styles.tipCard}>
              <View style={styles.tipCardHeader}>
                <View style={[styles.tipIconCircle, { backgroundColor: tip.bg }]}>
                  <Ionicons name={tip.icon} size={20} color={tip.iconColor} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.tipStep, { color: tip.iconColor }]}>{tip.step}</Text>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                </View>
              </View>

              <View style={styles.tipList}>
                {tip.instructions.map((inst, idx) => (
                  <View key={idx} style={styles.tipBulletRow}>
                    <View style={[styles.bulletDot, { backgroundColor: tip.iconColor }]} />
                    <Text style={styles.tipBulletText}>{inst}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : (
        /* Clinical & Jury Mode */
        <View style={styles.clinicalContainer}>
          <View style={styles.juryBanner}>
            <Ionicons name="shield-checkmark" size={24} color="#0D9488" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.juryBannerTitle}>{t.juryBannerTitle || 'SIH Jury & Clinical Technical Specifications'}</Text>
              <Text style={styles.juryBannerSub}>
                {t.juryBannerSub || 'Formal scientific architecture, fiducial calibration, and multi-stage ML pipelines.'}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>{t.protocolsTitle || 'Algorithmic & Clinical Protocols'}</Text>

          {clinicalProtocols.map((acc) => {
            const isExpanded = expandedId === acc.id;

            return (
              <View
                key={acc.id}
                style={[styles.accordionCard, isExpanded && styles.accordionCardExpanded]}
              >
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => toggleAccordion(acc.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.accordionIcon, { backgroundColor: Colors.primaryLight }]}>
                    <Ionicons name={acc.icon} size={20} color={acc.tagColor} />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.tagRow}>
                      <View style={[styles.badge, { backgroundColor: '#F1F5F9' }]}>
                        <Text style={[styles.badgeText, { color: acc.tagColor }]}>{acc.tag}</Text>
                      </View>
                    </View>
                    <Text style={styles.accordionTitle}>{acc.title}</Text>
                  </View>

                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.accordionBodyContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.accordionBodyText}>{acc.body}</Text>
                  </View>
                )}
              </View>
            );
          })}

          <Text style={[styles.sectionHeader, { marginTop: 20 }]}>System Architecture & Workflows</Text>

          {appArchitectures.map((s, i) => (
            <View key={i} style={styles.appCard}>
              <View style={styles.appIcon}>
                <Ionicons name={s.icon} size={20} color={Colors.primaryTeal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.appCardTitle}>{s.title}</Text>
                <Text style={styles.appBody}>{s.body}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16 },
  headerTouchArea: {
    paddingVertical: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary },
  juryUnlockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#CCFBF1',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  juryUnlockedPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
  },
  lead: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginTop: 4 },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#065F46',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  toastText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  patientOnlyHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  patientOnlyHeaderBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },

  /* Segmented Tab Switcher */
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginTop: 14,
    marginBottom: 14,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: Colors.primaryTeal,
    shadowColor: Colors.primaryTeal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabBtnTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },

  /* Patient Guide Styles */
  patientContainer: {
    marginTop: 4,
  },
  patientBanner: {
    backgroundColor: Colors.primaryTeal,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  patientBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientBannerTitle: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  patientBannerSub: {
    color: '#DCEFF6',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  tipCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  tipCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipStep: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 1,
  },
  tipList: {
    gap: 8,
    paddingLeft: 4,
  },
  tipBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  tipBulletText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 18,
  },

  /* Clinical / Jury Styles */
  clinicalContainer: {
    marginTop: 4,
  },
  juryBanner: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  juryBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F766E',
  },
  juryBannerSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  accordionCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  accordionCardExpanded: {
    borderColor: Colors.primaryTeal,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  accordionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagRow: { flexDirection: 'row', marginBottom: 3 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '800' },
  accordionTitle: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  accordionBodyContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  accordionBodyText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  appCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  appIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appCardTitle: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, marginBottom: 2 },
  appBody: { fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
});

export default GuideScreen;
