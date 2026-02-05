// Admin Dashboard - CUB SOFTWARE
(function() {
    'use strict';

    // ==================== STATE ====================
    let processes = [];
    let refreshInterval = null;
    let refreshRate = 5000;
    let selectedProcess = null;
    let logsBuffer = [];
    let lastLogTimestamp = null;
    let autoScrollLogs = true;
    let currentSection = 'processes';
    let currentReport = null;
    let currentLink = null;
    let ipBansTab = 'global';

    // ==================== DOM ELEMENTS ====================
    const elements = {
        // Sidebar
        sidebar: document.getElementById('adminSidebar'),
        sidebarOverlay: document.getElementById('sidebarOverlay'),
        mobileMenuBtn: document.getElementById('mobileMenuBtn'),
        navItems: document.querySelectorAll('.nav-item'),

        // Sections
        sections: document.querySelectorAll('.content-section'),

        // Processes
        processesGrid: document.getElementById('processesGrid'),
        processSelect: document.getElementById('processSelect'),
        refreshBtn: document.getElementById('refreshBtn'),
        autoRefreshCheckbox: document.getElementById('autoRefresh'),
        refreshRateSelect: document.getElementById('refreshRate'),
        statusDot: document.getElementById('statusDot'),
        lastUpdate: document.getElementById('lastUpdate'),

        // Logs
        logsContainer: document.getElementById('logsContainer'),
        logType: document.getElementById('logType'),
        autoScrollCheckbox: document.getElementById('autoScrollLogs'),
        clearLogsBtn: document.getElementById('clearLogsBtn'),

        // Reports
        reportsList: document.getElementById('reportsList'),
        reportStatusFilter: document.getElementById('reportStatusFilter'),
        refreshReportsBtn: document.getElementById('refreshReportsBtn'),
        reportModal: document.getElementById('reportModal'),
        reportModalBody: document.getElementById('reportModalBody'),
        reportsBadge: document.getElementById('reportsBadge'),
        pendingCount: document.getElementById('pendingCount'),
        investigatingCount: document.getElementById('investigatingCount'),
        resolvedCount: document.getElementById('resolvedCount'),
        closedCount: document.getElementById('closedCount'),

        // Links
        linksList: document.getElementById('linksList'),
        linkSearch: document.getElementById('linkSearch'),
        refreshLinksBtn: document.getElementById('refreshLinksBtn'),
        totalLinksCount: document.getElementById('totalLinksCount'),
        totalClicksCount: document.getElementById('totalClicksCount'),
        linkModal: document.getElementById('linkModal'),
        linkModalBody: document.getElementById('linkModalBody'),

        // Features
        featuresGrid: document.getElementById('featuresGrid'),
        refreshFeaturesBtn: document.getElementById('refreshFeaturesBtn'),

        // Whitelist
        whitelistList: document.getElementById('whitelistList'),
        newUserId: document.getElementById('newUserId'),

        // IP Bans
        ipbansList: document.getElementById('ipbansList'),
        refreshIpBansBtn: document.getElementById('refreshIpBansBtn'),
        banIpAddress: document.getElementById('banIpAddress'),
        banType: document.getElementById('banType'),
        banReason: document.getElementById('banReason'),
        tempBanIp: document.getElementById('tempBanIp'),
        tempBanDuration: document.getElementById('tempBanDuration'),
        tempBanReason: document.getElementById('tempBanReason'),

        // Toast
        toast: document.getElementById('toast')
    };

    // ==================== INITIALIZATION ====================
    function init() {
        setupNavigation();
        setupEventListeners();
        loadInitialData();
        startAutoRefresh();

        // Check URL hash for section
        const hash = window.location.hash.slice(1);
        if (hash && document.querySelector(`[data-section="${hash}"]`)) {
            switchSection(hash);
        }
    }

    // ==================== NAVIGATION ====================
    function setupNavigation() {
        // Sidebar navigation
        elements.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                switchSection(section);
                closeMobileSidebar();
            });
        });

        // Mobile menu
        elements.mobileMenuBtn?.addEventListener('click', toggleMobileSidebar);
        elements.sidebarOverlay?.addEventListener('click', closeMobileSidebar);

        // IP Bans tabs
        document.querySelectorAll('.ipbans-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.ipbans-tabs .tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                ipBansTab = btn.dataset.tab;
                loadIpBans();
            });
        });
    }

    function switchSection(section) {
        currentSection = section;

        // Update nav items
        elements.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });

        // Update sections
        elements.sections.forEach(sec => {
            sec.classList.toggle('active', sec.dataset.section === section);
        });

        // Update URL hash
        window.location.hash = section;

        // Load section data
        loadSectionData(section);
    }

    function toggleMobileSidebar() {
        elements.sidebar?.classList.toggle('active');
        elements.sidebarOverlay?.classList.toggle('active');
    }

    function closeMobileSidebar() {
        elements.sidebar?.classList.remove('active');
        elements.sidebarOverlay?.classList.remove('active');
    }

    // ==================== DATA LOADING ====================
    function loadInitialData() {
        loadProcesses();
        loadReports();
    }

    function loadSectionData(section) {
        switch (section) {
            case 'processes':
                loadProcesses();
                break;
            case 'logs':
                // Logs loaded on process select
                break;
            case 'reports':
                loadReports();
                break;
            case 'links':
                loadLinks();
                break;
            case 'features':
                loadFeatures();
                break;
            case 'whitelist':
                loadWhitelist();
                break;
            case 'ipbans':
                loadIpBans();
                break;
        }
    }

    // ==================== EVENT LISTENERS ====================
    function setupEventListeners() {
        // Processes
        elements.refreshBtn?.addEventListener('click', () => {
            elements.refreshBtn.classList.add('spinning');
            loadProcesses().then(() => {
                setTimeout(() => elements.refreshBtn.classList.remove('spinning'), 500);
            });
        });

        elements.autoRefreshCheckbox?.addEventListener('change', () => {
            if (elements.autoRefreshCheckbox.checked) {
                startAutoRefresh();
            } else {
                stopAutoRefresh();
            }
        });

        elements.refreshRateSelect?.addEventListener('change', () => {
            refreshRate = parseInt(elements.refreshRateSelect.value);
            if (elements.autoRefreshCheckbox?.checked) {
                startAutoRefresh();
            }
        });

        // Logs
        elements.processSelect?.addEventListener('change', () => {
            selectedProcess = elements.processSelect.value;
            logsBuffer = [];
            lastLogTimestamp = null;
            if (selectedProcess) {
                loadLogs();
            } else {
                elements.logsContainer.innerHTML = '<div class="logs-placeholder">Select a process to view logs</div>';
            }
        });

        elements.logType?.addEventListener('change', () => {
            logsBuffer = [];
            lastLogTimestamp = null;
            if (selectedProcess) loadLogs();
        });

        elements.autoScrollCheckbox?.addEventListener('change', () => {
            autoScrollLogs = elements.autoScrollCheckbox.checked;
        });

        elements.clearLogsBtn?.addEventListener('click', () => {
            logsBuffer = [];
            elements.logsContainer.innerHTML = '<div class="logs-placeholder">Logs cleared</div>';
        });

        // Reports
        elements.refreshReportsBtn?.addEventListener('click', loadReports);
        elements.reportStatusFilter?.addEventListener('change', loadReports);

        // Links
        elements.refreshLinksBtn?.addEventListener('click', loadLinks);
        elements.linkSearch?.addEventListener('input', debounce(loadLinks, 300));

        // Features
        elements.refreshFeaturesBtn?.addEventListener('click', loadFeatures);

        // Whitelist
        elements.newUserId?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addToWhitelist();
        });

        // IP Bans
        elements.refreshIpBansBtn?.addEventListener('click', loadIpBans);
    }

    // ==================== AUTO REFRESH ====================
    function startAutoRefresh() {
        stopAutoRefresh();
        refreshInterval = setInterval(() => {
            if (currentSection === 'processes') {
                loadProcesses();
            }
            if (selectedProcess && currentSection === 'logs') {
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

    // ==================== PROCESSES ====================
    async function loadProcesses() {
        try {
            const response = await fetch('/api/pm2/processes');
            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();
            processes = data.processes || [];

            elements.statusDot?.classList.remove('error');
            renderProcesses();
            updateProcessSelect();
            updateLastUpdate();

        } catch (error) {
            console.error('Error loading processes:', error);
            elements.statusDot?.classList.add('error');
            showToast('Connection error', 'error');
        }
    }

    function renderProcesses() {
        if (!elements.processesGrid) return;

        if (processes.length === 0) {
            elements.processesGrid.innerHTML = '<div class="loading">No processes found</div>';
            return;
        }

        elements.processesGrid.innerHTML = processes.map(proc => `
            <div class="process-card">
                <div class="process-header">
                    <span class="process-name">${escapeHtml(proc.name)}</span>
                    <span class="process-status ${proc.status}">${proc.status}</span>
                </div>
                <div class="process-stats">
                    <div class="stat-item">
                        <span class="stat-label">CPU</span>
                        <span class="stat-value">${(proc.cpu || 0).toFixed(1)}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Memory</span>
                        <span class="stat-value">${formatBytes(proc.memory || 0)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Uptime</span>
                        <span class="stat-value">${formatUptime(proc.uptime)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Restarts</span>
                        <span class="stat-value">${proc.restarts || 0}</span>
                    </div>
                </div>
                <div class="process-actions">
                    <button class="restart" onclick="restartProcess('${proc.name}')">Restart</button>
                    ${proc.status === 'online'
                        ? `<button class="stop" onclick="stopProcess('${proc.name}')">Stop</button>`
                        : `<button class="start" onclick="startProcess('${proc.name}')">Start</button>`
                    }
                </div>
            </div>
        `).join('');
    }

    function updateProcessSelect() {
        if (!elements.processSelect) return;

        const current = elements.processSelect.value;
        elements.processSelect.innerHTML = '<option value="">Select a process...</option>' +
            processes.map(p => `<option value="${p.name}" ${p.name === current ? 'selected' : ''}>${p.name}</option>`).join('');
    }

    function updateLastUpdate() {
        if (elements.lastUpdate) {
            elements.lastUpdate.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
        }
    }

    // Process actions
    window.restartProcess = async function(name) {
        try {
            const res = await fetch(`/api/pm2/restart/${name}`, { method: 'POST' });
            if (res.ok) {
                showToast(`Restarting ${name}...`, 'success');
                setTimeout(loadProcesses, 1000);
            } else {
                throw new Error('Failed');
            }
        } catch (e) {
            showToast(`Failed to restart ${name}`, 'error');
        }
    };

    window.stopProcess = async function(name) {
        try {
            const res = await fetch(`/api/pm2/stop/${name}`, { method: 'POST' });
            if (res.ok) {
                showToast(`Stopping ${name}...`, 'success');
                setTimeout(loadProcesses, 1000);
            } else {
                throw new Error('Failed');
            }
        } catch (e) {
            showToast(`Failed to stop ${name}`, 'error');
        }
    };

    window.startProcess = async function(name) {
        try {
            const res = await fetch(`/api/pm2/start/${name}`, { method: 'POST' });
            if (res.ok) {
                showToast(`Starting ${name}...`, 'success');
                setTimeout(loadProcesses, 1000);
            } else {
                throw new Error('Failed');
            }
        } catch (e) {
            showToast(`Failed to start ${name}`, 'error');
        }
    };

    // ==================== LOGS ====================
    async function loadLogs(append = false) {
        if (!selectedProcess || !elements.logsContainer) return;

        try {
            const type = elements.logType?.value || 'out';
            let url = `/api/pm2/logs/${selectedProcess}?type=${type}&lines=100`;
            if (append && lastLogTimestamp) {
                url += `&since=${lastLogTimestamp}`;
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed');

            const data = await res.json();
            const lines = data.logs || [];

            if (!append) {
                logsBuffer = lines;
            } else {
                logsBuffer = [...logsBuffer, ...lines].slice(-500);
            }

            if (lines.length > 0) {
                lastLogTimestamp = Date.now();
            }

            renderLogs();

        } catch (e) {
            console.error('Error loading logs:', e);
        }
    }

    function renderLogs() {
        if (!elements.logsContainer) return;

        if (logsBuffer.length === 0) {
            elements.logsContainer.innerHTML = '<div class="logs-placeholder">No logs available</div>';
            return;
        }

        elements.logsContainer.innerHTML = logsBuffer.map(line => {
            const isError = /error|fail|exception/i.test(line);
            const isWarn = /warn|warning/i.test(line);
            const className = isError ? 'error' : (isWarn ? 'warn' : '');
            return `<div class="log-line ${className}"><span class="log-content">${escapeHtml(line)}</span></div>`;
        }).join('');

        if (autoScrollLogs) {
            elements.logsContainer.scrollTop = elements.logsContainer.scrollHeight;
        }
    }

    // ==================== REPORTS ====================
    async function loadReports() {
        if (!elements.reportsList) return;

        try {
            const status = elements.reportStatusFilter?.value || 'all';
            const res = await fetch(`/api/reports?status=${status}`);
            if (!res.ok) throw new Error('Failed');

            const data = await res.json();
            const reports = data.reports || [];
            const stats = data.stats || {};

            // Update stats
            if (elements.pendingCount) elements.pendingCount.textContent = stats.pending || 0;
            if (elements.investigatingCount) elements.investigatingCount.textContent = stats.investigating || 0;
            if (elements.resolvedCount) elements.resolvedCount.textContent = stats.resolved || 0;
            if (elements.closedCount) elements.closedCount.textContent = stats.closed || 0;

            // Update badge
            if (elements.reportsBadge) {
                const pending = stats.pending || 0;
                if (pending > 0) {
                    elements.reportsBadge.textContent = pending;
                    elements.reportsBadge.style.display = 'inline';
                } else {
                    elements.reportsBadge.style.display = 'none';
                }
            }

            renderReports(reports);

        } catch (e) {
            console.error('Error loading reports:', e);
            elements.reportsList.innerHTML = '<div class="loading">Failed to load reports</div>';
        }
    }

    function renderReports(reports) {
        if (reports.length === 0) {
            elements.reportsList.innerHTML = '<div class="empty-state">No reports found</div>';
            return;
        }

        elements.reportsList.innerHTML = reports.map(r => `
            <div class="report-item" onclick="openReportModal('${r.id}')">
                <div class="report-type"><span>${r.type || 'general'}</span></div>
                <div class="report-info">
                    <div class="report-subject">${escapeHtml(r.subject || 'No subject')}</div>
                    <div class="report-meta">${formatDate(r.timestamp)} &bull; ${escapeHtml(r.contact || 'Anonymous')}</div>
                </div>
                <span class="report-status ${r.status}">${r.status}</span>
            </div>
        `).join('');
    }

    window.openReportModal = async function(reportId) {
        try {
            const res = await fetch(`/api/reports/${reportId}`);
            if (!res.ok) throw new Error('Failed');

            const report = await res.json();
            currentReport = report;

            elements.reportModalBody.innerHTML = `
                <div class="report-detail-grid">
                    <div class="report-field">
                        <label>Report ID</label>
                        <div class="value mono">${report.id}</div>
                    </div>
                    <div class="report-field">
                        <label>Type</label>
                        <div class="value">${report.type || 'General'}</div>
                    </div>
                    <div class="report-field">
                        <label>Status</label>
                        <div class="value"><span class="report-status ${report.status}">${report.status}</span></div>
                    </div>
                    <div class="report-field">
                        <label>Date</label>
                        <div class="value">${formatDate(report.timestamp)}</div>
                    </div>
                    <div class="report-field full-width">
                        <label>Subject</label>
                        <div class="value">${escapeHtml(report.subject || 'N/A')}</div>
                    </div>
                    <div class="report-field full-width">
                        <label>Description</label>
                        <div class="value">${escapeHtml(report.description || 'N/A')}</div>
                    </div>
                    <div class="report-field full-width">
                        <label>URL</label>
                        <div class="value mono">${escapeHtml(report.url || 'N/A')}</div>
                    </div>
                    <div class="report-field">
                        <label>Contact</label>
                        <div class="value">${escapeHtml(report.contact || 'Anonymous')}</div>
                    </div>
                    <div class="report-field">
                        <label>IP Address</label>
                        <div class="value mono">${report.ip || 'Unknown'}</div>
                    </div>
                    <div class="report-field full-width">
                        <label>User Agent</label>
                        <div class="value mono" style="font-size: 0.8rem;">${escapeHtml(report.user_agent || 'Unknown')}</div>
                    </div>
                    <div class="report-field">
                        <label>Fingerprint</label>
                        <div class="value mono">${report.fingerprint || 'N/A'}</div>
                    </div>
                </div>
            `;

            elements.reportModal.style.display = 'flex';

        } catch (e) {
            showToast('Failed to load report', 'error');
        }
    };

    window.closeReportModal = function() {
        elements.reportModal.style.display = 'none';
        currentReport = null;
    };

    window.updateReportStatus = async function(status) {
        if (!currentReport) return;

        try {
            const res = await fetch(`/api/reports/${currentReport.id}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                showToast(`Report marked as ${status}`, 'success');
                closeReportModal();
                loadReports();
            } else {
                throw new Error('Failed');
            }
        } catch (e) {
            showToast('Failed to update report', 'error');
        }
    };

    window.deleteReport = async function() {
        if (!currentReport || !confirm('Delete this report?')) return;

        try {
            const res = await fetch(`/api/reports/${currentReport.id}/delete`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Report deleted', 'success');
                closeReportModal();
                loadReports();
            } else {
                throw new Error('Failed');
            }
        } catch (e) {
            showToast('Failed to delete report', 'error');
        }
    };

    // ==================== LINKS ====================
    async function loadLinks() {
        if (!elements.linksList) return;

        try {
            const search = elements.linkSearch?.value || '';
            const res = await fetch(`/api/admin/links?search=${encodeURIComponent(search)}&limit=50`);
            if (!res.ok) throw new Error('Failed');

            const data = await res.json();
            const links = data.links || [];

            if (elements.totalLinksCount) elements.totalLinksCount.textContent = data.total || 0;
            if (elements.totalClicksCount) elements.totalClicksCount.textContent = data.totalClicks || 0;

            renderLinks(links);

        } catch (e) {
            console.error('Error loading links:', e);
            elements.linksList.innerHTML = '<div class="loading">Failed to load links</div>';
        }
    }

    function renderLinks(links) {
        if (links.length === 0) {
            elements.linksList.innerHTML = '<div class="empty-state">No links found</div>';
            return;
        }

        elements.linksList.innerHTML = links.map(l => `
            <div class="link-item" onclick="openLinkModal('${l.code}')">
                <span class="link-code">${l.code}</span>
                <span class="link-url">${escapeHtml(l.url)}</span>
                <div class="link-stats">
                    <span class="link-stat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                        ${l.clicks || 0}
                    </span>
                </div>
            </div>
        `).join('');
    }

    window.openLinkModal = async function(code) {
        try {
            const res = await fetch(`/api/admin/links/${code}`);
            if (!res.ok) throw new Error('Failed');

            const link = await res.json();
            currentLink = link;

            elements.linkModalBody.innerHTML = `
                <div class="report-detail-grid">
                    <div class="report-field">
                        <label>Short Code</label>
                        <div class="value mono">${link.code}</div>
                    </div>
                    <div class="report-field">
                        <label>Clicks</label>
                        <div class="value">${link.clicks || 0}</div>
                    </div>
                    <div class="report-field full-width">
                        <label>Destination URL</label>
                        <div class="value mono" style="word-break: break-all;">${escapeHtml(link.url)}</div>
                    </div>
                    <div class="report-field">
                        <label>Created</label>
                        <div class="value">${formatDate(link.created * 1000)}</div>
                    </div>
                    <div class="report-field">
                        <label>Creator IP</label>
                        <div class="value mono">${link.ip || 'Unknown'}</div>
                    </div>
                </div>
            `;

            elements.linkModal.style.display = 'flex';

        } catch (e) {
            showToast('Failed to load link details', 'error');
        }
    };

    window.closeLinkModal = function() {
        elements.linkModal.style.display = 'none';
        currentLink = null;
    };

    window.deleteLink = async function() {
        if (!currentLink || !confirm('Delete this link?')) return;

        try {
            const res = await fetch(`/api/admin/links/${currentLink.code}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Link deleted', 'success');
                closeLinkModal();
                loadLinks();
            } else {
                throw new Error('Failed');
            }
        } catch (e) {
            showToast('Failed to delete link', 'error');
        }
    };

    window.banLinkCreator = async function() {
        if (!currentLink?.ip) return;

        elements.banIpAddress.value = currentLink.ip;
        elements.banType.value = 'links';
        elements.banReason.value = 'Suspicious link activity';

        closeLinkModal();
        switchSection('ipbans');
    };

    // ==================== FEATURES ====================
    async function loadFeatures() {
        if (!elements.featuresGrid) return;

        try {
            const res = await fetch('/api/admin/features');
            if (!res.ok) throw new Error('Failed');

            const data = await res.json();
            renderFeatures(data.features || [], data.disabled || []);

        } catch (e) {
            console.error('Error loading features:', e);
            elements.featuresGrid.innerHTML = '<div class="loading">Failed to load features</div>';
        }
    }

    function renderFeatures(features, disabled) {
        const allFeatures = [
            'social-media-saver', 'file-converter', 'pdf-tools', 'image-editor',
            'qr-generator', 'link-shortener', 'color-picker', 'text-tools',
            'unit-converter', 'json-formatter', 'timestamp-converter', 'video-compressor',
            'resume-builder', 'countdown-maker', 'random-picker', 'wheel-spinner',
            'calculator-suite', 'password-generator', 'timer-tools', 'world-clock',
            'currency-converter', 'sticky-board', 'encoding-tools', 'diff-checker',
            'regex-tester', 'code-minifier', 'markdown-editor', 'notepad',
            'invoice-generator', 'audio-trimmer'
        ];

        elements.featuresGrid.innerHTML = allFeatures.map(f => {
            const isEnabled = !disabled.includes(f);
            return `
                <div class="feature-card">
                    <div class="feature-info">
                        <div class="feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                                <polyline points="2 17 12 22 22 17"></polyline>
                                <polyline points="2 12 12 17 22 12"></polyline>
                            </svg>
                        </div>
                        <span class="feature-name">${f.replace(/-/g, ' ')}</span>
                    </div>
                    <div class="feature-toggle ${isEnabled ? 'enabled' : ''}" onclick="toggleFeature('${f}', ${!isEnabled})"></div>
                </div>
            `;
        }).join('');
    }

    window.toggleFeature = async function(feature, enable) {
        try {
            const action = enable ? 'enable' : 'disable';
            const res = await fetch(`/api/admin/features/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feature })
            });

            if (res.ok) {
                showToast(`${feature} ${enable ? 'enabled' : 'disabled'}`, 'success');
                loadFeatures();
            } else {
                throw new Error('Failed');
            }
        } catch (e) {
            showToast('Failed to update feature', 'error');
        }
    };

    // ==================== WHITELIST ====================
    async function loadWhitelist() {
        if (!elements.whitelistList) return;

        try {
            const res = await fetch('/api/pm2/bot/whitelist');
            if (!res.ok) throw new Error('Failed');

            const data = await res.json();
            const users = data.allowed_users || [];

            if (users.length === 0) {
                elements.whitelistList.innerHTML = '<div class="empty-state">No users whitelisted</div>';
                return;
            }

            elements.whitelistList.innerHTML = users.map(id => `
                <div class="whitelist-user">
                    <span class="whitelist-user-id">${id}</span>
                    <button class="whitelist-remove" onclick="removeFromWhitelist('${id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            `).join('');

        } catch (e) {
            console.error('Error loading whitelist:', e);
            elements.whitelistList.innerHTML = '<div class="loading">Failed to load whitelist</div>';
        }
    }

    window.addToWhitelist = async function() {
        const userId = elements.newUserId?.value?.trim();
        if (!userId) {
            showToast('Please enter a user ID', 'error');
            return;
        }

        try {
            const res = await fetch('/api/pm2/bot/whitelist/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });

            if (res.ok) {
                showToast('User added to whitelist', 'success');
                elements.newUserId.value = '';
                loadWhitelist();
            } else {
                throw new Error('Failed');
            }
        } catch (e) {
            showToast('Failed to add user', 'error');
        }
    };

    window.removeFromWhitelist = async function(userId) {
        if (!confirm(`Remove ${userId} from whitelist?`)) return;

        try {
            const res = await fetch('/api/pm2/bot/whitelist/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });

            if (res.ok) {
                showToast('User removed from whitelist', 'success');
                loadWhitelist();
            } else {
                throw new Error('Failed');
            }
        } catch (e) {
            showToast('Failed to remove user', 'error');
        }
    };

    // ==================== IP BANS ====================
    async function loadIpBans() {
        if (!elements.ipbansList) return;

        try {
            const res = await fetch('/api/admin/ipbans');
            if (!res.ok) throw new Error('Failed');

            const data = await res.json();
            renderIpBans(data);

        } catch (e) {
            console.error('Error loading IP bans:', e);
            elements.ipbansList.innerHTML = '<div class="loading">Failed to load IP bans</div>';
        }
    }

    function renderIpBans(data) {
        let bans = [];

        if (ipBansTab === 'global') {
            bans = (data.global || []).map(b => ({ ...b, type: 'global' }));
        } else if (ipBansTab === 'feature') {
            Object.entries(data.features || {}).forEach(([feature, featureBans]) => {
                featureBans.forEach(b => bans.push({ ...b, type: 'feature', feature }));
            });
        } else if (ipBansTab === 'temp') {
            bans = (data.temp || []).filter(b => b.expires > Date.now()).map(b => ({ ...b, type: 'temp' }));
        }

        if (bans.length === 0) {
            elements.ipbansList.innerHTML = '<div class="empty-state">No bans in this category</div>';
            return;
        }

        elements.ipbansList.innerHTML = bans.map(b => `
            <div class="ipban-item">
                <div class="ipban-info">
                    <span class="ipban-ip">${b.ip}</span>
                    <span class="ipban-meta">
                        ${b.reason || 'No reason'}
                        ${b.feature ? `(${b.feature})` : ''}
                        ${b.expires ? `- Expires: ${formatDate(b.expires)}` : ''}
                    </span>
                </div>
                <div class="ipban-actions">
                    <span class="ipban-type ${b.type}">${b.type}</span>
                    <button class="unban-btn" onclick="unbanIp('${b.ip}')">Unban</button>
                </div>
            </div>
        `).join('');
    }

    window.banIpAddress = async function() {
        const ip = elements.banIpAddress?.value?.trim();
        const type = elements.banType?.value || 'global';
        const reason = elements.banReason?.value?.trim() || 'No reason';

        if (!ip) {
            showToast('Please enter an IP address', 'error');
            return;
        }

        try {
            const res = await fetch('/api/admin/ipbans/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip, type, reason })
            });

            if (res.ok) {
                showToast(`IP ${ip} banned`, 'success');
                elements.banIpAddress.value = '';
                elements.banReason.value = '';
                loadIpBans();
            } else {
                throw new Error('Failed');
            }
        } catch (e) {
            showToast('Failed to ban IP', 'error');
        }
    };

    window.tempBanIp = async function() {
        const ip = elements.tempBanIp?.value?.trim();
        const duration = elements.tempBanDuration?.value?.trim();
        const reason = elements.tempBanReason?.value?.trim() || 'Temporary ban';

        if (!ip || !duration) {
            showToast('Please enter IP and duration', 'error');
            return;
        }

        try {
            const res = await fetch('/api/admin/ipbans/temp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip, duration, reason })
            });

            if (res.ok) {
                showToast(`IP ${ip} temporarily banned`, 'success');
                elements.tempBanIp.value = '';
                elements.tempBanDuration.value = '';
                elements.tempBanReason.value = '';
                loadIpBans();
            } else {
                throw new Error('Failed');
            }
        } catch (e) {
            showToast('Failed to temp ban IP', 'error');
        }
    };

    window.unbanIp = async function(ip) {
        if (!confirm(`Unban ${ip}?`)) return;

        try {
            const res = await fetch('/api/admin/ipbans/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip })
            });

            if (res.ok) {
                showToast(`IP ${ip} unbanned`, 'success');
                loadIpBans();
            } else {
                throw new Error('Failed');
            }
        } catch (e) {
            showToast('Failed to unban IP', 'error');
        }
    };

    // ==================== UTILITIES ====================
    function showToast(message, type = 'success') {
        if (!elements.toast) return;

        elements.toast.textContent = message;
        elements.toast.className = `toast show ${type}`;

        setTimeout(() => {
            elements.toast.classList.remove('show');
        }, 3000);
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
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
        if (!ms) return 'N/A';
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    function formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleString();
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
