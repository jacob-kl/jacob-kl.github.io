// ── 1RM PANEL ────────────────────────────────────────────────────────────
const MEMBER_FIELDS=[{id:'rm-snatch',label:'Snatch'},{id:'rm-cj',label:'Clean & Jerk'},{id:'rm-backsquat',label:'Back Squat'},{id:'rm-frontsquat',label:'Front Squat'},{id:'rm-ohsquat',label:'Overhead Squat'},{id:'rm-goodmorning',label:'Good Morning'},{id:'rm-deadlift',label:'Deadlift'}];
const ADMIN_FIELDS=[{id:'rm-snatch',label:'Snatch'},{id:'rm-cj',label:'Clean & Jerk'},{id:'rm-backsquat',label:'Back Squat'},{id:'rm-frontsquat',label:'Front Squat'},{id:'rm-ohsquat',label:'Overhead Squat'},{id:'rm-bench',label:'Bench Press'},{id:'rm-press',label:'Strict Press'},{id:'rm-deadlift',label:'Deadlift'},{id:'rm-goodmorning',label:'Good Morning'}];
function buildRmPanel(){const fields=currentView==='admin'?ADMIN_FIELDS:MEMBER_FIELDS;document.getElementById('rm-grid').innerHTML=fields.map(f=>`<div class="rm-field"><label>${f.label}</label><input type="number" id="${f.id}" placeholder="lbs" min="0"></div>`).join('');}

const RM_MAP=[
  {keys:['snatch pull','snatch grip stage','front banded snatch','block snatch high pull','snatch high pull','snatch high hang high pull'],id:'rm-snatch'},
  {keys:['clean pull','front banded clean pull','block clean high pull','stage clean deadlift'],id:'rm-cj'},
  {keys:['split jerk','push jerk','jerk dip','jerk from rack','jerk (from rack)','2 jerk dip'],id:'rm-cj'},
  {keys:['strict press','push press'],id:'rm-press'},
  {keys:['overhead squat','ohs'],id:'rm-ohsquat'},
  {keys:['front squat','enderton front squat','pause front squat'],id:'rm-frontsquat'},
  {keys:['back squat','pause back squat','enderton back squat'],id:'rm-backsquat'},
  {keys:['clean & jerk','clean and jerk','c&j opener','c&j 2nd','c&j 3rd','c&j warm'],id:'rm-cj'},
  {keys:['block clean','tempo clean','hang clean','clean w/','clean (','3 position clean','high hang clean','mid hang clean','clean \u2014 build','clean (slow pull)','clean'],id:'rm-cj'},
  {keys:['mid hang snatch','hang snatch','deficit snatch','3-position snatch','3 position snatch','power snatch','snatch balance','muscle snatch','snatch high hang','snatch (competition)','snatch (light','snatch \u2014 build','snatch opener','snatch 2nd','snatch 3rd','snatch warm','snatch'],id:'rm-snatch'},
  {keys:['bench press','bench'],id:'rm-bench'},
  {keys:['good morning','goblet'],id:'rm-goodmorning'},
  {keys:['deadlift'],id:'rm-deadlift'},
];
const BW_EXERCISES=['side plank','box jump','glute ham raise','barbell rollout','split squat box jump','back extension'];
// Pulls and accessories that should never update a 1RM even if logged above max
const NO_PR_EXERCISES=['snatch pull','snatch high pull','snatch grip deadlift','snatch grip stage','front banded snatch','block snatch high pull','snatch high hang high pull','clean pull','clean high pull','front banded clean pull','block clean high pull','stage clean deadlift','clean grip deadlift','good morning','bent over row','pendlay row','barbell row','back extension','glute ham raise','hamstring curl','hammer curl','skull','wrist curl','reverse wrist curl','box jump','med ball','barbell rollout','side plank','forward lunge','bulgarian split squat'];
function isNoPrExercise(name){const n=name.toLowerCase();return NO_PR_EXERCISES.some(k=>n.includes(k));}
function isFixedWeight(loadStr){if(!loadStr||loadStr==='—')return false;return !loadStr.includes('%');}
function isBWExercise(name){const n=name.toLowerCase();return BW_EXERCISES.some(bw=>n.includes(bw));}

