-- STUDENTS
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    branch VARCHAR(50),
    semester INT,
    password_hash TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FACULTY
CREATE TABLE faculty (
    faculty_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    department VARCHAR(50),
    password_hash TEXT
);

-- COURSES
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_name VARCHAR(100),
    credits INT,
    department VARCHAR(50)
);

-- ENROLLMENTS
CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    course_id INT REFERENCES courses(course_id) ON DELETE CASCADE
);

-- MARKS
CREATE TABLE marks (
    mark_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id),
    course_id INT REFERENCES courses(course_id),
    mid_marks FLOAT,
    end_marks FLOAT,
    total_marks FLOAT,
    grade VARCHAR(2),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ATTENDANCE
CREATE TABLE attendance (
    attendance_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id),
    course_id INT REFERENCES courses(course_id),
    date DATE,
    status VARCHAR(10) CHECK (status IN ('Present','Absent','Leave'))
);

-- GPA RECORDS
CREATE TABLE gpa_records (
    gpa_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id),
    semester INT,
    gpa FLOAT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
