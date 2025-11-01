let mode = "gyro"; // gyro oder accel
let chart;
let history = { x: [], y: [], z: [] };
let minmax = {
    gyro: { x: [9999, -9999], y: [9999, -9999], z: [9999, -9999] },
    accel: { x: [9999, -9999], y: [9999, -9999], z: [9999, -9999] }
};

// Mobile device gyroscope support for data page
let gyroSupportedData = false;
let gyroPermissionGrantedData = false;
let mobileGyroIntervalData = null;
let lastDeviceOrientationData = { alpha: 0, beta: 0, gamma: 0 };
let lastDeviceMotionData = { x: 0, y: 0, z: 0 };

//Console debug output
let consoleOutputEnabled = false;

// Safe console logging for browser compatibility
function safeLogData() {
    if (typeof console !== 'undefined' && console.log) {
        try {
            if(consoleOutputEnabled)
                console.log.apply(console, arguments);
        } catch (e) {
            // Ignore console errors in Edge
        }
    }
}

window.onload = () => {
    let ctx = document.getElementById('sensorChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(50).fill(""),
            datasets: [
                { label: "X", borderColor: "red", data: [], fill: false },
                { label: "Y", borderColor: "green", data: [], fill: false },
                { label: "Z", borderColor: "blue", data: [], fill: false }
            ]
        },
        options: {
            responsive: true,
            animation: false,
            scales: {
                x: { display: false },
                y: { beginAtZero: true }
            }
        }
    });
    setMode(mode);
    setInterval(GetRawData, 500);
};

function isMobileDeviceData() {
    // More robust mobile detection with Edge compatibility
    try {
        const userAgent = (navigator.userAgent || '').toLowerCase();
        
        // Primary mobile OS detection
        const isMobileOS = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        
        // Tablet detection
        const isTablet = /tablet|ipad/i.test(userAgent);
        
        // Windows/Mac/Linux desktop detection - if these are present, likely not mobile
        const isDesktopOS = /windows nt|mac os x|linux/i.test(userAgent);
        
        // Edge-specific: Don't rely solely on touch points for Edge on Windows
        const isEdgeOnWindows = /edg/i.test(userAgent) && /windows/i.test(userAgent);
        
        // Touch capability (but be careful with Edge reporting false positives)
        const hasTouch = navigator.maxTouchPoints && navigator.maxTouchPoints > 2;
        const isEdgeTouch = 'ontouchstart' in window || (window.DocumentTouch && document instanceof window.DocumentTouch);
        
        // If it's Edge on Windows with high touch points, it's likely a desktop with touch capability
        if (isEdgeOnWindows && hasTouch && !isMobileOS) {
            safeLogData('Edge on Windows detected with touch capability - treating as desktop');
            return false;
        }
        
        // If we detect mobile OS or tablet, it's definitely mobile
        if (isMobileOS || isTablet) {
            return true;
        }
        
        // If we detect desktop OS and no mobile indicators, it's desktop
        if (isDesktopOS && !isMobileOS) {
            return false;
        }
        
        // Fallback to touch detection for ambiguous cases
        return hasTouch || isEdgeTouch;
    } catch (e) {
        // Fallback for any browser compatibility issues
        safeLogData('Mobile detection error:', e);
        return false;
    }
}

function requestGyroPermissionData() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+ requires explicit permission
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    gyroPermissionGrantedData = true;
                    startMobileGyroData();
                } else {
                    safeLogData('Device orientation permission denied');
                    SetOutput("Gyroscope permission denied", true);
                    showGyroPermissionButtonData();
                }
            })
            .catch(error => {
                safeLogData('Error requesting device orientation permission:', error);
                SetOutput("Tap 📱 to enable gyroscope", false);
                showGyroPermissionButtonData();
            });
    } else if ('DeviceOrientationEvent' in window) {
        // Android and older iOS - no permission needed
        gyroPermissionGrantedData = true;
        startMobileGyroData();
    } else {
        safeLogData('Device orientation not supported');
        fallbackToSimulationData();
    }
}

