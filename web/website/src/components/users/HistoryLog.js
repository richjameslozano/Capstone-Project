import React, { useState, useEffect } from "react";
import {
  Layout,
  Typography,
  Modal,
  Descriptions,
  Select,
  Button,
  Spin,
  Tabs,
  DatePicker,
  TimePicker,
  Form,
  Input,
  Checkbox,
} from "antd";
import dayjs from 'dayjs';
import { AppstoreAddOutlined, CloseOutlined, ExperimentOutlined, FileSearchOutlined, LikeOutlined, SendOutlined, TeamOutlined } from "@ant-design/icons";
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, setDoc, where, addDoc, serverTimestamp, collectionGroup, updateDoc } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import "../styles/usersStyle/ActivityLog.css";
import { getAuth } from "firebase/auth";
import { ClockCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";
import WarningModal from "../customs/WarningModal";

const { Option } = Select; 
const { Content } = Layout;
const { Title } = Typography;
const { TabPane } = Tabs;

const columns2 = [
  {
    title: "Date",
    dataIndex: "date",
    key: "date",
    className: "table-header",
    align: "center",
  },
  {
    title: "Action",
    dataIndex: "action",
    key: "action",
    className: "table-header",
    align: "center",
  },
  {
    title: "By",
    dataIndex: "by",
    key: "by",
    className: "table-header",
    align: "center",
  },
  {
    title: "Date Required",
    dataIndex: "dateRequired",
    key: "dateRequired",
    className: "table-header",
    align: "center",
    render: (value) => value || "N/A", 
  },
  {
    title: "Items Requested",
    dataIndex: "itemsRequested",
    key: "itemsRequested",
    className: "table-header",
    align: "center",
    render: (items) =>
      Array.isArray(items) && items.length > 0 ? (
        <ul style={{ listStyleType: "disc", paddingLeft: 20, textAlign: "left" }}>
          {items.map((item, idx) => (
            <li key={idx}>
              {item.itemName} ({item.quantity})
            </li>
          ))}
        </ul>
      ) : (
        "N/A"
      ),
  }
];

const HistoryLog = () => {
  const [activityData, setActivityData] = useState([]);
  const [activeTabKey, setActiveTabKey] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isCancelVisible, setIsCancelVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewDetailsModalVisible, setViewDetailsModalVisible] = useState(false);
  const [userName, setUserName] = useState("User");
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [selectedActivityLog, setSelectedActivityLog] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reorderModalVisible, setReorderModalVisible] = useState(false);
  const [selectedCompletedOrder, setSelectedCompletedOrder] = useState(null);
  const [reorderForm] = Form.useForm();
  const [isWarningModalVisible, setIsWarningModalVisible] = useState(false);
  const [daysDifference, setDaysDifference] = useState(0);
  const [reorderLiabilityAccepted, setReorderLiabilityAccepted] = useState(false);

