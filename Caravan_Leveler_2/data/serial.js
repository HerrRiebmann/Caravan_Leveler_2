let autoScroll = true;
let updatesEnabled = true;
let logBuffer = "";
let updateInterval = 1000; // Default 1 second
let intervalId = null;
let requestFailed = false;

// SessionStorage keys
const STORAGE_KEY_LOG = 'serial_log_data';
const STORAGE_KEY_AUTO_SCROLL = 'serial_auto_scroll';
const STORAGE_KEY_INTERVAL = 'serial_update_interval';

window.onload = () => {
    restoreSessionData();
    updateLog();
    startUpdateTimer();
};

function restoreSessionData() {
    try {
        // Restore log data
        const savedLog = sessionStorage.getItem(STORAGE_KEY_LOG);
        if (savedLog) {
            const log = document.getElementById('log');
            log.innerHTML = savedLog;
            logBuffer = savedLog;
            if (autoScroll) {
                log.scrollTop = log.scrollHeight;
            }
        }
        
        // Restore auto-scroll setting
        const savedAutoScroll = sessionStorage.getItem(STORAGE_KEY_AUTO_SCROLL);
        if (savedAutoScroll !== null) {
            autoScroll = savedAutoScroll === 'true';
            const btn = document.getElementById('autoScrollBtn');
            btn.textContent = `Auto Scroll: ${autoScroll ? 'ON' : 'OFF'}`;
            btn.style.backgroundColor = autoScroll ? COLORS.BRAND_BLUE : COLORS.ERROR_RED;
        }
        
        // Restore update interval
        const savedInterval = sessionStorage.getItem(STORAGE_KEY_INTERVAL);
        if (savedInterval) {
            updateInterval = parseInt(savedInterval);
            const slider = document.getElementById('intervalSlider');
            const display = document.getElementById('intervalValue');
            slider.value = updateInterval;
            display.textContent = updateInterval;
        }
    } catch (e) {
        console.error('Error restoring session data:', e);
    }
}

function saveSessionData() {
    try {
        sessionStorage.setItem(STORAGE_KEY_LOG, logBuffer);
        sessionStorage.setItem(STORAGE_KEY_AUTO_SCROLL, autoScroll.toString());
        sessionStorage.setItem(STORAGE_KEY_INTERVAL, updateInterval.toString());
    } catch (e) {
        console.error('Error saving session data:', e);
    }
}

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

    // Save to session storage
    saveSessionData();

    if (autoScroll) {
        log.scrollTop = log.scrollHeight;
    }
}

function toggleAutoScroll() {
    autoScroll = !autoScroll;
    const btn = document.getElementById('autoScrollBtn');
    btn.textContent = `Auto Scroll: ${autoScroll ? 'ON' : 'OFF'}`;
    btn.style.backgroundColor = autoScroll ? COLORS.BRAND_BLUE : COLORS.ERROR_RED;
    
    // Save to session storage
    saveSessionData();
    
    if (autoScroll) {
        const log = document.getElementById('log');
        log.scrollTop = log.scrollHeight;
    }
}

function clearLog() {
    const log = document.getElementById('log');
    log.innerHTML = '';
    logBuffer = "";
    
    // Clear session storage
    try {
        sessionStorage.removeItem(STORAGE_KEY_LOG);
    } catch (e) {
        console.error('Error clearing session data:', e);
    }
    
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
    
    // Save to session storage
    saveSessionData();
    
    SetOutput(`Update interval set to ${newInterval}ms`, false);
}

function updateIntervalDisplay() {
    const slider = document.getElementById('intervalSlider');
    const display = document.getElementById('intervalValue');
    display.textContent = slider.value;
}