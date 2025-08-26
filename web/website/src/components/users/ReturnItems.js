


// VERSION 2
import React, { useState, useEffect } from "react";
import { Layout, Table, Button, Modal, Typography, Row, Col, Select, InputNumber, Descriptions } from "antd";
import { db } from "../../backend/firebase/FirebaseConfig";
import { collection, getDocs, doc, setDoc, updateDoc, getDoc, serverTimestamp, deleteDoc, onSnapshot, query, where } from "firebase/firestore";
import Sidebar from "../Sidebar";
import AppHeader from "../Header";
import "../styles/adminStyle/RequestLog.css";
import "../styles/usersStyle/ReturnItems.css";
import {CheckCircleOutlined, ClockCircleOutlined, RollbackOutlined} from "@ant-design/icons";
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
      title: "",
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
    setInventoryData({});
  };



  const buildItemUnitConditions = () => {
    const newItemUnitConditions = {};

    for (const item of selectedRequest.raw?.requestList || []) {
      const itemId = item.itemIdFromInventory;
      const issueKey = `${itemId}_issues`;
      const issues = glasswareIssues[issueKey] || { Defect: 0, Damage: 0, Lost: 0 };

      const totalIssues = Object.entries(issues).flatMap(([key, count]) =>
        Array(count).fill(key)
      );

      const remainingQty = item.quantity - totalIssues.length;
      const fullConditions = [...totalIssues, ...Array(remainingQty).fill("Good")];

      newItemUnitConditions[itemId] = fullConditions;
    }

    return newItemUnitConditions;
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
      courseCode: selectedRequest.raw?.courseCode || "N/A",
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
      requestList: (selectedRequest.raw?.requestList || []).map((item) => {
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
      }),
    };

    // Update inventory condition counts
    for (const item of selectedRequest.raw?.requestList || []) {
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

  // const unitLevelData = selectedRequest?.raw?.requestList
  //   ? selectedRequest.raw.requestList.flatMap((item) =>
  //       Array.from({ length: item.quantity }, (_, idx) => ({
  //         key: `${item.itemIdFromInventory}_${idx}`,
  //         itemId: item.itemIdFromInventory,
  //         itemDescription: item.itemName,
  //         unitIndex: idx + 1,
  //         // volume: item.volume || (typeof item.quantity === 'object' ? item.quantity.volume : undefined),
  //       }))
  //     )
  // : [];

  const unitLevelData = selectedRequest?.raw?.requestList
    ? selectedRequest.raw.requestList.flatMap((item) => {
        const isGrouped = item.category === "Glasswares";

        // For Glasswares: 1 row (grouped)
        if (isGrouped) {
          return {
            key: `${item.itemIdFromInventory}_grouped`,
            itemId: item.itemIdFromInventory,
            itemDescription: item.itemName,
            quantity: item.quantity,
            isGrouped: true,
            condition: item.condition,
          };
        }

        // For Equipment: split by unit
        return Array.from({ length: item.quantity }, (_, idx) => ({
          key: `${item.itemIdFromInventory}_${idx + 1}`,
          itemId: item.itemIdFromInventory,
          itemDescription: item.itemName,
          unitIndex: idx + 1,
          isGrouped: false,
        }));
      })
    : [];

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
        <Content style={{ margin: "20px"}}>
          <div style={{ marginBottom: 16 }}>
            {/* <Button
              type={filterStatus === "All" ? "primary" : "default"}
              onClick={() => setFilterStatus("All")}
              style={{ marginRight: 8 }}
            >
              All
            </Button>

            <Button
            className="approved-status-button"
              type={filterStatus === "Approved" ? "primary" : "default"}
              onClick={() => setFilterStatus("Approved")}
              style={{ marginRight: 8 }}
            >
              Approved
            </Button> */}
{/* 
            <Button
              className="print-all-button"
              type={filterStatus === "Deployed" ? "primary" : "default"}
              onClick={() => setFilterStatus("Deployed")}
            >
              Deployed
            </Button> */}
          </div>

                <div style={{ display: "flex", gap: 10, alignItems: "flex-start"}}>
        <RollbackOutlined style={{ fontSize: 28, color: "#37c225ff", paddingTop: 10 }} />
        <div>
          <h1 style={{ color: "#37c225ff", margin: 0, padding: 0, textDecoration: "none" }}>
            Return Items
          </h1>
          <p style={{marginTop: 10}}>All items borrowed from the stockroom are required to be returned after use. To proceed, please select the corresponding requisition by clicking 'View Details' and complete the return process.</p>
        </div>
      </div>

    <div className="custom-table-container">
  <table className="custom-table">
    <thead>
      <tr>
        {columns.map((col) => (
          <th key={col.key || col.dataIndex}>{col.title}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {filteredData.map((row, rowIndex) => (
        <tr
          key={row.id || rowIndex}
          onClick={() => console.log("Row clicked:", row)}
        >
          {columns.map((col) => (
            <td key={col.key || col.dataIndex}>
              {col.render
                ? col.render(row[col.dataIndex], row, rowIndex)
                : row[col.dataIndex]}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
</div>



          {/* <Table
            className="request-log-table"
            dataSource={filteredData}
            columns={columns}
            rowKey="id"
            bordered
            pagination={{ pageSize: 10 }}
          /> */}
        </Content>

        <Modal
          visible={modalVisible}
          onCancel={closeModal}
          zIndex={1012}
          footer={[
            <Button key="close" onClick={closeModal}>
              Back
            </Button>,
            
            // selectedRequest?.status === "Deployed" && (
            //   <Button key="return" type="primary" onClick={handleReturn}>
            //     Return
            //   </Button>
            // ),

            selectedRequest?.status === "Deployed" && (
              <Button
                key="return"
                type="primary"
                onClick={() => {
                  const newItemUnitConditions = {};

                  for (const item of selectedRequest.raw?.requestList || []) {
                    const itemId = item.itemIdFromInventory;
                    const issueKey = `${itemId}_issues`;
                    const issues = glasswareIssues[issueKey] || { Defect: 0, Damage: 0, Lost: 0 };

                    const totalIssues = Object.entries(issues).flatMap(([key, count]) =>
                      Array(count).fill(key)
                    );

                    const remainingQty = item.quantity - totalIssues.length;
                    const fullConditions = [...totalIssues, ...Array(remainingQty).fill("Good")];

                    newItemUnitConditions[itemId] = fullConditions;
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
            column={2} // two columns per row
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


              {/* <Table
                dataSource={unitLevelData}
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
                    title: "Unit",
                    key: "unitIndex",
                    render: (_, record) => `#${record.unitIndex}`,
                  },
                  {
                    title: "Condition",
                    key: "condition",
                    render: (_, record) => {
                      const key = `${record.itemId}_${record.unitIndex}`;
                      return (
                        <Select
                          value={itemConditions[key] || "Good"}
                          onChange={(value) => {
                            const key = `${record.itemId}_${record.unitIndex}`;
                            setItemConditions((prev) => ({
                              ...prev,
                              [key]: value,
                            }));

                            // Also update itemUnitConditions
                            setItemUnitConditions((prev) => {
                              const currentList = prev[record.itemId] || [];
                              const updatedList = [...currentList];
                              updatedList[record.unitIndex - 1] = value;
                              return {
                                ...prev,
                                [record.itemId]: updatedList,
                              };
                            });
                          }}

                          style={{ width: 120 }}
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
                pagination={{ pageSize: 10 }}
                style={{ marginTop: 10 }}
              />  */}

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

              {equipmentData.length > 0 && (
                <>
                  <Typography.Title level={4} style={{ marginTop: 24 }}>
                    Equipment
                  </Typography.Title>
                  <Table
                    dataSource={equipmentData}
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
                        title: "Unit",
                        key: "unit",
                        render: (_, record) =>
                          `#${record.unitIndex || 1}`,
                      },
                      // {
                      //   title: "Condition",
                      //   key: "condition",
                      //   render: (_, record) => {
                      //     const key = `${record.itemId}_${record.unitIndex}`;

                      //     return (
                      //       <Select
                      //         value={itemConditions[key] || "Good"}
                      //         onChange={(value) => {
                      //           setItemConditions((prev) => ({
                      //             ...prev,
                      //             [key]: value,
                      //           }));

                      //           setItemUnitConditions((prev) => ({
                      //             ...prev,
                      //             [record.itemId]: [
                      //               ...(prev[record.itemId] || []),
                      //             ].map((_, idx) =>
                      //               idx + 1 === record.unitIndex ? value : _
                      //             ),
                      //           }));
                      //         }}
                      //         style={{ width: 120 }}
                      //       >
                      //         <Option value="Good">Good</Option>
                      //         <Option value="Defect">Defect</Option>
                      //         <Option value="Damage">Damage</Option>
                      //         <Option value="Lost">Lost</Option>
                      //       </Select>
                      //     );
                      //   },
                      // },
                      
                      {
                        title: "Condition",
                        key: "condition",
                        render: (_, record) => {
                          const key = `${record.itemId}_${record.unitIndex}`;
                          const currentValue = itemConditions[key] || "Good";

                          // Disable if status is Approved
                          const isDisabled = selectedRequest.status === "Approved";

                          return (
                            <Select
                              value={currentValue}
                              onChange={(value) => {
                                setItemConditions((prev) => ({
                                  ...prev,
                                  [key]: value,
                                }));

                                setItemUnitConditions((prev) => {
                                  const totalUnits = equipmentData.filter(
                                    (item) => item.itemId === record.itemId
                                  ).length;

                                  const existing = prev[record.itemId] || Array(totalUnits).fill("Good");

                                  const updated = existing.map((cond, idx) =>
                                    idx + 1 === record.unitIndex ? value : cond
                                  );

                                  return {
                                    ...prev,
                                    [record.itemId]: updated,
                                  };
                                });
                              }}
                              style={{ width: 120 }}
                              disabled={isDisabled} // <-- here
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
                    pagination={false}
                  />
                </>
              )}
              </>

                {/* <Table
                dataSource={unitLevelData}
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
                    title: "Unit",
                    key: "unitIndex",
                    render: (_, record) =>
                      `#${record.unitIndex}${record.volume ? ` / ${record.volume} ML` : ""}`,
                  },
                  {
                    title: "Condition",
                    key: "condition",
                    render: (_, record) => {
                      const key = `${record.itemId}_${record.unitIndex}`;
                      return (
                        <Select
                          value={itemConditions[key] || "Good"}
                          onChange={(value) => {
                            const key = `${record.itemId}_${record.unitIndex}`;
                            setItemConditions((prev) => ({
                              ...prev,
                              [key]: value,
                            }));

                            // Also update itemUnitConditions
                            setItemUnitConditions((prev) => {
                              const currentList = prev[record.itemId] || [];
                              const updatedList = [...currentList];
                              updatedList[record.unitIndex - 1] = value;
                              return {
                                ...prev,
                                [record.itemId]: updatedList,
                              };
                            });
                          }}

                          style={{ width: 120 }}
                        >
                          <Option value="Good">Good</Option>
                          <Option value="Damage">Damage</Option>
                          <Option value="Defect">Defect</Option>
                        </Select>
                      );
                    },
                  },
                ]}
                pagination={{ pageSize: 10 }}
                style={{ marginTop: 10 }}
              /> */}

              <Row gutter={[16, 16]} style={{ marginTop: 10 }}>
                <Col span={12}>
                  <Text strong>Reason:</Text> {selectedRequest.reason}
                </Col>

                <Col span={12} style={{ textAlign: "right" }}>
                  <Text strong>Approved By:</Text> {selectedRequest.approvedBy ?? "N/A"}
                </Col>
              </Row>
            </div>
          )}
        </Modal>

        <Modal
          title={`Specify issues for: ${currentIssueItem?.itemDescription || ""}`}
          visible={issueModalVisible}
          zIndex={1030}
          onCancel={() => setIssueModalVisible(false)}
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