const sanitizeInput = (input) =>
  input.replace(/\s+/g, " ")           // convert multiple spaces to one                    // remove leading/trailing spaces
      .replace(/[^a-zA-Z0-9\s\-.,()]/g, ""); // remove unwanted characters

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
    return selected.diff(today, 'days');
  };

  // Function to increment warning count for user
  const incrementWarningCount = async () => {
    try {
      const userEmail = localStorage.getItem("userEmail");
      if (!userEmail) return;

      const q = query(
        collection(db, "accounts"),
        where("email", "==", userEmail)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const currentWarningCount = userData.warningCount || 0;
        const currentViolationCount = userData.violationCount || 0;
        
        const newWarningCount = currentWarningCount + 1;
        
        // Check if warnings reach 3, then convert to violation
        if (newWarningCount >= 3) {
          // Reset warnings to 0 and increment violations by 1
          await updateDoc(userDoc.ref, {
            warningCount: 0,
            violationCount: currentViolationCount + 1
          });
          console.log('Warning count reached 3, converted to violation for user:', userEmail);
        } else {
          // Just increment warning count
          await updateDoc(userDoc.ref, {
            warningCount: newWarningCount
          });
          console.log('Warning count incremented for user:', userEmail);
        }
      }
    } catch (error) {
      console.error('Error incrementing warning count:', error);
    }
  };

  const fetchUserName = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUserName(user.displayName || "Unknown User");
    }
  };
  


  const fetchRequests = () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("User ID not found in localStorage.");
  
      const userRequestsRef = collection(db, `accounts/${userId}/userRequests`);
  
      // Real-time listener
      const unsubscribe = onSnapshot(userRequestsRef, async (querySnapshot) => {
        const fetched = [];
  
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          
          const enrichedItems = await Promise.all(
            (data.filteredMergedData || []).map(async (item) => {
              const inventoryId = item.selectedItemId || item.selectedItem?.value;
              let itemId = "N/A";
  
              if (inventoryId) {
                try {
                  const invDoc = await getDoc(doc(db, `inventory/${inventoryId}`));
                  if (invDoc.exists()) {
                    itemId = invDoc.data().itemId || "N/A";
                  }
  
                } catch (err) {
                 
                }
              }
  
              return {
                ...item,
                itemIdFromInventory: itemId,
                volume: item.volume ?? "N/A", 
              };
            })
          );
  
          fetched.push({
            id: docSnap.id,
            dateRequested: data.timestamp
              ? new Date(data.timestamp.seconds * 1000).toLocaleDateString()
              : "N/A",
            dateRequired: data.dateRequired || "N/A",
            requester: data.userName || "Unknown",
            room: data.room || "N/A",
            timeNeeded: `${data.timeFrom || "N/A"} - ${data.timeTo || "N/A"}`,
            courseCode: data.program || "N/A",
            courseDescription: data.reason || "N/A",
            items: enrichedItems,
            status: "PENDING",
            message: data.reason || "",
            usageType: data.usageType || "",
          });
        }
  
        // Sort fetched data by request date
        const sortedByDate = fetched.sort((a, b) => {
          const dateA = new Date(a.dateRequested);
          const dateB = new Date(b.dateRequested);
          return dateB - dateA;
        });
  
        setRequests(sortedByDate);
  
      }, (error) => {
        
        setNotificationMessage("Failed to fetch user requests.");
        setNotificationVisible(true);
      });
  
      // Cleanup listener on unmount
      return () => unsubscribe();

    } catch (err) {
      
      setNotificationMessage("Failed to fetch user requests.");
      setNotificationVisible(true);
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchUserName();
  }, []);

  const handleCancelRequest = async () => {
    setCancelLoading(true);
    try {
      const userId = localStorage.getItem("userId");
  
      if (!userId || !selectedRequest?.id) {
        throw new Error("Missing user ID or selected request ID.");
      }
  
      const userRequestRef = doc(db, `accounts/${userId}/userRequests`, selectedRequest.id);
      const activityLogRef = doc(db, `accounts/${userId}/historylog`, selectedRequest.id);
  
      // Fetch request data before deleting
      const requestSnap = await getDoc(userRequestRef);
      if (!requestSnap.exists()) throw new Error("Request not found.");
  
      const requestData = requestSnap.data();
  
      // Write to activity log
      await setDoc(activityLogRef, {
        ...requestData,
        status: "CANCELLED",
        cancelledAt: serverTimestamp(),
      });

      // Also add to activitylog collection for Activity Log page
      await addDoc(collection(db, `accounts/${userId}/activitylog`), {
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
  
      // Delete from userRequests subcollection
      await deleteDoc(userRequestRef);
  
      // Find and delete from root userrequests collection
      const rootQuery = query(
        collection(db, "userrequests"),
        where("accountId", "==", userId),
        where("timestamp", "==", requestData.timestamp) // Assumes timestamp is unique for each request
      );
  
      const rootSnap = await getDocs(rootQuery);
      const batchDeletes = [];
  
      rootSnap.forEach((docSnap) => {
        batchDeletes.push(deleteDoc(doc(db, "userrequests", docSnap.id)));
      });
  
      await Promise.all(batchDeletes);

      // Remove the notification from allNotifications (delete the most recent one for this user)
      const notificationQuery = query(
        collection(db, "allNotifications"),
        where("userId", "==", userId),
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
      setIsCancelVisible(false);

      setNotificationMessage("Request successfully canceled and logged.");
      setNotificationVisible(true);
      setSelectedRequest(null);
      setViewDetailsModalVisible(false);
      fetchRequests();

    } catch (err) {
    
      setNotificationMessage("Failed to cancel the request.");
      setNotificationVisible(true);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setViewDetailsModalVisible(true);
  };

  const handleModalClose = () => {
    setViewDetailsModalVisible(false);
    setSelectedRequest(null);
  };

  const handleReorder = (completedOrder) => {
    console.log('Completed order data:', completedOrder);
    console.log('Full data:', completedOrder.fullData);
    console.log('Items in fullData:', completedOrder.fullData?.filteredMergedData || completedOrder.fullData?.requestList);
    setSelectedCompletedOrder(completedOrder);
    setReorderModalVisible(true);
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
      const values = await reorderForm.validateFields();
      const userId = localStorage.getItem("userId");
      if (!userId || !selectedCompletedOrder) {
        throw new Error("Missing user ID or selected order.");
      }

      // Format the date and time values
      const dateRequired = values.dateRequired ? values.dateRequired.format('YYYY-MM-DD') : selectedCompletedOrder.fullData.dateRequired;
      const timeFrom = values.timeFrom ? values.timeFrom.format('HH:mm') : selectedCompletedOrder.fullData.timeFrom;
      const timeTo = values.timeTo ? values.timeTo.format('HH:mm') : selectedCompletedOrder.fullData.timeTo;

      // Get the original items and clean them of returned-specific data
      const originalItems = selectedCompletedOrder.fullData.filteredMergedData || selectedCompletedOrder.fullData.requestList || [];
      console.log('Original items from Firestore:', originalItems);
      const cleanedItems = cleanItemData(originalItems);
      console.log('Cleaned items after processing:', cleanedItems);

      // Validate schedule conflicts
      const hasConflict = await isRoomTimeConflict(
        selectedCompletedOrder.fullData.room,
        timeFrom,
        timeTo,
        dateRequired
      );

      if (hasConflict) {
        setNotificationMessage("Schedule conflict detected! The room is already booked for the selected date and time. Please choose a different time slot.");
        setNotificationVisible(true);
        return;
      }

      // Validate stock availability
      const stockIssues = await validateStockAvailability(cleanedItems);
      
      if (stockIssues.length > 0) {
        const issueMessages = stockIssues.map(issue => 
          `${issue.itemName}: Requested ${issue.requested}, Available ${issue.available}`
        ).join('\n');
        
        setNotificationMessage(`Insufficient stock for the following items:\n${issueMessages}\n\nPlease adjust quantities or remove unavailable items.`);
        setNotificationVisible(true);
        return;
      }

      // Create a new request based on the completed order with updated date/time
      const newRequest = {
        timestamp: new Date(),
        userName: selectedCompletedOrder.fullData.userName,
        program: selectedCompletedOrder.fullData.program,
        room: selectedCompletedOrder.fullData.room,
        timeFrom: timeFrom,
        timeTo: timeTo,
        dateRequired: dateRequired,
        reason: values.reason || selectedCompletedOrder.fullData.reason,
        usageType: selectedCompletedOrder.fullData.usageType,
        filteredMergedData: cleanedItems,
        status: "PENDING"
      };

      // Add to userRequests subcollection
      const userRequestsRef = collection(db, `accounts/${userId}/userRequests`);
      await addDoc(userRequestsRef, newRequest);

      // Add to root userrequests collection
      const rootRequestsRef = collection(db, "userrequests");
      await addDoc(rootRequestsRef, {
        ...newRequest,
        accountId: userId
      });

      // Add notification
      await addDoc(collection(db, "allNotifications"), {
        action: `New reorder request submitted by ${userName}`,
        userId: userId,
        userName: userName,
        read: false,
        timestamp: serverTimestamp()
      });

      // 🔔 Send push notifications to admins for reorder
      try {
        console.log('🔔 Sending push notifications to admins for reorder via backend...');
        
        const response = await fetch('https://webnuls.onrender.com/api/notify-admins-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userName: userName,
            userId: userId,
            requestData: {
              timestamp: new Date().toISOString(),
              type: 'reorder_submitted'
            }
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Backend notification response:', result);
          console.log(`✅ Push notifications sent to ${result.successfulNotifications}/${result.totalAdmins} admins`);
        } else {
          const error = await response.json();
          console.error('❌ Backend notification error:', error);
        }
      } catch (error) {
        console.error('❌ Error calling backend notification API:', error);
      }

      setReorderModalVisible(false);
      setSelectedCompletedOrder(null);
      setReorderLiabilityAccepted(false);
      reorderForm.resetFields();
      setNotificationMessage("Reorder request submitted successfully!");
      setNotificationVisible(true);

    } catch (error) {
      console.error("Error creating reorder request:", error);
      setNotificationMessage("Failed to create reorder request.");
      setNotificationVisible(true);
    }
  };

  const handleReorderCancel = () => {
    setReorderModalVisible(false);
    setSelectedCompletedOrder(null);
    setReorderLiabilityAccepted(false);
    reorderForm.resetFields();
  };

  // const columns = [

  //   {
  //     title: "Requisition Date",
  //     dataIndex: "dateRequested",
  //     key: "dateRequested",
  //   },
  //   {
  //     title: "Date Required",
  //     dataIndex: "dateRequired",
  //     key: "dateRequired",
  //   },
  //   {
  //     title: "Status",
  //     dataIndex: "status",
  //     key: "status",
  //     render: (status) => (
  //       <Button type="text" className="status-btn">
  //         {status}
  //       </Button>
  //     ),
  //   },
  //   {
  //     title: "Action",
  //     key: "action",
  //     render: (_, record) => (
  //       <Button onClick={() => handleViewDetails(record)} type="primary">
  //         View Details
  //       </Button>
  //     ),
  //   },
  // ];

  // useEffect(() => {
  //   const userId = localStorage.getItem("userId");
  //   if (!userId) return;
  
  //   const activityRef = collection(db, `accounts/${userId}/historylog`);
  
  //   const unsubscribe = onSnapshot(
  //     activityRef,
  //     (querySnapshot) => {
  //       const logs = querySnapshot.docs.map((doc, index) => {
  //         const data = doc.data();
  //         const logDate =
  //           data.cancelledAt?.toDate?.() ||
  //           data.timestamp?.toDate?.() ||
  //           new Date();
  
  //         const isCancelled = data.status === "CANCELLED";
  //         const action = isCancelled
  //           ? "Cancelled a request"
  //           : data.action || "Modified a request";
            
  //         const by = 
  //           action === "Request Approved"
  //             ? data.approvedBy
  //             : action === "Request Rejected"
  //             ? data.rejectedBy
  //             : action === "Deployed"
  //             ? data.approvedBy
  //             : data.userName || "Unknown User";
  
  //         return {
  //           key: doc.id || index.toString(),
  //           date: logDate.toLocaleString("en-US", {
  //             year: "numeric",
  //             month: "short",
  //             day: "numeric",
  //             hour: "numeric",
  //             minute: "2-digit",
  //             hour12: true,
  //           }),
  //           rawDate: logDate,
  //           action: action,
  //           by: by,
  //           fullData: data,
  //         };
  //       });
  
  //       const sortedLogs = logs.sort((a, b) => b.rawDate - a.rawDate);
  //       setActivityData(sortedLogs);
  //     },
  //     (error) => {
     
  //     }
  //   );
  
  //   // Cleanup the listener when the component unmounts
  //   return () => unsubscribe();
  // }, []);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const activityRef = collection(db, `accounts/${userId}/historylog`);

    const unsubscribe = onSnapshot(
      activityRef,
      (querySnapshot) => {
        const logs = querySnapshot.docs.map((doc, index) => {
          const data = doc.data();

          const logDate =
            data.cancelledAt?.toDate?.() ||
            data.timestamp?.toDate?.() ||
            new Date();

          const isCancelled = data.status === "CANCELLED";
          const action = isCancelled
            ? "Cancelled a request"
            : data.action || "Modified a request";

          const by =
            action === "Request Approved"
              ? data.approvedBy
              : action === "Request Rejected"
              ? data.rejectedBy
              : action === "Deployed"
              ? data.approvedBy
              : action === "Released"
              ? data.approvedBy
              : data.userName || "Unknown User";

          return {
            key: doc.id || index.toString(),
            date: logDate.toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }),
            rawDate: logDate,
            action,
            by,
            dateRequired: data.dateRequired || "N/A", // ✅ Matches modal display
            itemsRequested:
              (data.filteredMergedData && data.filteredMergedData.length > 0
                ? data.filteredMergedData
                : data.requestList) || [], // ✅ Same fallback as modal
            program: data.program || "N/A", // ✅ Matches modal
            reason:
              action !== "Request Rejected"
                ? data.reason || "N/A"
                : data.reason || data.rejectionReason || "N/A", // ✅ Covers both fields
            room: data.room || "N/A", // ✅ Matches modal
            time:
              data.timeFrom && data.timeTo
                ? `${data.timeFrom} - ${data.timeTo}`
                : "N/A", // ✅ Matches modal
            fullData: data,
          };
        });

        const sortedLogs = logs.sort((a, b) => b.rawDate - a.rawDate);
        setActivityData(sortedLogs);
      },
      (error) => {
        console.error("Error fetching activity logs:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredData = activityData.filter((item) => {
    // Filter by action type
    if (actionFilter !== "ALL" && item.action !== actionFilter) {
      return false;
    }

    const search = searchQuery?.toLowerCase?.() || "";
    const date = item.date || "";
    const action = item.action?.toLowerCase?.() || "";
    const by = item.by?.toLowerCase?.() || "";

    // Filter by search
    return (
      date.includes(search) ||
      action.includes(search) ||
      by.includes(search)
    );
  });

  const handleRowClick = (record) => {
    setSelectedLog(record.fullData);
    setModalVisible(true);
  };

    const hasGlassware = Array.isArray(selectedRequest?.items)
    ? selectedRequest.items.some(
        (item) => item.category?.toLowerCase() === "glasswares"
      )
    : false;


  const itemColumns = [
    {
      title: "Item #",
      key: "index",
      render: (_, __, index) => <span>{index + 1}</span>,
    },
    {
      title: "Item Name",
      dataIndex: "itemName",
      key: "itemName",
    },
    {
      title: "Item ID",
      dataIndex: "itemIdFromInventory",
      key: "itemIdFromInventory",
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (department) => (
        <span
          style={{
            color: department === "MEDTECH" ? "magenta" : "orange",
            fontWeight: "bold",
          }}
        >
          {department}
        </span>
      ),
    },
    
    
  ];

  //   const renderPendingTab = () => (
  //   <Content className="pending-content">
  //           <div className="activity-header">
  //     </div>
 
      
  //       {loading ? (
  //         <Spin size="large" />
  //       ) : (
  //         <Table
  // columns={columns}
  // dataSource={requests.filter((item) =>
  //   item.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   item.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   item.usageType.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   (item.courseDescription?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  // )}
  // pagination={{ pageSize: 10 }}
  // rowKey="id"
  // className="pending-table"
  //         />
  //       )}
      
  //     <Modal
  //       className="request-list-modal"
  //       open={viewDetailsModalVisible}
  //       onCancel={handleModalClose}
  //       width={800}
  //       zIndex={1008}
  //       closable={false}
  //       footer={[
  //         <Button key="close" onClick={handleModalClose}>Close</Button>,
  //         <Button key="cancel" danger onClick={() => setIsCancelVisible(true)} icon={<CloseOutlined />}>Cancel Request</Button>,
  //       ]}
  //     >
  //       {selectedRequest && (
  //         <>
  //           <div className="request-details-container" style={{ justifyContent: 'space-between' }}>
  //             <strong style={{ fontSize: '18px', color: 'white' }}>Request Details</strong>
  //             {/* <span style={{ fontSize: 12, color: 'white' }}>{selectedRequest?.id}</span> */}
  //           </div>
  //           <div className="request-details-whole">
  //             <div className="request-details-left">
  //               <div><p><strong>Requester:</strong></p><p>{selectedRequest.requester}</p></div>
  //               <div><p><strong>Requisition Date:</strong></p><p>{selectedRequest.dateRequested}</p></div>
  //               <div><p><strong>Date Required:</strong></p><p>{selectedRequest.dateRequired}</p></div>
  //               <div><p><strong>Time Needed:</strong></p><p>{selectedRequest.timeNeeded}</p></div>
  //             </div>
  //             <div className="request-details-right">
  //               <div><p><strong>Course Code:</strong></p><p>{selectedRequest.courseCode}</p></div>
  //               <div><p><strong>Course Description:</strong></p><p>{selectedRequest.requester}</p></div>
  //               <div><p><strong>Room:</strong></p><p>{selectedRequest.room}</p></div>
  //               <div><p><strong>Usage Type:</strong></p><p>{selectedRequest.usageType}</p></div>
  //             </div>
  //           </div>
  //           <div className="details-table">
  //             <Title level={5}>Requested Items:</Title>
  //             <Table
  //               columns={itemColumns}
  //               dataSource={selectedRequest.items}
  //               rowKey={(_, index) => index}
  //               size="small"
  //               pagination={false}
  //             />
  //             <br />
  //             <p style={{ marginBottom: '30px' }}><strong>Note:</strong> {selectedRequest.message || "No message provided."}</p>
  //           </div>
  //         </>
  //       )}
  //     </Modal>

  //     <Modal
  //       title="Confirm Cancellation"
  //       open={isCancelVisible}
  //       onCancel={() => setIsCancelVisible(false)}
  //       onOk={handleCancelRequest}
  //       zIndex={1009}
  //       okText="Yes, Cancel"
  //       cancelText="No"
  //     >
  //       <p>Are you sure you want to cancel this request?</p>
  //     </Modal>
  //   </Content>
  // );

  const getUsageIcon = (usageType) => {
  switch (usageType) {
    case "Research":
      return <FileSearchOutlined style={{ fontSize: 20 }} />;
    case "Laboratory Experiment":
      return <ExperimentOutlined style={{ fontSize: 20 }} />;
    case "Community Extension":
      return <TeamOutlined style={{ fontSize: 20 }} />;
    case "Others":
    default:
      return <AppstoreAddOutlined style={{ fontSize: 20 }} />;
  }
};

const getBGColor = (modalBG) => {
  switch (modalBG){
    case "Request Approved":
      return "#081538"
    case "Deployed":
      return "#2596be"
    case "Released":
      return "#0e7490"
    case "Returned":
      return "#056625ff"
    case "Unclaimed":
      return "#ff6b35"
    case "Request Rejected":
      return "#dc2626"
  }
}

const getLabel = (modalLabel) => {
  switch (modalLabel){
    case "Request Approved":
      return "APPROVED"
    case "Deployed":
      return "DEPLOYED"
    case "Released":
      return "RELEASED"
    case "Returned":
      return "COMPLETED"
    case "Unclaimed":
      return "UNCLAIMED"
    case "Request Rejected":
      return "REJECTED"
  }
}
const getIcon = (modalIcon) => {
  switch (modalIcon){
    case "Request Approved":
      return <LikeOutlined style={{fontSize: 23, color: 'white'}}/>
    case "Deployed":
      return <SendOutlined style={{fontSize: 23, color: 'white'}}/>
    case "Released":
      return <CheckCircleOutlined style={{fontSize: 23, color: 'white'}}/>
    case "Returned":
      return <CheckCircleOutlined style={{fontSize: 23, color: 'white'}}/>
    case "Unclaimed":
      return <ClockCircleOutlined style={{fontSize: 23, color: 'white'}}/>
    case "Request Rejected":
      return <CloseOutlined style={{fontSize: 23, color: 'white'}}/>
  }
}



const renderPendingTab = () => (
  <Content className="pending-content">
    <div style={{display: 'flex', gap: 10, alignItems: 'flex-start'}}>
    <ClockCircleOutlined style={{fontSize: 28, color: 'orange', paddingTop: 10}}/>

    <div>
      <h1 style={{ color:'orange', margin: 0, padding: 0, textDecoration: 'none'}}>Pending Requisitions</h1>
      <p>Please wait for your requisitions to be approved by the stockroom personnels/laboratory technicians.</p>
      </div>
      </div>
    {loading ? (
      <Spin size="large" />
    ) : (
      <div className="pending-cards">
        {requests
          .filter((item) =>
            item.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.usageType.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.courseDescription?.toLowerCase() || "").includes(searchQuery.toLowerCase())
          )
          .map((item) => (
            <div
              key={item.id}
              className="request-card"
              onClick={() => {
                setSelectedRequest(item);
                setViewDetailsModalVisible(true);
              }}
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "16px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                cursor: "pointer",
                transition: "0.2s ease-in-out",
                display: 'flex',  
                flexDirection: 'column',
       
              }}
            >

           
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e1e1e1', paddingBottom: 10}}>
              <p style={{fontWeight: 'bold', backgroundColor: 'orange', margin: 0,paddingTop: 4, paddingBottom: 4, paddingLeft: 10, paddingRight: 10, color: 'white', borderRadius: 3, fontSize: 15}}>PENDING</p>
              <p style={{padding: 0, margin: 0, fontSize: 15, fontWeight: 300}}> Date Submitted: {item.dateRequested} </p>
              </div> 

              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10, marginTop: 10 }}>
                {getUsageIcon(item.usageType)}
                <h3 style={{ marginBottom: "8px", margin: 0, padding: 0 }}>{item.usageType}</h3>
              </div>

              <div className="card-info-section" style={{display: 'flex', justifyContent: 'space-between', padding: 10, backgroundColor: '#e9f5f9', borderRadius: 7, paddingBottom: 0}}>
                <div className="card-info-left">     
              <p><strong>Requester:</strong> {item.requester}</p>
              <p><strong>Date Required:</strong> {item.dateRequired}</p>
              
              {/* <p><strong>Usage Type:</strong> {item.courseCode} - {item.courseDescription}</p> */}
              </div>

              <div className="card-info-center">
                <p><strong>Time Needed:</strong> {item.timeNeeded}</p>
                <p><strong>Room:</strong> {item.room}</p>
              </div>

              <div className="card-info-right" style={{ width: 250}}>
              {item.items && item.items.length > 0 && (
                  <div>
                    <strong>Requested Items:</strong>
                    <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                      {item.items.map((reqItem, idx) => (
                        <li key={idx}>
                          {reqItem.itemName} ({reqItem.quantity})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                </div>
                </div>
                          </div>
          ))}
          
      </div>
    )}

    {/* Request Details Modal */}
    <Modal
      className="request-list-modal"
      open={viewDetailsModalVisible}
      onCancel={handleModalClose}
      width={800}
      zIndex={1008}
      closable={false}
      footer={[
        <Button key="close" onClick={handleModalClose}>Close</Button>,
        <Button
          key="cancel"
          danger
          onClick={() => setIsCancelVisible(true)}
          icon={<CloseOutlined />}
        >
          Cancel Request
        </Button>,
      ]}
    >
      {selectedRequest && (
        <div style={{paddingTop: 20}}>
          <div
            className="pending-modal-header" style={{backgroundColor: '#e68020ff', position: 'absolute', top: 0, left: 0, borderRadius: '5px 5px 0 0', height: 60, width: '100%', display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 20}}
          >
            <ClockCircleOutlined style={{color: 'white', fontSize: 25}}/>
            <strong style={{ fontSize: "20px", color: "white" }}>Requisition Slip - PENDING</strong>
          </div>

          <div className="details-table">
            <Title level={5}>Request Details:</Title>
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, sm: 1, md: 2 }} // responsive: 1 col on mobile, 2 cols on desktop
            style={{marginBottom: 30}}
          >
            <Descriptions.Item label="Requester">
              {selectedRequest.requester}
            </Descriptions.Item>
            <Descriptions.Item label="Course Code">
              {selectedRequest.courseCode}
            </Descriptions.Item>

            <Descriptions.Item label="Requisition Date">
              {selectedRequest.dateRequested}
            </Descriptions.Item>
            <Descriptions.Item label="Course Description">
              {selectedRequest.courseDescription}
            </Descriptions.Item>

            <Descriptions.Item label="Date Required">
              {selectedRequest.dateRequired}
            </Descriptions.Item>
            <Descriptions.Item label="Room">
              {selectedRequest.room}
            </Descriptions.Item>

            <Descriptions.Item label="Time Needed">
              {selectedRequest.timeNeeded}
            </Descriptions.Item>
            <Descriptions.Item label="Usage Type">
              {selectedRequest.usageType}
            </Descriptions.Item>
          </Descriptions>

  
<Title level={5}>Items:</Title>
<table style={{ width: "100%", borderCollapse: "collapse" }}>
  <thead>
    <tr>
      {itemColumns.map((col) => (
        <th
          key={col.key || col.dataIndex}
          style={{
            border: "1px solid #ddd",
            padding: "8px",
            textAlign: "left",
            background: "#f5f5f5",
          }}
        >
          {col.title}
        </th>
      ))}
    </tr>
  </thead>
  <tbody>
    {selectedRequest.items.map((item, index) => (
      <tr key={index}>
        {itemColumns.map((col) => (
          <td
            key={col.key || col.dataIndex}
            style={{ border: "1px solid #ddd", padding: "8px" }}
          >
            {col.render
              ? col.render(item[col.dataIndex], item, index)
              : item[col.dataIndex]}
          </td>
        ))}
      </tr>
    ))}
  </tbody>
</table>

            <br />
            <p style={{ marginBottom: "30px" }}>
              <strong>Note:</strong> {selectedRequest.message || "No message provided."}
            </p>
          </div>
        </div>
      )}
    </Modal>

    {/* Cancel Request Modal */}
    <Modal
      title="Confirm Cancellation"
      open={isCancelVisible}
      onCancel={() => setIsCancelVisible(false)}
      onOk={handleCancelRequest}
      zIndex={1009}
      okText="Yes, Cancel"
      cancelText="No"
      okButtonProps={{ loading: cancelLoading }}
    >
      <p>Are you sure you want to cancel this request?</p>
    </Modal>
  </Content>
);


