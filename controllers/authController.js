const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose')
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Login failed',
  successRedirect: '/',
  successFlash: 'You are now logged in!'
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out!');
  res.redirect('/');
}

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    req.flash('error', 'Please log in first.')
    res.redirect('/login')
  }
}

exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email })
  // Check if email exists
  if(!user) {
    req.flash('info', "If an account with that email exists, an email will be sent with instructions for resetting your password.");
    return res.redirect('/login');
  }
  // Set reset token & expiry on account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000
  await user.save();
  // Send the email with the token to the user
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`
  await mail.send({
    user,
    subject: 'Password Reset',
    resetURL,
    filename: 'password-reset'
  });
  req.flash('info', `If an account with that email exists, an email will be sent with instructions for resetting your password.`)
  res.redirect('/login')
}

exports.resetPasswordForm = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token ,
    resetPasswordExpires: { $gt: Date.now() }
  })

  if (user) {
    res.render('reset', { title: 'Reset your Password' })
  } else {
    req.flash('error', 'Invalid password reset URL or it has expired');
    return res.redirect('/login');
  }
}

exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    next()
  } else {
    req.flash('error', "Passwords don't match.");
    res.redirect('back');
  }
}

exports.resetPassword = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    // Search for a expiry date that is in the future (gt == greater than)
    resetPasswordExpires: { $gt: Date.now() }
  })

  if (!user) {
    req.flash('error', 'Invalid password reset URL or it has expired');
    return res.redirect('/login');
  }

  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save();
  req.login(updatedUser);
  req.flash('success', 'Your password has been reset.')
  res.redirect('/')
}
