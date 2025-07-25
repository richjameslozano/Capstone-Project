import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, View, TouchableOpacity, Text, Pressable, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider, Avatar, Title} from 'react-native-paper'; 
import { NavigationContainer, useIsFocused } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './components/contexts/AuthContext';
import { RequestListProvider } from './components/contexts/RequestListContext';
import { useAuth } from './components/contexts/AuthContext';  
import { db } from './backend/firebase/FirebaseConfig';
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import Icon from 'react-native-vector-icons/Ionicons'; 
import Icon2 from 'react-native-vector-icons/MaterialCommunityIcons'
import { LogBox } from 'react-native';



import ActivityLogScreen from './components/admin/ActivityLogScreen';
import LoginScreen from './components/LoginScreen2';
import UserHome from './components/user/UserHome';
import CalendarScreen from './components/user/CalendarScreen';
import PolicyScreen from './components/PolicyScreen';
import ProfileScreen from './components/user/ProfileScreen';
import Admin2Dashboard from './components/admin/AdminDashboard';
import PendingRequestScreen from './components/admin/PendingRequestScreen';
import InventoryScreen from './components/InventoryScreen';
import CameraScreen from './components/admin/CameraScreen';
import OrdersScreen from './components/user/OrdersScreen';
import RequestListScreen from './components/user/RequestListScreen';
import RequestLogScreen from './components/user/RequestLogScreen';
import LogScreen from './components/admin/LogScreen';
import InventoryStocks from './components/admin/InventoryStocks';
import SearchItems from './components/user/SearchItems';
import UserActivityLogScreen from './components/user/UserActivityLogScreen';
import BorrowCatalogScreen from './components/admin/BorrowCatalogScreen';
import { RequestMetadataProvider } from './components/contexts/RequestMetadataContext';
import CapexRequestScreen from './components/user/CapexRequestScreen';
import CapexRequestList from './components/admin/CapexListScreen';
import ReturnItems from './components/user/ReturnItems';
import LoginScreen2 from './components/LoginScreen2';
import RequestedItemsScreen from './components/admin/RequestedItemsScreen';
import RequestorListScreen from './components/admin/RequestorListScreen';
import ItemListScreen from './components/admin/ItemListScreen';
import CameraShowItems from './components/admin/CameraShowItems';
import QRScanScreen from './components/admin/QRScanScreen';
import CameraUpdateItems from './components/admin/CameraUpdateItems';
import LabTechHome from './components/admin/LabTechHome';
import Notifications from './components/Notifications';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();


LogBox.ignoreLogs([
  'Support for defaultProps will be removed from function components'
]);

const capitalizeName = (name) => {
  return name.replace(/\b\w/g, char => char.toUpperCase());
};

const getInitials = (name) => {
  if (!name) return '';
  const words = name.trim().split(' ');
  return words.length === 1
    ? words[0][0].toUpperCase()
    : (words[0][0] + words[1][0]).toUpperCase();
};

