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
  StatusBar,
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
import moment from 'moment'
import { Picker } from '@react-native-picker/picker';
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
  const statusOptions = [
    { label: 'All', value: 'All' },
    { label: 'Approved', value: 'Request Approved' },
    { label: 'Rejected', value: 'Request Rejected' },
    { label: 'Cancelled', value: 'Cancelled a request' },
    { label: 'Deployed', value: 'Deployed' },
    { label: 'Returned', value: 'Returned' },
  ];
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

  // const handleSearch = (query) => {
  //   setSearchQuery(query);

  //   const filtered = activityData.filter((item) => {
  //     const matchesQuery =
  //       item.date.includes(query) ||
  //       item.action.toLowerCase().includes(query.toLowerCase()) ||
  //       item.by.toLowerCase().includes(query.toLowerCase());

  //     const matchesStatus =
  //       statusFilter === 'All' || item.action === statusFilter;

  //     return matchesQuery && matchesStatus;
  //   });

  //   setFilteredData(filtered);
  // };

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
      if(item.action === 'APPROVED') return '#134b5f';
      if(item.action === 'DEPLOYED') return '#2596be'; 
      if(item.action === 'COMPLETED') return '#18b933ff';
      if(item.category === 'Glasswares') return '#fff2ce';
    }


const filteredApproved = activityData
  .filter(req => req.action === 'Request Approved')
  .map(req => ({
    ...req,
    action: 'APPROVED', // just for UI
    items: req.items || req.requestList || [] // ensure array exists
  }));

  const filteredDeployed = activityData
  .filter(req => req.action === 'Deployed')
  .map(req => ({
    ...req,
    action: 'DEPLOYED', // just for UI
    items: req.items || req.requestList || [] // ensure array exists
  }));

  const filteredReturned = activityData
  .filter(req => req.action === 'Returned')
  .map(req => ({
    ...req,
    action: 'COMPLETED', // just for UI
    items: req.items || req.requestList || [] // ensure array exists
  }));

  const renderPending = ({ item }) => (
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

      <View style={{padding: 10, backgroundColor: '#d3eaf2', marginTop: 5, borderRadius: 5,}}>
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

//     useEffect(() => {
//   console.log("Selected Log:", selectedLog);
// }, [selectedLog]);

const renderItem = ({ item }) => {
  const data = item.fullData; // actual Firestore fields
  return (
    <TouchableOpacity
      onPress={() => {
        setSelectedLog(data);
        setModalVisible(true);
      }}
      style={styles.pendingCard}
    >
      {/* Status and Date */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: '#e9ecee',
        paddingBottom: 5
      }}>
        <Text style={{
          backgroundColor: handleStatus(item),
          fontWeight: 'bold',
          color: "white",
          paddingHorizontal: 10,
          paddingVertical: 3,
          borderRadius: 3
        }}>
          {item.action}
        </Text>
        <Text style={{ fontWeight: '300', color: 'gray', fontSize: 13 }}>
          {data.dateRequested}
        </Text>
      </View>

      {/* Items Requested */}
      <View>
        <Text style={{ fontWeight: '300', fontSize: 13 }}>Items Requested:</Text>
        {data.requestList?.length > 0 ? (
          data.requestList.map((innerItem) => (
            <View
              key={innerItem.id || `${innerItem.itemName}-${innerItem.quantity}`}
              style={{
                paddingHorizontal: 10,
                marginTop: 8,
                flexDirection: 'row',
                justifyContent: 'space-between'
              }}
            >
              <Text style={{ fontWeight: 'bold' }}>{innerItem.itemName}</Text>
              <Text style={{ fontWeight: '300' }}>x {innerItem.quantity}</Text>
            </View>
          ))
        ) : (
          <Text style={{ fontStyle: 'italic', color: 'gray' }}>No items found</Text>
        )}
      </View>

      {/* Usage Type & Date Required */}
      <View style={{
        padding: 10,
        backgroundColor: '#d3eaf2',
        marginTop: 5,
        borderRadius: 5
      }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Text style={{ fontSize: 13 }}>Usage Type:</Text>
          <Text style={{ fontWeight: '300', fontSize: 13 }}>
            {data.usageType}
          </Text>
        </View>

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Text style={{ fontSize: 13 }}>Date Required:</Text>
          <Text style={{
            fontWeight: 'bold',
            fontSize: 13,
            color: '#395a7f'
          }}>
            {data.dateRequired}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};


const renderDeployed = ({ item }) => {
  const data = item.fullData; // actual Firestore fields
  return (
    <TouchableOpacity
      onPress={() => {
        setSelectedLog(data);
        setModalVisible(true);
      }}
      style={styles.pendingCard}
    >
      {/* Status and Date */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: '#e9ecee',
        paddingBottom: 5
      }}>
        <Text style={{
          backgroundColor: handleStatus(item),
          fontWeight: 'bold',
          color: 'white',
          paddingHorizontal: 10,
          paddingVertical: 3,
          borderRadius: 3
        }}>
          {item.action}
        </Text>
        <Text style={{ fontWeight: '300', color: 'gray', fontSize: 13 }}>
          {data.dateRequested}
        </Text>
      </View>

      {/* Items Requested */}
      <View>
        <Text style={{ fontWeight: '300', fontSize: 13 }}>Items Requested:</Text>
        {data.requestList?.length > 0 ? (
          data.requestList.map((innerItem) => (
            <View
              key={innerItem.id || `${innerItem.itemName}-${innerItem.quantity}`}
              style={{
                paddingHorizontal: 10,
                marginTop: 8,
                flexDirection: 'row',
                justifyContent: 'space-between'
              }}
            >
              <Text style={{ fontWeight: 'bold' }}>{innerItem.itemName}</Text>
              <Text style={{ fontWeight: '300' }}>x {innerItem.quantity}</Text>
            </View>
          ))
        ) : (
          <Text style={{ fontStyle: 'italic', color: 'gray' }}>No items found</Text>
        )}
      </View>

      {/* Usage Type & Date Required */}
      <View style={{
        padding: 10,
        backgroundColor: '#d3eaf2',
        marginTop: 5,
        borderRadius: 5
      }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Text style={{ fontSize: 13 }}>Usage Type:</Text>
          <Text style={{ fontWeight: '300', fontSize: 13 }}>
            {data.usageType}
          </Text>
        </View>

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Text style={{ fontSize: 13 }}>Date Required:</Text>
          <Text style={{
            fontWeight: 'bold',
            fontSize: 13,
            color: '#395a7f'
          }}>
            {data.dateRequired}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};


// const renderDeployed = ({ item }) => (
//   <TouchableOpacity onPress={() => { setSelectedRequest(item); setModal2Visible(true); }} style={styles.pendingCard}>
//     <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#e9ecee', paddingBottom: 5}}>
//       <Text style={{backgroundColor: handleStatus(item), fontWeight: 'bold', color: 'white', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 3}}>{item.status}</Text>
//       <Text style={{fontWeight: 300, color: 'gray', fontSize: 13}}>{item.dateRequested.toLocaleDateString()}</Text>
//     </View>

//     <View>
//       <Text style={{fontWeight: 300, fontSize: 13}}>Items Requested:</Text>
//       {item.items?.length > 0 ? (
//         item.items.map((innerItem, index) => (
//           <View key={index} style={{paddingHorizontal: 10, marginTop: 8, flexDirection: 'row', justifyContent: 'space-between'}}>
//             <Text style={{fontWeight: 'bold'}}>{innerItem.itemName}</Text>
//             <Text style={{fontWeight: 300}}>x {innerItem.quantity}</Text>
//           </View>
//         ))
//       ) : (
//         <Text style={{ fontStyle: 'italic', color: 'gray' }}>No items found</Text>
//       )}
//     </View>

//     <View style={{padding: 10, backgroundColor: '#C8EAF9', marginTop: 5, borderRadius: 5,}}>
//       <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
//         <Text style={{fontSize: 13}}>Usage Type:</Text>
//         <Text style={{fontWeight: 300, fontSize: 13}}>{item.usageType}</Text>
//       </View>

//       <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
//         <Text style={{fontSize: 13}}>Date Required:</Text>
//         <Text style={{fontWeight: 'bold', fontSize: 13, color: '#395a7f'}}>{item.dateRequired}</Text>
//       </View>
//     </View>
//   </TouchableOpacity>
// );


  useEffect(() => {
    fetchRequests();
  }, []);

  const position1 = useRef(new Animated.Value(0)).current; // Animated value for swipe position

  // Interpolate the border position
  const borderTranslateX = position1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 142], // Adjust 150 to match your tab width
  });

  const hasUnitColumn = (selectedLog?.filteredMergedData || selectedLog?.requestList)?.some(
    (item) => ["Chemical", "Reagent"].includes(item.category)
  );

  const pagerRef = useRef(null);
  const [activePage, setActivePage] = useState(0);
   const position = useRef(new Animated.Value(0)).current;

    const handlePageSelected = (e) => {
    setActivePage(e.nativeEvent.position); // Update active page on PagerView change
  };

    const handleButtonPress = (nextPage) => {
    if (pagerRef.current) {
      pagerRef.current.setPage(nextPage); // Change the page programmatically
    }
  };

  return (
    
    <View style={styles.container}>
      <View 
        style={[styles.OrdersHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} 
        onLayout={handleHeaderLayout}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="keyboard-backspace" size={28} color="black" />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontWeight: '800', fontSize: 18, color: '#395a7f', textAlign: 'center' }}>
            Submitted Requisitions
          </Text>
          <Text style={{ fontWeight: '300', fontSize: 13, textAlign: 'center' }}>
            Monitor Your Orders
          </Text>
        </View>

        {/* <TouchableOpacity style={{ padding: 2 }}>
          <Icon name="information-outline" size={24} color="#000" />
        </TouchableOpacity> */}
      </View>


