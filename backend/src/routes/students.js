const express = require('express');
const bcrypt = require('bcryptjs');
const { Student } = require('../models/sql');
const { Portfolio } = require('../models/mongo/Portfolio');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// Student registration
router.post('/', async (req, res, next) => {
  try {
    const { name, email, branch, semester, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, password are required' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const student = await Student.create({ name, email, branch, semester, password_hash });

    await Portfolio.create({ student_id: student.student_id, resumes: [], projects: [], achievements: [] });

    res.status(201).json({ student_id: student.student_id });
  } catch (err) {
    next(err);
  }
});

// Get a student profile summary
router.get('/:id', authRequired, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (req.user.role === 'student' && Number(req.user.id) !== id) {
      return res.status(403).json({ error: 'You can only view your own profile' });
    }

    const student = await Student.findByPk(id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const portfolio = await Portfolio.findOne({ student_id: student.student_id });
    res.json({ student, portfolio });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
