using System.Net.ServerSentEvents;
using System.Runtime.CompilerServices;
using System.Security.Claims;
using System.Text.Json;
using FinanceOs.Api.Security;
using FinanceOs.Application;
using FinanceOs.Application.Common;
using FinanceOs.Infrastructure.ApiKeys;
using FinanceOs.Infrastructure.Realtime;
using Microsoft.AspNetCore.Http.HttpResults;

namespace FinanceOs.Api.Endpoints;

/// <summary>
/// Owner id and actor always come from the authenticated principal (cookie or API key), never from the
/// request (OWASP A01). Reads need any identity; writes need the "write" policy, which read-only keys fail.
/// </summary>
internal static class PortfolioEndpoints
{
    public const string WritePolicy = "write";

    public static void MapPortfolioEndpoints(this IEndpointRouteBuilder app)
    {
        var read = app.MapGroup("/api").RequireAuthorization().WithTags("Portfolio");
        var write = app.MapGroup("/api").RequireAuthorization(WritePolicy).WithTags("Portfolio");

        read.MapGet("/portfolio", (ClaimsPrincipal u, PortfolioService s, CancellationToken ct) => s.GetDashboardAsync(u.OwnerId(), ct));

        // Investments
        write.MapPost("/trades", async (TradeRequest body, ClaimsPrincipal u, PortfolioService s, CancellationToken ct) =>
            ToHttp(await s.TradeAsync(Actor(u), body, ct)));
        write.MapPut("/holdings/{ticker}", async (string ticker, HoldingRequest body, ClaimsPrincipal u, PortfolioService s, CancellationToken ct) =>
            ToHttp(await s.UpsertHoldingAsync(Actor(u), ticker, body, ct)));
        write.MapDelete("/holdings/{ticker}", async (string ticker, ClaimsPrincipal u, PortfolioService s, CancellationToken ct) =>
            ToHttp(await s.RemoveHoldingAsync(Actor(u), ticker, ct)));
        write.MapPost("/prices", async (PricesRequest body, ClaimsPrincipal u, PortfolioService s, CancellationToken ct) =>
            ToHttp(await s.UpdatePricesAsync(Actor(u), body, ct)));

        // Treasury
        write.MapPost("/fx", async (FxRequest body, ClaimsPrincipal u, PortfolioService s, CancellationToken ct) =>
            ToHttp(await s.SetFxAsync(Actor(u), body, ct)));
        write.MapPost("/usd/fund", async (FundUsdRequest body, ClaimsPrincipal u, PortfolioService s, CancellationToken ct) =>
            ToHttp(await s.FundUsdAsync(Actor(u), body, ct)));
        write.MapPost("/usd/convert", async (ConvertUsdRequest body, ClaimsPrincipal u, PortfolioService s, CancellationToken ct) =>
            ToHttp(await s.ConvertUsdAsync(Actor(u), body, ct)));
        write.MapPut("/balances", async (BalancesRequest body, ClaimsPrincipal u, PortfolioService s, CancellationToken ct) =>
            ToHttp(await s.SetBalancesAsync(Actor(u), body, ct)));
        write.MapPut("/settings", async (SettingsRequest body, ClaimsPrincipal u, PortfolioService s, CancellationToken ct) =>
            ToHttp(await s.UpdateSettingsAsync(Actor(u), body, ct)));

        // Budget
        write.MapPost("/budget", async (BudgetLineRequest body, ClaimsPrincipal u, PortfolioService s, CancellationToken ct) =>
            ToHttp(await s.AddBudgetLineAsync(Actor(u), body, ct)));
        write.MapPut("/budget/{id:guid}", async (Guid id, BudgetLineRequest body, ClaimsPrincipal u, PortfolioService s, CancellationToken ct) =>
            ToHttp(await s.UpdateBudgetLineAsync(Actor(u), id, body, ct)));
        write.MapDelete("/budget/{id:guid}", async (Guid id, ClaimsPrincipal u, PortfolioService s, CancellationToken ct) =>
            ToHttp(await s.RemoveBudgetLineAsync(Actor(u), id, ct)));

        // Research
        write.MapPut("/watchlist/{ticker}", async (string ticker, WatchRequest body, ClaimsPrincipal u, PortfolioService s, CancellationToken ct) =>
            ToHttp(await s.UpsertWatchAsync(Actor(u), ticker, body, ct)));
        write.MapDelete("/watchlist/{ticker}", async (string ticker, ClaimsPrincipal u, PortfolioService s, CancellationToken ct) =>
            ToHttp(await s.RemoveWatchAsync(Actor(u), ticker, ct)));

        // Journal
        write.MapPost("/notes", async (NoteRequest body, ClaimsPrincipal u, PortfolioService s, CancellationToken ct) =>
            ToHttp(await s.AddNoteAsync(Actor(u), body, ct)));
        write.MapDelete("/notes/{id:long}", async (long id, ClaimsPrincipal u, PortfolioService s, CancellationToken ct) =>
            ToHttp(await s.RemoveNoteAsync(Actor(u), id, ct)));

        // Bulk
        write.MapPost("/portfolio/sample", async (ClaimsPrincipal u, PortfolioService s, CancellationToken ct) =>
            ToHttp(await s.LoadSampleAsync(Actor(u), ct)));
        // Raw JSON on purpose: the v1 payload has its own shape, validated field-by-field by the importer.
        write.MapPost("/import/legacy", async (JsonElement body, ClaimsPrincipal u, PortfolioService s, CancellationToken ct) =>
            ToHttp(await s.ImportLegacyAsync(Actor(u), body, ct)));

        // Live updates (Server-Sent Events). Pushes only a version number; clients refetch via the API.
        read.MapGet("/stream", (ClaimsPrincipal u, ChangeHub hub, CancellationToken ct) =>
            hub.CanSubscribe(u.OwnerId())
                ? (IResult)TypedResults.ServerSentEvents(Stream(hub, u.OwnerId(), ct))
                : TypedResults.Problem(statusCode: StatusCodes.Status429TooManyRequests, title: "Too many open streams"))
            .DisableRateLimiting();

        // API keys — browser session only: a key can never mint or revoke keys.
        var keys = app.MapGroup("/api/keys").RequireAuthorization(KeysPolicy).WithTags("API keys");
        keys.MapGet("/", (ClaimsPrincipal u, ApiKeyService svc, CancellationToken ct) => svc.ListAsync(u.OwnerId(), ct));
        keys.MapPost("/", async Task<Results<Ok<CreatedApiKeyDto>, ValidationProblem>> (CreateKeyRequest body, ClaimsPrincipal u, ApiKeyService svc, CancellationToken ct) =>
        {
            var (created, error) = await svc.CreateAsync(u.OwnerId(), body.Name, body.ReadOnly ?? false, ct);
            return created is null
                ? TypedResults.ValidationProblem(new Dictionary<string, string[]> { ["name"] = [error!] })
                : TypedResults.Ok(created);
        });
        keys.MapDelete("/{id:guid}", async Task<Results<NoContent, NotFound>> (Guid id, ClaimsPrincipal u, ApiKeyService svc, CancellationToken ct) =>
            await svc.RevokeAsync(u.OwnerId(), id, ct) ? TypedResults.NoContent() : TypedResults.NotFound());
    }

    public const string KeysPolicy = "browser-session";

    public sealed record CreateKeyRequest(string? Name, bool? ReadOnly);

    private static async IAsyncEnumerable<SseItem<string>> Stream(ChangeHub hub, string ownerId, [EnumeratorCancellation] CancellationToken ct)
    {
        yield return new SseItem<string>("ready", "ready") { ReconnectionInterval = TimeSpan.FromSeconds(3) };
        await foreach (var version in hub.Subscribe(ownerId, ct))
        {
            yield return version < 0 ? new SseItem<string>("", "ping") : new SseItem<string>(version.ToString(System.Globalization.CultureInfo.InvariantCulture), "change");
        }
    }

    private static Actor Actor(ClaimsPrincipal u) => new(u.OwnerId(), u.ActorName());

    private static IResult ToHttp(Result<DashboardDto> r) => r.Error switch
    {
        ErrorKind.None => TypedResults.Ok(r.Value),
        ErrorKind.NotFound => TypedResults.NotFound(),
        ErrorKind.Conflict => TypedResults.Problem(statusCode: StatusCodes.Status409Conflict, title: "Conflict", detail: r.Detail),
        _ => TypedResults.ValidationProblem(r.Errors!),
    };
}
