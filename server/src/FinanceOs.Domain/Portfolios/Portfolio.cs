namespace FinanceOs.Domain.Portfolios;

/// <summary>What a command did: a human summary for the activity feed plus any record to append.</summary>
public sealed record Change(string Summary, LedgerEntry? Ledger = null, FxQuote? Fx = null);

/// <summary>A point-in-time valuation, everything converted to NGN at the portfolio FX rate.</summary>
public sealed record Valuation(
    decimal CashNgn,
    decimal NgnCash,
    decimal UsdCash,
    decimal InvestmentsNgn,
    decimal CostBasisNgn,
    decimal Liabilities,
    decimal NetWorth,
    decimal UnrealizedPnl,
    decimal UnrealizedPnlPct,
    decimal AvgUsdCost);

/// <summary>
/// Aggregate root: one per owner. All balance-changing rules live here, and every successful command
/// bumps <see cref="Version"/>, which the store uses as an optimistic-concurrency token so two
/// simultaneous trades can never both pass the same balance check.
/// </summary>
public sealed class Portfolio
{
    private readonly List<Holding> _holdings = [];
    private readonly List<BudgetLine> _budget = [];
    private readonly List<WatchItem> _watchlist = [];

    private Portfolio() { }

    public Guid Id { get; private set; }
    public string OwnerId { get; private set; } = string.Empty;
    public int Version { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    public decimal NgnCash { get; private set; }
    public decimal UsdCash { get; private set; }
    public decimal Liabilities { get; private set; }
    public decimal FxRate { get; private set; }
    public decimal UsdFeeRate { get; private set; }
    public decimal UsdFunded { get; private set; }
    public decimal NgnSpentOnUsd { get; private set; }

    public IReadOnlyList<Holding> Holdings => _holdings;
    public IReadOnlyList<BudgetLine> Budget => _budget;
    public IReadOnlyList<WatchItem> Watchlist => _watchlist;

    public static Portfolio Create(string ownerId, DateTimeOffset now, decimal fxRate = 1500m, decimal usdFeeRate = 0.015m)
    {
        if (string.IsNullOrWhiteSpace(ownerId)) throw new ArgumentException("Owner is required.", nameof(ownerId));
        return new Portfolio
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId,
            CreatedAt = now,
            FxRate = fxRate,
            UsdFeeRate = usdFeeRate,
        };
    }

    // ------------------------------------------------------------------ valuation

    public decimal ToNgn(decimal amount, Currency currency) => currency == Currency.USD ? amount * FxRate : amount;

    public Valuation Value()
    {
        var investments = Rules.Money(_holdings.Sum(h => ToNgn(h.Units * h.Price, h.Currency)));
        var cost = Rules.Money(_holdings.Sum(h => ToNgn(h.Units * h.AvgCost, h.Currency)));
        var cash = Rules.Money(NgnCash + UsdCash * FxRate);
        var pnl = investments - cost;
        return new Valuation(
            cash,
            NgnCash,
            UsdCash,
            investments,
            cost,
            Liabilities,
            cash + investments - Liabilities,
            pnl,
            cost == 0 ? 0 : decimal.Round(pnl / cost * 100, 2),
            UsdFunded == 0 ? 0 : Rules.UnitPrice(NgnSpentOnUsd / UsdFunded));
    }

    // ------------------------------------------------------------------ trading

