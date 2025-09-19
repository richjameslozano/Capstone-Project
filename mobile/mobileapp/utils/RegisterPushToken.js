import messaging from '@react-native-firebase/messaging';
import { getFirestore, doc, setDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * Register for FCM push notifications
 * This function handles both FCM and Expo notifications for maximum compatibility
 */
export const registerForPushNotificationsAsync = async (userDocId, role) => {
  try {
    console.log("[FCM] Starting push notification registration...");

    const currentUser = getAuth().currentUser;
    if (!currentUser) {
      console.log("[FCM] No authenticated user found");
      return null;
    }

    // Request FCM permissions
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log("[FCM] FCM permission not granted");
      return null;
    }

    // Get FCM token
    const fcmToken = await messaging().getToken();
    console.log("[FCM] FCM Token retrieved:", fcmToken);

    // Get Expo push token as fallback
    let expoToken = null;
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') {
        const expoTokenData = await Notifications.getExpoPushTokenAsync();
        expoToken = expoTokenData.data;
        console.log("[FCM] Expo Token retrieved:", expoToken);
      }
    } catch (expoError) {
      console.log("[FCM] Expo token error:", expoError.message);
    }

    const db = getFirestore();
    const tokenData = {
      fcmToken: fcmToken,
      expoPushToken: expoToken,
      userDocId: userDocId,
      role: role || "User",
      platform: Platform.OS,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to Firestore
    await setDoc(doc(db, "pushTokens", currentUser.uid), tokenData);
    console.log("[FCM] Tokens saved to Firestore for user:", currentUser.uid);

    // Setup token refresh listener
    messaging().onTokenRefresh(async (newToken) => {
      console.log("[FCM] Token refreshed:", newToken);
      await updateDoc(doc(db, "pushTokens", currentUser.uid), {
        fcmToken: newToken,
        updatedAt: new Date(),
      });
    });

    return {
      fcmToken,
      expoToken,
      userId: currentUser.uid,
    };

  } catch (error) {
    console.error("[FCM] Error during registration:", error.message);
    return null;
  }
};

/**
 * Unregister push notifications
 */
export const unregisterPushNotifications = async () => {
  try {
    const currentUser = getAuth().currentUser;
    if (!currentUser) return;

    const db = getFirestore();
    await updateDoc(doc(db, "pushTokens", currentUser.uid), {
      fcmToken: null,
      expoPushToken: null,
      deletedAt: new Date(),
    });

    console.log("[FCM] Push notifications unregistered for user:", currentUser.uid);
  } catch (error) {
    console.error("[FCM] Error unregistering:", error.message);
  }
};

/**
 * Get current push token
 */
export const getCurrentPushToken = async () => {
  try {
    const currentUser = getAuth().currentUser;
    if (!currentUser) return null;

    const fcmToken = await messaging().getToken();
    return fcmToken;
  } catch (error) {
    console.error("[FCM] Error getting current token:", error.message);
    return null;
  }
};

/**
 * Check if push notifications are enabled
 */
export const isPushNotificationEnabled = async () => {
  try {
    const authStatus = await messaging().hasPermission();
    return authStatus === messaging.AuthorizationStatus.AUTHORIZED;
  } catch (error) {
    console.error("[FCM] Error checking permission:", error.message);
    return false;
  }
};
