import React, { useState, useEffect } from "react";
import {
  Layout,
  Table,
  Button,
  Input,
  Form,
  Modal,
  Popconfirm,
  Select,
  InputNumber,
} from "antd";
import { PlusOutlined, CheckOutlined, CloseOutlined, FileTextFilled, UploadOutlined, CheckCircleOutlined, PrinterOutlined } from "@ant-design/icons";
import { db } from "../../backend/firebase/FirebaseConfig"; 
import { collection, addDoc, doc, setDoc, serverTimestamp, onSnapshot, deleteDoc, getDocs, writeBatch } from "firebase/firestore"; 
import "../styles/usersStyle/CapexRequest.css";
import NotificationModal from "../customs/NotificationModal"; 
import FinalizeCapexModal from "../customs/FinalizeCapexModal";
import "../styles/usersStyle/CapexRequest.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const { Content } = Layout;

const CapexRequest = () => {
  const [form] = Form.useForm();
  const [dataSource, setDataSource] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isFinalizeModalVisible, setIsFinalizeModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedRowDetails, setSelectedRowDetails] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [capexHistory, setCapexHistory] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const yearRange = `${currentYear}-${nextYear}`;
  const { Option } = Select;

  useEffect(() => {
    const userId = localStorage.getItem("userId");
  
    if (!userId) return;
  
    const capexRequestRef = collection(db, `accounts/${userId}/temporaryCapexRequest`);
  
    const unsubscribe = onSnapshot(capexRequestRef, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Ignore items that are marked deleted
        if (!data.deleted) {
          items.push({
            ...data,
            id: doc.id,
          });
        }
      });
  
      // Assign 'no' field based on index
      const numberedItems = items.map((item, index) => ({
        ...item,
        no: index + 1,
      }));
  
      setDataSource(numberedItems);
      calculateTotalPrice(numberedItems);
    });
  
    return () => unsubscribe(); // Detach listener when component unmounts
  }, []);


  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const capexHistoryRef = collection(db, `accounts/${userId}/capexrequests`);
    
    const unsubscribeHistory = onSnapshot(capexHistoryRef, (snapshot) => {
      const historyData = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      // ✅ Extract all subjects from nested items arrays
      const allSubjects = historyData.flatMap(doc =>
        (doc.items || []).map(item => item.subject).filter(Boolean)
      );

      // ✅ Get unique subjects
      const uniqueSubjects = [...new Set(allSubjects)];
      setSubjectOptions(uniqueSubjects);

      const currentFilter = subjectFilter || ""; 

      // ✅ Filter based on selected subject
      const filteredData = historyData.filter(doc =>
        currentFilter === "" ||
        (doc.items || []).some(item =>
          (item.subject || "").toLowerCase() === currentFilter.toLowerCase()
        )
      );

      setCapexHistory(filteredData);
    });

    return () => unsubscribeHistory(); // Cleanup
  }, [subjectFilter]); 

  const logRequestOrReturn = async (userId, userName, action, requestDetails) => {
    await addDoc(collection(db, `accounts/${userId}/activitylog`), {
      action, // e.g. "Requested Items" or "Returned Items"
      userName,
      timestamp: serverTimestamp(),
      requestList: requestDetails, 
    });
  };

  const showModal = () => {
    setIsModalVisible(true);
    form.resetFields();
    setEditingRow(null);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleView = (record) => {
    setSelectedRowDetails(record); 
    setViewModalVisible(true); 
  };  

  // const calculateTotalPrice = (data) => {
  //   const total = data.reduce(
  //     (sum, item) => sum + (item.estimatedCost * item.qty || 0),
  //     0
  //   );
  //   setTotalPrice(total);
  // };

  const calculateTotalPrice = (data) => {
    if (!Array.isArray(data)) return;

    const total = data.reduce(
      (sum, item) => sum + ((item.estimatedCost || 0) * (item.qty || 0)),
      0
    );

    setTotalPrice(total);
  };
  
  const handlePrint = () => {
    const itemsToPrint = selectedRowDetails?.items;
    const username = selectedRowDetails?.userName || "N/A";
    const totalPrice = selectedRowDetails?.totalPrice || "N/A";
    let submissionDate = selectedRowDetails?.createdAt || "N/A";
  
    if (submissionDate && submissionDate.toDate) {
      submissionDate = submissionDate.toDate().toLocaleString(); 

    } else if (submissionDate && submissionDate !== "N/A") {
      const regex = /(\d{1,2} \w+ \d{4}) at (\d{2}:\d{2}:\d{2}) (UTC[+-]\d{1,2})/;
      const match = submissionDate.match(regex);
  
      if (match) {
        const dateString = match[1]; // "26 April 2025"
        const timeString = match[2]; // "16:57:55"
        const timeZoneString = match[3]; // "UTC+8"
  
        // Convert the month name to a month number (April -> 04)
        const monthMap = {
          January: '01', February: '02', March: '03', April: '04', May: '05', June: '06',
          July: '07', August: '08', September: '09', October: '10', November: '11', December: '12'
        };

        const [day, monthName, year] = dateString.split(' ');
        const month = monthMap[monthName] || '01';
        const timezoneOffset = timeZoneString.replace('UTC', '');
        const formattedDate = `${year}-${month}-${day}T${timeString}${timezoneOffset}:00`;
        const dateObj = new Date(formattedDate);
  
        if (!isNaN(dateObj)) {
          submissionDate = dateObj.toLocaleString();

        } else {
          submissionDate = "Invalid Date Format";
        }

      } else {
        submissionDate = "Invalid Date Format";
      }
    }
  
    if (!Array.isArray(itemsToPrint) || itemsToPrint.length === 0) {
      
      return;
    }
  
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("CAPEX Request Details", 10, 10);
  
    doc.setFontSize(12);
    doc.text(`Username: ${username}`, 10, 20);
    doc.text(`Total Price: ${totalPrice}`, 10, 28);
    doc.text(`Submission Date: ${submissionDate}`, 10, 36);
  
    const tableColumn = ["Item Name", "Subject", "Brand", "Quantity", "Estimated Cost", "Justification"];
    const tableRows = itemsToPrint.map((item) => [
      item.itemDescription || "-",
      item.subject || "-",
      item.brand || "-",
      item.qty || "-",
      item.estimatedCost || "-",
      item.justification || "-"
    ]);
  
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 44, // start below the text
      theme: "grid",
    });
  
    doc.save("capex_request.pdf");
  
  };  
  const sanitizeInput = (input) => {
  if (typeof input !== "string") return input; // Return as is if not a string
  // Remove HTML tags and non-alphanumeric characters (except spaces)
  return input.trim().replace(/<[^>]+>/g, "").replace(/[^\w\s]/gi, "");
};


  
//   const handleSave = async (values) => {
//   setIsModalVisible(false);

//   // Sanitize input values before saving
//   const sanitizedValues = {
//     itemDescription: sanitizeInput(values.itemDescription),
//     subject: sanitizeInput(values.subject),
//     justification: sanitizeInput(values.justification),
//     qty: values.qty, // qty should be a number, no need for sanitization unless necessary
//     estimatedCost: values.estimatedCost, // Same for estimatedCost
//   };

//   // If editing an existing item
//   if (editingRow !== null) {
//     const updatedItem = {
//       ...sanitizedValues,
//       id: editingRow.id,
//       totalPrice: sanitizedValues.qty * sanitizedValues.estimatedCost, // Ensure total price is updated
//     };

//     try {
//       const userId = localStorage.getItem("userId");
//       const capexRequestRef = doc(db, `accounts/${userId}/temporaryCapexRequest`, editingRow.id);
//       await setDoc(capexRequestRef, updatedItem);

//       // Logging the action
//       await logRequestOrReturn(userId, localStorage.getItem("userName"), "Updated a Capex Item", updatedItem);

//       setNotificationMessage("Item updated successfully!");
//       setNotificationVisible(true);

//       calculateTotalPrice(); // Recalculate total price

//     } catch (error) {
//       setNotificationMessage("Failed to update Item.");
//       setNotificationVisible(true);
//     }
//   } else {
//     // If adding a new item
//     const newItem = {
//       ...sanitizedValues,
//       totalPrice: sanitizedValues.qty * sanitizedValues.estimatedCost, // Ensure total price is calculated
//     };

//     try {
//       const userId = localStorage.getItem("userId");
//       const capexRequestRef = await addDoc(collection(db, `accounts/${userId}/temporaryCapexRequest`), newItem);
//       const newItemWithId = {
//         ...newItem,
//         id: capexRequestRef.id,
//         no: dataSource.length + 1, // Number the items in the list
//       };

//       setNotificationMessage("Item added successfully!");
//       setNotificationVisible(true);

