import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { useLocation } from "react-router-dom";
import {Layout,Table,Input,Button,Select,Form,Row,Col,DatePicker,Modal,InputNumber,Radio,FloatButton,Checkbox,Spin} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, FileTextOutlined, DownloadOutlined, FilePdfOutlined, FileExcelOutlined, PrinterOutlined, FilterOutlined} from '@ant-design/icons'; 
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { getFirestore, collection, addDoc, Timestamp, getDocs, doc, onSnapshot, query, where, serverTimestamp, orderBy, limit, writeBatch, updateDoc } from "firebase/firestore";
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
import autoTable from "jspdf-autotable";
import { getAuth } from "firebase/auth";
import { getDoc, doc as fsDoc } from "firebase/firestore"; 
import Sider from "antd/es/layout/Sider.js";

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
  const [itemIdMode, setItemIdMode] = useState("automatic"); // "automatic" or "manual"
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
  const [updateStockLoading, setUpdateStockLoading] = useState(false);
  const [editItemLoading, setEditItemLoading] = useState(false);
  const [restockRequestLoading, setRestockRequestLoading] = useState(false);
  const db = getFirestore();
  const [isRestockRequestModalVisible, setIsRestockRequestModalVisible] = useState(false);
  const [restockForm] = Form.useForm();
  const [itemToRestock, setItemToRestock] = useState(null);
  const [isFullEditModalVisible, setIsFullEditModalVisible] = useState(false);
  const [fullEditForm] = Form.useForm();
  const userRole = localStorage.getItem("userPosition")?.toLowerCase();
  const userName = localStorage.getItem("userName");
  const userId = localStorage.getItem("userId");
  const [exportLoading, setExportLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);

  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const filter = searchParams.get('filter');
    if (filter === 'critical') {
      setShowCriticalOnly(true);
    }
  }, [location.search]);
  const [printLoading, setPrintLoading] = useState(false);
  const [qrCodesModalVisible, setQrCodesModalVisible] = useState(false);
  const [selectedItemQRCodes, setSelectedItemQRCodes] = useState([]);
  const [selectedParentItem, setSelectedParentItem] = useState(null);
  const [qrCodesLoading, setQrCodesLoading] = useState(false);
  const [editingCondition, setEditingCondition] = useState(null);
  const [updatingCondition, setUpdatingCondition] = useState(false);
  const [editingQRCode, setEditingQRCode] = useState(null);

  const sanitizeInput = (input) =>
  input.replace(/\s+/g, " ")                          
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
    const observer = new ResizeObserver(measureHeight);
    if (headerRef.current) {
      observer.observe(headerRef.current);
    }

    return () => observer.disconnect();
  }, []);

const isConsumable = (cat) =>
  ["chemical", "reagent", "materials"].includes((cat || "").toLowerCase());
const isDurable = (cat) =>
  ["equipment", "glasswares"].includes((cat || "").toLowerCase());

const isItemCritical = (item) => {
  if (!item) return false;
  
  const category = (item.category || "").toLowerCase();
  const quantity = Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 0;

  if (isConsumable(category)) {
    const cl = Number.isFinite(Number(item.criticalLevel)) ? Number(item.criticalLevel) : 0;
    return quantity <= cl;
  }

  if (isDurable(category)) {
    const at = Number.isFinite(Number(item.availabilityThreshold))
      ? Number(item.availabilityThreshold)
      : 0;
    return at > 0 && quantity < at;
  }

  return false;
};

const getDisplayStatus = (status, quantity, category) => {
  if (quantity === 0) {
    return "out of stock";
  }
  return status;
};

const MAX_CL_GLOBAL = 10000;
const CATEGORY_CL_CAPS = {
  chemical: 5000,
  reagent: 5000,
  materials: 10000,
};

const DEFAULT_RESTOCK_MONTH = 5; 
const DEFAULT_RESTOCK_DAY = 1;   

const clamp = (v, min, max) => Math.min(Math.max(v ?? 0, min), max);
const isValidDate = (d) => d instanceof Date && !isNaN(d);

function nextCycleDateFromFixedToday(today = new Date()) {
  const y = today.getFullYear();
  const candidate = new Date(Date.UTC(y, DEFAULT_RESTOCK_MONTH, DEFAULT_RESTOCK_DAY));
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  if (candidate <= todayUTC) {
    return new Date(Date.UTC(y + 1, DEFAULT_RESTOCK_MONTH, DEFAULT_RESTOCK_DAY));
  }

  return candidate;
}

function daysBetweenUTC(a, b) {
  const MS = 24 * 60 * 60 * 1000;
  const aUTC = new Date(Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()));
  const bUTC = new Date(Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()));
  const diff = (bUTC.getTime() - aUTC.getTime()) / MS;
  return Number.isFinite(diff) ? Math.max(1, Math.ceil(diff)) : 30;
}

function computeBufferPct(avgDaily, stdDaily) {
  const cv = stdDaily / Math.max(avgDaily, 1e-6);
  const raw = 0.15 + 0.5 * cv;
  return Math.min(0.5, Math.max(0.15, raw));
}

async function getDailyUsageStats(db, itemId) {
  const usageQuery = query(
    collection(db, "itemUsage"),
    where("itemId", "==", itemId),
    orderBy("timestamp", "desc"),
    limit(30)
  );
  const snap = await getDocs(usageQuery);
  if (snap.empty) return { avgDaily: 0, stdDaily: 0, daysCount: 0 };

  const perDay = new Map();
  snap.docs.forEach((d) => {
    const u = d.data();
    const ts =
      u.timestamp instanceof Timestamp
        ? u.timestamp.toDate()
        : new Date(u.timestamp);
    const key = ts.toDateString();
    const used = Number(u.usedQuantity) || 0;
    perDay.set(key, (perDay.get(key) || 0) + used);
  });

  const vals = Array.from(perDay.values());
  const n = Math.max(vals.length, 1);
  const sum = vals.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const variance =
    vals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / Math.max(n - 1, 1);
  const std = Math.sqrt(variance);
  return { avgDaily: mean, stdDaily: std, daysCount: vals.length };
}

function resolveNextRestockDateSafe(data, today = new Date()) {
  let d = null;
  try {
    d = typeof resolveNextRestockDate === "function" ? resolveNextRestockDate(data) : null;
  } catch {
    d = null;
  }
  if (!isValidDate(d)) d = nextCycleDateFromFixedToday(today);
  if (!isValidDate(d)) d = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (d < today) d = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  return d;
}

function getDurableAvailabilityFields(itemDocData) {
  const quantity = Number(itemDocData.quantity);
  const safeQty = Number.isFinite(quantity) && quantity >= 0 ? quantity : 0;

  let availabilityThreshold = Number(itemDocData.availabilityThreshold);
  if (!Number.isFinite(availabilityThreshold)) {
    availabilityThreshold = 1; 
  }

  return { availableNow: safeQty, availabilityThreshold };
}

