namespace FinanceOs.Domain.Portfolios;

public sealed class BudgetLine
{
    private BudgetLine() { }

    public Guid Id { get; private set; }
    public BudgetCategory Category { get; private set; }
    public string Item { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    public string Notes { get; private set; } = string.Empty;
    public int Position { get; private set; }

    internal static BudgetLine Create(int position) => new() { Id = Guid.NewGuid(), Position = position };

    internal void Set(BudgetCategory category, string? item, decimal amount, string? notes)
    {
        if (!Enum.IsDefined(category)) throw new DomainException("category", "Unknown category.");
        Category = category;
        Item = Rules.Text(item, Rules.NameMax, "item", required: true);
        Amount = Rules.Money(Rules.NonNegative(amount, Rules.AmountMax, "amount"));
        Notes = Rules.Text(notes, Rules.StrategyMax, "notes");
    }
}

/// <summary>A watchlist / research card: price zone, thesis and the plan for the position.</summary>
public sealed class WatchItem
{
    private WatchItem() { }

    public string Ticker { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public decimal Support { get; private set; }
    public decimal Resistance { get; private set; }
    public string Stance { get; private set; } = string.Empty;
    public string Signals { get; private set; } = string.Empty;
    public string Thesis { get; private set; } = string.Empty;
    public string Plan { get; private set; } = string.Empty;
    public List<decimal> Series { get; private set; } = [];
    public int Position { get; private set; }

    internal static WatchItem Create(string ticker, int position) => new() { Ticker = ticker, Position = position };

    internal void Set(string? name, decimal price, decimal support, decimal resistance, string? stance, string? signals,
        string? thesis, string? plan, IReadOnlyList<decimal>? series)
    {
        Name = Rules.Text(string.IsNullOrWhiteSpace(name) ? Ticker : name, Rules.NameMax, "name", required: true);
        Price = Rules.UnitPrice(Rules.Positive(price, Rules.PriceMax, "price"));
        Support = Rules.UnitPrice(Rules.NonNegative(support, Rules.PriceMax, "support"));
        Resistance = Rules.UnitPrice(Rules.NonNegative(resistance, Rules.PriceMax, "resistance"));
        if (Support > 0 && Resistance > 0 && Support >= Resistance)
            throw new DomainException("resistance", "Resistance must be above support.");
        Stance = Rules.Text(stance, Rules.NameMax, "stance");
        Signals = Rules.Text(signals, Rules.NoteMax, "signals");
        Thesis = Rules.Text(thesis, Rules.JournalMax, "thesis");
        Plan = Rules.Text(plan, Rules.NoteMax, "plan");
        var points = series ?? [];
        if (points.Count > Rules.SeriesMax) throw new DomainException("series", $"At most {Rules.SeriesMax} points.");
        Series = points.Select(p => Rules.UnitPrice(Rules.Positive(p, Rules.PriceMax, "series"))).ToList();
    }
}