    public Change Trade(TradeSide side, string? rawTicker, Market market, decimal units, decimal price, bool settleFromCash,
        string? note, DateTimeOffset now)
    {
        if (!Enum.IsDefined(side)) throw new DomainException("side", "Side must be buy or sell.");
        if (!Enum.IsDefined(market)) throw new DomainException("market", "Unknown market.");
        var ticker = Rules.Ticker(rawTicker);
        units = Rules.Units(Rules.Positive(units, Rules.UnitsMax, "units"));
        price = Rules.UnitPrice(Rules.Positive(price, Rules.PriceMax, "price"));

        var holding = _holdings.FirstOrDefault(h => h.Ticker == ticker);
        if (side == TradeSide.Sell)
        {
            if (holding is null || holding.Units < units)
                throw new DomainException("units", $"You hold {holding?.Units ?? 0:0.########} {ticker}; cannot sell {units:0.########}.");
        }
        else if (holding is null)
        {
            if (_holdings.Count >= Rules.HoldingsMax) throw new DomainException("ticker", "Holding limit reached.");
            holding = Holding.Create(ticker, null, market);
            _holdings.Add(holding);
        }

        var currency = holding.Currency;
        var gross = Rules.Money(units * price);
        var fee = currency == Currency.USD ? Rules.Money(gross * UsdFeeRate) : 0m;

        // Settlement happens before the position changes, so a failed balance check leaves no trace.
        if (currency == Currency.USD)
        {
            if (side == TradeSide.Buy)
            {
                if (gross + fee > UsdCash)
                    throw new DomainException("units", $"Needs ${gross + fee:N2} incl. fee; USD wallet has ${UsdCash:N2}.");
                UsdCash = Rules.Money(UsdCash - gross - fee);
            }
            else
            {
                UsdCash = Rules.Money(UsdCash + gross - fee);
            }
        }
        else if (settleFromCash)
        {
            if (side == TradeSide.Buy)
            {
                if (gross > NgnCash) throw new DomainException("units", $"Needs ₦{gross:N2}; Naira cash is ₦{NgnCash:N2}.");
                NgnCash = Rules.Money(NgnCash - gross);
            }
            else
            {
                NgnCash = Rules.Money(NgnCash + gross);
            }
        }

        if (side == TradeSide.Buy) holding.Buy(units, price);
        else holding.Sell(units, price);
        if (holding.Units == 0) _holdings.Remove(holding);

        Touch();
        var verb = side == TradeSide.Buy ? "Bought" : "Sold";
        var sym = currency == Currency.USD ? "$" : "₦";
        return new Change(
            $"{verb} {units:0.########} {ticker} @ {sym}{price:N2}",
            LedgerEntry.Create(Id, now, side == TradeSide.Buy ? LedgerKind.Buy : LedgerKind.Sell, ticker, units, price, currency, gross, fee, note));
    }

    public Change UpsertHolding(string? rawTicker, string? name, Market market, decimal units, decimal avgCost, decimal price,
        string? strategy, DateTimeOffset now)
    {
        if (!Enum.IsDefined(market)) throw new DomainException("market", "Unknown market.");
        var ticker = Rules.Ticker(rawTicker);
        var holding = _holdings.FirstOrDefault(h => h.Ticker == ticker);
        var isNew = holding is null;
        if (isNew)
        {
            if (_holdings.Count >= Rules.HoldingsMax) throw new DomainException("ticker", "Holding limit reached.");
            holding = Holding.Create(ticker, name, market);
        }

        holding!.Set(name, market, units, avgCost, price, strategy);
        if (isNew) _holdings.Add(holding);
        Touch();
        return new Change(
            $"{(isNew ? "Added" : "Edited")} holding {ticker}: {holding.Units:0.########} @ avg {holding.AvgCost:N2}",
            LedgerEntry.Create(Id, now, LedgerKind.Adjustment, ticker, holding.Units, holding.AvgCost, holding.Currency, holding.CostBasis, 0, "Manual position edit"));
    }

    public Change? RemoveHolding(string? rawTicker)
    {
        var ticker = Rules.Ticker(rawTicker);
        var holding = _holdings.FirstOrDefault(h => h.Ticker == ticker);
        if (holding is null) return null;
        _holdings.Remove(holding);
        Touch();
        return new Change($"Removed holding {ticker}");
    }

    public Change UpdatePrices(IReadOnlyDictionary<string, decimal> prices)
    {
        if (prices.Count == 0) throw new DomainException("prices", "Provide at least one price.");
        if (prices.Count > Rules.HoldingsMax) throw new DomainException("prices", "Too many prices.");
        var applied = new List<string>();
        foreach (var (rawTicker, price) in prices)
        {
            var ticker = Rules.Ticker(rawTicker, "prices");
            var holding = _holdings.FirstOrDefault(h => h.Ticker == ticker)
                ?? throw new DomainException("prices", $"{ticker} is not a holding.");
            holding.Reprice(price);
            applied.Add($"{ticker} {holding.Price:N2}");
        }

        Touch();
        return new Change($"Prices updated: {string.Join(", ", applied)}");
    }

