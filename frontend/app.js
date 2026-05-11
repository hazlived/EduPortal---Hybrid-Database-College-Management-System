
const API_BASE = 'http://localhost:4000/api';
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');
let authToken = localStorage.getItem('authToken') || null;
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// DOM elements
const authContainer = document.getElementById('auth-container');
const loginSection = document.getElementById('login-section');
const signupSection = document.getElementById('signup-section');
const dashboard = document.getElementById('dashboard');
const logoutBtn = document.getElementById('logout-btn');
const themeToggle = document.getElementById('theme-toggle');
let cachedCourses = [];
let cachedTeacherStudents = [];
let cachedMaterialsCatalog = [];
let cachedStudentEnrollments = [];
let selectedMarksStudent = null;
let selectedAttendanceCourse = null;
let liveRefreshTimer = null;
const SAMPLE_COURSES = [
  { course_id: 101, course_name: 'Database Management Systems', credits: 4, department: 'CSE' },
  { course_id: 102, course_name: 'Operating Systems', credits: 4, department: 'CSE' },
  { course_id: 103, course_name: 'Computer Networks', credits: 3, department: 'CSE' },
  { course_id: 104, course_name: 'Software Engineering', credits: 3, department: 'CSE' },
  { course_id: 105, course_name: 'Data Structures', credits: 4, department: 'CSE' },
  { course_id: 106, course_name: 'Web Engineering', credits: 3, department: 'CSE' },
];

function isFaculty() {
  return currentUser?.role === 'faculty';
}

function getAttendanceStatus(pct) {
  if (pct === 100) return {
    key: 'perfect',
    label: 'Perfect',
    icon: `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`
  };
  if (pct >= 80) return {
    key: 'good',
    label: 'Good',
    icon: `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`
  };
  if (pct >= 65) return {
    key: 'okay',
    label: 'Okay',
    icon: `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`
  };
  if (pct >= 50) return {
    key: 'atrisk',
    label: 'At Risk',
    icon: `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`
  };
  return {
    key: 'critical',
    label: 'Critical',
    icon: `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>`
  };
}

function setTheme(theme) {
  const normalized = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', normalized);
  localStorage.setItem('theme', normalized);

  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', normalized === 'dark' ? 'true' : 'false');
  }
}

function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = saved || (prefersDark ? 'dark' : 'light');
  setTheme(initial);

  if (themeToggle) {
    themeToggle.onclick = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      setTheme(isDark ? 'light' : 'dark');
    };
  }
}

initTheme();

async function validateStoredSession() {
  if (!authToken || !currentUser) {
    clearAuth();
    return;
  }

  try {
    const session = await apiRequest('/auth/me');
    if (session?.id && session?.role) {
      currentUser.id = session.id;
      currentUser.role = session.role;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      showDashboard();
      return;
    }
  } catch (err) {
    // fall through to clearing auth below
  }

  authToken = null;
  currentUser = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  clearAuth();
}

validateStoredSession();

// Auth switching
document.getElementById('show-signup').onclick = () => {
  loginSection.classList.remove('active');
  signupSection.classList.add('active');
};
document.getElementById('show-login').onclick = () => {
  signupSection.classList.remove('active');
  loginSection.classList.add('active');
};

// Role tabs for signup
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const role = btn.dataset.role;
    const signupRoleInput = document.getElementById('signup-role');
    if (signupRoleInput) signupRoleInput.value = role;
    toggleSignupFields(role);
  };
});

function toggleSignupFields(role) {
  const semesterLabel = document.getElementById('signup-semester-label');
  const branchLabel = document.getElementById('signup-branch-label');
  const deptLabel = document.getElementById('signup-dept-label');
  const branchInput = document.getElementById('signup-branch');
  const semesterInput = document.getElementById('signup-semester');
  const deptInput = document.getElementById('signup-department');

  if (role === 'student') {
    semesterLabel.style.display = 'block';
    branchLabel.style.display = 'block';
    deptLabel.style.display = 'none';
    branchInput.required = true;
    semesterInput.required = true;
    deptInput.required = false;
  } else {
    semesterLabel.style.display = 'none';
    branchLabel.style.display = 'none';
    deptLabel.style.display = 'block';
    branchInput.required = false;
    semesterInput.required = false;
    deptInput.required = true;
  }
}

toggleSignupFields(document.querySelector('.tab-btn.active').dataset.role);

