namespace FinanceOs.Application;

// ---------------------------------------------------------------- requests
// Every property is nullable so missing input becomes a clean validation error, never a 500.
// Enums arrive as strings and are parsed against allow-lists in WireFormat.

public sealed record TradeRequest(string? Side, string? Ticker, string? Market, decimal? Units, decimal? Price, bool? SettleFromCash, string? Note);

public sealed record HoldingRequest(string? Name, string? Market, decimal? Units, decimal? AvgCost, decimal? Price, string? Strategy);

public sealed record PricesRequest(Dictionary<string, decimal>? Prices);

public sealed record FxRequest(decimal? Rate, string? Source);

public sealed record FundUsdRequest(decimal? Usd, decimal? Rate, decimal? FeeNgn, bool? Historical, string? Note);

public sealed record ConvertUsdRequest(decimal? Usd, decimal? Rate, string? Note);

public sealed record BalancesRequest(decimal? NgnCash, decimal? UsdCash, decimal? Liabilities, string? Note);

public sealed record SettingsRequest(decimal? UsdFeeRate);

public sealed record BudgetLineRequest(string? Category, string? Item, decimal? Amount, string? Notes);

public sealed record NoteRequest(string? Text);

public sealed record WatchRequest(
    string? Name, decimal? Price, decimal? Support, decimal? Resistance, string? Stance, string? Signals,
    string? Thesis, string? Plan, IReadOnlyList<decimal>? Series);

// ---------------------------------------------------------------- read model

public sealed record DashboardDto(
    int Version,
    SettingsDto Settings,
    ValuationDto Valuation,
    IReadOnlyList<HoldingDto> Holdings,
    IReadOnlyList<AllocationDto> Allocation,
    IReadOnlyList<BudgetLineDto> Budget,
    BudgetSummaryDto BudgetSummary,
    IReadOnlyList<WatchItemDto> Watchlist,
    IReadOnlyList<LedgerDto> Ledger,
    IReadOnlyList<NoteDto> Notes,
    IReadOnlyList<ActivityDto> Activity,
    IReadOnlyList<FxPointDto> FxHistory,
    IReadOnlyList<NetWorthPointDto> NetWorthHistory);

public sealed record SettingsDto(decimal FxRate, decimal UsdFeeRate);

public sealed record ValuationDto(
    decimal NetWorth, decimal CashNgn, decimal NgnCash, decimal UsdCash, decimal InvestmentsNgn, decimal CostBasisNgn,
    decimal Liabilities, decimal UnrealizedPnl, decimal UnrealizedPnlPct, decimal AvgUsdCost, decimal UsdFunded);

public sealed record HoldingDto(
    string Ticker, string Name, string Market, string Currency, decimal Units, decimal AvgCost, decimal Price,
    decimal MarketValue, decimal CostBasis, decimal ValueNgn, decimal Pnl, decimal PnlPct, decimal WeightPct, string Strategy);

public sealed record AllocationDto(string Key, string Label, decimal ValueNgn, decimal Pct);

public sealed record BudgetLineDto(Guid Id, string Category, string Item, decimal Amount, string Notes);

public sealed record BudgetSummaryDto(
    decimal Income, decimal Fixed, decimal Variable, decimal Savings, decimal Invest, decimal Unallocated, decimal SavingsRatePct);

public sealed record WatchItemDto(
    string Ticker, string Name, decimal Price, decimal Support, decimal Resistance, decimal RangePct, string Stance,
    string Signals, string Thesis, string Plan, IReadOnlyList<decimal> Series, bool Held);

public sealed record LedgerDto(
    long Id, DateTimeOffset At, string Kind, string? Ticker, decimal Units, decimal Price, string Currency, decimal Amount,
    decimal Fee, string Note, string Actor);

public sealed record NoteDto(long Id, DateTimeOffset At, string Author, string Text);

public sealed record ActivityDto(long Id, DateTimeOffset At, string Actor, string Summary);

public sealed record FxPointDto(DateTimeOffset At, decimal Rate, string Source);

public sealed record NetWorthPointDto(string Month, decimal Cash, decimal Investments, decimal Liabilities, decimal NetWorth);
