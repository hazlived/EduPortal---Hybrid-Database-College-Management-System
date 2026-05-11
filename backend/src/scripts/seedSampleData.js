require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, Course, Student, Enrollment } = require('../models/sql');

async function seedCourses() {
  const courses = [
    { course_name: 'Database Management Systems', credits: 4, department: 'CSE' },
    { course_name: 'Operating Systems', credits: 4, department: 'CSE' },
    { course_name: 'Computer Networks', credits: 3, department: 'CSE' },
    { course_name: 'Software Engineering', credits: 3, department: 'CSE' },
    { course_name: 'Data Structures', credits: 4, department: 'CSE' },
  ];

  const createdCourses = [];
  for (const course of courses) {
    const [record] = await Course.findOrCreate({
      where: { course_name: course.course_name },
      defaults: course,
    });
    createdCourses.push(record);
  }

  return createdCourses;
}

async function seedStudents() {
  const plainPassword = 'pass123';
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const students = [
    { name: 'Aiman Rahman', email: 'aiman@student.edu', branch: 'CSE', semester: 4, password_hash: passwordHash },
    { name: 'Sara Ali', email: 'sara@student.edu', branch: 'CSE', semester: 4, password_hash: passwordHash },
    { name: 'Zahid Hasan', email: 'zahid@student.edu', branch: 'CSE', semester: 4, password_hash: passwordHash },
    { name: 'Nabila Noor', email: 'nabila@student.edu', branch: 'CSE', semester: 4, password_hash: passwordHash },
    { name: 'Tariq Hossain', email: 'tariq@student.edu', branch: 'CSE', semester: 4, password_hash: passwordHash },
  ];

  const createdStudents = [];
  for (const student of students) {
    const [record] = await Student.findOrCreate({
      where: { email: student.email },
      defaults: student,
    });
    createdStudents.push(record);
  }

  return createdStudents;
}

async function seedEnrollments(students, courses) {
  for (const student of students) {
    for (const course of courses.slice(0, 4)) {
      await Enrollment.findOrCreate({
        where: {
          student_id: student.student_id,
          course_id: course.course_id,
        },
      });
    }
  }
}

async function main() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const courses = await seedCourses();
    const students = await seedStudents();
    await seedEnrollments(students, courses);

    console.log(`Seeded ${courses.length} courses and ${students.length} students.`);
    console.log('Default student password: pass123');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

main();