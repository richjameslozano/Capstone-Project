import React, { useState, useEffect } from 'react';
import { Picker } from '@react-native-picker/picker';
import {
  View, Text, TouchableOpacity, Modal,
  Button, TextInput, StyleSheet, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import {
  collection, getDocs, doc, updateDoc, getDoc, deleteDoc,
  setDoc, addDoc, serverTimestamp, onSnapshot
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
    console.log("Updated conditions state:", itemConditions);
  }, [itemConditions]); // This will run every time itemConditions changes

//   useEffect(() => {
//     const fetchRequestLogs = async () => {
//       try {
//         const snapshot = await getDocs(collection(db, `accounts/${user.id}/userrequestlog`));
//         const logs = snapshot.docs.map((docSnap) => {
//           const data = docSnap.data();
//           let rawDate = null;
//           let rawTimestamp = "N/A";
//           let formattedTimestamp = "N/A";
  
//           if (data.rawTimestamp?.toDate) {
//             try {
//               rawDate = data.rawTimestamp.toDate();
//               rawTimestamp = rawDate.toLocaleString("en-PH", {
//                 timeZone: "Asia/Manila",
//               });

//             } catch (e) {
//               console.warn("Error parsing rawTimestamp:", e);
//             }
//           }
  
//           if (data.timestamp?.toDate) {
//             try {
//               formattedTimestamp = data.timestamp.toDate().toLocaleString("en-PH", {
//                 timeZone: "Asia/Manila",
//               });

//             } catch (e) {
//               console.warn("Error parsing timestamp:", e);
//             }
//           }
  
//           return {
//             id: docSnap.id,
//             date: data.dateRequired ?? "N/A",
//             status: data.status ?? "Pending",
//             requestor: data.userName ?? "Unknown",
//             requestedItems: data.requestList?.map(item => item.itemName).join(", ") ?? "No items",
//             requisitionId: docSnap.id,
//             rawDate,
//             rawTimestamp,
//             timestamp: formattedTimestamp,
//             raw: data
//           };
//         });
  
//         // Sort by rawDate descending (latest first)
//         const sortedLogs = logs.sort((a, b) => {
//           if (!a.rawDate) return 1;
//           if (!b.rawDate) return -1;
//           return b.rawDate - a.rawDate;
//         });
  
//         setHistoryData(sortedLogs);

//       } catch (error) {
//         console.error("Fetch error:", error);
//       }
//     };
  
