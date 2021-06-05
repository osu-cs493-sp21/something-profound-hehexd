const router = require('express').Router();

//TO BE IMPLEMENTED:

//poems
//quotes
//music
router.use('/music', require('./music'));
//users
router.use('/users', require('./users'));

router.use('/quotes', require('./quotes'));

module.exports = router;
