import React, { useState, useEffect } from "react";
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

const CapexRequestScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [dataSource, setDataSource] = useState([]);
  const [itemDescription, setItemDescription] = useState("");
  const [qty, setQty] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [justification, setJustification] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const { user } = useAuth();

  const userId = getAuth().currentUser?.id;
  const userName = getAuth().currentUser?.displayName;

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

  const handleSave = async () => {
    const trimmedQty = qty.trim();
    const trimmedCost = estimatedCost.trim();
  
    if (!itemDescription || !trimmedQty || !trimmedCost) {
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
        justification,
      };
  
      // Duplicate check only when adding new
      if (!editingItem) {
        const existingItemsSnapshot = await getDocs(
          collection(db, `accounts/${user.id}/temporaryCapexRequest`)
        );
  
        const isDuplicate = existingItemsSnapshot.docs.some(
          (doc) =>
            doc.data().itemDescription.trim().toLowerCase() ===
            itemDescription.trim().toLowerCase()
        );
  
        if (isDuplicate) {
          Alert.alert("Validation Error", "This item already exists in your CAPEX request.");
          return;
        }
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
    setEditingItem(null);
    setModalVisible(false);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setItemDescription(item.itemDescription);
    setQty(String(item.qty));
    setEstimatedCost(String(item.estimatedCost));
    setJustification(item.justification || "");
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
    if (dataSource.length === 0) {
      Alert.alert("Error", "No items to submit");
      return;
    }
  
    try {
      const requestRef = await addDoc(collection(db, "capexrequestlist"), {
        userId: user.id, // Use user.id here
        userName: user.name, // user.name or user.displayName
        totalPrice,
        createdAt: serverTimestamp(),
        items: dataSource,
      });
  
      await addDoc(collection(db, `accounts/${user.id}/capexrequests`), {
        capexRequestId: requestRef.id,
        userId: user.id, // Use user.id here
        userName: user.name, // user.name or user.displayName
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
  }  

  return (
    <View style={styles.container}>
      <Header/>
      <Text style={styles.title}>CAPEX Request</Text>

      <View style={styles.tableContainer}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, styles.headerCell]}>Item</Text>
          <Text style={[styles.tableCell, styles.headerCell]}>Qty</Text>
          <Text style={[styles.tableCell, styles.headerCell]}>Est. Cost</Text>
          <Text style={[styles.tableCell, styles.headerCell]}>Total</Text>
          <Text style={[styles.tableCell, styles.headerCell]}>Actions</Text>
        </View>

        {dataSource.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={styles.tableCell}>{item.itemDescription}</Text>
            <Text style={styles.tableCell}>{item.qty}</Text>
            <Text style={styles.tableCell}>₱{item.estimatedCost}</Text>
            <Text style={styles.tableCell}>₱{item.totalPrice}</Text>
            <View style={[styles.tableCell, styles.actionsCell]}>
              <TouchableOpacity onPress={() => handleEdit(item)} style={[styles.smallButton, styles.editButton]}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.smallButton, styles.deleteButton]}>
                <Text style={styles.buttonText}>Del</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.total}>Total: ₱{totalPrice.toLocaleString()}</Text>

      <TouchableOpacity style={styles.buttonPrimary} onPress={() => {
        console.log("Add Item pressed");
        setModalVisible(true);
      }}>
        <Text style={styles.buttonText}>Add Item</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonPrimary} onPress={handleSubmitRequest}>
        <Text style={styles.buttonText}>Submit Request</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true} 
      >
        <View style={styles.modalWrapper}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? "Edit Item" : "Add CAPEX Item"}
            </Text>

            <TextInput
              placeholder="Item Description"
              value={itemDescription}
              onChangeText={setItemDescription}
              style={styles.input}
            />
            <TextInput
              placeholder="Quantity"
              keyboardType="numeric"
              value={qty}
              onChangeText={setQty}
              style={styles.input}
            />
            <TextInput
              placeholder="Estimated Cost"
              keyboardType="numeric"
              value={estimatedCost}
              onChangeText={setEstimatedCost}
              style={styles.input}
            />
            <TextInput
              placeholder="Justification"
              value={justification}
              onChangeText={setJustification}
              style={styles.input}
            />

            <Button title="Save" onPress={handleSave} />
            <Button title="Cancel" color="gray" onPress={resetForm} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CapexRequestScreen;
