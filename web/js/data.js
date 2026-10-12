'use strict';

// Chart Trajectory Points & Strategy Categories
const CHART_POINTS = {
  ARADEL:     [550, 620, 710, 950, 1200, 1530, 1377],
  UCAP:       [15.2, 16.4, 17.8, 16.5, 17.2, 16.8, 17.05],
  ZENITHBANK: [112, 115, 119, 124, 128, 132, 135.4],
  SEPLAT:     [2300, 2700, 3300, 4100, 4700, 5100, 5350],
  UPDC:       [0.78, 0.95, 1.25, 1.55, 1.85, 2.35, 2.10],
  BUAFOODS:   [190, 230, 275, 330, 370, 400, 415],
  JBERGER:    [90, 105, 122, 148, 165, 195, 186],
  NGXGROUP:   [61, 75, 92, 115, 138, 165, 152],
  TRANSCORP:  [32, 45, 65, 88, 105, 72, 64],
  MAYBAKER:   [22, 25, 30, 36, 45, 41, 43.5],
  NIDF:       [105, 110, 113.4, 128, 142, 155, 162]
};

const CHART_ANALYSES = {
  ARADEL: {
    name: "Aradel Holdings PLC",
    price: 1377.00,
    support: 1250.00,
    resistance: 1530.00,
    ma: "Bullish · 20 EMA (₦1,340) > 50 SMA (₦1,180)",
    status: "Pullback Consolidation",
    statusCol: "var(--c-accent)",
    volume: "Volume dried up on 10% pullback; buyers defending ₦1,250 floor",
    setup: "Healthy 10% limit-down correction from ₦1,530 all-time high. Enlarged portfolio (136k boepd) provides rock-solid valuation floor.",
    action: "Hold tight. Accumulate if testing ₦1,250–₦1,300. Breakout above ₦1,530 targets ₦1,850+."
  },
  UCAP: {
    name: "United Capital PLC",
    price: 17.05,
    support: 15.80,
    resistance: 18.50,
    ma: "Coiling · 20 EMA (₦16.95) converging with 50 SMA (₦17.20)",
    status: "Symmetrical Triangle",
    statusCol: "var(--c-accent)",
    volume: "Watch for 10M+ daily volume burst breaking through ₦18.50 descending trendline",
    setup: "Coiling in multi-month triangle into Q1 2027. Key catalyst: Dangote Refinery IPO advisory and banking recap fees.",
    action: "Aggressive monthly ₦20k DCA in ₦15.80–₦17.50 zone. Confirmed breakout above ₦18.50 targets ₦24.00–₦28.00."
  },
  ZENITHBANK: {
    name: "Zenith Bank PLC",
    price: 135.40,
    support: 122.00,
    resistance: 145.00,
    ma: "Bullish Stack · 20 EMA (₦130.20) > 50 SMA (₦124.00) ascending",
    status: "Bullish Stair-Step",
    statusCol: "var(--c-gain)",
    volume: "High institutional demand following H1 ₦637bn PBT release",
    setup: "Dominant Tier-1 bank with ₦614.65bn capital base. Legendary ₦10/share dividend baseline protected.",
    action: "Dips to ₦122–₦128 are prime buy zones. Breakout above ₦145 opens blue-sky runway to ₦180–₦200."
  },
  SEPLAT: {
    name: "Seplat Energy PLC",
    price: 5350.00,
    support: 4800.00,
    resistance: 5800.00,
    ma: "Strong Bullish · Extended above rising 20 EMA (₦5,100)",
    status: "+134% Uptrend",
    statusCol: "var(--c-gain)",
    volume: "Institutional block orders soaking up supply on minor dips",
    setup: "Up +134% since Dec 2025 entry. MPNU asset acquisition integration providing relentless tailwinds.",
    action: "Wait for pullbacks to 20 EMA (₦5,000–₦5,100) rather than chasing at resistance. Breakout above ₦5,800 targets ₦6,500."
  },
  UPDC: {
    name: "UPDC REIT / PLC",
    price: 2.10,
    support: 1.65,
    resistance: 2.45,
    ma: "Bullish · 20 EMA sharply leading 50 SMA",
    status: "+170% Momentum",
    statusCol: "var(--c-gain)",
    volume: "3.5x volume expansion breaking out of multi-year base",
    setup: "Up +170% in less than 12 months. Massive NAV discount closure as real estate portfolio repriced for inflation.",
    action: "Support floor at ₦1.65 is the stop reference. Breakout above ₦2.45 targets ₦3.00–₦3.20."
  },
  BUAFOODS: {
    name: "BUA Foods PLC",
    price: 415.00,
    support: 365.00,
    resistance: 445.00,
    ma: "Steady Ascending · Well above 50 SMA (₦370)",
    status: "+120% Leader",
    statusCol: "var(--c-gain)",
    volume: "Low free float enables clean stair-step breakout moves on moderate volume",
    setup: "Up +120% in 2026. Dominant staple food consumer volume with inelastic pricing power.",
    action: "Trailing stop at ₦365. Breakout above ₦445 continuation targets ₦500 psychological barrier."
  },
  JBERGER: {
    name: "Julius Berger Nigeria",
    price: 186.00,
    support: 155.00,
    resistance: 210.00,
    ma: "Bullish · 20 EMA (₦178) holding on daily closes",
    status: "+108% Breakout",
    statusCol: "var(--c-gain)",
    volume: "High volume breakout on infrastructure contract announcements",
    setup: "Up +108% in 2026. Construction backlog indexed to currency adjustments.",
    action: "Key buying range: ₦160–₦175 retest. Breakout above ₦210 targets ₦240."
  },
  NGXGROUP: {
    name: "Nigerian Exchange Group",
    price: 152.00,
    support: 125.00,
    resistance: 168.00,
    ma: "Bullish Momentum · Multi-month uptrend intact from ₦61 base",
    status: "+120% Compounder",
    statusCol: "var(--c-gain)",
    volume: "Volume directly spikes alongside market-wide trading turnover",
    setup: "Up +120% from ₦61 entry in December. Primary beneficiary of Dangote IPO and bank recap liquidity waves.",
    action: "Accumulate on pullbacks near ₦130. Breakout above ₦168 retests ₦185–₦200."
  },
  TRANSCORP: {
    name: "Transnational Corp",
    price: 64.00,
    support: 55.00,
    resistance: 78.00,
    ma: "Consolidation / Basing · Testing 50 SMA support",
    status: "Secondary Base",
    statusCol: "var(--c-accent)",
    volume: "Volume contracting following violent pullback from ₦100+ peak",
    setup: "Peaked +145% earlier in year. Currently building secondary accumulation base above ₦55 support floor.",
    action: "High reward/risk entry near ₦56–₦60 with tight stop below ₦53. Breakout above ₦78 targets ₦95 retest."
  },
  MAYBAKER: {
    name: "May & Baker Nigeria",
    price: 43.50,
    support: 36.50,
    resistance: 48.00,
    ma: "Flag Consolidation · 20 EMA and 50 SMA bullish cross confirmed",
    status: "Bull Flag Pattern",
    statusCol: "var(--c-gain)",
    volume: "Volume drying up inside ₦40–₦45 bull flag pattern",
    setup: "Up +100% in under 2 months from late-Dec entry to Feb ₦45 peak. Consolidating gains calmly.",
    action: "Enter inside ₦40–₦44 bull flag. Volume breakout above ₦48 targets ₦56–₦60."
  },
  NIDF: {
    name: "Nigeria Infrastructure Debt Fund",
    price: 113.40,
    support: 152.00,
    resistance: 170.00,
    ma: "Ascending Floor · Low volatility capital stability",
    status: "42% Discount Arbitrage",
    statusCol: "var(--c-gain)",
    volume: "Public offer volume locks in 42% discount (₦113.40 vs ₦162 secondary)",
    setup: "15.5%–16% quarterly dividend yield (₦4.40/qtr). 6–7 year full payback horizon purely from dividends.",
    action: "Subscribe via Public Offer before late-October close to lock in ₦48.60/unit instant arbitrage spread."
  }
};

