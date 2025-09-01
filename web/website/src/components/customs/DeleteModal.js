// import React from 'react'; 
// import { Modal, message } from 'antd';
// import { deleteDoc, doc, collection, getDocs, query, where } from 'firebase/firestore';
// import { db } from '../../backend/firebase/FirebaseConfig';

// const DeleteModal = ({ visible, onClose, item, onDeleteSuccess, setDataSource }) => {
//   const handleDelete = async () => {
//     if (!item) return;

//     try {
//       // Step 1: Delete from inventory
//       const snapshot = await getDocs(collection(db, 'inventory'));

//       snapshot.forEach(async (docItem) => {
//         const data = docItem.data();
//         if (data.itemId === item.itemId) {  // Matching based on itemId or itemName
//           await deleteDoc(doc(db, 'inventory', docItem.id));
//         }
//       });

//       // Step 2: Delete matching userRequests
//       const usersSnapshot = await getDocs(collection(db, 'accounts'));

//       for (const userDoc of usersSnapshot.docs) {
//         console.log('Checking user:', userDoc.id); // Debugging line
//         const userRequestsRef = collection(db, 'accounts', userDoc.id, 'userRequests');
//         const userRequestsSnapshot = await getDocs(userRequestsRef);

//         for (const requestDoc of userRequestsSnapshot.docs) {
//           const requestData = requestDoc.data();
//           const filteredData = requestData?.filteredMergedData;

//           if (!Array.isArray(filteredData)) {
//             console.log('No filteredMergedData found for request:', requestDoc.id); // Debugging line
//             continue;
//           }

//           // Check if any item in filteredMergedData matches the itemName
//           const hasMatchingItem = filteredData.some(entry => {
//             console.log('Checking entry.itemName:', entry.itemName); // Debugging line
//             return entry.itemName === item.itemName;  // Matching by itemName
//           });

//           if (hasMatchingItem) {
//             console.log('Deleting request:', requestDoc.id); // Debugging line
//             await deleteDoc(doc(userRequestsRef, requestDoc.id));
//           }
//         }
//       }

//         // Step 3: Query and delete the item in the root 'userrequests' collection
//         const rootQuery = query(
//           collection(db, 'userrequests'),
//           where('itemId', '==', item.itemId) // Assuming itemId matches in both subcollections and root collection
//         );
  
//         const rootSnap = await getDocs(rootQuery);
//         const batchDeletes = [];
  
//         rootSnap.forEach((docSnap) => {
//           batchDeletes.push(deleteDoc(doc(db, 'userrequests', docSnap.id)));
//         });
  
//         // Use Promise.all to execute all deletes concurrently
//         await Promise.all(batchDeletes);

//       // Step 4: Update table state to remove the deleted item from local state
//       setDataSource(prevData => {
//         return prevData.filter(row => row.itemName !== item.itemName);  // Filter out deleted item
//       });

//       message.success('Item deleted successfully');
//       onDeleteSuccess(item.itemId);
//       onClose();
      
//     } catch (error) {
//       console.error('Error deleting item:', error);
//       message.error('Failed to delete item');
//     }
//   };

//   return (
//     <Modal
//       title="Confirm Delete"
//       visible={visible}
//       onOk={handleDelete}
//       onCancel={onClose}
//       okText="Delete"
//       okType="danger"
//       cancelText="Cancel"
//     >
//       <p>Are you sure you want to delete <strong>{item?.name}</strong>?</p>
//     </Modal>
//   );
// };

// export default DeleteModal;

import React, { useState } from "react";
import axios from 'axios';
import { Modal, message } from 'antd'; 
import NotificationModal from "./NotificationModal";

