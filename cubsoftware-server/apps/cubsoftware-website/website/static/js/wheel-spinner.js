// Wheel Spinner - CUB SOFTWARE
// A customizable spinning wheel for giveaways, decisions, and games

class WheelSpinner {
    constructor() {
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.entries = [];
        this.rotation = 0;
        this.isSpinning = false;
        this.spinDuration = 5000;
        this.soundEnabled = true;
        this.eliminateWinner = false;
        this.confettiEnabled = true;
        this.history = [];
        this.currentTheme = 'default';

        // Theme color palettes
        this.themes = {
            default: ['#5865f2', '#7c3aed', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4', '#8b5cf6', '#ef4444'],
            neon: ['#ff006e', '#00f5d4', '#fee440', '#9b5de5', '#00bbf9', '#f15bb5', '#00ff87', '#fb5607'],
            pastel: ['#ffc8dd', '#bde0fe', '#a2d2ff', '#cdb4db', '#ffd6a5', '#caffbf', '#9bf6ff', '#fdffb6'],
            rainbow: ['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#8000ff', '#ff00ff'],
            monochrome: ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#5865f2', '#7c3aed', '#4a5568', '#2d3748'],
            sunset: ['#ff6b6b', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#ff6b6b', '#feca57', '#48dbfb'],
            ocean: ['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8', '#023e8a', '#0096c7', '#48cae4', '#ade8f4'],
            forest: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2', '#b7e4c7', '#1b4332', '#081c15']
        };

        // Audio context for sounds
        this.audioCtx = null;
        this.tickSound = null;
        this.winSound = null;

        this.init();
    }

    init() {
        this.loadFromURL();
        this.bindEvents();
        this.loadFromStorage();
        this.draw();
        this.updateEntryCount();
        this.initAudio();
    }

    initAudio() {
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
        }
    }

    playTick() {
        if (!this.soundEnabled || !this.audioCtx) return;
        try {
            const oscillator = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.05);
            oscillator.start(this.audioCtx.currentTime);
            oscillator.stop(this.audioCtx.currentTime + 0.05);
        } catch (e) {}
    }

