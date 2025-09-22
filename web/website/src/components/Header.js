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
// import React, { useEffect, useState } from "react";
// import {
//   Layout,
//   Avatar,
//   Button,
//   Badge,
//   Dropdown,
//   List,
//   Spin,
//   message,
// } from "antd";
// import {
//   UserOutlined,
//   MenuFoldOutlined,
//   MenuUnfoldOutlined,
//   BellOutlined,
// } from "@ant-design/icons";
// import { useNavigate, useLocation } from "react-router-dom";
// import { db } from "../backend/firebase/FirebaseConfig"; // adjust path to your firebase config
// import {
//   collection,
//   query,
//   where,
//   orderBy,
//   onSnapshot,
//   updateDoc,
//   doc,
//   getDocs,
// } from "firebase/firestore";
// import "./styles/Header.css";

// const { Header } = Layout;

// const AppHeader = ({ pageTitle, onToggleSidebar, isSidebarCollapsed }) => {
//   const navigate = useNavigate();
//   const location = useLocation();
  
//   const userId = localStorage.getItem("userId");
//   const role = localStorage.getItem("userPosition") || location.state?.role || "user"; // 🟢 FIXED

//   const [userName, setUserName] = useState("User");
//   const [jobTitle, setJobTitle] = useState("");
//   const [department, setDepartment] = useState("");
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 408);
//   const [notifications, setNotifications] = useState([]);
//   const [loadingNotifications, setLoadingNotifications] = useState(false);
//   const [visibleCount, setVisibleCount] = useState(5); 
//   const [profileImage, setProfileImage] = useState(null);

//   useEffect(() => {
//     const storedName = localStorage.getItem("userName");
//     const storedJobTitle = localStorage.getItem("userJobTitle");
//     const storedDepartment = localStorage.getItem("userDepartment");
//     if (storedName) setUserName(storedName);
//     if (storedJobTitle) setJobTitle(storedJobTitle);
//     if (storedDepartment) setDepartment(storedDepartment);

