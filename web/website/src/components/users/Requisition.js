import React, { useState, useEffect, useCallback } from "react";
import {Layout,Input,Table,Button,DatePicker,TimePicker,message,Select,Typography} from "antd";
import { DeleteOutlined, PlusSquareFilled, FormOutlined} from "@ant-design/icons";
import moment from "moment";
import dayjs from 'dayjs';
import { useLocation, useNavigate } from "react-router-dom";
import { collection, addDoc, Timestamp, getDocs, updateDoc, doc, deleteDoc,setDoc, getDoc, serverTimestamp, onSnapshot, collectionGroup,query,where, orderBy } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth } from 'firebase/auth';
import { db } from "../../backend/firebase/FirebaseConfig";
import "../styles/usersStyle/Requisition.css";
import SuccessModal from "../customs/SuccessModal";
import TodayRequestModal from "../customs/TodayRequestModal";
import PoliciesModal from "../Policies";
import FinalizeRequestModal from "../customs/FinalizeRequestModal";
import NotificationModal from "../customs/NotificationModal";
import WarningModal from "../customs/WarningModal";
import "../styles/usersStyle/ActivityLog.css";

const sanitizeInput = (input) =>
  input.replace(/\s+/g, " ")        
      .replace(/[^a-zA-Z0-9\s\-.,()]/g, "");
  
const { Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

const Requisition = () => {
  const [requestList, setRequestList] = useState([]);
  const [dateRequired, setDateRequired] = useState(null);
  const [timeFrom, setTimeFrom] = useState(null);
  const [timeTo, setTimeTo] = useState(null);
  const [isFinalizeVisible, setIsFinalizeVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showTodayRequestModal, setShowTodayRequestModal] = useState(false);
  const [todayRequestCount, setTodayRequestCount] = useState(0);
  const [programError, setProgramError] = useState(false);
  const [courseError, setCourseError] = useState(false);
  const [usageError, setUsageError] = useState(false);
  const [roomError, setRoomError] = useState(false);
  const [program, setProgram] = useState("");
  const [course, setCourse] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [usageType, setUsageType] = useState("");
  const [room, setRoom] = useState("");
  const [reason, setReason] = useState("");
  const [customUsageType, setCustomUsageType] = useState("");
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [isFinalizeModalVisible, setIsFinalizeModalVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [showPolicies, setShowPolicies] = useState(false);
  const [isWarningModalVisible, setIsWarningModalVisible] = useState(false);
  const [daysDifference, setDaysDifference] = useState(0);
  const [isWarningFromDateSelection, setIsWarningFromDateSelection] = useState(false);
  const [mergedData, setMergedData] = useState([]);
  const [finalizeLoading, setFinalizeLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [liabilityAccepted, setLiabilityAccepted] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const checkDateWarning = (selectedDate) => {
    if (!selectedDate) return false;
    
    const today = moment().startOf('day');
    const selected = moment(selectedDate, "YYYY-MM-DD").startOf('day');
    const daysDiff = selected.diff(today, 'days');
    
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
        } else {
          // Just increment warning count
          await updateDoc(userDoc.ref, {
            warningCount: newWarningCount
          });
        }
      }
    } catch (error) {
      console.error('Error incrementing warning count:', error);
    }
  };
  const auth = getAuth();

  //history log state and hooks
  const [activityData, setActivityData] = useState([]);
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
    const [departmentsAll, setDepartmentsAll] = useState([]);
    const [searchDepartment, setSearchDepartment] = useState("");

  const [tableData, setTableData] = useState([
    { key: 0, selectedItemId: null }, 
  ]);
  
  useEffect(() => {

    const allItemFieldsValid = mergedData.length > 0 && mergedData.every(item =>
      item.itemName &&
      item.itemDetails &&
      item.category &&
      item.quantity &&
      item.labRoom &&
      item.status &&
      // Only require condition if category is NOT Chemical or Reagent
      (item.category === "Chemical" || item.category === "Reagent" ? true : item.condition) &&
      item.department &&
      (["Chemical", "Reagent"].includes(item.category) ? (item.unit && item.unit.trim() !== "") : true)
    );
  
    const timeValid = timeFrom && timeTo &&
      new Date(`1970-01-01T${timeFrom}`) < new Date(`1970-01-01T${timeTo}`);
  
    const formComplete = dateRequired && program && course && usageType && room && timeValid;
  
    setIsFormValid(formComplete && allItemFieldsValid);
  }, [dateRequired, program, course, usageType, room, timeFrom, timeTo, mergedData]);  

  useEffect(() => {
    const storedRequestList = JSON.parse(localStorage.getItem('requestList'));
    if (storedRequestList) {
      setRequestList(storedRequestList);
    }
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    if (!userId) return;

    const tempRequestRef = collection(db, "accounts", userId, "temporaryRequests");

    const unsubscribe = onSnapshot(
      tempRequestRef,
      (querySnapshot) => {
        const tempRequestList = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            selectedItem: {
              value: data.selectedItemId,
              label: data.selectedItemLabel, // restore label
            },
          };
        });

        setRequestList(tempRequestList);
        localStorage.setItem("requestList", JSON.stringify(tempRequestList));
      },
      (error) => {
       
      }
    );

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, []);


  useEffect(() => {
    setItemsLoading(true);
    const unsubscribe = onSnapshot(collection(db, "inventory"), async (inventorySnapshot) => {
      const now = new Date();
      const validItems = [];

      for (const doc of inventorySnapshot.docs) {
        const itemData = doc.data();
        const stockLogRef = collection(db, "inventory", doc.id, "stockLog");

        // Fetch the stockLog subcollection for this inventory item
        const stockSnapshot = await getDocs(stockLogRef);

        let hasValidStock = false;

        for (const logDoc of stockSnapshot.docs) {
          const logData = logDoc.data();
          const expiryRaw = logData.expiryDate;

          if (!expiryRaw) {
            hasValidStock = true;
            break;
          }

          const expiryDate = typeof expiryRaw === "string"
            ? new Date(expiryRaw)
            : expiryRaw?.toDate?.() || new Date(expiryRaw);

          if (isNaN(expiryDate.getTime())) continue;

          if (expiryDate >= now) {
            hasValidStock = true;
            break;
          }
        }

        if (hasValidStock && itemData.status !== "out of stock" && itemData.status !== "in use") {
          validItems.push({
            id: doc.id,
            ...itemData
          });
        }
      }

      setItems(validItems);
      setFilteredItems(validItems);
      setItemsLoading(false);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  useEffect(() => {
    // Load the saved request list and table data from localStorage
    const savedRequestList = localStorage.getItem("requestList");
    const savedTableData = localStorage.getItem("tableData");
  
    if (savedRequestList) {
      setRequestList(JSON.parse(savedRequestList));
    }
  
    if (savedTableData) {
      const parsedTableData = JSON.parse(savedTableData);
      // If saved table data is empty, ensure we have at least one empty row
      if (parsedTableData.length === 0) {
        setTableData([{ key: 0, selectedItemId: null }]);
      } else {
        setTableData(parsedTableData);
      }
    }
    // If no saved table data, keep the initial empty row from useState
  }, []); 

  useEffect(() => {
    if (location.state?.loginSuccess === true) {
      setShowModal(true);
    }
  }, [location.state]);

  useEffect(() => {
    const handleBackButton = (event) => {
      event.preventDefault();
      window.history.pushState(null, "", window.location.href);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, []);
  
  useEffect(() => {
    if (location.state?.loginSuccess === true) {
      sessionStorage.setItem("isLoggedIn", "true");
  
      const newState = { ...location.state };
      delete newState.loginSuccess;
      navigate(location.pathname, { replace: true, state: newState });
    }

  }, [location.state, navigate]);  

  /* ---------- Check for today's requests ---------- */
  useEffect(() => {
    const checkTodaysRequests = async () => {
      const userId = localStorage.getItem("userId");

      if (!userId) {
        return;
      }

      try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Query user's approved requests from historylog collection
        const historyLogRef = collection(db, `accounts/${userId}/historylog`);
        const q = query(historyLogRef, where("action", "==", "Request Approved"));
        const querySnapshot = await getDocs(q);
        
        let todayCount = 0;
        
        // Check approved requests from historylog for required date
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Check if the required date is today
          if (data.dateRequired === todayStr) {
            todayCount++;
          }
        });
        
        setTodayRequestCount(todayCount);
        
        if (todayCount > 0 && location.state?.loginSuccess) {
          setTimeout(() => {
            setShowTodayRequestModal(true);
          }, 2000);
        }
      } catch (error) {
        console.error("Error checking today's requests:", error);
      }
    };

    checkTodaysRequests();
  }, [location.state?.loginSuccess]);

    useEffect(() => {
      const departmentsCollection = collection(db, "departments");

      // Only get departments where college == "SAH"
      const q = query(departmentsCollection, where("college", "==", "SAH"));

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const deptList = querySnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
          setDepartmentsAll(deptList);
        },
        (error) => {
          console.error("Error fetching SAH departments in real-time:", error);
        }
      );

      return () => unsubscribe();
    }, []);

  const closeModal = () => {
    setShowModal(false);         // Close success modal
    setShowPolicies(true);       // Open policies modal next
  };

  const closeTodayRequestModal = () => setShowTodayRequestModal(false);
  
  const closePolicies = () => {
    setShowPolicies(false);      // Close policies modal
  };

  const handleOpenModal = (message) => {
    setModalMessage(message);
    setIsModalVisible(true);
  };

  const mergeData = useCallback(() => {
    const merged = [
      ...tableData,
      ...requestList.filter(item => !tableData.some(t => t.selectedItemId === item.selectedItemId)),
    ];

    setMergedData(merged);
  }, [tableData, requestList]);
  

  useEffect(() => {
    mergeData(); 
  }, [mergeData]);

  const logRequestOrReturn = async (userId, userName, action, requestDetails) => {
    await addDoc(collection(db, `accounts/${userId}/activitylog`), {
      action, 
      userName,
      timestamp: serverTimestamp(),
      requestList: requestDetails, 
    });
  };  

  const finalizeRequest = async () => {
    setFinalizeLoading(true);
    let isValid = true;
    let idsToRemove = [];
  
    if (!dateRequired) {
      setNotificationMessage("Please select a date!.");
      setIsNotificationVisible(true);
      isValid = false;
    }
  
    if (!program) {
      setProgramError(true);
      isValid = false;

    } else {
      setProgramError(false);
    }

    if (!course) {
      setCourseError(true);
      isValid = false;

    } else {
      setCourseError(false);
    }

    if (!usageType) {
      setUsageError(true);
      isValid = false;

    } else {
      setUsageError(false);
    }
  
    if (!room) {
      setRoomError(true);
      isValid = false;

    } else {
      setRoomError(false);
    }

    if (usageType === "Others" && !customUsageType.trim()) {
      setNotificationMessage("Please specify the usage type.");
      setIsNotificationVisible(true);
      isValid = false;
    }

    if (!timeFrom || !timeTo) {
      setNotificationMessage("Please select both 'Time From' and 'Time To'!");
      setIsNotificationVisible(true);

      isValid = false;

    } else if (new Date(`1970-01-01T${timeFrom}`) >= new Date(`1970-01-01T${timeTo}`)) {
      setNotificationMessage("'Time From' must be earlier than 'Time To'!");
      setIsNotificationVisible(true);
      isValid = false;
    }
    
    if (mergedData.length === 0) {
      setNotificationMessage("Please add items to the request list!");
      setIsNotificationVisible(true);
      isValid = false;
    }

    const normalizedData = mergedData.map(item => {
      if (
        item.category !== "Chemical" &&
        item.category !== "Reagent" &&
        (!item.unit || item.unit === null || item.unit === "")
      ) {

        return {...item, unit: "N/A"};
      }

      return item;
    });


  const filteredMergedData = normalizedData.filter(item => {
    const basicFieldsValid =
      item.itemName &&
      item.itemDetails &&
      item.category &&
      item.quantity &&
      item.labRoom &&
      item.status &&
      item.department;

    if (item.category === "Chemical" || item.category === "Reagent") {
      return basicFieldsValid; 
    } else {
      const conditionValid = !!item.condition;
      return basicFieldsValid && conditionValid;
    }
  });

  if (filteredMergedData.length !== normalizedData.length) {
    setNotificationMessage("Please complete all required item fields before finalizing.");
    setIsNotificationVisible(true);
    isValid = false;
  }

  const sanitizeData = (data) => {
    return data.map(item => {
      const cleanItem = {};
      Object.entries(item).forEach(([key, value]) => {
        cleanItem[key] = value === undefined ? null : value;
      });

      return cleanItem;
    });
  };

  const sanitizedFilteredData = sanitizeData(filteredMergedData);

  if (!isValid) return; // Stop if validation failed

    if (isValid) {
      try {
        const userId = localStorage.getItem("userId");
        const department = localStorage.getItem("userDepartment");
  
        if (userId) {
          // Fetch the user's name from the accounts collection
          const userDocRef = doc(db, "accounts", userId);
          const userDocSnapshot = await getDoc(userDocRef);
  
          if (!userDocSnapshot.exists()) {
            message.error("User not found.");
            return;
          }
  
          const userName = userDocSnapshot.data().name;

          const finalUsageType = usageType === "Others" ? customUsageType : usageType;
  
          // Add data to the user's requests collection
          const userRequestRef = collection(db, "accounts", userId, "userRequests");
          const requestData = {
            dateRequired,
            timeFrom,
            timeTo,
            program,
            course,
            courseDescription,
            usageType: finalUsageType,
            room,
            reason,
            filteredMergedData: sanitizedFilteredData,
            userName,
            department,
            timestamp: Timestamp.now(),
          };
  
          const newUserDocRef = await addDoc(userRequestRef, requestData);
          const generatedId = newUserDocRef.id;
          await updateDoc(newUserDocRef, { iid: generatedId });
  
          const userRequestsRootRef = doc(db, "userrequests", generatedId);
          await setDoc(userRequestsRootRef, {
            ...requestData,
            accountId: userId,
          });

          await addDoc(collection(db, "allNotifications"), {
            action: `New requisition submitted by ${userName}`,
            userId: userId,
            userName: userName,
            read: false,
            timestamp: serverTimestamp()
          });

          await logRequestOrReturn(userId, userName, "Requested Items", sanitizedFilteredData); 
  
          const tempRequestRef = collection(db, "accounts", userId, "temporaryRequests");
          const querySnapshot = await getDocs(tempRequestRef);
  
          const deletionPromises = [];
  
          querySnapshot.forEach((docSnapshot) => {
            const itemData = docSnapshot.data();
            idsToRemove.push(itemData.id);
  
            const pendingRequestRef = collection(db, "accounts", userId, "pendingrequest");
  
            deletionPromises.push(
              (async () => {
                // Add to pending requests
                await addDoc(pendingRequestRef, itemData);
  
                // Delete from temporaryRequests
                await deleteDoc(doc(db, "accounts", userId, "temporaryRequests", docSnapshot.id));
  
                // Delete from pendingRequest if already exists
                const pendingRequestDocs = await getDocs(pendingRequestRef);
                pendingRequestDocs.forEach((pendingDoc) => {
                  if (pendingDoc.data().id === itemData.id) {
                    deletionPromises.push(deleteDoc(doc(db, "accounts", userId, "pendingrequest", pendingDoc.id)));
                  }
                });
              })()
            );
          });
  
          await Promise.all(deletionPromises);
  
          // Filter out removed items from requestList
          const updatedRequestList = mergedData.filter((item) => !idsToRemove.includes(item.id));
          setRequestList(updatedRequestList);
          localStorage.setItem('requestList', JSON.stringify(updatedRequestList));
  
          setNotificationMessage("Requisition sent successfully!");
          setIsNotificationVisible(true);

          try {
            
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
                  type: 'request_submitted'
                }
              }),
            });

            if (response.ok) {
              const result = await response.json();

            } else {
              const error = await response.json();
              console.error('❌ Backend notification error:', error);
            }
          } catch (error) {
            console.error('❌ Error calling backend notification API:', error);
          }

          setIsFinalizeVisible(false);
  
          clearTableData();
          setDateRequired(null);
          setTimeFrom(null);
          setTimeTo(null);
          setProgram("");
          setCourse("");
          setUsageType("");
          setRoom("");
          setReason("");
           setCourseDescription("");
          setRequestList([]);
          setMergedData([]);
          setTableData([]); 


          localStorage.removeItem('requestList');

        } else {
          message.error("User is not logged in.");
        }
  
      } catch (error) {

        message.error("Failed to send requisition. Please try again.");
      } finally {
        setFinalizeLoading(false);
      }
    }
  };  

  const removeFromList = async (id) => {
    try {
      const updatedList = requestList.filter((item) => item.selectedItemId !== id);
      const updatedTableData = tableData.filter((item) => item.selectedItemId !== id);
  
      // Update local state
      setRequestList(updatedList);
      setTableData(updatedTableData);

      localStorage.setItem("requestList", JSON.stringify(updatedList));
      localStorage.setItem("tableData", JSON.stringify(updatedTableData));
  
      const userId = localStorage.getItem("userId"); 
      if (!userId) {

        return;
      }
  
      // Check Firestore and remove the item
      const tempRequestRef = collection(db, "accounts", userId, "temporaryRequests");
      const querySnapshot = await getDocs(tempRequestRef);
      let foundInFirestore = false;
  
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        if (data.id === id) {
          // Remove the item from Firestore
          await deleteDoc(docSnapshot.ref);
          foundInFirestore = true;
          break;
        }
      }
  
    } catch (error) {

      setNotificationMessage("Something went wrong while removing the item.");
      setIsNotificationVisible(true);
    }
  };  

  const handleItemSelect = async (selected, index) => {
    const { value: itemId } = selected;
    const selectedItem = JSON.parse(JSON.stringify(items.find(item => item.id === itemId)));

    const previousItemId = tableData[index]?.selectedItemId;

    const newRow = {
      selectedItem: {
        value: itemId,
        label: selectedItem.itemName,
      },
      selectedItemId: itemId,
      itemName: selectedItem.itemName,
      itemDetails: selectedItem.itemDetails,
      category: selectedItem.category,
      quantity: tableData[index]?.quantity || 1,
      labRoom: selectedItem.labRoom,
      status: selectedItem.status,
      condition: selectedItem.condition,
      department: selectedItem.department,
      unit: selectedItem.unit || null,
    };

    // Update tableData
    let updatedData = [...tableData];
    if (updatedData[index]) {
      updatedData[index] = newRow;

    } else {
      updatedData.push(newRow); // Add new item
    }

    setTableData(updatedData);
    localStorage.setItem("tableData", JSON.stringify(updatedData));

    // Update requestList
    let updatedRequestList = [...requestList];
    if (updatedRequestList[index]) {
      updatedRequestList[index] = newRow;

    } else {
      updatedRequestList.push(newRow);
    }
    setRequestList(updatedRequestList);
    localStorage.setItem("requestList", JSON.stringify(updatedRequestList));

    mergeData();

    const userId = localStorage.getItem("userId");

    if (userId) {
      try {
        const tempRequestRef = doc(db, "accounts", userId, "temporaryRequests", itemId);

        if (previousItemId && previousItemId !== itemId) {
          const previousRef = doc(db, "accounts", userId, "temporaryRequests", previousItemId);
          await deleteDoc(previousRef);
        }

        // Save including volume
        await setDoc(tempRequestRef, {
          ...selectedItem,
          id: itemId,
          selectedItemId: itemId,
          selectedItemLabel: selectedItem.itemName,
          quantity: newRow.quantity,
          // volume: newRow.volume, // <-- explicitly save volume here
          timestamp: Timestamp.fromDate(new Date()),
          unit: selectedItem.unit || null,
        });

      } catch (error) {

        setNotificationMessage("Failed to update item in temporary list.");
        setIsNotificationVisible(true);
      }
    }
  };

  const clearTableData = () => {
    setTableData([{ key: 0, selectedItemId: null }]); 
    setRequestList([]); 
    setLiabilityAccepted(false); 
    localStorage.removeItem("tableData"); 
    localStorage.removeItem("requestList"); 
  };  
  
  useEffect(() => {
    mergeData();
  }, [requestList, tableData]);
  
  const courseDescriptions = {
    MLSACHML: "Analytical Chemistry",
    MLSBIEPC: "Biostatistics and Epidemiology",
    MLSAUBFC: "Analysis of Urine and other body Body Fluids",
    MLSHEM2L: "Hematology 2",
    MLSHPATL: "General Pathology with Histopathologic and Cytologic Techniuques",
    MLSIMHEL: "Immunohematology",
    MLSMOLBL: "Molecular Biology and Diagnostics",
    MLSMYVIL: "Mycology and Virology",
    MLSPARAL: "Clinical Parasitology",
    MLSPML2L: "Principles of Medical Laboratory Science Practice 2",
  };

  const columns = [
    {
      title: "Item Name",
      dataIndex: "selectedItemId",
      key: "selectedItemId",
      render: (value, record, index) => {
        const selectedIds = mergedData
          .filter((_, i) => i !== index)
          .map((row) => row.selectedItemId);

        return (
          <Select
            showSearch
            placeholder="Select item"
            style={{ width: 100 }}
            dropdownStyle={{ width: 700 }}
            optionFilterProp="label"
            labelInValue
            value={record.selectedItem || undefined}
            onChange={(selected) => handleItemSelect(selected, index)}
            filterOption={(input, option) => {
              const searchText = input.toLowerCase();
              const labelText = option?.label?.toLowerCase() || '';
              const childrenText = option?.children?.toLowerCase() || '';
              return labelText.includes(searchText) || childrenText.includes(searchText);
            }}
            loading={itemsLoading}
            notFoundContent={itemsLoading ? "Loading items..." : "No items found"}
          >
            {filteredItems
              .filter(
                (item) => item.status !== "out of stock" && item.status !== "in use"
              )
              .sort((a, b) =>
                a.itemName.localeCompare(b.itemName, undefined, { sensitivity: "base" })
              )
              .map((item) => {
                const label = `${item.itemName} | ${item.itemDetails} | ${item.category} | Qty: ${item.quantity} | ${
                  ["Chemical", "Reagent"].includes(item.category) && item.unit
                    ? ` ${item.unit}`
                    : ""
                } | ${item.status.toUpperCase()} | ${item.department}`;
                // const isDisabled = selectedIds.includes(item.id);

                const isDisabled = selectedIds.includes(item.id) || item.quantity === 0;

                return (
                  <Select.Option
                    key={item.id}
                    value={item.id}
                    label={item.itemName}
                    disabled={isDisabled}
                  >
                    {label}
                  </Select.Option>
                );
              })}
          </Select>
        );
      },
    },
    {
      title: "Item Description",
      dataIndex: "itemDetails",
      key: "itemDetails",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (value, record) => (
        <Input
          type="number"
          min={1}
          value={record.quantity}
          onChange={async (e) => {
            const newQuantity = Number(e.target.value);

            // Fetch inventory details to validate the quantity
            const inventoryRef = collection(db, "inventory");
            const inventorySnapshot = await getDocs(inventoryRef);
            const inventoryItem = inventorySnapshot.docs.find(doc => doc.id === record.selectedItemId);

            // Check if inventory item exists and compare the quantity
            if (inventoryItem) {
              const availableQuantity = inventoryItem.data().quantity; // Assuming the quantity field exists in inventory

              if (newQuantity <= availableQuantity) {
                // Update local tableData if valid
                const updated = tableData.map((row) =>
                  row.selectedItemId === record.selectedItemId ? { ...row, quantity: newQuantity } : row
                );

                setTableData(updated);

                // Update requestList too
                const updatedRequestList = requestList.map((row) =>
                  row.selectedItemId === record.selectedItemId ? { ...row, quantity: newQuantity } : row
                );
                
                setRequestList(updatedRequestList);
                localStorage.setItem("requestList", JSON.stringify(updatedRequestList));

                // Update Firestore
                const userId = localStorage.getItem("userId");
                if (userId) {
                  const tempRequestRef = collection(db, "accounts", userId, "temporaryRequests");

                  // Find the doc with this item's ID
                  const snapshot = await getDocs(tempRequestRef);
                  const docToUpdate = snapshot.docs.find(doc => doc.data().selectedItemId === record.selectedItemId);

                  if (docToUpdate) {
                    await updateDoc(doc(db, "accounts", userId, "temporaryRequests", docToUpdate.id), {
                      quantity: newQuantity,
                    });
                  }
                }

              } else {
                // Use the custom notification modal
                handleOpenModal(`Cannot request more than the available quantity (${availableQuantity})`);
              }

            } else {

            }
          }}
        />
      ),
    },
    {
      title: "Unit",
      dataIndex: "unit",
      key: "unit",
      render: (text, record) => {
        // Show unit only if category is Chemical or Reagent
        if (["Chemical", "Reagent"].includes(record.category)) {
          return text || "N/A";
        }
        return "-";
      }
    },
    {
      title: "Lab Room",
      dataIndex: "labRoom",
      key: "labRoom",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => status?.toUpperCase() || status,
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeFromList(record.selectedItemId)}
        />
      ),
    },
  ];

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

  const handleAddRow = () => {
    if (tableData.length >= 10) {
      setModalMessage("You can only add up to 10 items.");
      setIsModalVisible(true);
      return;
    }

    const lastRow = tableData[tableData.length - 1];

    if (!lastRow || lastRow.selectedItemId) {
      setTableData([...tableData, { key: Date.now(), selectedItemId: null }]);
      
    } else {
      setModalMessage("Please select an item in the last row first.");
      setIsModalVisible(true);
    }
  };

  //History Log Functions

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
              action: action,
              by: by,
              fullData: data,
            };
          });
    
          const sortedLogs = logs.sort((a, b) => b.rawDate - a.rawDate);
          setActivityData(sortedLogs);
        },
        (error) => {
         
        }
      );
    
      // Cleanup the listener when the component unmounts
      return () => unsubscribe();
    }, []);

  return (

    
    <Layout className="main-req-layout" style={{ minHeight: "120vh", height: 'auto', padding: 20}}>
 
                         <div className="header-section" style={{            
                  background: "linear-gradient(135deg, #0b2d39 0%, #165a72 100%)",
                  borderRadius: "16px",
                  padding: "32px",
                  boxShadow: "0 8px 32px rgba(11, 45, 57, 0.15)",
                  border: "1px solid rgba(255, 255, 255, 0.1)"}}>
                <h1 style={{
                  color: "#ffffff",
                  fontSize: "28px",
                  fontWeight: "700",
                  // margin: "0 0 8px 0",
                  textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)"
                }}>
                  Requisition Page
                </h1>
      <p 
        style={{ color: "#a8d5e5", fontSize: "16px", marginTop: "8px", display: "block", fontWeight: 500, marginBottom: 0 }}
      >
       Create and submit your requisitions for supplies or equipment through this page. You can also check the progress of your requests and keep track of past submissions on the Status Page.
      </p>
