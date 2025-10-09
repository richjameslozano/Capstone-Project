import React, { useState, useEffect } from "react";
import { Modal, Row, Col, Typography, Table, Button, Descriptions } from "antd";
import { doc, updateDoc, collection, addDoc, serverTimestamp, query, where, getDoc, getDocs, deleteDoc  } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig"; 
import { getAuth } from "firebase/auth";
import NotificationModal from "./NotificationModal";
import { FileDoneOutlined } from '@ant-design/icons';
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
const [approveLoading, setApproveLoading] = useState(false);
const [releaseLoading, setReleaseLoading] = useState(false);
const [deployLoading, setDeployLoading] = useState(false);

  const conditionCounts = requestList.reduce((acc, item) => {
    // For equipment items with individual QR codes, use the returned conditions
    if (item.category === "Equipment" && item.individualQRConditions) {
      item.individualQRConditions.forEach(qrCondition => {
        const condition = qrCondition.condition;
        if (condition) {
          if (!acc[condition]) {
            acc[condition] = 0;
          }
          acc[condition]++;
        }
      });
    } else if (item.category === "Equipment" && item.conditions) {
      // Fallback: use the conditions array if individualQRConditions is not available
      item.conditions.forEach(condition => {
        if (condition) {
          if (!acc[condition]) {
            acc[condition] = 0;
          }
          acc[condition]++;
        }
      });
    } else {
      // For non-equipment items, use the original condition
      const condition = item.condition;
      if (condition) {
        if (!acc[condition]) {
          acc[condition] = 0;
        }
        acc[condition]++;
      }
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

  const handleDeploy = async () => {
    setDeployLoading(true);
  
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");

    let requestorAccountId = selectedApprovedRequest.accountId;
    const borrowDocRef = doc(db, "borrowcatalog", selectedApprovedRequest.id);
    const borrowDocSnap = await getDoc(borrowDocRef);
    
    if (!borrowDocSnap.exists()) {
      console.error("❌ Borrowcatalog document not found");
      alert("Deployment Error: Request document not found");
      setDeployLoading(false);
      return;
    }
    
    const latestBorrowData = borrowDocSnap.data();
    
    // 🔧 Extract individualItemId from deployedQRCodes objects
    const specificQRCodes = latestBorrowData.deployedQRCodes?.map(qr => qr.individualItemId || qr.id) || [];
  
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

      // 🔧 Deploy individual QR codes for equipment items
      let deployedQRCodes = [];
      const requestList = selectedApprovedRequest.requestList || [];
      
      for (const item of requestList) {
        if (item.category === "Equipment") {
          
          // Try to find the correct item ID field
          const documentId = item.itemIdFromInventory || item.selectedItemId || item.itemId;
          
          if (!documentId || !item.quantity) {
            alert(`Deployment Error: Missing required fields - Document ID`);
            setDeployLoading(false);
            return;
          }
          
          try {
            const inventoryDocRef = doc(db, "inventory", documentId);
            const inventoryDocSnap = await getDoc(inventoryDocRef);
            
            if (!inventoryDocSnap.exists()) {
              console.error("❌ Inventory document not found:");
              alert(`Deployment Error: Inventory document not found}`);
              setDeployLoading(false);
              return;
            }
            
            const inventoryData = inventoryDocSnap.data();
            const actualItemId = inventoryData.itemId;
            
            const deployResponse = await fetch('https://webnuls.onrender.com/deploy-individual-qr-codes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                itemId: actualItemId,
                quantity: item.quantity,
                userId: selectedApprovedRequest.accountId, // Use the user who requested, not the admin deploying
                userName: selectedApprovedRequest.userName,
                specificQRCodes: selectedApprovedRequest.deployedQRCodes || [],
              }),
            });

            const deployData = await deployResponse.json();
            
            if (deployResponse.ok) {
              deployedQRCodes = [...deployedQRCodes, ...deployData.deployedQRCodes];
    
            } else {
              console.error("❌ Failed to deploy individual QR codes:", deployData.error);
              alert(`Deployment Error: ${deployData.error || "Failed to deploy individual items"}`);
              setDeployLoading(false);
              return;
            }
          } catch (error) {
            console.error("❌ Error deploying individual QR codes:", error);
            alert("Deployment Error: Failed to deploy individual items");
            setDeployLoading(false);
            return;
          }
        }
      }

      // Update borrowcatalog with deployed QR codes
      if (deployedQRCodes.length > 0) {
        await updateDoc(docRef, {
          deployedQRCodes: deployedQRCodes,
        });
      }

      const mainItemName = selectedApprovedRequest.requestList?.[0]?.itemName || "Item";
      const deployMessage = `Deployed "${mainItemName}" to ${selectedApprovedRequest.userName} in ${selectedApprovedRequest.room}`;

      // 2. Log the activity
      await logRequestOrReturn(userId, userName, deployMessage, {
        requestId: selectedApprovedRequest.id,
        status: "Deployed",
        itemName: mainItemName,
        userDeployedTo: selectedApprovedRequest.userName,
        course: selectedApprovedRequest.course || "N/A",
        courseDescription: selectedApprovedRequest.courseDescription || "N/A",
      });

      const borrowDocRef = doc(db, "borrowcatalog", selectedApprovedRequest.id);
      const borrowDocSnap = await getDoc(borrowDocRef);
      const borrowData = borrowDocSnap.exists() ? borrowDocSnap.data() : {};

      // Use the usageType from the borrowcatalog document or fallback to selectedApprovedRequest
      const usageTypeToLog = borrowData.usageType || selectedApprovedRequest.usageType || "N/A";

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
        usageType: usageTypeToLog,
        course: selectedApprovedRequest.course || "N/A",
        courseDescription: selectedApprovedRequest.courseDescription || "N/A",
        reason: selectedApprovedRequest.reason || "N/A",
      });

      // 3.1
      const approvedHistoryQuery = query(
        collection(db, `accounts/${requestorAccountId}/historylog`),
        where("action", "==", "Request Approved")
      );

      // 3.2
      const approvedHistorySnapshot = await getDocs(approvedHistoryQuery);

      for (const docSnap of approvedHistorySnapshot.docs) {
        const docData = docSnap.data();

        const matches =
          docData.requestList?.[0]?.itemName === selectedApprovedRequest.requestList?.[0]?.itemName &&
          docData.program === selectedApprovedRequest.program &&
          docData.timeFrom === selectedApprovedRequest.timeFrom &&
          docData.timeTo === selectedApprovedRequest.timeTo;

        if (matches) {
          await deleteDoc(doc(db, `accounts/${requestorAccountId}/historylog/${docSnap.id}`));
        }
      }

      // 4. Update userrequestlog
      const userRequestQuery = query(
        collection(db, `accounts/${requestorAccountId}/userrequestlog`)
        // where("dateRequired", "==", selectedApprovedRequest.dateRequired)
      );

      const userRequestSnapshot = await getDocs(userRequestQuery);
  
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

          if (matches) {
            hasMatchingItem = true;

            await updateDoc(
              doc(db, `accounts/${requestorAccountId}/userrequestlog/${docSnap.id}`),
              {
                status: "Deployed",
              }
            );
          }
        });
      }

      showNotification("Request successfully deployed!");
      setIsApprovedModalVisible(false);

    } catch (error) {
      console.error("❌ Error during deployment:", error.message || error);
      alert("Deployment failed. Check console for details.");
    } finally {
      setDeployLoading(false);
    }
  };

  const handleApprove = async () => {
    setApproveLoading(true);
    try {
      const requisitionId = selectedApprovedRequest?.id;
      if (!requisitionId) {
        setApproveLoading(false);
        return;
      }

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
        const labRoomNumber = item.labRoom;
        const totalReturnedQty = Number(item.quantity);

        // 🔧 Handle individual QR code returns for equipment items
        if (item.category === "Equipment") {
          
          try {
            // Get the deployedQRCodes from the selectedApprovedRequest to find the actual QR codes that were deployed
            const deployedQRCodes = selectedApprovedRequest.deployedQRCodes || [];
            
            if (deployedQRCodes.length === 0) {
              continue;
            }
            
            let individualQRConditions = [];
            
            // First, check if the current item has individualQRConditions from the updated requestList
            if (item.individualQRConditions && Array.isArray(item.individualQRConditions)) {
              individualQRConditions = item.individualQRConditions;
            } else {
              // Fallback: try to get the return data from the returnedItems collection
              try {
                const returnQuery = query(
                  collection(db, "returnedItems"),
                  where("userName", "==", selectedApprovedRequest.userName),
                  where("dateRequired", "==", selectedApprovedRequest.dateRequired),
                  where("room", "==", selectedApprovedRequest.room)
                );
                
                const returnSnapshot = await getDocs(returnQuery);
                if (!returnSnapshot.empty) {
                  const returnData = returnSnapshot.docs[0].data();
                  
                  // Find the matching item in the return data
                  const returnItem = returnData.requestList?.find(returnItem => 
                    returnItem.itemIdFromInventory === item.itemIdFromInventory
                  );
                  
                  if (returnItem && returnItem.individualQRConditions) {
                    individualQRConditions = returnItem.individualQRConditions;
   
                  } else {
                    // Fallback to default Good conditions
                    individualQRConditions = deployedQRCodes.map((qrCode, index) => ({
                      qrCodeId: qrCode.id,
                      individualItemId: qrCode.individualItemId,
                      condition: "Good"
                    }));
                  }
                } else {
                  // Fallback to default Good conditions
                  individualQRConditions = deployedQRCodes.map((qrCode, index) => ({
                    qrCodeId: qrCode.id,
                    individualItemId: qrCode.individualItemId,
                    condition: "Good"
                  }));
                }
              } catch (error) {
                console.error("❌ Error retrieving return data:", error);
                // Fallback to default Good conditions
                individualQRConditions = deployedQRCodes.map((qrCode, index) => ({
                  qrCodeId: qrCode.id,
                  individualItemId: qrCode.individualItemId,
                  condition: "Good"
                }));
              }
            }
            
            const returnResponse = await fetch('https://webnuls.onrender.com/return-individual-qr-codes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                itemId: item.itemIdFromInventory,
                individualQRConditions: individualQRConditions,
                userId: "web-user",
                userName: approverName,
              }),
            });

            const returnData = await returnResponse.json();
            
            if (returnResponse.ok) {
              continue;
            } else {
              console.error("❌ Failed to return individual QR codes:", returnData.error);
              alert(`Return Error: ${returnData.error || "Failed to return individual items"}`);
              setApproveLoading(false);
              return;
            }
          } catch (error) {
            console.error("❌ Error returning individual QR codes:", error);
            alert("Return Error: Failed to return individual items");
            setApproveLoading(false);
            return;
          }
        }

        const conditionCounts = {};

        if (Array.isArray(item.conditions) && item.conditions.length > 0) {
          // Count each condition
          item.conditions.forEach((cond) => {
            if (cond) {
              conditionCounts[cond] = (conditionCounts[cond] || 0) + 1;
            }
          });
        } else if (totalReturnedQty > 0) {
          conditionCounts["Good"] = totalReturnedQty;
        }

        if (inventoryId && !isNaN(totalReturnedQty)) {
          const inventoryDocRef = doc(db, "inventory", inventoryId);
          const inventoryDocSnap = await getDoc(inventoryDocRef);
          if (!inventoryDocSnap.exists()) continue;

          const inventoryData = inventoryDocSnap.data();
          const itemId = inventoryData.itemId;

          for (const [condType, qty] of Object.entries(conditionCounts)) {
            const currentQty = Number(inventoryData.quantity || 0);
            const currentCond = inventoryData.condition || {};
            const currentCondQty = Number(currentCond[condType] || 0);

            const updateData = {
              [`condition.${condType}`]: currentCondQty + qty,
            };

            if (condType === "Good") {
              updateData.quantity = currentQty + qty;
            }

            await updateDoc(inventoryDocRef, updateData);
          }

          const labRoomQuery = query(
            collection(db, "labRoom"),
            where("roomNumber", "==", labRoomNumber)
          );
          const labRoomSnapshot = await getDocs(labRoomQuery);
          if (labRoomSnapshot.empty) continue;

          const labRoomDoc = labRoomSnapshot.docs[0];
          const labRoomId = labRoomDoc.id;

          const labItemsRef = collection(db, "labRoom", labRoomId, "items");
          const itemQuery = query(labItemsRef, where("itemId", "==", itemId));
          const itemSnapshot = await getDocs(itemQuery);
          if (itemSnapshot.empty) continue;

          const itemDoc = itemSnapshot.docs[0];
          const labItemDocId = itemDoc.id;
          const labItemRef = doc(db, "labRoom", labRoomId, "items", labItemDocId);
          const labData = itemDoc.data();

          for (const [condType, qty] of Object.entries(conditionCounts)) {
            const labQty = Number(labData.quantity || 0);
            const labCond = labData.condition || {};
            const labCondQty = Number(labCond[condType] || 0);

            const labUpdateData = {
              [`condition.${condType}`]: labCondQty + qty,
            };

            if (condType === "Good") {
              labUpdateData.quantity = labQty + qty;
            }

            await updateDoc(labItemRef, labUpdateData);
          }
        }
      }

      const borrowDocRef = doc(db, "borrowcatalog", requisitionId);
      await updateDoc(borrowDocRef, { status: "Return Approved" });

      const requestLogQuery = query(
        collection(db, "requestlog"),
        where("accountId", "==", selectedApprovedRequest.accountId)
      );

      const requestLogSnapshot = await getDocs(requestLogQuery);
      if (!requestLogSnapshot.empty) {
        const requestLogDoc = requestLogSnapshot.docs[0];
        const requestLogDocRef = doc(db, "requestlog", requestLogDoc.id);

        await updateDoc(requestLogDocRef, {
          status: "Returned",
          timestamp: serverTimestamp(),
        });
      }

      showNotification("Return Item successfully approved!");
      setIsApprovedModalVisible(false);
      setSelectedApprovedRequest(null);

    } catch (error) {
      console.error("Approval error:", error);
      
    } finally {
      setApproveLoading(false);
    }
  };


  const handleRelease = async () => {
    setReleaseLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      const userName = localStorage.getItem("userName");
      let requestorAccountId = selectedApprovedRequest.accountId;

      // Fallback: if accountId is missing, fetch it using userId
      if (!requestorAccountId && selectedApprovedRequest.accountId) {

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
      await updateDoc(docRef, { status: "Released" });

      const mainItemName = selectedApprovedRequest.requestList?.[0]?.itemName || "Item";
      const releaseMessage = `Released "${mainItemName}" to ${selectedApprovedRequest.userName} in ${selectedApprovedRequest.room}`;

      // 2. Log the activity
      await logRequestOrReturn(userId, userName, releaseMessage, {
        requestId: selectedApprovedRequest.id,
        status: "Released",
        itemName: mainItemName,
        userReleasedTo: selectedApprovedRequest.userName,
        course: selectedApprovedRequest.course || "N/A",
        courseDescription: selectedApprovedRequest.courseDescription || "N/A",
      });

      // 3. Add to historylog subcollection of the user
      const borrowDocRef = doc(db, "borrowcatalog", selectedApprovedRequest.id);
      const borrowDocSnap = await getDoc(borrowDocRef);
      const borrowData = borrowDocSnap.exists() ? borrowDocSnap.data() : {};

      // Use the usageType from the borrowcatalog document or fallback to selectedApprovedRequest
      const usageTypeToLog = borrowData.usageType || selectedApprovedRequest.usageType || "N/A";

      await addDoc(collection(db, `accounts/${requestorAccountId}/historylog`), {
        action: "Released",
        userName: selectedApprovedRequest.userName,
        timestamp: serverTimestamp(),
        requestList: selectedApprovedRequest.requestList || [],
        program: selectedApprovedRequest.program,
        room: selectedApprovedRequest.room,
        dateRequired: selectedApprovedRequest.dateRequired,
        timeFrom: selectedApprovedRequest.timeFrom,
        timeTo: selectedApprovedRequest.timeTo,
        approvedBy: userName || "N/A",
        usageType: usageTypeToLog,
        course: selectedApprovedRequest.course || "N/A",
        courseDescription: selectedApprovedRequest.courseDescription || "N/A",
        reason: selectedApprovedRequest.reason || "N/A",
      });

      // 3.1 Remove previous "Request Approved" entries for the same request in historylog
      const approvedHistoryQuery = query(
        collection(db, `accounts/${requestorAccountId}/historylog`),
        where("action", "==", "Request Approved")
      );

      const approvedHistorySnapshot = await getDocs(approvedHistoryQuery);

      for (const docSnap of approvedHistorySnapshot.docs) {
        const docData = docSnap.data();

        const matches =
          docData.requestList?.[0]?.itemName === selectedApprovedRequest.requestList?.[0]?.itemName &&
          docData.program === selectedApprovedRequest.program &&
          docData.timeFrom === selectedApprovedRequest.timeFrom &&
          docData.timeTo === selectedApprovedRequest.timeTo;

        if (matches) {
          await deleteDoc(doc(db, `accounts/${requestorAccountId}/historylog/${docSnap.id}`));
        }
      }

      // 3.2 Remove previous "Deployed" entries for the same request in historylog
      const deployedHistoryQuery = query(
        collection(db, `accounts/${requestorAccountId}/historylog`),
        where("action", "==", "Deployed")
      );

      const deployedHistorySnapshot = await getDocs(deployedHistoryQuery);

      for (const docSnap of deployedHistorySnapshot.docs) {
        const docData = docSnap.data();

        const matches =
          docData.requestList?.[0]?.itemName === selectedApprovedRequest.requestList?.[0]?.itemName &&
          docData.program === selectedApprovedRequest.program &&
          docData.timeFrom === selectedApprovedRequest.timeFrom &&
          docData.timeTo === selectedApprovedRequest.timeTo;

        if (matches) {
          await deleteDoc(doc(db, `accounts/${requestorAccountId}/historylog/${docSnap.id}`));
        }
      }

      // 5. Update userrequestlog
      const userRequestQuery = query(
        collection(db, `accounts/${requestorAccountId}/userrequestlog`)
      );

      const userRequestSnapshot = await getDocs(userRequestQuery);

      for (const docSnap of userRequestSnapshot.docs) {
        const docData = docSnap.data();

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

          if (matches) {
            await updateDoc(
              doc(db, `accounts/${requestorAccountId}/userrequestlog/${docSnap.id}`),
              {
                status: "Released",
              }
            );
          }
        });
      }

      showNotification("Requested Item successfully released!");
      setIsApprovedModalVisible(false);
      setSelectedApprovedRequest(null);
      
    } catch (err) {
      console.error("Error releasing request:", err);
      alert("Release failed.");
    } finally {
      setReleaseLoading(false);
    }
  };

  return (
  <>
    <Modal
      open={isApprovedModalVisible}
      onCancel={() => {
        setIsApprovedModalVisible(false);
        setSelectedApprovedRequest(null);
      }}
      width={1000}
      zIndex={1024}
      footer={
        selectedApprovedRequest?.status === "Returned" ? (
          <Button type="primary" onClick={handleApprove} loading={approveLoading} disabled={releaseLoading || deployLoading}>
            Approve
          </Button>
        ) : selectedApprovedRequest?.status === "For Release" ? (
          <Button type="primary" onClick={handleRelease} loading={releaseLoading} disabled={approveLoading || deployLoading}>
            Release
          </Button>
        ) : null
      }
    >
      {selectedApprovedRequest && (
        <div style={{ padding: "20px", paddingTop: 60 }}>
          
        <div style={{position: 'absolute', left: 0, top: 0, right: 0, backgroundColor: '#165a72', height: 60, borderTopRightRadius: 8, borderTopLeftRadius: 8, alignItems: 'center', display: 'flex', paddingLeft: 20, gap: 10}}>
            <FileDoneOutlined style={{color: 'white', fontSize: 25}}/>
            <h1 style={{margin:0, color: 'white', fontSize: 23}}>Requisition Slip</h1>
        </div>

          <Descriptions 
  bordered 
  size="small" 
  column={2} 
  title="Approved Request Details"
>
  <Descriptions.Item label="Requester">
    {selectedApprovedRequest.userName || "N/A"}
  </Descriptions.Item>

  <Descriptions.Item label="Request Date">
    {selectedApprovedRequest?.timestamp
      ? formatDate(selectedApprovedRequest.timestamp)
      : "N/A"}
  </Descriptions.Item>

  <Descriptions.Item label="Required Date">
    {selectedApprovedRequest.dateRequired || "N/A"}
  </Descriptions.Item>

  <Descriptions.Item label="Time Needed">
    {selectedApprovedRequest.timeFrom || "N/A"} - {selectedApprovedRequest.timeTo || "N/A"}
  </Descriptions.Item>

  <Descriptions.Item label="Room">
    {selectedApprovedRequest.room || "N/A"}
  </Descriptions.Item>

  <Descriptions.Item label="Course Code">
    {selectedApprovedRequest.course || "N/A"}
  </Descriptions.Item>

  <Descriptions.Item label="Course Description" span={2}>
    {selectedApprovedRequest.courseDescription || "N/A"}
  </Descriptions.Item>

  <Descriptions.Item label="Program" span={2}>
    {selectedApprovedRequest.program || "N/A"}
  </Descriptions.Item>

    <Descriptions.Item label="Note" span={2}>
    <p style={{ fontSize: "12px", margin: 0 }}>
      {selectedApprovedRequest.reason || "N/A"}
    </p>
  </Descriptions.Item>
</Descriptions>

          <Title level={5} style={{ marginTop: 20 }}>Requested Items:</Title>

<table style={{ width: "100%", borderCollapse: "collapse" }}>
  <thead>
    <tr>
      <th style={{ border: "1px solid #ddd", padding: "8px", backgroundColor: '#e9ecee' }}>Item ID</th>
      <th style={{ border: "1px solid #ddd", padding: "8px", backgroundColor: '#e9ecee'  }}>Item Name</th>
      <th style={{ border: "1px solid #ddd", padding: "8px", backgroundColor: '#e9ecee'  }}>Item Description</th>
      <th style={{ border: "1px solid #ddd", padding: "8px", backgroundColor: '#e9ecee'  }}>Category</th>
      <th style={{ border: "1px solid #ddd", padding: "8px", backgroundColor: '#e9ecee'  }}>Quantity</th>
      <th style={{ border: "1px solid #ddd", padding: "8px", backgroundColor: '#e9ecee'  }}>Condition Summary</th>
    </tr>
  </thead>
  <tbody>
    {requestList.map((item, index) => (
      <tr key={item.itemIdFromInventory || `item-${index}`}>
        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
          {item.itemIdFromInventory || item.itemId || "N/A"}
        </td>
        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
          {item.itemName || "N/A"}
        </td>
        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
          {item.itemDescription || item.itemDetails || "N/A"}
        </td>
        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
          {item.category || "N/A"}
        </td>
        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
          {item.quantity || "N/A"}
        </td>
        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
          {getConditionSummary(item.conditions)}
        </td>
      </tr>
    ))}
  </tbody>
</table>

          {selectedApprovedRequest?.status === "Borrowed" && (
            <Button style={{marginTop: 20}} type="primary" danger onClick={handleDeploy} loading={deployLoading} disabled={approveLoading || releaseLoading}>
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