//     const handleResize = () => setIsMobile(window.innerWidth <= 408);
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   useEffect(() => {
//     const fetchProfileImage = async () => {
//       const userEmail = localStorage.getItem("userEmail");
//       if (!userEmail) return;

//       const q = query(collection(db, "accounts"), where("email", "==", userEmail));
//       const snapshot = await getDocs(q);

//       if (!snapshot.empty) {
//         const userData = snapshot.docs[0].data();
//         if (userData.profileImage) {
//           setProfileImage(userData.profileImage);
//         }
//       }
//     };

//     fetchProfileImage();
//   }, []);

//   useEffect(() => {
//     if (!userId || userId === "system") return;
//     setLoadingNotifications(true);

//     let unsubAll = () => {};
//     let unsubUser = () => {};

//     const fetchNotifications = () => {
//       const allNotifsQuery = query(collection(db, "allNotifications"), orderBy("timestamp", "desc"));
//       const userNotifsQuery = query(
//         collection(db, "accounts", userId, "userNotifications"),
//         orderBy("timestamp", "desc")
//       );

//       if (role === "super-user") {
//         // Listen to both global and user-specific notifications
//         unsubAll = onSnapshot(allNotifsQuery, (snapshot) => {
//           const all = snapshot.docs
//             .map((doc) => ({ id: doc.id, ...doc.data(), from: "all" }))
//             .filter((n) =>
//               !(
//                 n.type === "restock-request" &&
//                 typeof n.action === "string" &&
//                 n.action.startsWith("Restock request submitted by")
//               )
//             ); // Exclude restock submit notifs for super-user

//           setNotifications((prev) => {
//             const userNotifs = prev.filter((n) => n.from === "user");
//             return [...all, ...userNotifs].sort(
//               (a, b) => b.timestamp?.seconds - a.timestamp?.seconds
//             );
//           });

//           setLoadingNotifications(false);
//         });

//         unsubUser = onSnapshot(userNotifsQuery, (snapshot) => {
//           const user = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), from: "user" }));
//           setNotifications((prev) => {
//             const allNotifs = prev.filter((n) => n.from === "all");
//             return [...user, ...allNotifs].sort(
//               (a, b) => b.timestamp?.seconds - a.timestamp?.seconds
//             );
//           });

//           setLoadingNotifications(false);
//         });

//       } else if (role === "user") {
//         unsubUser = onSnapshot(userNotifsQuery, (snapshot) => {
//           const user = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
//           setNotifications(user);
//           setLoadingNotifications(false);
//         });
        
//       } else {
//         unsubAll = onSnapshot(allNotifsQuery, (snapshot) => {
//           const all = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
//           setNotifications(all);
//           setLoadingNotifications(false);
//         });
//       }
//     };

//     fetchNotifications();

//     return () => {
//       unsubAll();
//       unsubUser();
//     };
//   }, [userId, role]);

//   // const unreadCount = notifications.filter(n => !n.read).length;
//   // const unreadCount = notifications.filter(
//   //   (n) => !(n.readBy?.[userId])
//   // ).length;

//     const unreadCount = notifications.filter((n) => {
//       if (n.hasOwnProperty("read")) {
//         // personal notifications
//         return !n.read;
        
//       } else {
//         // global notifications
//         return !(n.readBy?.[userId] === true);
//       }
//     }).length;

//   // const handleNotificationClick = async (notif) => {
//   //   if (!userId || !notif.id) return;

//   //   try {
//   //     let notifDocRef;
//   //     if (role === "user") {
//   //       notifDocRef = doc(db, "accounts", userId, "userNotifications", notif.id);

//   //     } else {
//   //       notifDocRef = doc(db, "allNotifications", notif.id);
//   //     }
//   //     await updateDoc(notifDocRef, { read: true });

//   //   } catch (error) {
//   //     console.error("Failed to update notification:", error);
//   //   }

//   //   if (notif.link) {
//   //     navigate(notif.link);

//   //   } else {
//   //     message.info(notif.action || "Notification clicked");
//   //   }
//   // };

//   const handleNotificationClick = async (notif) => {
//     if (!userId || !notif.id) return;

//     try {
//       let notifDocRef;

//       if (notif.from === "user" || role === "user") {
//         // ✅ Personal notification
//         notifDocRef = doc(db, "accounts", userId, "userNotifications", notif.id);

//         if (!notif.read) {
//           await updateDoc(notifDocRef, { read: true });

//           // update local state
//           setNotifications((prev) =>
//             prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
//           );
//         }

//       } else {
//         // ✅ Global notification
//         notifDocRef = doc(db, "allNotifications", notif.id);

//         if (!notif.readBy || !notif.readBy[userId]) {
//           await updateDoc(notifDocRef, {
//             read: true, // 🔹 keep in sync with Firestore
//             [`readBy.${userId}`]: true,
//           });

//           // update local state
//           setNotifications((prev) =>
//             prev.map((n) =>
//               n.id === notif.id
//                 ? {
//                     ...n,
//                     read: true, // 🔹 mark as read locally too
//                     readBy: { ...(n.readBy || {}), [userId]: true },
//                   }
//                 : n
//             )
//           );
//         }
//       }
      
//     } catch (error) {
//       console.error("Failed to update notification:", error);
//     }

//     // --- Navigation logic ---
//     const actionText = notif.action?.toLowerCase() || "";

//     if (actionText.startsWith("new requisition submitted")) {
//       navigate("/main/pending-request");
//       return;
//     }

//     if (actionText.startsWith("approved request for")) {
//       navigate("/main/submitted-requisitions");
//       return;
//     }

//     if (notif.link) {
//       navigate(notif.link);

//     } else {
//       message.info(notif.action || "Notification clicked");
//     }
//   };

// const notificationMenu = (
//   <div
//     className="notification-dropdown"
//     style={{ maxHeight: 300, overflowY: "auto", width: 250 }}
//   >
//     {loadingNotifications ? (
//       <Spin size="small" />
//     ) : (
//       <List
//         size="small"
//         dataSource={notifications.slice(0, visibleCount)}
//         renderItem={(item) => (
//           <List.Item
//             style={{ cursor: "pointer" }}
//             onClick={() => handleNotificationClick(item)}
//           >
//             <div>
//               {(
//                 (item.hasOwnProperty("read") && !item.read) ||
//                 (!item.hasOwnProperty("read") && !(item.readBy?.[userId]))
//               ) && <span style={{ color: "red", marginRight: 4 }}>•</span>}
//               {item.action}
//             </div>
//           </List.Item>
//         )}
//       />
//     )}

//     {notifications.length > visibleCount && (
//       <div style={{ textAlign: "center", marginTop: 8 }}>
//         <Button type="link" onClick={() => setVisibleCount(visibleCount + 5)}>
//           Show More
//         </Button>
//       </div>
//     )}
//   </div>
// );

//   const goToProfile = () => navigate("/main/profile");

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

//       <div className="header-right">
//         {role !== "super-admin" && (
//           <>
//             <Dropdown overlay={notificationMenu} trigger={["click"]}>
//               <Badge count={unreadCount} offset={[0, 4]}>
//                 <Button icon={<BellOutlined />} shape="circle" />
//               </Badge>
//             </Dropdown>

//             <div
//               className={`user-profile ${isMobile ? "profile-mobile" : ""}`}
//               onClick={goToProfile}
//               style={{ marginLeft: 16 }}
//             >
//               {!isMobile && (
//                 <div className="user-info">
//                   <div className="user-name">
//                     Hi, {capitalizeName(userName)}!
//                   </div>
//                   <div className="user-title">
//                     {jobTitle} of {department}
//                   </div>
//                 </div>
//               )}
//              <Avatar src={profileImage}>
//                 {!profileImage &&
//                   (userName
//                     ? userName
//                         .split(" ")
//                         .map((n) => n[0])
//                         .join("")
//                         .toUpperCase()
//                     : <UserOutlined />)}
//               </Avatar>
//             </div>
//           </>
//         )}
//       </div>
//     </Header>
//   );
// };

// export default AppHeader;


// VERSION 3
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
  const role = localStorage.getItem("userPosition") || location.state?.role || "user"; // 🟢 FIXED

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
    
    // Listen for profile image updates from localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'profileImageUpdated') {
        // Force a re-fetch of the profile image
        const userEmail = localStorage.getItem("userEmail");
        if (userEmail) {
          const q = query(collection(db, "accounts"), where("email", "==", userEmail));
          getDocs(q).then(snapshot => {
            if (!snapshot.empty) {
              const userData = snapshot.docs[0].data();
              if (userData.profileImage) {
                const imageUrlWithCacheBuster = `${userData.profileImage}${userData.profileImage.includes('?') ? '&' : '?'}t=${Date.now()}`;
                setProfileImage(imageUrlWithCacheBuster);
              }
            }
          });
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener('storage', handleStorageChange);
    };
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
          // Add cache-busting parameter to force reload
          const imageUrlWithCacheBuster = `${userData.profileImage}${userData.profileImage.includes('?') ? '&' : '?'}t=${Date.now()}`;
          setProfileImage(imageUrlWithCacheBuster);
        }
      }
    };

    fetchProfileImage();

    // Set up real-time listener for profile image updates
    const userEmail = localStorage.getItem("userEmail");
    if (userEmail) {
      const q = query(collection(db, "accounts"), where("email", "==", userEmail));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data();
          if (userData.profileImage) {
            // Add cache-busting parameter to force reload
            const imageUrlWithCacheBuster = `${userData.profileImage}${userData.profileImage.includes('?') ? '&' : '?'}t=${Date.now()}`;
            setProfileImage(imageUrlWithCacheBuster);
          } else {
            setProfileImage(null);
          }
        }
      });

      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (!userId || userId === "system") return;
    setLoadingNotifications(true);

    let unsubAll = () => {};
    let unsubUser = () => {};

    const fetchNotifications = () => {
      const allNotifsQuery = query(collection(db, "allNotifications"), orderBy("timestamp", "desc"));
      const userNotifsQuery = query(
        collection(db, "accounts", userId, "userNotifications"),
        orderBy("timestamp", "desc")
      );

      if (role === "super-user") {
        // Listen to both global and user-specific notifications
        unsubAll = onSnapshot(allNotifsQuery, (snapshot) => {
          const all = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data(), from: "all" }))
            .filter((n) =>
              !(
                n.type === "restock-request" &&
                typeof n.action === "string" &&
                n.action.startsWith("Restock request submitted by")
              )
            ); // Exclude restock submit notifs for super-user

          setNotifications((prev) => {
            const userNotifs = prev.filter((n) => n.from === "user");
            return [...all, ...userNotifs].sort(
              (a, b) => b.timestamp?.seconds - a.timestamp?.seconds
            );
          });

          setLoadingNotifications(false);
        });

        unsubUser = onSnapshot(userNotifsQuery, (snapshot) => {
          const user = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), from: "user" }));
          setNotifications((prev) => {
            const allNotifs = prev.filter((n) => n.from === "all");
            return [...user, ...allNotifs].sort(
              (a, b) => b.timestamp?.seconds - a.timestamp?.seconds
            );
          });

          setLoadingNotifications(false);
        });

      } else if (role === "user") {
        unsubUser = onSnapshot(userNotifsQuery, (snapshot) => {
          const user = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setNotifications(user);
          setLoadingNotifications(false);
        });
        
      } else {
        unsubAll = onSnapshot(allNotifsQuery, (snapshot) => {
          const all = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setNotifications(all);
          setLoadingNotifications(false);
        });
      }
    };

    fetchNotifications();

    return () => {
      unsubAll();
      unsubUser();
    };
  }, [userId, role]);

  // const unreadCount = notifications.filter(n => !n.read).length;
  // const unreadCount = notifications.filter(
  //   (n) => !(n.readBy?.[userId])
  // ).length;

    const unreadCount = notifications.filter((n) => {
      if (n.hasOwnProperty("read")) {
        // personal notifications
        return !n.read;
        
      } else {
        // global notifications
        return !(n.readBy?.[userId] === true);
      }
    }).length;

  // const handleNotificationClick = async (notif) => {
  //   if (!userId || !notif.id) return;

  //   try {
  //     let notifDocRef;
  //     if (role === "user") {
  //       notifDocRef = doc(db, "accounts", userId, "userNotifications", notif.id);

  //     } else {
  //       notifDocRef = doc(db, "allNotifications", notif.id);
  //     }
  //     await updateDoc(notifDocRef, { read: true });

  //   } catch (error) {
  //     console.error("Failed to update notification:", error);
  //   }

  //   if (notif.link) {
  //     navigate(notif.link);

  //   } else {
  //     message.info(notif.action || "Notification clicked");
  //   }
  // };

  const handleNotificationClick = async (notif) => {
    if (!userId || !notif.id) return;

    try {
      let notifDocRef;

      if (notif.from === "user" || role === "user") {
        // ✅ Personal notification
        notifDocRef = doc(db, "accounts", userId, "userNotifications", notif.id);

        if (!notif.read) {
          await updateDoc(notifDocRef, { read: true });

          // update local state
          setNotifications((prev) =>
            prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
          );
        }

      } else {
        // ✅ Global notification
        notifDocRef = doc(db, "allNotifications", notif.id);

        if (!notif.readBy || !notif.readBy[userId]) {
          await updateDoc(notifDocRef, {
            read: true, // 🔹 keep in sync with Firestore
            [`readBy.${userId}`]: true,
          });

          // update local state
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notif.id
                ? {
                    ...n,
                    read: true, // 🔹 mark as read locally too
                    readBy: { ...(n.readBy || {}), [userId]: true },
                  }
                : n
            )
          );
        }
      }
      
    } catch (error) {
      console.error("Failed to update notification:", error);
    }

    // --- Navigation logic ---
    const actionText = notif.action?.toLowerCase() || "";

    if (actionText.startsWith("new requisition submitted")) {
      navigate("/main/pending-request");
      return;
    }

    if (actionText.startsWith("approved request for")) {
      navigate("/main/submitted-requisitions");
      return;
    }

    if (notif.link) {
      navigate(notif.link);

    } else {
      message.info(notif.action || "Notification clicked");
    }
  };

const notificationMenu = (
  <div
    className="notification-dropdown"
    style={{ maxHeight: 300, overflowY: "auto", width: 250 }}
  >
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
              {(
                (item.hasOwnProperty("read") && !item.read) ||
                (!item.hasOwnProperty("read") && !(item.readBy?.[userId]))
              ) && <span style={{ color: "red", marginRight: 4 }}>•</span>}
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

        <div className="title-wrapper">
        <h2 className={`header-title ${isMobile ? "title-mobile" : ""}`}
        style={{}}>
          {/* {pageTitle} */}
          National University Laboratory System <br></br>
        </h2>
        <p style={{color: 'gray', margin: 0}}>Mall of Asia</p>
        </div>
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
             <Avatar 
               src={profileImage}
               onError={() => {
                 console.log('Header: Image failed to load, falling back to initials');
                 setProfileImage(null);
               }}
             >
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
