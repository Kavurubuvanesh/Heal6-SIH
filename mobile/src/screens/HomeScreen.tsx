import React, { useCallback, useEffect, useState } from 'react';
import {
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

  const [doctorReview, setDoctorReview] = useState<{
    hasReview: boolean;
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
    const all = await OfflineStorage.getAllAssessments();
    setRecords(all);
    const appt = await AppStorage.getLastAppointment();
    setLastAppointment(appt);
    try {
      const rev = await ScreeningService.getLatestDoctorReview();
      if (rev?.hasReview) {
        setDoctorReview(rev);
      }
    } catch {
      // offline or backend unreachable
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => { load(); });
    return unsub;
  }, [navigation, load]);

  useEffect(() => {
    AppStorage.getTutorialComplete().then((done) => setShowTutorial(!done));
  }, []);

  const selectedCount = Object.values(symptomFlags).filter(Boolean).length;

  const latest = records[0];
  const category = latest?.triageStatus || 'LOW_CONCERN';
  const sinbadScore = latest?.screeningResult?.sinbadBreakdown?.totalScore ?? 0;
  const riskLabel = category === 'LOW_CONCERN' ? t.lowRisk : category === 'ATTENTION_RECOMMENDED' ? t.moderateRisk : t.highRisk;
  const riskColor = category === 'LOW_CONCERN' ? Colors.success : category === 'ATTENTION_RECOMMENDED' ? Colors.warning : Colors.danger;
  const riskBg = category === 'LOW_CONCERN' ? '#E7F7EE' : category === 'ATTENTION_RECOMMENDED' ? '#FFF5DE' : '#FDEAEA';
  const riskMessage = category === 'LOW_CONCERN' ? t.keepRoutine : category === 'ATTENTION_RECOMMENDED' ? t.moderateRiskDesc : t.urgentRiskDesc;

  // Needle angle: -60deg (Low/0), 0deg (Moderate/2-3), +60deg (Critical/4-6)
  const needleAngle = category === 'LOW_CONCERN' ? '-60deg' : category === 'ATTENTION_RECOMMENDED' ? '0deg' : '60deg';

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

        {/* Symmetric Height Health Status & Gauge Cards */}
        <View style={styles.healthRow}>
          <View style={styles.healthCard}>
            <View style={styles.cardHeaderArea}>
              <View style={styles.footIcon}>
                <Ionicons name="footsteps" size={38} color={Colors.primaryTeal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardHeading}>{t.yourFootHealth}</Text>
                {/* Fixed Non-Wrapping Risk Badge */}
                <View style={[styles.riskPill, { backgroundColor: riskBg }]}>
                  <Ionicons
                    name={category === 'LOW_CONCERN' ? 'checkmark-circle' : category === 'ATTENTION_RECOMMENDED' ? 'alert-circle' : 'warning'}
                    size={16}
                    color={riskColor}
                  />
                  <Text style={[styles.riskPillText, { color: riskColor }]} numberOfLines={1}>
                    {riskLabel}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.cardSub}>
              {latest ? `${new Date(latest.timestamp).toLocaleDateString()} · SINBAD ${sinbadScore}/6` : t.noConcerning}
            </Text>
          </View>

          <View style={styles.gaugeCard}>
            <Text style={styles.cardHeading}>{t.riskLevelTitle}</Text>
            <View style={styles.gauge}>
              <View style={[styles.gaugeBase, { borderColor: riskColor }]} />
              <View style={[styles.gaugeNeedle, { transform: [{ rotate: needleAngle }], backgroundColor: riskColor }]} />
            </View>
            <Text style={[styles.gaugeLabel, { color: riskColor }]}>{riskLabel}</Text>
            <Text style={styles.gaugeSub} numberOfLines={2}>
              {riskMessage}
            </Text>
          </View>
        </View>

        {/* Doctor Clinical Assessment & Prescriptions Card */}
        {doctorReview?.hasReview && (
          <View style={styles.doctorReviewCard}>
            <View style={styles.doctorCardHeader}>
              <View style={styles.doctorBadge}>
                <Ionicons name="shield-checkmark" size={15} color="#0D9488" />
                <Text style={styles.doctorBadgeText}>{doctorReview.physicianName || 'Dr. Sharma, MD'}</Text>
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
                      <Ionicons name="bandage-outline" size={12} color="#0D9488" />
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
                  <Ionicons name="checkmark-done-circle-outline" size={13} color="#0D9488" /> {t.carePrecautions || 'Clinical Precautions & Care Plan'}
                </Text>
                {doctorReview.precautions.map((prec, idx) => (
                  <View key={idx} style={styles.precRow}>
                    <Ionicons name="checkmark-circle" size={13} color="#0D9488" style={{ marginTop: 2 }} />
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
          </View>
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
  healthRow: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  healthCard: {
    flex: 1.15,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardHeaderArea: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  footIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeading: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  riskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#E7F7EE',
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 6,
    flexShrink: 0,
  },
  riskPillText: {
    color: Colors.success,
    fontWeight: '800',
    fontSize: 12,
  },
  cardSub: {
    color: Colors.textSecondary,
    lineHeight: 16,
    fontSize: 11,
    marginTop: 8,
  },
  gaugeCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gauge: { width: 108, height: 64, overflow: 'hidden', alignItems: 'center', marginTop: 2 },
  gaugeBase: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 13,
    borderColor: '#E2A33B',
    position: 'absolute',
    top: 0,
  },
  gaugeNeedle: {
    position: 'absolute',
    top: 25,
    width: 3,
    height: 38,
    borderRadius: 2,
    backgroundColor: Colors.primaryTeal,
  },
  gaugeLabel: { fontWeight: '900', fontSize: 14, marginTop: -4 },
  gaugeSub: { color: Colors.textSecondary, fontSize: 10, textAlign: 'center', marginTop: 2, lineHeight: 13 },
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
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
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
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  doctorBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  doctorStatusPill: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  doctorStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  doctorCardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#064E3B',
    marginBottom: 4,
  },
  doctorCardNotes: {
    fontSize: 12,
    color: '#1F2937',
    lineHeight: 18,
    marginBottom: 10,
  },
  doctorSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
    paddingTop: 8,
  },
  doctorSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
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
    borderColor: '#A7F3D0',
  },
  medChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  precRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  precText: {
    fontSize: 11,
    color: '#374151',
    flex: 1,
    lineHeight: 16,
  },
  doctorFollowUpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  doctorFollowUpText: {
    fontSize: 12,
    color: '#065F46',
  },
});
