import Joi from '@hapi/joi';

// create to do
export const vldtToDoCreate = (data) =>
  Joi.object({
    description: Joi.string().max(1000).required(),
  }).validate(data);

// edit tags
export const vldtToDoEditTags = (data) =>
  Joi.object({
    tags: Joi.array().items(Joi.string()).optional(),
  }).validate(data);

// edit description
export const vldtToDoEditDescription = (data) =>
  Joi.object({
    description: Joi.string().max(1000).required(),
  }).validate(data);
