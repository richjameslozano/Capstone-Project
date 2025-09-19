import messaging from '@react-native-firebase/messaging';
import { Platform, Alert } from 'react-native';
import { getFirestore, doc, setDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import * as Notifications from 'expo-notifications';

class FCMService {
  constructor() {
    this.unsubscribe = null;
    this.messageListener = null;
  }

  /**
   * Request permission for push notifications
   */
  async requestPermission() {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('FCM: Authorization status:', authStatus);
        return true;
      } else {
        console.log('FCM: Permission denied');
        return false;
      }
    } catch (error) {
      console.error('FCM: Error requesting permission:', error);
      return false;
    }
  }

  /**
   * Get FCM token and save to Firestore
   */
  async getToken(userId, userRole) {
    try {
      if (!userId) {
        console.log('FCM: No user ID provided');
        return null;
      }

      const token = await messaging().getToken();
      console.log('FCM: Token retrieved:', token);

      if (token) {
        // Save token to Firestore
        const db = getFirestore();
        await setDoc(doc(db, 'fcmTokens', userId), {
          token: token,
          userId: userId,
          role: userRole || 'User',
          platform: Platform.OS,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log('FCM: Token saved to Firestore for user:', userId);
        return token;
      }
    } catch (error) {
      console.error('FCM: Error getting token:', error);
      return null;
    }
  }

  /**
   * Update FCM token in Firestore
   */
  async updateToken(userId, newToken) {
    try {
      if (!userId || !newToken) return;

      const db = getFirestore();
      await updateDoc(doc(db, 'fcmTokens', userId), {
        token: newToken,
        updatedAt: new Date(),
      });

      console.log('FCM: Token updated for user:', userId);
    } catch (error) {
      console.error('FCM: Error updating token:', error);
    }
  }

  /**
   * Delete FCM token from Firestore
   */
  async deleteToken(userId) {
    try {
      if (!userId) return;

      const db = getFirestore();
      await updateDoc(doc(db, 'fcmTokens', userId), {
        token: null,
        deletedAt: new Date(),
      });

      console.log('FCM: Token deleted for user:', userId);
    } catch (error) {
      console.error('FCM: Error deleting token:', error);
    }
  }

  /**
   * Setup message listeners
   */
  setupMessageListeners() {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('FCM: Background message received:', remoteMessage);
      
      // You can handle background messages here
      // For example, update local storage or show local notification
    });

    // Handle foreground messages
    this.messageListener = messaging().onMessage(async (remoteMessage) => {
      console.log('FCM: Foreground message received:', remoteMessage);
      
      // Show alert for foreground messages
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || 'New Notification',
          remoteMessage.notification.body || 'You have a new message',
          [{ text: 'OK' }]
        );
      }
    });

    // Handle notification opened app
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('FCM: Notification opened app:', remoteMessage);
      
      // Handle navigation based on notification data
      this.handleNotificationNavigation(remoteMessage);
    });

    // Handle notification when app is completely closed
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('FCM: App opened from notification:', remoteMessage);
          this.handleNotificationNavigation(remoteMessage);
        }
      });
  }

  /**
   * Handle navigation based on notification data
   */
  handleNotificationNavigation(remoteMessage) {
    const data = remoteMessage.data;
    
    if (data) {
      // You can add navigation logic here based on notification data
      console.log('FCM: Navigation data:', data);
      
      // Example navigation logic:
      // if (data.type === 'request_approved') {
      //   // Navigate to orders screen
      // } else if (data.type === 'new_request') {
      //   // Navigate to pending requests screen
      // }
    }
  }

  /**
   * Setup token refresh listener
   */
  setupTokenRefreshListener() {
    this.unsubscribe = messaging().onTokenRefresh(async (token) => {
      console.log('FCM: Token refreshed:', token);
      
      const currentUser = getAuth().currentUser;
      if (currentUser) {
        await this.updateToken(currentUser.uid, token);
      }
    });
  }

  /**
   * Initialize FCM service
   */
  async initialize(userId, userRole) {
    try {
      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('FCM: Permission not granted');
        return false;
      }

      // Get and save token
      const token = await this.getToken(userId, userRole);
      if (!token) {
        console.log('FCM: Failed to get token');
        return false;
      }

      // Setup listeners
      this.setupMessageListeners();
      this.setupTokenRefreshListener();

      console.log('FCM: Service initialized successfully');
      return true;
    } catch (error) {
      console.error('FCM: Error initializing service:', error);
      return false;
    }
  }

  /**
   * Cleanup listeners
   */
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.messageListener) {
      this.messageListener();
    }
  }

  /**
   * Send test notification (for development)
   */
  async sendTestNotification(userId, title, body) {
    try {
      // This would typically be done from your backend
      // For testing purposes, you can use Firebase Admin SDK
      console.log('FCM: Test notification would be sent to:', userId);
      console.log('FCM: Title:', title);
      console.log('FCM: Body:', body);
    } catch (error) {
      console.error('FCM: Error sending test notification:', error);
    }
  }
}

// Create singleton instance
const fcmService = new FCMService();

export default fcmService;