// Signup form
document.getElementById('signup-form').onsubmit = async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('signup-error');
  errorEl.textContent = '';

  const role = document.querySelector('.tab-btn.active').dataset.role;
  const body = {
    name: document.getElementById('signup-name').value,
    email: document.getElementById('signup-email').value,
    password: document.getElementById('signup-password').value,
    ...(role === 'student' ? {
      branch: document.getElementById('signup-branch').value,
      semester: parseInt(document.getElementById('signup-semester').value)
    } : {
      department: document.getElementById('signup-department').value
    })
  };

  try {
    const res = await fetch(`${API_BASE}/auth/register/${role}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) throw data;

    alert('Account created! Please login.');
    document.getElementById('show-login').click();
  } catch (err) {
    errorEl.textContent = err.error || 'Signup failed';
  }
};

// Login form
document.getElementById('login-form').onsubmit = async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('login-error');
  errorEl.textContent = '';

  const role = document.getElementById('login-role').value;
  const body = {
    email: document.getElementById('login-email').value,
    password: document.getElementById('login-password').value,
    role
  };

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) throw data;

    // Save auth state
    authToken = data.token;
    currentUser = {
      id: data.id,
      role,
      name: data.name,
      branch: data.branch,
      semester: data.semester,
      department: data.department,
    };
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    showDashboard();
  } catch (err) {
    errorEl.textContent = err.error || 'Login failed';
  }
};

// Logout
logoutBtn.onclick = () => {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  clearAuth();
};

function showDashboard() {
  authContainer.classList.add('hidden');
  dashboard.classList.remove('hidden');

  document.getElementById('user-role').textContent = currentUser.role.toUpperCase();
  document.getElementById('user-id').textContent = `ID: ${currentUser.id}`;

  applyRoleUI();
  seedDashboardInputs();

  // Load user profile
  loadUserProfile();
  loadDashboardData();
  startLiveRefresh();
}

function applyRoleUI() {
  document.querySelectorAll('.teacher-only').forEach((el) => {
    el.style.display = isFaculty() ? '' : 'none';
  });

  document.querySelectorAll('.student-only').forEach((el) => {
    el.style.display = isFaculty() ? 'none' : '';
  });
}

function clearAuth() {
  stopLiveRefresh();
  authContainer.classList.remove('hidden');
  dashboard.classList.add('hidden');
  loginSection.classList.add('active');
  signupSection.classList.remove('active');

  // Clear forms
  document.querySelectorAll('#auth-container input, #auth-container select').forEach(el => el.value = '');
}

function startLiveRefresh() {
  stopLiveRefresh();

  // Keep user-facing data reasonably fresh without requiring manual reloads.
  liveRefreshTimer = setInterval(async () => {
    if (!authToken || !currentUser) return;

    if (isFaculty()) {
      await loadTeacherOverview();
      await loadTeacherNotifications();
    } else {
      await loadStudentOverview();
      await loadStudentAttendance();
      await loadLeaveRequests();
    }
  }, 30000);
}

function stopLiveRefresh() {
  if (liveRefreshTimer) {
    clearInterval(liveRefreshTimer);
    liveRefreshTimer = null;
  }
}

async function loadUserProfile() {
  if (isFaculty()) {
    if (!currentUser.name || !currentUser.department) {
      try {
        const faculty = await apiRequest(`/courses/faculty/${currentUser.id}`);
        currentUser.name = faculty.name || currentUser.name;
        currentUser.department = faculty.department || currentUser.department;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      } catch (err) {
        // fall back to cached values
      }
    }

    document.getElementById('user-name').textContent = currentUser.name || 'Faculty User';
    document.getElementById('user-role').textContent = `FACULTY${currentUser.department ? ` • ${currentUser.department}` : ''}`;
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/students/${currentUser.id}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const data = await res.json();
    document.getElementById('user-name').textContent = data.student?.name || 'User';
  } catch (err) {
    console.log('Profile load failed');
  }
}

function getRoleCourses() {
  if (!isFaculty() || !currentUser.department) {
    return cachedCourses;
  }

  const dept = String(currentUser.department).trim().toLowerCase();
  const aliases = {
    cs: ['cse', 'computer science'],
    cse: ['cs', 'computer science'],
    eee: ['electrical and electronic engineering'],
  };

  const allowed = new Set([dept, ...(aliases[dept] || [])]);
  const filtered = cachedCourses.filter((course) => {
    if (!course.department) return true;
    return allowed.has(String(course.department).trim().toLowerCase());
  });

  // If department filter becomes too strict, keep classes visible.
  return filtered.length ? filtered : cachedCourses;
}

function renderCourseOptions(selectId, courses) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = '<option value="">Select course</option>';
  courses.forEach((course) => {
    const option = document.createElement('option');
    option.value = course.course_id;
    option.textContent = `${course.course_name}${course.department ? ` • ${course.department}` : ''}`;
    select.appendChild(option);
  });
}

async function loadDashboardData() {
  await loadCourses();

  if (isFaculty()) {
    await Promise.all([
      loadTeacherOverview(),
      loadTeacherStudents(),
      loadTeacherAttendanceCourses(),
      loadTeacherMaterials(),
      loadTeacherNotifications(),
    ]);
    renderCourseOptions('materials-course', getRoleCourses());
    renderCourseOptions('marks-course', getRoleCourses());
    document.getElementById('teacher-stat-courses').textContent = String(getRoleCourses().length);
    document.getElementById('teacher-stat-students').textContent = String(cachedTeacherStudents.length || 0);
  } else {
    await Promise.all([
      loadStudentEnrollments(),
      loadStudentOverview(),
      loadStudentMaterials(),
      loadStudentNotifications(),
    ]);
  }
}

async function loadCourses() {
  try {
    const courses = await apiRequest('/courses');
    cachedCourses = Array.isArray(courses) && courses.length ? courses : SAMPLE_COURSES;
  } catch (err) {
    cachedCourses = SAMPLE_COURSES;
  }
}

async function loadTeacherStudents() {
  try {
    cachedTeacherStudents = await apiRequest('/courses/students');
    const list = document.getElementById('teacher-students-list');
    if (!list) return;

    list.innerHTML = '';
    cachedTeacherStudents.forEach((student) => {
      const initials = (student.name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'student-card';
      card.dataset.studentId = student.student_id;
      card.innerHTML = `
        <div class="student-card-avatar">${initials}</div>
        <div class="student-card-info">
          <span class="student-card-name">${student.name}</span>
          <span class="student-card-meta">ID ${student.student_id} • ${student.branch || '—'} • Sem ${student.semester || '-'}</span>
        </div>
        <svg class="student-card-arrow" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
      `;
      card.onclick = () => selectMarksStudent(student);
      list.appendChild(card);
    });
  } catch (err) {
    setResult('marks-result', err.error || 'Failed to load students');
  }
}

async function loadTeacherAttendanceCourses() {
  const list = document.getElementById('teacher-courses-list');
  if (!list) return;

  list.innerHTML = '';
  getRoleCourses().forEach((course) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'list-item';
    item.innerHTML = `<strong>${course.course_name}</strong><span>${course.department || 'General'} • open roster</span>`;
    item.onclick = () => selectAttendanceCourse(course);
    list.appendChild(item);
  });
}

function selectMarksStudent(student) {
  selectedMarksStudent = student;

  const marksStudentInput = document.getElementById('marks-student');
  if (marksStudentInput) marksStudentInput.value = student.student_id;

  // Populate modal header
  const title    = document.getElementById('marks-detail-title');
  const subtitle = document.getElementById('marks-detail-subtitle');
  const avatar   = document.getElementById('marks-modal-avatar');
  const initials = (student.name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  if (title)    title.textContent    = student.name;
  if (subtitle) subtitle.textContent = `ID ${student.student_id} • ${student.branch || '—'} • Semester ${student.semester || '-'}`;
  if (avatar)   avatar.textContent   = initials;

  openMarksModal();
  renderStudentMarksEditor(student);
}

function openMarksModal() {
  const overlay = document.getElementById('marks-modal-overlay');
  if (!overlay) return;
  overlay.classList.add('modal-open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeMarksModal() {
  const overlay = document.getElementById('marks-modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('modal-open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// Close button and backdrop click
const _modalCloseBtn = document.getElementById('marks-modal-close');
if (_modalCloseBtn) _modalCloseBtn.onclick = closeMarksModal;

const _modalOverlay = document.getElementById('marks-modal-overlay');
if (_modalOverlay) {
  _modalOverlay.addEventListener('click', (e) => {
    if (e.target === _modalOverlay) closeMarksModal();
  });
}

// Escape key closes modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMarksModal();
});

async function renderStudentMarksEditor(student) {
  const container = document.getElementById('marks-courses-panel');
  if (!container) return;

  container.innerHTML = '<div class="marks-loading">Loading course data…</div>';
  hideMarksBanner();

  try {
    const [enrollments, marksData] = await Promise.all([
      apiRequest(`/courses/student/${student.student_id}/enrollments`),
      apiRequest(`/marks/student/${student.student_id}`),
    ]);

    const courses = Array.isArray(enrollments) ? enrollments : [];
    const marks = (marksData.marks || []);
    const marksMap = {};
    marks.forEach((m) => { marksMap[m.course_id] = m; });

    container.innerHTML = '';

    if (!courses.length) {
      container.innerHTML = '<p class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:28px;height:28px;opacity:.4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>Student is not enrolled in any courses</p>';
      return;
    }

    courses.forEach((course) => {
      const mark = marksMap[course.course_id];
      container.appendChild(buildMarksCourseRow(student, course, mark));
    });
  } catch (err) {
    container.innerHTML = `<p class="error-text" style="padding:.5rem 0">${err.error || 'Failed to load student data'}</p>`;
  }
}

function buildMarksCourseRow(student, course, mark) {
  const row = document.createElement('div');
  row.className = 'mcr' + (mark ? ' mcr--has-marks' : ' mcr--no-marks');
  row.dataset.courseId = course.course_id;

  const gradeKey = mark ? (mark.grade || 'F').replace('+', 'plus') : '';

  row.innerHTML = `
    <div class="mcr-header">
      <div class="mcr-course-info">
        <span class="mcr-course-name">${course.course_name}</span>
        <span class="mcr-dept">${course.department || 'General'} • ${course.credits || '-'} cr</span>
      </div>
      <div class="mcr-header-actions">
        ${mark
          ? `<button class="mcr-btn mcr-edit-btn" type="button">
               <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
               Edit
             </button>
             <button class="mcr-btn mcr-delete-btn" type="button">
               <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
               Delete
             </button>`
          : `<button class="mcr-btn mcr-add-btn" type="button">
               <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"/></svg>
               Add Marks
             </button>`
        }
      </div>
    </div>

    ${mark
      ? `<div class="mcr-marks-display">
           <div class="mcr-mark-chip"><span class="mcr-chip-label">Mid</span><span class="mcr-chip-val">${mark.mid_marks}</span></div>
           <div class="mcr-mark-chip"><span class="mcr-chip-label">End</span><span class="mcr-chip-val">${mark.end_marks}</span></div>
           <div class="mcr-mark-chip"><span class="mcr-chip-label">Total</span><span class="mcr-chip-val">${mark.total_marks}</span></div>
           <span class="grade-badge grade-${gradeKey}">${mark.grade}</span>
         </div>`
      : `<p class="mcr-no-marks-text">No marks recorded yet</p>`
    }

    <div class="mcr-inline-form" style="display:none;">
      <div class="mcr-inputs">
        <div class="mcr-input-group">
          <label class="mcr-input-label">Mid-term</label>
          <input class="mcr-mid-input" type="number" step="0.1" min="0" placeholder="0" value="${mark ? mark.mid_marks : ''}">
        </div>
        <div class="mcr-input-group">
          <label class="mcr-input-label">End-term</label>
          <input class="mcr-end-input" type="number" step="0.1" min="0" placeholder="0" value="${mark ? mark.end_marks : ''}">
        </div>
      </div>
      <div class="mcr-form-actions">
        <button class="primary-btn mcr-save-btn" type="button" style="max-width:120px;">${mark ? 'Save' : 'Add'}</button>
        <button class="secondary-btn mcr-cancel-btn" type="button">Cancel</button>
      </div>
    </div>
  `;

  // Wire buttons
  const editBtn   = row.querySelector('.mcr-edit-btn');
  const addBtn    = row.querySelector('.mcr-add-btn');
  const deleteBtn = row.querySelector('.mcr-delete-btn');
  const cancelBtn = row.querySelector('.mcr-cancel-btn');
  const saveBtn   = row.querySelector('.mcr-save-btn');
  const inlineForm = row.querySelector('.mcr-inline-form');
  const marksDisplay = row.querySelector('.mcr-marks-display');
  const noMarksText  = row.querySelector('.mcr-no-marks-text');

  function openForm() {
    inlineForm.style.display = 'block';
    if (editBtn)   { editBtn.style.display = 'none'; deleteBtn.style.display = 'none'; }
    if (addBtn)    addBtn.style.display = 'none';
    if (marksDisplay)  marksDisplay.style.opacity = '0.4';
    if (noMarksText)   noMarksText.style.display = 'none';
  }
  function closeForm() {
    inlineForm.style.display = 'none';
    if (editBtn)   { editBtn.style.display = ''; deleteBtn.style.display = ''; }
    if (addBtn)    addBtn.style.display = '';
    if (marksDisplay)  marksDisplay.style.opacity = '';
    if (noMarksText)   noMarksText.style.display = '';
    saveBtn.disabled = false;
    saveBtn.textContent = mark ? 'Save' : 'Add';
  }

  if (editBtn)   editBtn.onclick   = openForm;
  if (addBtn)    addBtn.onclick    = openForm;
  if (cancelBtn) cancelBtn.onclick = closeForm;

  if (saveBtn) {
    saveBtn.onclick = async () => {
      const mid = Number(row.querySelector('.mcr-mid-input').value || 0);
      const end = Number(row.querySelector('.mcr-end-input').value || 0);
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';
      try {
        let data;
        if (mark) {
          data = await apiRequest(`/marks/${mark.mark_id}`, {
            method: 'PUT',
            body: JSON.stringify({ mid_marks: mid, end_marks: end }),
          });
        } else {
          data = await apiRequest('/marks', {
            method: 'POST',
            body: JSON.stringify({ student_id: student.student_id, course_id: course.course_id, mid_marks: mid, end_marks: end }),
          });
        }
        showMarksBanner('success', `Marks saved — GPA updated to ${data.gpa ?? '—'}`);
        await Promise.all([renderStudentMarksEditor(student), loadTeacherOverview()]);
      } catch (err) {
        showMarksBanner('error', err.error || 'Failed to save marks');
        closeForm();
      }
    };
  }

  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      if (!confirm(`Delete marks for "${course.course_name}"? This cannot be undone.`)) return;
      try {
        await apiRequest(`/marks/${mark.mark_id}`, { method: 'DELETE' });
        showMarksBanner('success', `Marks for "${course.course_name}" deleted`);
        await Promise.all([renderStudentMarksEditor(student), loadTeacherOverview()]);
      } catch (err) {
        showMarksBanner('error', err.error || 'Failed to delete marks');
      }
    };
  }

  return row;
}

function showMarksBanner(type, message) {
  const banner = document.getElementById('marks-status-banner');
  if (!banner) return;
  banner.className = `marks-status-banner marks-status-banner--${type}`;
  banner.innerHTML = `
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      ${type === 'success'
        ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>'
        : '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>'}
    </svg>
    <span>${message}</span>
  `;
  banner.style.display = 'flex';
  clearTimeout(banner._timer);
  banner._timer = setTimeout(() => { banner.style.display = 'none'; }, 4000);
}

function hideMarksBanner() {
  const banner = document.getElementById('marks-status-banner');
  if (banner) banner.style.display = 'none';
}

async function selectAttendanceCourse(course) {
  selectedAttendanceCourse = course;

  const title = document.getElementById('attendance-detail-title');
  const subtitle = document.getElementById('attendance-detail-subtitle');
  const courseInput = document.getElementById('attendance-course');
  if (title) title.textContent = course.course_name;
  if (subtitle) subtitle.textContent = `Course ID ${course.course_id}`;
  if (courseInput) courseInput.value = course.course_id;

  try {
    const students = await apiRequest(`/courses/${course.course_id}/students`);
    const roster = document.getElementById('attendance-class-students');
    if (!roster) return;

    roster.innerHTML = '';
    if (!students.length) {
      roster.innerHTML = '<div class="helper-text">No enrolled students found.</div>';
      return;
    }

    students.forEach((student) => {
      const row = document.createElement('div');
      row.className = 'list-item';
      row.dataset.studentId = student.student_id;
      row.innerHTML = `
        <strong>${student.name}</strong>
        <span>ID ${student.student_id}</span>
        <select class="attendance-status-select" style="margin-top:0.75rem;">
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
          <option value="Leave">Leave</option>
        </select>
      `;
      roster.appendChild(row);
    });
  } catch (err) {
    setResult('attendance-result', err.error || 'Failed to load class roster');
  }
}

async function loadTeacherOverview() {
  try {
    const leaves = await apiRequest('/leave');
    document.getElementById('teacher-stat-leaves').textContent = String(
      leaves.filter((item) => item.status === 'Pending').length
    );
    renderTeacherOverviewLeaves(leaves.slice(0, 5));
  } catch (err) {
    document.getElementById('teacher-stat-leaves').textContent = '0';
    renderTeacherOverviewLeaves([]);
  }

  const courseList = document.getElementById('teacher-overview-courses');
  if (courseList) {
    courseList.innerHTML = '';
    getRoleCourses().forEach((course) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'list-item';
      item.innerHTML = `<strong>${course.course_name}</strong><span>${course.department || 'General'} • ${course.credits || '-'} credits</span>`;
      courseList.appendChild(item);
    });
  }

  try {
    const materials = await apiRequest('/materials/catalog');
    cachedMaterialsCatalog = materials || [];
    document.getElementById('teacher-stat-materials').textContent = String(cachedMaterialsCatalog.length);
  } catch (err) {
    document.getElementById('teacher-stat-materials').textContent = '0';
  }
}

function renderTeacherOverviewLeaves(leaves) {
  const list = document.getElementById('teacher-overview-leave-list');
  const empty = document.getElementById('teacher-overview-leave-empty');
  if (!list) return;

  list.innerHTML = '';
  if (!leaves.length) {
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';
  leaves.forEach((leave) => {
    const status = (leave.status || 'Pending').toLowerCase();
    const fromDate = leave.from_date ? new Date(leave.from_date).toLocaleDateString() : '-';
    const toDate = leave.to_date ? new Date(leave.to_date).toLocaleDateString() : '-';
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <span class="status-chip status-${status}">${leave.status || 'Pending'}</span>
      <strong>Student ID ${leave.student_id || '-'}</strong>
      <span>${fromDate} - ${toDate}</span>
      <span style="font-size:0.8rem;color:#6b7280;">${leave.reason || ''}</span>
    `;
    list.appendChild(item);
  });
}

