import { Router } from 'express';
import { toInteger } from 'lodash';
import moment from 'moment';

import TODO from '../Constants/TODO';
import Project from '../Models/mdlProject';
import ProjectActivity from '../Models/mdlProjectActivitiy';
import Todo from '../Models/mdlTodo';
import { resBase, resException, resNotFound, resValidationError } from '../Responses/resBase';
import rtFtJwt from '../RouteFilters/rtFtJwt';
import { vldtTodoCreate, vldtTodoEditDescription, vldtTodoEditTags } from '../Validations/vldtTodo';

const rtTodo = Router();

// get all
rtTodo.get('/:projectCode', rtFtJwt, async (request, response) => {
  // search to do
  const repoProject = await Project.findOne({ code: request.params.projectCode }).select('_id');
  if (!repoProject) return resNotFound(`project ${request.params.projectCode}`, response);

  // search to do for this project
  const repoTodos = await Todo.find({ project: repoProject._id, description: { $regex: request.query.search || '', $options: 'i' } })
    .sort('-create_date')
    .select('description is_completed is_important priority');

  // rename _id to id
  const repoTodosRemapped = repoTodos.map((repoTodo) => ({
    id: repoTodo._id,
    description: repoTodo.description,
    is_completed: repoTodo.is_completed,
    is_important: repoTodo.is_important,
    priority: repoTodo.priority,
  }));

  return resBase(repoTodosRemapped, response);
});

// create
rtTodo.post('/:projectCode', rtFtJwt, async (request, response) => {
  // validate model
  const { error: errorValidation } = vldtTodoCreate(request.body);
  if (errorValidation) return resValidationError(errorValidation, response);

  // make sure project is exist
  const tblRepoProject = await Project.findOne({ code: request.params.projectCode, is_active: true }).select('_id');
  if (!tblRepoProject) return resNotFound(`project ${request.params.projectCode}`, response);

  // make db model: to do
  const tbiRepoTodo = new Todo({
    description: request.body.description,
    creator: request.user.id,
    project: tblRepoProject._id,
  });

  // make db model: project activity
  const tbiProjectActivity = new ProjectActivity({
    // link to to do
    todo: tbiRepoTodo._id,
    todo_action: TODO.ACTION.CREATE,
    todo_description: request.body.description,
    // link to user
    actor: request.user.id,
  });

  try {
    // save to do
    const tbiTodoSaved = await tbiRepoTodo.save();

    // save project activity
    await tbiProjectActivity.save();

    resBase(
      {
        id: tbiTodoSaved._id,
        description: tbiTodoSaved.description,
        priority: tbiTodoSaved.priority,
      },
      response
    );
  } catch (error) {
    resException(error, response);
  }
});

// edit

// detail
rtTodo.get('/detail/:id', rtFtJwt, async (request, response) => {
  // search to do
  const repoTodo = await Todo.findOne({ _id: request.params.id }).populate('creator', 'name');
  if (!repoTodo) return resNotFound('to do', response);

  return resBase(
    {
      id: repoTodo._id,
      creatorId: repoTodo.creator._id,
      creatorName: repoTodo.creator.name,
      description: repoTodo.description,
      is_completed: repoTodo.is_completed,
      is_active: repoTodo.is_active,
      is_important: repoTodo.is_important,
      priority: repoTodo.priority,
      tags: repoTodo.tags,
      create_date: repoTodo.create_date,
      update_date: repoTodo.update_date,
    },
    response
  );
});

// toggle complete
rtTodo.get('/complete/:id', rtFtJwt, async (request, response) => {
  // search to do
  const tbuRepoTodo = await Todo.findOne({ _id: request.params.id }).select('is_completed');
  if (!tbuRepoTodo) return resNotFound('to do', response);

  // get current time
  const now = moment();

  // update db model: to do
  tbuRepoTodo.is_completed = request.query.is_completed;
  tbuRepoTodo.update_date = now;

  try {
    // save to do
    const tbuRepoTodoSaved = await tbuRepoTodo.save();

    return resBase({ is_completed: tbuRepoTodoSaved.is_completed }, response);
  } catch (error) {
    return resException(error, response);
  }
});

// toggle important
rtTodo.get('/important/:id', rtFtJwt, async (request, response) => {
  // search to do
  const tbuRepoTodo = await Todo.findOne({ _id: request.params.id }).select('is_important');
  if (!tbuRepoTodo) return resNotFound('to do', response);

  // get current time
  const now = moment();

  // update db model: to do
  tbuRepoTodo.is_important = request.query.is_important;
  tbuRepoTodo.update_date = now;

  try {
    // save to do
    const tbuRepoTodoSaved = await tbuRepoTodo.save();

    return resBase({ is_important: tbuRepoTodoSaved.is_important }, response);
  } catch (error) {
    return resException(error, response);
  }
});

