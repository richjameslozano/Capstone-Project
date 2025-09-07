

// // VERSION 2
// import React, { useState, useEffect } from "react";
// import { useNavigate,  useLocation } from "react-router-dom";
// import { Layout, Card, Col, Row, Table, List, Modal,Typography, Tag, Tabs, Spin } from "antd";
// import { db } from "../backend/firebase/FirebaseConfig"; 
// import { collectionGroup, query, where, getDocs, onSnapshot, collection, orderBy, limit } from "firebase/firestore";
// import SuccessModal from "./customs/SuccessModal";
// import CustomCalendar from "./customs/CustomCalendar";
// import PoliciesModal from "./Policies";
// import "./styles/Dashboard.css";
// import ReactMarkdown from 'react-markdown';
// import AIInventoryPieChart from "./customs/AIInventoryPieChart";
// import MostRequestedItemsBarChart from "./customs/MostRequestedItemsBarChart";
// import { MdErrorOutline, MdAccessTime, MdCalendarToday } from 'react-icons/md';

// import {
//   UserOutlined,
//   DashboardOutlined,
//   UnorderedListOutlined,
//   FileTextOutlined,
//   AppstoreOutlined,
//   HistoryOutlined,  
//   LogoutOutlined,
//   FileDoneOutlined,
//   SnippetsOutlined,
//   ClockCircleOutlined,
//   SearchOutlined,
//   ShoppingCartOutlined,
//   DollarCircleOutlined,
//   RollbackOutlined,
//   ShoppingOutlined,
//   DatabaseOutlined,
//   HomeOutlined,
//   UserSwitchOutlined,
//   IdcardOutlined,
// } from '@ant-design/icons';
// import { Bar } from "react-chartjs-2";
// import {
//   Chart as ChartJS, CategoryScale, LinearScale,
//   BarElement, Title, Tooltip, Legend
// } from "chart.js";
// import MonthlyRequestTrendLineChart from "./customs/MonthlyRequestTrendLineChart";


// const { Content } = Layout;
// ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
// const { Text } = Typography;
 
//  const Dashboard = () => {
//    const [showModal, setShowModal] = useState(false);
//    const [pendingRequestCount, setPendingRequestCount] = useState(0);
//    const [borrowCatalogCount, setBorrowCAtalogCount] = useState(0);
//    const [historyData, setHistoryData] = useState(0);
//    const [dataSource, setDataSource] = useState(0);
//    const [predictedSales, setPredictedSales] = useState(null);  
//    const [productTrends, setProductTrends] = useState([]);  
//    const [showPolicies, setShowPolicies] = useState(false); 
//    const [selectedDate, setSelectedDate] = useState(null);
//    const [eventsOnSelectedDate, setEventsOnSelectedDate] = useState([]);
//    const [recentProducts, setRecentProducts] = useState([]);
//    const location = useLocation();
//    const navigate = useNavigate();
//    //expiry list
//    const [expiredItems, setExpiredItems] = useState([]);
//    const [expiringSoonItems, setExpiringSoonItems] = useState([]);
//    const [damagedItems, setDamagedItems] = useState([]);
//    const [criticalStockList, setCriticalStockList] = useState([]);
//    const [lostItems, setLostItems] = useState([]);
//    const [geminiChartData, setGeminiChartData] = useState([]);
//    const [loadingGemini, setLoadingGemini] = useState(true);

//    const expiryColumns = [
//   {
//     title: "Item Name",
//     dataIndex: "itemName",
//     key: "itemName",
//   },
//   {
//     title: "Category",
//     dataIndex: "category",
//     key: "category",
//   },
//   {
//     title: "Expiry Date",
//     dataIndex: "expiryDate",
//     key: "expiryDate",
//   },
// ];

// const criticalColumns = [
//   {
//     title: 'Item ID',
//     dataIndex: 'itemId',
//     key: 'itemId',
//   },
//   {
//     title: 'Item Name',
//     dataIndex: 'itemName',
//     key: 'itemName',
//   },

