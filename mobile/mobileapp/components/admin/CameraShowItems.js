import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Dimensions, Alert } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { CameraView,useCameraPermissions } from 'expo-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CryptoJS from "crypto-js";
import { collection, query, getDocs, where, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import { useAuth } from '../contexts/AuthContext';
import styles from "../styles/adminStyle/CameraStyle";
import CONFIG from "../config";
import Header from "../Header";
import ItemDetailsModal from "../customs/ItemDetailsModal";
import LabRoomDetailsModal from "../customs/LabRoomDetailsModal";
import ShelfDetailsModal from "../customs/ShelfDetailsModal";
import RowDetailsModal from "../customs/RowDetailsModal";


const SECRET_KEY = CONFIG.SECRET_KEY;

const CameraShowItems = ({ onClose }) => {
  const { user } = useAuth();
  const [cameraType, setCameraType] = useState("back");
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const scanLinePosition = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [itemDetails, setItemDetails] = useState(null);
  const [labRoomItems, setLabRoomItems] = useState([]);
  const [labRoomId, setLabRoomId] = useState("");
  const [labModalVisible, setLabModalVisible] = useState(false);
  const [shelfModal, setShelfModal] = useState({ visible: false, shelfId: "", rows: [] });
  const [rowModal,   setRowModal]   = useState({ visible: false, rowId: "",  items: [] });
  const [shelfModalVisible, setShelfModalVisible] = useState(false);
  const [shelfRows, setShelfRows] = useState([]);
  const [currentShelfId, setCurrentShelfId] = useState("");
  const [rowModalVisible, setRowModalVisible] = useState(false);
  const [currentRowId, setCurrentRowId] = useState("");
  const [rowItems, setRowItems] = useState([]);

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

    const showItemDetails = (foundItem, borrowedCount, deployedCount, deployedInfo) => {
      const itemData = {
        ...foundItem,
        borrowedCount,
        deployedCount,
        deployedInfo
      };

      setItemDetails(itemData);
      setDetailsVisible(true);
    };

    const showLabRoomDetails = (roomId, items) => {
      setLabRoomId(roomId);
      setLabRoomItems(items);
      setLabModalVisible(true);
    };

    const showShelfDetails = (shelfId, rows) => {
      setCurrentShelfId(shelfId);
      setShelfRows(rows);
      setShelfModalVisible(true);
    };

    const showRowDetails = (rowId, items) => {
      setCurrentRowId(rowId);
      setRowItems(items);
      setRowModalVisible(true);
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

  // const handleBarCodeScanned = async ({ data }) => {
  //   if (scanned) return;
  //   setScanned(true);

  //   try {
  //     // Decrypt the QR code data
  //     const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
  //     const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
  //     console.log("Decrypted QR data raw:", decryptedData);
  //     if (!decryptedData) throw new Error("Invalid QR Code");

  //     let parsedData;
  //     try {
  //       parsedData = JSON.parse(decryptedData);

  //     } catch {
  //       parsedData = decryptedData;
  //     }

  //     const todayDate = getTodayDate();

  //     console.log("Parsed QR data:", parsedData);

  //     if (parsedData.itemName) {
  //       // It's an item QR code
  //       const { itemName } = parsedData;

  //       const inventoryQuery = query(collection(db, "inventory"), where("itemName", "==", itemName));
  //       const querySnapshot = await getDocs(inventoryQuery);

  //       let foundItem = null;
  //       querySnapshot.forEach(docSnap => {
  //         const itemData = docSnap.data();

  //         if (itemData.itemName === itemName) {
  //           foundItem = itemData;
  //         }
  //       });

  //       if (foundItem) {
  //         const borrowQuery = query(collection(db, "borrowcatalog"));
  //         const borrowSnapshot = await getDocs(borrowQuery);

  //         let borrowedCount = 0;
  //         borrowSnapshot.forEach(doc => {
  //           const borrowData = doc.data();
  //           if ((borrowData.status || "").trim() === "Borrowed" && (borrowData.dateRequired || "").trim() === todayDate) {
  //             borrowData.requestList?.forEach(requestItem => {

  //               if ((requestItem.itemName || "").trim() === itemName) {
  //                 borrowedCount += requestItem.quantity || 0;
  //               }
  //             });
  //           }
  //         });

  //         let deployedCount = 0;
  //         let deployedInfo = [];

  //         borrowSnapshot.forEach(doc => {
  //           const borrowData = doc.data();
  //           if (
  //             (borrowData.status || "").trim() === "Deployed" &&
  //             (borrowData.dateRequired || "").trim() === todayDate
  //           ) {
  //             borrowData.requestList?.forEach(requestItem => {
  //               if ((requestItem.itemName || "").trim() === itemName) {
  //                 deployedCount += requestItem.quantity || 0;

  //                 deployedInfo.push({
  //                   requestor: borrowData.userName || "Unknown",
  //                   room: borrowData.room || borrowData.roomNumber || "N/A",
  //                   quantity: requestItem.quantity || 0,
  //                 });
  //               }
  //             });
  //           }
  //         });

  //         showItemDetails(foundItem, borrowedCount, deployedCount, deployedInfo);

  //       } else {
  //         Alert.alert("Item Not Found", `Could not find "${itemName}" in the inventory.`);
  //       }



  //     } else if (parsedData.labRoomId) {
  //       const labRoomId = parsedData.labRoomId;

  //       try {
  //         const labRoomRef = doc(db, "labRoom", labRoomId);
  //         const labRoomDoc = await getDoc(labRoomRef);

  //         if (!labRoomDoc.exists()) {
  //           Alert.alert("Error", "Lab room not found.");
  //           return;
  //         }

  //         const itemsSnap = await getDocs(collection(labRoomRef, "items"));
  //         const itemsDetailArray = [];

  //         itemsSnap.forEach((docItem) => {
  //           const data = docItem.data();
  //           if (data.status !== "archived") {
  //             itemsDetailArray.push(data);
  //           }
  //         });

  //         if (itemsDetailArray.length === 0) {
  //           Alert.alert("Inventory", "No valid items found in lab room.");
  //           return;
  //         }

  //         await addBorrowedAndDeployedCountToItems(itemsDetailArray);

  //         // Show modal with roomId and items
  //         showLabRoomDetails(labRoomDoc.data().roomNumber || labRoomId, itemsDetailArray);

  //       } catch (error) {
  //         console.error("Error fetching lab room data:", error);
  //         Alert.alert("Error", "Failed to fetch lab room or items.");
  //       }
  //     } else {
  //       Alert.alert("Invalid QR Code", "QR does not contain recognized data.");
  //     }

  //   } catch (error) {
  //     console.error("QR Scan Error:", error);
  //     Alert.alert("Scan Failed", "Failed to read QR code. Make sure it's valid.");
  //   }

  //   setTimeout(() => setScanned(false), 1500);
  // };

  // const handleBarCodeScanned = async ({ data }) => {
  //   if (scanned) return;
  //   setScanned(true);

  //   try {
  //     // Decrypt the QR code data
  //     const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
  //     const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
  //     console.log("Decrypted QR data raw:", decryptedData);
  //     if (!decryptedData) throw new Error("Invalid QR Code");

  //     let parsedData;
  //     try {
  //       parsedData = JSON.parse(decryptedData);

  //     } catch {
  //       parsedData = decryptedData;
  //     }

  //     const todayDate = getTodayDate();

  //     console.log("Parsed QR data:", parsedData);

  //     if (parsedData.itemName) {
  //       // It's an item QR code
  //       const { itemName } = parsedData;

  //       const inventoryQuery = query(collection(db, "inventory"), where("itemName", "==", itemName));
  //       const querySnapshot = await getDocs(inventoryQuery);

  //       let foundItem = null;
  //       querySnapshot.forEach(docSnap => {
  //         const itemData = docSnap.data();

  //         if (itemData.itemName === itemName) {
  //           foundItem = itemData;
  //         }
  //       });

  //       if (foundItem) {
  //         const borrowQuery = query(collection(db, "borrowcatalog"));
  //         const borrowSnapshot = await getDocs(borrowQuery);

  //         let borrowedCount = 0;
  //         borrowSnapshot.forEach(doc => {
  //           const borrowData = doc.data();
  //           if ((borrowData.status || "").trim() === "Borrowed" && (borrowData.dateRequired || "").trim() === todayDate) {
  //             borrowData.requestList?.forEach(requestItem => {

  //               if ((requestItem.itemName || "").trim() === itemName) {
  //                 borrowedCount += requestItem.quantity || 0;
  //               }
  //             });
  //           }
  //         });

  //         let deployedCount = 0;
  //         let deployedInfo = [];

  //         borrowSnapshot.forEach(doc => {
  //           const borrowData = doc.data();
  //           if (
  //             (borrowData.status || "").trim() === "Deployed" &&
  //             (borrowData.dateRequired || "").trim() === todayDate
  //           ) {
  //             borrowData.requestList?.forEach(requestItem => {
  //               if ((requestItem.itemName || "").trim() === itemName) {
  //                 deployedCount += requestItem.quantity || 0;

  //                 deployedInfo.push({
  //                   requestor: borrowData.userName || "Unknown",
  //                   room: borrowData.room || borrowData.roomNumber || "N/A",
  //                   quantity: requestItem.quantity || 0,
  //                 });
  //               }
  //             });
  //           }
  //         });

  //         showItemDetails(foundItem, borrowedCount, deployedCount, deployedInfo);

  //       } else {
  //         Alert.alert("Item Not Found", `Could not find "${itemName}" in the inventory.`);
  //       }



  //     } else if (parsedData.labRoomId) {
  //       const labRoomId = parsedData.labRoomId;

  //       try {
  //         const labRoomRef = doc(db, "labRoom", labRoomId);
  //         const labRoomDoc = await getDoc(labRoomRef);

  //         if (!labRoomDoc.exists()) {
  //           Alert.alert("Error", "Lab room not found.");
  //           return;
  //         }

  //         const itemsSnap = await getDocs(collection(labRoomRef, "items"));
  //         const itemsDetailArray = [];

  //         itemsSnap.forEach((docItem) => {
  //           const data = docItem.data();
  //           if (data.status !== "archived") {
  //             itemsDetailArray.push(data);
  //           }
  //         });

  //         if (itemsDetailArray.length === 0) {
  //           Alert.alert("Inventory", "No valid items found in lab room.");
  //           return;
  //         }

  //         await addBorrowedAndDeployedCountToItems(itemsDetailArray);

  //         // Show modal with roomId and items
  //         showLabRoomDetails(labRoomDoc.data().roomNumber || labRoomId, itemsDetailArray);

  //       } catch (error) {
  //         console.error("Error fetching lab room data:", error);
  //         Alert.alert("Error", "Failed to fetch lab room or items.");
  //       }

  //     } else if (parsedData.shelves && !parsedData.row) {
  //     const shelfId = parsedData.shelves;           // e.g., "A"
  //     try {
  //       const labRoomsSnap = await getDocs(collection(db, "labRoom"));
  //       const rowsSummary = [];

  //       for (const roomDoc of labRoomsSnap.docs) {
  //         const rowsSnap = await getDocs(
  //           collection(db, `labRoom/${roomDoc.id}/shelves/${shelfId}/rows`)
  //         );
  //         rowsSnap.forEach((rowDoc) => {
  //           rowsSummary.push({
  //             room: roomDoc.data().roomNumber,
  //             rowId: rowDoc.id,
  //           });
  //         });
  //       }

  //       if (!rowsSummary.length) {
  //         Alert.alert("Shelf Scan", `Shelf ${shelfId} not found in any room.`);
  //       } else {
  //         let msg = `Shelf ${shelfId} found in:\n`;
  //         rowsSummary.forEach((r) => (msg += `• Room ${r.room} — Row ${r.rowId}\n`));
  //         Alert.alert("Shelf Scan", msg);
  //       }
  //     } catch (e) {
  //       console.error("Shelf QR error:", e);
  //       Alert.alert("Shelf Scan", "Error reading shelf data.");
  //     }
  //   }

  //   /* ---------- ROW QR (NEW) ----------------- */
  //   else if (parsedData.row && parsedData.itemId) {
  //     const rowId = parsedData.row;                 // e.g., "2"
  //     try {
  //       const labRoomsSnap = await getDocs(collection(db, "labRoom"));
  //       let found = false;

  //       for (const roomDoc of labRoomsSnap.docs) {
  //         const shelvesSnap = await getDocs(
  //           collection(db, `labRoom/${roomDoc.id}/shelves`)
  //         );

  //         for (const shelfDoc of shelvesSnap.docs) {
  //           const rowRef = doc(
  //             db,
  //             `labRoom/${roomDoc.id}/shelves/${shelfDoc.id}/rows/${rowId}`
  //           );
  //           const rowDoc = await getDoc(rowRef);
  //           if (rowDoc.exists()) {
  //             found = true;
  //             const itemsSnap = await getDocs(collection(rowRef, "items"));
  //             let msg = `Room ${roomDoc.data().roomNumber}\nShelf ${shelfDoc.id} / Row ${rowId}\n\nItems:\n`;
  //             itemsSnap.forEach((d) => {
  //               const it = d.data();
  //               msg += `• ${it.itemName} (Qty: ${it.quantity})\n`;
  //             });
  //             Alert.alert("Row Scan", msg);
  //             break;
  //           }
  //         }
  //         if (found) break;
  //       }

  //       if (!found) {
  //         Alert.alert("Row Scan", `Row ${rowId} not found in any shelf.`);
  //       }
  //     } catch (e) {
  //       console.error("Row QR error:", e);
  //       Alert.alert("Row Scan", "Error reading row data.");
  //     }
      
  //     } else {
  //       Alert.alert("Invalid QR Code", "QR does not contain recognized data.");
  //     }

  //   } catch (error) {
  //     console.error("QR Scan Error:", error);
  //     Alert.alert("Scan Failed", "Failed to read QR code. Make sure it's valid.");
  //   }

  //   setTimeout(() => setScanned(false), 1500);
  // };

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);

    try {
      // Decrypt QR code
      const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      if (!decryptedData) throw new Error("Invalid QR Code");

      let parsedData;
      try {
        parsedData = JSON.parse(decryptedData);
      } catch {
        parsedData = decryptedData;
      }

      const todayDate = getTodayDate();
      console.log("Parsed QR data:", parsedData);

      // 🎯 ITEM QR
      if (parsedData.itemName) {
        const { itemName } = parsedData;

        const inventoryQuery = query(
          collection(db, "inventory"),
          where("itemName", "==", itemName)
        );
        const querySnapshot = await getDocs(inventoryQuery);

        let foundItem = null;
        querySnapshot.forEach((docSnap) => {
          const itemData = docSnap.data();
          if (itemData.itemName === itemName) {
            foundItem = itemData;
          }
        });

        if (foundItem) {
          const borrowSnapshot = await getDocs(collection(db, "borrowcatalog"));

          let borrowedCount = 0;
          let deployedCount = 0;
          let deployedInfo = [];

          borrowSnapshot.forEach((doc) => {
            const borrowData = doc.data();
            const status = (borrowData.status || "").trim();
            const dateRequired = (borrowData.dateRequired || "").trim();

            if (status === "Borrowed" && dateRequired === todayDate) {
              borrowData.requestList?.forEach((requestItem) => {
                if ((requestItem.itemName || "").trim() === itemName) {
                  borrowedCount += requestItem.quantity || 0;
                }
              });
            }

            if (status === "Deployed" && dateRequired === todayDate) {
              borrowData.requestList?.forEach((requestItem) => {
                if ((requestItem.itemName || "").trim() === itemName) {
                  deployedCount += requestItem.quantity || 0;
                  deployedInfo.push({
                    requestor: borrowData.userName || "Unknown",
                    room: borrowData.room || borrowData.roomNumber || "N/A",
                    quantity: requestItem.quantity || 0,
                  });
                }
              });
            }
          });

          showItemDetails(foundItem, borrowedCount, deployedCount, deployedInfo);
        } else {
          Alert.alert("Item Not Found", `Could not find "${itemName}" in inventory.`);
        }

      // 🧪 LAB ROOM QR
      } else if (parsedData.labRoomId && !parsedData.shelves) {
        const labRoomRef = doc(db, "labRoom", parsedData.labRoomId);
        const labRoomDoc = await getDoc(labRoomRef);

        if (!labRoomDoc.exists()) {
          Alert.alert("Error", "Lab room not found.");
          return;
        }

        const itemsSnap = await getDocs(collection(labRoomRef, "items"));
        const items = [];

        itemsSnap.forEach((doc) => {
          const data = doc.data();
          if (data.status !== "archived") {
            items.push(data);
          }
        });

        if (items.length === 0) {
          Alert.alert("Inventory", "No valid items found in this lab room.");
          return;
        }

        await addBorrowedAndDeployedCountToItems(items);
        showLabRoomDetails(labRoomDoc.data().roomNumber || parsedData.labRoomId, items);

      // 🪜 SHELF QR (labRoom + shelf only)
      } else if (parsedData.labRoomId && parsedData.shelves && !parsedData.row) {
        const { labRoomId, shelves: shelfId } = parsedData;

        try {
          // 1. grab all rows under this shelf
          const rowsSnap = await getDocs(
            collection(db, `labRoom/${labRoomId}/shelves/${shelfId}/rows`)
          );

          if (rowsSnap.empty) {
            Alert.alert("Shelf Scan", `No rows found in Shelf ${shelfId}.`);
            return;
          }

          // let msg = `📦 Shelf ${shelfId} in Lab ${labRoomId.slice(0, 5)}…\n\nRows:\n`;
          // rowsSnap.forEach((rowDoc) => {
          //   msg += `• Row ${rowDoc.id}\n`;
          // });

            // 2. for each row, pull its items
            const rowsWithItems = [];
            for (const rowDoc of rowsSnap.docs) {
              const itemsSnap = await getDocs(collection(rowDoc.ref, "items"));
              const items = [];

              itemsSnap.forEach((d) => {
                const data = d.data();
                items.push({
                  itemName: data.itemName,
                  quantity: data.quantity,
                });
              });

              rowsWithItems.push({
                rowId: rowDoc.id,
                items,
              });
            }

            // 3. open the modal
            showShelfDetails(shelfId, rowsWithItems); 

          // Alert.alert("Shelf Scan", msg);

        } catch (e) {
          console.error("Shelf QR error:", e);
          Alert.alert("Shelf Scan", "Error loading rows.");
        }

      // 🧱 ROW QR (labRoom + shelf + row)
      } else if (parsedData.labRoomId && parsedData.shelves && parsedData.row) {
        const { labRoomId, shelves: shelfId, row } = parsedData;

        try {
          const rowRef = doc(db, `labRoom/${labRoomId}/shelves/${shelfId}/rows/${row}`);
          const rowDoc = await getDoc(rowRef);

          if (!rowDoc.exists()) {
            Alert.alert("Row Scan", `Row ${row} not found under Shelf ${shelfId}.`);
            return;
          }

          const itemsSnap = await getDocs(collection(rowRef, "items"));
          const items = [];

          itemsSnap.forEach((d) => {
            const data = d.data();
            items.push({
              itemId: data.itemId,
              itemName: data.itemName,
              quantity: data.quantity,
              condition: data.condition,
              status: data.status,
            });
          });

        // Open the modal instead of using Alert
        showRowDetails(row, items);

          // if (itemsSnap.empty) {
          //   Alert.alert("Row Scan", `No items found in Row ${row}.`);
          //   return;
          // }

          // let msg = `🧱 Lab ${labRoomId.slice(0, 5)}…\nShelf ${shelfId} / Row ${row}\n\nItems:\n`;
          // itemsSnap.forEach((d) => {
          //   const it = d.data();
          //   msg += `• ${it.itemName} (Qty: ${it.quantity})\n`;
          // });

          // Alert.alert("Row Scan", msg);
          
        } catch (e) {
          console.error("Row QR error:", e);
          Alert.alert("Row Scan", "Error reading row data.");
        }

      } else {
        Alert.alert("Invalid QR Code", "QR does not contain recognized data.");
      }

    } catch (error) {
      console.error("QR Scan Error:", error);
      Alert.alert("Scan Failed", "Failed to read QR code. Make sure it's valid.");
    }

    setTimeout(() => setScanned(false), 1500);
  };

  const addBorrowedCountToItems = async (itemsDetailArray) => {
    const todayDate = new Date().toISOString().split("T")[0]; // "2025-05-18"
    const borrowSnapshot = await getDocs(collection(db, "borrowcatalog"));

    console.log("Today's date:", todayDate);

    for (const item of itemsDetailArray) {
      let borrowedCount = 0;

      console.log("\n🔍 Checking item:", item.itemName);

      borrowSnapshot.forEach(doc => {
        const borrowData = doc.data();

        const status = (borrowData.status || "").trim();
        const dateRequired = (borrowData.dateRequired || "").trim();

        if (!Array.isArray(borrowData.requestList)) {
          console.log("⚠️ requestList is missing or not an array:", borrowData);
          return;
        }

        if (status === "Borrowed" && dateRequired === todayDate) {
          borrowData.requestList.forEach(requestItem => {
            const requestItemName = (requestItem.itemName || "").trim();
            const requestQty = requestItem.quantity || 0;

            console.log(
              `🆚 Comparing "${requestItemName}" with "${item.itemName}" – Qty: ${requestQty}`
            );

            if (requestItemName === item.itemName) {
              borrowedCount += requestQty;
            }
          });
          
        } else {
          console.log(`⏩ Skipped: status=${status}, date=${dateRequired}`);
        }
      });

      console.log(`✅ Total borrowed for ${item.itemName}: ${borrowedCount}`);
      item.borrowedToday = borrowedCount;
    }
  };

  const addBorrowedAndDeployedCountToItems = async (itemsDetailArray) => {
  const todayDate = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
  const borrowSnapshot = await getDocs(collection(db, "borrowcatalog"));

  console.log("Today's date:", todayDate);

  for (const item of itemsDetailArray) {
    let borrowedCount = 0;
    let deployedCount = 0;

    console.log("\n🔍 Checking item:", item.itemName);

    borrowSnapshot.forEach(doc => {
      const borrowData = doc.data();

      const status = (borrowData.status || "").trim();
      const dateRequired = (borrowData.dateRequired || "").trim();

      if (!Array.isArray(borrowData.requestList)) {
        console.log("⚠️ requestList is missing or not an array:", borrowData);
        return;
      }

      borrowData.requestList.forEach(requestItem => {
        const requestItemName = (requestItem.itemName || "").trim();
        const requestQty = requestItem.quantity || 0;

        if (requestItemName === item.itemName) {
          if (status === "Borrowed" && dateRequired === todayDate) {
            borrowedCount += requestQty;
          }
          if (status === "Deployed" && dateRequired === todayDate) {
            deployedCount += requestQty;
          }
        }
      });
    });

    console.log(`✅ Total borrowed for ${item.itemName}: ${borrowedCount}`);
    console.log(`✅ Total deployed for ${item.itemName}: ${deployedCount}`);

    item.borrowedToday = borrowedCount;
    item.deployedToday = deployedCount;
  }
};

    const handleLabRoomScan = async (roomNumber) => {
        try {
            const labRoomItemsRef = collection(db, `labRoom/${roomNumber}/collection`);
            const snapshot = await getDocs(labRoomItemsRef);

            if (snapshot.empty) {
            Alert.alert("No Items Found", `No items found in ${roomNumber}.`);
            return;
            }

            let itemsDetails = `Items in ${roomNumber}:\n\n`;

            snapshot.forEach(doc => {
            const item = doc.data();
            itemsDetails += `• ${item.itemName} (Qty: ${item.quantity})\n`;
            });

            Alert.alert(`Lab Room: ${roomNumber}`, itemsDetails);

        } catch (error) {
            console.error("Error fetching labRoom items:", error);
            Alert.alert("Error", "Failed to load lab room items.");
        }
    };

    const handleItemScan = async ({ data }) => {
        if (scanned) return;

        setScanned(true);

        try {
            // Decrypt the scanned data
            const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
            const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

            if (!decryptedData) throw new Error("Invalid QR Code");

            const parsedData = JSON.parse(decryptedData);
            const { itemName } = parsedData;  // Now using itemName instead of itemId

            const todayDate = getTodayDate(); // Format as YYYY-MM-DD

            // Query the inventory to find the item by itemName
            const inventoryQuery = query(collection(db, "inventory"), where("itemName", "==", itemName));
            const querySnapshot = await getDocs(inventoryQuery);

            let foundItem = null;
            querySnapshot.forEach(docSnap => {
            const itemData = docSnap.data();
            if (itemData.itemName === itemName) {
                foundItem = itemData;
            }
            });

            if (foundItem) {
            // Now query the borrowCatalog to check how many times this item was borrowed today
            const borrowQuery = query(collection(db, "borrowcatalog"));
            const borrowSnapshot = await getDocs(borrowQuery);

            let borrowedCount = 0;

            borrowSnapshot.forEach(doc => {
            const borrowData = doc.data();
            
            console.log("BorrowDoc dateRequired:", borrowData.dateRequired, "status:", borrowData.status);
            
            if ((borrowData.status || "").trim() === "Borrowed" && (borrowData.dateRequired || "").trim() === todayDate) {
                borrowData.requestList.forEach(requestItem => {
                if ((requestItem.itemName || "").trim() === itemName) {
                    borrowedCount += requestItem.quantity || 0;
                }
                });
            }
            });

            console.log("Borrowed count:", borrowedCount);

            const detailMsg = `
                Item Name: ${foundItem.itemName}
                Item ID: ${foundItem.itemId}
                Category: ${foundItem.category}
                Department: ${foundItem.department}
                Quantity Available: ${foundItem.quantity}
                Location: ${foundItem.labRoom}
                Borrowed Today: ${borrowedCount} times
            `;

            Alert.alert("Item Details", detailMsg);

            } else {
            Alert.alert("Item Not Found", `Could not find the scanned item in the inventory.`); 
            }

        } catch (error) {
            console.error("QR Scan Error:", error);
            Alert.alert("Scan Failed", "Failed to read QR code. Make sure it's valid.");
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

            <Text style={[styles.scannerTitle,{bottom: bottomOffset-10}]}>Track Items</Text>

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

        <ItemDetailsModal
          visible={detailsVisible}
          itemData={itemDetails}
          onClose={() => setDetailsVisible(false)}
        />

        <LabRoomDetailsModal
          visible={labModalVisible}
          roomId={labRoomId}
          items={labRoomItems}
          onClose={() => setLabModalVisible(false)}
        />

      <ShelfDetailsModal
        visible={shelfModalVisible}
        shelfId={currentShelfId}
        rows={shelfRows}
        onClose={() => setShelfModalVisible(false)}
      />

      <RowDetailsModal
        visible={rowModalVisible}
        rowId={currentRowId}
        items={rowItems}
        onClose={() => setRowModalVisible(false)}
      />

      </CameraView>
    </View>
  );
};

export default CameraShowItems;
