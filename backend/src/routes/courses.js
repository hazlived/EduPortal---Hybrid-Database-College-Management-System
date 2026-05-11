const express = require('express');
const { Course, Student, Faculty, Enrollment } = require('../models/sql');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authRequired, async (req, res, next) => {
  try {
    const courses = await Course.findAll({ order: [['course_name', 'ASC']] });
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

router.get('/my-enrollments', authRequired, requireRole('student'), async (req, res, next) => {
  try {
    const enrollments = await Enrollment.findAll({
      where: { student_id: Number(req.user.id) },
      include: [{ model: Course }],
      order: [[Course, 'course_name', 'ASC']],
    });

    const list = enrollments.map((enrollment) => ({
      enrollment_id: enrollment.enrollment_id,
      course_id: enrollment.course_id,
      course_name: enrollment.Course?.course_name,
      credits: enrollment.Course?.credits,
      department: enrollment.Course?.department,
    }));

    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.post('/enroll', authRequired, requireRole('student'), async (req, res, next) => {
  try {
    const course_id = Number(req.body.course_id);
    if (!course_id) {
      return res.status(400).json({ error: 'course_id is required' });
    }

    const course = await Course.findByPk(course_id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const [enrollment, created] = await Enrollment.findOrCreate({
      where: {
        student_id: Number(req.user.id),
        course_id,
      },
    });

    res.status(created ? 201 : 200).json({
      message: created ? 'Enrollment successful' : 'Already enrolled in this course',
      enrollment,
      already_enrolled: !created,
    });
  } catch (err) {
    next(err);
  }
});

// Faculty views a specific student's enrolled courses
router.get('/student/:id/enrollments', authRequired, requireRole('faculty'), async (req, res, next) => {
  try {
    const enrollments = await Enrollment.findAll({
      where: { student_id: Number(req.params.id) },
      include: [{ model: Course }],
      order: [[Course, 'course_name', 'ASC']],
    });

    const list = enrollments.map((e) => ({
      enrollment_id: e.enrollment_id,
      course_id: e.course_id,
      course_name: e.Course?.course_name,
      credits: e.Course?.credits,
      department: e.Course?.department,
    }));

    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.get('/students', authRequired, requireRole('faculty'), async (req, res, next) => {
  try {
    const students = await Student.findAll({ order: [['name', 'ASC']] });
    res.json(students);
  } catch (err) {
    next(err);
  }
});

router.get('/faculty/:id', authRequired, async (req, res, next) => {
  try {
    const faculty = await Faculty.findByPk(Number(req.params.id));
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
    res.json(faculty);
  } catch (err) {
    next(err);
  }
});

router.get('/:course_id/students', authRequired, requireRole('faculty'), async (req, res, next) => {
  try {
    const enrollments = await Enrollment.findAll({
      where: { course_id: Number(req.params.course_id) },
      include: [{ model: Student }],
      order: [[Student, 'name', 'ASC']],
    });

    const students = enrollments
      .map((enrollment) => enrollment.Student)
      .filter(Boolean)
      .map((student) => ({
        student_id: student.student_id,
        name: student.name,
        email: student.email,
        branch: student.branch,
        semester: student.semester,
      }));

    res.json(students);
  } catch (err) {
    next(err);
  }
});

module.exports = router;