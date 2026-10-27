# PROJECT 2: ParcelPulse — Delivery Operations Demo (India Edition) (`plan.md`)

## 1. Project Overview & Goals
**ParcelPulse** is an offline-first delivery driver workflow application built with React Native (Expo) and TypeScript, tailored for **Indian last-mile logistics operations** (Delhivery, Shadowfax, BlueDart, Zepto, Flipkart Logistics). It models the high-reliability operational loops of a field logistics app—strict order state transitions, Cash on Delivery (COD) collection in ₹, 4-digit Delivery OTP verification, society gate clearances (MyGate/NoBroker), simulated Google Maps-styled turn-by-turn route telemetry across Bengaluru (Koramangala, Indiranagar, HSR, Bellandur), and an offline mutation outbox—running 100% locally in the browser (via `react-native-web` on **GitHub Pages**) and natively on iOS/Android.

### Core Objectives
- **Deterministic Order State Machine:** Enforce strict, one-way or valid recovery transitions (`ASSIGNED` $\rightarrow$ `PICKED_UP` $\rightarrow$ `EN_ROUTE` $\rightarrow$ `ARRIVED` $\rightarrow$ `DELIVERED` or `FAILED_ATTEMPT` $\rightarrow$ `RETURNED_TO_HUB`).
- **Offline Outbox & Auto-Replay Queue:** Allow drivers in high-density basement parkings, elevators, or spotty connectivity zones to advance delivery statuses offline, persist mutations locally in `AsyncStorage`, and auto-replay them sequentially in FIFO order when connectivity is restored.
- **Indian Logistics Domain Features:** Native support for Cash on Delivery (₹ COD collection), delivery OTP verification, landmark-based navigation notes, society gate approvals, and Indian operational exception reasons (monsoon waterlogging, stray animal hazards, afternoon dukaan/shop break).
- **Google Maps Navigation Layout:** Authentic Google Maps Driving UI featuring signature `#0F9D58` turn-by-turn maneuver banner, pastel landmass, waterbodies (Agara Lake), live traffic congestion segments (green/amber/red), the iconic **Google Maps Red Teardrop Pin** at dropoff, and **Google Navigation Blue Puck** with GPS radar ring for the vehicle.
- **Direct "Open in Google Maps" Deep-Link:** 1-tap external intent to launch the native Google Maps app or Web navigation directions with exact customer destination coordinates and driving travel mode.
- **Waybill Barcode & QR Scanner:** Interactive camera viewfinder with animated laser line, corner reticles, flashlight/torch toggle, quick simulated scan chips, and manual tracking code search.
- **Proof of Delivery (POD) Photo Capture:** Step in the delivery workflow allowing drivers to photograph parcels at the doorstep or security desk with timestamp & GPS watermark overlay.
- **COD Cash Bag Ledger & Hub Shift Settlement:** Cash reconciliation tracking collected ₹ cash vs. UPI prepaid payments, denomination breakdowns (₹500/₹200/₹100), and end-of-shift cash deposit vouchers for Bengaluru Central Sort Hub #12 (Koramangala).
- **Responsive Handheld Shell (iOS, Android, Web):** Adaptive layout that takes 100% full screen on native mobile with safe-area insets, and elegantly centers as a modern logistics terminal on wide desktop screens.
- **Cross-Platform Native Mapping (`react-native-maps`):** Uses `react-native-maps` with native map providers on iOS/Android and a responsive, key-free vector map canvas on Web for zero-runtime key dependencies.
- **Strong Engineering Evidence:** Pure TypeScript finite state machine functions, swappable mock API client, optimistic UI updates, conflict/retry handling, and 100% unit/integration test coverage.

### Non-Goals (Guardrails)
- **No Background GPS Polling:** Uses simulated route checkpoints and manual step-based driver progress rather than battery-draining native background location daemons.
- **No Real Customer PII:** Uses synthetic Indian hub locations, masked virtual proxy phone numbers (`+91 98860 41289`), and synthetic recipient names.
- **No Paid Map SDKs or External Servers:** Zero runtime keys required; all mock server state and outbox queues persist in `AsyncStorage` (`localStorage` on Web).