let currentMaxes={};
const SK_MEMBER='kiloclub_maxes_member', SK_ADMIN='kiloclub_maxes_admin';
function storageKey(){return userKey(currentView==='admin'?SK_ADMIN:SK_MEMBER);}
function loadSavedMaxes(){try{const s=localStorage.getItem(storageKey());currentMaxes=s?JSON.parse(s):{};Object.entries(currentMaxes).forEach(([id,val])=>{const el=document.getElementById(id);if(el&&val)el.value=val;});}catch(e){currentMaxes={};}updateOlympicTotal();updatePowerTotal();}
function confirmMaxes(){
  const all=[...new Set([...MEMBER_FIELDS,...ADMIN_FIELDS].map(f=>f.id))];
  all.forEach(id=>{const el=document.getElementById(id);if(el)currentMaxes[id]=el.value?parseFloat(el.value):null;});
  try{localStorage.setItem(storageKey(),JSON.stringify(currentMaxes));}catch(e){}
  updateAllWeightCells();const s=document.getElementById('rm-status');s.classList.add('visible');setTimeout(()=>s.classList.remove('visible'),2500);
  updateOlympicTotal();
  updatePowerTotal();
}
function getMaxForExercise(name){const n=name.toLowerCase();for(const e of RM_MAP){if(e.keys.some(k=>n.includes(k)))return currentMaxes[e.id]||null;}return null;}
function getMaxIdForExercise(name){const n=name.toLowerCase();for(const e of RM_MAP){if(e.keys.some(k=>n.includes(k)))return e.id;}return null;}
function parsePercentages(s){const m=s.match(/\d+\.?\d*/g);return m?m.map(Number).filter(n=>n>0&&n<=140):[];}
function getUnit(){const s=document.getElementById('unit-select');return s?s.value:'lbs';}
function changeUnit(u){try{localStorage.setItem(userKey('kiloclub_unit'),u);}catch(e){}updateAllWeightCells();}
function calcWeight(loadStr,max,exName){
  if(isBWExercise(exName||''))return'BW';
  if(isFixedWeight(loadStr))return loadStr||null;
  if(!max||max<=0)return null;
  const pcts=parsePercentages(loadStr);if(!pcts.length)return null;
  const u=getUnit(),lo=pcts[0]/100*max,hi=pcts[pcts.length-1]/100*max;
  if(u==='kg'){const a=Math.round(lo/2.205),b=Math.round(hi/2.205);return a===b?`${a} kg`:`${a}\u2013${b} kg`;}
  else{const a=Math.round(lo),b=Math.round(hi);return a===b?`${a} lbs`:`${a}\u2013${b} lbs`;}
}
function updateAllWeightCells(){document.querySelectorAll('.weight-cell').forEach(cell=>{const ex=cell.getAttribute('data-ex');const r=calcWeight(cell.getAttribute('data-load'),getMaxForExercise(ex),ex);if(r){cell.innerHTML=r;cell.classList.remove('empty');}else{cell.innerHTML='\u2014';cell.classList.add('empty');}});}

