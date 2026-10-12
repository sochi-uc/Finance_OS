'use strict';

/* ─── TACTILE INFO BUTTON HELPER ───────────────────────── */
function infoBtn(key, title='View breakdown & intelligence') {
  return `<button class="info-btn" data-info="${key}" title="${title}" aria-label="${title}" type="button">${IC.info}</button>`;
}

/* ─── EXPLAINERS DICTIONARY & INTELLIGENCE ─────────────── */
const EXPLAINERS = {
  net_worth: {
    tag: 'Portfolio Intelligence',
    title: 'Total Net Worth & Capital Base',
    overview: 'The consolidated economic value of all liquid bank cash, publicly quoted Nigerian equities, private venture holdings, and foreign currency balances minus any outstanding liabilities. Serves as your master institutional compass for wealth accumulation.',
    formula: '<code>Net Worth = (Access Bank + UBA + Bamboo USD × NGN/USD FX) + (NGX Equities + Private Ventures + US Stocks) - Liabilities</code>. Mark-to-market valuations update dynamically.',
    playbook: 'Evaluate month-over-month capital trajectory rather than daily market swings. In inflationary environments like Nigeria, your strategic priority is steadily growing the ratio of productive assets (equities and cash-flowing ventures) relative to depreciating cash.',
    benchmarks: 'Target baseline: ₦5,000,000+ total capital base by late 2027. Maintain compound return on invested capital above the domestic headline inflation rate.'
  },
  liquid_cash: {
    tag: 'Treasury Management',
    title: 'Liquid Cash & Operational Reserves',
    overview: 'Instantly accessible cash held across Tier-1 Nigerian commercial banks and your digital dollar wallet. Engineered to guarantee psychological freedom, absorb campus emergency overhead, eliminate forced asset liquidation during market corrections, and maintain "Sniper Ammo" for market dips.',
    formula: '<code>Liquid Cash = Access Bank (Primary Operating) + UBA (Campus Reserve) + Bamboo USD (Marked to NGN at parallel rate)</code>.',
    playbook: 'Maintain at least 3 to 6 months of basic campus living expenses (minimum ₦200,000–₦300,000) permanently uncommitted. Any liquid surplus beyond this threshold constitutes tactical dry powder deployed into high-conviction DCA purchases.',
    benchmarks: 'Current verified reserves: ₦640,000 across UBA and Access. Strict discipline: never use operating cash for speculative bets.'
  },
  allocation: {
    tag: 'Portfolio Construction',
    title: 'Strategic Asset Allocation Matrix',
    overview: 'The proportional distribution of total wealth across Nigerian Public Equities, Private Ventures & Ajo, US Dollar Assets, and Liquid Bank Reserves. Asset allocation drives over 90% of long-term risk-adjusted portfolio returns.',
    formula: 'Calculated as each individual asset class valuation divided by total gross asset pool.',
    playbook: 'Target institutional allocation target bands: <b>45% NGX Core Equities</b> (domestic inflation hedge & high dividend yield), <b>25% US Equities / Dollar Cash</b> (structural currency protection), <b>20% Liquid Bank Cash</b> (stability & dip-buying liquidity), and <b>10% Private Ventures / Ajo</b> (campus cash flow).',
    benchmarks: 'Perform a portfolio rebalancing audit semi-annually or whenever any asset bucket drifts more than 10% outside its target weighting.'
  },
  surplus: {
    tag: 'Cash Flow Engine',
    title: 'Monthly Investable Cash Surplus',
    overview: 'The net free cash flow generated each month after meeting all campus living expenses, fixed overhead, and mandatory contributions. Surplus is the lifeblood and primary funding engine of your investment portfolio.',
    formula: '<code>Monthly Surplus = Total Inflows - (Fixed Overhead + Variable Expenses + Savings Reserves)</code>.',
    playbook: 'A durable surplus allows you to automate a monthly ₦20,000 Dollar-Cost Averaging (DCA) program into Tier-1 equities without relying on unpredictable trading gains or market timing.',
    benchmarks: 'Maintain a minimum positive monthly surplus. Allocate at least ₦20,000 to automated monthly equity DCA, banking any excess as opportunistic sniper reserves.'
  },
  networth_history: {
    tag: 'Long-Term Analytics',
    title: 'Net Worth Trajectory & Snapshots',
    overview: 'A longitudinal visual record tracking historical end-of-month portfolio balance points. Documents true long-term wealth compounding over multi-year macroeconomic cycles.',
    formula: 'Constructed from immutable monthly snapshot entries logging cash reserves, investment portfolio value, and liabilities on the date recorded.',
    playbook: 'Record a snapshot on the final business day of every month via the "Record snapshot" button. Review 6-month moving averages to confirm purchasing power is compounding ahead of naira devaluation.',
    benchmarks: 'Look for an ascending stair-step pattern with resilient drawdowns during broader NGX market pullbacks.'
  },
  capitalization_strategy: {
    tag: 'Execution Directive',
    title: '2027 Capitalization Strategy & DCA Plan',
    overview: 'A systematic capital deployment blueprint engineered to scale an institutional-grade investment portfolio across the Nigerian Exchange (NGX) and US markets through 2027.',
    formula: 'Blends a non-negotiable ₦20,000 monthly Dollar-Cost Averaging (DCA) core engine with opportunistic "Sniper Ammo" deployment during market dislocations.',
    playbook: '1. <b>Automated Monthly Buy:</b> Allocate ₦20,000 on a designated calendar date into one focus asset (e.g. UCAP, Zenith, Stanbic).<br>2. <b>Monthly Rotation:</b> Focus purchases on a single under-accumulated asset per month.<br>3. <b>Sniper Liquidity:</b> Hold extra cash liquid until high-conviction assets reach defined support floors (e.g. UCAP at ₦15.50 or Zenith below ₦125).',
    benchmarks: 'Milestone target: Accumulate 100k units of NIDF and core equity compounders providing sustainable multi-million annual dividend cash flows.'
  },
  pro_chart: {
    tag: 'Market Technicals',
    title: 'Institutional Pro Chart Terminal',
    overview: 'High-resolution price action and technical momentum station monitoring Tier-1 Nigerian equities. Identifies institutional support floors, resistance ceilings, moving average momentum stacks, and breakout volume thresholds.',
    formula: 'Plots price path against 20-day Exponential Moving Average (EMA) and 50-day Simple Moving Average (SMA). Tracks percentage elevation within 52-week trading range.',
    playbook: '• <b>Bullish Momentum Stack:</b> 20 EMA > 50 SMA signifies an active institutional markup phase. Buy pullbacks toward the rising 20 EMA.<br>• <b>Volume Confirmation:</b> Never buy breakouts on thin retail volume. Require 5M–10M+ daily volume confirmation before declaring a true breakout.<br>• <b>Range Trading:</b> Accumulate aggressively near support floors; trim or pause purchases near overhead resistance.',
    benchmarks: 'Support floors offer optimal risk-reward entry points; avoid initiating fresh positions when price is extended >15% above the 20 EMA.'
  },
  nidf_arbitrage: {
    tag: 'Asymmetric Opportunity',
    title: 'NIDF Public Offer Arbitrage (42% Spread)',
    overview: 'The Nigeria Infrastructure Debt Fund (NIDF) Public Offer presents a rare, low-risk fixed-income arbitrage opportunity, pricing newly issued shares at a massive discount relative to the prevailing secondary market price.',
    formula: '<code>Public Offer: ₦113.40 vs Secondary Market: ₦162.00 = 42.8% immediate asset value spread (₦48.60/unit discount)</code>.',
    playbook: '1. <b>Superior Cash Yield:</b> 15.5%–16.0% quarterly cash dividend yield at ₦113.40 entry vs 11.0% on secondary.<br>2. <b>Predictable Inflow:</b> Quarterly distributions averaging ~₦4.40/unit (₦17.60/yr). A 100k unit position generates ₦1.76M annual passive cash flow.<br>3. <b>Full Payback:</b> 100% of initial principal cost is fully recouped in 6 to 7 years strictly through cash distributions, while 100% of the underlying infrastructure asset ownership remains intact.',
    benchmarks: 'Execution Directive: Maximize primary subscription allocation before the public offer window closes in late October 2026.'
  },
  core_catalysts: {
    tag: 'Fundamental Thesis',
    title: 'Core Portfolio Macro Catalysts (2026–2027)',
    overview: 'Macroeconomic catalysts powering your three highest-conviction Nigerian equity positions: upstream energy expansion, CBN banking recapitalization, and capital market advisory booms.',
    formula: 'Focuses on <b>ARADEL</b> (upstream energy & dollar revenue), <b>UCAP</b> (investment banking & IPO advisory), and <b>ZENITHBANK</b> (recapitalized Tier-1 banking fortress).',
    playbook: '• <b>ARADEL:</b> 136k boepd output and 594 mmboe reserves post-SPDC deal. Hold as core currency & dividend compounder.<br>• <b>UCAP:</b> Selected stockbroker for upcoming Dangote Refinery IPO and major bank recapitalizations. Continue ₦20k/month DCA.<br>• <b>ZENITH:</b> ₦614.7bn capital fortress with protected ₦10 dividend baseline. Accumulate aggressively if price dips below ₦125.',
    benchmarks: 'Target a minimum 20%+ combined annual total return (dividend + capital appreciation) across core holdings.'
  },
  screener_3pillar: {
    tag: 'Due Diligence Engine',
    title: 'Quantitative 3-Pillar Corporate Screener',
    overview: 'An institutional risk-screening framework designed to eliminate balance-sheet blowups and identify robust compounders capable of thriving across Nigerian macroeconomic cycles.',
    formula: 'Screens across 3 fundamental criteria:<br><b>1. Earnings & Margins:</b> 3–5 year revenue CAGR > 20%, stable gross and net margins through inflation surges.<br><b>2. Relative Valuation:</b> Discounted P/E, P/B, and EV/EBITDA ratios compared to 5-year averages and direct NGX sector competitors.<br><b>3. Balance Sheet Solvency:</b> Current Ratio > 1.2x, Debt-to-Equity < 0.8x, and durable operating Free Cash Flow.',
    playbook: 'Commit capital exclusively to companies achieving composite scores ≥ 8.0/10. Strictly reject indebted or speculative firms regardless of social buzz.',
    benchmarks: 'Screened Ratings: ARADEL (Score: 9.2/10), UCAP (Score: 8.8/10), ZENITHBANK (Score: 9.5/10).'
  },
  asymmetry_axiom: {
    tag: 'Capital Mindset',
    title: 'The Asymmetry Axiom & Capital Principle',
    overview: 'The governing mathematical truth of wealth accumulation: expense reduction has a strict lower bound of zero, whereas income growth and capital compounding possess unbounded upside.',
    formula: '<code>Max Savings = Income - 0 (Hard mathematical limit)<br>Max Earnings = Infinity (Unbounded upside through leverage and compounding assets)</code>',
    playbook: 'Stop expending cognitive energy rationing trivial campus expenses. Focus 100% of executive bandwidth on mastering high-leverage engineering skills and building systems that scale income to acquire compounding assets.',
    benchmarks: 'Operating Rule: If a moderate expense preserves time or mental focus for high-leverage engineering and investment analysis, prioritize output over extreme frugality.'
  },
  bamboo_usd: {
    tag: 'Currency Diversification',
    title: 'Bamboo Dollar Desk & FX Exposure',
    overview: 'Your hard-currency portfolio, providing structural insulation against domestic currency depreciation and direct exposure to US capital markets.',
    formula: '<code>Total USD Asset Pool = Bamboo Cash Wallet + US Equities Market Value</code>. Converted to NGN at prevailing parallel FX rates.',
    playbook: '1. <b>Commission Friction:</b> Bamboo levies a 1.5% transaction commission. Accumulate dry powder before executing trades to minimize fee drag.<br>2. <b>Index Core:</b> Build wallet liquidity steadily to dollar-cost average into broad-market index funds (VOO / S&P 500).<br>3. <b>FX Tracking:</b> Log all conversions to track real purchasing-power gains across currency cycles.',
    benchmarks: 'Target allocating at least 25% of total wealth in hard currency to hedge against inflation.'
  },
  private_ventures: {
    tag: 'Direct Investments',
    title: 'Private Ventures & Nobel Ajo',
    overview: 'Illiquid investments in on-campus business ventures and structured communal savings circles (Ajo).',
    formula: 'Carried at deployed capital cost or net tangible asset value. Cash payouts are recorded as direct portfolio cash flow.',
    playbook: '1. <b>Capital Segregation:</b> Never co-mingle venture operating funds with personal living money.<br>2. <b>Reinvestment Rule:</b> Funnel 100% of distributed net profits straight into liquid NGX dividend assets or Bamboo USD.<br>3. <b>Illiquidity Hurdle:</b> Demand a 30%+ annual hurdle rate to compensate for lack of secondary market liquidity.',
    benchmarks: 'Every campus venture must demonstrate positive operating cash flow within 90 days of seed funding.'
  },
  dividend_calendar: {
    tag: 'Passive Cash Flow',
    title: 'Annual Dividend Payout Calendar',
    overview: 'Chronological timeline mapping dividend qualification dates and cash distribution days across all portfolio holdings.',
    formula: 'Synchronizes corporate reporting dates (Q1, H1 Interim, Q3, FY Audited Final) with your cashflow planning.',
    playbook: 'Anticipate dividend inflows 30–60 days in advance. Automatically sweep payout distributions into the next scheduled monthly DCA candidate rather than absorbing them into lifestyle spending.',
    benchmarks: 'Key NGX distribution seasons: March/April (Full-Year Final Dividends) and July/August (Half-Year Interim Dividends).'
  },
  watchlist: {
    tag: 'Market Expansion',
    title: 'NGX Breakout Watchlist & Multi-Baggers',
    overview: 'Curated institutional watchlist tracking high-momentum NGX breakout candidates (e.g. SEPLAT, UPDC, BUA Foods, Julius Berger, NGX Group, May & Baker).',
    formula: 'Monitored for multi-month base breakouts, expanding profit margins, and 10M+ daily volume bursts.',
    playbook: 'Differentiate between core DCA holdings and momentum breakouts. Only initiate watchlist positions when price decisively clears overhead resistance on heavy institutional volume.',
    benchmarks: 'Maintain strict stop-loss discipline on breakout trades (exit if price closes below the breakout pivot level).'
  },
  budget_accounts: {
    tag: 'Cash Management',
    title: 'Zero-Based Monthly Cash Flow & Accounts',
    overview: 'A disciplined cash-management framework tracking monthly income, fixed living overhead, discretionary variance, and automated investment allocations.',
    formula: '<code>Total Monthly Inflow = Fixed Expenses + Variable Living + Automated Investment Allocation + Cash Reserves</code>.',
    playbook: 'Assign every incoming naira a designated job before the month begins. Automate the ₦20,000 monthly equity purchase as an untouchable fixed expense line item.',
    benchmarks: 'Keep fixed overhead below 50% of total income to ensure consistent capital accumulation.'
  },
  strategy_blueprint: {
    tag: 'Macro Blueprint',
    title: '2027 Capitalization Blueprint & Directives',
    overview: 'Long-term strategic roadmap governing asset accumulation, banking recapitalization plays, energy sector positioning, and campus venture reinvestment.',
    formula: 'Synthesizes Nigerian macroeconomic structural shifts into actionable portfolio directives.',
    playbook: 'Hold through the recapitalization cycle, compound dividend yields, avoid listing hype, and reinvest venture profits into productive capital.',
    benchmarks: 'Target financial independence through passive dividend and enterprise cash flow matching or exceeding monthly baseline expenses.'
  }
};