const DeleteModal = ({ visible, onClose, item, onDeleteSuccess, setDataSource }) => {
  
  // const handleDelete = async () => {
  //   if (!item) return;

  //   try {
  //     // Step 1: Delete from inventory
  //     const snapshot = await getDocs(collection(db, 'inventory'));

  //     snapshot.forEach(async (docItem) => {
  //       const data = docItem.data();
  //       if (data.itemId === item.itemId) {  // Matching based on itemId or itemName
  //         await deleteDoc(doc(db, 'inventory', docItem.id));
  //       }
  //     });

  //     // Step 2: Delete matching userRequests in each user's subcollection
  //     const usersSnapshot = await getDocs(collection(db, 'accounts'));

  //     for (const userDoc of usersSnapshot.docs) {
  //       console.log('Checking user:', userDoc.id); // Debugging line
  //       const userRequestsRef = collection(db, 'accounts', userDoc.id, 'userRequests');
  //       const userRequestsSnapshot = await getDocs(userRequestsRef);

  //       for (const requestDoc of userRequestsSnapshot.docs) {
  //         const requestData = requestDoc.data();
  //         const filteredData = requestData?.filteredMergedData;

  //         if (!Array.isArray(filteredData)) {
  //           console.log('No filteredMergedData found for request:', requestDoc.id); // Debugging line
  //           continue;
  //         }

  //         // Check if any item in filteredMergedData matches the itemName
  //         const hasMatchingItem = filteredData.some(entry => {
  //           console.log('Checking entry.itemName:', entry.itemName); // Debugging line
  //           return entry.itemName === item.itemName;  // Matching by itemName
  //         });

  //         if (hasMatchingItem) {
  //           console.log('Deleting request from userRequests subcollection:', requestDoc.id); // Debugging line
  //           // Delete the matching user request from the user's subcollection
  //           await deleteDoc(doc(userRequestsRef, requestDoc.id));

  //           // Step 3: Query and delete from root 'userrequests' collection
  //           const rootQuery = query(
  //             collection(db, 'userrequests'),
  //             where('accountId', '==', userDoc.id),  // Match based on userId (accountId)
  //             where('timestamp', '==', requestData.timestamp)  // Match based on timestamp
  //           );

  //           const rootSnap = await getDocs(rootQuery);
  //           const batchDeletes = [];

  //           rootSnap.forEach((docSnap) => {
  //             batchDeletes.push(deleteDoc(doc(db, 'userrequests', docSnap.id)));
  //           });

  //           // Use Promise.all to execute all deletes concurrently
  //           await Promise.all(batchDeletes);
  //         }
  //       }
  //     }

  //     // Step 4: Update table state to remove the deleted item from local state
  //     setDataSource(prevData => {
  //       return prevData.filter(row => row.itemName !== item.itemName);  // Filter out deleted item
  //     });

  //     message.success('Item deleted successfully');
  //     onDeleteSuccess(item.itemId);
  //     onClose();

  //   } catch (error) {
  //     console.error('Error deleting item:', error);
  //     message.error('Failed to delete item');
  //   }
  // };

  // FRONTEND
  // const handleDelete = async () => {
  //   if (!item) return;

  //   try {
  //     const snapshot = await getDocs(collection(db, 'inventory'));

  //     for (const docItem of snapshot.docs) {
  //       const data = docItem.data();

  //       if (data.itemId === item.itemId) {
  //         const inventoryId = docItem.id;

  //         // Step 1: Archive the item before deleting
  //         await setDoc(doc(db, "archiveItems", inventoryId), {
  //           ...data,
  //           archivedAt: new Date(),
  //         });

  //         // Step 1.5: Delete subcollection (stockLog) if it exists
  //         const stockLogRef = collection(db, 'inventory', inventoryId, 'stockLog');
  //         const stockLogSnapshot = await getDocs(stockLogRef);

  //         const stockLogDeletions = stockLogSnapshot.docs.map((doc) =>
  //           deleteDoc(doc.ref)
  //         );
          
  //         await Promise.all(stockLogDeletions);

  //         // Step 2: Delete from inventory
  //         await deleteDoc(doc(db, 'inventory', inventoryId));

  //         // Step 3: Delete from labRoom if labRoom and itemId exist
  //         // if (data.labRoom && data.itemId) {
  //         //   const labRoomRef = doc(db, "labRoom", data.labRoom, "items", data.itemId);
  //         //   await deleteDoc(labRoomRef);
  //         //   console.log(`✅ Removed from labRoom/${data.labRoom}/items/${data.itemId}`);
  //         // }

  //         if (data.labRoom && data.itemId) {
  //           const labRoomQuery = query(collection(db, "labRoom"), where("roomNumber", "==", data.labRoom));
  //           const labRoomSnapshot = await getDocs(labRoomQuery);

  //           if (!labRoomSnapshot.empty) {
  //             const labRoomDoc = labRoomSnapshot.docs[0];
  //             const labRoomRef = labRoomDoc.ref;

  //             const labRoomItemRef = doc(collection(labRoomRef, "items"), data.itemId);
  //             await deleteDoc(labRoomItemRef);

  //             console.log(`✅ Removed from labRoom/${labRoomRef.id}/items/${data.itemId}`);
  //           }
  //         }
  //       }
  //     }

  //     // Step 4: Delete matching userRequests in each user's subcollection
  //     const usersSnapshot = await getDocs(collection(db, 'accounts'));

  //     for (const userDoc of usersSnapshot.docs) {
  //       const userRequestsRef = collection(db, 'accounts', userDoc.id, 'userRequests');
  //       const userRequestsSnapshot = await getDocs(userRequestsRef);

  //       for (const requestDoc of userRequestsSnapshot.docs) {
  //         const requestData = requestDoc.data();
  //         const filteredData = requestData?.filteredMergedData;

  //         if (!Array.isArray(filteredData)) continue;

  //         const hasMatchingItem = filteredData.some(entry => entry.itemName === item.itemName);

  //         if (hasMatchingItem) {
  //           await deleteDoc(doc(userRequestsRef, requestDoc.id));

  //           // Step 5: Delete from root 'userrequests'
  //           const rootQuery = query(
  //             collection(db, 'userrequests'),
  //             where('accountId', '==', userDoc.id),
  //             where('timestamp', '==', requestData.timestamp)
  //           );
  //           const rootSnap = await getDocs(rootQuery);

  //           const batchDeletes = rootSnap.docs.map(docSnap =>
  //             deleteDoc(doc(db, 'userrequests', docSnap.id))
  //           );
  //           await Promise.all(batchDeletes);
  //         }
  //       }
  //     }

  //     // Step 6: Update UI
  //     setDataSource(prevData =>
  //       prevData.filter(row => row.itemName !== item.itemName)
  //     );

  //     message.success('Item archived successfully');
  //     onDeleteSuccess(item.itemId);
  //     onClose();

  //   } catch (error) {
  //     console.error('Error archiving item:', error);
  //     message.error('Failed to archive item');
  //   }
  // };

  // BACKEND
  // const handleDelete = async (item, setDataSource, onDeleteSuccess, onClose) => {
  //   if (!item || !item.itemId || !item.itemName) {
  //     message.error("Invalid item data");
  //     return;
  //   }

  //   try {
  //     // 🔁 Call your backend route
  //     const response = await axios.post("http://localhost:5000/archive-inventory", {
  //       item,
  //     });

  //     if (response.status === 200) {
  //       // ✅ Update frontend state
  //       setDataSource(prevData => prevData.filter(row => row.itemName !== item.itemName));

  //       message.success("Item archived successfully");
  //       onDeleteSuccess(item.itemId);
  //       onClose();
  //     } else {
  //       message.error("Failed to archive item");
  //     }

  //   } catch (error) {
  //     console.error("Error deleting item:", error);
  //     message.error("Server error while deleting item");
  //   }
  // };

    const [isNotificationVisible, setIsNotificationVisible] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");

  const handleDelete = async (item, setDataSource, onDeleteSuccess, onClose) => {
    if (!item || !item.itemId || !item.itemName) {
      message.error("Invalid item data");
      return;
    }

    try {
      // ✅ Read user info from localStorage
      const userId = localStorage.getItem("userId") || "unknown";
      const userName = localStorage.getItem("userName") || "User";

      const response = await axios.post("https://webnuls.onrender.com/archive-inventory", {
        item,
        userId,
        userName,
      });

      if (response.status === 200) {
        // ✅ Update table data
        setDataSource(prevData =>
          prevData.filter(row => row.itemName !== item.itemName)
        );

        setNotificationMessage("Item successfully archived!");
        setIsNotificationVisible(true);
        onDeleteSuccess(item.itemId);
        onClose();
        
      } else {
        message.error("Failed to archive item");
      }

    } catch (error) {
      console.error("Error deleting item:", error);
      message.error("Server error while deleting item");
    }
  };

  return (
    <>
      <Modal
        title="Confirm Archive"
        visible={visible}
        onOk={() => handleDelete(item, setDataSource, onDeleteSuccess, onClose)} // ✅ Now passing arguments
        onCancel={onClose}
        okText="Archive"
        okType="danger"
        cancelText="Cancel"
        zIndex={1021}
      >
        <p>Are you sure you want to archive <strong>{item?.itemName}</strong>?</p>
      </Modal>

      <NotificationModal
        isVisible={isNotificationVisible}
        onClose={() => setIsNotificationVisible(false)}
        message={notificationMessage}
      />
      
    </>
  );
};

export default DeleteModal;
