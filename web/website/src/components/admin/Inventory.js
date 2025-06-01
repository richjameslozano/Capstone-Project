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
} from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'; 
import moment from "moment";
import Sidebar from "../Sidebar";
import AppHeader from "../Header";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { getFirestore, collection, addDoc, Timestamp, getDocs, updateDoc, doc, onSnapshot, setDoc, getDoc, query, where, serverTimestamp, orderBy, limit } from "firebase/firestore";
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
  const db = getFirestore();

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
  //       console.error("Error processing inventory snapshot: ", error);
  //     }

  //   }, (error) => {
  //     console.error("Error fetching inventory with onSnapshot: ", error);
  //   });

  //   return () => unsubscribe(); // Clean up the listener on unmount
  // }, []);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch('https://nuls-8c12b.web.app/api/getInventory');
        const data = await response.json();

        if (data.success && data.items) {
          setDataSource(data.items);
          setCount(data.count);
        } else {
          console.warn('No inventory data:', data.message || 'Unknown reason');
          setDataSource([]);
          setCount(0);
        }
      } catch (error) {
        console.error('Error fetching inventory from backend:', error);
      }
    };

    fetchInventory();
  }, []);


  useEffect(() => {
    if (isEditModalVisible) {
      const currentCategory = editForm.getFieldValue("category");
      if (currentCategory) {
        setSelectedCategory(currentCategory);
      }
    }
  }, [isEditModalVisible]);

  const filteredData = dataSource.filter((item) => {
    const matchesSearch = searchText
      ? Object.values(item).some((val) =>
          String(val).toLowerCase().includes(searchText.toLowerCase())
        )
      : true;
  
    return (
      (!filterCategory || item.category === filterCategory) &&
      (!filterItemType || item.type === filterItemType) &&
      // (!filterUsageType || item.usageType === filterUsageType) &&
      matchesSearch
    );
  });  

//  const handleCategoryChange = (value) => {
//     let type = "";

//     if (["Chemical", "Reagent"].includes(value)) {
//       type = "Consumable";
      
//     } else if (["Equipment", "Glasswares", "Materials"].includes(value)) {
//       type = "Fixed";
//     }

