const path = require('path');
const PptxGenJS = require('pptxgenjs');

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Mini College Academic Management System Team';
pptx.company = 'DBMS Project';
pptx.subject = 'Project Presentation';
pptx.title = 'Mini College Academic Management System';
pptx.lang = 'en-US';

const COLORS = {
  bg: '0A1A33',
  panel: '11264A',
  panelLight: '183765',
  accent: '7CB3FF',
  warm: 'F7C873',
  text: 'F4F8FF',
  muted: 'C9D8F2',
  white: 'FFFFFF',
  ok: '7ADFA0',
};

function addBackground(slide) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 7.5,
    fill: { color: COLORS.bg },
    line: { color: COLORS.bg },
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.55,
    y: 0.45,
    w: 12.2,
    h: 6.6,
    rectRadius: 0.1,
    fill: { color: COLORS.panel, transparency: 12 },
    line: { color: COLORS.panelLight, pt: 1.2 },
    shadow: { type: 'outer', color: '000000', blur: 3, angle: 45, distance: 2, opacity: 0.18 },
  });
}

function addHeader(slide, title, subtitle) {
  slide.addText(title, {
    x: 0.9,
    y: 0.72,
    w: 11.7,
    h: 0.5,
    color: COLORS.white,
    fontSize: 28,
    bold: true,
    fontFace: 'Calibri',
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.9,
      y: 1.24,
      w: 11.7,
      h: 0.4,
      color: COLORS.muted,
      fontSize: 14,
      fontFace: 'Calibri',
    });
  }

  slide.addShape(pptx.ShapeType.line, {
    x: 0.9,
    y: 1.68,
    w: 11.3,
    h: 0,
    line: { color: COLORS.panelLight, pt: 1.5 },
  });
}

function addBullets(slide, items, box) {
  const runs = [];
  for (const item of items) {
    runs.push({
      text: `${item}`,
      options: {
        bullet: { indent: 14 },
        hanging: 3,
      },
    });
  }

  slide.addText(runs, {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    color: COLORS.text,
    fontSize: 18,
    fontFace: 'Calibri',
    breakLine: true,
    paraSpaceAfterPt: 16,
    margin: 6,
    valign: 'top',
  });
}

function addTwoColCards(slide, leftTitle, leftItems, rightTitle, rightItems) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.95,
    y: 2.0,
    w: 5.7,
    h: 4.55,
    rectRadius: 0.08,
    fill: { color: COLORS.panelLight, transparency: 10 },
    line: { color: '2A4A7A', pt: 1 },
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.73,
    y: 2.0,
    w: 5.7,
    h: 4.55,
    rectRadius: 0.08,
    fill: { color: COLORS.panelLight, transparency: 10 },
    line: { color: '2A4A7A', pt: 1 },
  });

  slide.addText(leftTitle, {
    x: 1.2,
    y: 2.18,
    w: 5.2,
    h: 0.4,
    color: COLORS.warm,
    fontSize: 17,
    bold: true,
  });

  slide.addText(rightTitle, {
    x: 6.98,
    y: 2.18,
    w: 5.2,
    h: 0.4,
    color: COLORS.warm,
    fontSize: 17,
    bold: true,
  });

  addBullets(slide, leftItems, { x: 1.08, y: 2.62, w: 5.4, h: 3.72 });
  addBullets(slide, rightItems, { x: 6.86, y: 2.62, w: 5.4, h: 3.72 });
}

