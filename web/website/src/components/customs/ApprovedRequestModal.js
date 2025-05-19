import React from "react";
import { Modal, Row, Col, Typography, Table, Button } from "antd";
import { doc, updateDoc, collection, addDoc, serverTimestamp, query, where, getDoc, getDocs  } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig"; 
import { getAuth } from "firebase/auth";
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
  console.log("requestList in Modal:", requestList);

  if (selectedApprovedRequest) {
    console.log("Raw timestamp value:", selectedApprovedRequest.timestamp);
  }

  // Define your own columns for the modal
  const approvedRequestColumns = [
    {
      title: "Item Name",
      dataIndex: "itemName",
      key: "itemName",
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
    {
      title: "Condition",
      dataIndex: "condition",
      key: "condition",
    },
  ];

  // const handleApprove = async () => {
  //   try {
  //     const requisitionId = selectedApprovedRequest?.id;
  //     if (!requisitionId) {
  //       console.error("Missing requisition ID");
  //       return;
  //     }
  
  //     // Get current authenticated user
  //     const auth = getAuth();
  //     const currentUser = auth.currentUser;
  //     const userEmail = currentUser?.email;
  
  //     let approverName = "Unknown";
  //     if (userEmail) {
  //       const userQuery = query(collection(db, "accounts"), where("email", "==", userEmail));
  //       const userSnapshot = await getDocs(userQuery);
        
  //       if (!userSnapshot.empty) {
  //         approverName = userSnapshot.docs[0].data().name || "Unknown";
  //       }
  //     }
  
  //     // ✅ Loop through each returned item and update inventory quantity
  //     for (const item of selectedApprovedRequest.requestList || []) {
  //       const inventoryId = item.selectedItemId || item.selectedItem?.value;
  //       const returnedQty = Number(item.quantity);
  
  //       if (inventoryId && !isNaN(returnedQty)) {
  //         const inventoryDocRef = doc(db, "inventory", inventoryId);
  //         const inventoryDocSnap = await getDoc(inventoryDocRef);
  
  //         if (inventoryDocSnap.exists()) {
  //           const currentQty = inventoryDocSnap.data().quantity || 0;
  //           await updateDoc(inventoryDocRef, {
  //             quantity: currentQty + returnedQty,
  //           });

  //         } else {
  //           console.warn(`Inventory item not found for ID: ${inventoryId}`);
  //         }
  //       }
  //     }
  
  //     // ✅ Update borrowcatalog status
  //     const borrowDocRef = doc(db, "borrowcatalog", requisitionId);
  //     await updateDoc(borrowDocRef, { status: "Approved" });
  
  //     // ✅ Log request in requestlog
  //     const requestLogRef = collection(db, "requestlog");
  //     await addDoc(requestLogRef, {
  //       requisitionId,
  //       userName: selectedApprovedRequest.userName || "N/A",
  //       timestamp: serverTimestamp(),
  //       dateRequired: selectedApprovedRequest.dateRequired || "N/A",
  //       timeFrom: selectedApprovedRequest.timeFrom || "N/A",
  //       timeTo: selectedApprovedRequest.timeTo || "N/A",
  //       reason: selectedApprovedRequest.reason || "N/A",
  //       room: selectedApprovedRequest.room || "N/A",
  //       course: selectedApprovedRequest.course || "N/A",
  //       courseDescription: selectedApprovedRequest.courseDescription || "N/A",
  //       program: selectedApprovedRequest.program || "N/A",
  //       status: "Returned",
  //       requestList: selectedApprovedRequest.requestList || [],
  //       approvedBy: approverName,
  //     });
  
  //     console.log("Return approved and inventory updated.");
  //     setIsApprovedModalVisible(false);
  //     setSelectedApprovedRequest(null);
  
  //   } catch (error) {
  //     console.error("Error approving return and updating inventory:", error);
  //   }
  // };  


  const handleDeploy = async () => {
  try {
    const docRef = doc(db, "borrowcatalog", selectedApprovedRequest.id);
    await updateDoc(docRef, {
      status: "Deployed",
    });

    // Optional: feedback or close modal
    alert("Request successfully deployed!");
    setIsApprovedModalVisible(false);
  } catch (error) {
    console.error("Error updating document:", error);
    alert("Failed to deploy request.");
  }
};

  const handleApprove = async () => {
    try {
      const requisitionId = selectedApprovedRequest?.id;
      if (!requisitionId) {
        console.error("Missing requisition ID");
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
        const labRoomId = item.labRoom; // Comes from filteredMergedData

        if (inventoryId && !isNaN(returnedQty)) {
          const inventoryDocRef = doc(db, "inventory", inventoryId);
          const inventoryDocSnap = await getDoc(inventoryDocRef);

          if (inventoryDocSnap.exists()) {
            const inventoryData = inventoryDocSnap.data();
            const currentInventoryQty = Number(inventoryData.quantity || 0);
            const newInventoryQty = currentInventoryQty + returnedQty;

            // Update inventory quantity
            await updateDoc(inventoryDocRef, {
              quantity: newInventoryQty,
            });
            console.log(`✅ Inventory updated: ${currentInventoryQty} → ${newInventoryQty}`);

            // Update labRoom item quantity
            const itemId = inventoryData.itemId;
            if (labRoomId && itemId) {
              const labRoomItemRef = doc(db, "labRoom", labRoomId, "items", itemId);
              const labRoomItemSnap = await getDoc(labRoomItemRef);

              if (labRoomItemSnap.exists()) {
                const currentLabQty = Number(labRoomItemSnap.data().quantity || 0);
                const newLabQty = currentLabQty + returnedQty;

                await updateDoc(labRoomItemRef, {
                  quantity: newLabQty,
                });

                console.log(`🏫 LabRoom item updated: ${currentLabQty} → ${newLabQty} for itemId ${itemId} in labRoom ${labRoomId}`);
              } else {
                console.warn(`⚠️ LabRoom item not found for itemId ${itemId} in labRoom ${labRoomId}`);
              }
            } else {
              console.warn(`⚠️ Missing labRoomId or itemId for inventoryId ${inventoryId}`);
            }

          } else {
            console.warn(`Inventory item not found for ID: ${inventoryId}`);
          }
        }
      }
  
      // ✅ Update borrowcatalog status
      const borrowDocRef = doc(db, "borrowcatalog", requisitionId);
      await updateDoc(borrowDocRef, { status: "Return Approved" });
  
      // ✅ Log request in requestlog
      const requestLogRef = collection(db, "requestlog");
      await addDoc(requestLogRef, {
        requisitionId,
        userName: selectedApprovedRequest.userName || "N/A",
        timestamp: serverTimestamp(),
        dateRequired: selectedApprovedRequest.dateRequired || "N/A",
        timeFrom: selectedApprovedRequest.timeFrom || "N/A",
        timeTo: selectedApprovedRequest.timeTo || "N/A",
        reason: selectedApprovedRequest.reason || "N/A",
        room: selectedApprovedRequest.room || "N/A",
        course: selectedApprovedRequest.course || "N/A",
        courseDescription: selectedApprovedRequest.courseDescription || "N/A",
        program: selectedApprovedRequest.program || "N/A",
        status: "Returned",
        requestList: selectedApprovedRequest.requestList || [],
        approvedBy: approverName,
      });
  
      console.log("Return approved and inventory updated.");
      setIsApprovedModalVisible(false);
      setSelectedApprovedRequest(null);
  
    } catch (error) {
      console.error("Error approving return and updating inventory:", error);
    }
  };  

  return (
    <Modal
      title={
        <div style={{ background: "#389e0d", padding: "12px", color: "#fff" }}>
          <Text strong>✅ Approved Request Details</Text>
          <span style={{ float: "right", fontStyle: "italic" }}>
            Requisition ID: {selectedApprovedRequest?.id || "N/A"}
          </span>
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
  );
};

export default ApprovedRequestModal;
