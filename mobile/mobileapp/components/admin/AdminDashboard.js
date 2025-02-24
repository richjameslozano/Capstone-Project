import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/adminStyle/AdminDashboardStyle';
import DataAnalysisModal from './DataAnalysisModal';

export default function Admin2Dashboard({ navigation }) {
  const [isModalVisible, setModalVisible] = useState(false);

  const menuItems = [
    { title: 'Inventory', subtitle: 'Materials & Supplies', icon: 'clipboard-list', color: '#4CAF50', screen: 'InventoryScreen' },
    { title: 'Pending Requests', subtitle: 'View and Manage', icon: 'clock-alert', color: '#D32F2F', screen: 'PendingRequestScreen' },
    { title: 'Calendar', subtitle: 'Block the Date!', icon: 'calendar', color: '#673AB7', screen: 'CalendarScreen' },
    { title: 'QR Scanner', subtitle: 'Asset Monitoring', icon: 'qrcode-scan', color: '#FFC107', screen: 'Camera' },
    { title: 'Asset Finder', subtitle: 'Find Your Item', icon: 'magnify', color: '#455A64', screen: 'AssetFinder' },
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>

        <View style={styles.header}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} />
          <View style={styles.headerText}>
            <Text style={styles.title}>National University</Text>
            <Text style={styles.subtitle}>Laboratory System</Text>
          </View>

          <TouchableOpacity 
            style={styles.profileButton} 
            onPress={() => navigation.navigate('ProfileScreen')}
          >
            <Icon name="account-circle" size={35} color="white" />
          </TouchableOpacity>
        </View>

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
      </View>

      <DataAnalysisModal isVisible={isModalVisible} onClose={() => setModalVisible(false)} />
    </GestureHandlerRootView>
  );
}
