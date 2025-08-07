// VERSION 1
// import React from "react";
// import { Modal, Row, Col, Typography, Table, Button } from "antd";
// import { doc, updateDoc, collection, addDoc, serverTimestamp, query, where, getDoc, getDocs  } from "firebase/firestore";
// import { db } from "../../backend/firebase/FirebaseConfig"; 
// import { getAuth } from "firebase/auth";
// const { Text, Title } = Typography;

// const ApprovedRequestModal = ({
//   isApprovedModalVisible,
//   setIsApprovedModalVisible,
//   selectedApprovedRequest,
//   setSelectedApprovedRequest,
//   formatDate,
// }) => {
//   // fallback to empty array if undefined
//   const requestList = selectedApprovedRequest?.requestList || [];
//  

//   if (selectedApprovedRequest) {
//     
//   }

//   // Define your own columns for the modal
//   const approvedRequestColumns = [
//     {
//       title: "Item Name",
//       dataIndex: "itemName",
//       key: "itemName",
//     },
//     {
//       title: "Quantity",
//       dataIndex: "quantity",
//       key: "quantity",
//     },
//     {
//       title: "Category",
//       dataIndex: "category",
//       key: "category",
//     },
//     {
//       title: "Condition",
//       dataIndex: "condition",
//       key: "condition",
//     },
//   ];

//   // const handleApprove = async () => {
//   //   try {
//   //     const requisitionId = selectedApprovedRequest?.id;
//   //     if (!requisitionId) {
//   //     

//   //       return;
//   //     }
  
//   //     // Get current authenticated user
//   //     const auth = getAuth();
//   //     const currentUser = auth.currentUser;
//   //     const userEmail = currentUser?.email;
  
//   //     let approverName = "Unknown";
//   //     if (userEmail) {
//   //       const userQuery = query(collection(db, "accounts"), where("email", "==", userEmail));
//   //       const userSnapshot = await getDocs(userQuery);
        
//   //       if (!userSnapshot.empty) {
//   //         approverName = userSnapshot.docs[0].data().name || "Unknown";
//   //       }
//   //     }
  
//   //     // ✅ Loop through each returned item and update inventory quantity
//   //     for (const item of selectedApprovedRequest.requestList || []) {
//   //       const inventoryId = item.selectedItemId || item.selectedItem?.value;
//   //       const returnedQty = Number(item.quantity);
  
//   //       if (inventoryId && !isNaN(returnedQty)) {
//   //         const inventoryDocRef = doc(db, "inventory", inventoryId);
//   //         const inventoryDocSnap = await getDoc(inventoryDocRef);
  
//   //         if (inventoryDocSnap.exists()) {
//   //           const currentQty = inventoryDocSnap.data().quantity || 0;
//   //           await updateDoc(inventoryDocRef, {
//   //             quantity: currentQty + returnedQty,
//   //           });

//   //         } else {
//   //         
//   //         }
//   //       }
//   //     }
  
//   //     // ✅ Update borrowcatalog status
//   //     const borrowDocRef = doc(db, "borrowcatalog", requisitionId);
//   //     await updateDoc(borrowDocRef, { status: "Approved" });
  
//   //     // ✅ Log request in requestlog
//   //     const requestLogRef = collection(db, "requestlog");
//   //     await addDoc(requestLogRef, {
//   //       requisitionId,
//   //       userName: selectedApprovedRequest.userName || "N/A",
//   //       timestamp: serverTimestamp(),
//   //       dateRequired: selectedApprovedRequest.dateRequired || "N/A",
//   //       timeFrom: selectedApprovedRequest.timeFrom || "N/A",
//   //       timeTo: selectedApprovedRequest.timeTo || "N/A",
//   //       reason: selectedApprovedRequest.reason || "N/A",
//   //       room: selectedApprovedRequest.room || "N/A",
//   //       course: selectedApprovedRequest.course || "N/A",
//   //       courseDescription: selectedApprovedRequest.courseDescription || "N/A",
//   //       program: selectedApprovedRequest.program || "N/A",
//   //       status: "Returned",
//   //       requestList: selectedApprovedRequest.requestList || [],
//   //       approvedBy: approverName,
//   //     });
  
