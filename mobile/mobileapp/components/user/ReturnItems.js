import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal,
  Button, TextInput, StyleSheet, ScrollView
} from 'react-native';
import {
  collection, getDocs, doc, updateDoc, getDoc, deleteDoc,
  setDoc, addDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../backend/firebase/FirebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/userStyle/ReturnItemsStyle';
import Header from '../Header';

const ReturnItems = () => {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState("All");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [inventoryData, setInventoryData] = useState({});
  const [returnQuantities, setReturnQuantities] = useState({});
  const [itemConditions, setItemConditions] = useState({});

  useEffect(() => {
    const fetchRequestLogs = async () => {
      try {
        const snapshot = await getDocs(collection(db, `accounts/${user.id}/userrequestlog`));
        const logs = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          let rawDate = null;
          let rawTimestamp = "N/A";
          let formattedTimestamp = "N/A";
  
          if (data.rawTimestamp?.toDate) {
            try {
              rawDate = data.rawTimestamp.toDate();
              rawTimestamp = rawDate.toLocaleString("en-PH", {
                timeZone: "Asia/Manila",
              });
            } catch (e) {
              console.warn("Error parsing rawTimestamp:", e);
            }
          }
  
          if (data.timestamp?.toDate) {
            try {
              formattedTimestamp = data.timestamp.toDate().toLocaleString("en-PH", {
                timeZone: "Asia/Manila",
              });
            } catch (e) {
              console.warn("Error parsing timestamp:", e);
            }
          }
  
          return {
            id: docSnap.id,
            date: data.dateRequired ?? "N/A",
            status: data.status ?? "Pending",
            requestor: data.userName ?? "Unknown",
            requestedItems: data.requestList?.map(item => item.itemName).join(", ") ?? "No items",
            requisitionId: docSnap.id,
            rawDate,
            rawTimestamp,
            timestamp: formattedTimestamp,
            raw: data
          };
        });
  
        // Sort by rawDate descending (latest first)
        const sortedLogs = logs.sort((a, b) => {
          if (!a.rawDate) return 1;
          if (!b.rawDate) return -1;
          return b.rawDate - a.rawDate;
        });
  
        setHistoryData(sortedLogs);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };
  
    if (user?.id) {
      fetchRequestLogs();
    }
  }, [user]);  

  const handleViewDetails = async (record) => {
    setSelectedRequest(record);
    setModalVisible(true);

    const snapshot = await getDocs(collection(db, 'inventory'));
    const map = {};
    snapshot.forEach(docSnap => {
      const item = docSnap.data();
      record.raw?.requestList?.forEach(req => {
        if (item.id === req.itemIdFromInventory) {
          map[req.itemIdFromInventory] = item;
        }
      });
    });
    setInventoryData(map);
  };

  const handleReturn = async () => {
    try {
      const currentDate = new Date().toISOString();
      const fullReturnData = {
        ...selectedRequest.raw,
        requisitionId: selectedRequest.requisitionId,
        timestamp: serverTimestamp(),
        status: "Returned",
        requestList: selectedRequest.raw.requestList.map(item => ({
          ...item,
          returnedQuantity: returnQuantities[item.itemIdFromInventory] || 0,
          condition: itemConditions[item.itemIdFromInventory] || item.condition || "Good",
          dateReturned: currentDate,
          status: "Returned"
        }))
      };

      await addDoc(collection(db, 'returnedItems'), fullReturnData);
      await addDoc(collection(db, `accounts/${user.id}/userreturneditems`), fullReturnData);
      await setDoc(doc(db, `borrowcatalog/${selectedRequest.requisitionId}`), fullReturnData, { merge: true });
      await deleteDoc(doc(db, `accounts/${user.id}/userrequestlog/${selectedRequest.requisitionId}`));

      await addDoc(collection(db, `accounts/${user.id}/historylog`), {
        ...fullReturnData,
        action: "Returned",
        date: currentDate,
      });

      await addDoc(collection(db, `accounts/${user.id}/activitylog`), {
        ...fullReturnData,
        action: "Returned",
        date: currentDate,
      });

      closeModal();
    } catch (err) {
      console.error("Return error:", err);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedRequest(null);
    setReturnQuantities({});
    setItemConditions({});
    setInventoryData({});
  };

  const filteredData =
    filterStatus === "All" ? historyData : historyData.filter((item) => item.status === filterStatus);

  return (
    <View style={styles.container}>
      <Header />
      
      <View style={styles.filterContainer}>
        {["All", "Approved", "Declined"].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterButton, filterStatus === status && styles.activeButton]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={styles.filterText}>{status}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
            <Text style={styles.headerCell}>Date</Text>
            <Text style={styles.headerCell}>Status</Text>
            <Text style={styles.headerCell}>Action</Text>
        </View>

        <ScrollView style={{ maxHeight: 500 }}>
            {filteredData.map((item) => (
            <View key={item.id} style={styles.tableRow}>
                <Text style={styles.cell}>{item.rawTimestamp}</Text>
                <Text style={styles.cell}>{item.status}</Text>
                <TouchableOpacity onPress={() => handleViewDetails(item)}>
                <Text style={styles.linkText}>View</Text>
                </TouchableOpacity>
            </View>
            ))}
        </ScrollView>
      </View>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={closeModal}>
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalTitle}>📄 Requisition Slip</Text>
          <Text>Name: {selectedRequest?.raw?.userName}</Text>
          <Text>Requisition ID: {selectedRequest?.requisitionId}</Text>
          <Text>Request Date: {selectedRequest?.timestamp}</Text>

          <Text style={styles.boldText}>Requested Items:</Text>
          {selectedRequest?.raw?.requestList?.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text>{item.itemName} - Qty: {item.quantity}</Text>
              <TextInput
                placeholder="Returned Qty"
                keyboardType="number-pad"
                style={styles.input}
                onChangeText={(text) => {
                  setReturnQuantities((prev) => ({
                    ...prev,
                    [item.itemIdFromInventory]: text,
                  }));
                }}
              />
              <TextInput
                placeholder="Condition"
                style={styles.input}
                onChangeText={(text) => {
                  setItemConditions((prev) => ({
                    ...prev,
                    [item.itemIdFromInventory]: text,
                  }));
                }}
              />
            </View>
          ))}

          <View style={styles.modalButtons}>
            <Button title="Back" onPress={closeModal} />
            <Button title="Return" onPress={handleReturn} />
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
};

export default ReturnItems;
