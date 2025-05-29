import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Dimensions, Alert, Modal, FlatList } from "react-native";
import { useNavigation, useRoute } from '@react-navigation/native';
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
  const cameraRef = useRef(null);
  const scanLinePosition = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const route = useRoute();
  const selectedItem = route.params?.selectedItem;
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedVolumeIndex, setSelectedVolumeIndex] = useState(null);
  const [volumeModalVisible, setVolumeModalVisible] = useState(false);

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

  //   const handleBarCodeScanned = async ({ data }) => {
  //   if (scanned) return;
  //   setScanned(true);

  //   try {
  //     const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
  //     const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
  //     if (!decryptedData) throw new Error("Invalid QR Code");

  //     let parsedData;
  //     try {
  //       parsedData = JSON.parse(decryptedData);

  //     } catch {
  //       parsedData = decryptedData;
  //     }

  //     // if (parsedData.itemName && parsedData.itemId && parsedData.labRoom) {
  //     //   setCurrentItem(parsedData);
  //     //   setModalVisible(true);

  //     // } else {
  //     //   Alert.alert("Invalid QR", "QR does not contain valid item data.");
  //     //   setScanned(false);
  //     // }

  //     if (parsedData.itemName && parsedData.itemId && parsedData.labRoom) {
  //       if (parsedData.itemId !== selectedItem.itemId) {
  //         Alert.alert("Invalid Item", "You can only scan the selected item.");
  //         setScanned(false);
  //         return;
  //       }

  //       setCurrentItem(parsedData);
  //       setModalVisible(true);
  //     } else {
  //       Alert.alert("Invalid QR", "QR does not contain valid item data.");
  //       setScanned(false);
  //     }
          
  //   } catch (err) {
  //     console.error("QR Scan Error:", err);
  //     Alert.alert("Scan Failed", "Failed to read QR code.");
  //     setScanned(false);
  //   }
  // };

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

  // const handleAddQuantity = async (addedQuantity) => {
  //   const { itemId, itemName, labRoom } = currentItem;

  //   try {
  //     // Update inventory
  //     const inventoryQuery = query(collection(db, 'inventory'), where('itemId', '==', itemId));
  //     const snapshot = await getDocs(inventoryQuery);

  //     snapshot.forEach(async docSnap => {
  //       const ref = doc(db, 'inventory', docSnap.id);
  //       const existing = docSnap.data();
  //       await updateDoc(ref, {
  //         quantity: (existing.quantity || 0) + addedQuantity,
  //       });
  //     });

  //     // Update labRoom subcollection
  //     const labRef = doc(db, `labRoom/${labRoom}/items`, itemId);
  //     const labSnap = await getDoc(labRef);
  //     if (labSnap.exists()) {
  //       const existing = labSnap.data();
  //       await updateDoc(labRef, {
  //         quantity: (existing.quantity || 0) + addedQuantity,
  //       });
  //     }

  //     Alert.alert("Success", `Added ${addedQuantity} to "${itemName}"`);
  //   } catch (err) {
  //     console.error("Quantity update error:", err);
  //     Alert.alert("Error", "Failed to update quantity.");
  //   } finally {
  //     setModalVisible(false);
  //     setScanned(false);
  //   }
  // };

  // const handleAddQuantity = async (addedQuantity) => {
  //   const { itemId, itemName, labRoom } = currentItem;

  //   try {
  //     // 🔁 Update inventory
  //     const inventoryQuery = query(collection(db, 'inventory'), where('itemId', '==', itemId));
  //     const snapshot = await getDocs(inventoryQuery);

  //     snapshot.forEach(async docSnap => {
  //       const ref = doc(db, 'inventory', docSnap.id);
  //       const existing = docSnap.data();

  //       const newQty = (Number(existing.quantity) || 0) + addedQuantity;
  //       const newGood = (Number(existing.condition?.Good) || 0) + addedQuantity;


  //       await updateDoc(ref, {
  //         quantity: newQty,
  //         'condition.Good': newGood
  //       });

  //       console.log(`✅ Inventory updated: quantity → ${newQty}, condition.Good → ${newGood}`);
  //     });

  //     // 🔁 Update labRoom subcollection
  //     const labRef = doc(db, `labRoom/${labRoom}/items`, itemId);
  //     const labSnap = await getDoc(labRef);

  //     if (labSnap.exists()) {
  //       const existing = labSnap.data();

  //       const newQty = (Number(existing.quantity) || 0) + addedQuantity;
  //       const newGood = (Number(existing.condition?.Good) || 0) + addedQuantity;

  //       await updateDoc(labRef, {
  //         quantity: newQty,
  //         'condition.Good': newGood
  //       });

  //       console.log(`✅ labRoom updated: quantity → ${newQty}, condition.Good → ${newGood}`);
  //     }

  //     Alert.alert("Success", `Added ${addedQuantity} to "${itemName}"`);

  //   } catch (err) {
  //     console.error("Quantity update error:", err);
  //     Alert.alert("Error", "Failed to update quantity.");

  //   } finally {
  //     setModalVisible(false);
  //     setScanned(false);
  //   }
  // };

  // const handleAddQuantity = async (addedQuantity) => {
  //   const { itemId, itemName, labRoom: roomNumber } = currentItem;

  //   try {
  //     console.log("roomNumber:", roomNumber); // Should be '0930'
  //     console.log("itemId:", itemId);         // Should be 'DENT02'

  //     const inventoryQuery = query(collection(db, 'inventory'), where('itemId', '==', itemId));
  //     const snapshot = await getDocs(inventoryQuery);

  //       snapshot.forEach(async docSnap => {
  //         const ref = doc(db, 'inventory', docSnap.id);
  //         const existing = docSnap.data();

  //         const newQty = (Number(existing.quantity) || 0) + addedQuantity;
  //         const newGood = (Number(existing.condition?.Good) || 0) + addedQuantity;


  //         await updateDoc(ref, {
  //           quantity: newQty,
  //           'condition.Good': newGood
  //         });

  //         console.log(`✅ Inventory updated: quantity → ${newQty}, condition.Good → ${newGood}`);
  //       });


  //     // ✅ STEP 1: Get the labRoom doc ID using roomNumber
  //     const labRoomQuery = query(
  //       collection(db, 'labRoom'),
  //       where('roomNumber', '==', roomNumber)
  //     );
  //     const labRoomSnap = await getDocs(labRoomQuery);

  //     if (labRoomSnap.empty) {
  //       Alert.alert("Error", `Lab room ${roomNumber} not found.`);
  //       return;
  //     }

  //     const labRoomDocId = labRoomSnap.docs[0].id; // <-- correct Firestore document ID

  //     // ✅ STEP 2: Get item in subcollection
  //     const itemDocRef = doc(db, `labRoom/${labRoomDocId}/items/${itemId}`);
  //     const itemDocSnap = await getDoc(itemDocRef);

  //     if (!itemDocSnap.exists()) {
  //       Alert.alert("Error", `Item ${itemId} not found in labRoom items.`);
  //       return;
  //     }

  //     // ✅ STEP 3: Update quantity and condition
  //     const existing = itemDocSnap.data();
  //     const newQty = (Number(existing.quantity) || 0) + addedQuantity;
  //     const newGood = (Number(existing.condition?.Good) || 0) + addedQuantity;

  //     await updateDoc(itemDocRef, {
  //       quantity: newQty,
  //       'condition.Good': newGood,
  //     });

  //     console.log(`✅ labRoom updated: quantity → ${newQty}, condition.Good → ${newGood}`);
  //     Alert.alert("Success", `Added ${addedQuantity} to "${itemName}"`);

  //   } catch (err) {
  //     console.error("Quantity update error:", err);
  //     Alert.alert("Error", "Failed to update quantity.");

  //   } finally {
  //     setModalVisible(false);
  //     setScanned(false);
  //   }
  // };

