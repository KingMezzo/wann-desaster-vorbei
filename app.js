// Default Schedule Configuration
// Lessons are 45min, starting 7:50
const defaultSchedule = [
    { id: '1', name: '1. Stunde', start: '07:50', end: '08:35', type: 'lesson' },
    { id: '2', name: '2. Stunde', start: '08:35', end: '09:20', type: 'lesson' },
    { id: '3', name: '1. Pause', start: '09:20', end: '09:40', type: 'break' },
    { id: '4', name: '3. Stunde', start: '09:40', end: '10:25', type: 'lesson' },
    { id: '5', name: '4. Stunde', start: '10:25', end: '11:10', type: 'lesson' },
    { id: '6', name: '2. Pause', start: '11:10', end: '11:30', type: 'break' },
    { id: '7', name: '5. Stunde', start: '11:30', end: '12:15', type: 'lesson' },
    { id: '8', name: '6. Stunde', start: '12:15', end: '13:00', type: 'lesson' }
];

const mtsSchedule = [
    { id: 'mts_1', name: '1. Stunde', start: '07:50', end: '08:35', type: 'lesson' },
    { id: 'mts_2', name: '2. Stunde', start: '08:35', end: '09:20', type: 'lesson' },
    { id: 'mts_3', name: '1. Pause', start: '09:20', end: '09:40', type: 'break' },
    { id: 'mts_4', name: '3. Stunde', start: '09:40', end: '10:25', type: 'lesson' },
    { id: 'mts_5', name: '4. Stunde', start: '10:25', end: '11:10', type: 'lesson' },
    { id: 'mts_6', name: '2. Pause', start: '11:10', end: '11:30', type: 'break' },
    { id: 'mts_7', name: '5. Stunde', start: '11:30', end: '12:15', type: 'lesson' },
    { id: 'mts_8', name: '6. Stunde', start: '12:15', end: '13:00', type: 'lesson' },
    { id: 'mts_9', name: 'Mittagspause', start: '13:00', end: '13:55', type: 'break' },
    { id: 'mts_10', name: '8. Stunde', start: '13:55', end: '14:40', type: 'lesson' },
    { id: 'mts_11', name: '9. Stunde', start: '14:40', end: '15:25', type: 'lesson' },
    { id: 'mts_12', name: '3. Pause', start: '15:25', end: '15:30', type: 'break' },
    { id: 'mts_13', name: '10. Stunde', start: '15:30', end: '16:15', type: 'lesson' },
    { id: 'mts_14', name: '11. Stunde', start: '16:15', end: '17:00', type: 'lesson' }
];

let schedule = [];
let timerInterval = null;

// DOM Elements
const currentTimeDisplay = document.getElementById('currentTimeDisplay');
const currentEventName = document.getElementById('currentEventName');
const nextEventHint = document.getElementById('nextEventHint');
const countdownDisplay = document.getElementById('countdownDisplay');
const countdownLabel = document.getElementById('countdownLabel');
const progressCircle = document.getElementById('progressCircle');
const startTimeDisplay = document.getElementById('startTimeDisplay');
const endTimeDisplay = document.getElementById('endTimeDisplay');
const ambientGlow = document.getElementById('ambientGlow');

const openSettingsBtn = document.getElementById('openSettingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const addEventBtn = document.getElementById('addEventBtn');
const settingsModal = document.getElementById('settingsModal');
const scheduleList = document.getElementById('scheduleList');
const scheduleRowTemplate = document.getElementById('scheduleRowTemplate');

const loadMtsBtn = document.getElementById('loadMtsBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importInput = document.getElementById('importInput');

// Utility Functions
const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 3600 + minutes * 60;
};

const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const getDaySeconds = (date) => {
    return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
};

const determineType = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('pause') || lowerName.includes('break')) return 'break';
    return 'lesson';
};

const updateUIColors = (type) => {
    // Reset colors
    progressCircle.classList.remove('text-emerald', 'text-amber', 'text-slate');
    countdownDisplay.classList.remove('text-emerald', 'text-amber', 'text-slate');
    ambientGlow.classList.remove('bg-emerald-glow', 'bg-amber-glow', 'bg-slate-glow');

    if (type === 'lesson') {
        progressCircle.classList.add('text-emerald');
        countdownDisplay.classList.add('text-emerald');
        ambientGlow.classList.add('bg-emerald-glow');
    } else if (type === 'break') {
        progressCircle.classList.add('text-amber');
        countdownDisplay.classList.add('text-amber');
        ambientGlow.classList.add('bg-amber-glow');
    } else {
        progressCircle.classList.add('text-slate');
        countdownDisplay.classList.add('text-slate');
        ambientGlow.classList.add('bg-slate-glow');
    }
};

