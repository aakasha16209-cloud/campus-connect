/* CampusConnect – vanilla JS single-page app. Data lives in localStorage. */
const CATS = {'Water Supply':'💧','Drinking Water':'🚰','Toilets & Cleanliness':'🚻','Electricity':'⚡','Wi-Fi & Internet':'📶','Classrooms':'🏫','Transportation':'🚌','Canteen & Food':'🍽️'};
const LOCS = ['Main Block','CSE Block','Library','Hostel A','Hostel B','Canteen','Bus Bay','Sports Ground'];
const STATUS = ['Pending','In Progress','Resolved'];
const ADMIN_PIN = 'admin123'; // demo only – front-end PINs are not real security
const MENU = [['Veg Meals',60,1],['Chicken Biryani',90,0],['Masala Dosa',40,1],['Samosa (2 pcs)',15,1],['Fresh Juice',30,1],['Filter Coffee',15,1]];
const STALLS = [['Juice Corner','Near Library','Today to Friday'],['Book Fair','Main Block lawn','This week'],['Fest Food Court','Sports Ground','Event days only']];
const SPOTS = [['Main Block','RO purifier running'],['CSE Block','Cooler on every floor'],['Library','Cooler near reading hall'],['Hostel A','Overhead tank, 3 refills a day'],['Hostel B','Overhead tank, 3 refills a day'],['Sports Ground','Two taps near pavilion']];

const H = 36e5, T = Date.now();
function seed() {
  const r = (id,title,cat,loc,desc,status,confirms,hrs,review='approved') => ({id,title,cat,loc,desc,status,confirms,date:T-hrs*H,review,by:id%2?'Student':'Faculty',img:''});
  return {
    reports: [
      r(1,'No water supply on Hostel B second floor','Water Supply','Hostel B','Taps have been dry since morning. Students are carrying buckets from the ground floor.','Pending',14,5),
      r(2,'Cloudy water from the library cooler','Drinking Water','Library','Water from the cooler near the reading hall looks cloudy and has a bad smell.','In Progress',22,20),
      r(3,'Wi-Fi down in CSE Block labs','Wi-Fi & Internet','CSE Block','No connection in Labs 2 and 3 since yesterday evening. Lab sessions are affected.','In Progress',31,30),
      r(4,'Washroom not cleaned on first floor','Toilets & Cleanliness','Main Block','The first floor washroom has not been cleaned for two days and has no running water in one stall.','Pending',9,9),
      r(5,'Projector not working in Room 204','Classrooms','CSE Block','The projector shows a blank screen. The HDMI port looks loose.','Resolved',12,50),
      r(6,'Frequent power cuts in Hostel A','Electricity','Hostel A','Power goes off for 10 minutes several times every night. Fans and chargers stop.','Resolved',18,72),
      r(7,'Bus 5 arriving 30 minutes late','Transportation','Bus Bay','The morning bus on the north route has been late all week and students miss first period.','Pending',7,3,'review'),
      r(8,'Canteen ran out of lunch by 12:45','Canteen & Food','Canteen','Meals were finished before the second lunch batch. Cooking quantity needs to go up.','Pending',3,1,'review'),
      r(9,'Free laptops being given out at the gate','Classrooms','Main Block','Someone said free laptops are distributed at the main gate today. Please confirm.','Pending',0,2,'rejected')
    ],
    ann: [
      {id:1,type:'Event',title:'Tech Fest registration is open',body:'Register for coding, robotics and design events at the student desk before Friday.',date:T-6*H},
      {id:2,type:'Urgent',title:'Water tank cleaning on Sunday',body:'Water supply will be off in both hostels from 10 AM to 2 PM. Store water in advance.',date:T-18*H},
      {id:3,type:'Notice',title:'Internal exam timetable released',body:'The timetable is on the department notice boards. Hall tickets are available from the office.',date:T-40*H},
      {id:4,type:'Temporary',title:'Book fair near the library',body:'Discounted textbooks and reference books on the Main Block lawn this week.',date:T-60*H}
    ],
    food: [{id:1,item:'Fresh samosas at the canteen',status:'Available',by:'Student',date:T-.5*H},{id:2,item:'Chicken biryani',status:'Sold out',by:'Student',date:T-2*H}]
  };
}

let S = JSON.parse(localStorage.getItem('cc_data') || 'null') || seed();
let isAdmin = sessionStorage.cc_admin === '1', tab = 'water', af = 'All', pre = {}, f = {q:'',cat:'',st:''};
let conf = JSON.parse(localStorage.getItem('cc_conf') || '[]');

