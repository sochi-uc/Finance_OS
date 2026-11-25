using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace FinanceOs.Tests;

/// <summary>Boots the real API (full middleware pipeline) against a throwaway SQLite file.</summary>
public sealed class AppFactory : WebApplicationFactory<Program>
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"fos-test-{Guid.NewGuid():N}.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting("ConnectionStrings:Finance", $"Data Source={_dbPath};Pooling=False");
        builder.UseSetting("RateLimiting:AuthPermitPerMinute", "1000");
    }

    /// <summary>Browser-like: keeps cookies and sends the CSRF header the SPA sends.</summary>
    public HttpClient Browser()
    {
        var client = CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true, AllowAutoRedirect = false });
        client.DefaultRequestHeaders.Add("X-Finance-Client", "web");
        return client;
    }

    public async Task<HttpClient> SignedInAsync(string? email = null)
    {
        var client = Browser();
        var res = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = email ?? $"u-{Guid.NewGuid():N}@example.test",
            password = "correct horse battery staple",
            displayName = "Ada",
        });
        res.EnsureSuccessStatusCode();
        return client;
    }

    /// <summary>A script-style client authenticated only by an API key (no cookies, no CSRF header).</summary>
    public async Task<HttpClient> KeyClientAsync(HttpClient owner, bool readOnly)
    {
        var res = await owner.PostAsJsonAsync("/api/keys", new { name = readOnly ? "reader" : "agent", readOnly });
        res.EnsureSuccessStatusCode();
        var secret = (await res.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("secret").GetString()!;
        var client = CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", secret);
        return client;
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        try { File.Delete(_dbPath); } catch (IOException) { }
    }
}
