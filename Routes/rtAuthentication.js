const router = require('express').Router();
const User = require('../Models/mdlUser');
const resBase = require('../Responses/resBase');
const cnstResponseStatusCode = require('../Constants/cnstResponseStatusCode');
const Joi = require();

// register
router.post('/register', async (request, response) => {
  // make db model
  const user = new User({
    name: request.body.username,
    email: request.body.email,
  });

  try {
    // save to db
    const userSaved = await user.save();

    return resBase(userSaved, response);
  } catch (error) {
    console.error(error);

    return resBase(error, response, cnstResponseStatusCode.BADREQUEST);
  }
});

// log in
router.post('/login', (request, response) => {
  response.send('Logging ing');
});

module.exports = router;
