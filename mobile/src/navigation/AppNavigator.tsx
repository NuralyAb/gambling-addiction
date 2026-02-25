import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { colors } from '../constants/theme';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import DiaryScreen from '../screens/DiaryScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Diary: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgSecondary,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontFamily: 'Inter_500Medium' },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: 'shield-checkmark',
            Diary: 'journal',
            Settings: 'settings',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Защита' }} />
      <Tab.Screen name="Diary" component={DiaryScreen} options={{ title: 'Дневник' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Настройки' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
