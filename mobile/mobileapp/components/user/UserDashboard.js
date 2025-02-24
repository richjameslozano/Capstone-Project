import React from 'react'; 
import { View, Text, TouchableOpacity, FlatList, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/userStyle/UserDashboardStyle';

export default function UserDashboard({ navigation }) {
  const menuItems = [
    { title: 'Inventory', subtitle: 'Materials & Supplies', icon: 'clipboard-list', screen: 'InventoryScreen', color: '#4CAF50' },
    { title: 'Log', subtitle: 'History & Records', icon: 'file-document-outline', screen: 'RequestLogScreen', color: '#1A4572' }, 
    { title: 'Calendar', subtitle: 'Block the Date!', icon: 'calendar', screen: 'CalendarScreen', color: '#673AB7' }, 
    { title: 'Pending Requests', subtitle: '', icon: 'clock-alert', screen: 'RequestScreen', color: '#A52A2A' }, 
    { title: 'Policies', subtitle: 'Rules & Regulations', icon: 'file-document', screen: 'PolicyScreen', color: '#7D284D' }, 
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../../assets/icon.png')} 
          style={styles.logo} 
        />
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

      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('Admin2Dashboard')}
      >
        <Icon name="account-cog" size={40} color="#333" />
        <Text style={styles.cardTitle}>Admin Panel</Text>
      </TouchableOpacity>
    </View>
  );
}
    