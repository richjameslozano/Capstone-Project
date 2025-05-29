import React, { useState, useEffect } from "react";
import {
  Layout,
  Input,
  Table,
  Typography,
  Modal,
  Descriptions,
  Select,
  Button,
  Spin,
} from "antd";
import { CloseOutlined, SearchOutlined } from "@ant-design/icons";
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import "../styles/usersStyle/ActivityLog.css";
import { getAuth } from "firebase/auth";
  
const { Content } = Layout;
const { Title } = Typography;

const columns2 = [
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

const HistoryLog = () => {
  const [activityData, setActivityData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isCancelVisible, setIsCancelVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewDetailsModalVisible, setViewDetailsModalVisible] = useState(false);
  const [userName, setUserName] = useState("User");
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const fetchUserName = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUserName(user.displayName || "Unknown User");
    }
  };

  const fetchRequests = () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("User ID not found in localStorage.");
  
      const userRequestsRef = collection(db, `accounts/${userId}/userRequests`);
  
      // Real-time listener
      const unsubscribe = onSnapshot(userRequestsRef, async (querySnapshot) => {
        const fetched = [];
  
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          
          const enrichedItems = await Promise.all(
            (data.filteredMergedData || []).map(async (item) => {
              const inventoryId = item.selectedItemId || item.selectedItem?.value;
              let itemId = "N/A";
  
              if (inventoryId) {
                try {
                  const invDoc = await getDoc(doc(db, `inventory/${inventoryId}`));
                  if (invDoc.exists()) {
                    itemId = invDoc.data().itemId || "N/A";
                  }
  
                } catch (err) {
                  console.error(`Error fetching inventory item ${inventoryId}:`, err);
                }
              }
  
              return {
                ...item,
                itemIdFromInventory: itemId,
                volume: item.volume ?? "N/A", 
              };
            })
          );
  
          fetched.push({
            id: docSnap.id,
            dateRequested: data.timestamp
              ? new Date(data.timestamp.seconds * 1000).toLocaleDateString()
              : "N/A",
            dateRequired: data.dateRequired || "N/A",
            requester: data.userName || "Unknown",
            room: data.room || "N/A",
            timeNeeded: `${data.timeFrom || "N/A"} - ${data.timeTo || "N/A"}`,
            courseCode: data.program || "N/A",
            courseDescription: data.reason || "N/A",
            items: enrichedItems,
            status: "PENDING",
            message: data.reason || "",
            usageType: data.usageType || "",
          });
        }
  
        // Sort fetched data by request date
        const sortedByDate = fetched.sort((a, b) => {
          const dateA = new Date(a.dateRequested);
          const dateB = new Date(b.dateRequested);
          return dateB - dateA;
        });
  
        setRequests(sortedByDate);
  
      }, (error) => {
        console.error("Error fetching user requests in real-time: ", error);
        setNotificationMessage("Failed to fetch user requests.");
        setNotificationVisible(true);
      });
  
      // Cleanup listener on unmount
      return () => unsubscribe();

    } catch (err) {
      console.error("Error fetching requests:", err);
      setNotificationMessage("Failed to fetch user requests.");
      setNotificationVisible(true);
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchUserName();
  }, []);

  const handleCancelRequest = async () => {
    try {
      const userId = localStorage.getItem("userId");
  
      if (!userId || !selectedRequest?.id) {
        throw new Error("Missing user ID or selected request ID.");
      }
  
      const userRequestRef = doc(db, `accounts/${userId}/userRequests`, selectedRequest.id);
      const activityLogRef = doc(db, `accounts/${userId}/historylog`, selectedRequest.id);
  
      // Fetch request data before deleting
      const requestSnap = await getDoc(userRequestRef);
      if (!requestSnap.exists()) throw new Error("Request not found.");
  
      const requestData = requestSnap.data();
  
      // Write to activity log
      await setDoc(activityLogRef, {
        ...requestData,
        status: "CANCELLED",
        cancelledAt: new Date(),
      });
  
      // Delete from userRequests subcollection
      await deleteDoc(userRequestRef);
  
      // Find and delete from root userrequests collection
      const rootQuery = query(
        collection(db, "userrequests"),
        where("accountId", "==", userId),
        where("timestamp", "==", requestData.timestamp) // Assumes timestamp is unique for each request
      );
  
      const rootSnap = await getDocs(rootQuery);
      const batchDeletes = [];
  
      rootSnap.forEach((docSnap) => {
        batchDeletes.push(deleteDoc(doc(db, "userrequests", docSnap.id)));
      });
  
      await Promise.all(batchDeletes);
      setIsCancelVisible(false);

      setNotificationMessage("Request successfully canceled and logged.");
      setNotificationVisible(true);
      setSelectedRequest(null);
      setViewDetailsModalVisible(false);
      fetchRequests();

    } catch (err) {
      console.error("Error canceling request:", err);
      setNotificationMessage("Failed to cancel the request.");
      setNotificationVisible(true);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setViewDetailsModalVisible(true);
  };

  const handleModalClose = () => {
    setViewDetailsModalVisible(false);
    setSelectedRequest(null);
  };

  const columns = [
    {
      title: "Request ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Requisition Date",
      dataIndex: "dateRequested",
      key: "dateRequested",
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
      render: (status) => (
        <Button type="text" className="status-btn">
          {status}
        </Button>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button onClick={() => handleViewDetails(record)} type="primary">
          View Details
        </Button>
      ),
    },
  ];

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
  
    const activityRef = collection(db, `accounts/${userId}/historylog`);
  
    const unsubscribe = onSnapshot(
      activityRef,
      (querySnapshot) => {
        const logs = querySnapshot.docs.map((doc, index) => {
          const data = doc.data();
          const logDate =
            data.cancelledAt?.toDate?.() ||
            data.timestamp?.toDate?.() ||
            new Date();
  
          const isCancelled = data.status === "CANCELLED";
          const action = isCancelled
            ? "Cancelled a request"
            : data.action || "Modified a request";
            
          const by = 
            action === "Request Approved"
              ? data.approvedBy
              : action === "Request Rejected"
              ? data.rejectedBy
              : action === "Deployed"
              ? data.approvedBy
              : data.userName || "Unknown User";
  
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
            rawDate: logDate,
            action: action,
            by: by,
            fullData: data,
          };
        });
  
        const sortedLogs = logs.sort((a, b) => b.rawDate - a.rawDate);
        setActivityData(sortedLogs);
      },
      (error) => {
        console.error("Real-time activity log listener failed:", error);
      }
    );
  
    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  const filteredData = activityData
  .filter((item) => {
    // Filter by action type
    if (actionFilter !== "ALL" && item.action !== actionFilter) {
      return false;
    }
    // Filter by search

    return (
      item.date.includes(searchQuery) ||
      item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.by.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleRowClick = (record) => {
    setSelectedLog(record.fullData);
    setModalVisible(true);
  };

    const hasGlassware = Array.isArray(selectedRequest?.items)
    ? selectedRequest.items.some(
        (item) => item.category?.toLowerCase() === "glasswares"
      )
    : false;


  const itemColumns = [
    {
      title: "Item #",
      key: "index",
      render: (_, __, index) => <span>{index + 1}</span>,
    },
    {
      title: "Item Name",
      dataIndex: "itemName",
      key: "itemName",
    },
    {
      title: "Item ID",
      dataIndex: "itemIdFromInventory",
      key: "itemIdFromInventory",
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (department) => (
        <span
          style={{
            color: department === "MEDTECH" ? "magenta" : "orange",
            fontWeight: "bold",
          }}
        >
          {department}
        </span>
      ),
    },
    
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout className="site-layout">
        <Content className="activity-content">
          <div className="activity-header">
            <Title level={3}>
              <span className="icon-activity">⏰</span> Activity Log
            </Title>
          </div>

          <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
            <Input
              placeholder="Search"
              prefix={<SearchOutlined />}
              className="activity-search"
              allowClear
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "60%" }}
            />

            <Select
              value={actionFilter}
              onChange={(value) => setActionFilter(value)}
              style={{ width: 200 }}
              allowClear
              placeholder="Filter by Action"
            >
              <Select.Option value="ALL">All</Select.Option>
              <Select.Option value="Request Approved">Request Approved</Select.Option>
              <Select.Option value="Request Rejected">Request Rejected</Select.Option>
              <Select.Option value="Cancelled a request">Request Cancelled</Select.Option>
              <Select.Option value="Deployed">Deployed</Select.Option>
            </Select>
          </div>

          <Table
            columns={columns2}
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

          <Modal
            title="Activity Details"
            visible={modalVisible}
            zIndex={1015}
            onCancel={() => setModalVisible(false)}
            footer={null}
          >
            {selectedLog && (
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Action">
                  {selectedLog.status === "CANCELLED"
                    ? "Cancelled a request"
                    : selectedLog.action || "Modified a request"}
                </Descriptions.Item>

                <Descriptions.Item label="By">
                  {selectedLog.userName || "Unknown User"}
                </Descriptions.Item>

                <Descriptions.Item label="Program">
                  {selectedLog.program || "N/A"}
                </Descriptions.Item>

                {/* <Descriptions.Item label="Items Requested">
                  {(selectedLog.filteredMergedData || selectedLog.requestList)?.length > 0 ? (
                    <ul style={{ paddingLeft: 20 }}>
                      {(selectedLog.filteredMergedData || selectedLog.requestList).map((item, index) => (
                        <li key={index} style={{ marginBottom: 10 }}>
                          <strong>{item.itemName}</strong>
                          <ul style={{ marginLeft: 20 }}>
                            <li>Quantity: {item.quantity}</li>
                            {item.category && <li>Category: {item.category}</li>}
                            {item.labRoom && <li>Lab Room: {item.labRoom}</li>}
                            {item.usageType && <li>Usage Type: {item.usageType}</li>}
                            {item.itemType && <li>Item Type: {item.itemType}</li>}
                            {item.department && <li>Department: {item.department}</li>}
                            {selectedLog.action === "Request Rejected" && item.reason && (
                              <li><strong>Rejection Reason:</strong> {item.reason}</li>
                            )}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "None"
                  )}
                </Descriptions.Item> */}

                <Descriptions.Item label="Items Requested">
                  {(selectedLog.filteredMergedData || selectedLog.requestList)?.length > 0 ? (
                    <ul style={{ paddingLeft: 20 }}>
                      {(selectedLog.filteredMergedData || selectedLog.requestList).map((item, index) => (
                        <li key={index} style={{ marginBottom: 10 }}>
                          <strong>{item.itemName}</strong>
                          <ul style={{ marginLeft: 20 }}>
                            <li>Quantity: {item.quantity}</li>
                            {/* {item.category && <li>Category: {item.category}</li>} */}
                            {item.category && <li>Category: {item.category}</li>}
                            {item.category === "Glasswares" && item.volume && (
                              <li>Volume: {item.volume}</li>
                            )}
                            {/* {item.condition && <li>Condition: {item.condition}</li>} */}
                            {/* {item.condition && (
                              <li>
                                Condition:
                                <ul>
                                  <li>Good: {item.condition.Good ?? 0}</li>
                                  <li>Defect: {item.condition.Defect ?? 0}</li>
                                  <li>Damage: {item.condition.Damage ?? 0}</li>
                                </ul>
                              </li>
                            )} */}
                            {item.labRoom && <li>Lab Room: {item.labRoom}</li>}
                            {item.usageType && <li>Usage Type: {item.usageType}</li>}
                            {item.itemType && <li>Item Type: {item.itemType}</li>}
                            {item.department && <li>Department: {item.department}</li>}
                            {/* {selectedLog.action === "Request Rejected" && item.reason && (
                              <li><strong>Rejection Reason:</strong> {item.reason}</li>
                            )} */}
                            {selectedLog.action === "Request Rejected" && (item.rejectionReason || item.reason) && (
                              <li><strong>Rejection Reason:</strong> {item.rejectionReason || item.reason}</li>
                            )}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "None"
                  )}
                </Descriptions.Item>

                {selectedLog.action !== "Request Rejected" && (
                  <Descriptions.Item label="Reason">
                    {selectedLog.reason || "N/A"}
                  </Descriptions.Item>
                )}

                <Descriptions.Item label="Room">
                  {selectedLog.room || "N/A"}
                </Descriptions.Item>

                <Descriptions.Item label="Time">
                  {selectedLog.timeFrom && selectedLog.timeTo
                    ? `${selectedLog.timeFrom} - ${selectedLog.timeTo}`
                    : "N/A"}
                </Descriptions.Item>

                <Descriptions.Item label="Date Required">
                  {selectedLog.dateRequired || "N/A"}
                </Descriptions.Item>
              </Descriptions>
            )}
          </Modal>
        </Content>
      </Layout>

      <Layout className="site-layout">
        <Content className="pending-content">
          <div className="pending-header">
            <Title level={3}>
              <span className="icon-pending">⏳</span> Requests List
            </Title>
          </div>

          <div className="search-container">
            <Input
              placeholder="Search requests..."
              prefix={<SearchOutlined />}
              className="pending-search"
              allowClear
            />
          </div>

          <div className="pending-main">
            {loading ? (
              <Spin size="large" />
            ) : (
              <Table
                columns={columns}
                dataSource={requests}
                pagination={{ pageSize: 10 }}
                rowKey="id"
                className="pending-table"
              />
            )}
          </div>

          <Modal
            className="request-list-modal"
            open={viewDetailsModalVisible}
            onCancel={handleModalClose}
            width={800}
            zIndex={1008}
            closable={false}
            footer={[
              <Button key="close" onClick={handleModalClose}>
                Close
              </Button>,
              
              <Button
                key="cancel"
                danger
                onClick={() => setIsCancelVisible(true)}
                icon={<CloseOutlined />}
              >
                Cancel Request
              </Button>,
            ]}
          >
            {selectedRequest && (
              <>
                  <div className="request-details-container" style={{justifyContent: 'space-between'}}>
                    <strong style={{fontSize: '18px', color: 'white'}}>Request Details</strong>
                    <span style={{fontSize: 12, color: 'white'}}>{selectedRequest?.id}</span>
                  </div>

                  <div className="request-details-whole">
                      <div className="request-details-left">
                        <div><p><strong>Requester:</strong></p><p>{selectedRequest.requester}</p></div>
                        <div><p><strong>Requisition Date:</strong></p><p>{selectedRequest.dateRequested}</p></div>
                        <div><p><strong>Date Required:</strong></p><p>{selectedRequest.dateRequired}</p></div>
                        <div><p><strong>Time Needed:</strong></p><p>{selectedRequest.timeNeeded}</p></div>
                      </div>
                        
                        
                      <div className="request-details-right">
                        <div><p><strong>Course Code:</strong></p><p>{selectedRequest.courseCode}</p></div>
                        <div><p><strong>Course Description:</strong></p><p>{selectedRequest.requester}</p></div>
                        <div><p><strong>Room:</strong></p><p> {selectedRequest.room}</p></div>
                        <div><p><strong>Usage Type:</strong></p><p>{selectedRequest.usageType}</p></div>
                      </div>
                  </div>
                
                <div className="details-table">
                  <Title level={5}>Requested Items:</Title>
                  <Table
                    columns={itemColumns}
                    dataSource={selectedRequest.items}
                    rowKey={(_, index) => index}
                    size="small"
                    pagination={false}
                  />
                  <br></br>
                  <p style={{marginBottom: '30px'}}><strong>Note:</strong> {selectedRequest.message || "No message provided."}</p>
                </div>
                
              </>
            )}
          </Modal>

          <Modal
            title="Confirm Cancellation"
            open={isCancelVisible}
            onCancel={() => setIsCancelVisible(false)}
            onOk={handleCancelRequest}
            zIndex={1009}
            okText="Yes, Cancel"
            cancelText="No"
          >
            <p>Are you sure you want to cancel this request?</p>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default HistoryLog;
