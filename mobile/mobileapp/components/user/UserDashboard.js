import React from 'react'; 
import { View, Text, TouchableOpacity, FlatList, Image, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/userStyle/UserDashboardStyle';
import Header from '../Header';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function UserDashboard({ navigation }) {
  const menuItems = [
    { title: 'Requisition', subtitle: 'Materials & Supplies', icon: 'clipboard-list', screen: 'InventoryScreen', color: '#4CAF50' },
    { title: 'History Log', subtitle: 'Records', icon: 'file-document-outline', screen: 'UserHistoryLogScreen', color: '#1A4572' }, 
    { title: 'Calendar', subtitle: 'Block the Date!', icon: 'calendar', screen: 'CalendarScreen', color: '#673AB7' }, 
    { title: 'Orders', subtitle: '', icon: 'clock-alert', screen: 'RequestScreen', color: '#A52A2A' }, 
    { title: 'Policies', subtitle: 'Rules & Regulations', icon: 'file-document', screen: 'PolicyScreen', color: '#7D284D' }, 
    { title: 'Search Items', subtitle: 'Materials', icon: 'file-document', screen: 'SearchItems', color: '#7D284D' }, 
    { title: 'Activity Log', subtitle: '???', icon: 'file-document', screen: 'UserActivityLogScreen', color: '#7D284D' }, 
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
    <View style={styles.container2}>
       <StatusBar style="light" backgroundColor="#1A4572" />
     <Header/>

      <FlatList
        data={menuItems}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        numColumns={2}
        contentContainerStyle={styles.grid}
        style={{marginTop: 60}}
      />
    </View>
  );
}
    