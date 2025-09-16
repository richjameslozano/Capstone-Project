
import React, { useState, useEffect, useRef } from "react";
import { Layout, Button, Typography, Modal, Table, notification, Input, Select, Spin } from "antd";
import "../styles/adminStyle/PendingRequest.css";
import { db } from "../../backend/firebase/FirebaseConfig"; 
import { collection, getDocs, getDoc, doc, addDoc, query, where, deleteDoc, serverTimestamp, onSnapshot, updateDoc, orderBy } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions"
import { getAuth } from "firebase/auth";
import RequisitionRequestModal from "../customs/RequisitionRequestModal";
import ApprovedRequestModal from "../customs/ApprovedRequestModal";
import NotificationModal from "../customs/NotificationModal";
import { ArrowDownOutlined, ArrowUpOutlined, BookOutlined, CalendarOutlined, ClockCircleOutlined, ExperimentOutlined, FileTextFilled, FilterOutlined, MoreOutlined, SearchOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const PendingRequest = () => {

  const [searchTerm, setSearchTerm] = useState('');
  const [checkedItems, setCheckedItems] = useState({});
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [userViolationCounts, setUserViolationCounts] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [requests, setRequests] = useState([]);
  const [selectedApprovedRequest, setSelectedApprovedRequest] = useState(null);
  const [isApprovedModalVisible, setIsApprovedModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [pendingApprovalData, setPendingApprovalData] = useState(null); 
  const [isMultiRejectModalVisible, setIsMultiRejectModalVisible] = useState(false);
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [isFinalizeModalVisible, setIsFinalizeModalVisible] = useState(false);
  const [firstRequestMap, setFirstRequestMap] = useState({});
  const [approvalRequestedIds, setApprovalRequestedIds] = useState([]);
  const [requestOrderMap, setRequestOrderMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [editableItems, setEditableItems] = useState([]);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [multiRejectLoading, setMultiRejectLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'pastDue'

const sanitizeInput = (input) =>
  input

    .replace(/\s+/g, " ")         
    .replace(/[^a-z0-9 \-.,()]/g, "");


const [selectedFilter, setSelectedFilter] = useState('All');
const sanitizedSearch = sanitizeInput(searchTerm).toLowerCase();

const filteredRequests = requests.filter((request) => {
  return (
    request.userName?.toLowerCase().includes(sanitizedSearch) ||
    request.room?.toLowerCase().includes(sanitizedSearch) ||
    request.course?.toLowerCase().includes(sanitizedSearch) ||
    request.courseDescription?.toLowerCase().includes(sanitizedSearch)
  );
});

const getCollegeByDepartment = async (departmentName) => {
  if (!departmentName) return null;

  const q = query(
    collection(db, "departments"),
    where("name", "==", departmentName)
  );

  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    return snapshot.docs[0].data().college || null;
  }
  return null;
};

// Function to fetch violation count for a user
const fetchUserViolationCount = async (userName) => {
  try {
    const q = query(
      collection(db, "accounts"),
      where("name", "==", userName)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      return userData.violationCount || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error fetching user violation count:', error);
    return 0;
  }
};


  useEffect(() => {
    if (selectedRequest?.requestList) {
      const itemsWithMax = selectedRequest.requestList.map((item) => ({
        ...item,
        quantity: item.quantity,            // Editable
        maxQuantity: item.quantity,         // Store original as max
      }));
      setEditableItems(itemsWithMax);
    }
  }, [selectedRequest]);

  useEffect(() => {
    const userRequestRef = collection(db, "userrequests");
    const q = query(userRequestRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        setLoading(true); // Start loading

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
                  console.error("Error fetching inventory item:", err);
                }
              }

              return {
                ...item,
                itemIdFromInventory: itemId,
              };
            })
          );

          fetched.push({
            ...data,
            id: docSnap.id,
            firestoreId: docSnap.id,
            requestList: enrichedItems,
            timeFrom: data.timeFrom || "N/A",
            timeTo: data.timeTo || "N/A",
          });
        }

        // Determine first request per item+date
        const firstRequestsMap = {};
        const requestRankMap = {};

        fetched.forEach((req) => {
          const date = req.dateRequired;
          const timestamp = req.timestamp?.toDate?.() || new Date();

          (req.requestList || []).forEach((item) => {
            const key = `${item.selectedItemId}_${date}`;

            // First request logic
            if (!firstRequestsMap[key] || timestamp < firstRequestsMap[key].timestamp) {
              firstRequestsMap[key] = {
                requestId: req.id,
                timestamp,
              };
            }

            // Build list for rank ordering
            if (!requestRankMap[key]) {
              requestRankMap[key] = [];
            }
            requestRankMap[key].push({ requestId: req.id, timestamp });
          });
        });

        const simpleFirstRequestMap = {};
        for (const key in firstRequestsMap) {
          simpleFirstRequestMap[key] = firstRequestsMap[key].requestId;
        }

        // Sort and compute rank per request per item+date
        const requestPositionMap = {};
        for (const key in requestRankMap) {
          const sorted = requestRankMap[key].sort((a, b) => a.timestamp - b.timestamp);
          sorted.forEach((entry, index) => {
            if (!requestPositionMap[entry.requestId]) {
              requestPositionMap[entry.requestId] = {};
            }
            requestPositionMap[entry.requestId][key] = index + 1; // 1-based index
          });
        }

        // Final state updates
        setRequests(fetched);
        setFirstRequestMap(simpleFirstRequestMap);
        setRequestOrderMap(requestPositionMap);

        // Fetch violation counts for all unique users
        const uniqueUserNames = [...new Set(fetched.map(req => req.userName).filter(Boolean))];
        const violationCounts = {};
        
        for (const userName of uniqueUserNames) {
          const violationCount = await fetchUserViolationCount(userName);
          violationCounts[userName] = violationCount;
        }
        
        setUserViolationCounts(violationCounts);

        setLoading(false); // End loading
      },
      (error) => {
        setLoading(false);
        console.error("Error fetching user requests:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // const handleViewDetails = (request) => {
  //   setSelectedRequest(request);
  //   setIsModalVisible(true);
  // };

  const handleViewDetails = async (request) => {
    if (!request || !request.department) {
      console.error("Department is undefined. Cannot fetch college.");
      setSelectedRequest(request);
      setSelectedCollege(null); // Or some default
      setIsModalVisible(true);
      return;
    }

    const college = await getCollegeByDepartment(request.department);
    setSelectedRequest(request);
    setSelectedCollege(college);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setCheckedItems({});
    setEditableItems([]);
    setIsModalVisible(false);
    setSelectedRequest(null);
    setApproveLoading(false);
    setRejectLoading(false);
    setMultiRejectLoading(false);
    setIsMultiRejectModalVisible(false);
    setIsFinalizeModalVisible(false);
  };

  const handleOpenFinalizeModal = () => {
    setIsMultiRejectModalVisible(false);
    setIsFinalizeModalVisible(true);
  };



   const handleMultiRejectConfirm = async () => {
    setMultiRejectLoading(true);
    setIsMultiRejectModalVisible(false);
  
    const { enrichedItems, uncheckedItems, selectedRequest } = pendingApprovalData;

    try {
      const accountRef = doc(db, "accounts", selectedRequest.accountId);
      const accountSnap = await getDoc(accountRef);

      if (accountSnap.exists()) {
        const accountData = accountSnap.data();
        const isDisabled = accountData.disabled || false; // Adjust field name if different

        if (isDisabled) {
          setNotificationMessage("Cannot approve: The user's account is disabled.");
          setIsNotificationVisible(true);
          setMultiRejectLoading(false);
          return;
        }
        
      } else {
      
      }

    } catch (error) {

      setNotificationMessage("Error verifying account status. Please try again.");
      setIsNotificationVisible(true);
      setMultiRejectLoading(false);
      return;
    }

    // 🔍 Check inventory quantities before approval
    const insufficientItems = [];
    
    for (const item of enrichedItems) {
      const inventoryId = item.selectedItemId;
      const requestedQty = Number(item.quantity);
      
      if (!inventoryId || isNaN(requestedQty) || requestedQty <= 0) {
        continue;
      }

      try {
        const inventoryRef = doc(db, "inventory", inventoryId);
        const inventorySnap = await getDoc(inventoryRef);
        
        if (!inventorySnap.exists()) {
          insufficientItems.push({
            itemName: item.itemName || "Unknown Item",
            requested: requestedQty,
            available: 0,
            reason: "Item not found in inventory"
          });
          continue;
        }

        const data = inventorySnap.data();
        const availableQty = Number(data.quantity || 0);
        
        if (availableQty < requestedQty) {
          insufficientItems.push({
            itemName: item.itemName || data.itemName || "Unknown Item",
            requested: requestedQty,
            available: availableQty,
            reason: "Insufficient quantity"
          });
        }
      } catch (error) {
        console.error("Error checking inventory for item:", item.itemName, error);
        insufficientItems.push({
          itemName: item.itemName || "Unknown Item",
          requested: requestedQty,
          available: 0,
          reason: "Error checking inventory"
        });
      }
    }

    // If there are insufficient items, show error and prevent approval
    if (insufficientItems.length > 0) {
      const errorMessage = insufficientItems.map(item => 
        `${item.itemName}: Requested ${item.requested}, Available ${item.available} (${item.reason})`
      ).join('\n');
      
      setNotificationMessage(`Cannot approve request. Insufficient inventory:\n${errorMessage}`);
      setIsNotificationVisible(true);
      setMultiRejectLoading(false);
      return;
    }
  
    try {
      const rejectedItems = await Promise.all(
        uncheckedItems.map(async (item, index) => {
          const selectedItemId = item.selectedItemId || item.selectedItem?.value;
          const itemKey = `${selectedItemId}-${index}`;
          let itemType = "Unknown";
  
          if (selectedItemId) {
            try {
              const inventoryDoc = await getDoc(doc(db, "inventory", selectedItemId));
              if (inventoryDoc.exists()) {
                itemType = inventoryDoc.data().type || "Unknown";
              }

            } catch (err) {
    
            }
          }
  
          return {
            ...item,
            selectedItemId,
            itemType,
            reason: rejectionReasons[itemKey] || "No reason provided",
          };
        })
      );
  
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const userEmail = currentUser.email;
  
      // Fetch the user name from Firestore
      let userName = "Unknown";
      try {
        const userQuery = query(collection(db, "accounts"), where("email", "==", userEmail));
        const userSnapshot = await getDocs(userQuery);
  
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          const userData = userDoc.data();
          userName = userData.name || "Unknown";
        }

      } catch (error) {

      }
  
      const requestLogEntry = {
        accountId: selectedRequest.accountId || "N/A",
        userName: selectedRequest.userName || "N/A",
        room: selectedRequest.room || "N/A",
        course: selectedRequest.course || "N/A",
        courseDescription: selectedRequest.courseDescription || "N/A",
        dateRequired: selectedRequest.dateRequired || "N/A",
        timeFrom: selectedRequest.timeFrom || "N/A",
        timeTo: selectedRequest.timeTo || "N/A",
        timestamp: selectedRequest.timestamp || "N/A",
        rawTimestamp: new Date(),
        requestList: enrichedItems,
        status: "Approved",
        approvedBy: userName,
        reason: selectedRequest.reason || "No reason provided",
        program: selectedRequest.program,
        usageType: selectedRequest.usageType || "N/A",  
      };
  
      const rejectLogEntry = {
        accountId: selectedRequest.accountId || "N/A",
        userName: selectedRequest.userName || "N/A",
        room: selectedRequest.room || "N/A",
        course: selectedRequest.course || "N/A",
        courseDescription: selectedRequest.courseDescription || "N/A",
        dateRequired: selectedRequest.dateRequired || "N/A",
        timeFrom: selectedRequest.timeFrom || "N/A",
        timeTo: selectedRequest.timeTo || "N/A",
        timestamp: selectedRequest.timestamp || "N/A",
        rawTimestamp: new Date(),
        requestList: rejectedItems,
        status: "Rejected",
        rejectedBy: userName,
        reason: rejectionReason || "No reason provided",
        program: selectedRequest.program,
        usageType: selectedRequest.usageType || "N/A",  
      };
  
      const logRequestOrReturn = async (
        userId,
        userName,
        action,
        requestDetails,
        extraInfo = {}
      ) => {
        await addDoc(collection(db, `accounts/${userId}/historylog`), {
          action,
          userName,
          timestamp: serverTimestamp(),
          requestList: requestDetails,
          ...extraInfo,
        });
      };
  
      // Log approved items
      await logRequestOrReturn(
        selectedRequest.accountId,
        selectedRequest.userName,
        "Request Approved",
        enrichedItems,
        {
          approvedBy: userName,
          course: selectedRequest.course || "N/A",
          courseDescription: selectedRequest.courseDescription || "N/A",
          dateRequired: selectedRequest.dateRequired,
          reason: selectedRequest.reason,
          room: selectedRequest.room,
          program: selectedRequest.program,
          timeFrom: selectedRequest.timeFrom || "N/A",
          timeTo: selectedRequest.timeTo || "N/A",
          timestamp: selectedRequest.timestamp || "N/A",
          rawTimestamp: new Date(),
          usageType: selectedRequest.usageType || "N/A",  
        }
      );
  
      // Log rejected items
      if (rejectedItems.length > 0) {
        await logRequestOrReturn(
          selectedRequest.accountId,
          selectedRequest.userName,
          "Request Rejected",
          rejectedItems,
          {
            rejectedBy: userName,
            course: selectedRequest.course || "N/A",
            courseDescription: selectedRequest.courseDescription || "N/A",
            dateRequired: selectedRequest.dateRequired,
            reason: rejectedItems.map(item => item.reason).join(", ") || "No reason provided",
            room: selectedRequest.room,
            program: selectedRequest.program,
            timeFrom: selectedRequest.timeFrom || "N/A",
            timeTo: selectedRequest.timeTo || "N/A",
            timestamp: selectedRequest.timestamp || "N/A",
            rawTimestamp: new Date(),
            usageType: selectedRequest.usageType || "N/A",  
          }
        );
      }




try {
        for (const item of enrichedItems) {
          const inventoryId = item.selectedItemId;
          const requestedQty = Number(item.quantity);
          const labRoomId = item.labRoom;

          if (!inventoryId || isNaN(requestedQty) || requestedQty <= 0) {
           
            continue;
          }

          if (!labRoomId) {
         
            continue;
          }

          const inventoryRef = doc(db, "inventory", inventoryId);
          const inventorySnap = await getDoc(inventoryRef);
          if (!inventorySnap.exists()) {
           
            continue;
          }

          const data = inventorySnap.data();
          const currentQty = Number(data.quantity || 0);
          const newQty = Math.max(currentQty - requestedQty, 0);
          await updateDoc(inventoryRef, { quantity: newQty });

         console.log("📌 Attempting to log usage:", {
          itemId: data.itemId,
          requestedQty
        });

        try {
          await addDoc(collection(db, "itemUsage"), {
            itemId: data.itemId,
            itemName:data.itemName,
            usedQuantity: requestedQty,
            timestamp: serverTimestamp(),
          });
          console.log("✅ itemUsage logged");
        } catch (logErr) {
          console.error("❌ Failed to log itemUsage:", logErr);
        }

         

          // ⚙️ Update inventory condition breakdown
          let remaining = requestedQty;
          const good = data.condition?.Good ?? 0;
          const damage = data.condition?.Damage ?? 0;
          const defect = data.condition?.Defect ?? 0;
          const lost = data.condition?.Lost ?? 0;

          let newGood = good;
          let newDamage = damage;
          let newDefect = defect;
          let newLost = lost;

          if (remaining > 0) {
            const deductFromGood = Math.min(newGood, remaining);
            newGood -= deductFromGood;
            remaining -= deductFromGood;
          }

          if (remaining > 0) {
            const deductFromDamage = Math.min(newDamage, remaining);
            newDamage -= deductFromDamage;
            remaining -= deductFromDamage;
          }

          if (remaining > 0) {
            const deductFromDefect = Math.min(newDefect, remaining);
            newDefect -= deductFromDefect;
            remaining -= deductFromDefect;
          }

          if (remaining > 0) {
            const deductFromLost = Math.min(newLost, remaining);
            newLost -= deductFromLost;
            remaining -= deductFromLost;
          }

          await updateDoc(inventoryRef, {
            'condition.Good': newGood,
            'condition.Damage': newDamage,
            'condition.Defect': newDefect,
            'condition.Lost': newLost,
          });



          // 🔁 Update labRoom item quantity
          const roomNumber = item.labRoom; // e.g. "0930"
          const labRoomCollectionRef = collection(db, "labRoom");
          const q = query(labRoomCollectionRef, where("roomNumber", "==", roomNumber));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
           
            return;
          }

          // 2. Get Firestore doc ID of the labRoom
          const labRoomDoc = querySnapshot.docs[0];
          const labRoomDocId = labRoomDoc.id;

          // 3. Query items subcollection for item with matching itemId
          const itemId = data.itemId; // e.g. "DENT02"
          const itemsCollectionRef = collection(db, "labRoom", labRoomDocId, "items");
          const itemQuery = query(itemsCollectionRef, where("itemId", "==", itemId));
          const itemSnapshot = await getDocs(itemQuery);

          if (itemSnapshot.empty) {
          
            return;
          }

          // 4. Get the Firestore doc ID of the item document
          const itemDoc = itemSnapshot.docs[0];
          const itemDocId = itemDoc.id;
          const labRoomItemRef = doc(db, "labRoom", labRoomDocId, "items", itemDocId);
          const labData = itemDoc.data();

          const currentLabQty = Number(labData.quantity || 0);
          const newLabQty = Math.max(currentLabQty - requestedQty, 0);
          await updateDoc(labRoomItemRef, { quantity: newLabQty });
          
        

          // Update condition breakdown
          let labGood = labData.condition?.Good ?? 0;
          let labDamage = labData.condition?.Damage ?? 0;
          let labDefect = labData.condition?.Defect ?? 0;
          let labLost = labData.condition?.Lost ?? 0;

          let remainingLab = requestedQty;

          if (remainingLab > 0) {
            const deductFromLabGood = Math.min(labGood, remainingLab);
            labGood -= deductFromLabGood;
            remainingLab -= deductFromLabGood;
          }

          if (remainingLab > 0) {
            const deductFromLabDamage = Math.min(labDamage, remainingLab);
            labDamage -= deductFromLabDamage;
            remainingLab -= deductFromLabDamage;
          }

          if (remainingLab > 0) {
            const deductFromLabDefect = Math.min(labDefect, remainingLab);
            labDefect -= deductFromLabDefect;
            remainingLab -= deductFromLabDefect;
          }

          if (remainingLab > 0) {
            const deductFromLabLost = Math.min(labLost, remainingLab);
            labLost -= deductFromLabLost;
            remainingLab -= deductFromLabLost;
          }

          await updateDoc(labRoomItemRef, {
            'condition.Good': labGood,
            'condition.Damage': labDamage,
            'condition.Defect': labDefect,
            'condition.Lost' : labLost,
          });
        }
        
      } catch (err) {
       
      }
    
      await addDoc(collection(db, "requestlog"), requestLogEntry);
  
      if (rejectedItems.length > 0) {
        await addDoc(collection(db, "requestlog"), rejectLogEntry);
      }
  
      const fixedItems = enrichedItems.filter(item => item.itemType === "Fixed");
  
      if (fixedItems.length > 0) {
        const formattedItems = fixedItems.map(item => ({
          category: item.category || "N/A",
          condition: item.condition || "N/A",
          department: item.department || "N/A",
          itemName: item.itemName || "N/A",
          itemDetails: item.itemDetails || "N/A",
          itemId: item.itemIdFromInventory,
          quantity: item.quantity || "1",
          selectedItemId: item.selectedItemId || "N/A",
          status: item.status || "Available",
          program: item.program || "N/A",
          course: item.course || "N/A",
          courseDescription: item.courseDescription || "N/A",
          reason: item.reason || "No reason provided",
          labRoom: item.labRoom || "N/A",
          timeFrom: item.timeFrom || "N/A",
          timeTo: item.timeTo || "N/A",
          usageType: item.usageType || "N/A",
          scannedCount: 0,
        }));
  
        const borrowCatalogEntry = {
          accountId: selectedRequest.accountId || "N/A",
          userName: selectedRequest.userName || "N/A",
          room: selectedRequest.room || "N/A",
          course: selectedRequest.course || "N/A",
          courseDescription: selectedRequest.courseDescription || "N/A",
          dateRequired: selectedRequest.dateRequired || "N/A",
          timeFrom: selectedRequest.timeFrom || "N/A",
          timeTo: selectedRequest.timeTo || "N/A",
          timestamp: selectedRequest.timestamp || "N/A",
          rawTimestamp: new Date(),
          requestList: formattedItems,
          status: "Borrowed",
          approvedBy: userName,
          reason: selectedRequest.reason || "No reason provided",
          program: selectedRequest.program,
        };
  
        const userRequestLogEntry = {
          ...requestLogEntry,
          status: "Approved",
          approvedBy: userName,
          timestamp: selectedRequest.timestamp || "N/A",
          rawTimestamp: new Date(),
        };
  
        await addDoc(collection(db, "borrowcatalog"), borrowCatalogEntry);
  
        await addDoc(collection(db, "accounts", selectedRequest.accountId, "userrequestlog"), userRequestLogEntry);

        // ✅ Notify the user who submitted the request
        if (selectedRequest.accountId && selectedRequest.accountId !== "system") {
          await addDoc(collection(db, `accounts/${selectedRequest.accountId}/userNotifications`), {
            action: `Rejected request for ${selectedRequest.userName}`,
            requestId: selectedRequest.id,
            userName: selectedRequest.userName,
            read: false,
            timestamp: serverTimestamp(),
          });
        }

        // ✅ Send push to the user who submitted the request
        try {
          const functions = getFunctions();
          const sendPush = httpsCallable(functions, "sendPushNotification");

          const pushTokenSnapshot = await getDocs(collection(db, "pushTokens"));
          const tokensToNotify = [];

          pushTokenSnapshot.forEach((doc) => {
            const data = doc.data();
            if (
              data?.expoPushToken &&
              data.userId === selectedRequest.userId // 👈 This should match the request sender
            ) {
              tokensToNotify.push(data.expoPushToken);
            }
          });

          for (const token of tokensToNotify) {
            const payload = {
              token,
              title: "Request Update",
              body: `Your requisition has been rejected.`, // or `rejected` if applicable
            };

            const response = await sendPush(payload);
            console.log("✅ Push sent to user:", response.data);
          }

        } catch (err) {
          console.error("❌ Push error (admin to user):", err.message || err);
        }
      }
  
      await deleteDoc(doc(db, "userrequests", selectedRequest.id));
  
      // Delete matching user request subcollection doc
      const subCollectionRef = collection(db, "accounts", selectedRequest.accountId, "userRequests");
      const subDocsSnap = await getDocs(subCollectionRef);
  
      subDocsSnap.forEach(async (docSnap) => {
        const data = docSnap.data();
        const match = (
          data.timestamp?.seconds === selectedRequest.timestamp?.seconds &&
          data.filteredMergedData?.[0]?.selectedItemId === selectedRequest.filteredMergedData?.[0]?.selectedItemId
        );
  
        if (match) {
        
          await deleteDoc(doc(db, "accounts", selectedRequest.accountId, "userRequests", docSnap.id));
        }
      });
  
      setApprovedRequests(prev => [...prev, requestLogEntry]);
      setRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
      setCheckedItems({});
      setIsModalVisible(false);
      setSelectedRequest(null);
      setIsFinalizeModalVisible(false)

      setNotificationMessage("Approval and rejection have been logged successfully.");
      setIsNotificationVisible(true);
  
      notification.success({
        message: "Request Processed",
        description: "Approval and rejection have been logged successfully.",
      });
  
    } catch (error) {
      
      notification.error({
        message: "Error",
        description: "Failed to process the request after rejection confirmation.",
      });
    } finally {
      setMultiRejectLoading(false);
    }
  };


  // FRONTEND
  const handleRejectConfirm = async () => {  
    setRejectLoading(true);
    setIsMultiRejectModalVisible(false);
  
    const { enrichedItems, uncheckedItems, selectedRequest } = pendingApprovalData;

    // 🔄 Rebuild merged list using the latest quantity edits
    const mergedRequestList = selectedRequest.requestList.map((item, index) => {
      const editedItem = editableItems?.[index]; // Use index as key
      return editedItem ? { ...item, quantity: editedItem.quantity } : item;
    });

    try {
      const accountRef = doc(db, "accounts", selectedRequest.accountId);
      const accountSnap = await getDoc(accountRef);

      if (accountSnap.exists()) {
        const accountData = accountSnap.data();
        const isDisabled = accountData.disabled || false; // Adjust field name if different

        if (isDisabled) {
          setNotificationMessage("Cannot approve: The user's account is disabled.");
          setIsNotificationVisible(true);
          setRejectLoading(false);
          return;
        }
        
      } else {
      
      }

    } catch (error) {
     
      setNotificationMessage("Error verifying account status. Please try again.");
      setIsNotificationVisible(true);
      setRejectLoading(false);
      return;
    }

    // 🔍 Check inventory quantities before approval
    const approvedItems = mergedRequestList.filter((item, index) => {
      const key = `${selectedRequest.id}-${index}`;
      return checkedItems[key]; // Only items the user selected
    });

    const insufficientItems = [];
    
    for (const item of approvedItems) {
      const inventoryId = item.selectedItemId;
      const requestedQty = Number(item.quantity);
      
      if (!inventoryId || isNaN(requestedQty) || requestedQty <= 0) {
        continue;
      }

      try {
        const inventoryRef = doc(db, "inventory", inventoryId);
        const inventorySnap = await getDoc(inventoryRef);
        
        if (!inventorySnap.exists()) {
          insufficientItems.push({
            itemName: item.itemName || "Unknown Item",
            requested: requestedQty,
            available: 0,
            reason: "Item not found in inventory"
          });
          continue;
        }

        const data = inventorySnap.data();
        const availableQty = Number(data.quantity || 0);
        
        if (availableQty < requestedQty) {
          insufficientItems.push({
            itemName: item.itemName || data.itemName || "Unknown Item",
            requested: requestedQty,
            available: availableQty,
            reason: "Insufficient quantity"
          });
        }
      } catch (error) {
        console.error("Error checking inventory for item:", item.itemName, error);
        insufficientItems.push({
          itemName: item.itemName || "Unknown Item",
          requested: requestedQty,
          available: 0,
          reason: "Error checking inventory"
        });
      }
    }

    // If there are insufficient items, show error and prevent approval
    if (insufficientItems.length > 0) {
      const errorMessage = insufficientItems.map(item => 
        `${item.itemName}: Requested ${item.requested}, Available ${item.available} (${item.reason})`
      ).join('\n');
      
      setNotificationMessage(`Cannot approve request. Insufficient inventory:\n${errorMessage}`);
      setIsNotificationVisible(true);
      setRejectLoading(false);
      setApproveLoading(false);
      return;
    }
  
    try {
      const rejectedItems = await Promise.all(
        uncheckedItems.map(async (item, index) => {
          const selectedItemId = item.selectedItemId || item.selectedItem?.value;
          let itemType = "Unknown";
      
          if (selectedItemId) {
            try {
              const inventoryDoc = await getDoc(doc(db, "inventory", selectedItemId));
              if (inventoryDoc.exists()) {
                itemType = inventoryDoc.data().type || "Unknown";
              }
            } catch (err) {
            
            }
          }
      
          const itemKey = `${selectedItemId}-${index}`;
          const rejectionReason = rejectionReasons[itemKey] || "No reason provided";
      
          return {
            ...item,
            selectedItemId,
            itemType,
            rejectionReason,
          };
        })
      );



      // Get user info from localStorage (since we're using backend authentication)
      const userEmail = localStorage.getItem("userEmail");
      const userName = localStorage.getItem("userName") || "Unknown";

      // If userName is not available in localStorage, try to fetch from Firestore
      if (!userName || userName === "Unknown") {
        try {
          const userQuery = query(collection(db, "accounts"), where("email", "==", userEmail));
          const userSnapshot = await getDocs(userQuery);

          if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            const userData = userDoc.data();
            const fetchedUserName = userData.name || "Unknown";
            // Update localStorage with the fetched name
            localStorage.setItem("userName", fetchedUserName);
          }

        } catch (error) {
          console.error("Error fetching user name from Firestore:", error);
        }
      }

      // const approvedItems = mergedRequestList.filter((item, index) => {
      //   const key = `${selectedRequest.id}-${index}`;
      //   return checkedItems[key]; // Only items the user selected
      // });
    const approvedItemsWithType = await Promise.all(
      approvedItems.map(async (item, index) => {
        let itemType = "Unknown";
        if (item.selectedItemId) {
          try {
            const inventoryDoc = await getDoc(doc(db, "inventory", item.selectedItemId));
            if (inventoryDoc.exists()) {
              itemType = inventoryDoc.data().type || "Unknown";
            }
          } catch (error) {
            console.error("Error fetching item type for approved item", error);
          }
        }

        return {
          ...item,
          itemType,
        };
      })
    );

      const requestLogEntry = {
        accountId: selectedRequest.accountId || "N/A",
        userName: selectedRequest.userName || "N/A",
        room: selectedRequest.room || "N/A",
        course: selectedRequest.course || "N/A",
        courseDescription: selectedRequest.courseDescription || "N/A",
        dateRequired: selectedRequest.dateRequired || "N/A",
        timeFrom: selectedRequest.timeFrom || "N/A",
        timeTo: selectedRequest.timeTo || "N/A",
        timestamp: selectedRequest.timestamp || "N/A",
        rawTimestamp: new Date(),
        // requestList: enrichedItems,
        requestList: approvedItems,
        status: "Approved",
        approvedBy: userName,
        reason: selectedRequest.reason || "No reason provided",
        program: selectedRequest.program,
        usageType: selectedRequest.usageType || "N/A",  
      };
  
      const rejectLogEntry = {
        accountId: selectedRequest.accountId || "N/A",
        userName: selectedRequest.userName || "N/A",
        room: selectedRequest.room || "N/A",
        course: selectedRequest.course || "N/A",
        courseDescription: selectedRequest.courseDescription || "N/A",
        dateRequired: selectedRequest.dateRequired || "N/A",
        timeFrom: selectedRequest.timeFrom || "N/A",
        timeTo: selectedRequest.timeTo || "N/A",
        timestamp: selectedRequest.timestamp || "N/A",
        rawTimestamp: new Date(),
        requestList: rejectedItems,
        status: "Rejected",
        rejectedBy: userName,
        program: selectedRequest.program,
        usageType: selectedRequest.usageType || "N/A",  
        reason: selectedRequest.reason || "No reason provided",
      };
  
      const logRequestOrReturn = async (
        userId,
        userName,
        action,
        requestDetails,
        extraInfo = {}
      ) => {
        await addDoc(collection(db, `accounts/${userId}/historylog`), {
          action,
          userName,
          timestamp: serverTimestamp(),
          requestList: requestDetails,
          ...extraInfo,
        });
      };
  

      if (enrichedItems.length > 0) {
        await addDoc(collection(db, "requestlog"), requestLogEntry);

        await logRequestOrReturn(
          selectedRequest.accountId,
          selectedRequest.userName,
          "Request Approved",
          // enrichedItems,
          approvedItems,
          {
            approvedBy: userName,
            course: selectedRequest.course || "N/A",
            courseDescription: selectedRequest.courseDescription || "N/A",
            dateRequired: selectedRequest.dateRequired,
            reason: selectedRequest.reason,
            room: selectedRequest.room,
            program: selectedRequest.program,
            timeFrom: selectedRequest.timeFrom || "N/A",
            timeTo: selectedRequest.timeTo || "N/A",
            timestamp: selectedRequest.timestamp || "N/A",
            rawTimestamp: new Date(),
            usageType: selectedRequest.usageType || "N/A",  
          }
        );
      }
  
      // Log rejected items
      if (rejectedItems.length > 0) {
        await logRequestOrReturn(
          selectedRequest.accountId,
          selectedRequest.userName,
          "Request Rejected",
          rejectedItems,
          {
            rejectedBy: userName,
            course: selectedRequest.course || "N/A",
            courseDescription: selectedRequest.courseDescription || "N/A",
            dateRequired: selectedRequest.dateRequired,
            reason: rejectionReason || "No reason provided",
            room: selectedRequest.room,
            program: selectedRequest.program,
            timeFrom: selectedRequest.timeFrom || "N/A",
            timeTo: selectedRequest.timeTo || "N/A",
            timestamp: selectedRequest.timestamp || "N/A",
            rawTimestamp: new Date(),
            usageType: selectedRequest.usageType || "N/A",  
          }
        );
      }
   
try {
        for (const item of approvedItems) {
          const inventoryId = item.selectedItemId;
          const requestedQty = Number(item.quantity);
          const labRoomId = item.labRoom;

          if (!inventoryId || isNaN(requestedQty) || requestedQty <= 0) {
           
            continue;
          }

          if (!labRoomId) {
           
            continue;
          }

          const inventoryRef = doc(db, "inventory", inventoryId);
          const inventorySnap = await getDoc(inventoryRef);
          if (!inventorySnap.exists()) {
           
            continue;
          }

          const data = inventorySnap.data();
          const currentQty = Number(data.quantity || 0);
          const newQty = Math.max(currentQty - requestedQty, 0);
          await updateDoc(inventoryRef, { quantity: newQty });

          // Log item usage
          await addDoc(collection(db, "itemUsage"), {
            itemId: data.itemId, // Make sure this is correct
            usedQuantity: requestedQty, // How much was used
            timestamp: serverTimestamp(), // So it's traceable over time
          });

      

          // ⚙️ Update inventory condition breakdown
          let remaining = requestedQty;
          const good = data.condition?.Good ?? 0;
          const damage = data.condition?.Damage ?? 0;
          const defect = data.condition?.Defect ?? 0;
          const lost = data.condition?.Lost ?? 0;

          let newGood = good;
          let newDamage = damage;
          let newDefect = defect;
          let newLost = lost;

          if (remaining > 0) {
            const deductFromGood = Math.min(newGood, remaining);
            newGood -= deductFromGood;
            remaining -= deductFromGood;
          }

          if (remaining > 0) {
            const deductFromDamage = Math.min(newDamage, remaining);
            newDamage -= deductFromDamage;
            remaining -= deductFromDamage;
          }

          if (remaining > 0) {
            const deductFromDefect = Math.min(newDefect, remaining);
            newDefect -= deductFromDefect;
            remaining -= deductFromDefect;
          }

          if (remaining > 0) {
            const deductFromLost = Math.min(newLost, remaining);
            newLost -= deductFromLost;
            remaining -= deductFromLost;
          }

          await updateDoc(inventoryRef, {
            'condition.Good': newGood,
            'condition.Damage': newDamage,
            'condition.Defect': newDefect,
            'condition.Lost' : newLost,
          });
          
          // 🔁 Update labRoom item quantity
          const roomNumber = item.labRoom; // e.g. "0930"
          const labRoomCollectionRef = collection(db, "labRoom");
          const q = query(labRoomCollectionRef, where("roomNumber", "==", roomNumber));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
          
            return;
          }

          // 2. Get Firestore doc ID of the labRoom
          const labRoomDoc = querySnapshot.docs[0];
          const labRoomDocId = labRoomDoc.id;

          // 3. Query items subcollection for item with matching itemId
          const itemId = data.itemId; // e.g. "DENT02"
          const itemsCollectionRef = collection(db, "labRoom", labRoomDocId, "items");
          const itemQuery = query(itemsCollectionRef, where("itemId", "==", itemId));
          const itemSnapshot = await getDocs(itemQuery);

          if (itemSnapshot.empty) {
           
            return;
          }

          // 4. Get the Firestore doc ID of the item document
          const itemDoc = itemSnapshot.docs[0];
          const itemDocId = itemDoc.id;
          const labRoomItemRef = doc(db, "labRoom", labRoomDocId, "items", itemDocId);
          const labData = itemDoc.data();

          const currentLabQty = Number(labData.quantity || 0);
          const newLabQty = Math.max(currentLabQty - requestedQty, 0);
          await updateDoc(labRoomItemRef, { quantity: newLabQty });
         

          // Update condition breakdown
          let labGood = labData.condition?.Good ?? 0;
          let labDamage = labData.condition?.Damage ?? 0;
          let labDefect = labData.condition?.Defect ?? 0;
          let labLost = labData.condition?.Lost ?? 0;

          let remainingLab = requestedQty;

          if (remainingLab > 0) {
            const deductFromLabGood = Math.min(labGood, remainingLab);
            labGood -= deductFromLabGood;
            remainingLab -= deductFromLabGood;
          }

          if (remainingLab > 0) {
            const deductFromLabDamage = Math.min(labDamage, remainingLab);
            labDamage -= deductFromLabDamage;
            remainingLab -= deductFromLabDamage;
          }

          if (remainingLab > 0) {
            const deductFromLabDefect = Math.min(labDefect, remainingLab);
            labDefect -= deductFromLabDefect;
            remainingLab -= deductFromLabDefect;
          }

          if (remainingLab > 0) {
            const deductFromLabLost = Math.min(labLost, remainingLab);
            labLost -= deductFromLabLost;
            remainingLab -= deductFromLabLost;
          }

          await updateDoc(labRoomItemRef, {
            'condition.Good': labGood,
            'condition.Damage': labDamage,
            'condition.Defect': labDefect,
            'condition.Lost' : labLost,
          });

          
        }
        
      } catch (err) {
       
      }  

      // await addDoc(collection(db, "requestlog"), requestLogEntry);
  
      if (rejectedItems.length > 0) {
        await addDoc(collection(db, "requestlog"), rejectLogEntry);
      }
  
   
      // Process Borrow Catalog
      const fixedItems = approvedItemsWithType.filter(item => item.itemType === "Fixed");

      console.log("ApprovedItemsWithType:", approvedItemsWithType);
      console.log("FixedItems to save to borrowcatalog:", fixedItems);
  
      if (fixedItems.length > 0) {
        const formattedItems = fixedItems.map(item => ({
          category: item.category || "N/A",
          condition: item.condition || "N/A",
          department: item.department || "N/A",
          itemName: item.itemName || "N/A",
          itemDetails: item.itemDetails || "N/A",
          itemId: item.itemIdFromInventory,
          quantity: item.quantity || "1",
          selectedItemId: item.selectedItemId || "N/A",
          status: item.status || "Available",
          program: item.program || "N/A",
          course: item.course || "N/A",
          courseDescription: item.courseDescription || "N/A",
          reason: item.reason || "No reason provided",
          labRoom: item.labRoom || "N/A",
          timeFrom: item.timeFrom || "N/A",
          timeTo: item.timeTo || "N/A",
          usageType: item.usageType || "N/A",
          scannedCount: 0,
        }));
  
        const borrowCatalogEntry = {
          accountId: selectedRequest.accountId || "N/A",
          userName: selectedRequest.userName || "N/A",
          room: selectedRequest.room || "N/A",
          course: selectedRequest.course || "N/A",
          courseDescription: selectedRequest.courseDescription || "N/A",
          dateRequired: selectedRequest.dateRequired || "N/A",
          timeFrom: selectedRequest.timeFrom || "N/A",
          timeTo: selectedRequest.timeTo || "N/A",
          timestamp: selectedRequest.timestamp || "N/A",
          rawTimestamp: new Date(),
          requestList: formattedItems,
          status: "Borrowed",
          approvedBy: userName,
          reason: selectedRequest.reason || "No reason provided",
          program: selectedRequest.program,
        };
  
        const userRequestLogEntry = {
          ...requestLogEntry,
          status: "Approved",
          approvedBy: userName,
          timestamp: selectedRequest.timestamp || "N/A",
          rawTimestamp: new Date(),
        };
  
        await addDoc(collection(db, "borrowcatalog"), borrowCatalogEntry);
  
        await addDoc(collection(db, "accounts", selectedRequest.accountId, "userrequestlog"), userRequestLogEntry);

        // ✅ Notify the user who submitted the request
        if (selectedRequest.accountId && selectedRequest.accountId !== "system") {
          await addDoc(collection(db, `accounts/${selectedRequest.accountId}/userNotifications`), {
            action: `Rejected request for ${selectedRequest.userName}`,
            requestId: selectedRequest.id,
            userName: selectedRequest.userName,
            read: false,
            timestamp: serverTimestamp(),
          });
        }
    
        // ✅ Send push to the user who submitted the request
        try {
          const functions = getFunctions();
          const sendPush = httpsCallable(functions, "sendPushNotification");

          const pushTokenSnapshot = await getDocs(collection(db, "pushTokens"));
          const tokensToNotify = [];

          pushTokenSnapshot.forEach((doc) => {
            const data = doc.data();
            if (
              data?.expoPushToken &&
              data.userId === selectedRequest.userId // 👈 This should match the request sender
            ) {
              tokensToNotify.push(data.expoPushToken);
            }
          });

          for (const token of tokensToNotify) {
            const payload = {
              token,
              title: "Request Update",
              body: `Your requisition has been rejected.`, // or `rejected` if applicable
            };

            const response = await sendPush(payload);
            console.log("✅ Push sent to user:", response.data);
          }

        } catch (err) {
          console.error("❌ Push error (admin to user):", err.message || err);
        }
      }
  
      await deleteDoc(doc(db, "userrequests", selectedRequest.id));
  
      // Delete matching user request subcollection doc
      const subCollectionRef = collection(db, "accounts", selectedRequest.accountId, "userRequests");
      const subDocsSnap = await getDocs(subCollectionRef);
  
      subDocsSnap.forEach(async (docSnap) => {
        const data = docSnap.data();
        const match = (
          data.timestamp?.seconds === selectedRequest.timestamp?.seconds &&
          data.filteredMergedData?.[0]?.selectedItemId === selectedRequest.filteredMergedData?.[0]?.selectedItemId
        );
  
        if (match) {
      
          await deleteDoc(doc(db, "accounts", selectedRequest.accountId, "userRequests", docSnap.id));
        }
      });
  
      setApprovedRequests(prev => [...prev, requestLogEntry]);
      setRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
      setCheckedItems({});
      setIsModalVisible(false);
      setSelectedRequest(null);
      setIsFinalizeModalVisible(false)

      setNotificationMessage("Approval and rejection have been logged successfully.");
      setIsNotificationVisible(true);
  
      notification.success({
        message: "Request Processed",
        description: "Approval and rejection have been logged successfully.",
      });
  
    } catch (error) {
    
      notification.error({
        message: "Error",
        description: "Failed to process the request after rejection confirmation.",
      });
    } finally {
      setRejectLoading(false);
    }
  };



