const mongoose = require('mongoose');

const schemaRestaurants = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 255,
    trim: true
  },
  address: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    maxlength: 20,
    trim: true
  },
  opening_hours: {
    type: String,
    required: true,
    maxlength: 255,
    trim: true
  }
}, { timestamps: true });

schemaRestaurants.index({ name: 1 });
schemaRestaurants.index({ address: 1 });

const Restaurants = mongoose.model('Restaurant', schemaRestaurants);

module.exports = Restaurants;