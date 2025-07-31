// VERSION 1
// import React, { useEffect, useState, useCallback } from "react";
// import { Layout, Avatar, Button } from "antd";
// import { UserOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
// import { useNavigate, useLocation } from "react-router-dom";
// import { collection, query, where, getDocs } from "firebase/firestore";
// import { db } from "../backend/firebase/FirebaseConfig";
// import "./styles/Header.css";

// const { Header } = Layout;

// const AppHeader = ({ pageTitle, onToggleSidebar, isSidebarCollapsed }) => {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const role = location.state?.role || localStorage.getItem("role");
//   const [userName, setUserName] = useState("User");
//   const [jobTitle, setJobTitle] = useState("");
//   const [department, setDepartment] = useState("");
//   const [profileImage, setProfileImage] = useState(null);
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 408);

//   // ✅ Use callback for re-fetching user data
//   const fetchUserData = useCallback(async () => {
//     try {
//       const userEmail = localStorage.getItem("userEmail");
//       if (!userEmail) return;

//       const q = query(collection(db, "accounts"), where("email", "==", userEmail));
//       const querySnapshot = await getDocs(q);

//       if (!querySnapshot.empty) {
//         const userData = querySnapshot.docs[0].data();
//         if (userData.name) setUserName(userData.name);
//         if (userData.jobTitle) setJobTitle(userData.jobTitle);
//         if (userData.department) setDepartment(userData.department);
//         if (userData.profileImage) setProfileImage(userData.profileImage);
//       }
//     } catch (error) {
//     }
//   }, []);

//   useEffect(() => {
//     fetchUserData();

//     const handleResize = () => {
//       setIsMobile(window.innerWidth <= 408);
//     };
//     window.addEventListener("resize", handleResize);

//     // ✅ Listen to custom event from profile update (same tab)
//     const handleProfileUpdated = () => {
//       fetchUserData();
//     };
//     window.addEventListener("profileImageUpdated", handleProfileUpdated);

//     return () => {
//       window.removeEventListener("resize", handleResize);
//       window.removeEventListener("profileImageUpdated", handleProfileUpdated);
//     };
//   }, [fetchUserData]);

//   const goToProfile = () => {
//     navigate("/main/profile");
//   };

//   const capitalizeName = (name) =>
//     name?.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

//   return (
//     <Header className={`header ${isMobile ? "header-mobile" : ""}`}>
//       <div className="header-left">
//         <Button
//           type="text"
//           icon={isSidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
//           onClick={onToggleSidebar}
//           style={{ fontSize: "18px", marginRight: "16px" }}
//         />
//         <h2 className={`header-title ${isMobile ? "title-mobile" : ""}`}>
//           {pageTitle}
//         </h2>
//       </div>

//       {role !== "super-admin" && (
//         <div
//           className={`user-profile ${isMobile ? "profile-mobile" : ""}`}
//           onClick={goToProfile}
//           style={{ cursor: "pointer" }}
//         >
//           {!isMobile && (
//             <div className="user-info">
//               <div className="user-name">Hi, {capitalizeName(userName)}!</div>
//               <div className="user-title">{jobTitle} of {department}</div>
//             </div>
//           )}
//           <Avatar src={profileImage || undefined}>
//             {!profileImage &&
//               (userName
//                 ? userName
//                     .split(" ")
//                     .map((n) => n[0])
//                     .join("")
//                     .toUpperCase()
//                 : <UserOutlined />)}
//           </Avatar>
//         </div>
//       )}
//     </Header>
//   );
// };

// export default AppHeader;