//   {
//     title: 'Critical Level',
//     dataIndex: 'criticalLevel',
//     key: 'criticalLevel',
//     render: (text) => text ?? 0,
//   },
// ];
// //critical stock
// const getCriticalStockItems = (inventoryItems) => {
//   if (!inventoryItems || inventoryItems.length === 0) return [];

//   return inventoryItems.filter(item => {
//     const criticalLevel = Number(item.criticalLevel) || 0; // fallback to 0 if invalid
//     const quantity = Number(item.quantity) || 0;

//     return quantity <= criticalLevel;
//   });
// };


// // critical stock 
// useEffect(() => {
//   const inventoryRef = collection(db, "inventory");

//   const unsubscribe = onSnapshot(inventoryRef, (snapshot) => {
//     const items = snapshot.docs.map(doc => ({
//       id: doc.id,
//       ...doc.data(),
//     }));

//     const criticalItems = getCriticalStockItems(items);
//     setCriticalStockList(criticalItems);
//   });

//   return () => unsubscribe();
// }, []);


//    //expiry
//     useEffect(() => {
//   const fetchExpiryItems = async () => {
//     const inventoryRef = collection(db, "inventory");
//     const inventorySnapshot = await getDocs(inventoryRef);

//     const now = new Date();
//     const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

//     const EXPIRY_SOON_DAYS = 7;

//     const expired = [];
//     const expiringSoon = [];

//     for (const itemDoc of inventorySnapshot.docs) {
//       const data = itemDoc.data();
//       const stockLogRef = collection(db, "inventory", itemDoc.id, "stockLog");
//       const stockSnapshot = await getDocs(stockLogRef);

//       stockSnapshot.forEach((logDoc) => {
//         const logData = logDoc.data();
//         const expiryRaw = logData.expiryDate;

//         if (!expiryRaw) return;

//         const expiryDate = typeof expiryRaw === "string"
//           ? new Date(expiryRaw)
//           : expiryRaw?.toDate?.() || new Date(expiryRaw);

//         if (isNaN(expiryDate.getTime())) return;

//         const diffTime = expiryDate - tomorrowStart;
//         const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

//         const itemInfo = {
//           key: `${itemDoc.id}_${logDoc.id}`,
//           itemName: data.itemName,
//           expiryDate: expiryDate.toDateString(),
//           category: data.category || "N/A",
//         };

//         if (diffDays < 0) {
//           expired.push(itemInfo);
//         } else if (diffDays <= EXPIRY_SOON_DAYS) {
//           expiringSoon.push(itemInfo);
//         }
//       });
//     }

//     setExpiredItems(expired);
//     setExpiringSoonItems(expiringSoon);
//   };

//   fetchExpiryItems();
// }, []);

//   //for item condition
//   useEffect(() => {
//   const fetchDamagedOrDefectiveItems = async () => {
//     const inventoryRef = collection(db, "inventory");
//     const snapshot = await getDocs(inventoryRef);
//     const problematicItems = [];

//     snapshot.forEach((doc) => {
//       const data = doc.data();
//       const condition = data.condition;
//       if (!condition) return;

//       const damage = condition.Damage || 0;
//       const defect = condition.Defect || 0;
//       const lost = condition.Lost || 0;

//       if (damage > 0 || defect > 0) {
//         problematicItems.push({
//           key: doc.id, // Important for Table/List keys
//           itemName: data.itemName,
//           itemId: data.itemId,
//           department: data.department,
//           labRoom: data.labRoom,
//           damageQty: damage,
//           defectQty: defect,
//           totalQty: data.quantity || 0,
//         });
//       }
//     });

//     setDamagedItems(problematicItems);
//   };

//   fetchDamagedOrDefectiveItems();
// }, []);

