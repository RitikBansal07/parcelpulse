import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from './mockApi';
import { Order, TransitionEvent, DriverShift } from '../types/domain';
import { useNetworkStore } from '../sync/useNetworkStore';
import { useOutboxStore } from '../sync/useOutboxStore';
import { processOutboxQueue } from '../sync/syncWorker';
import { applyTransition } from '../domain/orderStateMachine';

export function useOrdersQuery() {
  const queue = useOutboxStore((s) => s.queue);

  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const orders = await mockApi.getOrders();
      // Optimistically overlay pending outbox mutations
      return orders.map((order) => {
        const pendingMutations = queue.filter((item) => item.orderId === order.id);
        if (pendingMutations.length === 0) return order;

        let projectedOrder = { ...order };
        for (const mutation of pendingMutations) {
          try {
            projectedOrder = applyTransition(projectedOrder, mutation.payload);
            projectedOrder.hasPendingSync = true;
          } catch {
            // If transition invalid in replay, leave as is
          }
        }
        return projectedOrder;
      });
    },
    staleTime: 1000 * 30,
  });
}

export function useOrderDetailQuery(orderId: string) {
  const queue = useOutboxStore((s) => s.queue);

  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const order = await mockApi.getOrderById(orderId);
      const pendingMutations = queue.filter((item) => item.orderId === orderId);
      if (pendingMutations.length === 0) return order;

      let projectedOrder = { ...order };
      for (const mutation of pendingMutations) {
        try {
          projectedOrder = applyTransition(projectedOrder, mutation.payload);
          projectedOrder.hasPendingSync = true;
        } catch {
          // Keep base
        }
      }
      return projectedOrder;
    },
    staleTime: 1000 * 15,
  });
}

export function useDriverShiftQuery() {
  return useQuery({
    queryKey: ['driverShift'],
    queryFn: () => mockApi.getDriverShift(),
    staleTime: 1000 * 60,
  });
}

export function useTransitionMutation() {
  const queryClient = useQueryClient();
  const networkMode = useNetworkStore((s) => s.mode);
  const enqueueTransition = useOutboxStore((s) => s.enqueueTransition);

  return useMutation({
    mutationFn: async (event: TransitionEvent) => {
      // If offline or flaky mode, enqueue to outbox directly
      if (networkMode === 'OFFLINE') {
        const item = enqueueTransition(event);
        return { item, queuedOffline: true };
      }

      // If online, try direct execution
      try {
        if (networkMode === 'FLAKY_500' && Math.random() < 0.5) {
          throw new Error('500 Internal Server Error: Gateway timeout');
        }
        const updated = await mockApi.transitionOrder(event);
        return { order: updated, queuedOffline: false };
      } catch (err: any) {
        // Enqueue to outbox for recovery
        const item = enqueueTransition(event);
        return { item, queuedOffline: true, error: err.message };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
      queryClient.invalidateQueries({ queryKey: ['driverShift'] });
    },
  });
}

