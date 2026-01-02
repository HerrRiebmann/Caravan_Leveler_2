let mode = "main"; // main, secondary, or raw
let chart;
let history = { main: [], secondary: [], raw: [] };
let minmax = {
    main: [9999, -9999],
    secondary: [9999, -9999], 
    raw: [9999, -9999]
};

window.onload = () => {
    let ctx = document.getElementById('voltageChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(50).fill(""),
            datasets: [
                { 
                    label: "Main Voltage", 
                    borderColor: "red", 
                    data: [], 
                    fill: false,
                    hidden: false
                },
                { 
                    label: "Secondary Voltage", 
                    borderColor: "green", 
                    data: [], 
                    fill: false,
                    hidden: true
                },
                { 
                    label: "Raw Input", 
                    borderColor: "blue", 
                    data: [], 
                    fill: false,
                    hidden: true
                }
            ]
        },
        options: {
            responsive: true,
            animation: false,
            scales: {
                x: { display: false },
                y: { 
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Voltage (V)'
                    }
                }
            }
        }
    });
    setMode(mode);
    setInterval(GetVoltageData, 1000); // Update every second
};

function GetVoltageData() {
    if (window.AppState.PCVersion) {
        FakeSomeVoltageData();
        return;
    }
    if (!window.AppState.voltageInitialized) return;
    var oRequest = new XMLHttpRequest();
    var sURL = '/voltage';
    oRequest.open("GET", sURL, true);
    oRequest.onload = function (e) {
        if (oRequest.readyState === 4) {
            if (oRequest.status === 200) {
                var arr = oRequest.responseText.split("|");
                DisplayVoltageData(arr);
            } else if (oRequest.status === 404 || oRequest.status === 0) {
                // 404 or network error - switch to PC mode
                window.AppState.PCVersion = true;
                SetOutput("PC Demo mode!", false);
            } else {
                SetOutput(oRequest.responseText, true);
                window.AppState.voltageInitialized = false;
            }
        }
    };
    oRequest.onerror = function (e) {
        SetOutput("Get voltage data Error!", true);
        window.AppState.PCVersion = true;
        SetOutput("PC Demo mode!", false);
    };
    oRequest.send(null);
}

function DisplayVoltageData(parts) {
    // Expected format: "12.83|2348|2.21|0.00"
    // parts[0] = main voltage, parts[1] = raw input, parts[2] = secondary voltage, parts[3] = unused
    let data = {
        main: parseFloat(parts[0]),
        secondary: parseFloat(parts[2]),
        raw: parseFloat(parts[1])
    };
    updateChart(data);
    updateTable(data);
}

function setMode(m) {
    mode = m;
    
    // Hide all datasets first
    chart.data.datasets.forEach((ds, i) => {
        ds.hidden = true;
    });
    
    // Show only the selected dataset
    switch(mode) {
        case 'main':
            chart.data.datasets[0].hidden = false;
            chart.data.datasets[0].data = history.main;
            break;
        case 'secondary':
            chart.data.datasets[1].hidden = false;
            chart.data.datasets[1].data = history.secondary;
            break;
        case 'raw':
            chart.data.datasets[2].hidden = false;
            chart.data.datasets[2].data = history.raw;
            break;
    }
    
    chart.update();
    
    // Update button colors
    document.getElementById("main").style.backgroundColor = mode === 'main' ? COLORS.ERROR_RED : COLORS.BRAND_BLUE;
    document.getElementById("secondary").style.backgroundColor = mode === 'secondary' ? COLORS.ERROR_RED : COLORS.BRAND_BLUE;
    document.getElementById("raw").style.backgroundColor = mode === 'raw' ? COLORS.ERROR_RED : COLORS.BRAND_BLUE;
}

function updateChart(values) {
    // Update history for all channels
    Object.keys(values).forEach(channel => {
        history[channel].push(values[channel]);
        if (history[channel].length > 50) history[channel].shift();
    });
    
    // Update the chart data for all datasets
    chart.data.datasets[0].data = history.main;
    chart.data.datasets[1].data = history.secondary;
    chart.data.datasets[2].data = history.raw;
    
    chart.update();
}

function updateTable(values) {
    let html = "";
    
    // Display data based on current mode
    let channels = [];
    switch(mode) {
        case 'main':
            channels = [{ name: 'Main', key: 'main', color: 'red' }];
            break;
        case 'secondary':
            channels = [{ name: 'Secondary', key: 'secondary', color: 'green' }];
            break;
        case 'raw':
            channels = [{ name: 'Raw', key: 'raw', color: 'blue' }];
            break;
    }
    
    channels.forEach(channel => {
        let v = values[channel.key];
        let mm = minmax[channel.key];
        if (v < mm[0]) mm[0] = v;
        if (v > mm[1]) mm[1] = v;
        
        let unit = channel.key === 'raw' ? '' : 'V';
        html += `<tr>
            <td style="color:${channel.color}">${channel.name}</td>
            <td style="color:${COLORS.TEXT_GRAY}">${v.toFixed(2)}${unit}</td>
            <td>${mm[0].toFixed(2)}${unit}</td>
            <td style="color:${COLORS.BRAND_BLUE}">${mm[1].toFixed(2)}${unit}</td>
        </tr>`;
    });
    
    document.getElementById("voltageTable").innerHTML = html;
}

function FakeSomeVoltageData() {
    // Generate fake voltage data for testing
    let mainVoltage = 12.0 + (Math.random() * 2 - 1); // 11-13V
    let secondaryVoltage = 2.0 + (Math.random() * 0.5 - 0.25); // 1.75-2.25V
    let rawInput = 2000 + Math.floor(Math.random() * 400 - 200); // 1800-2200
    
    let arr = [mainVoltage.toFixed(2), rawInput.toString(), secondaryVoltage.toFixed(2), "0.00"];
    DisplayVoltageData(arr);
}
