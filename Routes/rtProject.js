import { Router } from 'express';
import moment from 'moment';

import Project from '../Models/mdlProject';
import ProjectActivity from '../Models/mdlProjectActivitiy';
import User from '../Models/mdlUser';
import { resBase, resException, resNotFound, resValidationError, resIsExist, resSingleValidationError } from '../Responses/resBase';
import rtftJwt from '../RouteFilters/rtFtJwt';
import { vldtProjectCreate, vldtProjectEdit } from '../Validations/vldtProject';
import PROJECT from '../Constants/PROJECT';
import { toInteger } from 'lodash';

const rtProject = Router();

// get all
rtProject.get('/', rtftJwt, async (request, response) => {
  return resBase([], response);
});

// get one
rtProject.get('/:projectCode', rtftJwt, async (request, response) => {
  // search project
  const repoProject = await Project.findOne({ $and: [{ code: request.params.projectCode }, { $or: [{ author: request.user.id }, { collaborators: request.user.id }] }] });
  if (!repoProject) return resNotFound(`project '${request.params.projectCode}'`, response);

  // get current user
  const tbuRepoUser = await User.findOne({ _id: request.user.id });
  if (!tbuRepoUser) return resNotFound('user', response);

  // get current time
  const now = moment();

  // update db model: user
  const tbuRepoUserProject = tbuRepoUser.projects.find((project) => project.project.toString() === repoProject._id.toString());
  tbuRepoUserProject.last_accessed = now;

  try {
    // save user
    await tbuRepoUser.save();

    return resBase(
      {
        code: repoProject.code,
        name: repoProject.name,
        is_owning: repoProject.author.toString() === request.user.id,
      },
      response
    );
  } catch (error) {
    return resException(error, response);
  }
});

// create
rtProject.post('/', rtftJwt, async (request, response) => {
  // validate model
  const { error: errorValidation } = vldtProjectCreate(request.body);
  if (errorValidation) return resValidationError(errorValidation, response);

  // make sure project code is available
  const repoProjectCount = await Project.countDocuments({ code: request.body.code });
  if (repoProjectCount) return resIsExist(`project ${request.body.code}`, response);

  // make sure author is available
  const tbuRepoUserAuthor = await User.findOne({ _id: request.user.id }).select('name projects');
  if (!tbuRepoUserAuthor) return resNotFound('author', response);

  // make sure collaborating users is available
  const tbuRepoUsersCollaborator = await User.find({ _id: { $in: request.body.collaborators } });
  if (tbuRepoUsersCollaborator.length !== request.body.collaborators.length) return resNotFound('collaborators', response);

  // make db model: project
  const tbiRepoProject = new Project({
    code: request.body.code,
    name: request.body.name,
    description: request.body.description,
    // link to user
    author: request.user.id,
    // link to users
    collaborators: request.body.collaborators,
  });

  // make db model: project activity
  const tbiRepoProjectActivity = new ProjectActivity({
    // link to project
    project: tbiRepoProject._id,
    project_action: PROJECT.ACTION.CREATE,
    project_code: tbiRepoProject.code,
    project_naem: tbiRepoProject.name,
    // link to user
    actor: request.user.id,
  });

  // update db model: user (author)
  tbuRepoUserAuthor.projects.push({ project: tbiRepoProject._id });

  // update db model: users (collaborators)
  tbuRepoUsersCollaborator.forEach(async (tbuRepoUserCollaborator) => {
    // link to inserted project
    tbuRepoUserCollaborator.projects.push({ project: tbiRepoProject._id });

    // save user (collaborators)
    await tbuRepoUserCollaborator.save();
  });

  try {
    // save project
    const tbiRepoProjectSaved = await tbiRepoProject.save();

    // save project activity
    await tbiRepoProjectActivity.save();

    // save user (author)
    await tbuRepoUserAuthor.save();

    // END -- UPDATE MODEL -- V1

    return resBase(
      {
        code: tbiRepoProjectSaved.code,
        name: tbiRepoProjectSaved.name,
        author: tbuRepoUserAuthor.name,
        description: tbiRepoProjectSaved.description,
        last_accessed: moment(),
        is_owning: true,
      },
      response
    );
  } catch (error) {
    return resException(error, response);
  }
});

