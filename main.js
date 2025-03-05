const { app, BrowserWindow, Tray, Menu, ipcMain, dialog, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

let tray = null;
let win = null;
let dashboardWin = null;

// Default crosshair settings
let crosshairSettings = {
  color: '#FFFFFF',
  size: 4,
  thickness: 2,
  style: 'dot', // dot, cross, circle, dot_circle
  toggleKey: 'F8' // Default toggle key
};

// Load settings if they exist
function loadSettings() {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      crosshairSettings = JSON.parse(data);
      
      // Handle legacy 'dot_cross' style
      if (crosshairSettings.style === 'dot_cross') {
        crosshairSettings.style = 'dot_circle';
      }
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

// Save settings
function saveSettings() {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(crosshairSettings), 'utf8');
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1920,
    height: 1080,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    focusable: false,
    type: 'toolbar'
  });

  win.loadFile('index.html');
  win.setIgnoreMouseEvents(true);
  win.setFullScreen(true);
  win.setSkipTaskbar(true);
  win.setAlwaysOnTop(true, 'screen-saver');
  
  // Send settings to the renderer when the window is loaded
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('update-crosshair', crosshairSettings);
  });
}

function createDashboard() {
  dashboardWin = new BrowserWindow({
    width: 600,
    height: 800,
    title: 'Crosshair Settings',
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    resizable: true,
    minWidth: 550,
    minHeight: 700,
    show: false,
    skipTaskbar: false,
    autoHideMenuBar: true
  });

  dashboardWin.loadFile('dashboard.html');
  dashboardWin.setMenu(null);
  
  dashboardWin.webContents.on('did-finish-load', () => {
    dashboardWin.webContents.send('init-settings', crosshairSettings);
  });

  dashboardWin.on('close', (e) => {
    e.preventDefault();
    dashboardWin.hide();
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'icon.ico');
  tray = new Tray(iconPath);
  
  // Set the image to be displayed when hovering over the tray icon
  if (process.platform === 'win32') {
    tray.setImage(iconPath);
  }
  
  updateTrayMenu();
}

// Function to update the tray menu (can be called when settings change)
function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Settings',
      click: () => {
        if (dashboardWin) {
          dashboardWin.show();
        }
      }
    },
    {
      label: `Show/Hide Crosshair (${crosshairSettings.toggleKey || 'No key set'})`,
      click: () => {
        if (win.isVisible()) {
          win.hide();
        } else {
          win.show();
        }
      }
    },
    {
      label: 'Pin to Taskbar',
      click: () => {
        if (dashboardWin) {
          dashboardWin.show();
          // Add a message to instruct user how to pin
          dialog.showMessageBox(dashboardWin, {
            type: 'info',
            title: 'Pin to Taskbar',
            message: 'To pin Crosshair to your taskbar:',
            detail: '1. Right-click on the Crosshair icon in your taskbar\n2. Select "Pin to taskbar"\n\nThe app will now stay in your taskbar for easy access.',
            buttons: ['OK']
          });
        }
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Crosshair');
  tray.setContextMenu(contextMenu);
}

// Register global shortcut for toggling crosshair
function registerToggleShortcut() {
  // Unregister any existing shortcuts first
  globalShortcut.unregisterAll();
  
  // Register the shortcut from settings
  if (crosshairSettings.toggleKey) {
    try {
      globalShortcut.register(crosshairSettings.toggleKey, () => {
        if (win.isVisible()) {
          win.hide();
        } else {
          win.show();
        }
      });
    } catch (err) {
      console.error('Failed to register shortcut:', err);
    }
  }
}

// Set app identity
app.setAppUserModelId('com.dayz.crosshair');
app.name = 'DayZ Crosshair';

app.whenReady().then(() => {
  loadSettings();
  createWindow();
  createDashboard();
  createTray();
  registerToggleShortcut();
  
  // Set up IPC listeners
  ipcMain.on('update-settings', (event, settings) => {
    const previousToggleKey = crosshairSettings.toggleKey;
    crosshairSettings = settings;
    saveSettings();
    
    // Re-register shortcut if the key changed
    if (previousToggleKey !== settings.toggleKey) {
      registerToggleShortcut();
    }
    
    // Update the crosshair display
    if (win) {
      win.webContents.send('update-crosshair', settings);
    }
    
    // Update the tray menu to reflect new hotkey
    updateTrayMenu();
  });
  
  // Add listener for getting valid keyboard shortcuts
  ipcMain.handle('get-valid-shortcuts', () => {
    return [
      'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
      'Ctrl+F1', 'Ctrl+F2', 'Ctrl+F3', 'Ctrl+F4', 'Ctrl+F5', 'Ctrl+F6',
      'Alt+F1', 'Alt+F2', 'Alt+F3', 'Alt+F4', 'Alt+F5', 'Alt+F6',
      'Shift+F1', 'Shift+F2', 'Shift+F3', 'Shift+F4', 'Shift+F5', 'Shift+F6'
    ];
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  // Unregister all shortcuts when app is about to quit
  globalShortcut.unregisterAll();
});

app.on('quit', () => {
  saveSettings();
}); 