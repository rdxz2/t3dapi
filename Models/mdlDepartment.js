import { Schema, model } from 'mongoose';

const scmDepartment = new Schema({
  name: {
    type: String,
    required: true,
    min: 1,
    max: 100,
  },
  cd: {
    type: Date,
    default: Date.now,
  },
});

const Department = model('Department', scmDepartment, 'departments');

export default Department;