//    useEffect(() => {
//       const fetchGeminiAnalysis = async () => {
//         try {
//           const response = await fetch("https://webnuls.onrender.com/gemini", {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//               prompt: "Perform predictive and prescriptive analysis on the inventory from Firestore. Consider quantity, condition, and criticalLevel.",
//             }),
//           });

//           const result = await response.json();
//         const geminiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis received";
//         setPredictedSales(cleanMarkdown(geminiText)); // ✅ Clean it before displaying

//             } catch (error) {
//               console.error("Error fetching Gemini analysis:", error);
//             }
//           };

//           fetchGeminiAnalysis();
//     }, []);

//     useEffect(() => {
//       const fetchGeminiAnalysis = async () => {
//         setLoadingGemini(true); // ⏳ start loading
//         try {
//           const response = await fetch("https://webnuls.onrender.com/predict-inventory-trends", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//           });

//           const result = await response.json();
//           const geminiText = result?.analysis || "No analysis received";
//           setPredictedSales(cleanMarkdown(geminiText));
//         } catch (error) {
//           console.error("Error fetching Gemini analysis:", error);
//           setPredictedSales("Failed to load analysis.");
//         } finally {
//           setLoadingGemini(false); // ✅ done loading
//         }
//       };

//       fetchGeminiAnalysis();
//     }, []);
//     useEffect(() => {
//       const q = collectionGroup(db, "userrequests");
  
//       // Set up the real-time listener
//       const unsubscribe = onSnapshot(q, (querySnapshot) => {
//         setPendingRequestCount(querySnapshot.size);
  
//       }, (error) => {

//       });
  
//       // Cleanup the listener on unmount
//       return () => unsubscribe();
//     }, []);
 
//     useEffect(() => {
//       const q = collectionGroup(db, "borrowcatalog");
  
//       // Set up the real-time listener
//       const unsubscribe = onSnapshot(q, (querySnapshot) => {
//         setBorrowCAtalogCount(querySnapshot.size);
  
//       }, (error) => {

//       });
  
//       // Cleanup the listener on unmount
//       return () => unsubscribe();
//     }, []);
 
//         useEffect(() => {
//       const q = collectionGroup(db, "requestlog");
  
//       // Set up the real-time listener
//       const unsubscribe = onSnapshot(q, (querySnapshot) => {
//         setHistoryData(querySnapshot.size);
  
//       }, (error) => {

//       });
  
//       // Cleanup the listener on unmount
//       return () => unsubscribe();
//     }, []);

//       useEffect(() => {
//       const q = collectionGroup(db, "inventory");
  
//       // Set up the real-time listener
//       const unsubscribe = onSnapshot(q, (querySnapshot) => {
//         setDataSource(querySnapshot.size);
  
//       }, (error) => {

//       });
  
//       // Cleanup the listener on unmount
//       return () => unsubscribe();
//     }, []);

//     useEffect(() => {
//       if (location.state?.loginSuccess === true) {
//         setShowModal(true);
//       }
//     }, [location.state]);
 
//     useEffect(() => {
//       const handleBackButton = (event) => {
//         event.preventDefault();
//         window.history.pushState(null, "", window.location.href);
//       };
  
//       window.history.pushState(null, "", window.location.href);
//       window.addEventListener("popstate", handleBackButton);
  
//       return () => {
//         window.removeEventListener("popstate", handleBackButton);
//       };
//     }, []);
 
//     useEffect(() => {
//       if (location.state?.loginSuccess) {
//         sessionStorage.setItem("isLoggedIn", "true");
//         setShowModal(true);
//         const newState = { ...location.state };
//         delete newState.loginSuccess;
//         navigate(location.pathname, { replace: true, state: newState });
//       }
//     }, [location.state, navigate]);


//     // Fetch AI-based sales predictions and product trends
//     useEffect(() => {
//       fetch('/api/predict-sales')
//         .then((res) => res.json())
//         .then((data) => {
//           const geminiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis received";
//           setPredictedSales(cleanMarkdown(geminiText));
//         });

