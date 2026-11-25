using System.Security.Claims;
using FinanceOs.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace FinanceOs.Api.Security;

/// <summary>Adds the display name to the session cookie so the activity feed can name the actor without a DB hit.</summary>
internal sealed class AppClaimsFactory(UserManager<AppUser> users, IOptions<IdentityOptions> options)
    : UserClaimsPrincipalFactory<AppUser>(users, options)
{
    protected override async Task<ClaimsIdentity> GenerateClaimsAsync(AppUser user)
    {
        var identity = await base.GenerateClaimsAsync(user);
        identity.AddClaim(new Claim(Claims.DisplayName, user.DisplayName));
        return identity;
    }
}

internal static class PrincipalExtensions
{
    public static string OwnerId(this ClaimsPrincipal user) =>
        user.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new InvalidOperationException("No owner id on principal.");

    /// <summary>The owner's display name for a browser session, "key:&lt;name&gt;" for an API key.</summary>
    public static string ActorName(this ClaimsPrincipal user) =>
        user.FindFirstValue(Claims.Actor)
        ?? (user.FindFirstValue(Claims.DisplayName) is { Length: > 0 } name ? name : "you");
}
