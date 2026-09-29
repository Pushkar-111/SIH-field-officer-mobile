import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { DataContext } from '../../context/DataContext';
import { API_BASE_URL } from '../../config';

export default function ProfileScreen() {
  const { logout } = useContext(AuthContext);
  const { completedTasks, offlineQueue } = useContext(DataContext); 
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok && data.user) {
        setProfile(data.user);
      } else {
        const localUser = await AsyncStorage.getItem('userData');
        if (localUser) setProfile(JSON.parse(localUser));
      }
    } catch (err) {
      const localUser = await AsyncStorage.getItem('userData');
      if (localUser) setProfile(JSON.parse(localUser));
    } finally {
      setLoading(false);
    }
  };

  const historyData = [
    ...offlineQueue.map(item => ({ ...item, syncStatus: 'PENDING' })),
    ...completedTasks.map(item => ({ ...item, syncStatus: 'UPLOADED' }))
  ].filter((value, index, self) => self.findIndex(t => t.id === value.id) === index);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return { bg: '#dcfce3', text: '#166534' };
      case 'Rejected': return { bg: '#fee2e2', text: '#b91c1c' };
      case 'Inspection Reported': return { bg: '#dbeafe', text: '#1e40af' };
      default: return { bg: '#f1f5f9', text: '#475569' };
    }
  };

  const renderInspectionCard = ({ item }) => {
    const statusStyle = getStatusColor(item.status);
    const isPending = item.syncStatus === 'PENDING';

    return (
      <View style={styles.inspectionCard}>
        <View style={styles.syncRow}>
          <Ionicons name={isPending ? 'cloud-offline' : 'cloud-done'} size={14} color={isPending ? '#ea580c' : '#166534'} />
          <Text style={[styles.syncText, { color: isPending ? '#ea580c' : '#166534' }]}>
            {isPending ? 'Waiting for internet...' : 'Uploaded to Server'}
          </Text>
        </View>
        <View style={styles.cardHeader}>
          <Text style={styles.businessName}>{item.name}</Text>
          <Text style={styles.timeText}>{item.inspection_date}</Text>
        </View>
        <Text style={styles.instrumentText}>{item.instrument}</Text>
        <View style={styles.footerRow}>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>{item.status}</Text>
          </View>
          {item.certificateNo !== "N/A" && (
             <Text style={styles.certText}>Cert: {item.certificateNo}</Text>
          )}
        </View>
      </View>
    );
  };

  const ListHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.identityCard}>
        <Ionicons name="person-circle" size={80} color="#94a3b8" style={styles.avatar} />
        <Text style={styles.officerName}>
          {profile?.name || (profile?.email ? profile.email.split('@')[0].toUpperCase() : 'Officer')}
        </Text>
        <Text style={styles.officerId}>
          ID: {profile?.employeeCode || profile?.id?.substring(0, 8) || 'FO-ACTIVE'}
        </Text>
        <View style={styles.regionRow}>
          <Ionicons name="location" size={14} color="#64748b" />
          <Text style={styles.regionText}>
            {profile?.assignedJurisdiction || 'Assigned Circle'}
          </Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Ionicons name="checkmark-circle" size={28} color="#166534" style={styles.metricIcon} />
          <Text style={styles.metricNumber}>{completedTasks.length}</Text>
          <Text style={styles.metricLabel}>Completed Today</Text>
        </View>
        <View style={styles.metricBox}>
          <Ionicons name="cloud-offline" size={28} color="#ef4444" style={styles.metricIcon} />
          <Text style={[styles.metricNumber, offlineQueue.length > 0 ? styles.alertNumber : null]}>
            {offlineQueue.length}
          </Text>
          <Text style={styles.metricLabel}>Pending upload</Text>
          <Text style={styles.metricSubtext}>(Waiting for internet)</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Inspection History</Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1, backgroundColor: '#f1f5f9' }} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={historyData}
        keyExtractor={(item) => item.id}
        renderItem={renderInspectionCard}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 20, marginBottom: 20, color: '#64748b' }}>
            No inspections completed yet.
          </Text>
        }
        ListFooterComponent={() => (
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutButtonText}>Secure Logout</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  listContent: { padding: 16, paddingBottom: 30 },
  headerContainer: { marginBottom: 16 },
  identityCard: { backgroundColor: '#ffffff', borderRadius: 8, padding: 24, alignItems: 'center', marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  avatar: { marginBottom: 12 },
  officerName: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  officerId: { fontSize: 14, color: '#475569', fontWeight: '600', marginBottom: 8 },
  regionRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  regionText: { fontSize: 14, color: '#64748b' },
  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  metricBox: { flex: 1, flexDirection: 'column', backgroundColor: '#ffffff', padding: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  metricIcon: { marginBottom: 8 },
  metricNumber: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  alertNumber: { color: '#ef4444' },
  metricLabel: { fontSize: 12, color: '#64748b', textAlign: 'center', fontWeight: '600' },
  metricSubtext: { fontSize: 10, color: '#94a3b8', fontStyle: 'italic', marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  inspectionCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 8, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  syncRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 6 },
  syncText: { fontSize: 12, fontWeight: '600' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  businessName: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1 },
  timeText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  instrumentText: { fontSize: 13, color: '#475569', marginBottom: 12 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  certText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginTop: 20, borderWidth: 1, borderColor: '#ef4444', borderRadius: 8, gap: 8 },
  logoutButtonText: { color: '#ef4444', fontSize: 15, fontWeight: '600' }
});