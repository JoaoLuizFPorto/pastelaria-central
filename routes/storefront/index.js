const express = require('express');
const router = express.Router();


router.use(require('./catalog'));


router.use(require('./favorites'));


router.use(require('./cart'));


router.use(require('./orders'));

module.exports = router;
