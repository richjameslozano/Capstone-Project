// VERSION 1
// import React, { useState, useEffect } from "react";
// import { useNavigate,  useLocation } from "react-router-dom";
// import { Layout, Card, Col, Row, Table, List, Modal } from "antd";
// import { db } from "../backend/firebase/FirebaseConfig"; 
// import { collectionGroup, query, where, getDocs, onSnapshot, collection, orderBy, limit } from "firebase/firestore";
// import SuccessModal from "./customs/SuccessModal";
// import CustomCalendar from "./customs/CustomCalendar";
// import PoliciesModal from "./Policies";
// import "./styles/Dashboard.css";
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
//  const { Content } = Layout;
 
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
//   // {
//   //   title: 'Category',
//   //   dataIndex: 'category',
//   //   key: 'category',
//   // },
//   // {
//   //   title: 'Department',
//   //   dataIndex: 'department',
//   //   key: 'department',
//   // },
//   // {
//   //   title: 'Good Stock',
//   //   dataIndex: ['condition', 'Good'],
//   //   key: 'goodStock',
//   //   render: (text, record) => record.condition?.Good ?? 0,
//   // },
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
//     const criticalLevel = item.criticalLevel ?? 0; // fallback to 0
//     const goodCount = item.condition?.Good ?? 0;

//     return goodCount <= criticalLevel;
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

//     const today = new Date();
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

//         const diffTime = expiryDate - today;
//         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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
//         // Replace with your AI-powered API endpoints once your Blaze plan is active
//         fetch('/api/predict-sales')  // Example endpoint for sales prediction
//           .then((res) => res.json())
//           .then((data) => {
//             setPredictedSales(data.prediction);  // Update predicted sales state
//           });

//         fetch('/api/product-trends')  
//           .then((res) => res.json())
//           .then((data) => {
//             setProductTrends(data.trends);  
//           });
//     }, []);

//     useEffect(() => {
//       // Query to fetch recent products ordered by 'entryDate' and limit to a certain number (e.g., last 5 products)
//       const fetchRecentProducts = async () => {
//         const productsRef = collection(db, "inventory"); // Assuming "inventory" is the collection name

//         // Query to fetch the most recent products
//         const q = query(
//           productsRef, 
//           orderBy("entryCurrentDate", "desc"),  // Order by the entry date in descending order
//           limit(5)  // Limit the number of recent products (e.g., 5)
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
//   <Row gutter={[24, 24]}>

//     <Col xs={24} md={14}>
//       <div className="analytics-box">
//         <div className="analytics-center-wrapper">
//           <h1 style={{ fontWeight: "bold", marginTop: '30px', marginBottom: '40px', fontSize: '26px', marginLeft:'20px'}}>
//             Analytics Center
//           </h1>
//         </div>

//         <Row gutter={16}>

//           <Col xs={24} md={12}>
//             {/* Item Expiry */}
//             <Card title="Item Expiry" className="item-expiry-card" style={{ marginBottom: '24px' }}>
//               <h4>Expired Items</h4>
//               <Table
//                 dataSource={expiredItems}
//                 columns={expiryColumns}
//                 pagination={false}
//                 size="small"
//                 scroll={{ y: 100 }}
//                 locale={{ emptyText: "No expired items" }}
//               />
//               <h4 style={{ marginTop: "20px" }}>Expiring Soon (Next 7 Days)</h4>
//               <Table
//                 dataSource={expiringSoonItems}
//                 columns={expiryColumns}
//                 pagination={false}
//                 size="small"
//                 scroll={{ y: 100 }}
//                 locale={{ emptyText: "No items expiring soon" }}
//               />
//             </Card>

//             {/* Critical Stocks */}
//             <Card title="Critical Stocks" className="critical-card" style={{ marginBottom: '24px' }}>
//               <Table
//                 dataSource={criticalStockList}
//                 columns={criticalColumns}
//                 pagination={false}
//                 size="small"
//                 scroll={{ y: 250 }}
//                 locale={{ emptyText: "No data" }}
//               />
//             </Card>

//           </Col>

//           <Col xs={24} md={12}>
               