    playWinSound() {
        if (!this.soundEnabled || !this.audioCtx) return;
        try {
            const frequencies = [523.25, 659.25, 783.99, 1046.50];
            frequencies.forEach((freq, i) => {
                setTimeout(() => {
                    const oscillator = this.audioCtx.createOscillator();
                    const gainNode = this.audioCtx.createGain();
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioCtx.destination);
                    oscillator.frequency.value = freq;
                    oscillator.type = 'sine';
                    gainNode.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
                    oscillator.start(this.audioCtx.currentTime);
                    oscillator.stop(this.audioCtx.currentTime + 0.3);
                }, i * 100);
            });
        } catch (e) {}
    }

    bindEvents() {
        // Add entries button
        document.getElementById('addEntriesBtn').addEventListener('click', () => this.addEntries());
        document.getElementById('entriesInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) this.addEntries();
        });

        // Clear entries
        document.getElementById('clearEntriesBtn').addEventListener('click', () => this.clearEntries());

        // Spin button
        document.getElementById('spinBtn').addEventListener('click', () => this.spin());

        // Settings
        document.getElementById('themeSelect').addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });

        document.getElementById('durationSelect').addEventListener('change', (e) => {
            this.spinDuration = parseInt(e.target.value) * 1000;
            this.saveToStorage();
        });

        document.getElementById('eliminateWinner').addEventListener('click', (e) => {
            this.eliminateWinner = !this.eliminateWinner;
            e.target.classList.toggle('active', this.eliminateWinner);
            this.saveToStorage();
        });

        document.getElementById('confettiEnabled').addEventListener('click', (e) => {
            this.confettiEnabled = !this.confettiEnabled;
            e.target.classList.toggle('active', this.confettiEnabled);
            this.saveToStorage();
        });

        // Sound toggle
        document.getElementById('soundBtn').addEventListener('click', () => this.toggleSound());

        // Fullscreen
        document.getElementById('fullscreenBtn').addEventListener('click', () => this.toggleFullscreen());

        // History
        document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearHistory());

        // Share
        document.getElementById('copyLinkBtn').addEventListener('click', () => this.copyShareLink());
        document.getElementById('embedBtn').addEventListener('click', () => this.showEmbedModal());

        // Import/Export
        document.getElementById('importBtn').addEventListener('click', () => document.getElementById('csvInput').click());
        document.getElementById('csvInput').addEventListener('change', (e) => this.importCSV(e));
        document.getElementById('exportBtn').addEventListener('click', () => this.exportEntries());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isSpinning && document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                this.spin();
            }
            if (e.code === 'Escape') {
                document.body.classList.remove('fullscreen-mode');
                closeWinnerModal();
                closeEmbedModal();
            }
        });

        // Resume audio context on interaction
        document.addEventListener('click', () => {
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
        }, { once: true });
    }

    addEntries() {
        const input = document.getElementById('entriesInput');
        const text = input.value.trim();
        if (!text) return;

        const newEntries = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        newEntries.forEach(entry => {
            this.entries.push({
                name: entry,
                color: this.getColorForIndex(this.entries.length)
            });
        });

        input.value = '';
        this.renderEntryList();
        this.draw();
        this.updateEntryCount();
        this.saveToStorage();
        this.showToast(`Added ${newEntries.length} entries`);
    }

    getColorForIndex(index) {
        const colors = this.themes[this.currentTheme];
        return colors[index % colors.length];
    }

    updateColors() {
        this.entries.forEach((entry, index) => {
            entry.color = this.getColorForIndex(index);
        });
    }

    changeTheme(theme) {
        this.currentTheme = theme;
        // Update all entry colors with the new theme
        for (let i = 0; i < this.entries.length; i++) {
            this.entries[i].color = this.themes[theme][i % this.themes[theme].length];
        }
        this.renderEntryList();
        this.draw();
        this.saveToStorage();
        console.log(`Theme changed to: ${theme}, entries: ${this.entries.length}`);
    }

    renderEntryList() {
        const list = document.getElementById('entriesList');
        list.innerHTML = '';

        this.entries.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'entry-item';
            item.innerHTML = `
                <div class="entry-color" style="background: ${entry.color}"></div>
                <span class="entry-name">${this.escapeHtml(entry.name)}</span>
                <button class="entry-remove" onclick="wheel.removeEntry(${index})" title="Remove">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            `;
            list.appendChild(item);
        });
    }

    removeEntry(index) {
        this.entries.splice(index, 1);
        this.updateColors();
        this.renderEntryList();
        this.draw();
        this.updateEntryCount();
        this.saveToStorage();
    }

    clearEntries() {
        if (this.entries.length === 0) return;
        if (!confirm('Clear all entries?')) return;
        this.entries = [];
        this.renderEntryList();
        this.draw();
        this.updateEntryCount();
        this.saveToStorage();
        this.showToast('All entries cleared');
    }

    updateEntryCount() {
        document.querySelector('.entry-count').textContent = `${this.entries.length} entries`;
    }

    draw() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (this.entries.length === 0) {
            // Draw empty wheel
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#1a1a2e';
            ctx.fill();
            ctx.strokeStyle = '#5865f2';
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.fillStyle = '#666';
            ctx.font = '20px Poppins, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Add entries to spin!', centerX, centerY);
            return;
        }

        const sliceAngle = (2 * Math.PI) / this.entries.length;

        // Draw wheel segments
        this.entries.forEach((entry, index) => {
            const startAngle = this.rotation + index * sliceAngle;
            const endAngle = startAngle + sliceAngle;

            // Draw segment
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = entry.color;
            ctx.fill();

            // Draw segment border
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';

            // Determine text color based on background
            const brightness = this.getColorBrightness(entry.color);
            ctx.fillStyle = brightness > 128 ? '#000' : '#fff';

            // Adjust font size based on number of entries
            let fontSize = 16;
            if (this.entries.length > 12) fontSize = 12;
            if (this.entries.length > 20) fontSize = 10;
            ctx.font = `bold ${fontSize}px Poppins, sans-serif`;

            // Truncate text if too long
            const maxWidth = radius - 40;
            let text = entry.name;
            while (ctx.measureText(text).width > maxWidth && text.length > 3) {
                text = text.substring(0, text.length - 1);
            }
            if (text !== entry.name) text += '...';

            ctx.fillText(text, radius - 20, 0);
            ctx.restore();
        });

        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
        ctx.fillStyle = '#1a1a2e';
        ctx.fill();
        ctx.strokeStyle = '#5865f2';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw outer ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#5865f2';
        ctx.lineWidth = 6;
        ctx.stroke();
    }

    getColorBrightness(color) {
        // Convert hex to RGB and calculate brightness
        let r, g, b;
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            r = parseInt(hex.substr(0, 2), 16);
            g = parseInt(hex.substr(2, 2), 16);
            b = parseInt(hex.substr(4, 2), 16);
        } else {
            return 128; // Default for non-hex colors
        }
        return (r * 299 + g * 587 + b * 114) / 1000;
    }

    spin() {
        if (this.isSpinning || this.entries.length < 2) {
            if (this.entries.length < 2) {
                this.showToast('Add at least 2 entries to spin!', 'error');
            }
            return;
        }

        this.isSpinning = true;
        const spinBtn = document.getElementById('spinBtn');
        spinBtn.disabled = true;
        spinBtn.classList.add('spinning');
        spinBtn.textContent = 'SPINNING...';

        // Random number of full rotations (5-10) plus random position
        const fullRotations = 5 + Math.random() * 5;
        const targetRotation = fullRotations * 2 * Math.PI + Math.random() * 2 * Math.PI;

        const startRotation = this.rotation;
        const startTime = performance.now();
        let lastTickAngle = 0;
        const sliceAngle = (2 * Math.PI) / this.entries.length;
        const pointer = document.querySelector('.wheel-pointer');

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / this.spinDuration, 1);

            // Easing function for smooth slowdown
            const easeOut = 1 - Math.pow(1 - progress, 4);
            this.rotation = startRotation + targetRotation * easeOut;

            // Play tick sound and bounce pointer when passing segment boundaries
            const normalizedRotation = this.rotation % (2 * Math.PI);
            const currentSlice = Math.floor(normalizedRotation / sliceAngle);
            if (currentSlice !== lastTickAngle) {
                this.playTick();
                // Bounce the pointer
                pointer.classList.remove('bounce');
                void pointer.offsetWidth; // Trigger reflow to restart animation
                pointer.classList.add('bounce');
                lastTickAngle = currentSlice;
            }

            this.draw();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                pointer.classList.remove('bounce');
                this.onSpinComplete();
            }
        };

        requestAnimationFrame(animate);
    }

    onSpinComplete() {
        this.isSpinning = false;
        const spinBtn = document.getElementById('spinBtn');
        spinBtn.disabled = false;
        spinBtn.classList.remove('spinning');
        spinBtn.textContent = 'SPIN';

        // Determine winner (segment at top where pointer is)
        // The pointer is at the top of the wheel (270 degrees = 3π/2 radians)
        const pointerAngle = 3 * Math.PI / 2;
        const sliceAngle = (2 * Math.PI) / this.entries.length;

        // Calculate which segment is at the pointer position
        // We need to find the angle relative to the wheel's rotation
        let angleAtPointer = pointerAngle - this.rotation;
        // Normalize to [0, 2π)
        angleAtPointer = ((angleAtPointer % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

        const winnerIndex = Math.floor(angleAtPointer / sliceAngle) % this.entries.length;
        const winner = this.entries[winnerIndex];

        // Play win sound
        this.playWinSound();

        // Show confetti
        if (this.confettiEnabled) {
            this.launchConfetti();
        }

        // Update winner display
        const winnerDisplay = document.getElementById('winnerDisplay');
        winnerDisplay.classList.add('has-winner');
        winnerDisplay.innerHTML = `<span class="winner-name">${this.escapeHtml(winner.name)}</span>`;

        // Show winner modal
        document.getElementById('modalWinnerName').textContent = winner.name;
        document.getElementById('winnerModal').classList.add('active');

        // Add to history
        this.addToHistory(winner.name);

        // Remove winner if elimination mode
        if (this.eliminateWinner) {
            setTimeout(() => {
                this.entries.splice(winnerIndex, 1);
                this.updateColors();
                this.renderEntryList();
                this.draw();
                this.updateEntryCount();
                this.saveToStorage();
            }, 500);
        }
    }

    addToHistory(name) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.history.unshift({ name, time: timeStr });
        if (this.history.length > 20) this.history.pop();
        this.renderHistory();
        this.saveToStorage();
    }

    renderHistory() {
        const list = document.getElementById('historyList');
        if (this.history.length === 0) {
            list.innerHTML = '<span class="history-placeholder">No spins yet</span>';
            return;
        }

        list.innerHTML = this.history.map(item => `
            <div class="history-item">
                <span class="name">${this.escapeHtml(item.name)}</span>
                <span class="time">${item.time}</span>
            </div>
        `).join('');
    }

    clearHistory() {
        this.history = [];
        this.renderHistory();
        this.saveToStorage();
        this.showToast('History cleared');
    }

    launchConfetti() {
        const canvas = document.getElementById('confettiCanvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const colors = this.themes[this.currentTheme];

        for (let i = 0; i < 150; i++) {
            particles.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20 - 10,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 10 + 5,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            let activeParticles = 0;
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.5; // gravity
                p.rotation += p.rotationSpeed;
                p.vx *= 0.99;

                if (p.y < canvas.height + 50) {
                    activeParticles++;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation * Math.PI / 180);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 2);
                    ctx.restore();
                }
            });

            if (activeParticles > 0) {
                requestAnimationFrame(animate);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        };

        animate();
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const btn = document.getElementById('soundBtn');
        btn.classList.toggle('active', this.soundEnabled);
        btn.innerHTML = this.soundEnabled
            ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>'
            : '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';
        this.saveToStorage();
    }

    toggleFullscreen() {
        document.body.classList.toggle('fullscreen-mode');
    }

    copyShareLink() {
        const url = this.generateShareURL();
        navigator.clipboard.writeText(url).then(() => {
            this.showToast('Link copied to clipboard!', 'success');
        }).catch(() => {
            this.showToast('Failed to copy link', 'error');
        });
    }

    generateShareURL() {
        const data = {
            e: this.entries.map(e => e.name),
            t: this.currentTheme
        };
        const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
        return `${window.location.origin}${window.location.pathname}?w=${encoded}`;
    }

    showEmbedModal() {
        const url = this.generateShareURL();
        const embedCode = `<iframe src="${url}" width="800" height="600" frameborder="0" allowfullscreen></iframe>`;
        document.getElementById('embedCode').value = embedCode;
        document.getElementById('embedModal').classList.add('active');
    }

    importCSV(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split(/[\r\n]+/).filter(line => line.trim());

            lines.forEach(line => {
                // Handle CSV with commas
                const name = line.split(',')[0].trim().replace(/^["']|["']$/g, '');
                if (name) {
                    this.entries.push({
                        name: name,
                        color: this.getColorForIndex(this.entries.length)
                    });
                }
            });

            this.renderEntryList();
            this.draw();
            this.updateEntryCount();
            this.saveToStorage();
            this.showToast(`Imported ${lines.length} entries`);
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    exportEntries() {
        if (this.entries.length === 0) {
            this.showToast('No entries to export', 'error');
            return;
        }

        const csv = this.entries.map(e => e.name).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wheel-entries.csv';
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Entries exported!', 'success');
    }

    loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        const data = params.get('w');
        if (data) {
            try {
                const decoded = JSON.parse(decodeURIComponent(atob(data)));
                if (decoded.e && Array.isArray(decoded.e)) {
                    this.entries = decoded.e.map((name, index) => ({
                        name,
                        color: this.getColorForIndex(index)
                    }));
                }
                if (decoded.t) {
                    this.currentTheme = decoded.t;
                    document.getElementById('themeSelect').value = decoded.t;
                }
                this.renderEntryList();
            } catch (e) {
                console.error('Failed to load from URL:', e);
            }
        }
    }

    saveToStorage() {
        const data = {
            entries: this.entries.map(e => e.name),
            theme: this.currentTheme,
            duration: this.spinDuration,
            eliminate: this.eliminateWinner,
            confetti: this.confettiEnabled,
            sound: this.soundEnabled,
            history: this.history
        };
        localStorage.setItem('wheelSpinner', JSON.stringify(data));
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('wheelSpinner');
            if (saved) {
                const data = JSON.parse(saved);

                // Only load from storage if URL didn't provide entries
                if (this.entries.length === 0 && data.entries) {
                    this.entries = data.entries.map((name, index) => ({
                        name,
                        color: this.getColorForIndex(index)
                    }));
                }

                if (data.theme) {
                    this.currentTheme = data.theme;
                    document.getElementById('themeSelect').value = data.theme;
                    this.updateColors();
                }
                if (data.duration) {
                    this.spinDuration = data.duration;
                    document.getElementById('durationSelect').value = data.duration / 1000;
                }
                if (data.eliminate !== undefined) {
                    this.eliminateWinner = data.eliminate;
                    document.getElementById('eliminateWinner').classList.toggle('active', data.eliminate);
                }
                if (data.confetti !== undefined) {
                    this.confettiEnabled = data.confetti;
                    document.getElementById('confettiEnabled').classList.toggle('active', data.confetti);
                }
                if (data.sound !== undefined) {
                    this.soundEnabled = data.sound;
                    document.getElementById('soundBtn').classList.toggle('active', data.sound);
                }
                if (data.history) {
                    this.history = data.history;
                }

                this.renderEntryList();
                this.renderHistory();
            }
        } catch (e) {
            console.error('Failed to load from storage:', e);
        }
    }

    showToast(message, type = '') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast show' + (type ? ` ${type}` : '');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global functions for onclick handlers
function closeWinnerModal() {
    document.getElementById('winnerModal').classList.remove('active');
}

function closeEmbedModal() {
    document.getElementById('embedModal').classList.remove('active');
}

function copyEmbedCode() {
    const code = document.getElementById('embedCode');
    code.select();
    navigator.clipboard.writeText(code.value).then(() => {
        wheel.showToast('Embed code copied!', 'success');
    });
}

// Initialize
let wheel;
document.addEventListener('DOMContentLoaded', () => {
    wheel = new WheelSpinner();
});
