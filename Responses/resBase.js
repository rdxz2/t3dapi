const packageJson = require('../package.json');
const cnstResponseStatusCode = require('../Constants/cnstResponseStatusCode');

// get app version
const appVersion = packageJson.version;

const resBase = (data, response, statusCode = cnstResponseStatusCode.OK) => {
  // make a structured response
  const structuredResponse = {
    status: statusCode,
    version: appVersion,
    data: data,
  };

  // set status code
  if (statusCode !== cnstResponseStatusCode.OK) response.status(statusCode);

  // send response
  response.send(structuredResponse);

  // end response
  response.end();
};

module.exports = resBase;
