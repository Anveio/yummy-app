const mongoose = require("mongoose");
const slug = require("slugs");
const validator = require("validator");

mongoose.Promise = global.Promise;
const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      validate: [validator.isAscii, "Illegal characters in store name"],
      required: "Please enter a store name."
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
        default: "Point"
      },
      coordinates: [
        {
          type: Number,
          required: "You must supply coordinates!"
        }
      ],
      address: {
        type: String,
        required: "You must supply an address!"
      }
    },
    photo: String,
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: "You must supply an author"
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Define our indexes
storeSchema.index({
  name: "text",
  description: "text"
});

storeSchema.index({
  location: "2dsphere"
});

storeSchema.pre("save", async function(next) {
  if (!this.isModified("name")) {
    return next();
  }

  // Enforce 60 character limit
  this.name = this.name.split("").slice(0, 39);

  // Handle slugs with potentially identical names
  this.slug = slug(this.name);
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, "i");

  // this.constructor? Because you can't reference Store before it's created
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });

  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }

  next();
});

storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: "$tags" },
    // Group by tag, and then each field will have a count field that gets incremented
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

storeSchema.statics.getTopStores = function() {
  return this.aggregate([
    // Lookup Stores and populate their reviews.
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "store",
        as: "reviews"
      }
    },
    // Only include stores that have at least two reviews (indexing starts at 0)
    { $match: { "reviews.1": { $exists: true } } },
    // Project creates a new document with custom fields. Here we get the avgRating
    {
      $project: {
        slug: "$$ROOT.slug",
        photo: "$$ROOT.photo",
        name: "$$ROOT.name",
        reviews: "$$ROOT.reviews",
        averageRating: { $avg: "$reviews.rating" }
      }
    },
    // Best reviews at the top, lowest at the bottom.
    { $sort: { averageRating: -1 } },
    // Take only a certain amount.
    { $limit: 10 }
  ]);
};

// Find reviews where the stores._id property === review.store
// Links the _id of a store to reviews that have a stores._id equal to the local field
storeSchema.virtual("reviews", {
  ref: "Review", // what model to link?
  localField: "_id", // which field on the store?
  foreignField: "store" // which field on the review?
});

function autopopulate(next) {
  this.populate("reviews");
  next();
}

storeSchema.pre("find", autopopulate);
storeSchema.pre("findOne", autopopulate);

module.exports = mongoose.model("Store", storeSchema);