//   const handleAddQuantity = async (addedQuantity, selectedVolume = null) => {
//   const { itemId, itemName, labRoom: roomNumber, category } = currentItem;

//   try {
//     console.log("roomNumber:", roomNumber); // Should be '0930'
//     console.log("itemId:", itemId);         // Should be 'DENT02'

//     const inventoryQuery = query(collection(db, 'inventory'), where('itemId', '==', itemId));
//     const snapshot = await getDocs(inventoryQuery);

//     snapshot.forEach(async docSnap => {
//       const ref = doc(db, 'inventory', docSnap.id);
//       const existing = docSnap.data();

//      if (category.toLowerCase() === 'glasswares' && selectedVolume != null) {
//   // Find the volume entry in the quantity array
//   let quantityArray = existing.quantity || [];

//   // Find index of volume entry
//   const volumeIndex = quantityArray.findIndex(q => q.volume === selectedVolume);

//   if (volumeIndex !== -1) {
//     // Update existing volume qty
//     quantityArray[volumeIndex].qty = (Number(quantityArray[volumeIndex].qty) || 0) + addedQuantity;
//   } else {
//     // If volume entry doesn't exist, add new
//     quantityArray.push({ volume: selectedVolume, qty: addedQuantity });
//   }

//   // Calculate new total qty = sum of all qty in the array
//   const newTotalQty = quantityArray.reduce((sum, q) => sum + Number(q.qty), 0);

