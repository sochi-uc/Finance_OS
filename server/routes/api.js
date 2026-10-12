import { db, getStateData, getSetting, setSetting } from '../db.js';
import { registerSSEClient, commitEvent } from '../services/events.js';
import { formatNumber } from '../services/portfolio.js';
import { config } from '../config.js';

export async function apiRoutes(app) {
  // Authentication Guard for state-mutating requests
  app.addHook('onRequest', async (req, rep) => {
    if (
      req.url.startsWith('/api') &&
      req.method !== 'GET' &&
      config.token &&
      req.headers.authorization !== `Bearer ${config.token}`
    ) {
      return rep.code(401).send({ error: 'unauthorized' });
    }
  });

  const getActor = (req) =>
    (req.headers['x-actor'] || 'user').toString().slice(0, 20);

  // Snapshot & SSE Live Stream
  app.get('/api/state', async () => getStateData());
  app.get('/api/events', registerSSEClient);

  // Holdings Management
  app.post('/api/holdings', async (req) => {
    const b = req.body;
    const old = db.prepare('select * from holdings where ticker=?').get(b.ticker) || {
      name: b.ticker,
      class: 'NGX',
      units: 0,
      avg: 0,
      price: 0,
      ccy: 'NGN',
      strategy: '',
    };
    const h = { ...old, ...b };
    db.prepare('insert or replace into holdings values(?,?,?,?,?,?,?,?)').run(
      h.ticker,
      h.name,
      h.class,
      +h.units,
      +h.avg,
      +h.price,
      h.ccy,
      h.strategy
    );
    commitEvent(getActor(req), `Holding ${h.ticker}: ${h.units} units @ avg ${h.avg}, price ${h.price}`);
    return h;
  });

  app.delete('/api/holdings/:t', async (req) => {
    db.prepare('delete from holdings where ticker=?').run(req.params.t);
    commitEvent(getActor(req), `Removed holding ${req.params.t}`);
    return { ok: 1 };
  });

  // Bulk Price Updates
  app.post('/api/prices', async (req) => {
    const update = db.prepare('update holdings set price=? where ticker=?');
    Object.entries(req.body).forEach(([t, p]) => update.run(+p, t));
    commitEvent(
      getActor(req),
      `Price update: ${Object.entries(req.body).map(([t, p]) => `${t}=${p}`).join(', ')}`
    );
    return { ok: 1 };
  });

  // Trade Execution & Ledger Logging
  app.post('/api/trades', async (req, rep) => {
    const { action, ticker, units, price, note = '', ccy = 'NGN' } = req.body;
    const u = +units;
    const p = +price;
    const actionType = String(action).toUpperCase();
    const existing = db.prepare('select * from holdings where ticker=?').get(ticker);

    if (!['BUY', 'SELL'].includes(actionType) || !(u > 0) || !(p > 0)) {
      return rep.code(400).send({ error: 'bad trade' });
    }
    if (actionType === 'SELL' && (!existing || existing.units < u)) {
      return rep.code(400).send({ error: 'not enough units' });
    }

    if ((existing?.ccy || ccy) === 'USD') {
      const fee = getSetting('fee');
      const wallet = getSetting('usd_cash');
      const gross = u * p;

      if (actionType === 'BUY') {
        if (gross * (1 + fee) > wallet + 1e-9) {
          return rep.code(400).send({
            error: `Need $${(gross * (1 + fee)).toFixed(2)} in USD wallet (incl. ${(fee * 100).toFixed(1)}% fee), have $${wallet.toFixed(2)}`,
          });
        }
        setSetting('usd_cash', wallet - gross * (1 + fee));
      } else {
        setSetting('usd_cash', wallet + gross * (1 - fee));
      }
    }

    if (!existing) {
      db.prepare('insert into holdings values(?,?,?,?,?,?,?,?)').run(
        ticker,
        ticker,
        ccy === 'USD' ? 'US' : 'NGX',
        0,
        0,
        p,
        ccy,
        ''
      );
    }

    const current = db.prepare('select * from holdings where ticker=?').get(ticker);
    const newUnits = actionType === 'BUY' ? current.units + u : current.units - u;
    const newAvg = actionType === 'BUY' ? (current.units * current.avg + u * p) / newUnits : current.avg;

    db.prepare('update holdings set units=?,avg=?,price=? where ticker=?').run(newUnits, newAvg, p, ticker);
    db.prepare('insert into trades(ts,action,ticker,units,price,note) values(?,?,?,?,?,?)').run(
      new Date().toISOString(),
      actionType,
      ticker,
      u,
      p,
      note
    );

    commitEvent(getActor(req), `${actionType} ${u} ${ticker} @ ${p}${note ? ' — ' + note : ''}`);
    return { ok: 1 };
  });

  // Cashflow Management
  app.post('/api/cashflow', async (req) => {
    const b = req.body;
    if (b.id) {
      db.prepare(
        'update cashflow set category=coalesce(?,category),item=coalesce(?,item),amount=coalesce(?,amount),notes=coalesce(?,notes) where id=?'
      ).run(b.category ?? null, b.item ?? null, b.amount ?? null, b.notes ?? null, b.id);
    } else {
      db.prepare('insert into cashflow(category,item,amount,notes) values(?,?,?,?)').run(
        b.category,
        b.item,
        +b.amount,
        b.notes || ''
      );
    }
    commitEvent(getActor(req), `Cashflow ${b.item ?? '#' + b.id}: ${b.amount ?? ''}`);
    return { ok: 1 };
  });

  app.delete('/api/cashflow/:id', async (req) => {
    db.prepare('delete from cashflow where id=?').run(req.params.id);
    commitEvent(getActor(req), `Removed cashflow #${req.params.id}`);
    return { ok: 1 };
  });

  // Settings & Insights
  app.post('/api/settings', async (req) => {
    const up = db.prepare('insert into settings values(?,?) on conflict(k) do update set v=excluded.v');
    Object.entries(req.body).forEach(([k, v]) => up.run(k, +v));
    commitEvent(getActor(req), `Settings: ${JSON.stringify(req.body)}`);
    return { ok: 1 };
  });

  app.post('/api/insights', async (req) => {
    db.prepare('insert into insights(ts,author,text) values(?,?,?)').run(
      new Date().toISOString(),
      getActor(req),
      req.body.text
    );
    commitEvent(getActor(req), 'Insight added');
    return { ok: 1 };
  });

  // Foreign Exchange Operations
  app.post('/api/fx', async (req, rep) => {
    const r = +req.body.rate;
    const src = req.body.source || getActor(req);
    if (!(r > 0)) return rep.code(400).send({ error: 'bad rate' });

    db.prepare('insert into fxrates(ts,rate,source) values(?,?,?)').run(
      new Date().toISOString(),
      r,
      src
    );
    setSetting('fx', r);
    commitEvent(getActor(req), `FX rate ₦${r}/$ (${src})`);
    return { ok: 1 };
  });

  app.post('/api/usd/fund', async (req, rep) => {
    const usd = +req.body.usd;
    const rate = +req.body.rate || getSetting('fx');
    const ngn = usd * rate + (+req.body.fee_ngn || 0);
    const hist = !!req.body.history;

    if (!(usd > 0)) return rep.code(400).send({ error: 'bad amount' });
    if (!hist && ngn > getSetting('cash')) {
      return rep.code(400).send({ error: `Need ₦${formatNumber(ngn)} Naira cash, have ₦${formatNumber(getSetting('cash'))}` });
    }

    if (!hist) {
      setSetting('cash', getSetting('cash') - ngn);
      setSetting('usd_cash', getSetting('usd_cash') + usd);
    }
    setSetting('usd_funded', getSetting('usd_funded') + usd);
    setSetting('ngn_spent', getSetting('ngn_spent') + ngn);

    db.prepare('insert into trades(ts,action,ticker,units,price,note) values(?,?,?,?,?,?)').run(
      new Date().toISOString(),
      'FUND',
      'USD',
      usd,
      rate,
      req.body.note || (hist ? 'past funding (logged)' : '')
    );

    commitEvent(getActor(req), `Funded $${usd} @ ₦${rate} (₦${formatNumber(ngn)})${hist ? ' [history]' : ''}`);
    return { ok: 1 };
  });

  app.post('/api/usd/withdraw', async (req, rep) => {
    const usd = +req.body.usd;
    const rate = +req.body.rate || getSetting('fx');

    if (!(usd > 0) || usd > getSetting('usd_cash') + 1e-9) {
      return rep.code(400).send({ error: 'Not enough USD in wallet' });
    }

    setSetting('usd_cash', getSetting('usd_cash') - usd);
    setSetting('cash', getSetting('cash') + usd * rate);

    db.prepare('insert into trades(ts,action,ticker,units,price,note) values(?,?,?,?,?,?)').run(
      new Date().toISOString(),
      'WITHDRAW',
      'USD',
      usd,
      rate,
      req.body.note || ''
    );

    commitEvent(getActor(req), `Converted $${usd} → ₦${formatNumber(usd * rate)} @ ₦${rate}`);
    return { ok: 1 };
  });
}
