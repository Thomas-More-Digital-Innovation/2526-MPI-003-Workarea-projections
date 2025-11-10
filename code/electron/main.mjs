import { app, BrowserWindow, globalShortcut, ipcMain, dialog } from 'electron';
import path from 'path';
import url from 'url';
import Database from 'better-sqlite3';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Correct database path (../data/app.db relative to dist)
const dbPath = path.join(__dirname, '../data/app.db');
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new Database(dbPath);

// ✅ Create tables safely
db.prepare(`
  CREATE TABLE IF NOT EXISTS GridLayout (
    gridLayoutId INTEGER PRIMARY KEY AUTOINCREMENT,
    amount INTEGER NOT NULL,
    shape TEXT NOT NULL,
    size TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS Preset (
    presetId INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS Image (
    imageId INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL,
    description TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS Step (
    stepId INTEGER PRIMARY KEY AUTOINCREMENT,
    step INTEGER NOT NULL,
    imageId INTEGER,
    gridLayoutId INTEGER,
    presetId INTEGER,
    FOREIGN KEY (imageId) REFERENCES Image(imageId),
    FOREIGN KEY (gridLayoutId) REFERENCES GridLayout(gridLayoutId),
    FOREIGN KEY (presetId) REFERENCES Preset(presetId)
  )
`).run();

// ✅ Insert sample data (fixed missing variable 'insert')


//
// 🧱 IMAGE CRUD
//
ipcMain.handle('images:getAll', () => {
  return db.prepare('SELECT * FROM Image').all();
});

ipcMain.handle('images:add', (event, { path, description }) => {
  const stmt = db.prepare('INSERT INTO Image (path, description) VALUES (?, ?)');
  const info = stmt.run(path, description);
  return { imageId: info.lastInsertRowid, path, description };
});

