import React, { useState, useEffect } from "react";
import {
  Layout,
  Table,
  Input,
  Tag,
  Typography,
  Select,
  Space,
  Modal,
  Descriptions,
  Row,
  Col,
} from "antd";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig"; 
import "../styles/usersStyle/SearchItems.css";
import {
  SearchOutlined,
  AppstoreOutlined,
  ExperimentOutlined,
  ClusterOutlined,
  ToolOutlined,
  BgColorsOutlined,
  FilterOutlined,
} from "@ant-design/icons";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

  const handleColor = (item) => {
    if (item.category === 'Equipment') return '#026A5D';
    if (item.category === 'Chemical') return '#631990';
    if (item.category === 'Materials') return '#c4610e';
    if (item.category === 'Reagent') return '#235284';
    if (item.category === 'Glasswares') return '#d09902';
    return '#ffffff';
  };

  const handleBG = (item) => {
  if (item.category === "Equipment") return "#C8E6C9";
  if (item.category === "Chemical") return "#E4D6EC";
  if (item.category === "Materials") return "#f7d4b7";
  if (item.category === "Reagent") return "#b8e2f4";
  if (item.category === "Glasswares") return "#fff2ce";
  return "#f0f0f0";
};

const handleIcon = (item) => {
  if (item.category === "Equipment") return <ToolOutlined />;
  if (item.category === "Chemical") return <ExperimentOutlined />;
  if (item.category === "Materials") return <ClusterOutlined />;
  if (item.category === "Reagent") return <BgColorsOutlined />;
  if (item.category === "Glasswares") return <AppstoreOutlined />;
  return <AppstoreOutlined />;
};

// Function to override status display based on inventory balance
const getDisplayStatus = (status, quantity, category) => {
  if (quantity === 0) {
    return "out of stock";
  }
  return status;
};

const columns = [
  {
    title: "Item Name",
    dataIndex: "description",
    key: "description",
    sorter: (a, b) => a.description.localeCompare(b.description),
  },
  {
    title: "Stock Qty",
    dataIndex: "quantity",
    key: "quantity",
    sorter: (a, b) => a.quantity - b.quantity,
    render: (quantity) => <strong>{quantity}</strong>,
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status, record) => {
      const displayStatus = getDisplayStatus(status, record.quantity, record.category);
      const normalizedStatus = displayStatus?.toLowerCase();
      let color;

      switch (normalizedStatus) {
        case "available":
          color = "green";
          break;

        case "out of stock":
          color = "red";
          break;

        case "in use":
          color = "orange";
          break;

        default:
          color = "blue";
      }

      return <Tag color={color}>{displayStatus?.toUpperCase()}</Tag>;
    },
  },
  {
    title: "Category",
    dataIndex: "category",
    key: "category",
    render: (category, record) => {
      const bgColor = handleBG(record);
      const textColor = handleColor(record);
      const icon = handleIcon(record);

      return (
        <div
          style={{
            backgroundColor: bgColor,
            color: textColor,
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 8px",
            borderRadius: 6,
            gap: 6,
            fontWeight: "bold",
          }}
        >
          {icon}
          <span>{category.toUpperCase()}</span>
        </div>
      );
    },
  },
  {
    title: "Stock Room",
    dataIndex: "room",
    key: "room",
    sorter: (a, b) => a.room.localeCompare(b.room),
  },
];
const sanitizeInput = (input) => {
  if (typeof input !== "string") return input; // If not a string, return as is
  // Remove any HTML tags and unwanted characters (except spaces)
  return input.trim().replace(/<[^>]+>/g, "").replace(/[^\w\s]/gi, "");
};