// Slide 1: Title
{
  const slide = pptx.addSlide();
  addBackground(slide);

  slide.addText('Mini College Academic Management System', {
    x: 1.0,
    y: 1.75,
    w: 11.2,
    h: 0.9,
    color: COLORS.white,
    fontSize: 36,
    bold: true,
    align: 'center',
  });

  slide.addText('DBMS Project Presentation', {
    x: 1.0,
    y: 2.8,
    w: 11.2,
    h: 0.45,
    color: COLORS.accent,
    fontSize: 19,
    bold: true,
    align: 'center',
  });

  slide.addText('Stack, Architecture, SQL-MongoDB Split, and Key Implementation Highlights', {
    x: 1.0,
    y: 3.35,
    w: 11.2,
    h: 0.35,
    color: COLORS.muted,
    fontSize: 14,
    align: 'center',
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 3.75,
    y: 4.2,
    w: 5.8,
    h: 1.25,
    rectRadius: 0.08,
    fill: { color: COLORS.panelLight, transparency: 8 },
    line: { color: '2A4A7A', pt: 1 },
  });

  slide.addText('Presented on April 9, 2026', {
    x: 4.1,
    y: 4.45,
    w: 5.1,
    h: 0.3,
    color: COLORS.text,
    fontSize: 14,
    align: 'center',
  });

  slide.addText('College Academic Portal with role-based workflows for Students and Faculty', {
    x: 4.1,
    y: 4.82,
    w: 5.1,
    h: 0.45,
    color: COLORS.muted,
    fontSize: 12,
    align: 'center',
  });
}

// Slide 2: Problem + Objectives
{
  const slide = pptx.addSlide();
  addBackground(slide);
  addHeader(slide, 'Problem Statement and Objectives', 'Build a practical academic portal with clean role separation and robust data design');

  addTwoColCards(
    slide,
    'Project Need',
    [
      'Manual tracking of marks, attendance, materials, and leave requests is error-prone and slow.',
      'Students need one place to view academic progress, notifications, and course materials.',
      'Faculty need controlled workflows for marking attendance, publishing materials, and managing leave.',
    ],
    'Objectives Delivered',
    [
      'Role-based login and dashboard for Student and Faculty.',
      'End-to-end modules: Courses, Enrollments, Marks, Attendance, Leave, Materials, Notifications.',
      'Hybrid data architecture: PostgreSQL for structured data + MongoDB for flexible workflow data.',
    ]
  );
}

// Slide 3: Overall Architecture
{
  const slide = pptx.addSlide();
  addBackground(slide);
  addHeader(slide, 'System Architecture', 'Frontend + REST API + Dual Datastore design');

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.1,
    y: 2.05,
    w: 11.1,
    h: 3.95,
    rectRadius: 0.05,
    fill: { color: '0D2346', transparency: 15 },
    line: { color: '2A4A7A', pt: 1 },
  });

  const blocks = [
    { x: 1.55, y: 2.55, w: 2.45, h: 1.1, title: 'Frontend', body: 'Vanilla HTML/CSS/JS\nRole-aware dashboard\nTheme toggle + live updates' },
    { x: 4.35, y: 2.55, w: 2.45, h: 1.1, title: 'Express API', body: 'Auth, routes, middleware\nJWT verification\nBusiness rules' },
    { x: 7.15, y: 2.55, w: 2.45, h: 1.1, title: 'PostgreSQL', body: 'Structured academic core\nRelations + constraints\nTransactional consistency' },
    { x: 9.95, y: 2.55, w: 1.95, h: 1.1, title: 'MongoDB', body: 'Flexible docs\nNested arrays\nWorkflow artifacts' },
  ];

  for (const b of blocks) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: b.x,
      y: b.y,
      w: b.w,
      h: b.h,
      rectRadius: 0.06,
      fill: { color: COLORS.panelLight, transparency: 6 },
      line: { color: COLORS.accent, pt: 1 },
    });
    slide.addText(b.title, {
      x: b.x + 0.1,
      y: b.y + 0.08,
      w: b.w - 0.2,
      h: 0.24,
      color: COLORS.warm,
      fontSize: 12,
      bold: true,
      align: 'center',
    });
    slide.addText(b.body, {
      x: b.x + 0.12,
      y: b.y + 0.33,
      w: b.w - 0.24,
      h: 0.65,
      color: COLORS.text,
      fontSize: 10,
      align: 'center',
      valign: 'mid',
    });
  }

  slide.addShape(pptx.ShapeType.chevron, {
    x: 4.0,
    y: 2.95,
    w: 0.32,
    h: 0.32,
    fill: { color: COLORS.accent },
    line: { color: COLORS.accent },
  });

  slide.addShape(pptx.ShapeType.chevron, {
    x: 6.8,
    y: 2.95,
    w: 0.32,
    h: 0.32,
    fill: { color: COLORS.accent },
    line: { color: COLORS.accent },
  });

  slide.addShape(pptx.ShapeType.chevron, {
    x: 9.6,
    y: 2.95,
    w: 0.32,
    h: 0.32,
    fill: { color: COLORS.accent },
    line: { color: COLORS.accent },
  });

  addBullets(slide, [
    'API routes are mounted under /api and protected through authRequired + requireRole middleware.',
    'Uploaded material files are served via /uploads while metadata is tracked in MongoDB.',
    'The frontend consumes the same REST API for both student and faculty workflows.'
  ], { x: 1.45, y: 4.15, w: 10.6, h: 1.55 });
}

