import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../../types/domain';

interface BarcodeScannerModalProps {
  visible: boolean;
  orders: Order[];
  onClose: () => void;
  onScanSuccess: (orderId: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  visible,
  orders,
  onClose,
  onScanSuccess,
}) => {
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'CAMERA' | 'MANUAL'>('CAMERA');

  // Scanner Laser Animation
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && scanMode === 'CAMERA') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 1,
            duration: 1600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [visible, scanMode, laserAnim]);

  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180],
  });

  const handleRecognizeBarcode = (barcode: string) => {
    setErrorMessage(null);
    const cleaned = barcode.trim().toUpperCase();

    // Match either tracking number or order ID
    const match = orders.find(
      (o) =>
        o.trackingNumber.toUpperCase() === cleaned ||
        o.id.toUpperCase() === cleaned ||
        o.trackingNumber.toUpperCase().endsWith(cleaned) ||
        cleaned.includes(o.id.toUpperCase())
    );

    if (match) {
      onClose();
      onScanSuccess(match.id);
    } else {
      setErrorMessage(`No order found matching "${cleaned}". Check manifest.`);
    }
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      setErrorMessage('Please enter a waybill number or parcel ID.');
      return;
    }
    handleRecognizeBarcode(manualCode);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.scannerCard}>
          {/* Top Bar */}
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <Ionicons name="barcode-outline" size={22} color="#38BDF8" />
              <Text style={styles.title}>Waybill & QR Scanner</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close scanner"
            >
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Mode Switcher Tabs */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, scanMode === 'CAMERA' && styles.modeTabActive]}
              onPress={() => {
                setScanMode('CAMERA');
                setErrorMessage(null);
              }}
            >
              <Ionicons
                name="scan-outline"
                size={16}
                color={scanMode === 'CAMERA' ? '#38BDF8' : '#94A3B8'}
              />
              <Text
                style={[
                  styles.modeTabText,
                  scanMode === 'CAMERA' && styles.modeTabTextActive,
                ]}
              >
                Optical Viewfinder
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, scanMode === 'MANUAL' && styles.modeTabActive]}
              onPress={() => {
                setScanMode('MANUAL');
                setErrorMessage(null);
              }}
            >
              <Ionicons
                name="keypad-outline"
                size={16}
                color={scanMode === 'MANUAL' ? '#38BDF8' : '#94A3B8'}
              />
              <Text
                style={[
                  styles.modeTabText,
                  scanMode === 'MANUAL' && styles.modeTabTextActive,
                ]}
              >
                Manual Key-in
              </Text>
            </TouchableOpacity>
          </View>

          {scanMode === 'CAMERA' ? (
            <View style={styles.viewfinderContainer}>
              {/* Camera Simulation View */}
              <View style={styles.cameraViewport}>
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />

                {/* Animated Red/Cyan Laser */}
                <Animated.View
                  style={[
                    styles.laserLine,
                    { transform: [{ translateY: laserTranslateY }] },
                  ]}
                />

                <View style={styles.reticleTextWrap}>
                  <Text style={styles.reticleInstruction}>
                    Center barcode or shipping QR within brackets
                  </Text>
                </View>
              </View>

              {/* Torch / Flashlight Button */}
              <View style={styles.torchRow}>
                <TouchableOpacity
                  style={[
                    styles.torchBtn,
                    flashlightOn && styles.torchBtnActive,
                  ]}
                  onPress={() => setFlashlightOn(!flashlightOn)}
                >
                  <Ionicons
                    name={flashlightOn ? 'flash' : 'flash-outline'}
                    size={16}
                    color={flashlightOn ? '#F59E0B' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.torchText,
                      flashlightOn && styles.torchTextActive,
                    ]}
                  >
                    {flashlightOn ? 'Flashlight On' : 'Flashlight Off'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Quick Barcode Presets (Tap to simulate scan of real manifest parcels) */}
              <View style={styles.presetsSection}>
                <Text style={styles.presetsLabel}>
                  Quick Simulated Scans (from active manifest):
                </Text>
                <View style={styles.presetButtonsWrap}>
                  {orders.slice(0, 4).map((ord) => (
                    <TouchableOpacity
                      key={ord.id}
                      style={styles.presetChip}
                      onPress={() => handleRecognizeBarcode(ord.trackingNumber)}
                      accessibilityRole="button"
                      accessibilityLabel={`Scan ${ord.id}`}
                    >
                      <Ionicons name="qr-code-outline" size={12} color="#0284C7" />
                      <Text style={styles.presetChipText}>{ord.id}</Text>
                      <Text style={styles.presetChipSub}>({ord.recipientName.split(' ')[0]})</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.manualContainer}>
              <Text style={styles.manualLabel}>
                Enter Waybill / Tracking / Parcel ID:
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. DEL-BLR-9821031 or PP-8101"
                  placeholderTextColor="#64748B"
                  value={manualCode}
                  onChangeText={(val) => {
                    setManualCode(val);
                    setErrorMessage(null);
                  }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.searchBtn}
                  onPress={handleManualSubmit}
                >
                  <Text style={styles.searchBtnText}>Find</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Error Message */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={15} color="#EF4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  scannerCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: '#0F172A',
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  modeTabTextActive: {
    color: '#38BDF8',
  },
  viewfinderContainer: {
    alignItems: 'center',
  },
  cameraViewport: {
    width: '100%',
    height: 200,
    backgroundColor: '#020617',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerTL: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#38BDF8',
  },
  cornerTR: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#38BDF8',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#38BDF8',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#38BDF8',
  },
  laserLine: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  reticleTextWrap: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  reticleInstruction: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    textAlign: 'center',
  },
  torchRow: {
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  torchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  torchBtnActive: {
    backgroundColor: '#451A03',
  },
  torchText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
  },
  torchTextActive: {
    color: '#F59E0B',
  },
  presetsSection: {
    marginTop: 14,
    width: '100%',
  },
  presetsLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  presetButtonsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  presetChipSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  manualContainer: {
    paddingVertical: 8,
  },
  manualLabel: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '600',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
  searchBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#450A0A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  errorText: {
    fontSize: 11,
    color: '#FCA5A5',
    fontWeight: '600',
  },
});
