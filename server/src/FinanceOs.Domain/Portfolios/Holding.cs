namespace FinanceOs.Domain.Portfolios;

public sealed class Holding
{
    private Holding() { }

    public string Ticker { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public Market Market { get; private set; }
    public Currency Currency => Market.Currency();
    public decimal Units { get; private set; }
    public decimal AvgCost { get; private set; }
    public decimal Price { get; private set; }
    public string Strategy { get; private set; } = string.Empty;

    public decimal MarketValue => Rules.Money(Units * Price);
    public decimal CostBasis => Rules.Money(Units * AvgCost);

    internal static Holding Create(string ticker, string? name, Market market) => new()
    {
        Ticker = ticker,
        Name = string.IsNullOrWhiteSpace(name) ? ticker : Rules.Text(name, Rules.NameMax, "name"),
        Market = market,
    };

    internal void Set(string? name, Market market, decimal units, decimal avgCost, decimal price, string? strategy)
    {
        Name = Rules.Text(string.IsNullOrWhiteSpace(name) ? Ticker : name, Rules.NameMax, "name", required: true);
        Market = market;
        Units = Rules.Units(Rules.NonNegative(units, Rules.UnitsMax, "units"));
        AvgCost = Rules.UnitPrice(Rules.NonNegative(avgCost, Rules.PriceMax, "avgCost"));
        Price = Rules.UnitPrice(Rules.NonNegative(price, Rules.PriceMax, "price"));
        Strategy = Rules.Text(strategy, Rules.StrategyMax, "strategy");
    }

    internal void Buy(decimal units, decimal price)
    {
        var total = Units + units;
        AvgCost = Rules.UnitPrice((Units * AvgCost + units * price) / total);
        Units = Rules.Units(total);
        Price = price;
    }

    internal void Sell(decimal units, decimal price)
    {
        Units = Rules.Units(Units - units);
        Price = price;
    }

    internal void Reprice(decimal price) => Price = Rules.UnitPrice(Rules.Positive(price, Rules.PriceMax, "price"));
}
