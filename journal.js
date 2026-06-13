// ── NOTES JOURNAL ────────────────────────────────────────────────────────
function openNotesJournal(){
  renderNotesJournal();
  const ov=document.getElementById('notes-journal-overlay');
  const md=document.getElementById('notes-journal-modal');
  ov.style.opacity='1';ov.style.pointerEvents='auto';
  md.style.transform='translateY(0)';
}
function closeNotesJournal(){
  const ov=document.getElementById('notes-journal-overlay');
  const md=document.getElementById('notes-journal-modal');
  ov.style.opacity='0';ov.style.pointerEvents='none';
  md.style.transform='translateY(100%)';
}
function maybeCloseNotesJournal(e){
  if(e.target===document.getElementById('notes-journal-overlay'))closeNotesJournal();
}
function renderNotesJournal(){
  const prefix=currentView==='admin'?'admin':'member';
  const isAdm=currentView==='admin';

  // ── 1. Collect entries from text notes ──────────────────────────────────
  const byKey={}; // key: "phaseId|weekNum|dayIdx"
  const notesPrefix=userKey(`kc_notes_${prefix}_`);
  try{
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(!k||!k.startsWith(notesPrefix))continue;
      const val=localStorage.getItem(k);
      if(!val||!val.trim())continue;
      const bare=currentUsername?k.slice(`u_${currentUsername}_`.length):k;
      const m=bare.match(/kc_notes_(?:admin|member)_(.+)_w(\d+)_d(\d+)$/);
      if(!m)continue;
      const ek=`${m[1]}|${m[2]}|${m[3]}`;
      byKey[ek]={phaseId:m[1],weekNum:parseInt(m[2]),dayIdx:parseInt(m[3]),note:val.trim()};
    }
  }catch(e){}

  // ── Also collect days with only a feeling rating ─────────────────
  try{
    const fPrefix=userKey(`kc_feeling_${prefix}_`);
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(!k||!k.startsWith(fPrefix))continue;
      const bare=currentUsername?k.slice(`u_${currentUsername}_`.length):k;
      const m=bare.match(/kc_feeling_(?:admin|member)_(.+)_w(\d+)_d(\d+)$/);
      if(!m)continue;
      const ek=`${m[1]}|${m[2]}|${m[3]}`;
      if(!byKey[ek])byKey[ek]={phaseId:m[1],weekNum:parseInt(m[2]),dayIdx:parseInt(m[3]),note:''};
    }
  }catch(e){}
  
  // ── 2. Also collect days that have saved workouts (even with no notes) ──
  try{
    const allWO=JSON.parse(localStorage.getItem(userKey(AW_WORKOUTS_SK))||'{}');
    Object.keys(allWO).forEach(awKey=>{
      if(!allWO[awKey]||!allWO[awKey].length)return;
      const m=awKey.match(/^(.+)_w(\d+)_d(\d+)$/);
      if(!m)return;
      const wn=parseInt(m[2]),di=parseInt(m[3]);
      // Find any existing notes entry with this weekNum+dayIdx to merge into
      const existingKey=Object.keys(byKey).find(ek=>{
        const parts=ek.split('|');
        return parseInt(parts[1])===wn&&parseInt(parts[2])===di;
      });
      if(existingKey)return; // already covered by a notes entry
      // No notes for this day — add a stub entry using the awKey's phaseId
      const ek=`${m[1]}|${m[2]}|${m[3]}`;
      if(!byKey[ek])byKey[ek]={phaseId:m[1],weekNum:wn,dayIdx:di,note:''};
    });
  }catch(e){}

  const entries=Object.values(byKey).sort((a,b)=>a.weekNum!==b.weekNum?a.weekNum-b.weekNum:a.dayIdx-b.dayIdx);

  const countEl=document.getElementById('notes-journal-count');
  if(countEl)countEl.textContent=entries.length?`${entries.length} session${entries.length>1?'s':''} logged`:'';

  const body=document.getElementById('notes-journal-body');
  if(!entries.length){
    body.innerHTML=`<div style="padding:48px 20px;text-align:center;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);">No sessions logged yet.<br><br>Add workouts or use Day Notes under any workout.</div>`;
    return;
  }

  const nutLog=loadNutLog();
  let html='';
  entries.forEach((entry,ei)=>{
    const dayDate=getDayDate(entry.weekNum,entry.dayIdx,isAdm);

    // Lifts from DOM
    const weekEl=document.getElementById(`${entry.phaseId}-w${entry.weekNum}`);
    let liftsHtml='';
    if(weekEl){
      const dayCard=weekEl.querySelectorAll('.day-card')[entry.dayIdx];
      if(dayCard){
        dayCard.querySelectorAll('.ex-table tbody tr').forEach(row=>{
          const nameEl=row.querySelector('.ex-name,.wave-base-name');
          const weightEl=row.querySelector('.weight-cell');
          const logBtn=row.querySelector('.log-btn');
          if(!nameEl)return;
          const name=nameEl.textContent.trim();if(!name)return;
          const weightStr=weightEl&&!weightEl.classList.contains('empty')?weightEl.textContent.trim():'';
          const isLogged=logBtn&&logBtn.classList.contains('logged-made');
          const isMissed=logBtn&&logBtn.classList.contains('logged-miss');
          const isMixed=logBtn&&logBtn.classList.contains('logged-mixed');
          const statusDot=isMixed?`<span style="color:var(--ss3);margin-left:4px;">&#10003;</span>`:isLogged?`<span style="color:var(--accent2);margin-left:4px;">&#10003;</span>`:isMissed?`<span style="color:var(--accent3);margin-left:4px;">&#10007;</span>`:'';
          const weightDisplay=weightStr?` <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--accent);">(${weightStr})</span>`:'';
          liftsHtml+=`<div style="padding:3px 0;font-size:12px;color:var(--text);display:flex;align-items:baseline;gap:2px;">${name}${weightDisplay}${statusDot}</div>`;
        });
      }
    }

    // Nutrition
    const nutEntry=nutLog.find(e=>{
      const base=new Date(isAdm?2026:2026,2,isAdm?16:19);
      const offsets=isAdm?[0,1,2,4,5]:[0,4];
      base.setDate(base.getDate()+(entry.weekNum-1)*7+(offsets[entry.dayIdx]??entry.dayIdx));
      return e.date===base.toISOString().split('T')[0];
    });
    let nutSectionHtml='';
    if(nutEntry&&(nutEntry.meals||[]).some(m=>m.items?m.items.length:(m.cal||m.pro))){
      const meals=(nutEntry.meals||[]).filter(m=>m.items?m.items.length:(m.cal||m.pro));
      const dayT=nutDayTotals(nutEntry);
      let mealRows='';
      meals.forEach(m=>{
        const mt=mealTotals(m);if(!mt.cal&&!mt.pro&&!mt.carb&&!mt.fat)return;
        const timeStr=m.time?`<span style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);margin-left:6px;">${m.time}</span>`:'';
        mealRows+=`<div style="display:flex;align-items:baseline;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);gap:8px;flex-wrap:wrap;"><span style="font-size:12px;color:var(--text);">${m.name}${timeStr}</span><span style="font-family:'DM Mono',monospace;font-size:10px;display:flex;gap:10px;"><span style="color:var(--accent);">${mt.cal} kcal</span><span style="color:var(--accent2);">${mt.pro}g P</span><span style="color:var(--muted);">${mt.carb}g C &middot; ${mt.fat}g F</span></span></div>`;
      });
      nutSectionHtml=`<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border);"><div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">Nutrition</div>${mealRows}<div style="display:flex;gap:14px;padding-top:6px;font-family:'DM Mono',monospace;font-size:10px;"><span style="color:var(--accent);font-weight:500;">${dayT.cal} kcal total</span><span style="color:var(--accent2);">${dayT.pro}g protein</span><span style="color:var(--muted);">${dayT.carb}g carbs &middot; ${dayT.fat}g fat</span></div></div>`;
    }

    // Additional workouts — with fallback scan if phaseId doesn't match exactly
    const awHtml=getAWHtmlForJournalEntry(entry.phaseId,entry.weekNum,entry.dayIdx);

    // Badge count — scan by weekNum+dayIdx
    let awCount=0;
    try{const allWO=JSON.parse(localStorage.getItem(userKey(AW_WORKOUTS_SK))||'{}');Object.keys(allWO).forEach(k=>{if(awCount)return;const m=k.match(/^(.+)_w(\d+)_d(\d+)$/);if(m&&parseInt(m[2])===entry.weekNum&&parseInt(m[3])===entry.dayIdx&&allWO[k])awCount=allWO[k].length;});}catch(e){}
    const badges=[];
    if(liftsHtml)badges.push(`<span style="font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;text-transform:uppercase;color:var(--accent2);background:rgba(79,195,161,.1);border:1px solid rgba(79,195,161,.25);padding:2px 6px;border-radius:2px;">Program</span>`);
    if(awCount)badges.push(`<span style="font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;text-transform:uppercase;color:var(--accent);background:rgba(232,197,71,.1);border:1px solid rgba(232,197,71,.25);padding:2px 6px;border-radius:2px;">${awCount} Workout${awCount>1?'s':''}</span>`);
    if(entry.note)badges.push(`<span style="font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);background:var(--surface2);border:1px solid var(--border);padding:2px 6px;border-radius:2px;">Notes</span>`);

    const entryId=`nj-entry-${ei}`,bodyId=`nj-body-${ei}`;
    html+=`
    <div style="border-bottom:1px solid var(--border);">
      <button onclick="toggleNJEntry('${bodyId}','${entryId}')" id="${entryId}" style="width:100%;background:none;border:none;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;text-align:left;gap:12px;" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background='none'">
        <div style="display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;">
            <span style="font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px;color:var(--accent2);">Week ${entry.weekNum} &middot; Day ${entry.dayIdx+1}</span>
            <span style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1px;color:var(--muted);">${dayDate}</span>
          </div>
          ${badges.length?`<div style="display:flex;gap:5px;flex-wrap:wrap;">${badges.join('')}</div>`:''}
        </div>
        <span style="font-size:10px;color:var(--muted);transition:transform .2s;flex-shrink:0;" id="${entryId}-arrow">&#9660;</span>
      </button>
      <div id="${bodyId}" style="display:none;padding:0 20px 16px;">
        ${liftsHtml?`<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border);"><div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:6px;">Program Lifts</div>${liftsHtml}</div>`:''}
        ${awHtml}
        ${nutSectionHtml}
        ${(()=>{const fk=feelingKey(entry.phaseId,entry.weekNum,entry.dayIdx);const r=loadFeeling(fk);return r?`<div style="margin-bottom:10px;padding:8px 12px;background:var(--surface2);border-radius:3px;display:flex;align-items:center;gap:10px;"><span style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);">Felt:</span><span style="font-size:16px;">${FEELING_EMOJIS[r-1]}</span><span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--text);">${FEELING_LABELS[r-1]}</span></div>`:'';})()}
        ${(()=>{
          const awK=`${entry.phaseId}_w${entry.weekNum}_d${entry.dayIdx}`;
          const tk=timeKey(entry.phaseId,entry.weekNum,entry.dayIdx);
          const vol=calcDayVolume(awK);
          const tw=loadTimeWorked(tk);
          if(!vol&&!tw)return'';
          const parts=[];
          if(vol)parts.push(`<span style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);">Volume:</span> <span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--text);">${vol.toLocaleString()} lbs</span>`);
          if(tw)parts.push(`<span style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);">Time:</span> <span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--text);">${tw}</span>`);
          return`<div style="margin-bottom:10px;padding:8px 12px;background:var(--surface2);border-radius:3px;display:flex;align-items:center;gap:16px;">${parts.join('')}</div>`;
        })()}
        ${entry.note?`<div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:6px;">Notes</div><div style="font-size:13px;color:var(--text);line-height:1.7;white-space:pre-wrap;">${entry.note.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`:''}
      </div>
    </div>`;
  });
  body.innerHTML=html;
}
function toggleNJEntry(bodyId,btnId){
  const body=document.getElementById(bodyId);
  const arrow=document.getElementById(btnId+'-arrow');
  if(!body)return;
  const open=body.style.display==='none';
  body.style.display=open?'block':'none';
  if(arrow)arrow.style.transform=open?'rotate(180deg)':'';
}

function downloadNotesPDF(){
  // Use currentView (not currentRole) — notes are keyed by view, same as notesKey()
  const prefix=currentView==='admin'?'admin':'member';
  const isAdm=currentView==='admin';

  // Collect entries — exact same logic as renderNotesJournal
  const byKey={}; // key: "phaseId|weekNum|dayIdx"
  const notesPrefix=userKey(`kc_notes_${prefix}_`);
  try{
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(!k||!k.startsWith(notesPrefix))continue;
      const val=localStorage.getItem(k);
      if(!val||!val.trim())continue;
      // Strip the userKey prefix before regex matching
      const bare=currentUsername?k.slice(`u_${currentUsername}_`.length):k;
      const m=bare.match(/kc_notes_(?:admin|member)_(.+)_w(\d+)_d(\d+)$/);
      if(!m)continue;
      const ek=`${m[1]}|${m[2]}|${m[3]}`;
      byKey[ek]={phaseId:m[1],weekNum:parseInt(m[2]),dayIdx:parseInt(m[3]),note:val.trim()};
    }
  }catch(e){}

  // Also collect days with only a feeling rating
  try{
    const fPrefix=userKey(`kc_feeling_${prefix}_`);
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(!k||!k.startsWith(fPrefix))continue;
      const bare=currentUsername?k.slice(`u_${currentUsername}_`.length):k;
      const m=bare.match(/kc_feeling_(?:admin|member)_(.+)_w(\d+)_d(\d+)$/);
      if(!m)continue;
      const ek=`${m[1]}|${m[2]}|${m[3]}`;
      if(!byKey[ek])byKey[ek]={phaseId:m[1],weekNum:parseInt(m[2]),dayIdx:parseInt(m[3]),note:''};
    }
  }catch(e){}

  // Also collect days that have saved workouts (even with no notes)
  try{
    const allWO=JSON.parse(localStorage.getItem(userKey(AW_WORKOUTS_SK))||'{}');
    Object.keys(allWO).forEach(awKey=>{
      if(!allWO[awKey]||!allWO[awKey].length)return;
      const m=awKey.match(/^(.+)_w(\d+)_d(\d+)$/);
      if(!m)return;
      const wn=parseInt(m[2]),di=parseInt(m[3]);
      const existingKey=Object.keys(byKey).find(ek=>{
        const parts=ek.split('|');
        return parseInt(parts[1])===wn&&parseInt(parts[2])===di;
      });
      if(existingKey)return;
      const ek=`${m[1]}|${m[2]}|${m[3]}`;
      if(!byKey[ek])byKey[ek]={phaseId:m[1],weekNum:wn,dayIdx:di,note:''};
    });
  }catch(e){}

  const entries=Object.values(byKey).sort((a,b)=>a.weekNum!==b.weekNum?a.weekNum-b.weekNum:a.dayIdx-b.dayIdx);

  const userName=memberName||sessionStorage.getItem('kc_username')||'Member';
  const today=new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  const nutLog=loadNutLog();

  let sections='';
  entries.forEach((entry,ei)=>{
    const dayDate=getDayDate(entry.weekNum,entry.dayIdx,isAdm);
    const accentColor=ei%2===0?'#c8a800':'#2a7a5c'; // alternate gold / teal per session

    // Lifts from DOM
    let liftsHtml='';
    const weekEl=document.getElementById(`${entry.phaseId}-w${entry.weekNum}`);
    if(weekEl){
      const dayCard=weekEl.querySelectorAll('.day-card')[entry.dayIdx];
      if(dayCard){
        const rows=dayCard.querySelectorAll('.ex-table tbody tr');
        let liftRows='';
        rows.forEach(row=>{
          const nameEl=row.querySelector('.ex-name,.wave-base-name');
          const weightEl=row.querySelector('.weight-cell');
          const logBtn=row.querySelector('.log-btn');
          if(!nameEl)return;
          const name=nameEl.textContent.trim();if(!name)return;
          const wt=weightEl&&!weightEl.classList.contains('empty')?weightEl.textContent.trim():'';
          const logged=logBtn&&logBtn.classList.contains('logged-mixed')?'✓mixed':logBtn&&logBtn.classList.contains('logged-made')?'✓':logBtn&&logBtn.classList.contains('logged-miss')?'✗':'';
          const wtColor=wt?'#c8a800':'#999';
          const logColor=logged==='✓mixed'?'#a78bfa':logged==='✓'?'#2a7a5c':logged==='✗'?'#c0392b':'transparent';
          const logDisplay=logged==='✓mixed'?'✓':logged;
          liftRows+=`<tr>
            <td style="padding:4px 10px 4px 0;font-size:12px;color:#1a1a1b;border-bottom:1px solid #f0eeea;">${name}</td>
            <td style="padding:4px 10px;font-size:11px;color:${wtColor};font-family:monospace;border-bottom:1px solid #f0eeea;">${wt}</td>
            <td style="padding:4px 0;font-size:13px;color:${logColor};border-bottom:1px solid #f0eeea;text-align:center;">${logDisplay}</td>
          </tr>`;
        });
        if(liftRows){
          liftsHtml=`<div style="margin-bottom:14px;">
            <div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#999;margin-bottom:6px;font-family:monospace;">Lifts</div>
            <table style="border-collapse:collapse;width:100%;background:#fafaf8;border-radius:3px;overflow:hidden;">
              <thead><tr style="background:#f0eeea;">
                <th style="padding:5px 10px 5px 0;font-family:monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#888;text-align:left;font-weight:400;">Exercise</th>
                <th style="padding:5px 10px;font-family:monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#888;text-align:left;font-weight:400;">Weight</th>
                <th style="padding:5px 0;font-family:monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#888;text-align:center;font-weight:400;">Done</th>
              </tr></thead>
              <tbody>${liftRows}</tbody>
            </table>
          </div>`;
        }
      }
    }

    // Nutrition
    let nutHtml='';
    const nutEntry=nutLog.find(e=>{
      const base=new Date(2026,2,isAdm?16:19);
      const offsets=isAdm?[0,1,2,4,5]:[0,4];
      base.setDate(base.getDate()+(entry.weekNum-1)*7+(offsets[entry.dayIdx]??entry.dayIdx));
      return e.date===base.toISOString().split('T')[0];
    });
    if(nutEntry&&(nutEntry.meals||[]).some(m=>m.items?m.items.length:(m.cal||m.pro))){
      const meals=(nutEntry.meals||[]).filter(m=>m.items?m.items.length:(m.cal||m.pro));
      const dayT=nutDayTotals(nutEntry);
      let mealRows='';
      meals.forEach(m=>{
        const mt=mealTotals(m);
        if(!mt.cal&&!mt.pro)return;
        const timeStr=m.time?`<span style="color:#aaa;font-size:10px;margin-left:6px;">${m.time}</span>`:'';
        mealRows+=`<tr>
          <td style="padding:4px 10px 4px 0;font-size:12px;color:#1a1a1b;border-bottom:1px solid #f0eeea;">${m.name}${timeStr}</td>
          <td style="padding:4px 8px;font-size:11px;font-family:monospace;color:#c8a800;border-bottom:1px solid #f0eeea;">${mt.cal} kcal</td>
          <td style="padding:4px 8px;font-size:11px;font-family:monospace;color:#2a7a5c;border-bottom:1px solid #f0eeea;">${mt.pro}g P</td>
          <td style="padding:4px 0;font-size:11px;font-family:monospace;color:#888;border-bottom:1px solid #f0eeea;">${mt.carb}g C · ${mt.fat}g F</td>
        </tr>`;
      });
      nutHtml=`<div style="margin-bottom:14px;">
        <div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#999;margin-bottom:6px;font-family:monospace;">Nutrition</div>
        <table style="border-collapse:collapse;width:100%;background:#fafaf8;">
          <thead><tr style="background:#f0eeea;">
            <th style="padding:5px 10px 5px 0;font-family:monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#888;text-align:left;font-weight:400;">Meal</th>
            <th style="padding:5px 8px;font-family:monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#c8a800;text-align:left;font-weight:400;">Cal</th>
            <th style="padding:5px 8px;font-family:monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#2a7a5c;text-align:left;font-weight:400;">Protein</th>
            <th style="padding:5px 0;font-family:monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#888;text-align:left;font-weight:400;">Carbs · Fat</th>
          </tr></thead>
          <tbody>${mealRows}</tbody>
        </table>
        <div style="font-size:11px;font-family:monospace;margin-top:6px;padding:6px 10px;background:#f0eeea;border-radius:2px;">
          <strong style="color:#c8a800;">${dayT.cal} kcal</strong> &nbsp;·&nbsp;
          <strong style="color:#2a7a5c;">${dayT.pro}g protein</strong> &nbsp;·&nbsp;
          <span style="color:#888;">${dayT.carb}g carbs · ${dayT.fat}g fat</span>
        </div>
      </div>`;
    }

    // Additional workouts for PDF
    let awPdfHtml='';
    const awSaved=(()=>{
      let s=[];
      try{const allWO=JSON.parse(localStorage.getItem(userKey(AW_WORKOUTS_SK))||'{}');Object.keys(allWO).forEach(awk=>{if(s.length)return;const awm=awk.match(/^(.+)_w(\d+)_d(\d+)$/);if(awm&&parseInt(awm[2])===entry.weekNum&&parseInt(awm[3])===entry.dayIdx&&allWO[awk]&&allWO[awk].length)s=allWO[awk];});}catch(e){}
      return s;
    })();
    if(awSaved.length){
      const typeColors={lift:'#c8a800',amrap:'#2a7a5c',fortime:'#c06020'};
      let awRows='';
      awSaved.forEach(w=>{
        const tl={lift:'Lift',amrap:'AMRAP',fortime:'For Time'}[w.type]||'Lift';
        const tc=typeColors[w.type]||'#c8a800';
        let detail='';
        w.movements.forEach((mv)=>{
          const meta=[];
          if(mv.sets)meta.push(mv.sets+' sets');
          if(mv.reps)meta.push(mv.reps+(w.type==='lift'?' reps':''));
          if(mv.weight)meta.push(mv.weight);
          detail+=`<div style="margin-bottom:2px;font-size:12px;color:#1a1a1b;"><strong>${mv.exercise}</strong>${meta.length?' <span style="color:#888;font-family:monospace;font-size:10px;">· '+meta.join(' · ')+'</span>':''}</div>`;
        });
        let result='';
        if((w.type==='amrap'||w.type==='fortime')&&(w.timecap||w.result)){
          const rl=w.type==='fortime'?'Time':'Result';
          result=`<div style="font-family:monospace;font-size:10px;color:#888;margin-top:3px;">${[w.timecap?w.timecap+' min cap':'',w.result?rl+': '+w.result:''].filter(Boolean).join(' · ')}</div>`;
        }
        awRows+=`<div style="margin-bottom:8px;padding:8px 10px;background:#f4f3ef;border-radius:3px;border-left:3px solid ${tc};">
          <div style="font-family:monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:${tc};margin-bottom:4px;">${tl}</div>
          ${detail}${result}
        </div>`;
      });
      awPdfHtml=`<div style="margin-bottom:14px;">
        <div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#999;margin-bottom:6px;font-family:monospace;">Additional Workouts</div>
        ${awRows}
      </div>`;
    }

    sections+=`
    <div style="margin-bottom:32px;padding:20px 20px 20px 24px;border-left:4px solid ${accentColor};background:#fafaf8;border-radius:0 4px 4px 0;page-break-inside:avoid;">
      <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #e8e8e4;">
        <span style="font-family:'Arial Black',sans-serif;font-size:17px;color:${accentColor};letter-spacing:0.5px;">Week ${entry.weekNum} · Day ${entry.dayIdx+1}</span>
        <span style="font-size:11px;color:#888;font-family:monospace;">${dayDate}</span>
      </div>
      ${liftsHtml}
      ${awPdfHtml}
      ${nutHtml}
      ${(()=>{const fk=feelingKey(entry.phaseId,entry.weekNum,entry.dayIdx);const r=loadFeeling(fk);return r?`<div style="margin-bottom:10px;padding:6px 10px;background:#f0eeea;border-radius:3px;display:inline-block;font-family:monospace;font-size:11px;"><span style="color:#999;letter-spacing:1px;text-transform:uppercase;font-size:9px;">Felt:</span> <span style="font-size:14px;">${FEELING_EMOJIS[r-1]}</span> <strong style="color:#1a1a1b;">${FEELING_LABELS[r-1]}</strong></div>`:'';})()}
      ${(()=>{
        const awK=`${entry.phaseId}_w${entry.weekNum}_d${entry.dayIdx}`;
        const tk=timeKey(entry.phaseId,entry.weekNum,entry.dayIdx);
        const vol=calcDayVolume(awK);
        const tw=loadTimeWorked(tk);
        if(!vol&&!tw)return'';
        const parts=[];
        if(vol)parts.push(`<span style="color:#999;letter-spacing:1px;text-transform:uppercase;font-size:9px;">Volume:</span> <strong style="color:#1a1a1b;">${vol.toLocaleString()} lbs</strong>`);
        if(tw)parts.push(`<span style="color:#999;letter-spacing:1px;text-transform:uppercase;font-size:9px;">Time:</span> <strong style="color:#1a1a1b;">${tw}</strong>`);
        return`<div style="margin-bottom:10px;padding:6px 10px;background:#f0eeea;border-radius:3px;display:inline-flex;gap:16px;font-family:monospace;font-size:11px;">${parts.join('')}</div>`;
      })()}
      ${entry.note?`<div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#999;margin-bottom:6px;font-family:monospace;">Session Notes</div>
      <div style="font-size:13px;color:#333;line-height:1.75;white-space:pre-wrap;">${entry.note.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`:''}
    </div>`;
  });

  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Session Notes — ${userName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
    *{box-sizing:border-box;}
    body{font-family:'DM Sans',Arial,sans-serif;color:#1a1a1b;background:#fff;margin:0 auto;padding:40px 48px;max-width:760px;}
    @media print{body{padding:16px;} @page{margin:15mm 18mm;size:A4;} .no-break{page-break-inside:avoid;}}
  </style>
  </head><body>
  <div style="margin-bottom:36px;padding-bottom:20px;border-bottom:4px solid #1a1a1b;">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;">
      <div>
        <div style="font-size:11px;font-family:monospace;letter-spacing:3px;text-transform:uppercase;color:#c8a800;margin-bottom:4px;">Kilo Club · Crossfit Crumville</div>
        <div style="font-size:38px;font-family:'Arial Black',sans-serif;letter-spacing:1px;line-height:1;color:#1a1a1b;">SESSION<br>NOTES</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:15px;font-family:monospace;color:#1a1a1b;font-weight:500;">${userName.toUpperCase()}</div>
        <div style="font-size:11px;color:#999;font-family:monospace;margin-top:4px;">${today}</div>
        <div style="font-size:11px;color:#999;font-family:monospace;">${entries.length} session${entries.length!==1?'s':''} with notes</div>
      </div>
    </div>
  </div>
  ${sections||'<p style="color:#888;font-family:monospace;">No session notes found.</p>'}
  </body></html>`;

  const blob=new Blob([html],{type:'text/html'});
  const url=URL.createObjectURL(blob);
  const win=window.open(url,'_blank');
  if(win){
    win.addEventListener('load',()=>setTimeout(()=>win.print(),400));
  }
  setTimeout(()=>URL.revokeObjectURL(url),30000);
}


