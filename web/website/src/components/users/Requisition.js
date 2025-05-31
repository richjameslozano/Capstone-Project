import React, { useState, useEffect, useCallback } from "react";
import {Layout,Input,Table,Button,Card,Modal, DatePicker,TimePicker,message,Select,Typography,Descriptions,Spin,} from "antd";
import { PlusOutlined,DeleteOutlined,CalendarOutlined,CloseOutlined,SearchOutlined} from "@ant-design/icons";
import moment from "moment";
import dayjs from 'dayjs';
import { useLocation, useNavigate } from "react-router-dom";
import { getFirestore, collection, addDoc, Timestamp, getDocs, updateDoc, doc, deleteDoc,setDoc, getDoc, serverTimestamp, onSnapshot, collectionGroup,query,where } from "firebase/firestore";
import { getAuth } from 'firebase/auth';
import { db } from "../../backend/firebase/FirebaseConfig";
import Sidebar from "../Sidebar";
import AppHeader from "../Header";
import "../styles/usersStyle/Requisition.css";



import SuccessModal from "../customs/SuccessModal";
import PoliciesModal from "../Policies";
import FinalizeRequestModal from "../customs/FinalizeRequestModal";
import NotificationModal from "../customs/NotificationModal";

import "../styles/usersStyle/Requisition.css";
import "../styles/usersStyle/ActivityLog.css";


const { Content } = Layout;
const { Title } = Typography;

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
];



const tableHeaderStyle = {
  padding: "8px",
  borderBottom: "1px solid #ddd",
  backgroundColor: "#f5f5f5",
  fontWeight: "bold",
  textAlign: "center",
};

const tableCellStyle = {
  padding: "8px",
  borderBottom: "1px solid #ddd",
  textAlign: "center",
};

