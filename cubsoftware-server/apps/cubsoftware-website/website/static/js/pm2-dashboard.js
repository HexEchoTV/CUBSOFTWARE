// PM2 Dashboard - Real-time Process Monitor
(function() {
    'use strict';

    // State
    let processes = [];
    let refreshInterval = null;
    let refreshRate = 5000;
    let selectedProcess = null;
    let logsBuffer = [];
    let isConnected = true;
    let lastLogTimestamp = null;
    let autoScrollLogs = true;

    // DOM Elements
    const processesGrid = document.getElementById('processesGrid');
    const processSelect = document.getElementById('processSelect');
    const logType = document.getElementById('logType');
    const logsContainer = document.getElementById('logsContainer');
    const refreshBtn = document.getElementById('refreshBtn');
    const clearLogsBtn = document.getElementById('clearLogsBtn');
    const autoRefreshCheckbox = document.getElementById('autoRefresh');
    const refreshRateSelect = document.getElementById('refreshRate');
    const autoScrollCheckbox = document.getElementById('autoScrollLogs');
    const lastUpdateSpan = document.getElementById('lastUpdate');
    const statusDot = document.getElementById('statusDot');
    const toast = document.getElementById('toast');
    const whitelistPanel = document.getElementById('whitelistPanel');
    const whitelistList = document.getElementById('whitelistList');
    const newUserIdInput = document.getElementById('newUserId');

    // Initialize
    function init() {
        loadProcesses();
        setupEventListeners();
        startAutoRefresh();
    }

    // Event Listeners
    function setupEventListeners() {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.classList.add('spinning');
            loadProcesses().then(() => {
                setTimeout(() => refreshBtn.classList.remove('spinning'), 500);
            });
        });

        autoRefreshCheckbox.addEventListener('change', () => {
            if (autoRefreshCheckbox.checked) {
                startAutoRefresh();
            } else {
                stopAutoRefresh();
            }
        });

        refreshRateSelect.addEventListener('change', () => {
            refreshRate = parseInt(refreshRateSelect.value);
            if (autoRefreshCheckbox.checked) {
                startAutoRefresh();
            }
        });

        autoScrollCheckbox.addEventListener('change', () => {
            autoScrollLogs = autoScrollCheckbox.checked;
        });

        processSelect.addEventListener('change', () => {
            selectedProcess = processSelect.value;
            logsBuffer = [];
            lastLogTimestamp = null;
            if (selectedProcess) {
                loadLogs();
            } else {
                logsContainer.innerHTML = '<div class="logs-placeholder">Select a process to view logs</div>';
            }
        });

        logType.addEventListener('change', () => {
            logsBuffer = [];
            lastLogTimestamp = null;
            if (selectedProcess) {
                loadLogs();
            }
        });

        clearLogsBtn.addEventListener('click', () => {
            logsBuffer = [];
            logsContainer.innerHTML = '<div class="logs-placeholder">Logs cleared</div>';
        });

        // Enter key on whitelist input
        newUserIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addToWhitelist();
            }
        });
    }

    // Auto Refresh
    function startAutoRefresh() {
        stopAutoRefresh();
        refreshInterval = setInterval(() => {
            loadProcesses();
            if (selectedProcess) {
                loadLogs(true);
            }
        }, refreshRate);
    }

    function stopAutoRefresh() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    }

    // Load Processes
    async function loadProcesses() {
        try {
            const response = await fetch('/api/pm2/processes');
            if (!response.ok) throw new Error('Failed to fetch processes');

            const data = await response.json();
            processes = data.processes || [];
            isConnected = true;
            statusDot.classList.remove('disconnected');

            renderProcesses();
            updateProcessSelect();
            updateLastUpdate();
            renderSystemStats(data.system || {});

        } catch (error) {
            console.error('Error loading processes:', error);
            isConnected = false;
            statusDot.classList.add('disconnected');
            showToast('Connection error - retrying...', 'error');
        }
    }

    // Render System Stats
    function renderSystemStats(system) {
        let statsHtml = document.querySelector('.system-stats');
        if (!statsHtml) {
            const container = document.querySelector('.dashboard-controls');
            statsHtml = document.createElement('div');
            statsHtml.className = 'system-stats';
            container.parentNode.insertBefore(statsHtml, container);
        }

        const cpuPercent = system.cpu || 0;
        const memPercent = system.memory || 0;
        const totalProcesses = processes.length;
        const onlineProcesses = processes.filter(p => p.status === 'online').length;

        // Calculate total CPU and memory from all processes
        const totalProcCpu = processes.reduce((sum, p) => sum + (p.cpu || 0), 0);
        const totalProcMem = processes.reduce((sum, p) => sum + (p.memory || 0), 0);

        statsHtml.innerHTML = `
            <div class="system-stat-card">
                <div class="system-stat-header">
                    <span class="system-stat-label">System CPU</span>
                    <svg class="system-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                        <rect x="9" y="9" width="6" height="6"></rect>
                        <line x1="9" y1="1" x2="9" y2="4"></line>
                        <line x1="15" y1="1" x2="15" y2="4"></line>
                        <line x1="9" y1="20" x2="9" y2="23"></line>
                        <line x1="15" y1="20" x2="15" y2="23"></line>
                        <line x1="20" y1="9" x2="23" y2="9"></line>
                        <line x1="20" y1="14" x2="23" y2="14"></line>
                        <line x1="1" y1="9" x2="4" y2="9"></line>
                        <line x1="1" y1="14" x2="4" y2="14"></line>
                    </svg>
                </div>
                <div class="system-stat-value">${cpuPercent.toFixed(1)}%</div>
                <div class="system-stat-bar">
                    <div class="system-stat-bar-fill cpu" style="width: ${Math.min(cpuPercent, 100)}%"></div>
                </div>
            </div>
            <div class="system-stat-card">
                <div class="system-stat-header">
                    <span class="system-stat-label">System Memory</span>
                    <svg class="system-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 19v-3"></path>
                        <path d="M10 19v-6"></path>
                        <path d="M14 19v-9"></path>
                        <path d="M18 19v-12"></path>
                    </svg>
                </div>
                <div class="system-stat-value">${memPercent.toFixed(1)}%</div>
                <div class="system-stat-bar">
                    <div class="system-stat-bar-fill memory" style="width: ${Math.min(memPercent, 100)}%"></div>
                </div>
            </div>
            <div class="system-stat-card">
                <div class="system-stat-header">
                    <span class="system-stat-label">PM2 CPU Usage</span>
                    <svg class="system-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                </div>
                <div class="system-stat-value">${totalProcCpu.toFixed(1)}%</div>
                <div class="system-stat-bar">
                    <div class="system-stat-bar-fill cpu" style="width: ${Math.min(totalProcCpu, 100)}%"></div>
                </div>
            </div>
            <div class="system-stat-card">
                <div class="system-stat-header">
                    <span class="system-stat-label">PM2 Memory</span>
                    <svg class="system-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                        <line x1="6" y1="6" x2="6.01" y2="6"></line>
                        <line x1="6" y1="18" x2="6.01" y2="18"></line>
                    </svg>
                </div>
                <div class="system-stat-value">${formatBytes(totalProcMem)}</div>
            </div>
            <div class="system-stat-card">
                <div class="system-stat-header">
                    <span class="system-stat-label">Processes</span>
                    <svg class="system-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                </div>
                <div class="system-stat-value">${onlineProcesses}/${totalProcesses}</div>
                <div class="system-stat-bar">
                    <div class="system-stat-bar-fill memory" style="width: ${totalProcesses > 0 ? (onlineProcesses / totalProcesses * 100) : 0}%"></div>
                </div>
            </div>
            <div class="system-stat-card">
                <div class="system-stat-header">
                    <span class="system-stat-label">Status</span>
                    <div class="live-indicator">
                        <span class="live-dot"></span>
                        LIVE
                    </div>
                </div>
                <div class="system-stat-value" style="font-size: 1.2rem; color: ${isConnected ? '#22c55e' : '#ef4444'}">
                    ${isConnected ? 'Connected' : 'Disconnected'}
                </div>
            </div>
        `;
    }

    // Render Processes
    function renderProcesses() {
        if (processes.length === 0) {
            processesGrid.innerHTML = '<div class="loading">No processes found</div>';
            return;
        }

        processesGrid.innerHTML = processes.map(proc => `
            <div class="process-card status-${proc.status}">
                <div class="process-header">
                    <div class="process-info">
                        <div class="process-name">${escapeHtml(proc.name)}</div>
                        <div class="process-id">PID: ${proc.pid || 'N/A'} | PM2 ID: ${proc.pm_id}</div>
                    </div>
                    <div class="process-status ${proc.status}">
                        <span class="status-icon"></span>
                        ${proc.status}
                    </div>
                </div>
                <div class="process-metrics">
                    <div class="metric">
                        <div class="metric-label">CPU</div>
                        <div class="metric-value cpu">${(proc.cpu || 0).toFixed(1)}%</div>
                        <div class="metric-bar">
                            <div class="metric-bar-fill cpu" style="width: ${Math.min(proc.cpu || 0, 100)}%"></div>
                        </div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Memory</div>
                        <div class="metric-value memory">${formatBytes(proc.memory || 0)}</div>
                        <div class="metric-bar">
                            <div class="metric-bar-fill memory" style="width: ${Math.min((proc.memory || 0) / 1024 / 1024 / 5, 100)}%"></div>
                        </div>
                    </div>
                </div>
                <div class="process-details">
                    <div class="detail-item">
                        <span class="detail-label">Uptime</span>
                        <span class="detail-value">${formatUptime(proc.uptime)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Restarts</span>
                        <span class="detail-value">${proc.restarts || 0}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Mode</span>
                        <span class="detail-value">${proc.exec_mode || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Instances</span>
                        <span class="detail-value">${proc.instances || 1}</span>
                    </div>
                </div>
                <div class="process-actions">
                    ${proc.status === 'online' ? `
                        <button class="restart" onclick="restartProcess('${proc.name}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                            </svg>
                            Restart
                        </button>
                        <button class="stop" onclick="stopProcess('${proc.name}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="6" y="6" width="12" height="12"></rect>
                            </svg>
                            Stop
                        </button>
                    ` : `
                        <button class="start" onclick="startProcess('${proc.name}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            Start
                        </button>
                        <button class="restart" onclick="restartProcess('${proc.name}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                            </svg>
                            Restart
                        </button>
                    `}
                    <button onclick="viewLogs('${proc.name}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                        </svg>
                        Logs
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Update Process Select
    function updateProcessSelect() {
        const currentValue = processSelect.value;
        processSelect.innerHTML = '<option value="">Select a process...</option>' +
            processes.map(proc => `<option value="${proc.name}" ${proc.name === currentValue ? 'selected' : ''}>${proc.name}</option>`).join('');
    }

    // Load Logs
    async function loadLogs(append = false) {
        if (!selectedProcess) return;

        try {
            const type = logType.value;
            const params = new URLSearchParams({
                lines: 200,
                type: type
            });

            const response = await fetch(`/api/pm2/logs/${selectedProcess}?${params}`);
            if (!response.ok) throw new Error('Failed to fetch logs');

            const data = await response.json();

            if (append && logsBuffer.length > 0) {
                // Check for new logs
                const newLogs = data.logs.filter(log => {
                    const logKey = log.timestamp + log.content;
                    return !logsBuffer.some(existing => existing.timestamp + existing.content === logKey);
                });

                if (newLogs.length > 0) {
                    logsBuffer.push(...newLogs);
                    if (logsBuffer.length > 1000) {
                        logsBuffer = logsBuffer.slice(-1000);
                    }
                }
            } else {
                logsBuffer = data.logs || [];
            }

            renderLogs();

        } catch (error) {
            console.error('Error loading logs:', error);
        }
    }

    // Render Logs
    function renderLogs() {
        if (logsBuffer.length === 0) {
            logsContainer.innerHTML = '<div class="logs-placeholder">No logs available</div>';
            return;
        }

        const wasAtBottom = logsContainer.scrollTop + logsContainer.clientHeight >= logsContainer.scrollHeight - 50;

        logsContainer.innerHTML = logsBuffer.map(log => {
            const logClass = getLogClass(log.content);
            return `<div class="log-line ${logClass}">
                <span class="timestamp">${escapeHtml(log.timestamp || '')}</span>
                <span class="content">${escapeHtml(log.content)}</span>
            </div>`;
        }).join('');

        // Auto-scroll to bottom if enabled and user was at bottom
        if (autoScrollLogs && wasAtBottom) {
            logsContainer.scrollTop = logsContainer.scrollHeight;
        }
    }

    // Get log class based on content
    function getLogClass(content) {
        const lower = content.toLowerCase();
        if (lower.includes('error') || lower.includes('exception') || lower.includes('fail') || lower.includes('fatal')) {
            return 'error';
        }
        if (lower.includes('warn')) {
            return 'warn';
        }
        if (lower.includes('info') || lower.includes('debug')) {
            return 'info';
        }
        return '';
    }

    // Update last update time
    function updateLastUpdate() {
        const now = new Date();
        lastUpdateSpan.textContent = `Last updated: ${now.toLocaleTimeString()}`;
    }

    // Process Actions
    window.startProcess = async function(name) {
        try {
            showToast(`Starting ${name}...`, '');
            const response = await fetch(`/api/pm2/start/${name}`, { method: 'POST' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to start process');
            showToast(`${name} started successfully`, 'success');
            loadProcesses();
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    };

    window.stopProcess = async function(name) {
        if (!confirm(`Are you sure you want to stop ${name}?`)) return;
        try {
            showToast(`Stopping ${name}...`, '');
            const response = await fetch(`/api/pm2/stop/${name}`, { method: 'POST' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to stop process');
            showToast(`${name} stopped successfully`, 'success');
            loadProcesses();
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    };

    window.restartProcess = async function(name) {
        try {
            showToast(`Restarting ${name}...`, '');
            const response = await fetch(`/api/pm2/restart/${name}`, { method: 'POST' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to restart process');
            showToast(`${name} restarted successfully`, 'success');
            loadProcesses();
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    };

    window.viewLogs = function(name) {
        processSelect.value = name;
        selectedProcess = name;
        logsBuffer = [];
        loadLogs();
        document.querySelector('.logs-section').scrollIntoView({ behavior: 'smooth' });
    };

    // Whitelist Management
    window.toggleWhitelistPanel = function() {
        const isVisible = whitelistPanel.style.display !== 'none';
        whitelistPanel.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            loadWhitelist();
        }
    };

    async function loadWhitelist() {
        try {
            const response = await fetch('/api/pm2/whitelist');
            if (!response.ok) throw new Error('Failed to load whitelist');

            const data = await response.json();
            renderWhitelist(data.allowed_users || []);
        } catch (error) {
            whitelistList.innerHTML = `<div class="loading" style="color: #ef4444;">Error loading whitelist</div>`;
        }
    }

    function renderWhitelist(users) {
        if (users.length === 0) {
            whitelistList.innerHTML = '<div class="loading">No users in whitelist</div>';
            return;
        }

        whitelistList.innerHTML = users.map(userId => `
            <div class="whitelist-item">
                <div class="whitelist-user">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>${userId}</span>
                </div>
                <button class="whitelist-remove" onclick="removeFromWhitelist('${userId}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `).join('');
    }

    window.addToWhitelist = async function() {
        const userId = newUserIdInput.value.trim();
        if (!userId) {
            showToast('Please enter a Discord User ID', 'error');
            return;
        }

        if (!/^\d{17,19}$/.test(userId)) {
            showToast('Invalid Discord User ID format', 'error');
            return;
        }

        try {
            const response = await fetch('/api/pm2/whitelist/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to add user');

            showToast(data.message, 'success');
            newUserIdInput.value = '';
            loadWhitelist();
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    };

    window.removeFromWhitelist = async function(userId) {
        if (!confirm(`Remove user ${userId} from whitelist?`)) return;

        try {
            const response = await fetch('/api/pm2/whitelist/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to remove user');

            showToast(data.message, 'success');
            loadWhitelist();
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    };

    // Utilities
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function formatUptime(ms) {
        if (!ms || ms <= 0) return 'N/A';
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    function showToast(message, type = '') {
        toast.textContent = message;
        toast.className = 'toast show ' + type;
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Start
    document.addEventListener('DOMContentLoaded', init);
})();
