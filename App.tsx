import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { RootNavigator } from './src/navigation';
import { SoundProvider } from './src/context/SoundContext';
import 'react-native-reanimated';
import { useKeepAwake } from 'expo-keep-awake';
import './src/i18n';

// Custom Fonts Pairing 1: The Arch-Mage Arcane
import { useFonts, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';

export default function App() {
  useKeepAwake();

  // Load custom fonts asynchronously
  const [fontsLoaded] = useFonts({
    'Cinzel-Bold': Cinzel_700Bold,
    'Outfit-Regular': Outfit_400Regular,
    'Outfit-SemiBold': Outfit_600SemiBold,
    'Outfit-Bold': Outfit_700Bold,
  });

  // Render a clean, dark-themed loader while fonts load
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B0F14',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
