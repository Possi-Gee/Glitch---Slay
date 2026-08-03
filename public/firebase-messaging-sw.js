// Firebase Cloud Messaging Service Worker
// This file must be in the /public directory to be served at the root of the site.
// It enables background push notifications via Firebase Cloud Messaging.

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Initialize Firebase with your project config.
// These values must match those in your .env file.
firebase.initializeApp({
  apiKey: "AIzaSyAvD2Tz2nEYI80Ni4Po2mKjDdepNwsNJxU",
  authDomain: "shopwave-6mh7a.firebaseapp.com",
  projectId: "shopwave-6mh7a",
  storageBucket: "shopwave-6mh7a.firebasestorage.app",
  messagingSenderId: "800300007748",
  appId: "1:800300007748:web:627f0cb6d09321d989d711",
});

const messaging = firebase.messaging();

// Handle background messages (when app is not in focus)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo.jpg',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
