// import React, { useState, useEffect } from "react";
// import { Layout, Table, Button, Modal, Typography, Row, Col, Select } from "antd";
// import { db } from "../../backend/firebase/FirebaseConfig";
// import { collection, getDocs, doc, setDoc, updateDoc, getDoc, serverTimestamp, deleteDoc, onSnapshot, query, where } from "firebase/firestore";
// import Sidebar from "../Sidebar";
// import AppHeader from "../Header";
// import "../styles/adminStyle/RequestLog.css";

// const { Content } = Layout;
// const { Text } = Typography;
// const { Option } = Select;

// const ReturnItems = () => {
//   const [filterStatus, setFilterStatus] = useState("All");
//   const [modalVisible, setModalVisible] = useState(false);
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [historyData, setHistoryData] = useState([]);
//   const [inventoryData, setInventoryData] = useState({});
//   const [returnQuantities, setReturnQuantities] = useState({});
//   const [itemConditions, setItemConditions] = useState({});

//   useEffect(() => {
//     const userId = localStorage.getItem("userId");
//     if (!userId) {

//       return;
//     }

//     const userRequestLogRef = collection(db, `accounts/${userId}/userrequestlog`);

//     const unsubscribe = onSnapshot(userRequestLogRef, (querySnapshot) => {
//       try {
//         const logs = querySnapshot.docs.map((doc) => {
//           const data = doc.data();
//           const rawTimestamp = data.rawTimestamp;
//           const timestamp = data.timestamp;

//           let parsedRawTimestamp = "N/A";
//           let parsedTimestamp = "N/A";

//           if (rawTimestamp && typeof rawTimestamp.toDate === "function") {
//             try {
//               parsedRawTimestamp = rawTimestamp.toDate().toLocaleString("en-PH", {
//                 timeZone: "Asia/Manila",
//               });

//             } catch (e) {
//           
//             }
//           }

//           if (timestamp && typeof timestamp.toDate === "function") {
//             try {
//               parsedTimestamp = timestamp.toDate().toLocaleString("en-PH", {
//                 timeZone: "Asia/Manila",
//               });

//             } catch (e) {
//         
//             }
//           }

//           return {
//             id: doc.id,
//             date: data.dateRequired ?? "N/A",
//             status: data.status ?? "Pending",
//             requestor: data.userName ?? "Unknown",
//             requestedItems: data.requestList
//               ? data.requestList.map((item) => item.itemName).join(", ")
//               : "No items",
//             requisitionId: doc.id,
//             reason: data.reason ?? "No reason provided",
//             department: data.requestList?.[0]?.department ?? "N/A",
//             approvedBy: data.approvedBy ?? "N/A",
//             rawTimestamp: rawTimestamp ?? null,
//             processDate: parsedRawTimestamp,
//             timestamp: parsedTimestamp,
//             raw: data,
//           };
//         });

//         // Sort by rawTimestamp (Process Date)
//         logs.sort((a, b) => {
//           const timeA = a.rawTimestamp?.toMillis?.() ?? 0;
//           const timeB = b.rawTimestamp?.toMillis?.() ?? 0;
//           return timeB - timeA;
//         });

//         setHistoryData(logs);

//       } catch (error) {
//       
//       }

//     }, (error) => {
// 
//     });

//     return () => unsubscribe(); // Clean up the listener on unmount
//   }, []);

//   const columns = [
//     {
//       title: "Process Date",
//       dataIndex: "processDate",
//       key: "processDate",
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       key: "status",
//       render: (status) => (
//         <Text style={{ color: status === "Approved" ? "green" : "red", fontWeight: "bold" }}>
//           {status}
//         </Text>
//       ),
//     },
//     {
//       title: "Requestor",
//       dataIndex: "requestor",
//       key: "requestor",
//     },
//     {
//       title: "Approved By",
//       dataIndex: "approvedBy",
//       key: "approvedBy",
//     },
//     {
//       title: "",
//       key: "action",
//       render: (_, record) => (
//         <a href="#" className="view-details" onClick={() => handleViewDetails(record)}>
//           View Details
//         </a>
//       ),
//     },
//   ];

//   const handleViewDetails = async (record) => {
//     setSelectedRequest(record);
//     setModalVisible(true);

//     const inventoryMap = {};
//     const requestItems = record.raw?.requestList || [];

