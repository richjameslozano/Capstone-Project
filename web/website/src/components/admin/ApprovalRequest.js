import React, { useState, useEffect } from "react";
import { Layout, Row, Col, Table, Input, Typography, Select } from "antd";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig"; 
import "../styles/adminStyle/ApprovalRequest.css";
import ApprovalRequestModal from "../customs/ApprovalRequestModal";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const ApprovalRequest = () => {
  const [catalog, setCatalog] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentsAll, setDepartmentsAll] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState("All");

  useEffect(() => {
    const fetchCatalogData = () => {
      try {
        const borrowCatalogRef = collection(db, "approvalrequestcollection");

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
              firestoreId: data.firestoreId, 
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

  useEffect(() => {
    const departmentsCollection = collection(db, "departments");
    const unsubscribe = onSnapshot(
      departmentsCollection,
      (querySnapshot) => {
        const deptList = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setDepartmentsAll(deptList);
      },
      (error) => {
        console.error("Error fetching departments in real-time: ", error);
      }
    );

    return () => unsubscribe();
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

    const matchesDepartment =
      departmentFilter === "All" || item.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDepartment;
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
    // <Layout style={{ minHeight: "100vh" }}>
    //    <div style={{
    //         background: "linear-gradient(135deg, #0b2d39 0%, #165a72 100%)",
    //         borderRadius: "16px",
    //         padding: "32px",
    //         marginBottom: "20px",
    //         boxShadow: "0 8px 32px rgba(11, 45, 57, 0.15)",
    //         border: "1px solid rgba(255, 255, 255, 0.1)"
    //       }}>
    //         <div style={{
    //           display: "flex",
    //           justifyContent: "space-between",
    //           alignItems: "center",
    //           flexWrap: "wrap",
    //           gap: "16px"
    //         }}>
    //           <div>
    //             <h1 style={{
    //               color: "#ffffff",
    //               fontSize: "28px",
    //               fontWeight: "700",
    //               margin: "0 0 8px 0",
    //               textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)"
    //             }}>
    //               Approval Request
    //             </h1>
    //             <p style={{
    //               color: "#a8d5e5",
    //               fontSize: "16px",
    //               margin: "0",
    //               fontWeight: "500"
    //             }}>
    //               View, review, and manage all requisition approval requests initiated by Laboratory Personnel.<br/>
    //             </p>
    //           </div>
    //         </div>
    //       </div>
    //     <Content style={{ margin: "20px" }}>
    //       <Row justify="space-between" style={{ marginBottom: 16 }}>
    //         <Col span={8}>
    //           <Search
    //             placeholder="Search"
    //             allowClear
    //             enterButton
    //             onSearch={handleSearch}
    //           />
    //         </Col>

    //         <Col>
    //           <Select
    //             value={departmentFilter}
    //             onChange={(value) => setDepartmentFilter(value)}
    //             style={{ width: 200 }}
    //             placeholder="Select Department"
    //           >
    //             <Option value="All">All Departments</Option>
    //             {departmentsAll.map((dept) => (
    //               <Option key={dept.id} value={dept.name}>
    //                 {dept.name}
    //               </Option>
    //             ))}
    //           </Select>
    //         </Col>
            
    //       </Row>

    //       <Table
    //         dataSource={filteredCatalog}
    //         columns={columns}
    //         rowKey="id"
    //         bordered
    //         pagination={{ pageSize: 10 }}
    //       />

    //         <ApprovalRequestModal
    //           isApprovedModalVisible={isModalVisible}
    //           setIsApprovedModalVisible={setIsModalVisible}
    //           selectedApprovedRequest={selectedRequest}
    //           setSelectedApprovedRequest={setSelectedRequest}
    //           requestId={selectedRequest?.id}
    //           columns={columns}
    //           formatDate={formatDate}
    //         />
    //     </Content>
    //   </Layout>

    <Layout className="approval-request-layout">

                 <div style={{
            background: "linear-gradient(135deg, #0b2d39 0%, #165a72 100%)",
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "20px",
            boxShadow: "0 8px 32px rgba(11, 45, 57, 0.15)",
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px"
            }}>
              <div>
                <h1 style={{
                  color: "#ffffff",
                  fontSize: "28px",
                  fontWeight: "700",
                  margin: "0 0 8px 0",
                  textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)"
                }}>
                  Approval Request
                </h1>
                <p style={{
                  color: "#a8d5e5",
                  fontSize: "16px",
                  margin: "0",
                  fontWeight: "500"
                }}>
                  View, review, and manage all requisition approval requests initiated by Laboratory Personnel.<br/>
                </p>
              </div>
            </div>
          </div>  
      
      <Content className="approval-request-content">
        <Row className="approval-request-filters">
          <Col span={8} xs={24} sm={24} md={12} lg={8}>
            {/* <Search
              className="approval-request-search"
              placeholder="Search requests..."
              allowClear
              enterButton
              onSearch={handleSearch}
            /> */}
              <Input.Search
                placeholder='Search Items'
                className="search-bar"
                allowClear
                onInput={handleSearch}
              />
          </Col>

          <Col xs={24} sm={24} md={12} lg={8}>
            <Select
              className="approval-request-department-filter"
              value={departmentFilter}
              onChange={(value) => setDepartmentFilter(value)}
              placeholder="Select Department"
            >
              <Option value="All">All Departments</Option>
              {departmentsAll.map((dept) => (
                <Option key={dept.id} value={dept.name}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Table
          className="approval-request-table"
          dataSource={filteredCatalog}
          columns={columns}
          rowKey="id"
          bordered
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
          }}
        />

        <ApprovalRequestModal
          isApprovedModalVisible={isModalVisible}
          setIsApprovedModalVisible={setIsModalVisible}
          selectedApprovedRequest={selectedRequest}
          setSelectedApprovedRequest={setSelectedRequest}
          requestId={selectedRequest?.id}
          columns={columns}
          formatDate={formatDate}
        />
      </Content>
    </Layout>
  );
};

export default ApprovalRequest;

