// CCNA Arabic Interactive Learning SPA
// Note: This app ships with sample content only. Add your own lesson content and question bank JSON.

/* Globals */
const APP_STATE = {
  lessons: [],
  questionsBank: [],
  glossary: [],
  user: {
    name: "متعلم",
    xp: 0,
    completedLessonIds: [],
    badges: [],
    recent: [],
  },
};

const STORAGE_KEYS = {
  user: "ccna_user_state_v1",
  notes: "ccna_notes_v1",
};

function saveUser() {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(APP_STATE.user));
}
function loadUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.user);
  if (raw) {
    try { APP_STATE.user = JSON.parse(raw); } catch {}
  }
}

function addRecent(activity) {
  APP_STATE.user.recent.unshift({ activity, at: new Date().toISOString() });
  APP_STATE.user.recent = APP_STATE.user.recent.slice(0, 8);
  saveUser();
}

/* UI helpers */
function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }
function el(tag, cls){ const e = document.createElement(tag); if(cls) e.className = cls; return e; }
function html(strings, ...vals){ return strings.reduce((a,s,i)=> a + s + (vals[i] ?? ''), ''); }

/* Particles background */
async function initParticles(){
  if (!window.tsParticles) return;
  await tsParticles.load({ id: "tsparticles", options: {
    background: { color: { value: "transparent" } },
    fullScreen: { enable: false },
    fpsLimit: 60,
    particles: {
      number: { value: 60 },
      color: { value: ["#61dafb", "#8a64ff", "#3ddc97"] },
      links: { enable: true, distance: 140, opacity: 0.4, color: "#9fb0cb" },
      move: { enable: true, speed: 1.1 },
      size: { value: { min: 1, max: 3 } },
      opacity: { value: 0.6 }
    },
    interactivity: {
      events: { onHover: { enable: true, mode: "grab" } },
      modes: { grab: { distance: 140, links: { opacity: 0.6 } } }
    }
  }});
}

