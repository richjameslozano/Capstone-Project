import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
  Easing,
  TextInput,
  StatusBar
} from 'react-native';
import { Card } from 'react-native-paper';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';

import { db } from '../../backend/firebase/FirebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/userStyle/RequestStyle';
import Header from '../Header';
import PagerView from 'react-native-pager-view';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

export default function RequestScreen() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modal2Visible, setModal2Visible] = useState(false);
  const [activityData, setActivityData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const { user } = useAuth();

  const [headerHeight, setHeaderHeight] = useState(0);
  const navigation = useNavigation()
  
    const handleHeaderLayout = (event) => {
      const { height } = event.nativeEvent.layout;
      setHeaderHeight(height);
    };


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
                  action === "Request Approved"
                  ? data.approvedBy
                  : action === "Request Rejected"
                  ? data.rejectedBy
                  : data.userName || "Unknown User";
    
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

    useEffect(() => {
      handleSearch(searchQuery);
    }, [statusFilter]);


const handleSearch = (query) => {
  setSearchQuery(query);

  const filtered = activityData.filter((item) => {
    const matchesQuery =
      item.date.includes(query) ||
      item.action.toLowerCase().includes(query.toLowerCase()) ||
      item.by.toLowerCase().includes(query.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || item.action === statusFilter;

    return matchesQuery && matchesStatus;
  });

  setFilteredData(filtered);
};
  
    const handleRowPress = (log) => {
      setSelectedLog(log.fullData);
      setModalVisible(true);
    };

  const fetchRequests = () => {
    setLoading(true);
    try {
      if (!user?.id) throw new Error('User is not logged in.');
  
      // Set up the real-time listener using onSnapshot
      const requestsRef = collection(db, `accounts/${user.id}/userRequests`);
      const unsubscribe = onSnapshot(requestsRef, async (querySnapshot) => {
        console.log('Fetched docs:', querySnapshot.docs.length);
        const fetched = [];
  
        // Loop through each document and enrich the request items
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          const enrichedItems = await Promise.all(
            (data.filteredMergedData || data.requestList || []).map(async (item) => {
              const inventoryId = item.selectedItemId || item.selectedItem?.value;
              let itemId = 'N/A';
              if (inventoryId) {
                try {
                  const invDoc = await getDoc(doc(db, `inventory/${inventoryId}`));
                  if (invDoc.exists()) {
                    itemId = invDoc.data().itemId || 'N/A';
                  }
                  
                } catch (err) {
                  console.error(`Error fetching inventory item ${inventoryId}:`, err);
                }
              }
  
              return {
                ...item,
                itemIdFromInventory: itemId,
              };
            })
          );
  
          const dateObj = data.timestamp?.toDate?.();
          const dateRequested = dateObj ? dateObj : new Date();
  
          fetched.push({
            id: docSnap.id,
            dateRequested,
            dateRequired: data.dateRequired || 'N/A',
            requester: data.userName || 'Unknown',
            room: data.room || 'N/A',
            timeNeeded: `${data.timeFrom || 'N/A'} - ${data.timeTo || 'N/A'}`,
            program: data.program || 'N/A',
            course: data.course || 'N/A',
            courseDescription: data.reason || 'N/A',
            items: enrichedItems,
            status: 'PENDING',
            message: data.reason || '',
            usageType: data.usageType || '',
          });
        }
  
        const sortedByDate = fetched.sort((a, b) => b.dateRequested - a.dateRequested);
  
        setRequests(sortedByDate); // Update state with new requests
      });
  
      // Clean up the listener when the component unmounts
      return () => unsubscribe();
  
    } catch (err) {
      console.error('Error fetching requests:', err);
      Alert.alert('Error', 'Failed to fetch user requests.');

    } finally {
      setLoading(false);
    }
  };

  const cancelRequest = async () => {
    try {
      if (!user?.id || !selectedRequest?.id) {
        throw new Error('Missing user ID or selected request ID.');
      }

      const userRequestRef = doc(db, `accounts/${user.id}/userRequests`, selectedRequest.id);
      const activityLogRef = doc(db, `accounts/${user.id}/historylog`, selectedRequest.id);
      const requestSnap = await getDoc(userRequestRef);
      if (!requestSnap.exists()) throw new Error('Request not found.');

      const requestData = requestSnap.data();

      await setDoc(activityLogRef, {
        ...requestData,
        status: 'CANCELLED',
        cancelledAt: new Date(),
      });

      await deleteDoc(userRequestRef);

      const rootQuery = query(
        collection(db, 'userrequests'),
        where('accountId', '==', user.id),
        where('timestamp', '==', requestData.timestamp)
      );

      const rootSnap = await getDocs(rootQuery);
      const batchDeletes = [];

      rootSnap.forEach((docSnap) => {
        batchDeletes.push(deleteDoc(doc(db, 'userrequests', docSnap.id)));
      });

      await Promise.all(batchDeletes);

      Alert.alert('Success', 'Request successfully cancelled.');
      setModalVisible(false);
      fetchRequests();

    } catch (err) {
      console.error('Cancel error:', err);
      Alert.alert('Error', 'Failed to cancel the request.');
    }
  };


      const handleStatus =(item)=>{
      if(item.status === 'PENDING') return 'orange';
      if(item.status === 'APPROVED') return '#395a7f';
      if(item.status === 'Materials') return '#f8d496'; 
      if(item.status === 'Reagent') return '#b8e2f4';
      if(item.category === 'Glasswares') return '#fff2ce';
    }


  const renderItem = ({ item }) => (
          <TouchableOpacity onPress={() => { setSelectedRequest(item); setModal2Visible(true); }} style={styles.pendingCard}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#e9ecee', paddingBottom: 5}}>
        <Text style={{backgroundColor: handleStatus(item), fontWeight: 'bold', color: 'white', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 3}}>{item.status}</Text>
        {/* <Text style={{fontWeight: 300, color: 'gray', fontSize: 13}}>{item.dateRequested.toLocaleDateString()}</Text> */}
      </View>

    <View>
      <Text style={{fontWeight: 300, fontSize: 13}}>Items Requested:</Text>
  {item.items?.length > 0 ? (
  item.items.map((innerItem, index) => (
    <View key={index} style={{paddingHorizontal: 10, marginTop: 8, flexDirection: 'row', justifyContent: 'space-between'}}>

        <Text style={{fontWeight: 'bold'}}>{innerItem.itemName}</Text>
        <Text style={{fontWeight: 300}}>x {innerItem.quantity}</Text>
    </View>
  ))
) : (
  <Text style={{ fontStyle: 'italic', color: 'gray' }}>No items found</Text>
)}
    </View>

      <View style={{padding: 10, backgroundColor: '#C8EAF9', marginTop: 5, borderRadius: 5,}}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <Text style={{fontSize: 13}}>Usage Type:</Text>
          <Text style={{fontWeight: 300, fontSize: 13}}>{item.usageType}</Text>
        </View>

        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <Text style={{fontSize: 13}}>Date Required:</Text>
          <Text style={{fontWeight: 'bold', fontSize: 13, color: '#395a7f'}}>{item.dateRequired}</Text>
        </View>
      </View>
    </TouchableOpacity>


  );


  const renderItem2 = ({ item }) => (
    <TouchableOpacity onPress={() => { setSelectedRequest(item); setModal2Visible(true); }} style={styles.pendingCard}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#e9ecee', paddingBottom: 5}}>
        <Text style={{backgroundColor: handleStatus(item), fontWeight: 'bold', color: 'white', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 3}}>{item.status}</Text>
        <Text style={{fontWeight: 300, color: 'gray', fontSize: 13}}>{item.dateRequested.toLocaleDateString()}</Text>
      </View>

    <View>
      <Text style={{fontWeight: 300, fontSize: 13}}>Items Requested:</Text>
  {item.items?.length > 0 ? (
  item.items.map((innerItem, index) => (
    <View key={index} style={{paddingHorizontal: 10, marginTop: 8, flexDirection: 'row', justifyContent: 'space-between'}}>

        <Text style={{fontWeight: 'bold'}}>{innerItem.itemName}</Text>
        <Text style={{fontWeight: 300}}>x {innerItem.quantity}</Text>
    </View>
  ))
) : (
  <Text style={{ fontStyle: 'italic', color: 'gray' }}>No items found</Text>
)}
    </View>

      <View style={{padding: 10, backgroundColor: '#C8EAF9', marginTop: 5, borderRadius: 5,}}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <Text style={{fontSize: 13}}>Usage Type:</Text>
          <Text style={{fontWeight: 300, fontSize: 13}}>{item.usageType}</Text>
        </View>

        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <Text style={{fontSize: 13}}>Date Required:</Text>
          <Text style={{fontWeight: 'bold', fontSize: 13, color: '#395a7f'}}>{item.dateRequired}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  useEffect(() => {
    fetchRequests();
  }, []);

  const position = useRef(new Animated.Value(0)).current; // Animated value for swipe position

  // Interpolate the border position
  const borderTranslateX = position.interpolate({
  inputRange: [0, 1],
  outputRange: [0, 142], // Adjust 150 to match your tab width
});

const pagerRef = useRef(null);

  return (
    
    <View style={styles.container}>
       <View style={styles.OrdersHeader} onLayout={handleHeaderLayout}>
                     <TouchableOpacity onPress={() => navigation.navigate('Admin2Dashboard')} style={styles.backButton}>
                                     <Icon name="keyboard-backspace" size={28} color="black" />
                                   </TouchableOpacity>

                    <View>
                      <Text style={{textAlign: 'center', fontWeight: 800, fontSize: 18, color: '#395a7f'}}>My Orders</Text>
                      <Text style={{ fontWeight: 300, fontSize: 13}}>Monitor Your Orders</Text>
                    </View>

                     <TouchableOpacity style={{padding: 2}}>
                       <Icon name="information-outline" size={24} color="#000" />
                     </TouchableOpacity>
                   </View>

            
      
      {/* <View style={[styles.topNav, {marginTop:headerHeight-3}]}>
        <TouchableOpacity style={{width: '50%', backgroundColor: '#fff', justifyContent:'center',alignItems:'center'}}
          onPress={() => pagerRef.current.setPage(0)}
        >
          <Text style={{fontWeight: 'bold', fontSize: 15}}>Processed</Text>
 
        </TouchableOpacity>

        <Text style={{fontSize: 20, color: 'gray'}}>|</Text>

        <TouchableOpacity style={{width: '50%', backgroundColor: 'white',justifyContent:'center',alignItems: 'center'}}
        onPress={() => pagerRef.current.setPage(1)}
        >
        </TouchableOpacity>

         <Animated.View style={[styles.border, { transform: [{ translateX: borderTranslateX }] }]} />
      </View> */}

<View style={{flex:1, borderRadius: 5, overflow: 'hidden', marginTop: headerHeight-3}}>
      <PagerView ref={pagerRef} style={[styles.containerInner]} initialPage={0}
      onPageScroll={(event) => {
          Animated.spring(position, {
    toValue: event.nativeEvent.position,
    stiffness: 200, // Adjust bounce effect
    damping: 50, // Smooth motion
    useNativeDriver: false,
  }).start();
      }}
      >
      <View key="1" style={styles.page}>

          <View style={[styles.searchFilter]}>
              <View style={{height: 45, flexDirection: 'row', gap: 5, paddingHorizontal: 2}}>
                <View style={styles.searchContainer}>
                  <Icon name="magnify" size={20} color="#888"  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search"
                    value={searchQuery}
                    onChangeText={handleSearch}
                  />
                </View>
      
              </View>
      
              <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['All', 'Approved', 'Rejected', 'Cancelled', 'Deployed'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 14,
                      backgroundColor: statusFilter === status ? '#007BFF' : '#e0e0e0',
                      borderRadius: 20,
                      marginRight: 8,
                    }}
                    onPress={() => setStatusFilter(status)}
                  >
                    <Text style={{ color: statusFilter === status ? '#fff' : '#333', fontWeight: '500' }}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            </View>

          <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
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
      
            <Modal visible={modalVisible} transparent animationType="fade">
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
              <Text style={styles.modalText}>Course: {selectedLog?.course || 'N/A'}</Text>
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
                    <Text style={[styles.tableHeaderText, { flex: 2 }]}>Item Description</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>Qty</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>Category</Text>
                    {/* <Text style={[styles.tableHeaderText, { flex: 1 }]}>Condition</Text> */}
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
                      <Text style={[styles.tableCell, { flex: 2 }]}>{item.itemDetails}</Text>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{item.quantity}</Text>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{item.category || '—'}</Text>
                      {/* <Text style={[styles.tableCell, { flex: 1 }]}>{item.condition || '—'}</Text> */}
                      {/* <Text style={[styles.tableCell, { flex: 1 }]}>
                        {typeof item.condition === 'object'
                          ? `Good: ${item.condition.Good ?? 0}, Defect: ${item.condition.Defect ?? 0}, Damage: ${item.condition.Damage ?? 0}`
                          : item.condition || '—'}
                      </Text> */}
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

      <View key="2" style={styles.page}>
         {loading ? (
        <ActivityIndicator size="large" color="#1890ff" style={{ marginTop: 30 }} />
      ) : requests.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>No requests found.</Text>
      ) : (
        <View style={{flex: 1, backgroundColor: '#fff', padding: 10}}>
          <View style={{flexDirection: 'row', width: '100%', alignItems: 'center', gap: 5, borderBottomWidth: 1, paddingBottom: 5, borderColor: '#e9ecee'}}>
                    <Icon name='clock-outline' size={23} color='#6abce2'/>
                    <Text style={{color: '#6abce2', fontSize: 15, fontWeight: 'bold'}}>Pending Orders</Text>
                  </View>
            <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem2}
          contentContainerStyle={styles.listContainer}
        />
        </View>
        
      )}

      <Modal visible={modal2Visible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <StatusBar
          translucent
          backgroundColor={'transparent'}
          />
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Details - {selectedRequest?.id}</Text>
            <Text><Text style={styles.label}>Requester:</Text> {selectedRequest?.requester}</Text>
            <Text><Text style={styles.label}>Requisition Date:</Text> {selectedRequest?.dateRequested?.toLocaleDateString()}</Text>
            <Text><Text style={styles.label}>Date Required:</Text> {selectedRequest?.dateRequired}</Text>
            <Text><Text style={styles.label}>Time Needed:</Text> {selectedRequest?.timeNeeded}</Text>
            <Text><Text style={styles.label}>Course Code:</Text> {selectedRequest?.course}</Text>
            <Text><Text style={styles.label}>Course Description:</Text> {selectedRequest?.courseDescription}</Text>
            <Text><Text style={styles.label}>Room:</Text> {selectedRequest?.labRoom}</Text>

            <Text style={styles.subTitle}>Requested Items:</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderCell}>Item ID</Text>
                  <Text style={styles.tableHeaderCell}>Item Name</Text>
                  <Text style={styles.tableHeaderCell}>Item Description</Text>
                  <Text style={styles.tableHeaderCell}>Qty</Text>
                  <Text style={styles.tableHeaderCell}>Dept</Text>
                  <Text style={styles.tableHeaderCell}>Usage</Text>
                </View>
                
                {selectedRequest?.items.map((item, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{item.itemIdFromInventory}</Text>
                    <Text style={styles.tableCell}>{item.itemName}</Text>
                    <Text style={styles.tableCell}>{item.itemDetails}</Text>
                    <Text style={styles.tableCell}>{item.quantity}</Text>
                    <Text style={styles.tableCell}>{item.department}</Text>
                    <Text style={styles.tableCell}>{item.usageType}</Text>
                  </View>
                ))}
              </View>

            <Text><Text style={styles.label}>Message:</Text> {selectedRequest?.message || 'No message provided.'}</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={cancelRequest} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel Request</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModal2Visible(false)} style={styles.closeButton}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
      </View>

      </PagerView>
</View>


      
    </View>
  );
}