const $ = s => document.querySelector(s);
const save = () => { try { localStorage.setItem('cc_data', JSON.stringify(S)); } catch { toast('Storage is full. Remove old reports.'); } };
const fmt = t => new Date(t).toLocaleString([], {dateStyle:'medium', timeStyle:'short'});
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const opts = (a, s) => a.map(x => `<option ${x === s ? 'selected' : ''}>${x}</option>`).join('');
const live = () => S.reports.filter(r => r.review !== 'rejected');
const byDate = a => a.slice().sort((x, y) => y.date - x.date);
const cls = {Pending:'warn','In Progress':'blue',Resolved:'ok'};
const badge = s => `<span class="badge ${cls[s] || ''}">${s}</span>`;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2600); }
function go(cat, loc, title = '') { pre = {cat, loc, title}; location.hash = '#/report'; }

/* ---------- reusable pieces ---------- */
const adminCtl = r => `<select style="width:auto" aria-label="Status" onchange="setSt(${r.id},this.value)">${opts(STATUS, r.status)}</select>
  <button class="btn sm" onclick="rev(${r.id},'approved')">Approve</button><button class="btn sm out" onclick="rev(${r.id},'rejected')">Reject</button><button class="btn sm del" onclick="delR(${r.id})">Remove</button>`;
const rcard = (r, ad) => `<article class="card rep"><div class="row"><span class="chip">${CATS[r.cat]} ${r.cat}</span>${badge(r.status)}
  ${r.review === 'approved' ? '' : `<span class="badge ${r.review === 'rejected' ? 'bad' : ''}">${r.review === 'rejected' ? 'Rejected' : 'Under review'}</span>`}</div>
  <h3>${esc(r.title)}</h3><p>${esc(r.desc)}</p>${r.img ? `<img src="${r.img}" alt="Attached photo">` : ''}
  <div class="meta"><span>📍 ${r.loc}</span><span>🕒 ${fmt(r.date)}</span><span>By ${esc(r.by)}</span></div>
  <div class="row">${ad ? adminCtl(r) : `<button class="btn sm ${conf.includes(r.id) ? '' : 'out'}" onclick="confirmR(${r.id})">👍 Confirm (${r.confirms})</button>`}</div></article>`;
const annItem = (a, ad) => `<div class="ann ${a.type}"><span class="badge">${a.type}</span><h4>${esc(a.title)}</h4><p>${esc(a.body)}</p><small>${fmt(a.date)}</small>
  ${ad ? `<div><button class="btn sm del" onclick="delAnn(${a.id})">Delete</button></div>` : ''}</div>`;
const canteenOpen = () => { const d = new Date(), m = d.getHours() * 60 + d.getMinutes(); return m >= 480 && m < 1050; }; // 8:00 – 17:30

/* ---------- info tabs ---------- */
const water = () => `<div class="row" style="margin-bottom:18px"><button class="btn" onclick="go('Water Supply','','Water shortage at ')">Report a water shortage</button>
  <button class="btn out" onclick="go('Drinking Water','','Dirty water at ')">Report dirty or poor-quality water</button></div>
  <div class="grid">${SPOTS.map(([loc, note]) => {
    const bad = S.reports.some(r => r.review !== 'rejected' && r.status !== 'Resolved' && /Water/.test(r.cat) && r.loc === loc);
    return `<div class="card"><div class="row between"><h3>${loc}</h3><span class="badge ${bad ? 'warn' : 'ok'}">${bad ? 'Issue reported' : 'Available'}</span></div>
      <p class="mut">${note}</p><p style="margin-top:10px"><button class="btn sm out" onclick="go('Water Supply','${loc}','Water problem at ${loc}')">Report a problem here</button></p></div>`;
  }).join('')}</div>`;
