import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle, StyleProp, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/colors';

interface Heal6ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Heal6Button: React.FC<Heal6ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
}) => {
  const isOutline = variant === 'outline';
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        isOutline ? styles.outline : styles.primary,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={isOutline ? Colors.primaryTeal : Colors.white} />
        ) : (
          <>
            {icon}
            <Text style={[styles.text, isOutline ? styles.outlineText : styles.primaryText, icon ? { marginLeft: 8 } : undefined]}>
              {title}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  primary: { backgroundColor: Colors.primaryTeal },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primaryTeal },
  disabled: { opacity: 0.5 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 15, fontWeight: '700' },
  primaryText: { color: Colors.white },
  outlineText: { color: Colors.primaryTeal },
});