//     try {
//       const inventoryRef = collection(db, "inventory");
//       const inventorySnapshot = await getDocs(inventoryRef);
//       inventorySnapshot.forEach((doc) => {
//         const inv = doc.data();
//         requestItems.forEach((item) => {
//           if (inv.id === item.itemIdFromInventory) {
//             inventoryMap[item.itemIdFromInventory] = inv;
//           }
//         });
//       });
//     } catch (err) {
//
//     }

//     setInventoryData(inventoryMap);
//   };

//   const closeModal = () => {
//     setModalVisible(false);
//     setSelectedRequest(null);
//     setReturnQuantities({});
//     setItemConditions({});
//     setInventoryData({});
//   };

//   const handleReturn = async () => {
//     try {
//       const userId = localStorage.getItem("userId");
//       if (!userId || !selectedRequest) {
//        
//         return;
//       }
  
//       const timestamp = serverTimestamp();
//       const currentDateString = new Date().toISOString();
  
//       const fullReturnData = {
//         accountId: userId,
//         approvedBy: selectedRequest.raw?.approvedBy || "N/A",
//         courseCode: selectedRequest.raw?.courseCode || "N/A",
//         courseDescription: selectedRequest.raw?.courseDescription || "N/A",
//         dateRequired: selectedRequest.raw?.dateRequired || "N/A",
//         program: selectedRequest.raw?.program || "N/A",
//         reason: selectedRequest.raw?.reason || "No reason provided",
//         room: selectedRequest.raw?.room || "N/A",
//         timeFrom: selectedRequest.raw?.timeFrom || "N/A",
//         timeTo: selectedRequest.raw?.timeTo || "N/A",
//         timestamp: timestamp,
//         userName: selectedRequest.raw?.userName || "N/A",
//         requisitionId: selectedRequest.requisitionId,
//         status: "Returned",
//         requestList: (selectedRequest.raw?.requestList || [])
//           .map((item) => {
//             const returnQty = Number(returnQuantities[item.itemIdFromInventory] || 0);
//             if (returnQty <= 0) return null;
  
//             return {
//               ...item,
//               returnedQuantity: returnQty,
//               condition: itemConditions[item.itemIdFromInventory] || item.condition || "Good",
//               // status: "Returned",
//               scannedCount: 0,
//               dateReturned: currentDateString,
//             };
//           })
//           .filter(Boolean),
//       };
  
//       // Save to returnedItems and userreturneditems
//       const returnedRef = doc(collection(db, "returnedItems"));
//       const userReturnedRef = doc(collection(db, `accounts/${userId}/userreturneditems`));
//       await setDoc(returnedRef, fullReturnData);
//       await setDoc(userReturnedRef, fullReturnData);
  
//       const borrowQuery = query(
//         collection(db, "borrowcatalog"),
//         where("userName", "==", selectedRequest.raw?.userName),
//         where("dateRequired", "==", selectedRequest.raw?.dateRequired),
//         where("room", "==", selectedRequest.raw?.room),
//         where("timeFrom", "==", selectedRequest.raw?.timeFrom),
//         where("timeTo", "==", selectedRequest.raw?.timeTo)
//       );

//       const querySnapshot = await getDocs(borrowQuery);

//       if (!querySnapshot.empty) {
//         const docToUpdate = querySnapshot.docs[0];
//         const borrowDocRef = doc(db, "borrowcatalog", docToUpdate.id);
        
//         await setDoc(borrowDocRef, fullReturnData, { merge: true });
//      
//       } else {
//     
//       }

//       // 🗑️ Delete from userrequestlog
//       const userRequestLogRef = doc(
//         db,
//         `accounts/${userId}/userrequestlog/${selectedRequest.requisitionId}`
//       );
//       await deleteDoc(userRequestLogRef);

  
//       // 📝 Add to history log
//       const historyRef = doc(collection(db, `accounts/${userId}/historylog`));
//       await setDoc(historyRef, {
//         ...fullReturnData,
//         action: "Returned",
//         date: currentDateString,
//       });

//       // 📝 Add to history log
//       const activityRef = doc(collection(db, `accounts/${userId}/activitylog`));
//       await setDoc(activityRef, {
//         ...fullReturnData,
//         action: "Returned",
//         date: currentDateString,
//       });
  
