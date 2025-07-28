// import * as Notifications from 'expo-notifications';
// import { getFirestore, doc, setDoc } from 'firebase/firestore';
// import Constants from 'expo-constants';

// export const registerForPushNotificationsAsync = async (userId) => {
//   try {
//     console.log("[PushToken] Starting registration...");

//     if (!Constants.isDevice) {
//       console.log("[PushToken] Not a real device.");
//       return;
//     }

//     const { status: existingStatus } = await Notifications.getPermissionsAsync();
//     let finalStatus = existingStatus;

//     if (existingStatus !== 'granted') {
//       const { status } = await Notifications.requestPermissionsAsync();
//       finalStatus = status;
//     }

//     if (finalStatus !== 'granted') {
//       console.log("[PushToken] Permission not granted");
//       return;
//     }

//     const token = (await Notifications.getExpoPushTokenAsync()).data;
//     console.log("[PushToken] Retrieved token:", token);

//     const db = getFirestore();

//     if (userId && token) {
//       await setDoc(doc(db, 'pushTokens', userId), {
//         expoPushToken: token,
//       });
//       console.log("[PushToken] Saved to Firestore");
//     } else {
//       console.log("[PushToken] Missing userId or token");
//     }

//     return token;
//   } catch (error) {
//     console.log("[PushToken] Error:", error.message);
//   }
// };

import * as Notifications from 'expo-notifications';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import Constants from 'expo-constants';
import { getAuth } from 'firebase/auth';

export const registerForPushNotificationsAsync = async (userDocId, role) => {
  try {
    console.log("[PushToken] Starting registration...");

    // if (!Constants.isDevice) {
    //   console.log("[PushToken] Not a real device.");
    //   return;
    // }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    console.log("[PushToken] Final permission status:", finalStatus);

    if (finalStatus !== "granted") {
      console.log("[PushToken] Permission not granted");
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("[PushToken] Retrieved token:", token);

    const db = getFirestore();
    const currentUser = getAuth().currentUser;

    if (currentUser && token) {
      await setDoc(doc(db, "pushTokens", currentUser.uid), {
        expoPushToken: token,
        userDocId,
        role: role || "User", // <--- Save role
      });
      console.log("[PushToken] Saved to Firestore under UID:", currentUser.uid);

    } else {
      console.log("[PushToken] Missing user or token");
    }

    return token;

  } catch (error) {
    console.log("[PushToken] Error:", error.message);
  }
};
