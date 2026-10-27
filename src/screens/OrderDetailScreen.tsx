import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { OrderDetailRouteProp, NavigationProp } from '../types/navigation';
import { useOrderDetailQuery, useTransitionMutation } from '../api/queries';
import { OrderStatus, FailureReason, TransitionEvent } from '../types/domain';
import { FAILURE_REASONS } from '../domain/orderStateMachine';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CustomerContactCard } from '../components/domain/CustomerContactCard';
import { SimulatedMapPanel } from '../components/domain/SimulatedMapPanel';
import { StatusActionSheet } from '../components/domain/StatusActionSheet';
import { ScreenState } from '../components/ui/ScreenState';
import { Button } from '../components/ui/Button';

export const OrderDetailScreen: React.FC = () => {
  const route = useRoute<OrderDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { orderId } = route.params;

  const { data: order, isLoading, error, refetch } = useOrderDetailQuery(orderId);
  const transitionMutation = useTransitionMutation();

  // Modal States
  const [signatureModalVisible, setSignatureModalVisible] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [podPhotoType, setPodPhotoType] = useState<'DOORSTEP' | 'HANDOVER' | 'SECURITY_DESK'>('DOORSTEP');
  const [podPhotoUrl, setPodPhotoUrl] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [failureModalVisible, setFailureModalVisible] = useState(false);
  const [selectedFailureReason, setSelectedFailureReason] = useState<FailureReason>('CUSTOMER_UNAVAILABLE');
  const [failureNote, setFailureNote] = useState('');

  const executeTransition = (event: TransitionEvent) => {
    transitionMutation.mutate(event, {
      onSuccess: (result) => {
        if (result.queuedOffline) {
          Alert.alert(
            'Saved Offline to Outbox',
            `Network offline or unstable. Transition to '${event.toStatus}' is safely stored in local outbox and will auto-replay on reconnect.`,
            [{ text: 'OK' }]
          );
        }
      },
      onError: (err) => {
        Alert.alert('Transition Error', err.message);
      },
    });
  };

  const handleAdvanceStatus = (targetStatus: OrderStatus) => {
    if (!order) return;
    executeTransition({
      orderId: order.id,
      fromStatus: order.status,
      toStatus: targetStatus,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  const handleConfirmSignature = () => {
    if (!order) return;
    if (!signerName.trim()) {
      Alert.alert('Name Required', 'Please enter the name of the recipient signing for this package.');
      return;
    }

    // OTP validation if order has OTP code and driver entered something
    if (order.packageDetails.otpCode && enteredOtp.trim()) {
      if (enteredOtp.trim() !== order.packageDetails.otpCode) {
        setOtpError(`Incorrect OTP. Customer code is ${order.packageDetails.otpCode}`);
        return;
      }
    }

    const finalPhoto =
      podPhotoUrl ||
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=80';

    setSignatureModalVisible(false);
    executeTransition({
      orderId: order.id,
      fromStatus: order.status,
      toStatus: 'DELIVERED',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      recipientSignature: `${signerName.trim()} (Signed on handheld)`,
      podPhotoUrl: finalPhoto,
      podPhotoType: podPhotoType,
      verifiedOtp: enteredOtp.trim() || order.packageDetails.otpCode,
    });
    setSignerName('');
    setPodPhotoUrl(null);
    setEnteredOtp('');
    setOtpError(null);
  };

  const handleConfirmFailure = () => {
    if (!order) return;

    setFailureModalVisible(false);
    executeTransition({
      orderId: order.id,
      fromStatus: order.status,
      toStatus: 'FAILED_ATTEMPT',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      failureReason: selectedFailureReason,
      failureNote: failureNote.trim() || undefined,
    });
    setFailureNote('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back to manifest"
          testID="order-detail-back-button"
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{order?.id || orderId}</Text>
          <Text style={styles.trackingText}>{order?.trackingNumber}</Text>
        </View>

        {order && <StatusBadge status={order.status} hasPendingSync={order.hasPendingSync} size="small" />}
      </View>

      <ScreenState
        loading={isLoading}
        error={error ? (error as Error).message : null}
        onRetry={refetch}
      >
        {order ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Customer Details & Contact Actions */}
            <CustomerContactCard order={order} />

            {/* Vector Route Telemetry Map */}
            <SimulatedMapPanel order={order} />

            {/* Package Specifications Card */}
            <View style={styles.specsCard}>
              <Text style={styles.sectionTitle}>Package Specifications & Payment</Text>
              <View style={styles.specsGrid}>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Category</Text>
                  <Text style={styles.specValue}>{order.packageDetails.category}</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Payment Terms</Text>
                  <Text
                    style={[
                      styles.specValue,
                      order.packageDetails.paymentMode === 'COD' && { color: '#B45309' },
                    ]}
                  >
                    {order.packageDetails.paymentMode === 'COD'
                      ? `COD: ₹${order.packageDetails.codAmountInr?.toLocaleString('en-IN')}`
                      : 'UPI Prepaid'}
                  </Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Weight</Text>
                  <Text style={styles.specValue}>{order.packageDetails.weightKg} kg</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Window</Text>
                  <Text style={styles.specValue}>{order.packageDetails.timeWindow}</Text>
                </View>
              </View>

              {order.packageDetails.otpCode && (
                <View style={styles.otpBanner}>
                  <Ionicons name="key" size={16} color="#0284C7" />
                  <Text style={styles.otpBannerText}>
                    Required Delivery OTP: <Text style={{ fontWeight: '800' }}>{order.packageDetails.otpCode}</Text>
                  </Text>
                </View>
              )}

              {order.recipientSignature && (
                <View style={styles.signatureBadge}>
                  <Ionicons name="checkmark-done-circle" size={16} color="#166534" />
                  <Text style={styles.signatureText}>
                    Proof of Delivery: {order.recipientSignature}
                  </Text>
                </View>
              )}

              {order.failureReason && (
                <View style={styles.failureBadge}>
                  <Ionicons name="alert-circle" size={16} color="#991B1B" />
                  <Text style={styles.failureText}>
                    Exception: {order.failureReason}
                    {order.failureNote ? ` • ${order.failureNote}` : ''}
                  </Text>
                </View>
              )}
            </View>

            {/* Proof of Delivery (POD) Dossier Card */}
            {(order.status === 'DELIVERED' || !!order.podPhotoUrl) && (
              <View style={styles.podDossierCard} testID="pod-dossier-card">
                <View style={styles.podDossierHeader}>
                  <View style={styles.podDossierTitleRow}>
                    <Ionicons name="shield-checkmark" size={18} color="#059669" />
                    <Text style={styles.podDossierTitle}>Proof of Delivery (POD) Dossier</Text>
                  </View>
                  <View style={styles.podTypeChip}>
                    <Text style={styles.podTypeChipText}>
                      {order.podPhotoType || 'DOORSTEP'}
                    </Text>
                  </View>
                </View>

                {order.podPhotoUrl ? (
                  <View style={styles.podImageWrapper}>
                    <Image
                      source={{ uri: order.podPhotoUrl }}
                      style={styles.podImage}
                      resizeMode="cover"
                    />
                    <View style={styles.podWatermark}>
                      <Ionicons name="location-sharp" size={12} color="#FFFFFF" />
                      <Text style={styles.podWatermarkText} numberOfLines={1}>
                        {order.deliveryAddress.locality || order.deliveryAddress.city} • {order.podPhotoTimestamp || 'Recorded'} • GPS Geotagged
                      </Text>
                    </View>
                  </View>
                ) : null}

                <View style={styles.podDetailsRow}>
                  <View style={styles.podDetailCol}>
                    <Text style={styles.podDetailLabel}>Signed by</Text>
                    <Text style={styles.podDetailVal}>{order.recipientSignature || 'Direct Handover'}</Text>
                  </View>
                  {(order.verifiedOtp || order.packageDetails.otpCode) ? (
                    <View style={styles.podDetailCol}>
                      <Text style={styles.podDetailLabel}>Customer OTP</Text>
                      <Text style={styles.podDetailValOtp}>
                        ✓ {order.verifiedOtp || order.packageDetails.otpCode} Verified
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            )}

            {/* Operational Action CTA Sheet */}
            <StatusActionSheet
              order={order}
              loading={transitionMutation.isPending}
              onAdvanceStatus={handleAdvanceStatus}
              onRequestSignature={() => setSignatureModalVisible(true)}
              onRequestFailure={() => setFailureModalVisible(true)}
            />

            {/* Status Timeline Audit Trail */}
            <View style={styles.timelineCard}>
              <Text style={styles.sectionTitle}>Audit Timeline</Text>
              {order.timeline.map((entry, idx) => (
                <View key={entry.id || idx} style={styles.timelineRow}>
                  <View style={styles.timelineDotWrap}>
                    <View style={[styles.timelineDot, idx === 0 && styles.timelineDotActive]} />
                    {idx < order.timeline.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineStatusRow}>
                      <Text style={styles.timelineStatusText}>{entry.status}</Text>
                      <Text style={styles.timelineTimeText}>{entry.timestamp}</Text>
                    </View>
                    {entry.note ? <Text style={styles.timelineNote}>{entry.note}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : null}
      </ScreenState>

      {/* Proof of Delivery (POD) & Handheld Signature Modal */}
      <Modal
        visible={signatureModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSignatureModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.signatureModalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="camera" size={20} color="#059669" />
                <Text style={styles.modalHeaderTitle}>Proof of Delivery (POD)</Text>
              </View>
              <TouchableOpacity onPress={() => setSignatureModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
              {/* Dropoff Type Selector */}
              <Text style={styles.inputLabel}>Delivery Location / Handover Type</Text>
              <View style={styles.podTypeSelector}>
                {(['DOORSTEP', 'HANDOVER', 'SECURITY_DESK'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.podTypeBtn,
                      podPhotoType === type && styles.podTypeBtnActive,
                    ]}
                    onPress={() => setPodPhotoType(type)}
                  >
                    <Text
                      style={[
                        styles.podTypeBtnText,
                        podPhotoType === type && styles.podTypeBtnTextActive,
                      ]}
                    >
                      {type === 'DOORSTEP'
                        ? '🏠 Doorstep'
                        : type === 'HANDOVER'
                        ? '🤝 Handover'
                        : '🏢 Gate Desk'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Photo Capture Section */}
              <Text style={styles.inputLabel}>Doorstep / Handover Photo</Text>
              <View style={styles.podPhotoCard}>
                <Image
                  source={{
                    uri:
                      podPhotoUrl ||
                      (podPhotoType === 'DOORSTEP'
                        ? 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=80'
                        : podPhotoType === 'HANDOVER'
                        ? 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=80'
                        : 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=500&auto=format&fit=crop&q=80'),
                  }}
                  style={styles.podModalPreview}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.snapPhotoBtn}
                  onPress={() => {
                    const photos = [
                      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=500&auto=format&fit=crop&q=80',
                    ];
                    const next = photos[(photos.indexOf(podPhotoUrl || '') + 1) % photos.length];
                    setPodPhotoUrl(next);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Snap Photo"
                >
                  <Ionicons name="camera-reverse" size={16} color="#FFFFFF" />
                  <Text style={styles.snapPhotoText}>Retake / Snap POD Photo</Text>
                </TouchableOpacity>
              </View>

              {/* OTP Verification if applicable */}
              {order?.packageDetails.otpCode ? (
                <View style={styles.otpVerifySection}>
                  <View style={styles.otpVerifyHeader}>
                    <Text style={styles.inputLabel}>Customer Delivery OTP</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setEnteredOtp(order.packageDetails.otpCode || '');
                        setOtpError(null);
                      }}
                    >
                      <Text style={styles.autoFillOtpText}>Auto-fill ({order.packageDetails.otpCode})</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={[styles.textInput, !!otpError && { borderColor: '#EF4444' }]}
                    placeholder={`Enter 4-digit code (e.g. ${order.packageDetails.otpCode})`}
                    placeholderTextColor="#94A3B8"
                    value={enteredOtp}
                    onChangeText={(val) => {
                      setEnteredOtp(val);
                      setOtpError(null);
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  {otpError ? <Text style={styles.otpErrorMsg}>{otpError}</Text> : null}
                </View>
              ) : null}

              <Text style={styles.inputLabel}>Recipient / Receiver Full Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder={order?.recipientName || 'e.g. Pooja Hegde'}
                placeholderTextColor="#94A3B8"
                value={signerName}
                onChangeText={setSignerName}
                testID="signature-name-input"
              />

              {/* Simulated Handheld Signature Box */}
              <View style={styles.signatureBox}>
                <Ionicons name="pencil" size={18} color="#059669" />
                <Text style={styles.signaturePlaceholder}>
                  [ Driver Handheld Signature & GPS Geostamp Recorded ]
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setSignatureModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Confirm Delivery"
                variant="success"
                onPress={handleConfirmSignature}
                style={{ flex: 1.5 }}
                testID="confirm-signature-btn"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delivery Exception / Failure Reason Modal */}
      <Modal
        visible={failureModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFailureModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.failureModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Record Delivery Exception</Text>
              <TouchableOpacity onPress={() => setFailureModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Select the primary operational blocker preventing handover:
            </Text>

            <ScrollView style={{ maxHeight: 220 }}>
              {FAILURE_REASONS.map((reason) => {
                const isSelected = selectedFailureReason === reason.code;
                return (
                  <TouchableOpacity
                    key={reason.code}
                    style={[styles.reasonOption, isSelected && styles.reasonOptionSelected]}
                    onPress={() => setSelectedFailureReason(reason.code)}
                    testID={`failure-reason-${reason.code}`}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isSelected ? '#DC2626' : '#94A3B8'}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.reasonLabel, isSelected && styles.reasonLabelSelected]}>
                        {reason.label}
                      </Text>
                      <Text style={styles.reasonDesc}>{reason.description}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Additional Driver Note (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Ring doorbell 3 times, neighbor confirmed away"
              placeholderTextColor="#94A3B8"
              value={failureNote}
              onChangeText={setFailureNote}
              testID="failure-note-input"
            />

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setFailureModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Submit Exception"
                variant="danger"
                onPress={handleConfirmFailure}
                style={{ flex: 1.5 }}
                testID="confirm-failure-btn"
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  trackingText: {
    fontSize: 11,
    color: '#64748B',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  specsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specItem: {
    width: '47%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  specValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
    marginTop: 2,
  },
  signatureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  otpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  otpBannerText: {
    fontSize: 13,
    color: '#0369A1',
    fontWeight: '600',
  },
  signatureText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  failureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  failureText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
  },
  podDossierCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  podDossierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  podDossierTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  podDossierTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
    textTransform: 'uppercase',
  },
  podTypeChip: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  podTypeChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  podImageWrapper: {
    width: '100%',
    height: 190,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
    backgroundColor: '#E2E8F0',
  },
  podImage: {
    width: '100%',
    height: '100%',
  },
  podWatermark: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  podWatermarkText: {
    fontSize: 10,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  podDetailsRow: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 10,
    gap: 12,
  },
  podDetailCol: {
    flex: 1,
  },
  podDetailLabel: {
    fontSize: 10,
    color: '#047857',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  podDetailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#064E3B',
  },
  podDetailValOtp: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 44,
  },
  timelineDotWrap: {
    alignItems: 'center',
    width: 24,
    marginRight: 10,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#94A3B8',
    marginTop: 4,
  },
  timelineDotActive: {
    backgroundColor: '#0284C7',
    transform: [{ scale: 1.2 }],
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 12,
  },
  timelineStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  timelineTimeText: {
    fontSize: 11,
    color: '#64748B',
  },
  timelineNote: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  signatureModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  failureModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 14,
  },
  signatureBox: {
    height: 90,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 6,
  },
  signaturePlaceholder: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
    gap: 10,
  },
  reasonOptionSelected: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  reasonLabelSelected: {
    color: '#991B1B',
  },
  reasonDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  podTypeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  podTypeBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  podTypeBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  podTypeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  podTypeBtnTextActive: {
    color: '#059669',
  },
  podPhotoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 12,
    alignItems: 'center',
  },
  podModalPreview: {
    width: '100%',
    height: 120,
    backgroundColor: '#E2E8F0',
  },
  snapPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    width: '100%',
    paddingVertical: 8,
    gap: 6,
  },
  snapPhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  otpVerifySection: {
    marginBottom: 10,
  },
  otpVerifyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autoFillOtpText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '700',
  },
  otpErrorMsg: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: -8,
    marginBottom: 10,
  },
});

