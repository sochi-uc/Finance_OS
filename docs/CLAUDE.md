# CLAUDE.md — Operating Manual for Finance OS Copilot & AI Agents

**Domain:** Institutional Wealth Terminal · Dual-Currency Portfolio (NGX Equities, Global ETFs, Cash Reserves).  
**Primary Reference:** Fastify REST API, SQLite WAL persistence, live SSE stream.

## Golden Rules
1. The **SQLite DB is the single source of truth**. Never manually edit runtime files (`docs/STATE.md` or `docs/LOGS.md`); they are synchronized automatically by the backend.
2. Mutate state exclusively via the REST API with the header `x-actor: claude` or `x-actor: agent` for clear audit trails.
3. Rigorous validation: confirm trade thesis and cost-basis math before recording transactions.
4. Objective decision support: provide probabilistic scenarios, risk matrices, and valuation metrics. The principal retains ultimate execution authority.
5. Never silently mask data discrepancies; log them as analytical insights.

## API Architecture (Base: `http://localhost:8787`, Header: `Authorization: Bearer $API_TOKEN` on mutations)
| Action | Endpoint / Payload |
|---|---|
| Read Full Snapshot | `GET /api/state` |
| Bulk Price Update | `POST /api/prices {"UCAP": 18.2, "ARADEL": 1600}` |
| Record Trade | `POST /api/trades {"action": "BUY", "ticker": "UCAP", "units": 100, "price": 17.5, "note": "thesis"}` |
| Update Holding | `POST /api/holdings {"ticker": "ARADEL", "units": 50}` |
| Adjust Cashflow | `POST /api/cashflow {"id": 3, "amount": 900}` or `{category, item, amount}` |
| System Settings | `POST /api/settings {"fx": 1520, "cash": 20000}` |
| Publish Insight | `POST /api/insights {"text": "..."}` |

## Multi-Currency Execution Engine
| Action | Endpoint / Payload |
|---|---|
| Update FX Rate | `POST /api/fx {"rate": 1523, "source": "market benchmark"}` |
| Fund Foreign Wallet | `POST /api/usd/fund {"usd": 50, "rate": 1520, "fee_ngn": 500}` |
| Historical FX Log | `POST /api/usd/fund {"usd": 10, "rate": 1500, "history": true}` |
| Repatriate Funds | `POST /api/usd/withdraw {"usd": 20, "rate": 1510}` |
| Global Asset Trade | `POST /api/trades {"action": "BUY", "ticker": "VOO", "units": 0.05, "price": 505, "ccy": "USD"}` |

Average FX cost is tracked via `ngn_spent / usd_funded`. Portfolio display base currency is NGN, with real-time conversion at `settings.fx`.

## System Documentation & Design Standards
- **Apple Design Standard:** Follow `docs/APPLE_DESIGN_STANDARD.md` (Skill 1: Visual Token Engine; Skill 2: Fluid Motion & Spring Physics).
- **Autonomous Interface Engineering:** Follow `docs/AUTONOMOUS_WEB_DESIGN.md` (micro-typography, optical tracking, 4px/8px rhythm, tabular numbers).
- **Investment Playbook:** Follow `docs/INVESTMENT_PLAYBOOK.md` for fixed-income arbitrage, quantitative breakout metrics, and corporate risk scoring.