const food = () => `<div class="card" style="margin-bottom:18px"><h3><span class="dot ${canteenOpen() ? '' : 'off'}"></span>Canteen is ${canteenOpen() ? 'open' : 'closed'} now</h3><p class="mut">Hours: 8:00 AM to 5:30 PM, Monday to Saturday</p></div>
  <h3 class="sec">Today's menu</h3><div class="grid">${MENU.map(([n, p, a]) => `<div class="card row between"><div><h4>${n}</h4><small>₹${p}</small></div><span class="badge ${a ? 'ok' : 'bad'}">${a ? 'Available' : 'Sold out'}</span></div>`).join('')}</div>
  <h3 class="sec">Share a food update</h3><form class="card" onsubmit="addFood(event)"><div class="inline"><input id="fi" placeholder="What did you see? e.g. Masala dosa" aria-label="Food item"><select id="fs" aria-label="Availability">${opts(['Available', 'Sold out'])}</select><button class="btn">Share update</button></div><small class="err" id="e-f"></small></form>
  <div style="margin-top:14px">${S.food.map(x => `<div class="ann"><div class="row"><span class="badge ${x.status === 'Available' ? 'ok' : 'bad'}">${x.status}</span><h4>${esc(x.item)}</h4></div><small>${fmt(x.date)} by ${esc(x.by)}</small></div>`).join('')}</div>
  <h3 class="sec">Temporary and special stalls</h3><div class="grid">${STALLS.map(([n, w, t]) => `<div class="card"><h4>${n}</h4><p class="mut">${w}</p><span class="chip">${t}</span></div>`).join('')}</div>`;
const fac = () => `<div class="grid">${Object.keys(CATS).filter(c => c !== 'Canteen & Food').map(c => {
  const n = live().filter(r => r.cat === c && r.status !== 'Resolved').length;
  return `<div class="card"><span class="ic">${CATS[c]}</span><h3>${c}</h3><p class="mut">${n} open ${n === 1 ? 'issue' : 'issues'}</p><p style="margin-top:10px"><button class="btn sm" onclick="go('${c}','')">Report a problem</button></p></div>`;
}).join('')}</div>`;

