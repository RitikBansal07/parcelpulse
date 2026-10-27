// Jest setup for React Native & Expo in ParcelPulse

// In-memory mock for AsyncStorage
const mockStorageStore = new Map();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (key) => mockStorageStore.get(key) ?? null),
  setItem: jest.fn(async (key, value) => {
    mockStorageStore.set(key, String(value));
  }),
  removeItem: jest.fn(async (key) => {
    mockStorageStore.delete(key);
  }),
  clear: jest.fn(async () => {
    mockStorageStore.clear();
  }),
  getAllKeys: jest.fn(async () => Array.from(mockStorageStore.keys())),
  multiGet: jest.fn(async (keys) =>
    keys.map((k) => [k, mockStorageStore.get(k) ?? null])
  ),
  multiSet: jest.fn(async (keyValuePairs) => {
    keyValuePairs.forEach(([key, value]) => mockStorageStore.set(key, String(value)));
  }),
  multiRemove: jest.fn(async (keys) => {
    keys.forEach((key) => mockStorageStore.delete(key));
  }),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props) => React.createElement(View, { ...props, testID: props.testID || 'icon-mock' }),
    Ionicons: (props) => React.createElement(View, { ...props, testID: props.testID || 'icon-mock' }),
    Feather: (props) => React.createElement(View, { ...props, testID: props.testID || 'icon-mock' }),
    FontAwesome5: (props) => React.createElement(View, { ...props, testID: props.testID || 'icon-mock' }),
  };
});

