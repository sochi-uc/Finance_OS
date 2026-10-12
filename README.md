# Finance OS

A high-performance, mobile-first, zero-dependency personal wealth management and operational dashboard. Designed with extreme adherence to Apple Human Interface Guidelines (HIG), Finance OS serves as the single source of truth for tracking public equities (NGX), private venture capital, and global currency assets.

## Core Features

- **Holistic Wealth Tracking:** Real-time visibility into NGX Stocks, Private Equity (VC/Ajo), and USD holdings.
- **AI Foresight Engine:** Embedded strategic insights and actionable investment roadmaps mapped directly to financial data.
- **Journal & Ledger:** Real-time note-taking and trade rationalization synced instantly to the backend.
- **Zero-Friction UI:** 
  - Absolute zero frontend dependencies (no React, no Vue, no bloated libraries).
  - Pure Vanilla JS, semantic HTML, and custom CSS variables.
  - 100% SVG-based iconography.
  - Native iOS momentum scrolling, perfect safe-area insets, and HIG-compliant touch targets.
- **PWA Ready:** Installable as a Progressive Web App for a native app experience on iOS and Android.

## Architecture

- **Frontend:** Zero-build modular architecture (`web/css/style.css` and ES-modularized `web/js/`: `config.js`, `data.js`, `explainers.js`, `charts.js`, `views.js`, `app.js`) loaded via lightweight semantic shell (`web/index.html`). Instant load times, offline PWA caching via Service Worker.
- **Backend:** Node.js 22 + Fastify REST API with Server-Sent Events (SSE) for real-time live synchronization.
- **Database:** SQLite with WAL mode (`better-sqlite3`, local, private, air-gapped from cloud providers).
- **Deployment:** Fully Dockerized for isolated, reproducible execution.

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js (for local development)

### Deployment
1. Clone the repository.
2. Copy `.env.example` to `.env` and set your secure `API_TOKEN`.
3. Spin up the container:
   ```bash
   docker-compose up -d
   ```
4. Access the web interface at `http://localhost:8787`.

### API Integration
Finance OS exposes a secured REST API for programmatic updates (e.g., cron jobs, AI agents):
- `POST /api/prices` - Bulk update asset pricing.
- `POST /api/holdings` - Update equity units and average costs.
- `POST /api/cashflow` - Update liquidity positions.
- `POST /api/insights` - Push new AI foresights or journal entries.

*Requires `Authorization: Bearer <API_TOKEN>` header.*

## Design Philosophy

This project rejects the modern web bloat. By utilizing native browser APIs, CSS grid/flexbox, and vanilla JavaScript, it achieves unparalleled performance and battery efficiency while maintaining a premium, native-feeling user experience.

---
*Built for precision, scale, and clarity.*
