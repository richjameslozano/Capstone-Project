import * as Notifications from 'expo-notifications';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import Constants from 'expo-constants';
import { getAuth } from 'firebase/auth';
import * as Device from 'expo-device';

export const registerForPushNotificationsAsync = async (userDocId, role) => {
  try {
    console.log("[PushToken] Starting registration...");

    // Check if running on a physical device
    if (!Device.isDevice) {
      console.log("[PushToken] Not a physical device, skipping token registration");
      return null;
    }

    // Check if running in Expo Go vs production build
    const isExpoGo = Constants.appOwnership === 'expo';
    console.log("[PushToken] Running in Expo Go:", isExpoGo);

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    console.log("[PushToken] Final permission status:", finalStatus);

    if (finalStatus !== "granted") {
      console.log("[PushToken] Permission not granted");
      return null;
    }

    // Get the push token
    let token;
    if (isExpoGo) {
      // Use Expo push token for Expo Go
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;
    } else {
      // Use Expo push token for production builds
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;
    }

    console.log("[PushToken] Retrieved token:", token);

    const db = getFirestore();
    const currentUser = getAuth().currentUser;

    if (currentUser && token) {
      // Store under both UID and userDocId for compatibility
      await setDoc(doc(db, "pushTokens", currentUser.uid), {
        expoPushToken: token,
        userDocId,
        userId: userDocId, // Add this for web component compatibility
        role: role || "User",
        isExpoGo: isExpoGo,
        deviceType: Device.osName,
        lastUpdated: new Date(),
      });
      
      // Also store under userDocId for direct lookup
      await setDoc(doc(db, "pushTokens", userDocId), {
        expoPushToken: token,
        userDocId,
        userId: userDocId,
        role: role || "User",
        isExpoGo: isExpoGo,
        deviceType: Device.osName,
        lastUpdated: new Date(),
      });
      
      console.log("[PushToken] Saved to Firestore under UID:", currentUser.uid, "and userDocId:", userDocId);

    } else {
      console.log("[PushToken] Missing user or token");
    }

    return token;

  } catch (error) {
    console.log("[PushToken] Error:", error.message);
    return null;
  }
};
