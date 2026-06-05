// ── CONFETTI ──────────────────────────────────────────────────────────────
function launchConfetti(){
  const canvas=document.getElementById('confetti-canvas'),ctx=canvas.getContext('2d');
  canvas.style.display='block';canvas.width=window.innerWidth;canvas.height=window.innerHeight;
  const cols=['#e8c547','#4fc3a1','#e85d47','#a78bfa','#e8843a','#fff'];
  const pieces=Array.from({length:150},()=>({x:Math.random()*canvas.width,y:-10-Math.random()*80,w:5+Math.random()*8,h:3+Math.random()*5,color:cols[Math.floor(Math.random()*cols.length)],vx:(Math.random()-0.5)*5,vy:2+Math.random()*4,angle:Math.random()*Math.PI*2,va:(Math.random()-0.5)*0.15}));
  let frame=0;
  function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);let alive=false;pieces.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.angle+=p.va;p.vy+=0.06;if(p.y<canvas.height+20)alive=true;const alpha=Math.max(0,1-Math.max(0,p.y-canvas.height*0.65)/(canvas.height*0.35));ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.globalAlpha=alpha;ctx.fillStyle=p.color;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();});if(alive&&frame<200){frame++;requestAnimationFrame(draw);}else{canvas.style.display='none';ctx.clearRect(0,0,canvas.width,canvas.height);}}draw();
}

// ── NUTRITION TRACKER ─────────────────────────────────────────────────────
const NUT_KEY='kc_nutrition_log',NUT_TARGET_KEY='kc_nut_target',COOKBOOK_KEY='kc_cookbook',MACRO_SPLIT_KEY='kc_macro_split';

