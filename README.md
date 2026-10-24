<div align="center">

  <img src="./assets/icon.png" alt="Montra Logo" width="108" height="108" style="border-radius: 28px;" />

  # Montra
  ### *Money gets organised.*

  <p align="center">
    A minimalist, privacy-first personal money management application designed for calm, conscious, and effortless financial clarity.
  </p>

  <p align="center">
    <a href="#-key-features"><strong>Explore Features</strong></a> •
    <a href="#-getting-started"><strong>Getting Started</strong></a> •
    <a href="#-how-to-use"><strong>How to Use</strong></a> •
    <a href="#-design--brand-identity"><strong>Design Identity</strong></a> •
    <a href="#-architecture"><strong>Architecture</strong></a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Expo-SDK%2052-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo SDK" />
    <img src="https://img.shields.io/badge/React%20Native-0.76-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
    <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Database-SQLite%20(Offline)-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
    <img src="https://img.shields.io/badge/Privacy-100%25%20Local-747B4B?style=for-the-badge" alt="Privacy First" />
  </p>

</div>

---

## 🌿 Philosophy & Overview

**Montra** was built to replace stressful banking dashboards, noisy notifications, and cluttered spreadsheets with a serene, tactile, and mindful financial companion.

- **100% Offline & Private**: All data stays exclusively on your device in a local SQLite database. No external cloud servers, no account sign-ups, and no tracking.
- **Calm Botanical Aesthetics**: Warm cream surfaces, organic olive and sage accents, generous whitespace, and tactile haptic feedback.
- **Dual UI Modes**: Full support for both **Standard Mode** (rich analytical tools) and **Senior Citizen Easy Mode** (high-contrast, oversized typography, simple terms, and uncluttered layouts).

---

## ✨ Key Features

### 1. 📊 Home Dashboard & Safe-to-Spend Pacer
- **Real-Time Safe-to-Spend**: Calculates your exact daily burn budget (`⚡ ₹X / day remaining`) based on days left in the billing cycle to prevent end-of-month budget shocks.
- **Visual Budget Progress**: Dynamic botanical progress bars showing overall and category-specific utilization.
- **Smart Financial Advisor**: Context-aware proactive insights alerting you if spending is running ahead of pace or celebrating healthy savings habits.
- **Savings Milestones**: Visual tracking card for monthly wealth accumulation and investment goals.

### 2. ⚡ Recurring Subscriptions & Fixed Bills Hub
- **7×5 Calendar Grid Due Day Picker**: Intuitive, clutter-free 1–31 numerical grid for selecting billing days without clunky steppers.
- **1-Tap "Log Paid"**: Instantly records your recurring bill as an expense transaction with correct category and payment method in a single tap.
- **Urgency Badges**: Real-time tags highlighting commitments due today, tomorrow, or in upcoming days.
- **Annualized Wealth Impact**: Displays both the monthly commitment and the full annualized cost (`/ yr`) for conscious spending.
- **Flexible Billing Frequencies**: Full support for Monthly, Quarterly, and Yearly billing cycles with automatic monthly amortization.

### 3. 💳 Effortless Transaction Tracking
- **3-Way Payment Method Tagging**: Track transactions by **Cash 💵**, **UPI / Bank 📱**, or **Card 💳**.
- **Dual Quick-Entry Screen**: Accessible custom tactile keypad with instant category selection.
- **Flexible Dating & Notes**: Log entries for Today, Yesterday, or backdate with an interactive calendar modal, complete with optional notes.
- **Vehicle & Transport / Fuel Category**: Dedicated budgeting and expense tracking for commuting and fuel costs.

### 4. 📈 Visual Spending Analytics & History
- **Category Spending Distribution**: Ranked visual breakdown with percentage share and category-specific color coding.
- **Month-over-Month Delta**: Compare current spending against the previous month (`🌿 12% lower than September`).
- **Cash Flow Comparison**: Side-by-side comparative bars illustrating total cash inflow vs outflow.
- **Live Search & History Filter**: Filter past transactions instantly by merchant, note keywords, or switch between historical months.

### 5. 🛡️ Data Ownership & Backup
- **One-Tap CSV Export**: Export your entire financial history to CSV and share or save it via your native OS share sheet.
- **Local Database Management**: Reset, restore, or wipe your local SQLite database securely at any time.

---

## 🎨 Design & Brand Identity

Montra embraces a refined financial design language rooted in warmth and clarity:

| Token | Color Code | Role |
|:---|:---|:---|
| **Warm Cream** | `#F7F5EE` | Primary screen backgrounds & calm canvas |
| **Primary Olive** | `#747B4B` | Core brand accents, selected dates & primary actions |
| **Dark Olive** | `#555D36` | Subheadings, secondary badges & brand outlines |
| **Soft Sage** | `#DDE1D1` | Progress tracks, subtle borders & pill surfaces |
| **Dark Text** | `#25271F` | High-contrast, legible typography |
| **White** | `#FFFFFF` | Card surfaces & high-contrast elements |

