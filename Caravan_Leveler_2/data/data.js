let mode = "gyro"; // gyro oder accel
let chart;
let history = { x: [], y: [], z: [] };
let minmax = {
    gyro: { x: [9999, -9999], y: [9999, -9999], z: [9999, -9999] },
    accel: { x: [9999, -9999], y: [9999, -9999], z: [9999, -9999] }
};

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

function GetRawData() {
    if (window.AppState.PCVersion) {
        FakeSomeData();
        return;
    }
    if (!window.AppState.ADXL345_Initialized) return;
    var oRequest = new XMLHttpRequest();
    var sURL = '/data';
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
    oRequest.onerror = function (e) {
        SetOutput("Get raw data Error!", true);
        window.AppState.PCVersion = true;
    };
    oRequest.send(null);
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
    DisplayRawData(arr);
}
