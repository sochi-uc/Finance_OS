using FinanceOs.Domain.Portfolios;

namespace FinanceOs.Application;

/// <summary>Allow-list mapping between wire strings and domain enums, plus the dashboard projection.</summary>
public static class WireFormat
{
    private static readonly Dictionary<string, TradeSide> Sides = new(StringComparer.OrdinalIgnoreCase)
    {
        ["buy"] = TradeSide.Buy,
        ["sell"] = TradeSide.Sell,
    };

    private static readonly Dictionary<string, Market> Markets = new(StringComparer.OrdinalIgnoreCase)
    {
        ["NGX"] = Market.NGX,
        ["US"] = Market.US,
    };

    private static readonly Dictionary<string, BudgetCategory> Categories = new(StringComparer.OrdinalIgnoreCase)
    {
        ["income"] = BudgetCategory.Income,
        ["fixed"] = BudgetCategory.Fixed,
        ["variable"] = BudgetCategory.Variable,
        ["savings"] = BudgetCategory.Savings,
        ["invest"] = BudgetCategory.Invest,
    };

    public static bool TryParseSide(string? s, out TradeSide side) => Sides.TryGetValue(s ?? string.Empty, out side);
    public static bool TryParseMarket(string? s, out Market market) => Markets.TryGetValue(s ?? string.Empty, out market);
    public static bool TryParseCategory(string? s, out BudgetCategory c) => Categories.TryGetValue(s ?? string.Empty, out c);

    public static string Key(BudgetCategory c) => c.ToString().ToLowerInvariant();

    public static string Key(LedgerKind k) => k switch
    {
        LedgerKind.Buy => "buy",
        LedgerKind.Sell => "sell",
        LedgerKind.FundUsd => "fund-usd",
        LedgerKind.ConvertUsd => "convert-usd",
        _ => "adjustment",
    };

    public static DashboardDto ToDashboard(Portfolio p, History h)
    {
        var v = p.Value();
        var total = v.InvestmentsNgn + v.CashNgn;
        decimal Pct(decimal part, decimal whole) => whole == 0 ? 0 : decimal.Round(part / whole * 100, 2);

        var holdings = p.Holdings
            .Select(x =>
            {
                var valueNgn = Rules.Money(p.ToNgn(x.MarketValue, x.Currency));
                var pnl = x.MarketValue - x.CostBasis;
                return new HoldingDto(
                    x.Ticker, x.Name, x.Market.ToString(), x.Currency.ToString(), x.Units, x.AvgCost, x.Price,
                    x.MarketValue, x.CostBasis, valueNgn, pnl, Pct(pnl, x.CostBasis), Pct(valueNgn, v.InvestmentsNgn), x.Strategy);
            })
            .OrderByDescending(x => x.ValueNgn)
            .ToList();

        var ngx = holdings.Where(x => x.Market == nameof(Market.NGX)).Sum(x => x.ValueNgn);
        var us = holdings.Where(x => x.Market == nameof(Market.US)).Sum(x => x.ValueNgn);
        var usdCashNgn = Rules.Money(v.UsdCash * p.FxRate);
        var allocation = new List<AllocationDto>
        {
            new("ngx", "Nigerian equities", ngx, Pct(ngx, total)),
            new("us", "US equities", us, Pct(us, total)),
            new("ngn-cash", "Naira cash", v.NgnCash, Pct(v.NgnCash, total)),
            new("usd-cash", "Dollar wallet", usdCashNgn, Pct(usdCashNgn, total)),
        };

        var budget = p.Budget.OrderBy(b => b.Category).ThenBy(b => b.Position).ToList();
        decimal Sum(BudgetCategory c) => budget.Where(b => b.Category == c).Sum(b => b.Amount);
        var income = Sum(BudgetCategory.Income);
        var savings = Sum(BudgetCategory.Savings);
        var invest = Sum(BudgetCategory.Invest);
        var summary = new BudgetSummaryDto(
            income, Sum(BudgetCategory.Fixed), Sum(BudgetCategory.Variable), savings, invest,
            income - Sum(BudgetCategory.Fixed) - Sum(BudgetCategory.Variable) - savings - invest,
            Pct(savings + invest, income));

        var held = p.Holdings.Select(x => x.Ticker).ToHashSet();

        return new DashboardDto(
            p.Version,
            new SettingsDto(p.FxRate, p.UsdFeeRate),
            new ValuationDto(v.NetWorth, v.CashNgn, v.NgnCash, v.UsdCash, v.InvestmentsNgn, v.CostBasisNgn, v.Liabilities,
                v.UnrealizedPnl, v.UnrealizedPnlPct, v.AvgUsdCost, p.UsdFunded),
            holdings,
            allocation,
            budget.Select(b => new BudgetLineDto(b.Id, Key(b.Category), b.Item, b.Amount, b.Notes)).ToList(),
            summary,
            p.Watchlist.OrderBy(w => w.Position).Select(w => new WatchItemDto(
                w.Ticker, w.Name, w.Price, w.Support, w.Resistance,
                w.Resistance > w.Support ? decimal.Round(Math.Clamp((w.Price - w.Support) / (w.Resistance - w.Support) * 100, 0, 100), 1) : 0,
                w.Stance, w.Signals, w.Thesis, w.Plan, w.Series, held.Contains(w.Ticker))).ToList(),
            h.Ledger.Select(l => new LedgerDto(l.Id, l.At, Key(l.Kind), l.Ticker, l.Units, l.Price, l.Currency.ToString(),
                l.Amount, l.Fee, l.Note, l.Actor)).ToList(),
            h.Notes.Select(n => new NoteDto(n.Id, n.At, n.Author, n.Text)).ToList(),
            h.Activity.Select(a => new ActivityDto(a.Id, a.At, a.Actor, a.Summary)).ToList(),
            h.Fx.Select(f => new FxPointDto(f.At, f.Rate, f.Source)).ToList(),
            h.Snapshots.Select(s => new NetWorthPointDto(s.Month, s.Cash, s.Investments, s.Liabilities, s.NetWorth)).ToList());
    }
}
