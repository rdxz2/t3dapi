import { model, Schema } from 'mongoose';
import TODO from '../Constants/TODO';
import { convertObjectValueToArray } from '../Utilities/utlType';

const scmTodo = new Schema({
  description: {
    type: String,
    required: true,
    max: 100,
  },
  tags: [
    {
      type: String,
      max: 30,
    },
  ],
  is_completed: {
    type: Boolean,
    required: true,
    default: false,
  },
  is_important: {
    type: Boolean,
    required: true,
    default: false,
  },
  priority: {
    type: Number,
    required: true,
    default: TODO.PRIORITY.NORMAL,
    enum: convertObjectValueToArray(TODO.PRIORITY),
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

const Todo = model('Todo', scmTodo, 'todos');

export default Todo;
