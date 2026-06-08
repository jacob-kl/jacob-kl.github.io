// ── RENDERER ─────────────────────────────────────────────────────────────
const MEMBER_DAY_OFFSETS=[0,4]; // Thu=0, Mon=4
// Member off days from Thu base: Fri=1,Sat=2,Sun=3,Tue=5,Wed=6
const MEMBER_OFF_OFFSETS=[1,2,3,5,6];
const ADMIN_DAY_OFFSETS=[0,1,2,4,5]; // Mon=0,Tue=1,Wed=2,Fri=4,Sat=5
// Competitor off days from Mon base: Thu=3, Sun=6
const ADMIN_OFF_OFFSETS=[3,6];
let CYCLE_ADMIN_START=new Date(2026,2,16);
let CYCLE_MEMBER_START=new Date(2026,2,19);
function getDayDate(weekNum,dayIdx,isAdm){
  const base=isAdm?new Date(CYCLE_ADMIN_START):new Date(CYCLE_MEMBER_START);
  const d=new Date(base);d.setDate(d.getDate()+(weekNum-1)*7);
  const off=(isAdm?ADMIN_DAY_OFFSETS:MEMBER_DAY_OFFSETS)[dayIdx]??dayIdx;
  const dd=new Date(d);dd.setDate(dd.getDate()+off);
  return dd.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
}

function parseSetCountForVolume(s){
  if(!s)return{sets:0,avgReps:1};s=s.trim();
  if(/build|single|building|\u2014|pvc|rest|record/i.test(s))return{sets:1,avgReps:1};
  const wm=s.match(/^(\d+)-(\d+)-(\d+)/);if(wm){const c=wm.slice(1).map(Number);return{sets:3,avgReps:c.reduce((a,b)=>a+b,0)/3};}
  const em=s.match(/emom\s*[x\u00d7]\s*(\d+)/i);if(em)return{sets:parseInt(em[1]),avgReps:1};
  let ts=0,tr=0;
  // Split on + between groups (but not inside parens)
  const gs=s.split('/').map(g=>g.trim()).filter(Boolean);
  for(const g of gs){
    // Match sets × (a+b+c...) or sets × n
    const mParen=g.match(/^(\d+)\s*[x×]\s*\(([^)]+)\)/i);
    if(mParen){
      const numSets=parseInt(mParen[1]);
      const repsInParen=mParen[2].split(/[+]/).reduce((sum,r)=>{const n=parseInt(r.trim());return sum+(isNaN(n)?0:n);},0);
      ts+=numSets;tr+=numSets*repsInParen;
    } else {
      const m=g.match(/(\d+)\s*[x×]\s*(\d+)/i);
      if(m){ts+=parseInt(m[1]);tr+=parseInt(m[1])*parseInt(m[2]);}
      else{const n=g.match(/(\d+)/);if(n){ts+=parseInt(n[1]);tr+=parseInt(n[1]);}}
    }
  }
  return ts===0?{sets:1,avgReps:1}:{sets:ts,avgReps:tr/ts};
}

function calcPhaseVolume(phase){
  return phase.weeks.map(week=>{
    const days=week.days.map(day=>{
      let vol=0;
      day.exercises.forEach(ex=>{
        // Skip bodyweight exercises — no meaningful weight to sum
        if(isBWExercise(ex.name)) return;
        const{sets,avgReps}=parseSetCountForVolume(ex.sets);
        const max=getMaxForExercise(ex.name);
        const pm=(ex.load||'').match(/(\d+(?:\.\d+)?)\s*%/g);
        if(pm&&max){
          // % load + known 1RM → actual planned weight
          const pcts=pm.map(m=>parseFloat(m)).filter(n=>n>0&&n<=140);
          const avgPct=pcts.length?pcts.reduce((a,b)=>a+b,0)/pcts.length:0;
          vol+=sets*avgReps*(avgPct/100*max);
        } else if(pm&&!max){
          // % load but no 1RM entered yet → use % as relative index so chart still has shape
          const pcts=pm.map(m=>parseFloat(m)).filter(n=>n>0&&n<=140);
          const avgPct=pcts.length?pcts.reduce((a,b)=>a+b,0)/pcts.length:0;
          vol+=sets*avgReps*avgPct;
        } else if(isFixedWeight(ex.load)){
          // Fixed weight (e.g. "185 lbs") → parse and use directly
          const w=parseFloat(ex.load);
          if(w>0) vol+=sets*avgReps*w;
        }
        // else: no load info (PVC, mobility, etc.) → skip
      });
      return{label:day.label.substring(0,3),vol:Math.round(vol)};
    });
    return{weekLabel:week.label,days};
  });
}

function renderVolumeChart(phase){
  const data=calcPhaseVolume(phase);if(!data.length)return'';
  const allVols=data.flatMap(w=>w.days.map(d=>d.vol));
  const maxVol=Math.max(...allVols,1);
  const W=640,H=200,padL=44,padB=36,padT=36,padR=20;
  const chartW=W-padL-padR,chartH=H-padT-padB;
  const weeks=data.length,dayCount=data[0].days.length;
  const clusterW=chartW/weeks,barW=Math.min((clusterW/(dayCount+1))*0.9,20);
  const gap=(clusterW-barW*dayCount)/(dayCount+1);
  const pal=phase.colorClass==='m2'?['#e8c547','#e8843a','#4fc3a1','#a78bfa','#e85d47']:['#4fc3a1','#e8c547','#e8843a','#a78bfa','#e85d47'];
  let svg=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:${W}px;display:block;">`;
  for(let g=0;g<=4;g++){const y=padT+chartH-(g/4)*chartH;svg+=`<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W-padR}" y2="${y.toFixed(1)}" stroke="var(--border)" stroke-width="1"/>`;if(g>0)svg+=`<text x="${padL-6}" y="${(y+4).toFixed(1)}" text-anchor="end" font-family="DM Mono,monospace" font-size="9" fill="var(--muted)">${Math.round(g/4*maxVol)}</text>`;}
  data.forEach((week,wi)=>{const cx=padL+wi*clusterW;week.days.forEach((day,di)=>{const bh=Math.max(2,(day.vol/maxVol)*chartH),bx=cx+gap+di*(barW+gap),by=padT+chartH-bh;svg+=`<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${barW}" height="${bh.toFixed(1)}" fill="${pal[di%pal.length]}" rx="2" opacity="0.85"/>`;});svg+=`<text x="${(padL+wi*clusterW+clusterW/2).toFixed(1)}" y="${H-8}" text-anchor="middle" font-family="DM Mono,monospace" font-size="9" fill="var(--muted)">W${wi+1}</text>`;});
  const firstDays=data[0].days,totalLW=firstDays.length*56,legX=padL+(chartW-totalLW)/2;
  firstDays.forEach((day,di)=>{const lx=legX+di*56;svg+=`<rect x="${lx}" y="${padT-22}" width="8" height="8" fill="${pal[di%pal.length]}" rx="1"/><text x="${lx+11}" y="${padT-14}" font-family="DM Mono,monospace" font-size="8" fill="var(--muted)">${day.label}</text>`;});
  svg+=`<text x="${padL}" y="${padT-6}" font-family="DM Mono,monospace" font-size="9" fill="var(--muted)" letter-spacing="1">VOLUME INDEX</text></svg>`;
  const isAdm=currentView==='admin';
  const cap=isAdm?'Each bar = sets \u00d7 reps \u00d7 avg load% for that day. Mon lowest, Wed highest within each week. Weeks 1\u20133 ramp up; week 4 deloads.':'Each bar = sets \u00d7 reps \u00d7 load% for Thu and Mon. Builds W1\u2013W4, deloads W5, peaks intensity W6. Repeats for phase 2.';
  return`<div style="background:var(--surface2);border:1px solid var(--border);border-radius:4px;padding:16px 24px 16px;margin:0 40px 32px;overflow-x:auto;">${svg}<p style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1px;color:var(--muted);margin-top:10px;line-height:1.6;">${cap}</p></div>`;
}


