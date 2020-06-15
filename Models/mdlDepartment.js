import { Schema, model } from 'mongoose';

const scmDepartment = new Schema({
  name: {
    type: String,
    required: true,
    min: 1,
    max: 100,
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
});

const Department = model('Department', scmDepartment, 'departments');

export default Department;