function showWeek(phaseId,weekNum,btn,colorClass){
  document.querySelectorAll('[id^="'+phaseId+'-w"]').forEach(el=>el.classList.remove('visible'));
  document.querySelectorAll('#nav-'+phaseId+' .week-btn').forEach(b=>b.classList.remove('active','m1','m2'));
  const p=document.getElementById(phaseId+'-w'+weekNum);if(p)p.classList.add('visible');
  btn.classList.add('active',colorClass);
  const nav=document.getElementById('nav-'+phaseId);if(nav)nav.scrollIntoView({behavior:'smooth',block:'start'});
}
// ══ ADMIN CYCLE SELECT ══
function onAdminCycleChange(v){
  const sel=document.getElementById('admin-cycle-select');
  if(sel)sel.dataset.manuallySet='1';
  if(currentView==='admin') loadView();
}

// ══ OLYMPIC TOTAL ══
function updateOlympicTotal(){
  const sn=currentMaxes['rm-snatch']||null;
  const cj=currentMaxes['rm-cj']||null;
  const u=getUnit();
  function disp(v){if(!v)return'—';return u==='kg'?Math.round(v/2.205)+'':Math.round(v)+'';}
  const snEl=document.getElementById('oly-snatch-val');
  const cjEl=document.getElementById('oly-cj-val');
  const totEl=document.getElementById('oly-total-val');
  const unitEl=document.getElementById('oly-total-unit');
  if(snEl) snEl.textContent=disp(sn);
  if(cjEl) cjEl.textContent=disp(cj);
  if(totEl&&unitEl){
    if(sn&&cj){const total=u==='kg'?Math.round((sn+cj)/2.205):Math.round(sn+cj);totEl.textContent=total;unitEl.textContent=u;}
    else{totEl.textContent='—';unitEl.textContent='';}
  }
}

