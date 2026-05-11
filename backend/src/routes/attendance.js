const express = require('express');
const { Attendance, Course } = require('../models/sql');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// Faculty marks daily attendance
router.post('/', authRequired, requireRole('faculty'), async (req, res, next) => {
  try {
    const { student_id, course_id, date, status } = req.body;
    if (!student_id || !course_id || !status) {
      return res
        .status(400)
        .json({ error: 'student_id, course_id and status are required' });
    }

    const record = await Attendance.create({ student_id, course_id, date, status });
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

// Get attendance records for a student
router.get('/student/:student_id', authRequired, async (req, res, next) => {
  try {
    const studentId = Number(req.params.student_id);
    if (req.user.role === 'student' && Number(req.user.id) !== studentId) {
      return res.status(403).json({ error: 'You can only view your own attendance' });
    }

    const records = await Attendance.findAll({
      where: { student_id: studentId },
      order: [['date', 'DESC']],
    });
    res.json(records);
  } catch (err) {
    next(err);
  }
});

// Per-course attendance detail for a student
router.get('/student/:student_id/course/:course_id', authRequired, async (req, res, next) => {
  try {
    const studentId = Number(req.params.student_id);
    const courseId  = Number(req.params.course_id);

    if (req.user.role === 'student' && Number(req.user.id) !== studentId) {
      return res.status(403).json({ error: 'You can only view your own attendance' });
    }

    const records = await Attendance.findAll({
      where: { student_id: studentId, course_id: courseId },
      order: [['date', 'DESC']],
    });

    res.json(records);
  } catch (err) {
    next(err);
  }
});

router.get('/student/:student_id/summary', authRequired, async (req, res, next) => {
  try {
    const studentId = Number(req.params.student_id);
    if (req.user.role === 'student' && Number(req.user.id) !== studentId) {
      return res.status(403).json({ error: 'You can only view your own attendance' });
    }

    const records = await Attendance.findAll({
      where: { student_id: studentId },
      include: [{ model: Course, attributes: ['course_name'] }],
      order: [['date', 'DESC']],
    });

    const courseStats = {};
    records.forEach((row) => {
      if (!row.course_id) return;

      const key = row.course_id || 0;
      if (!courseStats[key]) {
        courseStats[key] = {
          course_id: row.course_id,
          course_name: row.Course?.course_name || `Course ${row.course_id}`,
          total_classes: 0,
          present_classes: 0,
          percentage: 0,
        };
      }

      courseStats[key].total_classes += 1;
      if (row.status === 'Present') {
        courseStats[key].present_classes += 1;
      }
    });

    const by_course = Object.values(courseStats).map((item) => ({
      ...item,
      percentage: item.total_classes
        ? Math.round((item.present_classes / item.total_classes) * 100)
        : 0,
    }));

    const totalClasses = by_course.reduce((sum, c) => sum + c.total_classes, 0);
    const totalPresent = by_course.reduce((sum, c) => sum + c.present_classes, 0);
    const overall_percentage = totalClasses ? Math.round((totalPresent / totalClasses) * 100) : 0;

    res.json({
      student_id: studentId,
      overall_percentage,
      by_course,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