//       fetch('/api/product-trends')
//         .then((res) => res.json())
//         .then((data) => {
//           setProductTrends(data.trends);
//         });
//     }, []);

//     useEffect(() => {
//       // Query to fetch recent products ordered by 'entryDate' and limit to a certain number (e.g., last 5 products)
//       const fetchRecentProducts = async () => {
//         const productsRef = collection(db, "allactivitylog"); // Assuming "inventory" is the collection name

//         // Query to fetch the most recent products
//         const q = query(
//           productsRef, 
//           orderBy("timestamp", "desc"),  // Order by the entry date in descending order
//         );

//         const querySnapshot = await getDocs(q);
//         const recentItems = [];

//         querySnapshot.forEach((doc) => {
//           recentItems.push(doc.data());
//         });

//         setRecentProducts(recentItems);  // Set the fetched data to the state
//         };

//         fetchRecentProducts();
//     }, []);
 
//    const closeModal = () => {
//     setShowModal(false);        
//     // setShowPolicies(true);      
//    };
  
//   //  const closePolicies = () => {
//   //   setShowPolicies(false);    
//   //  };

//   const handleDateSelect = async (date) => {
//     setSelectedDate(date);
//     const selectedDateStr = date.format("YYYY-MM-DD"); 

//     const q = query(
//       collection(db, "borrowcatalog"),
//       where("dateRequired", "==", selectedDateStr)
//       // Removed the status == "Approved" filter
//     );

//     const querySnapshot = await getDocs(q);
//     const items = [];

//     querySnapshot.forEach((doc) => {
//       const data = doc.data();
//       if (Array.isArray(data.requestList)) {
//         data.requestList.forEach((item) => {
//           items.push({
//             id: doc.id,
//             title: item.itemName || "Request",
//             description: `Quantity: ${item.quantity} | Status: ${item.status}`,
//           });
//         });
//       }
//     });

//     setEventsOnSelectedDate(items);
//   };
 
//    const summaryCards = [
//      { title: "Pending Requests", count: pendingRequestCount, color: "#2596be", icon: <FileTextOutlined/> },
//      { title: "Borrow Catalog", count: borrowCatalogCount, color: "#165a72", icon: <ShoppingOutlined/> },
//      { title: "Inventory", count: dataSource, color: "#0b2d39", icon: <UnorderedListOutlined/> },
//      { title: "Request Log", count: historyData, color: "#000000", icon: <DatabaseOutlined/> },
//    ];

//   const lightenColor = (hex, percent) => {
//     const num = parseInt(hex.replace("#", ""), 16);
//     const amt = Math.round(2.55 * percent * 100);
//     const R = (num >> 16) + amt;
//     const G = ((num >> 8) & 0x00ff) + amt;
//     const B = (num & 0x0000ff) + amt;
//     return (
//       "#" +
//       (
//         0x1000000 +
//         (R > 255 ? 255 : R) * 0x10000 +
//         (G > 255 ? 255 : G) * 0x100 +
//         (B > 255 ? 255 : B)
//       )
//         .toString(16)
//         .slice(1)
//     );
//   };
  
//    const salesColumns = [
//      {
//        title: "#",
//        dataIndex: "key",
//        key: "key",
//      },
//      {
//        title: "Product Name",
//        dataIndex: "name",
//        key: "name",
//      },
//      {
//        title: "Date",
//        dataIndex: "date",
//        key: "date",
//      },
//      {
//        title: "Total Sale",
//        dataIndex: "total",
//        key: "total",
//      },
//    ];
 
//    const [hoveredIndex, setHoveredIndex] = useState(null);

//   // const cleanMarkdown = (markdown) => {
//   //   return markdown.replace(/```[\s\S]*?```/g, '').trim();
//   // };

//   const cleanMarkdown = (text) => {
//     return text
//       .replace(/```[\s\S]*?```/g, '')  // Remove code blocks
//       // .replace(/`+/g, '')              // Remove stray backticks
//       // .replace(/^\s*[\-\•]\s*/gm, '- ') // Normalize bullet points
//       // .trim();
//   };

