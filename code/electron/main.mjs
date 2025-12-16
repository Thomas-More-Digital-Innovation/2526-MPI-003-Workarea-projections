import { app, BrowserWindow, globalShortcut, ipcMain, protocol } from 'electron';
import path from 'path';
import url from 'url';
import Database from 'better-sqlite3';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Correct database path for both development and production
// In production, app.getPath('userData') gives us a writable location
// In development, we use the data folder in the project
const isDev = !app.isPackaged;
const dbPath = isDev 
  ? path.join(__dirname, '../data/app.db')
  : path.join(app.getPath('userData'), 'data', 'app.db');

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

// --- Seeders ---
// Grid layouts
if (db.prepare('SELECT COUNT(*) AS count FROM GridLayout').get().count === 0) {
  const insert = db.prepare('INSERT INTO GridLayout (amount, shape, size) VALUES (?, ?, ?)');
  insert.run(6, 'circle', 'medium'); // Grid step 1
  insert.run(3, 'circle', 'medium'); // Grid step 2
}

// Preset
if (db.prepare('SELECT COUNT(*) AS count FROM Preset').get().count === 0) {
  db.prepare('INSERT INTO Preset (name, description) VALUES (?, ?)')
    .run('Voorbeeld Preset', 'Dit is een voorbeeldpreset');
}

// Dummy image
if (db.prepare('SELECT COUNT(*) AS count FROM Image').get().count === 0) {
  const stmt = db.prepare('INSERT INTO Image (path, description) VALUES (?, ?)');
  stmt.run('images/dummy.jpg', 'Dummy image voor image step');
}

// Steps (grid + image)
if (db.prepare('SELECT COUNT(*) AS count FROM Step').get().count === 0) {
  const insert = db.prepare('INSERT INTO Step (step, gridLayoutId, imageId, presetId) VALUES (?, ?, ?, ?)');

  // Step 1: grid
  insert.run(1, 1, null, 1);

  // Step 2: image
  insert.run(2, null, 1, 1);

  // Step 3: grid
  insert.run(3, 2, null, 1);
}

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

    // In production, img.path is an absolute path; in dev, it's relative
    let imagePath;
    if (isDev) {
      imagePath = path.resolve(__dirname, '..', img.path);
      const publicDir = path.resolve(__dirname, '..', 'public');
      if (imagePath.startsWith(publicDir) && fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    } else {
      // In production, path is already absolute
      if (fs.existsSync(img.path)) {
        fs.unlinkSync(img.path);
      }
    }
    return { success: true };
  } catch (err) {
    console.error('Failed to delete image', err);
    return { success: false, error: err.message };
  }
});

