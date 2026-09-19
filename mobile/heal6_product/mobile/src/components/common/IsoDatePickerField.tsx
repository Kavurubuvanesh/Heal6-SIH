import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Colors } from '../../constants/colors';
import { useApp } from '../../context/AppContext';
import { getDictionary } from '../../constants/i18n';

interface Props {
  label: string;
  value: string; // strict ISO-8601: YYYY-MM-DD
  onChange: (isoDate: string) => void;
  placeholder?: string;
  style?: any;
  allowFuture?: boolean;
  maximumDate?: Date;
  minimumDate?: Date;
}

export const IsoDatePickerField: React.FC<Props> = ({
  label,
  value,
  onChange,
  placeholder = 'YYYY-MM-DD',
  style,
  allowFuture = false,
  maximumDate,
  minimumDate,
}) => {
  const { language } = useApp();
  const t = getDictionary(language);

  const [showNativePicker, setShowNativePicker] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Parse existing value or fallback to a sensible adult default (e.g., 1985-06-15)
  const parseDate = (str: string): Date => {
    if (!str) return new Date(1985, 5, 15);
    const parts = str.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d);
      }
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date(1985, 5, 15) : d;
  };

  const currentDate = parseDate(value);

  const formatIso = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const effectiveMaxDate = maximumDate !== undefined ? maximumDate : (allowFuture ? undefined : new Date());

  // Robust cross-platform handler supporting both (event, date) signatures without throwing
  const handlePickerChange = (event: any, selectedDate?: Date) => {
    setShowNativePicker(false);
    if (event?.type === 'dismissed') {
      return;
    }

    const picked =
      selectedDate instanceof Date && !isNaN(selectedDate.getTime())
        ? selectedDate
        : event instanceof Date && !isNaN(event.getTime())
        ? event
        : event?.nativeEvent?.timestamp
        ? new Date(event.nativeEvent.timestamp)
        : null;

    if (picked && !isNaN(picked.getTime())) {
      onChange(formatIso(picked));
    }
  };

  const handleDismiss = () => {
    setShowNativePicker(false);
  };

  const handleOpen = () => {
    if (Platform.OS === 'android' && DateTimePickerAndroid) {
      try {
        DateTimePickerAndroid.open({
          value: currentDate,
          onChange: handlePickerChange,
          mode: 'date',
          maximumDate: effectiveMaxDate,
          minimumDate: minimumDate,
        });
        return;
      } catch (err) {
        console.warn('Native picker open error, falling back to declarative/modal:', err);
      }
    }

    if (Platform.OS === 'web') {
      setShowCustomModal(true);
    } else {
      setShowNativePicker(true);
    }
  };

  // Calculate age if valid
  let calculatedAge: number | null = null;
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    const today = new Date();
    let age = today.getFullYear() - y;
    const mDiff = today.getMonth() - (m - 1);
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < d)) {
      age--;
    }
    if (age >= 0 && age <= 120) {
      calculatedAge = age;
    }
  }

  // Quick state for custom modal
  const [modalYear, setModalYear] = useState(currentDate.getFullYear());
  const [modalMonth, setModalMonth] = useState(currentDate.getMonth() + 1);
  const [modalDay, setModalDay] = useState(currentDate.getDate());

  useEffect(() => {
    const d = parseDate(value);
    setModalYear(d.getFullYear());
    setModalMonth(d.getMonth() + 1);
    setModalDay(d.getDate());
  }, [value]);

  const maxYearAllowed = allowFuture ? new Date().getFullYear() + 5 : new Date().getFullYear();

  const commitCustomModal = () => {
    const mStr = String(modalMonth).padStart(2, '0');
    const dStr = String(modalDay).padStart(2, '0');
    onChange(`${modalYear}-${mStr}-${dStr}`);
    setShowCustomModal(false);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.fhirBadge}>{t.fhirBadgeLabel || 'FHIR ISO-8601'}</Text>
      </View>

      <TouchableOpacity
        style={[styles.inputBox, !value && styles.inputBoxEmpty]}
        onPress={handleOpen}
        activeOpacity={0.8}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="calendar-outline" size={18} color={Colors.primaryTeal} />
        </View>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.valueText, !value && styles.placeholderText]}>
            {value || placeholder}
          </Text>
          {calculatedAge !== null && (
            <Text style={styles.ageHelper}>
              {calculatedAge} {t.yearsOldLabel || 'years old'}
            </Text>
          )}
        </View>

        <View style={styles.actionCluster}>
          <View style={styles.selectAction}>
            <Text style={styles.selectActionText}>{t.selectAction || 'Select'}</Text>
            <Ionicons name="chevron-forward" size={13} color={Colors.primaryTeal} />
          </View>
          <TouchableOpacity
            style={styles.modalDirectBtn}
            onPress={() => setShowCustomModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={15} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Native DateTimePicker for iOS & fallback */}
      {showNativePicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={effectiveMaxDate}
          minimumDate={minimumDate}
          onChange={handlePickerChange}
          onValueChange={handlePickerChange}
          onDismiss={handleDismiss}
        />
      )}

      {/* Cross-Platform / Web Modal & Direct Stepper Modal */}
      <Modal
        visible={showCustomModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="calendar" size={20} color={Colors.primaryTeal} />
                <Text style={styles.modalTitle}>
                  {allowFuture ? (t.selectDateTitle || 'Select Date') : (t.selectDobTitle || 'Select Date of Birth')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowCustomModal(false)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              ISO-8601 YYYY-MM-DD · FHIR R4 interoperability standard
            </Text>

            {/* Quick decade jump for effortless birth year selection */}
            <View style={styles.decadeRow}>
              <TouchableOpacity
                style={styles.decadeBtn}
                onPress={() => setModalYear((y) => Math.max(1920, y - 10))}
              >
                <Text style={styles.decadeBtnText}>-10 Yrs</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.decadeBtn}
                onPress={() => setModalYear((y) => Math.max(1920, y - 1))}
              >
                <Text style={styles.decadeBtnText}>-1 Yr</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.decadeBtn}
                onPress={() => setModalYear((y) => Math.min(maxYearAllowed, y + 1))}
              >
                <Text style={styles.decadeBtnText}>+1 Yr</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.decadeBtn}
                onPress={() => setModalYear((y) => Math.min(maxYearAllowed, y + 10))}
              >
                <Text style={styles.decadeBtnText}>+10 Yrs</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pickerRow}>
              {/* Year */}
              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>{t.yearLabel || 'Year'}</Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setModalYear((y) => Math.max(1920, y - 1))}
                  >
                    <Ionicons name="remove" size={15} color={Colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.stepValue}>{modalYear}</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setModalYear((y) => Math.min(maxYearAllowed, y + 1))}
                  >
                    <Ionicons name="add" size={15} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Month */}
              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>{t.monthLabel || 'Month'}</Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setModalMonth((m) => (m > 1 ? m - 1 : 12))}
                  >
                    <Ionicons name="remove" size={15} color={Colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.stepValue}>
                    {String(modalMonth).padStart(2, '0')}
                  </Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setModalMonth((m) => (m < 12 ? m + 1 : 1))}
                  >
                    <Ionicons name="add" size={15} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Day */}
              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>{t.dayLabel || 'Day'}</Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setModalDay((d) => (d > 1 ? d - 1 : 31))}
                  >
                    <Ionicons name="remove" size={15} color={Colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.stepValue}>
                    {String(modalDay).padStart(2, '0')}
                  </Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setModalDay((d) => (d < 31 ? d + 1 : 1))}
                  >
                    <Ionicons name="add" size={15} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.modalPreview}>
              <Text style={styles.modalPreviewLabel}>ISO-8601:</Text>
              <Text style={styles.modalPreviewValue}>
                {`${modalYear}-${String(modalMonth).padStart(2, '0')}-${String(modalDay).padStart(2, '0')}`}
              </Text>
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={commitCustomModal} activeOpacity={0.85}>
              <Ionicons name="checkmark" size={18} color={Colors.white} />
              <Text style={styles.confirmBtnText}>{t.confirmDateAction || 'Confirm Date'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  fhirBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryTeal,
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 0.3,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputBoxEmpty: {
    borderColor: '#CBD5E1',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  ageHelper: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 2,
  },
  selectActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryTeal,
  },
  modalDirectBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  decadeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 14,
  },
  decadeBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  decadeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryTeal,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  pickerCol: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 4,
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  stepValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    minWidth: 38,
    textAlign: 'center',
  },
  modalPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  modalPreviewLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  modalPreviewValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryDark,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryTeal,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  confirmBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
});