const CustomDrawerContent = ({ navigation }) => {
  const { user, logout } = useAuth();  
  const [profileImage, setProfileImage] = useState(null);
  const isFocused = useIsFocused();

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

  useEffect(() => {
    if (isFocused) {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('transparent');
    }
  }, [isFocused]);

  return (
    <View style={styles.drawerContent}>
        
        <View style={styles.upperSection}>
          <View style={styles.headProfile}>
          <TouchableOpacity style={styles.profileSection} onPress={() => navigation.navigate('ProfileScreen')}>
            <View style={styles.avatarBorder}>
          {profileImage ? (
            
            <Avatar.Image size={70} source={{ uri: profileImage }} />
            
          ) : (
              <Avatar.Text size={70} backgroundColor='#a3cae9' label={getInitials(user?.name)} />
            )}
            </View>
          </TouchableOpacity>
          </View>
        
          <View>
            <Text style={styles.profileName}>
              {user ? capitalizeName(user.name) : 'Guest'}
            </Text>
            <Text style={{fontSize: 13, color: '#dceaf2', marginTop: 0}}>{user ? user.jobTitle : 'Job Title'} of {user.department}</Text>    
        </View>
      </View>

      <View style={{paddingHorizontal: 15}}>
    <View style={{borderBottomWidth: 1, borderColor: '#dcdcdc', paddingBottom: 5, marginBottom: 5}}>
      <TouchableOpacity onPress={() => navigation.navigate('UserHome')} style={styles.drawerItem}>
      <Icon2 name="view-dashboard-outline" size={25} style={styles.icon} />
      <Title style={styles.titleStyle}>Home</Title>
      </TouchableOpacity>

      <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate('ProfileScreen')} activeOpacity={0.5}>
        <Icon2 name="account-circle-outline" size={25} style={styles.icon} />
        <Title style={styles.titleStyle}>My Account</Title>
      </TouchableOpacity>
    </View>

      <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate('InventoryScreen')}>
        <Icon2 name="clipboard-list-outline" size={25} style={styles.icon} />
        <Title style={styles.titleStyle}>Requisition</Title>
      </TouchableOpacity>

      <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate('SearchItems')}>
        <Icon2 name="magnify" size={25} style={styles.icon} />
        <Title style={styles.titleStyle}>Search Items</Title>
      </TouchableOpacity>

      <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate('OrdersScreen')}>
        <Icon2 name="history" size={25} style={styles.icon} />
        <Title style={styles.titleStyle}>Orders</Title>
      </TouchableOpacity>

      <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate('UserActivityLogScreen')}>
        <Icon2 name="chart-timeline-variant" size={25} style={styles.icon} />
        <Title style={styles.titleStyle}>Activity Log</Title>
      </TouchableOpacity>

      <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate('Notifications')} activeOpacity={0.5}>
        <Icon2 name="account-circle-outline" size={25} style={styles.icon} />
        <Title style={styles.titleStyle}>Notifications</Title>
      </TouchableOpacity>

      <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate('CapexRequestScreen')}>
        <Icon2 name="cash-multiple" size={25} style={styles.icon} />
        <Title style={styles.titleStyle}>Capex Request</Title>
      </TouchableOpacity>
      </View>
    </View>

  );
};

const CustomAdminDrawerContent = ({ navigation }) => {
  const { user, logout } = useAuth();  
  const [profileImage, setProfileImage] = useState(null);
  const isFocused = useIsFocused();

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

   useEffect(() => {
    if (isFocused) {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('transparent');
    }
  }, [isFocused]);

  return (
    
    <View style={styles.drawerContent}>

      <View style={styles.upperSection}>
          <View style={styles.headProfile}>
          <TouchableOpacity style={styles.profileSection} onPress={() => navigation.navigate('ProfileScreen')}>
            <View style={styles.avatarBorder}>
          {profileImage ? (
            
            <Avatar.Image size={70} source={{ uri: profileImage }} />
            
          ) : (
              <Avatar.Text size={70} backgroundColor='#a3cae9' label={getInitials(user?.name)} />
            )}
            </View>
          </TouchableOpacity>
          </View>

            <View>
            <Text style={styles.profileName}>
              {user ? capitalizeName(user.name) : 'Guest'}
            </Text>
            <Text style={{fontSize: 13, color: '#dceaf2', marginTop: 0}}>{user ? user.jobTitle : 'Job Title'} of {user.department}</Text>    
        </View>
      </View>

<View style={{paddingHorizontal: 15}}>
    <View style={{borderBottomWidth: 1, borderColor: '#dcdcdc', paddingBottom: 5, marginBottom: 5}}>
      <TouchableOpacity onPress={() => navigation.navigate('Admin2Dashboard')} style={styles.drawerItem}>
      <Icon2 name="view-dashboard-outline" size={25} style={styles.icon} />
      <Title style={styles.titleStyle}>Home</Title>
      </TouchableOpacity>

      <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate('ProfileScreen')} activeOpacity={0.5}>
        <Icon2 name="account-circle-outline" size={25} style={styles.icon} />
        <Title style={styles.titleStyle}>My Account</Title>
      </TouchableOpacity>
    </View>

      <TouchableOpacity onPress={() => navigation.navigate('InventoryStocks')} style={styles.drawerItem}>
        <Icon2 name="package-variant" size={25} style={styles.icon} />
        <Title style={styles.titleStyle}>View Inventory</Title>
      </TouchableOpacity>   

      <TouchableOpacity onPress={() => navigation.navigate('RequestLogScreen')} style={styles.drawerItem}>
        <Icon2 name="book-outline" size={25} style={styles.icon} />
        <Title style={styles.titleStyle}>Request Log</Title>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('BorrowCatalogScreen')} style={styles.drawerItem}>
        <Icon2 name="hand-extended-outline" size={25} style={styles.icon} />
        <Title style={styles.titleStyle}>Borrow Catalog</Title>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('CapexRequestListScreen')} style={styles.drawerItem}>
        <Icon2 name="cash-multiple" size={25} style={styles.icon} />
        <Title style={styles.titleStyle}>Capex Request List</Title>
      </TouchableOpacity>

      <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate('Notifications')} activeOpacity={0.5}>
        <Icon2 name="account-circle-outline" size={25} style={styles.icon} />
        <Title style={styles.titleStyle}>Notifications</Title>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('ActivityLogScreen')} style={styles.drawerItem}>
        <Icon2 name="chart-timeline-variant" size={25} style={styles.icon} />
        <Title style={styles.titleStyle}>Activity Log</Title>
      </TouchableOpacity>
