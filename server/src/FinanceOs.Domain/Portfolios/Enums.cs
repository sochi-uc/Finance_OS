namespace FinanceOs.Domain.Portfolios;

public enum Currency
{
    NGN = 0,
    USD = 1,
}

/// <summary>Where a holding trades. The market fixes its settlement currency.</summary>
public enum Market
{
    NGX = 0,
    US = 1,
}

public enum TradeSide
{
    Buy = 0,
    Sell = 1,
}

public enum LedgerKind
{
    Buy = 0,
    Sell = 1,
    FundUsd = 2,
    ConvertUsd = 3,
    Adjustment = 4,
}

public enum BudgetCategory
{
    Income = 0,
    Fixed = 1,
    Variable = 2,
    Savings = 3,
    Invest = 4,
}

public static class MarketExtensions
{
    public static Currency Currency(this Market market) => market == Market.US ? Portfolios.Currency.USD : Portfolios.Currency.NGN;
}
