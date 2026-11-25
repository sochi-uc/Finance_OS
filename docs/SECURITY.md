# Security

Every control below maps to the OWASP Top 10 (2021) and the OWASP API Security Top 10. Tests live in `server/tests/FinanceOs.Tests/ApiTests.cs` and `DomainTests.cs`.

## v1 findings this release fixes

| # | v1 issue | Risk | v2 |
|---|---|---|---|
| 1 | `GET /api/state` and the SSE stream were unauthenticated | Anyone on the network could read your full net worth, positions and journal | Deny-by-default; owner-scoped reads |
| 2 | Writes were open whenever `API_TOKEN` was unset | Unauthenticated trading | Writes always need a session or a key |
| 3 | A single shared bearer token, compared with `!==` (not constant-time), stored in `localStorage` | Token theft via XSS; timing leaks; no revocation | Hashed per-agent keys with constant-time compare; browser uses an HttpOnly cookie, never a JS-readable token |
| 4 | `x-actor` header set by the caller | Forged audit trail | Actor derived from the authenticated identity |
| 5 | `POST /api/settings` accepted any key/value | Mass assignment of arbitrary settings | Typed requests; unknown fields → 400 |
| 6 | Floats and no transactions | Rounding drift; half-applied trades | `decimal`; one atomic commit per command; optimistic concurrency |
| 7 | UI built with `innerHTML` string templates | XSS if any field held markup | React escaping + strict CSP (`script-src 'self'`) |
| 8 | Container ran as root with source mounted read-write | Container escape blast radius | Chiseled non-root image, read-only root FS, `cap_drop: ALL` |

## Controls

| OWASP | Control | Test |
|---|---|---|
| A01 Access control | Fallback policy requires auth; owner id only from the principal; every query keyed by owner | `Anonymous_reads_are_rejected`, `Each_user_sees_only_their_own_portfolio` |
| A01 CSRF | SameSite=Strict cookie + required `X-Finance-Client` header + Origin check for cookie writes; key requests exempt (no ambient credentials) | `Csrf_header_is_required_for_cookie_writes`, `Cross_origin_cookie_write_is_rejected` |
| A01 Least privilege | Read-only keys can't write; keys can never create, list or revoke keys | `Read_only_key_can_read_but_not_write`, `Keys_cannot_create_or_list_keys` |
| A02 Crypto | PBKDF2 passwords; SHA-256 key hashes; secret shown once; Data Protection keys DPAPI-encrypted at rest; HSTS; `__Host-` cookie in production | `Key_secret_is_returned_once_and_never_listed` |
| A03 Injection / XSS | EF Core parameters; allow-listed enums; ticker regex; React escaping; CSP without inline script or style | `Invalid_trades_return_field_errors`, `Invalid_tickers_are_rejected` |
| API6 Mass assignment | `UnmappedMemberHandling.Disallow` | `Unknown_json_fields_are_rejected` |
| A04 Insecure design | Bounded inputs (`Rules.cs`); 2 MB body cap; JSON depth 32; rate limits (auth 10/min/IP, global token bucket); SSE stream cap | domain tests |
| A05 Misconfiguration | CSP, nosniff, DENY framing, no-referrer, Permissions-Policy, COOP/CORP, no `Server` header, ProblemDetails without stacks, `no-store` on API | `Security_headers_are_set_and_server_is_hidden`, `Api_responses_are_never_cached`, `Malformed_json_is_a_400_not_a_500` |
| A06 Components | NuGet audit fails the build on known CVEs; `npm audit` clean; React and Vite are the only frontend dependencies | build |
| A07 Authentication | 12+ character passphrases; lockout 5 tries / 15 min; identical errors and timing for unknown accounts; security stamp revalidated every 5 min | `Login_errors_do_not_reveal_whether_the_account_exists` |
| A08 Integrity | Lockfiles; immutable hashed assets; no third-party scripts | none |
| A09 Logging | Structured auth logs (user id, IP), never passwords; every money movement in an append-only ledger with its actor | ledger tests |
| A10 SSRF | No outbound requests | none |

## Production checklist

- [ ] Run behind TLS (Caddy, nginx, Cloudflare Tunnel or Tailscale Funnel) and set `ForwardedHeaders__Enabled=true` **only** in that case.
- [ ] Set `AllowedHosts` to your hostname.
- [ ] Back up the `App_Data` volume (SQLite database and `keys/`). Losing `keys/` signs everyone out; leaking it lets someone forge sessions.
- [ ] Prefer read-only keys for agents; revoke unused keys.
