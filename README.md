# ParcelPulse — Last-Mile Delivery Operations Demo (India Edition)

[![CI/CD Test & Deploy](https://img.shields.io/badge/CI%2FCD-GitHub%20Pages%20Automated-brightgreen)](https://github.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-17%2F17%20Passing-success)](https://jestjs.io/)
[![Expo](https://img.shields.io/badge/Expo%20SDK-58.0-black)](https://expo.dev/)
[![React Native Maps](https://img.shields.io/badge/Maps-react--native--maps-4285F4)](https://github.com/react-native-maps/react-native-maps)

**ParcelPulse** is an offline-first delivery driver workflow application built with **React Native (Expo SDK)**, **TypeScript (Strict Mode)**, **React Navigation**, **TanStack Query**, **Zustand**, and **`react-native-maps`**.

Tailored for **Indian last-mile logistics operations** (Delhivery, Shadowfax, BlueDart, Zepto, Flipkart Logistics), it models high-reliability operational loops—strict finite state transitions, Cash on Delivery (COD) collection in ₹, 4-digit Delivery OTP verification, society gate clearances (MyGate/NoBroker), and an offline mutation outbox with automated FIFO replay—running 100% locally in the browser via `react-native-web` on **GitHub Pages** and natively on iOS/Android.

---

## 🚀 Key Features

### 1. Indian Last-Mile Logistics Context
- **Fleet Profile**: `KA 01 EK 4921 (Tata Ace EV • Chhota Hathi)` operated by **Ramesh Gowda** out of **Bengaluru Central Sort Hub #12, Koramangala 4th Block**.
- **Bengaluru Metro Delivery Route**: 8 realistic delivery stops across **Indiranagar** (Sai Balaji Residency behind Toit), **HSR Layout** (Sector 6 near BDA Complex), **Bellandur** (Green Glen Layout near EcoSpace), **Domlur** (Embassy GolfLinks Infosys campus), **BTM Layout** (2nd Stage), **Sarjapur Road** (SJR Palazza City opposite Wipro SEZ Gate 2), **Jayanagar 4th Block**, and **Whitefield** (Adarsh Palm Meadows).
- **Cash on Delivery (COD)**: Prominent Indian rupee amount badges (`Collect Cash: ₹1,499`, `₹3,850`) alongside **UPI / Card Prepaid** indicators.
- **4-Digit Delivery OTP**: Verified handover protocol (`OTP: 4821`, `6104`, `9102`) standard in Indian e-commerce logistics.
- **Society Clearances & Exception Reasons**:
  - Gated society entry clearances (MyGate / NoBroker OTP approval).
  - Indian operational blockers: Customer phone switched off / no answer, society guard entry denied, monsoon road waterlogging / stray dog hazards, and afternoon commercial dukaan break.
- **Telecom Privacy Proxy**: Masked phone proxy simulation with **WhatsApp delivery notification template** and IVR calls.

### 2. Google Maps Turn-by-Turn Navigation Layout
- **Turn-by-Turn Maneuver Header (`#0F9D58` Google Green)**: Next turn distance (`In 350 m`), directional arrow icon, and street guidance (`Turn right onto 100 Feet Rd towards Indiranagar`).
- **Google Maps Cartography**: Authentic Google Maps light mode landmass (`#F4F3F0`), waterbodies (Agara Lake `#AADAFF`), BDA parks (`#D5ECD4`), and Outer Ring Road in signature highway yellow (`#FDE293` with `#F9AB00` border).
- **Iconic Map Markers**:
  - **Dropoff**: The classic **Google Maps Red Teardrop Pin** (`#EA4335`) with drop shadow and floating recipient bubble.
  - **Driver Vehicle**: The iconic **Google Navigation Blue Puck** (`#4285F4`) with pulsing GPS radar ripple.
  - **Depot**: Corporate logistics gray pin (`#5F6368`).
- **Live Traffic Layer**: Color-coded traffic flow indicators along arterial corridors (green free-flow, yellow moderate junction, red bottleneck).
- **Bottom Navigation ETA Dashboard**: Big bold green ETA (**`12 min`** in `#188038`), remaining km (`4.8 km`), arrival clock time (`10:35 AM`), and fastest route confirmation.

### 3. Offline-First Synchronization Engine
- **Persistent Outbox Queue**: All state transitions made in dead zones, elevators, or basement parking garages persist in local storage via `AsyncStorage` (`localStorage` on Web).
- **Automated FIFO Replay**: Sequential outbox worker drains pending mutations in FIFO order as soon as network reconnection is detected.
- **Simulated Network Modes**: Toggle between **`ONLINE`**, **`OFFLINE`**, and **`FLAKY_500`** (simulating 500 upstream timeouts) directly from the header toolbar.
- **Outbox Inspector**: Dedicated screen to monitor queue depth, retry attempt counts, last error diagnostics, and synced audit logs.

### 4. Cross-Platform Mapping (`react-native-maps`)
- **Native (iOS/Android)**: Uses `react-native-maps` with native map providers, polyline routing, and custom markers.
- **Web (Browser / GitHub Pages)**: Uses a responsive vector map canvas with zero runtime API keys required.

---

## 🛠️ Architecture

```text
parcelpulse/
├── .github/
│   └── workflows/
│       └── deploy-gh-pages.yml         # CI test runner + static web export to GitHub Pages
├── src/
│   ├── api/                            # Swappable Service Layer (Adapter Pattern)
│   │   ├── client.ts                   # IParcelPulseApi interface contract
│   │   ├── mockApi.ts                  # In-memory + persisted mock server (v3 cache key with Indian dataset)
│   │   ├── httpApi.ts                  # Stubbed future REST implementation
│   │   ├── mockSeedData.ts             # 8 assigned parcels with Bengaluru coordinates & landmarks
│   │   └── queries.ts                  # TanStack Query hooks (useOrdersQuery, useTransitionMutation)
│   ├── domain/                         # Pure Business Logic (Zero UI dependencies)
│   │   ├── orderStateMachine.ts        # Strict finite state machine, Indian exception codes, and guards
│   │   └── routeSimulator.ts           # Calculates distance, ETA, and polyline progress % per status
│   ├── sync/                           # Offline-First Engine
│   │   ├── useNetworkStore.ts          # Simulated Online / Offline / Flaky 500 toggle state
│   │   ├── useOutboxStore.ts           # Persisted FIFO queue of pending status transition mutations
│   │   └── syncWorker.ts               # Replays outbox items sequentially when Online is restored
│   ├── components/
│   │   ├── ui/                         # Reusable accessible primitives (Button, StatusBadge, ScreenState)
│   │   └── domain/                     # LiveMap, SimulatedMapPanel, StatusActionSheet, CustomerContactCard, ActiveOrderBanner, NetworkControlBar
│   ├── screens/                        # ManifestListScreen, OrderDetailScreen, OutboxInspectorScreen
│   ├── types/                          # domain.ts & navigation.ts
│   └── utils/
├── __tests__/                          # Jest test suites (17/17 passing)
│   ├── orderStateMachine.test.ts       # Finite state machine transitions & guards
│   ├── outboxReplay.test.ts            # Offline queuing & sequential replay
│   └── OrderDetailActions.test.tsx     # UI button visibility & invalid transition guards
├── app.json                            # Configured with experiments.baseUrl for GitHub Pages
├── preview-server.js                   # Node.js production preview server on port 5001
└── package.json
```

---

## 🧪 Testing & Verification

Run the Jest test suite:
```bash
npm test
```

Run TypeScript strict type-checking:
```bash
npx tsc --noEmit
```

Build the static web bundle for GitHub Pages deployment:
```bash
npm run export:web
```

---

## 💻 Running Locally

### 1. Start Metro Dev Server (Web):
```bash
npm run web
```

### 2. Start Production Static Preview Server (Port 5001):
```bash
npm run export:web
npm run preview
```
Visit: `http://localhost:5001/parcelpulse/`

### 3. Start iOS / Android with Expo Go:
```bash
npm start
```

---

## 📤 How to Push to GitHub & Run Frontend on GitHub Pages

### Step 1: Create a New GitHub Repository
1. Go to [github.com/new](https://github.com/new).
2. Repository name: **`parcelpulse`**.
3. Set visibility to **Public**.
4. Leave **"Initialize this repository with a README"** **UNCHECKED** (we already have a complete local repository).
5. Click **Create repository**.

### Step 2: Push Local Code to GitHub
In your terminal, navigate to the `parcelpulse` folder and push:

```bash
cd E:\projects\parcelpulse

# Ensure default branch is main
git branch -M main

# Link remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/parcelpulse.git

# Push all code
git push -u origin main
```

### Step 3: Enable GitHub Pages Permissions
To allow GitHub Actions to automatically build and deploy your app:

1. Open your repository on GitHub.
2. Go to **Settings** $\rightarrow$ **Actions** $\rightarrow$ **General**.
3. Scroll down to **Workflow permissions**.
4. Select **Read and write permissions**.
5. Click **Save**.

### Step 4: Configure GitHub Pages Source
1. In your repository, go to **Settings** $\rightarrow$ **Pages**.
2. Under **Build and deployment**:
   - **Source**: Select **Deploy from a branch**.
   - **Branch**: Select **`gh-pages`** and folder **`/ (root)`**.
   - Click **Save**.

*(Note: The `gh-pages` branch will be automatically created by the GitHub Actions workflow on your first push!)*

### Step 5: View Your Live App!
Every time you push to `main`, GitHub Actions will:
1. Run all 17 unit and UI tests.
2. Verify TypeScript type safety (`npx tsc --noEmit`).
3. Build the static web bundle (`npx expo export -p web`).
4. Publish the bundle to GitHub Pages.

Your live frontend will be accessible at:
```text
https://<YOUR_USERNAME>.github.io/parcelpulse/
```

