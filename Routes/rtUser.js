import { Router } from 'express';
import fs from 'fs';
import { toInteger } from 'lodash';
import moment from 'moment';
import mongoose from 'mongoose';
import multer from 'multer';

import SCHEDULE_TYPE from '../Constants/SCHEDULE_TYPE';
import TIMEFORMAT from '../constants/TIMEFORMAT';
import Project from '../Models/mdlProject';
import ProjectActivity from '../Models/mdlProjectActivitiy';
import User from '../Models/mdlUser';
import { resBase, resNotFound, resSingleValidationError, resTable, resException } from '../Responses/resBase';
import rtFtJwt from '../RouteFilters/rtFtJwt';
import { calculateSkipValue, generateRandomString, getFileExtension, generateUrlFromFileName } from '../Utilities/utlType';

const rtUser = Router();

// specify form data storage location
const upload = multer({
  storage: multer.diskStorage({
    destination: (request, file, callback) => {
      // get folder name from configuration
      const folderName = process.env.FPATH_USER_PP;

      // create folder if not exist
      fs.mkdirSync(folderName, { recursive: true });

      callback(null, process.env.FPATH_USER_PP);
    },
    filename: (request, file, callback) => {
      callback(null, `${moment().format(TIMEFORMAT.YYYYMMDDHHMMSS)}-${generateRandomString()}.${getFileExtension(file.originalname)}`);
    },
  }),
});

// user's minimal information
rtUser.get('/profileminimal/:id', rtFtJwt, async (request, response) => {
  // search user
  const repoUser = await User.findOne({
    // by id
    _id: request.params.id,
  })
    .populate('department', '-_id name')
    .populate('position', '-_id name')
    .select('-_id username name file_profile_picture');

  // validate
  if (!repoUser) return resNotFound('user', response);
  if (!repoUser.department) return resNotFound('user department', response);
  if (!repoUser.position) return resNotFound('user position', response);

  return resBase(
    {
      username: repoUser.username,
      name: repoUser.name,
      url_profile_picture: generateUrlFromFileName(process.env.PPATH_USER_PP, repoUser.file_profile_picture),
      department: repoUser.department,
      position: repoUser.position,
    },
    response
  );
});

// recent projects
rtUser.get('/recentprojects', rtFtJwt, async (request, response) => {
  // set recent date to last month
  const minRecentDate = moment().add(-1, 'months').toDate();

  // search user
  const repoUserRecentProjects = await User.aggregate([
    { $match: { _id: mongoose.Types.ObjectId(request.user.id) } },
    { $unwind: '$projects' },
    { $lookup: { from: 'projects', localField: 'projects.project', foreignField: '_id', as: 'projects.fk_project' } },
    { $unwind: '$projects.fk_project' },
    { $lookup: { from: 'users', localField: 'projects.fk_project.author', foreignField: '_id', as: 'projects.fk_project.fk_author' } },
    { $unwind: '$projects.fk_project.fk_author' },
    { $sort: { 'projects.last_accessed': -1 } },
    { $group: { _id: '$_id', projects: { $push: '$projects' } } },
    {
      $project: {
        _id: 0,
        projects: {
          $filter: {
            input: '$projects',
            as: 'project',
            cond: {
              $and: [
                { $gt: ['$$project.last_accessed', minRecentDate] },
                { $or: [{ $regexMatch: { input: '$$project.fk_project.name', regex: request.query.search || '', options: 'i' } }, { $regexMatch: { input: '$$project.fk_project.code', regex: request.query.search || '', options: 'i' } }] },
              ],
            },
          },
        },
      },
    },
    { $project: { projects: { last_accessed: 1, fk_project: { name: 1, code: 1, description: 1, author: 1, fk_author: { name: 1 } } } } },
  ]);
  if (!repoUserRecentProjects.length) return resBase([], response);

  // map user's recent project
  const recentProjects = repoUserRecentProjects[0].projects.map((project) => ({
    code: project.fk_project.code,
    name: project.fk_project.name,
    author: project.fk_project.fk_author.name,
    description: project.fk_project.description,
    last_accessed: project.last_accessed,
    is_owning: project.fk_project.author.toString() === request.user.id,
  }));

  return resBase(recentProjects, response);
});

// all projects
rtUser.get('/projects', rtFtJwt, async (request, response) => {
  // get projects
  const repoProjects = await Project.find({ $or: [{ author: request.user.id }, { collaborators: request.user.id }] })
    .populate('author', 'name')
    .select('code name description collaborators');

  // construct view model
  const vm = repoProjects.map((repoProject) => ({
    code: repoProject.code,
    name: repoProject.name,
    description: repoProject.description,
    author: repoProject.author,
    collaboratorsCount: repoProject.collaborators.length,
  }));

  return resBase(vm, response);
});

