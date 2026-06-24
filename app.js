const API_URL = 'https://d424-software-engineering-capstone-8iwy.onrender.com/api';
let token = localStorage.getItem('token');
let currentVacationId = null;

// Page Navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    if (pageId === 'dashboardPage') loadVacations();
    if (pageId === 'reportPage') generateReport();
}

// Auth Functions
async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    if (!username || !password) {
        showError('loginError', 'Please enter username and password');
        return;
    }
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
            token = data.token;
            localStorage.setItem('token', token);
            showPage('dashboardPage');
        } else {
            showError('loginError', data || 'Invalid username or password');
        }
    } catch (error) {
        showError('loginError', 'Connection error. Is the server running?');
    }
}

async function register() {
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    if (!username || !email || !password) {
        showError('registerError', 'Please fill in all fields');
        return;
    }
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        if (response.ok) {
            token = data.token;
            localStorage.setItem('token', token);
            showPage('dashboardPage');
        } else {
            showError('registerError', data || 'Registration failed');
        }
    } catch (error) {
        showError('registerError', 'Connection error. Is the server running?');
    }
}

function logout() {
    token = null;
    localStorage.removeItem('token');
    showPage('loginPage');
}

// Vacation Functions
async function loadVacations() {
    try {
        const response = await fetch(`${API_URL}/vacations`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const vacations = await response.json();
        const list = document.getElementById('vacationsList');
        if (vacations.length === 0) {
            list.innerHTML = `<div class="empty-state">
                <p>No vacations yet. Click "+ Add Vacation" to get started!</p>
            </div>`;
            return;
        }
        list.innerHTML = vacations.map(v => `
            <div class="vacation-card">
                <div class="vacation-info">
                    <h3>${v.title}</h3>
                    <p>🏨 ${v.hotel}</p>
                    <p>📅 ${v.startDate} - ${v.endDate}</p>
                </div>
                <div class="vacation-actions">
                    <button onclick="viewExcursions(${v.id}, '${v.title}')">
                        Excursions
                    </button>
                    <button class="danger" onclick="deleteVacation(${v.id})">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading vacations:', error);
    }
}

async function addVacation() {
    const title = document.getElementById('vacTitle').value.trim();
    const hotel = document.getElementById('vacHotel').value.trim();
    const startDate = document.getElementById('vacStart').value.trim();
    const endDate = document.getElementById('vacEnd').value.trim();

    if (!title || !hotel || !startDate || !endDate) {
        showError('addVacationError', 'Please fill in all fields');
        return;
    }
    if (!validateDate(startDate) || !validateDate(endDate)) {
        showError('addVacationError', 'Dates must be in MM/DD/YYYY format');
        return;
    }
    if (!isEndAfterStart(startDate, endDate)) {
        showError('addVacationError', 'End date must be after start date');
        return;
    }
    try {
        const response = await fetch(`${API_URL}/vacations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, hotel, startDate, endDate })
        });
        if (response.ok) {
            document.getElementById('vacTitle').value = '';
            document.getElementById('vacHotel').value = '';
            document.getElementById('vacStart').value = '';
            document.getElementById('vacEnd').value = '';
            showPage('dashboardPage');
        } else {
            showError('addVacationError', 'Failed to add vacation');
        }
    } catch (error) {
        showError('addVacationError', 'Connection error');
    }
}

