const mongoose = require("mongoose");
const slug = require("slugs");

mongoose.Promise = global.Promise;

const reviewSchema = new mongoose.Schema({
  text: {
    type: String,
    required: "Your review must contain some text."
  },
  created: {
    type: Date,
    default: Date.now
  },
  store: {
    type: mongoose.Schema.ObjectId,
    ref: "Store",
    required: "Error assigning your review to a store."
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: "Your review must contain a rating between 1 and 5 stars."
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: "Error assigning an author to your review."
  }
});

function autopopulate(next) {
  this.populate("author");
  next();
}

reviewSchema.pre("find", autopopulate);
reviewSchema.pre("findOne", autopopulate);

module.exports = mongoose.model("Review", reviewSchema);
