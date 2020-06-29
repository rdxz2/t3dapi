import Joi from '@hapi/joi';

// subscribe to push notification
export const vldtPushNotificationSubscribe = (data) =>
  Joi.object({
    description: Joi.string().max(100).required(),
  }).validate(data);