async function loadStudentOverview() {
  try {
    const marksPayload = await apiRequest(`/marks/student/${currentUser.id}`);
    document.getElementById('student-stat-courses').textContent = String(cachedStudentEnrollments.length);
    document.getElementById('student-stat-gpa').textContent = marksPayload.gpa != null ? Number(marksPayload.gpa).toFixed(2) : '0.00';
  } catch (err) {
    document.getElementById('student-stat-courses').textContent = String(cachedStudentEnrollments.length);
    document.getElementById('student-stat-gpa').textContent = '0.00';
  }

  try {
    const summary = await apiRequest(`/attendance/student/${currentUser.id}/summary`);
    document.getElementById('student-stat-attendance').textContent = `${summary.overall_percentage || 0}%`;
    renderStudentOverviewAttendance(summary.by_course || []);
  } catch (err) {
    document.getElementById('student-stat-attendance').textContent = '0%';
    renderStudentOverviewAttendance([]);
  }

  await loadStudentNotifications();
  await loadStudentMarks();
}

function renderStudentOverviewAttendance(courses) {
  const list = document.getElementById('student-overview-attendance-list');
  const empty = document.getElementById('student-overview-attendance-empty');
  if (!list) return;

  list.innerHTML = '';
  if (!courses.length) {
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';
  courses.forEach((item) => {
    const pct = Number(item.percentage) || 0;
    const status = getAttendanceStatus(pct);
    const row = document.createElement('div');
    row.className = 'list-item att-overview-item';
    row.innerHTML = `
      <div class="att-overview-row">
        <strong>${item.course_name}</strong>
        <span class="att-badge att-badge--${status.key}">${status.icon}${status.label}</span>
      </div>
      <div class="att-overview-meta">
        <span>${item.present_classes} / ${item.total_classes} classes</span>
        <span class="att-pct att-pct--${status.key}">${pct}%</span>
      </div>
      <div class="att-mini-bar"><div class="att-mini-fill att-mini-fill--${status.key}" style="width:${Math.min(pct,100)}%"></div></div>
    `;
    list.appendChild(row);
  });
}

async function loadStudentEnrollments() {
  try {
    const enrollments = await apiRequest('/courses/my-enrollments');
    cachedStudentEnrollments = Array.isArray(enrollments) ? enrollments : [];
  } catch (err) {
    cachedStudentEnrollments = [];
  }

  renderStudentEnrollPanel();
}

function renderStudentEnrollPanel() {
  const select = document.getElementById('student-enroll-course');
  const list = document.getElementById('student-enrolled-courses');
  const empty = document.getElementById('student-enrolled-empty');
  if (!select || !list) return;

  const enrolledIds = new Set(cachedStudentEnrollments.map((item) => Number(item.course_id)));
  const availableCourses = cachedCourses.filter((course) => !enrolledIds.has(Number(course.course_id)));

  select.innerHTML = '<option value="">Select course to enroll</option>';
  availableCourses.forEach((course) => {
    const option = document.createElement('option');
    option.value = course.course_id;
    option.textContent = `${course.course_name}${course.department ? ` • ${course.department}` : ''}`;
    select.appendChild(option);
  });

  list.innerHTML = '';
  if (!cachedStudentEnrollments.length) {
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';
  cachedStudentEnrollments.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'list-item';
    card.innerHTML = `<strong>${item.course_name || `Course ${item.course_id}`}</strong><span>${item.department || 'General'} • ${item.credits || '-'} credits</span>`;
    list.appendChild(card);
  });
}