//     setItemType(type);
//     setSelectedCategory(value);
//     form.setFieldsValue({ type });
//   };

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
    setDisableExpiryDate(disableExpiry); // new state
    form.setFieldsValue({ type });
  };

  const showModal = () => setIsModalVisible(true);
  const handleCancel = () => setIsModalVisible(false);

  // const exportToExcel = () => {
  //   const worksheet = XLSX.utils.json_to_sheet(filteredData);
  //   const workbook = XLSX.utils.book_new();

  //   XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Inventory");

  //   const excelBuffer = XLSX.write(workbook, {
  //     bookType: "xlsx",
  //     type: "array",
  //   });

  //   const data = new Blob([excelBuffer], { type: "application/octet-stream" });
  //   saveAs(data, "Filtered_Inventory.xlsx");
  // };

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
      : ""
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
    if (!itemName || !values.department || itemDetails) {
      alert("Please fill up the form!");
      return;
    }

    // const isDuplicate = dataSource.some(
    //   (item) => item.item.toLowerCase() === itemName.trim().toLowerCase()
    // );

    // if (isDuplicate) {
    //   setNotificationMessage("An item with the same description already exists in the inventory.");
    //   setIsNotificationVisible(true);
    //   return;
    // }

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

    // Generate suffix for similar items with same base name but different details
    let similarItemCount = sameNameItems.length + 1;
    const baseName = trimmedName.replace(/\d+$/, ''); // Remove trailing digits if any
    const formattedItemName = `${baseName}${String(similarItemCount).padStart(2, "0")}`;

    const finalItemName = sameNameItems.length > 0 ? formattedItemName : trimmedName;

    const departmentPrefix = values.department.replace(/\s+/g, "").toUpperCase();
    const inventoryRef = collection(db, "inventory");
    const deptQuerySnapshot = await getDocs(query(inventoryRef, where("department", "==", values.department)));
    const criticalLevel = values.criticalLevel !== undefined ? Number(values.criticalLevel) : 20; // default to 5 if not provided
    // const departmentCount = deptQuerySnapshot.size + 1;
    // const generatedItemId = `${departmentPrefix}${departmentCount.toString().padStart(2, "0")}`;

    // const idQuerySnapshot = await getDocs(query(inventoryRef, where("itemId", "==", generatedItemId)));
    // if (!idQuerySnapshot.empty) {
    //   setNotificationMessage("Item ID already exists. Please try again.");
    //   setIsNotificationVisible(true);
    //   return;
    // }

    let departmentCount = deptQuerySnapshot.size + 1;
    let generatedItemId = `${departmentPrefix}${departmentCount.toString().padStart(2, "0")}`;
    let idQuerySnapshot = await getDocs(query(inventoryRef, where("itemId", "==", generatedItemId)));

    // 🔁 Keep trying until we find a unique ID
    while (!idQuerySnapshot.empty) {
      departmentCount++;
      generatedItemId = `${departmentPrefix}${departmentCount.toString().padStart(2, "0")}`;
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

    // const inventoryItem = {
    //   itemId: generatedItemId,
    //   itemName,
    //   entryCurrentDate,
    //   expiryDate,
    //   timestamp,
    //   category: values.category,
    //   labRoom: values.labRoom,
    //   quantity: Number(values.quantity),
    //   department: values.department,
    //   type: values.type,
    //   status: "Available",
    //   condition: {
    //     Good: quantityNumber,
    //     Defect: 0,
    //     Damage: 0,
    //   },
    //   unit: values.unit || null,
    //   // usageType: values.usageType,
    //   volume: values.category === "Glasswares" ? values.volume : null,
    //   rawTimestamp: new Date(),
    //   ...(values.category !== "Chemical" && values.category !== "Reagent" && {
    //     condition: {
    //       Good: quantityNumber,
    //       Defect: 0,
    //       Damage: 0,
    //     },
    //   }),
    // };

    const inventoryItem = {
      itemId: generatedItemId,
      // itemName,
      itemName: finalItemName,
      itemDetails,
      entryCurrentDate,
      expiryDate,
      timestamp,
      category: values.category,
      labRoom: values.labRoom,
      department: values.department,
      type: values.type,
      status: "Available",
      // condition: {
      //   Good: quantityNumber,
      //   Defect: 0,
      //   Damage: 0,
      // },
      // unit: values.unit || null,
      // volume: values.category === "Glasswares" ? values.volume : null,
      rawTimestamp: new Date(),
      criticalLevel:criticalLevel,
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
      // ...(values.type !== "Consumable" && { qrCode: encryptedData }),
    };

    // try {
    //   await addDoc(collection(db, "inventory"), {
    //     ...inventoryItem,
    //     qrCode: encryptedData,
    //   });

    //   // 🔽 NEW: Ensure labRoom document exists
    //   const labRoomRef = doc(db, "labRoom", values.labRoom);
    //   const labRoomSnap = await getDoc(labRoomRef);

    //   // 🔽 Create labRoom doc if it doesn't exist
    //   if (!labRoomSnap.exists()) {
    //     await setDoc(labRoomRef, {
    //       createdAt: new Date(),
    //     });
    //   }

    //   // 🔽 Add full item details to subcollection under labRoom
    //   await setDoc(doc(collection(labRoomRef, "items"), generatedItemId), {
    //     ...inventoryItem,
    //     qrCode: encryptedData,
    //   });

    //    // 🔽 Generate Lab Room QR Code containing all items
    //   const labRoomItemsSnap = await getDocs(collection(labRoomRef, "items"));
    //   const allLabRoomItems = [];
    //   labRoomItemsSnap.forEach((docItem) => {
    //     const itemData = docItem.data();
    //     const quantityNumbers = Number(itemData.quantity); 
    //     allLabRoomItems.push({
    //       itemId: itemData.itemId,
    //       itemName: itemData.itemName,
    //       quantity: itemData.quantity,
    //       condition: {
    //         Good: quantityNumbers,
    //         Defect: 0,
    //         Damage: 0,
    //       },
    //       status: itemData.status,
    //     });
    //   });

    //   const labRoomQRData = CryptoJS.AES.encrypt(
    //     JSON.stringify({
    //       labRoom: values.labRoom,
    //       items: allLabRoomItems,
    //     }),
    //     SECRET_KEY
    //   ).toString();

    //   // 🔽 Store labRoom QR code on the labRoom document
    //   await updateDoc(labRoomRef, {
    //     qrCode: labRoomQRData,
    //     updatedAt: new Date(),
    //   });

    //   setDataSource([...dataSource, newItem]);
    //   setCount(count + 1);
    //   form.resetFields();
    //   setItemName("");
    //   setItemId("");
    //   setIsModalVisible(false);

    // } catch (error) {
    //   console.error("Error adding document to Firestore:", error);
    // }

     try {
      // 🔽 Add to inventory collection
      await addDoc(collection(db, "inventory"), {
        ...inventoryItem,
        qrCode: encryptedData,
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
      // const labRoomItemsSnap = await getDocs(collection(labRoomRef, "items"));
      // const allLabRoomItems = [];
      // labRoomItemsSnap.forEach((docItem) => {
      //   const itemData = docItem.data();
      //   const quantityNumbers = Number(itemData.quantity);
      //   allLabRoomItems.push({
      //     itemId: itemData.itemId,
      //     itemName: itemData.itemName,
      //     itemDetails: itemData.itemDetails,
      //     quantity: itemData.quantity,
      //     condition: {
      //       Good: quantityNumbers,
      //       Defect: 0,
      //       Damage: 0,
      //     },
      //     status: itemData.status,
      //   });
      // });

      // // 🔽 Generate encrypted QR code with labRoom data
      // const labRoomQRData = CryptoJS.AES.encrypt(
      //   JSON.stringify({
      //     labRoom: values.labRoom,
      //     items: allLabRoomItems,
      //   }),
      //   SECRET_KEY
      // ).toString();

      // // 🔽 Update labRoom document with the generated QR code
      // await updateDoc(labRoomRef, {
      //   qrCode: labRoomQRData,
      //   updatedAt: new Date(),
      // });

      const labRoomQRData = CryptoJS.AES.encrypt(
        JSON.stringify({
          labRoomId: labRoomRef.id,
        }),
        SECRET_KEY
      ).toString();

      // Update labRoom document with the generated QR code
      await updateDoc(labRoomRef, {
        qrCode: labRoomQRData,
        updatedAt: new Date(),
      });

      setDataSource([...dataSource, newItem]);
      setCount(count + 1);
      setLogRefreshKey(prev => prev + 1);
      form.resetFields();
      setItemName("");
      setItemDetails("")
      setItemId("");
      setIsModalVisible(false);

    } catch (error) {
      console.error("Error adding document to Firestore:", error);
    }
  };

  const editItem = (record) => {
    editForm.resetFields();
    setEditingItem(record);
    setSelectedCategory(record.category);

    editForm.setFieldsValue({
      // category: record.category,
      // labRoom: record.labRoom,
      quantity: record.quantity,
      // status: record.status,
      condition: {
        Good: record.condition?.Good ?? 0,
        Defect: record.condition?.Defect ?? 0,
        Damage: record.condition?.Damage ?? 0,
      },
      // condition: record.condition, 
      // usageType: record.usageType,
    });

    setIsEditModalVisible(true);
  };
  
  // const updateItem = async (values) => {
  //   const safeValues = {
  //     category: values.category ?? "",
  //     // labRoom: values.labRoom ?? "",
  //     labRoom: "", 
  //     quantity: values.quantity ?? 0,
  //     status: values.status ?? "Available",
  //     condition: values.condition ?? { Good: 0, Defect: 0, Damage: 0 },
  //     // condition: values.condition ?? "Good",
  //     // usageType: values.usageType ?? "",
  //   };

  //   // try {
  //   //   const snapshot = await getDocs(collection(db, "inventory"));

  //   //   snapshot.forEach(async (docItem) => {
  //   //     const data = docItem.data();

  //   //     if (data.itemId === editingItem.itemId) {
  //   //       const inventoryId = docItem.id;
  //   //       const itemRef = doc(db, "inventory", inventoryId);

  //   //       await updateDoc(itemRef, safeValues);

  //   //       setIsNotificationVisible(true);
  //   //       setNotificationMessage("Item updated successfully!");

  //   //       const updatedItem = {
  //   //         ...editingItem,
  //   //         ...safeValues,
  //   //       };

  //   //       setDataSource((prevData) =>
  //   //         prevData.map((item) =>
  //   //           item.id === editingItem.id ? updatedItem : item
  //   //         )
  //   //       );

  //   //       const labRoomId = safeValues.labRoom;
  //   //       const itemId = data.itemId;

  //   //       if (labRoomId && itemId) {
  //   //         const labRoomItemRef = doc(db, "labRoom", labRoomId, "items", itemId);
  //   //         const labRoomSnap = await getDoc(labRoomItemRef);

  //   //         if (labRoomSnap.exists()) {
  //   //           await updateDoc(labRoomItemRef, safeValues);
  //   //           console.log(`🏫 labRoom/${labRoomId}/items/${itemId} updated successfully`);

  //   //         } else {
  //   //           console.warn(`⚠️ labRoom item not found for itemId: ${itemId} in labRoom: ${labRoomId}`);
  //   //         }
  //   //       }

  //   //       setIsEditModalVisible(false);
  //   //       setIsRowModalVisible(false)
  //   //       setEditingItem(null);
  //   //       form.resetFields();
  //   //     }
  //   //   });
      
  //   // } catch (error) {
  //   //   console.error("Error updating document in Firestore:", error);
  //   // }

  //   try {
  //     const snapshot = await getDocs(collection(db, "inventory"));

  //     snapshot.forEach(async (docItem) => {
  //       const data = docItem.data();

  //       if (data.itemId === editingItem.itemId) {
  //         const inventoryId = docItem.id;
  //         const itemRef = doc(db, "inventory", inventoryId);

  //         // Use the labRoom from the existing Firestore document
  //         const existingLabRoom = data.labRoom;
  //         if (!existingLabRoom) {
  //           console.warn("❌ Existing item has no labRoom, cannot update labRoom items subcollection.");
  //           return;
  //         }

  //         // Add labRoom to safeValues here from existing data
  //         safeValues.labRoom = existingLabRoom;

  //         // Update inventory doc with safeValues (including labRoom from Firestore)
  //         await updateDoc(itemRef, safeValues);

  //         setIsNotificationVisible(true);
  //         setNotificationMessage("Item updated successfully!");

  //         const updatedItem = {
  //           ...editingItem,
  //           ...safeValues,
  //         };

  //         setDataSource((prevData) =>
  //           prevData.map((item) =>
  //             item.id === editingItem.id ? updatedItem : item
  //           )
  //         );

  //         // Now get the roomNumber string for query (padStart if needed)
  //         const roomNumber = existingLabRoom.toString().padStart(4, '0');

  //         const itemId = data.itemId;

  //         console.log("🧪 Matching roomNumber:", roomNumber);
  //         console.log("🆔 Matching itemId:", itemId);

  //         // Query labRoom collection for the matching roomNumber
  //         const labRoomQuery = query(collection(db, "labRoom"), where("roomNumber", "==", roomNumber));
  //         const labRoomSnapshot = await getDocs(labRoomQuery);

  //         if (!labRoomSnapshot.empty) {
  //           const labRoomDoc = labRoomSnapshot.docs[0];
  //           const labRoomRef = labRoomDoc.ref;

  //           // Reference to the item inside labRoom/items/itemId
  //           const labRoomItemRef = doc(collection(labRoomRef, "items"), itemId);
  //           const labRoomItemSnap = await getDoc(labRoomItemRef);

  //           if (labRoomItemSnap.exists()) {
  //             await updateDoc(labRoomItemRef, safeValues);
  //             console.log(`✅ Updated labRoom/${labRoomRef.id}/items/${itemId}`);

  //           } else {
  //             console.warn(`⚠️ Item ${itemId} not found in labRoom`);
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

  // const updateItem = async (values) => {
  //   console.log("✅ Raw incoming values:", values);

  //   let totalQty = 0;

  //   if (Array.isArray(values.quantity)) {
  //     totalQty = values.quantity
  //       .filter(entry => entry && typeof entry.qty !== 'undefined') // ✅ safe filtering
  //       .reduce((sum, entry) => {
  //         const qty = parseInt(entry.qty);
  //         return sum + (isNaN(qty) ? 0 : qty);
  //       }, 0);

  //     values.condition = {
  //       Good: totalQty,
  //       Defect: 0,
  //       Damage: 0,
  //     };
      
  //   } else {
  //     // fallback if quantity is not an array (maybe it's an object)
  //     const qty = parseInt(values.quantity?.qty ?? 0);
  //     totalQty = isNaN(qty) ? 0 : qty;

  //     values.condition = {
  //       Good: totalQty,
  //       Defect: 0,
  //       Damage: 0,
  //     };
  //   }

  //   const safeValues = {
  //     quantity: values.quantity ?? 0, // preserve full structure (array or object)
  //     condition: values.condition ?? { Good: 0, Defect: 0, Damage: 0 },
  //     ...(values.volume !== undefined && { volume: values.volume }),
  //     ...(values.qty !== undefined && { qty: values.qty }),
  //   };

  //   try {
  //     const snapshot = await getDocs(collection(db, "inventory"));

  //     snapshot.forEach(async (docItem) => {
  //       const data = docItem.data();

  //       if (data.itemId === editingItem.itemId) {
  //         const inventoryId = docItem.id;
  //         const itemRef = doc(db, "inventory", inventoryId);

  //         const existingLabRoom = data.labRoom;
  //         if (!existingLabRoom) {
  //           console.warn("❌ Existing item has no labRoom, cannot update labRoom items subcollection.");
  //           return;
  //         }

  //         safeValues.labRoom = existingLabRoom;

  //         await updateDoc(itemRef, safeValues);

  //         setIsNotificationVisible(true);
  //         setNotificationMessage("Item updated successfully!");

  //         const updatedItem = {
  //           ...editingItem,
  //           ...safeValues,
  //         };

  //        // setDataSource((prevData) =>
  //         //   prevData.map((item) =>
  //         //     item.id === editingItem.id ? updatedItem : item
  //         //   )
  //         // );

  //         setDataSource((prevData) =>
  //           prevData.map((item) =>
  //             item.itemId === editingItem.itemId ? { ...item, ...updatedItem } : item
  //           )
  //         );

  //         const roomNumber = existingLabRoom.toString().padStart(4, '0');
  //         const itemId = data.itemId;

  //         const labRoomQuery = query(collection(db, "labRoom"), where("roomNumber", "==", roomNumber));
  //         const labRoomSnapshot = await getDocs(labRoomQuery);

  //         if (!labRoomSnapshot.empty) {
  //           const labRoomDoc = labRoomSnapshot.docs[0];
  //           const labRoomRef = labRoomDoc.ref;

  //           const labRoomItemRef = doc(collection(labRoomRef, "items"), itemId);
  //           const labRoomItemSnap = await getDoc(labRoomItemRef);

  //           if (labRoomItemSnap.exists()) {
  //             await updateDoc(labRoomItemRef, safeValues);
  //             console.log(`✅ Updated labRoom/${labRoomRef.id}/items/${itemId}`);

  //           } else {
  //             console.warn(`⚠️ Item ${itemId} not found in labRoom`);
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
  //     console.error("🔥 Error updating document in Firestore:", error);
  //   }
  // };

   const updateItem = async (values) => {
    console.log("✅ Raw incoming values:", values);

    const safeValues = {
      quantity: values.quantity ?? 0,
      // status: values.status ?? "Available",
      condition: values.condition ?? { Good: 0, Defect: 0, Damage: 0 },
    };

      const isQuantitySame = safeValues.quantity === (editingItem.quantity ?? 0);
      const isConditionSame = 
        (safeValues.condition.Good ?? 0) === (editingItem.condition?.Good ?? 0) &&
        (safeValues.condition.Defect ?? 0) === (editingItem.condition?.Defect ?? 0) &&
        (safeValues.condition.Damage ?? 0) === (editingItem.condition?.Damage ?? 0);

      if (isQuantitySame && isConditionSame) {
        // No changes detected
        setIsNotificationVisible(true);
        setNotificationMessage("No changes detected. Please update at least one value.");
        return;  // Exit early without updating
      }

    // try {
    //   const snapshot = await getDocs(collection(db, "inventory"));

    //   snapshot.forEach(async (docItem) => {
    //     const data = docItem.data();

    //     if (data.itemId === editingItem.itemId) {
    //       const inventoryId = docItem.id;
    //       const itemRef = doc(db, "inventory", inventoryId);

    //       await updateDoc(itemRef, safeValues);

    //       setIsNotificationVisible(true);
    //       setNotificationMessage("Item updated successfully!");

    //       const updatedItem = {
    //         ...editingItem,
    //         ...safeValues,
    //       };

    //       setDataSource((prevData) =>
    //         prevData.map((item) =>
    //           item.id === editingItem.id ? updatedItem : item
    //         )
    //       );

    //       const labRoomId = safeValues.labRoom;
    //       const itemId = data.itemId;

    //       if (labRoomId && itemId) {
    //         const labRoomItemRef = doc(db, "labRoom", labRoomId, "items", itemId);
    //         const labRoomSnap = await getDoc(labRoomItemRef);

    //         if (labRoomSnap.exists()) {
    //           await updateDoc(labRoomItemRef, safeValues);
    //           console.log(`🏫 labRoom/${labRoomId}/items/${itemId} updated successfully`);

    //         } else {
    //           console.warn(`⚠️ labRoom item not found for itemId: ${itemId} in labRoom: ${labRoomId}`);
    //         }
    //       }

    //       setIsEditModalVisible(false);
    //       setIsRowModalVisible(false)
    //       setEditingItem(null);
    //       form.resetFields();
    //     }
    //   });
      
    // } catch (error) {
    //   console.error("Error updating document in Firestore:", error);
    // }

    try {
      const snapshot = await getDocs(collection(db, "inventory"));

      snapshot.forEach(async (docItem) => {
        const data = docItem.data();

        if (data.itemId === editingItem.itemId) {
          const inventoryId = docItem.id;
          const itemRef = doc(db, "inventory", inventoryId);

          // Use the labRoom from the existing Firestore document
          const existingLabRoom = data.labRoom;
          if (!existingLabRoom) {
            console.warn("❌ Existing item has no labRoom, cannot update labRoom items subcollection.");
            return;
          }

          // Add labRoom to safeValues here from existing data
          safeValues.labRoom = existingLabRoom;

          // Update inventory doc with safeValues (including labRoom from Firestore)
          await updateDoc(itemRef, safeValues);

          setIsNotificationVisible(true);
          setNotificationMessage("Item updated successfully!");

          const updatedItem = {
            ...editingItem,
            ...safeValues,
          };

          setDataSource((prevData) =>
            prevData.map((item) =>
              item.id === editingItem.id ? updatedItem : item
            )
          );

          // Now get the roomNumber string for query (padStart if needed)
          const roomNumber = existingLabRoom.toString().padStart(4, '0');

          const itemId = data.itemId;

          console.log("🧪 Matching roomNumber:", roomNumber);
          console.log("🆔 Matching itemId:", itemId);

          // Query labRoom collection for the matching roomNumber
          const labRoomQuery = query(collection(db, "labRoom"), where("roomNumber", "==", roomNumber));
          const labRoomSnapshot = await getDocs(labRoomQuery);

          if (!labRoomSnapshot.empty) {
            const labRoomDoc = labRoomSnapshot.docs[0];
            const labRoomRef = labRoomDoc.ref;

            // Reference to the item inside labRoom/items/itemId
            const labRoomItemRef = doc(collection(labRoomRef, "items"), itemId);
            const labRoomItemSnap = await getDoc(labRoomItemRef);

            if (labRoomItemSnap.exists()) {
              await updateDoc(labRoomItemRef, safeValues);
              console.log(`✅ Updated labRoom/${labRoomRef.id}/items/${itemId}`);

              
              const existingGoodQty = data.condition?.Good ?? 0;
              const newGoodQty = values.condition?.Good ?? 0;
              const goodQtyDifference = newGoodQty - existingGoodQty;

              const stockLogRef = collection(db, "inventory", inventoryId, "stockLog");

              // 1. Query the latest deliveryNumber
              const latestLogQuery = query(stockLogRef, orderBy("createdAt", "desc"), limit(1));
              const latestSnapshot = await getDocs(latestLogQuery);

              let newDeliveryNumber = "DLV-00001";

              if (!latestSnapshot.empty) {
                const latestDoc = latestSnapshot.docs[0];
                const lastDeliveryNumber = latestDoc.data().deliveryNumber;

                const match = lastDeliveryNumber?.match(/DLV-(\d+)/);
                if (match) {
                  const lastNumber = parseInt(match[1], 10);
                  const nextNumber = (lastNumber + 1).toString().padStart(5, "0");
                  newDeliveryNumber = `DLV-${nextNumber}`;
                }
              }

              // 2. Add the new log (using quantityDifference instead of total)
              await addDoc(stockLogRef, {
                date: new Date().toISOString().split("T")[0],
                noOfItems: goodQtyDifference,
                deliveryNumber: newDeliveryNumber,
                createdAt: serverTimestamp(),
              });

            } else {
              console.warn(`⚠️ Item ${itemId} not found in labRoom`);
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
    { title: "Item Description", dataIndex: "itemDetails", key: "itemDetails" },
    {
      title: "Inventory Balance",
      dataIndex: "quantity",
      key: "quantity",
      // render: (text, record) => {
      //   const { category, unit, volume } = record;
      //   if (["Chemical", "Reagent"].includes(category)) {
      //     return `${text} pcs / ${unit || ""} ML `;
      //   }

      //   if (category === "Glasswares" && volume) {
      //     return `${text} pcs / ${volume} ML`;
      //   }

      //   return text;
      // },
    },
    // { title: "Usage Type", dataIndex: "usageType", key: "usageType" }, 
    { title: "Status", dataIndex: "status", key: "status" },   
    // {
    //   title: "Actions",
    //   dataIndex: "actions",
    //   key: "actions",
    //   render: (_, record) => (
    //     <Space direction="vertical" size="small">
    //       <Button
    //         icon={<EyeOutlined />} 
    //         onClick={(e) => {
    //           e.stopPropagation(); 
    //           setSelectedRow(record);
    //           setIsRowModalVisible(true);
    //         }}
    //       >
    //         View
    //       </Button>

    //       <Button
    //         type="link"
    //         icon={<EditOutlined />}
    //         onClick={(e) => {
    //           e.stopPropagation(); 
    //           setSelectedRow(record);
    //           setIsEditModalVisible(true);
    //           editItem(record)
    //         }}
    //       >
    //         Edit
    //       </Button>
    //     </Space>
    //   ),
    // }    
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
          {/* <div className="form-container">
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
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name="quantity"
                    label="Quantity"
                    rules={[{ required: true, message: "Please enter Quantity!" }]}
                  >
                      <InputNumber min={1} placeholder="Enter quantity" style={{ width: "100%" }}/>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
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

                {["Chemical", "Reagent"].includes(selectedCategory) && (
                  <Col span={8}>
                    <Form.Item
                      name="unit"
                      label="Unit"
                      rules={[{ required: true, message: "Please select a unit!" }]}
                    >
                      <Select placeholder="Select Unit">
                        <Option value="ML">ML</Option>
                        <Option value="L">L</Option>
                        <Option value="GALLON">GALLON</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                )}

                <Col span={8}>
                  <Form.Item
                    name="entryDate"
                    label="Date of Entry"
                    // rules={[{ required: true, message: "Please select a date of entry!" }]}
                    disabled
                  >
                    <DatePicker
                      format="YYYY-MM-DD"
                      style={{ width: "100%" }}
                      placeholder="Select Date of Entry"
                      disabledDate={disabledDate}
                      defaultValue={dayjs()} // ✅ Correct format
                      initialValue={dayjs()} 
                      disabled
                    />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name="expiryDate"
                    label="Date of Expiry"
                    rules={[{ required: false, message: "Please select a date of expiry!" }]}
                  >
                    <DatePicker
                      format="YYYY-MM-DD"
                      style={{ width: "100%" }}
                      placeholder="Select Date of Expiry"
                      disabledDate={disabledExpiryDate}
                      disabled={disableExpiryDate}
                    />
                  </Form.Item>
                </Col>
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
                    label="Lab/Stock Room"
                    rules={[{ required: true, message: "Please enter Lab/Stock Room!" }]}
                  >
                    <Input placeholder="Enter Lab/Stock Room" />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item name="department" label="Department">
                    <Input placeholder="Enter department" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button type="primary" htmlType="submit" className="add-btn">
                  Add to Inventory
                </Button>
              </Form.Item>
            </Form>
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

            </Space>
          </div> */}
    
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
            // onRow={(record) => {
            //   return {
            //     onClick: () => {
            //       setSelectedRow(record);
            //       setIsRowModalVisible(true); // Show the "View Details" modal
            //     },
            //   };
            // }}
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

          {/* <Modal
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
                    name="quantity"
                    label="Quantity"
                    rules={[{ required: true, message: "Please enter Quantity!" }]}
                  >
                    <InputNumber min={1} placeholder="Enter quantity" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
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

                {["Chemical", "Reagent"].includes(selectedCategory) && (
                  <Col span={8}>
                    <Form.Item
                      name="unit"
                      label="Unit"
                      rules={[{ required: true, message: "Please select a unit!" }]}
                    >
                      <Input 
                      type="number"
                      addonAfter="ML"
                      value="ML"/>
                    </Form.Item>
                  </Col>
                )}

                {selectedCategory === "Glasswares" && (
                  <Col span={8}>
                    <Form.Item
                      name="volume"
                      label="Volume"
                      rules={[{ required: true, message: "Please enter the volume!" }]}
                    >
                      <Input
                        type="number"
                        addonAfter="ML"
                        placeholder="Enter volume"
                      />
                    </Form.Item>
                  </Col>
                )}

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

                <Col span={8}>
                  <Form.Item name="expiryDate" label="Date of Expiry">
                    <DatePicker
                      format="YYYY-MM-DD"
                      style={{ width: "100%" }}
                      disabledDate={disabledExpiryDate}
                      disabled={disableExpiryDate}
                    />
                  </Form.Item>
                </Col>
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
                    label="Lab/Stock Room"
                    rules={[{ required: true, message: "Please enter Lab/Stock Room!" }]}
                  >
                    <Input placeholder="Enter Lab/Stock Room" />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item name="department" label="Department">
                    <Input placeholder="Enter department" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button type="primary" htmlType="submit" className="add-btn">
                  Add to Inventory
                </Button>
              </Form.Item>
            </Form>
          </Modal> */}

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

                {/* {["Chemical", "Reagent"].includes(selectedCategory) && (
                  <Col span={8}>
                    <Form.Item
                      name="unit"
                      label="Unit"
                      rules={[{ required: true, message: "Please select a unit!" }]}
                    >
                      <Input 
                      type="number"
                      addonAfter="ML"
                      value="ML"/>
                    </Form.Item>
                  </Col>
                )} */}

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
                
                <Col span={8}>
                  <Form.Item
                    name="Critical Level"
                    label="criticalLevel"
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

                <Col span={8}>
                  <Form.Item name="expiryDate" label="Date of Expiry">
                    <DatePicker
                      format="YYYY-MM-DD"
                      style={{ width: "100%" }}
                      disabledDate={disabledExpiryDate}
                      disabled={disableExpiryDate}
                    />
                  </Form.Item>
                </Col>
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

                <Col span={8}>
                  <Form.Item name="department" label="Department">
                    <Input placeholder="Enter department" />
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
                          <th>Item Description</th>
                          <td>{selectedRow.itemDetails}</td>
                        </tr>

                        <tr>
                          <th>Item Name</th>
                          <td>{selectedRow.itemName}</td>
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

                        <tr>
                          <th>Category</th>
                          <td>{selectedRow.category}</td>
                        </tr>

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
                          <th>Condition</th>
                          <td>{formatCondition(selectedRow.condition, selectedRow.category)}</td>
                        </tr>
                        <tr>
                          <th>Lab/ Stock Room</th>
                          <td>{selectedRow.labRoom}</td>
                        </tr>
                        <tr>
                          <th>Date of Expiry</th>
                          <td>{selectedRow.expiryDate || 'N/A'}</td>
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
                        setIsEditModalVisible(true);
                        editItem(selectedRow);
                      }}
                      style={{ marginRight: 12 }}
                    >
                      Update Stock
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

                          return Promise.reject(
                            new Error("Sum of Good, Defect, and Damage must equal Quantity")
                          );
                        },
                      }),
                    ]}
                  >
                    <Input type="number" min={0} placeholder="Enter quantity" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                {/* <Col span={12}>
                  <Form.Item name="quantity" label="Quantity">
                    <Input placeholder="Enter quantity" />
                  </Form.Item>
                </Col> */}
              </Row>

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

              <Row gutter={16}>
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
              </Row>
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


//done PRINT SAVE AND EXCEL