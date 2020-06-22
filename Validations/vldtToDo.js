import Joi from '@hapi/joi';

// create to do
export const vldtToDoCreate = (data) =>
  Joi.object({
    description: Joi.string().max(1000).required(),
  }).validate(data);

// change tags
export const vldtToDoChangeTags = (data) =>
  Joi.object({
    tags: Joi.array().items(Joi.string()).optional(),
  }).validate(data);