// Main Timer Logic
const updateTimer = () => {
    const now = new Date();
    currentTimeDisplay.textContent = now.toLocaleTimeString('de-DE');
    
    const currentSeconds = getDaySeconds(now);
    
    // Find current event
    let activeEvent = null;
    let nextEvent = null;
    
    for (let i = 0; i < schedule.length; i++) {
        const item = schedule[i];
        const startSec = parseTime(item.start);
        const endSec = parseTime(item.end);
        
        if (currentSeconds >= startSec && currentSeconds < endSec) {
            activeEvent = item;
            nextEvent = schedule[i + 1] || null;
            break;
        } else if (startSec > currentSeconds) {
            nextEvent = item;
            break;
        }
    }

    if (activeEvent) {
        // We are currently in an event
        const startSec = parseTime(activeEvent.start);
        const endSec = parseTime(activeEvent.end);
        const totalDuration = endSec - startSec;
        const elapsed = currentSeconds - startSec;
        const remaining = endSec - currentSeconds;
        
        const type = activeEvent.type || determineType(activeEvent.name);
        updateUIColors(type);

        currentEventName.textContent = activeEvent.name;
        countdownDisplay.textContent = formatTime(remaining);
        countdownLabel.textContent = "Verbleibend";
        
        if (nextEvent) {
            nextEventHint.textContent = `Danach: ${nextEvent.name}`;
        } else {
            nextEventHint.textContent = "Letzter Block des Tages";
        }

        startTimeDisplay.textContent = activeEvent.start;
        endTimeDisplay.textContent = activeEvent.end;

        // Update progress circle (Dash array is 283)
        const progressPercentage = elapsed / totalDuration;
        const dashoffset = 283 - (283 * progressPercentage);
        progressCircle.style.strokeDashoffset = dashoffset;
        
    } else if (nextEvent) {
        // We are waiting for the next event (e.g. before school)
        const startSec = parseTime(nextEvent.start);
        const remaining = startSec - currentSeconds;
        
        updateUIColors('idle');
        
        currentEventName.textContent = "Freizeit / Vor Unterricht";
        countdownDisplay.textContent = formatTime(remaining);
        countdownLabel.textContent = `Bis ${nextEvent.name}`;
        nextEventHint.textContent = `Nächster Block: ${nextEvent.start}`;
        
        startTimeDisplay.textContent = "--:--";
        endTimeDisplay.textContent = nextEvent.start;
        
        progressCircle.style.strokeDashoffset = 0; // Full circle
    } else {
        // Day is over
        updateUIColors('idle');
        
        currentEventName.textContent = "Schulschluss";
        countdownDisplay.textContent = "00:00";
        countdownLabel.textContent = "Geschafft!";
        nextEventHint.textContent = "Bis morgen!";
        
        startTimeDisplay.textContent = "--:--";
        endTimeDisplay.textContent = "--:--";
        
        progressCircle.style.strokeDashoffset = 283; // Empty circle
    }
};

// Data Management
const loadSchedule = () => {
    const saved = localStorage.getItem('lessonSchedule');
    if (saved) {
        try {
            schedule = JSON.parse(saved);
        } catch (e) {
            schedule = [...defaultSchedule];
        }
    } else {
        schedule = [...defaultSchedule];
    }
    
    // Sort schedule by start time
    schedule.sort((a, b) => parseTime(a.start) - parseTime(b.start));
};

const saveSchedule = (newSchedule) => {
    schedule = newSchedule.sort((a, b) => parseTime(a.start) - parseTime(b.start));
    localStorage.setItem('lessonSchedule', JSON.stringify(schedule));
    updateTimer(); // force update
};

