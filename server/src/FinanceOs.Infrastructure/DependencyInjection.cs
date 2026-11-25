using FinanceOs.Application;
using FinanceOs.Infrastructure.ApiKeys;
using FinanceOs.Infrastructure.Identity;
using FinanceOs.Infrastructure.Persistence;
using FinanceOs.Infrastructure.Realtime;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FinanceOs.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connection = configuration.GetConnectionString("Finance")
            ?? throw new InvalidOperationException("Connection string 'Finance' is not configured.");

        services.AddDbContext<FinanceDbContext>(o => o.UseSqlite(connection));
        services.AddScoped<IPortfolioStore, PortfolioStore>();
        services.AddScoped<ApiKeyService>();
        services.AddSingleton<ChangeHub>();
        services.AddSingleton<IChangeNotifier>(sp => sp.GetRequiredService<ChangeHub>());

        // OWASP A07: Identity's PBKDF2 hashing + lockout; length-first passphrase policy (NIST SP 800-63B).
        services
            .AddIdentityCore<AppUser>(o =>
            {
                o.User.RequireUniqueEmail = true;
                o.Password.RequiredLength = 12;
                o.Password.RequireDigit = false;
                o.Password.RequireLowercase = false;
                o.Password.RequireUppercase = false;
                o.Password.RequireNonAlphanumeric = false;
                o.Password.RequiredUniqueChars = 4;
                o.Lockout.AllowedForNewUsers = true;
                o.Lockout.MaxFailedAccessAttempts = 5;
                o.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddSignInManager()
            .AddEntityFrameworkStores<FinanceDbContext>();

        return services;
    }
}