//             {/* Recently Added Products */}
// <Card title="Recently Added Products" style={{marginBottom:'24px'}} className="sales-card-header">
//               <div style={{ height: '234px', overflowY: 'auto'}}> 
//                 <List
//                   dataSource={recentProducts}
//                   renderItem={(item) => (
//                     <List.Item>
//                       <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
//                         <div>
//                           <div style={{ fontWeight: 500 }}>{item.itemName}</div>
//                           <small style={{ color: "#888" }}>{item.category}</small>
//                         </div>
//                         <div style={{ color: '#555', fontSize: '0.9em' }}>{item.entryCurrentDate}</div>
//                       </div>
//                     </List.Item>
//                   )}
//                 />
//                 </div>
//             </Card>
//                         {/* Damaged / Defective Items */}
//             <Card title="Damaged / Defective Items" className="damaged-card" style={{ marginBottom: '24px' }}>
//               <Table
//                 dataSource={damagedItems}
//                 scroll={{ x: 'max-content', y: 100 }}
//                 columns={[
//                   { title: "Item Name", dataIndex: "itemName", key: "itemName", width: 105 },
//                   { title: "Item ID", dataIndex: "itemId", key: "itemId", width: 100 },
//                   { title: "Lab Room", dataIndex: "labRoom", key: "labRoom", width: 100 },
//                   { title: "Damaged", dataIndex: "damageQty", key: "damageQty", width: 100 },
//                   { title: "Defective", dataIndex: "defectQty", key: "defectQty", width: 100 },
//                 ]}
//                 pagination={{ pageSize: 5 }}
//                 size="small"
//                 locale={{ emptyText: "No damaged items" }}
//               />
//             </Card>
//           </Col>
//         </Row>
//       </div>
//     </Col>


//     <Col xs={24} md={10}>
//       <div className="calendar-box">
//         <Card title="Calendar" style={{ height: '100%', width:'100%' }}>
//           <CustomCalendar onSelectDate={handleDateSelect} />
//         </Card>
//       </div>
//     </Col>
//   </Row>
// </Content>
                    
//          <SuccessModal isVisible={showModal} onClose={closeModal} />

//          {/* <PoliciesModal isOpen={showPolicies} onClose={closePolicies} /> */}
        
//        </Layout>
//      </Layout>
//    );
//  };

//  //force push
 
//  export default Dashboard;

// VERSION 2
import React, { useState, useEffect } from "react";
import { useNavigate,  useLocation } from "react-router-dom";
import { Layout, Card, Col, Row, Table, List, Modal,Typography,Tag } from "antd";
import { db } from "../backend/firebase/FirebaseConfig"; 
import { collectionGroup, query, where, getDocs, onSnapshot, collection, orderBy, limit } from "firebase/firestore";
import SuccessModal from "./customs/SuccessModal";
import CustomCalendar from "./customs/CustomCalendar";
import PoliciesModal from "./Policies";
import "./styles/Dashboard.css";
import { Tabs } from 'antd';
import {

  UnorderedListOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  DatabaseOutlined,

} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';

 const { Content } = Layout;
 
