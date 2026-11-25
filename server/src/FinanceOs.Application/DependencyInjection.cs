using Microsoft.Extensions.DependencyInjection;

namespace FinanceOs.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddScoped<PortfolioService>();
        return services;
    }
}
