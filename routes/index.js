const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const { catchErrors } = require('../handlers/errorHandlers');

router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/add',
  authController.isLoggedIn,
  storeController.addStore
);

router.post('/add',
  storeController.upload, 
  catchErrors(storeController.resize),
  storeController.validateStore,
  catchErrors(storeController.createStore)
);

router.post('/add/:id',
  storeController.upload, 
  catchErrors(storeController.resize),
  storeController.validateStore,
  catchErrors(storeController.updateStore)
);

router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));
router.get('/store/:id/edit', catchErrors(storeController.editStore));

router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag))

router.get('/login', userController.loginForm);
router.post('/login', authController.login);

router.get('/logout', authController.logout)

router.get('/signup', userController.signupForm)
router.post('/signup',
  userController.validateSignup,
  catchErrors(userController.createUser),
  authController.login
)

router.get('/account', 
  authController.isLoggedIn,
  userController.showAccount
)

router.post('/account',
  authController.isLoggedIn,
  catchErrors(userController.updateAccount)
)

router.post('/passwordreset', authController.forgotPassword)
router.get('/account/reset/:token', catchErrors(authController.resetPasswordForm))
router.post('/account/reset/:token', 
  authController.confirmedPasswords,
  catchErrors(authController.resetPassword)
)
 
router.get('/map', storeController.mapPage);

/* Review */

router.post('/reviews/:id',
  authController.isLoggedIn,
  catchErrors(reviewController.addReview)
);


/* API */

router.get('/api/search', catchErrors(storeController.searchStores));
router.get('/api/stores/near', catchErrors(storeController.mapStores));

router.post('/api/stores/:id/favorite', catchErrors(storeController.favoriteStore))

module.exports = router;
