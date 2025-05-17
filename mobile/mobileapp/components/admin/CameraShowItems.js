import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Dimensions, Alert } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from "expo-camera";
import CryptoJS from "crypto-js";
import { collection, query, getDocs, where, serverTimestamp } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import { useAuth } from '../contexts/AuthContext';
import styles from "../styles/adminStyle/CameraStyle";
import CONFIG from "../config";
import Header from "../Header";

const { width, height } = Dimensions.get("window");
const frameSize = width * 0.7;
const SECRET_KEY = CONFIG.SECRET_KEY;

const CameraShowItems = ({ onClose }) => {
  const { user } = useAuth();
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

    // const handleBarCodeScanned = async ({ data }) => {
    //     if (scanned) return;

    //     setScanned(true);

    //     try {
    //         // Decrypt the scanned data
    //         const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
    //         const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

    //         if (!decryptedData) throw new Error("Invalid QR Code");

    //         const parsedData = JSON.parse(decryptedData);
    //         const { itemName } = parsedData;  // Now using itemName instead of itemId

    //         const todayDate = getTodayDate(); // Format as YYYY-MM-DD

    //         // Query the inventory to find the item by itemName
    //         const inventoryQuery = query(collection(db, "inventory"), where("itemName", "==", itemName));
    //         const querySnapshot = await getDocs(inventoryQuery);

    //         let foundItem = null;
    //         querySnapshot.forEach(docSnap => {
    //         const itemData = docSnap.data();
    //         if (itemData.itemName === itemName) {
    //             foundItem = itemData;
    //         }
    //         });

    //         if (foundItem) {
    //         // Now query the borrowCatalog to check how many times this item was borrowed today
    //         const borrowQuery = query(collection(db, "borrowcatalog"));
    //         const borrowSnapshot = await getDocs(borrowQuery);

    //         let borrowedCount = 0;

    //         borrowSnapshot.forEach(doc => {
    //         const borrowData = doc.data();
            
    //         console.log("BorrowDoc dateRequired:", borrowData.dateRequired, "status:", borrowData.status);
            
    //         if ((borrowData.status || "").trim() === "Borrowed" && (borrowData.dateRequired || "").trim() === todayDate) {
    //             borrowData.requestList.forEach(requestItem => {
    //             if ((requestItem.itemName || "").trim() === itemName) {
    //                 borrowedCount += requestItem.quantity || 0;
    //             }
    //             });
    //         }
    //         });

    //         console.log("Borrowed count:", borrowedCount);

    //         const detailMsg = `
    //             Item Name: ${foundItem.itemName}
    //             Item ID: ${foundItem.itemId}
    //             Category: ${foundItem.category}
    //             Department: ${foundItem.department}
    //             Quantity Available: ${foundItem.quantity}
    //             Location: ${foundItem.labRoom}
    //             Borrowed Today: ${borrowedCount} times
    //         `;

    //         Alert.alert("Item Details", detailMsg);

    //         } else {
    //         Alert.alert("Item Not Found", `Could not find the scanned item in the inventory.`); 
    //         }

    //     } catch (error) {
    //         console.error("QR Scan Error:", error);
    //         Alert.alert("Scan Failed", "Failed to read QR code. Make sure it's valid.");
    //     }

    //     setTimeout(() => setScanned(false), 1500);
    // };

    // const handleBarCodeScanned = async ({ data }) => {
    // if (scanned) return;
    // setScanned(true);

    // try {
    //     // Decrypt the QR code data
    //     const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
    //     const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

    //     if (!decryptedData) throw new Error("Invalid QR Code");

    //     const parsedData = JSON.parse(decryptedData);
    //     const todayDate = getTodayDate();

    //     if (parsedData.itemName) {
    //     // It's an item QR code
    //     const { itemName } = parsedData;

    //     const inventoryQuery = query(collection(db, "inventory"), where("itemName", "==", itemName));
    //     const querySnapshot = await getDocs(inventoryQuery);

    //     let foundItem = null;
    //     querySnapshot.forEach(docSnap => {
    //         const itemData = docSnap.data();
    //         if (itemData.itemName === itemName) {
    //         foundItem = itemData;
    //         }
    //     });

    //     if (foundItem) {
    //         const borrowQuery = query(collection(db, "borrowcatalog"));
    //         const borrowSnapshot = await getDocs(borrowQuery);

    //         let borrowedCount = 0;
    //         borrowSnapshot.forEach(doc => {
    //         const borrowData = doc.data();
    //         if ((borrowData.status || "").trim() === "Borrowed" && (borrowData.dateRequired || "").trim() === todayDate) {
    //             borrowData.requestList?.forEach(requestItem => {
    //             if ((requestItem.itemName || "").trim() === itemName) {
    //                 borrowedCount += requestItem.quantity || 0;
    //             }
    //             });
    //         }
    //         });

    //         const detailMsg = `
    //             Item Name: ${foundItem.itemName}
    //             Item ID: ${foundItem.itemId}
    //             Category: ${foundItem.category}
    //             Department: ${foundItem.department}
    //             Quantity Available: ${foundItem.quantity}
    //             Location: ${foundItem.labRoom}
    //             Borrowed Today: ${borrowedCount} times
    //             `;
    //             Alert.alert("Item Details", detailMsg);
    //         } else {
    //             Alert.alert("Item Not Found", `Could not find "${itemName}" in the inventory.`);
    //         }

    //         } else if (parsedData.roomNumber) {
    //         // It's a lab room QR code
    //         const { roomNumber } = parsedData;

    //         const labRoomItemsRef = collection(db, `labRoom/${roomNumber}/collection`);
    //         const labRoomItemsSnapshot = await getDocs(labRoomItemsRef);

    //         if (labRoomItemsSnapshot.empty) {
    //             Alert.alert("Room Details", `No items found in lab room ${roomNumber}.`);
    //         } else {
    //             let itemsDetail = "";
    //             labRoomItemsSnapshot.forEach(doc => {
    //             const item = doc.data();
    //             itemsDetail += `
    //     - ${item.itemName || "Unknown"} (ID: ${item.itemId || "N/A"}, Qty: ${item.quantity || "?"})
    //             `;
    //             });

    //             Alert.alert("Lab Room Inventory", `Room: ${roomNumber}\nItems:${itemsDetail}`);
    //         }

    //         } else {
    //         Alert.alert("Invalid QR Code", "QR does not contain recognized data.");
    //         }

    //     } catch (error) {
    //         console.error("QR Scan Error:", error);
    //         Alert.alert("Scan Failed", "Failed to read QR code. Make sure it's valid.");
    //     }

    //     setTimeout(() => setScanned(false), 1500);
    // };

//     const handleBarCodeScanned = async ({ data }) => {
//   if (scanned) return;
//   setScanned(true);

//   try {
//     // Decrypt the QR code data
//     const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
//     const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

//     if (!decryptedData) throw new Error("Invalid QR Code");

//     const parsedData = JSON.parse(decryptedData);
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

//         const detailMsg = `
//           Item Name: ${foundItem.itemName}
//           Item ID: ${foundItem.itemId}
//           Category: ${foundItem.category}
//           Department: ${foundItem.department}
//           Quantity Available: ${foundItem.quantity}
//           Location: ${foundItem.labRoom}
//           Borrowed Today: ${borrowedCount} times
//         `;
//         Alert.alert("Item Details", detailMsg);
//       } else {
//         Alert.alert("Item Not Found", `Could not find "${itemName}" in the inventory.`);
//       }

//     } else if (parsedData.roomNumber) {
//       // It's a lab room QR code
//       const { roomNumber } = parsedData;

//       // Use your actual Firestore subcollection name for lab room items
//       const labRoomItemsRef = collection(db, `labRoom/${roomNumber}/items`);
//       const labRoomItemsSnapshot = await getDocs(labRoomItemsRef);

//       if (labRoomItemsSnapshot.empty) {
//         Alert.alert("Room Details", `No items found in lab room ${roomNumber}.`);
//       } else {
//         // Build item details with newlines for better formatting
//         const itemsDetailArray = [];

//         labRoomItemsSnapshot.forEach(doc => {
//           const item = doc.data();
//           itemsDetailArray.push(
//             `- ${item.itemName || "Unknown"} (ID: ${item.itemId || "N/A"}, Qty: ${item.quantity ?? "?"})`
//           );
//         });

//         const itemsDetail = itemsDetailArray.join("\n");

//         Alert.alert("Lab Room Inventory", `Room: ${roomNumber}\nItems:\n${itemsDetail}`);
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

    const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);

    try {
            // Decrypt the QR code data
            const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
            const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

            if (!decryptedData) throw new Error("Invalid QR Code");

            let parsedData;
            try {
            parsedData = JSON.parse(decryptedData);

            } catch {
            // If JSON.parse fails, treat decryptedData as a raw string (labRoom id)
            parsedData = decryptedData;
            }

            const todayDate = getTodayDate();

            console.log("Parsed QR data:", parsedData);

            if (parsedData.itemName) {
            // It's an item QR code
            const { itemName } = parsedData;

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
                const borrowQuery = query(collection(db, "borrowcatalog"));
                const borrowSnapshot = await getDocs(borrowQuery);

                let borrowedCount = 0;
                borrowSnapshot.forEach(doc => {
                const borrowData = doc.data();
                if ((borrowData.status || "").trim() === "Borrowed" && (borrowData.dateRequired || "").trim() === todayDate) {
                    borrowData.requestList?.forEach(requestItem => {

                    if ((requestItem.itemName || "").trim() === itemName) {
                        borrowedCount += requestItem.quantity || 0;
                    }
                    });
                }
                });

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
                Alert.alert("Item Not Found", `Could not find "${itemName}" in the inventory.`);
            }

            } else if (parsedData.items && Array.isArray(parsedData.items) && parsedData.labRoom) {
            // New case for labRoom QR with multiple items inside "items" array
            const room = parsedData.labRoom;
            const itemsDetailArray = parsedData.items.map(item => 
                `- ${item.itemName || "Unknown"} (ID: ${item.itemId || "N/A"}, Qty: ${item.quantity ?? "?"}, Condition: ${item.condition || "N/A"}, Status: ${item.status || "N/A"})`
            );

            const itemsDetail = itemsDetailArray.join("\n");

            Alert.alert("Lab Room Inventory", `Room: ${room}\nItems:\n${itemsDetail}`);

            } else if (typeof parsedData === "string") {
                // It's a labRoom id string (e.g. "0430")
                const roomId = parsedData;

                const labRoomItemsRef = collection(db, `labRoom/${roomId}/items`);
                const labRoomItemsSnapshot = await getDocs(labRoomItemsRef);

                if (labRoomItemsSnapshot.empty) {
                    Alert.alert("Room Details", `No items found in lab room ${roomId}.`);
                    
                } else {
                    const itemsDetailArray = [];

                    labRoomItemsSnapshot.forEach(doc => {
                    const item = doc.data();
                    itemsDetailArray.push(
                        `- ${item.itemName || "Unknown"} (ID: ${item.itemId || "N/A"}, Qty: ${item.quantity ?? "?"})`
                    );
                    });

                    const itemsDetail = itemsDetailArray.join("\n");

                    Alert.alert("Lab Room Inventory", `Room: ${roomId}\nItems:\n${itemsDetail}`);
                }

            } else if (parsedData.roomNumber) {
                // Your existing roomNumber object check (if needed)
                const { roomNumber } = parsedData;

                const labRoomItemsRef = collection(db, `labRoom/${roomNumber}/items`);
                const labRoomItemsSnapshot = await getDocs(labRoomItemsRef);

                if (labRoomItemsSnapshot.empty) {
                    Alert.alert("Room Details", `No items found in lab room ${roomNumber}.`);

                } else {
                    const itemsDetailArray = [];

                    labRoomItemsSnapshot.forEach(doc => {
                    const item = doc.data();
                    itemsDetailArray.push(
                        `- ${item.itemName || "Unknown"} (ID: ${item.itemId || "N/A"}, Qty: ${item.quantity ?? "?"})`
                    );
                    });

                    const itemsDetail = itemsDetailArray.join("\n");

                    Alert.alert("Lab Room Inventory", `Room: ${roomNumber}\nItems:\n${itemsDetail}`);
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
    </View>
  );
};

export default CameraShowItems;
