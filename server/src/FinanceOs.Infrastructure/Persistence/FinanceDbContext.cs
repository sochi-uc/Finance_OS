using System.Globalization;
using FinanceOs.Domain.Portfolios;
using FinanceOs.Infrastructure.ApiKeys;
using FinanceOs.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace FinanceOs.Infrastructure.Persistence;

public sealed class FinanceDbContext(DbContextOptions<FinanceDbContext> options) : IdentityDbContext<AppUser>(options)
{
    public DbSet<Portfolio> Portfolios => Set<Portfolio>();
    public DbSet<LedgerEntry> Ledger => Set<LedgerEntry>();
    public DbSet<ActivityEvent> Activity => Set<ActivityEvent>();
    public DbSet<JournalNote> Notes => Set<JournalNote>();
    public DbSet<FxQuote> FxQuotes => Set<FxQuote>();
    public DbSet<NetWorthSnapshot> Snapshots => Set<NetWorthSnapshot>();
    public DbSet<ApiKey> ApiKeys => Set<ApiKey>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        var b = builder;
        b.Entity<AppUser>(u => u.Property(x => x.DisplayName).HasMaxLength(60));

        b.Entity<Portfolio>(p =>
        {
            p.ToTable("Portfolios");
            p.HasKey(x => x.Id);
            p.Property(x => x.OwnerId).IsRequired().HasMaxLength(450);
            p.HasIndex(x => x.OwnerId).IsUnique();
            p.HasOne<AppUser>().WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Cascade);

            // Optimistic concurrency: UPDATE … WHERE Version = @original. A racing write affects 0 rows and fails.
            p.Property(x => x.Version).IsConcurrencyToken();

            p.OwnsMany(x => x.Holdings, h =>
            {
                h.ToTable("Holdings");
                h.WithOwner().HasForeignKey("PortfolioId");
                h.HasKey("PortfolioId", nameof(Holding.Ticker));
                h.Property(x => x.Ticker).HasMaxLength(15);
                h.Property(x => x.Name).IsRequired().HasMaxLength(Rules.NameMax);
                h.Property(x => x.Strategy).IsRequired().HasMaxLength(Rules.StrategyMax);
                h.Ignore(x => x.Currency);
                h.Ignore(x => x.MarketValue);
                h.Ignore(x => x.CostBasis);
            });
            p.Navigation(x => x.Holdings).UsePropertyAccessMode(PropertyAccessMode.Field);

            p.OwnsMany(x => x.Budget, l =>
            {
                l.ToTable("BudgetLines");
                l.WithOwner().HasForeignKey("PortfolioId");
                l.HasKey(x => x.Id);
                l.Property(x => x.Id).ValueGeneratedNever(); // client-set keys must INSERT, not UPDATE
                l.Property(x => x.Item).IsRequired().HasMaxLength(Rules.NameMax);
                l.Property(x => x.Notes).IsRequired().HasMaxLength(Rules.StrategyMax);
            });
            p.Navigation(x => x.Budget).UsePropertyAccessMode(PropertyAccessMode.Field);

            p.OwnsMany(x => x.Watchlist, w =>
            {
                w.ToTable("Watchlist");
                w.WithOwner().HasForeignKey("PortfolioId");
                w.HasKey("PortfolioId", nameof(WatchItem.Ticker));
                w.Property(x => x.Ticker).HasMaxLength(15);
                w.Property(x => x.Name).IsRequired().HasMaxLength(Rules.NameMax);
                w.Property(x => x.Thesis).IsRequired().HasMaxLength(Rules.JournalMax);
                w.Property(x => x.Series)
                    .HasConversion(
                        v => string.Join(';', v.Select(d => d.ToString(CultureInfo.InvariantCulture))),
                        s => s.Length == 0 ? new List<decimal>() : s.Split(';', StringSplitOptions.None).Select(x => decimal.Parse(x, CultureInfo.InvariantCulture)).ToList(),
                        new ValueComparer<List<decimal>>((a, c) => a!.SequenceEqual(c!), v => v.Aggregate(0, (h, d) => HashCode.Combine(h, d)), v => v.ToList()));
            });
            p.Navigation(x => x.Watchlist).UsePropertyAccessMode(PropertyAccessMode.Field);
        });

        b.Entity<LedgerEntry>(e =>
        {
            e.ToTable("Ledger");
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.PortfolioId);
            e.Property(x => x.Ticker).HasMaxLength(15);
            e.Property(x => x.Note).IsRequired().HasMaxLength(Rules.NoteMax);
            e.Property(x => x.Actor).IsRequired().HasMaxLength(64);
            e.HasOne<Portfolio>().WithMany().HasForeignKey(x => x.PortfolioId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<ActivityEvent>(e =>
        {
            e.ToTable("Activity");
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.PortfolioId);
            e.Property(x => x.Actor).IsRequired().HasMaxLength(64);
            e.Property(x => x.Summary).IsRequired().HasMaxLength(300);
            e.HasOne<Portfolio>().WithMany().HasForeignKey(x => x.PortfolioId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<JournalNote>(e =>
        {
            e.ToTable("Notes");
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.PortfolioId);
            e.Property(x => x.Author).IsRequired().HasMaxLength(64);
            e.Property(x => x.Text).IsRequired().HasMaxLength(Rules.JournalMax);
            e.HasOne<Portfolio>().WithMany().HasForeignKey(x => x.PortfolioId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<FxQuote>(e =>
        {
            e.ToTable("FxQuotes");
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.PortfolioId);
            e.Property(x => x.Source).IsRequired().HasMaxLength(Rules.SourceMax);
            e.HasOne<Portfolio>().WithMany().HasForeignKey(x => x.PortfolioId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<NetWorthSnapshot>(e =>
        {
            e.ToTable("NetWorthSnapshots");
            e.HasKey(x => new { x.PortfolioId, x.Month });
            e.Property(x => x.Month).HasMaxLength(7);
            e.Ignore(x => x.NetWorth);
            e.HasOne<Portfolio>().WithMany().HasForeignKey(x => x.PortfolioId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<ApiKey>(e =>
        {
            e.ToTable("ApiKeys");
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Prefix);
            e.HasIndex(x => x.OwnerId);
            e.Property(x => x.Name).IsRequired().HasMaxLength(40);
            e.Property(x => x.Prefix).IsRequired().HasMaxLength(12);
            e.HasOne<AppUser>().WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
