/**
 * Finance OS · Decoupled API Client Module
 * Encapsulates all network communication, headers, error handling, and SSE subscriptions.
 */

export async function fetchState() {
  const res = await fetch('/api/state');
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching state`);
  return res.json();
}

export async function saveHoldings(holding, actor = 'user') {
  const res = await fetch('/api/holdings', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-actor': actor },
    body: JSON.stringify(holding),
  });
  if (!res.ok) throw new Error('Failed to update holding');
  return res.json();
}

export async function deleteHolding(ticker, actor = 'user') {
  const res = await fetch(`/api/holdings/${encodeURIComponent(ticker)}`, {
    method: 'DELETE',
    headers: { 'x-actor': actor },
  });
  if (!res.ok) throw new Error('Failed to remove holding');
  return res.json();
}

export async function updatePrices(priceMap, actor = 'user') {
  const res = await fetch('/api/prices', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-actor': actor },
    body: JSON.stringify(priceMap),
  });
  if (!res.ok) throw new Error('Failed to update prices');
  return res.json();
}

export async function executeTrade(tradeData, actor = 'user') {
  const res = await fetch('/api/trades', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-actor': actor },
    body: JSON.stringify(tradeData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Trade rejected');
  return data;
}

export async function saveCashflow(item, actor = 'user') {
  const res = await fetch('/api/cashflow', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-actor': actor },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to save cashflow');
  return res.json();
}

export async function deleteCashflow(id, actor = 'user') {
  const res = await fetch(`/api/cashflow/${id}`, {
    method: 'DELETE',
    headers: { 'x-actor': actor },
  });
  if (!res.ok) throw new Error('Failed to delete cashflow');
  return res.json();
}

export async function updateSettings(settings, actor = 'user') {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-actor': actor },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

export async function addInsight(text, actor = 'user') {
  const res = await fetch('/api/insights', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-actor': actor },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Failed to save insight');
  return res.json();
}

export async function updateFx(rate, source = 'manual', actor = 'user') {
  const res = await fetch('/api/fx', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-actor': actor },
    body: JSON.stringify({ rate, source }),
  });
  if (!res.ok) throw new Error('Failed to update FX rate');
  return res.json();
}

export async function fundUsd(payload, actor = 'user') {
  const res = await fetch('/api/usd/fund', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-actor': actor },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Funding rejected');
  return data;
}

export async function withdrawUsd(payload, actor = 'user') {
  const res = await fetch('/api/usd/withdraw', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-actor': actor },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Withdrawal rejected');
  return data;
}

export async function takeSnapshot(payload, actor = 'user') {
  const res = await fetch('/api/networth', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-actor': actor },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to record snapshot');
  return res.json();
}

/**
 * Universal JSON request helper with Bearer token authentication and 401 prompt
 */
export async function api(method, path, body) {
  try {
    let token = localStorage.getItem('tok') || '';
    const r = await fetch('/api' + path, {
      method,
      headers: {
        'content-type': 'application/json',
        'x-actor': 'user',
        ...(token ? { authorization: 'Bearer ' + token } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 401) {
      token = prompt('Access token:') || '';
      localStorage.setItem('tok', token);
      return token ? api(method, path, body) : { error: 'Auth required' };
    }
    const j = await r.json();
    if (!r.ok) return { error: j.error || 'Request failed' };
    return j;
  } catch {
    return { error: 'Network error — server may be down' };
  }
}

/**
 * Establish SSE real-time listener with automatic reconnection
 */
export function subscribeToEvents(onUpdate, onStatusChange) {
  let source = null;

  function connect() {
    source = new EventSource('/api/events');
    source.onopen = () => onStatusChange?.('Live', true);
    source.onmessage = () => onUpdate?.();
    source.onerror = () => {
      onStatusChange?.('Reconnecting…', false);
      source.close();
      setTimeout(connect, 3000);
    };
  }

  connect();
  return () => source?.close();
}

if (typeof window !== 'undefined') {
  window.API = {
    fetchState,
    saveHoldings,
    deleteHolding,
    updatePrices,
    executeTrade,
    saveCashflow,
    deleteCashflow,
    updateSettings,
    addInsight,
    updateFx,
    fundUsd,
    withdrawUsd,
    takeSnapshot,
    api,
    subscribeToEvents,
  };
  window.api = api;
}

