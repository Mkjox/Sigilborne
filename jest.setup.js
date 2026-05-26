/* eslint-disable no-undef */
const React = require('react');

// Matchers
require('@testing-library/jest-native/extend-expect');

// Mock Reanimated
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Mock Linear Gradient
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: (props) => React.createElement(View, props),
  };
});

// Mock Skia
jest.mock('@shopify/react-native-skia', () => ({
  Canvas: () => null,
  Rect: () => null,
  Circle: () => null,
  Path: () => null,
  Text: () => null,
  Group: ({ children }) => children,
  useFont: () => null,
  Skia: {
    RuntimeEffect: { Make: jest.fn() },
    Shader: jest.fn(),
  }
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
}));

// Mock Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

