import React from 'react';
import { LogBox } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import AppNavigator from './src/navigation/AppNavigator';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppNavigator />
      </DataProvider>
    </AuthProvider>
  );
}