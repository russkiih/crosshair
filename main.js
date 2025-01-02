const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');

let tray = null;
let win = null;

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
  createWindow();
  createTray();
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