import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout, Card, Col, Row, List, Typography, Tag, Tabs, Spin } from "antd";
import { db } from "../backend/firebase/FirebaseConfig";
import { collectionGroup, query, where, getDocs, onSnapshot, collection, orderBy } from "firebase/firestore";
import SuccessModal from "./customs/SuccessModal";
import TodayRequestModal from "./customs/TodayRequestModal";
import CustomCalendar from "./customs/CustomCalendar";
import "./styles/Dashboard.css";
import AIInventoryPieChart from "./customs/AIInventoryPieChart";
import MostRequestedItemsBarChart from "./customs/MostRequestedItemsBarChart";
import { MdErrorOutline, MdAccessTime, MdCalendarToday } from "react-icons/md";

import {
  UnorderedListOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import MonthlyRequestTrendLineChart from "./customs/MonthlyRequestTrendLineChart";

const { Content } = Layout;
const { Text } = Typography;

const isConsumable = (cat) =>
  ["chemical", "reagent", "materials"].includes((cat || "").toLowerCase());
const isDurable = (cat) =>
  ["equipment", "glasswares"].includes((cat || "").toLowerCase());

const Dashboard = () => {
  const [showModal, setShowModal] = useState(false);
  const [showTodayRequestModal, setShowTodayRequestModal] = useState(false);
  const [todayRequestCount, setTodayRequestCount] = useState(0);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [borrowCatalogCount, setBorrowCatalogCount] = useState(0);
  const [approvalRequestCount, setApprovalRequestCount] = useState(0);
  const [historyData, setHistoryData] = useState(0);
  const [dataSource, setDataSource] = useState(0);

  const [predictedSales, setPredictedSales] = useState(null);
  const [productTrends, setProductTrends] = useState([]);

  const [selectedDate, setSelectedDate] = useState(null);
  const [eventsOnSelectedDate, setEventsOnSelectedDate] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);

  // expiry / condition / critical lists
  const [expiredItems, setExpiredItems] = useState([]);
  const [expiringSoonItems, setExpiringSoonItems] = useState([]);
  const [damagedItems, setDamagedItems] = useState([]);
  const [criticalStockList, setCriticalStockList] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();

  const userRole = localStorage.getItem("userPosition");

  const expiryColumns = [
    { title: "Item Name", dataIndex: "itemName", key: "itemName" },
    { title: "Category", dataIndex: "category", key: "category" },
    { title: "Expiry Date", dataIndex: "expiryDate", key: "expiryDate" },
  ];

const getCriticalOrLowAvailabilityItems = (inventoryItems = []) => {
  if (!Array.isArray(inventoryItems) || inventoryItems.length === 0) return [];

  return inventoryItems
    .filter((item) => {
      const category = (item.category || "").toLowerCase();
      const quantity = Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 0;

      if (isConsumable(category)) {
        const cl = Number.isFinite(Number(item.criticalLevel)) ? Number(item.criticalLevel) : 0;
        // Consumable flagged if at/below CL
        return quantity <= cl;
      }

      if (isDurable(category)) {
        const at = Number.isFinite(Number(item.availabilityThreshold))
          ? Number(item.availabilityThreshold)
          : 0;
        // Durable flagged if threshold set and quantity falls below
        return at > 0 && quantity < at;
      }

      return false;
    })
    .map((item) => {
      const category = (item.category || "").toLowerCase();
      const quantity = Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 0;
      const cl = Number.isFinite(Number(item.criticalLevel)) ? Number(item.criticalLevel) : 0;
      const at = Number.isFinite(Number(item.availabilityThreshold))
        ? Number(item.availabilityThreshold)
        : 0;

      // Optional: project runout date if available in item
      let runoutInfo = null;
      if (isConsumable(category) && item.runoutDate) {
        const rd = new Date(item.runoutDate);
        if (!isNaN(rd)) {
          runoutInfo = {
            runoutDate: rd.toISOString(),
            atRisk: item.atRisk === true, // preserve flag from backend/useEffect
          };
        }
      }

      return {
        ...item,
        _kind: isConsumable(category) ? "consumable" : "durable",
        _quantity: quantity,
        _criticalLevel: cl,
        _availabilityThreshold: at,
        ...(runoutInfo ? runoutInfo : {}),
      };
    });
};

  useEffect(() => {
    const fetchExpiryItems = async () => {
      const inventoryRef = collection(db, "inventory");
      const inventorySnapshot = await getDocs(inventoryRef);

      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      
      // 1 week from today
      const oneWeekFromNow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 7
      );

      const expired = [];
      const expiringSoon = [];

      for (const itemDoc of inventorySnapshot.docs) {
        const data = itemDoc.data();
        const stockLogRef = collection(db, "inventory", itemDoc.id, "stockLog");
        const stockSnapshot = await getDocs(stockLogRef);

        stockSnapshot.forEach((logDoc) => {
          const logData = logDoc.data();
          const expiryRaw = logData.expiryDate;
          
          if (!expiryRaw) return;

          const expiryDate =
            typeof expiryRaw === "string"
              ? new Date(expiryRaw)
              : expiryRaw?.toDate?.() || new Date(expiryRaw);
          
          if (isNaN(expiryDate.getTime())) return;

          const daysDifference = Math.ceil((expiryDate - todayStart) / (1000 * 60 * 60 * 24));
          
          const itemInfo = {
            key: `${itemDoc.id}_${logDoc.id}`,
            itemName: data.itemName,
            expiryDate: expiryDate.toDateString(),
            category: data.category || "N/A",
            daysUntilExpiry: daysDifference,
            daysOverdue: daysDifference < 0 ? Math.abs(daysDifference) : 0
          };

          // Items that have already expired (before today)
          if (expiryDate < todayStart) {
            expired.push(itemInfo);
          } 
          // Items expiring within 1 week from today
          else if (expiryDate <= oneWeekFromNow) {
            expiringSoon.push(itemInfo);
          }
        });
      }

      setExpiredItems(expired);
      setExpiringSoonItems(expiringSoon);
    };

    fetchExpiryItems();
  }, []);

  useEffect(() => {
    const inventoryRef = collection(db, "inventory");
    const unsubscribe = onSnapshot(inventoryRef, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const criticalItems = getCriticalOrLowAvailabilityItems(items);
      setCriticalStockList(criticalItems);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchExpiryItems = async () => {
      const inventoryRef = collection(db, "inventory");
      const inventorySnapshot = await getDocs(inventoryRef);

      const now = new Date();
      const tomorrowStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );

      const EXPIRY_SOON_DAYS = 7;
      const expired = [];
      const expiringSoon = [];

      for (const itemDoc of inventorySnapshot.docs) {
        const data = itemDoc.data();
        const stockLogRef = collection(db, "inventory", itemDoc.id, "stockLog");
        const stockSnapshot = await getDocs(stockLogRef);

        stockSnapshot.forEach((logDoc) => {
          const logData = logDoc.data();
          const expiryRaw = logData.expiryDate;
          if (!expiryRaw) return;

          const expiryDate =
            typeof expiryRaw === "string"
              ? new Date(expiryRaw)
              : expiryRaw?.toDate?.() || new Date(expiryRaw);
          if (isNaN(expiryDate.getTime())) return;

          const diffTime = expiryDate - tomorrowStart;
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          const itemInfo = {
            key: `${itemDoc.id}_${logDoc.id}`,
            itemName: data.itemName,
            expiryDate: expiryDate.toDateString(),
            category: data.category || "N/A",
          };

          if (diffDays < 0) {
            expired.push(itemInfo);
          } else if (diffDays <= EXPIRY_SOON_DAYS) {
            expiringSoon.push(itemInfo);
          }
        });
      }

      setExpiredItems(expired);
      setExpiringSoonItems(expiringSoon);
    };

    fetchExpiryItems();
  }, []);

  useEffect(() => {
    const fetchDamagedOrDefectiveItems = async () => {
      const inventoryRef = collection(db, "inventory");
      const snapshot = await getDocs(inventoryRef);
      const problematicItems = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const condition = data.condition;
        if (!condition) return;

        const damage = condition.Damage || 0;
        const defect = condition.Defect || 0;

        if (damage > 0 || defect > 0) {
          problematicItems.push({
            key: doc.id,
            itemName: data.itemName,
            itemId: data.itemId,
            department: data.department,
            labRoom: data.labRoom,
            damageQty: damage,
            defectQty: defect,
            totalQty: data.quantity || 0,
          });
        }
      });

      setDamagedItems(problematicItems);
    };

    fetchDamagedOrDefectiveItems();
  }, []);

  useEffect(() => {
    const fetchGeminiAnalysis = async () => {
      try {
        const response = await fetch("https://webnuls.onrender.com/predict-inventory-trends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const result = await response.json();
        const geminiText = result?.analysis || "No analysis received";
        setPredictedSales(cleanMarkdown(geminiText));
      } catch (error) {
        console.error("Error fetching Gemini analysis:", error);
        setPredictedSales("Failed to load analysis.");
      }
    };

    fetchGeminiAnalysis();
  }, []);

  useEffect(() => {
    const q = collectionGroup(db, "userrequests");
    const unsubscribe = onSnapshot(q, (qs) => setPendingRequestCount(qs.size));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = collectionGroup(db, "borrowcatalog");
    const unsubscribe = onSnapshot(q, (qs) => setBorrowCatalogCount(qs.size));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = collectionGroup(db, "approvalrequestcollection");
    const unsubscribe = onSnapshot(q, (qs) => setApprovalRequestCount(qs.size));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = collectionGroup(db, "requestlog");
    const unsubscribe = onSnapshot(q, (qs) => setHistoryData(qs.size));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = collectionGroup(db, "inventory");
    const unsubscribe = onSnapshot(q, (qs) => setDataSource(qs.size));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (location.state?.loginSuccess === true) setShowModal(true);
  }, [location.state]);

  useEffect(() => {
    if (location.state?.loginSuccess) {
      sessionStorage.setItem("isLoggedIn", "true");
      setShowModal(true);
      const newState = { ...location.state };
      delete newState.loginSuccess;
      navigate(location.pathname, { replace: true, state: newState });
    }
  }, [location.state, navigate]);

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
        
        // Show modal if user has requests required today and just logged in
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
    const fetchRecentProducts = async () => {
      const productsRef = collection(db, "allactivitylog");
      const qy = query(productsRef, orderBy("timestamp", "desc"));
      const qs = await getDocs(qy);
      const recentItems = [];
      qs.forEach((doc) => {
        const data = doc.data();
        if (data.action && (
            data.action.includes("Added new item") || 
            data.action.includes("Archived item") || 
            data.action.includes("Updated item"))) {
          recentItems.push(data);
        }
      });
      setRecentProducts(recentItems);
    };
    fetchRecentProducts();
  }, []);

  const handleDateSelect = async (date) => {
    setSelectedDate(date);
    const selectedDateStr = date.format("YYYY-MM-DD");

    const qy = query(collection(db, "borrowcatalog"), where("dateRequired", "==", selectedDateStr));
    const querySnapshot = await getDocs(qy);

    const items = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (Array.isArray(data.requestList)) {
        data.requestList.forEach((item) => {
          items.push({
            id: doc.id,
            title: item.itemName || "Request",
            description: `Quantity: ${item.quantity} | Status: ${item.status}`,
          });
        });
      }
    });
    setEventsOnSelectedDate(items);
  };

  const closeModal = () => setShowModal(false);
  const closeTodayRequestModal = () => setShowTodayRequestModal(false);

  const summaryCards = [
    { title: "Pending Requests", count: pendingRequestCount, color: "#2596be", icon: <FileTextOutlined /> },
    { 
      title: userRole?.toLowerCase() === "admin" ? "Request Log" : "Borrow Catalog", 
      count: userRole?.toLowerCase() === "admin" ? historyData : borrowCatalogCount, 
      color: "#165a72", 
      icon: <ShoppingOutlined /> 
    },
    { title: "Critical Stocks", count: criticalStockList.length, color: "#0b2d39", icon: <UnorderedListOutlined /> },
    { title: "Expiring Items", count: expiringSoonItems.length, color: "#000000", icon: <DatabaseOutlined /> },
  ];

  const adminSummaryCards = [
    { title: "Pending Requests", count: pendingRequestCount, color: "#2596be", icon: <FileTextOutlined /> },
    { title: "Approval Request", count: approvalRequestCount, color: "#165a72", icon: <DatabaseOutlined /> },
    { title: "Critical Stocks", count: criticalStockList.length, color: "#0b2d39", icon: <UnorderedListOutlined /> },
    { title: "Expiring Items", count: expiringSoonItems.length, color: "#000000", icon: <DatabaseOutlined /> },
  ];

  const displayCards = userRole?.toLowerCase() === "admin" ? adminSummaryCards : summaryCards;

  const lightenColor = (hex, percent) => {
    const amt = Math.round(2.55 * (percent * 100));
    const num = parseInt(hex.replace("#", ""), 16);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      "#" +
      (
        0x1000000 +
        (R > 255 ? 255 : R) * 0x10000 +
        (G > 255 ? 255 : G) * 0x100 +
        (B > 255 ? 255 : B)
      )
        .toString(16)
        .slice(1)
    );
  };

  const [hoveredIndex, setHoveredIndex] = useState(null);

  const cleanMarkdown = (text = "") =>
    text.replace(/```[\s\S]*?```/g, "").trim();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout>
        {/* SUMMARY CARDS */}
        <div className="summary-card-whole">
          {displayCards.map((card, index) => {
            const isHovered = index === hoveredIndex;
            const bgColor = isHovered ? lightenColor(card.color, 0.1) : card.color;
            return (
              <div
                key={card.title}
                className="summary-card-content"
                style={{ backgroundColor: bgColor }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => {
                  if (card.title === "Pending Requests") navigate("/main/pending-request");
                  if (card.title === "Borrow Catalog") navigate("/main/borrow-catalog");
                  if (card.title === "Approval Request") {
                    navigate("/main/approval-request");
                  }
                  if (card.title === "Expiring Items") navigate("/main/inventory");
                  if (card.title === "Critical Stocks") navigate("/main/inventory?filter=critical");
                }}
              >
                <div className="summary-card-icon">{card.icon}</div>
                <div className="card-content-layout">
                  <h3 className="card-count">{card.count}</h3>
                  <div className="card-title">
                    <p>{card.title}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Content className="content">
          <Tabs defaultActiveKey="1" style={{ marginTop: 20 }}>
            <Tabs.TabPane tab="Analytics Center" key="1">
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={16}>
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: "24px" }}>
                        <AIInventoryPieChart />
                      </div>

                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                          <Card
                            title={
                              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 18 }}>
                                <MdErrorOutline size={25} color="#e11d48" />
                                Critical / Low Availability
                              </div>
                            }
                            className={`critical-card ${criticalStockList.length <= 5 ? "auto-height" : ""}`}
                            style={{ 
                              height: "100%", 
                              width: "100%",
                              minHeight: criticalStockList.length === 0 ? "200px" : "auto"
                            }}
                          >
                            <List
                              dataSource={criticalStockList}
                              locale={{ emptyText: "No issues" }}
                              style={{ 
                                maxHeight: criticalStockList.length > 5 ? "375px" : "none",
                                overflowY: criticalStockList.length > 5 ? "auto" : "visible",
                                minHeight: criticalStockList.length === 0 ? "120px" : "auto"
                              }}
                              renderItem={(item) => {
                                const isCon = item._kind === "consumable";
                                const isDur = item._kind === "durable";
                                const qty = Math.round(item._quantity || 0);
                                const cl = Math.round(item._criticalLevel || 0);
                                const at = Math.round(item._availabilityThreshold || 0);

                                return (
                                  <List.Item>
                                    <List.Item.Meta
                                      title={<Text strong>{item.itemName} (ID: {item.itemId})</Text>}
                                      description={
                                        <>
                                          {isCon && (
                                            <Text style={{ color: "red" }}>
                                              Remaining: {qty} / Critical: {cl}
                                            </Text>
                                          )}
                                          {isDur && (
                                            <Text style={{ color: "red" }}>
                                              Available: {qty} / Threshold: {at}
                                            </Text>
                                          )}
                                          <Tag color="red" style={{ marginLeft: 8 }}>
                                            {isCon ? "Low Stock" : "Low Availability"}
                                          </Tag>
                                        </>
                                      }
                                    />
                                  </List.Item>
                                );
                              }}
                            />
                          </Card>
                        </Col>

                        <Col xs={24} md={12}>
                          <MonthlyRequestTrendLineChart />
                        </Col>

                          <Col xs={24} md={8}>
                <Card 
                  title={
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 18 }}>
                      <MdAccessTime size={25} color="#f59e0b" />
                      Expiring Within 1 Week
                    </div>
                  }
                  className="dashboard-expiry-card"
                  style={{ height: "100%", width: "100%" }}
                >
                  <List
                    dataSource={expiringSoonItems}
                    locale={{ emptyText: "No items expiring soon" }}
                    style={{ 
                      height: "375px",
                      overflowY: "auto",
                      overflowX: "hidden",
                      padding: "8px 0"
                    }}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          title={<Text strong>{item.itemName}</Text>}
                          description={
                            <>
                              <Text style={{ color: "#f59e0b" }}>
                                Expires: {item.expiryDate}
                              </Text>
                              <br />
                              <Text type="secondary">
                                Category: {item.category} • {item.daysUntilExpiry} days left
                              </Text>
                              <Tag color="orange" style={{ marginLeft: 8 }}>
                                Expiring Soon
                              </Tag>
                            </>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
                      </Row>
                    </div>
                  </Col>

                  <Col xs={24} lg={8}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
                      <MostRequestedItemsBarChart />

                      <Card
                        title={
                          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 18 }}>
                            <MdAccessTime size={25} color="#4b5563" />
                            Inventory History
                          </div>
                        }
                        className="sales-card-header"
                        style={{ marginBottom: 0, width: "100%" }}
                      >
                        <div style={{ height: "234px", overflowY: "auto" }}>
                          <List
                            dataSource={recentProducts}
                            renderItem={(item) => {
                              const ts =
                                item?.timestamp?.toDate?.() ||
                                (item?.timestamp ? new Date(item.timestamp) : null);
                              const tsStr = ts && !isNaN(ts) ? ts.toLocaleDateString() : "";
                              return (
                                <List.Item>
                                  <div
                                    style={{
                                      width: "100%",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                    }}
                                  >
                                    <div>
                                      <div style={{ fontWeight: 500 }}>{item.action}</div>
                                      <small style={{ color: "#888" }}>{item.userName}</small>
                                    </div>
                                    <div style={{ color: "#555", fontSize: "0.9em" }}>{tsStr}</div>
                                  </div>
                                </List.Item>
                              );
                            }}
                          />
                        </div>
                      </Card>
                    </div>
                  </Col>
                </Row>
              </div>
            </Tabs.TabPane>

            <Tabs.TabPane tab="Calendar" key="2">
              <Row gutter={[24, 24]}>
                <Col xs={24}>
                  <div className="calendar-box">
                    <div className="analytics-center-wrapper" style={{ display: "flex", alignItems: "center", gap: 15 }}>
                      <MdCalendarToday size={30} color="#4b5563" style={{ marginLeft: 10 }} />
                      <h1 style={{ fontWeight: "bold", fontSize: "26px", margin: "20px", marginLeft: 0 }}>Calendar</h1>
                    </div>
                    <div style={{ minHeight: 500, width: "100%" }}>
                      <CustomCalendar onSelectDate={handleDateSelect} className="calendar" />
                    </div>
                  </div>
                </Col>
              </Row>
            </Tabs.TabPane>

          </Tabs>
        </Content>

        <SuccessModal isVisible={showModal} onClose={closeModal} />
        <TodayRequestModal 
          isVisible={showTodayRequestModal} 
          onClose={closeTodayRequestModal} 
          requestCount={todayRequestCount}
        />
      </Layout>
    </Layout>
  );
};

export default Dashboard;
