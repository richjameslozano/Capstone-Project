import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import CameraScreen from "./CameraScreen";
import styles from "../styles/adminStyle/RequestedItemsStyle";
import Header from '../Header';

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const day = today.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const RequestedItemsScreen = ({ route, navigation }) => {
  const { userName } = route.params;
  const [requestedItems, setRequestedItems] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchRequestedItems = async () => {
      const todayDate = getTodayDate();
      const q = query(collection(db, "borrowcatalog"), where("dateRequired", "==", todayDate));
      const querySnapshot = await getDocs(q);
      const itemsData = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userName === userName && data.requestList) {
          data.requestList.forEach((item) => {
            itemsData.push(item);
          });
        }
      });

      setRequestedItems(itemsData);
    };

    fetchRequestedItems();
  }, [userName]);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowScanner(true);
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
    setSelectedItem(null);  // Reset selected item when scanner is closed
  };

  return (
    <View style={styles.container}>
      <Header />
      {showScanner ? (
        <CameraScreen
          item={selectedItem}
          onClose={handleCloseScanner}
        />
      ) : (
        <>
          <Text style={styles.title}>Requested Items for {userName}</Text>
          <FlatList
            data={requestedItems}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.itemButton}
                onPress={() => handleItemClick(item)}
              >
                <Text style={styles.itemText}>{item.itemName}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => `${item.itemName}-${index}`}
          />
        </>
      )}
    </View>
  );
};

export default RequestedItemsScreen;
