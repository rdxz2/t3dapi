import HTTPSTATUS from '../Constants/HTTPSTATUS';
import packageJson from '../package.json';
import { getValidationErrorMessage } from '../Utilities/utlValidation';

// get app version
const appVersion = packageJson.version;

// main response maker
export const resBase = (data, response, statusCode = HTTPSTATUS.OK) => {
  // make a structured response
  const structuredResponse = {
    version: appVersion,
    data: data,
  };

  // set status code
  if (statusCode !== HTTPSTATUS.OK) response.status(statusCode);

  // send response
  response.send(structuredResponse);

  // end response
  response.end();
};

// not authorized
export const resUnauthorized = (response) => resBase('you are not authorized..', response, HTTPSTATUS.UNAUTHORIZED);

// validation error
export const resValidationError = (errorValidation, response) => resBase(getValidationErrorMessage(errorValidation), response, HTTPSTATUS.BADREQUEST);

// single validation error
export const resSingleValidationError = (data, response) => resBase(`${data} is invalid`, response, HTTPSTATUS.BADREQUEST);

// already exist
export const resIsExist = (data, response) => resBase(`${data} is already exist`, response, HTTPSTATUS.BADREQUEST);

// not found
export const resNotFound = (data, response) => resBase(`${data} not found`, response, HTTPSTATUS.NOTFOUND);

// exception
export const resException = (exception, response) => {
  console.error(exception);
  return resBase('got exception..', response, HTTPSTATUS.SERVERERROR);
};
