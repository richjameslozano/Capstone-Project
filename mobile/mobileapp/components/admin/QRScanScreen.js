import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import styles from "../styles/adminStyle/QRScanStyle";
import Header from "../Header";

const QRScanScreen = () => {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const snapshot = await getDocs(collection(db, "inventory"));
        const fetchedItems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setItems(fetchedItems);
        
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleTrackItems = () => {
    navigation.navigate("CameraShowItems");
  };

  const handleUpdateStock = () => {
    navigation.navigate("ItemListScreen");
  };

  const handleDeployReturnStock = () => {
    navigation.navigate("RequestorListScreen");
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#007bff" style={{ flex: 1, justifyContent: "center" }} />;
  }

  return (
    <View style={styles.container}>
      <Header />
      <Text style={styles.title}>Manage Inventory</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleTrackItems}
      >
        <Text style={styles.buttonText}>Track Items</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleUpdateStock}
      >
        <Text style={styles.buttonText}>Update Stock Item</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleDeployReturnStock}
      >
        <Text style={styles.buttonText}>Deploy / Return Items</Text>
      </TouchableOpacity>

      {/* List of Inventory Items */}
      {/* <View style={styles.itemsContainer}>
        {items.map(item => (
          <View key={item.id} style={styles.itemCard}>
            <Text style={styles.itemName}>{item.itemName}</Text>
            <Text style={styles.details}>Qty: {item.quantity} | Condition: {item.condition || "N/A"}</Text>
          </View>
        ))}
      </View> */}
    </View>
  );
};

export default QRScanScreen;
