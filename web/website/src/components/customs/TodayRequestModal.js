import React from "react";
import { Modal, Button } from "antd";

const TodayRequestModal = ({ isVisible, onClose, requestCount }) => {
  return (
    <Modal
      title="Request Notification"
      visible={isVisible}
      onCancel={onClose}
      zIndex={1003}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          OK
        </Button>,
      ]}
    >
      <p>
        You have requested {requestCount} item{requestCount !== 1 ? 's' : ''} today.
        {requestCount > 0 }
      </p>
    </Modal>
  );
};

export default TodayRequestModal;