/* ---------- pages ---------- */
const P = {
  home() {
    const L = live(), open = L.filter(r => r.status !== 'Resolved').length, wi = L.filter(r => /Water/.test(r.cat) && r.status !== 'Resolved').length;
    return `<section class="hero"><div class="wrap"><div><h1>Know what is happening on campus before you walk there</h1>
      <p>Check water and canteen updates, report problems with a photo, and see what is being fixed. Students, faculty and admins work from the same live list.</p>
      <div class="row"><a class="btn lg" href="#/report">Report a problem</a><a class="btn lg ghost" href="#/dashboard">Open dashboard</a></div></div>
      <div class="live"><h3>Right now on campus</h3><div><span><span class="dot ${canteenOpen() ? '' : 'off'}"></span>Canteen</span><b>${canteenOpen() ? 'Open' : 'Closed'}</b></div>
      <div><span>Open reports</span><b>${open}</b></div><div><span>Water issues</span><b>${wi}</b></div><div><span>Latest notice</span><b>${S.ann.length ? esc(S.ann[0].type) : 'None'}</b></div></div></div></section>
      <div class="wrap"><div class="grid">${[['📊','Campus dashboard','Totals, categories and recent issues.','dashboard'],['💧','Campus information','Water, canteen menu, stalls and facilities.','info'],['📝','Submit a report','Describe a problem and attach a photo.','report'],['👥','Community reports','Search, filter and confirm reports.','community'],['📢','Announcements','Events, notices and temporary updates.','announcements'],['🛡️','Admin dashboard','Approve, update or remove reports.','admin']]
      .map(([i, t, d, l]) => `<a class="card feat" href="#/${l}"><span class="ic">${i}</span><h3>${t}</h3><p>${d}</p></a>`).join('')}</div></div>`;
  },
  dashboard() {
    const L = live(), n = s => L.filter(r => r.status === s).length;
    const cnt = Object.keys(CATS).map(c => [c, L.filter(r => r.cat === c).length]), mx = Math.max(1, ...cnt.map(x => x[1]));
    return `<div class="wrap"><h2>Campus Dashboard</h2><div class="grid stats">${[['Total reports', L.length, '📋'], ['Pending complaints', n('Pending'), '⏳'], ['In progress', n('In Progress'), '🔧'], ['Resolved complaints', n('Resolved'), '✅']]
      .map(([a, b, i]) => `<div class="card stat"><span class="ic">${i}</span><b>${b}</b><small>${a}</small></div>`).join('')}</div>
      <div class="two"><div class="card bars"><h3>Reports by category</h3>${cnt.map(([c, v]) => `<div><span>${CATS[c]} ${c}</span><span class="tr"><i style="--w:${v / mx * 100}%"></i></span><b>${v}</b></div>`).join('')}</div>
      <div class="card"><h3>Latest campus updates</h3>${S.ann.slice(0, 3).map(a => annItem(a)).join('')}<a href="#/announcements">See all announcements</a></div></div>
      <h3 class="sec">Recently reported issues</h3><div class="grid">${byDate(L).slice(0, 3).map(r => rcard(r)).join('')}</div></div>`;
  },
  info() {
    const tabs = [['water', '💧 Water'], ['food', '🍽️ Canteen and food'], ['fac', '🏫 Facilities']];
    return `<div class="wrap"><h2>Campus Information</h2><div class="tabs">${tabs.map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" onclick="tab='${k}';route()">${l}</button>`).join('')}</div>${({water, food, fac})[tab]()}</div>`;
  },
  report() {
    const p = pre; pre = {};
    return `<div class="wrap narrow"><h2>Submit a Report</h2><form class="card form" onsubmit="submitR(event)" novalidate>
      <label>Report title<input id="t" value="${esc(p.title || '')}" placeholder="Short summary of the problem"><small class="err" id="e-t"></small></label>
      <div class="two2"><label>Category<select id="c"><option value="">Select category</option>${opts(Object.keys(CATS), p.cat)}</select><small class="err" id="e-c"></small></label>
      <label>Campus location<select id="l"><option value="">Select location</option>${opts(LOCS, p.loc)}</select><small class="err" id="e-l"></small></label></div>
      <label>Problem description<textarea id="d" rows="5" placeholder="What happened, and since when?"></textarea><small class="err" id="e-d"></small></label>
      <label>Photo (optional)<input type="file" id="im" accept="image/*" onchange="prev(this)"><img id="pv" hidden alt="Preview"><small class="err" id="e-i"></small></label>
      <button class="btn lg">Submit report</button></form></div>`;
  },
  community() {
    return `<div class="wrap"><h2>Community Reports</h2><div class="filters"><input id="q" placeholder="Search reports" aria-label="Search" value="${esc(f.q)}" oninput="f.q=this.value;list()">
      <select aria-label="Category" onchange="f.cat=this.value;list()"><option value="">All categories</option>${opts(Object.keys(CATS), f.cat)}</select>
      <select aria-label="Status" onchange="f.st=this.value;list()"><option value="">All statuses</option>${opts(STATUS, f.st)}</select></div><div id="list" class="grid"></div></div>`;
  },
  announcements() {
    const L = S.ann.filter(a => af === 'All' || a.type === af);
    return `<div class="wrap"><h2>Announcements</h2><div class="tabs">${['All', 'Event', 'Notice', 'Urgent', 'Temporary'].map(t => `<button class="${af === t ? 'on' : ''}" onclick="af='${t}';route()">${t}</button>`).join('')}</div>
      <div class="grid">${L.map(a => annItem(a)).join('') || '<p class="empty">No announcements in this category yet.</p>'}</div></div>`;
  },
  admin() {
    if (!isAdmin) return `<div class="wrap narrow"><h2>Admin Sign In</h2><form class="card form" onsubmit="login(event)"><label>Admin PIN<input id="pin" type="password" autocomplete="off"></label><small>Demo PIN: <b>${ADMIN_PIN}</b></small><button class="btn">Sign in</button></form></div>`;
    const n = S.reports.filter(r => r.review === 'review').length;
    return `<div class="wrap"><div class="row between"><h2>Admin Dashboard</h2><button class="btn sm out" onclick="logout()">Sign out</button></div>
      <p class="mut" style="margin-bottom:16px">${n} ${n === 1 ? 'report is' : 'reports are'} waiting for review. All ${S.reports.length} submitted reports are listed below.</p>
      <div class="grid">${byDate(S.reports).map(r => rcard(r, 1)).join('')}</div>
      <h3 class="sec">Manage announcements</h3><form class="card form" onsubmit="addAnn(event)"><div class="two2"><label>Title<input id="at"></label><label>Type<select id="ay">${opts(['Event', 'Notice', 'Urgent', 'Temporary'])}</select></label></div>
      <label>Message<textarea id="ab" rows="3"></textarea></label><small class="err" id="e-a"></small><button class="btn">Publish announcement</button></form>
      <div class="grid" style="margin-top:18px">${S.ann.map(a => annItem(a, 1)).join('')}</div></div>`;
  },
  about() {
    return `<div class="wrap narrow"><h2>About CampusConnect</h2><div class="card form"><p>CampusConnect gives students and faculty one place to report campus problems, check water and canteen status, and read official announcements. Administrators review every report, set its status and remove anything fake or outdated.</p>
      <h3>How it works</h3><ol class="steps"><li>Someone submits a report with a location and an optional photo.</li><li>Other users confirm it, so admins can see which problems affect the most people.</li><li>An admin approves it and moves it from Pending to In Progress to Resolved.</li></ol>
      <h3>Built with</h3><p>HTML, CSS and vanilla JavaScript. Reports are saved in your browser's localStorage, so no backend is needed to run it.</p>
      <h3>Project</h3><p>An individual college project by <b>Your Name</b>. Replace this text with your name, department and year.</p></div></div>`;
  }
};

/* ---------- actions ---------- */
function list() {
  const q = f.q.toLowerCase();
  const L = byDate(live().filter(r => (!f.cat || r.cat === f.cat) && (!f.st || r.status === f.st) && (r.title + r.desc + r.loc).toLowerCase().includes(q)));
  $('#list').innerHTML = L.map(r => rcard(r)).join('') || '<p class="empty">No reports match. Clear a filter or submit a new report.</p>';
}
function confirmR(id) {
  if (conf.includes(id)) return toast('You have already confirmed this report');
  conf.push(id); localStorage.setItem('cc_conf', JSON.stringify(conf));
  S.reports.find(r => r.id === id).confirms++; save(); route(); toast('Report confirmed');
}
function addFood(e) {
  e.preventDefault(); const item = $('#fi').value.trim();
  if (item.length < 3) return $('#e-f').textContent = 'Enter at least 3 characters.';
  S.food.unshift({id: Date.now(), item, status: $('#fs').value, by: 'Student', date: Date.now()}); save(); route(); toast('Food update shared');
}
function prev(i) { const p = $('#pv'), file = i.files[0]; if (!file) return p.hidden = true; p.src = URL.createObjectURL(file); p.hidden = false; }
const shrink = file => new Promise(res => { const im = new Image(); im.onload = () => { const k = Math.min(1, 640 / im.width), c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .7)); }; im.onerror = () => res(''); im.src = URL.createObjectURL(file); });
async function submitR(e) {
  e.preventDefault(); const v = id => $('#' + id).value.trim(), file = $('#im').files[0];
  const er = {t: v('t').length < 5 ? 'Title needs at least 5 characters.' : '', c: v('c') ? '' : 'Choose a category.', l: v('l') ? '' : 'Choose a location.',
    d: v('d').length < 20 ? 'Describe the problem in at least 20 characters.' : '', i: file && (!file.type.startsWith('image/') || file.size > 5e6) ? 'Upload an image under 5 MB.' : ''};
  for (const k in er) $('#e-' + k).textContent = er[k];
  if (Object.values(er).some(Boolean)) return;
  const img = file ? await shrink(file) : '';
  S.reports.unshift({id: Date.now(), title: v('t'), cat: v('c'), loc: v('l'), desc: v('d'), img, status: 'Pending', review: 'review', confirms: 1, date: Date.now(), by: 'You'});
  save(); toast('Report submitted. It is now visible to the community.'); location.hash = '#/community';
}
function login(e) { e.preventDefault(); if ($('#pin').value === ADMIN_PIN) { isAdmin = true; sessionStorage.cc_admin = '1'; route(); toast('Signed in as admin'); } else toast('Incorrect PIN'); }
function logout() { isAdmin = false; sessionStorage.removeItem('cc_admin'); route(); }
function setSt(id, s) { S.reports.find(r => r.id === id).status = s; save(); toast('Status changed to ' + s); route(); }
function rev(id, v) { S.reports.find(r => r.id === id).review = v; save(); toast('Report ' + v); route(); }
function delR(id) { if (confirm('Remove this report permanently?')) { S.reports = S.reports.filter(r => r.id !== id); save(); route(); toast('Report removed'); } }
function addAnn(e) {
  e.preventDefault(); const title = $('#at').value.trim(), body = $('#ab').value.trim();
  if (title.length < 4 || body.length < 10) return $('#e-a').textContent = 'Add a title (4+ characters) and a message (10+ characters).';
  S.ann.unshift({id: Date.now(), type: $('#ay').value, title, body, date: Date.now()}); save(); route(); toast('Announcement published');
}
function delAnn(id) { S.ann = S.ann.filter(a => a.id !== id); save(); route(); toast('Announcement deleted'); }

/* ---------- router ---------- */
function route() {
  const k = location.hash.slice(2), pg = P[k] ? k : 'home';
  $('#app').innerHTML = `<div class="fade">${P[pg]()}</div>`;
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#/' + pg));
  $('nav').classList.remove('open'); if ($('#list')) list();
}
addEventListener('hashchange', () => { route(); scrollTo(0, 0); });
route();
