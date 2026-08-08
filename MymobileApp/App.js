import React, { useEffect, useReducer, useMemo, useState } from 'react'; // Import React core hooks
import { View, Text, AppState } from 'react-native'; // Import React Native components
import { NavigationContainer } from '@react-navigation/native'; // Import navigation container
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // Import stack navigator creator
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; // Import bottom tab navigator creator
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import async storage for persisting data

import LoginScreen from './src/screens/LoginScreen'; // Import Login screen component
import HomeScreen from './src/screens/HomeScreen'; // Import Home screen component
import MyTokenScreen from './src/screens/MyTokenScreen'; // Import My Token screen component
import QueueHistoryScreen from './src/screens/QueueHistoryScreen'; // Import Queue History screen component
import ProfileScreen from './src/screens/ProfileScreen'; // Import Profile screen component
import CounterSelectionScreen from './src/screens/CounterSelectionScreen'; // Import Counter Selection screen component
import TokenDetailsScreen from './src/screens/TokenDetailsScreen'; // Import Token Details screen component
import { COLORS } from './src/config'; // Import color constants
import { getUnreadCount } from './src/notifications'; // Import notification unread count helper
import { AuthContext } from './src/context/AuthContext'; // Import authentication context

const Stack = createNativeStackNavigator(); // Create a stack navigator instance
const Tab = createBottomTabNavigator(); // Create a bottom tab navigator instance

// Custom tab bar icon component with optional badge on Profile tab
function TabBarIcon({ label, focused, badge }) {
  const icons = { Home: '🏠', 'My Token': '🎫', Queue: '📋', Profile: '👤' }; // Map tab labels to emoji icons
  return (
    <View style={{ alignItems: 'center', position: 'relative' }}> {/* Container view for icon and badge */}
      <Text style={{ fontSize: focused ? 22 : 20 }}>{icons[label] || '📌'}</Text> {/* Display icon, larger when focused */}
      {badge > 0 && label === 'Profile' && ( // Show badge only on Profile tab when count > 0
        <View style={{ // Badge container styling
          position: 'absolute', top: -4, right: -10, // Position badge at top-right of icon
          backgroundColor: COLORS.accent, borderRadius: 8, // Accent background with rounded corners
          minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', // Fixed size, centered content
          paddingHorizontal: 4, // Horizontal padding for text
        }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{badge > 9 ? '9+' : badge}</Text> {/* Show capped badge number */}
        </View>
      )}
    </View>
  );
}

// Bottom tab navigator component with 4 tabs
function MainTabs() {
  const [unreadCount, setUnreadCount] = useState(0); // State for unread notification count

  useEffect(() => { // Effect to poll and listen for unread count changes
    const load = async () => { setUnreadCount(await getUnreadCount()); }; // Async function to load unread count
    load(); // Initial load
    const sub = AppState.addEventListener('change', (state) => { // Listen for app state changes
      if (state === 'active') load(); // Reload unread count when app becomes active
    });
    const iv = setInterval(load, 5000); // Poll unread count every 5 seconds
    return () => { sub?.remove(); clearInterval(iv); }; // Cleanup listener and interval on unmount
  }, []);

  return (
    <Tab.Navigator // Configure bottom tab navigator
      screenOptions={({ route }) => ({ // Dynamic screen options per route
        headerShown: false, // Hide default header for all tabs
        tabBarIcon: ({ focused }) => <TabBarIcon label={route.name} focused={focused} badge={route.name === 'Profile' ? unreadCount : 0} />, // Custom icon with badge on Profile
        tabBarActiveTintColor: COLORS.teal, // Active tab icon/label color
        tabBarInactiveTintColor: COLORS.gray, // Inactive tab icon/label color
        tabBarStyle: { // Tab bar styling
          height: 56, paddingBottom: 6, paddingTop: 4, // Tab bar dimensions and padding
          backgroundColor: COLORS.white, // White background
          borderTopWidth: 1, borderTopColor: '#E8E8E8', // Subtle top border
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' }, // Tab label text style
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="My Token" component={MyTokenScreen} />
      <Tab.Screen name="Queue" component={QueueHistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Root app component with auth state management
export default function App() {
  const [state, dispatch] = useReducer( // useReducer for auth state management
    (prevState, action) => { // Reducer function
      switch (action.type) { // Handle action types
        case 'RESTORE_TOKEN': return { ...prevState, userToken: action.payload, isLoading: false }; // Restore token on app launch
        case 'SIGN_IN': return { ...prevState, isSignout: false, userToken: action.payload }; // Handle sign in
        case 'SIGN_OUT': return { ...prevState, isSignout: true, userToken: null }; // Handle sign out
        default: return prevState; // Return unchanged state for unknown actions
      }
    },
    { isLoading: true, isSignout: false, userToken: null } // Initial state: loading, not signed out, no token
  );

  useEffect(() => { // Effect to restore persisted auth token on mount
    (async () => { // Immediately-invoked async function
      let userToken; // Variable for stored token
      try { userToken = await AsyncStorage.getItem('userToken'); } catch (e) {} // Retrieve token from storage (silent fail)
      dispatch({ type: 'RESTORE_TOKEN', payload: userToken }); // Dispatch restore action with token
    })();
  }, []);

  const authContext = useMemo(() => ({ // Memoized auth context value
    signIn: async (data) => { // Sign in function
      await AsyncStorage.setItem('userToken', data.token); // Persist token
      await AsyncStorage.setItem('customerId', String(data.customerId)); // Persist customer ID
      await AsyncStorage.setItem('customerName', data.name); // Persist customer name
      dispatch({ type: 'SIGN_IN', payload: data.token }); // Dispatch sign in action
    },
    signOut: async () => { // Sign out function
      await AsyncStorage.multiRemove(['userToken', 'customerId', 'customerName']); // Remove all persisted auth data
      dispatch({ type: 'SIGN_OUT' }); // Dispatch sign out action
    },
  }), []); // Empty dependency array — never re-creates

  if (state.isLoading) return null; // Render nothing while checking stored token

  return (
    <AuthContext.Provider value={authContext}> {/* Provide auth context to all children */}
      <NavigationContainer> {/* Wrap in navigation container */}
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {state.userToken == null ? ( // If no token, show login screen
            <Stack.Screen name="Login" component={LoginScreen} /> // Login screen
          ) : ( // Otherwise show main app screens
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
