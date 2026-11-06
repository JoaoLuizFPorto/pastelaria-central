const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../../lib/session');


router.use('/admin', requireAdmin);


router.get('/admin', (req, res) => res.render('admin/dashboard', { headPartial: 'head/admin' }));


router.use(require('./products'));


router.use(require('./orders'));

module.exports = router;
