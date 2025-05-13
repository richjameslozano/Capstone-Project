import React, { useState, useEffect, useRef } from "react";
import { Layout, Table, Button, Modal, Typography, Row, Col } from "antd";
import { db } from "../../backend/firebase/FirebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import jsPDF from "jspdf";
import 'jspdf-autotable';
import html2canvas from "html2canvas";
import "../styles/adminStyle/RequestLog.css";


const { Content } = Layout;
const { Text } = Typography;

const RequestLog = () => {
  const [filterStatus, setFilterStatus] = useState("All");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const modalRef = useRef(null); // Reference for modal content to print/save

  useEffect(() => {
    const fetchRequestLogs = () => {
      try {
        const requestLogRef = collection(db, "requestlog");
        const unsubscribe = onSnapshot(requestLogRef, (querySnapshot) => {
          const logs = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            const timeFrom = data.timeFrom || "N/A";  
            const timeTo = data.timeTo || "N/A";    
            const rawTimestamp = data.rawTimestamp;
            const timestamp = data.timestamp;

            let parsedRawTimestamp = "N/A";
            let parsedTimestamp = "N/A";

            if (rawTimestamp && typeof rawTimestamp.toDate === "function") {
              try {
                parsedRawTimestamp = rawTimestamp.toDate().toLocaleString("en-PH", {
                  timeZone: "Asia/Manila",
                });
              } catch (e) {
                console.warn(`Error formatting rawTimestamp for doc ${doc.id}:`, e);
              }
            }

            if (timestamp && typeof timestamp.toDate === "function") {
              try {
                parsedTimestamp = timestamp.toDate().toLocaleString("en-PH", {
                  timeZone: "Asia/Manila",
                });
              } catch (e) {
                console.warn(`Error formatting timestamp for doc \${doc.id}:`, e);
              }
            }

            return {
              id: doc.id,
              date: data.dateRequired ?? "N/A",
              status: data.status ?? "Pending",
              requestor: data.userName ?? "Unknown",
              requestedItems: data.requestList
                ? data.requestList.map((item) => item.itemName).join(", ")
                : "No items",
              requisitionId: doc.id,
              reason: data.reason ?? "No reason provided",
              department: data.requestList?.[0]?.department ?? "N/A",
              rejectionReason:
                data.requestList?.[0]?.rejectionReason || data.rejectionReason || "N/A",
              approvedBy: data.approvedBy,
              rejectedBy: data.rejectedBy,
              rawTimestamp: rawTimestamp ?? null,
              processDate: parsedRawTimestamp, 
              timestamp: parsedTimestamp,
              raw: data,
              timeFrom, 
              timeTo,  
            };
          });

          logs.sort((a, b) => {
            const timeA = a.rawTimestamp?.toMillis?.() ?? 0;
            const timeB = b.rawTimestamp?.toMillis?.() ?? 0;
            return timeB - timeA;
          });

          setHistoryData(logs);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching request logs: ", error);
      }
    };

    fetchRequestLogs();
  }, []);

  const handleViewDetails = (record) => {
    setSelectedRequest(record);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedRequest(null);
  };


const generatePdfFromSlip = (slipData) => {
  if (!slipData) return;

  const doc = new jsPDF("p", "pt", "a4");
  const margin = 40;
  let y = margin;

  // Header with icon and title
  doc.setFontSize(18);
  doc.text("Requisition Slip", margin, y);
  doc.setFont('bold')
  y += 30;

  // Two-column layout
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Name:", margin, y);
  doc.setFont(undefined, "normal");
  doc.text(slipData.raw?.userName || "", margin + 45, y);

  doc.setFont(undefined, "italic");
  doc.text(`Requisition ID: ${slipData.requisitionId || ""}`, 350, y, { align: "left" });
  y += 20;

  doc.setFont(undefined, "bold");
  doc.text("Request Date:", margin, y);
  doc.setFont(undefined, "normal");
  doc.text(slipData.timestamp || "", margin + 75, y);

  doc.setFont(undefined, "bold");
  doc.text("Required Date:", 350, y);
  doc.setFont(undefined, "normal");
  doc.text(slipData.raw?.dateRequired || "", 440, y);
  y += 20;

  // Requested Items and Status
  doc.setFont(undefined, "bold");
  doc.text("Requested Items:", margin, y);
  doc.setFont(undefined, "normal");
  if (slipData.status === "Approved") {
    doc.setTextColor(0, 128, 0); // green
  } else {
    doc.setTextColor(255, 0, 0); // red
  }
  doc.text(`(${slipData.status})`, margin + 100, y);
  doc.setTextColor(0, 0, 0); // reset
  doc.setFont(undefined, "bold");
  doc.text("Time Needed:", 350, y);
  doc.setFont(undefined, "normal");
  doc.text(`${slipData.timeFrom || "N/A"} - ${slipData.timeTo || "N/A"}`, 440, y);
  y += 20;

  // Table
  const headers = [["Item ID", "Item Description", "Quantity"]];
  const data = (slipData.raw?.requestList || []).map((item) => [
    item.itemIdFromInventory || "",
    item.itemName || "",
    String(item.quantity || ""),
  ]);

  doc.autoTable({
    head: headers,
    body: data,
    startY: y + 10,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: {
      fillColor: [44, 62, 146], // blue
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 12,
      cellPadding: 6,
    },
    bodyStyles: {
      fontSize: 11,
      cellPadding: 5,
    },
    styles: {
      lineWidth: 0.1,
      lineColor: [200, 200, 200],
      cellPadding: 5,
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    didDrawCell: (data) => {
      // Simulate rounded corners for the header row
      if (data.row.index === 0 && data.section === 'head') {
        // Not true rounded corners, but you can draw a rectangle with rounded corners here if you want
      }
    }
  });

  y = doc.lastAutoTable.finalY + 20;

  // Bottom section
  doc.setFont(undefined, "bold");
  doc.text("Reason of Request: ", margin, y);
  doc.setFont(undefined, "normal");
  doc.text(slipData.raw?.reason || "", margin + 110, y);

  doc.setFont(undefined, "bold");
  doc.text("Department:", 350, y);
  doc.setFont(undefined, "normal");
  doc.text(slipData.raw?.requestList?.[0]?.department || "N/A", 430, y);

  y += 20;
  if (["Approved", "Returned"].includes(slipData.raw?.status)) {
    doc.setFont(undefined, "bold");
    doc.text("Approved By:", 350, y);
    doc.setFont(undefined, "normal");
    doc.text(slipData.raw?.approvedBy || "N/A", 430, y);
  }
  if (slipData.raw?.status === "Rejected") {
    doc.setFont(undefined, "bold");
    doc.text("Rejected By:", 350, y);
    doc.setFont(undefined, "normal");
    doc.text(slipData.raw?.rejectedBy || "N/A", 430, y);
  }

  return doc;
};

// Usage example for Save:
const saveAsPdf = () => {
  const doc = generatePdfFromSlip(selectedRequest);
  if (doc) doc.save(`Requisition_Slip_${selectedRequest?.requisitionId || "unknown"}.pdf`);
};

// Usage example for Print:
const printPdf = () => {
  const doc = generatePdfFromSlip(selectedRequest);
  if (doc) {
    doc.autoPrint();
    window.open(doc.output("bloburl"), "_blank");
  }
};




  const columns = [
    {
      title: "Process Date",
      dataIndex: "processDate",
      key: "processDate",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Text
          style={{
            color: status === "Approved" ? "green" : "red",
            fontWeight: "bold",
          }}
        >
          {status}
        </Text>
      ),
    },
    {
      title: "Requestor",
      dataIndex: "requestor",
      key: "requestor",
    },
    {
      title: "By",
      key: "by",
      render: (_, record) => (
        <Text>
          {record.status === "Approved" || record.status === "Returned"
            ? record.approvedBy
            : record.rejectedBy}
        </Text>
      ),
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

  const filteredData =
    filterStatus === "All"
      ? historyData
      : historyData.filter((item) => item.status === filterStatus);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout>
        <Content style={{ margin: "20px" }}>
          <div style={{ marginBottom: 16 }}>
            <Button
              type={filterStatus === "All" ? "primary" : "default"}
              onClick={() => setFilterStatus("All")}
              style={{ marginRight: 8 }}
            >
              All
            </Button>

            <Button
              type={filterStatus === "Approved" ? "primary" : "default"}
              onClick={() => setFilterStatus("Approved")}
              style={{ marginRight: 8 }}
            >
              Approved
            </Button>

            <Button
              type={filterStatus === "Rejected" ? "primary" : "default"}
              onClick={() => setFilterStatus("Rejected")}
              style={{ marginRight: 8 }}
            >
              Rejected
            </Button>

            <Button
              type={filterStatus === "Returned" ? "primary" : "default"}
              onClick={() => setFilterStatus("Returned")}
            >
              Returned
            </Button>
          </div>

          <Table
            className="request-log-table"
            dataSource={filteredData}
            columns={columns}
            rowKey="id"
            bordered
            pagination={{ pageSize: 10 }}
          />
        </Content>

        <Modal
          title="📄 Requisition Slip"
          visible={modalVisible}
          onCancel={closeModal}
          footer={[
            <Button key="save" type="primary" onClick={saveAsPdf}>
              Save as PDF
            </Button>,
              <Button key="print" onClick={() => printPdf(selectedRequest)}>
              Print as PDF
            </Button>,

            <Button key="close" onClick={closeModal}>
              Back
            </Button>,
          ]}
          width={800}
          zIndex={1025}
          bodyStyle={{ maxHeight: "65vh", overflowY: "auto" }}
        >
          {selectedRequest && (
            <div ref={modalRef} style={{ padding: "10px" }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text strong>Name:</Text> {selectedRequest.raw?.userName}
                </Col>

                <Col span={12} style={{ textAlign: "right" }}>
                  <Text italic>
                    Requisition ID: {selectedRequest.requisitionId}
                  </Text>
                </Col>
              </Row>

              <Row gutter={[16, 16]} style={{ marginTop: 10 }}>
                <Col span={12}>
                  <Text strong>Request Date:</Text> {selectedRequest.timestamp}
                </Col>

                <Col span={12}>
                  <Text strong>Required Date:</Text>{" "}
                  {selectedRequest.raw?.dateRequired}
                </Col>
              </Row>

              <Row gutter={[16, 16]} style={{ marginTop: 10 }}>
                <Col span={12}>
                  <Text strong>Requested Items:</Text>{" "}
                  <Text style={{ color: "green" }}>({selectedRequest.status})</Text>
                </Col>

                <Col span={12}>
                  <Text strong>Time Needed: </Text>
                  <Text>
                    {selectedRequest.timeFrom ? selectedRequest.timeFrom : "N/A"} -{" "}
                    {selectedRequest.timeTo ? selectedRequest.timeTo : "N/A"}
                  </Text>
                </Col>
              </Row>

              <Table
                dataSource={(selectedRequest.raw?.requestList ?? []).map(
                  (item, index) => ({
                    key: index,
                    itemId: item.itemIdFromInventory,
                    itemDescription: item.itemName,
                    quantity: item.quantity,
                    rejectionReason:
                      item.rejectionReason ||
                      selectedRequest.raw?.rejectionReason ||
                      "N/A",
                  })
                )}
                columns={[
                  {
                    title: "Item ID",
                    dataIndex: "itemId",
                    key: "itemId",
                  },
                  {
                    title: "Item Description",
                    dataIndex: "itemDescription",
                    key: "itemDescription",
                  },
                  {
                    title: "Quantity",
                    dataIndex: "quantity",
                    key: "quantity",
                  },
                  ...(selectedRequest.raw?.status === "Rejected"
                    ? [
                        {
                          title: "Reason of Rejection",
                          dataIndex: "rejectionReason",
                          key: "rejectionReason",
                        },
                      ]
                    : []),
                ]}
                pagination={{ pageSize: 10 }}
                style={{ marginTop: 10 }}
                size="small"
              />

              <Row gutter={[16, 8]} style={{ marginTop: 20 }}>
                <Col span={12}>
                  <Text strong>Reason of Request:</Text>
                  <p>{selectedRequest.raw?.reason}</p>
                </Col>

                <Col span={12}>
                  <Text strong>Department:</Text>{" "}
                  {selectedRequest.raw?.requestList?.[0]?.department}

                  <br />

                  {["Approved", "Returned"].includes(selectedRequest.raw?.status) && (
                    <>
                      <Text strong>Approved By:</Text> {selectedRequest.raw?.approvedBy}
                    </>
                  )}

                  {selectedRequest.raw?.status === "Rejected" && (
                    <>
                      <Text strong>Rejected By:</Text>{" "}
                      {selectedRequest.raw?.rejectedBy || "N/A"}
                    </>
                  )}
                </Col>
              </Row>
            </div>
          )}
        </Modal>
      </Layout>
    </Layout>
  );
};

export default RequestLog;
