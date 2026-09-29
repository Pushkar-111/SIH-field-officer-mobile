import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';

export default function LoginScreen() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }
    login(email, password);
  };

  return (
    <View style={styles.container}>
      <View style={styles.formWrapper}>
        <Text style={styles.title}>Legal Metrology</Text>
        <Text style={styles.subtitle}>Field Officer Portal</Text>
        
        <Text style={styles.label}>Email Address</Text>
        <TextInput 
          style={styles.input}
          placeholder="officer@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput 
          style={styles.input}
          placeholder="Enter password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f9fafb' },
  formWrapper: { backgroundColor: '#ffffff', padding: 24, borderRadius: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#475569', textAlign: 'center', marginBottom: 32 },
  label: { fontSize: 13, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#f9fafb', borderRadius: 6, padding: 12, marginBottom: 20, fontSize: 15, color: '#0f172a' },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' }
});