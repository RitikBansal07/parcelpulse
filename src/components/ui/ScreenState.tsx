import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';

interface ScreenStateProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  emptyTitle?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

export const ScreenState: React.FC<ScreenStateProps> = ({
  loading = false,
  error = null,
  empty = false,
  emptyTitle = 'No Items Found',
  emptyMessage = 'There are no active orders in this manifest category.',
  onRetry,
  children,
}) => {
  if (loading) {
    return (
      <View style={styles.centerContainer} testID="screen-loading-skeleton">
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Loading manifest data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer} testID="screen-error-view">
        <View style={styles.errorIconCircle}>
          <Ionicons name="warning-outline" size={36} color="#DC2626" />
        </View>
        <Text style={styles.errorTitle}>Something Went Wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        {onRetry && (
          <Button
            title="Retry Connection"
            onPress={onRetry}
            variant="outline"
            style={styles.retryButton}
            icon={<Ionicons name="reload" size={16} color="#0284C7" />}
          />
        )}
      </View>
    );
  }

  if (empty) {
    return (
      <View style={styles.centerContainer} testID="screen-empty-view">
        <View style={styles.emptyIconCircle}>
          <Ionicons name="cube-outline" size={38} color="#64748B" />
        </View>
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptyMessage}>{emptyMessage}</Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  errorIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 320,
    lineHeight: 20,
  },
  retryButton: {
    minWidth: 180,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
  },
});