// ── WARMUP / COOLDOWN GENERATORS ─────────────────────────────────────────
function dayWarmupExercises(day) {
  const focus = (day.focus || '').toLowerCase();
  const label = (day.label || '').toLowerCase();
  const isComp = focus.includes('competition') || focus.includes('olympic total') || focus.includes('dress rehearsal');
  const isSnatch = focus.includes('snatch') || focus.includes('overhead') || focus.includes('lockout');
  const isClean = focus.includes('clean') || focus.includes('jerk') || focus.includes('acceleration');
  const isPull = focus.includes('pull') || focus.includes('deadlift');

  let complex = [];
  if (isComp) {
    complex = [
      {name:'Muscle Snatch',sets:'3×5',load:'Bar'},
      {name:'Overhead Squat',sets:'3×5',load:'Bar'},
      {name:'Muscle Clean + Push Press',sets:'3×3',load:'Bar'},
      {name:'Power Snatch',sets:'2×2',load:'50%'},
      {name:'Power Clean + Push Jerk',sets:'2×(1+1)',load:'50%'},
    ];
  } else if (isSnatch) {
    complex = [
      {name:'Muscle Snatch',sets:'3×5',load:'Bar'},
      {name:'Snatch Grip RDL',sets:'3×5',load:'Bar'},
      {name:'Overhead Squat',sets:'3×5',load:'Bar'},
      {name:'Snatch Balance',sets:'3×3',load:'Bar'},
      {name:'Power Snatch',sets:'2×2',load:'50%'},
    ];
  } else if (isClean) {
    complex = [
      {name:'Clean Grip RDL',sets:'3×5',load:'Bar'},
      {name:'Clean Pull (floor to knee)',sets:'3×5',load:'Bar'},
      {name:'Clean Pull (knee to hip)',sets:'3×5',load:'Bar'},
      {name:'Clean Pull',sets:'3×5',load:'Bar'},
      {name:'Muscle Clean',sets:'3×5',load:'Bar'},
      {name:'Front Squat',sets:'3×5',load:'Bar'},
      {name:'Push Press',sets:'3×5',load:'Bar'},
      {name:'Tall Clean',sets:'3×3',load:'Bar'},
      {name:'Power Clean + Push Jerk',sets:'2×(1+1)',load:'50%'},
    ];
  } else if (isPull) {
    complex = [
      {name:'Snatch Grip RDL',sets:'3×5',load:'Bar'},
      {name:'Snatch Pull (floor to knee)',sets:'3×5',load:'Bar'},
      {name:'Snatch Pull (knee to hip)',sets:'3×5',load:'Bar'},
      {name:'Snatch Pull',sets:'3×5',load:'Bar'},
      {name:'Muscle Snatch',sets:'3×5',load:'Bar'},
      {name:'Overhead Squat',sets:'3×3',load:'Bar'},
      {name:'Snatch High Pull',sets:'3×3',load:'Bar'},
      {name:'Hang Power Snatch',sets:'2×2',load:'50%'},
      {name:'Tall Snatch', sets:'2×2',load:'50%'},
    ];
  } else {
    complex = [
      {name:'Muscle Snatch',sets:'3×3',load:'Bar'},
      {name:'Overhead Squat',sets:'3×3',load:'Bar'},
      {name:'Snatch Grip RDL',sets:'3×3',load:'Bar'},
      {name:'Power Snatch',sets:'2×2',load:'50%'},
    ];
  }
  const mobility = [
    {name:'Hip 90/90',sets:'2×60s',load:'BW',note:'Each side · 2 min total'},
    {name:'Ankle Circles + Calf Stretch',sets:'2×10',load:'BW',note:'Each side'},
    {name:'Thoracic Rotation',sets:'2×10',load:'BW',note:'Each side'},
    {name:'Shoulder CARs',sets:'2×10',load:'BW',note:'Controlled articular rotations'},
  ];
  return {complex, mobility};
}

function dayCooldownExercises() {
  return [
    {name:'Pigeon Pose',sets:'2×60s',load:'BW',note:'Each side — hold, don\'t push'},
    {name:'Hip Flexor Stretch',sets:'2×45s',load:'BW',note:'Each side · rear knee on mat'},
    {name:'Thoracic Foam Roll',sets:'1×60s',load:'BW',note:'T-spine segment by segment'},
    {name:'Dead Hang / Lat Stretch',sets:'2×20s',load:'BW',note:'Decompress the shoulder'},
    {name:'Child\'s Pose',sets:'1×60s',load:'BW',note:'Arms extended, breathe into the floor'},
  ];
}

function dayPumpExercises(day) {
  const focus = (day.focus || '').toLowerCase();
  const isComp = focus.includes('competition') || focus.includes('olympic total') || focus.includes('dress rehearsal');
  const isSnatch = focus.includes('snatch') || focus.includes('overhead') || focus.includes('lockout') || focus.includes('deficit');
  const isClean = focus.includes('clean') || focus.includes('jerk') || focus.includes('acceleration') || focus.includes('block');
  const isPull = focus.includes('pull') || focus.includes('deadlift');

  if (isComp) return [
    {name:'DB Curl',sets:'3×12',load:'Light',note:'60s rest · squeeze at top'},
    {name:'Tricep Pushdown',sets:'3×15',load:'Cable/Band',note:'60s rest · full extension'},
    {name:'Face Pull',sets:'3×15',load:'Band/Cable',note:'60s rest · external rotation at top'},
    {name:'DB Lateral Raise',sets:'3×15',load:'Light',note:'45s rest · control the descent'},
  ];
  if (isSnatch) return [
    {name:'Face Pull',sets:'3×15',load:'Band/Cable',note:'60s rest · rear delt + external rotation'},
    {name:'Band Pull-Apart',sets:'3×20',load:'Light Band',note:'45s rest · pinch shoulder blades'},
    {name:'DB Rear Delt Fly',sets:'3×15',load:'Light',note:'60s rest · chin tucked, slight elbow bend'},
    {name:'Tricep Overhead Extension',sets:'3×12',load:'DB/Cable',note:'60s rest · lockout strength carryover'},
  ];
  if (isClean) return [
    {name:'Tricep Pushdown',sets:'3×15',load:'Cable/Band',note:'60s rest · jerk lockout carryover'},
    {name:'DB Lateral Raise',sets:'3×15',load:'Light',note:'45s rest · slow eccentric'},
    {name:'Lat Pulldown',sets:'3×12',load:'Moderate',note:'75s rest · full hang at top'},
    {name:'Band External Rotation',sets:'3×15',load:'Light Band',note:'45s rest · each side'},
  ];
  if (isPull) return [
    {name:'Hip Thrust',sets:'3×15',load:'Moderate',note:'60s rest · posterior chain pump'},
    {name:'Single Leg RDL',sets:'3×10',load:'Light DB',note:'60s rest · each side · own the balance'},
    {name:'Glute Kickback',sets:'3×15',load:'Band',note:'45s rest · each side'},
    {name:'Nordic Curl Negative',sets:'3×5',load:'BW',note:'90s rest · slow as possible on the way down'},
  ];
  // fallback
  return [
    {name:'DB Curl',sets:'3×12',load:'Light',note:'60s rest'},
    {name:'Tricep Pushdown',sets:'3×15',load:'Cable/Band',note:'60s rest'},
    {name:'Face Pull',sets:'3×15',load:'Band/Cable',note:'60s rest'},
    {name:'DB Lateral Raise',sets:'3×15',load:'Light',note:'45s rest'},
  ];
}

