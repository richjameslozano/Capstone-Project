// import React, { useState, useEffect } from "react";
// import {
//   Layout,
//   Row,
//   Col,
//   Typography,
//   Table,
//   Modal,
//   Button,
//   Select,
//   Spin,
//   Tag,
//   InputNumber,
// } from "antd";
// import { db } from "../../backend/firebase/FirebaseConfig";
// import {
//   collection,
//   onSnapshot,
//   query,
//   where,
//   doc as fsDoc,          // ✅ alias Firestore doc()
//   updateDoc,
//   addDoc,
//   serverTimestamp,
//   getDoc,
// } from "firebase/firestore";
// import jsPDF from "jspdf";
// import "jspdf-autotable";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
// import "../styles/adminStyle/RestockRequest.css";
// import NotificationModal from "../customs/NotificationModal";
// import { getAuth } from "firebase/auth";
// import autoTable from "jspdf-autotable";

// const { Content } = Layout;
// const { Title, Text } = Typography;
// const { Option } = Select;

// const RestockRequest = () => {
//   const [restockRequests, setRestockRequests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [filterStatus, setFilterStatus] = useState(null);
//   const [filterDepartment, setFilterDepartment] = useState(null);
//   const [departmentsAll, setDepartmentsAll] = useState([]);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [userRole, setUserRole] = useState(null);
//   const [userJobTitle, setUserJobTitle] = useState(null);
//   const [comment, setComment] = useState("");
//   const [isNotificationVisible, setIsNotificationVisible] = useState(false);
//   const [notificationMessage, setNotificationMessage] = useState("");
//   const [approveLoading, setApproveLoading] = useState(false);
//   const [denyLoading, setDenyLoading] = useState(false);
//   const [exportLoading, setExportLoading] = useState(false);
//   const [pdfLoading, setPdfLoading] = useState(false);
//   const [editingQuantity, setEditingQuantity] = useState(false);
//   const [editedQuantity, setEditedQuantity] = useState(null);
//   const [saveQuantityLoading, setSaveQuantityLoading] = useState(false);

//   useEffect(() => {
//     const unsubscribe = onSnapshot(collection(db, "restock_requests"), (snapshot) => {
//       const requests = snapshot.docs.map((d) => ({
//         ...d.data(),
//         id: d.id,
//       }));

