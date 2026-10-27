import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { RootStackParamList, MainTabParamList } from './src/types/navigation';
import { ManifestListScreen } from './src/screens/ManifestListScreen';
import { OrderDetailScreen } from './src/screens/OrderDetailScreen';
import { OutboxInspectorScreen } from './src/screens/OutboxInspectorScreen';
import { initializeAutoSync } from './src/sync/syncWorker';
import { useOutboxStore } from './src/sync/useOutboxStore';
import { useOrdersQuery } from './src/api/queries';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Active Delivery Tab shortcut screen
function ActiveDeliveryTabScreen({ navigation }: any) {
  const { data: orders = [] } = useOrdersQuery();
  const active = orders.find((o) => o.status === 'EN_ROUTE' || o.status === 'ARRIVED');

  useEffect(() => {
    if (active) {
      navigation.navigate('OrderDetail', { orderId: active.id });
    } else {
      navigation.navigate('ManifestTab');
    }
  }, [active, navigation]);

  return <View style={{ flex: 1, backgroundColor: '#0F172A' }} />;
}

function MainTabNavigator() {
  const queue = useOutboxStore((s) => s.queue);
  const pendingCount = queue.filter((q) => q.status === 'PENDING' || q.status === 'FAILED').length;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopColor: '#1E293B',
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#38BDF8',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'cube-outline';
          if (route.name === 'ManifestTab') iconName = 'list';
          else if (route.name === 'ActiveTab') iconName = 'navigate';
          else if (route.name === 'OutboxTab') iconName = 'cloud-upload';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="ManifestTab"
        component={ManifestListScreen}
        options={{ tabBarLabel: 'Manifest' }}
      />
      <Tab.Screen
        name="ActiveTab"
        component={ActiveDeliveryTabScreen}
        options={{ tabBarLabel: 'Active Stop' }}
      />
      <Tab.Screen
        name="OutboxTab"
        component={OutboxInspectorScreen}
        options={{
          tabBarLabel: 'Outbox',
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#D97706', color: '#FFFFFF', fontSize: 10 },
        }}
      />
    </Tab.Navigator>
  );
}

const isWeb = Platform.OS === 'web';

export default function App() {
  useEffect(() => {
    initializeAutoSync(queryClient);
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <View style={isWeb ? styles.webWrapper : styles.nativeWrapper}>
          <View style={isWeb ? styles.webAppContainer : styles.nativeAppContainer}>
            <NavigationContainer>
              <StatusBar style="light" />
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="MainTabs" component={MainTabNavigator} />
                <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
                <Stack.Screen name="OutboxInspector" component={OutboxInspectorScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </View>
        </View>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  nativeWrapper: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  nativeAppContainer: {
    flex: 1,
  },
  webWrapper: {
    flex: 1,
    backgroundColor: '#090D16',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  webAppContainer: {
    width: '100%',
    maxWidth: 580,
    height: '100%',
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
  },
});