---

## 2. Tech Stack & Tooling

| Category | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | Expo SDK (React Native + React Native Web) | Cross-platform iOS, Android, and static Web export for GitHub Pages. |
| **Language** | TypeScript (Strict Mode) | Enforces finite state machine transition maps, COD payment types, and outbox payloads. |
| **Navigation** | React Navigation (Native Stack + Bottom Tabs) | Deep-linkable stack & tab navigation with web URL support. |
| **State & Offline Queue** | Zustand + `persist` middleware (`AsyncStorage`) | Manages the persistent Offline Outbox Queue, simulated network connectivity toggle, and local server DB cache. |
| **Async / Server Cache** | TanStack Query (React Query v5) | Handles query invalidation, optimistic updates, and loading/error states over the mock API adapter. |
| **Map Engine** | `react-native-maps` + `react-native-svg` | Native Apple/Google Maps rendering on iOS/Android with custom pins & polyline, and zero-key Google Maps-styled vector canvas on Web. |
| **Testing** | Jest + React Native Testing Library (RNTL) | Unit tests for finite state machine + offline queue replay, and component tests for action button guards. |
| **Deployment** | GitHub Actions + `gh-pages` | Automated CI test execution and static web export (`npx expo export -p web`). |

---

## 3. Architecture & Folder Structure

```text
parcelpulse/
├── .github/
│   └── workflows/
│       └── deploy-gh-pages.yml         # CI test runner + static web export to GH Pages
├── src/
│   ├── api/                            # Swappable Service Layer (Mock <-> HTTP)
│   │   ├── client.ts                   # Interface contract (IParcelPulseApi)
│   │   ├── mockApi.ts                  # In-memory + persisted mock server (v3 cache key with Indian dataset)
│   │   ├── httpApi.ts                  # Stubbed future REST implementation
│   │   ├── mockSeedData.ts             # Synthetic manifest of 8 assigned parcels with Bengaluru coordinates
│   │   └── queries.ts                  # TanStack Query hooks (useOrdersQuery, useTransitionMutation)
│   ├── domain/                         # Pure Business Logic (Zero UI dependencies)
│   │   ├── orderStateMachine.ts        # Strict state transition map, Indian exception codes, and guards
│   │   └── routeSimulator.ts           # Calculates distance, ETA, and polyline progress % per status
│   ├── sync/                           # Offline-First Engine
│   │   ├── useNetworkStore.ts          # Simulated Online / Offline / Flaky 500 toggle state
│   │   ├── useOutboxStore.ts           # Persisted FIFO queue of pending status transition mutations
│   │   └── syncWorker.ts               # Replays outbox items sequentially when Online is restored
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx              # High-contrast operational CTA button (gloved/one-handed sizing)
│   │   │   ├── StatusBadge.tsx         # Semantic status pill + "Pending Sync" cloud icon
│   │   │   └── ScreenState.tsx         # Loading skeleton, Empty manifest, and Error retry wrapper
│   │   └── domain/
│   │       ├── ActiveOrderBanner.tsx   # Sticky global banner showing current in-progress delivery & COD info
│   │       ├── NetworkControlBar.tsx   # Demo toolbar: Toggle Online/Offline, Queue Badge, "Sync Now"
│   │       ├── LiveMap.tsx             # Cross-platform map wrapper (Native MapView vs Web Canvas)
│   │       ├── LiveMap.native.tsx      # Native react-native-maps implementation with custom pins
│   │       ├── LiveMap.web.tsx         # Authentic Google Maps cartography (Agara Lake, ORR, Traffic, Red Pin, Blue Puck)
│   │       ├── SimulatedMapPanel.tsx   # Google Maps Turn-by-Turn navigation layout & live ETA dashboard
│   │       ├── StatusActionSheet.tsx   # Renders ONLY valid next transitions + failure reason picker
│   │       └── CustomerContactCard.tsx # Masked Indian proxy IVR/SMS/WhatsApp modal + landmark details
│   ├── screens/
│   │   ├── ManifestListScreen.tsx      # Assigned order queue (Shift summary, Tata Ace EV, COD tags)
│   │   ├── OrderDetailScreen.tsx       # Map panel, customer card, OTP, COD specs, transition controls
│   │   └── OutboxInspectorScreen.tsx   # View queued offline events, retry status, and sync audit log
│   ├── types/
│   │   ├── domain.ts                   # Order, OrderStatus, TransitionEvent, OutboxItem, PaymentMethod
│   │   └── navigation.ts               # RootStackParamList
├── __tests__/
│   ├── orderStateMachine.test.ts       # Exhaustive unit tests for allowed & rejected transitions
│   ├── outboxReplay.test.ts            # Tests offline queueing, FIFO replay, and conflict handling
│   └── OrderDetailActions.test.tsx     # UI test verifying invalid transition buttons cannot be triggered
├── app.json                            # Configured with experiments.baseUrl for GitHub Pages
├── preview-server.js                   # Node.js production preview server on port 5001
└── package.json
```

