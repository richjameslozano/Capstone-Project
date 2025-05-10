import React, { useEffect, useState, useCallback } from "react";
import { Layout, Avatar, Button } from "antd";
import { UserOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../backend/firebase/FirebaseConfig";
import "./styles/Header.css";

const { Header } = Layout;

const AppHeader = ({ pageTitle, onToggleSidebar, isSidebarCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const role = location.state?.role || localStorage.getItem("role");
  const [userName, setUserName] = useState("User");
  const [jobTitle, setJobTitle] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 408);

  // ✅ Use callback for re-fetching user data
  const fetchUserData = useCallback(async () => {
    try {
      const userEmail = localStorage.getItem("userEmail");
      if (!userEmail) return;

      const q = query(collection(db, "accounts"), where("email", "==", userEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        if (userData.name) setUserName(userData.name);
        if (userData.jobTitle) setJobTitle(userData.jobTitle);
        if (userData.profileImage) setProfileImage(userData.profileImage);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }, []);

  useEffect(() => {
    fetchUserData();

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 408);
    };
    window.addEventListener("resize", handleResize);

    // ✅ Listen to custom event from profile update (same tab)
    const handleProfileUpdated = () => {
      fetchUserData();
    };
    window.addEventListener("profileImageUpdated", handleProfileUpdated);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("profileImageUpdated", handleProfileUpdated);
    };
  }, [fetchUserData]);

  const goToProfile = () => {
    navigate("/main/profile");
  };

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

      {role !== "super-admin" && (
        <div
          className={`user-profile ${isMobile ? "profile-mobile" : ""}`}
          onClick={goToProfile}
          style={{ cursor: "pointer" }}
        >
          {!isMobile && (
            <div className="user-info">
              <div className="user-name">Hi, {capitalizeName(userName)}!</div>
              <div className="user-title">{jobTitle}</div>
            </div>
          )}
          <Avatar src={profileImage || undefined}>
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
      )}
    </Header>
  );
};

export default AppHeader;
