const router = require('express').Router();

//TO BE IMPLEMENTED:

router.use('/music', require('./music'));
router.use('/users', require('./users'));
router.use('/quotes', require('./quotes'));
router.use('/poems', require('./poems'));

module.exports = router;
