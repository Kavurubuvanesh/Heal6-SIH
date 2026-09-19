import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { AppStorage } from '../../services/appStorage';
import { useApp } from '../../context/AppContext';
import { getDictionary } from '../../constants/i18n';

const ICONS: (keyof typeof Ionicons.glyphMap)[] = ['camera-outline', 'document-text-outline', 'medkit-outline', 'book-outline'];
const KEYS = ['tutorialScan', 'tutorialReports', 'tutorialAppointment', 'tutorialGuide'] as const;

export const TutorialOverlay = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const { language } = useApp();
  const t = getDictionary(language);
  const [step, setStep] = useState(0);

  const finish = async () => {
    await AppStorage.setTutorialComplete(true);
    setStep(0);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconBubble}><Ionicons name={ICONS[step]} size={34} color={Colors.primaryTeal} /></View>
          <Text style={styles.count}>{step + 1} / 4</Text>
          <Text style={styles.title}>{t.tutorialTitle}</Text>
          <Text style={styles.stepTitle}>{[t.scanPrep, t.reportGuide, t.appointmentGuide, t.guideGuide][step]}</Text>
          <View style={styles.arrowRow}><Ionicons name="arrow-forward" size={22} color={Colors.primaryTeal} /></View>
          <Text style={styles.body}>{t[KEYS[step]]}</Text>
          <View style={styles.dots}>{[0,1,2,3].map(i => <View key={i} style={[styles.dot, i === step && styles.dotActive]} />)}</View>
          <View style={styles.actions}>
            {step < 3 ? <TouchableOpacity style={styles.button} onPress={() => setStep(step + 1)}><Text style={styles.buttonText}>{t.next}</Text></TouchableOpacity> : <TouchableOpacity style={styles.button} onPress={finish}><Text style={styles.buttonText}>{t.done}</Text></TouchableOpacity>}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(2,24,35,0.55)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: Colors.white, borderRadius: 24, padding: 26, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 18, elevation: 8 },
  iconBubble: { width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  count: { color: Colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 4 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginTop: 4 },
  stepTitle: { color: Colors.primaryTeal, fontSize: 16, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  arrowRow: { marginTop: 5 },
  body: { color: Colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 2 },
  dots: { flexDirection: 'row', marginVertical: 20, gap: 7 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.disabled },
  dotActive: { width: 22, backgroundColor: Colors.primaryTeal },
  actions: { width: '100%' },
  button: { height: 50, borderRadius: 14, backgroundColor: Colors.primaryTeal, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
});
