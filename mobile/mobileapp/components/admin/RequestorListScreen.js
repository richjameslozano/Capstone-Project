import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import styles from "../styles/adminStyle/RequestorListStyle";
import Header from '../Header';

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

  return (
    <View style={styles.container}>
      <Header/>
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

      <Text style={styles.debugText}>Component is rendering</Text>
    </View>
  );
};

export default RequestorListScreen;