const Requisition = () => {
  const [requestList, setRequestList] = useState([]);
  const [dateRequired, setDateRequired] = useState(null);
  const [timeFrom, setTimeFrom] = useState(null);
  const [timeTo, setTimeTo] = useState(null);
  const [isFinalizeVisible, setIsFinalizeVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
  const [searchUsageType, setSearchUsageType] = useState("");
  const [customUsageType, setCustomUsageType] = useState("");
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [isFinalizeModalVisible, setIsFinalizeModalVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [showPolicies, setShowPolicies] = useState(false)
  const [mergedData, setMergedData] = useState([]);
  const [volumeOptions, setVolumeOptions] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
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


  const [tableData, setTableData] = useState([
    { key: 0, selectedItemId: null }, 
  ]);
  

  const activitycolumn = [
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
];

  useEffect(() => {
   const allItemFieldsValid = mergedData.length > 0 && mergedData.every(item =>
      item.itemName &&
      item.itemDetails &&
      item.category &&
      item.quantity &&
      item.labRoom &&
      item.status &&
      item.condition &&
      item.department &&
      item.category
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

  // useEffect(() => {
  //   async function fetchVolumeOptions() {
  //     const inventoryRef = collection(db, "inventory");
  //     const snapshot = await getDocs(inventoryRef);

  //     // Extract volumes from all glasswares' quantity arrays
  //     const volumesSet = new Set();

  //     snapshot.docs.forEach((doc) => {
  //       const data = doc.data();
  //       if (data.category === "Glasswares" && Array.isArray(data.quantity)) {
  //         data.quantity.forEach(qtyObj => {
  //           // qtyObj.volume may be string or number, convert to number for consistency
  //           const vol = Number(qtyObj.volume);
  //           if (!isNaN(vol)) volumesSet.add(vol);
  //         });
  //       }
  //     });

  //     // Convert Set to sorted array
  //     const sortedVolumes = Array.from(volumesSet).sort((a, b) => a - b);
  //     setVolumeOptions(sortedVolumes);
  //   }

  //   fetchVolumeOptions();
  // }, [db]);

  // useEffect(() => {
  //   const fetchRequestList = async () => {
  //     const userId = localStorage.getItem("userId");
  //     if (userId) {
  //       try {
  //         const tempRequestRef = collection(db, "accounts", userId, "temporaryRequests");
  //         const querySnapshot = await getDocs(tempRequestRef);
  //         const tempRequestList = querySnapshot.docs.map((doc) => {
  //           const data = doc.data();
  //           return {
  //             ...data,
  //             selectedItem: {
  //               value: data.selectedItemId,
  //               label: data.selectedItemLabel, // <-- This restores the label after refresh
  //             },
  //           };
  //         });          
  
  //         setRequestList(tempRequestList);

  //         localStorage.setItem("requestList", JSON.stringify(tempRequestList));
  
  //       } catch (error) {
  //         console.error("Error fetching request list:", error);
  //       }
  //     }
  //   };
  //   fetchRequestList();
  // }, []);  

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
        console.error("Error fetching request list:", error);
      }
    );

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, []);

  // REAL TIME UPDATE TEMREQ
  // useEffect(() => {
  //   const userId = localStorage.getItem("userId");

  //   const fetchRequestList = async () => {
  //     if (userId) {
  //       try {
  //         const tempRequestRef = collection(db, "accounts", userId, "temporaryRequests");
  //         const querySnapshot = await getDocs(tempRequestRef);
  //         const tempRequestList = querySnapshot.docs.map((doc) => {
  //           const data = doc.data();
  //           return {
  //             ...data,
  //             selectedItem: {
  //               value: data.selectedItemId,
  //               label: data.selectedItemLabel, // <-- This restores the label after refresh
  //             },
  //           };
  //         });

  //         setRequestList(tempRequestList);
  //         localStorage.setItem("requestList", JSON.stringify(tempRequestList));

  //       } catch (error) {
  //         console.error("Error fetching request list:", error);
  //       }
  //     }
  //   };

  //   fetchRequestList(); // run initial fetch

  //   // Real-time listener
  //   let unsubscribe;
  //   if (userId) {
  //     const tempRequestRef = collection(db, "accounts", userId, "temporaryRequests");
  //     unsubscribe = onSnapshot(tempRequestRef, (querySnapshot) => {
  //       const tempRequestList = querySnapshot.docs.map((doc) => {
  //         const data = doc.data();
  //         return {
  //           ...data,
  //           selectedItem: {
  //             value: data.selectedItemId,
  //             label: data.selectedItemLabel,
  //           },
  //         };
  //       });

  //       setRequestList(tempRequestList);
  //       localStorage.setItem("requestList", JSON.stringify(tempRequestList));
  //     }, (error) => {
  //       console.error("Real-time listener error:", error);
  //     });
  //   }

  //   // Clean up real-time listener on unmount
  //   return () => {
  //     if (unsubscribe) unsubscribe();
  //   };
  // }, []);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "inventory"));
        const itemList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
  
        setItems(itemList);
        setFilteredItems(itemList);

      } catch (error) {
        console.error("Error fetching inventory:", error);
      }
    };
  
    fetchItems();
  }, []);

  useEffect(() => {
    // Load the saved request list and table data from localStorage
    const savedRequestList = localStorage.getItem("requestList");
    const savedTableData = localStorage.getItem("tableData");
  
    if (savedRequestList) {
      setRequestList(JSON.parse(savedRequestList));
    }
  
    if (savedTableData) {
      setTableData(JSON.parse(savedTableData));
    }
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

  const closeModal = () => {
    setShowModal(false);         // Close success modal
    setShowPolicies(true);       // Open policies modal next
  };
  
  const closePolicies = () => {
    setShowPolicies(false);      // Close policies modal
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
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
    console.log("Merged Data:", merged);
    setMergedData(merged);
  }, [tableData, requestList]); // <- dependencies added
  

  useEffect(() => {
    mergeData(); // will always use the freshest version now
  }, [mergeData]);

  const logRequestOrReturn = async (userId, userName, action, requestDetails) => {
    await addDoc(collection(db, `accounts/${userId}/activitylog`), {
      action, // e.g. "Requested Items" or "Returned Items"
      userName,
      timestamp: serverTimestamp(),
      requestList: requestDetails, 
    });
  };  
  
  // const finalizeRequest = async () => {
  //   let isValid = true;
  //   let idsToRemove = [];
  
  //   if (!dateRequired) {
  //     setNotificationMessage("Please select a date!.");
  //     setIsNotificationVisible(true);
  //     isValid = false;
  //   }
  
  //   if (!program) {
  //     setProgramError(true);
  //     isValid = false;

  //   } else {
  //     setProgramError(false);
  //   }

  //   if (!course) {
  //     setCourseError(true);
  //     isValid = false;

  //   } else {
  //     setCourseError(false);
  //   }

  //   if (!usageType) {
  //     setUsageError(true);
  //     isValid = false;

  //   } else {
  //     setUsageError(false);
  //   }
  
  //   if (!room) {
  //     setRoomError(true);
  //     isValid = false;

  //   } else {
  //     setRoomError(false);
  //   }

  //   if (usageType === "Others" && !customUsageType.trim()) {
  //     setNotificationMessage("Please specify the usage type.");
  //     setIsNotificationVisible(true);
  //     isValid = false;
  //   }

  //   if (!timeFrom || !timeTo) {
  //     setNotificationMessage("Please select both 'Time From' and 'Time To'!");
  //     setIsNotificationVisible(true);

  //     isValid = false;

  //   } else if (new Date(`1970-01-01T${timeFrom}`) >= new Date(`1970-01-01T${timeTo}`)) {
  //     setNotificationMessage("'Time From' must be earlier than 'Time To'!");
  //     setIsNotificationVisible(true);
  //     isValid = false;
  //   }
    
  //   if (mergedData.length === 0) {
  //     setNotificationMessage("Please add items to the request list!");
  //     setIsNotificationVisible(true);
  //     isValid = false;
  //   }

  //   console.log("Original mergedData:", mergedData);
  //   // Filter out incomplete items from mergedData
  //   const filteredMergedData = mergedData.filter(item =>
  //     item.itemName && item.category && item.quantity && item.labRoom &&
  //     item.status && item.condition && item.department
  //   );

  //   // Show a warning if all items are incomplete
  //   if (filteredMergedData.length === 0) {
  //     setNotificationMessage("Please complete all required item fields before finalizing.");
  //     setIsNotificationVisible(true);
  //     isValid = false;
  //   }
  //   console.log("Filtered mergedData:", filteredMergedData);

  //   if (isValid) {
  //     try {
  //       const userId = localStorage.getItem("userId");
  
  //       if (userId) {
  //         // Fetch the user's name from the accounts collection
  //         const userDocRef = doc(db, "accounts", userId);
  //         const userDocSnapshot = await getDoc(userDocRef);
  
  //         if (!userDocSnapshot.exists()) {
  //           message.error("User not found.");
  //           return;
  //         }
  
  //         const userName = userDocSnapshot.data().name;

  //         const finalUsageType = usageType === "Others" ? customUsageType : usageType;
  
  //         // Add data to the user's requests collection
  //         const userRequestRef = collection(db, "accounts", userId, "userRequests");
  //         const requestData = {
  //           dateRequired,
  //           timeFrom,
  //           timeTo,
  //           program,
  //           course,
  //           usageType: finalUsageType,
  //           room,
  //           reason,
  //           filteredMergedData,
  //           userName,
  //           timestamp: Timestamp.now(),
  //         };
  
  //         await addDoc(userRequestRef, requestData);
  
  //         // Add to root userrequests collection
  //         const userRequestsRootRef = collection(db, "userrequests");
  //         const newUserRequestRef = doc(userRequestsRootRef);
  //         await setDoc(newUserRequestRef, {
  //           ...requestData,
  //           accountId: userId,
  //         });

  //         await logRequestOrReturn(userId, userName, "Requested Items", filteredMergedData); 
  
  //         const tempRequestRef = collection(db, "accounts", userId, "temporaryRequests");
  //         const querySnapshot = await getDocs(tempRequestRef);
  
  //         const deletionPromises = [];
  
  //         querySnapshot.forEach((docSnapshot) => {
  //           const itemData = docSnapshot.data();
  //           idsToRemove.push(itemData.id);
  
  //           const pendingRequestRef = collection(db, "accounts", userId, "pendingrequest");
  
  //           deletionPromises.push(
  //             (async () => {
  //               // Add to pending requests
  //               await addDoc(pendingRequestRef, itemData);
  
  //               // Delete from temporaryRequests
  //               await deleteDoc(doc(db, "accounts", userId, "temporaryRequests", docSnapshot.id));
  
  //               // Delete from pendingRequest if already exists
  //               const pendingRequestDocs = await getDocs(pendingRequestRef);
  //               pendingRequestDocs.forEach((pendingDoc) => {
  //                 if (pendingDoc.data().id === itemData.id) {
  //                   deletionPromises.push(deleteDoc(doc(db, "accounts", userId, "pendingrequest", pendingDoc.id)));
  //                 }
  //               });
  //             })()
  //           );
  //         });
  
  //         await Promise.all(deletionPromises);
  
  //         // Filter out removed items from requestList
  //         const updatedRequestList = mergedData.filter((item) => !idsToRemove.includes(item.id));
  //         setRequestList(updatedRequestList);
  //         localStorage.setItem('requestList', JSON.stringify(updatedRequestList));
  
  //         setNotificationMessage("Requisition sent successfully!");
  //         setIsNotificationVisible(true);
  //         setIsFinalizeVisible(false);
  
  //         clearTableData();
  //         setDateRequired(null);
  //         setTimeFrom(null);
  //         setTimeTo(null);
  //         setProgram("");
  //         setCourse("");
  //         setUsageType("");
  //         setRoom("");
  //         setReason("");
  //         setRequestList([]);
  //         setMergedData([]);
  //         setTableData([]); 
  //         console.log("MergedData after finalize:", mergedData);
  //         console.log("TableData after finalize:", tableData);

  //         localStorage.removeItem('requestList');

  //       } else {
  //         message.error("User is not logged in.");
  //       }
  
  //     } catch (error) {
  //       console.error("Error finalizing the requisition:", error);
  //       message.error("Failed to send requisition. Please try again.");
  //     }
  //   }
  // };  

   const finalizeRequest = async () => {
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

    console.log("Original mergedData:", mergedData);
    // Filter out incomplete items from mergedData
    const filteredMergedData = mergedData.filter(item =>
      // item.itemName && item.category && item.quantity && item.labRoom &&
      item.itemName && item.itemDetails && item.category && item.quantity && item.labRoom &&
      item.status && item.condition && item.department
    );

    // Show a warning if all items are incomplete
    if (filteredMergedData.length === 0) {
      setNotificationMessage("Please complete all required item fields before finalizing.");
      setIsNotificationVisible(true);
      isValid = false;
    }
    console.log("Filtered mergedData:", filteredMergedData);

  // for (const item of filteredMergedData) {
  //   if (item.category.toLowerCase() === "glasswares") {
  //     // Assuming volume property is named "volume" and must be > 0
  //     if (!item.volume || Number(item.volume) <= 0) {
  //       setNotificationMessage(`Please specify a valid volume for glassware item "${item.itemName}".`);
  //       setIsNotificationVisible(true);
  //       isValid = false;
  //       break; // no need to check further once invalid
  //     }
  //   }
  // }

    if (isValid) {
      try {
        const userId = localStorage.getItem("userId");
  
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
            // usageType,
            usageType: finalUsageType,
            room,
            reason,
            filteredMergedData,
            userName,
            timestamp: Timestamp.now(),
          };
  
          // await addDoc(userRequestRef, requestData);

          const newUserDocRef = await addDoc(userRequestRef, requestData);
          const generatedId = newUserDocRef.id;
          await updateDoc(newUserDocRef, { iid: generatedId });
  
          // Add to root userrequests collection
          // const userRequestsRootRef = collection(db, "userrequests");
          // const newUserRequestRef = doc(userRequestsRootRef);
          const userRequestsRootRef = doc(db, "userrequests", generatedId);
          await setDoc(userRequestsRootRef, {
            ...requestData,
            accountId: userId,
          });

          await logRequestOrReturn(userId, userName, "Requested Items", filteredMergedData); 
  
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
          setRequestList([]);
          setMergedData([]);
          setTableData([]); 
          console.log("MergedData after finalize:", mergedData);
          console.log("TableData after finalize:", tableData);

          localStorage.removeItem('requestList');

        } else {
          message.error("User is not logged in.");
        }
  
      } catch (error) {
        console.error("Error finalizing the requisition:", error);
        message.error("Failed to send requisition. Please try again.");
      }
    }
  };  

  const removeFromList = async (id) => {
    try {
      // Filter out the item from local state (requestList and tableData)
      const updatedList = requestList.filter((item) => item.selectedItemId !== id);
      const updatedTableData = tableData.filter((item) => item.selectedItemId !== id);
  
      // Update local state
      setRequestList(updatedList);
      setTableData(updatedTableData);
  
      // Log current state
      console.log("Attempting to remove ID:", id);
      console.log("Current requestList:", updatedList);
  
      // Update localStorage
      localStorage.setItem("requestList", JSON.stringify(updatedList));
      localStorage.setItem("tableData", JSON.stringify(updatedTableData));
  
      const userId = localStorage.getItem("userId"); 
      if (!userId) {
        console.warn("User ID not found in localStorage.");
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
  
      // Notify user whether the item was successfully removed from Firestore
      setNotificationMessage(foundInFirestore ? "Item removed from the list" : "Item not found in Firestore.");
      setIsNotificationVisible(true);
  
    } catch (error) {
      console.error("Error removing item:", error);
      setNotificationMessage("Something went wrong while removing the item.");
      setIsNotificationVisible(true);
    }
  };  

  // const handleItemSelect = async (selected, index) => {
  //   const { value: itemId } = selected;
  //   const selectedItem = JSON.parse(JSON.stringify(items.find(item => item.id === itemId)));
  
  //   const previousItemId = tableData[index]?.selectedItemId;
  
  //   // Build new row object
  //   const newRow = {
  //     selectedItem: {
  //       value: itemId,
  //       label: selectedItem.itemName,
  //     },
  //     selectedItemId: itemId,
  //     itemName: selectedItem.itemName,
  //     category: selectedItem.category,
  //     quantity: tableData[index]?.quantity || 1,
  //     labRoom: selectedItem.labRoom,
  //     status: selectedItem.status,
  //     condition: selectedItem.condition,
  //     department: selectedItem.department,
  //   };
  
  //   // Update tableData
  //   let updatedData = [...tableData];
  //   if (updatedData[index]) {
  //     updatedData[index] = newRow;

  //   } else {
  //     updatedData.push(newRow); // Add to the end if it's a new item
  //   }
    
  //   setTableData(updatedData);
  //   localStorage.setItem("tableData", JSON.stringify(updatedData)); // Save updated table data
  
  //   // Update requestList
  //   let updatedRequestList = [...requestList];
  //   if (updatedRequestList[index]) {
  //     updatedRequestList[index] = newRow;

  //   } else {
  //     updatedRequestList.push(newRow); // Add to the end if it's a new item
  //   }
  //   setRequestList(updatedRequestList);
  //   localStorage.setItem("requestList", JSON.stringify(updatedRequestList)); // Save updated request list
  
  //   mergeData();
  
  //   const userId = localStorage.getItem("userId");
  
  //   if (userId) {
  //     try {
  //       const tempRequestRef = doc(db, "accounts", userId, "temporaryRequests", itemId);
  
  //       // Delete the previous item from Firestore if it's different from the new one
  //       if (previousItemId && previousItemId !== itemId) {
  //         const previousRef = doc(db, "accounts", userId, "temporaryRequests", previousItemId);
  //         await deleteDoc(previousRef);
  //       }
  
  //       // Add or update the new item
  //       await setDoc(tempRequestRef, {
  //         ...selectedItem,
  //         id: itemId,
  //         selectedItemId: itemId,
  //         selectedItemLabel: selectedItem.itemName,
  //         quantity: newRow.quantity,
  //         timestamp: Timestamp.fromDate(new Date()),
  //       });
  
  //       setNotificationMessage("Item updated in temporary list.");
  //       setIsNotificationVisible(true);
  
  //     } catch (error) {
  //       console.error("Error updating item in temporary list:", error);
  //       setNotificationMessage("Failed to update item in temporary list.");
  //       setIsNotificationVisible(true);
  //     }
  //   }
  // };  

  const handleItemSelect = async (selected, index) => {
    const { value: itemId } = selected;
    const selectedItem = JSON.parse(JSON.stringify(items.find(item => item.id === itemId)));

    const previousItemId = tableData[index]?.selectedItemId;

    // Get volume if it exists in current row (tableData)
    // const volume = tableData[index]?.volume || selectedItem.volume || null;

    // Build new row object including volume
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
      // volume,  // <-- include volume here
      labRoom: selectedItem.labRoom,
      status: selectedItem.status,
      condition: selectedItem.condition,
      department: selectedItem.department,
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
        });

        setNotificationMessage("Item updated in temporary list.");
        setIsNotificationVisible(true);

      } catch (error) {
        console.error("Error updating item in temporary list:", error);
        setNotificationMessage("Failed to update item in temporary list.");
        setIsNotificationVisible(true);
      }
    }
  };

  const clearTableData = () => {
    setTableData([]); // Clear tableData
    setRequestList([]); // Clear requestList
    localStorage.removeItem("tableData"); // Remove from localStorage
    localStorage.removeItem("requestList"); // Remove from localStorage
  };  
  
  useEffect(() => {
    mergeData();
  }, [requestList, tableData]);
  
  // const columns = [
  //   {
  //     title: "Item Name",
  //     dataIndex: "selectedItemId",
  //     key: "selectedItemId",
  //     render: (value, record, index) => {
  //       // Get all selected item IDs except the current row
  //       const selectedIds = mergedData
  //         .filter((_, i) => i !== index)
  //         .map((row) => row.selectedItemId);
  
  //       return (
  //         <Select
  //           showSearch
  //           placeholder="Select item"
  //           style={{ width: 100 }}
  //           dropdownStyle={{ width: 700 }}
  //           optionFilterProp="label"
  //           labelInValue
  //           value={record.selectedItem || undefined}
  //           onChange={(selected) => handleItemSelect(selected, index)} // Trigger handleItemSelect on change
  //           filterOption={(input, option) =>
  //             option?.label?.toLowerCase().includes(input.toLowerCase())
  //           }
  //         >
  //           {/* Map through filtered items instead of the entire items list */}
  //           {filteredItems.map((item) => {
  //             // const label = `${item.itemName} | ${item.category} | Qty: ${item.quantity} | ${item.status} | ${item.department}`;
  //             // const label = `${item.itemName} | ${item.category} | Qty: ${item.quantity}${["Chemical", "Reagent"].includes(item.category) && item.unit ? ` ${item.unit}` : ""}${item.category === "Glasswares" && item.volume ? ` / ${item.volume} ML` : ""} | ${item.status} | ${item.department}`;
  //             const label = `${item.itemName} | ${item.category} | Qty: ${item.quantity}${["Glasswares", "Chemical", "Reagent"].includes(item.category) ? " pcs" : ""}${item.category === "Glasswares" && item.volume ? ` / ${item.volume} ML` : ""}${["Chemical", "Reagent"].includes(item.category) && item.unit ? ` / ${item.unit} ML` : ""} | ${item.status} | ${item.department}`;
  //             const isDisabled = selectedIds.includes(item.id);
  
  //             return (
  //               <Select.Option
  //                 key={item.id}
  //                 value={item.id}
  //                 label={item.itemName}
  //                 disabled={isDisabled}
  //               >
  //                 {label}
  //               </Select.Option>
  //             );
  //           })}
  //         </Select>
  //       );
  //     },
  //   },
  //   {
  //     title: "Category",
  //     dataIndex: "category",
  //     key: "category",
  //   },
  //   {
  //     title: "Quantity",
  //     dataIndex: "quantity",
  //     key: "quantity",
  //     render: (value, record) => (
  //       <Input
  //         type="number"
  //         min={1}
  //         value={record.quantity}
  //         onChange={async (e) => {
  //           const newQuantity = Number(e.target.value);

  //           // Fetch inventory details to validate the quantity
  //           const inventoryRef = collection(db, "inventory");
  //           const inventorySnapshot = await getDocs(inventoryRef);
  //           const inventoryItem = inventorySnapshot.docs.find(doc => doc.id === record.selectedItemId);

  //           // Check if inventory item exists and compare the quantity
  //           if (inventoryItem) {
  //             const availableQuantity = inventoryItem.data().quantity; // Assuming the quantity field exists in inventory

  //             if (newQuantity <= availableQuantity) {
  //               // Update local tableData if valid
  //               const updated = tableData.map((row) =>
  //                 row.selectedItemId === record.selectedItemId ? { ...row, quantity: newQuantity } : row
  //               );
                
  //               setTableData(updated);

  //               // Update requestList too
  //               const updatedRequestList = requestList.map((row) =>
  //                 row.selectedItemId === record.selectedItemId ? { ...row, quantity: newQuantity } : row
  //               );

  //               setRequestList(updatedRequestList);
  //               localStorage.setItem("requestList", JSON.stringify(updatedRequestList));

  //               // Update Firestore
  //               const userId = localStorage.getItem("userId");
  //               if (userId) {
  //                 const tempRequestRef = collection(db, "accounts", userId, "temporaryRequests");

  //                 // Find the doc with this item's ID
  //                 const snapshot = await getDocs(tempRequestRef);
  //                 const docToUpdate = snapshot.docs.find(doc => doc.data().selectedItemId === record.selectedItemId);

  //                 if (docToUpdate) {
  //                   await updateDoc(doc(db, "accounts", userId, "temporaryRequests", docToUpdate.id), {
  //                     quantity: newQuantity,
  //                   });
  //                 }
  //               }

  //             } else {
  //               // Use the custom notification modal
  //               handleOpenModal(`Cannot request more than the available quantity (${availableQuantity})`);
  //             }

  //           } else {
  //             console.error("Inventory item not found.");
  //           }
  //         }}
  //       />
  //     ),
  //   },
  //   {
  //     title: "Lab Room",
  //     dataIndex: "labRoom",
  //     key: "labRoom",
  //   },
  //   {
  //     title: "Status",
  //     dataIndex: "status",
  //     key: "status",
  //   },
  //   {
  //     title: "Department",
  //     dataIndex: "department",
  //     key: "department",
  //   },
  //   {
  //     title: "Action",
  //     key: "action",
  //     render: (_, record) => (
  //       <Button
  //         type="text"
  //         danger
  //         icon={<DeleteOutlined />}
  //         onClick={() => removeFromList(record.selectedItemId)}
  //       />
  //     ),
  //   },
  // ];
  const courseDescriptions = {
    MLSACHML: "ANALYTICAL CHEMISTRY",
    MLSBIEPC: "BIOSTATISTICS AND EPIDEMIOLOGY",
    MLSAUBFC: "ANALYSIS OF URINE AND OTHER BODY FLUIDS",
    MLSHEM2L: "HEMATOLOGY 2",
    MLSHPATL: "GENERAL PATHOLOGY WITH HISTOPATHOLOGIC AND CYTOLOGIC TECHNIQUES",
    MLSIMHEL: "IMMUNOHEMATOLOGY",
    MLSMOLBL: " MOLECULAR BIOLOGY AND DIAGNOSTICS",
    MLSMYVIL: "MYCOLOGY AND VIROLOGY",
    MLSPARAL: "CLINICAL PARASITOLOGY",
    MLSPML2L: "PRINCIPLES OF MEDICAL LABORATORY SCIENCE PRACTICE 2 ",
  };

  const columns = [
    {
      title: "Item Name",
      dataIndex: "selectedItemId",
      key: "selectedItemId",
      render: (value, record, index) => {
        // Get all selected item IDs except the current row
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
            onChange={(selected) => handleItemSelect(selected, index)} // Trigger handleItemSelect on change
            filterOption={(input, option) =>
              option?.label?.toLowerCase().includes(input.toLowerCase())
            }>
            {/* Map through filtered items instead of the entire items list */}
            {filteredItems.map((item) => {
              const label = `${item.itemName} | ${item.itemDetails} | ${item.category} | Qty: ${item.quantity} | ${item.status} | ${item.department}`;
              // const label = `${item.itemName} | ${item.category} | Qty: ${item.quantity}${["Chemical", "Reagent"].includes(item.category) && item.unit ? ` ${item.unit}` : ""}${item.category === "Glasswares" && item.volume ? ` / ${item.volume} ML` : ""} | ${item.status} | ${item.department}`;
              // const label = `${item.itemName} | ${item.category} | Qty: ${item.quantity}${["Glasswares", "Chemical", "Reagent"].includes(item.category) ? " pcs" : ""}${item.category === "Glasswares" && item.volume ? ` / ${item.volume} ML` : ""}${["Chemical", "Reagent"].includes(item.category) && item.unit ? ` / ${item.unit} ML` : ""} | ${item.status} | ${item.department}`;
              // const label = `${item.itemName} | ${item.category} | Qty: ${item.quantity}${["Glasswares", "Chemical", "Reagent"].includes(item.category) ? " pcs" : ""}${item.category === "Glasswares" && item.volume ? ` / ${item.volume} ML` : ""}${["Chemical", "Reagent"].includes(item.category) && item.unit ? ` / ${item.unit} ML` : ""} | ${item.status} | ${item.department}`;
              const isDisabled = selectedIds.includes(item.id);
  
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
              console.error("Inventory item not found.");
            }
          }}
        />
      ),
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
    },
    // {
    //   title: "Condition",
    //   dataIndex: "condition",
    //   key: "condition",
    // },
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
                    console.error(`Error fetching inventory item ${inventoryId}:`, err);
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
          console.error("Error fetching user requests in real-time: ", error);
          setNotificationMessage("Failed to fetch user requests.");
          setNotificationVisible(true);
        });
    
        // Cleanup listener on unmount
        return () => unsubscribe();
  
      } catch (err) {
        console.error("Error fetching requests:", err);
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
          cancelledAt: new Date(),
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
        setIsCancelVisible(false);
  
        setNotificationMessage("Request successfully canceled and logged.");
        setNotificationVisible(true);
        setSelectedRequest(null);
        setViewDetailsModalVisible(false);
        fetchRequests();
  
      } catch (err) {
        console.error("Error canceling request:", err);
        setNotificationMessage("Failed to cancel the request.");
        setNotificationVisible(true);
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
  
  //Pending Request Functions
   const columns1 = [
      {
        title: "Request ID",
        dataIndex: "id",
        key: "id",
      },
      {
        title: "Requisition Date",
        dataIndex: "dateRequested",
        key: "dateRequested",
      },
      {
        title: "Date Required",
        dataIndex: "dateRequired",
        key: "dateRequired",
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status) => (
          <Button type="text" className="status-btn">
            {status}
          </Button>
        ),
      },
      {
        title: "Action",
        key: "action",
        render: (_, record) => (
          <Button onClick={() => handleViewDetails(record)} type="primary">
            View Details
          </Button>
        ),
      },
    ];
  
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
          console.error("Real-time activity log listener failed:", error);
        }
      );
    
      // Cleanup the listener when the component unmounts
      return () => unsubscribe();
    }, []);
  
    const filteredData = activityData
    .filter((item) => {
      // Filter by action type
      if (actionFilter !== "ALL" && item.action !== actionFilter) {
        return false;
      }
      // Filter by search
  
      return (
        item.date.includes(searchQuery) ||
        item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.by.toLowerCase().includes(searchQuery.toLowerCase())
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



  return (

    
    <Layout style={{ minHeight: "100vh" }}>
      <Layout className="site-layout">
        
    <div className="page-sections" style={{ display: "flex", flexDirection: "column", gap: "0", padding: "24px",height:"100vh" }}>

         <div className="section requisition-form">
         
          <Title level={2}>Requisition Form</Title>
          <div className="request-details">
            <div className="whole-section" >
              <div className="left-section">
              <div className="date-time-container">

                <div className="date-required">
                  <strong>Date Needed:</strong>
                  <DatePicker
                    value={dateRequired ? dayjs(dateRequired, "YYYY-MM-DD") : null}
                    onChange={(date, dateString) => setDateRequired(dateString)}
                    disabledDate={(current) => current && current < moment().startOf("day")}
                    style={{
                      width: "100%",
                      marginTop: "8px",
                    }}
                  />
                  {dateRequired && (
                    <p style={{ marginTop: "8px", fontWeight: "bold", color: "blue" }}>
                      Selected Date: {dateRequired}
                    </p>
                  )}
                </div>

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
                      />

                      <TimePicker
                      minuteStep={10}
                        value={timeTo ? dayjs(timeTo, "HH:mm") : null}
                        placeholder="To"
                        onChange={(time, timeString) => setTimeTo(timeString)}
                        format="HH:mm"
                        use12Hours={false}
                        disabled={!timeFrom}
                        style={{ width: "50%" }}
                        disabledHours={() => {
                          if (!timeFrom) return [];
                          const [startHour] = timeFrom.split(":").map(Number);
                          return Array.from({ length: startHour }, (_, i) => i);
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
                </div>

                <div className="program-room-container">
                  <div className="program-container">
                    <strong>Program:</strong>
                    <select
                      value={program}
                      onChange={(e) => setProgram(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        marginTop: "8px",
                      }}
                    >
                      <option value="">Select a Program</option>
                      <option value="SAM - BSMT">SAM - BSMT</option>
                      <option value="SAH - BSN">SAH - BSN</option>
                      <option value="SHS">SHS</option>
                    </select>

                    {programError && (
                      <p style={{ color: "red", marginTop: "5px" }}>
                        Please select a program before finalizing.
                      </p>
                    )}
                  </div>

                  <div className="program-container">
                    <strong>Course Code:</strong>
                    <select
                        value={course}
                        onChange={(e) => {
                          setCourse(e.target.value);
                          setCourseDescription(courseDescriptions[e.target.value] || "");
                        }}
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                          marginTop: "8px",
                        }}
                    >
                      <option value="">Select a Course Code</option>
                      <option value="MLSACHML">MLSACHML</option> 
                      <option value="MLSBIEPC">MLSBIEPC</option>
                      <option value="MLSAUBFC">MLSAUBFC</option>
                      <option value="MLSHEM2L">MLSHEM2L</option>
                      <option value="MLSHPATL">MLSHPATL</option>
                      <option value="MLSIMHEL">MLSIMHEL</option>
                      <option value="MLSMOLBL">MLSMOLBL</option>
                      <option value="MLSMYVIL">MLSMYVIL</option>
                       <option value="MLSPARAL">MLSPARAL</option>
                        <option value="MLSPML2L">MLSPML2L</option>
                    </select>

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

                  <div className="room-container">
                    <strong>Room:</strong>
                    <Input
                      type="number"
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
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
                        onChange={(e) => setCustomUsageType(e.target.value)}
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
            
              <div className="reason-container">
                <strong style={{marginBottom: '5px'}}>Note (Optional):</strong>
                <Input.TextArea
                  rows={3}
                  showCount
                  style={{maxHeight: '150px', minHeight: '50px'}}
                  
                  maxLength={100}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Leave a note for the custodian"
                />
              </div>
            </div>

            <div className="dropdowns" style={{ display: "flex", gap: "20px" }}>              
              <select
                value={searchCategory}
                onChange={(e) => {
                  const selectedCategory = e.target.value;
                  setSearchCategory(selectedCategory);
                  if (selectedCategory === "") {
                    setFilteredItems(items);
                    
                  } else {
                    const filteredData = items.filter((item) => item.category === selectedCategory);
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
          </div>

    
          {/* <Table
            className="requisition-table"
            columns={columns}
            dataSource={mergedData}
            pagination={{ pageSize: 10 }}
            rowKey={(record) => record.key}
          /> */}

          <div style={{ minHeight: "300px", overflow: "auto", marginBottom: "40px" }}>
          <Table
            className="requisition-table"
            dataSource={mergedData}
            columns={columns}
            pagination={false}
          />
        </div>


          <div className="bottom-btns">
            {/* <Button
              type="dashed"
              onClick={() => {
                const lastRow = tableData[tableData.length - 1];

                if (!lastRow || lastRow.selectedItemId) {
                  setTableData([
                    ...tableData,
                    { key: Date.now(), selectedItemId: null }
                  ]);

                } else {
                  setNotificationMessage("Please select an item in the last row first.");
                  setIsNotificationVisible(true);
                }
              }}
              className="add-item-row-btn"
            >
              Add Item Row
            </Button> */}

            <Button
              type="dashed"
              onClick={handleAddRow}
              className="add-item-row-btn"
              // disabled={tableData.length >= 10}
            >
              Add Item Row
            </Button>

            <Button 
              type="primary"
              danger
              block
              className="finalize-btn"
              disabled={!isFormValid}
              onClick={async () => {
                const hasConflict = await isRoomTimeConflict(room, timeFrom, timeTo, dateRequired);

                if (hasConflict) {
                   setModalMessage("This room is already booked for the selected date and time.");
                  setIsModalVisible(true); 
                  return;
                }
                setIsFinalizeModalVisible(true);
                
              }}
            >
              Finalize
            </Button>
         <FinalizeRequestModal
          visible={isFinalizeModalVisible}
          onOk={() => {
            finalizeRequest();
            setIsFinalizeModalVisible(false);
          }}
          onCancel={() => setIsFinalizeModalVisible(false)}
          dateRequired={dateRequired}
          timeFrom={timeFrom}
          timeTo={timeTo}
          program={program}
          course={course}
          usageType={usageType}
          room={room}
          reason={reason}
          requestList={mergedData}
          />
            
              </div>
            </div>
          </div>
          

        <div className="section requests-list">
          
          <Title level={2}>Requests List</Title>
            {loading ? (
              <Spin size="large" />
            ) : (
              <Table
                columns={columns1}
                dataSource={requests}
                pagination={{ pageSize: 10 }}
                rowKey="id"
                className="pending-table"
              />
            )}

            <Modal
              className="request-list-modal"
              open={viewDetailsModalVisible}
              onCancel={handleModalClose}
              width={800}
              closable={false}
              footer={[
                <Button key="close" onClick={handleModalClose}>Close</Button>,
                <Button
                  key="cancel"
                  danger
                  onClick={() => setIsCancelVisible(true)}
                  icon={<CloseOutlined />}
                >Cancel Request</Button>,
              ]}
            >
              {selectedRequest && (
                <div>
                  <Title level={4}>Request Details</Title>
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="Requester">{selectedRequest.requester}</Descriptions.Item>
                    <Descriptions.Item label="Requisition Date">{selectedRequest.dateRequested}</Descriptions.Item>
                    <Descriptions.Item label="Date Required">{selectedRequest.dateRequired}</Descriptions.Item>
                    <Descriptions.Item label="Time Needed">{selectedRequest.timeNeeded}</Descriptions.Item>
                    <Descriptions.Item label="Course Code">{selectedRequest.courseCode}</Descriptions.Item>
                    <Descriptions.Item label="Room">{selectedRequest.room}</Descriptions.Item>
                    <Descriptions.Item label="Usage Type">{selectedRequest.usageType}</Descriptions.Item>
                  </Descriptions>
                  <br />
                  <Title level={5}>Requested Items:</Title>
                  <Table
                    columns={[
                      { title: "Item #", key: "index", render: (_, __, index) => <span>{index + 1}</span> },
                      { title: "Item Name", dataIndex: "itemName", key: "itemName" },
                      { title: "Item ID", dataIndex: "itemIdFromInventory", key: "itemIdFromInventory" },
                      { title: "Qty", dataIndex: "quantity", key: "quantity" },
                      { title: "Department", dataIndex: "department", key: "department" },
                    ]}
                    dataSource={selectedRequest.items}
                    rowKey={(_, index) => index}
                    size="small"
                    pagination={false}
                  />
                </div>
              )}
            </Modal>
            

            <Modal
              title="Confirm Cancellation"
              open={isCancelVisible}
              onCancel={() => setIsCancelVisible(false)}
              onOk={handleCancelRequest}
              okText="Yes, Cancel"
              cancelText="No"
            >
              <p>Are you sure you want to cancel this request?</p>
            </Modal>
     
          </div>

           <div className="section activity-log">
            <Title level={2} style={{marginTop:"8px"}}>Activity Log</Title>
            <div>
               <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
                          <Input
                            placeholder="Search"
                            prefix={<SearchOutlined />}
                            className="activity-search"
                            allowClear
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: "60%" }}
                          />
              
                          <Select
                            value={actionFilter}
                            onChange={(value) => setActionFilter(value)}
                            style={{ width: 200 }}
                            allowClear
                            placeholder="Filter by Action"
                          >
                            <Select.Option value="ALL">All</Select.Option>
                            <Select.Option value="Request Approved">Request Approved</Select.Option>
                            <Select.Option value="Request Rejected">Request Rejected</Select.Option>
                            <Select.Option value="Cancelled a request">Request Cancelled</Select.Option>
                            <Select.Option value="Deployed">Deployed</Select.Option>
                          </Select>
                        </div>
              
                        <Table
                          columns= {activitycolumn}
                          dataSource={filteredData}
                          pagination={{ pageSize: 10 }}
                          bordered
                          className="activity-table"
                          rowClassName="activity-row"
                          onRow={(record) => ({
                            onClick: () => handleRowClick(record),
                          })}
                          locale={{
                            emptyText: (
                              <div className="empty-row">
                                <span>No activity found.</span>
                              </div>
                            ),
                          }}
                        />
              
                        <Modal
                          title="Activity Details"
                          visible={modalVisible}
                          zIndex={1015}
                          onCancel={() => setModalVisible(false)}
                          footer={null}
                        >
                          {selectedLog && (
                            <Descriptions column={1} bordered size="small">
                              <Descriptions.Item label="Action">
                                {selectedLog.status === "CANCELLED"
                                  ? "Cancelled a request"
                                  : selectedLog.action || "Modified a request"}
                              </Descriptions.Item>
              
                              <Descriptions.Item label="By">
                                {selectedLog.userName || "Unknown User"}
                              </Descriptions.Item>
              
                              <Descriptions.Item label="Program">
                                {selectedLog.program || "N/A"}
                              </Descriptions.Item>
              
                              {/* <Descriptions.Item label="Items Requested">
                                {(selectedLog.filteredMergedData || selectedLog.requestList)?.length > 0 ? (
                                  <ul style={{ paddingLeft: 20 }}>
                                    {(selectedLog.filteredMergedData || selectedLog.requestList).map((item, index) => (
                                      <li key={index} style={{ marginBottom: 10 }}>
                                        <strong>{item.itemName}</strong>
                                        <ul style={{ marginLeft: 20 }}>
                                          <li>Quantity: {item.quantity}</li>
                                          {item.category && <li>Category: {item.category}</li>}
                                          {item.labRoom && <li>Lab Room: {item.labRoom}</li>}
                                          {item.usageType && <li>Usage Type: {item.usageType}</li>}
                                          {item.itemType && <li>Item Type: {item.itemType}</li>}
                                          {item.department && <li>Department: {item.department}</li>}
                                          {selectedLog.action === "Request Rejected" && item.reason && (
                                            <li><strong>Rejection Reason:</strong> {item.reason}</li>
                                          )}
                                        </ul>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  "None"
                                )}
                              </Descriptions.Item> */}
              
                              <Descriptions.Item label="Items Requested">
                                {(selectedLog.filteredMergedData || selectedLog.requestList)?.length > 0 ? (
                                  <ul style={{ paddingLeft: 20 }}>
                                    {(selectedLog.filteredMergedData || selectedLog.requestList).map((item, index) => (
                                      <li key={index} style={{ marginBottom: 10 }}>
                                        <strong>{item.itemName}</strong>
                                        <ul style={{ marginLeft: 20 }}>
                                          <li>Quantity: {item.quantity}</li>
                                          {/* {item.category && <li>Category: {item.category}</li>} */}
                                          {item.category && <li>Category: {item.category}</li>}
                                          {item.category === "Glasswares" && item.volume && (
                                            <li>Volume: {item.volume}</li>
                                          )}
                                          {/* {item.condition && <li>Condition: {item.condition}</li>} */}
                                          {/* {item.condition && (
                                            <li>
                                              Condition:
                                              <ul>
                                                <li>Good: {item.condition.Good ?? 0}</li>
                                                <li>Defect: {item.condition.Defect ?? 0}</li>
                                                <li>Damage: {item.condition.Damage ?? 0}</li>
                                              </ul>
                                            </li>
                                          )} */}
                                          {item.labRoom && <li>Lab Room: {item.labRoom}</li>}
                                          {item.usageType && <li>Usage Type: {item.usageType}</li>}
                                          {item.itemType && <li>Item Type: {item.itemType}</li>}
                                          {item.department && <li>Department: {item.department}</li>}
                                          {/* {selectedLog.action === "Request Rejected" && item.reason && (
                                            <li><strong>Rejection Reason:</strong> {item.reason}</li>
                                          )} */}
                                          {selectedLog.action === "Request Rejected" && (item.rejectionReason || item.reason) && (
                                            <li><strong>Rejection Reason:</strong> {item.rejectionReason || item.reason}</li>
                                          )}
                                        </ul>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  "None"
                                )}
                              </Descriptions.Item>
              
                              {selectedLog.action !== "Request Rejected" && (
                                <Descriptions.Item label="Reason">
                                  {selectedLog.reason || "N/A"}
                                </Descriptions.Item>
                              )}
              
                              <Descriptions.Item label="Room">
                                {selectedLog.room || "N/A"}
                              </Descriptions.Item>
              
                              <Descriptions.Item label="Time">
                                {selectedLog.timeFrom && selectedLog.timeTo
                                  ? `${selectedLog.timeFrom} - ${selectedLog.timeTo}`
                                  : "N/A"}
                              </Descriptions.Item>
              
                              <Descriptions.Item label="Date Required">
                                {selectedLog.dateRequired || "N/A"}
                              </Descriptions.Item>
                            </Descriptions>
                          )}
                        </Modal>


            </div>
          </div>

 
      </Layout>
      
      
    </Layout>
    
    
  );
};
export default Requisition;
