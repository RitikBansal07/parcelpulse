import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkMode } from '../types/domain';

interface NetworkState {
  mode: NetworkMode;
  simulatedLatencyMs: number;
  isOnline: boolean;
  setNetworkMode: (mode: NetworkMode) => void;
  toggleOnline: () => void;
  setSimulatedLatency: (ms: number) => void;
}

export const useNetworkStore = create<NetworkState>()(
  persist(
    (set, get) => ({
      mode: 'ONLINE',
      simulatedLatencyMs: 150,
      isOnline: true,
      setNetworkMode: (mode: NetworkMode) => {
        set({
          mode,
          isOnline: mode !== 'OFFLINE',
        });
      },
      toggleOnline: () => {
        const nextMode = get().mode === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
        set({
          mode: nextMode,
          isOnline: nextMode !== 'OFFLINE',
        });
      },
      setSimulatedLatency: (ms: number) => {
        set({ simulatedLatencyMs: ms });
      },
    }),
    {
      name: '@parcelpulse_network_v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

