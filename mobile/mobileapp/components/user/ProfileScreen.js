import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StatusBar, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/userStyle/ProfileStyle';
import { useAuth } from '../contexts/AuthContext';  
import { Avatar } from 'react-native-paper'; 
import { addDoc, collection, serverTimestamp, doc, updateDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL,getStorage,uploadBytesResumable, uploadString } from 'firebase/storage';
import { db, storage } from '../../backend/firebase/FirebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();  
  const [uploading, setUploading] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        if (!user?.id) return;
        const userDoc = await getDocs(collection(db, "accounts"));
        const userData = userDoc.docs.find(doc => doc.id === user.id)?.data();
        if (userData?.profileImage) {
          setProfileImage(userData.profileImage);
        }

      } catch (error) {
        console.error("Error fetching profile image:", error);
      }
    };

    fetchProfileImage();
  }, [isFocused]);

  const capitalizeInitials = (name) =>
    name?.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());  

  const getInitials = (name) => {
    if (!name) return '';
    const words = name.trim().split(' ');
    return words.length === 1
      ? words[0][0].toUpperCase()
      : (words[0][0] + words[1][0]).toUpperCase();
  };  

  const handleHeaderLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    setHeaderHeight(height);
  };

  const handleImagePick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Permission denied!");
      return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

    if (!result.canceled) {
      const image = result.assets[0];
      const url = await uploadImage(image.uri);

      if (url && user?.id) {
        const userDocRef = doc(db, "accounts", user.id);
        await updateDoc(userDocRef, { profileImage: url });
      }

      setProfileImage(url); // Update local state
    }
  };

  const uploadImage = async (imageUri) => {
    try {
      const filename = `profileImages/${Date.now().toString()}.jpg`;

      const storageRef = ref(storage, filename);

      // Fetch the image URI and convert it to Blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload the Blob to Firebase Storage
      await uploadBytes(storageRef, blob);

      // Get the image URL after upload
      const url = await getDownloadURL(storageRef);
      return url;

    } catch (error) {
      console.error("❌ Upload failed:", error);
      alert("Upload failed: " + (error.message || "Unknown error"));
      return null;
    }
  };

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('transparent');
    }
  }, [isFocused]);

  const handleLogout = async () => {
    Alert.alert(
      "Logout Confirmation",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              if (user?.id) {
                await addDoc(collection(db, `accounts/${user.id}/activitylog`), {
                  action: "User Logged Out (Mobile)",
                  userName: user.name || "User",
                  timestamp: serverTimestamp(),
                });
              }
            } catch (error) {
              console.error("Error logging logout:", error);
            } finally {
              logout();
              navigation.replace("Login");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, {paddingTop: headerHeight+5}]}>

      <View style={styles.profileHeader} onLayout={handleHeaderLayout}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="keyboard-backspace" size={28} color="black" />
        </TouchableOpacity>
        <Text style={{textAlign: 'center', fontWeight: 800, fontSize: 16}}>My Account</Text>
        <TouchableOpacity style={{padding: 2}}>
          <Icon name="dots-vertical" size={24} color="#000" />
        </TouchableOpacity>
      </View>
  
      <View style={{ backgroundColor: 'white', borderRadius: 8, paddingTop: 8, paddingBottom: 20, paddingHorizontal: 10, alignItems: 'center' }}>
        <View style={{flexDirection: 'row', width: '100%', alignItems: 'center', gap: 5, borderBottomWidth: 1, paddingBottom: 5, borderColor: '#e9ecee'}}>
          <Icon name='account-circle-outline' size={20} color='#6abce2'/>
          <Text style={{color: '#6abce2', fontSize: 12, fontWeight: 'bold'}}>Profile</Text>
        </View>


        {/* <TouchableOpacity 
          style={styles.profileImageContainer} 
          onPress={handleImagePick}
          disabled={uploading}
        >
          {profileImage ? (
            <Avatar.Image size={80} source={{ uri: profileImage }} />
          ) : (
            <Avatar.Text size={80} label={getInitials(user?.name)} backgroundColor='#6e9fc1'/>
          )}

          {uploading && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </TouchableOpacity> */}

        <View style={styles.profileImageContainer}>
          {profileImage ? (
            <Avatar.Image size={80} source={{ uri: profileImage }} />
          ) : (
            <Avatar.Text
              size={80}
              label={getInitials(user?.name)}
              backgroundColor="#6e9fc1"
            />
          )}
        </View>

        <Text style={{textAlign: 'center', fontWeight: 800, fontSize: 19}}>{capitalizeInitials(user?.name)}</Text>
        <Text style={{textAlign: 'center', color: 'gray'}}>{user?.jobTitle}</Text>
      </View>
      
      <View style={styles.secondSection}>
        <View style={{flexDirection: 'row', width: '100%', alignItems: 'center', gap: 5, borderBottomWidth: 1, paddingBottom: 5, borderColor: '#e9ecee', marginBottom: 8}}>
          <Icon name='information-outline' size={20} color='#6abce2'/>
          <Text style={{color: '#6abce2', fontSize: 12, fontWeight: 'bold'}}>Info</Text>
        </View>

        <View style={{gap: 5}}>
          <View style={styles.info}>
            <Icon name='email-outline' size={20} color='#6e9fc1'/>
            <View>
              <Text style={{fontSize: 15, fontWeight: 'light'}}>{user?.email}</Text>
              <Text style={styles.label}>Email</Text>
            </View>
          </View>

          <View style={styles.info}>
            <Icon name='domain' size={20} color='#6e9fc1'/>
            <View>
              <Text style={{fontSize: 15, fontWeight: 'light'}}>{user?.department}</Text>
              <Text style={styles.label}>Department</Text>
            </View>
          </View>

      <View style={styles.info}>
        <Icon name='badge-account-outline' size={20} color='#6e9fc1'/>
        <View>
        <Text style={{fontSize: 15, fontWeight: 'light'  }}>{user?.employeeId}</Text>
        <Text style={styles.label}>Employee ID</Text>
        </View>
      </View>
      </View>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Icon name='logout' size={20} color='#6abce2'/>
        <Text style={{fontWeight: 'bold', fontSize: 15, color: '#6abce2'}}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}