// UI Settings Management
const createScheduleRow = (item) => {
    const clone = scheduleRowTemplate.content.cloneNode(true);
    const row = clone.querySelector('.schedule-item');
    const nameInput = clone.querySelector('.event-name-input');
    const typeSelect = clone.querySelector('.type-select');
    const timeInputs = clone.querySelectorAll('.time-input');
    const startInput = timeInputs[0];
    const endInput = timeInputs[1];
    const indicator = clone.querySelector('.type-indicator');
    
    nameInput.value = item.name || '';
    startInput.value = item.start || '00:00';
    endInput.value = item.end || '00:00';
    
    const type = item.type || determineType(item.name || '');
    if(typeSelect) typeSelect.value = type;
    
    // Helper to update color
    const updateIndicatorColor = (currentType) => {
        if (currentType === 'break') {
            indicator.classList.remove('bg-accent');
            indicator.classList.add('bg-amber-500');
        } else {
            indicator.classList.remove('bg-amber-500');
            indicator.classList.add('bg-accent');
        }
    };
    
    // Init color
    updateIndicatorColor(type);
    
    // Update indicator on type select change
    if(typeSelect) {
        typeSelect.addEventListener('change', (e) => {
            updateIndicatorColor(e.target.value);
        });
    }

    clone.querySelector('.delete-btn').addEventListener('click', () => {
        row.remove();
    });
    
    return clone;
};

const renderSettingsList = () => {
    scheduleList.innerHTML = '';
    schedule.forEach(item => {
        scheduleList.appendChild(createScheduleRow(item));
    });
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const handleSaveSettings = () => {
    const rows = scheduleList.querySelectorAll('.schedule-item');
    const newSchedule = [];
    
    rows.forEach(row => {
        const name = row.querySelector('.event-name-input').value.trim();
        const typeSelect = row.querySelector('.type-select');
        const type = typeSelect ? typeSelect.value : determineType(name);
        const inputs = row.querySelectorAll('.time-input');
        const start = inputs[0].value;
        const end = inputs[1].value;
        
        if (name && start && end) {
            newSchedule.push({
                id: generateId(),
                name,
                start,
                end,
                type
            });
        }
    });
    
    saveSchedule(newSchedule);
    toggleSettings();
};

const toggleSettings = () => {
    if (settingsModal.classList.contains('modal-active')) {
        settingsModal.classList.remove('modal-active');
    } else {
        renderSettingsList();
        settingsModal.classList.add('modal-active');
    }
};

// Event Listeners
openSettingsBtn.addEventListener('click', toggleSettings);
closeSettingsBtn.addEventListener('click', toggleSettings);
saveSettingsBtn.addEventListener('click', handleSaveSettings);

addEventBtn.addEventListener('click', () => {
    const lastItem = schedule[schedule.length - 1];
    let nextStart = '08:00';
    if (lastItem && lastItem.end) {
        nextStart = lastItem.end;
    }
    
    // Try to guess a 45 min lesson end time
    let nextEndSec = parseTime(nextStart) + 45 * 60;
    let nextEnd = formatTime(nextEndSec).slice(0,5); // "HH:MM"
    
    scheduleList.appendChild(createScheduleRow({
        name: 'Neuer Block',
        start: nextStart,
        end: nextEnd
    }));
    
    // Scroll to bottom
    scheduleList.scrollTop = scheduleList.scrollHeight;
});

// Close modal on outside click
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        toggleSettings();
    }
});

// Export/Import & MTS Preset Logic
loadMtsBtn.addEventListener('click', () => {
    if (confirm('Möchtest du das MTS-Zeiten Preset laden? Deine aktuellen Einstellungen werden überschrieben.')) {
        saveSchedule([...mtsSchedule]);
        if (settingsModal.classList.contains('modal-active')) {
            renderSettingsList();
        }
        alert('MTS-Zeiten erfolgreich geladen!');
    }
});

exportBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(schedule, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'stundenplan.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
});

importBtn.addEventListener('click', () => {
    importInput.click();
});

importInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedSchedule = JSON.parse(e.target.result);
            if (Array.isArray(importedSchedule)) {
                saveSchedule(importedSchedule);
                if (settingsModal.classList.contains('modal-active')) {
                    renderSettingsList();
                }
                alert('Stundenplan erfolgreich importiert!');
            } else {
                alert('Ungültiges Dateiformat. Bitte wähle eine gültige JSON-Datei aus.');
            }
        } catch (err) {
            alert('Fehler beim Lesen der Datei.');
        }
        // Reset input so the same file can be selected again
        importInput.value = '';
    };
    reader.readAsText(file);
});

// Initialization
const init = () => {
    loadSchedule();
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
};

// Run app
init();
