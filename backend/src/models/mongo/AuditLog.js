const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  student_id: { type: Number, default: null },
  faculty_id: { type: Number, default: null },
  action: { type: String, required: true },
  details: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

const AuditLog = mongoose.model('AuditLog', AuditLogSchema, 'audit_logs');

module.exports = { AuditLog };
