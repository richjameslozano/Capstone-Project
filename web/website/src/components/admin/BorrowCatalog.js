import React, { useState, useEffect, useMemo  } from "react";
import { Layout, Row, Col, Table, Input, Typography, Select, Tabs } from "antd";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig"; 
import "../styles/adminStyle/BorrowCatalog.css";
import ApprovedRequestModal from "../customs/ApprovedRequestModal";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const BorrowCatalog = () => {
  const [catalog, setCatalog] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const statusOptions = [
    'All',
    'Borrowed',
    'Returned',
    'Return Approved',
    'Deployed',
    'For Release',
    'Released',
    'Unclaimed',
  ];

    // useEffect(() => {
  //   const fetchCatalogData = async () => {
  //     try {
  //       const borrowCatalogCollection = collection(db, "borrowcatalog");
  //       const borrowCatalogSnapshot = await getDocs(borrowCatalogCollection);
  //       const catalogData = borrowCatalogSnapshot.docs.map((doc) => {
  //         const data = doc.data();

  //         const formatDate = (timestamp) => {
  //           return timestamp instanceof Date ? timestamp.toLocaleDateString() : "N/A";
  //         };          

  //         const requestedItems = Array.isArray(data.requestList)
  //           ? data.requestList.map((item) => ({
  //               itemId: item.itemIdFromInventory,
  //               itemName: item.itemName,
  //               quantity: item.quantity,
  //               category: item.category,
  //               condition: item.condition,
  //               department: item.department,
  //               labRoom: item.labRoom,
  //             }))
  //           : [];

  //         return {
  //           id: doc.id,
  //           timestamp: data.timestamp || null,
  //           requestor: data.userName || "N/A",
  //           userName: data.userName || "N/A",
  //           approvedBy: data.approvedBy || "N/A",
  //           formatDate,
  //           reason: data.reason || "N/A",
  //           dateRequired: data.dateRequired || "N/A",
  //           timeFrom: data.timeFrom || "N/A",
  //           timeTo: data.timeTo || "N/A",
  //           courseDescription: data.courseDescription || "N/A",
  //           courseCode: data.courseCode || "N/A",
  //           program: data.program || "N/A",
  //           room: data.room || "N/A",
  //           requestList: Array.isArray(data.requestList) ? data.requestList : [],
  //           requestedItems,
  //           status: data.status || "Pending",
  //         };
  //       });

  //       const sortedCatalogData = catalogData.sort((a, b) => {
  //         if (a.timestamp && b.timestamp) {
  //           const timeA = a.timestamp.seconds * 1000 + a.timestamp.nanoseconds / 1000000;
  //           const timeB = b.timestamp.seconds * 1000 + b.timestamp.nanoseconds / 1000000;
  //           return timeB - timeA;  // Sort by precise timestamp including nanoseconds, most recent first
  //         }
  //         return 0;
  //       });

  //       setCatalog(sortedCatalogData);

  //     } catch (error) {
  //     
  //     }
  //   };

  //   fetchCatalogData();
  // }, []);

  useEffect(() => {
    const fetchCatalogData = () => {
      try {
        // Set up real-time listener using onSnapshot
        const borrowCatalogRef = collection(db, "borrowcatalog");

        const unsubscribe = onSnapshot(borrowCatalogRef, (snapshot) => {
          const catalogData = snapshot.docs.map((doc) => {
            const data = doc.data();

            const formatDate = (timestamp) => {
              return timestamp instanceof Date ? timestamp.toLocaleDateString() : "N/A";
            };

            const requestedItems = Array.isArray(data.requestList)
              ? data.requestList.map((item) => ({
                  itemId: item.itemIdFromInventory,
                  itemName: item.itemName,
                  itemDetails: item.itemDetails,
                  quantity: item.quantity,
                  category: item.category,
                  condition: item.condition,
                  department: item.department,
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
              formatDate,
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
              usageType: data.usageType || "N/A",
            };
          });

          // Sort catalog data by timestamp, most recent first
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

        // Cleanup listener when component unmounts
        return () => unsubscribe();
        
      } catch (error) {
        
      }
    };

    fetchCatalogData();
  }, []);

    const handleSearch = (value) => {
      const sanitizedValue = value
        .trim()
        .replace(/[^a-zA-Z0-9\s-]/g, ""); // Only allow letters, numbers, space, hyphen
      setSearchQuery(sanitizedValue);
    };

  const handleStatusFilter = (value) => {
    const finalValue = value ?? "All";
    setStatusFilter(finalValue);
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

  // compute today and 7 days later
const today = new Date();
const sevenDaysLater = new Date();
sevenDaysLater.setDate(today.getDate() + 7);

// group filteredCatalog
const next7Days = filteredCatalog.filter((item) => {
  const reqDate = new Date(item.dateRequired);
  return reqDate >= today && reqDate <= sevenDaysLater;
});

const others = filteredCatalog.filter((item) => {
  const reqDate = new Date(item.dateRequired);
  return !(reqDate >= today && reqDate <= sevenDaysLater);
});


  const columns = [
    {
      title: "Requestor",
      dataIndex: "requestor",
      key: "requestor",
    },
    // {
    //   title: "Course Description",
    //   dataIndex: "courseDescription",
    //   key: "courseDescription",
    // },
    {
      title: "Course",
      dataIndex: "course",
      key: "course",
    },
    {
      title: "Date Requested",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (timestamp) => formatDate(timestamp),
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

          case "For Release":
            color = "purple";
            break;

          case "Released":
            color = "#0e7490"; // teal
            break;

          case "For Expired":
            color = "#d97706"; // amber
            break;

          default:
            color = "black";
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
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    const sanitized = value.trim().replace(/[^a-zA-Z0-9\s-]/g, "");
                    setSearchQuery(sanitized);
                  }}
                  onSearch={handleSearch}
                />

            </Col>

            {/* <Col>
              <Select
                value={statusFilter}
                onChange={handleStatusFilter}
                onClear={() => handleStatusFilter("All")}
                allowClear
                style={{ width: 200 }}
                placeholder="Select Status"
              >
                {statusOptions.map((status) => (
                  <Option key={status} value={status}>
                    {status}
                  </Option>
                ))}
              </Select>
            </Col> */}
          </Row>

          {/* <Table
            className="borrow-catalog-table"
            dataSource={filteredCatalog}
            columns={columns}
            rowKey="id"
            bordered
            pagination={{ pageSize: 10 }}
          /> */}

<Tabs defaultActiveKey="1" type="card">
  {/* Tab 1: For Release + For Deployment */}
<TabPane tab="For Release / Deployment" key="1">
  {/* Section: Next 7 days */}
  <h2>Scheduled for deployment/releasing within the next seven (7) days.</h2>
  <div className="catalog-cards">
    {filteredCatalog
      .filter(
        (item) =>
          ["For Release", "Borrowed"].includes(item.status) &&
          (() => {
            const today = new Date();
            const required = new Date(item.dateRequired);
            const diffDays = (required - today) / (1000 * 60 * 60 * 24);
            return diffDays >= 0 && diffDays <= 7;
          })()
      )
      .sort((a, b) => new Date(a.dateRequired) - new Date(b.dateRequired))
      .map((item) => (
        <div
          key={item.id}
          className="catalog-card"
          onClick={() => handleViewDetails(item)}
        >
          <div className="card-header">
            <h3>{item.requestor}</h3>
            <span className={`status ${item.status.toLowerCase()}`}>
              {item.status}
            </span>
          </div>
          <div className="card-body">
            <p><strong>Course:</strong> {item.course}</p>
            <p><strong>Description:</strong> {item.courseDescription}</p>
            <p><strong>Date Required:</strong> {item.dateRequired}</p>
          </div>
        </div>
      ))}
    {filteredCatalog.filter(
      (item) =>
        ["For Release", "Borrowed"].includes(item.status) &&
        (() => {
          const today = new Date();
          const required = new Date(item.dateRequired);
          const diffDays = (required - today) / (1000 * 60 * 60 * 24);
          return diffDays >= 0 && diffDays <= 7;
        })()
    ).length === 0 && <p>No requests within the next 7 days.</p>}
  </div>

  {/* Section: Later */}
  <h2>Other Requisitions with later dates.</h2>
  <div className="catalog-cards">
    {filteredCatalog
      .filter(
        (item) =>
          ["For Release", "Borrowed"].includes(item.status) &&
          (() => {
            const today = new Date();
            const required = new Date(item.dateRequired);
            const diffDays = (required - today) / (1000 * 60 * 60 * 24);
            return diffDays > 7;
          })()
      )
      .sort((a, b) => new Date(a.dateRequired) - new Date(b.dateRequired))
      .map((item) => (
        <div
          key={item.id}
          className="catalog-card"
          onClick={() => handleViewDetails(item)}
        >
          <div className="card-header">
            <h3>{item.requestor}</h3>
            <span className={`status ${item.status.toLowerCase()}`}>
              {item.status}
            </span>
          </div>
          <div className="card-body">
            <p><strong>Course:</strong> {item.course}</p>
            <p><strong>Description:</strong> {item.courseDescription}</p>
            <p><strong>Date Required:</strong> {item.dateRequired}</p>
          </div>
        </div>
      ))}
    {filteredCatalog.filter(
      (item) =>
        ["For Release", "Borrowed"].includes(item.status) &&
        (() => {
          const today = new Date();
          const required = new Date(item.dateRequired);
          const diffDays = (required - today) / (1000 * 60 * 60 * 24);
          return diffDays > 7;
        })()
    ).length === 0 && <p>No other requests.</p>}
  </div>
</TabPane>


  {/* Tab 2: Deployed + Released */}
  <TabPane tab="Deployed / Released" key="2">
    <div className="catalog-cards">
      {filteredCatalog
        .filter((item) =>
          ["Deployed", "Released"].includes(item.status)
        )
        .sort((a, b) => new Date(a.dateRequired) - new Date(b.dateRequired))
        .map((item) => (
          <div
            key={item.id}
            className="catalog-card"
            onClick={() => handleViewDetails(item)}
          >
            <div className="card-header">
              <h3>{item.requestor}</h3>
              <span className={`status ${item.status.toLowerCase()}`}>
                {item.status}
              </span>
            </div>
            <div className="card-body">
              <p><strong>Course:</strong> {item.course}</p>
              <p><strong>Description:</strong> {item.courseDescription}</p>
              <p><strong>Date Required:</strong> {item.dateRequired}</p>
            </div>
          </div>
        ))}
    </div>
  </TabPane>

  {/* Tab 3: Returned */}
  <TabPane tab="Returned" key="3">
    <div className="catalog-cards">
      {filteredCatalog
        .filter((item) => item.status === "Returned")
        .sort((a, b) => new Date(a.dateRequired) - new Date(b.dateRequired))
        .map((item) => (
          <div
            key={item.id}
            className="catalog-card"
            onClick={() => handleViewDetails(item)}
          >
            <div className="card-header">
              <h3>{item.requestor}</h3>
              <span className={`status ${item.status.toLowerCase()}`}>
                {item.status}
              </span>
            </div>
            <div className="card-body">
              <p><strong>Course:</strong> {item.course}</p>
              <p><strong>Description:</strong> {item.courseDescription}</p>
              <p><strong>Date Required:</strong> {item.dateRequired}</p>
            </div>
          </div>
        ))}
    </div>
  </TabPane>

  {/* Tab 4: Return Approved */}
  <TabPane tab="Return Approved" key="4">
    <div className="catalog-cards">
      {filteredCatalog
        .filter((item) => item.status === "Return Approved")
        .sort((a, b) => new Date(a.dateRequired) - new Date(b.dateRequired))
        .map((item) => (
          <div
            key={item.id}
            className="catalog-card"
            onClick={() => handleViewDetails(item)}
          >
            <div className="card-header">
              <h3>{item.requestor}</h3>
              <span className={`status ${item.status.toLowerCase()}`}>
                {item.status}
              </span>
            </div>
            <div className="card-body">
              <p><strong>Course:</strong> {item.course}</p>
              <p><strong>Description:</strong> {item.courseDescription}</p>
              <p><strong>Date Required:</strong> {item.dateRequired}</p>
            </div>
          </div>
        ))}
    </div>
  </TabPane>

  <TabPane tab="Unclaimed" key="5">
  <h2>Unclaimed Requisitions</h2>
  <div className="catalog-cards">
    {filteredCatalog
      .filter((item) => item.status === "Unclaimed")
      .sort((a, b) => new Date(a.dateRequired) - new Date(b.dateRequired))
      .map((item) => (
        <div
          key={item.id}
          className="catalog-card"
          onClick={() => handleViewDetails(item)}
        >
          <div className="card-header">
            <h3>{item.requestor}</h3>
            <span className={`status ${item.status.toLowerCase()}`}>
              {item.status}
            </span>
          </div>
          <div className="card-body">
            <p><strong>Course:</strong> {item.course}</p>
            <p><strong>Description:</strong> {item.courseDescription}</p>
            <p><strong>Date Required:</strong> {item.dateRequired}</p>
          </div>
        </div>
      ))}
    {filteredCatalog.filter((item) => item.status === "Unclaimed").length === 0 && (
      <p>No unclaimed requests.</p>
    )}
  </div>
</TabPane>

</Tabs>

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

export default BorrowCatalog;

