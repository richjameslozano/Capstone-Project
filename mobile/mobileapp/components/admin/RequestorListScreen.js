import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, StatusBar, Dimensions } from "react-native";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import styles from "../styles/adminStyle/RequestorListStyle";
import Header from '../Header';
import { useFocusEffect } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const day = today.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};


const RequestorListScreen = ({ navigation }) => {
  const [requestors, setRequestors] = useState([]);

  useEffect(() => {
    const todayDate = getTodayDate();
    console.log("Today is:", todayDate);
    Alert.alert("Today's Date", todayDate);

    const q = query(
      collection(db, "borrowcatalog"),
      where("dateRequired", "==", todayDate)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const requestorsData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.userName && !requestorsData.includes(data.userName)) {
            requestorsData.push(data.userName);
          }
        });

        if (querySnapshot.empty) {
          Alert.alert("No matches", "No documents found with today's date.");
        }

        setRequestors(requestorsData);
      },
      (error) => {
        console.error("onSnapshot error:", error);
        Alert.alert("Error", "There was an issue listening to requestors.");
      }
    );

    return () => unsubscribe();
  }, []);

  const handleRequestorClick = (userName) => {
    navigation.navigate("RequestedItemsScreen", { userName });
  };

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

  return (
    <View style={styles.container}>
      <View style={styles.inventoryStocksHeader} onLayout={handleHeaderLayout}>
          <TouchableOpacity onPress={() => navigation.navigate('QRScanScreen')} style={styles.backButton}>
                          <Icon name="keyboard-backspace" size={28} color="black" />
                        </TouchableOpacity>

        <View>
          <Text style={{textAlign: 'center', fontWeight: 800, fontSize: 18, color: '#395a7f'}}>Deploy/Return Items</Text>
          <Text style={{ fontWeight: 300, fontSize: 13, textAlign: 'center'}}>Scan Item to Deploy/Return</Text>
        </View>

          <TouchableOpacity style={{padding: 2}}>
            <Icon name="information-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      <Text style={styles.title}>Requestors for Today</Text>

      <FlatList
        data={requestors}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.requestorButton}
            onPress={() => handleRequestorClick(item)}
          >
            <Text style={styles.requestorText}>{item}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No requestors found.</Text>
        }
      />

      {/* <Text style={styles.debugText}>Component is rendering</Text> */}
    </View>
  );
};

export default RequestorListScreen;
