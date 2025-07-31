import React, { useState, useRef, useEffect } from "react";
import {
  Layout,
  Table,
  Input,
  Button,
  Select,
  Form,
  Row,
  Col,
  Space,
  DatePicker,
  Modal,
  InputNumber,
  Radio,
  FloatButton,Spin
} from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined, MinusCircleOutlined, PlusOutlined, FileTextOutlined, DownloadOutlined, FilePdfOutlined, FileExcelOutlined, PrinterOutlined} from '@ant-design/icons'; 
import moment from "moment";
import Sidebar from "../Sidebar";
import AppHeader from "../Header";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { getFirestore, collection, addDoc, Timestamp, getDocs, updateDoc, doc, onSnapshot, setDoc, getDoc, query, where, serverTimestamp, orderBy, limit, writeBatch } from "firebase/firestore";
import CryptoJS from "crypto-js";
import CONFIG from "../../config";
import "../styles/adminStyle/Inventory.css";
import DeleteModal from "../customs/DeleteModal";
import NotificationModal from "../customs/NotificationModal";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import 'jspdf-autotable';
import dayjs from 'dayjs';
import StockLog from '../customs/StockLog.js'
import axios from "axios";

const { Content } = Layout;
const { Option } = Select;

const SECRET_KEY = CONFIG.SECRET_KEY;

const Inventory = () => {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [dataSource, setDataSource] = useState([]);
  const [count, setCount] = useState(0);
  const [itemName, setItemName] = useState("");
  const [itemDetails, setItemDetails] = useState("");
  const [itemId, setItemId] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const qrRefs = useRef({});
  const [pageTitle, setPageTitle] = useState("");
  const [itemType, setItemType] = useState("");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isRowModalVisible, setIsRowModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedQrCode, setSelectedQrCode] = useState('');
  const [selectedItemName, setSelectedItemName] = useState(null);
  const [logRefreshKey, setLogRefreshKey] = useState(0);
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterItemType, setFilterItemType] = useState(null);
  const [filterUsageType, setFilterUsageType] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState("");
  const [disableExpiryDate, setDisableExpiryDate] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showExpiry, setShowExpiry] = useState(false);
  const [hasExpiryDate, setHasExpiryDate] = useState(false);
  const [departmentsAll, setDepartmentsAll] = useState([]);
  const [filterDepartment, setFilterDepartment] = useState(null);
  const [loading, setLoading] = useState(true); // default: true
  const db = getFirestore();
  const [isRestockRequestModalVisible, setIsRestockRequestModalVisible] = useState(false);
  const [restockForm] = Form.useForm();
  const [itemToRestock, setItemToRestock] = useState(null);

  const [isFullEditModalVisible, setIsFullEditModalVisible] = useState(false);
  const [fullEditForm] = Form.useForm();

  const sanitizeInput = (input) =>
  input.replace(/\s+/g, " ")           // convert multiple spaces to one                   
      .replace(/[^a-zA-Z0-9\s\-.,()]/g, "");
  

  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef(null);

  useEffect(() => {
    const measureHeight = () => {
      if (headerRef.current) {
        const { height } = headerRef.current.getBoundingClientRect();
        setHeaderHeight(height);
      }
    };

    measureHeight();

    // Optional: watch for resize events
    const observer = new ResizeObserver(measureHeight);
    if (headerRef.current) {
      observer.observe(headerRef.current);
    }

    return () => observer.disconnect();
  }, []);


  // useEffect(() => {
  //   const inventoryRef = collection(db, "inventory");

  //   const unsubscribe = onSnapshot(inventoryRef, (snapshot) => {
  //     try {
  //       const items = snapshot.docs
  //         .map((doc, index) => {
  //           const data = doc.data();

  //           const entryDate = data.entryDate ? data.entryDate : "N/A";
  //           const expiryDate = data.expiryDate ? data.expiryDate : "N/A";

  //           return {
  //             docId: doc.id,  
  //             id: index + 1,
  //             itemId: data.itemId,
  //             item: data.itemName,
  //             category:data.category,
  //             entryDate,
  //             expiryDate,
  //             qrCode: data.qrCode,
  //             ...data,
  //           };
  //         })
  //         .sort((a, b) => (a.item || "").localeCompare(b.item || ""));

  //       setDataSource(items);
  //       setCount(items.length);
        
  //     } catch (error) {
       
  //     }

  //   }, (error) => {
     
  //   });

  //   return () => unsubscribe(); // Clean up the listener on unmount
  // }, []);

  useEffect(() => {
    const inventoryRef = collection(db, "inventory");

    const unsubscribe = onSnapshot(
      inventoryRef,
      async (snapshot) => {
        setLoading(true); // Start loading
        try {
          const batch = writeBatch(db); // use batch to reduce writes

          const items = await Promise.all(
            snapshot.docs.map(async (docSnap, index) => {
              const data = docSnap.data();
              const docId = docSnap.id;

              const entryDate = data.entryDate || "N/A";
              const expiryDate = data.expiryDate || "N/A";

              const quantity = Number(data.quantity) || 0;
              const category = (data.category || "").toLowerCase();

              let status = data.status || ""; // base status
              let newStatus = status;
              
              try {
                        if (data.itemId) {
                          const usageQuery = query(
                            collection(db, "itemUsage"),
                            where("itemId", "==", data.itemId),
                            orderBy("timestamp", "desc"),
                            limit(30)
                          );

                          const usageSnapshot = await getDocs(usageQuery);

                          const totalUsed = usageSnapshot.docs.reduce((sum, doc) => {
                            const usageData = doc.data();
                            const used = Number(usageData.usedQuantity) || 0;
                            return sum + used;
                          }, 0);

                          const uniqueDays = new Set(
                            usageSnapshot.docs
                              .map(doc => {
                                const ts = doc.data().timestamp;
                                return ts instanceof Timestamp ? ts.toDate().toDateString() : null;
                              })
                              .filter(Boolean)
                          );

                          const numDays = Math.max(uniqueDays.size, 1);
                          const avgDailyUsage = totalUsed / numDays;

                          const isCritical = quantity <= avgDailyUsage * 30;
                          console.log("Critical check:", {
                            item: data.itemName,
                            avgDailyUsage,
                            quantity,
                            isCritical
                          });


                          batch.update(doc(db, "inventory", docId), {
                            averageDailyUsage: avgDailyUsage,
                             ...(avgDailyUsage > 0 ? { averageDailyUsage: avgDailyUsage } : {}),
                            
                          });
                        }
                      } catch (err) {
                        console.error("Error calculating critical status for item:", data.itemName, err);
                      }

              // Update logic
              if (quantity === 0) {
                if (["chemical", "reagent", "materials"].includes(category)) {
                  newStatus = "out of stock";
                  
                } else if (["equipment", "glasswares"].includes(category)) {
                  newStatus = "in use";
                }
              }

              // If status changed in logic, update inventory
              if (newStatus !== status) {
                const itemRef = doc(db, "inventory", docId);
                batch.update(itemRef, { status: newStatus });
              }

              // 🔁 SYNC TO LABROOM ITEMS
              const labRoomsSnapshot = await getDocs(collection(db, "labRoom"));

              for (const roomDoc of labRoomsSnapshot.docs) {
                const roomId = roomDoc.id;
                const itemsRef = collection(db, `labRoom/${roomId}/items`);
                const itemsSnap = await getDocs(itemsRef);

                itemsSnap.forEach((itemDoc) => {
                  const itemData = itemDoc.data();
                  if (itemData.itemId === data.itemId && itemData.status !== newStatus) {
                    const labItemRef = doc(db, `labRoom/${roomId}/items`, itemDoc.id);
                    batch.update(labItemRef, { status: newStatus });
                  }
                });
              }

              return {
                docId,
                id: index + 1,
                itemId: data.itemId,
                item: data.itemName,
                entryDate,
                expiryDate,
                qrCode: data.qrCode,
                status: newStatus,
                ...data,
              };
            })
          );

          // ✅ Commit all batched updates
          await batch.commit();

          // Update state
          items.sort((a, b) => (a.item || "").localeCompare(b.item || ""));
          setDataSource(items);
          setCount(items.length);

        } catch (error) {
          console.error("Error processing inventory snapshot: ", error);
        }finally {
        setLoading(false); // Stop loading
      }
      },
      (error) => {
        console.error("Error fetching inventory with onSnapshot: ", error);
        setLoading(false); // Stop loading even on error
      }
    );

    return () => unsubscribe();
  }, []);



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

  //RESTOCKING
  useEffect(() => {
  const inventoryRef = collection(db, "inventory");

  const unsubscribe = onSnapshot(
    inventoryRef,
    async (snapshot) => {
      setLoading(true); // Start loading
      try {
        const batch = writeBatch(db); // Use batch for efficient writes

        const items = await Promise.all(
          snapshot.docs.map(async (docSnap, index) => {
            const data = docSnap.data();
            const docId = docSnap.id;
            const quantity = Number(data.quantity) || 0;
            const criticalLevel = Number(data.criticalLevel) || 0;
            const category = (data.category || "").toLowerCase();

            // Check if item needs restocking
            if (quantity <= criticalLevel) {
              await createRestockRequest(data);
            }

            return {
              docId,
              id: index + 1,
              itemId: data.itemId,
              item: data.itemName,
              quantity,
              criticalLevel,
              status: data.status,
              ...data,
            };
          })
        );

        // Commit all updates
        await batch.commit();

        items.sort((a, b) => (a.item || "").localeCompare(b.item || ""));
        setDataSource(items);
        setCount(items.length);

      } catch (error) {
        console.error("Error processing inventory snapshot: ", error);
      } finally {
        setLoading(false); // Stop loading
      }
    },
    (error) => {
      console.error("Error fetching inventory: ", error);
      setLoading(false);
    }
  );

  return () => unsubscribe();
}, []);




  // useEffect(() => {
  //   const fetchInventory = async () => {
  //     try {
  //       const response = await fetch('https://nuls-8c12b.web.app/api/getInventory');
  //       const data = await response.json();

  //       if (data.success && data.items) {
  //         setDataSource(data.items);
  //         setCount(data.count);
  //       } else {
  //         console.warn('No inventory data:', data.message || 'Unknown reason');
  //         setDataSource([]);
  //         setCount(0);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching inventory from backend:', error);
  //     }
  //   };

  //   fetchInventory();
  // }, []);

  //FULL EDIT

  // Open full edit modal and prefill
