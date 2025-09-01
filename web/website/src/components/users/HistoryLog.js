import React, { useState, useEffect } from "react";
import {
  Layout,
  Typography,
  Modal,
  Descriptions,
  Select,
  Button,
  Spin,
  Tabs,
} from "antd";
import { AppstoreAddOutlined, CloseOutlined, ExperimentOutlined, FileSearchOutlined, LikeOutlined, SendOutlined, TeamOutlined } from "@ant-design/icons";
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import "../styles/usersStyle/ActivityLog.css";
import { getAuth } from "firebase/auth";
import { ClockCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const { Option } = Select; 
const { Content } = Layout;
const { Title } = Typography;
const { TabPane } = Tabs;

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
  {
    title: "Date Required",
    dataIndex: "dateRequired",
    key: "dateRequired",
    className: "table-header",
    align: "center",
    render: (value) => value || "N/A", 
  },
  {
    title: "Items Requested",
    dataIndex: "itemsRequested",
    key: "itemsRequested",
    className: "table-header",
    align: "center",
    render: (items) =>
      Array.isArray(items) && items.length > 0 ? (
        <ul style={{ listStyleType: "disc", paddingLeft: 20, textAlign: "left" }}>
          {items.map((item, idx) => (
            <li key={idx}>
              {item.itemName} ({item.quantity})
            </li>
          ))}
        </ul>
      ) : (
        "N/A"
      ),
  }
];

