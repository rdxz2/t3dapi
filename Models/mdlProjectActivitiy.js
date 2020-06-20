import { Schema, model } from 'mongoose';

const scmProjectActivity = new Schema({
  create_date: {
    type: Date,
    default: Date.now,
  },
  // fk: Project
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  // fk: Todo
  todo: {
    type: Schema.Types.ObjectId,
    ref: 'Todo',
  },
  // fk: User
  actor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  }
});

const Project = model('Project', scmProjectActivity, 'project_activities');

export default Project;