</View>
    </View>
  );
};





const CustomSuperUserDrawerContent = ({ navigation }) => {
  const { user, logout } = useAuth();  
  const [profileImage, setProfileImage] = useState(null);
  const isFocused = useIsFocused();

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

   useEffect(() => {
    if (isFocused) {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('transparent');
    }
  }, [isFocused]);

  return (
    
    <View style={styles.drawerContent}>

      <View style={styles.upperSection}>
          <View style={styles.headProfile}>
          <TouchableOpacity style={styles.profileSection} onPress={() => navigation.navigate('ProfileScreen')}>
            <View style={styles.avatarBorder}>
          {profileImage ? (
            
            <Avatar.Image size={70} source={{ uri: profileImage }} />
            
          ) : (
              <Avatar.Text size={70} backgroundColor='#a3cae9' label={getInitials(user?.name)} />
            )}
            </View>
          </TouchableOpacity>
          </View>

            <View>
            <Text style={styles.profileName}>
              {user ? capitalizeName(user.name) : 'Guest'}
            </Text>
            <Text style={{fontSize: 13, color: '#dceaf2', marginTop: 0}}>{user ? user.jobTitle : 'Job Title'}</Text>    
        </View>
      </View>

      <View style={{paddingHorizontal: 15}}>
         <View style={{borderBottomWidth: 1, borderColor: '#dcdcdc', paddingBottom: 5, marginBottom: 5}}>
      <TouchableOpacity onPress={() => navigation.navigate('LabTechHome')} style={styles.drawerItem}>
      <Icon2 name="view-dashboard-outline" size={25} style={styles.icon} />
      <Title style={styles.titleStyle}>Home</Title>
      </TouchableOpacity>

      <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate('ProfileScreen')} activeOpacity={0.5}>
        <Icon2 name="account-circle-outline" size={25} style={styles.icon} />
        <Title style={styles.titleStyle}>My Account</Title>
      </TouchableOpacity>
    </View>

      <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate('Notifications')} activeOpacity={0.5}>
        <Icon2 name="account-circle-outline" size={25} style={styles.icon} />
        <Title style={styles.titleStyle}>Notifications</Title>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('InventoryStocks')} style={styles.drawerItem}>
        <Icon2 name="package-variant" size={25} style={styles.icon} />
        <Title style={styles.titleStyle}>Inventory</Title>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('RequestLogScreen')} style={styles.drawerItem}>
        <Icon2 name="book-outline" size={25} style={styles.icon} />
        <Title style={styles.titleStyle}>Request Log</Title>
      </TouchableOpacity>


      <TouchableOpacity onPress={() => navigation.navigate('BorrowCatalogScreen')} style={styles.drawerItem}>
        <Icon2 name="hand-extended-outline" size={25} style={styles.icon} />
        <Title style={styles.titleStyle}>Borrow Catalog</Title>
      </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('ActivityLogScreen')} style={styles.drawerItem}>
        <Icon2 name="chart-timeline-variant" size={25} style={styles.icon} />
        <Title style={styles.titleStyle}>Activity Log</Title>
      </TouchableOpacity>
