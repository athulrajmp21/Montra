<div align="center">

  <img src="./assets/icon.png" alt="Montra Logo" width="120" height="120" style="border-radius: 30px; box-shadow: 0 10px 30px rgba(82, 107, 69, 0.3);" />

  <h1>Montra — Money Gets Organised</h1>

  <p align="center">
    <strong>A calm, minimalist, and 100% privacy-first personal finance app built with React Native, Expo, and SQLite.</strong>
  </p>

  <p align="center">
    <a href="https://github.com/athulrajmp21/Montra/releases/latest">
      <img src="https://img.shields.io/badge/⬇️_Download_Latest_APK-Release-747B4B?style=for-the-badge&logo=android&logoColor=white" alt="Download APK" />
    </a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS-darkgreen?style=flat-square" alt="Platforms" />
    <img src="https://img.shields.io/badge/Framework-React%20Native%20(Expo%20SDK%2052)-61DAFB?style=flat-square&logo=react" alt="React Native Expo" />
    <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Database-Offline%20SQLite-003B57?style=flat-square&logo=sqlite" alt="SQLite" />
    <img src="https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square" alt="License" />
  </p>

  <p align="center">
    <a href="#-about-the-project">About The Project</a> •
    <a href="#-download--installation">Download & Install</a> •
    <a href="#-key-features">Key Features</a> •
    <a href="#-tech-stack--architecture">Tech Stack</a> •
    <a href="#-how-to-run-locally">Run Locally</a> •
    <a href="#-author">Author</a>
  </p>

</div>

---

## 💡 About The Project

Most personal finance apps today are cluttered with predatory loan advertisements, intrusive bank account scraping, constant upsells, and confusing interfaces.

**Montra** was engineered from scratch to take the opposite approach:
- **🔒 100% Offline & Private**: Zero cloud sync, zero telemetry, no accounts or logins. All your financial data stays securely encrypted on your local device in an offline SQLite database.
- **🌿 Calm Botanical Aesthetic**: Designed with a warm cream (`#F7F5EE`) palette, soothing olive tones, and deliberate whitespace to reduce financial anxiety.
- **👓 Dual-Mode Accessibility**: Includes a purpose-built **Senior Citizen / Easy Mode** featuring oversized high-contrast typography, simplified language (*"Vehicle & Fuel"*, *"Doctor & Health"*), and uncluttered cards.

---

## 📲 Download & Installation

You can download and install the standalone Android build directly without needing any developer setup:

### 🔗 [👉 Download Latest Android APK (`.apk`)](https://github.com/athulrajmp21/Montra/releases/latest)

#### Installation Steps:
1. Download the `.apk` file from the **Releases** tab on your Android smartphone.
2. Open the downloaded file from your browser or file manager.
3. If prompted, allow *"Install from unknown sources"* in your device settings.
4. Open **Montra** and start organizing your finances effortlessly!

---

## ✨ Key Features & Capabilities

### ⚡ Subscriptions & Recurring Bills Hub
- **7×5 Calendar Grid Picker**: Select exact monthly due days (1–31) on an interactive, clean matrix without fiddly date pickers.
- **1-Tap "Log Paid"**: Instantly generates an expense transaction into the database when a bill is paid.
- **Urgency Indicators**: Color-coded badges indicating *Due Today*, *Due Tomorrow*, or upcoming due dates.
- **Annualized Wealth Impact**: View both monthly costs and annualized commitments (`/ yr`) for conscious spending.
- **Multi-Cycle Support**: Monthly, Quarterly, and Annual subscriptions with automated monthly impact calculations.

### 📊 Real-Time Safe-to-Spend Pacer & Milestones
- **Daily Burn Rate**: Dynamically calculates `Safe Daily Spend = Remaining Budget / Days Left` to keep your month on track.
- **Proactive Spending Tips**: Context-aware advisor cards alerting you if spending outpaces the safe threshold.
- **Savings Milestones**: Visual goal trackers with progress indicators to celebrate healthy savings habits.

