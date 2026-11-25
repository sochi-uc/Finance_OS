using System.Security.Cryptography;
using System.Text;
using FinanceOs.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FinanceOs.Infrastructure.ApiKeys;

/// <summary>
/// Personal access key for scripts and AI agents. Only a SHA-256 hash is stored; the secret is shown once.
/// Replaces v1's single shared <c>API_TOKEN</c> and spoofable <c>x-actor</c> header: each key has a name
/// (which becomes the actor on every ledger line), an optional read-only scope, and can be revoked alone.
/// </summary>
public sealed class ApiKey
{
    public Guid Id { get; set; }
    public string OwnerId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Prefix { get; set; } = string.Empty;
    public byte[] Hash { get; set; } = [];
    public bool ReadOnly { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? LastUsedAt { get; set; }
}

public sealed record ApiKeyDto(Guid Id, string Name, string Prefix, bool ReadOnly, DateTimeOffset CreatedAt, DateTimeOffset? LastUsedAt);

public sealed record CreatedApiKeyDto(ApiKeyDto Key, string Secret);

public sealed record ApiKeyIdentity(string OwnerId, string Name, bool ReadOnly);

public sealed class ApiKeyService(FinanceDbContext db, TimeProvider clock)
{
    public const string TokenPrefix = "fos_";
    public const int MaxKeysPerUser = 10;
    private const int PrefixLength = 12;

    public async Task<IReadOnlyList<ApiKeyDto>> ListAsync(string ownerId, CancellationToken ct) =>
        (await db.ApiKeys.Where(k => k.OwnerId == ownerId).ToListAsync(ct))
            .OrderByDescending(k => k.CreatedAt)
            .Select(ToDto)
            .ToList();

    public async Task<(CreatedApiKeyDto? Created, string? Error)> CreateAsync(string ownerId, string? name, bool readOnly, CancellationToken ct)
    {
        var trimmed = (name ?? string.Empty).Trim();
        if (trimmed.Length is 0 or > 40) return (null, "Name must be 1–40 characters.");
        if (await db.ApiKeys.CountAsync(k => k.OwnerId == ownerId, ct) >= MaxKeysPerUser)
            return (null, $"You can have at most {MaxKeysPerUser} keys. Revoke one first.");

        var secret = TokenPrefix + Convert.ToBase64String(RandomNumberGenerator.GetBytes(30)).TrimEnd('=').Replace('+', '-').Replace('/', '_');
        var key = new ApiKey
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId,
            Name = trimmed,
            Prefix = secret[..PrefixLength],
            Hash = SHA256.HashData(Encoding.UTF8.GetBytes(secret)),
            ReadOnly = readOnly,
            CreatedAt = clock.GetUtcNow(),
        };
        db.ApiKeys.Add(key);
        await db.SaveChangesAsync(ct);
        return (new CreatedApiKeyDto(ToDto(key), secret), null);
    }

    public async Task<bool> RevokeAsync(string ownerId, Guid id, CancellationToken ct)
    {
        var key = await db.ApiKeys.SingleOrDefaultAsync(k => k.OwnerId == ownerId && k.Id == id, ct);
        if (key is null) return false;
        db.ApiKeys.Remove(key);
        await db.SaveChangesAsync(ct);
        return true;
    }

    /// <summary>Constant-time verification. Returns null for anything that isn't a live key.</summary>
    public async Task<ApiKeyIdentity?> ValidateAsync(string? secret, CancellationToken ct)
    {
        if (secret is null || !secret.StartsWith(TokenPrefix, StringComparison.Ordinal) || secret.Length is < 20 or > 100) return null;
        var prefix = secret[..PrefixLength];
        var candidates = await db.ApiKeys.Where(k => k.Prefix == prefix).ToListAsync(ct);
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(secret));
        var key = candidates.FirstOrDefault(k => CryptographicOperations.FixedTimeEquals(k.Hash, hash));
        if (key is null) return null;

        // Record usage at most once a minute so authentication doesn't turn every read into a write.
        var now = clock.GetUtcNow();
        if (key.LastUsedAt is null || now - key.LastUsedAt > TimeSpan.FromMinutes(1))
        {
            key.LastUsedAt = now;
            await db.SaveChangesAsync(ct);
        }

        return new ApiKeyIdentity(key.OwnerId, key.Name, key.ReadOnly);
    }

    private static ApiKeyDto ToDto(ApiKey k) => new(k.Id, k.Name, k.Prefix + "…", k.ReadOnly, k.CreatedAt, k.LastUsedAt);
}