// Assuming you only need Approved requests
// const renderApprovedTab = () => {
//   const approvedData = filteredData.filter((item) => item.action === 'Request Approved');

//   return (
//     <Content className="approved-content">
//       {loading ? (
//         <Spin size="large" />
//       ) : (
//         <Table
//           columns={columns2}
//           dataSource={approvedData}
//           pagination={{ pageSize: 10 }}
//           rowKey="id"
//           bordered
//           onRow={(record) => ({
//             onClick: () => handleRowClick(record), // Make the row clickable
//           })}
//           locale={{
//             emptyText: (
//               <div className="empty-row">
//                 <span>No activity found.</span>
//               </div>
//             ),
//           }}
//         />
//       )}
//     </Content>
//   );
// };

const renderApprovedTab = () => {
  const approvedData = filteredData.filter((item) => item.action === "Request Approved");

  return (
    <Content className="pending-content">
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start"}}>
        <LikeOutlined style={{ fontSize: 28, color: "#0f3c4c", paddingTop: 10 }} />
        <div>
          <h1 style={{ color: "#0f3c4c", margin: 0, padding: 0, textDecoration: "none" }}>
            Approved Requisitions
          </h1>
          <p>These requisitions have already been approved by the stockroom personnels/laboratory technicians.</p>
        </div>
      </div>

      {loading ? (
        <Spin size="large" />
      ) : (
        <div className="approved-cards">
          {approvedData.length > 0 ? (
            approvedData.map((item) => (
              <div
                key={item.id}
               className="request-card"
                onClick={() => handleRowClick(item)}
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "16px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                  cursor: "pointer",
                  transition: "0.2s ease-in-out",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Status + Date */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #e1e1e1",
                    paddingBottom: 10,
                  }}
                >
                  <p
                    style={{
                      fontWeight: "bold",
                      backgroundColor: "#0f3c4c",
                      margin: 0,
                      paddingTop: 4,
                      paddingBottom: 4,
                      paddingLeft: 10,
                      paddingRight: 10,
                      color: "white",
                      borderRadius: 3,
                      fontSize: 15,
                    }}
                  >
                    APPROVED
                  </p>
                  <p style={{ padding: 0, margin: 0, fontSize: 15}}>
                    <strong>Approved by:</strong>  {item.fullData.approvedBy}
                  </p>
                </div>

                {/* Usage Type */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginBottom: 10,
                    marginTop: 10,
                  }}
                >
                  {getUsageIcon(item.fullData.usageType)}
                  <h3 style={{ marginBottom: "8px", margin: 0, padding: 0 }}>{item.fullData.usageType}</h3>
                </div>

                {/* Info Section */}
                <div
                  className="card-info-section"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: 10,
                    backgroundColor: "#e9f5f9",
                    borderRadius: 7,
                    paddingBottom: 0,
                  }}
                >
                  <div className="card-info-left">
                    <p>
                      <strong>Requester:</strong> {item.fullData.userName}
                    </p>
                    <p>
                      <strong>Date Required:</strong> {item.dateRequired}
                    </p>
                  </div>

                  <div className="card-info-center">
                    <p>
                      <strong>Time Needed:</strong> {item.fullData.timeFrom} - {item.fullData.timeTo}
                    </p>
                    <p>
                      <strong>Room:</strong> {item.room}
                    </p>
                  </div>

<div className="card-info-right" style={{ width: 250 }}>
  {item.requestList && item.requestList.length > 0 && (
    <div>
      <strong>Requested Items:</strong>
      <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
        {item.requestList.map((req, idx) => (
          <li key={idx}>
            {req.itemName} - {req.department}
            <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: 13 }}>
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )}
</div>

                </div>
              </div>
            ))
          ) : (
            <div className="empty-row">
              <span>No approved requisitions found.</span>
            </div>
          )}
        </div>
      )}
    </Content>
  );
};