// ══ POWERLIFTING TOTAL ══
function updatePowerTotal(){
  const bench=currentMaxes['rm-bench']||null;
  const dead=currentMaxes['rm-deadlift']||null;
  const sq=currentMaxes['rm-backsquat']||null;
  const u=getUnit();
  function disp(v){if(!v)return'—';return u==='kg'?Math.round(v/2.205)+'':Math.round(v)+'';}
  const bEl=document.getElementById('pl-bench-val');
  const dEl=document.getElementById('pl-dead-val');
  const sEl=document.getElementById('pl-sq-val');
  const totEl=document.getElementById('pl-total-val');
  const unitEl=document.getElementById('pl-total-unit');
  if(bEl) bEl.textContent=disp(bench);
  if(dEl) dEl.textContent=disp(dead);
  if(sEl) sEl.textContent=disp(sq);
  if(totEl&&unitEl){
    if(bench&&dead&&sq){const total=u==='kg'?Math.round((bench+dead+sq)/2.205):Math.round(bench+dead+sq);totEl.textContent=total;unitEl.textContent=u;}
    else{totEl.textContent='—';unitEl.textContent='';}
  }
}


// ══ EXPORT / IMPORT CSV ══
function exportCSV(){
  const userPrefix=currentUsername?`u_${currentUsername}_`:'';
  const rows=[['key','value']];
  try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&(userPrefix?k.startsWith(userPrefix):k.startsWith('kc_'))){rows.push([k,localStorage.getItem(k)]);}}}catch(e){}
  const csv=rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=`kiloclub_log_${currentUsername||'export'}.csv`;a.click();
  URL.revokeObjectURL(url);
  showCSVStatus('✓ Exported');
}
function importCSV(event){
  const file=event.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const lines=e.target.result.split('\n').filter(Boolean);
    let count=0;
    const userPrefix=currentUsername?`u_${currentUsername}_`:'';
    for(let i=1;i<lines.length;i++){
      const cols=lines[i].match(/("(?:[^"]|"")*"|[^,]*)/g)||[];
      const clean=c=>c.replace(/^"|"$/g,'').replace(/""/g,'"').trim();
      const k=clean(cols[0]||'');
      const v=clean(cols.slice(1).join(','));
      // Accept keys that match current user's prefix or bare kc_ keys (legacy import)
      const validKey=userPrefix?k.startsWith(userPrefix):k.startsWith('kc_');
      if(validKey&&v){try{localStorage.setItem(k,v);count++;}catch(err){}}
    }
    showCSVStatus('✓ Imported '+count+' entries');
    buildRmPanel();loadSavedMaxes();loadView();
    event.target.value='';
  };
  reader.readAsText(file);
}
function showCSVStatus(msg){
  const el=document.getElementById('csv-status');if(!el)return;
  el.textContent=msg;el.style.opacity='1';
  setTimeout(()=>el.style.opacity='0',3000);
}