//   // Update condition.Good by addedQuantity
//   const newGood = (Number(existing.condition?.Good) || 0) + addedQuantity;

//   // Update Firestore document with new quantity array, total quantity, and condition
//   // await updateDoc(ref, {
//   //   quantity: quantityArray,
//   //   quantityTotal: newTotalQty,  // Optional: if you want to store total separately
//   //   'condition.Good': newGood
//   // });

//    await updateDoc(ref, {
//           quantity: quantityArray,
//           'condition.Good': newGood
//         });

//   console.log(`✅ Inventory updated for volume ${selectedVolume}: qty → ${quantityArray[volumeIndex]?.qty}, total quantity → ${newTotalQty}, condition.Good → ${newGood}`);
// } else {
//         // For other categories, update quantity normally
//         const newQty = (Number(existing.quantity) || 0) + addedQuantity;
//         const newGood = (Number(existing.condition?.Good) || 0) + addedQuantity;

//         await updateDoc(ref, {
//           quantity: newQty,
//           'condition.Good': newGood
//         });

//         console.log(`✅ Inventory updated: quantity → ${newQty}, condition.Good → ${newGood}`);
//       }
//     });


//     // ✅ STEP 1: Get the labRoom doc ID using roomNumber
//     const labRoomQuery = query(
//       collection(db, 'labRoom'),
//       where('roomNumber', '==', roomNumber)
//     );
//     const labRoomSnap = await getDocs(labRoomQuery);

//     if (labRoomSnap.empty) {
//       Alert.alert("Error", `Lab room ${roomNumber} not found.`);
//       return;
//     }

//     const labRoomDocId = labRoomSnap.docs[0].id; // <-- correct Firestore document ID

//     // ✅ STEP 2: Get item in subcollection
//     const itemDocRef = doc(db, `labRoom/${labRoomDocId}/items/${itemId}`);
//     const itemDocSnap = await getDoc(itemDocRef);

//     if (!itemDocSnap.exists()) {
//       Alert.alert("Error", `Item ${itemId} not found in labRoom items.`);
//       return;
//     }

//     // ✅ STEP 3: Update quantity and condition for labRoom subcollection
//     const existing = itemDocSnap.data();

// if (category === 'glasswares' && selectedVolume) {
//   let quantityArray = existing.quantity || [];
//   const volumeIndex = quantityArray.findIndex(q => q.volume === selectedVolume);

//   if (volumeIndex !== -1) {
//     quantityArray[volumeIndex].qty = (Number(quantityArray[volumeIndex].qty) || 0) + addedQuantity;
//   } else {
//     quantityArray.push({ volume: selectedVolume, qty: addedQuantity });
//   }

