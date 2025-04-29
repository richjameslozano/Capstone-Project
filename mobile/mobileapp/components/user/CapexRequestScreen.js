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
import { db } from "../../backend/firebase/FirebaseConfig";
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

  const handleSave = async () => {
    if (!itemDescription || !qty || !estimatedCost) {
      Alert.alert("Validation Error", "All fields are required");
      return;
    }

    // Check if the item already exists
    const existingItemQuery = await getDocs(
      collection(db, `accounts/${user.id}/temporaryCapexRequest`)
    );
    const existingItem = existingItemQuery.docs.find(
      (doc) => doc.data().itemDescription.toLowerCase() === itemDescription.toLowerCase()
    );

    if (existingItem) {
      Alert.alert("Validation Error", "This item already exists in your CAPEX request.");
      return;
    }

    const itemData = {
      itemDescription,
      qty: Number(qty),
      estimatedCost: Number(estimatedCost),
      totalPrice: Number(qty) * Number(estimatedCost),
      justification,
    };

    try {
      if (editingItem) {
        const ref = doc(
          db,
          `accounts/${userId}/temporaryCapexRequest`,
          editingItem.id
        );
        await setDoc(ref, itemData);

      } else {
        await addDoc(
          collection(db, `accounts/${userId}/temporaryCapexRequest`),
          itemData
        );
      }

      resetForm();

    } catch (error) {
      Alert.alert("Error", "Failed to save item");
      console.error(error);
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
    try {
      await deleteDoc(doc(db, `accounts/${userId}/temporaryCapexRequest`, id));

    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleSubmitRequest = async () => {
    if (dataSource.length === 0) {
      Alert.alert("Error", "No items to submit");
      return;
    }

    try {
      const requestRef = await addDoc(collection(db, "capexrequestlist"), {
        userId,
        userName,
        totalPrice,
        createdAt: serverTimestamp(),
        items: dataSource,
      });

      await addDoc(collection(db, `accounts/${userId}/capexrequests`), {
        capexRequestId: requestRef.id,
        userId,
        userName,
        totalPrice,
        createdAt: serverTimestamp(),
        items: dataSource,
      });

      const snapshot = await getDocs(
        collection(db, `accounts/${userId}/temporaryCapexRequest`)
      );

      await Promise.all(
        snapshot.docs.map((docSnap) =>
          deleteDoc(doc(db, `accounts/${userId}/temporaryCapexRequest`, docSnap.id))
        )
      );

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
      <Header/>
      <Text style={styles.title}>CAPEX Request</Text>
      <Text style={styles.total}>Total: ₱{totalPrice.toLocaleString()}</Text>

      <FlatList
        data={dataSource}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.no}. {item.itemDescription}</Text>
            <Text>Qty: {item.qty}</Text>
            <Text>Est. Cost: ₱{item.estimatedCost}</Text>
            <Text>Total: ₱{item.totalPrice}</Text>
            <Text>Justification: {item.justification}</Text>
            <View style={styles.row}>
              <Button title="Edit" onPress={() => handleEdit(item)} />
              <Button title="Delete" color="red" onPress={() => handleDelete(item.id)} />
            </View>
          </View>
        )}
      />

      <Button title="Add Item" onPress={() => setModalVisible(true)} />
      <Button title="Submit Request" onPress={handleSubmitRequest} color="green" />

      <Modal visible={modalVisible} animationType="slide">
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
      </Modal>
    </View>
  );
};

export default CapexRequestScreen;