//       const sorted = [...requests].sort((a, b) => {
//         const nameA = (a.item_name || '').toLowerCase();
//         const nameB = (b.item_name || '').toLowerCase();
//         return nameA.localeCompare(nameB);
//       });
//       setRestockRequests(sorted);
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   useEffect(() => {
//     const departmentsCollection = collection(db, "departments");
//     const q = query(departmentsCollection, where("college", "==", "SAH"));

//     const unsubscribe = onSnapshot(
//       q,
//       (querySnapshot) => {
//         const deptList = querySnapshot.docs
//           .map((d) => ({ id: d.id, ...d.data() }))
//           .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
//         setDepartmentsAll(deptList);
//       },
//       (error) => {
//         console.error("Error fetching SAH departments:", error);
//       }
//     );

//     return () => unsubscribe();
//   }, []);

//   useEffect(() => {
//     const storedRole = localStorage.getItem("userPosition");
//     const storedJobTitle = localStorage.getItem("userJobTitle");
//     setUserRole(storedRole);
//     setUserJobTitle(storedJobTitle);
//   }, []);

//   // can edit?
//   const canEditQuantity = userRole === "super-user" || userRole === "admin" || userJobTitle === "Laboratory Custodian";

//   const filteredData = restockRequests.filter((item) => {
//     const matchesStatus = filterStatus ? item.status === filterStatus : true;
//     const matchesDepartment = filterDepartment ? item.department === filterDepartment : true;
//     return matchesStatus && matchesDepartment;
//   });

//   const exportToExcel = () => {
//     setExportLoading(true);
//     try {
//       const worksheet = XLSX.utils.json_to_sheet(filteredData);
//       const workbook = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(workbook, worksheet, "Restock Requests");

//       const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
//       const data = new Blob([excelBuffer], { type: "application/octet-stream" });
//       saveAs(data, "Restock_Requests.xlsx");
//     } catch (error) {
//       console.error("Error exporting to Excel:", error);
//     } finally {
//       setExportLoading(false);
//     }
//   };

//   const generatePDF = async () => {
//     setPdfLoading(true);
//     try {
//       const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
//       const pageWidth = doc.internal.pageSize.getWidth();
//       const pageHeight = doc.internal.pageSize.getHeight();

//       const marginX = 14;
//       const headerTopY = 10;
//       const headerBottomY = 22;
//       const contentTop = headerBottomY + 5;
//       const footerTopY = pageHeight - 12;

//       const totalPagesExp = "{total_pages_count_string}";
//       const printedOn = new Intl.DateTimeFormat("en-PH", {
//         timeZone: "Asia/Manila",
//         year: "numeric",
//         month: "short",
//         day: "2-digit",
//         hour: "2-digit",
//         minute: "2-digit",
//       }).format(new Date());

//       const loadImageAsDataURL = async (url) => {
//         try {
//           const res = await fetch(url, { cache: "force-cache" });
//           const blob = await res.blob();
//           return await new Promise((resolve, reject) => {
//             const r = new FileReader();
//             r.onloadend = () => resolve(r.result);
//             r.onerror = reject;
//             r.readAsDataURL(blob);
//           });
//         } catch {
//           return "";
//         }
//       };
//       const logo = await loadImageAsDataURL("/NULS_Favicon.png");

//       // Generated By
//       const auth = getAuth();
//       const user = auth.currentUser;
//       let generatedBy = "Unknown User";
//       if (user) {
//         const snap = await getDoc(fsDoc(db, "accounts", user.uid)); // ✅ use fsDoc
//         generatedBy = snap.exists() ? (snap.data().name || user.email) : (user.email || "Unknown User");
//       }

//       // Header
//       const drawHeader = () => {
//         if (logo) {
//           doc.addImage(logo, "PNG", marginX, headerTopY - 2, 12, 12);
//           doc.setFont("helvetica", "bold");
//           doc.setFontSize(12);
//           doc.text("NULS", marginX + 16, headerTopY + 5);
//         }
//         doc.setFont("helvetica", "bold");
//         doc.setFontSize(16);
//         doc.text("RESTOCK REQUESTS REPORT", pageWidth / 2, headerTopY + 5, { align: "center" });

//         doc.setDrawColor(180);
//         doc.setLineWidth(0.2);
//         doc.line(marginX, headerBottomY, pageWidth - marginX, headerBottomY);
//       };

//       // Footer
//       const drawFooter = () => {
//         const pageCurrent = doc.internal.getCurrentPageInfo().pageNumber;
//         doc.setDrawColor(200);
//         doc.setLineWidth(0.2);
//         doc.line(marginX, footerTopY, pageWidth - marginX, footerTopY);

//         doc.setFont("helvetica", "normal");
//         doc.setFontSize(9);
//         doc.text(`Printed on: ${printedOn}`, marginX, pageHeight - 7);
//         doc.text(`Page ${pageCurrent} of ${totalPagesExp}`, pageWidth - marginX, pageHeight - 7, { align: "right" });
//       };

//       drawHeader();

//       // Meta
//       doc.setFont("helvetica", "bold");
//       doc.setFontSize(12);
//       doc.text("Report Details", marginX, contentTop);

//       const meta = [
//         ["Generated By:", generatedBy],
//         ["Date Generated:", printedOn],
//         ["Total Requests:", String(filteredData.length)],
//       ];

//       autoTable(doc, {
//         startY: contentTop + 3,
//         theme: "plain",
//         styles: { font: "helvetica", fontSize: 10.5, cellPadding: { top: 1.2, bottom: 1.2, left: 0, right: 0 } },
//         margin: { left: marginX, right: marginX },
//         body: meta,
//         columnStyles: {
//           0: { cellWidth: 32, fontStyle: "bold" },
//           1: { cellWidth: pageWidth - marginX * 2 - 32 },
//         },
//         didDrawPage: () => {
//           drawHeader();
//           drawFooter();
//         },
//       });

//       let y = doc.lastAutoTable.finalY + 8;

//       // Table
//       const headers = [["Item Name", "Quantity Needed", "Department", "Status", "Date Created"]];
//       const data = filteredData.map((item) => [
//         item.item_name,
//         item.quantity_needed,
//         item.department,
//         item.status,
//         item.created_at?.toDate?.().toLocaleDateString() || "N/A",
//         ]);
//           autoTable(doc, {
//             startY: y,
//             head: headers,
//             body: data,
//             margin: { top: contentTop, left: marginX, right: marginX, bottom: 20 }, // ✅ bottom margin space
//             theme: "grid",
//             styles: { font: "helvetica", fontSize: 10, cellPadding: 3 },
//             headStyles: {
//               fillColor: [44, 62, 146],
//               textColor: 255,
//               fontStyle: "bold",
//               halign: "center"
//             },
//             alternateRowStyles: { fillColor: [245, 245, 245] },
//             pageBreak: "auto",       // ✅ allows page breaks when content exceeds page
//             rowPageBreak: "avoid",   // ✅ avoids breaking a single row across pages
//             didDrawPage: () => {
//               drawHeader();
//               drawFooter();
//             },
//           });


//       if (typeof doc.putTotalPages === "function") {
//         doc.putTotalPages(totalPagesExp);
//       }

//       doc.save("Restock_Requests.pdf");
//     } catch (error) {
//       console.error("Error generating PDF:", error);
//     } finally {
//       setPdfLoading(false);
//     }
//   };

//   const handleUpdateStatus = async (newStatus) => {
//     if (!selectedRequest) return;

//     if (newStatus === "approved") setApproveLoading(true);
//     else setDenyLoading(true);

//     try {
//       const requestRef = fsDoc(db, "restock_requests", selectedRequest.id); // ✅ use fsDoc
//       await updateDoc(requestRef, {
//         status: newStatus,
//         admin_comment: comment,
//         updated_at: serverTimestamp(),
//       });

//       if (selectedRequest.accountId && selectedRequest.accountId !== "system") {
//         await addDoc(collection(db, `accounts/${selectedRequest.accountId}/userNotifications`), {
//           action: `${newStatus === "approved" ? "Approved" : "Rejected"} your restock request for "${selectedRequest.item_name}"`,
//           requestId: selectedRequest.id,
//           userName: selectedRequest.userName || "User",
//           read: false,
//           timestamp: serverTimestamp(),
//         });
//       }

//       const currentUserId = localStorage.getItem("userId");
//       const currentUserName = localStorage.getItem("userName") || "admin";
//       if (currentUserId) {
//         await addDoc(collection(db, `accounts/${currentUserId}/activitylog`), {
//           action: `${newStatus === "approved" ? "Approved" : "Denied"} restock request for "${selectedRequest.item_name}" from ${selectedRequest.department}`,
//           userName: currentUserName,
//           timestamp: serverTimestamp(),
//         });
//       }

//       setNotificationMessage(newStatus === "approved" ? "Restock request approved successfully!" : "Restock request denied.");
//       setIsNotificationVisible(true);

//       setComment("");
//       setIsModalVisible(false);
//       setSelectedRequest(null);
//     } catch (error) {
//       console.error("Error updating status:", error);
//     } finally {
//       if (newStatus === "approved") setApproveLoading(false);
//       else setDenyLoading(false);
//     }
//   };

//   const handleSaveQuantity = async () => {
//     if (!selectedRequest || editedQuantity === null) return;

//     if (editedQuantity <= 0) {
//       setNotificationMessage("Quantity must be greater than 0.");
//       setIsNotificationVisible(true);
//       return;
//     }

//     if (editedQuantity === selectedRequest.quantity_needed) {
//       setNotificationMessage("No changes detected. Quantity remains the same.");
//       setIsNotificationVisible(true);
//       setEditingQuantity(false);
//       setEditedQuantity(null);
//       return;
//     }

//     setSaveQuantityLoading(true);
//     try {
//       const requestRef = fsDoc(db, "restock_requests", selectedRequest.id); // ✅ use fsDoc
//       await updateDoc(requestRef, {
//         quantity_needed: editedQuantity,
//         updated_at: serverTimestamp(),
//       });

//       setRestockRequests((prev) =>
//         prev.map((req) => (req.id === selectedRequest.id ? { ...req, quantity_needed: editedQuantity } : req))
//       );

//       setNotificationMessage("Quantity updated successfully!");
//       setIsNotificationVisible(true);
//       setEditingQuantity(false);
//       setEditedQuantity(null);
//     } catch (error) {
//       console.error("Error updating quantity:", error);
//       setNotificationMessage("Error updating quantity. Please try again.");
//       setIsNotificationVisible(true);
//     } finally {
//       setSaveQuantityLoading(false);
//     }
//   };

//   const handleCancelEdit = () => {
//     setEditingQuantity(false);
//     setEditedQuantity(null);
//   };

//   const columns = [
//     { title: "Item Name", dataIndex: "item_name", key: "item_name" },
//     { title: "Quantity Needed", dataIndex: "quantity_needed", key: "quantity_needed" },
//     { title: "Department", dataIndex: "department", key: "department" },
//     {
//       title: "Status",
//       dataIndex: "status",
//       key: "status",
//       render: (status) => {
//         const color = status === "approved" ? "green" : status === "denied" ? "red" : "gold";
//         return <Tag color={color}>{status.toUpperCase()}</Tag>;
//       },
//     },
//     {
//       title: "Date Created",
//       dataIndex: "created_at",
//       key: "created_at",
//       render: (text) => (text ? text.toDate().toLocaleDateString() : "N/A"),
//     },
//   ];

//   return (
//     <Layout className="restock-layout">
//       <Content className="restock-content">
//         <Row justify="space-between" align="middle" className="restock-header">
//           <Col xs={24} sm={24} md={12} lg={12} xl={12}>
//             <Title level={2}>Restock Requests</Title>
//             <Text type="secondary">Manage all requests for item restocks here.</Text>
//           </Col>

//           <Col xs={24} sm={24} md={12} lg={12} xl={12} className="export-buttons">
//             <Button type="primary" onClick={generatePDF} loading={pdfLoading} disabled={exportLoading}>
//               Export as PDF
//             </Button>

//             <Button type="primary" onClick={exportToExcel} loading={exportLoading} disabled={pdfLoading}>
//               Export to Excel
//             </Button>
//           </Col>
//         </Row>

//         <Row className="filter-row" gutter={[8, 8]}>
//           <Col xs={24} sm={12} md={8} lg={6} xl={6}>
//             <Select
//               className="filter-select"
//               style={{ width: "100%" }}
//               placeholder="Filter by Status"
//               value={filterStatus === "" ? undefined : filterStatus}
//               onChange={(value) => setFilterStatus(value)}
//               allowClear
//               showSearch
//               filterOption={(input, option) =>
//                 option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
//               }
//             >
//               <Option value="">All</Option>
//               <Option value="pending">Pending</Option>
//               <Option value="approved">Approved</Option>
//               <Option value="denied">Denied</Option>
//             </Select>
//           </Col>

//           <Col xs={24} sm={12} md={16} lg={18} xl={18}>
//             <Select
//               className="filter-select"
//               style={{ width: "100%" }}
//               placeholder="Filter by Department"
//               value={filterDepartment === "" ? undefined : filterDepartment}
//               onChange={(value) => setFilterDepartment(value)}
//               allowClear
//               showSearch
//               filterOption={(input, option) =>
//                 option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
//               }
//             >
//               <Option value="">All</Option>
//               {departmentsAll.map((dept) => (
//                 <Option key={dept.id} value={dept.name}>
//                   {dept.name}
//                 </Option>
//               ))}
//             </Select>
//           </Col>
//         </Row>

//         <Spin spinning={loading} tip="Loading...">
//           {filteredData.length > 0 ? (
//             <div className="table-responsive-wrapper">
//               <Table
//                 columns={columns}
//                 dataSource={filteredData}
//                 rowKey="id"
//                 className="restock-table"
//                 pagination={{ pageSize: 10 }}
//                 scroll={{ x: 'max-content' }}
//                 onRow={(record) => ({
//                   onClick: () => {
//                     if (["admin", "super-user"].includes(userRole)) {
//                       setSelectedRequest(record);
//                       setIsModalVisible(true);
//                     }
//                   },
//                 })}
//               />
//             </div>
//           ) : (
//             <Text>No restock requests found.</Text>
//           )}
//         </Spin>

//         <Modal
//           title={
//             selectedRequest?.status === "denied"
//               ? "Denied Restock Request"
//               : selectedRequest?.status === "pending"
//               ? "Pending Restock Request"
//               : "Approve Restock Request"
//           }
//           open={isModalVisible}
//           onCancel={() => {
//             setIsModalVisible(false);
//             setComment("");
//             setSelectedRequest(null);
//             setEditingQuantity(false);
//             setEditedQuantity(null);
//           }}
//           zIndex={1030}
//           width="90%"
//           style={{ maxWidth: 600 }}
//           footer={
//             userRole === "admin" && selectedRequest?.status === "pending"
//               ? [
//                   <Button key="deny" danger onClick={() => handleUpdateStatus("denied")} loading={denyLoading} disabled={approveLoading}>
//                     Deny
//                   </Button>,
//                   <Button key="approve" type="primary" onClick={() => handleUpdateStatus("approved")} loading={approveLoading} disabled={denyLoading}>
//                     Approve
//                   </Button>,
//                 ]
//               : null
//           }
//         >
//           {selectedRequest ? (
//             <div>
//               <p>
//                 <strong>Item:</strong> {selectedRequest.item_name}
//               </p>

//               <p>
//                 <strong>Quantity:</strong>
//                 {canEditQuantity && !editingQuantity ? (
//                   <span>
//                     {selectedRequest.quantity_needed}
//                     <Button
//                       type="link"
//                       size="small"
//                       onClick={() => {
//                         setEditingQuantity(true);
//                         setEditedQuantity(selectedRequest.quantity_needed);
//                       }}
//                       style={{ marginLeft: "8px" }}
//                     >
//                       Edit
//                     </Button>
//                   </span>
//                 ) : canEditQuantity && editingQuantity ? (
//                   <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
//                     <InputNumber
//                       min={1}
//                       value={editedQuantity}
//                       onChange={(value) => {
//                         if (value === null || value <= 0) setEditedQuantity(1);
//                         else setEditedQuantity(value);
//                       }}
//                       onBlur={() => {
//                         if (editedQuantity === null || editedQuantity <= 0) setEditedQuantity(1);
//                       }}
//                       style={{ width: "120px" }}
//                     />
//                     <Button size="small" type="primary" onClick={handleSaveQuantity} loading={saveQuantityLoading}>
//                       Save
//                     </Button>
//                     <Button size="small" onClick={handleCancelEdit} disabled={saveQuantityLoading}>
//                       Cancel
//                     </Button>
//                   </div>
//                 ) : (
//                   selectedRequest.quantity_needed
//                 )}
//               </p>

//               <p>
//                 <strong>Department:</strong> {selectedRequest.department}
//               </p>
//               <p>
//                 <strong>Status:</strong> {selectedRequest.status}
//               </p>
//               <p>
//                 <strong>Date:</strong> {selectedRequest.created_at?.toDate().toLocaleDateString()}
//               </p>
//               {selectedRequest.reason && (
//                 <p>
//                   <strong>Reason:</strong> {selectedRequest.reason}
//                 </p>
//               )}

//               {["approved", "denied"].includes(selectedRequest.status) ? (
//                 selectedRequest.admin_comment ? <p><strong>Admin Comment:</strong> {selectedRequest.admin_comment}</p> : null
//               ) : userRole !== "super-user" ? (
//                 <textarea
//                   placeholder="Add a comment (optional)"
//                   value={comment}
//                   onChange={(e) => setComment(e.target.value)}
//                   style={{ width: "100%", marginTop: "1rem", padding: "8px" }}
//                   rows={4}
//                 />
//               ) : null}
//             </div>
//           ) : (
//             <p>Loading request details...</p>
//           )}
//         </Modal>

//         <NotificationModal isVisible={isNotificationVisible} onClose={() => setIsNotificationVisible(false)} message={notificationMessage} />
//       </Content>
//     </Layout>
//   );
// };

// export default RestockRequest;

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
  InputNumber,
  Card,
  Space,
  Avatar,
  Badge,
} from "antd";
import {
  FileExcelOutlined,
  FilePdfOutlined,
  ShoppingCartOutlined,
  CalendarOutlined,
  TeamOutlined,
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { db } from "../../backend/firebase/FirebaseConfig";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc as fsDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../styles/adminStyle/RestockRequest.css";
import NotificationModal from "../customs/NotificationModal";
import { getAuth } from "firebase/auth";
import autoTable from "jspdf-autotable";

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
      const requests = snapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,
      }));

      const sorted = [...requests].sort((a, b) => {
        const nameA = (a.item_name || '').toLowerCase();
        const nameB = (b.item_name || '').toLowerCase();
        return nameA.localeCompare(nameB);
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
          .map((d) => ({ id: d.id, ...d.data() }))
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

  const canEditQuantity = userRole === "super-user" || userRole === "admin" || userJobTitle === "Laboratory Custodian";

  const filteredData = restockRequests.filter((item) => {
    const matchesStatus = filterStatus ? item.status === filterStatus : true;
    const matchesDepartment = filterDepartment ? item.department === filterDepartment : true;
    return matchesStatus && matchesDepartment;
  });

const getStatusColor = (status) => {
  switch (status?.toUpperCase().trim()) {
    case "PENDING":
      return "orange"; // yellow
    case "DENIED":
      return "#ef4444"; // red
    case "APPROVED":
      return "#134b5f"; // green
    default:
      return "#6b7280"; // gray
  }
};

const getStatusIcon = (status) => {
  switch (status?.toUpperCase().trim()) {
    case "PENDING":
      return <ClockCircleOutlined />;
    case "DENIED":
      return <CloseCircleOutlined />;
    case "APPROVED":
      return <CheckCircleOutlined />;
    default:
      return null;
  }
};


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

  const generatePDF = async () => {
    setPdfLoading(true);
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const marginX = 14;
      const headerTopY = 10;
      const headerBottomY = 22;
      const contentTop = headerBottomY + 5;
      const footerTopY = pageHeight - 12;

      const totalPagesExp = "{total_pages_count_string}";
      const printedOn = new Intl.DateTimeFormat("en-PH", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date());

      const loadImageAsDataURL = async (url) => {
        try {
          const res = await fetch(url, { cache: "force-cache" });
          const blob = await res.blob();
          return await new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onloadend = () => resolve(r.result);
            r.onerror = reject;
            r.readAsDataURL(blob);
          });
        } catch {
          return "";
        }
      };
      const logo = await loadImageAsDataURL("/NULS_Favicon.png");

      const auth = getAuth();
      const user = auth.currentUser;
      let generatedBy = "Unknown User";
      if (user) {
        const snap = await getDoc(fsDoc(db, "accounts", user.uid));
        generatedBy = snap.exists() ? (snap.data().name || user.email) : (user.email || "Unknown User");
      }

      const drawHeader = () => {
        if (logo) {
          doc.addImage(logo, "PNG", marginX, headerTopY - 2, 12, 12);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text("NULS", marginX + 16, headerTopY + 5);
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("RESTOCK REQUESTS REPORT", pageWidth / 2, headerTopY + 5, { align: "center" });

        doc.setDrawColor(180);
        doc.setLineWidth(0.2);
        doc.line(marginX, headerBottomY, pageWidth - marginX, headerBottomY);
      };

      const drawFooter = () => {
        const pageCurrent = doc.internal.getCurrentPageInfo().pageNumber;
        doc.setDrawColor(200);
        doc.setLineWidth(0.2);
        doc.line(marginX, footerTopY, pageWidth - marginX, footerTopY);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Printed on: ${printedOn}`, marginX, pageHeight - 7);
        doc.text(`Page ${pageCurrent} of ${totalPagesExp}`, pageWidth - marginX, pageHeight - 7, { align: "right" });
      };

      drawHeader();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Report Details", marginX, contentTop);

      const meta = [
        ["Generated By:", generatedBy],
        ["Date Generated:", printedOn],
        ["Total Requests:", String(filteredData.length)],
      ];

      autoTable(doc, {
        startY: contentTop + 3,
        theme: "plain",
        styles: { font: "helvetica", fontSize: 10.5, cellPadding: { top: 1.2, bottom: 1.2, left: 0, right: 0 } },
        margin: { left: marginX, right: marginX },
        body: meta,
        columnStyles: {
          0: { cellWidth: 32, fontStyle: "bold" },
          1: { cellWidth: pageWidth - marginX * 2 - 32 },
        },
        didDrawPage: () => {
          drawHeader();
          drawFooter();
        },
      });

      let y = doc.lastAutoTable.finalY + 8;

      const headers = [["Item Name", "Quantity Needed", "Department", "Status", "Date Created"]];
      const data = filteredData.map((item) => [
        item.item_name,
        item.quantity_needed,
        item.department,
        item.status,
        item.created_at?.toDate?.().toLocaleDateString() || "N/A",
      ]);
      
      autoTable(doc, {
        startY: y,
        head: headers,
        body: data,
        margin: { top: contentTop, left: marginX, right: marginX, bottom: 20 },
        theme: "grid",
        styles: { font: "helvetica", fontSize: 10, cellPadding: 3 },
        headStyles: {
          fillColor: [11, 45, 57], // #0b2d39 in RGB
          textColor: 255,
          fontStyle: "bold",
          halign: "center"
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        pageBreak: "auto",
        rowPageBreak: "avoid",
        didDrawPage: () => {
          drawHeader();
          drawFooter();
        },
      });

      if (typeof doc.putTotalPages === "function") {
        doc.putTotalPages(totalPagesExp);
      }

      doc.save("Restock_Requests.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedRequest) return;

    if (newStatus === "approved") setApproveLoading(true);
    else setDenyLoading(true);

    try {
      const requestRef = fsDoc(db, "restock_requests", selectedRequest.id);
      await updateDoc(requestRef, {
        status: newStatus,
        admin_comment: comment,
        updated_at: serverTimestamp(),
      });

      if (selectedRequest.accountId && selectedRequest.accountId !== "system") {
        await addDoc(collection(db, `accounts/${selectedRequest.accountId}/userNotifications`), {
          action: `${newStatus === "approved" ? "Approved" : "Rejected"} your restock request for "${selectedRequest.item_name}"`,
          requestId: selectedRequest.id,
          userName: selectedRequest.userName || "User",
          read: false,
          timestamp: serverTimestamp(),
        });
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

      setNotificationMessage(newStatus === "approved" ? "Restock request approved successfully!" : "Restock request denied.");
      setIsNotificationVisible(true);

      setComment("");
      setIsModalVisible(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      if (newStatus === "approved") setApproveLoading(false);
      else setDenyLoading(false);
    }
  };

  const handleSaveQuantity = async () => {
    if (!selectedRequest || editedQuantity === null) return;

    if (editedQuantity <= 0) {
      setNotificationMessage("Quantity must be greater than 0.");
      setIsNotificationVisible(true);
      return;
    }

    if (editedQuantity === selectedRequest.quantity_needed) {
      setNotificationMessage("No changes detected. Quantity remains the same.");
      setIsNotificationVisible(true);
      setEditingQuantity(false);
      setEditedQuantity(null);
      return;
    }

    setSaveQuantityLoading(true);
    try {
      const requestRef = fsDoc(db, "restock_requests", selectedRequest.id);
      await updateDoc(requestRef, {
        quantity_needed: editedQuantity,
        updated_at: serverTimestamp(),
      });

      setRestockRequests((prev) =>
        prev.map((req) => (req.id === selectedRequest.id ? { ...req, quantity_needed: editedQuantity } : req))
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

  // Stats for dashboard cards
 const statsCards = [
  {
    title: "Total Requests",
    value: restockRequests.length,
    color: "#1a6985",
    icon: <ShoppingCartOutlined />,
    key: "", // means "all"
  },
  {
    title: "Pending",
    value: restockRequests.filter(r => r.status.toLowerCase() === "pending").length,
    color: "#facc15", // yellow
    icon: <ClockCircleOutlined />,
    key: "pending",
  },
  {
    title: "Approved",
    value: restockRequests.filter(r => r.status.toLowerCase() === "approved").length,
    color: "#22c55e", // green
    icon: <CheckCircleOutlined />,
    key: "approved",
  },
  {
    title: "Denied",
    value: restockRequests.filter(r => r.status.toLowerCase() === "denied").length,
    color: "#ef4444", // red
    icon: <CloseCircleOutlined />,
    key: "denied",
  },
];


  const columns = [
    {
      title: "Item Name",
      dataIndex: "item_name",
      key: "item_name",
      render: (text) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* <Avatar 
            icon={<ShoppingCartOutlined />} 
            size="small" 
            style={{ backgroundColor: "#2596be" }}
          /> */}
          <Text style={{borderLeft: '1px solid #e9ecee'}} strong>{text}</Text>
        </div>
      ),
    },
    {
      title: "Quantity Needed",
      dataIndex: "quantity_needed",
      key: "quantity_needed",
      align: "center",
      render: (quantity) => (
        <Badge 
          count={quantity} 
          style={{ backgroundColor: "#1a6985" }}
          overflowCount={999}
        />
      ),
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (dept) => (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <TeamOutlined style={{ color: "#1a6985" }} />
          <Text type="secondary">{dept}</Text>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status) => (
        <Tag 
          style={{
            backgroundColor: getStatusColor(status),
            color: "white",
            border: "none",
            fontWeight: 500,
            borderRadius: "16px",
            padding: "4px 12px"
          }}
          icon={getStatusIcon(status)}
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Date Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (text) => (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <CalendarOutlined style={{ color: "#1a6985" }} />
          <Text type="secondary">
            {text ? text.toDate().toLocaleDateString() : "N/A"}
          </Text>
        </div>
      ),
    },
  ];

  return (
    <Layout style={{ background: "linear-gradient(135deg, #bee0ec 0%, #ffffff 100%)", minHeight: "100vh", padding: 0 }}>
      <Content style={{ padding: "24px", width: "100%" }}>
        {/* Header Section */}
       <div className="header-section">
  <Row justify="space-between" align="middle">
    <Col xs={24} sm={24} md={14} lg={16}>
      <Title 
        level={1} 
        style={{ color: "white", margin: 0, fontSize: "2.5rem", fontWeight: 700 }}
      >
        Restock Requests
      </Title>
      <Text 
        style={{ color: "rgba(255,255,255,0.85)", fontSize: "16px", marginTop: "8px", display: "block" }}
      >
        Manage and track all item restock requests efficiently
      </Text>
    </Col>
    <Col xs={24} sm={24} md={10} lg={8}>
      <Space size="middle" style={{ width: "100%", justifyContent: "flex-end", flexWrap: "wrap" }}>
        <Button 
          type="primary" 
          icon={<FilePdfOutlined />}
          onClick={generatePDF} 
          loading={pdfLoading}
          disabled={exportLoading}
          size="large"
          style={{ 
            borderRadius: "10px", 
            background: "rgba(255,255,255,0.15)",
            border: "2px solid rgba(255,255,255,0.3)",
            backdropFilter: "blur(10px)",
            fontWeight: 600
          }}
        >
          Export PDF
        </Button>
        <Button 
          type="primary" 
          icon={<FileExcelOutlined />}
          onClick={exportToExcel} 
          loading={exportLoading}
          disabled={pdfLoading}
          size="large"
          style={{ 
            borderRadius: "10px", 
            background: "rgba(255,255,255,0.15)",
            border: "2px solid rgba(255,255,255,0.3)",
            backdropFilter: "blur(10px)",
            fontWeight: 600
          }}
        >
          Export Excel
        </Button>
      </Space>
    </Col>
  </Row>
</div>


        {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
  {statsCards.map((stat, index) => {
    const isActive = filterStatus === stat.key;

    return (
      <Col xs={12} sm={12} md={6} lg={6} key={index}>
        <Card
          onClick={() => setFilterStatus(stat.key)}
          style={{
            borderRadius: "12px",
            border: isActive ? `10px solid ${stat.color}` : "none",
            boxShadow: isActive 
              ? "0 6px 24px rgba(0,0,0,0.12)" 
              : "0 4px 20px rgba(0,0,0,0.08)",
            background: isActive ? `${stat.color}10` : "white",
            transition: "all 0.2s ease",
            cursor: "pointer",
          }}
          bodyStyle={{ padding: "20px" }}
          hoverable
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <Text type="secondary" style={{ fontSize: "12px", fontWeight: 500 }}>
                {stat.title}
              </Text>
              <div style={{ fontSize: "28px", fontWeight: 700, color: stat.color, marginTop: "4px" }}>
                {stat.value}
              </div>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: `${stat.color}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: stat.color,
                fontSize: "20px",
              }}
            >
              {stat.icon}
            </div>
          </div>
        </Card>
      </Col>
    );
  })}
