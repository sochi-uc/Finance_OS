import Fastify from 'fastify';
import fstatic from '@fastify/static';
import Database from 'better-sqlite3';
import { appendFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = process.env.DATA_DIR || path.join(root, 'data');
const DOCS = path.join(root, 'docs');
const TOKEN = process.env.API_TOKEN || '';
mkdirSync(DATA, { recursive: true });
const db = new Database(path.join(DATA, 'finance.db'));
db.pragma('journal_mode = WAL');
db.exec(`
create table if not exists holdings(ticker text primary key,name text,class text,units real,avg real,price real,ccy text,strategy text);
create table if not exists cashflow(id integer primary key autoincrement,category text,item text,amount real,notes text);
create table if not exists networth(month text primary key,cash real,investments real,liabilities real);
create table if not exists trades(id integer primary key autoincrement,ts text,action text,ticker text,units real,price real,note text);
create table if not exists insights(id integer primary key autoincrement,ts text,author text,text text);
create table if not exists events(id integer primary key autoincrement,ts text,actor text,summary text);
create table if not exists settings(k text primary key,v text);
create table if not exists fxrates(id integer primary key autoincrement,ts text,rate real,source text);
`);

// ---- Seed Initial Treasury Data ----
if (!db.prepare('select count(*) c from holdings').get().c) {
  const H = db.prepare('insert into holdings values(?,?,?,?,?,?,?,?)');
  [['ARADEL','Aradel Holdings','NGX',20,1148.3,1377,'NGN','Energy & upstream exploration hedge'],
   ['ZENITHBANK','Zenith Bank','NGX',131,117.9,135.4,'NGN','Tier-1 banking recapitalization compounder'],
   ['UCAP','United Capital','NGX',1455,17.68,17.05,'NGN','Advisory & investment banking dividend play'],
   ['VOO','Vanguard S&P 500 ETF','US',0.02,490,505,'USD','Core global market dollar-cost average']].forEach(r => H.run(...r));
  const C = db.prepare('insert into cashflow(category,item,amount,notes) values(?,?,?,?)');
  [['INCOME','Executive Retainer / Capital',250000,''],['INCOME','Dividends & Distributions',50000,''],
   ['FIXED','Terminal & Market Data',15000,''],['FIXED','Infrastructure & Cloud',20000,''],
   ['VARIABLE','Discretionary & Operations',35000,''],
   ['SAVINGS','Treasury Cash Buffer',50000,'Liquid yield reserve'],
   ['INVEST','NGX Equity Compounding',50000,'UCAP / Zenith / Aradel'],
   ['INVEST','Global ETF Accumulation',30000,'VOO']].forEach(r => C.run(...r));
  db.prepare('insert into settings values(?,?)').run('cash', 640000);
  db.prepare('insert into settings values(?,?)').run('liabilities', 0);
  db.prepare('insert into settings values(?,?)').run('fx', 1500);
  db.prepare('insert into trades(ts,action,ticker,units,price,note) values(?,?,?,?,?,?)')
    .run('2026-09-15T12:00:00Z','BUY','UCAP',920,17.00,'Value acquisition: banking recapitalization and institutional underwriting thesis');
  db.prepare('insert into insights(ts,author,text) values(?,?,?)')
    .run(new Date().toISOString(),'system','Initial portfolio snapshot synchronized. Tracking NGX core equities, global ETF positions, and multi-currency liquidity reserves.');
}

for (const [k, v] of [['usd_cash',0],['usd_funded',0],['ngn_spent',0],['fee',0.015]]) db.prepare('insert or ignore into settings values(?,?)').run(k, v);
if (!db.prepare('select count(*) c from fxrates').get().c) db.prepare('insert into fxrates(ts,rate,source) values(?,?,?)').run(new Date().toISOString(), +db.prepare("select v from settings where k='fx'").get().v, 'seed (assumed)');
const getSet = k => +db.prepare('select v from settings where k=?').get(k)?.v;
const setKey = (k, v) => db.prepare('insert into settings values(?,?) on conflict(k) do update set v=excluded.v').run(k, v);
// ---- helpers ----
const valueNgn = (h, f) => h.units * h.price * (h.ccy === 'USD' ? f : 1);
const rows = (q, ...a) => db.prepare(q).all(...a);
const getState = () => ({
  settings: Object.fromEntries(rows('select * from settings').map(r => [r.k, +r.v])),
  holdings: rows('select * from holdings order by class,ticker'),
  cashflow: rows('select * from cashflow order by id'),
  networth: rows('select * from networth'),
  trades: rows('select * from trades order by id desc limit 50'),
  insights: rows('select * from insights order by id desc limit 20'),
  events: rows('select * from events order by id desc limit 40'),
  fxrates: rows('select * from fxrates order by id desc limit 60').reverse(),
});
function snapshot(now) {
  const s = getState(), f = s.settings.fx;
  const inv = s.holdings.reduce((a, h) => a + valueNgn(h, f), 0);
  const m = now.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  db.prepare('insert into networth values(?,?,?,?) on conflict(month) do update set cash=excluded.cash,investments=excluded.investments,liabilities=excluded.liabilities')
    .run(m, s.settings.cash + s.settings.usd_cash * f, Math.round(inv * 100) / 100, s.settings.liabilities);
}
const n = x => Math.round(x).toLocaleString('en-US');
function stateMd() {
  const s = getState(), f = s.settings.fx;
  const inv = s.holdings.reduce((a, h) => a + valueNgn(h, f), 0);
  const cost = s.holdings.reduce((a, h) => a + h.units * h.avg * (h.ccy === 'USD' ? f : 1), 0);
  return `# Current State (auto-generated, do not edit)\n_Updated ${new Date().toISOString()}_\n\n` +
    `**Net worth:** ₦${n(s.settings.cash + s.settings.usd_cash * f + inv - s.settings.liabilities)} · **Investments:** ₦${n(inv)} · **P/L:** ${cost ? ((inv / cost - 1) * 100).toFixed(2) : 0}% · **Cash:** ₦${n(s.settings.cash)} · **FX:** ₦${f}/$ · **USD wallet:** $${s.settings.usd_cash.toFixed(2)}\n\n` +
    `| Ticker | Units | Avg | Price | Value ₦ | P/L | Strategy |\n|---|---|---|---|---|---|---|\n` +
    s.holdings.map(h => `| ${h.ticker} | ${h.units} | ${h.avg} | ${h.price} | ${n(valueNgn(h, f))} | ${((h.price / h.avg - 1) * 100).toFixed(1)}% | ${h.strategy || ''} |`).join('\n') +
    `\n\n## Latest insights\n` + s.insights.slice(0, 5).map(i => `- (${i.author}) ${i.text}`).join('\n') + '\n';
}
const clients = new Set();
function commit(actor, summary) {
  const now = new Date(), ts = now.toISOString();
  db.prepare('insert into events(ts,actor,summary) values(?,?,?)').run(ts, actor, summary);
  snapshot(now);
  try {
    appendFileSync(path.join(DOCS, 'LOGS.md'), `- **${ts.slice(0, 16).replace('T', ' ')}** · \`${actor}\` · ${summary}\n`);
    writeFileSync(path.join(DOCS, 'STATE.md'), stateMd());
  } catch (e) { console.error('doc write failed', e.message); }
  for (const c of clients) c.write(`data: ${Date.now()}\n\n`);
}

// ---- server ----
const app = Fastify({ logger: true });
app.register(fstatic, { root: path.join(root, 'web') });
app.addHook('onRequest', async (req, rep) => {
  if (req.url.startsWith('/api') && req.method !== 'GET' && TOKEN && req.headers.authorization !== `Bearer ${TOKEN}`)
    return rep.code(401).send({ error: 'unauthorized' });
});
const who = req => (req.headers['x-actor'] || 'user').toString().slice(0, 20);

app.get('/api/state', async () => getState());
app.get('/api/events', (req, rep) => {
  rep.hijack();
  rep.raw.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
  rep.raw.write('retry: 2000\n\n'); clients.add(rep.raw);
  const hb = setInterval(() => rep.raw.write(': hb\n\n'), 25000);
  req.raw.on('close', () => { clearInterval(hb); clients.delete(rep.raw); });
});
app.post('/api/holdings', async (req) => {
  const b = req.body, old = db.prepare('select * from holdings where ticker=?').get(b.ticker) || { name: b.ticker, class: 'NGX', units: 0, avg: 0, price: 0, ccy: 'NGN', strategy: '' };
  const h = { ...old, ...b };
  db.prepare('insert or replace into holdings values(?,?,?,?,?,?,?,?)').run(h.ticker, h.name, h.class, +h.units, +h.avg, +h.price, h.ccy, h.strategy);
  commit(who(req), `Holding ${h.ticker}: ${h.units} units @ avg ${h.avg}, price ${h.price}`); return h;
});
app.delete('/api/holdings/:t', async (req) => { db.prepare('delete from holdings where ticker=?').run(req.params.t); commit(who(req), `Removed holding ${req.params.t}`); return { ok: 1 }; });
app.post('/api/prices', async (req) => {
  const up = db.prepare('update holdings set price=? where ticker=?');
  Object.entries(req.body).forEach(([t, p]) => up.run(+p, t));
  commit(who(req), `Price update: ${Object.entries(req.body).map(([t, p]) => `${t}=${p}`).join(', ')}`); return { ok: 1 };
});
app.post('/api/trades', async (req, rep) => {
  const { action, ticker, units, price, note = '', ccy = 'NGN' } = req.body, u = +units, p = +price;
  const A = String(action).toUpperCase(), h = db.prepare('select * from holdings where ticker=?').get(ticker);
  if (!['BUY', 'SELL'].includes(A) || !(u > 0) || !(p > 0)) return rep.code(400).send({ error: 'bad trade' });
  if (A === 'SELL' && (!h || h.units < u)) return rep.code(400).send({ error: 'not enough units' });
  if ((h?.ccy || ccy) === 'USD') {
    const fee = getSet('fee'), w = getSet('usd_cash'), g = u * p;
    if (A === 'BUY') {
      if (g * (1 + fee) > w + 1e-9) return rep.code(400).send({ error: `Need $${(g * (1 + fee)).toFixed(2)} in USD wallet (incl. ${(fee * 100).toFixed(1)}% fee), have $${w.toFixed(2)}` });
      setKey('usd_cash', w - g * (1 + fee));
    } else setKey('usd_cash', w + g * (1 - fee));
  }
  if (!h) db.prepare('insert into holdings values(?,?,?,?,?,?,?,?)').run(ticker, ticker, ccy === 'USD' ? 'US' : 'NGX', 0, 0, p, ccy, '');
  const c = db.prepare('select * from holdings where ticker=?').get(ticker);
  const nu = A === 'BUY' ? c.units + u : c.units - u;
  const avg = A === 'BUY' ? (c.units * c.avg + u * p) / nu : c.avg;
  db.prepare('update holdings set units=?,avg=?,price=? where ticker=?').run(nu, avg, p, ticker);
  db.prepare('insert into trades(ts,action,ticker,units,price,note) values(?,?,?,?,?,?)').run(new Date().toISOString(), A, ticker, u, p, note);
  commit(who(req), `${A} ${u} ${ticker} @ ${p}${note ? ' — ' + note : ''}`); return { ok: 1 };
});
app.post('/api/cashflow', async (req) => {
  const b = req.body;
  if (b.id) db.prepare('update cashflow set category=coalesce(?,category),item=coalesce(?,item),amount=coalesce(?,amount),notes=coalesce(?,notes) where id=?').run(b.category ?? null, b.item ?? null, b.amount ?? null, b.notes ?? null, b.id);
  else db.prepare('insert into cashflow(category,item,amount,notes) values(?,?,?,?)').run(b.category, b.item, +b.amount, b.notes || '');
  commit(who(req), `Cashflow ${b.item ?? '#' + b.id}: ${b.amount ?? ''}`); return { ok: 1 };
});
app.delete('/api/cashflow/:id', async (req) => { db.prepare('delete from cashflow where id=?').run(req.params.id); commit(who(req), `Removed cashflow #${req.params.id}`); return { ok: 1 }; });
app.post('/api/settings', async (req) => {
  const up = db.prepare('insert into settings values(?,?) on conflict(k) do update set v=excluded.v');
  Object.entries(req.body).forEach(([k, v]) => up.run(k, +v));
  commit(who(req), `Settings: ${JSON.stringify(req.body)}`); return { ok: 1 };
});
app.post('/api/insights', async (req) => {
  db.prepare('insert into insights(ts,author,text) values(?,?,?)').run(new Date().toISOString(), who(req), req.body.text);
  commit(who(req), `Insight added`); return { ok: 1 };
});
app.post('/api/fx', async (req, rep) => {
  const r = +req.body.rate, src = req.body.source || who(req);
  if (!(r > 0)) return rep.code(400).send({ error: 'bad rate' });
  db.prepare('insert into fxrates(ts,rate,source) values(?,?,?)').run(new Date().toISOString(), r, src);
  setKey('fx', r); commit(who(req), `FX rate ₦${r}/$ (${src})`); return { ok: 1 };
});
app.post('/api/usd/fund', async (req, rep) => {   // NGN -> USD wallet. history:true = log past funding only (no balance change)
  const usd = +req.body.usd, rate = +req.body.rate || getSet('fx'), ngn = usd * rate + (+req.body.fee_ngn || 0), hist = !!req.body.history;
  if (!(usd > 0)) return rep.code(400).send({ error: 'bad amount' });
  if (!hist && ngn > getSet('cash')) return rep.code(400).send({ error: `Need ₦${n(ngn)} Naira cash, have ₦${n(getSet('cash'))}` });
  if (!hist) { setKey('cash', getSet('cash') - ngn); setKey('usd_cash', getSet('usd_cash') + usd); }
  setKey('usd_funded', getSet('usd_funded') + usd); setKey('ngn_spent', getSet('ngn_spent') + ngn);
  db.prepare('insert into trades(ts,action,ticker,units,price,note) values(?,?,?,?,?,?)').run(new Date().toISOString(), 'FUND', 'USD', usd, rate, req.body.note || (hist ? 'past funding (logged)' : ''));
  commit(who(req), `Funded $${usd} @ ₦${rate} (₦${n(ngn)})${hist ? ' [history]' : ''}`); return { ok: 1 };
});
app.post('/api/usd/withdraw', async (req, rep) => {   // USD wallet -> NGN
  const usd = +req.body.usd, rate = +req.body.rate || getSet('fx');
  if (!(usd > 0) || usd > getSet('usd_cash') + 1e-9) return rep.code(400).send({ error: 'Not enough USD in wallet' });
  setKey('usd_cash', getSet('usd_cash') - usd); setKey('cash', getSet('cash') + usd * rate);
  db.prepare('insert into trades(ts,action,ticker,units,price,note) values(?,?,?,?,?,?)').run(new Date().toISOString(), 'WITHDRAW', 'USD', usd, rate, req.body.note || '');
  commit(who(req), `Converted $${usd} → ₦${n(usd * rate)} @ ₦${rate}`); return { ok: 1 };
});
snapshot(new Date());
app.listen({ port: +(process.env.PORT || 8787), host: '0.0.0.0' });
