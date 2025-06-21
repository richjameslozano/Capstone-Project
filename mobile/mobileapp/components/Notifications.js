import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, SafeAreaView } from 'react-native';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../backend/firebase/FirebaseConfig';
import styles from './notificationStyles';

const NotificationItem = ({ title, message, timestamp }) => (
  <View style={styles.notificationCard}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
    <Text style={styles.timestamp}>{timestamp}</Text>
  </View>
);

const Notifications = ({ userId, role = 'user' }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!userId || userId === "system") return;

    let notifRef;
    if (role === 'user') {
      notifRef = collection(db, 'accounts', userId, 'userNotifications');
    } else {
      notifRef = collection(db, 'allNotifications');
    }

    const q = query(notifRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toLocaleString() || '', // format Firestore timestamp
      }));
      setNotifications(notifList);
    });

    return () => unsubscribe();
  }, [userId, role]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Notifications</Text>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            title={item.title || 'No Title'}
            message={item.message || item.action || 'No Message'}
            timestamp={item.timestamp}
          />
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
};

export default Notifications;
