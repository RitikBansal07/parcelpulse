import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
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

  const isDelivered = order.status === 'DELIVERED';
  const etaMinutes = telemetry.etaMinutes;

  // Calculate approximate arrival clock time
  const arrivalDate = new Date(Date.now() + etaMinutes * 60 * 1000);
  const arrivalTimeStr = arrivalDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.card} testID="simulated-map-panel">
      {/* 1. Google Maps Navigation Header (Signature Green Bar) */}
      <View style={styles.navigationHeader}>
        <View style={styles.turnIconCircle}>
          <Ionicons
            name={
              isDelivered
                ? 'checkmark'
                : order.status === 'ARRIVED'
                ? 'pin'
                : 'arrow-redo-sharp'
            }
            size={24}
            color="#FFFFFF"
          />
        </View>

        <View style={styles.turnInfoCol}>
          <Text style={styles.turnDistanceText}>
            {isDelivered
              ? 'Destination Reached'
              : order.status === 'ARRIVED'
              ? 'Arrived at Destination'
              : order.status === 'EN_ROUTE'
              ? 'In 350 m'
              : 'Staging Hub'}
          </Text>
          <Text style={styles.turnStreetText} numberOfLines={1}>
            {isDelivered
              ? `Delivered to ${order.recipientName}`
              : order.status === 'ARRIVED'
              ? order.deliveryAddress.street
              : order.status === 'EN_ROUTE'
              ? `Turn right onto 100 Feet Rd towards ${order.deliveryAddress.locality || 'Dropoff'}`
              : `Depart Koramangala Hub Bay 3 on Tata Ace EV`}
          </Text>
        </View>

        <View style={styles.soundMuteBtn}>
          <Ionicons name="volume-medium" size={20} color="#FFFFFF" />
        </View>
      </View>

      {/* 2. Interactive Map (react-native-maps on Native / Google Maps Canvas on Web) */}
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
          height={210}
        />
      </View>

      {/* 3. Google Maps Bottom Navigation Bar (ETA, Distance, Arrival Clock) */}
      <View style={styles.navigationBottomBar}>
        <View style={styles.bottomLeftCol}>
          <View style={styles.etaRow}>
            <Text style={styles.etaMinutesText}>
              {isDelivered ? '0 min' : `${etaMinutes} min`}
            </Text>
            <View style={styles.trafficStatusBadge}>
              <View style={styles.trafficGreenDot} />
              <Text style={styles.trafficStatusText}>Live Traffic</Text>
            </View>
          </View>

          <View style={styles.routeStatsRow}>
            <Text style={styles.distanceStatsText}>{telemetry.remainingKm} km</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.arrivalClockText}>{arrivalTimeStr}</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.fastestRouteText}>Fastest route</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.openGoogleMapsBtn}
          onPress={() => {
            const lat = order.deliveryAddress.lat;
            const lng = order.deliveryAddress.lng;
            const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
            Linking.openURL(url);
          }}
          accessibilityRole="button"
          accessibilityLabel="Open in Google Maps"
          testID="open-google-maps-btn"
        >
          <Ionicons name="navigate" size={14} color="#FFFFFF" />
          <Text style={styles.openGoogleMapsText}>Maps App</Text>
          <Ionicons name="open-outline" size={12} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 4. Telemetry Step Sub-banner */}
      <View style={styles.telemetryFooter}>
        <Ionicons name="compass-outline" size={14} color="#1A73E8" />
        <Text style={styles.telemetryFooterText} numberOfLines={1}>
          {telemetry.stepDescription}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#DADCE0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  navigationHeader: {
    backgroundColor: '#0F9D58', // Google Maps Navigation Green
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  turnIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnInfoCol: {
    flex: 1,
  },
  turnDistanceText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  turnStreetText: {
    fontSize: 12,
    color: '#E6F4EA',
    marginTop: 2,
    fontWeight: '600',
  },
  soundMuteBtn: {
    padding: 6,
  },
  mapContainer: {
    backgroundColor: '#F4F3F0',
  },
  navigationBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F3F4',
  },
  bottomLeftCol: {
    flex: 1,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  etaMinutesText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#188038', // Google Maps Signature Green
    letterSpacing: -0.5,
  },
  trafficStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },
  trafficGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#188038',
  },
  trafficStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#137333',
  },
  routeStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distanceStatsText: {
    fontSize: 13,
    color: '#5F6368',
    fontWeight: '700',
  },
  arrivalClockText: {
    fontSize: 13,
    color: '#5F6368',
    fontWeight: '600',
  },
  fastestRouteText: {
    fontSize: 12,
    color: '#1A73E8',
    fontWeight: '600',
  },
  dotSeparator: {
    fontSize: 11,
    color: '#BDC1C6',
  },
  openGoogleMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A73E8', // Google Blue
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginLeft: 8,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  openGoogleMapsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F3F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  telemetryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#ECEFF1',
    gap: 6,
  },
  telemetryFooterText: {
    fontSize: 12,
    color: '#5F6368',
    fontWeight: '600',
  },
});

export default SimulatedMapPanel;
