import React, { useEffect } from "react";
import { Modal } from "antd";


const SessionTimeoutModal = ({ isVisible, onClose }) => {
    useEffect(() => {
        let timer;
        if (isVisible) {
          // Set a timer to close the modal after 5 seconds
          timer = setTimeout(() => {
            onClose(); // Call the onClose function to close the modal
          }, 15000); // 5000 milliseconds = 15 seconds
        }
    
        return () => clearTimeout(timer); // Cleanup the timer on unmount
      }, [isVisible, onClose]);
    
      return (
        <Modal
          title="Notification"
          open={isVisible}
          onCancel={onClose}
          footer={null}
          centered
          className="notification-modal"
        >
          <p className="notification-message">Your session has expired due to inactivity. You've been logged out. To Continue, Login again.</p>
        </Modal>
      );
    };
export default SessionTimeoutModal;