// VERSION 2
import React, { useEffect, useState } from "react";
import {
  Layout,
  Avatar,
  Button,
  Badge,
  Dropdown,
  List,
  Spin,
  message,
} from "antd";
import {
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "../backend/firebase/FirebaseConfig"; // adjust path to your firebase config
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import "./styles/Header.css";

const { Header } = Layout;

const AppHeader = ({ pageTitle, onToggleSidebar, isSidebarCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("userPosition") || location.state?.role || "user";

  const [userName, setUserName] = useState("User");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 408);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5); 
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    const storedJobTitle = localStorage.getItem("userJobTitle");
    const storedDepartment = localStorage.getItem("userDepartment");
    if (storedName) setUserName(storedName);
    if (storedJobTitle) setJobTitle(storedJobTitle);
    if (storedDepartment) setDepartment(storedDepartment);

    const handleResize = () => setIsMobile(window.innerWidth <= 408);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchProfileImage = async () => {
      const userEmail = localStorage.getItem("userEmail");
      if (!userEmail) return;

      const q = query(collection(db, "accounts"), where("email", "==", userEmail));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        if (userData.profileImage) {
          setProfileImage(userData.profileImage);
        }
      }
    };

    fetchProfileImage();
  }, []);

  useEffect(() => {
    if (!userId || userId === "system") return;
    setLoadingNotifications(true);

    let notifRef;
    if (role === "user") {
      notifRef = collection(db, "accounts", userId, "userNotifications");

    } else {
      notifRef = collection(db, "allNotifications");
    }

    const q = query(notifRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // For user: only their own notifications
      // For admin/super-user: show everything (no filter by userId)
      const filtered = role === "user" ? items : items;

      setNotifications(filtered);
      setLoadingNotifications(false);
    });

    return () => unsubscribe();
  }, [userId, role]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = async (notif) => {
    if (!userId || !notif.id) return;

    try {
      let notifDocRef;
      if (role === "user") {
        notifDocRef = doc(db, "accounts", userId, "userNotifications", notif.id);
        
      } else {
        notifDocRef = doc(db, "allNotifications", notif.id);
      }

      await updateDoc(notifDocRef, { read: true });

    } catch (error) {
      console.error("Failed to update notification:", error);
    }

    if (notif.link) {
      navigate(notif.link);

    } else {
      message.info(notif.action || "Notification clicked");
    }
  };

  const notificationMenu = (
    <div className="notification-dropdown" style={{ maxHeight: 300, overflowY: "auto", width: 250 }}>
      {loadingNotifications ? (
        <Spin size="small" />
      ) : (
        <List
          size="small"
          dataSource={notifications.slice(0, visibleCount)}
          renderItem={(item) => (
            <List.Item
              style={{ cursor: "pointer" }}
              onClick={() => handleNotificationClick(item)}
            >
              <div>
                {!item.read && <span style={{ color: "red", marginRight: 4 }}>•</span>}
                {item.action}
              </div>
            </List.Item>
          )}
        />
      )}

      {notifications.length > visibleCount && (
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <Button type="link" onClick={() => setVisibleCount(visibleCount + 5)}>
            Show More
          </Button>
        </div>
      )}
    </div>
  );

  const goToProfile = () => navigate("/main/profile");

  const capitalizeName = (name) =>
    name?.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <Header className={`header ${isMobile ? "header-mobile" : ""}`}>
      <div className="header-left">
        <Button
          type="text"
          icon={isSidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleSidebar}
          style={{ fontSize: "18px", marginRight: "16px" }}
        />
        <h2 className={`header-title ${isMobile ? "title-mobile" : ""}`}>
          {pageTitle}
        </h2>
      </div>

      <div className="header-right">
        {role !== "super-admin" && (
          <>
            <Dropdown overlay={notificationMenu} trigger={["click"]}>
              <Badge count={unreadCount} offset={[0, 4]}>
                <Button icon={<BellOutlined />} shape="circle" />
              </Badge>
            </Dropdown>

            <div
              className={`user-profile ${isMobile ? "profile-mobile" : ""}`}
              onClick={goToProfile}
              style={{ marginLeft: 16 }}
            >
              {!isMobile && (
                <div className="user-info">
                  <div className="user-name">
                    Hi, {capitalizeName(userName)}!
                  </div>
                  <div className="user-title">
                    {jobTitle} of {department}
                  </div>
                </div>
              )}
                <Avatar src={profileImage}>
                  {!profileImage &&
                    (userName
                      ? userName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : <UserOutlined />)}
                </Avatar>
            </div>
          </>
        )}
      </div>
    </Header>
  );
};

export default AppHeader;
