import Joi from '@hapi/joi';

// change profile picture
export const vldtProjectCreate = (data) =>
  Joi.object({
    code: Joi.string().max(5).required(),
    name: Joi.string().max(100).required(),
    description: Joi.string().max(100).allow('').optional(),
    deadline: Joi.date().allow('').optional(),
    collaborators: Joi.array().optional(),
  }).validate(data);

// project edit
export const vldtProjectEdit = (data) =>
  Joi.object({
    code: Joi.string().max(5).required(),
    name: Joi.string().max(100).required(),
    description: Joi.string().max(100).allow('').optional(),
    deadline: Joi.date().allow('').optional(),
    collaborators: Joi.array().optional(),
  }).validate(data);
