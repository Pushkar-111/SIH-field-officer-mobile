# SIH Field Officer Mobile Application
### National Legal Metrology Verification System

[![Expo](https://img.shields.io/badge/Expo-SDK_57-blue.svg)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB.svg)](https://reactnative.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Problem Statement & Overview

In legal metrology administration, verifying commercial weights and measuring instruments across vast geographical zones poses severe operational challenges—ranging from fraudulent inspection records and lack of geo-verification to delayed data transmission from remote areas with poor network coverage.

The **SIH Field Officer Mobile Application** serves as an on-ground digital companion for **Legal Metrology Officers (LMO)**. It modernizes and secures field operations by enabling tamper-resistant on-site inspections, real-time device geo-tagging, photographic evidence capture, instant test error calculations, and seamless offline-first synchronization with the central government portal.

---

## 🚀 Key Capabilities

- **Automated Field Task Synchronization:** Real-time retrieval of assigned inspection duties from the central cloud backend (`/field-officer/tasks`) upon officer authentication.
- **Native GPS Geo-Tagging:** High-precision hardware GPS coordinate acquisition via `expo-location` ensuring physical inspector presence at verified business premises.
- **Instrument Evidence Capture:** Integrated native camera interface powered by `expo-camera` capturing visual evidence of metrological instruments, stamping inspection records with cryptographic metadata.
- **WinterCG-Compliant Multipart Uploads:** Robust photographic file streaming to cloud endpoints using the modern Expo FileSystem API (`expo-file-system`) compatible with strict Fetch multipart boundaries.
- **Offline-First Resilience:** Zero-loss offline queue architecture managed by `DataContext` and `@react-native-async-storage/async-storage` allowing field officers to capture data in remote/blackout areas and automatically sync when connectivity is restored via `@react-native-community/netinfo`.
- **Status Lifecycle & Integrity Control:** Automated test error tolerance validation (`<= 0.05%` Pass / Fail criteria), security seal number tracking, and instantaneous state transitions to `Inspection Reported`.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework & Runtime** | [React Native](https://reactnative.dev/) (0.86.3), [Expo](https://expo.dev/) (SDK 57) |
| **Navigation** | [React Navigation 7](https://reactnavigation.org/) (Native Stack & Bottom Tabs) |
| **State & Persistence** | React Context API (`AuthContext`, `DataContext`), `@react-native-async-storage/async-storage` |
| **Hardware & Native Modules** | `expo-camera`, `expo-location`, `expo-file-system` (WinterCG `File` API) |
| **Network & Sync** | Fetch API with automatic boundary encoding, `@react-native-community/netinfo` |
| **Backend Integration** | REST API hosted on Render (`https://sih26036-final.onrender.com/api`) |

---

## 📂 Project Structure

```text
sih_mobile/
├── assets/                  # Application icons, splash screens, and adaptive assets
├── src/
│   ├── config.js            # Central API base URL configuration
│   ├── context/
│   │   ├── AuthContext.js   # JWT authentication state & session management
│   │   └── DataContext.js   # Task cache, offline queue & synchronization state
│   ├── navigation/
│   │   └── AppNavigator.js  # Role-gated authentication and dashboard navigators
│   └── screens/
│       ├── auth/
│       │   └── LoginScreen.js          # Field officer credential validation
│       └── main/
│           ├── CameraScreen.js         # Fullscreen viewfinder & photo capture
│           ├── DashboardScreen.js      # Inspection task dispatch & sync counters
│           ├── ProfileScreen.js        # Officer profile & offline queue inspection
│           └── TaskDetailScreen.js     # Geo-tagging, seal verification & report submission
├── App.js                   # Application root with context providers
├── app.json                 # Expo configuration & permissions
├── package.json             # Manifest and dependencies
└── tsconfig.json            # TypeScript / JavaScript compilation settings
```

---

## ⚙️ Local Setup & Execution Guide

### Prerequisites
- Node.js (v18.x or later)
- npm or bun
- Physical mobile device with [Expo Go](https://expo.dev/go) installed (Android / iOS) or an active simulator.

### 1. Clone & Install Dependencies
```bash
git clone <REPOSITORY_URL>
cd sih_mobile
npm install
```

### 2. Configure Backend Endpoint
Verify or update the central API endpoint in `src/config.js`:
```javascript
// src/config.js
export const API_BASE_URL = 'https://sih26036-final.onrender.com/api';
```

### 3. Run Development Server
```bash
npx expo start
```
- Scan the displayed QR code with your camera (iOS) or the **Expo Go** application (Android) to launch the app on your physical device.
- Press `a` in the terminal for Android Emulator or `i` for iOS Simulator.

---

## 📦 Production & Standalone Builds (EAS)

To produce standalone release binaries (`.apk` / `.aab` / `.ipa`) for production deployment:

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Authenticate EAS
```bash
eas login
```

### 3. Build Android Preview / Production APK
```bash
# Build standalone Android APK for field testing
eas build -p android --profile preview

# Build production Android App Bundle for Google Play
eas build -p android --profile production
```

---

## 👥 Smart India Hackathon (SIH) Team
Developed for **Smart India Hackathon** — Department of Consumer Affairs, Legal Metrology Division.
