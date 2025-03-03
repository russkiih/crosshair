const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let tray = null;
let win = null;
let dashboardWin = null;

// Default crosshair settings
let crosshairSettings = {
  color: '#FFFFFF',
  size: 4,
  style: 'dot' // dot, cross, circle, dot_circle
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
    width: 450,
    height: 600,
    title: 'Crosshair Settings',
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    resizable: false,
    show: false
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
      label: 'Show/Hide Crosshair',
      click: () => {
        if (win.isVisible()) {
          win.hide();
        } else {
          win.show();
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

  tray.setToolTip('DayZ Crosshair');
  tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
  loadSettings();
  createWindow();
  createDashboard();
  createTray();
  
  // Set up IPC listeners
  ipcMain.on('update-settings', (event, settings) => {
    crosshairSettings = settings;
    saveSettings();
    if (win) {
      win.webContents.send('update-crosshair', settings);
    }
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

app.on('quit', () => {
  saveSettings();
}); 