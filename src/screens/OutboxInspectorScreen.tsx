import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOutboxStore } from '../sync/useOutboxStore';
import { useNetworkStore } from '../sync/useNetworkStore';
import { processOutboxQueue } from '../sync/syncWorker';
import { useQueryClient } from '@tanstack/react-query';
import { OutboxItem } from '../types/domain';
import { Button } from '../components/ui/Button';

export const OutboxInspectorScreen: React.FC = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const queue = useOutboxStore((s) => s.queue);
  const syncedHistory = useOutboxStore((s) => s.syncedHistory);
  const isSyncing = useOutboxStore((s) => s.isSyncing);
  const clearQueue = useOutboxStore((s) => s.clearQueue);
  const clearHistory = useOutboxStore((s) => s.clearHistory);

  const networkMode = useNetworkStore((s) => s.mode);
  const setNetworkMode = useNetworkStore((s) => s.setNetworkMode);

  const handleManualSync = async () => {
    const result = await processOutboxQueue(queryClient);
    Alert.alert('Sync Result', result.message);
  };

  const renderQueueItem = ({ item }: { item: OutboxItem }) => {
    const isFailed = item.status === 'FAILED';
    const isPending = item.status === 'PENDING';

    return (
      <View style={[styles.itemCard, isFailed && styles.failedCard]} testID={`outbox-item-${item.id}`}>
        <View style={styles.itemHeader}>
          <View style={styles.idWrap}>
            <Ionicons
              name={
                isFailed
                  ? 'alert-circle'
                  : item.status === 'SYNCING'
                  ? 'sync'
                  : 'cloud-upload-outline'
              }
              size={18}
              color={isFailed ? '#DC2626' : item.status === 'SYNCING' ? '#0284C7' : '#D97706'}
            />
            <Text style={styles.orderId}>{item.orderId}</Text>
          </View>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: isFailed
                  ? '#FEE2E2'
                  : item.status === 'SYNCING'
                  ? '#E0F2FE'
                  : '#FEF3C7',
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: isFailed
                    ? '#991B1B'
                    : item.status === 'SYNCING'
                    ? '#0369A1'
                    : '#92400E',
                },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <Text style={styles.transitionText}>
          Transition: <Text style={styles.bold}>{item.payload.fromStatus}</Text> →{' '}
          <Text style={styles.bold}>{item.payload.toStatus}</Text>
        </Text>

        {item.payload.failureReason && (
          <Text style={styles.metaText}>Reason: {item.payload.failureReason}</Text>
        )}

        {item.payload.recipientSignature && (
          <Text style={styles.metaText}>Signature: {item.payload.recipientSignature}</Text>
        )}

        <View style={styles.itemFooter}>
          <Text style={styles.timestamp}>
            Queued: {new Date(item.queuedAt).toLocaleTimeString()}
          </Text>
          <Text style={styles.attempts}>Attempts: {item.attempts}</Text>
        </View>

        {item.lastError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Error: {item.lastError}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderHistoryItem = ({ item }: { item: OutboxItem }) => (
    <View style={styles.historyCard} testID={`history-item-${item.id}`}>
      <View style={styles.itemHeader}>
        <View style={styles.idWrap}>
          <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
          <Text style={styles.orderId}>{item.orderId}</Text>
        </View>
        <Text style={styles.historyTime}>
          Synced: {item.syncedAt ? new Date(item.syncedAt).toLocaleTimeString() : ''}
        </Text>
      </View>
      <Text style={styles.transitionTextSmall}>
        {item.payload.fromStatus} → {item.payload.toStatus}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          testID="outbox-back-btn"
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offline Outbox & Sync Queue</Text>
      </View>

      {/* Network Mode Status Banner */}
      <View style={styles.networkBanner}>
        <View style={styles.networkCol}>
          <Text style={styles.networkLabel}>SIMULATED NETWORK STATE</Text>
          <Text style={styles.networkValue}>{networkMode}</Text>
        </View>
        <View style={styles.networkBtnRow}>
          {(['ONLINE', 'OFFLINE', 'FLAKY_500'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.modePill, networkMode === m && styles.modePillActive]}
              onPress={() => setNetworkMode(m)}
              testID={`set-mode-${m}`}
            >
              <Text style={[styles.modePillText, networkMode === m && styles.modePillTextActive]}>
                {m === 'FLAKY_500' ? '500' : m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.btnRow}>
        <Button
          title={isSyncing ? 'Replaying Queue...' : `Sync Now (${queue.length})`}
          variant="primary"
          loading={isSyncing}
          disabled={networkMode === 'OFFLINE' || queue.length === 0}
          onPress={handleManualSync}
          style={{ flex: 1.5 }}
          icon={<Ionicons name="cloud-upload" size={16} color="#FFFFFF" />}
          testID="outbox-sync-btn"
        />
        {queue.length > 0 && (
          <Button
            title="Clear"
            variant="secondary"
            onPress={clearQueue}
            style={{ flex: 1 }}
            testID="clear-queue-btn"
          />
        )}
      </View>

      {/* Section: Pending Queue */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Pending Mutations Queue ({queue.length})
        </Text>
        <Text style={styles.sectionSubtitle}>
          FIFO execution order • Persisted in local storage
        </Text>
      </View>

      {queue.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="checkmark-done-circle-outline" size={44} color="#10B981" />
          <Text style={styles.emptyTitle}>All Changes Synced</Text>
          <Text style={styles.emptyDesc}>No mutations are waiting in the offline outbox.</Text>
        </View>
      ) : (
        <FlatList
          data={queue}
          keyExtractor={(item) => item.id}
          renderItem={renderQueueItem}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      )}

      {/* Section: Synced History Audit */}
      {syncedHistory.length > 0 && (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historySectionTitle}>Confirmed Sync Audit Log</Text>
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.clearHistoryText}>Clear Log</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={syncedHistory.slice(0, 5)}
            keyExtractor={(item) => item.id}
            renderItem={renderHistoryItem}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  networkBanner: {
    backgroundColor: '#0F172A',
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  networkCol: {
    flex: 1,
  },
  networkLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  networkValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#38BDF8',
    marginTop: 2,
  },
  networkBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  modePill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modePillActive: {
    backgroundColor: '#0284C7',
  },
  modePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  modePillTextActive: {
    color: '#FFFFFF',
  },
  btnRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  failedCard: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  idWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  transitionText: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 4,
  },
  transitionTextSmall: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  bold: {
    fontWeight: '700',
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  timestamp: {
    fontSize: 11,
    color: '#94A3B8',
  },
  attempts: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 6,
    borderRadius: 6,
    marginTop: 6,
  },
  errorText: {
    fontSize: 11,
    color: '#991B1B',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  historySection: {
    marginTop: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  historySectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  clearHistoryText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyTime: {
    fontSize: 11,
    color: '#64748B',
  },
});

