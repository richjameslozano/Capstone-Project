import React, { useEffect, useState } from "react";
import { Modal, Button, Typography, Table } from "antd";
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import "../styles/adminStyle/PendingRequest.css";
import NotificationModal from "./NotificationModal";

const { Title } = Typography;

const RequisitionRequestModal = ({
  isModalVisible,
  handleCancel,
  handleApprove,
  handleReturn,
  selectedRequest,
  columns,
  formatDate,
  allItemsChecked,
  college,
  approveLoading = false,
  rejectLoading = false,
  editableItems,
  setEditableItems,
}) => {
  const [checkedItemIds, setCheckedItemIds] = useState([]);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [approvalRequestedIds, setApprovalRequestedIds] = useState([]);
  const [requestCollege, setRequestCollege] = useState(null);
  const userDepartment = (localStorage.getItem("userDepartment") || "").trim().toUpperCase();
  const userJobTitle = (localStorage.getItem("userJobTitle") || "").trim().toLowerCase();

  useEffect(() => {
    if (selectedRequest) {
      setCheckedItemIds([]); // reset when modal opens
      setEditableItems([]); // reset editable items
    }
  }, [selectedRequest, setEditableItems]);

  useEffect(() => {
    if (selectedRequest?.requestList && setEditableItems) {
      const itemsWithMax = selectedRequest.requestList.map((item) => ({
        ...item,
        quantity: item.quantity,            // Editable
        maxQuantity: item.quantity,         // Store original as max
      }));
      setEditableItems(itemsWithMax);
    }
  }, [selectedRequest, setEditableItems]);

  useEffect(() => {
    const fetchCollegeFromDepartment = async () => {
      if (!selectedRequest?.department) return;

      try {
        const q = query(
          collection(db, "departments"),
          where("name", "==", selectedRequest.department)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const college = snapshot.docs[0].data().college;
          setRequestCollege(college?.toUpperCase() || null);
        } else {
          setRequestCollege(null);
        }
      } catch (error) {
        console.error("Error fetching department college:", error);
        setRequestCollege(null);
      }
    };

    fetchCollegeFromDepartment();
  }, [selectedRequest]);

  const handleAskApproval = async () => {
    if (!selectedRequest) return;

    console.log("userId:", selectedRequest.accountId); 

    try {
      await addDoc(collection(db, "approvalrequestcollection"), {
        ...selectedRequest,
        firestoreId: selectedRequest.id,
        forwardedAt: serverTimestamp(),
        status: "Pending Approval",
      });
      console.log("Successfully added to approvalrequestcollection");

      await updateDoc(doc(db, `userrequests/${selectedRequest.id}`), {
        approvalRequested: true,
      });

      console.log("Successfully updated userRequests");
      setApprovalRequestedIds(prev => [...prev, selectedRequest.id]);
      setNotificationMessage("Request successfully forwarded for approval.");
      setIsNotificationVisible(true);
      handleCancel(); // Optionally close the modal

    } catch (error) {
      console.error("Error forwarding request:", error);
      setNotificationMessage("Failed to forward request for approval.");
      setIsNotificationVisible(true);
    }
  };

  const isDeanOfSAH = userDepartment === "SAH" && userJobTitle === "dean";
  const shouldShowAskApproval = requestCollege !== "SAH" && !isDeanOfSAH;

  return (
    <>
      <Modal
        open={isModalVisible}
        onCancel={handleCancel}
        width={800}
        zIndex={1022}
        footer={[
          <Button key="cancel" onClick={handleCancel} disabled={approveLoading || rejectLoading}>Cancel</Button>,
          <Button key="reject" type="default" onClick={handleReturn} loading={rejectLoading} disabled={approveLoading}>Reject</Button>,

          requestCollege !== null && shouldShowAskApproval && (
            <Button
              key="askApproval"
              type="dashed"
              onClick={handleAskApproval}
              disabled={selectedRequest?.approvalRequested === false}
            >
              Ask Approval
            </Button>
          ),

          <Button
            key="approve"
            type="primary"
            onClick={handleApprove}
            loading={approveLoading}
            disabled={
              rejectLoading ||
              // If approvalRequested exists...
              typeof selectedRequest?.approvalRequested !== "undefined"
                ? selectedRequest.approvalRequested || selectedRequest.deanStatus !== "Approved by Dean"
                : false // If approvalRequested does not exist, enable
            }
          >
            {allItemsChecked ? "Approve" : "Next"}
          </Button>
        ]}
      >
        {selectedRequest && (
          <>
            <div className="requisition-slip-title">
              <strong>Requisition Slip</strong>
            </div>
            <div className="whole-slip">
              <div className="left-slip">
                <div><strong>Requestor:</strong><p>{selectedRequest.userName}</p></div>
                <div><strong>Date Submitted:</strong><p>{formatDate(selectedRequest.timestamp)}</p></div>
                <div><strong>Date Needed:</strong><p>{selectedRequest.dateRequired}</p></div>
                <div><strong>Time Needed:</strong><p>{selectedRequest.timeFrom} - {selectedRequest.timeTo}</p></div>
              </div>

              <div className="right-slip">
                <div><strong>Room:</strong><p>{selectedRequest.room}</p></div>
                <div><strong>Course Code:</strong><p>{selectedRequest.course}</p></div>
                <div><strong>Course Description:</strong><p>{selectedRequest.courseDescription}</p></div>
                <div><strong>Program:</strong><p>{selectedRequest.program}</p></div>
                <div><strong>Usage Type:</strong><p>{selectedRequest.usageType}</p></div>
              </div>
            </div>

            <Title level={5} style={{ marginTop: 20 }}>Requested Items:</Title>

            <Table
              dataSource={selectedRequest.requestList}
              columns={columns}
              rowKey={(record, index) => `row-${index}`}
              pagination={false}
              bordered
            />

            <div style={{display: 'flex', marginTop: '20px'}}><p><strong>Note:</strong> {selectedRequest.reason}</p></div>

            {selectedRequest.deanComment && (
              <div style={{ display: 'flex', marginTop: '10px' }}>
                <p>
                  <strong>Dean Comment:</strong> {selectedRequest.deanComment} 
                  <br/>
                  <strong>Status:</strong> {selectedRequest.deanStatus}
                </p>
              </div>
            )}
          </>
        )}
      </Modal>

      <NotificationModal
        isVisible={isNotificationVisible}
        onClose={() => setIsNotificationVisible(false)}
        message={notificationMessage}
      />
    </>
  );
};

export default RequisitionRequestModal;

