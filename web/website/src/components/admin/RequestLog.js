import React, { useState, useEffect, useRef } from "react";
import { Layout, Table, Button, Modal, Typography, Row, Col, message, DatePicker, Descriptions } from "antd";
import { db } from "../../backend/firebase/FirebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import "../styles/adminStyle/RequestLog.css";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { FileTextOutlined } from "@ant-design/icons";

const { Content } = Layout;
const { Text } = Typography;

const RequestLog = () => {
  const [filterStatus, setFilterStatus] = useState("All");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const modalRef = useRef(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const auth = getAuth();
  const [generatedBy, setGeneratedBy] = useState("Unknown User");

  // -------- Helpers (shared) --------
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

  const formatDateTimePH = (d = new Date()) =>
    new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);




 useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    const storedName = localStorage.getItem("userName");

    if (user) {
      const userRef = doc(db, "accounts", user.uid);
      getDoc(userRef).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setGeneratedBy(
            storedName || data.username || user.email || "Unknown User");

        } else {
          setGeneratedBy(storedName || user.email || "Unknown User");
        }
      });
    }
  }, []);

  // -------- Fetch request logs --------
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

              } catch {}
            }

            if (timestamp && typeof timestamp.toDate === "function") {
              try {
                parsedTimestamp = timestamp.toDate().toLocaleString("en-PH", {
                  timeZone: "Asia/Manila",
                });

              } catch {}
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
              rejectionReason: data.requestList?.[0]?.reason || data.reason || "N/A",
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

      } catch {}
    };

    fetchRequestLogs();
  }, []);

  // -------- Table & filtering --------
  const columns = [
    {
      title: "Process Date",
      dataIndex: "processDate",
      key: "processDate",
    },
       {
      title: "Requestor",
      dataIndex: "requestor",
      key: "requestor",
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
      title: "Action",
      key: "action",
      render: (_, record) => (
        <a href="#" className="view-details" onClick={() => handleViewDetails(record)}>
          View Details
        </a>
      ),
    },
  ];

  const filteredByStatus =
    filterStatus === "All"
      ? historyData
      : historyData.filter((item) => item.status === filterStatus);

  const filteredData = filteredByStatus.filter((item) => {
    if (!selectedMonth) return true; // no month selected => all
    const itemDate = dayjs(item.rawTimestamp?.toDate?.());
    if (!itemDate.isValid()) return false;
    return itemDate.month() === selectedMonth.month() && itemDate.year() === selectedMonth.year();
  });

  // Build a display label for the selected month (e.g., "August 2025"); fallback to "All"
  const monthLabel = selectedMonth ? dayjs(selectedMonth).format("MMMM YYYY") : "All";

  // -------- Requisition Slip PDF (formal) --------
  const generatePdfFromSlip = async (slipData) => {
    if (!slipData) return null;

    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const marginX = 14;
    const headerTopY = 10;
    const headerBottomY = 22;
    const contentTop = headerBottomY + 5;
    const footerTopY = pageHeight - 12;
    const contentBottom = footerTopY - 5;

    const printedOn = formatDateTimePH();
    const logo = await loadImageAsDataURL("/NULS_Favicon.png");
    const totalPagesExp = "{total_pages_count_string}";

    const drawHeader = () => {
      if (logo) {
        doc.addImage(logo, "PNG", marginX, headerTopY - 2, 12, 12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("NULS", marginX + 16, headerTopY + 5);
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("REQUISITION SLIP", pageWidth / 2, headerTopY + 5, { align: "center" });

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

    const status = slipData.raw?.status || slipData.status || "Pending";
    const statusColor =
      status === "Approved" || status === "Returned" ? [0, 128, 0] :
      status === "Rejected" ? [220, 0, 0] : [80, 80, 80];

    const leftCol = [
      ["Name", slipData.raw?.userName || "N/A"],
      ["Request Date", slipData.timestamp || "N/A"],
      ["Requested Items", status],
      ["Approved By", slipData.raw?.approvedBy || "N/A"],
    ];
    const rightCol = [
      ["Department", slipData.raw?.requestList?.[0]?.department || "N/A"],
      ["Required Date", slipData.raw?.dateRequired || "N/A"],
      ["Time Needed", `${slipData.timeFrom || "N/A"} – ${slipData.timeTo || "N/A"}`],
      ["Room", slipData.raw?.room || "N/A"],
    ];

    autoTable(doc, {
      startY: contentTop,
      theme: "plain",
      styles: { font: "helvetica", fontSize: 11, cellPadding: { top: 1.5, bottom: 1.5, left: 0, right: 0 } },
      margin: { left: marginX, right: marginX },
      body: leftCol,
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
      didParseCell: (data) => {
        if (data.row.index === 2 && data.column.index === 1) {
          data.cell.styles.textColor = statusColor;
          data.cell.styles.fontStyle = "bold";
        }
      },
      didDrawPage: () => { drawHeader(); drawFooter(); },
    });

    autoTable(doc, {
      startY: contentTop,
      theme: "plain",
      styles: { font: "helvetica", fontSize: 11, cellPadding: { top: 1.5, bottom: 1.5, left: 0, right: 0 } },
      margin: { left: pageWidth / 2 + 2, right: marginX },
      body: rightCol,
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 } },
      didDrawPage: () => { drawHeader(); drawFooter(); },
    });

    let y = Math.max(doc.lastAutoTable.finalY, contentTop) + 10;
    if (y > pageHeight - 25) { doc.addPage(); drawHeader(); y = contentTop; }

    const items = (slipData.raw?.requestList || []).map((it) => [
      it.itemIdFromInventory || "",
      it.itemName || "",
      it.itemDetails || "",
      String(it.quantity ?? ""),
      it.unit || "N/A",
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Item ID", "Item Name", "Item Description", "Quantity", "Unit"]],
      body: items,
      theme: "grid",
      styles: { font: "helvetica", fontSize: 10, cellPadding: 3, lineColor: 200, lineWidth: 0.2 },
      headStyles: { fillColor: [44, 62, 146], textColor: 255, fontStyle: "bold", halign: "center" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didDrawPage: () => { drawHeader(); drawFooter(); },
    });

    y = doc.lastAutoTable.finalY + 12;
    if (y > pageHeight - 20) { doc.addPage(); drawHeader(); y = contentTop; }

    // Reason below table
    const reasonText = slipData.raw?.reason || "No reason provided";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Reason of Request:", marginX, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);

    const reasonMaxWidth = pageWidth - marginX * 2 - 50;
    const reasonLines = doc.splitTextToSize(reasonText, reasonMaxWidth);
    doc.text(reasonLines, marginX + 50, y);

    if (typeof doc.putTotalPages === "function") {
      doc.putTotalPages("{total_pages_count_string}");
    }

    return doc;
  };

  const saveAsPdf = async () => {
    setPdfLoading(true);
    try {
      const doc = await generatePdfFromSlip(selectedRequest);
      if (doc) doc.save(`Requisition_Slip_${selectedRequest?.requisitionId || "unknown"}.pdf`);
    } finally {
      setPdfLoading(false);
    }
  };

  const printPdf = async () => {
    setPrintLoading(true);
    try {
      const doc = await generatePdfFromSlip(selectedRequest);
      if (doc) {
        doc.autoPrint();
        window.open(doc.output("bloburl"), "_blank");
      }
    } finally {
      setPrintLoading(false);
    }
  };

  // -------- Request Log Report PDF (formal) --------
  const generateAllRequestsPdf = async (monthLabelArg) => {
    if (!filteredData || filteredData.length === 0) {
      message.warning("No requests to generate PDF");
      return null;
    }

    // normalize chosen label (handles string or Dayjs just in case)
    const chosen =
      monthLabelArg && typeof monthLabelArg === "object" && typeof monthLabelArg.format === "function"
        ? monthLabelArg.format("MMMM YYYY")
        : (monthLabelArg && String(monthLabelArg).trim()) || "All";

    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const marginX = 14;
    const headerTopY = 10;
    const headerBottomY = 22;
    const contentTop = headerBottomY + 5;
    const footerTopY = pageHeight - 12;
    const contentBottom = footerTopY - 5;

    const printedOn = formatDateTimePH();
    const logo = await loadImageAsDataURL("/NULS_Favicon.png");
    const totalPagesExp = "{total_pages_count_string}";

    const drawHeader = () => {
      if (logo) {
        doc.addImage(logo, "PNG", marginX, headerTopY - 2, 12, 12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("NULS", marginX + 16, headerTopY + 5);
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("REQUEST LOG REPORT", pageWidth / 2, headerTopY + 5, { align: "center" });

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

    // Meta
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Report Details", marginX, contentTop);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    const meta = [
      ["Month", chosen],
      ["Total Requests", String(filteredData.length)],
      ["Generated By", generatedBy],
      ["Date Generated", formatDateTimePH()],
    ];


    autoTable(doc, {
      startY: contentTop + 3,
      theme: "plain",
      styles: { font: "helvetica", fontSize: 10.5, cellPadding: { top: 1.2, bottom: 1.2, left: 0, right: 0 } },
      margin: { left: marginX, right: marginX },
      body: meta,
      columnStyles: {
        0: { cellWidth: 28, fontStyle: "bold" },
        1: { cellWidth: pageWidth - marginX * 2 - 28 },
      },
      didDrawPage: () => { drawHeader(); drawFooter(); },
    });

    let y = doc.lastAutoTable.finalY + 8;
    if (y > contentBottom - 15) { doc.addPage(); drawHeader(); y = contentTop; }

    const head = [["Process Date", "Status", "Requestor", "Room", "Processed By"]];
    const body = filteredData.map((r) => {
      const processedBy =
        r.status === "Approved" || r.status === "Returned"
          ? (r.approvedBy || "N/A")
          : (r.rejectedBy || "N/A");
      return [
        r.processDate || "N/A",
        r.status || "N/A",
        r.requestor || "N/A",
        r.room || "N/A",
        processedBy,
      ];
    });

    autoTable(doc, {
      startY: y,
      head,
      body,
      margin: { left: marginX, right: marginX, top: contentTop, bottom: pageHeight - contentBottom },
      theme: "grid",
      tableWidth: "auto",
      styles: {
        font: "helvetica",
        fontSize: 10,
        lineColor: 200,
        lineWidth: 0.2,
        cellPadding: 3,
        overflow: "linebreak",
        cellWidth: "auto",
        valign: "top",
      },
      headStyles: { fillColor: [44, 62, 146], textColor: 255, fontStyle: "bold", halign: "center" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { minCellWidth: 28 },
        1: { minCellWidth: 22 },
        2: { minCellWidth: 36 },
        3: { minCellWidth: 20 },
        4: { minCellWidth: 36 },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 1) {
          const txt = (data.cell.raw || "").toString().toLowerCase();
          if (txt === "approved" || txt === "returned") {
            data.cell.styles.textColor = [0, 128, 0];
            data.cell.styles.fontStyle = "bold";
          } else if (txt === "rejected") {
            data.cell.styles.textColor = [220, 0, 0];
            data.cell.styles.fontStyle = "bold";
          } else {
            data.cell.styles.textColor = [60, 60, 60];
          }
        }
      },
      didDrawPage: () => { drawHeader(); drawFooter(); },
    });

    if (typeof doc.putTotalPages === "function") {
      doc.putTotalPages("{total_pages_count_string}");
    }

    return doc;
  };

  const saveAllAsPdf = async () => {
    setPdfLoading(true);
    try {
      const doc = await generateAllRequestsPdf(monthLabel);
      if (doc) {
        doc.save(`Request_Log_${new Date().toISOString().slice(0, 10)}.pdf`);
        message.success("PDF saved successfully");
      }
    } catch (e) {
      console.error("Error saving PDF:", e);
      message.error("Failed to save PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const printAllPdf = async () => {
    setPrintLoading(true);
    try {
      const doc = await generateAllRequestsPdf(monthLabel);
      if (doc) {
        doc.autoPrint();
        window.open(doc.output("bloburl"), "_blank");
        message.success("Print dialog opened");
      }
    } catch (e) {
      console.error("Error printing PDF:", e);
      message.error("Failed to print PDF");
    } finally {
      setPrintLoading(false);
    }
  };

  // -------- UI --------
  const handleViewDetails = (record) => {
    setSelectedRequest(record);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedRequest(null);
  };

  return (

       <Layout className="request-log-container">
        
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
                  Request Log
                </h1>
                <p style={{
                  color: "#a8d5e5",
                  fontSize: "16px",
                  margin: "0",
                  fontWeight: "500"
                }}>
                  Contains all requisition records that have been approved or rejected by Laboratory Personnel.<br/>
                </p>
              </div>
            </div>
          </div>
        <Content className="request-log-content">



          {/* Filters Section */}
          <div className="filters-section">
            <div className="filters-row">
              <DatePicker
                className="date-picker"
                picker="month"
                value={selectedMonth}
                onChange={(date) => setSelectedMonth(date)}
                allowClear
                placeholder="Select Month"
              />

              <div className="filter-buttons-group">
                <Button
                  type={filterStatus === "All" ? "primary" : "default"}
                  onClick={() => setFilterStatus("All")}
                >
                  All
                </Button>
              </div>

              <div className="action-buttons-group">
                <Button
                  className="save-all-pdf-button"
                  type="primary"
                  onClick={saveAllAsPdf}
                  loading={pdfLoading}
                  disabled={printLoading}
                >
                  Save All as PDF
                </Button>

                <Button
                  className="print-all-button"
                  onClick={printAllPdf}
                  loading={printLoading}
                  disabled={pdfLoading}
                >
                  Print All
                </Button>
              </div>

              <div className="status-buttons-group">
                <Button
                  className="approved-status-button"
                  type={filterStatus === "Approved" ? "primary" : "default"}
                  onClick={() => setFilterStatus("Approved")}
                >
                  Approved
                </Button>

                <Button
                  className="rejected-status-button"
                  type={filterStatus === "Rejected" ? "primary" : "default"}
                  onClick={() => setFilterStatus("Rejected")}
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
            </div>
          </div>

          {/* Table Section */}
 <div className="table-section">
            <Table
              className="request-log-table"
              dataSource={filteredData}
              columns={columns}
              rowKey="id"
              pagination={{ 
                pageSize: 15,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              }}
              scroll={{ x: 800 }}
            />
          </div>
        </Content>

        {/* Modal */}
        <Modal
          title={
            <div style={{position: 'absolute', left: 0, top: 0, right: 0, background: '#e9ecee', borderTopLeftRadius: 8, borderTopRightRadius: 8, justifyContent: 'center', padding: '10px 16px'}}>
              <p style={{margin: 0}}> <FileTextOutlined/> Requisition Slip</p>
            </div>
          }
          visible={modalVisible}
          onCancel={closeModal}
          className="requisition-modal"
          footer={[
            <Button
              className="save-all-pdf-button"
              key="save"
              type="primary"
              onClick={saveAsPdf}
              loading={pdfLoading}
              disabled={printLoading}
            >
              Save as PDF
            </Button>,
            <Button
              className="print-all-button"
              type="primary"
              key="print"
              onClick={printPdf}
              loading={printLoading}
              disabled={pdfLoading}
            >
              Print
            </Button>,
            <Button key="close" onClick={closeModal}>
              Back
            </Button>,
          ]}
          width={800}
          zIndex={1025}
        >
          {selectedRequest && (
            <div ref={modalRef} className="modal-content-reqlog">
              {/* Basic Information */}
              <p style={{fontWeight: 'bold'}}>Request Details:</p>


<Descriptions
  bordered
  size="small"
  column={2}
  labelStyle={{ fontWeight: "bold", width: "10%" }}
  contentStyle={{ width: "10%" }}
>
  <Descriptions.Item label="Name">
    {selectedRequest.raw?.userName}
  </Descriptions.Item>

  <Descriptions.Item label="Room">
    {selectedRequest.raw?.room}
  </Descriptions.Item>

  <Descriptions.Item label="Request Date">
    {selectedRequest.timestamp}
  </Descriptions.Item>

  <Descriptions.Item label="Required Date">
    {selectedRequest.raw?.dateRequired}
  </Descriptions.Item>

  <Descriptions.Item label="Requested Items">
    <Text className="status-badge">
      ({selectedRequest.status})
    </Text>
  </Descriptions.Item>

  <Descriptions.Item label="Time Needed">
    {selectedRequest.timeFrom ? selectedRequest.timeFrom : "N/A"} -{" "}
    {selectedRequest.timeTo ? selectedRequest.timeTo : "N/A"}
  </Descriptions.Item>
</Descriptions>

<p style={{fontWeight: 'bold', marginTop: 40}}>Items Requested:</p>

              {/* Items Table */}
              <Table
                className="items-table"
                dataSource={(selectedRequest.raw?.requestList ?? []).map((item, index) => ({
                  key: index,
                  itemId: item.itemIdFromInventory,
                  itemDescription: item.itemName,
                  itemDetails: item.itemDetails,
                  quantity: item.quantity,
                  unit: item.unit,
                  rejectionReason:
                    item.reason ||
                    item.rejectionReason ||
                    selectedRequest.raw?.reason ||
                    selectedRequest.raw?.rejectionReason ||
                    "N/A",
                }))}
                columns={[
                  { title: "Item ID", dataIndex: "itemId", key: "itemId" },
                  { title: "Item Name", dataIndex: "itemDescription", key: "itemDescription" },
                  { title: "Item Description", dataIndex: "itemDetails", key: "itemDetails" },
                  { title: "Quantity", dataIndex: "quantity", key: "quantity" },
                  { title: "Unit", dataIndex: "unit", key: "unit", render: (unit) => unit || "N/A" },
                  ...(selectedRequest.raw?.status === "Rejected"
                    ? [{ title: "Reason of Rejection", dataIndex: "rejectionReason", key: "rejectionReason" }]
                    : []),
                ]}
                pagination={{ pageSize: 10 }}
                size="small"
              />

              {/* Reason Section */}
              <div className="reason-section">
                <Text className="info-label">Reason of Request:</Text>
                <p className="reason-text">{selectedRequest.raw?.reason}</p>
              </div>

              {/* Department and Approval Section */}
              <div className="department-section">
                <Text className="info-label">Department:</Text>
                <Text> {selectedRequest.raw?.requestList?.[0]?.department}</Text>
                
                <div className="approval-info">
                  {["Approved", "Returned"].includes(selectedRequest.raw?.status) && (
                    <>
                      <Text className="info-label">Approved By:</Text>
                      <Text> {selectedRequest.raw?.approvedBy}</Text>
                    </>
                  )}
                  {selectedRequest.raw?.status === "Rejected" && (
                    <>
                      <Text className="info-label">Rejected By:</Text>
                      <Text> {selectedRequest.raw?.rejectedBy || "N/A"}</Text>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </Layout>
  );
};

export default RequestLog;
