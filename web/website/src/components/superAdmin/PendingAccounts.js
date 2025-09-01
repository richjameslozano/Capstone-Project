import React, { useState, useEffect } from "react";
import { Layout, Row, Col, Button, Typography, Space, Table, notification, Popconfirm } from "antd";
import { db } from "../../backend/firebase/FirebaseConfig"; 
import { collection, doc, deleteDoc, getDoc, onSnapshot } from "firebase/firestore";
import NotificationModal from "../customs/NotificationModal";

const { Content } = Layout;
const { Title } = Typography;

const PendingAccounts = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  useEffect(() => {
    const userRequestRef = collection(db, "pendingaccounts");

    const unsubscribe = onSnapshot(userRequestRef, (querySnapshot) => {
      const fetched = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();

        fetched.push({
          id: docSnap.id,
          userName: data.name,
          email: data.email,
          department: data.department,
          jobTitle: data.jobTitle,
          role: data.role,
          status: data.status,
          createdAt: data.createdAt ? data.createdAt.toDate().toLocaleDateString() : "N/A",
        });
      });

      setRequests(fetched);
    }, (error) => {
      console.error("Error fetching user requests:", error);
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  const sendEmailNotification = async ({ to, name, status }) => {
    const subject = status === "approved"
      ? "Account Approved - NU MOA ITSO"
      : "Account Registration Rejected";

    const text = status === "approved"
      ? `Hi ${name},\n\nYour account has been approved by the ITSO.\n\nYou may now log in to the system.`
      : `Hi ${name},\n\nWe regret to inform you that your account registration has been rejected.\n\nRegards,\nNU MOA ITSO Team`;

    const html = status === "approved"
      ? `<p>Hi ${name},</p><p>Your account has been <strong>approved</strong> by the ITSO.</p><p>You may now log in to the system.</p><p>Regards,<br>NU MOA ITSO Team</p>`
      : `<p>Hi ${name},</p><p>Your account registration has been <strong>rejected</strong>.</p><p>Regards,<br>NU MOA ITSO Team</p>`;

    try {
      await fetch("https://sendemail-guopzbbmca-uc.a.run.app", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to, subject, text, html }),
      });
    } catch (error) {

    }
  };

  const handleSelectChange = (selectedRowKeys) => {
    setSelectedRequests(selectedRowKeys); // Update selected rows
  };

  // FRONTEND
  //   const handleApprove = async () => {
  //   const auth = getAuth();

  //   try {
  //     await Promise.all(
  //       selectedRequests.map(async (requestId) => {
  //         const requestRef = doc(db, "pendingaccounts", requestId);
  //         const requestSnapshot = await getDoc(requestRef);
  //         const requestData = requestSnapshot.data();

  //         if (!requestData) {

  //           return;
  //         }

  //         // Check if user already exists in 'accounts' collection by email
  //         const accountsRef = collection(db, "accounts");
  //         const q = query(accountsRef, where("email", "==", requestData.email));
  //         const querySnapshot = await getDocs(q);
  //         if (!querySnapshot.empty) {

  //           return;
  //         }

  //         // Extract password before saving to 'accounts'
  //         const { password, ...restData } = requestData;

  //         // Create a Firestore doc in 'accounts' without password and UID for now
  //         const newAccountRef = doc(accountsRef); 
  //         await setDoc(newAccountRef, {
  //           ...restData,
  //           uid: "", // UID will be set after user registers password
  //           status: "approved",
  //           approvedAt: new Date(),
  //         });

  //         // Send email notification
  //         await sendEmailNotification({
  //           to: requestData.email,
  //           name: requestData.name,
  //           status: "approved",
  //         });

  //         // Remove the document from the 'pendingaccounts' collection
  //         await deleteDoc(requestRef);
  //       })
  //     );

  //     notification.success({
  //       message: "Requests Approved",
  //       description: "The selected account requests have been approved and moved to the accounts collection.",
  //     });

  //     setModalMessage("Account added successfully!");
  //     setIsNotificationVisible(true);

  //     // Remove approved requests from UI
  //     setRequests((prevRequests) =>
  //       prevRequests.filter((request) => !selectedRequests.includes(request.id))
  //     );
  //     setSelectedRequests([]); // Clear selected rows

  //   } catch (error) {

  //     notification.error({
  //       message: "Error",
  //       description: "Failed to approve the selected requests.",
  //     });
  //   }
  // };

  // BACKEND
   const handleApprove = async () => {
    setApproveLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      const userName = localStorage.getItem("userName") || "Admin";

      const response = await fetch("https://webnuls.onrender.com/account/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestIds: selectedRequests,
          userId,
          userName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        notification.error({
          message: "Error",
          description: data.error || "Failed to approve the selected requests.",
        });
        return;
      }

      notification.success({
        message: "Requests Approved",
        description: data.message || "Selected account requests have been approved.",
      });

      setModalMessage("Account(s) approved successfully!");
      setIsNotificationVisible(true);

      // Update UI
      setRequests(prev => prev.filter(req => !selectedRequests.includes(req.id)));
      setSelectedRequests([]);

    } catch (error) {
      console.error("Error approving request: ", error);
      notification.error({
        message: "Network Error",
        description: "Could not connect to the approval server.",
      });
    } finally {
      setApproveLoading(false);
    }
  };
  
  const handleReject = async () => {
    setRejectLoading(true);
    try {
      await Promise.all(
        selectedRequests.map(async (requestId) => {
          const requestRef = doc(db, "pendingaccounts", requestId);
          const requestSnapshot = await getDoc(requestRef);
          const requestData = requestSnapshot.data();

          // ✅ Send rejection email
          await sendEmailNotification({
            to: requestData.email,
            name: requestData.name,
            status: "rejected",
          });

          // Step 1: Remove the document from the 'pendingaccounts' collection
          await deleteDoc(requestRef); // Delete the document
        })
      );
  
      notification.success({
        message: "Requests Rejected",
        description: "The selected account requests have been rejected and removed from the pending list.",
      });
  
      // Remove the rejected requests from the UI
      setRequests((prevRequests) =>
        prevRequests.filter((request) => !selectedRequests.includes(request.id))
      );
  
      setSelectedRequests([]); // Clear selected 
      
    } catch (error) {

      notification.error({
        message: "Error",
        description: "Failed to reject the selected requests.",
      });
    } finally {
      setRejectLoading(false);
    }
  };  

  const columns = [
    {
      title: "User Name",
      dataIndex: "userName", 
    },   
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Department",
      dataIndex: "department",
    },
    {
      title: "Job Title",
      dataIndex: "jobTitle",
    },
    {
      title: "Role",
      dataIndex: "role",
    },
    {
      title: "Status",
      dataIndex: "status",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout>
        <Content style={{ margin: "20px" }}>
          <Row gutter={24}>
            <Col span={24}>
              <Title level={4}>List of Pending Accounts</Title>
              <Table
                rowKey="id"
                dataSource={requests}
                pagination={{ pageSize: 5 }}
                columns={columns}
                className="pending-accounts-table"
                rowSelection={{
                  type: "checkbox",
                  selectedRowKeys: selectedRequests,
                  onChange: handleSelectChange,
                }}
              />
              <Space>
                <Button
                  type="primary"
                  onClick={handleApprove}
                  loading={approveLoading}
                  disabled={selectedRequests.length === 0 || rejectLoading}
                    style={{
                        backgroundColor: selectedRequests.length > 0 ? '#45a049' : '', // green when enabled
                        borderColor: selectedRequests.length > 0 ? '#45a049' : '',
                        color:  selectedRequests.length > 0 ? '#fff': '',
                      }}
                >
                  Approve Selected
                </Button>

                <Popconfirm
                  title="Are you sure you want to reject the selected accounts?"
                  onConfirm={handleReject}
                  okText="Yes"
                  cancelText="No"
                  disabled={selectedRequests.length === 0}
                >
                  <Button
                    type="primary"
                    danger
                    loading={rejectLoading}
                    disabled={selectedRequests.length === 0 || approveLoading}
                  >
                    Reject Selected
                  </Button>
                </Popconfirm>
              </Space>
            </Col>
          </Row>
        </Content>

        <NotificationModal  
          isVisible={isNotificationVisible}
          onClose={() => setIsNotificationVisible(false)}
          message={modalMessage}/>

      </Layout>
    </Layout>
  );
};

export default PendingAccounts;