//   const newTotalQty = quantityArray.reduce((sum, q) => sum + Number(q.qty), 0);
//   const newGood = (Number(existing.condition?.Good) || 0) + addedQuantity;

//   // await updateDoc(itemDocRef, {
//   //   quantity: quantityArray,
//   //   quantityTotal: newTotalQty,
//   //   'condition.Good': newGood,
//   // });

//       await updateDoc(itemDocRef, {
//         quantity: quantityArray,
//         'condition.Good': newGood
//       });

//   console.log(`✅ labRoom updated for volume ${selectedVolume}: qty → ${quantityArray[volumeIndex]?.qty}, total quantity → ${newTotalQty}, condition.Good → ${newGood}`);
// } else {
//       // Normal update for other categories
//       const newQty = (Number(existing.quantity) || 0) + addedQuantity;
//       const newGood = (Number(existing.condition?.Good) || 0) + addedQuantity;

//       await updateDoc(itemDocRef, {
//         quantity: newQty,
//         'condition.Good': newGood,
//       });

//       console.log(`✅ labRoom updated: quantity → ${newQty}, condition.Good → ${newGood}`);
//     }

//     Alert.alert("Success", `Added ${addedQuantity} to "${itemName}"${selectedVolume ? ` (Volume: ${selectedVolume})` : ''}`);

//   } catch (err) {
//     console.error("Quantity update error:", err);
//     Alert.alert("Error", "Failed to update quantity.");

//   } finally {
//     setModalVisible(false);
//     setScanned(false);
//   }
// };

  const handleAddQuantity = async (addedQuantity) => {
    const { itemId, itemName, labRoom: roomNumber } = currentItem;

    try {
      console.log("roomNumber:", roomNumber); // Should be '0930'
      console.log("itemId:", itemId);         // Should be 'DENT02'

      const inventoryQuery = query(collection(db, 'inventory'), where('itemId', '==', itemId));
      const snapshot = await getDocs(inventoryQuery);

        snapshot.forEach(async docSnap => {
          const ref = doc(db, 'inventory', docSnap.id);
          const existing = docSnap.data();

          const newQty = (Number(existing.quantity) || 0) + addedQuantity;
          const newGood = (Number(existing.condition?.Good) || 0) + addedQuantity;


          await updateDoc(ref, {
            quantity: newQty,
            'condition.Good': newGood
          });

          console.log(`✅ Inventory updated: quantity → ${newQty}, condition.Good → ${newGood}`);
        });


      // ✅ STEP 1: Get the labRoom doc ID using roomNumber
      const labRoomQuery = query(
        collection(db, 'labRoom'),
        where('roomNumber', '==', roomNumber)
      );
      const labRoomSnap = await getDocs(labRoomQuery);

      if (labRoomSnap.empty) {
        Alert.alert("Error", `Lab room ${roomNumber} not found.`);
        return;
      }

      const labRoomDocId = labRoomSnap.docs[0].id; // <-- correct Firestore document ID

      // ✅ STEP 2: Get item in subcollection
      const itemDocRef = doc(db, `labRoom/${labRoomDocId}/items/${itemId}`);
      const itemDocSnap = await getDoc(itemDocRef);

      if (!itemDocSnap.exists()) {
        Alert.alert("Error", `Item ${itemId} not found in labRoom items.`);
        return;
      }

      // ✅ STEP 3: Update quantity and condition
      const existing = itemDocSnap.data();
      const newQty = (Number(existing.quantity) || 0) + addedQuantity;
      const newGood = (Number(existing.condition?.Good) || 0) + addedQuantity;

      await updateDoc(itemDocRef, {
        quantity: newQty,
        'condition.Good': newGood,
      });

      console.log(`✅ labRoom updated: quantity → ${newQty}, condition.Good → ${newGood}`);
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

      <Text style={styles.text}>Scanning for: {selectedItem?.itemName}</Text>

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
