// ItemListScreen.js
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StatusBar } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import styles from "../styles/adminStyle/ItemListStyle";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from "../Header";

const ItemListScreen = () => {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <Text style={styles.details}>Inventory Balance: {item.quantity} </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#007bff" style={{ flex: 1, justifyContent: "center" }} />;
  }



  return (
    <View style={styles.container}>
      <View style={styles.inventoryStocksHeader} onLayout={handleHeaderLayout}>
          <TouchableOpacity onPress={() => navigation.navigate('Admin2Dashboard')} style={styles.backButton}>
                          <Icon name="keyboard-backspace" size={28} color="black" />
                        </TouchableOpacity>

        <View>
          <Text style={{textAlign: 'center', fontWeight: 800, fontSize: 18, color: '#395a7f'}}>Update Item Stocks</Text>
          <Text style={{ fontWeight: 300, fontSize: 13, textAlign: 'center'}}>Scan Item to Update</Text>
        </View>

          <TouchableOpacity style={{padding: 2}}>
            <Icon name="information-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

    <View style={{flex: 1, backgroundColor: 'white', marginTop: headerHeight+5,padding: 10, }}>
      <Text style={styles.title}>All Inventory Items</Text>
      <Text style={{color: 'gray', marginBottom: 10}}>Select an Item</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20, padding: 10}}
      />
    </View>
    </View>
  );
};

export default ItemListScreen;