/* ─── OPEN EXPLAINER MODAL ─────────────────────────────── */
function openExplainer(key) {
  const item = EXPLAINERS[key];
  if (!item) return;
  const el = $('#explainer');
  el.innerHTML = `
    <div class="exp-scrim"></div>
    <div class="exp-panel" role="dialog" aria-modal="true" aria-labelledby="exp-title">
      <div class="exp-header">
        <div>
          <span class="exp-tag">${esc(item.tag || 'Executive Intelligence')}</span>
          <div class="exp-title" id="exp-title">${esc(item.title)}</div>
        </div>
        <button class="exp-close" id="exp-close" title="Close">${IC.close}</button>
      </div>
      
      <div class="exp-card" style="border-left: 3px solid var(--c-accent); background: var(--c-s2);">
        <div class="exp-card-title">${IC.gem} Executive Overview</div>
        <div>${item.overview}</div>
      </div>

      ${item.formula ? `
      <div class="exp-card">
        <div class="exp-card-title">${IC.chart} Mechanics & Formula</div>
        <div>${item.formula}</div>
      </div>` : ''}

      ${item.playbook ? `
      <div class="exp-card">
        <div class="exp-card-title">${IC.list} Institutional Playbook & Action Guide</div>
        <div>${item.playbook}</div>
      </div>` : ''}

      ${item.benchmarks ? `
      <div class="exp-card" style="border-left: 3px solid var(--c-gain);">
        <div class="exp-card-title" style="color:var(--c-gain);">${IC.dollar} Benchmarks & Targets</div>
        <div>${item.benchmarks}</div>
      </div>` : ''}

      <div class="exp-footer">
        <button class="btn btn-primary" id="exp-done" style="padding: 8px 22px; font-size: 13px;">Got it</button>
      </div>
    </div>
  `;
  el.classList.add('open');
  const close = () => {
    el.classList.remove('open');
    el.innerHTML = '';
    document.removeEventListener('keydown', onEsc);
  };
  function onEsc(e) { if (e.key === 'Escape') close(); }
  document.addEventListener('keydown', onEsc);
  el.querySelector('.exp-scrim').onclick = close;
  $('#exp-close').onclick = close;
  $('#exp-done').onclick = close;
}
