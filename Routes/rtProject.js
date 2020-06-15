import { Router, request } from 'express';
import moment from 'moment';

import Project from '../Models/mdlProject';
import User from '../Models/mdlUser';
import { resBase, resException, resNotFound, resValidationError, resIsExist } from '../Responses/resBase';
import rtftJwt from '../RouteFilters/rtFtJwt';
import { vldtProjectCreate, vldtProjectEdit } from '../Validations/vldtProject';

const rtProject = Router();

// get all

// get one
rtProject.get('/:projectCode', rtftJwt, async (request, response) => {
  // search project
  const repoProject = await Project.findOne({ $and: [{ code: request.params.projectCode }, { $or: [{ author: request.user._id }, { collaborators: request.user._id }] }] });
  if (!repoProject) return resNotFound(`project '${request.params.projectCode}'`, response);

  return resBase(repoProject, response);
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
  const tbuRepoUserAuthor = await User.findOne({ _id: request.user._id });
  if (!tbuRepoUserAuthor) return resNotFound('author', response);

  // make sure collaborating users is available
  const tbuRepoUsersCollaborator = await User.find({ _id: { $in: request.body.collaborators } });
  if (tbuRepoUsersCollaborator.length !== request.body.collaborators.length) return resNotFound('collaborators', response);

  // make db model: project
  const tbiRepoProject = new Project({
    name: request.body.name,
    code: request.body.code,
    description: request.body.description,
    // link to user
    author: request.user._id,
    // link to users
    collaborators: request.body.collaborators,
  });

  try {
    // save project
    const tbiRepoProjectSaved = await tbiRepoProject.save();

    // START -- UPDATE MODEL -- V2

    // update db model: user (author)
    tbuRepoUserAuthor.projects.push({ project: tbiRepoProjectSaved._id });

    // save user (author)
    tbuRepoUserAuthor.save();

    // update db model: users (collaborators)
    tbuRepoUsersCollaborator.forEach(async (tbuRepoUserCollaborator) => {
      // link to inserted project
      tbuRepoUserCollaborator.projects.push({ project: tbiRepoProjectSaved._id });

      // save user (collaborators)
      await tbuRepoUserCollaborator.save();
    });

    // END -- UPDATE MODEL -- V2

    // START -- UPDATE MODEL -- V1

    // // update db model: users
    // await User.updateMany(
    //   {
    //     _id: { $in: collaborators },
    //   },
    //   {
    //     // link to inserted project
    //     $push: {
    //       projects: {
    //         project: tbiRepoProjectSaved._id,
    //       },
    //     },
    //   }
    // );

    // END -- UPDATE MODEL -- V1

    return resBase(
      {
        code: tbiRepoProjectSaved.code,
        name: tbiRepoProjectSaved.name,
        author: tbuRepoUserAuthor.name,
        description: tbiRepoProjectSaved.description,
        last_accessed: moment(),
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
  const repoProject = await Project.findOne({ $and: [{ code: request.params.projectCode }, { author: request.user._id }] }).select('-_id code name description collaborators');
  if (!repoProject) return resNotFound(`project '${request.params.projectCode}'`, response);

  return resBase(repoProject, response);
});

// edit
rtProject.patch('/:projectCode', rtftJwt, async (request, response) => {
  // validate model
  const { error: errorValidation } = vldtProjectEdit(request.body);
  if (errorValidation) return resValidationError(errorValidation, response);

  // make sure project code is available
  const repoProjectCount = await Project.countDocuments({ code: request.body.code });
  if (repoProjectCount) return resIsExist(`project ${request.body.code}`, response);

  // search for project
  const tbuRepoProject = await Project.findOne({ $and: [{ code: request.params.projectCode }, { collaborators: request.user._id }] });
  if (!tbuRepoProject) return resNotFound(`project ${request.params.projectCode}`, response);

  // make sure author is available
  const repoUserAuthor = await User.findOne({ _id: request.user._id });
  if (!repoUserAuthor) return resNotFound('author', response);

  // make sure new collaborators is available
  const tbuRepoUsersNewCollaborator = await User.find({ _id: { $nin: tbuRepoProject.collaborators, $in: request.body.collaborators } });
  if (tbuRepoUsersNewCollaborator.length !== request.body.collaborators.length) return resNotFound(`${request.body.collaborators.length - tbuRepoUsersNewCollaborator.length} collaborators`, response);

  // get not collaborating collaborators
  const tbdRepoUsersAlrCollaborating = await User.find({ _id: { $in: tbuRepoProject.collaborators, $nin: request.body.collaborators } });
  if (tbdRepoUsersAlrCollaborating.length !== tbuRepoProject.collaborators.length) return resNotFound();

  // get current time
  const now = moment();

  // update db model: project
  tbuRepoProject.code = request.body.code;
  tbuRepoProject.name = request.body.code;
  tbuRepoProject.description = request.body.description;
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
rtProject.get('/activities/:projectCode', rtftJwt, async (request, response) => {});

export default rtProject;