useEffect(() => {
  const inventoryRef = collection(db, "inventory");

  const unsubscribe = onSnapshot(
    inventoryRef,
    async (snapshot) => {
      setLoading(true);

      try {
        const batch = writeBatch(db);

        const items = await Promise.all(
          snapshot.docs.map(async (docSnap, index) => {
            const data = docSnap.data();
            const docId = docSnap.id;

            const entryDate = data.entryDate || "N/A";
            const expiryDate = data.expiryDate || "N/A";

            const quantityRaw = Number(data.quantity);
            const quantity =
              Number.isFinite(quantityRaw) && quantityRaw >= 0 ? quantityRaw : 0;

            const category = (data.category || "").toLowerCase();
            let status = data.status || "";
            let newStatus = status;

            let avgDailyUsage = undefined;
            const storedCriticalRaw = data.criticalLevel;
            const storedCritical = Number.isFinite(Number(storedCriticalRaw))
              ? Number(storedCriticalRaw)
              : null;

            let finalCriticalLevel = storedCritical;

            let availabilityThresholdOut;
            let availableNowOut;

            if (isConsumable(category) && data.itemId) {
              const { avgDaily, stdDaily } = await getDailyUsageStats(
                db,
                data.itemId
              );
              const safeAvg = Number.isFinite(avgDaily) ? Math.max(avgDaily, 0) : 0;
              avgDailyUsage = safeAvg;

              const today = new Date();
              const nextRestockDate = resolveNextRestockDateSafe(data, today);

              const rawDays = daysBetweenUTC(today, nextRestockDate);
              const safeDays = clamp(rawDays, 1, 180);

              let bufferPct = computeBufferPct(safeAvg, stdDaily);
              bufferPct = Number.isFinite(bufferPct)
                ? clamp(bufferPct, 0, 1)
                : 0.2;

              const capForCat = CATEGORY_CL_CAPS[category] ?? MAX_CL_GLOBAL;
              let computedAnnualCL = Math.ceil(safeAvg * safeDays * (1 + bufferPct));
              computedAnnualCL = clamp(computedAnnualCL, 0, capForCat);

              const manualRaw = data.criticalLevel;
              const manual = Number.isFinite(Number(manualRaw)) ? Number(manualRaw) : null;
              const manualIsSane =
                Number.isFinite(manual) && manual >= 0 && manual <= capForCat;

              if (manualIsSane) {
                finalCriticalLevel = manual;

              } else if (computedAnnualCL > 0) {
                finalCriticalLevel = computedAnnualCL;

              } else {
                finalCriticalLevel = storedCritical;
              }

              const runoutDays = safeAvg > 0 ? quantity / safeAvg : null;
              const runoutDate =
                runoutDays != null
                  ? new Date(today.getTime() + runoutDays * 24 * 60 * 60 * 1000)
                  : null;
              const atRisk =
                isValidDate(runoutDate) && isValidDate(nextRestockDate)
                  ? runoutDate < nextRestockDate
                  : false;

              const updates = {};
              if (Number.isFinite(safeAvg) && safeAvg !== data.averageDailyUsage) {
                updates.averageDailyUsage = safeAvg;
              }
    
              if (Number.isFinite(finalCriticalLevel) && finalCriticalLevel !== storedCritical) {
                updates.criticalLevel = finalCriticalLevel;
              }

              const nextRestockISO = isValidDate(nextRestockDate) ? nextRestockDate.toISOString() : null;
              if (nextRestockISO !== (data.nextRestockDate || null)) {
                updates.nextRestockDate = nextRestockISO;
              }
              const runoutISO = isValidDate(runoutDate) ? runoutDate.toISOString() : null;
              if (runoutISO !== (data.runoutDate || null)) {
                updates.runoutDate = runoutISO;
              }
              if (updates.atRisk === undefined && atRisk !== (data.atRisk || false)) {
                updates.atRisk = atRisk;
              }

              if (Object.keys(updates).length > 0) {
                batch.update(doc(db, "inventory", docId), updates);
              }
            }

            if (isDurable(category)) {
              const { availableNow, availabilityThreshold } =
                getDurableAvailabilityFields(data);

              availableNowOut = availableNow;
              availabilityThresholdOut = availabilityThreshold;

              const updates = {};
              if (availableNowOut !== data.availableNow) updates.availableNow = availableNowOut;
              if (availabilityThresholdOut !== data.availabilityThreshold)
                updates.availabilityThreshold = availabilityThresholdOut;
              if (Object.keys(updates).length > 0) {
                batch.update(doc(db, "inventory", docId), updates);
              }
            }

            if (quantity === 0) {
              newStatus = isConsumable(category)
                ? "out of stock"
                : isDurable(category)
                ? "unavailable"
                : "out of stock";
            } else if (isConsumable(category)) {
              newStatus =
                Number.isFinite(finalCriticalLevel) && quantity <= finalCriticalLevel
                  ? "low stock"
                  : "in stock";
            } else if (category === "equipment" || category === "glasswares") {
              if (
                availabilityThresholdOut != null &&
                quantity < availabilityThresholdOut
              ) {
                newStatus = "low availability";
              } else {
                newStatus = "available";
              }
            } else if (isDurable(category)) {
              if (
                availabilityThresholdOut != null &&
                quantity < availabilityThresholdOut
              ) {
                newStatus = "low availability";
              } else {
                newStatus = "in stock";
              }
            } else {
              newStatus = "in stock";
            }

            if (newStatus !== status) {
              batch.update(doc(db, "inventory", docId), { status: newStatus });
            }

            const labRoomsSnapshot = await getDocs(collection(db, "labRoom"));
            for (const roomDoc of labRoomsSnapshot.docs) {
              const roomId = roomDoc.id;
              const itemsRef = collection(db, `labRoom/${roomId}/items`);
              const itemsSnap = await getDocs(itemsRef);

              itemsSnap.forEach((itemDoc) => {
                const itemData = itemDoc.data();
                if (
                  itemData.itemId === data.itemId &&
                  itemData.status !== newStatus
                ) {
                  const labItemRef = doc(
                    db,
                    `labRoom/${roomId}/items`,
                    itemDoc.id
                  );
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
              category,
              quantity,
              status: newStatus,
              averageDailyUsage: avgDailyUsage ?? data.averageDailyUsage,
              criticalLevel: isConsumable(category) ? finalCriticalLevel ?? data.criticalLevel : undefined,
              availabilityThreshold: isDurable(category)
                ? availabilityThresholdOut ?? data.availabilityThreshold
                : undefined,
              availableNow: isDurable(category) ? availableNowOut ?? data.availableNow : undefined,
              ...data,
            };
          })
        );

        await batch.commit();

        items.sort((a, b) =>
          (a.item || "").localeCompare(b.item || "")
        );
        setDataSource(items);
        setCount(items.length);
      } catch (error) {
        console.error("Error processing inventory snapshot: ", error);
      } finally {
        setLoading(false);
      }
    },
    (error) => {
      console.error("Error fetching inventory with onSnapshot: ", error);
      setLoading(false);
    }
  );

  return () => unsubscribe();
}, []);

 useEffect(() => {
    const departmentsCollection = collection(db, "departments");

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

  useEffect(() => {
  const inventoryRef = collection(db, "inventory");

  const unsubscribe = onSnapshot(
    inventoryRef,
    async (snapshot) => {
      setLoading(true);
      try {
        const batch = writeBatch(db); 

        const items = await Promise.all(
          snapshot.docs.map(async (docSnap, index) => {
            const data = docSnap.data();
            const docId = docSnap.id;
            const quantity = Number(data.quantity) || 0;
            const criticalLevel = Number(data.criticalLevel) || 0;
            const category = (data.category || "").toLowerCase();

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

        await batch.commit();

        items.sort((a, b) => (a.item || "").localeCompare(b.item || ""));
        setDataSource(items);
        setCount(items.length);

      } catch (error) {
        console.error("Error processing inventory snapshot: ", error);
      } finally {
        setLoading(false); 
      }
    },
    (error) => {
      console.error("Error fetching inventory: ", error);
      setLoading(false);
    }
  );

  return () => unsubscribe();
}, []);

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
  setItemToRestock(item); 
  setIsRestockRequestModalVisible(true);
};

const handleRestockSubmit = async (values) => {
  setRestockRequestLoading(true);
  try {
    const restockRequestQuery = query(
      collection(db, "restock_requests"),
      where("itemId", "==", itemToRestock.itemId), 
      where("status", "==", "pending")
    );

    const querySnapshot = await getDocs(restockRequestQuery);

    if (!querySnapshot.empty) {
      setNotificationMessage(`${itemToRestock.itemName} is already in the restock request list.`);
      setIsNotificationVisible(true);
      return;
    }

    const restockRequest = {
      department: itemToRestock.department,
      item_name: itemToRestock.itemName,
      quantity_needed: values.quantityNeeded,
      reason: values.reason,
      status: "pending",
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      accountId: userId,      
      userName: userName || "User" 
    };

    await addDoc(collection(db, "restock_requests"), restockRequest);

    if (userRole === "super-user" || userRole === "laboratory custodian") {
      await addDoc(collection(db, "allNotifications"), {
        action: `Restock request submitted by ${userName}`,
        userId: userId,
        userName: userName,
        read: false,
        visibleTo: "admin", 
        type: "restock-request",
        timestamp: serverTimestamp()
      });
    }

    await addDoc(collection(db, `accounts/${userId}/activitylog`), {
      action: `Requested restock for ${itemToRestock.itemName} (Qty: ${values.quantityNeeded})`,
      userName: userName || "User",
      timestamp: serverTimestamp(),
    });


    restockForm.resetFields();

    setNotificationMessage("Restock request submitted successfully!");
    setIsNotificationVisible(true);

    setIsRestockRequestModalVisible(false);
    
  } catch (error) {
    console.error("Error submitting restock request:", error);
    setNotificationMessage("Failed to submit restock request. Please try again.");
    setIsNotificationVisible(true);
  } finally {
    setRestockRequestLoading(false);
  }
};

useEffect(() => {
    const inventoryRef = collection(db, "inventory");

    const unsubscribe = onSnapshot(
      inventoryRef,
      async (snapshot) => {
        setLoading(true); // Start loading
        try {
          const batch = writeBatch(db);

          const items = await Promise.all(
            snapshot.docs.map(async (docSnap, index) => {
              const data = docSnap.data();
              const docId = docSnap.id;

              const quantity = Number(data.quantity) || 0;
              const criticalLevel = Number(data.criticalLevel) || 0;

              let status = data.status || ""; 
              let newStatus = status;

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

          await batch.commit();

          items.sort((a, b) => (a.item || "").localeCompare(b.item || ""));
          setDataSource(items);
        } catch (error) {
          console.error("Error processing inventory snapshot: ", error);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching inventory: ", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const inventoryRef = collection(db, "inventory");
    const unsubscribeFunctions = [];
   
    const setupQRCodeListeners = async () => {
      try {
        const inventorySnapshot = await getDocs(inventoryRef);
        
        for (const docSnap of inventorySnapshot.docs) {
          const inventoryId = docSnap.id;
          const inventoryData = docSnap.data();
          
          const qrCodesRef = collection(db, "inventory", inventoryId, "qrCodes");
          
          const qrCodesUnsubscribe = onSnapshot(qrCodesRef, (qrSnapshot) => {
            qrSnapshot.docChanges().forEach(async (change) => {
              if (change.type === 'modified' || change.type === 'added') {
                const qrData = change.doc.data();
                const condition = qrData.condition?.toLowerCase();
                const currentStatus = qrData.status;

                if ((condition === 'defect' || condition === 'damage' || condition === 'lost') && 
                    currentStatus !== 'Not Available') {
                  
                  try {
                    const qrCodeDocRef = doc(db, "inventory", inventoryId, "qrCodes", change.doc.id);
                    await updateDoc(qrCodeDocRef, {
                      status: "Not Available",
                      lastUpdated: serverTimestamp()
                    });
                    
                  } catch (updateError) {
                    console.error(`Error updating QR code`, updateError);
                  }
                }
                else if (condition === 'good' && currentStatus === 'Not Available') {
                  
                  try {
                    const qrCodeDocRef = doc(db, "inventory", inventoryId, "qrCodes", change.doc.id);
                    await updateDoc(qrCodeDocRef, {
                      status: "Available",
                      lastUpdated: serverTimestamp()
                    });
                    
                  } catch (updateError) {
                    console.error(`Error updating QR code`, updateError);
                  }
                }
              }
            });
          }, (error) => {
            console.error(`Error monitoring QR codes for inventory`, error);
          });
          
          unsubscribeFunctions.push(qrCodesUnsubscribe);
        }
      } catch (error) {
        console.error("Error setting up QR code listeners:", error);
      }
    };
    
    setupQRCodeListeners();

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, []);

function resolveNextRestockDate(data) {
  const today = new Date();

  if (data.nextRestockDate) {
    const d = new Date(data.nextRestockDate);
    if (!isNaN(d.getTime())) return d;
  }

  const baseDateStr = data.lastRestockedAt || data.entryDate;
  if (baseDateStr) {
    const base = new Date(baseDateStr);
    if (!isNaN(base.getTime())) {
      const next = new Date(Date.UTC(base.getUTCFullYear() + 1, base.getUTCMonth(), base.getUTCDate()));
      if (next > today) return next;
    }
  }

  return nextCycleDateFromFixedToday(today);
}

  const handleFullUpdate = async (values) => {
  setEditItemLoading(true);
  try {
    if (!editingItem || !editingItem.docId) {
      console.error("❌ No item selected or docId missing.");
      setNotificationMessage("Item selection error.");
      setIsNotificationVisible(true);
      setEditItemLoading(false);
      return;
    }

    const cat = values.category;
    const isConsumable = ["Chemical", "Reagent", "Materials"].includes(cat);
    const isDurable    = ["Equipment", "Glasswares"].includes(cat);

    const sanitizedItemName = values.itemName?.trim();
    const sanitizedItemDetails = values.itemDetails?.trim();

    if (!sanitizedItemName || !sanitizedItemDetails) {
      setNotificationMessage("Item name and details are required.");
      setIsNotificationVisible(true);
      return;
    }

    // 🔧 FIX: Don't validate conditions during full update
    // Condition counts are not changed during full updates - they remain the same

    const payload = {
      itemName: sanitizedItemName,
      itemDetails: sanitizedItemDetails,
      category: cat,
      department: "Medical Technology",
      labRoom: editingItem.labRoom, 
      shelves: values.shelves,
      row: values.row,
      unit: values.unit,              
      status: values.status,
    };

    const manualCriticalOverride = Boolean(values.manualCriticalOverride);
    if (isConsumable) {
      if (manualCriticalOverride) {
        const n = Number(values.criticalLevel);
        if (!Number.isFinite(n) || n < 1) {
          setNotificationMessage("❌ Critical Level must be a number ≥ 1 (or untick manual override).");
          setIsNotificationVisible(true);
          return;
        }
        payload.criticalLevel = Math.floor(n);
        payload.manualCriticalOverride = true;
      } else {
        payload.manualCriticalOverride = false;
      }
    }

    if (isDurable) {
      delete payload.criticalLevel;
      delete payload.manualCriticalOverride;

      const atRaw = values.availabilityThreshold;
      const atNum = atRaw === "" || atRaw == null ? 1 : Number(atRaw);
      if (!Number.isFinite(atNum) || atNum < 0) {
        setNotificationMessage("❌ Availability Threshold must be a number ≥ 0.");
        setIsNotificationVisible(true);
        return;
      }
      payload.availabilityThreshold = Math.floor(atNum);
    }

    // if (["Equipment", "Glasswares", "Materials"].includes(cat)) {
    //   payload.condition = { Good, Defect, Damage, Lost };
    // }

    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName") || "User";

    const response = await axios.post("https://webnuls.onrender.com/update-inventory-full", {
      values: payload,
      editingItem,
      userId,
      userName,
    });

    if (response.status === 200) {
      setNotificationMessage("✅ Item updated successfully!");
      setIsNotificationVisible(true);

      const updatedItem = {
        ...editingItem,
        ...payload,
        quantity:
          ["Equipment", "Glasswares", "Materials"].includes(cat)
            ? (payload.condition?.Good ?? editingItem.quantity ?? 0)
            : editingItem.quantity,
      };

      setDataSource((prev) =>
        prev.map((item) => (item.docId === editingItem.docId ? updatedItem : item))
      );

      setIsFullEditModalVisible(false);
      setIsRowModalVisible(false);
      setEditingItem(null);
      fullEditForm.resetFields();
    } else {
      setNotificationMessage("❌ Failed to update item.");
      setIsNotificationVisible(true);
    }
  } catch (error) {
    console.error("Error in handleFullUpdate:", error);
    setNotificationMessage("❌ Error updating item. Check console.");
    setIsNotificationVisible(true);
  } finally {
    setEditItemLoading(false);
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

const sanitizeSearchInput = (input) => {
  if (!input) return ""; 
  return input.trim().replace(/<[^>]+>/g, "").replace(/[^\w\s]/gi, "");
};

const filteredData = dataSource.filter((item) => {
  const sanitizedSearchText = sanitizeSearchInput(searchText);

  const matchesSearch = sanitizedSearchText
    ? Object.values(item).some((val) =>
        String(val).toLowerCase().includes(sanitizedSearchText.toLowerCase())
      )
    : true;

  const matchesCriticalFilter = showCriticalOnly ? isItemCritical(item) : true;

  return (
    (!filterCategory || item.category === filterCategory) &&
    (!filterItemType || item.type === filterItemType) &&
    (!filterDepartment || item.department === filterDepartment) &&
    matchesSearch &&
    matchesCriticalFilter
  );
});

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

  setShowExpiry(false);
  form.setFieldsValue({ type, expiryDate: null });
};

  const showModal = () => setIsModalVisible(true);
  const handleCancel = () => {
    setIsModalVisible(false);
    setItemName("");
    setItemDetails("");
    setItemId("");
    setItemIdMode("automatic");
    form.resetFields();
  };

    const exportToExcel = () => {
    setExportLoading(true);
    try {
      const flattenedData = filteredData.map((item) => ({
        ItemID: item.itemId || "",
        ItemName: item.itemName || "",
        Category: item.category || "",
        Department: item.department || "",
        Quantity: item.quantity?.toString() || "0", 
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
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    } finally {
      setExportLoading(false);
    }
  };

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
  } catch {
    return "";
  }
};

const formatDateTimePH = (d = new Date()) =>
  new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);

const generatePdfFromFilteredData = async () => {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pageWidth  = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();


  const marginX        = 12;
  const headerTopY     = 8;
  const headerBottomY  = 19;
  const contentTop     = headerBottomY + 5;
  const footerTopY     = pageHeight - 10;
  const contentBottom  = footerTopY - 5;
  const totalPagesExp  = "{total_pages_count_string}";

  const printedOn = formatDateTimePH(); 
  let generatedBy = "Unknown User";
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const snap = await getDoc(fsDoc(db, "accounts", user.uid));
      generatedBy = snap.exists() ? (snap.data().name || user.email) : (user.email || "Unknown User");
    }
  } catch (_) {/* noop */}

 const now = new Date();
  const monthCovered = now.toLocaleString("default", { month: "long" });
  const dayCovered = now.getDate();
  const yearCovered = now.getFullYear();
  const asOfString = `As of (${monthCovered} ${dayCovered}, ${yearCovered})`;

  const logoDataURL = await loadImageAsDataURL("/NULS_Favicon.png");

  const drawHeader = () => {
    if (logoDataURL) {
      pdf.addImage(logoDataURL, "PNG", marginX, headerTopY, 10, 10);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text("NULS", marginX + 14, headerTopY + 7);
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.text("INVENTORY LIST", pageWidth / 2, headerTopY + 7, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text(asOfString, pageWidth / 2, headerTopY + 13, { align: "center" });

    const lineY = headerTopY + 16.5; 
    pdf.setDrawColor(180);
    pdf.setLineWidth(0.2);
    pdf.line(marginX, lineY, pageWidth - marginX, lineY);
  };

  const drawFooter = () => {
    const pageCurrent = pdf.internal.getCurrentPageInfo().pageNumber;

    pdf.setDrawColor(200);
    pdf.setLineWidth(0.2);
    pdf.line(marginX, footerTopY, pageWidth - marginX, footerTopY);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(`Printed on: ${printedOn}`, marginX, pageHeight - 5);
    pdf.text(`Page ${pageCurrent} of ${totalPagesExp}`, pageWidth - marginX, pageHeight - 5, { align: "right" });
  };

  drawHeader();

   let y = headerTopY + 25;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Report Details", marginX, y);
  y += 5;

  const meta = [
    ["Generated By:", generatedBy],
    ["Date Generated:", printedOn],
  ];

  autoTable(pdf, {
    startY: y,
    theme: "plain",
    styles: { font: "helvetica", fontSize: 10.5, cellPadding: { top: 1.2, bottom: 1.2, left: 0, right: 0 } },
    margin: { left: marginX, right: marginX },
    body: meta,
    columnStyles: {
      0: { cellWidth: 28, fontStyle: "bold" },
      1: { cellWidth: pageWidth - marginX * 2 - 28 },
    },
    didDrawPage: () => { drawHeader(); drawFooter(); },
  });

  y = pdf.lastAutoTable.finalY + 4;

  const dataArr    = Array.isArray(filteredData) ? filteredData : [];
  const totalItems = dataArr.length;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Summary", marginX, y);
  y += 5;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10.5);
  pdf.text(`Total Items: ${totalItems}`, marginX, y);
  y += 5;

  const catCounts = dataArr.reduce((acc, it) => {
    const cat = (it.category || "Uncategorized").toString();
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const catSummary = Object.entries(catCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cat, count]) => `${cat}: ${count}`)
    .join("   ");

  if (catSummary) {
    pdf.text(catSummary, marginX, y);
    y += 8;
  }

  const head = [["Item ID", "Item Name", "Category", "Department", "Quantity", "Unit", "Condition"]];
  const body = dataArr.map((item) => {
    const conditionText = item?.condition
      ? Object.entries(item.condition).map(([k, v]) => `${k}: ${v}`).join(", ")
      : "";
    return [
      item.itemId || "",
      item.itemName || "",
      item.category || "",
      item.department || "",
      item.quantity?.toString?.() || "0",
      item.unit || "",
      conditionText,
    ];
  });

  autoTable(pdf, {
    startY: y,
    head,
    body,
    margin: { left: marginX, right: marginX, top: contentTop, bottom: pageHeight - contentBottom },
    theme: "grid",
    tableWidth: "auto",
    styles: {
      font: "helvetica",
      fontSize: 9.8,
      lineColor: 200,
      lineWidth: 0.2,
      cellPadding: 3,
      overflow: "linebreak",
      cellWidth: "auto",
      valign: "top",
    },
    headStyles: {
      fillColor: [44, 62, 146],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
      fontSize: 10.5,
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { minCellWidth: 20 },              
      1: { minCellWidth: 40 },             
      2: { minCellWidth: 24 },                 
      3: { minCellWidth: 26 },             
      4: { minCellWidth: 18, halign: "right" },
      5: { minCellWidth: 18 },                 
      6: { minCellWidth: 40 },                 
    },
    pageBreak: "auto",
    rowPageBreak: "auto",
    didDrawPage: () => { drawHeader(); drawFooter(); },
  });

  y = pdf.lastAutoTable.finalY + 14;
  const sigWidth = 70;
  const sigNeeded = 28; 

  if (y + sigNeeded > contentBottom) {
    pdf.addPage();
    drawHeader(); drawFooter();
    y = contentTop;
  }

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.text("Prepared by:", marginX, y);
  pdf.line(marginX, y + 12, marginX + sigWidth, y + 12); // signature line
  pdf.setFontSize(9);
  pdf.text("(Signature over printed name & date)", marginX, y + 17);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);

  if (typeof pdf.putTotalPages === "function") {
    pdf.putTotalPages(totalPagesExp);
  }

  return pdf;
};

const saveAsPdf = async () => {
  setPdfLoading(true);
  try {
    const doc = await generatePdfFromFilteredData();
    const fileName = `Inventory_List_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(fileName);
  } catch (e) {
    console.error("Error saving PDF:", e);
  } finally {
    setPdfLoading(false);
  }
};

const printPdf = async () => {
  setPrintLoading(true);
  try {
    const doc = await generatePdfFromFilteredData();
    doc.autoPrint();
    window.open(doc.output("bloburl"), "_blank");
  } catch (e) {
    console.error("Error printing PDF:", e);
  } finally {
    setPrintLoading(false);
  }
};

const handleAdd = async (values) => {
  setLoading(true);
  try {
    if (!itemName || !itemDetails) {
      alert("Please fill up the form!");
      return;
    }

    const trimmedName = itemName.trim();
    const trimmedDetails = itemDetails.trim();
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");

    const formattedEntryDate  = values.entryDate  ? values.entryDate.format("YYYY-MM-DD") : null;
    const formattedExpiryDate = values.expiryDate ? values.expiryDate.format("YYYY-MM-DD") : null;

    const parseNum = (v, fallback = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    };

    const cat = (values.category || "").toLowerCase();
    const isChemOrReagent = cat === "chemical" || cat === "reagent";

    let qtyBase = 0;                
    let unit = isChemOrReagent ? (values.baseUom || "ml") : "pcs";
    let quantityMode = "direct";    
    let baseUom = unit;

    if (isChemOrReagent) {
      quantityMode =
        values.quantityMode ||
        (values.containerCount || values.containerCapacity ? "container" : "direct");
      baseUom = values.baseUom || "ml";

      if (quantityMode === "direct") {
        const direct = values.quantityDirect ?? values.quantity;
        qtyBase = parseNum(direct);
      } else {
        const count = parseNum(values.containerCount);
        let capacity = parseNum(values.containerCapacity);
        if (!capacity && values.containerKind && values.uomPresets?.[values.containerKind]?.multiplier) {
          capacity = parseNum(values.uomPresets[values.containerKind].multiplier);
        }
        qtyBase = count * capacity;
      }
    } else {
      qtyBase = parseNum(values.quantityDirect ?? values.quantity ?? values.qty);
    }

    if (!Number.isFinite(qtyBase) || qtyBase < 0) {
      alert("Invalid quantity. Please check your inputs.");
      return;
    }

    const rawCritical = parseNum(values.criticalLevel, NaN);
    const criticalLevel = Number.isFinite(rawCritical) && rawCritical >= 0 ? rawCritical : null;
    const isConsumable = (c) => ["chemical", "reagent", "materials"].includes(c);
    const isDurable    = (c) => ["equipment", "glasswares"].includes(c);

    let initialStatus;
    if (qtyBase === 0) {
      initialStatus = isConsumable(cat)
        ? "out of stock"
        : isDurable(cat)
        ? "unavailable"
        : "out of stock";
    } else if (isConsumable(cat)) {
      initialStatus = criticalLevel != null && qtyBase <= criticalLevel
        ? "low stock"
        : "in stock";
    } else if (cat === "equipment" || cat === "glasswares") {
      initialStatus = "available";
    } else if (isDurable(cat)) {
      initialStatus = "in stock";
    } else {
      initialStatus = "in stock";
    }

    const basePayload = {
      itemName: trimmedName,
      itemDetails: trimmedDetails,
      category: values.category,
      department: "Medical Technology",
      entryDate: formattedEntryDate,
      expiryDate: values.type === "Fixed" ? null : formattedExpiryDate,
      userId,
      userName,
      status: initialStatus,
      itemIdMode,
      ...(itemIdMode === "manual" && { manualItemId: itemId }),

      quantity: qtyBase,
      unit,

      labRoom: values.labRoom ?? null,
      shelves: values.shelves ?? null,
      row: values.row ?? null,
      type: values.type ?? null,

      criticalLevel,
      availabilityThreshold: values.availabilityThreshold != null
        ? Number(values.availabilityThreshold)
        : null,
    };

    basePayload.quantityInput = isChemOrReagent
      ? {
          mode: quantityMode,      
          baseUom,
          direct: values.quantityDirect ?? null,
          container: {
            kind: values.containerKind ?? null,
            count: values.containerCount ?? null,
            capacity: values.containerCapacity ?? null,
          },
        }
      : {
          mode: "direct",
          baseUom: "pcs",
          direct: values.quantityDirect ?? values.quantity ?? null,
          container: null,
        };

    const response = await fetch("https://webnuls.onrender.com/add-inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(basePayload),
    });

    let result;
    const text = await response.text();
    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { raw: text };
    }

    if (!response.ok) {
      console.error("Add Inventory failed:", { status: response.status, result });
      const msg =
        result?.error ||
        result?.message ||
        result?.raw ||
        `Server error (${response.status}). Check server logs.`;
      alert(msg);
      return;
    }

    setNotificationMessage(result.message || "Item successfully added!");
    setIsNotificationVisible(true);
    setIsModalVisible(false);
    setItemName("");
    setItemDetails("");
    setItemId("");
    setItemIdMode("automatic");
    form.resetFields();
  } catch (error) {
    console.error("Error calling API:", error);
    alert("An unexpected error occurred while adding the item.");
  } finally {
    setLoading(false);
  }
};

  const editItem = (record, clearFields = true) => {
    editForm.resetFields();
    setEditingItem(record);
    setSelectedCategory(record.category);

    const hasExpiry = record.category === "Chemical" || record.category === "Reagent";
    const isTrackCondition = record.category !== "Chemical" && record.category !== "Reagent";

    setHasExpiryDate(hasExpiry);

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

const updateItem = async (values) => {
  setUpdateStockLoading(true);

  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName") || "User";

  try {
    if (!editingItem || !editingItem.itemId) {
      setNotificationMessage("Failed Editing Item");
      setIsNotificationVisible(true);
      return;
    }

    const parseNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const cat = (editingItem.category || "").toLowerCase();
    const isChemOrReagent = cat === "chemical" || cat === "reagent";

    let qtyBase = 0;
    let quantityMode = "direct";
    let baseUom = isChemOrReagent ? (values.baseUom || "ml") : "pcs";

    if (isChemOrReagent) {
      quantityMode =
        values.quantityMode ||
        (values.containerCount || values.containerCapacity ? "container" : "direct");

      if (quantityMode === "direct") {
        const direct = values.quantityDirect ?? values.quantity;
        qtyBase = parseNum(direct);
      } else {
        const count = parseNum(values.containerCount);
        let capacity = parseNum(values.containerCapacity);
        if (!capacity && values.containerKind && values.uomPresets?.[values.containerKind]?.multiplier) {
          capacity = parseNum(values.uomPresets[values.containerKind].multiplier);
        }
        qtyBase = count * capacity; 
      }
    } else {
      qtyBase = parseNum(values.quantityDirect ?? values.quantity ?? values.qty);
    }

    if (!Number.isFinite(qtyBase) || qtyBase < 0) {
      setNotificationMessage("Invalid Quantity!");
      setIsNotificationVisible(true);
      return;
    }

    const expiryDate =
      isChemOrReagent && values.expiryDate?.isValid?.()
        ? values.expiryDate.format("YYYY-MM-DD")
        : null;

    const isConditionTracked = ["equipment", "glasswares", "materials"].includes(cat);

    const serverPayload = {
      userId,
      userName,
      values: {
        quantity: qtyBase,
        expiryDate,
        editingItem,
        quantityInput: isChemOrReagent
          ? {
              mode: quantityMode,
              baseUom,
              direct: values.quantityDirect ?? null,
              container: {
                kind: values.containerKind ?? null,
                count: values.containerCount ?? null,
                capacity: values.containerCapacity ?? null,
              },
            }
          : {
              mode: "direct",
              baseUom: "pcs",
              direct: values.quantityDirect ?? values.quantity ?? null,
              container: null,
            },
      },
    };

    const response = await axios.post(
      "https://webnuls.onrender.com/update-inventory-item",
      serverPayload
    );

    if (response.status !== 200) {
      setNotificationMessage("Failed to update Item!");
      setIsNotificationVisible(true);
      return;
    }

    let updatedItem = { ...editingItem, ...(expiryDate && { expiryDate }) };

    if (isConditionTracked) {
      try {
        const inventoryQuery = query(
          collection(db, "inventory"),
          where("itemId", "==", editingItem.itemId)
        );
        const inventorySnapshot = await getDocs(inventoryQuery);

        if (!inventorySnapshot.empty) {
          const inventoryDoc = inventorySnapshot.docs[0];
          const currentData = inventoryDoc.data();
          updatedItem = {
            ...updatedItem,
            quantity: currentData.quantity,
            condition: currentData.condition,
          };
        } else {
          const prevQty = Number(editingItem.quantity) || 0;
          updatedItem.quantity = prevQty + qtyBase;
          const currentCondition =
            editingItem.condition || { Good: 0, Defect: 0, Damage: 0, Lost: 0 };
          updatedItem.condition = {
            ...currentCondition,
            Good: (currentCondition.Good || 0) + qtyBase,
          };
        }
      } catch (err) {
        console.error("Error fetching updated data:", err);
        const prevQty = Number(editingItem.quantity) || 0;
        updatedItem.quantity = prevQty + qtyBase;
        const currentCondition =
          editingItem.condition || { Good: 0, Defect: 0, Damage: 0, Lost: 0 };
        updatedItem.condition = {
          ...currentCondition,
          Good: (currentCondition.Good || 0) + qtyBase,
        };
      }
    } else {
      const prevQty = Number(editingItem.quantity) || 0;
      updatedItem.quantity = prevQty + qtyBase;
    }

    setDataSource((prev) =>
      prev.map((it) => (it.itemId === editingItem.itemId ? updatedItem : it))
    );

    setNotificationMessage("Item updated successfully!");
    setIsNotificationVisible(true);

    setIsEditModalVisible(false);
    setIsRowModalVisible(false);
    setEditingItem(null);
    form.resetFields();
  } catch (err) {
    console.error("Backend update failed:", err);
    setNotificationMessage("Failed to update Item!");
    setIsNotificationVisible(true);
  } finally {
    setUpdateStockLoading(false);
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

  const downloadQRCode = (record) => {
    if (!record.qrCode) {
      console.error('No QR code available for this item');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 300;
    canvas.height = 300;

    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    document.body.appendChild(tempDiv);

    const QRCode = require('qrcode.react').QRCodeCanvas;
    const qrElement = React.createElement(QRCode, {
      value: record.qrCode,
      size: 300,
      level: 'M'
    });

    const root = ReactDOM.createRoot(tempDiv);
    root.render(qrElement);

    setTimeout(() => {
      const qrCanvas = tempDiv.querySelector('canvas');
      if (qrCanvas) {
        ctx.drawImage(qrCanvas, 0, 0, 300, 300);
        
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `QRCode_${record.itemName || record.itemId}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 'image/png');
      }

      document.body.removeChild(tempDiv);
    }, 100);
  };

  const handleDelete = (record) => {
    setItemToDelete(record);
    setDeleteModalVisible(true);
    setIsRowModalVisible(false)
  };

  const handleViewQRCodes = async (record) => {
    setQrCodesLoading(true);
    try {
      const response = await fetch(`https://webnuls.onrender.com/get-item-qr-codes/${record.itemId}`);
      const data = await response.json();
      
      if (response.ok) {
        setSelectedParentItem(data.parentItem);
        setSelectedItemQRCodes(data.qrCodes);
        setQrCodesModalVisible(true);
      } else {
        alert(data.error || 'Failed to fetch QR codes');
      }
    } catch (error) {
      console.error('Error fetching QR codes:', error);
      alert('Failed to fetch QR codes');
    } finally {
      setQrCodesLoading(false);
    }
  };

  const handleEditCondition = (qrCode) => {
    setEditingQRCode(qrCode.id);
    setEditingCondition(qrCode.condition);
  };

  const handleCancelEdit = () => {
    setEditingQRCode(null);
    setEditingCondition(null);
  };

  const handleSaveCondition = async (qrCode) => {
    if (!editingCondition) {
      alert('Please select a condition');
      return;
    }

    setUpdatingCondition(true);
    try {
      const response = await fetch('https://webnuls.onrender.com/update-qr-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedParentItem.itemId,
          qrCodeId: qrCode.id,
          condition: editingCondition,
          userId: userId,
          userName: userName,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSelectedItemQRCodes(prev => 
          prev.map(item => 
            item.id === qrCode.id 
              ? { ...item, condition: editingCondition }
              : item
          )
        );
        
        if (data.updatedCondition && selectedRow) {
          setSelectedRow(prev => ({
            ...prev,
            condition: data.updatedCondition
          }));
          
          setDataSource(prev => 
            prev.map(item => 
              item.itemId === selectedParentItem.itemId 
                ? { ...item, condition: data.updatedCondition }
                : item
            )
          );
        }
        
        setEditingQRCode(null);
        setEditingCondition(null);
        alert('Condition updated successfully!');
      } else {
        alert(data.error || 'Failed to update condition');
      }
    } catch (error) {
      console.error('Error updating condition:', error);
      alert('Failed to update condition');
    } finally {
      setUpdatingCondition(false);
    }
  };  

  const columns = [
    { title: "Item ID", dataIndex: "itemId", key: "itemId", },
    { title: "Item Name", dataIndex: "itemName", key: "itemName", 
      sorter: (a, b) => a.itemName.localeCompare(b.itemName),
      sortDirections: ['ascend', 'descend'],
      defaultSortOrder: 'ascend', 
      width: 200
    },
      { title: "Item Description", dataIndex: "itemDetails", key: "itemDetails", width: 200 },
    { title: "Category", dataIndex: "category", key: "category", 

    },

    {
      title: "Inventory Balance",
      dataIndex: "quantity",
      key: "quantity",
    },
    { 
      title: "Status", 
      dataIndex: "status", 
      key: "status",
      render: (text, record) => {
        const displayStatus = getDisplayStatus(text, record.quantity, record.category);
        return displayStatus ? displayStatus.toUpperCase() : displayStatus;
      }
    },   
  ];

  const disabledDate = (current) => {
    return current && current < dayjs().startOf("day");
  };

  const disabledExpiryDate = (current) => {
    const entryDate = form.getFieldValue("entryDate");
    if (!entryDate) {
      return current && current < dayjs().startOf("day");
    }
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
      <Layout style={{paddingTop: 0,}}>
        <Content className="content inventory-container" style={{paddingTop: 0, paddingBottom: 150}}>
    
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
      loading={pdfLoading}
      disabled={exportLoading || printLoading}
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
      loading={exportLoading}
      disabled={pdfLoading || printLoading}
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
      loading={printLoading}
      disabled={exportLoading || pdfLoading}
    />
  </FloatButton.Group>
          </div>
            )
          }



          <div className="inventory-header">
           <div className="inventory-filter-section">
          <div className="filter-header-inventory">
            <FilterOutlined className="filter-icon" />
            <span className="filter-title" style={{background: '#e9f5f9', padding: 10, borderRadius: 5}}>Filter & Search</span>
          </div>


  <Input.Search
    placeholder='Search Items'
    className="search-bar"
    allowClear
    onInput={(e) => {
      const sanitized = sanitizeInput(e.target.value);
      e.target.value = sanitized;
      setSearchText(sanitized);
    }}
  />

  <Select
    allowClear
    showSearch
    placeholder="Filter by Category"
    className="filter-select"
    onChange={(value) => setFilterCategory(value)}
    filterOption={(input, option) =>
      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
    }
  >
    <Option value="Chemical">Chemical</Option>
    <Option value="Reagent">Reagent</Option>
    <Option value="Materials">Materials</Option>
    <Option value="Equipment">Equipment</Option>
    <Option value="Glasswares">Glasswares</Option>
  </Select>

  <Select
    allowClear
    showSearch
    placeholder="Filter by Item Type"
    className="filter-select"
    onChange={(value) => setFilterItemType(value)}
    filterOption={(input, option) =>
      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
    }
  >
    <Option value="Fixed">Fixed</Option>
    <Option value="Consumable">Consumable</Option>
  </Select>

  <Button
    className={`critical-filter-button ${showCriticalOnly ? 'active' : ''}`}
    onClick={() => setShowCriticalOnly(!showCriticalOnly)}
    icon={<FilterOutlined />}
    type={showCriticalOnly ? 'primary' : 'default'}
  >
    {showCriticalOnly ? 'Show All Items' : 'Show Critical Only'}
  </Button>

  <Button
    className="reset-filters-button"
    onClick={() => {
      setFilterCategory(null);
      setFilterItemType(null);
      setSearchText('');
      setShowCriticalOnly(false);
    }}
  >
    Reset Filters
  </Button>

</div>
  
          </div> 

        <div className="main-table-wrapper">
          <Table
            dataSource={filteredData}
            columns={columns}
            rowKey={(record) => record.itemId}
            bordered
            pagination={false}
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
                className: isItemCritical(record) ? 'critical-item-row' : '',
              };
            }}
          />
          </div>

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
          initialValues={{
    quantityMode: "direct",
    baseUom: ["Chemical", "Reagent"].includes(form.getFieldValue("category")) ? "ml" : "pcs",
    type: "Consumable",             // if you want a default
    entryDate: dayjs(),             // DatePicker controlled initial
    manualCriticalOverride: false,
  }}
      >
        <h3 style={{marginBottom: 25}}>Item Details</h3>

        <div style={{ border: '1px solid #ececec', borderTopWidth: 0, borderRightWidth: 0, borderLeftWidth: 0, marginBottom: 25}}>
        <Row gutter={16} style={{marginBottom: 20}}>
          <Col xs={24} md={8}>
            <Form.Item
              name="item Name"
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

        <h3 style={{marginBottom: 25}}>Item ID Configuration</h3>
        <div style={{ border: '1px solid #ececec', borderTopWidth: 0, borderRightWidth: 0, borderLeftWidth: 0, marginBottom: 25}}>
        <Row gutter={16} style={{marginBottom: 20}}>
          <Col xs={24} md={12}>
            <Form.Item
              name="itemIdMode"
              label="Item ID Generation"
              rules={[{ required: true, message: "Please select Item ID mode!" }]}
            >
              <Radio.Group 
                value={itemIdMode} 
                onChange={(e) => setItemIdMode(e.target.value)}
                className="add-input"
              >
                <Radio value="automatic">Automatic Generation</Radio>
                <Radio value="manual">Manual Entry</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          
          {itemIdMode === "manual" && (
            <Col xs={24} md={12}>
              <Form.Item
                name="manualItemId"
                label="Manual Item ID"
                rules={[
                  { required: true, message: "Please enter Item ID!" },
                  { min: 3, message: "Item ID must be at least 3 characters!" },
                  { max: 20, message: "Item ID must not exceed 20 characters!" },
                  {
                    pattern: /^[A-Z0-9]+$/,
                    message: "Item ID must contain only uppercase letters and numbers!"
                  }
                ]}
                tooltip="Enter a unique Item ID (uppercase letters and numbers only)"
              >
                <Input
                  className="add-input"
                  placeholder="Enter Item ID (e.g., CHEM01, EQP05)"
                  value={itemId}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                    setItemId(value);
                  }}
                  onKeyDown={(e) => {
                    const allowedKeys = ["Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete"];
                    const isAlphanumeric = /^[A-Z0-9]$/.test(e.key);
                    if (!isAlphanumeric && !allowedKeys.includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </Form.Item>
            </Col>
          )}
        </Row>
        </div>

         <Form.Item noStyle shouldUpdate={(p, c) => p.category !== c.category}>
    {({ getFieldValue, setFieldsValue }) => {
      const cat = getFieldValue("category");
      const chemLike = ["Chemical", "Reagent"].includes(cat);

      const curMode = getFieldValue("quantityMode");
      const curUom  = getFieldValue("baseUom");

      if (chemLike) {
        if (!curUom || !["ml", "g"].includes(curUom)) {
          setFieldsValue({ baseUom: "ml" });
        }
        if (!curMode) {
          setFieldsValue({ quantityMode: "direct" });
        }
      } else {
        const needsReset =
          curMode !== "direct" ||
          curUom !== "pcs" ||
          !!getFieldValue("containerKind") ||
          !!getFieldValue("containerCount") ||
          !!getFieldValue("containerCapacity");

        if (needsReset) {
          setFieldsValue({
            quantityMode: "direct",
            baseUom: "pcs",
            containerKind: undefined,
            containerCount: undefined,
            containerCapacity: undefined,
          });
        }
      }
      return null; // renders nothing
    }}
  </Form.Item>
          
        <h3 style={{ marginBottom: 25 }}>Inventory Information</h3>

{/* Show different UI depending on category */}
<Form.Item noStyle shouldUpdate={(p, c) => p.category !== c.category}>
  {({ getFieldValue, setFieldsValue }) => {
    const cat = getFieldValue("category");
    const chemLike = ["Chemical", "Reagent"].includes(cat);

    return (
      <>
        <Row gutter={16}>
          {/* Quantity Input Mode — only visible for Chemical/Reagent */}
          {chemLike ? (
            <Col xs={24} md={8}>
              <Form.Item
                name="quantityMode"
                label="Quantity Input"
                rules={[{ required: true, message: "Please choose a quantity input mode!" }]}
              >
                <Radio.Group className="add-input">
                  <Radio value="direct">Direct (base units)</Radio>
                  <Radio value="container">By Container</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          ) : null}

          {/* Base Unit selector — only visible for Chemical/Reagent (ml/g) */}
          {chemLike ? (
            <Col xs={24} md={8}>
              <Form.Item
                name="baseUom"
                label="Base Unit"
                rules={[{ required: true, message: "Please select the base unit!" }]}
              >
                <Select
                  className="add-input"
                  placeholder="Select unit"
                  options={[
                    { value: "ml", label: "ml" },
                    { value: "g", label: "g" },
                  ]}
                />
              </Form.Item>
            </Col>
          ) : null}

          {/* DIRECT MODE (chem-like) */}
          {chemLike ? (
            <Col xs={24} md={8}>
              <Form.Item noStyle shouldUpdate={(p, c) => p.quantityMode !== c.quantityMode || p.baseUom !== c.baseUom}>
                {({ getFieldValue }) =>
                  (getFieldValue("quantityMode") || "direct") === "direct" ? (
                    <Form.Item
                      name="quantityDirect"
                      label="Quantity (in base unit)"
                      rules={[
                        { required: true, message: "Please enter quantity!" },
                        {
                          validator: (_, v) => {
                            if (v === undefined || v === null || v === "") return Promise.reject("Required");
                            const n = Number(v);
                            return Number.isFinite(n) && n >= 0
                              ? Promise.resolve()
                              : Promise.reject("Must be a number ≥ 0");
                          },
                        },
                      ]}
                    >
                      <Input
                        className="add-input"
                        inputMode="decimal"
                        placeholder="e.g., 1000"
                        onInput={(e) => (e.target.value = e.target.value.replace(/[^\d.]/g, ""))}
                        addonAfter={getFieldValue("baseUom") || "ml"}
                      />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>
            </Col>
          ) : null}

          {/* DIRECT MODE (non-chem) — simple pcs integer, always shown for non-chem */}
          {!chemLike ? (
            <Col xs={24} md={8}>
              <Form.Item
                name="quantityDirect"
                label="Quantity (pcs)"
                rules={[
                  { required: true, message: "Please enter quantity!" },
                  {
                    validator: (_, v) => {
                      const n = Number(v);
                      return Number.isInteger(n) && n >= 0
                        ? Promise.resolve()
                        : Promise.reject("Must be an integer ≥ 0");
                    },
                  },
                ]}
              >
                <Input
                  className="add-input"
                  inputMode="numeric"
                  placeholder="e.g., 25"
                  onInput={(e) => (e.target.value = e.target.value.replace(/\D/g, ""))}
                  addonAfter="pcs"
                />
              </Form.Item>
            </Col>
          ) : null}
        </Row>

        {/* CONTAINER MODE — visible ONLY when Chemical/Reagent AND quantityMode === container */}
        {chemLike ? (
          <Form.Item noStyle shouldUpdate={(p, c) => p.quantityMode !== c.quantityMode || p.baseUom !== c.baseUom}>
            {({ getFieldValue }) =>
              (getFieldValue("quantityMode") || "direct") === "container" ? (
                <>
                  <Row gutter={16}>
                    <Col xs={24} md={8}>
                      <Form.Item
                        name="containerKind"
                        label="Container"
                        rules={[{ required: true, message: "Please choose a container type!" }]}
                      >
                        <Select
                          className="add-input"
                          placeholder="Select"
                          options={[
                            { value: "bottle", label: "Bottle" },
                            { value: "pack", label: "Pack" },
                            { value: "custom", label: "Custom" },
                          ]}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                      <Form.Item
                        name="containerCount"
                        label="Number of Containers"
                        rules={[
                          { required: true, message: "Please enter number of containers!" },
                          {
                            validator: (_, v) => {
                              const n = Number(v);
                              return Number.isInteger(n) && n >= 0
                                ? Promise.resolve()
                                : Promise.reject("Must be an integer ≥ 0");
                            },
                          },
                        ]}
                      >
                        <Input
                          className="add-input"
                          inputMode="numeric"
                          placeholder="e.g., 10"
                          onInput={(e) => (e.target.value = e.target.value.replace(/\D/g, ""))}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                      <Form.Item noStyle shouldUpdate={(p, c) => p.baseUom !== c.baseUom}>
                        {({ getFieldValue }) => (
                          <Form.Item
                            name="containerCapacity"
                            label={`Capacity per Container (${getFieldValue("baseUom") || "ml"})`}
                            rules={[
                              { required: true, message: "Please enter capacity per container!" },
                              {
                                validator: (_, v) => {
                                  const n = Number(v);
                                  return Number.isFinite(n) && n >= 0
                                    ? Promise.resolve()
                                    : Promise.reject("Must be a number ≥ 0");
                                },
                              },
                            ]}
                          >
                            <Input
                              className="add-input"
                              inputMode="decimal"
                              placeholder="e.g., 100"
                              onInput={(e) => (e.target.value = e.target.value.replace(/[^\d.]/g, ""))}
                              addonAfter={getFieldValue("baseUom") || "ml"}
                            />
                          </Form.Item>
                        )}
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* Live preview */}
                  <Form.Item
                    noStyle
                    shouldUpdate={(p, c) =>
                      p.containerCount !== c.containerCount ||
                      p.containerCapacity !== c.containerCapacity ||
                      p.baseUom !== c.baseUom
                    }
                  >
                    {({ getFieldValue }) => {
                      const count = Number(getFieldValue("containerCount") || 0);
                      const cap = Number(getFieldValue("containerCapacity") || 0);
                      const uom = getFieldValue("baseUom") || "ml";
                      const total = Number.isFinite(count * cap) ? count * cap : 0;
                      return (
                        <div
                          style={{
                            marginTop: -8,
                            marginBottom: 16,
                            padding: "10px 12px",
                            border: "1px dashed #d9d9d9",
                            borderRadius: 8,
                            background: "#fafafa",
                            fontSize: 13,
                          }}
                        >
                          <b>Quantity Preview:</b>{" "}
                          {count && cap ? `${count} × ${cap} ${uom} = ` : ""}
                          <b>{total}</b> {uom}
                        </div>
                      );
                    }}
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>
        ) : null}
      </>
    );
  }}
</Form.Item>


{/* ---- Rest of your section (Entry/Expiry, Critical/Availability) ---- */}
<Row gutter={16}>
  <Col xs={24} md={8}>
    <Form.Item name="entryDate" label="Date of Entry">
      <DatePicker
        className="add-input"
        format="YYYY-MM-DD"
        style={{ width: "100%" }}
        initialValue={dayjs()}
        disabled
      />
    </Form.Item>
  </Col>

  {["Chemical", "Reagent"].includes(selectedCategory) && (
    <>
      <Col xs={24} md={8}>
        <Form.Item label="Does this item expire?">
          <Radio.Group onChange={(e) => setShowExpiry(e.target.value)} value={showExpiry}>
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
          <Button type="primary" htmlType="submit" loading={loading}>
            Add to Inventory
          </Button>
        </Form.Item>
      </Form>
      </Spin>
    </Modal>
{/* babaguhin */}

          <Modal
            title="Edit Item Details"
            visible={isFullEditModalVisible}
            onCancel={() => setIsFullEditModalVisible(false)}
            onOk={() => fullEditForm.submit()}
            confirmLoading={editItemLoading}
            width={800}
            zIndex={1030}
          >
            <Form form={fullEditForm} layout="vertical" onFinish={handleFullUpdate}
              
            onValuesChange={(changedValues, allValues) => {
              if ('condition' in changedValues) {
                // Skip condition validation for Equipment items
                if (editingItem.category === 'Equipment') {
                  return;
                }
                
                const condition = allValues.condition || {};
                const totalCondition =
                  Number(condition.Good || 0) +
                  Number(condition.Defect || 0) +
                  Number(condition.Damage || 0) +
                  Number(condition.Lost || 0);

                const originalQuantity = editingItem.quantity || 0;

                if (totalCondition !== originalQuantity) {
                  fullEditForm.setFields([
                    {
                      name: ['condition', 'Good'],
                      errors: ['Total of all conditions must equal original quantity: ' + originalQuantity],
                    },
                    {
                      name: ['condition', 'Defect'],
                      errors: [''],
                    },
                    {
                      name: ['condition', 'Damage'],
                      errors: [''],
                    },
                    {
                      name: ['condition', 'Lost'],
                      errors: [''],
                    },
                  ]);
                } else {
                  fullEditForm.setFields([
                    { name: ['condition', 'Good'], errors: [] },
                    { name: ['condition', 'Defect'], errors: [] },
                    { name: ['condition', 'Damage'], errors: [] },
                    { name: ['condition', 'Lost'], errors: [] },
                  ]);
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

            </Row>

            <Row gutter={16}>
              <Col span={12}>             
                    {/* ---- Critical / Availability (auto-adapts to category) ---- */}
                    <Form.Item noStyle shouldUpdate={(prev, cur) => prev.category !== cur.category || prev.manualCriticalOverride !== cur.manualCriticalOverride}>
                      {({ getFieldValue }) => {
                        const cat = getFieldValue("category") || selectedCategory;
                        const isConsumable = ["Chemical", "Reagent", "Materials"].includes(cat);
                        const isDurable    = ["Equipment", "Glasswares"].includes(cat);
                        const manual = getFieldValue("manualCriticalOverride");

                        return (
                          <>
                            {isConsumable && (
                              <>
                                <Form.Item
                                  name="manualCriticalOverride"
                                  valuePropName="checked"
                                  style={{ marginBottom: 0 }}
                                >
                                  <Checkbox>Set manual <b>Critical Level</b> (override auto)</Checkbox>
                                </Form.Item>

                                {manual && (
                                  <Form.Item
                                    name="criticalLevel"
                                    label="Critical Level"
                                    rules={[
                                      { required: true, message: "Enter Critical Level or untick override" },
                                      {
                                        validator: (_, value) => {
                                          const n = parseInt(value, 10);
                                          if (!value || isNaN(n) || n < 1) {
                                            return Promise.reject("Value must be a number greater than 0");
                                          }
                                          return Promise.resolve();
                                        },
                                      },
                                    ]}
                                  >
                                    <Input
                                      placeholder="Enter Critical Stock"
                                      onInput={(e) => (e.target.value = e.target.value.replace(/\D/g, ""))}
                                    />
                                  </Form.Item>
                                )}
                              </>
                            )}

                            {isDurable && (
                              <Form.Item
                                name="availabilityThreshold"
                                label="Availability Threshold"
                                tooltip="Alert when available quantity drops below this number (durables only)."
                              >
                                <Input
                                  placeholder="e.g., 2 or 3"
                                  onInput={(e) => (e.target.value = e.target.value.replace(/\D/g, ""))}
                                />
                              </Form.Item>
                            )}
                          </>
                        );
                      }}
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
             {(selectedCategory === "Glasswares" || selectedCategory ==="Materials") && (
      <Row gutter={16}>
                    <Form.Item
                      label="Good"
                      name={['condition', 'Good']}
                      rules={[
                        { required: true, message: "Please enter Good quantity" },
                        { type: 'number', message: 'Must be a number' },
                      ]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                      label="Defect"
                      name={['condition', 'Defect']}
                      rules={[
                        { required: true, message: "Please enter Defect quantity" },
                        { type: 'number', message: 'Must be a number' },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        style={{ width: '100%' }}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Damage"
                      name={['condition', 'Damage']}
                      rules={[
                        { required: true, message: "Please enter Damage quantity" },
                        { type: 'number', message: 'Must be a number' },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        style={{ width: '100%' }}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Lost"
                      name={['condition', 'Lost']}
                      rules={[
                        { required: true, message: "Please enter Lost quantity" },
                        { type: 'number', message: 'Must be a number' },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        style={{ width: '100%' }}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                      />
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
            width={window.innerWidth <= 768 ? '95%' : '70%'}
            style={{ top: window.innerWidth <= 768 ? 10 : 50 }}
          
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
                      </tbody>
                    </table>
                    </div>

                    <div className="table-wrapper">
                    <table className="horizontal-table">
                      <tbody>
                        <tr>
                          <th>Status</th>
                          <td>{(() => {
                            const displayStatus = getDisplayStatus(selectedRow.status, selectedRow.quantity, selectedRow.category);
                            return displayStatus ? displayStatus.toUpperCase() : displayStatus;
                          })()}</td>
                        </tr>

                        <tr>
                          <th>Department</th>
                          <td>{selectedRow.department}</td>
                        </tr>

                        <tr>
                          {["Chemical", "Reagent", "Materials"].includes(selectedRow.category) ? (
                            <tr>
                              <th>Critical Level</th>
                              <td>{selectedRow.criticalLevel ?? "Auto (not set)"}</td>
                            </tr>
                          ) : ["Equipment", "Glasswares"].includes(selectedRow.category) ? (
                            <tr>
                              <th>Availability Threshold</th>
                              <td>{selectedRow.availabilityThreshold ?? "—"}</td>
                            </tr>
                          ) : null}

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
                      <QRCodeSVG value={selectedRow.qrCode} size={window.innerWidth <= 768 ? 180 : 250} />
                    ) : (
                      <p>No QR Code Available</p>
                    )}

                    <div
                      style={{
                        marginTop: 24,
                        textAlign: 'center',
                        gap: 10,
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column', // Stack vertically
                        alignItems: 'center',
                      }}
                    >
                      {/* Top Row: Archive + Update Stock */}
                      <div style={{ display: 'flex', gap: 10 }}>
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
                          loading={updateStockLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRow(selectedRow);
                            editItem(selectedRow, true);
                          }}
                        >
                          Add Quantity
                        </Button>
                      </div>

                      {/* Bottom Row: Edit Item + Request Restock */}
                      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                        <Button type="primary" loading={editItemLoading} onClick={() => openFullEditModal(selectedRow)}>
                          Edit Item
                        </Button>

                        {userRole !== 'admin' && userRole !== 'dean' && (
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            loading={restockRequestLoading}
                            onClick={() => handleRestockRequest(selectedRow)}
                          >
                            Request Restock
                          </Button>
                        )}
                      </div>

                      {/* QR Code Actions Row */}
                      {selectedRow.qrCode && (
                        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                          <Button
                            type="default"
                            icon={<DownloadOutlined />}
                            onClick={() => downloadQRCode(selectedRow)}
                          >
                            Download QR Code
                          </Button>
                          
                          {/* VIEW QR button for equipment items */}
                          {selectedRow.category === "Equipment" && (
                            <Button
                              type="primary"
                              icon={<FileTextOutlined />}
                              onClick={() => handleViewQRCodes(selectedRow)}
                              style={{ backgroundColor: '#0f3c4c', borderColor: '#0f3c4c' }}
                            >
                              VIEW QR
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                  </div>

                  <div>
                    <h2>Stock Log</h2>

                  <StockLog 
                    inventoryDocId={selectedRow?.docId} 
                    editingItem={selectedRow}
                    setDataSource={setDataSource}
                  />
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

          {/* QR Codes Modal for Equipment Items */}
          <Modal
            title="Equipment QR Codes"
            open={qrCodesModalVisible}
            onCancel={() => setQrCodesModalVisible(false)}
            footer={null}
            width={800}
            zIndex={1025}
          >
            {selectedParentItem && (
              <div>
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                  <h3 style={{ margin: 0, color: '#0f3c4c' }}>{selectedParentItem.itemName}</h3>
                  <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                    <strong>Item ID:</strong> {selectedParentItem.itemId} | 
                    <strong> Description:</strong> {selectedParentItem.itemDetails} | 
                    <strong> Quantity:</strong> {selectedParentItem.quantity}
                  </p>
                </div>
                
                <Spin spinning={qrCodesLoading} tip="Loading QR codes...">
                  <Table
                    dataSource={selectedItemQRCodes}
                    columns={[
                      {
                        title: 'Item ID',
                        dataIndex: 'individualItemId',
                        key: 'individualItemId',
                        width: 120,
                      },
                      {
                        title: 'Name',
                        dataIndex: 'itemName',
                        key: 'itemName',
                        width: 200,
                      },
                      {
                        title: 'Condition',
                        dataIndex: 'condition',
                        key: 'condition',
                        width: 150,
                        render: (condition, record) => {
                          if (editingQRCode === record.id) {
                            return (
                              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                <Select
                                  value={editingCondition}
                                  onChange={setEditingCondition}
                                  style={{ width: '80px' }}
                                  size="small"
                                >
                                  <Option value="Good">Good</Option>
                                  <Option value="Defect">Defect</Option>
                                  <Option value="Damage">Damage</Option>
                                  <Option value="Lost">Lost</Option>
                                </Select>
                                <Button
                                  type="primary"
                                  size="small"
                                  loading={updatingCondition}
                                  onClick={() => handleSaveCondition(record)}
                                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                >
                                  ✓
                                </Button>
                                <Button
                                  size="small"
                                  onClick={handleCancelEdit}
                                >
                                  ✕
                                </Button>
                              </div>
                            );
                          }
                          
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span style={{
                                color: condition === 'Good' ? '#52c41a' : 
                                       condition === 'Defect' ? '#faad14' : 
                                       condition === 'Damage' ? '#ff4d4f' : '#666'
                              }}>
                                {condition}
                              </span>
                              <Button
                                type="link"
                                size="small"
                                onClick={() => handleEditCondition(record)}
                                style={{ padding: '0 4px', minWidth: 'auto' }}
                              >
                                <EditOutlined />
                              </Button>
                            </div>
                          );
                        },
                      },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        key: 'status',
                        width: 100,
                        render: (status) => (
                          <span style={{
                            color: status === 'Available' ? '#52c41a' : 
                                   status === 'In Use' ? '#1890ff' : '#666'
                          }}>
                            {status}
                          </span>
                        ),
                      },
                      {
                        title: 'QR Code',
                        key: 'qrCode',
                        width: 120,
                        render: (text, record) => (
                          <div style={{ textAlign: 'center' }}>
                            <QRCodeCanvas 
                              value={record.qrCode} 
                              size={60} 
                              style={{ marginBottom: '5px' }}
                            />
                            <div style={{ fontSize: '10px', color: '#666' }}>
                              {record.individualItemId}
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: 'Actions',
                        key: 'actions',
                        width: 100,
                        render: (text, record) => (
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => {
                              // Create a new window for printing
                              const printWindow = window.open('', '_blank');
                              printWindow.document.write(`
                                <html>
                                  <head>
                                    <title>Print QR Code - ${record.itemName}</title>
                                    <style>
                                      body { 
                                        font-family: Arial, sans-serif; 
                                        text-align: center; 
                                        padding: 20px;
                                      }
                                      .qr-container {
                                        border: 2px solid #0f3c4c;
                                        padding: 20px;
                                        display: inline-block;
                                        margin: 20px;
                                      }
                                      .item-info {
                                        margin-bottom: 15px;
                                      }
                                      .item-name {
                                        font-size: 18px;
                                        font-weight: bold;
                                        color: #0f3c4c;
                                        margin-bottom: 5px;
                                      }
                                      .item-id {
                                        font-size: 14px;
                                        color: #666;
                                        margin-bottom: 10px;
                                      }
                                      .condition {
                                        font-size: 12px;
                                        color: #666;
                                      }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="qr-container">
                                      <div class="item-info">
                                        <div class="item-name">${record.itemName}</div>
                                        <div class="item-id">ID: ${record.individualItemId}</div>
                                        <div class="condition">Condition: ${record.condition}</div>
                                      </div>
                                      <div id="qr-code"></div>
                                    </div>
                                    <script src="https://unpkg.com/qrcode@1.5.3/build/qrcode.min.js"></script>
                                    <script>
                                      QRCode.toCanvas(document.getElementById('qr-code'), '${record.qrCode}', {
                                        width: 150,
                                        margin: 2,
                                        color: {
                                          dark: '#0f3c4c',
                                          light: '#FFFFFF'
                                        }
                                      }, function (error) {
                                        if (error) console.error(error);
                                        setTimeout(() => window.print(), 500);
                                      });
                                    </script>
                                  </body>
                                </html>
                              `);
                              printWindow.document.close();
                            }}
                            style={{ backgroundColor: '#0f3c4c', borderColor: '#0f3c4c' }}
                          >
                            Print
                          </Button>
                        ),
                      },
                    ]}
                    rowKey="individualItemId"
                    pagination={{ pageSize: 5 }}
                    size="small"
                  />
                </Spin>
              </div>
            )}
          </Modal>

         <Modal
  title="Update Inventory Balance"
  open={isEditModalVisible}
  onCancel={() => setIsEditModalVisible(false)}
  onOk={() => editForm.submit()}
  confirmLoading={updateStockLoading}
  zIndex={1020}
>
  <Spin spinning={updateStockLoading} tip="Updating inventory...">
    <Form
      layout="vertical"
      form={editForm}
      onFinish={updateItem}
      initialValues={{
        quantityMode: "direct",
        baseUom: ["Chemical", "Reagent"].includes(editingItem?.category) ? "ml" : "pcs",
        expiryDate: editingItem?.expiryDate ? dayjs(editingItem.expiryDate) : undefined,
      }}
      onValuesChange={(changed, all) => {
        const chemLike = ["Chemical", "Reagent"].includes(editingItem?.category);
        const parseNum = (v) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : 0;
        };

        // compute total (base units)
        let total = 0;
        if (chemLike) {
          const mode = all.quantityMode || "direct";
          total =
            mode === "direct"
              ? parseNum(all.quantityDirect ?? all.quantity) // legacy fallback
              : parseNum(all.containerCount) * parseNum(all.containerCapacity);
        } else {
          total = parseNum(all.quantityDirect ?? all.quantity); // pcs only
        }

        // auto-set condition for tracked categories
        const conditionTracked = ["Equipment", "Glasswares", "Materials"].includes(
          editingItem?.category
        );
        if (conditionTracked) {
          setTimeout(() => {
            editForm.setFieldsValue({
              condition: { Good: total, Defect: 0, Damage: 0, Lost: 0 },
            });
          }, 0);
        }
      }}
    >
      {/* ---------- Quantity UI ---------- */}
      <Row gutter={16}>
        {/* Quantity Mode: only for Chemical/Reagent */}
        {["Chemical", "Reagent"].includes(editingItem?.category) && (
          <Col span={12}>
            <Form.Item
              name="quantityMode"
              label="Quantity Input"
              rules={[{ required: true, message: "Please choose a quantity input mode" }]}
            >
              <Radio.Group>
                <Radio value="direct">Direct (base units)</Radio>
                <Radio value="container">By Container</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        )}

        {/* Base Unit: only selectable for Chemical/Reagent; non-chem is implicitly pcs */}
        {["Chemical", "Reagent"].includes(editingItem?.category) && (
          <Col span={12}>
            <Form.Item
              name="baseUom"
              label="Base Unit"
              rules={[{ required: true, message: "Please select the base unit" }]}
            >
              <Select
                options={[
                  { value: "ml", label: "ml" },
                  { value: "g", label: "g" },
                ]}
              />
            </Form.Item>
          </Col>
        )}
      </Row>

      {/* DIRECT MODE for Chemical/Reagent */}
      {["Chemical", "Reagent"].includes(editingItem?.category) && (
        <Form.Item noStyle shouldUpdate={(p, c) => p.quantityMode !== c.quantityMode || p.baseUom !== c.baseUom}>
          {({ getFieldValue }) =>
            (getFieldValue("quantityMode") || "direct") === "direct" ? (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="quantityDirect"
                    label="Quantity (in base unit)"
                    rules={[
                      { required: true, message: "Please enter quantity" },
                      {
                        validator: (_, v) => {
                          if (v === undefined || v === null || v === "") return Promise.reject("Required");
                          const n = Number(v);
                          return Number.isFinite(n) && n >= 0
                            ? Promise.resolve()
                            : Promise.reject("Must be a number ≥ 0");
                        },
                      },
                    ]}
                  >
                    <Input
                      inputMode="decimal"
                      placeholder="e.g., 1000"
                      onInput={(e) => (e.target.value = e.target.value.replace(/[^\d.]/g, ""))}
                      addonAfter={getFieldValue("baseUom") || "ml"}
                      disabled={updateStockLoading}
                    />
                  </Form.Item>
                </Col>
              </Row>
            ) : null
          }
        </Form.Item>
      )}

      {/* DIRECT MODE for NON-Chemical/Reagent (simple pcs) */}
      {!["Chemical", "Reagent"].includes(editingItem?.category) && (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="quantityDirect"
              label="Quantity (pcs)"
              rules={[
                { required: true, message: "Please enter quantity" },
                {
                  validator: (_, v) => {
                    const n = Number(v);
                    return Number.isInteger(n) && n >= 0
                      ? Promise.resolve()
                      : Promise.reject("Must be an integer ≥ 0");
                  },
                },
              ]}
            >
              <Input
                inputMode="numeric"
                placeholder="e.g., 25"
                onInput={(e) => (e.target.value = e.target.value.replace(/\D/g, ""))}
                addonAfter="pcs"
                disabled={updateStockLoading}
              />
            </Form.Item>
          </Col>
        </Row>
      )}

      {/* CONTAINER MODE — ONLY for Chemical/Reagent */}
      {["Chemical", "Reagent"].includes(editingItem?.category) && (
        <Form.Item noStyle shouldUpdate={(p, c) => p.quantityMode !== c.quantityMode || p.baseUom !== c.baseUom}>
          {({ getFieldValue }) =>
            (getFieldValue("quantityMode") || "direct") === "container" ? (
              <>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="containerKind"
                      label="Container"
                      rules={[{ required: true, message: "Please choose container type" }]}
                    >
                      <Select
                        options={[
                          { value: "bottle", label: "Bottle" },
                          { value: "pack", label: "Pack" },
                          { value: "custom", label: "Custom" },
                        ]}
                        disabled={updateStockLoading}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="containerCount"
                      label="Number of Containers"
                      rules={[
                        { required: true, message: "Please enter number of containers" },
                        {
                          validator: (_, v) => {
                            const n = Number(v);
                            return Number.isInteger(n) && n >= 0
                              ? Promise.resolve()
                              : Promise.reject("Must be an integer ≥ 0");
                          },
                        },
                      ]}
                    >
                      <Input
                        inputMode="numeric"
                        placeholder="e.g., 10"
                        onInput={(e) => (e.target.value = e.target.value.replace(/\D/g, ""))}
                        disabled={updateStockLoading}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item noStyle shouldUpdate={(p, c) => p.baseUom !== c.baseUom}>
                      {({ getFieldValue }) => (
                        <Form.Item
                          name="containerCapacity"
                          label={`Capacity per Container (${getFieldValue("baseUom") || "ml"})`}
                          rules={[
                            { required: true, message: "Please enter capacity per container" },
                            {
                              validator: (_, v) => {
                                const n = Number(v);
                                return Number.isFinite(n) && n >= 0
                                  ? Promise.resolve()
                                  : Promise.reject("Must be a number ≥ 0");
                              },
                            },
                          ]}
                        >
                          <Input
                            inputMode="decimal"
                            placeholder="e.g., 100"
                            onInput={(e) => (e.target.value = e.target.value.replace(/[^\d.]/g, ""))}
                            addonAfter={getFieldValue("baseUom") || "ml"}
                            disabled={updateStockLoading}
                          />
                        </Form.Item>
                      )}
                    </Form.Item>
                  </Col>
                </Row>

                {/* Live preview */}
                <Form.Item
                  noStyle
                  shouldUpdate={(p, c) =>
                    p.containerCount !== c.containerCount ||
                    p.containerCapacity !== c.containerCapacity ||
                    p.baseUom !== c.baseUom
                  }
                >
                  {({ getFieldValue }) => {
                    const count = Number(getFieldValue("containerCount") || 0);
                    const cap = Number(getFieldValue("containerCapacity") || 0);
                    const uom = getFieldValue("baseUom") || "ml";
                    const total = Number.isFinite(count * cap) ? count * cap : 0;
                    return (
                      <div
                        style={{
                          marginTop: -8,
                          marginBottom: 16,
                          padding: "10px 12px",
                          border: "1px dashed #d9d9d9",
                          borderRadius: 8,
                          background: "#fafafa",
                          fontSize: 13,
                        }}
                      >
                        <b>Quantity Preview:</b>{" "}
                        {count && cap ? `${count} × ${cap} ${uom} = ` : ""}
                        <b>{total}</b> {uom}
                      </div>
                    );
                  }}
                </Form.Item>
              </>
            ) : null
          }
        </Form.Item>
      )}

      {/* ---------- Expiry (if applicable) ---------- */}
      {hasExpiryDate && (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Expiry Date"
              name="expiryDate"
              rules={[{ required: true, message: "Please select expiry date" }]}
            >
              <DatePicker 
                style={{ width: "100%" }} 
                disabled={updateStockLoading}
                disabledDate={(current) => {
                  // Disable previous dates and years
                  return current && current < dayjs().startOf('day');
                }}
                showToday={false}
              />
            </Form.Item>
          </Col>
        </Row>
      )}

      {/* ---------- Condition (auto-filled for tracked categories) ---------- */}
      {["Equipment", "Glasswares", "Materials"].includes(editingItem?.category) && (
        <>
          <h4 style={{ marginTop: 8 }}>Condition (auto from quantity)</h4>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name={["condition", "Good"]} label="Good">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name={["condition", "Defect"]} label="Defect">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name={["condition", "Damage"]} label="Damage">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name={["condition", "Lost"]} label="Lost">
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}
    </Form>
  </Spin>
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
              <Form.Item
                name="quantityNeeded"
                label="Quantity Needed"
                rules={[
                  { required: true, message: "Please enter the quantity to be restocked" },
                  {
                    validator: (_, value) =>
                      Number.isInteger(value) && value > 0
                        ? Promise.resolve()
                        : Promise.reject("Quantity must be a whole number greater than 0"),
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={1}
                  placeholder="Enter quantity to restock"
                  step={1}
                  controls={true}
                  parser={(value) => value.replace(/\D/g, '')}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault(); 
                    }
                  }}
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
                <Button type="primary" htmlType="submit" loading={restockRequestLoading}>
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