/* Navigation */
function initNav(){
  qsa('.nav-btn, .cta').forEach(btn => {
    btn.addEventListener('click', () => showView(btn.dataset.target));
  });
}
function showView(id){
  if(!id) return;
  qsa('.view').forEach(v => v.classList.add('hidden'));
  const target = qs('#' + id);
  if (target){ target.classList.remove('hidden'); window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' }); }
}

/* Dashboard */
function refreshDashboard(){
  const done = APP_STATE.user.completedLessonIds.length;
  const total = APP_STATE.lessons.length || 1;
  const pct = Math.round((done/total)*100);
  qs('#overall-progress').style.width = pct + '%';
  qs('#lessons-done').textContent = String(done);
  qs('#xp-points').textContent = String(APP_STATE.user.xp);
  const level = getLevel(APP_STATE.user.xp);
  qs('#level-label').textContent = level;

  const badges = computeBadges(APP_STATE.user.xp, done);
  APP_STATE.user.badges = badges;
  const badgesContainer = qs('#badges');
  badgesContainer.innerHTML = '';
  badges.forEach(b => {
    const span = el('span', 'badge'); span.textContent = b; badgesContainer.appendChild(span);
  });

  const ul = qs('#recent-activity');
  ul.innerHTML = '';
  APP_STATE.user.recent.forEach(r => {
    const li = el('li');
    const d = new Date(r.at);
    li.textContent = `${r.activity} — ${d.toLocaleString('ar-EG')}`;
    ul.appendChild(li);
  });
  saveUser();
}

function getLevel(xp){
  if (xp >= 800) return 'CCNA Master';
  if (xp >= 500) return 'Pro';
  if (xp >= 250) return 'Intermediate';
  return 'Beginner';
}
function computeBadges(xp, lessonsDone){
  const badges = [];
  if (lessonsDone >= 1) badges.push('🎯 أول إنجاز');
  if (xp >= 100) badges.push('🥉 Beginner');
  if (xp >= 250) badges.push('🥈 Intermediate');
  if (xp >= 500) badges.push('🥇 Pro');
  if (xp >= 800) badges.push('👑 CCNA Master');
  return badges;
}

/* Lessons */
async function loadSampleLessons(){
  try{
    const res = await fetch('./assets/data/lessons.sample.json');
    APP_STATE.lessons = await res.json();
  }catch{
    APP_STATE.lessons = [
      { id: 'ch1-l1', title: 'مقدمة في الشبكات', content: 'مفاهيم أساسية عن الشبكات وأنواعها وأهداف CCNA.', quiz:[
        { q:'الشبكة هي اتصال بين أكثر من جهاز لتبادل البيانات.', choices:['صح','خطأ'], answer:0, explain:'تعريف الشبكة.' },
        { q:'طبقة الربط مسؤولة عن التوجيه بين الشبكات.', choices:['صح','خطأ'], answer:1, explain:'التوجيه في طبقة الشبكة.' },
        { q:'المبدل Switch يعمل غالباً في الطبقة الثانية.', choices:['صح','خطأ'], answer:0, explain:'Switch في Layer 2.' },
      ]},
      { id: 'ch1-l2', title: 'نموذج OSI', content: 'الطبقات السبع ووظائف كل طبقة.', quiz:[
        { q:'طبقة النقل مسؤولة عن TCP/UDP.', choices:['صح','خطأ'], answer:0, explain:'نعم، Ports وReliability.' },
        { q:'DNS يعمل غالباً في طبقة الربط.', choices:['صح','خطأ'], answer:1, explain:'DNS في طبقة التطبيق.' },
        { q:'ARP يربط بين IP و MAC.', choices:['صح','خطأ'], answer:0, explain:'صحيح.' },
      ]},
    ];
  }
}

function renderLessonsList(){
  const list = qs('#lessons-list');
  list.innerHTML = '';
  APP_STATE.lessons.forEach(lesson => {
    const item = el('div','item');
    const left = el('div');
    const title = el('div'); title.textContent = lesson.title;
    const info = el('div'); info.className = 'muted'; info.textContent = lesson.content.slice(0, 80) + '...';
    left.appendChild(title); left.appendChild(info);
    const right = el('div');
    const checkbox = el('input'); checkbox.type = 'checkbox'; checkbox.checked = APP_STATE.user.completedLessonIds.includes(lesson.id);
    checkbox.addEventListener('change', () => {
      toggleLessonDone(lesson.id, checkbox.checked);
    });
    const openBtn = el('button'); openBtn.textContent = 'فتح'; openBtn.addEventListener('click', () => openLesson(lesson));
    right.appendChild(checkbox); right.appendChild(openBtn);
    item.appendChild(left); item.appendChild(right);
    list.appendChild(item);
  });
}

function toggleLessonDone(id, checked){
  const set = new Set(APP_STATE.user.completedLessonIds);
  if (checked) { set.add(id); addXP(10); addRecent('أنهيت درساً'); }
  else set.delete(id);
  APP_STATE.user.completedLessonIds = Array.from(set);
  saveUser();
  refreshDashboard();
}

function openLesson(lesson){
  const box = qs('#lesson-detail');
  box.innerHTML = '';
  const title = el('h3'); title.textContent = lesson.title;
  const p = el('p'); p.textContent = lesson.content;
  const audioBtn = el('button'); audioBtn.className = 'cta ghost'; audioBtn.textContent = 'ملخص صوتي قصير';
  audioBtn.addEventListener('click', ()=> speak(`${lesson.title}. ${lesson.content}`));
  const quiz = renderQuiz(lesson.quiz, result => {
    const correct = result.correctCount;
    const gained = correct * 15;
    addXP(gained);
    addRecent(`أنهيت اختبار الدرس (${correct}/${result.total})`);
    refreshDashboard();
  }, { review: true });
  box.appendChild(title); box.appendChild(p); box.appendChild(audioBtn); box.appendChild(quiz);
}

/* Quick Revision */
function renderQuickRevision(){
  const car = qs('#quick-carousel');
  car.innerHTML = '';
  const slides = [
    { t:'Subnetting في لقطة', b:'تذكر الصيغة: 2^n - 2 للمضيفين القابلين للاستخدام' },
    { t:'OSI Model', b:'اربط البروتوكولات بكل طبقة بسرعة (HTTP/TLS/TCP/IP/ARP/ETH)' },
    { t:'Routing Basics', b:'Static vs Dynamic: RIP/OSPF/EIGRP؛ حالات OSPF' },
    { t:'Switching', b:'VLANs, Trunking 802.1Q, STP/RSTP' },
  ];
  slides.forEach(s => {
    const div = el('div','slide');
    const h = el('h4'); h.textContent = s.t; const p = el('p'); p.textContent = s.b;
    div.appendChild(h); div.appendChild(p); car.appendChild(div);
  });
}

/* Interactive Lab */
function initLabHotspots(){
  qsa('.hotspot').forEach(h => {
    h.addEventListener('click', () => {
      const specs = JSON.parse(h.dataset.specs || '{}');
      const panel = qs('#device-panel');
      panel.innerHTML = `<h3>${specs.name || 'جهاز'}</h3><p>المنافذ: ${specs.ports||'-'}</p><p>الدور: ${specs.role||'-'}</p><h4>أوامر CLI أساسية</h4><ul><li>show ip interface brief</li><li>show version</li><li>configure terminal</li><li>interface g0/0/0</li><li>ip address 10.0.0.1 255.255.255.0</li><li>no shutdown</li></ul>`;
    });
  });
}

/* Games */
function renderGames(){
  // True/False
  const tf = qs('#tf-game');
  tf.innerHTML = '';
  const tfData = [
    { s:'TCP بروتوكول موثوق.', a:true },
    { s:'HTTP يعمل في طبقة النقل.', a:false },
    { s:'Switch يعمل غالباً على MAC.', a:true },
  ];
  const tfIndex = { i: 0, score: 0 };
  const tfQ = el('div'); const tfBtns = el('div');
  const tUpdate = () => { tfQ.textContent = tfData[tfIndex.i].s; };
  const answer = (val) => { if(tfData[tfIndex.i].a === val){ tfIndex.score++; addXP(5); } tfIndex.i = (tfIndex.i+1)%tfData.length; tUpdate(); refreshDashboard(); };
  const bT = el('button'); bT.textContent = 'صح'; bT.onclick = () => answer(true);
  const bF = el('button'); bF.textContent = 'خطأ'; bF.onclick = () => answer(false);
  tfBtns.appendChild(bT); tfBtns.appendChild(bF); tf.appendChild(tfQ); tf.appendChild(tfBtns); tUpdate();

  // Guess the protocol
  const guess = qs('#guess-game'); guess.innerHTML = '';
  const items = [
    { name:'DNS', hints:['طبقة التطبيق','منفذ 53','ترجمة الأسماء'] },
    { name:'OSPF', hints:['بروتوكول توجيه','Link-State','Area 0'] },
    { name:'DHCP', hints:['تهيئة عناوين','DORA','منفذ 67/68'] },
  ];
  let gi = 0, hi = 0; const gh = el('div'); const giInput = el('input'); giInput.placeholder = 'من البروتوكول؟';
  const nextHint = () => { gh.textContent = items[gi].hints[hi]; hi = (hi+1) % items[gi].hints.length; };
  const check = () => { if(giInput.value.trim().toUpperCase() === items[gi].name){ addXP(20); addRecent('عرفت البروتوكول بشكل صحيح'); gi=(gi+1)%items.length; hi=0; giInput.value=''; confetti?.({ particleCount: 80, spread: 70 }); } nextHint(); refreshDashboard(); };
  const btnH = el('button'); btnH.textContent = 'تلميح'; btnH.onclick = nextHint;
  const btnC = el('button'); btnC.textContent = 'تحقق'; btnC.onclick = check;
  guess.appendChild(gh); guess.appendChild(giInput); guess.appendChild(btnH); guess.appendChild(btnC); nextHint();

  // Match game (Drag & Drop)
  const match = qs('#match-game'); match.innerHTML = '';
  const protocols = [
    { id:'HTTP', layer:'Application' },{ id:'TLS', layer:'Application' },{ id:'TCP', layer:'Transport' },{ id:'UDP', layer:'Transport' },{ id:'IP', layer:'Network' },{ id:'ARP', layer:'Network' },{ id:'Ethernet', layer:'Data Link' }
  ];
  const layers = ['Application','Transport','Network','Data Link'];
  const row = el('div'); row.style.display='grid'; row.style.gridTemplateColumns='1fr 1fr'; row.style.gap='8px';
  const left = el('div'); const right = el('div');
  // Draggables
  protocols.forEach(p => {
    const b = el('button'); b.textContent = p.id; b.draggable = true; b.dataset.id = p.id; b.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', p.id)); left.appendChild(b);
  });
  // Drop zones
  layers.forEach(layer => {
    const z = el('div','card'); z.textContent = layer; z.dataset.layer = layer; z.style.minHeight='60px'; z.addEventListener('dragover', e=>e.preventDefault()); z.addEventListener('drop', e=>{
      e.preventDefault(); const id = e.dataTransfer.getData('text/plain');
      const p = protocols.find(x=>x.id===id); const ok = p && p.layer===layer; const tag = el('span'); tag.textContent = id; tag.className = 'badge'; tag.style.marginInline='6px';
      if(ok){ addXP(6); z.appendChild(tag); } else { z.appendChild(tag); tag.style.background='rgba(255,107,107,0.3)'; }
      refreshDashboard();
    }); right.appendChild(z);
  });
  row.appendChild(left); row.appendChild(right); match.appendChild(row);
}

/* Quiz Renderer */
function renderQuiz(questions, onDone, { review=false }={}){
  const wrap = el('div','quiz');
  let score = 0; let answered = 0;
  questions.forEach((qq, idx) => {
    const q = el('div','q');
    const t = el('div'); t.textContent = `${idx+1}. ${qq.q}`; q.appendChild(t);
    const choices = el('div','choices');
    qq.choices.forEach((c, i) => {
      const btn = el('button'); btn.textContent = c;
      btn.addEventListener('click', () => {
        if (i === qq.answer){
          score++; btn.classList.add('correct'); addXP(5);
        } else { btn.classList.add('wrong'); }
        answered++;
        if (review){ const ex = el('div'); ex.textContent = 'التفسير: ' + (qq.explain || ''); q.appendChild(ex); }
        if (answered === questions.length){ onDone?.({ correctCount: score, total: questions.length }); }
        refreshDashboard();
      }, { once: true });
      choices.appendChild(btn);
    });
    q.appendChild(choices); wrap.appendChild(q);
  });
  return wrap;
}

/* Bank of Questions */
async function loadSampleBank(){
  try{
    const res = await fetch('./assets/data/questions.sample.json');
    APP_STATE.questionsBank = await res.json();
  }catch{
    APP_STATE.questionsBank = [
      { q:'أي طبقة مسؤولة عن التوجيه؟', choices:['التطبيق','النقل','الشبكة','الربط'], answer:2, explain:'طبقة الشبكة' },
      { q:'منفذ HTTPS الافتراضي؟', choices:['80','22','443','53'], answer:2, explain:'443' },
      { q:'بروتوكول يتيح العناوين ديناميكياً؟', choices:['DNS','DHCP','ARP','ICMP'], answer:1, explain:'DHCP' },
      { q:'الطبقة التي تتعامل مع MAC؟', choices:['الشبكة','الربط','التطبيق','المادية'], answer:1, explain:'Data Link' },
      { q:'ICMP يستخدم عادة لأوامر؟', choices:['Ping/Traceroute','FTP','SSH','SMTP'], answer:0, explain:'Echo/Time Exceeded' },
      { q:'RIP يستخدم أي مقياس؟', choices:['Bandwidth','Delay','Hop Count','Cost'], answer:2, explain:'Hop Count' },
      { q:'OSPF نوعه؟', choices:['Distance Vector','Link State','Hybrid','Static'], answer:1, explain:'LS' },
      { q:'عنوان خاص؟', choices:['8.8.8.8','172.16.5.1','1.1.1.1','23.23.23.23'], answer:1, explain:'172.16.0.0/12' },
      { q:'طبقة التشفير TLS؟', choices:['تطبيق','نقل','شبكة','ربط'], answer:0, explain:'يُعتبر ضمن التطبيق' },
      { q:'أداة محاكاة شهيرة؟', choices:['GNS3','Photoshop','Blender','Figma'], answer:0, explain:'GNS3/Packet Tracer' },
    ];
  }
}

function startBankQuiz(count = 10){
  const pool = [...APP_STATE.questionsBank];
  pool.sort(()=> Math.random()-0.5);
  const pick = pool.slice(0, count);
  const mount = qs('#bank-quiz'); mount.innerHTML = '';
  const quiz = renderQuiz(pick, ({correctCount, total}) => {
    addXP(correctCount * 10);
    addRecent(`أنهيت بنك الأسئلة (${correctCount}/${total})`);
    refreshDashboard();
  }, { review: true });
  mount.appendChild(quiz);
}

function initBankControls(){
  qs('#start-bank').addEventListener('click', ()=> startBankQuiz(10));
  qs('#upload-bank').addEventListener('change', async (e) => {
    const file = e.target.files?.[0]; if(!file) return;
    try{
      const text = await file.text(); const data = JSON.parse(text);
      if(Array.isArray(data) && data.length){ APP_STATE.questionsBank = data; addRecent(`تم استيراد ${data.length} سؤالاً`); refreshDashboard(); }
    }catch{ alert('JSON غير صالح'); }
  });
}

/* Scenarios */
function renderScenarios(){
  const scenarios = [
    { id:'s1', t:'شركة بثلاثة فروع تحتاج ربط VPN', a:'Site-to-Site IPsec, IKEv2, OSPF over tunnels' },
    { id:'s2', t:'تقسيم شبكة قسمين باستخدام VLANs', a:'Create VLAN10/20, assign ports, trunk uplink, inter-VLAN via router-on-a-stick' },
    { id:'s3', t:'عطل في STP loop', a:'Identify root bridge, adjust priority, enable BPDU Guard/Root Guard' },
  ];
  const list = qs('#scenarios-list'); list.innerHTML = '';
  scenarios.forEach(s => {
    const item = el('div','item');
    const left = el('div'); left.innerHTML = `<div>${s.t}</div><small class="muted">قدّم خطوات الحل</small>`;
    const right = el('div');
    const input = el('input'); input.placeholder = 'خطواتك المختصرة...';
    const btn = el('button'); btn.textContent = 'تحقق'; btn.onclick = ()=>{
      addRecent('قدمت حلاً لسيناريو');
      addXP(20);
      alert('حل نموذجي: ' + s.a);
      refreshDashboard();
    };
    right.appendChild(input); right.appendChild(btn);
    item.appendChild(left); item.appendChild(right); list.appendChild(item);
  });
}

/* Notes */
function loadNotes(){
  try{ return JSON.parse(localStorage.getItem(STORAGE_KEYS.notes) || '[]'); }catch{ return []; }
}
function saveNotes(notes){ localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notes)); }
function renderNotes(){
  const notes = loadNotes();
  const grid = qs('#notes-list'); grid.innerHTML = '';
  notes.forEach((n, idx) => {
    const card = el('div','note');
    const h = el('h4'); h.textContent = n.title; const p = el('p'); p.textContent = n.body;
    const row = el('div');
    const del = el('button'); del.textContent = 'حذف'; del.onclick = ()=>{ notes.splice(idx,1); saveNotes(notes); renderNotes(); };
    row.appendChild(del);
    card.appendChild(h); card.appendChild(p); card.appendChild(row);
    grid.appendChild(card);
  });
}
function initNotes(){
  qs('#add-note').addEventListener('click', ()=>{
    const title = qs('#note-title').value.trim(); const body = qs('#note-body').value.trim();
    if(!title || !body) return;
    const notes = loadNotes(); notes.unshift({ title, body, at: Date.now() }); saveNotes(notes);
    qs('#note-title').value=''; qs('#note-body').value='';
    addRecent('أضفت ملاحظة'); addXP(5); refreshDashboard(); renderNotes();
  });
  renderNotes();
}

