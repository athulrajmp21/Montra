# 🗺️ Montra — Product Roadmap & Feature Backlog

This document outlines planned updates, prioritized feature sets, and architecture considerations for upcoming releases of **Montra**.

---

## 🎯 Version 1.1.0 — Security, Data Portability & Experience Update

### 1. 🛡️ Biometric & PIN App Lock
- **Objective**: Protect sensitive personal finance records whenever the app is reopened or brought back from the background.
- **Key Capabilities**:
  - Fingerprint / Touch ID and Face Unlock using native hardware security.
  - Fallback custom 4-digit or 6-digit numeric security PIN.
  - Configurable auto-lock delay (*Immediately*, *After 1 minute*, *After 5 minutes*).
- **Tech Stack**: `expo-local-authentication`, SecureStore for hashed PIN salt.

---

### 2. 📦 Full Offline Backup & Restore (Data Portability)
- **Objective**: Allow users to safely transfer their financial records to a new smartphone without compromising the 100% offline, zero-cloud promise.
- **Key Capabilities**:
  - **Export**: Generate an encrypted `.montra` or timestamped JSON backup file containing all transactions, subscriptions, and custom categories.
  - **Import / Restore**: One-tap restore with validation to prevent schema corruption.
  - **Native Sharing**: Share backup file directly to Google Drive, local SD card, USB storage, or email via the native OS share sheet.
- **Tech Stack**: `expo-file-system`, `expo-sharing`, SQLite schema serializer.

---

### 3. 🔔 On-Device Due-Date Bill Reminders
- **Objective**: Ensure users never miss a recurring subscription or utility payment.
- **Key Capabilities**:
  - 100% on-device scheduled local notifications (zero server/push token tracking).
  - Configurable alert timing (e.g., *On the due date at 9:00 AM*, *1 day before*).
  - Interactive notification actions: *"Mark Paid"* or *"Remind Tomorrow"*.
- **Tech Stack**: `expo-notifications` (local scheduled triggers).

---

### 4. 🌙 Midnight Botanical Dark Mode
- **Objective**: Provide a soothing, battery-saving dark interface for night-time logging and OLED displays.
- **Key Capabilities**:
  - Deep forest and charcoal tones (`#121811`, `#1C241B`) accented with calm sage green (`#8DA87B`).
  - Seamless auto-switching matching system settings or manual toggle in Settings.
  - Full contrast compliance across both Standard Mode and Senior / Easy Mode.
- **Tech Stack**: Theme provider token expansion in `src/constants/theme.ts`.

---

### 5. 🏷️ Custom Categories & Budget Allocation
- **Objective**: Allow users with specialized spending habits (e.g., Freelance, Hobbies, Pets) to tailor Montra to their life.
- **Key Capabilities**:
  - Add, edit, or archive custom expense and income categories.
  - Curated icon library selection (Lucide icon set).
  - Custom color tag picker and individual monthly spending targets.
- **Tech Stack**: SQLite `categories` table schema migration and category manager UI.

---

### 6. 📎 Receipt & Bill Photo Attachments
- **Objective**: Attach physical receipts, warranties, or payment screenshots to transaction logs.
- **Key Capabilities**:
  - Take photo or choose from device gallery.
  - On-device image compression to keep app lightweight.
  - Local sandboxed image storage linked to transaction UUID.
- **Tech Stack**: `expo-image-picker`, `expo-file-system`.

---

## 🔮 Future Horizon (v1.2.0+)

- [ ] **PDF Monthly Statement**: Generate visually styled, printable financial summary sheets.
- [ ] **Spending Trends & Heatmap**: Interactive GitHub-style activity calendar showing high and low spending days.
- [ ] **Debt & Loan Payoff Tracker**: Simple, offline amortization tracker for personal loans or credit card balances.
- [ ] **Multi-Currency Support**: Ability to log transactions in secondary currencies with manual exchange rate conversion.
