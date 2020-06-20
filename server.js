import { json, urlencoded } from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';

import { resNotFound, resException } from './Responses/resBase';
import rtAuthentication from './Routes/rtAuthentication';
import rtBase from './Routes/rtBase';
import rtSelectList from './Routes/rtSelectList';
import rtUser from './Routes/rtUser';
import rtProject from './Routes/rtProject';
import rtToDo from './Routes/rtToDo';

// initialize express app
const app = express();

// read configuration file
dotenv.config();

// connect to mongodb
mongoose.connect(
  // provide connection string
  process.env.CONNECTIONSTRING_T3DDB,
  // configuration
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  // callback
  (error) => {
    if (error) return console.error(error);
    return console.log(`connected to database ${process.env.CONNECTIONSTRING_T3DDB}`);
  }
);

// START -- configure middleware

// use cors
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

// data parser
app.use(urlencoded({ extended: true }));
app.use(json());

// START -- routes

app.use('/', rtBase);

app.use('/api/selectlist', rtSelectList);

app.use('/api/authentication', rtAuthentication);
app.use('/api/user', rtUser);

app.use('/api/project', rtProject);
app.use('/api/todo', rtToDo);

app.all('*', (request, response) => resNotFound(`route [${request.method}] ${request.url}`, response));

// END -- routes

// END -- configure middleware

// get port from environment variables
const port = process.env.PORT_T3DAPI || 3000;

// start server
app.listen(port, () => {
  console.log(`t3dapi is listening on port ${port}`);
});