// FRONTEND
 const handleApprove = async () => {  
  setApproveLoading(true);
  
  const isChecked = Object.values(checkedItems).some((checked) => checked);

  if (!isChecked) {
    setNotificationMessage("No Items selected");
    setIsNotificationVisible(true);
    setApproveLoading(false);
    return;
  }

  if (selectedRequest) {

    try {
      const accountRef = doc(db, "accounts", selectedRequest.accountId);
      const accountSnap = await getDoc(accountRef);

      if (accountSnap.exists()) {
        const accountData = accountSnap.data();
        const isDisabled = accountData.disabled || false; // Adjust field name if different

        if (isDisabled) {
          setNotificationMessage("Cannot approve: The user's account is disabled.");
          setIsNotificationVisible(true);
          return;
        }
        
      } else {
      
      }

    } catch (error) {
     
      setNotificationMessage("Error verifying account status. Please try again.");
      setIsNotificationVisible(true);
      return;
    }

    // Use the updated quantity from editableItems if available
    // const mergedRequestList = selectedRequest.requestList.map((item, index) => {
    //   const editedItem = editableItems?.[index];
    //   return editedItem ? { ...item, quantity: editedItem.quantity } : item;
    // });

const mergedRequestList = selectedRequest.requestList.map((item, index) => {
  const key = `${selectedRequest.id}-${index}`;
  const isChecked = checkedItems[key];
  const editedItem = editableItems?.[index];

  // Only update quantity for checked items
  if (isChecked && editedItem?.quantity !== undefined) {
    return { ...item, quantity: editedItem.quantity };
  }

  return item; // Leave unchecked items as original
});

    // Filter checked items and prepare for approval
    // const filteredItems = selectedRequest.requestList.filter((item, index) => {
    const filteredItems = mergedRequestList.filter((item, index) => {
      const key = `${selectedRequest.id}-${index}`;
      return checkedItems[key];
    });

    if (filteredItems.length === 0) {
      setNotificationMessage("No Items selected");
      setIsNotificationVisible(true);
      return;
    }

    // 🔍 Check inventory quantities before approval
    const insufficientItems = [];
    
    for (const item of filteredItems) {
      const inventoryId = item.selectedItemId;
      const requestedQty = Number(item.quantity);
      
      if (!inventoryId || isNaN(requestedQty) || requestedQty <= 0) {
        continue;
      }

      try {
        const inventoryRef = doc(db, "inventory", inventoryId);
        const inventorySnap = await getDoc(inventoryRef);
        
        if (!inventorySnap.exists()) {
          insufficientItems.push({
            itemName: item.itemName || "Unknown Item",
            requested: requestedQty,
            available: 0,
            reason: "Item not found in inventory"
          });
          continue;
        }

        const data = inventorySnap.data();
        const availableQty = Number(data.quantity || 0);
        
        if (availableQty < requestedQty) {
          insufficientItems.push({
            itemName: item.itemName || data.itemName || "Unknown Item",
            requested: requestedQty,
            available: availableQty,
            reason: "Insufficient quantity"
          });
        }
      } catch (error) {
        console.error("Error checking inventory for item:", item.itemName, error);
        insufficientItems.push({
          itemName: item.itemName || "Unknown Item",
          requested: requestedQty,
          available: 0,
          reason: "Error checking inventory"
        });
      }
    }

    // If there are insufficient items, show error and prevent approval
    if (insufficientItems.length > 0) {
      const errorMessage = insufficientItems.map(item => 
        `${item.itemName}: Requested ${item.requested}, Available ${item.available} (${item.reason})`
      ).join('\n');
      
      setNotificationMessage(`Cannot approve request. Insufficient inventory:\n${errorMessage}`);
      setIsNotificationVisible(true);
      return;
    }

    const enrichedItems = await Promise.all(
    filteredItems.map(async (item) => {
    const selectedItemId = item.selectedItemId || item.selectedItem?.value;
    let itemType = "Unknown";

    if (selectedItemId) {
      try {
        const inventoryDoc = await getDoc(doc(db, "inventory", selectedItemId));
        if (inventoryDoc.exists()) {
          itemType = inventoryDoc.data().type || "Unknown";
        }
      } catch (err) {
        console.error("Failed to fetch inventory item:", err);
      }
    }

    return {
      ...item,
      selectedItemId,
      itemType,
    };
  })
);

console.log("Approved item quantities:", enrichedItems.map(i => `${i.itemName}: ${i.quantity}`));

 for (const item of enrichedItems) {
  const requestedQty = item.quantity;
  const itemId = item.selectedItemId;
  const itemName = item.itemName

  console.log("📦 Logging itemUsage for:", itemId);

  try {
    // 1. Log the usage
    await addDoc(collection(db, "itemUsage"), {
      itemId: itemId,
      usedQuantity: requestedQty,
      timestamp: serverTimestamp(),
      itemName:itemName
    });

    // 2. Fetch all past usage logs
    const usageQuery = query(
      collection(db, "itemUsage"),
      where("itemId", "==", itemId)
    );
    const usageSnap = await getDocs(usageQuery);

    let total = 0;
    const uniqueDates = new Set();

    usageSnap.forEach((doc) => {
      const data = doc.data();
      if (data.usedQuantity && data.timestamp?.toDate) {
        total += data.usedQuantity;
        const dateStr = data.timestamp.toDate().toISOString().split("T")[0];
        uniqueDates.add(dateStr);
      }
    });

    const daysWithUsage = uniqueDates.size;
    const average = daysWithUsage > 0 ? total / daysWithUsage : 0;

    // 🔄 Assumed buffer of 5 days for critical stock level
    const bufferDays = 7;
    const criticalLevel = average * bufferDays;

    // 3. Update inventory with new average and critical level
    const itemRef = doc(db, "inventory", itemId);
    await updateDoc(itemRef, {
      averageDailyUsage: average,
      criticalLevel: criticalLevel,
    });

    console.log(`✅ Updated ${itemId}: AvgDaily = ${average}, Critical = ${criticalLevel}`);
  } catch (e) {
    console.error(`❌ Error processing usage for ${itemId}:`, e);
  }
}
    // Filter out unchecked items (for rejection)
    // const uncheckedItems = selectedRequest.requestList.filter((item, index) => {
    const uncheckedItems = mergedRequestList.filter((item, index) => {
      const key = `${selectedRequest.id}-${index}`;
      return !checkedItems[key]; // This will get the unchecked items
    });

    // Define rejectionReason variable outside of the condition
    let rejectionReason = null;


    if (uncheckedItems.length > 0) {
     
      setPendingApprovalData({
        enrichedItems,
        uncheckedItems,
        selectedRequest,
      });
      setIsMultiRejectModalVisible(true); // ✅ Show new modal for multiple items
      return;
    }

    // Process rejected items
    const rejectedItems = await Promise.all(
      uncheckedItems.map(async (item) => {
        const selectedItemId = item.selectedItemId || item.selectedItem?.value;
        let itemType = "Unknown";

        if (selectedItemId) {
          try {
            const inventoryDoc = await getDoc(doc(db, "inventory", selectedItemId));
            if (inventoryDoc.exists()) {
              itemType = inventoryDoc.data().type || "Unknown";
            }

          } catch (err) {
        
          }
        }

        return {
          ...item,
          selectedItemId,
          itemType, 
          volume: item.volume ?? "N/A", // <-- add this
        };
      })
    );

    // Get user info from localStorage (since we're using backend authentication)
    const userEmail = localStorage.getItem("userEmail");
    const userName = localStorage.getItem("userName") || "Unknown";

    // If userName is not available in localStorage, try to fetch from Firestore
    if (!userName || userName === "Unknown") {
      try {
        const userQuery = query(collection(db, "accounts"), where("email", "==", userEmail));
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          const userData = userDoc.data();
          const fetchedUserName = userData.name || "Unknown";
          // Update localStorage with the fetched name
          localStorage.setItem("userName", fetchedUserName);
        }

      } catch (error) {
        console.error("Error fetching user name from Firestore:", error);
      }
    }

    const requestLogEntry = {
      accountId: selectedRequest.accountId || "N/A",
      userName: selectedRequest.userName || "N/A",
      room: selectedRequest.room || "N/A",
      course: selectedRequest.course || "N/A",
      courseDescription: selectedRequest.courseDescription || "N/A",
      dateRequired: selectedRequest.dateRequired || "N/A",
      timeFrom: selectedRequest.timeFrom || "N/A",  
      timeTo: selectedRequest.timeTo || "N/A",  
      timestamp: selectedRequest.timestamp || "N/A",
      rawTimestamp: new Date(),
      requestList: enrichedItems, 
      status: "Approved", 
      approvedBy: userName, 
      reason: selectedRequest.reason || "No reason provided",
      program: selectedRequest.program,
      usageType: selectedRequest.usageType || "N/A",  
    };

    const rejectLogEntry = {
      accountId: selectedRequest.accountId || "N/A",
      userName: selectedRequest.userName || "N/A",
      room: selectedRequest.room || "N/A",
      course: selectedRequest.couse || "N/A",
      courseDescription: selectedRequest.courseDescription || "N/A",
      dateRequired: selectedRequest.dateRequired || "N/A",
      timeFrom: selectedRequest.timeFrom || "N/A",  
      timeTo: selectedRequest.timeTo || "N/A",  
      timestamp: selectedRequest.timestamp || "N/A",
      rawTimestamp: new Date(),
      requestList: rejectedItems, 
      status: "Rejected", 
      rejectedBy: userName, 
      reason: rejectionReason || "No reason provided",  
      program: selectedRequest.program,
      usageType: selectedRequest.usageType || "N/A",  
    };

    // Log approved items in historylog subcollection
    const logRequestOrReturn = async (
      userId,
      userName,
      action,
      requestDetails,
      extraInfo = {} // for fields like dateRequired, approvedBy, etc.
    ) => {
      await addDoc(collection(db, `accounts/${userId}/historylog`), {
        action,
        userName,
        timestamp: serverTimestamp(),
        requestList: requestDetails,
        ...extraInfo, // merge additional data like dateRequired, reason, etc.
      });
    };

    // Log approved items
    await logRequestOrReturn(
      selectedRequest.accountId,     // user ID
      selectedRequest.userName,      // user name
      "Request Approved",            // action
      enrichedItems,                 // request list
      {
        approvedBy: userName, // whoever approved
        course: selectedRequest.course || "N/A",
        courseDescription: selectedRequest.courseDescription || "N/A",
        dateRequired: selectedRequest.dateRequired,
        reason: selectedRequest.reason,
        room: selectedRequest.room,
        program: selectedRequest.program,
        timeFrom: selectedRequest.timeFrom || "N/A",  // Include timeFrom
        timeTo: selectedRequest.timeTo || "N/A",  
        timestamp: selectedRequest.timestamp || "N/A",
        rawTimestamp: new Date(),
        usageType: selectedRequest.usageType || "N/A",  
      }
    );

    // Log rejected items
    if (rejectedItems.length > 0) {
      await logRequestOrReturn(
        selectedRequest.accountId,     // user ID
        selectedRequest.userName,      // user name
        "Request Rejected",            // action
        rejectedItems,                 // request list
        {
          rejectedBy: userName, // whoever rejected
          course: selectedRequest.course || "N/A",
          courseDescription: selectedRequest.courseDescription || "N/A",
          dateRequired: selectedRequest.dateRequired,
          reason: rejectionReason || "No reason provided",  // Reason for rejection
          room: selectedRequest.room,
          program: selectedRequest.program,
          timeFrom: selectedRequest.timeFrom || "N/A",  // Include timeFrom
          timeTo: selectedRequest.timeTo || "N/A",  
          timestamp: selectedRequest.timestamp || "N/A",
          rawTimestamp: new Date(),
          usageType: selectedRequest.usageType || "N/A",  
        }
      );
    }


try {
        for (const item of enrichedItems) {
          const inventoryId = item.selectedItemId;
          const requestedQty = Number(item.quantity);
          const labRoomId = item.labRoom;

          if (!inventoryId || isNaN(requestedQty) || requestedQty <= 0) {
        
            continue;
          }

          if (!labRoomId) {

            continue;
          }

          const inventoryRef = doc(db, "inventory", inventoryId);
          const inventorySnap = await getDoc(inventoryRef);
          if (!inventorySnap.exists()) {
      
            continue;
          }

          const data = inventorySnap.data();
          const currentQty = Number(data.quantity || 0);
          const newQty = Math.max(currentQty - requestedQty, 0);
          await updateDoc(inventoryRef, { quantity: newQty });
        

          // ⚙️ Update inventory condition breakdown
          let remaining = requestedQty;
          const good = data.condition?.Good ?? 0;
          const damage = data.condition?.Damage ?? 0;
          const defect = data.condition?.Defect ?? 0;
          const lost = data.condition?.Lost ?? 0;

          let newGood = good;
          let newDamage = damage;
          let newDefect = defect;
          let newLost = lost;

          if (remaining > 0) {
            const deductFromGood = Math.min(newGood, remaining);
            newGood -= deductFromGood;
            remaining -= deductFromGood;
          }

          if (remaining > 0) {
            const deductFromDamage = Math.min(newDamage, remaining);
            newDamage -= deductFromDamage;
            remaining -= deductFromDamage;
          }

          if (remaining > 0) {
            const deductFromDefect = Math.min(newDefect, remaining);
            newDefect -= deductFromDefect;
            remaining -= deductFromDefect;
          }

          if (remaining > 0) {
            const deductFromLost = Math.min(newLost, remaining);
            newLost -= deductFromLost;
            remaining -= deductFromLost;
          }

          await updateDoc(inventoryRef, {
            'condition.Good': newGood,
            'condition.Damage': newDamage,
            'condition.Defect': newDefect,
            'condition.Lost' : newLost,
          });

          // 🔁 Update labRoom item quantity
          const roomNumber = item.labRoom; // e.g. "0930"
          const labRoomCollectionRef = collection(db, "labRoom");
          const q = query(labRoomCollectionRef, where("roomNumber", "==", roomNumber));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
          

            return;
          }

          // 2. Get Firestore doc ID of the labRoom
          const labRoomDoc = querySnapshot.docs[0];
          const labRoomDocId = labRoomDoc.id;

          // 3. Query items subcollection for item with matching itemId
          const itemId = data.itemId; // e.g. "DENT02"
          const itemsCollectionRef = collection(db, "labRoom", labRoomDocId, "items");
          const itemQuery = query(itemsCollectionRef, where("itemId", "==", itemId));
          const itemSnapshot = await getDocs(itemQuery);

          if (itemSnapshot.empty) {
       
            return;
          }

          // 4. Get the Firestore doc ID of the item document
          const itemDoc = itemSnapshot.docs[0];
          const itemDocId = itemDoc.id;
          const labRoomItemRef = doc(db, "labRoom", labRoomDocId, "items", itemDocId);
          const labData = itemDoc.data();

          const currentLabQty = Number(labData.quantity || 0);
          const newLabQty = Math.max(currentLabQty - requestedQty, 0);
          await updateDoc(labRoomItemRef, { quantity: newLabQty });
         

          // Update condition breakdown
          let labGood = labData.condition?.Good ?? 0;
          let labDamage = labData.condition?.Damage ?? 0;
          let labDefect = labData.condition?.Defect ?? 0;
          let labLost = labData.condition?.Lost ?? 0;

          let remainingLab = requestedQty;

          if (remainingLab > 0) {
            const deductFromLabGood = Math.min(labGood, remainingLab);
            labGood -= deductFromLabGood;
            remainingLab -= deductFromLabGood;
          }

          if (remainingLab > 0) {
            const deductFromLabDamage = Math.min(labDamage, remainingLab);
            labDamage -= deductFromLabDamage;
            remainingLab -= deductFromLabDamage;
          }

          if (remainingLab > 0) {
            const deductFromLabDefect = Math.min(labDefect, remainingLab);
            labDefect -= deductFromLabDefect;
            remainingLab -= deductFromLabDefect;
          }

          if (remainingLab > 0) {
            const deductFromLabLost = Math.min(labLost, remainingLab);
            labLost -= deductFromLabLost;
            remainingLab -= deductFromLabLost;
          }

          await updateDoc(labRoomItemRef, {
            'condition.Good': labGood,
            'condition.Damage': labDamage,
            'condition.Defect': labDefect,
            'condition.Lost' : labLost,
          });

          
        }
        
      } catch (err) {

      }
    

    try {
      // Add to requestlog for approval
      await addDoc(collection(db, "requestlog"), requestLogEntry);

      // Add to requestlog for rejection
      if (rejectedItems.length > 0) {
        await addDoc(collection(db, "requestlog"), rejectLogEntry);
      }

      // Proceed with borrow catalog logic for approved items
      // Filter to get all "Fixed" items
      // Process Borrow Catalog
      const fixedItems = enrichedItems.filter(item => item.itemType === "Fixed");
  
      if (fixedItems.length > 0) {
        const formattedItems = fixedItems.map(item => ({
          category: item.category || "N/A",
          condition: item.condition || "N/A",
          department: item.department || "N/A",
          itemName: item.itemName || "N/A",
          itemDetails: item.itemDetails || "N/A",
          itemId: item.itemIdFromInventory,
          quantity: item.quantity || "1",
          selectedItemId: item.selectedItemId || "N/A",
          status: item.status || "Available",
          program: item.program || "N/A",
          course: item.course || "N/A",
          courseDescription: item.courseDescription || "N/A",
          reason: item.reason || "No reason provided",
          labRoom: item.labRoom || "N/A",
          timeFrom: item.timeFrom || "N/A",
          timeTo: item.timeTo || "N/A",
          usageType: item.usageType || "N/A",
          scannedCount: 0,
        }));
  
        const borrowCatalogEntry = {
          accountId: selectedRequest.accountId || "N/A",
          userName: selectedRequest.userName || "N/A",
          room: selectedRequest.room || "N/A",
          course: selectedRequest.course || "N/A",
          courseDescription: selectedRequest.courseDescription || "N/A",
          dateRequired: selectedRequest.dateRequired || "N/A",
          timeFrom: selectedRequest.timeFrom || "N/A",
          timeTo: selectedRequest.timeTo || "N/A",
          timestamp: selectedRequest.timestamp || "N/A",
          rawTimestamp: new Date(),
          requestList: formattedItems,
          status: "Borrowed",
          // status: "For Deployment",
          approvedBy: userName,
          reason: selectedRequest.reason || "No reason provided",
          program: selectedRequest.program,
          usageType: selectedRequest.usageType || "N/A",
        };
  
        const userRequestLogEntry = {
          ...requestLogEntry,
          status: "Approved",
          approvedBy: userName,
          timestamp: selectedRequest.timestamp || "N/A",
          rawTimestamp: new Date(),
        };
  
        await addDoc(collection(db, "borrowcatalog"), borrowCatalogEntry);
  
        await addDoc(collection(db, "accounts", selectedRequest.accountId, "userrequestlog"), userRequestLogEntry);

        // ✅ Notify the user who submitted the request
        if (selectedRequest.accountId && selectedRequest.accountId !== "system") {
          await addDoc(collection(db, `accounts/${selectedRequest.accountId}/userNotifications`), {
            action: `Approved request for ${selectedRequest.userName}`,
            requestId: selectedRequest.id,
            userName: selectedRequest.userName,
            read: false,
            timestamp: serverTimestamp(),
          });
        }

        // ✅ Send push to the user who submitted the request
        try {
          const functions = getFunctions();
          const sendPush = httpsCallable(functions, "sendPushNotification");

          const pushTokenSnapshot = await getDocs(collection(db, "pushTokens"));
          const tokensToNotify = [];

          pushTokenSnapshot.forEach((doc) => {
            const data = doc.data();
            if (
              data?.expoPushToken &&
              data.userId === selectedRequest.userId // 👈 This should match the request sender
            ) {
              tokensToNotify.push(data.expoPushToken);
            }
          });

          for (const token of tokensToNotify) {
            const payload = {
              token,
              title: "Request Update",
              body: `Your requisition has been approved.`, // or `rejected` if applicable
            };

            const response = await sendPush(payload);
            console.log("✅ Push sent to user:", response.data);
          }

        } catch (err) {
          console.error("❌ Push error (admin to user):", err.message || err);
        }
      }

      const consumableItems = enrichedItems.filter(item => item.itemType === "Consumable");

      if (consumableItems.length > 0) {
        const formattedItems = consumableItems.map(item => ({
          category: item.category || "N/A",
          condition: item.condition || "N/A",
          department: item.department || "N/A",
          itemName: item.itemName || "N/A",
          itemDetails: item.itemDetails || "N/A",
          itemId: item.itemIdFromInventory,
          quantity: item.quantity || "1",
          selectedItemId: item.selectedItemId || "N/A",
          status: item.status || "Available",
          program: item.program || "N/A",
          course: item.course || "N/A",
          courseDescription: item.courseDescription || "N/A",
          reason: item.reason || "No reason provided",
          labRoom: item.labRoom || "N/A",
          timeFrom: item.timeFrom || "N/A",
          timeTo: item.timeTo || "N/A",
          usageType: item.usageType || "N/A",
          scannedCount: 0,
        }));

        const consumableCatalogEntry = {
          accountId: selectedRequest.accountId || "N/A",
          userName: selectedRequest.userName || "N/A",
          room: selectedRequest.room || "N/A",
          course: selectedRequest.course || "N/A",
          courseDescription: selectedRequest.courseDescription || "N/A",
          dateRequired: selectedRequest.dateRequired || "N/A",
          timeFrom: selectedRequest.timeFrom || "N/A",
          timeTo: selectedRequest.timeTo || "N/A",
          timestamp: selectedRequest.timestamp || "N/A",
          rawTimestamp: new Date(),
          requestList: formattedItems,
          status: "For Release", // For Consumables
          approvedBy: userName,
          reason: selectedRequest.reason || "No reason provided",
          program: selectedRequest.program,
          usageType: selectedRequest.usageType || "N/A",
        };

        await addDoc(collection(db, "borrowcatalog"), consumableCatalogEntry);

        // ✅ Notify the user who submitted the request
              if (selectedRequest.accountId && selectedRequest.accountId !== "system") {
                await addDoc(collection(db, `accounts/${selectedRequest.accountId}/userNotifications`), {
                  action: `Approved request for ${selectedRequest.userName}`,
                  requestId: selectedRequest.id,
                  userName: selectedRequest.userName,
                  read: false,
                  timestamp: serverTimestamp(),
                });
              }

              // ✅ Send push to the user who submitted the request
              try {
                const functions = getFunctions();
                const sendPush = httpsCallable(functions, "sendPushNotification");

                const pushTokenSnapshot = await getDocs(collection(db, "pushTokens"));
                const tokensToNotify = [];

                pushTokenSnapshot.forEach((doc) => {
                  const data = doc.data();
                  if (
                    data?.expoPushToken &&
                    data.userId === selectedRequest.userId // 👈 This should match the request sender
                  ) {
                    tokensToNotify.push(data.expoPushToken);
                  }
                });

                for (const token of tokensToNotify) {
                  const payload = {
                    token,
                    title: "Request Update",
                    body: `Your requisition has been approved.`, // or `rejected` if applicable
                  };

                  const response = await sendPush(payload);
                  console.log("✅ Push sent to user:", response.data);
                }

              } catch (err) {
                console.error("❌ Push error (admin to user):", err.message || err);
              }
      }

        await deleteDoc(doc(db, "userrequests", selectedRequest.id));

        // Cleanup the user requests subcollection
        const subCollectionRef = collection(db, "accounts", selectedRequest.accountId, "userRequests");
        const subDocsSnap = await getDocs(subCollectionRef);

        subDocsSnap.forEach(async (docSnap) => {
          const data = docSnap.data();
          const match = (
            data.timestamp?.seconds === selectedRequest.timestamp?.seconds &&
            data.filteredMergedData?.[0]?.selectedItemId === selectedRequest.filteredMergedData?.[0]?.selectedItemId
          );

          if (match) {
       
            await deleteDoc(doc(db, "accounts", selectedRequest.accountId, "userRequests", docSnap.id));
          }
        });

        setApprovedRequests([...approvedRequests, requestLogEntry]);
        setRequests(requests.filter((req) => req.id !== selectedRequest.id));
        setCheckedItems({});
        setIsModalVisible(false);
        setSelectedRequest(null);
        setIsFinalizeModalVisible(false)

        setNotificationMessage("Request has been approved and logged successfully.");
        setIsNotificationVisible(true);

        notification.success({
          message: "Request Approved",
          description: "Request has been approved and logged.",
        });

      } catch (error) {
     
        notification.error({
          message: "Approval Failed",
          description: "There was an error logging the approved request.",
        });
      } finally {
        setApproveLoading(false);
      }
    }
  };



  const handleReject = () => { 
    if (!selectedRequest) return;

    // 🔄 Use edited quantities from editableItems
    const mergedRequestList = selectedRequest.requestList.map((item, index) => {
      const editedItem = editableItems?.[index];
      return editedItem ? { ...item, quantity: editedItem.quantity } : item;
    });

    const uncheckedItems = mergedRequestList.filter((item, index) => {
      const key = `${selectedRequest.id}-${index}`;
      return !checkedItems[key]; // Get items that are NOT checked
    });

    const enrichedItems = mergedRequestList.filter((item, index) => {
      const key = `${selectedRequest.id}-${index}`;
      return checkedItems[key]; // Get items that ARE checked
    });

    // Set full data into pendingApprovalData
    setPendingApprovalData({
      uncheckedItems,
      enrichedItems,
      selectedRequest,
    });

    // Show the rejection reason modal
    setIsMultiRejectModalVisible(true);
  };


  // BACKEND
  const handleRejectSubmit = async () => {
    const isChecked = Object.values(checkedItems).some((checked) => checked);

    if (!isChecked) {
      setNotificationMessage("No items selected");
      setIsNotificationVisible(true);
      return;
    }

    if (!selectedRequest) {
      setNotificationMessage("No request selected");
      setIsNotificationVisible(true);
      return;
    }

    const filteredItems = selectedRequest.requestList.filter((item, index) => {
      const key = `${selectedRequest.id}-${index}`;
      return checkedItems[key];
    });

    if (filteredItems.length === 0) {
      setNotificationMessage("No items selected");
      setIsNotificationVisible(true);
      return;
    }

    const enrichedItems = await Promise.all(
      filteredItems.map(async (item) => {
        const selectedItemId = item.selectedItemId || item.selectedItem?.value;
        let itemType = "Unknown";

        if (selectedItemId) {
          try {
            const inventoryDoc = await getDoc(doc(db, "inventory", selectedItemId));
            if (inventoryDoc.exists()) {
              itemType = inventoryDoc.data().type || "Unknown";
            }
          } catch (err) {
            console.warn("Failed to fetch item type", err);
          }
        }

        return {
          ...item,
          selectedItemId,
          itemType,
        };
      })
    );

    // 🔐 Get logged-in user info
    const userId = localStorage.getItem("userId") || "system";
    const userName = localStorage.getItem("userName") || "Unknown";

    try {
      const response = await fetch("https://webnuls.onrender.com/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedRequest,
          enrichedItems,
          rejectReason,
          userId,
          userName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        notification.error({
          message: "Rejection Failed",
          description: data.error || "There was a problem rejecting the request.",
        });
        return;
      }

      notification.success({
        message: "Request Rejected",
        description: data.message || "Request has been successfully rejected and logged.",
      });

      // 🧼 Clean up UI
      setRequests((prev) => prev.filter((req) => req.id !== selectedRequest.id));
      setCheckedItems({});
      setIsRejectModalVisible(false);
      setRejectReason("");
      setIsModalVisible(false);
      setNotificationMessage("Request rejected successfully");
      setIsNotificationVisible(true);

    } catch (error) {
      console.error("Error submitting rejection:", error);
      notification.error({
        message: "Network Error",
        description: "Could not connect to the rejection server.",
      });
    }
  };

  const allItemsChecked = selectedRequest?.requestList?.length > 0 &&
  selectedRequest.requestList.every((_, index) => 
    checkedItems[`${selectedRequest.id}-${index}`]
  );

  const columnsRejection = [
    {
      title: "Item Name",
      dataIndex: "itemName",
      key: "itemName",
    },
    {
      title: "Item Description",
      dataIndex: "itemDetails",
      key: "itemDetails",
    },

    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (text, record) => (
        <Input
          type="number"
          min={1}
          value={editableItems?.[record.selectedItemId]?.quantity ?? text}
          onChange={(e) => {
            const value = e.target.value;
            const updatedValue = value === "" ? "" : Math.max(1, parseInt(value));

            setEditableItems((prev) => ({
              ...prev,
              [record.selectedItemId]: {
                ...record,
                quantity: updatedValue,
              },
            }));
          }}
        />
      )
    },
    {
      title: "Reason for Rejection",
      key: "reason",
      render: (_, record, index) => {
        const itemKey = `${record.selectedItemId}-${index}`;
        return (
          <Select
            style={{ width: 200 }}
            placeholder="Select reason"
            value={rejectionReasons[itemKey]}
            onChange={(value) => {
              setRejectionReasons((prev) => ({
                ...prev,
                [itemKey]: value,
              }));
            }}
          >
            <Option value="Out of stock">Out of stock</Option>
            <Option value="Not allowed">Not allowed</Option>
            <Option value="Duplicate request">Duplicate request</Option>
            <Option value="Invalid usage">Invalid usage</Option>
          </Select>
        );
      },
    },
  ];  

  const columnsRejection1 = [
    {
      title: "Item Name",
      dataIndex: "itemName",
      key: "itemName",
    },
    {
      title: "Item Description",
      dataIndex: "itemDetails",
      key: "itemDetails",
    },

    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (text, record) => (
        <Input
          type="number"
          min={1}
          value={editableItems?.[record.selectedItemId]?.quantity ?? text}
          onChange={(e) => {
            const value = e.target.value;
            const updatedValue = value === "" ? "" : Math.max(1, parseInt(value));

            setEditableItems((prev) => ({
              ...prev,
              [record.selectedItemId]: {
                ...record,
                quantity: updatedValue,
              },
            }));
          }}
        />
      )
    },
    {
      title: "Reason for Rejection",
      key: "reason",
      render: (_, record, index) => {
        const itemKey = `${record.selectedItemId}-${index}`;
        return (
          <Select
            style={{ width: 200 }}
            placeholder="Select reason"
            value={rejectionReasons[itemKey]}
            onChange={(value) => {
              setRejectionReasons((prev) => ({
                ...prev,
                [itemKey]: value,
              }));
            }}
          >
            <Option value="Out of stock">Out of stock</Option>
            <Option value="Not allowed">Not allowed</Option>
            <Option value="Duplicate request">Duplicate request</Option>
            <Option value="Invalid usage">Invalid usage</Option>
          </Select>
        );
      },
    },
  ];  

  const columns = [
    {
      title: "Check",
      dataIndex: "check",
      render: (_, record, index) => (
        <input
          type="checkbox"
          checked={checkedItems[`${selectedRequest?.id}-${index}`] || false}
          onChange={(e) =>
            setCheckedItems({
              ...checkedItems,
              [`${selectedRequest?.id}-${index}`]: e.target.checked,
            })
          }         
        />
      ),
      width: 50,
    },
    {
      title: "Item ID",
      dataIndex: "itemIdFromInventory", 
      render: (text) => text || "N/A",  
    },   
    {
      title: "Item Name",
      dataIndex: "itemName",
    },
    {
      title: "Item Description",
      dataIndex: "itemDetails",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (text, record, index) => (
        <Input
          type="number"
          min={1}
          value={editableItems?.[index]?.quantity ?? text}
          onChange={(e) => {
            const value = e.target.value;
            const updatedValue = value === "" ? "" : Math.max(1, parseInt(value));

            setEditableItems((prev) => {
              const newItems = [...(prev || [])];
              newItems[index] = {
                ...record,
                quantity: updatedValue,
              };
              return newItems;
            });
          }}
        />
      )
    },
     {
      title: "Unit",
      dataIndex: "unit",
    },
    {
      title: "Category",
      dataIndex: "category",
    },
  ];

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return "N/A";
    const date = timestamp.toDate(); 
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };


