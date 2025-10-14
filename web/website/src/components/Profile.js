import React, { useState, useEffect, useRef } from "react";
import {Layout,Upload,Avatar,Typography,message,} from "antd";
import {UserOutlined,IdcardOutlined, ApartmentOutlined, SolutionOutlined, MailOutlined } from "@ant-design/icons";
import {collection,query,where,getDocs,updateDoc} from "firebase/firestore";
import { db } from "../backend/firebase/FirebaseConfig";
import "./styles/Profile.css";

const { Content } = Layout;

const Profile = () => {
  const [formData, setFormData] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [userDocRef, setUserDocRef] = useState(null);
  const [warningCount, setWarningCount] = useState(0);
  const [violationCount, setViolationCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userEmail = localStorage.getItem("userEmail");

        if (!userEmail) {
          setIsAuthenticated(false);
          return;
        }

        setIsAuthenticated(true);

        const q = query(
          collection(db, "accounts"),
          where("email", "==", userEmail)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          setUserDocRef(userDoc.ref);
          setFormData(userData);
          
          // Set warning and violation counts from user data, default to 0 if not set
          setWarningCount(userData.warningCount || 0);
          setViolationCount(userData.violationCount || 0);

          if (userData.profileImage) {
            // For base64 data URIs, don't add cache-busting parameters
            setImageUrl(userData.profileImage);
          }

        } else {

        }

      } catch (error) {

      }
    };

    fetchUserData();
  }, []);

  const handleImageUpload = async (file) => {
    if (!file) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      message.error("You must be logged in to upload images.");
      return;
    }

    // Check file size (limit to 2MB for base64 storage)
    if (file.size > 2 * 1024 * 1024) {
      message.error("File size must be less than 2MB for profile images.");
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      message.error("Please select a valid image file.");
      return;
    }

    setIsUploading(true);

    try {
      // Convert image to base64 string for direct storage in Firestore
      const base64String = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      console.log("✅ Image converted to base64 successfully");

      // Update user profile with the base64 image
      if (userDocRef) {
        await updateDoc(userDocRef, { profileImage: base64String });
        message.success("Profile image updated successfully!");

        // Set the new base64 image URL directly
        setImageUrl(base64String);
        
        // Also update localStorage to ensure consistency
        localStorage.setItem('profileImageUpdated', Date.now().toString());
      }
      
    } catch (error) {
      console.error("Upload error:", error);
      message.error(`Failed to update profile image: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const capitalizeName = (name) => {
    return name
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <Layout>
      <Layout className="site-layout">
        <Content className="profile-content" style={{margin: 0}}>
              <div
                bordered={false}
                style={{ minWidth: '70%' ,width: "auto", backgroundColor: 'white', padding: 30, borderRadius: 10, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', gap: 10 }}
              >
                <h1 style={{fontWeight: 700, color: '#2187ab', fontSize: 25}}><UserOutlined style={{marginRight: 20}}/>User Profile</h1>
                <div className="container-two">

                
                <div style={{ textAlign: "center", justifyContent: 'center', alignItems: 'center', padding: 50, paddingBottom: 0}}>
                  <Upload
                    name="profileImage"
                    listType="picture"
                    showUploadList={false}
                    disabled={!isAuthenticated || isUploading}
                    onChange={(info) => {
                      const file = info.file.originFileObj;
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    beforeUpload={() => false} 
                  >
                    {imageUrl ? (
                      <Avatar 
                        src={imageUrl} 
                        size={250}
                        onError={() => {
                          console.log('Image failed to load, falling back to initials');
                          setImageUrl(null);
                        }}
                      />
                    ) : (
                      <Avatar size={250}>
                        {formData?.name
                          ? formData.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          : <UserOutlined />}
                      </Avatar>
                    )}
                  </Upload>

                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <p style={{ marginTop: 10, fontSize: 25, fontWeight: 600, marginBottom: 0
                     }}>
                    {formData?.name ? capitalizeName(formData.name) : "No Name Available"}
                    </p>
                    <text
                      className="upload-btn"
                      onClick={() => {
                        if (!isAuthenticated) {
                          message.error("You must be logged in to change your profile photo.");
                          return;
                        }
                        if (!isUploading) {
                          fileInputRef.current.click();
                        }
                      }}
                      style={{
                        backgroundColor: 'transparent', 
                        color: isUploading ? '#ccc' : '#2187ab', 
                        fontSize: 16,
                        cursor: (!isAuthenticated || isUploading) ? 'not-allowed' : 'pointer',
                        opacity: (!isAuthenticated || isUploading) ? 0.6 : 1
                      }}
                    >
                      {isUploading ? 'Uploading...' : 'Change Photo'}
                    </text>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      disabled={!isAuthenticated || isUploading}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleImageUpload(file);
                          e.target.value = null; // reset input
                        }
                      }}
                    />
                  </div>       
                </div>
 
                  {formData && (
                <div
                  className="title-container"
                >
                  <div className="info">
                    <UserOutlined className="profile-icon"/>
                    <p className="text-display">
                    {formData?.name ? capitalizeName(formData.name) : "No Name Available"}
                    <strong className="title">Name</strong>
                    </p>
                  </div>

                  <div className="info">
                    <MailOutlined className="profile-icon"/>
                    <p className="text-display">
                      {formData.email || "N/A"}
                      <strong className="title">Email</strong>
                    </p>
                  </div>

                  <div className="info">
                    <ApartmentOutlined className="profile-icon"/>
                    <p className="text-display">
                    {formData.department || "N/A"}
                    <strong className="title">Department</strong> 
                    </p>
                  </div>

                  <div className="info">
                    <SolutionOutlined className="profile-icon"/>
                    <p className="text-display">
                    {formData.jobTitle || "N/A"}
                    <strong className="title">Job Title</strong>
                    </p>
                  </div>
                  
                  <div className="info">
                    <IdcardOutlined className="profile-icon"/>
                    <p className="text-display">
                    {formData.employeeId || "N/A"}
                    <strong className="title">Employee ID</strong>
                    </p>
                  </div>

                  {(formData?.role === 'admin' || formData?.role === 'user') && (
                    <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
                      <div className="info" style={{ flex: 1 }}>
                        <UserOutlined className="profile-icon"/>
                        <p className="text-display">
                        {warningCount}
                        <strong className="title">Warning</strong>
                        </p>
                      </div>

                      <div className="info" style={{ flex: 1 }}>
                        <UserOutlined className="profile-icon"/>
                        <p className="text-display">
                        {violationCount}
                        <strong className="title">Violation</strong>
                        </p>
                      </div>
                    </div>
                  )}
                  
                </div>
              )}
                </div>
              </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Profile;

