import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef(null);
  const navigation = useNavigation();
  const route = useRoute();

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera access is required for inspections.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current && !isProcessing) {
      setIsProcessing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
        
        // Trigger the callback to pass the URI back to the existing screen
        if (route.params?.onPhotoTaken) {
          route.params.onPhotoTaken(photo.uri);
        }
        
        // Cleanly pop the camera off the navigation stack
        navigation.goBack();
      } catch (error) {
        console.error("Failed to take photo:", error);
        setIsProcessing(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef} />
      
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>Cancel</Text>
        </TouchableOpacity>
        
        <View style={styles.captureContainer}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture} disabled={isProcessing}>
            {isProcessing ? <ActivityIndicator color="#000" /> : <View style={styles.captureInnerCircle} />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  permissionText: { fontSize: 16, marginBottom: 20, color: '#0f172a' },
  permissionButton: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8 },
  permissionButtonText: { color: '#fff', fontWeight: 'bold' },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent', justifyContent: 'space-between', padding: 20 },
  closeButton: { alignSelf: 'flex-start', marginTop: 30, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 6 },
  closeText: { color: '#fff', fontWeight: '600' },
  captureContainer: { alignSelf: 'center', marginBottom: 40 },
  captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  captureInnerCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', borderWidth: 2, borderColor: '#000' }
});