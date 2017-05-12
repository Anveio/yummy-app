const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');


exports.loginForm = (req, res) => {
  res.render('login', { title: 'Login' })
}

exports.signupForm = (req, res) => {
  res.render('signup', { title: 'Sign Up' })
}

exports.validateSignup = (req, res, next) => {
  req.sanitizeBody('name');
  req.checkBody('name', 'Please enter a username').notEmpty();
  req.checkBody('email', `That email isn't valid.`).isEmail();
  req.sanitizeBody('email').normalizeEmail({ 
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  });
  req.checkBody('password', "Password cannot be blank").notEmpty();
  req.checkBody('password-confirm', 'Confirmed password cannot be blank').notEmpty();
  req.checkBody('password-confirm', "Your passwords don't match.").equals(req.body.password);

  const errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('signup', { title: "signup", body: req.body, flashes: req.flash() })
    return;
  }
  next();
}

exports.createUser = async (req, res, next) => {
  const user = new User({ email: req.body.email, name: req.body.name });

  // User.register does not return a promise, promisify makes it do so
  const createUserWithPromise = promisify(User.register, User);
  await createUserWithPromise(user, req.body.password);
  next();
}

exports.showAccount = (req, res) => {
  res.render('showAccount', { title: 'Edit Your Account' })
}

exports.updateAccount = async (req, res) => {
  const updates = {
    name: req.body.name,
    email: req.body.email
  };

  const user = await User.findOneAndUpdate(
    
    { _id: req.user._id }, // Query
    { $set: updates }, // New Data
    { new: true, runValidators: true, context: 'query' } // Options
  );
  req.flash('success', 'Your account info has been updated');
  res.redirect('back');
}