</div>
    <div className="page-sections" style={{ display: "flex", flexDirection: "column", gap: "0",height:"100vh" }}>

         <div className="section requisition-form">

          <div className="upper-requisition">
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <PlusSquareFilled style={{fontSize: 25, color: '#1e7898'}}/>
          <h1 style={{margin: 0, padding: 0, color: '#1e7898'}}>Add items to your list</h1>
          </div>

          <ul style={{marginTop: 10, fontSize: 16, fontWeight: 400, padding: 15, marginLeft: 20}}>
            <li style={{margin: 5}}>Click the text field under the item name and search for the item you need.</li>
            <li style={{margin: 5}}>In the quantity column, specify the amount you need.</li>
            <li style={{margin: 5}}>Click "Add Item Row" to add another item.</li>
            <li style={{margin: 5}}>Once all items are added, proceed to fill out the form below.</li>
          </ul>

          <div className="request-details">
            <div className="dropdowns" style={{ display: "flex", gap: "20px" }}>
                {/* Category Dropdown */}
                <select
                    value={searchCategory}
                   onChange={(e) => {
                    const selectedCategory = sanitizeInput(e.target.value);
                    setSearchCategory(selectedCategory);
                      if (selectedCategory === "") {
                        setFilteredItems(items);
                      } else {
                        const filteredData = items.filter(item => item.category === selectedCategory);
                        setFilteredItems(filteredData);
                      }
                    }}
                    style={{
                      width: "200px",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  >
                    <option value="">All Categories</option>
                    <option value="Chemical">Chemical</option>
                    <option value="Reagent">Reagent</option>
                    <option value="Materials">Materials</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Glasswares">Glasswares</option>
                  </select>
                </div>

                <div style={{ overflow: "auto", marginBottom: 50}}>
                  <Table
                    className="requisition-table"
                    dataSource={mergedData}
                    columns={columns}
                    pagination={false}
                  />

                    <Button
                      type="primary"
                      onClick={handleAddRow}
                      className="add-item-row-btn"
                    >
                      Add Item Row
                    </Button>
                </div>
                </div>
        
          <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 50}}>
          <FormOutlined style={{fontSize: 25, color: '#1e7898'}}/>
          <div style={{display: 'flex', flexDirection: 'column', gap: 5}}>
          <h1 style={{margin: 0, padding: 0, color: '#1e7898'}}>Requisition Form</h1>
          <p style={{padding: 0 , margin: 0, fontSize: 15}}>Kindly complete and submit the form to process the requisition.</p>
          </div>
          </div>
          
            
            <div className="whole-section" >
              <div className="left-section">
              <div className="date-time-container">

                <div className="date-required">
                  <strong>Date Needed:</strong>
                  <DatePicker
                    value={dateRequired ? dayjs(dateRequired, "YYYY-MM-DD") : null}
                    onChange={(date, dateString) => {
                      setDateRequired(dateString);
                      
                      // Check for 7-day warning immediately when date is selected
                      if (dateString && checkDateWarning(dateString)) {
                        const daysDiff = getDaysDifference(dateString);
                        setDaysDifference(daysDiff);
                        setIsWarningFromDateSelection(true); // Mark this as from date selection
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
                    style={{
                      width: "100%",
                      marginTop: "8px",
                      padding: 8
                    }}
                  />
                  {dateRequired && (
                    <p style={{ marginTop: "8px", fontWeight: "bold", color: "blue" }}>
                      Selected Date: {dateRequired}
                    </p>
                  )}
                </div>

                  <div className="program-container">
                    <strong>Program:</strong>
                        <Select
                          value={program || undefined}
                          onChange={(value) => setProgram(value)}
                          showSearch
                          placeholder="Select or type a program"
                          style={{
                            width: "100%",
                            marginTop: "8px",
                          }}
                          optionFilterProp="children"
                          filterOption={(input, option) =>
                            option?.children.toLowerCase().includes(input.toLowerCase())
                          }
                        >
                          <Option value="SAM - BSMT">SAH - Medical Technology</Option>
                          <Option value="SAH - BSN">SAH - Nursing</Option>
                          <Option value="SAS - Psychology">SAS - Psychology</Option>
                          <Option value="SHS">SHS</Option>
                        </Select>

                    {programError && (
                      <p style={{ color: "red", marginTop: "5px" }}>
                        Please select a program before finalizing.
                      </p>
                    )}
                  </div>


                </div>

                <div className="program-room-container">
                                    <div className="time-required">
                    <strong>Time Needed:</strong>
                    <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                      <TimePicker
                        minuteStep={10}
                        value={timeFrom ? dayjs(timeFrom, "HH:mm") : null}
                        placeholder="From"
                        onChange={(time, timeString) => {
                          setTimeFrom(timeString);
                          setTimeTo(null);
                        }}
                        format="HH:mm"
                        use12Hours={false}
                        style={{ width: "50%" }}
                        hideDisabledOptions
                        disabledHours={() => {
                          // hide hours outside 7–21
                          return [...Array(24).keys()].filter(h => h < 7 || h > 21);
                        }}
                      />

                      <TimePicker
                        minuteStep={10}
                        value={timeTo ? dayjs(timeTo, "HH:mm") : null}
                        placeholder="To"
                        onChange={(time, timeString) => setTimeTo(timeString)}
                        format="HH:mm"
                        use12Hours={false}
                        disabled={!timeFrom}
                        style={{ width: "50%", padding: 8 }}
                        hideDisabledOptions
                        disabledHours={() => {
                          if (!timeFrom) return [];
                          const [startHour] = timeFrom.split(":").map(Number);
                          // hide hours before startHour and outside 7–21
                          return [...Array(24).keys()].filter(h => h < Math.max(7, startHour) || h > 21);
                        }}
                        disabledMinutes={(selectedHour) => {
                          if (!timeFrom) return [];
                          const [startHour, startMinute] = timeFrom.split(":").map(Number);
                          if (selectedHour === startHour) {
                            return Array.from({ length: startMinute }, (_, i) => i);
                          }
                          return [];
                        }}
                      />
                    </div>

                    {timeFrom && timeTo && (
                      <p style={{ marginTop: "8px", fontWeight: "bold", color: "blue" }}>
                        Time Needed: {dayjs(timeFrom, "HH:mm").format("h:mm A")} - {dayjs(timeTo, "HH:mm").format("h:mm A")}
                      </p>
                    )}
                  </div>

                  <div className="room-container">
                    <strong>Room:</strong>
                    <Input
                      type="number"
                      value={room}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Prevent negative numbers
                        if (value.startsWith('-')) {
                          return; // Don't allow negative numbers
                        }
                        setRoom(sanitizeInput(value));
                      }}
                      min="1"
                      placeholder="Enter room number"
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        marginTop: "8px",
                      }}
                    />
                    {roomError && (
                      <p style={{ color: "red", marginTop: "5px" }}>
                        Please enter the room before finalizing.
                      </p>
                    )}
                  </div>
                </div>

                  <div className="usage-container">

                  <div className="program-container">
                
                    <strong>Course Code:</strong>
                 <Select
                    value={course || undefined}
                    onChange={(value) => {
                      setCourse(value);
                      setCourseDescription(courseDescriptions[value] || "");
                    }}
                    showSearch
                    placeholder="Select or type a Course Code"
                    style={{
                      width: "100%",
                      marginTop: "8px",
                    }}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option?.children.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    <Option value="MLSACHML">MLSACHML</Option>
                    <Option value="MLSBIEPC">MLSBIEPC</Option>
                    <Option value="MLSAUBFC">MLSAUBFC</Option>
                    <Option value="MLSHEM2L">MLSHEM2L</Option>
                    <Option value="MLSHPATL">MLSHPATL</Option>
                    <Option value="MLSIMHEL">MLSIMHEL</Option>
                    <Option value="MLSMOLBL">MLSMOLBL</Option>
                    <Option value="MLSMYVIL">MLSMYVIL</Option>
                    <Option value="MLSPARAL">MLSPARAL</Option>
                    <Option value="MLSPML2L">MLSPML2L</Option>
                  </Select>

                    {courseError && (
                      <p style={{ color: "red", marginTop: "5px" }}>
                        Please select a course code before finalizing.
                      </p>
                    )}
                      <strong style={{ marginTop: "12px", display: "block" }}>
                        Course Description:
                      </strong>
                      <input
                        type="text"
                        value={courseDescription}
                        readOnly
                        placeholder="Course description will autofill here"
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                          marginTop: "8px",
                          backgroundColor: "#f9f9f9",
                        }}
                      />

                  </div>
                  
                  <div style={{}}>
                    <strong>Usage Type:</strong>
                    <select
                      value={usageType}
                      onChange={(e) => setUsageType(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        marginTop: "8px",
                      }}
                    >
                      <option value="">Select a Usage Type</option>
                      <option value="Laboratory Experiment">Laboratory Experiment</option>
                      <option value="Research">Research</option>
                      <option value="Community Extension">Community Extension</option>
                      <option value="Others">Others</option>
                    </select>

                    {/* Show error if usageType not selected */}
                    {usageError && (
                      <p style={{ color: "red", marginTop: "5px" }}>
                        Please select a usage type before finalizing.
                      </p>
                    )}

                    {/* Show additional input if 'Others' is selected */}
                    {usageType === "Others" && (
                      <input
                        type="text"
                        placeholder="Please specify"
                        value={customUsageType}
                        onChange={(e) => setCustomUsageType(sanitizeInput(e.target.value))}

                        style={{
                          width: "100%",
                          marginTop: "8px",
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                        }}
                      />
                    )}
                    </div>
                  </div>
            </div>
            
              <div className="reason-container">
                <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                <strong style={{marginBottom: '5px'}}>Note (Optional):</strong>
                <Input.TextArea
                  rows={3}
                  showCount
                  style={{maxHeight: '150px', minHeight: '50px'}}
                  
                  maxLength={100}
                  value={reason}
                   onChange={(e) => setReason(sanitizeInput(e.target.value))}
                  placeholder="Leave a note for the custodian"
                />
                </div>

                    <Button 
                      type="primary"
                      className="finalize-btn"
                      disabled={!isFormValid}
                      onClick={async () => {
                        const hasConflict = await isRoomTimeConflict(room, timeFrom, timeTo, dateRequired);

                        if (hasConflict) {
                          setNotificationMessage("This room is already booked for the selected date and time.");
                          setIsNotificationVisible(true);
                          return;
                        }

                        // Check for 7-day warning
                        if (checkDateWarning(dateRequired)) {
                          const daysDiff = getDaysDifference(dateRequired);
                          setDaysDifference(daysDiff);
                          setIsWarningFromDateSelection(false); // Mark this as from finalize
                          setIsWarningModalVisible(true);
                          return;
                        }

                        setIsFinalizeModalVisible(true);
                        
                      }}
                    >
                      Finalize
                    </Button>
              </div>
            </div>
                   </div>

          <div className="bottom-btns">
            
         <FinalizeRequestModal
          visible={isFinalizeModalVisible}
          onOk={() => {
            finalizeRequest();
            setIsFinalizeModalVisible(false);
          }}
          onCancel={() => {
            setIsFinalizeModalVisible(false);
            setLiabilityAccepted(false);
          }}
          loading={finalizeLoading}
          disabled={cancelLoading}
          dateRequired={dateRequired}
          timeFrom={timeFrom}
          timeTo={timeTo}
          program={program}
          course={course}
          usageType={usageType}
          room={room}
          reason={reason}
          requestList={mergedData}
          liabilityAccepted={liabilityAccepted}
          onLiabilityChange={(e) => setLiabilityAccepted(e.target.checked)}
        />

        <WarningModal
          visible={isWarningModalVisible}
          onOk={async () => {
            setIsWarningModalVisible(false);
            
            // Only increment warning count when user proceeds from finalize, not from date selection
            if (!isWarningFromDateSelection) {
              await incrementWarningCount();
            }
            
            // Check all the same validations as the Finalize button
            const hasConflict = await isRoomTimeConflict(room, timeFrom, timeTo, dateRequired);

            if (hasConflict) {
              setNotificationMessage("This room is already booked for the selected date and time.");
              setIsNotificationVisible(true);
              return;
            }

            // Check if form is valid before proceeding
            if (!isFormValid) {
              setNotificationMessage("Please fill out all required fields and add items to your request.");
              setIsNotificationVisible(true);
              return;
            }

            setIsFinalizeModalVisible(true);
          }}
          onCancel={() => setIsWarningModalVisible(false)}
          dateRequired={dateRequired}
          daysDifference={daysDifference}
        />
            
              </div>
            </div>
          </div>

        <NotificationModal
          isVisible={isNotificationVisible}
          onClose={() => setIsNotificationVisible(false)}
          message={notificationMessage}
        />

        <SuccessModal isVisible={showModal} onClose={closeModal} />
        <TodayRequestModal 
          isVisible={showTodayRequestModal} 
          onClose={closeTodayRequestModal} 
          requestCount={todayRequestCount}
        />

        <PoliciesModal isOpen={showPolicies} onClose={closePolicies} />
      </Layout>
      
    
    
  );
};
export default Requisition;
