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
} from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'; 
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
import { FileTextOutlined  } from '@ant-design/icons';

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
  const db = getFirestore();

  const [isFullEditModalVisible, setIsFullEditModalVisible] = useState(false);
  const [fullEditForm] = Form.useForm();


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
        }
      },
      (error) => {
        console.error("Error fetching inventory with onSnapshot: ", error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const departmentsCollection = collection(db, "departments");
    const unsubscribe = onSnapshot(
      departmentsCollection,
      (querySnapshot) => {
        const deptList = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setDepartmentsAll(deptList);
      },
      (error) => {
        console.error("Error fetching departments in real-time: ", error);
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
    status: record.status,
    type: record.type,
    unit: record.unit,
     condition: ["Glasswares", "Equipment", "Materials"].includes(record.category)
      ? {
          Good: record.condition?.Good ?? 0,
          Defect: record.condition?.Defect ?? 0,
          Damage: record.condition?.Damage ?? 0,
        }
      : undefined,
  });

  setIsFullEditModalVisible(true);
};

const handleFullUpdate = async (values) => {
  try {
    if (!editingItem || !editingItem.docId) {
      console.error("No item selected or docId missing.");
      return;
    }

    // Sanitize itemName and itemDetails (trim whitespace, ensure non-empty strings)
    const sanitizedItemName = values.itemName.trim();
    const sanitizedItemDetails = values.itemDetails.trim();

    if (!sanitizedItemName || !sanitizedItemDetails) {
      console.warn("❌ Item Name and Item Details are required.");
      return;
    }

    // Sanitize criticalLevel (ensure it's a number and >= 1)
    const sanitizedCriticalLevel = Math.max(Number(values.criticalLevel), 1);

    // Sanitize category to ensure it's valid
    const validCategories = ["Glasswares", "Equipment", "Materials", "Chemical", "Reagent"];
    if (!validCategories.includes(values.category)) {
      console.warn(`❌ Invalid category: ${values.category}`);
      return;
    }

    const sanitizedLabRoom = values.labRoom ? values.labRoom.toString().padStart(4, '0') : null;

    // Handle condition (Good, Defect, Damage)
    const sanitizedCondition = {
      Good: Number(values.condition?.Good) || 0,
      Defect: Number(values.condition?.Defect) || 0,
      Damage: Number(values.condition?.Damage) || 0,
    };

    // If the category requires condition, set quantity based on Good stock
    let sanitizedQuantity = sanitizedCondition.Good;
    if (["Glasswares", "Equipment", "Materials"].includes(values.category)) {
      sanitizedQuantity = sanitizedCondition.Good;
    }

    const updatedData = {
      itemName: sanitizedItemName,
      itemDetails: sanitizedItemDetails,
      category: values.category,
      department: values.department,
      criticalLevel: sanitizedCriticalLevel,
      labRoom: sanitizedLabRoom,
      status: values.status || "pending", // Default status if not provided
      unit: values.unit || null,
      condition: sanitizedCondition,
      quantity: sanitizedQuantity,
    };

    // Update main inventory doc
    const itemRef = doc(db, "inventory", editingItem.docId);
    await updateDoc(itemRef, updatedData);

    // Update labRoom subcollection item if labRoom is valid
    if (sanitizedLabRoom) {
      const labRoomQuery = query(collection(db, "labRoom"), where("roomNumber", "==", sanitizedLabRoom));
      const labRoomSnapshot = await getDocs(labRoomQuery);

      if (!labRoomSnapshot.empty) {
        const labRoomDoc = labRoomSnapshot.docs[0];
        const labRoomRef = labRoomDoc.ref;
        const labRoomItemRef = doc(collection(labRoomRef, "items"), editingItem.itemId);
        const labRoomItemSnap = await getDoc(labRoomItemRef);

        if (labRoomItemSnap.exists()) {
          await updateDoc(labRoomItemRef, updatedData);
        } else {
          console.warn(`⚠️ Item ${editingItem.itemId} not found in labRoom ${sanitizedLabRoom}/items`);
        }
      } else {
        console.warn(`⚠️ No labRoom found with roomNumber "${sanitizedLabRoom}"`);
      }
    }

    setDataSource((prevData) =>
      prevData.map((item) =>
        item.docId === editingItem.docId ? { ...item, ...updatedData } : item
      )
    );

    setNotificationMessage("Item updated successfully!");
    setIsNotificationVisible(true);
    setIsFullEditModalVisible(false);
    setIsRowModalVisible(false);
    setEditingItem(null);
    fullEditForm.resetFields();
  } catch (error) {
    console.error("Error updating item:", error);
    setNotificationMessage("Failed to update item. Please try again.");
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

const filteredData = dataSource.filter((item) => {
  // Sanitize the search input to prevent any issues (e.g., XSS, SQL injection)
  const sanitizedSearchText = sanitizeSearchInput(searchText);
  
  // Search logic
  const matchesSearch = sanitizedSearchText
    ? Object.values(item).some((val) =>
        String(val).toLowerCase().includes(sanitizedSearchText.toLowerCase())
      )
    : true;

  // Filter items based on selected category, item type, and expiration status
  return (
    (!filterCategory || item.category === filterCategory) &&
    (!filterItemType || item.type === filterItemType) &&
    matchesSearch &&
    !isExpired(item.expiryDate) // Exclude expired items
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

  const handleAdd = async (values) => {
    if (!itemName || !values.department || !itemDetails) {
      alert("Please fill up the form!");
      return;
    }

    const trimmedName = itemName.trim();
    const normalizedInputName = trimmedName.toLowerCase();
    const normalizedInputDetails = itemDetails.trim().toLowerCase();

    // Find items with the same name (case-insensitive)
    const sameNameItems = dataSource.filter(
      (item) => item.item.toLowerCase().startsWith(normalizedInputName)
    );

    // Check if same name AND same details already exists
    const exactMatch = sameNameItems.find((item) => {
      const itemDetailsSafe = item.itemDetails ? item.itemDetails.trim().toLowerCase() : "";
      const itemNameSafe = item.item ? item.item.toLowerCase() : "";
      return (
        itemDetailsSafe === normalizedInputDetails &&
        itemNameSafe === normalizedInputName
      );
    });

    if (exactMatch) {
      setNotificationMessage("An item with the same name and details already exists in the inventory.");
      setIsNotificationVisible(true);
      return;
    }
    const itemCategoryPrefixMap = {
      Chemical: "CHEM",
      Equipment: "EQP",
      Reagent: "RGT",
      Glasswares: "GLS",
      Materials: "MAT",
    };
    

    // Generate suffix for similar items with same base name but different details
    let similarItemCount = sameNameItems.length + 1;
    const baseName = trimmedName.replace(/\d+$/, ''); // Remove trailing digits if any
    const formattedItemName = `${baseName}${String(similarItemCount).padStart(2, "0")}`;

    const finalItemName = sameNameItems.length > 0 ? formattedItemName : trimmedName;

    const itemCategoryPrefix = itemCategoryPrefixMap[values.category]|| "UNK01";
    const inventoryRef = collection(db, "inventory");
    const itemIdQuerySnapshot = await getDocs(query(inventoryRef, where("category", "==", values.category)));
    const criticalLevel = values.criticalLevel !== undefined ? Number(values.criticalLevel) : 20; // default to 5 if not provided

    let ItemCategoryCount = itemIdQuerySnapshot.size + 1;
    let generatedItemId = `${itemCategoryPrefix}${ItemCategoryCount.toString().padStart(2, "0")}`;
    let idQuerySnapshot = await getDocs(query(inventoryRef, where("itemId", "==", generatedItemId)));

    // 🔁 Keep trying until we find a unique ID
    while (!idQuerySnapshot.empty) {
      ItemCategoryCount++;
      generatedItemId = `${itemCategoryPrefix}${ItemCategoryCount.toString().padStart(2, "0")}`;
      idQuerySnapshot = await getDocs(query(inventoryRef, where("itemId", "==", generatedItemId)));
    }

    setItemId(generatedItemId); 

  
    const entryDate = values.entryDate ? values.entryDate.format("YYYY-MM-DD") : null;
    const expiryDate = values.type === "Fixed" 
      ? null 
      : values.expiryDate 
      ? values.expiryDate.format("YYYY-MM-DD")
      : null;

    const entryCurrentDate = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
    const timestamp = new Date();

    const quantityNumber = Number(values.quantity);

    const inventoryItem = {
      itemId: generatedItemId,
      // itemName,
      itemName: finalItemName,
      itemDetails,
      entryCurrentDate,
      expiryDate,
      timestamp,
      criticalLevel,
      category: values.category,
      labRoom: values.labRoom,
      quantity: Number(values.quantity),
      department: values.department,
      type: values.type,
      status: "Available",
      ...(values.category === "Chemical" || values.category === "Reagent" ? { unit: values.unit } : {}),
      rawTimestamp: new Date(),

      ...(values.category !== "Chemical" && values.category !== "Reagent" && {
        condition: {
          Good: quantityNumber,
          Defect: 0,
          Damage: 0,
        },
      }),
    };

    const encryptedData = CryptoJS.AES.encrypt(
      JSON.stringify(inventoryItem),
      SECRET_KEY
    ).toString();
    
    const newItem = {
      id: count + 1,
      itemId: generatedItemId,
      // item: itemName,
      item: finalItemName,
      itemDetails: itemDetails,
      entryDate: entryCurrentDate, 
      expiryDate: expiryDate, 
      qrCode: encryptedData,
      ...inventoryItem,
    };

     try {

      const inventoryDocRef = await addDoc(collection(db, "inventory"), {
        ...inventoryItem,
        qrCode: encryptedData,
      });

      const userId = localStorage.getItem("userId");
      const userName = localStorage.getItem("userName") || "User";

      await addDoc(collection(db, `accounts/${userId}/activitylog`), {
        action: `Added new item (${finalItemName}) to inventory`,
        userName: userName || "User",
        timestamp: serverTimestamp(),
      });

      await addDoc(collection(inventoryDocRef, "stockLog"), {
        date: new Date().toISOString().split("T")[0], // "YYYY-MM-DD"
        noOfItems: quantityNumber,
        deliveryNumber: "DLV-00001",
        createdAt: serverTimestamp(),
        ...(expiryDate && { expiryDate }),
      });

      // 🔽 Check if labRoom with the given room number already exists
      const labRoomQuery = query(
        collection(db, "labRoom"),
        where("roomNumber", "==", values.labRoom)
      );
      const labRoomSnapshot = await getDocs(labRoomQuery);

      let labRoomRef;

      if (labRoomSnapshot.empty) {
        // 🔽 Create new labRoom document with generated ID
        labRoomRef = await addDoc(collection(db, "labRoom"), {
          roomNumber: values.labRoom,
          createdAt: new Date(),
        });

      } else {
        // 🔽 Use existing labRoom document
        labRoomRef = labRoomSnapshot.docs[0].ref;
      }

      // 🔽 Add item to the labRoom's subcollection
      await setDoc(doc(collection(labRoomRef, "items"), generatedItemId), {
        ...inventoryItem,
        qrCode: encryptedData,
        roomNumber: values.labRoom,
      });

      // 🔽 Fetch all items under this labRoom
      const labRoomItemsSnap = await getDocs(collection(labRoomRef, "items"));

      // 🔽 Generate encrypted QR code with labRoom ID only
      const labRoomQRData = CryptoJS.AES.encrypt(
        JSON.stringify({
          labRoomId: labRoomRef.id,
        }),
        SECRET_KEY
      ).toString();

      // 🔽 Update labRoom document with the generated QR code
      await updateDoc(labRoomRef, {
        qrCode: labRoomQRData,
        updatedAt: new Date(),
      });

      setDataSource([...dataSource, newItem]);
      setLogRefreshKey(prev => prev + 1);
      setCount(count + 1);
      form.resetFields();
      setItemName("");
      setItemDetails("")
      setItemId("");
      setIsModalVisible(false);

    } catch (error) {
      console.error("Error adding document to Firestore:", error);
    }
  };

  const editItem = (record, clearFields = true) => {
  editForm.resetFields();
  setEditingItem(record);
  setSelectedCategory(record.category);

  const hasExpiry = record.category === "Chemical" || record.category === "Reagent";
  setHasExpiryDate(hasExpiry); // This controls if the Expiry field is shown

  editForm.setFieldsValue({
    quantity: clearFields ? null : record.quantity,
    expiryDate: hasExpiry
      ? (clearFields ? null : (record.expiryDate ? dayjs(record.expiryDate) : null))
      : null,
    condition: {
      Good: record.condition?.Good ?? 0,
      Defect: record.condition?.Defect ?? 0,
      Damage: record.condition?.Damage ?? 0,
    },
  });

  setIsEditModalVisible(true);
};

const updateItem = async (values) => {
  console.log("✅ Raw incoming values:", values);

  const isChemicalOrReagent =
    editingItem.category === "Chemical" || editingItem.category === "Reagent";

  // Sanitize quantity
  const addedQuantity = Number(values.quantity);
  if (isNaN(addedQuantity) || addedQuantity < 0) {
    console.warn("❌ Invalid quantity value.");
    return;
  }

  // Ensure expiryDate is valid
  let sanitizedExpiryDate = null;
  if (isChemicalOrReagent && values.expiryDate) {
    sanitizedExpiryDate = values.expiryDate.isValid() ? values.expiryDate.format("YYYY-MM-DD") : null;
  }

  try {
    const snapshot = await getDocs(collection(db, "inventory"));

    snapshot.forEach(async (docItem) => {
      const data = docItem.data();

      if (data.itemId === editingItem.itemId) {
        const inventoryId = docItem.id;
        const itemRef = doc(db, "inventory", inventoryId);
        const existingLabRoom = data.labRoom;

        if (!existingLabRoom) {
          console.warn("❌ Item has no labRoom, cannot update labRoom/items subcollection.");
          return;
        }

        // Sanitize and compute new condition
        const prevCondition = data.condition || { Good: 0, Defect: 0, Damage: 0 };
        const newCondition = {
          Good: prevCondition.Good + addedQuantity,
          Defect: prevCondition.Defect,
          Damage: prevCondition.Damage,
        };

        // Ensure quantity is valid and sanitize it
        const prevQuantity = Number(data.quantity) || 0;
        const newQuantity = prevQuantity + addedQuantity;

        if (newQuantity < 0) {
          console.warn("❌ Quantity cannot be negative.");
          return;
        }

        const updatedData = {
          labRoom: existingLabRoom,
          quantity: newQuantity,
          condition: newCondition,
        };

        if (sanitizedExpiryDate) {
          updatedData.expiryDate = sanitizedExpiryDate;
        }

        // 🔄 Update inventory document
        await updateDoc(itemRef, updatedData);

        setIsNotificationVisible(true);
        setNotificationMessage("Item updated successfully!");

        const updatedItem = {
          ...editingItem,
          ...updatedData,
        };

        setDataSource((prevData) =>
          prevData.map((item) => (item.id === editingItem.id ? updatedItem : item))
        );

        // 🔄 Update labRoom subcollection
        const roomNumber = existingLabRoom.toString().padStart(4, "0");
        const labRoomQuery = query(collection(db, "labRoom"), where("roomNumber", "==", roomNumber));
        const labRoomSnapshot = await getDocs(labRoomQuery);

        if (!labRoomSnapshot.empty) {
          const labRoomDoc = labRoomSnapshot.docs[0];
          const labRoomRef = labRoomDoc.ref;

          const labRoomItemRef = doc(collection(labRoomRef, "items"), data.itemId);
          const labRoomItemSnap = await getDoc(labRoomItemRef);

          if (labRoomItemSnap.exists()) {
            await updateDoc(labRoomItemRef, updatedData);

            // 🧾 Stock log logic
            const stockLogRef = collection(db, "inventory", inventoryId, "stockLog");
            const latestLogQuery = query(stockLogRef, orderBy("createdAt", "desc"), limit(1));
            const latestSnapshot = await getDocs(latestLogQuery);

            let newDeliveryNumber = "DLV-00001";
            if (!latestSnapshot.empty) {
              const lastDeliveryNumber = latestSnapshot.docs[0].data().deliveryNumber;
              const match = lastDeliveryNumber?.match(/DLV-(\d+)/);
              if (match) {
                const nextNum = (parseInt(match[1], 10) + 1).toString().padStart(5, "0");
                newDeliveryNumber = `DLV-${nextNum}`;
              }
            }

            const logPayload = {
              date: new Date().toISOString().split("T")[0],
              deliveryNumber: newDeliveryNumber,
              createdAt: serverTimestamp(),
              noOfItems: addedQuantity,
              ...(sanitizedExpiryDate && {
                expiryDate: sanitizedExpiryDate,
              }),
            };

            await addDoc(stockLogRef, logPayload);
          } else {
            console.warn(`⚠️ Item ${data.itemId} not found in labRoom`);
          }
        } else {
          console.warn(`⚠️ No labRoom found with roomNumber "${roomNumber}"`);
        }

        setIsEditModalVisible(false);
        setIsRowModalVisible(false);
        setEditingItem(null);
        form.resetFields();
      }
    });
  } catch (error) {
    console.error("Error updating document in Firestore:", error);
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
      return `Good: ${condition.Good ?? 0}, Defect: ${condition.Defect ?? 0}, Damage: ${condition.Damage ?? 0}`;
    }

    return condition || 'N/A';
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>

      <Layout>
        <Content className="content inventory-container">
    
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" onClick={showModal}>
              Add Item
            </Button>
          </div>

          <div className="inventory-header">
            <Space wrap>
              <Input.Search
                placeholder="Search"
                className="search-bar"
                style={{ width: 200 }}
                allowClear
                onChange={(e) => setSearchText(e.target.value)}
              />

              <Select
                allowClear
                placeholder="Filter by Category"
                style={{ width: 160 }}
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
                style={{ width: 160 }}
                onChange={(value) => setFilterItemType(value)}
              >
                <Option value="Fixed">Fixed</Option>
                <Option value="Consumable">Consumable</Option>
              </Select>

              <Button
                onClick={() => {
                  setFilterCategory(null);
                  setFilterItemType(null);
                  // setFilterUsageType(null);
                  setSearchText('');
                }}
              >
                Reset Filters
              </Button>

              <Button type="primary" onClick={exportToExcel}>
                Export to Excel
              </Button>

              <Button type="primary" onClick={saveAsPdf}>
                Save as PDF
              </Button>

              <Button type="primary" onClick={printPdf}>
                Print PDF
              </Button>

            </Space>
          </div> 

          <Table
            dataSource={filteredData}
            columns={columns}
            rowKey={(record) => record.itemId}
            bordered
            className="inventory-table"
    
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
            title="Add Item to Inventory"
            open={isModalVisible}
            onCancel={handleCancel}
            footer={null}
            width={1000}
            zIndex={1024}
          >
            <Form layout="vertical" form={form} onFinish={handleAdd}>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="Item Name"
                    label="Item Name"
                    rules={[{ required: true, message: "Please enter Item Name!" }]}
                  >
                    <Input
                      placeholder="Enter Item Name"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                    />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name="Item Description"
                    label="Item Description"
                    rules={[{ required: true, message: "Please enter Item Description!" }]}
                  >
                    <Input
                      placeholder="Enter Item Description"
                      value={itemDetails}
                      onChange={(e) => setItemDetails(e.target.value)}
                    />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name="category"
                    label="Category"
                    rules={[{ required: true, message: "Please select a category!" }]}
                  >
                    <Select placeholder="Select Category" onChange={handleCategoryChange}>
                      <Option value="Chemical">Chemical</Option>
                      <Option value="Reagent">Reagent</Option>
                      <Option value="Materials">Materials</Option>
                      <Option value="Equipment">Equipment</Option>
                      <Option value="Glasswares">Glasswares</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>                
                <Col span={8}>
                  <Form.Item
                    name="quantity"
                    label="Quantity"
                    rules={[{ required: true, message: "Please enter Quantity!" }]}
                  >
                    <InputNumber min={1} placeholder="Enter quantity" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                {["Chemical", "Reagent"].includes(selectedCategory) && (
                  <Col span={8}>
                    <Form.Item
                      name="unit"
                      label="Unit"
                      rules={[{ required: true, message: "Please select a unit!" }]}
                    >
                      <Select placeholder="Select unit">
                        <Select.Option value="ml">ml</Select.Option>
                        <Select.Option value="g">g</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                )}
                
                <Col span={8}>
                  <Form.Item
                    name="criticalLevel"
                    label="Critical Level"
                    rules={[{ required: true, message: "Please enter desired Critical Stock!" }]}
                  >
                    <InputNumber min={1} placeholder="Enter Critical Stock" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item name="entryDate" label="Date of Entry" disabled>
                    <DatePicker
                      format="YYYY-MM-DD"
                      style={{ width: "100%" }}
                      defaultValue={dayjs()}
                      disabled
                    />
                  </Form.Item>
                </Col>

                {/* <Col span={8}>
                  <Form.Item name="expiryDate" label="Date of Expiry">
                    <DatePicker
                      format="YYYY-MM-DD"
                      style={{ width: "100%" }}
                      disabledDate={disabledExpiryDate}
                      disabled={disableExpiryDate}
                    />
                  </Form.Item>
                </Col> */}

                {["Chemical", "Reagent"].includes(selectedCategory) && (
                  <>
                    <Col span={8}>
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
                      <Col span={8}>
                        <Form.Item
                          name="expiryDate"
                          label="Date of Expiry"
                          rules={[{ required: true, message: "Please select expiry date!" }]}
                        >
                          <DatePicker
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
                <Col span={8}>
                  <Form.Item
                    name="type"
                    label="Item Type"
                    rules={[{ required: true, message: "Please select Item Type!" }]}
                  >
                    <Select
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

                <Col span={8}>
                  <Form.Item
                    name="labRoom"
                    label="Stock Room"
                    rules={[{ required: true, message: "Please enter Stock Room!" }]}
                  >
                    <Input placeholder="Enter Lab/Stock Room" />
                  </Form.Item>
                </Col>

                {/* <Col span={8}>
                  <Form.Item name="department" label="Department">
                    <Input placeholder="Enter department" />
                  </Form.Item>
                </Col> */}
                
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

              <Form.Item>
                <Button type="primary" htmlType="submit" className="add-btn">
                  Add to Inventory
                </Button>
              </Form.Item>
            </Form>
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

                  const newGood = originalGood - defect - damage;

                  if (newGood < 0) {
                    fullEditForm.setFields([
                      {
                        name: ['condition', 'Defect'],
                        errors: ['Sum of Defect and Damage cannot exceed original Good quantity'],
                      },
                      {
                        name: ['condition', 'Damage'],
                        errors: ['Sum of Defect and Damage cannot exceed original Good quantity'],
                      },
                    ]);
                  } else {
                    fullEditForm.setFields([
                      { name: ['condition', 'Defect'], errors: [] },
                      { name: ['condition', 'Damage'], errors: [] },
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
                  <Input />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item label="Item Description" name="itemDetails">
                  <Input />
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
                <Form.Item label="Critical Level" name="criticalLevel">
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item label="Lab/ Stock Room" name="labRoom">
                  <Input />
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
                  <table class="horizontal-table">
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
                        {/* <tr>
                          <th>Date of Entry (latest)</th>
                          <td>{selectedRow.entryCurrentDate || 'N/A'}</td>
                        </tr> */}
                      </tbody>
                    </table>
                    </div>

                    <div className="table-wrapper">
                    <table class="horizontal-table">
                      <tbody>
                        <tr>
                          <th>Status</th>
                          <td>{selectedRow.status}</td>
                        </tr>

                        <tr>
                          <th>Department</th>
                          <td>{selectedRow.department}</td>
                        </tr>

                        <tr>
                          <th>Category</th>
                          <td>{selectedRow.category}</td>
                        </tr>

                        <tr>
                          <th>Critical Level</th>
                          <td>{selectedRow.criticalLevel || 'N/A'}</td>
                        </tr>
                        <tr>

                          <th>Condition</th>
                          <td>{formatCondition(selectedRow.condition, selectedRow.category)}</td>
                        </tr>
                        
                        <tr>
                          <th>Lab/ Stock Room</th>
                          <td>{selectedRow.labRoom}</td>
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

                    </div>
                  </div>
                  </div>
                  </div>

                  <div>
                    <h2>Stock Log</h2>

                    {/* <table class="delivery-table">
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
                    dependencies={[['condition']]} // watch for changes in condition
                   rules={[
                      { required: true, message: "Please enter quantity" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const condition = getFieldValue('condition') || {};
                          const totalCondition =
                            (parseInt(condition.Good) || 0) +
                            (parseInt(condition.Defect) || 0) +
                            (parseInt(condition.Damage) || 0);

                          if (value == null || value === "") {
                            return Promise.resolve(); // wait for value
                          }

                          // Fix: ensure numbers are properly cast
                          if (parseInt(value) === totalCondition) {
                            return Promise.resolve();
                          }

                        },
                      }),
                    ]}
                  >
                    <Input type="number" min={0} placeholder="Enter quantity" />
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
                  </Col>
                </Row>
              )}
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