const { Text } = Typography;
 
 const Dashboard = () => {
   const [showModal, setShowModal] = useState(false);
   const [pendingRequestCount, setPendingRequestCount] = useState(0);
   const [borrowCatalogCount, setBorrowCAtalogCount] = useState(0);
   const [historyData, setHistoryData] = useState(0);
   const [dataSource, setDataSource] = useState(0);
   const [predictedSales, setPredictedSales] = useState(null);  
   const [productTrends, setProductTrends] = useState([]);  
   const [showPolicies, setShowPolicies] = useState(false); 
   const [selectedDate, setSelectedDate] = useState(null);
   const [eventsOnSelectedDate, setEventsOnSelectedDate] = useState([]);
   const [recentProducts, setRecentProducts] = useState([]);
   const location = useLocation();
   const navigate = useNavigate();
   //expiry list
   const [expiredItems, setExpiredItems] = useState([]);
   const [expiringSoonItems, setExpiringSoonItems] = useState([]);
   const [damagedItems, setDamagedItems] = useState([]);
   const [criticalStockList, setCriticalStockList] = useState([]);



   const expiryColumns = [
  {
    title: "Item Name",
    dataIndex: "itemName",
    key: "itemName",
  },
  {
    title: "Category",
    dataIndex: "category",
    key: "category",
  },
  {
    title: "Expiry Date",
    dataIndex: "expiryDate",
    key: "expiryDate",
  },
];

const criticalColumns = [
  {
    title: 'Item ID',
    dataIndex: 'itemId',
    key: 'itemId',
  },
  {
    title: 'Item Name',
    dataIndex: 'itemName',
    key: 'itemName',
  },
  // {
  //   title: 'Category',
  //   dataIndex: 'category',
  //   key: 'category',
  // },
  // {
  //   title: 'Department',
  //   dataIndex: 'department',
  //   key: 'department',
  // },
  // {
  //   title: 'Good Stock',
  //   dataIndex: ['condition', 'Good'],
  //   key: 'goodStock',
  //   render: (text, record) => record.condition?.Good ?? 0,
  // },
  {
    title: 'Critical Level',
    dataIndex: 'criticalLevel',
    key: 'criticalLevel',
    render: (text) => text ?? 0,
  },
];
//critical stock

const getCriticalStockItems = (inventoryItems) => {
  if (!inventoryItems || inventoryItems.length === 0) return [];

  return inventoryItems.filter(item => {
    const quantity = Number(item.quantity) || 0;
    const criticalLevel = Number(item.criticalLevel) || 0;

    return quantity <= criticalLevel;
  });
};

// useEffect to listen for inventory changes and update critical stock list
useEffect(() => {
  const inventoryRef = collection(db, "inventory");

  const unsubscribe = onSnapshot(inventoryRef, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const criticalItems = getCriticalStockItems(items); // 👈 Use the new logic
    setCriticalStockList(criticalItems);
  });

  return () => unsubscribe();
}, []);


   //expiry
    useEffect(() => {
  const fetchExpiryItems = async () => {
    const inventoryRef = collection(db, "inventory");
    const inventorySnapshot = await getDocs(inventoryRef);

    const now = new Date();
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

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

        const expiryDate = typeof expiryRaw === "string"
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

  //for item condition
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
          key: doc.id, // Important for Table/List keys
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
          const response = await fetch("http://localhost:5000/gemini", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: "Perform predictive and prescriptive analysis on the inventory from Firestore. Consider quantity, condition, and criticalLevel.",
            }),
          });

          const result = await response.json();
    const geminiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis received";
    setPredictedSales(cleanMarkdown(geminiText)); // ✅ Clean it before displaying

        } catch (error) {
          console.error("Error fetching Gemini analysis:", error);
        }
      };

      fetchGeminiAnalysis();
    }, []);

    useEffect(() => {
      const fetchGeminiAnalysis = async () => {
        try {
          const response = await fetch("http://localhost:5000/predict-inventory-trends", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });

          const result = await response.json();
          const geminiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis received";

          // clean and display
          setPredictedSales(cleanMarkdown(geminiText));
        } catch (error) {
          console.error("Error fetching Gemini analysis:", error);
        }
      };

      fetchGeminiAnalysis();
    }, []);
 
    useEffect(() => {
      const q = collectionGroup(db, "userrequests");
  
      // Set up the real-time listener
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        setPendingRequestCount(querySnapshot.size);
  
      }, (error) => {

      });
  
      // Cleanup the listener on unmount
      return () => unsubscribe();
    }, []);
 
    useEffect(() => {
      const q = collectionGroup(db, "borrowcatalog");
  
      // Set up the real-time listener
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        setBorrowCAtalogCount(querySnapshot.size);
  
      }, (error) => {

      });
  
      // Cleanup the listener on unmount
      return () => unsubscribe();
    }, []);
 
        useEffect(() => {
      const q = collectionGroup(db, "requestlog");
  
      // Set up the real-time listener
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        setHistoryData(querySnapshot.size);
  
      }, (error) => {

      });
  
      // Cleanup the listener on unmount
      return () => unsubscribe();
    }, []);

      useEffect(() => {
      const q = collectionGroup(db, "inventory");
  
      // Set up the real-time listener
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        setDataSource(querySnapshot.size);
  
      }, (error) => {

      });
  
      // Cleanup the listener on unmount
      return () => unsubscribe();
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
      if (location.state?.loginSuccess) {
        sessionStorage.setItem("isLoggedIn", "true");
        setShowModal(true);
        const newState = { ...location.state };
        delete newState.loginSuccess;
        navigate(location.pathname, { replace: true, state: newState });
      }
    }, [location.state, navigate]);

    useEffect(() => {
      fetch('/api/predict-sales')
        .then((res) => res.json())
        .then((data) => {
          const geminiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis received";
          setPredictedSales(cleanMarkdown(geminiText));
        });

      fetch('/api/product-trends')
        .then((res) => res.json())
        .then((data) => {
          setProductTrends(data.trends);
        });
    }, []);

    useEffect(() => {
      // Query to fetch recent products ordered by 'entryDate' and limit to a certain number (e.g., last 5 products)
      const fetchRecentProducts = async () => {
        const productsRef = collection(db, "inventory"); // Assuming "inventory" is the collection name

        // Query to fetch the most recent products
        const q = query(
          productsRef, 
          orderBy("entryCurrentDate", "desc"),  // Order by the entry date in descending order
          limit(10)  // Limit the number of recent products (e.g., 5)
        );

        const querySnapshot = await getDocs(q);
        const recentItems = [];

        querySnapshot.forEach((doc) => {
          recentItems.push(doc.data());
        });

        setRecentProducts(recentItems);  // Set the fetched data to the state
        };

        fetchRecentProducts();
    }, []);
 
   const closeModal = () => {
    setShowModal(false);        
    // setShowPolicies(true);      
   };
  
  //  const closePolicies = () => {
  //   setShowPolicies(false);    
  //  };

  const handleDateSelect = async (date) => {
    setSelectedDate(date);
    const selectedDateStr = date.format("YYYY-MM-DD"); 

    const q = query(
      collection(db, "borrowcatalog"),
      where("dateRequired", "==", selectedDateStr)
      // Removed the status == "Approved" filter
    );

    const querySnapshot = await getDocs(q);
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
 
   const summaryCards = [
     { title: "Pending Requests", count: pendingRequestCount, color: "#2596be", icon: <FileTextOutlined/> },
     { title: "Borrow Catalog", count: borrowCatalogCount, color: "#165a72", icon: <ShoppingOutlined/> },
     { title: "Inventory", count: dataSource, color: "#0b2d39", icon: <UnorderedListOutlined/> },
     { title: "Request Log", count: historyData, color: "#000000", icon: <DatabaseOutlined/> },
   ];

  const lightenColor = (hex, percent) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent * 100);
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
  
   const salesColumns = [
     {
       title: "#",
       dataIndex: "key",
       key: "key",
     },
     {
       title: "Product Name",
       dataIndex: "name",
       key: "name",
     },
     {
       title: "Date",
       dataIndex: "date",
       key: "date",
     },
     {
       title: "Total Sale",
       dataIndex: "total",
       key: "total",
     },
   ];
 
   const [hoveredIndex, setHoveredIndex] = useState(null);

  const cleanMarkdown = (markdown) => {
    return markdown
      .replace(/```[\s\S]*?```/g, (match) =>
        match.replace(/```[\w]*\n?/, '').replace(/```$/, '')
      );
  };

   return (
     <Layout style={{ minHeight: "100vh" }}>
       <Layout>
        <div className="summary-card-whole">
        {summaryCards.map((card, index)=>{
          const isHovered = index === hoveredIndex;
          const bgColor = isHovered
            ? lightenColor(card.color, 0.1)
            : card.color;
          return(
            <div on className="summary-card-content" style={{backgroundColor: bgColor}}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => {
              if (card.title === "Pending Requests") {
                navigate("/main/pending-request"); 
              }

              if (card.title === "Borrow Catalog") {
                navigate("/main/borrow-catalog"); 
              }
              if (card.title === "Request Log") {
                navigate("/main/request-log"); 
              }
              if (card.title === "Inventory") {
                navigate("/main/inventory"); 
              }
            }}
            >
            <div className="summary-card-icon">{card.icon}</div>
            <div className="card-content-layout">
              <h3 className="card-count">{card.count}</h3>
              <div className="card-title"><p>{card.title}</p></div>
            </div>
          </div>
          )        
        })}
        </div>

