// THEME
function setTheme(t){document.documentElement.setAttribute('data-theme',t);document.getElementById('theme-select').value=t;try{localStorage.setItem('kc_theme',t);}catch(e){}}
(function(){try{setTheme(localStorage.getItem('kc_theme')||'dark');}catch(e){setTheme('dark');}})();

// ── AUTH ──────────────────────────────────────────────────────────────────
let currentRole=null, currentView='member', memberName='';
let currentUsername=''; // set on login, used to namespace all localStorage keys

// All storage goes through userKey() so accounts never share data
function userKey(k){return currentUsername?`u_${currentUsername}_${k}`:k;}

function doLogin() {
  const uEl=document.getElementById('login-username');
  const pEl=document.getElementById('login-password');
  const err=document.getElementById('login-error');
  const u=uEl.value.trim().toLowerCase(), pw=pEl.value;
  const hc={admin:{password:'olylift',role:'admin'},member:{password:'olylift',role:'member'}};
  let userData=null;
  if(hc[u]&&hc[u].password===pw){
    userData={role:hc[u].role,username:u,name:u==='admin'?'Admin':''};
  } else {
    const reg=(()=>{try{return JSON.parse(localStorage.getItem('kc_users')||'{}');}catch(e){return{};}})();
    if(reg[u]&&reg[u].password===pw) userData={role:'member',username:u,name:reg[u].name||u};
  }
  if(userData){
    currentRole=userData.role;
    currentUsername=u;
    sessionStorage.setItem('kc_role',currentRole);
    sessionStorage.setItem('kc_username',u);
    document.getElementById('login-gate').classList.add('hidden');
    err.style.color='var(--accent3)';
    if(currentRole==='admin'){memberName='';requestAnimationFrame(()=>requestAnimationFrame(()=>initApp()));return;}
    try{memberName=localStorage.getItem('kc_name_'+u)||userData.name||'';}catch(e){}
    requestAnimationFrame(()=>requestAnimationFrame(()=>{if(!memberName){showNameModal();return;}initApp();}));
  } else {
    err.textContent='Invalid username or password';err.style.color='var(--accent3)';
    pEl.classList.add('error');pEl.value='';setTimeout(()=>pEl.classList.remove('error'),400);
  }
}

function showNameModal(){setTimeout(()=>{document.getElementById('name-modal-overlay').classList.add('open');setTimeout(()=>document.getElementById('name-modal-input').focus(),100);},80);}
function saveMemberName(){
  const val=document.getElementById('name-modal-input').value.trim();
  const u=sessionStorage.getItem('kc_username')||'member';
  if(val){memberName=val;try{localStorage.setItem('kc_name_'+u,val);}catch(e){}}
  document.getElementById('name-modal-overlay').classList.remove('open');initApp();
}
function skipMemberName(){memberName='';document.getElementById('name-modal-overlay').classList.remove('open');initApp();}
function doLogout(){
  sessionStorage.removeItem('kc_role');sessionStorage.removeItem('kc_username');
  currentRole=null;currentView='member';memberName='';nutActiveDate='';currentUsername='';
  document.getElementById('login-gate').classList.remove('hidden');
  document.getElementById('admin-bar').classList.remove('visible');
  document.getElementById('member-bar').classList.remove('visible');
  const pill=document.getElementById('member-name-pill');
  if(pill){pill.classList.remove('visible');pill.textContent='';}
}

// Signup
document.addEventListener('DOMContentLoaded',()=>{
  ['login-username','login-password'].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});});
  const nmi=document.getElementById('name-modal-input');if(nmi)nmi.addEventListener('keydown',e=>{if(e.key==='Enter')saveMemberName();});  const r=sessionStorage.getItem('kc_role'),u=sessionStorage.getItem('kc_username')||'';
  if(r){
    currentRole=r;currentUsername=u;document.getElementById('login-gate').classList.add('hidden');
    if(currentRole==='member'&&u){try{memberName=localStorage.getItem('kc_name_'+u)||'';}catch(e){}}
    initApp();
  }
  try{const unit=localStorage.getItem(userKey('kiloclub_unit'));if(unit)document.getElementById('unit-select').value=unit;}catch(e){}
});

function initApp(){
  if(currentRole==='admin'){document.getElementById('admin-bar').classList.add('visible');document.getElementById('member-bar').classList.remove('visible');}
  else{document.getElementById('admin-bar').classList.remove('visible');document.getElementById('member-bar').classList.add('visible');const n=document.getElementById('member-bar-name-text');if(n)n.textContent=memberName||'Member';}
  currentView=(currentRole==='admin')?'admin':'member';updateViewButtons();updateViewLabels();loadView();
}
function switchView(v){currentView=v;updateViewButtons();updateViewLabels();loadView();}
function updateViewButtons(){
  document.getElementById('btn-member-view').classList.toggle('active',currentView==='member');
  document.getElementById('btn-admin-view').classList.toggle('active',currentView==='admin');
  const nb=document.getElementById('btn-nutrition-view');if(nb)nb.classList.toggle('active',currentView==='nutrition');
}
function updateViewLabels(){
  const heroLabel=document.getElementById('hero-label');
  const namePill=document.getElementById('member-name-pill');
  const greeting=document.getElementById('member-greeting');
  const hero=document.querySelector('.hero');
  const rmPanel=document.querySelector('.rm-panel');
  const programBody=document.getElementById('program-body');
  const footer=document.querySelector('footer');
  const nutPanel=document.getElementById('nutrition-panel');
  const showProg=currentView!=='nutrition';
  if(hero)hero.style.display=showProg?'':'none';
  if(rmPanel)rmPanel.style.display=showProg?'':'none';
  if(programBody)programBody.style.display=showProg?'':'none';
  if(footer)footer.style.display=showProg?'':'none';
  if(nutPanel)nutPanel.style.display=currentView==='nutrition'?'block':'none';
  // Member bar navigation button visibility
  const nutBtn=document.getElementById('member-nutrition-btn');
  const progBtn=document.getElementById('member-program-btn');
  if(currentRole==='member'){
    if(nutBtn)nutBtn.style.display=currentView==='nutrition'?'none':'inline-block';
    if(progBtn)progBtn.style.display=currentView==='nutrition'?'inline-block':'none';
  }
  if(currentView==='admin'){
    if(heroLabel)heroLabel.textContent='Crossfit Crumville Kilo Club \u00b7 Competitor Program';
    if(namePill)namePill.classList.remove('visible');
    if(greeting)greeting.innerHTML='';
  } else if(currentView==='nutrition'){
    if(greeting)greeting.innerHTML='';
  } else {
    if(heroLabel)heroLabel.textContent='Crossfit Crumville Kilo Club \u00b7 Class Program';
    if(namePill&&memberName){namePill.textContent=memberName;namePill.classList.add('visible');}
    if(greeting&&memberName&&currentRole==='admin')greeting.innerHTML=`Viewing: <strong>${memberName}</strong>`;
  }
}

