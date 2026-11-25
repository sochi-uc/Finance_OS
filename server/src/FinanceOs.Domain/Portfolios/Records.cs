namespace FinanceOs.Domain.Portfolios;

// Append-only records. They are written alongside the aggregate but never loaded with it,
// so the aggregate stays small no matter how long the history grows.

public sealed class LedgerEntry
{
    private LedgerEntry() { }

    public long Id { get; private set; }
    public Guid PortfolioId { get; private set; }
    public DateTimeOffset At { get; private set; }
    public LedgerKind Kind { get; private set; }
    public string? Ticker { get; private set; }
    public decimal Units { get; private set; }
    public decimal Price { get; private set; }
    public Currency Currency { get; private set; }

    /// <summary>Gross value in <see cref="Currency"/> (units × price, or the transferred amount).</summary>
    public decimal Amount { get; private set; }

    public decimal Fee { get; private set; }
    public string Note { get; private set; } = string.Empty;
    public string Actor { get; private set; } = string.Empty;

    internal static LedgerEntry Create(Guid portfolioId, DateTimeOffset at, LedgerKind kind, string? ticker, decimal units,
        decimal price, Currency currency, decimal amount, decimal fee, string? note) => new()
    {
        PortfolioId = portfolioId,
        At = at,
        Kind = kind,
        Ticker = ticker,
        Units = units,
        Price = price,
        Currency = currency,
        Amount = Rules.Money(amount),
        Fee = Rules.Money(fee),
        Note = Rules.Text(note, Rules.NoteMax, "note"),
    };

    /// <summary>History brought in by the legacy importer; it does not move balances.</summary>
    public static LedgerEntry Imported(Guid portfolioId, DateTimeOffset at, LedgerKind kind, string? ticker, decimal units,
        decimal price, Currency currency, string? note) =>
        Create(portfolioId, at, kind, ticker, units, price, currency, units * price, 0, note);

    public LedgerEntry By(string actor)
    {
        Actor = actor;
        return this;
    }
}

public sealed class FxQuote
{
    private FxQuote() { }

    public long Id { get; private set; }
    public Guid PortfolioId { get; private set; }
    public DateTimeOffset At { get; private set; }
    public decimal Rate { get; private set; }
    public string Source { get; private set; } = string.Empty;

    public static FxQuote Create(Guid portfolioId, DateTimeOffset at, decimal rate, string source) =>
        new() { PortfolioId = portfolioId, At = at, Rate = rate, Source = source };
}

public sealed class ActivityEvent
{
    private ActivityEvent() { }

    public long Id { get; private set; }
    public Guid PortfolioId { get; private set; }
    public DateTimeOffset At { get; private set; }
    public string Actor { get; private set; } = string.Empty;
    public string Summary { get; private set; } = string.Empty;

    public static ActivityEvent Create(Guid portfolioId, DateTimeOffset at, string actor, string summary) =>
        new() { PortfolioId = portfolioId, At = at, Actor = actor, Summary = summary.Length > 300 ? summary[..300] : summary };
}

public sealed class JournalNote
{
    private JournalNote() { }

    public long Id { get; private set; }
    public Guid PortfolioId { get; private set; }
    public DateTimeOffset At { get; private set; }
    public string Author { get; private set; } = string.Empty;
    public string Text { get; private set; } = string.Empty;

    public static JournalNote Create(Guid portfolioId, DateTimeOffset at, string author, string? text) => new()
    {
        PortfolioId = portfolioId,
        At = at,
        Author = author,
        Text = Rules.Text(text, Rules.JournalMax, "text", required: true),
    };
}

/// <summary>One row per calendar month, overwritten on every change within that month.</summary>
public sealed class NetWorthSnapshot
{
    private NetWorthSnapshot() { }

    public Guid PortfolioId { get; private set; }
    public string Month { get; private set; } = string.Empty; // yyyy-MM
    public decimal Cash { get; private set; }
    public decimal Investments { get; private set; }
    public decimal Liabilities { get; private set; }
    public decimal NetWorth => Cash + Investments - Liabilities;

    public static NetWorthSnapshot Create(Guid portfolioId, string month) => new() { PortfolioId = portfolioId, Month = month };

    public void Set(decimal cash, decimal investments, decimal liabilities)
    {
        Cash = cash;
        Investments = investments;
        Liabilities = liabilities;
    }

    public void Set(Valuation v)
    {
        Cash = v.CashNgn;
        Investments = v.InvestmentsNgn;
        Liabilities = v.Liabilities;
    }
}
