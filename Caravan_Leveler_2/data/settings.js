document.addEventListener("DOMContentLoaded", function () {
    const slider = document.getElementById("ThresholdSlider");
    slider.oninput = function () {
        document.getElementById("SliderValue").innerHTML = this.value;
    };
    SetSetup(false);
});

function toggleAdvancedSettings() {
    const advancedSettings = document.getElementById("AdvancedSettings");
    const advancedMode = document.getElementById("AdvancedMode");
    
    if (advancedMode.checked) {
        advancedSettings.style.display = "block";
    } else {
        advancedSettings.style.display = "none";
    }
}
function SetDefaultSetupValues() {
    document.getElementById("SaveBtn").style.backgroundColor = colorError;
    document.getElementById("InvertAxis").value = 1;
    document.getElementById("Accesspoint").checked = true;
    document.getElementById("SerialOutput").checked = false;
    document.getElementById("VoltageThreshold").value = 0.00;
    document.getElementById("VoltagePin").value = 36;
    document.getElementById("Resistor1").value = 3600;
    document.getElementById("Resistor2").value = 1000;
    document.getElementById("SDAPin").value = 21;
    document.getElementById("SCLPin").value = 22;
    document.getElementById("I2CAdress").value = 104;
    document.getElementById("AccesspointPW").value = "No Connection!";
    SetThreshold(10);
    updateMPU6050Rotation(1);
}
function SetSetup(submitData = true) {
    var oRequest = new XMLHttpRequest();
    var sURL = '/setup';
    if (submitData) {
        sURL += '?inv=';
        sURL += document.getElementById("InvertAxis").value;
        sURL += '&ap=';
        sURL += document.getElementById("Accesspoint").checked ? '1' : '0';
        sURL += '&t=';
        sURL += document.getElementById("ThresholdSlider").value;
        sURL += '&s=';
        sURL += document.getElementById("SerialOutput").checked ? '1' : '0';
        sURL += '&v=';
        sURL += parseInt(document.getElementById("VoltageThreshold").value * 100);
        sURL += '&vp=';
        sURL += document.getElementById("VoltagePin").value;
        sURL += '&r1=';
        sURL += document.getElementById("Resistor1").value;
        sURL += '&r2=';
        sURL += document.getElementById("Resistor2").value;
        sURL += '&sda=';
        sURL += document.getElementById("SDAPin").value;
        sURL += '&scl=';
        sURL += document.getElementById("SCLPin").value;
        sURL += '&add=';
        sURL += document.getElementById("I2CAdress").value;
    }
    oRequest.open("GET", sURL, true);
    oRequest.onload = function (e) {
        if (oRequest.readyState === 4) {
            if (oRequest.status === 200) {
                var arr = oRequest.responseText.split("|");
                //Gyro Initialized, InvertAxis, Accesspoint, Gyro Threshold, Serial Output, Voltage Threshold, Voltage Pin, Resistor1, Resistor2, Advanced Mode
                window.AppState.ADXL345_Initialized = arr[0];
                document.getElementById("InvertAxis").value = arr[1];
                document.getElementById("Accesspoint").checked = arr[2] == '1' ? true : false;            
                SetThreshold(arr[3]);
                document.getElementById("SerialOutput").checked = arr[4] == '1' ? true : false;
                updateMPU6050Rotation(arr[1]);
                document.getElementById("VoltageThreshold").value = (arr[5] / 100).toFixed(2);
                
                // Handle new advanced settings if available
                if (arr.length > 6) {
                document.getElementById("VoltagePin").value = arr[6] || 0;
                document.getElementById("Resistor1").value = arr[7] || 0;
                document.getElementById("Resistor2").value = arr[8] || 0;
                document.getElementById("AccesspointPW").value = arr[9] || "";
                document.getElementById("SDAPin").value = arr[10] || 0;
                document.getElementById("SCLPin").value = arr[11] || 0;
                document.getElementById("I2CAdress").value = arr[12] || 0;
            } else {
                // Set defaults for new fields if server doesn't support them yet
                document.getElementById("VoltagePin").value = 0;
                document.getElementById("Resistor1").value = 0;
                document.getElementById("Resistor2").value = 0;
            }
            
                if (submitData) {
                    document.getElementById("SaveBtn").style.backgroundColor = colorSuccess;
                    ResetControlsDelayed();
                }
            } else if (oRequest.status === 404 || oRequest.status === 0) {
                // 404 or network error - PC mode
                SetOutput("Server not available - demo mode", true);
                SetDefaultSetupValues();
            } else {
                SetOutput(oRequest.responseText, true);
            }
        }
    };
    oRequest.onerror = function (e) {
        SetOutput("Get/Set Setup failed!", true);
        SetDefaultSetupValues();
    };
    oRequest.send(null);
}
function Calibrate() {
    var oRequest = new XMLHttpRequest();
    var sURL = '/calibrate';
    oRequest.open("GET", sURL, true);
    oRequest.onload = function (e) {
        if (oRequest.readyState === 4) {
            if (oRequest.status === 200) {
                SetOutput(oRequest.responseText, false);
                document.getElementById("Calibrate").style.backgroundColor = colorSuccess;
            } else if (oRequest.status === 404 || oRequest.status === 0) {
                SetOutput("Server not available", true);
                document.getElementById("Calibrate").style.backgroundColor = colorError;
            } else {
                SetOutput(oRequest.responseText, true);
                document.getElementById("Calibrate").style.backgroundColor = colorError;
            }
        }
    };
    oRequest.onerror = function (e) {
        SetOutput("Calibration Error!", true);
        document.getElementById("Calibrate").style.backgroundColor = colorError;
    };
    oRequest.send(null);
}
function Restart(){
	var oRequest = new XMLHttpRequest();
	var sURL  = '/restart';

    oRequest.open("GET",sURL,true);
	oRequest.onload = function (e) {
		if(oRequest.readyState === 4) {
			if (oRequest.status === 200) {
				document.getElementById("RestartBtn").style.backgroundColor = colorSuccess;
				ResetControlsDelayed();
			} else if (oRequest.status === 404 || oRequest.status === 0) {
				SetOutput("Server not available", true);
				document.getElementById("RestartBtn").style.backgroundColor = colorError;
			}
		}
	};
	oRequest.onerror = function (e) {
		SetOutput("Reboot failed!", true);
		document.getElementById("RestartBtn").style.backgroundColor = colorError;
	};
	oRequest.send(null);
}
function SetThreshold(threshold) {
    if (document.getElementById("ThresholdValue").innerHTML != threshold) {
        document.getElementById("ThresholdSlider").value = threshold;
        document.getElementById("ThresholdValue").innerHTML = threshold;
        document.getElementById("SliderValue").innerHTML = threshold;
    }
}
function updateMPU6050Rotation(invertAxis) {
    var image = document.getElementById("mpu6050Image");
    if (image) {
        var rotation = parseInt(invertAxis) * 90;
        image.style.transform = "rotate(" + rotation + "deg)";
    }
}

function rotateInvertAxis() {
    var invertAxisInput = document.getElementById("InvertAxis");
    var currentValue = parseInt(invertAxisInput.value);
    var newValue = (currentValue + 1) % 4;
    invertAxisInput.value = newValue;
    updateMPU6050Rotation(newValue);
}