// create tag
rtTodo.get('/tag/:id', rtFtJwt, async (request, response) => {
  // validate model
  const { error: errorValidation } = vldtTodoEditTags(request.query);
  if (errorValidation) return resValidationError(errorValidation, response);

  // search to do
  const tbuRepoTodo = await Todo.findOne({ _id: request.params.id }).select('description tags update_date');
  if (!tbuRepoTodo) return resNotFound('to do', response);

  // get current time
  const now = moment();

  // update db model: to do
  tbuRepoTodo.tags.push(request.query.tag);
  tbuRepoTodo.update_date = now;

  // make db model: project activity (created tags)
  const tbiProjectActivityCreatedTags = new ProjectActivity({
    // link to do
    todo: tbuRepoTodo._id,
    todo_description: tbuRepoTodo.description,
    todo_action: TODO.ACTION.CREATE_TAG,
    todo_tag: request.query.tag,
    // link user
    actor: request.user.id,
  });

  try {
    // save to do
    await tbuRepoTodo.save();

    // save project activity (created tags)
    await tbiProjectActivityCreatedTags.save();

    return resBase({ tag: request.query.tag }, response);
  } catch (error) {
    return resException(error, response);
  }
});

// delete tag
rtTodo.delete('/tag/:id', rtFtJwt, async (request, response) => {
  // validate model
  const { error: errorValidation } = vldtTodoEditTags(request.query);
  if (errorValidation) return resValidationError(errorValidation, response);

  // search to do
  const tbuRepoTodo = await Todo.findOne({ _id: request.params.id }).select('description tags update_date');
  if (!tbuRepoTodo) return resNotFound('to do', response);

  // search tag
  const tbdTagIndex = tbuRepoTodo.tags.indexOf(request.query.tag);
  if (tbdTagIndex < 0) return resNotFound(`tag ${request.query.tag}`, response);

  // get current time
  const now = moment();

  // update db model: to do
  tbuRepoTodo.tags.splice(tbdTagIndex, 1);
  tbuRepoTodo.update_date = now;

  // make db model: project activity
  const tbiProjectActivity = new ProjectActivity({
    // link to do
    todo: tbuRepoTodo._id,
    todo_description: tbuRepoTodo.description,
    todo_action: TODO.ACTION.DELETE_TAG,
    todo_tag: request.query.tag,
    // link user
    actor: request.user.id,
  });

  try {
    // save to do
    await tbuRepoTodo.save();

    // save project activity (deleted tags)
    await tbiProjectActivity.save();

    return resBase({ tag: request.query.tag }, response);
  } catch (error) {
    return resException(error, response);
  }
});

// change priority
rtTodo.get('/priority/:id', rtFtJwt, async (request, response) => {
  // convert params to number
  const priorityLevel = toInteger(request.query.priorityLevel);
  if (!priorityLevel) return resNotFound('priority level', response);

  // check priority level in priority list
  if (!TODO.PRIORITY.includes(priorityLevel)) return resNotFound('priority', response);

  // search to do
  const tbuRepoTodo = await Todo.findOne({ _id: request.params.id }).select('priority');
  if (!tbuRepoTodo) return resNotFound('to do', response);

  // get current time
  const now = moment();

  // update db model: to do
  tbuRepoTodo.priority = priorityLevel;
  tbuRepoTodo.update_date = now;

  try {
    // save to do
    const tbuRepoTodoSaved = await tbuRepoTodo.save();

    return resBase({ priority: tbuRepoTodoSaved.priority }, response);
  } catch (error) {
    return resException(error, response);
  }
});

// change description
rtTodo.post('/description/:id', rtFtJwt, async (request, response) => {
  // validate model
  const { error: errorValidation } = vldtTodoEditDescription(request.body);
  if (errorValidation) return resValidationError(errorValidation, response);

  // search to do
  const tbuRepoTodo = await Todo.findOne({ _id: request.params.id }).select('description');
  if (!tbuRepoTodo) return resNotFound('to do', response);

  // get current time
  const now = moment();

  // update db model: to do
  tbuRepoTodo.description = request.body.description;
  tbuRepoTodo.update_date = now;

  try {
    // save to do
    const tbuRepoTodoSaved = await tbuRepoTodo.save();

    return resBase({ description: tbuRepoTodoSaved.description }, response);
  } catch (error) {
    return resException(error, response);
  }
});

export default rtTodo;
