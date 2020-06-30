import { model, Schema } from 'mongoose';

const scmTodoReminder = new Schema({
  description: {
    type: Date,
    required: true,
  },
  create_date: {
    type: Date,
    default: Date.now,
  },
  // fk: Todo
  todo: {
    type: Schema.Types.ObjectId,
    ref: 'Todo',
    required: true,
  },
  // fk: User
  reminded: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  ],
});

const TodoReminder = model('TodoReminder', scmTodoReminder, 'todo_reminders');

export default TodoReminder;