//    
//       closeModal();
  
//     } catch (error) {
//    
//     }
//   };  
  
//   const filteredData =
//     filterStatus === "All"
//       ? historyData
//       : historyData.filter((item) => item.status === filterStatus);

//   return (
//     <Layout style={{ minHeight: "100vh" }}>
//       <Layout>
//         <Content style={{ margin: "20px" }}>
//           <div style={{ marginBottom: 16 }}>
//             <Button
//               type={filterStatus === "All" ? "primary" : "default"}
//               onClick={() => setFilterStatus("All")}
//               style={{ marginRight: 8 }}
//             >
//               All
//             </Button>

//             <Button
//               type={filterStatus === "Approved" ? "primary" : "default"}
//               onClick={() => setFilterStatus("Approved")}
//               style={{ marginRight: 8 }}
//             >
//               Approved
//             </Button>

//             <Button
//               type={filterStatus === "Deployed" ? "primary" : "default"}
//               onClick={() => setFilterStatus("Deployed")}
//             >
//               Deployed
//             </Button>
//           </div>

//           <Table
//             className="request-log-table"
//             dataSource={filteredData}
//             columns={columns}
//             rowKey="id"
//             bordered
//             pagination={{ pageSize: 10 }}
//           />
//         </Content>

//         <Modal
//           title="📄 Requisition Slip"
//           visible={modalVisible}
//           onCancel={closeModal}
//           zIndex={1012}
//           footer={[
//             <Button key="close" onClick={closeModal}>
//               Back
//             </Button>,
            
//             selectedRequest?.status === "Deployed" && (
//               <Button key="return" type="primary" onClick={handleReturn}>
//                 Return
//               </Button>
//             ),
//           ]}
//           width={800}
//         >
//           {selectedRequest && (
//             <div>
//               <Row gutter={[16, 16]}>
//                 <Col span={12}>
//                   <Text strong>Name:</Text> {selectedRequest.raw?.userName}
//                 </Col>
//                 <Col span={12} style={{ textAlign: "right" }}>
//                   <Text italic>Requisition ID: {selectedRequest.requisitionId}</Text>
//                 </Col>
//               </Row>

//               <Row gutter={[16, 8]} style={{ marginTop: 10 }}>
//                 <Col span={12}>
//                   <Text strong>Request Date:</Text> {selectedRequest.timestamp}
//                 </Col>
//                 <Col span={12}>
//                   <Text strong>Required Date:</Text> {selectedRequest.raw?.dateRequired}
//                 </Col>
//               </Row>

//               <Row gutter={[16, 8]} style={{ marginTop: 10 }}>
//                 <Col span={24}>
//                   <Text strong>Requested Items:</Text>
//                   <Text style={{ color: "green" }}> ({selectedRequest.status})</Text>
//                 </Col>
//               </Row>

//               <Table
//                 dataSource={(selectedRequest.raw?.requestList ?? []).map((item, index) => ({
//                   key: index,
//                   itemId: item.itemIdFromInventory,
//                   itemDescription: item.itemName,
//                   quantity: item.quantity,
//                 }))}
//                 columns={[
//                   {
//                     title: "Item ID",
//                     dataIndex: "itemId",
//                     key: "itemId",
//                   },
//                   {
//                     title: "Item Description",
//                     dataIndex: "itemDescription",
//                     key: "itemDescription",
//                   },
//                   {
//                     title: "Quantity",
//                     dataIndex: "quantity",
//                     key: "quantity",
//                   },
//                   {
//                     title: "Return Quantity",
//                     key: "returnQty",
//                     render: (_, record) => {
//                       const currentQty = returnQuantities[record.itemId] || "";
                  
//                       const handleChange = (e) => {
//                         let input = Number(e.target.value);
//                         if (input > record.quantity) input = record.quantity; 
//                         if (input < 1) input = 1; 
                  
//                         setReturnQuantities((prev) => ({
//                           ...prev,
//                           [record.itemId]: input,
//                         }));
//                       };
                  
