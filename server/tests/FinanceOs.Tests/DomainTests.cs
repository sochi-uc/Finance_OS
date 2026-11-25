using FinanceOs.Domain;
using FinanceOs.Domain.Portfolios;

namespace FinanceOs.Tests;

public sealed class DomainTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 1, 0, 0, 0, TimeSpan.Zero);

    private static Portfolio Funded(decimal ngn = 1_000_000m, decimal usd = 0m)
    {
        var p = Portfolio.Create("owner", Now);
        p.SetBalances(ngn, usd, 0, null, Now);
        return p;
    }

    [Fact]
    public void Buys_compute_weighted_average_cost_exactly()
    {
        var p = Funded();
        p.Trade(TradeSide.Buy, "ucap", Market.NGX, 100, 17.10m, true, null, Now);
        p.Trade(TradeSide.Buy, "UCAP", Market.NGX, 300, 16.90m, true, null, Now);

        var h = Assert.Single(p.Holdings);
        Assert.Equal("UCAP", h.Ticker);
        Assert.Equal(400m, h.Units);
        Assert.Equal(16.95m, h.AvgCost);                    // (1710 + 5070) / 400, no float drift
        Assert.Equal(1_000_000m - 1710m - 5070m, p.NgnCash);
    }

    [Fact]
    public void Decimal_money_has_no_floating_point_drift()
    {
        var p = Funded(0.3m);
        p.Trade(TradeSide.Buy, "X", Market.NGX, 1, 0.1m, true, null, Now);
        p.Trade(TradeSide.Buy, "X", Market.NGX, 1, 0.2m, true, null, Now);
        Assert.Equal(0m, p.NgnCash); // 0.3 - 0.1 - 0.2 is exactly zero
    }

    [Fact]
    public void Selling_more_than_held_is_rejected_and_changes_nothing()
    {
        var p = Funded();
        p.Trade(TradeSide.Buy, "ZENITH", Market.NGX, 10, 100, true, null, Now);
        var cash = p.NgnCash;
        var version = p.Version;

        var ex = Assert.Throws<DomainException>(() => p.Trade(TradeSide.Sell, "ZENITH", Market.NGX, 11, 120, true, null, Now));
        Assert.Equal("units", ex.Field);
        Assert.Equal(cash, p.NgnCash);
        Assert.Equal(10m, p.Holdings[0].Units);
        Assert.Equal(version, p.Version);
    }

    [Fact]
    public void Selling_everything_closes_the_position()
    {
        var p = Funded();
        p.Trade(TradeSide.Buy, "ARADEL", Market.NGX, 5, 1000, true, null, Now);
        p.Trade(TradeSide.Sell, "ARADEL", Market.NGX, 5, 1200, true, null, Now);
        Assert.Empty(p.Holdings);
        Assert.Equal(1_001_000m, p.NgnCash);
    }

    [Fact]
    public void Usd_buy_requires_wallet_to_cover_price_plus_fee()
    {
        var p = Funded(usd: 100m); // fee defaults to 1.5%
        var ex = Assert.Throws<DomainException>(() => p.Trade(TradeSide.Buy, "VOO", Market.US, 0.2m, 500m, true, null, Now));
        Assert.Contains("incl. fee", ex.Message, StringComparison.Ordinal);

        p.Trade(TradeSide.Buy, "VOO", Market.US, 0.19m, 500m, true, null, Now); // 95 + 1.43 fee
        Assert.Equal(100m - 95m - 1.42m, p.UsdCash);                            // 1.425 rounds to even → 1.42
    }

    [Fact]
    public void Funding_usd_moves_naira_and_tracks_average_cost()
    {
        var p = Funded(1_000_000m);
        p.FundUsd(100, 1500, 500, historical: false, null, Now);
        p.FundUsd(100, 1600, 0, historical: false, null, Now);

        Assert.Equal(200m, p.UsdCash);
        Assert.Equal(1_000_000m - 150_500m - 160_000m, p.NgnCash);
        Assert.Equal(1552.5m, p.Value().AvgUsdCost);
    }

    [Fact]
    public void Historical_funding_updates_tracker_but_not_balances()
    {
        var p = Funded(0);
        p.FundUsd(50, 1400, 0, historical: true, null, Now);
        Assert.Equal(0m, p.UsdCash);
        Assert.Equal(0m, p.NgnCash);
        Assert.Equal(1400m, p.Value().AvgUsdCost);
    }

    [Fact]
    public void Valuation_converts_usd_at_portfolio_rate()
    {
        var p = Funded(100_000m, 10m);
        p.SetFxRate(1500, "test", Now);
        p.UpsertHolding("VOO", "Vanguard", Market.US, 1, 400, 500, null, Now);

        var v = p.Value();
        Assert.Equal(115_000m, v.CashNgn);
        Assert.Equal(750_000m, v.InvestmentsNgn);
        Assert.Equal(865_000m, v.NetWorth);
        Assert.Equal(25m, v.UnrealizedPnlPct);
    }

    [Theory]
    [InlineData("")]
    [InlineData("<script>")]
    [InlineData("WAY-TOO-LONG-TICKER")]
    public void Invalid_tickers_are_rejected(string ticker) =>
        Assert.Equal("ticker", Assert.Throws<DomainException>(() => Funded().Trade(TradeSide.Buy, ticker, Market.NGX, 1, 1, false, null, Now)).Field);

    [Fact]
    public void Watch_item_requires_resistance_above_support() =>
        Assert.Equal("resistance", Assert.Throws<DomainException>(() =>
            Funded().UpsertWatch("UCAP", null, 17, 18, 16, null, null, null, null, null)).Field);
}
