const express = require('express');
const { AuditLog } = require('../models/mongo/AuditLog');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const logs = await AuditLog.find({}).sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
