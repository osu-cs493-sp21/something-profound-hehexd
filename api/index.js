const router = require('express').Router();

//TO BE IMPLEMENTED:

//poems
//quotes
//music
//users
router.use('/users', require('./users'));

module.exports = router;
