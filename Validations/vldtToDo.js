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
    parent: Joi.number().optional(),
    mentionedUsers: Joi.array().items().optional(),
  }).validate(data);

// change reminder
export const vldtTodoEditReminder = (data) =>
  Joi.object({
    is_removing: Joi.bool().optional(),
    remind_date: Joi.date().iso().optional().allow(''),
  }).validate(data);

export const vldtTodoChangeWorkDate = (data) =>
  Joi.object({
    dateStart: Joi.date().iso().optional().allow(''),
    dateEnd: Joi.date().iso().optional().allow(''),
  }).validate(data);
