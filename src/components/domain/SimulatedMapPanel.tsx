import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../../types/domain';
import { calculateRouteProgress } from '../../domain/routeSimulator';
import { LiveMap } from './LiveMap';

interface SimulatedMapPanelProps {
  order: Order;
}

export const SimulatedMapPanel: React.FC<SimulatedMapPanelProps> = ({ order }) => {
  const telemetry = calculateRouteProgress(
    order.hubAddress,
    order.deliveryAddress,
    order.status,
    order.distanceKm
  );

  return (
    <View style={styles.card} testID="simulated-map-panel">
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="navigate-circle-outline" size={18} color="#0284C7" />
          <Text style={styles.headerTitle}>Live Map & Route Telemetry</Text>
        </View>
        <View style={styles.etaBadge}>
          <Text style={styles.etaText}>
            {order.status === 'DELIVERED'
              ? 'Delivered'
              : telemetry.etaMinutes > 0
              ? `ETA ~${telemetry.etaMinutes} min`
              : 'At Stop'}
          </Text>
        </View>
      </View>

      {/* Powered by react-native-maps on iOS/Android, with responsive web tile rendering */}
      <View style={styles.mapContainer}>
        <LiveMap
          hubCoord={order.hubAddress}
          dropoffCoord={order.deliveryAddress}
          driverCoord={telemetry.driverLocation}
          hubName="Bengaluru Koramangala Hub #12"
          dropoffName={order.deliveryAddress.locality || order.recipientName}
          recipientName={order.recipientName}
          vehicleName="Tata Ace EV"
          orderStatus={order.status}
          height={180}
        />
      </View>

      <View style={styles.footerRow}>
        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>Progress</Text>
          <Text style={styles.telemetryValue}>{telemetry.progressPercentage}%</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>Remaining</Text>
          <Text style={styles.telemetryValue}>{telemetry.remainingKm} km</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.telemetryItemWide}>
          <Text style={styles.telemetryLabel}>Operational Telemetry</Text>
          <Text style={styles.telemetryValue} numberOfLines={1}>
            {telemetry.stepDescription}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  etaBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  etaText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  mapContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  telemetryItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  telemetryItemWide: {
    flex: 1,
    paddingLeft: 8,
  },
  telemetryLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  telemetryValue: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },
});

export default SimulatedMapPanel;
