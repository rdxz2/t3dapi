import { Router } from 'express';
import { resBase, resValidationError, resException, resNotFound } from '../Responses/resBase';
import rtFtJwt from '../RouteFilters/rtFtJwt';
import { vldtToDoCreate } from '../Validations/vldtToDo';
import Todo from '../Models/mdlTodo';
import Project from '../Models/mdlProject';
import moment from 'moment';
const rtToDo = Router();

// get all
rtToDo.get('/:projectCode', rtFtJwt, async (request, response) => {
  // get project
  const repoProject = await Project.findOne({ code: request.params.projectCode }).select('_id');
  if (!repoProject) return resNotFound(`project ${request.params.projectCode}`, response);

  // search to do for this project
  const repoToDos = await Todo.find({ project: repoProject._id, description: { $regex: request.query.search || '', $options: 'i' } }).select('description is_completed');

  return resBase(repoToDos, response);
});

// toggle
rtToDo.get('/complete/:id', rtFtJwt, async (request, response) => {
  // search to do
  const tbuRepoToDo = await Todo.findOne({ _id: request.params.id }).select('is_completed');
  if (!tbuRepoToDo) return resNotFound('to do', response);

  // get current time
  const now = moment();

  // update db model: to do
  tbuRepoToDo.is_completed = request.query.is_completed;
  tbuRepoToDo.update_date = now;

  try {
    // save to do
    const tbuRepoToDoSaved = await tbuRepoToDo.save();

    return resBase(tbuRepoToDoSaved, response);
  } catch (error) {
    return resException(error, response);
  }
});

// create
rtToDo.post('/:projectCode', rtFtJwt, async (request, response) => {
  // validate model
  const { error: errorValidation } = vldtToDoCreate(request.body);
  if (errorValidation) return resValidationError(errorValidation, response);

  // make sure project is exist
  const tblRepoProject = await Project.findOne({ code: request.params.projectCode, is_active: true }).select('_id');
  if (!tblRepoProject) return resNotFound(`project ${request.params.projectCode}`, response);

  // make to do
  const tbiToDo = new Todo({
    description: request.body.description,
    creator: request.user._id,
    project: tblRepoProject._id,
  });

  try {
    // save to do
    const tbiToDoSaved = await tbiToDo.save();

    resBase(
      {
        _id: tbiToDoSaved._id,
        description: tbiToDoSaved.description,
      },
      response
    );
  } catch (error) {
    resException(error, response);
  }
});

// edit

export default rtToDo;