<View style={{flex:1, borderRadius: 5, overflow: 'hidden', marginTop: headerHeight-3, gap: 5}}>
  <View style={styles.btnContainer}>
    <TouchableOpacity style={[styles.timelineBtn, activePage === 0 && styles.activeBtn]}
    onPress={()=>handleButtonPress(0)}>
      <Icon name={activePage ===0 ? "clock": "clock-outline"} size={20} color="#165a72" />
      <Text style={styles.timeText}>Pending</Text>
    </TouchableOpacity>

    <TouchableOpacity style={[styles.timelineBtn, activePage === 1 && styles.activeBtn]}
    onPress={()=>handleButtonPress(1)}>
      <Icon name={activePage ===1  ? "thumb-up":"thumb-up-outline"} size={20} color="#165a72" />
      <Text style={styles.timeText}>Approved</Text>
    </TouchableOpacity>

    <TouchableOpacity style={[styles.timelineBtn, activePage === 2 && styles.activeBtn]}
    onPress={()=>handleButtonPress(2)}>
      <Icon name={activePage === 2 ? "send":"send-outline"} size={20} color="#165a72" />
      <Text style={styles.timeText}>Deployed</Text>
    </TouchableOpacity>

    <TouchableOpacity style={[styles.timelineBtn, activePage === 3 && styles.activeBtn]}
    onPress={()=>handleButtonPress(3)}>
      <Icon name={activePage === 3 ? "check-circle":"check-circle-outline"} size={20} color="#165a72" />
      <Text style={styles.timeText}>Completed</Text>
    </TouchableOpacity>
  </View>

      <PagerView
        ref={pagerRef}
        style={[styles.containerInner]}
        initialPage={0}
        onPageSelected={handlePageSelected} // Handle page change
        onPageScroll={(event) => {
          // Track the position during scroll
          Animated.spring(position, {
            toValue: event.nativeEvent.offset, // Adjusts based on the scroll offset
            stiffness: 200,
            damping: 50,
            useNativeDriver: false, // Use native driver for smoother performance
          }).start();
        }}
      >
          <View key="1" style={styles.page}>
         {loading ? (
        <ActivityIndicator size="large" color="#1890ff" style={{ marginTop: 30 }} />
      ) : requests.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>No requests found.</Text>
      ) : (
        <View style={{flex: 1, backgroundColor: '#fff', padding: 10}}>
          <View style={{flexDirection: 'row', width: '100%', alignItems: 'center', gap: 5, borderBottomWidth: 1, paddingBottom: 5, borderColor: '#e9ecee'}}>
                    <Icon name='clock-outline' size={23} color='#e7c247ff'/>
                    <Text style={{color: '#e7c247ff', fontSize: 15, fontWeight: 'bold'}}>Pending Orders</Text>
                  </View>
            <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderPending}
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
            <Text style={styles.modalTitle}>Request Details</Text>
            <Text><Text style={styles.label}>Requester:</Text> {selectedRequest?.requester}</Text>
            <Text><Text style={styles.label}>Requisition Date:</Text> {selectedRequest?.dateRequested?.toLocaleDateString()}</Text>
            <Text><Text style={styles.label}>Date Required:</Text> {selectedRequest?.dateRequired}</Text>
            <Text><Text style={styles.label}>Time Needed:</Text> {selectedRequest?.timeNeeded}</Text>
            <Text><Text style={styles.label}>Course Code:</Text> {selectedRequest?.course}</Text>
            <Text><Text style={styles.label}>Course Description:</Text> {selectedRequest?.courseDescription}</Text>
            {/* <Text><Text style={styles.label}>Room:</Text> {selectedRequest?.labRoom}</Text> */}
            <Text>
              <Text style={styles.label}>Room: </Text>
              {selectedRequest?.labRoom || selectedRequest?.room || 'N/A'}
            </Text>
            <Text><Text style={styles.label}>Room:</Text> {selectedRequest?.usageType}</Text>

            <Text style={styles.subTitle}>Requested Items:</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderCell}>Item ID</Text>
                  <Text style={styles.tableHeaderCell}>Item Name</Text>
                  <Text style={styles.tableHeaderCell}>Item Description</Text>
                  <Text style={styles.tableHeaderCell}>Qty</Text>
                  {hasUnitColumn && <Text style={styles.tableHeaderCell}>Unit</Text>}
                  <Text style={styles.tableHeaderCell}>Dept</Text>
                </View>
                
                {selectedRequest?.items.map((item, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{item.itemIdFromInventory}</Text>
                    <Text style={styles.tableCell}>{item.itemName}</Text>
                    <Text style={styles.tableCell}>{item.itemDetails}</Text>
                    <Text style={styles.tableCell}>{item.quantity}</Text>
                    {hasUnitColumn && (
                      <Text style={styles.tableCell}>
                        {["Chemical", "Reagent"].includes(item.category) ? item.unit || '—' : '—'}
                      </Text>
                    )}
                    <Text style={styles.tableCell}>{item.department}</Text>
                  </View>
                ))}
              </View>

            <Text><Text style={styles.label}>Message:</Text> {selectedRequest?.message || 'No message provided.'}</Text>

            <View style={styles.modalButtons}>


              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Confirm Cancellation',
                    'Are you sure you want to cancel this request?',
                    [
                      {
                        text: 'No',
                        style: 'cancel',
                        onPress: () => setModal2Visible(false), // closes modal if user cancels
                      },
                      {
                        text: 'Yes, Cancel',
                        style: 'destructive',
                        onPress: () => {
                          cancelRequest(); // your existing cancel logic
                          setModal2Visible(false); // close the modal after cancelling
                        },
                      },
                    ],
                    { cancelable: true }
                  );
                }}
                style={styles.cancelButton1}
              >
                <Text style={styles.cancelButton}>Cancel Request</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setModal2Visible(false)} style={styles.closeButton}>
                <Text style={styles.closeText1}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
      </View>

      <View key="2" style={styles.page}>
          <View style={{flex: 1, backgroundColor: '#fff', padding: 10}}>
          <View style={{flexDirection: 'row', width: '100%', alignItems: 'center', gap: 5, borderBottomWidth: 1, paddingBottom: 5, borderColor: '#e9ecee'}}>
                    <Icon name='thumb-up-outline' size={23} color='#134b5f'/>
                    <Text style={{color: '#134b5f', fontSize: 15, fontWeight: 'bold'}}>Approved Orders</Text>
                  </View>

        <FlatList
          data={filteredApproved} // Approved items from the right collection
          keyExtractor={(item) => item.id || item.key || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />

        </View>

          {/* <View style={[styles.searchFilter]}>
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


              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingTop: 10 }}>
                {[
                  { label: 'All', value: 'All' },
                  { label: 'Approved', value: 'Request Approved' },
                  { label: 'Rejected', value: 'Request Rejected' },
                  { label: 'Cancelled', value: 'Cancelled a request' },
                  { label: 'Deployed', value: 'Deployed' },
                  { label: 'Returned', value: 'Returned' },
                ].map((status) => (
                  <TouchableOpacity
                    key={status.value}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 14,
                      backgroundColor: statusFilter === status.value ? '#1a6985' : '#e0e0e0',
                      borderRadius: 20,
                      marginRight: 8,
                    }}
                    onPress={() => setStatusFilter(status.value)}
                  >
                    <Text
                      style={{
                        color: statusFilter === status.value ? '#fff' : '#333',
                        fontWeight: '500',
                      }}
                    >
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              

            </View>
            </View>


      
    
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
                  style={[index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd, {padding: 10, paddingVertical: 15, backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#ececec'}]}
                >
                  <View style={{ flexDirection: 'row' }}>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {log.date.slice(0, 12)}
                  </Text>


                    <Text style={[styles.tableCell, { flex: 1 }]}>{log.action}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{log.by}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView> */}
<Modal visible={modalVisible} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalCard}>
      <Text style={styles.modalTitle}>
        {selectedLog?.status === 'CANCELLED'
          ? 'Cancelled a Request'
          : selectedLog?.action || 'Modified a Request'}
      </Text>

      <ScrollView style={styles.modalScroll}>
        <View style={styles.infoSection}>
          <Text style={styles.modalLabel}>By:</Text>
          <Text style={styles.modalValue}>{selectedLog?.userName || 'Unknown User'}</Text>

          <Text style={styles.modalLabel}>Program:</Text>
          <Text style={styles.modalValue}>{selectedLog?.program || 'N/A'}</Text>

          <Text style={styles.modalLabel}>Course:</Text>
          <Text style={styles.modalValue}>{selectedLog?.course || 'N/A'}</Text>

          <Text style={styles.modalLabel}>Note:</Text>
          <Text style={styles.modalValue}>{selectedLog?.reason || 'N/A'}</Text>

          <Text style={styles.modalLabel}>Room:</Text>
          <Text style={styles.modalValue}>{selectedLog?.room || 'N/A'}</Text>

          <Text style={styles.modalLabel}>Time:</Text>
          <Text style={styles.modalValue}>
            {selectedLog?.timeFrom && selectedLog?.timeTo
              ? `${selectedLog.timeFrom} - ${selectedLog.timeTo}`
              : 'N/A'}
          </Text>

          <Text style={styles.modalLabel}>Date Required:</Text>
          <Text style={styles.modalValue}>{selectedLog?.dateRequired || 'N/A'}</Text>
        </View>

