import React from "react";
import { Modal } from "antd";
import "../styles/usersStyle/Requisition.css";

const FinalizeRequestModal = ({
  visible,
  onOk,
  onCancel,
  dateRequired,
  timeFrom,
  timeTo,
  program,
  usageType,
  room,
  reason,
  requestList = [],
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
    >
      <div className="finalize-title-container" style={{}}>
        <strong style={{fontSize: '18px', color: 'white'}}>Finalize Request</strong>
      </div>

    <div className="modal-whole">
      <div className="modal-left">
            <div><p><strong>Date Needed:</strong></p><p>{dateRequired || "N/A"}</p></div>
        
            <div><p><strong>Time Needed:</strong></p><p>{timeFrom || "N/A"} - {timeTo || "N/A"}</p></div> 

            <div><p><strong>Program:</strong></p><p>{program || "N/A"}</p></div>

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
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Item</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Category</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Quantity</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Lab Room</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {requestList.length > 0 ? requestList.map((item, index) => (
              <tr key={index}>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>{item.itemName}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>{item.category}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>{item.quantity}</td>
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
    </Modal>
  );
};

export default FinalizeRequestModal;