// ── LOG MODAL ────────────────────────────────────────────────────────────
let modalState={exName:'',sets:'',load:'',rmId:null,entries:[]};
function parseSetCount(s){if(/^\d+-\d+-\d+$/.test(s.trim()))return 1;const groups=s.split('/').map(g=>g.trim()).filter(Boolean);let total=0;for(const g of groups){const mParen=g.match(/^(\d+)\s*[x\u00d7]\s*\(/i);if(mParen){total+=parseInt(mParen[1]);continue;}const m=g.match(/^(\d+)[x\u00d7]/i);if(m)total+=parseInt(m[1]);else total+=1;}return Math.min(total,12);}
function openLogModal(exName,setsStr,loadStr,rmId,lk){
  modalState={exName,sets:setsStr,load:loadStr,rmId,logKey:lk,entries:[],isWave:false};
  document.getElementById('modal-ex-name').textContent=exName;
  document.getElementById('modal-ex-meta').textContent=setsStr+'  \u00b7  '+loadStr;
  let existing={};try{const v=localStorage.getItem(lk);if(v)existing=JSON.parse(v);}catch(e){}
  const baseCount=parseSetCount(setsStr),u=getUnit();
  // Restore previous added-sets count if user added extras last time
  const savedKeys=Object.keys(existing).filter(k=>/^\d+$/.test(k)).map(Number);
  const maxIdx=savedKeys.length?Math.max(...savedKeys):-1;
  const count=Math.max(baseCount,maxIdx+1);
  modalState.originalCount=baseCount;
  modalState.currentCount=count;
  const suggestedWeight=(()=>{const max=getMaxForExercise(exName);if(!max)return'';const pcts=parsePercentages(loadStr);if(!pcts.length)return'';const mid=pcts[Math.floor(pcts.length/2)];const raw=mid/100*max;return u==='kg'?Math.round(raw/2.205):Math.round(raw);})();
  modalState.suggestedWeight=suggestedWeight;
  modalState.entries=Array.from({length:count},(_,i)=>{const prev=existing[i]||{};return{outcome:prev.outcome||null,weight:prev.weight||(suggestedWeight||'')};});
  renderLogSets();
  document.getElementById('log-modal-overlay').classList.add('open');
}
function renderLogSets(){
  const u=getUnit();const count=modalState.currentCount;const baseCount=modalState.originalCount;
  let html='';
  for(let i=0;i<count;i++){
    const e=modalState.entries[i]||{};
    const mC=e.outcome==='made'?'selected':'',xC=e.outcome==='miss'?'selected':'';
    const wVal=e.weight||modalState.suggestedWeight||'';
    const addedClass=i>=baseCount?'added-set':'';
    html+=`<div class="log-set-row ${addedClass}" id="set-row-${i}"><div class="log-set-num">Set ${i+1}</div><div class="log-outcome"><button class="outcome-btn check ${mC}" onclick="setOutcome(${i},'made')" title="Made">&#10003;</button><button class="outcome-btn x ${xC}" onclick="setOutcome(${i},'miss')" title="Missed">&#10007;</button></div><input class="log-weight-input" type="number" id="log-w-${i}" value="${wVal}" placeholder="weight" min="0"><span class="log-weight-unit">${u}</span></div>`;
  }
  // +/- controls — minus only enabled when count > originalCount
  const canRemove=count>baseCount;
  html+=`<div class="set-controls"><button class="set-ctrl-btn minus" onclick="removeSet()" ${canRemove?'':'disabled'} title="Remove last added set">&minus; Set</button><button class="set-ctrl-btn" onclick="addSet()" title="Add a set">+ Set</button></div>`;
  document.getElementById('modal-sets-container').innerHTML=html;
}
function addSet(){
  // Capture current weights before re-render
  for(let i=0;i<modalState.currentCount;i++){
    const w=document.getElementById(`log-w-${i}`);
    if(w&&modalState.entries[i])modalState.entries[i].weight=parseFloat(w.value)||modalState.entries[i].weight;
  }
  modalState.currentCount++;
  modalState.entries.push({outcome:null,weight:modalState.suggestedWeight||''});
  renderLogSets();
}
function removeSet(){
  if(modalState.currentCount<=modalState.originalCount)return;
  // Capture current weights before re-render
  for(let i=0;i<modalState.currentCount;i++){
    const w=document.getElementById(`log-w-${i}`);
    if(w&&modalState.entries[i])modalState.entries[i].weight=parseFloat(w.value)||modalState.entries[i].weight;
  }
  modalState.currentCount--;
  modalState.entries.pop();
  renderLogSets();
}
function setOutcome(idx,outcome){if(!modalState.entries[idx])return;modalState.entries[idx].outcome=outcome;const row=document.getElementById(`set-row-${idx}`);row.querySelectorAll('.outcome-btn').forEach(b=>b.classList.remove('selected'));row.querySelector(`.outcome-btn.${outcome==='made'?'check':'x'}`).classList.add('selected');}
function saveLog(){
  if(modalState.isWave){saveWaveLog();return;}
  const count=modalState.currentCount||modalState.entries.length,logData={};let anyMade=false,maxW=0;xW=0;
  const today=new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  const totalSets=count;const setsStr=modalState.sets||'';const repArr=(()=>{const s=setsStr.trim();const m=s.match(/^(\d+)\s*[x×]\s*(\d+)/i);if(m)return Array(parseInt(m[1])).fill(parseInt(m[2]));const parts=s.split('-').map(Number).filter(n=>n>0);if(parts.length>1)return parts;return Array(totalSets).fill(1);})();for(let i=0;i<count;i++){const w=parseFloat(document.getElementById(`log-w-${i}`)?.value)||0;const reps=repArr[i]||repArr[0]||1;modalState.entries[i].weight=w;logData[i]={outcome:modalState.entries[i].outcome,weight:w,reps,date:today};if(modalState.entries[i].outcome==='made'&&w>maxW){maxW=w;anyMade=true;}}
  logData._date=today;try{localStorage.setItem(modalState.logKey,JSON.stringify(logData));}catch(e){}
  if(anyMade&&modalState.rmId&&!isNoPrExercise(modalState.exName)){const unit=getUnit(),wLbs=unit==='kg'?maxW*2.205:maxW,curMax=currentMaxes[modalState.rmId]||0;if(wLbs>curMax){currentMaxes[modalState.rmId]=Math.round(wLbs);try{localStorage.setItem(storageKey(),JSON.stringify(currentMaxes));}catch(e){}const el=document.getElementById(modalState.rmId);if(el)el.value=Math.round(wLbs);updateAllWeightCells();showPR(modalState.exName,maxW,unit);}}
  const oo=(()=>{const outcomes=Object.values(logData).map(e=>e.outcome).filter(Boolean);if(!outcomes.length)return null;if(outcomes.every(o=>o==='made'))return'made';if(outcomes.every(o=>o==='miss'))return'miss';return'mixed';})();
  const btn=document.querySelector(`[data-log-key="${modalState.logKey}"]`);
  if(btn&&oo){btn.classList.remove('logged-made','logged-miss','logged-mixed');btn.classList.add(oo==='made'?'logged-made':oo==='miss'?'logged-miss':'logged-mixed');btn.innerHTML=oo==='made'?`<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1,6 4,9 11,2"/></svg> LOGGED<span class="log-date-stamp">${today}</span>`:oo==='miss'?`<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg> MISSED<span class="log-date-stamp">${today}</span>`:`<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1,6 4,9 11,2"/></svg> MIXED<span class="log-date-stamp">${today}</span>`;}
  refreshProgressDots();closeModal();
}
function closeModal(){document.getElementById('log-modal-overlay').classList.remove('open');}
function maybeCloseModal(e){if(e.target===document.getElementById('log-modal-overlay'))closeModal();}
function showPR(exName,weight,unit){const toast=document.getElementById('pr-toast');document.getElementById('pr-toast-msg').textContent='&#127942; NEW PR!';document.getElementById('pr-toast-sub').textContent=`${exName} \u00b7 ${weight} ${unit}`;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),4000);}
function logKey(phaseId,weekNum,dayIdx,exIdx){return userKey(`kc_log_${currentView==='admin'?'admin':'member'}_${phaseId}_w${weekNum}_d${dayIdx}_e${exIdx}`);}

