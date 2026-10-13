import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import { ArUcoGuideBox, ReticleLayout } from '../components/camera/ArUcoGuideBox';
import { FlashControl } from '../components/camera/FlashControl';
import { ScanStackParamList, ROUTES } from '../navigation/routes';
import { cropPhotoToReticle, ScreenBox } from '../utils/imageHelpers';

type Props = NativeStackScreenProps<ScanStackParamList, 'CameraScan'>;

// ── Quality Gate Engine ───────────────────────────────────────
// Gate states: 0 = Not Ready | 1 = Partial | 2 = All Clear
type QualityGateStatus = {
  markerLocked: boolean;   // ArUco fiducial homography lock (simulated)
  frameStable: boolean;    // Camera stabilization hold achieved
  flashReady: boolean;     // Flash or ambient sufficient
};

function computeReadinessScore(gates: QualityGateStatus): number {
  return [gates.markerLocked, gates.frameStable, gates.flashReady].filter(Boolean).length;
}

const GATE_LABELS: Record<keyof QualityGateStatus, string> = {
  markerLocked: 'ArUco Fiducial',
  frameStable: 'Frame Stable',
  flashReady: 'Light Quality',
};

const GATE_ICONS: Record<keyof QualityGateStatus, keyof typeof Ionicons.glyphMap> = {
  markerLocked: 'scan-outline',
  frameStable: 'phone-portrait-outline',
  flashReady: 'sunny-outline',
};

