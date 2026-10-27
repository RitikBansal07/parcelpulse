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

    setSignatureModalVisible(false);
    executeTransition({
      orderId: order.id,
      fromStatus: order.status,
      toStatus: 'DELIVERED',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      recipientSignature: `${signerName.trim()} (Signed on handheld)`,
    });
    setSignerName('');
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
              <Text style={styles.sectionTitle}>Package Specifications</Text>
              <View style={styles.specsGrid}>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Category</Text>
                  <Text style={styles.specValue}>{order.packageDetails.category}</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Weight</Text>
                  <Text style={styles.specValue}>{order.packageDetails.weightKg} kg</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Dimensions</Text>
                  <Text style={styles.specValue}>{order.packageDetails.dimensions}</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Window</Text>
                  <Text style={styles.specValue}>{order.packageDetails.timeWindow}</Text>
                </View>
              </View>

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

      {/* Signature Proof of Delivery Modal */}
      <Modal
        visible={signatureModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSignatureModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.signatureModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Proof of Delivery (Signature)</Text>
              <TouchableOpacity onPress={() => setSignatureModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              This parcel requires recipient confirmation prior to marking DELIVERED.
            </Text>

            <Text style={styles.inputLabel}>Recipient Full Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Elena Rostova or Security Guard"
              placeholderTextColor="#94A3B8"
              value={signerName}
              onChangeText={setSignerName}
              testID="signature-name-input"
            />

            {/* Simulated Digital Signature Box */}
            <View style={styles.signatureBox}>
              <Ionicons name="pencil" size={20} color="#94A3B8" />
              <Text style={styles.signaturePlaceholder}>
                [ Digital Signature Pad Verified on Handheld ]
              </Text>
            </View>

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
});

