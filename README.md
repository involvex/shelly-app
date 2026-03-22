# Shelly SSH Terminal 🚀

![Expo](https://img.shields.io/badge/Expo-55.0-black?style=flat-square&logo=expo)
![React Native](https://img.shields.io/badge/React_Native-0.83.2-blue?style=flat-square&logo=react)
![Bun](https://img.shields.io/badge/Bun-1.2-fbf0df?style=flat-square&logo=bun)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

[![Build Android Debug APK](https://github.com/involvex/shelly-app/actions/workflows/android-debug-build.yml/badge.svg)](https://github.com/involvex/shelly-app/actions/workflows/android-debug-build.yml)

Shelly is a robust, seamless SSH client specifically designed for Android and optimized for Windows PowerShell environments. It combines the power of `xterm.js` with the flexibility of React Native to provide a professional terminal experience on the go.

## 🌟 Key Features

- **XTerm.js Powered Terminal**: Full terminal emulation with support for colors, resizing, and complex escape sequences.
- **PowerShell Optimization**: Tailored experience for connecting to Windows PowerShell over SSH.
- **Productivity Toolbar**: Quick access to essential keys like `Tab`, `Ctrl`, `Esc`, and `Arrow Keys` right above the keyboard.
- **Snippet System**: Save, manage, and execute frequently used commands with a single tap.
- **Secure by Design**: Biometric authentication support (Windows Hello style) and secure credential storage.
- **Themable UI**: Modern, dark-first design powered by **NativeWind** (Tailwind CSS).
- **Hybrid Dev Strategy**: Supports **Expo Go** for rapid UI iteration using a mock SSH provider.

## 🛠️ Tech Stack

- **Framework**: [Expo](https://expo.dev/) (React Native)
- **Runtime**: [Bun](https://bun.sh/)
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS)
- **Terminal Engine**: [xterm.js](https://xtermjs.org/) via `react-native-webview`
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **SSH/SFTP**: `@dylankenneally/react-native-ssh-sftp`
- **Navigation**: Expo Router (File-based routing)

## 📁 Project Structure

The project uses a monorepo structure managed by Bun workspaces:

```text
ssh-powershell-shell/
├── apps/
│   └── mobile/           # Main Expo application
│       ├── src/
│       │   ├── app/      # Expo Router routes
│       │   ├── components/# Reusable UI components
│       │   ├── services/ # SSH and Business logic
│       │   └── store/    # Zustand state stores
├── packages/
│   └── shared/           # Shared types and utilities
└── Plans/                # Project roadmap and architecture docs
```

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine.
- [Expo Go](https://expo.dev/client) app installed on your Android/iOS device (for UI testing).
- Android Studio / Xcode (for native development).

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/involvex/shelly-app.git
   cd ssh-powershell-shell
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

### Running the App

#### UI/UX Development (Expo Go)

For rapid UI iteration, Shelly uses a **Mock SSH Service** that allows you to test the terminal interface without a real connection:

```bash
bun run start:app
```

_Note: Real SSH connections are not supported in standard Expo Go._

#### Native Development (Dev Client)

To use real SSH sockets and biometric authentication, you must use a development build:

```bash
# Generate native folders and build
bun run build:app

# Run on Android
bun run android

# Run on iOS
bun run ios
```

## 📜 Available Scripts

| Script              | Description                                      |
| :------------------ | :----------------------------------------------- |
| `bun run start:app` | Starts the Expo development server.              |
| `bun run build:app` | Performs expo prebuild for native functionality. |
| `bun run typecheck` | Runs TypeScript compiler checks.                 |
| `bun run lint`      | Checks code for style and errors with ESLint.    |
| `bun run format`    | Formats the codebase using Prettier.             |

## 🛠️ Configuration

Shelly can be configured via `app.json` and environment variables. Key native configurations (like SSH bindings) are handled during the `prebuild` phase.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) (coming soon) for more details.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👤 Author

**involvex**

- GitHub: [@involvex](https://github.com/involvex)
- Sponsor: [Support my work](https://github.com/sponsors/involvex)

## 🙏 Acknowledgments

- [XTerm.js](https://xtermjs.org/) for the incredible terminal engine.
- [NativeWind](https://nativewind.dev/) for making styling React Native a breeze.
- [Expo](https://expo.dev/) for the amazing development workflow.
