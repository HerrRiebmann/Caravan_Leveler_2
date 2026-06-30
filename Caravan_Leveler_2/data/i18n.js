/* Caravan Leveler — i18n (DE / EN)
   Stores preference in localStorage under key "lang".
   Auto-detects browser language as fallback (de → DE, everything else → EN).
   Usage in HTML:  data-i18n="key"   (replaces textContent)
   Usage in JS:    i18n.t("key")     (returns translated string)
   Language change: i18n.setLang('de') / i18n.setLang('en')
*/
(function () {
    'use strict';

    var T = {
        en: {
            // Navigation
            'nav.level':    'Level',
            'nav.settings': 'Settings',
            'nav.info':     'ESP32 Info',
            'nav.gyro':     'Gyroscope',
            'nav.voltage':  'Voltage',
            'nav.serial':   'Serial',
            'nav.upload':   'Upload',
            // Page titles
            'page.settings': 'Settings \uD83D\uDD27',
            'page.info':     'ESP32 Info \uD83D\uDCA1',
            'page.volt':     'Voltage Monitor \u26A1',
            'page.serial':   'Serial Monitor \uD83D\uDCFA',
            'page.gyro':     'Gyro Data \uD83D\uDCC8',
            'page.level':    'Leveler \uD83D\uDEE0\uFE0F',
            // Settings — tabs
            'set.tab.basic':    '\u2699 Basic',
            'set.tab.voltage':  '\u26A1 Voltage',
            'set.tab.wifi':     '\uD83D\uDCF6 WiFi',
            'set.tab.sensor':   '\uD83D\uDD17 Sensor',
            // Settings — field labels
            'set.range':   'Indicating Range',
            'set.serial':  'Serial Output',
            'set.damping': 'Damping',
            'set.invert':  'Invert Axis',
            'set.tap':     'Tap to rotate',
            'set.vpin':    'Voltage Pin',
            'set.vthresh': 'Voltage Threshold',
            'set.r1':      'Resistor 1',
            'set.r2':      'Resistor 2',
            'set.ap':      'Use Accesspoint',
            'set.appw':    'Accesspoint PW',
            'set.sda':     'SDA Pin',
            'set.scl':     'SCL Pin',
            'set.i2c':     'I\u00B2C Address',
            // Buttons
            'btn.save':      'Save',
            'btn.calibrate': 'Calibrate',
            'btn.restart':   'Restart',
            'btn.refresh':   'Refresh',
            // Tooltips
            'tip.serial':   'Enables the Micro-USB Serial Output with debugging information',
            'tip.damping':  'Smooths the level display to reduce jitter',
            'tip.vpin':     'Analog pin number for voltage measurement (0-36)',
            'tip.vthresh':  'Voltage threshold to correct measurement differences',
            'tip.r1':       'First resistor value in ohms for the voltage divider',
            'tip.r2':       'Second resistor value in ohms for the voltage divider',
            'tip.ap':       'Use Accesspoint mode, otherwise connect to an existing WiFi network',
            'tip.appw':     'Password for the Accesspoint',
            'tip.sda':      'I²C SDA pin number (0-36)',
            'tip.scl':      'I²C SCL pin number (0-36)',
            'tip.i2c':      'I²C address of the MPU6050 (0-128)',
            'tip.calibrate':'Set the current position as the zero/level reference',
            'tip.restart':  'Restart the ESP32 device',
            // Voltage page
            'volt.main':      'Main Voltage',
            'volt.secondary': 'Secondary Voltage',
            'volt.raw':       'Raw Input',
            'volt.channel':   'Channel',
            'volt.current':   'Current',
            'volt.min':       'Min',
            'volt.max':       'Max',
            // Serial page (incl. dynamic states)
            'serial.scroll.on':  'Auto Scroll: ON',
            'serial.scroll.off': 'Auto Scroll: OFF',
            'serial.clear':      'Clear Log',
            'serial.pause':      'Pause Updates',
            'serial.resume':     'Resume Updates',
            // Gyro data page
            'data.gyro':    'Gyro',
            'data.accel':   'Acceleration',
            'data.axis':    'Axis',
            'data.current': 'Current',
            'data.min':     'Min',
            'data.max':     'Max',
        },
        de: {
            // Navigation
            'nav.level':    'Wasserwaage',
            'nav.settings': 'Einstellungen',
            'nav.info':     'ESP32 Info',
            'nav.gyro':     'Gyrosensor',
            'nav.voltage':  'Spannung',
            'nav.serial':   'Seriell',
            'nav.upload':   'Hochladen',
            // Page titles
            'page.settings': 'Einstellungen \uD83D\uDD27',
            'page.info':     'ESP32 Info \uD83D\uDCA1',
            'page.volt':     'Spannungsmonitor \u26A1',
            'page.serial':   'Serieller Monitor \uD83D\uDCFA',
            'page.gyro':     'Gyro-Daten \uD83D\uDCC8',
            'page.level':    'Wasserwaage \uD83D\uDEE0\uFE0F',
            // Settings — tabs
            'set.tab.basic':    '\u2699 Basis',
            'set.tab.voltage':  '\u26A1 Spannung',
            'set.tab.wifi':     '\uD83D\uDCF6 WiFi',
            'set.tab.sensor':   '\uD83D\uDD17 Sensor',
            // Settings — field labels
            'set.range':   'Anzeigebereich',
            'set.serial':  'Serielle Ausgabe',
            'set.damping': 'Dämpfung',
            'set.invert':  'Achse invertieren',
            'set.tap':     'Tippen zum Drehen',
            'set.vpin':    'Spannungspin',
            'set.vthresh': 'Korrekturwert',
            'set.r1':      'Widerstand 1',
            'set.r2':      'Widerstand 2',
            'set.ap':      'Accesspoint verwenden',
            'set.appw':    'Accesspoint PW',
            'set.sda':     'SDA Pin',
            'set.scl':     'SCL Pin',
            'set.i2c':     'I\u00B2C Adresse',
            // Buttons
            'btn.save':      'Speichern',
            'btn.calibrate': 'Kalibrieren',
            'btn.restart':   'Neustart',
            'btn.refresh':   'Aktualisieren',
            // Tooltips
            'tip.serial':   'Aktiviert die serielle USB-Ausgabe mit Debug-Informationen',
            'tip.damping':  'Glättet die Anzeige der Wasserwaage für ein ruhigeres Bild',
            'tip.vpin':     'Analoger Pin für die Spannungsmessung (0-36)',
            'tip.vthresh':  'Schwellenwert zur Korrektur von Messabweichungen',
            'tip.r1':       'Erster Widerstandswert in Ohm für den Spannungsteiler',
            'tip.r2':       'Zweiter Widerstandswert in Ohm für den Spannungsteiler',
            'tip.ap':       'Als Accesspoint betreiben, andernfalls mit vorhandenem WLAN verbinden',
            'tip.appw':     'Passwort für den Accesspoint',
            'tip.sda':      'I²C SDA-Pinnummer (0-36)',
            'tip.scl':      'I²C SCL-Pinnummer (0-36)',
            'tip.i2c':      'I²C-Adresse des MPU6050 (0-128)',
            'tip.calibrate':'Aktuelle Position als Null-Referenz festlegen',
            'tip.restart':  'ESP32 neu starten',
            // Voltage page
            'volt.main':      'Hauptspannung',
            'volt.secondary': 'Nebenspannung',
            'volt.raw':       'Roheingang',
            'volt.channel':   'Kanal',
            'volt.current':   'Aktuell',
            'volt.min':       'Min',
            'volt.max':       'Max',
            // Serial page (incl. dynamic states)
            'serial.scroll.on':  'Auto-Scroll: AN',
            'serial.scroll.off': 'Auto-Scroll: AUS',
            'serial.clear':      'Log leeren',
            'serial.pause':      'Pause',
            'serial.resume':     'Fortsetzen',
            // Gyro data page
            'data.gyro':    'Gyroskop',
            'data.accel':   'Beschleunigung',
            'data.axis':    'Achse',
            'data.current': 'Aktuell',
            'data.min':     'Min',
            'data.max':     'Max',
        }
    };

    function detect() {
        try {
            var s = localStorage.getItem('lang');
            if (s === 'de' || s === 'en') return s;
        } catch (e) {}
        return (navigator.language || navigator.userLanguage || 'en').toLowerCase().indexOf('de') === 0 ? 'de' : 'en';
    }

    function applyAll(lang) {
        var dict = T[lang] || T.en;
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var v = dict[el.getAttribute('data-i18n')];
            if (v !== undefined) el.textContent = v;
        });
        document.querySelectorAll('[data-i18n-tooltip]').forEach(function (el) {
            var v = dict[el.getAttribute('data-i18n-tooltip')];
            if (v !== undefined) el.setAttribute('data-tooltip', v);
        });
        document.documentElement.lang = lang;
        // Highlight active switcher buttons (works in same document)
        var btnEn = document.getElementById('lang-btn-en');
        var btnDe = document.getElementById('lang-btn-de');
        if (btnEn) btnEn.classList.toggle('lang-btn-active', lang === 'en');
        if (btnDe) btnDe.classList.toggle('lang-btn-active', lang === 'de');
    }

    window.i18n = {
        /** Translate a key programmatically */
        t: function (key) {
            var d = T[detect()] || T.en;
            return d[key] !== undefined ? d[key] : key;
        },
        /** Change language, persist, re-apply DOM */
        setLang: function (lang) {
            try { localStorage.setItem('lang', lang); } catch (e) {}
            applyAll(lang);
        },
        /** Current language */
        getLang: detect
    };

    document.addEventListener('DOMContentLoaded', function () {
        applyAll(detect());
    });
})();
