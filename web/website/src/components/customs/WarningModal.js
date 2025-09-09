import React from "react";
import { Modal } from "antd";
import { ExclamationCircleOutlined } from '@ant-design/icons';
import "../styles/customsStyle/CustomModal.css";

const WarningModal = ({
  visible,
  onOk,
  onCancel,
  dateRequired,
  daysDifference
}) => {
  return (
    <Modal
      className="warning-modal"
      visible={visible}
      onOk={onOk}
      onCancel={onCancel}
      width={500}
      okText="Continue Anyway"
      cancelText="Change Date"
      zIndex={1042}
      closable={false}
      okButtonProps={{
        style: {
          backgroundColor: '#ff4d4f',
          borderColor: '#ff4d4f',
        }
      }}
    >
      <div className="warning-title-container">
        <ExclamationCircleOutlined style={{fontSize: 25, color: '#ff4d4f'}}/>
        <strong style={{fontSize: '20px', color: '#ff4d4f', marginLeft: '10px'}}>Warning!</strong>
      </div>

      <div className="warning-content">
        <p style={{fontSize: '16px', marginBottom: '15px'}}>
          You're requesting items for <strong>{dateRequired}</strong>, which is only <strong>{daysDifference} day{daysDifference !== 1 ? 's' : ''}</strong> from today.
        </p>
        
        <p style={{fontSize: '14px', color: '#666', marginBottom: '20px'}}>
          Please note that requests with less than 7 days notice may not be processed in time. 
          Consider selecting a date at least 7 days in advance for better processing.
        </p>

        <div style={{backgroundColor: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '6px', padding: '12px'}}>
          <p style={{margin: 0, fontSize: '13px', color: '#a8071a'}}>
            <strong>Recommendation:</strong> Choose a date 7 days or more from today for optimal processing time.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default WarningModal;
