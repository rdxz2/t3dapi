import { json, urlencoded } from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { Server } from 'http';
import makeStrmProjectHandler from './StreamProject/strmProjectHandler';
import mongoose from 'mongoose';

import { resNotFound, resException } from './Responses/resBase';
import rtAuthentication from './Routes/rtAuthentication';
import rtBase from './Routes/rtBase';
import rtSelectList from './Routes/rtSelectList';
import rtUser from './Routes/rtUser';
import rtProject from './Routes/rtProject';
import rtTodo from './Routes/rtTodo';
import socketIo from 'socket.io';
// import StrmProjectClientManager from './StreamProject/strmProjectClientManager';
import StrmProjectProjectRoomManager from './StreamProject/strmProjectProjectRoomManager';

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

// START -- CONFIGURE MIDDLEWARE

// use cors
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

// data parser
app.use(urlencoded({ extended: true }));
app.use(json());

// START -- ROUTES

app.use('/', rtBase);

app.use('/api/selectlist', rtSelectList);

app.use('/api/authentication', rtAuthentication);
app.use('/api/user', rtUser);

app.use('/api/project', rtProject);
app.use('/api/todo', rtTodo);

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

  // to do tag created
  client.on('todotag_creating', strmProjectHandler.handleTodoTagCreating);

  // to do tag deleted
  client.on('todotag_deleting', strmProjectHandler.handleTodoTagDeleting);

  // to do description edited
  client.on('tododesc_editing', strmProjectHandler.handleTodoDescriptionEditing);

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
});

// END -- PROJECT STREAMING FUNCTIONALITY
