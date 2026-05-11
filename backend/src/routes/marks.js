const express = require('express');
const { Mark, GpaRecord } = require('../models/sql');
const { logAudit } = require('../utils/syncEngine');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

function calcGrade(total) {
  return total >= 90 ? 'A+' : total >= 80 ? 'A' : total >= 70 ? 'B' : total >= 60 ? 'C' : 'F';
}

async function refreshGpa(student_id) {
  const allMarks = await Mark.findAll({ where: { student_id } });
  const gpa = allMarks.length
    ? Math.round((allMarks.reduce((s, m) => s + (m.total_marks || 0), 0) / allMarks.length / 25) * 100) / 100
    : 0;
  await GpaRecord.upsert({ student_id, semester: 1, gpa });
  return gpa;
}

// Faculty enters marks — rejects duplicate course entries
router.post('/', authRequired, requireRole('faculty'), async (req, res, next) => {
  try {
    const { student_id, course_id, mid_marks, end_marks } = req.body;
    if (!student_id || !course_id) {
      return res.status(400).json({ error: 'student_id and course_id are required' });
    }

    const existing = await Mark.findOne({ where: { student_id, course_id } });
    if (existing) {
      return res.status(409).json({ error: 'Marks already exist for this student in this course. Use update instead.' });
    }

    const total = (Number(mid_marks) || 0) + (Number(end_marks) || 0);
    const grade = calcGrade(total);

    const mark = await Mark.create({ student_id, course_id, mid_marks, end_marks, total_marks: total, grade });
    const gpa = await refreshGpa(student_id);

    await logAudit({
      studentId: student_id,
      facultyId: null,
      action: 'marks_added',
      details: { course_id, mid_marks, end_marks, total, grade },
    });

    res.status(201).json({ mark, gpa });
  } catch (err) {
    next(err);
  }
});

// Get marks + latest GPA for a student
router.get('/student/:student_id', authRequired, async (req, res, next) => {
  try {
    const student_id = Number(req.params.student_id);

    if (req.user.role === 'student' && Number(req.user.id) !== student_id) {
      return res.status(403).json({ error: 'You can only view your own marks' });
    }

    const marks = await Mark.findAll({ where: { student_id } });
    const gpaRecord = await GpaRecord.findOne({
      where: { student_id },
      order: [['updated_at', 'DESC']],
    });

    res.json({ marks, gpa: gpaRecord?.gpa ?? null });
  } catch (err) {
    next(err);
  }
});

// Faculty updates existing marks
router.put('/:id', authRequired, requireRole('faculty'), async (req, res, next) => {
  try {
    const mark = await Mark.findByPk(Number(req.params.id));
    if (!mark) return res.status(404).json({ error: 'Mark record not found' });

    const { mid_marks, end_marks } = req.body;
    const total = (Number(mid_marks) || 0) + (Number(end_marks) || 0);
    const grade = calcGrade(total);

    await mark.update({ mid_marks, end_marks, total_marks: total, grade });
    const gpa = await refreshGpa(mark.student_id);

    await logAudit({
      studentId: mark.student_id,
      facultyId: null,
      action: 'marks_updated',
      details: { mark_id: mark.mark_id, mid_marks, end_marks, total, grade },
    });

    res.json({ mark, gpa });
  } catch (err) {
    next(err);
  }
});

// Faculty deletes marks for a course
router.delete('/:id', authRequired, requireRole('faculty'), async (req, res, next) => {
  try {
    const mark = await Mark.findByPk(Number(req.params.id));
    if (!mark) return res.status(404).json({ error: 'Mark record not found' });

    const { student_id, course_id } = mark;
    await mark.destroy();
    const gpa = await refreshGpa(student_id);

    await logAudit({
      studentId: student_id,
      facultyId: null,
      action: 'marks_deleted',
      details: { course_id },
    });

    res.json({ success: true, gpa });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
