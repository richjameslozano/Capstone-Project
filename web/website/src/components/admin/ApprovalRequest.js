import React, { useState, useEffect } from "react";
import { Layout, Row, Col, Table, Input, Button, Typography } from "antd";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig"; 
import Sidebar from "../Sidebar";
import AppHeader from "../Header";
import "../styles/adminStyle/BorrowCatalog.css";
import ApprovedRequestModal from "../customs/ApprovedRequestModal";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

const ApprovalRequest = () => {
  const [catalog, setCatalog] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");

useEffect(() => {
  const fetchCatalogData = () => {
    try {
      const borrowCatalogRef = collection(db, "ApprovalRequestCollection");

      const unsubscribe = onSnapshot(borrowCatalogRef, (snapshot) => {
        const catalogData = snapshot.docs.map((doc) => {
          const data = doc.data();

          const requestedItems = Array.isArray(data.requestList)
            ? data.requestList.map((item) => ({
                itemId: item.itemIdFromInventory,
                itemName: item.itemName,
                itemDetails: item.itemDetails,
                quantity: item.quantity,
                category: item.category,
                condition: item.conditions,
                department: data.department || "N/A",
                labRoom: item.labRoom,
              }))
            : [];

          return {
            id: doc.id,
            accountId: data.accountId || null,
            timestamp: data.timestamp || null,
            requestor: data.userName || "N/A",
            userName: data.userName || "N/A",
            approvedBy: data.approvedBy || "N/A",
            reason: data.reason || "N/A",
            dateRequired: data.dateRequired || "N/A",
            timeFrom: data.timeFrom || "N/A",
            timeTo: data.timeTo || "N/A",
            course: data.course || "N/A",
            courseDescription: data.courseDescription || "N/A",
            program: data.program || "N/A",
            room: data.room || "N/A",
            requestList: Array.isArray(data.requestList) ? data.requestList : [],
            requestedItems,
            status: data.status || "Pending",
            department: data.department || "N/A", 
          };
        });

        // Sort by most recent
        const sortedCatalogData = catalogData.sort((a, b) => {
          if (a.timestamp && b.timestamp) {
            const timeA = a.timestamp.seconds * 1000 + a.timestamp.nanoseconds / 1000000;
            const timeB = b.timestamp.seconds * 1000 + b.timestamp.nanoseconds / 1000000;
            return timeB - timeA;
          }
          return 0;
        });

        setCatalog(sortedCatalogData);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching approval requests:", error);
    }
  };

  fetchCatalogData();
}, []);

  const handleSearch = (value) => {
    setSearchQuery(value);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
  };

  const filteredCatalog = catalog.filter((item) => {
    const matchesSearch =
      item.requestor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.course?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.courseDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.dateRequired?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: "Requestor",
      dataIndex: "requestor",
      key: "requestor",
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Course",
      dataIndex: "course",
      key: "course",
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
      render: (status) => {
        let color;

        switch (status) {
          case "Borrowed":
            color = "blue";
            break;

          case "Returned":
            color = "orange";
            break;

          case "Return Approved":
            color = "green";
            break;

          case "Deployed":
            color = "red";
            break;

          default:
            color = "purple";
        }

        return (
          <Text style={{ color, fontWeight: "bold" }}>
            {status}
          </Text>
        );
      },
    },
    {
      title: "",
      key: "action",
      render: (_, record) => (
        <a
          href="#"
          className="view-details"
          onClick={() => handleViewDetails(record)}
        >
          View Details
        </a>
      ),
    },
  ];

  const handleViewDetails = (record) => {
    console.log("Selected Record:", record);
    setSelectedRequest(record);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedRequest(null);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
  
    try {
      // If it's a Firestore Timestamp object
      if (timestamp.seconds) {
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      }
  
      // If it's already a string or Date object
      const date = new Date(timestamp);
      if (isNaN(date)) return "N/A";
      
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      
    } catch (e) {
      return "N/A";
    }
  };
  
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout>
        <Content style={{ margin: "20px" }}>
          <Row justify="space-between" style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Search
                placeholder="Search"
                allowClear
                enterButton
                onSearch={handleSearch}
              />
            </Col>
            
            <Col>
              <Button type={statusFilter === "All" ? "primary" : "default"} onClick={() => handleStatusFilter("All")}>
                All
              </Button>

              <Button type={statusFilter === "Borrowed" ? "primary" : "default"} onClick={() => handleStatusFilter("Borrowed")}>
                Borrowed
              </Button>

              <Button type={statusFilter === "Returned" ? "primary" : "default"} onClick={() => handleStatusFilter("Returned")}>
                Returned
              </Button>

              <Button type={statusFilter === "Return Approved" ? "primary" : "default"} onClick={() => handleStatusFilter("Return Approved")}>
                Return Approved
              </Button>

              <Button type={statusFilter === "Deployed" ? "primary" : "default"} onClick={() => handleStatusFilter("Deployed")}>
                Deployed
              </Button>
            </Col>
          </Row>

          <Table
            className="borrow-catalog-table"
            dataSource={filteredCatalog}
            columns={columns}
            rowKey="id"
            bordered
            pagination={{ pageSize: 10 }}
          />

            <ApprovedRequestModal
              isApprovedModalVisible={isModalVisible}
              setIsApprovedModalVisible={setIsModalVisible}
              selectedApprovedRequest={selectedRequest}
              setSelectedApprovedRequest={setSelectedRequest}
              columns={columns}
              formatDate={formatDate}
            />
        </Content>
      </Layout>
    </Layout>
  );
};

export default ApprovalRequest;