// ── MACRO SPLIT ───────────────────────────────────────────────────────────────
const MACRO_PRESETS={
  balanced:{pro:30,carb:40,fat:30},
  highcarb:{pro:25,carb:55,fat:20},
  lowcarb:{pro:35,carb:25,fat:40},
  keto:{pro:25,carb:5,fat:70},
  highpro:{pro:40,carb:35,fat:25},
  zone:{pro:30,carb:40,fat:30}
};
function loadMacroSplit(){try{return JSON.parse(localStorage.getItem(userKey(MACRO_SPLIT_KEY))||'null');}catch(e){return null;}}
function saveMacroSplit(){
  const p=parseInt(document.getElementById('macro-pro-pct')?.value)||0;
  const c=parseInt(document.getElementById('macro-carb-pct')?.value)||0;
  const f=parseInt(document.getElementById('macro-fat-pct')?.value)||0;
  const total=p+c+f;
  const statusEl=document.getElementById('macro-pct-status');
  if(statusEl){
    if(total===0){statusEl.textContent='';statusEl.style.color='var(--muted)';}
    else if(total===100){statusEl.textContent='✓ 100%';statusEl.style.color='var(--accent2)';}
    else{statusEl.textContent=(total>100?'↑':'↓')+' '+total+'%';statusEl.style.color='var(--accent3)';}
  }
  if(p||c||f)try{localStorage.setItem(userKey(MACRO_SPLIT_KEY),JSON.stringify({pro:p,carb:c,fat:f}));}catch(e){}
  updateNutTotals();
}
function applyMacroPreset(val){
  if(val==='custom')return;
  const preset=MACRO_PRESETS[val];if(!preset)return;
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v;};
  set('macro-pro-pct',preset.pro);set('macro-carb-pct',preset.carb);set('macro-fat-pct',preset.fat);
  saveMacroSplit();
}
function loadMacroSplitUI(){
  const split=loadMacroSplit();if(!split)return;
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v;};
  set('macro-pro-pct',split.pro);set('macro-carb-pct',split.carb);set('macro-fat-pct',split.fat);
  // detect preset match
  const presetEl=document.getElementById('macro-preset');
  if(presetEl){
    const match=Object.entries(MACRO_PRESETS).find(([k,p])=>p.pro===split.pro&&p.carb===split.carb&&p.fat===split.fat);
    presetEl.value=match?match[0]:'custom';
  }
  saveMacroSplit(); // refresh status badge
}
const DEFAULT_MEAL_NAMES=['Breakfast','Lunch','Dinner'];
let nutTodayMeals=[];   // [{name, items:[{name,cal,pro,carb,fat}]}]
let nutActiveDate='';
function loadNutLog(){try{return JSON.parse(localStorage.getItem(userKey(NUT_KEY))||'[]');}catch(e){return[];}}
function saveNutLog(l){try{localStorage.setItem(userKey(NUT_KEY),JSON.stringify(l));}catch(e){}}
function saveNutTarget(){const v=document.getElementById('nut-target')&&document.getElementById('nut-target').value;if(v)try{localStorage.setItem(userKey(NUT_TARGET_KEY),v);}catch(e){}updateNutTotals();}
function nutAutoSave(){saveTodayMeals();}
function esc(s){return(s||'').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function mealTotals(meal){return(meal.items||[]).reduce((a,i)=>({cal:a.cal+(i.cal||0),pro:a.pro+(i.pro||0),carb:a.carb+(i.carb||0),fat:a.fat+(i.fat||0)}),{cal:0,pro:0,carb:0,fat:0});}

// ── MEAL CARDS ──────────────────────────────────────────────────────────────
function makeMealCard(meal,mi){
  const div=document.createElement('div');div.id='meal-card-'+mi;
  div.style.cssText='background:var(--surface);border:1px solid var(--border);border-radius:4px;overflow:hidden;margin-bottom:2px;';
  const iS='background:var(--input-bg);border:1px solid var(--border);color:var(--text);font-family:\'DM Mono\',monospace;font-size:12px;padding:5px 7px;border-radius:2px;outline:none;width:100%;';
  const mt=mealTotals(meal);
  let itemsHtml='';
  const niS="background:var(--input-bg);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:11px;padding:3px 5px;border-radius:2px;outline:none;width:100%;";
  (meal.items||[]).forEach((item,ii)=>{
    itemsHtml+=`<div id="meal-${mi}-item-${ii}" style="padding:5px 10px 6px 14px;border-bottom:1px solid var(--border);">
      <div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;">
        <input type="text" value="${esc(item.name)}" placeholder="Food name" onchange="nutItemField(${mi},${ii},'name',this.value)" style="${niS}font-size:12px;" onfocus="this.style.borderColor='var(--accent2)'" onblur="this.style.borderColor='var(--border)'">
        <button onclick="nutRemoveItem(${mi},${ii})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px;padding:1px 3px;flex-shrink:0;" onmouseover="this.style.color='var(--accent3)'" onmouseout="this.style.color='var(--muted)'">✕</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:4px;">
        <div><div style="font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;text-transform:uppercase;color:var(--accent);margin-bottom:1px;">kcal</div><input type="number" value="${item.cal||''}" placeholder="0" min="0" onchange="nutItemField(${mi},${ii},'cal',parseFloat(this.value)||0)" style="${niS}text-align:right;" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'"></div>
        <div><div style="font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;text-transform:uppercase;color:var(--accent2);margin-bottom:1px;">pro</div><input type="number" value="${item.pro||''}" placeholder="0" min="0" onchange="nutItemField(${mi},${ii},'pro',parseFloat(this.value)||0)" style="${niS}text-align:right;" onfocus="this.style.borderColor='var(--accent2)'" onblur="this.style.borderColor='var(--border)'"></div>
        <div><div style="font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:1px;">carb</div><input type="number" value="${item.carb||''}" placeholder="0" min="0" onchange="nutItemField(${mi},${ii},'carb',parseFloat(this.value)||0)" style="${niS}text-align:right;" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'"></div>
        <div><div style="font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:1px;">fat</div><input type="number" value="${item.fat||''}" placeholder="0" min="0" onchange="nutItemField(${mi},${ii},'fat',parseFloat(this.value)||0)" style="${niS}text-align:right;" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'"></div>
      </div>
    </div>`;
  });
  div.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 14px;background:var(--surface2);border-bottom:1px solid var(--border);gap:8px;">
      <input type="text" value="${esc(meal.name)}" onchange="nutMealName(${mi},this.value)" style="font-family:\'Bebas Neue\',sans-serif;font-size:16px;letter-spacing:1px;color:var(--text);background:none;border:none;outline:none;cursor:text;flex:1;min-width:80px;" onfocus="this.style.borderBottom=\'1px solid var(--accent)\'" onblur="this.style.borderBottom=\'none\'">
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
        <input type="time" value="${meal.time||''}" onchange="nutMealTime(${mi},this.value)" title="Time eaten" style="background:var(--input-bg);border:1px solid var(--border);color:var(--muted);font-family:\'DM Mono\',monospace;font-size:10px;padding:3px 6px;border-radius:2px;outline:none;width:86px;" onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'var(--border)\'">
        <span style="font-family:\'DM Mono\',monospace;font-size:10px;color:var(--accent);" id="mc-cal-${mi}">${mt.cal?mt.cal+' kcal':''}</span>
        <span style="font-family:\'DM Mono\',monospace;font-size:10px;color:var(--accent2);" id="mc-pro-${mi}">${mt.pro?mt.pro+'g P':''}</span>
        <button onclick="openCopyMeal(${mi})" title="Copy meal to another day" style="background:none;border:1px solid var(--border);color:var(--muted);cursor:pointer;font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase;padding:3px 8px;border-radius:2px;white-space:nowrap;transition:all .15s;" onmouseover="this.style.borderColor=\'var(--accent2)\';this.style.color=\'var(--accent2)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.color=\'var(--muted)\'">⬆ Copy</button>
        <button onclick="removeMeal(${mi})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px;padding:2px 4px;" onmouseover="this.style.color=\'var(--accent3)\'" onmouseout="this.style.color=\'var(--muted)\'">✕</button>
      </div>
    </div>
    <div id="meal-${mi}-items">${itemsHtml||'<div style="padding:8px 14px;font-family:\'DM Mono\',monospace;font-size:10px;color:var(--muted);letter-spacing:1px;">No items yet — add food below</div>'}</div>
    <div style="padding:7px 14px;">
      <button onclick="openFoodPicker(${mi})" style="width:100%;background:none;border:1px dashed var(--border);color:var(--muted);font-family:\'DM Mono\',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:7px;border-radius:3px;cursor:pointer;transition:all .2s;" onmouseover="this.style.borderColor=\'var(--accent2)\';this.style.color=\'var(--accent2)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.color=\'var(--muted)\'">+ Add Food</button>
    </div>`;
  return div;
}
function renderMealCards(){const c=document.getElementById('nut-meals-container');if(!c)return;c.innerHTML='';nutTodayMeals.forEach((meal,mi)=>c.appendChild(makeMealCard(meal,mi)));updateNutTotals();}
function nutItemField(mi,ii,field,val){
  if(nutTodayMeals[mi]&&nutTodayMeals[mi].items[ii])nutTodayMeals[mi].items[ii][field]=val;
  const mt=mealTotals(nutTodayMeals[mi]);
  const calEl=document.getElementById('mc-cal-'+mi),proEl=document.getElementById('mc-pro-'+mi);
  if(calEl)calEl.textContent=mt.cal?mt.cal+' kcal':'';
  if(proEl)proEl.textContent=mt.pro?mt.pro+'g P':'';
  updateNutTotals();saveTodayMeals();
}
function nutMealName(mi,name){if(nutTodayMeals[mi])nutTodayMeals[mi].name=name;saveTodayMeals();}
function nutMealTime(mi,time){if(nutTodayMeals[mi])nutTodayMeals[mi].time=time;saveTodayMeals();}
function nutRemoveItem(mi,ii){if(nutTodayMeals[mi])nutTodayMeals[mi].items.splice(ii,1);renderMealCards();saveTodayMeals();}
function addMeal(name){nutTodayMeals.push({name:name||'Meal '+(nutTodayMeals.length+1),items:[]});renderMealCards();saveTodayMeals();}
function removeMeal(mi){nutTodayMeals.splice(mi,1);renderMealCards();saveTodayMeals();}
function updateNutTotals(){
  const totals=nutTodayMeals.reduce((acc,m)=>{const mt=mealTotals(m);return{cal:acc.cal+mt.cal,pro:acc.pro+mt.pro,carb:acc.carb+mt.carb,fat:acc.fat+mt.fat};},{cal:0,pro:0,carb:0,fat:0});
  const calTarget=parseInt(localStorage.getItem(userKey(NUT_TARGET_KEY)))||0;
  const split=loadMacroSplit();
  const setText=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val||'';};
  const setColor=(id,c)=>{const el=document.getElementById(id);if(el)el.style.color=c;};
  // calorie main value + color
  const calColor=calTarget&&totals.cal?(totals.cal>calTarget?'var(--accent3)':'var(--accent)'):'var(--accent)';
  setColor('tot-cal',calColor);
  const el=document.getElementById('tot-cal');if(el)el.textContent=totals.cal||'\u2014';
  // calorie target + remaining
  if(calTarget){
    setText('tot-cal-target','target: '+calTarget+' kcal');
    const remCal=calTarget-totals.cal;
    const remCalEl=document.getElementById('tot-cal-rem');
    if(remCalEl){remCalEl.textContent=remCal>0?remCal+' left':remCal===0?'\u2713 done':(Math.abs(remCal))+' over';remCalEl.style.color=remCal>0?'var(--muted)':remCal===0?'var(--accent2)':'var(--accent3)';}
  }else{setText('tot-cal-target','');setText('tot-cal-rem','');}
  // macro targets from split + calTarget
  const macros=['pro','carb','fat'];
  const pcts=split?{pro:split.pro,carb:split.carb,fat:split.fat}:{pro:0,carb:0,fat:0};
  const kcalPer={pro:4,carb:4,fat:9};
  const colors={pro:'var(--accent2)',carb:'var(--ss2)',fat:'var(--ss3)'};
  macros.forEach(m=>{
    const valEl=document.getElementById('tot-'+m);
    if(valEl){valEl.textContent=totals[m]||'\u2014';valEl.style.color=colors[m];}
    if(calTarget&&pcts[m]){
      const gTarget=Math.round((calTarget*(pcts[m]/100))/kcalPer[m]);
      setText('tot-'+m+'-target','target: '+gTarget+'g');
      const remG=gTarget-totals[m];
      const remEl=document.getElementById('tot-'+m+'-rem');
      if(remEl){remEl.textContent=remG>0?remG+'g left':remG===0?'\u2713 done':(Math.abs(remG))+'g over';remEl.style.color=remG>0?'var(--muted)':remG===0?'var(--accent2)':'var(--accent3)';}
    }else{setText('tot-'+m+'-target','');setText('tot-'+m+'-rem','');}
  });
}

// ── FOOD PICKER ──────────────────────────────────────────────────────────────
let fpTargetMeal=-1,fpMode='custom';
function openFoodPicker(mi){
  fpTargetMeal=mi;
  document.getElementById('food-picker-title').textContent='Add to: '+(nutTodayMeals[mi]?.name||'Meal');
  fpSetMode('custom');
  const ov=document.getElementById('food-picker-overlay'),md=document.getElementById('food-picker-modal');
  ov.style.opacity='1';ov.style.pointerEvents='auto';md.style.transform='translateY(0)';
}
function closeFoodPicker(){const ov=document.getElementById('food-picker-overlay'),md=document.getElementById('food-picker-modal');ov.style.opacity='0';ov.style.pointerEvents='none';md.style.transform='translateY(100%)';}
function maybeFoodPickerClose(e){if(e.target===document.getElementById('food-picker-overlay'))closeFoodPicker();}
function fpSetMode(mode){
  fpMode=mode;
  const iS='background:var(--input-bg);border:1px solid var(--border);color:var(--text);font-family:\'DM Mono\',monospace;font-size:13px;padding:8px 10px;border-radius:2px;outline:none;width:100%;';
  ['custom','cookbook'].forEach(m=>{const btn=document.getElementById('fp-tab-'+m);if(!btn)return;const active=m===mode;btn.style.cssText=`font-family:\'DM Mono\',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:6px 12px;border-radius:2px;cursor:pointer;background:${active?'var(--accent2)':'none'};color:${active?'#0e0e0f':'var(--muted)'};border:${active?'none':'1px solid var(--border)'};`;});
  const addBtn=document.getElementById('fp-add-btn');if(addBtn)addBtn.style.display=mode==='custom'?'block':'none';
  const body=document.getElementById('food-picker-body');
  if(mode==='custom'){
    _fpSelectedFood = null;
    _fpCustomPerServing = null;
    body.innerHTML=`<div style="display:flex;flex-direction:column;gap:12px;">
      <div style="position:relative;">
        <div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:5px;">Food Name</div>
        <input type="text" id="fp-name" placeholder="Start typing to search foods…" autocomplete="off"
          style="${iS}" onfocus="fpShowFoodSuggestions()" oninput="fpShowFoodSuggestions();fpUpdateUI();"
          onblur="setTimeout(fpHideFoodSuggestions,180)" onfocusin="this.style.borderColor=\'var(--accent2)\'">
        <div id="fp-food-dropdown" style="display:none;position:absolute;left:0;right:0;top:calc(100% + 3px);background:var(--surface);border:1px solid var(--border);border-radius:3px;z-index:9999;max-height:220px;overflow-y:auto;box-shadow:0 4px 16px rgba(0,0,0,.35);"></div>
      </div>

      <!-- Shown when a DB food is selected -->
      <div id="fp-serving-row" style="display:none;background:var(--surface2);border:1px solid var(--border);border-radius:3px;padding:8px 12px;">
        <div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--accent2);margin-bottom:6px;">Serving Size</div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span id="fp-serving-label" style="font-family:\'DM Mono\',monospace;font-size:10px;color:var(--muted);flex:1;">—</span>
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="font-family:\'DM Mono\',monospace;font-size:9px;color:var(--muted);">×</span>
            <input type="number" id="fp-servings" value="1" min="0.1" step="0.25"
              style="width:60px;background:var(--input-bg);border:1px solid var(--accent2);color:var(--text);font-family:\'DM Mono\',monospace;font-size:12px;padding:4px 8px;border-radius:2px;outline:none;"
              oninput="fpApplyServings()">
            <span style="font-family:\'DM Mono\',monospace;font-size:9px;color:var(--muted);">servings</span>
          </div>
        </div>
      </div>

      <!-- Shown when typing a NEW food not in DB -->
      <div id="fp-new-food-row" style="display:none;background:var(--surface2);border:1px solid var(--border);border-radius:3px;padding:10px 12px;">
        <div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--accent2);margin-bottom:8px;">New Food</div>
        <div style="margin-bottom:8px;">
          <div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:4px;">Serving Size Label</div>
          <input type="text" id="fp-new-serving" placeholder="e.g. 1 bowl, 8 oz, 1 cup" autocomplete="off"
            style="${iS}font-size:12px;" onfocus="this.style.borderColor=\'var(--accent2)\'" onblur="this.style.borderColor=\'var(--border)\'">
        </div>
        <div style="font-family:\'DM Mono\',monospace;font-size:9px;color:var(--muted);line-height:1.6;">Enter nutrition below for <strong style="color:var(--text);">1 serving</strong>. After saving you can adjust servings.</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;">
        <div><div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:5px;">Calories</div><input type="number" id="fp-cal" placeholder="kcal" min="0" style="${iS}" onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'var(--border)\'"></div>
        <div><div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:5px;">Protein g</div><input type="number" id="fp-pro" placeholder="g" min="0" style="${iS}" onfocus="this.style.borderColor=\'var(--accent2)\'" onblur="this.style.borderColor=\'var(--border)\'"></div>
        <div><div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:5px;">Carbs g</div><input type="number" id="fp-carb" placeholder="g" min="0" style="${iS}" onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'var(--border)\'"></div>
        <div><div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:5px;">Fat g</div><input type="number" id="fp-fat" placeholder="g" min="0" style="${iS}" onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'var(--border)\'"></div>
      </div>

      <!-- Save new food + servings multiplier (after saving) -->
      <div id="fp-save-food-row" style="display:none;align-items:center;gap:8px;padding:6px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:3px;">
        <span style="font-family:\'DM Mono\',monospace;font-size:10px;color:var(--accent2);flex:1;">Save this food for next time?</span>
        <button id="fp-save-food-btn" onclick="fpSaveNewFood()" style="background:none;border:1px solid var(--accent2);color:var(--accent2);font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;padding:5px 12px;border-radius:2px;cursor:pointer;white-space:nowrap;">Save food</button>
      </div>
      <!-- Servings multiplier shown AFTER a new food is saved -->
      <div id="fp-new-servings-row" style="display:none;background:var(--surface2);border:1px solid var(--border);border-radius:3px;padding:8px 12px;">
        <div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--accent2);margin-bottom:6px;">How many servings?</div>
        <div style="display:flex;align-items:center;gap:4px;">
          <input type="number" id="fp-new-sv-count" value="1" min="0.1" step="0.25"
            style="width:60px;background:var(--input-bg);border:1px solid var(--accent2);color:var(--text);font-family:\'DM Mono\',monospace;font-size:12px;padding:4px 8px;border-radius:2px;outline:none;"
            oninput="fpApplyNewServings()">
          <span style="font-family:\'DM Mono\',monospace;font-size:9px;color:var(--muted);">servings</span>
        </div>
      </div>
    </div>`;
    setTimeout(()=>document.getElementById('fp-name')?.focus(),80);
  } else {
    const recipes=loadCookbook();
    if(!recipes.length){body.innerHTML=`<div style="padding:32px 0;text-align:center;font-family:\'DM Mono\',monospace;font-size:11px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;">No recipes yet.<br><br>Add some in the Cookbook.</div>`;return;}
    let html='<div style="display:flex;flex-direction:column;gap:8px;">';
    recipes.forEach((r,ri)=>{
      const rt=recipeNutritionTotals(r);const sv=r.servings||1;
      html+=`<div style="border:1px solid var(--border);border-radius:3px;overflow:hidden;">
        <div style="padding:9px 14px;background:var(--surface2);display:flex;align-items:center;justify-content:space-between;">
          <div style="font-size:13px;color:var(--text);">${esc(r.name)}</div>
          <div style="font-family:\'DM Mono\',monospace;font-size:9px;color:var(--muted);">${sv} serving${sv>1?'s':''}</div>
        </div>
        <div style="padding:6px 14px;font-family:\'DM Mono\',monospace;font-size:10px;display:flex;gap:12px;border-bottom:1px solid var(--border);">
          <span style="color:var(--accent);">${rt.cal} kcal</span><span style="color:var(--accent2);">${rt.pro}g P</span><span style="color:var(--muted);">${rt.carb}g C · ${rt.fat}g F</span>
        </div>
        <div style="padding:7px 14px;display:flex;align-items:center;gap:8px;">
          <span style="font-family:\'DM Mono\',monospace;font-size:9px;color:var(--muted);">Servings:</span>
          <input type="number" id="fp-sv-${ri}" value="1" min="0.1" step="0.25" style="background:var(--input-bg);border:1px solid var(--border);color:var(--text);font-family:\'DM Mono\',monospace;font-size:11px;padding:4px 8px;border-radius:2px;outline:none;width:72px;" onfocus="this.style.borderColor=\'var(--accent2)\'" onblur="this.style.borderColor=\'var(--border)\'">
          <span style="font-family:\'DM Mono\',monospace;font-size:9px;color:var(--muted);">/ ${sv}</span>
          <button onclick="fpAddRecipe(${ri})" style="background:var(--accent2);color:#0e0e0f;font-family:\'DM Mono\',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;border:none;padding:6px 14px;border-radius:2px;cursor:pointer;">Add</button>
        </div>
      </div>`;
    });
    html+='</div>';body.innerHTML=html;
  }
}
// ── FOOD AUTOCOMPLETE ─────────────────────────────────────────────────────
// Custom foods saved by the user to localStorage
const CUSTOM_FOODS_SK = 'kc_custom_foods';
function loadCustomFoods(){ try{ return JSON.parse(localStorage.getItem(userKey(CUSTOM_FOODS_SK))||'[]'); }catch(e){ return []; } }
function saveCustomFoods(arr){ try{ localStorage.setItem(userKey(CUSTOM_FOODS_SK), JSON.stringify(arr)); }catch(e){} }

// All foods = built-in DB + user-saved custom foods
function getAllFoods(){ return [...FOODS_DB, ...loadCustomFoods()]; }

// The food currently selected from the list (null = custom/new food)
let _fpSelectedFood = null;
// Per-serving nutrition entered by user (for new custom foods)
let _fpCustomPerServing = null;

function fpShowFoodSuggestions(){
  const inp = document.getElementById('fp-name');
  if(!inp) return;
  const q = inp.value.trim().toLowerCase();
  const dd = document.getElementById('fp-food-dropdown');
  if(!dd) return;

  // When user edits the name after selecting, clear the selection
  if(_fpSelectedFood && inp.value !== _fpSelectedFood.name){
    _fpSelectedFood = null;
    _fpCustomPerServing = null;
    fpUpdateUI();
  }

  const all = getAllFoods();
  const matches = q.length < 1 ? all.slice(0,30) : all.filter(f => f.name.toLowerCase().includes(q));
  if(!matches.length){ dd.style.display='none'; return; }

  dd.innerHTML = matches.map(f => {
    const idx = all.indexOf(f);
    const isCustom = idx >= FOODS_DB.length;
    return `<div style="padding:9px 12px;font-size:13px;color:var(--text);cursor:pointer;border-bottom:1px solid var(--border);display:flex;align-items:baseline;justify-content:space-between;"
      onmousedown="fpSelectFood(${idx})"
      onmouseover="this.style.background='var(--surface2)'"
      onmouseout="this.style.background=''"
    ><span>${f.name}${isCustom?` <span style="font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;color:var(--accent2);background:rgba(79,195,161,.12);border:1px solid rgba(79,195,161,.25);padding:1px 5px;border-radius:2px;margin-left:5px;">SAVED</span>`:''}
    </span><span style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);margin-left:8px;white-space:nowrap;">${f.serving}</span></div>`;
  }).join('');
  dd.style.display='block';
}

function fpHideFoodSuggestions(){
  const dd=document.getElementById('fp-food-dropdown');
  if(dd) dd.style.display='none';
}

function fpSelectFood(idx){
  const all = getAllFoods();
  const food = all[idx];
  if(!food) return;
  _fpSelectedFood = food;
  _fpCustomPerServing = null;
  const inp = document.getElementById('fp-name');
  if(inp) inp.value = food.name;
  fpHideFoodSuggestions();
  // Update serving label
  const label = document.getElementById('fp-serving-label');
  if(label) label.textContent = `Base: ${food.serving}`;
  // Reset servings to 1 and update UI
  const svInp = document.getElementById('fp-servings');
  if(svInp) svInp.value = '1';
  fpUpdateUI();
  fpApplyServings();
}

// Update which rows are visible based on current state
function fpUpdateUI(){
  const servingRow    = document.getElementById('fp-serving-row');
  const newFoodRow    = document.getElementById('fp-new-food-row');
  const saveRow       = document.getElementById('fp-save-food-row');
  const newSvRow      = document.getElementById('fp-new-servings-row');
  const name = (document.getElementById('fp-name')?.value||'').trim();

  if(_fpSelectedFood){
    // Known DB/saved food selected
    if(servingRow) servingRow.style.display = 'block';
    if(newFoodRow) newFoodRow.style.display = 'none';
    if(saveRow)    saveRow.style.display    = 'none';
    if(newSvRow)   newSvRow.style.display   = 'none';
  } else {
    // No food selected — typing a new name
    if(servingRow) servingRow.style.display = 'none';
    if(newSvRow)   newSvRow.style.display   = 'none';
    const inDB = name && getAllFoods().some(f => f.name.toLowerCase() === name.toLowerCase());
    if(name && !inDB){
      if(newFoodRow) newFoodRow.style.display = 'block';
      if(saveRow)    saveRow.style.display    = 'flex';
    } else {
      if(newFoodRow) newFoodRow.style.display = 'none';
      if(saveRow)    saveRow.style.display    = 'none';
    }
  }
}

function fpApplyServings(){
  if(!_fpSelectedFood) return;
  const sv = parseFloat(document.getElementById('fp-servings')?.value) || 1;
  const f = _fpSelectedFood;
  const round = n => Math.round(n * sv * 10) / 10;
  const set = (id, val) => { const el=document.getElementById(id); if(el) el.value=val||''; };
  set('fp-cal',  round(f.cal));
  set('fp-pro',  round(f.pro));
  set('fp-carb', round(f.carb));
  set('fp-fat',  round(f.fat));
}

// Called when the servings spinner changes for a newly-saved custom food
function fpApplyNewServings(){
  if(!_fpSelectedFood) return;
  const sv = parseFloat(document.getElementById('fp-new-sv-count')?.value) || 1;
  const f = _fpSelectedFood;
  const round = n => Math.round(n * sv * 10) / 10;
  const set = (id, val) => { const el=document.getElementById(id); if(el) el.value=val||''; };
  set('fp-cal',  round(f.cal));
  set('fp-pro',  round(f.pro));
  set('fp-carb', round(f.carb));
  set('fp-fat',  round(f.fat));
}

function fpSaveNewFood(){
  const name = (document.getElementById('fp-name')?.value||'').trim();
  if(!name) return;
  const serving = (document.getElementById('fp-new-serving')?.value||'').trim() || '1 serving';
  const cal  = parseFloat(document.getElementById('fp-cal')?.value)||0;
  const pro  = parseFloat(document.getElementById('fp-pro')?.value)||0;
  const carb = parseFloat(document.getElementById('fp-carb')?.value)||0;
  const fat  = parseFloat(document.getElementById('fp-fat')?.value)||0;
  const newFood = { name, serving, servingG: null, cal, pro, carb, fat };
  const arr = loadCustomFoods();
  if(!arr.some(f => f.name.toLowerCase()===name.toLowerCase())){
    arr.push(newFood);
    saveCustomFoods(arr);
  }
  // Select the newly saved food so the servings multiplier appears
  _fpSelectedFood = newFood;
  _fpCustomPerServing = null;
  // Show "how many servings" row, hide save/new-food rows
  const saveRow   = document.getElementById('fp-save-food-row');
  const newFoodRow= document.getElementById('fp-new-food-row');
  const newSvRow  = document.getElementById('fp-new-servings-row');
  if(saveRow)    saveRow.style.display    = 'none';
  if(newFoodRow) newFoodRow.style.display = 'none';
  if(newSvRow){  newSvRow.style.display   = 'block'; }
  // Reset multiplier to 1 (macros already correct for 1 serving)
  const svInp = document.getElementById('fp-new-sv-count');
  if(svInp) svInp.value = '1';
  // Flash confirmation
  const saveBtn = document.getElementById('fp-save-food-btn');
  if(saveBtn){ saveBtn.textContent='✓ Saved!'; saveBtn.style.color='var(--accent2)'; }
}

function fpConfirm(){
  if(fpMode!=='custom') return;
  const name = (document.getElementById('fp-name')?.value||'').trim();
  if(!name) return;
  // Figure out servings multiplier
  let sv = 1;
  if(_fpSelectedFood){
    // DB food uses fp-servings; newly-saved custom food uses fp-new-sv-count
    const fromDB  = parseFloat(document.getElementById('fp-servings')?.value);
    const fromNew = parseFloat(document.getElementById('fp-new-sv-count')?.value);
    sv = fromNew || fromDB || 1;
  }
  const svSuffix = (_fpSelectedFood && Math.abs(sv - 1) > 0.001) ? ` ×${parseFloat(sv.toFixed(2))}` : '';
  const item = {
    name: name + svSuffix,
    cal:  parseFloat(document.getElementById('fp-cal')?.value)  || 0,
    pro:  parseFloat(document.getElementById('fp-pro')?.value)  || 0,
    carb: parseFloat(document.getElementById('fp-carb')?.value) || 0,
    fat:  parseFloat(document.getElementById('fp-fat')?.value)  || 0,
  };
  if(nutTodayMeals[fpTargetMeal]){ nutTodayMeals[fpTargetMeal].items.push(item); renderMealCards(); saveTodayMeals(); }
  closeFoodPicker();
}
function fpAddRecipe(ri){
  const recipes=loadCookbook();const r=recipes[ri];if(!r)return;
  const sv=parseFloat(document.getElementById(`fp-sv-${ri}`)?.value)||1;
  if(sv<=0)return;
  const ratio=sv/(r.servings||1);
  const svLabel=Number.isInteger(sv)?sv:parseFloat(sv.toFixed(2));
  const suffix=Math.abs(sv-(r.servings||1))<0.001?'':' (\u00d7'+svLabel+')';
  const items=(r.ingredients||[]).map(ing=>({name:ing.name+suffix,cal:Math.round((ing.cal||0)*ratio*10)/10,pro:Math.round((ing.pro||0)*ratio*10)/10,carb:Math.round((ing.carb||0)*ratio*10)/10,fat:Math.round((ing.fat||0)*ratio*10)/10}));
  if(nutTodayMeals[fpTargetMeal]){nutTodayMeals[fpTargetMeal].items.push(...items);renderMealCards();saveTodayMeals();}
  closeFoodPicker();
}

// ── COOKBOOK ──────────────────────────────────────────────────────────────────
let cbEditingId=null;
function loadCookbook(){try{return JSON.parse(localStorage.getItem(userKey(COOKBOOK_KEY))||'[]');}catch(e){return[];}}
function saveCookbook(d){try{localStorage.setItem(userKey(COOKBOOK_KEY),JSON.stringify(d));}catch(e){}}
function recipeNutritionTotals(r){return(r.ingredients||[]).reduce((a,i)=>({cal:a.cal+(i.cal||0),pro:a.pro+(i.pro||0),carb:a.carb+(i.carb||0),fat:a.fat+(i.fat||0)}),{cal:0,pro:0,carb:0,fat:0});}
function openCookbook(){cbEditingId=null;cbSetTab('list');const ov=document.getElementById('cookbook-overlay'),md=document.getElementById('cookbook-modal');ov.style.opacity='1';ov.style.pointerEvents='auto';md.style.transform='translateY(0)';}
function closeCookbook(){const ov=document.getElementById('cookbook-overlay'),md=document.getElementById('cookbook-modal');ov.style.opacity='0';ov.style.pointerEvents='none';md.style.transform='translateY(100%)';}
function maybeCookbookClose(e){if(e.target===document.getElementById('cookbook-overlay'))closeCookbook();}
function cbSetTab(tab){
  const vb=document.getElementById('cb-view-tab'),eb=document.getElementById('cb-edit-tab');
  if(vb)vb.style.cssText=`font-family:\'DM Mono\',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:6px 14px;border-radius:2px;cursor:pointer;background:${tab==='list'?'var(--accent)':'none'};color:${tab==='list'?'#0e0e0f':'var(--muted)'};border:${tab==='list'?'none':'1px solid var(--border)'};`;
  if(eb)eb.style.cssText=`font-family:\'DM Mono\',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:6px 14px;border-radius:2px;cursor:pointer;background:${tab==='edit'?'var(--accent)':'none'};color:${tab==='edit'?'#0e0e0f':'var(--muted)'};border:${tab==='edit'?'none':'1px solid var(--border)'};`;
  if(tab==='list')cbRenderList();else cbRenderEditor(cbEditingId);
}
function cbRenderList(){
  const recipes=loadCookbook();const body=document.getElementById('cookbook-body');
  if(!recipes.length){body.innerHTML=`<div style="padding:48px 20px;text-align:center;font-family:\'DM Mono\',monospace;font-size:11px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;">No recipes yet.<br><br>Hit "+ New Recipe" to add one.</div>`;return;}
  let html='<div style="padding:12px 20px;display:flex;flex-direction:column;gap:10px;">';
  recipes.forEach((r,ri)=>{
    const rt=recipeNutritionTotals(r);const sv=r.servings||1;
    html+=`<div style="border:1px solid var(--border);border-radius:4px;overflow:hidden;">
      <div style="padding:11px 16px;background:var(--surface2);display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <div><div style="font-size:14px;color:var(--text);margin-bottom:2px;">${esc(r.name)}</div>
        <div style="font-family:\'DM Mono\',monospace;font-size:9px;color:var(--muted);">${sv} serving${sv>1?'s':''} · ${(r.ingredients||[]).length} ingredients</div></div>
        <div style="display:flex;gap:6px;">
          <button onclick="cbEditRecipe(\'${r.id}\')" style="background:none;border:1px solid var(--border);color:var(--muted);font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;padding:5px 10px;border-radius:2px;cursor:pointer;" onmouseover="this.style.borderColor=\'var(--accent)\';this.style.color=\'var(--accent)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.color=\'var(--muted)\'">Edit</button>
          <button onclick="cbDeleteRecipe(\'${r.id}\')" style="background:none;border:1px solid var(--border);color:var(--muted);font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;padding:5px 10px;border-radius:2px;cursor:pointer;" onmouseover="this.style.borderColor=\'var(--accent3)\';this.style.color=\'var(--accent3)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.color=\'var(--muted)\'">✕</button>
        </div>
      </div>
      <div style="padding:7px 16px;display:flex;gap:14px;font-family:\'DM Mono\',monospace;font-size:10px;border-bottom:1px solid var(--border);">
        <span style="color:var(--accent);">${rt.cal} kcal</span><span style="color:var(--accent2);">${rt.pro}g protein</span><span style="color:var(--muted);">${rt.carb}g carbs · ${rt.fat}g fat</span>
      </div>
      ${r.instructions?`<div style="padding:10px 16px;font-size:12px;color:var(--muted);line-height:1.6;white-space:pre-wrap;">${esc(r.instructions)}</div>`:''}
    </div>`;
  });
  html+='</div>';body.innerHTML=html;
}
function cbEditRecipe(id){cbEditingId=id;cbSetTab('edit');}
function cbDeleteRecipe(id){if(!confirm('Delete this recipe?'))return;saveCookbook(loadCookbook().filter(r=>r.id!==id));cbRenderList();}
function cbIngredientRow(ii,ing){
  const cbS="background:var(--input-bg);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:11px;padding:3px 5px;border-radius:2px;outline:none;width:100%;";
  return`<div id="cb-ing-${ii}" style="padding:5px 0 6px;border-bottom:1px solid var(--border);margin-bottom:0;">
    <div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;">
      <input type="text" id="cbi-name-${ii}" value="${esc(ing.name||'')}" placeholder="Ingredient" style="${cbS}font-size:12px;" onfocus="this.style.borderColor='var(--accent2)'" onblur="this.style.borderColor='var(--border)'">
      <button onclick="cbRemoveIngRow(${ii})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px;padding:1px 3px;flex-shrink:0;" onmouseover="this.style.color='var(--accent3)'" onmouseout="this.style.color='var(--muted)'">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:4px;">
      <div><div style="font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;text-transform:uppercase;color:var(--accent);margin-bottom:1px;">kcal</div><input type="number" id="cbi-cal-${ii}" value="${ing.cal||''}" placeholder="0" min="0" style="${cbS}text-align:right;" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'"></div>
      <div><div style="font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;text-transform:uppercase;color:var(--accent2);margin-bottom:1px;">pro</div><input type="number" id="cbi-pro-${ii}" value="${ing.pro||''}" placeholder="0" min="0" style="${cbS}text-align:right;" onfocus="this.style.borderColor='var(--accent2)'" onblur="this.style.borderColor='var(--border)'"></div>
      <div><div style="font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:1px;">carb</div><input type="number" id="cbi-carb-${ii}" value="${ing.carb||''}" placeholder="0" min="0" style="${cbS}text-align:right;" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'"></div>
      <div><div style="font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:1px;">fat</div><input type="number" id="cbi-fat-${ii}" value="${ing.fat||''}" placeholder="0" min="0" style="${cbS}text-align:right;" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'"></div>
    </div>
  </div>`;
}
function cbRenderEditor(editId){
  const recipe=editId?loadCookbook().find(r=>r.id===editId):null;
  const iS='background:var(--input-bg);border:1px solid var(--border);color:var(--text);font-family:\'DM Mono\',monospace;font-size:13px;padding:8px 10px;border-radius:2px;outline:none;width:100%;';
  let ingRows=(recipe?.ingredients||[{name:'',cal:0,pro:0,carb:0,fat:0}]).map((ing,ii)=>cbIngredientRow(ii,ing)).join('');
  document.getElementById('cookbook-body').innerHTML=`<div style="padding:16px 20px;display:flex;flex-direction:column;gap:14px;">
    <div style="display:grid;grid-template-columns:2fr 80px;gap:10px;">
      <div><div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:5px;">Recipe Name</div>
      <input type="text" id="cb-name" value="${esc(recipe?.name||'')}" placeholder="e.g. High Protein Pasta" style="${iS}" onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'var(--border)\'"></div>
      <div><div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:5px;">Servings</div>
      <input type="number" id="cb-servings" value="${recipe?.servings||1}" min="1" style="${iS}" onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'var(--border)\'"></div>
    </div>
    <div><div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:5px;">Instructions (optional)</div>
    <textarea id="cb-instructions" placeholder="Steps, cooking notes, prep tips…" style="background:var(--input-bg);border:1px solid var(--border);color:var(--text);font-family:\'DM Sans\',sans-serif;font-size:13px;padding:8px 10px;border-radius:2px;outline:none;width:100%;min-height:80px;resize:vertical;line-height:1.6;" onfocus="this.style.borderColor=\'var(--accent2)\'" onblur="this.style.borderColor=\'var(--border)\'">${esc(recipe?.instructions||'')}</textarea></div>
    <div>
      <div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">Ingredients &amp; Nutrition per serving</div>
      <div id="cb-ing-list">${ingRows}</div>
      <button onclick="cbAddIngredientRow()" style="width:100%;background:none;border:1px dashed var(--border);color:var(--muted);font-family:\'DM Mono\',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:7px;border-radius:2px;cursor:pointer;margin-top:5px;transition:all .2s;" onmouseover="this.style.borderColor=\'var(--accent2)\';this.style.color=\'var(--accent2)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.color=\'var(--muted)\'">+ Add Ingredient</button>
    </div>
    <button onclick="cbSaveRecipe(\'${editId||''}\');" style="width:100%;background:var(--accent);color:#0e0e0f;font-family:\'Bebas Neue\',sans-serif;font-size:20px;letter-spacing:3px;border:none;padding:13px;border-radius:3px;cursor:pointer;">${editId?'UPDATE RECIPE':'SAVE RECIPE'}</button>
  </div>`;
}
function cbAddIngredientRow(){
  const list=document.getElementById('cb-ing-list');if(!list)return;
  const count=list.querySelectorAll('[id^="cb-ing-"]').length;
  list.insertAdjacentHTML('beforeend',cbIngredientRow(count,{name:'',cal:0,pro:0,carb:0,fat:0}));
}
function cbRemoveIngRow(ii){const row=document.getElementById('cb-ing-'+ii);if(row)row.remove();}
function cbCollectIngredients(){
  const list=document.getElementById('cb-ing-list');if(!list)return[];
  return Array.from(list.querySelectorAll('[id^="cb-ing-"]')).map(row=>{
    const id=row.id.replace('cb-ing-','');
    const name=(document.getElementById(`cbi-name-${id}`)?.value||'').trim();
    if(!name)return null;
    return{name,cal:parseFloat(document.getElementById(`cbi-cal-${id}`)?.value)||0,pro:parseFloat(document.getElementById(`cbi-pro-${id}`)?.value)||0,carb:parseFloat(document.getElementById(`cbi-carb-${id}`)?.value)||0,fat:parseFloat(document.getElementById(`cbi-fat-${id}`)?.value)||0};
  }).filter(Boolean);
}
function cbSaveRecipe(editId){
  const name=(document.getElementById('cb-name')?.value||'').trim();if(!name){alert('Please enter a recipe name.');return;}
  const servings=parseInt(document.getElementById('cb-servings')?.value)||1;
  const instructions=(document.getElementById('cb-instructions')?.value||'').trim();
  const ingredients=cbCollectIngredients();
  const recipes=loadCookbook();
  if(editId){const idx=recipes.findIndex(r=>r.id===editId);if(idx>=0)recipes[idx]={...recipes[idx],name,servings,instructions,ingredients};}
  else recipes.push({id:'r'+Date.now(),name,servings,instructions,ingredients});
  saveCookbook(recipes);cbEditingId=null;cbSetTab('list');
}

// ── COPY MEAL TO DAY ──────────────────────────────────────────────────────────
let copyMealIndex = -1;
function openCopyMeal(mi) {
  copyMealIndex = mi;
  const meal = nutTodayMeals[mi];
  const labelEl = document.getElementById('copy-meal-label');
  if (labelEl) labelEl.textContent = meal ? meal.name : '';
  // Build date options: next 14 days + past 14 days, excluding activeDate
  const sel = document.getElementById('copy-meal-date-select');
  if (!sel) return;
  const todayKey = new Date().toISOString().split('T')[0];
  const activeKey = nutActiveDate || todayKey;
  const dates = [];
  for (let i = -14; i <= 14; i++) {
    if (i === 0) continue; // skip current day — can't copy to same day
    const d = new Date(); d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    if (key !== activeKey) dates.push(key);
  }
  // Deduplicate and also include any logged dates not already in range
  const log = loadNutLog();
  const extra = log.map(e => e.date).filter(d => d !== activeKey && !dates.includes(d));
  const allDates = [...new Set([...dates, ...extra])].sort((a,b) => a > b ? 1 : -1);
  sel.innerHTML = allDates.map(d => {
    const isToday = d === todayKey;
    const label = formatNutDate(d, isToday);
    return `<option value="${d}">${label}</option>`;
  }).join('');
  // Default to tomorrow if available, else nearest future
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = tomorrow.toISOString().split('T')[0];
  if (allDates.includes(tomorrowKey)) sel.value = tomorrowKey;
  updateCopyMealConflictNote();
  sel.onchange = updateCopyMealConflictNote;
  const ov = document.getElementById('copy-meal-overlay');
  const md = document.getElementById('copy-meal-modal');
  ov.style.opacity = '1'; ov.style.pointerEvents = 'auto'; md.style.transform = 'translateY(0)';
}
function updateCopyMealConflictNote() {
  const sel = document.getElementById('copy-meal-date-select');
  const note = document.getElementById('copy-meal-conflict-note');
  if (!sel || !note || copyMealIndex < 0) return;
  const targetDate = sel.value;
  const meal = nutTodayMeals[copyMealIndex];
  if (!meal) return;
  const log = loadNutLog();
  const entry = log.find(e => e.date === targetDate);
  const conflict = entry && (entry.meals || []).some(m => m.name === meal.name);
  note.style.display = conflict ? 'block' : 'none';
}
function closeCopyMeal() {
  const ov = document.getElementById('copy-meal-overlay');
  const md = document.getElementById('copy-meal-modal');
  ov.style.opacity = '0'; ov.style.pointerEvents = 'none'; md.style.transform = 'translateY(100%)';
  copyMealIndex = -1;
}
function maybeCopyMealClose(e) { if (e.target === document.getElementById('copy-meal-overlay')) closeCopyMeal(); }
function copyMealConfirm() {
  if (copyMealIndex < 0) return;
  const sel = document.getElementById('copy-meal-date-select');
  if (!sel) return;
  const targetDate = sel.value;
  const meal = nutTodayMeals[copyMealIndex];
  if (!meal || !targetDate) return;
  const mealCopy = JSON.parse(JSON.stringify(meal)); // deep clone
  const log = loadNutLog();
  let entry = log.find(e => e.date === targetDate);
  if (!entry) {
    entry = { date: targetDate, bw: null, meals: [] };
    log.push(entry);
  }
  // Replace if same-name meal exists, otherwise append
  const idx = (entry.meals || []).findIndex(m => m.name === mealCopy.name);
  if (!entry.meals) entry.meals = [];
  if (idx >= 0) entry.meals[idx] = mealCopy;
  else entry.meals.push(mealCopy);
  log.sort((a, b) => a.date > b.date ? 1 : -1);
  saveNutLog(log);
  closeCopyMeal();
  // Show confirmation toast via save-status element
  const s = document.getElementById('nut-save-status');
  if (s) {
    const label = formatNutDate(targetDate, targetDate === new Date().toISOString().split('T')[0]);
    s.textContent = `✓ Copied to ${label}`; s.style.opacity = '1';
    setTimeout(() => s.style.opacity = '0', 2400);
  }
  nutBuildDateSelect();
}

function saveTodayMeals(){
  const dateKey=nutActiveDate||new Date().toISOString().split('T')[0];
  const bw=parseFloat(document.getElementById('nut-bw')&&document.getElementById('nut-bw').value)||null;
  const log=loadNutLog();const entry={date:dateKey,bw,meals:nutTodayMeals};
  const idx=log.findIndex(e=>e.date===dateKey);if(idx>=0)log[idx]=entry;else log.push(entry);
  log.sort((a,b)=>a.date>b.date?1:-1);saveNutLog(log);
  const s=document.getElementById('nut-save-status');if(s){s.textContent='\u2713 Saved';s.style.opacity='1';setTimeout(()=>s.style.opacity='0',1800);}
  nutBuildDateSelect();renderNutritionCharts();renderNutritionTable();
}
function initNutritionPanel(){
  const todayKey=new Date().toISOString().split('T')[0];
  if(!nutActiveDate)nutActiveDate=todayKey;
  try{const t=localStorage.getItem(userKey(NUT_TARGET_KEY));if(t&&document.getElementById('nut-target'))document.getElementById('nut-target').value=t;}catch(e){}
  loadMacroSplitUI();
  nutBuildDateSelect();nutLoadDateData(nutActiveDate);renderNutritionCharts();renderNutritionTable();
}
function nutBuildDateSelect(){
  const sel=document.getElementById('nut-date-select');if(!sel)return;
  const todayKey=new Date().toISOString().split('T')[0];
  const log=loadNutLog();const loggedDates=new Set(log.map(e=>e.date));loggedDates.add(todayKey);
  for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-i);loggedDates.add(d.toISOString().split('T')[0]);}
  const dates=[...loggedDates].sort((a,b)=>b.localeCompare(a));
  sel.innerHTML=dates.map(d=>{const isToday=d===todayKey;const hasData=log.some(e=>e.date===d);const label=formatNutDate(d,isToday)+(hasData&&!isToday?' \u25cf':'');return`<option value="${d}" ${d===nutActiveDate?'selected':''}>${label}</option>`;}).join('');
}
function formatNutDate(isoDate,isToday){if(isToday)return'Today';const d=new Date(isoDate+'T12:00:00');return d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});}
function nutSwitchDate(dateKey){
  nutActiveDate=dateKey;const todayKey=new Date().toISOString().split('T')[0];
  const badge=document.getElementById('nut-date-badge');if(badge)badge.style.display=(dateKey!==todayKey)?'inline':'none';
  nutLoadDateData(dateKey);
}
function nutLoadDateData(dateKey){
  const log=loadNutLog();const entry=log.find(e=>e.date===dateKey);const bwEl=document.getElementById('nut-bw');
  if(entry){
    if(bwEl)bwEl.value=entry.bw||'';
    nutTodayMeals=(entry.meals||[]).map(m=>{if(m.items)return m;return{name:m.name,items:[{name:m.note||m.name,cal:m.cal||0,pro:m.pro||0,carb:m.carb||0,fat:m.fat||0}].filter(i=>i.cal||i.pro||i.carb||i.fat)};});
    if(!nutTodayMeals.length)nutTodayMeals=DEFAULT_MEAL_NAMES.map(n=>({name:n,items:[]}));
  } else {
    if(bwEl)bwEl.value='';
    nutTodayMeals=DEFAULT_MEAL_NAMES.map(n=>({name:n,items:[]}));
  }
  renderMealCards();
}
function clearNutritionLog(){if(!confirm('Clear all nutrition history?'))return;saveNutLog([]);nutTodayMeals=DEFAULT_MEAL_NAMES.map(n=>({name:n,items:[]}));renderMealCards();renderNutritionCharts();renderNutritionTable();}
function nutDayTotals(entry){
  let cal=0,pro=0,carb=0,fat=0;
  (entry.meals||[]).forEach(m=>{if(m.items){m.items.forEach(i=>{cal+=i.cal||0;pro+=i.pro||0;carb+=i.carb||0;fat+=i.fat||0;});}else{cal+=m.cal||0;pro+=m.pro||0;carb+=m.carb||0;fat+=m.fat||0;}});
  return{cal,pro,carb,fat};
}
function renderNutritionCharts(){
  const log=loadNutLog().slice(-30),target=parseInt(localStorage.getItem(userKey(NUT_TARGET_KEY)))||null;
  const bwData=log.map(e=>({x:e.date,y:e.bw||null}));
  drawLineChart('nut-bw-chart',bwData,'#4fc3a1','lbs',null);
  drawMacroChart('nut-macro-chart',log,target);
}
function drawMacroChart(canvasId,log,calTarget){
  const canvas=document.getElementById(canvasId);if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const rect=canvas.getBoundingClientRect();
  const W=rect.width||600,H=220;
  canvas.width=W*2;canvas.height=H*2;ctx.scale(2,2);ctx.clearRect(0,0,W,H);
  const isDark=document.documentElement.getAttribute('data-theme')!=='light';
  const borderCol=isDark?'#2a2b32':'#d6d3cb',mutedCol='#7a7870',textCol=isDark?'#e8e6df':'#1a1a1b';
  // Build data points — only days with any data
  const pts=log.map(e=>{const t=nutDayTotals(e);return{x:e.date,cal:t.cal||null,pro:t.pro||null,carb:t.carb||null,fat:t.fat||null};}).filter(p=>p.cal||p.pro||p.carb||p.fat);
  if(!pts.length){ctx.fillStyle=mutedCol;ctx.font='10px DM Mono,monospace';ctx.textAlign='center';ctx.fillText('No data yet — add food to see trends',W/2,H/2);return;}
  const padL=40,padR=48,padT=16,padB=28,cW=W-padL-padR,cH=H-padT-padB;
  const xStep=pts.length>1?cW/(pts.length-1):0;
  // Macro scale (left axis) — pro/carb/fat in grams
  const macroVals=[...pts.flatMap(p=>[p.pro,p.carb,p.fat]).filter(v=>v!=null),0];
  const macroMax=Math.max(...macroVals)*1.15||1;
  // Calorie scale (right axis)
  const calVals=[...pts.map(p=>p.cal).filter(v=>v!=null),0];
  if(calTarget)calVals.push(calTarget);
  const calMax=Math.max(...calVals)*1.15||1;
  const mx=(v)=>v!=null?padT+cH-(v/macroMax)*cH:null;
  const cx=(v)=>v!=null?padT+cH-(v/calMax)*cH:null;
  const px=(i)=>pts.length>1?padL+i*xStep:padL+cW/2;
  // Grid lines (5)
  ctx.strokeStyle=borderCol;ctx.lineWidth=0.5;
  for(let g=0;g<=4;g++){
    const y=padT+cH-(g/4)*cH;
    ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(W-padR,y);ctx.stroke();
    if(g>0){
      // Left axis labels (macros)
      ctx.fillStyle=mutedCol;ctx.font='7px DM Mono,monospace';ctx.textAlign='right';
      ctx.fillText(Math.round(g/4*macroMax)+'g',padL-3,y+3);
      // Right axis labels (calories)
      ctx.textAlign='left';
      ctx.fillText(Math.round(g/4*calMax),W-padR+3,y+3);
    }
  }
  // Left axis label
  ctx.save();ctx.fillStyle=mutedCol;ctx.font='7px DM Mono,monospace';ctx.textAlign='center';
  ctx.translate(9,padT+cH/2);ctx.rotate(-Math.PI/2);ctx.fillText('grams',0,0);ctx.restore();
  // Right axis label
  ctx.save();ctx.fillStyle='#e8c547';ctx.font='7px DM Mono,monospace';ctx.textAlign='center';
  ctx.translate(W-10,padT+cH/2);ctx.rotate(Math.PI/2);ctx.fillText('kcal',0,0);ctx.restore();
  // Calorie target line
  if(calTarget){
    const ty=cx(calTarget);
    ctx.save();ctx.strokeStyle='rgba(232,197,71,0.4)';ctx.lineWidth=1;ctx.setLineDash([4,4]);
    ctx.beginPath();ctx.moveTo(padL,ty);ctx.lineTo(W-padR,ty);ctx.stroke();
    ctx.fillStyle='rgba(232,197,71,0.6)';ctx.font='7px DM Mono,monospace';ctx.textAlign='left';ctx.setLineDash([]);
    ctx.fillText('TARGET',padL+4,ty-3);ctx.restore();
  }
  // Draw a single multi-series line chart
  function drawSeries(getter,color,lineW,yFn){
    const valid=pts.map((p,i)=>({i,v:getter(p)})).filter(d=>d.v!=null);
    if(!valid.length)return;
    ctx.strokeStyle=color;ctx.lineWidth=lineW;ctx.setLineDash([]);
    ctx.beginPath();let first=true;
    valid.forEach(d=>{const x=px(d.i),y=yFn(d.v);if(first){ctx.moveTo(x,y);first=false;}else ctx.lineTo(x,y);});
    ctx.stroke();
    valid.forEach(d=>{ctx.beginPath();ctx.arc(px(d.i),yFn(d.v),2.5,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();});
  }
  drawSeries(p=>p.pro,'#4fc3a1',1.5,mx);
  drawSeries(p=>p.carb,'#e8843a',1.5,mx);
  drawSeries(p=>p.fat,'#a78bfa',1.5,mx);
  drawSeries(p=>p.cal,'#e8c547',2.5,cx);
  // X axis date labels (show up to 6 evenly spaced)
  ctx.fillStyle=mutedCol;ctx.font='7px DM Mono,monospace';ctx.textAlign='center';ctx.setLineDash([]);
  const step=Math.max(1,Math.ceil(pts.length/6));
  pts.forEach((p,i)=>{if(i%step===0||i===pts.length-1){const d=p.x.slice(5);ctx.fillText(d,px(i),H-6);}});
}
function renderNutritionTable(){
  const log=loadNutLog().slice().reverse().slice(0,30),target=parseInt(localStorage.getItem(userKey(NUT_TARGET_KEY)))||null;
  const el=document.getElementById('nut-log-table');if(!el)return;
  if(!log.length){el.innerHTML='<div style="padding:28px 20px;font-family:\'DM Mono\',monospace;font-size:11px;color:var(--muted);">No entries yet.</div>';return;}
  const th=s=>`<th style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);padding:8px 14px;text-align:left;font-weight:400;white-space:nowrap;">${s}</th>`;
  const td=(s,color)=>`<td style="padding:9px 14px;font-family:\'DM Mono\',monospace;font-size:12px;color:${color||'var(--text)'};">${s||'\u2014'}</td>`;
  let html=`<table style="width:100%;border-collapse:collapse;"><thead><tr style="background:var(--surface2);">${['Date','BW','Cal','Protein','Carbs','Fat','Meals'].map(th).join('')}</tr></thead><tbody>`;
  log.forEach(e=>{
    let cal=0,pro=0,carb=0,fat=0;
    (e.meals||[]).forEach(m=>{if(m.items){m.items.forEach(i=>{cal+=i.cal||0;pro+=i.pro||0;carb+=i.carb||0;fat+=i.fat||0;});}else{cal+=m.cal||0;pro+=m.pro||0;carb+=m.carb||0;fat+=m.fat||0;}});
    const calColor=target&&cal?(cal>target?'var(--accent3)':'var(--accent2)'):'var(--text)';
    const mealNames=(e.meals||[]).filter(m=>m.items?m.items.length:(m.cal||m.note)).map(m=>m.name).join(', ')||'\u2014';
    html+=`<tr style="border-bottom:1px solid var(--border);">${td(e.date,'var(--muted)')}${td(e.bw?e.bw+' lbs':null)}${td(cal?cal+' kcal':null,calColor)}${td(pro?pro+'g':null)}${td(carb?carb+'g':null)}${td(fat?fat+'g':null)}<td style="padding:9px 14px;font-size:11px;color:var(--muted);">${mealNames}</td></tr>`;
  });
  html+='</tbody></table>';el.innerHTML=html;
}
function drawLineChart(canvasId,rawData,color,unit,targetVal){
  const canvas=document.getElementById(canvasId);if(!canvas)return;
  const ctx=canvas.getContext('2d');const rect=canvas.getBoundingClientRect();
  const W=rect.width||300,H=160;canvas.width=W*2;canvas.height=H*2;ctx.scale(2,2);ctx.clearRect(0,0,W,H);
  const pts=rawData.filter(d=>d.y!=null);
  const isDark=document.documentElement.getAttribute('data-theme')!=='light';
  const borderCol=isDark?'#2a2b32':'#d6d3cb',mutedCol='#7a7870',textCol=isDark?'#e8e6df':'#1a1a1b';
  if(!pts.length){ctx.fillStyle=mutedCol;ctx.font='10px DM Mono,monospace';ctx.textAlign='center';ctx.fillText('No data yet',W/2,H/2);return;}
  const padL=38,padR=12,padT=14,padB=22,cW=W-padL-padR,cH=H-padT-padB;
  const vals=pts.map(d=>d.y),minV=Math.min(...vals)*0.97,maxV=Math.max(...vals)*1.03||1,range=maxV-minV||1;
  const xStep=pts.length>1?cW/(pts.length-1):0;
  ctx.strokeStyle=borderCol;ctx.lineWidth=0.5;
  for(let g=0;g<=4;g++){const y=padT+cH-(g/4)*cH;ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(W-padR,y);ctx.stroke();if(g>0){ctx.fillStyle=mutedCol;ctx.font='7px DM Mono,monospace';ctx.textAlign='right';ctx.fillText(Math.round(minV+(g/4)*range),padL-3,y+3);}}
  if(targetVal&&targetVal>=minV&&targetVal<=maxV*1.1){const ty=padT+cH-((targetVal-minV)/range)*cH;ctx.save();ctx.strokeStyle='rgba(232,197,71,0.45)';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(padL,ty);ctx.lineTo(W-padR,ty);ctx.stroke();ctx.fillStyle='rgba(232,197,71,0.7)';ctx.font='7px DM Mono,monospace';ctx.textAlign='left';ctx.fillText('TARGET',padL+4,ty-3);ctx.restore();}
  ctx.save();ctx.beginPath();pts.forEach((d,i)=>{const x=padL+i*xStep,y=padT+cH-((d.y-minV)/range)*cH;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});ctx.lineTo(padL+(pts.length-1)*xStep,padT+cH);ctx.lineTo(padL,padT+cH);ctx.closePath();ctx.fillStyle=color==='#4fc3a1'?'rgba(79,195,161,0.10)':'rgba(232,197,71,0.08)';ctx.fill();ctx.restore();
  ctx.strokeStyle=color;ctx.lineWidth=2;ctx.setLineDash([]);ctx.beginPath();pts.forEach((d,i)=>{const x=padL+i*xStep,y=padT+cH-((d.y-minV)/range)*cH;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});ctx.stroke();
  pts.forEach((d,i)=>{const x=padL+i*xStep,y=padT+cH-((d.y-minV)/range)*cH;ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();});
  const last=pts[pts.length-1];const lx=padL+(pts.length-1)*xStep,ly=padT+cH-((last.y-minV)/range)*cH;ctx.fillStyle=textCol;ctx.font='bold 9px DM Mono,monospace';ctx.textAlign='right';ctx.fillText(`${last.y} ${unit}`,Math.min(lx+2,W-padR),Math.max(ly-7,padT+10));
  if(pts.length>=2){ctx.fillStyle=mutedCol;ctx.font='7px DM Mono,monospace';ctx.textAlign='left';ctx.fillText(pts[0].x.slice(5),padL,H-4);ctx.textAlign='right';ctx.fillText(pts[pts.length-1].x.slice(5),W-padR,H-4);}
}