ipcMain.handle('images:delete', (event, imageId) => {
  const img = db.prepare('SELECT * FROM Image WHERE imageId = ?').get(imageId);
  if (!img) return { success: false, error: 'Image not found' };

  try {
    db.prepare('DELETE FROM Step WHERE imageId = ?').run(imageId);
    db.prepare('DELETE FROM Image WHERE imageId = ?').run(imageId);

    const resolved = path.resolve(__dirname, '..', img.path);
    const publicDir = path.resolve(__dirname, '..', 'public');
    if (resolved.startsWith(publicDir) && fs.existsSync(resolved)) {
      fs.unlinkSync(resolved);
    }
    return { success: true };
  } catch (err) {
    console.error('Failed to delete image', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('images:addFile', async (event, file, description) => {
  const imagesDir = path.join(__dirname, '../public/images');
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

  const filePath = path.join(imagesDir, file.name);
  fs.writeFileSync(filePath, Buffer.from(file.buffer));

  const relPath = `images/${file.name}`;
  const stmt = db.prepare('INSERT INTO Image (path, description) VALUES (?, ?)');
  const info = stmt.run(relPath, description);

  return { imageId: info.lastInsertRowid, path: relPath, description };
});

//
// 🧩 GRIDLAYOUT CRUD
//
ipcMain.handle('gridlayout:add', (event, { shape, size, amount }) => {
  const stmt = db.prepare('INSERT INTO GridLayout (amount, shape, size) VALUES (?, ?, ?)');
  const info = stmt.run(amount, shape, size);
  return { gridLayoutId: info.lastInsertRowid, shape, size, amount };
});

ipcMain.handle('gridlayout:getAll', () => {
  return db.prepare('SELECT * FROM GridLayout').all();
});

// ✅ Added missing get-by-ID handler
ipcMain.handle('gridlayout:getById', (event, gridLayoutId) => {
  return db.prepare('SELECT * FROM GridLayout WHERE gridLayoutId = ?').get(gridLayoutId);
});

ipcMain.handle('gridlayout:update', (event, { gridLayoutId, shape, size, amount }) => {
  const stmt = db.prepare('UPDATE GridLayout SET amount = ?, shape = ?, size = ? WHERE gridLayoutId = ?');
  stmt.run(amount, shape, size, gridLayoutId);
  return { gridLayoutId, shape, size, amount };
});

ipcMain.handle('gridlayout:delete', (event, gridLayoutId) => {
  db.prepare('UPDATE Step SET gridLayoutId = NULL WHERE gridLayoutId = ?').run(gridLayoutId);
  db.prepare('DELETE FROM GridLayout WHERE gridLayoutId = ?').run(gridLayoutId);
  return { success: true };
});

//
// 🧠 PRESET CRUD
//
ipcMain.handle('preset:add', (event, { name, description }) => {
  const stmt = db.prepare('INSERT INTO Preset (name, description) VALUES (?, ?)');
  const info = stmt.run(name, description);
  return { presetId: info.lastInsertRowid, name, description };
});

ipcMain.handle('preset:getAll', () => {
  return db.prepare('SELECT * FROM Preset').all();
});

ipcMain.handle('preset:update', (event, { presetId, name, description }) => {
  db.prepare('UPDATE Preset SET name = ?, description = ? WHERE presetId = ?')
    .run(name, description, presetId);
  return { presetId, name, description };
});

ipcMain.handle('preset:delete', (event, presetId) => {
  db.prepare('UPDATE Step SET presetId = NULL WHERE presetId = ?').run(presetId);
  db.prepare('DELETE FROM Preset WHERE presetId = ?').run(presetId);
  return { success: true };
});

// ✅ Combined Preset + GridLayout query
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

//
// 🪜 STEP CRUD
//
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

//
// 📤📥 EXPORT/IMPORT
//
ipcMain.handle('data:export', async () => {
  try {
    // Get all data from database
    const images = db.prepare('SELECT * FROM Image').all();
    const gridLayouts = db.prepare('SELECT * FROM GridLayout').all();
    const presets = db.prepare('SELECT * FROM Preset').all();
    const steps = db.prepare('SELECT * FROM Step').all();

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        images,
        gridLayouts,
        presets,
        steps
      }
    };

    // Show save dialog
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Exporteer Database',
      defaultPath: `preset-export-${Date.now()}.json`,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    // Write JSON file
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
    
    return { success: true, filePath };
  } catch (err) {
    console.error('Export failed:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('data:import', async () => {
  try {
    // Show open dialog
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: 'Importeer Database',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const filePath = filePaths[0];
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const importData = JSON.parse(fileContent);

    // Validate import data structure
    if (!importData.data || !importData.data.images || !importData.data.gridLayouts || 
        !importData.data.presets || !importData.data.steps) {
      return { success: false, error: 'Ongeldig bestandsformaat' };
    }

    // Begin transaction
    db.prepare('BEGIN').run();

    try {
      // Clear existing data
      db.prepare('DELETE FROM Step').run();
      db.prepare('DELETE FROM Image').run();
      db.prepare('DELETE FROM GridLayout').run();
      db.prepare('DELETE FROM Preset').run();

      // Reset autoincrement
      db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('Image', 'GridLayout', 'Preset', 'Step')").run();

      // Import Images
      const imageStmt = db.prepare('INSERT INTO Image (imageId, path, description) VALUES (?, ?, ?)');
      for (const img of importData.data.images) {
        imageStmt.run(img.imageId, img.path, img.description);
      }

      // Import GridLayouts
      const gridStmt = db.prepare('INSERT INTO GridLayout (gridLayoutId, amount, shape, size) VALUES (?, ?, ?, ?)');
      for (const grid of importData.data.gridLayouts) {
        gridStmt.run(grid.gridLayoutId, grid.amount, grid.shape, grid.size);
      }

      // Import Presets
      const presetStmt = db.prepare('INSERT INTO Preset (presetId, name, description) VALUES (?, ?, ?)');
      for (const preset of importData.data.presets) {
        presetStmt.run(preset.presetId, preset.name, preset.description);
      }

      // Import Steps
      const stepStmt = db.prepare('INSERT INTO Step (stepId, step, imageId, gridLayoutId, presetId) VALUES (?, ?, ?, ?, ?)');
      for (const step of importData.data.steps) {
        stepStmt.run(step.stepId, step.step, step.imageId, step.gridLayoutId, step.presetId);
      }

      // Commit transaction
      db.prepare('COMMIT').run();

      return { 
        success: true, 
        filePath,
        stats: {
          images: importData.data.images.length,
          gridLayouts: importData.data.gridLayouts.length,
          presets: importData.data.presets.length,
          steps: importData.data.steps.length
        }
      };
    } catch (err) {
      // Rollback on error
      db.prepare('ROLLBACK').run();
      throw err;
    }
  } catch (err) {
    console.error('Import failed:', err);
    return { success: false, error: err.message };
  }
});

//
// ⚙️ ELECTRON WINDOW SETUP
//
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
