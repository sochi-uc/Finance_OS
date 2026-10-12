'use strict';

import {
  fmtN, fmtD, N, D, Pct, bcl, ago, dFmt, sum, isUSD, esc, IC, TABS, PALETTE, QUOTES, hVal, fx, afx, startQuotes
} from './config.js';
import { CHART_POINTS, CHART_ANALYSES, ANALYSES } from './data.js';
import { infoBtn } from './explainers.js';
import {
  makeSparklineSVG, renderProChartStation, renderChartCard, activeTerminalTicker, activeChartFilter,
  selectTerminalStock, donut, lineChart, calHTML, hrow
} from './charts.js';

// Reactive state proxy referencing live window.S
const S = new Proxy({}, {
  get(_, prop) {
    return (typeof window !== 'undefined' && window.S) ? window.S[prop] : undefined;
  }
});

/* ─── VIEWS ────────────────────────────────────────────── */
export const V = {

foresight(d) {
  return `
  <div class="ph" style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
    <div class="ph-left">
      <div class="ph-title">Strategic Intelligence & Playbook</div>
      <div class="ph-sub">Executive market terminal · visual chart breakouts, arbitrage setups & 3-pillar verification.</div>
    </div>
    <a href="/presentation.html" target="_blank" class="btn btn-secondary" style="font-size:11px; padding:6px 14px; gap:6px; text-decoration:none; display:inline-flex; align-items:center; border-radius:8px;">
      Executive Deck ↗
    </a>
  </div>

  <!-- EXECUTIVE KPI RIBBON -->
  <div class="grid" style="margin-bottom:14px;">
    <div class="card c3" style="padding:12px 14px; border-left:3px solid var(--c-gain); display:flex; flex-direction:column; justify-content:space-between;">
      <div style="font-size:10px; color:var(--c-ink3); text-transform:uppercase; font-weight:700; letter-spacing:0.06em;">Top Yield Arbitrage</div>
      <div class="num-lg" style="color:var(--c-gain); margin:2px 0;">16.0% Net</div>
      <div style="font-size:11px; color:var(--c-ink2);">NIDF Public Offer · 42% Discount</div>
    </div>
    <div class="card c3" style="padding:12px 14px; border-left:3px solid var(--c-accent); display:flex; flex-direction:column; justify-content:space-between;">
      <div style="font-size:10px; color:var(--c-ink3); text-transform:uppercase; font-weight:700; letter-spacing:0.06em;">Multi-Bagger Peak</div>
      <div class="num-lg" style="color:var(--c-accent); margin:2px 0;">+170%</div>
      <div style="font-size:11px; color:var(--c-ink2);">ARADEL & UPDC 2026 Runs</div>
    </div>
    <div class="card c3" style="padding:12px 14px; border-left:3px solid #ff9f0a; display:flex; flex-direction:column; justify-content:space-between;">
      <div style="font-size:10px; color:var(--c-ink3); text-transform:uppercase; font-weight:700; letter-spacing:0.06em;">Anchor Capital Base</div>
      <div class="num-lg" style="color:#ff9f0a; margin:2px 0;">₦614.7bn</div>
      <div style="font-size:11px; color:var(--c-ink2);">Zenith Bank Solvency Fortress</div>
    </div>
    <div class="card c3" style="padding:12px 14px; border-left:3px solid #64d2ff; display:flex; flex-direction:column; justify-content:space-between;">
      <div style="font-size:10px; color:var(--c-ink3); text-transform:uppercase; font-weight:700; letter-spacing:0.06em;">Macro Catalyst Window</div>
      <div class="num-lg" style="color:var(--c-ink); margin:2px 0;">Q1 2027</div>
      <div style="font-size:11px; color:var(--c-ink2);">Dangote IPO + Bank Recap Climax</div>
    </div>
  </div>

  <!-- 1. FEATURED PRO CHART TERMINAL (HERO STATION) -->
  <div id="pro-chart-station-container" class="grid" style="margin-bottom:14px;">
    ${renderProChartStation(activeTerminalTicker || 'ARADEL')}
  </div>

  <div class="grid">
    <!-- 2. COMPACT OUTPERFORMERS & BREAKOUT WATCHLIST TABLE -->
    <div class="card c12">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
        <div>
          <div class="card-label" style="color:var(--c-accent)">Institutional Breakout Watchlist · 2026 Alpha Setups ${infoBtn('watchlist', 'Watchlist Strategy')}</div>
          <div style="font-size:16px; font-weight:700;">2026 Outperformers & Monitored NGX Assets</div>
        </div>
        <span style="font-size:12px; color:var(--c-ink3);">Tap any asset to load into the Pro Terminal ↗</span>
      </div>

      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:13px; text-align:left;">
          <thead>
            <tr style="border-bottom:1px solid var(--c-border); color:var(--c-ink3); font-size:11px; text-transform:uppercase;">
              <th style="padding:8px 10px;">Asset</th>
              <th style="padding:8px 10px;">Current Price</th>
              <th style="padding:8px 10px;">Support Floor</th>
              <th style="padding:8px 10px;">Resistance</th>
              <th style="padding:8px 10px;">Status</th>
              <th style="padding:8px 10px; text-align:right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${['ARADEL', 'UCAP', 'ZENITHBANK', 'SEPLAT', 'UPDC', 'BUAFOODS', 'JBERGER', 'NGXGROUP', 'TRANSCORP', 'MAYBAKER', 'NIDF'].map(t => {
              const item = CHART_ANALYSES[t];
              return `
              <tr style="border-bottom:1px solid var(--c-s2); cursor:pointer; transition:background .15s;" onclick="selectTerminalStock('${t}')">
                <td style="padding:10px;">
                  <b>${t}</b> <span style="font-size:11px; color:var(--c-ink3);">· ${item.name}</span>
                </td>
                <td style="padding:10px; font-weight:700; font-variant-numeric:tabular-nums;">
                  ${t==='NIDF'?'₦'+item.price.toFixed(2):fmtN(item.price)}
                </td>
                <td style="padding:10px; color:var(--c-gain); font-variant-numeric:tabular-nums;">
                  ${fmtN(item.support)}
                </td>
                <td style="padding:10px; color:var(--c-loss); font-variant-numeric:tabular-nums;">
                  ${fmtN(item.resistance)}
                </td>
                <td style="padding:10px;">
                  <span class="tag" style="background:var(--c-s2); color:${item.statusCol}; border:1px solid var(--c-border); font-size:10px; font-weight:600;">
                    ${item.status}
                  </span>
                </td>
                <td style="padding:10px; text-align:right;">
                  <button class="btn btn-secondary" style="padding:4px 10px; font-size:11px;" onclick="event.stopPropagation(); selectTerminalStock('${t}')">
                    Inspect ↗
                  </button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- 3. STRATEGIC DOSSIERS (CLEAN 2X2 GRID) -->
    
    <!-- CARD A: NIDF ARBITRAGE -->
    <div class="card c6" style="border-left: 3px solid var(--c-gain);">
      <div class="card-label" style="color:var(--c-gain)">Yield & Liquidity Arbitrage · Fixed-Income Infrastructure ${infoBtn('nidf_arbitrage', 'NIDF Arbitrage Breakdown')}</div>
      <div style="font-size:16px; font-weight:700; margin-bottom:6px;">NIDF Public Offer: 42% Upfront Discount</div>
      
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:10px 0;">
        <div style="background:var(--c-s2); padding:10px; border-radius:8px; border:1px solid var(--c-border);">
          <div style="font-size:10px; color:var(--c-ink3); text-transform:uppercase;">Offer Price</div>
          <div style="font-size:18px; font-weight:800; color:var(--c-gain); margin-top:2px;">₦113.40</div>
          <div style="font-size:10px; color:var(--c-ink2);">Closes late Oct 2026</div>
        </div>
        <div style="background:var(--c-s2); padding:10px; border-radius:8px; border:1px solid var(--c-border);">
          <div style="font-size:10px; color:var(--c-ink3); text-transform:uppercase;">Secondary Market</div>
          <div style="font-size:18px; font-weight:800; color:var(--c-ink); margin-top:2px;">₦162.00</div>
          <div style="font-size:10px; color:var(--c-ink2);">Bamboo / Chaka rate</div>
        </div>
      </div>

      <div style="font-size:12px; color:var(--c-ink2); line-height:1.5;">
        • <b>Yield Advantage:</b> 15.5%–16.0% quarterly dividend yield vs 11.0% on secondary.<br>
        • <b>Cash Flow:</b> 100k units generates <b>₦1.58M–₦1.76M annual cash flow</b> (~₦4.40/qtr).<br>
        • <b>Payback:</b> 100% cost recovered in <b>6 to 7 years</b> purely via cash dividends.
      </div>
    </div>

    <!-- CARD B: CORE PORTFOLIO CATALYSTS -->
    <div class="card c6" style="border-left: 3px solid var(--c-accent);">
      <div class="card-label" style="color:var(--c-accent)">Core Portfolio · Macro Catalysts 2026–2027 ${infoBtn('core_catalysts', 'Core Macro Catalysts')}</div>
      <div style="font-size:16px; font-weight:700; margin-bottom:6px;">Aradel, UCAP & Zenith Bank Directives</div>
      
      <div style="display:flex; flex-direction:column; gap:8px; font-size:12px; color:var(--c-ink2); margin-top:8px;">
        <div style="background:var(--c-s2); padding:8px 10px; border-radius:8px; border:1px solid var(--c-border);">
          <b>ARADEL (Super-Major):</b> 136k boepd + 594 mmboe reserves post-ND Western & SPDC closings. ₦33 dividend baseline. Hold as generational compounder.
        </div>
        <div style="background:var(--c-s2); padding:8px 10px; border-radius:8px; border:1px solid var(--c-border);">
          <b>UCAP (Dangote IPO & Recap):</b> Stockbroker for Dangote Refinery IPO. Advisory fee boom in Q1 2027. Continue ₦20k/month DCA.
        </div>
        <div style="background:var(--c-s2); padding:8px 10px; border-radius:8px; border:1px solid var(--c-border);">
          <b>ZENITH (Recap Fortress):</b> ₦614.7bn capital base. ₦10 dividend baseline protected. Snipe aggressively if price tests below ₦125.
        </div>
      </div>
    </div>

    <!-- CARD C: 3-PILLAR RISK SCREENER -->
    <div class="card c6">
      <div class="card-label" style="color:var(--c-accent)">Corporate Risk Due Diligence · 3-Pillar Audit ${infoBtn('screener_3pillar', 'Quantitative Screener')}</div>
      <div style="font-size:16px; font-weight:700; margin-bottom:6px;">Quantitative 3-Pillar Corporate Screener</div>
      <div style="font-size:12px; color:var(--c-ink2); line-height:1.5; background:var(--c-s2); padding:10px 12px; border-radius:8px; border:1px solid var(--c-border);">
        <p><b>1. Earnings & Margins:</b> 3–5 yr revenue CAGR, stable gross and net margins through Nigerian inflation cycles.</p>
        <p style="margin-top:6px;"><b>2. Relative Valuation:</b> Benchmark P/E, P/B, and EV/EBITDA against direct NGX sector competitors to spot mispricings.</p>
        <p style="margin-top:6px;"><b>3. Balance Sheet Health:</b> Verify Debt-to-Equity safety, Current Ratio > 1.2x, and positive real operating Free Cash Flow.</p>
      </div>
    </div>

    <!-- CARD D: FOUNDATIONS & MINDSET -->
    <div class="card c6">
      <div class="card-label">Capital Expansion Principles & Valuation Metrics ${infoBtn('asymmetry_axiom', 'The Asymmetry Axiom')}</div>
      <div style="font-size:16px; font-weight:700; margin-bottom:6px;">Stock Metrics & Income Asymmetry</div>
      <div style="font-size:12px; color:var(--c-ink2); line-height:1.5; background:var(--c-s2); padding:10px 12px; border-radius:8px; border:1px solid var(--c-border);">
        <p><b>The Asymmetry Axiom:</b> Frugality has an absolute mathematical floor, but skill-based earning has <b>zero ceiling</b>. Stop spending hours rationing Diet Cokes; spend hours acquiring high-leverage skills that buy assets.</p>
        <p style="margin-top:6px;"><b>Key Indicators:</b> <b>Market Cap</b> (scale), <b>P/E</b> (years of profit paid), <b>Dividend Yield</b> (cash return), <b>Beta</b> (volatility multiplier), and <b>52-Week Range</b> (cyclical floor vs ceiling).</p>
      </div>
    </div>
  </div>`;
},

home(d) {
  const bk=[
    {l:'NGX Stocks',   v:d.ngxV,         c:PALETTE[0]},
    {l:'Private Equity',v:d.privV,        c:PALETTE[1]},
    {l:'Dollar',       v:d.usV+d.wNGN,    c:PALETTE[2]},
    {l:'Banks',        v:d.uba+d.acc,     c:PALETTE[3]},
  ].filter(b=>b.v>0);
  const bkT=sum(bk,b=>b.v)||1;
  const hr=new Date().getHours();
  const greet=hr<12?'Good morning':'Good afternoon';

  
  setTimeout(startQuotes, 100);
  
  return `
  <div class="card c12" id="quote-box" style="margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; padding:12px 20px; transition: opacity 0.4s ease; background: var(--c-s1); border-left: 3px solid var(--c-accent); flex-wrap:wrap; gap:8px;">
    <div id="q-text" style="font-size:13px; font-style:italic; color:var(--c-ink2); line-height:1.4;">"${QUOTES[0].text}"</div>
    <div id="q-auth" style="font-size:11px; font-weight:700; color:var(--c-accent); text-transform:uppercase; letter-spacing:0.06em; flex-shrink:0;">— ${QUOTES[0].author}</div>
  </div>

  <div class="ticker" id="ticker">
    <div class="ticker-track" id="ticker-track"></div>
  </div>

  <div class="ph">
    <div class="ph-left">
      <div class="ph-title">${greet}, Executive.</div>
      <div class="ph-sub">₦${fx().toLocaleString()} / $1 &nbsp;·&nbsp; ${new Date().toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'})}</div>
    </div>
  </div>

  <div class="grid">
    <div class="card c8">
      <div class="card-label">Total Net Worth ${infoBtn('net_worth', 'Net Worth Breakdown')}</div>
      <div class="num-hero">${N(d.nw)}</div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
        <span class="badge ${bcl(d.pl)}">${Pct(d.pl)}</span>
        <span class="meta2">return on invested capital</span>
      </div>
      <div class="bk-bar">${bk.map(b=>`<div class="bk-seg" style="flex:${b.v/bkT};background:${b.c}" title="${esc(b.l)}: ${fmtN(b.v)}"></div>`).join('')}</div>
      <div class="bk-legend">
        ${bk.map(b=>`<div class="bk-row"><span class="bk-dot" style="background:${b.c}"></span>${b.l} <b>${fmtN(b.v)}</b></div>`).join('')}
      </div>
    </div>

    <div class="card c4">
      <div class="card-label">Liquid Cash ${infoBtn('liquid_cash', 'Liquid Cash Reserves')}</div>
      <div class="num-lg">${N(d.liq)}</div>
      <div style="margin-top:14px">
        <div class="acc-row">
          <span class="acc-label tip" data-tip="Access Bank — primary operating account">Access Bank <i class="i-ico">i</i></span>
          <span class="num-md">${N(d.acc)}</span>
        </div>
        <div class="acc-row">
          <span class="acc-label tip" data-tip="United Bank for Africa — secondary account">UBA <i class="i-ico">i</i></span>
          <span class="num-md">${N(d.uba)}</span>
        </div>
        <div class="acc-row" style="border-bottom:none">
          <span class="acc-label tip" data-tip="Bamboo USD wallet · held in dollars, shown in NGN at current rate">Bamboo <i class="i-ico">i</i></span>
          <div style="text-align:right">
            <div class="num-md">${D(d.wUSD)}</div>
            <div class="meta2">≈ ${fmtN(d.wNGN)}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="c12 kpi-strip">
      <div class="kpi">
        <div class="meta2" style="font-weight:600;text-transform:uppercase;letter-spacing:.06em;font-size:10px">NGX Stocks</div>
        <div class="kpi-val">${N(d.ngxV)}</div>
      </div>
      <div class="kpi">
        <div class="meta2" style="font-weight:600;text-transform:uppercase;letter-spacing:.06em;font-size:10px">Private Equity</div>
        <div class="kpi-val">${N(d.privV)}</div>
      </div>
      <div class="kpi">
        <div class="meta2" style="font-weight:600;text-transform:uppercase;letter-spacing:.06em;font-size:10px">Dollar</div>
        <div class="kpi-val">${D(sum(d.us,h=>h.units*h.price))}</div>
      </div>
      <div class="kpi" style="cursor:pointer" data-act="surplus-detail">
        <div class="meta2" style="font-weight:600;text-transform:uppercase;letter-spacing:.06em;font-size:10px;display:flex;align-items:center;">Surplus ${infoBtn('surplus', 'Monthly Surplus')}</div>
        <div class="kpi-val" style="color:${d.surplus>=0?'var(--c-gain)':'var(--c-loss)'}">${N(d.surplus)}</div>
      </div>
    </div>

    <div class="card c8">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div class="card-label" style="margin:0">Net Worth Over Time ${infoBtn('networth_history', 'Net Worth History')}</div>
        <button class="btn btn-secondary" style="padding:6px 12px;min-height:32px;font-size:11px;gap:5px" data-act="snap">${IC.cam} Record snapshot</button>
      </div>
      ${lineChart((S.networth||[]).map(r=>({l:r.month,v:r.cash+r.investments-r.liabilities})))}
    </div>

    <div class="card c4">
      <div class="card-label">Allocation ${infoBtn('allocation', 'Allocation Breakdown')}</div>
      <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
        ${donut(bk)}
        <div class="bk-legend" style="flex-direction:column">
          ${bk.map(b=>`<div class="bk-row"><span class="bk-dot" style="background:${b.c}"></span>${b.l} <b>${(b.v/bkT*100).toFixed(0)}%</b></div>`).join('')}
        </div>
      </div>
    </div>


    <div class="card c12">
      <div class="card-label">2027 Capitalization Strategy ${infoBtn('capitalization_strategy', 'Capitalization Strategy')}</div>
      <div style="font-size:14px;color:var(--c-ink2);line-height:1.5">
        <ul style="margin:8px 0;padding-left:20px;display:flex;flex-direction:column;gap:8px">
          <li><b>Core Engine:</b> ₦20,000 automated monthly buy (Dollar-Cost Averaging). Pick a fixed date (e.g. salary day) and execute regardless of market noise.</li>
          <li><b>Rotation Plan:</b> Focus the ₦20k on a single asset per month. <b>Oct:</b> Buy UCAP (~1,150 units). <b>Nov:</b> Initiate STANBIC (~120 units). <b>Dec:</b> Re-add UCAP or ZENITH if <₦125.</li>
          <li><b>Sniper Ammo (Extra Cash):</b> Keep any surplus cash liquid in UBA/Bamboo. Deploy aggressively only when targeted dips occur (e.g., UCAP drops to ₦15.50 or PRESCO corrects to ₦1,600).</li>
        </ul>
      </div>
    </div>

    <div class="card c12" id="cal-home">
      <div class="card-label">Dividend Calendar ${infoBtn('dividend_calendar', 'Dividend Calendar')}</div>
      ${calHTML()}
    </div>

    <div class="card c12">
      <div class="card-label">Strategic Intelligence Feed</div>
      ${(S.insights||[]).slice(0,3).map(i=>`<div class="li"><span class="tag">${esc(i.author)}</span>${esc(i.text)}<small>${ago(i.ts)}</small></div>`).join('')||`<p style="color:var(--c-ink3);font-size:13px">Autonomous market intelligence active. Real-time valuation alerts and recapitalization directives will appear here as market events unfold.</p>`}
    </div>
  </div>`;
},

ngn(d) {
  return `
  <div class="ph"><div class="ph-left">
    <div class="ph-title">Naira Assets</div>
    <div class="ph-sub">NGX Equities and Private Allocations · tap any position for full analysis</div>
  </div></div>
  <div class="grid">
    <div class="card c12">
      <div class="card-label">Total Naira Invested ${infoBtn('ngx_portfolio', 'NGX Portfolio Overview')}</div>
      <div class="num-hero">${N(d.ngxV+d.privV)}</div>
      <div class="btn-row">
        <button class="btn btn-primary" data-act="trade" data-c="NGN">Record trade</button>
        <button class="btn btn-secondary" data-act="prices">Update prices</button>
      </div>
    </div>
    <div class="card c6">
      <div class="card-label">Public Stocks · NGX ${infoBtn('ngx_portfolio', 'Public Equities Portfolio')}</div>
      <div class="meta2" style="margin-bottom:10px">Total: <strong style="color:var(--c-ink)">${fmtN(d.ngxV)}</strong></div>
      ${d.ngx.map(hrow).join('')||'<p style="color:var(--c-ink3);font-size:13px">No NGX holdings.</p>'}
    </div>
    <div class="card c6">
      <div class="card-label">Private Equity & Debt <span class="badge b-neu" style="vertical-align:middle;margin-left:4px">Illiquid</span> ${infoBtn('private_ventures', 'Private Equity & Debt')}</div>
      <div class="meta2" style="margin-bottom:10px">Total: <strong style="color:var(--c-ink)">${fmtN(d.privV)}</strong></div>
      ${d.priv.map(hrow).join('')||'<p style="color:var(--c-ink3);font-size:13px">No private ventures.</p>'}
    </div>
    <div class="card c12" id="cal-ngn">
      <div class="card-label">Dividend Calendar ${infoBtn('dividend_calendar', 'Dividend Calendar')}</div>
      ${calHTML()}
    </div>
  </div>`;
},

usd(d) {
  const w=S.settings||{}, known=w.usd_funded>0;
  const fxG=known?(fx()-afx())*(w.usd_cash+sum(d.us,h=>h.units*h.price)):0;
  const rh=(S.fxrates||[]).map(r=>({l:dFmt(r.ts),v:r.rate}));
  return `
  <div class="ph"><div class="ph-left">
    <div class="ph-title">Dollar Portfolio</div>
    <div class="ph-sub">Bamboo · ${((w.fee||.015)*100).toFixed(1)}% commission per trade</div>
  </div></div>
  <div class="grid">
    <div class="card c6">
      <div class="card-label">Bamboo Wallet ${infoBtn('bamboo_usd', 'Bamboo USD Wallet')}</div>
      <div class="num-lg">${D(w.usd_cash||0)}</div>
      <div class="meta">≈ ${N((w.usd_cash||0)*fx())} at ₦${fx()}/$</div>
      <div class="btn-row">
        <button class="btn btn-primary" data-act="fund">Fund from ₦</button>
        <button class="btn btn-secondary" data-act="wd">Convert to ₦</button>
      </div>
    </div>
    <div class="card c6">
      <div class="card-label">Exchange Rate ${infoBtn('bamboo_usd', 'Exchange Rate & FX Spread')}</div>
      <div class="num-lg">₦${fx().toLocaleString()}</div>
      <div class="meta">per $1 · avg cost: <strong>${known?'₦'+Math.round(afx()):'not logged'}</strong>
        ${known?` · FX effect <strong style="color:${fxG>=0?'var(--c-gain)':'var(--c-loss)'}">${fmtN(fxG)}</strong>`:''}
      </div>
      <div class="btn-row">
        <button class="btn btn-secondary" data-act="rate">Set rate</button>
        <button class="btn btn-secondary" data-act="hist">Log past funding</button>
      </div>
    </div>
    <div class="card c12">
      <div class="card-label">US Holdings ${infoBtn('bamboo_usd', 'US Equities Strategy')}</div>
      ${d.us.map(hrow).join('')||'<p style="color:var(--c-ink3);font-size:13px">No US holdings yet. Build your Bamboo wallet balance first, then buy your first position.</p>'}
      <div class="btn-row"><button class="btn btn-secondary" data-act="trade" data-c="USD">Buy / Sell</button></div>
    </div>
    <div class="card c8">
      <div class="card-label">Rate History</div>
      ${lineChart(rh)}
    </div>
    <div class="card c4">
      <div class="card-label">Dollar Activity</div>
      ${(S.trades||[]).filter(t=>t.ticker==='USD'||S.holdings.some(h=>h.ticker===t.ticker&&isUSD(h))).slice(0,10)
        .map(t=>`<div class="li"><span class="tag">${t.action}</span>${esc(t.ticker)} ${t.units} @ ${t.ticker==='USD'?'₦'+t.price:fmtD(t.price)}<small>${ago(t.ts)}${t.note?' · '+esc(t.note):''}</small></div>`).join('')
        ||'<p style="color:var(--c-ink3);font-size:13px">No dollar activity yet.</p>'}
    </div>
  </div>`;
},

cash(d) {
  const g=k=>sum((S.cashflow||[]).filter(r=>r.category===k),r=>r.amount);
  const cats=['INCOME','FIXED','VARIABLE','SAVINGS','INVEST'];
  const mx=Math.max(...cats.map(g),1);
  const ACCS=[
    {label:'Access Bank', key:'access_cash', tip:'Access Bank — primary operating account'},
    {label:'UBA',         key:'uba_cash',    tip:'United Bank for Africa — secondary account'},
    {label:'Bamboo',      key:'usd_cash',    tip:'Bamboo USD wallet — stored in dollars', usd:true},
  ];
  return `
  <div class="ph"><div class="ph-left">
    <div class="ph-title">Budget & Accounts</div>
    <div class="ph-sub">Monthly cashflow · tap any line to edit</div>
  </div></div>
  <div class="grid">
    <div class="card c6">
      <div class="card-label">Bank Accounts ${infoBtn('liquid_cash', 'Bank Accounts Overview')}</div>
      ${ACCS.map(a=>`<div class="acc-row">
        <span class="acc-label tip" data-tip="${esc(a.tip)}">${a.label} <i class="i-ico">i</i></span>
        <div class="acc-right">
          <span class="num-md">${a.usd?fmtD(S.settings[a.key]||0):fmtN(S.settings[a.key]||0)}</span>
          <button class="btn btn-secondary" style="padding:5px 12px;min-height:30px;font-size:11px" data-act="setacc" data-k="${a.key}" data-usd="${a.usd||false}" data-label="${a.label}">Edit</button>
        </div>
      </div>`).join('')}
    </div>
    <div class="card c6" style="cursor:pointer" data-act="surplus-detail">
      <div class="card-label">Monthly Surplus ${infoBtn('surplus', 'Monthly Surplus Breakdown')}</div>
      <div class="num-lg" style="color:${d.surplus>=0?'var(--c-gain)':'var(--c-loss)'}">${N(d.surplus)}</div>
      <div class="meta">${fmtN(d.inc)} in &nbsp;·&nbsp; ${fmtN(d.inc-d.surplus)} out</div>
    </div>
    ${cats.map(k=>`<div class="card c6">
      <div class="card-label">${k} ${infoBtn('budget_accounts', 'Budget Category Rules')}</div>
      <div class="num-md" style="margin-bottom:4px">${N(g(k))}</div>
      <div class="prog"><div class="prog-fill" style="width:${Math.min(g(k)/mx*100,100)}%"></div></div>
      ${(S.cashflow||[]).filter(r=>r.category===k).map(r=>`<button class="h-row" data-act="cf" data-id="${r.id}">
        <div>
          <div class="h-ticker" style="font-size:13px">${esc(r.item)}</div>
          ${r.notes?`<div class="h-name">${esc(r.notes)}</div>`:''}
        </div>
        <div class="h-right"><div class="h-val" style="font-size:13px">${fmtN(r.amount)}</div></div>
      </button>`).join('')}
    </div>`).join('')}
    <div class="c12">
      <button class="btn btn-secondary" style="width:100%" data-act="addcf">+ Add budget line</button>
    </div>
  </div>`;
},

log() {
  const strats=[
    {title:'NGX Banking Recap Climax (Q1/Q2 2027)',body:'Tier-1 banks will deploy fresh recapitalised capital, supercharging earnings. UCAP earns advisory and underwriting fees on every deal. Hold through the recap cycle.'},
    {title:'Dangote IPO Aftermath & Energy Play',body:'The IPO pulls massive retail liquidity into NGX. Use ARADEL as a stable, already-listed energy anchor. Never buy at listing hype — wait for the first post-IPO correction.'},
    {title:'Commercial Venture Capital',body:'₦400k seed deployed in operational commercial enterprise. Every naira of net profit must be routed into NGX / US assets to compound. Hard rule: never co-mingle business capital with personal expenses.'},
    {title:'US Market Re-Entry via Bamboo',body:'Currently $0 equity exposure. Build Bamboo wallet steadily. Target VOO on a verifiable S&P 500 correction or when NGN/USD reaches a favourable rate in early 2027.'},
  ];
  return `
  <div class="ph"><div class="ph-left">
    <div class="ph-title">Executive Ledger & Directives</div>
    <div class="ph-sub">Institutional audit trail · macroeconomic blueprints and portfolio activity records</div>
  </div></div>

  <div class="grid">
    <div class="card c12">
      <div class="card-label">Strategy · 2027 Blueprint ${infoBtn('strategy_blueprint', '2027 Macro Blueprint')}</div>
      ${strats.map(s=>`<div class="strat"><div class="strat-title">${s.title}</div><div class="strat-body">${s.body}</div></div>`).join('')}
    </div>
    <div class="card c6">
      <div class="card-label">Strategic Intelligence & Advisory Notes</div>
      ${(S.insights||[]).map(i=>`<div class="li"><span class="tag">${esc(i.author)}</span>${esc(i.text)}<small>${ago(i.ts)}</small></div>`).join('')||'<p style="color:var(--c-ink3);font-size:13px">No advisory notes recorded yet.</p>'}
    </div>
    <div class="card c6">
      <div class="card-label">Activity Log</div>
      ${(S.events||[]).slice(0,25).map(e=>`<div class="li"><span class="tag">${esc(e.actor)}</span>${esc(e.summary)}<small>${ago(e.ts)}</small></div>`).join('')||'<p style="color:var(--c-ink3);font-size:13px">No events yet.</p>'}
    </div>
  </div>`;
}

}; /* end V */

if (typeof window !== 'undefined') {
  window.V = V;
}
