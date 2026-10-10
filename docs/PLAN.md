# Plan
## Phase 1 — Core (this build) ✅
Live dashboard, editable holdings/cashflow, trade recording with avg-cost math, insights feed, auto LOGS.md/STATE.md, Docker deploy.
## Phase 2 — Robust UI
- Vite + React + TypeScript + Tailwind + Framer Motion + Recharts/visx; PWA (installable on iPhone)
- Sector/asset donuts, P/L waterfall, dividend calendar, scenario simulator (what-if sells/buys), goal tracker
- Command palette (⌘K), toasts, dark/light polish, skeleton loaders
## Phase 3 — Intelligence
- MCP server wrapping the API so Claude can act directly from chat
- Nightly NGX price fetch job; price alerts (Telegram/WhatsApp)
- PDF ingestion: pull key ratios from `Stock/Reports/` into per-ticker research cards
## Phase 4 — Hardening
Login (passkeys), audit-log immutability, encrypted nightly backups, Zod validation, tests.
## Open questions
Real unit counts (ARADEL?), USD/NGN rate source, where price data comes from.

## Phase 1.5 ✅ Old-money UI, PWA (iPhone/iPad/Mac/Windows), USD wallet, FX history + cost basis
