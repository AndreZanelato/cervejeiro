export function getServerSideProps ({ res }) {
  // Serve a service worker script that initializes Firebase Messaging using
  // env variables injected at runtime on the server.
  const script = `importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}",
  authDomain: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}",
  projectId: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}",
  storageBucket: "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}",
  messagingSenderId: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}",
  appId: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Cervejeiro';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '',
    data: payload.data || {},
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
`;

  res.setHeader('Content-Type', 'application/javascript');
  res.write(script);
  res.end();
  return { props: {} }
}

export default function NotUsed() { return null }
