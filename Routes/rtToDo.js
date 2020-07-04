import { Router } from 'express';
import { toInteger } from 'lodash';
import moment from 'moment';
import mongoose from 'mongoose';

import TODO from '../Constants/TODO';
import Project from '../Models/mdlProject';
import ProjectActivity from '../Models/mdlProjectActivitiy';
import Todo from '../Models/mdlTodo';
import TodoComment from '../Models/mdlTodoComment';
import User from '../Models/mdlUser';
import { resBase, resException, resNotFound, resSingleValidationError, resTable, resValidationError } from '../Responses/resBase';
import rtFtJwt from '../RouteFilters/rtFtJwt';
import { calculateSkipValue, convertObjectValueToArray } from '../Utilities/utlType';
import { vldtTodoComment, vldtTodoCreate, vldtTodoEditDescription, vldtTodoEditReminder as vldtTodoChangeReminder, vldtTodoEditTags, vldtTodoChangeWorkDate } from '../Validations/vldtTodo';

const rtTodo = Router();

// get all
rtTodo.get('/:projectCode', rtFtJwt, async (request, response) => {
  // search to do
  const repoProject = await Project.findOne({ code: request.params.projectCode }).select('_id');
  if (!repoProject) return resNotFound(`project '${request.params.projectCode}'`, response);

  // search to do for this project
  const repoTodos = await Todo.find({ project: repoProject._id, description: { $regex: request.query.search || '', $options: 'i' } })
    .sort('-create_date')
    .select('description is_completed is_important priority');

  // rename _id to id
  const repoTodosRemapped = repoTodos.map((repoTodo) => ({
    id: repoTodo._id,
    description: repoTodo.description,
    isCompleted: repoTodo.is_completed,
    isImportant: repoTodo.is_important,
    priority: repoTodo.priority,
  }));

  return resBase(repoTodosRemapped, response);
});

// get one (detail)
rtTodo.get('/detail/:id', rtFtJwt, async (request, response) => {
  // search to do
  const repoTodo = await Todo.findOne({ _id: request.params.id }).populate('project', 'code author collaborators').populate('project.collaborators').populate('creator', 'name');
  if (!repoTodo) return resNotFound('to do', response);

  // make sure this user has access to to do's project
  if (repoTodo.project.author.toString() !== request.user.id && !repoTodo.project.collaborators.map((collaborator) => collaborator._id).includes(request.user.id)) return resNotFound('to do', response);

  // search user for to do reminder
  const repoUser = await User.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(request.user.id) },
    },
    { $unwind: '$todo_reminders' },
    { $match: { 'todo_reminders.todo': repoTodo._id } },
    { $project: { todo_reminders: { remind_date: 1 } } },
  ]);

  // search comments
  const repoTodoComments = await TodoComment.find({ todo: repoTodo._id }).populate('commenter', 'name').select('description create_date');

  // get reminder date
  const remindDate = repoUser.length > 0 ? repoUser[0].todo_reminders.remind_date : null;

  return resBase(
    {
      id: repoTodo._id,
      projectCode: repoTodo.project.code,
      creatorId: repoTodo.creator._id,
      creatorName: repoTodo.creator.name,
      description: repoTodo.description,
      detail: repoTodo.detail,
      isCompleted: repoTodo.is_completed,
      isImportant: repoTodo.is_important,
      priority: repoTodo.priority,
      tags: repoTodo.tags,
      remind_date: remindDate,
      comments: repoTodoComments,
      dateStart: repoTodo.date_start,
      dateEnd: repoTodo.date_end,
      is_active: repoTodo.is_active,
      create_date: repoTodo.create_date,
      update_date: repoTodo.update_date,
    },
    response
  );
});

// get activities
rtTodo.get('/activities/:id', rtFtJwt, async (request, response) => {
  // convert page size
  const pageSize = toInteger(request.query.pageSize);
  if (!pageSize) return resSingleValidationError('page size', response);

  // convert current page
  const currentPage = toInteger(request.query.currentPage);
  if (!currentPage) return resSingleValidationError('page number', response);

  // search to do activities
  const filter = { todo: request.params.id };
  const repoProjectActivitiesCount = await ProjectActivity.countDocuments(filter);
  const repoProjectActivities = await ProjectActivity.find(filter).sort('-create_date').skip(calculateSkipValue(pageSize, currentPage)).limit(pageSize).populate('actor', 'name');

  return resTable(repoProjectActivities, repoProjectActivitiesCount, response);
});

