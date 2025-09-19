import messaging from '@react-native-firebase/messaging';
import { Platform, Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationHandler {
  constructor() {
    this.initialized = false;
    this.navigationRef = null;
  }

  /**
   * Set navigation reference for handling deep links
   */
  setNavigationRef(ref) {
    this.navigationRef = ref;
  }

  /**
   * Initialize notification handlers
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Request permissions
      await this.requestPermissions();

      // Setup FCM background message handler
      this.setupBackgroundMessageHandler();

      // Setup FCM foreground message handler
      this.setupForegroundMessageHandler();

      // Setup notification opened handlers
      this.setupNotificationOpenedHandlers();

      // Setup Expo notification handlers
      this.setupExpoNotificationHandlers();

      this.initialized = true;
      console.log('NotificationHandler: Initialized successfully');
    } catch (error) {
      console.error('NotificationHandler: Error initializing:', error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions() {
    try {
      // Request FCM permissions
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('NotificationHandler: FCM permission denied');
        return false;
      }

      // Request Expo notification permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('NotificationHandler: Expo notification permission denied');
        return false;
      }

      console.log('NotificationHandler: Permissions granted');
      return true;
    } catch (error) {
      console.error('NotificationHandler: Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Setup background message handler
   */
  setupBackgroundMessageHandler() {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('NotificationHandler: Background message received:', remoteMessage);
      
      // Save notification to Firestore for in-app display
      await this.saveNotificationToFirestore(remoteMessage);
      
      // You can add additional background processing here
    });
  }

  /**
   * Setup foreground message handler
   */
  setupForegroundMessageHandler() {
    messaging().onMessage(async (remoteMessage) => {
      console.log('NotificationHandler: Foreground message received:', remoteMessage);
      
      // Show local notification for foreground messages
      await this.showLocalNotification(remoteMessage);
      
      // Save notification to Firestore
      await this.saveNotificationToFirestore(remoteMessage);
    });
  }

  /**
   * Setup notification opened handlers
   */
  setupNotificationOpenedHandlers() {
    // Handle notification opened when app is in background
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('NotificationHandler: Notification opened app:', remoteMessage);
      this.handleNotificationNavigation(remoteMessage);
    });

    // Handle notification when app is completely closed
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('NotificationHandler: App opened from notification:', remoteMessage);
          this.handleNotificationNavigation(remoteMessage);
        }
      });
  }

  /**
   * Setup Expo notification handlers
   */
  setupExpoNotificationHandlers() {
    // Handle notification received in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('NotificationHandler: Expo notification received:', notification);
    });

    // Handle notification response (when user taps notification)
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('NotificationHandler: Expo notification response:', response);
      this.handleExpoNotificationResponse(response);
    });
  }

  /**
   * Show local notification
   */
  async showLocalNotification(remoteMessage) {
    try {
      const { notification, data } = remoteMessage;
      
      if (notification) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notification.title || 'New Notification',
            body: notification.body || 'You have a new message',
            data: data || {},
            sound: true,
          },
          trigger: null, // Show immediately
        });
      }
    } catch (error) {
      console.error('NotificationHandler: Error showing local notification:', error);
    }
  }

  /**
   * Save notification to Firestore
   */
  async saveNotificationToFirestore(remoteMessage) {
    try {
      const { notification, data } = remoteMessage;
      
      if (!notification) return;

      const db = getFirestore();
      const notificationData = {
        title: notification.title || 'New Notification',
        body: notification.body || 'You have a new message',
        data: data || {},
        timestamp: serverTimestamp(),
        type: data?.type || 'general',
        read: false,
        source: 'fcm',
      };

      // Save to general notifications collection
      await addDoc(collection(db, 'allNotifications'), notificationData);

      // If notification is for a specific user, save to their personal collection
      if (data?.userId) {
        await addDoc(collection(db, 'accounts', data.userId, 'userNotifications'), notificationData);
      }

      console.log('NotificationHandler: Notification saved to Firestore');
    } catch (error) {
      console.error('NotificationHandler: Error saving notification to Firestore:', error);
    }
  }

  /**
   * Handle notification navigation
   */
  handleNotificationNavigation(remoteMessage) {
    const { data } = remoteMessage;
    
    if (!data || !this.navigationRef) return;

    // Add a small delay to ensure navigation is ready
    setTimeout(() => {
      try {
        switch (data.type) {
          case 'request_approved':
            this.navigationRef.navigate('OrdersScreen');
            break;
          case 'new_request':
            this.navigationRef.navigate('PendingRequestScreen');
            break;
          case 'request_rejected':
            this.navigationRef.navigate('OrdersScreen');
            break;
          case 'inventory_update':
            this.navigationRef.navigate('InventoryStocks');
            break;
          case 'capex_approved':
            this.navigationRef.navigate('CapexRequestScreen');
            break;
          case 'capex_rejected':
            this.navigationRef.navigate('CapexRequestScreen');
            break;
          default:
            // Navigate to notifications screen for general notifications
            this.navigationRef.navigate('Notifications');
            break;
        }
      } catch (error) {
        console.error('NotificationHandler: Error navigating:', error);
      }
    }, 1000);
  }

  /**
   * Handle Expo notification response
   */
  handleExpoNotificationResponse(response) {
    const { notification } = response;
    const data = notification.request.content.data;
    
    if (data) {
      this.handleNotificationNavigation({ data });
    }
  }

  /**
   * Create notification channel for Android
   */
  async createNotificationChannel() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      await Notifications.setNotificationChannelAsync('requests', {
        name: 'Request Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      await Notifications.setNotificationChannelAsync('inventory', {
        name: 'Inventory Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('NotificationHandler: Error sending test notification:', error);
    }
  }

  /**
   * Get notification permissions status
   */
  async getPermissionsStatus() {
    try {
      const fcmStatus = await messaging().hasPermission();
      const expoStatus = await Notifications.getPermissionsAsync();
      
      return {
        fcm: fcmStatus === messaging.AuthorizationStatus.AUTHORIZED,
        expo: expoStatus.status === 'granted',
      };
    } catch (error) {
      console.error('NotificationHandler: Error getting permissions status:', error);
      return { fcm: false, expo: false };
    }
  }
}

// Create singleton instance
const notificationHandler = new NotificationHandler();

export default notificationHandler;