// ── DAILY NOTES ──────────────────────────────────────────────────────────
function notesKey(phaseId,weekNum,dayIdx){return userKey(`kc_notes_${currentView==='admin'?'admin':'member'}_${phaseId}_w${weekNum}_d${dayIdx}`);}
function saveNote(key,val){try{localStorage.setItem(key,val);}catch(e){}}
function loadNote(key){try{return localStorage.getItem(key)||'';}catch(e){return'';}}
function toggleNotes(btn,bodyId){const body=document.getElementById(bodyId);const open=body.classList.toggle('open');btn.classList.toggle('open',open);}
  
// ── DAILY FEELING RATING ─────────────────────────────────────────────────
const FEELING_LABELS=['Rough','Tough','OK','Good','Great'];
const FEELING_EMOJIS=['😣','😕','😐','🙂','💪'];
function feelingKey(phaseId,weekNum,dayIdx){return userKey(`kc_feeling_${currentView==='admin'?'admin':'member'}_${phaseId}_w${weekNum}_d${dayIdx}`);}
function loadFeeling(key){try{const v=localStorage.getItem(key);return v?parseInt(v):null;}catch(e){return null;}}
function saveFeeling(key,rating){try{if(rating)localStorage.setItem(key,String(rating));else localStorage.removeItem(key);}catch(e){}}
function setFeeling(key,rating,btnId){
  const cur=loadFeeling(key);
  const newRating=cur===rating?null:rating; // tap again to clear
  saveFeeling(key,newRating);
  // Update UI
  document.querySelectorAll(`[data-feeling-key="${btnId}"] .feeling-btn`).forEach(b=>b.classList.remove('selected'));
  if(newRating){const btn=document.querySelector(`[data-feeling-key="${btnId}"] .feeling-btn[data-rating="${newRating}"]`);if(btn)btn.classList.add('selected');}
}
function feelingScaleHtml(fKey,scopeId){
  const cur=loadFeeling(fKey);
  let html=`<div class="feeling-row" data-feeling-key="${scopeId}"><div class="feeling-label">How'd today go?</div><div class="feeling-scale">`;
  for(let i=1;i<=5;i++){
    const sel=cur===i?'selected':'';
    html+=`<button type="button" class="feeling-btn ${sel}" data-rating="${i}" onclick="setFeeling('${fKey}',${i},'${scopeId}')"><span class="emoji">${FEELING_EMOJIS[i-1]}</span><span>${FEELING_LABELS[i-1]}</span></button>`;
  }
  html+=`</div></div>`;
  return html;
}

