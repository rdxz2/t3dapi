import { Schema, model } from 'mongoose';

const scmUserPushNoitificationSubscription = new Schema({
  endpoint: {
    type: String,
    required: true,
  },
  expiration_time: {
    type: Number,
    // required: true,
  },
  p256dh: {
    type: String,
    required: true,
  },
  auth: {
    type: String,
    required: true,
  },
  // fk: User
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

const UserPushNotificationSubscription = model('UserPushNotificationSubscription', scmUserPushNoitificationSubscription, 'user_push_notification_subscriptions');

export default UserPushNotificationSubscription;
