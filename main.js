const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1250,
        height: 850,
        minWidth: 1000,
        minHeight: 700,
        title: "Sim Utility Hub Pro",
        backgroundColor: '#050505',
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');
    mainWindow.setMenuBarVisibility(false);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

// NOVO: Handler para obter a pasta de Downloads padrão do Windows do utilizador
ipcMain.handle('get-default-downloads', () => {
    return app.getPath('downloads');
});

// Handler para selecionar pasta manualmente
ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Select Download Folder'
    });
    return result.canceled ? null : result.filePaths[0];
});

// NOVO: Abrir pasta com verificação de existência para evitar erro do Windows
ipcMain.on('open-folder-safe', (event, folderPath) => {
    if (fs.existsSync(folderPath)) {
        shell.openPath(folderPath);
    } else {
        dialog.showErrorBox("Folder Not Found", `The folder "${folderPath}" does not exist. Please update it in Settings.`);
    }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});