function collapsibleSection(id, label, accentColor, rows) {
  const rowsHTML = rows.map(r =>
    `<tr><td class="wu-name">${r.name}</td><td class="wu-sets">${r.sets}</td><td class="wu-load">${r.load}</td><td class="wu-note">${r.note||''}</td></tr>`
  ).join('');
  return `<div class="wu-section"><button class="wu-toggle" onclick="toggleWU('${id}')"><span class="wu-toggle-label" style="color:${accentColor}">${label}</span><span class="wu-toggle-arrow">&#9660;</span></button><div class="wu-body" id="${id}"><table class="wu-table"><thead><tr><th>Exercise</th><th>Sets</th><th>Load</th><th>Note</th></tr></thead><tbody>${rowsHTML}</tbody></table></div></div>`;
}

function renderWarmup(day, uid) {
  const {mobility, complex} = dayWarmupExercises(day);
  const allRows = [{name:'─── Mobility ───', sets:'', load:'', note:''}, ...mobility, {name:'─── Barbell warmup ───', sets:'', load:'', note:''}, ...complex];
  return collapsibleSection('wu-'+uid, 'BARBELL WARMUP + MOBILITY', 'var(--accent2)', allRows);
}

function renderPump(day, uid) {
  return collapsibleSection('pump-'+uid, 'POST-CROSSFIT ACCESSORIES', 'var(--accent)', dayPumpExercises(day));
}

function renderCooldown(uid) {
  return collapsibleSection('cd-'+uid, 'COOLDOWN + STRETCHING', 'var(--muted)', dayCooldownExercises());
}

function toggleWU(id) {
  const el = document.getElementById(id);
  const btn = el ? el.previousElementSibling : null;
  if (!el) return;
  const open = el.classList.toggle('open');
  if (btn) btn.classList.toggle('open', open);
}

