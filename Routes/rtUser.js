import { Router } from 'express';
import moment from 'moment';
import mongoose from 'mongoose';

import User from '../Models/mdlUser';
import { resBase, resNotFound } from '../Responses/resBase';
import rtFtJwt from '../RouteFilters/rtFtJwt';

const rtUser = Router();

// user's minimal information
rtUser.get('/profileMinimal', rtFtJwt, async (request, response) => {
  // search user
  const repoUser = await User.findOne({
    // by id
    _id: request.user._id,
  })
    .populate('department', '-_id name')
    .populate('position', '-_id name')
    .select('-_id username name');
  // validate
  if (!repoUser) return resNotFound('user', response);
  if (!repoUser.department) return resNotFound('user department', response);
  if (!repoUser.position) return resNotFound('user position', response);

  return resBase(repoUser, response);
});

// recent projects
rtUser.get('/recentprojects', rtFtJwt, async (request, response) => {
  // set recent date to last month
  const minRecentDate = moment().add(-1, 'months').toDate();

  // search user
  const repoUserRecentProjects = await User.aggregate([
    { $match: { _id: mongoose.Types.ObjectId(request.user._id) } },
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
    is_owning: project.fk_project.author.toString() === request.user._id,
  }));

  return resBase(recentProjects, response);
});

// recent activities
rtUser.get('/recentactivities', rtFtJwt, (request, response) => {
  return resBase([], response);
});

// calendar schedules
rtUser.get('/schedule', rtFtJwt, (request, response) => {
  return resBase([], response);
});

// notifications
rtUser.get('/notifications', rtFtJwt, (request, response) => {
  return resBase([], response);
});

// get preferences
rtUser.get('/preferences', rtFtJwt, (request, response) => {
  return resBase('not implemented', response);
});

// set preferences
rtUser.post('/preferences', rtFtJwt, (request, response) => {
  return resBase('not implemented', response);
});

export default rtUser;