</View>

    </View>
  );
};

function UserDrawer() {
  return (
    <Drawer.Navigator
    
      initialRouteName="UserHome"
      screenOptions={{ headerShown: false }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="UserHome" component={UserHome} />
      <Drawer.Screen name="CalendarScreen" component={CalendarScreen} />
      <Drawer.Screen name="PolicyScreen" component={PolicyScreen} />
      <Drawer.Screen name="OrdersScreen" component={OrdersScreen} />
      <Drawer.Screen name="RequestListScreen" component={RequestListScreen} />
      <Drawer.Screen name="UserHistoryLogScreen" component={RequestLogScreen} />
      <Drawer.Screen name="SearchItems" component={SearchItems} />
      <Drawer.Screen name="UserActivityLogScreen" component={UserActivityLogScreen} />
      <Drawer.Screen name="InventoryScreen" component={InventoryScreen} />
      <Drawer.Screen name="CapexRequestScreen" component={CapexRequestScreen} />
      <Drawer.Screen name="ReturnItemsScreen" component={ReturnItems} />
      <Drawer.Screen name="ProfileScreen" component={ProfileScreen} />
      <Drawer.Screen name="Notifications" component={Notifications} />
    </Drawer.Navigator>
  );
}

const AdminDrawer = () => {
  return (
    <Drawer.Navigator
      initialRouteName="Admin2Dashboard"
      screenOptions={{ headerShown: false }}
      drawerContent={(props) => <CustomAdminDrawerContent {...props} />}
    >
      <Drawer.Screen name="Admin2Dashboard" component={Admin2Dashboard} />
      <Drawer.Screen name="PendingRequestScreen" component={PendingRequestScreen} />
      <Drawer.Screen name="InventoryScreen" component={InventoryScreen} />
      <Drawer.Screen name="CameraScreen" component={CameraScreen} />
      <Drawer.Screen name="RequestLogScreen" component={LogScreen} />
      <Drawer.Screen name="InventoryStocks" component={InventoryStocks} />
      <Drawer.Screen name="RequestListScreen" component={RequestListScreen} />
      <Drawer.Screen name="OrdersScreen" component={OrdersScreen} />
      <Drawer.Screen name="ActivityLogScreen" component={ActivityLogScreen} />
      <Drawer.Screen name="CalendarScreen" component={CalendarScreen} />
      <Drawer.Screen name="BorrowCatalogScreen" component={BorrowCatalogScreen} />
      <Drawer.Screen name="CapexRequestListScreen" component={CapexRequestList} />
      <Drawer.Screen name="ProfileScreen" component={ProfileScreen} />
      <Drawer.Screen name="RequestorListScreen" component={RequestorListScreen} />
      <Drawer.Screen name="RequestedItemsScreen" component={RequestedItemsScreen} />
      <Drawer.Screen name="ItemListScreen" component={ItemListScreen} />
      <Drawer.Screen name="CameraShowItems" component={CameraShowItems} />
      <Drawer.Screen name="QRScanScreen" component={QRScanScreen} />
      <Drawer.Screen name="CameraUpdateItems" component={CameraUpdateItems} />
      <Drawer.Screen name="ReturnItemsScreen" component={ReturnItems} />
      <Drawer.Screen name="Notifications" component={Notifications} />
    </Drawer.Navigator>
  );
};

const SuperUserDrawer = () => {
  return (
    <Drawer.Navigator
      initialRouteName="LabTechHome"
      screenOptions={{ headerShown: false }}
      drawerContent={(props) => <CustomSuperUserDrawerContent {...props} />}
    >
      <Drawer.Screen name="LabTechHome" component={LabTechHome} />
      <Drawer.Screen name="PendingRequestScreen" component={PendingRequestScreen} />
      <Drawer.Screen name="InventoryScreen" component={InventoryScreen} />
      <Drawer.Screen name="CameraScreen" component={CameraScreen} />
      <Drawer.Screen name="RequestLogScreen" component={LogScreen} />
      <Drawer.Screen name="InventoryStocks" component={InventoryStocks} />
      <Drawer.Screen name="RequestListScreen" component={RequestListScreen} />
      <Drawer.Screen name="OrdersScreen" component={OrdersScreen} />
      <Drawer.Screen name="ActivityLogScreen" component={ActivityLogScreen} />
      <Drawer.Screen name="CalendarScreen" component={CalendarScreen} />
      <Drawer.Screen name="BorrowCatalogScreen" component={BorrowCatalogScreen} />
      <Drawer.Screen name="ProfileScreen" component={ProfileScreen} />
      <Drawer.Screen name="RequestorListScreen" component={RequestorListScreen} />
      <Drawer.Screen name="RequestedItemsScreen" component={RequestedItemsScreen} />
      <Drawer.Screen name="ItemListScreen" component={ItemListScreen} />
      <Drawer.Screen name="CameraShowItems" component={CameraShowItems} />
      <Drawer.Screen name="QRScanScreen" component={QRScanScreen} />
      <Drawer.Screen name="CameraUpdateItems" component={CameraUpdateItems} />
      <Drawer.Screen name="Notifications" component={Notifications} />
    </Drawer.Navigator>
  );
};

export default function App() {
  return (
    <RequestMetadataProvider>
      <RequestListProvider>
        <AuthProvider>
          <SafeAreaView style={styles.safeArea}>
            <GestureHandlerRootView style={styles.container}>
              <PaperProvider>
                <NavigationContainer>
                  <Stack.Navigator>
                    <Stack.Screen name="Login" component={LoginScreen2} options={{ headerShown: false }} />
                    <Stack.Screen name="User" component={UserDrawer} options={{ headerShown: false }} />
                    <Stack.Screen name="Admin" component={AdminDrawer} options={{ headerShown: false }} />
                    <Stack.Screen name="Super-User" component={SuperUserDrawer} options={{ headerShown: false }} />
                    <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }}/>
                  </Stack.Navigator>
                </NavigationContainer>
              </PaperProvider>
            </GestureHandlerRootView>
          </SafeAreaView>
        </AuthProvider>
      </RequestListProvider>
    </RequestMetadataProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  container: {
    flex: 1,
  },

  drawerContent: {
    flex: 1,
    height: '100%',
    backgroundColor: 'white', 
    fontFamily: 'sans-serif'

  },  

  upperSection:{
    display: 'flex',
    backgroundColor: '#6e9fc1',
    height: 'auto',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    marginBottom: 15
  },

  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 'auto',
    maxWidth: 70,
    borderColor: 'white',

  },

  headProfile: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15, 
  },

  profileName: {
    marginTop:10,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 0
  },

  drawerItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
    paddingVertical: 5,
    color: '#333',
  },

  titleStyle: {
    fontSize: 15,
    fontWeight: 500,
    color: '#4b4b4b'
  },
  icon: {
    marginRight: 20,
    color: '#8c8c8c', 
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',

    padding: 15,
    backgroundColor: '#ffefef',

    marginBottom: 30,

  },

  logoutText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c0392b',
  },

  avatarBorder: {
  borderWidth: 3,
  borderColor: '#fff',
  borderRadius: 100, // make sure it's fully rounded
  padding: 2,         // optional spacing between border and avatar
},

});

