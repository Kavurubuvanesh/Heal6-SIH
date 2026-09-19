import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface Props {
  compact?: boolean;
  onLongPress?: () => void;
  onPress?: () => void;
}

export const Heal6Logo = ({ compact = false, onLongPress, onPress }: Props) => {
  const content = (
    <View style={styles.row}>
      <View style={styles.footCircle}>
        <Ionicons name="footsteps" size={compact ? 24 : 30} color={Colors.white} />
      </View>
      <View>
        <Text style={[styles.logo, compact && styles.logoCompact]}>Heal6</Text>
        {!compact && <Text style={styles.tagline}>Healthy Feet, Brighter Tomorrow</Text>}
      </View>
    </View>
  );

  if (onLongPress || onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={700}
        activeOpacity={0.9}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  footCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryTeal,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },
  logo: { fontSize: 27, fontWeight: '800', color: Colors.primaryTeal, letterSpacing: -1 },
  logoCompact: { fontSize: 21 },
  tagline: { fontSize: 10, color: Colors.textSecondary, marginTop: -2 },
});
