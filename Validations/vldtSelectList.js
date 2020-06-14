import Joi from '@hapi/joi';

// validate select list
export const vldtSelectList = (data) =>
  Joi.object({
    show: Joi.number().max(1000).required(),
    search: Joi.string().max(200).allow('').optional(),
  }).validate(data);