const SearchItems = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);


  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const inventoryRef = collection(db, "inventory");
        const snapshot = await getDocs(inventoryRef);

        const validItems = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            key: doc.id,
            description: data.itemName || "Unnamed Item",
            quantity: data.quantity || 0,
            status: data.status || "Unknown",
            category: data.category || "Uncategorized",
            room: data.labRoom || "No Room Info",
            ...data,
          };
        });

        setInventoryData(validItems);
        setFilteredData(validItems);
      } catch (err) {
        console.error("Error fetching inventory data:", err);
      }
    };

    fetchInventory();
  }, []);

  useEffect(() => {
    // Sanitize inputs before applying filters
    const sanitizedSearchText = sanitizeInput(searchText);
    const sanitizedStatusFilter = statusFilter ? sanitizeInput(statusFilter) : null;
    const sanitizedCategoryFilter = categoryFilter ? sanitizeInput(categoryFilter) : null;

    let data = [...inventoryData];

    if (sanitizedSearchText) {
      data = data.filter((item) =>
        item.description.toLowerCase().includes(sanitizedSearchText.toLowerCase())
      );
    }

    if (sanitizedStatusFilter) {
      data = data.filter(
        (item) =>
          item.status &&
          item.status.toLowerCase().trim() === sanitizedStatusFilter.toLowerCase().trim()
      );
    }

    if (sanitizedCategoryFilter) {
      data = data.filter((item) => item.category === sanitizedCategoryFilter);
    }

    data.sort((a, b) => a.description.localeCompare(b.description));

    setFilteredData(data);
  }, [searchText, statusFilter, categoryFilter, inventoryData]);

  const handleRowClick = (record) => {
    setSelectedItem(record);
    setIsModalVisible(true);
  };


  return (
    <Layout style={{ height: 'auto', gap: 0 }}>
      <Layout style={{gap: 0}}>
        <Content className="search-content">

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
                  // margin: "0 0 8px 0",
                  textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)"
                }}>
                  Search Items
                </h1>
      <p 
        style={{ color: "#a8d5e5", fontSize: "16px", marginTop: "8px", display: "block", fontWeight: 500, marginBottom: 0 }}
      >
        Use the <b>search feature</b> below to quickly find and access medical technology supplies available in the school's inventory. <br/> Filter by item name, category, or availability to locate the equipment or materials you need for classes, labs, or training sessions.
      </p>
</div>

<div className="search-filter-section">
            <div className="filter-header-inventory">
              <FilterOutlined className="filter-icon" />
              <span className="filter-title" style={{background: '#e9f5f9', padding: 10, borderRadius: 5}}>Filter & Search</span>
            </div>

  <Input
    placeholder="Search by item description..."
    value={searchText}
    onChange={(e) => setSearchText(e.target.value)}
    allowClear
    prefix={<SearchOutlined />}
    className="search-input"
  />

  <div style={{display: 'flex', gap: 20, justifyItems: 'space-between'}}>
    <Select
      placeholder="Filter by Status"
      allowClear
      showSearch
      onChange={(value) => setStatusFilter(value)}
      value={statusFilter}
      className="filter-select"
      filterOption={(input, option) =>
        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
      }
    >
      <Option value="Available">Available</Option>
      <Option value="Out of Stock">Out of Stock</Option>
      <Option value="In Use">In Use</Option>
    </Select>

    <Select
      placeholder="Filter by Category"
      allowClear
      showSearch
      onChange={(value) => setCategoryFilter(value)}
      value={categoryFilter}
      className="filter-select"
      filterOption={(input, option) =>
        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
      }
    >
      <Option value="Chemical">Chemical</Option>
      <Option value="Reagent">Reagent</Option>
      <Option value="Materials">Materials</Option>
      <Option value="Equipment">Equipment</Option>
      <Option value="Glasswares">Glasswares</Option>
    </Select>
  </div>
</div>

          <div className="pending-main">
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="key"
              pagination={{ pageSize: 10 }}
              className="search-table"
              onRow={(record) => ({
                onClick: () => handleRowClick(record),
              })}
            />
          </div>

          <Modal
            className="search-modal-container"
            visible={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            zIndex={1010}
            footer={null}
          >
            {selectedItem && (
              <>
                <div style={{ marginBottom: "15px" }}>
                  <strong style={{ fontSize: "20px" }}>Item Details</strong>
                </div>
                <Descriptions bordered column={1} className="custom-descriptions">
                  <Descriptions.Item label="Item Name">
                    {selectedItem.itemName}
                  </Descriptions.Item>

                  <Descriptions.Item label="Item Description">
                    {selectedItem.itemDetails}
                  </Descriptions.Item>

                  <Descriptions.Item label="Quantity">
                    {selectedItem.quantity}
                  </Descriptions.Item>

                  <Descriptions.Item label="Status">
                    {getDisplayStatus(selectedItem.status, selectedItem.quantity, selectedItem.category)}
                  </Descriptions.Item>

                  <Descriptions.Item label="Condition">
                    {selectedItem.condition
                      ? `Good: ${selectedItem.condition.Good ?? 0}, Defect: ${selectedItem.condition.Defect ?? 0}, Damage: ${selectedItem.condition.Damage ?? 0}, Lost: ${selectedItem.condition.Lost ?? 0}`
                      : "N/A"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Item Type">
                    {selectedItem.type}
                  </Descriptions.Item>

                  <Descriptions.Item label="Category">
                    {selectedItem.category}
                  </Descriptions.Item>

                  <Descriptions.Item label="Department">
                    {selectedItem.department}
                  </Descriptions.Item>

                  <Descriptions.Item label="Date Acquired">
                    {selectedItem.entryCurrentDate || "N/A"}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default SearchItems;