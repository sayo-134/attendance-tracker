// Constants
const MONTHLY_TARGET = 200; // hours

// State
let currentSession = null;
let sessions = [];

// DOM Elements
const tapInBtn = document.getElementById('tap-in-btn');
const tapOutBtn = document.getElementById('tap-out-btn');
const statusEl = document.getElementById('status');
const currentSessionEl = document.getElementById('current-session');
const todayHoursEl = document.getElementById('today-hours');
const monthHoursEl = document.getElementById('month-hours');
const remainingHoursEl = document.getElementById('remaining-hours');
const progressPercentEl = document.getElementById('progress-percent');
const progressFillEl = document.getElementById('progress-fill');
const historyListEl = document.getElementById('history-list');
const clearDataBtn = document.getElementById('clear-data-btn');
const exportBtn = document.getElementById('export-btn');
const statusCard = document.querySelector('.status-card');

// Load data from localStorage
function loadData() {
    const savedSessions = localStorage.getItem('attendanceSessions');
    const savedCurrentSession = localStorage.getItem('currentSession');
    
    if (savedSessions) {
        sessions = JSON.parse(savedSessions);
    }
    
    if (savedCurrentSession) {
        currentSession = JSON.parse(savedCurrentSession);
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('attendanceSessions', JSON.stringify(sessions));
    if (currentSession) {
        localStorage.setItem('currentSession', JSON.stringify(currentSession));
    } else {
        localStorage.removeItem('currentSession');
    }
}

// Format date
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Format time
function formatTime(date) {
    return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Calculate duration in hours
function calculateDuration(start, end) {
    const diff = new Date(end) - new Date(start);
    return diff / (1000 * 60 * 60); // Convert to hours
}

// Format hours to readable string
function formatHours(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

// Get today's sessions
function getTodaySessions() {
    const today = new Date().toDateString();
    return sessions.filter(s => new Date(s.tapIn).toDateString() === today);
}

// Get this month's sessions
function getMonthSessions() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return sessions.filter(s => {
        const date = new Date(s.tapIn);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
}

// Calculate total hours
function calculateTotalHours(sessionList) {
    return sessionList.reduce((total, session) => {
        return total + calculateDuration(session.tapIn, session.tapOut);
    }, 0);
}

// Update UI
function updateUI() {
    // Update status
    if (currentSession) {
        statusEl.textContent = '✅ Tapped In';
        statusCard.classList.add('tapped-in');
        const duration = calculateDuration(currentSession.tapIn, new Date());
        currentSessionEl.textContent = `Since ${formatTime(currentSession.tapIn)} (${formatHours(duration)})`;
        tapInBtn.disabled = true;
        tapOutBtn.disabled = false;
    } else {
        statusEl.textContent = '⭕ Not Tapped In';
        statusCard.classList.remove('tapped-in');
        currentSessionEl.textContent = '';
        tapInBtn.disabled = false;
        tapOutBtn.disabled = true;
    }
    
    // Calculate hours
    const todaySessions = getTodaySessions();
    const monthSessions = getMonthSessions();
    
    let todayHours = calculateTotalHours(todaySessions);
    let monthHours = calculateTotalHours(monthSessions);
    
    // Add current session if active
    if (currentSession) {
        const currentDuration = calculateDuration(currentSession.tapIn, new Date());
        todayHours += currentDuration;
        monthHours += currentDuration;
    }
    
    const remaining = Math.max(0, MONTHLY_TARGET - monthHours);
    const progress = Math.min(100, (monthHours / MONTHLY_TARGET) * 100);
    
    // Update stats
    todayHoursEl.textContent = todayHours.toFixed(2);
    monthHoursEl.textContent = monthHours.toFixed(2);
    remainingHoursEl.textContent = remaining.toFixed(2);
    progressPercentEl.textContent = `${progress.toFixed(0)}%`;
    progressFillEl.style.width = `${progress}%`;
    
    // Update history
    renderHistory();
}

// Render history
function renderHistory() {
    if (sessions.length === 0) {
        historyListEl.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 20px;">No sessions yet</p>';
        return;
    }
    
    const sortedSessions = [...sessions].sort((a, b) => new Date(b.tapIn) - new Date(a.tapIn));
    const recentSessions = sortedSessions.slice(0, 20); // Show last 20
    
    historyListEl.innerHTML = recentSessions.map(session => {
        const duration = calculateDuration(session.tapIn, session.tapOut);
        return `
            <div class="history-item">
                <div>
                    <div class="history-date">${formatDate(session.tapIn)}</div>
                    <div class="history-time">${formatTime(session.tapIn)} - ${formatTime(session.tapOut)}</div>
                </div>
                <div class="history-duration">${formatHours(duration)}</div>
            </div>
        `;
    }).join('');
}

// Tap In
function tapIn() {
    currentSession = {
        tapIn: new Date().toISOString()
    };
    saveData();
    updateUI();
}

// Tap Out
function tapOut() {
    if (!currentSession) return;
    
    const session = {
        tapIn: currentSession.tapIn,
        tapOut: new Date().toISOString()
    };
    
    sessions.push(session);
    currentSession = null;
    saveData();
    updateUI();
}

// Export data
function exportData() {
    const data = {
        sessions: sessions,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Clear all data
function clearData() {
    if (confirm('Are you sure you want to clear all attendance data? This cannot be undone!')) {
        sessions = [];
        currentSession = null;
        localStorage.clear();
        updateUI();
    }
}

// Event listeners
tapInBtn.addEventListener('click', tapIn);
tapOutBtn.addEventListener('click', tapOut);
clearDataBtn.addEventListener('click', clearData);
exportBtn.addEventListener('click', exportData);

// Update UI every second if tapped in
setInterval(() => {
    if (currentSession) {
        updateUI();
    }
}, 1000);

// Initialize
loadData();
updateUI();
