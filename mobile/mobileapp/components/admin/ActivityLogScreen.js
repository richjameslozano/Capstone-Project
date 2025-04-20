import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../backend/firebase/FirebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/adminStyle/ActivityLogStyle';
import Header from '../Header';

const ActivityLogScreen = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // const fetchActivityLogs = async () => {
  //   try {
  //     const activityRef = collection(db, `accounts/${user.id}/activitylog`);
  //     const snapshot = await getDocs(activityRef);

  //     const logsData = snapshot.docs.map((doc, index) => {
  //       const data = doc.data();
  //       const logDate =
  //         data.cancelledAt?.toDate?.() ||
  //         data.timestamp?.toDate?.() ||
  //         new Date();

  //       return {
  //         key: doc.id || index.toString(),
  //         date: logDate.toLocaleString(),
  //         action:
  //           data.status === 'CANCELLED'
  //             ? 'Cancelled a request'
  //             : data.action || 'Modified a request',
  //         by: data.userName || 'Unknown User',
  //         fullData: data,
  //       };
  //     });

  //     logsData.sort((a, b) => {
  //       const aDate =
  //         a.fullData.timestamp?.toDate?.() || a.fullData.cancelledAt?.toDate?.() || 0;
  //       const bDate =
  //         b.fullData.timestamp?.toDate?.() || b.fullData.cancelledAt?.toDate?.() || 0;
  //       return bDate - aDate;
  //     });

  //     setLogs(logsData);
  //     setFilteredLogs(logsData);
  //   } catch (err) {
  //     console.error('Failed to fetch activity logs:', err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   fetchActivityLogs();
  // }, []);

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
  }, [searchQuery]);

  const renderItem = ({ item, index }) => (
    <Pressable
      style={index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}
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
      <Header />

      <Text style={styles.title}>⏰ Activity Log</Text>

      <TextInput
        placeholder="Search"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
      />

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
            data={filteredLogs}
            keyExtractor={(item) => item.key}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No activity found.</Text>
            }
          />
        </View>
      )}

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
