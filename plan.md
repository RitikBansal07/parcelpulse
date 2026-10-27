# PROJECT 2: ParcelPulse — Delivery Operations Demo (India Edition) (`plan.md`)

## 1. Project Overview & Goals
**ParcelPulse** is an offline-first delivery driver workflow application built with React Native (Expo) and TypeScript, tailored for **Indian last-mile logistics operations** (Delhivery, Shadowfax, BlueDart, Zepto). It models the high-reliability operational loops of a field logistics app—strict order state transitions, Cash on Delivery (COD) / UPI Prepaid verification, society gate clearances (MyGate/NoBroker), simulated route telemetry (Koramangala, Indiranagar, HSR, Bellandur), and an offline mutation outbox—running 100% locally in the browser (via `react-native-web` on **GitHub Pages**) and on iOS/Android.

### Core Objectives
- **Deterministic Order State Machine:** Enforce strict, one-way or valid recovery transitions (e.g., an order cannot jump from `ASSIGNED` directly to `DELIVERED` without being `PICKED_UP` and `EN_ROUTE`).
- **Offline Outbox & Auto-Replay Queue:** Allow drivers in high-density basement parkings, elevators, or spotty connectivity zones to advance delivery statuses offline, persist mutations locally in `AsyncStorage`, and auto-replay them in FIFO sequence when back online.
- **Indian Logistics Domain Context:** Native support for Cash on Delivery (₹ COD collection), delivery OTP verification, landmark-based navigation notes, and operational exceptions (monsoon waterlogging, society entry gate clearance).
- **Zero-Key Simulated Route & Map Panel:** Render an interactive SVG vector street grid with hub/dropoff pins and driver vehicle markers (Tata Ace EV • Chhota Hathi) without requiring Google Maps or Mapbox API keys.
- **Strong Engineering Evidence:** Pure TypeScript state machine functions, swappable mock API client, optimistic UI updates, conflict/retry handling, and 100% unit/integration test coverage.

### Non-Goals (Guardrails)
- **No Background GPS Polling:** Uses simulated route checkpoints and manual step-based driver progress rather than battery-draining native background location daemons.
- **No Real Customer PII:** Uses synthetic Indian hub locations, masked phone numbers (`+91 98860 41289`), and synthetic recipient names.
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
| **Map Visualization** | `react-native-svg` | Renders a lightweight, key-free vector street grid, polyline route, hub/customer pins, and Tata Ace EV driver marker. |
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
│   │   ├── mockApi.ts                  # In-memory + persisted mock server with network/latency simulator
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
│   │       ├── ActiveOrderBanner.tsx   # Sticky global banner showing current in-progress delivery
│   │       ├── NetworkControlBar.tsx   # Demo toolbar: Toggle Online/Offline, Queue Badge, "Sync Now"
│   │       ├── SimulatedMapPanel.tsx   # SVG route map showing Koramangala Hub -> Tata Ace EV -> Dropoff
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
└── package.json
```
