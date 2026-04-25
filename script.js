/**
 * Student Personal Attendance Tracker - core logic
 */

class AttendanceApp {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('att_users')) || {};
        this.currentUser = localStorage.getItem('att_current_user') || null;
        
        this.data = {
            profile: {
                name: 'Batch 1 Student',
                roll: '100524733006',
                dept: 'B.E (CSE) IV-Semester',
                college: 'Osmania University',
                targetPct: 75
            },
            subjects: [
                { id: '1', name: 'Engineering Mathematics - IV', faculty: 'Dr. Kamalapurkar', attended: 0, total: 0 },
                { id: '2', name: 'Automata Languages & Computation', faculty: 'Dr. Ch. Rathaiah Kumar', attended: 0, total: 0 },
                { id: '3', name: 'Design & Analysis of Algorithms', faculty: 'Mr. D. Sai Kumar', attended: 0, total: 0 },
                { id: '4', name: 'Operating Systems', faculty: 'Mrs. E. Pragnavi', attended: 0, total: 0 },
                { id: '5', name: 'Managerial Economics & Accountancy', faculty: 'Dr. R. Seetharama Rao', attended: 0, total: 0 },
                { id: '6', name: 'Signals and Systems', faculty: 'Dr. B. Ramesh', attended: 0, total: 0 },
                { id: '7', name: 'Data Analytics using R', faculty: 'Prof. K. Shyamala', attended: 0, total: 0 },
                { id: '8', name: 'DAA Lab (Batch-I)', faculty: 'Dr. B. Sujatha', attended: 0, total: 0 },
                { id: '9', name: 'OS Lab (Batch-I)', faculty: 'Mrs. E. Pragnavi', attended: 0, total: 0 }
            ],
            history: {},
            theme: localStorage.getItem('att_theme') || 'light'
        };

        if (this.currentUser && this.users[this.currentUser]) {
            this.data = { ...this.data, ...this.users[this.currentUser].data };
        }

        this.currentSection = 'dashboard';
        this.currentDate = new Date();
        this.calendarMonth = new Date().getMonth();
        this.calendarYear = new Date().getFullYear();
        this.charts = {};

        try {
            this.init();
        } catch (error) {
            console.error('App initialization failed:', error);
        }
    }

    init() {
        this.applyTheme();
        this.setupEventListeners();
        
        if (this.currentUser) {
            this.closeModal('login-overlay');
            this.updateProfileDisplay();
            this.renderDashboard();
            this.updateDateDisplay();
            this.initCalendar();
            console.log('App initialized for:', this.currentUser);
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item[data-section]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.switchSection(section);
            });
        });

        // Login Handler
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const user = document.getElementById('login-user').value;
                const pass = document.getElementById('login-pass').value;
                
                if (this.users[user] && this.users[user].password === pass) {
                    this.currentUser = user;
                    localStorage.setItem('att_current_user', user);
                    this.data.profile = { ...this.data.profile, ...this.users[user].data.profile };
                    this.data.subjects = this.users[user].data.subjects;
                    this.data.history = this.users[user].data.history;
                    
                    this.closeModal('login-overlay');
                    this.updateProfileDisplay();
                    this.renderDashboard();
                    this.updateDateDisplay();
                    this.initCalendar();
                    this.showNotification('Welcome back, ' + this.data.profile.name + '!', 'success');
                } else {
                    this.showNotification('Invalid username or password!', 'error');
                }
            });
        }

        // Register Handler
        const regForm = document.getElementById('register-form');
        if (regForm) {
            regForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('reg-name').value;
                const user = document.getElementById('reg-user').value;
                const pass = document.getElementById('reg-pass').value;

                if (this.users[user]) {
                    this.showNotification('Username already exists!', 'error');
                    return;
                }

                // Create new user with default subjects
                this.users[user] = {
                    password: pass,
                    data: {
                        profile: { ...this.data.profile, name: name, roll: user },
                        subjects: [...this.data.subjects],
                        history: {}
                    }
                };
                
                this.saveData();
                this.showNotification('Account created! Please login.', 'success');
                this.toggleAuthView('login');
            });
        }

        // Profile Form
        document.getElementById('profile-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            this.data.profile = {
                name: formData.get('name'),
                roll: formData.get('roll'),
                dept: formData.get('dept'),
                college: formData.get('college'),
                targetPct: parseFloat(formData.get('targetPct')) || 75
            };
            this.saveData();
            this.updateProfileDisplay();
            this.renderDashboard();
            this.showNotification('Profile updated successfully!', 'success');
        });

        // Subject Form
        document.getElementById('subject-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubjectSubmit();
        });

        // Theme Toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.data.theme = this.data.theme === 'light' ? 'dark' : 'light';
            this.applyTheme();
            this.saveData();
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('att_current_user');
                location.reload();
            }
        });
    }

    // --- Core Logic ---

    saveData() {
        if (this.currentUser) {
            this.users[this.currentUser].data = {
                profile: this.data.profile,
                subjects: this.data.subjects,
                history: this.data.history
            };
        }
        localStorage.setItem('att_users', JSON.stringify(this.users));
        localStorage.setItem('att_current_user', this.currentUser);
        localStorage.setItem('att_theme', this.data.theme);
    }

    toggleAuthView(view) {
        if (view === 'register') {
            document.getElementById('login-view').style.display = 'none';
            document.getElementById('register-view').style.display = 'block';
        } else {
            document.getElementById('login-view').style.display = 'block';
            document.getElementById('register-view').style.display = 'none';
        }
    }

    refreshIcons() {
        try {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        } catch (e) {
            console.warn('Lucide icons failed to load:', e);
        }
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.data.theme);
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            const icon = themeBtn.querySelector('i');
            if (icon) {
                if (this.data.theme === 'dark') {
                    icon.setAttribute('data-lucide', 'sun');
                } else {
                    icon.setAttribute('data-lucide', 'moon');
                }
            }
        }
        this.refreshIcons();
    }

    switchSection(sectionId) {
        document.querySelectorAll('.content-section').forEach(sec => sec.style.display = 'none');
        const target = document.getElementById(`${sectionId}-section`);
        if (target) {
            target.style.display = 'block';
            this.currentSection = sectionId;

            // Update nav active state
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            document.querySelector(`.nav-item[data-section="${sectionId}"]`)?.classList.add('active');

            // Refresh specific section content
            if (sectionId === 'subjects') this.renderManageSubjects();
            if (sectionId === 'reports') this.renderReports();
            if (sectionId === 'profile') this.fillProfileForm();
            if (sectionId === 'calendar') this.renderCalendar();
        }
    }

    // --- Dashboard ---

    renderDashboard() {
        this.renderStats();
        this.renderSubjectCards('dashboard-subjects-list', true);
    }

    renderStats() {
        const subjects = this.data.subjects;
        const totalSubjects = subjects.length;
        let totalAttended = 0;
        let totalClasses = 0;
        let shortageCount = 0;

        subjects.forEach(s => {
            totalAttended += parseInt(s.attended || 0);
            totalClasses += parseInt(s.total || 0);
            const pct = s.total > 0 ? (s.attended / s.total) * 100 : 0;
            const target = this.data.profile.targetPct || 75;
            if (pct < target) shortageCount++;
        });

        const overallPct = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;

        document.getElementById('overall-percentage').textContent = `${overallPct.toFixed(1)}%`;
        document.getElementById('total-subjects-count').textContent = totalSubjects;
        document.getElementById('total-attended').textContent = totalAttended;
        document.getElementById('total-missed-label').textContent = `${totalClasses - totalAttended} Missed`;

        const shortageEl = document.getElementById('shortage-count');
        shortageEl.textContent = shortageCount > 0 ? `${shortageCount} Critical` : 'None';
        shortageEl.style.color = shortageCount > 0 ? 'var(--danger)' : 'var(--success)';

        const trendEl = document.querySelector('.stat-card .stat-trend');
        if (overallPct >= this.data.profile.targetPct) {
            trendEl.className = 'stat-trend trend-up';
            trendEl.innerHTML = '<i data-lucide="trending-up"></i> <span>Above target</span>';
        } else {
            trendEl.className = 'stat-trend trend-down';
            trendEl.innerHTML = '<i data-lucide="trending-down"></i> <span>Below target</span>';
        }
        this.refreshIcons();
    }

    renderSubjectCards(containerId, isDashboard = false) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        if (this.data.subjects.length === 0) {
            container.innerHTML = `<div style="grid-column: span 3; text-align: center; padding: 3rem; color: var(--text-muted);">
                <i data-lucide="book-open" style="width: 48px; height: 48px; margin-bottom: 1rem;"></i>
                <p>No subjects added yet. Start by adding one!</p>
            </div>`;
            this.refreshIcons();
            return;
        }

        this.data.subjects.forEach(subj => {
            const pct = subj.total > 0 ? (subj.attended / subj.total) * 100 : 0;
            let statusClass = 'success';
            const target = this.data.profile.targetPct || 75;
            if (pct < target) statusClass = 'danger';
            else if (pct < target + 5) statusClass = 'warning';

            const card = document.createElement('div');
            card.className = `subject-card ${statusClass}`;
            card.innerHTML = `
                <div class="subject-header">
                    <div class="subject-info">
                        <h3>${subj.name}</h3>
                        <p>${subj.faculty || 'Unassigned Faculty'}</p>
                    </div>
                    <span class="attendance-badge" style="background: ${statusClass === 'success' ? 'rgba(16, 185, 129, 0.1)' : (statusClass === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)')}; color: var(--${statusClass});">
                        ${pct.toFixed(0)}%
                    </span>
                </div>
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${pct}%; background: var(--${statusClass});"></div>
                    </div>
                </div>
                <div class="subject-footer">
                    <span>${subj.attended}/${subj.total} Classes</span>
                    <div style="display: flex; gap: 0.5rem;">
                        ${isDashboard ? '' : `
                            <button onclick="app.editSubject('${subj.id}')" title="Edit"><i data-lucide="edit-3" style="width: 16px;"></i></button>
                            <button onclick="app.deleteSubject('${subj.id}')" title="Delete" style="color: var(--danger);"><i data-lucide="trash-2" style="width: 16px;"></i></button>
                        `}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
        this.refreshIcons();
    }

    // --- Subjects Management ---

    renderManageSubjects() {
        this.renderSubjectCards('manage-subjects-list');
    }

    showAddSubjectModal() {
        document.getElementById('modal-title').textContent = 'Add New Subject';
        document.getElementById('subject-form').reset();
        document.getElementById('subj-id').value = '';
        this.showModal('subject-modal');
    }

    editSubject(id) {
        const subj = this.data.subjects.find(s => s.id === id);
        if (!subj) return;

        document.getElementById('modal-title').textContent = 'Edit Subject';
        document.getElementById('subj-id').value = subj.id;
        document.getElementById('subj-name').value = subj.name;
        document.getElementById('subj-faculty').value = subj.faculty || '';
        document.getElementById('subj-attended').value = subj.attended;
        document.getElementById('subj-total').value = subj.total;

        this.showModal('subject-modal');
    }

    handleSubjectSubmit() {
        const id = document.getElementById('subj-id').value;
        const name = document.getElementById('subj-name').value;
        const faculty = document.getElementById('subj-faculty').value;
        const attended = parseInt(document.getElementById('subj-attended').value) || 0;
        const total = parseInt(document.getElementById('subj-total').value) || 0;

        if (attended > total) {
            this.showNotification('Attended classes cannot exceed total classes!', 'error');
            return;
        }

        if (id) {
            // Update
            const index = this.data.subjects.findIndex(s => s.id === id);
            this.data.subjects[index] = { ...this.data.subjects[index], name, faculty, attended, total };
        } else {
            // Create
            this.data.subjects.push({
                id: Date.now().toString(),
                name,
                faculty,
                attended,
                total
            });
        }

        this.saveData();
        this.closeModal('subject-modal');
        this.renderDashboard();
        this.renderManageSubjects();
        this.showNotification('Subject saved successfully!', 'success');
    }

    deleteSubject(id) {
        if (confirm('Are you sure you want to delete this subject? All records will be lost.')) {
            this.data.subjects = this.data.subjects.filter(s => s.id !== id);
            this.saveData();
            this.renderDashboard();
            this.renderManageSubjects();
        }
    }

    // --- Calculator ---

    calculateAttendance() {
        const target = parseFloat(document.getElementById('calc-target').value) || 75;
        const total = parseInt(document.getElementById('calc-total').value) || 0;
        const attended = parseInt(document.getElementById('calc-attended').value) || 0;

        if (total === 0) {
            this.showNotification('Total classes must be greater than 0', 'error');
            return;
        }

        const currentPct = (attended / total) * 100;
        const resultCard = document.getElementById('calc-result-card');
        const resultText = document.getElementById('calc-result-text');
        const resultSub = document.getElementById('calc-result-sub');

        resultCard.style.display = 'block';

        if (currentPct >= target) {
            // How many can I skip?
            let skippable = 0;
            let tempTotal = total;
            while (((attended) / (tempTotal + 1)) * 100 >= target) {
                tempTotal++;
                skippable++;
            }
            resultText.textContent = `You can skip ${skippable} classes`;
            resultSub.textContent = `Current: ${currentPct.toFixed(1)}%. Keep it above ${target}%!`;
            resultCard.style.background = 'var(--success)';
        } else {
            // How many do I need to attend?
            let needed = 0;
            let tempTotal = total;
            let tempAttended = attended;
            while ((tempAttended / tempTotal) * 100 < target) {
                tempTotal++;
                tempAttended++;
                needed++;
            }
            resultText.textContent = `Attend ${needed} more classes`;
            resultSub.textContent = `To reach your target of ${target}% (Currently ${currentPct.toFixed(1)}%)`;
            resultCard.style.background = 'var(--danger)';
        }
    }

    // --- Profile ---

    updateProfileDisplay() {
        document.getElementById('profile-name-display').textContent = this.data.profile.name;
        document.getElementById('profile-dept-display').textContent = `${this.data.profile.dept} • ${this.data.profile.college || 'No College'}`;
        document.getElementById('greeting').textContent = `Hello, ${this.data.profile.name.split(' ')[0]}!`;
    }

    fillProfileForm() {
        document.getElementById('prof-name').value = this.data.profile.name;
        document.getElementById('prof-roll').value = this.data.profile.roll;
        document.getElementById('prof-dept').value = this.data.profile.dept;
        document.getElementById('prof-college').value = this.data.profile.college || '';
        document.getElementById('prof-target').value = this.data.profile.targetPct;
    }

    // --- Reports ---

    renderReports() {
        const ctxComp = document.getElementById('subjectComparisonChart').getContext('2d');
        const ctxOverall = document.getElementById('overallPieChart').getContext('2d');

        if (this.charts.comparison) this.charts.comparison.destroy();
        if (this.charts.overall) this.charts.overall.destroy();

        const labels = this.data.subjects.map(s => s.name);
        const pcts = this.data.subjects.map(s => (s.attended / s.total * 100) || 0);

        this.charts.comparison = new Chart(ctxComp, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Attendance %',
                    data: pcts,
                    backgroundColor: '#2563eb',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 100 }
                }
            }
        });

        let totalAtt = 0, totalClasses = 0;
        this.data.subjects.forEach(s => {
            totalAtt += parseInt(s.attended);
            totalClasses += parseInt(s.total);
        });

        this.charts.overall = new Chart(ctxOverall, {
            type: 'pie',
            data: {
                labels: ['Attended', 'Missed'],
                datasets: [{
                    data: [totalAtt, totalClasses - totalAtt],
                    backgroundColor: ['#2563eb', '#f1f5f9'],
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // --- Calendar ---

    initCalendar() {
        this.renderCalendar();
    }

    renderCalendar() {
        const grid = document.getElementById('calendar-grid');
        const monthYear = document.getElementById('calendar-month-year');

        // Clear previous days (keep headers)
        const headers = Array.from(grid.children).slice(0, 7);
        grid.innerHTML = '';
        headers.forEach(h => grid.appendChild(h));

        const firstDay = new Date(this.calendarYear, this.calendarMonth, 1).getDay();
        const daysInMonth = new Date(this.calendarYear, this.calendarMonth + 1, 0).getDate();

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        monthYear.textContent = `${monthNames[this.calendarMonth]} ${this.calendarYear}`;

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            grid.appendChild(document.createElement('div'));
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${this.calendarYear}-${(this.calendarMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dayEl = document.createElement('div');
            dayEl.style.padding = '0.75rem';
            dayEl.style.borderRadius = 'var(--radius-md)';
            dayEl.style.cursor = 'pointer';
            dayEl.textContent = day;

            // Simple status tracking for demo
            if (this.data.history[dateStr] === 'present') {
                dayEl.style.background = 'var(--success)';
                dayEl.style.color = 'white';
            } else if (this.data.history[dateStr] === 'absent') {
                dayEl.style.background = 'var(--danger)';
                dayEl.style.color = 'white';
            } else {
                dayEl.style.background = 'rgba(0,0,0,0.02)';
            }

            dayEl.onclick = () => this.toggleAttendance(dateStr);
            grid.appendChild(dayEl);
        }
        this.refreshIcons();
    }

    toggleAttendance(dateStr) {
        const current = this.data.history[dateStr];
        if (!current) this.data.history[dateStr] = 'present';
        else if (current === 'present') this.data.history[dateStr] = 'absent';
        else delete this.data.history[dateStr];

        this.saveData();
        this.renderCalendar();
    }

    prevMonth() {
        console.log('Previous month clicked');
        this.calendarMonth--;
        if (this.calendarMonth < 0) {
            this.calendarMonth = 11;
            this.calendarYear--;
        }
        this.renderCalendar();
    }

    nextMonth() {
        console.log('Next month clicked');
        this.calendarMonth++;
        if (this.calendarMonth > 11) {
            this.calendarMonth = 0;
            this.calendarYear++;
        }
        this.renderCalendar();
    }

    // --- Helpers ---

    showModal(id) {
        document.getElementById(id).classList.add('active');
    }

    closeModal(id) {
        document.getElementById(id).classList.remove('active');
    }

    updateDateDisplay() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').textContent = new Date().toLocaleDateString(undefined, options);
    }

    showNotification(msg, type = 'info') {
        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.bottom = '2rem';
        toast.style.right = '2rem';
        toast.style.padding = '1rem 2rem';
        toast.style.borderRadius = 'var(--radius-md)';
        toast.style.background = type === 'success' ? 'var(--success)' : (type === 'error' ? 'var(--danger)' : 'var(--info)');
        toast.style.color = 'white';
        toast.style.boxShadow = 'var(--shadow-lg)';
        toast.style.zIndex = '9999';
        toast.style.animation = 'slideIn 0.3s ease-out';
        toast.textContent = msg;

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    exportData() {
        const dataStr = JSON.stringify(this.data);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', 'attendance_backup.json');
        linkElement.click();
    }

    resetData() {
        if (confirm('WARNING: This will delete all your attendance records. Continue?')) {
            localStorage.clear();
            location.reload();
        }
    }
}

// Global App Instance
const app = new AttendanceApp();
