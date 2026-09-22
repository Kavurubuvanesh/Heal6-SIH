import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { TriageCategory } from '../../types/sinbad.types';

export const TriageCard = ({ category, reportNumber, patientId, date, score }: { category: TriageCategory; reportNumber?: string; patientId: string; date: string; score?: number }) => {
  const meta = category === 'LOW_CONCERN' ? { label: 'Low Risk', icon: 'checkmark-circle' as const, palette: Colors.triageLow } : category === 'ATTENTION_RECOMMENDED' ? { label: 'Moderate Risk', icon: 'alert-circle' as const, palette: Colors.triageModerate } : { label: 'High Risk', icon: 'warning' as const, palette: Colors.triageUrgent };
  return <View style={[styles.container, { backgroundColor: meta.palette.background, borderColor: meta.palette.border }]}>
    <Ionicons name={meta.icon} size={28} color={meta.palette.text} />
    <View style={styles.textBlock}>
      <Text style={[styles.status, { color: meta.palette.text }]}>{meta.label}</Text>
      <Text style={styles.meta}>{reportNumber ? `${reportNumber} • ` : ''}{patientId} • {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}{typeof score === 'number' ? ` • SINBAD ${score}/6` : ''}</Text>
    </View>
  </View>;
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 15, borderWidth: 1, marginVertical: 6 },
  textBlock: { marginLeft: 12, flex: 1 },
  status: { fontSize: 15, fontWeight: '800' },
  meta: { fontSize: 11, color: Colors.textSecondary, marginTop: 3 },
});
