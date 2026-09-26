// =============================================================
// DEFAULT & MTS SCHEDULE
// =============================================================
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
    { id: 'mts_12', name: 'Kleine Pause', start: '15:25', end: '15:30', type: 'break' },
    { id: 'mts_13', name: '10. Stunde', start: '15:30', end: '16:15', type: 'lesson' },
    { id: 'mts_14', name: '11. Stunde', start: '16:15', end: '17:00', type: 'lesson' }
];

// =============================================================
// STATE
// =============================================================
let schedule = [];       // master list of time blocks
let timerInterval = null;

// weekPlan[dayIndex (0=Mon … 4=Fri)][lessonIndex] = 'lesson' | 'free'
// lessonIndex refers to which *lesson* slot (ignoring breaks) is active/free
// We store by lesson block id → 'lesson' | 'free'
// Structure: { 'mon': { blockId: 'lesson'|'free', … }, 'tue': { … }, … }
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];

let weekPlan = {}; // { 'mon': { <blockId>: 'lesson'|'free' }, … }

// =============================================================
// DOM REFS
// =============================================================
const currentTimeDisplay = document.getElementById('currentTimeDisplay');
const currentEventName = document.getElementById('currentEventName');
const nextEventHint = document.getElementById('nextEventHint');
const countdownDisplay = document.getElementById('countdownDisplay');
const countdownLabel = document.getElementById('countdownLabel');
const progressCircle = document.getElementById('progressCircle');
const startTimeDisplay = document.getElementById('startTimeDisplay');
const endTimeDisplay = document.getElementById('endTimeDisplay');
const ambientGlow = document.getElementById('ambientGlow');
const memeTicker = document.getElementById('memeTicker');
let hasFiredConfetti = false;

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

const tabTimesBtn = document.getElementById('tabTimesBtn');
const tabPlanBtn = document.getElementById('tabPlanBtn');
const tabTimes = document.getElementById('tabTimes');
const tabPlan = document.getElementById('tabPlan');
const weekPlanGrid = document.getElementById('weekPlanGrid');
const savePlanBtn = document.getElementById('savePlanBtn');

// =============================================================
// UTILITY
// =============================================================
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

const getDaySeconds = (date) => date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();

const determineType = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('pause') || lowerName.includes('break')) return 'break';
    return 'lesson';
};

// Returns js day index 1=Mon … 5=Fri, 6=Sat, 0=Sun
const getTodayDayKey = () => {
    const d = new Date().getDay(); // 0=Sun,1=Mon…6=Sat
    const map = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri' };
    return map[d] || null; // null = weekend
};

// =============================================================
// ACTIVE SCHEDULE FOR TODAY (respects weekPlan free slots)
// =============================================================
const getActiveScheduleForToday = () => {
    const dayKey = getTodayDayKey();
    if (!dayKey) return []; // weekend → no schedule

    const dayPlan = weekPlan[dayKey] || {};

    // Filter: keep breaks always, keep lessons only if NOT marked free
    return schedule.filter(item => {
        if (item.type !== 'lesson') return true; // always keep breaks
        const status = dayPlan[item.id];
        return status !== 'free'; // keep if 'lesson' or undefined (default active)
    });
};

// =============================================================
// MEME / CONFETTI
// =============================================================
const getMemeForTime = (remaining, type) => {
    if (type === 'break') {
        if (remaining > 300) return "Entspannung pur ☕";
        if (remaining <= 300 && remaining > 120) return "Noch 5 Min: Zeit, sich langsam auf den Weg zu machen...";
        if (remaining <= 120) return "Sprint zum Klassenzimmer einleiten! 🏃‍♂️💨";
        return "Pause!";
    }
    if (remaining > 2400) return "Das wird noch dauern... 🥱";
    if (remaining <= 2400 && remaining > 1800) return "Immerhin schon ein bisschen geschafft.";
    if (remaining <= 1800 && remaining > 900) return "Die Hälfte ist in Sicht!";
    if (remaining <= 900 && remaining > 300) return "Endspurt! Nicht mehr lange.";
    if (remaining <= 300 && remaining > 120) return "Noch 5 Min: Stifte heimlich einpacken 🤫";
    if (remaining <= 120) return "Den Blickkontakt mit der Lehrkraft strikt meiden 👀";
    return "";
};

const fireConfetti = () => {
    if (typeof confetti === 'function') {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
        const randomInRange = (min, max) => Math.random() * (max - min) + min;
        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    }
};

