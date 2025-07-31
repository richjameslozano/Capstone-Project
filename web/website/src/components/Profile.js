import React, { useState, useEffect, useRef } from "react";
import {Layout,Card,Row,Col,Upload,Avatar,Button,Typography,message,} from "antd";
import {UserOutlined,UploadOutlined,IdcardOutlined, ApartmentOutlined, SolutionOutlined, MailOutlined } from "@ant-design/icons";
import {collection,query,where,getDocs,updateDoc} from "firebase/firestore";
import { db, storage } from "../backend/firebase/FirebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import "./styles/Profile.css";

const { Content } = Layout;
const { Title, Text } = Typography;

const Profile = () => {
  const [formData, setFormData] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [userDocRef, setUserDocRef] = useState(null);
  const fileInputRef = useRef();

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

          if (userData.profileImage) {
            
            setImageUrl(userData.profileImage);
          }

        } else {

        }

      } catch (error) {

      }
    };

    fetchUserData();
  }, []);

  const handleImageUpload = (file) => {
    if (!file) return;

    const storageRef = ref(storage, `profileImages/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

      },
      (error) => {

        message.error("Failed to upload image.");
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setImageUrl(downloadURL);

          if (userDocRef) {
            await updateDoc(userDocRef, { profileImage: downloadURL });
            message.success("Profile image updated successfully!");

            // 🔥 Reload the whole page after successful upload
            setTimeout(() => {
              window.location.reload();
            }, 1000); // 1 second delay for user to see the success message
          }
          
        } catch (error) {

          message.error("Failed to update profile image.");
        }
      }
    );
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
                    onChange={(info) => {
                      const file = info.file.originFileObj;
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    beforeUpload={() => false} 
                  >
                    {imageUrl ? (
                      <Avatar src={imageUrl} size={250} />
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
                      onClick={() => fileInputRef.current.click()}
                      style={{backgroundColor: 'transparent', color: '#2187ab', fontSize: 16}}
                    >
                      Change Photo
                    </text>

                    <Button
                    className="edit-btn"
                     style={{backgroundColor: '#2187ab', color: '#fff', fontSize: 16}}
                    >
                      Edit Profile
                      </Button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleImageUpload(file);
                          e.target.value = null; // reset input
                        }
                      }}
                    />
                  </div>

                  {/* <Text type="secondary">
                    {formData?.email || "No Email Available"}
                  </Text> */}

                
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
                    {formData.jobTitle || "N/A"}
                    <strong className="title">Employee ID</strong>
                    </p>
                  </div>
                  
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