// ── DAY METRICS ─────────────────────────────────────────────────────────────
function timeKey(phaseId,weekNum,dayIdx){return userKey(`kc_time_${currentView==='admin'?'admin':'member'}_${phaseId}_w${weekNum}_d${dayIdx}`);}
function loadTimeWorked(key){try{return localStorage.getItem(key)||'';}catch(e){return'';}}
function saveTimeWorked(key,val){try{if(val.trim())localStorage.setItem(key,val.trim());else localStorage.removeItem(key);}catch(e){}}

function calcDayVolume(awKey){
  // Sum from "Add Workout" logger
  const saved=loadSavedWorkouts(awKey);
  let total=0;
  saved.forEach(w=>{
    if(w.type!=='lift')return;
    w.movements.forEach(m=>{
      const setsArr=Array.isArray(m.sets)?m.sets:[];
      setsArr.forEach(s=>{
        const reps=parseInt(s.reps)||0;
        const wMatch=(s.weight||'').match(/([\d.]+)/);
        const wt=wMatch?parseFloat(wMatch[1]):0;
        total+=reps*wt;
      });
    });
  });
  // Sum from per-exercise LOG buttons (both regular and wave) for this day
  // Key pattern: userKey('kc_log_{role}_{awKey}_e{N}')
  try{
    const role=currentView==='admin'?'admin':'member';
    const dayPattern=userKey(`kc_log_${role}_${awKey}_e`);
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(!k||!k.startsWith(dayPattern))continue;
      const logData=JSON.parse(localStorage.getItem(k)||'{}')||{};
      Object.keys(logData).forEach(ek=>{
        // Regular entries have numeric keys; wave entries have w{N}_s{N} keys
        const isRegular=/^\d+$/.test(ek);
        const isWave=/^w\d+_s\d+$/.test(ek);
        if(!isRegular&&!isWave)return;
        const entry=logData[ek];
        if(!entry||!entry.weight)return;
        const wt=parseFloat(entry.weight)||0;
        if(wt<=0)return;
        let reps=entry.reps||1;
        if(!entry.reps&&isWave){
          const reg=window._waveRegistry&&window._waveRegistry[k];
          if(reg){const wm=ek.match(/^w(\d+)_s(\d+)$/);if(wm){const wi=parseInt(wm[1]),si=parseInt(wm[2]);const wave=reg.waveGroup[wi];if(wave){const rc=parseWaveRepCounts(wave.sets);reps=rc[si]||1;}}}
        }
        total+=reps*wt;
      });
    }
  }catch(e){}
  return total;
}

