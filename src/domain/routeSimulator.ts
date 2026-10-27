import { OrderStatus, LocationCoordinate } from '../types/domain';

export interface RouteProgress {
  progressPercentage: number;
  driverLocation: LocationCoordinate;
  etaMinutes: number;
  remainingKm: number;
  stepDescription: string;
}

/**
 * Calculates deterministic route telemetry based on delivery order status.
 * Provides key-free vector route mapping coordinates and step metrics.
 */
export function calculateRouteProgress(
  hubCoord: LocationCoordinate,
  dropoffCoord: LocationCoordinate,
  status: OrderStatus,
  baseDistanceKm: number = 6.4
): RouteProgress {
  let progressRatio = 0;
  let etaMinutes = 0;
  let stepDescription = '';

  switch (status) {
    case 'ASSIGNED':
      progressRatio = 0.05;
      etaMinutes = 25;
      stepDescription = 'Staged at Koramangala Hub • Loading Bay 3';
      break;
    case 'PICKED_UP':
      progressRatio = 0.15;
      etaMinutes = 20;
      stepDescription = 'Loaded on Tata Ace EV • Departing Koramangala Hub';
      break;
    case 'EN_ROUTE':
      progressRatio = 0.60;
      etaMinutes = 10;
      stepDescription = 'Driver in transit • Approaching delivery locality';
      break;
    case 'ARRIVED':
      progressRatio = 0.95;
      etaMinutes = 2;
      stepDescription = 'Arrived at society gate / building entrance';
      break;
    case 'DELIVERED':
      progressRatio = 1.0;
      etaMinutes = 0;
      stepDescription = 'Completed • Handed over & OTP/Signature verified';
      break;
    case 'FAILED_ATTEMPT':
      progressRatio = 0.95;
      etaMinutes = 0;
      stepDescription = 'Exception recorded • Awaiting re-route or Hub return';
      break;
    case 'RETURNED_TO_HUB':
      progressRatio = 0.0;
      etaMinutes = 0;
      stepDescription = 'Returned to Koramangala Hub • Re-checked into inventory';
      break;
    default:
      progressRatio = 0;
      etaMinutes = 30;
      stepDescription = 'Standby';
  }

  // Linear interpolation for driver coordinates
  const currentLat = hubCoord.lat + (dropoffCoord.lat - hubCoord.lat) * progressRatio;
  const currentLng = hubCoord.lng + (dropoffCoord.lng - hubCoord.lng) * progressRatio;
  const remainingKm = Math.max(0, parseFloat((baseDistanceKm * (1 - progressRatio)).toFixed(1)));

  return {
    progressPercentage: Math.round(progressRatio * 100),
    driverLocation: {
      lat: parseFloat(currentLat.toFixed(5)),
      lng: parseFloat(currentLng.toFixed(5)),
    },
    etaMinutes,
    remainingKm,
    stepDescription,
  };
}

/**
 * Normalizes latitude and longitude coordinates to an SVG viewBox (0..300, 0..180).
 */
export function projectToSvg(
  coord: LocationCoordinate,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  svgWidth: number = 320,
  svgHeight: number = 200,
  padding: number = 30
): { x: number; y: number } {
  const latSpan = bounds.maxLat - bounds.minLat || 0.001;
  const lngSpan = bounds.maxLng - bounds.minLng || 0.001;

  const innerWidth = svgWidth - padding * 2;
  const innerHeight = svgHeight - padding * 2;

  // Invert Y because SVG coordinates have (0,0) at top-left
  const x = padding + ((coord.lng - bounds.minLng) / lngSpan) * innerWidth;
  const y = padding + (1 - (coord.lat - bounds.minLat) / latSpan) * innerHeight;

  return { x: Math.round(x), y: Math.round(y) };
}

