import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { Server } from 'http';
import mongoose from 'mongoose';
import cron from 'node-cron';
import socketIo from 'socket.io';
import webpush from 'web-push';

import crnReminder from './Crons/crnReminder';
import { resException, resNotFound } from './Responses/resBase';
import rtAuthentication from './Routes/rtAuthentication';
import rtBase from './Routes/rtBase';
import rtProject from './Routes/rtProject';
import rtPushNotification from './Routes/rtPushNotification';
import rtSelectList from './Routes/rtSelectList';
import rtTodo from './Routes/rtTodo';
import rtUser from './Routes/rtUser';
import makeStrmProjectHandler from './StreamProject/strmProjectHandler';
import StrmProjectProjectRoomManager from './StreamProject/strmProjectProjectRoomManager';
import rtUserPreference from './Routes/rtUserPreference';

// initialize express app
const app = express();

// initialize streaming server
const server = new Server(app);
const io = socketIo(server);

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

// configure push notification vapid details
webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_KEY_PUBLIC, process.env.VAPID_KEY_PRIVATE);

// START -- CONFIGURE MIDDLEWARE

// use cors
app.use(
  cors({
    origin: process.env.CORS_ORIGIN.split(', '),
  })
);

// data parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(express.static('public'));

// START -- ROUTES

app.use('/', rtBase);

app.use('/api/selectlist', rtSelectList);

app.use('/api/authentication', rtAuthentication);
app.use('/api/user', rtUser);
app.use('/api/preferences', rtUserPreference);

app.use('/api/project', rtProject);
app.use('/api/todo', rtTodo);

app.use('/api/pushnotification', rtPushNotification);

app.all('*', (request, response) => resNotFound(`route [${request.method}] ${request.url}`, response));

// END -- ROUTES

// global error handler (synchronous)
app.use((error, request, response, next) => {
  if (error) return resException(error, response);
});

// END -- CONFIGURE MIDDLEWARE

// get port from environment variables
const port = process.env.PORT || 5000;

// start server
server.listen(port, (error) => {
  if (error) console.error(error);
  else console.log(`t3dapi is listening on port ${port}`);
});

// START -- PROJECT STREAMING FUNCTIONALITY

// create a project room manager to manage all project rooms in this server
const projectRoomManager = new StrmProjectProjectRoomManager();

io.on('connection', (client) => {
  // create handlers
  const strmProjectHandler = makeStrmProjectHandler(client, projectRoomManager);

  // client entering project
  client.on('join', strmProjectHandler.handleJoin);

  // client leaving project
  client.on('leave', strmProjectHandler.handleLeave);

  // to do created
  client.on('todo_creating', strmProjectHandler.handleTodoCreating);

  // to do complete toggled
  client.on('todocomp_toggling', strmProjectHandler.handleTodoCompleteToggling);

  // to do important toggled
  client.on('todoimp_toggling', strmProjectHandler.handleTodoImportantToggling);

  // to do tag created
  client.on('todotag_creating', strmProjectHandler.handleTodoTagCreating);

  // to do tag deleted
  client.on('todotag_deleting', strmProjectHandler.handleTodoTagDeleting);

  // to do description edited
  client.on('tododesc_editing', strmProjectHandler.handleTodoDescriptionEditing);

  // to do detail edited
  client.on('tododetail_editing', strmProjectHandler.handleTodoDetailEditing);

  // to do priority edited
  client.on('todoprio_editing', strmProjectHandler.handleTodoPriorityEditing);

  // to do commented
  client.on('todo_commenting', strmProjectHandler.handleTodoCommenting);

  // to do work date edited
  client.on('todoworkdate_editing', strmProjectHandler.handleTodoWorkDateEditing);

  // START -- PREDEFINED LISTENERS

  // client disonnected from this server
  client.on('disconnect', (reason) => {
    console.warn(`client ${client.id} disconnected with reason '${reason}'`);
    strmProjectHandler.handleDisconnect();
  });

  // client got error
  client.on('error', (error) => {
    console.warn(`client ${client.id} got error`, error);
  });

  // END -- PREDEFINED LISTENERS

  // START -- REGISTER CRON JOBS

  // reminders
  cron.schedule('* * * * *', crnReminder);

  // END -- REGISTER CRON JOBS
});

// END -- PROJECT STREAMING FUNCTIONALITY
