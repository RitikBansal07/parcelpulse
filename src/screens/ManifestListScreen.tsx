import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../types/navigation';
import { useOrdersQuery, useDriverShiftQuery } from '../api/queries';
import { Order, OrderStatus } from '../types/domain';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ActiveOrderBanner } from '../components/domain/ActiveOrderBanner';
import { NetworkControlBar } from '../components/domain/NetworkControlBar';
import { ScreenState } from '../components/ui/ScreenState';
import { mockApi } from '../api/mockApi';
import { useQueryClient } from '@tanstack/react-query';
import { BarcodeScannerModal } from '../components/domain/BarcodeScannerModal';
import { CodCashLedgerModal } from '../components/domain/CodCashLedgerModal';

type FilterType = 'ALL' | 'ACTIVE' | 'COMPLETED';

export const ManifestListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [scannerVisible, setScannerVisible] = useState(false);
  const [cashLedgerVisible, setCashLedgerVisible] = useState(false);

  const {
    data: orders = [],
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useOrdersQuery();

  const { data: shift } = useDriverShiftQuery();

  // Find currently active delivery (EN_ROUTE or ARRIVED)
  const activeOrder = orders.find(
    (o) => o.status === 'EN_ROUTE' || o.status === 'ARRIVED'
  );

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'ACTIVE') {
      return order.status !== 'DELIVERED' && order.status !== 'RETURNED_TO_HUB';
    }
    if (activeFilter === 'COMPLETED') {
      return order.status === 'DELIVERED' || order.status === 'RETURNED_TO_HUB';
    }
    return true;
  });

  const handleResetData = async () => {
    await mockApi.resetDemoData();
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['driverShift'] });
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
        accessibilityRole="button"
        accessibilityLabel={`Order ${item.id} for ${item.recipientName}, status ${item.status}`}
        testID={`order-card-${item.id}`}
      >
        <View style={styles.cardHeader}>
          <View style={styles.idWrap}>
            <Text style={styles.orderIdText}>{item.id}</Text>
            <Text style={styles.trackingSub}>{item.trackingNumber.slice(-8)}</Text>
          </View>
          <StatusBadge status={item.status} hasPendingSync={item.hasPendingSync} />
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.recipientTitle}>{item.recipientName}</Text>
          <Text style={styles.addressLine} numberOfLines={1}>
            {item.deliveryAddress.street}
          </Text>
          {item.deliveryAddress.locality ? (
            <Text style={styles.localityLine} numberOfLines={1}>
              📍 {item.deliveryAddress.locality}
              {item.deliveryAddress.landmark ? ` • Near ${item.deliveryAddress.landmark}` : ''}
            </Text>
          ) : null}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.tagRow}>
            {item.packageDetails.paymentMode === 'COD' ? (
              <View style={[styles.tag, styles.codTag]}>
                <Ionicons name="cash-outline" size={12} color="#B45309" />
                <Text style={[styles.tagText, styles.codTagText]}>
                  COD ₹{item.packageDetails.codAmountInr?.toLocaleString('en-IN')}
                </Text>
              </View>
            ) : (
              <View style={[styles.tag, styles.prepaidTag]}>
                <Ionicons name="shield-checkmark" size={11} color="#15803D" />
                <Text style={[styles.tagText, styles.prepaidTagText]}>Prepaid</Text>
              </View>
            )}

            <View style={styles.tag}>
              <Ionicons name="time-outline" size={12} color="#64748B" />
              <Text style={styles.tagText}>{item.packageDetails.timeWindow}</Text>
            </View>

            {item.packageDetails.requiresSignature && (
              <View style={[styles.tag, styles.sigTag]}>
                <Ionicons name="pencil" size={11} color="#0369A1" />
                <Text style={[styles.tagText, styles.sigTagText]}>Signature</Text>
              </View>
            )}
          </View>

          <View style={styles.distanceWrap}>
            <Text style={styles.distanceText}>{item.distanceKm} km</Text>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <NetworkControlBar onOpenOutbox={() => navigation.navigate('OutboxInspector')} />

      {/* Driver Shift Summary Bar */}
      <View style={styles.shiftBar}>
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>
            {shift?.driverName || 'Ramesh Gowda'}
          </Text>
          <Text style={styles.vanDetails}>
            {shift?.vehiclePlate || 'KA 01 EK 4921 (Tata Ace EV)'} • Shift: {shift?.shiftStartTime || '08:30 AM'}
          </Text>
        </View>

        <View style={styles.stopsBadge}>
          <Text style={styles.stopsCount}>
            {shift?.completedStops || 0} / {shift?.totalStops || orders.length}
          </Text>
          <Text style={styles.stopsLabel}>STOPS DONE</Text>
        </View>
      </View>

      {/* Driver Quick Actions: Barcode Scanner & COD Cash Bag */}
      <View style={styles.quickActionBar}>
        <TouchableOpacity
          style={styles.scannerActionBtn}
          onPress={() => setScannerVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Scan Waybill Barcode or QR"
          testID="open-scanner-btn"
        >
          <Ionicons name="barcode-outline" size={17} color="#FFFFFF" />
          <Text style={styles.scannerActionText}>Scan Waybill</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cashBagActionBtn}
          onPress={() => setCashLedgerVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Open COD Cash Ledger"
          testID="open-cash-bag-btn"
        >
          <Ionicons name="cash" size={17} color="#10B981" />
          <Text style={styles.cashBagActionText}>
            Cash Bag: ₹{(shift?.cashInBagInr || 1250).toLocaleString('en-IN')}
          </Text>
          <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Active Delivery Highlight Banner */}
      {activeOrder && activeFilter !== 'COMPLETED' && (
        <ActiveOrderBanner
          activeOrder={activeOrder}
          onPress={(order) => navigation.navigate('OrderDetail', { orderId: order.id })}
        />
      )}

      {/* Manifest Filter Tabs */}
      <View style={styles.filterRow}>
        {(['ALL', 'ACTIVE', 'COMPLETED'] as FilterType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab)}
            testID={`filter-tab-${tab}`}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === tab && styles.filterTabTextActive,
              ]}
            >
              {tab === 'ALL'
                ? `All (${orders.length})`
                : tab === 'ACTIVE'
                ? `Active (${orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'RETURNED_TO_HUB').length})`
                : `Done (${orders.filter((o) => o.status === 'DELIVERED' || o.status === 'RETURNED_TO_HUB').length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Manifest Order List */}
      <ScreenState
        loading={isLoading}
        error={error ? (error as Error).message : null}
        empty={filteredOrders.length === 0}
        emptyTitle="No Orders in Filter"
        emptyMessage="There are currently no deliveries matching this status filter."
        onRetry={refetch}
      >
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
              }}
              colors={['#0284C7']}
            />
          }
          ListFooterComponent={
            <View style={styles.footerWrap}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleResetData}
                testID="reset-demo-manifest-btn"
              >
                <Ionicons name="refresh-circle-outline" size={16} color="#64748B" />
                <Text style={styles.resetText}>Reset Demo Manifest Data</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </ScreenState>

      {/* Barcode & QR Scanner Viewfinder Modal */}
      <BarcodeScannerModal
        visible={scannerVisible}
        orders={orders}
        onClose={() => setScannerVisible(false)}
        onScanSuccess={(scannedId) => {
          navigation.navigate('OrderDetail', { orderId: scannedId });
        }}
      />

      {/* COD Cash Bag Ledger & Shift Settlement Modal */}
      <CodCashLedgerModal
        visible={cashLedgerVisible}
        orders={orders}
        shift={shift}
        onClose={() => setCashLedgerVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  shiftBar: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  vanDetails: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  stopsBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  stopsCount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38BDF8',
  },
  stopsLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 1,
  },
  quickActionBar: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  scannerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  scannerActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cashBagActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cashBagActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34D399',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#0284C7',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  idWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  trackingSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  cardBody: {
    marginBottom: 10,
  },
  recipientTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  addressLine: {
    fontSize: 13,
    color: '#64748B',
  },
  localityLine: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  sigTag: {
    backgroundColor: '#E0F2FE',
  },
  codTag: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  codTagText: {
    color: '#B45309',
    fontWeight: '700',
  },
  prepaidTag: {
    backgroundColor: '#DCFCE7',
  },
  prepaidTagText: {
    color: '#15803D',
    fontWeight: '700',
  },
  fragileTag: {
    backgroundColor: '#FEF3C7',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  sigTagText: {
    color: '#0369A1',
  },
  fragileTagText: {
    color: '#92400E',
  },
  distanceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  footerWrap: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 30,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  resetText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
});
