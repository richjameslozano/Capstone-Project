import React, { useState, useEffect, useMemo  } from "react";
import { Layout, Row, Col, Table, Input, Typography, Select, Tabs, Checkbox, Button, Modal, notification } from "antd";
import { DotChartOutlined, DropboxOutlined, EllipsisOutlined, FontSizeOutlined, StarOutlined } from '@ant-design/icons';
import { collection, onSnapshot, doc, updateDoc, addDoc, query, where, getDocs, deleteDoc, serverTimestamp, getDoc } from "firebase/firestore";
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
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isUnclaimedModalVisible, setIsUnclaimedModalVisible] = useState(false);
  const [unclaimedComment, setUnclaimedComment] = useState("");
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
              deployedQRCodes: Array.isArray(data.deployedQRCodes) ? data.deployedQRCodes : [],
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

          case "Unclaimed":
            color = "#595959"; // dark gray
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

  const handleCheckboxChange = (itemId, checked) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  const handleMarkAsUnclaimed = () => {
    if (selectedItems.size === 0) {
      // You could add a notification here
      return;
    }
    
    // Show confirmation modal
    setIsUnclaimedModalVisible(true);
  };

  const handleConfirmUnclaimed = async () => {
    try {
      const selectedItemsArray = Array.from(selectedItems);
      
      // Get current user info
      const userId = localStorage.getItem("userId");
      const userName = localStorage.getItem("userName");
      
      if (!userId || !userName) {
        notification.error({
          message: "Authentication Error",
          description: "User information not found. Please log in again.",
        });
        return;
      }

      // Process each selected item
      for (const itemId of selectedItemsArray) {
        const selectedItem = catalog.find(item => item.id === itemId);
        if (!selectedItem) continue;

        // 1. Update borrowcatalog status to "Unclaimed"
        const borrowDocRef = doc(db, "borrowcatalog", itemId);
        await updateDoc(borrowDocRef, { 
          status: "Unclaimed",
          unclaimedComment: unclaimedComment || "No comment provided",
          unclaimedBy: userName,
          unclaimedAt: serverTimestamp()
        });

        // 2. Restore inventory quantities and update QR codes for equipment items
        if (selectedItem.requestList && Array.isArray(selectedItem.requestList)) {
          for (const requestItem of selectedItem.requestList) {
            const itemQuantity = Number(requestItem.quantity) || 0;
            const selectedItemId = requestItem.selectedItemId;
            const labRoom = requestItem.labRoom;

            if (!selectedItemId || itemQuantity <= 0) continue;

            try {
              // Get inventory document
              const inventoryRef = doc(db, "inventory", selectedItemId);
              const inventorySnap = await getDoc(inventoryRef);
              
              if (inventorySnap.exists()) {
                const inventoryData = inventorySnap.data();
                const currentQty = Number(inventoryData.quantity || 0);
                const newQty = currentQty + itemQuantity;

                // Update inventory quantity
                await updateDoc(inventoryRef, { quantity: newQty });

                // Update condition breakdown (restore to Good condition)
                const currentGood = Number(inventoryData.condition?.Good || 0);
                const newGood = currentGood + itemQuantity;
                
                await updateDoc(inventoryRef, {
                  'condition.Good': newGood
                });

                // Handle equipment items - update QR code status to Available
                if (requestItem.category === "Equipment") {
                  try {
                    
                    // Check if there are deployedQRCodes for this item
                    if (selectedItem.deployedQRCodes && Array.isArray(selectedItem.deployedQRCodes)) {
                      
                      
                      // Find QR codes that match this item
                      const matchingQRCodes = selectedItem.deployedQRCodes.filter(qrCode => {
                        // Check if the QR code item name contains the request item name (for cases like "mikdubutest #13" vs "mikdubutest")
                        const matchesName = qrCode.itemName.includes(requestItem.itemName) || requestItem.itemName.includes(qrCode.itemName);
                        // Check if the individualItemId starts with the main itemId (for cases like "EQP1813" vs "EQP18")
                        const matchesId = qrCode.individualItemId.startsWith(inventoryData.itemId);
                        // Also check the selectedItemId field
                        const matchesSelectedId = qrCode.individualItemId === requestItem.selectedItemId;
                        
                        
                        return matchesName || matchesId || matchesSelectedId;
                      });

                      // Update each matching QR code individually
                      for (const qrCode of matchingQRCodes) {
                                              
                        try {
                          const response = await fetch('https://webnuls.onrender.com/update-qr-code', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              itemId: inventoryData.itemId, // Main item ID (e.g., "EQP13")
                              qrCodeId: qrCode.id, // Document ID from deployedQRCodes array
                              status: 'Available',
                              userId: selectedItem.accountId,
                              userName: selectedItem.userName
                            }),
                          });

                          const result = await response.json();
                          
                          if (response.ok) {
                            console.log(`✅ Updated QR code`);
                          } else {
                            console.error(`❌ Failed to update QR code`, result.error);
                          }
                        } catch (error) {
                          console.error(`❌ Error updating individual QR code`, error);
                        }
                      }
                    } else {
                      console.log(`⚠️ No deployedQRCodes found for equipment item: `);
                      console.log(`⚠️ deployedQRCodes value:`);
                    }
                  } catch (error) {
                    console.error(`❌ Error updating QR codes for equipment:`, error);
                  }
                }

                // Update lab room quantities if labRoom is specified
                if (labRoom) {
                  try {
                    const roomNumber = labRoom;
                    const labRoomCollectionRef = collection(db, "labRoom");
                    const q = query(labRoomCollectionRef, where("roomNumber", "==", roomNumber));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                      const labRoomDoc = querySnapshot.docs[0];
                      const labRoomDocId = labRoomDoc.id;
                      const itemId = inventoryData.itemId;
                      
                      const itemsCollectionRef = collection(db, "labRoom", labRoomDocId, "items");
                      const itemQuery = query(itemsCollectionRef, where("itemId", "==", itemId));
                      const itemSnapshot = await getDocs(itemQuery);

                      if (!itemSnapshot.empty) {
                        const itemDoc = itemSnapshot.docs[0];
                        const itemDocId = itemDoc.id;
                        const labRoomItemRef = doc(db, "labRoom", labRoomDocId, "items", itemDocId);
                        const labData = itemDoc.data();

                        const currentLabQty = Number(labData.quantity || 0);
                        const newLabQty = currentLabQty + itemQuantity;

                        await updateDoc(labRoomItemRef, { quantity: newLabQty });

                        // Update lab room condition breakdown
                        const currentLabGood = Number(labData.condition?.Good || 0);
                        const newLabGood = currentLabGood + itemQuantity;

                        await updateDoc(labRoomItemRef, {
                          'condition.Good': newLabGood
                        });

                      }
                    }
                  } catch (error) {
                    console.error(`❌ Error updating lab room quantities:`, error);
                  }
                }
              }
            } catch (error) {
              console.error(`❌ Error restoring inventory for item ${requestItem.itemName}:`, error);
            }
          }
        }

        // 2. Find and remove the "Request Approved" entry from user's history log
        const historyLogQuery = query(
          collection(db, `accounts/${selectedItem.accountId}/historylog`),
          where("action", "==", "Request Approved")
        );

        const historyLogSnapshot = await getDocs(historyLogQuery);
        
        for (const historyDoc of historyLogSnapshot.docs) {
          const historyData = historyDoc.data();
          
          // Check if this history entry matches the current request
          // Match by timestamp, room, and request details
          const matchesRequest = (
            historyData.room === selectedItem.room &&
            historyData.dateRequired === selectedItem.dateRequired &&
            historyData.course === selectedItem.course &&
            historyData.userName === selectedItem.userName
          );

          if (matchesRequest) {
            await deleteDoc(historyDoc.ref);
            
            // 3. Add new "Unclaimed" entry to history log
            await addDoc(collection(db, `accounts/${selectedItem.accountId}/historylog`), {
              action: "Unclaimed",
              userName: selectedItem.userName,
              timestamp: serverTimestamp(),
              requestList: selectedItem.requestList || [],
              program: selectedItem.program,
              room: selectedItem.room,
              dateRequired: selectedItem.dateRequired,
              timeFrom: selectedItem.timeFrom,
              timeTo: selectedItem.timeTo,
              approvedBy: userName,
              usageType: selectedItem.usageType || "N/A",
              course: selectedItem.course || "N/A",
              courseDescription: selectedItem.courseDescription || "N/A",
              reason: selectedItem.reason || "N/A",
              unclaimedComment: unclaimedComment || "No comment provided",
              unclaimedBy: userName,
              originalTimestamp: historyData.timestamp, 
            });
            
            break; 
          }
        }
      }
 
      notification.success({
        message: "Items Marked as Unclaimed",
        description: `${selectedItemsArray.length} item(s) have been successfully marked as unclaimed.`,
      });
 
      setSelectedItems(new Set());
      setUnclaimedComment("");

      setIsUnclaimedModalVisible(false);
      
    } catch (error) {
      console.error('Error marking items as unclaimed:', error);
      notification.error({
        message: "Error",
        description: "Failed to mark items as unclaimed. Please try again.",
      });
    }
  };

  const handleCancelUnclaimed = () => {
    setIsUnclaimedModalVisible(false);
    setUnclaimedComment(""); 
  };

  const getSelectedItemsData = () => {
    return catalog.filter(item => selectedItems.has(item.id));
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
  
    try {
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

  const normalizeDate = (dateString) => {
    if (!dateString) return null;
    
    try {
      let date;

      if (dateString instanceof Date) {
        date = dateString;

      } else if (typeof dateString === 'string') {
        if (dateString.includes('/')) {
          const parts = dateString.split('/');
          if (parts.length === 3) {
            date = new Date(parts[2], parts[0] - 1, parts[1])

          } else {
            date = new Date(dateString);
          }

        } else if (dateString.includes('-')) {
          date = new Date(dateString);

        } else {
          date = new Date(dateString);
        }

      } else {
        date = new Date(dateString);
      }

      date.setHours(0, 0, 0, 0);
      return date;

    } catch (e) {
      console.error('Error normalizing date:', dateString, e);
      return null;
    }
  };

  const isWithinNext7Days = (dateRequired) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day
    
    const requiredDate = normalizeDate(dateRequired);
    if (!requiredDate) {
      console.log('Failed to normalize date:', dateRequired);
      return false;
    }
    
    const diffTime = requiredDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays <= 7;
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout>
        <Content style={{ margin: "20px" }}>

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
                  Borrow Catalog
                </h1>
                <p style={{
                  color: "#a8d5e5",
                  fontSize: "16px",
                  margin: "0",
                  fontWeight: "500"
                }}>
                  Manage deployment and release requisitions on this page. <br/>
                  Monitor the status of each request throughout the process.
                  All items issued from the stockroom must be returned after use.
                </p>
              </div>
            </div>
          </div>

<Tabs defaultActiveKey="1" type="card" className="requisition-tabs">

<TabPane tab="For Release / Deployment" key="1">
  <div style={{ borderRadius: "8px" }}>
    {/* Section: Next 7 days */}
    <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <div style={{display: 'flex'}}>
    <StarOutlined style={{fontSize: 20, color: '#0f3c4c', alignSelf: 'flex-start', marginTop: 8}}/>
    <div style={{marginLeft: 10}}>
      <h2>Scheduled for deployment/releasing within the next seven (7) days.</h2>
      </div>
      </div>

      <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
        <Button
          type="primary"
          danger
          onClick={handleMarkAsUnclaimed}
          disabled={selectedItems.size === 0}
          className="unclaimed-button"
        >
          Mark as Unclaimed ({selectedItems.size})
        </Button>

        <Search
          style={{width: 600}}
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
      </div>
      </div>
    
    <div className="catalog-cards">
      {filteredCatalog
        .filter(
          (item) => {
            const hasCorrectStatus = ["For Release", "Borrowed"].includes(item.status);
            const isWithinDateRange = isWithinNext7Days(item.dateRequired);
            
            return hasCorrectStatus && isWithinDateRange;
          }
        )
        .sort((a, b) => new Date(a.dateRequired) - new Date(b.dateRequired))
        .map((item) => (
          <div
            key={item.id}
            className={`catalog-card ${selectedItems.has(item.id) ? 'selected' : ''}`}
            onClick={() => handleViewDetails(item)}
          >
            <div className="card-header">
              <h3>{item.requestor}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleCheckboxChange(item.id, e.target.checked);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  />
                </div>
                <span 
                  className={`status ${item.status.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {item.status}
                </span>
              </div>
            </div>
            <div className="card-body">
              <p><strong>Course:</strong> {item.course}</p>
              <p><strong>Description:</strong> {item.courseDescription}</p>
              <div style={{display: 'flex', padding: '10px 10px ', backgroundColor: '#e9ecee', borderRadius: 5}}>
              <p style={{margin: 0}}><strong>Date Required:</strong> {item.dateRequired}</p>
              </div>
            </div>
          </div>
        ))}
      {filteredCatalog.filter(
        (item) => {
          const hasCorrectStatus = ["For Release", "Borrowed"].includes(item.status);
          const isWithinDateRange = isWithinNext7Days(item.dateRequired);
          return hasCorrectStatus && isWithinDateRange;
        }
      ).length === 0 && <p>No requests within the next 7 days.</p>}
    </div>

      <div style={{display: 'flex'}}>
    <StarOutlined style={{fontSize: 20, color: '#0f3c4c', alignSelf: 'flex-start', marginTop: 8}}/>
    <div style={{marginLeft: 10}}>
  <h2>Other Requisitions with later dates.</h2>
  </div>
  </div>
    
    <div className="catalog-cards">
      {filteredCatalog
        .filter(
          (item) => {
            const hasCorrectStatus = ["For Release", "Borrowed"].includes(item.status);
            const isLaterDate = !isWithinNext7Days(item.dateRequired);
            
            return hasCorrectStatus && isLaterDate;
          }
        )
        .sort((a, b) => new Date(a.dateRequired) - new Date(b.dateRequired))
        .map((item) => (
          <div
            key={item.id}
            className={`catalog-card ${selectedItems.has(item.id) ? 'selected' : ''}`}
            onClick={() => handleViewDetails(item)}
          >
            <div className="card-header">
              <h3>{item.requestor}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Checkbox
                  checked={selectedItems.has(item.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleCheckboxChange(item.id, e.target.checked);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                />
                <span className={`status ${item.status.toLowerCase().replace(/\s+/g, "-")}`}>
                  {item.status}
                </span>
              </div>
            </div>
            <div className="card-body">
              <p><strong>Course:</strong> {item.course}</p>
              <p><strong>Description:</strong> {item.courseDescription}</p>
              <div style={{display: 'flex', padding: '10px 10px ', backgroundColor: '#e9ecee', borderRadius: 5}}>
              <p style={{margin: 0}}><strong>Date Required:</strong> {item.dateRequired}</p>
              </div>
            </div>
          </div>
        ))}
      {filteredCatalog.filter(
        (item) => {
          const hasCorrectStatus = ["For Release", "Borrowed"].includes(item.status);
          const isLaterDate = !isWithinNext7Days(item.dateRequired);
          return hasCorrectStatus && isLaterDate;
        }
      ).length === 0 && <p>No other requests.</p>}
    </div>
  </div>
</TabPane>

  <TabPane tab="Deployed / Released" key="2">
  <div style={{display: 'flex', justifyContent: 'space-between'}}>
  <div style={{display: 'flex'}}>
    <StarOutlined style={{fontSize: 20, color: '#0f3c4c', alignSelf: 'flex-start', marginTop: 8}}/>
    <div style={{marginLeft: 10}}>
  <h2 style={{margin:0}}>Requisitions deployed/released today.</h2>
  <p>All "Deployed" requisitions must be returned by faculty after use. By the end of each day, there should be no requisitions remaining in "Deployed" status.</p>
  </div>
  </div>

                  <Search
                   style={{width: 600, marginLeft: 20, justifySelf: 'flex-end'}}
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
  </div>
    <div className="catalog-cards">
      {filteredCatalog
        .filter((item) =>
          ["Deployed", "Released"].includes(item.status)
        )
        .sort((a, b) => new Date(a.dateRequired) - new Date(b.dateRequired))
        .map((item) => (
          <div
            key={item.id}
            className={`catalog-card ${selectedItems.has(item.id) ? 'selected' : ''}`}
            onClick={() => handleViewDetails(item)}
          >
            <div className="card-header">
              <h3>{item.requestor}</h3>
              <span className={`status ${item.status.toLowerCase().replace(/\s+/g, "-")}`}>
                {item.status}
              </span>
            </div>
            <div className="card-body">
              <p><strong>Course:</strong> {item.course}</p>
              <p><strong>Description:</strong> {item.courseDescription}</p>
              <div style={{display: 'flex', padding: '10px 10px ', backgroundColor: '#e9ecee', borderRadius: 5}}>
              <p style={{margin: 0}}><strong>Date Required:</strong> {item.dateRequired}</p>
              </div>
            </div>
          </div>
        ))}
    </div>
  </TabPane>

  <TabPane tab="Returned" key="3">
    <div style={{display: 'flex', justifyContent: 'space-between'}}>
      <div style={{display: 'flex'}}>
    <StarOutlined style={{fontSize: 20, color: '#0f3c4c', alignSelf: 'flex-start', marginTop: 8}}/>
    <div style={{marginLeft: 10}}>
      <h2 style={{margin: 0}}>Returned Items</h2>
      <p>All returned items must be reviewed and approved by laboratory personnel before the requisition can be marked as complete.</p>
      </div>
      </div>

                  <Search
                   style={{width: 600, marginLeft: 20, justifySelf: 'flex-end'}}
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
      </div>

    <div className="catalog-cards">
      {filteredCatalog
        .filter((item) => item.status === "Returned")
        .sort((a, b) => new Date(a.dateRequired) - new Date(b.dateRequired))
        .map((item) => (
          <div
            key={item.id}
            className={`catalog-card ${selectedItems.has(item.id) ? 'selected' : ''}`}
            onClick={() => handleViewDetails(item)}
          >
            <div className="card-header">
              <h3>{item.requestor}</h3>
              <span className={`status ${item.status.toLowerCase().replace(/\s+/g, "-")}`}>
                {item.status}
              </span>
            </div>
            <div className="card-body">
              <p><strong>Course:</strong> {item.course}</p>
              <p><strong>Description:</strong> {item.courseDescription}</p>
              <div style={{display: 'flex', padding: '10px 10px ', backgroundColor: '#e9ecee', borderRadius: 5}}>
              <p style={{margin: 0}}><strong>Date Required:</strong> {item.dateRequired}</p>
              </div>
            </div>
          </div>
        ))}
    </div>
  </TabPane>

  <TabPane tab="Return Approved" key="4">
    <div style={{display: 'flex', justifyContent: 'space-between'}}>
      <div style={{display: 'flex'}}>
    <StarOutlined style={{fontSize: 20, color: '#0f3c4c', alignSelf: 'flex-start', marginTop: 8}}/>
    <div style={{marginLeft: 10}}>
      <h2>Completed Requisitions</h2>
      {/* <p>All returned items must be reviewed and approved by laboratory personnel before the requisition can be marked as complete.</p> */}
      </div>
      </div>
                  <Search
                   style={{width: 600, marginLeft: 20, justifySelf: 'flex-end'}}
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
      </div>   

    <div className="catalog-cards">
      {filteredCatalog
        .filter((item) => item.status === "Return Approved")
        .sort((a, b) => new Date(a.dateRequired) - new Date(b.dateRequired))
        .map((item) => (
          <div
            key={item.id}
            className={`catalog-card ${selectedItems.has(item.id) ? 'selected' : ''}`}
            onClick={() => handleViewDetails(item)}
          >
            <div className="card-header">
              <h3>{item.requestor}</h3>
              <span className={`status ${item.status.toLowerCase().replace(/\s+/g, "-")}`}>
                {item.status}
              </span>
            </div>
            <div className="card-body">
              <p><strong>Course:</strong> {item.course}</p>
              <p><strong>Description:</strong> {item.courseDescription}</p>
              <div style={{display: 'flex', padding: '10px 10px ', backgroundColor: '#e9ecee', borderRadius: 5}}>
              <p style={{margin: 0}}><strong>Date Required:</strong> {item.dateRequired}</p>
              </div>
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
            <span className={`status ${item.status.toLowerCase().replace(/\s+/g, "-")}`}>
              {item.status}
            </span>
          </div>
          <div className="card-body">
            <p><strong>Course:</strong> {item.course}</p>
            <p><strong>Description:</strong> {item.courseDescription}</p>
            <div style={{display: 'flex', padding: '10px 10px ', backgroundColor: '#e9ecee', borderRadius: 5}}>
              <p style={{margin: 0}}><strong>Date Required:</strong> {item.dateRequired}</p>
              </div>
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

            <Modal
              title="Confirm Mark as Unclaimed"
              open={isUnclaimedModalVisible}
              onOk={handleConfirmUnclaimed}
              onCancel={handleCancelUnclaimed}
              okText="Mark as Unclaimed"
              zIndex={1015}
              cancelText="Cancel"
              okButtonProps={{
                danger: true,
                style: {
                  backgroundColor: '#ff4d4f',
                  borderColor: '#ff4d4f'
                }
              }}
              width={600}
            >
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '16px', marginBottom: '16px' }}>
                  Are you sure you want to mark the following <strong>{selectedItems.size}</strong> item(s) as unclaimed?
                </p>
                
                <div style={{ 
                  maxHeight: '300px', 
                  overflowY: 'auto', 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '6px',
                  padding: '12px',
                  backgroundColor: '#fafafa'
                }}>
                  {getSelectedItemsData().map((item, index) => (
                    <div key={item.id} style={{
                      padding: '8px 0',
                      borderBottom: index < getSelectedItemsData().length - 1 ? '1px solid #e8e8e8' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#333' }}>
                          {item.requestor}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          {item.course} - {item.courseDescription}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          Date Required: {item.dateRequired}
                        </div>
                      </div>
                      <span className={`status ${item.status.toLowerCase().replace(/\s+/g, "-")}`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div style={{ marginTop: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    Comment (Optional)
                  </label>
                  <Input.TextArea
                    value={unclaimedComment}
                    onChange={(e) => setUnclaimedComment(e.target.value)}
                    placeholder="Add a reason or note for marking these items as unclaimed..."
                    rows={3}
                    maxLength={500}
                    showCount
                    style={{
                      borderRadius: '6px',
                      resize: 'vertical'
                    }}
                  />
                </div>
                
                <p style={{ 
                  fontSize: '14px', 
                  color: '#ff4d4f', 
                  marginTop: '12px',
                  fontStyle: 'italic'
                }}>
                  ⚠️ This action cannot be undone. Items will be moved to the "Unclaimed" status.
                </p>
              </div>
            </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default BorrowCatalog;

