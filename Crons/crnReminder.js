import moment from 'moment';

import UserPushNotificationSubscription from '../Models/mdlUserPushNotificationSubscription';
import { resPushNotification } from '../Responses/resPushNotificaition';
import { constructSubscriptionObject } from '../Utilities/utlType';

const crnReminder = async () => {
  // get current time
  const now = moment().toDate();

  // get last minute
  const next30Seconds = moment().add(30, 'seconds').toDate();

  // get user's reminder
  const repoUserPushNotificationSubscriptions = await UserPushNotificationSubscription.aggregate([
    { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $unwind: '$user.todo_reminders' },
    { $lookup: { from: 'todos', localField: 'user.todo_reminders.todo', foreignField: '_id', as: 'user.todo_reminders.todo' } },
    { $unwind: '$user.todo_reminders.todo' },
    { $match: { $and: [{ 'user.todo_reminders.remind_date': { $gte: now } }, { 'user.todo_reminders.remind_date': { $lte: next30Seconds } }] } },
    { $group: { _id: { _id: '$_id', endpoint: '$endpoint', p256dh: '$p256dh', auth: '$auth', userName: '$user.name' }, reminders: { $push: '$user.todo_reminders' } } },
    { $project: { _id: 1, reminders: { todo: { description: 1 } } } },
  ]);

  // notify all users
  repoUserPushNotificationSubscriptions.forEach((repoUserPushNotificationSubscription) => {
    // construct subscription object
    const subscription = constructSubscriptionObject(repoUserPushNotificationSubscription._id);

    // construct notification payload
    const payload = { title: `${repoUserPushNotificationSubscription._id.userName}, you have a reminder(s)`, body: repoUserPushNotificationSubscription.reminders.map((reminder) => reminder.todo.description).join(';') };

    // send notification
    resPushNotification(subscription, payload);
  });
};

export default crnReminder;
