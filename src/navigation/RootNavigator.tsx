import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { Loading } from '../ui/Screen';
import { Icon, IconName } from '../ui/Icon';
import { colors } from '../ui/theme';
import { RootStackParamList, TabParamList } from './types';
import { LoginScreen } from '../screens/LoginScreen';
import { InboxScreen } from '../screens/InboxScreen';
import { ThreadScreen } from '../screens/ThreadScreen';
import { MessageRequestsScreen } from '../screens/MessageRequestsScreen';
import { StoriesScreen } from '../screens/StoriesScreen';
import { StoryViewerScreen } from '../screens/StoryViewerScreen';
import { FollowRequestsScreen } from '../screens/FollowRequestsScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

function tabIcon(name: IconName) {
  return ({ focused }: { focused: boolean }) => (
    <Icon
      name={name}
      size={26}
      color={focused ? colors.accent : colors.textFaint}
      strokeWidth={focused ? 2.2 : 1.8}
    />
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 88,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tab.Screen
        name="Messages"
        component={InboxScreen}
        options={{ title: 'Messages', tabBarIcon: tabIcon('chat') }}
      />
      <Tab.Screen
        name="Stories"
        component={StoriesScreen}
        options={{ title: 'Stories', tabBarIcon: tabIcon('ring') }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Recherche', tabBarIcon: tabIcon('search') }}
      />
      <Tab.Screen
        name="Requests"
        component={FollowRequestsScreen}
        options={{ title: 'Demandes', tabBarIcon: tabIcon('person') }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) return <Loading />;

  return (
    <NavigationContainer theme={navTheme}>
      {!session ? (
        <LoginScreen />
      ) : (
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerShadowVisible: false,
            headerTintColor: colors.accent,
            headerTitleStyle: { color: colors.text, fontWeight: '700', fontSize: 17 },
            headerBackTitleVisible: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="Thread"
            component={ThreadScreen}
            options={({ route }) => ({ title: route.params.title })}
          />
          <Stack.Screen
            name="MessageRequests"
            component={MessageRequestsScreen}
            options={{ title: 'Demandes de message' }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: '' }}
          />
          <Stack.Screen
            name="StoryViewer"
            component={StoryViewerScreen}
            options={{ headerShown: false, presentation: 'fullScreenModal' }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