// Slide 4: Stack and Languages
{
  const slide = pptx.addSlide();
  addBackground(slide);
  addHeader(slide, 'Technology Stack and Language Usage', 'Where each technology is used in the codebase');

  addTwoColCards(
    slide,
    'Core Stack',
    [
      'Node.js + Express (backend runtime and API layer).',
      'Sequelize + PostgreSQL (relational models and SQL data).',
      'Mongoose + MongoDB (document models and flexible collections).',
      'JWT + bcryptjs (authentication and password hashing).',
      'Multer (materials file upload handling).',
    ],
    'Language Distribution',
    [
      'HTML: page structure and dashboard layout (frontend/index.html).',
      'CSS: theming, responsive UI, cards, tables, and interactions (frontend/styles.css).',
      'JavaScript: frontend logic and backend route/middleware logic (frontend/app.js, backend/src/**/*.js).',
      'SQL: relational schema definitions and constraints (backend/src/sql/schema.sql).',
      'JSON: request/response format between client and server.'
    ]
  );
}

// Slide 5: Why SQL and Why MongoDB
{
  const slide = pptx.addSlide();
  addBackground(slide);
  addHeader(slide, 'Data Architecture: SQL vs MongoDB', 'Intentional split based on data behavior and constraints');

  addTwoColCards(
    slide,
    'PostgreSQL (Relational Core)',
    [
      'Entities: students, faculty, courses, enrollments, marks, attendance, GPA records.',
      'Reason: strict schema, foreign keys, joins, and consistency for academic records.',
      'Benefit: predictable reports, integrity constraints, and transactional correctness.',
      'Best for: many-to-many enrollment and relational analytics by student/course/semester.'
    ],
    'MongoDB (Flexible Workflow Data)',
    [
      'Collections: leave requests, course materials, notifications, audit logs, portfolios.',
      'Reason: nested/variable documents, optional fields, and append-heavy records.',
      'Benefit: easier evolution without frequent schema migrations.',
      'Best for: broadcast notifications, material metadata arrays, and portfolio growth.'
    ]
  );
}

// Slide 6: Major Functional Modules
{
  const slide = pptx.addSlide();
  addBackground(slide);
  addHeader(slide, 'Functional Modules Delivered', 'End-to-end features implemented across student and faculty workflows');

  addBullets(slide, [
    'Authentication: Student and Faculty registration/login with hashed passwords and JWT sessions.',
    'Courses and Enrollment: Student enrollment, faculty roster views, and course-wise student listings.',
    'Marks Management: Faculty submits marks; students view their marks and computed totals/grades.',
    'Attendance: Faculty marks attendance by class and date; students view attendance summaries by subject.',
    'Leave Workflow: Students apply leave; faculty approve/reject requests from review panels.',
    'Materials: Faculty uploads URLs/files; students browse, view, and download course materials.',
    'Notifications: Faculty posts broadcast notifications; students receive timeline-style updates.',
    'Theming and UX: Light/dark theme support, role-specific dashboards, and improved empty-state rendering.'
  ], { x: 1.05, y: 2.08, w: 11.2, h: 4.6 });
}

