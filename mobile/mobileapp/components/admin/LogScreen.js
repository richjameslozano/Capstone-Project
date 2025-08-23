import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
import { useNavigation } from '@react-navigation/native';

const LogScreen = () => {
  const [filterStatus, setFilterStatus] = useState("All");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const [headerHeight, setHeaderHeight] = useState(0);

  const navigation = useNavigation()
  const handleHeaderLayout = (event) => {
  const { height } = event.nativeEvent.layout;
  setHeaderHeight(height);
};

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "requestlog"), (querySnapshot) => {
      const logs = querySnapshot.docs.map((doc) => {
        
        const data = doc.data();

        console.log("Request List Items:", data.requestList);
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
          unit: data.requestList?.[0]?.unit ?? "N/A",
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

  // Assuming selectedRequest.raw.items is the array of requested items
// Determine if any item is "chemical" or "reagent"
  const items = selectedRequest?.raw?.requestList || [];

  const isChemicalOrReagent = items.some(
    (item) =>
      item.itemType?.toLowerCase() === "chemical" ||
      item.itemType?.toLowerCase() === "reagent"
  );

  return (
    <View style={styles.container}>
      <View 
        style={[styles.pendingHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} 
        onLayout={handleHeaderLayout}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="keyboard-backspace" size={28} color="black" />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontWeight: '800', fontSize: 18, color: '#395a7f', textAlign: 'center' }}>
            Request Log
          </Text>
          <Text style={{ fontWeight: '300', fontSize: 13, textAlign: 'center' }}>
            View Processed Requests
          </Text>
        </View>

        {/* Empty space to match back button width for perfect centering */}
        <View style={{ width: 28 }} />
      </View>

      <View style={[styles.filterContainer, {marginTop: headerHeight+5}]}>
        {['All', 'Approved', 'Rejected', 'Returned'].map((status) => (
  <TouchableOpacity
    key={status}
    style={[
      styles.filterBtn,
      filterStatus === status && styles.activeFilterBtn // apply active style if selected
    ]}
    onPress={() => setFilterStatus(status)}
  >
    <Text style={[filterStatus === status ? styles.activeFilterText : styles.inactiveFilterText, {fontSize: 12}]}>
      {status}
    </Text>
  </TouchableOpacity>
))}

      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 50 }}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text>Loading request logs...</Text>
        </View>
      ) : (
        <View style={{flex: 1, padding: 10, backgroundColor: 'white', borderRadius: 5}}>
       <ScrollView horizontal>
    <View>
      {/* Table Header */}
      <View style={[styles.tableRow, styles.tableHeaderRow]}>
        <Text style={[styles.tableHeaderCell, { minWidth: 180 }]}>Date</Text>
        <Text style={[styles.tableHeaderCell, { minWidth: 100 }]}>Status</Text>
        <Text style={[styles.tableHeaderCell, { minWidth: 160 }]}>Requestor</Text>
        <Text style={[styles.tableHeaderCell, { minWidth: 80 }]}>Action</Text>
      </View>

      {/* Inner vertical scroll */}
      <ScrollView >
        {filteredData.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.tableRow,
              index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
            ]}
          >
            <Text style={[styles.tableCell, { minWidth: 180 }]}>{item.timestamp}</Text>
            <Text style={[styles.tableCell, { minWidth: 100 }]}>{item.status}</Text>
            <Text style={[styles.tableCell, { minWidth: 160 }]}>{item.requestor}</Text>
            <TouchableOpacity onPress={() => handleViewDetails(item)} style={{ minWidth: 80 }}>
              <Text style={styles.viewText}>View</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  </ScrollView>

        </View>
      )}

      <Modal transparent={true} visible={modalVisible} animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {selectedRequest && (
                <>
                  <Text style={styles.modalTitle}>Requisition Slip</Text>

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
                      <Text style={[styles.tableHeader, { flex: 1 }]}>QTY</Text>
                      <Text style={[styles.tableHeader, { flex: 1 }]}>Unit</Text>
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
                        {["chemical", "reagent"].includes(item.category?.toLowerCase()) ? (
                          <Text style={[styles.tableCell, { flex: 1 }]}>{item.unit || "N/A"}</Text>
                        ) : (
                          <Text style={[styles.tableCell, { flex: 1 }]}>N/A</Text>
                        )}
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
