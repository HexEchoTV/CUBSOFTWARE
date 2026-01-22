# CubVault Launcher Guide

## Quick Start

### Option 1: Interactive Launcher (Recommended)
Simply run `start.bat` and choose from the menu:
1. **Desktop App** - Runs the Electron desktop application
2. **Web Version** - Starts the development server at http://localhost:3000
3. **Both** - Runs both desktop and web simultaneously
4. **Exit** - Closes the launcher

### Option 2: Direct Launch Scripts

#### Desktop App Only
```batch
start-desktop.bat
```
- Launches the Electron desktop application
- Automatically compiles TypeScript and bundles React
- Opens DevTools in development mode

#### Web Server Only
```batch
start-web.bat
```
- Starts webpack dev server on port 3000
- Automatically opens browser to http://localhost:3000
- Includes hot module reloading for development

## Building Production Executable

### Create CubVault.exe

To build a production-ready executable:

```batch
npm run build:desktop
```

This will:
1. Build the desktop main process (production mode)
2. Build the desktop renderer (production mode)
3. Package everything with electron-builder
4. Create installers in the `dist/` folder

#### Build Output Locations:
- **Windows**: `dist/CubVault Setup 1.0.0.exe` (NSIS installer)
- **Build files**: `dist/win-unpacked/CubVault.exe` (portable executable)

### Running the Executable

After building, you can:
1. Run the installer: `dist/CubVault Setup 1.0.0.exe`
2. Or run directly: `dist/win-unpacked/CubVault.exe`

The installed version will have:
- Desktop shortcut
- Start menu entry
- Auto-update capability (if configured)
- No console window
- Proper Windows integration

## Troubleshooting

### Grey Screen Issue
**Fixed!** The path to the renderer HTML has been corrected in main.ts.
- Old: `../renderer/index.html`
- New: `renderer/index.html`

### Content Security Policy Warning
**Fixed!** The CSP meta tag now includes:
- `script-src 'self'` - Only load scripts from the app
- `style-src 'self' 'unsafe-inline'` - Allow inline styles from style-loader
- `img-src 'self' data:` - Allow images and data URIs
- `default-src 'self'` - Default to same-origin for everything else

### File Loading Error
**Fixed!** The corrected path ensures Electron loads from the correct location:
- Built files: `dist/desktop/renderer/index.html`
- Loaded via: `path.join(__dirname, 'renderer/index.html')`

## Development Workflow

### 1. First Time Setup
```batch
npm install
```

### 2. Development
```batch
start.bat
# Choose option 1 for desktop development
```

### 3. Testing Web Version
```batch
start.bat
# Choose option 2 to test in browser
```

### 4. Production Build
```batch
npm run build:desktop
```

### 5. Distribution
Share the installer: `dist/CubVault Setup 1.0.0.exe`

## Scripts Reference

### Development Scripts
- `npm run dev` - Alias for `dev:desktop`
- `npm run dev:desktop` - Start desktop app with hot reload
- `npm run dev:web` - Start web dev server
- `npm run watch:desktop` - Watch and build main process
- `npm run watch:renderer` - Watch and build renderer process

### Build Scripts
- `npm run build:desktop` - Full desktop production build
- `npm run build:desktop-main` - Build main process only
- `npm run build:desktop-renderer` - Build renderer only
- `npm run build:web` - Build web version for deployment

### Extension Scripts
- `npm run dev:extension` - Watch build browser extension
- `npm run build:extension` - Build extension for production

## Environment Variables

### Development Mode
The app automatically detects development mode and:
- Opens DevTools
- Enables hot reload
- Shows detailed error messages

### Production Mode
When built with `npm run build:desktop`:
- No DevTools
- Optimized and minified code
- Smaller bundle size
- Better performance

## Notes

- The CSP warning "This warning will not show up once the app is packaged" is correct - it only appears in development mode
- All three launcher scripts (`start.bat`, `start-desktop.bat`, `start-web.bat`) automatically install dependencies if missing
- The desktop app runs on Electron, the web version is pure browser-based
- Both versions share the same React components and core functionality