//    return (
//      <Layout style={{ minHeight: "100vh" }}>
//        <Layout>
//         <div className="summary-card-whole">
//         {summaryCards.map((card, index)=>{
//           const isHovered = index === hoveredIndex;
//           const bgColor = isHovered
//             ? lightenColor(card.color, 0.1)
//             : card.color;
//           return(
//             <div on className="summary-card-content" style={{backgroundColor: bgColor}}
//             onMouseEnter={() => setHoveredIndex(index)}
//             onMouseLeave={() => setHoveredIndex(null)}
//             onClick={() => {
//               if (card.title === "Pending Requests") {
//                 navigate("/main/pending-request"); 
//               }

//               if (card.title === "Borrow Catalog") {
//                 navigate("/main/borrow-catalog"); 
//               }
//               if (card.title === "Request Log") {
//                 navigate("/main/request-log"); 
//               }
//               if (card.title === "Inventory") {
//                 navigate("/main/inventory"); 
//               }
//             }}
//             >
//             <div className="summary-card-icon">{card.icon}</div>
//             <div className="card-content-layout">
//               <h3 className="card-count">{card.count}</h3>
//               <div className="card-title"><p>{card.title}</p></div>
//             </div>
//           </div>
//           )        
//         })}
//         </div>

// <Content className="content">
//   <Tabs defaultActiveKey="1" style={{ marginTop: 20 }}>
//   <Tabs.TabPane tab="Analytics Center" key="1">

// <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
//   {/* === FIRST ROW === */}
//   <Row gutter={16}>
// <Col flex="2">
// <div style={{flex: 1}}>
//   {/* Fixed spacing below Pie Chart */}
//   <div style={{ marginBottom: '24px' }}>
//     <AIInventoryPieChart />
//   </div>

//   <Row gutter={16}>
//     <Col flex="1">
//       <Card
//         title={<div style={{display: 'flex',alignItems: 'center', gap: 12, fontSize: 18}}>
//           <MdErrorOutline size={25} color="#e11d48"/>
//         Critical Stocks</div>
//         }
//         className="critical-card"
//         style={{ height: '100%', width: '100%' }}  // ensure full width
//       >
//         <List
//           dataSource={criticalStockList}
//           locale={{ emptyText: 'No critical stock' }}
//           style={{ maxHeight: 375, overflowY: 'auto' }}
//           renderItem={(item) => {
//             const quantity = Number(item.quantity) || 0;
//             const criticalLevel = Number(item.criticalLevel) || 0;
//             const isBelowCritical = quantity <= criticalLevel;

//             return (
//               <List.Item>
//                 <List.Item.Meta
//                   title={<Text strong>{item.itemName} (ID: {item.itemId})</Text>}
//                   description={
//                     <>
//                       <Text style={{ color: isBelowCritical ? 'red' : 'inherit' }}>
//                         Remaining Stock: {Math.round(quantity)} / Critical Level: {Math.round(criticalLevel)}
//                       </Text>
//                       {isBelowCritical && (
//                         <Tag color="red" style={{ marginLeft: 8 }}>
//                           Low Stock
//                         </Tag>
//                       )}
//                     </>
//                   }
//                 />
//               </List.Item>
//             );
//           }}
//         />
//       </Card>
//     </Col>

//     <Col flex="1">
//     <MonthlyRequestTrendLineChart />

//     </Col>
//   </Row>
//   </div>
// </Col>


// <Col flex="1" xs={24} md={8}>
//   <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%'}}>
//     <MostRequestedItemsBarChart />





