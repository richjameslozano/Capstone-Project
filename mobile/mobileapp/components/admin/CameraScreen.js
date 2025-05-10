import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Dimensions, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import CryptoJS from "crypto-js";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import styles from "../styles/adminStyle/CameraStyle";
import CONFIG from "../config";

const { width, height } = Dimensions.get("window");
const frameSize = width * 0.7;
const SECRET_KEY = CONFIG.SECRET_KEY;

const CameraScreen = ({ navigation }) => {
  const [cameraType, setCameraType] = useState("back");
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [todayRequestors, setTodayRequestors] = useState([]);
  const [selectedRequestor, setSelectedRequestor] = useState(null);
  const [requestorItems, setRequestorItems] = useState([]);
  const cameraRef = useRef(null);
  const scanLinePosition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    animateScanLine();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchTodayRequestors();
      return () => {
        setTodayRequestors([]); // optional: reset on blur
      };
    }, [])
  );

  const fetchTodayRequestors = async () => {
    const todayDate = getTodayDate();
    console.log("Checking Firestore for:", todayDate);

    try {
      const q = query(collection(db, "borrowcatalog"), where("dateRequired", "==", todayDate));
      const querySnapshot = await getDocs(q);
      const requestors = [];
      console.log("Docs found:", querySnapshot.size);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userName && data.requestList) {
          requestors.push({
            name: data.userName,
            timeFrom: data.timeFrom || "N/A",
            timeTo: data.timeTo || "N/A",
            requestList: data.requestList,
          });
        }
      });

      setTodayRequestors(requestors);
    } catch (err) {
      console.error("Failed to fetch today's requestors", err);
    }
  };

  const handleRequestorPress = (requestor) => {
    setSelectedRequestor(requestor);
    setRequestorItems(requestor.requestList || []);
  };

  const animateScanLine = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLinePosition, {
          toValue: styles.scannerFrame.height,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(scanLinePosition, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  if (!permission) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need permission to access your camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.flipButton}>
          <Text style={styles.text}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`; // Format as "YYYY-MM-DD"
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;

    setScanned(true);

    try {
      // 🔓 Decrypt QR Code Data
      const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedData) {
        throw new Error("Invalid QR Code");
      }

      const parsedData = JSON.parse(decryptedData);
      const { itemName } = parsedData; // Extract itemName from QR code

      // Get today's date to filter the borrow catalog
      const todayDate = getTodayDate();

      // Query Firestore to find all records where the item was borrowed today
      const q = query(collection(db, "borrowcatalog"), where("dateRequired", "==", todayDate));

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const borrowedItemsDetails = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();

          // Check if the item exists in the request list
          const borrowedItem = data.requestList.find(
            (item) => item.itemName === itemName
          );

          if (borrowedItem) {
            const borrower = data.userName || "Unknown"; // Assuming userName is the borrower name
            const borrowedDate = data.dateRequired;

            // Extract time from the top level (not inside requestList)
            const timeFrom = data.timeFrom || "00:00";
            const timeTo = data.timeTo || "00:00";

            borrowedItemsDetails.push({
              borrower,
              borrowedDate,
              timeFrom,
              timeTo
            });
          }
        });

        if (borrowedItemsDetails.length > 0) {
          // Sort borrowed items by timeFrom
          borrowedItemsDetails.sort((a, b) => {
            const [aHours, aMinutes] = a.timeFrom.split(":").map(Number);
            const [bHours, bMinutes] = b.timeFrom.split(":").map(Number);

            const aTotalMinutes = aHours * 60 + aMinutes;
            const bTotalMinutes = bHours * 60 + bMinutes;

            return aTotalMinutes - bTotalMinutes; // Sort ascending
          });

          let detailsMessage = `Item: ${itemName}\n\n`;

          borrowedItemsDetails.forEach((detail) => {
            detailsMessage += `Requestor: ${detail.borrower}\nDate: ${detail.borrowedDate}\nTime: ${detail.timeFrom} - ${detail.timeTo}\n\n`;
          });

          Alert.alert("Item Borrowed Today", detailsMessage);
        } else {
          Alert.alert("Item not found", "No records found for this item on today's date.");
        }

      } else {
        Alert.alert("No data found", "No records found for today in the borrow catalog.");
      }

    } catch (error) {
      Alert.alert("Error", "Invalid or unauthorized QR Code.");
    }

    setTimeout(() => setScanned(false), 1500);
  };

  const handleItemPress = (item) => {
    Alert.alert("Item Selected", `You tapped on: ${item.itemName}`);
    // You could also do other actions here, like navigate or fetch related data
  };

  return (
    <View style={styles.container}>
      {/* Step 1: Show requestor list */}
      {!selectedRequestor ? (
        <View style={{ backgroundColor: "#111", padding: 10, width: "100%" }}>
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>Today's Requestors</Text>
          {todayRequestors.length > 0 ? (
            todayRequestors.map((req, index) => (
              <TouchableOpacity key={index} onPress={() => handleRequestorPress(req)}>
                <Text style={{ color: "#ccc", fontSize: 14 }}>
                  • {req.name} ({req.timeFrom} - {req.timeTo})
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ color: "#777" }}>No requests for today</Text>
          )}
        </View>
      ) : (
        <>
          {/* Step 2: Show selected requestor's items */}
          <View style={{ padding: 10, backgroundColor: "#111", width: "100%" }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
              {selectedRequestor.name}'s Items
            </Text>
              {requestorItems.length > 0 ? (
                requestorItems.map((item, index) => (
                  <TouchableOpacity key={index} onPress={() => handleItemPress(item)}>
                    <Text style={{ color: "#ccc" }}>
                      • {item.itemName}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={{ color: "#777" }}>No items requested.</Text>
              )}
            <TouchableOpacity onPress={() => setSelectedRequestor(null)} style={styles.flipButton}>
              <Text style={styles.text}>Back to Requestors</Text>
            </TouchableOpacity>
          </View>

          {/* Step 3: Show Camera */}
          <CameraView
            style={styles.camera}
            facing={cameraType}
            ref={cameraRef}
            barcodeScannerEnabled={true}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          >
            <View style={styles.overlay}>
              {/* Scanner frame UI */}
            </View>
            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={() => setCameraType((prev) => (prev === "back" ? "front" : "back"))}
              >
                <Text style={styles.text}>Flip</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        </>
      )}
    </View>
  );
};

export default CameraScreen;
