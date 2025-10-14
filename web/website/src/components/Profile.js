import React, { useState, useEffect, useRef } from "react";
import {Layout,Upload,Avatar,Typography,message,} from "antd";
import {UserOutlined,IdcardOutlined, ApartmentOutlined, SolutionOutlined, MailOutlined } from "@ant-design/icons";
import {collection,query,where,getDocs,updateDoc} from "firebase/firestore";
import { db, storage, auth } from "../backend/firebase/FirebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import "./styles/Profile.css";

const { Content } = Layout;

const Profile = () => {
  const [formData, setFormData] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [userDocRef, setUserDocRef] = useState(null);
  const [warningCount, setWarningCount] = useState(0);
  const [violationCount, setViolationCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userEmail = localStorage.getItem("userEmail");

        if (!userEmail) {
          return;
        }

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
            // Add cache-busting parameter to force reload
            const imageUrlWithCacheBuster = `${userData.profileImage}${userData.profileImage.includes('?') ? '&' : '?'}t=${Date.now()}`;
            setImageUrl(imageUrlWithCacheBuster);
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
    if (!currentUser) {
      message.error("You must be logged in to upload images.");
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      message.error("File size must be less than 5MB.");
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      message.error("Please select a valid image file.");
      return;
    }

    setIsUploading(true);

    try {
      // Try different storage paths to find one that works
      const possiblePaths = [
        `profileImages/${currentUser.uid}_${Date.now()}.jpg`,
        `images/${currentUser.uid}_${Date.now()}.jpg`,
        `uploads/${currentUser.uid}_${Date.now()}.jpg`,
        `users/${currentUser.uid}/profile_${Date.now()}.jpg`
      ];

      let uploadSuccess = false;
      let downloadURL = null;

      for (const path of possiblePaths) {
        try {
          console.log(`Trying upload path: ${path}`);
          const storageRef = ref(storage, path);
          
          // Convert file to blob if needed
          let fileToUpload = file;
          if (file instanceof File) {
            fileToUpload = file;
          } else {
            // Convert to blob
            const response = await fetch(URL.createObjectURL(file));
            fileToUpload = await response.blob();
          }

          // Upload the file
          await uploadBytes(storageRef, fileToUpload);
          
          // Get download URL
          downloadURL = await getDownloadURL(storageRef);
          console.log(`✅ Upload successful with path: ${path}`);
          uploadSuccess = true;
          break;
          
        } catch (error) {
          console.log(`❌ Upload failed with path ${path}:`, error.message);
          continue;
        }
      }

      if (!uploadSuccess || !downloadURL) {
        throw new Error("All upload paths failed. Please check Firebase Storage rules.");
      }

      // Update user profile with the image URL
      if (userDocRef) {
        await updateDoc(userDocRef, { profileImage: downloadURL });
        message.success("Profile image updated successfully!");

        // Force re-render with new image URL
        const imageUrlWithCacheBuster = `${downloadURL}${downloadURL.includes('?') ? '&' : '?'}t=${Date.now()}`;
        setImageUrl(imageUrlWithCacheBuster);
        
        // Also update localStorage to ensure consistency
        localStorage.setItem('profileImageUpdated', Date.now().toString());
      }
      
    } catch (error) {
      console.error("Upload error:", error);
      
      // Handle specific Firebase Storage errors
      if (error.message.includes('unauthorized') || error.message.includes('403')) {
        message.error("You don't have permission to upload files. Please contact an administrator to check Firebase Storage rules.");
      } else if (error.message.includes('storage/unknown')) {
        message.error("An unknown error occurred during upload. Please try again.");
      } else {
        message.error(`Upload failed: ${error.message}`);
      }
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
                    disabled={!currentUser || isUploading}
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
                        if (!currentUser) {
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
                        cursor: (!currentUser || isUploading) ? 'not-allowed' : 'pointer',
                        opacity: (!currentUser || isUploading) ? 0.6 : 1
                      }}
                    >
                      {isUploading ? 'Uploading...' : 'Change Photo'}
                    </text>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      disabled={!currentUser || isUploading}
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

