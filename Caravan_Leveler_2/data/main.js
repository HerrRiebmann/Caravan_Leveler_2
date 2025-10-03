"use strict";

// Centralized color constants
const COLORS = {
    BRAND_BLUE: "#008CBA",
    ERROR_RED: "#BA2E00", 
    SUCCESS_GREEN: "#25bb0d",
    SENSOR_GREEN: "#a4c639",
    ERROR_BRIGHT_RED: "#FF0000",
    TEXT_GRAY: "#333333"
};

// Legacy color constants for backward compatibility
const colorToReset = COLORS.BRAND_BLUE;
const colorError = "#ea401b";
const colorSuccess = COLORS.SUCCESS_GREEN;

// Centralized global state
window.AppState = {
    ADXL345_Initialized: true,
    PCVersion: false,
    voltageInitialized: true
};

document.addEventListener("DOMContentLoaded", function () {
    const noScriptWarning = document.getElementById("noScriptWarning");
    if(noScriptWarning)
        noScriptWarning.style.display = "none";
});
function ToggleBurger() {
    const burger = document.getElementById("hamburger-6");
    burger.classList.toggle('is-active');
    const x = document.getElementById("myLinks");
    if (x.style.display === "block")
        x.style.display = "none";
    else
        x.style.display = "block";
}
function NavigateMenu(url) {
    ToggleBurger();
    document.getElementById("subframe").src = url;
}
function GetInfo() {
    const oRequest = new XMLHttpRequest();
    const sURL = '/espinfo';

    oRequest.open("GET", sURL, true);
    oRequest.onload = function (e) {
        if (oRequest.readyState === 4 && oRequest.status === 200) {
            const div = document.getElementById("espinfo");
            div.innerHTML = "";
            const arr = oRequest.responseText.split("|");
            for (let i = 0; i < arr.length; i++) {
                const vals = arr[i].split(";");
                const lbl = document.createElement('label');
                lbl.htmlFor = vals[0];
                lbl.innerHTML = vals[0];
                const inp = document.createElement('input');
                inp.type = "text";
                inp.id = vals[0];
                inp.value = vals[1];
                inp.readOnly = true;
                div.append(lbl, inp);
            }
            document.getElementById("SaveBtn").style.backgroundColor = colorSuccess;
            ResetControlsDelayed();
        }
    };
    oRequest.onerror = function (e) {
        SetOutput("Get data failed!", true);
        document.getElementById("SaveBtn").style.backgroundColor = colorError;
    };
    oRequest.send(null);
}
function SetOutput(text, error) {
    const output = document.getElementById("Output");
    output.innerHTML = text;
    output.style.color = error ? colorError : document.body.style.color;
    ResetControlsDelayed();
}
function ResetControlsDelayed() {
    setTimeout(ResetControls, 3000);
}
function ResetControls() {
    const output = document.getElementById("Output");
    output.innerHTML = "";
    output.style.color = document.body.style.color;

    const buttons = ["SaveBtn", "NewFilesBtn", "RestartBtn", "Calibrate"];
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) btn.style.backgroundColor = colorToReset;
    });
}

// Utility function for making HTTP requests
function makeRequest(url, onSuccess, onError, method = "GET") {
    const request = new XMLHttpRequest();
    request.open(method, url, true);
    request.onload = function() {
        if (request.readyState === 4 && request.status === 200) {
            onSuccess(request.responseText);
        } else {
            onError(request.responseText);
        }
    };
    request.onerror = function() {
        onError("Network error occurred");
    };
    request.send(null);
}

// Utility function for button state management
function setButtonState(buttonId, success) {
    const btn = document.getElementById(buttonId);
    if (btn) {
        btn.style.backgroundColor = success ? COLORS.SUCCESS_GREEN : colorError;
    }
}

// Lightweight toggle between classic bubble leveler and image rotation leveler
function ToggleLevelMode() {
    const path = window.location.pathname;
    if (path.endsWith('leveler_images.html'))
        window.location.href = 'leveler.html';
    else
        window.location.href = 'leveler_images.html';
}
