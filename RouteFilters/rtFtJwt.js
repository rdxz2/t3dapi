import jsonwebtoken from 'jsonwebtoken';

import { resUnauthorized } from '../Responses/resBase';

const rtFtJwt = (request, response, next) => {
  // get token from header
  const authorizationHeader = request.header('Authorization');
  if (!authorizationHeader) return resUnauthorized(response);

  // get only the jwt string
  const jwt = authorizationHeader.replace('Bearer ', '');

  try {
    // validate jwt
    const userInformation = jsonwebtoken.verify(jwt, process.env.JWT_SECRET, { issuer: process.env.JWT_ISS, audience: process.env.JWT_AUD, ignoreExpiration: false });

    // append user information on request object
    request.user = userInformation;

    next();
  } catch (error) {
    return resUnauthorized(response);
  }
};

export default rtFtJwt;
