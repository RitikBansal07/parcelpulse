import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Circle, Polyline, Text as SvgText, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../../types/domain';
import { calculateRouteProgress, projectToSvg } from '../../domain/routeSimulator';

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

  // Compute bounding box around hub and dropoff coordinates
  const bounds = {
    minLat: Math.min(order.hubAddress.lat, order.deliveryAddress.lat) - 0.005,
    maxLat: Math.max(order.hubAddress.lat, order.deliveryAddress.lat) + 0.005,
    minLng: Math.min(order.hubAddress.lng, order.deliveryAddress.lng) - 0.005,
    maxLng: Math.max(order.hubAddress.lng, order.deliveryAddress.lng) + 0.005,
  };

  const svgWidth = 340;
  const svgHeight = 180;

  const hubSvg = projectToSvg(order.hubAddress, bounds, svgWidth, svgHeight);
  const dropoffSvg = projectToSvg(order.deliveryAddress, bounds, svgWidth, svgHeight);
  const driverSvg = projectToSvg(telemetry.driverLocation, bounds, svgWidth, svgHeight);

  // Intermediate waypoint coordinate for realistic street grid turn
  const waypointSvg = { x: hubSvg.x, y: dropoffSvg.y };

  return (
    <View style={styles.card} testID="simulated-map-panel">
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="navigate-circle-outline" size={18} color="#0284C7" />
          <Text style={styles.headerTitle}>Simulated Route Telemetry</Text>
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

      <View style={styles.svgContainer}>
        <Svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
          {/* Street grid background lines */}
          <Rect x="0" y="0" width={svgWidth} height={svgHeight} fill="#0F172A" rx={8} />

          {/* Grid lines simulating city blocks */}
          <Line x1="0" y1="45" x2={svgWidth} y2="45" stroke="#1E293B" strokeWidth="1" />
          <Line x1="0" y1="90" x2={svgWidth} y2="90" stroke="#1E293B" strokeWidth="1" />
          <Line x1="0" y1="135" x2={svgWidth} y2="135" stroke="#1E293B" strokeWidth="1" />
          <Line x1="85" y1="0" x2="85" y2={svgHeight} stroke="#1E293B" strokeWidth="1" />
          <Line x1="170" y1="0" x2="170" y2={svgHeight} stroke="#1E293B" strokeWidth="1" />
          <Line x1="255" y1="0" x2="255" y2={svgHeight} stroke="#1E293B" strokeWidth="1" />

          {/* Base Route Polyline */}
          <Polyline
            points={`${hubSvg.x},${hubSvg.y} ${waypointSvg.x},${waypointSvg.y} ${dropoffSvg.x},${dropoffSvg.y}`}
            fill="none"
            stroke="#334155"
            strokeWidth="4"
            strokeDasharray="4,4"
          />

          {/* Completed portion highlight */}
          <Polyline
            points={`${hubSvg.x},${hubSvg.y} ${driverSvg.x},${driverSvg.y}`}
            fill="none"
            stroke="#0284C7"
            strokeWidth="4"
          />

          {/* Hub Pin */}
          <G>
            <Circle cx={hubSvg.x} cy={hubSvg.y} r="8" fill="#64748B" />
            <Circle cx={hubSvg.x} cy={hubSvg.y} r="4" fill="#FFFFFF" />
            <SvgText
              x={hubSvg.x}
              y={hubSvg.y + 18}
              fill="#94A3B8"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
            >
              Hub
            </SvgText>
          </G>

          {/* Customer Dropoff Pin */}
          <G>
            <Circle cx={dropoffSvg.x} cy={dropoffSvg.y} r="9" fill="#10B981" />
            <Circle cx={dropoffSvg.x} cy={dropoffSvg.y} r="4" fill="#FFFFFF" />
            <SvgText
              x={dropoffSvg.x}
              y={dropoffSvg.y - 12}
              fill="#10B981"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
            >
              Dropoff
            </SvgText>
          </G>

          {/* Driver Vehicle Location Pin */}
          {order.status !== 'DELIVERED' && order.status !== 'RETURNED_TO_HUB' && (
            <G>
              <Circle cx={driverSvg.x} cy={driverSvg.y} r="12" fill="rgba(56, 189, 248, 0.25)" />
              <Circle cx={driverSvg.x} cy={driverSvg.y} r="7" fill="#0284C7" />
              <Circle cx={driverSvg.x} cy={driverSvg.y} r="3" fill="#FFFFFF" />
              <SvgText
                x={driverSvg.x}
                y={driverSvg.y + 18}
                fill="#38BDF8"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
              >
                Van #14
              </SvgText>
            </G>
          )}
        </Svg>
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
          <Text style={styles.telemetryLabel}>Status Note</Text>
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
  svgContainer: {
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

