import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StatusActionSheet } from '../src/components/domain/StatusActionSheet';
import { Order } from '../src/types/domain';
import { CENTRAL_HUB } from '../src/api/mockSeedData';

describe('OrderDetailActions (StatusActionSheet)', () => {
  const createMockOrder = (status: Order['status'], requiresSignature = false): Order => ({
    id: 'PP-TEST-UI',
    trackingNumber: '1Z9999999999',
    recipientName: 'Alice Green',
    recipientPhone: '+1-555-0199',
    hubAddress: CENTRAL_HUB,
    deliveryAddress: {
      street: '456 Mission St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      lat: 37.79,
      lng: -122.40,
    },
    status,
    packageDetails: {
      weightKg: 1.5,
      dimensions: '15x15x10',
      requiresSignature,
      isFragile: false,
      timeWindow: '08:00 - 10:00 AM',
      category: 'STANDARD',
      paymentMode: 'UPI_PREPAID',
    },
    timeline: [],
    signatureRequired: requiresSignature,
    estimatedArrivalMin: 5,
    distanceKm: 1.2,
    currentStepIndex: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  it('renders ONLY "PICKED_UP" action button when order is ASSIGNED', async () => {
    const order = createMockOrder('ASSIGNED');
    const onAdvanceStatus = jest.fn();

    const { getByTestId, queryByTestId } = await render(
      <StatusActionSheet
        order={order}
        onAdvanceStatus={onAdvanceStatus}
        onRequestSignature={jest.fn()}
        onRequestFailure={jest.fn()}
      />
    );

    expect(getByTestId('action-btn-PICKED_UP')).toBeTruthy();
    expect(queryByTestId('action-btn-EN_ROUTE')).toBeNull();
    expect(queryByTestId('action-btn-ARRIVED')).toBeNull();
    expect(queryByTestId('action-btn-DELIVERED')).toBeNull();
    expect(queryByTestId('action-btn-FAILED_ATTEMPT')).toBeNull();

    fireEvent.press(getByTestId('action-btn-PICKED_UP'));
    expect(onAdvanceStatus).toHaveBeenCalledWith('PICKED_UP');
  });

  it('renders BOTH "DELIVERED" and "FAILED_ATTEMPT" when order is ARRIVED', async () => {
    const order = createMockOrder('ARRIVED');
    const onAdvanceStatus = jest.fn();
    const onRequestFailure = jest.fn();

    const { getByTestId, queryByTestId } = await render(
      <StatusActionSheet
        order={order}
        onAdvanceStatus={onAdvanceStatus}
        onRequestSignature={jest.fn()}
        onRequestFailure={onRequestFailure}
      />
    );

    expect(getByTestId('action-btn-DELIVERED')).toBeTruthy();
    expect(getByTestId('action-btn-FAILED_ATTEMPT')).toBeTruthy();
    expect(queryByTestId('action-btn-PICKED_UP')).toBeNull();
    expect(queryByTestId('action-btn-EN_ROUTE')).toBeNull();

    fireEvent.press(getByTestId('action-btn-FAILED_ATTEMPT'));
    expect(onRequestFailure).toHaveBeenCalledTimes(1);
  });

  it('triggers signature request modal when DELIVERED is pressed for a signature-restricted package', async () => {
    const order = createMockOrder('ARRIVED', true); // signature required
    const onRequestSignature = jest.fn();
    const onAdvanceStatus = jest.fn();

    const { getByTestId } = await render(
      <StatusActionSheet
        order={order}
        onAdvanceStatus={onAdvanceStatus}
        onRequestSignature={onRequestSignature}
        onRequestFailure={jest.fn()}
      />
    );

    fireEvent.press(getByTestId('action-btn-DELIVERED'));
    expect(onRequestSignature).toHaveBeenCalledTimes(1);
    expect(onAdvanceStatus).not.toHaveBeenCalled();
  });

  it('displays terminal completed card with zero action buttons when order is DELIVERED', async () => {
    const order = createMockOrder('DELIVERED');

    const { getByTestId, queryByTestId } = await render(
      <StatusActionSheet
        order={order}
        onAdvanceStatus={jest.fn()}
        onRequestSignature={jest.fn()}
        onRequestFailure={jest.fn()}
      />
    );

    expect(getByTestId('terminal-status-card')).toBeTruthy();
    expect(queryByTestId('action-btn-DELIVERED')).toBeNull();
    expect(queryByTestId('action-btn-PICKED_UP')).toBeNull();
  });
});

