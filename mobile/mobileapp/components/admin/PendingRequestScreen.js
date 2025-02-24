import React, { useState } from 'react';
import { View, FlatList, TouchableOpacity, Text } from 'react-native';
import { Card } from 'react-native-paper';
import styles from '../styles/adminStyle/PendingRequestStyle';

export default function PendingRequestScreen() {
  const [requests, setRequests] = useState([
    { id: '1', name: 'Nadz', request: 'New Laptop', reason: 'Work necessity', tag: 'INF', status: 'Pending' },
    { id: '2', name: 'Mikmik', request: 'Software Upgrade', reason: 'Security update', tag: 'INF', status: 'Pending' },
    { id: '3', name: 'Dubu', request: 'Monitor Replacement', reason: 'Screen damage', tag: 'MED', status: 'Pending' },
    { id: '4', name: 'Mona', request: 'Keyboard Replacement', reason: 'Keys not working', tag: 'DENT', status: 'Pending' },
    { id: '5', name: 'Neko', request: 'Projector Request', reason: 'Classroom presentation', tag: 'INF', status: 'Pending' },
  ]);

  const updateStatus = (id, newStatus) => {
    setRequests(prevRequests =>
      prevRequests.map(req => (req.id === id ? { ...req, status: newStatus } : req))
    );
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.request}>{item.request}</Text>
        <Text style={styles.reason}>Reason: {item.reason}</Text>

        <View style={styles.tagContainer}>
          <Text style={[styles.tag, styles[item.status.toLowerCase()]]}>{item.tag}</Text>
        </View>

        <Text style={[styles[item.status.toLowerCase()]]}>{item.status}</Text>

        {item.status === 'Pending' && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.approveButton]}
              onPress={() => updateStatus(item.id, 'Approved')}
            >
              <Text style={styles.buttonText}>Approve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={() => updateStatus(item.id, 'Rejected')}
            >
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending Requests</Text>
      <FlatList data={requests} renderItem={renderItem} keyExtractor={item => item.id} />
    </View>
  );
}
