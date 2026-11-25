namespace FinanceOs.Domain;

/// <summary>A business rule was violated. <see cref="Field"/> names the input that caused it.</summary>
public sealed class DomainException(string field, string message) : Exception(message)
{
    public string Field { get; } = field;
}
