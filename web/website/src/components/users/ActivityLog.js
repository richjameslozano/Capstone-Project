import React, { useState, useEffect } from "react";
import {
  Layout,
  Table,
  Typography,
} from "antd";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import "../styles/usersStyle/ActivityLog.css";

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

const ActivityLog = () => {
  const [activityData, setActivityData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const activityRef = collection(db, `accounts/${userId}/activitylog`);

    const unsubscribe = onSnapshot(
      activityRef,
      (querySnapshot) => {
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

        // Sort logs by newest first
        logs.sort((a, b) => {
          const dateA = new Date(a.fullData.timestamp?.toDate?.() || a.fullData.cancelledAt?.toDate?.() || 0);
          const dateB = new Date(b.fullData.timestamp?.toDate?.() || b.fullData.cancelledAt?.toDate?.() || 0);
          return dateB - dateA;
        });

        setActivityData(logs);
      },
      (error) => {
    
      }
    );

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
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
          style={{boxShadow: '0px 4px 5px rgba(0,0,0,0.1)'}}
            columns={columns}
            dataSource={filteredData}
            pagination={{ pageSize: 10 }}
            bordered
            className="return-table"
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

export default ActivityLog;