// get one for edit
rtProject.get('/edit/:projectCode', rtftJwt, async (request, response) => {
  // search project
  const repoProject = await Project.findOne({ $and: [{ code: request.params.projectCode }, { author: request.user.id }] }).select('-_id code name description collaborators');
  if (!repoProject) return resNotFound(`project '${request.params.projectCode}'`, response);

  return resBase(repoProject, response);
});

// edit
rtProject.put('/:projectCode', rtftJwt, async (request, response) => {
  // validate model
  const { error: errorValidation } = vldtProjectEdit(request.body);
  if (errorValidation) return resValidationError(errorValidation, response);

  // make sure project code is available (only if old and new project code is different)
  if (request.params.projectCode !== request.body.code) {
    const repoProjectCount = await Project.countDocuments({ code: request.body.code });
    if (repoProjectCount) return resIsExist(`project ${request.body.code}`, response);
  }

  // search for project
  const tbuRepoProject = await Project.findOne({ $and: [{ code: request.params.projectCode }, { author: request.user.id }] });
  if (!tbuRepoProject) return resNotFound(`project ${request.params.projectCode}`, response);

  // make sure author is available
  const repoUserAuthor = await User.findOne({ _id: request.user.id });
  if (!repoUserAuthor) return resNotFound('author', response);

  // get new collaborators
  const tbuRepoUsersNewCollaboratorId = request.body.collaborators.filter((collaboratorId) => !tbuRepoProject.collaborators.includes(collaboratorId));
  const tbuRepoUsersNewCollaborator = await User.find({ _id: { $in: tbuRepoUsersNewCollaboratorId } });
  if (tbuRepoUsersNewCollaborator.length !== tbuRepoUsersNewCollaboratorId.length) return resNotFound(`${request.body.collaborators.length - tbuRepoUsersNewCollaborator.length} collaborators`, response);

  // get not collaborating collaborators
  const tbdRepoUsersAlrCollaboratingId = tbuRepoProject.collaborators.filter((collaboratorId) => !request.body.collaborators.includes(collaboratorId));
  const tbdRepoUsersAlrCollaborating = await User.find({ _id: { $in: tbdRepoUsersAlrCollaboratingId } });
  if (tbdRepoUsersAlrCollaborating.length !== tbdRepoUsersAlrCollaboratingId.length) return resNotFound();

  // get current time
  const now = moment();

  // update db model: project
  tbuRepoProject.code = request.body.code;
  tbuRepoProject.name = request.body.name;
  tbuRepoProject.description = request.body.description;
  tbuRepoProject.collaborators = request.body.collaborators;
  tbuRepoProject.update_date = now;

  try {
    // save project
    const tbuRepoProjectSaved = await tbuRepoProject.save();

    // update db model: users (new collaborator)
    tbuRepoUsersNewCollaborator.forEach(async (tbuRepoUserNewCollaborator) => {
      // add this project to user's project list
      tbuRepoUserNewCollaborator.projects.push({ project: tbuRepoProjectSaved._id });

      // save user (new collaborator)
      await tbuRepoUserNewCollaborator.save();
    });

    // update db model: users (not collaborating anymore)
    tbdRepoUsersAlrCollaborating.forEach(async (tbdRepoUserAlrCollaborating) => {
      // get to be deleted project
      const tbuRepoUserAlrCollaboratingProjectIndex = tbdRepoUserAlrCollaborating.projects.indexOf((project) => project.project === tbuRepoProjectSaved._id);

      // delete this project from user's project list
      tbdRepoUserAlrCollaborating.projects.splice(tbuRepoUserAlrCollaboratingProjectIndex, 1);

      // save user (not collaborating anymore)
      await tbdRepoUserAlrCollaborating.save();
    });

    return resBase(
      {
        codeBefore: request.params.projectCode,
        code: tbuRepoProjectSaved.code,
        name: tbuRepoProjectSaved.name,
        author: repoUserAuthor.name,
        description: tbuRepoProjectSaved.description,
        last_accessed: moment(),
      },
      response
    );
  } catch (error) {
    return resException(error, response);
  }
});

