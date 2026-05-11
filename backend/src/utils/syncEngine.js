// Central place for cross-database sync logic
const { AuditLog } = require('../models/mongo/AuditLog');

async function logAudit({ studentId, facultyId, action, details }) {
  await AuditLog.create({
    student_id: studentId || null,
    faculty_id: facultyId || null,
    action,
    details: details || {},
    timestamp: new Date(),
  });
}

module.exports = { logAudit };
