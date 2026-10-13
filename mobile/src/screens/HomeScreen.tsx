import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const SCREEN_W = Dimensions.get('window').width;

const SYMPTOM_DESC: Record<string, string> = {
  ulcer:    'Sores or open wounds on your foot that are not healing.',
  redness:  'Areas of red, dark, or unusual color on your foot.',
  swelling: 'Noticeable swelling in your foot or ankle.',
  warmth:   'Your foot feels warmer than usual to the touch.',
  pain:     'Pain, soreness, or tenderness in your foot.',
  numbness: 'Difficulty feeling touch, temperature, or pain.',
  tingling: 'A tingling, pins-and-needles, or burning feeling.',
};

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/routes';
import { Colors } from '../constants/colors';
import { MainTabParamList, ROUTES } from '../navigation/routes';
import { useApp } from '../context/AppContext';
import { getDictionary } from '../constants/i18n';
import { OfflineStorage } from '../services/offlineStorage';
import { AppStorage, SavedAppointment } from '../services/appStorage';
import { PatientRecord } from '../types/assessment.types';
import { TutorialOverlay } from '../components/common/TutorialOverlay';
import { ScreeningService } from '../api/screeningService';

const symptomItems: {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  sinbadImpact: string;
  sinbadPoints: number;
}[] = [
  { key: 'ulcer', icon: 'bandage-outline', sinbadImpact: '+1 Area', sinbadPoints: 1 },
  { key: 'redness', icon: 'water-outline', sinbadImpact: '+1 Infection', sinbadPoints: 1 },
  { key: 'swelling', icon: 'footsteps-outline', sinbadImpact: '+1 Inflam.', sinbadPoints: 1 },
  { key: 'warmth', icon: 'thermometer-outline', sinbadImpact: '+1 Heat', sinbadPoints: 1 },
  { key: 'pain', icon: 'flash-outline', sinbadImpact: 'Alert', sinbadPoints: 0 },
  { key: 'numbness', icon: 'radio-outline', sinbadImpact: '+1 Neuropathy', sinbadPoints: 1 },
  { key: 'tingling', icon: 'pulse-outline', sinbadImpact: '+1 Tingling', sinbadPoints: 1 },
];

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