/* Flashcards */
function renderFlashcards(){
  const data = [
    { q:'ما هو DHCP؟', a:'بروتوكول تخصيص عناوين IP ديناميكياً (DORA)' },
    { q:'ما وظيفة ARP؟', a:'يربط IP بـ MAC داخل الشبكة المحلية' },
    { q:'OSI Layer 4؟', a:'النقل — TCP/UDP، المنافذ، التحكم بالتدفق' },
  ];
  const grid = qs('#flashcards-grid'); grid.innerHTML = '';
  data.forEach(d => {
    const card = el('div','flashcard'); const inner = el('div','flashcard-inner');
    const front = el('div','flashcard-face front'); front.textContent = d.q;
    const back = el('div','flashcard-face back'); back.textContent = d.a;
    inner.appendChild(front); inner.appendChild(back); card.appendChild(inner);
    card.addEventListener('click', ()=> card.classList.toggle('flipped'));
    grid.appendChild(card);
  });
}

/* Audio Summaries using SpeechSynthesis */
function speak(text){
  if (!('speechSynthesis' in window)) return alert('المتصفح لا يدعم الصوت');
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ar-EG';
  window.speechSynthesis.speak(u);
}

/* Mindmap (SVG) */
function renderMindmap(){
  const mount = qs('#mindmap-svg'); mount.innerHTML = '';
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('width','100%'); svg.setAttribute('height','360');
  const layers = ['Application','Presentation','Session','Transport','Network','Data Link','Physical'];
  layers.forEach((name, idx) => {
    const y = 40 + idx*42; const x = 120 + (idx%2)*140;
    const rect = document.createElementNS(svgNS,'rect'); rect.setAttribute('x', x); rect.setAttribute('y', y); rect.setAttribute('rx','10'); rect.setAttribute('ry','10'); rect.setAttribute('width','180'); rect.setAttribute('height','30'); rect.setAttribute('fill','rgba(255,255,255,0.08)'); rect.setAttribute('stroke','rgba(255,255,255,0.2)');
    const text = document.createElementNS(svgNS,'text'); text.setAttribute('x', x+90); text.setAttribute('y', y+20); text.setAttribute('fill','#eaf2ff'); text.setAttribute('text-anchor','middle'); text.textContent = name;
    rect.addEventListener('click', ()=> speak(`${name} Layer`));
    svg.appendChild(rect); svg.appendChild(text);
  });
  mount.appendChild(svg);
}

