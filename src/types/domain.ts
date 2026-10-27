export type OrderStatus =
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'FAILED_ATTEMPT'
  | 'RETURNED_TO_HUB';

export type FailureReason =
  | 'CUSTOMER_UNAVAILABLE'
  | 'ACCESS_CODE_REQUIRED'
  | 'SAFETY_HAZARD'
  | 'DAMAGED_PACKAGE'
  | 'INCORRECT_ADDRESS'
  | 'BUSINESS_CLOSED';

export interface LocationCoordinate {
  lat: number;
  lng: number;
}

export interface AddressInfo extends LocationCoordinate {
  street: string;
  apt?: string;
  city: string;
  state: string;
  zip: string;
  name?: string;
}

export interface PackageSpecs {
  weightKg: number;
  dimensions: string; // e.g. "25x18x12 cm"
  instructions?: string;
  requiresSignature: boolean;
  isFragile: boolean;
  timeWindow: string; // e.g. "09:00 - 11:30 AM"
  category: 'ELECTRONICS' | 'PERISHABLE' | 'STANDARD' | 'DOCUMENTS' | 'OVERSIZED';
}

export interface StatusTimelineEntry {
  id: string;
  status: OrderStatus;
  timestamp: string;
  note?: string;
  location?: string;
  isSynced: boolean;
}

export interface Order {
  id: string; // e.g. "PP-9421-CA"
  trackingNumber: string;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: AddressInfo;
  hubAddress: AddressInfo;
  status: OrderStatus;
  packageDetails: PackageSpecs;
  timeline: StatusTimelineEntry[];
  failureReason?: FailureReason;
  failureNote?: string;
  signatureRequired: boolean;
  recipientSignature?: string;
  estimatedArrivalMin: number;
  distanceKm: number;
  currentStepIndex: number; // For route simulation progress
  hasPendingSync?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransitionEvent {
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  timestamp: string;
  failureReason?: FailureReason;
  failureNote?: string;
  recipientSignature?: string;
  driverLocation?: LocationCoordinate;
}

export interface OutboxItem {
  id: string;
  orderId: string;
  action: 'TRANSITION_STATUS';
  payload: TransitionEvent;
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'CONFIRMED';
  attempts: number;
  lastError?: string;
  queuedAt: string;
  syncedAt?: string;
}

export type NetworkMode = 'ONLINE' | 'OFFLINE' | 'FLAKY_500';

export interface DriverShift {
  driverId: string;
  driverName: string;
  vehiclePlate: string;
  activeShift: boolean;
  completedStops: number;
  totalStops: number;
  shiftStartTime: string;
}