---

## 4. Key Implementation Details

### A. Indian Context & Fleet Profile
- **Vehicle**: `KA 01 EK 4921 (Tata Ace EV • Chhota Hathi)`
- **Driver**: **Ramesh Gowda** (Slot 1 Shift, Koramangala Hub #12)
- **Logistics Hub**: **Bengaluru Central Sort Hub #12, Koramangala 4th Block** (Near Sony World Signal Junction)
- **Localities**: Indiranagar (Behind Toit), HSR Layout (Sector 6), Bellandur (EcoSpace Tech Park), Domlur (Embassy GolfLinks Infosys), BTM Layout (Udupi Garden Signal), Sarjapur Road (Wipro SEZ), Jayanagar 4th Block, Whitefield (Adarsh Palm Meadows).

### B. Google Maps Navigation Layout
1. **Turn-by-Turn Banner (`#0F9D58` Google Green)**: Next maneuver icon, distance to turn (e.g. `In 350 m`), and direction text (`Turn right onto 100 Feet Rd towards Indiranagar`).
2. **Cartography & Traffic**: Beige landmass (`#F4F3F0`), Agara Lake water body (`#AADAFF`), BDA green parks (`#D5ECD4`), Outer Ring Road in highway yellow (`#FDE293`), and live traffic flow indicators (green/yellow/red).
3. **Map Pins**: Classic **Google Maps Red Teardrop Pin** (`#EA4335`) at destination with floating recipient card bubble, and **Google Navigation Blue Puck** (`#4285F4`) with pulsing radar ripple at vehicle location.
4. **Bottom ETA Bar**: Bold green arrival estimate (**`12 min`** in `#188038`), distance, arrival clock time, and fastest route confirmation.

### C. Offline Engine & Resilience
- Persistent FIFO outbox queue in `AsyncStorage` (`@parcelpulse_outbox_v1`).
- Network modes: `ONLINE`, `OFFLINE`, and `FLAKY_500` (simulates 500 upstream timeouts).
- Automatic replay on network reconnection and manual "Sync Now" trigger.
- Storage cache key updated to `@parcelpulse_orders_in_v3` with auto-migration from legacy caches.

---

## 5. Verification & Testing

- **TypeScript Typecheck**: `npx tsc --noEmit` $\rightarrow$ **0 errors**.
- **Jest Test Suite**: **17/17 tests passing (100%)**:
  - `__tests__/orderStateMachine.test.ts`: Linear transitions, jump rejections, signature and failure guards.
  - `__tests__/outboxReplay.test.ts`: Offline queuing, sequential FIFO replay, network pause, conflict handling.
  - `__tests__/OrderDetailActions.test.tsx`: Dynamic button display per status, gloved button interactions, terminal state rendering.
- **Static Web Export**: Exported into `dist/` with `npx expo export -p web`.
- **Production Preview**: Running locally on `http://localhost:5001/parcelpulse/`.
