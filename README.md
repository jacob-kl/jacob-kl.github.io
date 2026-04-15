# jacob-kl.github.io<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>12-Week Class Program</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #0e0e0f;
    --surface: #16171a;
    --surface2: #1e1f24;
    --border: #2a2b32;
    --accent: #e8c547;
    --accent2: #4fc3a1;
    --accent3: #e85d47;
    --text: #e8e6df;
    --muted: #7a7870;
    --meso1: #4fc3a1;
    --meso2: #e8c547;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    line-height: 1.6;
    min-height: 100vh;
  }

  /* HEADER */
  .hero {
    padding: 60px 40px 40px;
    border-bottom: 1px solid var(--border);
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content: 'LIFT';
    position: absolute;
    right: -20px;
    top: -30px;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 220px;
    color: rgba(255,255,255,0.02);
    pointer-events: none;
    letter-spacing: -5px;
  }
  .hero-label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 3px;
    color: var(--accent);
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  h1 {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(48px, 8vw, 88px);
    letter-spacing: 2px;
    line-height: 0.95;
    color: var(--text);
  }
  h1 span { color: var(--accent); }
  .hero-meta {
    display: flex;
    gap: 32px;
    margin-top: 24px;
    flex-wrap: wrap;
  }
  .meta-pill {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
    border: 1px solid var(--border);
    padding: 6px 14px;
    border-radius: 2px;
  }
  .meta-pill strong { color: var(--text); }

  /* OVERVIEW GRID */
  .overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1px;
    background: var(--border);
    border-bottom: 1px solid var(--border);
  }
  .overview-card {
    background: var(--surface);
    padding: 28px 32px;
  }
  .overview-card h3 {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 10px;
  }
  .overview-card p {
    font-size: 14px;
    color: var(--text);
    line-height: 1.7;
  }
  .overview-card .big {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 48px;
    color: var(--accent);
    line-height: 1;
    margin-bottom: 4px;
  }

  /* SCALING NOTE */
  .scaling-banner {
    background: var(--surface2);
    border-left: 3px solid var(--accent2);
    padding: 20px 32px;
    margin: 0;
  }
  .scaling-banner h3 {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--accent2);
    margin-bottom: 8px;
  }
  .scaling-banner p { font-size: 13px; color: var(--muted); }
  .scaling-banner strong { color: var(--text); }

  /* MESO HEADER */
  .meso-header {
    padding: 40px 40px 20px;
    display: flex;
    align-items: baseline;
    gap: 20px;
    border-bottom: 1px solid var(--border);
  }
  .meso-num {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 72px;
    line-height: 1;
    opacity: 0.15;
  }
  .meso-num.m1 { color: var(--meso1); }
  .meso-num.m2 { color: var(--meso2); }
  .meso-info h2 {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 32px;
    letter-spacing: 1px;
  }
  .meso-info h2.m1 { color: var(--meso1); }
  .meso-info h2.m2 { color: var(--meso2); }
  .meso-info p {
    font-size: 13px;
    color: var(--muted);
    max-width: 600px;
    margin-top: 4px;
  }

  /* WEEK TABS */
  .week-nav {
    display: flex;
    gap: 0;
    padding: 0 40px;
    border-bottom: 1px solid var(--border);
    overflow-x: auto;
  }
  .week-btn {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    padding: 16px 20px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
  }
  .week-btn:hover { color: var(--text); }
  .week-btn.active { color: var(--accent); border-bottom-color: var(--accent); }
  .week-btn.active.m1 { color: var(--meso1); border-bottom-color: var(--meso1); }
  .week-btn.active.m2 { color: var(--meso2); border-bottom-color: var(--meso2); }

  /* WEEK CONTENT */
  .week-content { display: none; padding: 32px 40px; }
  .week-content.visible { display: block; }

  .days-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  @media (max-width: 860px) {
    .days-grid { grid-template-columns: 1fr; }
    .hero, .week-nav, .week-content, .meso-header { padding-left: 20px; padding-right: 20px; }
    .overview-card { padding: 20px; }
  }

  .day-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    overflow: hidden;
  }
  .day-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }
  .day-label {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px;
    letter-spacing: 1px;
  }
  .day-label.mon { color: var(--meso1); }
  .day-label.thu { color: var(--accent); }
  .day-focus {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
  }

  /* EXERCISE TABLE */
  .ex-table { width: 100%; border-collapse: collapse; }
  .ex-table thead tr {
    background: var(--surface2);
  }
  .ex-table th {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
    padding: 8px 12px;
    text-align: left;
    font-weight: 400;
  }
  .ex-table tbody tr {
    border-bottom: 1px solid var(--border);
    transition: background 0.15s;
  }
  .ex-table tbody tr:hover { background: var(--surface2); }
  .ex-table tbody tr:last-child { border-bottom: none; }
  .ex-table td {
    padding: 11px 12px;
    font-size: 13px;
    vertical-align: top;
  }
  .ex-name { color: var(--text); font-weight: 400; }
  .ex-sets {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: var(--accent2);
    white-space: nowrap;
  }
  .ex-load {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: var(--accent);
    white-space: nowrap;
  }
  .ex-note { font-size: 11px; color: var(--muted); line-height: 1.5; }
  .tag-beginner {
    display: inline-block;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 1px;
    text-transform: uppercase;
    background: rgba(79,195,161,0.12);
    color: var(--accent2);
    border: 1px solid rgba(79,195,161,0.25);
    padding: 2px 6px;
    border-radius: 2px;
    margin-top: 3px;
  }
  .tag-peak {
    display: inline-block;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 1px;
    text-transform: uppercase;
    background: rgba(232,197,71,0.12);
    color: var(--accent);
    border: 1px solid rgba(232,197,71,0.25);
    padding: 2px 6px;
    border-radius: 2px;
    margin-top: 3px;
  }
  .tag-hard {
    display: inline-block;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 1px;
    text-transform: uppercase;
    background: rgba(232,93,71,0.12);
    color: var(--accent3);
    border: 1px solid rgba(232,93,71,0.25);
    padding: 2px 6px;
    border-radius: 2px;
    margin-top: 3px;
  }

  /* WEEK INTENT */
  .week-intent {
    background: var(--surface2);
    border-left: 3px solid var(--border);
    padding: 14px 20px;
    margin-bottom: 24px;
    border-radius: 0 4px 4px 0;
  }
  .week-intent.m1 { border-left-color: var(--meso1); }
  .week-intent.m2 { border-left-color: var(--meso2); }
  .week-intent.deload { border-left-color: var(--muted); }
  .week-intent.peak { border-left-color: var(--accent3); }
  .week-intent h4 {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .week-intent h4.m1 { color: var(--meso1); }
  .week-intent h4.m2 { color: var(--meso2); }
  .week-intent h4.deload { color: var(--muted); }
  .week-intent h4.peak { color: var(--accent3); }
  .week-intent p { font-size: 13px; color: var(--muted); }

  /* SECTION DIVIDER */
  .section-divider {
    border: none;
    border-top: 1px solid var(--border);
    margin: 40px 0 0;
  }

  /* FOOTER */
  footer {
    padding: 32px 40px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: gap;
  }
  footer p {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 1px;
  }

  /* PRINT */
  @media print {
    body { background: white; color: black; }
    .week-content { display: block !important; }
    .week-nav { display: none; }
  }
</style>
</head>
<body>

<div class="hero">
  <div class="hero-label">Crossfit Crumville Kilo Club · Class Program</div>
  <h1>12-WEEK<br><span>PEAK</span><br>CYCLE</h1>
  <div class="hero-meta">
    <div class="meta-pill"><strong>2</strong> Days / Week</div>
    <div class="meta-pill"><strong>Thursday + Monday</strong></div>
    <div class="meta-pill"><strong>12 Week Cycle</strong> </div>
    <div class="meta-pill">Goal: <strong>Max Snatch/Clean and Jerk</strong></div>
     <div class="meta-pill">Dates: <strong>March 15, 2025 – June 6, 2025</strong></div>

  </div>
</div>

<div class="overview">
  <div class="overview-card">
    <h3> Weeks 1–6</h3>
    <div class="big" style="color:var(--meso1)">ACCUMULATION</div>
    <p>Accumulation & technical development. Higher volume, positional pulls, paused variations, back squat base. Athletes learn movement patterns and build work capacity.</p>
  </div>
  <div class="overview-card">
    <h3> Weeks 7–12</h3>
    <div class="big" style="color:var(--meso2)">PEAK</div>
    <p>Intensification & competition prep. Volume drops, intensity climbs. Competition lifts dominate. Week 12 is max-out week — athletes attempt new 1RMs.</p>
  </div>
  <div class="overview-card">
    <h3>Day Structure</h3>
    <p><strong>Thursday</strong> — Snatch focus + front/overhead squat<br><strong>Monday</strong> — Clean &amp; Jerk focus + back squat + accessory</p>
  </div>
  <div class="overview-card">
    <h3>Load Notation</h3>
    <p>All loads are <strong>% of athlete's 1RM</strong>. Beginners without a true 1RM should use a challenging but technically clean working weight. Red numbers = optional heavier attempt for advanced athletes.</p>
  </div>
</div>

<div class="scaling-banner">
  <h3>Beginner Scaling Guide</h3>
  <p><strong>No 1RM?</strong> Use a weight where you can maintain full technique for all sets. Add 2.5–5 lbs per week if form holds. <strong>Paused/tempo variations</strong> should feel slow and controlled — drop weight 10–15% from your normal working load. <strong>Skip complex combinations</strong> (e.g. 3-position lifts) if new — do the competition lift instead at the same load.</p>
</div>

<!-- ===================== MESOCYCLE 1 ===================== -->
<div class="meso-header">
  <div class="meso-num m1">01</div>
  <div class="meso-info">
    <h2 class="m1">WEEKS 1-6 — ACCUMULATION</h2>
    <p>Weeks 1–6 · Technical Volume · Building the Base · Mon + Thu</p>
  </div>
</div>

<div class="week-nav" id="nav-m1">
  <button class="week-btn active m1" onclick="showWeek('m1',1,this)">Week 1</button>
  <button class="week-btn" onclick="showWeek('m1',2,this)">Week 2</button>
  <button class="week-btn" onclick="showWeek('m1',3,this)">Week 3</button>
  <button class="week-btn" onclick="showWeek('m1',4,this)">Week 4</button>
  <button class="week-btn" onclick="showWeek('m1',5,this)">Week 5</button>
  <button class="week-btn" onclick="showWeek('m1',6,this)">Week 6 — Deload</button>
</div>

<!-- M1 W1 -->
<div class="week-content visible" id="m1-w1">
  <div class="week-intent m1">
    <h4 class="m1">Week 1 · Orientation</h4>
    <p>Establish baseline loads. Focus is technique over weight. Athletes should feel comfortable and confident — not maxed out.</p>
  </div>
  <div class="days-grid">
    <div class="day-card">
      <div class="day-header">
        <div class="day-label mon">THURSDAY</div>
        <div class="day-focus">Snatch Focus</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Exercise</th><th>Sets×Reps</th><th>Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">Snatch High Hang + Hang Snatch</td><td class="ex-sets">4×(1+1)</td><td class="ex-load">65–70%</td><td class="ex-note">Pause 2s in hang. Beginners: hang snatch only<div class="tag-beginner">Scale</div></td></tr>
          <tr><td class="ex-name">Snatch Pull</td><td class="ex-sets">4×3</td><td class="ex-load">90–95%</td><td class="ex-note">Focus on position at knee and hip</td></tr>
          <tr><td class="ex-name">Power Clean + Push Jerk</td><td class="ex-sets">5×1</td><td class="ex-load">70%</td><td class="ex-note">Land in partial squat </td></tr>
          <tr><td class="ex-name">Overhead Squat</td><td class="ex-sets">5×2</td><td class="ex-load">65%</td><td class="ex-note">3s descent. Bar must stay over mid-foot<div class="tag-beginner">Core movement — all athletes</div></td></tr>
          <tr><td class="ex-name">Back Extension</td><td class="ex-sets">3×10</td><td class="ex-load">Bodyweight</td><td class="ex-note">Slow and controlled</td></tr>
        </tbody>
      </table>
    </div>
    <div class="day-card">
      <div class="day-header">
        <div class="day-label thu">MONDAY</div>
        <div class="day-focus">Clean &amp; Jerk Focus</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Exercise</th><th>Sets×Reps</th><th>Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">High Hang Clean + Front Squat</td><td class="ex-sets">4×(1+2)</td><td class="ex-load">65%</td><td class="ex-note">Drop between reps. Pause in catch<div class="tag-beginner">Scale</div></td></tr>
          <tr><td class="ex-name">Clean Pull</td><td class="ex-sets">4×3</td><td class="ex-load">90–95%</td><td class="ex-note">Match snatch pull mechanics</td></tr>
          <tr><td class="ex-name">Split jerk</td><td class="ex-sets">4×3</td><td class="ex-load">65–70%</td><td class="ex-note">Dip = knee only, no torso. Beginners: strict press<div class="tag-beginner">Scale to strict</div></td></tr>
          <tr><td class="ex-name">Slow pull power clean</td><td class="ex-sets">5×2</td><td class="ex-load">70%</td><td class="ex-note">Slow pull to mid-thigh. Feel weight even across feet, then explode.</td></tr>

          <tr><td class="ex-name">Back Squat</td><td class="ex-sets">4×4</td><td class="ex-load">70%</td><td class="ex-note">Controlled descent, full depth</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- M1 W2 -->
<div class="week-content" id="m1-w2">
  <div class="week-intent m1">
    <h4 class="m1">Week 2 · Building</h4>
    <p>Add 3–5% to all working loads. Introduce first positional variation. Volume stays the same.</p>
  </div>
  <div class="days-grid">
    <div class="day-card">
      <div class="day-header">
        <div class="day-label mon">THURSDAY</div>
        <div class="day-focus">Snatch Focus</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Exercise</th><th>Sets×Reps</th><th>Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">3-Position Snatch (High Hang → Hang → Floor)</td><td class="ex-sets">5×1</td><td class="ex-load">65–68%</td><td class="ex-note">One rep from each position. Beginners: 2-position (hang + floor)<div class="tag-beginner">Scale to 2-pos</div></td></tr>
          <tr><td class="ex-name">Snatch Pull</td><td class="ex-sets">4×3</td><td class="ex-load">95–100%</td><td class="ex-note">Full extension, shrug at top</td></tr>
          <tr><td class="ex-name">Overhead Squat</td><td class="ex-sets">5×2</td><td class="ex-load">68–70%</td><td class="ex-note">Pause 2s at bottom</td></tr>
          <tr><td class="ex-name">Snatch Balance</td><td class="ex-sets">4×2</td><td class="ex-load">50–60%</td><td class="ex-note">Aggressive drop under. Beginners: heaving snatch balance<div class="tag-beginner">Scale</div></td></tr>
          <tr><td class="ex-name">Back Extension</td><td class="ex-sets">3×10</td><td class="ex-load">+light bar</td><td class="ex-note"></td></tr>
        </tbody>
      </table>
    </div>
    <div class="day-card">
      <div class="day-header">
        <div class="day-label thu">MONDAY</div>
        <div class="day-focus">Clean &amp; Jerk Focus</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Exercise</th><th>Sets×Reps</th><th>Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">Hang Clean + Clean</td><td class="ex-sets">5×(1+1)</td><td class="ex-load">68–72%</td><td class="ex-note">Touch-and-go from hang<div class="tag-beginner">Scale to clean only</div></td></tr>
          <tr><td class="ex-name">Clean Pull</td><td class="ex-sets">4×3</td><td class="ex-load">95–100%</td><td class="ex-note"></td></tr>
          <tr><td class="ex-name">Split Jerk</td><td class="ex-sets">5×2</td><td class="ex-load">65–70%</td><td class="ex-note">Pause 2s in split. Check front foot alignment<div class="tag-beginner">Focus on footwork</div></td></tr>
          <tr><td class="ex-name">Back Squat</td><td class="ex-sets">4×4</td><td class="ex-load">73–75%</td><td class="ex-note">+3% from week 1</td></tr>
          <tr><td class="ex-name">Romanian Deadlift</td><td class="ex-sets">3×6</td><td class="ex-load">Moderate</td><td class="ex-note">Hamstring stretch at bottom</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- M1 W3 -->
<div class="week-content" id="m1-w3">
  <div class="week-intent m1">
    <h4 class="m1">Week 3 · Loading</h4>
    <p>Highest volume week of meso 1. Loads bump again. Introduce pause work in the clean to reinforce positions.</p>
  </div>
  <div class="days-grid">
    <div class="day-card">
      <div class="day-header">
        <div class="day-label mon">THURSDAY</div>
        <div class="day-focus">Snatch Focus</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Exercise</th><th>Sets×Reps</th><th>Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">Snatch (Competition)</td><td class="ex-sets">6×1</td><td class="ex-load">72–76%</td><td class="ex-note">No variation — clean competition lift from floor</td></tr>
          <tr><td class="ex-name">Hang Snatch (Below Knee)</td><td class="ex-sets">4×2</td><td class="ex-load">68%</td><td class="ex-note">Reinforce lam sweep position<div class="tag-beginner">Scale to hang above knee</div></td></tr>
          <tr><td class="ex-name">Snatch Pull</td><td class="ex-sets">5×3</td><td class="ex-load">100–105%</td><td class="ex-note">Above max snatch — pure strength pull</td></tr>
          <tr><td class="ex-name">Overhead Squat</td><td class="ex-sets">5×3</td><td class="ex-load">68–72%</td><td class="ex-note">Higher reps = more time under tension</td></tr>
          <tr><td class="ex-name">Good Morning</td><td class="ex-sets">3×8</td><td class="ex-load">Light–Moderate</td><td class="ex-note"></td></tr>
        </tbody>
      </table>
    </div>
    <div class="day-card">
      <div class="day-header">
        <div class="day-label thu">MONDAY</div>
        <div class="day-focus">Clean &amp; Jerk Focus</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Exercise</th><th>Sets×Reps</th><th>Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">Clean w/ 2s Pause at Knee</td><td class="ex-sets">5×2</td><td class="ex-load">68–72%</td><td class="ex-note">Pause = feel lats, chest tall<div class="tag-beginner">Great for all levels</div></td></tr>
          <tr><td class="ex-name">Clean Pull</td><td class="ex-sets">5×3</td><td class="ex-load">100–105%</td><td class="ex-note"></td></tr>
          <tr><td class="ex-name">Jerk (from rack)</td><td class="ex-sets">5×2</td><td class="ex-load">70–74%</td><td class="ex-note">Focus on receiving position depth</td></tr>
          <tr><td class="ex-name">Back Squat</td><td class="ex-sets">5×3</td><td class="ex-load">76–78%</td><td class="ex-note">Peak squat volume week</td></tr>
          <tr><td class="ex-name">Bulgarian Split Squat</td><td class="ex-sets">3×8</td><td class="ex-load">Bodyweight–Light</td><td class="ex-note">Unilateral balance work</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- M1 W4 -->
<div class="week-content" id="m1-w4">
  <div class="week-intent m1">
    <h4 class="m1">Week 4 · Strength Push</h4>
    <p>Continue building squat strength. Introduce first heavier singles on the competition lifts — still technical, not maximal.</p>
  </div>
  <div class="days-grid">
    <div class="day-card">
      <div class="day-header">
        <div class="day-label mon">THURSDAY</div>
        <div class="day-focus">Snatch Focus</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Exercise</th><th>Sets×Reps</th><th>Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">Snatch</td><td class="ex-sets">5×1 + 1×1</td><td class="ex-load">75% / 80%</td><td class="ex-note">5 sets at 75%, then one at 80%. Beginners: stay at 75% for all 6<div class="tag-beginner">No extra set</div></td></tr>
          <tr><td class="ex-name">Power Snatch + OHS</td><td class="ex-sets">4×(1+2)</td><td class="ex-load">65%</td><td class="ex-note">Land in power position, then squat the OHS</td></tr>
          <tr><td class="ex-name">Snatch Pull</td><td class="ex-sets">4×3</td><td class="ex-load">100–105%</td><td class="ex-note"></td></tr>
          <tr><td class="ex-name">Front Squat</td><td class="ex-sets">4×3</td><td class="ex-load">78–80%</td><td class="ex-note">Introduce front squat in place of OHS today</td></tr>
          <tr><td class="ex-name">Back Extension</td><td class="ex-sets">3×10</td><td class="ex-load">+light plate</td><td class="ex-note"></td></tr>
        </tbody>
      </table>
    </div>
    <div class="day-card">
      <div class="day-header">
        <div class="day-label thu">MONDAY</div>
        <div class="day-focus">Clean &amp; Jerk Focus</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Exercise</th><th>Sets×Reps</th><th>Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">Clean &amp; Jerk</td><td class="ex-sets">5×1 + 1×1</td><td class="ex-load">75% / 80%</td><td class="ex-note">First heavy C&J single of the cycle<div class="tag-beginner">Stay at 75%</div></td></tr>
          <tr><td class="ex-name">Clean Pull</td><td class="ex-sets">4×3</td><td class="ex-load">100–105%</td><td class="ex-note"></td></tr>
          <tr><td class="ex-name">Jerk Dip + Drive (from rack)</td><td class="ex-sets">4×3</td><td class="ex-load">75%</td><td class="ex-note">No catch — focus on vertical dip and powerful drive<div class="tag-beginner">Great drill for all</div></td></tr>
          <tr><td class="ex-name">Back Squat</td><td class="ex-sets">5×3</td><td class="ex-load">78–80%</td><td class="ex-note"></td></tr>
          <tr><td class="ex-name">Good Morning</td><td class="ex-sets">3×8</td><td class="ex-load">Moderate</td><td class="ex-note"></td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- M1 W5 -->
<div class="week-content" id="m1-w5">
  <div class="week-intent m1">
    <h4 class="m1">Week 5 · Accumulation Peak</h4>
    <p>Final loading week before deload. Push squat intensity. Athletes should feel challenged but not broken. Heavier optional singles for advanced athletes.</p>
  </div>
  <div class="days-grid">
    <div class="day-card">
      <div class="day-header">
        <div class="day-label mon">THURSDAY</div>
        <div class="day-focus">Snatch Focus</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Exercise</th><th>Sets×Reps</th><th>Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">Snatch</td><td class="ex-sets">4×1 + 2×1</td><td class="ex-load">76% / 82%</td><td class="ex-note">4 at 76%, 2 heavy at 82%. Advanced only on 82%<div class="tag-hard">Advanced</div></td></tr>
          <tr><td class="ex-name">Hang Snatch (above knee)</td><td class="ex-sets">4×2</td><td class="ex-load">70%</td><td class="ex-note"></td></tr>
          <tr><td class="ex-name">Snatch Pull</td><td class="ex-sets">5×3</td><td class="ex-load">105–110%</td><td class="ex-note">Heaviest pulls of meso 1</td></tr>
          <tr><td class="ex-name">Overhead Squat</td><td class="ex-sets">4×3</td><td class="ex-load">72–74%</td><td class="ex-note"></td></tr>
          <tr><td class="ex-name">Back Extension</td><td class="ex-sets">3×10</td><td class="ex-load">Light plate</td><td class="ex-note"></td></tr>
        </tbody>
      </table>
    </div>
    <div class="day-card">
      <div class="day-header">
        <div class="day-label thu">MONDAY</div>
        <div class="day-focus">Clean &amp; Jerk Focus</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Exercise</th><th>Sets×Reps</th><th>Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">Clean &amp; Jerk</td><td class="ex-sets">4×1 + 2×1</td><td class="ex-load">77% / 83%</td><td class="ex-note">Advanced: attempt 83% singles<div class="tag-hard">Advanced</div></td></tr>
          <tr><td class="ex-name">Clean Pull</td><td class="ex-sets">5×3</td><td class="ex-load">105–110%</td><td class="ex-note"></td></tr>
          <tr><td class="ex-name">Jerk from Rack</td><td class="ex-sets">5×2</td><td class="ex-load">74–76%</td><td class="ex-note">Crisp lockout each rep</td></tr>
          <tr><td class="ex-name">Back Squat</td><td class="ex-sets">4×2 + 1×1</td><td class="ex-load">80% / 85%</td><td class="ex-note">First heavy squat single<div class="tag-beginner">Skip the single</div></td></tr>
          <tr><td class="ex-name">Bulgarian Split Squat</td><td class="ex-sets">3×8</td><td class="ex-load">Moderate</td><td class="ex-note"></td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- M1 W6 DELOAD -->
<div class="week-content" id="m1-w6">
  <div class="week-intent deload">
    <h4 class="deload">Week 6 · Deload / Transition</h4>
    <p>Drop volume by 40%, keep intensity moderate (65–70%). Goal is freshness heading into Meso 2. No new PRs this week. Great time to drill technique.</p>
  </div>
  <div class="days-grid">
    <div class="day-card">
      <div class="day-header">
        <div class="day-label mon">THURSDAY</div>
        <div class="day-focus">Snatch / Technique</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Exercise</th><th>Sets×Reps</th><th>Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">Snatch (competition)</td><td class="ex-sets">4×1</td><td class="ex-load">68–72%</td><td class="ex-note">Feel the lift. No grinding</td></tr>
          <tr><td class="ex-name">Power Snatch</td><td class="ex-sets">3×2</td><td class="ex-load">60–65%</td><td class="ex-note">Light and fast</td></tr>
          <tr><td class="ex-name">Overhead Squat</td><td class="ex-sets">3×3</td><td class="ex-load">60–65%</td><td class="ex-note"></td></tr>
          <tr><td class="ex-name">Back Extension</td><td class="ex-sets">2×10</td><td class="ex-load">Light</td><td class="ex-note"></td></tr>
        </tbody>
      </table>
    </div>
    <div class="day-card">
      <div class="day-header">
        <div class="day-label thu">MONDAY</div>
        <div class="day-focus">C&amp;J / Technique</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Exercise</th><th>Sets×Reps</th><th>Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">Clean &amp; Jerk</td><td class="ex-sets">4×1</td><td class="ex-load">68–72%</td><td class="ex-note">Smooth. Video your athletes this week</td></tr>
          <tr><td class="ex-name">Jerk from Rack</td><td class="ex-sets">3×2</td><td class="ex-load">65%</td><td class="ex-note">Footwork drill focus</td></tr>
          <tr><td class="ex-name">Back Squat</td><td class="ex-sets">3×3</td><td class="ex-load">65–68%</td><td class="ex-note">Easy and fluid</td></tr>
          <tr><td class="ex-name">Good Morning</td><td class="ex-sets">2×8</td><td class="ex-load">Light</td><td class="ex-note"></td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- ===================== MESOCYCLE 2 ===================== -->
<hr class="section-divider">
<div class="meso-header">
  <div class="meso-num m2">02</div>
  <div class="meso-info">
    <h2 class="m2">WEEKS 7-12 — INTENSIFICATION & PEAK</h2>
    <p>Weeks 7–12 · Heavy Singles · Competition Prep · Max Attempts Week 12</p>
  </div>
</div>

<div class="week-nav" id="nav-m2">
  <button class="week-btn active m2" onclick="showWeek('m2',7,this)">Week 7</button>
  <button class="week-btn" onclick="showWeek('m2',8,this)">Week 8</button>
  <button class="week-btn" onclick="showWeek('m2',9,this)">Week 9</button>
  <button class="week-btn" onclick="showWeek('m2',10,this)">Week 10</button>
  <button class="week-btn" onclick="showWeek('m2',11,this)">Week 11 — Taper</button>
  <button class="week-btn" onclick="showWeek('m2',12,this)">Week 12 — MAX OUT</button>
</div>

<!-- M2 W7 -->
<div class="week-content visible" id="m2-w7">
  <div class="week-intent m2">
    <h4 class="m2">Week 7 · Intensification Entry</h4>
    <p>Volume drops ~20% from meso 1 peak. Singles get heavier (85%+). Squat work shifts toward heavier triples and doubles.</p>
  </div>
  <div class="days-grid">
    <div class="day-card">
      <div class="day-header">
        <div class="day-label mon">THURSDAY</div>
        <div class="day-focus">Snatch Focus</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Exercise</th><th>Sets×Reps</th><th>Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">Snatch</td><td class="ex-sets">5×1</td><td class="ex-load">80–82%</td><td class="ex-note">All competition lifts now. No variations as primary<div class="tag-peak">Meso 2</div></td></tr>
          <tr><td class="ex-name">Hang Snatch (above knee)</td><td class="ex-sets">3×2</td><td class="ex-load">70%</td><td class="ex-note">Warm-down / technique reinforcement</td></tr>
          <tr><td class="ex-name">Snatch Pull</td><td class="ex-sets">4×2</td><td class="ex-load">105%</td><td class="ex-note">Drop reps, keep intensity</td></tr>
          <tr><td class="ex-name">Front Squat</td><td class="ex-sets">4×3</td><td class="ex-load">80–82%</td><td class="ex-note">Front squat becomes primary squat pattern Mon</td></tr>
          <tr><td class="ex-name">Back Extension</td><td class="ex-sets">3×10</td><td class="ex-load">Light plate</td><td class="ex-note"></td></tr>
        </tbody>
      </table>
    </div>
    <div class="day-card">
      <div class="day-header">
        <div class="day-label thu">MONDAY</div>
        <div class="day-focus">Clean &amp; Jerk Focus</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Exercise</th><th>Sets×Reps</th><th>Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">Clean &amp; Jerk</td><td class="ex-sets">5×1</td><td class="ex-load">80–82%</td><td class="ex-note">Competition C&J. Crisp jerk lockout<div class="tag-peak">Meso 2</div></td></tr>
          <tr><td class="ex-name">Clean Pull</td><td class="ex-sets">4×2</td><td class="ex-load">105%</td><td class="ex-note"></td></tr>
          <tr><td class="ex-name">Jerk from Rack</td><td class="ex-sets">4×2</td><td class="ex-load">78%</td><td class="ex-note">Volume jerk work for confidence</td></tr>
          <tr><td class="ex-name">Back Squat</td><td class="ex-sets">4×3</td><td class="ex-load">82–84%</td><td class="ex-note"></td></tr>
          <tr><td class="ex-name">Good Morning</td><td class="ex-sets">3×6</td><td class="ex-load">Moderate</td><td class="ex-note"></td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- M2 W8 -->
<div class="week-content" id="m2-w8">
  <div class="week-intent m2">
    <h4 class="m2">Week 8 · Building Intensity</h4>
    <p>First 85%+ singles on snatch and C&J. Squat moves to heavy doubles. Athletes should feel the weight but move well.</p>
  </div>
  <div class="days-grid">
    <div class="day-card">
      <div class="day-header">
        <div class="day-label mon">THURSDAY</div>
        <div class="day-focus">Snatch Focus</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Exercise</th><th>Sets×Reps</th><th>Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">Snatch</td><td class="ex-sets">4×1 + 2×1</td><td class="ex-load">80% / 85%</td><td class="ex-note">4 at 80%, build to 2 singles at 85%<div class="tag-peak">Meso 2</div></td></tr>
          <tr><td class="ex-name">Power Snatch</td><td class="ex-sets">3×2</td><td class="ex-load">70%</td><td class="ex-note">Speed under the bar</td></tr>
          <tr><td class="ex-name">Snatch Pull</td><td class="ex-sets">4×2</td><td class="ex-load">105–108%</td><td class="ex-note"></td></tr>
          <tr><td class="ex-name">Front Squat</td><td class="ex-sets">4×2</td><td class="ex-load">83–85%</td><td class="ex-note">Doubles now</td></tr>
          <tr><td class="ex-name">Back Extension</td><td class="ex-sets">3×10</td><td class="ex-load">Light plate</td><td class="ex-note"></td></tr>
        </tbody>
      </table>
    </div>
    <div class="day-card">
      <div class="day-header">
        <div class="day-label thu">MONDAY</div>
        <div class="day-focus">Clean &amp; Jerk Focus</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Exercise</th><th>Sets×Reps</th><th>Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">Clean &amp; Jerk</td><td class="ex-sets">4×1 + 2×1</td><td class="ex-load">80% / 85–86%</td><td class="ex-note">Same structure as snatch day<div class="tag-peak">Meso 2</div></td></tr>
          <tr><td class="ex-name">Clean Pull</td><td class="ex-sets">4×2</td><td class="ex-load">105–108%</td><td class="ex-note"></td></tr>
          <tr><td class="ex-name">Jerk from Rack</td><td class="ex-sets">4×2</td><td class="ex-load">80%</td><td class="ex-note"></td></tr>
          <tr><td class="ex-name">Back Squat</td><td class="ex-sets">4×2</td><td class="ex-load">85–87%</td><td class="ex-note">Heavy doubles</td></tr>
          <tr><td class="ex-name">Bulgarian Split Squat</td><td class="ex-sets">3×6</td><td class="ex-load">Light–Moderate</td><td class="ex-note">Drop reps to 6 as squats get heavier</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- M2 W9 -->
<div class="week-content" id="m2-w9">
  <div class="week-intent m2">
    <h4 class="m2">Week 9 · Intensity Push</h4>
    <p>Heaviest volume week of meso 2. Athletes hit 88–90% on competition lifts. Squat moves toward heavy singles for advanced, doubles for beginners.</p>
  </div>
  <div class="days-grid">
    <div class="day-card">
      <div class="day-header">
        <div class="day-label mon">THURSDAY</div>
        <div class="day-focus">Snatch Focus</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Exercise</th><th>Sets×Reps</th><th>Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">Snatch</td><td class="ex-sets">3×1 + 3×1</td><td class="ex-load">82% / 88–90%</td><td class="ex-note">3 at 82%, 3 heavy singles. Beginners cap at 85%<div class="tag-hard">Advanced: 90%</div><div class="tag-beginner">Cap at 85%</div></td></tr>
          <tr><td class="ex-name">Hang Snatch</td><td class="ex-sets">3×2</td><td class="ex-load">72%</td><td class="ex-note">Back off set — feel the hip snap</td></tr>
          <tr><td class="ex-name">Snatch Pull</td><td class="ex-sets">4×2</td><td class="ex-load">108–110%</td><td class="ex-note">Peak pull intensity</td></tr>
          <tr><td class="ex-name">Front Squat</td><td class="ex-sets">3×2 + 1×1</td><td class="ex-load">85% / 90%</td><td class="ex-note">Advanced: heavy single. Beginners: stay at doubles<div class="tag-beginner">3×2 only</div></td></tr>
          <tr><td class="ex-name">Back Extension</td><td class="ex-sets">3×10</td><td class="ex-load">Moderate</td><td class="ex-note"></td></tr>
        </tbody>
      </table>
    </div>
    <div class="day-card">
      <div class="day-header">
        <div class="day-label thu">MONDAY</div>
        <div class="day-focus">Clean &amp; Jerk Focus</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Exercise</th><th>Sets×Reps</th><th>Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">Clean &amp; Jerk</td><td class="ex-sets">3×1 + 3×1</td><td class="ex-load">82% / 88–90%</td><td class="ex-note">Most demanding session of the cycle<div class="tag-hard">Advanced: 90%</div><div class="tag-beginner">Cap at 85%</div></td></tr>
          <tr><td class="ex-name">Clean Pull</td><td class="ex-sets">4×2</td><td class="ex-load">108–110%</td><td class="ex-note"></td></tr>
          <tr><td class="ex-name">Jerk from Rack</td><td class="ex-sets">4×1</td><td class="ex-load">83–85%</td><td class="ex-note">Heavy jerk singles from rack</td></tr>
          <tr><td class="ex-name">Back Squat</td><td class="ex-sets">3×2 + 1×1</td><td class="ex-load">87% / 92%</td><td class="ex-note">Advanced: heavy single. Beginners: 3×2<div class="tag-beginner">3×2 only</div></td></tr>
          <tr><td class="ex-name">Good Morning</td><td class="ex-sets">2×8</td><td class="ex-load">Moderate</td><td class="ex-note">Reduce volume heading into peak</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- M2 W10 -->
<div class="week-content" id="m2-w10">
  <div class="week-intent m2">
    <h4 class="m2">Week 10 · Competition Simulation</h4>
    <p>Treat Monday and Thursday like a competition warm-up sequence. Build to a heavy single — not a true max, but as heavy as the athlete can move perfectly. Accessory work drops significantly.</p>
  </div>
  <div class="days-grid">
    <div class="day-card">
      <div class="day-header">
        <div class="day-label mon">THURSDAY</div>
        <div class="day-focus">Snatch Focus</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Exercise</th><th>Sets×Reps</th><th>Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">Snatch — Build to Heavy Single</td><td class="ex-sets">~6–8 singles</td><td class="ex-load">70→90–93%</td><td class="ex-note">Competition-style warm-up. Stop when bar slows.<div class="tag-peak">Simulate meet</div></td></tr>
          <tr><td class="ex-name">Power Snatch</td><td class="ex-sets">3×2</td><td class="ex-load">65–68%</td><td class="ex-note">Back-off set after heavy work</td></tr>
          <tr><td class="ex-name">Front Squat</td><td class="ex-sets">3×2</td><td class="ex-load">82–85%</td><td class="ex-note">Reduced from last week — preserve legs</td></tr>
          <tr><td class="ex-name">Back Extension</td><td class="ex-sets">2×10</td><td class="ex-load">Light</td><td class="ex-note">Recovery-minded</td></tr>
        </tbody>
      </table>
    </div>
    <div class="day-card">
      <div class="day-header">
        <div class="day-label thu">MONDAY</div>
        <div class="day-focus">Clean &amp; Jerk Focus</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Exercise</th><th>Sets×Reps</th><th>Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">Clean &amp; Jerk — Build to Heavy Single</td><td class="ex-sets">~6–8 singles</td><td class="ex-load">70→90–93%</td><td class="ex-note">Same competition simulation structure<div class="tag-peak">Simulate meet</div></td></tr>
          <tr><td class="ex-name">Jerk from Rack</td><td class="ex-sets">3×1</td><td class="ex-load">80–83%</td><td class="ex-note">Back-off jerk singles</td></tr>
          <tr><td class="ex-name">Back Squat</td><td class="ex-sets">3×2</td><td class="ex-load">82–85%</td><td class="ex-note">Reduced volume</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- M2 W11 TAPER -->
<div class="week-content" id="m2-w11">
  <div class="week-intent peak">
    <h4 class="peak">Week 11 · Taper</h4>
    <p>Volume cuts by 50%. Intensity stays high but only 2–3 heavy singles per session. Body needs to absorb the training and feel fast. No new PRs. Get athletes feeling sharp and hungry.</p>
  </div>
  <div class="days-grid">
    <div class="day-card">
      <div class="day-header">
        <div class="day-label mon">THURSDAY</div>
        <div class="day-focus">Snatch — Taper</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Exercise</th><th>Sets×Reps</th><th>Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">Snatch</td><td class="ex-sets">4×1</td><td class="ex-load">80–85%</td><td class="ex-note">Feel the lift. No grinding. Should feel light.<div class="tag-peak">Taper</div></td></tr>
          <tr><td class="ex-name">Power Snatch</td><td class="ex-sets">3×1</td><td class="ex-load">70%</td><td class="ex-note">Fast and confident</td></tr>
          <tr><td class="ex-name">Front Squat</td><td class="ex-sets">3×1</td><td class="ex-load">83–85%</td><td class="ex-note">Just enough to keep legs primed</td></tr>
        </tbody>
      </table>
    </div>
    <div class="day-card">
      <div class="day-header">
        <div class="day-label thu">MONDAY</div>
        <div class="day-focus">C&amp;J — Taper</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Exercise</th><th>Sets×Reps</th><th>Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">Clean &amp; Jerk</td><td class="ex-sets">4×1</td><td class="ex-load">80–85%</td><td class="ex-note">Same — feel the rhythm, not the grind<div class="tag-peak">Taper</div></td></tr>
          <tr><td class="ex-name">Jerk from Rack</td><td class="ex-sets">3×1</td><td class="ex-load">78–80%</td><td class="ex-note">Confidence builder</td></tr>
          <tr><td class="ex-name">Back Squat</td><td class="ex-sets">2×2</td><td class="ex-load">75–78%</td><td class="ex-note">Keep legs fresh. That's it.</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- M2 W12 MAX OUT -->
<div class="week-content" id="m2-w12">
  <div class="week-intent peak">
    <h4 class="peak">Week 12 · MAX OUT WEEK 🏆</h4>
    <p>Both sessions this week are max attempt days. Warm up like a competition. Take 3 attempts on snatch Monday, 3 attempts on C&J Thursday. Record all results. Celebrate your athletes.</p>
  </div>
  <div class="days-grid">
    <div class="day-card">
      <div class="day-header">
        <div class="day-label mon">THURSDAY</div>
        <div class="day-focus">POLISH DAY</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Attempt</th><th>Structure</th><th>Target Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">Warm-Up</td><td class="ex-sets">Singles building</td><td class="ex-load">50→70→80%</td><td class="ex-note">Take your time. Use competition timing (2 min between).</td></tr>
          <tr><td class="ex-name">Opener (Attempt 1)</td><td class="ex-sets">1</td><td class="ex-load">87–90%</td><td class="ex-note">A lift you can make on your worst day. Confident and clean.<div class="tag-peak">Must make</div></td></tr>
          <tr><td class="ex-name">Second Attempt</td><td class="ex-sets">1</td><td class="ex-load">93–96%</td><td class="ex-note">Good lift = PR territory. Aggressive but technical.</td></tr>
          <tr><td class="ex-name">Third Attempt</td><td class="ex-sets">1</td><td class="ex-load">98–102%</td><td class="ex-note">Max attempt. Based on how 2nd felt. Coach calls it.<div class="tag-hard">PR attempt</div></td></tr>
          <tr><td class="ex-name">Front Squat (optional)</td><td class="ex-sets">2×2</td><td class="ex-load">75%</td><td class="ex-note">Only if athletes have energy. Skip for beginners.</td></tr>
        </tbody>
      </table>
    </div>
    <div class="day-card">
      <div class="day-header">
        <div class="day-label thu">MONDAY</div>
        <div class="day-focus">OLYMPIC TOTAL DAY</div>
      </div>
      <table class="ex-table">
        <thead><tr><th>Attempt</th><th>Structure</th><th>Target Load</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="ex-name">Warm-Up</td><td class="ex-sets">Singles building</td><td class="ex-load">50→70→80%</td><td class="ex-note">Same competition warm-up protocol as Monday.</td></tr>
          <tr><td class="ex-name">Opener (Attempt 1)</td><td class="ex-sets">1</td><td class="ex-load">87–90%</td><td class="ex-note">Make it look easy. Build the room's energy.<div class="tag-peak">Must make</div></td></tr>
          <tr><td class="ex-name">Second Attempt</td><td class="ex-sets">1</td><td class="ex-load">93–96%</td><td class="ex-note">Strong clean, aggressive drive into the jerk.</td></tr>
          <tr><td class="ex-name">Third Attempt</td><td class="ex-sets">1</td><td class="ex-load">98–103%</td><td class="ex-note">Max C&J. Coach calls the weight after attempt 2.<div class="tag-hard">PR attempt</div></td></tr>
          <tr><td class="ex-name">Back Squat (optional)</td><td class="ex-sets">1×1</td><td class="ex-load">90%+</td><td class="ex-note">Optional squat max if athletes want it. Great way to close the cycle.</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<footer>
  <p>12-Week Class Program · Mon + Thu · Snatch + Clean &amp; Jerk Peak</p>
  <p>Loads = % of individual 1RM · Scale as needed</p>
</footer>

<script>
function showWeek(meso, weekNum, btn) {
  // Hide all week contents for this meso
  const prefix = meso + '-w';
  document.querySelectorAll('[id^="' + prefix + '"]').forEach(el => {
    el.classList.remove('visible');
  });
  // Deactivate all buttons in this nav
  const navId = 'nav-' + meso;
  document.querySelectorAll('#' + navId + ' .week-btn').forEach(b => {
    b.classList.remove('active');
  });
  // Show target week
  document.getElementById(meso + '-w' + weekNum).classList.add('visible');
  // Activate button
  btn.classList.add('active');
  btn.classList.add(meso);
}
</script>

</body>
</html>