// =============================================================
// UI COLORS
// =============================================================
const updateUIColors = (type, remaining = null) => {
    progressCircle.classList.remove('text-emerald', 'text-amber', 'text-slate', 'text-red-500');
    countdownDisplay.classList.remove('text-emerald', 'text-amber', 'text-slate', 'text-red-500', 'animate-pulse');
    ambientGlow.classList.remove('bg-emerald-glow', 'bg-amber-glow', 'bg-slate-glow', 'bg-red-500/20');

    if (type === 'lesson') {
        if (remaining !== null && remaining <= 120) {
            progressCircle.classList.add('text-red-500');
            countdownDisplay.classList.add('text-red-500', 'animate-pulse');
            ambientGlow.classList.add('bg-red-500/20');
        } else {
            progressCircle.classList.add('text-emerald');
            countdownDisplay.classList.add('text-emerald');
            ambientGlow.classList.add('bg-emerald-glow');
        }
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

// =============================================================
// WEEKEND DISPLAY
// =============================================================
const showWeekendState = () => {
    updateUIColors('idle');
    currentEventName.textContent = "Wochenende";
    countdownDisplay.textContent = "🎉";
    countdownLabel.textContent = "Kein Unterricht";
    nextEventHint.textContent = "Samstag & Sonntag schulfrei";
    memeTicker.textContent = "Genieß die Freiheit! 🛋️";
    startTimeDisplay.textContent = "--:--";
    endTimeDisplay.textContent = "--:--";
    progressCircle.style.strokeDashoffset = 283;
};

// =============================================================
// MAIN TIMER LOGIC
// =============================================================
const updateTimer = () => {
    const now = new Date();
    currentTimeDisplay.textContent = now.toLocaleTimeString('de-DE');

    const dayKey = getTodayDayKey();
    if (!dayKey) {
        showWeekendState();
        return;
    }

    const todaySchedule = getActiveScheduleForToday();
    if (todaySchedule.length === 0) {
        // All lessons are free today or no schedule
        updateUIColors('idle');
        currentEventName.textContent = "Kein Unterricht heute";
        countdownDisplay.textContent = "--:--";
        countdownLabel.textContent = "Freier Tag";
        nextEventHint.textContent = "";
        memeTicker.textContent = "Heute ist frei! 🎈";
        startTimeDisplay.textContent = "--:--";
        endTimeDisplay.textContent = "--:--";
        progressCircle.style.strokeDashoffset = 283;
        return;
    }

    const currentSeconds = getDaySeconds(now);

    let activeEvent = null;
    let nextEvent = null;

    for (let i = 0; i < todaySchedule.length; i++) {
        const item = todaySchedule[i];
        const startSec = parseTime(item.start);
        const endSec = parseTime(item.end);

        if (currentSeconds >= startSec && currentSeconds < endSec) {
            activeEvent = item;
            nextEvent = todaySchedule[i + 1] || null;
            break;
        } else if (startSec > currentSeconds) {
            nextEvent = item;
            break;
        }
    }

    if (activeEvent) {
        const startSec = parseTime(activeEvent.start);
        const endSec = parseTime(activeEvent.end);
        const totalDuration = endSec - startSec;
        const elapsed = currentSeconds - startSec;
        const remaining = endSec - currentSeconds;

        const type = activeEvent.type || determineType(activeEvent.name);
        updateUIColors(type, remaining);

        currentEventName.textContent = activeEvent.name;
        countdownDisplay.textContent = formatTime(remaining);
        countdownLabel.textContent = "Verbleibend";
        memeTicker.textContent = getMemeForTime(remaining, type);
        hasFiredConfetti = false;

        nextEventHint.textContent = nextEvent
            ? `Danach: ${nextEvent.name}`
            : "Letzter Block des Tages";

        startTimeDisplay.textContent = activeEvent.start;
        endTimeDisplay.textContent = activeEvent.end;

        const progressPercentage = elapsed / totalDuration;
        progressCircle.style.strokeDashoffset = 283 - (283 * progressPercentage);

    } else if (nextEvent) {
        const startSec = parseTime(nextEvent.start);
        const remaining = startSec - currentSeconds;

        updateUIColors('idle');
        currentEventName.textContent = "Freizeit / Vor Unterricht";
        countdownDisplay.textContent = formatTime(remaining);
        countdownLabel.textContent = `Bis ${nextEvent.name}`;
        nextEventHint.textContent = `Nächster Block: ${nextEvent.start}`;
        memeTicker.textContent = "Die Ruhe vor dem Sturm...";
        hasFiredConfetti = false;

        startTimeDisplay.textContent = "--:--";
        endTimeDisplay.textContent = nextEvent.start;
        progressCircle.style.strokeDashoffset = 0;

    } else {
        // Day over
        updateUIColors('idle');
        currentEventName.textContent = "Schulschluss";
        countdownDisplay.textContent = "00:00";
        countdownLabel.textContent = "Geschafft!";
        nextEventHint.textContent = "Bis morgen!";
        memeTicker.textContent = "Freiheit! 🎉";

        if (!hasFiredConfetti) {
            fireConfetti();
            hasFiredConfetti = true;
        }

        startTimeDisplay.textContent = "--:--";
        endTimeDisplay.textContent = "--:--";
        progressCircle.style.strokeDashoffset = 283;
    }
};

// =============================================================
// DATA PERSISTENCE
// =============================================================
const loadSchedule = () => {
    const saved = localStorage.getItem('lessonSchedule');
    if (saved) {
        try { schedule = JSON.parse(saved); }
        catch (e) { schedule = [...defaultSchedule]; }
    } else {
        schedule = [...defaultSchedule];
    }
    schedule.sort((a, b) => parseTime(a.start) - parseTime(b.start));
};

const saveSchedule = (newSchedule) => {
    schedule = newSchedule.sort((a, b) => parseTime(a.start) - parseTime(b.start));
    localStorage.setItem('lessonSchedule', JSON.stringify(schedule));
    updateTimer();
};

const loadWeekPlan = () => {
    const saved = localStorage.getItem('weekPlan');
    if (saved) {
        try { weekPlan = JSON.parse(saved); }
        catch (e) { weekPlan = {}; }
    } else {
        weekPlan = {};
    }
};

const saveWeekPlan = () => {
    localStorage.setItem('weekPlan', JSON.stringify(weekPlan));
};

// =============================================================
// SETTINGS MODAL – TIMES TAB
// =============================================================
const generateId = () => Math.random().toString(36).substr(2, 9);

const createScheduleRow = (item) => {
    const clone = scheduleRowTemplate.content.cloneNode(true);
    const row = clone.querySelector('.schedule-item');
    const nameInput = clone.querySelector('.event-name-input');
    const typeSelect = clone.querySelector('.type-select');
    const timeInputs = clone.querySelectorAll('.time-input');
    const indicator = clone.querySelector('.type-indicator');

    nameInput.value = item.name || '';
    timeInputs[0].value = item.start || '00:00';
    timeInputs[1].value = item.end || '00:00';

    const type = item.type || determineType(item.name || '');
    if (typeSelect) typeSelect.value = type;

    const updateIndicatorColor = (t) => {
        if (t === 'break') {
            indicator.classList.remove('bg-accent');
            indicator.classList.add('bg-amber-500');
        } else {
            indicator.classList.remove('bg-amber-500');
            indicator.classList.add('bg-accent');
        }
    };
    updateIndicatorColor(type);

    if (typeSelect) {
        typeSelect.addEventListener('change', (e) => updateIndicatorColor(e.target.value));
    }

    clone.querySelector('.delete-btn').addEventListener('click', () => row.remove());
    return clone;
};

const renderSettingsList = () => {
    scheduleList.innerHTML = '';
    schedule.forEach(item => scheduleList.appendChild(createScheduleRow(item)));
};

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
            newSchedule.push({ id: generateId(), name, start, end, type });
        }
    });
    saveSchedule(newSchedule);
    // Re-render week plan grid because lesson ids changed
    renderWeekPlanGrid();
    toggleSettings();
};

