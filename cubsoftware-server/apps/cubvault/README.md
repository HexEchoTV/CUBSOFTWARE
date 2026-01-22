# CubVault - Advanced Password Manager

**By CUB Software**

🔐 **Secure** - Military-grade AES-256-GCM encryption with PBKDF2 (600K iterations)
🌍 **Cross-Platform** - Windows first, then Mac, Linux, iOS, Android
⚡ **Easy to Use** - Beautiful dark theme UI, one-click everything
🎯 **Smart** - Password health analysis, strength checking, secure generator
🔒 **Private** - Zero-knowledge architecture, all encryption happens locally

## Current Status: Windows Desktop App ✅

The Windows desktop app is **fully built** and ready for testing! See [Getting Started](#getting-started) below.

## Features (Implemented)

- ✅ **AES-256-GCM Encryption** - WebCrypto API for maximum security
- ✅ **Argon2id Password Hashing** - Memory-hard algorithm
- ✅ **PBKDF2 Key Derivation** - 600,000 iterations (OWASP standard)
- ✅ **Strong Password Generator** - Cryptographically secure randomness
- ✅ **Password Health Analysis** - Detect weak, reused, and old passwords
- ✅ **Auto-Lock** - Configurable timeout (default 15 minutes)
- ✅ **Clipboard Security** - Auto-clear after 30 seconds
- ✅ **System Tray Integration** - Minimize to tray
- ✅ **Keyboard Shortcuts** - Fast navigation (Ctrl+N, Ctrl+G, Ctrl+F, Ctrl+L)
- ✅ **Categories & Tags** - Organize your passwords
- ✅ **Search & Filter** - Find passwords instantly
- ✅ **Export/Import** - Backup your vault
- ✅ **Password History** - Track password changes (last 10)

## Coming Soon

- 📱 Mobile apps (iOS & Android)
- 🌐 Browser extensions (Chrome, Firefox, Edge)
- 🍎 macOS support
- 🐧 Linux support
- ☁️ Optional cloud sync (end-to-end encrypted)
- 👥 Secure password sharing
- 🔔 Breach detection (Have I Been Pwned API)

---

## Getting Started

### Prerequisites

- **Node.js 18+** and npm
- **Windows** (Mac/Linux coming soon)

### Installation

1. **Navigate to project directory**:
```bash
cd "G:\GitHub Projects\CUBSOFTWARE APPS\CubVault"
```

2. **Install dependencies**:
```bash
npm install
```

This will install:
- React + ReactDOM
- Electron
- TypeScript
- Webpack and loaders
- @noble/hashes (for Argon2)

3. **Run in development mode**:
```bash
npm run dev
```

This will:
- Compile TypeScript code
- Bundle React application
- Launch Electron with hot reload
- Open the CubVault window

### First Time Setup

When you first launch CubVault:

1. You'll see the **Create Vault** screen
2. Enter a **strong master password** (minimum 8 characters)
3. The app shows real-time password strength
4. Confirm your password
5. Click **"Create Vault"**

**⚠️ IMPORTANT**: Your master password cannot be recovered. Store it safely!

### Using CubVault

- **Add Password**: Click "+ New Password" or press `Ctrl+N`
- **Generate Password**: Click the 🔄 button or press `Ctrl+G`
- **Search**: Use the search bar or press `Ctrl+F`
- **Copy Credentials**: Click 👤 (username) or 🔑 (password) icons
- **Lock Vault**: Click "🔒 Lock Vault" or press `Ctrl+L`

### Build for Production

```bash
npm run build:desktop
```

This creates a Windows installer (NSIS) in the `dist/` folder.

---

## Development

### Project Structure

```
CubVault/
├── core/                    # TypeScript core (encryption, database)
│   ├── crypto.ts           # WebCrypto encryption engine
│   ├── database.ts         # Encrypted vault storage
│   └── types.ts            # TypeScript definitions
│
├── desktop/                # Electron Desktop App
│   ├── main.ts            # Main process
│   ├── preload.ts         # Secure IPC bridge
│   └── renderer/          # React UI
│       ├── components/    # UI components
│       │   ├── LoginScreen.tsx
│       │   ├── Dashboard.tsx
│       │   ├── PasswordList.tsx
│       │   ├── PasswordForm.tsx
│       │   ├── PasswordGenerator.tsx
│       │   └── Sidebar.tsx
│       └── styles/        # CSS styling
│
├── extension/             # Browser Extension (coming soon)
├── mobile/                # Mobile Apps (coming soon)
└── shared/                # Shared UI components
```

### Commands

- `npm run dev` - Start desktop app in development mode
- `npm run build:desktop` - Build production desktop app
- `npm run watch:desktop` - Watch main process files
- `npm run watch:renderer` - Watch renderer files
- `npm run dev:extension` - Start browser extension development (coming soon)

### Technology Stack

- **Core**: TypeScript + WebCrypto API
- **Desktop**: Electron + React 18
- **Extension**: Manifest V3 (coming soon)
- **Mobile**: React Native (coming soon)
- **Build**: Webpack 5, TypeScript 5
- **Crypto**: @noble/hashes (Argon2id)

---

## Security

### Encryption Spec

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with SHA-256, 600,000 iterations
- **Master Password**: Argon2id (memory: 64MB, iterations: 3, parallelism: 4)
- **Salt**: 16 bytes (cryptographically random)
- **Nonce**: 12 bytes (cryptographically random per encryption)

### Zero-Knowledge Architecture

- Master password **never** leaves your device
- All encryption/decryption happens **client-side**
- Vault data stored locally in encrypted format
- No telemetry or analytics

### Memory Security

- Sensitive strings cleared after use
- Auto-lock on timeout/minimize/screen lock
- Clipboard auto-cleared after 30 seconds

**⚠️ Master Password**: Cannot be recovered. Use a strong, memorable password or store it in a secure location.

---

## Roadmap

See **[TODO.md](./TODO.md)** for detailed development checklist.

### Phase 1: Windows Desktop ✅ (COMPLETED)
- [x] Core encryption library
- [x] Encrypted vault database
- [x] Electron desktop app
- [x] React UI with all features
- [ ] Testing and bug fixes
- [ ] Windows installer

### Phase 2: Browser Extension
- [ ] Chrome extension
- [ ] Firefox extension
- [ ] Edge extension
- [ ] Auto-fill functionality
- [ ] Form detection

### Phase 3: Cross-Platform Desktop
- [ ] macOS support
- [ ] Linux support
- [ ] AppImage/dmg packaging

### Phase 4: Mobile Apps
- [ ] iOS app
- [ ] Android app
- [ ] Biometric authentication
- [ ] System autofill integration

### Phase 5: Advanced Features
- [ ] Cloud sync (end-to-end encrypted)
- [ ] Password breach detection (HIBP API)
- [ ] Secure password sharing
- [ ] Emergency access
- [ ] TOTP 2FA support
- [ ] Import from LastPass/1Password/Bitwarden

---

## License

MIT License - Copyright (c) 2026 CUB Software

## Support

For issues and feature requests, check **[TODO.md](./TODO.md)**.

---

**Built with ❤️ by CUB Software**
