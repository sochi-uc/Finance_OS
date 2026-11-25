using System.Collections.Concurrent;
using System.Runtime.CompilerServices;
using System.Threading.Channels;
using FinanceOs.Application;

namespace FinanceOs.Infrastructure.Realtime;

/// <summary>
/// In-process fan-out of "portfolio changed (version N)" to each owner's open streams. Only the version
/// number is pushed, never data; clients refetch through the authenticated API. Each subscriber has a
/// bounded, drop-oldest channel so a slow tab can't build up memory.
/// </summary>
public sealed class ChangeHub : IChangeNotifier
{
    private const int MaxStreamsPerOwner = 8;
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<Guid, Channel<int>>> _subs = new();

    public void Publish(string ownerId, int version)
    {
        if (!_subs.TryGetValue(ownerId, out var streams)) return;
        foreach (var channel in streams.Values) channel.Writer.TryWrite(version);
    }

    public bool CanSubscribe(string ownerId) =>
        !_subs.TryGetValue(ownerId, out var streams) || streams.Count < MaxStreamsPerOwner;

    public async IAsyncEnumerable<int> Subscribe(string ownerId, [EnumeratorCancellation] CancellationToken ct)
    {
        var id = Guid.NewGuid();
        var channel = Channel.CreateBounded<int>(new BoundedChannelOptions(4) { FullMode = BoundedChannelFullMode.DropOldest });
        var streams = _subs.GetOrAdd(ownerId, _ => new ConcurrentDictionary<Guid, Channel<int>>());
        streams[id] = channel;
        try
        {
            while (!ct.IsCancellationRequested)
            {
                // Heartbeat (-1) every 25 s keeps proxies from closing an idle stream.
                using var beat = CancellationTokenSource.CreateLinkedTokenSource(ct);
                beat.CancelAfter(TimeSpan.FromSeconds(25));
                bool ready;
                try
                {
                    ready = await channel.Reader.WaitToReadAsync(beat.Token);
                }
                catch (OperationCanceledException) when (!ct.IsCancellationRequested)
                {
                    ready = false;
                }

                if (ct.IsCancellationRequested) yield break;
                if (!ready)
                {
                    yield return -1;
                    continue;
                }

                while (channel.Reader.TryRead(out var version)) yield return version;
            }
        }
        finally
        {
            streams.TryRemove(id, out _);
            if (streams.IsEmpty) _subs.TryRemove(ownerId, out _);
        }
    }
}
