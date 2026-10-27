import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LocationCoordinate, OrderStatus } from '../../types/domain';
import { projectToSvg } from '../../domain/routeSimulator';
import Svg, { Rect, Line, Circle, Polyline, Text as SvgText, G } from 'react-native-svg';

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
  const bounds = {
    minLat: Math.min(hubCoord.lat, dropoffCoord.lat) - 0.008,
    maxLat: Math.max(hubCoord.lat, dropoffCoord.lat) + 0.008,
    minLng: Math.min(hubCoord.lng, dropoffCoord.lng) - 0.008,
    maxLng: Math.max(hubCoord.lng, dropoffCoord.lng) + 0.008,
  };

  const svgWidth = 340;
  const svgHeight = height;

  const hubSvg = projectToSvg(hubCoord, bounds, svgWidth, svgHeight);
  const dropoffSvg = projectToSvg(dropoffCoord, bounds, svgWidth, svgHeight);
  const driverSvg = projectToSvg(driverCoord, bounds, svgWidth, svgHeight);

  const waypointSvg = { x: hubSvg.x, y: dropoffSvg.y };

  return (
    <View style={[styles.container, { height }]} testID="react-native-maps-web-fallback">
      <Svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        {/* Map Background with Indian Metro Grid */}
        <Rect x="0" y="0" width={svgWidth} height={svgHeight} fill="#0B132B" rx={8} />

        {/* Ring Road and Arterial Street Grid */}
        <Line x1="0" y1="50" x2={svgWidth} y2="50" stroke="#1C2541" strokeWidth="1.5" />
        <Line x1="0" y1="100" x2={svgWidth} y2="100" stroke="#1C2541" strokeWidth="1.5" />
        <Line x1="0" y1="150" x2={svgWidth} y2="150" stroke="#1C2541" strokeWidth="1.5" />
        <Line x1="90" y1="0" x2="90" y2={svgHeight} stroke="#1C2541" strokeWidth="1.5" />
        <Line x1="180" y1="0" x2="180" y2={svgHeight} stroke="#1C2541" strokeWidth="1.5" />
        <Line x1="270" y1="0" x2="270" y2={svgHeight} stroke="#1C2541" strokeWidth="1.5" />

        {/* Outer Ring Road Overlay Label */}
        <SvgText x="12" y="24" fill="#3A506B" fontSize="9" fontWeight="bold">
          BENGALURU LAST-MILE MAP ROUTE
        </SvgText>

        {/* Base Route Line */}
        <Polyline
          points={`${hubSvg.x},${hubSvg.y} ${waypointSvg.x},${waypointSvg.y} ${dropoffSvg.x},${dropoffSvg.y}`}
          fill="none"
          stroke="#475569"
          strokeWidth="3.5"
          strokeDasharray="5,5"
        />

        {/* Active Driver Route Progress */}
        <Polyline
          points={`${hubSvg.x},${hubSvg.y} ${driverSvg.x},${driverSvg.y}`}
          fill="none"
          stroke="#0284C7"
          strokeWidth="4"
        />

        {/* Koramangala Hub Pin */}
        <G>
          <Circle cx={hubSvg.x} cy={hubSvg.y} r="9" fill="#475569" />
          <Circle cx={hubSvg.x} cy={hubSvg.y} r="4" fill="#FFFFFF" />
          <SvgText
            x={hubSvg.x}
            y={hubSvg.y + 18}
            fill="#CBD5E1"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
          >
            Hub (Koramangala)
          </SvgText>
        </G>

        {/* Customer Destination Pin */}
        <G>
          <Circle cx={dropoffSvg.x} cy={dropoffSvg.y} r="10" fill="#10B981" />
          <Circle cx={dropoffSvg.x} cy={dropoffSvg.y} r="4" fill="#FFFFFF" />
          <SvgText
            x={dropoffSvg.x}
            y={dropoffSvg.y - 12}
            fill="#10B981"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
          >
            {dropoffName.slice(0, 16)}
          </SvgText>
        </G>

        {/* Driver Tata Ace EV Pin */}
        {orderStatus !== 'DELIVERED' && orderStatus !== 'RETURNED_TO_HUB' && (
          <G>
            <Circle cx={driverSvg.x} cy={driverSvg.y} r="14" fill="rgba(2, 132, 199, 0.28)" />
            <Circle cx={driverSvg.x} cy={driverSvg.y} r="8" fill="#0284C7" />
            <Circle cx={driverSvg.x} cy={driverSvg.y} r="3" fill="#FFFFFF" />
            <SvgText
              x={driverSvg.x}
              y={driverSvg.y + 20}
              fill="#38BDF8"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
            >
              {vehicleName}
            </SvgText>
          </G>
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
  },
});

export default LiveMap;

