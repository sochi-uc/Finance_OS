using System.Globalization;
using System.Text.Json;
using FinanceOs.Domain;
using FinanceOs.Domain.Portfolios;

namespace FinanceOs.Application;

/// <summary>
/// One-time import of the v1 (Node/Fastify) <c>GET /api/state</c> payload. Every value is re-validated
/// through the domain, so a malformed or hostile file can only produce a 400, never bad state.
/// </summary>
internal static class LegacyImporter
{
    private const int MaxRows = 2_000;

    public static IReadOnlyList<Change> Apply(Portfolio p, JsonElement state, DateTimeOffset now, IPortfolioStore store)
    {
        if (state.ValueKind != JsonValueKind.Object) throw new DomainException("import", "Expected the JSON object from /api/state.");
        var changes = new List<Change>();
        var settings = Obj(state, "settings");

        var fx = Num(settings, "fx");
        if (fx > 0) changes.Add(p.SetFxRate(fx, "import", now));
        var fee = Num(settings, "fee");
        if (fee > 0) changes.Add(p.SetUsdFeeRate(fee));
        changes.Add(p.SetBalances(Num(settings, "cash"), Num(settings, "usd_cash"), Num(settings, "liabilities"), "Imported balances", now));
        changes.Add(p.SetUsdCostTracker(Num(settings, "usd_funded"), Num(settings, "ngn_spent")));

        foreach (var h in Rows(state, "holdings"))
        {
            var usd = string.Equals(Str(h, "ccy"), "USD", StringComparison.OrdinalIgnoreCase) || Str(h, "class") == "US";
            changes.Add(p.UpsertHolding(Str(h, "ticker"), Str(h, "name"), usd ? Market.US : Market.NGX, Num(h, "units"), Num(h, "avg"),
                Num(h, "price"), Str(h, "strategy"), now));
        }

        foreach (var c in Rows(state, "cashflow"))
        {
            var category = Str(c, "category").ToUpperInvariant() switch
            {
                "INCOME" => BudgetCategory.Income,
                "FIXED" => BudgetCategory.Fixed,
                "SAVINGS" => BudgetCategory.Savings,
                "INVEST" => BudgetCategory.Invest,
                _ => BudgetCategory.Variable,
            };
            changes.Add(p.AddBudgetLine(category, Str(c, "item"), Math.Max(0, Num(c, "amount")), Str(c, "notes")));
        }

        // History is appended directly: it describes the past and must not move today's balances again.
        foreach (var n in Rows(state, "insights"))
        {
            store.Append(JournalNote.Create(p.Id, Time(n, "ts", now), Str(n, "author") is { Length: > 0 } a ? a : "import", Str(n, "text")));
        }

        foreach (var q in Rows(state, "fxrates"))
        {
            var rate = Num(q, "rate");
            if (rate is >= Rules.FxMin and <= Rules.FxMax) store.Append(FxQuote.Create(p.Id, Time(q, "ts", now), rate, "import"));
        }

        foreach (var t in Rows(state, "trades"))
        {
            var kind = Str(t, "action").ToUpperInvariant() switch
            {
                "BUY" => LedgerKind.Buy,
                "SELL" => LedgerKind.Sell,
                "FUND" => LedgerKind.FundUsd,
                "WITHDRAW" => LedgerKind.ConvertUsd,
                _ => LedgerKind.Adjustment,
            };
            var ticker = Str(t, "ticker");
            var isUsd = ticker == "USD" || kind is LedgerKind.FundUsd or LedgerKind.ConvertUsd;
            store.Append(LedgerEntry.Imported(p.Id, Time(t, "ts", now), kind, ticker.Length <= 15 ? ticker : null, Num(t, "units"),
                Num(t, "price"), isUsd ? Currency.USD : Currency.NGN, Str(t, "note")).By("import"));
        }

        foreach (var s in Rows(state, "networth"))
        {
            if (!DateTime.TryParseExact(Str(s, "month"), "MMM yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var m)) continue;
            var snap = NetWorthSnapshot.Create(p.Id, m.ToString("yyyy-MM", CultureInfo.InvariantCulture));
            snap.Set(Num(s, "cash"), Num(s, "investments"), Num(s, "liabilities"));
            store.Add(snap);
        }

        changes.Add(new Change("Imported data from Finance OS v1"));
        return changes;
    }

    private static JsonElement Obj(JsonElement e, string name) =>
        e.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.Object ? v : default;

    private static List<JsonElement> Rows(JsonElement e, string name)
    {
        if (!e.TryGetProperty(name, out var v) || v.ValueKind != JsonValueKind.Array) return [];
        if (v.GetArrayLength() > MaxRows) throw new DomainException("import", $"'{name}' has more than {MaxRows} rows.");
        return v.EnumerateArray().Where(x => x.ValueKind == JsonValueKind.Object).ToList();
    }

    private static string Str(JsonElement e, string name) =>
        e.ValueKind == JsonValueKind.Object && e.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() ?? string.Empty : string.Empty;

    private static decimal Num(JsonElement e, string name)
    {
        if (e.ValueKind != JsonValueKind.Object || !e.TryGetProperty(name, out var v)) return 0;
        if (v.ValueKind == JsonValueKind.Number && v.TryGetDecimal(out var d)) return d;
        if (v.ValueKind == JsonValueKind.String && decimal.TryParse(v.GetString(), NumberStyles.Number, CultureInfo.InvariantCulture, out d)) return d;
        return 0;
    }

    private static DateTimeOffset Time(JsonElement e, string name, DateTimeOffset fallback) =>
        DateTimeOffset.TryParse(Str(e, name), CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var t) ? t : fallback;
}
