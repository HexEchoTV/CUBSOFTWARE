// Keraplast Digestion Calculator

// Password Protection
const CORRECT_PASSWORD = 'operator26';

function checkPassword() {
    const input = document.getElementById('passwordInput');
    const error = document.getElementById('passwordError');

    if (input.value === CORRECT_PASSWORD) {
        document.body.classList.add('authenticated');
        error.textContent = '';
    } else {
        error.textContent = 'Incorrect password';
        input.value = '';
        input.focus();
    }
}

// Focus password input on load
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('passwordInput').focus();
});

// Step offsets in minutes from start time
const steps = [
    { id: 'time-start', offset: 0, name: 'Start Time' },
    { id: 'time-ph1', offset: 5, name: 'PH Test' },
    { id: 'time-25hz', offset: 25, name: 'Mixer Consistently 25hz' },
    { id: 'time-ph2', offset: 30, name: 'PH Test' },
    { id: 'time-30hz', offset: 45, name: 'Mixer Consistently 30hz' },
    { id: 'time-testph', offset: 80, name: 'Wool Test & PH Test' },
    { id: 'time-test1', offset: 120, name: 'Wool Test' },
    { id: 'time-test2', offset: 180, name: 'Wool Test' },
    { id: 'time-finish', offset: 210, name: 'Finish & Transfer Digestion Liquor' }
];

let timerInterval = null;
let timerActive = false;
let triggeredSteps = new Set();
let audioContext = null;
let soundLoopInterval = null;
let pendingAcknowledgement = null;
let currentSound = 'chime';

// Sound definitions
const sounds = {
    chime: {
        name: 'Chime',
        play: (ctx) => {
            const now = ctx.currentTime;
            playTone(ctx, 523.25, now, 0.15, 'sine');        // C5
            playTone(ctx, 659.25, now + 0.15, 0.15, 'sine'); // E5
            playTone(ctx, 783.99, now + 0.3, 0.3, 'sine');   // G5
        }
    },
    alert: {
        name: 'Alert',
        play: (ctx) => {
            const now = ctx.currentTime;
            playTone(ctx, 880, now, 0.1, 'square');
            playTone(ctx, 880, now + 0.15, 0.1, 'square');
            playTone(ctx, 880, now + 0.3, 0.1, 'square');
        }
    },
    bell: {
        name: 'Bell',
        play: (ctx) => {
            const now = ctx.currentTime;
            playTone(ctx, 1200, now, 0.4, 'sine');
            playTone(ctx, 600, now, 0.5, 'sine');
        }
    },
    alarm: {
        name: 'Alarm',
        play: (ctx) => {
            const now = ctx.currentTime;
            for (let i = 0; i < 3; i++) {
                playTone(ctx, 800, now + i * 0.2, 0.1, 'sawtooth');
                playTone(ctx, 600, now + i * 0.2 + 0.1, 0.1, 'sawtooth');
            }
        }
    },
    gentle: {
        name: 'Gentle',
        play: (ctx) => {
            const now = ctx.currentTime;
            playTone(ctx, 392, now, 0.3, 'sine');      // G4
            playTone(ctx, 440, now + 0.3, 0.3, 'sine'); // A4
        }
    },
    urgent: {
        name: 'Urgent',
        play: (ctx) => {
            const now = ctx.currentTime;
            for (let i = 0; i < 5; i++) {
                playTone(ctx, 1000, now + i * 0.12, 0.06, 'square');
            }
        }
    }
};

function playTone(ctx, frequency, startTime, duration, type) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
}

function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return audioContext;
}

function playNotificationSound() {
    try {
        const ctx = initAudioContext();
        sounds[currentSound].play(ctx);
    } catch (e) {
        console.log('Audio not supported:', e);
    }
}

function startSoundLoop(stepName, stepTime) {
    // Stop any existing loop
    stopSoundLoop();

    pendingAcknowledgement = { stepName, stepTime };

    // Play immediately
    playNotificationSound();

    // Loop every 2 seconds until acknowledged
    soundLoopInterval = setInterval(() => {
        playNotificationSound();
    }, 2000);

    // Show acknowledge button
    showAcknowledgeModal(stepName, stepTime);
}

