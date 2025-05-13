import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/userStyle/ProfileStyle';
import { useAuth } from '../contexts/AuthContext';  
import { PaperProvider, Avatar, Title} from 'react-native-paper'; 
import Header from '../Header';
import { addDoc, collection, serverTimestamp } from '@firebase/firestore';
import { db } from '../../backend/firebase/FirebaseConfig';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();  

  const capitalizeInitials = (name) =>
    name?.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());  

  const getInitials = (name) => {
    if (!name) return '';
    const words = name.trim().split(' ');
    return words.length === 1
      ? words[0][0].toUpperCase()
      : (words[0][0] + words[1][0]).toUpperCase();
  };  
    const [headerHeight, setHeaderHeight] = useState(0);
  const handleHeaderLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    setHeaderHeight(height);
  };
  return (
    <View style={[styles.container, {paddingTop: headerHeight+5}]}>
      <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle="dark-content" // or 'light-content' depending on your design
              />

      <View style={styles.profileHeader} onLayout={handleHeaderLayout}>
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
      <TouchableOpacity style={styles.profileImageContainer}>
        {user?.photoURL ? (
          <Avatar.Image size={80} source={{ uri: user.photoURL }} />
        ) : (
          <Avatar.Text size={80} label={getInitials(user?.name)} backgroundColor='#6e9fc1'/>
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
        <Text style={{fontSize: 15, fontWeight: 'light'  }}>{user?.email}</Text>
        <Text style={styles.label}>Email</Text>
        </View>
      </View>

      <View style={styles.info}>
        <Icon name='domain' size={20} color='#6e9fc1'/>
        <View>
        <Text style={{fontSize: 15, fontWeight: 'light'  }}>{user?.department}</Text>
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

     
      <TouchableOpacity style={{width: '100%', backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', paddingVertical: 15, backgroundColor: '#fff', borderRadius: 8, gap: 5}}
      onPress={() => {
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
      
                          } else {
                            console.warn("No user data available for logout log.");
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
              }}
      >
        <Icon name='logout' size={20} color='#6abce2'/>
        <Text style={{fontWeight: 'bold', fontSize: 15, color: '#6abce2'}}>Log Out</Text>
      </TouchableOpacity>
     
    
    </View>

  );
}