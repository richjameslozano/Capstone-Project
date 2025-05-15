import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Card } from 'react-native-paper';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../backend/firebase/FirebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/userStyle/RequestStyle';
import Header from '../Header';

export default function DraftRequestScreen() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const { user } = useAuth();

  // const fetchRequests = async () => {
  //   setLoading(true);
  //   try {
  //     if (!user?.uid) throw new Error('User is not logged in.');

  //     const querySnapshot = await getDocs(collection(db, `accounts/${user.id}/userRequests`));
  //     console.log('Fetched docs:', querySnapshot.docs.length);
  //     const fetched = [];

  //     for (const docSnap of querySnapshot.docs) {
  //       const data = docSnap.data();
  //       const enrichedItems = await Promise.all(
  //         (data.filteredMergedData || data.requestList || []).map(async (item) => {
  //           const inventoryId = item.selectedItemId || item.selectedItem?.value;
  //           let itemId = 'N/A';
  //           if (inventoryId) {
  //             try {
  //               const invDoc = await getDoc(doc(db, `inventory/${inventoryId}`));
  //               if (invDoc.exists()) {
  //                 itemId = invDoc.data().itemId || 'N/A';
  //               }
  //             } catch (err) {
  //               console.error(`Error fetching inventory item ${inventoryId}:`, err);
  //             }
  //           }

  //           return {
  //             ...item,
  //             itemIdFromInventory: itemId,
  //           };
  //         })
  //       );

  //       const dateObj = data.timestamp?.toDate?.();
  //       const dateRequested = dateObj ? dateObj : new Date();

  //       fetched.push({
  //         id: docSnap.id,
  //         dateRequested,
  //         dateRequired: data.dateRequired || 'N/A',
  //         requester: data.userName || 'Unknown',
  //         room: data.room || 'N/A',
  //         timeNeeded: `${data.timeFrom || 'N/A'} - ${data.timeTo || 'N/A'}`,
  //         courseCode: data.program || 'N/A',
  //         courseDescription: data.reason || 'N/A',
  //         items: enrichedItems,
  //         status: 'PENDING',
  //         message: data.reason || '',
  //       });
  //     }

  //     const sortedByDate = fetched.sort((a, b) => b.dateRequested - a.dateRequested);

  //     setRequests(sortedByDate);
  //   } catch (err) {
  //     console.error('Error fetching requests:', err);
  //     Alert.alert('Error', 'Failed to fetch user requests.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchRequests = () => {
    setLoading(true);
    try {
      if (!user?.id) throw new Error('User is not logged in.');
  
      // Set up the real-time listener using onSnapshot
      const requestsRef = collection(db, `accounts/${user.id}/userRequests`);
      const unsubscribe = onSnapshot(requestsRef, async (querySnapshot) => {
        console.log('Fetched docs:', querySnapshot.docs.length);
        const fetched = [];
  
        // Loop through each document and enrich the request items
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          const enrichedItems = await Promise.all(
            (data.filteredMergedData || data.requestList || []).map(async (item) => {
              const inventoryId = item.selectedItemId || item.selectedItem?.value;
              let itemId = 'N/A';
              if (inventoryId) {
                try {
                  const invDoc = await getDoc(doc(db, `inventory/${inventoryId}`));
                  if (invDoc.exists()) {
                    itemId = invDoc.data().itemId || 'N/A';
                  }
                  
                } catch (err) {
                  console.error(`Error fetching inventory item ${inventoryId}:`, err);
                }
              }
  
              return {
                ...item,
                itemIdFromInventory: itemId,
              };
            })
          );
  
          const dateObj = data.timestamp?.toDate?.();
          const dateRequested = dateObj ? dateObj : new Date();
  
          fetched.push({
            id: docSnap.id,
            dateRequested,
            dateRequired: data.dateRequired || 'N/A',
            requester: data.userName || 'Unknown',
            room: data.room || 'N/A',
            timeNeeded: `${data.timeFrom || 'N/A'} - ${data.timeTo || 'N/A'}`,
            courseCode: data.program || 'N/A',
            courseDescription: data.reason || 'N/A',
            items: enrichedItems,
            status: 'PENDING',
            message: data.reason || '',
          });
        }
  
        const sortedByDate = fetched.sort((a, b) => b.dateRequested - a.dateRequested);
  
        setRequests(sortedByDate); // Update state with new requests
      });
  
      // Clean up the listener when the component unmounts
      return () => unsubscribe();
  
    } catch (err) {
      console.error('Error fetching requests:', err);
      Alert.alert('Error', 'Failed to fetch user requests.');

    } finally {
      setLoading(false);
    }
  };

  const cancelRequest = async () => {
    try {
      if (!user?.id || !selectedRequest?.id) {
        throw new Error('Missing user ID or selected request ID.');
      }

      const userRequestRef = doc(db, `accounts/${user.id}/userRequests`, selectedRequest.id);
      const activityLogRef = doc(db, `accounts/${user.id}/historylog`, selectedRequest.id);
      const requestSnap = await getDoc(userRequestRef);
      if (!requestSnap.exists()) throw new Error('Request not found.');

      const requestData = requestSnap.data();

      await setDoc(activityLogRef, {
        ...requestData,
        status: 'CANCELLED',
        cancelledAt: new Date(),
      });

      await deleteDoc(userRequestRef);

      const rootQuery = query(
        collection(db, 'userrequests'),
        where('accountId', '==', user.id),
        where('timestamp', '==', requestData.timestamp)
      );

      const rootSnap = await getDocs(rootQuery);
      const batchDeletes = [];

      rootSnap.forEach((docSnap) => {
        batchDeletes.push(deleteDoc(doc(db, 'userrequests', docSnap.id)));
      });

      await Promise.all(batchDeletes);

      Alert.alert('Success', 'Request successfully cancelled.');
      setModalVisible(false);
      fetchRequests();

    } catch (err) {
      console.error('Cancel error:', err);
      Alert.alert('Error', 'Failed to cancel the request.');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => { setSelectedRequest(item); setModalVisible(true); }}>
      <Card style={styles.card}>
        <Text style={styles.requestId}>ID: {item.id}</Text>
        <Text>Date Requested: {item.dateRequested.toLocaleDateString()}</Text>
        <Text>Date Required: {item.dateRequired}</Text>
        <Text>Status: {item.status}</Text>
      </Card>
    </TouchableOpacity>
  );

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <View style={styles.container}>
      <Header />
      <Text style={styles.title}>📋 Request List</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1890ff" style={{ marginTop: 30 }} />
      ) : requests.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>No requests found.</Text>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Details - {selectedRequest?.id}</Text>
            <Text><Text style={styles.label}>Requester:</Text> {selectedRequest?.requester}</Text>
            <Text><Text style={styles.label}>Requisition Date:</Text> {selectedRequest?.dateRequested?.toLocaleDateString()}</Text>
            <Text><Text style={styles.label}>Date Required:</Text> {selectedRequest?.dateRequired}</Text>
            <Text><Text style={styles.label}>Time Needed:</Text> {selectedRequest?.timeNeeded}</Text>
            <Text><Text style={styles.label}>Course Code:</Text> {selectedRequest?.courseCode}</Text>
            <Text><Text style={styles.label}>Course Description:</Text> {selectedRequest?.courseDescription}</Text>
            <Text><Text style={styles.label}>Room:</Text> {selectedRequest?.room}</Text>

            <Text style={styles.subTitle}>Requested Items:</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderCell}>Item Name</Text>
                  <Text style={styles.tableHeaderCell}>Item ID</Text>
                  <Text style={styles.tableHeaderCell}>Qty</Text>
                  <Text style={styles.tableHeaderCell}>Dept</Text>
                  <Text style={styles.tableHeaderCell}>Usage</Text>
                </View>
                
                {selectedRequest?.items.map((item, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{item.itemName}</Text>
                    <Text style={styles.tableCell}>{item.itemIdFromInventory}</Text>
                    <Text style={styles.tableCell}>{item.quantity}</Text>
                    <Text style={styles.tableCell}>{item.department}</Text>
                    <Text style={styles.tableCell}>{item.usageType}</Text>
                  </View>
                ))}
              </View>

            <Text><Text style={styles.label}>Message:</Text> {selectedRequest?.message || 'No message provided.'}</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={cancelRequest} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel Request</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
