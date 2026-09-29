import React, { createContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null); // New state for profile data

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const user = await AsyncStorage.getItem('userData');
      if (token) {
        setUserToken(token);
        if (user) setUserData(JSON.parse(user));
      }
    } catch (e) {
      console.error("Failed to fetch token", e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkToken();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'field_officer' })
      });
      
      const data = await response.json();

      if (response.ok && data.token) {
        await AsyncStorage.setItem('userToken', data.token);
        // Save the user profile object returned by the backend
        if (data.user) {
          await AsyncStorage.setItem('userData', JSON.stringify(data.user));
          setUserData(data.user);
        }
        setUserToken(data.token);
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Cannot connect to the server.');
      console.error(error);
    }
  };

  const logout = async () => {
    // 1. Remove user credentials
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    
    // 2. Wipe the local offline database so the next user starts fresh
    await AsyncStorage.removeItem('@pending_tasks');
    await AsyncStorage.removeItem('@completed_tasks');
    await AsyncStorage.removeItem('@offline_queue');

    // 3. Reset state
    setUserToken(null);
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ login, logout, isLoading, userToken, userData }}>
      {children}
    </AuthContext.Provider>
  );
};