//                       return (
//                         <input
//                           type="number"
//                           min={1}
//                           max={record.quantity}
//                           value={currentQty}
//                           onChange={handleChange}
//                           style={{ width: "80px" }}
//                         />
//                       );
//                     },
//                   },                  
//                   {
//                     title: "Condition",
//                     key: "condition",
//                     render: (_, record) => (
//                       <Select
//                         value={itemConditions[record.itemId] || "Good"}
//                         onChange={(value) =>
//                           setItemConditions((prev) => ({
//                             ...prev,
//                             [record.itemId]: value,
//                           }))
//                         }
//                         style={{ width: 120 }}
//                       >
//                         <Option value="Good">Good</Option>
//                         <Option value="Damaged">Damaged</Option>
//                         <Option value="Needs Repair">Needs Repair</Option>
//                       </Select>
//                     ),
//                   },
//                 ]}
//                 pagination={{ pageSize: 10 }}
//                 style={{ marginTop: 10 }}
//               />

//               <Row gutter={[16, 16]} style={{ marginTop: 10 }}>
//                 <Col span={12}>
//                   <Text strong>Reason:</Text> {selectedRequest.reason}
//                 </Col>

//                 <Col span={12} style={{ textAlign: "right" }}>
//                   <Text strong>Approved By:</Text> {selectedRequest.approvedBy ?? "N/A"}
//                 </Col>
//               </Row>
//             </div>
//           )}
//         </Modal>
//       </Layout>
//     </Layout>
//   );
// };

// export default ReturnItems;


// VERSION 2
import React, { useState, useEffect } from "react";
import { Layout, Table, Button, Modal, Typography, Row, Col, Select } from "antd";
import { db } from "../../backend/firebase/FirebaseConfig";
import { collection, getDocs, doc, setDoc, updateDoc, getDoc, serverTimestamp, deleteDoc, onSnapshot, query, where } from "firebase/firestore";
import Sidebar from "../Sidebar";
import AppHeader from "../Header";
import "../styles/usersStyle/ReturnItems.css";
import { RollbackOutlined } from '@ant-design/icons';
const { Content } = Layout;
const { Text } = Typography;
const { Option } = Select;

