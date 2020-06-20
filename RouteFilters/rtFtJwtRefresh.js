import jsonwebtoken from 'jsonwebtoken';
import moment from 'moment';
import { resUnauthorized } from '../Responses/resBase';

const rtFtJwt = (request, response, next) => {
  // get token from header
  const authorizationHeader = request.header('Authorization');
  if (!authorizationHeader) return resUnauthorized(response);

  // get only the jwt string
  const jwt = authorizationHeader.replace('Bearer ', '');

  // validate jwt (ignore exp)
  jsonwebtoken.verify(jwt, process.env.JWT_SECRET, { issuer: process.env.JWT_ISS, audience: process.env.JWT_AUD, ignoreExpiration: true }, (error, userInformation) => {
    // get current epoch time
    const currentEpochTime = moment().valueOf();

    // make sure jwt is already expired
    if (error || userInformation.exp > currentEpochTime) return resUnauthorized(response);

    // set user information
    request.user = userInformation;

    next();
  });
};

export default rtFtJwt;