    // ------------------------------------------------------------------ treasury

    public Change SetFxRate(decimal rate, string? source, DateTimeOffset now)
    {
        if (rate < Rules.FxMin || rate > Rules.FxMax) throw new DomainException("rate", "Rate must be between 1 and 100,000.");
        FxRate = Rules.UnitPrice(rate);
        var src = Rules.Text(string.IsNullOrWhiteSpace(source) ? "manual" : source, Rules.SourceMax, "source");
        Touch();
        return new Change($"FX rate set to ₦{FxRate:N2}/$ ({src})", Fx: FxQuote.Create(Id, now, FxRate, src));
    }

    /// <summary>Buy dollars with Naira. A historical entry only updates the average-cost tracker.</summary>
    public Change FundUsd(decimal usd, decimal? rate, decimal feeNgn, bool historical, string? note, DateTimeOffset now)
    {
        usd = Rules.Money(Rules.Positive(usd, Rules.AmountMax, "usd"));
        var fx = rate ?? FxRate;
        if (fx < Rules.FxMin || fx > Rules.FxMax) throw new DomainException("rate", "Rate must be between 1 and 100,000.");
        feeNgn = Rules.Money(Rules.NonNegative(feeNgn, Rules.AmountMax, "feeNgn"));
        var ngn = Rules.Money(usd * fx + feeNgn);

        if (!historical)
        {
            if (ngn > NgnCash) throw new DomainException("usd", $"Needs ₦{ngn:N2}; Naira cash is ₦{NgnCash:N2}.");
            NgnCash = Rules.Money(NgnCash - ngn);
            UsdCash = Rules.Money(UsdCash + usd);
        }

        UsdFunded = Rules.Money(UsdFunded + usd);
        NgnSpentOnUsd = Rules.Money(NgnSpentOnUsd + ngn);
        Touch();
        return new Change(
            $"Funded ${usd:N2} @ ₦{fx:N2} (₦{ngn:N2}){(historical ? " · logged history" : string.Empty)}",
            LedgerEntry.Create(Id, now, LedgerKind.FundUsd, "USD", usd, fx, Currency.USD, usd, feeNgn,
                string.IsNullOrWhiteSpace(note) && historical ? "Past funding (logged)" : note));
    }

    /// <summary>Sell dollars back to Naira.</summary>
    public Change ConvertUsd(decimal usd, decimal? rate, string? note, DateTimeOffset now)
    {
        usd = Rules.Money(Rules.Positive(usd, Rules.AmountMax, "usd"));
        var fx = rate ?? FxRate;
        if (fx < Rules.FxMin || fx > Rules.FxMax) throw new DomainException("rate", "Rate must be between 1 and 100,000.");
        if (usd > UsdCash) throw new DomainException("usd", $"USD wallet has ${UsdCash:N2}.");
        var ngn = Rules.Money(usd * fx);
        UsdCash = Rules.Money(UsdCash - usd);
        NgnCash = Rules.Money(NgnCash + ngn);
        Touch();
        return new Change(
            $"Converted ${usd:N2} → ₦{ngn:N2} @ ₦{fx:N2}",
            LedgerEntry.Create(Id, now, LedgerKind.ConvertUsd, "USD", usd, fx, Currency.USD, usd, 0, note));
    }

    public Change SetBalances(decimal? ngnCash, decimal? usdCash, decimal? liabilities, string? note, DateTimeOffset now)
    {
        if (ngnCash is null && usdCash is null && liabilities is null)
            throw new DomainException("ngnCash", "Provide at least one balance.");
        var parts = new List<string>();
        if (ngnCash is { } n) { NgnCash = Rules.Money(Rules.NonNegative(n, Rules.AmountMax, "ngnCash")); parts.Add($"Naira cash ₦{NgnCash:N2}"); }
        if (usdCash is { } u) { UsdCash = Rules.Money(Rules.NonNegative(u, Rules.AmountMax, "usdCash")); parts.Add($"USD wallet ${UsdCash:N2}"); }
        if (liabilities is { } l) { Liabilities = Rules.Money(Rules.NonNegative(l, Rules.AmountMax, "liabilities")); parts.Add($"liabilities ₦{Liabilities:N2}"); }
        Touch();
        var summary = $"Balances set: {string.Join(", ", parts)}";
        return new Change(summary, LedgerEntry.Create(Id, now, LedgerKind.Adjustment, null, 0, 0, Currency.NGN, 0, 0, note ?? summary));
    }

