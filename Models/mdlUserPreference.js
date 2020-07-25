import { Schema, model } from 'mongoose';

const scmUserPreference = new Schema({
  is_dark_theme: {
    type: Boolean,
  },
  color_primary_light: {
    type: String,
    max: 7,
  },
  color_primary_dark: {
    type: String,
    max: 7,
  },
  // fk: User
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
});

const UserPreference = model('UserPreference', scmUserPreference, 'user_preferences');

export default UserPreference;
