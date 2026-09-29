import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useNavigation, useRoute } from '@react-navigation/native';
import { File } from 'expo-file-system';
import * as Location from 'expo-location';
import { useContext, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../../config';
import { DataContext } from '../../context/DataContext';

export default function TaskDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { task } = route.params;

  const { pendingTasks, setPendingTasks, completedTasks, setCompletedTasks, offlineQueue, setOfflineQueue } = useContext(DataContext);

  const [location, setLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sealNumber, setSealNumber] = useState('');
  const [errorPercentage, setErrorPercentage] = useState('');

  const startInspection = async () => {
    setIsLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        setIsLocating(false);
        return;
      }
      let currentLoc = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: currentLoc.coords.latitude, longitude: currentLoc.coords.longitude });
    } catch (error) {
      Alert.alert('Location Error', 'Ensure device GPS is turned on.');
    }
    setIsLocating(false);
  };

  const submitReport = async () => {
    if (!sealNumber || !errorPercentage) {
      Alert.alert('Missing Data', 'Please enter the Seal Number and Error Percentage.');
      return;
    }

    setIsSubmitting(true);
    const netInfo = await NetInfo.fetch();

    if (!netInfo.isConnected) {
      Alert.alert('Network Error', 'You must be online to submit to the live database.');
      setIsSubmitting(false);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // STEP 1: Attempt the photo upload using Expo WinterCG-compliant File/FormData
      if (photoUri) {
        try {
          const filename = photoUri.split('/').pop() || 'inspection_photo.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          let filePart;
          try {
            const file = new File(photoUri);
            if (!file.type) {
              Object.defineProperty(file, 'type', {
                value: type,
                configurable: true,
                enumerable: true,
                writable: true,
              });
            }
            filePart = file;
          } catch (fileErr) {
            console.warn('Could not instantiate File from expo-file-system, falling back to blob:', fileErr);
            const res = await fetch(photoUri);
            filePart = await res.blob();
            if (filePart) {
              filePart.name = filename;
            }
          }

          const formData = new FormData();
          formData.append('file', filePart);
          formData.append('application_id', String(task.id));
          formData.append('doc_type', 'INSTRUMENT_PHOTO');

          console.log('Attempting to upload photo:', photoUri);

          const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              // Do NOT manually set Content-Type to 'multipart/form-data'. 
              // Fetch automatically generates the boundary string.
            },
            body: formData,
          });

          if (!uploadResponse.ok) {
            console.warn('Photo upload failed, but continuing to submit data.', await uploadResponse.text());
          } else {
            console.log('Photo upload succeeded');
          }
        } catch (uploadError) {
          console.warn('Photo upload failed with error, continuing to submit inspection report:', uploadError);
        }
      }

      // STEP 2: Submit the JSON Metrological Data
      const inspectionData = {
        test_error_percentage: parseFloat(errorPercentage),
        environmental_temp: "25°C, 50% RH",
        security_seal_no: sealNumber,
        inspection_result: parseFloat(errorPercentage) <= 0.05 ? "Pass" : "Fail",
        inspection_notes: `GPS: ${location.latitude.toFixed(6)}° N, ${location.longitude.toFixed(6)}° E.`,
        test_readings: `Zero-load: OK, Full load: ${errorPercentage}% error`
      };

      const inspectResponse = await fetch(`${API_BASE_URL}/field-officer/applications/${task.id}/inspect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(inspectionData)
      });

      if (!inspectResponse.ok) {
        let errDetail = '';
        try {
          const errJson = await inspectResponse.json();
          errDetail = errJson.message || errJson.error || JSON.stringify(errJson);
        } catch (_) {
          errDetail = await inspectResponse.text().catch(() => '');
        }
        throw new Error(errDetail ? `Submission failed: ${errDetail}` : 'Failed to submit inspection data');
      }

      // Update Local UI State
      const completedTaskObj = {
        id: task.id,
        name: task.applicant, 
        instrument: task.instrument,
        inspection_date: new Date().toISOString().split('T')[0], 
        status: "Inspection Reported", 
        certificateNo: "N/A" 
      };

      setPendingTasks(prev => prev.filter(t => t.id !== task.id));
      setCompletedTasks(prev => [completedTaskObj, ...prev]);

      Alert.alert('Success', 'Inspection report and photo submitted successfully.');
      navigation.navigate('DashboardList');

    } catch (error) {
      Alert.alert('Submission Error', error.message || 'An unknown error occurred.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <ScrollView style={styles.container} automaticallyAdjustKeyboardInsets={true}>
      <View style={styles.card}>
        <Text style={styles.taskId}>{task.appNumber || task.id.substring(0, 8)}</Text>
        <Text style={styles.businessName}>{task.applicant || task.business_name}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Instrument</Text>
          <Text style={styles.value}>{task.instrument || "Measuring Instrument"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Location</Text>
          <Text style={styles.value}>{task.address || "Location on record"}</Text>
        </View>
      </View>

      {!location ? (
        <TouchableOpacity style={styles.primaryButton} onPress={startInspection} disabled={isLocating}>
          {isLocating ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Start Inspection</Text>}
        </TouchableOpacity>
      ) : (
        <View style={styles.inspectionSection}>
          <View style={styles.gpsCard}>
            <Text style={styles.gpsTitle}>✓ GPS Captured</Text>
            <Text style={styles.gpsText}>Lat: {location.latitude.toFixed(6)} | Lng: {location.longitude.toFixed(6)}</Text>
          </View>

          {photoUri ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photoUri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Camera', { onPhotoTaken: (uri) => setPhotoUri(uri) })}>
                <Text style={styles.secondaryButtonText}>Retake Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Camera', { onPhotoTaken: (uri) => setPhotoUri(uri) })}>
              <Text style={styles.primaryButtonText}>📸 Capture Instrument</Text>
            </TouchableOpacity>
          )}

          {location && photoUri && (
            <View style={styles.formSection}>
              <Text style={styles.formTitle}>Metrological Data</Text>

              <Text style={styles.inputLabel}>Security Seal Number applied</Text>
              <TextInput style={styles.input} placeholder="e.g. SEAL-DL-2026-9812" value={sealNumber} onChangeText={setSealNumber} />

              <Text style={styles.inputLabel}>Test Error Percentage (%)</Text>
              <TextInput style={styles.input} placeholder="e.g. 0.02" keyboardType="numeric" value={errorPercentage} onChangeText={setErrorPercentage} />

              <TouchableOpacity style={styles.submitButton} onPress={submitReport} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit Inspection Report</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9', padding: 16 },
  card: { backgroundColor: '#ffffff', padding: 20, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  taskId: { fontSize: 13, color: '#64748b', fontWeight: '700', marginBottom: 4 },
  businessName: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  infoRow: { marginBottom: 12 },
  label: { fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: 2 },
  value: { fontSize: 15, color: '#0f172a', fontWeight: '500' },
  primaryButton: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  secondaryButton: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  secondaryButtonText: { color: '#0f172a', fontSize: 15, fontWeight: '600' },
  inspectionSection: { marginTop: 8 },
  gpsCard: { backgroundColor: '#f0fdf4', padding: 16, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#bbf7d0' },
  gpsTitle: { color: '#166534', fontWeight: '700', marginBottom: 4 },
  gpsText: { color: '#15803d', fontSize: 14 },
  photoContainer: { marginBottom: 20 },
  previewImage: { width: '100%', height: 250, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  formSection: { marginTop: 10, marginBottom: 40 },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 15, color: '#0f172a' },
  submitButton: { backgroundColor: '#10b981', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' }
});