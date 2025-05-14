import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StatusBar, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/userStyle/ProfileStyle';
import { useAuth } from '../contexts/AuthContext';  
import { Avatar } from 'react-native-paper'; 
import { addDoc, collection, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@firebase/firestore';
import * as ImagePicker from 'expo-image-picker';


export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();  
  const [uploading, setUploading] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  const capitalizeInitials = (name) =>
    name?.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());  

  const getInitials = (name) => {
    if (!name) return '';
    const words = name.trim().split(' ');
    return words.length === 1
      ? words[0][0].toUpperCase()
      : (words[0][0] + words[1][0]).toUpperCase();
  };  

    const handleImagePick = async () => {
    try {
      // First, request permission to access the media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      // If permission is not granted, show alert and return
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photos to update your profile picture.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch the image picker with specific options
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Only allow images
        allowsEditing: true, // Allow image editing/cropping
        aspect: [1, 1], // Force square aspect ratio
        quality: 0.8, // Image quality (0-1)
        allowsMultipleSelection: false, // Only allow single image selection
        base64: false, // Don't include base64 data
      });

      // If user cancels the picker
      if (result.canceled) {
        console.log('User cancelled image picker');
        return;
      }

      // Check if we have a valid image result
      if (result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('Selected image URI:', imageUri);
        
        // Start the upload process
        await uploadImage(imageUri);
      } else {
        Alert.alert(
          'Error',
          'No image was selected. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      // Handle any errors that occur during the process
      console.error('Error in handleImagePick:', error);
      Alert.alert(
        'Error',
        'Failed to pick image. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };




  const uploadImage = async (uri) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `profileImages/${user.id}`);
      const response = await fetch(uri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      const userRef = doc(db, 'accounts', user.id);
      await updateDoc(userRef, {
        photoURL: downloadURL
      });

      user.photoURL = downloadURL;
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

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
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <View style={styles.profileHeader} onLayout={handleImagePick}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="keyboard-backspace" size={28} color="black" />
        </TouchableOpacity>
        <Text style={{textAlign: 'center', fontWeight: 800, fontSize: 16}}>My Account</Text>
        <TouchableOpacity style={{padding: 2}}>
          <Icon name="dots-vertical" size={24} color="#000" />
        </TouchableOpacity>
      </View>
  
      <View style={{ backgroundColor: 'white', borderRadius: 8, paddingTop: 8, paddingBottom: 20, paddingHorizontal: 10 }}>
        <View style={{flexDirection: 'row', width: '100%', alignItems: 'center', gap: 5, borderBottomWidth: 1, paddingBottom: 5, borderColor: '#e9ecee'}}>
          <Icon name='account-circle-outline' size={20} color='#6abce2'/>
          <Text style={{color: '#6abce2', fontSize: 12, fontWeight: 'bold'}}>Profile</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileImageContainer} 
          onPress={handleImagePick}
          disabled={uploading}
        >
          {user?.photoURL ? (
            <Avatar.Image size={80} source={{ uri: user.photoURL }} />
          ) : (
            <Avatar.Text size={80} label={getInitials(user?.name)} backgroundColor='#6e9fc1'/>
          )}
          {uploading && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </TouchableOpacity>
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
              <Text style={{fontSize: 15, fontWeight: 'light'}}>{user?.employeeId}</Text>
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