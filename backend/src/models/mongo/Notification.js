const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  student_id: { type: Number, default: null, index: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
}, { timestamps: true });

const Notification = mongoose.model('Notification', NotificationSchema, 'notifications');

module.exports = { Notification };
