using System.Globalization;
using FinanceOs.Application.Common;
using FinanceOs.Domain;
using FinanceOs.Domain.Portfolios;

namespace FinanceOs.Application;

/// <summary>
/// Every command runs through one pipeline: load the owner's portfolio → apply domain rules →
/// append ledger / FX / activity records → refresh this month's net-worth snapshot → commit atomically →
/// notify open sessions → return the fresh dashboard. Rule violations become 400s, lost races 409s.
/// </summary>
public sealed class PortfolioService(IPortfolioStore store, IChangeNotifier notifier, TimeProvider clock)
{
    public async Task<DashboardDto> GetDashboardAsync(string ownerId, CancellationToken ct)
    {
        var p = await LoadOrCreateAsync(ownerId, ct);
        return WireFormat.ToDashboard(p, await store.GetHistoryAsync(p.Id, ct));
    }

    /// <summary>Creates the portfolio at sign-up so the first real request never races to create it.</summary>
    public async Task EnsurePortfolioAsync(string ownerId, CancellationToken ct) => await LoadOrCreateAsync(ownerId, ct);

    // ------------------------------------------------------------------ investments

    public Task<Result<DashboardDto>> TradeAsync(Actor actor, TradeRequest r, CancellationToken ct)
    {
        if (!WireFormat.TryParseSide(r.Side, out var side)) return Invalid("side", "Side must be buy or sell.");
        if (!WireFormat.TryParseMarket(r.Market ?? "NGX", out var market)) return Invalid("market", "Market must be NGX or US.");
        if (r.Units is null) return Invalid("units", "Units are required.");
        if (r.Price is null) return Invalid("price", "Price is required.");
        return RunAsync(actor, (p, now) => p.Trade(side, r.Ticker, market, r.Units.Value, r.Price.Value, r.SettleFromCash ?? true, r.Note, now), ct);
    }

    public Task<Result<DashboardDto>> UpsertHoldingAsync(Actor actor, string ticker, HoldingRequest r, CancellationToken ct)
    {
        if (!WireFormat.TryParseMarket(r.Market ?? "NGX", out var market)) return Invalid("market", "Market must be NGX or US.");
        if (r.Units is null) return Invalid("units", "Units are required.");
        return RunAsync(actor, (p, now) => p.UpsertHolding(ticker, r.Name, market, r.Units.Value, r.AvgCost ?? 0, r.Price ?? r.AvgCost ?? 0, r.Strategy, now), ct);
    }

    public Task<Result<DashboardDto>> RemoveHoldingAsync(Actor actor, string ticker, CancellationToken ct) =>
        RunAsync(actor, (p, _) => p.RemoveHolding(ticker), ct);

    public Task<Result<DashboardDto>> UpdatePricesAsync(Actor actor, PricesRequest r, CancellationToken ct) =>
        r.Prices is null ? Invalid("prices", "Prices are required.") : RunAsync(actor, (p, _) => p.UpdatePrices(r.Prices), ct);

    // ------------------------------------------------------------------ treasury

    public Task<Result<DashboardDto>> SetFxAsync(Actor actor, FxRequest r, CancellationToken ct) =>
        r.Rate is null ? Invalid("rate", "Rate is required.") : RunAsync(actor, (p, now) => p.SetFxRate(r.Rate.Value, r.Source, now), ct);

    public Task<Result<DashboardDto>> FundUsdAsync(Actor actor, FundUsdRequest r, CancellationToken ct) =>
        r.Usd is null
            ? Invalid("usd", "Amount is required.")
            : RunAsync(actor, (p, now) => p.FundUsd(r.Usd.Value, r.Rate, r.FeeNgn ?? 0, r.Historical ?? false, r.Note, now), ct);

    public Task<Result<DashboardDto>> ConvertUsdAsync(Actor actor, ConvertUsdRequest r, CancellationToken ct) =>
        r.Usd is null ? Invalid("usd", "Amount is required.") : RunAsync(actor, (p, now) => p.ConvertUsd(r.Usd.Value, r.Rate, r.Note, now), ct);

    public Task<Result<DashboardDto>> SetBalancesAsync(Actor actor, BalancesRequest r, CancellationToken ct) =>
        RunAsync(actor, (p, now) => p.SetBalances(r.NgnCash, r.UsdCash, r.Liabilities, r.Note, now), ct);

    public Task<Result<DashboardDto>> UpdateSettingsAsync(Actor actor, SettingsRequest r, CancellationToken ct) =>
        r.UsdFeeRate is null ? Invalid("usdFeeRate", "Fee is required.") : RunAsync(actor, (p, _) => p.SetUsdFeeRate(r.UsdFeeRate.Value), ct);

    // ------------------------------------------------------------------ budget

    public Task<Result<DashboardDto>> AddBudgetLineAsync(Actor actor, BudgetLineRequest r, CancellationToken ct)
    {
        if (!WireFormat.TryParseCategory(r.Category, out var c)) return Invalid("category", "Unknown category.");
        return RunAsync(actor, (p, _) => p.AddBudgetLine(c, r.Item, r.Amount ?? 0, r.Notes), ct);
    }

    public Task<Result<DashboardDto>> UpdateBudgetLineAsync(Actor actor, Guid id, BudgetLineRequest r, CancellationToken ct)
    {
        if (!WireFormat.TryParseCategory(r.Category, out var c)) return Invalid("category", "Unknown category.");
        return RunAsync(actor, (p, _) => p.UpdateBudgetLine(id, c, r.Item, r.Amount ?? 0, r.Notes), ct);
    }

    public Task<Result<DashboardDto>> RemoveBudgetLineAsync(Actor actor, Guid id, CancellationToken ct) =>
        RunAsync(actor, (p, _) => p.RemoveBudgetLine(id), ct);

