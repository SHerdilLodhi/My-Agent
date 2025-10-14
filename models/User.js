const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  }
}, {
  timestamps: true
});

// No custom indexes - mongoose will handle unique constraint automatically
module.exports = mongoose.model('User', userSchema); 