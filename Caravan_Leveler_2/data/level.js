"use strict";
let bubbleX, bubbleY, valueX, valueY;
//Console debug output
let consoleOutputEnabled = false;
// Mobile device gyroscope support
let gyroManager = null;

// Initialize gyroscope manager when page loads
document.addEventListener("DOMContentLoaded", function () {
	bubbleX = document.getElementById('bubbleX');
	bubbleY = document.getElementById('bubbleY');
	valueX = document.getElementById('valueX');
	valueY = document.getElementById('valueY');
	// Persist that user is currently viewing bubble leveler
	try { localStorage.setItem('levelerMode','bubble'); } catch(e) {}
	// Add intro animation classes until first real value arrives
	bubbleX.classList.add('bubble-intro-x');
	bubbleY.classList.add('bubble-intro-y');
	SetValue(0, 0, 10, "00.0", "00.0", true);
	
	// Initialize gyroscope manager
	if (typeof GyroManager !== 'undefined') {
		gyroManager = new GyroManager({
			identifier: 'bubble-level',
			onGyroData: (pitch, roll, threshold, voltage, temp) => {
				SetValue(pitch, roll, threshold, voltage, temp);
			},
			onStatusUpdate: (message, isError) => {
				SetOutput(message, isError);
			},
			onFallbackToSimulation: () => {
				fallbackToSimulation();
			},
			logFunction: safeLog
		});
	}
});
// Safe console logging for browser compatibility
function safeLog() {
	if (typeof console !== 'undefined' && console.log) {
		try {
			if (consoleOutputEnabled)
				console.log.apply(console, arguments);
		} catch (e) {
			// Ignore console errors in Edge
		}
	}
}

function simulateRandomMovement() {
	const maxVal = 10;
	const x = Math.random() * maxVal * 2 - maxVal;
	const y = Math.random() * maxVal * 2 - maxVal;
	safeLog('Simulating movement:', x.toFixed(2), y.toFixed(2));
	SetValue(x, y, maxVal, 12.4, 22.8);
}

function fallbackToSimulation() {
	safeLog('Starting PC simulation mode');
	
	// Set status message only once using gyroManager if available
	if (gyroManager) {
		gyroManager.setStatusOnce("PC demo mode", false);
	} else {
		SetOutput("PC demo mode", false);
	}
	
	// Clear any existing interval
	if (gyroManager && gyroManager.mobileGyroInterval) {
		clearInterval(gyroManager.mobileGyroInterval);
		gyroManager.mobileGyroInterval = null;
	}
	
	// Start the simulation with error handling for Edge
	try {
		const interval = setInterval(() => {
			safeLog('Running simulation tick');
			simulateRandomMovement();
		}, 1000);
		
		if (gyroManager) {
			gyroManager.mobileGyroInterval = interval;
		}
	} catch (e) {
		safeLog('Error starting interval, trying alternative approach');
		// Fallback for Edge if setInterval fails
		setTimeout(function runSimulation() {
			simulateRandomMovement();
			setTimeout(runSimulation, 1000);
		}, 1000);
	}
	
	// Show gyro permission button only for iOS devices that might need permission
	const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
	const hasPermissionAPI = typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';
	
	if (gyroManager && gyroManager.isMobileDevice() && isIOS && hasPermissionAPI) {
		gyroManager.showGyroPermissionButton();
		safeLog('Showing gyro permission button for iOS device');
	}
	
	safeLog('PC simulation started');
}

function requestGyroManually() {
	if (gyroManager) {
		gyroManager.requestGyroManually();
	}
}
let firstRealValueReceived = false;
let lastX = 0, lastY = 0; // retained for future enhancements

