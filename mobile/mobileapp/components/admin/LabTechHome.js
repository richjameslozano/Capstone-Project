import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/adminStyle/AdminDashboardStyle';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { setStatusBarTranslucent } from 'expo-status-bar';

export default function LabTechHome({ navigation }) {
  const [isModalVisible, setModalVisible] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

const handleHeaderLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    setHeaderHeight(height);
  };
    

  
useFocusEffect(
  useCallback(() => {
    StatusBar.setBarStyle('dark-content');
    StatusBar.setBackgroundColor('transparent'); // Android only
    StatusBar.setTranslucent(true)
  }, [])
);


  const menuItems = [
    // { title: 'Inventory', subtitle: 'Materials & Supplies', icon: 'clipboard-list', color: '#4CAF50', screen: 'InventoryStocks' },
//    { title: 'Requisition', subtitle: 'Request Items', icon: 'clipboard-list-outline', color: 'purple', screen: 'InventoryScreen' },
//    { title: 'My Orders', subtitle: 'Monitor Your Orders', icon: 'file-document-outline', screen: 'OrdersScreen', color: '#1A4572' }, 
    { title: 'Pending Requests', subtitle: 'View and Manage', icon: 'progress-clock', color: '#D32F2F', screen: 'PendingRequestScreen' },
    // { title: 'Activity Log', subtitle: 'History', icon: 'file-document-outline', screen: 'ActivityLogScreen', color: '#1A4572' }, 
    
    
    { title: 'QR Scanner', subtitle: 'Asset Monitoring', icon: 'qrcode-scan', color: '#FFC107', screen: 'QRScanScreen' }, 
    // { title: 'Borrow Catalog', subtitle: 'Asset Monitoring', icon: 'qrcode-scan', color: '#FFC107', screen: 'BorrowCatalogScreen' },
    // { title: 'Capex Request List', subtitle: 'Asset Monitoring', icon: 'qrcode-scan', color: '#FFC107', screen: 'CapexRequestListScreen' },
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate(item.screen)} 
    >
      <Icon name={item.icon} size={40} color={item.color} />
      <Text style={styles.cardTitle}>{item.title}</Text>
      {item.subtitle ? <Text style={styles.cardSubtitle}>{item.subtitle}</Text> : null}
    </TouchableOpacity>
  );



  return (
      <View style={[styles.container3]}>
          
       <View style={styles.dashboardHeader} onLayout={handleHeaderLayout}>
               <TouchableOpacity onPress={() => {
          if (navigation?.openDrawer) {
            navigation.openDrawer();

          } else {
            console.warn("Drawer navigation not available");
          }
        }} 
        >
                 <Icon name="menu" size={28} color="black" /> 
               </TouchableOpacity>
              <View>
                <Text style={{textAlign: 'center', fontWeight: 800, fontSize: 18, color: '#395a7f'}}>NU <Text style={{color: '#f4c430'}}>MOA</Text></Text>
                <Text style={{ fontWeight: 300, fontSize: 13}}>Laboratory System</Text>
              </View>

               <TouchableOpacity style={{padding: 2}}>
                 <Icon name="information-outline" size={24} color="#000" />
               </TouchableOpacity>
             </View>


        <View style={[styles.actionContainer, {marginTop: headerHeight}]}>
          <View style={{flexDirection: 'row', width: '100%', alignItems: 'center', gap: 5, borderBottomWidth: 1, paddingBottom: 5, borderColor: '#e9ecee', marginBottom: 8}}>
                    <Icon name='gesture-tap-button' size={20} color='#395a7f'/>
                    <Text style={{color: '#395a7f', fontSize: 12, fontWeight: 'bold'}}>Quick Actions</Text>

                  </View>
        <FlatList
          data={menuItems}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          numColumns={2}
        />
        </View>

      </View>
  );
}
