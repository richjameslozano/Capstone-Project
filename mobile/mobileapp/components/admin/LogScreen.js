import React, { useState, useEffect } from "react";
import { View, Text, Button, Modal, FlatList, ScrollView, ActivityIndicator } from "react-native";
import { db } from "../../backend/firebase/FirebaseConfig";
import { collection, getDocs, onSnapshot} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import styles from "../styles/admin2Style/LogStyle";
import ApprovedRequestModal from "../customs/ApprovedRequestModal";
import Header from '../Header';

const LogScreen = () => {
  const [filterStatus, setFilterStatus] = useState("All");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); 

  // useEffect(() => {
  //   const fetchRequestLogs = async () => {
  //     try {
  //       const querySnapshot = await getDocs(collection(db, "requestlog"));
  //       const logs = querySnapshot.docs.map((doc) => {
  //         const data = doc.data();
  //         const timestamp = data.timestamp ? formatTimestamp(data.timestamp) : "N/A";

  //         return {
  //           id: doc.id,
  //           date: data.dateRequired ?? "N/A",
  //           status: data.status ?? "Pending",
  //           requestor: data.userName ?? "Unknown",
  //           requestedItems: data.requestList ?? [],
  //           requisitionId: doc.id,
  //           reason: data.reason ?? "No reason provided",
  //           department: data.requestList?.[0]?.department ?? "N/A",
  //           approvedBy: data.approvedBy,
  //           rejectedBy: data.rejectedBy,
  //           timestamp: timestamp,
  //           raw: data,
  //           itemId: data.itemId,
  //         };
  //       });

  //       const sortedLogs = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  //       setHistoryData(sortedLogs);

  //     } catch (error) {
  //       console.error("Error fetching request logs:", error);
        
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchRequestLogs();
  // }, []);

  useEffect(() => {
    const fetchRequestLogs = () => {
      try {
        // Set up the real-time listener using onSnapshot
        const requestLogRef = collection(db, "requestlog");
        const unsubscribe = onSnapshot(requestLogRef, (querySnapshot) => {
          const logs = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            const timestamp = data.timestamp ? formatTimestamp(data.timestamp) : "N/A";
  
            return {
              id: doc.id,
              date: data.dateRequired ?? "N/A",
              status: data.status ?? "Pending",
              requestor: data.userName ?? "Unknown",
              requestedItems: data.requestList ?? [],
              requisitionId: doc.id,
              reason: data.reason ?? "No reason provided",
              department: data.requestList?.[0]?.department ?? "N/A",
              approvedBy: data.approvedBy,
              rejectedBy: data.rejectedBy,
              timestamp: timestamp,
              raw: data,
              itemId: data.itemId,
            };
          });
  
          // Sort logs by timestamp in descending order
          const sortedLogs = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
          // Update state
          setHistoryData(sortedLogs);
        });
  
        // Cleanup listener when the component unmounts
        return () => unsubscribe();
        
      } catch (error) {
        console.error("Error fetching request logs:", error);

      } finally {
        setLoading(false);
      }
    };
  
    fetchRequestLogs();
  }, []);

  const formatTimestamp = (timestamp) => {
    try {
      const date = timestamp.toDate();
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

    } catch (e) {
      return "N/A";
    }
  };

  const handleViewDetails = (record) => {
    setSelectedRequest(record.raw);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedRequest(null);
  };

  const filteredData =
    filterStatus === "All"
      ? historyData
      : historyData.filter((item) => item.status === filterStatus);

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.filterContainer}>
        <Button title="All" onPress={() => setFilterStatus("All")} />
        <Button title="Approved" onPress={() => setFilterStatus("Approved")} />
        <Button title="Declined" onPress={() => setFilterStatus("Declined")} />
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
              <Text style={styles.tableHeader}>Timestamp</Text>
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
                <Button title="View Details" onPress={() => handleViewDetails(item)} />
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {modalVisible && (
        <Modal transparent={true} visible={modalVisible} animationType="slide">
          <ApprovedRequestModal
            request={selectedRequest}
            isVisible={modalVisible}
            onClose={closeModal}
          />
        </Modal>
      )}
    </View>
  );
};

export default LogScreen;
