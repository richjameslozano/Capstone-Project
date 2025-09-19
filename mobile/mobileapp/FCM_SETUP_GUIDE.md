# FCM (Firebase Cloud Messaging) Setup Guide

This guide explains how to set up and use Firebase Cloud Messaging for push notifications in your React Native mobile app.

## 🚀 What's Been Set Up

### 1. Firebase Configuration
- Updated `FirebaseConfig.js` to include FCM messaging
- Added proper imports for `getMessaging`, `getToken`, and `onMessage`

### 2. FCM Service (`utils/FCMService.js`)
- Complete FCM service with token management
- Permission handling
- Background and foreground message handling
- Token refresh management

### 3. Notification Handler (`utils/NotificationHandler.js`)
- Comprehensive notification handling
- Support for both FCM and Expo notifications
- Deep linking and navigation
- Local notification display
- Firestore integration

### 4. Updated Push Token Registration (`utils/RegisterPushToken.js`)
- FCM token registration
- Fallback to Expo tokens
- Token refresh handling
- Permission management

### 5. App Configuration (`app.json`)
- Added FCM plugins
- Configured notification permissions
- Set up background modes
- Added notification channels

## 📱 Required Dependencies

Make sure you have these dependencies installed:

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

## 🔧 Setup Steps

### 1. Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`nuls-8c12b`)
3. Go to Project Settings > Cloud Messaging
4. Note your Server Key (you'll need this for sending notifications)

### 2. Android Setup

1. Download `google-services.json` from Firebase Console
2. Place it in `android/app/google-services.json`
3. Make sure the file is properly configured in your `app.json`

### 3. iOS Setup

1. Download `GoogleService-Info.plist` from Firebase Console
2. Add it to your iOS project
3. Configure push notification capabilities in Xcode

### 4. Test the Setup

```javascript
import FCMTestHelper from './utils/FCMTestHelper';

// Test FCM setup
const testResults = await FCMTestHelper.runComprehensiveTest(userId);
console.log('Test Results:', testResults);
```

## 📨 Sending Notifications

### From Your Backend (Recommended)

```javascript
// Using Firebase Admin SDK
const admin = require('firebase-admin');

const message = {
  token: 'FCM_TOKEN_HERE',
  notification: {
    title: 'New Request',
    body: 'You have a new request to review',
  },
  data: {
    type: 'new_request',
    requestId: '123',
    userId: 'user123',
  },
};

admin.messaging().send(message);
```

### From Your App (For Testing)

```javascript
import FCMTestHelper from './utils/FCMTestHelper';

// Send test notification
await FCMTestHelper.sendTestNotification(
  'Test Title',
  'Test message body'
);
```

## 🔔 Notification Types

The system supports these notification types with automatic navigation:

- `request_approved` → Navigate to OrdersScreen
- `new_request` → Navigate to PendingRequestScreen
- `request_rejected` → Navigate to OrdersScreen
- `inventory_update` → Navigate to InventoryStocks
- `capex_approved` → Navigate to CapexRequestScreen
- `capex_rejected` → Navigate to CapexRequestScreen

## 🎯 Usage Examples

### 1. Check if FCM is Working

```javascript
import { isPushNotificationEnabled, getCurrentPushToken } from './utils/RegisterPushToken';

// Check if push notifications are enabled
const isEnabled = await isPushNotificationEnabled();
console.log('Push notifications enabled:', isEnabled);

// Get current FCM token
const token = await getCurrentPushToken();
console.log('FCM Token:', token);
```

### 2. Send Notification from Backend

```javascript
// Example using Firebase Admin SDK in your backend
const message = {
  token: userFCMToken,
  notification: {
    title: 'Request Approved',
    body: 'Your request has been approved by the admin',
  },
  data: {
    type: 'request_approved',
    requestId: 'req123',
    userId: user.id,
  },
  android: {
    notification: {
      channelId: 'requests',
      priority: 'high',
    },
  },
  apns: {
    payload: {
      aps: {
        sound: 'default',
        badge: 1,
      },
    },
  },
};

await admin.messaging().send(message);
```

### 3. Handle Notification in App

The notification handler automatically:
- Shows notifications when app is in foreground
- Handles background notifications
- Navigates to appropriate screens when notifications are tapped
- Saves notifications to Firestore for in-app display

## 🐛 Troubleshooting

### Common Issues

1. **Token not generated**
   - Check if user is authenticated
   - Verify Firebase configuration
   - Check device permissions

2. **Notifications not received**
   - Verify FCM token is valid
   - Check Firebase Console for delivery status
   - Ensure app has notification permissions

3. **Navigation not working**
   - Check if navigation reference is set
   - Verify notification data structure
   - Check console for navigation errors

### Debug Commands

```javascript
import FCMTestHelper from './utils/FCMTestHelper';

// Run comprehensive test
const results = await FCMTestHelper.runComprehensiveTest(userId);

// Test specific functionality
await FCMTestHelper.testFCMSetup();
await FCMTestHelper.getTokenInfo();
await FCMTestHelper.sendTestNotification();
```

## 📊 Monitoring

### Firebase Console
- Go to Cloud Messaging > Reports
- Monitor delivery rates and errors
- Check token validity

### App Logs
- Check console for FCM-related logs
- Look for token generation and refresh logs
- Monitor notification handling logs

## 🔒 Security Considerations

1. **Token Storage**: FCM tokens are stored in Firestore with user authentication
2. **Permission Handling**: Always request permissions before sending notifications
3. **Token Refresh**: Tokens are automatically refreshed when they expire
4. **User Privacy**: Respect user's notification preferences

## 📚 Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase Documentation](https://rnfirebase.io/messaging/usage)
- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)

## 🆘 Support

If you encounter issues:
1. Check the console logs for error messages
2. Run the FCM test helper to diagnose issues
3. Verify Firebase configuration and permissions
4. Check device notification settings

---

**Note**: This setup provides both FCM and Expo notification support for maximum compatibility across different deployment scenarios.
