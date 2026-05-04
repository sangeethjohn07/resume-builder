/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 950,
    minWidth: 1100,
    minHeight: 750,
    title: "Resume Tailor AI",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL("http://localhost:3000");

  win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
