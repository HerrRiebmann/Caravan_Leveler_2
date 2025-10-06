"use strict";

let rollImage, pitchImage, rollValue, pitchValue;
let currentThreshold = 10;
let rollScaleBuilt = false, pitchScaleBuilt = false;
let firstRealValueReceivedImages = false;
let scaleUpdatedWithRealThreshold = false; // ensures we rebuild the scale only once with the real threshold

document.addEventListener("DOMContentLoaded", () => {
    rollImage = document.getElementById('rollImage');
    pitchImage = document.getElementById('pitchImage');
    rollValue = document.getElementById('rollValue');
    pitchValue = document.getElementById('pitchValue');
    // Persist that user is currently viewing image leveler
    try { localStorage.setItem('levelerMode','images'); } catch(e) {}
    SetImageValues(0, 0, currentThreshold, "00.0", "00.0", true);
});

function GetLevelImage() {
    if (window.AppState.PCVersion) return; // in PC demo we'll start random simulation below
    if (!window.AppState.ADXL345_Initialized) return; // wait until sensor ready

    const req = new XMLHttpRequest();
    req.open("GET", "/level", true);
    req.onload = () => {
        if (req.readyState === 4) {
            if (req.status === 200) {
                // X,Y,Threshold,Voltage,Temp,CustomText
                const arr = req.responseText.split("|");
                SetImageValues(parseFloat(arr[0]), parseFloat(arr[1]), parseFloat(arr[2]), arr[3], arr[4]);
                if (!window.AppState.ADXL345_Initialized) {
                    window.AppState.ADXL345_Initialized = true;
                    SetOutput("", false);
                }
            } else {
                window.AppState.ADXL345_Initialized = false;
                SetImageValues(0, 0, currentThreshold, 'XX.X', 'XX.X');
                SetOutput(req.responseText, true);
            }
        }
    };
    req.onerror = () => {
        // Switch to demo mode on PC
        window.AppState.PCVersion = true;
        SetOutput("PC demo mode", false);
        setInterval(simulateRandomMovementImages, 1000);
    };
    req.send(null);
}

function simulateRandomMovementImages() {
    const maxVal = currentThreshold;    
    SetImageValues(Math.random() * maxVal * 2 - maxVal, Math.random() * maxVal * 2 - maxVal, maxVal, 12.4, 22.8);
}

function SetImageValues(x, y, threshold, voltage, temp, isInitial = false) {
    currentThreshold = threshold || currentThreshold;
    // Initial build with default (likely 10)
    if (!rollScaleBuilt) { buildScale('rollScale', currentThreshold); rollScaleBuilt = true; }
    if (!pitchScaleBuilt) { buildScale('pitchScale', currentThreshold); pitchScaleBuilt = true; }
    // After first real web request (isInitial = false) rebuild both scales ONCE using the actual threshold
    if (!isInitial && !scaleUpdatedWithRealThreshold) {
        if (threshold && threshold > 0) {
            buildScale('rollScale', threshold);
            buildScale('pitchScale', threshold);
            currentThreshold = threshold; // adopt real threshold for subsequent positioning/color mapping
        }
        scaleUpdatedWithRealThreshold = true;
    }

    // Apply rotation directly (roll uses Y axis; pitch uses X axis)
    rollImage.style.transform = `translate(-50%, -50%) rotate(${y.toFixed(1)}deg)`;
    pitchImage.style.transform = `translate(-50%, -50%) rotate(${x.toFixed(1)}deg)`;

    rollValue.textContent = y.toFixed(1) + '°';
    pitchValue.textContent = x.toFixed(1) + '°';

    // Position labels along the arc
    positionAngleLabel(rollValue, y, currentThreshold);
    positionAngleLabel(pitchValue, x, currentThreshold);

    // Color feedback on value labels (green to red)
    rollValue.style.backgroundColor = valueToColor(y, currentThreshold);
    pitchValue.style.backgroundColor = valueToColor(x, currentThreshold);

    // Apply red background when gyro not initialized, transparent when working
    const bgColor = window.AppState.ADXL345_Initialized ? "" : COLORS.ERROR_BRIGHT_RED;
    document.getElementById("rollUnit").style.background = bgColor;
    document.getElementById("pitchUnit").style.background = bgColor;

    document.getElementById("Voltage").hidden = parseFloat(voltage) < 1;
    document.getElementById("Voltage").textContent = "⚡" + parseFloat(voltage).toFixed(1) + "V";  
    document.getElementById("Temperature").hidden = parseFloat(temp) === 0.0;
    document.getElementById("Temperature").textContent = "🌡" + parseFloat(temp).toFixed(1) + "°C";

    if (!isInitial && !firstRealValueReceivedImages && window.AppState.ADXL345_Initialized) {
        firstRealValueReceivedImages = true;
        // small pop effect
        rollImage.classList.add('settling-img');
        pitchImage.classList.add('settling-img');
        setTimeout(()=>{ rollImage.classList.remove('settling-img'); pitchImage.classList.remove('settling-img'); }, 600);
    }
}

