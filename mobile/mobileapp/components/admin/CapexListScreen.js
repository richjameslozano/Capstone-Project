import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Button,
  Modal,
  TouchableOpacity,
} from "react-native";
import { db } from "../../backend/firebase/FirebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import styles from "../styles/adminStyle/CapexListStyle";
import Header from '../Header';

const CapexRequestList = () => {
  const [requests, setRequests] = useState([]);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedRowDetails, setSelectedRowDetails] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return; // Ensure user is logged in before fetching requests

    const userRequestRef = collection(db, "capexrequestlist");

    const unsubscribe = onSnapshot(userRequestRef, (querySnapshot) => {
      const fetched = [];

      querySnapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        fetched.push({
          id: docSnap.id,
          ...data,
        });
      });

      setRequests(fetched);
    }, (error) => {
      console.error("Error fetching requests in real-time: ", error);
    });

    return () => unsubscribe(); // Clean up listener on component unmount
  }, [user?.id]);

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return "N/A";
    const date = timestamp.toDate();
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleViewDetails = (record) => {
    setSelectedRowDetails(record);
    setViewModalVisible(true);
  };

  const itemsColumns = [
    {
      title: "Item Description",
      dataIndex: "itemDescription",
      key: "itemDescription",
    },
    {
      title: "Justification",
      dataIndex: "justification",
      key: "justification",
    },
    {
      title: "Quantity",
      dataIndex: "qty",
      key: "qty",
    },
    {
      title: "Estimated Cost",
      dataIndex: "estimatedCost",
      key: "estimatedCost",
      render: (cost) => `₱${cost?.toLocaleString()}`,
    },
    {
      title: "Total Price",
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (price) => `₱${price?.toLocaleString()}`,
    },
  ];

  return (
    <View style={styles.container}>
      <Header/>
      <Text style={styles.title}>List of Requests</Text>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={styles.rowText}>
              {index + 1}. <Text style={styles.boldText}>{item.userName}</Text>
            </Text>
            <Text style={styles.rowText}>
              Submission Date: {formatDate(item.createdAt)}
            </Text>
            <Text style={styles.rowText}>
              Total Price: ₱{item.totalPrice?.toLocaleString()}
            </Text>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => handleViewDetails(item)}
            >
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal
        visible={viewModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setViewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {selectedRowDetails && (
              <View>
                <Text>
                  <Text style={styles.boldText}>User Name:</Text> {selectedRowDetails.userName}
                </Text>
                <Text>
                  <Text style={styles.boldText}>Total Price:</Text> ₱{selectedRowDetails.totalPrice?.toLocaleString()}
                </Text>
                <Text>
                  <Text style={styles.boldText}>Submission Date:</Text> {formatDate(selectedRowDetails.createdAt)}
                </Text>

                <Text style={styles.subHeading}>Items:</Text>

                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderCell}>Description</Text>
                  <Text style={styles.tableHeaderCell}>Qty</Text>
                  <Text style={styles.tableHeaderCell}>Est. Cost</Text>
                  <Text style={styles.tableHeaderCell}>Total</Text>
                </View>

                {selectedRowDetails.items.map((item, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{item.itemDescription}</Text>
                    <Text style={styles.tableCell}>{item.qty}</Text>
                    <Text style={styles.tableCell}>₱{item.estimatedCost}</Text>
                    <Text style={styles.tableCell}>₱{item.totalPrice}</Text>
                  </View>
                ))}
              </View>
            )}
            <Button title="Close" onPress={() => setViewModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CapexRequestList;
