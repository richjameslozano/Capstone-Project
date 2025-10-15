import React, { useEffect, useState, useRef } from "react";
import { Table, Input, Button, Modal, Tabs, Tag } from "antd";
import { collection, getDocs, onSnapshot, doc, updateDoc, writeBatch, query, where } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import "../styles/adminStyle/LabRoomQR.css";
import { SearchOutlined, EditOutlined, SaveOutlined, DownloadOutlined, QrcodeOutlined, ToolOutlined, ExperimentOutlined, MedicineBoxOutlined, AppstoreAddOutlined } from '@ant-design/icons';
import { QRCodeSVG } from "qrcode.react";

const { TabPane } = Tabs;

const LabRoomQR = () => {
  const [labRooms, setLabRooms] = useState([]);
  const [originalRoomNumbers, setOriginalRoomNumbers] = useState({});
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [confirmRoomId, setConfirmRoomId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRooms, setExpandedRooms] = useState({});
  const [itemSearchTerms, setItemSearchTerms] = useState({});
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activeTab, setActiveTab] = useState("1"); // Default to Stock Room tab (1)
  const qrRefs = useRef({});
  const qrModalRef = useRef(null);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState({});
  const [modalDownloadLoading, setModalDownloadLoading] = useState(false);

  const [qrModal, setQrModal] = useState({
    visible: false,
    title: "",
    value: "",
  });

  
  useEffect(() => {
    const unsubscribeFunctions = [];

    const fetchLabRoomsWithItems = async () => {
      try {
        /* ---------- STEP 1: listen to every lab room ---------- */
        const labRoomUnsub = onSnapshot(
          collection(db, "labRoom"),
          (labRoomSnapshot) => {
            /* ---------- skeleton rooms ---------- */
            const rooms = labRoomSnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.name || "N/A",
                roomNumber: data.roomNumber || "N/A",
                qrCode: data.qrCode || "",
                items: [],     // will fill later
                shelves: {},   // will fill later
              };
            });

            setLabRooms(rooms);

            /* store original room numbers */
            const originalNumbers = {};
            rooms.forEach((room) => (originalNumbers[room.id] = room.roomNumber));
            setOriginalRoomNumbers(originalNumbers);

            /* ---------- STEP 2: listeners inside each room ---------- */
            labRoomSnapshot.docs.forEach((roomDoc) => {
              const roomId = roomDoc.id;

              /* 2‑A  items at /labRoom/{roomId}/items  (might be empty) */
              const itemsCollectionRef = collection(db, `labRoom/${roomId}/items`);
              const itemsUnsub = onSnapshot(itemsCollectionRef, (itemsSnap) => {
                const updatedItems = itemsSnap.docs.map((itemDoc) => {
                  const d = itemDoc.data();
                  return {
                    id: itemDoc.id,
                    category: d.category || "N/A",
                    condition: d.condition
                      ? `Good: ${d.condition.Good ?? 0}, Defect: ${
                          d.condition.Defect ?? 0
                        }, Damage: ${d.condition.Damage ?? 0}, Lost: ${
                          d.condition.Lost ?? 0
                        }`
                      : "N/A",
                    department: d.department || "N/A",
                    entryCurrentDate: d.entryCurrentDate || "N/A",
                    expiryDate: d.expiryDate || null,
                    itemId: d.itemId || "N/A",
                    itemName: d.itemName || "N/A",
                    itemDetails: d.itemDetails || "N/A",
                    labRoom: d.labRoom || "N/A",
                    quantity: d.quantity || 0,
                    status: d.status || "N/A",
                    type: d.type || "N/A",
                    rawTimestamp: d.rawTimestamp || "N/A",
                    timestamp: d.timestamp || "N/A",
                    unit: ["Chemical", "Reagent"].includes(d.category)
                      ? d.unit || "N/A"
                      : "N/A",
                  };
                });

                setLabRooms((prev) =>
                  prev.map((r) =>
                    r.id === roomId ? { ...r, items: updatedItems } : r
                  )
                );
              });
              unsubscribeFunctions.push(itemsUnsub);

              /* 2‑B  shelves & rows listener */
              const shelvesRef = collection(db, `labRoom/${roomId}/shelves`);
              const shelvesUnsub = onSnapshot(shelvesRef, async (shelfSnap) => {
                const updatedShelves = {};

                /* ---------- STEP 3: for each shelf → rows → items ---------- */
                for (const shelfDoc of shelfSnap.docs) {
                  const shelfId = shelfDoc.id;
                  const shelfData = shelfDoc.data();

                  /* rows under this shelf */
                  const rowsRef = collection(
                    db,
                    `labRoom/${roomId}/shelves/${shelfId}/rows`
                  );
                  const rowsSnap = await getDocs(rowsRef);

                  /* build rows with *items* sub‑collection */
                  const rows = await Promise.all(
                    rowsSnap.docs.map(async (rowDoc) => {
                      const rowData = rowDoc.data(); // rowQR, createdAt, etc.
                      const rowId = rowDoc.id;

                      /* items under this row */
                      const itemsRef = collection(
                        db,
                        `labRoom/${roomId}/shelves/${shelfId}/rows/${rowId}/items`
                      );
                      const itemsSnap = await getDocs(itemsRef);
                      const items = itemsSnap.docs.map((it) => ({
                        id: it.id,
                        ...it.data(),
                      }));

                      return {
                        rowId,
                        ...rowData,
                        items, // ← aggregated items for this row
                      };
                    })
                  );

                  updatedShelves[shelfId] = {
                    ...shelfData,
                    rows,
                  };
                }

                /* ---------- STEP 4: write shelves back to room ---------- */
                setLabRooms((prev) =>
                  prev.map((r) =>
                    r.id === roomId ? { ...r, shelves: updatedShelves } : r
                  )
                );
              });

              unsubscribeFunctions.push(shelvesUnsub);
            });
          }
        );

        unsubscribeFunctions.push(labRoomUnsub);
      } catch (err) {
        console.error("Error setting up real‑time listeners:", err);
      }
    };

    fetchLabRoomsWithItems();

    /* cleanup */
    return () => {
      unsubscribeFunctions.forEach((unsub) => unsub && unsub());
    };
  }, []);

  const toggleRoomExpansion = (roomId) => {
    // Toggle the expansion state for the room
    setExpandedRooms((prev) => ({
      ...prev,
      [roomId]: !prev[roomId],
    }));

    // Automatically set the active tab to Shelves (tab 2) when expanding the room
    setSelectedRoom(roomId); 
    setActiveTab("2"); // Switch to Shelves tab
  };

  // Example: When the room number is clicked, set the selected room
  const selectRoom = (roomId) => {
    setSelectedRoom(roomId);
  };

  const closeQrModal = () =>
    setQrModal((prev) => ({ ...prev, visible: false }));

 const updateRoomNumber = async (roomId, oldRoomNumber, newRoomNumber) => {
    try {
      // 🔍 Step 1: Check if the new room number already exists (excluding the current roomId)
      const labRoomRef = collection(db, "labRoom");
      const existingRoomQuery = query(
        labRoomRef,
        where("roomNumber", "==", newRoomNumber)
      );
      const existingRoomSnapshot = await getDocs(existingRoomQuery);

      const isRoomNumberTaken = existingRoomSnapshot.docs.some(doc => doc.id !== roomId);

      if (isRoomNumberTaken) {
        alert(`❌ Room number "${newRoomNumber}" already exists.`);
        return;
      }

      // ✅ Step 2: Proceed with update
      const roomRef = doc(db, "labRoom", roomId);
      await updateDoc(roomRef, {
        roomNumber: newRoomNumber,
      });

      const batch = writeBatch(db);

      // 🔁 Update labRoom field in labRoom/{roomId}/items
      const itemsRef = collection(db, "labRoom", roomId, "items");
      const itemsSnapshot = await getDocs(itemsRef);

      itemsSnapshot.forEach((itemDoc) => {
        const itemRef = doc(db, "labRoom", roomId, "items", itemDoc.id);
        batch.update(itemRef, {
          labRoom: newRoomNumber,
        });
      });

      // 🔁 Update labRoom field in inventory
      const inventoryRef = collection(db, "inventory");
      const inventoryQuery = query(
        inventoryRef,
        where("labRoom", "==", oldRoomNumber.trim())
      );

      const inventorySnapshot = await getDocs(inventoryQuery);

      inventorySnapshot.forEach((invDoc) => {
        const invRef = doc(db, "inventory", invDoc.id);
        batch.update(invRef, {
          labRoom: newRoomNumber,
        });
      });

      await batch.commit();

      // ✅ Update UI state
      setOriginalRoomNumbers((prev) => ({
        ...prev,
        [roomId]: newRoomNumber,
      }));
      
    } catch (error) {
      console.error("❌ Error updating lab room and related data:", error);
    }
  };


  const downloadQRCode = (id) => {
    setDownloadLoading(prev => ({ ...prev, [id]: true }));
    
    const svg = qrRefs.current[id]?.querySelector("svg");
    if (!svg) {
      setDownloadLoading(prev => ({ ...prev, [id]: false }));
      return;
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const img = new Image();
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);

          const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");

          const downloadLink = document.createElement("a");
          downloadLink.href = pngUrl;
          downloadLink.download = `${id}-QR.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        } catch (error) {
          console.error("Error downloading QR code:", error);
        } finally {
          setDownloadLoading(prev => ({ ...prev, [id]: false }));
        }
      };

      img.onerror = () => {
        console.error("Error loading image for QR code download");
        setDownloadLoading(prev => ({ ...prev, [id]: false }));
      };

      img.src = url;
    } catch (error) {
      console.error("Error setting up QR code download:", error);
      setDownloadLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const downloadQRCodeFromModal = () => {
    setModalDownloadLoading(true);
    
    const svg = qrModalRef.current?.querySelector("svg");
    if (!svg) {
      setModalDownloadLoading(false);
      return;
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const img = new Image();
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);

          const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");

          const downloadLink = document.createElement("a");
          downloadLink.href = pngUrl;
          downloadLink.download = `${qrModal.title || "qr"}-QR.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        } catch (error) {
          console.error("Error downloading QR code from modal:", error);
        } finally {
          setModalDownloadLoading(false);
        }
      };

      img.onerror = () => {
        console.error("Error loading image for modal QR code download");
        setModalDownloadLoading(false);
      };

      img.src = url;
    } catch (error) {
      console.error("Error setting up modal QR code download:", error);
      setModalDownloadLoading(false);
    }
  };

  

  const filteredRooms = labRooms.filter((room) => {
    const roomMatch =
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const itemMatch = room.items.some((item) =>
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return roomMatch || itemMatch;
  });



 const renderShelves = (roomId) => {
  const room = labRooms.find((r) => r.id === roomId);

  // Guard clause
  if (!room || !room.shelves || typeof room.shelves !== "object") {
    return <div>No shelves available for this room.</div>;
  }

  // Columns
  const columns = [
    {
      title: "Shelf",
      dataIndex: "shelfLabel",
      key: "shelfLabel",
    },
    {
      title: "Shelf QR",
      dataIndex: "shelfQR",
      key: "shelfQR",
      render: (qr, record) => (
        <div className="shelf-qr">
          <div ref={(el) => (qrRefs.current[record.key] = el)}>
            <QRCodeSVG value={qr || "No QR"} size={96} />
          </div>
          <Button
            size="small"
            onClick={() => downloadQRCode(record.key)}
            style={{ marginTop: 8 }}
          >
            Download
          </Button>
        </div>
      ),
    },
    {
      title: "Rows",
      dataIndex: "rows",
      key: "rows",
      render: (rows) =>
        rows?.length ? (
          rows.map((r) => <div key={r.rowId}>Row {r.rowId}</div>)
        ) : (
          <i>No rows</i>
        ),
    },
    {
      title: "Row QR",
      dataIndex: "rows",
      key: "rowQR",
      render: (rows, record) =>
        rows?.length ? (
          rows.map((r) => (
            <div key={r.rowId}>
              <Button
                size="small"
                type="link"
                onClick={() =>
                  setQrModal({
                    visible: true,
                    title: `${record.shelfLabel} – Row ${r.rowId}`,
                    value: r.rowQR || "No QR",
                  })
                }
              >
                View QR
              </Button>
            </div>
          ))
        ) : (
          <i>No rows</i>
        ),
    },
    {
      title: "Items on Row",
      dataIndex: "rows",
      key: "items",
      render: (rows) =>
        rows?.length ? (
          rows.map((r) => (
            <div key={r.rowId} className="row-items">
              <strong>Row {r.rowId}</strong>
              {r.items?.length ? (
                <ul>
                  {r.items.map((it) => (
                    <li key={it.id || it.itemId}>{it.itemName || "(Unnamed)"}</li>
                  ))}
                </ul>
              ) : (
                <i>No items</i>
              )}
            </div>
          ))
        ) : (
          <i>No rows</i>
        ),
    },
  ];

  // Data
  const data = Object.entries(room.shelves).map(([shelfId, shelfData]) => ({
    key: shelfId,
    shelfLabel: shelfData.name || `Shelf ${shelfId}`,
    shelfQR: shelfData.shelvesQR,
    rows: shelfData.rows || [],
  }));

  return (
    <div className="labroom-table-container">
      <Table
        className="labroom-table"
        columns={columns}
        dataSource={data}
        pagination={false}
        bordered
        scroll={{ x: 800 }}
      />
    </div>
  );
};
  const renderRows = (roomId) => {
    const room = labRooms.find((r) => r.id === roomId);
    if (!room || !room.shelves || Object.keys(room.shelves).length === 0) {
      return <div>No rows available for this room.</div>;
    }

    const rowColumns = [
      {
        title: 'Row Number',
        dataIndex: 'row',
        key: 'row',
        render: (text) => <span>{text}</span>,
      },
      {
        title: 'Item ID',
        dataIndex: 'itemId',
        key: 'itemId',
        render: (text) => <span>{text}</span>,
      },
      {
        title: 'Row QR Code',
        dataIndex: 'rowQR',
        key: 'rowQR',
        render: (text) => <QRCodeSVG value={text} size={128} />,
      },
    ];

    // Prepare row data
    const rowData = [];
    Object.entries(room.shelves).forEach(([shelfId, shelfData]) => {
      if (shelfData.rows && shelfData.rows.length > 0) {
        shelfData.rows.forEach((row) => {
          rowData.push({
            row: row.row,
            itemId: row.itemId,
            rowQR: row.rowQR,
          });
        });
      }
    });

    return (
      <div className="labroom-table-container">
        <Table 
        className="labroom-table"
          columns={rowColumns} 
          dataSource={rowData} 
          rowKey="row"
          scroll={{ x: 600 }} // Enable horizontal scrolling
        />
      </div>
    );
  };

const categoryConfig = {
  Equipment: {
    icon: <ToolOutlined />,
    color: "green",
  },
  Chemical: {
    icon: <ExperimentOutlined />,
    color: "purple",
  },
  Reagent: {
    icon: <MedicineBoxOutlined />,
    color: "blue",
  },
  Glasswares: {
    icon: <ExperimentOutlined />,
    color: "gold", // AntD color keyword for yellow
  },
  Materials: {
    icon: <AppstoreAddOutlined />,
    color: "orange",
  },
};

  return (
    <div className="labroom-container">
      <div className="labroom-header-section">
        <div className="labroom-header-content">
          <QrcodeOutlined className="labroom-header-icon" />
          <h2 className="labroom-header">Stock Room Details</h2>
        </div>
        <div className="labroom-search-container">
          <Input.Search
            placeholder="Search lab room by name or room number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="labroom-search"
            allowClear
            size="large"
            prefix={<SearchOutlined />}
          />
        </div>
      </div>

      {filteredRooms.length === 0 && (
        <div className="labroom-no-results">
          <div className="labroom-no-results-content">
            <SearchOutlined className="labroom-no-results-icon" />
            <p>Room Not Found</p>
            <span>Try adjusting your search criteria</span>
          </div>
        </div>
      )}

      <div className="labroom-content">
        {filteredRooms
          .filter(room => room.items && room.items.length > 0)
          .map(room => {
            const isExpanded = expandedRooms[room.id];
            const filteredItems = room.items.filter(item =>
              item.itemName.toLowerCase().includes((itemSearchTerms[room.id] || "").toLowerCase()) ||
              item.itemDetails.toLowerCase().includes((itemSearchTerms[room.id] || "").toLowerCase()) ||
              item.category.toLowerCase().includes((itemSearchTerms[room.id] || "").toLowerCase())
            );

            return (
              <div key={room.id} className="labroom-card">
                <div className="labroom-card-header" onClick={() => toggleRoomExpansion(room.id)}>
                  <div className="labroom-title-section">
                    <div className="labroom-room-info">
                      <span className="labroom-room-label">Room:</span>
                      {editingRoomId === room.id ? (
                        <input
                          type="number"
                          value={room.roomNumber}
                          onChange={(e) => {
                            const newRoomNumber = e.target.value;
                            setLabRooms(prev =>
                              prev.map(r => r.id === room.id ? { ...r, roomNumber: newRoomNumber } : r)
                            );
                          }}
                          className="labroom-room-input"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="labroom-room-number">{room.roomNumber}</span>
                      )}
                    </div>

                    {isExpanded && (
                      <Button
                        type="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (editingRoomId === room.id) {
                            setConfirmRoomId(room.id);
                            setIsConfirmModalVisible(true);
                            setEditingRoomId(null);
                          } else {
                            setEditingRoomId(room.id);
                          }
                        }}
                        className="labroom-edit-button"
                        icon={editingRoomId === room.id ? <SaveOutlined /> : <EditOutlined />}
                      >
                        {editingRoomId === room.id ? "Save" : "Edit"}
                      </Button>
                    )}
                  </div>

                  <div className="labroom-expand-section">
                    <span className="labroom-item-count">{filteredItems.length} items</span>
                    <span className={`labroom-expand-arrow ${isExpanded ? 'expanded' : ''}`}>
                      ▼
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="labroom-card-content">
                    <div className="labroom-search-section">
                      <Input
                        type="text"
                        placeholder="Search items in this room"
                        value={itemSearchTerms[room.id] || ""}
                        onChange={(e) => setItemSearchTerms(prev => ({ ...prev, [room.id]: e.target.value }))}
                        className="labroom-item-search"
                        prefix={<SearchOutlined />}
                        allowClear
                      />
                    </div>

                    <div className="labroom-tabs-container">
                      <Tabs defaultActiveKey="1" className="labroom-tabs">
                        <TabPane tab="Stock Room" key="1">
                          <div className="labroom-table-wrapper">
                            <div className="labroom-table-container">
<Table
  dataSource={filteredItems.map((item, index) => ({
    ...item,
    key: item.id,
    roomId: room.id,
    roomQrCode: room.qrCode,
    rowIndex: index,
  }))}
  columns={[
  {
    title: "QR Code",
    dataIndex: "qr",
    key: "qr",
    render: (_, record, index) => {
      if (index === 0) {
        return (
          <div className="labroom-qr-container">
            <div
              ref={(el) => (qrRefs.current[record.roomId] = el)}
              className="labroom-qr-code"
            >
              <QRCodeSVG
                value={record.roomQrCode || "No QR code available"}
                size={120}
                bgColor="#ffffff"
                fgColor="#0b2d39"
              />
            </div>
            <Button
              onClick={() => downloadQRCode(record.roomId)}
              className="labroom-download-button"
              loading={downloadLoading[record.roomId]}
              icon={<DownloadOutlined />}
              size="small"
            >
              Download QR
            </Button>
          </div>
        );
      }
      return null;
    },
    onCell: (_, index) => {
      if (index === 0) {
        return { rowSpan: filteredItems.length }; // merge down all rows
      }
      return { rowSpan: 0 }; // hide cell completely
    },
  },
  {
    title: "Item Name",
    dataIndex: "itemName",
    key: "itemName",
    render: (text) => <span className="labroom-item-name">{text}</span>,
  },
  {
    title: "Description",
    dataIndex: "itemDetails",
    key: "itemDetails",
    render: (text) => <span className="labroom-item-details">{text}</span>,
  },
  {
    title: "Category",
    dataIndex: "category",
    key: "category",
    render: (cat) => {
      const config = categoryConfig[cat] || {};
      return (
        <Tag
          color={config.color || "default"}
          icon={config.icon || null}
          style={{ fontSize: 14, padding: "4px 8px" }}
        >
          {cat}
        </Tag>
      );
    },
  },
  {
    title: "Condition",
    dataIndex: "condition",
    key: "condition",
    render: (cond) => (
      <span className={`labroom-condition-badge condition-${cond.toLowerCase()}`}>
        {cond}
      </span>
    ),
  },
  {
    title: "Department",
    dataIndex: "department",
    key: "department",
  },
  {
    title: "Quantity",
    dataIndex: "quantity",
    key: "quantity",
    render: (q) => <span className="labroom-quantity">{q}</span>,
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status) => (
      <span
        className={`labroom-status-badge status-${status
          .toLowerCase()
          .replace(" ", "-")}`}
      >
        {status}
      </span>
    ),
  },
  {
    title: "Type",
    dataIndex: "type",
    key: "type",
  },
  {
    title: "Unit",
    dataIndex: "unit",
    key: "unit",
  },

  ]}
  pagination={false}
  bordered
  className="labroom-table"
/>;
                            </div>
                          </div>
                        </TabPane>

                        <TabPane tab="Shelves" key="2">
                          <div className="labroom-shelves-container">
                            {selectedRoom ? (
                              renderShelves(selectedRoom)
                            ) : (
                              <div className="labroom-no-selection">
                                <QrcodeOutlined className="labroom-no-selection-icon" />
                                <span>Select a room to view shelves</span>
                              </div>
                            )}
                          </div>
                        </TabPane>
                      </Tabs>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      <Modal
        title="Confirm Room Number Update"
        open={isConfirmModalVisible}
        zIndex={1023}
        onOk={() => {
          if (confirmRoomId) {
            updateRoomNumber(
              confirmRoomId,
              originalRoomNumbers[confirmRoomId],
              filteredRooms.find(r => r.id === confirmRoomId)?.roomNumber
            );
          }
          setIsConfirmModalVisible(false);
          setConfirmRoomId(null);
        }}
        onCancel={() => {
          setIsConfirmModalVisible(false);
          setConfirmRoomId(null);
        }}
        okText="Yes, Update"
        cancelText="Cancel"
        className="labroom-confirm-modal"
      >
        <div className="labroom-modal-content">
          <p>
            Are you sure you want to change the room number from{" "}
            <strong className="labroom-old-number">"{originalRoomNumbers[confirmRoomId]}"</strong> to{" "}
            <strong className="labroom-new-number">"{filteredRooms.find(r => r.id === confirmRoomId)?.roomNumber}"</strong>?
          </p>
        </div>
      </Modal>

      <Modal
        open={qrModal.visible}
        onCancel={closeQrModal}
        footer={null}
        title={qrModal.title}
        destroyOnClose
        centered
        zIndex={1031}
        className="labroom-qr-modal"
      >
        <div className="labroom-qr-modal-content">
          <div className="labroom-qr-modal-code" ref={qrModalRef}>
            <QRCodeSVG 
              value={qrModal.value} 
              size={200} 
              bgColor="#ffffff"
              fgColor="#0b2d39"
            />
          </div>
          <Button
            onClick={downloadQRCodeFromModal}
            loading={modalDownloadLoading}
            type="primary"
            size="large"
            icon={<DownloadOutlined />}
            className="labroom-qr-modal-download"
          >
            Download QR Code
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default LabRoomQR;
