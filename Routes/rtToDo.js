import { Router } from 'express';
import { resBase, resValidationError, resException, resNotFound } from '../Responses/resBase';
import rtFtJwt from '../RouteFilters/rtFtJwt';
import { vldtToDoCreate, vldtToDoEditTags, vldtToDoEditDescription } from '../Validations/vldtToDo';
import Todo from '../Models/mdlTodo';
import Project from '../Models/mdlProject';
import moment from 'moment';
import TODO from '../Constants/TODO';
import { toInteger } from 'lodash';
const rtToDo = Router();

// get all
rtToDo.get('/:projectCode', rtFtJwt, async (request, response) => {
  // search to do
  const repoProject = await Project.findOne({ code: request.params.projectCode }).select('_id');
  if (!repoProject) return resNotFound(`project ${request.params.projectCode}`, response);

  // search to do for this project
  const repoToDos = await Todo.find({ project: repoProject._id, description: { $regex: request.query.search || '', $options: 'i' } })
    .sort([['create_date', -1]])
    .select('description is_completed is_important priority');

  // rename _id to id
  const repoTodosRemapped = repoToDos.map((repoToDo) => ({
    id: repoToDo._id,
    description: repoToDo.description,
    is_completed: repoToDo.is_completed,
    is_important: repoToDo.is_important,
    priority: repoToDo.priority,
  }));

  return resBase(repoTodosRemapped, response);
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
    creator: request.user.id,
    project: tblRepoProject._id,
  });

  try {
    // save to do
    const tbiToDoSaved = await tbiToDo.save();

    resBase(
      {
        id: tbiToDoSaved._id,
        description: tbiToDoSaved.description,
        priority: tbiToDoSaved.priority,
      },
      response
    );
  } catch (error) {
    resException(error, response);
  }
});

// edit

// detail
rtToDo.get('/detail/:id', rtFtJwt, async (request, response) => {
  // search to do
  const repoToDo = await Todo.findOne({ _id: request.params.id }).populate('creator', 'name');
  if (!repoToDo) return resNotFound('to do', response);

  return resBase(
    {
      id: repoToDo._id,
      creatorId: repoToDo.creator._id,
      creatorName: repoToDo.creator.name,
      description: repoToDo.description,
      is_completed: repoToDo.is_completed,
      is_active: repoToDo.is_active,
      is_important: repoToDo.is_important,
      priority: repoToDo.priority,
      tags: repoToDo.tags,
      create_date: repoToDo.create_date,
      update_date: repoToDo.update_date,
    },
    response
  );
});

// toggle complete
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

    return resBase({ is_completed: tbuRepoToDoSaved.is_completed }, response);
  } catch (error) {
    return resException(error, response);
  }
});

// toggle important
rtToDo.get('/important/:id', rtFtJwt, async (request, response) => {
  // search to do
  const tbuRepoToDo = await Todo.findOne({ _id: request.params.id }).select('is_important');
  if (!tbuRepoToDo) return resNotFound('to do', response);

  // get current time
  const now = moment();

  // update db model: to do
  tbuRepoToDo.is_important = request.query.is_important;
  tbuRepoToDo.update_date = now;

  try {
    // save to do
    const tbuRepoToDoSaved = await tbuRepoToDo.save();

    return resBase({ is_important: tbuRepoToDoSaved.is_important }, response);
  } catch (error) {
    return resException(error, response);
  }
});

// change tags
rtToDo.post('/tags/:id', rtFtJwt, async (request, response) => {
  // validate model
  const { error: errorValidation } = vldtToDoEditTags(request.body);
  if (errorValidation) return resValidationError(errorValidation, response);

  // search to do
  const tbuRepoToDo = await Todo.findOne({ _id: request.params.id }).select('tags');
  if (!tbuRepoToDo) return resNotFound('to do', response);

  // get current time
  const now = moment();

  // update db model: to do
  tbuRepoToDo.tags = request.body.tags;
  tbuRepoToDo.update_date = now;

  try {
    // save to do
    const tbuRepoToDoSaved = await tbuRepoToDo.save();

    return resBase({ tags: tbuRepoToDoSaved.tags }, response);
  } catch (error) {
    return resException(error, response);
  }
});

// change priority
rtToDo.get('/priority/:id', rtFtJwt, async (request, response) => {
  // convert params to number
  const priorityLevel = toInteger(request.query.priorityLevel);
  if (!priorityLevel) return resNotFound('priority level', response);

  // check priority level in priority list
  if (!TODO.PRIORITIES.includes(priorityLevel)) return resNotFound('priority', response);

  // search to do
  const tbuRepoToDo = await Todo.findOne({ _id: request.params.id }).select('priority');
  if (!tbuRepoToDo) return resNotFound('to do', response);

  // get current time
  const now = moment();

  // update db model: to do
  tbuRepoToDo.priority = priorityLevel;
  tbuRepoToDo.update_date = now;

  try {
    // save to do
    const tbuRepoToDoSaved = await tbuRepoToDo.save();

    return resBase({ priority: tbuRepoToDoSaved.priority }, response);
  } catch (error) {
    return resException(error, response);
  }
});

// change description
rtToDo.post('/description/:id', rtFtJwt, async (request, response) => {
  // validate model
  const { error: errorValidation } = vldtToDoEditDescription(request.body);
  if (errorValidation) return resValidationError(errorValidation, response);

  // search to do
  const tbuRepoToDo = await Todo.findOne({ _id: request.params.id }).select('description');
  if (!tbuRepoToDo) return resNotFound('to do', response);

  // get current time
  const now = moment();

  // update db model: to do
  tbuRepoToDo.description = request.body.description;
  tbuRepoToDo.update_date = now;

  try {
    // save to do
    const tbuRepoToDoSaved = await tbuRepoToDo.save();

    return resBase({ description: tbuRepoToDoSaved.description }, response);
  } catch (error) {
    return resException(error, response);
  }
});

export default rtToDo;
