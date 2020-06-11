const mongoose = require('mongoose');

const scmUser = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    min: 3,
  },
  email: {
    type: String,
    required: true,
    max: 100,
  },
  password: {
    type: String,
    required: true,
    max: 1024,
  },
  cd: {
    type: Date,
    default: Date.now,
  },
  ud: {
    type: Date,
  },
});

module.exports = mongoose.model('User', scmUser);
