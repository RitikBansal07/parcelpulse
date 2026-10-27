import { Order, OrderStatus, TransitionEvent, FailureReason } from '../types/domain';

/**
 * Strict Finite State Machine for parcel deliveries (Indian Logistics Context).
 * Enforces one-way linear progression or approved recovery loops.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  ASSIGNED: ['PICKED_UP'],
  PICKED_UP: ['EN_ROUTE'],
  EN_ROUTE: ['ARRIVED'],
  ARRIVED: ['DELIVERED', 'FAILED_ATTEMPT'],
  FAILED_ATTEMPT: ['EN_ROUTE', 'RETURNED_TO_HUB'],
  DELIVERED: [], // Terminal
  RETURNED_TO_HUB: [], // Terminal
};

export const FAILURE_REASONS: { code: FailureReason; label: string; description: string }[] = [
  {
    code: 'CUSTOMER_UNAVAILABLE',
    label: 'Customer Phone Switched Off / No Answer',
    description: 'Driver rang doorbell and called customer multiple times; no response received.',
  },
  {
    code: 'ACCESS_CODE_REQUIRED',
    label: 'Gated Society Entry Denied (MyGate / NoBroker OTP)',
    description: 'Security guard at main gate refused entry without resident digital approval code.',
  },
  {
    code: 'SAFETY_HAZARD',
    label: 'Road Waterlogged / Stray Animal Hazard',
    description: 'Severe monsoon waterlogging or aggressive stray dogs blocked delivery alley.',
  },
  {
    code: 'DAMAGED_PACKAGE',
    label: 'Packaging Damaged / Tampered Seal',
    description: 'Outer carton crushed or brand security tape broken during transit.',
  },
  {
    code: 'INCORRECT_ADDRESS',
    label: 'Missing Landmark / Incomplete Address',
    description: 'House/flat number not marked clearly on building and pin location inaccurate.',
  },
  {
    code: 'BUSINESS_CLOSED',
    label: 'Commercial Office / Dukaan Closed',
    description: 'Commercial establishment or shop shutter down during delivery attempt.',
  },
];

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  const nextStates = ALLOWED_TRANSITIONS[from];
  return Array.isArray(nextStates) && nextStates.includes(to);
}

export function getAvailableTransitions(current: OrderStatus): OrderStatus[] {
  return ALLOWED_TRANSITIONS[current] || [];
}

export interface TransitionValidationResult {
  valid: boolean;
  error?: string;
}

export function validateTransition(
  event: TransitionEvent,
  currentOrder: Order
): TransitionValidationResult {
  if (event.fromStatus !== currentOrder.status) {
    return {
      valid: false,
      error: `Conflict: Order ${currentOrder.id} is currently in '${currentOrder.status}', not '${event.fromStatus}'.`,
    };
  }

  if (!canTransition(event.fromStatus, event.toStatus)) {
    return {
      valid: false,
      error: `Illegal transition: Cannot advance order from '${event.fromStatus}' to '${event.toStatus}'. Must follow operational chain.`,
    };
  }

  // Guard: If transitioning to FAILED_ATTEMPT, failure reason is required
  if (event.toStatus === 'FAILED_ATTEMPT' && !event.failureReason) {
    return {
      valid: false,
      error: 'A valid Failure Reason is strictly required when recording a failed delivery attempt.',
    };
  }

  // Guard: If signature required and transitioning to DELIVERED
  if (event.toStatus === 'DELIVERED' && currentOrder.packageDetails.requiresSignature && !event.recipientSignature) {
    return {
      valid: false,
      error: 'Proof of Delivery requires recipient signature for this restricted package.',
    };
  }

  return { valid: true };
}

export function applyTransition(currentOrder: Order, event: TransitionEvent): Order {
  const validation = validateTransition(event, currentOrder);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const newTimelineEntry = {
    id: `tl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    status: event.toStatus,
    timestamp: event.timestamp || new Date().toISOString(),
    note: event.failureNote || (event.failureReason ? `Exception: ${event.failureReason}` : `Status updated to ${event.toStatus}`),
    location: event.toStatus === 'DELIVERED' ? `${currentOrder.deliveryAddress.street}` : undefined,
    isSynced: true,
  };

  return {
    ...currentOrder,
    status: event.toStatus,
    failureReason: event.failureReason || currentOrder.failureReason,
    failureNote: event.failureNote || currentOrder.failureNote,
    recipientSignature: event.recipientSignature || currentOrder.recipientSignature,
    podPhotoUrl: event.podPhotoUrl || currentOrder.podPhotoUrl,
    podPhotoType: event.podPhotoType || currentOrder.podPhotoType,
    podPhotoTimestamp: event.podPhotoUrl ? event.timestamp : currentOrder.podPhotoTimestamp,
    verifiedOtp: event.verifiedOtp || currentOrder.verifiedOtp,
    timeline: [newTimelineEntry, ...currentOrder.timeline],
    hasPendingSync: false,
    updatedAt: new Date().toISOString(),
  };
}
