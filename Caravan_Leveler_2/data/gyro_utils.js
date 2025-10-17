"use strict";

// Shared gyroscope utility functions
class GyroManager {
    constructor(options = {}) {
        this.gyroSupported = false;
        this.gyroPermissionGranted = false;
        this.mobileGyroInterval = null;
        this.dataReceived = false;
        this.dataCheckCount = 0;
        this.orientationHandler = null;
        this.statusMessageSet = false; // Track if status message has been set
        
        // Callbacks provided by the using module
        this.onGyroData = options.onGyroData || (() => {});
        this.onStatusUpdate = options.onStatusUpdate || (() => {});
        this.onFallbackToSimulation = options.onFallbackToSimulation || (() => {});
        this.logFunction = options.logFunction || this.safeLog;
        
        // Configuration
        this.identifier = options.identifier || 'default';
        this.threshold = options.threshold || 10;
    }
    
    // Safe console logging for browser compatibility
    safeLog() {
        if (typeof console !== 'undefined' && console.log) {
            try {
                console.log.apply(console, arguments);
            } catch (e) {
                // Ignore console errors in Edge
            }
        }
    }
    
    isMobileDevice() {
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
            
            // Check for Edge mobile simulation mode (dev tools)
            const isEdgeMobileSimulation = isEdgeOnWindows && hasTouch && window.screen.width <= 768;
            
            // If it's Edge on Windows with high touch points and narrow screen, it's likely mobile simulation
            if (isEdgeMobileSimulation) {
                this.logFunction(`${this.identifier}: Edge mobile simulation mode detected (dev tools)`);
                return true; // Treat as mobile but will have short gyro timeout
            }
            
            // If it's Edge on Windows with high touch points but wide screen, it's likely a desktop with touch capability
            if (isEdgeOnWindows && hasTouch && !isMobileOS && window.screen.width > 768) {
                this.logFunction(`${this.identifier}: Edge on Windows detected with touch capability - treating as desktop`);
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
            this.logFunction(`${this.identifier}: Mobile detection error:`, e);
            return false;
        }
    }
    