async function loadStudentMarks() {
  try {
    const data = await apiRequest(`/marks/student/${currentUser.id}`);
    renderStudentMarksTable(data.marks || []);
  } catch (err) {
    renderStudentMarksTable([]);
  }
}

function renderStudentMarksTable(marks) {
  const tbody = document.getElementById('student-marks-body');
  const empty = document.getElementById('student-marks-empty');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (!marks.length) {
    if (empty) empty.style.display = 'block';
    return;
  }

  const courseMap = {};
  cachedCourses.forEach((c) => { courseMap[c.course_id] = c.course_name; });

  if (empty) empty.style.display = 'none';
  marks.forEach((mark) => {
    const courseName = courseMap[mark.course_id] || `Course ${mark.course_id}`;
    const gradeKey = (mark.grade || 'F').replace('+', 'plus');
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${courseName}</td>
      <td>${mark.mid_marks ?? '-'}</td>
      <td>${mark.end_marks ?? '-'}</td>
      <td><strong>${mark.total_marks ?? '-'}</strong></td>
      <td><span class="grade-badge grade-${gradeKey}">${mark.grade ?? '-'}</span></td>
    `;
    tbody.appendChild(row);
  });
}

async function loadStudentNotifications() {
  try {
    const notifications = await apiRequest(`/notifications/${currentUser.id}`);
    document.getElementById('student-stat-notifications').textContent = String(notifications.length);
    renderNotificationCards('student-overview-notifications', 'student-overview-notifications-empty', notifications.slice(0, 5), 'No recent notifications.');
    renderStudentNotifications(notifications);
  } catch (err) {
    document.getElementById('student-stat-notifications').textContent = '0';
    const empty = document.getElementById('student-overview-notifications-empty');
    if (empty) {
      empty.textContent = err.error || 'Failed to load notifications';
      empty.style.display = 'block';
    }
    renderStudentNotifications([]);
  }
}

function renderStudentNotifications(notifications) {
  const list = document.getElementById('student-notification-list');
  const empty = document.getElementById('student-notification-empty');
  if (!list) return;

  list.innerHTML = '';
  if (!notifications.length) {
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';
  notifications.forEach((note) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `<strong>${note.type || 'Notice'}</strong><span>${note.message || ''}</span>`;
    list.appendChild(item);
  });
}

async function loadTeacherNotifications() {
  try {
    const notifications = await apiRequest(`/notifications/${currentUser.id}`);
    renderNotificationCards('notifications-result', 'notifications-empty', notifications, 'No notifications yet.');
  } catch (err) {
    const empty = document.getElementById('notifications-empty');
    if (empty) {
      empty.textContent = err.error || 'Failed to load notifications';
      empty.style.display = 'block';
    }
  }
}

function renderNotificationCards(listId, emptyId, notifications, emptyMessage) {
  const list = document.getElementById(listId);
  const empty = document.getElementById(emptyId);
  if (!list) return;

  list.innerHTML = '';

  if (!Array.isArray(notifications) || notifications.length === 0) {
    if (empty) {
      empty.textContent = emptyMessage;
      empty.style.display = 'block';
    }
    return;
  }

  if (empty) empty.style.display = 'none';

  notifications.forEach((note) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    const status = note.is_read ? 'Read' : 'Unread';
    const createdAt = note.created_at || note.createdAt || '';
    item.innerHTML = `
      <strong>${note.type || 'Notice'}</strong>
      <span>${note.message || ''}</span>
      <span>${status}${createdAt ? ` • ${new Date(createdAt).toLocaleString()}` : ''}</span>
    `;
    list.appendChild(item);
  });
}

async function loadTeacherMaterials() {
  try {
    const materials = await apiRequest('/materials/catalog');
    cachedMaterialsCatalog = materials || [];
    renderMaterialsCatalog();
  } catch (err) {
    setResult('materials-result', err.error || 'Failed to load materials');
  }
}

function renderMaterialsCatalog() {
  const list = document.getElementById('materials-catalog-list');
  if (!list) return;

  list.innerHTML = '';
  cachedMaterialsCatalog.forEach((course) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'list-item';
    item.innerHTML = `<strong>${course.course_name}</strong><span>${course.materials.length} materials</span>`;
    item.onclick = () => {
      const title = document.getElementById('materials-detail-title');
      if (title) title.textContent = course.course_name;
      setResult('materials-result', course.materials);
    };
    list.appendChild(item);
  });
}

async function loadStudentMaterials() {
  try {
    const catalog = await apiRequest('/materials/catalog');
    cachedMaterialsCatalog = catalog || [];
    renderStudentMaterialsCatalog();
  } catch (err) {
    setResult('materials-result', err.error || 'Failed to load materials');
  }
}

function renderStudentMaterialsCatalog() {
  const list = document.getElementById('materials-catalog-list');
  if (!list) return;

  list.innerHTML = '';
  cachedMaterialsCatalog.forEach((course) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'list-item';
    item.innerHTML = `<strong>${course.course_name}</strong><span>${course.materials.length} uploaded files</span>`;
    item.onclick = async () => {
      const title = document.getElementById('materials-detail-title');
      if (title) title.textContent = course.course_name;
      renderStudentMaterialDetails(course.materials || []);
    };
    list.appendChild(item);
  });
}

function normalizeMaterialUrl(url) {
  if (!url) return '#';
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

function getMaterialType(material) {
  const source = String(material.file_name || material.url || '').toLowerCase();
  if (source.endsWith('.pdf')) return 'PDF';
  if (source.endsWith('.doc') || source.endsWith('.docx')) return 'DOC';
  if (source.endsWith('.ppt') || source.endsWith('.pptx')) return 'PPT';
  if (source.endsWith('.txt')) return 'TXT';
  if (source.endsWith('.zip') || source.endsWith('.rar')) return 'ZIP';
  if (source.endsWith('.png') || source.endsWith('.jpg') || source.endsWith('.jpeg') || source.endsWith('.gif') || source.endsWith('.webp')) return 'IMAGE';
  if (/^https?:\/\//i.test(String(material.url || ''))) return 'LINK';
  return 'FILE';
}

function renderStudentMaterialDetails(materials) {
  const container = document.getElementById('student-materials-list');
  const empty = document.getElementById('student-materials-empty');
  if (!container) return;

  container.innerHTML = '';
  if (!materials.length) {
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';
  materials.forEach((material, idx) => {
    const materialUrl = normalizeMaterialUrl(material.url);
    const fileName = material.file_name || material.title || `material-${idx + 1}`;
    const badge = getMaterialType(material);
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <strong>${material.title || 'Untitled Material'}</strong>
      <div class="material-meta">
        <span class="material-badge">${badge}</span>
        <span>${material.file_name || material.url || ''}</span>
      </div>
      <div class="material-actions">
        <a class="action-link" href="${materialUrl}" target="_blank" rel="noopener noreferrer">View</a>
        <a class="action-link" href="${materialUrl}" download="${fileName}">Download</a>
      </div>
    `;
    container.appendChild(item);
  });
}