//   //   
//   //     setIsApprovedModalVisible(false);
//   //     setSelectedApprovedRequest(null);
  
//   //   } catch (error) {
//   //    
//   //   }
//   // };  


//   const handleDeploy = async () => {
//   try {
//     const docRef = doc(db, "borrowcatalog", selectedApprovedRequest.id);
//     await updateDoc(docRef, {
//       status: "Deployed",
//     });

//     // Optional: feedback or close modal
//     alert("Request successfully deployed!");
//     setIsApprovedModalVisible(false);
//   } catch (error) {
//    

//     alert("Failed to deploy request.");
//   }
// };

//   const handleApprove = async () => {
//     try {
//       const requisitionId = selectedApprovedRequest?.id;
//       if (!requisitionId) {
//      
//         return;
//       }
  
//       // Get current authenticated user
//       const auth = getAuth();
//       const currentUser = auth.currentUser;
//       const userEmail = currentUser?.email;
  
//       let approverName = "Unknown";
//       if (userEmail) {
//         const userQuery = query(collection(db, "accounts"), where("email", "==", userEmail));
//         const userSnapshot = await getDocs(userQuery);
        
//         if (!userSnapshot.empty) {
//           approverName = userSnapshot.docs[0].data().name || "Unknown";
//         }
//       }

//       for (const item of selectedApprovedRequest.requestList || []) {
//         const inventoryId = item.selectedItemId || item.selectedItem?.value;
//         const returnedQty = Number(item.quantity);
//         const labRoomId = item.labRoom; // Comes from filteredMergedData

//         if (inventoryId && !isNaN(returnedQty)) {
//           const inventoryDocRef = doc(db, "inventory", inventoryId);
//           const inventoryDocSnap = await getDoc(inventoryDocRef);

//           if (inventoryDocSnap.exists()) {
//             const inventoryData = inventoryDocSnap.data();
//             const currentInventoryQty = Number(inventoryData.quantity || 0);
//             const newInventoryQty = currentInventoryQty + returnedQty;

//             // Update inventory quantity
//             await updateDoc(inventoryDocRef, {
//               quantity: newInventoryQty,
//             });
//            

//             // Update labRoom item quantity
//             const itemId = inventoryData.itemId;
//             if (labRoomId && itemId) {
//               const labRoomItemRef = doc(db, "labRoom", labRoomId, "items", itemId);
//               const labRoomItemSnap = await getDoc(labRoomItemRef);

//               if (labRoomItemSnap.exists()) {
//                 const currentLabQty = Number(labRoomItemSnap.data().quantity || 0);
//                 const newLabQty = currentLabQty + returnedQty;

//                 await updateDoc(labRoomItemRef, {
//                   quantity: newLabQty,
//                 });

//               
//               } else {
//             
//               }
//             } else {
//            
//             }

//           } else {
//    
//           }
//         }
//       }
  
//       // ✅ Update borrowcatalog status
//       const borrowDocRef = doc(db, "borrowcatalog", requisitionId);
//       await updateDoc(borrowDocRef, { status: "Return Approved" });
  
//       // ✅ Log request in requestlog
//       const requestLogRef = collection(db, "requestlog");
//       await addDoc(requestLogRef, {
//         requisitionId,
//         userName: selectedApprovedRequest.userName || "N/A",
//         timestamp: serverTimestamp(),
//         dateRequired: selectedApprovedRequest.dateRequired || "N/A",
//         timeFrom: selectedApprovedRequest.timeFrom || "N/A",
//         timeTo: selectedApprovedRequest.timeTo || "N/A",
//         reason: selectedApprovedRequest.reason || "N/A",
//         room: selectedApprovedRequest.room || "N/A",
//         course: selectedApprovedRequest.course || "N/A",
//         courseDescription: selectedApprovedRequest.courseDescription || "N/A",
//         program: selectedApprovedRequest.program || "N/A",
//         status: "Returned",
//         requestList: selectedApprovedRequest.requestList || [],
//         approvedBy: approverName,
//       });
  
//      
//       setIsApprovedModalVisible(false);
//       setSelectedApprovedRequest(null);
  
//     } catch (error) {
//      
//     }
//   };  

