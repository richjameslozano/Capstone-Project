import React, { useState, useEffect } from "react";
import { Layout, Row, Col, Typography, Table, Modal, Button, Select } from "antd";
import { db } from "../../backend/firebase/FirebaseConfig"; 
import { collection, onSnapshot } from "firebase/firestore";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../styles/adminStyle/CapexList.css";

const { Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

const CapexList = () => {
  const [requests, setRequests] = useState([]);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedRowDetails, setSelectedRowDetails] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [subjectOptions, setSubjectOptions] = useState([]);


  useEffect(() => {
    const userRequestRef = collection(db, "capexrequestlist");

    const unsubscribe = onSnapshot(userRequestRef, (querySnapshot) => {
      const fetched = [];

      querySnapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        fetched.push({
          id: docSnap.id,
          ...data,
        });
      });

      // Get unique subjects from nested `items`
      const subjects = new Set();
      fetched.forEach(req => {
        (req.items || []).forEach(item => {
          if (item.subject) {
            subjects.add(item.subject);
          }
        });
      });

      setSubjectOptions(Array.from(subjects));

      // Filter based on selected subject
      const filtered = subjectFilter
        ? fetched.filter(req =>
            (req.items || []).some(item =>
              (item.subject || "").toLowerCase() === subjectFilter.toLowerCase()
            )
          )
        : fetched;

      setRequests(filtered);
    }, (error) => {
      console.error("Error fetching requests in real-time: ", error);
    });

    return () => unsubscribe(); // Cleanup
  }, [subjectFilter]);

  const handleDownloadExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: CAPEX Summary
    const summaryData = requests.map((req, index) => ({
      "No.": index + 1,
      "Requestor": req.userName,
      "Submission Date": req.createdAt?.toDate().toLocaleString() || "N/A",
      "Total Price": req.totalPrice ? `₱${req.totalPrice.toLocaleString()}` : "N/A",
    }));
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "CAPEX Summary");

    // Sheet 2: All Requested Items
    const allItems = requests.flatMap((req) =>
      (req.items || []).map((item, index) => ({
        "Requestor": req.userName,
        "Submission Date": req.createdAt?.toDate().toLocaleString() || "N/A",
        "Item No.": item.no ?? index + 1,
        "Item Description": item.itemDescription || "",
        "Subject": item.subject || "",
        "Justification": item.justification || "",
        "Quantity": item.qty || 0,
        "Estimated Cost": item.estimatedCost
          ? `₱${item.estimatedCost.toLocaleString()}`
          : "",
        "Total Item Price": item.totalPrice
          ? `₱${item.totalPrice.toLocaleString()}`
          : "",
        "Item ID": item.id || "",
      }))
    );

    const itemsSheet = XLSX.utils.json_to_sheet(allItems);
    XLSX.utils.book_append_sheet(workbook, itemsSheet, "CAPEX Items");

    // Trigger download
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(file, "Capex_Requests.xlsx");
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return "N/A";
    const date = timestamp.toDate();
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleViewDetails = (record) => {
    setSelectedRowDetails(record);
    setViewModalVisible(true);
  };

  const columns = [
    {
      title: "Requestor",
      dataIndex: "userName",
      render: (text, record, index) => (
        <span>
          {index + 1}. <strong>{text}</strong>
        </span>
      ),
    },
    {
      title: "Submission Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => createdAt?.toDate().toLocaleString(),
    },
    {
      title: "Total Price",
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (price) => `₱${price?.toLocaleString()}`,
    },
    {
      title: "Actions",
      key: "actions",
      render: (text, record) => (
        <Button type="link" onClick={() => handleViewDetails(record)}>
          View
        </Button>
      ),
    },
  ];

  const itemsColumns = [
    {
      title: "Item Description",
      dataIndex: "itemDescription",
      key: "itemDescription",
    },
    {
      title: "Justification",
      dataIndex: "justification",
      key: "justification",
    },
    {
      title: "Quantity",
      dataIndex: "qty",
      key: "qty",
    },
    {
      title: "Estimated Cost",
      dataIndex: "estimatedCost",
      key: "estimatedCost",
      render: (cost) => `₱${cost?.toLocaleString()}`,
    },
    {
      title: "Total Price",
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (price) => `₱${price?.toLocaleString()}`,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ margin: "20px" }}>
        <Row gutter={24}>
          <Col span={24}>
            <Title level={4}>List of Requests</Title>

            <Select
              allowClear
              style={{ width: 200, marginBottom: 16 }}
              placeholder="Filter by Subject"
              value={subjectFilter}
              onChange={(value) => setSubjectFilter(value || "")}
            >
              {subjectOptions.map((subject, index) => (
                <Option key={index} value={subject}>
                  {subject}
                </Option>
              ))}
            </Select>

            <Button type="primary" onClick={handleDownloadExcel} style={{ marginBottom: 16 }}>
              Download Excel
            </Button>

            <Table
              dataSource={requests}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              columns={columns}
            />
          </Col>
        </Row>
      </Content>

      <Modal
        title="CAPEX Request Details"
        visible={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={null}
        width={800}
        zIndex={1026}
      >
        {selectedRowDetails && (
          <div>
            <p><strong>User Name:</strong> {selectedRowDetails.userName}</p>
            <p><strong>Total Price:</strong> ₱{selectedRowDetails.totalPrice?.toLocaleString()}</p>
            <p><strong>Submission Date:</strong> {selectedRowDetails.createdAt?.toDate().toLocaleString()}</p>

            <h3>Items:</h3>
            <Table
              dataSource={selectedRowDetails.items}
              columns={itemsColumns}
              pagination={false}
              rowKey="itemDescription" 
            />
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default CapexList;
