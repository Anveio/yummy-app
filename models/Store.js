const mongoose = require('mongoose');
const slug = require('slugs')

mongoose.Promise = global.Promise;
const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name!'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates!'
    }],
    address: {
      type: String,
      required: 'You must supply an address!'
    }
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  }
})

// Define out indexes
storeSchema.index({
  name: 'text',
  description: 'text'
})

storeSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    return next();;
  }
  
  // Handle slugs with potentially identical names
  this.slug = slug(this.name);
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i')

  // this.constructor? Because you can't reference Store before it's created
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx})

  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length+1}`
  }

  next();
})

storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    // Group by tag, and then each field will have a count field that gets incremented
    { $group: { _id: '$tags', count: { $sum: 1 }}},
    { $sort: { count: -1 }}
  ]);
}

module.exports = mongoose.model('Store', storeSchema);