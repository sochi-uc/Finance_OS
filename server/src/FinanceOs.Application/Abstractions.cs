using FinanceOs.Domain.Portfolios;

namespace FinanceOs.Application;

/// <summary>
/// Persistence port. The aggregate (balances, holdings, budget, research) is loaded whole; append-only
/// history (ledger, activity, FX quotes, notes, snapshots) is written alongside it and read with limits.
/// Every method is keyed by owner or by a portfolio already resolved from the owner (OWASP A01).
/// </summary>
public interface IPortfolioStore
{
    Task<Portfolio?> GetAsync(string ownerId, CancellationToken ct);
    void Add(Portfolio portfolio);

    void Append(LedgerEntry entry);
    void Append(FxQuote quote);
    void Append(ActivityEvent activity);
    void Append(JournalNote note);

    Task<NetWorthSnapshot?> GetSnapshotAsync(Guid portfolioId, string month, CancellationToken ct);
    void Add(NetWorthSnapshot snapshot);

    Task<JournalNote?> GetNoteAsync(Guid portfolioId, long noteId, CancellationToken ct);
    void Remove(JournalNote note);

    Task<History> GetHistoryAsync(Guid portfolioId, CancellationToken ct);

    /// <summary>Commits atomically. Throws <see cref="Common.ConcurrencyConflictException"/> on a lost race.</summary>
    Task SaveChangesAsync(CancellationToken ct);
}

public sealed record History(
    IReadOnlyList<LedgerEntry> Ledger,
    IReadOnlyList<ActivityEvent> Activity,
    IReadOnlyList<JournalNote> Notes,
    IReadOnlyList<FxQuote> Fx,
    IReadOnlyList<NetWorthSnapshot> Snapshots);

/// <summary>Pushes "something changed" to the owner's open sessions (Server-Sent Events).</summary>
public interface IChangeNotifier
{
    void Publish(string ownerId, int version);
}

/// <summary>Who performed a command: shown in the activity feed and on ledger entries.</summary>
public sealed record Actor(string OwnerId, string Name);
