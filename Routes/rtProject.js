import { Router } from 'express';
import moment from 'moment';

import Project from '../Models/mdlProject';
import User from '../Models/mdlUser';
import { resBase, resException, resNotFound, resValidationError } from '../Responses/resBase';
import rtftJwt from '../RouteFilters/rtFtJwt';
import { vldtProjectCreate } from '../Validations/vldtProject';

const rtProject = Router();

// get all

// get one
rtProject.get('/:projectCode', rtftJwt, async (request, response) => {
  // search project
  const repoProject = await Project.findOne({ $and: [{ code: request.params.projectCode }, { collaborators: request.user._id }] });
  if (!repoProject) return resNotFound(`project '${request.params.projectCode}'`, response);

  return resBase(repoProject, response);
});

// create
rtProject.post('/', rtftJwt, async (request, response) => {
  // validate model
  const { error: errorValidation } = vldtProjectCreate(request.body);
  if (errorValidation) return resValidationError(errorValidation, response);

  // make sure author is available
  const repoUserAuthor = await User.findOne({ _id: request.user._id });
  if (!repoUserAuthor) return resNotFound('author', response);

  // make sure collaborating users is available
  const repoUserCollaboratorsCount = await User.countDocuments({ _id: { $in: request.body.collaborators } });
  if (repoUserCollaboratorsCount !== request.body.collaborators.length) return resNotFound('collaborators', response);

  // automatically add the author to collaborators
  const collaborators = request.body.collaborators.concat(request.user._id);

  // make db model: project
  const tbiRepoProject = new Project({
    name: request.body.name,
    code: request.body.code,
    description: request.body.description,
    // link to user
    author: request.user._id,
    // link to users
    collaborators: collaborators,
  });

  try {
    // save project
    const tbiRepoProjectSaved = await tbiRepoProject.save();

    // update db model: users
    await User.updateMany(
      {
        _id: { $in: collaborators },
      },
      {
        // link to inserted project
        $push: {
          projects: {
            project: tbiRepoProjectSaved._id,
          },
        },
      }
    );

    return resBase(
      {
        code: tbiRepoProjectSaved.code,
        name: tbiRepoProjectSaved.name,
        author: repoUserAuthor.name,
        description: tbiRepoProjectSaved.description,
        last_accessed: moment(),
      },
      response
    );
  } catch (error) {
    return resException(error, response);
  }
});

// to dos
rtProject.get('/todos/:projectCode', rtftJwt, async (request, response) => {});

// activities
rtProject.get('/activities/:projectCode', rtftJwt, async (request, response) => {});

export default rtProject;
