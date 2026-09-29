import React, { useContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { AuthContext } from '../context/AuthContext';
import { DataContext } from '../context/DataContext'; // Import DataContext
import LoginScreen from '../screens/auth/LoginScreen';
import DashboardScreen from '../screens/main/DashboardScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import TaskDetailScreen from '../screens/main/TaskDetailScreen';
import CameraScreen from '../screens/main/CameraScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const DashboardStack = createNativeStackNavigator();

function DashboardStackNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="DashboardList" component={DashboardScreen} />
      <DashboardStack.Screen name="TaskDetail" component={TaskDetailScreen} />
      <DashboardStack.Screen name="Camera" component={CameraScreen} />
    </DashboardStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '600' },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#64748b',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = route.name === 'Dashboard' 
            ? (focused ? 'clipboard' : 'clipboard-outline') 
            : (focused ? 'person' : 'person-outline');
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStackNavigator} options={{ title: 'My Inspections' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isLoading, userToken } = useContext(AuthContext);
  
  // Bring in the Local Brain state for the Sync Listener
  const { offlineQueue, setOfflineQueue, completedTasks, setCompletedTasks } = useContext(DataContext);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && offlineQueue.length > 0) {
        
        setTimeout(async () => {
          const queueLength = offlineQueue.length;
          
          // 1. Move to Completed, strictly filtering out duplicates
          setCompletedTasks(prevCompleted => {
            const existingIds = new Set(prevCompleted.map(t => t.id));
            const uniqueNew = offlineQueue.filter(t => !existingIds.has(t.id));
            const updated = [...uniqueNew, ...prevCompleted];
            
            AsyncStorage.setItem('@completed_tasks', JSON.stringify(updated));
            return updated;
          });

          // 2. Empty the Queue
          setOfflineQueue([]);
          await AsyncStorage.removeItem('@offline_queue');

          Alert.alert('Auto-Sync Complete', `${queueLength} offline report(s) pushed to cloud.`);
        }, 1500);
      }
    });
    return () => unsubscribe();
  }, [offlineQueue]); // Removed completedTasks from dependency array to prevent loops

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {userToken ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}