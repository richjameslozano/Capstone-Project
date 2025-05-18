import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Dimensions, Alert } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from "expo-camera";
import CryptoJS from "crypto-js";
import { collection, query, getDocs, where, serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import { useAuth } from '../contexts/AuthContext';
import styles from "../styles/adminStyle/CameraStyle";
import QuantityModal from '../customs/QuantityModal';
import CONFIG from "../config";
import Header from "../Header";

const { width, height } = Dimensions.get("window");
const frameSize = width * 0.7;
const SECRET_KEY = CONFIG.SECRET_KEY;

const CameraUpdateItems = ({ onClose }) => {
  const { user } = useAuth();
  const [cameraType, setCameraType] = useState("back");
  const [scanned, setScanned] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
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
        navigation.goBack();
    };

    const logRequestOrReturn = async (userId, userName, action) => {
        try {
        await addDoc(collection(db, `accounts/${userId}/activitylog`), {
            action, // e.g., "Added a Capex Item", "Requested Items", etc.
            userName,
            timestamp: serverTimestamp(),
        });
        } catch (error) {
        console.error("Error logging request or return activity:", error);
        }
    };

    const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      if (!decryptedData) throw new Error("Invalid QR Code");

      let parsedData;
      try {
        parsedData = JSON.parse(decryptedData);
      } catch {
        parsedData = decryptedData;
      }

      if (parsedData.itemName && parsedData.itemId && parsedData.labRoom) {
        setCurrentItem(parsedData);
        setModalVisible(true);
      } else {
        Alert.alert("Invalid QR", "QR does not contain valid item data.");
        setScanned(false);
      }
    } catch (err) {
      console.error("QR Scan Error:", err);
      Alert.alert("Scan Failed", "Failed to read QR code.");
      setScanned(false);
    }
  };

  const handleAddQuantity = async (addedQuantity) => {
    const { itemId, itemName, labRoom } = currentItem;

    try {
      // Update inventory
      const inventoryQuery = query(collection(db, 'inventory'), where('itemId', '==', itemId));
      const snapshot = await getDocs(inventoryQuery);

      snapshot.forEach(async docSnap => {
        const ref = doc(db, 'inventory', docSnap.id);
        const existing = docSnap.data();
        await updateDoc(ref, {
          quantity: (existing.quantity || 0) + addedQuantity,
        });
      });

      // Update labRoom subcollection
      const labRef = doc(db, `labRoom/${labRoom}/items`, itemId);
      const labSnap = await getDoc(labRef);
      if (labSnap.exists()) {
        const existing = labSnap.data();
        await updateDoc(labRef, {
          quantity: (existing.quantity || 0) + addedQuantity,
        });
      }

      Alert.alert("Success", `Added ${addedQuantity} to "${itemName}"`);
    } catch (err) {
      console.error("Quantity update error:", err);
      Alert.alert("Error", "Failed to update quantity.");
    } finally {
      setModalVisible(false);
      setScanned(false);
    }
  };


  return (
    <View style={styles.container}>
    <Header/>
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

      <QuantityModal
        visible={modalVisible}
        itemName={currentItem?.itemName}
        onClose={() => {
          setModalVisible(false);
          setScanned(false);
        }}
        onSubmit={handleAddQuantity}
      />
    </View>
  );
};

export default CameraUpdateItems;
