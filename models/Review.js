const mongoose = require('mongoose');
const slug= require('slugs');

mongoose.Promise = global.Promise;

const reviewSchema = new mongoose.Schema({
  text: {
    type: String,
    required: 'Your review has to contain some text'
  },
  created: {
    type: Date,
    default: Date.now
  },
  store: {
    type: mongoose.Schema.ObjectId, 
    ref: 'Store'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: 'Your review must contain a rating.'
  },
  author: {
    type: mongoose.Schema.ObjectId, 
    ref: 'User',
    required: 'Error assigning an author to your review'
  }
});

module.exports = mongoose.model('Review', reviewSchema);