// ══ ADD WORKOUT ══════════════════════════════════════════════════════════════
const AW_WORKOUTS_SK='kc_aw_workouts';
const AW_CUSTOM_EX_SK='kc_aw_custom_exercises';

const AW_BUILTIN_EX=[
  // Olympic
  'Snatch','Clean & Jerk','Clean','Jerk','Split Jerk','Power Snatch','Power Clean',
  'Hang Snatch','Hang Clean','Muscle Snatch','Snatch Balance','Hang Power Snatch','Hang Power Clean',
  // Squat
  'Back Squat','Front Squat','Overhead Squat','Box Squat','Goblet Squat','Bulgarian Split Squat',
  'Pause Back Squat','Pause Front Squat','Tempo Back Squat','Hack Squat','Zercher Squat',
  'Single Leg Squat','Step Up','Lunge','Reverse Lunge','Walking Lunge',
  // Hinge / Pull
  'Deadlift','Romanian Deadlift','Stiff Leg Deadlift','Sumo Deadlift','Trap Bar Deadlift',
  'Good Morning','Snatch Pull','Clean Pull','Pendlay Row','Bent Over Row',
  'Single Arm Dumbbell Row','Cable Row','T-Bar Row','Chest Supported Row',
  // Push
  'Bench Press','Incline Bench','Decline Bench','Close Grip Bench',
  'Dumbbell Bench Press','Incline Dumbbell Press','Floor Press',
  'Strict Press','Push Press','Push Jerk','Dumbbell Shoulder Press','Arnold Press',
  // Shoulders
  'Lateral Raise','Dumbbell Lateral Raise','Cable Lateral Raise',
  'Front Raise','Dumbbell Front Raise','Cable Front Raise',
  'Rear Delt Fly','Face Pull','Upright Row','Shrug','Dumbbell Shrug',
  // Arms
  'Pull-up','Chin-up','Dip',
  'Barbell Curl','Dumbbell Curl','Hammer Curl','Incline Dumbbell Curl',
  'Preacher Curl','Cable Curl','Concentration Curl',
  'Skull Crushers','Tricep Pushdown','Overhead Tricep Extension',
  'Standing Dumbbell Tricep Extension','Close Grip Push-up','Tricep Kickback',
  // Core / Gymnastics
  'Toes to Bar','Knees to Elbow','GHD Sit-up','GHD Hip Extension',
  'Sit-up','Ab Mat Sit-up','Hollow Body Hold','V-Up','L-Sit',
  'Plank','Side Plank','Dead Bug','Pallof Press',
  'Handstand Push-up','Handstand Walk','Handstand Hold','Pike Push-up',
  'Muscle Up','Bar Muscle Up','Ring Muscle Up','Rope Climb',
  'Pistol','Box Jump','Broad Jump','Burpee',
  // Kettlebell
  'Kettlebell Swing','Kettlebell Snatch','Kettlebell Clean','Kettlebell Press',
  'Turkish Get-Up','Kettlebell Goblet Squat','Single Arm Kettlebell Row',
  // Cardio / Conditioning
  'Run','400m Run','800m Run','1 Mile Run',
  'Row','Assault Bike','Ski Erg','Echo Bike','Jump Rope','Double Under',
  // Dumbbell compound
  'Dumbbell Snatch','Dumbbell Clean and Jerk','Thruster','Dumbbell Thruster',
  'Farmer Carry','Suitcase Carry','Overhead Carry','Yoke Carry',
  'Wall Ball','Slam Ball','Med Ball Clean',
  // Back / Isolation
  'Lat Pulldown','Pull-down','Straight Arm Pulldown','Pullover',
];