const groupByDueDateCategory = (requests) => {
  const now = new Date();

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startOfNextWeek = new Date(endOfWeek);
  startOfNextWeek.setDate(endOfWeek.getDate() + 1);
  startOfNextWeek.setHours(0, 0, 0, 0);

  const endOfNextWeek = new Date(startOfNextWeek);
  endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
  endOfNextWeek.setHours(23, 59, 59, 999);

  const pastDue = [];
  const thisWeek = [];
  const nextWeek = [];
  const later = [];

  requests.forEach((item) => {
    const dueDate = new Date(item.dateRequired);

    if (dueDate < startOfWeek) {
      pastDue.push(item)
    } else if (dueDate >= startOfWeek && dueDate <= endOfWeek) {
      thisWeek.push(item);
    } else if (dueDate >= startOfNextWeek && dueDate <= endOfNextWeek) {
      nextWeek.push(item);
    } else if (dueDate > endOfNextWeek) {
      later.push(item);
    }
  });

  return {
    'Past Due': pastDue,
    'Required This Week': thisWeek,
    'Next Week': nextWeek,
    'Further Ahead': later,
  };
};

  const groupedRequests = groupByDueDateCategory(requests);

const getInitials = (usage) => {
  if (!usage) return '';

  const officialUsages = ['Laboratory Experiment', 'Research', 'Community Extension'];

  // If it's not one of the official usage types, treat it as "Others"
  const normalized = officialUsages.includes(usage) ? usage : 'Others';

  const words = normalized.trim().split(' ');
  return words.length === 1
    ? (words[0][0].toUpperCase() + words[0][1])?.toUpperCase()
    : (words[0][0] + words[1][0]).toUpperCase();
};


  const usageBG = (item) => {
    if(item === 'Laboratory Experiment') return 'orange'
    if(item === 'Research') return '#70c247'
    if(item === 'Community Extension') return '#6e9fc1'
    else{return '#b66ee8'}
  }
  

const capitalizeName = (name) => {
  return name.replace(/\b\w/g, char => char.toUpperCase());
};  

const [collapsedGroups, setCollapsedGroups] = useState({});
const contentRefs = useRef({});

const toggleGroup = (label) => {
  setCollapsedGroups(prev => ({
    ...prev,
    [label]: !prev[label],
  }));
};

  useEffect(() => {
    // Ensure refs are reset when groupedRequests change
    Object.keys(groupedRequests).forEach(label => {
      
      if (!contentRefs.current[label]) {
        contentRefs.current[label] = null;
      }
    });
  }, [groupedRequests]);





const getFilteredRequests = () => {
  const sanitizedSearch = searchTerm.trim().toLowerCase();
  const selected = selectedFilter.trim().toLowerCase();

  return requests.filter((item) => {
    // 🔍 Search filter
    const matchesSearch =
      item.userName?.toLowerCase().includes(sanitizedSearch) ||
      item.room?.toLowerCase().includes(sanitizedSearch) ||
      item.course?.toLowerCase().includes(sanitizedSearch) ||
      item.courseDescription?.toLowerCase().includes(sanitizedSearch);

    if (!matchesSearch) return false;

    // 🧪 Usage type filter
    if (selected === 'all') return true;

    const usage = item.usageType?.trim().toLowerCase() || '';
    const normalized = usage.replace(/\s+/g, ' ');
    const knownTypes = ['laboratory experiment', 'research', 'community extension'];

    if (knownTypes.includes(normalized)) {
      return normalized === selected;

    } else {
      return selected === 'others';
    }
  });
};

// const filteredRequests = getFilteredRequests();
// Filter requests based on search term

// Helper function to check if a request is past due
const isPastDue = (request) => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999); // End of yesterday
  const dueDate = new Date(request.dateRequired);
  return dueDate <= yesterday;
};

// Filter requests based on active tab
const getTabFilteredRequests = () => {
  const filtered = getFilteredRequests();
  
  if (activeTab === 'pastDue') {
    // Show only past due requests
    return filtered.filter(isPastDue);
  } else {
    // Show all requests EXCEPT past due ones
    return filtered.filter(request => !isPastDue(request));
  }
};

const categorizedRequests = groupByDueDateCategory(getTabFilteredRequests());

