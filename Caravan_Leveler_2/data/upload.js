function Upload() {
    document.body.style.cursor = 'progress';
    FileChange();
    document.getElementsByClassName('dimmer')[0].style.display = 'block';
    
    // Check if running in PC mode and mock the upload
    if (window.AppState && window.AppState.PCVersion) {
        mockUpload();
    } else {
        // Test if we can reach the server before attempting upload
        checkServerConnectivity();
    }
}

function checkServerConnectivity() {
    const testRequest = new XMLHttpRequest();
    testRequest.open("GET", "/update", true);
    testRequest.timeout = 1000; // 1 second timeout
    
    testRequest.onload = function() {
        if (testRequest.readyState === 4) {
            // Server responded, proceed with real upload
            document.getElementById("UploadForm").submit();
        }
    };
    
    testRequest.onerror = function() {
        // Server not reachable, we're in PC mode
        if (window.AppState) {
            window.AppState.PCVersion = true;
        }
        mockUpload();
    };
    
    testRequest.ontimeout = function() {
        // Timeout, assume PC mode
        if (window.AppState) {
            window.AppState.PCVersion = true;
        }
        mockUpload();
    };
    
    testRequest.send(null);
}
function FileChange() {
    var fileList = document.getElementById("uploadFile").files;
    var file = fileList[0];
    if (!file)
        return;
    document.getElementById("fileName").innerHTML = 'Name: ' + file.name;
    document.getElementById("fileSize").innerHTML = 'Size: ' + humanFileSize(file.size);
    document.getElementById("fileType").innerHTML = 'Type: ' + file.type;
}
function humanFileSize(size) {
    var i = Math.floor(Math.log(size) / Math.log(1024));
    return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}

function mockUpload() {
    const progressBar = document.getElementById("progress");
    if (!progressBar) return;
    
    let progress = 0;
    progressBar.value = 0;
    progressBar.max = 100;
    
    // Simulate upload progress over 3 seconds
    const interval = setInterval(() => {
        progress += Math.random() * 15 + 5; // Random progress increments
        if (progress >= 100) {
            progress = 100;
            progressBar.value = progress;
            clearInterval(interval);
            
            // Show completion for a moment, then return to main page
            setTimeout(() => {
                document.getElementsByClassName('dimmer')[0].style.display = 'none';
                document.body.style.cursor = 'default';
                
                // If we're in an iframe (which we likely are), navigate the parent
                if (window.parent && window.parent !== window) {
                    window.parent.location.href = 'index.html';
                } else {
                    window.location.href = 'index.html';
                }
            }, 500);
        } else {
            progressBar.value = progress;
        }
    }, 100); // Update every 100ms
}