function loadCustomExercises(){try{return JSON.parse(localStorage.getItem(userKey(AW_CUSTOM_EX_SK))||'[]');}catch(e){return[];}}
function saveCustomExercises(arr){try{localStorage.setItem(userKey(AW_CUSTOM_EX_SK),JSON.stringify(arr));}catch(e){}}
function getAllExercises(){return [...new Set([...AW_BUILTIN_EX,...loadCustomExercises()])].sort();}

function loadSavedWorkouts(awKey){
  try{const all=JSON.parse(localStorage.getItem(userKey(AW_WORKOUTS_SK))||'{}');return all[awKey]||[];}catch(e){return[];}
}
function saveSavedWorkouts(awKey,arr){
  try{const all=JSON.parse(localStorage.getItem(userKey(AW_WORKOUTS_SK))||'{}');all[awKey]=arr;localStorage.setItem(userKey(AW_WORKOUTS_SK),JSON.stringify(all));}catch(e){}
}

let awCurrentKey='', awCurrentType='lift', awEditingIdx=-1;

function openAWModal(awKey){
  awCurrentKey=awKey; awEditingIdx=-1;
  awCurrentType='lift';
  ['lift','amrap','fortime'].forEach(id=>{const el=document.getElementById('aw-tab-'+id);if(el)el.classList.toggle('active',id==='lift');});
  renderAWForm();
  document.getElementById('aw-modal').querySelector('[onclick="awSave()"]').textContent='SAVE WORKOUT';
  document.getElementById('aw-modal-overlay').classList.add('open');
}

function openAWEditModal(awKey,idx){
  awCurrentKey=awKey; awEditingIdx=idx;
  const arr=loadSavedWorkouts(awKey);
  const w=arr[idx]; if(!w)return;
  awCurrentType=w.type||'lift';
  ['lift','amrap','fortime'].forEach(t=>document.getElementById('aw-tab-'+t).classList.toggle('active',t===awCurrentType));

  // For lift type: extract per-set arrays (support both old flat format and new sets[] format)
  let initA=null,initB=null;
  if(awCurrentType==='lift'){
    const mvA=w.movements[0]||{};
    if(Array.isArray(mvA.sets)){
      initA=mvA.sets;
    } else {
      // old flat format: {sets,reps,weight} — convert to per-set rows
      const n=parseInt(mvA.sets)||1;
      initA=Array.from({length:n},()=>({reps:mvA.reps||'',weight:mvA.weight||''}));
    }
    if(w.movements.length>1){
      const mvB=w.movements[1]||{};
      if(Array.isArray(mvB.sets)){
        initB=mvB.sets;
      } else {
        const n=parseInt(mvB.sets)||1;
        initB=Array.from({length:n},()=>({reps:mvB.reps||'',weight:mvB.weight||''}));
      }
    }
  }

  renderAWForm(initA,initB);
  // populate exercise selectors
  awSetSelectValue('aw-a',w.movements[0]?.exercise||'');
  if(w.movements.length>1){
    const ssCheck=document.getElementById('aw-ss-check');
    if(ssCheck){ssCheck.checked=true;awToggleSS();}
    awSetSelectValue('aw-b',w.movements[1].exercise||'');
  }
  if(w.type==='amrap'||w.type==='fortime'){
    if(document.getElementById('aw-timecap'))document.getElementById('aw-timecap').value=w.timecap||'';
    if(document.getElementById('aw-result'))document.getElementById('aw-result').value=w.result||'';
  }
  document.getElementById('aw-modal').querySelector('[onclick="awSave()"]').textContent='UPDATE WORKOUT';
  document.getElementById('aw-modal-overlay').classList.add('open');
}

