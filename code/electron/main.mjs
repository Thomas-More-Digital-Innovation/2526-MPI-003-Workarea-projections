import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron';
import path from 'path';
import url from 'url';
import Database from 'better-sqlite3';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../data/app.db');
const db = new Database(dbPath);

// Maak tabellen aan volgens ERD
db.prepare(`CREATE TABLE IF NOT EXISTS Task (
  taskId INTEGER PRIMARY KEY AUTOINCREMENT,
  taskName TEXT NOT NULL
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS GridLayout (
  gridLayoutId INTEGER PRIMARY KEY AUTOINCREMENT,
  rowAmount INTEGER NOT NULL,
  colAmount INTEGER NOT NULL,
  amountPerPage INTEGER NOT NULL,
  shape TEXT NOT NULL,
  size TEXT NOT NULL
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS Preset (
  presetId INTEGER PRIMARY KEY AUTOINCREMENT,
  amountTotal INTEGER NOT NULL,
  gridLayoutId INTEGER,
  FOREIGN KEY (gridLayoutId) REFERENCES GridLayout(gridLayoutId)
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS Image (
  imageId INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  description TEXT
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS Step (
  stepId INTEGER PRIMARY KEY AUTOINCREMENT,
  taskId INTEGER,
  presetId INTEGER,
  imageId INTEGER,
  step INTEGER NOT NULL,
  description TEXT,
  FOREIGN KEY (taskId) REFERENCES Task(taskId),
  FOREIGN KEY (presetId) REFERENCES Preset(presetId),
  FOREIGN KEY (imageId) REFERENCES Image(imageId)
)`).run();

// Voeg voorbeelddata toe als de tabellen leeg zijn
if (db.prepare('SELECT COUNT(*) AS count FROM Task').get().count === 0) {
  db.prepare('INSERT INTO Task (taskName) VALUES (?)').run('Voorbeeld Taak');
}

if (db.prepare('SELECT COUNT(*) AS count FROM GridLayout').get().count === 0) {
  db.prepare('INSERT INTO GridLayout (rowAmount, colAmount, amountPerPage, shape, size) VALUES (?, ?, ?, ?, ?)')
    .run(3, 4, 12, 'rectangle', 'medium');
}

if (db.prepare('SELECT COUNT(*) AS count FROM Preset').get().count === 0) {
  db.prepare('INSERT INTO Preset (amountTotal, gridLayoutId) VALUES (?, ?)')
    .run(24, 1);
}

if (db.prepare('SELECT COUNT(*) AS count FROM Image').get().count === 0) {
  db.prepare('INSERT INTO Image (path, description) VALUES (?, ?)')
    .run('images/example.jpg', 'Voorbeeld afbeelding');
}

if (db.prepare('SELECT COUNT(*) AS count FROM Step').get().count === 0) {
  db.prepare('INSERT INTO Step (taskId, presetId, imageId, step, description) VALUES (?, ?, ?, ?, ?)')
    .run(1, 1, 1, 1, 'Eerste stap van voorbeeld');
}

// Voorbeeld uitlezen van data

// IPC handlers voor Image CRUD
ipcMain.handle('images:getAll', () => {
  return db.prepare('SELECT * FROM Image').all();
});

ipcMain.handle('images:add', (event, { path, description }) => {
  const stmt = db.prepare('INSERT INTO Image (path, description) VALUES (?, ?)');
  const info = stmt.run(path, description);
  return { imageId: info.lastInsertRowid, path, description };
});

ipcMain.handle('images:delete', (event, imageId) => {
  db.prepare('DELETE FROM Image WHERE imageId = ?').run(imageId);
  return { success: true };
});

// IPC handler for adding image file from frontend
ipcMain.handle('images:addFile', async (event, file, description) => {
  // file: { name, buffer (Uint8Array) }
  const imagesDir = path.join(__dirname, '../public/images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  const filePath = path.join(imagesDir, file.name);
  fs.writeFileSync(filePath, Buffer.from(file.buffer));
  const relPath = `images/${file.name}`;
  const stmt = db.prepare('INSERT INTO Image (path, description) VALUES (?, ?)');
  const info = stmt.run(relPath, description);
  return { imageId: info.lastInsertRowid, path: relPath, description };
});

function createWindow() {
  const mainWindow = new BrowserWindow({
  width: 1920,
  height: 1080,
  minWidth: 1920,   
  minHeight: 1080,  
  resizable: true,  
  maximizable: true,
  minimizable: true,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: false,
    preload: path.join(__dirname, 'preload.cjs'), // <-- Add this line
  },
});

  mainWindow.maximize();

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, '../out/index.html'),
        protocol: 'file:',
        slashes: true,
      })
    );
  }
}

app.whenReady().then(() => {
  const mainWindow = createWindow();
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.openDevTools();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