function startMobileGyroData() {
    gyroSupportedData = true;
    SetOutput("Connecting to device sensors...", false);
    
    let dataReceived = false;
    
    function orientationHandler(event) {
        dataReceived = true;
        handleDeviceOrientationData(event);
    }
    
    function motionHandler(event) {
        dataReceived = true;
        handleDeviceMotionData(event);
    }
    
    window.addEventListener('deviceorientation', orientationHandler, true);
    window.addEventListener('devicemotion', motionHandler, true);
    
    // Fallback timeout - if no orientation events received within 3 seconds, fall back to simulation
    setTimeout(() => {
        if (!dataReceived) {
            safeLogData('No gyroscope data received, falling back to simulation');
            window.removeEventListener('deviceorientation', orientationHandler, true);
            window.removeEventListener('devicemotion', motionHandler, true);
            fallbackToSimulationData();
        } else {
            SetOutput("Using device sensors", false);
        }
    }, 3000);
}

function handleDeviceOrientationData(event) {
    if (!gyroSupportedData) return;
    
    // DeviceOrientationEvent provides:
    // - alpha: rotation around z-axis (0-360 degrees)
    // - beta: front-to-back tilt (-180 to 180 degrees) 
    // - gamma: left-to-right tilt (-90 to 90 degrees)
    
    lastDeviceOrientationData = {
        alpha: event.alpha || 0,
        beta: event.beta || 0, 
        gamma: event.gamma || 0
    };
}

function handleDeviceMotionData(event) {
    if (!gyroSupportedData) return;
    
    // DeviceMotionEvent provides acceleration data
    if (event.acceleration) {
        lastDeviceMotionData = {
            x: event.acceleration.x || 0,
            y: event.acceleration.y || 0,
            z: event.acceleration.z || 0
        };
    }
}

function generateMobileGyroData() {
    // Convert device orientation to gyro-like data
    // Swap X and Y to match expected axis orientation
    let gyroX = lastDeviceOrientationData.gamma;  // Left-right tilt (X axis)
    let gyroY = lastDeviceOrientationData.beta;   // Front-back tilt (Y axis)
    let gyroZ = lastDeviceOrientationData.alpha;  // Rotation around vertical axis
    
    // Use device motion for accelerometer data (scaled)
    let accX = lastDeviceMotionData.x * 100; // Scale to match expected range
    let accY = lastDeviceMotionData.y * 100;
    let accZ = lastDeviceMotionData.z * 100;
    
    let arr = [gyroX, gyroY, gyroZ, accX, accY, accZ];
    DisplayRawData(arr);
}

function fallbackToSimulationData() {
    gyroSupportedData = false;
    SetOutput("PC demo mode", false);
    
    // Clear any existing interval
    if (mobileGyroIntervalData) {
        clearInterval(mobileGyroIntervalData);
    }
    
    // Start the simulation with error handling for Edge
    try {
        mobileGyroIntervalData = setInterval(() => {
            FakeSomeData();
        }, 500);
    } catch (e) {
        safeLogData('Error starting interval, trying alternative approach');
        // Fallback for Edge if setInterval fails
        setTimeout(function runDataSimulation() {
            FakeSomeData();
            setTimeout(runDataSimulation, 500);
        }, 500);
    }
    
    // Show gyro permission button for mobile devices
    if (isMobileDeviceData()) {
        showGyroPermissionButtonData();
    }
    
    safeLogData('PC data simulation started, interval ID:', mobileGyroIntervalData);
}

function stopMobileGyroData() {
    if (mobileGyroIntervalData) {
        clearInterval(mobileGyroIntervalData);
        mobileGyroIntervalData = null;
    }
    window.removeEventListener('deviceorientation', handleDeviceOrientationData, true);
    window.removeEventListener('devicemotion', handleDeviceMotionData, true);
    gyroSupportedData = false;
}

function requestGyroManually() {
    const btn = document.getElementById('gyroPermissionBtn');
    if (btn) btn.style.display = 'none';
    
    if (isMobileDeviceData()) {
        stopMobileGyroData(); // Stop any existing simulation
        requestGyroPermissionData();
    }
}

function showGyroPermissionButtonData() {
    const btn = document.getElementById('gyroPermissionBtn');
    if (btn && isMobileDeviceData()) {
        btn.style.display = 'inline-block';
    }
}

