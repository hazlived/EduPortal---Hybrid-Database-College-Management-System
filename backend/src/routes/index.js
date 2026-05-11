
const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/courses', require('./courses'));
router.use('/students', require('./students'));
router.use('/marks', require('./marks'));
router.use('/attendance', require('./attendance'));
router.use('/leave', require('./leave'));
router.use('/materials', require('./materials'));
router.use('/notifications', require('./notifications'));
router.use('/logs', require('./logs'));

module.exports = router;
