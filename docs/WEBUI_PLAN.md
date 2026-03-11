# WebUI Development Plan

## Overview

Build a browser-based shadcn UI that replicates ALL functionality from the TUI version with a polished, modern interface.

**Key WebUI Differentiators:**
- **No keyboard shortcuts required** - All actions available via clickable UI (buttons, dropdowns, toggles)
- **Simplified connector system** - No manual provider-to-model mapping. Auto-selects best available provider based on API keys and real-time latency.
- **Smart default launch** - One-click "Launch Best" picks top-ranked model automatically
- **Unified API endpoint** - Single proxy endpoint that routes to the best model based on live ping data
- **Favorites-driven** - Star your favorites, and the system prioritizes them in auto-selection

## Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Library**: shadcn/ui with Tailwind CSS
- **State Management**: React hooks + Context API
- **API Layer**: Next.js API routes

---

## Complete TUI Feature List (for parity verification)

### Table Columns (all must be implemented)
1. **Rank (#)** - SWE-bench rank (1 = best coding score), sortable by `R` key
2. **Tier** - S+, S, A+, A, A-, B+, B, C (color-coded), sortable by `T` key
3. **SWE%** - SWE-bench Verified score percentage, sortable by `S` key
4. **CTX** - Context window size (128k, 200k, 256k, 1M, etc.), sortable by `C` key
5. **Model** - Model name with favorite star indicator (⭐), sortable by `M` key, favorite toggle by `F` key
6. **Provider** - Provider source (NIM, Groq, Cerebras, etc.), sortable by `O` key, filter by `D` key
7. **Latest** - Most recent ping response time in ms, sortable by `L` key
8. **Avg Ping** - Average response time across all pings (200 + 401), sortable by `A` key
9. **Health** - Live status: ✅ UP / 🔥 429 / ⏳ TIMEOUT / ❌ ERR / 🔑 NO KEY, sortable by `H` key
10. **Verdict** - Overall assessment: Perfect / Normal / Spiky / Slow / Overloaded / Unstable / Not Active, sortable by `V` key
11. **Stability** - Composite 0-100 score (p95 + jitter + spike rate + uptime), sortable by `B` key
12. **Up%** - Uptime percentage (successful pings / total pings), sortable by `U` key
13. **Used** - Total tokens consumed (K or M format) from request-log.jsonl
14. **Usage** - Remaining quota percentage for provider (when exposed)

### Ping System
1. **Parallel pings** - All models pinged concurrently
2. **Continuous monitoring** - Never stops, runs forever
3. **Ping cadence modes**:
   - `speed`: 2s intervals for 60s on startup
   - `normal`: 10s steady state
   - `slow`: 30s after 5min idle
   - `forced`: 4s manual override (toggle with `W` key or UI button)
4. **Rolling averages** - Calculated from ALL successful pings since start
5. **Latest ping** - Shows most recent response time
6. **401 handling** - 401 responses still measure real latency (server is UP, just needs key)
7. **Timeout handling** - 15s timeout per ping attempt

### Filtering & Display
1. **Tier filter** - Clickable buttons: All → S+ → S → A+ → A → A- → B+ → B → C
2. **Provider filter** - Dropdown to select specific provider or show all
3. **Hide unconfigured toggle** - Checkbox to hide providers without API keys
4. **Favorites pinned at top** - Starred models always visible regardless of filters
5. **Search input** - Filter by model name

### Smart Launch System (WebUI Enhancement)
Instead of manual connector selection, implement:
1. **Auto-provider selection** - For each model, pick any configured API key for that provider automatically
2. **Launch Best button** - One-click launches the #1 ranked model (according to current filters/sort)
3. **Per-row Launch button** - Each model has a launch icon that uses the best available provider key
4. **Favorite priority** - When auto-selecting "best", favorites are weighted higher
5. **Health-aware** - Only selects models with status "up" or "pending" (avoid down/timeout)

### Settings Overlay (UI-driven)
1. **Provider list** - All providers with:
   - Enable/disable toggle
   - API key input (masked) with add/edit/remove
   - Test connection button (with live result: Testing/OK/Fail/Rate-limited/No model)
   - Setup instructions (signup URL, hint, rate limits)
2. **Proxy settings**:
   - Enable/disable proxy mode toggle
   - Persist proxy in OpenCode toggle
   - Preferred port input (0 = auto)
   - Clean OpenCode proxy config button
3. **Profile management**:
   - Save current config as named profile
   - Load existing profile
   - Delete profile
   - Show active profile indicator
4. **Maintenance**:
   - Check for updates button
   - Update status display
   - Install update button
5. **Telemetry toggle** - Enable/disable anonymous analytics

### Installation Overlay (Y key)
1. **Step 1**: Choose configured provider (multi-select or pick one)
2. **Step 2**: Choose target tool (OpenCode CLI, OpenCode Desktop, OpenClaw, Crush, Goose)
3. **Step 3**: Choose scope (all models OR selected models from table)
4. **Step 4**: Model selection grid (if scope = selected)
5. **Step 5**: Installation progress and results (success/failure per tool)

### Smart Recommend Overlay (Q key)
Same questionnaire but with UI:
1. **Task type**: Dropdown (Quick Fix, Bug Fix, Feature, Refactor, Review, Document, Explore)
2. **Priority**: Radio buttons (Speed, Quality, Balanced)
3. **Context budget**: Dropdown (Small <32k, Medium 32-128k, Large 128-256k, Massive 256k+)
4. **Analyzing**: Progress bar, timer, live ping updates
5. **Results**: Top 3 cards with model details, "Select" button to highlight in table

### Help Overlay (K key or button)
Rather than just keyboard shortcuts, show:
- **Quick actions panel** with clickable buttons for all major actions
- **Column reference** with descriptions
- **Status legend** (all health states, verdicts)
- **FAQ** section (how to add keys, how favorites work, etc.)

### Feature Request / Bug Report
- Textarea with 500 char limit + counter
- Send to Discord webhook
- Status: sending → success/error with retry

### Log Viewer (X key)
- Read from request-log.jsonl
- Table with columns: Time, Provider, Model, Route, Status, Tokens, Latency
- Total tokens consumed (sum)
- Filter by last 24h, last hour, etc.

### Tool Integration (Simplified)
WebUI launches models in external tools:
- **OpenCode CLI** - Spawns process with selected model
- **OpenCode Desktop** - Writes to shared config then opens app
- **OpenClaw** - Writes default model to config
- **Crush** - Installs managed provider catalog
- **Goose** - Installs provider + secrets

**UX improvement**: Instead of cycling tool modes, show a persistent "Launch with:" dropdown next to each model row, or a global dropdown in the header.

### Configuration & Persistence
1. **Config file** - `~/.free-coding-models.json` (shared with TUI)
2. **API keys** - Per-provider, any number of keys, stored securely (0600)
3. **Environment variable override** - NVIDIA_API_KEY, etc.
4. **Favorites** - Star/unstar, persisted
5. **Profiles** - Named snapshots (apiKeys, providers, favorites, settings)
6. **Settings** - Last used sort, filters, ping interval, tool preference

### Providers Supported (all must work)
- NVIDIA NIM, Groq, Cerebras, SambaNova, OpenRouter
- Hugging Face, Replicate, DeepInfra, Fireworks AI, Codestral
- Hyperbolic, Scaleway, Google AI, SiliconFlow, Together AI
- Cloudflare Workers AI, Perplexity, Qwen, ZAI, iFlow

### Header UI (replaces keyboard badges)
- **Tool selector**: Dropdown or buttons for OpenCode/Desktop/OpenClaw/Crush/Goose
- **Ping mode**: Button group (Speed/Normal/Slow/Forced) with current highlighted
- **Tier filter**: Button group (All/S+/S/A+/A/A-/B+/B/C)
- **Provider filter**: Dropdown (All + each provider name)
- **Configured-only**: Toggle switch
- **Active profile**: Badge with dropdown to switch
- **Ping status**: Progress bar (X/Y), countdown timer
- **Launch Best button**: Prominent CTA to launch top model

### Footer UI
- **Quick actions**: Buttons for Settings, Help, Recommend, Install, Feature Request, Bug Report, Logs
- **Keyboard hints**: Show key bindings as reference (optional, not required)
- **Status**: Proxy status, version info, token usage
- **Model count**: Showing X of Y models

### Auto-Update System
- Check npm registry for updates on startup
- Show notification in UI if update available
- Manual "Update Now" button in settings
- Auto-install with restart prompt

### Telemetry
- Optional, disabled by default (opt-in)
- Anonymous: app_start, feature_usage, error counts
- Can enable in settings

### API Layer (WebUI-specific)
1. **GET `/api/models`** - Returns current model list with ping data (for external integrations)
2. **POST `/api/ping`** - Manual ping trigger for a specific model
3. **GET `/api/best`** - Returns the best model according to current filters + health
4. **GET `/api/launch/{modelId}`** - Proxies chat completion to the selected model's provider using appropriate API key
5. **WebSocket (optional)** - Live updates for ping progress

### Unified Launch Endpoint (Key Innovation)
Single proxy endpoint that abstracts all provider complexity:
- **Endpoint**: `POST /api/completions`
- **Authentication**: `X-API-Key: <single-fcm-key>` (user configures one key in FCM)
- **Body**: Standard OpenAI chat completion format
- **Selection Modes** (via headers):
  - `X-Mode: specific` + `X-Model: <providerKey>/<modelId>` → exact model
  - `X-Mode: group` + `X-Group: <tier|provider>` → best model within tier/provider group
  - `X-Mode: round-robin` + `X-Pool: <tier|provider|all>` → cycle through pool
  - `X-Best: true` (legacy) → shortcut for group=tier+provider=none (global best)
- **Behavior**:
  - Validates single FCM API key
  - Selects target model based on mode + filters (health, favorites, score)
  - Proxies request to the actual provider using that provider's stored API key
  - Streams response back, logs usage tokens
  - Rotates round-robin state per pool

**Benefits**:
- Client tools only need ONE API key (the FCM proxy key)
- No need to manage 20 provider keys in every tool
- Intelligent selection (favorites, health, tier) built-in
- Easy to switch models without reconfiguring clients
- Works with any OpenAI-compatible client (OpenCode, Cursor, Windsurf, etc.)

**Round-Robin Algorithm**:
- Maintains cursor position per pool (tier, provider, or all)
- Advances to next healthy, enabled model after each request
- Skips down/timeout models, respects hidden flag
- Resets cursor on app restart (could be persisted in config)

**Group Selection**:
- `X-Group: S+` → pick best S+ model (respects favorites, health)
- `X-Group: groq` → pick best Groq model
- `X-Group: S+:groq` → intersect tier and provider (best S+ from Groq)

### Responsive Design
- **Desktop**: Full table with all columns
- **Tablet**: Horizontal scroll, priority columns visible
- **Mobile**: Stacked cards per model (essential info only), filters as drawer

### Dark/Light Theme
- Default dark theme (matches TUI aesthetic)
- Optional light theme toggle
- Tier colors adapt for contrast

### Accessibility
- Keyboard navigation (tab order, focus states)
- ARIA labels on all interactive elements
- Screen reader announcements for status changes
- High contrast mode support

### Performance
- Virtual scrolling for table (100+ models)
- Debounced filter/sort updates
- Web Workers for ping calculations (optional)
- Memoized components to prevent re-render storms

---

## Implementation Phases (Updated for WebUI UX)

### Phase 1: Project Setup & Core Infrastructure ✅ DONE
- Next.js + TypeScript + Tailwind initialized
- shadcn/ui installed with all basic components
- Project structure created
- Types and constants defined
- Basic table rendering with static data

### Phase 2: Core Table Display ✅ DONE
- All 14 columns implemented
- Tier/provider color badges
- Sorting (click headers)
- Keyboard navigation (arrow keys)
- Favorites toggle (star icon)
- Skeleton loading states (placeholder)

### Phase 3: Ping System & Real-time Updates
**Goal**: Implement continuous monitoring with all 4 cadence modes

3.1 Create ping logic (shared from TUI `src/ping.js`) - adapt to TypeScript
3.2 Build ping loop in React context:
   - Start on mount, never stop
   - Speed mode: 2s for 60s, then switch to normal
   - Normal: 10s steady
   - Slow: 30s after 5min idle
   - Forced: 4s immediate
   - User can toggle mode anytime
3.3 Implement ping API route (`/api/ping`) - accepts modelId, provider, optional API key, returns {ms, code, quota}
3.4 Handle all 20 provider endpoints
3.5 Update table in real-time (React state updates)
3.6 Show ping progress in header (X/Y models, countdown)
3.7 Add visual spinners/indicators while pinging

### Phase 4: UI Controls & Filtering
**Goal**: Make all actions accessible via clickable UI

4.1 Replace keyboard shortcuts with UI:
   - Sort buttons in table header (keep arrows)
   - Filter bar with:
     * Tier button group (All, S+, S, A+, etc.)
     * Provider dropdown (All + names)
     * Hide unconfigured toggle switch
     * Search input (filter by model name)
   - Favorites: star icon (already there)
   - Ping mode: button group in header (Speed/Normal/Slow/Forced)
   - Tool mode: dropdown in header (OpenCode, Desktop, OpenClaw, Crush, Goose)

4.2 Implement "Launch Best" prominent button in header
4.3 Add per-row "Launch" button (optional, or double-click row)
4.4 Filter logic: tier + provider + hide unconfigured + search + favorites-pinned

### Phase 5: Settings & Config Management
**Goal**: Full settings panel with API key mgmt, profiles, proxy

5.1 Settings dialog layout (using shadcn Dialog):
   - Provider list (from `sources.js` + `PROVIDER_METADATA`)
   - Each provider row: toggle, key field (masked), add/edit/remove buttons, test button
   - Test button shows live state (Testing/OK/Fail/Rate-limited/No model)
5.2 Key storage:
   - Read/write `~/.free-coding-models.json`
   - Use same format as TUI for compatibility
   - 0600 permissions on write
   - Also check environment variables
5.3 Profile management:
   - Save/Load/Delete buttons
   - Show current profile badge
   - Shift+P to cycle (we'll keep some keyboard shortcuts as convenience)
5.4 Proxy settings section
5.5 Update check section
5.6 Save/Cancel with dirty state detection

### Phase 6: Overlays (All 7)
6.1 Help overlay - now with clickable action buttons
6.2 Install Endpoints overlay - multi-step wizard UI
6.3 Smart Recommend overlay - questionnaire form + results
6.4 Feature Request overlay - textarea + send
6.5 Bug Report overlay - textarea + send
6.6 Log Viewer overlay - table with token usage
6.7 Settings overlay (from Phase 5)

### Phase 7: Unified Launch API
**Innovation**: Single endpoint that auto-selects best model

7.1 Create `/api/launch` proxy endpoint:
   - Accepts `X-Model` or `X-Best` header
   - Looks up model provider from config
   - Picks API key (first configured for that provider, or round-robin)
   - Forwards chat completion request
   - Streams response
   - Logs token usage to `request-log.jsonl`
7.2 Create `/api/best` endpoint:
   - Returns JSON with best model id, provider, expected latency
   - Considers current filters, favorites, health
7.3 Create `/api/models` endpoint:
   - Returns full model list with current ping data
   - For building third-party integrations
7.4 Update WebUI launch buttons to use unified endpoint (or direct provider calls)
7.5 Documentation: How to use the API from external tools

### Phase 8: Tool Integration
8.1 Implement each tool launcher (same as TUI logic):
   - OpenCode CLI: `child_process.spawn` with model arg
   - OpenCode Desktop: write config + `open`/`start`/`xdg-open`
   - OpenClaw: write JSON config
   - Crush: write managed provider
   - Goose: custom provider + secrets.yaml
8.2 Detect tool installation (check paths)
8.3 Error handling (show toast if tool missing)
8.4 Global "launch with" dropdown in header

### Phase 9: Token Usage & Logging
9.1 Create `request-log.jsonl` writer
9.2 Log format: timestamp, provider, model, route (direct/switched), status, tokens, latency
9.3 Compute total tokens per provider/model
9.4 Display in table "Used" column (K/M format)
9.5 Show "Usage" column if provider exposes quota (hard, many don't)

### Phase 10: Polish & Production
10.1 Animations:
   - Row highlight transitions
   - Badge color transitions
   - Loading spinners on pings
   - Smooth modal transitions
10.2 Responsive design:
   - Mobile-friendly (cards layout)
   - Tablet breakpoints
10.3 Theme switcher (dark/light)
10.4 Error boundaries and retry logic
10.5 Toasts/notifications (sonner) for all actions
10.6 Loading skeletons during initial ping burst
10.7 Accessibility audit (WCAG 2.1 AA)
10.8 Performance: virtual table (react-window or similar)
10.9 PWA support (manifest, service worker for offline)

### Phase 11: Deployment & TUI Parity
11.1 Build for production (`npm run build`)
11.2 Deploy to Vercel (easiest)
11.3 Docker support (optional)
11.4 Document environment variables
11.5 Test all features, verify TUI config sharing
11.6 Write README for WebUI usage
11.7 Compare feature matrix with TUI, fill gaps

---

## WebUI-Specific Design Decisions

### Why No "Connectors"?
In the TUI, connectors map provider + API key to a model because the CLI needs explicit credentials. In the WebUI:
- API keys are managed centrally in Settings
- Each model knows its provider
- At runtime, we pick ANY valid API key for that provider (first one, or round-robin)
- No need for user to manually assign "which key goes with which model"
- **Result**: Much simpler UX, same capability

### Why "Launch Best"?
Users rarely care about the provider - they want the fastest model for their task. The "Best" model is determined by:
1. Is it up and healthy? (status === 'up' or pending with good avg)
2. Is it a favorite? (+10% weight)
3. Tier preference (higher tier = S+ > S > A+ > A > A- > B+ > B > C)
4. Current avg latency (lower is better)
5. Stability score (higher is better)
6. Uptime percentage (higher is better)

This ranking can be computed client-side from current ping data.

### Unified API Design
External tools (OpenCode, Aider, Claude Code) often need to call an LLM. Instead of hardcoding a specific provider/model, they can:
```bash
curl -X POST http://localhost:3000/api/completions \
  -H "Content-Type: application/json" \
  -H "X-Best: true" \
  -d '{"model":"gpt-4","messages":[{"role":"user","content":"Hello"}]}'
```
The WebUI automatically selects and proxies to the best model, handling authentication, rotation, and health checks transparently.

---

## Implementation Order Summary

| Phase | Name | Priority | Est. Time |
|-------|------|----------|-----------|
| 1 | Project Setup | ✅ Done | 1h |
| 2 | Core Table | ✅ Done | 2h |
| 3 | Ping System | In Progress | 4h |
| 4 | UI Controls | Next | 3h |
| 5 | Settings | Next | 4h |
| 6 | Overlays | Next | 3h |
| 7 | Unified Launch API | High | 3h |
| 8 | Tool Integration | Medium | 2h |
| 9 | Token Logging | Medium | 2h |
| 10 | Polish | Low | 4h |
| 11 | Deployment | Low | 2h |

**Total**: ~28h of focused development

---

## Shared Code Strategy

To avoid duplication with TUI:
- **Symbolic link** `sources.js` into WebUI `src/lib/`
- **Copy** `src/utils.js` logic into `src/lib/utils.ts` (TypeScript version)
- **Copy** `src/ping.js` into TypeScript, adapt for browser fetch
- **Share** constants and tier colors
- **Keep** config.js separate but implement same format

The WebUI will be a Next.js app that can optionally symlink to the TUI's sources, but we'll also include a copy for standalone deployment.

---

## Success Metrics

1. ✅ All 20 providers pinging correctly
2. ✅ Real-time updates with smooth animations
3. ✅ All table columns populate with correct data
4. ✅ Sorting, filtering, favorites work
5. ✅ Settings can add/edit/remove API keys
6. ✅ Config persists to `~/.free-coding-models.json`
7. ✅ Launch Best button works (proxies to best model)
8. ✅ Overlays functional (Help, Recommend, Install, Feature/Bug)
9. ✅ Token logging works
10. ✅ Build succeeds, deploys to Vercel without errors
11. ✅ TUI can read same config file
12. ✅ No features missing compared to TUI (full parity)

---

## Notes for Developer (Me)

- Start with **Phase 3** next: Implement ping loop in context
- Use `setInterval` for ping cadence, manage state with `useReducer` or context
- For API route `/api/ping`, use `fetch` with AbortController for timeout
- Store all ping results in context state (could be large, but manageable for 100 models)
- For `/api/completions` proxy, need to handle streaming responses
- Keep UI responsive during pings (don't block main thread)
- Use `useTransition` for filter/sort updates if needed
- Persist config to localStorage initially, then migrate to file API? Actually, browser can't write to home dir. The WebUI will use browser's IndexedDB/localStorage for settings, but can also read the TUI's JSON file if exposed via a server endpoint (we could create a simple file watcher that serves the config). **Simpler**: WebUI maintains its own config in IndexedDB, with option to import/export the TUI config file.
- Realistically, browser cannot write to `~/.free-coding-models.json` directly. We have two options:
  a) WebUI maintains separate config in IndexedDB/localStorage (user manages syncing)
  b) WebUI runs on localhost and has a backend API that reads/writes the file (Next.js API routes can do this!)
  - Since WebUI is Next.js running as a server, we CAN read/write files! ✅
  - So we can use same config path: `~/.free-coding-models.json`
- For token usage log: WebUI can also write `request-log.jsonl` server-side
- The unified launch API runs server-side, so it can access the file system for config and logs

**Conclusion**: The Next.js app will have both client and server components. The API routes will handle file I/O, config, and proxying. The client will display UI and call these APIs.

---

## Let's Build It!

Starting with **Phase 3: Ping System** next. I'll implement:
1. Ping logic (TypeScript version from TUI's ping.js)
2. Ping loop in context with mode switching
3. API route for pinging
4. Real-time table updates
5. Header ping status widget

All while maintaining the beautiful dark UI we've started.

---

## Phase 1: Project Setup & Core Infrastructure

**Goal**: Set up Next.js project with shadcn/ui and basic layout

### Tasks

1.1 Initialize Next.js project with TypeScript
```
npx create-next-app@latest webui --typescript --tailwind --eslint --app
cd webui
```

1.2 Install and configure shadcn/ui
```
npx shadcn-ui@latest init
```

1.3 Install required shadcn components:
- `table` - For model display
- `button` - For actions
- `input` - For API key input
- `select` / `combobox` - For dropdowns
- `dialog` - For overlays
- `sheet` - For slide-out panels
- `tabs` - For organizing sections
- `card` - For info panels
- `badge` - For tier/status badges
- `switch` - For toggles
- `scroll-area` - For scrollable areas
- `skeleton` - For loading states
- `toast` / `sonner` - For notifications
- `dropdown-menu` - For context menus
- `popover` - For tooltips
- `progress` - For progress bars
- `separator` - For dividers

1.4 Set up project structure:
```
webui/
├── app/
│   ├── page.tsx                    # Main model table page
│   ├── layout.tsx                  # Root layout with providers
│   ├── globals.css                 # Global styles + tier colors
│   └── api/
│       ├── ping/
│       │   └── route.ts            # Ping endpoint
│       ├── config/
│       │   └── route.ts            # Config read/write
│       └── telemetry/
│           └── route.ts            # Telemetry events
├── components/
│   ├── ui/                         # shadcn components
│   ├── ModelTable.tsx              # Main table component
│   ├── ModelRow.tsx                # Individual model row
│   ├── Header.tsx                  # Top header with badges
│   ├── Footer.tsx                  # Footer with hints & status
│   ├── Badges/
│   │   ├── TierBadge.tsx           # Tier color badge
│   │   ├── StatusBadge.tsx         # Health status badge
│   │   ├── VerdictBadge.tsx        # Verdict assessment badge
│   │   └── ProviderBadge.tsx       # Provider color badge
│   ├── Filters/
│   │   ├── TierFilter.tsx          # Tier filter buttons
│   │   ├── ProviderFilter.tsx      # Provider filter dropdown
│   │   └── ConfiguredToggle.tsx    # Hide unconfigured toggle
│   ├── Overlays/
│   │   ├── Settings.tsx            # Settings modal
│   │   ├── Help.tsx                # Help modal
│   │   ├── Recommend.tsx           # Smart Recommend wizard
│   │   ├── InstallEndpoints.tsx    # Install Endpoints flow
│   │   ├── FeatureRequest.tsx      # Feature request form
│   │   ├── BugReport.tsx           # Bug report form
│   │   └── LogViewer.tsx           # Token log viewer
│   └── Launch/
│       └── ToolSelector.tsx        # Tool mode selector
├── lib/
│   ├── utils.ts                    # Utility functions (shared from src/)
│   ├── ping.ts                     # Ping logic (shared from src/)
│   ├── config.ts                   # Config management
│   ├── sources.ts                  # Model sources (symlink to root)
│   └── providers.ts                # Provider-specific logic
├── hooks/
│   ├── useModels.ts                # Model data & ping state
│   ├── useConfig.ts                # Config state management
│   ├── useKeyboard.ts              # Keyboard shortcut handling
│   └── usePing.ts                  # Ping cycle management
├── context/
│   └── AppContext.tsx              # Global app state
├── types/
│   └── index.ts                    # TypeScript interfaces
└── constants/
    └── index.ts                    # TIER_ORDER, TIER_COLOR, etc.
```

1.5 Copy/share core logic files from TUI:
- `sources.js` - Model definitions (share via symlink or copy)
- `src/utils.js` - Pure logic functions
- `src/ping.js` - Ping implementation
- `src/config.js` - Config management
- `src/constants.js` - TUI constants
- `src/tier-colors.js` - Color mappings

1.6 Set up CSS variables matching TUI tier colors:
```css
:root {
  --tier-s-plus: #39ff14;
  --tier-s: #00ff00;
  --tier-a-plus: #00bfff;
  --tier-a: #00ffff;
  --tier-a-minus: #20b2aa;
  --tier-b-plus: #ffd700;
  --tier-b: #ffa500;
  --tier-c: #808080;
}
```

1.7 Create TypeScript types matching TUI data structures:
- `ModelResult` - Model row with pings, status, etc.
- `Config` - Full config shape
- `Profile` - Profile configuration
- `ProviderSettings` - Per-provider settings

**Deliverable**: Basic page rendering with static model data in a table

---

## Phase 2: Core Table & All 14 Columns

**Goal**: Display all 14 columns with proper sorting, colors, and data

### Tasks

2.1 Implement all table columns:
- Rank (#) - SWE-bench rank number
- Tier - S+, S, A+, A, A-, B+, B, C with color coding
- SWE% - Score percentage with color gradient
- CTX - Context window (128k, 200k, 256k, 1M, etc.)
- Model - Name with favorite star indicator
- Provider - Provider name with distinct color per provider
- Latest - Latest ping in ms with color (green <500ms, yellow <1500ms, red >1500ms)
- Avg - Rolling average with same color scheme
- Health - Status indicator (✅ 🔥 ⏳ ❌ 🔑)
- Verdict - Text assessment (Perfect/Normal/Spiky/Slow/Overloaded/Unstable/Not Active)
- Stability - 0-100 score with progress bar
- Up% - Uptime percentage
- Used - Token usage (K/M format)
- Usage - Quota percentage or placeholder

2.2 Implement column sorting:
- Click header to sort
- Arrow indicators for sort direction
- Support all columns: R, O, M, L, A, S, C, H, V, B, U, G keys

2.3 Implement provider colors (consistent with TUI):
- NVIDIA: #B2EBBE
- Groq: #FFCCBC
- Cerebras: #B3E5FC
- SambaNova: #FFE0B2
- OpenRouter: #E1BEE7
- HuggingFace: #FFF59D
- Replicate: #BBDEFB
- DeepInfra: #B2DFDB
- Fireworks: #FFCDD2
- Codestral: #F8BBD9
- Hyperbolic: #FFAB91
- Scaleway: #81D4FA
- GoogleAI: #BBDEFB
- SiliconFlow: #B2EBF2
- Together: #FFF59D
- Cloudflare: #FFE0B2
- Perplexity: #F48FB1
- Qwen: #FFE0B2
- ZAI: #AED5FF
- iFlow: #DCE775

2.4 Implement status indicators:
- UP (green dot + checkmark)
- Down (red dot + X)
- Pending (spinner animation)
- Timeout (yellow clock)
- No Auth (gray key)

2.5 Add keyboard navigation:
- Arrow keys to navigate
- Enter to select
- Visual cursor highlight on selected row

**Deliverable**: Full table with all 14 columns, sorting, colors, and navigation

---

## Phase 3: Ping System & Real-time Updates

**Goal**: Implement continuous ping system with live updates and all ping modes

### Tasks

3.1 Create API route `/api/ping`:
- Accept: modelId, provider, apiKey (optional)
- Return: { ms, code, quotaPercent }
- Handle all 20 providers with their specific endpoints

3.2 Implement ping logic for all providers:
- NVIDIA NIM - chat completions endpoint
- Groq - chat completions
- Cerebras - chat completions
- SambaNova - chat completions
- OpenRouter - chat completions + headers
- HuggingFace - inference endpoint
- Replicate - predictions endpoint
- DeepInfra - chat completions
- Fireworks - chat completions
- Codestral - chat completions
- Hyperbolic - chat completions
- Scaleway - chat completions
- GoogleAI - gemini endpoint
- SiliconFlow - chat completions
- Together - chat completions
- Cloudflare - workers AI endpoint
- Perplexity - chat completions
- Qwen - dashscope endpoint
- ZAI - custom endpoint
- iFlow - chat completions

3.3 Implement ping cadence modes:
- Speed: 2s intervals for 60s on startup (auto-fallback to normal)
- Normal: 10s steady state
- Slow: 30s after 5min idle
- Forced: 4s (manual override)
- Mode indicator in header

3.4 Implement rolling calculations:
- Average from ALL successful pings (200 + 401)
- P95 latency calculation
- Jitter calculation
- Stability score (composite of p95 + jitter + spike rate + uptime)
- Uptime percentage

3.5 Add real-time updates:
- Polling based on current cadence mode
- Spinner animation during pings
- Countdown to next ping cycle
- Progress indicator (X/Y models pinged)

3.6 Handle special cases:
- 401 = server UP, just needs key (include in avg)
- 429 = rate limited (Overloaded verdict)
- Timeout = 15s, mark as timeout
- No response = mark as down

**Deliverable**: Live-updating table with accurate latency data, all providers working

---

## Phase 4: Filtering & Favorites

**Goal**: Implement tier/provider filtering and favorites system

### Tasks

4.1 Implement tier filter:
- Button row with all tiers + "All"
- Active tier highlighted
- Keyboard: T cycles through tiers
- Show badge when filtering active

4.2 Implement provider filter:
- Dropdown with all providers + "All"
- Keyboard: D cycles through providers
- Show badge when filtering active

4.3 Implement "configured only" toggle:
- Toggle to show only providers with API keys
- Keyboard: E toggles this
- Show badge when active

4.4 Implement favorites:
- Star button on each row
- Click to toggle favorite
- Favorites pinned at top (always visible)
- Keyboard: F toggles favorite on selected
- Persist to config file

4.5 Combined filter logic:
- Favorites always visible regardless of filters
- Apply tier AND provider filters together
- Hide unconfigured option works with other filters

**Deliverable**: Complete filtering system matching TUI behavior

---

## Phase 5: Settings Overlay

**Goal**: Full-featured settings modal with all provider and config options

### Tasks

5.1 Provider settings list:
- All 20 providers displayed
- Enable/disable toggle per provider
- API key display (masked: •••• last4)
- Add key button (+)
- Remove key button (-)
- Test key button (T)
- Test result badge (Testing.../OK/Fail/Rate limit/No model)

5.2 Setup instructions per provider:
- Show signup URL
- Show setup hint
- Show rate limit info

5.3 Proxy settings section:
- Enable/disable proxy mode toggle
- Persist proxy in OpenCode toggle
- Preferred port input (0 = auto)
- Clean proxy config button

5.4 Maintenance section:
- Check for updates button
- Update status display
- Install update button when available

5.5 Profile management:
- List saved profiles with active indicator
- Load profile (Enter)
- Delete profile (Backspace)
- Profile settings shown (tier filter, sort, etc.)

5.6 Save/Cancel:
- Auto-save on changes
- Show sync status messages

**Deliverable**: Complete settings panel matching TUI

---

## Phase 6: All Overlays & Modals

**Goal**: Implement all 7 overlay types from TUI

### Tasks

6.1 Help Overlay (`K` key):
- Full keyboard shortcuts list
- Column explanations with sort key
- CLI flags documentation
- Scrollable if long

6.2 Install Endpoints Overlay (`Y` key):
- Step 1: Provider selection (list configured providers only)
- Step 2: Tool selection (OpenCode CLI, OpenCode Desktop, OpenClaw, Crush, Goose)
- Step 3: Scope selection (all models OR selected)
- Step 4: Model selection (checkboxes, select all/none)
- Result: Success/failure display
- Write to tool config files

6.3 Smart Recommend Overlay (`Q` key):
- Question 1: Task type (Quick Fix / Bug Fix / Feature / Refactor / Review / Document / Explore)
- Question 2: Priority (Speed / Quality / Balanced)
- Question 3: Context budget (Small <32k / Medium 32-128k / Large 128-256k / Massive 256k+)
- Analyzing: Progress bar, 10s analysis, 2 pings/sec
- Results: Top 3 recommendations with scores, highlight in main table

6.4 Feature Request Overlay (`J` key):
- Text input (500 char limit)
- Character counter
- Send button → Discord webhook
- Status: sending/success/error

6.5 Bug Report Overlay (`I` key):
- Text input (500 char limit)
- Character counter
- Send button → Discord webhook
- Status: sending/success/error

6.6 Log Viewer (`X` key):
- Load from request-log.jsonl
- Columns: Time, Provider, Model, Route, Status, Tokens, Latency
- Total tokens consumed display
- Show "direct" or "SWITCHED" for route

**Deliverable**: All 7 overlays working exactly like TUI

---

## Phase 7: Tool Integration & Launch

**Goal**: Allow launching models in external tools

### Tasks

7.1 Tool mode selector:
- Cycle through: OpenCode → OpenCode Desktop → OpenClaw → Crush → Goose
- Keyboard: Z key
- Badge in header shows current mode

7.2 OpenCode CLI launch:
- Detect OpenCode installation
- Write config to ~/.config/opencode/opencode.json
- Set selected model as default
- Spawn OpenCode process with model

7.3 OpenCode Desktop launch:
- Write to shared opencode.json
- Open Desktop app (macOS: open, Windows: start, Linux: xdg-open)

7.4 OpenClaw integration:
- Write to ~/.openclaw/openclaw.json
- Set selected model as default

7.5 Crush integration:
- Write managed provider to ~/.config/crush/crush.json

7.6 Goose integration:
- Write custom provider JSON
- Write secrets to ~/.config/goose/secrets.yaml

7.7 Error handling:
- Detect if tool is installed
- Show error if tool not found
- Graceful failures

**Deliverable**: Launch selected model in any supported tool

---

## Phase 8: Header, Footer & Status

**Goal**: Complete header badges and footer information

### Tasks

8.1 Header badges:
- Tool mode badge with Z hint
- Tier filter badge when active
- Provider filter badge when active
- Configured only badge when active
- Profile badge when profile loaded

8.2 Ping status line:
- Current interval (e.g., "10s")
- Mode label (speed/normal/slow/forced)
- Progress (e.g., "45/120")
- Countdown to next ping

8.3 Version status:
- Check for updates
- Show "Update available" when new version

8.4 Footer hints:
- Navigate: ↑↓
- Launch: Enter
- Controls: W, E, X, Z, F, Y, Q, J, I, P
- Profiles: Shift+P, Shift+S
- Help: K
- Exit: Ctrl+C

8.5 Terminal resize:
- Detect window resize
- Adjust viewport
- Recalculate visible rows
- Show narrow terminal warning if < 166 chars

**Deliverable**: Complete header/footer matching TUI

---

## Phase 9: Configuration & Persistence

**Goal**: Full config system with profiles and sharing with TUI

### Tasks

9.1 Config file:
- Read/write ~/.free-coding-models.json
- Use same format as TUI
- 0600 permissions (secure)

9.2 API key storage:
- Per-provider keys
- Multi-key support per provider
- Masked display in UI

9.3 Environment variable support:
- NVIDIA_API_KEY, GROQ_API_KEY, etc.
- Env vars override config file

9.4 Profiles:
- Save current config as named profile
- Load profile (replaces current config)
- Delete profile
- Profile includes: apiKeys, providers, favorites, settings

9.5 Favorites:
- Toggle favorite per model
- Persist to config
- Sync with TUI (same file)

9.6 Settings persistence:
- Tier filter preference
- Sort column/direction
- Ping interval preference
- Hide unconfigured preference
- Preferred tool mode

**Deliverable**: Complete config system, shares with TUI

---

## Phase 10: Polish & UX

**Goal**: Make UI feel polished, professional, and production-ready

### Tasks

10.1 Animations:
- Row highlight transitions
- Loading spinners
- Smooth filter changes
- Toast notifications

10.2 Dark/light themes:
- Use shadcn default
- Match TUI tier colors
- Consistent with brand

10.3 Responsive design:
- Mobile: horizontal scroll table
- Tablet: optimized layout
- Desktop: full experience

10.4 Accessibility:
- Keyboard navigation
- Focus indicators
- ARIA labels
- Screen reader support

10.5 Performance:
- Virtual scrolling for 100+ models
- Debounced updates
- Efficient re-renders

10.6 Error handling:
- Toast notifications for errors
- Graceful degradation
- Retry mechanisms

**Deliverable**: Production-ready polished UI

---

## Phase 11: Deployment

**Goal**: Deploy and verify

### Tasks

11.1 Build optimization:
- TypeScript strict mode
- Bundle analysis
- Remove unused code

11.2 Deployment config:
- Vercel config (vercel.json)
- Environment variables setup
- Build command

11.3 Testing:
- Test all features against TUI
- Verify config sharing
- Verify all providers work

11.4 Documentation:
- Deployment instructions
- Environment setup
- Troubleshooting guide

**Deliverable**: Production deployment ready

---

## Implementation Order Summary

| Phase | Name | Priority | Key Deliverable |
|-------|------|----------|-----------------|
| 1 | Project Setup | High | Next.js + shadcn + structure |
| 2 | Core Table | High | All 14 columns with sorting |
| 3 | Ping System | High | Live ping with all modes |
| 4 | Filtering | High | Tier/provider/favorites filters |
| 5 | Settings | High | Full settings panel |
| 6 | Overlays | High | All 7 overlay types |
| 7 | Tool Integration | Medium | Launch in external tools |
| 8 | Header/Footer | Medium | Complete status display |
| 9 | Config & Profiles | Medium | Full persistence |
| 10 | Polish | Low | Animations, responsive |
| 11 | Deployment | Low | Production ready |

---

## Shared Code from TUI

The following files should be shared (symlink or copy) between TUI and WebUI:

1. `sources.js` - Model definitions
2. `src/utils.js` - Pure logic (getAvg, getVerdict, getUptime, sortResults, filterByTier, findBestModel, scoreModelForTask, etc.)
3. `src/ping.js` - Ping implementation
4. `src/config.js` - Config management
5. `src/constants.js` - Constants
6. `src/tier-colors.js` - Color mappings
7. `src/model-merger.js` - Model merging
8. `src/provider-metadata.js` - Provider info
9. `src/tool-metadata.js` - Tool info
10. `src/endpoint-installer.js` - Install endpoints logic

---

## Notes

- **MUST maintain feature parity** - Every feature in TUI must exist in WebUI
- **Config sharing** - Use same ~/.free-coding-models.json as TUI
- **Provider support** - All 20 providers must work identically
- **Keyboard shortcuts** - Implement ALL shortcuts from TUI
- **Ping modes** - All 4 cadence modes must work
- **Overlays** - All 7 overlays must be functional
- **Profiles** - Must work exactly like TUI profiles