function valueToColor(val, threshold) {
    let mapped = mapValues(Math.abs(val), 0, threshold, 0, 100);
    if (mapped > 100) mapped = 100;
    return hsl_col_perc(mapped, 120, 0);
}

// Local helpers (duplicated small set to stay independent of level.js)
function mapValues(value, in_min, in_max, out_min, out_max) {
    return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
function hsl_col_perc(percent, start, end) {
    const a = percent / 100;
    const b = (end - start) * a;
    const c = b + start;
    return 'hsl(' + c + ', 100%, 50%)';
}

function buildScale(containerId, threshold) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const r = 90; // radius
    const cx = 100, cy = 100; // center along diameter baseline (y=100)
    const bigStep = 5;
    let svg = `<svg viewBox="0 0 200 110" class="semi-scale" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}" fill="none" stroke="#ffffff" stroke-width="2" />`;
    for (let a = -threshold; a <= threshold; a += 1) {
        const theta = Math.PI - ((a + threshold) / (2 * threshold)) * Math.PI; // map -thr..+thr to pi..0
        const xOuter = cx + r * Math.cos(theta);
        const yOuter = cy - r * Math.sin(theta);
        const len = (a % bigStep === 0) ? 12 : 6;
        const xInner = cx + (r - len) * Math.cos(theta);
        const yInner = cy - (r - len) * Math.sin(theta);
        svg += `<line x1="${xOuter.toFixed(2)}" y1="${yOuter.toFixed(2)}" x2="${xInner.toFixed(2)}" y2="${yInner.toFixed(2)}" stroke="#ddd" stroke-width="${a % bigStep === 0 ? 2 : 1}" />`;
        if (a % bigStep === 0) {
            const labelR = r - 25;
            const xLab = cx + labelR * Math.cos(theta);
            const yLab = cy - labelR * Math.sin(theta) + 5; // slight vertical adjust
            svg += `<text x="${xLab.toFixed(2)}" y="${yLab.toFixed(2)}" text-anchor="middle" font-size="10" fill="#fff">${a}</text>`;
        }
    }
    svg += `</svg>`;
    container.innerHTML = svg;
}

function positionAngleLabel(element, value, threshold) {
    const r = 90; // same as buildScale
    const cx = 100, cy = 100;
    // Clamp value to threshold limits
    if (value > threshold) value = threshold; else if (value < -threshold) value = -threshold;
    const ratio = (value + threshold) / (2 * threshold); // 0..1
    const theta = Math.PI - ratio * Math.PI; // map to pi..0
    const labelR = r + 14; // slightly outside arc
    const x = cx + labelR * Math.cos(theta);
    const y = cy - labelR * Math.sin(theta);
    // Apply position within the scale-wrapper (its top-left is 0,0; we use same coordinate system as SVG viewBox 0 0 200 110)
    // The wrapper is 200x200, arc drawn in upper portion (0..110 height). We'll keep same coordinates.
    element.style.left = x + 'px';
    element.style.top = y + 'px';
    element.style.transform = 'translate(-50%, -50%)';
}
