// import React, { useState, useEffect } from "react";
// import { View, Text, Button, Modal, FlatList, ScrollView, ActivityIndicator } from "react-native";
// import { db } from "../../backend/firebase/FirebaseConfig";
// import { collection, getDocs, onSnapshot} from "firebase/firestore";
// import { useAuth } from "../contexts/AuthContext";
// import styles from "../styles/adminStyle/LogStyle";
// import ApprovedRequestModal from "../customs/ApprovedRequestModal";
// import Header from '../Header';

// const LogScreen = () => {
//   const [filterStatus, setFilterStatus] = useState("All");
//   const [modalVisible, setModalVisible] = useState(false);
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [historyData, setHistoryData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const { user } = useAuth(); 

//   // useEffect(() => {
//   //   const fetchRequestLogs = async () => {
//   //     try {
//   //       const querySnapshot = await getDocs(collection(db, "requestlog"));
//   //       const logs = querySnapshot.docs.map((doc) => {
//   //         const data = doc.data();
//   //         const timestamp = data.timestamp ? formatTimestamp(data.timestamp) : "N/A";

//   //         return {
//   //           id: doc.id,
//   //           date: data.dateRequired ?? "N/A",
//   //           status: data.status ?? "Pending",
//   //           requestor: data.userName ?? "Unknown",
//   //           requestedItems: data.requestList ?? [],
//   //           requisitionId: doc.id,
//   //           reason: data.reason ?? "No reason provided",
//   //           department: data.requestList?.[0]?.department ?? "N/A",
//   //           approvedBy: data.approvedBy,
//   //           rejectedBy: data.rejectedBy,
//   //           timestamp: timestamp,
//   //           raw: data,
//   //           itemId: data.itemId,
//   //         };
//   //       });

//   //       const sortedLogs = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
//   //       setHistoryData(sortedLogs);

//   //     } catch (error) {
//   //       console.error("Error fetching request logs:", error);
        
//   //     } finally {
//   //       setLoading(false);
//   //     }
//   //   };

//   //   fetchRequestLogs();
//   // }, []);

//   useEffect(() => {
//     const fetchRequestLogs = () => {
//       try {
//         const requestLogRef = collection(db, "requestlog");
//         const unsubscribe = onSnapshot(requestLogRef, (querySnapshot) => {
//           const logs = querySnapshot.docs.map((doc) => {
//             const data = doc.data();
//             const timeFrom = data.timeFrom || "N/A";  
//             const timeTo = data.timeTo || "N/A";    
//             const rawTimestamp = data.rawTimestamp;
//             const timestamp = data.timestamp;

//             let parsedRawTimestamp = "N/A";
//             let parsedTimestamp = "N/A";

//             if (rawTimestamp && typeof rawTimestamp.toDate === "function") {
//               try {
//                 parsedRawTimestamp = rawTimestamp.toDate().toLocaleString("en-PH", {
//                   timeZone: "Asia/Manila",
//                 });
//               } catch (e) {
//                 console.warn(`Error formatting rawTimestamp for doc ${doc.id}:`, e);
//               }
//             }

//             if (timestamp && typeof timestamp.toDate === "function") {
//               try {
//                 parsedTimestamp = timestamp.toDate().toLocaleString("en-PH", {
//                   timeZone: "Asia/Manila",
//                 });
//               } catch (e) {
//                 console.warn(`Error formatting timestamp for doc \${doc.id}:`, e);
//               }
//             }

//             return {
//               id: doc.id,
//               date: data.dateRequired ?? "N/A",
//               status: data.status ?? "Pending",
//               requestor: data.userName ?? "Unknown",
//               requestedItems: data.requestList
//                 ? data.requestList.map((item) => item.itemName).join(", ")
//                 : "No items",
//               requisitionId: doc.id,
//               reason: data.reason ?? "No reason provided",
//               department: data.requestList?.[0]?.department ?? "N/A",
//               rejectionReason:
//                 data.requestList?.[0]?.reason || data.reason || "N/A",
//               approvedBy: data.approvedBy,
//               rejectedBy: data.rejectedBy,
//               rawTimestamp: rawTimestamp ?? null,
//               processDate: parsedRawTimestamp, 
//               timestamp: parsedTimestamp,
//               room: data.room,
//               raw: data,
//               timeFrom, 
//               timeTo,  
//             };
//           });

//           logs.sort((a, b) => {
//             const timeA = a.rawTimestamp?.toMillis?.() ?? 0;
//             const timeB = b.rawTimestamp?.toMillis?.() ?? 0;
//             return timeB - timeA;
//           });

//           setHistoryData(logs);
//         });

//         return () => unsubscribe();
//       } catch (error) {
//         console.error("Error fetching request logs: ", error);
//       }
//     };

//     fetchRequestLogs();
//   }, []);

//   const formatTimestamp = (timestamp) => {
//     try {
//       const date = timestamp.toDate();
//       return date.toLocaleString("en-US", {
//         month: "short",
//         day: "numeric",
//         year: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//         hour12: true,
//       });

//     } catch (e) {
//       return "N/A";
//     }
//   };

//   const handleViewDetails = (record) => {
//     setSelectedRequest(record.raw);
//     setModalVisible(true);
//   };

//   const closeModal = () => {
//     setModalVisible(false);
//     setSelectedRequest(null);
//   };

//   const filteredData =
//     filterStatus === "All"
//       ? historyData
//       : historyData.filter((item) => item.status === filterStatus);

//   return (
//     <View style={styles.container}>
//       <Header />

//       <View style={styles.filterContainer}>
//         <Button title="All" onPress={() => setFilterStatus("All")} />
//         <Button title="Approved" onPress={() => setFilterStatus("Approved")} />
//         <Button title="Rejected" onPress={() => setFilterStatus("Rejected")} />
//         <Button title="Returned" onPress={() => setFilterStatus("Returned")} />
//       </View>

//       {loading ? (
//         <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 50 }}>
//           <ActivityIndicator size="large" color="#007bff" />
//           <Text>Loading request logs...</Text>
//         </View>

//       ) : (
//         <ScrollView horizontal>
//           <View style={styles.table}>
//             <View style={styles.tableRow}>
//               <Text style={styles.tableHeader}>Date</Text>
//               <Text style={styles.tableHeader}>Status</Text>
//               <Text style={styles.tableHeader}>Requestor</Text>
//               <Text style={styles.tableHeader}>Action</Text>
//             </View>
//             {filteredData.map((item, index) => (
//               <View
//                 key={item.id}
//                 style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}
//               >
//                 <Text style={styles.tableCell}>{item.timestamp}</Text>
//                 <Text style={styles.tableCell}>{item.status}</Text>
//                 <Text style={styles.tableCell}>{item.requestor}</Text>
//                 <Button title="View Details" onPress={() => handleViewDetails(item)} />
//               </View>
//             ))}
//           </View>
//         </ScrollView>
//       )}

//       {modalVisible && (
//         <Modal transparent={true} visible={modalVisible} animationType="slide">
//           <ApprovedRequestModal
//             request={selectedRequest}
//             isVisible={modalVisible}
//             onClose={closeModal}
//           />
//         </Modal>
//       )}
//     </View>
//   );
// };

// export default LogScreen;

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { db } from "../../backend/firebase/FirebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import Header from "../Header";
import styles from "../styles/adminStyle/LogStyle";

const LogScreen = () => {
  const [filterStatus, setFilterStatus] = useState("All");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "requestlog"), (querySnapshot) => {
      const logs = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const timeFrom = data.timeFrom || "N/A";
        const timeTo = data.timeTo || "N/A";
        const rawTimestamp = data.rawTimestamp;
        const timestamp = data.timestamp;

        let parsedRawTimestamp = "N/A";
        let parsedTimestamp = "N/A";

        if (rawTimestamp?.toDate) {
          parsedRawTimestamp = rawTimestamp.toDate().toLocaleString("en-PH", { timeZone: "Asia/Manila" });
        }

        if (timestamp?.toDate) {
          parsedTimestamp = timestamp.toDate().toLocaleString("en-PH", { timeZone: "Asia/Manila" });
        }

        return {
          id: doc.id,
          date: data.dateRequired ?? "N/A",
          status: data.status ?? "Pending",
          requestor: data.userName ?? "Unknown",
          requestedItems: data.requestList?.map((item) => item.itemName).join(", ") || "No items",
          requisitionId: doc.id,
          reason: data.reason ?? "No reason provided",
          department: data.requestList?.[0]?.department ?? "N/A",
          rejectionReason: data.requestList?.[0]?.reason || data.reason || "N/A",
          approvedBy: data.approvedBy,
          rejectedBy: data.rejectedBy,
          rawTimestamp,
          processDate: parsedRawTimestamp,
          timestamp: parsedTimestamp,
          room: data.room,
          raw: data,
          timeFrom,
          timeTo,
        };
      });

      logs.sort((a, b) => (b.rawTimestamp?.toMillis?.() ?? 0) - (a.rawTimestamp?.toMillis?.() ?? 0));
      setHistoryData(logs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredData =
    filterStatus === "All"
      ? historyData
      : historyData.filter((item) => item.status === filterStatus);

  const handleViewDetails = (record) => {
    setSelectedRequest(record);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedRequest(null);
  };

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.filterContainer}>
        {["All", "Approved", "Rejected", "Returned"].map((status) => (
          <Button key={status} title={status} onPress={() => setFilterStatus(status)} />
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 50 }}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text>Loading request logs...</Text>
        </View>
      ) : (
        <ScrollView horizontal>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableHeader}>Date</Text>
              <Text style={styles.tableHeader}>Status</Text>
              <Text style={styles.tableHeader}>Requestor</Text>
              <Text style={styles.tableHeader}>Action</Text>
            </View>
            {filteredData.map((item, index) => (
              <View
                key={item.id}
                style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}
              >
                <Text style={styles.tableCell}>{item.timestamp}</Text>
                <Text style={styles.tableCell}>{item.status}</Text>
                <Text style={styles.tableCell}>{item.requestor}</Text>
                <TouchableOpacity onPress={() => handleViewDetails(item)}>
                  <Text style={{ color: "blue" }}>View Details</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <Modal transparent={true} visible={modalVisible} animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {selectedRequest && (
                <>
                  <Text style={styles.modalTitle}>📄 Requisition Slip</Text>

                  <Text>Name: {selectedRequest.raw?.userName ?? "N/A"}</Text>
                  <Text>Room: {selectedRequest.raw?.room ?? "N/A"}</Text>
                  <Text>Request Date: {selectedRequest.timestamp ?? "N/A"}</Text>
                  <Text>Required Date: {selectedRequest.raw?.dateRequired ?? "N/A"}</Text>
                  <Text>
                    Time Needed: {selectedRequest.timeFrom ?? "N/A"} - {selectedRequest.timeTo ?? "N/A"}
                  </Text>
                  <Text>Status: {selectedRequest.raw?.status ?? "N/A"}</Text>
                  <Text>Reason of Request: {selectedRequest.raw?.reason ?? "N/A"}</Text>
                  <Text>Department: {selectedRequest.department ?? "N/A"}</Text>

                  {["Approved", "Returned"].includes(selectedRequest.raw?.status) && (
                    <Text>Approved By: {selectedRequest.raw?.approvedBy ?? "N/A"}</Text>
                  )}

                  {selectedRequest.raw?.status === "Rejected" && (
                    <>
                      <Text>Rejected By: {selectedRequest.raw?.rejectedBy ?? "N/A"}</Text>
                      <Text>
                        Reason of Rejection:{" "}
                        {selectedRequest.raw?.reason || selectedRequest.rejectionReason || "N/A"}
                      </Text>
                    </>
                  )}

                  <Text style={{ marginTop: 10, fontWeight: "bold" }}>Requested Items:</Text>

                  <View style={styles.table}>
                    {/* Table Header */}
                    <View style={[styles.tableRow, styles.itemHeader]}>
                      <Text style={[styles.tableHeader, { flex: 1.5 }]}>Item ID</Text>
                      <Text style={[styles.tableHeader, { flex: 3 }]}>Item Name</Text>
                      <Text style={[styles.tableHeader, { flex: 1 }]}>Quantity</Text>
                      <Text style={[styles.tableHeader, { flex: 3 }]}>Details</Text>
                      {selectedRequest.raw.status === "Rejected" && (
                        <Text style={[styles.tableHeader, { flex: 3 }]}>Reason</Text>
                      )}
                    </View>

                    {/* Table Rows */}
                    {(selectedRequest.raw?.requestList ?? []).map((item, index) => (
                      <View
                        key={index}
                        style={[
                          styles.tableRow,
                          index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                          styles.itemRow,
                        ]}
                      >
                        <Text style={[styles.tableCell, { flex: 1.5 }]}>
                          {item.itemIdFromInventory ?? item.itemId}
                        </Text>
                        <Text style={[styles.tableCell, { flex: 3 }]}>{item.itemName}</Text>
                        <Text style={[styles.tableCell, { flex: 1 }]}>{item.quantity}</Text>
                        <Text style={[styles.tableCell, { flex: 3, fontSize: 12, color: "gray" }]}>
                          {item.itemDetails}
                        </Text>
                        {selectedRequest.raw.status === "Rejected" && (
                          <Text style={[styles.tableCell, { flex: 3, fontSize: 12, color: "red" }]}>
                            {item.reason ?? "N/A"}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                </>
              )}
              <Button title="Close" onPress={closeModal} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default LogScreen;