export const HomeScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const { language, profile, symptomFlags, toggleSymptomFlag } = useApp();
  const t = getDictionary(language);
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [lastAppointment, setLastAppointment] = useState<SavedAppointment | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [alertsRead, setAlertsRead] = useState(false);
  const healthPulseAnim = useRef(new Animated.Value(1)).current;

  const [doctorReview, setDoctorReview] = useState<{
    hasReview: boolean;
    status?: string;
    reportNumber?: string;
    patientIdentifier?: string;
    physicianName?: string;
    doctorNotes?: string;
    reviewStatus?: string;
    prescriptions?: string[];
    precautions?: string[];
    followUpDate?: string;
    callBackDays?: number;
    verifiedAt?: string;
  } | null>(null);

  const rootNavigation = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

  const load = useCallback(async () => {
    const userIdentifier = profile?.email || null;
    const local = await OfflineStorage.getAllAssessments(userIdentifier);
    let doctorRev = null;
    try {
      const [remoteReports, rev] = await Promise.all([
        ScreeningService.listReports(),
        ScreeningService.getLatestDoctorReview(),
      ]);
      doctorRev = rev;
      if (Array.isArray(remoteReports)) {
        if (remoteReports.length > 0) {
          const mapped: PatientRecord[] = remoteReports.map((r: any) => ({
            id: r.assessmentId,
            reportNumber: r.reportNumber,
            patientIdentifier: r.patientIdentifier || userIdentifier || '',
            timestamp: r.generatedAt,
            imageUri: r.imageUri || '',
            clinicalData: r.clinicalData || {},
            screeningResult: r,
            triageStatus: r.triageCategory,
            location: { latitude: r.latitude, longitude: r.longitude },
            syncStatus: 'synced',
          }));
          setRecords(mapped);
          for (const rec of mapped) {
            await OfflineStorage.saveAssessment(rec, userIdentifier);
          }
        } else {
          setRecords([]);
        }
      } else {
        setRecords(local);
      }
    } catch {
      // Backend unreachable / offline fallback
      setRecords(local);
    }
    setDoctorReview(doctorRev);
    const appt = await AppStorage.getLastAppointment();
    setLastAppointment(appt);
  }, [profile?.email]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => { load(); });
    return unsub;
  }, [navigation, load]);

  useEffect(() => {
    AppStorage.getTutorialComplete().then((done) => setShowTutorial(!done));
  }, []);

  // Pulse animation for health ring
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(healthPulseAnim, { toValue: 1.04, duration: 1400, useNativeDriver: true }),
        Animated.timing(healthPulseAnim, { toValue: 1.0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const selectedCount = Object.values(symptomFlags).filter(Boolean).length;

  const latest = records[0];

  const category = latest?.triageStatus || 'LOW_CONCERN';
  const sinbadScore = latest ? (latest?.screeningResult?.sinbadBreakdown?.totalScore ?? 0) : null;
  const riskLabel = latest
    ? (category === 'LOW_CONCERN' ? t.lowRisk : category === 'ATTENTION_RECOMMENDED' ? t.moderateRisk : t.highRisk)
    : 'Awaiting Initial Scan';
  const riskColor = !latest
    ? '#64748B'
    : category === 'LOW_CONCERN' ? '#0D9488' : category === 'ATTENTION_RECOMMENDED' ? '#D97706' : '#DC2626';
  const riskBg = !latest
    ? '#F8FAFC'
    : category === 'LOW_CONCERN' ? '#F0FDFA' : category === 'ATTENTION_RECOMMENDED' ? '#FFFBEB' : '#FEF2F2';
  const riskBorder = !latest
    ? '#E2E8F0'
    : category === 'LOW_CONCERN' ? '#CCFBF1' : category === 'ATTENTION_RECOMMENDED' ? '#FDE68A' : '#FECACA';
  const riskMessage = !latest
    ? 'Capture your first calibrated foot scan to compute SINBAD triage assessment.'
    : category === 'LOW_CONCERN' ? t.keepRoutine : category === 'ATTENTION_RECOMMENDED' ? t.moderateRiskDesc : t.urgentRiskDesc;

  const diag = latest?.screeningResult?.aiDiagnostics;
  const isWoundDetected = Boolean(diag?.woundDetected);
  const calculatedArea = diag?.calculatedAreaCm2 ?? 0;
  const infectionRisk = diag?.infectionRiskPercent ?? 0;
  const tissueBreakdown = latest
    ? { granulation: diag?.tissueBreakdown?.granulation ?? 80, slough: diag?.tissueBreakdown?.slough ?? 20, necrotic: diag?.tissueBreakdown?.necrotic ?? 0 }
    : { granulation: 0, slough: 0, necrotic: 0 };

  // ── Foot Health DNA Score: Inverse of pathology ──────────────────────
  const dnaScore = latest
    ? Math.max(0, 100 - Math.round(((sinbadScore ?? 0) / 6) * 60 + (infectionRisk / 100) * 40))
    : null;
  const dnaRing = dnaScore !== null ? dnaScore / 100 : 0;
  const dnaColor = dnaScore === null ? '#64748B' : dnaScore >= 75 ? '#10B981' : dnaScore >= 45 ? '#F59E0B' : '#EF4444';
  const dnaLabel = dnaScore === null ? 'Awaiting Scan' : dnaScore >= 75 ? 'Excellent' : dnaScore >= 45 ? 'At Risk' : 'Critical';

  const scanTimeFormatted = latest
    ? new Date(latest.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 6, 16),
            paddingBottom: 36 + insets.bottom,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        {/* Top Bar Header */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.brand}>Heal6</Text>
            <Text style={styles.greeting}>{t.hi}, {profile?.name || 'there'} 👋</Text>
            <Text style={styles.subtitle}>{t.keepFeet}</Text>
          </View>
          <View style={styles.topIcons}>
            <TouchableOpacity style={styles.iconCircle} onPress={() => setShowNotifications(true)}>
              <Ionicons name="notifications-outline" size={23} color={Colors.primaryTeal} />
              {!alertsRead && <View style={styles.redDot} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate(ROUTES.PROFILE)} style={[styles.iconCircle, { marginLeft: 8 }]}>
              <Ionicons name="person-outline" size={23} color={Colors.primaryTeal} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ════════════════════════════════════════════════════════════════
            PILLAR 1 — FOOT HEALTH DNA ENGINE
            Dark glassmorphic immersive card: physical tissue integrity
            Radial health score ring + tissue composition bars
        ════════════════════════════════════════════════════════════════ */}
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => navigation.navigate(ROUTES.HISTORY)}
        >
          <LinearGradient
            colors={['#0F172A', '#1E293B', '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.dnaCard}
          >
            {/* Header */}
            <View style={styles.dnaCardHeader}>
              <View style={styles.dnaHeaderLeft}>
                <View style={styles.dnaIconBadge}>
                  <Ionicons name="pulse" size={14} color="#38BDF8" />
                </View>
                <View>
                  <Text style={styles.dnaCategory}>FOOT HEALTH DNA</Text>
                  <Text style={styles.dnaScanDate}>
                    {latest ? `Last scan ${scanTimeFormatted}` : 'Awaiting first scan'}
                  </Text>
                </View>
              </View>
              <View style={[styles.dnaStatusPill, { borderColor: dnaColor + '55', backgroundColor: dnaColor + '18' }]}>
                <View style={[styles.dnaStatusDot, { backgroundColor: dnaColor }]} />
                <Text style={[styles.dnaStatusText, { color: dnaColor }]}>{dnaLabel}</Text>
              </View>
            </View>

            {/* Central Score Ring + Metrics */}
            <View style={styles.dnaMainRow}>
              {/* Radial Health Score */}
              <Animated.View style={[styles.dnaRingWrap, { transform: [{ scale: healthPulseAnim }] }]}>
                <View style={[styles.dnaRingOuter, { borderColor: dnaColor }]}>
                  <View style={[styles.dnaRingInner, { borderColor: dnaColor + '44' }]}>
                    <Text style={[styles.dnaScoreVal, { color: dnaColor }]}>
                      {dnaScore !== null ? dnaScore : '—'}
                    </Text>
                    <Text style={styles.dnaScoreUnit}>/100</Text>
                  </View>
                </View>
                <Text style={styles.dnaRingLabel}>Health Score</Text>
              </Animated.View>

              {/* Tissue Composition Breakdown */}
              <View style={styles.dnaTissueWrap}>
                <Text style={styles.dnaTissueTitle}>TISSUE COMPOSITION</Text>
                {[
                  { label: 'Granulation', value: tissueBreakdown.granulation, color: '#10B981' },
                  { label: 'Slough', value: tissueBreakdown.slough, color: '#F59E0B' },
                  { label: 'Necrotic', value: tissueBreakdown.necrotic, color: '#EF4444' },
                ].map((row) => (
                  <View key={row.label} style={styles.tissueRow}>
                    <Text style={styles.tissueRowLabel}>{row.label}</Text>
                    <View style={styles.tissueTrack}>
                      <View style={[styles.tissueFill, { width: `${row.value}%` as any, backgroundColor: row.color }]} />
                    </View>
                    <Text style={[styles.tissueRowVal, { color: row.color }]}>{row.value}%</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Bottom Metrics Row */}
            <View style={styles.dnaBottomRow}>
              <View style={styles.dnaMetric}>
                <Text style={styles.dnaMetricLabel}>Wound Area</Text>
                <Text style={[styles.dnaMetricVal, { color: isWoundDetected ? '#F87171' : '#34D399' }]}>
                  {latest ? (isWoundDetected ? `${calculatedArea.toFixed(1)} cm²` : '0.0 cm²') : '—'}
                </Text>
              </View>
              <View style={styles.dnaMetricDivider} />
              <View style={styles.dnaMetric}>
                <Text style={styles.dnaMetricLabel}>Infection Risk</Text>
                <Text style={[styles.dnaMetricVal, { color: infectionRisk > 40 ? '#F87171' : infectionRisk > 20 ? '#FBBF24' : '#34D399' }]}>
                  {latest ? `${infectionRisk}%` : '—'}
                </Text>
              </View>
              <View style={styles.dnaMetricDivider} />
              <View style={styles.dnaMetric}>
                <Text style={styles.dnaMetricLabel}>Dermal Status</Text>
                <Text style={[styles.dnaMetricVal, { color: isWoundDetected ? '#F87171' : '#34D399' }]}>
                  {latest ? (isWoundDetected ? 'Compromised' : 'Intact') : 'Awaiting Scan'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ════════════════════════════════════════════════════════════════
            PILLAR 2 — CLINICAL RISK ENGINE
            Bright clean card: SINBAD score pillar breakdown + triage
            Completely different visual language from DNA card above
        ════════════════════════════════════════════════════════════════ */}
        <View style={[styles.riskEngineCard, { borderColor: riskBorder }]}>
          {/* Category Label */}
          <View style={styles.riskEngineHeader}>
            <View style={[styles.riskEngineTitleBadge, { backgroundColor: riskBg, borderColor: riskBorder }]}>
              <Ionicons
                name={category === 'LOW_CONCERN' ? 'checkmark-circle' : category === 'ATTENTION_RECOMMENDED' ? 'alert-circle' : 'warning'}
                size={13}
                color={riskColor}
              />
              <Text style={[styles.riskEngineTitleText, { color: riskColor }]}>CLINICAL RISK ENGINE</Text>
            </View>
            <Text style={styles.riskEngineProtocol}>SINBAD Protocol v2.1</Text>
          </View>

          {/* Big Score + Urgency */}
          <View style={styles.riskScoreRow}>
            <View>
              <Text style={[styles.riskBigScore, { color: riskColor }]}>{sinbadScore !== null ? sinbadScore : '—'}</Text>
              <Text style={styles.riskBigScoreSub}>{sinbadScore !== null ? 'out of 6 points' : 'No scan recorded'}</Text>
            </View>
            <View style={{ flex: 1, paddingLeft: 16 }}>
              <Text style={[styles.riskUrgencyLabel, { color: riskColor }]}>
                {riskLabel}
              </Text>
              <Text style={styles.riskUrgencyDesc}>
                {!latest ? 'No active screening on file. Capture a calibrated foot scan to determine objective SINBAD risk staging.' :
                 sinbadScore === 0 ? 'Routine surveillance. Continue daily foot care protocol.' :
                 (sinbadScore ?? 0) <= 2 ? 'Elevated markers detected. Physician monitoring advised.' :
                 'Urgent clinical review required. Escalate immediately.'}
              </Text>
            </View>
          </View>

          {/* SINBAD Pillar Breakdown — Fire-bar style */}
          <View style={styles.sinbadPillarBlock}>
            {['S','I','N','B','A','D'].map((letter, idx) => {
              const labels = ['Site', 'Ischaemia', 'Neuropathy', 'Bacterial Inf.', 'Area', 'Depth'];
              const filled = sinbadScore !== null && idx < sinbadScore;
              const pillarColor = !filled ? '#CBD5E1' :
                idx < 2 ? '#10B981' :
                idx < 4 ? '#F59E0B' : '#EF4444';
              return (
                <View key={letter} style={styles.sinbadPillar}>
                  <View style={[styles.sinbadPillarBar, { backgroundColor: filled ? pillarColor : '#F1F5F9', shadowColor: pillarColor, shadowOpacity: filled ? 0.35 : 0, shadowRadius: 4 }]}>
                    <Text style={[styles.sinbadPillarLetter, { color: filled ? Colors.white : '#94A3B8' }]}>{letter}</Text>
                  </View>
                  <Text style={[styles.sinbadPillarSubLabel, { color: filled ? pillarColor : '#94A3B8' }]} numberOfLines={2}>
                    {labels[idx]}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Progress Track */}
          <View style={styles.riskProgressTrack}>
            <View style={[styles.riskProgressFill, { width: `${sinbadScore !== null ? ((sinbadScore / 6) * 100) : 0}%` as any, backgroundColor: riskColor }]} />
          </View>
          <View style={styles.riskProgressLabels}>
            <Text style={styles.riskProgressLabelText}>Low Risk</Text>
            <Text style={styles.riskProgressLabelText}>High Risk</Text>
          </View>
        </View>

        {/* Doctor Clinical Assessment & Prescriptions (ONLY when verified review exists) */}
        {doctorReview?.hasReview && (
          <LinearGradient
            colors={['#FFFFFF', '#F0FDFA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.doctorReviewCard}
          >
            <View style={styles.doctorCardHeader}>
              <View style={styles.doctorBadge}>
                <Ionicons name="shield-checkmark" size={15} color={Colors.primaryTeal} />
                <Text style={styles.doctorBadgeText}>{doctorReview.physicianName || 'Attending Physician'}</Text>
              </View>
              <View style={styles.doctorStatusPill}>
                <Text style={styles.doctorStatusText}>{doctorReview.reviewStatus || 'Verified'}</Text>
              </View>
            </View>

            <Text style={styles.doctorCardTitle}>
              {t.doctorAssessment || 'Attending Physician Assessment & Directives'}
            </Text>
            {!!doctorReview.doctorNotes && (
              <Text style={styles.doctorCardNotes}>{doctorReview.doctorNotes}</Text>
            )}

            {/* Prescriptions */}
            {doctorReview.prescriptions && doctorReview.prescriptions.length > 0 && (
              <View style={styles.doctorSection}>
                <Text style={styles.doctorSectionLabel}>
                  <Ionicons name="medkit-outline" size={13} color={Colors.primaryTeal} /> {t.prescribedMedications || 'Prescribed Regimen & Dressings'}
                </Text>
                <View style={styles.medsChipsRow}>
                  {doctorReview.prescriptions.map((med, idx) => (
                    <View key={idx} style={styles.medChip}>
                      <Ionicons name="bandage-outline" size={12} color={Colors.primaryTeal} />
                      <Text style={styles.medChipText}>{med}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Precautions */}
            {doctorReview.precautions && doctorReview.precautions.length > 0 && (
              <View style={styles.doctorSection}>
                <Text style={styles.doctorSectionLabel}>
                  <Ionicons name="checkmark-done-circle-outline" size={13} color={Colors.primaryTeal} /> {t.carePrecautions || 'Clinical Precautions & Care Plan'}
                </Text>
                {doctorReview.precautions.map((prec, idx) => (
                  <View key={idx} style={styles.precRow}>
                    <Ionicons name="checkmark-circle" size={13} color={Colors.primaryTeal} style={{ marginTop: 2 }} />
                    <Text style={styles.precText}>{prec}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Follow-Up Scheduled Date */}
            {!!doctorReview.followUpDate && (
              <View style={styles.doctorFollowUpBox}>
                <Ionicons name="calendar-outline" size={15} color={Colors.primaryTeal} />
                <Text style={styles.doctorFollowUpText}>
                  {t.nextConsultation || 'Next Follow-up Consultation'}: <Text style={{ fontWeight: '800' }}>{doctorReview.followUpDate}</Text>
                </Text>
              </View>
            )}
          </LinearGradient>
        )}

        {/* Clinical Triage & Specialist Queue Status (When awaiting physician review) */}
        {!doctorReview?.hasReview && latest && (
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.triageQueueCard}
          >
            <View style={styles.triageQueueHeader}>
              <View style={styles.triageQueuePulseWrap}>
                <View style={styles.triageQueuePulseDot} />
                <Text style={styles.triageQueueBadgeText}>IN CLINICAL TRIAGE QUEUE</Text>
              </View>
              <Text style={styles.triageQueueReportId}>
                #{latest.reportNumber || (latest.id ? String(latest.id).slice(0, 8).toUpperCase() : 'SCAN')}
              </Text>
            </View>

            <Text style={styles.triageQueueTitle}>Awaiting Specialist Sign-off</Text>
            <Text style={styles.triageQueueDesc}>
              Your foot scan & SINBAD telemetry have been forwarded to the hospital clinical queue. An attending physician will review your biomarkers and issue verified directives.
            </Text>

            {/* 3-Step Milestone Tracker */}
            <View style={styles.queueTimelineRow}>
              <View style={styles.queueStep}>
                <View style={[styles.queueStepCircle, styles.queueStepComplete]}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
                <Text style={styles.queueStepLabel}>AI Triage</Text>
              </View>
              <View style={[styles.queueStepLine, styles.queueStepLineActive]} />
              <View style={styles.queueStep}>
                <View style={[styles.queueStepCircle, styles.queueStepActive]}>
                  <Ionicons name="hourglass-outline" size={12} color="#0D9488" />
                </View>
                <Text style={[styles.queueStepLabel, { color: '#0D9488', fontWeight: '800' }]}>Doctor Review</Text>
              </View>
              <View style={styles.queueStepLine} />
              <View style={styles.queueStep}>
                <View style={[styles.queueStepCircle, styles.queueStepPending]}>
                  <Ionicons name="document-text-outline" size={12} color="#94A3B8" />
                </View>
                <Text style={styles.queueStepLabel}>Prescription</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.queueConsultBtn}
              onPress={() => rootNavigation?.navigate(ROUTES.APPOINTMENT as any)}
              activeOpacity={0.85}
            >
              <Ionicons name="calendar-outline" size={15} color={Colors.primaryTeal} />
              <Text style={styles.queueConsultBtnText}>Request Priority Consultation</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.primaryTeal} />
            </TouchableOpacity>
          </LinearGradient>
        )}

        {/* Main Screening Banner */}
        <TouchableOpacity
          style={styles.scanBanner}
          onPress={() => navigation.navigate(ROUTES.SCAN, { screen: ROUTES.SCANNER_INSTRUCTIONS })}
          activeOpacity={0.9}
        >
          <View style={styles.scanIcon}>
            <Ionicons name="camera" size={30} color={Colors.primaryTeal} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.scanTitle}>{t.checkFeet}</Text>
            <Text style={styles.scanSub}>{t.scanSubtitle}</Text>
          </View>
          <View style={styles.startButton}>
            <Ionicons name="camera" size={18} color={Colors.primaryTeal} />
            <Text style={styles.startText}>{t.startFootScan}</Text>
          </View>
        </TouchableOpacity>

        {/* Horizontal Quick Actions Carousel (Zero Vertical Waste, Clears Triage Tool Above Fold) */}
        <View style={styles.quickSectionHeader}>
          <Text style={styles.sectionTitle}>{t.quickActions}</Text>
          <Text style={styles.quickSwipeHint}>{t.swipeForShortcuts || 'Swipe for shortcuts →'}</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickScrollContainer}
          style={styles.quickScrollView}
        >
          {[
            { id: '1', icon: 'calendar-outline', title: t.bookAppointment, desc: t.consultSpecialist || 'Consult specialist', target: 'doctor', bg: '#F0F9FF', iconColor: Colors.primaryTeal },
            { id: '2', icon: 'document-text-outline', title: t.myReports, desc: t.pastScreenings || 'Past screenings', target: 'reports', bg: '#F8FAFC', iconColor: Colors.primaryTeal },
            { id: '3', icon: 'book-outline', title: t.footCareTips, desc: t.dailyPrevention || 'Daily prevention', target: 'guide', bg: '#FFF8E8', iconColor: '#9B5D0A' },
            { id: '4', icon: 'shield-checkmark-outline', title: t.healthResources, desc: t.clinicalGuidelines || 'Clinical guidelines', target: 'guide', bg: '#EFFAF7', iconColor: '#0D9488' },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.quickCardHorizontal, { backgroundColor: item.bg }]}
              onPress={() =>
                item.target === 'reports'
                  ? navigation.navigate(ROUTES.HISTORY)
                  : item.target === 'guide'
                  ? navigation.navigate(ROUTES.GUIDE)
                  : item.target === 'doctor'
                  ? rootNavigation?.navigate(ROUTES.APPOINTMENT)
                  : null
              }
              activeOpacity={0.8}
            >
              <View style={styles.quickIconCircle}>
                <Ionicons name={item.icon as any} size={19} color={item.iconColor} />
              </View>
              <View style={styles.quickCardBody}>
                <Text style={styles.quickCardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.quickCardDesc} numberOfLines={1}>
                  {item.desc}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Interactive Symptoms Ingress Section */}
        <View style={styles.sectionHeadRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>{t.symptoms}</Text>
            <Text style={styles.symptomsQuestion}>{t.selectSymptomsSubtitle || t.symptomsQuestion}</Text>
          </View>
          <View style={styles.infoBubble}>
            <Ionicons name="information-circle-outline" size={22} color={Colors.primaryTeal} />
          </View>
        </View>

        {selectedCount > 0 && (
          <View style={styles.activeSymptomBanner}>
            <Ionicons name="pulse" size={16} color={Colors.primaryTeal} />
            <View style={{ flex: 1 }}>
              <Text style={styles.activeSymptomText}>
                {selectedCount} {t.symptoms} {t.activeSymptomsSuffix || 'active • Injects pts into background SINBAD triage'} (+{
                  (symptomFlags.ulcer ? 1 : 0) +
                  (symptomFlags.redness || symptomFlags.warmth || symptomFlags.swelling ? 1 : 0) +
                  (symptomFlags.numbness || symptomFlags.tingling ? 1 : 0)
                } pts)
              </Text>
            </View>
          </View>
        )}

        <View style={styles.symptomsBox}>
          {symptomItems.map((item, i) => {
            const isSelected = !!symptomFlags[item.key];
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.symptomRow,
                  isSelected && styles.symptomRowSelected,
                  i === symptomItems.length - 1 && { borderBottomWidth: 0 }
                ]}
                onPress={() => toggleSymptomFlag(item.key)}
                activeOpacity={0.7}
              >
                {/* Active Checkbox / Toggle (Not a passive chevron) */}
                <View style={[styles.activeCheckbox, isSelected && styles.activeCheckboxSelected]}>
                  {isSelected ? (
                    <Ionicons name="checkmark" size={14} color={Colors.white} />
                  ) : (
                    <View style={styles.checkboxInnerEmpty} />
                  )}
                </View>

                <View style={[styles.symptomIcon, isSelected && styles.symptomIconSelected]}>
                  <Ionicons
                    name={item.icon}
                    size={19}
                    color={isSelected ? Colors.primaryTeal : Colors.textSecondary}
                  />
                </View>

                <View style={styles.symptomContent}>
                  <View style={styles.symptomTitleRow}>
                    <Text
                      style={[styles.symptomTitle, isSelected && styles.symptomTitleSelected]}
                      numberOfLines={2}
                    >
                      {t[item.key]}
                    </Text>
                    <View style={[styles.symptomSinbadTag, isSelected && styles.symptomSinbadTagSelected]}>
                      <Text style={[styles.symptomSinbadTagText, isSelected && styles.symptomSinbadTagTextSelected]}>
                        {item.sinbadImpact}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.symptomDesc}>
                    {SYMPTOM_DESC[item.key] || ''}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedCount > 0 && (
          <TouchableOpacity
            style={styles.triageActionBtn}
            onPress={() => navigation.navigate(ROUTES.SCAN, { screen: ROUTES.SCANNER_INSTRUCTIONS })}
            activeOpacity={0.85}
          >
            <Ionicons name="camera" size={20} color={Colors.white} />
            <Text style={styles.triageActionBtnText}>
              Start AI Triage with {selectedCount} Symptom{selectedCount > 1 ? 's' : ''}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </TouchableOpacity>
        )}
      </ScrollView>

      <TutorialOverlay visible={showTutorial} onClose={() => setShowTutorial(false)} />

      {/* Dynamic Notification Sheet Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="notifications" size={22} color={Colors.primaryTeal} />
                <Text style={styles.modalTitle}>{t.notificationsAlerts || 'Notifications & Alerts'}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowNotifications(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {alertsRead ? (
              <View style={{ alignItems: 'center', paddingVertical: 28 }}>
                <Ionicons name="checkmark-circle-outline" size={48} color={Colors.success} />
                <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginTop: 12 }}>
                  {t.allCaughtUp || 'You are all caught up! No unread alerts.'}
                </Text>
                <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
                  All screening notices and care reminders have been reviewed.
                </Text>
                <TouchableOpacity
                  style={[styles.dismissBtn, { width: '100%', marginTop: 20 }]}
                  onPress={() => setAlertsRead(false)}
                >
                  <Text style={styles.dismissBtnText}>View Past Alerts</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <ScrollView contentContainerStyle={styles.notificationsList}>
                  {/* Dynamic Alert 1: Screening Status */}
                  <TouchableOpacity
                    style={styles.notificationCard}
                    activeOpacity={0.75}
                    onPress={() => {
                      setShowNotifications(false);
                      if (latest) {
                        navigation.navigate(ROUTES.HISTORY);
                      } else {
                        navigation.navigate(ROUTES.SCAN, { screen: ROUTES.SCANNER_INSTRUCTIONS });
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.notifIcon,
                        {
                          backgroundColor:
                            category === 'LOW_CONCERN'
                              ? '#E7F7EE'
                              : category === 'ATTENTION_RECOMMENDED'
                              ? '#FFF5DE'
                              : '#FDEAEA',
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          category === 'LOW_CONCERN'
                            ? 'shield-checkmark-outline'
                            : category === 'ATTENTION_RECOMMENDED'
                            ? 'alert-circle-outline'
                            : 'warning-outline'
                        }
                        size={20}
                        color={riskColor}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifTitle}>
                        {latest
                          ? `${riskLabel} · SINBAD ${sinbadScore}/6`
                          : (t.checkFeet || 'Weekly Foot Screening Due')}
                      </Text>
                      <Text style={styles.notifBody}>
                        {latest
                          ? `${riskMessage} Assessment ID: ${latest.reportNumber || latest.id.slice(0, 8)}. Tap to view report.`
                          : (t.scanSubtitle || 'Take a quick calibrated photo to screen for early micro-vascular changes.')}
                      </Text>
                      <Text style={styles.notifTime}>
                        {latest ? new Date(latest.timestamp).toLocaleDateString() : 'Today · Routine screening'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Dynamic Alert 2: Clinical Guidance Alert */}
                  <TouchableOpacity
                    style={styles.notificationCard}
                    activeOpacity={0.75}
                    onPress={() => {
                      setShowNotifications(false);
                      navigation.navigate(ROUTES.GUIDE);
                    }}
                  >
                    <View style={[styles.notifIcon, { backgroundColor: '#FFF8E8' }]}>
                      <Ionicons name="bulb-outline" size={20} color="#D97706" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifTitle}>{t.footCareReminder || 'Daily Foot Care Habit'}</Text>
                      <Text style={styles.notifBody}>
                        Always inspect between toes with a mirror. Apply moisturizing cream to dry soles, avoiding between toes.
                      </Text>
                      <Text style={styles.notifTime}>Daily protocol · Tap to read guide</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Dynamic Alert 3: Appointment Booking Option */}
                  <TouchableOpacity
                    style={styles.notificationCard}
                    activeOpacity={0.75}
                    onPress={() => {
                      setShowNotifications(false);
                      rootNavigation?.navigate(ROUTES.APPOINTMENT);
                    }}
                  >
                    <View style={[styles.notifIcon, { backgroundColor: lastAppointment ? '#E7F7EE' : '#E0F2FE' }]}>
                      <Ionicons
                        name={lastAppointment ? 'checkmark-circle-outline' : 'calendar-outline'}
                        size={20}
                        color={lastAppointment ? Colors.success : Colors.primaryTeal}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifTitle}>
                        {lastAppointment
                          ? `Scheduled: ${lastAppointment.reason}`
                          : (t.bookAppointment || 'Book Clinic Review')}
                      </Text>
                      <Text style={styles.notifBody}>
                        {lastAppointment
                          ? `Visit date: ${lastAppointment.date}. Notes: "${lastAppointment.notes || 'Screening follow-up'}". Tap to review or reschedule.`
                          : 'Need clinical follow-up? Directly schedule an in-person or triage consultation with your physician.'}
                      </Text>
                      <Text style={styles.notifTime}>
                        {lastAppointment
                          ? `Active Request · ${new Date(lastAppointment.timestamp).toLocaleDateString()}`
                          : 'Clinic hand-off queue'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Dynamic Alert 4: Offline Synchronization */}
                  <View style={styles.notificationCard}>
                    <View style={[styles.notifIcon, { backgroundColor: '#F1F5F9' }]}>
                      <Ionicons name="cloud-done-outline" size={20} color={Colors.textSecondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifTitle}>{t.syncAlert || 'Offline Sync Complete'}</Text>
                      <Text style={styles.notifBody}>
                        All local triage logs and SINBAD assessments are securely encrypted and synchronized.
                      </Text>
                      <Text style={styles.notifTime}>Continuous background sync</Text>
                    </View>
                  </View>
                </ScrollView>

                <TouchableOpacity
                  style={styles.dismissBtn}
                  onPress={() => setAlertsRead(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.dismissBtnText}>{t.markAllRead || 'Mark All as Read'}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 32 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  brand: { color: Colors.primaryTeal, fontWeight: '900', fontSize: 17 },
  greeting: { color: Colors.textPrimary, fontWeight: '800', fontSize: 26, marginTop: 6 },
  subtitle: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  topIcons: { flexDirection: 'row' },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  redDot: {
    position: 'absolute',
    right: 10,
    top: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accentCoral,
  },
  // ── Foot Health DNA Card ───────────────────────────────────────
  dnaCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
    overflow: 'hidden',
  },
  dnaCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  dnaHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dnaIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  dnaCategory: { fontSize: 9.5, fontWeight: '800', color: '#94A3B8', letterSpacing: 1.5 },
  dnaScanDate: { fontSize: 11, fontWeight: '600', color: '#475569', marginTop: 1 },
  dnaStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  dnaStatusDot: { width: 6, height: 6, borderRadius: 3 },
  dnaStatusText: { fontSize: 11, fontWeight: '800' },
  dnaMainRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  dnaRingWrap: { alignItems: 'center', gap: 6 },
  dnaRingOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  dnaRingInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  dnaScoreVal: { fontSize: 28, fontWeight: '900', lineHeight: 30 },
  dnaScoreUnit: { fontSize: 10, color: '#64748B', fontWeight: '700' },
  dnaRingLabel: { fontSize: 9.5, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.3 },
  dnaTissueWrap: { flex: 1, gap: 7 },
  dnaTissueTitle: { fontSize: 8.5, fontWeight: '800', color: '#64748B', letterSpacing: 1, marginBottom: 2 },
  tissueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tissueRowLabel: { width: 76, fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  tissueTrack: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  tissueFill: { height: 6, borderRadius: 3 },
  tissueRowVal: { width: 32, fontSize: 10, fontWeight: '900', textAlign: 'right' },
  dnaBottomRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dnaMetric: { flex: 1, alignItems: 'center' },
  dnaMetricDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dnaMetricLabel: { fontSize: 9, fontWeight: '800', color: '#475569', letterSpacing: 0.5, marginBottom: 4 },
  dnaMetricVal: { fontSize: 13, fontWeight: '900' },
  // ── Clinical Risk Engine Card ─────────────────────────────────
  riskEngineCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  riskEngineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  riskEngineTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  riskEngineTitleText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  riskEngineProtocol: { fontSize: 9.5, fontWeight: '700', color: '#94A3B8' },
  riskScoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  riskBigScore: { fontSize: 52, fontWeight: '900', lineHeight: 52 },
  riskBigScoreSub: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  riskUrgencyLabel: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
  riskUrgencyDesc: { fontSize: 11, color: '#64748B', lineHeight: 16, fontWeight: '500' },
  sinbadPillarBlock: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  sinbadPillar: { flex: 1, alignItems: 'center', gap: 4 },
  sinbadPillarBar: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
  },
  sinbadPillarLetter: { fontSize: 14, fontWeight: '900' },
  sinbadPillarSubLabel: { fontSize: 8, fontWeight: '700', textAlign: 'center', letterSpacing: -0.2 },
  riskProgressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 5,
  },
  riskProgressFill: { height: 6, borderRadius: 3 },
  riskProgressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  riskProgressLabelText: { fontSize: 9, fontWeight: '700', color: '#94A3B8' },
  // ── (Legacy telemetry styles retained for other components) ────
  telemetryRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
    marginBottom: 14,
  },
  telemetryCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryCategoryLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  telemetryPrimaryVal: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginTop: 1,
  },
  tissueMetricGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 8,
  },
  tissueMetricCell: {
    flex: 1,
    alignItems: 'center',
  },
  tissueMetricDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },
  tissueMetricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  tissueMetricVal: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  telemetryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  telemetryFooterText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    flex: 1,
  },
  sinbadPillarWrap: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 8,
  },
  sinbadBarRow: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sinbadSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  sinbadSegmentMuted: {
    backgroundColor: '#E2E8F0',
  },
  sinbadLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sinbadLetter: {
    fontSize: 8.5,
    fontWeight: '800',
    color: Colors.textMuted,
    width: 14,
    textAlign: 'center',
  },
  triageUrgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderWidth: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  triageUrgencyText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  scanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryTeal,
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
  },
  scanIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTitle: { color: Colors.white, fontSize: 20, fontWeight: '900' },
  scanSub: { color: '#DCEFF6', fontSize: 12, marginTop: 2, lineHeight: 16 },
  startButton: {
    backgroundColor: Colors.white,
    borderRadius: 11,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  startText: { color: Colors.primaryTeal, fontSize: 12, fontWeight: '900' },
  sectionTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '900', marginTop: 14, marginBottom: 8 },
  quickSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 14,
    marginBottom: 8,
  },
  quickSwipeHint: {
    fontSize: 11,
    color: Colors.primaryTeal,
    fontWeight: '700',
  },
  quickScrollView: {
    marginHorizontal: -4,
  },
  quickScrollContainer: {
    paddingHorizontal: 4,
    paddingBottom: 4,
    gap: 10,
  },
  quickCardHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    width: Math.min(200, SCREEN_W * 0.52),
    height: 62,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    gap: 10,
  },
  quickIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickCardBody: {
    flex: 1,
  },
  quickCardTitle: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 12,
  },
  quickCardDesc: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
  activeCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCheckboxSelected: {
    backgroundColor: Colors.primaryTeal,
    borderColor: Colors.primaryTeal,
  },
  checkboxInnerEmpty: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  symptomContent: {
    flex: 1,
    paddingRight: 2,
  },
  symptomTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  symptomTitle: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 13,
    flexShrink: 1,
    marginRight: 6,
  },
  symptomTitleSelected: {
    color: Colors.primaryTeal,
  },
  symptomSinbadTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    flexShrink: 0,
    alignSelf: 'center',
  },
  symptomSinbadTagSelected: {
    backgroundColor: '#CCFBF1',
  },
  symptomSinbadTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.2,
  },
  symptomSinbadTagTextSelected: {
    color: Colors.primaryDark,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  symptomsQuestion: { color: Colors.textSecondary, fontSize: 12 },
  infoBubble: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EAF6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSymptomBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  activeSymptomText: {
    color: Colors.primaryTeal,
    fontSize: 12,
    fontWeight: '700',
  },
  symptomsBox: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 10,
    overflow: 'hidden',
  },
  symptomRow: {
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  symptomRowSelected: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
  },
  symptomIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EAF6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  symptomIconSelected: {
    backgroundColor: '#E0F2FE',
  },
  symptomDesc: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  triageActionBtn: {
    marginTop: 12,
    backgroundColor: Colors.primaryTeal,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.primaryTeal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  triageActionBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  notificationsList: { paddingBottom: 16 },
  notificationCard: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  notifIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  notifTitle: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  notifBody: { fontSize: 11, color: Colors.textSecondary, lineHeight: 16, marginTop: 3 },
  notifTime: { fontSize: 10, color: Colors.textMuted, marginTop: 6, fontWeight: '600' },
  dismissBtn: { height: 48, borderRadius: 12, backgroundColor: Colors.primaryTeal, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  dismissBtnText: { color: Colors.white, fontWeight: '800', fontSize: 14 },
  doctorReviewCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  doctorCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  doctorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  doctorBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
  doctorStatusPill: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  doctorStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  doctorCardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  doctorCardNotes: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  doctorSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  doctorSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  medsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  medChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  medChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  precRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  precText: {
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  doctorFollowUpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  doctorFollowUpText: {
    fontSize: 11.5,
    color: Colors.textPrimary,
  },

  /* Clinical Triage Queue Card Styles */
  triageQueueCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  triageQueueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  triageQueuePulseWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  triageQueuePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284C7',
  },
  triageQueueBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0369A1',
    letterSpacing: 0.4,
  },
  triageQueueReportId: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  triageQueueTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  triageQueueDesc: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 12,
  },
  queueTimelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
  },
  queueStep: {
    alignItems: 'center',
    gap: 4,
  },
  queueStepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueStepComplete: {
    backgroundColor: '#10B981',
  },
  queueStepActive: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1.5,
    borderColor: '#0284C7',
  },
  queueStepPending: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  queueStepLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  queueStepLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 6,
    marginBottom: 14,
  },
  queueStepLineActive: {
    backgroundColor: '#BAE6FD',
  },
  queueConsultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  queueConsultBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: Colors.primaryTeal,
    flex: 1,
    marginLeft: 6,
  },
});