export const CameraScanScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const windowDims = useWindowDimensions();
  const [viewport, setViewport] = useState({ width: windowDims.width, height: windowDims.height });
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<FlashMode>('off');
  const [capturing, setCapturing] = useState(false);
  const [croppingStatus, setCroppingStatus] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // ── Quality Gates State ──────────────────────────────────────
  const [gates, setGates] = useState<QualityGateStatus>({
    markerLocked: false,
    frameStable: false,
    flashReady: false,
  });
  const readinessScore = computeReadinessScore(gates);
  const allClear = readinessScore === 3;

  // Pulsing animation for the readiness ring
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (allClear) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 700, useNativeDriver: true }),
        ])
      ).start();
      Animated.timing(glowAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [allClear]);

  // ── Reticle Box ───────────────────────────────────────────────
  const defaultBoxWidth = Math.round(windowDims.width * 0.8);
  const defaultBoxHeight = Math.round(defaultBoxWidth * (4 / 3));
  const [reticleBox, setReticleBox] = useState<ScreenBox>({
    width: defaultBoxWidth,
    height: defaultBoxHeight,
    x: Math.round((windowDims.width - defaultBoxWidth) / 2),
    y: Math.round((windowDims.height - defaultBoxHeight) / 2),
  });

  // ── Simulated Quality Gate Sequencer ─────────────────────────
  // In production this would come from real-time frame analysis hooks
  useEffect(() => {
    // Stage 1: Flash / ambient light check (immediate – user can control flash)
    const t1 = setTimeout(() => {
      setGates((g) => ({ ...g, flashReady: true }));
    }, 800);

    // Stage 2: Camera stabilization hold (gyro simulation)
    const t2 = setTimeout(() => {
      setGates((g) => ({ ...g, frameStable: true }));
    }, 1400);

    // Stage 3: ArUco marker lock + homography convergence
    const t3 = setTimeout(async () => {
      setGates((g) => ({ ...g, markerLocked: true }));
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Haptics fallback
      }
    }, 2000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Re-run gate checks when flash changes (light quality gate depends on flash)
  useEffect(() => {
    setGates((g) => ({
      ...g,
      flashReady: false,
      frameStable: false,
    }));
    const t1 = setTimeout(() => setGates((g) => ({ ...g, flashReady: true })), 600);
    const t2 = setTimeout(() => setGates((g) => ({ ...g, frameStable: true })), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [flash]);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { paddingTop: insets.top }]}>
        <View style={styles.permissionIcon}>
          <Ionicons name="camera-outline" size={48} color={Colors.primaryTeal} />
        </View>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          Clinical foot photography requires camera permission for accurate wound metrology.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Ionicons name="camera" size={18} color={Colors.white} />
          <Text style={styles.permissionBtnText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleFlash = () => setFlash((c) => (c === 'off' ? 'on' : 'off'));

  const handleReticleLayout = (layout: ReticleLayout) => {
    if (layout.width > 20 && layout.height > 20) {
      setReticleBox({
        x: Math.round(layout.x),
        y: Math.round(layout.y),
        width: Math.round(layout.width),
        height: Math.round(layout.height),
      });
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || capturing) return;

    // ── Pre-capture Quality Gate Guard ────────────────────────
    if (!allClear) {
      const failedGates = (Object.keys(gates) as (keyof QualityGateStatus)[])
        .filter((k) => !gates[k])
        .map((k) => GATE_LABELS[k])
        .join(', ');
      Alert.alert(
        '⚠️ Quality Gates Not Met',
        `The following checks have not passed yet:\n\n• ${failedGates.split(', ').join('\n• ')}\n\nWait for all gates to clear for the most accurate clinical analysis.`,
        [
          { text: 'Wait', style: 'cancel' },
          {
            text: 'Capture Anyway',
            style: 'destructive',
            onPress: () => _performCapture(),
          },
        ]
      );
      return;
    }

    await _performCapture();
  };

  const _performCapture = async () => {
    if (!cameraRef.current) return;
    setCapturing(true);
    setCroppingStatus('Capturing high-resolution frame...');
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.92 });
      if (!photo || !photo.uri) throw new Error('No photo returned');

      setCroppingStatus('Isolating wound ROI...');

      let imgWidth = photo.width;
      let imgHeight = photo.height;

      if (!imgWidth || !imgHeight) {
        await new Promise<void>((resolve) => {
          Image.getSize(
            photo.uri,
            (w, h) => { imgWidth = w; imgHeight = h; resolve(); },
            () => resolve()
          );
        });
      }

      const nativeSize = { width: imgWidth || 1080, height: imgHeight || 1440 };
      console.log('📸 [SCAN] Full frame:', nativeSize, '| Reticle:', reticleBox, '| Viewport:', viewport);

      setCroppingStatus('Applying ArUco homographic crop...');
      const croppedUri = await cropPhotoToReticle(photo.uri, nativeSize, reticleBox, viewport);
      console.log('✂️ [SCAN] Cropped ROI created:', croppedUri);

      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { }

      navigation.navigate(ROUTES.IMAGE_REVIEW, {
        imageUri: croppedUri,
        originalUri: photo.uri,
      });
    } catch (e) {
      Alert.alert('Capture Error', 'Failed to capture image. Please ensure the camera has a clear view and try again.');
    } finally {
      setCapturing(false);
      setCroppingStatus(null);
    }
  };

  // ── Readiness Ring Color ──────────────────────────────────────
  const readinessColors = ['#EF4444', '#F59E0B', '#F59E0B', '#10B981'];
  const ringColor = readinessColors[readinessScore];

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0) setViewport({ width, height });
      }}
    >
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={flash === 'on'}
        ref={cameraRef}
      />

      {/* Viewfinder AR Guide */}
      <ArUcoGuideBox
        isAligned={allClear}
        markerLocked={gates.markerLocked}
        onBoxLayout={handleReticleLayout}
      />

      {/* Top Controls */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top + 10, 20) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="close" size={26} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.topTitle}>Clinical Foot Scan</Text>
          <Text style={styles.topSubtitle}>Align foot in frame · Place ArUco marker</Text>
        </View>
        <FlashControl flash={flash} onToggle={toggleFlash} />
      </View>

      {/* ── Quality Gate HUD Panel ────────────────────────────── */}
      <View style={styles.qualityPanel}>
        {(Object.keys(gates) as (keyof QualityGateStatus)[]).map((key) => {
          const passed = gates[key];
          return (
            <View key={key} style={[styles.gateRow, passed && styles.gateRowPassed]}>
              <View style={[styles.gateIconWrap, passed && styles.gateIconWrapPassed]}>
                <Ionicons
                  name={passed ? 'checkmark' : GATE_ICONS[key]}
                  size={12}
                  color={passed ? '#10B981' : '#94A3B8'}
                />
              </View>
              <Text style={[styles.gateLabel, passed && styles.gateLabelPassed]}>
                {GATE_LABELS[key]}
              </Text>
              <View style={[styles.gateStatusDot, { backgroundColor: passed ? '#10B981' : '#475569' }]} />
            </View>
          );
        })}
      </View>

      {/* Processing Toast */}
      {croppingStatus && (
        <View style={styles.processingBadge}>
          <ActivityIndicator size="small" color="#10B981" />
          <Text style={styles.processingText}>{croppingStatus}</Text>
        </View>
      )}

      {/* Bottom Shutter Section */}
      <View style={[styles.bottomBar, { bottom: Math.max(insets.bottom + 20, 36) }]}>
        {/* Readiness Summary Pill */}
        <View style={[styles.readinessPill, { borderColor: ringColor + '88' }]}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.readinessDot,
                { backgroundColor: i < readinessScore ? ringColor : '#334155' },
              ]}
            />
          ))}
          <Text style={[styles.readinessText, { color: ringColor }]}>
            {readinessScore === 3
              ? 'All Systems Go'
              : readinessScore === 2
              ? 'Almost Ready...'
              : readinessScore === 1
              ? 'Calibrating...'
              : 'Initializing...'}
          </Text>
        </View>

        {/* Shutter Button */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[
              styles.shutterButton,
              { borderColor: ringColor },
              capturing && styles.shutterButtonCapturing,
            ]}
            onPress={takePicture}
            disabled={capturing}
            activeOpacity={0.8}
          >
            <View style={[styles.shutterInner, { backgroundColor: allClear ? '#10B981' : '#64748B' }]}>
              {capturing ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons name={allClear ? 'camera' : 'ellipsis-horizontal'} size={22} color={Colors.white} />
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Ready Banner */}
        {allClear && !croppingStatus && (
          <View style={styles.lockedPill}>
            <Ionicons name="shield-checkmark" size={13} color="#10B981" />
            <Text style={styles.lockedPillText}>ArUco Locked · Capture Ready</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, backgroundColor: '#F8FAFC' },
  permissionIcon: {
    width: 90,
    height: 90,
    borderRadius: 26,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CCFBF1',
    marginBottom: 20,
  },
  permissionTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  permissionText: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  permissionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primaryTeal,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: Colors.primaryTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  permissionBtnText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  topCenter: { flex: 1, alignItems: 'center' },
  topTitle: { color: Colors.white, fontSize: 14, fontWeight: '800' },
  topSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600', marginTop: 2 },
  // Quality Gate Panel
  qualityPanel: {
    position: 'absolute',
    top: 130,
    right: 14,
    backgroundColor: 'rgba(2, 6, 23, 0.82)',
    borderRadius: 14,
    padding: 10,
    gap: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 10,
    minWidth: 148,
  },
  gateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  gateRowPassed: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  gateIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateIconWrapPassed: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  gateLabel: { flex: 1, color: '#64748B', fontSize: 10, fontWeight: '700' },
  gateLabelPassed: { color: '#A7F3D0', fontWeight: '800' },
  gateStatusDot: { width: 6, height: 6, borderRadius: 3 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  readinessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(2, 6, 23, 0.82)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  readinessDot: { width: 8, height: 8, borderRadius: 4 },
  readinessText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  shutterButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 8,
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterButtonCapturing: { opacity: 0.6, borderColor: '#F59E0B' },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(6, 78, 59, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  lockedPillText: { fontSize: 11, fontWeight: '800', color: '#A7F3D0' },
  processingBadge: {
    position: 'absolute',
    top: '48%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#10B981',
    zIndex: 20,
    shadowColor: '#10B981',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  processingText: { color: '#E2E8F0', fontSize: 13, fontWeight: '700' },
});