function seedDashboardInputs() {
  const ids = ['marks-student', 'attendance-student', 'leave-student'];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = currentUser?.id || '';
  });

  const uploadedBy = document.getElementById('materials-uploaded-by');
  if (uploadedBy && isFaculty()) {
    uploadedBy.value = currentUser.id;
  }

  const attendanceDate = document.getElementById('attendance-date');
  if (attendanceDate && !attendanceDate.value) {
    attendanceDate.value = new Date().toISOString().split('T')[0];
  }
}

async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      authToken = null;
      currentUser = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      clearAuth();
    }

    throw (data || { error: `Request failed (${res.status})` });
  }
  return data;
}

function setResult(id, data) {
  const el = document.getElementById(id);
  if (!el) return;

  if (typeof data === 'string') {
    el.textContent = data;
    return;
  }

  if (Array.isArray(data) && data.length === 0) {
    if (id.includes('notification')) {
      el.textContent = id.includes('overview') ? 'No recent notifications.' : 'No notifications yet.';
      return;
    }

    el.textContent = 'No records found.';
    return;
  }

  if (data && typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 0) {
    el.textContent = 'No records found.';
    return;
  }

  if (data == null) {
    el.textContent = 'No records found.';
    return;
  }

  el.textContent = JSON.stringify(data, null, 2);
}

