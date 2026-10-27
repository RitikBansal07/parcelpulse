import { Order, OrderStatus, TransitionEvent, FailureReason } from '../types/domain';

/**
 * Strict Finite State Machine for parcel deliveries.
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
  { code: 'CUSTOMER_UNAVAILABLE', label: 'Customer Unavailable', description: 'Customer did not answer doorbell, intercom, or call.' },
  { code: 'ACCESS_CODE_REQUIRED', label: 'Access Code Required', description: 'Gated community or building requires access code not provided.' },
  { code: 'SAFETY_HAZARD', label: 'Safety Hazard / Dog', description: 'Unsecured aggressive animal or unsafe property access.' },
  { code: 'DAMAGED_PACKAGE', label: 'Damaged in Transit', description: 'Package seal broken or visible damage prior to dropoff.' },
  { code: 'INCORRECT_ADDRESS', label: 'Incorrect Address', description: 'Building number or apartment does not exist at destination.' },
  { code: 'BUSINESS_CLOSED', label: 'Business Closed', description: 'Commercial location was closed during attempted delivery window.' },
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
    note: event.failureNote || (event.failureReason ? `Attempt failed: ${event.failureReason}` : `Status updated to ${event.toStatus}`),
    location: event.toStatus === 'DELIVERED' ? `${currentOrder.deliveryAddress.street}` : undefined,
    isSynced: true,
  };

  return {
    ...currentOrder,
    status: event.toStatus,
    failureReason: event.failureReason || currentOrder.failureReason,
    failureNote: event.failureNote || currentOrder.failureNote,
    recipientSignature: event.recipientSignature || currentOrder.recipientSignature,
    timeline: [newTimelineEntry, ...currentOrder.timeline],
    hasPendingSync: false,
    updatedAt: new Date().toISOString(),
  };
}