function awSetSelectValue(pfx, exName){
  if(!exName)return;
  document.getElementById(pfx+'-search').value=exName;
  document.getElementById(pfx+'-value').value=exName;
  const sel=document.getElementById(pfx+'-selected');
  if(sel){sel.textContent=exName;sel.classList.add('visible');}
}

function closeAWModal(){document.getElementById('aw-modal-overlay').classList.remove('open');awEditingIdx=-1;}
function maybeCloseAWModal(e){if(e.target===document.getElementById('aw-modal-overlay'))closeAWModal();}

function awSetType(t){
  awCurrentType=t;
  ['lift','amrap','fortime'].forEach(id=>{const el=document.getElementById('aw-tab-'+id);if(el)el.classList.toggle('active',id===t);});
  renderAWForm();
}

function awExSelectHtml(idPrefix,label){
  return `
    <div class="aw-field">
      <span class="aw-label">${label}</span>
      <div class="aw-ex-search-wrap" id="${idPrefix}-search-wrap">
        <span class="aw-ex-search-icon">⌕</span>
        <input class="aw-ex-search" type="text" id="${idPrefix}-search"
          placeholder="Search exercise…"
          autocomplete="off"
          oninput="awFilterEx('${idPrefix}')"
          onfocus="awOpenDropdown('${idPrefix}')"
          onkeydown="awExKeydown(event,'${idPrefix}')">
        <div class="aw-ex-dropdown" id="${idPrefix}-dropdown"></div>
      </div>
      <div class="aw-ex-selected" id="${idPrefix}-selected"></div>
      <input type="hidden" id="${idPrefix}-value">
      <div class="aw-new-ex-row" id="${idPrefix}-newex-row">
        <span style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--accent2);flex:1;">Save this exercise for later?</span>
        <button class="aw-new-ex-btn" onclick="awAddExercise('${idPrefix}')">+ Add Exercise</button>
      </div>
    </div>`;
}

function awFilterEx(pfx){
  const inp=document.getElementById(pfx+'-search');
  const q=(inp?.value||'').toLowerCase().trim();
  const all=getAllExercises();
  const matches=q?all.filter(e=>e.toLowerCase().includes(q)):all;
  awRenderDropdown(pfx,matches,q);
  awOpenDropdown(pfx);
  // Clear selected value when user edits
  document.getElementById(pfx+'-value').value='';
  document.getElementById(pfx+'-selected')?.classList.remove('visible');
  // Show "save new" prompt if unrecognized
  const val=(inp?.value||'').trim();
  const known=getAllExercises().map(e=>e.toLowerCase());
  if(val&&!known.includes(val.toLowerCase()))document.getElementById(pfx+'-newex-row')?.classList.add('visible');
  else document.getElementById(pfx+'-newex-row')?.classList.remove('visible');
}

function awRenderDropdown(pfx,list,q){
  const dd=document.getElementById(pfx+'-dropdown');
  if(!dd)return;
  const esc=(s)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  let html=list.slice(0,60).map((e,i)=>{
    const disp=q?e.replace(new RegExp('('+esc(q)+')','gi'),'<strong>$1</strong>'):e;
    const safe=e.replace(/'/g,"\\'").replace(/"/g,'&quot;');
    return `<div class="aw-ex-opt" data-idx="${i}" onmousedown="awPickEx('${pfx}','${safe}',event)">${disp}</div>`;
  }).join('');
  if(q&&!getAllExercises().map(e=>e.toLowerCase()).includes(q)){
    const safe=q.replace(/'/g,"\\'").replace(/"/g,'&quot;');
    html+=`<div class="aw-ex-opt custom-entry" onmousedown="awPickCustomEx('${pfx}',event)">Use "${safe}"…</div>`;
  }
  dd.innerHTML=html;
}

function awOpenDropdown(pfx){
  const dd=document.getElementById(pfx+'-dropdown');
  if(!dd)return;
  const inp=document.getElementById(pfx+'-search');
  const q=(inp?.value||'').toLowerCase().trim();
  const all=getAllExercises();
  const matches=q?all.filter(e=>e.toLowerCase().includes(q)):all;
  awRenderDropdown(pfx,matches,q);
  dd.classList.add('open');
  setTimeout(()=>{
    const handler=(e)=>{
      const wrap=document.getElementById(pfx+'-search-wrap');
      if(wrap&&!wrap.contains(e.target)){dd.classList.remove('open');document.removeEventListener('mousedown',handler,true);}
    };
    document.addEventListener('mousedown',handler,true);
  },0);
}

function awPickEx(pfx,val,e){
  if(e)e.preventDefault();
  document.getElementById(pfx+'-search').value=val;
  document.getElementById(pfx+'-value').value=val;
  const sel=document.getElementById(pfx+'-selected');
  if(sel){sel.textContent=val;sel.classList.add('visible');}
  document.getElementById(pfx+'-dropdown').classList.remove('open');
  document.getElementById(pfx+'-newex-row')?.classList.remove('visible');
}

function awPickCustomEx(pfx,e){
  if(e)e.preventDefault();
  const val=document.getElementById(pfx+'-search').value.trim();
  document.getElementById(pfx+'-value').value=val;
  const sel=document.getElementById(pfx+'-selected');
  if(sel){sel.textContent=val;sel.classList.add('visible');}
  document.getElementById(pfx+'-dropdown').classList.remove('open');
  const known=getAllExercises().map(e=>e.toLowerCase());
  if(val&&!known.includes(val.toLowerCase()))document.getElementById(pfx+'-newex-row')?.classList.add('visible');
}

function awExKeydown(e,pfx){
  const dd=document.getElementById(pfx+'-dropdown');
  if(!dd||!dd.classList.contains('open'))return;
  const opts=[...dd.querySelectorAll('.aw-ex-opt')];
  const cur=dd.querySelector('.aw-ex-opt.highlighted');
  let idx=cur?opts.indexOf(cur):-1;
  if(e.key==='ArrowDown'){e.preventDefault();idx=Math.min(idx+1,opts.length-1);opts.forEach((o,i)=>o.classList.toggle('highlighted',i===idx));opts[idx]?.scrollIntoView({block:'nearest'});}
  else if(e.key==='ArrowUp'){e.preventDefault();idx=Math.max(idx-1,0);opts.forEach((o,i)=>o.classList.toggle('highlighted',i===idx));opts[idx]?.scrollIntoView({block:'nearest'});}
  else if(e.key==='Enter'&&cur){e.preventDefault();cur.dispatchEvent(new MouseEvent('mousedown'));}
  else if(e.key==='Escape'){dd.classList.remove('open');}
}

function awCheckNewEx(pfx){/* handled by awFilterEx */}

function awGetExName(pfx){
  // Prefer hidden value (set by picker); fall back to typed text
  const v=(document.getElementById(pfx+'-value')?.value||'').trim();
  if(v)return v;
  return(document.getElementById(pfx+'-search')?.value||'').trim();
}

function awAddExercise(pfx){
  const name=(document.getElementById(pfx+'-search')?.value||'').trim();
  if(!name)return;
  const arr=loadCustomExercises();
  if(!arr.map(e=>e.toLowerCase()).includes(name.toLowerCase())){arr.push(name);saveCustomExercises(arr);}
  // Pick it immediately — no need to re-render
  awPickEx(pfx,name,null);
  document.getElementById(pfx+'-newex-row')?.classList.remove('visible');
}

