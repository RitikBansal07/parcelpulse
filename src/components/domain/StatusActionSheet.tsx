import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order, OrderStatus } from '../../types/domain';
import { getAvailableTransitions } from '../../domain/orderStateMachine';
import { Button } from '../ui/Button';

interface StatusActionSheetProps {
  order: Order;
  onAdvanceStatus: (targetStatus: OrderStatus) => void;
  onRequestSignature: () => void;
  onRequestFailure: () => void;
  loading?: boolean;
}

export const StatusActionSheet: React.FC<StatusActionSheetProps> = ({
  order,
  onAdvanceStatus,
  onRequestSignature,
  onRequestFailure,
  loading = false,
}) => {
  const availableNext = getAvailableTransitions(order.status);

  if (availableNext.length === 0) {
    return (
      <View style={styles.terminalCard} testID="terminal-status-card">
        <Ionicons
          name={order.status === 'DELIVERED' ? 'checkmark-circle' : 'return-down-back'}
          size={32}
          color={order.status === 'DELIVERED' ? '#10B981' : '#A855F7'}
        />
        <View style={styles.terminalTextCol}>
          <Text style={styles.terminalTitle}>
            {order.status === 'DELIVERED' ? 'Delivery Completed' : 'Returned to Hub'}
          </Text>
          <Text style={styles.terminalSubtitle}>
            {order.status === 'DELIVERED'
              ? 'Package successfully handed over and receipt stored.'
              : 'Parcel checked back into logistics warehouse inventory.'}
          </Text>
        </View>
      </View>
    );
  }

  const handleActionPress = (target: OrderStatus) => {
    if (target === 'DELIVERED') {
      if (order.packageDetails.requiresSignature) {
        onRequestSignature();
      } else {
        onAdvanceStatus('DELIVERED');
      }
    } else if (target === 'FAILED_ATTEMPT') {
      onRequestFailure();
    } else {
      onAdvanceStatus(target);
    }
  };

  const getActionConfig = (status: OrderStatus) => {
    switch (status) {
      case 'PICKED_UP':
        return {
          title: 'Confirm Staging / Load Van',
          variant: 'primary' as const,
          icon: <Ionicons name="cube" size={18} color="#FFFFFF" />,
        };
      case 'EN_ROUTE':
        return {
          title: order.status === 'FAILED_ATTEMPT' ? 'Re-attempt Delivery (En Route)' : 'Start Driving (En Route)',
          variant: 'primary' as const,
          icon: <Ionicons name="car" size={18} color="#FFFFFF" />,
        };
      case 'ARRIVED':
        return {
          title: 'Mark Arrived on Scene',
          variant: 'primary' as const,
          icon: <Ionicons name="location" size={18} color="#FFFFFF" />,
        };
      case 'DELIVERED':
        return {
          title: order.packageDetails.requiresSignature
            ? 'Complete Delivery (Requires Signature)'
            : 'Confirm Dropoff / Complete',
          variant: 'success' as const,
          icon: <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />,
        };
      case 'FAILED_ATTEMPT':
        return {
          title: 'Record Delivery Exception / Failed',
          variant: 'danger' as const,
          icon: <Ionicons name="close-circle" size={18} color="#FFFFFF" />,
        };
      case 'RETURNED_TO_HUB':
        return {
          title: 'Return Parcel to Central Hub',
          variant: 'warning' as const,
          icon: <Ionicons name="return-down-back" size={18} color="#FFFFFF" />,
        };
      default:
        return {
          title: `Advance to ${status}`,
          variant: 'primary' as const,
          icon: <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />,
        };
    }
  };

  return (
    <View style={styles.container} testID="status-action-sheet">
      <Text style={styles.sheetTitle}>Operational Actions</Text>
      <View style={styles.buttonList}>
        {availableNext.map((targetStatus) => {
          const config = getActionConfig(targetStatus);
          return (
            <Button
              key={targetStatus}
              title={config.title}
              variant={config.variant}
              icon={config.icon}
              loading={loading}
              onPress={() => handleActionPress(targetStatus)}
              style={styles.actionBtn}
              testID={`action-btn-${targetStatus}`}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  buttonList: {
    gap: 10,
  },
  actionBtn: {
    width: '100%',
    minHeight: 52,
  },
  terminalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  terminalTextCol: {
    flex: 1,
  },
  terminalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  terminalSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
});

