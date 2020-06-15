import { Schema, model } from 'mongoose';

const scmPosition = new Schema({
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

const Position = model('Position', scmPosition, 'positions');

export default Position;
