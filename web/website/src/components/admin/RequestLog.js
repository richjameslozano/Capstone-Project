import React, { useState, useEffect, useRef } from "react";
import { Layout, Table, Button, Modal, Typography, Row, Col,message } from "antd";
import { db } from "../../backend/firebase/FirebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import jsPDF from "jspdf";
import 'jspdf-autotable';
import html2canvas from "html2canvas";
import "../styles/adminStyle/RequestLog.css";
import { DatePicker } from "antd";
import dayjs from "dayjs";

const { Content } = Layout;
const { Text } = Typography;
const { RangePicker } = DatePicker;

const RequestLog = () => {
  const [filterStatus, setFilterStatus] = useState("All");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const modalRef = useRef(null); 
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);

  const generateAllRequestsPdf = () => {
    if (!filteredData || filteredData.length === 0) {
      message.warning("No requests to generate PDF");
      return;
    }

    const doc = new jsPDF("p", "pt", "a4");
    
    // Add title
    doc.setFontSize(16);
    doc.text("Request Log Report", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 40, 60);

    // Create table data
    const headers = [["Process Date", "Status", "Requestor", "Processed By"]];
    const data = filteredData.map(request => [
      request.processDate || "N/A",
      request.status || "N/A",
      request.requestor || "N/A",
      request.room || "N/A",
      request.status === "Approved" || request.status === "Returned" 
        ? request.approvedBy || "N/A"
        : request.rejectedBy || "N/A"
    ]);

    // Generate table
    doc.autoTable({
      head: headers,
      body: data,
      startY: 80,
      margin: { left: 40, right: 40 },
      theme: "grid",
      headStyles: {
        fillColor: [44, 62, 146],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
      },
      styles: {
        lineWidth: 0.1,
        lineColor: [200, 200, 200],
      },
      didDrawCell: function(data) {
        // Color the status cells
        if (data.column.index === 1) { // Status column
          if (data.cell.text[0] === "Approved") {
            data.doc.setTextColor(0, 128, 0); // green
          } else {
            data.doc.setTextColor(255, 0, 0); // red
          }
        } else {
          data.doc.setTextColor(0, 0, 0); // black
        }
      }
    });

    return doc;
  };

  const saveAllAsPdf = () => {
    setPdfLoading(true);
    try {
      const doc = generateAllRequestsPdf();
      if (doc) {
        doc.save(`Request_Log_${new Date().toISOString().split('T')[0]}.pdf`);
        message.success("PDF saved successfully");
      }
    } catch (error) {
      console.error("Error saving PDF:", error);
      message.error("Failed to save PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const printAllPdf = () => {
    setPrintLoading(true);
    try {
      const doc = generateAllRequestsPdf();
      if (doc) {
        doc.autoPrint();
        window.open(doc.output("bloburl"), "_blank");
        message.success("Print dialog opened");
      }
    } catch (error) {
      console.error("Error printing PDF:", error);
      message.error("Failed to print PDF");
    } finally {
      setPrintLoading(false);
    }
  };

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
               
              }
            }

            if (timestamp && typeof timestamp.toDate === "function") {
              try {
                parsedTimestamp = timestamp.toDate().toLocaleString("en-PH", {
                  timeZone: "Asia/Manila",
                });
              } catch (e) {
            
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
                data.requestList?.[0]?.reason || data.reason || "N/A",
              approvedBy: data.approvedBy,
              rejectedBy: data.rejectedBy,
              rawTimestamp: rawTimestamp ?? null,
              processDate: parsedRawTimestamp, 
              timestamp: parsedTimestamp,
              room: data.room,
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

  const hasGlasswares = (slipData.raw?.requestList || []).some(
    item => item.category === "Glasswares"
  );

 const isRejected = slipData.raw?.status === "Rejected";

  // Build dynamic headers
  // let headers = ["Item ID", "Item Name", "Quantity"];
  // if (hasGlasswares) headers.push("Volume (ML)");
  // if (isRejected) headers.push("Reason of Rejection");

  // // Convert headers to required format for autoTable (array of arrays)
  // const tableHeaders = [headers];

  // // Build dynamic data rows
  // const data = (slipData.raw?.requestList || []).map((item) => {
  //   const row = [
  //     item.itemIdFromInventory || "",
  //     item.itemName || "",
  //     String(item.quantity || ""),
  //   ];
  //   if (hasGlasswares) {
  //     row.push(item.volume ? String(item.volume) : "");
  //   }
  //   if (isRejected) {
  //      row.push(item.rejectionReason || item.reason || "");
  //   }
  //   return row;
  // });

  const headers = [["Item ID", "Item Name", "Quantity"]];
  const data = (slipData.raw?.requestList || []).map((item) => [
    item.itemIdFromInventory || "",
    item.itemName || "",
    item.itemDetails || "",
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
            color:
          status === "Approved"
            ? "green"
            : status === "Rejected"
            ? "red"
            : "#faad14", 
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

  // const filteredData =
  //   filterStatus === "All"
  //     ? historyData
  //     : historyData.filter((item) => item.status === filterStatus);

  const filteredByStatus =
    filterStatus === "All"
      ? historyData
      : historyData.filter((item) => item.status === filterStatus);

  const filteredData = filteredByStatus.filter((item) => {
    // If no month selected, show all
    if (!selectedMonth) return true;

    // item.rawTimestamp.toDate() -> JS Date
    const itemDate = dayjs(item.rawTimestamp?.toDate?.());
    return (
      itemDate.month() === selectedMonth.month() &&
      itemDate.year() === selectedMonth.year()
    );
  });

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout>
        <Content style={{ margin: "20px" }}>
          <div style={{ marginBottom: 16 }}>

            <DatePicker
              picker="month"
              onChange={(date) => setSelectedMonth(date)}
              style={{ marginRight: 8 }}
              placeholder="Select Month"
            />

            <Button
              type={filterStatus === "All" ? "primary" : "default"}
              onClick={() => setFilterStatus("All")}
              style={{ marginRight: 8 }}
            >
              All
            </Button>
              <Button
                    className="save-all-pdf-button"
                    type="primary"
                    onClick={saveAllAsPdf}
                    style={{ marginRight: 8 }}
                  >
                    Save All as PDF
                  </Button>
                  <Button
                  className="print-all-button"
                    onClick={printAllPdf}
                  >
                    Print All
                  </Button>
                          

            <Button
              className="approved-status-button"
              type={filterStatus === "Approved" ? "primary" : "default"}
              onClick={() => setFilterStatus("Approved")}
              style={{ marginRight: 8, marginLeft: 30 }}
            >
              Approved
            </Button>

            <Button
              className="rejected-status-button"
              type={filterStatus === "Rejected" ? "primary" : "default"}
              onClick={() => setFilterStatus("Rejected")}
              style={{ marginRight: 8 }}
            >
              Rejected
            </Button>

            <Button
              className="returned-status-button"
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
            <Button className='save-all-pdf-button' key="save" type="primary" onClick={saveAsPdf} loading={pdfLoading} disabled={printLoading}>
              Save as PDF
            </Button>,
              <Button className='print-all-button'type="primary" key="print" onClick={() => printPdf(selectedRequest)} loading={printLoading} disabled={pdfLoading}>
              Print
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

                {/* <Col span={12} style={{ textAlign: "right" }}>
                  <Text italic>
                    Requisition ID: {selectedRequest.requisitionId}
                  </Text>
                </Col> */}
                <Col span={12}>
                  <Text strong>Room:</Text> {selectedRequest.raw?.room}
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
                    itemDetails: item.itemDetails,
                    quantity: item.quantity,
                    unit: item.unit,
                    rejectionReason:
                      item.reason ||  item.rejectionReason ||
                      selectedRequest.raw?.reason || selectedRequest.raw?.rejectionReason ||
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
                    title: "Item Name",
                    dataIndex: "itemDescription",
                    key: "itemDescription",
                  },
                  {
                    title: "Item Description",
                    dataIndex: "itemDetails",
                    key: "itemDetails",
                  },
                  {
                    title: "Quantity",
                    dataIndex: "quantity",
                    key: "quantity",
                  },
                  {
                    title: "Unit",
                    dataIndex: "unit",
                    key: "unit",
                    render: (unit) => unit || "N/A",
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

              {/* <Table
                dataSource={(selectedRequest.raw?.requestList ?? []).map((item, index) => {
                  const isGlassware = item.category?.toLowerCase() === "glasswares";

                  const formattedQuantity = isGlassware
                    ? `${item.quantity ?? 0} pcs` // quantity is a number
                    : (item.quantity?.toString() || "0");

                  const volumeColumnData = isGlassware
                    ? (item.volume !== undefined && item.volume !== null)
                      ? `${item.volume}ml`
                      : "N/A"
                    : "N/A";

                  return {
                    key: index,
                    itemId: item.itemIdFromInventory,
                    itemDescription: item.itemName,
                    quantity: formattedQuantity,
                    volume: volumeColumnData,
                    rejectionReason:
                      item.reason || item.rejectionReason ||
                      selectedRequest.raw?.reason || selectedRequest.raw?.rejectionReason ||
                      "N/A",
                    category: item.category,
                  };
                })}
                
                columns={[
                  {
                    title: "Item ID",
                    dataIndex: "itemId",
                    key: "itemId",
                  },
                  {
                    title: "Item Name",
                    dataIndex: "itemDescription",
                    key: "itemDescription",
                  },
                  {
                    title: "Quantity",
                    dataIndex: "quantity",
                    key: "quantity",
                  },
                  // Only show Volume column if any item in the request is Glasswares
                  ...(selectedRequest.raw?.requestList?.some(item => item.category === "Glasswares")
                    ? [{
                        title: "Volume",
                        dataIndex: "volume",
                        key: "volume",
                      }]
                    : []),
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
              /> */}

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
