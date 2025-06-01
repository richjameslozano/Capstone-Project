import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, Animated, Dimensions, Alert, Modal, FlatList, StatusBar } from "react-native";
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from "expo-camera";
import CryptoJS from "crypto-js";
import { collection, query, getDocs, where, serverTimestamp, doc, getDoc, updateDoc, addDoc, orderBy, limit, docSnap } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import { useAuth } from '../contexts/AuthContext';
import styles from "../styles/adminStyle/CameraStyle";
import QuantityModal from '../customs/QuantityModal';
import CONFIG from "../config";
import Header from "../Header";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get("window");
const frameSize = width * 0.7;
const SECRET_KEY = CONFIG.SECRET_KEY;

const CameraUpdateItems = ({ onClose }) => {
  const { user } = useAuth();
  const [cameraType, setCameraType] = useState("back");
  const [scanned, setScanned] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const cameraRef = useRef(null);
  const scanLinePosition = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const route = useRoute();
  const selectedItem = route.params?.selectedItem;
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedVolumeIndex, setSelectedVolumeIndex] = useState(null);
  const [volumeModalVisible, setVolumeModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      StatusBar.setBackgroundColor('transparent'); // Android only
      StatusBar.setTranslucent(true)
    }, [])
  );

  useEffect(() => {
    if (permission?.status !== 'granted') {
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
        navigation.navigate('QRScanScreen');
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

      const { itemId } = parsedData;

      if (!itemId) {
        Alert.alert("Invalid QR", "QR does not contain a valid item ID.");
        setScanned(false);
        return;
      }

      // ✅ Fetch item data from inventory collection
      const itemQuery = query(collection(db, 'inventory'), where('itemId', '==', itemId));
      const snapshot = await getDocs(itemQuery);

      if (snapshot.empty) {
        Alert.alert("Item Not Found", `No item with ID ${itemId} found in inventory.`);
        setScanned(false);
        return;
      }

      const itemData = snapshot.docs[0].data();

      if (itemId !== selectedItem.itemId) {
        Alert.alert("Invalid Item", "You can only scan the selected item.");
        setScanned(false);
        return;
      }

      const fullItem = {
        ...itemData,
        itemId,
      };

      console.log("✅ Scanned Item:", fullItem);

      setCurrentItem(fullItem);
      setModalVisible(true);
      
    } catch (err) {
      console.error("QR Scan Error:", err);
      Alert.alert("Scan Failed", "Failed to read QR code.");
      setScanned(false);
    }
  };



  const handleAddQuantity = async (addedQuantity, expiryDate) => {
  const { itemId, itemName, labRoom: roomNumber, category } = currentItem;
  const isChemicalOrReagent = category === "Chemical" || category === "Reagent";

  try {
    const inventoryQuery = query(collection(db, 'inventory'), where('itemId', '==', itemId));
    const snapshot = await getDocs(inventoryQuery);

    snapshot.forEach(async docSnap => {
      const ref = doc(db, 'inventory', docSnap.id);
      const existing = docSnap.data();

      const newQty = (Number(existing.quantity) || 0) + addedQuantity;
      const updateData = { quantity: newQty };

      if (!isChemicalOrReagent) {
        const newGood = (Number(existing.condition?.Good) || 0) + addedQuantity;
        updateData['condition.Good'] = newGood;
      }

      await updateDoc(ref, updateData);
      console.log(`✅ Inventory updated: quantity → ${newQty}${!isChemicalOrReagent ? `, condition.Good → ${updateData['condition.Good']}` : ''}`);

      // Add to stockLog
      const stockLogRef = collection(db, "inventory", docSnap.id, "stockLog");
      const latestLogQuery = query(stockLogRef, orderBy("createdAt", "desc"), limit(1));
      const latestSnapshot = await getDocs(latestLogQuery);

      let newDeliveryNumber = "DLV-00001";
      if (!latestSnapshot.empty) {
        const lastDeliveryNumber = latestSnapshot.docs[0].data().deliveryNumber;
        const match = lastDeliveryNumber?.match(/DLV-(\d+)/);
        if (match) {
          const nextNumber = (parseInt(match[1], 10) + 1).toString().padStart(5, "0");
          newDeliveryNumber = `DLV-${nextNumber}`;
        }
      }

      const logData = {
        date: new Date().toISOString().split("T")[0],
        noOfItems: addedQuantity,
        deliveryNumber: newDeliveryNumber,
        createdAt: serverTimestamp(),
      };

      if (isChemicalOrReagent && expiryDate) {
        logData.expiryDate = expiryDate;
      }

      await addDoc(stockLogRef, logData);
      console.log(`✅ New stock log added with delivery number: ${newDeliveryNumber}`);
    });

    // 🔎 Step 1: Find labRoom doc
    const labRoomQuery = query(collection(db, 'labRoom'), where('roomNumber', '==', roomNumber));
    const labRoomSnap = await getDocs(labRoomQuery);

    if (labRoomSnap.empty) {
      Alert.alert("Error", `Lab room ${roomNumber} not found.`);
      return;
    }

    const labRoomDocId = labRoomSnap.docs[0].id;
    const itemDocRef = doc(db, `labRoom/${labRoomDocId}/items/${itemId}`);
    const itemDocSnap = await getDoc(itemDocRef);

    if (!itemDocSnap.exists()) {
      Alert.alert("Error", `Item ${itemId} not found in labRoom items.`);
      return;
    }

    const existing = itemDocSnap.data();
    const newQty = (Number(existing.quantity) || 0) + addedQuantity;
    const updateRoomData = { quantity: newQty };

    if (!isChemicalOrReagent) {
      const newGood = (Number(existing.condition?.Good) || 0) + addedQuantity;
      updateRoomData['condition.Good'] = newGood;
    }

    await updateDoc(itemDocRef, updateRoomData);
    console.log(`✅ labRoom updated: quantity → ${newQty}${!isChemicalOrReagent ? `, condition.Good → ${updateRoomData['condition.Good']}` : ''}`);

    Alert.alert("Success", `Added ${addedQuantity} to "${itemName}"`);

  } catch (err) {
    console.error("Quantity update error:", err);
    Alert.alert("Error", "Failed to update quantity.");
  } finally {
    setModalVisible(false);
    setScanned(false);
  }
};

const { width, height } = Dimensions.get('window');
const frameWidth = width * 0.7;
const frameHeight = frameWidth; // square frame

const topOffset = (height - frameHeight) / 3;
const bottomOffset = height - topOffset - frameHeight;
const sideWidth = (width - frameWidth) / 2;


  return (
    <View style={styles.container}>

      <TouchableOpacity onPress={handleBackButton} style={styles.backBtn}>
               <Icon name="keyboard-backspace" size={28} color="white" />
              <Text style={styles.text}>Go Back</Text>
            </TouchableOpacity>

      <Text style={{position: 'absolute', color: 'white', top: topOffset-30, zIndex: 999}}>Scanning for: {selectedItem?.itemName}</Text>
      <Text style={{position: 'absolute', color: 'white', bottom: bottomOffset-10, zIndex: 999, fontWeight: 'bold', fontSize: 20}}>Update Stock Items</Text>

      <CameraView
        style={styles.camera}
        facing={cameraType}
        ref={cameraRef}
        barcodeScannerEnabled={true}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
<View style={styles.overlay}>
  <View style={[styles.maskTop, { height: topOffset }]} />
  <View style={[styles.maskBottom, { height: bottomOffset+35 }]} />
  <View style={[styles.maskLeft, { top: topOffset, height: frameHeight, width: sideWidth }]} />
  <View style={[styles.maskRight, { top: topOffset, height: frameHeight, width: sideWidth }]} />

  <View style={[styles.scannerFrame, { top: topOffset, width: frameWidth, height: frameHeight }]}>
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
        category={currentItem?.category} 
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
