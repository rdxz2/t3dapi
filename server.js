// initialize express app
const express = require('express');
const app = express();

// read configuration file
const dotenv = require('dotenv');
dotenv.config();

// connect to mongodb
const mongoose = require('mongoose');
mongoose.connect(process.env.CONNECTIONSTRING_T3DDB, { useNewUrlParser: true }, () => {
  console.log('connected to database');
});

// START -- configure middleware

// data parser
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// endpoint routes
const rtAuthentication = require('./Routes/rtAuthentication');
app.use('/api/authentication', rtAuthentication);

// app.use('/user', ctrlUser);

// END -- configure middleware

// get port from environment variables
const port = process.env.PORT_T3DAPI || 3000;

// start server
app.listen(port, () => {
  console.log(`t3dapi is listening on port ${port}`);
});
