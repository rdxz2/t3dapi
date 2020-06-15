import Joi from '@hapi/joi';

// project creation
export const vldtProjectCreate = (data) =>
  Joi.object({
    name: Joi.string().max(100).required(),
    code: Joi.string().max(5).required(),
    description: Joi.string().max(1000).allow('').optional(),
    collaborators: Joi.array().optional(),
  }).validate(data);

// project edit
export const vldtProjectEdit = (data) =>
  Joi.object({
    name: Joi.string().max(100).required(),
    code: Joi.string().max(5).required(),
    description: Joi.string().max(1000).allow('').optional(),
    collaborators: Joi.array().optional(),
  }).validate(data);