### 💳 Fast & Mindful Transaction Logging
- **Payment Method Tagging**: Filter and track spending across **Cash 💵**, **UPI / Bank 📱**, and **Cards 💳**.
- **Tactile Keypad**: Custom numerical pad optimized for rapid single-handed logging.
- **Smart Date Presets**: Quick options for *Today*, *Yesterday*, or backdating via a calendar modal with merchant notes.
- **Dedicated Categories**: Covers Groceries, Dining, Bills, Healthcare, and Vehicle & Transport / Fuel.

### 📈 Visual Analytics & History
- **Category Progress Bars**: Visual breakdown of your highest spending areas with percentage shares.
- **Month-over-Month Delta**: Compare current spending with the previous month (`🌿 12% lower than last month`).
- **Cash Flow Comparison**: Side-by-side comparative inflow vs. outflow analytics.
- **Live Search & Month Navigation**: Search transactions by keyword/memo and navigate historical monthly archives.

### 🛡️ Data Ownership & Export
- **One-Tap CSV Export**: Export your complete transaction history to a CSV spreadsheet via native OS sharing.
- **Local Data Reset**: Safely backup, reset, or clear local database entries.

---

## 🛠️ Tech Stack & Architecture

Montra is built using modern, production-grade mobile standards:

- **Framework**: [React Native](https://reactnative.dev/) with [Expo SDK 52](https://expo.dev/) (New Architecture ready)
- **Routing**: [Expo Router v4](https://docs.expo.dev/router/introduction/) (File-based navigation in `src/app/`)
- **Database**: [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (Embedded ACID-compliant local SQL database with migrations)
- **Icons**: [lucide-react-native](https://lucide.dev/) (Clean, modern iconography)
- **Typography**: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) loaded via `@expo-google-fonts`
- **Feedback**: [expo-haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) for tactile micro-interactions
- **Build System**: [EAS (Expo Application Services)](https://expo.dev/eas) for automated cloud compilation

### 📂 Directory Structure

```text
Montra/
├── assets/                  # High-res icons, splash screens & brand emblems
├── src/
│   ├── app/                 # Expo Router screens
│   │   ├── _layout.tsx      # App lifecycle, font loading & splash screen orchestrator
│   │   ├── index.tsx        # Dashboard, budget pacer & savings milestones
│   │   ├── add.tsx          # Fast transaction logging with custom keypad
│   │   ├── history.tsx      # Analytics, search & monthly transaction logs
│   │   ├── limits.tsx       # Budget limits & 7×5 subscription manager
│   │   ├── setup.tsx        # Profile settings, UI mode & CSV data export
│   │   └── onboarding.tsx   # First-launch personalization flow
│   ├── components/          # Reusable UI components (Keypad, Logo, Splash, Cards)
│   ├── constants/           # Color palettes, design tokens & category data
│   ├── db/                  # SQLite schema, queries & database repository
│   ├── hooks/               # Global reactive store & haptics hooks
│   └── utils/               # Currency formatting & analytics helpers
├── app.json                 # Expo native configuration & splash plugins
└── package.json             # Dependencies and scripts
```

---

## 💻 How to Run Locally

If you'd like to inspect the code or run Montra locally on your machine:

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Expo Go](https://expo.dev/go) app installed on your physical device, or an Android/iOS emulator.

### 2. Clone & Install
```bash
# Clone the repository
git clone https://github.com/athulrajmp21/Montra.git
cd Montra

# Install dependencies
npm install
```

### 3. Start the Dev Server
```bash
npx expo start
```
- **On Physical Device**: Scan the QR code displayed in the terminal using the **Expo Go** app (Android) or Camera app (iOS).
- **On Android Emulator**: Press `a`.
- **On iOS Simulator**: Press `i` (macOS required).

### 4. Build Your Own APK
To build an installable APK using EAS:
```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
npx eas login

# Trigger cloud Android APK build
npx eas build -p android --profile preview
```

---

## 👤 Author

**Athulraj MP**
- **GitHub**: [@athulrajmp21](https://github.com/athulrajmp21)
- **Email**: [athulrajmp21@gmail.com](mailto:athulrajmp21@gmail.com)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free to use and explore!

<div align="center">
  <sub>⭐ If you find Montra helpful or inspiring, consider giving it a star on GitHub!</sub>
</div>
