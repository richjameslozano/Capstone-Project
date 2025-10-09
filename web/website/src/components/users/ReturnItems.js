import React, { useState, useEffect } from "react";
import { Layout, Table, Button, Modal, Typography, Row, Col, Select, InputNumber, Descriptions } from "antd";
import { db } from "../../backend/firebase/FirebaseConfig";
import { collection, getDocs, doc, setDoc, updateDoc, getDoc, serverTimestamp, deleteDoc, onSnapshot, query, where } from "firebase/firestore";
import "../styles/adminStyle/RequestLog.css";
import "../styles/usersStyle/ReturnItems.css";
import { RollbackOutlined} from "@ant-design/icons";
const { Content } = Layout;
const { Text } = Typography;
const { Option } = Select;

const ReturnItems = () => {
  const [filterStatus, setFilterStatus] = useState("Deployed");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [inventoryData, setInventoryData] = useState({});
  const [returnQuantities, setReturnQuantities] = useState({});
  const [itemConditions, setItemConditions] = useState({});
  const [itemUnitConditions, setItemUnitConditions] = useState({});
  const [glasswareIssues, setGlasswareIssues] = useState({});
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [currentIssueItem, setCurrentIssueItem] = useState(null);
  const [issueQuantities, setIssueQuantities] = useState({
    Defect: 0,
    Damage: 0,
    Lost: 0,
  });

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {

      return;
    }

    const userRequestLogRef = collection(db, `accounts/${userId}/userrequestlog`);

    const unsubscribe = onSnapshot(userRequestLogRef, (querySnapshot) => {
      try {
        const logs = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          const rawTimestamp = data.rawTimestamp;
          const timestamp = data.timestamp;

          let parsedRawTimestamp = "N/A";
          let parsedTimestamp = "N/A";

          if (rawTimestamp && typeof rawTimestamp.toDate === "function") {
            try {
              parsedRawTimestamp = rawTimestamp.toDate().toLocaleString("en-PH", {
                timeZone: "Asia/Manila",
              });

            } catch (e) {
       
            }
          }

          if (timestamp && typeof timestamp.toDate === "function") {
            try {
              parsedTimestamp = timestamp.toDate().toLocaleString("en-PH", {
                timeZone: "Asia/Manila",
              });

            } catch (e) {
 
            }
          }

        const formatDateToWords = (dateString) => {
          if (!dateString) return "N/A";
          const date = new Date(dateString);
          return new Intl.DateTimeFormat("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(date);
        };



        return {
          id: doc.id,
          date: formatDateToWords(data.dateRequired) ?? 'N/A',
          status: data.status ?? "Pending",
          requestor: data.userName ?? "Unknown",
          requestedItems: data.requestList
            ? data.requestList.map((item) => item.itemName).join(", ")
            : "No items",
          requisitionId: doc.id,
          reason: data.reason ?? "No reason provided",
          department: data.requestList?.[0]?.department ?? "N/A",
          approvedBy: data.approvedBy ?? "N/A",
          rawTimestamp: rawTimestamp ?? null,
          processDate: parsedRawTimestamp,
          timestamp: parsedTimestamp,
          raw: data,
        };

        });

        // Sort by rawTimestamp (Process Date)
        logs.sort((a, b) => {
          const timeA = a.rawTimestamp?.toMillis?.() ?? 0;
          const timeB = b.rawTimestamp?.toMillis?.() ?? 0;
          return timeB - timeA;
        });


        setHistoryData(logs);

      } catch (error) {

      }

    }, (error) => {

    });

    return () => unsubscribe(); // Clean up the listener on unmount
  }, []);

  const columns = [
    {
      title: "Process Date",
      dataIndex: "processDate",
      key: "processDate",
    },
        {
      title: "Date of Usage", 
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Text style={{ color: status === "Approved" ? "green" : "#8b8989", fontWeight: "bold" }}>
          {status}
        </Text>
      ),
    },
    {
      title: "Requestor",
      dataIndex: "requestor",
      key: "requestor",
    },
    {
      title: "Approved By",
      dataIndex: "approvedBy",
      key: "approvedBy",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <a href="#" className="view-details" onClick={() => handleViewDetails(record)}>
          View Details
        </a>
      ),
    },
  ];

  const handleViewDetails = async (record) => {
    setSelectedRequest(record);
    setModalVisible(true);

    // Initialize itemConditions for equipment items
    const initialItemConditions = {};
    if (record.raw?.requestList) {
      record.raw.requestList.forEach((item) => {
        if (item.category === "Equipment") {
          for (let i = 0; i < item.quantity; i++) {
            const conditionKey = `${item.itemIdFromInventory}-${i}`;
            initialItemConditions[conditionKey] = "Good"; // Default to "Good"
          }
        }
      });
    }
    setItemConditions(initialItemConditions);
    
    const inventoryMap = {};
    const requestItems = record.raw?.requestList || [];

    try {
      const inventoryRef = collection(db, "inventory");
      const inventorySnapshot = await getDocs(inventoryRef);
      inventorySnapshot.forEach((doc) => {
        const inv = doc.data();
        requestItems.forEach((item) => {
          if (inv.id === item.itemIdFromInventory) {
            inventoryMap[item.itemIdFromInventory] = inv;
          }
        });
      });
    } catch (err) {

    }

    setInventoryData(inventoryMap);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedRequest(null);
    setReturnQuantities({});
    setItemConditions({});
    setItemUnitConditions({});
    setInventoryData({});
  };


  const handleReturn = async () => {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId || !selectedRequest) return;

    const timestamp = serverTimestamp();
    const currentDateString = new Date().toISOString();

    const fullReturnData = {
      accountId: userId,
      approvedBy: selectedRequest.raw?.approvedBy || "N/A",
      course: selectedRequest.raw?.course || selectedRequest.raw?.courseCode || "N/A",
      courseCode: selectedRequest.raw?.courseCode || selectedRequest.raw?.course || "N/A",
      courseDescription: selectedRequest.raw?.courseDescription || "N/A",
      dateRequired: selectedRequest.raw?.dateRequired || "N/A",
      program: selectedRequest.raw?.program || "N/A",
      reason: selectedRequest.raw?.reason || "No reason provided",
      room: selectedRequest.raw?.room || "N/A",
      timeFrom: selectedRequest.raw?.timeFrom || "N/A",
      timeTo: selectedRequest.raw?.timeTo || "N/A",
      timestamp: timestamp,
      userName: selectedRequest.raw?.userName || "N/A",
      requisitionId: selectedRequest.requisitionId,
      status: "Returned",
      usageType: selectedRequest.raw?.usageType || "N/A",
      requestList: (selectedRequest.raw?.requestList || []).map((item) => {
        
        // For equipment items, use individual QR code logic
        if (item.category === "Equipment") {
          
          const returnedConditions = itemUnitConditions[item.itemIdFromInventory] || [];
          const conditions = Array.from({ length: item.quantity }, (_, idx) =>
            returnedConditions[idx] || "Good"
          );

          const deployedQRCodes = selectedRequest.raw.deployedQRCodes || [];

          // Only process QR codes that have conditions set (meaning they were selected for return)
          const individualQRConditions = conditions
            .map((condition, index) => {
              // Only include QR codes that have a condition set (meaning they were selected for return)
              if (condition) {
                return {
                  qrCodeId: deployedQRCodes[index]?.id || `placeholder-${index}`,
                  individualItemId: deployedQRCodes[index]?.individualItemId || `${item.itemIdFromInventory}${String(index + 1).padStart(2, '0')}`,
                  condition: condition
                };
              }
              return null;
            })
            .filter(Boolean); // Remove null entries
          
          return {
            ...item,
            itemId: item.itemIdFromInventory,
            returnedQuantity: conditions.filter(c => c !== "Lost").length,
            conditions,
            individualQRConditions,
            scannedCount: 0,
            dateReturned: currentDateString,
          };
        } else {
          // For non-equipment items, use existing logic
          const returnedConditions = itemUnitConditions[item.itemIdFromInventory] || [];
          const conditions = Array.from({ length: item.quantity }, (_, idx) =>
            returnedConditions[idx] || "Good"
          );
          return {
            ...item,
            itemId: item.itemIdFromInventory,
            returnedQuantity: conditions.filter(c => c !== "Lost").length,
            conditions,
            scannedCount: 0,
            dateReturned: currentDateString,
          };
        }
      }),
    };

    // 🔧 Handle individual QR code returns for equipment items
    for (const item of selectedRequest.raw?.requestList || []) {
      if (item.category === "Equipment") {
        const returnedConditions = itemUnitConditions[item.itemIdFromInventory] || [];
        if (!returnedConditions.length) continue;
        
        // Create individualQRConditions for equipment items using actual deployedQRCodes
        const deployedQRCodes = selectedRequest.raw.deployedQRCodes || [];
        const individualQRConditions = returnedConditions.map((condition, index) => ({
          qrCodeId: deployedQRCodes[index]?.id || `placeholder-${index}`,
          individualItemId: deployedQRCodes[index]?.individualItemId || `${item.itemIdFromInventory}${String(index + 1).padStart(2, '0')}`,
          condition: condition
        }));
        
        try {
          const returnResponse = await fetch('https://webnuls.onrender.com/return-individual-qr-codes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              itemId: item.itemIdFromInventory,
              individualQRConditions: individualQRConditions,
              userId: userId,
              userName: selectedRequest.raw?.userName || "Unknown",
            }),
          });

          const returnData = await returnResponse.json();
          if (returnResponse.ok) {
            // Continue with regular logic - don't skip
          } else {
            console.error("❌ Failed to return individual QR codes (WEB):", returnData.error);
            alert(`Return Error: ${returnData.error || "Failed to return individual items"}`);
            return;
          }
        } catch (error) {
          console.error("❌ Error returning individual QR codes (WEB):", error);
          alert("Return Error: Failed to return individual items");
          return;
        }
      }
    }

    // Update inventory condition counts for non-equipment items
    for (const item of selectedRequest.raw?.requestList || []) {
      if (item.category === "Equipment") continue; // Skip equipment items as they're handled above
      
      const returnedConditions = itemUnitConditions[item.itemIdFromInventory] || [];
      if (!returnedConditions.length) continue;

      const inventoryDocRef = doc(db, "inventory", item.itemIdFromInventory);
      const inventoryDoc = await getDoc(inventoryDocRef);
      if (!inventoryDoc.exists()) continue;

      const inventoryData = inventoryDoc.data();
      const existingConditionCount = inventoryData.conditionCount || {
        Good: 0,
        Damage: 0,
        Defect: 0,
        Lost: 0,
      };

      const newCounts = { ...existingConditionCount };
      returnedConditions.forEach((condition) => {
        if (newCounts[condition] !== undefined) newCounts[condition]++;
      });

      await updateDoc(inventoryDocRef, { conditionCount: newCounts });
    }

    // Save returned data
    const returnedRef = doc(collection(db, "returnedItems"));
    const userReturnedRef = doc(collection(db, `accounts/${userId}/userreturneditems`));
    await setDoc(returnedRef, fullReturnData);
    await setDoc(userReturnedRef, fullReturnData);

    const borrowQuery = query(
      collection(db, "borrowcatalog"),
      where("userName", "==", selectedRequest.raw?.userName),
      where("dateRequired", "==", selectedRequest.raw?.dateRequired),
      where("room", "==", selectedRequest.raw?.room),
      where("timeFrom", "==", selectedRequest.raw?.timeFrom),
      where("timeTo", "==", selectedRequest.raw?.timeTo)
    );

    const querySnapshot = await getDocs(borrowQuery);
    if (!querySnapshot.empty) {
      const docToUpdate = querySnapshot.docs[0];
      const borrowDocRef = doc(db, "borrowcatalog", docToUpdate.id);
      await updateDoc(borrowDocRef, {
        requestList: fullReturnData.requestList,
        status: "Returned",
      });
    }

    // Delete from userrequestlog
    const userRequestLogRef = doc(
      db,
      `accounts/${userId}/userrequestlog/${selectedRequest.requisitionId}`
    );
    
    await deleteDoc(userRequestLogRef);

    // 🗑️ Remove previous "Deployed" entries for the same request in historylog
    const historyCollectionRef = collection(db, `accounts/${userId}/historylog`);
    const deployedHistoryQuery = query(
      historyCollectionRef,
      where("action", "==", "Deployed"),
      where("userName", "==", selectedRequest.raw?.userName),
      where("dateRequired", "==", selectedRequest.raw?.dateRequired),
      where("room", "==", selectedRequest.raw?.room),
      where("timeFrom", "==", selectedRequest.raw?.timeFrom),
      where("timeTo", "==", selectedRequest.raw?.timeTo)
    );

    const deployedHistorySnapshot = await getDocs(deployedHistoryQuery);
    for (const docSnap of deployedHistorySnapshot.docs) {
      await deleteDoc(doc(db, `accounts/${userId}/historylog`, docSnap.id));
    }

    // 📝 Add "Returned" to historylog
    const historyRef = doc(historyCollectionRef);
    await setDoc(historyRef, {
      ...fullReturnData,
      action: "Returned",
      date: currentDateString,
    });

    // 🗑️ Remove previous "Deployed" entries for the same request in activitylog
    const activityCollectionRef = collection(db, `accounts/${userId}/activitylog`);
    const deployedActivityQuery = query(
      activityCollectionRef,
      where("action", "==", "Deployed"),
      where("requisitionId", "==", selectedRequest.requisitionId)
    );
    const deployedActivitySnapshot = await getDocs(deployedActivityQuery);
    for (const docSnap of deployedActivitySnapshot.docs) {
      await deleteDoc(doc(db, `accounts/${userId}/activitylog`, docSnap.id));
    }

    // 📝 Add "Returned" to activitylog
    const activityRef = doc(activityCollectionRef);
    await setDoc(activityRef, {
      ...fullReturnData,
      action: "Returned",
      date: currentDateString,
    });

    closeModal();
  } catch (error) {
    console.error("Error handling return:", error);
  }
};

  
 const filteredData =
    filterStatus === "All"
      ? historyData
      : historyData.filter((item) => item.status === filterStatus);

  const { glasswareData, equipmentData } = selectedRequest?.raw?.requestList
    ? selectedRequest.raw.requestList.reduce(
        (acc, item) => {
          const isGlassware = item.category === "Glasswares";

          if (isGlassware) {
            acc.glasswareData.push({
              key: `${item.itemIdFromInventory}_grouped`,
              itemId: item.itemIdFromInventory,
              itemDescription: item.itemName,
              quantity: item.quantity,
              isGrouped: true,
              condition: item.condition,
            });
          } else {
            const equipmentUnits = Array.from({ length: item.quantity }, (_, idx) => ({
              key: `${item.itemIdFromInventory}_${idx + 1}`,
              itemId: item.itemIdFromInventory,
              itemDescription: item.itemName,
              unitIndex: idx + 1,
              isGrouped: false,
            }));

            acc.equipmentData.push(...equipmentUnits);
          }

          return acc;
        },
        { glasswareData: [], equipmentData: [] }
      )
    : { glasswareData: [], equipmentData: [] };

  useEffect(() => {
    if (glasswareData.length > 0) {
      const newQuantities = {};

      glasswareData.forEach((item) => {
        const key = `${item.itemId}_returnQty`;
        newQuantities[key] = item.quantity;
      });

      // Only update if values actually changed to avoid re-renders
      const isDifferent = Object.keys(newQuantities).some(
        (key) => returnQuantities[key] !== newQuantities[key]
      );

      if (isDifferent) {
        setReturnQuantities(newQuantities);
      }
    }
  }, [glasswareData]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout style={{backgroundColor: 'white'}}>
        <Content style={{padding: 16}}>
          <div style={{
            background: "linear-gradient(135deg, #0b2d39 0%, #165a72 100%)",
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "20px",
            boxShadow: "0 8px 32px rgba(11, 45, 57, 0.15)",
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px"
            }}>
              <div>
                <h1 style={{
                  color: "#ffffff",
                  fontSize: "28px",
                  fontWeight: "700",
                  margin: "0 0 8px 0",
                  textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)"
                }}>
                  Return Items
                </h1>
                <p style={{
                  color: "#a8d5e5",
                  fontSize: "16px",
                  margin: "0",
                  fontWeight: "500"
                }}>
                  All items borrowed from the stockroom are required to be returned after use. <br/>To proceed, please select the corresponding requisition by clicking 'View Details' and complete the return process.
                </p>
              </div>
            </div>
          </div>

    <div className="custom-table-container">
