import React, { useState, useEffect, useRef } from "react";
import {Layout,Card,Row,Col,Upload,Avatar,Button,Typography,message,} from "antd";
import {UserOutlined,UploadOutlined} from "@ant-design/icons";
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
          console.error("No logged-in user found.");
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
          console.error("No user data found.");
        }

      } catch (error) {
        console.error("Error fetching user data:", error);
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
        console.log("Upload is " + progress + "% done");
      },
      (error) => {
        console.error("Error uploading image:", error);
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
          console.error("Error fetching download URL:", error);
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
        <Content className="profile-content">
          <Row justify="center" align="middle" style={{ width: "100%" }}>
            <Col xs={24} sm={18} md={12} lg={8}>
              <Card
                title="User Profile"
                bordered={false}
                style={{ width: "100%", maxWidth: "600px" }}
              >
                <div style={{ textAlign: "center", marginBottom: 20 }}>
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
                      <Avatar src={imageUrl} size={100} />
                    ) : (
                      <Avatar size={100}>
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

                  <div style={{ marginTop: 10 }}>
                    <Button
                      icon={<UploadOutlined />}
                      className="upload-btn"
                      onClick={() => fileInputRef.current.click()}
                    >
                      Change Profile Picture
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

                  <Title level={5} style={{ marginTop: 10 }}>
                    {formData?.name ? capitalizeName(formData.name) : "No Name Available"}
                  </Title>

                  <Text type="secondary">
                    {formData?.email || "No Email Available"}
                  </Text>
                </div>
              </Card>

              {formData && (
                <Card
                  title="Profile Summary"
                  style={{ marginTop: 20 }}
                  bordered={false}
                >
                  {/* {formData.profileImage && (
                    <Avatar
                      src={formData.profileImage}
                      size={100}
                      style={{ marginBottom: 10 }}
                    />
                  )} */}
                  <p>
                    <strong>Name:</strong>{" "}
                    {formData?.name ? capitalizeName(formData.name) : "No Name Available"}
                  </p>
                  <p>
                    <strong>Department:</strong> {formData.department || "N/A"}
                  </p>
                  <p>
                    <strong>Job Title:</strong> {formData.jobTitle || "N/A"}
                  </p>
                  <p>
                    <strong>Email:</strong> {formData.email || "N/A"}
                  </p>
                </Card>
              )}
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Profile;

