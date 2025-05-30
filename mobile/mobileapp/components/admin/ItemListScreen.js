// ItemListScreen.js
import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import styles from "../styles/adminStyle/ItemListStyle";
import Header from "../Header";

const ItemListScreen = () => {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "inventory"),
      (snapshot) => {
        const fetchedItems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setItems(fetchedItems);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching items:", error);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const handleItemPress = (item) => {
    navigation.navigate("CameraUpdateItems", { selectedItem: item });
  };

const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.itemCard} onPress={() => handleItemPress(item)}>
      <Text style={styles.itemName}>{item.itemName}</Text>
      <Text style={styles.details}>Qty: {item.quantity} </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#007bff" style={{ flex: 1, justifyContent: "center" }} />;
  }

  return (
    <View style={styles.container}>
      <Header/>
      <Text style={styles.title}>All Inventory Items</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

export default ItemListScreen;
