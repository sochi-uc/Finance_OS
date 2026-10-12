import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

mkdirSync(config.dataDir, { recursive: true });

export const db = new Database(path.join(config.dataDir, 'finance.db'));
db.pragma('journal_mode = WAL');

// ---- Database Schema Definition ----
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

// ---- Seed Default Treasury State if Empty ----
if (!db.prepare('select count(*) c from holdings').get().c) {
  const H = db.prepare('insert into holdings values(?,?,?,?,?,?,?,?)');
  [
    ['ARADEL', 'Aradel Holdings', 'NGX', 20, 1148.3, 1377, 'NGN', 'Energy & upstream exploration hedge'],
    ['ZENITHBANK', 'Zenith Bank', 'NGX', 131, 117.9, 135.4, 'NGN', 'Tier-1 banking recapitalization compounder'],
    ['UCAP', 'United Capital', 'NGX', 1455, 17.68, 17.05, 'NGN', 'Advisory & investment banking dividend play'],
    ['VOO', 'Vanguard S&P 500 ETF', 'US', 0.02, 490, 505, 'USD', 'Core global market dollar-cost average'],
  ].forEach(r => H.run(...r));

  const C = db.prepare('insert into cashflow(category,item,amount,notes) values(?,?,?,?)');
  [
    ['INCOME', 'Executive Retainer / Capital', 250000, ''],
    ['INCOME', 'Dividends & Distributions', 50000, ''],
    ['FIXED', 'Terminal & Market Data', 15000, ''],
    ['FIXED', 'Infrastructure & Cloud', 20000, ''],
    ['VARIABLE', 'Discretionary & Operations', 35000, ''],
    ['SAVINGS', 'Treasury Cash Buffer', 50000, 'Liquid yield reserve'],
    ['INVEST', 'NGX Equity Compounding', 50000, 'UCAP / Zenith / Aradel'],
    ['INVEST', 'Global ETF Accumulation', 30000, 'VOO'],
  ].forEach(r => C.run(...r));

  db.prepare('insert into settings values(?,?)').run('cash', 640000);
  db.prepare('insert into settings values(?,?)').run('liabilities', 0);
  db.prepare('insert into settings values(?,?)').run('fx', 1500);
  db.prepare('insert into trades(ts,action,ticker,units,price,note) values(?,?,?,?,?,?)')
    .run('2026-09-15T12:00:00Z', 'BUY', 'UCAP', 920, 17.00, 'Value acquisition: banking recapitalization thesis');
  db.prepare('insert into insights(ts,author,text) values(?,?,?)')
    .run(new Date().toISOString(), 'system', 'Initial portfolio snapshot synchronized. Tracking NGX core equities, global ETF positions, and multi-currency liquidity reserves.');
}

for (const [k, v] of [['usd_cash', 0], ['usd_funded', 0], ['ngn_spent', 0], ['fee', 0.015]]) {
  db.prepare('insert or ignore into settings values(?,?)').run(k, v);
}

if (!db.prepare('select count(*) c from fxrates').get().c) {
  db.prepare('insert into fxrates(ts,rate,source) values(?,?,?)').run(
    new Date().toISOString(),
    +db.prepare("select v from settings where k='fx'").get().v,
    'seed (assumed)'
  );
}

// ---- Repository Query Helpers ----
export const rows = (q, ...args) => db.prepare(q).all(...args);
export const row = (q, ...args) => db.prepare(q).get(...args);
export const getSetting = (k) => +db.prepare('select v from settings where k=?').get(k)?.v;
export const setSetting = (k, v) => db.prepare('insert into settings values(?,?) on conflict(k) do update set v=excluded.v').run(k, v);

export const getStateData = () => ({
  settings: Object.fromEntries(rows('select * from settings').map(r => [r.k, +r.v])),
  holdings: rows('select * from holdings order by class,ticker'),
  cashflow: rows('select * from cashflow order by id'),
  networth: rows('select * from networth'),
  trades: rows('select * from trades order by id desc limit 50'),
  insights: rows('select * from insights order by id desc limit 20'),
  events: rows('select * from events order by id desc limit 40'),
  fxrates: rows('select * from fxrates order by id desc limit 60').reverse(),
});
