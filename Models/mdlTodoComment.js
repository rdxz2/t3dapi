import { model, Schema } from 'mongoose';

const scmTodoComment = new Schema({
  description: {
    type: String,
    required: true,
    max: 100,
  },
  create_date: {
    type: Date,
    default: Date.now,
  },
  // fk: TodoComment
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'TodoComment',
  },
  // fk: Todo
  todo: {
    type: Schema.Types.ObjectId,
    ref: 'Todo',
    required: true,
  },
  // fk: User
  commenter: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

const TodoComment = model('TodoComment', scmTodoComment, 'todo_comments');

export default TodoComment;