//           <Card
//         title={<div style={{display: 'flex',alignItems: 'center', gap: 12, fontSize: 18}}><MdAccessTime size={25} color="#4b5563" />Inventory History</div>}
//         className="sales-card-header"
//         style={{ marginBottom: 0, width: '100%' }}
//       >
//         <div style={{ height: '234px', overflowY: 'auto' }}>
//           <List
//             dataSource={recentProducts}
//             renderItem={(item) => (
//               <List.Item>
//                 <div
//                   style={{
//                     width: "100%",
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                   }}
//                 >
//                   <div>
//                     <div style={{ fontWeight: 500 }}>{item.action}</div>
//                     <small style={{ color: "#888" }}>{item.userName}</small>
//                   </div>
//                   <div style={{ color: "#555", fontSize: "0.9em" }}>
//                     {item.timestamp?.toDate().toLocaleDateString()}
//                   </div>
//                 </div>
//               </List.Item>
//             )}
//           />

          
//         </div>
//       </Card>
//   </div>
// </Col>


//   </Row>
// </div>





//   </Tabs.TabPane>

// <Tabs.TabPane tab="Calendar" key="2">
// <Row gutter={[24, 24]}>
//   <Col xs={24}>
//     <div className="calendar-box">
//           <div className="analytics-center-wrapper" style={{display: 'flex', alignItems: 'center', gap: 15}}>
//             <MdCalendarToday size={30} color="#4b5563" style={{marginLeft: 10}} />
//             <h1 style={{ fontWeight: "bold", fontSize: '26px', margin:'20px', marginLeft: 0}}>
//               Calendar
//             </h1>
//           </div>
//   <div style={{ minHeight: 500, width: '100%'}}>
//     <CustomCalendar onSelectDate={handleDateSelect} className="calendar" />
//   </div>
//     </div>

//   </Col>
// </Row>

// </Tabs.TabPane>

// <Tabs.TabPane tab="Analytics" key="3">

 
//   <Row gutter={[24, 24]} justify="center">
//     <Col xs={24} style={{ width: '100%' }}>
//       <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
//     <Card title="Calendar" style={{ width: '100%', minHeight: 600 }}>
//           <div style={{ minHeight: 500, width: '100%' }}>
//           </div>
//         </Card>
//       </div>
//     </Col>
//   </Row>
// </Tabs.TabPane>x




// </Tabs>
// </Content>

                    
//          <SuccessModal isVisible={showModal} onClose={closeModal} />

//          {/* <PoliciesModal isOpen={showPolicies} onClose={closePolicies} /> */}
        
//        </Layout>
//      </Layout>
//    );
//  };

//  //force push
 
//  export default Dashboard;


// VERSION 2 (UPDATED)
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout, Card, Col, Row, List, Typography, Tag, Tabs } from "antd";
import { db } from "../backend/firebase/FirebaseConfig";
import { collectionGroup, query, where, getDocs, onSnapshot, collection, orderBy } from "firebase/firestore";
import SuccessModal from "./customs/SuccessModal";
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

/* ---------- Helpers: type checks (match inventory logic) ---------- */
const isConsumable = (cat) =>
  ["chemical", "reagent", "materials"].includes((cat || "").toLowerCase());
const isDurable = (cat) =>
  ["equipment", "glasswares"].includes((cat || "").toLowerCase());

