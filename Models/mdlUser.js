import { Schema, model } from 'mongoose';

const scmUser = new Schema({
  username: {
    type: String,
    required: true,
    min: 2,
    max: 100,
  },
  email: {
    type: String,
    required: true,
    max: 100,
  },
  name: {
    type: String,
    required: true,
    max: 200,
  },
  password: {
    type: String,
    required: true,
    max: 1024,
  },
  create_date: {
    type: Date,
    default: Date.now,
  },
  is_active: {
    type: Boolean,
    required: true,
    default: true,
  },
  // fk: Department
  department: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Department',
  },
  // fk: Position
  position: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Position',
  },
  // fk: Project[]
  projects: [
    Schema({
      project: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Project',
      },
      last_accessed: {
        type: Date,
        default: Date.now,
      },
    }),
  ],
});

const User = model('User', scmUser, 'users');

export default User;
