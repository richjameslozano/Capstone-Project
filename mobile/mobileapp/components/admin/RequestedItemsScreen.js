import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Dimensions } from "react-native";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import CameraScreen from "./CameraScreen";
import styles from "../styles/adminStyle/RequestedItemsStyle";
import Header from '../Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
  const todayDate = getTodayDate();
  const q = query(collection(db, "borrowcatalog"), where("dateRequired", "==", todayDate));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const itemsData = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();

      if (
        data.userName === userName &&
        data.requestList &&
        (data.status === "Deployed" || data.status === "Returned" || data.status === "Borrowed")
      ) {
        data.requestList.forEach((item, index) => {
          itemsData.push({
            ...item,
            requestId: docSnap.id,
            requestIndex: index,
            status: data.status, 
            requestMeta: {
              timeFrom: data.timeFrom,
              timeTo: data.timeTo,
              borrower: data.userName,
              dateRequired: data.dateRequired,
              status: data.status
            }
          });
        });
      }

    });

    setRequestedItems(itemsData);
  });

  return () => unsubscribe(); // Cleanup
}, [userName]);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowScanner(true);
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
    setSelectedItem(null);
  };

    const [headerHeight, setHeaderHeight] = useState(0);
  const handleHeaderLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    setHeaderHeight(height);
  };


  return (
    <View style={styles.container}>

      
      {showScanner && selectedItem ? (
          <CameraScreen
            selectedItem={selectedItem}
            onClose={handleCloseScanner}
          />
        ) : (
        <>
          <View 
            style={[styles.inventoryStocksHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} 
            onLayout={handleHeaderLayout}
          >
            <TouchableOpacity onPress={() => navigation.navigate('RequestorListScreen')} style={styles.backButton}>
              <Icon name="keyboard-backspace" size={28} color="black" />
            </TouchableOpacity>

            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ textAlign: 'center', fontWeight: '800', fontSize: 18, color: '#395a7f' }}>
                Deploy/Return Items
              </Text>
              <Text style={{ fontWeight: '300', fontSize: 13, textAlign: 'center' }}>
                Scan Item to Deploy/Return
              </Text>
            </View>

            {/* Placeholder to balance back button width */}
            <View style={{ width: 28 }} />
          </View>

          <Text style={styles.title}>Requested Items for {userName}</Text>
          <FlatList
            data={requestedItems}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.itemButton}
                onPress={() => handleItemClick(item)}
              >
                <Text style={styles.itemText}>
                  {item.itemName} {item.status ? `(${item.status})` : ""}
                </Text>
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
