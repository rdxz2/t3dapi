import moment from 'moment';

import UserPushNotificationSubscription from '../Models/mdlUserPushNotificationSubscription';
import { resPushNotification } from '../Responses/resPushNotificaition';
import { constructSubscriptionObject, makeEllipsis } from '../Utilities/utlType';

const crnReminder = async () => {
  // get last 30 seconds
  const last30Seconds = moment().add(-30, 'seconds').toDate();

  // get next 30 seconds
  const next30Seconds = moment().add(30, 'seconds').toDate();

  // get user's reminder
  const repoUserPushNotificationSubscriptions = await UserPushNotificationSubscription.aggregate([
    { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $unwind: '$user.todo_reminders' },
    { $lookup: { from: 'todos', localField: 'user.todo_reminders.todo', foreignField: '_id', as: 'user.todo_reminders.todo' } },
    { $unwind: '$user.todo_reminders.todo' },
    { $match: { $and: [{ 'user.todo_reminders.remind_date': { $gte: last30Seconds } }, { 'user.todo_reminders.remind_date': { $lte: next30Seconds } }] } },
    { $group: { _id: { _id: '$_id', endpoint: '$endpoint', p256dh: '$p256dh', auth: '$auth', userName: '$user.name' }, reminders: { $push: '$user.todo_reminders' } } },
    { $project: { _id: 1, reminders: { todo: { description: 1 } } } },
  ]);

  // notify all users
  repoUserPushNotificationSubscriptions.forEach((repoUserPushNotificationSubscription) => {
    // construct subscription object
    const subscription = constructSubscriptionObject(repoUserPushNotificationSubscription._id);

    // construct notification payload
    const payload = {
      // {name}, you have To Do to complete
      title: `${repoUserPushNotificationSubscription._id.userName.split(' ')[0]}, you have To Do to complete`,
      // {ellipsis(description1)}; {ellipsis(description2)}; ...
      body: repoUserPushNotificationSubscription.reminders.map((reminder) => makeEllipsis(reminder.todo.description)).join('; '),
    };

    // send notification
    resPushNotification(subscription, payload);
  });
};

export default crnReminder;
