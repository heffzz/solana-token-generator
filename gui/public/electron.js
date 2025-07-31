const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');

let mainWindow;
let tokenGeneratorProcess;
let daoProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    title: 'LUNACOIN - Sistema Autonomo Token SPL'
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Menu personalizzato
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Esporta Configurazione',
          click: () => {
            mainWindow.webContents.send('export-config');
          }
        },
        {
          label: 'Importa Configurazione',
          click: () => {
            mainWindow.webContents.send('import-config');
          }
        },
        { type: 'separator' },
        {
          label: 'Esci',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Sistema',
      submenu: [
        {
          label: 'Avvia Generatore Token',
          click: () => {
            startTokenGenerator();
          }
        },
        {
          label: 'Ferma Generatore Token',
          click: () => {
            stopTokenGenerator();
          }
        },
        { type: 'separator' },
        {
          label: 'Avvia DAO',
          click: () => {
            startDAO();
          }
        },
        {
          label: 'Ferma DAO',
          click: () => {
            stopDAO();
          }
        }
      ]
    },
    {
      label: 'Visualizza',
      submenu: [
        {
          label: 'Ricarica',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: 'Strumenti Sviluppatore',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function startTokenGenerator() {
  if (tokenGeneratorProcess) {
    console.log('Token generator già in esecuzione');
    return;
  }

  tokenGeneratorProcess = spawn('npm', ['start'], {
    cwd: path.join(__dirname, '../../'),
    stdio: 'pipe'
  });

  tokenGeneratorProcess.stdout.on('data', (data) => {
    mainWindow.webContents.send('token-generator-log', data.toString());
  });

  tokenGeneratorProcess.stderr.on('data', (data) => {
    mainWindow.webContents.send('token-generator-error', data.toString());
  });

  tokenGeneratorProcess.on('close', (code) => {
    console.log(`Token generator terminato con codice ${code}`);
    tokenGeneratorProcess = null;
    mainWindow.webContents.send('token-generator-stopped');
  });
}

function stopTokenGenerator() {
  if (tokenGeneratorProcess) {
    tokenGeneratorProcess.kill();
    tokenGeneratorProcess = null;
  }
}

function startDAO() {
  if (daoProcess) {
    console.log('DAO già in esecuzione');
    return;
  }

  daoProcess = spawn('npm', ['start'], {
    cwd: path.join(__dirname, '../../token_project/dao'),
    stdio: 'pipe'
  });

  daoProcess.stdout.on('data', (data) => {
    mainWindow.webContents.send('dao-log', data.toString());
  });

  daoProcess.stderr.on('data', (data) => {
    mainWindow.webContents.send('dao-error', data.toString());
  });

  daoProcess.on('close', (code) => {
    console.log(`DAO terminato con codice ${code}`);
    daoProcess = null;
    mainWindow.webContents.send('dao-stopped');
  });
}

function stopDAO() {
  if (daoProcess) {
    daoProcess.kill();
    daoProcess = null;
  }
}

// IPC handlers
ipcMain.handle('start-token-generator', startTokenGenerator);
ipcMain.handle('stop-token-generator', stopTokenGenerator);
ipcMain.handle('start-dao', startDAO);
ipcMain.handle('stop-dao', stopDAO);

ipcMain.handle('get-system-status', () => {
  return {
    tokenGenerator: !!tokenGeneratorProcess,
    dao: !!daoProcess
  };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  stopTokenGenerator();
  stopDAO();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  stopTokenGenerator();
  stopDAO();
});