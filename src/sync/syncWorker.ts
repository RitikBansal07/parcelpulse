import { useNetworkStore } from './useNetworkStore';
import { useOutboxStore } from './useOutboxStore';
import { mockApi } from '../api/mockApi';
import { QueryClient } from '@tanstack/react-query';

export interface SyncResult {
  syncedCount: number;
  failedCount: number;
  skipped: boolean;
  message: string;
}

export async function processOutboxQueue(queryClient?: QueryClient): Promise<SyncResult> {
  const networkState = useNetworkStore.getState();
  const outboxStore = useOutboxStore.getState();

  // If offline, halt sync immediately
  if (!networkState.isOnline || networkState.mode === 'OFFLINE') {
    return {
      syncedCount: 0,
      failedCount: 0,
      skipped: true,
      message: 'Offline: Mutations remain queued in persistent outbox.',
    };
  }

  const pendingItems = outboxStore.queue.filter(
    (item) => item.status === 'PENDING' || item.status === 'FAILED'
  );

  if (pendingItems.length === 0) {
    return {
      syncedCount: 0,
      failedCount: 0,
      skipped: false,
      message: 'Outbox is empty. All deliveries synchronized.',
    };
  }

  outboxStore.setIsSyncing(true);
  let syncedCount = 0;
  let failedCount = 0;

  try {
    for (const item of pendingItems) {
      // Re-check network between iterations
      const currentNetwork = useNetworkStore.getState();
      if (currentNetwork.mode === 'OFFLINE') {
        break;
      }

      outboxStore.updateItem(item.id, { status: 'SYNCING' });

      // Handle Flaky 500 simulation
      if (currentNetwork.mode === 'FLAKY_500') {
        const shouldFail = Math.random() < 0.6;
        if (shouldFail) {
          outboxStore.markFailed(item.id, 'Simulated HTTP 500: Gateway timeout or upstream error');
          failedCount++;
          continue; // Move to next item
        }
      }

      try {
        await mockApi.transitionOrder(item.payload);
        outboxStore.markConfirmed(item.id);
        syncedCount++;
      } catch (err: any) {
        const errorMessage = err?.message || 'Sync failed due to unknown server error';
        outboxStore.markFailed(item.id, errorMessage);
        failedCount++;
      }
    }
  } finally {
    outboxStore.setIsSyncing(false);
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
      queryClient.invalidateQueries({ queryKey: ['driverShift'] });
    }
  }

  return {
    syncedCount,
    failedCount,
    skipped: false,
    message: `Sync finished: ${syncedCount} uploaded, ${failedCount} failed.`,
  };
}

// Automatically subscribe to network changes: When transitioning back to ONLINE, automatically replay outbox!
let unsubscribeNetwork: (() => void) | null = null;

export function initializeAutoSync(queryClient: QueryClient): void {
  if (unsubscribeNetwork) return;

  unsubscribeNetwork = useNetworkStore.subscribe((state, prevState) => {
    if (state.mode === 'ONLINE' && prevState.mode !== 'ONLINE') {
      // Replay outbox automatically upon reconnection
      processOutboxQueue(queryClient);
    }
  });
}

