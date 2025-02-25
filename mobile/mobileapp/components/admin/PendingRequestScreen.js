import React, { useState } from 'react';
import { View, FlatList, TouchableOpacity, Text } from 'react-native';
import { Card } from 'react-native-paper';
import { useRequestList } from '../contexts/RequestListContext';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/adminStyle/PendingRequestStyle';

export default function PendingRequestScreen() {
  const { pendingRequests, moveToPendingRequests } = useRequestList();
  const { user } = useAuth();

  const updateStatus = (id, newStatus) => {
    const updatedRequests = pendingRequests.map(req => 
      req.id === id ? { ...req, status: newStatus } : req
    );
  
    moveToPendingRequests(updatedRequests); 
  };  

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.name}>Requestor: {user?.name || 'Unknown'}</Text>
        <Text style={styles.request}>Item: {item.name}</Text>
        <Text style={styles.reason}>Reason: {item.reason}</Text>
        <Text style={styles.quantity}>Quantity: {item.quantity}</Text>
        <Text style={styles.date}>Date: {item.date}</Text>
        <Text style={styles.modalText}>
            Start Time: {item?.startTime?.hour ?? '--'}:{item?.startTime?.minute ?? '--'} {item?.startTime?.period ?? '--'}
        </Text>
        <Text style={styles.modalText}>
            End Time: {item?.endTime?.hour ?? '--'}:{item?.endTime?.minute ?? '--'} {item?.endTime?.period ?? '--'}
        </Text>
        <Text style={styles.tag}>ID: {item.tags}</Text>

        <Text style={[styles[item.status?.toLowerCase() || 'pending']]}>{item.status || 'Pending'}</Text>

        {(!item.status || item.status.toLowerCase() === 'pending') && (
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
      <FlatList 
        data={pendingRequests} 
        renderItem={renderItem} 
        keyExtractor={(item) => String(item.id)}
      />
    </View>
  );
}