function GetRawData() {
    // If we're already using device sensors, generate data from them
    if (window.AppState.PCVersion && gyroSupportedData) {
        generateMobileGyroData();
        return;
    }
    
    if (window.AppState.PCVersion && mobileGyroIntervalData) {
        // Simulation is already running
        return;
    }
    
    if (!window.AppState.ADXL345_Initialized) return;
    
    var oRequest = new XMLHttpRequest();
    var sURL = '/data';
    
    // Set a timeout for Edge compatibility
    oRequest.timeout = 5000;
    
    oRequest.open("GET", sURL, true);
    oRequest.onload = function (e) {
        if (oRequest.readyState === 4 && oRequest.status === 200) {
            //SetOutput(oRequest.responseText, false);
            var arr = oRequest.responseText.split("|");
            DisplayRawData(arr);
        }
        else {
            SetOutput(oRequest.responseText, true);
            window.AppState.ADXL345_Initialized = false;
        }
    };
    
    // Enhanced error handling for Edge
    function handleDataRequestError() {
        safeLogData('Data web request failed, switching to PC mode');
        window.AppState.PCVersion = true;
        
        safeLogData('Is mobile device (data):', isMobileDeviceData());
        
        // Check if we're on a mobile device and can use gyroscope
        if (isMobileDeviceData()) {
            safeLogData('Requesting gyroscope permission for mobile device (data)');
            requestGyroPermissionData();
        } else {
            // Fallback to simple random values for PC demo
            safeLogData('Starting PC data simulation');
            fallbackToSimulationData();
        }
    }
    
    oRequest.onerror = handleDataRequestError;
    oRequest.ontimeout = handleDataRequestError;
    
    try {
        oRequest.send(null);
    } catch (e) {
        safeLogData('Exception during data request send:', e);
        handleDataRequestError();
    }
}

function DisplayRawData(parts) {
    // Beispiel String: "gyroX|gyroY|gyroZ|accelX|accelY|accelZ"
    let data = {
        gyro: { x: parts[0], y: parts[1], z: parts[2] },
        accel: { x: parts[3], y: parts[4], z: parts[5] }
    };
    updateChart(data[mode]);
    updateTable(data[mode]);
}

function setMode(m) {
    mode = m;
    chart.data.datasets.forEach((ds, i) => {
        ds.data = history[["x", "y", "z"][i]];
    });
    chart.update();
    if (mode == 'gyro') {
        document.getElementById("gyro").style.backgroundColor = COLORS.ERROR_RED;
        document.getElementById("accel").style.backgroundColor = COLORS.BRAND_BLUE;
    }
    else {
        document.getElementById("gyro").style.backgroundColor = COLORS.BRAND_BLUE;
        document.getElementById("accel").style.backgroundColor = COLORS.ERROR_RED;
    }
}

function updateChart(values) {
    ["x", "y", "z"].forEach((axis, i) => {
        history[axis].push(values[axis]);
        if (history[axis].length > 50) history[axis].shift();
        if (chart.data.datasets[i]) {
            chart.data.datasets[i].data = history[axis];
        }
    });
    chart.update();
}

function updateTable(values) {
    let html = "";
    ["x", "y", "z"].forEach(axis => {
        let v = parseFloat(values[axis]); // Convert to number for proper comparison
        let mm = minmax[mode][axis];
        if (v < mm[0]) mm[0] = v;
        if (v > mm[1]) mm[1] = v;
        var color;
        switch (axis) {
            case "x": color = "red"; break;
            case "y": color = "green"; break;
            case "z": color = "blue"; break;
        }
        html += `<tr><td style="color:${color}">${axis.toUpperCase()}</td><td style="color:${COLORS.TEXT_GRAY}">${v.toFixed(2)}</td><td>${mm[0].toFixed(2)}</td><td style="color:${COLORS.BRAND_BLUE}">${mm[1].toFixed(2)}</td></tr>`;
    });
    document.getElementById("dataTable").innerHTML = html;
}
function FakeSomeData() {
    let gyroX = Math.floor(Math.random() * 360) - 180;
    let gyroY = Math.floor(Math.random() * 360) - 180;
    let gyroZ = Math.floor(Math.random() * 360) - 180;
    let accX = Math.floor(Math.random() * 2000) - 1000;
    let accY = Math.floor(Math.random() * 2000) - 1000;
    let accZ = Math.floor(Math.random() * 2000) - 1000;
    let arr = [gyroX, gyroY, gyroZ, accX, accY, accZ];
    safeLogData('Simulating data:', arr);
    DisplayRawData(arr);
}
