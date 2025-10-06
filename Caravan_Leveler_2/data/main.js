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
    const container = document.getElementById("BurgerMenu");
    const links = document.getElementById("myLinks");
    if (!burger || !container || !links) return;
    const opening = !burger.classList.contains('is-active');
    // If closing, add closing class for animation
    if (!opening) {
        container.classList.add('menu-closing');
        container.classList.remove('menu-open');
        burger.classList.remove('is-active');
        setTimeout(()=>{ container.classList.remove('menu-closing'); }, 220);
        removeGlobalMenuHandlers();
    } else {
        burger.classList.add('is-active');
        container.classList.add('menu-open');
        addGlobalMenuHandlers();
    }
}

function closeMenuIfOpen() {
    const burger = document.getElementById("hamburger-6");
    const container = document.getElementById("BurgerMenu");
    if (!burger || !container) return;
    if (burger.classList.contains('is-active')) {
        ToggleBurger();
    }
}

function handleDocumentClick(e){
    const container = document.getElementById("BurgerMenu");
    if (!container) return;
    if (!container.contains(e.target)) {
        closeMenuIfOpen();
    }
}

function handleKeyDown(e){
    if (e.key === 'Escape') closeMenuIfOpen();
}

function addGlobalMenuHandlers(){
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
}
function removeGlobalMenuHandlers(){
    document.removeEventListener('click', handleDocumentClick);
    document.removeEventListener('keydown', handleKeyDown);
}
function NavigateMenu(url) {
    ToggleBurger();
    // When user asks for the level page, always route through auto-level selection page
    if (url === 'leveler.html' || url === 'leveler_images.html' || url === 'auto_level.html') {
        url = 'auto_level.html';
    }
    document.getElementById("subframe").src = url;
}
function GetInfo() {
    const oRequest = new XMLHttpRequest();
    const sURL = '/espinfo';
    ClearCanvas();
    oRequest.open("GET", sURL, true);
    oRequest.onload = function (e) {
        if (oRequest.readyState === 4 && oRequest.status === 200) {            
            const arr = oRequest.responseText.split("|");
            AddControlsToCanvas(arr);
            document.getElementById("SaveBtn").style.backgroundColor = colorSuccess;
            ResetControlsDelayed();
        }
    };
    oRequest.onerror = function (e) {
        SetOutput("Get data failed!", true);        
        document.getElementById("SaveBtn").style.backgroundColor = colorError;
        setTimeout(FakeSomeData, 2000);
    };    
    oRequest.send(null);
}
function AddControlsToCanvas(arr) {
    const div = document.getElementById("espinfo");
    div.innerHTML = "";
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
}
function ClearCanvas(){
    const div = document.getElementById("espinfo");
    div.innerHTML = "";
}
function FakeSomeData(){
    var arr = ["Mode;DEMO!","DeviceName;Caravan Leveler","Firmware;v1.2.3","WiFi;Connected","IP;192.168.1.1"];
    AddControlsToCanvas(arr);
}
// ===================== Output Message Queue =====================
window.OutputMessageQueue = [];
let outputDisplaying = false;

function processNextOutput() {
    const output = document.getElementById("Output");
    if (!output) { window.OutputMessageQueue.length = 0; outputDisplaying = false; return; }
    if (window.OutputMessageQueue.length === 0) { outputDisplaying = false; return; }

    const { text, error } = window.OutputMessageQueue.shift();
    output.classList.remove('output-fade-out','output-cleared');
    output.classList.add('output-enhanced');
    output.innerHTML = text;
    if (error) output.classList.add('output-error'); else output.classList.remove('output-error');
    output.style.display = 'inline-block';
    requestAnimationFrame(()=>{ output.classList.add('output-visible'); });
    outputDisplaying = true;
    ResetControlsDelayed();
}

function SetOutput(text, error) {
    const output = document.getElementById("Output");
    if (!output) return;
    window.OutputMessageQueue.push({ text: text || "", error: !!error });
    if (!outputDisplaying) processNextOutput();
}
function ResetControlsDelayed() {
    setTimeout(ResetControls, 3000);
}
function ResetControls() {
    const output = document.getElementById("Output");
    if (output) {
        if (output.innerHTML !== "") {
            output.classList.remove('output-visible');
            output.classList.add('output-fade-out');
            setTimeout(()=>{
                output.innerHTML = "";
                output.classList.remove('output-fade-out','output-error','output-enhanced');
                output.classList.add('output-cleared');
                output.style.display = 'none';
                if (window.OutputMessageQueue.length > 0) processNextOutput();
                else outputDisplaying = false;
            }, 380);
        } else if (window.OutputMessageQueue.length > 0) {
            processNextOutput();
        } else {
            output.classList.remove('output-visible','output-error','output-enhanced');
            output.classList.add('output-cleared');
            output.style.display = 'none';
            outputDisplaying = false;
        }
    }

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
    try {
        if (path.endsWith('leveler_images.html')) {
            localStorage.setItem('levelerMode','bubble');
            window.location.href = 'leveler.html';
        } else {
            localStorage.setItem('levelerMode','images');
            window.location.href = 'leveler_images.html';
        }
    } catch(e) {
        // Fallback without persistence
        if (path.endsWith('leveler_images.html'))
            window.location.href = 'leveler.html';
        else
            window.location.href = 'leveler_images.html';
    }
}
