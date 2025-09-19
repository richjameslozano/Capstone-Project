import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getCurrentPushToken, isPushNotificationEnabled } from './RegisterPushToken';
import notificationHandler from './NotificationHandler';

/**
 * FCM Test Helper - For testing and debugging FCM functionality
 */
class FCMTestHelper {
  /**
   * Test FCM setup
   */
  static async testFCMSetup() {
    console.log('🧪 Testing FCM Setup...');
    
    try {
      // Check if push notifications are enabled
      const isEnabled = await isPushNotificationEnabled();
      console.log('📱 Push notifications enabled:', isEnabled);
      
      // Get current token
      const token = await getCurrentPushToken();
      console.log('🔑 Current FCM token:', token);
      
      // Check notification handler status
      const permissions = await notificationHandler.getPermissionsStatus();
      console.log('🔔 Notification permissions:', permissions);
      
      return {
        success: true,
        pushEnabled: isEnabled,
        token: token,
        permissions: permissions,
      };
    } catch (error) {
      console.error('❌ FCM test failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send test notification
   */
  static async sendTestNotification(title = 'Test Notification', body = 'This is a test notification') {
    try {
      await notificationHandler.sendTestNotification(title, body, {
        type: 'test',
        timestamp: new Date().toISOString(),
      });
      console.log('✅ Test notification sent');
    } catch (error) {
      console.error('❌ Failed to send test notification:', error);
    }
  }

  /**
   * Create test notification in Firestore
   */
  static async createTestNotificationInFirestore(userId, type = 'test') {
    try {
      const db = getFirestore();
      const notificationData = {
        title: 'Test Notification',
        body: 'This is a test notification from FCM',
        type: type,
        timestamp: serverTimestamp(),
        read: false,
        source: 'fcm_test',
        data: {
          testId: Date.now(),
          userId: userId,
        },
      };

      // Add to general notifications
      await addDoc(collection(db, 'allNotifications'), notificationData);
      
      // Add to user's personal notifications
      if (userId) {
        await addDoc(collection(db, 'accounts', userId, 'userNotifications'), notificationData);
      }

      console.log('✅ Test notification created in Firestore');
    } catch (error) {
      console.error('❌ Failed to create test notification:', error);
    }
  }

  /**
   * Test different notification types
   */
  static async testNotificationTypes(userId) {
    const notificationTypes = [
      {
        type: 'request_approved',
        title: 'Request Approved',
        body: 'Your request has been approved',
      },
      {
        type: 'new_request',
        title: 'New Request',
        body: 'A new request requires your attention',
      },
      {
        type: 'request_rejected',
        title: 'Request Rejected',
        body: 'Your request has been rejected',
      },
      {
        type: 'inventory_update',
        title: 'Inventory Updated',
        body: 'Inventory has been updated',
      },
      {
        type: 'capex_approved',
        title: 'Capex Request Approved',
        body: 'Your capex request has been approved',
      },
    ];

    for (const notification of notificationTypes) {
      try {
        await this.createTestNotificationInFirestore(userId, notification.type);
        console.log(`✅ Test notification created: ${notification.type}`);
        
        // Wait 1 second between notifications
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Failed to create ${notification.type} notification:`, error);
      }
    }
  }

  /**
   * Get FCM token info
   */
  static async getTokenInfo() {
    try {
      const token = await getCurrentPushToken();
      const isEnabled = await isPushNotificationEnabled();
      
      return {
        token: token,
        enabled: isEnabled,
        tokenLength: token ? token.length : 0,
        tokenPrefix: token ? token.substring(0, 20) + '...' : 'No token',
      };
    } catch (error) {
      console.error('❌ Failed to get token info:', error);
      return null;
    }
  }

  /**
   * Test notification channels (Android)
   */
  static async testNotificationChannels() {
    try {
      await notificationHandler.createNotificationChannel();
      console.log('✅ Notification channels created');
    } catch (error) {
      console.error('❌ Failed to create notification channels:', error);
    }
  }

  /**
   * Run comprehensive FCM test
   */
  static async runComprehensiveTest(userId) {
    console.log('🚀 Running comprehensive FCM test...');
    
    const results = {
      setup: await this.testFCMSetup(),
      tokenInfo: await this.getTokenInfo(),
      channels: null,
      notifications: null,
    };

    try {
      await this.testNotificationChannels();
      results.channels = { success: true };
    } catch (error) {
      results.channels = { success: false, error: error.message };
    }

    try {
      await this.testNotificationTypes(userId);
      results.notifications = { success: true };
    } catch (error) {
      results.notifications = { success: false, error: error.message };
    }

    console.log('📊 FCM Test Results:', results);
    return results;
  }
}

export default FCMTestHelper;