useEffect(() => {
  // Timeout ensures layout finishes rendering before measuring scrollHeight
  const timeout = setTimeout(() => {
    Object.entries(categorizedRequests).forEach(([label, group]) => {
      const ref = contentRefs.current[label];
      if (ref && ref.current) {
        // Force re-measure height after new content is shown
        ref.current.style.maxHeight = collapsedGroups[label]
          ? '0px'
          : `${ref.current.scrollHeight}px`;
      }
    });
  }, 50); // Adjust timeout if needed (50ms usually works well)

  return () => clearTimeout(timeout);
}, [categorizedRequests, collapsedGroups, activeTab]);


  const usageTypes = ['All','Laboratory Experiment', 'Research', 'Community Extension', 'Others'];
  
  const filteredData = getTabFilteredRequests();
  
  // Get count of past due requests for tab indicator
  const getPastDueCount = () => {
    const allFiltered = getFilteredRequests();
    return allFiltered.filter(isPastDue).length;
  };

  // Get count of non-past due requests for All Requests tab
  const getAllRequestsCount = () => {
    const allFiltered = getFilteredRequests();
    return allFiltered.filter(request => !isPastDue(request)).length;
  };

    const getUsageTypeIcon = (usageType) => {
    switch (usageType) {
      case 'Laboratory Experiment':
        return <ExperimentOutlined />;
      case 'Research':
        return <BookOutlined />;
      case 'Community Extension':
        return <TeamOutlined />;
      default:
        return <MoreOutlined />;
    }
  };
  return (
 <Layout className="enhanced-layout">
      <Layout className="enhanced-content-layout">
        {/* Enhanced Header */}
        <div className="enhanced-header">
          <div className="header-content">
            <div className="header-title">
              <h1>Pending Requests</h1>
              <p className="header-subtitle">Manage and review laboratory item requests</p>
            </div>
            <div className="header-stats">
              <div className="stat-card" onClick={() => setActiveTab('all')}>
                <CalendarOutlined className="stat-icon" />
                <div className="stat-content"
                >
                  <span className="stat-number">{getAllRequestsCount()}</span>
                  <span className="stat-label">Active Requests</span>
                </div>
              </div>
              <div className="stat-card urgent" onClick={() => setActiveTab('pastDue')}>
                <ClockCircleOutlined className="stat-icon" />
                <div className="stat-content">
                  <span className="stat-number">{getPastDueCount()}</span>
                  <span className="stat-label">Past Due</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        {/* <div className="enhanced-tab-navigation">
          <button
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <div className="tab-content">
              <span className="tab-label">All Requests</span>
              <span className="tab-count">{getAllRequestsCount()}</span>
            </div>
          </button>
          <button
            className={`tab-button ${activeTab === 'pastDue' ? 'active urgent-tab' : ''}`}
            onClick={() => setActiveTab('pastDue')}
          >
            <div className="tab-content">
              <span className="tab-label">Past Due Requests</span>
              <span className="tab-count">{getPastDueCount()}</span>
            </div>
          </button>
        </div> */}

        {/* Enhanced Filter Section */}
        <div className="enhanced-filter-section">
          <div className="filter-header">
            <FilterOutlined className="filter-icon" />
            <span className="filter-title">Filter & Search</span>
          </div>
          <div className="filter-content">
            <div className="filter-buttons">
              {usageTypes.map((type) => (
                <button
                  key={type}
                  className={`filter-button ${selectedFilter === type ? 'active' : ''}`}
                  onClick={() => setSelectedFilter(type)}
                >
                  {getUsageTypeIcon(type)}
                  <span>{type}</span>
                </button>
              ))}
            </div>
            <div className="search-container">
              <SearchOutlined className="search-icon" />
              <input 
                className="enhanced-search-input"
                placeholder="Search by name, room, course..." 
                value={searchTerm}
                onChange={(e) => {
                  const sanitized = sanitizeInput(e.target.value.toLowerCase());
                  setSearchTerm(sanitized);
                }}
              />
            </div>
          </div>
        </div>

        {/* Enhanced Main Content */}
        <div className="enhanced-main-content">
          <Spin spinning={loading} tip="Loading requests..." size="large" className="enhanced-spinner">
            {!loading && filteredData.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><FileTextFilled/></div>
                <h3>No Requests Found</h3>
                <p>Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="requests-container">
                {Object.entries(categorizedRequests).map(([label, group]) => {
                  if (group.length === 0) return null;
                    
                  const isCollapsed = collapsedGroups[label];
                  const contentRef = contentRefs.current[label] || (contentRefs.current[label] = React.createRef());

                  return (
                    <div key={label} className="request-group">
                      {/* Enhanced Group Header */}
                      <div className="enhanced-group-header">
                        <button
                          className="group-toggle-button"
                          onClick={() => toggleGroup(label)}
                        >
                          <div className="group-header-content">
                            <h2 className="group-title">{label}</h2>
                            <span className="group-count">({group.length})</span>
                          </div>
                          <div className="group-arrow">
                            {isCollapsed ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
                          </div>
                        </button>
                      </div>

                      {/* Collapsible Content */}
                      <div
                        ref={contentRef}
                        className={`group-content ${isCollapsed ? 'collapsed' : 'expanded'}`}
                      >
                        <div className="request-cards">
                          {group.map((request) => {
                            const isPastDue = new Date(request.dateRequired) < new Date();
                            const isApprovalRequested = request.approvalRequested === true || approvalRequestedIds.includes(request.id);
                            const isItemConflict = (request.requestList || []).some(item => {
                              const key = `${item.selectedItemId}_${request.dateRequired}`;
                              return firstRequestMap[key] !== request.id;
                            });
                            const isDisabled = isApprovalRequested || isItemConflict;

                            return (
                              <div
                                key={request.id}
                                className={`enhanced-request-card ${isPastDue ? 'past-due' : ''} ${isDisabled ? 'disabled' : ''}`}
                                onClick={() => !isDisabled && handleViewDetails(request)}
                              >
                                {/* Enhanced Usage Badge */}
                                <div className="enhanced-usage-badge">
                                  <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                                  <div 
                                    className="usage-icon"
                                    style={{ backgroundColor: usageBG(request.usageType) }}
                                  >
                                    {getUsageTypeIcon(request.usageType)}
                                  </div>
                                  {/* <div className="usage-initials">
                                    {getInitials(request.usageType)}
                                  </div> */}
                                   <div className="card-header" style={{marginBottom: 0}}>
                                    <div className="user-info">
                                      <div className="user-details">
                                        <h3 className="user-name">
                                          <UserOutlined className="user-icon" />
                                          {capitalizeName(request.userName)}
                                        </h3>
                                        <p className="program">{request.program}</p>
                                      </div>
                                    </div>

                                  </div>
                                  </div>
                                    <div className={`required-date ${isPastDue ? 'overdue' : ''}`}>
                                      <CalendarOutlined className="date-icon" />
                                      <div className="date-content">
                                        <span className="date-label">Required: </span>
                                        <span className="date-value">{request.dateRequired}</span>
                                      </div>
                                    </div>
                                </div>

                                {/* Enhanced Card Content */}
                                <div className="enhanced-card-content">
                                 

                              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                  <div className="card-details">
                                    <div className="detail-row">
                                      <span className="detail-label">Room:</span>
                                      <span className="detail-value">{request.room}</span>
                                    </div>
                                    <div className="detail-row">
                                      <span className="detail-label">Usage:</span>
                                      <span className="detail-value">{request.usageType}</span>
                                    </div>
                                    <div className="detail-row">
                                      <span className="detail-label">Course:</span>
                                      <span className="detail-value">{request.course} ({request.courseDescription}) </span>
                                    </div>
                                  </div>

                                  <div className="item-list">
                                    {request.requestList?.map((item, index) => {
                                      const key = `${item.selectedItemId}_${request.dateRequired}`;
                                      const position = requestOrderMap?.[request.id]?.[key];

                                      return (
                                        <div key={index} className="item-entry">
                                          <span className="item-bullet">•</span>
                                          <span className="item-name">{item.itemName}</span>
                                          <span className="item-position">#{position ?? 'N/A'} to request</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                              </div>

                                  {/* Status Indicators */}
                                  {isItemConflict && (
                                    <div className="status-alert conflict">
                                      <span className="alert-icon">⚠️</span>
                                      Request blocked (already requested by someone else)
                                    </div>
                                  )}

                                  {isApprovalRequested && (
                                    <div className="status-alert pending">
                                      <span className="alert-icon">⏳</span>
                                      Waiting for Dean Approval
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Spin>
        </div>

        {/* All your existing modals remain unchanged */}
        <Modal
          title="Reject Reason"
          visible={isRejectModalVisible}
          onCancel={() => setIsRejectModalVisible(false)}
          onOk={handleRejectSubmit}
          zIndex={1030}
        >
          <Input.TextArea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Please provide a reason for rejection"
          />
        </Modal>

        {isMultiRejectModalVisible && (
          <Modal
            title="Provide Reasons for Unchecked Items"
            open={isMultiRejectModalVisible}
            zIndex={1023}
            width={'40%'}
            onCancel={() => {
              setIsMultiRejectModalVisible(false);
              setApproveLoading(false);
            }}
            footer={[
              <Button key="cancel" onClick={() => {
                setIsMultiRejectModalVisible(false);
                setApproveLoading(false);
              }} disabled={multiRejectLoading}>
                Cancel
              </Button>,

              <Button key="confirm" type="primary" onClick={handleOpenFinalizeModal} loading={multiRejectLoading}>
                Confirm
              </Button>,
            ]}
          >
            <Table
              dataSource={pendingApprovalData?.uncheckedItems || []}
              columns={columnsRejection1}
              rowKey={(record, index) => `multi-reject-${index}`}
              pagination={false}
            />
          </Modal>
        )}

        {isFinalizeModalVisible && (
          <Modal
            title="Finalize Order"
            open={isFinalizeModalVisible}
            zIndex={1024}
            width={'50%'}
            onCancel={() => {
              setIsFinalizeModalVisible(false);
              setApproveLoading(false);
            }}
            footer={[
              <Button key="back" onClick={() => {
                setIsFinalizeModalVisible(false);
                setApproveLoading(false);
              }} disabled={rejectLoading}>
                Cancel
              </Button>,
              <Button key="submit" type="primary" onClick={handleRejectConfirm} loading={rejectLoading}>
                Finalize
              </Button>,
            ]}
          >
            <p>Please review your selections below before finalizing your order:</p>

            <h3>✅ Approved Items</h3>
            <Table
              dataSource={pendingApprovalData?.enrichedItems || []}
              columns={[
                {
                  title: 'Item Name',
                  dataIndex: 'itemName',
                  key: 'itemName',
                },
                {
                  title: 'Item Description',
                  dataIndex: 'itemDetails',
                  key: 'itemDetails',
                },
                {
                  title: 'Quantity',
                  dataIndex: 'quantity',
                  key: 'quantity',
                  render: (text, record, index) => {
                    const editedItem = editableItems?.find(item => item?.selectedItemId === record.selectedItemId);
                    const valueFromEditable = editedItem?.quantity;
                    return <span>{valueFromEditable ?? text}</span>;
                  },
                }
              ]}
              rowKey={(record, index) => `approved-${index}`}
              pagination={false}
            />

            <h3 style={{ marginTop: 24 }}>❌ Rejected Items</h3>
            <Table
              dataSource={pendingApprovalData?.uncheckedItems || []}
              columns={columnsRejection1} 
              rowKey={(record, index) => `rejected-${index}`}
              pagination={false}
            />
          </Modal>
        )}

        <RequisitionRequestModal
          isModalVisible={isModalVisible}
          handleCancel={handleCancel}
          handleApprove={handleApprove}
          handleReturn={handleReject}
          selectedRequest={selectedRequest}
          columns={columns}
          formatDate={formatDate}
          allItemsChecked={allItemsChecked} 
          college={selectedCollege} 
          approveLoading={approveLoading}
          rejectLoading={rejectLoading}
          editableItems={editableItems}
          setEditableItems={setEditableItems}
          checkedItems={checkedItems}
          userViolationCounts={userViolationCounts}
        />

        <ApprovedRequestModal
          isApprovedModalVisible={isApprovedModalVisible}
          setIsApprovedModalVisible={setIsApprovedModalVisible}
          selectedApprovedRequest={selectedApprovedRequest}
          setSelectedApprovedRequest={setSelectedApprovedRequest}
          columns={columns}
          formatDate={formatDate}
        />

        <NotificationModal
          isVisible={isNotificationVisible}
          onClose={() => setIsNotificationVisible(false)}
          message={notificationMessage}
        />
      </Layout>
    </Layout>
  );
};

export default PendingRequest;


// import React, { useState, useEffect, useRef } from "react";
// import { Layout, Button, Typography, Modal, Table, notification, Input, Select, Spin } from "antd";
// import "../styles/adminStyle/PendingRequest.css";
// import { db } from "../../backend/firebase/FirebaseConfig"; 
// import { collection, getDocs, getDoc, doc, addDoc, query, where, deleteDoc, serverTimestamp, onSnapshot, updateDoc, orderBy } from "firebase/firestore";
// import { getFunctions, httpsCallable } from "firebase/functions"
// import { getAuth } from "firebase/auth";
// import RequisitionRequestModal from "../customs/RequisitionRequestModal";
// import ApprovedRequestModal from "../customs/ApprovedRequestModal";
// import NotificationModal from "../customs/NotificationModal";
// import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
// const { Content } = Layout;
// const { Title, Text } = Typography;
// const { Option } = Select;

// const PendingRequest = () => {

//   const [searchTerm, setSearchTerm] = useState('');
//   const [checkedItems, setCheckedItems] = useState({});
//   const [approvedRequests, setApprovedRequests] = useState([]);
//   const [userViolationCounts, setUserViolationCounts] = useState({});
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [isNotificationVisible, setIsNotificationVisible] = useState(false);
//   const [notificationMessage, setNotificationMessage] = useState("");
//   const [requests, setRequests] = useState([]);
//   const [selectedApprovedRequest, setSelectedApprovedRequest] = useState(null);
//   const [isApprovedModalVisible, setIsApprovedModalVisible] = useState(false);
//   const [rejectReason, setRejectReason] = useState("");
//   const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
//   const [selectedCollege, setSelectedCollege] = useState(null);
//   const [rejectionReason, setRejectionReason] = useState('');
//   const [pendingApprovalData, setPendingApprovalData] = useState(null); 
//   const [isMultiRejectModalVisible, setIsMultiRejectModalVisible] = useState(false);
//   const [rejectionReasons, setRejectionReasons] = useState({});
//   const [isFinalizeModalVisible, setIsFinalizeModalVisible] = useState(false);
//   const [firstRequestMap, setFirstRequestMap] = useState({});
//   const [approvalRequestedIds, setApprovalRequestedIds] = useState([]);
//   const [requestOrderMap, setRequestOrderMap] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [editableItems, setEditableItems] = useState([]);
//   const [approveLoading, setApproveLoading] = useState(false);
//   const [rejectLoading, setRejectLoading] = useState(false);
//   const [multiRejectLoading, setMultiRejectLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState('all'); // 'all' or 'pastDue'

// const sanitizeInput = (input) =>
//   input

//     .replace(/\s+/g, " ")         
//     .replace(/[^a-z0-9 \-.,()]/g, "");


// const [selectedFilter, setSelectedFilter] = useState('All');
// const sanitizedSearch = sanitizeInput(searchTerm).toLowerCase();

// const filteredRequests = requests.filter((request) => {
//   return (
//     request.userName?.toLowerCase().includes(sanitizedSearch) ||
//     request.room?.toLowerCase().includes(sanitizedSearch) ||
//     request.course?.toLowerCase().includes(sanitizedSearch) ||
//     request.courseDescription?.toLowerCase().includes(sanitizedSearch)
//   );
// });

// const getCollegeByDepartment = async (departmentName) => {
//   if (!departmentName) return null;

//   const q = query(
//     collection(db, "departments"),
//     where("name", "==", departmentName)
//   );

//   const snapshot = await getDocs(q);
//   if (!snapshot.empty) {
//     return snapshot.docs[0].data().college || null;
//   }
//   return null;
// };

// // Function to fetch violation count for a user
// const fetchUserViolationCount = async (userName) => {
//   try {
//     const q = query(
//       collection(db, "accounts"),
//       where("name", "==", userName)
//     );
//     const querySnapshot = await getDocs(q);
    
//     if (!querySnapshot.empty) {
//       const userDoc = querySnapshot.docs[0];
//       const userData = userDoc.data();
//       return userData.violationCount || 0;
//     }
//     return 0;
//   } catch (error) {
//     console.error('Error fetching user violation count:', error);
//     return 0;
//   }
// };

// // useEffect(() => {
// //   const userRequestRef = collection(db, "userrequests");
// //   const q = query(userRequestRef, orderBy("timestamp", "desc"));

// //   const unsubscribe = onSnapshot(
// //     q,
// //     async (querySnapshot) => {
  

// //       const fetched = [];

// //       for (const docSnap of querySnapshot.docs) {
// //         const data = docSnap.data();

// //         const enrichedItems = await Promise.all(
// //           (data.filteredMergedData || []).map(async (item) => {
// //             const inventoryId = item.selectedItemId || item.selectedItem?.value;
// //             let itemId = "N/A";

// //             if (inventoryId) {
// //               try {
// //                 const invDoc = await getDoc(doc(db, `inventory/${inventoryId}`));
// //                 if (invDoc.exists()) {
// //                   itemId = invDoc.data().itemId || "N/A";
// //                 }
// //               } catch (err) {
// //                 console.error("Error fetching inventory item:", err);
// //               }
// //             }

// //             return {
// //               ...item,
// //               itemIdFromInventory: itemId,
// //             };
// //           })
// //         );

// //         fetched.push({
// //           // id: docSnap.id,
// //           // ...data,
// //           ...data,
// //           id: docSnap.id,
// //           firestoreId: docSnap.id,
// //           requestList: enrichedItems,
// //           timeFrom: data.timeFrom || "N/A",
// //           timeTo: data.timeTo || "N/A",
// //         });
// //       }

// //       // setRequests(fetched);

// //       // Determine first requests per item per date
// //       const firstRequestsMap = {};

// //       fetched.forEach((req) => {
// //         const date = req.dateRequired;
// //         const timestamp = req.timestamp?.toDate?.() || new Date(); // make sure it's a Date object

// //         (req.requestList || []).forEach((item) => {
// //           const key = `${item.selectedItemId}_${date}`;
          
// //           // If key is not set or current request is earlier, update it
// //           if (!firstRequestsMap[key] || timestamp < firstRequestsMap[key].timestamp) {
// //             firstRequestsMap[key] = {
// //               requestId: req.id,
// //               timestamp,
// //             };
// //           }
// //         });
// //       });

// //       const simpleFirstRequestMap = {};
// //       for (const key in firstRequestsMap) {
// //         simpleFirstRequestMap[key] = firstRequestsMap[key].requestId;
// //       }

// //       setRequests(fetched);
// //       setFirstRequestMap(simpleFirstRequestMap);

    
// //     },
// //     (error) => {
  
// //       console.error("Error fetching user requests:", error);
// //     }
// //   );

// //   return () => unsubscribe();
// // }, []);

//   useEffect(() => {
//     if (selectedRequest?.requestList) {
//       const itemsWithMax = selectedRequest.requestList.map((item) => ({
//         ...item,
//         quantity: item.quantity,            // Editable
//         maxQuantity: item.quantity,         // Store original as max
//       }));
//       setEditableItems(itemsWithMax);
//     }
//   }, [selectedRequest]);

//   useEffect(() => {
//     const userRequestRef = collection(db, "userrequests");
//     const q = query(userRequestRef, orderBy("timestamp", "desc"));

//     const unsubscribe = onSnapshot(
//       q,
//       async (querySnapshot) => {
//         setLoading(true); // Start loading

//         const fetched = [];

//         for (const docSnap of querySnapshot.docs) {
//           const data = docSnap.data();

//           const enrichedItems = await Promise.all(
//             (data.filteredMergedData || []).map(async (item) => {
//               const inventoryId = item.selectedItemId || item.selectedItem?.value;
//               let itemId = "N/A";

//               if (inventoryId) {
//                 try {
//                   const invDoc = await getDoc(doc(db, `inventory/${inventoryId}`));
//                   if (invDoc.exists()) {
//                     itemId = invDoc.data().itemId || "N/A";
//                   }
//                 } catch (err) {
//                   console.error("Error fetching inventory item:", err);
//                 }
//               }

//               return {
//                 ...item,
//                 itemIdFromInventory: itemId,
//               };
//             })
//           );

//           fetched.push({
//             ...data,
//             id: docSnap.id,
//             firestoreId: docSnap.id,
//             requestList: enrichedItems,
//             timeFrom: data.timeFrom || "N/A",
//             timeTo: data.timeTo || "N/A",
//           });
//         }

//         // Determine first request per item+date
//         const firstRequestsMap = {};
//         const requestRankMap = {};

//         fetched.forEach((req) => {
//           const date = req.dateRequired;
//           const timestamp = req.timestamp?.toDate?.() || new Date();

//           (req.requestList || []).forEach((item) => {
//             const key = `${item.selectedItemId}_${date}`;

//             // First request logic
//             if (!firstRequestsMap[key] || timestamp < firstRequestsMap[key].timestamp) {
//               firstRequestsMap[key] = {
//                 requestId: req.id,
//                 timestamp,
//               };
//             }

//             // Build list for rank ordering
//             if (!requestRankMap[key]) {
//               requestRankMap[key] = [];
//             }
//             requestRankMap[key].push({ requestId: req.id, timestamp });
//           });
//         });

//         const simpleFirstRequestMap = {};
//         for (const key in firstRequestsMap) {
//           simpleFirstRequestMap[key] = firstRequestsMap[key].requestId;
//         }

//         // Sort and compute rank per request per item+date
//         const requestPositionMap = {};
//         for (const key in requestRankMap) {
//           const sorted = requestRankMap[key].sort((a, b) => a.timestamp - b.timestamp);
//           sorted.forEach((entry, index) => {
//             if (!requestPositionMap[entry.requestId]) {
//               requestPositionMap[entry.requestId] = {};
//             }
//             requestPositionMap[entry.requestId][key] = index + 1; // 1-based index
//           });
//         }

//         // Final state updates
//         setRequests(fetched);
//         setFirstRequestMap(simpleFirstRequestMap);
//         setRequestOrderMap(requestPositionMap);

//         // Fetch violation counts for all unique users
//         const uniqueUserNames = [...new Set(fetched.map(req => req.userName).filter(Boolean))];
//         const violationCounts = {};
        
//         for (const userName of uniqueUserNames) {
//           const violationCount = await fetchUserViolationCount(userName);
//           violationCounts[userName] = violationCount;
//         }
        
//         setUserViolationCounts(violationCounts);

//         setLoading(false); // End loading
//       },
//       (error) => {
//         setLoading(false);
//         console.error("Error fetching user requests:", error);
//       }
//     );

//     return () => unsubscribe();
//   }, []);

//   // const handleViewDetails = (request) => {
//   //   setSelectedRequest(request);
//   //   setIsModalVisible(true);
//   // };

//   const handleViewDetails = async (request) => {
//     if (!request || !request.department) {
//       console.error("Department is undefined. Cannot fetch college.");
//       setSelectedRequest(request);
//       setSelectedCollege(null); // Or some default
//       setIsModalVisible(true);
//       return;
//     }

//     const college = await getCollegeByDepartment(request.department);
//     setSelectedRequest(request);
//     setSelectedCollege(college);
//     setIsModalVisible(true);
//   };

//   const handleCancel = () => {
//     setCheckedItems({});
//     setEditableItems([]);
//     setIsModalVisible(false);
//     setSelectedRequest(null);
//     setApproveLoading(false);
//     setRejectLoading(false);
//     setMultiRejectLoading(false);
//     setIsMultiRejectModalVisible(false);
//     setIsFinalizeModalVisible(false);
//   };

//   const handleOpenFinalizeModal = () => {
//     setIsMultiRejectModalVisible(false);
//     setIsFinalizeModalVisible(true);
//   };



//    const handleMultiRejectConfirm = async () => {
//     setMultiRejectLoading(true);
//     setIsMultiRejectModalVisible(false);
  
//     const { enrichedItems, uncheckedItems, selectedRequest } = pendingApprovalData;

//     try {
//       const accountRef = doc(db, "accounts", selectedRequest.accountId);
//       const accountSnap = await getDoc(accountRef);

//       if (accountSnap.exists()) {
//         const accountData = accountSnap.data();
//         const isDisabled = accountData.disabled || false; // Adjust field name if different

//         if (isDisabled) {
//           setNotificationMessage("Cannot approve: The user's account is disabled.");
//           setIsNotificationVisible(true);
//           setMultiRejectLoading(false);
//           return;
//         }
        
//       } else {
      
//       }

//     } catch (error) {

//       setNotificationMessage("Error verifying account status. Please try again.");
//       setIsNotificationVisible(true);
//       setMultiRejectLoading(false);
//       return;
//     }

//     // 🔍 Check inventory quantities before approval
//     const insufficientItems = [];
    
//     for (const item of enrichedItems) {
//       const inventoryId = item.selectedItemId;
//       const requestedQty = Number(item.quantity);
      
//       if (!inventoryId || isNaN(requestedQty) || requestedQty <= 0) {
//         continue;
//       }

//       try {
//         const inventoryRef = doc(db, "inventory", inventoryId);
//         const inventorySnap = await getDoc(inventoryRef);
        
//         if (!inventorySnap.exists()) {
//           insufficientItems.push({
//             itemName: item.itemName || "Unknown Item",
//             requested: requestedQty,
//             available: 0,
//             reason: "Item not found in inventory"
//           });
//           continue;
//         }

//         const data = inventorySnap.data();
//         const availableQty = Number(data.quantity || 0);
        
//         if (availableQty < requestedQty) {
//           insufficientItems.push({
//             itemName: item.itemName || data.itemName || "Unknown Item",
//             requested: requestedQty,
//             available: availableQty,
//             reason: "Insufficient quantity"
//           });
//         }
//       } catch (error) {
//         console.error("Error checking inventory for item:", item.itemName, error);
//         insufficientItems.push({
//           itemName: item.itemName || "Unknown Item",
//           requested: requestedQty,
//           available: 0,
//           reason: "Error checking inventory"
//         });
//       }
//     }

//     // If there are insufficient items, show error and prevent approval
//     if (insufficientItems.length > 0) {
//       const errorMessage = insufficientItems.map(item => 
//         `${item.itemName}: Requested ${item.requested}, Available ${item.available} (${item.reason})`
//       ).join('\n');
      
//       setNotificationMessage(`Cannot approve request. Insufficient inventory:\n${errorMessage}`);
//       setIsNotificationVisible(true);
//       setMultiRejectLoading(false);
//       return;
//     }
  
//     try {
//       const rejectedItems = await Promise.all(
//         uncheckedItems.map(async (item, index) => {
//           const selectedItemId = item.selectedItemId || item.selectedItem?.value;
//           const itemKey = `${selectedItemId}-${index}`;
//           let itemType = "Unknown";
  
//           if (selectedItemId) {
//             try {
//               const inventoryDoc = await getDoc(doc(db, "inventory", selectedItemId));
//               if (inventoryDoc.exists()) {
//                 itemType = inventoryDoc.data().type || "Unknown";
//               }

//             } catch (err) {
    
//             }
//           }
  
//           return {
//             ...item,
//             selectedItemId,
//             itemType,
//             reason: rejectionReasons[itemKey] || "No reason provided",
//           };
//         })
//       );
  
//       const auth = getAuth();
//       const currentUser = auth.currentUser;
//       const userEmail = currentUser.email;
  
//       // Fetch the user name from Firestore
//       let userName = "Unknown";
//       try {
//         const userQuery = query(collection(db, "accounts"), where("email", "==", userEmail));
//         const userSnapshot = await getDocs(userQuery);
  
//         if (!userSnapshot.empty) {
//           const userDoc = userSnapshot.docs[0];
//           const userData = userDoc.data();
//           userName = userData.name || "Unknown";
//         }

//       } catch (error) {

//       }
  
//       const requestLogEntry = {
//         accountId: selectedRequest.accountId || "N/A",
//         userName: selectedRequest.userName || "N/A",
//         room: selectedRequest.room || "N/A",
//         course: selectedRequest.course || "N/A",
//         courseDescription: selectedRequest.courseDescription || "N/A",
//         dateRequired: selectedRequest.dateRequired || "N/A",
//         timeFrom: selectedRequest.timeFrom || "N/A",
//         timeTo: selectedRequest.timeTo || "N/A",
//         timestamp: selectedRequest.timestamp || "N/A",
//         rawTimestamp: new Date(),
//         requestList: enrichedItems,
//         status: "Approved",
//         approvedBy: userName,
//         reason: selectedRequest.reason || "No reason provided",
//         program: selectedRequest.program,
//         usageType: selectedRequest.usageType || "N/A",  
//       };
  
//       const rejectLogEntry = {
//         accountId: selectedRequest.accountId || "N/A",
//         userName: selectedRequest.userName || "N/A",
//         room: selectedRequest.room || "N/A",
//         course: selectedRequest.course || "N/A",
//         courseDescription: selectedRequest.courseDescription || "N/A",
//         dateRequired: selectedRequest.dateRequired || "N/A",
//         timeFrom: selectedRequest.timeFrom || "N/A",
//         timeTo: selectedRequest.timeTo || "N/A",
//         timestamp: selectedRequest.timestamp || "N/A",
//         rawTimestamp: new Date(),
//         requestList: rejectedItems,
//         status: "Rejected",
//         rejectedBy: userName,
//         reason: rejectionReason || "No reason provided",
//         program: selectedRequest.program,
//         usageType: selectedRequest.usageType || "N/A",  
//       };
  
//       const logRequestOrReturn = async (
//         userId,
//         userName,
//         action,
//         requestDetails,
//         extraInfo = {}
//       ) => {
//         await addDoc(collection(db, `accounts/${userId}/historylog`), {
//           action,
//           userName,
//           timestamp: serverTimestamp(),
//           requestList: requestDetails,
//           ...extraInfo,
//         });
//       };
  
//       // Log approved items
//       await logRequestOrReturn(
//         selectedRequest.accountId,
//         selectedRequest.userName,
//         "Request Approved",
//         enrichedItems,
//         {
//           approvedBy: userName,
//           course: selectedRequest.course || "N/A",
//           courseDescription: selectedRequest.courseDescription || "N/A",
//           dateRequired: selectedRequest.dateRequired,
//           reason: selectedRequest.reason,
//           room: selectedRequest.room,
//           program: selectedRequest.program,
//           timeFrom: selectedRequest.timeFrom || "N/A",
//           timeTo: selectedRequest.timeTo || "N/A",
//           timestamp: selectedRequest.timestamp || "N/A",
//           rawTimestamp: new Date(),
//           usageType: selectedRequest.usageType || "N/A",  
//         }
//       );
  
//       // Log rejected items
//       if (rejectedItems.length > 0) {
//         await logRequestOrReturn(
//           selectedRequest.accountId,
//           selectedRequest.userName,
//           "Request Rejected",
//           rejectedItems,
//           {
//             rejectedBy: userName,
//             course: selectedRequest.course || "N/A",
//             courseDescription: selectedRequest.courseDescription || "N/A",
//             dateRequired: selectedRequest.dateRequired,
//             reason: rejectedItems.map(item => item.reason).join(", ") || "No reason provided",
//             room: selectedRequest.room,
//             program: selectedRequest.program,
//             timeFrom: selectedRequest.timeFrom || "N/A",
//             timeTo: selectedRequest.timeTo || "N/A",
//             timestamp: selectedRequest.timestamp || "N/A",
//             rawTimestamp: new Date(),
//             usageType: selectedRequest.usageType || "N/A",  
//           }
//         );
//       }




// try {
//         for (const item of enrichedItems) {
//           const inventoryId = item.selectedItemId;
//           const requestedQty = Number(item.quantity);
//           const labRoomId = item.labRoom;

//           if (!inventoryId || isNaN(requestedQty) || requestedQty <= 0) {
           
//             continue;
//           }

//           if (!labRoomId) {
         
//             continue;
//           }

//           const inventoryRef = doc(db, "inventory", inventoryId);
//           const inventorySnap = await getDoc(inventoryRef);
//           if (!inventorySnap.exists()) {
           
//             continue;
//           }

//           const data = inventorySnap.data();
//           const currentQty = Number(data.quantity || 0);
//           const newQty = Math.max(currentQty - requestedQty, 0);
//           await updateDoc(inventoryRef, { quantity: newQty });

//          console.log("📌 Attempting to log usage:", {
//           itemId: data.itemId,
//           requestedQty
//         });

//         try {
//           await addDoc(collection(db, "itemUsage"), {
//             itemId: data.itemId,
//             itemName:data.itemName,
//             usedQuantity: requestedQty,
//             timestamp: serverTimestamp(),
//           });
//           console.log("✅ itemUsage logged");
//         } catch (logErr) {
//           console.error("❌ Failed to log itemUsage:", logErr);
//         }

         

//           // ⚙️ Update inventory condition breakdown
//           let remaining = requestedQty;
//           const good = data.condition?.Good ?? 0;
//           const damage = data.condition?.Damage ?? 0;
//           const defect = data.condition?.Defect ?? 0;
//           const lost = data.condition?.Lost ?? 0;

//           let newGood = good;
//           let newDamage = damage;
//           let newDefect = defect;
//           let newLost = lost;

//           if (remaining > 0) {
//             const deductFromGood = Math.min(newGood, remaining);
//             newGood -= deductFromGood;
//             remaining -= deductFromGood;
//           }

//           if (remaining > 0) {
//             const deductFromDamage = Math.min(newDamage, remaining);
//             newDamage -= deductFromDamage;
//             remaining -= deductFromDamage;
//           }

//           if (remaining > 0) {
//             const deductFromDefect = Math.min(newDefect, remaining);
//             newDefect -= deductFromDefect;
//             remaining -= deductFromDefect;
//           }

//           if (remaining > 0) {
//             const deductFromLost = Math.min(newLost, remaining);
//             newLost -= deductFromLost;
//             remaining -= deductFromLost;
//           }

//           await updateDoc(inventoryRef, {
//             'condition.Good': newGood,
//             'condition.Damage': newDamage,
//             'condition.Defect': newDefect,
//             'condition.Lost': newLost,
//           });



//           // 🔁 Update labRoom item quantity
//           const roomNumber = item.labRoom; // e.g. "0930"
//           const labRoomCollectionRef = collection(db, "labRoom");
//           const q = query(labRoomCollectionRef, where("roomNumber", "==", roomNumber));
//           const querySnapshot = await getDocs(q);

//           if (querySnapshot.empty) {
           
//             return;
//           }

//           // 2. Get Firestore doc ID of the labRoom
//           const labRoomDoc = querySnapshot.docs[0];
//           const labRoomDocId = labRoomDoc.id;

//           // 3. Query items subcollection for item with matching itemId
//           const itemId = data.itemId; // e.g. "DENT02"
//           const itemsCollectionRef = collection(db, "labRoom", labRoomDocId, "items");
//           const itemQuery = query(itemsCollectionRef, where("itemId", "==", itemId));
//           const itemSnapshot = await getDocs(itemQuery);

//           if (itemSnapshot.empty) {
          
//             return;
//           }

//           // 4. Get the Firestore doc ID of the item document
//           const itemDoc = itemSnapshot.docs[0];
//           const itemDocId = itemDoc.id;
//           const labRoomItemRef = doc(db, "labRoom", labRoomDocId, "items", itemDocId);
//           const labData = itemDoc.data();

//           const currentLabQty = Number(labData.quantity || 0);
//           const newLabQty = Math.max(currentLabQty - requestedQty, 0);
//           await updateDoc(labRoomItemRef, { quantity: newLabQty });
          
        

//           // Update condition breakdown
//           let labGood = labData.condition?.Good ?? 0;
//           let labDamage = labData.condition?.Damage ?? 0;
//           let labDefect = labData.condition?.Defect ?? 0;
//           let labLost = labData.condition?.Lost ?? 0;

//           let remainingLab = requestedQty;

//           if (remainingLab > 0) {
//             const deductFromLabGood = Math.min(labGood, remainingLab);
//             labGood -= deductFromLabGood;
//             remainingLab -= deductFromLabGood;
//           }

//           if (remainingLab > 0) {
//             const deductFromLabDamage = Math.min(labDamage, remainingLab);
//             labDamage -= deductFromLabDamage;
//             remainingLab -= deductFromLabDamage;
//           }

//           if (remainingLab > 0) {
//             const deductFromLabDefect = Math.min(labDefect, remainingLab);
//             labDefect -= deductFromLabDefect;
//             remainingLab -= deductFromLabDefect;
//           }

//           if (remainingLab > 0) {
//             const deductFromLabLost = Math.min(labLost, remainingLab);
//             labLost -= deductFromLabLost;
//             remainingLab -= deductFromLabLost;
//           }

//           await updateDoc(labRoomItemRef, {
//             'condition.Good': labGood,
//             'condition.Damage': labDamage,
//             'condition.Defect': labDefect,
//             'condition.Lost' : labLost,
//           });
//         }
        
//       } catch (err) {
       
//       }
    
//       await addDoc(collection(db, "requestlog"), requestLogEntry);
  
//       if (rejectedItems.length > 0) {
//         await addDoc(collection(db, "requestlog"), rejectLogEntry);
//       }
  
//       const fixedItems = enrichedItems.filter(item => item.itemType === "Fixed");
  
//       if (fixedItems.length > 0) {
//         const formattedItems = fixedItems.map(item => ({
//           category: item.category || "N/A",
//           condition: item.condition || "N/A",
//           department: item.department || "N/A",
//           itemName: item.itemName || "N/A",
//           itemDetails: item.itemDetails || "N/A",
//           itemId: item.itemIdFromInventory,
//           quantity: item.quantity || "1",
//           selectedItemId: item.selectedItemId || "N/A",
//           status: item.status || "Available",
//           program: item.program || "N/A",
//           course: item.course || "N/A",
//           courseDescription: item.courseDescription || "N/A",
//           reason: item.reason || "No reason provided",
//           labRoom: item.labRoom || "N/A",
//           timeFrom: item.timeFrom || "N/A",
//           timeTo: item.timeTo || "N/A",
//           usageType: item.usageType || "N/A",
//           scannedCount: 0,
//         }));
  
//         const borrowCatalogEntry = {
//           accountId: selectedRequest.accountId || "N/A",
//           userName: selectedRequest.userName || "N/A",
//           room: selectedRequest.room || "N/A",
//           course: selectedRequest.course || "N/A",
//           courseDescription: selectedRequest.courseDescription || "N/A",
//           dateRequired: selectedRequest.dateRequired || "N/A",
//           timeFrom: selectedRequest.timeFrom || "N/A",
//           timeTo: selectedRequest.timeTo || "N/A",
//           timestamp: selectedRequest.timestamp || "N/A",
//           rawTimestamp: new Date(),
//           requestList: formattedItems,
//           status: "Borrowed",
//           approvedBy: userName,
//           reason: selectedRequest.reason || "No reason provided",
//           program: selectedRequest.program,
//         };
  
//         const userRequestLogEntry = {
//           ...requestLogEntry,
//           status: "Approved",
//           approvedBy: userName,
//           timestamp: selectedRequest.timestamp || "N/A",
//           rawTimestamp: new Date(),
//         };
  
//         await addDoc(collection(db, "borrowcatalog"), borrowCatalogEntry);
  
//         await addDoc(collection(db, "accounts", selectedRequest.accountId, "userrequestlog"), userRequestLogEntry);

//         // ✅ Notify the user who submitted the request
//         if (selectedRequest.accountId && selectedRequest.accountId !== "system") {
//           await addDoc(collection(db, `accounts/${selectedRequest.accountId}/userNotifications`), {
//             action: `Rejected request for ${selectedRequest.userName}`,
//             requestId: selectedRequest.id,
//             userName: selectedRequest.userName,
//             read: false,
//             timestamp: serverTimestamp(),
//           });
//         }

//         // ✅ Send push to the user who submitted the request
//         try {
//           const functions = getFunctions();
//           const sendPush = httpsCallable(functions, "sendPushNotification");

//           const pushTokenSnapshot = await getDocs(collection(db, "pushTokens"));
//           const tokensToNotify = [];

//           pushTokenSnapshot.forEach((doc) => {
//             const data = doc.data();
//             if (
//               data?.expoPushToken &&
//               data.userId === selectedRequest.userId // 👈 This should match the request sender
//             ) {
//               tokensToNotify.push(data.expoPushToken);
//             }
//           });

//           for (const token of tokensToNotify) {
//             const payload = {
//               token,
//               title: "Request Update",
//               body: `Your requisition has been rejected.`, // or `rejected` if applicable
//             };

//             const response = await sendPush(payload);
//             console.log("✅ Push sent to user:", response.data);
//           }

//         } catch (err) {
//           console.error("❌ Push error (admin to user):", err.message || err);
//         }
//       }
  
//       await deleteDoc(doc(db, "userrequests", selectedRequest.id));
  
//       // Delete matching user request subcollection doc
//       const subCollectionRef = collection(db, "accounts", selectedRequest.accountId, "userRequests");
//       const subDocsSnap = await getDocs(subCollectionRef);
  
//       subDocsSnap.forEach(async (docSnap) => {
//         const data = docSnap.data();
//         const match = (
//           data.timestamp?.seconds === selectedRequest.timestamp?.seconds &&
//           data.filteredMergedData?.[0]?.selectedItemId === selectedRequest.filteredMergedData?.[0]?.selectedItemId
//         );
  
//         if (match) {
        
//           await deleteDoc(doc(db, "accounts", selectedRequest.accountId, "userRequests", docSnap.id));
//         }
//       });
  
//       setApprovedRequests(prev => [...prev, requestLogEntry]);
//       setRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
//       setCheckedItems({});
//       setIsModalVisible(false);
//       setSelectedRequest(null);
//       setIsFinalizeModalVisible(false)

//       setNotificationMessage("Approval and rejection have been logged successfully.");
//       setIsNotificationVisible(true);
  
//       notification.success({
//         message: "Request Processed",
//         description: "Approval and rejection have been logged successfully.",
//       });
  
//     } catch (error) {
      
//       notification.error({
//         message: "Error",
//         description: "Failed to process the request after rejection confirmation.",
//       });
//     } finally {
//       setMultiRejectLoading(false);
//     }
//   };

//  // FRONTEND 
// //   const handleRejectConfirm = async () => {  
// //     setIsMultiRejectModalVisible(false);
  
// //     const { enrichedItems, uncheckedItems, selectedRequest } = pendingApprovalData;

// //     try {
// //       const accountRef = doc(db, "accounts", selectedRequest.accountId);
// //       const accountSnap = await getDoc(accountRef);

// //       if (accountSnap.exists()) {
// //         const accountData = accountSnap.data();
// //         const isDisabled = accountData.disabled || false; // Adjust field name if different

// //         if (isDisabled) {
// //           setNotificationMessage("Cannot approve: The user's account is disabled.");
// //           setIsNotificationVisible(true);
// //           return;
// //         }
        
// //       } else {
      
// //       }

// //     } catch (error) {
     
// //       setNotificationMessage("Error verifying account status. Please try again.");
// //       setIsNotificationVisible(true);
// //       return;
// //     }
  
// //     try {
// //       const rejectedItems = await Promise.all(
// //         uncheckedItems.map(async (item, index) => {
// //           const selectedItemId = item.selectedItemId || item.selectedItem?.value;
// //           let itemType = "Unknown";
      
// //           if (selectedItemId) {
// //             try {
// //               const inventoryDoc = await getDoc(doc(db, "inventory", selectedItemId));
// //               if (inventoryDoc.exists()) {
// //                 itemType = inventoryDoc.data().type || "Unknown";
// //               }
// //             } catch (err) {
            
// //             }
// //           }
      
// //           const itemKey = `${selectedItemId}-${index}`;
// //           const rejectionReason = rejectionReasons[itemKey] || "No reason provided";
      
// //           return {
// //             ...item,
// //             selectedItemId,
// //             itemType,
// //             rejectionReason,
// //           };
// //         })
// //       );
  
// //       const auth = getAuth();
// //       const currentUser = auth.currentUser;
// //       const userEmail = currentUser.email;
  
// //       // Fetch the user name from Firestore
// //       let userName = "Unknown";
// //       try {
// //         const userQuery = query(collection(db, "accounts"), where("email", "==", userEmail));
// //         const userSnapshot = await getDocs(userQuery);
  
// //         if (!userSnapshot.empty) {
// //           const userDoc = userSnapshot.docs[0];
// //           const userData = userDoc.data();
// //           userName = userData.name || "Unknown";
// //         }

// //       } catch (error) {
       
// //       }
  
// //       const requestLogEntry = {
// //         accountId: selectedRequest.accountId || "N/A",
// //         userName: selectedRequest.userName || "N/A",
// //         room: selectedRequest.room || "N/A",
// //         course: selectedRequest.course || "N/A",
// //         courseDescription: selectedRequest.courseDescription || "N/A",
// //         dateRequired: selectedRequest.dateRequired || "N/A",
// //         timeFrom: selectedRequest.timeFrom || "N/A",
// //         timeTo: selectedRequest.timeTo || "N/A",
// //         timestamp: selectedRequest.timestamp || "N/A",
// //         rawTimestamp: new Date(),
// //         requestList: enrichedItems,
// //         status: "Approved",
// //         approvedBy: userName,
// //         reason: selectedRequest.reason || "No reason provided",
// //         program: selectedRequest.program,
// //       };
  
// //       const rejectLogEntry = {
// //         accountId: selectedRequest.accountId || "N/A",
// //         userName: selectedRequest.userName || "N/A",
// //         room: selectedRequest.room || "N/A",
// //         course: selectedRequest.course || "N/A",
// //         courseDescription: selectedRequest.courseDescription || "N/A",
// //         dateRequired: selectedRequest.dateRequired || "N/A",
// //         timeFrom: selectedRequest.timeFrom || "N/A",
// //         timeTo: selectedRequest.timeTo || "N/A",
// //         timestamp: selectedRequest.timestamp || "N/A",
// //         rawTimestamp: new Date(),
// //         requestList: rejectedItems,
// //         status: "Rejected",
// //         rejectedBy: userName,
// //         program: selectedRequest.program,
// //       };
  
// //       const logRequestOrReturn = async (
// //         userId,
// //         userName,
// //         action,
// //         requestDetails,
// //         extraInfo = {}
// //       ) => {
// //         await addDoc(collection(db, `accounts/${userId}/historylog`), {
// //           action,
// //           userName,
// //           timestamp: serverTimestamp(),
// //           requestList: requestDetails,
// //           ...extraInfo,
// //         });
// //       };
  

// //       if (enrichedItems.length > 0) {
// //         await addDoc(collection(db, "requestlog"), requestLogEntry);

// //         await logRequestOrReturn(
// //           selectedRequest.accountId,
// //           selectedRequest.userName,
// //           "Request Approved",
// //           enrichedItems,
// //           {
// //             approvedBy: userName,
// //             course: selectedRequest.course || "N/A",
// //             courseDescription: selectedRequest.courseDescription || "N/A",
// //             dateRequired: selectedRequest.dateRequired,
// //             reason: selectedRequest.reason,
// //             room: selectedRequest.room,
// //             program: selectedRequest.program,
// //             timeFrom: selectedRequest.timeFrom || "N/A",
// //             timeTo: selectedRequest.timeTo || "N/A",
// //             timestamp: selectedRequest.timestamp || "N/A",
// //             rawTimestamp: new Date(),
// //           }
// //         );
// //       }
  
// //       // Log rejected items
// //       if (rejectedItems.length > 0) {
// //         await logRequestOrReturn(
// //           selectedRequest.accountId,
// //           selectedRequest.userName,
// //           "Request Rejected",
// //           rejectedItems,
// //           {
// //             rejectedBy: userName,
// //             course: selectedRequest.course || "N/A",
// //             courseDescription: selectedRequest.courseDescription || "N/A",
// //             dateRequired: selectedRequest.dateRequired,
// //             reason: rejectionReason || "No reason provided",
// //             room: selectedRequest.room,
// //             program: selectedRequest.program,
// //             timeFrom: selectedRequest.timeFrom || "N/A",
// //             timeTo: selectedRequest.timeTo || "N/A",
// //             timestamp: selectedRequest.timestamp || "N/A",
// //             rawTimestamp: new Date(),
// //           }
// //         );
// //       }

   
   
// // try {
// //         for (const item of enrichedItems) {
// //           const inventoryId = item.selectedItemId;
// //           const requestedQty = Number(item.quantity);
// //           const labRoomId = item.labRoom;

// //           if (!inventoryId || isNaN(requestedQty) || requestedQty <= 0) {
           
// //             continue;
// //           }

// //           if (!labRoomId) {
           
// //             continue;
// //           }

// //           const inventoryRef = doc(db, "inventory", inventoryId);
// //           const inventorySnap = await getDoc(inventoryRef);
// //           if (!inventorySnap.exists()) {
           
// //             continue;
// //           }

// //           const data = inventorySnap.data();
// //           const currentQty = Number(data.quantity || 0);
// //           const newQty = Math.max(currentQty - requestedQty, 0);
// //           await updateDoc(inventoryRef, { quantity: newQty });

// //           // Log item usage
// //           await addDoc(collection(db, "itemUsage"), {
// //             itemId: data.itemId, // Make sure this is correct
// //             usedQuantity: requestedQty, // How much was used
// //             timestamp: serverTimestamp(), // So it's traceable over time
// //           });

      

// //           // ⚙️ Update inventory condition breakdown
// //           let remaining = requestedQty;
// //           const good = data.condition?.Good ?? 0;
// //           const damage = data.condition?.Damage ?? 0;
// //           const defect = data.condition?.Defect ?? 0;
// //           const lost = data.condition?.Lost ?? 0;

// //           let newGood = good;
// //           let newDamage = damage;
// //           let newDefect = defect;
// //           let newLost = lost;

// //           if (remaining > 0) {
// //             const deductFromGood = Math.min(newGood, remaining);
// //             newGood -= deductFromGood;
// //             remaining -= deductFromGood;
// //           }

// //           if (remaining > 0) {
// //             const deductFromDamage = Math.min(newDamage, remaining);
// //             newDamage -= deductFromDamage;
// //             remaining -= deductFromDamage;
// //           }

// //           if (remaining > 0) {
// //             const deductFromDefect = Math.min(newDefect, remaining);
// //             newDefect -= deductFromDefect;
// //             remaining -= deductFromDefect;
// //           }

// //           if (remaining > 0) {
// //             const deductFromLost = Math.min(newLost, remaining);
// //             newLost -= deductFromLost;
// //             remaining -= deductFromLost;
// //           }

// //           await updateDoc(inventoryRef, {
// //             'condition.Good': newGood,
// //             'condition.Damage': newDamage,
// //             'condition.Defect': newDefect,
// //             'condition.Lost' : newLost,
// //           });
          
// //           // 🔁 Update labRoom item quantity
// //           const roomNumber = item.labRoom; // e.g. "0930"
// //           const labRoomCollectionRef = collection(db, "labRoom");
// //           const q = query(labRoomCollectionRef, where("roomNumber", "==", roomNumber));
// //           const querySnapshot = await getDocs(q);

// //           if (querySnapshot.empty) {
          
// //             return;
// //           }

// //           // 2. Get Firestore doc ID of the labRoom
// //           const labRoomDoc = querySnapshot.docs[0];
// //           const labRoomDocId = labRoomDoc.id;

// //           // 3. Query items subcollection for item with matching itemId
// //           const itemId = data.itemId; // e.g. "DENT02"
// //           const itemsCollectionRef = collection(db, "labRoom", labRoomDocId, "items");
// //           const itemQuery = query(itemsCollectionRef, where("itemId", "==", itemId));
// //           const itemSnapshot = await getDocs(itemQuery);

// //           if (itemSnapshot.empty) {
           
// //             return;
// //           }

// //           // 4. Get the Firestore doc ID of the item document
// //           const itemDoc = itemSnapshot.docs[0];
// //           const itemDocId = itemDoc.id;
// //           const labRoomItemRef = doc(db, "labRoom", labRoomDocId, "items", itemDocId);
// //           const labData = itemDoc.data();

// //           const currentLabQty = Number(labData.quantity || 0);
// //           const newLabQty = Math.max(currentLabQty - requestedQty, 0);
// //           await updateDoc(labRoomItemRef, { quantity: newLabQty });
         

// //           // Update condition breakdown
// //           let labGood = labData.condition?.Good ?? 0;
// //           let labDamage = labData.condition?.Damage ?? 0;
// //           let labDefect = labData.condition?.Defect ?? 0;
// //           let labLost = labData.condition?.Lost ?? 0;

// //           let remainingLab = requestedQty;

// //           if (remainingLab > 0) {
// //             const deductFromLabGood = Math.min(labGood, remainingLab);
// //             labGood -= deductFromLabGood;
// //             remainingLab -= deductFromLabGood;
// //           }

// //           if (remainingLab > 0) {
// //             const deductFromLabDamage = Math.min(labDamage, remainingLab);
// //             labDamage -= deductFromLabDamage;
// //             remainingLab -= deductFromLabDamage;
// //           }

// //           if (remainingLab > 0) {
// //             const deductFromLabDefect = Math.min(labDefect, remainingLab);
// //             labDefect -= deductFromLabDefect;
// //             remainingLab -= deductFromLabDefect;
// //           }

// //           if (remainingLab > 0) {
// //             const deductFromLabLost = Math.min(labLost, remainingLab);
// //             labLost -= deductFromLabLost;
// //             remainingLab -= deductFromLabLost;
// //           }

// //           await updateDoc(labRoomItemRef, {
// //             'condition.Good': labGood,
// //             'condition.Damage': labDamage,
// //             'condition.Defect': labDefect,
// //             'condition.Lost' : labLost,
// //           });

          
// //         }
        
// //       } catch (err) {
       
// //       }  

// //       // await addDoc(collection(db, "requestlog"), requestLogEntry);
  
// //       if (rejectedItems.length > 0) {
// //         await addDoc(collection(db, "requestlog"), rejectLogEntry);
// //       }
  
   
// //       // Process Borrow Catalog
// //       const fixedItems = enrichedItems.filter(item => item.itemType === "Fixed");
  
// //       if (fixedItems.length > 0) {
// //         const formattedItems = fixedItems.map(item => ({
// //           category: item.category || "N/A",
// //           condition: item.condition || "N/A",
// //           department: item.department || "N/A",
// //           itemName: item.itemName || "N/A",
// //           itemDetails: item.itemDetails || "N/A",
// //           itemId: item.itemIdFromInventory,
// //           quantity: item.quantity || "1",
// //           selectedItemId: item.selectedItemId || "N/A",
// //           status: item.status || "Available",
// //           program: item.program || "N/A",
// //           course: item.course || "N/A",
// //           courseDescription: item.courseDescription || "N/A",
// //           reason: item.reason || "No reason provided",
// //           labRoom: item.labRoom || "N/A",
// //           timeFrom: item.timeFrom || "N/A",
// //           timeTo: item.timeTo || "N/A",
// //           usageType: item.usageType || "N/A",
// //           scannedCount: 0,
// //         }));
  
// //         const borrowCatalogEntry = {
// //           accountId: selectedRequest.accountId || "N/A",
// //           userName: selectedRequest.userName || "N/A",
// //           room: selectedRequest.room || "N/A",
// //           course: selectedRequest.course || "N/A",
// //           courseDescription: selectedRequest.courseDescription || "N/A",
// //           dateRequired: selectedRequest.dateRequired || "N/A",
// //           timeFrom: selectedRequest.timeFrom || "N/A",
// //           timeTo: selectedRequest.timeTo || "N/A",
// //           timestamp: selectedRequest.timestamp || "N/A",
// //           rawTimestamp: new Date(),
// //           requestList: formattedItems,
// //           status: "Borrowed",
// //           approvedBy: userName,
// //           reason: selectedRequest.reason || "No reason provided",
// //           program: selectedRequest.program,
// //         };
  
// //         const userRequestLogEntry = {
// //           ...requestLogEntry,
// //           status: "Approved",
// //           approvedBy: userName,
// //           timestamp: selectedRequest.timestamp || "N/A",
// //           rawTimestamp: new Date(),
// //         };
  
// //         await addDoc(collection(db, "borrowcatalog"), borrowCatalogEntry);
  
// //         await addDoc(collection(db, "accounts", selectedRequest.accountId, "userrequestlog"), userRequestLogEntry);

// //         // ✅ Notify the user who submitted the request
// //         if (selectedRequest.accountId && selectedRequest.accountId !== "system") {
// //           await addDoc(collection(db, `accounts/${selectedRequest.accountId}/userNotifications`), {
// //             action: `Rejected request for ${selectedRequest.userName}`,
// //             requestId: selectedRequest.id,
// //             userName: selectedRequest.userName,
// //             read: false,
// //             timestamp: serverTimestamp(),
// //           });
// //         }
// //       }
  
// //       await deleteDoc(doc(db, "userrequests", selectedRequest.id));
  
// //       // Delete matching user request subcollection doc
// //       const subCollectionRef = collection(db, "accounts", selectedRequest.accountId, "userRequests");
// //       const subDocsSnap = await getDocs(subCollectionRef);
  
// //       subDocsSnap.forEach(async (docSnap) => {
// //         const data = docSnap.data();
// //         const match = (
// //           data.timestamp?.seconds === selectedRequest.timestamp?.seconds &&
// //           data.filteredMergedData?.[0]?.selectedItemId === selectedRequest.filteredMergedData?.[0]?.selectedItemId
// //         );
  
// //         if (match) {
      
// //           await deleteDoc(doc(db, "accounts", selectedRequest.accountId, "userRequests", docSnap.id));
// //         }
// //       });
  
// //       setApprovedRequests(prev => [...prev, requestLogEntry]);
// //       setRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
// //       setCheckedItems({});
// //       setIsModalVisible(false);
// //       setSelectedRequest(null);
// //       setIsFinalizeModalVisible(false)
  
// //       notification.success({
// //         message: "Request Processed",
// //         description: "Approval and rejection have been logged successfully.",
// //       });
  
// //     } catch (error) {
    
// //       notification.error({
// //         message: "Error",
// //         description: "Failed to process the request after rejection confirmation.",
// //       });
// //     }
// //   };

//   // FRONTEND
//   const handleRejectConfirm = async () => {  
//     setRejectLoading(true);
//     setIsMultiRejectModalVisible(false);
  
//     const { enrichedItems, uncheckedItems, selectedRequest } = pendingApprovalData;

//     // 🔄 Rebuild merged list using the latest quantity edits
//     const mergedRequestList = selectedRequest.requestList.map((item, index) => {
//       const editedItem = editableItems?.[index]; // Use index as key
//       return editedItem ? { ...item, quantity: editedItem.quantity } : item;
//     });

//     try {
//       const accountRef = doc(db, "accounts", selectedRequest.accountId);
//       const accountSnap = await getDoc(accountRef);

//       if (accountSnap.exists()) {
//         const accountData = accountSnap.data();
//         const isDisabled = accountData.disabled || false; // Adjust field name if different

//         if (isDisabled) {
//           setNotificationMessage("Cannot approve: The user's account is disabled.");
//           setIsNotificationVisible(true);
//           setRejectLoading(false);
//           return;
//         }
        
//       } else {
      
//       }

//     } catch (error) {
     
//       setNotificationMessage("Error verifying account status. Please try again.");
//       setIsNotificationVisible(true);
//       setRejectLoading(false);
//       return;
//     }

//     // 🔍 Check inventory quantities before approval
//     const approvedItems = mergedRequestList.filter((item, index) => {
//       const key = `${selectedRequest.id}-${index}`;
//       return checkedItems[key]; // Only items the user selected
//     });

//     const insufficientItems = [];
    
//     for (const item of approvedItems) {
//       const inventoryId = item.selectedItemId;
//       const requestedQty = Number(item.quantity);
      
//       if (!inventoryId || isNaN(requestedQty) || requestedQty <= 0) {
//         continue;
//       }

//       try {
//         const inventoryRef = doc(db, "inventory", inventoryId);
//         const inventorySnap = await getDoc(inventoryRef);
        
//         if (!inventorySnap.exists()) {
//           insufficientItems.push({
//             itemName: item.itemName || "Unknown Item",
//             requested: requestedQty,
//             available: 0,
//             reason: "Item not found in inventory"
//           });
//           continue;
//         }

//         const data = inventorySnap.data();
//         const availableQty = Number(data.quantity || 0);
        
//         if (availableQty < requestedQty) {
//           insufficientItems.push({
//             itemName: item.itemName || data.itemName || "Unknown Item",
//             requested: requestedQty,
//             available: availableQty,
//             reason: "Insufficient quantity"
//           });
//         }
//       } catch (error) {
//         console.error("Error checking inventory for item:", item.itemName, error);
//         insufficientItems.push({
//           itemName: item.itemName || "Unknown Item",
//           requested: requestedQty,
//           available: 0,
//           reason: "Error checking inventory"
//         });
//       }
//     }

//     // If there are insufficient items, show error and prevent approval
//     if (insufficientItems.length > 0) {
//       const errorMessage = insufficientItems.map(item => 
//         `${item.itemName}: Requested ${item.requested}, Available ${item.available} (${item.reason})`
//       ).join('\n');
      
//       setNotificationMessage(`Cannot approve request. Insufficient inventory:\n${errorMessage}`);
//       setIsNotificationVisible(true);
//       setRejectLoading(false);
//       setApproveLoading(false);
//       return;
//     }
  
//     try {
//       const rejectedItems = await Promise.all(
//         uncheckedItems.map(async (item, index) => {
//           const selectedItemId = item.selectedItemId || item.selectedItem?.value;
//           let itemType = "Unknown";
      
//           if (selectedItemId) {
//             try {
//               const inventoryDoc = await getDoc(doc(db, "inventory", selectedItemId));
//               if (inventoryDoc.exists()) {
//                 itemType = inventoryDoc.data().type || "Unknown";
//               }
//             } catch (err) {
            
//             }
//           }
      
//           const itemKey = `${selectedItemId}-${index}`;
//           const rejectionReason = rejectionReasons[itemKey] || "No reason provided";
      
//           return {
//             ...item,
//             selectedItemId,
//             itemType,
//             rejectionReason,
//           };
//         })
//       );

//       // const auth = getAuth();
//       // const currentUser = auth.currentUser;
//       // const userEmail = currentUser.email;
  
//       // // Fetch the user name from Firestore
//       // let userName = "Unknown";
//       // try {
//       //   const userQuery = query(collection(db, "accounts"), where("email", "==", userEmail));
//       //   const userSnapshot = await getDocs(userQuery);
  
//       //   if (!userSnapshot.empty) {
//       //     const userDoc = userSnapshot.docs[0];
//       //     const userData = userDoc.data();
//       //     userName = userData.name || "Unknown";
//       //   }

//       // } catch (error) {
       
//       // }

//       // Get user info from localStorage (since we're using backend authentication)
//       const userEmail = localStorage.getItem("userEmail");
//       const userName = localStorage.getItem("userName") || "Unknown";

//       // If userName is not available in localStorage, try to fetch from Firestore
//       if (!userName || userName === "Unknown") {
//         try {
//           const userQuery = query(collection(db, "accounts"), where("email", "==", userEmail));
//           const userSnapshot = await getDocs(userQuery);

//           if (!userSnapshot.empty) {
//             const userDoc = userSnapshot.docs[0];
//             const userData = userDoc.data();
//             const fetchedUserName = userData.name || "Unknown";
//             // Update localStorage with the fetched name
//             localStorage.setItem("userName", fetchedUserName);
//           }

//         } catch (error) {
//           console.error("Error fetching user name from Firestore:", error);
//         }
//       }

//       // const approvedItems = mergedRequestList.filter((item, index) => {
//       //   const key = `${selectedRequest.id}-${index}`;
//       //   return checkedItems[key]; // Only items the user selected
//       // });
//     const approvedItemsWithType = await Promise.all(
//       approvedItems.map(async (item, index) => {
//         let itemType = "Unknown";
//         if (item.selectedItemId) {
//           try {
//             const inventoryDoc = await getDoc(doc(db, "inventory", item.selectedItemId));
//             if (inventoryDoc.exists()) {
//               itemType = inventoryDoc.data().type || "Unknown";
//             }
//           } catch (error) {
//             console.error("Error fetching item type for approved item", error);
//           }
//         }

//         return {
//           ...item,
//           itemType,
//         };
//       })
//     );

//       const requestLogEntry = {
//         accountId: selectedRequest.accountId || "N/A",
//         userName: selectedRequest.userName || "N/A",
//         room: selectedRequest.room || "N/A",
//         course: selectedRequest.course || "N/A",
//         courseDescription: selectedRequest.courseDescription || "N/A",
//         dateRequired: selectedRequest.dateRequired || "N/A",
//         timeFrom: selectedRequest.timeFrom || "N/A",
//         timeTo: selectedRequest.timeTo || "N/A",
//         timestamp: selectedRequest.timestamp || "N/A",
//         rawTimestamp: new Date(),
//         // requestList: enrichedItems,
//         requestList: approvedItems,
//         status: "Approved",
//         approvedBy: userName,
//         reason: selectedRequest.reason || "No reason provided",
//         program: selectedRequest.program,
//         usageType: selectedRequest.usageType || "N/A",  
//       };
  
//       const rejectLogEntry = {
//         accountId: selectedRequest.accountId || "N/A",
//         userName: selectedRequest.userName || "N/A",
//         room: selectedRequest.room || "N/A",
//         course: selectedRequest.course || "N/A",
//         courseDescription: selectedRequest.courseDescription || "N/A",
//         dateRequired: selectedRequest.dateRequired || "N/A",
//         timeFrom: selectedRequest.timeFrom || "N/A",
//         timeTo: selectedRequest.timeTo || "N/A",
//         timestamp: selectedRequest.timestamp || "N/A",
//         rawTimestamp: new Date(),
//         requestList: rejectedItems,
//         status: "Rejected",
//         rejectedBy: userName,
//         program: selectedRequest.program,
//         usageType: selectedRequest.usageType || "N/A",  
//         reason: selectedRequest.reason || "No reason provided",
//       };
  
//       const logRequestOrReturn = async (
//         userId,
//         userName,
//         action,
//         requestDetails,
//         extraInfo = {}
//       ) => {
//         await addDoc(collection(db, `accounts/${userId}/historylog`), {
//           action,
//           userName,
//           timestamp: serverTimestamp(),
//           requestList: requestDetails,
//           ...extraInfo,
//         });
//       };
  

//       if (enrichedItems.length > 0) {
//         await addDoc(collection(db, "requestlog"), requestLogEntry);

//         await logRequestOrReturn(
//           selectedRequest.accountId,
//           selectedRequest.userName,
//           "Request Approved",
//           // enrichedItems,
//           approvedItems,
//           {
//             approvedBy: userName,
//             course: selectedRequest.course || "N/A",
//             courseDescription: selectedRequest.courseDescription || "N/A",
//             dateRequired: selectedRequest.dateRequired,
//             reason: selectedRequest.reason,
//             room: selectedRequest.room,
//             program: selectedRequest.program,
//             timeFrom: selectedRequest.timeFrom || "N/A",
//             timeTo: selectedRequest.timeTo || "N/A",
//             timestamp: selectedRequest.timestamp || "N/A",
//             rawTimestamp: new Date(),
//             usageType: selectedRequest.usageType || "N/A",  
//           }
//         );
//       }
  
//       // Log rejected items
//       if (rejectedItems.length > 0) {
//         await logRequestOrReturn(
//           selectedRequest.accountId,
//           selectedRequest.userName,
//           "Request Rejected",
//           rejectedItems,
//           {
//             rejectedBy: userName,
//             course: selectedRequest.course || "N/A",
//             courseDescription: selectedRequest.courseDescription || "N/A",
//             dateRequired: selectedRequest.dateRequired,
//             reason: rejectionReason || "No reason provided",
//             room: selectedRequest.room,
//             program: selectedRequest.program,
//             timeFrom: selectedRequest.timeFrom || "N/A",
//             timeTo: selectedRequest.timeTo || "N/A",
//             timestamp: selectedRequest.timestamp || "N/A",
//             rawTimestamp: new Date(),
//             usageType: selectedRequest.usageType || "N/A",  
//           }
//         );
//       }
   
// try {
//         for (const item of approvedItems) {
//           const inventoryId = item.selectedItemId;
//           const requestedQty = Number(item.quantity);
//           const labRoomId = item.labRoom;

//           if (!inventoryId || isNaN(requestedQty) || requestedQty <= 0) {
           
//             continue;
//           }

//           if (!labRoomId) {
           
//             continue;
//           }

//           const inventoryRef = doc(db, "inventory", inventoryId);
//           const inventorySnap = await getDoc(inventoryRef);
//           if (!inventorySnap.exists()) {
           
//             continue;
//           }

//           const data = inventorySnap.data();
//           const currentQty = Number(data.quantity || 0);
//           const newQty = Math.max(currentQty - requestedQty, 0);
//           await updateDoc(inventoryRef, { quantity: newQty });

//           // Log item usage
//           await addDoc(collection(db, "itemUsage"), {
//             itemId: data.itemId, // Make sure this is correct
//             usedQuantity: requestedQty, // How much was used
//             timestamp: serverTimestamp(), // So it's traceable over time
//           });

      

//           // ⚙️ Update inventory condition breakdown
//           let remaining = requestedQty;
//           const good = data.condition?.Good ?? 0;
//           const damage = data.condition?.Damage ?? 0;
//           const defect = data.condition?.Defect ?? 0;
//           const lost = data.condition?.Lost ?? 0;

//           let newGood = good;
//           let newDamage = damage;
//           let newDefect = defect;
//           let newLost = lost;

//           if (remaining > 0) {
//             const deductFromGood = Math.min(newGood, remaining);
//             newGood -= deductFromGood;
//             remaining -= deductFromGood;
//           }

//           if (remaining > 0) {
//             const deductFromDamage = Math.min(newDamage, remaining);
//             newDamage -= deductFromDamage;
//             remaining -= deductFromDamage;
//           }

//           if (remaining > 0) {
//             const deductFromDefect = Math.min(newDefect, remaining);
//             newDefect -= deductFromDefect;
//             remaining -= deductFromDefect;
//           }

//           if (remaining > 0) {
//             const deductFromLost = Math.min(newLost, remaining);
//             newLost -= deductFromLost;
//             remaining -= deductFromLost;
//           }

//           await updateDoc(inventoryRef, {
//             'condition.Good': newGood,
//             'condition.Damage': newDamage,
//             'condition.Defect': newDefect,
//             'condition.Lost' : newLost,
//           });
          
//           // 🔁 Update labRoom item quantity
//           const roomNumber = item.labRoom; // e.g. "0930"
//           const labRoomCollectionRef = collection(db, "labRoom");
//           const q = query(labRoomCollectionRef, where("roomNumber", "==", roomNumber));
//           const querySnapshot = await getDocs(q);

//           if (querySnapshot.empty) {
          
//             return;
//           }

//           // 2. Get Firestore doc ID of the labRoom
//           const labRoomDoc = querySnapshot.docs[0];
//           const labRoomDocId = labRoomDoc.id;

//           // 3. Query items subcollection for item with matching itemId
//           const itemId = data.itemId; // e.g. "DENT02"
//           const itemsCollectionRef = collection(db, "labRoom", labRoomDocId, "items");
//           const itemQuery = query(itemsCollectionRef, where("itemId", "==", itemId));
//           const itemSnapshot = await getDocs(itemQuery);

//           if (itemSnapshot.empty) {
           
//             return;
//           }

//           // 4. Get the Firestore doc ID of the item document
//           const itemDoc = itemSnapshot.docs[0];
//           const itemDocId = itemDoc.id;
//           const labRoomItemRef = doc(db, "labRoom", labRoomDocId, "items", itemDocId);
//           const labData = itemDoc.data();

//           const currentLabQty = Number(labData.quantity || 0);
//           const newLabQty = Math.max(currentLabQty - requestedQty, 0);
//           await updateDoc(labRoomItemRef, { quantity: newLabQty });
         

//           // Update condition breakdown
//           let labGood = labData.condition?.Good ?? 0;
//           let labDamage = labData.condition?.Damage ?? 0;
//           let labDefect = labData.condition?.Defect ?? 0;
//           let labLost = labData.condition?.Lost ?? 0;

//           let remainingLab = requestedQty;

//           if (remainingLab > 0) {
//             const deductFromLabGood = Math.min(labGood, remainingLab);
//             labGood -= deductFromLabGood;
//             remainingLab -= deductFromLabGood;
//           }

//           if (remainingLab > 0) {
//             const deductFromLabDamage = Math.min(labDamage, remainingLab);
//             labDamage -= deductFromLabDamage;
//             remainingLab -= deductFromLabDamage;
//           }

//           if (remainingLab > 0) {
//             const deductFromLabDefect = Math.min(labDefect, remainingLab);
//             labDefect -= deductFromLabDefect;
//             remainingLab -= deductFromLabDefect;
//           }

//           if (remainingLab > 0) {
//             const deductFromLabLost = Math.min(labLost, remainingLab);
//             labLost -= deductFromLabLost;
//             remainingLab -= deductFromLabLost;
//           }

//           await updateDoc(labRoomItemRef, {
//             'condition.Good': labGood,
//             'condition.Damage': labDamage,
//             'condition.Defect': labDefect,
//             'condition.Lost' : labLost,
//           });

          
//         }
        
//       } catch (err) {
       
//       }  

//       // await addDoc(collection(db, "requestlog"), requestLogEntry);
  
//       if (rejectedItems.length > 0) {
//         await addDoc(collection(db, "requestlog"), rejectLogEntry);
//       }
  
   
//       // Process Borrow Catalog
//       const fixedItems = approvedItemsWithType.filter(item => item.itemType === "Fixed");

//       console.log("ApprovedItemsWithType:", approvedItemsWithType);
//       console.log("FixedItems to save to borrowcatalog:", fixedItems);
  
//       if (fixedItems.length > 0) {
//         const formattedItems = fixedItems.map(item => ({
//           category: item.category || "N/A",
//           condition: item.condition || "N/A",
//           department: item.department || "N/A",
//           itemName: item.itemName || "N/A",
//           itemDetails: item.itemDetails || "N/A",
//           itemId: item.itemIdFromInventory,
//           quantity: item.quantity || "1",
//           selectedItemId: item.selectedItemId || "N/A",
//           status: item.status || "Available",
//           program: item.program || "N/A",
//           course: item.course || "N/A",
//           courseDescription: item.courseDescription || "N/A",
//           reason: item.reason || "No reason provided",
//           labRoom: item.labRoom || "N/A",
//           timeFrom: item.timeFrom || "N/A",
//           timeTo: item.timeTo || "N/A",
//           usageType: item.usageType || "N/A",
//           scannedCount: 0,
//         }));
  
//         const borrowCatalogEntry = {
//           accountId: selectedRequest.accountId || "N/A",
//           userName: selectedRequest.userName || "N/A",
//           room: selectedRequest.room || "N/A",
//           course: selectedRequest.course || "N/A",
//           courseDescription: selectedRequest.courseDescription || "N/A",
//           dateRequired: selectedRequest.dateRequired || "N/A",
//           timeFrom: selectedRequest.timeFrom || "N/A",
//           timeTo: selectedRequest.timeTo || "N/A",
//           timestamp: selectedRequest.timestamp || "N/A",
//           rawTimestamp: new Date(),
//           requestList: formattedItems,
//           status: "Borrowed",
//           approvedBy: userName,
//           reason: selectedRequest.reason || "No reason provided",
//           program: selectedRequest.program,
//         };
  
//         const userRequestLogEntry = {
//           ...requestLogEntry,
//           status: "Approved",
//           approvedBy: userName,
//           timestamp: selectedRequest.timestamp || "N/A",
//           rawTimestamp: new Date(),
//         };
  
//         await addDoc(collection(db, "borrowcatalog"), borrowCatalogEntry);
  
//         await addDoc(collection(db, "accounts", selectedRequest.accountId, "userrequestlog"), userRequestLogEntry);

//         // ✅ Notify the user who submitted the request
//         if (selectedRequest.accountId && selectedRequest.accountId !== "system") {
//           await addDoc(collection(db, `accounts/${selectedRequest.accountId}/userNotifications`), {
//             action: `Rejected request for ${selectedRequest.userName}`,
//             requestId: selectedRequest.id,
//             userName: selectedRequest.userName,
//             read: false,
//             timestamp: serverTimestamp(),
//           });
//         }
    
//         // ✅ Send push to the user who submitted the request
//         try {
//           const functions = getFunctions();
//           const sendPush = httpsCallable(functions, "sendPushNotification");

//           const pushTokenSnapshot = await getDocs(collection(db, "pushTokens"));
//           const tokensToNotify = [];

//           pushTokenSnapshot.forEach((doc) => {
//             const data = doc.data();
//             if (
//               data?.expoPushToken &&
//               data.userId === selectedRequest.userId // 👈 This should match the request sender
//             ) {
//               tokensToNotify.push(data.expoPushToken);
//             }
//           });

//           for (const token of tokensToNotify) {
//             const payload = {
//               token,
//               title: "Request Update",
//               body: `Your requisition has been rejected.`, // or `rejected` if applicable
//             };

//             const response = await sendPush(payload);
//             console.log("✅ Push sent to user:", response.data);
//           }

//         } catch (err) {
//           console.error("❌ Push error (admin to user):", err.message || err);
//         }
//       }
  
//       await deleteDoc(doc(db, "userrequests", selectedRequest.id));
  
//       // Delete matching user request subcollection doc
//       const subCollectionRef = collection(db, "accounts", selectedRequest.accountId, "userRequests");
//       const subDocsSnap = await getDocs(subCollectionRef);
  
//       subDocsSnap.forEach(async (docSnap) => {
//         const data = docSnap.data();
//         const match = (
//           data.timestamp?.seconds === selectedRequest.timestamp?.seconds &&
//           data.filteredMergedData?.[0]?.selectedItemId === selectedRequest.filteredMergedData?.[0]?.selectedItemId
//         );
  
//         if (match) {
      
//           await deleteDoc(doc(db, "accounts", selectedRequest.accountId, "userRequests", docSnap.id));
//         }
//       });
  
//       setApprovedRequests(prev => [...prev, requestLogEntry]);
//       setRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
//       setCheckedItems({});
//       setIsModalVisible(false);
//       setSelectedRequest(null);
//       setIsFinalizeModalVisible(false)

//       setNotificationMessage("Approval and rejection have been logged successfully.");
//       setIsNotificationVisible(true);
  
//       notification.success({
//         message: "Request Processed",
//         description: "Approval and rejection have been logged successfully.",
//       });
  
//     } catch (error) {
    
//       notification.error({
//         message: "Error",
//         description: "Failed to process the request after rejection confirmation.",
//       });
//     } finally {
//       setRejectLoading(false);
//     }
//   };

// // BACKEND
//   // const handleRejectConfirm = async () => {
//   //   setIsMultiRejectModalVisible(false);

//   //   const { enrichedItems, uncheckedItems, selectedRequest } = pendingApprovalData;

//   //   // ⚠️ Check if account is disabled
//   //   try {
//   //     const accountRef = doc(db, "accounts", selectedRequest.accountId);
//   //     const accountSnap = await getDoc(accountRef);
//   //     if (accountSnap.exists() && accountSnap.data().disabled) {
//   //       setNotificationMessage("Cannot approve: The user's account is disabled.");
//   //       setIsNotificationVisible(true);
//   //       return;
//   //     }
//   //   } catch (error) {
//   //     setNotificationMessage("Error verifying account status. Please try again.");
//   //     setIsNotificationVisible(true);
//   //     return;
//   //   }

//   //   // 🔍 Prepare rejected items
//   //   const rejectedItems = await Promise.all(
//   //     uncheckedItems.map(async (item, index) => {
//   //       const selectedItemId = item.selectedItemId || item.selectedItem?.value;
//   //       let itemType = "Unknown";
//   //       if (selectedItemId) {
//   //         try {
//   //           const snap = await getDoc(doc(db, "inventory", selectedItemId));
//   //           if (snap.exists()) itemType = snap.data().type || "Unknown";
//   //         } catch {}
//   //       }
//   //       const itemKey = `${selectedItemId}-${index}`;
//   //       const rejectionReason = rejectionReasons[itemKey] || "No reason provided";
//   //       return {
//   //         ...item,
//   //         selectedItemId,
//   //         itemType,
//   //         rejectionReason,
//   //       };
//   //     })
//   //   );

//   //   // 🧑‍💼 Get current user
//   //   const auth = getAuth();
//   //   const currentUser = auth.currentUser;
//   //   const userEmail = currentUser?.email;

//   //   let userName = "Unknown";
//   //   let userId = "system";

//   //   if (userEmail) {
//   //     try {
//   //       const q = query(collection(db, "accounts"), where("email", "==", userEmail));
//   //       const snap = await getDocs(q);
//   //       if (!snap.empty) {
//   //         const doc = snap.docs[0];
//   //         const userData = doc.data();
//   //         userName = userData.name || "Unknown";
//   //         userId = doc.id;
//   //       }
//   //     } catch {}
//   //   }

//   //   // 🌐 Call Express backend
//   //   try {
//   //     const response = await fetch("https://webnuls.onrender.com/request/multireject", {
//   //       method: "POST",
//   //       headers: { "Content-Type": "application/json" },
//   //       body: JSON.stringify({
//   //         selectedRequest,
//   //         enrichedItems,
//   //         rejectedItems,
//   //         rejectionReasons,
//   //         userName,
//   //         userId,
//   //       }),
//   //     });

//   //     const result = await response.json();

//   //     if (!response.ok) {
//   //       notification.error({
//   //         message: "Request Failed",
//   //         description: result.error || "Could not process the request.",
//   //       });
//   //       return;
//   //     }

//   //     // ✅ Success
//   //     setApprovedRequests(prev => [...prev, selectedRequest]);
//   //     setRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
//   //     setCheckedItems({});
//   //     setSelectedRequest(null);
//   //     setIsModalVisible(false);
//   //     setIsFinalizeModalVisible(false);

//   //     notification.success({
//   //       message: "Request Processed",
//   //       description: result.message || "Request has been processed successfully.",
//   //     });
//   //   } catch (error) {
//   //     console.error("Error calling /request/multireject:", error);
//   //     notification.error({
//   //       message: "Network Error",
//   //       description: "Failed to connect to server for multi-reject.",
//   //     });
//   //   }
//   // };
 
// // FRONTEND
// //   const handleApprove = async () => {  
// //   const isChecked = Object.values(checkedItems).some((checked) => checked);

// //   if (!isChecked) {
// //     setNotificationMessage("No Items selected");
// //     setIsNotificationVisible(true);
// //     return;
// //   }

// //   if (selectedRequest) {

// //     try {
// //       const accountRef = doc(db, "accounts", selectedRequest.accountId);
// //       const accountSnap = await getDoc(accountRef);

// //       if (accountSnap.exists()) {
// //         const accountData = accountSnap.data();
// //         const isDisabled = accountData.disabled || false; // Adjust field name if different

// //         if (isDisabled) {
// //           setNotificationMessage("Cannot approve: The user's account is disabled.");
// //           setIsNotificationVisible(true);
// //           return;
// //         }
        
// //       } else {
      
// //       }

// //     } catch (error) {
     
// //       setNotificationMessage("Error verifying account status. Please try again.");
// //       setIsNotificationVisible(true);
// //       return;
// //     }

// //     // Filter checked items and prepare for approval
// //     const filteredItems = selectedRequest.requestList.filter((item, index) => {
// //       const key = `${selectedRequest.id}-${index}`;
// //       return checkedItems[key];
// //     });

// //     if (filteredItems.length === 0) {
// //       setNotificationMessage("No Items selected");
// //       setIsNotificationVisible(true);
// //       return;
// //     }
    


// //     const enrichedItems = await Promise.all(
// //   filteredItems.map(async (item) => {
// //     const selectedItemId = item.selectedItemId || item.selectedItem?.value;
// //     let itemType = "Unknown";

// //     if (selectedItemId) {
// //       try {
// //         const inventoryDoc = await getDoc(doc(db, "inventory", selectedItemId));
// //         if (inventoryDoc.exists()) {
// //           itemType = inventoryDoc.data().type || "Unknown";
// //         }
// //       } catch (err) {
// //         console.error("Failed to fetch inventory item:", err);
// //       }
// //     }

// //     return {
// //       ...item,
// //       selectedItemId,
// //       itemType,
// //     };
// //   })
// // );
// //  for (const item of enrichedItems) {
// //   const requestedQty = item.quantity;
// //   const itemId = item.selectedItemId;
// //   const itemName = item.itemName

// //   console.log("📦 Logging itemUsage for:", itemId);

// //   try {
// //     // 1. Log the usage
// //     await addDoc(collection(db, "itemUsage"), {
// //       itemId: itemId,
// //       usedQuantity: requestedQty,
// //       timestamp: serverTimestamp(),
// //       itemName:itemName
// //     });

// //     // 2. Fetch all past usage logs
// //     const usageQuery = query(
// //       collection(db, "itemUsage"),
// //       where("itemId", "==", itemId)
// //     );
// //     const usageSnap = await getDocs(usageQuery);

// //     let total = 0;
// //     const uniqueDates = new Set();

// //     usageSnap.forEach((doc) => {
// //       const data = doc.data();
// //       if (data.usedQuantity && data.timestamp?.toDate) {
// //         total += data.usedQuantity;
// //         const dateStr = data.timestamp.toDate().toISOString().split("T")[0];
// //         uniqueDates.add(dateStr);
// //       }
// //     });

// //     const daysWithUsage = uniqueDates.size;
// //     const average = daysWithUsage > 0 ? total / daysWithUsage : 0;

// //     // 🔄 Assumed buffer of 5 days for critical stock level
// //     const bufferDays = 7;
// //     const criticalLevel = average * bufferDays;

// //     // 3. Update inventory with new average and critical level
// //     const itemRef = doc(db, "inventory", itemId);
// //     await updateDoc(itemRef, {
// //       averageDailyUsage: average,
// //       criticalLevel: criticalLevel,
// //     });

// //     console.log(`✅ Updated ${itemId}: AvgDaily = ${average}, Critical = ${criticalLevel}`);
// //   } catch (e) {
// //     console.error(`❌ Error processing usage for ${itemId}:`, e);
// //   }
// // }
// //     // Filter out unchecked items (for rejection)
// //     const uncheckedItems = selectedRequest.requestList.filter((item, index) => {
// //       const key = `${selectedRequest.id}-${index}`;
// //       return !checkedItems[key]; // This will get the unchecked items
// //     });

// //     // Define rejectionReason variable outside of the condition
// //     let rejectionReason = null;


// //     if (uncheckedItems.length > 0) {
     
// //       setPendingApprovalData({
// //         enrichedItems,
// //         uncheckedItems,
// //         selectedRequest,
// //       });
// //       setIsMultiRejectModalVisible(true); // ✅ Show new modal for multiple items
// //       return;
// //     }

// //     // Process rejected items
// //     const rejectedItems = await Promise.all(
// //       uncheckedItems.map(async (item) => {
// //         const selectedItemId = item.selectedItemId || item.selectedItem?.value;
// //         let itemType = "Unknown";

// //         if (selectedItemId) {
// //           try {
// //             const inventoryDoc = await getDoc(doc(db, "inventory", selectedItemId));
// //             if (inventoryDoc.exists()) {
// //               itemType = inventoryDoc.data().type || "Unknown";
// //             }

// //           } catch (err) {
        
// //           }
// //         }

// //         return {
// //           ...item,
// //           selectedItemId,
// //           itemType, 
// //           volume: item.volume ?? "N/A", // <-- add this
// //         };
// //       })
// //     );

// //     const auth = getAuth();
// //     const currentUser = auth.currentUser;
// //     const userEmail = currentUser.email;

// //     // Fetch the user name from Firestore
// //     let userName = "Unknown";
// //     try {
// //       const userQuery = query(collection(db, "accounts"), where("email", "==", userEmail));
// //       const userSnapshot = await getDocs(userQuery);

// //       if (!userSnapshot.empty) {
// //         const userDoc = userSnapshot.docs[0];
// //         const userData = userDoc.data();
// //         userName = userData.name || "Unknown";
// //       }

// //     } catch (error) {

// //     }

// //     const requestLogEntry = {
// //       accountId: selectedRequest.accountId || "N/A",
// //       userName: selectedRequest.userName || "N/A",
// //       room: selectedRequest.room || "N/A",
// //       course: selectedRequest.course || "N/A",
// //       courseDescription: selectedRequest.courseDescription || "N/A",
// //       dateRequired: selectedRequest.dateRequired || "N/A",
// //       timeFrom: selectedRequest.timeFrom || "N/A",  
// //       timeTo: selectedRequest.timeTo || "N/A",  
// //       timestamp: selectedRequest.timestamp || "N/A",
// //       rawTimestamp: new Date(),
// //       requestList: enrichedItems, 
// //       status: "Approved", 
// //       approvedBy: userName, 
// //       reason: selectedRequest.reason || "No reason provided",
// //       program: selectedRequest.program,
// //     };

// //     const rejectLogEntry = {
// //       accountId: selectedRequest.accountId || "N/A",
// //       userName: selectedRequest.userName || "N/A",
// //       room: selectedRequest.room || "N/A",
// //       course: selectedRequest.couse || "N/A",
// //       courseDescription: selectedRequest.courseDescription || "N/A",
// //       dateRequired: selectedRequest.dateRequired || "N/A",
// //       timeFrom: selectedRequest.timeFrom || "N/A",  
// //       timeTo: selectedRequest.timeTo || "N/A",  
// //       timestamp: selectedRequest.timestamp || "N/A",
// //       rawTimestamp: new Date(),
// //       requestList: rejectedItems, 
// //       status: "Rejected", 
// //       rejectedBy: userName, 
// //       reason: rejectionReason || "No reason provided",  // Use the rejection reason from the input prompt
// //       program: selectedRequest.program,
// //     };

// //     // Log approved items in historylog subcollection
// //     const logRequestOrReturn = async (
// //       userId,
// //       userName,
// //       action,
// //       requestDetails,
// //       extraInfo = {} // for fields like dateRequired, approvedBy, etc.
// //     ) => {
// //       await addDoc(collection(db, `accounts/${userId}/historylog`), {
// //         action,
// //         userName,
// //         timestamp: serverTimestamp(),
// //         requestList: requestDetails,
// //         ...extraInfo, // merge additional data like dateRequired, reason, etc.
// //       });
// //     };

// //     // Log approved items
// //     await logRequestOrReturn(
// //       selectedRequest.accountId,     // user ID
// //       selectedRequest.userName,      // user name
// //       "Request Approved",            // action
// //       enrichedItems,                 // request list
// //       {
// //         approvedBy: userName, // whoever approved
// //         course: selectedRequest.course || "N/A",
// //         courseDescription: selectedRequest.courseDescription || "N/A",
// //         dateRequired: selectedRequest.dateRequired,
// //         reason: selectedRequest.reason,
// //         room: selectedRequest.room,
// //         program: selectedRequest.program,
// //         timeFrom: selectedRequest.timeFrom || "N/A",  // Include timeFrom
// //         timeTo: selectedRequest.timeTo || "N/A",  
// //         timestamp: selectedRequest.timestamp || "N/A",
// //         rawTimestamp: new Date(),
// //       }
// //     );

// //     // Log rejected items
// //     if (rejectedItems.length > 0) {
// //       await logRequestOrReturn(
// //         selectedRequest.accountId,     // user ID
// //         selectedRequest.userName,      // user name
// //         "Request Rejected",            // action
// //         rejectedItems,                 // request list
// //         {
// //           rejectedBy: userName, // whoever rejected
// //           course: selectedRequest.course || "N/A",
// //           courseDescription: selectedRequest.courseDescription || "N/A",
// //           dateRequired: selectedRequest.dateRequired,
// //           reason: rejectionReason || "No reason provided",  // Reason for rejection
// //           room: selectedRequest.room,
// //           program: selectedRequest.program,
// //           timeFrom: selectedRequest.timeFrom || "N/A",  // Include timeFrom
// //           timeTo: selectedRequest.timeTo || "N/A",  
// //           timestamp: selectedRequest.timestamp || "N/A",
// //           rawTimestamp: new Date(),
// //         }
// //       );
// //     }


// // try {
// //         for (const item of enrichedItems) {
// //           const inventoryId = item.selectedItemId;
// //           const requestedQty = Number(item.quantity);
// //           const labRoomId = item.labRoom;

// //           if (!inventoryId || isNaN(requestedQty) || requestedQty <= 0) {
        
// //             continue;
// //           }

// //           if (!labRoomId) {

// //             continue;
// //           }

// //           const inventoryRef = doc(db, "inventory", inventoryId);
// //           const inventorySnap = await getDoc(inventoryRef);
// //           if (!inventorySnap.exists()) {
      
// //             continue;
// //           }

// //           const data = inventorySnap.data();
// //           const currentQty = Number(data.quantity || 0);
// //           const newQty = Math.max(currentQty - requestedQty, 0);
// //           await updateDoc(inventoryRef, { quantity: newQty });
        

// //           // ⚙️ Update inventory condition breakdown
// //           let remaining = requestedQty;
// //           const good = data.condition?.Good ?? 0;
// //           const damage = data.condition?.Damage ?? 0;
// //           const defect = data.condition?.Defect ?? 0;
// //           const lost = data.condition?.Lost ?? 0;

// //           let newGood = good;
// //           let newDamage = damage;
// //           let newDefect = defect;
// //           let newLost = lost;

// //           if (remaining > 0) {
// //             const deductFromGood = Math.min(newGood, remaining);
// //             newGood -= deductFromGood;
// //             remaining -= deductFromGood;
// //           }

// //           if (remaining > 0) {
// //             const deductFromDamage = Math.min(newDamage, remaining);
// //             newDamage -= deductFromDamage;
// //             remaining -= deductFromDamage;
// //           }

// //           if (remaining > 0) {
// //             const deductFromDefect = Math.min(newDefect, remaining);
// //             newDefect -= deductFromDefect;
// //             remaining -= deductFromDefect;
// //           }

// //           if (remaining > 0) {
// //             const deductFromLost = Math.min(newLost, remaining);
// //             newLost -= deductFromLost;
// //             remaining -= deductFromLost;
// //           }

// //           await updateDoc(inventoryRef, {
// //             'condition.Good': newGood,
// //             'condition.Damage': newDamage,
// //             'condition.Defect': newDefect,
// //             'condition.Lost' : newLost,
// //           });

         
           

// //           // 🔁 Update labRoom item quantity
// //           const roomNumber = item.labRoom; // e.g. "0930"
// //           const labRoomCollectionRef = collection(db, "labRoom");
// //           const q = query(labRoomCollectionRef, where("roomNumber", "==", roomNumber));
// //           const querySnapshot = await getDocs(q);

// //           if (querySnapshot.empty) {
          

// //             return;
// //           }

// //           // 2. Get Firestore doc ID of the labRoom
// //           const labRoomDoc = querySnapshot.docs[0];
// //           const labRoomDocId = labRoomDoc.id;

// //           // 3. Query items subcollection for item with matching itemId
// //           const itemId = data.itemId; // e.g. "DENT02"
// //           const itemsCollectionRef = collection(db, "labRoom", labRoomDocId, "items");
// //           const itemQuery = query(itemsCollectionRef, where("itemId", "==", itemId));
// //           const itemSnapshot = await getDocs(itemQuery);

// //           if (itemSnapshot.empty) {
       
// //             return;
// //           }

// //           // 4. Get the Firestore doc ID of the item document
// //           const itemDoc = itemSnapshot.docs[0];
// //           const itemDocId = itemDoc.id;
// //           const labRoomItemRef = doc(db, "labRoom", labRoomDocId, "items", itemDocId);
// //           const labData = itemDoc.data();

// //           const currentLabQty = Number(labData.quantity || 0);
// //           const newLabQty = Math.max(currentLabQty - requestedQty, 0);
// //           await updateDoc(labRoomItemRef, { quantity: newLabQty });
         

// //           // Update condition breakdown
// //           let labGood = labData.condition?.Good ?? 0;
// //           let labDamage = labData.condition?.Damage ?? 0;
// //           let labDefect = labData.condition?.Defect ?? 0;
// //           let labLost = labData.condition?.Lost ?? 0;

// //           let remainingLab = requestedQty;

// //           if (remainingLab > 0) {
// //             const deductFromLabGood = Math.min(labGood, remainingLab);
// //             labGood -= deductFromLabGood;
// //             remainingLab -= deductFromLabGood;
// //           }

// //           if (remainingLab > 0) {
// //             const deductFromLabDamage = Math.min(labDamage, remainingLab);
// //             labDamage -= deductFromLabDamage;
// //             remainingLab -= deductFromLabDamage;
// //           }

// //           if (remainingLab > 0) {
// //             const deductFromLabDefect = Math.min(labDefect, remainingLab);
// //             labDefect -= deductFromLabDefect;
// //             remainingLab -= deductFromLabDefect;
// //           }

// //           if (remainingLab > 0) {
// //             const deductFromLabLost = Math.min(labLost, remainingLab);
// //             labLost -= deductFromLabLost;
// //             remainingLab -= deductFromLabLost;
// //           }

// //           await updateDoc(labRoomItemRef, {
// //             'condition.Good': labGood,
// //             'condition.Damage': labDamage,
// //             'condition.Defect': labDefect,
// //             'condition.Lost' : labLost,
// //           });

          
// //         }
        
// //       } catch (err) {

// //       }
    

// //     try {
// //       // Add to requestlog for approval
// //       await addDoc(collection(db, "requestlog"), requestLogEntry);

// //       // Add to requestlog for rejection
// //       if (rejectedItems.length > 0) {
// //         await addDoc(collection(db, "requestlog"), rejectLogEntry);
// //       }

// //       // Proceed with borrow catalog logic for approved items
// //       // Filter to get all "Fixed" items
// //       // Process Borrow Catalog
// //       const fixedItems = enrichedItems.filter(item => item.itemType === "Fixed");
  
// //       if (fixedItems.length > 0) {
// //         const formattedItems = fixedItems.map(item => ({
// //           category: item.category || "N/A",
// //           condition: item.condition || "N/A",
// //           department: item.department || "N/A",
// //           itemName: item.itemName || "N/A",
// //           itemDetails: item.itemDetails || "N/A",
// //           itemId: item.itemIdFromInventory,
// //           quantity: item.quantity || "1",
// //           selectedItemId: item.selectedItemId || "N/A",
// //           status: item.status || "Available",
// //           program: item.program || "N/A",
// //           course: item.course || "N/A",
// //           courseDescription: item.courseDescription || "N/A",
// //           reason: item.reason || "No reason provided",
// //           labRoom: item.labRoom || "N/A",
// //           timeFrom: item.timeFrom || "N/A",
// //           timeTo: item.timeTo || "N/A",
// //           usageType: item.usageType || "N/A",
// //           scannedCount: 0,
// //         }));
  
// //         const borrowCatalogEntry = {
// //           accountId: selectedRequest.accountId || "N/A",
// //           userName: selectedRequest.userName || "N/A",
// //           room: selectedRequest.room || "N/A",
// //           course: selectedRequest.course || "N/A",
// //           courseDescription: selectedRequest.courseDescription || "N/A",
// //           dateRequired: selectedRequest.dateRequired || "N/A",
// //           timeFrom: selectedRequest.timeFrom || "N/A",
// //           timeTo: selectedRequest.timeTo || "N/A",
// //           timestamp: selectedRequest.timestamp || "N/A",
// //           rawTimestamp: new Date(),
// //           requestList: formattedItems,
// //           status: "Borrowed",
// //           approvedBy: userName,
// //           reason: selectedRequest.reason || "No reason provided",
// //           program: selectedRequest.program,
// //         };
  
// //         const userRequestLogEntry = {
// //           ...requestLogEntry,
// //           status: "Approved",
// //           approvedBy: userName,
// //           timestamp: selectedRequest.timestamp || "N/A",
// //           rawTimestamp: new Date(),
// //         };
  
// //         await addDoc(collection(db, "borrowcatalog"), borrowCatalogEntry);
  
// //         await addDoc(collection(db, "accounts", selectedRequest.accountId, "userrequestlog"), userRequestLogEntry);

// //         // ✅ Notify the user who submitted the request
// //         if (selectedRequest.accountId && selectedRequest.accountId !== "system") {
// //           await addDoc(collection(db, `accounts/${selectedRequest.accountId}/userNotifications`), {
// //             action: `Approved request for ${selectedRequest.userName}`,
// //             requestId: selectedRequest.id,
// //             userName: selectedRequest.userName,
// //             read: false,
// //             timestamp: serverTimestamp(),
// //           });
// //         }

// //       }

// //         await deleteDoc(doc(db, "userrequests", selectedRequest.id));

// //         // Cleanup the user requests subcollection
// //         const subCollectionRef = collection(db, "accounts", selectedRequest.accountId, "userRequests");
// //         const subDocsSnap = await getDocs(subCollectionRef);

// //         subDocsSnap.forEach(async (docSnap) => {
// //           const data = docSnap.data();
// //           const match = (
// //             data.timestamp?.seconds === selectedRequest.timestamp?.seconds &&
// //             data.filteredMergedData?.[0]?.selectedItemId === selectedRequest.filteredMergedData?.[0]?.selectedItemId
// //           );

// //           if (match) {
       
// //             await deleteDoc(doc(db, "accounts", selectedRequest.accountId, "userRequests", docSnap.id));
// //           }
// //         });

// //         setApprovedRequests([...approvedRequests, requestLogEntry]);
// //         setRequests(requests.filter((req) => req.id !== selectedRequest.id));
// //         setCheckedItems({});
// //         setIsModalVisible(false);
// //         setSelectedRequest(null);
// //         setIsFinalizeModalVisible(false)

// //         notification.success({
// //           message: "Request Approved",
// //           description: "Request has been approved and logged.",
// //         });

// //       } catch (error) {
     
// //         notification.error({
// //           message: "Approval Failed",
// //           description: "There was an error logging the approved request.",
// //         });
// //       }
// //     }
// //   };

// // FRONTEND
//  const handleApprove = async () => {  
//   setApproveLoading(true);
  
//   const isChecked = Object.values(checkedItems).some((checked) => checked);

//   if (!isChecked) {
//     setNotificationMessage("No Items selected");
//     setIsNotificationVisible(true);
//     setApproveLoading(false);
//     return;
//   }

//   if (selectedRequest) {

//     try {
//       const accountRef = doc(db, "accounts", selectedRequest.accountId);
//       const accountSnap = await getDoc(accountRef);

//       if (accountSnap.exists()) {
//         const accountData = accountSnap.data();
//         const isDisabled = accountData.disabled || false; // Adjust field name if different

//         if (isDisabled) {
//           setNotificationMessage("Cannot approve: The user's account is disabled.");
//           setIsNotificationVisible(true);
//           return;
//         }
        
//       } else {
      
//       }

//     } catch (error) {
     
//       setNotificationMessage("Error verifying account status. Please try again.");
//       setIsNotificationVisible(true);
//       return;
//     }

//     // Use the updated quantity from editableItems if available
//     // const mergedRequestList = selectedRequest.requestList.map((item, index) => {
//     //   const editedItem = editableItems?.[index];
//     //   return editedItem ? { ...item, quantity: editedItem.quantity } : item;
//     // });

// const mergedRequestList = selectedRequest.requestList.map((item, index) => {
//   const key = `${selectedRequest.id}-${index}`;
//   const isChecked = checkedItems[key];
//   const editedItem = editableItems?.[index];

//   // Only update quantity for checked items
//   if (isChecked && editedItem?.quantity !== undefined) {
//     return { ...item, quantity: editedItem.quantity };
//   }

//   return item; // Leave unchecked items as original
// });

//     // Filter checked items and prepare for approval
//     // const filteredItems = selectedRequest.requestList.filter((item, index) => {
//     const filteredItems = mergedRequestList.filter((item, index) => {
//       const key = `${selectedRequest.id}-${index}`;
//       return checkedItems[key];
//     });

//     if (filteredItems.length === 0) {
//       setNotificationMessage("No Items selected");
//       setIsNotificationVisible(true);
//       return;
//     }

//     // 🔍 Check inventory quantities before approval
//     const insufficientItems = [];
    
//     for (const item of filteredItems) {
//       const inventoryId = item.selectedItemId;
//       const requestedQty = Number(item.quantity);
      
//       if (!inventoryId || isNaN(requestedQty) || requestedQty <= 0) {
//         continue;
//       }

//       try {
//         const inventoryRef = doc(db, "inventory", inventoryId);
//         const inventorySnap = await getDoc(inventoryRef);
        
//         if (!inventorySnap.exists()) {
//           insufficientItems.push({
//             itemName: item.itemName || "Unknown Item",
//             requested: requestedQty,
//             available: 0,
//             reason: "Item not found in inventory"
//           });
//           continue;
//         }

//         const data = inventorySnap.data();
//         const availableQty = Number(data.quantity || 0);
        
//         if (availableQty < requestedQty) {
//           insufficientItems.push({
//             itemName: item.itemName || data.itemName || "Unknown Item",
//             requested: requestedQty,
//             available: availableQty,
//             reason: "Insufficient quantity"
//           });
//         }
//       } catch (error) {
//         console.error("Error checking inventory for item:", item.itemName, error);
//         insufficientItems.push({
//           itemName: item.itemName || "Unknown Item",
//           requested: requestedQty,
//           available: 0,
//           reason: "Error checking inventory"
//         });
//       }
//     }

//     // If there are insufficient items, show error and prevent approval
//     if (insufficientItems.length > 0) {
//       const errorMessage = insufficientItems.map(item => 
//         `${item.itemName}: Requested ${item.requested}, Available ${item.available} (${item.reason})`
//       ).join('\n');
      
//       setNotificationMessage(`Cannot approve request. Insufficient inventory:\n${errorMessage}`);
//       setIsNotificationVisible(true);
//       return;
//     }

//     const enrichedItems = await Promise.all(
//     filteredItems.map(async (item) => {
//     const selectedItemId = item.selectedItemId || item.selectedItem?.value;
//     let itemType = "Unknown";

//     if (selectedItemId) {
//       try {
//         const inventoryDoc = await getDoc(doc(db, "inventory", selectedItemId));
//         if (inventoryDoc.exists()) {
//           itemType = inventoryDoc.data().type || "Unknown";
//         }
//       } catch (err) {
//         console.error("Failed to fetch inventory item:", err);
//       }
//     }

//     return {
//       ...item,
//       selectedItemId,
//       itemType,
//     };
//   })
// );

// console.log("Approved item quantities:", enrichedItems.map(i => `${i.itemName}: ${i.quantity}`));

//  for (const item of enrichedItems) {
//   const requestedQty = item.quantity;
//   const itemId = item.selectedItemId;
//   const itemName = item.itemName

//   console.log("📦 Logging itemUsage for:", itemId);

//   try {
//     // 1. Log the usage
//     await addDoc(collection(db, "itemUsage"), {
//       itemId: itemId,
//       usedQuantity: requestedQty,
//       timestamp: serverTimestamp(),
//       itemName:itemName
//     });

//     // 2. Fetch all past usage logs
//     const usageQuery = query(
//       collection(db, "itemUsage"),
//       where("itemId", "==", itemId)
//     );
//     const usageSnap = await getDocs(usageQuery);

//     let total = 0;
//     const uniqueDates = new Set();

//     usageSnap.forEach((doc) => {
//       const data = doc.data();
//       if (data.usedQuantity && data.timestamp?.toDate) {
//         total += data.usedQuantity;
//         const dateStr = data.timestamp.toDate().toISOString().split("T")[0];
//         uniqueDates.add(dateStr);
//       }
//     });

//     const daysWithUsage = uniqueDates.size;
//     const average = daysWithUsage > 0 ? total / daysWithUsage : 0;

//     // 🔄 Assumed buffer of 5 days for critical stock level
//     const bufferDays = 7;
//     const criticalLevel = average * bufferDays;

//     // 3. Update inventory with new average and critical level
//     const itemRef = doc(db, "inventory", itemId);
//     await updateDoc(itemRef, {
//       averageDailyUsage: average,
//       criticalLevel: criticalLevel,
//     });

//     console.log(`✅ Updated ${itemId}: AvgDaily = ${average}, Critical = ${criticalLevel}`);
//   } catch (e) {
//     console.error(`❌ Error processing usage for ${itemId}:`, e);
//   }
// }
//     // Filter out unchecked items (for rejection)
//     // const uncheckedItems = selectedRequest.requestList.filter((item, index) => {
//     const uncheckedItems = mergedRequestList.filter((item, index) => {
//       const key = `${selectedRequest.id}-${index}`;
//       return !checkedItems[key]; // This will get the unchecked items
//     });

//     // Define rejectionReason variable outside of the condition
//     let rejectionReason = null;


//     if (uncheckedItems.length > 0) {
     
//       setPendingApprovalData({
//         enrichedItems,
//         uncheckedItems,
//         selectedRequest,
//       });
//       setIsMultiRejectModalVisible(true); // ✅ Show new modal for multiple items
//       return;
//     }

//     // Process rejected items
//     const rejectedItems = await Promise.all(
//       uncheckedItems.map(async (item) => {
//         const selectedItemId = item.selectedItemId || item.selectedItem?.value;
//         let itemType = "Unknown";

//         if (selectedItemId) {
//           try {
//             const inventoryDoc = await getDoc(doc(db, "inventory", selectedItemId));
//             if (inventoryDoc.exists()) {
//               itemType = inventoryDoc.data().type || "Unknown";
//             }

//           } catch (err) {
        
//           }
//         }

//         return {
//           ...item,
//           selectedItemId,
//           itemType, 
//           volume: item.volume ?? "N/A", // <-- add this
//         };
//       })
//     );

//     // Get user info from localStorage (since we're using backend authentication)
//     const userEmail = localStorage.getItem("userEmail");
//     const userName = localStorage.getItem("userName") || "Unknown";

//     // If userName is not available in localStorage, try to fetch from Firestore
//     if (!userName || userName === "Unknown") {
//       try {
//         const userQuery = query(collection(db, "accounts"), where("email", "==", userEmail));
//         const userSnapshot = await getDocs(userQuery);

//         if (!userSnapshot.empty) {
//           const userDoc = userSnapshot.docs[0];
//           const userData = userDoc.data();
//           const fetchedUserName = userData.name || "Unknown";
//           // Update localStorage with the fetched name
//           localStorage.setItem("userName", fetchedUserName);
//         }

//       } catch (error) {
//         console.error("Error fetching user name from Firestore:", error);
//       }
//     }

//     const requestLogEntry = {
//       accountId: selectedRequest.accountId || "N/A",
//       userName: selectedRequest.userName || "N/A",
//       room: selectedRequest.room || "N/A",
//       course: selectedRequest.course || "N/A",
//       courseDescription: selectedRequest.courseDescription || "N/A",
//       dateRequired: selectedRequest.dateRequired || "N/A",
//       timeFrom: selectedRequest.timeFrom || "N/A",  
//       timeTo: selectedRequest.timeTo || "N/A",  
//       timestamp: selectedRequest.timestamp || "N/A",
//       rawTimestamp: new Date(),
//       requestList: enrichedItems, 
//       status: "Approved", 
//       approvedBy: userName, 
//       reason: selectedRequest.reason || "No reason provided",
//       program: selectedRequest.program,
//       usageType: selectedRequest.usageType || "N/A",  
//     };

//     const rejectLogEntry = {
//       accountId: selectedRequest.accountId || "N/A",
//       userName: selectedRequest.userName || "N/A",
//       room: selectedRequest.room || "N/A",
//       course: selectedRequest.couse || "N/A",
//       courseDescription: selectedRequest.courseDescription || "N/A",
//       dateRequired: selectedRequest.dateRequired || "N/A",
//       timeFrom: selectedRequest.timeFrom || "N/A",  
//       timeTo: selectedRequest.timeTo || "N/A",  
//       timestamp: selectedRequest.timestamp || "N/A",
//       rawTimestamp: new Date(),
//       requestList: rejectedItems, 
//       status: "Rejected", 
//       rejectedBy: userName, 
//       reason: rejectionReason || "No reason provided",  
//       program: selectedRequest.program,
//       usageType: selectedRequest.usageType || "N/A",  
//     };

//     // Log approved items in historylog subcollection
//     const logRequestOrReturn = async (
//       userId,
//       userName,
//       action,
//       requestDetails,
//       extraInfo = {} // for fields like dateRequired, approvedBy, etc.
//     ) => {
//       await addDoc(collection(db, `accounts/${userId}/historylog`), {
//         action,
//         userName,
//         timestamp: serverTimestamp(),
//         requestList: requestDetails,
//         ...extraInfo, // merge additional data like dateRequired, reason, etc.
//       });
//     };

//     // Log approved items
//     await logRequestOrReturn(
//       selectedRequest.accountId,     // user ID
//       selectedRequest.userName,      // user name
//       "Request Approved",            // action
//       enrichedItems,                 // request list
//       {
//         approvedBy: userName, // whoever approved
//         course: selectedRequest.course || "N/A",
//         courseDescription: selectedRequest.courseDescription || "N/A",
//         dateRequired: selectedRequest.dateRequired,
//         reason: selectedRequest.reason,
//         room: selectedRequest.room,
//         program: selectedRequest.program,
//         timeFrom: selectedRequest.timeFrom || "N/A",  // Include timeFrom
//         timeTo: selectedRequest.timeTo || "N/A",  
//         timestamp: selectedRequest.timestamp || "N/A",
//         rawTimestamp: new Date(),
//         usageType: selectedRequest.usageType || "N/A",  
//       }
//     );

//     // Log rejected items
//     if (rejectedItems.length > 0) {
//       await logRequestOrReturn(
//         selectedRequest.accountId,     // user ID
//         selectedRequest.userName,      // user name
//         "Request Rejected",            // action
//         rejectedItems,                 // request list
//         {
//           rejectedBy: userName, // whoever rejected
//           course: selectedRequest.course || "N/A",
//           courseDescription: selectedRequest.courseDescription || "N/A",
//           dateRequired: selectedRequest.dateRequired,
//           reason: rejectionReason || "No reason provided",  // Reason for rejection
//           room: selectedRequest.room,
//           program: selectedRequest.program,
//           timeFrom: selectedRequest.timeFrom || "N/A",  // Include timeFrom
//           timeTo: selectedRequest.timeTo || "N/A",  
//           timestamp: selectedRequest.timestamp || "N/A",
//           rawTimestamp: new Date(),
//           usageType: selectedRequest.usageType || "N/A",  
//         }
//       );
//     }


// try {
//         for (const item of enrichedItems) {
//           const inventoryId = item.selectedItemId;
//           const requestedQty = Number(item.quantity);
//           const labRoomId = item.labRoom;

//           if (!inventoryId || isNaN(requestedQty) || requestedQty <= 0) {
        
//             continue;
//           }

//           if (!labRoomId) {

//             continue;
//           }

//           const inventoryRef = doc(db, "inventory", inventoryId);
//           const inventorySnap = await getDoc(inventoryRef);
//           if (!inventorySnap.exists()) {
      
//             continue;
//           }

//           const data = inventorySnap.data();
//           const currentQty = Number(data.quantity || 0);
//           const newQty = Math.max(currentQty - requestedQty, 0);
//           await updateDoc(inventoryRef, { quantity: newQty });
        

//           // ⚙️ Update inventory condition breakdown
//           let remaining = requestedQty;
//           const good = data.condition?.Good ?? 0;
//           const damage = data.condition?.Damage ?? 0;
//           const defect = data.condition?.Defect ?? 0;
//           const lost = data.condition?.Lost ?? 0;

//           let newGood = good;
//           let newDamage = damage;
//           let newDefect = defect;
//           let newLost = lost;

//           if (remaining > 0) {
//             const deductFromGood = Math.min(newGood, remaining);
//             newGood -= deductFromGood;
//             remaining -= deductFromGood;
//           }

//           if (remaining > 0) {
//             const deductFromDamage = Math.min(newDamage, remaining);
//             newDamage -= deductFromDamage;
//             remaining -= deductFromDamage;
//           }

//           if (remaining > 0) {
//             const deductFromDefect = Math.min(newDefect, remaining);
//             newDefect -= deductFromDefect;
//             remaining -= deductFromDefect;
//           }

//           if (remaining > 0) {
//             const deductFromLost = Math.min(newLost, remaining);
//             newLost -= deductFromLost;
//             remaining -= deductFromLost;
//           }

//           await updateDoc(inventoryRef, {
//             'condition.Good': newGood,
//             'condition.Damage': newDamage,
//             'condition.Defect': newDefect,
//             'condition.Lost' : newLost,
//           });

//           // 🔁 Update labRoom item quantity
//           const roomNumber = item.labRoom; // e.g. "0930"
//           const labRoomCollectionRef = collection(db, "labRoom");
//           const q = query(labRoomCollectionRef, where("roomNumber", "==", roomNumber));
//           const querySnapshot = await getDocs(q);

//           if (querySnapshot.empty) {
          

//             return;
//           }

//           // 2. Get Firestore doc ID of the labRoom
//           const labRoomDoc = querySnapshot.docs[0];
//           const labRoomDocId = labRoomDoc.id;

//           // 3. Query items subcollection for item with matching itemId
//           const itemId = data.itemId; // e.g. "DENT02"
//           const itemsCollectionRef = collection(db, "labRoom", labRoomDocId, "items");
//           const itemQuery = query(itemsCollectionRef, where("itemId", "==", itemId));
//           const itemSnapshot = await getDocs(itemQuery);

//           if (itemSnapshot.empty) {
       
//             return;
//           }

//           // 4. Get the Firestore doc ID of the item document
//           const itemDoc = itemSnapshot.docs[0];
//           const itemDocId = itemDoc.id;
//           const labRoomItemRef = doc(db, "labRoom", labRoomDocId, "items", itemDocId);
//           const labData = itemDoc.data();

//           const currentLabQty = Number(labData.quantity || 0);
//           const newLabQty = Math.max(currentLabQty - requestedQty, 0);
//           await updateDoc(labRoomItemRef, { quantity: newLabQty });
         

//           // Update condition breakdown
//           let labGood = labData.condition?.Good ?? 0;
//           let labDamage = labData.condition?.Damage ?? 0;
//           let labDefect = labData.condition?.Defect ?? 0;
//           let labLost = labData.condition?.Lost ?? 0;

//           let remainingLab = requestedQty;

//           if (remainingLab > 0) {
//             const deductFromLabGood = Math.min(labGood, remainingLab);
//             labGood -= deductFromLabGood;
//             remainingLab -= deductFromLabGood;
//           }

//           if (remainingLab > 0) {
//             const deductFromLabDamage = Math.min(labDamage, remainingLab);
//             labDamage -= deductFromLabDamage;
//             remainingLab -= deductFromLabDamage;
//           }

//           if (remainingLab > 0) {
//             const deductFromLabDefect = Math.min(labDefect, remainingLab);
//             labDefect -= deductFromLabDefect;
//             remainingLab -= deductFromLabDefect;
//           }

//           if (remainingLab > 0) {
//             const deductFromLabLost = Math.min(labLost, remainingLab);
//             labLost -= deductFromLabLost;
//             remainingLab -= deductFromLabLost;
//           }

//           await updateDoc(labRoomItemRef, {
//             'condition.Good': labGood,
//             'condition.Damage': labDamage,
//             'condition.Defect': labDefect,
//             'condition.Lost' : labLost,
//           });

          
//         }
        
//       } catch (err) {

//       }
    

//     try {
//       // Add to requestlog for approval
//       await addDoc(collection(db, "requestlog"), requestLogEntry);

//       // Add to requestlog for rejection
//       if (rejectedItems.length > 0) {
//         await addDoc(collection(db, "requestlog"), rejectLogEntry);
//       }

//       // Proceed with borrow catalog logic for approved items
//       // Filter to get all "Fixed" items
//       // Process Borrow Catalog
//       const fixedItems = enrichedItems.filter(item => item.itemType === "Fixed");
  
//       if (fixedItems.length > 0) {
//         const formattedItems = fixedItems.map(item => ({
//           category: item.category || "N/A",
//           condition: item.condition || "N/A",
//           department: item.department || "N/A",
//           itemName: item.itemName || "N/A",
//           itemDetails: item.itemDetails || "N/A",
//           itemId: item.itemIdFromInventory,
//           quantity: item.quantity || "1",
//           selectedItemId: item.selectedItemId || "N/A",
//           status: item.status || "Available",
//           program: item.program || "N/A",
//           course: item.course || "N/A",
//           courseDescription: item.courseDescription || "N/A",
//           reason: item.reason || "No reason provided",
//           labRoom: item.labRoom || "N/A",
//           timeFrom: item.timeFrom || "N/A",
//           timeTo: item.timeTo || "N/A",
//           usageType: item.usageType || "N/A",
//           scannedCount: 0,
//         }));
  
//         const borrowCatalogEntry = {
//           accountId: selectedRequest.accountId || "N/A",
//           userName: selectedRequest.userName || "N/A",
//           room: selectedRequest.room || "N/A",
//           course: selectedRequest.course || "N/A",
//           courseDescription: selectedRequest.courseDescription || "N/A",
//           dateRequired: selectedRequest.dateRequired || "N/A",
//           timeFrom: selectedRequest.timeFrom || "N/A",
//           timeTo: selectedRequest.timeTo || "N/A",
//           timestamp: selectedRequest.timestamp || "N/A",
//           rawTimestamp: new Date(),
//           requestList: formattedItems,
//           status: "Borrowed",
//           // status: "For Deployment",
//           approvedBy: userName,
//           reason: selectedRequest.reason || "No reason provided",
//           program: selectedRequest.program,
//           usageType: selectedRequest.usageType || "N/A",
//         };
  
//         const userRequestLogEntry = {
//           ...requestLogEntry,
//           status: "Approved",
//           approvedBy: userName,
//           timestamp: selectedRequest.timestamp || "N/A",
//           rawTimestamp: new Date(),
//         };
  
//         await addDoc(collection(db, "borrowcatalog"), borrowCatalogEntry);
  
//         await addDoc(collection(db, "accounts", selectedRequest.accountId, "userrequestlog"), userRequestLogEntry);

//         // ✅ Notify the user who submitted the request
//         if (selectedRequest.accountId && selectedRequest.accountId !== "system") {
//           await addDoc(collection(db, `accounts/${selectedRequest.accountId}/userNotifications`), {
//             action: `Approved request for ${selectedRequest.userName}`,
//             requestId: selectedRequest.id,
//             userName: selectedRequest.userName,
//             read: false,
//             timestamp: serverTimestamp(),
//           });
//         }

//         // ✅ Send push to the user who submitted the request
//         try {
//           const functions = getFunctions();
//           const sendPush = httpsCallable(functions, "sendPushNotification");

//           const pushTokenSnapshot = await getDocs(collection(db, "pushTokens"));
//           const tokensToNotify = [];

//           pushTokenSnapshot.forEach((doc) => {
//             const data = doc.data();
//             if (
//               data?.expoPushToken &&
//               data.userId === selectedRequest.userId // 👈 This should match the request sender
//             ) {
//               tokensToNotify.push(data.expoPushToken);
//             }
//           });

//           for (const token of tokensToNotify) {
//             const payload = {
//               token,
//               title: "Request Update",
//               body: `Your requisition has been approved.`, // or `rejected` if applicable
//             };

//             const response = await sendPush(payload);
//             console.log("✅ Push sent to user:", response.data);
//           }

//         } catch (err) {
//           console.error("❌ Push error (admin to user):", err.message || err);
//         }
//       }

//       const consumableItems = enrichedItems.filter(item => item.itemType === "Consumable");

//       if (consumableItems.length > 0) {
//         const formattedItems = consumableItems.map(item => ({
//           category: item.category || "N/A",
//           condition: item.condition || "N/A",
//           department: item.department || "N/A",
//           itemName: item.itemName || "N/A",
//           itemDetails: item.itemDetails || "N/A",
//           itemId: item.itemIdFromInventory,
//           quantity: item.quantity || "1",
//           selectedItemId: item.selectedItemId || "N/A",
//           status: item.status || "Available",
//           program: item.program || "N/A",
//           course: item.course || "N/A",
//           courseDescription: item.courseDescription || "N/A",
//           reason: item.reason || "No reason provided",
//           labRoom: item.labRoom || "N/A",
//           timeFrom: item.timeFrom || "N/A",
//           timeTo: item.timeTo || "N/A",
//           usageType: item.usageType || "N/A",
//           scannedCount: 0,
//         }));

//         const consumableCatalogEntry = {
//           accountId: selectedRequest.accountId || "N/A",
//           userName: selectedRequest.userName || "N/A",
//           room: selectedRequest.room || "N/A",
//           course: selectedRequest.course || "N/A",
//           courseDescription: selectedRequest.courseDescription || "N/A",
//           dateRequired: selectedRequest.dateRequired || "N/A",
//           timeFrom: selectedRequest.timeFrom || "N/A",
//           timeTo: selectedRequest.timeTo || "N/A",
//           timestamp: selectedRequest.timestamp || "N/A",
//           rawTimestamp: new Date(),
//           requestList: formattedItems,
//           status: "For Release", // For Consumables
//           approvedBy: userName,
//           reason: selectedRequest.reason || "No reason provided",
//           program: selectedRequest.program,
//           usageType: selectedRequest.usageType || "N/A",
//         };

//         await addDoc(collection(db, "borrowcatalog"), consumableCatalogEntry);

//         // ✅ Notify the user who submitted the request
//               if (selectedRequest.accountId && selectedRequest.accountId !== "system") {
//                 await addDoc(collection(db, `accounts/${selectedRequest.accountId}/userNotifications`), {
//                   action: `Approved request for ${selectedRequest.userName}`,
//                   requestId: selectedRequest.id,
//                   userName: selectedRequest.userName,
//                   read: false,
//                   timestamp: serverTimestamp(),
//                 });
//               }

//               // ✅ Send push to the user who submitted the request
//               try {
//                 const functions = getFunctions();
//                 const sendPush = httpsCallable(functions, "sendPushNotification");

//                 const pushTokenSnapshot = await getDocs(collection(db, "pushTokens"));
//                 const tokensToNotify = [];

//                 pushTokenSnapshot.forEach((doc) => {
//                   const data = doc.data();
//                   if (
//                     data?.expoPushToken &&
//                     data.userId === selectedRequest.userId // 👈 This should match the request sender
//                   ) {
//                     tokensToNotify.push(data.expoPushToken);
//                   }
//                 });

//                 for (const token of tokensToNotify) {
//                   const payload = {
//                     token,
//                     title: "Request Update",
//                     body: `Your requisition has been approved.`, // or `rejected` if applicable
//                   };

//                   const response = await sendPush(payload);
//                   console.log("✅ Push sent to user:", response.data);
//                 }

//               } catch (err) {
//                 console.error("❌ Push error (admin to user):", err.message || err);
//               }
//       }

//         await deleteDoc(doc(db, "userrequests", selectedRequest.id));

//         // Cleanup the user requests subcollection
//         const subCollectionRef = collection(db, "accounts", selectedRequest.accountId, "userRequests");
//         const subDocsSnap = await getDocs(subCollectionRef);

//         subDocsSnap.forEach(async (docSnap) => {
//           const data = docSnap.data();
//           const match = (
//             data.timestamp?.seconds === selectedRequest.timestamp?.seconds &&
//             data.filteredMergedData?.[0]?.selectedItemId === selectedRequest.filteredMergedData?.[0]?.selectedItemId
//           );

//           if (match) {
       
//             await deleteDoc(doc(db, "accounts", selectedRequest.accountId, "userRequests", docSnap.id));
//           }
//         });

//         setApprovedRequests([...approvedRequests, requestLogEntry]);
//         setRequests(requests.filter((req) => req.id !== selectedRequest.id));
//         setCheckedItems({});
//         setIsModalVisible(false);
//         setSelectedRequest(null);
//         setIsFinalizeModalVisible(false)

//         setNotificationMessage("Request has been approved and logged successfully.");
//         setIsNotificationVisible(true);

//         notification.success({
//           message: "Request Approved",
//           description: "Request has been approved and logged.",
//         });

//       } catch (error) {
     
//         notification.error({
//           message: "Approval Failed",
//           description: "There was an error logging the approved request.",
//         });
//       } finally {
//         setApproveLoading(false);
//       }
//     }
//   };

// // BACKEND
// // const handleApprove = async () => {
// //   const isChecked = Object.values(checkedItems).some((checked) => checked);
// //   if (!isChecked) {
// //     setNotificationMessage("No Items selected");
// //     setIsNotificationVisible(true);
// //     return;
// //   }

// //   if (!selectedRequest) return;

// //   // Check if account is disabled
// //   try {
// //     const accountRef = doc(db, "accounts", selectedRequest.accountId);
// //     const accountSnap = await getDoc(accountRef);
// //     if (accountSnap.exists() && accountSnap.data().disabled) {
// //       setNotificationMessage("Cannot approve: The user's account is disabled.");
// //       setIsNotificationVisible(true);
// //       return;
// //     }
// //   } catch (error) {
// //     setNotificationMessage("Error verifying account status. Please try again.");
// //     setIsNotificationVisible(true);
// //     return;
// //   }

// //   // ✅ Prepare enriched approved items
// //   const filteredItems = selectedRequest.requestList.filter((item, index) =>
// //     checkedItems[`${selectedRequest.id}-${index}`]
// //   );

// //   if (filteredItems.length === 0) {
// //     setNotificationMessage("No Items selected");
// //     setIsNotificationVisible(true);
// //     return;
// //   }

// //   const enrichedItems = await Promise.all(
// //     filteredItems.map(async (item) => {
// //       const selectedItemId = item.selectedItemId || item.selectedItem?.value;
// //       let itemType = "Unknown";

// //       if (selectedItemId) {
// //         try {
// //           const docSnap = await getDoc(doc(db, "inventory", selectedItemId));
// //           if (docSnap.exists()) {
// //             itemType = docSnap.data()?.type || "Unknown";
// //           }
// //         } catch {}
// //       }

// //       return {
// //         ...item,
// //         selectedItemId,
// //         itemType,
// //         volume: item.volume ?? "N/A",
// //       };
// //     })
// //   );

// //   // ⛔ Check for unchecked items
// //   const uncheckedItems = selectedRequest.requestList.filter((item, index) =>
// //     !checkedItems[`${selectedRequest.id}-${index}`]
// //   );

// //   // ❗ If there are unchecked items, trigger rejection modal and pause flow
// //   if (uncheckedItems.length > 0) {
// //     setPendingApprovalData({
// //       enrichedItems,
// //       uncheckedItems,
// //       selectedRequest,
// //     });
// //     setIsMultiRejectModalVisible(true); // ← show modal for rejection reasons
// //     return; // ⛔ Don't continue to backend until modal is handled
// //   }

// //   // ✅ If no unchecked items, proceed to backend approval
// //   const auth = getAuth();
// //   const currentUser = auth.currentUser;
// //   const userEmail = currentUser?.email;
// //   let userName = "Unknown";
// //   let userId = "system";

// //   if (userEmail) {
// //     try {
// //       const querySnap = await getDocs(
// //         query(collection(db, "accounts"), where("email", "==", userEmail))
// //       );
// //       if (!querySnap.empty) {
// //         const doc = querySnap.docs[0];
// //         userName = doc.data().name || "Unknown";
// //         userId = doc.id;
// //       }
// //     } catch {}
// //   }

// //   try {
// //     const response = await fetch("https://webnuls.onrender.com/request/approve", {
// //       method: "POST",
// //       headers: { "Content-Type": "application/json" },
// //       body: JSON.stringify({
// //         selectedRequest,
// //         enrichedItems,
// //         rejectedItems: [], // no rejected items in this case
// //         userName,
// //         userId,
// //       }),
// //     });

// //     const result = await response.json();

// //     if (!response.ok) {
// //       notification.error({
// //         message: "Approval Failed",
// //         description: result.error || "There was a problem approving the request.",
// //       });
// //       return;
// //     }

// //     // ✅ Clean up UI
// //     setApprovedRequests((prev) => [...prev, selectedRequest]);
// //     setRequests((prev) => prev.filter((r) => r.id !== selectedRequest.id));
// //     setCheckedItems({});
// //     setSelectedRequest(null);
// //     setIsModalVisible(false);
// //     setIsFinalizeModalVisible(false);
// //     setNotificationMessage(result.message || "Request approved.");
// //     setIsNotificationVisible(true);

// //     notification.success({
// //       message: "Request Approved",
// //       description: result.message || "Request has been approved and logged.",
// //     });
    
// //   } catch (err) {
// //     console.error("Approval error:", err);
// //     notification.error({
// //       message: "Network Error",
// //       description: "Could not connect to the server.",
// //     });
// //   }
// // };

//   const handleReject = () => { 
//     if (!selectedRequest) return;

//     // 🔄 Use edited quantities from editableItems
//     const mergedRequestList = selectedRequest.requestList.map((item, index) => {
//       const editedItem = editableItems?.[index];
//       return editedItem ? { ...item, quantity: editedItem.quantity } : item;
//     });

//     const uncheckedItems = mergedRequestList.filter((item, index) => {
//       const key = `${selectedRequest.id}-${index}`;
//       return !checkedItems[key]; // Get items that are NOT checked
//     });

//     const enrichedItems = mergedRequestList.filter((item, index) => {
//       const key = `${selectedRequest.id}-${index}`;
//       return checkedItems[key]; // Get items that ARE checked
//     });

//     // Set full data into pendingApprovalData
//     setPendingApprovalData({
//       uncheckedItems,
//       enrichedItems,
//       selectedRequest,
//     });

//     // Show the rejection reason modal
//     setIsMultiRejectModalVisible(true);
//   };

//   // BACKEND
//   // const handleRejectSubmit = async () => {
//   //   const isChecked = Object.values(checkedItems).some((checked) => checked);
  
//   //   if (!isChecked) {
//   //     setNotificationMessage("No Items selected");
//   //     setIsNotificationVisible(true);
//   //     return;
//   //   }
  
//   //   if (selectedRequest) {
//   //     const filteredItems = selectedRequest.requestList.filter((item, index) => {
//   //       const key = `${selectedRequest.id}-${index}`;
//   //       return checkedItems[key];
//   //     });
  
//   //     if (filteredItems.length === 0) {
//   //       setNotificationMessage("No Items selected");
//   //       setIsNotificationVisible(true);
//   //       return;
//   //     }
  
//   //     const enrichedItems = await Promise.all(
//   //       filteredItems.map(async (item) => {
//   //         const selectedItemId = item.selectedItemId || item.selectedItem?.value;
//   //         let itemType = "Unknown";
  
//   //         if (selectedItemId) {
//   //           try {
//   //             const inventoryDoc = await getDoc(doc(db, "inventory", selectedItemId));
//   //             if (inventoryDoc.exists()) {
//   //               itemType = inventoryDoc.data().type || "Unknown";
//   //             }
//   //           } catch (err) {
            
//   //           }
//   //         }
  
//   //         return {
//   //           ...item,
//   //           selectedItemId,
//   //           itemType,
//   //         };
//   //       })
//   //     );
  
//   //     const auth = getAuth();
//   //     const currentUser = auth.currentUser;
//   //     const userEmail = currentUser.email;
  
//   //     // Fetch the user name from Firestore
//   //     let userName = "Unknown";
//   //     try {
//   //       const userQuery = query(collection(db, "accounts"), where("email", "==", userEmail));
//   //       const userSnapshot = await getDocs(userQuery);
  
//   //       if (!userSnapshot.empty) {
//   //         const userDoc = userSnapshot.docs[0];
//   //         const userData = userDoc.data();
//   //         userName = userData.name || "Unknown";
//   //       }
//   //     } catch (error) {

//   //     }
  
//   //     const rejectLogEntry = {
//   //       accountId: selectedRequest.accountId || "N/A",
//   //       userName: selectedRequest.userName || "N/A",
//   //       room: selectedRequest.room || "N/A",
//   //       course: selectedRequest.course || "N/A",
//   //       courseDescription: selectedRequest.courseDescription || "N/A",
//   //       dateRequired: selectedRequest.dateRequired || "N/A",
//   //       timeFrom: selectedRequest.timeFrom || "N/A",  
//   //       timeTo: selectedRequest.timeTo || "N/A",  
//   //       timestamp: new Date(),
//   //       requestList: enrichedItems, 
//   //       status: "Rejected", 
//   //       rejectedBy: userName, 
//   //       reason: rejectReason || "No reason provided",
//   //       program: selectedRequest.program,
//   //     };
  
//   //     try {
//   //       // Add to rejection log (requestlog collection)
//   //       await addDoc(collection(db, "requestlog"), rejectLogEntry);

//   //       // Add to historylog subcollection for the user
//   //       await addDoc(
//   //         collection(db, "accounts", selectedRequest.accountId, "historylog"), 
//   //         {
//   //           ...rejectLogEntry, 
//   //           action: "Request Rejected", 
//   //           timestamp: serverTimestamp(),
//   //         }
//   //       );        
  
//   //       // Delete rejected request from userrequests
//   //       await deleteDoc(doc(db, "userrequests", selectedRequest.id));
  
//   //       // Delete from subcollection with matching timestamp and selectedItemId
//   //       const subCollectionRef = collection(db, "accounts", selectedRequest.accountId, "userRequests");
//   //       const subDocsSnap = await getDocs(subCollectionRef);

//   //       subDocsSnap.forEach(async (docSnap) => {
//   //         const data = docSnap.data();
//   //         const match = (
//   //           data.timestamp?.seconds === selectedRequest.timestamp?.seconds &&
//   //           data.filteredMergedData?.[0]?.selectedItemId === selectedRequest.filteredMergedData?.[0]?.selectedItemId
//   //         );

//   //         if (match) {
            
//   //           await deleteDoc(doc(db, "accounts", selectedRequest.accountId, "userRequests", docSnap.id));
//   //         }
//   //       });
  
//   //       // Update state
//   //       setRequests(requests.filter((req) => req.id !== selectedRequest.id));
//   //       setCheckedItems({});
//   //       setIsRejectModalVisible(false);
//   //       setRejectReason(""); 
//   //       setIsModalVisible(false);
  
//   //       notification.success({
//   //         message: "Request Rejected",
//   //         description: "Request has been rejected and logged.",
//   //       });

//   //     } catch (error) {

//   //       notification.error({
//   //         message: "Rejection Failed",
//   //         description: "There was an error logging the rejected request.",
//   //       });
//   //     }
//   //   }
//   // };

//   // BACKEND
//   const handleRejectSubmit = async () => {
//     const isChecked = Object.values(checkedItems).some((checked) => checked);

//     if (!isChecked) {
//       setNotificationMessage("No items selected");
//       setIsNotificationVisible(true);
//       return;
//     }

//     if (!selectedRequest) {
//       setNotificationMessage("No request selected");
//       setIsNotificationVisible(true);
//       return;
//     }

//     const filteredItems = selectedRequest.requestList.filter((item, index) => {
//       const key = `${selectedRequest.id}-${index}`;
//       return checkedItems[key];
//     });

//     if (filteredItems.length === 0) {
//       setNotificationMessage("No items selected");
//       setIsNotificationVisible(true);
//       return;
//     }

//     const enrichedItems = await Promise.all(
//       filteredItems.map(async (item) => {
//         const selectedItemId = item.selectedItemId || item.selectedItem?.value;
//         let itemType = "Unknown";

//         if (selectedItemId) {
//           try {
//             const inventoryDoc = await getDoc(doc(db, "inventory", selectedItemId));
//             if (inventoryDoc.exists()) {
//               itemType = inventoryDoc.data().type || "Unknown";
//             }
//           } catch (err) {
//             console.warn("Failed to fetch item type", err);
//           }
//         }

//         return {
//           ...item,
//           selectedItemId,
//           itemType,
//         };
//       })
//     );

//     // 🔐 Get logged-in user info
//     const userId = localStorage.getItem("userId") || "system";
//     const userName = localStorage.getItem("userName") || "Unknown";

//     try {
//       const response = await fetch("https://webnuls.onrender.com/reject", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           selectedRequest,
//           enrichedItems,
//           rejectReason,
//           userId,
//           userName,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         notification.error({
//           message: "Rejection Failed",
//           description: data.error || "There was a problem rejecting the request.",
//         });
//         return;
//       }

//       notification.success({
//         message: "Request Rejected",
//         description: data.message || "Request has been successfully rejected and logged.",
//       });

//       // 🧼 Clean up UI
//       setRequests((prev) => prev.filter((req) => req.id !== selectedRequest.id));
//       setCheckedItems({});
//       setIsRejectModalVisible(false);
//       setRejectReason("");
//       setIsModalVisible(false);
//       setNotificationMessage("Request rejected successfully");
//       setIsNotificationVisible(true);

//     } catch (error) {
//       console.error("Error submitting rejection:", error);
//       notification.error({
//         message: "Network Error",
//         description: "Could not connect to the rejection server.",
//       });
//     }
//   };

//   const allItemsChecked = selectedRequest?.requestList?.length > 0 &&
//   selectedRequest.requestList.every((_, index) => 
//     checkedItems[`${selectedRequest.id}-${index}`]
//   );

//   const columnsRejection = [
//     {
//       title: "Item Name",
//       dataIndex: "itemName",
//       key: "itemName",
//     },
//     {
//       title: "Item Description",
//       dataIndex: "itemDetails",
//       key: "itemDetails",
//     },
//     // {
//     //   title: "Quantity",
//     //   dataIndex: "quantity",
//     //   key: "quantity",
//     // },
//     // {
//     //   title: "Quantity",
//     //   dataIndex: "quantity",
//     //   key: "quantity",
//     //   render: (text, record, index) => {
//     //     const value = editableItems[index]?.quantity ?? "";
//     //     const maxQuantity = editableItems[index]?.maxQuantity ?? Infinity;

//     //     return (
//     //       <Tooltip title={`Max allowed: ${maxQuantity}`}>
//     //         <Input
//     //           type="number"
//     //           min={1}
//     //           max={maxQuantity}
//     //           value={value}
//     //           onChange={(e) => {
//     //             const inputValue = e.target.value;

//     //             if (inputValue === "") {
//     //               const updatedItems = [...editableItems];
//     //               updatedItems[index] = {
//     //                 ...updatedItems[index],
//     //                 quantity: "",
//     //               };
//     //               setEditableItems(updatedItems);
//     //               return;
//     //             }

//     //             const parsed = parseInt(inputValue, 10);
//     //             if (!isNaN(parsed) && parsed <= maxQuantity) {
//     //               const updatedItems = [...editableItems];
//     //               updatedItems[index] = {
//     //                 ...updatedItems[index],
//     //                 quantity: parsed,
//     //               };
//     //               setEditableItems(updatedItems);
//     //             }
//     //           }}
//     //           onBlur={() => {
//     //             const updatedItems = [...editableItems];
//     //             let value = updatedItems[index]?.quantity;

//     //             if (value === "" || isNaN(value) || value < 1) {
//     //               value = 1;
//     //             }

//     //             updatedItems[index] = {
//     //               ...updatedItems[index],
//     //               quantity: value,
//     //             };
//     //             setEditableItems(updatedItems);
//     //           }}
//     //         />
//     //       </Tooltip>
//     //     );
//     //   }
//     // },
//     {
//       title: "Quantity",
//       dataIndex: "quantity",
//       key: "quantity",
//       render: (text, record) => (
//         <Input
//           type="number"
//           min={1}
//           value={editableItems?.[record.selectedItemId]?.quantity ?? text}
//           onChange={(e) => {
//             const value = e.target.value;
//             const updatedValue = value === "" ? "" : Math.max(1, parseInt(value));

//             setEditableItems((prev) => ({
//               ...prev,
//               [record.selectedItemId]: {
//                 ...record,
//                 quantity: updatedValue,
//               },
//             }));
//           }}
//         />
//       )
//     },
//     {
//       title: "Reason for Rejection",
//       key: "reason",
//       render: (_, record, index) => {
//         const itemKey = `${record.selectedItemId}-${index}`;
//         return (
//           <Select
//             style={{ width: 200 }}
//             placeholder="Select reason"
//             value={rejectionReasons[itemKey]}
//             onChange={(value) => {
//               setRejectionReasons((prev) => ({
//                 ...prev,
//                 [itemKey]: value,
//               }));
//             }}
//           >
//             <Option value="Out of stock">Out of stock</Option>
//             <Option value="Not allowed">Not allowed</Option>
//             <Option value="Duplicate request">Duplicate request</Option>
//             <Option value="Invalid usage">Invalid usage</Option>
//           </Select>
//         );
//       },
//     },
//   ];  

//   const columnsRejection1 = [
//     {
//       title: "Item Name",
//       dataIndex: "itemName",
//       key: "itemName",
//     },
//     {
//       title: "Item Description",
//       dataIndex: "itemDetails",
//       key: "itemDetails",
//     },
//     // {
//     //   title: "Quantity",
//     //   dataIndex: "quantity",
//     //   key: "quantity",
//     // },
//     // {
//     //   title: "Quantity",
//     //   dataIndex: "quantity",
//     //   key: "quantity",
//     //   render: (text, record, index) => {
//     //     const value = editableItems[index]?.quantity ?? "";
//     //     const maxQuantity = editableItems[index]?.maxQuantity ?? Infinity;

//     //     return (
//     //       <Tooltip title={`Max allowed: ${maxQuantity}`}>
//     //         <Input
//     //           type="number"
//     //           min={1}
//     //           max={maxQuantity}
//     //           value={value}
//     //           onChange={(e) => {
//     //             const inputValue = e.target.value;

//     //             if (inputValue === "") {
//     //               const updatedItems = [...editableItems];
//     //               updatedItems[index] = {
//     //                 ...updatedItems[index],
//     //                 quantity: "",
//     //               };
//     //               setEditableItems(updatedItems);
//     //               return;
//     //             }

//     //             const parsed = parseInt(inputValue, 10);
//     //             if (!isNaN(parsed) && parsed <= maxQuantity) {
//     //               const updatedItems = [...editableItems];
//     //               updatedItems[index] = {
//     //                 ...updatedItems[index],
//     //                 quantity: parsed,
//     //               };
//     //               setEditableItems(updatedItems);
//     //             }
//     //           }}
//     //           onBlur={() => {
//     //             const updatedItems = [...editableItems];
//     //             let value = updatedItems[index]?.quantity;

//     //             if (value === "" || isNaN(value) || value < 1) {
//     //               value = 1;
//     //             }

//     //             updatedItems[index] = {
//     //               ...updatedItems[index],
//     //               quantity: value,
//     //             };
//     //             setEditableItems(updatedItems);
//     //           }}
//     //         />
//     //       </Tooltip>
//     //     );
//     //   }
//     // },
//     {
//       title: "Quantity",
//       dataIndex: "quantity",
//       key: "quantity",
//       render: (text, record) => (
//         <Input
//           type="number"
//           min={1}
//           value={editableItems?.[record.selectedItemId]?.quantity ?? text}
//           onChange={(e) => {
//             const value = e.target.value;
//             const updatedValue = value === "" ? "" : Math.max(1, parseInt(value));

//             setEditableItems((prev) => ({
//               ...prev,
//               [record.selectedItemId]: {
//                 ...record,
//                 quantity: updatedValue,
//               },
//             }));
//           }}
//         />
//       )
//     },
//     {
//       title: "Reason for Rejection",
//       key: "reason",
//       render: (_, record, index) => {
//         const itemKey = `${record.selectedItemId}-${index}`;
//         return (
//           <Select
//             style={{ width: 200 }}
//             placeholder="Select reason"
//             value={rejectionReasons[itemKey]}
//             onChange={(value) => {
//               setRejectionReasons((prev) => ({
//                 ...prev,
//                 [itemKey]: value,
//               }));
//             }}
//           >
//             <Option value="Out of stock">Out of stock</Option>
//             <Option value="Not allowed">Not allowed</Option>
//             <Option value="Duplicate request">Duplicate request</Option>
//             <Option value="Invalid usage">Invalid usage</Option>
//           </Select>
//         );
//       },
//     },
//   ];  

//   const columns = [
//     {
//       title: "Check",
//       dataIndex: "check",
//       render: (_, record, index) => (
//         <input
//           type="checkbox"
//           checked={checkedItems[`${selectedRequest?.id}-${index}`] || false}
//           onChange={(e) =>
//             setCheckedItems({
//               ...checkedItems,
//               [`${selectedRequest?.id}-${index}`]: e.target.checked,
//             })
//           }         
//         />
//       ),
//       width: 50,
//     },
//     {
//       title: "Item ID",
//       dataIndex: "itemIdFromInventory", 
//       render: (text) => text || "N/A",  
//     },   
//     {
//       title: "Item Name",
//       dataIndex: "itemName",
//     },
//     {
//       title: "Item Description",
//       dataIndex: "itemDetails",
//     },
//     {
//       title: "Quantity",
//       dataIndex: "quantity",
//       key: "quantity",
//       render: (text, record, index) => (
//         <Input
//           type="number"
//           min={1}
//           value={editableItems?.[index]?.quantity ?? text}
//           onChange={(e) => {
//             const value = e.target.value;
//             const updatedValue = value === "" ? "" : Math.max(1, parseInt(value));

//             setEditableItems((prev) => {
//               const newItems = [...(prev || [])];
//               newItems[index] = {
//                 ...record,
//                 quantity: updatedValue,
//               };
//               return newItems;
//             });
//           }}
//         />
//       )
//     },
//      {
//       title: "Unit",
//       dataIndex: "unit",
//     },
//     {
//       title: "Category",
//       dataIndex: "category",
//     },
//   ];

//   const formatDate = (timestamp) => {
//     if (!timestamp || !timestamp.toDate) return "N/A";
//     const date = timestamp.toDate(); 
//     return date.toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     });
//   };


// const groupByDueDateCategory = (requests) => {
//   const now = new Date();

//   const startOfWeek = new Date(now);
//   startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
//   startOfWeek.setHours(0, 0, 0, 0);

//   const endOfWeek = new Date(startOfWeek);
//   endOfWeek.setDate(startOfWeek.getDate() + 6);
//   endOfWeek.setHours(23, 59, 59, 999);

//   const startOfNextWeek = new Date(endOfWeek);
//   startOfNextWeek.setDate(endOfWeek.getDate() + 1);
//   startOfNextWeek.setHours(0, 0, 0, 0);

//   const endOfNextWeek = new Date(startOfNextWeek);
//   endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
//   endOfNextWeek.setHours(23, 59, 59, 999);

//   const pastDue = [];
//   const thisWeek = [];
//   const nextWeek = [];
//   const later = [];

//   requests.forEach((item) => {
//     const dueDate = new Date(item.dateRequired);

//     if (dueDate < startOfWeek) {
//       pastDue.push(item)
//     } else if (dueDate >= startOfWeek && dueDate <= endOfWeek) {
//       thisWeek.push(item);
//     } else if (dueDate >= startOfNextWeek && dueDate <= endOfNextWeek) {
//       nextWeek.push(item);
//     } else if (dueDate > endOfNextWeek) {
//       later.push(item);
//     }
//   });

//   return {
//     'Past Due': pastDue,
//     'Required This Week': thisWeek,
//     'Next Week': nextWeek,
//     'Further Ahead': later,
//   };
// };

//   const groupedRequests = groupByDueDateCategory(requests);

// const getInitials = (usage) => {
//   if (!usage) return '';

//   const officialUsages = ['Laboratory Experiment', 'Research', 'Community Extension'];

//   // If it's not one of the official usage types, treat it as "Others"
//   const normalized = officialUsages.includes(usage) ? usage : 'Others';

//   const words = normalized.trim().split(' ');
//   return words.length === 1
//     ? (words[0][0].toUpperCase() + words[0][1])?.toUpperCase()
//     : (words[0][0] + words[1][0]).toUpperCase();
// };


//   const usageBG = (item) => {
//     if(item === 'Laboratory Experiment') return 'orange'
//     if(item === 'Research') return '#70c247'
//     if(item === 'Community Extension') return '#6e9fc1'
//     else{return '#b66ee8'}
//   }
  

// const capitalizeName = (name) => {
//   return name.replace(/\b\w/g, char => char.toUpperCase());
// };  

// const [collapsedGroups, setCollapsedGroups] = useState({});
// const contentRefs = useRef({});

// const toggleGroup = (label) => {
//   setCollapsedGroups(prev => ({
//     ...prev,
//     [label]: !prev[label],
//   }));
// };

//   useEffect(() => {
//     // Ensure refs are reset when groupedRequests change
//     Object.keys(groupedRequests).forEach(label => {
      
//       if (!contentRefs.current[label]) {
//         contentRefs.current[label] = null;
//       }
//     });
//   }, [groupedRequests]);



// // const getFilteredRequests = () => {
  

// //   if (selectedFilter.trim().toLowerCase() === 'all') return requests;


// //   return requests.filter((item) => {
// //     const usage = item.usageType?.trim().toLowerCase();
// //     if (!usage) return false;

// //     const normalized = usage.replace(/\s+/g, ' ');
// //     const knownTypes = ['laboratory experiment', 'research', 'community extension'];
// //     const selected = selectedFilter.trim().toLowerCase();

// //     if (knownTypes.includes(normalized)) {
// //       return normalized === selected;
// //     } else {
// //       return selected === 'others';
// //     }
// //   });
// // };

// const getFilteredRequests = () => {
//   const sanitizedSearch = searchTerm.trim().toLowerCase();
//   const selected = selectedFilter.trim().toLowerCase();

//   return requests.filter((item) => {
//     // 🔍 Search filter
//     const matchesSearch =
//       item.userName?.toLowerCase().includes(sanitizedSearch) ||
//       item.room?.toLowerCase().includes(sanitizedSearch) ||
//       item.course?.toLowerCase().includes(sanitizedSearch) ||
//       item.courseDescription?.toLowerCase().includes(sanitizedSearch);

//     if (!matchesSearch) return false;

//     // 🧪 Usage type filter
//     if (selected === 'all') return true;

//     const usage = item.usageType?.trim().toLowerCase() || '';
//     const normalized = usage.replace(/\s+/g, ' ');
//     const knownTypes = ['laboratory experiment', 'research', 'community extension'];

//     if (knownTypes.includes(normalized)) {
//       return normalized === selected;

//     } else {
//       return selected === 'others';
//     }
//   });
// };

// // const filteredRequests = getFilteredRequests();
// // Filter requests based on search term

// // Helper function to check if a request is past due
// const isPastDue = (request) => {
//   const now = new Date();
//   const yesterday = new Date(now);
//   yesterday.setDate(now.getDate() - 1);
//   yesterday.setHours(23, 59, 59, 999); // End of yesterday
//   const dueDate = new Date(request.dateRequired);
//   return dueDate <= yesterday;
// };

// // Filter requests based on active tab
// const getTabFilteredRequests = () => {
//   const filtered = getFilteredRequests();
  
//   if (activeTab === 'pastDue') {
//     // Show only past due requests
//     return filtered.filter(isPastDue);
//   } else {
//     // Show all requests EXCEPT past due ones
//     return filtered.filter(request => !isPastDue(request));
//   }
// };

// const categorizedRequests = groupByDueDateCategory(getTabFilteredRequests());

// useEffect(() => {
//   // Timeout ensures layout finishes rendering before measuring scrollHeight
//   const timeout = setTimeout(() => {
//     Object.entries(categorizedRequests).forEach(([label, group]) => {
//       const ref = contentRefs.current[label];
//       if (ref && ref.current) {
//         // Force re-measure height after new content is shown
//         ref.current.style.maxHeight = collapsedGroups[label]
//           ? '0px'
//           : `${ref.current.scrollHeight}px`;
//       }
//     });
//   }, 50); // Adjust timeout if needed (50ms usually works well)

//   return () => clearTimeout(timeout);
// }, [categorizedRequests, collapsedGroups, activeTab]);


//   const usageTypes = ['All','Laboratory Experiment', 'Research', 'Community Extension', 'Others'];
  
//   const filteredData = getTabFilteredRequests();
  
//   // Get count of past due requests for tab indicator
//   const getPastDueCount = () => {
//     const allFiltered = getFilteredRequests();
//     return allFiltered.filter(isPastDue).length;
//   };

//   // Get count of non-past due requests for All Requests tab
//   const getAllRequestsCount = () => {
//     const allFiltered = getFilteredRequests();
//     return allFiltered.filter(request => !isPastDue(request)).length;
//   };

//   return (
//     <Layout style={{ minHeight: "100vh" }}>
//       <Layout style={{padding: 20}}>

//             {/* Tab Navigation */}
//             <div className="tab-navigation" style={{ display: 'flex', gap: 0, marginBottom: 20, backgroundColor: 'white', borderRadius: 10, padding: 5 }}>
//               <button
//                 onClick={() => setActiveTab('all')}
//                 style={{
//                   flex: 1,
//                   padding: '12px 24px',
//                   borderRadius: 8,
//                   border: 'none',
//                   backgroundColor: activeTab === 'all' ? '#395a7f' : 'transparent',
//                   color: activeTab === 'all' ? 'white' : '#395a7f',
//                   fontWeight: activeTab === 'all' ? 'bold' : 'normal',
//                   transition: 'all 0.3s ease',
//                   cursor: 'pointer',
//                   fontSize: 16
//                 }}
//               >
//                 All Requests ({getAllRequestsCount()})
//               </button>
//               <button
//                 onClick={() => setActiveTab('pastDue')}
//                 style={{
//                   flex: 1,
//                   padding: '12px 24px',
//                   borderRadius: 8,
//                   border: 'none',
//                   backgroundColor: activeTab === 'pastDue' ? '#395a7f' : 'transparent',
//                   color: activeTab === 'pastDue' ? 'white' : '#395a7f',
//                   fontWeight: activeTab === 'pastDue' ? 'bold' : 'normal',
//                   transition: 'all 0.3s ease',
//                   cursor: 'pointer',
//                   fontSize: 16
//                 }}
//               >
//                 Past Due Requests ({getPastDueCount()})
//               </button>
//             </div>

//             <div className="filter-section" style={{ display: 'flex', gap: 10, padding: 30, borderRadius: 10, backgroundColor: 'white', marginBottom: 20 }}>
//               <div className="filter-buttons" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
//                 {usageTypes.map((type) => (
//                   <button
//                     key={type}
//                     onClick={() => setSelectedFilter(type)}
//                     style={{
//                       padding: '8px 16px',
//                       borderRadius: 8,
//                       border: '1px solid #ccc',
//                       backgroundColor: selectedFilter === type ? '#395a7f' : 'white',
//                       color: selectedFilter === type ? 'white' : '#395a7f',
//                       fontWeight: selectedFilter === type ? 'normal' : 'normal',
//                       transition: 'all 0.3s ease',
//                       cursor: 'pointer',
//                       fontSize: 15
//                     }}
//                   >
//                     {type}
//                   </button>
//                 ))}
//               </div>

//               <input placeholder="Search" className="search-input" value={searchTerm}
//                     onChange={(e) => {
//                     const sanitized = sanitizeInput(e.target.value.toLowerCase());

//                      setSearchTerm(sanitized)}}
//                      />
//             </div>

        
// <Spin spinning={loading} tip="Loading requests...">
//   {!loading && filteredData.length === 0 ? (
//     <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
//       <h3>No Request Found</h3>
//     </div>
//     ) : (
//   <div>
//     {Object.entries(categorizedRequests).map(([label, group]) => {
//       if (group.length === 0) return null;
        
//       const isCollapsed = collapsedGroups[label];
//       const contentRef = contentRefs.current[label] || (contentRefs.current[label] = React.createRef());

//       return (
//         <div key={label} style={{ marginBottom: "2rem", justifyItems: 'flex-start' }}>
//           {/* Group Header */}
//           <div className="group-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: 10 }}>
//             <button
//               onClick={() => toggleGroup(label)}
//               style={{
//                 cursor: 'pointer',
//                 color: "#395a7f",
//                 backgroundColor: 'white',
//                 border: '1px solid #acacac',
//                 padding: 10,
//                 borderRadius: 5,
//                 display: 'flex',
//                 justifyContent: 'space-between',
//                 alignItems: 'center',
//               }}
//             >
//               <h2 style={{ margin: 0, color: '#395a7f', fontWeight: 500 }}>{label}</h2>
//               <div style={{ fontSize: 20, marginLeft: 10 }}>
//                 {isCollapsed ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
//               </div>
//             </button>
//             <h3 style={{ margin: 0 }}>({group.length})</h3>
//           </div>

//           {/* Collapsible Content */}
//           <div
//             ref={contentRef}
//             style={{
//               overflow: 'hidden',
//               transition: 'max-height 0.3s ease, opacity 0.3s ease',
//               maxHeight: isCollapsed ? '0px' : `${contentRef.current?.scrollHeight}px`,
//               opacity: isCollapsed ? 0 : 1,
//               width: '100%',
//             }}
//           >
// {/* {group.map((request) => {
//   const isPastDue = new Date(request.dateRequired) < new Date();

//   return (
//     <div
//       key={request.id}
//       onClick={() => handleViewDetails(request)}
//       className="request-card"
//       style={{border: isPastDue ? '1px solidrgb(209, 168, 255)' : '1px solid #ccc'}}
//     >
//       <div style={{ width: '4%', padding: 10, paddingTop: 0, justifyItems: 'center' }}>
//         <p
//           style={{
//             fontSize: 20,
//             padding: 15,
//             backgroundColor: usageBG(request.usageType),
//             borderRadius: 5,
//             color: 'white',
//             maxWidth: '60px',
//             textAlign: 'center',
//             whiteSpace: 'nowrap'
//           }}
//         >
//           {getInitials(request.usageType)}
//         </p>
//       </div>

//       <div style={{ paddingLeft: 10, width: '100%', paddingTop: 0, paddingBottom: 0 }}>
//         <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
//           <div>
//             <p style={{ fontSize: 23, fontWeight: 500, marginBottom: 5 }}>{capitalizeName(request.userName)}</p>
//             <p style={{ fontSize: 18, color: '#707070' }}>{request.program}</p>
//           </div>

//           <p
//             style={{
//               margin: 0,
//               fontSize: 15,
//               padding: 10,
//               backgroundColor: isPastDue ? '#ffb1a8' : '#e9ecee',
//               borderRadius: 5,
//               color: isPastDue ? 'black' : 'black',
//             }}
//           >
//             <strong>Required Date:</strong> {request.dateRequired}
//           </p>
//         </div>

//         <div style={{ margin: 0 }}>
//           <p style={{ color: '#707070', fontSize: 15, marginBottom: 5 }}>Room: {request.room}</p>
//           <p style={{ color: '#707070', fontSize: 15, marginBottom: 5 }}>{request.usageType}</p>
//           <p style={{ color: '#707070', fontSize: 15, marginBottom: 5 }}>{request.course}{request.courseDescription}</p>
//         </div>
//       </div>
//     </div>
//   );
// })}
//           </div>
//         </div>
//       );
//     })}
//   </div>
// </Spin> */}

//       {group.map((request) => {
//         const isPastDue = new Date(request.dateRequired) < new Date();

//         // Check if this request is the first for any of its items on this date
//       // Disabled if ANY item in this request is not the first request for that item+date
//       // const isDisabled = (request.requestList || []).some(item => {
//       //   const key = `${item.selectedItemId}_${request.dateRequired}`;
//       //   return firstRequestMap[key] !== request.id;  // different request owns that item+date first
//       // });

//        const isApprovalRequested = request.approvalRequested === true || approvalRequestedIds.includes(request.id);
//       const isItemConflict = (request.requestList || []).some(item => {
//         const key = `${item.selectedItemId}_${request.dateRequired}`;
//         return firstRequestMap[key] !== request.id;
//       });

//       const isDisabled = isApprovalRequested || isItemConflict;

//         return (
//           <div
//             key={request.id}
//             onClick={() => !isDisabled && handleViewDetails(request)}
//             className="request-card"
//             style={{
//               opacity: isDisabled ? 0.5 : 1,
//               pointerEvents: isDisabled ? 'none' : 'auto',
//               cursor: isDisabled ? 'not-allowed' : 'pointer',
//               border: isPastDue ? '1px solid rgb(209, 168, 255)' : '1px solid #ccc',
//               backgroundColor: isDisabled ? '#f8f8f8' : 'white',
//             }}
//           >
//             {/* Existing UI content */}
//             <div className="usage-badge" style={{ width: '4%', padding: 10, paddingTop: 0, justifyItems: 'center' }}>
//               <p
//                 style={{
//                   fontSize: 20,
//                   padding: 15,
//                   backgroundColor: usageBG(request.usageType),
//                   borderRadius: 5,
//                   color: 'white',
//                   maxWidth: '60px',
//                   textAlign: 'center',
//                   whiteSpace: 'nowrap'
//                 }}
//               >
//                 {getInitials(request.usageType)}
//               </p>
//             </div>

//             <div className="card-content" style={{ paddingLeft: 10, width: '100%', paddingTop: 0, paddingBottom: 0 }}>
//               <div className="user-info" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
//                 <div>
//                   <p className="user-name" style={{ fontSize: 23, fontWeight: 500, marginBottom: 5 }}>{capitalizeName(request.userName)}</p>
//                   <p className="program" style={{ fontSize: 18, color: '#707070' }}>{request.program}</p>
//                 </div>

//                 <p
//                   className="required-date"
//                   style={{
//                     margin: 0,
//                     fontSize: 15,
//                     padding: 10,
//                     backgroundColor: isPastDue ? '#ffb1a8' : '#e9ecee',
//                     borderRadius: 5,
//                     color: 'black',
//                   }}
//                 >
//                   <strong>Required Date:</strong> {request.dateRequired}
//                 </p>
//               </div>

//               <div style={{ margin: 0 }}>
//                 <p className="room" style={{ color: '#707070', fontSize: 15, marginBottom: 5 }}>Room: {request.room}</p>
//                 <p className="usage-type" style={{ color: '#707070', fontSize: 15, marginBottom: 5 }}>{request.usageType}</p>
//                 <p className="course" style={{ color: '#707070', fontSize: 15, marginBottom: 5 }}>{request.course}{request.courseDescription}</p>

//                 <div className="item-list">
//                   {request.requestList?.map((item, index) => {
//                     const key = `${item.selectedItemId}_${request.dateRequired}`;
//                     const position = requestOrderMap?.[request.id]?.[key];

//                     return (
//                       <p
//                         key={index}
//                         style={{ color: '#5a5a5a', fontSize: 13, marginBottom: 2 }}
//                       >
//                         • {item.itemName} - #{position ?? 'N/A'} to request
//                       </p>
//                     );
//                   })}
//                 </div>
//               </div>

//               {/* {isDisabled && (
//                 <div style={{ color: 'red', fontSize: 14, marginTop: 5 }}>
//                   Request blocked (already requested by someone else for this date and item)
//                 </div>
//               )} */}

//               {isItemConflict && (
//                 <div style={{ color: 'red', fontSize: 14, marginTop: 5 }}>
//                   Request blocked (already requested by someone else for this date and item)
//                 </div>
//               )}

//               {isApprovalRequested && (
//                 <div style={{ color: 'orange', fontSize: 14, marginTop: 5 }}>
//                   Waiting for Approval for Dean
//                 </div>
//               )}
//             </div>
//           </div>
//         );
//       })}

//                 </div>
//               </div>
//             );
//           })}
//         </div>
//          )}
//         </Spin>


//         <Modal
//           title="Reject Reason"
//           visible={isRejectModalVisible}
//           onCancel={() => setIsRejectModalVisible(false)}
//           onOk={handleRejectSubmit}
//           zIndex={1030}
//         >
//           <Input.TextArea
//             rows={4}
//             value={rejectReason}
//             onChange={(e) => setRejectReason(e.target.value)}
//             placeholder="Please provide a reason for rejection"
//           />
//         </Modal>



//         {isMultiRejectModalVisible && (
//           <Modal
//             title="Provide Reasons for Unchecked Items"
//             open={isMultiRejectModalVisible}
//             zIndex={1023}
//             width={'40%'}
//             onCancel={() => {
//               setIsMultiRejectModalVisible(false);
//               setApproveLoading(false);
//             }}
//             footer={[
//               <Button key="cancel" onClick={() => {
//                 setIsMultiRejectModalVisible(false);
//                 setApproveLoading(false);
//               }} disabled={multiRejectLoading}>
//                 Cancel
//               </Button>,

//               <Button key="confirm" type="primary" onClick={handleOpenFinalizeModal} loading={multiRejectLoading}>
//                 Confirm
//               </Button>,
//             ]}
//           >
//             <Table
//               dataSource={pendingApprovalData?.uncheckedItems || []}
//               columns={columnsRejection1}
//               rowKey={(record, index) => `multi-reject-${index}`}
//               pagination={false}
//             />
//           </Modal>
//         )}

//         {isFinalizeModalVisible && (
//           <Modal
//             title="Finalize Order"
//             open={isFinalizeModalVisible}
//             zIndex={1024}
//             width={'50%'}
//             onCancel={() => {
//               setIsFinalizeModalVisible(false);
//               setApproveLoading(false);
//             }}
//             footer={[
//               <Button key="back" onClick={() => {
//                 setIsFinalizeModalVisible(false);
//                 setApproveLoading(false);
//               }} disabled={rejectLoading}>
//                 Cancel
//               </Button>,
//               <Button key="submit" type="primary" onClick={handleRejectConfirm} loading={rejectLoading}>
//                 Finalize
//               </Button>,
//             ]}
//           >
//             <p>Please review your selections below before finalizing your order:</p>

//             <h3>✅ Approved Items</h3>
//             <Table
//               dataSource={pendingApprovalData?.enrichedItems || []}
//               columns={[
//                 {
//                   title: 'Item Name',
//                   dataIndex: 'itemName',
//                   key: 'itemName',
//                 },
//                 {
//                   title: 'Item Description',
//                   dataIndex: 'itemDetails',
//                   key: 'itemDetails',
//                 },
//                 // {
//                 //   title: 'Quantity',
//                 //   dataIndex: 'quantity',
//                 //   key: 'quantity',
//                 // },
//                 {
//                   title: 'Quantity',
//                   dataIndex: 'quantity',
//                   key: 'quantity',
//                   render: (text, record, index) => {
//                     // Find the corresponding item in editableItems by selectedItemId
//                     const editedItem = editableItems?.find(item => item?.selectedItemId === record.selectedItemId);
//                     const valueFromEditable = editedItem?.quantity;
//                     return <span>{valueFromEditable ?? text}</span>;
//                   },
//                 }
                
//               ]}
//               rowKey={(record, index) => `approved-${index}`}
//               pagination={false}
//             />

//             <h3 style={{ marginTop: 24 }}>❌ Rejected Items</h3>
//             <Table
//               dataSource={pendingApprovalData?.uncheckedItems || []}
//               columns={columnsRejection1} 
//               rowKey={(record, index) => `rejected-${index}`}
//               pagination={false}
//             />
//           </Modal>
//         )}

//         <RequisitionRequestModal
//           isModalVisible={isModalVisible}
//           handleCancel={handleCancel}
//           handleApprove={handleApprove}
//           handleReturn={handleReject}
//           selectedRequest={selectedRequest}
//           columns={columns}
//           formatDate={formatDate}
//           allItemsChecked={allItemsChecked} 
//           college={selectedCollege} 
//           approveLoading={approveLoading}
//           rejectLoading={rejectLoading}
//           editableItems={editableItems}
//           setEditableItems={setEditableItems}
//           checkedItems={checkedItems}
//           userViolationCounts={userViolationCounts}
//         />

//         <ApprovedRequestModal
//           isApprovedModalVisible={isApprovedModalVisible}
//           setIsApprovedModalVisible={setIsApprovedModalVisible}
//           selectedApprovedRequest={selectedApprovedRequest}
//           setSelectedApprovedRequest={setSelectedApprovedRequest}
//           columns={columns}
//           formatDate={formatDate}
//         />

//         <NotificationModal
//           isVisible={isNotificationVisible}
//           onClose={() => setIsNotificationVisible(false)}
//           message={notificationMessage}
//         />
//       </Layout>
//     </Layout>
//   );
// };

// export default PendingRequest;