addEventBtn.addEventListener('click', () => {
    const lastItem = schedule[schedule.length - 1];
    let nextStart = '08:00';
    if (lastItem && lastItem.end) nextStart = lastItem.end;
    const nextEndSec = parseTime(nextStart) + 45 * 60;
    const nextEnd = formatTime(nextEndSec).slice(0, 5);
    scheduleList.appendChild(createScheduleRow({ name: 'Neuer Block', start: nextStart, end: nextEnd }));
    scheduleList.scrollTop = scheduleList.scrollHeight;
});

// =============================================================
// SETTINGS MODAL – WEEK PLAN TAB
// =============================================================
const renderWeekPlanGrid = () => {
    weekPlanGrid.innerHTML = '';

    // Only lesson blocks (not breaks) go into the grid
    const lessonBlocks = schedule.filter(b => b.type === 'lesson');
    if (lessonBlocks.length === 0) {
        weekPlanGrid.innerHTML = '<div class="col-span-6 text-center text-white/30 text-sm py-8">Keine Unterrichtsstunden konfiguriert.</div>';
        return;
    }

    // Update grid columns dynamically
    weekPlanGrid.style.gridTemplateColumns = `52px repeat(5, 1fr)`;

    // Header row: empty corner + day labels
    const corner = document.createElement('div');
    corner.className = 'day-header';
    weekPlanGrid.appendChild(corner);

    DAY_LABELS.forEach(label => {
        const h = document.createElement('div');
        h.className = 'day-header';
        h.textContent = label;
        weekPlanGrid.appendChild(h);
    });

    // Rows: one per lesson block
    lessonBlocks.forEach(block => {
        // Row label (time)
        const rowLabel = document.createElement('div');
        rowLabel.className = 'row-label';
        rowLabel.textContent = block.start;
        weekPlanGrid.appendChild(rowLabel);

        // Tiles for each weekday
        DAY_KEYS.forEach(dayKey => {
            const dayPlan = weekPlan[dayKey] = weekPlan[dayKey] || {};
            const status = dayPlan[block.id] || 'lesson';

            const tile = document.createElement('div');
            tile.className = `lesson-tile ${status === 'free' ? 'tile-free' : 'tile-lesson'}`;
            tile.title = `${block.name} – ${dayKey.toUpperCase()} (${status === 'free' ? 'Freistunde' : 'Unterricht'})`;

            const lbl = document.createElement('span');
            lbl.className = 'tile-label';
            lbl.textContent = block.name.replace('. Stunde', 'h').replace('Stunde', 'h');
            tile.appendChild(lbl);

            tile.addEventListener('click', () => {
                const current = weekPlan[dayKey][block.id] || 'lesson';
                weekPlan[dayKey][block.id] = current === 'lesson' ? 'free' : 'lesson';
                const newStatus = weekPlan[dayKey][block.id];
                tile.className = `lesson-tile ${newStatus === 'free' ? 'tile-free' : 'tile-lesson'}`;
                tile.title = `${block.name} – ${dayKey.toUpperCase()} (${newStatus === 'free' ? 'Freistunde' : 'Unterricht'})`;
            });

            weekPlanGrid.appendChild(tile);
        });
    });
};