document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.onclick = async () => {
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const viewId = btn.dataset.view;
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active-view'));
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active-view');

    if (viewId === 'marks') {
      if (isFaculty()) await loadTeacherStudents();
      else await loadStudentMarks();
    }
    if (viewId === 'attendance') {
      if (isFaculty()) await loadTeacherAttendanceCourses();
      else await loadStudentAttendance();
    }
    if (viewId === 'leave') {
      await loadLeaveRequests();
    }
    if (viewId === 'materials') {
      if (isFaculty()) await loadTeacherMaterials();
      else await loadStudentMaterials();
    }
    if (viewId === 'notifications') {
      if (isFaculty()) await loadTeacherNotifications();
      else await loadStudentNotifications();
    }
  };
});

// marks-form removed — handled by inline course-row buttons in renderStudentMarksEditor

const attendanceSubmitAllBtn = document.getElementById('attendance-submit-all');
if (attendanceSubmitAllBtn) {
  attendanceSubmitAllBtn.onclick = async () => {
    try {
      const courseId = Number(document.getElementById('attendance-course').value || selectedAttendanceCourse?.course_id);
      const date = document.getElementById('attendance-date').value;
      const rows = Array.from(document.querySelectorAll('#attendance-class-students .list-item'));

      if (!courseId) {
        throw { error: 'Select a class first' };
      }

      const results = [];
      for (const row of rows) {
        const studentId = Number(row.dataset.studentId);
        const status = row.querySelector('.attendance-status-select')?.value || 'Present';
        const record = await apiRequest('/attendance', {
          method: 'POST',
          body: JSON.stringify({ student_id: studentId, course_id: courseId, date, status }),
        });
        results.push(record);
      }

      renderTeacherAttendanceSubmission(results);
      await loadTeacherAttendanceCourses();
      await loadTeacherOverview();
    } catch (err) {
      setResult('attendance-result', err.error || 'Failed to mark attendance');
    }
  };
}

