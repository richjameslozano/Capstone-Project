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
import { getAuth } from 'firebase/auth'; // make sure to import this

export const registerForPushNotificationsAsync = async (userDocId) => {
  try {
    console.log("[PushToken] Starting registration...");

    if (!Constants.isDevice) {
      console.log("[PushToken] Not a real device.");
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log("[PushToken] Permission not granted");
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("[PushToken] Retrieved token:", token);

    const db = getFirestore();
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser?.uid && token) {
      await setDoc(doc(db, 'pushTokens', currentUser.uid), {
        expoPushToken: token,
        userDocId: userDocId, // 👈 Store the Firestore account doc ID
      });
      console.log("[PushToken] Saved to Firestore under UID:", currentUser.uid);
    } else {
      console.log("[PushToken] Missing UID or token");
    }

    return token;
  } catch (error) {
    console.log("[PushToken] Error:", error.message);
  }
};
