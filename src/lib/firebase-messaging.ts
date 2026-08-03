
'use client';

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { app, db } from './firebase';
import { getAuth } from 'firebase/auth';

export const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        console.log("This browser does not support desktop notification");
        return 'denied';
    }

    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
        console.log('Notification permission granted.');
        try {
            const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
            const currentToken = await getToken(messaging, { vapidKey });
            if (currentToken) {
                const user = getAuth().currentUser;
                if (user) {
                    await setDoc(doc(db, 'fcm_tokens', user.uid), {
                        token: currentToken,
                        userId: user.uid,
                        updatedAt: new Date().toISOString(),
                    });
                    console.log('FCM token saved to Firestore for user:', user.uid);
                } else {
                    console.log('No user signed in. Token not saved.');
                }
            } else {
                console.log('No registration token available. Request permission to generate one.');
            }
        } catch (err) {
            console.error('An error occurred while retrieving token. ', err);
        }
    }
    return permission;
};


export const onMessageListener = () =>
  new Promise((resolve) => {
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
});

