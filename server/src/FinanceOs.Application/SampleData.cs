using FinanceOs.Domain.Portfolios;

namespace FinanceOs.Application;

/// <summary>An illustrative portfolio so a new account can explore every screen before entering real data.</summary>
internal static class SampleData
{
    public static IReadOnlyList<Change> Apply(Portfolio p, DateTimeOffset now)
    {
        var changes = new List<Change>
        {
            p.SetFxRate(1500m, "sample", now),
            p.SetBalances(640_000m, 120m, 0m, "Sample opening balances", now),
            p.UpsertHolding("ARADEL", "Aradel Holdings", Market.NGX, 20m, 1148.30m, 1377m, "Energy & upstream exploration hedge", now),
            p.UpsertHolding("ZENITHBANK", "Zenith Bank", Market.NGX, 131m, 117.90m, 135.40m, "Tier-1 banking compounder", now),
            p.UpsertHolding("UCAP", "United Capital", Market.NGX, 1455m, 17.68m, 17.05m, "Advisory & investment banking dividend play", now),
            p.UpsertHolding("VOO", "Vanguard S&P 500 ETF", Market.US, 0.2m, 490m, 505m, "Core global market dollar-cost average", now),
        };

        foreach (var (cat, item, amount, notes) in new (BudgetCategory, string, decimal, string)[]
        {
            (BudgetCategory.Income, "Salary", 450_000m, ""),
            (BudgetCategory.Income, "Dividends", 50_000m, ""),
            (BudgetCategory.Fixed, "Rent & utilities", 120_000m, ""),
            (BudgetCategory.Fixed, "Internet & subscriptions", 20_000m, ""),
            (BudgetCategory.Variable, "Food & transport", 90_000m, ""),
            (BudgetCategory.Savings, "Emergency fund", 70_000m, "Liquid reserve"),
            (BudgetCategory.Invest, "NGX equities", 120_000m, "UCAP / Zenith / Aradel"),
            (BudgetCategory.Invest, "Global ETF", 50_000m, "VOO"),
        })
        {
            changes.Add(p.AddBudgetLine(cat, item, amount, notes));
        }

        changes.Add(p.UpsertWatch("ARADEL", "Aradel Holdings PLC", 1377m, 1250m, 1530m, "Pullback consolidation",
            "20 EMA (₦1,340) above 50 SMA (₦1,180); volume drying up on the pullback",
            "Healthy 10% correction from the ₦1,530 high. An enlarged production base supports the valuation floor.",
            "Accumulate on tests of ₦1,250–₦1,300. A break above ₦1,530 targets ₦1,850.",
            [550m, 620m, 710m, 950m, 1200m, 1530m, 1377m]));
        changes.Add(p.UpsertWatch("UCAP", "United Capital PLC", 17.05m, 15.80m, 18.50m, "Symmetrical triangle",
            "20 EMA converging with 50 SMA; watch for a 10M+ volume burst",
            "Multi-month coil. Catalysts: IPO advisory mandates and bank recapitalisation fees.",
            "Monthly DCA in the ₦15.80–₦17.50 zone. Confirmed break above ₦18.50 targets ₦24–₦28.",
            [15.2m, 16.4m, 17.8m, 16.5m, 17.2m, 16.8m, 17.05m]));
        changes.Add(p.UpsertWatch("ZENITHBANK", "Zenith Bank PLC", 135.40m, 122m, 145m, "Bullish stair-step",
            "20 EMA above a rising 50 SMA; steady institutional demand",
            "Tier-1 bank with a strong capital base and a protected dividend baseline.",
            "Dips to ₦122–₦128 are buy zones. A break above ₦145 opens ₦180–₦200.",
            [112m, 115m, 119m, 124m, 128m, 132m, 135.4m]));
        changes.Add(p.UpsertWatch("SEPLAT", "Seplat Energy PLC", 5350m, 4800m, 5800m, "Extended uptrend",
            "Extended above a rising 20 EMA; block orders absorb supply on dips",
            "Strong run on asset-acquisition integration.",
            "Wait for pullbacks to the 20 EMA rather than chasing. A break above ₦5,800 targets ₦6,500.",
            [2300m, 2700m, 3300m, 4100m, 4700m, 5100m, 5350m]));
        changes.Add(p.UpsertWatch("BUAFOODS", "BUA Foods PLC", 415m, 365m, 445m, "Trend leader",
            "Well above the 50 SMA; low free float makes clean stair-steps",
            "Staple-food volumes with pricing power.",
            "Trailing stop at ₦365. A break above ₦445 targets ₦500.",
            [190m, 230m, 275m, 330m, 370m, 400m, 415m]));
        changes.Add(p.UpsertWatch("NGXGROUP", "Nigerian Exchange Group", 152m, 125m, 168m, "Compounder",
            "Multi-month uptrend; volume tracks market turnover",
            "Direct beneficiary of rising market activity and new listings.",
            "Accumulate on pullbacks near ₦130. A break above ₦168 targets ₦185–₦200.",
            [61m, 75m, 92m, 115m, 138m, 165m, 152m]));
        return changes;
    }
}