//   return (
//     <Modal
//       title={
//         <div style={{ background: "#389e0d", padding: "12px", color: "#fff" }}>
//           <Text strong>✅ Approved Request Details</Text>
//           <span style={{ float: "right", fontStyle: "italic" }}>
//             Requisition ID: {selectedApprovedRequest?.id || "N/A"}
//           </span>
//         </div>
//       }
//       open={isApprovedModalVisible}
//       onCancel={() => {
//         setIsApprovedModalVisible(false);
//         setSelectedApprovedRequest(null);
//       }}
//       width={800}
//       zIndex={1024}
//       footer={
//         selectedApprovedRequest?.status === "Returned" ? (
//           <Button type="primary" onClick={handleApprove}>
//             Approve
//           </Button>
//         ) : null
//       }
//     >
//       {selectedApprovedRequest && (
//         <div style={{ padding: "20px" }}>
//           <Row gutter={[16, 16]}>
//             <Col span={12}>
//               <Text strong>Name:</Text> {selectedApprovedRequest.userName || "N/A"}<br />
//               <Text strong>Request Date:</Text>{" "}
//               {selectedApprovedRequest?.timestamp
//                 ? formatDate(selectedApprovedRequest.timestamp)
//                 : "N/A"}
//               <br />
//               <Text strong>Required Date:</Text> {selectedApprovedRequest.dateRequired || "N/A"}<br />
//               <Text strong>Time Needed:</Text> {selectedApprovedRequest.timeFrom || "N/A"} - {selectedApprovedRequest.timeTo || "N/A"}
//             </Col>
//             <Col span={12}>
//               <Text strong>Reason of Request:</Text>
//               <p style={{ fontSize: "12px", marginTop: 5 }}>{selectedApprovedRequest.reason || "N/A"}</p>
//               <Text strong>Room:</Text> {selectedApprovedRequest.room || "N/A"}<br />
//               <Text strong>Course Code:</Text> {selectedApprovedRequest.course || "N/A"}<br />
//               <Text strong>Course Description:</Text> {selectedApprovedRequest.courseDescription || "N/A"}<br />
//               <Text strong>Program:</Text> {selectedApprovedRequest.program || "N/A"}
//             </Col>
//           </Row>

//           <Title level={5} style={{ marginTop: 20 }}>Requested Items:</Title>
//           <Table
//             dataSource={requestList.map((item, index) => ({
//               ...item,
//               key: item.itemIdFromInventory || `item-${index}`,
//             }))}
//             columns={approvedRequestColumns}
//             rowKey="key"
//             pagination={false}
//             bordered
//           />
//           {selectedApprovedRequest?.status === "Borrowed" && (
//             <Button type="primary" danger onClick={handleDeploy}>
//               Deploy
//             </Button>
//           )}

//         </div>
//       )}
//     </Modal>
//   );
// };

// export default ApprovedRequestModal;

// VERSION 2
import React, { useState, useEffect } from "react";
import { Modal, Row, Col, Typography, Table, Button } from "antd";
import { doc, updateDoc, collection, addDoc, serverTimestamp, query, where, getDoc, getDocs  } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig"; 
import { getAuth } from "firebase/auth";
import NotificationModal from "./NotificationModal";
const { Text, Title } = Typography;

const ApprovedRequestModal = ({
  isApprovedModalVisible,
  setIsApprovedModalVisible,
  selectedApprovedRequest,
  setSelectedApprovedRequest,
  formatDate,
}) => {
  
  // fallback to empty array if undefined
const requestList = selectedApprovedRequest?.requestList || [];
const [notificationMessage, setNotificationMessage] = useState("");
const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);

  const conditionCounts = requestList.reduce((acc, item) => {
    const condition = item.condition;
    if (condition) {
      if (!acc[condition]) {
        acc[condition] = 0;
      }
      acc[condition]++;
    }
    return acc;
  }, {});

  if (selectedApprovedRequest) {
  
  }

  // Define your own columns for the modal
  const approvedRequestColumns = [
    {
      title: "Item ID",
      key: "itemId",
      render: (_, record) => record.itemId || record.itemIdFromInventory,
    },
    {
      title: "Item Name",
      dataIndex: "itemName",
      key: "itemName",
    },
    {
      title: "Item Description",
      dataIndex: "itemDetails",
      key: "itemDetails",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
    },
  ];

