import React, { useState } from "react";
import axios from 'axios';
import { Modal, message } from 'antd'; 
import NotificationModal from "./NotificationModal";

const DeleteModal = ({ visible, onClose, item, onDeleteSuccess, setDataSource }) => {
    const [isNotificationVisible, setIsNotificationVisible] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");

  const handleDelete = async (item, setDataSource, onDeleteSuccess, onClose) => {
    if (!item || !item.itemId || !item.itemName) {
      message.error("Invalid item data");
      return;
    }

    try {
      const userId = localStorage.getItem("userId") || "unknown";
      const userName = localStorage.getItem("userName") || "User";

      const response = await axios.post("https://webnuls.onrender.com/archive-inventory", {
        item,
        userId,
        userName,
      });

      if (response.status === 200) {
        setDataSource(prevData =>
          prevData.filter(row => row.itemName !== item.itemName)
        );

        setNotificationMessage("Item successfully archived!");
        setIsNotificationVisible(true);
        onDeleteSuccess(item.itemId);
        onClose();
        
      } else {
        message.error("Failed to archive item");
      }

    } catch (error) {
      console.error("Error deleting item:", error);
      message.error("Server error while deleting item");
    }
  };

  return (
    <>
      <Modal
        title="Confirm Archive"
        visible={visible}
        onOk={() => handleDelete(item, setDataSource, onDeleteSuccess, onClose)} // ✅ Now passing arguments
        onCancel={onClose}
        okText="Archive"
        okType="danger"
        cancelText="Cancel"
        zIndex={1021}
      >
        <p>Are you sure you want to archive <strong>{item?.itemName}</strong>?</p>
      </Modal>

      <NotificationModal
        isVisible={isNotificationVisible}
        onClose={() => setIsNotificationVisible(false)}
        message={notificationMessage}
      />
      
    </>
  );
};

export default DeleteModal;
