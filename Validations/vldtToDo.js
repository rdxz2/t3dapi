import Joi from '@hapi/joi';

// validate create to do
export const vldtToDoCreate = (data) =>
  Joi.object({
    description: Joi.string().max(1000).required(),
  }).validate(data);
