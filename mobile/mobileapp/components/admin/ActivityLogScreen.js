import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Modal,
  Pressable,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../backend/firebase/FirebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/userStyle/ActivityLogStyle';
import Header from '../Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const ActivityLogScreen = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [headerHeight, setHeaderHeight] = useState(0);

const handleHeaderLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    setHeaderHeight(height);
  };

    const navigation = useNavigation()

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('transparent'); // Android only
      StatusBar.setTranslucent(true)
    }, [])
  );
  

  const fetchActivityLogs = () => {
    try {
      // Set up the real-time listener using onSnapshot
      const activityRef = collection(db, `accounts/${user.id}/activitylog`);
      const unsubscribe = onSnapshot(activityRef, (querySnapshot) => {
        const logsData = querySnapshot.docs.map((doc, index) => {
          const data = doc.data();
          const logDate =
            data.cancelledAt?.toDate?.() ||
            data.timestamp?.toDate?.() ||
            new Date();
  
          return {
            key: doc.id || index.toString(),
            date: logDate.toLocaleString(),
            action:
              data.status === 'CANCELLED'
                ? 'Cancelled a request'
                : data.action || 'Modified a request',
            by: data.userName || 'Unknown User',
            fullData: data,
          };
        });
  
        logsData.sort((a, b) => {
          const aDate =
            a.fullData.timestamp?.toDate?.() || a.fullData.cancelledAt?.toDate?.() || 0;
          const bDate =
            b.fullData.timestamp?.toDate?.() || b.fullData.cancelledAt?.toDate?.() || 0;
          return bDate - aDate;
        });
  
        setLogs(logsData);
        setFilteredLogs(logsData);
      });
  
      // Cleanup listener when the component unmounts
      return () => unsubscribe();
      
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);

    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchActivityLogs();
  }, []);

  useEffect(() => {
    const filtered = logs.filter(
      (item) =>
        item.date.includes(searchQuery) ||
        item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.by.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredLogs(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchQuery]);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderItem = ({ item, index }) => (
    <Pressable
      style={[index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}
      onPress={() => {
        setSelectedLog(item.fullData);
        setModalVisible(true);
      }}
    >
      <Text style={styles.tableCell}>{item.date}</Text>
      <Text style={styles.tableCell}>{item.action}</Text>
      <Text style={styles.tableCell}>{item.by}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.inventoryStocksHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} onLayout={handleHeaderLayout}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="keyboard-backspace" size={28} color="black" />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontWeight: '800', fontSize: 18, color: '#395a7f', textAlign: 'center' }}>
              Activity Log
            </Text>
            <Text style={{ fontWeight: '300', fontSize: 13, textAlign: 'center' }}>
              Action History
            </Text>
          </View>

          {/* If you want an empty right side to balance the back button on left */}
          <View style={{ width: 28, /* same size as icon for symmetry */ }} />
        </View>

      {/* <TextInput
        placeholder="Search"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
      /> */}
      <View style={{flex: 1, backgroundColor: 'white', padding: 10, marginTop: headerHeight, paddingBottom: 10}}>
      {loading ? (
        <ActivityIndicator size="large" color="#1890ff" />
      ) : (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.headerCell]}>Date</Text>
            <Text style={[styles.tableCell, styles.headerCell]}>Action</Text>
            <Text style={[styles.tableCell, styles.headerCell]}>By</Text>
          </View>

          <FlatList
            data={currentItems}
            keyExtractor={(item) => item.key}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No activity found.</Text>
            }
            contentContainerStyle={{paddingBottom: 30}}
            style={{paddingBottom: 20}}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                onPress={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                  Previous
                </Text>
              </TouchableOpacity>

              <Text style={styles.paginationText}>
                Page {currentPage} of {totalPages}
              </Text>

              <TouchableOpacity
                style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                onPress={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Activity Details</Text>
            {selectedLog && (
              <>
                <Text style={styles.modalText}>
                  <Text style={styles.modalLabel}>Action:</Text> {selectedLog.action || 'N/A'}
                </Text>

                <Text style={styles.modalText}>
                  <Text style={styles.modalLabel}>By:</Text> {selectedLog.userName || 'Unknown'}
                </Text>

                <Text style={styles.modalText}>
                  <Text style={styles.modalLabel}>Date:</Text>{' '}
                  {(selectedLog.timestamp?.toDate?.() || selectedLog.cancelledAt?.toDate?.() || new Date()).toLocaleString()}
                </Text>
              </>
            )}
            <Pressable
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ActivityLogScreen;
