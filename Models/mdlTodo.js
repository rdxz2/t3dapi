import { model, Schema } from 'mongoose';

const scmToDo = new Schema({
  description: {
    type: String,
    required: true,
    max: 100,
  },
  is_completed: {
    type: Boolean,
    required: true,
    default: false,
  },
  create_date: {
    type: Date,
    default: Date.now,
  },
  update_date: {
    type: Date,
  },
  is_active: {
    type: Boolean,
    required: true,
    default: true,
  },
  // fk: User
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // fk: Project
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
});

const Todo = model('Todo', scmToDo, 'todos');

export default Todo;