</Row>

 {/* Filters */}
{/* <Row style={{ marginBottom: "24px" }}>
  <Col span={24}>
    <div 

      style={{ padding: "20px", backgroundColor: '#fff', borderRadius: 10 }}
    >
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12} md={8} lg={6} xl={6}>
          <Select
            style={{ width: "100%" }}
            placeholder="Filter by Status"
            value={filterStatus === "" ? undefined : filterStatus}
            onChange={(value) => setFilterStatus(value)}
            allowClear
            size="large"
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            <Option value="">All</Option>
            <Option value="pending">Pending</Option>
            <Option value="approved">Approved</Option>
            <Option value="denied">Denied</Option>
          </Select>
        </Col>

        <Col xs={24} sm={12} md={16} lg={18} xl={18}>
          <Select
            style={{ width: "100%" }}
            placeholder="Filter by Department"
            value={filterDepartment === "" ? undefined : filterDepartment}
            onChange={(value) => setFilterDepartment(value)}
            allowClear
            size="large"
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
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
    </div>
  </Col>
</Row> */}

{/* Table */}
<Row>
  <Col span={24}>
    <div>
      <Spin spinning={loading} tip="Loading requests...">
        {filteredData.length > 0 ? (
          <div className="table-responsive-wrapper">
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="id"
              className="restock-table"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} requests`,
                style: { padding: "16px 24px" }
              }}
              scroll={{ x: 'max-content' }}
              onRow={(record) => ({
                onClick: () => {
                  if (["admin", "super-user"].includes(userRole)) {
                    setSelectedRequest(record);
                    setIsModalVisible(true);
                  }
                },
              })}
            />
          </div>
        ) : (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <Text>No restock requests found.</Text>
          </div>
        )}
      </Spin>
    </div>
  </Col>
</Row>


        {/* Modal */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "18px" }}>
              <Avatar 
                icon={<ShoppingCartOutlined />} 
                style={{ backgroundColor: "#2596be" }}
              />
              {selectedRequest?.status === "denied"
                ? "Denied Restock Request"
                : selectedRequest?.status === "pending"
                ? "Pending Restock Request"
                : "Approved Restock Request"}
            </div>
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
          width="90%"
          style={{ maxWidth: 600 }}
          footer={
            userRole === "admin" && selectedRequest?.status === "pending"
              ? [
                  <Button 
                    key="deny" 
                    danger 
                    icon={<CloseOutlined />}
                    onClick={() => handleUpdateStatus("denied")} 
                    loading={denyLoading} 
                    disabled={approveLoading}
                  >
                    Deny
                  </Button>,
                  <Button 
                    key="approve" 
                    type="primary" 
                    icon={<CheckOutlined />}
                    onClick={() => handleUpdateStatus("approved")} 
                    loading={approveLoading} 
                    disabled={denyLoading}
                    style={{ backgroundColor: "#1a6985", borderColor: "#1a6985" }}
                  >
                    Approve
                  </Button>,
                ]
              : null
          }
        >
          {selectedRequest ? (
            <Card size="small" style={{ background: "#fafafa", border: "1px solid #f0f0f0" }}>
              <Space direction="vertical" style={{ width: "100%" }} size="middle">
                <div>
                  <Text strong style={{ color: "#0b2d39" }}>Item Name</Text>
                  <div style={{ marginTop: "4px", fontSize: "16px", fontWeight: 500 }}>
                    {selectedRequest.item_name}
                  </div>
                </div>
                
                <div>
                  <Text strong style={{ color: "#0b2d39" }}>Quantity Needed</Text>
                  <div style={{ marginTop: "4px" }}>
                    {canEditQuantity && !editingQuantity ? (
                      <Space>
                        <Badge count={selectedRequest.quantity_needed} style={{ backgroundColor: "#1a6985" }} />
                        <Button 
                          type="link" 
                          icon={<EditOutlined />}
                          size="small"
                          onClick={() => {
                            setEditingQuantity(true);
                            setEditedQuantity(selectedRequest.quantity_needed);
                          }}
                          style={{ color: "#2596be" }}
                        >
                          Edit
                        </Button>
                      </Space>
                    ) : canEditQuantity && editingQuantity ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                        <InputNumber
                          min={1}
                          value={editedQuantity}
                          onChange={(value) => {
                            if (value === null || value <= 0) setEditedQuantity(1);
                            else setEditedQuantity(value);
                          }}
                          onBlur={() => {
                            if (editedQuantity === null || editedQuantity <= 0) setEditedQuantity(1);
                          }}
                          style={{ width: "120px" }}
                        />
                        <Button 
                          size="small" 
                          type="primary" 
                          onClick={handleSaveQuantity} 
                          loading={saveQuantityLoading}
                          style={{ backgroundColor: "#1a6985", borderColor: "#1a6985" }}
                        >
                          Save
                        </Button>
                        <Button size="small" onClick={handleCancelEdit} disabled={saveQuantityLoading}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Badge count={selectedRequest.quantity_needed} style={{ backgroundColor: "#1a6985" }} />
                    )}
                  </div>
                </div>

                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong style={{ color: "#0b2d39" }}>Department</Text>
                    <div style={{ marginTop: "4px" }}>
                      <Tag style={{ backgroundColor: "#bee0ec", color: "#0b2d39", border: "none" }}>
                        {selectedRequest.department}
                      </Tag>
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text strong style={{ color: "#0b2d39" }}>Status</Text>
                    <div style={{ marginTop: "4px" }}>
                      <Tag 
                        style={{ 
                          backgroundColor: getStatusColor(selectedRequest.status),
                          color: "white",
                          border: "none"
                        }}
                        icon={getStatusIcon(selectedRequest.status)}
                      >
                        {selectedRequest.status.toUpperCase()}
                      </Tag>
                    </div>
                  </Col>
                </Row>

                <div>
                  <Text strong style={{ color: "#0b2d39" }}>Date Created</Text>
                  <div style={{ marginTop: "4px" }}>
                    {selectedRequest.created_at?.toDate().toLocaleDateString()}
                  </div>
                </div>

                {selectedRequest.reason && (
                  <div>
                    <Text strong style={{ color: "#0b2d39" }}>Reason</Text>
                    <div style={{ marginTop: "4px", padding: "8px", background: "white", borderRadius: "6px" }}>
                      {selectedRequest.reason}
                    </div>
                  </div>
                )}

                {["approved", "denied"].includes(selectedRequest.status) ? (
                  selectedRequest.admin_comment ? (
                    <div>
                      <Text strong style={{ color: "#0b2d39" }}>Admin Comment</Text>
                      <div style={{ 
                        marginTop: "8px", 
                        padding: "12px", 
                        background: "#bee0ec", 
                        borderRadius: "8px",
                        border: "1px solid #2596be"
                      }}>
                        {selectedRequest.admin_comment}
                      </div>
                    </div>
                  ) : null
                ) : userRole !== "super-user" ? (
                  <div>
                    <Text strong style={{ color: "#0b2d39" }}>Add Comment (Optional)</Text>
                    <textarea
                      placeholder="Add a comment (optional)"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      style={{ 
                        width: "100%", 
                        marginTop: "8px", 
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #d9d9d9",
                        resize: "vertical"
                      }}
                      rows={4}
                    />
                  </div>
                ) : null}
              </Space>
            </Card>
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