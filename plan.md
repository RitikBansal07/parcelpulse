# PROJECT 2: ParcelPulse — Delivery Operations Demo (`plan.md`)

## 1. Project Overview & Goals
**ParcelPulse** is an offline-first delivery driver workflow application built with React Native (Expo) and TypeScript. It models the high-reliability operational loops of a field logistics app—strict order state transitions, simulated route visualization, active shift tracking, and an offline mutation outbox—while running 100% locally in the browser (via `react-native-web` on **GitHub Pages**) and on iOS/Android.

### Core Objectives
- **Deterministic Order State Machine:** Enforce strict, one-way or valid recovery transitions (e.g., an order cannot jump from `ASSIGNED` directly to `DELIVERED` without being `PICKED_UP` and `EN_ROUTE`).
- **Offline Outbox & Auto-Replay Queue:** Allow drivers to advance order statuses while offline (e.g., in an elevator or dead zone), persist queued mutations locally, and automatically replay them in FIFO order when connectivity is restored.
- **Zero-Key Simulated Route & Map Panel:** Render an interactive SVG/Canvas vector route map with pickup/dropoff pins, progress interpolation, and ETA calculations without requiring Google Maps or Mapbox API keys.
- **Strong Engineering Evidence:** Pure TypeScript state machine functions, swappable mock API client, optimistic UI updates, conflict/retry handling, and unit/integration test coverage.

### Non-Goals (Guardrails)
- **No Background GPS Polling:** Uses simulated route checkpoints and manual/step-based driver progress rather than battery-draining native background location daemons.
- **No Real Customer PII:** Uses synthetic hub locations, masked phone numbers (`+1-555-0199`), and fictional recipient names.
- **No Paid Map SDKs or External Servers:** Zero runtime keys required; all mock server state and outbox queues persist in `AsyncStorage` (`localStorage` on Web).

---

## 2. Tech Stack & Tooling

| Category | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | Expo SDK (React Native + React Native Web) | Cross-platform iOS, Android, and static Web export for GitHub Pages. |
| **Language** | TypeScript (Strict Mode) | Enforces finite state machine transition maps and outbox action payloads. |
| **Navigation** | Expo Router (or React Navigation) | Deep-linkable stack & tab navigation with web URL support. |
| **State & Offline Queue** | Zustand + `persist` middleware (`AsyncStorage`) | Manages the persistent Offline Outbox Queue, simulated network connectivity toggle, and local server DB cache. |
| **Async / Server Cache** | TanStack Query (React Query v5) | Handles query invalidation, optimistic updates, and loading/error states over the mock API adapter. |
| **Map Visualization** | `react-native-svg` | Renders a lightweight, key-free vector street grid, polyline route, hub/customer pins, and animated driver marker. |
| **Testing** | Jest + React Native Testing Library (RNTL) | Unit tests for the finite state machine + offline queue replay, and component tests for action button guards. |
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
│   │   └── mockSeedData.ts             # Synthetic manifest of 8–10 assigned parcels with coordinates
│   ├── domain/                         # Pure Business Logic (Zero UI dependencies)
│   │   ├── orderStateMachine.ts        # Strict state transition map, guards, and reason validators
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
│   │       ├── SimulatedMapPanel.tsx   # SVG route map showing depot -> driver -> dropoff coordinates
│   │       ├── StatusActionSheet.tsx   # Renders ONLY valid next transitions + failure reason picker
│   │       └── CustomerContactCard.tsx # Masked call/text simulation modal + delivery instructions
│   ├── screens/
│   │   ├── ManifestListScreen.tsx      # Assigned order queue (Active, Upcoming, Completed filters)
│   │   ├── OrderDetailScreen.tsx       # Map panel, customer card, package specs, transition controls
│   │   └── OutboxInspectorScreen.tsx   # View queued offline events, retry status, and sync audit log
│   ├── types/
│   │   ├── domain.ts                   # Order, OrderStatus, TransitionEvent, OutboxItem
│   │   └── navigation.ts               # RootStackParamList
├── __tests__/
│   ├── orderStateMachine.test.ts       # Exhaustive unit tests for allowed & rejected transitions
│   ├── outboxReplay.test.ts            # Tests offline queueing, FIFO replay, and conflict handling
│   └── OrderDetailActions.test.tsx     # UI test verifying invalid transition buttons cannot be triggered
├── app.json                            # Configured with experiments.baseUrl for GitHub Pages
└── package.json