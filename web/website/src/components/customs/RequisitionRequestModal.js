import React, { useEffect, useState, useRef } from "react";
import { Modal, Button, Row, Col, Typography, Table } from "antd";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig";
import "../styles/adminStyle/PendingRequest.css";
import NotificationModal from "./NotificationModal";

const { Text, Title } = Typography;

const RequisitionReqestModal = ({
  isModalVisible,
  handleCancel,
  handleApprove,
  handleReturn,
  selectedRequest,
  columns,
  formatDate,
  allItemsChecked,
  college,
}) => {

  const [checkedItemIds, setCheckedItemIds] = useState([]);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [approvalRequestedIds, setApprovalRequestedIds] = useState([]);

  useEffect(() => {
    if (selectedRequest) {
      setCheckedItemIds([]); // reset when modal opens
    }
  }, [selectedRequest]);

  const capitalizeName = (name) => {
    return name.replace(/\b\w/g, char => char.toUpperCase());
  };  

  // const handleAskApproval = async () => {
  //   if (!selectedRequest) return;

  //   try {
  //     await addDoc(collection(db, "approvalrequestcollection"), {
  //       ...selectedRequest,
  //       forwardedAt: serverTimestamp(),
  //       status: "Pending Approval",
  //     });

  //     setNotificationMessage("Request successfully forwarded for approval.");
  //     setIsNotificationVisible(true);
  //     handleCancel(); // Optionally close the modal
  //   } catch (error) {
  //     console.error("Error forwarding request:", error);
  //     setNotificationMessage("Failed to forward request for approval.");
  //     setIsNotificationVisible(true);
  //   }
  // };

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

  return (
    <>
      <Modal
        // title={
        //   <div style={{ background: "#f60", padding: "12px", color: "#fff" }}>
        //     <Text strong style={{ color: "#fff" }}>📄 Requisition Slip</Text>
            
        //   </div>
        // }
        open={isModalVisible}
        onCancel={handleCancel}
        width={1000}
        zIndex={1022}
        // footer={[
        //   <Button key="cancel" onClick={handleCancel}>Cancel</Button>,
        //   <Button key="reject" type="default" onClick={handleReturn}>Reject</Button>,
        //   <Button key="approve" type="primary" onClick={handleApprove}>
        //     {allItemsChecked ? "Approve" : "Next"}
        //   </Button>
        // ]}
        footer={[
          <Button key="cancel" onClick={handleCancel}>Cancel</Button>,
          <Button key="reject" type="default" onClick={handleReturn}>Reject</Button>,
          college?.toUpperCase() !== "SAH" && (
            <Button key="askApproval" type="dashed" onClick={handleAskApproval}>
              Ask Approval
            </Button>
          ),
          <Button key="approve" type="primary" onClick={handleApprove}>
            {allItemsChecked ? "Approve" : "Next"}
          </Button>
        ]}
        className="request-modal"

      >
        {selectedRequest && (
          <>
          <div className="requisition-slip-title">
            <strong>Requisition Slip</strong>
            {/* <span style={{ float: "right", fontStyle: "italic", fontSize: '15px' }}>
              Requisition ID: {selectedRequest?.id}
            </span> */}
          </div>
              <div className="whole-slip">
      
      <div className="table-container">
                <div className="table-wrapper2">
                    <table class="horizontal-table">
                        <tbody>
                          <tr>
                            <th>Requestor</th>
                            <td>{capitalizeName(selectedRequest.userName)}</td>
                          </tr>

                          <tr>
                            <th>Date Submitted</th>
                            <td>{formatDate(selectedRequest.timestamp)}</td>
                          </tr>

                          <tr>
                            <th>Program</th>
                            <td>{selectedRequest.program}</td>
                          </tr>

                          <tr>
                            <th>Course Code</th>
                            <td>
                              {selectedRequest.course}
                            </td>
                          </tr>

                          <tr>
                            <th>Course Description</th>
                            <td>{selectedRequest.courseDescription || 'N/A'}</td>
                          </tr> 
                        </tbody>
                      </table>
                      </div>

                      <div className="table-wrapper2">
                    <table class="horizontal-table">
                        <tbody>
                          <tr>
                            <th>Date Needed</th>
                            <td>{selectedRequest.dateRequired}</td>
                          </tr>

                          <tr>
                            <th>Room</th>
                            <td>{selectedRequest.room}</td>
                          </tr>

                          <tr>
                            <th>Time Needed</th>
                            <td>{selectedRequest.timeFrom} - {selectedRequest.timeTo}</td>
                          </tr>

                          <tr>
                            <th>Usage Type</th>
                            <td>
                              {selectedRequest.usageType}
                            </td>
                          </tr>

                          {/* <tr>
                            <th>Category</th>
                            <td>{selectedRequest.category}</td>
                          </tr>

                          <tr>
                            <th>Item Type</th>
                            <td>{selectedRequest.type}</td>
                          </tr> */}

                        </tbody>
                      </table>
                      </div>
                </div>

                <div className="left-slip">
                  <div> <strong>Requestor:</strong><p> {selectedRequest.userName}</p></div>
                  <div>< strong>Date Submitted:</strong><p>{formatDate(selectedRequest.timestamp)}</p> </div>
                  <div>< strong>Date Needed:</strong> <p>{selectedRequest.dateRequired}</p></div>
                  <div>< strong>Time Needed:</strong> <p>{selectedRequest.timeFrom} - {selectedRequest.timeTo}</p> </div>
                </div>
                

                <div className="right-slip">
                  <div><strong>Room:</strong> <p>{selectedRequest.room}</p></div>
                  <div><strong>Course Code:</strong> <p>{selectedRequest.course}</p></div>
                  <div><strong>Course Description:</strong> <p>{selectedRequest.courseDescription}</p></div>
                  <div><strong>Program:</strong> <p>{selectedRequest.program}</p></div>
                  <div><strong>Usage Type:</strong> <p>{selectedRequest.usageType}</p></div>
                </div>
                
              </div>
              
          
          <div style={{padding: 20}}>
            <Title level={5} style={{ marginTop: 10 }}>Requested Items:</Title>
            <Table
              dataSource={selectedRequest.requestList}
              columns={columns}
              rowKey="id"
              pagination={false}
              bordered
              className="requested-item-tbl"
            />

            <div style={{display: 'flex', marginTop: '20px'}}><p style={{textDecoration: 'italics'}}><strong>Note:</strong> {selectedRequest.reason || 'None'}</p></div>
          </div>

            {selectedRequest.deanComment && (
              <div style={{ display: 'flex', marginTop: '10px' }}>
                <p>
                  <strong>Dean Comment:</strong> {selectedRequest.deanComment}
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

export default RequisitionReqestModal;