function SetValue(X, Y, Threshold, Voltage, Temp, isInitial = false) {
	// When sensor not initialized, force values to 0 and position bubbles at center
	if (!window.AppState.ADXL345_Initialized && !isInitial) {
		X = 0;
		Y = 0;
		// Remove intro animations to ensure bubbles can be positioned
		bubbleX.classList.remove('bubble-intro-x');
		bubbleY.classList.remove('bubble-intro-y');
	}

	// Limit & normalize (negate for bubble positioning)
	const tX = Math.max(-Threshold, Math.min(Threshold, X)) * -1;
	const tY = Math.max(-Threshold, Math.min(Threshold, Y)) * -1;

	const targetLeft = 50 + (tX / Threshold) * 40;
	if (!bubbleX.classList.contains('bubble-intro-x'))
		bubbleX.style.left = targetLeft + "%";
	SetColor(bubbleX, tX, Threshold);
	valueX.textContent = Number(X).toFixed(1) + "°";

	const targetTop = 50 + (tY / Threshold) * 40;
	if (!bubbleY.classList.contains('bubble-intro-y'))
		bubbleY.style.top = targetTop + "%";
	SetColor(bubbleY, tY, Threshold);
	valueY.textContent = Number(Y).toFixed(1) + "°";

	const bgColor = window.AppState.ADXL345_Initialized ? COLORS.SENSOR_GREEN : COLORS.ERROR_BRIGHT_RED;
	document.getElementById("levelVertical").style.background = bgColor;
	document.getElementById("levelHorizontal").style.background = bgColor;
	document.getElementById("Voltage").hidden = parseFloat(Voltage) < 1;
	document.getElementById("Voltage").textContent = "⚡" + parseFloat(Voltage).toFixed(1) + "V"; 
	document.getElementById("Temperature").hidden = parseFloat(Temp) == 0.0;
	document.getElementById("Temperature").textContent = "🌡" + parseFloat(Temp).toFixed(1) + "°C";

	// Remove intro animations after first real sensor value
	if (!isInitial && !firstRealValueReceived && window.AppState.ADXL345_Initialized) {
		firstRealValueReceived = true;
		bubbleX.classList.remove('bubble-intro-x');
		bubbleY.classList.remove('bubble-intro-y');
		bubbleX.classList.add('settling');
		bubbleY.classList.add('settling');
		setTimeout(()=>{ bubbleX.classList.remove('settling'); bubbleY.classList.remove('settling'); }, 600);
	}
	lastX = tX; lastY = tY;
}
function SetColor(element, value, Threshold) {
	let mappedVal = mapValues(value, -Threshold, Threshold, -100, 100);
	if (mappedVal < 0) mappedVal = -mappedVal;
	if (mappedVal > 100) mappedVal = 100;

	// Green -> Red color mapping
	const colour = hsl_col_perc(mappedVal, 120, 0);
	element.style.backgroundColor = colour;
}
function mapValues(value, in_min, in_max, out_min, out_max) {
	return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
function hsl_col_perc(percent, start, end) {
	const a = percent / 100;
	const b = (end - start) * a;
	const c = b + start;
	return 'hsl(' + c + ', 100%, 50%)';
}
function GetLevel() {
	// If we're already in PC version mode and simulation is running, don't make web requests
	if (window.AppState.PCVersion && (gyroManager && (gyroManager.isGyroActive() || gyroManager.hasSimulationInterval()))) return;
	
	if (!window.AppState.ADXL345_Initialized) return;

	const oRequest = new XMLHttpRequest();
	const sURL = '/level';
	
	// Set a timeout for Edge compatibility
	oRequest.timeout = 5000;
	
	oRequest.open("GET", sURL, true);
	oRequest.onload = function (e) {
		if (oRequest.readyState === 4) {
			if (oRequest.status === 200) {
				// X,Y,Threshold,Voltage,Temp,CustomText
				const arr = oRequest.responseText.split("|");
				SetValue(arr[0], arr[1], arr[2], arr[3], arr[4]);
				if (!window.AppState.ADXL345_Initialized) {
					window.AppState.ADXL345_Initialized = true;
					SetOutput("", false);
				}
			} else if (oRequest.status === 404 || oRequest.status === 0) {
				// 404 or network error - switch to PC mode
				safeLog('Server endpoint not found (404), switching to PC mode');
				handleRequestError();
			} else {
				window.AppState.ADXL345_Initialized = false;
				SetValue(0, 0, 10, 'XX.X', 'XX.X');				
				SetOutput(oRequest.responseText, true);
			}
		}
	};
	
	// Enhanced error handling for Edge
	function handleRequestError() {
		safeLog('Web request failed, switching to PC mode');
		window.AppState.PCVersion = true;
		
		safeLog('Is mobile device:', gyroManager ? gyroManager.isMobileDevice() : 'gyroManager not available');
		
		// Check if we're on a mobile device and can use gyroscope
		if (gyroManager && gyroManager.isMobileDevice()) {
			safeLog('Requesting gyroscope permission for mobile device');
			gyroManager.requestGyroPermission();
		} else {
			// Fallback to simple random values for PC demo
			safeLog('Starting PC simulation');
			fallbackToSimulation();
		}
	}
	
	oRequest.onerror = handleRequestError;
	oRequest.ontimeout = handleRequestError;
	
	try {
		oRequest.send(null);
	} catch (e) {
		safeLog('Exception during request send:', e);
		handleRequestError();
	}
}
