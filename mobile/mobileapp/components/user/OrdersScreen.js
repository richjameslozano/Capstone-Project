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
  TouchableWithoutFeedback,
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
  onSnapshot,
  addDoc,
  serverTimestamp,
  collectionGroup
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
import { Calendar } from 'react-native-calendars';
import Icon2 from 'react-native-vector-icons/Ionicons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import WarningModal from '../customs/WarningModal';

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
  const [reorderModalVisible, setReorderModalVisible] = useState(false);
  const [selectedCompletedOrder, setSelectedCompletedOrder] = useState(null);
  const [reorderForm, setReorderForm] = useState({
    dateRequired: '',
    timeFrom: '',
    timeTo: '',
    reason: ''
  });
  
  // Date and Time Picker States
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [timePickerType, setTimePickerType] = useState('start');
  const [selectedStartTime, setSelectedStartTime] = useState({ hour: '10', minute: '00', period: 'AM' });
  const [selectedEndTime, setSelectedEndTime] = useState({ hour: '3', minute: '00', period: 'PM' });
  const [isWarningModalVisible, setIsWarningModalVisible] = useState(false);
  const [daysDifference, setDaysDifference] = useState(0);
  const [liabilityAccepted, setLiabilityAccepted] = useState(false);
  
  // Date constraints
  const today = moment().format('YYYY-MM-DD');
  const maxDate = moment().add(3, 'weeks').format('YYYY-MM-DD');
  const statusOptions = [
    { label: 'All', value: 'All' },
    { label: 'Approved', value: 'Request Approved' },
    { label: 'Rejected', value: 'Request Rejected' },
    { label: 'Cancelled', value: 'Cancelled a request' },
    { label: 'Deployed', value: 'Deployed' },
    { label: 'Returned', value: 'Returned' },
    { label: 'Released', value: 'Released' },
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

      // Write to activity log
      await setDoc(activityLogRef, {
        ...requestData,
        status: "CANCELLED",
        cancelledAt: serverTimestamp(),
      });

      // Also add to activitylog collection for Activity Log page
      await addDoc(collection(db, `accounts/${user.id}/activitylog`), {
        action: "Cancelled a request",
        userName: requestData.userName,
        timestamp: serverTimestamp(),
        requestList: requestData.filteredMergedData || [],
        status: "CANCELLED",
        dateRequired: requestData.dateRequired,
        timeFrom: requestData.timeFrom,
        timeTo: requestData.timeTo,
        program: requestData.program,
        room: requestData.room,
        reason: requestData.reason,
        usageType: requestData.usageType,
        department: requestData.department
      });

      // Remove the notification from allNotifications (delete the most recent one for this user)
      const notificationQuery = query(
        collection(db, "allNotifications"),
        where("userId", "==", user.id),
        where("action", "==", `New requisition submitted by ${requestData.userName}`),
        where("read", "==", false)
      );

      const notificationSnap = await getDocs(notificationQuery);
      
      if (notificationSnap.docs.length > 0) {
        // Sort by timestamp to get the most recent notification
        const sortedNotifications = notificationSnap.docs.sort((a, b) => {
          const timestampA = a.data().timestamp?.seconds || 0;
          const timestampB = b.data().timestamp?.seconds || 0;
          return timestampB - timestampA; // Most recent first
        });
        
        // Delete the most recent notification
        const mostRecentNotification = sortedNotifications[0];
        console.log("Deleting most recent notification:", mostRecentNotification.id);
        await deleteDoc(doc(db, "allNotifications", mostRecentNotification.id));
      }

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

  // Reorder functionality
  const handleReorder = (completedOrder) => {
    console.log('Completed order data:', completedOrder);
    console.log('Full data:', completedOrder.fullData);
    console.log('Items in fullData:', completedOrder.fullData?.filteredMergedData || completedOrder.fullData?.requestList);
    setSelectedCompletedOrder(completedOrder);
    
    // Initialize form with original order data
    setReorderForm({
      dateRequired: completedOrder.fullData.dateRequired || '',
      timeFrom: completedOrder.fullData.timeFrom || '',
      timeTo: completedOrder.fullData.timeTo || '',
      reason: completedOrder.fullData.reason || ''
    });

    // Initialize time picker states with original times
    if (completedOrder.fullData.timeFrom) {
      const startTime = convert24HourTo12Hour(completedOrder.fullData.timeFrom);
      setSelectedStartTime(startTime);
    }
    if (completedOrder.fullData.timeTo) {
      const endTime = convert24HourTo12Hour(completedOrder.fullData.timeTo);
      setSelectedEndTime(endTime);
    }
    
    setReorderModalVisible(true);
  };

  // Helper function to convert 24-hour format to 12-hour format for time picker
  const convert24HourTo12Hour = (time24) => {
    const [hours, minutes] = time24.split(':');
    let hour = parseInt(hours);
    const minute = minutes;
    const period = hour >= 12 ? 'PM' : 'AM';
    
    if (hour === 0) hour = 12;
    else if (hour > 12) hour = hour - 12;
    
    return {
      hour: hour.toString(),
      minute: minute,
      period: period
    };
  };

  // Function to clean item data by removing returned-specific fields
  const cleanItemData = (items) => {
    if (!Array.isArray(items)) return [];
    
    return items.map(item => {
      const cleanedItem = { ...item };
      
      // Remove returned-specific fields
      delete cleanedItem.returnedQuantity;
      delete cleanedItem.scannedCount;
      delete cleanedItem.conditions;
      delete cleanedItem.dateReturned;
      
      // Debug: Log the cleaning process
      console.log('Original item before cleaning:', item);
      console.log('Cleaned item after removing returned fields:', cleanedItem);
      
      return cleanedItem;
    });
  };

  // Validation function for schedule conflicts
  const isRoomTimeConflict = async (room, timeFrom, timeTo, dateRequired) => {
    const roomLower = room.toLowerCase();

    const checkConflict = (docs) => {
      return docs.some((doc) => {
        const data = doc.data();
        const docRoom = data.room?.toLowerCase();
        const docDate = data.dateRequired;
        const docTimeFrom = data.timeFrom;
        const docTimeTo = data.timeTo;

        return (
          docRoom === roomLower &&
          docDate === dateRequired &&
          (
            (timeFrom >= docTimeFrom && timeFrom < docTimeTo) || 
            (timeTo > docTimeFrom && timeTo <= docTimeTo) ||  
            (timeFrom <= docTimeFrom && timeTo >= docTimeTo)   
          )
        );
      });
    };

    const userRequestsSnap = await getDocs(collectionGroup(db, 'userRequests'));
    const borrowCatalogSnap = await getDocs(collection(db, 'borrowCatalog'));

    const conflictInRequests = checkConflict(userRequestsSnap.docs);
    const conflictInCatalog = checkConflict(borrowCatalogSnap.docs);

    return conflictInRequests || conflictInCatalog;
  };

  // Validation function for stock availability
  const validateStockAvailability = async (items) => {
    const inventoryRef = collection(db, "inventory");
    const inventorySnapshot = await getDocs(inventoryRef);
    const inventoryMap = {};
    
    inventorySnapshot.forEach((doc) => {
      inventoryMap[doc.id] = doc.data();
    });

    const stockIssues = [];
    
    for (const item of items) {
      const inventoryId = item.selectedItemId || item.selectedItem?.value;
      if (inventoryId && inventoryMap[inventoryId]) {
        const availableQuantity = inventoryMap[inventoryId].quantity || 0;
        const requestedQuantity = item.quantity || 0;
        
        if (requestedQuantity > availableQuantity) {
          stockIssues.push({
            itemName: item.itemName,
            requested: requestedQuantity,
            available: availableQuantity
          });
        }
      }
    }
    
    return stockIssues;
  };

  const handleReorderConfirm = async () => {
    try {
      if (!user?.id || !selectedCompletedOrder) {
        throw new Error("Missing user ID or selected order.");
      }

      // Get the original items and clean them of returned-specific data
      const originalItems = selectedCompletedOrder.fullData.filteredMergedData || selectedCompletedOrder.fullData.requestList || [];
      console.log('Original items from Firestore:', originalItems);
      const cleanedItems = cleanItemData(originalItems);
      console.log('Cleaned items after processing:', cleanedItems);

      // Validate schedule conflicts
      const hasConflict = await isRoomTimeConflict(
        selectedCompletedOrder.fullData.room,
        reorderForm.timeFrom,
        reorderForm.timeTo,
        reorderForm.dateRequired
      );

      if (hasConflict) {
        Alert.alert("Schedule Conflict", "The room is already booked for the selected date and time. Please choose a different time slot.");
        return;
      }

      // Validate stock availability
      const stockIssues = await validateStockAvailability(cleanedItems);
      
      if (stockIssues.length > 0) {
        const issueMessages = stockIssues.map(issue => 
          `${issue.itemName}: Requested ${issue.requested}, Available ${issue.available}`
        ).join('\n');
        
        Alert.alert("Insufficient Stock", `Insufficient stock for the following items:\n${issueMessages}\n\nPlease adjust quantities or remove unavailable items.`);
        return;
      }

      // Create a new request based on the completed order with updated date/time
      const newRequest = {
        timestamp: new Date(),
        userName: selectedCompletedOrder.fullData.userName,
        program: selectedCompletedOrder.fullData.program,
        room: selectedCompletedOrder.fullData.room,
        timeFrom: reorderForm.timeFrom,
        timeTo: reorderForm.timeTo,
        dateRequired: reorderForm.dateRequired,
        reason: reorderForm.reason,
        usageType: selectedCompletedOrder.fullData.usageType,
        filteredMergedData: cleanedItems,
        status: "PENDING"
      };

      // Add to userRequests subcollection
      const userRequestsRef = collection(db, `accounts/${user.id}/userRequests`);
      await addDoc(userRequestsRef, newRequest);

      // Add to root userrequests collection
      const rootRequestsRef = collection(db, "userrequests");
      await addDoc(rootRequestsRef, {
        ...newRequest,
        accountId: user.id
      });

      // Add notification
      await addDoc(collection(db, "allNotifications"), {
        action: `New requisition submitted by ${selectedCompletedOrder.fullData.userName}`,
        userId: user.id,
        userName: selectedCompletedOrder.fullData.userName,
        read: false,
        timestamp: serverTimestamp()
      });

      setReorderModalVisible(false);
      setSelectedCompletedOrder(null);
      setReorderForm({
        dateRequired: '',
        timeFrom: '',
        timeTo: '',
        reason: ''
      });
      Alert.alert("Success", "Reorder request submitted successfully!");

    } catch (error) {
      console.error("Error creating reorder request:", error);
      Alert.alert("Error", "Failed to create reorder request.");
    }
  };

  const handleReorderCancel = () => {
    setReorderModalVisible(false);
    setSelectedCompletedOrder(null);
    setReorderForm({
      dateRequired: '',
      timeFrom: '',
      timeTo: '',
      reason: ''
    });
    setLiabilityAccepted(false);
  };

  const handleLiabilityChange = (checked) => {
    setLiabilityAccepted(checked);
  };

  // Function to get liability statement based on item categories
  const getLiabilityStatement = (items) => {
    const categories = [...new Set(items.map(item => item.category))];
    
    // If only one category, show specific statement
    if (categories.length === 1) {
      const category = categories[0];
      switch (category) {
        case 'Equipment':
          return "I am responsible for the proper use, care, and timely return of borrowed equipment. I accept liability for any loss or damage.";
        case 'Glasswares':
          return "I am responsible for the proper handling, cleaning, and timely return of borrowed glasswares. I accept liability for any breakage or damage.";
        case 'Materials':
          return "I am responsible for the proper use, storage, and timely return of borrowed materials. I accept liability for any loss, damage, or contamination.";
        case 'Chemical':
          return "I am responsible for the proper handling, storage, and safe disposal of borrowed chemicals. I accept liability for any spillage or contamination.";
        case 'Reagent':
          return "I am responsible for the proper handling, storage, and timely return of borrowed reagents. I accept liability for any contamination or degradation.";
        default:
          return "I am responsible for the proper use, care, and timely return of borrowed laboratory items. I accept liability for any loss or damage.";
      }
    }
    
    // If mixed categories, show unified statement
    return "I am responsible for the proper use, care, and timely return of all borrowed laboratory items. I accept liability for any loss, damage, or improper use.";
  };

  // Time formatting functions from InventoryScreen
  const formatTime = (timeObj) => {
    if (!timeObj || typeof timeObj !== 'object') return '';

    let { hour, minute, period } = timeObj;
    hour = parseInt(hour);
    minute = parseInt(minute);

    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }

    const paddedHour = hour.toString().padStart(2, '0');
    const paddedMinute = minute.toString().padStart(2, '0');

    return `${paddedHour}:${paddedMinute}`;
  };

  const convertTo24Hour = ({ hour, minute, period }) => {
    let hours = parseInt(hour);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    // Format to HH:mm (24-hour format)
    const formattedHour = hours.toString().padStart(2, '0');
    const formattedMinute = minute.toString().padStart(2, '0');
    return `${formattedHour}:${formattedMinute}`;
  };

  const openTimePicker = (type) => {
    setTimePickerType(type);
    setTimeModalVisible(true);
  };

  const handleStartTimeSelect = (startTime) => {
    const formattedStartTime = convertTo24Hour(startTime);
    setReorderForm(prev => ({
      ...prev,
      timeFrom: formattedStartTime
    }));
  };

  const handleEndTimeSelect = (endTime) => {
    const formattedEndTime = convertTo24Hour(endTime);
    setReorderForm(prev => ({
      ...prev,
      timeTo: formattedEndTime
    }));
  };

  // Function to check if selected date is less than 7 days from today
  const checkDateWarning = (selectedDate) => {
    if (!selectedDate) return false;
    
    const today = moment().startOf('day');
    const selected = moment(selectedDate, "YYYY-MM-DD").startOf('day');
    const daysDiff = selected.diff(today, 'days');
    
    console.log('Date warning check:', {
      selectedDate,
      today: today.format('YYYY-MM-DD'),
      selected: selected.format('YYYY-MM-DD'),
      daysDiff,
      shouldWarn: daysDiff < 7
    });
    
    return daysDiff < 7;
  };

  // Function to get days difference
  const getDaysDifference = (selectedDate) => {
    if (!selectedDate) return 0;
    
    const today = moment().startOf('day');
    const selected = moment(selectedDate, "YYYY-MM-DD").startOf('day');
    const daysDiff = selected.diff(today, 'days');
    
    return daysDiff;
  };

  // Function to increment warning count for user
  const incrementWarningCount = async () => {
    try {
      if (!user?.id) return;

      const userDocRef = doc(db, "accounts", user.id);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentWarningCount = userData.warningCount || 0;
        const currentViolationCount = userData.violationCount || 0;
        
        const newWarningCount = currentWarningCount + 1;
        
        // Check if warnings reach 3, then convert to violation
        if (newWarningCount >= 3) {
          // Reset warnings to 0 and increment violations by 1
          await updateDoc(userDocRef, {
            warningCount: 0,
            violationCount: currentViolationCount + 1
          });
          console.log('Warning count reached 3, converted to violation for user:', user.id);
        } else {
          // Just increment warning count
          await updateDoc(userDocRef, {
            warningCount: newWarningCount
          });
          console.log('Warning count incremented for user:', user.id);
        }
      }
    } catch (error) {
      console.error('Error incrementing warning count:', error);
    }
  };

      const handleStatus =(item)=>{
      if(item.status === 'PENDING') return 'orange';
      if(item.action === 'APPROVED') return '#134b5f';
      if(item.action === 'DEPLOYED') return '#2596be'; 
      if(item.action === 'COMPLETED') return '#18b933ff';
      if(item.action === 'Returned') return '#18b933ff';
      if(item.action === 'Released') return '#28a745';
      if(item.action === 'UNCLAIMED') return '#ff6b35';
      if(item.action === 'REJECTED') return '#dc2626';
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
  .filter(req => req.action === 'Returned' || req.action === 'Released')
  .map(req => ({
    ...req,
    action: req.action, // Keep the original action (Returned or Released)
    items: req.items || req.requestList || [] // ensure array exists
  }));

  const filteredUnclaimed = activityData
  .filter(req => req.action === 'Unclaimed')
  .map(req => ({
    ...req,
    action: 'UNCLAIMED', // just for UI
    items: req.items || req.requestList || [] // ensure array exists
  }));

  const filteredRejected = activityData
  .filter(req => req.action === 'Request Rejected')
  .map(req => ({
    ...req,
    action: 'REJECTED', // just for UI
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
  const isCompleted = item.action === 'Returned' || item.action === 'Released';
  
  return (
    <View style={styles.pendingCard}>
      <TouchableOpacity
        onPress={() => {
          setSelectedLog(data);
          setModalVisible(true);
        }}
        style={{ flex: 1 }}
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

      {/* Reorder Button for Completed Orders */}
      {isCompleted && (
        <TouchableOpacity
          onPress={() => handleReorder(item)}
          style={{
            backgroundColor: '#28a745',
            padding: 10,
            marginTop: 5,
            borderRadius: 5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5
          }}
        >
          <Icon name="refresh" size={16} color="white" />
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
            Reorder
          </Text>
        </TouchableOpacity>
      )}
    </View>
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

    <TouchableOpacity style={[styles.timelineBtn, activePage === 4 && styles.activeBtn]}
    onPress={()=>handleButtonPress(4)}>
      <Icon name={activePage === 4 ? "clock-alert":"clock-alert-outline"} size={20} color="#ff6b35" />
      <Text style={styles.timeText}>Unclaimed</Text>
    </TouchableOpacity>

    <TouchableOpacity style={[styles.timelineBtn, activePage === 5 && styles.activeBtn]}
    onPress={()=>handleButtonPress(5)}>
      <Icon name={activePage === 5 ? "close-circle":"close-circle-outline"} size={20} color="#dc2626" />
      <Text style={styles.timeText}>Rejected</Text>
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
              <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableContainer}>
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
              </ScrollView>

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
  <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableContainer}>
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
  </ScrollView>
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

      <View key="5" style={styles.page}>
                  <View style={{flex: 1, backgroundColor: '#fff', padding: 10}}>
          <View style={{flexDirection: 'row', width: '100%', alignItems: 'center', gap: 5, borderBottomWidth: 1, paddingBottom: 5, borderColor: '#e9ecee'}}>
                    <Icon name='clock-alert-outline' size={23} color='#ff6b35'/>
                    <Text style={{color: '#ff6b35', fontSize: 15, fontWeight: 'bold'}}>Unclaimed Orders</Text>
                  </View>

        <FlatList
          data={filteredUnclaimed} // Unclaimed items from the right collection
          keyExtractor={(item) => item.id || item.key || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
        </View>
      </View>

      <View key="6" style={styles.page}>
                  <View style={{flex: 1, backgroundColor: '#fff', padding: 10}}>
          <View style={{flexDirection: 'row', width: '100%', alignItems: 'center', gap: 5, borderBottomWidth: 1, paddingBottom: 5, borderColor: '#e9ecee'}}>
                    <Icon name='close-circle-outline' size={23} color='#dc2626'/>
                    <Text style={{color: '#dc2626', fontSize: 15, fontWeight: 'bold'}}>Rejected Orders</Text>
                  </View>

        <FlatList
          data={filteredRejected} // Rejected items from the right collection
          keyExtractor={(item) => item.id || item.key || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
        </View>
      </View>
      </PagerView>
</View>

      {/* Reorder Modal */}
      <Modal visible={reorderModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <StatusBar
            translucent
            backgroundColor={'transparent'}
          />
          <View style={[styles.modalContent, { maxHeight: '90%', flex: 1 }]}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { fontSize: 20, fontWeight: 'bold' }]}>Reorder Request</Text>
                <Text style={{ fontSize: 14, color: '#666', marginTop: 5 }}>
                  Please review and modify the details for your reorder request:
                </Text>
              </View>
              <TouchableOpacity onPress={handleReorderCancel} style={{ padding: 5 }}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
              {/* Main Content */}
              <View style={{ gap: 20 }}>
                {/* Original Order Details */}
                <View style={{ backgroundColor: '#f8f9fa', padding: 15, borderRadius: 8 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#333' }}>
                    Original Order Details:
                  </Text>
                  
                  <View style={{ gap: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e9ecee' }}>
                      <Text style={{ fontWeight: '600', color: '#666' }}>Requester:</Text>
                      <Text style={{ color: '#333' }}>{selectedCompletedOrder?.fullData?.userName || 'N/A'}</Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e9ecee' }}>
                      <Text style={{ fontWeight: '600', color: '#666' }}>Program:</Text>
                      <Text style={{ color: '#333' }}>{selectedCompletedOrder?.fullData?.program || 'N/A'}</Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e9ecee' }}>
                      <Text style={{ fontWeight: '600', color: '#666' }}>Room:</Text>
                      <Text style={{ color: '#333' }}>{selectedCompletedOrder?.fullData?.room || 'N/A'}</Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e9ecee' }}>
                      <Text style={{ fontWeight: '600', color: '#666' }}>Usage Type:</Text>
                      <Text style={{ color: '#333' }}>{selectedCompletedOrder?.fullData?.usageType || 'N/A'}</Text>
                    </View>
                  </View>
                </View>

                {/* New Request Details */}
                <View style={{ backgroundColor: '#f8f9fa', padding: 15, borderRadius: 8 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#333' }}>
                    New Request Details:
                  </Text>
                  
                  <View style={{ gap: 15 }}>
                    <View>
                      <Text style={{ fontWeight: '600', color: '#666', marginBottom: 5 }}>
                        Date Required <Text style={{ color: 'red' }}>*</Text>
                      </Text>
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 6, borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 12, paddingVertical: 12 }}
                        onPress={() => setCalendarVisible(true)}
                      >
                        <Text style={{ flex: 1, fontSize: 14, color: reorderForm.dateRequired ? '#333' : '#999' }}>
                          {reorderForm.dateRequired || 'Select Date'}
                        </Text>
                        <Icon name="calendar" size={20} color="#666" />
                      </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 15 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '600', color: '#666', marginBottom: 5 }}>
                          Time From <Text style={{ color: 'red' }}>*</Text>
                        </Text>
                        <TouchableOpacity
                          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 6, borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 12, paddingVertical: 12 }}
                          onPress={() => openTimePicker('start')}
                        >
                          <Text style={{ flex: 1, fontSize: 14, color: reorderForm.timeFrom ? '#333' : '#999' }}>
                            {reorderForm.timeFrom || 'Select Time'}
                          </Text>
                          <Icon name="clock" size={20} color="#666" />
                        </TouchableOpacity>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '600', color: '#666', marginBottom: 5 }}>
                          Time To <Text style={{ color: 'red' }}>*</Text>
                        </Text>
                        <TouchableOpacity
                          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 6, borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 12, paddingVertical: 12 }}
                          onPress={() => openTimePicker('end')}
                        >
                          <Text style={{ flex: 1, fontSize: 14, color: reorderForm.timeTo ? '#333' : '#999' }}>
                            {reorderForm.timeTo || 'Select Time'}
                          </Text>
                          <Icon name="clock" size={20} color="#666" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View>
                      <Text style={{ fontWeight: '600', color: '#666', marginBottom: 5 }}>
                        Note/Reason
                      </Text>
                      <TextInput
                        style={{ 
                          backgroundColor: 'white', 
                          borderRadius: 6, 
                          borderWidth: 1, 
                          borderColor: '#ddd', 
                          padding: 12, 
                          height: 80, 
                          textAlignVertical: 'top',
                          fontSize: 14
                        }}
                        value={reorderForm.reason}
                        onChangeText={(text) => setReorderForm({...reorderForm, reason: text})}
                        placeholder="Enter reason for reorder"
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Items to Reorder */}
              <View style={{ marginTop: 20, backgroundColor: '#f8f9fa', padding: 15, borderRadius: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#333' }}>
                  Items to Reorder:
                </Text>
                
                {selectedCompletedOrder?.fullData?.requestList?.length > 0 ? (
                  <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={true}>
                    <View style={{ gap: 8 }}>
                      {selectedCompletedOrder.fullData.requestList.map((item, index) => (
                        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5 }}>
                          <Text style={{ fontSize: 16, marginRight: 8 }}>•</Text>
                          <Text style={{ fontSize: 14, color: '#333', flex: 1 }}>
                            {item.itemName} - Quantity: {item.quantity} ({item.category || 'N/A'})
                          </Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                ) : (
                  <Text style={{ fontStyle: 'italic', color: '#666' }}>No items found</Text>
                )}
              </View>

              {/* Liability Checkbox */}
              <View style={{
                marginTop: 20,
                padding: 10,
                backgroundColor: '#f8f9fa',
                borderRadius: 6,
                borderWidth: 1,
                borderColor: '#e9ecef'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <TouchableOpacity 
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center',
                      marginRight: 8
                    }}
                    onPress={() => handleLiabilityChange(!liabilityAccepted)}
                    activeOpacity={0.7}
                  >
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: liabilityAccepted ? '#1e7898' : '#ccc',
                      backgroundColor: liabilityAccepted ? '#1e7898' : 'transparent',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 8
                    }}>
                      {liabilityAccepted && (
                        <MaterialCommunityIcons 
                          name="check" 
                          size={14} 
                          color="white" 
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                  <Text style={{
                    flex: 1,
                    fontSize: 12,
                    lineHeight: 16,
                    color: '#333'
                  }}>
                    <Text style={{ fontWeight: '500' }}>
                      {getLiabilityStatement(cleanItemData(selectedCompletedOrder?.fullData?.filteredMergedData || selectedCompletedOrder?.fullData?.requestList || []))}
                    </Text>
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons - Fixed at bottom */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#e9ecee' }}>
              <TouchableOpacity 
                onPress={handleReorderCancel} 
                style={{ 
                  backgroundColor: '#6c757d', 
                  paddingHorizontal: 20, 
                  paddingVertical: 12, 
                  borderRadius: 6 
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleReorderConfirm}
                style={{ 
                  backgroundColor: !liabilityAccepted ? '#d9d9d9' : '#007bff', 
                  paddingHorizontal: 20, 
                  paddingVertical: 12, 
                  borderRadius: 6 
                }}
                disabled={!liabilityAccepted}
              >
                <Text style={{ 
                  color: !liabilityAccepted ? '#999' : 'white', 
                  fontWeight: '600' 
                }}>
                  Submit Reorder
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Calendar Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={calendarVisible}
        onRequestClose={() => setCalendarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Calendar
              onDayPress={(day) => {
                setReorderForm(prev => ({ ...prev, dateRequired: day.dateString }));
                setCalendarVisible(false);
                
                // Check for 7-day warning immediately when date is selected
                if (day.dateString && checkDateWarning(day.dateString)) {
                  const daysDiff = getDaysDifference(day.dateString);
                  setDaysDifference(daysDiff);
                  console.log('Showing warning modal for date:', day.dateString, 'days difference:', daysDiff);
                  setIsWarningModalVisible(true);
                }
              }}
              markedDates={{
                [reorderForm.dateRequired]: { selected: true, selectedColor: '#00796B' }
              }}
              minDate={today}
              maxDate={maxDate}
            />
            <TouchableOpacity onPress={() => setCalendarVisible(false)} style={styles.closeButton}>
              <Text style={{ color: 'white' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={timeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTimeModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setTimeModalVisible(false)}>
          <View style={styles.timeModalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.timeModalContent}>
                <Text style={styles.modalTitle}>
                  Select {timePickerType === 'start' ? 'Start' : 'End'} Time
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <ScrollView style={styles.timeScroll}>
                    {[...Array(12).keys()].map((h) => (
                      <TouchableOpacity
                        key={h + 1}
                        onPress={() => {
                          if (timePickerType === 'start') {
                            setSelectedStartTime({ ...selectedStartTime, hour: (h + 1).toString() });
                          } else {
                            setSelectedEndTime({ ...selectedEndTime, hour: (h + 1).toString() });
                          }
                        }}
                      >
                        <Text style={styles.timeText}>{h + 1}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={styles.colon}>:</Text>

                  <ScrollView style={styles.timeScroll}>
                    {['00', '15', '30', '45'].map((m) => (
                      <TouchableOpacity
                        key={m}
                        onPress={() => {
                          if (timePickerType === 'start') {
                            setSelectedStartTime({ ...selectedStartTime, minute: m });
                          } else {
                            setSelectedEndTime({ ...selectedEndTime, minute: m });
                          }
                        }}
                      >
                        <Text style={styles.timeText}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={styles.colon}> </Text>

                  <ScrollView style={styles.timeScroll}>
                    {['AM', 'PM'].map((p) => (
                      <TouchableOpacity
                        key={p}
                        onPress={() => {
                          if (timePickerType === 'start') {
                            setSelectedStartTime({ ...selectedStartTime, period: p });
                          } else {
                            setSelectedEndTime({ ...selectedEndTime, period: p });
                          }
                        }}
                      >
                        <Text style={styles.timeText}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </ScrollView>

                <TouchableOpacity
                  style={styles.okButton}
                  onPress={() => {
                    let selectedTime;
                    if (timePickerType === 'start') {
                      selectedTime = selectedStartTime;
                    } else {
                      selectedTime = selectedEndTime;
                    }

                    const { hour, minute, period } = selectedTime;

                    if (!hour || !minute || !period) {
                      Alert.alert('Error', 'Please select hour, minute, and AM/PM.');
                      return;
                    }

                    // Pass the selected time to the appropriate handler
                    if (timePickerType === 'start') {
                      handleStartTimeSelect(selectedTime);
                    } else {
                      handleEndTimeSelect(selectedTime);
                    }

                    setTimeModalVisible(false);
                  }}
                >
                  <Text style={styles.okButtonText}>OK</Text>
                </TouchableOpacity>

              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Warning Modal for dates less than 7 days */}
      <WarningModal
        visible={isWarningModalVisible}
        onOk={async () => {
          setIsWarningModalVisible(false);
          
          // Increment warning count when user proceeds with date < 7 days
          await incrementWarningCount();
        }}
        onCancel={() => {
          setIsWarningModalVisible(false);
          // User chose to change date, reset the selected date
          setReorderForm(prev => ({ ...prev, dateRequired: '' }));
        }}
        dateRequired={reorderForm.dateRequired}
        daysDifference={daysDifference}
      />
      
    </View>
  );
}
