import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../../types/domain';
import { StatusBadge } from '../ui/StatusBadge';

interface ActiveOrderBannerProps {
  activeOrder?: Order | null;
  onPress: (order: Order) => void;
}

export const ActiveOrderBanner: React.FC<ActiveOrderBannerProps> = ({ activeOrder, onPress }) => {
  if (!activeOrder) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(activeOrder)}
      style={styles.banner}
      accessibilityRole="button"
      accessibilityLabel={`Active delivery in progress for ${activeOrder.recipientName}. Status ${activeOrder.status}. Tap to view.`}
      testID="active-order-banner"
    >
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <View style={styles.pulseDot} />
          <Text style={styles.titleText}>ACTIVE DELIVERY IN PROGRESS</Text>
        </View>
        <StatusBadge status={activeOrder.status} size="small" hasPendingSync={activeOrder.hasPendingSync} />
      </View>

      <View style={styles.contentRow}>
        <View style={styles.infoCol}>
          <Text style={styles.recipientName} numberOfLines={1}>
            {activeOrder.recipientName}
          </Text>
          <Text style={styles.addressText} numberOfLines={1}>
            {activeOrder.deliveryAddress.street}
            {activeOrder.deliveryAddress.apt ? `, ${activeOrder.deliveryAddress.apt}` : ''}
          </Text>
        </View>

        <View style={styles.actionCol}>
          <Text style={styles.actionPrompt}>Continue</Text>
          <Ionicons name="chevron-forward" size={18} color="#38BDF8" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#0284C7',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
  },
  titleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.6,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
    marginRight: 10,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  actionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 2,
  },
  actionPrompt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
  },
});

