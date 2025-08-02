// VERSION 1
// import React, { useEffect, useState } from 'react';
// import { View, Text, FlatList, SafeAreaView, ActivityIndicator } from 'react-native';
// import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
// import { db } from '../backend/firebase/FirebaseConfig';
// import styles from './styles/NotificationsStyle';
// import { useAuth } from './contexts/AuthContext';

// const NotificationItem = ({ title, message, timestamp }) => {
//   const formattedTime = timestamp?.toDate?.().toLocaleString?.() || 'No timestamp';
//   return (
//     <View style={styles.notificationCard}>
//       <Text style={styles.title}>{title}</Text>
//       <Text style={styles.message}>{message}</Text>
//       <Text style={styles.timestamp}>{formattedTime}</Text>
//     </View>
//   );
// };

// const Notifications = () => {
//   const { user } = useAuth(); // 👈 access the logged-in user from context
//   const userId = user?.id;
//   const role = user?.role?.toLowerCase() || 'user';

//   const [notifications, setNotifications] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!userId || userId === 'system') {
//       setLoading(false);
//       setNotifications([]);
//       return;
//     }

//     const notifRef =
//       role === 'user'
//         ? collection(db, 'accounts', userId, 'userNotifications')
//         : collection(db, 'allNotifications');

//     const q = query(notifRef, orderBy('timestamp', 'desc'));

//     const unsubscribe = onSnapshot(
//       q,
//       (snapshot) => {
//         const notifList = snapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));
//         setNotifications(notifList);
//         setLoading(false);
//       },
//       (error) => {
//         console.error('🔥 Firestore notification error:', error);
//         setLoading(false);
//       }
//     );

//     return () => unsubscribe();
//   }, [userId, role]);

//   return (
//     <SafeAreaView style={styles.container}>
//       <Text style={styles.header}>Notifications</Text>

//       {loading ? (
//         <ActivityIndicator size="large" color="#000" />
//       ) : (
//         <FlatList
//           data={notifications}
//           keyExtractor={(item) => item.id}
//           renderItem={({ item }) => (
//             <NotificationItem
//               title={item.title || 'New Submission'}
//               message={item.message || item.action || 'No Message'}
//               timestamp={item.timestamp}
//             />
//           )}
//           ListEmptyComponent={
//             <Text style={{ textAlign: 'center', marginTop: 20 }}>
//               No notifications found.
//             </Text>
//           }
//           contentContainerStyle={{ paddingBottom: 20 }}
//         />
//       )}
//     </SafeAreaView>
//   );
// };

// export default Notifications;


// VERSION 2
// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   SafeAreaView,
//   ActivityIndicator,
//   TouchableOpacity,
// } from 'react-native';
// import {
//   collection,
//   query,
//   orderBy,
//   onSnapshot,
//   doc,
//   updateDoc,
// } from 'firebase/firestore';
// import { db } from '../backend/firebase/FirebaseConfig';
// import styles from './styles/NotificationsStyle';
// import { useAuth } from './contexts/AuthContext';

// const NotificationItem = ({ title, message, timestamp, onPress, unread }) => {
//   const formattedTime = timestamp?.toDate?.().toLocaleString?.() || 'No timestamp';

//   return (
//     <TouchableOpacity onPress={onPress}>
//       <View style={[styles.notificationCard, unread && { backgroundColor: '#ffecec' }]}>
//         <Text style={[styles.title, unread && { fontWeight: 'bold' }]}>
//           {unread ? '• ' : ''}{title}
//         </Text>
//         <Text style={styles.message}>{message}</Text>
//         <Text style={styles.timestamp}>{formattedTime}</Text>
//       </View>
//     </TouchableOpacity>
//   );
// };

// const Notifications = () => {
//   const { user } = useAuth(); // 👈 access the logged-in user from context
//   const userId = user?.id;
//   const role = user?.role?.toLowerCase() || 'user';

//   const [notifications, setNotifications] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!userId || userId === 'system') {
//       setLoading(false);
//       setNotifications([]);
//       return;
//     }

//     const notifRef =
//       role === 'user'
//         ? collection(db, 'accounts', userId, 'userNotifications')
//         : collection(db, 'allNotifications');

//     const q = query(notifRef, orderBy('timestamp', 'desc'));

//     const unsubscribe = onSnapshot(
//       q,
//       (snapshot) => {
//         const notifList = snapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));
//         setNotifications(notifList);
//         setLoading(false);
//       },
//       (error) => {
//         console.error('🔥 Firestore notification error:', error);
//         setLoading(false);
//       }
//     );

//     return () => unsubscribe();
//   }, [userId, role]);

//   const handleMarkAsRead = async (notifId) => {
//     try {
//       if (!notifId || !userId) return;

