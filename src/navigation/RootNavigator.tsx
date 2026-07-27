import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { Loading } from '../ui/Screen';
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
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{label}</Text>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="Messages"
        component={InboxScreen}
        options={{
          title: 'Messages',
          tabBarIcon: ({ focused }) => <TabIcon label="✉️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Stories"
        component={StoriesScreen}
        options={{
          title: 'Stories',
          tabBarIcon: ({ focused }) => <TabIcon label="⭕" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'Recherche',
          tabBarIcon: ({ focused }) => <TabIcon label="🔍" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Requests"
        component={FollowRequestsScreen}
        options={{
          title: 'Demandes',
          tabBarIcon: ({ focused }) => <TabIcon label="👤" focused={focused} />,
        }}
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
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen
            name="Tabs"
            component={Tabs}
            options={{ headerShown: false }}
          />
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
            options={({ route }) => ({ title: route.params.username })}
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
