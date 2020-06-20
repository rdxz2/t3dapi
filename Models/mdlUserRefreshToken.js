import { Schema, model } from 'mongoose';

const scmUserRefreshToken = new Schema({
  refresh_token: {
    type: String,
    required: true,
    max: 16,
  },
  expired_date: {
    type: Date,
    required: true,
  },
  // fk: User
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
});

const UserRefreshToken = model('UserRefreshToken', scmUserRefreshToken, 'userrefreshtokens');

export default UserRefreshToken;
