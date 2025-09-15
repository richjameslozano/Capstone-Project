import React from "react";
import { Modal, Table } from "antd";

const FinalizeCapexModal = ({ visible, onConfirm, onCancel, totalPrice, dataSource }) => {

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
      title: "Justification",
      dataIndex: "justification",
      key: "justification",
    },
  ];

  return (
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
      Finalize CAPEX Request
    </div>
  }
  open={visible}
  onOk={onConfirm}
  onCancel={onCancel}
  zIndex={1014}
  width="50%"
  okText="Confirm Submit"
  cancelText="Go Back"
  okButtonProps={{
    style: {
      background: "linear-gradient(135deg, #3ba1c5 0%, #165a72 100%)",
      border: "none",
      borderRadius: "8px",
      height: "40px",
      fontWeight: "600",
    },
  }}
  cancelButtonProps={{
    style: {
      border: "1px solid #165a72",
      borderRadius: "8px",
      height: "40px",
      color: "#165a72",
      fontWeight: "600",
    },
  }}
>
  <div style={{ fontSize: "16px", color: "#333", marginBottom: "16px" }}>
    <p>Are you sure you want to submit this CAPEX request?</p>
    <p style={{ color: "rgba(30, 82, 102, 1)", fontWeight: "500" }}>
      Requesting Items:
    </p>
  </div>

  {/* Regular Table */}
  <div style={{ overflowX: "auto", marginTop: "20px" }}>
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        border: "1px solid #ddd",
        fontSize: "14px",
      }}
    >
      <thead>
        <tr style={{ backgroundColor: "#f5f8fa", textAlign: "left" }}>
          <th style={{ padding: "8px", border: "1px solid #ddd" }}>Item</th>
          <th style={{ padding: "8px", border: "1px solid #ddd" }}>Subject</th>
          <th style={{ padding: "8px", border: "1px solid #ddd" }}>Brand</th>
          <th style={{ padding: "8px", border: "1px solid #ddd" }}>Qty</th>
          <th style={{ padding: "8px", border: "1px solid #ddd" }}>Est. Cost</th>
          <th style={{ padding: "8px", border: "1px solid #ddd" }}>Total</th>
        </tr>
      </thead>
      <tbody>
        {dataSource.map((item, idx) => (
          <tr key={item.id || idx}>
            <td style={{ padding: "8px", border: "1px solid #ddd" }}>
              {item.itemDescription}
            </td>
            <td style={{ padding: "8px", border: "1px solid #ddd" }}>
              {item.subject}
            </td>
            <td style={{ padding: "8px", border: "1px solid #ddd" }}>
              {item.brand || "-"}
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
      <strong>Total Estimated Cost:</strong>{" "}
      <span style={{ color: "green", fontWeight: "600" }}>
        ₱{totalPrice.toLocaleString()}
      </span>
    </p>
  </div>
</Modal>

  );
};

export default FinalizeCapexModal;
