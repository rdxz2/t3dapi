import Joi from '@hapi/joi';
import JoiObjectId from 'joi-objectid';

Joi.objectId = JoiObjectId(Joi);

// validate user registration
export const vldtRegister = (data) =>
  Joi.object({
    username: Joi.string().min(2).max(100).required(),
    email: Joi.string().max(100).email().required(),
    name: Joi.string().max(200).required(),
    password: Joi.string().min(5).max(100).required(),
    passwordConfirm: Joi.string().min(5).max(100).valid(Joi.ref('password')).required(),
    department: Joi.objectId(),
    position: Joi.objectId(),
  }).validate(data);

// validate user login information
export const vldtLogin = (data) =>
  Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }).validate(data);
