import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStore } from '../../sync/useNetworkStore';
import { useOutboxStore } from '../../sync/useOutboxStore';
import { processOutboxQueue } from '../../sync/syncWorker';
import { useQueryClient } from '@tanstack/react-query';
import { NetworkMode } from '../../types/domain';

interface NetworkControlBarProps {
  onOpenOutbox?: () => void;
}

export const NetworkControlBar: React.FC<NetworkControlBarProps> = ({ onOpenOutbox }) => {
  const queryClient = useQueryClient();
  const mode = useNetworkStore((s) => s.mode);
  const setNetworkMode = useNetworkStore((s) => s.setNetworkMode);
  const queue = useOutboxStore((s) => s.queue);
  const isSyncing = useOutboxStore((s) => s.isSyncing);

  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const pendingCount = queue.filter((q) => q.status === 'PENDING' || q.status === 'FAILED').length;

  const handleCycleMode = () => {
    let next: NetworkMode = 'ONLINE';
    if (mode === 'ONLINE') next = 'OFFLINE';
    else if (mode === 'OFFLINE') next = 'FLAKY_500';
    else next = 'ONLINE';

    setNetworkMode(next);
  };

  const handleManualSync = async () => {
    setSyncFeedback('Syncing...');
    const result = await processOutboxQueue(queryClient);
    setSyncFeedback(result.message);
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const modeBadgeColor =
    mode === 'ONLINE' ? '#10B981' : mode === 'OFFLINE' ? '#EF4444' : '#F59E0B';

  return (
    <View style={styles.container} testID="network-control-bar">
      <View style={styles.leftRow}>
        <TouchableOpacity
          onPress={handleCycleMode}
          style={[styles.modeButton, { borderColor: modeBadgeColor }]}
          accessibilityRole="button"
          accessibilityLabel={`Network mode is ${mode}. Tap to change.`}
          testID="network-toggle-button"
        >
          <View style={[styles.dot, { backgroundColor: modeBadgeColor }]} />
          <Text style={styles.modeText}>
            {mode === 'ONLINE' ? 'ONLINE' : mode === 'OFFLINE' ? 'OFFLINE' : 'FLAKY 500'}
          </Text>
        </TouchableOpacity>

        {pendingCount > 0 && (
          <TouchableOpacity
            style={styles.outboxBadge}
            onPress={onOpenOutbox}
            accessibilityRole="button"
            accessibilityLabel={`${pendingCount} pending mutations in outbox. Tap to inspect.`}
            testID="outbox-badge-button"
          >
            <Ionicons name="cloud-upload" size={14} color="#D97706" />
            <Text style={styles.outboxCountText}>{pendingCount}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.rightRow}>
        {syncFeedback ? (
          <Text style={styles.feedbackText} numberOfLines={1}>
            {syncFeedback}
          </Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.syncButton,
            (isSyncing || mode === 'OFFLINE') && styles.syncButtonDisabled,
          ]}
          onPress={handleManualSync}
          disabled={isSyncing || mode === 'OFFLINE'}
          accessibilityRole="button"
          accessibilityLabel="Sync now"
          testID="manual-sync-button"
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="refresh" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.syncButtonText}>Sync</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: '#1E293B',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  modeText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  outboxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#78350F',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
  },
  outboxCountText: {
    color: '#FEF3C7',
    fontSize: 12,
    fontWeight: '800',
  },
  feedbackText: {
    color: '#94A3B8',
    fontSize: 11,
    maxWidth: 140,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  syncButtonDisabled: {
    opacity: 0.5,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