    /// <summary>Restores the average-USD-cost tracker (used by the legacy importer).</summary>
    public Change SetUsdCostTracker(decimal usdFunded, decimal ngnSpent)
    {
        UsdFunded = Rules.Money(Rules.NonNegative(usdFunded, Rules.AmountMax, "usdFunded"));
        NgnSpentOnUsd = Rules.Money(Rules.NonNegative(ngnSpent, Rules.AmountMax, "ngnSpent"));
        Touch();
        return new Change($"USD cost tracker set: ${UsdFunded:N2} for ₦{NgnSpentOnUsd:N2}");
    }

    public bool IsEmpty => _holdings.Count == 0 && _budget.Count == 0 && _watchlist.Count == 0 && NgnCash == 0 && UsdCash == 0;

    public Change SetUsdFeeRate(decimal feeRate)
    {
        if (feeRate < 0 || feeRate > Rules.FeeMax) throw new DomainException("usdFeeRate", "Fee must be between 0% and 20%.");
        UsdFeeRate = decimal.Round(feeRate, 4);
        Touch();
        return new Change($"USD trading fee set to {UsdFeeRate * 100:0.##}%");
    }

    // ------------------------------------------------------------------ budget

    public Change AddBudgetLine(BudgetCategory category, string? item, decimal amount, string? notes)
    {
        if (_budget.Count >= Rules.BudgetMax) throw new DomainException("item", "Budget line limit reached.");
        var line = BudgetLine.Create(_budget.Count == 0 ? 0 : _budget.Max(b => b.Position) + 1);
        line.Set(category, item, amount, notes);
        _budget.Add(line);
        Touch();
        return new Change($"Budget: added {line.Item} ₦{line.Amount:N2}");
    }

    public Change? UpdateBudgetLine(Guid id, BudgetCategory category, string? item, decimal amount, string? notes)
    {
        var line = _budget.FirstOrDefault(b => b.Id == id);
        if (line is null) return null;
        line.Set(category, item, amount, notes);
        Touch();
        return new Change($"Budget: {line.Item} set to ₦{line.Amount:N2}");
    }

    public Change? RemoveBudgetLine(Guid id)
    {
        var line = _budget.FirstOrDefault(b => b.Id == id);
        if (line is null) return null;
        _budget.Remove(line);
        Touch();
        return new Change($"Budget: removed {line.Item}");
    }

    // ------------------------------------------------------------------ research

    public Change UpsertWatch(string? rawTicker, string? name, decimal price, decimal support, decimal resistance, string? stance,
        string? signals, string? thesis, string? plan, IReadOnlyList<decimal>? series)
    {
        var ticker = Rules.Ticker(rawTicker);
        var item = _watchlist.FirstOrDefault(w => w.Ticker == ticker);
        var isNew = item is null;
        if (isNew)
        {
            if (_watchlist.Count >= Rules.WatchlistMax) throw new DomainException("ticker", "Watchlist limit reached.");
            item = WatchItem.Create(ticker, _watchlist.Count == 0 ? 0 : _watchlist.Max(w => w.Position) + 1);
        }

        item!.Set(name, price, support, resistance, stance, signals, thesis, plan, series);
        if (isNew) _watchlist.Add(item);
        Touch();
        return new Change($"Research: {(isNew ? "added" : "updated")} {ticker}");
    }

    public Change? RemoveWatch(string? rawTicker)
    {
        var ticker = Rules.Ticker(rawTicker);
        var item = _watchlist.FirstOrDefault(w => w.Ticker == ticker);
        if (item is null) return null;
        _watchlist.Remove(item);
        Touch();
        return new Change($"Research: removed {ticker}");
    }

    private void Touch() => Version++;
}