/* Exams */
function initExams(){
  qs('#start-mid').addEventListener('click', ()=> mountExam('#mid-exam', 15));
  qs('#start-final').addEventListener('click', ()=> mountExam('#final-exam', 30));
}
function mountExam(sel, count){
  const mount = qs(sel); mount.innerHTML='';
  const pool = [...APP_STATE.questionsBank]; pool.sort(()=> Math.random()-0.5);
  const quiz = renderQuiz(pool.slice(0,count), ({correctCount, total}) => {
    const score = Math.round((correctCount/total)*100);
    addXP(score);
    addRecent(`انتهيت من امتحان (${score}%)`);
    refreshDashboard();
  }, { review: true });
  mount.appendChild(quiz);
}

/* Certificate */
function initCertificate(){
  const input = qs('#cert-name'); const btn = qs('#generate-cert'); const canvas = qs('#cert-preview'); const ctx = canvas.getContext('2d');
  function drawPreview(name){
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.fillStyle = '#0b1020'; ctx.fillRect(0,0,canvas.width,canvas.height);
    const grd = ctx.createLinearGradient(0,0,800,0); grd.addColorStop(0,'#61dafb'); grd.addColorStop(1,'#8a64ff');
    ctx.strokeStyle = grd; ctx.lineWidth = 8; ctx.strokeRect(20,20,760,460);
    ctx.fillStyle = '#eaf2ff'; ctx.font = '28px Cairo'; ctx.fillText('شهادة إتمام', 320, 90);
    ctx.font = '20px Cairo'; ctx.fillText('هذه الشهادة تُمنح إلى:', 320, 140);
    ctx.font = '30px Cairo'; ctx.fillText(name || 'اسم المتعلم', 320, 190);
    ctx.font = '18px Cairo'; ctx.fillText('لاستكمال منصة CCNA التفاعلية وتحقيق نتائج مميزة', 240, 240);
    ctx.font = '16px Cairo'; const xp = APP_STATE.user.xp; ctx.fillText(`XP: ${xp} — المستوى: ${getLevel(xp)}`, 280, 290);
    ctx.font = '14px Cairo'; ctx.fillText(new Date().toLocaleDateString('ar-EG'), 360, 340);
  }
  drawPreview('');
  input.addEventListener('input', ()=> drawPreview(input.value));
  btn.addEventListener('click', async ()=>{
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) return alert('مكتبة الشهادة غير متاحة');
    const pdf = new jsPDF({ orientation:'landscape', unit:'px', format:[800,500] });
    const dataUrl = canvas.toDataURL('image/png');
    pdf.addImage(dataUrl, 'PNG', 0, 0, 800, 500);
    pdf.save('CCNA-Certificate.pdf');
    confetti?.({ particleCount: 160, spread: 80 });
    addRecent('ولّدت شهادة PDF'); addXP(30); refreshDashboard();
  });
}