function dayMetricsHtml(awKey,tKey,scopeId){
  const vol=calcDayVolume(awKey);
  const volStr=vol>0?vol.toLocaleString()+' lbs':'—';
  const volCls=vol>0?'':'muted';
  // Parse stored "H:MM" or "HH:MM" back into hr/min fields
  const stored=loadTimeWorked(tKey);
  let initH='',initM='';
  if(stored){const parts=stored.split(':');initH=parts[0]||'';initM=parts[1]||'';}
  return `<div class="day-metrics-row">
    <div class="day-metric">
      <div class="day-metric-label">Total Volume</div>
      <div class="day-metric-value ${volCls}" id="vol-${scopeId}">${volStr}</div>
    </div>
    <div class="day-metric">
      <div class="day-metric-label">Time Worked</div>
      <div style="display:flex;align-items:baseline;gap:2px;">
        <input type="number" min="0" max="9" placeholder="0"
          value="${initH}"
          id="time-h-${scopeId}"
          oninput="saveTimeFields('${tKey}','time-h-${scopeId}','time-m-${scopeId}')"
          style="background:none;border:none;color:var(--text);font-family:'DM Mono',monospace;font-size:15px;width:28px;outline:none;padding:0;-moz-appearance:textfield;"
          onfocus="this.style.color='var(--accent)'" onblur="this.style.color='var(--text)'">
        <span style="font-family:'DM Mono',monospace;font-size:13px;color:var(--muted);">h</span>
        <input type="number" min="0" max="59" placeholder="00"
          value="${initM}"
          id="time-m-${scopeId}"
          oninput="saveTimeFields('${tKey}','time-h-${scopeId}','time-m-${scopeId}')"
          style="background:none;border:none;color:var(--text);font-family:'DM Mono',monospace;font-size:15px;width:34px;outline:none;padding:0;margin-left:4px;-moz-appearance:textfield;"
          onfocus="this.style.color='var(--accent)'" onblur="this.style.color='var(--text)'">
        <span style="font-family:'DM Mono',monospace;font-size:13px;color:var(--muted);">m</span>
      </div>
    </div>
  </div>`;
}

function saveTimeFields(tKey,hId,mId){
  const h=(document.getElementById(hId)?.value||'').trim();
  const m=(document.getElementById(mId)?.value||'').trim();
  const val=(h||m)?`${h||'0'}:${(m||'0').padStart(2,'0')}`:'';
  saveTimeWorked(tKey,val);
}