- **Typography**: Complete family of [*Plus Jakarta Sans*](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (Regular, Medium, SemiBold, Bold, ExtraBold).
- **Splash Screen**: Seamless native-to-JS entrance animation featuring the signature Montra squircle emblem with organic white 'M' and sage green leaf.

---

## 📱 How to Use

### 🚀 First-Time Onboarding
1. On first launch, Montra presents a personalized onboarding flow.
2. Enter your preferred display name.
3. Select your UI mode:
   - **Standard Mode**: Best for power users who want deep insights, category limits, and spending pacers.
   - **Senior / Easy Mode**: Best for users who prefer simplified terms (e.g. *Doctor & Health*, *Vehicle & Fuel*), extra-large fonts, and minimal clutter.
4. Set your monthly budget target and configure default payment methods.

### ➕ Logging a Transaction
1. Tap the central **`+`** button in the bottom navigation bar.
2. Enter the amount using the custom tactile keypad.
3. Choose the transaction type (**Expense** or **Income**).
4. Tap the relevant category chip.
5. Select your payment method (**Cash**, **UPI / Bank**, or **Card**).
6. *(Optional)* Add a quick merchant memo or backdate the entry.
7. Tap **Save Transaction**.

### 📅 Managing Subscriptions & Limits
1. Navigate to the **Limits** tab from the bottom bar.
2. View your categorized monthly budget limits and update targets as needed.
3. Scroll to the **Subscriptions & Fixed Bills** section:
   - Tap **`+ Add Subscription`**.
   - Enter service name and amount.
   - Tap the **Due Day** picker to select the billing day on the clean 7×5 grid.
   - Choose your billing cycle (Monthly, Quarterly, Yearly).
   - Save the subscription (pinned button at the bottom of the overlay).
4. When a bill is due, tap **Log Paid** to record it in one click!

### 🔍 Exploring Insights & History
1. Navigate to the **History** tab.
2. Review your **Category Spending Distribution** and **Month-over-Month** spending trends.
3. Use the search bar to find transactions by keyword or use the month switcher (`◀ Month Year ▶`) to review previous months.

---

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- [Expo Go](https://expo.dev/go) app installed on your physical iOS/Android device, or an Android/iOS emulator.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/montra.git
   cd montra
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Expo development server**:
   ```bash
   npx expo start
   ```

4. **Run on your device**:
   - **Physical Device**: Scan the generated QR code in your terminal with the **Expo Go** app (Android) or the Camera app (iOS).
   - **Android Emulator**: Press `a` in your terminal.
   - **iOS Simulator**: Press `i` in your terminal (macOS required).
   - **Web Browser**: Press `w` in your terminal.

---

## 📂 Project Structure

```text
Montra/
├── assets/                  # App icons, favicon, brand assets & splash graphics
│   ├── icon.png             # Official 1024x1024 squircle emblem
│   └── favicon.png          # High-resolution badge asset
├── src/
│   ├── app/                 # Expo Router file-based screens & navigators
│   │   ├── _layout.tsx      # Root navigator, font hydration & splash orchestrator
│   │   ├── index.tsx        # Home dashboard, budget pacer & savings milestones
│   │   ├── add.tsx          # Keypad transaction entry & date/note picker
│   │   ├── history.tsx      # Analytics, category breakdown & transaction log
│   │   ├── limits.tsx       # Monthly budget limits & 7×5 subscription manager
│   │   ├── setup.tsx        # Profile preferences, UI mode & CSV export/reset
│   │   └── onboarding.tsx   # Initial user setup & welcome flow
│   ├── components/          # Modular UI components
│   │   ├── MontraLogo.tsx   # Authentic official brand emblem & wordmark
│   │   ├── MontraSplashScreen.tsx # Production animated launch splash screen
│   │   ├── AdvisorCard.tsx  # Proactive spending tips & burn rate advisor
│   │   ├── BottomNavBar.tsx # Modern floating navigation bar
│   │   ├── Keypad.tsx       # Tactile financial number pad
│   │   └── CustomAlert.tsx  # Accessible themed modal dialogs
│   ├── constants/           # Design system tokens & category definitions
│   │   ├── categories.ts    # Financial categories, colors & Senior mode labels
│   │   └── theme.ts         # Brand color palettes, typography & spacing tokens
│   ├── db/                  # Local SQLite storage layer
│   │   ├── database.ts      # Database connection & schema migrations
│   │   ├── repository.ts    # Data access queries & aggregation logic
│   │   └── schema.ts        # Table definitions & types
│   ├── hooks/               # Custom React hooks
│   │   ├── useMontraStore.tsx # Global reactive state provider
│   │   └── useHaptics.ts    # Native tactile feedback helpers
│   └── utils/
│       └── formatCurrency.ts # Currency formatter (Lakhs/Crores vs Western)
├── app.json                 # Expo configuration & native splash setup
├── package.json             # Dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

---

## 🧪 Quality & Diagnostics

Montra enforces strict typing and SDK compatibility:

```bash
# Run TypeScript type check
npx tsc --noEmit

# Run Expo configuration & dependency doctor
npx expo-doctor
```

---

## 📦 Building Standalone Binaries with EAS

To build standalone installable APKs or release bundles without Android Studio or Xcode:

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Log in to your Expo account
npx eas-cli login

# 3. Build standalone Android APK for local testing
npx eas-cli build -p android --profile preview
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

<div align="center">
  <sub>Crafted with care for calm, intentional living.</sub>
</div>
