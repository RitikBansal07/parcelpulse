import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../../types/domain';
import { Button } from '../ui/Button';

interface CustomerContactCardProps {
  order: Order;
}

export const CustomerContactCard: React.FC<CustomerContactCardProps> = ({ order }) => {
  const [activeModal, setActiveModal] = useState<'CALL' | 'SMS' | 'WHATSAPP' | null>(null);

  const isCod = order.packageDetails.paymentMode === 'COD';

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
          <Text style={styles.phoneText}>Masked Proxy: {order.recipientPhone}</Text>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => setActiveModal('CALL')}
            accessibilityRole="button"
            accessibilityLabel={`Call ${order.recipientName}`}
            testID="call-customer-btn"
          >
            <Ionicons name="call" size={17} color="#0284C7" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.circleBtn, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
            onPress={() => setActiveModal('WHATSAPP')}
            accessibilityRole="button"
            accessibilityLabel={`WhatsApp ${order.recipientName}`}
            testID="whatsapp-customer-btn"
          >
            <Ionicons name="logo-whatsapp" size={17} color="#16A34A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => setActiveModal('SMS')}
            accessibilityRole="button"
            accessibilityLabel={`Text ${order.recipientName}`}
            testID="sms-customer-btn"
          >
            <Ionicons name="chatbubble-ellipses" size={17} color="#0284C7" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment & OTP Badge Row */}
      <View style={styles.paymentBadgeRow}>
        <View
          style={[
            styles.paymentPill,
            isCod ? styles.paymentPillCod : styles.paymentPillPrepaid,
          ]}
        >
          <Ionicons
            name={isCod ? 'cash-outline' : 'shield-checkmark-outline'}
            size={14}
            color={isCod ? '#B45309' : '#15803D'}
          />
          <Text
            style={[
              styles.paymentPillText,
              isCod ? styles.paymentPillTextCod : styles.paymentPillTextPrepaid,
            ]}
          >
            {isCod
              ? `Collect Cash: ₹${order.packageDetails.codAmountInr?.toLocaleString('en-IN')}`
              : 'UPI / Card Prepaid'}
          </Text>
        </View>

        {order.packageDetails.otpCode ? (
          <View style={styles.otpPill}>
            <Ionicons name="key-outline" size={13} color="#0369A1" />
            <Text style={styles.otpPillText}>
              Delivery OTP: <Text style={styles.otpBold}>{order.packageDetails.otpCode}</Text>
            </Text>
          </View>
        ) : null}
      </View>

      {/* Address Details with Indian Landmark */}
      <View style={styles.addressBox}>
        <View style={styles.addressHeader}>
          <Ionicons name="location-sharp" size={16} color="#0284C7" />
          <Text style={styles.addressTitle}>Destination Address</Text>
        </View>
        <Text style={styles.addressMain}>
          {order.deliveryAddress.street}
          {order.deliveryAddress.apt ? ` (${order.deliveryAddress.apt})` : ''}
        </Text>

        {order.deliveryAddress.landmark ? (
          <View style={styles.landmarkWrap}>
            <Ionicons name="compass-outline" size={13} color="#64748B" />
            <Text style={styles.landmarkText}>
              Landmark: <Text style={{ fontWeight: '700' }}>{order.deliveryAddress.landmark}</Text>
            </Text>
          </View>
        ) : null}

        <Text style={styles.addressSub}>
          {order.deliveryAddress.locality ? `${order.deliveryAddress.locality}, ` : ''}
          {order.deliveryAddress.city}, {order.deliveryAddress.state} — {order.deliveryAddress.zip}
        </Text>
      </View>

      {/* Society / Gate Instructions */}
      {order.packageDetails.instructions ? (
        <View style={styles.instructionsBox}>
          <View style={styles.instructionHeader}>
            <Ionicons name="document-text-outline" size={14} color="#B45309" />
            <Text style={styles.instructionTitle}>Society Gate / Delivery Instructions</Text>
          </View>
          <Text style={styles.instructionBody}>{order.packageDetails.instructions}</Text>
        </View>
      ) : null}

      {/* Simulated Dialog Modal */}
      <Modal
        visible={activeModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View
              style={[
                styles.modalIconWrap,
                activeModal === 'WHATSAPP' && { backgroundColor: '#DCFCE7' },
              ]}
            >
              <Ionicons
                name={
                  activeModal === 'CALL'
                    ? 'call'
                    : activeModal === 'WHATSAPP'
                    ? 'logo-whatsapp'
                    : 'chatbox'
                }
                size={32}
                color={activeModal === 'WHATSAPP' ? '#16A34A' : '#0284C7'}
              />
            </View>
            <Text style={styles.modalTitle}>
              {activeModal === 'CALL'
                ? 'Simulated Proxy IVR Call'
                : activeModal === 'WHATSAPP'
                ? 'Simulated WhatsApp Template'
                : 'Simulated SMS Gateway'}
            </Text>
            <Text style={styles.modalDesc}>
              Connecting to recipient via privacy-preserving Indian telecom proxy:
              {'\n'}
              <Text style={{ fontWeight: 'bold', color: '#0F172A' }}>
                {order.recipientPhone} ({order.recipientName})
              </Text>
              {'\n\n'}
              {activeModal === 'WHATSAPP'
                ? 'Template: "Namaste! Your delivery driver from ParcelPulse has arrived at your society gate."'
                : 'Masked virtual number routing ensures customer phone number remains private.'}
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
    marginBottom: 10,
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
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  paymentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  paymentPillPrepaid: {
    backgroundColor: '#DCFCE7',
  },
  paymentPillCod: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  paymentPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  paymentPillTextPrepaid: {
    color: '#15803D',
  },
  paymentPillTextCod: {
    color: '#B45309',
  },
  otpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  otpPillText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '600',
  },
  otpBold: {
    fontWeight: '800',
    letterSpacing: 1,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
  },
  landmarkWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  landmarkText: {
    fontSize: 12,
    color: '#475569',
  },
  addressSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
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
    fontSize: 12,
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
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
  },
});
