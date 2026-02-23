import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeScreen from './screens/HomeScreen';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'top', 'bottom']}>
      <HomeScreen />
    </SafeAreaView>
  );
}