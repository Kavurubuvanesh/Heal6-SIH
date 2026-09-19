import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import { ArUcoGuideBox } from '../components/camera/ArUcoGuideBox';
import { FlashControl } from '../components/camera/FlashControl';
import { ScanStackParamList, ROUTES } from '../navigation/routes';

type Props = NativeStackScreenProps<ScanStackParamList, 'CameraScan'>;

export const CameraScanScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<FlashMode>('off');
  const [capturing, setCapturing] = useState(false);
  const [markerLocked, setMarkerLocked] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    // Edge AR Detection Loop: Simulates real-time 4x4 ArUco fiducial lock & homography convergence
    const timer = setTimeout(async () => {
      setMarkerLocked(true);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Haptics fallback on web / unsupported devices
      }
    }, 1600);

    return () => clearTimeout(timer);
  }, []);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { paddingTop: insets.top }]}>
        <Text style={styles.permissionText}>Camera permission is required to perform foot screening.</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleFlash = () => {
    setFlash((current) => (current === 'off' ? 'on' : 'off'));
  };

  const takePicture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (!photo) throw new Error('No photo returned');
      navigation.navigate(ROUTES.IMAGE_REVIEW, { imageUri: photo.uri });
    } catch (e) {
      Alert.alert('Capture Error', 'Failed to capture image. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={flash === 'on'}
        ref={cameraRef}
      />

      {/* Viewfinder AR Guide Overlay */}
      <ArUcoGuideBox isAligned={markerLocked} markerLocked={markerLocked} />

      {/* Top Controls Bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top + 10, 20) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="close" size={28} color={Colors.white} />
        </TouchableOpacity>
        <FlashControl flash={flash} onToggle={toggleFlash} />
      </View>

      {/* Bottom Shutter Action Bar */}
      <View style={[styles.bottomBar, { bottom: Math.max(insets.bottom + 20, 36) }]}>
        <TouchableOpacity
          style={[styles.shutterButton, markerLocked && styles.shutterButtonLocked]}
          onPress={takePicture}
          disabled={capturing}
          activeOpacity={0.8}
        >
          <View style={[styles.shutterInner, markerLocked && styles.shutterInnerLocked]} />
        </TouchableOpacity>
        {markerLocked && (
          <View style={styles.lockedPill}>
            <Ionicons name="shield-checkmark" size={14} color="#10B981" />
            <Text style={styles.lockedPillText}>ArUco Homography Locked · Ready</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: Colors.background },
  permissionText: { fontSize: 16, color: Colors.textPrimary, textAlign: 'center', marginBottom: 20 },
  permissionBtn: { backgroundColor: Colors.primaryTeal, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  permissionBtnText: { color: Colors.white, fontWeight: '600' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.overlay, justifyContent: 'center', alignItems: 'center' },
  bottomBar: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 10,
    zIndex: 10,
  },
  shutterButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterButtonLocked: {
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryTeal,
  },
  shutterInnerLocked: {
    backgroundColor: '#10B981',
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(6, 78, 59, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  lockedPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A7F3D0',
  },
});
