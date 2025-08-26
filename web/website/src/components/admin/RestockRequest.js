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
  Tag,
  Input,
  InputNumber,
} from "antd";
import { db } from "../../backend/firebase/FirebaseConfig";
import { collection, onSnapshot, query, where, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../styles/adminStyle/RestockRequest.css";
import NotificationModal from "../customs/NotificationModal";

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
  const [userJobTitle, setUserJobTitle] = useState(null);
  const [comment, setComment] = useState("");
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [approveLoading, setApproveLoading] = useState(false);
  const [denyLoading, setDenyLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [editingQuantity, setEditingQuantity] = useState(false);
  const [editedQuantity, setEditedQuantity] = useState(null);
  const [saveQuantityLoading, setSaveQuantityLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "restock_requests"), (snapshot) => {
      const requests = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      console.log("Fetched restock requests:", requests);
      // setRestockRequests(requests);

      const sorted = [...requests].sort((a, b) => {
        const dateA = a.created_at?.toDate?.() || new Date(0);
        const dateB = b.created_at?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      setRestockRequests(sorted);

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
    const storedJobTitle = localStorage.getItem("userJobTitle");
    setUserRole(storedRole);
    setUserJobTitle(storedJobTitle);
  }, []);

  // Check if user can edit quantity
  const canEditQuantity = userRole === "super-user" || userJobTitle === "Laboratory Custodian";

  const filteredData = restockRequests.filter((item) => {
    const matchesStatus = filterStatus ? item.status === filterStatus : true;
    const matchesDepartment = filterDepartment ? item.department === filterDepartment : true;
    return matchesStatus && matchesDepartment;
  });

  const exportToExcel = () => {
    setExportLoading(true);
    try {
      const worksheet = XLSX.utils.json_to_sheet(filteredData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Restock Requests");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(data, "Restock_Requests.xlsx");

    } catch (error) {
      console.error("Error exporting to Excel:", error);

    } finally {
      setExportLoading(false);
    }
  };

  const generatePDF = () => {
    setPdfLoading(true);
    try {
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

    } catch (error) {
      console.error("Error generating PDF:", error);

    } finally {
      setPdfLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedRequest) return;

    if (newStatus === "approved") {
      setApproveLoading(true);

    } else {
      setDenyLoading(true);
    }

    try {
      const requestRef = doc(db, "restock_requests", selectedRequest.id);
      // await updateDoc(requestRef, { status: newStatus });
      await updateDoc(requestRef, {
        status: newStatus,
        admin_comment: comment, // add the comment field
        updated_at: serverTimestamp()
      });

      // Notify the requester
      if (selectedRequest.accountId && selectedRequest.accountId !== "system") {
        await addDoc(
          collection(db, `accounts/${selectedRequest.accountId}/userNotifications`),
          {
            action: `${newStatus === "approved" ? "Approved" : "Rejected"} your restock request for "${selectedRequest.item_name}"`,
            requestId: selectedRequest.id,
            userName: selectedRequest.userName || "User",
            read: false,
            timestamp: serverTimestamp(),
          }
        );
      }

      const currentUserId = localStorage.getItem("userId");
      const currentUserName = localStorage.getItem("userName") || "admin";
      if (currentUserId) {
        await addDoc(collection(db, `accounts/${currentUserId}/activitylog`), {
          action: `${newStatus === "approved" ? "Approved" : "Denied"} restock request for "${selectedRequest.item_name}" from ${selectedRequest.department}`,
          userName: currentUserName,
          timestamp: serverTimestamp(),
        });
      }

      setNotificationMessage(
          newStatus === "approved"
            ? "Restock request approved successfully!"
            : "Restock request denied."
        );
      setIsNotificationVisible(true);

      setComment("");
      setIsModalVisible(false);
      setSelectedRequest(null);

    } catch (error) {
      console.error("Error updating status:", error);

    } finally {
      if (newStatus === "approved") {
        setApproveLoading(false);

      } else {
        setDenyLoading(false);
      }
    }
  };

  const handleSaveQuantity = async () => {
    if (!selectedRequest || editedQuantity === null) return;

    // Validation: Check for negative values
    if (editedQuantity <= 0) {
      setNotificationMessage("Quantity must be greater than 0.");
      setIsNotificationVisible(true);
      return;
    }

    // Validation: Check if quantity is the same as original
    if (editedQuantity === selectedRequest.quantity_needed) {
      setNotificationMessage("No changes detected. Quantity remains the same.");
      setIsNotificationVisible(true);
      setEditingQuantity(false);
      setEditedQuantity(null);
      return;
    }

    setSaveQuantityLoading(true);
    try {
      const requestRef = doc(db, "restock_requests", selectedRequest.id);
      await updateDoc(requestRef, {
        quantity_needed: editedQuantity,
        updated_at: serverTimestamp()
      });

      // Update local state
      setRestockRequests(prev => 
        prev.map(req => 
          req.id === selectedRequest.id 
            ? { ...req, quantity_needed: editedQuantity }
            : req
        )
      );

      setNotificationMessage("Quantity updated successfully!");
      setIsNotificationVisible(true);
      setEditingQuantity(false);
      setEditedQuantity(null);

    } catch (error) {
      console.error("Error updating quantity:", error);
      setNotificationMessage("Error updating quantity. Please try again.");
      setIsNotificationVisible(true);
      
    } finally {
      setSaveQuantityLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingQuantity(false);
    setEditedQuantity(null);
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
    // {
    //   title: "Status",
    //   dataIndex: "status",
    //   key: "status",
    // },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = status === 'approved' ? 'green'
                  : status === 'denied' ? 'red'
                  : 'gold';
        return <Tag color={color}>{status.toUpperCase()}</Tag>
      }
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
            <Button type="primary" onClick={generatePDF} loading={pdfLoading} disabled={exportLoading}>
              Export as PDF
            </Button>

            <Button type="primary" onClick={exportToExcel} loading={exportLoading} disabled={pdfLoading}>
              Export to Excel
            </Button>
          </Col>
        </Row>

        <Row className="filter-row">
          <Col>
            <Select
              className="filter-select"
              style={{ width: 150, marginRight: 8 }} // add small space between filters
              placeholder="Filter by Status"
              value={filterStatus === "" ? undefined : filterStatus}
              onChange={(value) => setFilterStatus(value)}
              allowClear
            >
              <Option value="">All</Option>
              <Option value="pending">Pending</Option>
              <Option value="approved">Approved</Option>
              <Option value="denied">Denied</Option>
            </Select>
          </Col>

          <Col>
            <Select
              className="filter-select"
              style={{ width: 200 }}
              placeholder="Filter by Department"
              value={filterDepartment === "" ? undefined : filterDepartment}
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
                  if (["admin", "super-user"].includes(userRole)) {
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
          title={
            selectedRequest?.status === "denied"
              ? "Denied Restock Request"
              : selectedRequest?.status === "pending"
              ? "Pending Restock Request"
              : "Approve Restock Request"
          }
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            setComment("");
            setSelectedRequest(null);
            setEditingQuantity(false);
            setEditedQuantity(null);
          }}
          zIndex={1030}
          footer={
            userRole === "admin" && selectedRequest?.status === "pending" ? [
              <Button key="deny" danger onClick={() => handleUpdateStatus("denied")} loading={denyLoading} disabled={approveLoading}>
                Deny
              </Button>,

              <Button key="approve" type="primary" onClick={() => handleUpdateStatus("approved")} loading={approveLoading} disabled={denyLoading}>
                Approve
              </Button>,
            ] : null
          }
        >
          {selectedRequest ? (
            <div>
              <p><strong>Item:</strong> {selectedRequest.item_name}</p>
              
              <p>
                <strong>Quantity:</strong> 
                {canEditQuantity && !editingQuantity ? (
                  <span>
                    {selectedRequest.quantity_needed}
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => {
                        setEditingQuantity(true);
                        setEditedQuantity(selectedRequest.quantity_needed);
                      }}
                      style={{ marginLeft: '8px' }}
                    >
                      Edit
                    </Button>
                  </span>
                ) : canEditQuantity && editingQuantity ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <InputNumber
                      min={1}
                      value={editedQuantity}
                      onChange={(value) => {
                        // Prevent negative values and null values
                        if (value === null || value <= 0) {
                          setEditedQuantity(1);
                        } else {
                          setEditedQuantity(value);
                        }
                      }}
                      onBlur={(e) => {
                        // Ensure value is at least 1 when user leaves the field
                        if (editedQuantity === null || editedQuantity <= 0) {
                          setEditedQuantity(1);
                        }
                      }}
                      style={{ width: '120px' }}
                    />
                    <Button 
                      size="small" 
                      type="primary" 
                      onClick={handleSaveQuantity}
                      loading={saveQuantityLoading}
                    >
                      Save
                    </Button>
                    <Button 
                      size="small" 
                      onClick={handleCancelEdit}
                      disabled={saveQuantityLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  selectedRequest.quantity_needed
                )}
              </p>
              
              <p><strong>Department:</strong> {selectedRequest.department}</p>
              <p><strong>Status:</strong> {selectedRequest.status}</p>
              <p><strong>Date:</strong> {selectedRequest.created_at?.toDate().toLocaleDateString()}</p>
              {selectedRequest.reason && (
                <p><strong>Reason:</strong> {selectedRequest.reason}</p>
              )}

              {["approved", "denied"].includes(selectedRequest.status) ? (
                selectedRequest.admin_comment ? (
                  <p><strong>Admin Comment:</strong> {selectedRequest.admin_comment}</p>
                ) : null
              ) : userRole !== "super-user" ? (
                <textarea
                  placeholder="Add a comment (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={{ width: "100%", marginTop: "1rem", padding: "8px" }}
                  rows={4}
                />
              ) : null}
            </div>
          ) : (
            <p>Loading request details...</p>
          )}
        </Modal>

        <NotificationModal
          isVisible={isNotificationVisible}
          onClose={() => setIsNotificationVisible(false)}
          message={notificationMessage}
        />

      </Content>
    </Layout>
  );
};

export default RestockRequest;
