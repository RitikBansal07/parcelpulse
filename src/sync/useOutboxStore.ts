import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OutboxItem, TransitionEvent } from '../types/domain';

interface OutboxState {
  queue: OutboxItem[];
  syncedHistory: OutboxItem[];
  isSyncing: boolean;
  lastSyncAttempt: string | null;
  enqueueTransition: (event: TransitionEvent) => OutboxItem;
  updateItem: (id: string, updates: Partial<OutboxItem>) => void;
  markConfirmed: (id: string) => void;
  markFailed: (id: string, error: string) => void;
  setIsSyncing: (syncing: boolean) => void;
  clearHistory: () => void;
  clearQueue: () => void;
}

export const useOutboxStore = create<OutboxState>()(
  persist(
    (set, get) => ({
      queue: [],
      syncedHistory: [],
      isSyncing: false,
      lastSyncAttempt: null,

      enqueueTransition: (event: TransitionEvent) => {
        const item: OutboxItem = {
          id: `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          orderId: event.orderId,
          action: 'TRANSITION_STATUS',
          payload: event,
          status: 'PENDING',
          attempts: 0,
          queuedAt: new Date().toISOString(),
        };

        set((state) => ({
          queue: [...state.queue, item],
        }));

        return item;
      },

      updateItem: (id: string, updates: Partial<OutboxItem>) => {
        set((state) => ({
          queue: state.queue.map((item) => (item.id === id ? { ...item, ...updates } : item)),
        }));
      },

      markConfirmed: (id: string) => {
        const item = get().queue.find((q) => q.id === id);
        if (!item) return;

        const confirmedItem: OutboxItem = {
          ...item,
          status: 'CONFIRMED',
          syncedAt: new Date().toISOString(),
        };

        set((state) => ({
          queue: state.queue.filter((q) => q.id !== id),
          syncedHistory: [confirmedItem, ...state.syncedHistory.slice(0, 49)], // Keep last 50
        }));
      },

      markFailed: (id: string, error: string) => {
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: 'FAILED',
                  attempts: item.attempts + 1,
                  lastError: error,
                }
              : item
          ),
        }));
      },

      setIsSyncing: (isSyncing: boolean) => {
        set({
          isSyncing,
          lastSyncAttempt: new Date().toISOString(),
        });
      },

      clearHistory: () => {
        set({ syncedHistory: [] });
      },

      clearQueue: () => {
        set({ queue: [] });
      },
    }),
    {
      name: '@parcelpulse_outbox_v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

