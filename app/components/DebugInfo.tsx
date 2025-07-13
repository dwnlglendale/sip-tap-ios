import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function DebugInfo() {
  const { user, profile, loading, clearSession } = useAuth();

  if (!__DEV__) return null;

  const handleClearSession = () => {
    Alert.alert(
      'Clear Session',
      'This will clear the current authentication session. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearSession();
              Alert.alert('Success', 'Session cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear session');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Info</Text>
      <Text style={styles.text}>Loading: {loading ? 'true' : 'false'}</Text>
      <Text style={styles.text}>User: {user ? user.email : 'null'}</Text>
      <Text style={styles.text}>Profile: {profile ? profile.username : 'null'}</Text>
      <Text style={styles.text}>User ID: {user ? user.id : 'null'}</Text>
      <Text style={styles.text}>Profile ID: {profile ? profile.id : 'null'}</Text>
      <Text style={styles.text}>Created: {user ? new Date(user.created_at).toLocaleDateString() : 'null'}</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleClearSession}>
        <Text style={styles.buttonText}>Clear Session</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 8,
    maxWidth: 250,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  text: {
    color: 'white',
    fontSize: 12,
    marginBottom: 2,
  },
  button: {
    backgroundColor: '#ff4444',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },
}); 