const ReturnItems = () => {
  const [filterStatus, setFilterStatus] = useState("All");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [inventoryData, setInventoryData] = useState({});
  const [returnQuantities, setReturnQuantities] = useState({});
  const [itemConditions, setItemConditions] = useState({});
  const [itemUnitConditions, setItemUnitConditions] = useState({});



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

          return {
            id: doc.id,
            date: data.dateRequired ?? "N/A",
            status: data.status ?? "Pending",
            requestor: data.userName ?? "Unknown",
            requestedItems: data.requestList
              ? data.requestList.map((item) => item.itemName).join(", ")
              : "No items",
            requisitionId: doc.id,
            reason: data.reason ?? "None",
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



  const handleReturn = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId || !selectedRequest) {

        return;
      }
  
      const timestamp = serverTimestamp();
      const currentDateString = new Date().toISOString();
  
      const fullReturnData = {
        accountId: userId,
        approvedBy: selectedRequest.raw?.approvedBy || "N/A",
        courseCode: selectedRequest.raw?.courseCode || "N/A",
        courseDescription: selectedRequest.raw?.courseDescription || "N/A",
        dateRequired: selectedRequest.raw?.dateRequired || "N/A",
        program: selectedRequest.raw?.program || "N/A",
        reason: selectedRequest.raw?.reason || "none",
        room: selectedRequest.raw?.room || "N/A",
        timeFrom: selectedRequest.raw?.timeFrom || "N/A",
        timeTo: selectedRequest.raw?.timeTo || "N/A",
        timestamp: timestamp,
        userName: selectedRequest.raw?.userName || "N/A",
        requisitionId: selectedRequest.requisitionId,
        status: "Returned",
        requestList: (selectedRequest.raw?.requestList || []).map((item) => {
          const returnedConditions = itemUnitConditions[item.itemIdFromInventory] || [];
          // Ensure the conditions array matches the quantity, defaulting to "Good"
          const conditions = Array.from({ length: item.quantity }, (_, idx) =>
            returnedConditions[idx] || "Good"
          );
          return {
            ...item,
            itemId: item.itemIdFromInventory,
            returnedQuantity: conditions.length,
            conditions,
            scannedCount: 0,
            dateReturned: currentDateString,
          };
        }),
      };



      // Update condition counts in the Borrow Catalog (inventory)
    for (const item of selectedRequest.raw?.requestList || []) {
      const returnedConditions = itemUnitConditions[item.itemIdFromInventory] || [];

      if (returnedConditions.length === 0) continue;

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

      // Tally condition counts from the returned units
      const newCounts = { ...existingConditionCount };
      returnedConditions.forEach((condition) => {
        if (newCounts[condition] !== undefined) {
          newCounts[condition]++;
        }
      });

      await updateDoc(inventoryDocRef, {
        conditionCount: newCounts,
      });
    }

      
      // Save to returnedItems and userreturneditems
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

      } else {

      }

      // 🗑️ Delete from userrequestlog
      const userRequestLogRef = doc(
        db,
        `accounts/${userId}/userrequestlog/${selectedRequest.requisitionId}`
      );
      await deleteDoc(userRequestLogRef);

  
      // 📝 Add to history log
      const historyRef = doc(collection(db, `accounts/${userId}/historylog`));
      await setDoc(historyRef, {
        ...fullReturnData,
        action: "Returned",
        date: currentDateString,
      });

      // 📝 Add to history log
      const activityRef = doc(collection(db, `accounts/${userId}/activitylog`));
      await setDoc(activityRef, {
        ...fullReturnData,
        action: "Returned",
        date: currentDateString,
      });
  

      closeModal();
  
    } catch (error) {

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

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout>
        <Content style={{ margin: "20px" }}>
          <div style={{ marginBottom: 16 }}>
            <Button
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
            </Button>

            <Button
              className="print-all-button"
              type={filterStatus === "Deployed" ? "primary" : "default"}
              onClick={() => setFilterStatus("Deployed")}
            >
              Deployed
            </Button>
          </div>

          <Table
            className="request-log-table"
            dataSource={filteredData}
            columns={columns}
            rowKey="id"
            bordered
            pagination={{ pageSize: 10 }}
          />
        </Content>

        <Modal
          visible={modalVisible}
          onCancel={closeModal}
          zIndex={1012}
          className="return-modal"
          footer={[
            <Button key="close" onClick={closeModal}>
              Back
            </Button>,
            
            selectedRequest?.status === "Deployed" && (
              <Button key="return" type="primary" onClick={handleReturn}>
                Return
              </Button>
            ),
          ]}
          width={800}
        >
          {selectedRequest && selectedRequest.raw && (
         
            <div style={{paddingTop: 50}}> 
              <div className="return-header" >
                <RollbackOutlined style={{color: 'white', fontSize: 20}}/> 
                <h3 style={{color: 'white', margin: 0, }}>Return Items</h3>
              </div>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text style={{fontSize: 16}} strong>Name: </Text>
                  <Text style={{fontSize: 16}}>{selectedRequest.raw?.userName}</Text>
                </Col>

                {/* <Col span={12} style={{ textAlign: "right" }}>
                  <Text italic>Requisition ID: {selectedRequest.requisitionId}</Text>
                </Col> */}
              </Row>

              <Row gutter={[16, 8]} style={{ marginTop: 10 }}>
                <Col span={12}>
                  <Text style={{fontSize: 16}} strong>Request Date:</Text> 
                <Text style={{fontSize: 16}}> {selectedRequest.timestamp}</Text>
                </Col>
                <Col span={12}>
                  <Text style={{fontSize: 16}} strong>Required Date:</Text>   
                  <Text style={{fontSize: 16}}> {selectedRequest.raw?.dateRequired}</Text>
                </Col>
              </Row>

              <Row gutter={[16, 8]} style={{ marginTop: 10 }}>
                <Col span={24}>
                  <Text style={{fontSize: 16}} strong>Requested Items: </Text>
                  <Text style={{ color: "white", fontSize: 16, backgroundColor:'#28d37dff', borderRadius: 5, padding: 5, margin: 0, fontWeight: 'bold',}}>{selectedRequest.status}</Text>
                </Col>
              </Row>

              <Table
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
              /> 

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
                  <Text strong>Note:</Text> {selectedRequest.reason}
                </Col>

                <Col span={12} style={{ textAlign: "right" }}>
                  <Text strong>Approved By:</Text> {selectedRequest.approvedBy ?? "N/A"}
                </Col>
              </Row>
            </div>
          )}
        </Modal>
      </Layout>
    </Layout>
  );
};

export default ReturnItems;
