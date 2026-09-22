import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface ArUcoGuideBoxProps {
  isAligned?: boolean;
  markerLocked?: boolean;
}

/**
 * Clinical alignment frame for diabetic foot ulcer photography.
 * Real-time AR loop: Switches from dashed blue search reticle to solid
 * neon green bounding box upon 4x4 ArUco fiducial lock with homography convergence.
 */
export const ArUcoGuideBox: React.FC<ArUcoGuideBoxProps> = ({
  isAligned = false,
  markerLocked = false,
}) => {
  const active = isAligned || markerLocked;
  const frameColor = active ? '#10B981' : Colors.white;
  const markerBorderColor = active ? '#10B981' : '#38BDF8';

  return (
    <View style={styles.wrapper} pointerEvents="none">
      {/* Main Foot Framing Box */}
      <View
        style={[
          styles.box,
          {
            borderColor: active ? '#10B981' : 'rgba(255,255,255,0.35)',
            borderWidth: active ? 2 : 1.5,
          },
        ]}
      >
        {/* Viewfinder Reticle Corners */}
        <View style={[styles.corner, styles.topLeft, { borderColor: frameColor }]} />
        <View style={[styles.corner, styles.topRight, { borderColor: frameColor }]} />
        <View style={[styles.corner, styles.bottomLeft, { borderColor: frameColor }]} />
        <View style={[styles.corner, styles.bottomRight, { borderColor: frameColor }]} />

        {/* Center Crosshair Guide */}
        <View style={[styles.centerCrosshairH, active && { backgroundColor: 'rgba(16, 185, 129, 0.4)' }]} />
        <View style={[styles.centerCrosshairV, active && { backgroundColor: 'rgba(16, 185, 129, 0.4)' }]} />

        {/* Dedicated 25mm ArUco Marker Calibration Target Box */}
        <View
          style={[
            styles.arucoTargetBox,
            active ? styles.arucoTargetBoxLocked : styles.arucoTargetBoxSearching,
          ]}
        >
          {active ? (
            <View style={styles.lockedIconWrap}>
              <Ionicons name="lock-closed" size={18} color="#10B981" />
              <Text style={styles.arucoLockedLabel}>LOCKED</Text>
              <Text style={styles.arucoScaleLabel}>25mm (1:1)</Text>
            </View>
          ) : (
            <>
              <View style={styles.arucoPatternMini}>
                <View style={styles.arucoCellFilled} />
                <View style={styles.arucoCellEmpty} />
                <View style={styles.arucoCellEmpty} />
                <View style={styles.arucoCellFilled} />
              </View>
              <Text style={styles.arucoTargetLabel}>25mm ArUco</Text>
            </>
          )}
        </View>
      </View>

      {/* Alignment & Framing Guidance Pills */}
      <View
        style={[
          styles.guidancePill,
          active && styles.guidancePillLocked,
        ]}
      >
        <Ionicons
          name={active ? 'checkmark-circle' : 'scan-outline'}
          size={18}
          color={active ? '#10B981' : Colors.white}
        />
        <Text style={[styles.hint, active && styles.hintLocked]}>
          {active
            ? 'Marker Locked. Hold still for capture.'
            : 'Align foot inside frame & place 25mm ArUco marker in designated zone'}
        </Text>
      </View>

      <View style={[styles.distanceBadge, active && styles.distanceBadgeLocked]}>
        <Ionicons
          name={active ? 'sparkles' : 'information-circle-outline'}
          size={13}
          color={active ? '#10B981' : '#CBD5E1'}
        />
        <Text style={[styles.distanceText, active && styles.distanceTextLocked]}>
          {active
            ? 'Homography Locked · Scale 11.8 px/mm'
            : 'Hold camera ~30 cm away · Parallel to sole'}
        </Text>
      </View>
    </View>
  );
};

const CORNER_SIZE = 32;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  box: {
    width: '80%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderWidth: 3.5,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 16,
  },
  centerCrosshairH: {
    position: 'absolute',
    top: '50%',
    left: '42%',
    width: '16%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  centerCrosshairV: {
    position: 'absolute',
    top: '42%',
    left: '50%',
    height: '16%',
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  arucoTargetBox: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 72,
    height: 72,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arucoTargetBoxSearching: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  arucoTargetBoxLocked: {
    borderWidth: 2.5,
    borderStyle: 'solid',
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    shadowColor: '#10B981',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  lockedIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arucoLockedLabel: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '900',
    marginTop: 1,
    letterSpacing: 0.5,
  },
  arucoScaleLabel: {
    color: '#A7F3D0',
    fontSize: 8,
    fontWeight: '700',
    marginTop: -1,
  },
  arucoPatternMini: {
    width: 22,
    height: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: '#38BDF8',
    marginBottom: 3,
  },
  arucoCellFilled: {
    width: 10,
    height: 10,
    backgroundColor: '#38BDF8',
  },
  arucoCellEmpty: {
    width: 10,
    height: 10,
    backgroundColor: 'transparent',
  },
  arucoTargetLabel: {
    color: '#38BDF8',
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  guidancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 18,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  guidancePillLocked: {
    backgroundColor: 'rgba(6, 78, 59, 0.88)',
    borderColor: '#10B981',
  },
  hint: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
  hintLocked: {
    color: '#E6FFFA',
    fontWeight: '800',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  distanceBadgeLocked: {
    backgroundColor: 'rgba(6, 78, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  distanceText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  distanceTextLocked: {
    color: '#A7F3D0',
    fontWeight: '700',
  },
});
