import jsonwebtoken from 'jsonwebtoken';

import { resUnauthorized } from '../Responses/resBase';

const rtFtJwt = (request, response, next) => {
  // get token from header
  const authorizationHeader = request.header('Authorization');
  if (!authorizationHeader) return resUnauthorized(response);

  // get only the jwt string
  const jwt = authorizationHeader.replace('Bearer ', '');

  // validate jwt
  return jsonwebtoken.verify(jwt, process.env.JWT_SECRET, { issuer: process.env.JWT_ISS, audience: process.env.JWT_AUD, ignoreExpiration: false }, (error, userInformation) => {
    if (error) return resUnauthorized(response);

    // set user information
    request.user = userInformation;

    return next();
  });
};

export default rtFtJwt;
