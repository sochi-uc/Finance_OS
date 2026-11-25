using System.Text.RegularExpressions;

namespace FinanceOs.Domain.Portfolios;

/// <summary>Every input bound the system enforces, in one place (OWASP A04: bounded by design).</summary>
public static partial class Rules
{
    public const int NameMax = 80;
    public const int StrategyMax = 200;
    public const int NoteMax = 500;
    public const int JournalMax = 4_000;
    public const int SourceMax = 60;
    public const int HoldingsMax = 300;
    public const int BudgetMax = 200;
    public const int WatchlistMax = 100;
    public const int SeriesMax = 60;

    public const decimal UnitsMax = 1_000_000_000_000m;
    public const decimal PriceMax = 1_000_000_000m;
    public const decimal AmountMax = 1_000_000_000_000_000m;
    public const decimal FxMin = 1m;
    public const decimal FxMax = 100_000m;
    public const decimal FeeMax = 0.2m;

    [GeneratedRegex("^[A-Z0-9][A-Z0-9.\\-]{0,14}$")]
    private static partial Regex TickerPattern();

    public static string Ticker(string? raw, string field = "ticker")
    {
        var t = (raw ?? string.Empty).Trim().ToUpperInvariant();
        if (!TickerPattern().IsMatch(t))
            throw new DomainException(field, "Ticker must be 1–15 letters, digits, '.' or '-'.");
        return t;
    }

    public static string Text(string? raw, int max, string field, bool required = false)
    {
        var t = (raw ?? string.Empty).Trim();
        if (required && t.Length == 0) throw new DomainException(field, "This field is required.");
        if (t.Length > max) throw new DomainException(field, $"Must be at most {max} characters.");
        return t;
    }

    public static decimal Positive(decimal value, decimal max, string field)
    {
        if (value <= 0) throw new DomainException(field, "Must be greater than zero.");
        if (value > max) throw new DomainException(field, "Value is too large.");
        return value;
    }

    public static decimal NonNegative(decimal value, decimal max, string field)
    {
        if (value < 0) throw new DomainException(field, "Cannot be negative.");
        if (value > max) throw new DomainException(field, "Value is too large.");
        return value;
    }

    /// <summary>Currency amounts are kept to kobo/cents; units to 8 dp; unit costs to 6 dp.</summary>
    public static decimal Money(decimal v) => decimal.Round(v, 2, MidpointRounding.ToEven);
    public static decimal Units(decimal v) => decimal.Round(v, 8, MidpointRounding.ToEven);
    public static decimal UnitPrice(decimal v) => decimal.Round(v, 6, MidpointRounding.ToEven);
}
