import Joi from '@hapi/joi';

// create to do
export const vldtTodoCreate = (data) =>
  Joi.object({
    description: Joi.string().max(100).required(),
  }).validate(data);

// create/delete tags
export const vldtTodoEditTags = (data) =>
  Joi.object({
    tag: Joi.string().max(30).required(),
  }).validate(data);

// edit description
export const vldtTodoEditDescription = (data) =>
  Joi.object({
    description: Joi.string().max(100).required(),
  }).validate(data);

// comment
export const vldtTodoComment = (data) =>
  Joi.object({
    description: Joi.string().max(100).required(),
  }).validate(data);
