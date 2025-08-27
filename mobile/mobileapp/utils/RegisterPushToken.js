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

    // Better detection for Expo Go vs production build
    const isExpoGo = Constants.appOwnership === 'expo' || Constants.appOwnership === 'standalone';
    const isProductionBuild = Constants.appOwnership === 'standalone' || Constants.appOwnership === 'expo';
    
    // For production builds, we want to treat them as non-Expo Go
    const shouldUseProductionTokens = Constants.appOwnership === 'standalone' || 
                                    (Constants.appOwnership === 'expo' && !Constants.expoGoConfig);
    
    console.log("[PushToken] App ownership:", Constants.appOwnership);
    console.log("[PushToken] Should use production tokens:", shouldUseProductionTokens);

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

    // Get the push token - always use the same method for both
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;

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
        isExpoGo: !shouldUseProductionTokens,
        isProductionBuild: shouldUseProductionTokens,
        deviceType: Device.osName,
        lastUpdated: new Date(),
      });
      
      // Also store under userDocId for direct lookup
      await setDoc(doc(db, "pushTokens", userDocId), {
        expoPushToken: token,
        userDocId,
        userId: userDocId,
        role: role || "User",
        isExpoGo: !shouldUseProductionTokens,
        isProductionBuild: shouldUseProductionTokens,
        deviceType: Device.osName,
        lastUpdated: new Date(),
      });
      
      console.log("[PushToken] Saved to Firestore under UID:", currentUser.uid, "and userDocId:", userDocId);
      console.log("[PushToken] Token type:", shouldUseProductionTokens ? "PRODUCTION" : "EXPO_GO");

    } else {
      console.log("[PushToken] Missing user or token");
    }

    return token;

  } catch (error) {
    console.log("[PushToken] Error:", error.message);
    return null;
  }
};