const ANALYSES = {
  UCAP: `<b>Fundamental Thesis:</b> UCAP is a premier tier-2 investment bank capturing massive advisory fees from bank recaps & the Dangote Refinery IPO.<br>
  <div style="margin-top:8px;padding:8px 10px;background:var(--c-s2);border-radius:6px;border:1px solid var(--c-border);font-size:12px;line-height:1.5;">
    <div><b>Chart Setup:</b> Symmetrical triangle coiling near ₦17.05</div>
    <div><b>Support Floor:</b> ₦15.80 · <b>Resistance:</b> ₦18.50</div>
    <div><b>Moving Averages:</b> 20 EMA (₦16.95) converging with 50 SMA (₦17.20)</div>
    <div><b>Volume Trigger:</b> Watch for 10M+ daily volume burst through ₦18.50</div>
    <div><b>Breakout Target:</b> ₦24.00 – ₦28.00 into Q1 2027</div>
  </div>`,
  ZENITHBANK: `<b>Fundamental Thesis:</b> Nigeria's most profitable tier-1 bank. Capital base of ₦614.65bn easily cleared recapitalization, protecting ₦10/share dividend baseline.<br>
  <div style="margin-top:8px;padding:8px 10px;background:var(--c-s2);border-radius:6px;border:1px solid var(--c-border);font-size:12px;line-height:1.5;">
    <div><b>Chart Setup:</b> Bullish stair-step trend following H1 ₦637bn PBT breakout</div>
    <div><b>Support Floor:</b> ₦122.00 · <b>Resistance:</b> ₦145.00</div>
    <div><b>Moving Averages:</b> Bullish Stack · 20 EMA (₦130.20) > 50 SMA (₦124.00)</div>
    <div><b>Volume Trigger:</b> High institutional accumulation on dips</div>
    <div><b>Breakout Target:</b> ₦145+ breakout opens run to ₦180 – ₦200</div>
  </div>`,
  ARADEL: `<b>Fundamental Thesis:</b> Upstream super-major. Enlarged portfolio generates 136,568 boepd with 594.3 mmboe 2P reserves and ₦33/share dividend.<br>
  <div style="margin-top:8px;padding:8px 10px;background:var(--c-s2);border-radius:6px;border:1px solid var(--c-border);font-size:12px;line-height:1.5;">
    <div><b>Chart Setup:</b> Healthy 10% pullback off all-time high (₦1,530) to ₦1,377</div>
    <div><b>Support Floor:</b> ₦1,250.00 · <b>Resistance:</b> ₦1,530.00 ATH</div>
    <div><b>Moving Averages:</b> Bullish · 20 EMA (₦1,340) > 50 SMA (₦1,180)</div>
    <div><b>Volume Trigger:</b> Volume dried up on the pullback; buyers defending ₦1,250</div>
    <div><b>Breakout Target:</b> Re-test of ₦1,530 targets ₦1,850 – ₦2,000</div>
  </div>`,
  NOBEL: `<b>Fixed-Income Liquidity Tranche:</b> ₦216,840 allocated in structured capital pooling. Expected maturity payout: ~₦390,000 – ₦500,000 (Oct 2026 – Feb 2027) yielding capital expansion to buffer cash reserves without liquidating public equities.`,
  P1MILLION: `<b>Private Venture Capital Allocation:</b> ₦400,000 active working seed capital in private enterprise. Cash distributions and dividend yield systematically funneled into NGX compounding equities (UCAP, Aradel).`,
};