//       if (role === 'user') {
//         await updateDoc(
//           doc(db, 'accounts', userId, 'userNotifications', notifId),
//           { [`readBy.${userId}`]: true }
//         );
//       } else {
//         await updateDoc(
//           doc(db, 'allNotifications', notifId),
//           { [`readBy.${userId}`]: true }
//         );
//       }
//     } catch (err) {
//       console.error('❌ Failed to mark notification as read:', err);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <Text style={styles.header}>Notifications</Text>

//       {loading ? (
//         <ActivityIndicator size="large" color="#000" />
//       ) : (
//         <FlatList
//           data={notifications}
//           keyExtractor={(item) => item.id}
//           renderItem={({ item }) => {
//             const unread = !item.readBy?.[userId];

//             return (
//               <NotificationItem
//                 title={item.title || 'New Submission'}
//                 message={item.message || item.action || 'No Message'}
//                 timestamp={item.timestamp}
//                 unread={unread}
//                 onPress={() => handleMarkAsRead(item.id)}
//               />
//             );
//           }}
//           ListEmptyComponent={
//             <Text style={{ textAlign: 'center', marginTop: 20 }}>
//               No notifications found.
//             </Text>
//           }
//           contentContainerStyle={{ paddingBottom: 20 }}
//         />
//       )}
//     </SafeAreaView>
//   );
// };

// export default Notifications;


// VERSION 3
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../backend/firebase/FirebaseConfig';
import styles from './styles/NotificationsStyle';
import { useAuth } from './contexts/AuthContext';

const NotificationItem = ({ title, message, timestamp, onPress, unread }) => {
  const formattedTime = timestamp?.toDate?.().toLocaleString?.() || 'No timestamp';

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={[styles.notificationCard, unread && { backgroundColor: '#ffecec' }]}>
        <Text style={[styles.title, unread && { fontWeight: 'bold' }]}>
          {unread ? '• ' : ''}{title}
        </Text>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.timestamp}>{formattedTime}</Text>
      </View>
    </TouchableOpacity>
  );
};

const Notifications = () => {
  const { user } = useAuth(); // Get user from auth context
  const userId = user?.id;
  const role = user?.role?.toLowerCase() || 'user';

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || userId === 'system') {
      setLoading(false);
      return;
    }

    setLoading(true);

    let unsubAll = () => {};
    let unsubUser = () => {};

    const fetchNotifications = () => {
      const allQuery = query(collection(db, 'allNotifications'), orderBy('timestamp', 'desc'));
      const userQuery = query(
        collection(db, 'accounts', userId, 'userNotifications'),
        orderBy('timestamp', 'desc')
      );

      if (role === 'super-user') {
        unsubAll = onSnapshot(allQuery, (snapshot) => {
          const all = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data(), from: 'all' }))
            .filter((n) =>
              !(
                n.type === 'restock-request' &&
                typeof n.action === 'string' &&
                n.action.startsWith('Restock request submitted by')
              )
            );

          setNotifications((prev) => {
            const userNotifs = prev.filter((n) => n.from === 'user');
            return [...all, ...userNotifs].sort(
              (a, b) => b.timestamp?.seconds - a.timestamp?.seconds
            );
          });

          setLoading(false);
        });

        unsubUser = onSnapshot(userQuery, (snapshot) => {
          const user = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), from: 'user' }));
          setNotifications((prev) => {
            const allNotifs = prev.filter((n) => n.from === 'all');
            return [...user, ...allNotifs].sort(
              (a, b) => b.timestamp?.seconds - a.timestamp?.seconds
            );
          });

          setLoading(false);
        });

      } else if (role === 'user') {
        unsubUser = onSnapshot(userQuery, (snapshot) => {
          const user = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setNotifications(user);
          setLoading(false);
        });

      } else {
        unsubAll = onSnapshot(allQuery, (snapshot) => {
          const all = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setNotifications(all);
          setLoading(false);
        });
      }
    };

    fetchNotifications();

    return () => {
      unsubAll();
      unsubUser();
    };
  }, [userId, role]);

  const handleMarkAsRead = async (notifId, from) => {
    if (!notifId || !userId) return;

    try {
      const notifDocRef =
        from === 'user'
          ? doc(db, 'accounts', userId, 'userNotifications', notifId)
          : doc(db, 'allNotifications', notifId);

      await updateDoc(notifDocRef, {
        [`readBy.${userId}`]: true,
      });

    } catch (err) {
      console.error('❌ Failed to mark notification as read:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Notifications</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const unread = !item.readBy?.[userId];
            return (
              <NotificationItem
                title={item.title || 'New Submission'}
                message={item.message || item.action || 'No Message'}
                timestamp={item.timestamp}
                unread={unread}
                onPress={() => handleMarkAsRead(item.id, item.from)}
              />
            );
          }}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 20 }}>
              No notifications found.
            </Text>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
};

export default Notifications;
