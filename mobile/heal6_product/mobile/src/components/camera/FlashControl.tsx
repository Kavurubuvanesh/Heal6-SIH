import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import type { FlashMode } from 'expo-camera';

interface FlashControlProps {
  flash: FlashMode;
  onToggle: () => void;
}

export const FlashControl: React.FC<FlashControlProps> = ({ flash, onToggle }) => {
  return (
    <TouchableOpacity onPress={onToggle} style={styles.iconBtn}>
      <Ionicons name={flash === 'on' ? 'flash' : 'flash-off'} size={24} color={Colors.white} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
