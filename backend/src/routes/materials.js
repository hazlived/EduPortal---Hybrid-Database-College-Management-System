const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { CourseMaterial } = require('../models/mongo/CourseMaterial');
const { Course } = require('../models/sql');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads/materials');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

// Get materials for a course
router.get('/course/:course_id', authRequired, async (req, res, next) => {
  try {
    const doc = await CourseMaterial.findOne({ course_id: Number(req.params.course_id) });
    res.json(doc || { course_id: Number(req.params.course_id), materials: [] });
  } catch (err) {
    next(err);
  }
});

router.get('/catalog', authRequired, async (req, res, next) => {
  try {
    const [courses, materialDocs] = await Promise.all([
      Course.findAll({ order: [['course_name', 'ASC']] }),
      CourseMaterial.find({}).sort({ uploaded_at: -1 }),
    ]);

    const catalog = courses.map((course) => {
      const doc = materialDocs.find((item) => Number(item.course_id) === Number(course.course_id));
      return {
        course_id: course.course_id,
        course_name: course.course_name,
        department: course.department,
        materials: doc?.materials || [],
      };
    }).filter((item) => item.materials.length > 0);

    res.json(catalog);
  } catch (err) {
    next(err);
  }
});

router.post('/upload', authRequired, requireRole('faculty'), upload.single('file'), async (req, res, next) => {
  try {
    const { course_id, uploaded_by, title } = req.body;
    if (!course_id || !uploaded_by || !title || !req.file) {
      return res.status(400).json({ error: 'course_id, uploaded_by, title and file are required' });
    }

    const normalizedCourseId = Number(course_id);
    const normalizedUploadedBy = Number(uploaded_by);
    const fileUrl = `/uploads/materials/${req.file.filename}`;

    const doc = await CourseMaterial.findOne({ course_id: normalizedCourseId });
    const material = {
      title,
      url: fileUrl,
      uploaded_by: normalizedUploadedBy,
      uploaded_at: new Date(),
      file_name: req.file.originalname,
      file_size: req.file.size,
      kind: 'file',
    };

    if (doc) {
      doc.materials.push(material);
      await doc.save();
      return res.json(doc);
    }

    const created = await CourseMaterial.create({
      course_id: normalizedCourseId,
      uploaded_by: normalizedUploadedBy,
      materials: [material],
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// Faculty uploads course material metadata
router.post('/', authRequired, requireRole('faculty'), async (req, res, next) => {
  try {
    const { course_id, uploaded_by, title, url } = req.body;
    if (!course_id || !uploaded_by || !title || !url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const doc = await CourseMaterial.findOne({ course_id });
    const material = { title, url, uploaded_by, uploaded_at: new Date() };

    if (doc) {
      doc.materials.push(material);
      await doc.save();
      return res.json(doc);
    }

    const created = await CourseMaterial.create({
      course_id,
      uploaded_by,
      materials: [material],
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