// Call after awSave to refresh volume display for the relevant day
function refreshDayVolume(awKey){
  const scopeId=awKey.replace(/[^a-z0-9]/gi,'-');
  const el=document.getElementById('vol-'+scopeId);
  if(!el)return;
  const vol=calcDayVolume(awKey);
  el.textContent=vol>0?vol.toLocaleString()+' lbs':'—';
  el.className='day-metric-value'+(vol>0?'':' muted');
}

function loadView(){
  if(currentView==='nutrition'){updateViewLabels();initNutritionPanel();return;}
  buildRmPanel();loadSavedMaxes();
  if(currentView==='admin'){
    document.getElementById('cycle-select-wrap').style.display='none';
    document.getElementById('admin-cycle-select-wrap').style.display='flex';
    // Auto-select the most recent cycle whose start date is on or before today,
    // but only if the user hasn't manually changed it this session
    const sel=document.getElementById('admin-cycle-select');
    if(!sel.dataset.manuallySet){
      const today=new Date();today.setHours(0,0,0,0);
      let bestVal=null,bestDate=null;
      Array.from(sel.options).forEach(opt=>{
        const s=opt.dataset.start;
        if(!s)return;
        const d=new Date(s);
        if(d<=today&&(!bestDate||d>bestDate)){bestDate=d;bestVal=opt.value;}
      });
      if(bestVal)sel.value=bestVal;
    }
    const adminCycleId=sel.value;
    fetch('cycles/'+adminCycleId+'.json').then(r=>{if(!r.ok)throw new Error();return r.json();}).then(data=>{renderCycle(data);requestAnimationFrame(()=>requestAnimationFrame(scrollToToday));}).catch(()=>{document.getElementById('program-body').innerHTML='<div class="state-message error">Could not load admin program. Run from a web server.</div>';});
  } else {
    document.getElementById('cycle-select-wrap').style.display='flex';
    document.getElementById('admin-cycle-select-wrap').style.display='none';
    loadCycle(document.getElementById('cycle-select').value);
  }
}
function scrollToToday(){
  const today=new Date();today.setHours(0,0,0,0);
  const isAdminView=currentView==='admin';
  const base=isAdminView?new Date(CYCLE_ADMIN_START):new Date(CYCLE_MEMBER_START);
  let targetCard=null;
  document.querySelectorAll('.week-content').forEach(weekEl=>{
    const m=weekEl.id.match(/-w(\d+)$/);if(!m)return;
    const wNum=parseInt(m[1]);
    weekEl.querySelectorAll('.day-card').forEach(card=>{
      const off=card.getAttribute('data-day-offset');if(off===null)return;
      const d=new Date(base);d.setDate(d.getDate()+(wNum-1)*7+parseInt(off));
      if(d.getTime()===today.getTime())targetCard=card;
    });
  });
  if(targetCard){
    const barEl=document.getElementById(isAdminView?'admin-bar':'member-bar');
    const barH=(barEl?.offsetHeight||52)+12;
    const rect=targetCard.getBoundingClientRect();
    window.scrollTo({top:window.scrollY+rect.top-barH,behavior:'smooth'});
    targetCard.style.transition='box-shadow .3s';
    targetCard.style.boxShadow='0 0 0 2px var(--accent)';
    setTimeout(()=>{targetCard.style.boxShadow='';},2000);
  }
}
function onCycleChange(v){if(currentView==='member')loadCycle(v);}
function loadCycle(id){document.getElementById('program-body').innerHTML='<div class="state-message">Loading program\u2026</div>';fetch('cycles/'+id+'.json').then(r=>{if(!r.ok)throw new Error();return r.json();}).then(data=>{renderCycle(data);requestAnimationFrame(()=>requestAnimationFrame(scrollToToday));}).catch(()=>{document.getElementById('program-body').innerHTML='<div class="state-message error">Could not load cycle. Requires web server. Run: python3 -m http.server 8080</div>';});}
