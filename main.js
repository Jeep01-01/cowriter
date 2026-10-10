const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const fs = require('fs');
const path = require('path');
let win;
function openArg(argv) {
  const f = argv.find(a => /\.(docx|txt|html?)$/i.test(a) && fs.existsSync(a));
  if (f && win) win.webContents.send('open-file', { name: path.basename(f), data: fs.readFileSync(f) });
}
function create() {
  win = new BrowserWindow({
    width: 1280, height: 860, title: 'ColorWriter', icon: path.join(__dirname, 'icon.ico'),
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), spellcheck: true, contextIsolation: true }
  });
  win.setMenu(null);
  win.loadFile('index.html');
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.once('did-finish-load', () => openArg(process.argv));
}
const lock = app.requestSingleInstanceLock();
if (!lock) app.quit();
else {
  app.on('second-instance', (e, argv) => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); openArg(argv); } });
  app.whenReady().then(create);
  app.on('window-all-closed', () => app.quit());
}
ipcMain.handle('save-pdf', async (e, name) => {
  const data = await win.webContents.printToPDF({ printBackground: true, preferCSSPageSize: true });
  const r = await dialog.showSaveDialog(win, { defaultPath: (name || 'Document') + '.pdf', filters: [{ name: 'PDF', extensions: ['pdf'] }] });
  if (!r.canceled && r.filePath) { fs.writeFileSync(r.filePath, data); return r.filePath; }
  return null;
});
