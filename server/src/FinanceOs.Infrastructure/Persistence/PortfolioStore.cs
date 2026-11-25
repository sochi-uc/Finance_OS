using FinanceOs.Application;
using FinanceOs.Application.Common;
using FinanceOs.Domain.Portfolios;
using Microsoft.EntityFrameworkCore;

namespace FinanceOs.Infrastructure.Persistence;

internal sealed class PortfolioStore(FinanceDbContext db) : IPortfolioStore
{
    private const int LedgerTake = 100;
    private const int ActivityTake = 60;
    private const int NotesTake = 50;
    private const int FxTake = 120;

    public Task<Portfolio?> GetAsync(string ownerId, CancellationToken ct) =>
        db.Portfolios.AsSplitQuery().SingleOrDefaultAsync(p => p.OwnerId == ownerId, ct);

    public void Add(Portfolio portfolio) => db.Portfolios.Add(portfolio);
    public void Append(LedgerEntry entry) => db.Ledger.Add(entry);
    public void Append(FxQuote quote) => db.FxQuotes.Add(quote);
    public void Append(ActivityEvent activity) => db.Activity.Add(activity);
    public void Append(JournalNote note) => db.Notes.Add(note);
    public void Add(NetWorthSnapshot snapshot) => db.Snapshots.Add(snapshot);
    public void Remove(JournalNote note) => db.Notes.Remove(note);

    public Task<NetWorthSnapshot?> GetSnapshotAsync(Guid portfolioId, string month, CancellationToken ct) =>
        db.Snapshots.SingleOrDefaultAsync(s => s.PortfolioId == portfolioId && s.Month == month, ct);

    public Task<JournalNote?> GetNoteAsync(Guid portfolioId, long noteId, CancellationToken ct) =>
        db.Notes.SingleOrDefaultAsync(n => n.PortfolioId == portfolioId && n.Id == noteId, ct);

    public async Task<History> GetHistoryAsync(Guid portfolioId, CancellationToken ct)
    {
        // Read-only projections: no tracking, newest first, bounded.
        var ledger = await db.Ledger.AsNoTracking().Where(x => x.PortfolioId == portfolioId).OrderByDescending(x => x.Id).Take(LedgerTake).ToListAsync(ct);
        var activity = await db.Activity.AsNoTracking().Where(x => x.PortfolioId == portfolioId).OrderByDescending(x => x.Id).Take(ActivityTake).ToListAsync(ct);
        var notes = await db.Notes.AsNoTracking().Where(x => x.PortfolioId == portfolioId).OrderByDescending(x => x.Id).Take(NotesTake).ToListAsync(ct);
        var fx = await db.FxQuotes.AsNoTracking().Where(x => x.PortfolioId == portfolioId).OrderByDescending(x => x.Id).Take(FxTake).ToListAsync(ct);
        var snaps = await db.Snapshots.AsNoTracking().Where(x => x.PortfolioId == portfolioId).OrderBy(x => x.Month).ToListAsync(ct);
        fx.Reverse();
        return new History(ledger, activity, notes, fx, snaps);
    }

    public async Task SaveChangesAsync(CancellationToken ct)
    {
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            throw new ConcurrencyConflictException(ex);
        }
    }
}
