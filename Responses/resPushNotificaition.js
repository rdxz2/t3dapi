import webpush from 'web-push';

// send push notification
export const resPushNotification = (subscription = {}, payload = {}) => {
  // stringify payload
  const payloadStringified = JSON.stringify(payload);

  webpush.sendNotification(subscription, payloadStringified);
};