<Table
  className="return-table"
  columns={columns}
  dataSource={filteredData}
  rowKey={(row, index) => row.id || index} 
  onRow={(row) => ({
    onClick: () => console.log("Row clicked:"), 
  })}
  pagination={false} 
  bordered 
  locale={{ emptyText: "No Items to Return" }}
/>
</div>

        </Content>

        <Modal
          visible={modalVisible}
          onCancel={closeModal}
          zIndex={1012}
          footer={[
            <Button key="close" onClick={closeModal}>
              Back
            </Button>,

            selectedRequest?.status === "Deployed" && (
              <Button
                key="return"
                type="primary"
                onClick={() => {
                  const newItemUnitConditions = {};

                  for (const item of selectedRequest.raw?.requestList || []) {
                    const itemId = item.itemIdFromInventory;
                    
                     if (item.category === "Equipment") {
                       // For equipment items, use individual unit conditions
                       const conditions = Array.from({ length: item.quantity }, (_, idx) => 
                         itemConditions[`${itemId}-${idx}`] || "Good"
                       );
                       newItemUnitConditions[itemId] = conditions;
                       
                    } else {
                      // For non-equipment items, use the existing glassware issues logic
                      const issueKey = `${itemId}_issues`;
                      const issues = glasswareIssues[issueKey] || { Defect: 0, Damage: 0, Lost: 0 };

                      const totalIssues = Object.entries(issues).flatMap(([key, count]) =>
                        Array(count).fill(key)
                      );

                      const remainingQty = item.quantity - totalIssues.length;
                      const fullConditions = [...totalIssues, ...Array(remainingQty).fill("Good")];

                      newItemUnitConditions[itemId] = fullConditions;
                    }
                  }

                  setItemUnitConditions(newItemUnitConditions); // <-- This updates the required state
                  handleReturn(); // <-- No changes needed inside handleReturn
                }}
              >
                Return
              </Button>
            ),
          ]}
          width={800}
        >
          {selectedRequest && selectedRequest.raw && (
            <div style={{paddingTop:60}}>
                        <div
            className="return-modal-header" style={{backgroundColor: '#2092d4ff', position: 'absolute', top: 0, left: 0, borderRadius: '5px 5px 0 0', height: 60, width: '100%', display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 20}}
          >
            <RollbackOutlined style={{color: 'white', fontSize: 25}}/>
            <strong style={{ fontSize: "20px", color: "white" }}>Requisition Slip - For Return</strong>
          </div>

          
          <Descriptions
            bordered
            size="small"
            column={2} 
            style={{ marginTop: 10 }}
          >
            {/* Row 1 */}
            <Descriptions.Item label="Name" span={2}>
              {selectedRequest.raw?.userName}
            </Descriptions.Item>

            {/* Row 2 */}
            <Descriptions.Item label="Request Date">
              {selectedRequest.timestamp}
            </Descriptions.Item>
            <Descriptions.Item label="Required Date">
              {selectedRequest.raw?.dateRequired}
            </Descriptions.Item>

            {/* Row 3 */}
            <Descriptions.Item label="Requested Items" span={2}>
              <Text style={{ color: "green" }}>{selectedRequest.status}</Text>
            </Descriptions.Item>
          </Descriptions>

              <>
              {glasswareData.length > 0 && (
                <>
                  <Typography.Title level={4}>Glasswares</Typography.Title>
                  <Table
                    dataSource={glasswareData}
                    columns={[
                      {
                        title: "Item ID",
                        dataIndex: "itemId",
                        key: "itemId",
                      },
                      {
                        title: "Item Description",
                        dataIndex: "itemDescription",
                        key: "itemDescription",
                      },
                      {
                        title: "QUANTITY",
                        key: "unit",
                        render: (_, record) => `${record.quantity}`,
                      },
                      {
                        title: "Return Qty",
                        key: "returnQty",
                        render: (_, record) => {
                          const baseKey = `${record.itemId}_${selectedRequest.requisitionId}`;
                          const returnKey = `${baseKey}_returnQty`;
                          const issueKey = `${baseKey}_issues`;

                          const issues = glasswareIssues[issueKey] || { Defect: 0, Damage: 0, Lost: 0 };
                          const totalIssues = Object.values(issues).reduce((sum, val) => sum + (val || 0), 0);
                          const issuedQty = record.quantity || 0;
                          const maxReturnable = Math.max(0, issuedQty - totalIssues);

                          // 🔥 Pre-fill returnQty if not already set
                          if (returnQuantities[returnKey] === undefined) {
                            setReturnQuantities((prev) => ({
                              ...prev,
                              [returnKey]: issuedQty,
                            }));
                          }

                          return (
                            <InputNumber
                              min={0}
                              max={maxReturnable}
                              value={returnQuantities[returnKey] ?? issuedQty}
                              disabled={selectedRequest.status === "Approved"} // ✅ disable when approved
                              onChange={(value) => {
                                setReturnQuantities((prev) => ({
                                  ...prev,
                                  [returnKey]: value,
                                }));
                              }}
                            />
                          );
                        },
                      },
                      {
                        title: "Issue?",
                        key: "hasIssue",
                        render: (_, record) => {
                          if (selectedRequest.status !== "Deployed") {
                            return null; // hide checkbox if status is not "Deployed"
                          }

                          const baseKey = `${record.itemId}_${selectedRequest.requisitionId}`;
                          const checkboxKey = `${baseKey}_issue`;

                          return (
                            <input
                              type="checkbox"
                              checked={glasswareIssues[checkboxKey] || false}
                              onChange={(e) => {
                                const { checked } = e.target;

                                setGlasswareIssues((prev) => ({
                                  ...prev,
                                  [checkboxKey]: checked,
                                }));

                                if (checked) {
                                  setCurrentIssueItem(record);
                                  setIssueQuantities({ Defect: 0, Damage: 0, Lost: 0 });
                                  setIssueModalVisible(true);
                                }
                              }}
                            />
                          );
                        },
                      }
                    ]}
                    pagination={false}
                  />
                </>
              )}

              </>

              <Row gutter={[16, 16]} style={{ marginTop: 10 }}>
                <Col span={12}>
                  <Text strong>Reason:</Text> {selectedRequest.reason}
                </Col>

                <Col span={12} style={{ textAlign: "right" }}>
                  <Text strong>Approved By:</Text> {selectedRequest.approvedBy ?? "N/A"}
                </Col>
              </Row>

              {/* Individual Unit Condition Selection for Equipment Items */}
              {selectedRequest.raw?.requestList?.some(item => item.category === "Equipment") && (
                <div style={{ marginTop: 20 }}>
                  <h3 style={{ marginBottom: 15, color: "#1890ff" }}>Equipment Items - Individual Unit Conditions</h3>
                  <Table
                    size="small"
                    bordered
                    pagination={false}
                    dataSource={selectedRequest.raw.requestList
                      .filter(item => item.category === "Equipment")
                      .flatMap((item, itemIndex) => {
                        // Use deployedQRCodes from document level if available, otherwise create placeholder array
                        const deployedQRCodes = selectedRequest.raw.deployedQRCodes || [];
                        const quantityArray = deployedQRCodes.length > 0 
                          ? deployedQRCodes 
                          : Array.from({ length: item.quantity }, (_, i) => ({
                              id: `placeholder-${i}`,
                              individualItemId: `${item.itemIdFromInventory}${String(i + 1).padStart(2, '0')}`,
                              itemName: `${item.itemName} #${i + 1}`,
                              unitNumber: i + 1
                            }));

                        return quantityArray.map((qrCode, unitIndex) => ({
                          key: `${item.itemIdFromInventory}-${unitIndex}`,
                          itemName: qrCode.itemName,
                          unitId: qrCode.individualItemId,
                          condition: itemConditions[`${item.itemIdFromInventory}-${unitIndex}`] || "Good",
                          itemId: item.itemIdFromInventory,
                          unitIndex: unitIndex,
                          itemIndex: itemIndex
                        }));
                      })}
                    columns={[
                      {
                        title: "Item Name",
                        dataIndex: "itemName",
                        key: "itemName",
                        width: 200,
                      },
                      {
                        title: "Unit ID",
                        dataIndex: "unitId",
                        key: "unitId",
                        width: 120,
                      },
                      {
                        title: "Condition",
                        key: "condition",
                        width: 150,
                        render: (_, record) => {
                          const conditionKey = `${record.itemId}-${record.unitIndex}`;
                          const currentValue = itemConditions[conditionKey] || "Good";
                          const isDisabled = selectedRequest.status === "Approved";

                          return (
                            <Select
                              value={currentValue}
                              onChange={(value) => {

                                setItemConditions((prev) => {
                                  const newState = {
                                    ...prev,
                                    [conditionKey]: value,
                                  };

                                  return newState;
                                });

                                // Update itemUnitConditions for this specific item
                                setItemUnitConditions((prev) => {
                                  const itemConditions = prev[record.itemId] || Array(selectedRequest.raw.requestList[record.itemIndex].quantity).fill("Good");
                                  const newConditions = [...itemConditions];
                                  newConditions[record.unitIndex] = value;
                                  
                                  const newState = {
                                    ...prev,
                                    [record.itemId]: newConditions,
                                  };

                                  return newState;
                                });
                              }}
                              disabled={isDisabled}
                              style={{ width: "100%" }}
                            >
                              <Option value="Good">Good</Option>
                              <Option value="Defect">Defect</Option>
                              <Option value="Damage">Damage</Option>
                              <Option value="Lost">Lost</Option>
                            </Select>
                          );
                        },
                      },
                    ]}
                  />
                </div>
              )}
            </div>
          )}
        </Modal>

        <Modal
          title={`Specify issues for: ${currentIssueItem?.itemDescription || ""}`}
          visible={issueModalVisible}
          zIndex={1030}
          onCancel={() => {
            // Uncheck the checkbox when cancel is clicked
            if (currentIssueItem && selectedRequest) {
              const baseKey = `${currentIssueItem.itemId}_${selectedRequest.requisitionId}`;
              const checkboxKey = `${baseKey}_issue`;
              
              setGlasswareIssues((prev) => ({
                ...prev,
                [checkboxKey]: false,
              }));
            }
            setIssueModalVisible(false);
          }}
          onOk={() => {
            if (!currentIssueItem || !selectedRequest) return;

            const baseKey = `${currentIssueItem.itemId}_${selectedRequest.requisitionId}`;
            const issueKey = `${baseKey}_issues`;
            const returnKey = `${baseKey}_returnQty`;

            // Total issues
            const totalIssues = Object.values(issueQuantities).reduce(
              (sum, val) => sum + (val || 0),
              0
            );

            const issuedQty = currentIssueItem.quantity || 0;
            const goodQty = Math.max(issuedQty - totalIssues, 0);

            // Save issue quantities
            setGlasswareIssues((prev) => ({
              ...prev,
              [issueKey]: { ...issueQuantities },
            }));

            // Update return quantity
            setReturnQuantities((prev) => ({
              ...prev,
              [returnKey]: goodQty,
            }));

            // Create itemUnitConditions: "Good", "Defect", "Damage", "Lost"
            const conditionArray = [];

            for (let i = 0; i < goodQty; i++) conditionArray.push("Good");

            Object.entries(issueQuantities).forEach(([type, count]) => {
              for (let i = 0; i < (count || 0); i++) {
                conditionArray.push(type);
              }
            });

            setItemUnitConditions((prev) => ({
              ...prev,
              [currentIssueItem.itemId]: conditionArray,
            }));

            setIssueModalVisible(false);
          }}
        >
          {["Defect", "Damage", "Lost"].map((type) => (
            <Row key={type} style={{ marginBottom: 10 }} align="middle">
              <Col span={8}>
                <Text>{type}:</Text>
              </Col>
              <Col span={16}>
                <InputNumber
                  min={0}
                  value={issueQuantities[type] || 0}
                  onChange={(value) =>
                    setIssueQuantities((prev) => ({
                      ...prev,
                      [type]: value,
                    }))
                  }
                />
              </Col>
            </Row>
          ))}
        </Modal>
      </Layout>
    </Layout>
  );
};

export default ReturnItems;