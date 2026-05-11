const express = require('express');
const { Notification } = require('../models/mongo/Notification');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/:student_id', authRequired, async (req, res, next) => {
  try {
    const studentId = Number(req.params.student_id);
    if (req.user.role === 'student' && Number(req.user.id) !== studentId) {
      return res.status(403).json({ error: 'You can only view your own notifications' });
    }

    const list = await Notification.find({
      $or: [{ student_id: null }, { student_id: studentId }],
    }).sort({ created_at: -1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.post('/', authRequired, requireRole('faculty'), async (req, res, next) => {
  try {
    const { type, message } = req.body;
    if (!type || !message) {
      return res.status(400).json({ error: 'type and message are required' });
    }

    const created = await Notification.create({
      student_id: null,
      type,
      message,
      is_read: false,
      created_at: new Date(),
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
