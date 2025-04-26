import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/adminStyle/AdminDashboardStyle';
import DataAnalysisModal from './DataAnalysisModal';
import Header from '../Header';

export default function AdminDashboard({ navigation }) {
  const [isModalVisible, setModalVisible] = useState(false);

  const menuItems = [
    { title: 'Inventory', subtitle: 'Materials & Supplies', icon: 'clipboard-list', color: '#4CAF50', screen: 'InventoryStocks' },
    { title: 'Pending Requests', subtitle: 'View and Manage', icon: 'clock-alert', color: '#D32F2F', screen: 'PendingRequestScreen' },
    { title: 'Activity Log', subtitle: 'History', icon: 'file-document-outline', screen: 'ActivityLogScreen', color: '#1A4572' }, 
    { title: 'Request Log', subtitle: 'Records', icon: 'file-document-outline', screen: 'RequestLogScreen', color: '#1A4572' }, 
    { title: 'Calendar', subtitle: 'Block the Date!', icon: 'calendar', color: '#673AB7', screen: 'CalendarScreen' },
    { title: 'QR Scanner', subtitle: 'Asset Monitoring', icon: 'qrcode-scan', color: '#FFC107', screen: 'CameraScreen' },
    { title: 'Borrow Catalog', subtitle: 'Asset Monitoring', icon: 'qrcode-scan', color: '#FFC107', screen: 'BorrowCatalogScreen' },
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
      <View style={styles.container3}>
          <StatusBar style="light" backgroundColor="#1A4572" />
        <Header/>

        <FlatList
          data={menuItems}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          numColumns={2}
          contentContainerStyle={styles.grid}
        />

        <View style={{ alignItems: 'center', marginVertical: 10 }}>
          <TouchableOpacity 
            style={styles.bottomSheetTrigger} 
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.footerText}>📊 View Data Analysis</Text>
            <Icon name="chevron-up" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <DataAnalysisModal isVisible={isModalVisible} onClose={() => setModalVisible(false)} />
      </View>
  );
}
