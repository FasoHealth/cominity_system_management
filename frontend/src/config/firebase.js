// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAQwJbWR_Z9J68iBYa-VPnQ2dBegnALC7Y",
  authDomain: "comminity-system-alert.firebaseapp.com",
  projectId: "comminity-system-alert",
  storageBucket: "comminity-system-alert.firebasestorage.app",
  messagingSenderId: "727815484300",
  appId: "1:727815484300:web:5c4fbffccfe791dbc75ca9",
  measurementId: "G-07QXDB2KSY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Messaging
const messaging = getMessaging(app);

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY' // You'll need to generate this key in Firebase Console
      });
      console.log('FCM Token:', token);
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

export { app, analytics, messaging };
