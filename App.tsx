import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { RootNavigator } from './src/navigation';
import { SoundProvider } from './src/context/SoundContext';
import 'react-native-reanimated';
import { useKeepAwake } from 'expo-keep-awake';
import './src/i18n';

export default function App() {
  useKeepAwake();
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <SoundProvider>
          <RootNavigator />
        </SoundProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
