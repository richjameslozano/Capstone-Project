import React from "react";
import { Modal, Row, Col, Typography, Table, Button, Input } from "antd";
import { doc, updateDoc, collection, addDoc, serverTimestamp, query, where, getDoc, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../../backend/firebase/FirebaseConfig"; 
import { getAuth } from "firebase/auth";
const { Text, Title } = Typography;

const ApprovalRequestModal = ({
  isApprovedModalVisible,
  setIsApprovedModalVisible,
  selectedApprovedRequest,
  setSelectedApprovedRequest,
  formatDate,
}) => {

  const requestList = selectedApprovedRequest?.requestList || [];
  const [comment, setComment] = React.useState("");

  console.log("requestList in Modal:", requestList);

    // Define your own columns for the modal
    const approvedRequestColumns = [
      {
        title: "Item ID",
        key: "itemId",
        render: (_, record) => record.itemId || record.itemIdFromInventory,
      },
      {
        title: "Item Name",
        dataIndex: "itemName",
        key: "itemName",
      },
      {
        title: "Item Description",
        dataIndex: "itemDetails",
        key: "itemDetails",
      },
      {
        title: "Quantity",
        dataIndex: "quantity",
        key: "quantity",
      },
      {
        title: "Category",
        dataIndex: "category",
        key: "category",
      },
    ];

  if (selectedApprovedRequest?.status === "Returned") {
    approvedRequestColumns.push({
      title: "Condition",
      dataIndex: "conditionSummary",
      key: "conditionSummary",
      render: (text) => <span>{text || "N/A"}</span>,
    });
  }


  function getConditionSummary(conditionsArray) {
    if (!Array.isArray(conditionsArray)) return "N/A";

    const counts = conditionsArray.reduce((acc, condition) => {
      acc[condition] = (acc[condition] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([condition, count]) => `${condition}: ${count}`)
      .join(", ");
  }

    const logRequestOrReturn = async (userId, userName, action) => {
      await addDoc(collection(db, `accounts/${userId}/activitylog`), {
        action, // e.g. "Requested Items" or "Returned Items"
        userName,
        timestamp: serverTimestamp(),
      });
    };

  const getApprovalRequestDocByInternalId = async (internalId) => {
    try {
      const approvalQuery = query(
        collection(db, "approvalrequestcollection"),
        where("id", "==", internalId)
      );
      const querySnapshot = await getDocs(approvalQuery);

      if (querySnapshot.empty) {
        console.warn("⚠️ No approvalrequestcollection document found with internal id:", internalId);
        return null;
      }

      // Assuming there's only one matching doc
      const docSnap = querySnapshot.docs[0];
      return { docId: docSnap.id, data: docSnap.data() };

    } catch (err) {
      console.error("❌ Error fetching approvalrequestcollection document:", err);
      return null;
    }
  };

    const handleReject = async () => {
        let userRequestId = selectedApprovedRequest?.firestoreId;

        if (userRequestId?.startsWith("/userrequests/")) {
            userRequestId = userRequestId.replace("/userrequests/", "");
        }

        console.log("✅ Using cleaned userrequests doc ID:", userRequestId);

        if (!userRequestId) {
            console.error("❌ Missing userrequests ID in selectedApprovedRequest");
            alert("Missing request ID. Cannot approve the request.");
            return;
        }

        if (!comment.trim()) {
            alert("Please enter a comment before rejecting.");
            return;
        }

        try {
            // const auth = getAuth();
            // const currentUser = auth.currentUser;
            // const userId = currentUser?.uid;
            // const userName = currentUser?.displayName || "Unknown User";

            const userId = localStorage.getItem("userId");
            const userName = localStorage.getItem("userName");

            const requestDocRef = doc(db, "userrequests", userRequestId);
            const requestDocSnap = await getDoc(requestDocRef);

            if (!requestDocSnap.exists()) {
            console.error(`❌ Request document not found at userrequests/${userRequestId}`);
            alert("Request not found. It may have been deleted.");
            return;
            }

            await updateDoc(requestDocRef, {
            deanStatus: "Rejected by Dean",
            deanComment: comment.trim(),
            approvalRequested: false,
            });

            // Remove from approvalrequestcollection
            const approvalDoc = await getApprovalRequestDocByInternalId(userRequestId);
            if (approvalDoc?.docId) {
              await deleteDoc(doc(db, "approvalrequestcollection", approvalDoc.docId));
              console.log("✅ Removed from approvalrequestcollection");
            }

            await logRequestOrReturn(userId, userName, "Rejected Request");

            console.log("✅ userrequests document updated successfully.");
            setIsApprovedModalVisible(false);
            setSelectedApprovedRequest(null);
            setComment("");

        } catch (error) {
            console.error("❌ Error updating userrequests document:", error);
            alert("Something went wrong while approving the request.");
        }
    };

    const handleApprove = async () => {
        let userRequestId = selectedApprovedRequest?.firestoreId;

        if (userRequestId?.startsWith("/userrequests/")) {
            userRequestId = userRequestId.replace("/userrequests/", "");
        }

        console.log("✅ Using cleaned userrequests doc ID:", userRequestId);

        if (!userRequestId) {
            console.error("❌ Missing userrequests ID in selectedApprovedRequest");
            alert("Missing request ID. Cannot approve the request.");
            return;
        }

        if (!comment.trim()) {
            alert("Please enter a comment before approving.");
            return;
        }

        try {
            const userId = localStorage.getItem("userId");
            const userName = localStorage.getItem("userName");

            const requestDocRef = doc(db, "userrequests", userRequestId);
            const requestDocSnap = await getDoc(requestDocRef);

            if (!requestDocSnap.exists()) {
            console.error(`❌ Request document not found at userrequests/${userRequestId}`);
            alert("Request not found. It may have been deleted.");
            return;
            }

            await updateDoc(requestDocRef, {
            deanStatus: "Approved by Dean",
            deanComment: comment.trim(),
            approvalRequested: false,
            });

            
            const approvalDoc = await getApprovalRequestDocByInternalId(userRequestId);
            if (approvalDoc?.docId) {
              await deleteDoc(doc(db, "approvalrequestcollection", approvalDoc.docId));
              console.log("✅ Removed from approvalrequestcollection");
            }

            await logRequestOrReturn(userId, userName, "Approved Request");

            console.log("✅ userrequests document updated successfully.");
            setIsApprovedModalVisible(false);
            setSelectedApprovedRequest(null);
            setComment("");

        } catch (error) {
            console.error("❌ Error updating userrequests document:", error);
            alert("Something went wrong while approving the request.");
        }
    };

  return (
    <Modal
      title={
        <div style={{ background: "#389e0d", padding: "12px", color: "#fff" }}>
          <Text strong>Request Details</Text>
        </div>
      }
      open={isApprovedModalVisible}
      onCancel={() => {
        setIsApprovedModalVisible(false);
        setSelectedApprovedRequest(null);
      }}
      width={800}
      zIndex={1024}
      footer={[
        <Button key="reject" danger onClick={handleReject}>
        Reject
        </Button>,
        <Button key="approve" type="primary" onClick={handleApprove}>
        Approve
        </Button>,
      ]}
    >
      {selectedApprovedRequest && (
        <div style={{ padding: "20px" }}>   
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong>Name:</Text> {selectedApprovedRequest.userName || "N/A"}<br />
              <Text strong>Names:</Text> {selectedApprovedRequest.firestoreId || "N/A"}<br />
              <Text strong>Request Date:</Text>{" "}
              {selectedApprovedRequest?.timestamp
                ? formatDate(selectedApprovedRequest.timestamp)
                : "N/A"}
              <br />
              <Text strong>Required Date:</Text> {selectedApprovedRequest.dateRequired || "N/A"}<br />
              <Text strong>Time Needed:</Text> {selectedApprovedRequest.timeFrom || "N/A"} - {selectedApprovedRequest.timeTo || "N/A"}
            </Col>
            <Col span={12}>
              <Text strong>Reason of Request:</Text>
              <p style={{ fontSize: "12px", marginTop: 5 }}>{selectedApprovedRequest.reason || "N/A"}</p>
              <Text strong>Room:</Text> {selectedApprovedRequest.room || "N/A"}<br />
              <Text strong>Course Code:</Text> {selectedApprovedRequest.course || "N/A"}<br />
              <Text strong>Course Description:</Text> {selectedApprovedRequest.courseDescription || "N/A"}<br />
              <Text strong>Program:</Text> {selectedApprovedRequest.program || "N/A"}
            </Col>
          </Row>

          <Title level={5} style={{ marginTop: 20 }}>Requested Items:</Title>
          <Table
            dataSource={requestList.map((item, index) => ({
              ...item,
              key: item.itemIdFromInventory || `item-${index}`,
              conditionSummary: getConditionSummary(item.conditions),
            }))}
            columns={approvedRequestColumns}
            rowKey="key"
            pagination={false}
            bordered
          />
        </div>
      )}

        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col span={24}>
                <Title level={5}>Comments</Title>
                <Input.TextArea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Enter comments or additional notes here..."
                />
            </Col>
        </Row>

    </Modal>
  );
};

export default ApprovalRequestModal;
