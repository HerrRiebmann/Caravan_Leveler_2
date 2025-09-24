"use strict";
let bubbleX, bubbleY, valueX, valueY;
document.addEventListener("DOMContentLoaded", function () {
	bubbleX = document.getElementById('bubbleX');
	bubbleY = document.getElementById('bubbleY');
	valueX = document.getElementById('valueX');
	valueY = document.getElementById('valueY');
	SetValue(0, 0, 10, "XX.X", "XX.X");
});
function simulateRandomMovement() {
	const maxVal = 10;	
	SetValue(Math.random() * maxVal * 2 - maxVal, Math.random() * maxVal * 2 - maxVal, maxVal, 12.4, 22.8);
}
function SetValue(X, Y, Threshold, Voltage, Temp) {
	// Limit & normalize (negate for bubble positioning)
	const tX = Math.max(-Threshold, Math.min(Threshold, X)) * -1;
	const tY = Math.max(-Threshold, Math.min(Threshold, Y)) * -1;

	bubbleX.style.left = 50 + (tX / Threshold) * 40 + "%";
	SetColor(bubbleX, tX, Threshold);
	valueX.textContent = Number(X).toFixed(1) + "°";

	bubbleY.style.top = 50 + (tY / Threshold) * 40 + "%";
	SetColor(bubbleY, tY, Threshold);
	valueY.textContent = Number(Y).toFixed(1) + "°";

	const bgColor = window.AppState.ADXL345_Initialized ? COLORS.SENSOR_GREEN : COLORS.ERROR_BRIGHT_RED;
	document.getElementById("levelVertical").style.background = bgColor;
	document.getElementById("levelHorizontal").style.background = bgColor;
	document.getElementById("Voltage").textContent = "⚡" + parseFloat(Voltage).toFixed(1) + "V";
	document.getElementById("Temperature").textContent = "🌡" + parseFloat(Temp).toFixed(1) + "°C";
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
	if (window.AppState.PCVersion) return;
	if (!window.AppState.ADXL345_Initialized) return;

	const oRequest = new XMLHttpRequest();
	const sURL = '/level';
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
			} else {
				window.AppState.ADXL345_Initialized = false;
				SetValue(0, 0, 10, 'XX.X', 'XX.X');				
				SetOutput(oRequest.responseText, true);
			}
		}
	};
	oRequest.onerror = function (e) {
		window.AppState.PCVersion = true;
		// Simple random values for PC demo
		setInterval(() => simulateRandomMovement(), 1000);
		SetOutput("PC demo mode", false);
	};
	oRequest.send(null);
}
