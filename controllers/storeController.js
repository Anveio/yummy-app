const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next){
    const isPhoto = file.mimetype.startsWith('image/')
    if (isPhoto) {
      next(null, true);
    } else {
      next({ messsage: `That filetype isn't supported` }, false);
    }
  }
}

exports.homePage = (req, res) => {
  res.render('index');
}

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' });
}

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // Check if there is no new file to resize
  if (!req.file) {
    next();
    return;
  }

  const extension = req.file.mimetype.split('/')[1]
  req.body.photo = `${uuid.v4()}.${extension}` 

  // Do the actual resizing and save
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);

  next();
}

exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully Created: ${store.name}. Care to leave a review?`);
  res.redirect(`/store/${store.slug}`);
}

exports.getStores = async (req, res) => {
  const page = req.params.page || 1
  const limit = 10;
  const skip = (page * limit) - limit;
  const storesPromise = Store
    .find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' })
  const countPromise = Store.count();

  const [stores, count] = await Promise.all([storesPromise, countPromise]);
  const pages = Math.ceil(count / limit);
  if (!stores.length && skip) {
    req.flash('info', `Page ${page} doesn't exist. You've been redirected to page ${pages}`)
    res.redirect(`/stores/page/${pages}`)
    return;
  }
  res.render('stores', { title: 'Stores', stores, page, pages, count })
}

exports.updateStore = async (req, res) => {
  // MongoDB doesn't activate default values when updating
  req.body.location.type = 'Point';

  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the new store instead of the old one
    runValidators: true
  }).exec();
  req.flash('success', `Successfully Updated: <strong>${store.name}</strong> | <a href="/store/${store.slug}">View Store </a>`)
  res.redirect(`/store/${store._id}/edit`);
}

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('You do not have permission to edit this store');
  }
}

exports.editStore = async (req, res) => {
  const store = await Store.findOne({ _id: req.params.id });
  confirmOwner(store, req.user);
  res.render('editStore', { title: `Edit ${store.name}`, store })
}

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store
    .findOne({ slug: req.params.slug })
    .populate('author reviews');

  if (!store) return next();
  res.render('store', { title: store.name, store })
}

exports.getStoresByTag = async (req, res) => {
  const selectedTag = req.params.tag
  const tagQuery = selectedTag || { $exists: true }
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });

  const [tags, stores] = await Promise.all([ tagsPromise, storesPromise ]);
  res.render('tag', { tags, title: 'Tags', tag: selectedTag || "All Tags", stores })
}

exports.validateStore = (req, res, next) => {
  req.checkBody('name', 'Store name cannot be blank').notEmpty();
  req.checkBody('description', "Description cannot be blank").notEmpty();
  req.checkBody('location[address]', "Address cannot be blank").notEmpty();

  req.checkBody('name', "Store name cannot be greater than 40 characters").len(1, 40);

  const errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    res.redirect('back');
    return;
  }

  next();
}

exports.searchStores = async (req, res) => {
  const stores = await Store
  .find({
    $text: { $search: req.query.q }
  }, {
    score: { $meta: 'textScore' }
  })
  .sort({

    score: { $meta: 'textScore' }
  })
  .limit(5)
  res.json(stores);
}

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 10000 // 10km
      }
    }
  }
  
  const stores = await Store.find(q).select('slug name description location photo').limit(10);
  res.json(stores);
}

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' })
}

exports.favoriteStore = async (req, res) => {
  const favorites = req.user.favorites.map(obj => obj.toString())
  // $pull removes the favorite store, $addToSet adds the favorite store
  const operator = favorites.includes(req.params.id) ? '$pull' : '$addToSet';

  const user = await User.findByIdAndUpdate(req.user._id, 
    { [operator]: { favorites: req.params.id } },
    { new: true }
  );

  res.json(user);
}

exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores();
  // res.json(stores);
  res.render('topStores', { stores, title: '★ Top Stores!' })
}