    // ------------------------------------------------------------------ research

    public Task<Result<DashboardDto>> UpsertWatchAsync(Actor actor, string ticker, WatchRequest r, CancellationToken ct) =>
        r.Price is null
            ? Invalid("price", "Price is required.")
            : RunAsync(actor, (p, _) => p.UpsertWatch(ticker, r.Name, r.Price.Value, r.Support ?? 0, r.Resistance ?? 0, r.Stance,
                r.Signals, r.Thesis, r.Plan, r.Series), ct);

    public Task<Result<DashboardDto>> RemoveWatchAsync(Actor actor, string ticker, CancellationToken ct) =>
        RunAsync(actor, (p, _) => p.RemoveWatch(ticker), ct);

    // ------------------------------------------------------------------ journal

    public async Task<Result<DashboardDto>> AddNoteAsync(Actor actor, NoteRequest r, CancellationToken ct)
    {
        var p = await LoadOrCreateAsync(actor.OwnerId, ct);
        var now = clock.GetUtcNow();
        try
        {
            store.Append(JournalNote.Create(p.Id, now, actor.Name, r.Text));
        }
        catch (DomainException ex)
        {
            return Result<DashboardDto>.Invalid(ex.Field, ex.Message);
        }

        store.Append(ActivityEvent.Create(p.Id, now, actor.Name, "Journal note added"));
        return await CommitAsync(actor, p, ct);
    }

    public async Task<Result<DashboardDto>> RemoveNoteAsync(Actor actor, long noteId, CancellationToken ct)
    {
        var p = await LoadOrCreateAsync(actor.OwnerId, ct);
        var note = await store.GetNoteAsync(p.Id, noteId, ct);
        if (note is null) return Result<DashboardDto>.NotFound();
        store.Remove(note);
        store.Append(ActivityEvent.Create(p.Id, clock.GetUtcNow(), actor.Name, "Journal note removed"));
        return await CommitAsync(actor, p, ct);
    }

    // ------------------------------------------------------------------ bulk

    public Task<Result<DashboardDto>> LoadSampleAsync(Actor actor, CancellationToken ct) =>
        RunManyAsync(actor, (p, now) =>
        {
            if (!p.IsEmpty) throw new DomainException("sample", "Sample data can only be loaded into an empty portfolio.");
            return SampleData.Apply(p, now);
        }, ct);

    public Task<Result<DashboardDto>> ImportLegacyAsync(Actor actor, System.Text.Json.JsonElement state, CancellationToken ct) =>
        RunManyAsync(actor, (p, now) =>
        {
            if (!p.IsEmpty) throw new DomainException("import", "Import only into an empty portfolio.");
            return LegacyImporter.Apply(p, state, now, store);
        }, ct);

    // ------------------------------------------------------------------ pipeline

    private Task<Result<DashboardDto>> RunAsync(Actor actor, Func<Portfolio, DateTimeOffset, Change?> command, CancellationToken ct) =>
        RunManyAsync(actor, (p, now) => command(p, now) is { } c ? [c] : null, ct);

    private async Task<Result<DashboardDto>> RunManyAsync(
        Actor actor, Func<Portfolio, DateTimeOffset, IReadOnlyList<Change>?> command, CancellationToken ct)
    {
        var p = await LoadOrCreateAsync(actor.OwnerId, ct);
        var now = clock.GetUtcNow();

        IReadOnlyList<Change>? changes;
        try
        {
            changes = command(p, now);
        }
        catch (DomainException ex)
        {
            return Result<DashboardDto>.Invalid(ex.Field, ex.Message);
        }

        if (changes is null) return Result<DashboardDto>.NotFound();

        foreach (var c in changes)
        {
            if (c.Ledger is { } l) store.Append(l.By(actor.Name));
            if (c.Fx is { } f) store.Append(f);
            store.Append(ActivityEvent.Create(p.Id, now, actor.Name, c.Summary));
        }

        await RefreshSnapshotAsync(p, now, ct);
        return await CommitAsync(actor, p, ct);
    }

    private async Task<Result<DashboardDto>> CommitAsync(Actor actor, Portfolio p, CancellationToken ct)
    {
        try
        {
            await store.SaveChangesAsync(ct);
        }
        catch (ConcurrencyConflictException)
        {
            return Result<DashboardDto>.Conflict("Your portfolio changed in another window. Refresh and try again.");
        }

        notifier.Publish(actor.OwnerId, p.Version);
        return Result<DashboardDto>.Ok(WireFormat.ToDashboard(p, await store.GetHistoryAsync(p.Id, ct)));
    }

    private async Task RefreshSnapshotAsync(Portfolio p, DateTimeOffset now, CancellationToken ct)
    {
        var month = now.ToString("yyyy-MM", CultureInfo.InvariantCulture);
        var snapshot = await store.GetSnapshotAsync(p.Id, month, ct);
        if (snapshot is null)
        {
            snapshot = NetWorthSnapshot.Create(p.Id, month);
            store.Add(snapshot);
        }

        snapshot.Set(p.Value());
    }

    private async Task<Portfolio> LoadOrCreateAsync(string ownerId, CancellationToken ct)
    {
        var p = await store.GetAsync(ownerId, ct);
        if (p is not null) return p;
        p = Portfolio.Create(ownerId, clock.GetUtcNow());
        store.Add(p);
        store.Append(FxQuote.Create(p.Id, clock.GetUtcNow(), p.FxRate, "default"));
        await store.SaveChangesAsync(ct);
        return p;
    }

    private static Task<Result<DashboardDto>> Invalid(string field, string message) =>
        Task.FromResult(Result<DashboardDto>.Invalid(field, message));
}
