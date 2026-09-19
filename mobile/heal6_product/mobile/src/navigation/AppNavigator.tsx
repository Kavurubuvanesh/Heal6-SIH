import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { RootStackParamList, MainTabParamList, ScanStackParamList, ROUTES } from './routes';
import AuthScreen from '../screens/AuthScreen';
import { ProfileSetupScreen } from '../screens/ProfileSetupScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { PatientHistoryScreen } from '../screens/PatientHistoryScreen';
import { GuideScreen } from '../screens/GuideScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AppointmentScreen } from '../screens/AppointmentScreen';
import { ScannerInstructionsScreen } from '../screens/ScannerInstructionsScreen';
import { CameraScanScreen } from '../screens/CameraScanScreen';
import { ImageReviewScreen } from '../screens/ImageReviewScreen';
import { ClinicalIntakeScreen } from '../screens/ClinicalIntakeScreen';
import { AnalysisLoadingScreen } from '../screens/AnalysisLoadingScreen';
import { ResultSummaryScreen } from '../screens/ResultSummaryScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const ScanStack = createNativeStackNavigator<ScanStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function ScanStackNavigator() {
  return <ScanStack.Navigator screenOptions={{ headerShown: false }}>
    <ScanStack.Screen name={ROUTES.SCANNER_INSTRUCTIONS} component={ScannerInstructionsScreen}/>
    <ScanStack.Screen name={ROUTES.CAMERA_SCAN} component={CameraScanScreen}/>
    <ScanStack.Screen name={ROUTES.IMAGE_REVIEW} component={ImageReviewScreen}/>
    <ScanStack.Screen name={ROUTES.CLINICAL_INTAKE} component={ClinicalIntakeScreen}/>
    <ScanStack.Screen name={ROUTES.ANALYSIS_LOADING} component={AnalysisLoadingScreen}/>
    <ScanStack.Screen name={ROUTES.RESULT_SUMMARY} component={ResultSummaryScreen}/>
  </ScanStack.Navigator>;
}

import { useApp } from '../context/AppContext';
import { getDictionary } from '../constants/i18n';

function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 8;
  const { language } = useApp();
  const t = getDictionary(language);

  return <Tab.Navigator screenOptions={({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: Colors.primaryTeal,
    tabBarInactiveTintColor: Colors.textMuted,
    tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginBottom: insets.bottom > 0 ? 0 : 3 },
    tabBarStyle: {
      height: 58 + bottomPadding,
      paddingTop: 6,
      paddingBottom: bottomPadding,
      borderTopColor: Colors.border,
      backgroundColor: Colors.white,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    tabBarIcon: ({ color, size }) => {
      const icon: keyof typeof Ionicons.glyphMap = route.name === ROUTES.HOME ? 'home-outline' : route.name === ROUTES.SCAN ? 'camera-outline' : route.name === ROUTES.HISTORY ? 'document-text-outline' : route.name === ROUTES.GUIDE ? 'book-outline' : 'person-outline';
      return <Ionicons name={icon} size={size} color={color}/>;
    },
  })}>
    <Tab.Screen name={ROUTES.HOME} component={HomeScreen} options={{ tabBarLabel: t.home || 'Home' }}/>
    <Tab.Screen name={ROUTES.SCAN} component={ScanStackNavigator} options={{ unmountOnBlur: true, tabBarLabel: t.scan || 'Scan' }}/>
    <Tab.Screen name={ROUTES.HISTORY} component={PatientHistoryScreen} options={{ tabBarLabel: t.reports || 'Reports' }}/>
    <Tab.Screen name={ROUTES.GUIDE} component={GuideScreen} options={{ tabBarLabel: t.guide || 'Guide' }}/>
    <Tab.Screen name={ROUTES.PROFILE} component={ProfileScreen} options={{ tabBarLabel: t.profile || 'Profile' }}/>
  </Tab.Navigator>;
}

export const AppNavigator = () => <RootStack.Navigator screenOptions={{ headerShown:false }} initialRouteName={ROUTES.AUTH}>
  <RootStack.Screen name={ROUTES.AUTH} component={AuthScreen}/>
  <RootStack.Screen name={ROUTES.PROFILE_SETUP} component={ProfileSetupScreen}/>
  <RootStack.Screen name={ROUTES.MAIN_APP} component={MainTabNavigator}/>
  <RootStack.Screen name={ROUTES.APPOINTMENT} component={AppointmentScreen}/>
</RootStack.Navigator>;
