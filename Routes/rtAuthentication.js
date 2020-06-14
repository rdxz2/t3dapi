import { Router } from 'express';

import HTTPSTATUS from '../Constants/HTTPSTATUS';
import User from '../Models/mdlUser';
import { resBase, resException, resIsExist, resValidationError } from '../Responses/resBase';
import rtFtJwt from '../RouteFilters/rtFtJwt';
import { generateJwt, hashPassword, matchPassword } from '../Utilities/utlSecurity';
import { vldtLogin, vldtRegister } from '../Validations/vldtAuthentication';

const rtAuthentication = Router();

// check if token is valid (with middleware)
rtAuthentication.get('/check', rtFtJwt, (request, response) => resBase(true, response));

// register
rtAuthentication.post('/register', async (request, response) => {
  // validate model
  const { error: errorValidation } = vldtRegister(request.body);
  if (errorValidation) return resValidationError(errorValidation, response);

  // make sure username is available
  const repoUserExisting = await User.countDocuments({ username: request.body.username });
  if (repoUserExisting) return resIsExist('username', response);

  // hash password
  const hashedPassword = await hashPassword(request.body.password);

  // make user
  const tbiRepoUser = new User({
    username: request.body.username,
    email: request.body.email,
    name: request.body.name,
    password: hashedPassword,
    department: request.body.department,
    position: request.body.position,
  });

  try {
    // save user
    const tbiRepoUserSaved = await tbiRepoUser.save();

    // generate jwt
    const jwt = generateJwt({ _id: tbiRepoUserSaved._id });

    return resBase({ _id: tbiRepoUserSaved._id, username: tbiRepoUserSaved.username, name: tbiRepoUserSaved.name, token: jwt }, response);
  } catch (error) {
    return resException(error, response);
  }
});

// log in
rtAuthentication.post('/login', async (request, response) => {
  // validate model
  const { error: errorValidation } = vldtLogin(request.body);
  if (errorValidation) return resValidationError(errorValidation, response);

  // search user
  const repoUser = await User.findOne({ username: request.body.username });
  if (!repoUser) return resBase('username or password is invalid', response, HTTPSTATUS.BADREQUEST);

  // check password validity
  const isPasswordMatched = await matchPassword(request.body.password, repoUser.password);
  if (!isPasswordMatched) return resBase('username or password is invalid', response, HTTPSTATUS.BADREQUEST);

  // generate jwt
  const jwt = generateJwt({ _id: repoUser._id });

  return resBase(
    {
      name: repoUser.name,
      token: jwt,
    },
    response
  );
});

// log out
rtAuthentication.get('/logout', rtFtJwt, (request, response) => {
  return resBase(`user ${request.user._id} logged out`, response);
});

export default rtAuthentication;
