import React, { useState, useEffect } from "react";
import {
  Layout,
  Table,
  Typography,
} from "antd";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import "../styles/adminStyle/AdminActivityLog.css";

const { Content } = Layout;
const { Title } = Typography;

const columns = [
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

const AdminActivityLog = () => {
  const [activityData, setActivityData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // useEffect(() => {
  //   const fetchActivityLogs = async () => {
  //     try {
  //       const userId = localStorage.getItem("userId");
  //       if (!userId) throw new Error("User ID not found");

  //       const activityRef = collection(db, `accounts/${userId}/activitylog`);
  //       const querySnapshot = await getDocs(activityRef);

  //       const logs = querySnapshot.docs.map((doc, index) => {
  //         const data = doc.data();
  //         const logDate =
  //           data.cancelledAt?.toDate?.() ||
  //           data.timestamp?.toDate?.() ||
  //           new Date();
        
  //         return {
  //           key: doc.id || index.toString(),
  //           date: logDate.toLocaleString("en-US", {
  //             year: "numeric",
  //             month: "short",
  //             day: "numeric",
  //             hour: "numeric",
  //             minute: "2-digit",
  //             hour12: true,
  //           }),
  //           action:
  //             data.status === "CANCELLED"
  //               ? "Cancelled a request"
  //               : data.action || "Modified a request",
  //           by: data.userName || "Unknown User",
  //           fullData: data,
  //         };
  //       });        

  //       logs.sort((a, b) => {
  //         const dateA = new Date(a.fullData.timestamp?.toDate?.() || a.fullData.cancelledAt?.toDate?.() || 0);
  //         const dateB = new Date(b.fullData.timestamp?.toDate?.() || b.fullData.cancelledAt?.toDate?.() || 0);
  //         return dateB - dateA; 
  //       });        

  //       setActivityData(logs);
  //     } catch (error) {
  //      
  //     }
  //   };

  //   fetchActivityLogs();
  // }, []);

  useEffect(() => {
    const fetchActivityLogs = () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) throw new Error("User ID not found");

        // Set up the real-time listener using onSnapshot
        const activityRef = collection(db, `accounts/${userId}/activitylog`);

        const unsubscribe = onSnapshot(activityRef, (querySnapshot) => {
          const logs = querySnapshot.docs.map((doc, index) => {
            const data = doc.data();
            const logDate =
              data.cancelledAt?.toDate?.() ||
              data.timestamp?.toDate?.() ||
              new Date();

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
              action:
                data.status === "CANCELLED"
                  ? "Cancelled a request"
                  : data.action || "Modified a request",
              by: data.userName || "Unknown User",
              fullData: data,
            };
          });

          logs.sort((a, b) => {
            const dateA = new Date(a.fullData.timestamp?.toDate?.() || a.fullData.cancelledAt?.toDate?.() || 0);
            const dateB = new Date(b.fullData.timestamp?.toDate?.() || b.fullData.cancelledAt?.toDate?.() || 0);
            return dateB - dateA;
          });

          setActivityData(logs);
        });

        // Cleanup listener when component unmounts
        return () => unsubscribe();
        
      } catch (error) {
        
      }
    };

    fetchActivityLogs();
  }, []);

  const filteredData = activityData.filter(
    (item) =>
      item.date.includes(searchQuery) ||
      item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.by.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRowClick = (record) => {
    setSelectedLog(record.fullData);
    setModalVisible(true);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout className="site-layout">
        <Content className="activity-content">

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
                  Activity Log
                </h1>
      <p 
        style={{ color: "#a8d5e5", fontSize: "16px", marginTop: "8px", display: "block", fontWeight: 500, marginBottom: 0 }}
      >
       Maintains a secure audit trail of all user and system activities for monitoring and compliance purposes.
      </p>
      </div>
          <Table
            columns={columns}
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
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminActivityLog;