// get activities
rtProject.get('/activities/:projectCode', rtftJwt, async (request, response) => {
  // convert page size
  const pageSize = toInteger(request.query.pageSize);
  if (!pageSize) return resSingleValidationError('page size', response);

  // convert current page
  const currentPage = toInteger(request.query.currentPage);
  if (!currentPage) return resSingleValidationError('page number', response);

  // search project
  const repoProjects = await Project.aggregate([
    // selected project code
    { $match: { code: request.params.projectCode } },
    // join: projects - project_activities
    { $lookup: { from: 'project_activities', localField: '_id', foreignField: 'project', as: 'project_activities' } },
    // join: projects - todos
    { $lookup: { from: 'todos', localField: '_id', foreignField: 'project', as: 'todos' } },
    // join: todos - project_activities
    { $lookup: { from: 'project_activities', localField: 'todos._id', foreignField: 'todo', as: 'todos.todo_activities' } },
    // explode activities from project (note: this can be moved below the joining process of projects - project_activities at the cost of brevity)
    { $unwind: { path: '$project_activities', preserveNullAndEmptyArrays: true } },
    // explode activities from to do
    { $unwind: { path: '$todos.todo_activities', preserveNullAndEmptyArrays: true } },
    // group by activities from project and to do by selected project code
    { $group: { _id: '$code', project_activities: { $push: '$project_activities' }, todo_activities: { $push: '$todos.todo_activities' } } },
    // combine activities from project and to do
    { $project: { _id: '$_id', activities: { $setUnion: ['$project_activities', '$todo_activities'] } } },
    // explode activities to be sorted
    { $unwind: { path: '$activities', preserveNullAndEmptyArrays: true } },
    // join: project_activities (from project & to do) - users
    { $lookup: { from: 'users', localField: 'activities.actor', foreignField: '_id', as: 'activities.actor' } },
    // explode users
    { $unwind: { path: '$activities.actor', preserveNullAndEmptyArrays: true } },
    // sort descending by create_date
    { $sort: { 'activities.create_date': -1 } },
    // make a branch pipeline
    {
      $facet: {
        // count all filtered data for max available paging to client
        allData: [{ $group: { _id: null, count: { $sum: 1 } } }],
        // make a paginated data
        paginatedData: [
          // apply pagination
          { $skip: pageSize * (currentPage - 1) },
          { $limit: pageSize },
          // group the unwinded, sorted, and paged activities
          { $group: { _id: '$_id', activities: { $push: '$activities' } } },
        ],
      },
    },
    // explode count on 'allData' so we don't need to acces them as an array because of the group pipeline
    { $unwind: { path: '$allData', preserveNullAndEmptyArrays: true } },
    // select
    {
      $project: {
        allData: { count: 1 },
        paginatedData: {
          activities: {
            _id: 1,
            project_action: 1,
            project_code: 1,
            project_name: 1,
            todo_action: 1,
            todo_description: 1,
            todo_description_new: 1,
            todo_completed: 1,
            todo_important: 1,
            todo_priority: 1,
            todo_priority_new: 1,
            todo_tag: 1,
            create_date: 1,
            actor: { _id: 1, name: 1 },
          },
        },
      },
    },
  ]);

  // get first element
  const repoProject = repoProjects[0];

  // map project activities
  const projectActivities = repoProject.paginatedData[0] ? repoProject.paginatedData[0].activities.map((projectActivity) => projectActivity) : [];

  return resBase({ projectActivitiesTotalData: repoProject.allData.count || 0, projectActivities }, response);
});

// get collaborators
rtProject.get('/collaborators/:projectCode', rtftJwt, async (request, response) => {
  // search project
  const repoProject = await Project.findOne({ code: request.params.projectCode }).select('-_id collaborators').populate('collaborators', 'name').populate('author', 'name');
  if (!repoProject) return resNotFound(`project ${request.params.projectCode}`, response);

  // get collaborator names
  const collaborators = repoProject.collaborators.map((collaborator) => ({ id: collaborator._id, name: collaborator.name }));

  // join with author as fixed collaborator
  collaborators.push({ id: repoProject.author._id, name: repoProject.author.name });

  return resBase(collaborators, response);
});

export default rtProject;
