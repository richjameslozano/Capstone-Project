// import React from 'react';
// import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import styles from '../styles/userStyle/ProfileStyle';

// export default function ProfileScreen({ route, navigation }) {
//   const { userData } = route.params || {};

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
//           <Icon name="arrow-left" size={30} color="white" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Profile</Text>
//       </View>

//       <View style={styles.profileImageContainer}>
//         <Image 
//           source={require('../../assets/favicon.png')} 
//           style={styles.profileImage} 
//         />
//       </View>

//       <View style={styles.profileDetails}>
//         <Text style={styles.label}>Name</Text>
//         <TextInput 
//           style={styles.input} 
//           value={userData?.name || ''} 
//           editable={false} 
//         />

//         <Text style={styles.label}>Email</Text>
//         <TextInput 
//           style={styles.input} 
//           value={userData?.email || ''} 
//           editable={false}
//           keyboardType="email-address"
//         />

//         <Text style={styles.label}>Role</Text>
//         <TextInput 
//           style={styles.input} 
//           value={userData?.role || ''} 
//           editable={false}
//         />

//         <Text style={styles.label}>Department</Text>
//         <TextInput 
//           style={styles.input} 
//           value={userData?.department || ''} 
//           editable={false}
//         />
//       </View>

//       <TouchableOpacity style={styles.logoutButton} onPress={() => navigation.navigate('LoginScreen')}>
//         <Icon name="logout" size={24} color="white" />
//         <Text style={styles.logoutText}>Logout</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/userStyle/ProfileStyle';
import { useAuth } from '../contexts/AuthContext';  
import { Alert } from 'react-native';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();  

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.profileImageContainer}>
        <Image 
          source={require('../../assets/favicon.png')} 
          style={styles.profileImage} 
        />
      </View>

      <View style={styles.profileDetails}>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={user?.name || ''} editable={false} />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={user?.email || ''} editable={false} />

        <Text style={styles.label}>Department</Text>
        <TextInput style={styles.input} value={user?.department || ''} editable={false} />
      </View>

      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={() => {
          Alert.alert(
            "Logout Confirmation", 
            "Are you sure you want to log out?", 
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Logout", 
                style: "destructive", 
                onPress: () => {
                  logout();
                  navigation.replace('Login');
                }
              }
            ]
          );
        }}
      >
        <Icon name="logout" size={24} color="white" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

    </View>
  );
}