// recent activities
rtUser.get('/recentactivities', rtFtJwt, async (request, response) => {
  // convert page size
  const pageSize = toInteger(request.query.pageSize);
  if (!pageSize) return resSingleValidationError('page size', response);

  // convert current page
  const currentPage = toInteger(request.query.currentPage);
  if (!currentPage) return resSingleValidationError('page number', response);

  // search project activities
  const filter = { actor: request.user.id };
  const repoProjectActivitiesCount = await ProjectActivity.countDocuments(filter);
  const repoProjectActivities = await ProjectActivity.find(filter).sort('-create_date').skip(calculateSkipValue(pageSize, currentPage)).limit(pageSize).populate('actor', 'name').select('-__v');

  return resTable(repoProjectActivities, repoProjectActivitiesCount, response);
});

// calendar schedules
rtUser.get('/schedule', rtFtJwt, async (request, response) => {
  // construct start date and end date
  const startDate = moment(request.query.date).startOf('month').toDate();
  const endDate = moment(request.query.date).endOf('month').toDate();

  const userId = mongoose.Types.ObjectId(request.user.id);

  // search user's project todo deadlines
  const repoProjects = await Project.aggregate([
    // search user id
    { $match: { $or: [{ author: userId }, { collaborators: userId }] } },
    // join to todo
    { $lookup: { from: 'todos', foreignField: 'project', localField: '_id', as: 'todos' } },
    // explode joined todo
    { $unwind: '$todos' },
    // filter todo's end date by start date and end date
    { $match: { $and: [{ 'todos.date_end': { $gte: startDate } }, { 'todos.date_end': { $lte: endDate } }] } },
    // group back by project id
    { $group: { _id: '$_id', todos: { $push: '$todos' } } },
    // select
    { $project: { _id: 1, todos: { description: 1, priority: 1, is_important: 1, date_start: 1 } } },
  ]);

  // map results to viewmodel
  const userProjectsTodo = [].concat(
    ...repoProjects.map((project) =>
      project.todos.map((todo) => ({
        description: todo.description,
        isImportant: todo.is_important,
        priority: todo.priority,
        date: todo.date_start,
        type: SCHEDULE_TYPE.TODO_DATEEND,
      }))
    )
  );

  // search user's reminders
  const repoUsers = await User.aggregate([
    // search user id
    { $match: { _id: userId } },
    // explode todo reminders
    { $unwind: '$todo_reminders' },
    // filter remind date by start date and end date
    { $match: { $and: [{ 'todo_reminders.remind_date': { $gte: startDate } }, { 'todo_reminders.remind_date': { $lte: endDate } }] } },
    // join to todo
    { $lookup: { from: 'todos', foreignField: '_id', localField: 'todo_reminders.todo', as: 'todo_reminders.todo' } },
    // explode the joined todo
    { $unwind: '$todo_reminders.todo' },
    // group back by user id
    { $group: { _id: '$_id', reminders: { $push: '$todo_reminders' } } },
    // select
    { $project: { _id: 1, reminders: { remind_date: 1, todo: { description: 1, priority: 1, is_important: 1 } } } },
  ]);

  // map results to viewmodel
  const userReminders =
    repoUsers.length > 0
      ? repoUsers[0].reminders.map((reminder) => ({
          description: reminder.todo.description,
          isImportant: reminder.todo.is_important,
          priority: reminder.todo.priority,
          date: reminder.remind_date,
          type: SCHEDULE_TYPE.TODO_REMINDER,
        }))
      : [];

  return resBase(userReminders.concat(userProjectsTodo), response);
});

// profile (full)
rtUser.get('/profile', rtFtJwt, async (request, response) => {
  // search user
  const repoUser = await User.findOne({ _id: request.user.id }).populate('department', 'name').populate('position', 'name').select('-__v -password -todo_reminder');
  if (!repoUser) return resNotFound('user', response);

  return resBase(
    {
      username: repoUser.username,
      email: repoUser.email,
      name: repoUser.name,
      password: repoUser.password,
      create_date: repoUser.create_date,
      update_date: repoUser.update_date,
      is_active: repoUser.is_active,
      department: repoUser.department,
      position: repoUser.position,
      projects: repoUser.projects,
      file_profile_picture: repoUser.file_profile_picture,
      url_profile_picture: generateUrlFromFileName(process.env.PPATH_USER_PP, repoUser.file_profile_picture),
    },
    response
  );
});

// notifications
rtUser.get('/notifications', rtFtJwt, async (request, response) => {
  return resBase([], response);
});

// get preferences
rtUser.get('/preferences', rtFtJwt, async (request, response) => {
  return resBase('not implemented', response);
});

// change profile picture
rtUser.post('/profilepicture', [rtFtJwt, upload.single('profile_picture')], async (request, response) => {
  // get user
  var repoUser = await User.findOne({ _id: request.user.id });
  if (!repoUser) return resNotFound('user', response);

  // get current time
  const now = moment();

  // edit user
  repoUser.file_profile_picture = request.file.filename;
  repoUser.update_date = now;

  try {
    // save user
    const repoUserSaved = await repoUser.save();

    return resBase({ url_profile_picture: generateUrlFromFileName(process.env.PPATH_USER_PP, repoUserSaved.file_profile_picture) }, response);
  } catch (error) {
    return resException(error, response);
  }
});

// change detail

// set preferences
rtUser.post('/preferences', rtFtJwt, async (request, response) => {
  return resBase('not implemented', response);
});

export default rtUser;