    requestGyroPermission() {
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const isAndroid = /android/i.test(navigator.userAgent);
        
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+ requires explicit permission
            this.logFunction(`${this.identifier}: iOS device detected, requesting permission`);
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        this.gyroPermissionGranted = true;
                        this.startMobileGyro();
                    } else {
                        this.logFunction(`${this.identifier}: Device orientation permission denied`);
                        this.onStatusUpdate("Gyroscope permission denied", true);
                        this.showGyroPermissionButton();
                    }
                })
                .catch(error => {
                    this.logFunction(`${this.identifier}: Error requesting device orientation permission:`, error);
                    this.onStatusUpdate("Tap 📱 to enable gyroscope", false);
                    this.showGyroPermissionButton();
                });
        } else if ('DeviceOrientationEvent' in window) {
            // Android and older iOS - no permission needed
            this.logFunction(`${this.identifier}: Android/older iOS device detected, starting gyroscope directly`);
            this.gyroPermissionGranted = true;
            this.startMobileGyro();
        } else {
            this.logFunction(`${this.identifier}: Device orientation not supported`);
            this.onFallbackToSimulation();
        }
    }
    
    startMobileGyro() {
        this.gyroSupported = true;
        this.resetStatus(); // Reset status flag for new attempt
        this.onStatusUpdate("Connecting to gyroscope...", false);
        
        this.dataReceived = false;
        this.dataCheckCount = 0;
        
        this.orientationHandler = (event) => {
            // Check if we're actually getting meaningful data
            if (event.alpha !== null || event.beta !== null || event.gamma !== null) {
                if (!this.dataReceived) {
                    this.dataReceived = true;
                    this.onStatusUpdate("Using device gyroscope", false);
                    this.logFunction(`${this.identifier}: Gyroscope data received successfully`);
                }
                this.handleDeviceOrientation(event);
            }
        };
        
        window.addEventListener('deviceorientation', this.orientationHandler, true);
        
        // For Android devices, extend timeout and check more thoroughly
        const isAndroid = /android/i.test(navigator.userAgent);
        const isEdgeDevTools = /edg/i.test(navigator.userAgent) && this.isMobileDevice();
        
        // Use shorter timeout for Edge dev tools mobile simulation (likely no real sensors)
        let timeout = 3000; // Default 3 seconds
        if (isAndroid && !isEdgeDevTools) {
            timeout = 8000; // 8 seconds for real Android devices
        } else if (isEdgeDevTools) {
            timeout = 2000; // 2 seconds for Edge mobile simulation (faster fallback)
            this.logFunction(`${this.identifier}: Edge mobile simulation detected, using shorter timeout`);
        }
        
        // Check periodically if data is being received
        const checkInterval = setInterval(() => {
            this.dataCheckCount++;
            this.logFunction(`${this.identifier}: Gyroscope check ${this.dataCheckCount}, data received: ${this.dataReceived}`);
            
            if (this.dataReceived) {
                clearInterval(checkInterval);
            } else if (this.dataCheckCount >= (timeout / 1000)) {
                // Timeout reached without data
                clearInterval(checkInterval);
                const deviceType = isEdgeDevTools ? 'Edge mobile simulation' : 'device';
                this.logFunction(`${this.identifier}: No gyroscope data received from ${deviceType} after timeout, falling back to simulation`);
                this.stopMobileGyro();
                this.onFallbackToSimulation();
            }
        }, 1000);
    }
    
    handleDeviceOrientation(event) {
        if (!this.gyroSupported) return;
        
        // DeviceOrientationEvent provides:
        // - beta: front-to-back tilt in degrees (-180 to 180) - corresponds to pitch (Y axis)
        // - gamma: left-to-right tilt in degrees (-90 to 90) - corresponds to roll (X axis)
        
        let roll = event.beta || 0;   // Y axis (front-back tilt)
        let pitch = event.gamma || 0; // X axis (left-right tilt)
        
        // Get threshold from options or use default
        const threshold = this.threshold || 10;
        
        // Clamp values to threshold
        pitch = Math.max(-threshold * 2, Math.min(threshold * 2, pitch));
        roll = Math.max(-threshold * 2, Math.min(threshold * 2, roll));
        
        // Call the provided callback with gyro data (X, Y format)
        this.onGyroData(pitch, roll, threshold, 12.4, 22.8);
    }
    
    stopMobileGyro() {
        if (this.mobileGyroInterval) {
            clearInterval(this.mobileGyroInterval);
            this.mobileGyroInterval = null;
        }
        if (this.orientationHandler) {
            window.removeEventListener('deviceorientation', this.orientationHandler, true);
            this.orientationHandler = null;
        }
        this.gyroSupported = false;
        this.dataReceived = false;
    }
    
    requestGyroManually() {
        const btn = document.getElementById('gyroPermissionBtn');
        if (btn) btn.style.display = 'none';
        
        if (this.isMobileDevice()) {
            this.stopMobileGyro(); // Stop any existing simulation
            this.requestGyroPermission();
        }
    }
    
    showGyroPermissionButton() {
        const btn = document.getElementById('gyroPermissionBtn');
        if (btn && this.isMobileDevice()) {
            btn.style.display = 'inline-block';
        }
    }
    
    // Check if gyroscope is currently active
    isGyroActive() {
        return this.gyroSupported && this.dataReceived;
    }
    
    // Check if simulation interval is running
    hasSimulationInterval() {
        return this.mobileGyroInterval !== null;
    }
    
    // Set status message only once to avoid repetition
    setStatusOnce(message, isError = false) {
        if (!this.statusMessageSet) {
            this.statusMessageSet = true;
            this.onStatusUpdate(message, isError);
        }
    }
    
    // Reset status message flag (useful when switching modes)
    resetStatus() {
        this.statusMessageSet = false;
    }
}

// Global gyroscope managers for each module
window.GyroManager = GyroManager;