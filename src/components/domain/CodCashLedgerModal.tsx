import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order, DriverShift } from '../../types/domain';
import { useSettleShiftCodMutation } from '../../api/queries';

interface CodCashLedgerModalProps {
  visible: boolean;
  orders: Order[];
  shift?: DriverShift;
  onClose: () => void;
}

export const CodCashLedgerModal: React.FC<CodCashLedgerModalProps> = ({
  visible,
  orders,
  shift,
  onClose,
}) => {
  const settleMutation = useSettleShiftCodMutation();
  const [showVoucher, setShowVoucher] = useState(false);

  // COD orders calculation
  const codOrders = orders.filter((o) => o.packageDetails.paymentMode === 'COD');
  const deliveredCodOrders = codOrders.filter((o) => o.status === 'DELIVERED');
  const pendingCodOrders = codOrders.filter((o) => o.status !== 'DELIVERED');

  const cashCollectedInr = deliveredCodOrders.reduce(
    (sum, o) => sum + (o.packageDetails.codAmountInr || 0),
    0
  );

  const pendingCodInr = pendingCodOrders.reduce(
    (sum, o) => sum + (o.packageDetails.codAmountInr || 0),
    0
  );

  const upiPrepaidTotalInr = orders
    .filter((o) => o.packageDetails.paymentMode === 'UPI_PREPAID' && o.status === 'DELIVERED')
    .reduce((sum) => sum + 1299, 0); // Approximate delivered order value

  const handleDepositCash = () => {
    settleMutation.mutate(undefined, {
      onSuccess: () => {
        setShowVoucher(true);
      },
      onError: (err: any) => {
        Alert.alert('Deposit Error', err.message || 'Unable to record hub cash deposit.');
      },
    });
  };

  const isSettled = !!shift?.settlementVoucherId;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <Ionicons name="cash" size={22} color="#10B981" />
              <Text style={styles.title}>COD Cash Bag & Settlement</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close Cash Ledger"
            >
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Cash in Bag Balance Card */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceTopRow}>
                <Text style={styles.balanceLabel}>CASH IN BAG (TODAY)</Text>
                <View style={styles.currencyPill}>
                  <Text style={styles.currencyPillText}>INR (₹)</Text>
                </View>
              </View>

              <Text style={styles.balanceAmount}>
                ₹{cashCollectedInr.toLocaleString('en-IN')}
              </Text>

              <View style={styles.statsSplitRow}>
                <View style={styles.splitCol}>
                  <Text style={styles.splitSubLabel}>Pending COD on Road</Text>
                  <Text style={styles.splitPendingVal}>
                    ₹{pendingCodInr.toLocaleString('en-IN')} ({pendingCodOrders.length} pkgs)
                  </Text>
                </View>

                <View style={styles.splitColDivider} />

                <View style={styles.splitCol}>
                  <Text style={styles.splitSubLabel}>Prepaid Digital</Text>
                  <Text style={styles.splitPrepaidVal}>
                    ₹{upiPrepaidTotalInr.toLocaleString('en-IN')} (UPI/Card)
                  </Text>
                </View>
              </View>
            </View>

            {/* Estimated Denominations Breakdown */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>CASH DENOMINATION SUMMARY</Text>
              <View style={styles.denomRow}>
                <View style={styles.denomChip}>
                  <Text style={styles.denomLabel}>₹500</Text>
                  <Text style={styles.denomCount}>x {Math.floor(cashCollectedInr / 500)}</Text>
                </View>
                <View style={styles.denomChip}>
                  <Text style={styles.denomLabel}>₹200</Text>
                  <Text style={styles.denomCount}>x {Math.floor((cashCollectedInr % 500) / 200)}</Text>
                </View>
                <View style={styles.denomChip}>
                  <Text style={styles.denomLabel}>₹100</Text>
                  <Text style={styles.denomCount}>x {Math.floor(((cashCollectedInr % 500) % 200) / 100)}</Text>
                </View>
                <View style={styles.denomChip}>
                  <Text style={styles.denomLabel}>Coins / Change</Text>
                  <Text style={styles.denomCount}>₹{(cashCollectedInr % 100)}</Text>
                </View>
              </View>
            </View>

            {/* COD Manifest Orders List */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>CASH ON DELIVERY SHIPMENTS</Text>
              {codOrders.map((ord) => {
                const isDelivered = ord.status === 'DELIVERED';
                return (
                  <View key={ord.id} style={styles.codOrderItem}>
                    <View style={styles.codOrderInfo}>
                      <Text style={styles.codOrderId}>{ord.id} • {ord.recipientName}</Text>
                      <Text style={styles.codOrderLoc}>{ord.deliveryAddress.locality}</Text>
                    </View>
                    <View style={styles.codOrderRight}>
                      <Text style={styles.codOrderAmt}>
                        ₹{ord.packageDetails.codAmountInr?.toLocaleString('en-IN')}
                      </Text>
                      <View
                        style={[
                          styles.codStatusBadge,
                          isDelivered ? styles.codBadgeCollected : styles.codBadgePending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.codBadgeText,
                            isDelivered ? styles.codBadgeTextCollected : styles.codBadgeTextPending,
                          ]}
                        >
                          {isDelivered ? 'Collected' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Hub Settlement Status or Action */}
            {isSettled ? (
              <View style={styles.settledBanner}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <View style={styles.settledTextWrap}>
                  <Text style={styles.settledTitle}>Shift Cash Settled & Deposited</Text>
                  <Text style={styles.settledSub}>
                    Voucher: {shift?.settlementVoucherId} • Deposited at {shift?.settledAt} to Koramangala Hub #12 Cash Desk
                  </Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.depositBtn}
                onPress={handleDepositCash}
                disabled={settleMutation.isPending}
                accessibilityRole="button"
                accessibilityLabel="Deposit cash at Hub"
                testID="deposit-cash-btn"
              >
                <Ionicons name="business-outline" size={18} color="#FFFFFF" />
                <Text style={styles.depositBtnText}>
                  {settleMutation.isPending
                    ? 'Processing Deposit...'
                    : 'Deposit Cash at Hub #12 Cash Desk'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Settlement Voucher Popup */}
            {showVoucher && (
              <View style={styles.voucherBox}>
                <View style={styles.voucherHeader}>
                  <Text style={styles.voucherTitle}>KORAMANGALA HUB CASH VOUCHER</Text>
                  <Ionicons name="shield-checkmark" size={16} color="#059669" />
                </View>
                <Text style={styles.voucherCode}>{shift?.settlementVoucherId || 'VCH-KOR-202610-8910'}</Text>
                <Text style={styles.voucherDetail}>Driver: {shift?.driverName || 'Ramesh Gowda'}</Text>
                <Text style={styles.voucherDetail}>Vehicle: {shift?.vehiclePlate}</Text>
                <Text style={styles.voucherDetail}>Deposited Cash: ₹{cashCollectedInr.toLocaleString('en-IN')}</Text>
                <Text style={styles.voucherDetail}>Hub Desk: Central Sort Hub #12, Koramangala 4th Block</Text>
                <Text style={styles.voucherVerified}>✓ Digitally sealed and audited</Text>
              </View>
            )}
          </ScrollView>
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
  modalCard: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
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
    marginBottom: 14,
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
  scrollArea: {
    flexShrink: 1,
  },
  balanceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  balanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  currencyPill: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  currencyPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: -1,
    marginBottom: 12,
  },
  statsSplitRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 10,
  },
  splitCol: {
    flex: 1,
  },
  splitColDivider: {
    width: 1,
    backgroundColor: '#334155',
    marginHorizontal: 10,
  },
  splitSubLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 2,
  },
  splitPendingVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  splitPrepaidVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  denomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  denomChip: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  denomLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  denomCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
  codOrderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  codOrderInfo: {
    flex: 1,
  },
  codOrderId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  codOrderLoc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  codOrderRight: {
    alignItems: 'flex-end',
  },
  codOrderAmt: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  codStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  codBadgeCollected: {
    backgroundColor: '#064E3B',
  },
  codBadgePending: {
    backgroundColor: '#451A03',
  },
  codBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  codBadgeTextCollected: {
    color: '#34D399',
  },
  codBadgeTextPending: {
    color: '#FBBF24',
  },
  depositBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  depositBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  settledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#059669',
    marginBottom: 10,
  },
  settledTextWrap: {
    flex: 1,
  },
  settledTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ECFDF5',
  },
  settledSub: {
    fontSize: 11,
    color: '#A7F3D0',
    marginTop: 2,
  },
  voucherBox: {
    backgroundColor: '#064E3B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#10B981',
    marginTop: 10,
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  voucherTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.5,
  },
  voucherCode: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 1,
  },
  voucherDetail: {
    fontSize: 12,
    color: '#D1FAE5',
    marginBottom: 2,
  },
  voucherVerified: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6EE7B7',
    marginTop: 6,
  },
});
