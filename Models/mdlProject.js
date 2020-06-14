import { Schema, model } from 'mongoose';

const scmProject = new Schema({
  name: {
    type: String,
    required: true,
    max: 100,
  },
  code: {
    type: String,
    required: true,
    max: 5,
  },
  description: {
    type: String,
    max: 1000,
  },
  cd: {
    type: Date,
    default: Date.now,
  },
  // fk: User
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // fk: User[]
  collaborators: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
});

const Project = model('Project', scmProject, 'projects');

export default Project;