async function deleteVacation(id) {
    if (!confirm('Are you sure you want to delete this vacation?')) return;
    try {
        const response = await fetch(`${API_URL}/vacations/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            loadVacations();
        } else {
            const msg = await response.text();
            alert(msg);
        }
    } catch (error) {
        console.error('Error deleting vacation:', error);
    }
}

// Excursion Functions
function viewExcursions(vacationId, vacationTitle) {
    currentVacationId = vacationId;
    document.getElementById('excursionsTitle').textContent =
        `Excursions - ${vacationTitle}`;
    loadExcursions();
    showPage('excursionsPage');
}

async function loadExcursions() {
    try {
        const response = await fetch(
            `${API_URL}/excursions/vacation/${currentVacationId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const excursions = await response.json();
        const list = document.getElementById('excursionsList');
        if (excursions.length === 0) {
            list.innerHTML = `<div class="empty-state">
                <p>No excursions yet. Click "+ Add Excursion" to get started!</p>
            </div>`;
            return;
        }
        list.innerHTML = excursions.map(e => `
            <div class="excursion-card">
                <div class="excursion-info">
                    <h4>${e.title}</h4>
                    <p>📅 ${e.excursionDate}</p>
                </div>
                <div class="excursion-actions">
                    <button class="danger" onclick="deleteExcursion(${e.id})">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading excursions:', error);
    }
}

function showAddExcursionForm() {
    document.getElementById('addExcursionForm').classList.remove('hidden');
}

function hideAddExcursionForm() {
    document.getElementById('addExcursionForm').classList.add('hidden');
}

async function addExcursion() {
    const title = document.getElementById('excTitle').value.trim();
    const excursionDate = document.getElementById('excDate').value.trim();
    if (!title || !excursionDate) {
        showError('addExcursionError', 'Please fill in all fields');
        return;
    }
    if (!validateDate(excursionDate)) {
        showError('addExcursionError', 'Date must be in MM/DD/YYYY format');
        return;
    }
    try {
        const response = await fetch(
            `${API_URL}/excursions/vacation/${currentVacationId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, excursionDate })
        });
        if (response.ok) {
            document.getElementById('excTitle').value = '';
            document.getElementById('excDate').value = '';
            hideAddExcursionForm();
            loadExcursions();
        } else {
            showError('addExcursionError', 'Failed to add excursion');
        }
    } catch (error) {
        showError('addExcursionError', 'Connection error');
    }
}

async function deleteExcursion(id) {
    if (!confirm('Are you sure you want to delete this excursion?')) return;
    try {
        const response = await fetch(`${API_URL}/excursions/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) loadExcursions();
    } catch (error) {
        console.error('Error deleting excursion:', error);
    }
}

// Search Functions
async function search() {
    const keyword = document.getElementById('searchKeyword').value.trim();
    if (!keyword) return;
    try {
        const response = await fetch(
            `${API_URL}/vacations/search?keyword=${keyword}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const vacations = await response.json();
        const results = document.getElementById('searchResults');
        if (vacations.length === 0) {
            results.innerHTML = `<div class="empty-state">
                <p>No vacations found matching "${keyword}"</p>
            </div>`;
            return;
        }
        results.innerHTML = `
            <h3 style="margin-bottom:15px">
                Found ${vacations.length} result(s) for "${keyword}"
            </h3>
            ${vacations.map(v => `
                <div class="vacation-card">
                    <div class="vacation-info">
                        <h3>${v.title}</h3>
                        <p>🏨 ${v.hotel}</p>
                        <p>📅 ${v.startDate} - ${v.endDate}</p>
                    </div>
                    <div class="vacation-actions">
                        <button onclick="viewExcursions(${v.id}, '${v.title}')">
                            Excursions
                        </button>
                    </div>
                </div>
            `).join('')}`;
    } catch (error) {
        console.error('Error searching:', error);
    }
}

// Report Functions
async function generateReport() {
    try {
        const response = await fetch(`${API_URL}/reports/vacation-summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const report = await response.json();
        const content = document.getElementById('reportContent');
        content.innerHTML = `
            <div class="report-header">
                <h3>${report.reportTitle}</h3>
                <p>Generated for: ${report.generatedFor}</p>
                <p>Generated at: ${report.generatedAt}</p>
                <p>Total Vacations: ${report.totalVacations}</p>
            </div>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Vacation Title</th>
                        <th>Hotel</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Excursions</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.data.map(row => `
                        <tr>
                            <td>${row.vacationTitle}</td>
                            <td>${row.hotel}</td>
                            <td>${row.startDate}</td>
                            <td>${row.endDate}</td>
                            <td>${row.excursionCount} excursion(s)</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
    } catch (error) {
        console.error('Error generating report:', error);
    }
}

// Validation Functions
function validateDate(date) {
    const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
    return regex.test(date);
}

function isEndAfterStart(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return end > start;
}

// Utility Functions
function showError(elementId, message) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
}

// Check if already logged in
window.onload = function() {
    if (token) {
        showPage('dashboardPage');
    } else {
        showPage('loginPage');
    }
};