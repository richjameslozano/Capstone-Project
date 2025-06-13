import React, { useState, useEffect, useRef } from "react";
import { Layout, Row, Col, Typography, Table, Modal, Button, Select } from "antd";
import { db } from "../../backend/firebase/FirebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import jsPDF from "jspdf";
import 'jspdf-autotable';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../styles/adminStyle/CapexList.css";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const CapexList = () => {
  // State Management
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const yearRange = `${currentYear}-${nextYear}`;
  const modalRef = useRef(null);

  // Calculate total cost of filtered requests
  const totalCost = filteredRequests.reduce((sum, request) => sum + (request.totalPrice || 0), 0);

  // Fetch data from Firestore
  useEffect(() => {
    const fetchRequests = () => {
      try {
        const requestRef = collection(db, "capexrequestlist");
        const unsubscribe = onSnapshot(requestRef, (querySnapshot) => {
          const fetched = [];
          const subjects = new Set();

          querySnapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            fetched.push({
              id: docSnap.id,
              ...data,
            });

            // Collect unique subjects
            (data.items || []).forEach(item => {
              if (item.subject) {
                subjects.add(item.subject);
              }
            });
          });

          setSubjectOptions(Array.from(subjects));
          setRequests(fetched);
          setFilteredRequests(fetched);
        });

        return () => unsubscribe();
      } catch (error) {
    
      }
    };

    fetchRequests();
  }, []);

  // Format date to Philippine timezone
  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return "N/A";
    const date = timestamp.toDate();
    return date.toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
    });
  };

  // Handle subject filtering
  const handleFilter = (value) => {
    setSubjectFilter(value);
    if (!value) {
      setFilteredRequests(requests);
    } else {
      const filtered = requests.filter(request =>
        request.items.some(item => item.subject === value)
      );
      setFilteredRequests(filtered);
    }
  };

  // Handle view details
  const handleViewDetails = (record) => {
    setSelectedRequest(record);
    setModalVisible(true);
  };

  // Generate PDF from filtered data
  const generatePdfFromFilteredData = () => {
    const doc = new jsPDF("p", "pt", "a4");
    const margin = 40;
    let y = margin;

    // Header
    doc.setFontSize(18);
    doc.text("CAPEX Request List", margin, y);
    y += 30;

    // Filter Information
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Filter:", margin, y);
    doc.setFont(undefined, "normal");
    doc.text(subjectFilter || "All Requests", margin + 40, y);
    y += 20;

    // Summary Information
    doc.setFont(undefined, "bold");
    doc.text("Total Requests:", margin, y);
    doc.setFont(undefined, "normal");
    doc.text(filteredRequests.length.toString(), margin + 90, y);

    doc.setFont(undefined, "bold");
    doc.text("Total Cost:", 350, y);
    doc.setFont(undefined, "normal");
    doc.text(`₱${totalCost.toLocaleString()}`, 430, y);
    y += 30;

    // Main Table
   

    // Add Items Details for each request
    filteredRequests.forEach((request, index) => {
      if (y > 700) { // Check if we need a new page
        doc.addPage();
        y = margin;
      }



      const itemHeaders = [["Item Description", "Subject", "Justification", "Quantity", "Estimated Cost", "Total Price"]];
      const itemData = (request.items || []).map(item => [
        item.itemDescription || "",
        item.subject || "",
        item.justification || "",
        String(item.qty || ""),
        `₱${item.estimatedCost?.toLocaleString() || "0"}`,
        `₱${item.totalPrice?.toLocaleString() || "0"}`
      ]);

      doc.autoTable({
        head: itemHeaders,
        body: itemData,
        startY: y,
        margin: { left: margin, right: margin },
        theme: "grid",
        headStyles: {
          fillColor: [44, 62, 146],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
          fontSize: 11,
          cellPadding: 5,
        },
        bodyStyles: {
          fontSize: 10,
          cellPadding: 4,
        },
        styles: {
          lineWidth: 0.1,
          lineColor: [200, 200, 200],
          cellPadding: 4,
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      y = doc.lastAutoTable.finalY + 20;
    });

    return doc;
  };

  // Save PDF
  const saveAsPdf = () => {
    const doc = generatePdfFromFilteredData();
    if (doc) {
      const fileName = subjectFilter 
        ? `CAPEX_Requests_${subjectFilter.replace(/\s+/g, '_')}.pdf`
        : 'CAPEX_Requests_All.pdf';
      doc.save(fileName);
    }
  };

  // Print PDF
  const printPdf = () => {
    const doc = generatePdfFromFilteredData();
    if (doc) {
      doc.autoPrint();
      window.open(doc.output("bloburl"), "_blank");
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    // Prepare data for Excel
    const excelData = filteredRequests.map((request, index) => {
      const baseData = {
        'No.': index + 1,
        'Requestor': request.userName || '',
        'Submission Date': formatDate(request.createdAt) || '',
        'Total Price': `₱${request.totalPrice?.toLocaleString() || '0'}`,
      };

      // Add items data
      (request.items || []).forEach((item, itemIndex) => {
        baseData[`Item ${itemIndex + 1} Description`] = item.itemDescription || '';
        baseData[`Item ${itemIndex + 1} Subject`] = item.subject || '';
        baseData[`Item ${itemIndex + 1} Justification`] = item.justification || '';
        baseData[`Item ${itemIndex + 1} Quantity`] = item.qty || '';
        baseData[`Item ${itemIndex + 1} Estimated Cost`] = `₱${item.estimatedCost?.toLocaleString() || '0'}`;
        baseData[`Item ${itemIndex + 1} Total Price`] = `₱${item.totalPrice?.toLocaleString() || '0'}`;
      });

      return baseData;
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CAPEX Requests');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Save file
    const fileName = subjectFilter 
      ? `CAPEX_Requests_${subjectFilter.replace(/\s+/g, '_')}.xlsx`
      : 'CAPEX_Requests_All.xlsx';
    saveAs(data, fileName);
  };

  // Table columns configuration
  const columns = [
    {
      title: "Requestor",
      dataIndex: "userName",
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
      render: (createdAt) => formatDate(createdAt),
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
        <Button type="link" onClick={() => handleViewDetails(record)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ margin: "20px" }}>
        <Row gutter={24}>
          <Col span={24}>
            <h2>
              CAPEX Request for Materials Year {yearRange}
            </h2>

            <Title level={4}>List of Requests</Title>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
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
                <Button className='export-excel-button'onClick={exportToExcel}>
                  Export to Excel
                </Button>
                <Button className='save-pdf-button'type="primary" onClick={saveAsPdf} style={{ marginRight: 8 }}>
                  Save as PDF
                </Button>
                
                <Button className='print-pdf-button'onClick={printPdf} style={{ marginRight: 8 }}>
                  Print
                </Button>
                
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <Text strong>
                Total Cost: ₱{totalCost.toLocaleString()}
              </Text>
            </div>

            <Table
              dataSource={filteredRequests}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              columns={columns}
            />
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
      >
        {selectedRequest && (
          <div ref={modalRef} style={{ padding: "10px" }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>Requestor:</Text> {selectedRequest.userName}
              </Col>

              {/* <Col span={12} style={{ textAlign: "right" }}>
                <Text italic>Request ID: {selectedRequest.id}</Text>
              </Col> */}
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 10 }}>
              <Col span={12}>
                <Text strong>Submission Date:</Text> {formatDate(selectedRequest.createdAt)}
              </Col>
              <Col span={12}>
                <Text strong>Total Price:</Text> ₱{selectedRequest.totalPrice?.toLocaleString()}
              </Col>
            </Row>

            <Table
              dataSource={selectedRequest.items}
              columns={[
                {
                  title: "Item Description",
                  dataIndex: "itemDescription",
                  key: "itemDescription",
                },
                {
                  title: "Subject",
                  dataIndex: "subject",
                  key: "subject",
                },
                {
                  title: "Justification",
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
                  render: (cost) => `₱${cost?.toLocaleString()}`,
                },
                {
                  title: "Total Price",
                  dataIndex: "totalPrice",
                  key: "totalPrice",
                  render: (price) => `₱${price?.toLocaleString()}`,
                },
              ]}
              pagination={false}
              size="small"
              style={{ marginTop: 20 }}
            />
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default CapexList;

//DONE PRINT 