# Building Windows Executable (.exe)

This guide explains how to build a Windows installer (.exe) for the Work Area Projection application.

## Prerequisites

- Node.js and npm installed
- Windows operating system
- All dependencies installed (`npm install` already run)

## Build Steps

### 1. Navigate to the code directory

```powershell
cd "d:\DI Projecten\MPI_Projection\2526-MPI-003-Workarea-projections\code"
```

### 2. Build the executable

```powershell
npm run dist
```

This command will:
- Build the Next.js application for production
- Package it with Electron
- Create a Windows installer

### 3. Locate the output files

After successful build, you'll find:

- **Installer**: `code/dist/Work Area Projection Setup 0.1.0.exe`
- **Unpacked app**: `code/dist/win-unpacked/Work Area Projection.exe`

## Available Build Commands


- `npm run dist` - Creates Windows installer (.exe)
- `npm run pack` - Creates unpacked application folder (for testing)
- `npm run dist:all` - Creates installers for Mac, Windows, and Linux

## Installer Features

The generated installer includes:

✅ User can choose installation directory  
✅ Desktop shortcut creation  
✅ Start Menu shortcut creation  
✅ Automatic app updates support  
✅ User data stored in AppData/Roaming  

## User Data Locations

When installed, the application stores data in:

- **Database**: `C:\Users\<username>\AppData\Roaming\Work Area Projection\data\app.db`
- **Uploaded Images**: `C:\Users\<username>\AppData\Roaming\Work Area Projection\images\`

## Troubleshooting

### Build fails with sharp errors

If you encounter errors related to `@img/sharp-darwin-arm64`:
```powershell
New-Item -ItemType Directory -Path "node_modules\@img\sharp-darwin-arm64" -Force
```

### Build fails with signing errors

The application is configured to skip code signing. If you encounter signing errors, ensure `signAndEditExecutable: false` is set in `package.json`.

### Changes not reflected in build

Clean build outputs before rebuilding:
```powershell
Remove-Item -Recurse -Force ".next", "out", "dist" -ErrorAction SilentlyContinue
npm run dist
```

## Notes

- The first build may take several minutes
- Build output size is approximately 200-300 MB
- The installer is not code-signed (users may see Windows SmartScreen warning)
- Icon can be customized by replacing `electron/assets/icon.ico`
