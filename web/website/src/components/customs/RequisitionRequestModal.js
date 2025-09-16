import React, { useEffect, useState } from "react";
import { Modal, Button, Typography, Table, Descriptions, Alert } from "antd";
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import "../styles/adminStyle/PendingRequest.css";
import NotificationModal from "./NotificationModal";
import { CalendarOutlined, ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons';
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
  checkedItems = {},
  userViolationCounts = {},
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
  
  // Check if any items are checked to disable reject button
  const hasCheckedItems = Object.values(checkedItems).some((checked) => checked);

  return (
    <>
      <Modal
        title={
              <div style={{position: 'absolute', height: 60, background:'#134b5f', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', borderTopLeftRadius: 8, borderTopRightRadius: 8, paddingLeft: 16}}>
              <h2 style={{color: 'white', margin: 0}}><FileTextOutlined/> Requisition Slip</h2>
            </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        width={1000}
        zIndex={1022}
        closable={false}
        footer={[
          <Button key="cancel" onClick={handleCancel} disabled={approveLoading || rejectLoading}>Cancel</Button>,
          <Button key="reject" type="default" onClick={handleReturn} loading={rejectLoading} disabled={approveLoading || hasCheckedItems}>Reject</Button>,

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
          <div style={{paddingTop: 50}}>

<Descriptions
  title="Request Details"
  bordered
  column={2}
  size="middle"
>
  <Descriptions.Item label="Requestor">
    {selectedRequest.userName}
  </Descriptions.Item>

  <Descriptions.Item label="Date Submitted">
    {formatDate(selectedRequest.timestamp)}
  </Descriptions.Item>

  <Descriptions.Item label="Date Needed">
    {selectedRequest.dateRequired}
  </Descriptions.Item>

  <Descriptions.Item label="Time Needed">
    {selectedRequest.timeFrom} - {selectedRequest.timeTo}
  </Descriptions.Item>

  <Descriptions.Item label="Room">
    {selectedRequest.room}
  </Descriptions.Item>

  <Descriptions.Item label="Course Code">
    {selectedRequest.course}
  </Descriptions.Item>

  <Descriptions.Item label="Course Description" span={2}>
    {selectedRequest.courseDescription}
  </Descriptions.Item>

  <Descriptions.Item label="Program">
    {selectedRequest.program}
  </Descriptions.Item>

  <Descriptions.Item label="Usage Type">
    {selectedRequest.usageType}
  </Descriptions.Item>
</Descriptions>

{/* Show violation alert if needed */}
{userViolationCounts[selectedRequest.userName] > 0 && (
  <Alert
    style={{ marginTop: 20 }}
    message={`⚠️ User has ${userViolationCounts[selectedRequest.userName]} violation${
      userViolationCounts[selectedRequest.userName] > 1 ? "s" : ""
    }`}
    description="This user has previous violations on record."
    type="error"
    showIcon
  />
)}

            <Title level={5} style={{ marginTop: 20 }}>Requested Items:</Title>

            <Table
              className="pending-modal-table"
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
          </div>
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

