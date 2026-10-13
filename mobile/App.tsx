import React from 'react';
import { LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import { AppNavigator } from './src/navigation/AppNavigator';

LogBox.ignoreLogs([
  'source.uri should not be an empty string',
]);

export default function App() {
  return <SafeAreaProvider><AppProvider><NavigationContainer><StatusBar style="dark"/><AppNavigator/></NavigationContainer></AppProvider></SafeAreaProvider>;
}
