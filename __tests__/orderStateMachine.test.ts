import {
  canTransition,
  getAvailableTransitions,
  validateTransition,
  applyTransition,
} from '../src/domain/orderStateMachine';
import { Order, TransitionEvent } from '../src/types/domain';
import { CENTRAL_HUB } from '../src/api/mockSeedData';

describe('Order State Machine', () => {
  const createMockOrder = (status: Order['status'], requiresSignature = false): Order => ({
    id: 'PP-TEST-1',
    trackingNumber: '1Z9999999999',
    recipientName: 'Test Recipient',
    recipientPhone: '+1-555-0100',
    hubAddress: CENTRAL_HUB,
    deliveryAddress: {
      street: '123 Test St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94103',
      lat: 37.77,
      lng: -122.41,
    },
    status,
    packageDetails: {
      weightKg: 2.0,
      dimensions: '20x20x10',
      requiresSignature,
      isFragile: false,
      timeWindow: '09:00 - 11:00 AM',
      category: 'STANDARD',
    },
    timeline: [],
    signatureRequired: requiresSignature,
    estimatedArrivalMin: 15,
    distanceKm: 3.5,
    currentStepIndex: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  describe('canTransition & getAvailableTransitions', () => {
    it('allows valid linear lifecycle transitions', () => {
      expect(canTransition('ASSIGNED', 'PICKED_UP')).toBe(true);
      expect(canTransition('PICKED_UP', 'EN_ROUTE')).toBe(true);
      expect(canTransition('EN_ROUTE', 'ARRIVED')).toBe(true);
      expect(canTransition('ARRIVED', 'DELIVERED')).toBe(true);
      expect(canTransition('ARRIVED', 'FAILED_ATTEMPT')).toBe(true);
      expect(canTransition('FAILED_ATTEMPT', 'RETURNED_TO_HUB')).toBe(true);
      expect(canTransition('FAILED_ATTEMPT', 'EN_ROUTE')).toBe(true);
    });

    it('rejects skipping states (e.g. ASSIGNED directly to DELIVERED)', () => {
      expect(canTransition('ASSIGNED', 'DELIVERED')).toBe(false);
      expect(canTransition('ASSIGNED', 'EN_ROUTE')).toBe(false);
      expect(canTransition('PICKED_UP', 'DELIVERED')).toBe(false);
      expect(canTransition('EN_ROUTE', 'DELIVERED')).toBe(false);
    });

    it('treats DELIVERED and RETURNED_TO_HUB as terminal states', () => {
      expect(getAvailableTransitions('DELIVERED')).toEqual([]);
      expect(getAvailableTransitions('RETURNED_TO_HUB')).toEqual([]);
      expect(canTransition('DELIVERED', 'ASSIGNED')).toBe(false);
      expect(canTransition('DELIVERED', 'EN_ROUTE')).toBe(false);
    });
  });

  describe('validateTransition guards', () => {
    it('rejects when current order status does not match event fromStatus', () => {
      const order = createMockOrder('ASSIGNED');
      const event: TransitionEvent = {
        orderId: order.id,
        fromStatus: 'PICKED_UP',
        toStatus: 'EN_ROUTE',
        timestamp: '10:00 AM',
      };

      const result = validateTransition(event, order);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Conflict');
    });

    it('rejects invalid jump transitions', () => {
      const order = createMockOrder('ASSIGNED');
      const event: TransitionEvent = {
        orderId: order.id,
        fromStatus: 'ASSIGNED',
        toStatus: 'DELIVERED',
        timestamp: '10:00 AM',
      };

      const result = validateTransition(event, order);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Illegal transition');
    });

    it('strictly requires failureReason when moving to FAILED_ATTEMPT', () => {
      const order = createMockOrder('ARRIVED');
      const eventWithoutReason: TransitionEvent = {
        orderId: order.id,
        fromStatus: 'ARRIVED',
        toStatus: 'FAILED_ATTEMPT',
        timestamp: '10:00 AM',
      };

      const result1 = validateTransition(eventWithoutReason, order);
      expect(result1.valid).toBe(false);
      expect(result1.error).toContain('Failure Reason is strictly required');

      const eventWithReason: TransitionEvent = {
        ...eventWithoutReason,
        failureReason: 'CUSTOMER_UNAVAILABLE',
      };
      const result2 = validateTransition(eventWithReason, order);
      expect(result2.valid).toBe(true);
    });

    it('enforces signature when package requiresSignature and moving to DELIVERED', () => {
      const order = createMockOrder('ARRIVED', true);
      const eventWithoutSig: TransitionEvent = {
        orderId: order.id,
        fromStatus: 'ARRIVED',
        toStatus: 'DELIVERED',
        timestamp: '10:00 AM',
      };

      const result1 = validateTransition(eventWithoutSig, order);
      expect(result1.valid).toBe(false);
      expect(result1.error).toContain('Proof of Delivery requires recipient signature');

      const eventWithSig: TransitionEvent = {
        ...eventWithoutSig,
        recipientSignature: 'Jane Doe (Signed)',
      };
      const result2 = validateTransition(eventWithSig, order);
      expect(result2.valid).toBe(true);
    });
  });

  describe('applyTransition', () => {
    it('successfully produces an updated order with prepended timeline entry', () => {
      const order = createMockOrder('EN_ROUTE');
      const event: TransitionEvent = {
        orderId: order.id,
        fromStatus: 'EN_ROUTE',
        toStatus: 'ARRIVED',
        timestamp: '10:30 AM',
      };

      const updated = applyTransition(order, event);
      expect(updated.status).toBe('ARRIVED');
      expect(updated.timeline.length).toBe(1);
      expect(updated.timeline[0].status).toBe('ARRIVED');
      expect(updated.timeline[0].timestamp).toBe('10:30 AM');
      expect(updated.hasPendingSync).toBe(false);
    });

    it('throws when transition is invalid', () => {
      const order = createMockOrder('ASSIGNED');
      const event: TransitionEvent = {
        orderId: order.id,
        fromStatus: 'ASSIGNED',
        toStatus: 'DELIVERED',
        timestamp: '10:30 AM',
      };

      expect(() => applyTransition(order, event)).toThrow('Illegal transition');
    });
  });
});

