import React, { useState, useEffect, useRef, useCallback } from "react"; 
import { View, Text, TouchableOpacity, Animated, Dimensions, Alert, StatusBar } from "react-native";
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import CryptoJS from "crypto-js"; // 🔒 Import crypto-js for decryption
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import { useAuth } from '../contexts/AuthContext';
import styles from "../styles/adminStyle/CameraStyle";
import CONFIG from "../config";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get("window");
const frameSize = width * 0.7;
const SECRET_KEY = CONFIG.SECRET_KEY;

const CameraScreen = ({ onClose, selectedItem }) => {
  const { user } = useAuth();
  const [cameraType, setCameraType] = useState("back");
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const scanLinePosition = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

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
    onClose();
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

      const parsedData = JSON.parse(decryptedData);
      const { itemName } = parsedData;

      const todayDate = getTodayDate();
      const q = query(collection(db, "borrowcatalog"), where("dateRequired", "==", todayDate));
      const querySnapshot = await getDocs(q);

      let found = false;
      let alreadyDeployed = false;
      let invalidStatus = false;
      const borrowedItemsDetails = [];

      let requestorUserId = null;
      let requestorLogData = null;
      let allDeployed = false;
      let updatedRequestList = null;

      if (!querySnapshot.empty) {
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          const borrowedItem = data.requestList.find(
            (item) =>
              item.itemName === itemName &&
              item.itemDetails === itemDetails &&
              item.selectedItemId === selectedItem.selectedItemId &&
              item.labRoom === selectedItem.labRoom &&
              item.quantity === selectedItem.quantity &&
              item.program === selectedItem.program &&
              item.timeFrom === selectedItem.timeFrom &&
              item.timeTo === selectedItem.timeTo
          );

          if (borrowedItem) {
            found = true;
            const currentStatus = data.status?.toLowerCase();

            if (currentStatus === "borrowed") {


              updatedRequestList = data.requestList.map((item) => {
                if (
                  item.itemName === itemName &&
                  item.itemDetails === itemDetails &&
                  item.selectedItemId === selectedItem.selectedItemId &&
                  item.labRoom === selectedItem.labRoom &&
                  item.quantity === selectedItem.quantity &&
                  item.program === selectedItem.program &&
                  item.timeFrom === selectedItem.timeFrom &&
                  item.timeTo === selectedItem.timeTo
                ) {
                  return {
                    ...item,
                    scannedCount: item.quantity,
                  };
                }
                return item;
              });

              allDeployed = updatedRequestList.every(item => (item.scannedCount || 0) >= item.quantity);

              await updateDoc(doc(db, "borrowcatalog", docSnap.id), {
                requestList: updatedRequestList,
                ...(allDeployed && { status: "Deployed" })
              });
              
              const deployedItem = data.requestList.find(item => item.itemName === itemName);

              Alert.alert("Deployed", `Deployed ${deployedItem.quantity} ${itemName} item(s).`);

              borrowedItemsDetails.push({
                borrower: data.userName || "Unknown",
                borrowedDate: data.dateRequired,
                timeFrom: data.timeFrom || "00:00",
                timeTo: data.timeTo || "00:00"
              });

              requestorUserId = data.accountId;
              requestorLogData = {
                ...data,
                action: "Deployed",
                deployedBy: user.name || "Unknown",
                deployedById: user.id,
                deployedAt: getTodayDate(),
                timestamp: serverTimestamp()
              };

              break;

            } else if (currentStatus === "deployed") {
              alreadyDeployed = true;

              } else if (currentStatus === "returned") {
              // ✅ Handle return approval
              const requestorId = data.accountId;
              const borrowDocRef = doc(db, "borrowcatalog", docSnap.id);

              const inventoryId = borrowedItem.selectedItemId;
              const returnQty = borrowedItem.returnedQuantity || 1; // ✅ SAFER
              const conditionReturned = Array.isArray(borrowedItem.conditions) && borrowedItem.conditions[0]
              ? borrowedItem.conditions[0]
              : "Good"; // default condition

              if (inventoryId && !isNaN(returnQty)) {
                const inventoryRef = doc(db, "inventory", inventoryId);
                const inventorySnap = await getDoc(inventoryRef);

              if (inventorySnap.exists()) {
                    const inventoryData = inventorySnap.data();
                    const currentQty = inventoryData.quantity || 0;
                    const currentCond = inventoryData.condition || {};
                    const currentCondQty = Number(currentCond[conditionReturned] || 0);

                    await updateDoc(inventoryRef, {
                      quantity: currentQty + returnQty,
                      [`condition.${conditionReturned}`]: currentCondQty + returnQty,
                    });


                  const labRoomNumber = inventorySnap.data().labRoom; // assuming labRoom holds room number like "LR-101"
                  const itemId = inventorySnap.data().itemId;

                  if (!labRoomNumber || !itemId) {
                    console.warn(`⚠️ Missing labRoomNumber or itemId for inventoryId ${inventoryId}`);
                    return;
                  }

                  try {
                    // 🔍 STEP 1: Find labRoom document by roomNumber
                    const labRoomQuery = query(
                      collection(db, "labRoom"),
                      where("roomNumber", "==", labRoomNumber)
                    );
                    const labRoomSnapshot = await getDocs(labRoomQuery);

                    if (labRoomSnapshot.empty) {
                      console.warn(`⚠️ No labRoom found with roomNumber: ${labRoomNumber}`);
                      return;
                    }

                    const labRoomDoc = labRoomSnapshot.docs[0];
                    const labRoomId = labRoomDoc.id;

                    // 🔍 STEP 2: Find item in the labRoom/{labRoomId}/items by itemId field
                    const labItemsRef = collection(db, "labRoom", labRoomId, "items");
                    const itemQuery = query(labItemsRef, where("itemId", "==", itemId));
                    const itemSnapshot = await getDocs(itemQuery);

                    if (itemSnapshot.empty) {
                      console.warn(`⚠️ LabRoom item not found for itemId ${itemId} in labRoom ${labRoomId}`);
                      return;
                    }

                    const itemDoc = itemSnapshot.docs[0];
                    const labItemDocId = itemDoc.id;
                    const labItemRef = doc(db, "labRoom", labRoomId, "items", labItemDocId);

                    const labData = itemDoc.data();
                    const currentLabQty = Number(labData.quantity || 0);
                    const currentLabCond = labData.condition || {};
                    const labCondQty = Number(currentLabCond[conditionReturned] || 0);

                    // ✅ Update the labRoom item quantity and condition
                    await updateDoc(labItemRef, {
                      quantity: currentLabQty + returnQty,
                      [`condition.${conditionReturned}`]: labCondQty + returnQty,
                    });

                    console.log(`✅ Updated labRoom item ${itemId} in room ${labRoomNumber} (${labRoomId})`);

                  } catch (error) {
                    console.error("🔥 Error updating labRoom item:", error);
                  }

              } else {
                console.warn(`❌ Inventory item not found for ID: ${inventoryId}`);
              }
            }
              
              await updateDoc(borrowDocRef, { status: "Return Approved" });

              const userRequestQuery = query(
                collection(db, `accounts/${requestorId}/userrequestlog`),
                where("dateRequired", "==", data.dateRequired)
              );

              const userRequestSnapshot = await getDocs(userRequestQuery);

              for (const userDoc of userRequestSnapshot.docs) {
                const userData = userDoc.data();
                const hasMatchingItem = userData.requestList?.some(item => item.itemName === itemName);

                if (hasMatchingItem) {
                  await updateDoc(doc(db, `accounts/${requestorId}/userrequestlog`, userDoc.id), {
                    status: "Return Approved"
                  });

                  await addDoc(collection(db, `accounts/${requestorId}/historylog`), {
                    ...userData,
                    action: "Return Approved",
                    approvedBy: user.name || "Unknown",
                    approvedById: user.id,
                    approvedAt: getTodayDate(),
                    timestamp: serverTimestamp()
                  });

                  Alert.alert("Return Approved", `Return of "${itemName}" approved.`);
                  break;
                }
              }

              return; 

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

          const firstDetail = borrowedItemsDetails[0];

          const updatedScannedItem = updatedRequestList.find(
            (item) => item.itemName === itemName && item.selectedItemId === selectedItem.selectedItemId
          );

          const scannedCount = updatedScannedItem?.scannedCount || 0;

          console.log("Scanned count after update:", scannedCount);

          await logRequestOrReturn(
            user.id,
            user.name || "Unknown",
            `Deployed "${itemName}" to ${firstDetail.borrower} in ${selectedItem.labRoom} (Scanned: ${scannedCount})`
          );

          if (allDeployed && requestorUserId && requestorLogData) {
            try {
              console.log("Writing to historylog for:", requestorUserId);
              await addDoc(collection(db, `accounts/${requestorUserId}/historylog`), requestorLogData);

            } catch (error) {
              console.error("Failed to write to historylog:", error);
            }

          } else {
            console.warn("Missing requestorUserId or log data.");
          }

          try {
            const userRequestQuery = query(
              collection(db, `accounts/${requestorUserId}/userrequestlog`),
              where("dateRequired", "==", getTodayDate())
            );

            const userRequestSnapshot = await getDocs(userRequestQuery);



            for (const docSnap of userRequestSnapshot.docs) {
              const docData = docSnap.data();
              const hasMatchingItem = docData.requestList?.some(item => {
                const matches =
                  item.itemName === itemName &&
                  item.itemDetails === itemDetails &&
                  item.selectedItemId === selectedItem.selectedItemId &&
                  item.labRoom === selectedItem.labRoom &&
                  item.quantity === selectedItem.quantity &&
                  docData.timeFrom === requestorLogData.timeFrom &&
                  docData.timeTo === requestorLogData.timeTo;

                console.log("Comparing item:");
                console.log("  itemName:", item.itemName, "==", itemName);
                console.log("  itemDetails:", item.itemDetails, "==", itemDetails);
                console.log("  selectedItemId:", item.selectedItemId, "==", selectedItem.selectedItemId);
                console.log("  labRoom:", item.labRoom, "==", selectedItem.labRoom);
                console.log("  quantity:", item.quantity, "==", selectedItem.quantity);
                console.log("  program:", docData.program, "==", requestorLogData.program);
                console.log("  timeFrom:", docData.timeFrom, "==", requestorLogData.timeFrom);
                console.log("  timeTo:", docData.timeTo, "==", requestorLogData.timeTo);
                console.log("  ➤ Matches:", matches);

                return matches;
              });

              console.log("Checking userrequestlog doc ID:", docSnap.id);
              console.log("Matching requestList item:", hasMatchingItem);


              if (hasMatchingItem) {
                try {
                  await updateDoc(doc(db, `accounts/${requestorUserId}/userrequestlog`, docSnap.id), {
                    status: "Deployed"
                  });
                  console.log("✅ userrequestlog status updated to 'Deployed'");
                  
                } catch (err) {
                  console.error("❌ Failed to update userrequestlog document:", err);
                }
              }
            }
            
            
          } catch (err) {
            console.error("❌ Failed to update userrequestlog:", err);
          }          

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
      console.error("QR Scan Error:", error);
    }

    setTimeout(() => setScanned(false), 1500);
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
               <Icon name="keyboard-backspace" size={20} color="white" />
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
    </View>
  );
};

export default CameraScreen;
