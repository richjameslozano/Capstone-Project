import * as Notifications from 'expo-notifications';
import { getFirestore, doc, setDoc, addDoc, collection } from 'firebase/firestore';
import Constants from 'expo-constants';
import { getAuth } from 'firebase/auth';
import * as Device from 'expo-device';
import { Alert } from 'react-native';

// Add logging function
const logToFirebase = async (message, data = {}) => {
  try {
    const db = getFirestore();
    await addDoc(collection(db, "debugLogs"), {
      message,
      data,
      timestamp: new Date(),
      deviceType: Device.osName,
      appOwnership: Constants.appOwnership,
    });
  } catch (error) {
    // Silently fail if logging fails
  }
};

// Simple test function
export const testPushTokenRegistration = async () => {
  try {
    await logToFirebase("Test function called");
    
    // Test 1: Check if we can access Firebase
    const db = getFirestore();
    await logToFirebase("Firebase connection test", { success: true });
    
    // Test 2: Check if we can write to Firestore
    await addDoc(collection(db, "testCollection"), {
      test: true,
      timestamp: new Date(),
      message: "Test from production APK"
    });
    await logToFirebase("Firestore write test", { success: true });
    
    // Test 3: Check permissions
    const { status } = await Notifications.getPermissionsAsync();
    await logToFirebase("Permission test", { status });
    
    if (status === 'denied') {
      Alert.alert(
        "Notification Permission Required",
        "To receive notifications about your requests, please enable notification permissions in your device settings.",
        [
          { text: "OK", style: "default" },
          { text: "Open Settings", onPress: () => Notifications.openSettingsAsync() }
        ]
      );
    }
    
    return status === 'granted';
  } catch (error) {
    await logToFirebase("Test function error", { error: error.message });
    return false;
  }
};

export const registerForPushNotificationsAsync = async (userDocId, role) => {
  try {
    await logToFirebase("PushToken registration started", { userDocId, role });
    console.log("[PushToken] Starting registration...");
    console.log("[PushToken] UserDocId:", userDocId);
    console.log("[PushToken] Role:", role);

    // Check if running on a physical device
    if (!Device.isDevice) {
      await logToFirebase("Not a physical device, skipping");
      console.log("[PushToken] Not a physical device, skipping token registration");
      return null;
    }

    // Better detection for Expo Go vs production build
    console.log("[PushToken] Constants.appOwnership:", Constants.appOwnership);
    console.log("[PushToken] Constants.expoGoConfig:", Constants.expoGoConfig);
    console.log("[PushToken] Constants.expoConfig:", Constants.expoConfig);
    
    const isExpoGo = Constants.appOwnership === 'expo' || Constants.appOwnership === 'standalone';
    const isProductionBuild = Constants.appOwnership === 'standalone' || Constants.appOwnership === 'expo';
    
    // For production builds, we want to treat them as non-Expo Go
    const shouldUseProductionTokens = Constants.appOwnership === 'standalone' || 
                                    (Constants.appOwnership === 'expo' && !Constants.expoGoConfig);
    
    await logToFirebase("App ownership detected", { 
      appOwnership: Constants.appOwnership, 
      shouldUseProductionTokens,
      isExpoGo,
      isProductionBuild
    });
    
    console.log("[PushToken] App ownership:", Constants.appOwnership);
    console.log("[PushToken] Should use production tokens:", shouldUseProductionTokens);

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    console.log("[PushToken] Initial permission status:", existingStatus);

    if (existingStatus !== "granted") {
      console.log("[PushToken] Requesting permissions...");
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log("[PushToken] Permission request result:", status);
      
      // If still denied after request, show user guidance
      if (status === 'denied') {
        Alert.alert(
          "Notification Permission Required",
          "To receive notifications about your requests, please enable notification permissions in your device settings.",
          [
            { text: "OK", style: "default" },
            { text: "Open Settings", onPress: () => Notifications.openSettingsAsync() }
          ]
        );
      }
    }

    await logToFirebase("Permission status", { finalStatus });
    console.log("[PushToken] Final permission status:", finalStatus);

    if (finalStatus !== "granted") {
      await logToFirebase("Permission not granted", { 
        reason: "User denied or permission not available",
        canRequestAgain: existingStatus === 'undetermined'
      });
      console.log("[PushToken] Permission not granted");
      return null;
    }

    // Get the push token - always use the same method for both
    console.log("[PushToken] Getting Expo push token...");
    console.log("[PushToken] Project ID:", Constants.expoConfig?.extra?.eas?.projectId);
    
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;

    await logToFirebase("Token retrieved", { token: token ? "SUCCESS" : "FAILED" });
    console.log("[PushToken] Retrieved token:", token);

    const db = getFirestore();
    const currentUser = getAuth().currentUser;

    console.log("[PushToken] Current user:", currentUser?.uid);
    console.log("[PushToken] Token exists:", !!token);

    if (currentUser && token) {
      console.log("[PushToken] Saving token to Firestore...");
      
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
      
      await logToFirebase("Token saved successfully", { 
        uid: currentUser.uid, 
        userDocId,
        tokenType: shouldUseProductionTokens ? "PRODUCTION" : "EXPO_GO"
      });
      
      console.log("[PushToken] ✅ Successfully saved to Firestore under UID:", currentUser.uid, "and userDocId:", userDocId);
      console.log("[PushToken] Token type:", shouldUseProductionTokens ? "PRODUCTION" : "EXPO_GO");

    } else {
      await logToFirebase("Failed to save token", { 
        hasUser: !!currentUser, 
        hasToken: !!token 
      });
      console.log("[PushToken] ❌ Missing user or token");
      console.log("[PushToken] Current user exists:", !!currentUser);
      console.log("[PushToken] Token exists:", !!token);
    }

    return token;

  } catch (error) {
    await logToFirebase("PushToken registration error", { 
      error: error.message,
      stack: error.stack 
    });
    console.log("[PushToken] ❌ Error:", error.message);
    console.log("[PushToken] ❌ Error stack:", error.stack);
    return null;
  }
};
