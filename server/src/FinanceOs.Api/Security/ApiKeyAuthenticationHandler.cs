using System.Security.Claims;
using System.Text.Encodings.Web;
using FinanceOs.Infrastructure.ApiKeys;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace FinanceOs.Api.Security;

/// <summary>Authenticates <c>Authorization: Bearer fos_…</c> personal access keys.</summary>
internal sealed class ApiKeyAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    ApiKeyService keys)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "ApiKey";

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var header = Request.Headers.Authorization.ToString();
        if (!header.StartsWith("Bearer ", StringComparison.Ordinal)) return AuthenticateResult.NoResult();

        var identity = await keys.ValidateAsync(header["Bearer ".Length..].Trim(), Context.RequestAborted);
        if (identity is null) return AuthenticateResult.Fail("Invalid API key.");

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, identity.OwnerId),
            new Claim(Claims.Actor, $"key:{identity.Name}"),
            new Claim(Claims.Scope, identity.ReadOnly ? "read" : "write"),
        };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, SchemeName));
        return AuthenticateResult.Success(new AuthenticationTicket(principal, SchemeName));
    }
}

internal static class Claims
{
    public const string Actor = "fos:actor";
    public const string Scope = "fos:scope";
    public const string DisplayName = "fos:display_name";
}