savePlanBtn.addEventListener('click', () => {
    saveWeekPlan();
    updateTimer();
    toggleSettings();
});

// =============================================================
// TABS
// =============================================================
const switchTab = (tab) => {
    if (tab === 'times') {
        tabTimesBtn.classList.add('active-tab');
        tabPlanBtn.classList.remove('active-tab');
        tabTimes.classList.remove('hidden');
        tabPlan.classList.add('hidden');
    } else {
        tabPlanBtn.classList.add('active-tab');
        tabTimesBtn.classList.remove('active-tab');
        tabPlan.classList.remove('hidden');
        tabTimes.classList.add('hidden');
        renderWeekPlanGrid();
    }
};

tabTimesBtn.addEventListener('click', () => switchTab('times'));
tabPlanBtn.addEventListener('click', () => switchTab('plan'));

// =============================================================
// MODAL OPEN / CLOSE
// =============================================================
const toggleSettings = () => {
    if (settingsModal.classList.contains('modal-active')) {
        settingsModal.classList.remove('modal-active');
    } else {
        switchTab('times');
        renderSettingsList();
        settingsModal.classList.add('modal-active');
    }
};

openSettingsBtn.addEventListener('click', toggleSettings);
closeSettingsBtn.addEventListener('click', toggleSettings);
saveSettingsBtn.addEventListener('click', handleSaveSettings);

settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) toggleSettings();
});

// =============================================================
// MTS / IMPORT / EXPORT
// =============================================================
loadMtsBtn.addEventListener('click', () => {
    if (confirm('Möchtest du das MTS-Zeiten Preset laden? Deine aktuellen Zeiten werden überschrieben.')) {
        saveSchedule([...mtsSchedule]);
        renderSettingsList();
        renderWeekPlanGrid();
    }
});

exportBtn.addEventListener('click', () => {
    const data = { schedule, weekPlan };
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', 'stundenplan.json');
    link.click();
});

importBtn.addEventListener('click', () => importInput.click());

importInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parsed = JSON.parse(e.target.result);
            // Support both old (array) and new ({ schedule, weekPlan }) format
            if (Array.isArray(parsed)) {
                saveSchedule(parsed);
                weekPlan = {};
            } else if (parsed.schedule && Array.isArray(parsed.schedule)) {
                saveSchedule(parsed.schedule);
                weekPlan = parsed.weekPlan || {};
                saveWeekPlan();
            } else {
                alert('Ungültiges Dateiformat.');
                return;
            }
            renderSettingsList();
            renderWeekPlanGrid();
            alert('Stundenplan erfolgreich importiert!');
        } catch (err) {
            alert('Fehler beim Lesen der Datei.');
        }
        importInput.value = '';
    };
    reader.readAsText(file);
});

// =============================================================
// INIT
// =============================================================
const init = () => {
    loadSchedule();
    loadWeekPlan();
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
};

init();
//