// Add handler to get image file data for display
ipcMain.handle('images:getFile', (event, imagePath) => {
  try {
    let fullPath;
    if (isDev) {
      fullPath = path.resolve(__dirname, '..', imagePath);
    } else {
      // In production, imagePath is already absolute
      fullPath = imagePath;
    }
    
    if (fs.existsSync(fullPath)) {
      const data = fs.readFileSync(fullPath);
      return { success: true, data: data.toString('base64') };
    } else {
      return { success: false, error: 'Image file not found' };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('images:addFile', async (event, file, description) => {
  // Use userData directory for storing uploaded images in production
  const imagesDir = isDev 
    ? path.join(__dirname, '../public/images')
    : path.join(app.getPath('userData'), 'images');
  
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

  const filePath = path.join(imagesDir, file.name);
  fs.writeFileSync(filePath, Buffer.from(file.buffer));

  // Store the full absolute path in production so we can retrieve it later
  const storedPath = isDev ? `images/${file.name}` : filePath;
  const stmt = db.prepare('INSERT INTO Image (path, description) VALUES (?, ?)');
  const info = stmt.run(storedPath, description);

  return { imageId: info.lastInsertRowid, path: storedPath, description };
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
// 📤📥 DATA EXPORT/IMPORT
//
ipcMain.handle('data:export', async () => {
  const { dialog } = await import('electron');
  
  try {
    const result = await dialog.showSaveDialog({
      title: 'Export Database',
      defaultPath: `projection-backup-${new Date().toISOString().split('T')[0]}.json`,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    // Export all data
    const exportData = {
      images: db.prepare('SELECT * FROM Image').all(),
      gridLayouts: db.prepare('SELECT * FROM GridLayout').all(),
      presets: db.prepare('SELECT * FROM Preset').all(),
      steps: db.prepare('SELECT * FROM Step').all(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    await fs.promises.writeFile(result.filePath, JSON.stringify(exportData, null, 2), 'utf-8');
    return { success: true, filePath: result.filePath };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('data:import', async () => {
  const { dialog } = await import('electron');
  
  try {
    const result = await dialog.showOpenDialog({
      title: 'Import Database',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || !result.filePaths.length) {
      return { success: false, canceled: true };
    }

    const fileContent = await fs.promises.readFile(result.filePaths[0], 'utf-8');
    const importData = JSON.parse(fileContent);

    // Clear existing data
    db.prepare('DELETE FROM Step').run();
    db.prepare('DELETE FROM Preset').run();
    db.prepare('DELETE FROM GridLayout').run();
    db.prepare('DELETE FROM Image').run();

    // Import images
    const imageStmt = db.prepare('INSERT INTO Image (imageId, path, description) VALUES (?, ?, ?)');
    for (const img of importData.images || []) {
      imageStmt.run(img.imageId, img.path, img.description);
    }

    // Import grid layouts
    const gridStmt = db.prepare('INSERT INTO GridLayout (gridLayoutId, shape, size, amount) VALUES (?, ?, ?, ?)');
    for (const gl of importData.gridLayouts || []) {
      gridStmt.run(gl.gridLayoutId, gl.shape, gl.size, gl.amount);
    }

    // Import presets
    const presetStmt = db.prepare('INSERT INTO Preset (presetId, name, description) VALUES (?, ?, ?)');
    for (const preset of importData.presets || []) {
      presetStmt.run(preset.presetId, preset.name, preset.description);
    }

    // Import steps
    const stepStmt = db.prepare('INSERT INTO Step (stepId, step, imageId, gridLayoutId, presetId) VALUES (?, ?, ?, ?, ?)');
    for (const step of importData.steps || []) {
      stepStmt.run(step.stepId, step.step, step.imageId, step.gridLayoutId, step.presetId);
    }

    return {
      success: true,
      stats: {
        images: importData.images?.length || 0,
        gridLayouts: importData.gridLayouts?.length || 0,
        presets: importData.presets?.length || 0,
        steps: importData.steps?.length || 0
      }
    };
  } catch (error) {
    console.error('Import error:', error);
    return { success: false, error: error.message };
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
    autoHideMenuBar: true,
    frame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    icon: path.join(__dirname, 'assets/icon.png'),
  });

  mainWindow.maximize();

  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }

  // Handle navigation for both will-navigate and new-window events
  const handleNavigation = (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    // Only handle file protocol or when trying to navigate within the app
    if (parsedUrl.protocol === 'file:') {
      event.preventDefault();
      
      // Extract the route path
      let routePath = parsedUrl.pathname;
      
      // Remove file extension artifacts and clean path
      routePath = routePath.replace(/\.txt$/, '').replace(/\.html$/, '');
      
      // Remove leading slash on Windows and clean up
      if (process.platform === 'win32' && routePath.startsWith('/')) {
        routePath = routePath.substring(1);
      }
      
      // Remove any drive letters (C:, D:, etc.)
      routePath = routePath.replace(/^[A-Z]:/i, '');
      
      // Get just the last segment (the actual page name)
      const segments = routePath.split('/').filter(s => s && s !== 'out');
      const pageName = segments[segments.length - 1] || 'index';
      
      // Map route to HTML file
      const htmlFile = path.join(__dirname, '../out', `${pageName}.html`);
      
      // Check if file exists, otherwise load index
      if (fs.existsSync(htmlFile)) {
        mainWindow.loadFile(htmlFile);
      } else {
        mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
      }
    }
  };

  mainWindow.webContents.on('will-navigate', handleNavigation);
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    handleNavigation({ preventDefault: () => {} }, url);
    return { action: 'deny' };
  });

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
