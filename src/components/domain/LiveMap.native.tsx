import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
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
  height = 200,
}) => {
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

  return (
    <View style={[styles.container, { height }]} testID="react-native-maps-view">
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        }}
      >
        {/* Koramangala Hub Marker */}
        <Marker
          coordinate={{ latitude: hubCoord.lat, longitude: hubCoord.lng }}
          title={hubName}
          description="Logistics Sort Facility"
          pinColor="#64748B"
        />

        {/* Customer Dropoff Marker */}
        <Marker
          coordinate={{ latitude: dropoffCoord.lat, longitude: dropoffCoord.lng }}
          title={dropoffName}
          description="Destination Address"
          pinColor="#10B981"
        />

        {/* Driver Tata Ace EV Marker */}
        {orderStatus !== 'DELIVERED' && orderStatus !== 'RETURNED_TO_HUB' && (
          <Marker
            coordinate={{ latitude: driverCoord.lat, longitude: driverCoord.lng }}
            title={vehicleName}
            description="Driver in Transit"
            pinColor="#0284C7"
          />
        )}

        {/* Route Polyline */}
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="#0284C7"
          strokeWidth={4}
          lineDashPattern={[2, 2]}
        />
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

export default LiveMap;
