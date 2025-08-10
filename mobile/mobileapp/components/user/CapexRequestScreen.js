import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Button,
  Modal,
  Alert,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from "react-native";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useAuth } from '../contexts/AuthContext';
import { db } from '../../backend/firebase/FirebaseConfig';
import styles from '../styles/userStyle/CapexRequestStyle';
import Header from "../Header";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from "@react-navigation/native";

const CapexRequestScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [dataSource, setDataSource] = useState([]);
  const [itemDescription, setItemDescription] = useState("");
  const [qty, setQty] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [justification, setJustification] = useState("");
  const [subject, setSubject] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const { user } = useAuth();

  const userId = getAuth().currentUser?.id;
  const userName = getAuth().currentUser?.displayName;

   const navigation = useNavigation()
  
    const [headerHeight, setHeaderHeight] = useState(0);
    const handleHeaderLayout = (event) => {
      const { height } = event.nativeEvent.layout;
      setHeaderHeight(height);
    };
  
    useFocusEffect(
      useCallback(() => {
        StatusBar.setBarStyle('dark-content');
        StatusBar.setBackgroundColor('transparent'); // Android only
        StatusBar.setTranslucent(true)
      }, [])
    );

  useEffect(() => {
    if (!user?.id) return; // Use user.id instead of Firestore's getAuth()

    const ref = collection(db, `accounts/${user.id}/temporaryCapexRequest`);
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const items = snapshot.docs
        .map((doc, index) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            no: index + 1,
          };
        })
        .filter((item) => !item.deleted);
      setDataSource(items);
      calculateTotal(items);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const calculateTotal = (data) => {
    const total = data.reduce(
      (sum, item) => sum + (item.qty * item.estimatedCost || 0),
      0
    );

    setTotalPrice(total);
  };

  const calculateTotalPrice = (data) => {
    const total = data.reduce((sum, item) => {
      const cost = Number(item.estimatedCost);
      const quantity = Number(item.qty);
      return sum + (isNaN(cost) || isNaN(quantity) ? 0 : cost * quantity);
    }, 0);

    setTotalPrice(total);
  };  

  const logRequestOrReturn = async (userId, userName, action, requestDetails) => {
    try {
      await addDoc(collection(db, `accounts/${userId}/activitylog`), {
        action, // e.g., "Added a Capex Item", "Requested Items", etc.
        userName,
        timestamp: serverTimestamp(),
        requestList: requestDetails,
      });
    } catch (error) {
      console.error("Error logging request or return activity:", error);
    }
  };

  // const handleSave = async () => {
  //   const trimmedQty = qty.trim();
  //   const trimmedCost = estimatedCost.trim();
  //   const trimmedJustification = justification.trim();
  //   const trimmedSubject = subject.trim();
    
  //   if (!itemDescription.trim() || !trimmedSubject || !trimmedQty || !trimmedCost || !trimmedJustification) {
  //     Alert.alert("Validation Error", "All fields are required");
  //     return;
  //   }
  
  //   const parsedQty = Number(trimmedQty);
  //   const parsedCost = Number(trimmedCost);
  
  //   if (isNaN(parsedQty) || isNaN(parsedCost)) {
  //     Alert.alert("Validation Error", "Quantity and Estimated Cost must be valid numbers.");
  //     return;
  //   }
  
  //   if (parsedQty <= 0 || parsedCost <= 0) {
  //     Alert.alert("Validation Error", "Quantity and Estimated Cost must be greater than 0.");
  //     return;
  //   }
  
  //   try {
  //     const itemData = {
  //       itemDescription: itemDescription.trim(),
  //       qty: parsedQty.toString(),
  //       estimatedCost: parsedCost.toString(),
  //       totalPrice: parsedQty * parsedCost,
  //       justification,
  //       subject,
  //     };
  
  //     // Duplicate check only when adding new
  //     if (!editingItem) {
  //       const existingItemsSnapshot = await getDocs(
  //         collection(db, `accounts/${user.id}/temporaryCapexRequest`)
  //       );
  
  //       const isDuplicate = existingItemsSnapshot.docs.some(
  //         (doc) =>
  //           doc.data().itemDescription.trim().toLowerCase() ===
  //           itemDescription.trim().toLowerCase()
  //       );
  
  //       if (isDuplicate) {
  //         Alert.alert("Validation Error", "This item already exists in your CAPEX request.");
  //         return;
  //       }
  //     }
  
  //     let savedItem = null;
  
  //     if (editingItem) {
  //       const ref = doc(db, `accounts/${user.id}/temporaryCapexRequest`, editingItem.id);
  //       await setDoc(ref, { ...itemData, id: editingItem.id });
  //       savedItem = { ...itemData, id: editingItem.id };
  //     } else {
  //       const newDocRef = await addDoc(
  //         collection(db, `accounts/${user.id}/temporaryCapexRequest`),
  //         itemData
  //       );
  //       savedItem = { ...itemData, id: newDocRef.id };
  //     }
  
  //     // Log the action
  //     try {
  //       await logRequestOrReturn(user.id, user.name, "Added a Capex Item", savedItem);
  //     } catch (logError) {
  //       console.error("Failed to log activity:", logError);
  //     }
  
  //     resetForm();

  //     Alert.alert("Success", editingItem ? "Item updated!" : "Item added!");
  //   } catch (error) {
  //     console.error("Firestore error:", error);
  //     Alert.alert("Error", "Failed to save item");
  //   }
  // };  

  const handleSave = async () => {
    const trimmedQty = qty.trim();
    const trimmedCost = estimatedCost.trim();
    const trimmedJustification = justification.trim();
    const trimmedSubject = subject.trim();
    
    if (!itemDescription.trim() || !trimmedSubject || !trimmedQty || !trimmedCost || !trimmedJustification) {
      Alert.alert("Validation Error", "All fields are required");
      return;
    }

    const parsedQty = Number(trimmedQty);
    const parsedCost = Number(trimmedCost);

    if (isNaN(parsedQty) || isNaN(parsedCost)) {
      Alert.alert("Validation Error", "Quantity and Estimated Cost must be valid numbers.");
      return;
    }

    if (parsedQty <= 0 || parsedCost <= 0) {
      Alert.alert("Validation Error", "Quantity and Estimated Cost must be greater than 0.");
      return;
    }

    try {
      const itemData = {
        itemDescription: itemDescription.trim(),
        qty: parsedQty.toString(),
        estimatedCost: parsedCost.toString(),
        totalPrice: parsedQty * parsedCost,
        justification: trimmedJustification,
        subject: trimmedSubject,
      };

      // ✅ Duplicate check (works for adding AND editing)
      const existingItemsSnapshot = await getDocs(
        collection(db, `accounts/${user.id}/temporaryCapexRequest`)
      );

      const isDuplicate = existingItemsSnapshot.docs.some((docSnap) => {
        const data = docSnap.data();
        return (
          data.itemDescription.trim().toLowerCase() === itemDescription.trim().toLowerCase() &&
          (!editingItem || editingItem.id !== docSnap.id) // allow same item if editing itself
        );
      });

      if (isDuplicate) {
        Alert.alert("Validation Error", "This item already exists in your CAPEX request.");
        return;
      }

      let savedItem = null;

      if (editingItem) {
        const ref = doc(db, `accounts/${user.id}/temporaryCapexRequest`, editingItem.id);
        await setDoc(ref, { ...itemData, id: editingItem.id });
        savedItem = { ...itemData, id: editingItem.id };
        
      } else {
        const newDocRef = await addDoc(
          collection(db, `accounts/${user.id}/temporaryCapexRequest`),
          itemData
        );
        savedItem = { ...itemData, id: newDocRef.id };
      }

      // Log the action
      try {
        await logRequestOrReturn(user.id, user.name, "Added a Capex Item", savedItem);

      } catch (logError) {
        console.error("Failed to log activity:", logError);
      }

      resetForm();

      Alert.alert("Success", editingItem ? "Item updated!" : "Item added!");

    } catch (error) {
      console.error("Firestore error:", error);
      Alert.alert("Error", "Failed to save item");
    }
  };

  const resetForm = () => {
    setItemDescription("");
    setQty("");
    setEstimatedCost("");
    setJustification("");
    setSubject("");
    setEditingItem(null);
    setModalVisible(false);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setItemDescription(item.itemDescription);
    setQty(String(item.qty));
    setEstimatedCost(String(item.estimatedCost));
    setJustification(item.justification || "");
    setSubject(item.subject || "");
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this item?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Deletion cancelled"),
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              // Filter out the deleted item from your list
              const updatedData = dataSource.filter((item) => item.id !== id);
              setDataSource(updatedData);
          
              calculateTotalPrice(updatedData); // recalculate if needed
          
              Alert.alert("Success", "Item deleted successfully");
          
              const capexRequestRef = doc(db, `accounts/${user.id}/temporaryCapexRequest`, id);
              await deleteDoc(capexRequestRef); // delete from Firestore
          
              await logRequestOrReturn(user.id, user.name, "Deleted a Capex Item", [
                { deletedItemId: id },
              ]);

            } catch (error) {
              console.error("Error deleting item from Firestore:", error);
              Alert.alert("Error", "Failed to delete item");
            }
          },
        },
      ]
    );
  };  

  const handleSubmitRequest = async () => {

    try {
      const requestRef = await addDoc(collection(db, "capexrequestlist"), {
        userId: user.id,
        userName: user.name,
        totalPrice,
        createdAt: serverTimestamp(),
        items: dataSource,
      });

      await addDoc(collection(db, `accounts/${user.id}/capexrequests`), {
        capexRequestId: requestRef.id,
        userId: user.id,
        userName: user.name,
        totalPrice,
        createdAt: serverTimestamp(),
        items: dataSource,
      });

      const snapshot = await getDocs(
        collection(db, `accounts/${user.id}/temporaryCapexRequest`)
      );

      await Promise.all(
        snapshot.docs.map((docSnap) =>
          deleteDoc(doc(db, `accounts/${user.id}/temporaryCapexRequest`, docSnap.id))
        )
      );

      await logRequestOrReturn(user.id, user.name, "Sent a Capex Request", dataSource);
      Alert.alert("Success", "CAPEX Request submitted!");
      setDataSource([]);
      setTotalPrice(0);

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Submission failed");
    }
  };

  return (
    <View style={styles.container}>
      <View 
        style={[styles.inventoryStocksHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} 
        onLayout={handleHeaderLayout}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="keyboard-backspace" size={28} color="black" />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontWeight: '800', fontSize: 18, color: '#395a7f', textAlign: 'center' }}>
            CAPEX Request
          </Text>
          <Text style={{ fontWeight: '300', fontSize: 13, textAlign: 'center' }}>
            Capital Expenditure Proposal
          </Text>
        </View>

      {/* 
        <TouchableOpacity style={{ padding: 2 }}>
          <Icon name="information-outline" size={24} color="#000" />
        </TouchableOpacity> */}
      </View>

      <View style={{
        backgroundColor: '#ffffff',
        flex: 1,
        borderRadius: 8,
        marginTop: headerHeight,
        padding: 16,
      }}>
  {/* <Text style={styles.title}>CAPEX Request</Text> */}

        <ScrollView horizontal>
          <View style={styles.tableContainer}>
            {/* Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.headerCell, { width: 150 }]}>Item</Text>
              <Text style={[styles.tableCell, styles.headerCell, { width: 80 }]}>Qty</Text>
              <Text style={[styles.tableCell, styles.headerCell, { width: 100 }]}>Est. Cost</Text>
              <Text style={[styles.tableCell, styles.headerCell, { width: 100 }]}>Total</Text>
              <Text style={[styles.tableCell, styles.headerCell, { width: 140 }]}>Actions</Text>
            </View>

            {/* Rows */}
            {dataSource.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: 150 }]}>{item.itemDescription}</Text>
                <Text style={[styles.tableCell, { width: 80 }]}>{item.qty}</Text>
                <Text style={[styles.tableCell, { width: 100 }]}>₱{item.estimatedCost}</Text>
                <Text style={[styles.tableCell, { width: 100 }]}>₱{item.totalPrice}</Text>
                <View style={[styles.tableCell, styles.actionsCell, { width: 140, flexDirection: 'row', gap: 8 }]}>
                  <TouchableOpacity onPress={() => handleEdit(item)} style={[styles.smallButton, styles.editButton]}>
                    <Text style={styles.buttonText}>Edit</Text>
                  </TouchableOpacity>

                <TouchableOpacity 
                    onPress={() => handleDelete(item.id)} 
                    style={[styles.smallButton, styles.deleteButton]}
                  >
                    <Icon name="close-thick" size={20} color="#fff" />
                  </TouchableOpacity>

                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.total}>Total: ₱{totalPrice.toLocaleString()}</Text>

        <TouchableOpacity style={styles.buttonPrimary} onPress={() => setModalVisible(true)}>
          <Text style={styles.buttonText}>Add Item</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity style={[styles.buttonPrimary, { marginTop: 10 }]} onPress={handleSubmitRequest}>
          <Text style={styles.buttonText}>Submit Request</Text>
        </TouchableOpacity> */}

        <TouchableOpacity
          style={[styles.buttonPrimary, { marginTop: 10 }]}
          onPress={() => setConfirmModalVisible(true)}
        >
          <Text style={styles.buttonText}>Submit Request</Text>
        </TouchableOpacity>
      </View>


      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Edit Item' : 'Add CAPEX Item'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                placeholder="Item Name"
                placeholderTextColor="#888"
                value={itemDescription}
                onChangeText={setItemDescription}
                style={styles.input}
              />

              <TextInput
                placeholder="Subject"
                placeholderTextColor="#888"
                value={subject}
                onChangeText={setSubject}
                style={styles.input}
              />

              <TextInput
                placeholder="Quantity"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={qty}
                onChangeText={setQty}
                style={styles.input}
              />

              <TextInput
                placeholder="Estimated Cost"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={estimatedCost}
                onChangeText={setEstimatedCost}
                style={styles.input}
              />

              <TextInput
                placeholder="Justification"
                placeholderTextColor="#888"
                value={justification}
                onChangeText={setJustification}
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                multiline
              />
            </ScrollView>

            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={confirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Your Request</Text>

            {/* Scoped table styling */}
            <ScrollView style={{ maxHeight: 200 }}>
              <View style={styles.confirmTable}>
                {/* Table header */}
                <View style={[styles.confirmRow, styles.confirmHeader]}>
                  <Text style={[styles.confirmCell, styles.confirmHeaderText]}>Item</Text>
                  <Text style={[styles.confirmCell, styles.confirmHeaderText]}>Qty</Text>
                  <Text style={[styles.confirmCell, styles.confirmHeaderText]}>Price</Text>
                </View>

                {/* Table rows */}
                {dataSource.map((item, index) => (
                  <View key={index} style={styles.confirmRow}>
                    <Text style={styles.confirmCell}>{item.itemDescription}</Text>
                    <Text style={styles.confirmCell}>{item.qty}</Text>
                    <Text style={styles.confirmCell}>{item.totalPrice}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.totalText}>Total: ₱{totalPrice}</Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalConfirmButton, styles.modalActionButton]}
                onPress={() => {
                  setConfirmModalVisible(false);
                  handleSubmitRequest();
                }}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalCancelButton, styles.modalActionButton]}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CapexRequestScreen;
