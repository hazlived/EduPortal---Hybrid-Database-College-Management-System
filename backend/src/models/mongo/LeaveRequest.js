const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema({
  student_id: { type: Number, required: true, index: true },
  from_date: { type: Date, required: true },
  to_date: { type: Date, required: true },
  reason: { type: String, required: true },
  attachments: { type: [Object], default: [] },
  status: { type: String, default: 'Pending' },
  applied_at: { type: Date, default: Date.now },
  reviewed_by: { type: Number, default: null },
}, { timestamps: true });

const LeaveRequest = mongoose.model('LeaveRequest', LeaveRequestSchema, 'leave_requests');

module.exports = { LeaveRequest };