// create
rtTodo.post('/:projectCode', rtFtJwt, async (request, response) => {
  // validate model
  const { error: errorValidation } = vldtTodoCreate(request.body);
  if (errorValidation) return resValidationError(errorValidation, response);

  // make sure project is exist
  const tblRepoProject = await Project.findOne({ code: request.params.projectCode, is_active: true }).select('_id');
  if (!tblRepoProject) return resNotFound(`project '${request.params.projectCode}'`, response);

  // get user
  const repoUser = await User.findOne({ _id: request.user.id }).select('name');
  if (!repoUser) return resNotFound('user', response);

  // make db model: to do
  const tbiRepoTodo = new Todo({
    description: request.body.description,
    creator: request.user.id,
    project: tblRepoProject._id,
  });

  // make db model: project activity
  const tbiRepoProjectActivity = new ProjectActivity({
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
    // populate actor
    const tbiRepoProjectActivitySaved = await tbiRepoProjectActivity.save();

    resBase(
      {
        todo: {
          id: tbiTodoSaved._id,
          description: tbiTodoSaved.description,
          priority: tbiTodoSaved.priority,
        },
        activity: {
          todo: tbiRepoProjectActivitySaved.todo_action,
          todo_action: tbiRepoProjectActivitySaved.todo_action,
          todo_description: tbiRepoProjectActivitySaved.todo_description,
          actor: repoUser,
          create_date: tbiRepoProjectActivitySaved.create_date,
        },
      },
      response
    );
  } catch (error) {
    resException(error, response);
  }
});

// edit

// toggle complete
rtTodo.get('/complete/:id', rtFtJwt, async (request, response) => {
  // search to do
  const tbuRepoTodo = await Todo.findOne({ _id: request.params.id }).select('description is_completed update_date');
  if (!tbuRepoTodo) return resNotFound('to do', response);

  // get user
  const repoUser = await User.findOne({ _id: request.user.id }).select('name');
  if (!repoUser) return resNotFound('user', response);

  // get current time
  const now = moment();

  // convert query to boolean
  const isCompleted = request.query.isCompleted === 'true';

  // update db model: to do
  tbuRepoTodo.is_completed = isCompleted;
  tbuRepoTodo.update_date = now;

  // make db model: project activity
  const tbiRepoProjectActivity = new ProjectActivity({
    // link to to do
    todo: tbuRepoTodo._id,
    todo_action: isCompleted ? TODO.ACTION.MARK_COMPLETED : TODO.ACTION.UNMARK_COMPLETED,
    todo_description: tbuRepoTodo.description,
    // link to user
    actor: request.user.id,
  });

  try {
    // save to do
    const tbuRepoTodoSaved = await tbuRepoTodo.save();

    // save project activity
    const tbiRepoProjectActivitySaved = await tbiRepoProjectActivity.save();

    return resBase(
      {
        todo: { id: tbuRepoTodoSaved._id, isCompleted: tbuRepoTodoSaved.is_completed },
        activity: {
          todo: tbiRepoProjectActivitySaved.todo,
          todo_action: tbiRepoProjectActivitySaved.todo_action,
          todo_description: tbiRepoProjectActivitySaved.todo_description,
          actor: repoUser,
          create_date: tbiRepoProjectActivitySaved.create_date,
        },
      },
      response
    );
  } catch (error) {
    return resException(error, response);
  }
});

// toggle important
rtTodo.get('/important/:id', rtFtJwt, async (request, response) => {
  // search to do
  const tbuRepoTodo = await Todo.findOne({ _id: request.params.id }).select('description is_important update_date');
  if (!tbuRepoTodo) return resNotFound('to do', response);

  // get user
  const repoUser = await User.findOne({ _id: request.user.id }).select('name');
  if (!repoUser) return resNotFound('user', response);

  // get current time
  const now = moment();

  // convert query to boolean
  const isImportant = request.query.isImportant === 'true';

  // update db model: to do
  tbuRepoTodo.is_important = isImportant;
  tbuRepoTodo.update_date = now;

  // make db model: project activity
  const tbiRepoProjectActivity = new ProjectActivity({
    // link to to do
    todo: tbuRepoTodo._id,
    todo_action: isImportant ? TODO.ACTION.MARK_IMPORTANT : TODO.ACTION.UNMARK_IMPORTANT,
    todo_description: tbuRepoTodo.description,
    // link to user
    actor: request.user.id,
  });

  try {
    // save to do
    const tbuRepoTodoSaved = await tbuRepoTodo.save();

    // save project activity
    const tbiRepoProjectActivitySaved = await tbiRepoProjectActivity.save();

    return resBase(
      {
        todo: { id: tbuRepoTodoSaved._id, isImportant: tbuRepoTodoSaved.is_important },
        activity: {
          todo: tbiRepoProjectActivitySaved.todo,
          todo_action: tbiRepoProjectActivitySaved.todo_action,
          todo_description: tbiRepoProjectActivitySaved.todo_description,
          actor: repoUser,
          create_date: tbiRepoProjectActivitySaved.create_date,
        },
      },
      response
    );
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

  // get user
  const repoUser = await User.findOne({ _id: request.user.id }).select('name');
  if (!repoUser) return resNotFound('user', response);

  // get current time
  const now = moment();

  // update db model: to do
  tbuRepoTodo.tags.push(request.query.tag);
  tbuRepoTodo.update_date = now;

  // make db model: project activity (created tags)
  const tbiRepoProjectActivity = new ProjectActivity({
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
    const tbiRepoProjectActivitySaved = await tbiRepoProjectActivity.save();

    return resBase(
      {
        tag: request.query.tag,
        activity: {
          todo: tbiRepoProjectActivitySaved.todo,
          todo_description: tbiRepoProjectActivitySaved.todo_description,
          todo_action: tbiRepoProjectActivitySaved.todo_action,
          todo_tag: tbiRepoProjectActivitySaved.todo_tag,
          actor: repoUser,
          create_date: tbiRepoProjectActivitySaved.create_date,
        },
      },
      response
    );
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

  // get user
  const repoUser = await User.findOne({ _id: request.user.id }).select('name');
  if (!repoUser) return resNotFound('user', response);

  // get current time
  const now = moment();

  // update db model: to do
  tbuRepoTodo.tags.splice(tbdTagIndex, 1);
  tbuRepoTodo.update_date = now;

  // make db model: project activity
  const tbiRepoProjectActivity = new ProjectActivity({
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
    const tbiRepoProjectActivitySaved = await tbiRepoProjectActivity.save();

    return resBase(
      {
        tag: request.query.tag,
        activity: {
          todo: tbiRepoProjectActivitySaved.todo,
          todo_description: tbiRepoProjectActivitySaved.todo_description,
          todo_action: tbiRepoProjectActivitySaved.todo_action,
          todo_tag: tbiRepoProjectActivitySaved.todo_tag,
          actor: repoUser,
          create_date: tbiRepoProjectActivitySaved.create_date,
        },
      },
      response
    );
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
  if (!convertObjectValueToArray(TODO.PRIORITY).includes(priorityLevel)) return resNotFound('priority', response);

  // search to do
  const tbuRepoTodo = await Todo.findOne({ _id: request.params.id }).select('description priority update_date');
  if (!tbuRepoTodo) return resNotFound('to do', response);

  // get user
  const repoUser = await User.findOne({ _id: request.user.id }).select('name');
  if (!repoUser) return resNotFound('user', response);

  // get current time
  const now = moment();

  // save old priority
  const oldPriority = tbuRepoTodo.priority;

  // update db model: to do
  tbuRepoTodo.priority = priorityLevel;
  tbuRepoTodo.update_date = now;

  // make db model: project activity
  const tbiRepoProjectActivity = new ProjectActivity({
    // link to to do
    todo: tbuRepoTodo._id,
    todo_action: TODO.ACTION.EDIT_PRIORITY,
    todo_description: tbuRepoTodo.description,
    todo_priority: oldPriority,
    todo_priority_new: priorityLevel,
    // link to user
    actor: request.user.id,
  });

  try {
    // save to do
    const tbuRepoTodoSaved = await tbuRepoTodo.save();

    // save project activity
    const tbiRepoProjectActivitySaved = await tbiRepoProjectActivity.save();

    return resBase(
      {
        todo: { id: tbuRepoTodoSaved._id, priority: tbuRepoTodoSaved.priority },
        activity: {
          todo: tbiRepoProjectActivitySaved.todo,
          todo_action: tbiRepoProjectActivitySaved.todo_action,
          todo_description: tbiRepoProjectActivitySaved.todo_description,
          todo_priority: tbiRepoProjectActivitySaved.todo_priority,
          todo_priority_new: tbiRepoProjectActivitySaved.todo_priority_new,
          actor: repoUser,
          create_date: tbiRepoProjectActivitySaved.create_date,
        },
      },
      response
    );
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

  // get user
  const repoUser = await User.findOne({ _id: request.user.id }).select('name');
  if (!repoUser) return resNotFound('user', response);

  // get current time
  const now = moment();

  // save old description
  const oldDescription = tbuRepoTodo.description;

  // update db model: to do
  tbuRepoTodo.description = request.body.description;
  tbuRepoTodo.update_date = now;

  // make db model: project activity
  const tbiRepoProjectActivity = new ProjectActivity({
    // link to to do
    todo: tbuRepoTodo._id,
    todo_action: TODO.ACTION.EDIT_DESCRIPTION,
    todo_description: oldDescription,
    todo_description_new: request.body.description,
    // link to user
    actor: request.user.id,
  });

  try {
    // save to do
    const tbuRepoTodoSaved = await tbuRepoTodo.save();

    // save project activity
    const tbiRepoProjectActivitySaved = await tbiRepoProjectActivity.save();

    return resBase(
      {
        todo: { id: tbuRepoTodoSaved._id, description: tbuRepoTodoSaved.description },
        activity: {
          todo: tbiRepoProjectActivitySaved.todo,
          todo_action: tbiRepoProjectActivitySaved.todo_action,
          todo_description: tbiRepoProjectActivitySaved.todo_description,
          todo_description_new: tbiRepoProjectActivitySaved.todo_description_new,
          actor: repoUser,
          create_date: tbiRepoProjectActivitySaved.create_date,
        },
      },
      response
    );
  } catch (error) {
    return resException(error, response);
  }
});

// change detail
rtTodo.post('/detail/:id', rtFtJwt, async (request, response) => {
  // search to do
  const tbuRepoTodo = await Todo.findOne({ _id: request.params.id }).select('description detail update_date');
  if (!tbuRepoTodo) return resNotFound('to do', response);

  // get user
  const repoUser = await User.findOne({ _id: request.user.id }).select('name');
  if (!repoUser) return resNotFound('user', response);

  // get current time
  const now = moment();

  // update db model: to do
  tbuRepoTodo.detail = request.body.detail;
  tbuRepoTodo.update_date = now;

  // make db model: project activity
  const tbiRepoProjectActivity = new ProjectActivity({
    // link to to do
    todo: tbuRepoTodo._id,
    todo_action: TODO.ACTION.EDIT_DETAIL,
    todo_description: tbuRepoTodo.description,
    // link to user
    actor: request.user.id,
  });

  try {
    // save to do
    const tbuRepoTodoSaved = await tbuRepoTodo.save();

    // save project activity
    const tbiRepoProjectActivitySaved = await tbiRepoProjectActivity.save();

    return resBase(
      {
        todo: { id: tbuRepoTodoSaved._id },
        activity: {
          todo: tbiRepoProjectActivitySaved.todo,
          todo_action: tbiRepoProjectActivitySaved.todo_action,
          todo_description: tbiRepoProjectActivitySaved.todo_description,
          actor: repoUser,
          create_date: tbiRepoProjectActivitySaved.create_date,
        },
      },
      response
    );
  } catch (error) {
    return resException(error, response);
  }
});

// comment
rtTodo.post('/comment/:id', rtFtJwt, async (request, response) => {
  // validate model
  const { error: errorValidation } = vldtTodoComment(request.body);
  if (errorValidation) return resValidationError(errorValidation, response);

  // search to do
  const repoTodo = await Todo.findOne({ _id: request.params.id }).select('description');
  if (!repoTodo) return resNotFound('to do', response);

  // get user
  const repoUser = await User.findOne({ _id: request.user.id }).select('name');
  if (!repoUser) return resNotFound('user', response);

  // make db model
  const tbiRepoTodoComment = new TodoComment({
    description: request.body.description,
    parent: request.body.parent,
    todo: repoTodo._id,
    commenter: request.user.id,
    mentionedUsers: request.body.mentionedUsers,
  });

  // make db model: project activity
  const tbiRepoProjectActivity = new ProjectActivity({
    // link to to do
    todo: repoTodo._id,
    todo_action: TODO.ACTION.COMMENT,
    todo_description: repoTodo.description,
    todo_comment: request.body.description,
    // link to user
    actor: request.user.id,
  });

  try {
    // save to do comment
    const tbiRepoTodoCommentSaved = await tbiRepoTodoComment.save();

    // save project activity
    const tbiRepoProjectActivitySaved = await tbiRepoProjectActivity.save();

    return resBase(
      {
        comment: { commenter: repoUser, description: tbiRepoTodoCommentSaved.description, create_date: tbiRepoTodoCommentSaved.create_date, parent: tbiRepoTodoCommentSaved.parent },
        activity: {
          todo: tbiRepoProjectActivitySaved.todo,
          todo_action: tbiRepoProjectActivitySaved.todo_action,
          todo_description: tbiRepoProjectActivitySaved.todo_description,
          todo_description_new: tbiRepoProjectActivitySaved.todo_description_new,
          actor: repoUser,
          create_date: tbiRepoProjectActivitySaved.create_date,
        },
      },
      response
    );
  } catch (error) {
    return resException(error, response);
  }
});

// change reminder
rtTodo.get('/reminder/:id', rtFtJwt, async (request, response) => {
  // validate model
  const { error: errorValidation } = vldtTodoChangeReminder(request.query);
  if (errorValidation) return resValidationError(errorValidation, response);

  // convert query string to boolean
  const isRemoving = request.query.is_removing === 'true';

  // validate model (2)
  if (!isRemoving && !request.query.remind_date) return resSingleValidationError('remind date', response);

  // search to do
  const repoTodo = await Todo.findOne({ _id: request.params.id }).select('update_date');
  if (!repoTodo) return resNotFound('to do', response);

  // search user
  const tbuRepoUser = await User.findOne({ _id: request.user.id }).select('name todo_reminders');
  if (!tbuRepoUser) return resNotFound('user', response);

  // update db model: user

  // remove current existing reminder for to do
  const repoTodoId = repoTodo._id.toString();
  const tbdRepoUserTodoReminderIndex = tbuRepoUser.todo_reminders.findIndex((todoReminder) => todoReminder.todo.toString() === repoTodoId);
  if (tbdRepoUserTodoReminderIndex > -1) tbuRepoUser.todo_reminders.splice(tbdRepoUserTodoReminderIndex, 1);

  // add a new reminder
  if (!isRemoving) {
    tbuRepoUser.todo_reminders.push({
      todo: repoTodo._id,
      remind_date: request.query.remind_date,
    });
  }

  try {
    // save user
    await tbuRepoUser.save();

    return resBase({ todo: repoTodo._id, remind_date: request.query.remind_date }, response);
  } catch (error) {
    return resException(error, response);
  }
});

// change work date
rtTodo.put('/workdate/:id', rtFtJwt, async (request, response) => {
  // validate model
  const { error: errorValidation } = vldtTodoChangeWorkDate(request.body);
  if (errorValidation) return resValidationError(errorValidation, response);

  // search to do
  const tbuRepoTodo = await Todo.findOne({ _id: request.params.id }).select('description date_start date_end update_date');
  if (!tbuRepoTodo) return resNotFound('to do', response);

  // search user
  const repoUser = await User.findOne({ _id: request.user.id }).select('name');
  if (!repoUser) return resNotFound('user', response);

  // get current time
  const now = moment();

  // update db model: to do
  tbuRepoTodo.date_start = request.body.dateStart;
  tbuRepoTodo.date_end = request.body.dateEnd;
  tbuRepoTodo.update_date = now;

  // make db model: project activity
  const tbiRepoProjectActivity = new ProjectActivity({
    // link to to do
    todo: tbuRepoTodo._id,
    todo_action: TODO.ACTION.EDIT_WORKDATE,
    todo_description: tbuRepoTodo.description,
    todo_date_start: request.body.dateStart,
    todo_date_end: request.body.dateEnd,
    // link to user
    actor: request.user.id,
  });

  try {
    // save to do
    const tbuRepoTodoSaved = await tbuRepoTodo.save();

    // save project activity
    const tbuRepoProjectActivitySaved = await tbiRepoProjectActivity.save();

    return resBase(
      {
        todo: { id: tbuRepoTodoSaved._id, date_start: tbuRepoTodoSaved.date_start, date_end: tbuRepoTodoSaved.date_end },
        activity: {
          todo: tbuRepoProjectActivitySaved.todo,
          todo_action: tbuRepoProjectActivitySaved.todo_action,
          todo_description: tbuRepoProjectActivitySaved.todo_description,
          todo_date_start: tbuRepoProjectActivitySaved.todo_date_start,
          todo_date_end: tbuRepoProjectActivitySaved.todo_date_end,
          actor: repoUser,
          create_date: tbuRepoProjectActivitySaved.create_date,
        },
      },
      response
    );
  } catch (error) {
    return resException(error, response);
  }
});

export default rtTodo;