//     if (user?.id) {
//       fetchRequestLogs();
//     }
//   }, [user]);

  useEffect(() => {
    const unsubscribe = () => {
      if (user?.id) {
        const requestLogRef = collection(db, `accounts/${user.id}/userrequestlog`);
  
        // Real-time listener for changes in the request logs
        return onSnapshot(requestLogRef, (snapshot) => {
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
  
          setHistoryData(sortedLogs); // Update the state with the sorted logs
        });
      }
    };
  
    const unsubscribeListener = unsubscribe();
  
    // Cleanup function to unsubscribe when component is unmounted or user changes
    return () => {
      if (unsubscribeListener) {
        unsubscribeListener(); // Remove Firestore listener
      }
    };
  }, [user]);

  const handleViewDetails = async (record) => {
    setSelectedRequest(record);
    setModalVisible(true);

    // Initialize an empty object to map item conditions
    const inventoryMap = {};
    const requestItems = record.raw?.requestList || [];

    try {
        // Fetch all inventory documents from Firestore
        const inventoryRef = collection(db, 'inventory');
        const inventorySnapshot = await getDocs(inventoryRef);

        // Iterate through each inventory document
        inventorySnapshot.forEach((docSnap) => {
        const item = docSnap.data();
        
        // Match the inventory item with request items
        requestItems.forEach((req) => {
            if (item.id === req.itemIdFromInventory) {
            // Add the inventory item to the map
            inventoryMap[req.itemIdFromInventory] = item;
            }
        });
        });

        // Update inventory data with the mapped inventory items
        setInventoryData(inventoryMap);

        // Initialize item conditions with default values or values from request list
        const initialConditions = {};
        requestItems.forEach((item) => {
        // Set the condition from the requestList or default to "Good"
        initialConditions[item.itemIdFromInventory] = item.condition || "Good";
        });

        // Update the state for item conditions
        setItemConditions(initialConditions);

    } catch (err) {
        console.error("Error fetching inventory:", err);
    }
  };

    const handleReturn = async () => {
    try {
        const currentDate = new Date().toISOString();

        const fullReturnData = {
        accountId: user.id,  // Use user.id for accountId
        approvedBy: selectedRequest.raw?.approvedBy || "N/A",
        courseCode: selectedRequest.raw?.courseCode || "N/A",
        courseDescription: selectedRequest.raw?.courseDescription || "N/A",
        dateRequired: selectedRequest.raw?.dateRequired || "N/A",
        program: selectedRequest.raw?.program || "N/A",
        reason: selectedRequest.raw?.reason || "No reason provided",
        room: selectedRequest.raw?.room || "N/A",
        timeFrom: selectedRequest.raw?.timeFrom || "N/A",
        timeTo: selectedRequest.raw?.timeTo || "N/A",
        timestamp: serverTimestamp(),
        userName: selectedRequest.raw?.userName || "N/A",
        requisitionId: selectedRequest.requisitionId,
        status: "Returned",
        requestList: (selectedRequest.raw?.requestList || [])
            .map((item) => {
            const returnQty = Number(returnQuantities[item.itemIdFromInventory] || 0);
            if (returnQty <= 0) return null;

            return {
                ...item,
                returnedQuantity: returnQty,
                condition: itemConditions[item.itemIdFromInventory] || item.condition || "Good",
                status: "Returned",
                dateReturned: currentDate,
            };
            })
            .filter(Boolean),
        };

        // Save to returnedItems and userreturneditems
        const returnedRef = doc(collection(db, "returnedItems"));
        const userReturnedRef = doc(collection(db, `accounts/${user.id}/userreturneditems`));
        await setDoc(returnedRef, fullReturnData);
        await setDoc(userReturnedRef, fullReturnData);

        // Update full data in original borrowcatalog
        const borrowDocRef = doc(db, "borrowcatalog", selectedRequest.requisitionId);
        await setDoc(borrowDocRef, fullReturnData, { merge: true });

        // 🗑️ Delete from userrequestlog
        const userRequestLogRef = doc(db, `accounts/${user.id}/userrequestlog/${selectedRequest.requisitionId}`);
        await deleteDoc(userRequestLogRef);

        // 📝 Add to history log
        const historyRef = doc(collection(db, `accounts/${user.id}/historylog`));
        await setDoc(historyRef, {
        ...fullReturnData,
        action: "Returned",
        date: currentDate,
        });

        // 📝 Add to activity log
        const activityRef = doc(collection(db, `accounts/${user.id}/activitylog`));
        await setDoc(activityRef, {
        ...fullReturnData,
        action: "Returned",
        date: currentDate,
        });

        console.log("Returned items processed, removed from userRequests, added to history log.");
        closeModal();
        
    } catch (error) {
        console.error("Error saving returned item details:", error);
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

      <View style={styles.tableContainer1}>
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

        <Modal visible={modalVisible} animationType="slide" onRequestClose={closeModal} transparent={true}>
            <View style={styles.modalOverlay}>
                <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1, width: '90%' }}
                >
                <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
                    <Text style={styles.modalTitle}>📄 Requisition Slip</Text>
                    <Text>Name: {selectedRequest?.raw?.userName}</Text>
                    <Text>Requisition ID: {selectedRequest?.requisitionId}</Text>
                    <Text>Request Date: {selectedRequest?.timestamp}</Text>

                    <Text style={styles.boldText}>Requested Items:</Text>

                    <View style={styles.tableContainer2}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.headerCell}>Item Name</Text>
                        <Text style={styles.headerCell}>Quantity</Text>
                        <Text style={styles.headerCell}>Returned Qty</Text>
                        <Text style={styles.headerCell}>Condition</Text>
                    </View>

                    {selectedRequest?.raw?.requestList?.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                        <Text style={[styles.cell, { flex: 1 }]}>{item.itemName}</Text>
                        <Text style={[styles.cell, { flex: 0.7 }]}>{item.quantity}</Text>

                        <View style={{ flex: 1, paddingHorizontal: 4 }}>
                            <TextInput
                            placeholder="Returned Qty"
                            keyboardType="number-pad"
                            style={styles.input}
                            value={returnQuantities[item.itemIdFromInventory] || ""}
                            onChangeText={(text) => {
                                const input = parseInt(text, 10);
                                const max = item.quantity;

                                if (!isNaN(input) && input <= max) {
                                setReturnQuantities((prev) => ({
                                    ...prev,
                                    [item.itemIdFromInventory]: input.toString(),
                                }));
                                } else if (input > max) {
                                alert(`Returned quantity cannot exceed borrowed quantity (${max}).`);
                                } else {
                                setReturnQuantities((prev) => ({
                                    ...prev,
                                    [item.itemIdFromInventory]: "",
                                }));
                                }
                            }}
                            />
                        </View>

                        <View style={{ flex: 1, paddingHorizontal: 4 }}>
                        <Picker
                            selectedValue={itemConditions[item.itemIdFromInventory] || "Good"}  // Default to "Good" if no condition
                            style={styles.picker}
                            onValueChange={(value) => {
                                console.log(`Updating condition for item ${item.itemIdFromInventory}:`, value);

                                setItemConditions((prev) => ({
                                ...prev,
                                [item.itemIdFromInventory]: value,
                                }));
                            }}
                            >
                            <Picker.Item label="Good" value="Good" />
                            <Picker.Item label="Damaged" value="Damaged" />
                            <Picker.Item label="Needs Repair" value="Needs Repair" />
                        </Picker>
                        </View>
                        </View>
                    ))}
                    </View>

                    <View style={styles.modalButtons}>
                    <Button title="Back" onPress={closeModal} />
                    <Button title="Return" onPress={handleReturn} />
                    </View>
                </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    </View>
  );
};

export default ReturnItems;