// Slide 7: Security and Access Control
{
  const slide = pptx.addSlide();
  addBackground(slide);
  addHeader(slide, 'Security and Access Governance', 'How unauthorized actions are prevented in backend logic');

  addTwoColCards(
    slide,
    'Security Controls',
    [
      'bcryptjs hashes credentials before persistence.',
      'JWT bearer tokens are required for protected API routes.',
      'authRequired middleware verifies token validity and identity.',
      'Error handler centralizes API error output for predictable behavior.'
    ],
    'Role-Based Controls',
    [
      'requireRole middleware enforces Student vs Faculty permissions.',
      'Only faculty can publish marks, attendance, materials, and notifications.',
      'Students can access only their own protected records and notifications.',
      'Leave requests are initiated by students and reviewed by faculty.'
    ]
  );
}

// Slide 8: Sample Workflow Demonstration
{
  const slide = pptx.addSlide();
  addBackground(slide);
  addHeader(slide, 'Typical End-to-End Workflow', 'Example flow from login to academic outcomes');

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.0,
    y: 2.05,
    w: 11.35,
    h: 4.6,
    rectRadius: 0.08,
    fill: { color: COLORS.panelLight, transparency: 12 },
    line: { color: '2A4A7A', pt: 1 },
  });

  const steps = [
    '1) Student signs in and enrolls into available courses.',
    '2) Faculty views class roster, records attendance, and publishes marks.',
    '3) Faculty uploads notes/slides; materials become visible to enrolled students.',
    '4) Student dashboard refreshes with attendance %, marks, and notifications.',
    '5) Leave requests and status updates flow through role-controlled endpoints.'
  ];

  addBullets(slide, steps, { x: 1.25, y: 2.45, w: 10.9, h: 2.5 });

  slide.addText('Result: Centralized, auditable, and role-safe academic operations', {
    x: 1.35,
    y: 5.5,
    w: 10.7,
    h: 0.45,
    color: COLORS.ok,
    fontSize: 16,
    bold: true,
    align: 'center',
  });
}

// Slide 9: Project Highlights and Learnings
{
  const slide = pptx.addSlide();
  addBackground(slide);
  addHeader(slide, 'Project Highlights and Key Learnings', 'Technical outcomes achieved during implementation');

  addTwoColCards(
    slide,
    'Highlights',
    [
      'Clean API routing with modular backend structure.',
      'Hybrid database approach matched to data semantics.',
      'Role-based UX flows for both student and faculty users.',
      'File upload integration with metadata tracking.',
      'Live data refresh and polished dark/light theming.'
    ],
    'Learnings',
    [
      'Choosing datastore by data shape simplifies long-term maintenance.',
      'Authorization logic must live in backend, not just UI controls.',
      'Structured empty-state handling improves perceived quality.',
      'Incremental UI refactoring from debug output to cards improves usability.',
      'Seed data greatly accelerates demos and validation.'
    ]
  );
}

// Slide 10: Conclusion
{
  const slide = pptx.addSlide();
  addBackground(slide);
  addHeader(slide, 'Conclusion', 'A practical DBMS project demonstrating full-stack design choices');

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.0,
    y: 2.05,
    w: 11.35,
    h: 4.5,
    rectRadius: 0.1,
    fill: { color: COLORS.panelLight, transparency: 12 },
    line: { color: '2A4A7A', pt: 1 },
  });

  addBullets(slide, [
    'The system demonstrates a complete full-stack academic portal with secure role-based operations.',
    'PostgreSQL handles core relational academic data, while MongoDB handles flexible workflow documents.',
    'The architecture is modular, maintainable, and ready for future scaling into production features.',
    'This project validates key DBMS principles: data modeling, normalization, constraints, and mixed-database strategy.'
  ], { x: 1.25, y: 2.4, w: 10.9, h: 2.7 });

  slide.addText('Thank You', {
    x: 1.0,
    y: 5.6,
    w: 11.35,
    h: 0.6,
    color: COLORS.warm,
    fontSize: 32,
    bold: true,
    align: 'center',
  });
}

const outputPath = path.resolve(__dirname, '../../../Project_Presentation.pptx');

pptx.writeFile({ fileName: outputPath })
  .then(() => {
    console.log(`Created ${outputPath}`);
  })
  .catch((err) => {
    console.error('Failed to create presentation:', err);
    process.exit(1);
  });
