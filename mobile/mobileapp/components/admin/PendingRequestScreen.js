import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, Text, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { Card } from 'react-native-paper';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../backend/firebase/FirebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/adminStyle/PendingRequestStyle';
import Header from '../Header';

export default function PendingRequestScreen() {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [viewModalVisible, setViewModalVisible] = useState(false);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  // const fetchPendingRequests = async () => {
  //   try {
  //     const querySnapshot = await getDocs(collection(db, 'userrequests'));
  //     const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  //     setPendingRequests(data);

  //   } catch (error) {
  //     console.error('Error fetching pending requests:', error);
  //   }
  // };

  const fetchPendingRequests = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'userrequests'));
      const fetched = [];
  
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
  
        const enrichedItems = await Promise.all(
          (data.filteredMergedData || []).map(async (item) => {
            const inventoryId = item.selectedItemId || item.selectedItem?.value;
            let itemId = 'N/A';
  
            if (inventoryId) {
              try {
                const invDoc = await getDoc(doc(db, 'inventory', inventoryId));
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
  
        fetched.push({
          id: docSnap.id,
          ...data,
          filteredMergedData: enrichedItems,
        });
      }
  
      setPendingRequests(fetched);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const handleApprove = async () => {
    const isChecked = selectedRequest.filteredMergedData.some((item) => item.selected);
  
    if (!isChecked) {
      Alert.alert('Error', 'No Items selected');
      return;
    }
  
    const filteredItems = selectedRequest.filteredMergedData.filter((item) => item.selected);
  
    if (filteredItems.length === 0) {
      Alert.alert('Error', 'No Items selected');
      return;
    }
  
    const enrichedItems = await Promise.all(
      filteredItems.map(async (item) => {
        const selectedItemId = item.selectedItemId || item.selectedItem?.value;
        let itemType = "Unknown";
  
        if (selectedItemId) {
          try {
            const inventoryDoc = await getDoc(doc(db, "inventory", selectedItemId));
            if (inventoryDoc.exists()) {
              itemType = inventoryDoc.data().type || "Unknown";
            }
          } catch (err) {
            console.error(`Failed to fetch type for inventory item ${selectedItemId}:`, err);
          }
        }
  
        return {
          ...item,
          selectedItemId,
          itemType,
        };
      })
    );
  
    const uncheckedItems = selectedRequest.filteredMergedData.filter((item) => !item.selected);
  
    const rejectedItems = await Promise.all(
      uncheckedItems.map(async (item) => {
        const selectedItemId = item.selectedItemId || item.selectedItem?.value;
        let itemType = "Unknown";
  
        if (selectedItemId) {
          try {
            const inventoryDoc = await getDoc(doc(db, "inventory", selectedItemId));
            if (inventoryDoc.exists()) {
              itemType = inventoryDoc.data().type || "Unknown";
            }
          } catch (err) {
            console.error(`Failed to fetch type for inventory item ${selectedItemId}:`, err);
          }
        }
  
        return {
          ...item,
          selectedItemId,
          itemType,
        };
      })
    );
  
    const userEmail = user.email;
  
    let userName = "Unknown";
    try {
      const userQuery = query(collection(db, "accounts"), where("email", "==", userEmail));
      const userSnapshot = await getDocs(userQuery);
  
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();
        userName = userData.name || "Unknown";
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
    }
  
    const requestLogEntry = {
      accountId: selectedRequest.accountId || "N/A",
      userName: selectedRequest.userName || "N/A",
      room: selectedRequest.room || "N/A",
      courseCode: selectedRequest.courseCode || "N/A",
      courseDescription: selectedRequest.courseDescription || "N/A",
      dateRequired: selectedRequest.dateRequired || "N/A",
      timeFrom: selectedRequest.timeFrom || "N/A",
      timeTo: selectedRequest.timeTo || "N/A",
      timestamp: selectedRequest.timestamp || new Date(),
      requestList: enrichedItems,
      status: "Approved",
      approvedBy: userName,
      reason: selectedRequest.reason || "No reason provided",
      program: selectedRequest.program,
    };
  
    const rejectLogEntry = {
      accountId: selectedRequest.accountId || "N/A",
      userName: selectedRequest.userName || "N/A",
      room: selectedRequest.room || "N/A",
      courseCode: selectedRequest.courseCode || "N/A",
      courseDescription: selectedRequest.courseDescription || "N/A",
      dateRequired: selectedRequest.dateRequired || "N/A",
      timeFrom: selectedRequest.timeFrom || "N/A",
      timeTo: selectedRequest.timeTo || "N/A",
      timestamp: selectedRequest.timestamp || new Date(),
      requestList: rejectedItems,
      status: "Rejected",
      rejectedBy: userName,
      reason: "Item not selected for approval",
      program: selectedRequest.program,
    };
  
    try {
      // Log approved items in historylog subcollection
      await addDoc(collection(db, `accounts/${selectedRequest.accountId}/historylog`), {
        action: "Request Approved",
        userName,
        timestamp: serverTimestamp(),
        requestList: enrichedItems,
        approvedBy: userName,
        courseCode: selectedRequest.courseCode || "N/A",
        courseDescription: selectedRequest.courseDescription || "N/A",
        dateRequired: selectedRequest.dateRequired,
        reason: selectedRequest.reason,
        room: selectedRequest.room,
        program: selectedRequest.program,
        timeFrom: selectedRequest.timeFrom || "N/A",
        timeTo: selectedRequest.timeTo || "N/A",
      });
  
      // Log rejected items in historylog subcollection
      if (rejectedItems.length > 0) {
        await addDoc(collection(db, `accounts/${selectedRequest.accountId}/historylog`), {
          action: "Request Rejected",
          userName,
          timestamp: serverTimestamp(),
          requestList: rejectedItems,
          rejectedBy: userName,
          reason: "Item not selected for approval",
          courseCode: selectedRequest.courseCode || "N/A",
          courseDescription: selectedRequest.courseDescription || "N/A",
          dateRequired: selectedRequest.dateRequired,
          room: selectedRequest.room,
          program: selectedRequest.program,
          timeFrom: selectedRequest.timeFrom || "N/A",
          timeTo: selectedRequest.timeTo || "N/A",
        });
      }
  
      // Add to requestlog for approval
      await addDoc(collection(db, "requestlog"), requestLogEntry);
  
      // Add to requestlog for rejection
      if (rejectedItems.length > 0) {
        await addDoc(collection(db, "requestlog"), rejectLogEntry);
      }
  
      // Handle fixed items and borrowing catalog logic
      const fixedItems = enrichedItems.filter(item => item.itemType === "Fixed");
      if (fixedItems.length > 0) {
        await Promise.all(
          fixedItems.map(async (item) => {
            const borrowCatalogEntry = {
              accountId: selectedRequest.accountId || "N/A",
              userName: selectedRequest.userName || "N/A",
              room: selectedRequest.room || "N/A",
              courseCode: selectedRequest.courseCode || "N/A",
              courseDescription: selectedRequest.courseDescription || "N/A",
              dateRequired: selectedRequest.dateRequired || "N/A",
              timeFrom: selectedRequest.timeFrom || "N/A",
              timeTo: selectedRequest.timeTo || "N/A",
              timestamp: selectedRequest.timestamp || new Date(),
              requestList: [item],
              status: "Borrowed",
              approvedBy: userName,
              reason: selectedRequest.reason || "No reason provided",
              program: selectedRequest.program,
            };
  
            // Add to borrowcatalog collection
            await addDoc(collection(db, "borrowcatalog"), borrowCatalogEntry);
          })
        );
      }
  
      // Cleanup request and subcollections
      await deleteDoc(doc(db, "userrequests", selectedRequest.id));
  
      // Update state and show success notification
      setPendingRequests(pendingRequests.filter((req) => req.id !== selectedRequest.id));
      setSelectedRequest(null);
      Alert.alert("Success", "Request approved and logged.");
  
    } catch (error) {
      console.error("Error in approval:", error);
      Alert.alert("Error", "There was an error with the approval process.");
    }
  };  

  const handleReject = (request) => {
    setSelectedRequest(request);
    setIsRejectModalVisible(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason.');
      return;
    }

    try {
      const requestRef = doc(db, 'userrequests', selectedRequest.id);
      await updateDoc(requestRef, {
        status: 'Rejected',
        reason: rejectReason,
      });
      setIsRejectModalVisible(false);
      setRejectReason('');
      setSelectedRequest(null);
      Alert.alert('Rejected', 'Request has been rejected.');
      fetchPendingRequests();

    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const renderItem = ({ item, index }) => (
    <Card style={styles.card}>
      <TouchableOpacity onPress={() => { setSelectedRequest(item); setViewModalVisible(true); }}>
        <Card.Content>
          <Text style={styles.name}>{index + 1}. Requestor: {item.userName || 'N/A'}</Text>
          <Text style={styles.request}>Room: {item.room}</Text>
          <Text style={styles.reason}>Course Code: {item.course}</Text>
          <Text style={styles.reason}>Course Description: {item.courseDescription}</Text>
          {/* <Text style={styles.date}>
            Requisition Date: {item.timestamp ? item.timestamp.toDate().toLocaleString() : 'N/A'}
          </Text>
          <Text style={styles.date}>Required Date: {item.dateRequired}</Text> */}
          <Text style={[styles[item.status?.toLowerCase() || 'pending']]}>{item.status || 'Pending'}</Text>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header />
      <Text style={styles.title}>Pending Requests</Text>
      <FlatList
        data={pendingRequests}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />

      <Modal
        visible={viewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setViewModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPressOut={() => setViewModalVisible(false)}
          style={styles.modalContainer}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Request Details</Text>
            {selectedRequest && (
              <>
                <Text style={styles.modalText}>Name: {selectedRequest.userName || 'N/A'}</Text>
                <Text style={styles.modalText}>Program: {selectedRequest.program}</Text>
                <Text style={styles.modalText}>Usage Type: {selectedRequest.usageType}</Text>
                <Text style={styles.modalText}>Room: {selectedRequest.room}</Text>
                <Text style={styles.modalText}>Reason: {selectedRequest.reason}</Text>
                <Text style={styles.modalText}>Time Needed: {selectedRequest.timeFrom} - {selectedRequest.timeTo}</Text>
                <Text style={styles.modalText}>Date Required: {selectedRequest.dateRequired || 'N/A'}</Text>
                <Text style={styles.modalText}>Requested On: {selectedRequest.timestamp?.toDate().toLocaleString() || 'N/A'}</Text>
                <Text style={styles.modalText}>Status: {selectedRequest.status || 'Pending'}</Text>
                <Text style={styles.modalText}>Reason: {selectedRequest.reason}</Text>

                <Text style={[styles.modalTitle, { marginTop: 10 }]}>Requested Items:</Text>

                <ScrollView horizontal>
                  <View>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                      <Text style={styles.tableCell}>Item ID</Text>
                      <Text style={styles.tableCell}>Item</Text>
                      <Text style={styles.tableCell}>Qty</Text> 
                      <Text style={styles.tableCell}>Category</Text>
                    </View>
                    {selectedRequest.filteredMergedData?.map((item, idx) => (
                      <View key={idx} style={styles.tableRow}>
                        <Text style={styles.tableCell}>{item.itemIdFromInventory}</Text>
                        <Text style={styles.tableCell}>{item.itemName}</Text>
                        <Text style={styles.tableCell}>{item.quantity}</Text>
                        <Text style={styles.tableCell}>{item.category}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>

                <TouchableOpacity
                  onPress={() => setViewModalVisible(false)}
                  style={[styles.button, { marginTop: 15 }]}
                >
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}
