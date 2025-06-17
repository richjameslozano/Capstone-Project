import React from 'react';
import { View, Text, FlatList, SafeAreaView } from 'react-native';
import styles from './notificationStyles'; // Import external stylesheet

const notifications = [
  {
    id: '1',
    title: 'Request Approved',
    message: 'Your inventory request for "Microscopes" has been approved.',
    timestamp: 'June 17, 2025, 10:30 AM',
  },
  {
    id: '2',
    title: 'Low Stock Alert',
    message: 'The item "Ethanol 99%" is running low in stock.',
    timestamp: 'June 16, 2025, 2:15 PM',
  },
  {
    id: '3',
    title: 'System Update',
    message: 'A new version of the lab system is now live.',
    timestamp: 'June 15, 2025, 9:00 AM',
  },
];

const NotificationItem = ({ title, message, timestamp }) => (
  <View style={styles.notificationCard}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
    <Text style={styles.timestamp}>{timestamp}</Text>
  </View>
);

const Notifications = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Notifications</Text>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            title={item.title}
            message={item.message}
            timestamp={item.timestamp}
          />
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
};

export default Notifications;
