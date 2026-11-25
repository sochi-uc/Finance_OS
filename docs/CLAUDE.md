# Agent manual: driving Finance OS from Claude or scripts

## Golden rules

1. The database is the single source of truth. Change state only through the API.
2. Authenticate with your **own API key**: in the app, go to Settings → API keys. Every ledger line and activity row records the key's name (for example `key:claude`), so there's a real audit trail. There is no `x-actor` header any more.
3. Prefer a **read-only** key for analysis. Use a read & write key only for an agent that records trades or prices.
4. Rules are enforced server-side: insufficient cash, overselling, bad tickers and unknown fields all return **400** with a field-level message. Never retry blindly; read the message.
5. A **409** means the portfolio changed underneath you. Re-read `GET /api/portfolio` and decide again.
6. Give probabilistic scenarios and risk, not certainty. The owner keeps execution authority.

## Calling the API

```bash
export FOS=http://localhost:8787
export KEY=fos_…            # from Settings → API keys (shown once)
curl -s -H "Authorization: Bearer $KEY" $FOS/api/portfolio | jq .valuation
```

API-key requests need no CSRF header and no cookie.

| Action | Request |
|---|---|
| Read everything | `GET /api/portfolio` |
| Record a trade | `POST /api/trades {"side":"buy","ticker":"UCAP","market":"NGX","units":100,"price":17.5,"settleFromCash":true,"note":"thesis"}` |
| Edit a position directly | `PUT /api/holdings/ARADEL {"market":"NGX","units":50,"avgCost":1148.3,"price":1377,"strategy":"…"}` |
| Remove a position | `DELETE /api/holdings/ARADEL` |
| Mark to market | `POST /api/prices {"prices":{"UCAP":18.2,"ARADEL":1600}}` |
| FX rate | `POST /api/fx {"rate":1523,"source":"parallel"}` |
| Buy dollars | `POST /api/usd/fund {"usd":50,"rate":1520,"feeNgn":500}`. Add `"historical":true` to log past funding without moving balances. |
| Dollars → Naira | `POST /api/usd/convert {"usd":20,"rate":1510}` |
| Reconcile balances | `PUT /api/balances {"ngnCash":640000,"usdCash":120,"liabilities":0}` |
| US fee | `PUT /api/settings {"usdFeeRate":0.015}` |
| Budget | `POST /api/budget {"category":"invest","item":"NGX equities","amount":50000}` · `PUT/DELETE /api/budget/{id}` |
| Research card | `PUT /api/watchlist/UCAP {"price":17.05,"support":15.8,"resistance":18.5,"stance":"…","thesis":"…","plan":"…","series":[15.2,16.4,17.05]}` |
| Journal note | `POST /api/notes {"text":"…"}` |

Markets: `NGX` (₦) or `US` ($). Budget categories: `income`, `fixed`, `variable`, `savings`, `invest`.

Every write returns the full, fresh dashboard.

## Money semantics

- US trades always settle against the USD wallet, with the fee (`settings.usdFeeRate`) charged on both buys and sells.
- NGX trades settle against Naira cash when `settleFromCash` is true (the default).
- Net worth = Naira cash + USD wallet × FX + holdings value (USD holdings × FX) − liabilities.
- Average USD cost = total Naira spent ÷ total dollars funded.
