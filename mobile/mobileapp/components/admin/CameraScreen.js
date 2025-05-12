import React, { useState, useEffect, useRef } from "react"; 
import { View, Text, TouchableOpacity, Animated, Dimensions, Alert } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from "expo-camera";
import CryptoJS from "crypto-js"; // 🔒 Import crypto-js for decryption
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import styles from "../styles/adminStyle/CameraStyle";
import CONFIG from "../config";

const { width, height } = Dimensions.get("window");
const frameSize = width * 0.7;
const SECRET_KEY = CONFIG.SECRET_KEY;

const CameraScreen = ({ onClose }) => {
  const [cameraType, setCameraType] = useState("back");
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const scanLinePosition = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    animateScanLine();
  }, []);

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

  const handleBackButton = () => {
    onClose(); // Call onClose to reset the state and go back
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;

    setScanned(true);

    try {
      const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedData) throw new Error("Invalid QR Code");

      const parsedData = JSON.parse(decryptedData);
      const { itemName } = parsedData;

      const todayDate = getTodayDate();
      const q = query(collection(db, "borrowcatalog"), where("dateRequired", "==", todayDate));
      const querySnapshot = await getDocs(q);

      let found = false;
      let alreadyDeployed = false;
      let invalidStatus = false;
      const borrowedItemsDetails = [];

      if (!querySnapshot.empty) {
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          const borrowedItem = data.requestList.find((item) => item.itemName === itemName);

          if (borrowedItem) {
            found = true;
            const currentStatus = data.status?.toLowerCase();

            // if (currentStatus === "borrowed") {
            //   const updatedRequestList = data.requestList.map((item) =>
            //     item.itemName === itemName ? { ...item, status: "deployed" } : item
            //   );

            //   await updateDoc(doc(db, "borrowcatalog", docSnap.id), {
            //     requestList: updatedRequestList,
            //     status: "Deployed"
            //   });

            if (currentStatus === "borrowed") {
              const updatedRequestList = data.requestList.map((item) => {
                if (item.itemName === itemName) {
                  const newCount = (item.scannedCount || 0) + 1;
                  return {
                    ...item,
                    status: "deployed",
                    scannedCount: newCount
                  };
                }
                return item;
              });

              // await updateDoc(doc(db, "borrowcatalog", docSnap.id), {
              //   requestList: updatedRequestList,
              //   status: "Deployed"
              // });

              const allDeployed = updatedRequestList.every(item => (item.scannedCount || 0) >= item.quantity); 

              await updateDoc(doc(db, "borrowcatalog", docSnap.id), {
                requestList: updatedRequestList,
                ...(allDeployed && { status: "Deployed" })
              });

              borrowedItemsDetails.push({
                borrower: data.userName || "Unknown",
                borrowedDate: data.dateRequired,
                timeFrom: data.timeFrom || "00:00",
                timeTo: data.timeTo || "00:00"
              });

            } else if (currentStatus === "deployed") {
              alreadyDeployed = true;

            } else {
              invalidStatus = true;
            }
          }
        }

        if (borrowedItemsDetails.length > 0) {
          borrowedItemsDetails.sort((a, b) => {
            const [aH, aM] = a.timeFrom.split(":").map(Number);
            const [bH, bM] = b.timeFrom.split(":").map(Number);
            return aH * 60 + aM - (bH * 60 + bM);
          });

          let detailsMessage = `Item: ${itemName}\n\n`;
          borrowedItemsDetails.forEach((detail) => {
            detailsMessage += `Requestor: ${detail.borrower}\nDate: ${detail.borrowedDate}\nTime: ${detail.timeFrom} - ${detail.timeTo}\n\n`;
          });

          Alert.alert("Item Deployed", detailsMessage);

        } else if (alreadyDeployed) {
          Alert.alert("Already Deployed", `Item "${itemName}" has already been deployed.`);

        } else if (invalidStatus) {
          Alert.alert("Invalid Status", `Item "${itemName}" is not currently in a 'Borrowed' status.`);
          
        } else if (!found) {
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

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleBackButton}>
        <Text style={styles.text}>Go Back</Text>
      </TouchableOpacity>
      
      <CameraView
        style={styles.camera}
        facing={cameraType}
        ref={cameraRef}
        barcodeScannerEnabled={true}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.maskTop} />
          <View style={styles.maskBottom} />
          <View style={[styles.maskLeft, { top: (height - frameSize) / 2, height: frameSize }]} />
          <View style={[styles.maskRight, { top: (height - frameSize) / 2, height: frameSize }]} />

          <View style={styles.scannerFrame}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />

            <Animated.View style={[styles.scanLine, { top: scanLinePosition }]} />
          </View>
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
    </View>
  );
};

export default CameraScreen;
