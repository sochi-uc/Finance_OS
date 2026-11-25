namespace FinanceOs.Application.Common;

public enum ErrorKind
{
    None,
    NotFound,
    Validation,
    Conflict,
}

/// <summary>Use-case outcome; keeps HTTP out of the application layer.</summary>
public sealed record Result<T>(T? Value, ErrorKind Error, IReadOnlyDictionary<string, string[]>? Errors = null, string? Detail = null)
{
    public bool IsSuccess => Error == ErrorKind.None;

    public static Result<T> Ok(T value) => new(value, ErrorKind.None);
    public static Result<T> NotFound() => new(default, ErrorKind.NotFound);
    public static Result<T> Conflict(string detail) => new(default, ErrorKind.Conflict, Detail: detail);

    public static Result<T> Invalid(string field, string message) =>
        new(default, ErrorKind.Validation, new Dictionary<string, string[]> { [field] = [message] });
}

/// <summary>Raised by the store when another request changed the portfolio first.</summary>
public sealed class ConcurrencyConflictException(Exception inner)
    : Exception("The portfolio was changed by another request.", inner);
