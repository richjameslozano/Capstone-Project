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
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig"; 
import "../styles/usersStyle/SearchItems.css";

const { Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

// const columns = [
//   {
//     title: "Item Name",
//     dataIndex: "description",
//     key: "description",
//     sorter: (a, b) => a.description.localeCompare(b.description),
//   },
//   {
//     title: "Stock Qty",
//     dataIndex: "quantity",
//     key: "quantity",
//     sorter: (a, b) => a.quantity - b.quantity,
//     render: (quantity) => <strong>{quantity}</strong>,
//   },
//   {
//     title: "Status",
//     dataIndex: "status",
//     key: "status",
//     render: (status) => {
//       let color;
//       switch (status) {
//         case "Available":
//           color = "green";
//           break;
//         case "Out of Stock":
//           color = "red";
//           break;
//         case "In Use":
//           color = "orange";
//           break;
//         default:
//           color = "blue";
//       }
//       return <Tag color={color}>{status.toUpperCase()}</Tag>;
//     },
//   },
//   {
//     title: "Category",
//     dataIndex: "category",
//     key: "category",
//     render: (category) => (
//       <Tag color={category === "Chemical" ? "blue" : "geekblue"}>
//         {category.toUpperCase()}
//       </Tag>
//     ),
//   },
//   {
//     title: "Room Location",
//     dataIndex: "room",
//     key: "room",
//     sorter: (a, b) => a.room.localeCompare(b.room),
//   },
// ];

const columns = [
  {
    title: "Item Name",
    dataIndex: "description",
    key: "description",
    sorter: (a, b) => a.description.localeCompare(b.description),
  },
//   {
//     title: "Stock Qty",
//     dataIndex: "quantity",
//     key: "quantity",
//     // sorter: (a, b) => a.quantity - b.quantity,
//     sorter: (a, b) => {
//   const getQty = (q) =>
//     Array.isArray(q)
//       ? q.reduce((sum, item) => sum + (item.qty || 0), 0)
//       : typeof q === "object" && q !== null && "qty" in q
//       ? q.qty
//       : typeof q === "number"
//       ? q
//       : 0;

//   return getQty(a.quantity) - getQty(b.quantity);
// },
//     // render: (quantity) => <strong>{quantity}</strong>,
//     render: (quantity) => {
//   if (Array.isArray(quantity)) {
//     return (
//       <strong>
//         {quantity
//           .map((item) =>
//             item && typeof item === "object" && "qty" in item
//               ? `${item.qty} pcs${item.volume ? ` / ${item.volume} ML` : ""}`
//               : "Invalid"
//           )
//           .join(", ")}
//       </strong>
//     );
//   } else if (quantity && typeof quantity === "object" && "qty" in quantity) {
//     return (
//       <strong>
//         {`${quantity.qty} pcs${quantity.volume ? ` / ${quantity.volume} ML` : ""}`}
//       </strong>
//     );
//   } else if (typeof quantity === "number" || typeof quantity === "string") {
//     return <strong>{quantity}</strong>;
//   } else {
//     return <strong>N/A</strong>;
//   }
// }
//   },
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
    render: (status) => {
      const normalizedStatus = status?.toLowerCase();
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

      return <Tag color={color}>{status?.toUpperCase()}</Tag>;
    },
  },
  {
    title: "Category",
    dataIndex: "category",
    key: "category",
    render: (category) => (
      <Tag color={category === "Chemical" ? "blue" : "geekblue"}>
        {category.toUpperCase()}
      </Tag>
    ),
  },
  {
    title: "Room Location",
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
            ...data, // Keep full data for modals/details
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
      data = data.filter((item) => item.status === sanitizedStatusFilter);
    }

    if (sanitizedCategoryFilter) {
      data = data.filter((item) => item.category === sanitizedCategoryFilter);
    }

    setFilteredData(data);
  }, [searchText, statusFilter, categoryFilter, inventoryData]);

  const handleRowClick = (record) => {
    setSelectedItem(record);
    setIsModalVisible(true);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout className="site-layout">
        <Content className="search-content">
          <div className="search-container">
            <Input
              placeholder="Search by item description..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              prefix={<SearchOutlined />}
              className="search-input"
            />

            <Space style={{ marginTop: 10 }} wrap>
              <Select
                placeholder="Filter by Status"
                allowClear
                style={{ width: 200 }}
                onChange={(value) => setStatusFilter(value)}
                value={statusFilter}
              >
                <Option value="Available">Available</Option>
                <Option value="Out of Stock">Out of Stock</Option>
                <Option value="In Use">In Use</Option>
              </Select>

              <Select
                placeholder="Filter by Category"
                allowClear
                style={{ width: 200 }}
                onChange={(value) => setCategoryFilter(value)}
                value={categoryFilter}
              >
                <Option value="Chemical">Chemical</Option>
                <Option value="Reagent">Reagent</Option>
                <Option value="Materials">Materials</Option>
                <Option value="Equipment">Equipment</Option>
                <Option value="Glasswares">Glasswares</Option>
              </Select>
            </Space>
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
                    {selectedItem.status}
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
