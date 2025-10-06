let autoScroll = true;
let updatesEnabled = true;
let logBuffer = "";
let updateInterval = 1000; // Default 1 second
let intervalId = null;
let requestFailed = false;

window.onload = () => {
    updateLog();
    startUpdateTimer();
};

async function updateLog() {
    try {
        let r = await fetch('/log');
        let t = await r.text();
        if (t.trim().length > 0) {
            AppendToLog(t);
            requestFailed = false;
        }
    } catch (error) {
        if(requestFailed){
            AppendToLog('Receive Log - ' + error + '\n');
            return;
        }
        console.error('Failed to fetch log:', error);
        SetOutput("Failed to fetch serial log", true);
        requestFailed = true;
    }
}

function AppendToLog(newData) {
    var log = document.getElementById('log');
    log.innerHTML += newData;
    logBuffer += newData;

    if (autoScroll) {
        log.scrollTop = log.scrollHeight;
    }
}

function toggleAutoScroll() {
    autoScroll = !autoScroll;
    const btn = document.getElementById('autoScrollBtn');
    btn.textContent = `Auto Scroll: ${autoScroll ? 'ON' : 'OFF'}`;
    btn.style.backgroundColor = autoScroll ? COLORS.BRAND_BLUE : COLORS.ERROR_RED;
    
    if (autoScroll) {
        const log = document.getElementById('log');
        log.scrollTop = log.scrollHeight;
    }
}

function clearLog() {
    const log = document.getElementById('log');
    log.innerHTML = '';
    logBuffer = "";
    SetOutput("Log cleared", false);
}

function toggleUpdates() {
    updatesEnabled = !updatesEnabled;
    const btn = document.getElementById('toggleBtn');
    btn.textContent = updatesEnabled ? 'Pause Updates' : 'Resume Updates';
    btn.style.backgroundColor = updatesEnabled ? COLORS.BRAND_BLUE : COLORS.ERROR_RED;
    SetOutput(`Updates ${updatesEnabled ? 'resumed' : 'paused'}`, false);
}

function startUpdateTimer() {
    if (intervalId) {
        clearInterval(intervalId);
    }
    intervalId = setInterval(() => {
        if (updatesEnabled) {
            updateLog();
        }
    }, updateInterval);
}

function setUpdateInterval() {
    const slider = document.getElementById('intervalSlider');
    const newInterval = parseInt(slider.value);
    
    updateInterval = newInterval;
    startUpdateTimer();
    SetOutput(`Update interval set to ${newInterval}ms`, false);
}

function updateIntervalDisplay() {
    const slider = document.getElementById('intervalSlider');
    const display = document.getElementById('intervalValue');
    display.textContent = slider.value;
}