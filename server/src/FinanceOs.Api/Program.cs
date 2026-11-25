using System.Security.Claims;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using FinanceOs.Api.Endpoints;
using FinanceOs.Api.Security;
using FinanceOs.Application;
using FinanceOs.Infrastructure;
using FinanceOs.Infrastructure.Identity;
using FinanceOs.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
var isDev = builder.Environment.IsDevelopment();

// --- Transport limits (OWASP A04/A05) -------------------------------------------------------------
builder.WebHost.ConfigureKestrel(k =>
{
    k.AddServerHeader = false;
    k.Limits.MaxRequestBodySize = 2 * 1024 * 1024; // the legacy import is the largest legitimate body
    k.Limits.MaxRequestHeadersTotalSize = 32 * 1024;
});

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddScoped<IUserClaimsPrincipalFactory<AppUser>, AppClaimsFactory>();

// --- JSON: unknown properties rejected (mass assignment, OWASP API6); bad bodies are 400s, never 500s ---
builder.Services.Configure<JsonOptions>(o =>
{
    o.SerializerOptions.UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow;
    o.SerializerOptions.MaxDepth = 32;
});
builder.Services.Configure<Microsoft.AspNetCore.Routing.RouteHandlerOptions>(o => o.ThrowOnBadRequest = false);

// --- Data Protection keys sign the session cookie; persisted, and encrypted at rest on Windows -----------
var dataDir = Path.Combine(builder.Environment.ContentRootPath, "App_Data");
Directory.CreateDirectory(dataDir);
var dp = builder.Services.AddDataProtection()
    .SetApplicationName("finance-os")
    .PersistKeysToFileSystem(new DirectoryInfo(Path.Combine(dataDir, "keys")));
if (OperatingSystem.IsWindows()) dp.ProtectKeysWithDpapi();

// --- Authentication: browser = HttpOnly SameSite=Strict cookie; scripts & agents = hashed API key ------
builder.Services
    .AddAuthentication(o =>
    {
        o.DefaultScheme = "smart";
        o.DefaultChallengeScheme = "smart";
    })
    .AddPolicyScheme("smart", "Cookie or API key", o =>
        o.ForwardDefaultSelector = ctx =>
            ctx.Request.Headers.Authorization.ToString().StartsWith("Bearer ", StringComparison.Ordinal)
                ? ApiKeyAuthenticationHandler.SchemeName
                : IdentityConstants.ApplicationScheme)
    .AddScheme<AuthenticationSchemeOptions, ApiKeyAuthenticationHandler>(ApiKeyAuthenticationHandler.SchemeName, null)
    .AddIdentityCookies();

builder.Services.ConfigureApplicationCookie(o =>
{
    o.Cookie.Name = isDev ? "fos.sid" : "__Host-fos";
    o.Cookie.HttpOnly = true;
    o.Cookie.SameSite = SameSiteMode.Strict;
    o.Cookie.SecurePolicy = isDev ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
    o.Cookie.Path = "/";
    o.ExpireTimeSpan = TimeSpan.FromHours(12);
    o.SlidingExpiration = true;
    o.Events.OnRedirectToLogin = ctx => { ctx.Response.StatusCode = StatusCodes.Status401Unauthorized; return Task.CompletedTask; };
    o.Events.OnRedirectToAccessDenied = ctx => { ctx.Response.StatusCode = StatusCodes.Status403Forbidden; return Task.CompletedTask; };
});
builder.Services.Configure<SecurityStampValidatorOptions>(o => o.ValidationInterval = TimeSpan.FromMinutes(5));

// --- Authorization: deny by default; read-only keys can't write; keys can't manage keys -----------------
builder.Services.AddAuthorizationBuilder()
    .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build())
    .AddPolicy(PortfolioEndpoints.WritePolicy, p => p.RequireAuthenticatedUser()
        .RequireAssertion(ctx => ctx.User.FindFirst(Claims.Scope)?.Value != "read"))
    .AddPolicy(PortfolioEndpoints.KeysPolicy, p => p.RequireAuthenticatedUser()
        .RequireAssertion(ctx => ctx.User.Identity?.AuthenticationType != ApiKeyAuthenticationHandler.SchemeName));

// --- Rate limiting: brute force on auth; abuse everywhere else ---------------------------------------------
var authPermit = builder.Configuration.GetValue("RateLimiting:AuthPermitPerMinute", 10);
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy(AuthEndpoints.RateLimitPolicy, ctx => RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = authPermit, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
    o.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx => RateLimitPartition.GetTokenBucketLimiter(
        ctx.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new TokenBucketRateLimiterOptions { TokenLimit = 120, TokensPerPeriod = 60, ReplenishmentPeriod = TimeSpan.FromSeconds(10), QueueLimit = 0 }));
});

builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks();
if (!isDev)
{
    builder.Services.AddHsts(o =>
    {
        o.MaxAge = TimeSpan.FromDays(365);
        o.IncludeSubDomains = true;
        o.Preload = true;
    });
}

var app = builder.Build();

if (app.Configuration.GetValue("Database:MigrateOnStartup", true))
{
    await using var scope = app.Services.CreateAsyncScope();
    await scope.ServiceProvider.GetRequiredService<FinanceDbContext>().Database.MigrateAsync();
}

// Behind a TLS-terminating proxy (Caddy, nginx, Cloudflare Tunnel) opt in so HTTPS, cookies, HSTS and
// rate limiting see the real scheme and client IP. Off by default: trusting these headers from the open
// internet would let anyone spoof their IP.
if (app.Configuration.GetValue("ForwardedHeaders:Enabled", false))
{
    var fh = new ForwardedHeadersOptions
    {
        ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto,
    };
    fh.KnownIPNetworks.Clear();
    fh.KnownProxies.Clear();
    app.UseForwardedHeaders(fh);
}

app.UseExceptionHandler();
app.UseStatusCodePages();
if (!isDev)
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseMiddleware<SecurityHeadersMiddleware>();

// Built SPA: hashed bundles immutable for a year; index.html always revalidated so deploys show up.
var spaFiles = new StaticFileOptions
{
    OnPrepareResponse = ctx => ctx.Context.Response.Headers.CacheControl =
        ctx.Context.Request.Path.StartsWithSegments("/assets")
            ? "public, max-age=31536000, immutable"
            : "no-cache",
};
app.UseDefaultFiles();
app.UseStaticFiles(spaFiles);

app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();
app.UseMiddleware<CsrfGuardMiddleware>();

app.MapHealthChecks("/healthz").AllowAnonymous().DisableRateLimiting();
app.MapAuthEndpoints();
app.MapPortfolioEndpoints();
app.MapFallback("/api/{**path}", () => Results.NotFound()).AllowAnonymous();
app.MapFallbackToFile("index.html", spaFiles).AllowAnonymous();

await app.RunAsync();

public partial class Program;
