import { model, Schema } from 'mongoose';

import PROJECT from '../Constants/PROJECT';
import TODO from '../Constants/TODO';
import { convertObjectValueToArray } from '../Utilities/utlType';

const scmProjectActivity = new Schema({
  create_date: {
    type: Date,
    default: Date.now,
  },
  // fk: Project
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
  },
  project_action: {
    type: String,
    enum: convertObjectValueToArray(PROJECT.ACTION),
  },
  project_code: {
    type: String,
    max: 5,
  },
  project_name: {
    type: String,
    max: 100,
  },
  // fk: Todo
  todo: {
    type: Schema.Types.ObjectId,
    ref: 'Todo',
  },
  todo_action: {
    type: String,
    enum: convertObjectValueToArray(TODO.ACTION),
  },
  todo_description: {
    type: String,
    max: 100,
  },
  todo_description_new: {
    type: String,
    max: 100,
  },
  todo_completed: {
    type: Boolean,
  },
  todo_important: {
    type: Boolean,
  },
  todo_priority: {
    type: Number,
    enum: convertObjectValueToArray(TODO.PRIORITY),
  },
  todo_priority_new: {
    type: Number,
    enum: convertObjectValueToArray(TODO.PRIORITY),
  },
  todo_tag: {
    type: String,
  },
  todo_comment: {
    type: String,
    max: 100,
  },
  // fk: User
  actor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

const ProjectActivity = model('ProjectActivity', scmProjectActivity, 'project_activities');

export default ProjectActivity;
