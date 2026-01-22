# CubVault Project Structure

## Cross-Platform Architecture

```
CubVault/
├── core/                    # Shared TypeScript core (encryption, database)
│   ├── crypto.ts           # WebCrypto encryption
│   ├── database.ts         # Encrypted storage
│   ├── generator.ts        # Password generator
│   └── breach-check.ts     # Password breach detection
│
├── extension/              # Browser Extension (Chrome, Firefox, etc.)
│   ├── manifest.json      # Extension manifest
│   ├── popup/             # Extension popup UI
│   ├── background/        # Background scripts
│   └── content/           # Content scripts for auto-fill
│
├── desktop/               # Desktop App (Electron/Tauri)
│   ├── main.ts           # Main process
│   ├── renderer/         # UI (React/Vue)
│   └── preload.ts        # Secure IPC bridge
│
├── mobile/                # Mobile App (React Native)
│   ├── ios/              # iOS specific
│   ├── android/          # Android specific
│   └── src/              # Shared mobile code
│
└── shared/                # Shared UI components
    ├── components/        # Reusable UI
    └── styles/           # Shared styling

## Technology Stack

- **Core**: TypeScript + WebCrypto API
- **Extension**: Vanilla JS/TS (Manifest V3)
- **Desktop**: Electron (later migrate to Tauri)
- **Mobile**: React Native
- **UI**: React (shared components)
- **Build**: Webpack, TypeScript

## Security Features

1. **Encryption**: AES-256-GCM (WebCrypto native)
2. **Key Derivation**: PBKDF2 with 600,000 iterations
3. **Master Password**: Argon2 hashing
4. **Zero-Knowledge**: All encryption happens client-side
5. **Memory Security**: Clear sensitive data after use
6. **Auto-lock**: Configurable timeout
7. **Clipboard Security**: Auto-clear after 30 seconds

## Development Phases

### Phase 1: Core + Extension (Current)
- ✅ Build TypeScript core
- ✅ Create Chrome extension
- ✅ Test on all browsers

### Phase 2: Desktop App
- Build Electron wrapper
- Add desktop-specific features
- Package for Windows, Mac, Linux

### Phase 3: Mobile Apps
- React Native setup
- iOS + Android builds
- App store deployment

### Phase 4: Sync & Cloud (Optional)
- End-to-end encrypted sync
- Cloud backup
- Multi-device support