/* Glossary */
async function loadSampleGlossary(){
  try{
    const res = await fetch('./assets/data/glossary.sample.json');
    APP_STATE.glossary = await res.json();
  }catch{
    APP_STATE.glossary = [
      { term:'IP', def:'بروتوكول الإنترنت لتوجيه الحزم بين الشبكات' },
      { term:'MAC', def:'عنوان الطبقة الثانية لتعريف الأجهزة' },
      { term:'NAT', def:'ترجمة عناوين الشبكة بين خاص وعام' },
    ];
  }
}
function renderGlossary(){
  const list = qs('#glossary-list'); const input = qs('#glossary-search');
  function draw(){
    const q = (input.value||'').toLowerCase();
    list.innerHTML = '';
    APP_STATE.glossary.filter(g=> g.term.toLowerCase().includes(q) || g.def.toLowerCase().includes(q)).forEach(g => {
      const item = el('div','item');
      item.innerHTML = `<div><strong>${g.term}</strong><div class="muted">${g.def}</div></div>`;
      list.appendChild(item);
    });
  }
  input.addEventListener('input', draw); draw();
}

/* Leaderboard (local) */
function renderLeaderboard(){
  const list = qs('#leaderboard-list');
  list.innerHTML = '';
  const me = { name: APP_STATE.user.name || 'أنت', xp: APP_STATE.user.xp, level: getLevel(APP_STATE.user.xp) };
  const rows = [me];
  rows.forEach((r, i) => {
    const item = el('div','item');
    item.innerHTML = `<div>#${i+1} — ${r.name}</div><div>XP: ${r.xp} — ${r.level}</div>`;
    list.appendChild(item);
  });
}

/* Utilities */
function addXP(amount){ APP_STATE.user.xp += amount; saveUser(); }

/* Boot */
async function boot(){
  loadUser();
  await initParticles();
  await Promise.all([loadSampleLessons(), loadSampleBank(), loadSampleGlossary()]);
  initNav();
  initLabHotspots();
  initBankControls();
  initNotes();
  initExams();
  initCertificate();
  renderLessonsList();
  renderQuickRevision();
  renderGames();
  renderFlashcards();
  renderMindmap();
  renderGlossary();
  renderScenarios();
  renderLeaderboard();
  refreshDashboard();
}

window.addEventListener('DOMContentLoaded', boot);

