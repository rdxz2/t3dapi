import { Router, response } from 'express';

import { resBase, resException } from '../Responses/resBase';
import { resPushNotification } from '../Responses/resPushNotificaition';
import rtFtJwt from '../RouteFilters/rtFtJwt';
import UserPushNotificationSubscription from '../Models/mdlUserPushNotificationSubscription';

const rtPushNotification = Router();

// get vapid public key
rtPushNotification.get('/vapid', rtFtJwt, (request, response) => {
  return resBase({ vapid_key_public: process.env.VAPID_KEY_PUBLIC }, response);
});

// subscribe
rtPushNotification.post('/subscribe', rtFtJwt, async (request, response) => {
  const subscription = request.body.subscription;

  // search user push notification
  let tbuRepoUserPushNotificaitonSubscription = await UserPushNotificationSubscription.findOne({ _id: request.user.id });

  // if not found then create new
  if (!tbuRepoUserPushNotificaitonSubscription) {
    // make db model: user push notification
    tbuRepoUserPushNotificaitonSubscription = new UserPushNotificationSubscription({
      endpoint: subscription.endpoint,
      expiration_time: subscription.expiration_time,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      // link user
      user: request.user.id,
    });
  }
  // if found then just update
  else {
    tbuRepoUserPushNotificaitonSubscription.endpoint = subscription.endpoint;
    tbuRepoUserPushNotificaitonSubscription.expiration_time = subscription.expiration_time;
    tbuRepoUserPushNotificaitonSubscription.p256dh = subscription.keys.p256dh;
    tbuRepoUserPushNotificaitonSubscription.auth = subscription.keys.auth;
  }

  try {
    // save user push notification
    await tbuRepoUserPushNotificaitonSubscription.save();

    return resBase('subscribed', response);
  } catch (error) {
    return resException(error, response);
  }
});

// unsubscribe
rtPushNotification.post('/unsubscribe', rtFtJwt, async (request, response) => {
  // search and delete user push notification
  await UserPushNotificationSubscription.deleteOne({ _id: request.user.id });

  return resBase('unsubscribed', response);
});

export default rtPushNotification;