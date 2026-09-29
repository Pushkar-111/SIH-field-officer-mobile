import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DataContext = createContext();

const INITIAL_TASKS = [
  {
    id: "d66d816a-9a76-4f2f-abf2-752f545dae79",
    appNumber: "APP-2026-001",
    applicant: "Reliance Fresh",
    instrument: "Electronic Scale",
    address: "District A, Guwahati",
    priority: "High",
    status: "Under Inspection"
  },
  {
    id: "e55e816a-9a76-4f2f-abf2-752f545dae80",
    appNumber: "APP-2026-002",
    applicant: "Indian Oil",
    instrument: "Fuel Dispenser",
    address: "District B, Guwahati",
    priority: "Normal",
    status: "Under Inspection"
  }
];

export const DataProvider = ({ children }) => {
  const [pendingTasks, setPendingTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Load data from phone storage when app starts
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedPending = await AsyncStorage.getItem('@pending_tasks');
        const storedCompleted = await AsyncStorage.getItem('@completed_tasks');
        const storedQueue = await AsyncStorage.getItem('@offline_queue');

        // If it's the first time opening the app, use the initial tasks
        if (storedPending !== null) {
          setPendingTasks(JSON.parse(storedPending));
        } else {
          setPendingTasks(INITIAL_TASKS);
          await AsyncStorage.setItem('@pending_tasks', JSON.stringify(INITIAL_TASKS));
        }

        if (storedCompleted) setCompletedTasks(JSON.parse(storedCompleted));
        if (storedQueue) setOfflineQueue(JSON.parse(storedQueue));
        
      } catch (error) {
        console.error("Error loading local data", error);
      }
      setIsDataLoaded(true);
    };

    loadData();
  }, []);

  return (
    <DataContext.Provider value={{ 
      pendingTasks, setPendingTasks, 
      completedTasks, setCompletedTasks,
      offlineQueue, setOfflineQueue,
      isDataLoaded
    }}>
      {children}
    </DataContext.Provider>
  );
};