// index.js (root)
import 'expo-router/entry';
import messaging from '@react-native-firebase/messaging';

// ❌ Tuyệt đối không Alert ở đây (headless)
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[FCM bg] messageId=', remoteMessage?.messageId, 'type=', remoteMessage?.data?.type);
});

// (nếu có onNotificationOpenedApp thì cũng đừng Alert trong đó)
messaging().onNotificationOpenedApp((remoteMessage) => {
  console.log('[FCM open-from-bg] data=', remoteMessage?.data);
});
