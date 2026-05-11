const mongoose = require('mongoose');

const CourseMaterialSchema = new mongoose.Schema({
  course_id: { type: Number, required: true, index: true },
  materials: { type: [Object], default: [] },
  uploaded_by: { type: Number, required: true },
  uploaded_at: { type: Date, default: Date.now },
}, { timestamps: true });

const CourseMaterial = mongoose.model('CourseMaterial', CourseMaterialSchema, 'course_materials');

module.exports = { CourseMaterial };
