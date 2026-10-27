import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LocationCoordinate, OrderStatus } from '../../types/domain';

export interface LiveMapProps {
  hubCoord: LocationCoordinate;
  dropoffCoord: LocationCoordinate;
  driverCoord: LocationCoordinate;
  hubName: string;
  dropoffName: string;
  recipientName: string;
  vehicleName: string;
  orderStatus: OrderStatus;
  height?: number;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  hubCoord,
  dropoffCoord,
  driverCoord,
  hubName,
  dropoffName,
  vehicleName,
  orderStatus,
  height = 240,
}) => {
  const [trafficEnabled, setTrafficEnabled] = useState(true);

  // Center map between hub and dropoff
  const centerLat = (hubCoord.lat + dropoffCoord.lat) / 2;
  const centerLng = (hubCoord.lng + dropoffCoord.lng) / 2;
  const latDelta = Math.max(0.04, Math.abs(hubCoord.lat - dropoffCoord.lat) * 1.6);
  const lngDelta = Math.max(0.04, Math.abs(hubCoord.lng - dropoffCoord.lng) * 1.6);

  const routeCoordinates = [
    { latitude: hubCoord.lat, longitude: hubCoord.lng },
    { latitude: driverCoord.lat, longitude: driverCoord.lng },
    { latitude: dropoffCoord.lat, longitude: dropoffCoord.lng },
  ];

  const isDelivered = orderStatus === 'DELIVERED';

  return (
    <View style={[styles.container, { height }]} testID="react-native-maps-view">
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        showsTraffic={trafficEnabled}
        showsCompass={true}
        initialRegion={{
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        }}
      >
        {/* Koramangala Hub Depot Marker */}
        <Marker
          coordinate={{ latitude: hubCoord.lat, longitude: hubCoord.lng }}
          title={hubName}
          description="Logistics Sort Facility"
          pinColor="#5F6368"
        />

        {/* Customer Dropoff Marker (Google Red Pin) */}
        <Marker
          coordinate={{ latitude: dropoffCoord.lat, longitude: dropoffCoord.lng }}
          title={dropoffName}
          description="Customer Destination Address"
          pinColor="#EA4335"
        />

        {/* Driver Tata Ace EV Marker (Google Navigation Blue) */}
        {!isDelivered && orderStatus !== 'RETURNED_TO_HUB' && (
          <Marker
            coordinate={{ latitude: driverCoord.lat, longitude: driverCoord.lng }}
            title={vehicleName}
            description="Driver in Transit"
            pinColor="#1A73E8"
          />
        )}

        {/* Google Maps Route Polyline in Signature Blue */}
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="#1A73E8"
          strokeWidth={5}
        />
      </MapView>

      {/* Floating Google Maps Overlay Controls */}
      <View style={styles.floatingControls}>
        <TouchableOpacity
          style={[styles.floatingBtn, trafficEnabled && styles.floatingBtnActive]}
          onPress={() => setTrafficEnabled(!trafficEnabled)}
          accessibilityRole="button"
          accessibilityLabel="Toggle live traffic overlay"
        >
          <Ionicons
            name="layers"
            size={16}
            color={trafficEnabled ? '#1A73E8' : '#5F6368'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DADCE0',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  floatingControls: {
    position: 'absolute',
    top: 10,
    right: 10,
    gap: 8,
  },
  floatingBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingBtnActive: {
    backgroundColor: '#E8F0FE',
  },
});

export default LiveMap;