const HistoryLog = () => {
  const [activityData, setActivityData] = useState([]);
  const [activeTabKey, setActiveTabKey] = useState("pending");
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
  const [selectedActivityLog, setSelectedActivityLog] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

const sanitizeInput = (input) =>
  input.replace(/\s+/g, " ")           // convert multiple spaces to one                    // remove leading/trailing spaces
      .replace(/[^a-zA-Z0-9\s\-.,()]/g, ""); // remove unwanted characters

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
        
        setNotificationMessage("Failed to fetch user requests.");
        setNotificationVisible(true);
      });
  
      // Cleanup listener on unmount
      return () => unsubscribe();

    } catch (err) {
      
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
    setCancelLoading(true);
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
    
      setNotificationMessage("Failed to cancel the request.");
      setNotificationVisible(true);
    } finally {
      setCancelLoading(false);
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

  // useEffect(() => {
  //   const userId = localStorage.getItem("userId");
  //   if (!userId) return;
  
  //   const activityRef = collection(db, `accounts/${userId}/historylog`);
  
  //   const unsubscribe = onSnapshot(
  //     activityRef,
  //     (querySnapshot) => {
  //       const logs = querySnapshot.docs.map((doc, index) => {
  //         const data = doc.data();
  //         const logDate =
  //           data.cancelledAt?.toDate?.() ||
  //           data.timestamp?.toDate?.() ||
  //           new Date();
  
  //         const isCancelled = data.status === "CANCELLED";
  //         const action = isCancelled
  //           ? "Cancelled a request"
  //           : data.action || "Modified a request";
            
  //         const by = 
  //           action === "Request Approved"
  //             ? data.approvedBy
  //             : action === "Request Rejected"
  //             ? data.rejectedBy
  //             : action === "Deployed"
  //             ? data.approvedBy
  //             : data.userName || "Unknown User";
  
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
  //           rawDate: logDate,
  //           action: action,
  //           by: by,
  //           fullData: data,
  //         };
  //       });
  
  //       const sortedLogs = logs.sort((a, b) => b.rawDate - a.rawDate);
  //       setActivityData(sortedLogs);
  //     },
  //     (error) => {
     
  //     }
  //   );
  
  //   // Cleanup the listener when the component unmounts
  //   return () => unsubscribe();
  // }, []);

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
            action,
            by,
            dateRequired: data.dateRequired || "N/A", // ✅ Matches modal display
            itemsRequested:
              (data.filteredMergedData && data.filteredMergedData.length > 0
                ? data.filteredMergedData
                : data.requestList) || [], // ✅ Same fallback as modal
            program: data.program || "N/A", // ✅ Matches modal
            reason:
              action !== "Request Rejected"
                ? data.reason || "N/A"
                : data.reason || data.rejectionReason || "N/A", // ✅ Covers both fields
            room: data.room || "N/A", // ✅ Matches modal
            time:
              data.timeFrom && data.timeTo
                ? `${data.timeFrom} - ${data.timeTo}`
                : "N/A", // ✅ Matches modal
            fullData: data,
          };
        });

        const sortedLogs = logs.sort((a, b) => b.rawDate - a.rawDate);
        setActivityData(sortedLogs);
      },
      (error) => {
        console.error("Error fetching activity logs:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredData = activityData.filter((item) => {
    // Filter by action type
    if (actionFilter !== "ALL" && item.action !== actionFilter) {
      return false;
    }

    const search = searchQuery?.toLowerCase?.() || "";
    const date = item.date || "";
    const action = item.action?.toLowerCase?.() || "";
    const by = item.by?.toLowerCase?.() || "";

    // Filter by search
    return (
      date.includes(search) ||
      action.includes(search) ||
      by.includes(search)
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

  //   const renderPendingTab = () => (
  //   <Content className="pending-content">
  //           <div className="activity-header">
  //     </div>
 
      
  //       {loading ? (
  //         <Spin size="large" />
  //       ) : (
  //         <Table
  // columns={columns}
  // dataSource={requests.filter((item) =>
  //   item.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   item.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   item.usageType.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   (item.courseDescription?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  // )}
  // pagination={{ pageSize: 10 }}
  // rowKey="id"
  // className="pending-table"
  //         />
  //       )}
      
  //     <Modal
  //       className="request-list-modal"
  //       open={viewDetailsModalVisible}
  //       onCancel={handleModalClose}
  //       width={800}
  //       zIndex={1008}
  //       closable={false}
  //       footer={[
  //         <Button key="close" onClick={handleModalClose}>Close</Button>,
  //         <Button key="cancel" danger onClick={() => setIsCancelVisible(true)} icon={<CloseOutlined />}>Cancel Request</Button>,
  //       ]}
  //     >
  //       {selectedRequest && (
  //         <>
  //           <div className="request-details-container" style={{ justifyContent: 'space-between' }}>
  //             <strong style={{ fontSize: '18px', color: 'white' }}>Request Details</strong>
  //             {/* <span style={{ fontSize: 12, color: 'white' }}>{selectedRequest?.id}</span> */}
  //           </div>
  //           <div className="request-details-whole">
  //             <div className="request-details-left">
  //               <div><p><strong>Requester:</strong></p><p>{selectedRequest.requester}</p></div>
  //               <div><p><strong>Requisition Date:</strong></p><p>{selectedRequest.dateRequested}</p></div>
  //               <div><p><strong>Date Required:</strong></p><p>{selectedRequest.dateRequired}</p></div>
  //               <div><p><strong>Time Needed:</strong></p><p>{selectedRequest.timeNeeded}</p></div>
  //             </div>
  //             <div className="request-details-right">
  //               <div><p><strong>Course Code:</strong></p><p>{selectedRequest.courseCode}</p></div>
  //               <div><p><strong>Course Description:</strong></p><p>{selectedRequest.requester}</p></div>
  //               <div><p><strong>Room:</strong></p><p>{selectedRequest.room}</p></div>
  //               <div><p><strong>Usage Type:</strong></p><p>{selectedRequest.usageType}</p></div>
  //             </div>
  //           </div>
  //           <div className="details-table">
  //             <Title level={5}>Requested Items:</Title>
  //             <Table
  //               columns={itemColumns}
  //               dataSource={selectedRequest.items}
  //               rowKey={(_, index) => index}
  //               size="small"
  //               pagination={false}
  //             />
  //             <br />
  //             <p style={{ marginBottom: '30px' }}><strong>Note:</strong> {selectedRequest.message || "No message provided."}</p>
  //           </div>
  //         </>
  //       )}
  //     </Modal>

  //     <Modal
  //       title="Confirm Cancellation"
  //       open={isCancelVisible}
  //       onCancel={() => setIsCancelVisible(false)}
  //       onOk={handleCancelRequest}
  //       zIndex={1009}
  //       okText="Yes, Cancel"
  //       cancelText="No"
  //     >
  //       <p>Are you sure you want to cancel this request?</p>
  //     </Modal>
  //   </Content>
  // );

  const getUsageIcon = (usageType) => {
  switch (usageType) {
    case "Research":
      return <FileSearchOutlined style={{ fontSize: 20 }} />;
    case "Laboratory Experiment":
      return <ExperimentOutlined style={{ fontSize: 20 }} />;
    case "Community Extension":
      return <TeamOutlined style={{ fontSize: 20 }} />;
    case "Others":
    default:
      return <AppstoreAddOutlined style={{ fontSize: 20 }} />;
  }
};

const getBGColor = (modalBG) => {
  switch (modalBG){
    case "Request Approved":
      return "#081538"
    case "Deployed":
      return "#2596be"
    case "Returned":
      return "#056625ff"
  }
}

const getLabel = (modalLabel) => {
  switch (modalLabel){
    case "Request Approved":
      return "APPROVED"
    case "Deployed":
      return "DEPLOYED"
    case "Returned":
      return "COMPLETED"
  }
}
const getIcon = (modalIcon) => {
  switch (modalIcon){
    case "Request Approved":
      return <LikeOutlined style={{fontSize: 23, color: 'white'}}/>
    case "Deployed":
      return <SendOutlined style={{fontSize: 23, color: 'white'}}/>
    case "Returned":
      return <CheckCircleOutlined style={{fontSize: 23, color: 'white'}}/>
  }
}



const renderPendingTab = () => (
  <Content className="pending-content">
    <div style={{display: 'flex', gap: 10, alignItems: 'flex-start'}}>
    <ClockCircleOutlined style={{fontSize: 28, color: 'orange', paddingTop: 10}}/>

    <div>
      <h1 style={{ color:'orange', margin: 0, padding: 0, textDecoration: 'none'}}>Pending Requisitions</h1>
      <p>Please wait for your requisitions to be approved by the stockroom personnels/laboratory technicians.</p>
      </div>
      </div>
    {loading ? (
      <Spin size="large" />
    ) : (
      <div className="pending-cards">
        {requests
          .filter((item) =>
            item.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.usageType.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.courseDescription?.toLowerCase() || "").includes(searchQuery.toLowerCase())
          )
          .map((item) => (
            <div
              key={item.id}
              className="request-card"
              onClick={() => {
                setSelectedRequest(item);
                setViewDetailsModalVisible(true);
              }}
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "16px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                cursor: "pointer",
                transition: "0.2s ease-in-out",
                display: 'flex',  
                flexDirection: 'column',
       
              }}
            >

           
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e1e1e1', paddingBottom: 10}}>
              <p style={{fontWeight: 'bold', backgroundColor: 'orange', margin: 0,paddingTop: 4, paddingBottom: 4, paddingLeft: 10, paddingRight: 10, color: 'white', borderRadius: 3, fontSize: 15}}>PENDING</p>
              <p style={{padding: 0, margin: 0, fontSize: 15, fontWeight: 300}}> Date Submitted: {item.dateRequested} </p>
              </div> 

              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10, marginTop: 10 }}>
                {getUsageIcon(item.usageType)}
                <h3 style={{ marginBottom: "8px", margin: 0, padding: 0 }}>{item.usageType}</h3>
              </div>

              <div style={{display: 'flex', justifyContent: 'space-between', padding: 10, backgroundColor: '#e9f5f9', borderRadius: 7, paddingBottom: 0}}>
                <div>     
              <p><strong>Requester:</strong> {item.requester}</p>
              <p><strong>Date Required:</strong> {item.dateRequired}</p>
              
              {/* <p><strong>Usage Type:</strong> {item.courseCode} - {item.courseDescription}</p> */}
              </div>

              <div>
                <p><strong>Time Needed:</strong> {item.timeNeeded}</p>
                <p><strong>Room:</strong> {item.room}</p>
              </div>

              <div style={{ width: 250}}>
              {item.items && item.items.length > 0 && (
                  <div>
                    <strong>Requested Items:</strong>
                    <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                      {item.items.map((reqItem, idx) => (
                        <li key={idx}>
                          {reqItem.itemName} ({reqItem.quantity})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                </div>
                </div>
                          </div>
          ))}
          
      </div>
    )}

    {/* Request Details Modal */}
    <Modal
      className="request-list-modal"
      open={viewDetailsModalVisible}
      onCancel={handleModalClose}
      width={800}
      zIndex={1008}
      closable={false}
      footer={[
        <Button key="close" onClick={handleModalClose}>Close</Button>,
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
        <div style={{paddingTop: 20}}>
          <div
            className="pending-modal-header" style={{backgroundColor: '#e68020ff', position: 'absolute', top: 0, left: 0, borderRadius: '5px 5px 0 0', height: 60, width: '100%', display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 20}}
          >
            <ClockCircleOutlined style={{color: 'white', fontSize: 25}}/>
            <strong style={{ fontSize: "20px", color: "white" }}>Requisition Slip - PENDING</strong>
          </div>

          <div className="details-table">
            <Title level={5}>Request Details:</Title>
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, sm: 1, md: 2 }} // responsive: 1 col on mobile, 2 cols on desktop
            style={{marginBottom: 30}}
          >
            <Descriptions.Item label="Requester">
              {selectedRequest.requester}
            </Descriptions.Item>
            <Descriptions.Item label="Course Code">
              {selectedRequest.courseCode}
            </Descriptions.Item>

            <Descriptions.Item label="Requisition Date">
              {selectedRequest.dateRequested}
            </Descriptions.Item>
            <Descriptions.Item label="Course Description">
              {selectedRequest.courseDescription}
            </Descriptions.Item>

            <Descriptions.Item label="Date Required">
              {selectedRequest.dateRequired}
            </Descriptions.Item>
            <Descriptions.Item label="Room">
              {selectedRequest.room}
            </Descriptions.Item>

            <Descriptions.Item label="Time Needed">
              {selectedRequest.timeNeeded}
            </Descriptions.Item>
            <Descriptions.Item label="Usage Type">
              {selectedRequest.usageType}
            </Descriptions.Item>
          </Descriptions>

  
<Title level={5}>Items:</Title>
<table style={{ width: "100%", borderCollapse: "collapse" }}>
  <thead>
    <tr>
      {itemColumns.map((col) => (
        <th
          key={col.key || col.dataIndex}
          style={{
            border: "1px solid #ddd",
            padding: "8px",
            textAlign: "left",
            background: "#f5f5f5",
          }}
        >
          {col.title}
        </th>
      ))}
    </tr>
  </thead>
  <tbody>
    {selectedRequest.items.map((item, index) => (
      <tr key={index}>
        {itemColumns.map((col) => (
          <td
            key={col.key || col.dataIndex}
            style={{ border: "1px solid #ddd", padding: "8px" }}
          >
            {col.render
              ? col.render(item[col.dataIndex], item, index)
              : item[col.dataIndex]}
          </td>
        ))}
      </tr>
    ))}
  </tbody>
</table>

            <br />
            <p style={{ marginBottom: "30px" }}>
              <strong>Note:</strong> {selectedRequest.message || "No message provided."}
            </p>
          </div>
        </div>
      )}
    </Modal>

    {/* Cancel Request Modal */}
    <Modal
      title="Confirm Cancellation"
      open={isCancelVisible}
      onCancel={() => setIsCancelVisible(false)}
      onOk={handleCancelRequest}
      zIndex={1009}
      okText="Yes, Cancel"
      cancelText="No"
      okButtonProps={{ loading: cancelLoading }}
    >
      <p>Are you sure you want to cancel this request?</p>
    </Modal>
  </Content>
);


// Assuming you only need Approved requests
// const renderApprovedTab = () => {
//   const approvedData = filteredData.filter((item) => item.action === 'Request Approved');

//   return (
//     <Content className="approved-content">
//       {loading ? (
//         <Spin size="large" />
//       ) : (
//         <Table
//           columns={columns2}
//           dataSource={approvedData}
//           pagination={{ pageSize: 10 }}
//           rowKey="id"
//           bordered
//           onRow={(record) => ({
//             onClick: () => handleRowClick(record), // Make the row clickable
//           })}
//           locale={{
//             emptyText: (
//               <div className="empty-row">
//                 <span>No activity found.</span>
//               </div>
//             ),
//           }}
//         />
//       )}
//     </Content>
//   );
// };

const renderApprovedTab = () => {
  const approvedData = filteredData.filter((item) => item.action === "Request Approved");

  return (
    <Content className="pending-content">
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start"}}>
        <LikeOutlined style={{ fontSize: 28, color: "#0f3c4c", paddingTop: 10 }} />
        <div>
          <h1 style={{ color: "#0f3c4c", margin: 0, padding: 0, textDecoration: "none" }}>
            Approved Requisitions
          </h1>
          <p>These requisitions have already been approved by the stockroom personnels/laboratory technicians.</p>
        </div>
      </div>

      {loading ? (
        <Spin size="large" />
      ) : (
        <div className="approved-cards">
          {approvedData.length > 0 ? (
            approvedData.map((item) => (
              <div
                key={item.id}
               className="request-card"
                onClick={() => handleRowClick(item)}
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "16px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                  cursor: "pointer",
                  transition: "0.2s ease-in-out",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Status + Date */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #e1e1e1",
                    paddingBottom: 10,
                  }}
                >
                  <p
                    style={{
                      fontWeight: "bold",
                      backgroundColor: "#0f3c4c",
                      margin: 0,
                      paddingTop: 4,
                      paddingBottom: 4,
                      paddingLeft: 10,
                      paddingRight: 10,
                      color: "white",
                      borderRadius: 3,
                      fontSize: 15,
                    }}
                  >
                    APPROVED
                  </p>
                  <p style={{ padding: 0, margin: 0, fontSize: 15}}>
                    <strong>Approved by:</strong>  {item.fullData.approvedBy}
                  </p>
                </div>

                {/* Usage Type */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginBottom: 10,
                    marginTop: 10,
                  }}
                >
                  {getUsageIcon(item.fullData.usageType)}
                  <h3 style={{ marginBottom: "8px", margin: 0, padding: 0 }}>{item.fullData.usageType}</h3>
                </div>

                {/* Info Section */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: 10,
                    backgroundColor: "#e9f5f9",
                    borderRadius: 7,
                    paddingBottom: 0,
                  }}
                >
                  <div>
                    <p>
                      <strong>Requester:</strong> {item.fullData.userName}
                    </p>
                    <p>
                      <strong>Date Required:</strong> {item.dateRequired}
                    </p>
                  </div>

                  <div>
                    <p>
                      <strong>Time Needed:</strong> {item.fullData.timeFrom} - {item.fullData.timeTo}
                    </p>
                    <p>
                      <strong>Room:</strong> {item.room}
                    </p>
                  </div>

<div style={{ width: 250 }}>
  {item.requestList && item.requestList.length > 0 && (
    <div>
      <strong>Requested Items:</strong>
      <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
        {item.requestList.map((req, idx) => (
          <li key={idx}>
            {req.itemName} - {req.department}
            <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: 13 }}>
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )}
</div>

                </div>
              </div>
            ))
          ) : (
            <div className="empty-row">
              <span>No approved requisitions found.</span>
            </div>
          )}
        </div>
      )}
    </Content>
  );
};


