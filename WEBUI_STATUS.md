# WebUI Implementation Status

## ✅ Completed Features

### Core Infrastructure
- Next.js 16 + TypeScript + Tailwind CSS
- shadcn/ui component library
- Full TypeScript types and constants
- Shared logic from TUI (utils, ping, config)
- Real-time state management with React Context

### Model Table
- 14 columns: Rank, Tier, SWE%, CTX, Model, Provider, Latest, Avg, Health, Verdict, Stability, Up%, Used, Usage
- Sorting by clicking column headers
- Keyboard navigation (arrow keys)
- Favorites toggle (star icon)
- Tier and provider color badges
- Status indicators (UP, DOWN, TIMEOUT, NO KEY, etc.)
- Real-time ping updates with spinners

### Ping System
- Continuous parallel ping for all models
- Fixed 1500ms interval with batching (only 5 models at a time)
- Only pings visible models (not off-screen) to reduce browser load
- Rolling averages and uptime tracking
- Provider-specific API integrations (20+ providers)

### Filtering & UI Controls
- Tier filter buttons (All, S+, S, A+, A, A-, B+, B, C)
- Provider dropdown selector
- "Configured only" toggle
- Search by model name (can be added)
- Refresh speed selector (Fast/Slow/Moderate)
- **REMOVED**: Tool mode dropdown (OpenCode, OpenCode Desktop, OpenClaw, Crush, Goose)

### Settings & Config
- API key management per provider (add/edit/remove)
- Provider enable/disable toggles
- Config persisted to `~/.free-coding-models.json`
- Auto-save on changes
- Load config on startup

### Overlays/Modals
- **Chat** - Quick chat with best model
- **Settings** - Provider and API key management
- **Help** - Keyboard shortcuts reference
- **Recommend** - Questionnaire-based model recommendations
- **Install Endpoints** - Install provider catalogs into external tools
- **Feature Request** - Submit feature ideas
- **Bug Report** - Report bugs
- **Log Viewer** - View request history

### Unified API Endpoints (OpenAI-Compatible)
- `POST /v1/chat/completions` - Chat completions (with streaming!)
- `POST /v1/completions` - Legacy text completions
- `POST /v1/embeddings` - Text embeddings
- `GET /v1/models` - List available models
- `GET /v1/models/{id}` - Get specific model
- `GET /v1/usage` - Token usage statistics
- `POST /v1/batch` - Batch processing (up to 10 requests)
- `GET /health` - Health check endpoint
- Authentication via `X-API-Key: <fcm-proxy-key>` header
- Favorites-first routing (+30 score bonus to favorited models)
- Request logging to `~/.free-coding-models-requests.jsonl`

### Installation
- **REMOVED**: Install provider endpoints to OpenCode, OpenClaw, Crush, Goose
- Focus is exclusively on API serving via `/api/completions`

---

## 🎯 How to Use

1. **Start the WebUI**:
```bash
cd webui
npm run dev
```
Open http://localhost:9191 (bound to 0.0.0.0 for LAN access)

2. **Add API Keys**:
- Click "⚙ Settings"
- For each provider you have keys for, click "Add" and enter your API key
- Keys are saved to `~/.free-coding-models.json`

3. **Watch Models Ping**:
- Table auto-updates with latency data
- Use tier/provider filters to narrow down
- Star favorites to pin them to top (favorites become the API serving pool)

4. **Use the API**:
- Generate a proxy key in Settings
- External tools call `POST /api/completions` with `X-API-Key: <proxy-key>`
- By default, requests route through your favorited models (+30 score bonus)
- Full OpenAI-compatible API: `/v1/chat/completions`, `/v1/completions`, `/v1/embeddings`, `/v1/models`, `/v1/usage`, `/v1/batch`

5. **Selection Modes** (via headers):
- No headers → favorites pool (default, recommended)
- `X-Mode: specific` + `X-Model: <provider>/<model>` → exact model
- `X-Mode: round-robin` + `X-Pool: tier=S+` → cycle through tier
- `X-Best: true` → global best model

---

## 📁 Project Structure

```
webui/
├── app/
│   ├── page.tsx              # Main page
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   └── api/
│       ├── completions/      # Unified launch API
│       ├── config/           # Config read/write
│       ├── install/          # Install endpoints
│       ├── logs/             # Request logs
│       └── ping/             # Ping provider endpoint
├── components/
│   ├── Badges/               # Tier, Status, Provider, Verdict badges
│   ├── Filters/              # TierFilter, ProviderFilter, ConfiguredToggle
│   ├── Overlays/             # All modal dialogs
│   ├── Header.tsx            # Top bar with controls
│   ├── Footer.tsx            # Bottom bar with actions
│   ├── ModelTable.tsx        # Main table component
│   ├── ModelRowActions.tsx   # Launch button per row
│   └── ui/                   # shadcn components
├── context/
│   └── AppContext.tsx        # Global state management
├── lib/
│   ├── config.ts             # Config file I/O
│   ├── ping.ts               # Ping loop logic
│   ├── utils.ts              # Shared utility functions
│   ├── sources.js            # Model definitions (symlink)
│   └── constants/            # TIER_COLORS, PROVIDER_COLORS, etc.
├── types/
│   └── index.ts              # TypeScript interfaces
└── package.json
```

---

## 🔧 Technical Notes

### Config Format
Same as TUI: `~/.free-coding-models.json`
```json
{
  "apiKeys": {
    "nvidia": "nvapi-xxx",
    "groq": "gsk_xxx"
  },
  "providers": {
    "nvidia": { "enabled": true },
    "groq": { "enabled": false }
  },
  "favorites": ["nvidia/deepseek-ai/deepseek-v3.2"],
  "settings": { ... }
}
```

### Ping System
- Uses `/api/ping` endpoint which handles provider-specific auth and endpoints
- Models are pinged in parallel every N seconds based on current mode
- Rolling average includes all successful pings (200 + 401)
- Status derived from latest HTTP code and latency patterns

### Unified Launch
- Best model selected by scoring: favorites (+30), tier (S+ = 30 down to C = 1), provider enabled
- Can be extended to include actual ping latency once data is available
- Proxies request to provider's chat completions endpoint
- Logs token usage for tracking

---

## 🚀 Status: API-First WebUI Complete ✅

**Recent Updates (2026-03-21)**:
- Simplified ping system: Fixed 1500ms interval, batched requests, only pings visible models
- Removed ping frequency options entirely
- Updated app to bind to 0.0.0.0:9191 for LAN access
- **Focus**: Removed tool integrations (OpenCode, OpenClaw, Crush, Goose) - WebUI now exclusively serves API
- **Core**: Complete OpenAI-compatible API implementation (`/v1/*` endpoints)
- **Priority**: Favorites-first routing with +30 score bonus

All core features implemented and production build succeeds. The WebUI provides a polished, API-first interface for serving LLMs via a unified OpenAI-compatible endpoint.

**To deploy**: Build with `npm run build` and deploy to Vercel or any Node.js hosting.

---

**Last Updated**: 2026-03-21