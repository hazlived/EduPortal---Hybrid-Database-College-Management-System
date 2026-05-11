const { sequelize } = require('../../config/dbSql');
const { DataTypes } = require('sequelize');

const Student = sequelize.define('Student', {
  student_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: DataTypes.STRING,
  email: { type: DataTypes.STRING, unique: true },
  branch: DataTypes.STRING,
  semester: DataTypes.INTEGER,
  password_hash: DataTypes.TEXT,
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'students',
  timestamps: false,
});

const Faculty = sequelize.define('Faculty', {
  faculty_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: DataTypes.STRING,
  email: { type: DataTypes.STRING, unique: true },
  department: DataTypes.STRING,
  password_hash: DataTypes.TEXT,
}, {
  tableName: 'faculty',
  timestamps: false,
});

const Course = sequelize.define('Course', {
  course_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  course_name: DataTypes.STRING,
  credits: DataTypes.INTEGER,
  department: DataTypes.STRING,
}, {
  tableName: 'courses',
  timestamps: false,
});

const Enrollment = sequelize.define('Enrollment', {
  enrollment_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
}, {
  tableName: 'enrollments',
  timestamps: false,
});

const Mark = sequelize.define('Mark', {
  mark_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  mid_marks: DataTypes.FLOAT,
  end_marks: DataTypes.FLOAT,
  total_marks: DataTypes.FLOAT,
  grade: DataTypes.STRING(2),
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'marks',
  timestamps: false,
});

const Attendance = sequelize.define('Attendance', {
  attendance_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  date: DataTypes.DATEONLY,
  status: DataTypes.STRING,
}, {
  tableName: 'attendance',
  timestamps: false,
});

const GpaRecord = sequelize.define('GpaRecord', {
  gpa_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  semester: DataTypes.INTEGER,
  gpa: DataTypes.FLOAT,
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'gpa_records',
  timestamps: false,
});

// Associations
Enrollment.belongsTo(Student, { foreignKey: 'student_id' });
Enrollment.belongsTo(Course, { foreignKey: 'course_id' });

Mark.belongsTo(Student, { foreignKey: 'student_id' });
Mark.belongsTo(Course, { foreignKey: 'course_id' });

Attendance.belongsTo(Student, { foreignKey: 'student_id' });
Attendance.belongsTo(Course, { foreignKey: 'course_id' });

GpaRecord.belongsTo(Student, { foreignKey: 'student_id' });

module.exports = {
  sequelize,
  Student,
  Faculty,
  Course,
  Enrollment,
  Mark,
  Attendance,
  GpaRecord,
};
