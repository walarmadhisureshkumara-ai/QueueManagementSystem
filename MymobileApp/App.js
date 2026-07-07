import React, { useEffect, useReducer, useMemo, createContext, useContext, useState } from 'react';
import { View, Text, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import MyTokenScreen from './src/screens/MyTokenScreen';
import QueueHistoryScreen from './src/screens/QueueHistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CounterSelectionScreen from './src/screens/CounterSelectionScreen';
import TokenDetailsScreen from './src/screens/TokenDetailsScreen';
import { COLORS } from './src/config';
import { getUnreadCount } from './src/notifications';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
export const AuthContext = createContext(null);

function TabBarIcon({ label, focused, badge }) {
  const icons = { Home: '🏠', 'My Token': '🎫', Queue: '📋', Profile: '👤' };
  return (
    <View style={{ alignItems: 'center', position: 'relative' }}>
      <Text style={{ fontSize: focused ? 22 : 20 }}>{icons[label] || '📌'}</Text>
      {badge > 0 && label === 'Profile' && (
        <View style={{
          position: 'absolute', top: -4, right: -10,
          backgroundColor: COLORS.accent, borderRadius: 8,
          minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center',
          paddingHorizontal: 4,
        }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

function MainTabs() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const load = async () => { setUnreadCount(await getUnreadCount()); };
    load();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });
    const iv = setInterval(load, 5000);
    return () => { sub?.remove(); clearInterval(iv); };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabBarIcon label={route.name} focused={focused} badge={route.name === 'Profile' ? unreadCount : 0} />,
        tabBarActiveTintColor: COLORS.teal,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          height: 56, paddingBottom: 6, paddingTop: 4,
          backgroundColor: COLORS.white,
          borderTopWidth: 1, borderTopColor: '#E8E8E8',
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="My Token" component={MyTokenScreen} />
      <Tab.Screen name="Queue" component={QueueHistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN': return { ...prevState, userToken: action.payload, isLoading: false };
        case 'SIGN_IN': return { ...prevState, isSignout: false, userToken: action.payload };
        case 'SIGN_OUT': return { ...prevState, isSignout: true, userToken: null };
        default: return prevState;
      }
    },
    { isLoading: true, isSignout: false, userToken: null }
  );

  useEffect(() => {
    (async () => {
      let userToken;
      try { userToken = await AsyncStorage.getItem('userToken'); } catch (e) {}
      dispatch({ type: 'RESTORE_TOKEN', payload: userToken });
    })();
  }, []);

  const authContext = useMemo(() => ({
    signIn: async (data) => {
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('customerId', String(data.customerId));
      await AsyncStorage.setItem('customerName', data.name);
      dispatch({ type: 'SIGN_IN', payload: data.token });
    },
    signOut: async () => {
      await AsyncStorage.multiRemove(['userToken', 'customerId', 'customerName']);
      dispatch({ type: 'SIGN_OUT' });
    },
  }), []);

  if (state.isLoading) return null;

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {state.userToken == null ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen name="CounterSelection" component={CounterSelectionScreen} />
              <Stack.Screen name="TokenDetails" component={TokenDetailsScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
