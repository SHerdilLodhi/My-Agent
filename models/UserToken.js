const mongoose = require('mongoose');

const userTokenSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.Mixed, // Accepts both ObjectId and String (UUID)
    required: true,
    // You can still populate if it's an ObjectId
    refPath: 'userType'
  },
  userType: {
    type: String,
    default: 'User',
    enum: ['User']
  },
  provider: {
    type: String,
    required: true,
    enum: ['google_calendar', 'google_gmail', 'google_sheets', 'instagram'],
    default: 'google_calendar'
  },
  access_token: {
    type: String,
    required: true
  },
  refresh_token: {
    type: String,
    required: true
  },
  expires_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// No custom indexes - keep it simple
module.exports = mongoose.model('UserToken', userTokenSchema);