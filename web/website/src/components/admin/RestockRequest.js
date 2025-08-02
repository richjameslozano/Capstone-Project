import React, { useState, useEffect } from "react";
import {
  Layout,
  Row,
  Col,
  Typography,
  Table,
  Modal,
  Button,
  Select,
  Spin,
} from "antd";
import { db } from "../../backend/firebase/FirebaseConfig";
import { collection, onSnapshot, query, where, doc, updateDoc } from "firebase/firestore";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../styles/adminStyle/RestockRequest.css";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const RestockRequest = () => {
  const [restockRequests, setRestockRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterDepartment, setFilterDepartment] = useState(null);
  const [departmentsAll, setDepartmentsAll] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "restock_requests"), (snapshot) => {
      const requests = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      console.log("Fetched restock requests:", requests);
      setRestockRequests(requests);
      setLoading(false);
    });
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
        console.error("Error fetching SAH departments:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const storedRole = localStorage.getItem("userPosition");
    setUserRole(storedRole);
  }, []);

  const filteredData = restockRequests.filter((item) => {
    const matchesStatus = filterStatus ? item.status === filterStatus : true;
    const matchesDepartment = filterDepartment ? item.department === filterDepartment : true;
    return matchesStatus && matchesDepartment;
  });

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Restock Requests");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "Restock_Requests.xlsx");
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const headers = ["Item Name", "Quantity Needed", "Department", "Status", "Date Created"];
    const data = filteredData.map((item) => [
      item.item_name,
      item.quantity_needed,
      item.department,
      item.status,
      item.created_at.toDate().toLocaleDateString(),
    ]);

    doc.autoTable({
      head: [headers],
      body: data,
      startY: 40,
      theme: "grid",
    });
    doc.save("Restock_Requests.pdf");
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedRequest) return;

    try {
      const requestRef = doc(db, "restock_requests", selectedRequest.id);
      await updateDoc(requestRef, { status: newStatus });

      setIsModalVisible(false);
      setSelectedRequest(null);
      
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const columns = [
    {
      title: "Item Name",
      dataIndex: "item_name",
      key: "item_name",
    },
    {
      title: "Quantity Needed",
      dataIndex: "quantity_needed",
      key: "quantity_needed",
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Date Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (text) => {
        return text ? text.toDate().toLocaleDateString() : "N/A";
      },
    },
  ];

  return (
    <Layout className="restock-layout">
      <Content className="restock-content">
        <Row justify="space-between" align="middle" className="restock-header">
          <Col span={12}>
            <Title level={2}>Restock Requests</Title>
            <Text type="secondary">Manage all requests for item restocks here.</Text>
          </Col>

          <Col span={12} className="export-buttons">
            <Button type="primary" onClick={generatePDF}>
              Export as PDF
            </Button>

            <Button type="primary" onClick={exportToExcel}>
              Export to Excel
            </Button>
          </Col>
        </Row>

        <Row className="filter-row" gutter={16}>
          <Col span={6}>
            <Select
              className="filter-select"
              placeholder="Filter by Status"
              value={filterStatus || ""}
              onChange={(value) => setFilterStatus(value)}
              allowClear
            >
              <Option value="">All</Option>
              <Option value="pending">Pending</Option>
              <Option value="approved">Approved</Option>
              <Option value="denied">Denied</Option>
            </Select>
          </Col>

          <Col span={6}>
            <Select
              className="filter-select"
              placeholder="Filter by Department"
              value={filterDepartment || ""}
              onChange={(value) => setFilterDepartment(value)}
              allowClear
            >
              <Option value="">All</Option>
              {departmentsAll.map((dept) => (
                <Option key={dept.id} value={dept.name}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Spin spinning={loading} tip="Loading...">
          {filteredData.length > 0 ? (
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="id"
              className="restock-table"
              pagination={{ pageSize: 10 }}
              onRow={(record) => ({
                onClick: () => {
                  if (userRole === "admin" && record.status === "pending") {
                    setSelectedRequest(record);
                    setIsModalVisible(true);
                  }
                },
              })}
            />
          ) : (
            <Text>No restock requests found.</Text>
          )}
        </Spin>

        <Modal
          title="Approve Restock Request"
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            setSelectedRequest(null);
          }}
          zIndex={1030}
          footer={[
            <Button key="deny" danger onClick={() => handleUpdateStatus("denied")}>
              Deny
            </Button>,
            <Button key="approve" type="primary" onClick={() => handleUpdateStatus("approved")}>
              Approve
            </Button>,
          ]}
        >
          {selectedRequest ? (
            <div>
              <p><strong>Item:</strong> {selectedRequest.item_name}</p>
              <p><strong>Quantity:</strong> {selectedRequest.quantity_needed}</p>
              <p><strong>Department:</strong> {selectedRequest.department}</p>
              <p><strong>Status:</strong> {selectedRequest.status}</p>
              <p><strong>Date:</strong> {selectedRequest.created_at?.toDate().toLocaleDateString()}</p>
              {selectedRequest.reason && (
                <p><strong>Reason:</strong> {selectedRequest.reason}</p>
              )}
            </div>
          ) : (
            <p>Loading request details...</p>
          )}
        </Modal>

      </Content>
    </Layout>
  );
};

export default RestockRequest;
