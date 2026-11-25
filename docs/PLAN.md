# Roadmap

## v2 — Platform rebuild ✅
- .NET 10 Clean Architecture API with exact `decimal` money, atomic commands and optimistic concurrency.
- Identity sessions, per-agent hashed API keys (read-only scope) and full OWASP hardening (see SECURITY.md).
- React 19 + TypeScript Liquid Glass UI: overview, investments, cash, budget, research, journal, settings.
- Live sync over Server-Sent Events, ⌘K command palette, privacy mode, v1 data import.

## Next
- **Market data:** scheduled NGX and US price ingestion (`IPriceFeed` + background service).
- **Dividends:** corporate-action calendar and automatic dividend ledger entries.
- **Passkeys:** WebAuthn sign-in (Identity tables already in place).
- **Encrypted off-site backups** of `App_Data`.
- **Rebalancing simulator:** target weights vs actual, with suggested trades.
