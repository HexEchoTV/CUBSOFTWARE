// Keraplast Digestion Calculator

// Step offsets in minutes from start time
const steps = [
    { id: 'time-start', offset: 0, name: 'Start Time' },
    { id: 'time-ph1', offset: 5, name: 'PH' },
    { id: 'time-25hz', offset: 30, name: 'Consistently 25hz' },
    { id: 'time-ph2', offset: 35, name: 'PH' },
    { id: 'time-30hz', offset: 50, name: 'Consistently 30hz' },
    { id: 'time-testph', offset: 85, name: 'Test & PH' },
    { id: 'time-test1', offset: 125, name: 'Test' },
    { id: 'time-test2', offset: 185, name: 'Test' },
    { id: 'time-finish', offset: 215, name: 'Finish' }
];

let timerInterval = null;
let timerActive = false;
let triggeredSteps = new Set();
let audioContext = null;

// Create notification sound using Web Audio API
function playNotificationSound() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Resume audio context if suspended (browser autoplay policy)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        // Create a pleasant notification sound (three ascending tones)
        const playTone = (frequency, startTime, duration) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };

        const now = audioContext.currentTime;
        playTone(523.25, now, 0.15);        // C5
        playTone(659.25, now + 0.15, 0.15); // E5
        playTone(783.99, now + 0.3, 0.3);   // G5

    } catch (e) {
        console.log('Audio not supported:', e);
    }
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
            playNotificationSound();
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
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

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

    triggeredSteps.clear();

    // Remove all highlights
    document.querySelectorAll('.step-row').forEach(row => {
        row.classList.remove('step-active', 'step-completed', 'step-upcoming', 'step-triggered');
    });

    document.getElementById('startTimerBtn').style.display = 'inline-block';
    document.getElementById('stopTimerBtn').style.display = 'none';

    updateTimerDisplay();
}

function testSound() {
    playNotificationSound();
}

// Load saved start time on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTime = localStorage.getItem('keraplast-start-time');
    if (savedTime) {
        document.getElementById('startTime').value = savedTime;
        calculateTimes();
    } else {
        // Calculate with default time
        calculateTimes();
    }

    updateTimerDisplay();
});

// Auto-calculate when time input changes
document.getElementById('startTime').addEventListener('change', calculateTimes);