function stopSoundLoop() {
    if (soundLoopInterval) {
        clearInterval(soundLoopInterval);
        soundLoopInterval = null;
    }
    pendingAcknowledgement = null;
    hideAcknowledgeModal();
}

function acknowledgeAlert() {
    stopSoundLoop();
}

function showAcknowledgeModal(stepName, stepTime) {
    const modal = document.getElementById('acknowledgeModal');
    const stepNameEl = document.getElementById('alertStepName');
    const stepTimeEl = document.getElementById('alertStepTime');

    stepNameEl.textContent = stepName;
    stepTimeEl.textContent = stepTime;

    modal.classList.add('show');
}

function hideAcknowledgeModal() {
    const modal = document.getElementById('acknowledgeModal');
    modal.classList.remove('show');
}

function changeSound(select) {
    currentSound = select.value;
    localStorage.setItem('keraplast-sound', currentSound);
}

function testSound() {
    playNotificationSound();
}

function addMinutes(time, minutes) {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

function timeToMinutes(time) {
    const [hours, mins] = time.split(':').map(Number);
    return hours * 60 + mins;
}

function getCurrentTimeString() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function calculateTimes() {
    const startTime = document.getElementById('startTime').value;

    if (!startTime) {
        alert('Please enter a start time');
        return;
    }

    // Calculate and display each step time
    steps.forEach(step => {
        const calculatedTime = addMinutes(startTime, step.offset);
        const element = document.getElementById(step.id);
        if (element) {
            element.textContent = calculatedTime;
            element.classList.add('updated');
            setTimeout(() => element.classList.remove('updated'), 300);
        }
    });

    // Save to localStorage for convenience
    localStorage.setItem('keraplast-start-time', startTime);

    // Reset triggered steps when times change
    if (timerActive) {
        triggeredSteps.clear();
        updateStepHighlights();
    }
}

function updateStepHighlights() {
    const startTime = document.getElementById('startTime').value;
    const currentTime = getCurrentTimeString();
    const currentMinutes = timeToMinutes(currentTime);
    const startMinutes = timeToMinutes(startTime);

    steps.forEach((step, index) => {
        const stepTime = addMinutes(startTime, step.offset);
        const stepMinutes = timeToMinutes(stepTime);
        const row = document.getElementById(step.id).closest('.step-row');

        row.classList.remove('step-active', 'step-completed', 'step-upcoming');

        if (triggeredSteps.has(step.id)) {
            row.classList.add('step-completed');
        } else if (currentMinutes >= stepMinutes) {
            // This step's time has passed but wasn't triggered (timer started late)
            row.classList.add('step-completed');
        } else {
            // Find next upcoming step
            const nextStep = steps.find(s => {
                const sTime = addMinutes(startTime, s.offset);
                return timeToMinutes(sTime) > currentMinutes && !triggeredSteps.has(s.id);
            });
            if (nextStep && nextStep.id === step.id) {
                row.classList.add('step-active');
            } else {
                row.classList.add('step-upcoming');
            }
        }
    });
}

function checkTimers() {
    const startTime = document.getElementById('startTime').value;
    const currentTime = getCurrentTimeString();
    const currentMinutes = timeToMinutes(currentTime);

    steps.forEach(step => {
        const stepTime = addMinutes(startTime, step.offset);
        const stepMinutes = timeToMinutes(stepTime);

        // Check if we've hit this step's time and haven't triggered it yet
        if (currentMinutes === stepMinutes && !triggeredSteps.has(step.id)) {
            triggeredSteps.add(step.id);
            startSoundLoop(step.name, stepTime);
            showNotification(step.name, stepTime);
            highlightStep(step.id);
        }
    });

    updateStepHighlights();
    updateTimerDisplay();
}

function highlightStep(stepId) {
    const element = document.getElementById(stepId);
    if (element) {
        const row = element.closest('.step-row');
        row.classList.add('step-triggered');
        setTimeout(() => row.classList.remove('step-triggered'), 3000);
    }
}

function showNotification(stepName, time) {
    // Show toast notification
    const toast = document.getElementById('toast');
    toast.textContent = `${stepName} - ${time}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 5000);

    // Also try browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Keraplast Timer', {
            body: `${stepName} - ${time}`,
            icon: '/static/images/company-logo.png'
        });
    }
}

function updateTimerDisplay() {
    const timerStatus = document.getElementById('timerStatus');
    if (!timerStatus) return;

    if (timerActive) {
        const startTime = document.getElementById('startTime').value;
        const currentTime = getCurrentTimeString();

        // Find next upcoming step
        const nextStep = steps.find(step => {
            const stepTime = addMinutes(startTime, step.offset);
            return timeToMinutes(stepTime) > timeToMinutes(currentTime) && !triggeredSteps.has(step.id);
        });

        if (nextStep) {
            const stepTime = addMinutes(startTime, nextStep.offset);
            const stepMinutes = timeToMinutes(stepTime);
            const currentMinutes = timeToMinutes(currentTime);
            const minutesUntil = stepMinutes - currentMinutes;

            timerStatus.innerHTML = `<span class="status-active">Timer Active</span> - Next: <strong>${nextStep.name}</strong> in <strong>${minutesUntil} min</strong>`;
        } else {
            timerStatus.innerHTML = `<span class="status-complete">All steps completed!</span>`;
        }
    } else {
        timerStatus.innerHTML = `<span class="status-inactive">Timer inactive</span>`;
    }
}

function startTimer() {
    if (timerActive) return;

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    // Initialize audio context on user interaction
    initAudioContext();

    // Request wake lock to keep screen on (mobile)
    requestWakeLock();

    timerActive = true;
    triggeredSteps.clear();

    // Check immediately, then every second
    checkTimers();
    timerInterval = setInterval(checkTimers, 1000);

    document.getElementById('startTimerBtn').style.display = 'none';
    document.getElementById('stopTimerBtn').style.display = 'inline-block';

    updateTimerDisplay();
}

function stopTimer() {
    timerActive = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // Stop any looping sound
    stopSoundLoop();

    // Release wake lock
    releaseWakeLock();

    triggeredSteps.clear();

    // Remove all highlights
    document.querySelectorAll('.step-row').forEach(row => {
        row.classList.remove('step-active', 'step-completed', 'step-upcoming', 'step-triggered');
    });

    document.getElementById('startTimerBtn').style.display = 'inline-block';
    document.getElementById('stopTimerBtn').style.display = 'none';

    updateTimerDisplay();
}

function resetTimer() {
    // Stop the timer if running
    stopTimer();

    // Set start time to current time
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    document.getElementById('startTime').value = currentTime;

    // Recalculate times
    calculateTimes();

    // Start the timer
    startTimer();
}

function testSound() {
    playNotificationSound();
}

// Load saved settings on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTime = localStorage.getItem('keraplast-start-time');
    if (savedTime) {
        document.getElementById('startTime').value = savedTime;
        calculateTimes();
    } else {
        // Calculate with default time
        calculateTimes();
    }

    // Load saved sound preference
    const savedSound = localStorage.getItem('keraplast-sound');
    if (savedSound && sounds[savedSound]) {
        currentSound = savedSound;
        document.getElementById('soundSelect').value = savedSound;
    }

    updateTimerDisplay();

    // Request notification permission early
    if ('Notification' in window && Notification.permission === 'default') {
        // Will ask when user interacts
    }

    // Keep page alive when timer is running (prevents throttling)
    document.addEventListener('visibilitychange', () => {
        if (timerActive && document.hidden) {
            // Page is hidden but timer is active - notifications will still work
            console.log('Page hidden - notifications will still trigger');
        }
    });
});

// Auto-calculate when time input changes
document.getElementById('startTime').addEventListener('change', calculateTimes);

// Prevent page from sleeping on mobile (if supported)
let wakeLock = null;

async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake lock acquired');
            wakeLock.addEventListener('release', () => {
                console.log('Wake lock released');
            });
        } catch (e) {
            console.log('Wake lock not available:', e);
        }
    }
}

function releaseWakeLock() {
    if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
    }
}