/* ---------- Component ---------- */
const Dashboard = () => {
  const [showModal, setShowModal] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [borrowCatalogCount, setBorrowCatalogCount] = useState(0);
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

  /* ---------- Columns (kept minimal; you render with List mostly) ---------- */
  const expiryColumns = [
    { title: "Item Name", dataIndex: "itemName", key: "itemName" },
    { title: "Category", dataIndex: "category", key: "category" },
    { title: "Expiry Date", dataIndex: "expiryDate", key: "expiryDate" },
  ];

  /* ---------- Critical list logic (UPDATED) ---------- */
  const getCriticalOrLowAvailabilityItems = (inventoryItems) => {
    if (!inventoryItems || inventoryItems.length === 0) return [];
    return inventoryItems
      .filter((item) => {
        const quantity = Number(item.quantity) || 0;
        const category = (item.category || "").toLowerCase();

        if (isConsumable(category)) {
          const cl = Number(item.criticalLevel) || 0;
          return quantity <= cl;
        }

        if (isDurable(category)) {
          const at = Number(item.availabilityThreshold) || 0;
          return at > 0 && quantity < at;
        }

        return false;
      })
      .map((item) => {
        const category = (item.category || "").toLowerCase();
        const quantity = Number(item.quantity) || 0;
        const cl = Number(item.criticalLevel) || 0;
        const at = Number(item.availabilityThreshold) || 0;
        return {
          ...item,
          _kind: isConsumable(category) ? "consumable" : "durable",
          _quantity: quantity,
          _criticalLevel: cl,
          _availabilityThreshold: at,
        };
      });
  };

  // Subscribe to inventory and compute critical list
  useEffect(() => {
    const inventoryRef = collection(db, "inventory");
    const unsubscribe = onSnapshot(inventoryRef, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const criticalItems = getCriticalOrLowAvailabilityItems(items);
      setCriticalStockList(criticalItems);
    });
    return () => unsubscribe();
  }, []);

  /* ---------- Expiry (unchanged; could be optimized later) ---------- */
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

  /* ---------- Damaged / Defective (unchanged) ---------- */
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

  /* ---------- “Gemini” analysis (deduped into one effect) ---------- */
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

  /* ---------- Counters (realtime) ---------- */
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
    const q = collectionGroup(db, "requestlog");
    const unsubscribe = onSnapshot(q, (qs) => setHistoryData(qs.size));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = collectionGroup(db, "inventory");
    const unsubscribe = onSnapshot(q, (qs) => setDataSource(qs.size));
    return () => unsubscribe();
  }, []);

  /* ---------- Welcome modal on login ---------- */
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

  /* ---------- Recent activity (inventory history) ---------- */
  useEffect(() => {
    const fetchRecentProducts = async () => {
      const productsRef = collection(db, "allactivitylog");
      const qy = query(productsRef, orderBy("timestamp", "desc"));
      const qs = await getDocs(qy);
      const recentItems = [];
      qs.forEach((doc) => recentItems.push(doc.data()));
      setRecentProducts(recentItems);
    };
    fetchRecentProducts();
  }, []);

  /* ---------- Calendar selection ---------- */
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

  /* ---------- UI helpers ---------- */
  const closeModal = () => setShowModal(false);

  const summaryCards = [
    { title: "Pending Requests", count: pendingRequestCount, color: "#2596be", icon: <FileTextOutlined /> },
    { title: "Borrow Catalog", count: borrowCatalogCount, color: "#165a72", icon: <ShoppingOutlined /> },
    { title: "Inventory", count: dataSource, color: "#0b2d39", icon: <UnorderedListOutlined /> },
    { title: "Request Log", count: historyData, color: "#000000", icon: <DatabaseOutlined /> },
  ];

  const lightenColor = (hex, percent) => {
    // percent: 0.0 to 0.3 recommended
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
          {summaryCards.map((card, index) => {
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
                  if (card.title === "Request Log") navigate("/main/request-log");
                  if (card.title === "Inventory") navigate("/main/inventory");
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
                            className="critical-card"
                            style={{ height: "100%", width: "100%" }}
                          >
                            <List
                              dataSource={criticalStockList}
                              locale={{ emptyText: "No issues" }}
                              style={{ maxHeight: 375, overflowY: "auto" }}
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

            {/* <Tabs.TabPane tab="Analytics" key="3">
              <Row gutter={[24, 24]} justify="center">
                <Col xs={24} style={{ width: "100%" }}>
                  <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                    <Card title="Calendar" style={{ width: "100%", minHeight: 600 }}>
                      <div style={{ minHeight: 500, width: "100%" }} />
                    </Card>
                  </div>
                </Col>
              </Row>
            </Tabs.TabPane> */}
          </Tabs>
        </Content>

        <SuccessModal isVisible={showModal} onClose={closeModal} />
      </Layout>
    </Layout>
  );
};

export default Dashboard;
