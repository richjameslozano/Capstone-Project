import React, { useState, useEffect, useRef } from "react";
import { Layout, Table, Button, Modal, Typography, Row, Col, message, DatePicker } from "antd";
import { db } from "../../backend/firebase/FirebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import "../styles/adminStyle/RequestLog.css";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";


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
    <Layout style={{ minHeight: "100vh" }}>
      <Layout>
        <Content style={{ margin: "20px" }}>
          <div style={{ marginBottom: 16 }}>
            <DatePicker
              picker="month"
              value={selectedMonth}
              onChange={(date) => setSelectedMonth(date)}
              allowClear
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
          bodyStyle={{ maxHeight: "65vh", overflowY: "auto" }}
        >
          {selectedRequest && (
            <div ref={modalRef} style={{ padding: "10px" }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text strong>Name:</Text> {selectedRequest.raw?.userName}
                </Col>
                <Col span={12}>
                  <Text strong>Room:</Text> {selectedRequest.raw?.room}
                </Col>
              </Row>

              <Row gutter={[16, 16]} style={{ marginTop: 10 }}>
                <Col span={12}>
                  <Text strong>Request Date:</Text> {selectedRequest.timestamp}
                </Col>
                <Col span={12}>
                  <Text strong>Required Date:</Text> {selectedRequest.raw?.dateRequired}
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
                      <Text strong>Rejected By:</Text> {selectedRequest.raw?.rejectedBy || "N/A"}
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
