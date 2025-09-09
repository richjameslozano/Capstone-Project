import React, { useState } from "react";
import { Modal, Checkbox } from "antd";
import "../styles/usersStyle/Requisition.css";
import { FileDoneOutlined } from '@ant-design/icons';

const FinalizeRequestModal = ({
  visible,
  onOk,
  onCancel,
  dateRequired,
  timeFrom,
  timeTo,
  program,
  course,
  usageType,
  room,
  reason,
  requestList = [],
  liabilityAccepted,
  onLiabilityChange,
  loading,
  disabled,
}) => {

  return (
    <Modal
      className="finalize-modal"
      // title="Finalize Request"
      visible={visible}
      
      onOk={onOk}
      onCancel={onCancel}
      width={800}
      okText="Confirm and Submit"
      cancelText="Cancel"
      zIndex={1007}
      closable={false}
      okButtonProps={{
        disabled: !liabilityAccepted || loading || disabled,
        loading: loading,
        style: {
          color: (!liabilityAccepted || loading || disabled) ? 'white' : undefined,
          backgroundColor: (!liabilityAccepted || loading || disabled) ? '#d9d9d9' : undefined,
          borderColor: (!liabilityAccepted || loading || disabled) ? '#d9d9d9' : undefined
        }
      }}
    >
      <div className="finalize-title-container">
        <FileDoneOutlined style={{fontSize: 25, color: 'white'}}/>
        <strong style={{fontSize: '22px', color: 'white'}}>Finalize Request</strong>
      </div>

    <div className="modal-whole">
      <div className="modal-left">
            <div><p><strong>Date Needed:</strong></p><p>{dateRequired || "N/A"}</p></div>
        
            <div><p><strong>Time Needed:</strong></p><p>{timeFrom || "N/A"} - {timeTo || "N/A"}</p></div> 

            <div><p><strong>Program:</strong></p><p>{program || "N/A"}</p></div>

            <div><p><strong>Course:</strong></p><p>{course || "N/A"}</p></div>

            <div><p><strong>Usage Type:</strong></p><p>{usageType || "N/A"}</p></div>

            <div><p><strong>Room:</strong></p><p> {room || "N/A"}</p></div>
      </div>

      <div className="modal-right">
        
        <div style={{display: 'flex', flexDirection: 'column'}}><p style={{marginBottom: 5}}><strong>Note:</strong></p><p><i>{reason || "N/A"}</i></p></div>
      </div>
    </div>

      <h4 style={{ marginTop: "20px"}}>Item Summary:</h4>
      <div style={{ maxHeight: 200, overflowY: "auto" }}>
        <table className="finalize-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Item Name</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Item Description</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Category</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Quantity</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Unit</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Lab Room</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {requestList.length > 0 ? requestList.map((item, index) => (
              <tr key={index}>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>{item.itemName}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>{item.itemDetails}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>{item.category}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>{item.quantity}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                  {["Chemical", "Reagent"].includes(item.category) ? (item.unit || "N/A") : "N/A"}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>{item.labRoom}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>{item.status}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" style={{ padding: "8px", textAlign: "center" }}>No items selected.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #e9ecef" }}>
        <Checkbox
          checked={liabilityAccepted}
          onChange={onLiabilityChange}
          style={{ fontSize: "14px", lineHeight: "1.5" }}
        >
          <span style={{ fontWeight: "500" }}>
            I am responsible for the proper use, care, and timely return of all borrowed laboratory items. 
            I accept liability for any loss or damage and will report such incidents immediately to the laboratory custodian.
          </span>
        </Checkbox>
      </div>
    </Modal>
  );
};

export default FinalizeRequestModal;
