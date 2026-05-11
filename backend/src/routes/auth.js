
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Student, Faculty } = require('../models/sql');
const { Portfolio } = require('../models/mongo/Portfolio');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// Student registration
router.post('/register/student', async (req, res, next) => {
  try {
    const { name, email, branch, semester, password } = req.body;
    if (!name || !email || !branch || !semester || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const existing = await Student.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    const password_hash = await bcrypt.hash(password, 10);
    const student = await Student.create({ name, email, branch, semester, password_hash });

    // Auto-create portfolio (workflow step 2)
    await Portfolio.create({ 
      student_id: student.student_id, 
      resumes: [], 
      projects: [], 
      achievements: [] 
    });

    const token = jwt.sign(
      { id: student.student_id, role: 'student' },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '8h' }
    );

    res.status(201).json({ 
      message: 'Student registered successfully', 
      student_id: student.student_id,
      name: student.name,
      branch: student.branch,
      semester: student.semester,
      token 
    });
  } catch (err) {
    next(err);
  }
});

// Faculty registration (admin-only in production, open for demo)
router.post('/register/faculty', async (req, res, next) => {
  try {
    const { name, email, department, password } = req.body;
    if (!name || !email || !department || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const existing = await Faculty.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    const password_hash = await bcrypt.hash(password, 10);
    const faculty = await Faculty.create({ name, email, department, password_hash });

    const token = jwt.sign(
      { id: faculty.faculty_id, role: 'faculty' },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '8h' }
    );

    res.status(201).json({ 
      message: 'Faculty registered successfully', 
      faculty_id: faculty.faculty_id,
      name: faculty.name,
      department: faculty.department,
      token 
    });
  } catch (err) {
    next(err);
  }
});

// Login (existing)
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'email, password and role required' });
    }

    let user;
    if (role === 'student') {
      user = await Student.findOne({ where: { email } });
    } else if (role === 'faculty') {
      user = await Faculty.findOne({ where: { email } });
    } else {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (!user || !(await bcrypt.compare(password, user.password_hash || ''))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.student_id || user.faculty_id, role },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      role,
      id: user.student_id || user.faculty_id,
      name: user.name,
      branch: user.branch,
      semester: user.semester,
      department: user.department,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authRequired, async (req, res) => {
  res.json({
    id: req.user.id,
    role: req.user.role,
  });
});

module.exports = router;
