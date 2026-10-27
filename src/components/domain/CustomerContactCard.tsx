import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../../types/domain';
import { Button } from '../ui/Button';

interface CustomerContactCardProps {
  order: Order;
}

export const CustomerContactCard: React.FC<CustomerContactCardProps> = ({ order }) => {
  const [activeModal, setActiveModal] = useState<'CALL' | 'SMS' | null>(null);

  return (
    <View style={styles.card} testID="customer-contact-card">
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {order.recipientName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase()}
          </Text>
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.recipientName}>{order.recipientName}</Text>
          <Text style={styles.phoneText}>Masked: {order.recipientPhone}</Text>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => setActiveModal('CALL')}
            accessibilityRole="button"
            accessibilityLabel={`Call ${order.recipientName}`}
            testID="call-customer-btn"
          >
            <Ionicons name="call" size={18} color="#0284C7" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => setActiveModal('SMS')}
            accessibilityRole="button"
            accessibilityLabel={`Text ${order.recipientName}`}
            testID="sms-customer-btn"
          >
            <Ionicons name="chatbubble-ellipses" size={18} color="#0284C7" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.addressBox}>
        <View style={styles.addressHeader}>
          <Ionicons name="location-sharp" size={16} color="#38BDF8" />
          <Text style={styles.addressTitle}>Destination Address</Text>
        </View>
        <Text style={styles.addressMain}>
          {order.deliveryAddress.street}
          {order.deliveryAddress.apt ? `, ${order.deliveryAddress.apt}` : ''}
        </Text>
        <Text style={styles.addressSub}>
          {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zip}
        </Text>
      </View>

      {order.packageDetails.instructions ? (
        <View style={styles.instructionsBox}>
          <View style={styles.instructionHeader}>
            <Ionicons name="document-text-outline" size={14} color="#F59E0B" />
            <Text style={styles.instructionTitle}>Gate / Delivery Notes</Text>
          </View>
          <Text style={styles.instructionBody}>{order.packageDetails.instructions}</Text>
        </View>
      ) : null}

      {/* Simulated Call / Text Modal */}
      <Modal
        visible={activeModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons
                name={activeModal === 'CALL' ? 'call' : 'chatbox'}
                size={32}
                color="#0284C7"
              />
            </View>
            <Text style={styles.modalTitle}>
              {activeModal === 'CALL' ? 'Simulated Driver Call' : 'Simulated Driver SMS'}
            </Text>
            <Text style={styles.modalDesc}>
              Connecting to recipient via privacy-preserving virtual proxy:
              {'\n'}
              <Text style={{ fontWeight: 'bold', color: '#0F172A' }}>
                {order.recipientPhone} ({order.recipientName})
              </Text>
            </Text>
            <Button
              title="Close Simulated Dialog"
              onPress={() => setActiveModal(null)}
              variant="primary"
              style={{ marginTop: 16, width: '100%' }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0369A1',
  },
  infoCol: {
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  phoneText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  addressTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    textTransform: 'uppercase',
  },
  addressMain: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  addressSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  instructionsBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  instructionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
  },
  instructionBody: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
  },
});

