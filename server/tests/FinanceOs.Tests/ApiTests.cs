using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace FinanceOs.Tests;

public sealed class ApiTests(AppFactory factory) : IClassFixture<AppFactory>
{
    private static async Task<JsonElement> Json(HttpResponseMessage res)
    {
        Assert.True(res.IsSuccessStatusCode, $"{(int)res.StatusCode}: {await res.Content.ReadAsStringAsync()}");
        return await res.Content.ReadFromJsonAsync<JsonElement>();
    }

    // ------------------------------------------------------------------ OWASP A01: access control

    [Fact]
    public async Task Anonymous_reads_are_rejected() =>
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.Browser().GetAsync("/api/portfolio")).StatusCode);

    [Fact]
    public async Task Each_user_sees_only_their_own_portfolio()
    {
        var alice = await factory.SignedInAsync();
        var bob = await factory.SignedInAsync();
        await Json(await alice.PostAsync("/api/portfolio/sample", null));

        var bobs = await Json(await bob.GetAsync("/api/portfolio"));
        Assert.Equal(0, bobs.GetProperty("holdings").GetArrayLength());
        Assert.Equal(0m, bobs.GetProperty("valuation").GetProperty("netWorth").GetDecimal());
    }

    [Fact]
    public async Task Csrf_header_is_required_for_cookie_writes()
    {
        var client = await factory.SignedInAsync();
        client.DefaultRequestHeaders.Remove("X-Finance-Client");
        var res = await client.PutAsJsonAsync("/api/balances", new { ngnCash = 1000 });
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task Cross_origin_cookie_write_is_rejected()
    {
        var client = await factory.SignedInAsync();
        using var req = new HttpRequestMessage(HttpMethod.Put, "/api/balances") { Content = JsonContent.Create(new { ngnCash = 1 }) };
        req.Headers.Add("Origin", "https://evil.example");
        Assert.Equal(HttpStatusCode.Forbidden, (await client.SendAsync(req)).StatusCode);
    }

    [Fact]
    public async Task Write_key_can_trade_and_is_named_as_the_actor()
    {
        var owner = await factory.SignedInAsync();
        var agent = await factory.KeyClientAsync(owner, readOnly: false);

        await Json(await agent.PutAsJsonAsync("/api/balances", new { ngnCash = 100_000 }));
        var dash = await Json(await agent.PostAsJsonAsync("/api/trades", new { side = "buy", ticker = "UCAP", market = "NGX", units = 100, price = 17.5 }));

        Assert.Equal("key:agent", dash.GetProperty("ledger")[0].GetProperty("actor").GetString());
        Assert.Equal(98_250m, dash.GetProperty("valuation").GetProperty("ngnCash").GetDecimal());
    }

    [Fact]
    public async Task Read_only_key_can_read_but_not_write()
    {
        var owner = await factory.SignedInAsync();
        var reader = await factory.KeyClientAsync(owner, readOnly: true);

        Assert.Equal(HttpStatusCode.OK, (await reader.GetAsync("/api/portfolio")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await reader.PutAsJsonAsync("/api/balances", new { ngnCash = 5 })).StatusCode);
    }

    [Fact]
    public async Task Keys_cannot_create_or_list_keys()
    {
        var owner = await factory.SignedInAsync();
        var agent = await factory.KeyClientAsync(owner, readOnly: false);
        Assert.Equal(HttpStatusCode.Forbidden, (await agent.PostAsJsonAsync("/api/keys", new { name = "escalate" })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await agent.GetAsync("/api/keys")).StatusCode);
    }

    [Fact]
    public async Task Revoked_and_bogus_keys_are_rejected()
    {
        var owner = await factory.SignedInAsync();
        var agent = await factory.KeyClientAsync(owner, readOnly: false);
        var keys = await Json(await owner.GetAsync("/api/keys"));
        await owner.DeleteAsync($"/api/keys/{keys[0].GetProperty("id").GetGuid()}");

        Assert.Equal(HttpStatusCode.Unauthorized, (await agent.GetAsync("/api/portfolio")).StatusCode);

        var bogus = factory.CreateClient();
        bogus.DefaultRequestHeaders.Add("Authorization", "Bearer fos_not-a-real-key-000000000000");
        Assert.Equal(HttpStatusCode.Unauthorized, (await bogus.GetAsync("/api/portfolio")).StatusCode);
    }

    [Fact]
    public async Task Key_secret_is_returned_once_and_never_listed()
    {
        var owner = await factory.SignedInAsync();
        var created = await Json(await owner.PostAsJsonAsync("/api/keys", new { name = "once" }));
        var secret = created.GetProperty("secret").GetString()!;
        var list = await owner.GetStringAsync("/api/keys");
        Assert.DoesNotContain(secret, list, StringComparison.Ordinal);
        Assert.StartsWith("fos_", secret, StringComparison.Ordinal);
    }

    // ------------------------------------------------------------------ OWASP A03 / API6: input

    [Fact]
    public async Task Unknown_json_fields_are_rejected()
    {
        var client = await factory.SignedInAsync();
        var body = new StringContent("""{"ngnCash":1,"ownerId":"someone-else"}""", Encoding.UTF8, "application/json");
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsync("/api/balances", body)).StatusCode);
    }

    [Theory]
    [InlineData("""{"side":"short","ticker":"UCAP","units":1,"price":1}""", "side")]
    [InlineData("""{"side":"buy","ticker":"<x>","units":1,"price":1}""", "ticker")]
    [InlineData("""{"side":"buy","ticker":"UCAP","units":-5,"price":1}""", "units")]
    [InlineData("""{"side":"buy","ticker":"UCAP","units":1,"price":0}""", "price")]
    [InlineData("""{"side":"buy","ticker":"UCAP","market":"LSE","units":1,"price":1}""", "market")]
    public async Task Invalid_trades_return_field_errors(string json, string field)
    {
        var client = await factory.SignedInAsync();
        var res = await client.PostAsync("/api/trades", new StringContent(json, Encoding.UTF8, "application/json"));
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
        Assert.True((await res.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").TryGetProperty(field, out _));
    }

    [Fact]
    public async Task Malformed_json_is_a_400_not_a_500()
    {
        var client = await factory.SignedInAsync();
        var res = await client.PostAsync("/api/trades", new StringContent("{not json", Encoding.UTF8, "application/json"));
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    // ------------------------------------------------------------------ OWASP A05 / A07

    [Fact]
    public async Task Security_headers_are_set_and_server_is_hidden()
    {
        var res = await factory.Browser().GetAsync("/healthz");
        Assert.Contains("default-src 'self'", res.Headers.GetValues("Content-Security-Policy").Single(), StringComparison.Ordinal);
        Assert.Equal("nosniff", res.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.False(res.Headers.Contains("Server"));
    }

    [Fact]
    public async Task Api_responses_are_never_cached()
    {
        var client = await factory.SignedInAsync();
        Assert.True((await client.GetAsync("/api/portfolio")).Headers.CacheControl?.NoStore);
    }

    [Fact]
    public async Task Login_errors_do_not_reveal_whether_the_account_exists()
    {
        var email = $"x-{Guid.NewGuid():N}@example.test";
        await factory.SignedInAsync(email);
        var c = factory.Browser();
        var unknown = await c.PostAsJsonAsync("/api/auth/login", new { email = "nobody@example.test", password = "whatever password" });
        var wrong = await c.PostAsJsonAsync("/api/auth/login", new { email, password = "wrong password!!" });
        Assert.Equal(HttpStatusCode.Unauthorized, unknown.StatusCode);
        Assert.Equal(
            (await unknown.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("detail").GetString(),
            (await wrong.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("detail").GetString());
    }

    // ------------------------------------------------------------------ behaviour

    [Fact]
    public async Task Trade_fx_and_conversion_flow_keeps_books_consistent()
    {
        var c = await factory.SignedInAsync();
        await Json(await c.PutAsJsonAsync("/api/balances", new { ngnCash = 1_000_000 }));
        await Json(await c.PostAsJsonAsync("/api/fx", new { rate = 1500, source = "test" }));
        await Json(await c.PostAsJsonAsync("/api/usd/fund", new { usd = 200, feeNgn = 1000 }));
        await Json(await c.PostAsJsonAsync("/api/trades", new { side = "buy", ticker = "VOO", market = "US", units = 0.2, price = 500 }));
        var d = await Json(await c.PostAsJsonAsync("/api/usd/convert", new { usd = 50 }));

        var v = d.GetProperty("valuation");
        Assert.Equal(1_000_000m - 301_000m + 75_000m, v.GetProperty("ngnCash").GetDecimal());
        Assert.Equal(200m - 100m - 1.5m - 50m, v.GetProperty("usdCash").GetDecimal());
        Assert.Equal(1505m, v.GetProperty("avgUsdCost").GetDecimal());
        Assert.Equal(4, d.GetProperty("ledger").GetArrayLength()); // adjustment, fund, buy, convert (FX has no ledger line)
        Assert.Single(d.GetProperty("netWorthHistory").EnumerateArray());
    }

    [Fact]
    public async Task Rejected_trade_returns_message_and_leaves_state_unchanged()
    {
        var c = await factory.SignedInAsync();
        await Json(await c.PutAsJsonAsync("/api/balances", new { ngnCash = 100 }));
        var res = await c.PostAsJsonAsync("/api/trades", new { side = "buy", ticker = "UCAP", units = 10, price = 17 });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);

        var d = await Json(await c.GetAsync("/api/portfolio"));
        Assert.Equal(0, d.GetProperty("holdings").GetArrayLength());
        Assert.Equal(100m, d.GetProperty("valuation").GetProperty("ngnCash").GetDecimal());
    }

    [Fact]
    public async Task Sample_data_loads_only_into_an_empty_portfolio()
    {
        var c = await factory.SignedInAsync();
        var d = await Json(await c.PostAsync("/api/portfolio/sample", null));
        Assert.Equal(4, d.GetProperty("holdings").GetArrayLength());
        Assert.Equal(6, d.GetProperty("watchlist").GetArrayLength());
        Assert.Equal(HttpStatusCode.BadRequest, (await c.PostAsync("/api/portfolio/sample", null)).StatusCode);
    }

    [Fact]
    public async Task Legacy_v1_state_imports_balances_positions_budget_and_history()
    {
        var c = await factory.SignedInAsync();
        var legacy = """
        {"settings":{"cash":640000,"liabilities":0,"fx":1500,"usd_cash":12.5,"usd_funded":100,"ngn_spent":150000,"fee":0.015},
         "holdings":[{"ticker":"UCAP","name":"United Capital","class":"NGX","units":1455,"avg":17.68,"price":17.05,"ccy":"NGN","strategy":"div"},
                     {"ticker":"VOO","name":"Vanguard","class":"US","units":0.02,"avg":490,"price":505,"ccy":"USD","strategy":""}],
         "cashflow":[{"id":1,"category":"INCOME","item":"Salary","amount":250000,"notes":""}],
         "networth":[{"month":"Sep 2026","cash":640000,"investments":30000,"liabilities":0}],
         "trades":[{"id":1,"ts":"2026-09-15T12:00:00Z","action":"BUY","ticker":"UCAP","units":920,"price":17,"note":"thesis"}],
         "insights":[{"id":1,"ts":"2026-09-16T12:00:00Z","author":"system","text":"Hello"}],
         "events":[],"fxrates":[{"id":1,"ts":"2026-09-01T00:00:00Z","rate":1490,"source":"seed"}]}
        """;
        var d = await Json(await c.PostAsync("/api/import/legacy", new StringContent(legacy, Encoding.UTF8, "application/json")));

        Assert.Equal(2, d.GetProperty("holdings").GetArrayLength());
        Assert.Equal(12.5m, d.GetProperty("valuation").GetProperty("usdCash").GetDecimal());
        Assert.Equal(1500m, d.GetProperty("valuation").GetProperty("avgUsdCost").GetDecimal());
        Assert.Contains(d.GetProperty("netWorthHistory").EnumerateArray(), s => s.GetProperty("month").GetString() == "2026-09");
        Assert.Contains(d.GetProperty("notes").EnumerateArray(), n => n.GetProperty("text").GetString() == "Hello");
    }

    [Fact]
    public async Task Stream_requires_authentication() =>
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.Browser().GetAsync("/api/stream")).StatusCode);
}
