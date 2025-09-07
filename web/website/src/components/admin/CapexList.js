import React, { useState, useEffect, useRef } from "react";
import { Layout, Row, Col, Typography, Table, Modal, Button, Select } from "antd";
import { db } from "../../backend/firebase/FirebaseConfig";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../styles/adminStyle/CapexList.css";
import { getAuth } from "firebase/auth";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const CapexList = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState(null);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const yearRange = `${currentYear}-${nextYear}`;
  const modalRef = useRef(null);

  const totalCost = filteredRequests.reduce(
    (sum, r) => sum + (r.totalPrice || 0),
    0
  );

  useEffect(() => {
    const fetchRequests = () => {
      try {
        const requestRef = collection(db, "capexrequestlist");
        const unsubscribe = onSnapshot(requestRef, (querySnapshot) => {
          const fetched = [];
          const subjects = new Set();

          querySnapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            fetched.push({ id: docSnap.id, ...data });
            (data.items || []).forEach((item) => item.subject && subjects.add(item.subject));
          });

          setSubjectOptions(Array.from(subjects));
          setRequests(fetched);
          setFilteredRequests(fetched);
        });

        return () => unsubscribe();
      } catch (e) {
        // noop
      }
    };

    fetchRequests();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return "N/A";
    const date = timestamp.toDate();
    return date.toLocaleString("en-PH", { timeZone: "Asia/Manila" });
  };

  const handleFilter = (value) => {
    setSubjectFilter(value);
    if (!value) {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(
        requests.filter((r) => r.items?.some((i) => i.subject === value))
      );
    }
  };

  const handleViewDetails = (record) => {
    setSelectedRequest(record);
    setModalVisible(true);
  };

  // ---------- PDF helpers ----------
  const formatDateTimePH = (d = new Date()) =>
    new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);

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

  async function getGeneratedBy(firestoreDb) {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return "Unknown User";
      const snap = await getDoc(doc(firestoreDb, "accounts", user.uid));
      return snap.exists()
        ? snap.data().name || "Unknown User"
        : user.email || "Unknown User";
    } catch {
      return "Unknown User";
    }
  }

  const generatePdfFromFilteredData = async ({
    db,
    subjectFilter,
    filteredRequests,
    totalCost,
  }) => {
    if (!filteredRequests || filteredRequests.length === 0) return null;

    const generatedBy = await getGeneratedBy(db);
    const chosenFilter =
      subjectFilter && subjectFilter.trim() ? subjectFilter : "All Requests";
    const printedOn = formatDateTimePH();
    const logo = await loadImageAsDataURL("/NULS_Favicon.png");
    const totalPagesExp = "{total_pages_count_string}";

    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const marginX = 14;
    const headerTopY = 10;
    const headerBottomY = 22;
    const contentTop = headerBottomY + 5;
    const footerTopY = pageHeight - 12;
    const contentBottom = footerTopY - 5;

    const drawHeader = () => {
      if (logo) {
        doc.addImage(logo, "PNG", marginX, headerTopY - 2, 12, 12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("NULS", marginX + 16, headerTopY + 5);
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("CAPEX REQUEST LIST", pageWidth / 2, headerTopY + 5, {
        align: "center",
      });

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
      doc.text(
        `Page ${pageCurrent} of ${totalPagesExp}`,
        pageWidth - marginX,
        pageHeight - 7,
        { align: "right" }
      );
    };

    drawHeader();

    // Report meta
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Report Details", marginX, contentTop);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);

    const meta = [
      ["Filter:", chosenFilter],
      ["Total Requests:", String(filteredRequests.length)],
      ["Total Cost:", `₱${Number(totalCost || 0).toLocaleString()}`],
      ["Generated By:", generatedBy],
      ["Date Generated:", printedOn],
    ];

    autoTable(doc, {
      startY: contentTop + 3,
      theme: "plain",
      styles: {
        font: "helvetica",
        fontSize: 10.5,
        cellPadding: { top: 1.2, bottom: 1.2, left: 0, right: 0 },
      },
      margin: { left: marginX, right: marginX },
      body: meta,
      columnStyles: {
        0: { cellWidth: 32, fontStyle: "bold" },
        1: { cellWidth: pageWidth - marginX * 2 - 32 },
      },
      didDrawPage: () => {
        drawHeader();
        drawFooter();
      },
    });

    let y = doc.lastAutoTable.finalY + 8;
    if (y > contentBottom - 15) {
      doc.addPage();
      drawHeader();
      y = contentTop;
    }

    // helpers inside generator
    const ensureSpace = (needed = 0) => {
      if (y + needed > contentBottom) {
        doc.addPage();
        drawHeader();
        drawFooter();
        y = contentTop + 2;
      }
    };
    const money = (n) =>
      `PHP ${Number(n || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    // Per-request sections
    filteredRequests.forEach((request, idx) => {
      const reqTotal = (request.items || []).reduce(
        (sum, it) => sum + Number(it.totalPrice || 0),
        0
      );

      const submissionDate = (() => {
        const d = request.createdAt;
        if (!d) return "N/A";
        return typeof d.toDate === "function"
          ? d.toDate().toLocaleDateString("en-PH", { timeZone: "Asia/Manila" })
          : String(d);
      })();

      ensureSpace(24);

      const headerRow = [
        [
          `${idx + 1}. Requestor: ${request.userName || "N/A"}`,
          `Submission: ${submissionDate}   •   Total: ${money(reqTotal)}`,
        ],
      ];

      autoTable(doc, {
        startY: y,
        theme: "plain",
        styles: {
          font: "helvetica",
          fontSize: 11,
          cellPadding: { top: 0, bottom: 0, left: 0, right: 0 },
          overflow: "linebreak",
          valign: "bottom",
        },
        margin: { left: marginX, right: marginX },
        body: [[
          `${idx + 1}. Requestor: ${request.userName || "N/A"}`,
          `Submission: ${submissionDate}   |   Total: ${money(reqTotal)}`
        ]],
        columnStyles: {
          0: { cellWidth: (pageWidth - marginX * 2) * 0.40, fontStyle: "bold", halign: "left" },
          1: { cellWidth: (pageWidth - marginX * 2) * 0.60, halign: "left", fontSize: 10.5 }
        },
        didDrawPage: () => { drawHeader(); drawFooter(); },
      });


      y = doc.lastAutoTable.finalY + 4;
      doc.setDrawColor(230);
      doc.setLineWidth(0.2);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 6;

      ensureSpace(12);

      const head = [
        ["Item Description", "Subject", "Qty", "Estimated Cost", "Total Price"],
      ];
      const body = (request.items || []).map((item) => [
        item.itemDescription || "",
        item.subject || "",
        String(item.qty ?? ""),
        money(item.estimatedCost),
        money(item.totalPrice),
      ]);

      autoTable(doc, {
        startY: y,
        head,
        body,
        theme: "grid",
        margin: {
          left: marginX,
          right: marginX,
          top: contentTop,
          bottom: pageHeight - contentBottom,
        },
        styles: {
          font: "helvetica",
          fontSize: 10,
          cellPadding: 3,
          lineColor: 200,
          lineWidth: 0.2,
          overflow: "linebreak",
          valign: "middle",
          cellWidth: "wrap",
        },
        headStyles: {
          fillColor: [44, 62, 146],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 66 },
          1: { cellWidth: 34 },
          2: { cellWidth: 14, halign: "right", noWrap: true },
          3: { cellWidth: 30, halign: "right", noWrap: true },
          4: { cellWidth: 30, halign: "right", noWrap: true },
        },
        rowPageBreak: "auto",
        pageBreak: "auto",
        didDrawPage: () => {
          drawHeader();
          drawFooter();
        },
      });

      y = doc.lastAutoTable.finalY + 10;
      ensureSpace(0);
      doc.setDrawColor(240);
      doc.setLineWidth(0.2);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 6;
    });

    if (typeof doc.putTotalPages === "function") {
      doc.putTotalPages(totalPagesExp);
    }

    return doc;
  };

  const saveAsPdf = async () => {
    setPdfLoading(true);
    try {
      const doc = await generatePdfFromFilteredData({
        db,
        subjectFilter,
        filteredRequests,
        totalCost,
      });
      if (doc) {
        const fileName = subjectFilter
          ? `CAPEX_Requests_${subjectFilter.replace(/\s+/g, "_")}.pdf`
          : "CAPEX_Requests_All.pdf";
        doc.save(fileName);
      }
    } catch (e) {
      console.error("Error saving PDF:", e);
    } finally {
      setPdfLoading(false);
    }
  };

  const printPdf = async () => {
    setPrintLoading(true);
    try {
      const doc = await generatePdfFromFilteredData({
        db,
        subjectFilter,
        filteredRequests,
        totalCost,
      });
      if (doc) {
        doc.autoPrint();
        window.open(doc.output("bloburl"), "_blank");
      }
    } catch (e) {
      console.error("Error printing PDF:", e);
    } finally {
      setPrintLoading(false);
    }
  };

  const exportToExcel = () => {
    setExportLoading(true);
    try {
      const excelData = filteredRequests.map((request, index) => {
        const baseData = {
          "No.": index + 1,
          Requestor: request.userName || "",
          "Submission Date": formatDate(request.createdAt) || "",
          "Total Price": `₱${request.totalPrice?.toLocaleString() || "0"}`,
        };
        (request.items || []).forEach((item, itemIndex) => {
          baseData[`Item ${itemIndex + 1} Description`] =
            item.itemDescription || "";
          baseData[`Item ${itemIndex + 1} Subject`] = item.subject || "";
          baseData[`Item ${itemIndex + 1} Justification`] =
            item.justification || "";
          baseData[`Item ${itemIndex + 1} Quantity`] = item.qty || "";
          baseData[`Item ${itemIndex + 1} Estimated Cost`] = `₱${
            item.estimatedCost?.toLocaleString() || "0"
          }`;
          baseData[`Item ${itemIndex + 1} Total Price`] = `₱${
            item.totalPrice?.toLocaleString() || "0"
          }`;
        });
        return baseData;
      });

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "CAPEX Requests");
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const fileName = subjectFilter
        ? `CAPEX_Requests_${subjectFilter.replace(/\s+/g, "_")}.xlsx`
        : "CAPEX_Requests_All.xlsx";
      saveAs(data, fileName);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    } finally {
      setExportLoading(false);
    }
  };

  const columns = [
    {
      title: "Requestor",
      dataIndex: "userName",
      width: 200,
      render: (text, record, index) => (
        <span>
          {index + 1}. <strong>{text}</strong>
        </span>
      ),
    },
    {
      title: "Submission Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (createdAt) => formatDate(createdAt),
    },
    {
      title: "Total Price",
      dataIndex: "totalPrice",
      key: "totalPrice",
      width: 150,
      render: (price) => `₱${price?.toLocaleString()}`,
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (text, record) => (
        <Button type="link" onClick={() => handleViewDetails(record)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }} className="capex-list-layout">
      <Content style={{ margin: "20px" }} className="capex-list-content">
        <Row gutter={24}>
          <Col span={24}>
            <h2>CAPEX Request for Materials Year {yearRange}</h2>

            <Title level={4}>List of Requests</Title>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <Select
                allowClear
                style={{ width: 200 }}
                placeholder="Filter by Subject"
                value={subjectFilter}
                onChange={handleFilter}
              >
                {subjectOptions.map((subject, index) => (
                  <Option key={index} value={subject}>
                    {subject}
                  </Option>
                ))}
              </Select>

              <div>
                <Button
                  className="export-excel-button"
                  onClick={exportToExcel}
                  loading={exportLoading}
                  disabled={pdfLoading || printLoading}
                >
                  Export to Excel
                </Button>
                <Button
                  className="save-pdf-button"
                  type="primary"
                  onClick={saveAsPdf}
                  loading={pdfLoading}
                  disabled={exportLoading || printLoading}
                  style={{ marginRight: 8, marginLeft: 8 }}
                >
                  Save as PDF
                </Button>

                <Button
                  className="print-pdf-button"
                  onClick={printPdf}
                  loading={printLoading}
                  disabled={exportLoading || pdfLoading}
                  style={{ marginRight: 8 }}
                >
                  Print
                </Button>
              </div>
            </div>

            <div style={{ textAlign: "right", marginBottom: 16 }}>
              <Text strong> Total Cost: ₱{totalCost.toLocaleString()} </Text>
            </div>

            <div className="table-scroll-wrapper">
              <Table
                dataSource={filteredRequests}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                columns={columns}
                className="capex-list-table"
              />
            </div>
          </Col>
        </Row>
      </Content>

      <Modal
        title="CAPEX Request Details"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
        zIndex={1026}
        bodyStyle={{ maxHeight: "65vh", overflowY: "auto" }}
        className="capex-list-ant-modal"
      >
        {selectedRequest && (
          <div ref={modalRef} style={{ padding: "10px" }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>Requestor:</Text> {selectedRequest.userName}
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 10 }}>
              <Col span={12}>
                <Text strong>Submission Date:</Text>{" "}
                {formatDate(selectedRequest.createdAt)}
              </Col>
              <Col span={12}>
                <Text strong>Total Price:</Text>{" "}
                ₱{selectedRequest.totalPrice?.toLocaleString()}
              </Col>
            </Row>

            <div className="table-scroll-wrapper">
              <Table
                dataSource={selectedRequest.items}
                columns={[
                  {
                    title: "Item Description",
                    dataIndex: "itemDescription",
                    key: "itemDescription",
                    width: 200,
                  },
                  { title: "Subject", dataIndex: "subject", key: "subject", width: 120 },
                  {
                    title: "Justification",
                    dataIndex: "justification",
                    key: "justification",
                    width: 200,
                  },
                  { title: "Quantity", dataIndex: "qty", key: "qty", width: 80 },
                  {
                    title: "Estimated Cost",
                    dataIndex: "estimatedCost",
                    key: "estimatedCost",
                    width: 120,
                    render: (cost) => `₱${cost?.toLocaleString()}`,
                  },
                  {
                    title: "Total Price",
                    dataIndex: "totalPrice",
                    key: "totalPrice",
                    width: 120,
                    render: (price) => `₱${price?.toLocaleString()}`,
                  },
                ]}
                pagination={false}
                size="small"
                className="capex-list-table"
                style={{ marginTop: 20 }}
              />
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default CapexList;