// Movement block used by AMRAP / For Time
function movementBlockHtml(pfx,labelText){
  return `
  <div style="padding:14px 20px 8px;">
    ${awExSelectHtml(pfx,labelText)}
    <div class="aw-row" style="margin-top:10px;">
      <div class="aw-field">
        <span class="aw-label">Reps / Distance</span>
        <input class="aw-input" type="text" id="${pfx}-reps" placeholder="e.g. 45 or 90 cal">
      </div>
      <div class="aw-field">
        <span class="aw-label">Weight</span>
        <input class="aw-input" type="text" id="${pfx}-weight" placeholder="e.g. 225 lbs">
      </div>
    </div>
  </div>`;
}

// Per-set rows state for lift blocks
const awSetData={};  // keyed by pfx

function awInitSets(pfx,initialSets){
  // initialSets: array of {reps,weight} or empty for a fresh form
  awSetData[pfx]=initialSets&&initialSets.length?initialSets.map(s=>({reps:s.reps||'',weight:s.weight||''})):[{reps:'',weight:''}];
}

function awRenderSetRows(pfx){
  const container=document.getElementById(pfx+'-set-rows');
  if(!container)return;
  const rows=awSetData[pfx]||[];
  container.innerHTML=rows.map((s,i)=>`
    <div class="aw-set-row">
      <span class="aw-set-num">${i+1}</span>
      <input class="aw-input" type="text" placeholder="Reps" value="${s.reps}"
        oninput="awSetData['${pfx}'][${i}].reps=this.value" style="flex:1;padding:7px 10px;font-size:13px;">
      <input class="aw-input" type="text" placeholder="Weight" value="${s.weight}"
        oninput="awSetData['${pfx}'][${i}].weight=this.value" style="flex:1;padding:7px 10px;font-size:13px;">
      ${rows.length>1?`<button class="aw-set-remove" onclick="awRemoveSet('${pfx}',${i})" title="Remove set">×</button>`:'<span style="width:20px;"></span>'}
    </div>`).join('');
}

function awAddSet(pfx){
  if(!awSetData[pfx])awSetData[pfx]=[];
  // clone last row's weight as convenience
  const last=awSetData[pfx][awSetData[pfx].length-1]||{};
  awSetData[pfx].push({reps:'',weight:last.weight||''});
  awRenderSetRows(pfx);
}

function awRemoveSet(pfx,i){
  if(!awSetData[pfx]||awSetData[pfx].length<=1)return;
  awSetData[pfx].splice(i,1);
  awRenderSetRows(pfx);
}

// Lift block — per-set rows
function liftBlockHtml(pfx,labelText){
  return `
  <div style="padding:14px 20px 8px;">
    ${awExSelectHtml(pfx,labelText)}
    <div class="aw-set-col-labels"><span>Reps</span><span>Weight</span></div>
    <div class="aw-set-rows" id="${pfx}-set-rows"></div>
    <button class="aw-add-set-btn" onclick="awAddSet('${pfx}')">+ Add Set</button>
  </div>`;
}

function ssToggleBlockHtml(label2nd){
  return `
  <div style="padding:4px 20px 12px;border-top:1px solid var(--border);">
    <div class="aw-superset-toggle">
      <input type="checkbox" id="aw-ss-check" onchange="awToggleSS()">
      <label for="aw-ss-check">${label2nd}</label>
    </div>
    <div class="aw-superset-block" id="aw-ss-block">
      <div class="aw-ss-label" style="padding:0 0 6px;">Second Movement</div>
      ${movementBlockHtml('aw-b','Exercise')}
    </div>
  </div>`;
}

function resultFooterHtml(resultLabel){
  return `
  <div style="padding:12px 20px;border-top:1px solid var(--border);">
    <div class="aw-amrap-footer">
      <div class="aw-field">
        <span class="aw-label">Time Cap (min)</span>
        <input class="aw-input" type="number" id="aw-timecap" placeholder="e.g. 20" min="1">
      </div>
      <div class="aw-field">
        <span class="aw-label">${resultLabel}</span>
        <input class="aw-input" type="text" id="aw-result" placeholder="${resultLabel==='Finishing Time'?'e.g. 14:32':'e.g. 7+14'}">
      </div>
    </div>
  </div>`;
}

function renderAWForm(initA,initB){
  // initA / initB: optional arrays of {reps,weight} for pre-population
  const body=document.getElementById('aw-form-body');
  if(awCurrentType==='lift'){
    awInitSets('aw-a',initA||null);
    awInitSets('aw-b',initB||null);
    body.innerHTML=
      liftBlockHtml('aw-a','Exercise')+
      `<div style="padding:4px 20px 12px;border-top:1px solid var(--border);">
        <div class="aw-superset-toggle">
          <input type="checkbox" id="aw-ss-check" onchange="awToggleSS()">
          <label for="aw-ss-check">Superset with another exercise</label>
        </div>
        <div class="aw-superset-block" id="aw-ss-block">
          <div class="aw-ss-label" style="padding:0 0 6px;">Superset Exercise</div>
          ${liftBlockHtml('aw-b','Exercise')}
        </div>
      </div>`;
    awRenderSetRows('aw-a');
    awRenderSetRows('aw-b');
  } else if(awCurrentType==='amrap'){
    body.innerHTML=
      movementBlockHtml('aw-a','Movement 1')+
      ssToggleBlockHtml('Add second movement')+
      resultFooterHtml('Result (rounds+reps)');
  } else { // fortime
    body.innerHTML=
      movementBlockHtml('aw-a','Movement 1')+
      ssToggleBlockHtml('Add second movement')+
      resultFooterHtml('Finishing Time');
  }
}

function awToggleSS(){
  const checked=document.getElementById('aw-ss-check')?.checked;
  const block=document.getElementById('aw-ss-block');
  if(block)block.classList.toggle('visible',!!checked);
}

function awSave(){
  const exA=awGetExName('aw-a');
  if(!exA){alert('Please select or enter an exercise.');return;}
  const today=new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  const arr=loadSavedWorkouts(awCurrentKey);
  const origTimestamp=awEditingIdx>=0&&arr[awEditingIdx]?arr[awEditingIdx].timestamp:today;
  const entry={type:awCurrentType,timestamp:origTimestamp,editedAt:awEditingIdx>=0?today:undefined,movements:[]};

  if(awCurrentType==='lift'){
    // Primary movement — store sets as array of {reps,weight}
    const setsA=(awSetData['aw-a']||[]).filter(s=>s.reps||s.weight);
    const mvA={exercise:exA,sets:setsA.length?setsA:[{reps:'',weight:''}]};
    entry.movements.push(mvA);
    // Superset
    if(document.getElementById('aw-ss-check')?.checked){
      const exB=awGetExName('aw-b');
      if(exB){
        const setsB=(awSetData['aw-b']||[]).filter(s=>s.reps||s.weight);
        entry.movements.push({exercise:exB,sets:setsB.length?setsB:[{reps:'',weight:''}]});
      }
    }
  } else {
    // AMRAP / For Time — flat movement fields
    const mvA={exercise:exA,reps:document.getElementById('aw-a-reps')?.value||'',weight:document.getElementById('aw-a-weight')?.value||''};
    entry.movements.push(mvA);
    if(document.getElementById('aw-ss-check')?.checked){
      const exB=awGetExName('aw-b');
      if(exB){entry.movements.push({exercise:exB,reps:document.getElementById('aw-b-reps')?.value||'',weight:document.getElementById('aw-b-weight')?.value||''});}
    }
    entry.timecap=document.getElementById('aw-timecap')?.value||'';
    entry.result=document.getElementById('aw-result')?.value||'';
  }

  if(awEditingIdx>=0&&awEditingIdx<arr.length){arr[awEditingIdx]=entry;}
  else{arr.push(entry);}
  saveSavedWorkouts(awCurrentKey,arr);
  closeAWModal();
  refreshAWSection(awCurrentKey);
  refreshDayVolume(awCurrentKey);
}

