# Architecture

```
Browser (liquid-glass UI)  ⇄  Fastify API  ⇄  SQLite (WAL)
        ▲  SSE push              │  └─ on every write: append docs/LOGS.md, regenerate docs/STATE.md
        └────────────────────────┘
Claude (curl / MCP / Claude Code on server) → same API, header x-actor: claude
```
- **Live sync:** every mutation broadcasts over Server-Sent Events; open dashboards refresh instantly (no file locks like Excel).
- **Auth:** bearer token on all writes (`API_TOKEN`). Reads open, so put it behind Tailscale/Cloudflare Access. Never expose raw to the internet.
- **Persistence:** `data/finance.db`. Back up nightly (`sqlite3 finance.db ".backup ..."`).
- **Currency:** holdings carry `ccy`; USD assets convert with `settings.fx`.
- **Deploy:** `docker compose up -d --build`; `restart: always` keeps it running.

## Layout
```
server/index.js   API + SSE + doc generation
web/index.html    Zero-build UI (glass, SVG charts, count-up, live)
docs/             CLAUDE.md PLAN.md ARCHITECTURE.md LOGS.md STATE.md archive/
data/             SQLite (git-ignored)
```
## Why this stack
Node 22 + Fastify (fast, tiny), better-sqlite3 (synchronous, zero-ops), SSE (simpler than WebSockets for one-way push). Upgrade path in PLAN.md Phase 2.
