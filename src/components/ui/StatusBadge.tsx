import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrderStatus } from '../../types/domain';

interface StatusBadgeProps {
  status: OrderStatus;
  hasPendingSync?: boolean;
  size?: 'small' | 'medium';
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  ASSIGNED: {
    label: 'ASSIGNED',
    bg: '#E2E8F0',
    text: '#334155',
    icon: 'clipboard-outline',
  },
  PICKED_UP: {
    label: 'PICKED UP',
    bg: '#E0E7FF',
    text: '#3730A3',
    icon: 'cube-outline',
  },
  EN_ROUTE: {
    label: 'EN ROUTE',
    bg: '#FEF3C7',
    text: '#92400E',
    icon: 'car-outline',
  },
  ARRIVED: {
    label: 'ARRIVED',
    bg: '#DBEAFE',
    text: '#1E40AF',
    icon: 'location-outline',
  },
  DELIVERED: {
    label: 'DELIVERED',
    bg: '#DCFCE7',
    text: '#166534',
    icon: 'checkmark-circle-outline',
  },
  FAILED_ATTEMPT: {
    label: 'ATTEMPT FAILED',
    bg: '#FEE2E2',
    text: '#991B1B',
    icon: 'alert-circle-outline',
  },
  RETURNED_TO_HUB: {
    label: 'RETURNED TO HUB',
    bg: '#F3E8FF',
    text: '#6B21A8',
    icon: 'return-down-back-outline',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  hasPendingSync = false,
  size = 'medium',
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.ASSIGNED;
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.bg },
        isSmall && styles.containerSmall,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${config.label}${hasPendingSync ? ', pending sync' : ''}`}
    >
      <Ionicons
        name={config.icon}
        size={isSmall ? 13 : 15}
        color={config.text}
        style={styles.icon}
      />
      <Text
        style={[
          styles.text,
          { color: config.text },
          isSmall && styles.textSmall,
        ]}
      >
        {config.label}
      </Text>

      {hasPendingSync && (
        <View style={styles.syncIndicator} testID="pending-sync-cloud-icon">
          <Ionicons name="cloud-upload-outline" size={13} color="#D97706" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  containerSmall: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  icon: {
    marginRight: 5,
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textSmall: {
    fontSize: 10,
  },
  syncIndicator: {
    marginLeft: 6,
    paddingLeft: 4,
    borderLeftWidth: 1,
    borderLeftColor: '#FBBF24',
  },
});

