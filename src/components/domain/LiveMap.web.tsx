import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationCoordinate, OrderStatus } from '../../types/domain';
import { projectToSvg } from '../../domain/routeSimulator';
import Svg, {
  Rect,
  Line,
  Circle,
  Polyline,
  Path,
  Text as SvgText,
  G,
  Defs,
  LinearGradient,
  Stop,
  Filter,
  FeDropShadow,
} from 'react-native-svg';

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
  const [satelliteMode, setSatelliteMode] = useState(false);

  const bounds = {
    minLat: Math.min(hubCoord.lat, dropoffCoord.lat) - 0.009,
    maxLat: Math.max(hubCoord.lat, dropoffCoord.lat) + 0.009,
    minLng: Math.min(hubCoord.lng, dropoffCoord.lng) - 0.009,
    maxLng: Math.max(hubCoord.lng, dropoffCoord.lng) + 0.009,
  };

  const svgWidth = 360;
  const svgHeight = height;

  const hubSvg = projectToSvg(hubCoord, bounds, svgWidth, svgHeight, 38);
  const dropoffSvg = projectToSvg(dropoffCoord, bounds, svgWidth, svgHeight, 38);
  const driverSvg = projectToSvg(driverCoord, bounds, svgWidth, svgHeight, 38);

  const waypointSvg = { x: hubSvg.x, y: dropoffSvg.y };

  const isDelivered = orderStatus === 'DELIVERED';

  return (
    <View style={[styles.container, { height }]} testID="react-native-maps-web-fallback">
      {/* SVG Canvas Styled Exactly Like Google Maps */}
      <Svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        <Defs>
          {/* Google Maps Route Gradient */}
          <LinearGradient id="gmapRouteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#4285F4" />
            <Stop offset="100%" stopColor="#1A73E8" />
          </LinearGradient>
        </Defs>

        {/* 1. Base Landmass Background */}
        <Rect
          x="0"
          y="0"
          width={svgWidth}
          height={svgHeight}
          fill={satelliteMode ? '#2B3A42' : '#F4F3F0'}
          rx={10}
        />

        {/* 2. Natural Features: Bengaluru Waterbodies (Bellandur / Agara Lake) */}
        {!satelliteMode && (
          <>
            {/* Bellandur / Agara Lake contour */}
            <Path
              d={`M ${svgWidth - 90} 25 Q ${svgWidth - 40} 40 ${svgWidth - 20} 95 Q ${svgWidth - 60} 130 ${svgWidth - 110} 100 Q ${svgWidth - 130} 50 ${svgWidth - 90} 25 Z`}
              fill="#AADAFF"
              opacity={0.85}
            />
            <SvgText
              x={svgWidth - 75}
              y={70}
              fill="#5B93C7"
              fontSize="9"
              fontFamily="sans-serif"
              fontStyle="italic"
              fontWeight="600"
            >
              Agara Lake
            </SvgText>

            {/* Urban Parks (Koramangala 3rd Block Park, HSR BDA Sector Park) */}
            <Rect x="20" y="30" width="60" height="40" rx={6} fill="#D5ECD4" />
            <SvgText x="50" y="54" fill="#6DA368" fontSize="8" fontWeight="600" textAnchor="middle">
              BDA Park
            </SvgText>

            <Rect x="22" y={svgHeight - 65} width="70" height="35" rx={6} fill="#D5ECD4" />
            <SvgText x="57" y={svgHeight - 44} fill="#6DA368" fontSize="8" fontWeight="600" textAnchor="middle">
              Cubbon Greens
            </SvgText>
          </>
        )}

        {/* 3. Secondary Local Streets (Google Maps Light Gray / White Grid) */}
        <Line x1="0" y1="45" x2={svgWidth} y2="45" stroke="#FFFFFF" strokeWidth="6" />
        <Line x1="0" y1="45" x2={svgWidth} y2="45" stroke="#E2E2DE" strokeWidth="1" />

        <Line x1="0" y1="95" x2={svgWidth} y2="95" stroke="#FFFFFF" strokeWidth="6" />
        <Line x1="0" y1="95" x2={svgWidth} y2="95" stroke="#E2E2DE" strokeWidth="1" />

        <Line x1="0" y1="150" x2={svgWidth} y2="150" stroke="#FFFFFF" strokeWidth="6" />
        <Line x1="0" y1="150" x2={svgWidth} y2="150" stroke="#E2E2DE" strokeWidth="1" />

        <Line x1="0" y1="195" x2={svgWidth} y2="195" stroke="#FFFFFF" strokeWidth="6" />
        <Line x1="0" y1="195" x2={svgWidth} y2="195" stroke="#E2E2DE" strokeWidth="1" />

        <Line x1="80" y1="0" x2="80" y2={svgHeight} stroke="#FFFFFF" strokeWidth="6" />
        <Line x1="80" y1="0" x2="80" y2={svgHeight} stroke="#E2E2DE" strokeWidth="1" />

        <Line x1="165" y1="0" x2="165" y2={svgHeight} stroke="#FFFFFF" strokeWidth="6" />
        <Line x1="165" y1="0" x2="165" y2={svgHeight} stroke="#E2E2DE" strokeWidth="1" />

        <Line x1="250" y1="0" x2="250" y2={svgHeight} stroke="#FFFFFF" strokeWidth="6" />
        <Line x1="250" y1="0" x2="250" y2={svgHeight} stroke="#E2E2DE" strokeWidth="1" />

        {/* 4. Major Arterial Road (Google Maps Signature Yellow/Orange Highway) */}
        {/* Outer Ring Road (ORR) Highway */}
        <Line x1="0" y1="120" x2={svgWidth} y2="120" stroke="#FDE293" strokeWidth="10" />
        <Line x1="0" y1="120" x2={svgWidth} y2="120" stroke="#F9AB00" strokeWidth="1" />

        <Line x1="125" y1="0" x2="125" y2={svgHeight} stroke="#FDE293" strokeWidth="9" />
        <Line x1="125" y1="0" x2="125" y2={svgHeight} stroke="#F9AB00" strokeWidth="1" />

        {/* Google Maps Street Labels */}
        <SvgText x="10" y="116" fill="#70757A" fontSize="8" fontWeight="bold">
          Outer Ring Road (ORR)
        </SvgText>
        <SvgText
          x="129"
          y="35"
          fill="#70757A"
          fontSize="8"
          fontWeight="bold"
          transform="rotate(90 129 35)"
        >
          100 Feet Rd (Indiranagar)
        </SvgText>

        {/* 5. Live Traffic Indicators (Google Maps Green / Amber / Red Flow) */}
        {trafficEnabled && (
          <>
            {/* Free flow green on main arterial */}
            <Line x1="0" y1="120" x2={110} y2="120" stroke="#34A853" strokeWidth="3" opacity={0.8} />
            {/* Moderate yellow traffic near junction */}
            <Line x1="110" y1="120" x2={150} y2="120" stroke="#FBBC04" strokeWidth="3.5" opacity={0.9} />
            {/* Silk Board / Domlur bottleneck red strip */}
            <Line x1="150" y1="120" x2={185} y2="120" stroke="#EA4335" strokeWidth="3.5" opacity={0.9} />
            {/* Free flow green beyond */}
            <Line x1="185" y1="120" x2={svgWidth} y2="120" stroke="#34A853" strokeWidth="3" opacity={0.8} />
          </>
        )}

        {/* 6. Base Route Geometry Polyline */}
        {/* Gray alternative / full scheduled path */}
        <Polyline
          points={`${hubSvg.x},${hubSvg.y} ${waypointSvg.x},${waypointSvg.y} ${dropoffSvg.x},${dropoffSvg.y}`}
          fill="none"
          stroke="#BDC1C6"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 7. Active Navigation Route in Google Maps Electric Blue */}
        {!isDelivered && (
          <>
            {/* Outer border for high contrast against landmass */}
            <Polyline
              points={`${driverSvg.x},${driverSvg.y} ${waypointSvg.x},${waypointSvg.y} ${dropoffSvg.x},${dropoffSvg.y}`}
              fill="none"
              stroke="#1A73E8"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner vibrant line */}
            <Polyline
              points={`${driverSvg.x},${driverSvg.y} ${waypointSvg.x},${waypointSvg.y} ${dropoffSvg.x},${dropoffSvg.y}`}
              fill="none"
              stroke="url(#gmapRouteGrad)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* 8. Hub Origin Marker (Google Maps Logistics Depot Gray Pin) */}
        <G>
          {/* Shadow */}
          <Circle cx={hubSvg.x} cy={hubSvg.y + 2} r="10" fill="rgba(0,0,0,0.18)" />
          {/* Outer circle */}
          <Circle cx={hubSvg.x} cy={hubSvg.y} r="9" fill="#5F6368" />
          <Circle cx={hubSvg.x} cy={hubSvg.y} r="4" fill="#FFFFFF" />
          {/* Label tooltip card */}
          <Rect
            x={hubSvg.x - 48}
            y={hubSvg.y + 11}
            width="96"
            height="18"
            rx="4"
            fill="#FFFFFF"
            stroke="#DADCE0"
            strokeWidth="1"
          />
          <SvgText
            x={hubSvg.x}
            y={hubSvg.y + 23}
            fill="#3C4043"
            fontSize="9"
            fontWeight="bold"
            textAnchor="middle"
          >
            Hub Koramangala
          </SvgText>
        </G>

        {/* 9. Destination Dropoff Marker: Iconic Google Maps Red Teardrop Pin */}
        <G>
          {/* Pin shadow on ground */}
          <Circle cx={dropoffSvg.x} cy={dropoffSvg.y} r="5" fill="rgba(0,0,0,0.25)" />
          {/* Google Red Pin Body */}
          <Path
            d={`M ${dropoffSvg.x} ${dropoffSvg.y} C ${dropoffSvg.x - 8} ${dropoffSvg.y - 10} ${
              dropoffSvg.x - 12
            } ${dropoffSvg.y - 18} ${dropoffSvg.x - 12} ${dropoffSvg.y - 24} C ${dropoffSvg.x - 12} ${
              dropoffSvg.y - 32
            } ${dropoffSvg.x - 6} ${dropoffSvg.y - 37} ${dropoffSvg.x} ${dropoffSvg.y - 37} C ${
              dropoffSvg.x + 6
            } ${dropoffSvg.y - 37} ${dropoffSvg.x + 12} ${dropoffSvg.y - 32} ${dropoffSvg.x + 12} ${
              dropoffSvg.y - 24
            } C ${dropoffSvg.x + 12} ${dropoffSvg.y - 18} ${dropoffSvg.x + 8} ${dropoffSvg.y - 10} ${
              dropoffSvg.x
            } ${dropoffSvg.y} Z`}
            fill="#EA4335"
          />
          {/* Center white dot */}
          <Circle cx={dropoffSvg.x} cy={dropoffSvg.y - 24} r="4.5" fill="#FFFFFF" />
          {/* Dropoff recipient label bubble */}
          <Rect
            x={dropoffSvg.x - 52}
            y={dropoffSvg.y - 56}
            width="104"
            height="18"
            rx="4"
            fill="#FFFFFF"
            stroke="#DADCE0"
            strokeWidth="1"
          />
          <SvgText
            x={dropoffSvg.x}
            y={dropoffSvg.y - 44}
            fill="#202124"
            fontSize="9"
            fontWeight="bold"
            textAnchor="middle"
          >
            {dropoffName.slice(0, 16)}
          </SvgText>
        </G>

        {/* 10. Driver Vehicle Marker: Iconic Google Maps Blue Navigation Puck */}
        {!isDelivered && (
          <G>
            {/* Accuracy / GPS radar ripple circle */}
            <Circle
              cx={driverSvg.x}
              cy={driverSvg.y}
              r="18"
              fill="rgba(66, 133, 244, 0.22)"
              stroke="rgba(66, 133, 244, 0.45)"
              strokeWidth="1"
            />
            {/* Outer white ring */}
            <Circle cx={driverSvg.x} cy={driverSvg.y} r="10" fill="#FFFFFF" />
            {/* Inner Google Blue puck */}
            <Circle cx={driverSvg.x} cy={driverSvg.y} r="7.5" fill="#4285F4" />
            {/* Navigation arrow triangle (heading towards destination) */}
            <Path
              d={`M ${driverSvg.x} ${driverSvg.y - 4} L ${driverSvg.x + 3} ${driverSvg.y + 3} L ${
                driverSvg.x
              } ${driverSvg.y + 1} L ${driverSvg.x - 3} ${driverSvg.y + 3} Z`}
              fill="#FFFFFF"
            />
            {/* Vehicle identifier tag */}
            <Rect
              x={driverSvg.x - 38}
              y={driverSvg.y + 12}
              width="76"
              height="16"
              rx="4"
              fill="#1A73E8"
            />
            <SvgText
              x={driverSvg.x}
              y={driverSvg.y + 24}
              fill="#FFFFFF"
              fontSize="8"
              fontWeight="bold"
              textAnchor="middle"
            >
              {vehicleName}
            </SvgText>
          </G>
        )}

        {/* Google Maps Watermark Logo */}
        <G>
          <Rect x="8" y={svgHeight - 22} width="48" height="15" rx="3" fill="rgba(255,255,255,0.85)" />
          <SvgText x="14" y={svgHeight - 11} fill="#5F6368" fontSize="9" fontWeight="bold">
            Google
          </SvgText>
        </G>
      </Svg>

      {/* Floating Google Maps Overlay Controls */}
      <View style={styles.floatingControls}>
        {/* Layer / Traffic Toggle */}
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

        {/* Re-center / Compass Button */}
        <TouchableOpacity
          style={styles.floatingBtn}
          onPress={() => {}}
          accessibilityRole="button"
          accessibilityLabel="Re-center map on vehicle"
        >
          <Ionicons name="locate" size={17} color="#1A73E8" />
        </TouchableOpacity>
      </View>

      {/* Floating Speed & Status Badge */}
      <View style={styles.speedPill}>
        <Text style={styles.speedPillText}>38 km/h</Text>
        <Text style={styles.speedSub}>Tata Ace EV</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#DADCE0',
    backgroundColor: '#F4F3F0',
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
  speedPill: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  speedPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#202124',
  },
  speedSub: {
    fontSize: 8,
    color: '#5F6368',
    fontWeight: '600',
  },
});

export default LiveMap;