function renderCycle(cycle){
  if(cycle.startDate){const[y,m,d]=cycle.startDate.split('-').map(Number);CYCLE_ADMIN_START=new Date(y,m-1,d);CYCLE_MEMBER_START=new Date(y,m-1,d+3);}
  document.getElementById('meta-days').innerHTML='<strong>'+cycle.days+'</strong>';
  document.getElementById('meta-goal').innerHTML='Goal: <strong>'+cycle.goal+'</strong>';
  document.getElementById('meta-dates').innerHTML='Dates: <strong>'+cycle.dates+'</strong>';
  document.getElementById('footer-left').textContent='Kilo Club \u00b7 '+cycle.name+' \u00b7 Class Program';
  const dw=cycle.days.split(/[\/+]/).filter(s=>s.trim()).length;const dp=document.getElementById('meta-days-per-week');if(dp)dp.innerHTML=`<strong>${dw}</strong> Days / Week`;
  updateViewLabels();
  const isAdmin=currentView==='admin';let html='';
  html+='<div class="overview">';
  cycle.phases.forEach(phase=>{const sub=phase.title.includes('\u2014')?phase.title.split('\u2014')[1].trim():(phase.colorClass==='m1'?'ACCUMULATION':'PEAK');html+=`<div class="overview-card"><h3>${phase.title.split('\u2014')[0].trim()}</h3><div class="big" style="color:var(--${phase.colorClass==='m1'?'meso1':'meso2'})">${sub}</div><p>${phase.subtitle}</p></div>`;});
  html+=`<div class="overview-card"><h3>Load Notation</h3><p>All loads are <strong>% of 1RM</strong>. Enter your maxes above to see exact weights.</p></div></div>`;
  if(!isAdmin)html+=`<div class="scaling-banner"><h3>Beginner Scaling</h3><p><strong>No 1RM?</strong> Use a weight where you maintain full technique. Add 2.5\u20135 lbs/week if form holds.</p></div>`;
  cycle.phases.forEach((phase,pi)=>{
    if(pi>0)html+='<hr class="section-divider">';
    html+=`<div class="meso-header"><div class="meso-num ${phase.colorClass}">${phase.number}</div><div class="meso-info"><h2 class="${phase.colorClass}">${phase.title}</h2><p>${phase.subtitle}</p></div></div>`;
    if(currentRole==='admin')html+=renderVolumeChart(phase);
    html+=`<div class="week-nav" id="nav-${phase.id}">`;
    phase.weeks.forEach(week=>{const isFirst=week.number===phase.weeks[0].number;const status=getWeekProgress(phase.id,week.number,week.days.length,[]);
      // For members, hide weeks where ALL days are in the future
      const weekIsFuture=(()=>{
        if(currentRole==='admin') return false;
        const today=new Date(); today.setHours(0,0,0,0);
        const base=new Date(CYCLE_MEMBER_START);
        base.setDate(base.getDate()+(week.number-1)*7);
        return base>today;
      })();
      // For members, make the most recent past/current week the active default
      const isActiveDefault=(week.number===phase.weeks.filter(w=>{
        const today=new Date();today.setHours(0,0,0,0);
        const b=currentView==='admin'?new Date(CYCLE_ADMIN_START):new Date(CYCLE_MEMBER_START);b.setDate(b.getDate()+(w.number-1)*7);
        return b<=today;
      }).reduce((last,w)=>w.number>last.number?w:last,phase.weeks[0]).number);
      const futureTabStyle=weekIsFuture?'opacity:0.4;font-style:italic;':'';
      html+=`<button class="week-btn ${isActiveDefault?'active '+phase.colorClass:''}" style="${futureTabStyle}" data-phase="${phase.id}" data-week="${week.number}" data-days="${week.days.length}" onclick="showWeek('${phase.id}',${week.number},this,'${phase.colorClass}')">${week.label}<span class="week-dot ${status}"></span></button>`;});
    html+='</div>';
    phase.weeks.forEach((week,wi)=>{
      const isCurrentWeek=(week.number===phase.weeks.filter(w=>{
        const today=new Date();today.setHours(0,0,0,0);
        const b=currentView==='admin'?new Date(CYCLE_ADMIN_START):new Date(CYCLE_MEMBER_START);b.setDate(b.getDate()+(w.number-1)*7);
        return b<=today;
      }).reduce((last,w)=>w.number>last.number?w:last,phase.weeks[0]).number);
      html+=`<div class="week-content ${isCurrentWeek?'visible':''}" id="${phase.id}-w${week.number}">`;
      html+=`<div class="week-intent ${week.intent.colorClass}"><h4 class="${week.intent.colorClass}">${week.intent.title}</h4><p>${week.intent.text}</p></div>`;
      // Build merged sorted slot list: program days + off days
      // Off days: Thu(3)+Sun(6) for competitor; Fri(1)+Sat(2)+Sun(3)+Tue(5)+Wed(6) for class
      const offOffsets = isAdmin ? ADMIN_OFF_OFFSETS : MEMBER_OFF_OFFSETS;
      let slots = [];
      week.days.forEach((day, di) => {
        const off = isAdmin ? (ADMIN_DAY_OFFSETS[di] ?? di) : (MEMBER_DAY_OFFSETS[di] ?? di);
        slots.push({ type: 'program', day, di, offset: off });
      });
      offOffsets.forEach(offOff => slots.push({ type: 'offday', offset: offOff }));
      slots.sort((a, b) => a.offset - b.offset);

      const gs = slots.length > 2 ? 'grid-template-columns:repeat(auto-fit,minmax(300px,1fr))' : '';
      html += `<div class="days-grid" style="${gs}">`;

      slots.forEach(slot => {
        const weekBase = new Date(isAdmin ? CYCLE_ADMIN_START : CYCLE_MEMBER_START);
        weekBase.setDate(weekBase.getDate() + (week.number - 1) * 7);
        const slotDate = new Date(weekBase); slotDate.setDate(weekBase.getDate() + slot.offset);
        const slotDateStr = slotDate.toLocaleDateString('en-US', {weekday:'short',month:'short',day:'numeric'});
        const today = new Date(); today.setHours(0,0,0,0);
        const isFuture = slotDate > today;

        if (slot.type === 'offday') {
          // ── Off-day / rest day card ──────────────────────────────────────
          const prefix = isAdmin ? 'admin' : 'member';
          const odKey = userKey(`kc_notes_${prefix}_offday_${phase.id}_w${week.number}_off${slot.offset}`);
          const odNote = loadNote(odKey).replace(/"/g,'&quot;');
          const odNId = `notes-body-offday-${phase.id}-${week.number}-off${slot.offset}`;
          const odBtnId = `notes-btn-offday-${phase.id}-${week.number}-off${slot.offset}`;
          const odAwKey = `${prefix}_offday_${phase.id}_w${week.number}_off${slot.offset}`;
          const savedOffAW = loadSavedWorkouts(odAwKey);
          let odAwListHtml = '';
          if (savedOffAW.length) { odAwListHtml = '<div class="aw-workouts-list">' + savedOffAW.map((w,wi) => renderSavedWorkout(w,wi,odAwKey)).join('') + '</div>'; }
          const dowNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
          const dayLabel = dowNames[slotDate.getDay()];
          html += `<div class="day-card off-day-card${(currentRole!=='admin'&&isFuture)?' day-future':''}" data-day-offset="${slot.offset}">`;
          html += `<div class="day-header" style="opacity:0.65;"><div style="display:flex;align-items:baseline;gap:12px;"><div class="day-label" style="color:var(--muted);font-size:18px;">${dayLabel}</div><div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1px;color:var(--muted);">${slotDateStr}</div></div><div class="day-focus" style="color:var(--muted);">Rest Day</div></div>`;
          html += odAwListHtml;
          html += `<div class="add-workout-section"><button class="add-workout-btn" onclick="openAWModal('${odAwKey}')">+ Add Workout</button></div>`;
          const odFKey=userKey(`kc_feeling_${currentRole==='admin'?'admin':'member'}_offday_${phase.id}_w${week.number}_off${slot.offset}`);
          const odFScope=`feel-off-${phase.id}-${week.number}-${slot.offset}`;
          const odTKey=userKey(`kc_time_${currentView==='admin'?'admin':'member'}_offday_${phase.id}_w${week.number}_off${slot.offset}`);
          const odMetScope=odAwKey.replace(/[^a-z0-9]/gi,'-');
          html += `<div class="day-notes-section"><button class="day-notes-toggle" id="${odBtnId}" onclick="toggleNotes(this,'${odNId}')"><span>Day Notes</span><span class="arrow">&#9660;</span></button><div class="day-notes-body" id="${odNId}"><textarea placeholder="Notes for this rest day\u2026" onchange="saveNote('${odKey}',this.value)" oninput="saveNote('${odKey}',this.value)">${odNote}</textarea>${dayMetricsHtml(odAwKey,odTKey,odMetScope)}${feelingScaleHtml(odFKey,odFScope)}</div></div>`;
          html += '</div>';

        } else {
          // ── Program day card ─────────────────────────────────────────────
          const day = slot.day, di = slot.di;
          const rawH = day.tableHeaders || ['Exercise','Sets\u00d7Reps','Load','Notes'];
          let headers = [...rawH]; const li = headers.indexOf('Load'); if (li !== -1) headers.splice(li+1,0,'Weight'); headers.push('\u2713');
          const focusHtml = day.focus ? `<div class="day-focus">${day.focus}</div>` : '';
          const isFutureDay = (currentRole !== 'admin') && isFuture;
          html += `<div class="day-card${isFutureDay?' day-future':''}" style="${isFutureDay?'position:relative;':''}" data-day-offset="${slot.offset}"><div class="day-header"><div style="display:flex;align-items:baseline;gap:12px;"><div class="day-label ${day.colorClass}">${day.label}</div><div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1px;color:var(--muted);">${slotDateStr}</div></div>${focusHtml}</div>`;
          const wuUid = `${phase.id}-w${week.number}-d${di}`;
          if (!slot.isOff) html += renderWarmup(day, wuUid);
          html += `<div class="table-wrap"><table class="ex-table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>`;
          const exercises = day.exercises; let i = 0, ssGroupIdx = -1, ssGroupCount = -1;
          while (i < exercises.length) {
            const ex = exercises[i];
            if (ex.name.includes('\u2014 Wave')) {
              const baseName = ex.name.replace(/\u2014 Wave \d+/,'').trim();
              const waveGroup = [];
              const waveStartIdx = i;
              while (i < exercises.length && exercises[i].name.includes('\u2014 Wave')) { waveGroup.push(exercises[i]); i++; }
              if (waveGroup.length === 0) { waveGroup.push(ex); i++; }
              const lk = logKey(phase.id, week.number, di, waveStartIdx);
              const prevLog = (()=>{try{const v=localStorage.getItem(lk);return v?JSON.parse(v):{};}catch(e){return{};}})();
              const anyMade=Object.values(prevLog).some(e=>e&&typeof e==='object'&&e.outcome==='made');
              const anyMiss=Object.values(prevLog).some(e=>e&&typeof e==='object'&&e.outcome==='miss');
              const anyMixed=anyMade&&anyMiss;
              const lbc=anyMixed?'log-btn logged-mixed':anyMade?'log-btn logged-made':anyMiss?'log-btn logged-miss':'log-btn';
              const lbi=anyMixed?`<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1,6 4,9 11,2"/></svg> MIXED`:anyMade?`<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1,6 4,9 11,2"/></svg> LOGGED`:anyMiss?`<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg> MISSED`:`<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="4"/><line x1="6" y1="4" x2="6" y2="6"/><line x1="6" y1="8" x2="6" y2="8.5"/></svg> LOG`;
              const noteTD=`<td class="ex-note">${ex.note||''}</td>`;
              const nameCell=`<div class="wave-name-cell"><span class="wave-base-name">${baseName||ex.name}</span></div>`;
              const setsCell=`<div class="wave-group">${waveGroup.map(w=>`<div class="wave-line"><span class="wave-sets">${w.sets}</span></div>`).join('')}</div>`;
              const loadCell=`<div class="wave-group">${waveGroup.map(w=>`<div class="wave-line"><span class="wave-load" style="white-space:nowrap">${w.load}</span></div>`).join('')}</div>`;
              const wtCell=`<div class="wave-group">${waveGroup.map(w=>{const max=getMaxForExercise(baseName||w.name);const u=getUnit();const exKey=(baseName||w.name).replace(/"/g,'&quot;');const pcts=w.load.replace(/%/g,'').split('–').map(s=>parseFloat(s.trim())).filter(n=>!isNaN(n));if(pcts.length>=2&&max){const weights=pcts.map(pct=>u==='kg'?Math.round(pct/100*max/2.205):Math.round(pct/100*max));const wtStr=weights.join('–')+' '+(u==='kg'?'kg':'lbs');return`<div class="wave-line"><span class="ex-weight weight-cell" data-ex="${exKey}" data-load="${w.load.replace(/"/g,'&quot;')}">${wtStr}</span></div>`;}const wt=calcWeight(w.load,max,baseName||w.name)||'\u2014';return`<div class="wave-line"><span class="ex-weight ${wt==='\u2014'?'empty':''} weight-cell" data-ex="${exKey}" data-load="${w.load.replace(/"/g,'&quot;')}">${wt}</span></div>`;}).join('')}</div>`;
              if (!window._waveRegistry) window._waveRegistry = {}; window._waveRegistry[lk] = {baseName:baseName||ex.name,waveGroup};
              html += `<tr><td class="ex-name" style="vertical-align:middle">${nameCell}</td><td style="vertical-align:top">${setsCell}</td><td style="vertical-align:top">${loadCell}</td><td style="vertical-align:top">${wtCell}</td>${noteTD}<td style="vertical-align:middle"><button class="${lbc}" data-log-key="${lk}" onclick="openWaveLogFromRegistry('${lk}')">${lbi}</button></td></tr>`;
              continue;
            }
            const isSSS=ex.superset===true&&ssGroupIdx<0,isSSM=ex.superset===true&&ssGroupIdx>=0,isSSE=ex.supersetEnd===true;
            let ssClass='',ssAttr='';
            if(isSSS){ssGroupCount++;ssGroupIdx=ssGroupCount;ssClass='ss-start';ssAttr=`data-ss="${ssGroupCount%4}"`;}
            else if(isSSE){ssClass='ss-end';ssAttr=`data-ss="${ssGroupCount%4}"`;}
            else if(isSSM||ssGroupIdx>=0){ssClass='ss-mid';ssAttr=`data-ss="${ssGroupCount%4}"`;}
            const ci=ssGroupCount>=0?ssGroupCount%4:0;
            const inSS=ssClass==='ss-start'||ssClass==='ss-mid'||ssClass==='ss-end';
            const ssBadge=inSS?`<span class="ss-badge ss-badge-${ci}">superset</span>`:'';
            const max=getMaxForExercise(ex.name);const wr=calcWeight(ex.load,max,ex.name);
            const safeEx=ex.name.replace(/"/g,'&quot;'),safeLoad=ex.load.replace(/"/g,'&quot;');
            const wTD=wr?`<td class="ex-weight weight-cell" data-ex="${safeEx}" data-load="${safeLoad}">${wr}</td>`:`<td class="ex-weight empty weight-cell" data-ex="${safeEx}" data-load="${safeLoad}">\u2014</td>`;
            let noteHTML=ex.note||'';if(ex.tag)noteHTML+=`<div class="tag tag-${ex.tag}">${ex.tagText}</div>`;if(ex.tag2)noteHTML+=`<div class="tag tag-${ex.tag2}">${ex.tagText2}</div>`;
            const noteTD=`<td class="ex-note">${noteHTML}</td>`;
            const lk=logKey(phase.id,week.number,di,i);
            const prevLog=(()=>{try{const v=localStorage.getItem(lk);return v?JSON.parse(v):{};}catch(e){return{};}})();
            const anyMade=Object.values(prevLog).some(e=>e&&typeof e==='object'&&e.outcome==='made');
            const anyMiss=Object.values(prevLog).some(e=>e&&typeof e==='object'&&e.outcome==='miss');
            const anyMixed=anyMade&&anyMiss;
            const prevDate=prevLog._date?`<span class="log-date-stamp">${prevLog._date}</span>`:'';
            const lbc=anyMixed?'log-btn logged-mixed':anyMade?'log-btn logged-made':anyMiss?'log-btn logged-miss':'log-btn';
            const lbi=anyMixed?`<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1,6 4,9 11,2"/></svg> MIXED${prevDate}`:anyMade?`<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1,6 4,9 11,2"/></svg> LOGGED${prevDate}`:anyMiss?`<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg> MISSED${prevDate}`:`<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="4"/><line x1="6" y1="4" x2="6" y2="6"/><line x1="6" y1="8" x2="6" y2="8.5"/></svg> LOG`;
            const rmId=getMaxIdForExercise(ex.name)||'';
            html+=`<tr class="${ssClass}" ${ssAttr}><td class="ex-name">${ex.name}${ssBadge}</td><td class="ex-sets">${ex.sets}</td><td class="ex-load">${ex.load}</td>${wTD}${noteTD}<td><button class="${lbc}" data-log-key="${lk}" onclick="openLogModal('${ex.name.replace(/'/g,"\\'")}','${ex.sets.replace(/'/g,"\\'")}','${ex.load.replace(/'/g,"\\'")}','${rmId}','${lk}')">${lbi}</button></td></tr>`;
            if(isSSE)ssGroupIdx=-1;i++;
          }
          html += '</tbody></table></div>';
          const nKey=notesKey(phase.id,week.number,di),nVal=loadNote(nKey).replace(/"/g,'&quot;'),nId=`notes-body-${phase.id}-${week.number}-${di}`,btnId=`notes-btn-${phase.id}-${week.number}-${di}`;
          const ph=isAdmin?'Notes for this session\u2014programming thoughts, athlete feedback\u2026':'Your notes for this day\u2026';
          const awKey=`${phase.id}_w${week.number}_d${di}`;
          const savedAW=loadSavedWorkouts(awKey);
          let awListHtml='';
          if(savedAW.length){awListHtml='<div class="aw-workouts-list">'+savedAW.map((w,wi)=>renderSavedWorkout(w,wi,awKey)).join('')+'</div>';}
          html+=`${awListHtml}<div class="add-workout-section"><button class="add-workout-btn" onclick="openAWModal('${awKey}')">+ Add Workout</button></div>`;
          const fKey=feelingKey(phase.id,week.number,di);
          const fScopeId=`feel-${phase.id}-${week.number}-${di}`;
          const tKey=timeKey(phase.id,week.number,di);
          const metScopeId=awKey.replace(/[^a-z0-9]/gi,'-');
          if (!slot.isOff) html += renderPump(day, wuUid);
          if (!slot.isOff) html += renderCooldown(wuUid);
          html+=`<div class="day-notes-section"><button class="day-notes-toggle" id="${btnId}" onclick="toggleNotes(this,'${nId}')"><span>Day Notes</span><span class="arrow">&#9660;</span></button><div class="day-notes-body" id="${nId}"><textarea placeholder="${ph}" onchange="saveNote('${nKey}',this.value)" oninput="saveNote('${nKey}',this.value)">${nVal}</textarea>${dayMetricsHtml(awKey,tKey,metScopeId)}${feelingScaleHtml(fKey,fScopeId)}</div></div>`;
          html += '</div>';
        }
      }); // end slots.forEach
      html += '</div></div>'; // close days-grid and week-content
    });
  });
  document.getElementById('program-body').innerHTML=html;refreshProgressDots();
}

// ── PROGRESS DOTS ────────────────────────────────────────────────────────
function getWeekProgress(phaseId,weekNum,dayCount,exCounts){
  let loggedEx=0,madeEx=0;
  for(let di=0;di<dayCount;di++){for(let ei=0;ei<30;ei++){const prefix=currentView==='admin'?'admin':'member';const k=userKey(`kc_log_${prefix}_${phaseId}_w${weekNum}_d${di}_e${ei}`);try{const v=localStorage.getItem(k);if(!v)continue;const d=JSON.parse(v);const outcomes=Object.values(d).filter(e=>e&&typeof e==='object'&&e.outcome).map(e=>e.outcome);if(!outcomes.length)continue;loggedEx++;if(outcomes.some(o=>o==='made'))madeEx++;}catch(e){}}}
  if(loggedEx===0)return'none';if(madeEx===loggedEx)return'done';return'partial';
}
function refreshProgressDots(){document.querySelectorAll('.week-btn[data-phase][data-week]').forEach(btn=>{const phaseId=btn.getAttribute('data-phase'),weekNum=parseInt(btn.getAttribute('data-week')),dayCount=parseInt(btn.getAttribute('data-days')||'5');const status=getWeekProgress(phaseId,weekNum,dayCount,[]);const dot=btn.querySelector('.week-dot');if(dot)dot.className=`week-dot ${status}`;});}

// ── WAVE LOG MODAL ────────────────────────────────────────────────────────
function parseWaveRepCounts(setsStr){const s=setsStr||'3-2-1';const cross=s.match(/^(\d+)\s*[x×]\s*(\d+)$/i);if(cross){const count=parseInt(cross[1]);const reps=parseInt(cross[2]);return Array(count).fill(reps);}return s.split('-').map(Number).filter(n=>n>0);}
function openWaveLogModal(baseName,waveGroup,lk){
  modalState={exName:baseName,sets:'wave',load:'',rmId:getMaxIdForExercise(baseName)||'',logKey:lk,entries:[],isWave:true,waveGroup,extras:[]};
  document.getElementById('modal-ex-name').textContent=baseName;
  document.getElementById('modal-ex-meta').textContent=`Wave Loading \u00b7 ${waveGroup.length} waves`;
  let existing={};try{const v=localStorage.getItem(lk);if(v)existing=JSON.parse(v);}catch(e){}
  // Restore extras from saved data if present
  if(existing._extras&&Array.isArray(existing._extras))modalState.extras=existing._extras;
  modalState.waveEntries=waveGroup.map((wave,wi)=>{const reps=parseWaveRepCounts(wave.sets);return reps.map((r,si)=>{const prev=existing[`w${wi}_s${si}`]||{};return{outcome:prev.outcome||null,weight:prev.weight||''};});});
  renderWaveLogBody(existing);
  document.getElementById('log-modal-overlay').classList.add('open');
}
function renderWaveLogBody(existing){
  existing=existing||{};
  const u=getUnit();const baseName=modalState.exName;const waveGroup=modalState.waveGroup;
  let html='';
  waveGroup.forEach((wave,wi)=>{
    const repCounts=parseWaveRepCounts(wave.sets);
    const loads=wave.load.replace(/%/g,'').split('\u2013').map(s=>parseFloat(s.trim())).filter(n=>!isNaN(n));
    const maxForEx=getMaxForExercise(baseName);
    html+=`<div style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid var(--border);"><div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:10px;">Wave ${wi+1} \u00b7 ${wave.load}</div>`;
    repCounts.forEach((r,si)=>{const stored=modalState.waveEntries?.[wi]?.[si]||{};const prev=existing[`w${wi}_s${si}`]||{};const outcome=stored.outcome||prev.outcome;const mC=outcome==='made'?'selected':'',xC=outcome==='miss'?'selected':'';const pct=loads[si]!==undefined?loads[si]:(loads[0]||0);const sug=maxForEx&&pct?(u==='kg'?Math.round(pct/100*maxForEx/2.205):Math.round(pct/100*maxForEx)):'';const wVal=stored.weight||prev.weight||sug;
    html+=`<div class="log-set-row" id="set-row-w${wi}s${si}" style="margin-bottom:6px;"><div class="log-set-num">Set ${si+1} <span style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);font-weight:400;">${r}rep</span></div><div class="log-outcome"><button class="outcome-btn check ${mC}" onclick="setWaveOutcome(${wi},${si},'made')" title="Made">&#10003;</button><button class="outcome-btn x ${xC}" onclick="setWaveOutcome(${wi},${si},'miss')" title="Missed">&#10007;</button></div><input class="log-weight-input" type="number" id="wlog-${wi}-${si}" value="${wVal}" placeholder="\u2014" min="0"><span class="log-weight-unit">${u}</span></div>`;});
    html+='</div>';
  });
  // Render any additional lifts sections
  modalState.extras.forEach((extra,ei)=>{
    html+=`<div class="wave-extra-block"><div class="wave-extra-header"><div class="wave-extra-title">Additional Lifts${modalState.extras.length>1?' '+(ei+1):''}</div><button type="button" class="wave-extra-remove" onclick="removeWaveExtra(${ei})">Remove</button></div>`;
    for(let si=0;si<extra.entries.length;si++){
      const e=extra.entries[si]||{outcome:null,weight:''};
      const mC=e.outcome==='made'?'selected':'',xC=e.outcome==='miss'?'selected':'';
      html+=`<div class="log-set-row" id="set-row-extra${ei}-${si}" style="margin-bottom:6px;"><div class="log-set-num">Set ${si+1}</div><div class="log-outcome"><button class="outcome-btn check ${mC}" onclick="setExtraOutcome(${ei},${si},'made')" title="Made">&#10003;</button><button class="outcome-btn x ${xC}" onclick="setExtraOutcome(${ei},${si},'miss')" title="Missed">&#10007;</button></div><input class="log-weight-input" type="number" id="elog-${ei}-${si}" value="${e.weight||''}" placeholder="weight" min="0" oninput="modalState.extras[${ei}].entries[${si}].weight=parseFloat(this.value)||0;"><span class="log-weight-unit">${u}</span></div>`;
    }
    const canRemoveSet=extra.entries.length>1;
    html+=`<div class="set-controls"><button class="set-ctrl-btn minus" onclick="removeExtraSet(${ei})" ${canRemoveSet?'':'disabled'} title="Remove last set">&minus; Set</button><button class="set-ctrl-btn" onclick="addExtraSet(${ei})" title="Add a set">+ Set</button></div></div>`;
  });
  // Top-level "+ Additional Lifts" control
  html+=`<div class="set-controls"><button class="set-ctrl-btn" onclick="addWaveExtra()" title="Add an additional lifts section">+ Additional Lifts</button></div>`;
  document.getElementById('modal-sets-container').innerHTML=html;
}
// Capture current input values from the DOM into modalState before re-render
function captureWaveInputs(){
  if(modalState.waveEntries){modalState.waveEntries.forEach((wave,wi)=>wave.forEach((entry,si)=>{const inp=document.getElementById(`wlog-${wi}-${si}`);if(inp)entry.weight=parseFloat(inp.value)||entry.weight||'';}));}
  if(modalState.extras){modalState.extras.forEach((extra,ei)=>extra.entries.forEach((e,si)=>{const inp=document.getElementById(`elog-${ei}-${si}`);if(inp)e.weight=parseFloat(inp.value)||e.weight||'';}));}
}
function addWaveExtra(){captureWaveInputs();modalState.extras.push({entries:[{outcome:null,weight:''}]});renderWaveLogBody();}
function removeWaveExtra(ei){captureWaveInputs();modalState.extras.splice(ei,1);renderWaveLogBody();}
function addExtraSet(ei){captureWaveInputs();if(!modalState.extras[ei])return;modalState.extras[ei].entries.push({outcome:null,weight:''});renderWaveLogBody();}
function removeExtraSet(ei){captureWaveInputs();if(!modalState.extras[ei]||modalState.extras[ei].entries.length<=1)return;modalState.extras[ei].entries.pop();renderWaveLogBody();}
function setExtraOutcome(ei,si,outcome){if(!modalState.extras[ei]?.entries[si])return;const cur=modalState.extras[ei].entries[si].outcome;modalState.extras[ei].entries[si].outcome=cur===outcome?null:outcome;const row=document.getElementById(`set-row-extra${ei}-${si}`);if(row){row.querySelectorAll('.outcome-btn').forEach(b=>b.classList.remove('selected'));const newOutcome=modalState.extras[ei].entries[si].outcome;if(newOutcome)row.querySelector(`.outcome-btn.${newOutcome==='made'?'check':'x'}`)?.classList.add('selected');}}
function setWaveOutcome(wi,si,outcome){
  if(!modalState.waveEntries?.[wi]?.[si])return;
  const cur=modalState.waveEntries[wi][si].outcome;
  modalState.waveEntries[wi][si].outcome=cur===outcome?null:outcome;
  const row=document.getElementById(`set-row-w${wi}s${si}`);
  if(row){row.querySelectorAll('.outcome-btn').forEach(b=>b.classList.remove('selected'));const newOutcome=modalState.waveEntries[wi][si].outcome;if(newOutcome)row.querySelector(`.outcome-btn.${newOutcome==='made'?'check':'x'}`)?.classList.add('selected');}
}
function saveWaveLog(){
  const logData={};let maxW=0;const today=new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  modalState.waveEntries.forEach((wave,wi)=>{const waveReps=parseWaveRepCounts(modalState.waveGroup[wi]?.sets||'1');wave.forEach((entry,si)=>{const w=parseFloat(document.getElementById(`wlog-${wi}-${si}`)?.value)||0;const reps=waveReps[si]||1;logData[`w${wi}_s${si}`]={outcome:entry.outcome,weight:w,reps,date:today};if(entry.outcome==='made'&&w>maxW)maxW=w;});});
  // Capture extras
  if(modalState.extras&&modalState.extras.length){
    modalState.extras.forEach((extra,ei)=>{extra.entries.forEach((e,si)=>{const inp=document.getElementById(`elog-${ei}-${si}`);if(inp)e.weight=parseFloat(inp.value)||0;if(e.outcome==='made'&&e.weight>maxW)maxW=e.weight;});});
    logData._extras=modalState.extras;
  }
  logData._date=today;try{localStorage.setItem(modalState.logKey,JSON.stringify(logData));}catch(e){}
  if(maxW>0&&modalState.rmId&&!isNoPrExercise(modalState.exName)){const unit=getUnit(),inLbs=unit==='kg'?maxW*2.205:maxW;if(inLbs>(currentMaxes[modalState.rmId]||0)){currentMaxes[modalState.rmId]=Math.round(inLbs);try{localStorage.setItem(storageKey(),JSON.stringify(currentMaxes));}catch(e){}const el=document.getElementById(modalState.rmId);if(el)el.value=Math.round(inLbs);updateAllWeightCells();showPR(modalState.exName,maxW,unit);}}
  // Aggregate outcomes from waves AND extras
  const allOutcomes=[];
  Object.keys(logData).forEach(k=>{if(k.startsWith('w')&&logData[k]&&logData[k].outcome)allOutcomes.push(logData[k].outcome);});
  if(modalState.extras)modalState.extras.forEach(ex=>ex.entries.forEach(e=>{if(e.outcome)allOutcomes.push(e.outcome);}));
  const anyMade=allOutcomes.includes('made');
  const allMiss=allOutcomes.length>0&&allOutcomes.every(o=>o==='miss');
  const anyMixed=anyMade&&allOutcomes.includes('miss');
  const btn=document.querySelector(`[data-log-key="${modalState.logKey}"]`);
  if(btn){btn.classList.remove('logged-made','logged-miss','logged-mixed');if(anyMixed){btn.classList.add('logged-mixed');btn.innerHTML=`<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1,6 4,9 11,2"/></svg> MIXED<span class="log-date-stamp">${today}</span>`;}else if(anyMade){btn.classList.add('logged-made');btn.innerHTML=`<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1,6 4,9 11,2"/></svg> LOGGED<span class="log-date-stamp">${today}</span>`;}else if(allMiss){btn.classList.add('logged-miss');btn.innerHTML=`<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg> MISSED<span class="log-date-stamp">${today}</span>`;}}
  refreshProgressDots();closeModal();
}
function openWaveLogFromRegistry(lk){const reg=window._waveRegistry&&window._waveRegistry[lk];if(!reg)return;openWaveLogModal(reg.baseName,reg.waveGroup,lk);}

// ── ALL LIFTS ─────────────────────────────────────────────────────────────
// Loaded from lifts.json at startup — see loadExternalData()
let ALL_LIFTS_DB=[
  {cat:'Olympic',lifts:['Snatch','Clean & Jerk','Clean','Jerk','Split Jerk','Power Snatch','Power Clean','Hang Snatch','Hang Clean','High Hang Snatch','High Hang Clean','Muscle Snatch','Snatch Balance']},
  {cat:'Squat',lifts:['Back Squat','Front Squat','Overhead Squat','Box Squat','Pause Back Squat','Pause Front Squat','Zercher Squat','Goblet Squat','Bulgarian Split Squat','Hack Squat']},
  {cat:'Hinge / Pull',lifts:['Deadlift','Sumo Deadlift','Romanian Deadlift','Stiff Leg Deadlift','Good Morning','Snatch Grip Deadlift','Snatch Pull','Clean Pull','Pendlay Row','Bent Over Row','Barbell Row','T-Bar Row']},
  {cat:'Press',lifts:['Bench Press','Incline Bench','Close Grip Bench','Strict Press','Push Press','Push Jerk','Behind the Neck Press','Floor Press','Dumbbell Press','Incline Dumbbell Press']},
  {cat:'Accessory',lifts:['Pull-up','Chin-up','Dip','Cable Row','Face Pull','Lateral Raise','Barbell Curl','Hammer Curl','Reverse Curl','Skull Crushers','Tricep Pushdown','Wrist Curl','Reverse Wrist Curl']},
];

// ── FOOD DATABASE ─────────────────────────────────────────────────────────
// Loaded from foods.json at startup — see loadExternalData()
let FOODS_DB = [];

// Load both external JSON files
function loadExternalData(){
  const p1 = fetch('lifts.json').then(r=>r.ok?r.json():null).then(data=>{if(data&&Array.isArray(data))ALL_LIFTS_DB=data;}).catch(()=>{});
  const p2 = fetch('foods.json').then(r=>r.ok?r.json():null).then(data=>{if(data&&Array.isArray(data))FOODS_DB=data;}).catch(()=>{});
  return Promise.all([p1,p2]);
}
loadExternalData();
const ALL_LIFTS_SK='kc_all_lifts';
function loadAllLiftsData(){try{return JSON.parse(localStorage.getItem(userKey(ALL_LIFTS_SK))||'{}');}catch(e){return{};}}
function saveAllLiftsData(d){try{localStorage.setItem(userKey(ALL_LIFTS_SK),JSON.stringify(d));}catch(e){}}
function openAllLifts(){const ov=document.getElementById('all-lifts-overlay'),md=document.getElementById('all-lifts-modal');ov.style.opacity='1';ov.style.pointerEvents='auto';md.style.transform='translateY(0)';document.getElementById('all-lifts-search').value='';renderAllLiftsBody('');}
function closeAllLifts(){const ov=document.getElementById('all-lifts-overlay'),md=document.getElementById('all-lifts-modal');ov.style.opacity='0';ov.style.pointerEvents='none';md.style.transform='translateY(100%)';}
function maybeCloseAllLifts(e){if(e.target===document.getElementById('all-lifts-overlay'))closeAllLifts();}
function filterAllLifts(q){renderAllLiftsBody(q);}
function renderAllLiftsBody(query){
  const data=loadAllLiftsData(),q=query.toLowerCase().trim(),u=getUnit();let html='';
  ALL_LIFTS_DB.forEach(group=>{const filtered=q?group.lifts.filter(l=>l.toLowerCase().includes(q)):group.lifts;if(!filtered.length)return;html+=`<div style="padding:16px 20px 0;"><div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--accent);margin-bottom:12px;">${group.cat}</div>`;filtered.forEach(lift=>{const key=lift.replace(/[\s&]/g,'_');const saved=data[key]||{};const inputs=['1RM','3RM','5RM'].map(rm=>{const v=saved[rm]||'';return`<div style="display:flex;flex-direction:column;gap:3px;flex:1;"><div style="font-family:'DM Mono',monospace;font-size:8px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);">${rm}</div><div style="display:flex;align-items:center;gap:3px;"><input type="number" id="al_${key}_${rm}" value="${v}" placeholder="\u2014" min="0" style="width:100%;background:var(--input-bg);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:12px;padding:6px;border-radius:2px;outline:none;text-align:center;" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'"><span style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);white-space:nowrap;">${u}</span></div></div>`;}).join('');html+=`<div style="margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--border);"><div style="font-size:13px;color:var(--text);margin-bottom:8px;">${lift}</div><div style="display:flex;gap:8px;">${inputs}</div></div>`;});html+='</div>';});
  document.getElementById('all-lifts-body').innerHTML=html||`<div style="padding:40px 20px;font-family:'DM Mono',monospace;font-size:12px;color:var(--muted);text-align:center;">No lifts found</div>`;
}
function saveAllLifts(){
  const data=loadAllLiftsData(),u=getUnit(),prs=[];
  ALL_LIFTS_DB.forEach(group=>{group.lifts.forEach(lift=>{const key=lift.replace(/[\s&]/g,'_');const saved=data[key]||{};['1RM','3RM','5RM'].forEach(rm=>{const el=document.getElementById(`al_${key}_${rm}`);if(!el||!el.value)return;const nv=parseFloat(el.value),ov=parseFloat(saved[rm])||0;if(nv>ov)prs.push({lift,rm,weight:nv,unit:u});saved[rm]=nv;});data[key]=saved;});});
  saveAllLiftsData(data);
  if(prs.length){closeAllLifts();setTimeout(()=>{showLiftPR(prs[0],prs.length);launchConfetti();},200);}else{closeAllLifts();}
}
function showLiftPR(pr,count){
  const toast=document.getElementById('pr-lift-toast');
  document.getElementById('pr-lift-msg').textContent=count>1?`\u{1F3C6} ${count} NEW PRs!`:'\u{1F3C6} NEW PR!';
  document.getElementById('pr-lift-sub').textContent=`${pr.lift} \u00b7 ${pr.rm} \u00b7 ${pr.weight} ${pr.unit}`;
  toast.style.transform='translateX(-50%) translateY(0)';toast.style.opacity='1';
  setTimeout(()=>{toast.style.transform='translateX(-50%) translateY(120px)';toast.style.opacity='0';},5000);
}
