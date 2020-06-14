import { Schema, model } from 'mongoose';

const scmPosition = new Schema({
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

const Position = model('Position', scmPosition, 'positions');

export default Position;
