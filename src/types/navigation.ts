import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  MainTabs: undefined;
  OrderDetail: { orderId: string };
  OutboxInspector: undefined;
  ProofOfDeliveryModal: { orderId: string };
  FailureReasonModal: { orderId: string };
};

export type MainTabParamList = {
  ManifestTab: undefined;
  ActiveTab: undefined;
  OutboxTab: undefined;
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type OrderDetailRouteProp = RouteProp<RootStackParamList, 'OrderDetail'>;
export type ProofModalRouteProp = RouteProp<RootStackParamList, 'ProofOfDeliveryModal'>;
export type FailureModalRouteProp = RouteProp<RootStackParamList, 'FailureReasonModal'>;