//       // Update the state to reflect the new item
//       setDataSource([...dataSource, newItemWithId]);
//       calculateTotalPrice(); // Recalculate total price after adding new item

//     } catch (error) {
//       setNotificationMessage("Failed to add Item.");
//       setNotificationVisible(true);
//     }
//   }
// };

  const handleSave = async (values) => {
    setSaveLoading(true);
    setIsModalVisible(false);

    // Sanitize input values before saving
    const sanitizedValues = {
      itemDescription: sanitizeInput(values.itemDescription),
      subject: sanitizeInput(values.subject),
      brand: sanitizeInput(values.brand),
      justification: sanitizeInput(values.justification),
      qty: values.qty, // Assume already validated as number >= 1
      estimatedCost: values.estimatedCost || 0,
    };

    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");

    if (!userId || !userName) {
      setNotificationMessage("User not authenticated.");
      setNotificationVisible(true);
      return;
    }

    if (editingRow !== null) {
      // Updating an existing item
      const updatedItem = {
        ...sanitizedValues,
        id: editingRow.id,
        totalPrice: sanitizedValues.qty * sanitizedValues.estimatedCost,
      };

      try {
        const capexRequestRef = doc(db, `accounts/${userId}/temporaryCapexRequest`, editingRow.id);
        await setDoc(capexRequestRef, updatedItem);

        await logRequestOrReturn(userId, userName, "Updated a Capex Item", updatedItem);

        setNotificationMessage("Item updated successfully!");
        setNotificationVisible(true);

        calculateTotalPrice(); // Recalculate after update

      } catch (error) {
        console.error("Update Item Error:", error);
        setNotificationMessage("Failed to update Item.");
        setNotificationVisible(true);
      }
    } else {
      // Adding a new item
      const newItem = {
        ...sanitizedValues,
        totalPrice: sanitizedValues.qty * sanitizedValues.estimatedCost,
      };

      try {
        const capexRequestRef = await addDoc(
          collection(db, `accounts/${userId}/temporaryCapexRequest`),
          newItem
        );

        const newItemWithId = {
          ...newItem,
          id: capexRequestRef.id,
          no: (dataSource?.length || 0) + 1, // Safe fallback if dataSource is empty
        };

        setNotificationMessage("Item added successfully!");
        setNotificationVisible(true);

        // setDataSource([...dataSource, newItemWithId]);
        // calculateTotalPrice(); 

        const updatedData = [...(Array.isArray(dataSource) ? dataSource : []), newItemWithId];
        setDataSource(updatedData);
        calculateTotalPrice(updatedData); 

      } catch (error) {
        console.error("Add Item Error:", error);
        setNotificationMessage("Failed to add Item.");
        setNotificationVisible(true);
      } finally {
        setSaveLoading(false);
      }
    }
  };

 const handleDelete = async (id) => {
  setDeleteLoading(true);
  const sanitizedId = sanitizeInput(id); // Ensure sanitized ID

  const updatedData = dataSource.filter((item) => item.id !== sanitizedId);
  setDataSource(updatedData);
  calculateTotalPrice(updatedData);

  setNotificationMessage("Item deleted successfully!");
  setNotificationVisible(true);

  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName");

    try {
      const capexRequestRef = doc(db, `accounts/${userId}/temporaryCapexRequest`, sanitizedId);
      await deleteDoc(capexRequestRef);

      await logRequestOrReturn(userId, userName, "Deleted a Capex Item", [
        { deletedItemId: sanitizedId }
      ]);
    } catch (error) {
      setNotificationMessage("Failed to delete Item");
      setNotificationVisible(true);
    } finally {
      setDeleteLoading(false);
    }
  };

  const editRow = (record) => {
    setEditingRow(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    setSubmitLoading(true);
    if (dataSource.length === 0) {
      setNotificationMessage("Please add at least one item to submit");
      setNotificationVisible(true);
      setSubmitLoading(false);
      return;
    }
  
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
  
    try {
      // Step 1: Add to root collection "capexrequestlist"
      const capexRequestRef = await addDoc(collection(db, "capexrequestlist"), {
        userId,
        userName,
        totalPrice,
        createdAt: serverTimestamp(),
        items: dataSource,
      });
  
      // Step 2: Add to user's "capexrequests" subcollection
      await addDoc(collection(db, `accounts/${userId}/capexrequests`), {
        capexRequestId: capexRequestRef.id,
        userId,
        userName,
        totalPrice,
        createdAt: serverTimestamp(),
        items: dataSource,
      });
  
      // Step 3: Fetch all documents inside "temporaryCapexRequest" and delete them
      const tempCapexSnapshot = await getDocs(collection(db, `accounts/${userId}/temporaryCapexRequest`));
      const deletePromises = tempCapexSnapshot.docs.map((docSnapshot) => 
        deleteDoc(doc(db, `accounts/${userId}/temporaryCapexRequest/${docSnapshot.id}`))
      );
      await Promise.all(deletePromises);
  
      // Step 4: Log
      await logRequestOrReturn(userId, userName, "Sent a Capex Request", dataSource);
  
      // Step 5: Success actions
      setNotificationMessage("CAPEX Request submitted successfully!");
      setNotificationVisible(true);
      setDataSource([]);
      setTotalPrice(0);
      setIsFinalizeModalVisible(false);
  
    } catch (error) {
    
      setNotificationMessage("Failed to submit CAPEX request");
      setNotificationVisible(true);
    } finally {
      setSubmitLoading(false);
    }
  };  

  const handleRequestCancel = async () => {
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");

    try {
      // 1. Delete all items in the Firestore subcollection for this user
      const collectionRef = collection(db, `accounts/${userId}/temporaryCapexRequest`);
      const snapshot = await getDocs(collectionRef);

      const batch = writeBatch(db);
      snapshot.forEach((docSnap) => {
        batch.delete(doc(db, `accounts/${userId}/temporaryCapexRequest`, docSnap.id));
      });
      await batch.commit();

      // 2. Clear local state
      setDataSource([]);
      setTotalPrice(0);

      // 3. Notify user
      setNotificationMessage("CAPEX Request cancelled successfully.");
      setNotificationVisible(true);

      // 4. Log the action
      await logRequestOrReturn(userId, userName, "Cancelled CAPEX Request", []);
      
    } catch (error) {
      console.error("Error cancelling CAPEX request:", error);
      setNotificationMessage("Failed to cancel CAPEX Request.");
      setNotificationVisible(true);
    }
  };
  
  const columns = [
    {
      title: "No.",
      dataIndex: "no",
      key: "no",
      width: 50,
      align: "center",
    },
    {
      title: "Item Name",
      dataIndex: "itemDescription",
      key: "itemDescription",
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
    },
    {
      title: "Brand",
      dataIndex: "brand",
      key: "brand",
    },
    {
      title: "Qty",
      dataIndex: "qty",
      key: "qty",
      width: 80,
      align: "center",
    },
    {
      title: "Estimated Cost",
      dataIndex: "estimatedCost",
      key: "estimatedCost",
      render: (text) => {
        const value = text || 0; 
        return `₱${value.toLocaleString()}`;
      },
      width: 120,
      align: "right",
    },
    {
      title: "Total Price",
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (text) => {
        const value = text || 0; 
        return `₱${value.toLocaleString()}`;
      },
      width: 120,
      align: "right",
    },
    {
      title: "Reason",
      dataIndex: "justification",
      key: "justification",
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (text, record) => (
        <>
          <Button
            type="link"
            onClick={() => editRow(record)}
            style={{ marginRight: 8 }}
          >
            ✏️
          </Button>

          <Popconfirm
            title="Are you sure you want to delete this item?"
            onConfirm={() => handleDelete(record.id)}  // Ensure onConfirm is used here
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger loading={deleteLoading} disabled={saveLoading || submitLoading}>
            ❌
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  const historyColumns = [
    {
      title: "Submission Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => createdAt?.toDate().toLocaleString(),
    },
    {
      title: "Total Price",
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (price) => `₱${price?.toLocaleString()}`,
    },
    {
      title: "Actions",
      key: "actions",
      render: (text, record) => (
        <Button type="link" onClick={() => handleView(record)}>
          View
        </Button>
      ),
    },
  ];  

  const itemsColumns = [
    {
      title: "Item Name",
      dataIndex: "itemDescription",
      key: "itemDescription",
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
    },
    {
      title: "Brand",
      dataIndex: "brand",
      key: "brand",
    },
    {
      title: "Reason",
      dataIndex: "justification",
      key: "justification",
    },
    {
      title: "Quantity",
      dataIndex: "qty",
      key: "qty",
    },
    {
      title: "Estimated Cost",
      dataIndex: "estimatedCost",
      key: "estimatedCost",
      render: (cost) => cost ? `₱${cost?.toLocaleString()}` : "N/A",
    },
    {
      title: "Total Price",
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (price) => price ? `₱${price?.toLocaleString()}` : "N/A",
    },
  ];

  

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout>
        <Content className="capex-content">
          {/* <div className="capex-header">
            <h2>
              CAPEX Request for Materials
              <span style={{ marginLeft: "20px", fontWeight: "normal" }}>
                Year {yearRange}
              </span>
            </h2>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showModal}
            >
              New
            </Button>
          </div> */}

                     {/* Header Section */}
           <div style={{
            background: "linear-gradient(135deg, #0b2d39 0%, #165a72 100%)",
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "32px",
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
                  CAPEX Request for Materials
                </h1>
                <p style={{
                  color: "#a8d5e5",
                  fontSize: "16px",
                  margin: "0",
                  fontWeight: "500"
                }}>
                  Academic Year {yearRange}
                </p>
              </div>
              
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={showModal}
                size="large"
                style={{
                  background: "linear-gradient(135deg, #3ba1c5 0%, #165a72 100%)",
                  border: "none",
                  borderRadius: "10px",
                  height: "48px",
                  padding: "0 24px",
                  fontSize: "16px",
                  fontWeight: "600",
                  boxShadow: "0 4px 16px rgba(59, 161, 197, 0.3)",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 20px rgba(59, 161, 197, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 16px rgba(59, 161, 197, 0.3)";
                }}
              >
                Add New Item
              </Button>
            </div>
          </div>

    <div style={{backgroundColor: '#fff', padding: 16, borderRadius: 16, boxShadow: '0px 4px 5px rgba(0,0,0,0.1)'}}>
      <Table
        dataSource={dataSource}
        columns={columns}
        rowKey="id"
        pagination={false}
        // loading={loading}
        scroll={{ x: 1200 }}
        size="middle"
        className="capex-list-table"
        rowClassName={(record, index) => 
          index % 2 === 0 ? 'table-row-even' : 'table-row-odd'
        }
        style={{
          borderRadius: '12px',
          overflow: 'hidden'
        }}
        locale={{
          emptyText: (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'linear-gradient(135deg, #a8d5e5 0%, rgba(168, 213, 229, 0.1) 100%)',
              borderRadius: '12px',
              border: '2px dashed rgba(59, 161, 197, 0.3)',
              margin: '20px'
            }}>
              <div style={{
                fontSize: '48px',
                color: '#3ba1c5',
                marginBottom: '16px'
              }}>
                <FileTextFilled/>
              </div>
              <h4 style={{
                color: '#165a72',
                fontSize: '18px',
                fontWeight: '600',
                margin: '0 0 8px 0'
              }}>
                No items added yet
              </h4>
              <p style={{
                color: '#0b2d39',
                fontSize: '14px',
                margin: '0',
                opacity: 0.7
              }}>
                Click "Add New Item" to get started with your CAPEX request
              </p>
            </div>
          )
        }}
      />

          <div className="total-price-container">
            <h3>
              Total Price: <span>₱{totalPrice.toLocaleString()}</span>
            </h3>
          </div>

          <div className="button-group">

                <Button
                type="primary"
                loading={submitLoading}
                icon={<CheckOutlined />}
                onClick={() => setIsFinalizeModalVisible(true)}
                style={{
                  background: "#165a72",
                  border: "none",
                  borderRadius: "10px",
                  height: "40px",
                  padding: "0 20px",
                  fontSize: "16px",
                  fontWeight: "600",
                  boxShadow: "0 4px 16px rgba(59, 161, 197, 0.3)",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 20px rgba(59, 161, 197, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 16px rgba(59, 161, 197, 0.3)";
                }}
                 disabled={dataSource.length === 0 || saveLoading || deleteLoading}
              >
                Submit
              </Button>
            {/* <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => setIsFinalizeModalVisible(true)}
              loading={submitLoading}
              disabled={dataSource.length === 0 || saveLoading || deleteLoading}
            >
              Submit
            </Button> */}

            {/* <Button
              type="default"
              icon={<CloseOutlined />}
              onClick={handleRequestCancel}
            >
              Cancel
            </Button> */}
          </div>
    </div>

          {/* <Modal
            title={editingRow ? "Edit Item" : "Add New Item"}
            open={isModalVisible}
            onCancel={handleCancel}
            zIndex={1011}
            onOk={() => form.submit()}
            okText={editingRow ? "Update" : "Add"}
            okButtonProps={{ loading: saveLoading, disabled: deleteLoading || submitLoading }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              initialValues={{
                qty: 1,
                estimatedCost: 0,
                brand: "",
              }}
            >
              <Form.Item
                name="itemDescription"
                label="Item Name"
                rules={[{ required: true, message: "Please enter the item name!" }]}
              >
                <Input placeholder="Enter item name" />
              </Form.Item>

              <Form.Item
                name="subject"
                label="Subject"
                rules={[{ required: true, message: "Please enter the subject!" }]}
              >
                <Input placeholder="Enter  Subject" />
              </Form.Item>

              <Form.Item
                name="qty"
                label="Quantity"
                validateTrigger="onChange"
                rules={[
                  { required: true },
                  {
                    validator: (_, value) => {
                      if (value === undefined || value === null || value === '') {
                        return Promise.reject("Please enter quantity!");
                      }
                      if (typeof value !== 'number' || value < 1) {
                        return Promise.reject("Quantity must be a positive number");
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  min={1}
                  placeholder="Enter quantity"
                  style={{ width: '100%' }}
                  parser={(value) => value.replace(/[^0-9]/g, '')}
                  onKeyDown={(e) => {
                    if (
                      !/[0-9]/.test(e.key) &&
                      !['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab'].includes(e.key)
                    ) {
                      e.preventDefault();
                    }
                  }}
                />
              </Form.Item>

              <Form.Item
                name="brand"
                label="Brand (Optional)"
                rules={[{ required: false, message: "Please enter the brand!" }]}
              >
                <Input placeholder="Enter brand name" />
              </Form.Item>

              <Form.Item
                name="estimatedCost"
                label="Estimated Cost (₱)"
                validateTrigger="onChange"
                rules={[
                  {
                    validator: (_, value) => {
                      if (value !== undefined && value !== null && value !== '') {
                        if (typeof value !== 'number' || value < 0) {
                          return Promise.reject("Estimated cost must be a positive number");
                        }
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  placeholder="Enter estimated cost (optional)"
                  style={{ width: '100%' }}
                  controls={false}
                  parser={(value) => value.replace(/[^0-9]/g, '')}
                  formatter={(value) => value?.replace(/[^0-9]/g, '')}
                  onKeyDown={(e) => {
                    if (
                      !/[0-9]/.test(e.key) &&
                      !['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab'].includes(e.key)
                    ) {
                      e.preventDefault();
                    }
                  }}
                />
              </Form.Item>

              <Form.Item
                name="justification"
                label="Reason"
                rules={[{ required: true, message: "Please enter a reason!" }]}
              >
                <Input.TextArea rows={3} placeholder="Enter reason" />
              </Form.Item>
            </Form>
          </Modal> */}

               <Modal
               className="capex-modal"
               getContainer={false}
            title={
              <div style={{
                color: "#0b2d39",
                fontSize: "20px",
                fontWeight: "600",
                padding: "8px 0"
              }}>
                Add New Item
              </div>
            }
            open={isModalVisible}
            onCancel={handleCancel}
            onOk={() => form.submit()}
            okText="Add Item"
            cancelText="Cancel"
            width={600}
            // style={{
            //   top: 20
            // }}
            okButtonProps={{
              style: {
                background: "linear-gradient(135deg, #3ba1c5 0%, #165a72 100%)",
                border: "none",
                borderRadius: "8px",
                height: "40px",
                fontWeight: "600"
              }
            }}
            cancelButtonProps={{
              style: {
                border: "2px solid #165a72",
                borderRadius: "8px",
                height: "40px",
                color: "#165a72",
                fontWeight: "600",
              }
            }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              initialValues={{
                qty: 1,
                estimatedCost: 0,
                brand: "",
              }}
              style={{ marginTop: "24px" }}
            >
              <Form.Item
                name="itemDescription"
                label={<span style={{ color: "#0b2d39", fontWeight: "600" }}>Item Name</span>}
                rules={[{ required: true, message: "Please enter the item name!" }]}
              >
                <Input 
                  placeholder="Enter item name"
                  style={{
                    borderRadius: "8px",
                    border: "1px solid #a8d5e5",
                    height: "40px"
                  }}
                />
              </Form.Item>

              <Form.Item
                name="subject"
                label={<span style={{ color: "#0b2d39", fontWeight: "600" }}>Subject</span>}
                rules={[{ required: true, message: "Please enter the subject!" }]}
              >
                <Input 
                  placeholder="Enter subject"
                  style={{
                    borderRadius: "8px",
                    border: "1px solid #a8d5e5",
                    height: "40px"
                  }}
                />
              </Form.Item>

              <div style={{ display: "flex", gap: "16px" }}>
                <Form.Item
                  name="qty"
                  label={<span style={{ color: "#0b2d39", fontWeight: "600" }}>Quantity</span>}
                  style={{ flex: 1 }}
                  rules={[
                    { required: true, message: "Please enter quantity!" },
                    {
                      validator: (_, value) => {
                        if (value && (typeof value !== 'number' || value < 1)) {
                          return Promise.reject("Quantity must be a positive number");
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <InputNumber
                    min={1}
                    placeholder="Enter quantity"
                    style={{ 
                      width: '100%',
                      borderRadius: "8px",
                      border: "1px solid #a8d5e5",
                      height: "40px"
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name="estimatedCost"
                  label={<span style={{ color: "#0b2d39", fontWeight: "600" }}>Estimated Cost (₱)</span>}
                  style={{ flex: 1, padding: 0 }}
                  rules={[{ required: true, message: "Please enter the estimated cost!" }]}
                >
                  <InputNumber
                    min={0}
                    placeholder="0"
                    style={{ 
                      width: '100%',
                      borderRadius: "0 8px 8px 0",   // rounded on the right only
                      border: "1px solid #a8d5e5",
                      height: "40px"
                    }}
                    controls={false}
                    addonBefore="₱"
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    }
                    parser={(value) => value.replace(/,/g, '')}
                  />

                </Form.Item>

              </div>

              <Form.Item
                name="brand"
                label={<span style={{ color: "#0b2d39", fontWeight: "600" }}>Brand (Optional)</span>}
              >
                <Input 
                  placeholder="Enter brand name"
                  style={{
                    borderRadius: "8px",
                    border: "1px solid #a8d5e5",
                    height: "40px"
                  }}
                />
              </Form.Item>

              <Form.Item
                name="justification"
                label={<span style={{ color: "#0b2d39", fontWeight: "600" }}>Justification</span>}
                rules={[{ required: true, message: "Please enter a justification!" }]}
              >
                <Input.TextArea 
                  rows={4}
                  placeholder="Enter justification for this request"
                  style={{
                    borderRadius: "8px",
                    border: "1px solid #a8d5e5",
                    resize: "none"
                  }}
                />
              </Form.Item>
            </Form>
          </Modal>

        
          <div style={{ marginTop: "30px", padding: 16, backgroundColor: '#fff', borderRadius: 16, boxShadow: '0px 4px 5px rgba(0,0,0,0.1)'}}>
            <h2 style={{fontWeight: 700, color: '#1a6985', marginBottom: 30}}><CheckCircleOutlined/> Submitted CAPEX Requests</h2>
            {/* <Select
              value={subjectFilter}
              onChange={(value) => setSubjectFilter(value)}
              style={{ width: 200 }}
              placeholder="Select Subject"
              allowClear
            >
              <Option value="">All Subjects</Option>
              {subjectOptions.map((subject, index) => (
                <Option key={index} value={subject}>
                  {subject}
                </Option>
              ))}
            </Select> */}

            <Table
              dataSource={capexHistory}
              columns={historyColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              bordered
              className="capex-list-table"
              scroll={{ x: 400 }}
            />
          </div>

        </Content>
      </Layout>

<Modal
  title={
    <div
      style={{
        color: "#0b2d39",
        fontSize: "20px",
        fontWeight: "600",
        padding: "8px 0",
      }}
    >
      CAPEX Request Details
    </div>
  }
  open={viewModalVisible} // use "open" instead of deprecated "visible"
  onCancel={() => setViewModalVisible(false)}
  footer={null}
  zIndex={1013}
  width="90%"
  style={{ maxWidth: 800 }}
>
  {selectedRowDetails && (
    <div style={{ fontSize: "15px", color: "#333" }}>
      {/* Header Info */}
      <div style={{ marginBottom: "20px" }}>
        <p>
          <strong>Requester:</strong>{" "}
          <span style={{ color: "#165a72" }}>{selectedRowDetails.userName}</span>
        </p>
        <p>
          <strong>Submission Date:</strong>{" "}
          {selectedRowDetails.createdAt?.toDate().toLocaleString()}
        </p>
      </div>

      {/* Items Table */}
          <p style={{ color: "rgba(30, 82, 102, 1)", fontWeight: "500" }}>
            Requesting Items:
          </p>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
            border: "1px solid #ddd",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f5f8fa" }}>
              <th style={{ padding: "8px", border: "1px solid #ddd" }}>Item Name</th>
              <th style={{ padding: "8px", border: "1px solid #ddd" }}>Subject</th>
              <th style={{ padding: "8px", border: "1px solid #ddd" }}>Brand</th>
              <th style={{ padding: "8px", border: "1px solid #ddd" }}>Reason</th>
              <th style={{ padding: "8px", border: "1px solid #ddd" }}>Quantity</th>
              <th style={{ padding: "8px", border: "1px solid #ddd" }}>Est. Cost</th>
              <th style={{ padding: "8px", border: "1px solid #ddd" }}>Total Price</th>
            </tr>
          </thead>
          <tbody>
            {selectedRowDetails.items?.map((item, idx) => (
              <tr
                key={idx}
                style={{
                  backgroundColor: idx % 2 === 0 ? "#fff" : "#f9f9f9",
                }}
              >
                <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                  {item.itemDescription}
                </td>
                <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                  {item.subject}
                </td>
                <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                  {item.brand || "-"}
                </td>
                <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                  {item.justification}
                </td>
                <td
                  style={{
                    padding: "8px",
                    border: "1px solid #ddd",
                    textAlign: "center",
                  }}
                >
                  {item.qty}
                </td>
                <td
                  style={{
                    padding: "8px",
                    border: "1px solid #ddd",
                    textAlign: "right",
                  }}
                >
                  ₱{(item.estimatedCost || 0).toLocaleString()}
                </td>
                <td
                  style={{
                    padding: "8px",
                    border: "1px solid #ddd",
                    textAlign: "right",
                  }}
                >
                  ₱{(item.totalPrice || 0).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
                <p style={{justifySelf: 'flex-end', marginTop: 20, fontSize: 16}}>
          <strong>Total Cost:</strong>{" "}
          <span style={{ color: "green", fontWeight: "600" }}>
            ₱{selectedRowDetails.totalPrice?.toLocaleString()}
          </span>
        </p>
      </div>

      {/* Print Button */}
      <div style={{ marginTop: "20px", textAlign: "right" }}>
        <Button
          type="default"
          onClick={handlePrint}
          style={{
            borderRadius: "8px",
            padding: "6px 16px",
            fontWeight: "500",
          }}
        >
          <PrinterOutlined/> Print PDF
        </Button>
      </div>
    </div>
  )}
</Modal>


      <NotificationModal
        isVisible={notificationVisible}
        onClose={() => setNotificationVisible(false)}
        message={notificationMessage}
      />
      
      <FinalizeCapexModal
        visible={isFinalizeModalVisible}
        onConfirm={handleSubmit}
        onCancel={() => setIsFinalizeModalVisible(false)}
        dataSource={dataSource}  
        totalPrice={totalPrice || 0}
      />

    </Layout>
  );
};

export default CapexRequest;


// import React, { useState, useEffect } from "react";
// import {
//   Layout,
//   Table,
//   Button,
//   Input,
//   Form,
//   Modal,
//   Popconfirm,
//   Select,
//   InputNumber,
// } from "antd";
// import { PlusOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
// import { db } from "../../backend/firebase/FirebaseConfig"; 
// import { collection, addDoc, doc, setDoc, serverTimestamp, onSnapshot, deleteDoc, getDocs, writeBatch } from "firebase/firestore"; 
// import "../styles/usersStyle/CapexRequest.css";
// import NotificationModal from "../customs/NotificationModal"; 
// import FinalizeCapexModal from "../customs/FinalizeCapexModal";
// import "../styles/usersStyle/CapexRequest.css";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// const { Content } = Layout;

// const CapexRequest = () => {
//   const [form] = Form.useForm();
//   const [dataSource, setDataSource] = useState([]);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [editingRow, setEditingRow] = useState(null);
//   const [totalPrice, setTotalPrice] = useState(0);
//   const [notificationVisible, setNotificationVisible] = useState(false);
//   const [notificationMessage, setNotificationMessage] = useState("");
//   const [isFinalizeModalVisible, setIsFinalizeModalVisible] = useState(false);
//   const [viewModalVisible, setViewModalVisible] = useState(false);
//   const [selectedRowDetails, setSelectedRowDetails] = useState(null);
//   const [subjectFilter, setSubjectFilter] = useState("");
//   const [capexHistory, setCapexHistory] = useState([]);
//   const [subjectOptions, setSubjectOptions] = useState([]);
//   const [saveLoading, setSaveLoading] = useState(false);
//   const [deleteLoading, setDeleteLoading] = useState(false);
//   const [submitLoading, setSubmitLoading] = useState(false);

//   const currentYear = new Date().getFullYear();
//   const nextYear = currentYear + 1;
//   const yearRange = `${currentYear}-${nextYear}`;
//   const { Option } = Select;

//   useEffect(() => {
//     const userId = localStorage.getItem("userId");
  
//     if (!userId) return;
  
//     const capexRequestRef = collection(db, `accounts/${userId}/temporaryCapexRequest`);
  
//     const unsubscribe = onSnapshot(capexRequestRef, (snapshot) => {
//       const items = [];
//       snapshot.forEach((doc) => {
//         const data = doc.data();
//         // Ignore items that are marked deleted
//         if (!data.deleted) {
//           items.push({
//             ...data,
//             id: doc.id,
//           });
//         }
//       });
  
//       // Assign 'no' field based on index
//       const numberedItems = items.map((item, index) => ({
//         ...item,
//         no: index + 1,
//       }));
  
//       setDataSource(numberedItems);
//       calculateTotalPrice(numberedItems);
//     });
  
//     return () => unsubscribe(); // Detach listener when component unmounts
//   }, []);


//   useEffect(() => {
//     const userId = localStorage.getItem("userId");
//     if (!userId) return;

//     const capexHistoryRef = collection(db, `accounts/${userId}/capexrequests`);
    
//     const unsubscribeHistory = onSnapshot(capexHistoryRef, (snapshot) => {
//       const historyData = snapshot.docs.map((doc) => ({
//         ...doc.data(),
//         id: doc.id,
//       }));

//       // ✅ Extract all subjects from nested items arrays
//       const allSubjects = historyData.flatMap(doc =>
//         (doc.items || []).map(item => item.subject).filter(Boolean)
//       );

//       // ✅ Get unique subjects
//       const uniqueSubjects = [...new Set(allSubjects)];
//       setSubjectOptions(uniqueSubjects);

//       const currentFilter = subjectFilter || ""; 

//       // ✅ Filter based on selected subject
//       const filteredData = historyData.filter(doc =>
//         currentFilter === "" ||
//         (doc.items || []).some(item =>
//           (item.subject || "").toLowerCase() === currentFilter.toLowerCase()
//         )
//       );

//       setCapexHistory(filteredData);
//     });

//     return () => unsubscribeHistory(); // Cleanup
//   }, [subjectFilter]); 

//   const logRequestOrReturn = async (userId, userName, action, requestDetails) => {
//     await addDoc(collection(db, `accounts/${userId}/activitylog`), {
//       action, // e.g. "Requested Items" or "Returned Items"
//       userName,
//       timestamp: serverTimestamp(),
//       requestList: requestDetails, 
//     });
//   };

//   const showModal = () => {
//     setIsModalVisible(true);
//     form.resetFields();
//     setEditingRow(null);
//   };

//   const handleCancel = () => {
//     setIsModalVisible(false);
//   };

//   const handleView = (record) => {
//     setSelectedRowDetails(record); 
//     setViewModalVisible(true); 
//   };  

//   // const calculateTotalPrice = (data) => {
//   //   const total = data.reduce(
//   //     (sum, item) => sum + (item.estimatedCost * item.qty || 0),
//   //     0
//   //   );
//   //   setTotalPrice(total);
//   // };

//   const calculateTotalPrice = (data) => {
//     if (!Array.isArray(data)) return;

//     const total = data.reduce(
//       (sum, item) => sum + ((item.estimatedCost || 0) * (item.qty || 0)),
//       0
//     );

//     setTotalPrice(total);
//   };
  
//   const handlePrint = () => {
//     const itemsToPrint = selectedRowDetails?.items;
//     const username = selectedRowDetails?.userName || "N/A";
//     const totalPrice = selectedRowDetails?.totalPrice || "N/A";
//     let submissionDate = selectedRowDetails?.createdAt || "N/A";
  
//     if (submissionDate && submissionDate.toDate) {
//       submissionDate = submissionDate.toDate().toLocaleString(); 

//     } else if (submissionDate && submissionDate !== "N/A") {
//       const regex = /(\d{1,2} \w+ \d{4}) at (\d{2}:\d{2}:\d{2}) (UTC[+-]\d{1,2})/;
//       const match = submissionDate.match(regex);
  
//       if (match) {
//         const dateString = match[1]; // "26 April 2025"
//         const timeString = match[2]; // "16:57:55"
//         const timeZoneString = match[3]; // "UTC+8"
  
//         // Convert the month name to a month number (April -> 04)
//         const monthMap = {
//           January: '01', February: '02', March: '03', April: '04', May: '05', June: '06',
//           July: '07', August: '08', September: '09', October: '10', November: '11', December: '12'
//         };

//         const [day, monthName, year] = dateString.split(' ');
//         const month = monthMap[monthName] || '01';
//         const timezoneOffset = timeZoneString.replace('UTC', '');
//         const formattedDate = `${year}-${month}-${day}T${timeString}${timezoneOffset}:00`;
//         const dateObj = new Date(formattedDate);
  
//         if (!isNaN(dateObj)) {
//           submissionDate = dateObj.toLocaleString();

//         } else {
//           submissionDate = "Invalid Date Format";
//         }

//       } else {
//         submissionDate = "Invalid Date Format";
//       }
//     }
  
//     if (!Array.isArray(itemsToPrint) || itemsToPrint.length === 0) {
      
//       return;
//     }
  
//     const doc = new jsPDF();
//     doc.setFontSize(16);
//     doc.text("CAPEX Request Details", 10, 10);
  
//     doc.setFontSize(12);
//     doc.text(`Username: ${username}`, 10, 20);
//     doc.text(`Total Price: ${totalPrice}`, 10, 28);
//     doc.text(`Submission Date: ${submissionDate}`, 10, 36);
  
//     const tableColumn = ["Item Name", "Subject", "Brand", "Quantity", "Estimated Cost", "Justification"];
//     const tableRows = itemsToPrint.map((item) => [
//       item.itemDescription || "-",
//       item.subject || "-",
//       item.brand || "-",
//       item.qty || "-",
//       item.estimatedCost || "-",
//       item.justification || "-"
//     ]);
  
//     autoTable(doc, {
//       head: [tableColumn],
//       body: tableRows,
//       startY: 44, // start below the text
//       theme: "grid",
//     });
  
//     doc.save("capex_request.pdf");
  
//   };  
//   const sanitizeInput = (input) => {
//   if (typeof input !== "string") return input; // Return as is if not a string
//   // Remove HTML tags and non-alphanumeric characters (except spaces)
//   return input.trim().replace(/<[^>]+>/g, "").replace(/[^\w\s]/gi, "");
// };


  
// //   const handleSave = async (values) => {
// //   setIsModalVisible(false);

// //   // Sanitize input values before saving
// //   const sanitizedValues = {
// //     itemDescription: sanitizeInput(values.itemDescription),
// //     subject: sanitizeInput(values.subject),
// //     justification: sanitizeInput(values.justification),
// //     qty: values.qty, // qty should be a number, no need for sanitization unless necessary
// //     estimatedCost: values.estimatedCost, // Same for estimatedCost
// //   };

// //   // If editing an existing item
// //   if (editingRow !== null) {
// //     const updatedItem = {
// //       ...sanitizedValues,
// //       id: editingRow.id,
// //       totalPrice: sanitizedValues.qty * sanitizedValues.estimatedCost, // Ensure total price is updated
// //     };

// //     try {
// //       const userId = localStorage.getItem("userId");
// //       const capexRequestRef = doc(db, `accounts/${userId}/temporaryCapexRequest`, editingRow.id);
// //       await setDoc(capexRequestRef, updatedItem);

// //       // Logging the action
// //       await logRequestOrReturn(userId, localStorage.getItem("userName"), "Updated a Capex Item", updatedItem);

// //       setNotificationMessage("Item updated successfully!");
// //       setNotificationVisible(true);

// //       calculateTotalPrice(); // Recalculate total price

// //     } catch (error) {
// //       setNotificationMessage("Failed to update Item.");
// //       setNotificationVisible(true);
// //     }
// //   } else {
// //     // If adding a new item
// //     const newItem = {
// //       ...sanitizedValues,
// //       totalPrice: sanitizedValues.qty * sanitizedValues.estimatedCost, // Ensure total price is calculated
// //     };

// //     try {
// //       const userId = localStorage.getItem("userId");
// //       const capexRequestRef = await addDoc(collection(db, `accounts/${userId}/temporaryCapexRequest`), newItem);
// //       const newItemWithId = {
// //         ...newItem,
// //         id: capexRequestRef.id,
// //         no: dataSource.length + 1, // Number the items in the list
// //       };

// //       setNotificationMessage("Item added successfully!");
// //       setNotificationVisible(true);

// //       // Update the state to reflect the new item
// //       setDataSource([...dataSource, newItemWithId]);
// //       calculateTotalPrice(); // Recalculate total price after adding new item

// //     } catch (error) {
// //       setNotificationMessage("Failed to add Item.");
// //       setNotificationVisible(true);
// //     }
// //   }
// // };

//   const handleSave = async (values) => {
//     setSaveLoading(true);
//     setIsModalVisible(false);

//     // Sanitize input values before saving
//     const sanitizedValues = {
//       itemDescription: sanitizeInput(values.itemDescription),
//       subject: sanitizeInput(values.subject),
//       brand: sanitizeInput(values.brand),
//       justification: sanitizeInput(values.justification),
//       qty: values.qty, // Assume already validated as number >= 1
//       estimatedCost: values.estimatedCost || 0,
//     };

//     const userId = localStorage.getItem("userId");
//     const userName = localStorage.getItem("userName");

//     if (!userId || !userName) {
//       setNotificationMessage("User not authenticated.");
//       setNotificationVisible(true);
//       return;
//     }

//     if (editingRow !== null) {
//       // Updating an existing item
//       const updatedItem = {
//         ...sanitizedValues,
//         id: editingRow.id,
//         totalPrice: sanitizedValues.qty * sanitizedValues.estimatedCost,
//       };

//       try {
//         const capexRequestRef = doc(db, `accounts/${userId}/temporaryCapexRequest`, editingRow.id);
//         await setDoc(capexRequestRef, updatedItem);

//         await logRequestOrReturn(userId, userName, "Updated a Capex Item", updatedItem);

//         setNotificationMessage("Item updated successfully!");
//         setNotificationVisible(true);

//         calculateTotalPrice(); // Recalculate after update

//       } catch (error) {
//         console.error("Update Item Error:", error);
//         setNotificationMessage("Failed to update Item.");
//         setNotificationVisible(true);
//       }
//     } else {
//       // Adding a new item
//       const newItem = {
//         ...sanitizedValues,
//         totalPrice: sanitizedValues.qty * sanitizedValues.estimatedCost,
//       };

//       try {
//         const capexRequestRef = await addDoc(
//           collection(db, `accounts/${userId}/temporaryCapexRequest`),
//           newItem
//         );

//         const newItemWithId = {
//           ...newItem,
//           id: capexRequestRef.id,
//           no: (dataSource?.length || 0) + 1, // Safe fallback if dataSource is empty
//         };

//         setNotificationMessage("Item added successfully!");
//         setNotificationVisible(true);

//         // setDataSource([...dataSource, newItemWithId]);
//         // calculateTotalPrice(); 

//         const updatedData = [...(Array.isArray(dataSource) ? dataSource : []), newItemWithId];
//         setDataSource(updatedData);
//         calculateTotalPrice(updatedData); 

//       } catch (error) {
//         console.error("Add Item Error:", error);
//         setNotificationMessage("Failed to add Item.");
//         setNotificationVisible(true);
//       } finally {
//         setSaveLoading(false);
//       }
//     }
//   };

//  const handleDelete = async (id) => {
//   setDeleteLoading(true);
//   const sanitizedId = sanitizeInput(id); // Ensure sanitized ID

//   const updatedData = dataSource.filter((item) => item.id !== sanitizedId);
//   setDataSource(updatedData);
//   calculateTotalPrice(updatedData);

//   setNotificationMessage("Item deleted successfully!");
//   setNotificationVisible(true);

//   const userId = localStorage.getItem("userId");
//   const userName = localStorage.getItem("userName");

//     try {
//       const capexRequestRef = doc(db, `accounts/${userId}/temporaryCapexRequest`, sanitizedId);
//       await deleteDoc(capexRequestRef);

//       await logRequestOrReturn(userId, userName, "Deleted a Capex Item", [
//         { deletedItemId: sanitizedId }
//       ]);
//     } catch (error) {
//       setNotificationMessage("Failed to delete Item");
//       setNotificationVisible(true);
//     } finally {
//       setDeleteLoading(false);
//     }
//   };

//   const editRow = (record) => {
//     setEditingRow(record);
//     form.setFieldsValue(record);
//     setIsModalVisible(true);
//   };

//   const handleSubmit = async () => {
//     setSubmitLoading(true);
//     if (dataSource.length === 0) {
//       setNotificationMessage("Please add at least one item to submit");
//       setNotificationVisible(true);
//       setSubmitLoading(false);
//       return;
//     }
  
//     const userId = localStorage.getItem("userId");
//     const userName = localStorage.getItem("userName");
  
//     try {
//       // Step 1: Add to root collection "capexrequestlist"
//       const capexRequestRef = await addDoc(collection(db, "capexrequestlist"), {
//         userId,
//         userName,
//         totalPrice,
//         createdAt: serverTimestamp(),
//         items: dataSource,
//       });
  
//       // Step 2: Add to user's "capexrequests" subcollection
//       await addDoc(collection(db, `accounts/${userId}/capexrequests`), {
//         capexRequestId: capexRequestRef.id,
//         userId,
//         userName,
//         totalPrice,
//         createdAt: serverTimestamp(),
//         items: dataSource,
//       });
  
//       // Step 3: Fetch all documents inside "temporaryCapexRequest" and delete them
//       const tempCapexSnapshot = await getDocs(collection(db, `accounts/${userId}/temporaryCapexRequest`));
//       const deletePromises = tempCapexSnapshot.docs.map((docSnapshot) => 
//         deleteDoc(doc(db, `accounts/${userId}/temporaryCapexRequest/${docSnapshot.id}`))
//       );
//       await Promise.all(deletePromises);
  
//       // Step 4: Log
//       await logRequestOrReturn(userId, userName, "Sent a Capex Request", dataSource);
  
//       // Step 5: Success actions
//       setNotificationMessage("CAPEX Request submitted successfully!");
//       setNotificationVisible(true);
//       setDataSource([]);
//       setTotalPrice(0);
//       setIsFinalizeModalVisible(false);
  
//     } catch (error) {
    
//       setNotificationMessage("Failed to submit CAPEX request");
//       setNotificationVisible(true);
//     } finally {
//       setSubmitLoading(false);
//     }
//   };  

//   const handleRequestCancel = async () => {
//     const userId = localStorage.getItem("userId");
//     const userName = localStorage.getItem("userName");

//     try {
//       // 1. Delete all items in the Firestore subcollection for this user
//       const collectionRef = collection(db, `accounts/${userId}/temporaryCapexRequest`);
//       const snapshot = await getDocs(collectionRef);

//       const batch = writeBatch(db);
//       snapshot.forEach((docSnap) => {
//         batch.delete(doc(db, `accounts/${userId}/temporaryCapexRequest`, docSnap.id));
//       });
//       await batch.commit();

//       // 2. Clear local state
//       setDataSource([]);
//       setTotalPrice(0);

//       // 3. Notify user
//       setNotificationMessage("CAPEX Request cancelled successfully.");
//       setNotificationVisible(true);

//       // 4. Log the action
//       await logRequestOrReturn(userId, userName, "Cancelled CAPEX Request", []);
      
//     } catch (error) {
//       console.error("Error cancelling CAPEX request:", error);
//       setNotificationMessage("Failed to cancel CAPEX Request.");
//       setNotificationVisible(true);
//     }
//   };
  
//   const columns = [
//     {
//       title: "No.",
//       dataIndex: "no",
//       key: "no",
//       width: 50,
//       align: "center",
//     },
//     {
//       title: "Item Name",
//       dataIndex: "itemDescription",
//       key: "itemDescription",
//     },
//     {
//       title: "Subject",
//       dataIndex: "subject",
//       key: "subject",
//     },
//     {
//       title: "Brand",
//       dataIndex: "brand",
//       key: "brand",
//     },
//     {
//       title: "Qty",
//       dataIndex: "qty",
//       key: "qty",
//       width: 80,
//       align: "center",
//     },
//     {
//       title: "Estimated Cost",
//       dataIndex: "estimatedCost",
//       key: "estimatedCost",
//       render: (text) => {
//         const value = text || 0; 
//         return `₱${value.toLocaleString()}`;
//       },
//       width: 120,
//       align: "right",
//     },
//     {
//       title: "Total Price",
//       dataIndex: "totalPrice",
//       key: "totalPrice",
//       render: (text) => {
//         const value = text || 0; 
//         return `₱${value.toLocaleString()}`;
//       },
//       width: 120,
//       align: "right",
//     },
//     {
//       title: "Reason",
//       dataIndex: "justification",
//       key: "justification",
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       width: 100,
//       render: (text, record) => (
//         <>
//           <Button
//             type="link"
//             onClick={() => editRow(record)}
//             style={{ marginRight: 8 }}
//           >
//             ✏️
//           </Button>

//           <Popconfirm
//             title="Are you sure you want to delete this item?"
//             onConfirm={() => handleDelete(record.id)}  // Ensure onConfirm is used here
//             okText="Yes"
//             cancelText="No"
//           >
//             <Button type="link" danger loading={deleteLoading} disabled={saveLoading || submitLoading}>
//             ❌
//             </Button>
//           </Popconfirm>
//         </>
//       ),
//     },
//   ];

//   const historyColumns = [
//     {
//       title: "Submission Date",
//       dataIndex: "createdAt",
//       key: "createdAt",
//       render: (createdAt) => createdAt?.toDate().toLocaleString(),
//     },
//     {
//       title: "Total Price",
//       dataIndex: "totalPrice",
//       key: "totalPrice",
//       render: (price) => `₱${price?.toLocaleString()}`,
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       render: (text, record) => (
//         <Button type="link" onClick={() => handleView(record)}>
//           View
//         </Button>
//       ),
//     },
//   ];  

//   const itemsColumns = [
//     {
//       title: "Item Name",
//       dataIndex: "itemDescription",
//       key: "itemDescription",
//     },
//     {
//       title: "Subject",
//       dataIndex: "subject",
//       key: "subject",
//     },
//     {
//       title: "Brand",
//       dataIndex: "brand",
//       key: "brand",
//     },
//     {
//       title: "Reason",
//       dataIndex: "justification",
//       key: "justification",
//     },
//     {
//       title: "Quantity",
//       dataIndex: "qty",
//       key: "qty",
//     },
//     {
//       title: "Estimated Cost",
//       dataIndex: "estimatedCost",
//       key: "estimatedCost",
//       render: (cost) => cost ? `₱${cost?.toLocaleString()}` : "N/A",
//     },
//     {
//       title: "Total Price",
//       dataIndex: "totalPrice",
//       key: "totalPrice",
//       render: (price) => price ? `₱${price?.toLocaleString()}` : "N/A",
//     },
//   ];

//   return (
//  <div style={{ 
//       minHeight: "100vh", 
//       background: "linear-gradient(135deg, #a8d5e5 0%, #ffffff 100%)",
//       padding: "0"
//     }}>
//       <Layout style={{ 
//         minHeight: "100vh", 
//         background: "transparent"
//       }}>
//         <Content style={{ 
//           padding: "32px",
//           maxWidth: "1400px",
//           margin: "0 auto",
//           width: "100%"
//         }}>
//           {/* Header Section */}
//           <div style={{
//             background: "linear-gradient(135deg, #0b2d39 0%, #165a72 100%)",
//             borderRadius: "16px",
//             padding: "32px",
//             marginBottom: "32px",
//             boxShadow: "0 8px 32px rgba(11, 45, 57, 0.15)",
//             border: "1px solid rgba(255, 255, 255, 0.1)"
//           }}>
//             <div style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//               flexWrap: "wrap",
//               gap: "16px"
//             }}>
//               <div>
//                 <h1 style={{
//                   color: "#ffffff",
//                   fontSize: "28px",
//                   fontWeight: "700",
//                   margin: "0 0 8px 0",
//                   textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)"
//                 }}>
//                   CAPEX Request for Materials
//                 </h1>
//                 <p style={{
//                   color: "#a8d5e5",
//                   fontSize: "16px",
//                   margin: "0",
//                   fontWeight: "500"
//                 }}>
//                   Financial Year {yearRange}
//                 </p>
//               </div>
              
//               <Button
//                 type="primary"
//                 icon={<PlusOutlined />}
//                 onClick={showModal}
//                 size="large"
//                 style={{
//                   background: "linear-gradient(135deg, #3ba1c5 0%, #165a72 100%)",
//                   border: "none",
//                   borderRadius: "10px",
//                   height: "48px",
//                   padding: "0 24px",
//                   fontSize: "16px",
//                   fontWeight: "600",
//                   boxShadow: "0 4px 16px rgba(59, 161, 197, 0.3)",
//                   transition: "all 0.3s ease"
//                 }}
//                 onMouseEnter={(e) => {
//                   e.target.style.transform = "translateY(-2px)";
//                   e.target.style.boxShadow = "0 6px 20px rgba(59, 161, 197, 0.4)";
//                 }}
//                 onMouseLeave={(e) => {
//                   e.target.style.transform = "translateY(0)";
//                   e.target.style.boxShadow = "0 4px 16px rgba(59, 161, 197, 0.3)";
//                 }}
//               >
//                 Add New Item
//               </Button>
//             </div>
//           </div>

//           {/* Main Table Card */}
//           <div style={{
//             background: "#ffffff",
//             borderRadius: "16px",
//             padding: "24px",
//             marginBottom: "24px",
//             boxShadow: "0 4px 24px rgba(11, 45, 57, 0.08)",
//             border: "1px solid rgba(59, 161, 197, 0.1)"
//           }}>
//             <div style={{
//               marginBottom: "20px",
//               padding: "0 4px"
//             }}>
//               <h3 style={{
//                 color: "#0b2d39",
//                 fontSize: "18px",
//                 fontWeight: "600",
//                 margin: "0",
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "8px"
//               }}>
//                 <div style={{
//                   width: "4px",
//                   height: "20px",
//                   background: "linear-gradient(135deg, #3ba1c5, #165a72)",
//                   borderRadius: "2px"
//                 }}></div>
//                 Request Items
//               </h3>
//             </div>

//             <Table
//               dataSource={dataSource}
//               // columns={columns}
//               rowKey="id"
//               pagination={false}
//               bordered={false}
//               scroll={{ x: 600 }}
//               style={{
//                 borderRadius: "12px",
//                 overflow: "hidden"
//               }}
//               className="custom-capex-table"
//             />

//             {dataSource.length === 0 && (
//               <div style={{
//                 textAlign: "center",
//                 padding: "60px 20px",
//                 background: "linear-gradient(135deg, #a8d5e5 0%, rgba(168, 213, 229, 0.1) 100%)",
//                 borderRadius: "12px",
//                 border: "2px dashed rgba(59, 161, 197, 0.3)"
//               }}>
//                 <div style={{
//                   fontSize: "48px",
//                   color: "#3ba1c5",
//                   marginBottom: "16px"
//                 }}>
//                   📋
//                 </div>
//                 <h4 style={{
//                   color: "#165a72",
//                   fontSize: "18px",
//                   fontWeight: "600",
//                   margin: "0 0 8px 0"
//                 }}>
//                   No items added yet
//                 </h4>
//                 <p style={{
//                   color: "#0b2d39",
//                   fontSize: "14px",
//                   margin: "0",
//                   opacity: 0.7
//                 }}>
//                   Click "Add New Item" to get started with your CAPEX request
//                 </p>
//               </div>
//             )}
//           </div>

//           {/* Total Price Card */}
//           <div style={{
//             background: "linear-gradient(135deg, #3ba1c5 0%, #165a72 100%)",
//             borderRadius: "16px",
//             padding: "24px",
//             marginBottom: "24px",
//             boxShadow: "0 4px 24px rgba(59, 161, 197, 0.2)",
//             border: "1px solid rgba(255, 255, 255, 0.1)"
//           }}>
//             <div style={{ textAlign: "center" }}>
//               <p style={{
//                 color: "#a8d5e5",
//                 fontSize: "14px",
//                 fontWeight: "500",
//                 margin: "0 0 8px 0",
//                 textTransform: "uppercase",
//                 letterSpacing: "1px"
//               }}>
//                 Total Estimated Cost
//               </p>
//               <h2 style={{
//                 color: "#ffffff",
//                 fontSize: "32px",
//                 fontWeight: "700",
//                 margin: "0",
//                 textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)"
//               }}>
//                 ₱{totalPrice.toLocaleString()}
//               </h2>
//             </div>
//           </div>

//           {/* Action Buttons */}
//           <div style={{
//             display: "flex",
//             gap: "16px",
//             justifyContent: "center",
//             flexWrap: "wrap",
//             marginBottom: "48px"
//           }}>
//             <Button
//               type="primary"
//               icon={<CheckOutlined />}
//               size="large"
//               // onClick={() => setIsFinalizeModalVisible(true)}
//               // loading={submitLoading}
//               // disabled={dataSource.length === 0 || saveLoading || deleteLoading}
//               style={{
//                 background: "linear-gradient(135deg, #3ba1c5 0%, #165a72 100%)",
//                 border: "none",
//                 borderRadius: "10px",
//                 height: "48px",
//                 padding: "0 32px",
//                 fontSize: "16px",
//                 fontWeight: "600",
//                 boxShadow: "0 4px 16px rgba(59, 161, 197, 0.3)",
//                 minWidth: "140px"
//               }}
//             >
//               Submit Request
//             </Button>

//             <Button
//               size="large"
//               icon={<CloseOutlined />}
//               // onClick={handleRequestCancel}
//               style={{
//                 background: "#ffffff",
//                 border: "2px solid #165a72",
//                 borderRadius: "10px",
//                 height: "48px",
//                 padding: "0 32px",
//                 fontSize: "16px",
//                 fontWeight: "600",
//                 color: "#165a72",
//                 minWidth: "140px",
//                 transition: "all 0.3s ease"
//               }}
//               onMouseEnter={(e) => {
//                 e.target.style.background = "#165a72";
//                 e.target.style.color = "#ffffff";
//               }}
//               onMouseLeave={(e) => {
//                 e.target.style.background = "#ffffff";
//                 e.target.style.color = "#165a72";
//               }}
//             >
//               Cancel
//             </Button>
//           </div>

//           {/* History Section */}
//           <div style={{
//             background: "#ffffff",
//             borderRadius: "16px",
//             padding: "32px",
//             boxShadow: "0 4px 24px rgba(11, 45, 57, 0.08)",
//             border: "1px solid rgba(59, 161, 197, 0.1)"
//           }}>
//             <div style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//               marginBottom: "24px",
//               flexWrap: "wrap",
//               gap: "16px"
//             }}>
//               <h2 style={{
//                 color: "#0b2d39",
//                 fontSize: "24px",
//                 fontWeight: "700",
//                 margin: "0",
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "12px"
//               }}>
//                 <div style={{
//                   width: "6px",
//                   height: "28px",
//                   background: "linear-gradient(135deg, #3ba1c5, #165a72)",
//                   borderRadius: "3px"
//                 }}></div>
//                 Submitted CAPEX History
//               </h2>

//               <Select
//                 // value={subjectFilter}
//                 // onChange={(value) => setSubjectFilter(value)}
//                 style={{ minWidth: 200 }}
//                 placeholder="Filter by Subject"
//                 allowClear
//                 size="large"
//               >
//                 <Option value="">All Subjects</Option>
//                 {/* {subjectOptions.map((subject, index) => (
//                   <Option key={index} value={subject}>
//                     {subject}
//                   </Option>
//                 ))} */}
//               </Select>
//             </div>

//             <Table
//               dataSource={capexHistory}
//               // columns={historyColumns}
//               rowKey="id"
//               pagination={{ 
//                 pageSize: 5,
//                 showSizeChanger: false,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
//               }}
//               bordered={false}
//               scroll={{ x: 400 }}
//               style={{
//                 borderRadius: "12px",
//                 overflow: "hidden"
//               }}
//               className="custom-history-table"
//             />

//             {capexHistory.length === 0 && (
//               <div style={{
//                 textAlign: "center",
//                 padding: "60px 20px",
//                 background: "linear-gradient(135deg, rgba(168, 213, 229, 0.1) 0%, rgba(168, 213, 229, 0.05) 100%)",
//                 borderRadius: "12px",
//                 border: "2px dashed rgba(59, 161, 197, 0.2)"
//               }}>
//                 <div style={{
//                   fontSize: "48px",
//                   color: "#3ba1c5",
//                   marginBottom: "16px",
//                   opacity: 0.7
//                 }}>
//                   📊
//                 </div>
//                 <h4 style={{
//                   color: "#165a72",
//                   fontSize: "18px",
//                   fontWeight: "600",
//                   margin: "0 0 8px 0"
//                 }}>
//                   No submission history
//                 </h4>
//                 <p style={{
//                   color: "#0b2d39",
//                   fontSize: "14px",
//                   margin: "0",
//                   opacity: 0.7
//                 }}>
//                   Your submitted CAPEX requests will appear here
//                 </p>
//               </div>
//             )}
//           </div>

//           {/* Add Item Modal */}
//           <Modal
//             title={
//               <div style={{
//                 color: "#0b2d39",
//                 fontSize: "20px",
//                 fontWeight: "600",
//                 padding: "8px 0"
//               }}>
//                 Add New Item
//               </div>
//             }
//             open={isModalVisible}
//             onCancel={handleCancel}
//             onOk={() => form.submit()}
//             okText="Add Item"
//             cancelText="Cancel"
//             width={600}
//             style={{
//               top: 20
//             }}
//             okButtonProps={{
//               style: {
//                 background: "linear-gradient(135deg, #3ba1c5 0%, #165a72 100%)",
//                 border: "none",
//                 borderRadius: "8px",
//                 height: "40px",
//                 fontWeight: "600"
//               }
//             }}
//             cancelButtonProps={{
//               style: {
//                 border: "2px solid #165a72",
//                 borderRadius: "8px",
//                 height: "40px",
//                 color: "#165a72",
//                 fontWeight: "600"
//               }
//             }}
//           >
//             <Form
//               form={form}
//               layout="vertical"
//               onFinish={handleSave}
//               initialValues={{
//                 qty: 1,
//                 estimatedCost: 0,
//                 brand: "",
//               }}
//               style={{ marginTop: "24px" }}
//             >
//               <Form.Item
//                 name="itemDescription"
//                 label={<span style={{ color: "#0b2d39", fontWeight: "600" }}>Item Name</span>}
//                 rules={[{ required: true, message: "Please enter the item name!" }]}
//               >
//                 <Input 
//                   placeholder="Enter item name"
//                   style={{
//                     borderRadius: "8px",
//                     border: "2px solid #a8d5e5",
//                     height: "40px"
//                   }}
//                 />
//               </Form.Item>

//               <Form.Item
//                 name="subject"
//                 label={<span style={{ color: "#0b2d39", fontWeight: "600" }}>Subject</span>}
//                 rules={[{ required: true, message: "Please enter the subject!" }]}
//               >
//                 <Input 
//                   placeholder="Enter subject"
//                   style={{
//                     borderRadius: "8px",
//                     border: "2px solid #a8d5e5",
//                     height: "40px"
//                   }}
//                 />
//               </Form.Item>

//               <div style={{ display: "flex", gap: "16px" }}>
//                 <Form.Item
//                   name="qty"
//                   label={<span style={{ color: "#0b2d39", fontWeight: "600" }}>Quantity</span>}
//                   style={{ flex: 1 }}
//                   rules={[
//                     { required: true, message: "Please enter quantity!" },
//                     {
//                       validator: (_, value) => {
//                         if (value && (typeof value !== 'number' || value < 1)) {
//                           return Promise.reject("Quantity must be a positive number");
//                         }
//                         return Promise.resolve();
//                       },
//                     },
//                   ]}
//                 >
//                   <InputNumber
//                     min={1}
//                     placeholder="Enter quantity"
//                     style={{ 
//                       width: '100%',
//                       borderRadius: "8px",
//                       border: "2px solid #a8d5e5",
//                       height: "40px"
//                     }}
//                   />
//                 </Form.Item>

//                 <Form.Item
//                   name="estimatedCost"
//                   label={<span style={{ color: "#0b2d39", fontWeight: "600" }}>Estimated Cost (₱)</span>}
//                   style={{ flex: 1 }}
//                 >
//                   <InputNumber
//                     min={0}
//                     placeholder="Enter cost"
//                     style={{ 
//                       width: '100%',
//                       borderRadius: "8px",
//                       border: "2px solid #a8d5e5",
//                       height: "40px"
//                     }}
//                     formatter={(value) => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                     parser={(value) => value.replace(/₱\s?|(,*)/g, '')}
//                   />
//                 </Form.Item>
//               </div>

//               <Form.Item
//                 name="brand"
//                 label={<span style={{ color: "#0b2d39", fontWeight: "600" }}>Brand (Optional)</span>}
//               >
//                 <Input 
//                   placeholder="Enter brand name"
//                   style={{
//                     borderRadius: "8px",
//                     border: "2px solid #a8d5e5",
//                     height: "40px"
//                   }}
//                 />
//               </Form.Item>

//               <Form.Item
//                 name="justification"
//                 label={<span style={{ color: "#0b2d39", fontWeight: "600" }}>Justification</span>}
//                 rules={[{ required: true, message: "Please enter a justification!" }]}
//               >
//                 <Input.TextArea 
//                   rows={4}
//                   placeholder="Enter justification for this request"
//                   style={{
//                     borderRadius: "8px",
//                     border: "2px solid #a8d5e5",
//                     resize: "none"
//                   }}
//                 />
//               </Form.Item>
//             </Form>
//           </Modal>

//         </Content>
//       </Layout>
//       </div>
//   );
// };

// export default CapexRequest;