import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  Button,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import styles from "../styles/adminStyle/BorrowCatalogStyle";
import ApprovedRequestModal from "../customs/ApprovedRequestModal";
import Header from "../Header";
import { useNavigation } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const BorrowCatalogScreen = () => {
  const [catalog, setCatalog] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [headerHeight, setHeaderHeight] = useState(0);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation()
  const handleHeaderLayout = (event) => {
  const { height } = event.nativeEvent.layout;
  setHeaderHeight(height);
};

  useEffect(() => {
    setLoading(true);
    const fetchCatalogData = () => {
      try {
        // Set up the real-time listener using onSnapshot
        const borrowCatalogCollection = collection(db, "borrowcatalog");
  
        const unsubscribe = onSnapshot(borrowCatalogCollection, (snapshot) => {
        console.log(`Fetched ${snapshot.docs.length} items`); 
          const data = snapshot.docs.map((doc) => {
            const d = doc.data();
            const requestedItems = Array.isArray(d.requestList)
              ? d.requestList.map((item) => ({
                  itemId: item.itemIdFromInventory,
                  itemName: item.itemName,
                  quantity: item.quantity,
                  category: item.category,
                  condition: item.condition,
                  department: item.department,
                  labRoom: item.labRoom,
                }))
              : [];
  
            return {
              id: doc.id,
              timestamp: d.timestamp || null,
              requestor: d.userName || "N/A",
              userName: d.userName || "N/A",
              approvedBy: d.approvedBy || "N/A",
              reason: d.reason || "N/A",
              dateRequired: d.dateRequired || "N/A",
              timeFrom: d.timeFrom || "N/A",
              timeTo: d.timeTo || "N/A",
              courseDescription: d.courseDescription || "N/A",
              course: d.course || "N/A",
              program: d.program || "N/A",
              room: d.room || "N/A",
              requestList: d.requestList || [],
              requestedItems,
              status: d.status || "Pending",
              raw: d
            };
          });
  
          // Sort the data by timestamp in descending order
          const sortedData = data.sort((a, b) => {
            if (a.timestamp && b.timestamp) {
              const timeA = a.timestamp.seconds * 1000 + a.timestamp.nanoseconds / 1000000;
              const timeB = b.timestamp.seconds * 1000 + b.timestamp.nanoseconds / 1000000;
              return timeB - timeA;
            }
            return 0;
          });
  
          // Update state
          setCatalog(sortedData);
          setLoading(false);
        }, (error) => {
          console.error('Error fetching borrow catalog:', error);
          setLoading(false);
        });
  
        // Cleanup listener when the component unmounts
        return () => unsubscribe();
        
      } catch (err) {
        console.error("Error fetching borrow catalog:", err);
        setLoading(false);
      }
    };
  
    fetchCatalogData();
  }, []);

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const handleViewDetails = (item) => {
    setSelectedRequest(item); // set the selected request
    setModalVisible(true);    // open modal
  };

  const closeModal = () => {
    setModalVisible(false);   // close modal
    setSelectedRequest(null); // clear request
  };

  // const filteredCatalog = catalog.filter((item) =>
  //   item.requestor.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   item.courseDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   item.dateRequired.toLowerCase().includes(searchQuery.toLowerCase())
  // );

  const filteredCatalog = catalog.filter((item) => {
    const matchesSearch =
      item.requestor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.courseDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.dateRequired.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || item.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const capitalizeName = (name) => {
    return name.replace(/\b\w/g, char => char.toUpperCase());
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Borrowed":
        return "blue";

      case "Returned":
        return "orange";

      case "Return Approved":
        return "green";

      case "Deployed":
        return "red";

      case "For Release":
        return "purple";

      case "Released":
        return "#0e7490"; // teal

      case "Unclaimed":
      case "For Expired":
        return "black"; // amber

      default:
        return "black";
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleViewDetails(item)} style={styles.card}>
      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
      <Text style={styles.requestor}>{capitalizeName(item.requestor)}</Text>
      <Text style={styles.dateRequired}>{item.dateRequired}</Text>
      </View>
      <Text style={styles.description}>Room {item.room}</Text>
      
      {/* <Text
        style={[styles.status, item.status === "Approved" ? styles.approved : styles.pending]}
      >
        {item.status}
      </Text> */}

      <Text
        style={[
          styles.status,
          { color: getStatusColor(item.status), fontWeight: 'bold' }
        ]}
      >
        {item.status}
      </Text>

    </TouchableOpacity>
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
            Borrow Catalog
          </Text>
          <Text style={{ fontWeight: '300', fontSize: 13, textAlign: 'center' }}>
            Monitor Borrowed Items
          </Text>
        </View>

        {/* Placeholder to balance back button width */}
        <View style={{ width: 28 }} />
      </View>

      <View style={{flex: 1, marginTop: headerHeight, backgroundColor: '#e9ecee', borderRadius: 5, gap: 5}}>

    <View style={{backgroundColor: '#fff', padding: 10, borderRadius: 5, elevation: 3}}>
      <TextInput
        placeholder="Search"
        value={searchQuery}
        onChangeText={handleSearch}
        style={styles.searchInput}
      />
  <View  style={styles.statusFilterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {['All', 'Borrowed', 'Returned', 'Returned Approved', 'Deployed', 'For Release', 'Released', 'Unclaimed'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusFilterButton,
              statusFilter === status && styles.activeStatusFilterButton,
            ]}
            onPress={() => setStatusFilter(status)}
          >
            <Text
              style={[
                styles.statusFilterText,
                statusFilter === status && styles.activeStatusFilterText,
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      </View>
    </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <ActivityIndicator size="large" color="#395a7f" />
          <Text style={{ marginTop: 10, fontSize: 16, color: '#395a7f' }}>Loading borrow catalog...</Text>
        </View>
      ) : filteredCatalog.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 16, color: '#666' }}>No borrow catalog items found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCatalog}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          initialNumToRender={50}
          contentContainerStyle={{gap: 5}}
        />
      )}
      </View>

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

export default BorrowCatalogScreen;
