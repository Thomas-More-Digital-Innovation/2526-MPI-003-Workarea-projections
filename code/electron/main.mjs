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
db.prepare(`CREATE TABLE IF NOT EXISTS GridLayout (
  gridLayoutId INTEGER PRIMARY KEY AUTOINCREMENT,
  amount INTEGER NOT NULL,
  shape TEXT NOT NULL,
  size TEXT NOT NULL
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS Preset (
  presetId INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS Image (
  imageId INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  description TEXT NOT NULL
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS Step (
  stepId INTEGER PRIMARY KEY AUTOINCREMENT,
  step INTEGER NOT NULL,
  imageId INTEGER NOT NULL,
  gridLayoutId INTEGER,
  presetId INTEGER,
  FOREIGN KEY (imageId) REFERENCES Image(imageId),
  FOREIGN KEY (gridLayoutId) REFERENCES GridLayout(gridLayoutId),
  FOREIGN KEY (presetId) REFERENCES Preset(presetId)
)`).run();

// Voeg voorbeelddata toe als de tabellen leeg zijn
if (db.prepare('SELECT COUNT(*) AS count FROM GridLayout').get().count === 0) {
  db.prepare('INSERT INTO GridLayout (amount, shape, size) VALUES (?, ?, ?)')
    .run(12, 'rectangle', 'medium');
}

if (db.prepare('SELECT COUNT(*) AS count FROM Preset').get().count === 0) {
  db.prepare('INSERT INTO Preset (name, description) VALUES (?, ?)')
    .run('Voorbeeld Preset', 'Dit is een voorbeeldpreset');
}

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
  // Find image row first
  const img = db.prepare('SELECT * FROM Image WHERE imageId = ?').get(imageId);
  if (!img) {
    return { success: false, error: 'Image not found' };
  }

  // Remove any Steps that reference this image to avoid foreign key constraint errors
  try {
    db.prepare('DELETE FROM Step WHERE imageId = ?').run(imageId);
  } catch (err) {
    console.error('Failed to delete referencing Steps for image', imageId, err);
    // proceed — we'll still attempt to delete the image row
  }

  // Delete the image row from the database
  try {
    db.prepare('DELETE FROM Image WHERE imageId = ?').run(imageId);
  } catch (err) {
    console.error('Failed to delete Image row', imageId, err);
    return { success: false, error: 'Failed to delete image row' };
  }

  // Attempt to delete the physical file from the public directory
  try {
    // img.path is stored like 'images/filename.ext'
    const resolved = path.resolve(__dirname, '..', img.path);
    const publicDir = path.resolve(__dirname, '..', 'public');
    // Safety: ensure the file lies inside the public directory
    if (resolved.startsWith(publicDir)) {
      if (fs.existsSync(resolved)) {
        fs.unlinkSync(resolved);
      } else {
        // file already missing — not a fatal error
        console.warn('Image file not found when attempting unlink:', resolved);
      }
    } else {
      console.warn('Refusing to delete file outside public dir:', resolved);
    }
  } catch (err) {
    console.error('Failed to remove image file from disk for imageId', imageId, err);
    // not fatal for DB state — return success but include warning
    return { success: true, warning: 'File delete failed' };
  }

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

// IPC handlers voor GridLayout CRUD:
ipcMain.handle('gridlayout:add', (event, { shape, size, amount }) => {
  const stmt = db.prepare('INSERT INTO GridLayout (amount, shape, size) VALUES (?, ?, ?)');
  const info = stmt.run(amount, shape, size);
  return { gridLayoutId: info.lastInsertRowid, shape, size, amount };
});

ipcMain.handle('gridlayout:getAll', () => {
  return db.prepare('SELECT * FROM GridLayout').all();
});

ipcMain.handle('gridlayout:update', (event, { gridLayoutId, shape, size, amount }) => {
  const stmt = db.prepare('UPDATE GridLayout SET amount = ?, shape = ?, size = ? WHERE gridLayoutId = ?');
  stmt.run(amount, shape, size, gridLayoutId);
  return { gridLayoutId, shape, size, amount };
});

ipcMain.handle('gridlayout:delete', (event, gridLayoutId) => {
  // Remove any Steps that reference this gridLayout
  try {
    db.prepare('UPDATE Step SET gridLayoutId = NULL WHERE gridLayoutId = ?').run(gridLayoutId);
  } catch (err) {
    console.error('Failed to update Steps referencing gridLayoutId', gridLayoutId, err);
  }
  
  db.prepare('DELETE FROM GridLayout WHERE gridLayoutId = ?').run(gridLayoutId);
  return { success: true };
});

// IPC handlers voor Preset CRUD:
ipcMain.handle('preset:add', (event, { name, description }) => {
  const stmt = db.prepare('INSERT INTO Preset (name, description) VALUES (?, ?)');
  const info = stmt.run(name, description);
  return { presetId: info.lastInsertRowid, name, description };
});

ipcMain.handle('preset:getAll', () => {
  return db.prepare('SELECT * FROM Preset').all();
});

ipcMain.handle('preset:update', (event, { presetId, name, description }) => {
  const stmt = db.prepare('UPDATE Preset SET name = ?, description = ? WHERE presetId = ?');
  stmt.run(name, description, presetId);
  return { presetId, name, description };
});

ipcMain.handle('preset:delete', (event, presetId) => {
  // Remove any Steps that reference this preset
  try {
    db.prepare('UPDATE Step SET presetId = NULL WHERE presetId = ?').run(presetId);
  } catch (err) {
    console.error('Failed to update Steps referencing presetId', presetId, err);
  }
  
  db.prepare('DELETE FROM Preset WHERE presetId = ?').run(presetId);
  return { success: true };
});

// Combined query to get presets with their gridlayout information
ipcMain.handle('preset:getWithGridLayouts', () => {
  const query = `
    SELECT 
      p.presetId,
      p.name,
      p.description,
      gl.gridLayoutId,
      gl.amount,
      gl.shape,
      gl.size
    FROM Preset p
    LEFT JOIN Step s ON p.presetId = s.presetId
    LEFT JOIN GridLayout gl ON s.gridLayoutId = gl.gridLayoutId
    GROUP BY p.presetId
  `;
  return db.prepare(query).all();
});

// IPC handlers voor Step CRUD:
ipcMain.handle('step:add', (event, { step, imageId, gridLayoutId, presetId }) => {
  const stmt = db.prepare('INSERT INTO Step (step, imageId, gridLayoutId, presetId) VALUES (?, ?, ?, ?)');
  const info = stmt.run(step, imageId, gridLayoutId || null, presetId || null);
  return { stepId: info.lastInsertRowid, step, imageId, gridLayoutId, presetId };
});

ipcMain.handle('step:getAll', () => {
  return db.prepare('SELECT * FROM Step').all();
});

ipcMain.handle('step:getByPreset', (event, presetId) => {
  return db.prepare('SELECT * FROM Step WHERE presetId = ? ORDER BY step').all(presetId);
});

ipcMain.handle('step:update', (event, { stepId, step, imageId, gridLayoutId, presetId }) => {
  const stmt = db.prepare('UPDATE Step SET step = ?, imageId = ?, gridLayoutId = ?, presetId = ? WHERE stepId = ?');
  stmt.run(step, imageId, gridLayoutId || null, presetId || null, stepId);
  return { stepId, step, imageId, gridLayoutId, presetId };
});

ipcMain.handle('step:delete', (event, stepId) => {
  db.prepare('DELETE FROM Step WHERE stepId = ?').run(stepId);
  return { success: true };
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
      preload: path.join(__dirname, 'preload.cjs'),
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
  
  return mainWindow;
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