<Content className="content">
  <Tabs defaultActiveKey="1" style={{ marginTop: 20 }}>
  <Tabs.TabPane tab="Analytics Center" key="1">
    <Row gutter={[24, 24]}>
      <Col xs={24} md={24}>
        <div className="analytics-box">
          <div className="analytics-center-wrapper">
            <h1 style={{ fontWeight: "bold", marginTop: '30px', marginBottom: '40px', fontSize: '26px', marginLeft:'20px'}}>
              Analytics Center
            </h1>
          </div>

          <Row gutter={16}>
            <Col xs={24} md={8}>
             <Card title="Critical Stocks" className="critical-card" style={{ marginBottom: '24px' }}>
                            <List
                              dataSource={criticalStockList}
                              locale={{ emptyText: 'No critical stock' }}
                              style={{ maxHeight: 250, overflowY: 'auto' }}
                              renderItem={(item) => {
                                const quantity = Number(item.quantity) || 0;
                                const criticalLevel = Number(item.criticalLevel) || 0;
                                const isBelowCritical = quantity <= criticalLevel;

                                return (
                                  <List.Item>
                                    <List.Item.Meta
                                      title={
                                        <Text strong>
                                          {item.itemName} (ID: {item.itemId})
                                        </Text>
                                      }
                                      description={
                                        <>
                                          <Text style={{ color: isBelowCritical ? 'red' : 'inherit' }}>
                                            Remaining Stock: {Math.round(quantity)} / Critical Level: {Math.round(criticalLevel)}
                                          </Text>
                                          {isBelowCritical && (
                                            <Tag color="red" style={{ marginLeft: 8 }}>
                                              Low Stock
                                            </Tag>
                                          )}
                                        </>
                                      }
                                    />
                                  </List.Item>
                                );
                              }}
                            />
                          </Card>

              <Card title="Item Expiry" className="item-expiry-card" style={{ marginBottom: '24px' }}>
                <h4>Expired Items</h4>
                <Table
                  dataSource={expiredItems}
                  columns={expiryColumns}
                  pagination={false}
                  size="small"
                  scroll={{ y: 100 }}
                  locale={{ emptyText: "No expired items" }}
                />
                <h4 style={{ marginTop: "20px" }}>Expiring Soon (Next 7 Days)</h4>
                <Table
                  dataSource={expiringSoonItems}
                  columns={expiryColumns}
                  pagination={false}
                  size="small"
                  scroll={{ y: 100 }}
                  locale={{ emptyText: "No items expiring soon" }}
                />
              </Card>

             
            </Col>

            <Card title="AI Inventory Analysis (Gemini)" style={{ marginBottom: '24px' }}>
              <div style={{ maxHeight: 400, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                <ReactMarkdown>{predictedSales}</ReactMarkdown>
              </div>
            </Card>

            <Col xs={24} md={8}>

                <Card title="Items for Replace" className="damaged-card" style={{ marginBottom: 24 }}>
                <Table
                  dataSource={damagedItems.filter(item => item.damageQty > 0)}
                  columns={[
                    { title: "Item Name", dataIndex: "itemName", key: "itemName", width: 105 },
                    { title: "Item ID", dataIndex: "itemId", key: "itemId", width: 100 },
                    { title: "Lab Room", dataIndex: "labRoom", key: "labRoom", width: 100 },
                    { title: "Damaged", dataIndex: "damageQty", key: "damageQty", width: 100 },
                  ]}
                  pagination={{ pageSize: 5 }}
                  size="small"
                  locale={{ emptyText: "No damaged items" }}
                  scroll={{ y: 100 }}
                />
              </Card>

              <Card title="Recently Added Items" style={{marginBottom:'24px'}} className="sales-card-header">
                <div style={{ height: '234px', overflowY: 'auto'}}> 
                  <List
                    dataSource={recentProducts}
                    renderItem={(item) => (
                      <List.Item>
                        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 500 }}>{item.itemName}</div>
                            <small style={{ color: "#888" }}>{item.category}</small>
                          </div>
                          <div style={{ color: '#555', fontSize: '0.9em' }}>{item.entryCurrentDate}</div>
                        </div>
                      </List.Item>
                    )}
                  />
                </div>
              </Card>



            </Col>
              <Col xs={24} md={8}>
              <Card title="Items for Repair" className="defective-card">
                <Table
                  dataSource={damagedItems.filter(item => item.defectQty > 0)}
                  columns={[
                    { title: "Item Name", dataIndex: "itemName", key: "itemName", width: 105 },
                    { title: "Item ID", dataIndex: "itemId", key: "itemId", width: 100 },
                    { title: "Lab Room", dataIndex: "labRoom", key: "labRoom", width: 100 },
                    { title: "Defective", dataIndex: "defectQty", key: "defectQty", width: 100 },
                  ]}
                  scroll={{ y: 100 }}
                  pagination={{ pageSize: 5 }}
                  size="small"
                  locale={{ emptyText: "No defective items" }}
                />
              </Card>
            </Col>
          </Row>
        </div>
      </Col>
      
    </Row>
  </Tabs.TabPane>

<Tabs.TabPane tab="Calendar" key="2">
<Row gutter={[24, 24]}>
  <Col xs={24}>
    <div className="calendar-box">
          <div className="analytics-center-wrapper">
            <h1 style={{ fontWeight: "bold", fontSize: '26px', margin:'20px'}}>
              Calendar
            </h1>
          </div>
  <div style={{ minHeight: 500, width: '100%'}}>
    <CustomCalendar onSelectDate={handleDateSelect} className="calendar" />
  </div>
    </div>

  </Col>
</Row>




</Tabs.TabPane>
</Tabs>
</Content>
                    
         <SuccessModal isVisible={showModal} onClose={closeModal} />

         {/* <PoliciesModal isOpen={showPolicies} onClose={closePolicies} /> */}
        
       </Layout>
     </Layout>
   );
 };

 //force push
 
 export default Dashboard;