# CLAUDE.md — Operating manual for Claude on Sochi Finance OS

**Owner:** Sochima (Sochi). NGX + US (Bamboo) investor, NGN base currency.
**Read first, every session:** `docs/STATE.md` (live snapshot) → `docs/LOGS.md` (what changed) → `docs/PLAN.md` (roadmap).

## Golden rules
1. The **SQLite DB is the source of truth**. Never edit `STATE.md` or `LOGS.md` by hand; they are generated on every write.
2. Change data only through the API with header `x-actor: claude`, so the log shows who did what.
3. Brainstorm first, write second. Confirm before recording a trade. Trades change avg cost and history.
4. Not a financial advisor: give facts, scenarios, risks. Sochi decides.
5. Flag data inconsistencies (post as an insight) instead of silently "fixing" numbers.

## API (base `http://SERVER:8787`, header `Authorization: Bearer $API_TOKEN` on writes)
| Action | Call |
|---|---|
| Read everything | `GET /api/state` |
| Update prices | `POST /api/prices {"UCAP":18.2,"ARADEL":1600}` |
| Record trade | `POST /api/trades {"action":"BUY","ticker":"UCAP","units":100,"price":17.5,"note":"why"}` |
| Edit holding | `POST /api/holdings {"ticker":"ARADEL","units":50}` |
| Cashflow line | `POST /api/cashflow {"id":3,"amount":900}` or new `{category,item,amount}` |
| Settings | `POST /api/settings {"fx":1520,"cash":20000}` |
| AI insight card | `POST /api/insights {"text":"..."}` |

## Context
Research PDFs live in `Stock/Reports/<TICKER>/<year>/...` (UCAP, Stanbic, Zenith, Presco, Aradel). Cite the source file when giving a thesis.
Current thesis: UCAP = "picks & shovels" on bank recapitalisation + Dangote IPO fees; ARADEL = FX/inflation hedge; VOO = core US DCA (Bamboo charges 1.5%, so buy rarely).

## Dollar portfolio & FX (added)
| Action | Call |
|---|---|
| Update exchange rate (do this regularly; search the current NGN/USD rate, then post with `source`) | `POST /api/fx {"rate":1523,"source":"claude web search"}` |
| Fund USD wallet from ₦ cash | `POST /api/usd/fund {"usd":50,"rate":1520,"fee_ngn":500}` |
| Log a past funding (no balances change) | `POST /api/usd/fund {"usd":9.8,"rate":1500,"history":true}` |
| Convert USD back to ₦ | `POST /api/usd/withdraw {"usd":20,"rate":1510}` |
| Buy/sell US asset | `POST /api/trades {"action":"BUY","ticker":"VOO","units":0.05,"price":505,"ccy":"USD"}` (debits wallet + 1.5% Bamboo fee) |
Avg FX cost = `ngn_spent / usd_funded`. Display currency is always ₦; USD assets are converted at `settings.fx`.

## Standard Playbooks & Frontend Heuristics (October 2026)
- **Autonomous Web Design (Nate Herk standard):** Read `docs/AUTONOMOUS_WEB_DESIGN.md`. Adhere to Emil Kowalski micro-typography, generous spatial rhythm, Apple/Linear physics-based easing, and Figma/Playwright MCP verification.
- **Investment Playbook:** Read `docs/INVESTMENT_PLAYBOOK.md` for full execution protocols on:
  - NIDF Public Offer Arbitrage (Kolade Alabi)
  - Stock Numbers Decoder (Dahlia)
  - Income Scaling vs Frugality (Isobel Lorna)
  - 3-Pillar Corporate Risk Screener (Ruby Ihekweme)
  - 9 NGX 100%+ Multi-Baggers & Technical Breakout Protocols (Engr. Achie)
