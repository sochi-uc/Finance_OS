<div align="center">

<img src="web/public/icon-192.png" width="72" alt="" />

# Finance OS

**Your wealth, in one private place.**
Net worth · Naira & dollar portfolios · cash flow · research · a journal for every decision.

ASP.NET Core 10 · React 19 + TypeScript · SQLite · Liquid Glass UI

</div>

---

## What it does

- **Overview:** a net-worth hero with a scrubbable monthly chart, KPIs, allocation donut, top positions and live activity.
- **Investments:** NGX and US holdings with exact cost basis, P&L, weights, and buy/sell that settles against cash.
- **Cash:** Naira cash and a dollar wallet. Fund and convert at your rate, with FX history and average dollar cost tracked automatically.
- **Budget:** a monthly plan by category, savings rate and over-allocation warnings.
- **Research:** watchlist cards with price history, support-to-resistance range, thesis and plan.
- **Journal:** notes, the full transaction ledger, and an activity feed showing who did what, including AI agents.
- **Live sync:** every open tab and device updates within a second (Server-Sent Events).
- **Privacy mode** (`H`) blurs amounts in public. Press **⌘K** for any page or action.
- **Agents and scripts:** per-agent API keys, optionally read-only. See [docs/CLAUDE.md](docs/CLAUDE.md).
- Installable as a PWA, with a mobile tab bar and bottom-sheet dialogs on phones.

## Run it

Requires the .NET 10 SDK and Node 20.19+.

```powershell
npm --prefix web install
```
```powershell
npm --prefix web run build
```
```powershell
dotnet run --project server/src/FinanceOs.Api --launch-profile http
```

Open **http://localhost:8787**, create an account, then set your balances or load the sample portfolio.

- **UI development:** `npm --prefix web run dev` (http://localhost:5174, proxies `/api`).
- **Tests:** `dotnet test server` (36 tests).
- **Docker:** `docker compose up -d --build` (chiseled non-root image, read-only filesystem; data in the `finance-data` volume).

### Moving from v1

Open the old app's `http://<host>:8787/api/state`, save the JSON, then go to **Settings → Import from Finance OS v1** in a fresh account. Balances, positions, budget, journal, FX history, trades and monthly snapshots all come across, each re-validated.

## Documentation

| | |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | Layers, command pipeline, data model, live sync, why .NET |
| [Security](docs/SECURITY.md) | v1 findings fixed, OWASP mapping with tests, production checklist |
| [Agent manual](docs/CLAUDE.md) | API keys and every endpoint, with examples |
| [Investment playbook](docs/INVESTMENT_PLAYBOOK.md) | Strategy notes |
| [Design standard](docs/APPLE_DESIGN_STANDARD.md) | Visual and motion principles |
