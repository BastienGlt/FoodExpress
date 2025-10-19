const mongoose = require('mongoose');

const schemaUsers = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    maxlength: 255
  },
  email: {
    type: String,
    required: true,
    unique: true,
    maxlength: 255
  },
  password: {
    type: String,
    required: true,
    maxlength: 255,
    minlength: 6
  },
  role: {
    type: String,
    required: true,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, { timestamps: true }); 

const Users = mongoose.model('Users', schemaUsers);

module.exports = Users;