import { useOutboxStore } from '../src/sync/useOutboxStore';
import { useNetworkStore } from '../src/sync/useNetworkStore';
import { processOutboxQueue } from '../src/sync/syncWorker';
import { mockApi } from '../src/api/mockApi';
import { TransitionEvent } from '../src/types/domain';

describe('Offline Outbox & Replay Engine', () => {
  beforeEach(async () => {
    useOutboxStore.getState().clearQueue();
    useOutboxStore.getState().clearHistory();
    useNetworkStore.getState().setNetworkMode('ONLINE');
    await mockApi.resetDemoData();
  });

  it('enqueues a mutation into persistent FIFO outbox queue', () => {
    const event: TransitionEvent = {
      orderId: 'PP-8101',
      fromStatus: 'EN_ROUTE',
      toStatus: 'ARRIVED',
      timestamp: '11:00 AM',
    };

    const outboxItem = useOutboxStore.getState().enqueueTransition(event);

    expect(outboxItem.id).toBeDefined();
    expect(outboxItem.status).toBe('PENDING');
    expect(outboxItem.attempts).toBe(0);

    const queue = useOutboxStore.getState().queue;
    expect(queue.length).toBe(1);
    expect(queue[0].payload.toStatus).toBe('ARRIVED');
  });

  it('skips sync execution when network mode is OFFLINE', async () => {
    useNetworkStore.getState().setNetworkMode('OFFLINE');

    useOutboxStore.getState().enqueueTransition({
      orderId: 'PP-8101',
      fromStatus: 'EN_ROUTE',
      toStatus: 'ARRIVED',
      timestamp: '11:00 AM',
    });

    const result = await processOutboxQueue();
    expect(result.skipped).toBe(true);
    expect(result.syncedCount).toBe(0);

    // Queue should remain intact
    expect(useOutboxStore.getState().queue.length).toBe(1);
    expect(useOutboxStore.getState().queue[0].status).toBe('PENDING');
  });

  it('replays FIFO mutations sequentially when ONLINE and moves them to synced history', async () => {
    useNetworkStore.getState().setNetworkMode('ONLINE');

    // Queue valid transition: PP-8101 is EN_ROUTE in mock seed data
    useOutboxStore.getState().enqueueTransition({
      orderId: 'PP-8101',
      fromStatus: 'EN_ROUTE',
      toStatus: 'ARRIVED',
      timestamp: '11:00 AM',
    });

    const result = await processOutboxQueue();
    expect(result.syncedCount).toBe(1);
    expect(result.failedCount).toBe(0);

    // Queue should be cleared of the confirmed mutation
    expect(useOutboxStore.getState().queue.length).toBe(0);

    // Should be archived in history
    const history = useOutboxStore.getState().syncedHistory;
    expect(history.length).toBe(1);
    expect(history[0].status).toBe('CONFIRMED');

    // Mock API should now reflect the updated status
    const updated = await mockApi.getOrderById('PP-8101');
    expect(updated.status).toBe('ARRIVED');
  });

  it('handles and marks failed attempts when transition conflict arises', async () => {
    useNetworkStore.getState().setNetworkMode('ONLINE');

    // Attempt illegal transition directly to DELIVERED without ARRIVED
    useOutboxStore.getState().enqueueTransition({
      orderId: 'PP-8101',
      fromStatus: 'EN_ROUTE',
      toStatus: 'DELIVERED',
      timestamp: '11:00 AM',
    });

    const result = await processOutboxQueue();
    expect(result.failedCount).toBe(1);
    expect(result.syncedCount).toBe(0);

    const queue = useOutboxStore.getState().queue;
    expect(queue.length).toBe(1);
    expect(queue[0].status).toBe('FAILED');
    expect(queue[0].attempts).toBe(1);
    expect(queue[0].lastError).toContain('Illegal transition');
  });
});