function renderTeacherAttendanceSubmission(records) {
  const list = document.getElementById('attendance-submit-list');
  const empty = document.getElementById('attendance-submit-empty');
  if (!list) return;

  list.innerHTML = '';
  if (!records.length) {
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';
  records.forEach((record) => {
    const row = document.createElement('div');
    row.className = 'list-item';
    row.innerHTML = `<strong>Student ID ${record.student_id}</strong><span>${record.status} • ${record.date || '-'}</span>`;
    list.appendChild(row);
  });
}

const studentMarksLoadBtn = document.getElementById('student-marks-load');
if (studentMarksLoadBtn) {
  studentMarksLoadBtn.onclick = async () => {
    await loadStudentMarks();
  };
}

const studentEnrollForm = document.getElementById('student-enroll-form');
if (studentEnrollForm) {
  studentEnrollForm.onsubmit = async (e) => {
    e.preventDefault();
    try {
      const courseId = Number(document.getElementById('student-enroll-course').value);
      if (!courseId) {
        throw { error: 'Select a course first' };
      }

      await apiRequest('/courses/enroll', {
        method: 'POST',
        body: JSON.stringify({ course_id: courseId }),
      });

      await loadStudentEnrollments();
      await loadStudentOverview();
    } catch (err) {
      alert(err.error || 'Enrollment failed');
    }
  };
}

const attendanceLoadBtn = document.getElementById('attendance-load');
if (attendanceLoadBtn) {
  attendanceLoadBtn.onclick = async () => {
    await loadStudentAttendance();
  };
}

async function loadStudentAttendance() {
  try {
    const studentId = Number(document.getElementById('attendance-student')?.value || currentUser.id);
    const summary = await apiRequest(`/attendance/student/${studentId}/summary`);

    if (!summary.by_course || summary.by_course.length === 0) {
      renderStudentAttendance([]);
      return;
    }

    renderStudentAttendance(summary.by_course);
  } catch (err) {
    renderStudentAttendance([]);
  }
}

function renderStudentAttendance(courses) {
  const container = document.getElementById('student-attendance-cards');
  const empty = document.getElementById('student-attendance-empty');
  if (!container) return;

  container.innerHTML = '';
  if (!courses.length) {
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';
  courses.forEach((item) => {
    const pct = Number(item.percentage) || 0;
    const status = getAttendanceStatus(pct);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `att-card att-card--${status.key}`;
    card.title = 'Click to see detailed records';
    card.innerHTML = `
      <div class="att-card-header">
        <span class="att-badge att-badge--${status.key}">${status.icon}${status.label}</span>
        <span class="att-card-pct">${pct}%</span>
      </div>
      <div class="att-card-course">${item.course_name}</div>
      <div class="att-bar-track">
        <div class="att-bar-fill att-bar-fill--${status.key}" style="width:${Math.min(pct,100)}%"></div>
      </div>
      <div class="att-card-footer">
        <span class="att-classes-label">Classes attended</span>
        <span class="att-classes-count">${item.present_classes} <span class="att-of">of</span> ${item.total_classes}</span>
      </div>
      <div class="att-card-tap-hint">Tap for details</div>
    `;
    card.onclick = () => openAttendanceDetailModal(item, status);
    container.appendChild(card);
  });
}

// ── Attendance detail modal ──────────────────────────────────────
function openAttendanceDetailModal(item, status) {
  const overlay   = document.getElementById('attendance-modal-overlay');
  const nameEl    = document.getElementById('att-modal-course-name');
  const badgeRow  = document.getElementById('att-modal-badge-row');
  const iconWrap  = document.getElementById('att-modal-icon');
  const summaryEl = document.getElementById('att-modal-summary');
  const content   = document.getElementById('att-modal-content');
  const loading   = document.getElementById('att-modal-loading');
  const emptyEl   = document.getElementById('att-modal-empty');
  if (!overlay) return;

  // Header
  const pct = Number(item.percentage) || 0;
  if (nameEl)   nameEl.textContent = item.course_name;
  if (badgeRow) badgeRow.innerHTML = `<span class="att-badge att-badge--${status.key}">${status.icon}${status.label}</span>`;
  if (iconWrap) {
    iconWrap.className = `att-modal-header-icon att-modal-header-icon--${status.key}`;
  }

  // Summary bar
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="att-summary-stats">
        <span class="att-sum-chip att-sum-present">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          ${item.present_classes} Present
        </span>
        <span class="att-sum-chip att-sum-absent">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
          ${item.total_classes - item.present_classes} Absent
        </span>
        <span class="att-sum-chip att-sum-total">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
          ${item.total_classes} Total
        </span>
      </div>
      <div class="att-summary-bar-wrap">
        <div class="att-bar-track"><div class="att-bar-fill att-bar-fill--${status.key}" style="width:${Math.min(pct,100)}%"></div></div>
        <span class="att-summary-pct att-pct--${status.key}">${pct}%</span>
      </div>
    `;
  }

  // Show overlay, reset content area
  overlay.classList.add('modal-open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (content) content.innerHTML = '';
  if (loading) loading.style.display = 'block';
  if (emptyEl) emptyEl.style.display = 'none';

  // Fetch all records for this student then filter to this course client-side.
  // Using the existing /student/:id endpoint avoids requiring a server restart
  // for the newer per-course endpoint.
  apiRequest(`/attendance/student/${currentUser.id}`)
    .then((all) => {
      if (loading) loading.style.display = 'none';
      const records = (Array.isArray(all) ? all : [])
        .filter((r) => Number(r.course_id) === Number(item.course_id))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      if (!records.length) {
        if (emptyEl) emptyEl.style.display = 'flex';
        return;
      }
      if (content) renderAttendanceDetailColumns(content, records);
    })
    .catch(() => {
      if (loading) loading.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'flex';
    });
}

function renderAttendanceDetailColumns(container, records) {
  const present = records.filter((r) => r.status === 'Present');
  const absent  = records.filter((r) => r.status === 'Absent');
  const leave   = records.filter((r) => r.status === 'Leave');

  function formatDate(raw) {
    if (!raw) return '—';
    const d = new Date(raw);
    if (isNaN(d)) return raw;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function dayName(raw) {
    if (!raw) return '';
    const d = new Date(raw);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-GB', { weekday: 'short' });
  }

  function buildColumn(title, items, colorKey, icon) {
    const col = document.createElement('div');
    col.className = `att-detail-col att-detail-col--${colorKey}`;
    col.innerHTML = `
      <div class="att-col-header">
        ${icon}
        <span>${title}</span>
        <span class="att-col-count">${items.length}</span>
      </div>
    `;
    if (!items.length) {
      col.innerHTML += `<p class="att-col-empty">None recorded</p>`;
    } else {
      const list = document.createElement('ul');
      list.className = 'att-date-list';
      items.forEach((r) => {
        const li = document.createElement('li');
        li.className = 'att-date-item';
        li.innerHTML = `
          <span class="att-date-day">${dayName(r.date)}</span>
          <span class="att-date-val">${formatDate(r.date)}</span>
        `;
        list.appendChild(li);
      });
      col.appendChild(list);
    }
    return col;
  }

  container.innerHTML = '';
  container.appendChild(buildColumn('Present', present, 'present',
    `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`
  ));
  container.appendChild(buildColumn('Absent', absent, 'absent',
    `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>`
  ));
  if (leave.length) {
    container.appendChild(buildColumn('Leave', leave, 'leave',
      `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`
    ));
  }
}

function closeAttendanceModal() {
  const overlay = document.getElementById('attendance-modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('modal-open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// Wire attendance modal close
const _attModalClose = document.getElementById('att-modal-close');
if (_attModalClose) _attModalClose.onclick = closeAttendanceModal;

const _attOverlay = document.getElementById('attendance-modal-overlay');
if (_attOverlay) {
  _attOverlay.addEventListener('click', (e) => {
    if (e.target === _attOverlay) closeAttendanceModal();
  });
}

// Extend Escape key handler for both modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAttendanceModal();
});

const leaveForm = document.getElementById('leave-form');
if (leaveForm) {
  leaveForm.onsubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        student_id: Number(document.getElementById('leave-student').value),
        from_date: document.getElementById('leave-from').value,
        to_date: document.getElementById('leave-to').value,
        reason: document.getElementById('leave-reason').value,
      };
      const data = await apiRequest('/leave', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setResult('leave-result', data);
      await loadLeaveRequests();
    } catch (err) {
      setResult('leave-result', err.error || 'Failed to apply leave');
    }
  };
}

const leaveLoadBtn = document.getElementById('leave-load');
if (leaveLoadBtn) {
  leaveLoadBtn.onclick = async () => {
    await loadLeaveRequests();
  };
}

async function loadLeaveRequests() {
  try {
    const data = isFaculty()
      ? await apiRequest('/leave')
      : await apiRequest(`/leave/student/${Number(document.getElementById('leave-student')?.value || currentUser.id)}`);
    if (isFaculty()) {
      renderTeacherLeaves(data || []);
    } else {
      renderStudentLeaves(data || []);
    }
  } catch (err) {
    setResult('leave-result', err.error || 'Failed to load leave requests');
    if (isFaculty()) renderTeacherLeaves([]);
    else renderStudentLeaves([]);
  }
}

function renderStudentLeaves(leaves) {
  const list = document.getElementById('student-leave-list');
  const empty = document.getElementById('student-leave-empty');
  if (!list) return;

  list.innerHTML = '';
  if (!leaves.length) {
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';
  leaves.forEach((leave) => {
    const fromDate = leave.from_date ? new Date(leave.from_date).toLocaleDateString() : '-';
    const toDate = leave.to_date ? new Date(leave.to_date).toLocaleDateString() : '-';
    const status = (leave.status || 'Pending').toLowerCase();
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <span class="status-chip status-${status}">${leave.status || 'Pending'}</span>
      <strong>${leave.reason || 'No reason provided'}</strong>
      <span>${fromDate} - ${toDate}</span>
    `;
    list.appendChild(item);
  });
}