function deleteWorkout(awKey,idx){
  if(!confirm('Delete this workout entry?'))return;
  const arr=loadSavedWorkouts(awKey);
  arr.splice(idx,1);
  saveSavedWorkouts(awKey,arr);
  refreshAWSection(awKey);
  refreshDayVolume(awKey);
}

function refreshAWSection(awKey){
  const saved=loadSavedWorkouts(awKey);
  let listHtml='';
  if(saved.length)listHtml='<div class="aw-workouts-list">'+saved.map((w,wi)=>renderSavedWorkout(w,wi,awKey)).join('')+'</div>';
  document.querySelectorAll('.add-workout-btn').forEach(btn=>{
    if(btn.getAttribute('onclick')&&btn.getAttribute('onclick').includes(`'${awKey}'`)){
      const section=btn.closest('.add-workout-section');
      const parent=section?.parentElement;
      if(!parent)return;
      const oldList=parent.querySelector('.aw-workouts-list');
      if(oldList)oldList.remove();
      if(listHtml){const tmp=document.createElement('div');tmp.innerHTML=listHtml;parent.insertBefore(tmp.firstChild,section);}
    }
  });
}

function renderSavedWorkout(w,wi,awKey){
  const typeMap={lift:{label:'Lift',color:'var(--accent)'},amrap:{label:'AMRAP',color:'var(--accent2)'},fortime:{label:'For Time',color:'var(--ss2)'}};
  const {label:typeLabel,color:typeColor}=typeMap[w.type]||typeMap.lift;
  let details='';
  w.movements.forEach((m,mi)=>{
    const isMulti=w.movements.length>1;
    const badgeLabel=w.type==='lift'?(isMulti&&mi===0?'superset':''):(mi===0?'':'');
    const badge=badgeLabel?`<span style="font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;text-transform:uppercase;color:var(--ss0);background:var(--ss0a);border:1px solid var(--ss0b);padding:1px 5px;border-radius:2px;margin-left:6px;">${badgeLabel}</span>`:'';
    let metaHtml='';
    if(w.type==='lift'&&Array.isArray(m.sets)){
      // New format: per-set rows
      const setLines=m.sets.map((s,si)=>{
        const parts=[];
        if(s.reps)parts.push(s.reps+' reps');
        if(s.weight)parts.push(s.weight);
        return `<span style="display:inline-block;min-width:20px;color:var(--muted);margin-right:4px;">${si+1}.</span>${parts.join(' @ ')||'—'}`;
      }).join('<br>');
      metaHtml=`<div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);margin-top:3px;line-height:1.7;">${setLines}</div>`;
    } else {
      // Old flat format or AMRAP/ForTime
      const meta=[];
      if(m.sets&&!Array.isArray(m.sets))meta.push(m.sets+' sets');
      if(m.reps)meta.push(m.reps+(w.type==='lift'?' reps':''));
      if(m.weight)meta.push(m.weight);
      if(meta.length)metaHtml=`<span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);">${meta.join(' · ')}</span>`;
    }
    details+=`<div style="margin-bottom:${mi<w.movements.length-1?'8':'2'}px;"><strong>${m.exercise}</strong>${badge}${metaHtml?'<br>'+metaHtml:''}</div>`;
  });
  let footer='';
  if(w.type==='amrap'||w.type==='fortime'){
    const resultLabel=w.type==='fortime'?'Time':'Result';
    const parts=[w.timecap?w.timecap+' min cap':'',w.result?resultLabel+': '+w.result:''].filter(Boolean).join(' · ');
    if(parts)footer=`<div class="aw-workout-entry-meta">${parts}</div>`;
  }
  const editedNote=w.editedAt?`<span style="color:var(--muted);"> · edited ${w.editedAt}</span>`:'';
  const safeKey=awKey.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  return `<div class="aw-workout-entry">
    <button class="aw-delete-btn" onclick="deleteWorkout('${safeKey}',${wi})" title="Delete" style="position:absolute;top:8px;right:8px;background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px;padding:2px 6px;" onmouseover="this.style.color='var(--accent3)'" onmouseout="this.style.color='var(--muted)'">&#x2715;</button>
    <div class="aw-workout-entry-title" style="color:${typeColor};">${typeLabel}</div>
    <div class="aw-workout-entry-detail">${details}</div>
    ${footer}
    <div class="aw-workout-entry-meta" style="margin-bottom:10px;">${w.timestamp||''}${editedNote}</div>
    <button onclick="openAWEditModal('${safeKey}',${wi})" style="width:100%;background:none;border:1px solid var(--accent);color:var(--accent);font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:7px;border-radius:3px;cursor:pointer;transition:all .2s;" onmouseover="this.style.background='rgba(232,197,71,.1)'" onmouseout="this.style.background='none'">&#9998; EDIT</button>
  </div>`;
}

// Inject saved workouts into session journal entry
function getAWHtmlForJournalEntry(phaseId,weekNum,dayIdx){
  // Always scan all stored workout keys matching weekNum+dayIdx
  // (phaseId in notes keys vs awKeys may differ — don't rely on it)
  let saved=[];
  try{
    const allWO=JSON.parse(localStorage.getItem(userKey(AW_WORKOUTS_SK))||'{}');
    Object.keys(allWO).forEach(k=>{
      if(saved.length)return;
      const m=k.match(/^(.+)_w(\d+)_d(\d+)$/);
      if(m&&parseInt(m[2])===weekNum&&parseInt(m[3])===dayIdx&&allWO[k]&&allWO[k].length)saved=allWO[k];
    });
  }catch(e){}
  if(!saved.length)return'';
  let html=`<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border);">
    <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">Additional Workouts</div>`;
  saved.forEach(w=>{
    const typeMap={lift:'Lift',amrap:'AMRAP',fortime:'For Time'};
    const typeColors={lift:'var(--accent)',amrap:'var(--accent2)',fortime:'var(--ss2)'};
    const tl=typeMap[w.type]||'Lift';
    const tc=typeColors[w.type]||'var(--accent)';
    html+=`<div style="margin-bottom:8px;padding:8px 10px;background:var(--surface2);border-radius:3px;border-left:3px solid ${tc};">`;
    html+=`<div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:${tc};margin-bottom:4px;">${tl}</div>`;
    w.movements.forEach(m=>{
      let metaStr='';
      if(w.type==='lift'&&Array.isArray(m.sets)){
        const lines=m.sets.map((s,si)=>{const p=[];if(s.reps)p.push(s.reps+' reps');if(s.weight)p.push(s.weight);return `${si+1}. ${p.join(' @ ')||'—'}`;}).join('  ');
        metaStr=lines?` <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);">· ${lines}</span>`:'';
      } else {
        const meta=[];
        if(m.sets&&!Array.isArray(m.sets))meta.push(m.sets+' sets');
        if(m.reps)meta.push(m.reps+(w.type==='lift'?' reps':''));
        if(m.weight)meta.push(m.weight);
        if(meta.length)metaStr=` <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);">· ${meta.join(' · ')}</span>`;
      }
      html+=`<div style="font-size:12px;color:var(--text);margin-bottom:2px;"><strong>${m.exercise}</strong>${metaStr}</div>`;
    });
    if((w.type==='amrap'||w.type==='fortime')&&(w.timecap||w.result)){
      const rl=w.type==='fortime'?'Time':'Result';
      const pts=[w.timecap?w.timecap+' min cap':'',w.result?rl+': '+w.result:''].filter(Boolean).join(' · ');
      html+=`<div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);margin-top:3px;">${pts}</div>`;
    }
    html+='</div>';
  });
  html+='</div>';
  return html;
}