if (selectedApprovedRequest?.status === "Returned") {
  approvedRequestColumns.push({
    title: "Condition",
    dataIndex: "conditionSummary",
    key: "conditionSummary",
    render: (text) => <span>{text || "N/A"}</span>,
  });
}

const showNotification = (msg) => {
  setNotificationMessage(msg);
  setIsNotificationModalVisible(true);
};

function getConditionSummary(conditionsArray) {
  if (!Array.isArray(conditionsArray)) return "N/A";

  const counts = conditionsArray.reduce((acc, condition) => {
    acc[condition] = (acc[condition] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([condition, count]) => `${condition}: ${count}`)
    .join(", ");
}

  const logRequestOrReturn = async (userId, userName, action, requestDetails) => {
    await addDoc(collection(db, `accounts/${userId}/activitylog`), {
      action, // e.g. "Requested Items" or "Returned Items"
      userName,
      timestamp: serverTimestamp(),
      requestList: requestDetails, 
    });
  };

  // const handleDeploy = async () => {
  //   const userId = localStorage.getItem("userId");
  //   const userName = localStorage.getItem("userName");

  //   let requestorAccountId = selectedApprovedRequest.accountId;

  //   try {
  //     // Fallback: if accountId is missing, fetch it using userId
  //     if (!requestorAccountId && selectedApprovedRequest.accountId) {
      

  //       const accountsQuery = query(
  //         collection(db, "accounts"),
  //         where("accountId", "==", selectedApprovedRequest.accountId)
  //       );

  //       const accountsSnapshot = await getDocs(accountsQuery);
  //       if (!accountsSnapshot.empty) {
  //         requestorAccountId = accountsSnapshot.docs[0].accountId;
   

  //       } else {
  //         throw new Error("No account found for userId");
  //       }
  //     }

  //     if (!requestorAccountId) {
      
  //       alert("Cannot update user request log. accountId is missing.");
  //       return;
  //     }

  //     // 1. Update status in borrowcatalog
  //     const docRef = doc(db, "borrowcatalog", selectedApprovedRequest.id);
  //     await updateDoc(docRef, {
  //       status: "Deployed",
  //     });

  //     const mainItemName = selectedApprovedRequest.requestList?.[0]?.itemName || "Item";
  //     const deployMessage = `Deployed "${mainItemName}" to ${selectedApprovedRequest.userName} in ${selectedApprovedRequest.room}`;

  //     // 2. Log the activity
  //     await logRequestOrReturn(userId, userName, deployMessage, {
  //       requestId: selectedApprovedRequest.id,
  //       status: "Deployed",
  //       itemName: mainItemName,
  //       userDeployedTo: selectedApprovedRequest.userName,
  //     });

  //     // 3. Update userrequestlog
  //     const userRequestQuery = query(
  //     collection(db, `accounts/${requestorAccountId}/userrequestlog`),
  //     // where("dateRequired", "==", selectedApprovedRequest.dateRequired)
  //     );

  //     const userRequestSnapshot = await getDocs(userRequestQuery);
     

  //     for (const docSnap of userRequestSnapshot.docs) {
  //       const docData = docSnap.data();
  //       let hasMatchingItem = false;

  //       docData.requestList?.forEach(async (item) => {
  //         const selectedItem = selectedApprovedRequest.requestList?.[0]; 
  //         const requestorLogData = selectedApprovedRequest;

  //         const matches =
  //           item.itemName === selectedItem?.itemName &&
  //           item.itemDetails === selectedItem?.itemDetails &&
  //           item.selectedItemId === selectedItem?.selectedItemId &&
  //           item.labRoom === selectedItem?.labRoom &&
  //           item.quantity === selectedItem?.quantity &&
  //           docData.program === requestorLogData.program &&
  //           docData.timeFrom === requestorLogData.timeFrom &&
  //           docData.timeTo === requestorLogData.timeTo;



  //         if (matches) {
  //           hasMatchingItem = true;

  //           await updateDoc(doc(db, `accounts/${requestorAccountId}/userrequestlog/${docSnap.id}`), {
  //             status: 'Deployed'
  //           });

           
  //         } 
  //       });
  //     }
      
  //     alert("Request successfully deployed!");
  //     setIsApprovedModalVisible(false);

  //   } catch (error) {
  //     alert("Deployment failed. Check console for details.");
  //   }
  // };

  const handleDeploy = async () => {
    console.log("🚀 Selected Record:", selectedApprovedRequest);

    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");

    let requestorAccountId = selectedApprovedRequest.accountId;

    try {
      // Fallback: if accountId is missing, fetch it using userId
      if (!requestorAccountId && selectedApprovedRequest.accountId) {
        console.warn("⚠️ accountId missing. Trying to fetch via userId...");

        const accountsQuery = query(
          collection(db, "accounts"),
          where("accountId", "==", selectedApprovedRequest.accountId)
        );

        const accountsSnapshot = await getDocs(accountsQuery);
        if (!accountsSnapshot.empty) {
          requestorAccountId = accountsSnapshot.docs[0].accountId;
          console.log("✅ accountId fetched:", requestorAccountId);
        } else {
          throw new Error("No account found for userId");
        }
      }

      if (!requestorAccountId) {
        console.error("❌ Cannot update userrequestlog: accountId is missing");
        alert("Cannot update user request log. accountId is missing.");
        return;
      }

      // 1. Update status in borrowcatalog
      const docRef = doc(db, "borrowcatalog", selectedApprovedRequest.id);
      await updateDoc(docRef, {
        status: "Deployed",
      });

      const mainItemName = selectedApprovedRequest.requestList?.[0]?.itemName || "Item";
      const deployMessage = `Deployed "${mainItemName}" to ${selectedApprovedRequest.userName} in ${selectedApprovedRequest.room}`;

      // 2. Log the activity
      await logRequestOrReturn(userId, userName, deployMessage, {
        requestId: selectedApprovedRequest.id,
        status: "Deployed",
        itemName: mainItemName,
        userDeployedTo: selectedApprovedRequest.userName,
      });

      // ✅ 3. Add to historylog subcollection of the user
      await addDoc(collection(db, `accounts/${requestorAccountId}/historylog`), {
        action: "Deployed",
        userName: selectedApprovedRequest.userName,
        timestamp: serverTimestamp(),
        requestList: selectedApprovedRequest.requestList || [],
        program: selectedApprovedRequest.program,
        room: selectedApprovedRequest.room,
        dateRequired: selectedApprovedRequest.dateRequired,
        timeFrom: selectedApprovedRequest.timeFrom,
        timeTo: selectedApprovedRequest.timeTo,
        approvedBy: userName || "N/A",
      });

      // 4. Update userrequestlog
      const userRequestQuery = query(
        collection(db, `accounts/${requestorAccountId}/userrequestlog`)
        // where("dateRequired", "==", selectedApprovedRequest.dateRequired)
      );

      const userRequestSnapshot = await getDocs(userRequestQuery);
      console.log("📄 userrequestlog found:", userRequestSnapshot.docs.length);

      for (const docSnap of userRequestSnapshot.docs) {
        const docData = docSnap.data();
        let hasMatchingItem = false;

        docData.requestList?.forEach(async (item) => {
          const selectedItem = selectedApprovedRequest.requestList?.[0];
          const requestorLogData = selectedApprovedRequest;

          const matches =
            item.itemName === selectedItem?.itemName &&
            item.itemDetails === selectedItem?.itemDetails &&
            item.selectedItemId === selectedItem?.selectedItemId &&
            item.labRoom === selectedItem?.labRoom &&
            item.quantity === selectedItem?.quantity &&
            docData.program === requestorLogData.program &&
            docData.timeFrom === requestorLogData.timeFrom &&
            docData.timeTo === requestorLogData.timeTo;

          console.log("🔍 Comparing item:");
          console.log("  itemName:", item.itemName, "==", selectedItem?.itemName);
          console.log("  itemDetails:", item.itemDetails, "==", selectedItem?.itemDetails);
          console.log("  selectedItemId:", item.selectedItemId, "==", selectedItem?.selectedItemId);
          console.log("  labRoom:", item.labRoom, "==", selectedItem?.labRoom);
          console.log("  quantity:", item.quantity, "==", selectedItem?.quantity);
          console.log("  program:", docData.program, "==", requestorLogData.program);
          console.log("  timeFrom:", docData.timeFrom, "==", requestorLogData.timeFrom);
          console.log("  timeTo:", docData.timeTo, "==", requestorLogData.timeTo);
          console.log("  ➤ Matches:", matches);

          if (matches) {
            hasMatchingItem = true;

            await updateDoc(
              doc(db, `accounts/${requestorAccountId}/userrequestlog/${docSnap.id}`),
              {
                status: "Deployed",
              }
            );

            console.log("✅ userrequestlog updated to 'Deployed'");
          }
        });
      }

      // alert("Request successfully deployed!");
      showNotification("Request successfully deployed!");
      setIsApprovedModalVisible(false);

    } catch (error) {
      console.error("❌ Error during deployment:", error.message || error);
      alert("Deployment failed. Check console for details.");
    }
  };

  const handleApprove = async () => {
    try {
      const requisitionId = selectedApprovedRequest?.id;
      if (!requisitionId) {
      
        return;
      }
  
      // Get current authenticated user
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const userEmail = currentUser?.email;
  
      let approverName = "Unknown";
      if (userEmail) {
        const userQuery = query(collection(db, "accounts"), where("email", "==", userEmail));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          approverName = userSnapshot.docs[0].data().name || "Unknown";
        }
      }

      for (const item of selectedApprovedRequest.requestList || []) {
        const inventoryId = item.selectedItemId || item.selectedItem?.value;
        const returnedQty = Number(item.quantity);
        const labRoomId = item.labRoom;
        const conditionReturned = Array.isArray(item.conditions) && item.conditions[0]
        ? item.conditions[0]
        : "Good"; // default fallback

        if (inventoryId && !isNaN(returnedQty)) {
          const inventoryDocRef = doc(db, "inventory", inventoryId);
          const inventoryDocSnap = await getDoc(inventoryDocRef);

        if (inventoryDocSnap.exists()) {
          const inventoryData = inventoryDocSnap.data();
          const currentQty = Number(inventoryData.quantity || 0);
          const currentCond = inventoryData.condition || {};
          const currentCondQty = Number(currentCond[conditionReturned] || 0);


            // Update inventory
            await updateDoc(inventoryDocRef, {
              quantity: currentQty + returnedQty,
              [`condition.${conditionReturned}`]: currentCondQty + returnedQty,
            });


             const labRoomNumber = item.labRoom;
           // 🔍 STEP 1: Find labRoom document by roomNumber
            const labRoomQuery = query(
              collection(db, "labRoom"),
              where("roomNumber", "==", labRoomNumber)
            );
            const labRoomSnapshot = await getDocs(labRoomQuery);

            if (labRoomSnapshot.empty) {
             
              continue;
            }

            const labRoomDoc = labRoomSnapshot.docs[0];
            const labRoomId = labRoomDoc.id;

            // 🔍 STEP 2: Find item in the labRoom/{labRoomId}/items by itemId field
            const itemId = inventoryData.itemId;
            const labItemsRef = collection(db, "labRoom", labRoomId, "items");
            const itemQuery = query(labItemsRef, where("itemId", "==", itemId));
            const itemSnapshot = await getDocs(itemQuery);

            if (itemSnapshot.empty) {
             
              continue;
            }

            const itemDoc = itemSnapshot.docs[0];
            const labItemDocId = itemDoc.id;
            const labItemRef = doc(db, "labRoom", labRoomId, "items", labItemDocId);

            const labData = itemDoc.data();
            const labQty = Number(labData.quantity || 0);
            const labCond = labData.condition || {};
            const labCondQty = Number(labCond[conditionReturned] || 0);

            // ✅ Update labRoom item
            await updateDoc(labItemRef, {
              quantity: labQty + returnedQty,
              [`condition.${conditionReturned}`]: labCondQty + returnedQty,
            });

           

          } else {
    
          } 
        }
      }
  
      // ✅ Update borrowcatalog status
      const borrowDocRef = doc(db, "borrowcatalog", requisitionId);
      await updateDoc(borrowDocRef, { status: "Return Approved" });

     // Step 1: Find the matching requestlog document using a field (like accountId)
      const requestLogQuery = query(
        collection(db, "requestlog"),
        where("accountId", "==", selectedApprovedRequest.accountId)
      );

      const requestLogSnapshot = await getDocs(requestLogQuery);

      if (!requestLogSnapshot.empty) {
        // Assuming only one match — update that document
        const requestLogDoc = requestLogSnapshot.docs[0];
        const requestLogDocRef = doc(db, "requestlog", requestLogDoc.id);

        await updateDoc(requestLogDocRef, {
          status: "Returned",
          timestamp: serverTimestamp(),
        });

    
        
      } else {
       
      }

      showNotification("Return Item successfully approved!");
      setIsApprovedModalVisible(false);
      setSelectedApprovedRequest(null);
  
    } catch (error) {
     
    }
  };  

  const handleRelease = async () => {
    try {
      const docRef = doc(db, "borrowcatalog", selectedApprovedRequest.id);
      await updateDoc(docRef, { status: "Released" });

      showNotification("Requested Item successfully released!");
      setIsApprovedModalVisible(false);
      setSelectedApprovedRequest(null);
      
    } catch (err) {
      console.error("Error releasing request:", err);
      alert("Release failed.");
    }
  };

  return (
  <>
    <Modal
      title={
        <div style={{ background: "#389e0d", padding: "12px", color: "#fff" }}>
          <Text strong>✅ Approved Request Details</Text>
          {/* <span style={{ float: "right", fontStyle: "italic" }}>
            Requisition ID: {selectedApprovedRequest?.id || "N/A"}
          </span> */}
        </div>
      }
      open={isApprovedModalVisible}
      onCancel={() => {
        setIsApprovedModalVisible(false);
        setSelectedApprovedRequest(null);
      }}
      width={800}
      zIndex={1024}
      footer={
        selectedApprovedRequest?.status === "Returned" ? (
          <Button type="primary" onClick={handleApprove}>
            Approve
          </Button>
        ) : selectedApprovedRequest?.status === "For Release" ? (
          <Button type="primary" onClick={handleRelease}>
            Release
          </Button>
        ) : null
      }
    >
      {selectedApprovedRequest && (
        <div style={{ padding: "20px" }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong>Name:</Text> {selectedApprovedRequest.userName || "N/A"}<br />
              <Text strong>Request Date:</Text>{" "}
              {selectedApprovedRequest?.timestamp
                ? formatDate(selectedApprovedRequest.timestamp)
                : "N/A"}
              <br />
              <Text strong>Required Date:</Text> {selectedApprovedRequest.dateRequired || "N/A"}<br />
              <Text strong>Time Needed:</Text> {selectedApprovedRequest.timeFrom || "N/A"} - {selectedApprovedRequest.timeTo || "N/A"}
            </Col>

            <Col span={12}>
              <Text strong>Reason of Request:</Text>
              <p style={{ fontSize: "12px", marginTop: 5 }}>{selectedApprovedRequest.reason || "N/A"}</p>
              <Text strong>Room:</Text> {selectedApprovedRequest.room || "N/A"}<br />
              <Text strong>Course Code:</Text> {selectedApprovedRequest.course || "N/A"}<br />
              <Text strong>Course Description:</Text> {selectedApprovedRequest.courseDescription || "N/A"}<br />
              <Text strong>Program:</Text> {selectedApprovedRequest.program || "N/A"}
            </Col>
          </Row>

          <Title level={5} style={{ marginTop: 20 }}>Requested Items:</Title>
          <Table
            dataSource={requestList.map((item, index) => ({
              ...item,
              key: item.itemIdFromInventory || `item-${index}`,
              conditionSummary: getConditionSummary(item.conditions),
            }))}
            columns={approvedRequestColumns}
            rowKey="key"
            pagination={false}
            bordered
          />
          {selectedApprovedRequest?.status === "Borrowed" && (
            <Button type="primary" danger onClick={handleDeploy}>
              Deploy
            </Button>
          )}

        </div>
      )}
    </Modal>

    <NotificationModal
      isVisible={isNotificationModalVisible}
      onClose={() => setIsNotificationModalVisible(false)}
      message={notificationMessage}
    />
  </>
  );
};

export default ApprovedRequestModal;
