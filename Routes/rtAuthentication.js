import { Router, response } from 'express';

import HTTPSTATUS from '../Constants/HTTPSTATUS';
import User from '../Models/mdlUser';
import { resBase, resException, resIsExist, resValidationError, resNotFound, resUnauthorized } from '../Responses/resBase';
import rtFtJwt from '../RouteFilters/rtFtJwt';
import { generateJwt, hashPassword, matchPassword } from '../Utilities/utlSecurity';
import randtoken from 'rand-token';
import { vldtLogin, vldtRegister } from '../Validations/vldtAuthentication';
import rtFtJwtRefresh from '../RouteFilters/rtFtJwtRefresh';
import UserRefreshToken from '../Models/mdlUserRefreshToken';
import moment from 'moment';

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

    return resBase(
      {
        _id: tbiRepoUserSaved._id,
        username: tbiRepoUserSaved.username,
        name: tbiRepoUserSaved.name,
        token: jwt,
      },
      response
    );
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

  // generate refresh token
  const refreshToken = randtoken.generate(16);

  // generate jwt
  const jwt = generateJwt({ _id: repoUser._id });

  // make user refresh token
  const tbiRepoUserRefreshToken = new UserRefreshToken({
    refresh_token: refreshToken,
    expired_date: moment().add(12, 'hours'),
    user: repoUser._id,
  });

  try {
    // delete existing user's refresh tokens
    await UserRefreshToken.deleteMany({ user: repoUser._id });

    // save new user refresh token
    const tbiRepoUserRefreshTokenSaved = await tbiRepoUserRefreshToken.save();

    return resBase(
      {
        name: repoUser.name,
        token: jwt,
        refreshToken: tbiRepoUserRefreshTokenSaved.refresh_token,
      },
      response
    );
  } catch (error) {
    return resException(error, response);
  }
});

// get refresh token
rtAuthentication.post('/refresh', rtFtJwtRefresh, async (request, response) => {
  // search for user
  const repoUser = await User.findOne({ _id: request.user._id, refresh_token: request.user.refreshToken });
  if (!repoUser) return resNotFound('user', response);

  // search user refresh token
  const tbuRepoUserRefreshToken = await UserRefreshToken.findOne({ user: repoUser._id, refresh_token: request.body.refreshToken });
  if (!tbuRepoUserRefreshToken) return resUnauthorized(response);

  // make sure refresh token is not expired
  const refreshTokenExpiredDate = moment(tbuRepoUserRefreshToken.expired_date);
  const now = moment();
  if (refreshTokenExpiredDate.isAfter(now)) return resUnauthorized(response);

  // generate new jwt
  const jwt = generateJwt({ _id: repoUser._id });

  // update db model: user refresh token
  tbuRepoUserRefreshToken.expired_date = moment().add(12, 'hour');

  try {
    // save user refresh token
    await tbuRepoUserRefreshToken.save();

    return resBase(
      {
        token: jwt,
      },
      response
    );
  } catch (error) {
    return resException(error, response);
  }
});

// log out
rtAuthentication.get('/logout', rtFtJwt, async (request, response) => {
  // search for user
  const repoUser = await User.findOne({ _id: request.user._id });
  if (!repoUser) return resNotFound('user', response);

  try {
    // delete existing user's refresh tokens
    await UserRefreshToken.deleteMany({ user: request.user._id });

    return resBase(
      {
        name: repoUser.name,
      },
      response
    );
  } catch (error) {
    return resException(error, response);
  }
});

export default rtAuthentication;