const renderDeployedTab = () => {
  const deployedData = filteredData.filter((item) => item.action === "Deployed");
console.log(deployedData);
  return (
    <Content className="pending-content">
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start"}}>
        <SendOutlined style={{ fontSize: 28, color: "#66b6d2", paddingTop: 10 }} />
        <div>
          <h1 style={{ color: "#66b6d2", margin: 0, padding: 0, textDecoration: "none" }}>
            Deployed Requisitions
          </h1>
          <p>Please return the borrowed items to the stockroom and proceed to the "Return Items" page to complete this requisition.</p>
        </div>
      </div>

      {loading ? (
        <Spin size="large" />
      ) : (
        <div className="approved-cards">
          {deployedData.length > 0 ? (
            deployedData.map((item, index) => {
              console.log(item); // Debugging the structure of each item
              return (
                <div
                  key={item.id || index} // Fallback to index if id is not unique
                  className="request-card"
                  onClick={() => handleRowClick(item)}
                  style={{
                    border: "1px solid #e0e0e0",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "16px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                    cursor: "pointer",
                    transition: "0.2s ease-in-out",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Status + Date */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid #e1e1e1",
                      paddingBottom: 10,
                    }}
                  >
                    <p
                      style={{
                        fontWeight: "bold",
                        backgroundColor: "#2596be",
                        margin: 0,
                        paddingTop: 4,
                        paddingBottom: 4,
                        paddingLeft: 10,
                        paddingRight: 10,
                        color: "white",
                        borderRadius: 3,
                        fontSize: 15,
                      }}
                    >
                      DEPLOYED
                    </p>
                  <p style={{ padding: 0, margin: 0, fontSize: 15}}>
                    <strong>Approved by:</strong>  {item.fullData.approvedBy}
                  </p>
                  </div>

                  {/* Usage Type */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginBottom: 10,
                      marginTop: 10,
                    }}
                  >
                    {getUsageIcon(item.fullData.usageType)}
                    <h3 style={{ marginBottom: "8px", margin: 0, padding: 0 }}>{item.fullData.usageType}</h3>
                  </div>

                  {/* Info Section */}
                  <div
                    className="card-info-section"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: 10,
                      backgroundColor: "#e9f5f9",
                      borderRadius: 7,
                      paddingBottom: 0,
                    }}
                  >
                    <div className="card-info-left" key={index}>
                      <p>
                        <strong>Requester:</strong> {item.fullData.userName}
                      </p>
                      <p>
                        <strong>Date Required:</strong> {item.dateRequired}
                      </p>
                    </div>

                    <div className="card-info-center">
                      <p>
                    <strong>Time Needed:</strong> {item.fullData.timeFrom} - {item.fullData.timeTo}
                      </p>
                      <p>
                        <strong>Room:</strong> {item.room}
                      </p>
                    </div>

                    <div className="card-info-right" style={{ width: 250 }}>
                      {item.requestList && item.requestList.length > 0 && (
                        <div>
                          <strong>Requested Items:</strong>
                          <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                            {item.requestList.map((req, idx) => (
                              <li key={idx}>
                                {req.itemName} - {req.department}
                                <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: 13 }}></ul>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-row">
              <span>No deployed requisitions found.</span>
            </div>
          )}
        </div>
      )}
    </Content>
  );
};

const renderReturnedTab = () => {
  const returnedData = filteredData.filter((item) => item.action === 'Returned' || item.action === 'Released');

console.log(returnedData);
  return (
    <Content className="pending-content">
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start"}}>
        <CheckCircleOutlined style={{ fontSize: 28, color: "#37c225ff", paddingTop: 10 }} />
        <div>
          <h1 style={{ color: "#37c225ff", margin: 0, padding: 0, textDecoration: "none" }}>
            Released & Completed Requisitions
          </h1>
          <p>These requisitions have been released or completed. Completed requisitions will automatically be removed 7 days after completion.</p>
        </div>
      </div>

      {loading ? (
        <Spin size="large" />
      ) : (
        <div className="approved-cards">
          {returnedData.length > 0 ? (
            returnedData.map((item, index) => {
              console.log(item); // Debugging the structure of each item
              return (
                <div
                  key={item.id || index} // Fallback to index if id is not unique
                  className="request-card"
                  onClick={() => handleRowClick(item)}
                  style={{
                    border: "1px solid #e0e0e0",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "16px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                    cursor: "pointer",
                    transition: "0.2s ease-in-out",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Status + Date */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid #e1e1e1",
                      paddingBottom: 10,
                    }}
                  >
                    <p
                      style={{
                        fontWeight: "bold",
                        backgroundColor: item.action === "Released" ? "#0e7490" : "#37c225ff",
                        margin: 0,
                        paddingTop: 4,
                        paddingBottom: 4,
                        paddingLeft: 10,
                        paddingRight: 10,
                        color: "white",
                        borderRadius: 3,
                        fontSize: 15,
                      }}
                    >
                      {item.action === "Released" ? "RELEASED" : "COMPLETED"}
                    </p>
                    <p style={{ padding: 0, margin: 0, fontSize: 15, fontWeight: 300 }}>
                      {item.action === "Released" ? "Released by:" : "Date Approved:"} {item.action === "Released" ? item.fullData.approvedBy : (item.dateApproved || item.dateRequested)}
                    </p>
                  </div>

                  {/* Usage Type */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginBottom: 10,
                      marginTop: 10,
                    }}
                  >
                    {getUsageIcon(item.usageType)}
                    <h3 style={{ marginBottom: "8px", margin: 0, padding: 0 }}>{item.usageType}</h3>
                  </div>

                  {/* Info Section */}
                  <div
                    className="card-info-section"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: 10,
                      backgroundColor: "#e9f5f9",
                      borderRadius: 7,
                      paddingBottom: 0,
                    }}
                  >
                    <div className="card-info-left" key={index}>
                      <p>
                        <strong>Requester:</strong> {item.fullData.userName}
                      </p>
                      <p>
                        <strong>Date Required:</strong> {item.dateRequired}
                      </p>
                    </div>

                    <div className="card-info-center">
                      <p>
                    <strong>Time Needed:</strong> {item.fullData.timeFrom} - {item.fullData.timeTo}
                      </p>
                      <p>
                        <strong>Room:</strong> {item.room}
                      </p>
                    </div>

                    <div className="card-info-right" style={{ width: 250 }}>
                      {item.requestList && item.requestList.length > 0 && (
                        <div>
                          <strong>Requested Items:</strong>
                          <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                            {item.requestList.map((req, idx) => (
                              <li key={idx}>
                                {req.itemName} - {req.department}
                                <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: 13 }}></ul>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Reorder Button */}
                  <div style={{ marginTop: 10, textAlign: "center" }}>
                    <Button
                      type="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReorder(item);
                      }}
                      style={{
                        backgroundColor: "#37c225ff",
                        borderColor: "#37c225ff",
                        borderRadius: "6px",
                        fontWeight: "500"
                      }}
                    >
                      Reorder Again
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-row">
              <span>No completed requisitions found.</span>
            </div>
          )}
        </div>
      )}
    </Content>
  );
};

const renderUnclaimedTab = () => {
  const unclaimedData = filteredData.filter((item) => item.action === 'Unclaimed');

  return (
    <Content className="pending-content">
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start"}}>
        <ClockCircleOutlined style={{ fontSize: 28, color: "#ff6b35", paddingTop: 10 }} />
        <div>
          <h1 style={{ color: "#ff6b35", margin: 0, padding: 0, textDecoration: "none" }}>
            Unclaimed Requisitions
          </h1>
          <p>These requisitions have been approved but not yet claimed by the requester. Please contact the stockroom to claim your items.</p>
        </div>
      </div>

      {loading ? (
        <Spin size="large" />
      ) : (
        <div className="approved-cards">
          {unclaimedData.length > 0 ? (
            unclaimedData.map((item, index) => {
              return (
                <div
                  key={item.id || index}
                  className="request-card"
                  onClick={() => handleRowClick(item)}
                  style={{
                    border: "1px solid #e0e0e0",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "16px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                    cursor: "pointer",
                    transition: "0.2s ease-in-out",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Status + Date */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid #e1e1e1",
                      paddingBottom: 10,
                    }}
                  >
                    <p
                      style={{
                        fontWeight: "bold",
                        backgroundColor: "#ff6b35",
                        margin: 0,
                        paddingTop: 4,
                        paddingBottom: 4,
                        paddingLeft: 10,
                        paddingRight: 10,
                        color: "white",
                        borderRadius: 3,
                        fontSize: 15,
                      }}
                    >
                      UNCLAIMED
                    </p>
                    <p style={{ padding: 0, margin: 0, fontSize: 15, fontWeight: 300 }}>
                      <strong>Approved by:</strong> {item.fullData.approvedBy}
                    </p>
                  </div>

                  {/* Usage Type */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginBottom: 10,
                      marginTop: 10,
                    }}
                  >
                    {getUsageIcon(item.fullData.usageType)}
                    <h3 style={{ marginBottom: "8px", margin: 0, padding: 0 }}>{item.fullData.usageType}</h3>
                  </div>

                  {/* Info Section */}
                  <div
                    className="card-info-section"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: 10,
                      backgroundColor: "#fff5f0",
                      borderRadius: 7,
                      paddingBottom: 0,
                    }}
                  >
                    <div className="card-info-left" key={index}>
                      <p>
                        <strong>Requester:</strong> {item.fullData.userName}
                      </p>
                      <p>
                        <strong>Date Required:</strong> {item.dateRequired}
                      </p>
                    </div>

                    <div className="card-info-center">
                      <p>
                        <strong>Time Needed:</strong> {item.fullData.timeFrom} - {item.fullData.timeTo}
                      </p>
                      <p>
                        <strong>Room:</strong> {item.room}
                      </p>
                    </div>

                    <div className="card-info-right" style={{ width: 250 }}>
                      {item.requestList && item.requestList.length > 0 && (
                        <div>
                          <strong>Requested Items:</strong>
                          <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                            {item.requestList.map((req, idx) => (
                              <li key={idx}>
                                {req.itemName} - {req.department}
                                <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: 13 }}></ul>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Unclaimed Comment */}
                  {item.fullData.unclaimedComment && (
                    <div style={{ marginTop: 10, padding: 10, backgroundColor: "#f5f5f5", borderRadius: 6, border: "1px solid #d9d9d9" }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: "500", color: "#333" }}>
                        <strong>Reason:</strong> {item.fullData.unclaimedComment}
                      </p>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div style={{ marginTop: 10, textAlign: "center", padding: 10, backgroundColor: "#fff0e6", borderRadius: 6 }}>
                    <p style={{ margin: 0, fontSize: 14, color: "#d84315", fontWeight: "500" }}>
                      📞 Please contact the stockroom to claim your items
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-row">
              <span>No unclaimed requisitions found.</span>
            </div>
          )}
        </div>
      )}
    </Content>
  );
};

const renderRejectedTab = () => {
  const rejectedData = filteredData.filter((item) => item.action === 'Request Rejected');

  return (
    <Content className="pending-content">
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start"}}>
        <CloseOutlined style={{ fontSize: 28, color: "#dc2626", paddingTop: 10 }} />
        <div>
          <h1 style={{ color: "#dc2626", margin: 0, padding: 0, textDecoration: "none" }}>
            Rejected Requisitions
          </h1>
          <p>These requisitions have been rejected by the stockroom personnels/laboratory technicians. Please review the rejection reasons and submit a new request if needed.</p>
        </div>
      </div>

      {loading ? (
        <Spin size="large" />
      ) : (
        <div className="approved-cards">
          {rejectedData.length > 0 ? (
            rejectedData.map((item, index) => {
              return (
                <div
                  key={item.id || index}
                  className="request-card"
                  onClick={() => handleRowClick(item)}
                  style={{
                    border: "1px solid #e0e0e0",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "16px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                    cursor: "pointer",
                    transition: "0.2s ease-in-out",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Status + Date */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid #e1e1e1",
                      paddingBottom: 10,
                    }}
                  >
                    <p
                      style={{
                        fontWeight: "bold",
                        backgroundColor: "#dc2626",
                        margin: 0,
                        paddingTop: 4,
                        paddingBottom: 4,
                        paddingLeft: 10,
                        paddingRight: 10,
                        color: "white",
                        borderRadius: 3,
                        fontSize: 15,
                      }}
                    >
                      REJECTED
                    </p>
                    <p style={{ padding: 0, margin: 0, fontSize: 15, fontWeight: 300 }}>
                      <strong>Rejected by:</strong> {item.fullData.rejectedBy}
                    </p>
                  </div>

                  {/* Usage Type */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginBottom: 10,
                      marginTop: 10,
                    }}
                  >
                    {getUsageIcon(item.fullData.usageType)}
                    <h3 style={{ marginBottom: "8px", margin: 0, padding: 0 }}>{item.fullData.usageType}</h3>
                  </div>

                  {/* Info Section */}
<div
  className="card-info-section"
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    padding: 10,
    backgroundColor: "#fef2f2",
    borderRadius: 7,
  }}
>
  {/* Left */}
  <div>
    <p>
      <strong>Requester:</strong> {item.fullData.userName}
    </p>
    <p>
      <strong>Date Required:</strong> {item.dateRequired}
    </p>
  </div>

  {/* Center */}
  <div>
    <p>
      <strong>Time Needed:</strong> {item.fullData.timeFrom} - {item.fullData.timeTo}
    </p>
    <p>
      <strong>Room:</strong> {item.room}
    </p>
  </div>

  {/* Right */}
  <div>
    {item.requestList?.length > 0 && (
      <div>
        <strong>Requested Items:</strong>
        <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
          {item.requestList.map((req, idx) => (
            <li key={idx}>
              {req.itemName} - {req.department}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
</div>


                  {/* Rejection Info */}
                  <div style={{ marginTop: 10, textAlign: "center", padding: 10, backgroundColor: "#fee2e2", borderRadius: 6 }}>
                    <p style={{ margin: 0, fontSize: 14, color: "#dc2626", fontWeight: "500" }}>
                      ❌ Request was rejected. Click to view rejection details.
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-row">
              <span>No rejected requisitions found.</span>
            </div>
          )}
        </div>
      )}
    </Content>
  );
};

// const ProcessedTab = () => {
//   const [activeTab, setActiveTab] = useState('APPROVED');

//   const getTabData = (type) => {
//     return filteredData.filter((item) => {
//       if (type === 'APPROVED') return item.action === 'Request Approved';
//       if (type === 'REJECTED') return item.action === 'Request Rejected';
//       if (type === 'CANCELLED') return item.action === 'Cancelled a request';
//       if (type === 'DEPLOYED') return item.action === 'Deployed';
//       return true;
//     });
//   };

//   const tabData = getTabData(activeTab);

//   return (
//     <Content className="activity-content">
//       <div className="activity-controls">

//       </div>

//       <Tabs activeKey={activeTab} onChange={setActiveTab}>
//         <TabPane tab={`Approved (${getTabData('APPROVED').length})`} key="APPROVED" />
//         <TabPane tab={`Deployed (${getTabData('DEPLOYED').length})`} key="DEPLOYED" />
//         <TabPane tab={`Rejected (${getTabData('REJECTED').length})`} key="REJECTED" />
//         <TabPane tab={`Cancelled (${getTabData('CANCELLED').length})`} key="CANCELLED" />
//       </Tabs>

//       <Table
//         columns={columns2}
//         dataSource={tabData}
//         pagination={{ pageSize: 10 }}
//         bordered
//         className="activity-table"
//         rowClassName="activity-row"
//         onRow={(record) => ({ onClick: () => handleRowClick(record) })}
//         locale={{
//           emptyText: (
//             <div className="empty-row">
//               <span>No activity found.</span>
//             </div>
//           ),
//         }}
//       />

//       <Modal
//         title="Activity Details"
//         visible={modalVisible}
//         zIndex={1015}
//         onCancel={() => setModalVisible(false)}
//         footer={null}
//       >
//         {selectedLog && (
//           <Descriptions column={1} bordered size="small">
//             <Descriptions.Item label="Action">
//               {selectedLog.status === 'CANCELLED'
//                 ? 'Cancelled a request'
//                 : selectedLog.action || 'Modified a request'}
//             </Descriptions.Item>

//             <Descriptions.Item label="By">
//               {selectedLog.userName || 'Unknown User'}
//             </Descriptions.Item>

//             <Descriptions.Item label="Program">
//               {selectedLog.program || 'N/A'}
//             </Descriptions.Item>

//             <Descriptions.Item label="Items Requested">
//               {(selectedLog.filteredMergedData || selectedLog.requestList)?.length > 0 ? (
//                 <ul style={{ paddingLeft: 20 }}>
//                   {(selectedLog.filteredMergedData || selectedLog.requestList).map((item, index) => (
//                     <li key={index} style={{ marginBottom: 10 }}>
//                       <strong>{item.itemName}</strong>
//                       <ul style={{ marginLeft: 20 }}>
//                         <li>Quantity: {item.quantity}</li>
//                         {(item.category === 'Chemical' || item.category === 'Reagent') && item.unit && (
//                           <li>Unit: {item.unit}</li>
//                         )}
//                         {item.category && <li>Category: {item.category}</li>}
//                         {item.category === 'Glasswares' && item.volume && (
//                           <li>Volume: {item.volume}</li>
//                         )}
//                         {item.labRoom && <li>Lab Room: {item.labRoom}</li>}
//                         {item.usageType && <li>Usage Type: {item.usageType}</li>}
//                         {item.itemType && <li>Item Type: {item.itemType}</li>}
//                         {item.department && <li>Department: {item.department}</li>}
//                         {selectedLog.action === 'Request Rejected' && (item.reason || item.rejectionReason) && (
//                           <>
//                             {item.reason && <li><strong>Reason:</strong> {item.reason}</li>}
//                             {item.rejectionReason && <li><strong>Rejection Reason:</strong> {item.rejectionReason}</li>}
//                           </>
//                         )}
//                       </ul>
//                     </li>
//                   ))}
//                 </ul>
//               ) : 'None'}
//             </Descriptions.Item>
//             {selectedLog.action !== 'Request Rejected' && (
//               <Descriptions.Item label="Reason">
//                 {selectedLog.reason || 'N/A'}
//               </Descriptions.Item>
//             )}
//             <Descriptions.Item label="Room">
//               {selectedLog.room || 'N/A'}
//             </Descriptions.Item>
//             <Descriptions.Item label="Time">
//               {selectedLog.timeFrom && selectedLog.timeTo
//                 ? `${selectedLog.timeFrom} - ${selectedLog.timeTo}`
//                 : 'N/A'}
//             </Descriptions.Item>
//             <Descriptions.Item label="Date Required">
//               {selectedLog.dateRequired || 'N/A'}
//             </Descriptions.Item>
//           </Descriptions>
//         )}
//       </Modal>
//     </Content>
//   );
// };

  const loadImageAsDataURL = async (url) => {
  try {
    const res = await fetch(url, { cache: "force-cache" });
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return ""; // skip logo if it can't be loaded
  }
};

const formatDateTimePH = (d = new Date()) => {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

// Call this from your component: handleGeneratePDF(selectedLog)
// Put NULS_Favicon.png in /public/images/NULS_Favicon.png

const handleGeneratePDF = async () => {
  if (!selectedLog) {
    alert("No data to export.");
    return;
  }

  // unify items the same way your modal does
  const rawItems =
    (selectedLog.filteredMergedData && selectedLog.filteredMergedData.length > 0
      ? selectedLog.filteredMergedData
      : selectedLog.requestList) || [];

  // normalize item fields for the PDF table
  const items = rawItems.map((it) => {
    const unitOrVol =
      (["Chemical", "Reagent"].includes(it.category) && it.unit) ? `Unit: ${it.unit}` :
      (it.category === "Glasswares" && it.volume) ? `Volume: ${it.volume}` : "";
    return {
      itemId: it.itemIdFromInventory || "N/A",
      name: it.itemName || "",
      qty: it.quantity ?? "",
      category: it.category || "",
      unitOrVol,
      department: it.department || ""
    };
  });

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;

  // logo from /public/images
  const logoDataURL = await loadImageAsDataURL("/NULS_Favicon.png");
  const printedOn = formatDateTimePH();

  const drawHeader = () => {
  // logo
  if (logoDataURL) {
    doc.addImage(logoDataURL, "PNG", marginX, 10, 12, 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("NULS", marginX + 16, 18); // just right of the logo
  }

  // title centered
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("REQUEST SLIP", pageWidth / 2, 18, { align: "center" });

  // underline separator
  doc.setDrawColor(180);
  doc.setLineWidth(0.2);
  doc.line(marginX, 22, pageWidth - marginX, 22);
};

  const drawFooter = () => {
    const pageCount = doc.internal.getNumberOfPages();
    const pageCurrent = doc.internal.getCurrentPageInfo().pageNumber;

    doc.setDrawColor(200);
    doc.setLineWidth(0.2);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Printed on: ${printedOn}`, marginX, pageHeight - 7);
    doc.text(`Page ${pageCurrent} of ${pageCount}`, pageWidth - marginX, pageHeight - 7, { align: "right" });
  };

  drawHeader();

  // DETAILS (align with your modal fields)
  const timeText =
    selectedLog.timeFrom && selectedLog.timeTo
      ? `${selectedLog.timeFrom} – ${selectedLog.timeTo}`
      : "N/A";

  const details = [
    ["Approved By", selectedLog.approvedBy || (selectedLog.status === "CANCELLED" ? "Cancelled a request" : "Modified a request") || "N/A"],
    ["Program", selectedLog.program || "N/A"],
    ["Room", selectedLog.room || "N/A"],
    ["Requester", selectedLog.userName || "Unknown User"],
    ["Time", timeText],
    ["Date Required", selectedLog.dateRequired || "N/A"],
    // Only show note if not a rejection, like in your modal
    ...(selectedLog.action !== "Request Rejected"
      ? [["Note", selectedLog.reason || "N/A"]]
      : []),
  ];

  autoTable(doc, {
    startY: 26,
    theme: "plain",
    styles: { font: "helvetica", fontSize: 11, cellPadding: { top: 1.5, bottom: 1.5, left: 0, right: 0 } },
    columnStyles: {
      0: { cellWidth: (pageWidth - marginX * 2) * 0.28, fontStyle: "bold" },
      1: { cellWidth: (pageWidth - marginX * 2) * 0.72 },
    },
    margin: { left: marginX, right: marginX },
    head: [],
    body: details,
    didDrawPage: () => {
      drawHeader();
      drawFooter();
    },
  });

  // Section title
  let yAfterDetails = doc.lastAutoTable.finalY + 6;
  if (yAfterDetails + 10 > pageHeight - 20) {
    doc.addPage();
    drawHeader();
    yAfterDetails = 26;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Items Requested", marginX, yAfterDetails);

  // ITEMS TABLE (includes Item ID + Unit/Volume + Department like your modal)
  autoTable(doc, {
    startY: yAfterDetails + 3,
    head: [["Item ID", "Item Name", "Quantity", "Category", "Unit / Volume", "Department"]],
    body: items.map((it) => [it.itemId, it.name, it.qty, it.category, it.unitOrVol, it.department]),
    theme: "grid",
    styles: { font: "helvetica", fontSize: 10, lineColor: 200, lineWidth: 0.2 },
    headStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: (pageWidth - marginX * 2) * 0.14 }, // Item ID
      1: { cellWidth: (pageWidth - marginX * 2) * 0.30 }, // Name
      2: { cellWidth: (pageWidth - marginX * 2) * 0.10, halign: "right" }, // Qty
      3: { cellWidth: (pageWidth - marginX * 2) * 0.14 }, // Category
      4: { cellWidth: (pageWidth - marginX * 2) * 0.16 }, // Unit / Volume
      5: { cellWidth: (pageWidth - marginX * 2) * 0.16 }, // Department
    },
    margin: { left: marginX, right: marginX },
    didDrawPage: () => {
      drawHeader();
      drawFooter();
    },
  });

  // Signature block
  let y = doc.lastAutoTable.finalY + 12;
  if (y + 30 > pageHeight - 20) {
    doc.addPage();
    drawHeader();
    y = 30;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Requested by:", marginX, y);
  doc.text("Approved by:", pageWidth / 2, y);

  doc.line(marginX, y + 14, marginX + 70, y + 14);
  doc.line(pageWidth / 2, y + 14, pageWidth / 2 + 70, y + 14);

  doc.setFontSize(9);
  doc.text("(Signature over printed name & date)", marginX, y + 19);
  doc.text("(Signature over printed name & date)", pageWidth / 2, y + 19);

  const safeDate = new Date().toISOString().slice(0, 10);
  doc.save(`request-slip_${safeDate}.pdf`);
};

// Put NULS_Favicon.png in /public/images/NULS_Favicon.png

const handlePrint = () => {
  if (!selectedLog) {
    alert("No data to print.");
    return;
  }

  const esc = (v) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const rawItems =
    (selectedLog.filteredMergedData && selectedLog.filteredMergedData.length > 0
      ? selectedLog.filteredMergedData
      : selectedLog.requestList) || [];

  const items = rawItems.map((it) => {
    const unitOrVol =
      (["Chemical", "Reagent"].includes(it.category) && it.unit) ? `Unit: ${it.unit}` :
      (it.category === "Glasswares" && it.volume) ? `Volume: ${it.volume}` : "";
    return {
      itemId: it.itemIdFromInventory || "N/A",
      name: it.itemName || "",
      qty: it.quantity ?? "",
      category: it.category || "",
      unitOrVol,
      department: it.department || ""
    };
  });

  const timeText =
    selectedLog.timeFrom && selectedLog.timeTo
      ? `${esc(selectedLog.timeFrom)} – ${esc(selectedLog.timeTo)}`
      : "N/A";

  const printedOn = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  const htmlContent = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Request Slip</title>
  <style>
    :root { --text:#111; --muted:#555; --line:#ddd; --accent:#0f172a; }
    @page { size:A4; margin:18mm 14mm 18mm 14mm; }
    *{box-sizing:border-box} html,body{height:100%}
    body{font-family:Arial,Helvetica,sans-serif;color:var(--text);line-height:1.35;-webkit-print-color-adjust:exact;print-color-adjust:exact;margin:0}
    .header{position:fixed;top:0;left:0;right:0;padding:8mm 14mm 4mm;border-bottom:1px solid var(--line)}
    .footer{position:fixed;bottom:0;left:0;right:0;padding:4mm 14mm 8mm;border-top:1px solid var(--line);font-size:10px;color:var(--muted);display:flex;justify-content:space-between;align-items:center}
    .pagenum:after{content:counter(page)} .pagecount:after{content:counter(pages)}
    .brand{display:flex;align-items:center;gap:10px} .brand img{width:28px;height:28px;object-fit:contain} .brand .title{font-weight:bold;letter-spacing:.4px}
    .doc-title{text-align:center;font-weight:bold;font-size:16px;margin:0;color:var(--accent)}
    .content{padding:28mm 14mm 22mm}
    .details{display:grid;grid-template-columns:28% 72%;column-gap:12px;row-gap:6px;font-size:12px;margin:8px 0 14px}
    .label{font-weight:bold;color:var(--muted)} .value{color:var(--text);word-break:break-word}
    .section-title{font-weight:bold;font-size:13px;margin:14px 0 6px}
    table{width:100%;border-collapse:collapse;font-size:11px;page-break-inside:auto}
    thead{display:table-header-group} tr{page-break-inside:avoid;page-break-after:auto}
    th,td{border:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
    thead th{background:#f4f6f8;font-weight:bold} td.qty{text-align:right}
    .sig-row{display:grid;grid-template-columns:1fr 1fr;column-gap:18mm;margin-top:16px}
    .sig{margin-top:18px;font-size:11px} .sig .line{height:1px;background:var(--line);margin:28px 0 4px} .sig small{color:var(--muted)}
    @media screen{body{background:#f2f2f2}.sheet{background:#fff;width:210mm;min-height:297mm;margin:0 auto;box-shadow:0 2px 10px rgba(0,0,0,.1)}}
  </style>
</head>
<body>
    <div class="header">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div class="brand" style="display:flex; align-items:center; gap:8px;">
        <img src="/NULS_Favicon.png" alt="Logo" style="width:28px; height:28px; object-fit:contain;" />
        <div class="title" style="font-weight:bold; font-size:13px;">NULS</div>
      </div>
      <h1 class="doc-title" style="margin:0; font-size:16px; font-weight:bold; color:#0f172a; text-align:center;">
        REQUEST SLIP
      </h1>
      <div style="width:28px;"></div> <!-- keeps spacing symmetric -->
    </div>
  </div>


  <div class="footer">
    <div>Printed on: ${esc(printedOn)}</div>
    
  </div>

  <div class="sheet">
    <div class="content">
      <div class="details">
        <div class="label">Approved By</div><div class="value">${esc(selectedLog.approvedBy || (selectedLog.status === "CANCELLED" ? "Cancelled a request" : "Modified a request") || "N/A")}</div>
        <div class="label">Program</div><div class="value">${esc(selectedLog.program || "N/A")}</div>
        <div class="label">Room</div><div class="value">${esc(selectedLog.room || "N/A")}</div>
        <div class="label">Requester</div><div class="value">${esc(selectedLog.userName || "Unknown User")}</div>
        <div class="label">Time</div><div class="value">${timeText}</div>
        <div class="label">Date Required</div><div class="value">${esc(selectedLog.dateRequired || "N/A")}</div>
        ${
          selectedLog.action !== "Request Rejected"
            ? `<div class="label">Note</div><div class="value">${esc(selectedLog.reason || "N/A")}</div>`
            : ""
        }
      </div>

      <div class="section-title">Items Requested</div>
      <table>
        <thead>
          <tr>
            <th style="width:14%;">Item ID</th>
            <th style="width:30%;">Item Name</th>
            <th style="width:10%;">Quantity</th>
            <th style="width:14%;">Category</th>
            <th style="width:16%;">Unit / Volume</th>
            <th style="width:16%;">Department</th>
          </tr>
        </thead>
        <tbody>
          ${
            items.length === 0
              ? `<tr><td colspan="6" style="text-align:center;color:#888;">No items</td></tr>`
              : items.map((it) => `
                <tr>
                  <td>${esc(it.itemId)}</td>
                  <td>${esc(it.name)}</td>
                  <td class="qty">${esc(it.qty)}</td>
                   <td>${esc(it.unitOrVol)}</td>
                  <td>${esc(it.category)}</td>
                  <td>${esc(it.department)}</td>
                </tr>
              `).join("")
          }
        </tbody>
      </table>

      <div class="sig-row">
        <div class="sig">
          <div>Requested by:</div>
          <div class="line"></div>
          <small>(Signature over printed name & date)</small>
        </div>
        <div class="sig">
          <div>Approved by:</div>
          <div class="line"></div>
          <small>(Signature over printed name & date)</small>
        </div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function(){ window.print(); };
  </script>
</body>
</html>
  `;

  const w = window.open("", "_blank");
  if (!w) {
    alert("Popup blocked. Please allow popups to print.");
    return;
  }
  w.document.open();
  w.document.write(htmlContent);
  w.document.close();
};


  return (
    <Layout style={{ minHeight: "100vh"}}>
          <div style={{
            background: "linear-gradient(135deg, #0b2d39 0%, #165a72 100%)",
            borderRadius: "16px",
            padding: "32px",
            margin: '20px',
            marginBottom: "20px",
            boxShadow: "0 8px 32px rgba(11, 45, 57, 0.15)",
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px"
            }}>
              <div>
                <h1 style={{
                  color: "#ffffff",
                  fontSize: "28px",
                  fontWeight: "700",
                  margin: "0 0 8px 0",
                  textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)"
                }}>
                  Status Page
                </h1>
                <p style={{
                  color: "#a8d5e5",
                  fontSize: "16px",
                  margin: "0",
                  fontWeight: "500"
                }}>
                  Monitor and track your requisitions on this page.
                </p>
              </div>
            </div>
          </div>

<Tabs
  activeKey={activeTabKey}
  onChange={(key) => setActiveTabKey(key)}
  className="two-step-tabs"
  items={[
    {
      key: "pending",
      label: (
        <span className="tab-label">
          <ClockCircleOutlined style={{ marginRight: 6, color: "#f59e0b" }} />
          Pending
        </span>
      ),
      children: <div className="tab-content">{renderPendingTab()}</div>,
    },
    {
      key: "approved",
      label: (
        <span className="tab-label">
          <LikeOutlined style={{ marginRight: 6, color: "#1c325aff" }} />
          Approved
        </span>
      ),
      children: <div className="tab-content">{renderApprovedTab()}</div>,
    },
    {
      key: "deployed",
      label: (
        <span className="tab-label">
          <SendOutlined style={{ marginRight: 6, color: "#0284c7" }} />
          Received
        </span>
      ),
      children: <div className="tab-content">{renderDeployedTab()}</div>,
    },
    {
      key: "completed",
      label: (
        <span className="tab-label">
          <CheckCircleOutlined style={{ marginRight: 6, color: "#0d9488" }} />
          Released & Completed
        </span>
      ),
      children: <div className="tab-content">{renderReturnedTab()}</div>,
    },
    {
      key: "unclaimed",
      label: (
        <span className="tab-label">
          <ClockCircleOutlined style={{ marginRight: 6, color: "#f97316" }} />
          Unclaimed
        </span>
      ),
      children: <div className="tab-content">{renderUnclaimedTab()}</div>,
    },
    {
      key: "rejected",
      label: (
        <span className="tab-label">
          <CloseOutlined style={{ marginRight: 6, color: "#dc2626" }} />
          Rejected
        </span>
      ),
      children: <div className="tab-content">{renderRejectedTab()}</div>,
    },
  ]}
/>






     
      <Modal
        visible={modalVisible}
        zIndex={1015}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        className="other-modal"
      >
        {selectedLog && (
          <div style={{paddingTop: 50}}>
              <div className="modal-header" style={{backgroundColor: getBGColor(selectedLog.action)}}>
                {getIcon(selectedLog.action)}
                <p style={{fontSize: 20, margin: 0, color: 'white', fontWeight: 600}}>Requisition Slip - {getLabel(selectedLog.action)}</p>
              </div>
<div id="activity-details-content">
  <Title level={5}>Request Details:</Title>
 <Descriptions
  bordered
  size="small"
  column={{ xs: 1, sm: 1, md: 2 }} // responsive 2 cols
>
  <Descriptions.Item label="Approved By">
    {selectedLog.status === 'CANCELLED'
      ? 'Cancelled a request'
      : selectedLog.approvedBy || 'Modified a request'}
  </Descriptions.Item>

  <Descriptions.Item label="Program">
    {selectedLog.program || 'N/A'}
  </Descriptions.Item>

  <Descriptions.Item label="Room">
    {selectedLog.room || 'N/A'}
  </Descriptions.Item>

    <Descriptions.Item label="Requester">
    {selectedLog.userName || 'Unknown User'}
  </Descriptions.Item>

  <Descriptions.Item label="Time">
    {selectedLog.timeFrom && selectedLog.timeTo
      ? `${selectedLog.timeFrom} - ${selectedLog.timeTo}`
      : 'N/A'}
  </Descriptions.Item>

  <Descriptions.Item label="Date Required">
    {selectedLog.dateRequired || 'N/A'}
  </Descriptions.Item>

  {selectedLog.action !== 'Request Rejected' && (
    <Descriptions.Item label="Note">
      {selectedLog.reason || 'N/A'}
    </Descriptions.Item>
  )}

  {selectedLog.action === 'Unclaimed' && selectedLog.unclaimedComment && (
    <Descriptions.Item label="Unclaimed Reason">
      {selectedLog.unclaimedComment}
    </Descriptions.Item>
  )}
</Descriptions>


  {/* Separate Items Table */}
  <div style={{ marginTop: 40 }}>
    <Title level={5}>Items Requested</Title>
    {(selectedLog.filteredMergedData || selectedLog.requestList)?.length > 0 ? (
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: "8px", background: "#f5f5f5" }}>Item ID</th>
            <th style={{ border: "1px solid #ddd", padding: "8px", background: "#f5f5f5" }}>Item Name</th>
            <th style={{ border: "1px solid #ddd", padding: "8px", background: "#f5f5f5" }}>Quantity</th>
            <th style={{ border: "1px solid #ddd", padding: "8px", background: "#f5f5f5" }}>Category</th>
            <th style={{ border: "1px solid #ddd", padding: "8px", background: "#f5f5f5" }}>Unit</th>
          </tr>
        </thead>
        <tbody>
          {(selectedLog.filteredMergedData || selectedLog.requestList).map((item, index) => (
            <tr key={index}>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {item.itemIdFromInventory || item.itemId || "N/A"}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {item.itemName}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {item.quantity}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {item.category || "N/A"}
              </td>

              
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {(item.category === "Chemical" || item.category === "Reagent") && item.unit && (
                    <li>Unit: {item.unit}</li>
                  )}
                  {item.category === "Glasswares" && item.volume && (
                    <li>Volume: {item.volume}</li>
                  )}
                  {selectedLog.action === "Request Rejected" && (item.reason || item.rejectionReason) && (
                    <>
                      {item.reason && <li><strong>Note:</strong> {item.reason}</li>}
                      {item.rejectionReason && (
                        <li><strong>Rejection Note:</strong> {item.rejectionReason}</li>
                      )}
                    </>
                  )}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p style={{ marginTop: 8 }}>None</p>
    )}
  </div>
</div>


            {/* Show PDF and Print buttons if approved */}
            {(selectedLog.status === 'APPROVED' || selectedLog.action === 'Request Approved') && (
              <div style={{ marginTop: 70, display: 'flex', gap: 8 }}>
                <button
                  style={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                  onClick={handleGeneratePDF}
                >
                  Download PDF
                </button>
                <button
                  style={{
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                  onClick={handlePrint}
                >
                  Print
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reorder Confirmation Modal */}
      <Modal
        title="Reorder Request"
        open={reorderModalVisible}
        onCancel={handleReorderCancel}
        onOk={handleReorderConfirm}
        zIndex={1030}
        okText="Submit Reorder"
        cancelText="Cancel"
        width={700}
        okButtonProps={{
          disabled: !reorderLiabilityAccepted,
          style: {
            color: !reorderLiabilityAccepted ? 'white' : undefined,
            backgroundColor: !reorderLiabilityAccepted ? '#d9d9d9' : undefined,
            borderColor: !reorderLiabilityAccepted ? '#d9d9d9' : undefined
          }
        }}
      >
        {selectedCompletedOrder && (
          <div>
            <p style={{ marginBottom: 20, color: '#666' }}>
              Please review and modify the details for your reorder request:
            </p>
            
            <Form
              form={reorderForm}
              layout="vertical"
                             initialValues={{
                 dateRequired: selectedCompletedOrder.fullData.dateRequired ? 
                   dayjs(selectedCompletedOrder.fullData.dateRequired, "YYYY-MM-DD") : null,
                 timeFrom: selectedCompletedOrder.fullData.timeFrom ? 
                   dayjs(selectedCompletedOrder.fullData.timeFrom, "HH:mm") : null,
                 timeTo: selectedCompletedOrder.fullData.timeTo ? 
                   dayjs(selectedCompletedOrder.fullData.timeTo, "HH:mm") : null,
                 reason: selectedCompletedOrder.fullData.reason || ""
               }}
            >
              <div className="reorder-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="reorder-original-details">
                  <h4>Original Order Details:</h4>
                  <Descriptions bordered size="small" column={1}>
                    <Descriptions.Item label="Requester">
                      {selectedCompletedOrder.fullData.userName}
                    </Descriptions.Item>
                    <Descriptions.Item label="Program">
                      {selectedCompletedOrder.fullData.program}
                    </Descriptions.Item>
                    <Descriptions.Item label="Room">
                      {selectedCompletedOrder.fullData.room}
                    </Descriptions.Item>
                    <Descriptions.Item label="Usage Type">
                      {selectedCompletedOrder.fullData.usageType}
                    </Descriptions.Item>
                  </Descriptions>
                </div>

                <div className="reorder-new-details">
                  <h4>New Request Details:</h4>
                  <Form.Item
                    label="Date Required"
                    name="dateRequired"
                    rules={[{ required: true, message: 'Please select a date!' }]}
                  >
                    <DatePicker 
                      style={{ width: '100%' }}
                      placeholder="Select date"
                      format="YYYY-MM-DD"
                      onChange={(date, dateString) => {
                        console.log('Reorder DatePicker onChange:', { date, dateString });
                        
                        // Check for 7-day warning immediately when date is selected
                        if (dateString && checkDateWarning(dateString)) {
                          const daysDiff = getDaysDifference(dateString);
                          setDaysDifference(daysDiff);
                          console.log('Showing warning modal for reorder date:', dateString, 'days difference:', daysDiff);
                          setIsWarningModalVisible(true);
                        }
                      }}
                      disabledDate={(current) => {
                        const today = moment().startOf('day');
                        const threeWeeksFromNow = moment().add(3, 'weeks').endOf('day');
                        return (
                          current && (
                            current < today || current > threeWeeksFromNow
                          )
                        );
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Time From"
                    name="timeFrom"
                    rules={[{ required: true, message: 'Please select start time!' }]}
                  >
                    <TimePicker 
                      style={{ width: '100%' }}
                      placeholder="Select start time"
                      format="HH:mm"
                      minuteStep={10}
                      use12Hours={false}
                      hideDisabledOptions
                      disabledHours={() => {
                        // hide hours outside 7–21
                        return [...Array(24).keys()].filter(h => h < 7 || h > 21);
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Time To"
                    name="timeTo"
                    rules={[{ required: true, message: 'Please select end time!' }]}
                  >
                    <TimePicker 
                      style={{ width: '100%' }}
                      placeholder="Select end time"
                      format="HH:mm"
                      minuteStep={10}
                      use12Hours={false}
                      hideDisabledOptions
                      disabledHours={() => {
                        const timeFromValue = reorderForm.getFieldValue('timeFrom');
                        if (!timeFromValue) return [];
                        const [startHour] = timeFromValue.format('HH:mm').split(":").map(Number);
                        // hide hours before startHour and outside 7–21
                        return [...Array(24).keys()].filter(h => h < Math.max(7, startHour) || h > 21);
                      }}
                      disabledMinutes={(selectedHour) => {
                        const timeFromValue = reorderForm.getFieldValue('timeFrom');
                        if (!timeFromValue) return [];
                        const [startHour, startMinute] = timeFromValue.format('HH:mm').split(":").map(Number);
                        if (selectedHour === startHour) {
                          return Array.from({ length: startMinute }, (_, i) => i);
                        }
                        return [];
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Note/Reason"
                    name="reason"
                  >
                    <Input.TextArea 
                      rows={3}
                      placeholder="Enter reason for request (optional)"
                    />
                  </Form.Item>
                </div>
              </div>
              
              <div style={{ marginTop: 20 }}>
                <h4>Items to Reorder:</h4>
                <div style={{ 
                  border: '1px solid #d9d9d9', 
                  borderRadius: 6, 
                  padding: 12, 
                  backgroundColor: '#fafafa',
                  maxHeight: 200,
                  overflowY: 'auto'
                }}>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {cleanItemData(selectedCompletedOrder.fullData.filteredMergedData || selectedCompletedOrder.fullData.requestList || []).map((item, index) => (
                      <li key={index} style={{ marginBottom: 8 }}>
                        <strong>{item.itemName}</strong> - Quantity: {item.quantity}
                        {item.department && ` (${item.department})`}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #e9ecef" }}>
                <Checkbox
                  checked={reorderLiabilityAccepted}
                  onChange={(e) => setReorderLiabilityAccepted(e.target.checked)}
                  style={{ fontSize: "14px", lineHeight: "1.5" }}
                >
                  <span style={{ fontWeight: "500" }}>
                    {getLiabilityStatement(cleanItemData(selectedCompletedOrder.fullData.filteredMergedData || selectedCompletedOrder.fullData.requestList || []))}
                  </span>
                </Checkbox>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* Notification */}
      <Modal
        title="Notification"
        open={notificationVisible}
        onCancel={() => setNotificationVisible(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setNotificationVisible(false)}>
            OK
          </Button>
        ]}
      >
        <p>{notificationMessage}</p>
      </Modal>

      {/* Warning Modal for 7-day notice */}
      <WarningModal
        visible={isWarningModalVisible}
        onOk={async () => {
          setIsWarningModalVisible(false);
          
          // Increment warning count when user proceeds with date < 7 days
          await incrementWarningCount();
          
          // Continue with the reorder process - the form validation will be handled by the submit button
        }}
        onCancel={() => setIsWarningModalVisible(false)}
        dateRequired={reorderForm.getFieldValue('dateRequired')?.format('YYYY-MM-DD')}
        daysDifference={daysDifference}
      />
    </Layout>
  );
};

export default HistoryLog;

