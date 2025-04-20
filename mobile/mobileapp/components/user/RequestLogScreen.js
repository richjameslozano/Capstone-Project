import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../backend/firebase/FirebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/userStyle/RequestLogStyle';
import Header from '../Header';

const RequestLogScreen = () => {
  const { user } = useAuth();
  const [activityData, setActivityData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // useEffect(() => {
  //   const fetchActivityLogs = async () => {
  //     try {
  //       if (!user) return;
  //       const activityRef = collection(db, `accounts/${user.id}/historylog`);
  //       const querySnapshot = await getDocs(activityRef);

  //       const logs = querySnapshot.docs.map((doc, index) => {
  //         const data = doc.data();
  //         const logDate =
  //           data.cancelledAt?.toDate?.() ||
  //           data.timestamp?.toDate?.() ||
  //           new Date();

  //         const isCancelled = data.status === 'CANCELLED';
  //         const action = isCancelled
  //           ? 'Cancelled a request'
  //           : data.action || 'Modified a request';

  //         const by =
  //           action === 'Request Approved'
  //             ? data.approvedBy
  //             : data.userName || 'Unknown User';

  //         return {
  //           key: doc.id || index.toString(),
  //           date: logDate.toLocaleString('en-US', {
  //             year: 'numeric',
  //             month: 'short',
  //             day: 'numeric',
  //             hour: 'numeric',
  //             minute: '2-digit',
  //             hour12: true,
  //           }),
  //           rawDate: logDate,
  //           action,
  //           by,
  //           fullData: data,
  //         };
  //       });

  //       const sortedLogs = logs.sort((a, b) => b.rawDate - a.rawDate);
  //       setActivityData(sortedLogs);
  //       setFilteredData(sortedLogs);
  //     } catch (error) {
  //       console.error('Failed to fetch activity logs:', error);
  //     }
  //   };

  //   fetchActivityLogs();
  // }, [user]);

  useEffect(() => {
    const fetchActivityLogs = () => {
      try {
        if (!user) return;
  
        const activityRef = collection(db, `accounts/${user.id}/historylog`);
  
        // Use onSnapshot for real-time updates
        const unsubscribe = onSnapshot(
          activityRef,
          (snapshot) => {
            const logs = snapshot.docs.map((doc, index) => {
              const data = doc.data();
              const logDate =
                data.cancelledAt?.toDate?.() ||
                data.timestamp?.toDate?.() ||
                new Date();
  
              const isCancelled = data.status === 'CANCELLED';
              const action = isCancelled
                ? 'Cancelled a request'
                : data.action || 'Modified a request';
  
              const by =
                action === 'Request Approved'
                  ? data.approvedBy
                  : data.userName || 'Unknown User';
  
              return {
                key: doc.id || index.toString(),
                date: logDate.toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                }),
                rawDate: logDate,
                action,
                by,
                fullData: data,
              };
            });
  
            // Sort logs by date
            const sortedLogs = logs.sort((a, b) => b.rawDate - a.rawDate);
  
            setActivityData(sortedLogs);
            setFilteredData(sortedLogs);
          },
          (err) => {
            console.error('Real-time activity log listener failed:', err);
          }
        );
  
        // Cleanup the listener when the component unmounts
        return () => unsubscribe();
        
      } catch (error) {
        console.error('Failed to fetch activity logs:', error);
      }
    };
  
    fetchActivityLogs();
  }, [user]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = activityData.filter(
      (item) =>
        item.date.includes(query) ||
        item.action.toLowerCase().includes(query.toLowerCase()) ||
        item.by.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const handleRowPress = (log) => {
    setSelectedLog(log.fullData);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Header/>
      <Text style={styles.pageTitle}>Request Log</Text>

      <TextInput
        style={[styles.modalText, { borderBottomWidth: 1, marginBottom: 10 }]}
        placeholder="Search"
        value={searchQuery}
        onChangeText={handleSearch}
      />

      {/* Table Header */}
      <View style={[styles.tableHeader, { flexDirection: 'row' }]}>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Date</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Action</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>By</Text>
      </View>

      <ScrollView style={styles.content}>
        {filteredData.map((log, index) => (
          <TouchableOpacity
            key={log.key}
            onPress={() => handleRowPress(log)}
            style={index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}
          >
            <View style={{ flexDirection: 'row' }}>
              <Text style={[styles.tableCell, { flex: 1 }]}>{log.date}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{log.action}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{log.by}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>
        {selectedLog?.status === 'CANCELLED'
          ? 'Cancelled a Request'
          : selectedLog?.action || 'Modified a Request'}
      </Text>

      <ScrollView style={{ maxHeight: 400, width: '100%' }}>
        <Text style={styles.modalText}>By: {selectedLog?.userName || 'Unknown User'}</Text>
        <Text style={styles.modalText}>Program: {selectedLog?.program || 'N/A'}</Text>
        <Text style={styles.modalText}>Reason: {selectedLog?.reason || 'N/A'}</Text>
        <Text style={styles.modalText}>Room: {selectedLog?.room || 'N/A'}</Text>
        <Text style={styles.modalText}>
          Time:{' '}
          {selectedLog?.timeFrom && selectedLog?.timeTo
            ? `${selectedLog.timeFrom} - ${selectedLog.timeTo}`
            : 'N/A'}
        </Text>
        <Text style={styles.modalText}>Date Required: {selectedLog?.dateRequired || 'N/A'}</Text>

        <Text style={[styles.modalText, { fontWeight: 'bold', marginTop: 10 }]}>Items:</Text>

        {(selectedLog?.filteredMergedData || selectedLog?.requestList)?.length > 0 ? (
          <View style={{ marginTop: 10 }}>
            <View style={[styles.tableHeader, { flexDirection: 'row', borderTopLeftRadius: 5, borderTopRightRadius: 5 }]}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Item</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Qty</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Category</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Condition</Text>
            </View>

            {(selectedLog?.filteredMergedData || selectedLog?.requestList).map((item, index) => (
              <View
                key={index}
                style={[
                  index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                  { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 4 },
                ]}
              >
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.itemName}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{item.category || '—'}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{item.condition || '—'}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.modalText}>None</Text>
        )}
      </ScrollView>

      <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

    </View>
  );
};

export default RequestLogScreen;