const renderDeployedTab = () => {
  const deployedData = filteredData.filter((item) => item.action === "Deployed");
console.log(deployedData);
  return (
    <Content className="pending-content">
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start"}}>
        <SendOutlined style={{ fontSize: 28, color: "#66b6d2", paddingTop: 10 }} />
        <div>
          <h1 style={{ color: "#66b6d2", margin: 0, padding: 0, textDecoration: "none" }}>
            Deployed Requisitions
          </h1>
          <p>Please return the borrowed items to the stockroom and proceed to the "Return Items" page to complete this requisition.</p>
        </div>
      </div>

      {loading ? (
        <Spin size="large" />
      ) : (
        <div className="approved-cards">
          {deployedData.length > 0 ? (
            deployedData.map((item, index) => {
              console.log(item); // Debugging the structure of each item
              return (
                <div
                  key={item.id || index} // Fallback to index if id is not unique
                  className="request-card"
                  onClick={() => handleRowClick(item)}
                  style={{
                    border: "1px solid #e0e0e0",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "16px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                    cursor: "pointer",
                    transition: "0.2s ease-in-out",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Status + Date */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid #e1e1e1",
                      paddingBottom: 10,
                    }}
                  >
                    <p
                      style={{
                        fontWeight: "bold",
                        backgroundColor: "#2596be",
                        margin: 0,
                        paddingTop: 4,
                        paddingBottom: 4,
                        paddingLeft: 10,
                        paddingRight: 10,
                        color: "white",
                        borderRadius: 3,
                        fontSize: 15,
                      }}
                    >
                      DEPLOYED
                    </p>
                  <p style={{ padding: 0, margin: 0, fontSize: 15}}>
                    <strong>Approved by:</strong>  {item.fullData.approvedBy}
                  </p>
                  </div>

                  {/* Usage Type */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginBottom: 10,
                      marginTop: 10,
                    }}
                  >
                    {getUsageIcon(item.fullData.usageType)}
                    <h3 style={{ marginBottom: "8px", margin: 0, padding: 0 }}>{item.fullData.usageType}</h3>
                  </div>

                  {/* Info Section */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: 10,
                      backgroundColor: "#e9f5f9",
                      borderRadius: 7,
                      paddingBottom: 0,
                    }}
                  >
                    <div key={index}>
                      <p>
                        <strong>Requester:</strong> {item.fullData.userName}
                      </p>
                      <p>
                        <strong>Date Required:</strong> {item.dateRequired}
                      </p>
                    </div>

                    <div>
                      <p>
                    <strong>Time Needed:</strong> {item.fullData.timeFrom} - {item.fullData.timeTo}
                      </p>
                      <p>
                        <strong>Room:</strong> {item.room}
                      </p>
                    </div>

                    <div style={{ width: 250 }}>
                      {item.requestList && item.requestList.length > 0 && (
                        <div>
                          <strong>Requested Items:</strong>
                          <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                            {item.requestList.map((req, idx) => (
                              <li key={idx}>
                                {req.itemName} - {req.department}
                                <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: 13 }}></ul>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-row">
              <span>No deployed requisitions found.</span>
            </div>
          )}
        </div>
      )}
    </Content>
  );
};


const renderReturnedTab = () => {
  const returnedData = filteredData.filter((item) => item.action === 'Returned');

console.log(returnedData);
  return (
    <Content className="pending-content">
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start"}}>
        <CheckCircleOutlined style={{ fontSize: 28, color: "#37c225ff", paddingTop: 10 }} />
        <div>
          <h1 style={{ color: "#37c225ff", margin: 0, padding: 0, textDecoration: "none" }}>
            Completed Requisitions
          </h1>
          <p>These requisitions have been completed and will automatically be removed 7 days after completion.</p>
        </div>
      </div>

      {loading ? (
        <Spin size="large" />
      ) : (
        <div className="approved-cards">
          {returnedData.length > 0 ? (
            returnedData.map((item, index) => {
              console.log(item); // Debugging the structure of each item
              return (
                <div
                  key={item.id || index} // Fallback to index if id is not unique
                  className="request-card"
                  onClick={() => handleRowClick(item)}
                  style={{
                    border: "1px solid #e0e0e0",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "16px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                    cursor: "pointer",
                    transition: "0.2s ease-in-out",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Status + Date */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid #e1e1e1",
                      paddingBottom: 10,
                    }}
                  >
                    <p
                      style={{
                        fontWeight: "bold",
                        backgroundColor: "#37c225ff",
                        margin: 0,
                        paddingTop: 4,
                        paddingBottom: 4,
                        paddingLeft: 10,
                        paddingRight: 10,
                        color: "white",
                        borderRadius: 3,
                        fontSize: 15,
                      }}
                    >
                      COMPLETED
                    </p>
                    <p style={{ padding: 0, margin: 0, fontSize: 15, fontWeight: 300 }}>
                      Date Approved: {item.dateApproved || item.dateRequested}
                    </p>
                  </div>

                  {/* Usage Type */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginBottom: 10,
                      marginTop: 10,
                    }}
                  >
                    {getUsageIcon(item.usageType)}
                    <h3 style={{ marginBottom: "8px", margin: 0, padding: 0 }}>{item.usageType}</h3>
                  </div>

                  {/* Info Section */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: 10,
                      backgroundColor: "#e9f5f9",
                      borderRadius: 7,
                      paddingBottom: 0,
                    }}
                  >
                    <div key={index}>
                      <p>
                        <strong>Requester:</strong> {item.fullData.userName}
                      </p>
                      <p>
                        <strong>Date Required:</strong> {item.dateRequired}
                      </p>
                    </div>

                    <div>
                      <p>
                    <strong>Time Needed:</strong> {item.fullData.timeFrom} - {item.fullData.timeTo}
                      </p>
                      <p>
                        <strong>Room:</strong> {item.room}
                      </p>
                    </div>

                    <div style={{ width: 250 }}>
                      {item.requestList && item.requestList.length > 0 && (
                        <div>
                          <strong>Requested Items:</strong>
                          <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                            {item.requestList.map((req, idx) => (
                              <li key={idx}>
                                {req.itemName} - {req.department}
                                <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: 13 }}></ul>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-row">
              <span>No completed requisitions found.</span>
            </div>
          )}
        </div>
      )}
    </Content>
  );
};

// const ProcessedTab = () => {
//   const [activeTab, setActiveTab] = useState('APPROVED');

//   const getTabData = (type) => {
//     return filteredData.filter((item) => {
//       if (type === 'APPROVED') return item.action === 'Request Approved';
//       if (type === 'REJECTED') return item.action === 'Request Rejected';
//       if (type === 'CANCELLED') return item.action === 'Cancelled a request';
//       if (type === 'DEPLOYED') return item.action === 'Deployed';
//       return true;
//     });
//   };

//   const tabData = getTabData(activeTab);

//   return (
//     <Content className="activity-content">
//       <div className="activity-controls">

//       </div>

//       <Tabs activeKey={activeTab} onChange={setActiveTab}>
//         <TabPane tab={`Approved (${getTabData('APPROVED').length})`} key="APPROVED" />
//         <TabPane tab={`Deployed (${getTabData('DEPLOYED').length})`} key="DEPLOYED" />
//         <TabPane tab={`Rejected (${getTabData('REJECTED').length})`} key="REJECTED" />
//         <TabPane tab={`Cancelled (${getTabData('CANCELLED').length})`} key="CANCELLED" />
//       </Tabs>

//       <Table
//         columns={columns2}
//         dataSource={tabData}
//         pagination={{ pageSize: 10 }}
//         bordered
//         className="activity-table"
//         rowClassName="activity-row"
//         onRow={(record) => ({ onClick: () => handleRowClick(record) })}
//         locale={{
//           emptyText: (
//             <div className="empty-row">
//               <span>No activity found.</span>
//             </div>
//           ),
//         }}
//       />

//       <Modal
//         title="Activity Details"
//         visible={modalVisible}
//         zIndex={1015}
//         onCancel={() => setModalVisible(false)}
//         footer={null}
//       >
//         {selectedLog && (
//           <Descriptions column={1} bordered size="small">
//             <Descriptions.Item label="Action">
//               {selectedLog.status === 'CANCELLED'
//                 ? 'Cancelled a request'
//                 : selectedLog.action || 'Modified a request'}
//             </Descriptions.Item>

//             <Descriptions.Item label="By">
//               {selectedLog.userName || 'Unknown User'}
//             </Descriptions.Item>

//             <Descriptions.Item label="Program">
//               {selectedLog.program || 'N/A'}
//             </Descriptions.Item>

//             <Descriptions.Item label="Items Requested">
//               {(selectedLog.filteredMergedData || selectedLog.requestList)?.length > 0 ? (
//                 <ul style={{ paddingLeft: 20 }}>
//                   {(selectedLog.filteredMergedData || selectedLog.requestList).map((item, index) => (
//                     <li key={index} style={{ marginBottom: 10 }}>
//                       <strong>{item.itemName}</strong>
//                       <ul style={{ marginLeft: 20 }}>
//                         <li>Quantity: {item.quantity}</li>
//                         {(item.category === 'Chemical' || item.category === 'Reagent') && item.unit && (
//                           <li>Unit: {item.unit}</li>
//                         )}
//                         {item.category && <li>Category: {item.category}</li>}
//                         {item.category === 'Glasswares' && item.volume && (
//                           <li>Volume: {item.volume}</li>
//                         )}
//                         {item.labRoom && <li>Lab Room: {item.labRoom}</li>}
//                         {item.usageType && <li>Usage Type: {item.usageType}</li>}
//                         {item.itemType && <li>Item Type: {item.itemType}</li>}
//                         {item.department && <li>Department: {item.department}</li>}
//                         {selectedLog.action === 'Request Rejected' && (item.reason || item.rejectionReason) && (
//                           <>
//                             {item.reason && <li><strong>Reason:</strong> {item.reason}</li>}
//                             {item.rejectionReason && <li><strong>Rejection Reason:</strong> {item.rejectionReason}</li>}
//                           </>
//                         )}
//                       </ul>
//                     </li>
//                   ))}
//                 </ul>
//               ) : 'None'}
//             </Descriptions.Item>
//             {selectedLog.action !== 'Request Rejected' && (
//               <Descriptions.Item label="Reason">
//                 {selectedLog.reason || 'N/A'}
//               </Descriptions.Item>
//             )}
//             <Descriptions.Item label="Room">
//               {selectedLog.room || 'N/A'}
//             </Descriptions.Item>
//             <Descriptions.Item label="Time">
//               {selectedLog.timeFrom && selectedLog.timeTo
//                 ? `${selectedLog.timeFrom} - ${selectedLog.timeTo}`
//                 : 'N/A'}
//             </Descriptions.Item>
//             <Descriptions.Item label="Date Required">
//               {selectedLog.dateRequired || 'N/A'}
//             </Descriptions.Item>
//           </Descriptions>
//         )}
//       </Modal>
//     </Content>
//   );
// };

  const loadImageAsDataURL = async (url) => {
  try {
    const res = await fetch(url, { cache: "force-cache" });
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return ""; // skip logo if it can't be loaded
  }
};

const formatDateTimePH = (d = new Date()) => {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

// Call this from your component: handleGeneratePDF(selectedLog)
// Put NULS_Favicon.png in /public/images/NULS_Favicon.png

const handleGeneratePDF = async () => {
  if (!selectedLog) {
    alert("No data to export.");
    return;
  }

  // unify items the same way your modal does
  const rawItems =
    (selectedLog.filteredMergedData && selectedLog.filteredMergedData.length > 0
      ? selectedLog.filteredMergedData
      : selectedLog.requestList) || [];

  // normalize item fields for the PDF table
  const items = rawItems.map((it) => {
    const unitOrVol =
      (["Chemical", "Reagent"].includes(it.category) && it.unit) ? `Unit: ${it.unit}` :
      (it.category === "Glasswares" && it.volume) ? `Volume: ${it.volume}` : "";
    return {
      itemId: it.itemIdFromInventory || "N/A",
      name: it.itemName || "",
      qty: it.quantity ?? "",
      category: it.category || "",
      unitOrVol,
      department: it.department || ""
    };
  });

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;

  // logo from /public/images
  const logoDataURL = await loadImageAsDataURL("/NULS_Favicon.png");
  const printedOn = formatDateTimePH();

  const drawHeader = () => {
  // logo
  if (logoDataURL) {
    doc.addImage(logoDataURL, "PNG", marginX, 10, 12, 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("NULS", marginX + 16, 18); // just right of the logo
  }

  // title centered
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("REQUEST SLIP", pageWidth / 2, 18, { align: "center" });

  // underline separator
  doc.setDrawColor(180);
  doc.setLineWidth(0.2);
  doc.line(marginX, 22, pageWidth - marginX, 22);
};

  const drawFooter = () => {
    const pageCount = doc.internal.getNumberOfPages();
    const pageCurrent = doc.internal.getCurrentPageInfo().pageNumber;

    doc.setDrawColor(200);
    doc.setLineWidth(0.2);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Printed on: ${printedOn}`, marginX, pageHeight - 7);
    doc.text(`Page ${pageCurrent} of ${pageCount}`, pageWidth - marginX, pageHeight - 7, { align: "right" });
  };

  drawHeader();

  // DETAILS (align with your modal fields)
  const timeText =
    selectedLog.timeFrom && selectedLog.timeTo
      ? `${selectedLog.timeFrom} – ${selectedLog.timeTo}`
      : "N/A";

  const details = [
    ["Approved By", selectedLog.approvedBy || (selectedLog.status === "CANCELLED" ? "Cancelled a request" : "Modified a request") || "N/A"],
    ["Program", selectedLog.program || "N/A"],
    ["Room", selectedLog.room || "N/A"],
    ["Requester", selectedLog.userName || "Unknown User"],
    ["Time", timeText],
    ["Date Required", selectedLog.dateRequired || "N/A"],
    // Only show note if not a rejection, like in your modal
    ...(selectedLog.action !== "Request Rejected"
      ? [["Note", selectedLog.reason || "N/A"]]
      : []),
  ];

  autoTable(doc, {
    startY: 26,
    theme: "plain",
    styles: { font: "helvetica", fontSize: 11, cellPadding: { top: 1.5, bottom: 1.5, left: 0, right: 0 } },
    columnStyles: {
      0: { cellWidth: (pageWidth - marginX * 2) * 0.28, fontStyle: "bold" },
      1: { cellWidth: (pageWidth - marginX * 2) * 0.72 },
    },
    margin: { left: marginX, right: marginX },
    head: [],
    body: details,
    didDrawPage: () => {
      drawHeader();
      drawFooter();
    },
  });

  // Section title
  let yAfterDetails = doc.lastAutoTable.finalY + 6;
  if (yAfterDetails + 10 > pageHeight - 20) {
    doc.addPage();
    drawHeader();
    yAfterDetails = 26;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Items Requested", marginX, yAfterDetails);

  // ITEMS TABLE (includes Item ID + Unit/Volume + Department like your modal)
  autoTable(doc, {
    startY: yAfterDetails + 3,
    head: [["Item ID", "Item Name", "Quantity", "Category", "Unit / Volume", "Department"]],
    body: items.map((it) => [it.itemId, it.name, it.qty, it.category, it.unitOrVol, it.department]),
    theme: "grid",
    styles: { font: "helvetica", fontSize: 10, lineColor: 200, lineWidth: 0.2 },
    headStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: (pageWidth - marginX * 2) * 0.14 }, // Item ID
      1: { cellWidth: (pageWidth - marginX * 2) * 0.30 }, // Name
      2: { cellWidth: (pageWidth - marginX * 2) * 0.10, halign: "right" }, // Qty
      3: { cellWidth: (pageWidth - marginX * 2) * 0.14 }, // Category
      4: { cellWidth: (pageWidth - marginX * 2) * 0.16 }, // Unit / Volume
      5: { cellWidth: (pageWidth - marginX * 2) * 0.16 }, // Department
    },
    margin: { left: marginX, right: marginX },
    didDrawPage: () => {
      drawHeader();
      drawFooter();
    },
  });

  // Signature block
  let y = doc.lastAutoTable.finalY + 12;
  if (y + 30 > pageHeight - 20) {
    doc.addPage();
    drawHeader();
    y = 30;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Requested by:", marginX, y);
  doc.text("Approved by:", pageWidth / 2, y);

  doc.line(marginX, y + 14, marginX + 70, y + 14);
  doc.line(pageWidth / 2, y + 14, pageWidth / 2 + 70, y + 14);

  doc.setFontSize(9);
  doc.text("(Signature over printed name & date)", marginX, y + 19);
  doc.text("(Signature over printed name & date)", pageWidth / 2, y + 19);

  const safeDate = new Date().toISOString().slice(0, 10);
  doc.save(`request-slip_${safeDate}.pdf`);
};

// Put NULS_Favicon.png in /public/images/NULS_Favicon.png

const handlePrint = () => {
  if (!selectedLog) {
    alert("No data to print.");
    return;
  }

  const esc = (v) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const rawItems =
    (selectedLog.filteredMergedData && selectedLog.filteredMergedData.length > 0
      ? selectedLog.filteredMergedData
      : selectedLog.requestList) || [];

  const items = rawItems.map((it) => {
    const unitOrVol =
      (["Chemical", "Reagent"].includes(it.category) && it.unit) ? `Unit: ${it.unit}` :
      (it.category === "Glasswares" && it.volume) ? `Volume: ${it.volume}` : "";
    return {
      itemId: it.itemIdFromInventory || "N/A",
      name: it.itemName || "",
      qty: it.quantity ?? "",
      category: it.category || "",
      unitOrVol,
      department: it.department || ""
    };
  });

  const timeText =
    selectedLog.timeFrom && selectedLog.timeTo
      ? `${esc(selectedLog.timeFrom)} – ${esc(selectedLog.timeTo)}`
      : "N/A";

  const printedOn = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  const htmlContent = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Request Slip</title>
  <style>
    :root { --text:#111; --muted:#555; --line:#ddd; --accent:#0f172a; }
    @page { size:A4; margin:18mm 14mm 18mm 14mm; }
    *{box-sizing:border-box} html,body{height:100%}
    body{font-family:Arial,Helvetica,sans-serif;color:var(--text);line-height:1.35;-webkit-print-color-adjust:exact;print-color-adjust:exact;margin:0}
    .header{position:fixed;top:0;left:0;right:0;padding:8mm 14mm 4mm;border-bottom:1px solid var(--line)}
    .footer{position:fixed;bottom:0;left:0;right:0;padding:4mm 14mm 8mm;border-top:1px solid var(--line);font-size:10px;color:var(--muted);display:flex;justify-content:space-between;align-items:center}
    .pagenum:after{content:counter(page)} .pagecount:after{content:counter(pages)}
    .brand{display:flex;align-items:center;gap:10px} .brand img{width:28px;height:28px;object-fit:contain} .brand .title{font-weight:bold;letter-spacing:.4px}
    .doc-title{text-align:center;font-weight:bold;font-size:16px;margin:0;color:var(--accent)}
    .content{padding:28mm 14mm 22mm}
    .details{display:grid;grid-template-columns:28% 72%;column-gap:12px;row-gap:6px;font-size:12px;margin:8px 0 14px}
    .label{font-weight:bold;color:var(--muted)} .value{color:var(--text);word-break:break-word}
    .section-title{font-weight:bold;font-size:13px;margin:14px 0 6px}
    table{width:100%;border-collapse:collapse;font-size:11px;page-break-inside:auto}
    thead{display:table-header-group} tr{page-break-inside:avoid;page-break-after:auto}
    th,td{border:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
    thead th{background:#f4f6f8;font-weight:bold} td.qty{text-align:right}
    .sig-row{display:grid;grid-template-columns:1fr 1fr;column-gap:18mm;margin-top:16px}
    .sig{margin-top:18px;font-size:11px} .sig .line{height:1px;background:var(--line);margin:28px 0 4px} .sig small{color:var(--muted)}
    @media screen{body{background:#f2f2f2}.sheet{background:#fff;width:210mm;min-height:297mm;margin:0 auto;box-shadow:0 2px 10px rgba(0,0,0,.1)}}
  </style>
</head>
<body>
    <div class="header">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div class="brand" style="display:flex; align-items:center; gap:8px;">
        <img src="/NULS_Favicon.png" alt="Logo" style="width:28px; height:28px; object-fit:contain;" />
        <div class="title" style="font-weight:bold; font-size:13px;">NULS</div>
      </div>
      <h1 class="doc-title" style="margin:0; font-size:16px; font-weight:bold; color:#0f172a; text-align:center;">
        REQUEST SLIP
      </h1>
      <div style="width:28px;"></div> <!-- keeps spacing symmetric -->
    </div>
  </div>


  <div class="footer">
    <div>Printed on: ${esc(printedOn)}</div>
    
  </div>

  <div class="sheet">
    <div class="content">
      <div class="details">
        <div class="label">Approved By</div><div class="value">${esc(selectedLog.approvedBy || (selectedLog.status === "CANCELLED" ? "Cancelled a request" : "Modified a request") || "N/A")}</div>
        <div class="label">Program</div><div class="value">${esc(selectedLog.program || "N/A")}</div>
        <div class="label">Room</div><div class="value">${esc(selectedLog.room || "N/A")}</div>
        <div class="label">Requester</div><div class="value">${esc(selectedLog.userName || "Unknown User")}</div>
        <div class="label">Time</div><div class="value">${timeText}</div>
        <div class="label">Date Required</div><div class="value">${esc(selectedLog.dateRequired || "N/A")}</div>
        ${
          selectedLog.action !== "Request Rejected"
            ? `<div class="label">Note</div><div class="value">${esc(selectedLog.reason || "N/A")}</div>`
            : ""
        }
      </div>

      <div class="section-title">Items Requested</div>
      <table>
        <thead>
          <tr>
            <th style="width:14%;">Item ID</th>
            <th style="width:30%;">Item Name</th>
            <th style="width:10%;">Quantity</th>
            <th style="width:14%;">Category</th>
            <th style="width:16%;">Unit / Volume</th>
            <th style="width:16%;">Department</th>
          </tr>
        </thead>
        <tbody>
          ${
            items.length === 0
              ? `<tr><td colspan="6" style="text-align:center;color:#888;">No items</td></tr>`
              : items.map((it) => `
                <tr>
                  <td>${esc(it.itemId)}</td>
                  <td>${esc(it.name)}</td>
                  <td class="qty">${esc(it.qty)}</td>
                   <td>${esc(it.unitOrVol)}</td>
                  <td>${esc(it.category)}</td>
                  <td>${esc(it.department)}</td>
                </tr>
              `).join("")
          }
        </tbody>
      </table>

      <div class="sig-row">
        <div class="sig">
          <div>Requested by:</div>
          <div class="line"></div>
          <small>(Signature over printed name & date)</small>
        </div>
        <div class="sig">
          <div>Approved by:</div>
          <div class="line"></div>
          <small>(Signature over printed name & date)</small>
        </div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function(){ window.print(); };
  </script>
</body>
</html>
  `;

  const w = window.open("", "_blank");
  if (!w) {
    alert("Popup blocked. Please allow popups to print.");
    return;
  }
  w.document.open();
  w.document.write(htmlContent);
  w.document.close();
};


  return (
    <Layout style={{ minHeight: "100vh"}}>
<Tabs
  activeKey={activeTabKey}
  onChange={(key) => setActiveTabKey(key)}
  className="two-step-tabs"
  items={[
    {
      key: "pending",
      label: (
        <>
          <ClockCircleOutlined style={{ marginRight: 8 }} />
          Step 1: Pending
        </>
      ),
      children: renderPendingTab(),  
    },
    {
      key: "approved",
      label: (
        <>
          <CheckCircleOutlined style={{ marginRight: 8 }} />
          Step 2: Approved
        </>
      ),
      children: renderApprovedTab(),  
    },
    {
      key: 'deployed',
      label: (        
        <>
        <CheckCircleOutlined style={{ marginRight: 8 }} />
        Step 3: Deployed
        </>
      ),
      children: renderDeployedTab(),
    },
     {
      key: 'completed',
      label: (
        <>
        <CheckCircleOutlined style={{ marginRight: 8 }} />
        Step 4: Completed
        </>
      ),
      children: renderReturnedTab(),
    },
  ]}
/>

     
      <Modal
        visible={modalVisible}
        zIndex={1015}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        className="other-modal"
      >
        {selectedLog && (
          <div style={{paddingTop: 50}}>
              <div className="modal-header" style={{backgroundColor: getBGColor(selectedLog.action)}}>
                {getIcon(selectedLog.action)}
                <p style={{fontSize: 20, margin: 0, color: 'white', fontWeight: 600}}>Requisition Slip - {getLabel(selectedLog.action)}</p>
              </div>
<div id="activity-details-content">
  <Title level={5}>Request Details:</Title>
 <Descriptions
  bordered
  size="small"
  column={{ xs: 1, sm: 1, md: 2 }} // responsive 2 cols
>
  <Descriptions.Item label="Approved By">
    {selectedLog.status === 'CANCELLED'
      ? 'Cancelled a request'
      : selectedLog.approvedBy || 'Modified a request'}
  </Descriptions.Item>

  <Descriptions.Item label="Program">
    {selectedLog.program || 'N/A'}
  </Descriptions.Item>

  <Descriptions.Item label="Room">
    {selectedLog.room || 'N/A'}
  </Descriptions.Item>

    <Descriptions.Item label="Requester">
    {selectedLog.userName || 'Unknown User'}
  </Descriptions.Item>

  <Descriptions.Item label="Time">
    {selectedLog.timeFrom && selectedLog.timeTo
      ? `${selectedLog.timeFrom} - ${selectedLog.timeTo}`
      : 'N/A'}
  </Descriptions.Item>

  <Descriptions.Item label="Date Required">
    {selectedLog.dateRequired || 'N/A'}
  </Descriptions.Item>

  {selectedLog.action !== 'Request Rejected' && (
    <Descriptions.Item label="Note">
      {selectedLog.reason || 'N/A'}
    </Descriptions.Item>
  )}
</Descriptions>


  {/* Separate Items Table */}
  <div style={{ marginTop: 40 }}>
    <Title level={5}>Items Requested</Title>
    {(selectedLog.filteredMergedData || selectedLog.requestList)?.length > 0 ? (
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: "8px", background: "#f5f5f5" }}>Item ID</th>
            <th style={{ border: "1px solid #ddd", padding: "8px", background: "#f5f5f5" }}>Item Name</th>
            <th style={{ border: "1px solid #ddd", padding: "8px", background: "#f5f5f5" }}>Quantity</th>
            <th style={{ border: "1px solid #ddd", padding: "8px", background: "#f5f5f5" }}>Category</th>
            <th style={{ border: "1px solid #ddd", padding: "8px", background: "#f5f5f5" }}>Unit</th>
          </tr>
        </thead>
        <tbody>
          {(selectedLog.filteredMergedData || selectedLog.requestList).map((item, index) => (
            <tr key={index}>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {item.itemIdFromInventory || "N/A"}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {item.itemName}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {item.quantity}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {item.category || "N/A"}
              </td>

              
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {(item.category === "Chemical" || item.category === "Reagent") && item.unit && (
                    <li>Unit: {item.unit}</li>
                  )}
                  {item.category === "Glasswares" && item.volume && (
                    <li>Volume: {item.volume}</li>
                  )}
                  {selectedLog.action === "Request Rejected" && (item.reason || item.rejectionReason) && (
                    <>
                      {item.reason && <li><strong>Note:</strong> {item.reason}</li>}
                      {item.rejectionReason && (
                        <li><strong>Rejection Note:</strong> {item.rejectionReason}</li>
                      )}
                    </>
                  )}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p style={{ marginTop: 8 }}>None</p>
    )}
  </div>
</div>


            {/* Show PDF and Print buttons if approved */}
            {(selectedLog.status === 'APPROVED' || selectedLog.action === 'Request Approved') && (
              <div style={{ marginTop: 70, display: 'flex', gap: 8 }}>
                <button
                  style={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                  onClick={handleGeneratePDF}
                >
                  Download PDF
                </button>
                <button
                  style={{
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                  onClick={handlePrint}
                >
                  Print
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default HistoryLog;

