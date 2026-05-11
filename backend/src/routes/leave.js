const express = require('express');
const { LeaveRequest } = require('../models/mongo/LeaveRequest');
const { Attendance } = require('../models/sql');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// Student applies for leave
router.post('/', authRequired, requireRole('student'), async (req, res, next) => {
  try {
    const { student_id, from_date, to_date, reason } = req.body;
    if (Number(req.user.id) !== Number(student_id)) {
      return res.status(403).json({ error: 'You can only apply leave for yourself' });
    }

    if (!student_id || !from_date || !to_date || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const leaveReq = await LeaveRequest.create({
      student_id,
      from_date,
      to_date,
      reason,
      status: 'Pending',
    });
    res.status(201).json(leaveReq);
  } catch (err) {
    next(err);
  }
});

// Get leave requests for a student
router.get('/student/:student_id', authRequired, async (req, res, next) => {
  try {
    const studentId = Number(req.params.student_id);
    if (req.user.role === 'student' && Number(req.user.id) !== studentId) {
      return res.status(403).json({ error: 'You can only view your own leave requests' });
    }

    const list = await LeaveRequest.find({ student_id: studentId })
      .sort({ applied_at: -1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.get('/', authRequired, requireRole('faculty'), async (req, res, next) => {
  try {
    const list = await LeaveRequest.find({}).sort({ applied_at: -1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// Admin approves leave and syncs to attendance
router.post('/:id/approve', authRequired, requireRole('faculty'), async (req, res, next) => {
  try {
    const leaveReq = await LeaveRequest.findById(req.params.id);
    if (!leaveReq) return res.status(404).json({ error: 'Leave request not found' });

    leaveReq.status = 'Approved';
  leaveReq.reviewed_by = Number(req.user.id);
    await leaveReq.save();

    // For simplicity, create a single attendance record with status 'Leave'
    await Attendance.create({
      student_id: leaveReq.student_id,
      course_id: null,
      date: leaveReq.from_date,
      status: 'Leave',
    });

    res.json(leaveReq);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reject', authRequired, requireRole('faculty'), async (req, res, next) => {
  try {
    const leaveReq = await LeaveRequest.findById(req.params.id);
    if (!leaveReq) return res.status(404).json({ error: 'Leave request not found' });

    leaveReq.status = 'Rejected';
    leaveReq.reviewed_by = Number(req.user.id);
    await leaveReq.save();

    res.json(leaveReq);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