const openFullEditModal = (record) => {
  fullEditForm.resetFields();
  setEditingItem(record);
  setSelectedCategory(record.category);

  const hasExpiry = record.category === "Chemical" || record.category === "Reagent";
  setHasExpiryDate(hasExpiry);

  fullEditForm.setFieldsValue({
    itemName: record.itemName,
    itemDetails: record.itemDetails,
    category: record.category,
    department: record.department,
    criticalLevel: record.criticalLevel,
    labRoom: record.labRoom,
    shelves: record.shelves,
    row: record.row,
    status: record.status,
    type: record.type,
    unit: record.unit,
     condition: ["Glasswares", "Equipment", "Materials"].includes(record.category)
      ? {
          Good: record.condition?.Good ?? 0,
          Defect: record.condition?.Defect ?? 0,
          Damage: record.condition?.Damage ?? 0,
          Lost: record.condition?.Lost ?? 0,
        }
      : undefined,
  });

  setIsFullEditModalVisible(true);
};

const handleRestockRequest = (item) => {
  setItemToRestock(item); // <-- also ensure item is not null/undefined
  setIsRestockRequestModalVisible(true);
};

// Function to handle form submission
const handleRestockSubmit = async (values) => {
  try {
    const restockRequest = {
      itemId: itemToRestock.itemId,
      itemName: itemToRestock.itemName,
      quantityNeeded: values.quantityNeeded,
      reason: values.reason,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Add the request to your "restock_requests" collection
    await addDoc(collection(db, "restock_requests"), restockRequest);

    // Optionally, show a success message or notification
    setNotificationMessage("Restock request submitted successfully!");
    setIsNotificationVisible(true);

    // Close the modal after submission
    setIsRestockRequestModalVisible(false);

  } catch (error) {
    console.error("Error submitting restock request:", error);
    setNotificationMessage("Failed to submit restock request. Please try again.");
    setIsNotificationVisible(true);
  }
};

// FRONTEND
// const handleFullUpdate = async (values) => {
//   try {
//     if (!editingItem || !editingItem.docId) {
//       console.error("No item selected or docId missing.");
//       return;
//     }

//     // Sanitize itemName and itemDetails (trim whitespace, ensure non-empty strings)
//     const sanitizedItemName = values.itemName.trim();
//     const sanitizedItemDetails = values.itemDetails.trim();

//     if (!sanitizedItemName || !sanitizedItemDetails) {
//       console.warn("❌ Item Name and Item Details are required.");
//       return;
//     }

//     // Sanitize criticalLevel (ensure it's a number and >= 1)
//    const sanitizedCriticalLevel = Math.max(Number(values.criticalLevel), 1);


//     // Sanitize category to ensure it's valid
//     const validCategories = ["Glasswares", "Equipment", "Materials", "Chemical", "Reagent"];
//     if (!validCategories.includes(values.category)) {
//       console.warn(`❌ Invalid category: ${values.category}`);
//       return;
//     }

//     const sanitizedLabRoom = values.labRoom ? values.labRoom.toString().padStart(4, '0') : null;

//     // Handle condition (Good, Defect, Damage)
//     const sanitizedCondition = {
//       Good: Number(values.condition?.Good) || 0,
//       Defect: Number(values.condition?.Defect) || 0,
//       Damage: Number(values.condition?.Damage) || 0,
//       Lost: Number(values.condition?.Lost) || 0,
//     };

//     // If the category requires condition, set quantity based on Good stock
//     let sanitizedQuantity = sanitizedCondition.Good;
//     if (["Glasswares", "Equipment", "Materials"].includes(values.category)) {
//       sanitizedQuantity = sanitizedCondition.Good;
//     }

//     const updatedData = {
//       itemName: sanitizedItemName,
//       itemDetails: sanitizedItemDetails,
//       category: values.category,
//       department: values.department,
//       criticalLevel: sanitizedCriticalLevel,
//       labRoom: sanitizedLabRoom,
//       status: values.status || "pending", // Default status if not provided
//       unit: values.unit || null,
//       condition: sanitizedCondition,
//       quantity: sanitizedQuantity,
//     };

//     // Update main inventory doc
//     const itemRef = doc(db, "inventory", editingItem.docId);
//     await updateDoc(itemRef, updatedData);

//     // Update labRoom subcollection item if labRoom is valid
//     if (sanitizedLabRoom) {
//       const labRoomQuery = query(collection(db, "labRoom"), where("roomNumber", "==", sanitizedLabRoom));
//       const labRoomSnapshot = await getDocs(labRoomQuery);

//       if (!labRoomSnapshot.empty) {
//         const labRoomDoc = labRoomSnapshot.docs[0];
//         const labRoomRef = labRoomDoc.ref;
//         const labRoomItemRef = doc(collection(labRoomRef, "items"), editingItem.itemId);
//         const labRoomItemSnap = await getDoc(labRoomItemRef);

//         if (labRoomItemSnap.exists()) {
//           await updateDoc(labRoomItemRef, updatedData);
//         } else {
//           console.warn(`⚠️ Item ${editingItem.itemId} not found in labRoom ${sanitizedLabRoom}/items`);
//         }
//       } else {
//         console.warn(`⚠️ No labRoom found with roomNumber "${sanitizedLabRoom}"`);
//       }
//     }

//     setDataSource((prevData) =>
//       prevData.map((item) =>
//         item.docId === editingItem.docId ? { ...item, ...updatedData } : item
//       )
//     );

//     setNotificationMessage("Item updated successfully!");
//     setIsNotificationVisible(true);
//     setIsFullEditModalVisible(false);
//     setIsRowModalVisible(false);
//     setEditingItem(null);
//     fullEditForm.resetFields();
//   } catch (error) {
//     console.error("Error updating item:", error);
//     setNotificationMessage("Failed to update item. Please try again.");
//     setIsNotificationVisible(true);
//   }
// };

//AUTO RESTOCK

useEffect(() => {
    const inventoryRef = collection(db, "inventory");

    const unsubscribe = onSnapshot(
      inventoryRef,
      async (snapshot) => {
        setLoading(true); // Start loading
        try {
          const batch = writeBatch(db); // Use batch for efficient writes

          const items = await Promise.all(
            snapshot.docs.map(async (docSnap, index) => {
              const data = docSnap.data();
              const docId = docSnap.id;

              const quantity = Number(data.quantity) || 0;
              const criticalLevel = Number(data.criticalLevel) || 0;

              let status = data.status || ""; // base status
              let newStatus = status;

              // Check if item needs restocking (critical level or out of stock)
              if (quantity <= criticalLevel) {
                await createRestockRequest(data);
              }

              return {
                docId,
                id: index + 1,
                itemId: data.itemId,
                item: data.itemName,
                quantity,
                criticalLevel,
                status: data.status,
                ...data,
              };
            })
          );

          // Commit all updates
          await batch.commit();

          // Update state
          items.sort((a, b) => (a.item || "").localeCompare(b.item || ""));
          setDataSource(items);
        } catch (error) {
          console.error("Error processing inventory snapshot: ", error);
        } finally {
          setLoading(false); // Stop loading
        }
      },
      (error) => {
        console.error("Error fetching inventory: ", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);
// Function to automatically create restock requests
   const createRestockRequest = async (item) => {
  try {
    // Check if the item is already in the restock requests list
    const restockCollection = collection(db, "restock_requests");
    const q = query(restockCollection, where("item_name", "==", item.itemName), where("status", "==", "pending"));

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // If the item already exists in the pending state, prevent adding
      console.log(`${item.itemName} is already in the restock request list.`);
      return;
    }

    // If the item doesn't exist, create a new restock request
    await addDoc(collection(db, "restock_requests"), {
      item_name: item.itemName,
      quantity_needed: item.criticalLevel, // You can use `criticalLevel` as the quantity needed
      department: item.department,
      status: 'pending',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    // Optionally, show a notification to the user
    setNotificationMessage(`${item.itemName} needs restocking. A request has been generated.`);
    setIsNotificationVisible(true);
  } catch (error) {
    console.error("Error creating restock request: ", error);
    setNotificationMessage("Failed to create restock request.");
    setIsNotificationVisible(true);
  }
};


  
// BACKEND
const handleFullUpdate = async (values) => {
  try {
    if (!editingItem || !editingItem.docId) {
      console.error("❌ No item selected or docId missing.");
      setNotificationMessage("Item selection error.");
      setIsNotificationVisible(true);
      return;
    }

    // Basic sanitization
    const sanitizedItemName = values.itemName?.trim();
    const sanitizedItemDetails = values.itemDetails?.trim();
    const sanitizedCriticalLevel = Math.max(Number(values.criticalLevel || 1), 1);

    if (!sanitizedItemName || !sanitizedItemDetails) {
      setNotificationMessage("Item name and details are required.");
      setIsNotificationVisible(true);
      return;
    }

    // Construct payload
    const payload = {
      itemName: sanitizedItemName,
      itemDetails: sanitizedItemDetails,
      category: values.category,
      department: values.department,
      criticalLevel: sanitizedCriticalLevel,
      labRoom: values.labRoom,
      shelves: values.shelves,
      row: values.row, 
      unit: values.unit,
      status: values.status,
      condition: {
        Good: Number(values.condition?.Good || 0),
        Defect: Number(values.condition?.Defect || 0),
        Damage: Number(values.condition?.Damage || 0),
        Lost: Number(values.condition?.Lost || 0),
      },
    };

    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName") || "User";

    const response = await axios.post("https://webnuls.onrender.com/update-inventory-full", {
      values: payload,
      editingItem,
      userId,
      userName,
    });

    if (response.status === 200) {
      setNotificationMessage("Item updated successfully!");
      setIsNotificationVisible(true);

      // Update local state
      const updatedItem = {
        ...editingItem,
        ...payload,
        quantity: payload.condition.Good, // assumes quantity = Good
      };

      setDataSource((prev) =>
        prev.map((item) =>
          item.docId === editingItem.docId ? updatedItem : item
        )
      );

      // Reset UI
      setIsFullEditModalVisible(false);
      setIsRowModalVisible(false);
      setEditingItem(null);
      fullEditForm.resetFields();
      
    } else {
      setNotificationMessage("Failed to update item.");
      setIsNotificationVisible(true);
    }

  } catch (error) {
    console.error("Error in handleFullUpdate:", error);
    setNotificationMessage("Error updating item. Check console.");
    setIsNotificationVisible(true);
  }
};

  useEffect(() => {
    if (isEditModalVisible) {
      const currentCategory = editForm.getFieldValue("category");
      if (currentCategory) {
        setSelectedCategory(currentCategory);
      }
    }
  }, [isEditModalVisible]);

const isExpired = (expiryDate) => {
  if (!expiryDate) return false; // no expiry date means not expired
  return dayjs(expiryDate).isBefore(dayjs().add(1,'day').startOf('day'));

};

// Utility to sanitize the search term
const sanitizeSearchInput = (input) => {
  if (!input) return ""; // If there's no input, return empty string
  // Remove any unwanted characters (HTML tags or special chars) and trim spaces
  return input.trim().replace(/<[^>]+>/g, "").replace(/[^\w\s]/gi, "");
};

// const filteredData = dataSource.filter((item) => {
//   // Sanitize the search input to prevent any issues (e.g., XSS, SQL injection)
//   const sanitizedSearchText = sanitizeSearchInput(searchText);
  
//   // Search logic
//   const matchesSearch = sanitizedSearchText
//     ? Object.values(item).some((val) =>
//         String(val).toLowerCase().includes(sanitizedSearchText.toLowerCase())
//       )
//     : true;

//   // Filter items based on selected category, item type, and expiration status
//   return (
//     (!filterCategory || item.category === filterCategory) &&
//     (!filterItemType || item.type === filterItemType) &&
//     (!filterDepartment || item.department === filterDepartment) &&
//     matchesSearch &&
//     !isExpired(item.expiryDate) // Exclude expired items
//   );
// });

const filteredData = dataSource.filter((item) => {
  // Sanitize the search input to prevent any issues (e.g., XSS, SQL injection)
  const sanitizedSearchText = sanitizeSearchInput(searchText);
    
  // Search logic
  const matchesSearch = sanitizedSearchText
    ? Object.values(item).some((val) =>
        String(val).toLowerCase().includes(sanitizedSearchText.toLowerCase())
      )
    : true;

  // Filter items based on selected category, item type, and department only
  return (
    (!filterCategory || item.category === filterCategory) &&
    (!filterItemType || item.type === filterItemType) &&
    (!filterDepartment || item.department === filterDepartment) &&
    matchesSearch
  );
});

// Handling category change and expiry date
const handleCategoryChange = (value) => {
  let type = "";
  let disableExpiry = false;

  if (["Chemical", "Reagent"].includes(value)) {
    type = "Consumable";
    disableExpiry = false;

  } else if (value === "Materials") {
    type = "Consumable";
    disableExpiry = true;

  } else if (["Equipment", "Glasswares"].includes(value)) {
    type = "Fixed";
    disableExpiry = true;
  }

  setItemType(type);
  setSelectedCategory(value);
  setDisableExpiryDate(disableExpiry);

  // Reset radio + expiry
  setShowExpiry(false);
  form.setFieldsValue({ type, expiryDate: null });
};

  const showModal = () => setIsModalVisible(true);
  const handleCancel = () => setIsModalVisible(false);

    const exportToExcel = () => {
    const flattenedData = filteredData.map((item) => ({
      ItemID: item.itemId || "",
      ItemName: item.itemName || "",
      ItemDetails: item.itemDetails || "",
      Category: item.category || "",
      Department: item.department || "",
      Quantity: item.quantity?.toString() || "0", 
      Status: item.status || "",
      Condition: item.condition
        ? Object.entries(item.condition).map(([key, val]) => `${key}: ${val}`).join(", ")
        : "",
      unit: item.unit || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Inventory");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "Filtered_Inventory.xlsx");
  };

  const generatePdfFromFilteredData = () => {
  const doc = new jsPDF("p", "pt", "a4");
  const margin = 40;
  let y = margin;

  // Header
  doc.setFontSize(18);
  doc.text("Inventory List", margin, y);
  y += 30;

  // Filter Information
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Filters:", margin, y);
  doc.setFont(undefined, "normal");
  y += 20;

  // Add filter information
  if (filterCategory) {
    doc.text(`Category: ${filterCategory}`, margin + 20, y);
    y += 20;
  }
  if (filterItemType) {
    doc.text(`Item Type: ${filterItemType}`, margin + 20, y);
    y += 20;
  }
  if (searchText) {
    doc.text(`Search: ${searchText}`, margin + 20, y);
    y += 20;
  }

  // Summary Information
  doc.setFont(undefined, "bold");
  doc.text("Total Items:", margin, y);
  doc.setFont(undefined, "normal");
  doc.text(filteredData.length.toString(), margin + 80, y);
  y += 30;

  // Main Table
  const headers = [["Item ID", "Item Name", "Item Description", "Category", "Department", "Quantity", "Status", "Condition"]];
  const data = filteredData.map(item => [
    item.itemId || "",
    item.itemName || "",
    item.itemDetails || "",
    item.category || "",
    item.department || "",
    item.quantity?.toString() || "0",
    item.status || "",
    item.condition
      ? Object.entries(item.condition).map(([key, val]) => `${key}: ${val}`).join(", ")
      : "",
    item.unit || "",
  ]);

  doc.autoTable({
    head: headers,
    body: data,
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: {
      fillColor: [44, 62, 146],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 12,
      cellPadding: 6,
    },
    bodyStyles: {
      fontSize: 11,
      cellPadding: 5,
    },
    styles: {
      lineWidth: 0.1,
      lineColor: [200, 200, 200],
      cellPadding: 5,
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  return doc;
};

// Save PDF
const saveAsPdf = () => {
  const doc = generatePdfFromFilteredData();
  if (doc) {
    const fileName = `Inventory_List_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }
};

// Print PDF
const printPdf = () => {
  const doc = generatePdfFromFilteredData();
  if (doc) {
    doc.autoPrint();
    window.open(doc.output("bloburl"), "_blank");
  }
};

  // FRONTEND
  //  const handleAdd = async (values) => {
  // if (!itemName || !values.department || !itemDetails) {
  //   alert("Please fill up the form!");
  //   return;
  // }

  // const trimmedName = itemName.trim();
  // const normalizedInputName = trimmedName.toLowerCase();
  // const normalizedInputDetails = itemDetails.trim().toLowerCase();
  // const normalizedDepartment = values.department.trim().toLowerCase();

  // // Find items with the same name (case-insensitive)
  // const sameNameItems = dataSource.filter(
  //   (item) => item.item.toLowerCase().startsWith(normalizedInputName)
  // );

  // // Check if same name AND same details AND same department already exists
  // const exactMatch = sameNameItems.find((item) => {
  //   const itemDetailsSafe = item.itemDetails ? item.itemDetails.trim().toLowerCase() : "";
  //   const itemNameSafe = item.item ? item.item.toLowerCase() : "";
  //   const itemDepartmentSafe = item.department ? item.department.trim().toLowerCase() : "";
  //   return (
  //     itemDetailsSafe === normalizedInputDetails &&
  //     itemNameSafe === normalizedInputName &&
  //     itemDepartmentSafe === normalizedDepartment
  //   );
  // });

  // if (exactMatch) {
  //   setNotificationMessage(
  //     "An item with the same name, details, and department already exists in the inventory."
  //   );
  //   setIsNotificationVisible(true);
  //   return;
  // }

  // const itemCategoryPrefixMap = {
  //   Chemical: "CHEM",
  //   Equipment: "EQP",
  //   Reagent: "RGT",
  //   Glasswares: "GLS",
  //   Materials: "MAT",
  // };

  // const baseName = trimmedName.replace(/\d+$/, ''); // Remove trailing digits if any
  // const formattedItemName = `${baseName}`;
  // const finalItemName = sameNameItems.length > 0 ? formattedItemName : trimmedName;

  // const itemCategoryPrefix = itemCategoryPrefixMap[values.category] || "UNK01";
  // const inventoryRef = collection(db, "inventory");
  // const itemIdQuerySnapshot = await getDocs(query(inventoryRef, where("category", "==", values.category)));
  // const defaultCriticalDays = 7;
  // let averageDailyUsage = 0;

  // const criticalLevel = Math.ceil(averageDailyUsage * defaultCriticalDays) || 1;

  // let ItemCategoryCount = itemIdQuerySnapshot.size + 1;
  // let generatedItemId = `${itemCategoryPrefix}${ItemCategoryCount.toString().padStart(2, "0")}`;
  // let idQuerySnapshot = await getDocs(query(inventoryRef, where("itemId", "==", generatedItemId)));

  // // 🔁 Keep trying until we find a unique ID
  // while (!idQuerySnapshot.empty) {
  //   ItemCategoryCount++;
  //   generatedItemId = `${itemCategoryPrefix}${ItemCategoryCount.toString().padStart(2, "0")}`;
  //   idQuerySnapshot = await getDocs(query(inventoryRef, where("itemId", "==", generatedItemId)));
  // }

  // setItemId(generatedItemId);

 
 
  //   const entryDate = values.entryDate ? values.entryDate.format("YYYY-MM-DD") : null;
  //   const expiryDate = values.type === "Fixed"
  //     ? null
  //     : values.expiryDate
  //     ? values.expiryDate.format("YYYY-MM-DD")
  //     : null;
 
  //   const entryCurrentDate = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
  //   const timestamp = new Date();
 
  //   const quantityNumber = Number(values.quantity);
 
  //   const inventoryItem = {
  //     itemId: generatedItemId,
  //     // itemName,
  //     itemName: finalItemName,
  //     itemDetails,
  //     entryCurrentDate,
  //     expiryDate,
  //     timestamp,
  //     criticalLevel,
  //     category: values.category,
  //     labRoom: values.labRoom,
  //     quantity: Number(values.quantity),
  //     department: values.department,
  //     type: values.type,
  //     status: "Available",
  //     ...(values.category === "Chemical" || values.category === "Reagent" ? { unit: values.unit } : {}),
  //     rawTimestamp: new Date(),
 
  //     ...(values.category !== "Chemical" && values.category !== "Reagent" && {
  //       condition: {
  //         Good: quantityNumber,
  //         Defect: 0,
  //         Damage: 0,
  //         Lost: 0,
  //       },
  //     }),
  //   };
 
  //   const encryptedData = CryptoJS.AES.encrypt(
  //     JSON.stringify(inventoryItem),
  //     SECRET_KEY
  //   ).toString();
   
  //   const newItem = {
  //     id: count + 1,
  //     itemId: generatedItemId,
  //     // item: itemName,
  //     item: finalItemName,
  //     itemDetails: itemDetails,
  //     entryDate: entryCurrentDate,
  //     expiryDate: expiryDate,
  //     qrCode: encryptedData,
  //     ...inventoryItem,
  //   };
 
  //    try {
 
  //     const inventoryDocRef = await addDoc(collection(db, "inventory"), {
  //       ...inventoryItem,
  //       qrCode: encryptedData,
  //     });
 
  //     const userId = localStorage.getItem("userId");
  //     const userName = localStorage.getItem("userName") || "User";
 
  //     await addDoc(collection(db, `accounts/${userId}/activitylog`), {
  //       action: `Added new item (${finalItemName}) to inventory`,
  //       userName: userName || "User",
  //       timestamp: serverTimestamp(),
  //     });

  //     await db.collection("allactivitylog").add({
  //       action: `Added new item (${finalItemName}) to inventory`,
  //       userName: userName || "User",
  //       timestamp: serverTimestamp(),
  //     });

  //     setNotificationMessage("Item successfully added!");
  //     setIsNotificationVisible(true);

  //     await addDoc(collection(inventoryDocRef, "stockLog"), {
  //       date: new Date().toISOString().split("T")[0], // "YYYY-MM-DD"
  //       noOfItems: quantityNumber,
  //       deliveryNumber: "DLV-00001",
  //       createdAt: serverTimestamp(),
  //       ...(expiryDate && { expiryDate }),
  //     });
 
  //     // 🔽 Check if labRoom with the given room number already exists
  //     const labRoomQuery = query(
  //       collection(db, "labRoom"),
  //       where("roomNumber", "==", values.labRoom)
  //     );
  //     const labRoomSnapshot = await getDocs(labRoomQuery);
 
  //     let labRoomRef;
 
  //     if (labRoomSnapshot.empty) {
  //       // 🔽 Create new labRoom document with generated ID
  //       labRoomRef = await addDoc(collection(db, "labRoom"), {
  //         roomNumber: values.labRoom,
  //         createdAt: new Date(),
  //       });
 
  //     } else {
  //       // 🔽 Use existing labRoom document
  //       labRoomRef = labRoomSnapshot.docs[0].ref;
  //     }
 
  //     // 🔽 Add item to the labRoom's subcollection
  //     await setDoc(doc(collection(labRoomRef, "items"), generatedItemId), {
  //       ...inventoryItem,
  //       qrCode: encryptedData,
  //       roomNumber: values.labRoom,
  //     });
 
  //     // 🔽 Fetch all items under this labRoom
  //     const labRoomItemsSnap = await getDocs(collection(labRoomRef, "items"));
 
  //     // 🔽 Generate encrypted QR code with labRoom ID only
  //     const labRoomQRData = CryptoJS.AES.encrypt(
  //       JSON.stringify({
  //         labRoomId: labRoomRef.id,
  //       }),
  //       SECRET_KEY
  //     ).toString();
 
  //     // 🔽 Update labRoom document with the generated QR code
  //     await updateDoc(labRoomRef, {
  //       qrCode: labRoomQRData,
  //       updatedAt: new Date(),
  //     });
 
  //     setDataSource([...dataSource, newItem]);
  //     setLogRefreshKey(prev => prev + 1);
  //     setCount(count + 1);
  //     form.resetFields();
  //     setItemName("");
  //     setItemDetails("")
  //     setItemId("");
  //     setIsModalVisible(false);
 
  //   } catch (error) {
  //     console.error("Error adding document to Firestore:", error);
  //   }
  // };

  // BACKEND
  // const handleAdd = async (values) => {
  //   try {
  //     const response = await fetch("https://webnuls.onrender.com/add-inventory", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         ...values,
  //         itemName,
  //         itemDetails,
  //         userId: localStorage.getItem("userId"),
  //         userName: localStorage.getItem("userName"),
  //       }),
  //     });

  //     const data = await response.json();

  //     if (response.ok) {
  //       setNotificationMessage("Item successfully added!");
  //       setIsNotificationVisible(true);
  //       setIsModalVisible(false);
  //       setItemName("");
  //       setItemDetails("");
  //       form.resetFields();
        
  //     } else {
  //       alert(data.error || "Failed to add item.");
  //     }
  //   } catch (error) {
  //     console.error("Error calling API:", error);
  //   }
  // };

  // BACKEND WITH CRITICAL LEVEL
  const handleAdd = async (values) => {
    setLoading(true); // Start loading
    try {
      // Validate local inputs
      if (!itemName || !values.department || !itemDetails) {
        alert("Please fill up the form!");
        return;
      }

      // Prepare core fields
      const trimmedName = itemName.trim();
      const trimmedDetails = itemDetails.trim();
      const userId = localStorage.getItem("userId");
      const userName = localStorage.getItem("userName");

      // Format dates
      const formattedEntryDate = values.entryDate ? values.entryDate.format("YYYY-MM-DD") : null;
      const formattedExpiryDate = values.expiryDate
        ? values.expiryDate.format("YYYY-MM-DD")
        : null;

      // Build payload for backend
      const payload = {
        ...values,
        itemName: trimmedName,
        itemDetails: trimmedDetails,
        entryDate: formattedEntryDate,
        expiryDate: values.type === "Fixed" ? null : formattedExpiryDate,
        userId,
        userName,
      };

      const response = await fetch("https://webnuls.onrender.com/add-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setNotificationMessage(result.message || "Item successfully added!");
        setIsNotificationVisible(true);
        setIsModalVisible(false);
        setItemName("");
        setItemDetails("");
        form.resetFields();
      } else {
        alert(result.error || "Failed to add item.");
      }
    } catch (error) {
      console.error("Error calling API:", error);
      alert("An unexpected error occurred while adding the item.");
    }finally {
    setLoading(false); // Always stop loading
  }
  };

  // const editItem = (record, clearFields = true) => {
  //   editForm.resetFields();
  //   setEditingItem(record);
  //   setSelectedCategory(record.category);

  //   const hasExpiry = record.category === "Chemical" || record.category === "Reagent";
  //   setHasExpiryDate(hasExpiry); // This controls if the Expiry field is shown

  //   editForm.setFieldsValue({
  //     quantity: clearFields ? null : record.quantity,
  //     expiryDate: hasExpiry
  //       ? (clearFields ? null : (record.expiryDate ? dayjs(record.expiryDate) : null))
  //       : null,
  //     condition: {
  //       Good: record.condition?.Good ?? 0,
  //       Defect: record.condition?.Defect ?? 0,
  //       Damage: record.condition?.Damage ?? 0,
  //       Lost: record.condition?.Lost ?? 0,
  //     },
  //   });

  //   setIsEditModalVisible(true);
  // };

  const editItem = (record, clearFields = true) => {
    editForm.resetFields();
    setEditingItem(record);
    setSelectedCategory(record.category);

    const hasExpiry = record.category === "Chemical" || record.category === "Reagent";
    const isTrackCondition = record.category !== "Chemical" && record.category !== "Reagent";

    setHasExpiryDate(hasExpiry); // controls whether expiry field is shown

    const fieldsToSet = {
      quantity: clearFields ? null : record.quantity,
      expiryDate: hasExpiry
        ? (clearFields ? null : (record.expiryDate ? dayjs(record.expiryDate) : null))
        : null,
    };

    if (isTrackCondition) {
      fieldsToSet.condition = {
        Good: record.condition?.Good ?? 0,
        Defect: record.condition?.Defect ?? 0,
        Damage: record.condition?.Damage ?? 0,
        Lost: record.condition?.Lost ?? 0,
      };
    }

    editForm.setFieldsValue(fieldsToSet);
    setIsEditModalVisible(true);
  };

// FRONTEND
// const updateItem = async (values) => {
//   console.log("✅ Raw incoming values:", values);

//   const isChemicalOrReagent =
//     editingItem.category === "Chemical" || editingItem.category === "Reagent";

//   // Sanitize quantity
//   const addedQuantity = Number(values.quantity);
//   if (isNaN(addedQuantity) || addedQuantity < 0) {
//     console.warn("❌ Invalid quantity value.");
//     return;
//   }

//   // Ensure expiryDate is valid
//   let sanitizedExpiryDate = null;
//   if (isChemicalOrReagent && values.expiryDate) {
//     sanitizedExpiryDate = values.expiryDate.isValid() ? values.expiryDate.format("YYYY-MM-DD") : null;
//   }

//   try {
//     const snapshot = await getDocs(collection(db, "inventory"));

//     snapshot.forEach(async (docItem) => {
//       const data = docItem.data();

//       if (data.itemId === editingItem.itemId) {
//         const inventoryId = docItem.id;
//         const itemRef = doc(db, "inventory", inventoryId);
//         const existingLabRoom = data.labRoom;

//         if (!existingLabRoom) {
//           console.warn("❌ Item has no labRoom, cannot update labRoom/items subcollection.");
//           return;
//         }

//         // Sanitize and compute new condition
//         const prevCondition = data.condition || { Good: 0, Defect: 0, Damage: 0 };
//         const newCondition = {
//           Good: prevCondition.Good + addedQuantity,
//           Defect: prevCondition.Defect,
//           Damage: prevCondition.Damage,
//           Lost: prevCondition.Lost,
//         };

//         // Ensure quantity is valid and sanitize it
//         const prevQuantity = Number(data.quantity) || 0;
//         const newQuantity = prevQuantity + addedQuantity;

//         if (newQuantity < 0) {
//           console.warn("❌ Quantity cannot be negative.");
//           return;
//         }

//         const updatedData = {
//           labRoom: existingLabRoom,
//           quantity: newQuantity,
//           condition: newCondition,
//         };

//         if (sanitizedExpiryDate) {
//           updatedData.expiryDate = sanitizedExpiryDate;
//         }

//         // 🔄 Update inventory document
//         await updateDoc(itemRef, updatedData);

//         setIsNotificationVisible(true);
//         setNotificationMessage("Item updated successfully!");

//           const userId = localStorage.getItem("userId");
//           const userName = localStorage.getItem("userName") || "User";

//           await addDoc(collection(db, `accounts/${userId}/activitylog`), {
//             action: `Item (${data.itemName}) updated`,
//             userName: userName || "User",
//             timestamp: serverTimestamp(),
//           });


//         const updatedItem = {
//           ...editingItem,
//           ...updatedData,
//         };

//         setDataSource((prevData) =>
//           prevData.map((item) => (item.id === editingItem.id ? updatedItem : item))
//         );

//         // 🔄 Update labRoom subcollection
//         const roomNumber = existingLabRoom.toString().padStart(4, "0");
//         const labRoomQuery = query(collection(db, "labRoom"), where("roomNumber", "==", roomNumber));
//         const labRoomSnapshot = await getDocs(labRoomQuery);

//         if (!labRoomSnapshot.empty) {
//           const labRoomDoc = labRoomSnapshot.docs[0];
//           const labRoomRef = labRoomDoc.ref;

//           const labRoomItemRef = doc(collection(labRoomRef, "items"), data.itemId);
//           const labRoomItemSnap = await getDoc(labRoomItemRef);

//           if (labRoomItemSnap.exists()) {
//             await updateDoc(labRoomItemRef, updatedData);

//             // 🧾 Stock log logic
//             const stockLogRef = collection(db, "inventory", inventoryId, "stockLog");
//             const latestLogQuery = query(stockLogRef, orderBy("createdAt", "desc"), limit(1));
//             const latestSnapshot = await getDocs(latestLogQuery);

//             let newDeliveryNumber = "DLV-00001";
//             if (!latestSnapshot.empty) {
//               const lastDeliveryNumber = latestSnapshot.docs[0].data().deliveryNumber;
//               const match = lastDeliveryNumber?.match(/DLV-(\d+)/);
//               if (match) {
//                 const nextNum = (parseInt(match[1], 10) + 1).toString().padStart(5, "0");
//                 newDeliveryNumber = `DLV-${nextNum}`;
//               }
//             }

//             const logPayload = {
//               date: new Date().toISOString().split("T")[0],
//               deliveryNumber: newDeliveryNumber,
//               createdAt: serverTimestamp(),
//               noOfItems: addedQuantity,
//               ...(sanitizedExpiryDate && {
//                 expiryDate: sanitizedExpiryDate,
//               }),
//             };

//             await addDoc(stockLogRef, logPayload);
//           } else {
//             console.warn(`⚠️ Item ${data.itemId} not found in labRoom`);
//           }
//         } else {
//           console.warn(`⚠️ No labRoom found with roomNumber "${roomNumber}"`);
//         }

//         setIsEditModalVisible(false);
//         setIsRowModalVisible(false);
//         setEditingItem(null);
//         form.resetFields();
//       }
//     });
//   } catch (error) {
//     console.error("Error updating document in Firestore:", error);
//   }
// };

// BACKEND
 const updateItem = async (values) => {
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName") || "User";

    if (!editingItem || !editingItem.itemId) {
      setNotificationMessage("Failed Editing Item");
      setIsNotificationVisible(true);
      return;
    }

    const addedQuantity = Number(values.quantity);
    if (isNaN(addedQuantity) || addedQuantity < 0) {
      setNotificationMessage("Invalid Quantity!");
      setIsNotificationVisible(true);
      return;
    }

    const expiryDate =
      values.expiryDate?.isValid?.() ? values.expiryDate.format("YYYY-MM-DD") : null;

    try {
      const response = await axios.post("https://webnuls.onrender.com/update-inventory-item", {
        userId,
        userName,
        values: {
          quantity: addedQuantity,
          expiryDate,
          editingItem, // includes itemId, category, labRoom, etc.
        },
      });

      if (response.status === 200) {
        setNotificationMessage("Item updated successfully!");
        setIsNotificationVisible(true);

        const updatedItem = {
          ...editingItem,
          quantity: editingItem.quantity + addedQuantity,
          ...(expiryDate && { expiryDate }),
        };

        setDataSource((prev) =>
          prev.map((item) => (item.itemId === editingItem.itemId ? updatedItem : item))
        );

        setIsEditModalVisible(false);
        setIsRowModalVisible(false);
        setEditingItem(null);
        form.resetFields();

      } else {
        setNotificationMessage("Failed to update Item!");
        setIsNotificationVisible(true);
      }
    } catch (err) {
      console.error("Backend update failed:", err);
    }
  };

useEffect(() => {
  if (isEditModalVisible) {
    form.setFieldsValue({
      quantity: undefined,
      expiryDate: null
    });
  }
}, [isEditModalVisible]);


  const printQRCode = (record) => {
    html2canvas(qrRefs.current[record.id]).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      pdf.text("Scan this QR Code", 80, 10);
      pdf.addImage(imgData, "PNG", 40, 20, 120, 120);
      pdf.save(`QRCode_${record.id}.pdf`);
    });
  };

  const handleDelete = (record) => {
    setItemToDelete(record);
    setDeleteModalVisible(true);
    setIsRowModalVisible(false)
  };  

  const columns = [
    { title: "Item ID", dataIndex: "itemId", key: "itemId" },
    { title: "Item Name", dataIndex: "itemName", key: "itemName", 
      sorter: (a, b) => a.itemName.localeCompare(b.itemName),
      sortDirections: ['ascend', 'descend'],
      defaultSortOrder: 'ascend', 
    },
    { title: "Category", dataIndex: "category", key: "category", 

    },
    { title: "Item Description", dataIndex: "itemDetails", key: "itemDetails" },
    {
      title: "Inventory Balance",
      dataIndex: "quantity",
      key: "quantity",
    },
    { title: "Status", dataIndex: "status", key: "status" },   
  ];

  const disabledDate = (current) => {
    return current && current < dayjs().startOf("day");
  };

  // Optional: disable expiry dates before entry date (if entryDate is used)
  const disabledExpiryDate = (current) => {
    const entryDate = form.getFieldValue("entryDate");
    if (!entryDate) {
      // If entryDate not selected yet, just disable past dates
      return current && current < dayjs().startOf("day");
    }
    // Disable dates before the selected entryDate
    return current && current < dayjs(entryDate).startOf("day");
  };

  const formatCondition = (condition, category) => {
    if (category === 'Chemical' || category === 'Reagent') {
      return 'N/A';
    }

    if (condition && typeof condition === 'object') {
      return `Good: ${condition.Good ?? 0}, Defect: ${condition.Defect ?? 0}, Damage: ${condition.Damage ?? 0}, Lost: ${condition.Lost ?? 0}`;
    }

    return condition || 'N/A';
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>

      <Layout style={{paddingTop: 0}}>
        <Content className="content inventory-container" style={{paddingTop: 0, paddingBottom: 150}}>
    
          

          <div className="inventory-header">
              

          {!isModalVisible && (
            <div style={{backgroundColor: 'red'}}>
              <div className="add-item-button">
            <Button 
            className="inner-btn"
             type="primary" onClick={showModal}
             style={{borderRadius: 500, width: '100%', height: '100%', backgroundColor: '#0f3c4c', fontWeight: 'bold', fontSize: '15px', paddingRight: 20, paddingLeft: 20}}
             >
              Add Item to Inventory
              <PlusOutlined style={{fontSize: 18}}/>
            </Button>
            </div>

  <FloatButton.Group
    trigger="hover"
    type="primary"
    icon={<DownloadOutlined />}
    className="custom-float-btn-group"
    style={{
      right: 70,
      bottom: 85,
    }}
  >
    <FloatButton
      icon={
        <FilePdfOutlined
          style={{
            fontSize: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        />
      }
      onClick={saveAsPdf}
      tooltip="Download PDF"
      className="gradient-float-btn"
      style={{ width: 60, height: 60, }}
    />
    <FloatButton
    onClick={exportToExcel}
        icon={
    <FileExcelOutlined
      style={{
        fontSize: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    />
  }
      tooltip="Export Excel"
      className="gradient-float-btn"
      style={{ width: 60, height: 60 }}
    />
    <FloatButton
    onClick={printPdf}
        icon={
    <PrinterOutlined
      style={{
        fontSize: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    />
  }
      tooltip="Print"
      className="gradient-float-btn"
      style={{ width: 60, height: 60, marginBottom: 20 }}
    />
  </FloatButton.Group>
          </div>
            )
          }
              <Input.Search
                placeholder="Search"
                className="search-bar"
                style={{
                  height: '100%',              // Stretch to parent
                  display: 'flex',             // Flex container
                  alignItems: 'center'         // Center internal input
                }}
                
                allowClear
                onInput={(e) => {
                  const sanitized = sanitizeInput(e.target.value);
                  e.target.value = sanitized;
                  setSearchText(sanitized);
          }}
              />

              <Select
                allowClear
                placeholder="Filter by Department"
                style={{ height: '80%', flex: 1}}
                onChange={(value) => setFilterDepartment(value)}
              >
                {departmentsAll.map((dept) => (
                  <Option key={dept.id} value={dept.name}>
                    {dept.name}
                  </Option>
                ))}
              </Select>

              <Select
                allowClear
                placeholder="Filter by Category"
                style={{flex:1,  height: '80%' }}
                onChange={(value) => setFilterCategory(value)}
              >
                <Option value="Chemical">Chemical</Option>
                <Option value="Reagent">Reagent</Option>
                <Option value="Materials">Materials</Option>
                <Option value="Equipment">Equipment</Option>
                <Option value="Glasswares">Glasswares</Option>
              </Select>

              <Select
                allowClear
                placeholder="Filter by Item Type"
                style={{flex:1,  height: '80%' }}
                onChange={(value) => setFilterItemType(value)}
              >
                <Option value="Fixed">Fixed</Option>
                <Option value="Consumable">Consumable</Option>
              </Select>

              <Button
                className="reset-filters-button"
                onClick={() => {
                  setFilterCategory(null);
                  setFilterItemType(null);
                  // setFilterUsageType(null);
                  setSearchText('');
                }}
              >
                Reset Filters
              </Button>
            
            {/* <div style={{display: 'flex', flex: 1, height: '100%', alignItems: 'center', gap: 10}}>
              <Button className="export-excel-button" type="primary" onClick={exportToExcel}>
                Export to Excel
              </Button>

              <Button className="save-pdf-button" type="primary" onClick={saveAsPdf}>
                Save as PDF
              </Button>

              <Button className="print-pdf-button" type="primary" onClick={printPdf}>
                Print PDF
              </Button>
            </div> */}
  
          </div> 

          <Table
            dataSource={filteredData}
            columns={columns}
            rowKey={(record) => record.itemId}
            bordered
            pagination={{pageSize: 12}}
            className="inventory-table"
            loading={{ spinning: loading, tip: "Loading inventory data..." }}
            onRow={(record) => {
              return {
                onClick: () => {
                  setIsRowModalVisible(false);
                  setSelectedRow(null);

                  // Ensure state updates flush before reopening
                  setTimeout(() => {
                    setSelectedRow(record);
                    setIsRowModalVisible(true);
                  }, 100);
                },
              };
            }}
          />

             <Modal
      className="add-modal"
      title="Add Item to Inventory"
      open={isModalVisible}
      onCancel={handleCancel}
      footer={null}
      width={1000}
      zIndex={1024}
      
    >
      
      <div className="add-header">
        <EditOutlined style={{margin: 0, color: 'white', fontSize: 20, height: '100%'}}/>
        <h3 style={{margin:0,color: '#fff'}}>Add Item to Inventory</h3>
      </div>
      <Spin spinning={loading} tip="Loading inventory data...">
      <Form
        layout="vertical"
        form={form}
        onFinish={handleAdd}
        className="inventory-form"
        style={{marginTop: 50}}
      >
        <h3 style={{marginBottom: 25}}>Item Details</h3>

        <div style={{ border: '1px solid #ececec', borderTopWidth: 0, borderRightWidth: 0, borderLeftWidth: 0, marginBottom: 25}}>
        <Row gutter={16} style={{marginBottom: 20}}>
          <Col xs={24} md={8}>
            <Form.Item
              name="Item Name"
              label="Item Name"
              rules={[{ required: true, message: "Please enter Item Name!" }]}
              tooltip="Enter only letters and spaces"
            >
              <Input
                className="add-input"
                placeholder="Enter Item Name"
                value={itemName}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                  setItemName(value);
                }}
                onKeyDown={(e) => {
                  const allowedKeys = ["Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete", " "];
                  const isLetter = /^[a-zA-Z]$/.test(e.key);
                  if (!isLetter && !allowedKeys.includes(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="Item Description"
              label="Item Description"
              rules={[{ required: true, message: "Please enter Item Description!" }]}
              tooltip="Use clear, concise language"
            >
              <Input
                className="add-input"
                placeholder="Enter Item Description"
                value={itemDetails}
                onInput={(e) => {
                  const sanitized = e.target.value.replace(/[<>]/g, "");
                  e.target.value = sanitized;
                  setItemDetails(sanitized);
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: "Please select a category!" }]}
            >
              <Select placeholder="Select Category" onChange={handleCategoryChange}
              className="add-input">
                <Option value="Chemical">Chemical</Option>
                <Option value="Reagent">Reagent</Option>
                <Option value="Materials">Materials</Option>
                <Option value="Equipment">Equipment</Option>
                <Option value="Glasswares">Glasswares</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        </div>
          
        <h3 style={{marginBottom: 25}}>Inventory Information</h3>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              name="quantity"
              label="Quantity"
              rules={[{ required: true, message: "Please enter Quantity!" }]}
            >
              <Input
              className="add-input"
                placeholder="Enter quantity"
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/\D/g, "");
                }}
              />
            </Form.Item>
          </Col>

          {['Chemical', 'Reagent'].includes(selectedCategory) && (
            <Col xs={24} md={8}>
              <Form.Item
                name="unit"
                label="Unit"
                rules={[{ required: true, message: "Please select a unit!" }]}
              >
                <Select placeholder="Select unit"
                className="add-input">
                  <Option value="ml">ml</Option>
                  <Option value="g">g</Option>
                </Select>
              </Form.Item>
            </Col>
          )}

          <Col xs={24} md={8}>
            <Form.Item
              name="criticalLevel"
              label="Critical Level"
              rules={[
                { required: true, message: "Please enter desired Critical Stock!" },
                {
                  validator: (_, value) => {
                    const numeric = parseInt(value, 10);
                    if (!value || isNaN(numeric) || numeric < 1) {
                      return Promise.reject("Value must be a number greater than 0");
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input
              className="add-input"
                placeholder="Enter Critical Stock"
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/\D/g, "");
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item name="entryDate" label="Date of Entry">
              <DatePicker
              className="add-input"
                format="YYYY-MM-DD"
                style={{ width: "100%" }}
                defaultValue={dayjs()}
                disabled
              />
            </Form.Item>
          </Col>

          {['Chemical', 'Reagent'].includes(selectedCategory) && (
            <>
              <Col xs={24} md={8}>
                <Form.Item label="Does this item expire?">
                  <Radio.Group
                    onChange={(e) => setShowExpiry(e.target.value)}
                    value={showExpiry}
                  >
                    <Radio value={true}>Yes</Radio>
                    <Radio value={false}>No</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>

              {showExpiry && (
                <Col xs={24} md={8}>
                  <Form.Item
                    name="expiryDate"
                    label="Date of Expiry"
                    rules={[{ required: true, message: "Please select expiry date!" }]}
                  >
                    <DatePicker
                    className="add-input"
                      format="YYYY-MM-DD"
                      style={{ width: "100%" }}
                      disabledDate={disabledExpiryDate}
                    />
                  </Form.Item>
                </Col>
              )}
            </>
          )}
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              name="type"
              label="Item Type"
              rules={[{ required: true, message: "Please select Item Type!" }]}
            >
              <Select
              className="add-input"
                value={itemType}
                onChange={(value) => setItemType(value)}
                disabled
                placeholder="Select Item Type"
              >
                <Option value="Fixed">Fixed</Option>
                <Option value="Consumable">Consumable</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="department"
              label="Department"
              rules={[{ required: true, message: "Please select a department" }]}
            >
              <Select
              className="add-input"
                placeholder="Select department"
                loading={!departmentsAll.length}
                disabled={!departmentsAll.length}
              >
                {departmentsAll.map((dept) => (
                  <Option key={dept.id} value={dept.name}>
                    {dept.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>  
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="labRoom"
              label="Stock Room"
              rules={[
                { required: true, message: "Please enter Stock Room!" },
                {
                  validator: (_, value) => {
                    if (!value || !/^\d+$/.test(value)) {
                      return Promise.reject("Lab room must be a numeric value");
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input
              className="add-input"
                placeholder="Enter Lab/Stock Room"
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/\D/g, "");
                }}
                onKeyDown={(e) => {
                  const allowedKeys = ["Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete"];
                  if (!/^\d$/.test(e.key) && !allowedKeys.includes(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="shelves"
              label="Shelves"
              rules={[
                { required: false }, // Optional field
                {
                  pattern: /^[a-zA-Z0-9]*$/, // Only allows letters and numbers (no spaces or special characters)
                  message: 'Shelves can only contain letters and numbers (no spaces or special characters).',
                },
              ]}
            >
              <Input
                className="add-input"
                placeholder="Enter Shelves"
                onInput={(e) => {
                  // Prevent entering spaces or special characters
                  e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="row"
              label="Row"
              rules={[
                { required: false }, // Optional field
                {
                  pattern: /^[a-zA-Z0-9]*$/, // Only allows letters and numbers (no spaces or special characters)
                  message: 'Row can only contain letters and numbers (no spaces or special characters).',
                },
              ]}
            >
              <Input
                className="add-input"
                placeholder="Enter Row"
                onInput={(e) => {
                  // Prevent entering spaces or special characters
                  e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ textAlign: "right" }}>
          <Button type="primary" htmlType="submit">
            Add to Inventory
          </Button>
        </Form.Item>
      </Form>
      </Spin>
    </Modal>

          <Modal
            title="Edit Item Details"
            visible={isFullEditModalVisible}
            onCancel={() => setIsFullEditModalVisible(false)}
            onOk={() => fullEditForm.submit()}
            width={800}
            zIndex={1030}
          >
            <Form form={fullEditForm} layout="vertical" onFinish={handleFullUpdate}
            onValuesChange={(changedValues, allValues) => {
                if ('condition' in changedValues) {
                  const condition = allValues.condition || {};
                  const originalGood = editingItem.condition?.Good ?? 0;

                  const defect = Number(condition.Defect) || 0;
                  const damage = Number(condition.Damage) || 0;
                  const lost = Number(condition.Lost) || 0;

                  const newGood = originalGood - defect - damage - lost;

                  if (newGood < 0) {
                    fullEditForm.setFields([
                      {
                        name: ['condition', 'Defect'],
                        errors: ['Sum of Defect, Damage and Lost cannot exceed original Good quantity'],
                      },
                      {
                        name: ['condition', 'Damage'],
                        errors: ['Sum of Defect, Damage and Lost cannot exceed original Good quantity'],
                      },
                      {
                        name: ['condition', 'Lost'],
                        errors: ['Sum of Defect, Damage and Lost cannot exceed original Good quantity'],
                      },
                    ]);
                  } else {
                    fullEditForm.setFields([
                      { name: ['condition', 'Defect'], errors: [] },
                      { name: ['condition', 'Damage'], errors: [] },
                      { name: ['condition', 'Lost'], errors: [] },
                    ]);
                    const currentGood = fullEditForm.getFieldValue(['condition', 'Good']) || 0;
                    if (currentGood !== newGood) {
                      fullEditForm.setFieldsValue({ condition: { ...condition, Good: newGood } });
                    }
                  }
                }
              }}
              >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Item Name"
                  name="itemName"
                  rules={[{ required: true, message: "Please enter Item Name!" }]}
                >
                  <Input onInput={(e) => {
                      const sanitized = sanitizeInput(e.target.value);
                      e.target.value = sanitized;
                    }} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item label="Item Description" name="itemDetails">
                 <Input onInput={(e) => {
                          const sanitized = sanitizeInput(e.target.value);
                          e.target.value = sanitized;
                        }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Category"
                  name="category"
                  rules={[{ required: true, message: "Please select category!" }]}
                >
                  <Select>
                    <Option value="Chemical">Chemical</Option>
                    <Option value="Reagent">Reagent</Option>
                    <Option value="Materials">Materials</Option>
                    <Option value="Equipment">Equipment</Option>
                    <Option value="Glasswares">Glasswares</Option>
                  </Select>
                </Form.Item>
              </Col>

                <Col span={8}>
                  <Form.Item
                    name="department"
                    label="Department"
                    rules={[{ required: true, message: "Please select a department" }]}
                  >
                    <Select
                      placeholder="Select department"
                      loading={!departmentsAll.length}
                      disabled={!departmentsAll.length}
                    >
                      {departmentsAll.map((dept) => (
                        <Select.Option key={dept.id} value={dept.name}>
                          {dept.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
               <Form.Item
                      name="criticalLevel"
                      label="Critical Level"
                      rules={[
                        { required: true, message: "Please enter desired Critical Stock!" },
                        {
                          validator: (_, value) => {
                            const numeric = parseInt(value, 10);
                            if (!value || isNaN(numeric) || numeric < 1) {
                              return Promise.reject("Value must be a number greater than 0");
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <Input
                        placeholder="Enter Critical Stock"
                        onInput={(e) => {
                          e.target.value = e.target.value.replace(/\D/g, ""); // Keep digits only
                        }}
                      />
                    </Form.Item>

              </Col>

              <Col span={12}>
                <Form.Item label="Lab/ Stock Room" name="labRoom">
                  <Input />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="Shelf"
                  name="shelves"
                  rules={[{ required: true, message: "Enter shelf ID (e.g., A)" }]}
                >
                  <Input maxLength={2} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="Row"
                  name="row"
                  rules={[{ required: true, message: "Enter row number" }]}
                >
                  <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Status" name="status">
                  <Select>
                    <Option value="Available">Available</Option>
                    <Option value="In Use">In Use</Option>
                    <Option value="Damaged">Damaged</Option>
                  </Select>
                </Form.Item>
              </Col>
                {["Chemical", "Reagent"].includes(selectedCategory) && (
                <Col span={12}>
                  <Form.Item label="Unit" name="unit">
                    <Select>
                      <Option value="ml">ml</Option>
                      <Option value="g">g</Option>
                    </Select>
                  </Form.Item>
                </Col>
            )}
            </Row>
             {(selectedCategory === "Glasswares" || selectedCategory === "Equipment"|| selectedCategory ==="Materials") && (
                   <Row gutter={16}>
                    <Form.Item
                      label="Good"
                      name={['condition', 'Good']}
                      rules={[{ required: true, message: "Please enter Good quantity" }]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                      label="Defect"
                      name={['condition', 'Defect']}
                      rules={[{ required: true, message: "Please enter Defect quantity" }]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                      label="Damage"
                      name={['condition', 'Damage']}
                      rules={[{ required: true, message: "Please enter Damage quantity" }]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                      label="Lost"
                      name={['condition', 'Lost']}
                      rules={[{ required: true, message: "Please enter Lost quantity" }]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Row>
                )}
            </Form>
          </Modal>
           

          <Modal
            visible={isRowModalVisible}
            footer={null}
            onCancel={() => setIsRowModalVisible(false)}
            zIndex={1019}
            closable={true} 
            width={'70%'}
          
          >
            {selectedRow && (
              <div style={{display: 'flex',flexDirection: 'column', gap: 40}}>
                  <div ref={headerRef} className="modal-header">
                  
                  <h1 style={{color: "white"  , margin: 0}}><FileTextOutlined style={{color: 'white', fontSize: 27, marginRight: 20}}/>Item Details - {selectedRow.itemName}</h1>
                </div>
                
                <div style={{flexDirection: 'row', display: 'flex', justifyContent: 'space-between'}}>
              
                <div style={{marginTop: headerHeight || 70, borderRadius: 10, flexDirection: 'row', display: 'flex', width: '70%', gap: 50, marginLeft: 20  }}>

                <div className="table-wrapper">
                  <table className="horizontal-table">
                      <tbody>
                        <tr>
                          <th>Item ID</th>
                          <td>{selectedRow.itemId}</td>
                        </tr>

                        <tr>
                          <th>Item Name</th>
                          <td>{selectedRow.itemName}</td>
                        </tr>
                        <tr>
                          <th>Item Description</th>
                          <td>{selectedRow.itemDetails}</td>
                        </tr>

                        <tr>
                          <th>Inventory Balance</th>
                          <td>
                            {selectedRow.quantity}
                  {/* {["Glasswares", "Chemical", "Reagent"].includes(selectedRow.category) && " pcs"}
                  {["Chemical", "Reagent"].includes(selectedRow.category) && selectedRow.unit && ` / ${selectedRow.unit} ML`}
                   {selectedRow.category === "Glasswares" && selectedRow.volume && (
                  <p>
                    <strong>Volume:</strong> {selectedRow.volume} ML
                  </p>
                )} */}
                          </td>
                        </tr>

                        {["Chemical", "Reagent"].includes(selectedRow.category) && selectedRow.unit && (
                          <tr>
                            <th>Unit</th>
                            <td>{selectedRow.unit}</td>
                          </tr>
                        )}

                        <tr>
                          <th>Item Type</th>
                          <td>{selectedRow.type}</td>
                        </tr>

                        <tr>
                          <th>Category</th>
                          <td>{selectedRow.category}</td>
                        </tr>

                        {/* <tr>
                          <th>Date of Entry (latest)</th>
                          <td>{selectedRow.entryCurrentDate || 'N/A'}</td>
                        </tr> */}
                      </tbody>
                    </table>
                    </div>

                    <div className="table-wrapper">
                    <table className="horizontal-table">
                      <tbody>
                        <tr>
                          <th>Status</th>
                          <td>{selectedRow.status}</td>
                        </tr>

                        <tr>
                          <th>Department</th>
                          <td>{selectedRow.department}</td>
                        </tr>

                        {/* <tr>
                          <th>Category</th>
                          <td>{selectedRow.category}</td>
                        </tr> */}

                        <tr>
                          <th>Critical Level</th>
                          <td>{selectedRow.criticalLevel || 'N/A'}</td>
                        </tr>
                        <tr>

                          <th>Condition</th>
                          <td>{formatCondition(selectedRow.condition, selectedRow.category)}</td>
                        </tr>
                        
                        <tr>
                          <th>Stock Room</th>
                          <td>{selectedRow.labRoom}</td>
                        </tr>
                        
                       <tr>
                          <th>Shelf</th>
                          <td>{selectedRow.shelves}, {selectedRow.row}</td>
                        </tr>

                      </tbody>
                    </table>
                    </div>
        
                </div>

                <div style={{justifyContent:'center', display: 'flex', flexDirection: 'column', width: '30%', marginRight: -20, marginTop: 50}}>
                  <div style={{ marginTop: 24, textAlign: 'center' }}>
                    <h4>Item QR Code</h4>
                    {selectedRow.qrCode ? (
                      <QRCodeSVG value={selectedRow.qrCode} size={250} />
                    ) : (
                      <p>No QR Code Available</p>
                    )}

                    <div style={{ marginTop: 24, textAlign: 'center', gap: 10, width: '100%', display: 'flex', justifyContent: 'center'}}>
                    <Button
                      type="primary"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(selectedRow)}
                    >
                      Archive
                    </Button>

                   <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRow(selectedRow);
                      editItem(selectedRow, true); // clears quantity & expiry
                    }}
                  >
                    Update Stock
                  </Button>

                    <Button type="primary" onClick={() => openFullEditModal(selectedRow)}>
                      Edit Item
                    </Button>
                    
                    <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleRestockRequest(selectedRow)} // Opens restock request modal
                  >
                    Request Restock
                  </Button>


                    </div>
                  </div>
                  </div>
                  </div>

                  <div>
                    <h2>Stock Log</h2>

                    {/* <table className="delivery-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>No. of Items</th>
                        <th>Delivery #</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>2025-05-30</td>
                        <td>10</td>
                        <td>DLV-00123</td>
                      </tr>
                      <tr>
                        <td>2025-05-29</td>
                        <td>7</td>
                        <td>DLV-00122</td>
                      </tr>
                    </tbody>
                  </table> */}
                  <StockLog inventoryDocId={selectedRow?.docId} />
                  </div>
              </div>
            )}
          </Modal>

          <Modal
            title="Item QR Code"
            visible={qrModalVisible}
            onCancel={() => setQrModalVisible(false)}
            footer={null}
            zIndex={1018}
          >
            {selectedItemName && (
              <div style={{ textAlign: 'center' }}>
                <p><strong>Item Name:</strong> {selectedItemName}</p>
                {selectedQrCode ? (
                  <QRCodeCanvas value={selectedQrCode} size={200} />
                ) : (
                  <p>No QR Code Available</p>
                )}
              </div>
            )}
          </Modal>

          <Modal
            title="Update Inventory Balance"
            visible={isEditModalVisible}
            onCancel={() => setIsEditModalVisible(false)}
            onOk={() => editForm.submit()}
            zIndex={1020}
          >
            <Form layout="vertical" 
              form={editForm} 
              onFinish={updateItem}
              onValuesChange={(changedValues, allValues) => {
                if ('quantity' in changedValues) {
                  const newQuantity = parseInt(changedValues.quantity || 0);

                  // Delay to ensure it runs after React updates internal state
                  setTimeout(() => {
                    editForm.setFieldsValue({
                      condition: {
                        Good: newQuantity,
                        Defect: 0,
                        Damage: 0,
                        Lost: 0,
                      },
                    });
                  }, 0);
                }
              }}
            >
              <Row gutter={16}>
                {/* <Col span={12}>
                  <Form.Item
                    name="category"
                    label="Category"
                    rules={[
                      { required: true, message: "Please select a category!" },
                    ]}
                  >
                    <Select placeholder="Select Category">
                      <Option value="Chemical">Chemical</Option>
                      <Option value="Reagent">Reagent</Option>
                      <Option value="Materials">Materials</Option>
                      <Option value="Equipment">Equipment</Option>
                      <Option value="Glasswares">Glasswares</Option>
                    </Select>
                  </Form.Item>
                </Col> */}

                {/* <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="usageType" label="Usage Type">
                    <Select placeholder="Select Usage Type">
                      <Option value="Laboratory Experiment">Laboratory Experiment</Option>
                      <Option value="Research">Research</Option>
                      <Option value="Community Extension">Community Extension</Option>
                      <Option value="Others">Others</Option>
                    </Select>
                  </Form.Item>
                </Col>
               </Row> */}

                {/* <Col span={12}>
                  <Form.Item
                    name="labRoom"
                    label="Stock Room"
                    rules={[
                      {
                        required: true,
                        message: "Please enter Stock Room!",
                      },
                    ]}
                  >
                    <Input placeholder="Enter Stock Room" />
                  </Form.Item>
                </Col> */}

                <Col span={12}>
               <Form.Item
                  name="quantity"
                  label="Quantity"
                  dependencies={[["condition"]]}
                  rules={[
                    { required: true, message: "Please enter quantity" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const condition = getFieldValue("condition") || {};
                        const totalCondition =
                          (parseInt(condition.Good) || 0) +
                          (parseInt(condition.Defect) || 0) +
                          (parseInt(condition.Damage) || 0) +
                          (parseInt(condition.Lost) || 0);

                        if (!value || isNaN(parseInt(value))) {
                          return Promise.reject("Quantity must be a number");
                        }

                        if (parseInt(value) !== totalCondition) {
                          return Promise.reject("Quantity must equal sum of Good, Defect, Damage and Lost");
                        }

                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <Input
                    placeholder="Enter quantity"
                    onInput={(e) => {
                      e.target.value = e.target.value.replace(/\D/g, "");
                    }}
                  />
                </Form.Item>


                  {hasExpiryDate && (
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          label="Expiry Date"
                            name="expiryDate"
                            rules={[{ required: true, message: "Please select expiry date" }]}
                          >
                            <DatePicker style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  )}
                </Col>
              </Row>

              {/* <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="quantity" label="Quantity">
                    <Input placeholder="Enter quantity" />
                  </Form.Item>
                </Col>
              </Row> */}

              {/* <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="status" label="Status">
                    <Select placeholder="Select Status">
                      <Option value="Available">Available</Option>
                      <Option value="In Use">In Use</Option>
                      <Option value="Damaged">Damaged</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="condition" label="Condition">
                    <Select placeholder="Select Condition">
                      <Option value="Good">Good</Option>
                      <Option value="Fair">Fair</Option>
                      <Option value="Poor">Poor</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row> */}

              {/* <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name={["condition", "Good"]}
                    label="Good"
                    rules={[{ required: true, message: "Enter Good qty" }]}
                  >
                    <Input type="number" min={0} />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name={["condition", "Defect"]}
                    label="Defect"
                    rules={[{ required: true, message: "Enter Defect qty" }]}
                  >
                    <Input type="number" min={0} />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name={["condition", "Damage"]}
                    label="Damage"
                    rules={[{ required: true, message: "Enter Damage qty" }]}
                  >
                    <Input type="number" min={0} />
                  </Form.Item>
                </Col>
              </Row> */}

              {selectedCategory !== "Chemical" && selectedCategory !== "Reagent" && (
                <Row gutter={16}>
                  <Col span={8}>
                    {/* <Form.Item
                      name={["condition", "Good"]}
                      label="Good"
                      rules={[{ required: true, message: "Enter Good qty" }]}
                    >
                      <Input type="number" min={0} />
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item
                      name={["condition", "Defect"]}
                      label="Defect"
                      rules={[{ required: true, message: "Enter Defect qty" }]}
                    >
                      <Input type="number" min={0} />
                    </Form.Item> */}
                  {/* </Col> */}

                  {/* <Col span={8}>
                    <Form.Item
                      name={["condition", "Damage"]}
                      label="Damage"
                      rules={[{ required: true, message: "Enter Damage qty" }]}
                    >
                      <Input type="number" min={0} /> */}
                    {/* </Form.Item> */}

                    {/* <Col span={8}>
                      <Form.Item
                        name={["condition", "Lost"]}
                        label="Lost"
                        rules={[{ required: true, message: "Enter Lost qty" }]}
                      >
                        <Input type="number" min={0} />
                      </Form.Item>
                    </Col> */}
                  </Col>
                </Row>
              )}
            </Form>
          </Modal>

          <Modal
            title="Request Item Restock"
            open={isRestockRequestModalVisible} 
            onCancel={() => setIsRestockRequestModalVisible(false)} 
            footer={null} // Hide default footer
            zIndex={1030}
          >
            <Form
              form={restockForm}
              onFinish={handleRestockSubmit} // Handle form submission
              layout="vertical"
            >
              {/* Input for quantity needed */}
              <Form.Item
                name="quantityNeeded"
                label="Quantity Needed"
                rules={[
                  { required: true, message: "Please enter the quantity to be restocked" },
                  { type: "number", min: 1, message: "Quantity must be greater than 0" },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={1}
                  placeholder="Enter quantity to restock"
                />
              </Form.Item>

              {/* Input for restock reason */}
              <Form.Item
                name="reason"
                label="Reason for Restock"
                rules={[{ required: true, message: "Please provide a reason for the request" }]}
              >
                <Input.TextArea rows={4} placeholder="Enter reason for restocking" />
              </Form.Item>

              {/* Submit button inside the modal */}
              <Form.Item style={{ textAlign: "right" }}>
                <Button type="primary" htmlType="submit">
                  Submit Restock Request
                </Button>
              </Form.Item>
            </Form>
          </Modal>

          <DeleteModal
            visible={deleteModalVisible}
            onClose={() => {
              setDeleteModalVisible(false);
              setItemToDelete(null);
            }}
            item={itemToDelete}
            setDataSource={setDataSource} // Make sure this is passed correctly
            onDeleteSuccess={(deletedItemId) => {
              setDataSource((prev) =>
                prev.filter((item) => item.itemId !== deletedItemId)
              );
            }}
          />

          <NotificationModal
            isVisible={isNotificationVisible}
            onClose={() => setIsNotificationVisible(false)}
            message={notificationMessage}
          />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Inventory;