function renderTeacherLeaves(leaves) {
  const list = document.getElementById('teacher-leave-list');
  const empty = document.getElementById('teacher-leave-empty');
  if (!list) return;

  list.innerHTML = '';
  if (!leaves.length) {
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';
  leaves.forEach((leave) => {
    const fromDate = leave.from_date ? new Date(leave.from_date).toLocaleDateString() : '-';
    const toDate = leave.to_date ? new Date(leave.to_date).toLocaleDateString() : '-';
    const status = (leave.status || 'Pending').toLowerCase();
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <span class="status-chip status-${status}">${leave.status || 'Pending'}</span>
      <strong>Student ID ${leave.student_id || '-'}</strong>
      <span>${fromDate} - ${toDate} | ${leave.reason || ''}</span>
      <span style="font-size:0.78rem;color:#6b7280;">Request ID: ${leave._id || '-'}</span>
      <div class="inline-actions">
        <button type="button" class="mini-btn" data-action="approve" data-id="${leave._id || ''}">Approve</button>
        <button type="button" class="mini-btn" data-action="reject" data-id="${leave._id || ''}">Reject</button>
      </div>
    `;

    item.querySelectorAll('.mini-btn').forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        if (!id) return;
        try {
          const endpoint = action === 'approve' ? `/leave/${id}/approve` : `/leave/${id}/reject`;
          await apiRequest(endpoint, { method: 'POST' });
          await loadLeaveRequests();
        } catch (err) {
          setResult('leave-result', err.error || 'Failed to review leave request');
        }
      };
    });

    list.appendChild(item);
  });
}

const leaveLoadAllBtn = document.getElementById('leave-load-all');
if (leaveLoadAllBtn) {
  leaveLoadAllBtn.onclick = async () => {
    await loadLeaveRequests();
  };
}

const leaveReviewForm = document.getElementById('leave-review-form');
if (leaveReviewForm) {
  leaveReviewForm.onsubmit = async (e) => {
    e.preventDefault();
    try {
      const id = document.getElementById('leave-review-id').value.trim();
      const action = document.getElementById('leave-review-status').value;
      const endpoint = action === 'approve' ? `/leave/${id}/approve` : `/leave/${id}/reject`;
      await apiRequest(endpoint, { method: 'POST' });
      await loadLeaveRequests();
    } catch (err) {
      setResult('leave-result', err.error || 'Failed to review leave request');
    }
  };
}

const materialsForm = document.getElementById('materials-form');
if (materialsForm) {
  materialsForm.onsubmit = async (e) => {
    e.preventDefault();
    try {
      const courseId = Number(document.getElementById('materials-course').value);
      const uploadedBy = Number(document.getElementById('materials-uploaded-by').value);
      const title = document.getElementById('materials-title').value;
      const url = document.getElementById('materials-url').value.trim();
      const fileInput = document.getElementById('materials-file');
      const file = fileInput?.files?.[0];

      let data;
      if (file) {
        const formData = new FormData();
        formData.append('course_id', String(courseId));
        formData.append('uploaded_by', String(uploadedBy));
        formData.append('title', title);
        formData.append('file', file);

        const res = await fetch(`${API_BASE}/materials/upload`, {
          method: 'POST',
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          body: formData,
        });
        data = await res.json();
        if (!res.ok) throw data;
      } else {
        if (!url) {
          throw { error: 'Choose a file or provide a URL' };
        }
        data = await apiRequest('/materials', {
          method: 'POST',
          body: JSON.stringify({ course_id: courseId, uploaded_by: uploadedBy, title, url }),
        });
      }

      setResult('materials-result', data);
      if (fileInput) fileInput.value = '';
      document.getElementById('materials-url').value = '';
      await loadTeacherMaterials();
    } catch (err) {
      setResult('materials-result', err.error || 'Failed to upload material');
    }
  };
}

const notificationsLoadBtn = document.getElementById('notifications-load');
if (notificationsLoadBtn) {
  notificationsLoadBtn.onclick = async () => {
    try {
      await loadTeacherNotifications();
    } catch (err) {
      const empty = document.getElementById('notifications-empty');
      if (empty) {
        empty.textContent = err.error || 'Failed to load notifications';
        empty.style.display = 'block';
      }
    }
  };
}

const notificationForm = document.getElementById('notification-form');
if (notificationForm) {
  notificationForm.onsubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        type: document.getElementById('notification-type').value,
        message: document.getElementById('notification-message').value,
      };
      const data = await apiRequest('/notifications', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      document.getElementById('notification-type').value = '';
      document.getElementById('notification-message').value = '';
      await loadTeacherNotifications();
    } catch (err) {
      const empty = document.getElementById('notifications-empty');
      if (empty) {
        empty.textContent = err.error || 'Failed to add notification';
        empty.style.display = 'block';
      }
    }
  };
}

async function loadOverview() {
  if (!currentUser?.id) return;

  if (isFaculty()) {
    await loadTeacherOverview();
  } else {
    await loadStudentOverview();
  }
}