<Text style={styles.modalSubtitle}>Items</Text>

{selectedLog?.requestList?.length > 0 ? (
  <View style={styles.table}>
    <View style={styles.tableHeader2}>
      <Text style={[styles.tableHeaderText2, { flex: 2 }]}>Item</Text>
      <Text style={[styles.tableHeaderText2, { flex: 2 }]}>Description</Text>
      <Text style={[styles.tableHeaderText2, { flex: 1 }]}>Qty</Text>
      {hasUnitColumn && <Text style={[styles.tableHeaderText2, { flex: 1 }]}>Unit</Text>}
      <Text style={[styles.tableHeaderText2, { flex: 1 }]}>Category</Text>
    </View>

    {selectedLog.requestList.map((item, index) => (
      <View
        key={item.id || index}
        style={[
          styles.tableRow,
          index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
        ]}
      >
        <Text style={[styles.tableCell2, { flex: 2 }]}>{item.itemName}</Text>
        <Text style={[styles.tableCell2, { flex: 2 }]}>{item.itemDetails}</Text>
        <Text style={[styles.tableCell2, { flex: 1 }]}>{item.quantity}</Text>
        {hasUnitColumn && (
          <Text style={[styles.tableCell2, { flex: 1 }]}>
            {["Chemical", "Reagent"].includes(item.category) ? item.unit || "—" : "—"}
          </Text>
        )}
        <Text style={[styles.tableCell2, { flex: 1 }]}>{item.category || "—"}</Text>
      </View>
    ))}
  </View>
) : (
  <Text style={styles.modalValue}>None</Text>
)}



      </ScrollView>

      <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
      </View>


      <View key="3" style={styles.page}>
                  <View style={{flex: 1, backgroundColor: '#fff', padding: 10}}>
          <View style={{flexDirection: 'row', width: '100%', alignItems: 'center', gap: 5, borderBottomWidth: 1, paddingBottom: 5, borderColor: '#e9ecee'}}>
                    <Icon name='send-outline' size={23} color='#6abce2'/>
                    <Text style={{color: '#6abce2', fontSize: 15, fontWeight: 'bold'}}>Deployed Orders</Text>
                  </View>

        <FlatList
          data={filteredDeployed} // Approved items from the right collection
          keyExtractor={(item) => item.id || item.key || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
        </View>
      </View>

      <View key="4" style={styles.page}>
                  <View style={{flex: 1, backgroundColor: '#fff', padding: 10}}>
          <View style={{flexDirection: 'row', width: '100%', alignItems: 'center', gap: 5, borderBottomWidth: 1, paddingBottom: 5, borderColor: '#e9ecee'}}>
                    <Icon name='check-circle-outline' size={23} color='#40cf70ff'/>
                    <Text style={{color: '#40cf70ff', fontSize: 15, fontWeight: 'bold'}}>Completed Orders</Text>
                  </View>

        <FlatList
          data={filteredReturned} // Approved items from the right collection
          keyExtractor={(item) => item.id || item.key || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
        </View>
      </View>
      </PagerView>
</View>


      
    </View>
  );
}
