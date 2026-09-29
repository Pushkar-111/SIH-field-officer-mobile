import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config';

export default function DashboardScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const fetchTasks = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/field-officer/tasks`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.tasks) {
        // Backend filters tasks by the logged-in officer's token
        const activeTasks = data.tasks.filter(t => t.status === 'Under Inspection');
        setTasks(activeTasks);
      } else {
        console.warn("No tasks array returned:", data);
        setTasks([]);
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Could not reach the server to fetch assigned tasks.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const getPriorityStyle = (priority) => {
    return priority === 'High' ? { bg: '#fee2e2', text: '#b91c1c' } : { bg: '#d1fae5', text: '#065f46' };
  };

  const renderTask = ({ item }) => {
    const priorityStyle = getPriorityStyle(item.priority);
    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.7}
        onPress={() => navigation.navigate('TaskDetail', { task: item })}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.taskId}>{item.appNumber || item.id.substring(0, 8)}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: priorityStyle.bg }]}>
                <Text style={[styles.badgeText, { color: priorityStyle.text }]}>
                  {item.priority === 'High' ? 'URGENT' : 'NORMAL'}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#d1fae5' }]}>
                <Text style={[styles.badgeText, { color: '#065f46' }]}>{item.status}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.businessName}>{item.applicant || item.business_name || "Enterprise"}</Text>
          <Text style={styles.detailText}>📍 {item.address || "Location on record"}</Text>
          <Text style={styles.detailText}>⚖️ {item.instrument || "Measuring Instrument"}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1, backgroundColor: '#f1f5f9' }} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{tasks.length}</Text>
          <Text style={styles.statLabel}>Pending Assignments</Text>
        </View>
      </View>

      <FlatList 
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={48} color="#94a3b8" />
            <Text style={styles.emptyText}>No tasks assigned under inspection.</Text>
            <Text style={styles.emptySubtext}>Pull down to refresh after LMO assigns a task.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  statsContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  statBox: { flex: 1, backgroundColor: '#ffffff', padding: 16, borderRadius: 8, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  statNumber: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  statLabel: { fontSize: 13, color: '#475569', marginTop: 4 },
  listContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 8, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  cardContent: { flex: 1 }, 
  chevron: { marginLeft: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  taskId: { fontSize: 12, color: '#475569', fontWeight: '600' },
  badgeRow: { flexDirection: 'row', gap: 6 }, 
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  businessName: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  detailText: { fontSize: 13, color: '#475569', marginBottom: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#475569', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#94a3b8', marginTop: 4 }
});