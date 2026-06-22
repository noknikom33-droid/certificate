/* ============================================================
   ระบบเกียรติบัตรออนไลน์ - app.js  (โค้ดทำงานหลักทั้งหมด)
   อ่านค่าตั้งต้นจาก config.js (window.CERT_CONFIG)
   ============================================================ */
const CFG = window.CERT_CONFIG || {};
const API_URL = CFG.API_URL;
const SAMPLE_NAME = CFG.SAMPLE_NAME || 'นายศิริพงษ์ ธิวรรณ';
// แจ้ง index.html ว่าสคริปต์เริ่มทำงานแล้ว (ปิดตัวจับเวลาเตือน)
window.__booted = true; if(window.__bootTimer) clearTimeout(window.__bootTimer);

/* =================== API =================== */
// เรียก API พร้อม timeout และแปลงเป็น JSON อย่างปลอดภัย
// ถ้าพลาด จะ"คืน object error" แทนการ throw เพื่อไม่ให้หน้าค้างที่สปินเนอร์
async function fetchJSON(url, opts={}, ms=25000){
  const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(), ms);
  let text='';
  try{
    const r=await fetch(url,{...opts,signal:ctrl.signal,redirect:'follow'});
    text=await r.text();
  }catch(e){
    if(e.name==='AbortError') throw new Error('หมดเวลาเชื่อมต่อ API (เครือข่ายช้า หรือ URL ไม่ถูกต้อง)');
    throw new Error('เชื่อมต่อ API ไม่ได้ — ตรวจอินเทอร์เน็ต/ลิงก์ API_URL ในไฟล์ config.js');
  }finally{ clearTimeout(t); }
  try{ return JSON.parse(text); }
  catch(e){ throw new Error('API ไม่ได้ส่งข้อมูล JSON กลับมา — มักเกิดเมื่อยังไม่ได้ตั้ง Deploy เป็น "Who has access = Anyone" หรือใช้ลิงก์ที่ไม่ใช่ /exec'); }
}
async function apiGet(action, params={}){
  try{ const qs=new URLSearchParams({action,...params}).toString(); return await fetchJSON(API_URL+'?'+qs); }
  catch(e){ return {ok:false, error:String(e.message||e)}; }
}
async function apiPost(action, data={}){
  try{ return await fetchJSON(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,...data})}); }
  catch(e){ return {ok:false, error:String(e.message||e)}; }
}
async function uploadToDrive(dataURL, filename){
  const u = Session.get();
  return apiPost('uploadImage',{token:u.token, data:dataURL, filename});
}

/* =================== session / utils =================== */
const Session={get(){try{return JSON.parse(localStorage.getItem('cert_user')||'null')}catch(e){return null}},
  set(u){localStorage.setItem('cert_user',JSON.stringify(u))},clear(){localStorage.removeItem('cert_user')}};
const THMONTHS=['','มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
function thaiDate(s){if(!s)return'';const m=String(s).match(/(\d{4})-(\d{1,2})-(\d{1,2})/);if(!m)return s;let y=+m[1];if(y<2500)y+=543;return +m[3]+' '+THMONTHS[+m[2]]+' '+y;}
function toThai(s){return String(s).replace(/[0-9]/g,d=>'๐๑๒๓๔๕๖๗๘๙'[d]);}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function el(id){return document.getElementById(id)}
function todayThaiInput(){const d=new Date();return (d.getFullYear()+543)+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function toast(msg,ok=true){const t=document.createElement('div');t.style.cssText='position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:99999;background:'+(ok?'#10b981':'#ef4444')+';color:#fff;padding:12px 22px;border-radius:12px;font-weight:600;box-shadow:0 10px 30px -10px rgba(0,0,0,.4)';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>{t.style.transition='.4s';t.style.opacity='0';setTimeout(()=>t.remove(),400)},2300);}
function errorBox(msg){return `<div class="remix-page"><div class="admin-card text-center" style="max-width:560px;margin:40px auto">
  <i class="bi bi-exclamation-triangle text-warning" style="font-size:2.4rem"></i><h4 class="fw-bold mt-2">เกิดข้อผิดพลาด</h4>
  <p class="text-muted">${esc(msg)}</p>
  <p class="text-muted small">หากเพิ่ง deploy API ใหม่ ตรวจสอบว่า Who has access = Anyone และวางลิงก์ /exec ในไฟล์ config.js ถูกต้อง</p>
  <a href="#/" class="btn btn-primary">กลับหน้าแรก</a></div></div>`;}
function shell(content){ el('root').innerHTML = content; }

/* =================== CERTIFICATE RENDER =================== */
function certFrameSVG(logo){
  return `<svg class="cert-svg" viewBox="0 0 1123 794" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <rect width="1123" height="794" fill="#fdfdfb"/>
    <path d="M0,748 L1123,556 L1123,794 L0,794 Z" fill="#16234d"/>
    <path d="M0,724 L1123,534" stroke="#c9a44a" stroke-width="3.5" fill="none" opacity=".9"/>
    <path d="M0,766 L1123,592" stroke="#d9bd77" stroke-width="1.6" fill="none" opacity=".75"/>
    <path d="M1123,0 L1123,168 L742,0 Z" fill="#16234d"/>
    <path d="M1123,52 L862,0" stroke="#c9a44a" stroke-width="3" fill="none"/>
    <path d="M1123,92 L948,0" stroke="#d9bd77" stroke-width="1.4" fill="none" opacity=".8"/>
    <path d="M0,0 L292,0 L0,150 Z" fill="#16234d"/>
    <path d="M250,0 L0,128" stroke="#c9a44a" stroke-width="2.5" fill="none"/>
    <path d="M70,28 h96 a9,9 0 0 1 9,9 v250 l-57,42 l-57,-42 v-250 a9,9 0 0 1 9,-9 Z" fill="#1b2a55" stroke="#c9a44a" stroke-width="3"/>
    <path d="M82,42 h72 v236 l-36,26 l-36,-26 Z" fill="none" stroke="#d9bd77" stroke-width="1.3" opacity=".85"/>
    ${logo?'':`<circle cx="118" cy="150" r="40" fill="none" stroke="#d4af37" stroke-width="2.5"/>
      <path d="M118,116 l9,26 h27 l-22,16 l9,27 l-23,-17 l-23,17 l9,-27 l-22,-16 h27 Z" fill="#d4af37" opacity=".92"/>`}
    <rect x="26" y="26" width="1071" height="742" fill="none" stroke="#c9a44a" stroke-width="3"/>
    <rect x="34" y="34" width="1055" height="726" fill="none" stroke="#d9bd77" stroke-width="1"/>
  </svg>`;
}
function signBlock(s){
  if(!s||!s.name) return '';
  return `<div class="cert-sign">
    ${s.image?`<img class="simg" src="${esc(s.image)}" alt="">`:`<div style="height:clamp(30px,6vw,54px)"></div>`}
    <div class="sname">(${esc(s.name)})</div>
    <div class="spos">${esc(s.position||'')}</div>
  </div>`;
}
function renderCertInner(c){
  const name = c._sampleName || c.name || '';
  const bg = c.background;
  const logo = c.logo || '';
  const back = bg ? `<img class="cert-bgimg" src="${esc(bg)}" alt="">` : certFrameSVG(logo);
  const emblem = logo ? `<div class="cert-emblem"><img src="${esc(logo)}" alt=""></div>` : '';
  const org = [c.organizer, c.place].filter(Boolean).join(' ณ ');
  const signs = [signBlock(c.sign1), signBlock(c.sign2)].filter(Boolean).join('');
  return `${back}${emblem}
    <div class="cert-code">เลขที่ ${esc(toThai(c.code||''))}</div>
    <div class="cert-overlay">
      <div class="cert-title">${esc(c.title||'เกียรติบัตร')}</div>
      <div class="cert-said">ขอมอบเกียรติบัตรฉบับนี้เพื่อแสดงว่า</div>
      <div class="cert-name" style="color:${esc(c.name_color||'#3b2f8c')}">${esc(name)}</div>
      <div class="cert-detail">${esc(c.detail||'ได้ผ่านการอบรมตามหลักสูตรที่กำหนด')}</div>
      <div class="cert-course">${esc(c.course||'')}</div>
      <div class="cert-org">${esc(org)}</div>
      <div class="cert-date">ให้ไว้ ณ วันที่ ${esc(toThai(thaiDate(c.issue_date)))}</div>
      <div class="cert-signs" style="${signs?'':'visibility:hidden'}">${signs||signBlock({name:' ',position:' '})}</div>
    </div>`;
}

/* =================== ROUTER =================== */
window.addEventListener('hashchange',router);
function router(){
  if(!API_URL){ shell(errorBox('ยังไม่ได้ตั้งค่า API_URL ในไฟล์ assets/js/config.js')); return; }
  const hash=location.hash.replace(/^#/,'')||'/';
  const [path,anchor]=hash.split('#');
  const parts=path.split('/').filter(Boolean);
  if(parts[0]==='cert'){renderCertificate(parts[1]);return;}
  if(parts[0]==='bulk'){renderBulk();return;}
  if(parts[0]==='login'){renderLogin();return;}
  if(parts[0]==='admin'){renderAdmin(parts[1]||'dashboard');return;}
  renderHome(anchor);
}

/* =================== PUBLIC HOME =================== */
async function renderHome(anchor, query){
  shell(`<div class="loader"><div class="spin"></div>กำลังโหลดข้อมูล...</div>`);
  let d; try{ d=await apiGet('bootstrap', query?{q:query}:{}); }catch(e){ shell(errorBox('เชื่อมต่อฐานข้อมูลไม่สำเร็จ')); return; }
  if(!d||!d.ok){ shell(errorBox(d&&d.error||'โหลดข้อมูลไม่สำเร็จ')); return; }
  const s=d.stats, set=d.settings||{};
  const logo=set.logo_url, banner=set.banner_url, school=set.school_name||'ระบบเกียรติบัตรออนไลน์';

  const teacherOpts=d.teachers.map(t=>`<option value="${esc(t.name)}">${esc(t.name)} | ${t.count_names} รายชื่อ | ${t.count_certs} เกียรติบัตร</option>`).join('');
  const rows=d.certificates.length?d.certificates.map((c,i)=>`<tr>
    <td><span class="remix-row-no">${i+1}</span></td>
    <td><span class="remix-code">${esc(c.code)}</span></td>
    <td><strong>${esc(c.name)}</strong><small>${esc(c.organization)}</small></td>
    <td><strong>${esc(c.activity_course)}</strong><small>${esc(c.activity_title)}</small></td>
    <td><span class="remix-owner"><i class="bi bi-person-badge"></i> ${esc(c.teacher)}</span></td>
    <td>${esc(thaiDate(c.issue_date))}</td>
    <td class="text-end"><div class="remix-actions">
      <a href="#/cert/${c.id}" class="btn btn-sm btn-primary"><i class="bi bi-eye"></i> ดู</a>
      <a href="#/cert/${c.id}?print=1" class="btn btn-sm btn-success"><i class="bi bi-printer"></i> พิมพ์</a></div></td></tr>`).join('')
    :`<tr><td colspan="7" class="empty-row">ไม่พบเกียรติบัตรที่ตรงกับการค้นหา</td></tr>`;
  const acts=d.activities.length?d.activities.map(a=>`<article class="remix-activity-card">
    <div class="activity-image" style="${a.background?`background-image:url('${esc(a.background)}')`:''}"><span>${a.status==='active'?'ใช้งาน':'ปิด'}</span></div>
    <div class="activity-detail"><h3>${esc(a.title)}</h3><p>${esc(a.course)}</p>
      <div class="activity-teacher"><i class="bi bi-person"></i> ${esc(a.teacher)}</div>
      <div class="activity-stats"><span><b>${a.count}</b> รายชื่อ</span><span><b>${a.count}</b> ออกแล้ว</span></div></div>
    </article>`).join('') : `<p class="text-muted">ยังไม่มีกิจกรรม</p>`;

  shell(`
  <nav class="remix-navbar no-print">
    <a class="remix-brand" href="#/"><span class="remix-logo">${logo?`<img src="${esc(logo)}">`:'<i class="bi bi-award-fill"></i>'}</span>
      <span><strong>ระบบเกียรติบัตรออนไลน์</strong><small>Public Certificate Portal</small></span></a>
    <div class="remix-menu">
      <a href="#/">หน้าแรก</a><a href="#/#certificateTable">ตารางเกียรติบัตร</a><a href="#/#activities">กิจกรรม</a>
      <a href="#/login" class="login-link"><i class="bi bi-box-arrow-in-right"></i> เข้าสู่ระบบ</a></div>
  </nav>
  <main class="remix-page">
    <section class="remix-top-banner">${banner?`<img src="${esc(banner)}" alt="">`:''}<div class="banner-shade"></div>
      <div class="banner-content"><div class="banner-logo">${logo?`<img src="${esc(logo)}">`:'<i class="bi bi-award-fill"></i>'}</div>
        <div><span>Certificate Online System</span><h1>${esc(school)}</h1><p>ค้นหา ตรวจสอบ และพิมพ์เกียรติบัตรได้อย่างสะดวก</p></div></div></section>

    <section class="remix-hero" id="searchPanel">
      <div class="remix-hero-left">
        <div class="remix-kicker"><i class="bi bi-stars"></i> ตรวจสอบเกียรติบัตรออนไลน์ได้ทันที</div>
        <h1>ค้นหาเกียรติบัตร<br><span>ตามชื่อครู / ชื่อผู้รับ / กิจกรรม</span></h1>
        <p>หน้าแรกสำหรับผู้รับเกียรติบัตรและครูผู้รับผิดชอบ ค้นหา ดู และพิมพ์เกียรติบัตรได้โดยไม่ต้องเข้าสู่ระบบ</p>
        <div class="remix-search"><i class="bi bi-search"></i>
          <input id="searchInput" placeholder="พิมพ์ชื่อผู้รับ เลขเกียรติบัตร ชื่อครู หรือชื่อกิจกรรม" value="${esc(d.query||'')}" onkeydown="if(event.key==='Enter')doSearch()">
          <button onclick="doSearch()">ค้นหา <i class="bi bi-arrow-right"></i></button></div>
      </div>
      <div class="remix-hero-right"><div class="remix-logo-card">
        <div class="logo-card-img">${logo?`<img src="${esc(logo)}">`:'<i class="bi bi-award-fill"></i>'}</div>
        <h2>ศูนย์กลางเกียรติบัตร</h2><p>ระบบรวมข้อมูลกิจกรรม เกียรติบัตร และรายชื่อผู้ได้รับเกียรติบัตร</p></div></div>
    </section>

    <section class="remix-stat-grid">
      <div class="remix-stat blue"><span class="ic"><i class="bi bi-card-image"></i></span><div><strong>${s.activities}</strong><span>กิจกรรม/แบบเกียรติบัตร</span></div></div>
      <div class="remix-stat pink"><span class="ic"><i class="bi bi-people-fill"></i></span><div><strong>${s.recipients}</strong><span>รายชื่อผู้รับ</span></div></div>
      <div class="remix-stat green"><span class="ic"><i class="bi bi-award-fill"></i></span><div><strong>${s.certificates}</strong><span>เกียรติบัตรพร้อมพิมพ์</span></div></div>
      <div class="remix-stat orange"><span class="ic"><i class="bi bi-person-badge"></i></span><div><strong>${s.users}</strong><span>ครู/ผู้ใช้งาน</span></div></div>
    </section>

    <section class="remix-filter-card">
      <div class="filter-title"><span><i class="bi bi-person-lines-fill"></i></span><div><strong>ค้นหาตามครูผู้รับผิดชอบ</strong><small>เลือกชื่อครูจากดรอปดาวน์เพื่อกรองตารางเกียรติบัตร</small></div></div>
      <div class="filter-form"><select id="teacherSelect" class="form-select"><option value="">-- แสดงทุกครู / รายการล่าสุด --</option>${teacherOpts}</select>
        <button class="btn btn-primary" onclick="doFilterTeacher()"><i class="bi bi-search"></i> ค้นหา</button></div>
    </section>

    <section class="remix-section" id="certificateTable">
      <div class="remix-section-head"><div><span class="eyebrow">Certificates</span><h2>ตารางรวมเกียรติบัตรล่าสุด</h2>
        <p class="mb-0 text-muted">รวมข้อมูลจากทุกกิจกรรมไว้ในตารางเดียว พร้อมดู พิมพ์ หรือดาวน์โหลดแบบรวม</p></div>
        <div class="remix-count"><b>${d.certificates.length}</b><small>รายการ</small></div></div>
      <div class="remix-table-card"><div class="remix-table-top">
        <div><strong>รายการล่าสุดในระบบ</strong><span class="text-muted">เปิดดูรายบุคคล หรือดาวน์โหลด/พิมพ์เป็นไฟล์รวมได้ทันที</span></div>
        <div class="public-bulk-actions"><a href="#/bulk" class="btn btn-light"><i class="bi bi-files"></i> ดูไฟล์รวม</a>
          <a href="#/bulk?print=1" class="btn btn-primary"><i class="bi bi-printer"></i> พิมพ์/ดาวน์โหลดรวม</a></div></div>
        <div class="table-responsive"><table class="table remix-table align-middle">
          <thead><tr><th>#</th><th>เลขเกียรติบัตร</th><th>ผู้ได้รับเกียรติบัตร</th><th>กิจกรรม/หลักสูตร</th><th>ครู/ผู้รับผิดชอบ</th><th>วันที่ออก</th><th class="text-end">จัดการ</th></tr></thead>
          <tbody>${rows}</tbody></table></div></div>
    </section>

    <section class="remix-section" id="activities">
      <div class="remix-section-head"><div><span class="eyebrow">Activities</span><h2>กิจกรรมและแบบเกียรติบัตร</h2></div>
        <p class="text-muted">ภาพรวมกิจกรรมล่าสุดพร้อมจำนวนรายชื่อและเกียรติบัตร</p></div>
      <div class="remix-activity-grid">${acts}</div>
    </section>
  </main>
  <footer class="remix-footer no-print"><div><strong>${esc(school)}</strong><span>Public Certificate Portal</span></div>
    <a href="#/login">เข้าสู่ระบบผู้ดูแล <i class="bi bi-arrow-right"></i></a></footer>`);
  if(anchor){const t=el(anchor);if(t)setTimeout(()=>t.scrollIntoView({behavior:'smooth'}),120);}
}
function doSearch(){renderHome('certificateTable', el('searchInput').value.trim());}
function doFilterTeacher(){renderHome('certificateTable', el('teacherSelect').value);}

/* =================== CERT PAGES =================== */
async function renderCertificate(id){
  shell(`<div class="loader"><div class="spin"></div>กำลังโหลดเกียรติบัตร...</div>`);
  const d=await apiGet('certificate',{id});
  if(!d||!d.ok){shell(errorBox(d&&d.error||'ไม่พบเกียรติบัตร'));return;}
  shell(`<div class="cert-toolbar no-print">
      <a href="#/" class="btn btn-light"><i class="bi bi-arrow-left"></i> กลับหน้าแรก</a>
      <button class="btn btn-success" onclick="window.print()"><i class="bi bi-printer"></i> พิมพ์ / บันทึก PDF</button></div>
    <div class="cert-stage"><div class="certificate">${renderCertInner(d.certificate)}</div></div>`);
  if(location.hash.includes('print=1'))setTimeout(()=>window.print(),700);
}
async function renderBulk(){
  shell(`<div class="loader"><div class="spin"></div>กำลังเตรียมไฟล์รวม...</div>`);
  const d=await apiGet('bulk');
  if(!d||!d.ok){shell(errorBox('โหลดข้อมูลไม่สำเร็จ'));return;}
  const inner=d.certificates.map(c=>`<div class="certificate">${renderCertInner(c)}</div>`).join('');
  shell(`<div class="cert-toolbar no-print"><a href="#/" class="btn btn-light"><i class="bi bi-arrow-left"></i> กลับหน้าแรก</a>
    <button class="btn btn-primary" onclick="window.print()"><i class="bi bi-printer"></i> พิมพ์ / บันทึก PDF ทั้งหมด</button></div>
    <div class="bulk-page">${inner||'<p class="text-center text-muted py-5">ยังไม่มีเกียรติบัตร</p>'}</div>`);
  if(location.hash.includes('print=1'))setTimeout(()=>window.print(),800);
}

/* =================== LOGIN =================== */
async function renderLogin(){
  if(Session.get()){location.hash='/admin';return;}
  let set={}; try{const d=await apiGet('bootstrap');set=d.settings||{};}catch(e){}
  const banner=set.banner_url||'', school=set.school_name||'ระบบออกเกียรติบัตรออนไลน์';
  shell(`<div class="login-bg ${banner?'has-bg':''}" style="${banner?`--lbg:url('${esc(banner)}')`:''}">
    <div class="login-card">
      <div class="login-left" style="${banner?`background-image:url('${esc(banner)}')`:'background:linear-gradient(160deg,#28408c,#5b3fd6)'}">
        <div class="ov"></div>
        <div class="inner">
          <div class="console-pill"><i class="bi bi-shield-lock"></i> Secure Certificate Console</div>
          <h2>ระบบออกเกียรติบัตรออนไลน์</h2>
          <p>ออกแบบเพื่อให้ครูและผู้ดูแลระบบจัดการเกียรติบัตรได้รวดเร็ว สวยงาม และเป็นระบบ</p>
          <div class="login-pills">
            <span><i class="bi bi-people"></i> แยกงานตามครู</span><span><i class="bi bi-image"></i> อัปโหลดพื้นหลัง</span>
            <span><i class="bi bi-pen"></i> ลายเซ็นดิจิทัล</span><span><i class="bi bi-graph-up"></i> Dashboard สรุปผล</span>
          </div>
        </div>
      </div>
      <div class="login-right">
        <div class="welcome">WELCOME BACK</div><h3>เข้าสู่ระบบ</h3>
        <div class="sub">สำหรับผู้ดูแลระบบและครูผู้ใช้งาน</div>
        <label class="form-label">ชื่อผู้ใช้</label>
        <div class="input-ic mb-3"><i class="bi bi-person"></i><input id="loginUser" class="form-control" placeholder="กรอกชื่อผู้ใช้" autocomplete="username"></div>
        <label class="form-label">รหัสผ่าน</label>
        <div class="input-ic mb-3"><i class="bi bi-key"></i><input id="loginPass" type="password" class="form-control" placeholder="กรอกรหัสผ่าน" autocomplete="current-password" onkeydown="if(event.key==='Enter')doLogin()"></div>
        <button class="btn btn-brand w-100 mb-2" id="loginBtn" onclick="doLogin()"><i class="bi bi-box-arrow-in-right"></i> เข้าสู่ระบบ</button>
        <a href="#/" class="btn btn-light w-100" style="border-radius:12px;font-weight:700"><i class="bi bi-house"></i> หน้าแรกเกียรติบัตร</a>
        <div class="text-center text-muted mt-3" style="font-size:.8rem">© 2026 ${esc(school)}</div>
      </div>
    </div></div>`);
}
async function doLogin(){
  const username=el('loginUser').value.trim(), password=el('loginPass').value;
  if(!username||!password){toast('กรอกชื่อผู้ใช้และรหัสผ่าน',false);return;}
  const b=el('loginBtn');b.disabled=true;b.innerHTML='กำลังตรวจสอบ...';
  const r=await apiPost('login',{username,password});
  b.disabled=false;b.innerHTML='<i class="bi bi-box-arrow-in-right"></i> เข้าสู่ระบบ';
  if(r&&r.ok){Session.set(r.user);toast('ยินดีต้อนรับ '+r.user.name);location.hash='/admin';}else toast(r&&r.error||'เข้าสู่ระบบไม่สำเร็จ',false);
}
function logout(){Session.clear();location.hash='/';}

/* =================== ADMIN =================== */
let ADMIN={data:null,tab:'dashboard'};
const STEP_TITLES={dashboard:'แดชบอร์ดขั้นตอน',step1:'จัดการลายเซ็นผู้บริหาร/วิทยากร',step2:'ตั้งค่าเลขและสร้างกิจกรรม',step3:'เพิ่มรายชื่อ / นำเข้า CSV',step4:'พิมพ์เกียรติบัตร',users:'จัดการบัญชีครู',settings:'โลโก้ / หัวเว็บ'};

async function renderAdmin(tab){
  const user=Session.get(); if(!user){location.hash='/login';return;}
  ADMIN.tab=tab;
  shell(`<div class="loader"><div class="spin"></div>กำลังโหลดแผงควบคุม...</div>`);
  const d=await apiPost('adminData',{token:user.token});
  if(!d||!d.ok){ if(d&&/เข้าสู่ระบบ/.test(d.error||'')){Session.clear();location.hash='/login';return;} shell(errorBox(d&&d.error||'โหลดข้อมูลไม่สำเร็จ'));return;}
  ADMIN.data=d;
  const logo=(d.settings||{}).logo_url||'';
  const navA=(key,icon,label,num)=>`<a class="${tab===key?'active':''}" href="#/admin/${key}">${num?`<span class="num">${num}</span>`:`<i class="bi ${icon}"></i>`} ${label}</a>`;
  const adminOnly=d.isAdmin?`<div class="nav-group">ผู้ดูแลระบบ</div><div class="admin-nav">
      ${navA('users','bi-people','จัดการบัญชีครู')}
      ${navA('settings','bi-image','โลโก้/หัวเว็บ')}
      <button class="danger" onclick="doClearAll()"><i class="bi bi-trash3"></i> ล้างข้อมูลทั้งหมด</button></div>`:'';

  shell(`<div class="admin-shell">
    <aside class="admin-side">
      <div class="brand"><span class="lg">${logo?`<img src="${esc(logo)}">`:'<i class="bi bi-award-fill"></i>'}</span>
        <span><strong>ระบบเกียรติบัตร</strong><small>STEP WORKFLOW</small></span></div>
      <div class="nav-group">ภาพรวม</div>
      <div class="admin-nav">${navA('dashboard','bi-speedometer2','แดชบอร์ดขั้นตอน')}</div>
      <div class="nav-group">ขั้นตอนการทำงาน</div>
      <div class="admin-nav">
        ${navA('step1','','ขั้นที่ 1 ลายเซ็น','1')}
        ${navA('step2','','ขั้นที่ 2 ตั้งค่าเลข/กิจกรรม','2')}
        ${navA('step3','','ขั้นที่ 3 รายชื่อ/CSV','3')}
        ${navA('step4','','ขั้นที่ 4 พิมพ์เกียรติบัตร','4')}</div>
      ${adminOnly}
      <div class="nav-group">ระบบ</div>
      <div class="admin-nav"><button class="danger" onclick="logout()"><i class="bi bi-box-arrow-right"></i> ออกจากระบบ</button></div>
    </aside>
    <div>
      <div class="admin-topbar no-print">
        <div class="crumb">หน้าหลัก / <b>${esc(STEP_TITLES[tab]||'')}</b></div>
        <div class="right">
          <a href="#/" class="btn btn-light btn-sm" style="border-radius:10px"><i class="bi bi-house"></i> หน้าสาธารณะ</a>
          <span class="date-chip" style="margin:0"><i class="bi bi-calendar3"></i> ${esc(thaiDate(todayThaiInput()))}</span>
          <div class="admin-avatar">${esc((d.me.name||'A').slice(0,1))}</div>
        </div>
      </div>
      <main class="admin-main"><div class="admin-bgpat"></div><div class="admin-inner" id="adminMain"></div></main>
    </div>
  </div>`);

  if(tab==='step1')adminStep1();
  else if(tab==='step2')adminStep2();
  else if(tab==='step3')adminStep3();
  else if(tab==='step4')adminStep4();
  else if(tab==='users'&&d.isAdmin)adminUsers();
  else if(tab==='settings'&&d.isAdmin)adminSettings();
  else adminDashboard();
}

/* ---------- DASHBOARD ---------- */
function adminDashboard(){
  const d=ADMIN.data;
  const nSig=d.signatures.length,nAct=d.activities.length,nCert=d.certificates.length;
  const steps=[nSig>0,nAct>0,nCert>0,nCert>0];
  const done=steps.filter(Boolean).length;
  const stepCard=(n,icon,title,desc,ok)=>`<div class="step-card c${n}" onclick="location.hash='#/admin/step${n}'">
    <div class="tag">ขั้นที่ ${n}</div><div class="ic"><i class="bi ${icon}"></i></div>
    <h4>${title}</h4><div class="desc">${desc}</div>
    <div class="step-status ${ok?'done':'todo'}"><i class="bi ${ok?'bi-check-circle-fill':'bi-clock'}"></i> ${ok?'เสร็จแล้ว':'รอดำเนินการ'}</div></div>`;

  el('adminMain').innerHTML=`
  <div class="welcome-banner">
    <div class="date-chip"><i class="bi bi-calendar3"></i> ${esc(thaiDate(todayThaiInput()))}</div>
    <h1>ยินดีต้อนรับ, <span>${esc(d.me.name)}</span></h1>
    <p>ระบบออกเกียรติบัตรออนไลน์แบบมืออาชีพ รองรับพื้นหลังเกียรติบัตร เลขรันอัตโนมัติ รายชื่อผู้รับ และลายเซ็นดิจิทัล</p>
    <div class="wb-actions"><a href="#/bulk?print=1" class="btn btn-light btn-sm" style="border-radius:10px"><i class="bi bi-printer"></i> ส่งออก/พิมพ์</a>
      <a href="#/admin/step3" class="btn btn-brand btn-sm" style="border-radius:10px"><i class="bi bi-plus-lg"></i> เพิ่มรายชื่อใหม่</a></div>
  </div>

  <div class="hero-row">
    <div class="step-hero">
      <div class="pill"><i class="bi bi-list-ol"></i> ทำงานตามลำดับ 4 ขั้นตอน</div>
      <h2>เริ่มสร้างเกียรติบัตรแบบเป็นขั้นเป็นตอน</h2>
      <p>ระบบจะพาไปทีละขั้น ตั้งแต่เพิ่มลายเซ็น ตั้งค่าเลขและสร้างกิจกรรมในหน้าเดียว นำเข้ารายชื่อ จนถึงพิมพ์เกียรติบัตร ลดความสับสนและตรวจสอบงานได้ง่าย</p>
      <div class="progress-wrap"><div class="top"><span>ความพร้อมของระบบ</span><span>${done}/4 ขั้นตอน</span></div>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${done/4*100}%"></div></div></div>
    </div>
    <div class="next-card"><div class="lbl">เลขเกียรติบัตรถัดไป</div>
      <div class="code">${esc(toThai(d.nextCode||'-'))}</div>
      <button class="btn" onclick="location.hash='#/admin/step3'"><i class="bi bi-plus-circle"></i> เพิ่มรายชื่อ</button></div>
  </div>

  <div class="step-cards">
    ${stepCard(1,'bi-pen','เพิ่มลายเซ็นผู้ลงนาม','วาดลายมือหรืออัปโหลดลายเซ็น ผู้บริหาร/วิทยากร ก่อนนำไปเลือกในกิจกรรม',steps[0])}
    ${stepCard(2,'bi-image','ตั้งค่าเลขและสร้างกิจกรรม','กำหนดเลขเกียรติบัตร สร้างกิจกรรม อัปโหลดพื้นหลัง เลือกลายเซ็น และดูตัวอย่าง A4 ในหน้าเดียว',steps[1])}
    ${stepCard(3,'bi-table','เพิ่มรายชื่อหรือนำเข้า CSV','เลือกรายชื่อให้ตรงกับกิจกรรม แล้วรันเลขที่ให้อัตโนมัติ',steps[2])}
    ${stepCard(4,'bi-printer','ตรวจสอบและพิมพ์เกียรติบัตร','ดูตัวอย่าง พิมพ์ หรือบันทึกเป็น PDF',steps[3])}
  </div>

  <div class="reco"><h4><span class="ic"><i class="bi bi-lightbulb"></i></span> ลำดับที่แนะนำ</h4>
    <div class="reco-list">
      <div class="item"><span class="n">1</span><div>เพิ่มลายเซ็นก่อน เพื่อให้เลือกผู้ลงนามในกิจกรรมได้ทันที</div></div>
      <div class="item"><span class="n">2</span><div>ตั้งค่าเลขและสร้างกิจกรรมในหน้าเดียว เพื่อให้ลดขั้นตอนและความสับสน</div></div>
      <div class="item"><span class="n">3</span><div>เลือกพื้นหลัง ลายเซ็น ฟอนต์ และดูตัวอย่าง A4 ก่อนบันทึก</div></div>
      <div class="item"><span class="n">4</span><div>นำเข้ารายชื่อ CSV โดยเลือกกิจกรรมก่อนทุกครั้ง</div></div>
      <div class="item"><span class="n">5</span><div>ตรวจสอบตัวอย่างก่อนพิมพ์หรือบันทึกเป็น PDF</div></div>
    </div></div>

  <div class="chart-grid">
    <div class="chart-card c1"><h5><i class="bi bi-bar-chart"></i> ภาพรวมตามผู้ใช้งาน</h5><canvas id="chTeacher"></canvas></div>
    <div class="chart-card c2"><h5><i class="bi bi-pie-chart"></i> สัดส่วนข้อมูลรวม</h5><canvas id="chDonut"></canvas></div>
    <div class="chart-card c3"><h5><i class="bi bi-graph-up"></i> แนวโน้มรายเดือน</h5><canvas id="chLine"></canvas></div>
    <div class="chart-card c4"><h5><i class="bi bi-diagram-3"></i> ภาพรวม 4 ด้าน</h5><canvas id="chRadar"></canvas></div>
  </div>`;
  drawCharts();
}
function drawCharts(){
  if(typeof Chart==='undefined')return;
  const d=ADMIN.data;
  const byTeacher={}; d.certificates.forEach(c=>{byTeacher[c.teacher]=(byTeacher[c.teacher]||0)+1;});
  const tNames=Object.keys(byTeacher); if(!tNames.length){tNames.push('—');byTeacher['—']=0;}
  const opt={responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{precision:0}}}};
  new Chart(el('chTeacher'),{type:'bar',data:{labels:tNames,datasets:[{data:tNames.map(n=>byTeacher[n]),backgroundColor:['#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981']}]},options:opt});
  new Chart(el('chDonut'),{type:'doughnut',data:{labels:['กิจกรรม','ลายเซ็น','รายชื่อ','ออกแล้ว'],
    datasets:[{data:[d.activities.length,d.signatures.length,d.certificates.length,d.certificates.length],
    backgroundColor:['#3b82f6','#10b981','#f59e0b','#ec4899']}]},options:{responsive:true,plugins:{legend:{position:'bottom',labels:{boxWidth:12,font:{size:10}}}}}});
  const months={};d.certificates.forEach(c=>{const m=String(c.created_at||'').slice(0,7)||'-';months[m]=(months[m]||0)+1;});
  const mk=Object.keys(months).sort(); if(!mk.length)mk.push('-');
  new Chart(el('chLine'),{type:'line',data:{labels:mk,datasets:[{data:mk.map(m=>months[m]||0),borderColor:'#8b5cf6',backgroundColor:'rgba(139,92,246,.15)',fill:true,tension:.35}]},options:opt});
  new Chart(el('chRadar'),{type:'radar',data:{labels:['กิจกรรม','ลายเซ็น','รายชื่อ','เกียรติบัตร'],
    datasets:[{data:[d.activities.length,d.signatures.length,d.certificates.length,d.certificates.length],
    borderColor:'#10b981',backgroundColor:'rgba(16,185,129,.2)'}]},options:{responsive:true,plugins:{legend:{display:false}}}});
}
async function doClearAll(){
  if(!confirm('ยืนยันล้างข้อมูล เกียรติบัตร/กิจกรรม/ลายเซ็น ทั้งหมด? (ผู้ใช้และการตั้งค่ายังอยู่)'))return;
  const u=Session.get(); const r=await apiPost('clearAll',{token:u.token});
  if(r&&r.ok){toast('ล้างข้อมูลแล้ว');renderAdmin('dashboard');}else toast(r.error||'ทำไม่สำเร็จ',false);
}

/* ---------- STEP 1 : SIGNATURES ---------- */
let SIGPAD=null;
function adminStep1(){
  const d=ADMIN.data;
  const rows=d.signatures.length?d.signatures.map(s=>`<tr>
    <td>${s.image?`<img class="sig-thumb" src="${esc(s.image)}">`:'<span class="text-muted">— ไม่มีรูป —</span>'}</td>
    <td><strong>${esc(s.name)}</strong><small>${esc(s.position)}</small></td>
    <td><span class="badge bg-light text-dark">${esc(s.type)}</span></td>
    <td class="text-end remix-actions">
      <button class="btn btn-sm btn-light" onclick='openSig(${JSON.stringify(s)})'><i class="bi bi-pencil"></i></button>
      <button class="btn btn-sm btn-outline-danger" onclick="delSig('${s.id}')"><i class="bi bi-trash"></i></button></td></tr>`).join('')
    :`<tr><td colspan="4" class="empty-row">ยังไม่มีลายเซ็น</td></tr>`;
  el('adminMain').innerHTML=`
  <div class="admin-head"><h1>จัดการลายเซ็นผู้บริหาร/วิทยากร</h1></div>
  <div class="two-col">
    <div class="admin-card">
      <div class="card-h"><span class="ic"><i class="bi bi-pencil"></i></span> เพิ่ม/แก้ไขลายเซ็น</div>
      <input type="hidden" id="sigId"><input type="hidden" id="sigImage">
      <label class="form-label">ชื่อผู้ลงนาม</label><input id="sigName" class="form-control mb-3" placeholder="เช่น นายสมชาย ใจดี">
      <label class="form-label">ตำแหน่ง</label><input id="sigPos" class="form-control mb-3" placeholder="เช่น ผู้อำนวยการ / วิทยากร">
      <label class="form-label">ประเภทผู้ลงนาม</label>
      <select id="sigType" class="form-select mb-3"><option value="director">ผู้บริหาร</option><option value="teacher">ครู</option><option value="guest">วิทยากร</option></select>
      <label class="form-label">วาดลายเซ็น</label>
      <canvas id="sigPad" class="sigpad mb-2"></canvas>
      <div class="d-flex gap-2 mb-3"><button class="btn btn-light btn-sm" onclick="clearSig()"><i class="bi bi-eraser"></i> ล้างลายเซ็น</button>
        <span class="text-muted small align-self-center">หรืออัปโหลดไฟล์ PNG/JPG ด้านล่าง</span></div>
      <label class="form-label">อัปโหลดลายเซ็น PNG/JPG</label>
      <input type="file" id="sigFile" accept="image/*" class="form-control mb-2" onchange="sigFileChange(event)">
      <img id="sigPreview" class="sig-thumb d-none mb-2" alt="">
      <button class="btn btn-brand w-100" id="sigSaveBtn" onclick="saveSig()"><i class="bi bi-save"></i> บันทึกลายเซ็น</button>
    </div>
    <div>
      <div class="admin-card"><div class="card-h"><span class="ic"><i class="bi bi-eye"></i></span> ตัวอย่างลายเซ็นบนเกียรติบัตร</div>
        <div style="background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px;text-align:center">
          <div style="border-bottom:1.5px solid #888;width:60%;margin:30px auto 6px"></div>
          <div class="fw-bold" id="sigPvName">ชื่อผู้ลงนาม</div><div class="text-muted small" id="sigPvPos">ตำแหน่งผู้ลงนาม</div>
        </div></div>
      <div class="admin-card p-0"><div class="card-h" style="padding:16px 18px 0"><span class="ic"><i class="bi bi-list-task"></i></span> รายการลายเซ็น</div>
        <div class="table-responsive"><table class="table remix-table align-middle mb-0">
          <thead><tr><th>ลายเซ็น</th><th>ชื่อ-ตำแหน่ง</th><th>ประเภท</th><th class="text-end">จัดการ</th></tr></thead>
          <tbody>${rows}</tbody></table></div></div>
    </div>
  </div>`;
  initSigPad();
  ['sigName','sigPos'].forEach(id=>el(id).addEventListener('input',()=>{el('sigPvName').textContent=el('sigName').value||'ชื่อผู้ลงนาม';el('sigPvPos').textContent=el('sigPos').value||'ตำแหน่งผู้ลงนาม';}));
}
function initSigPad(){
  const cv=el('sigPad'); const rect=cv.getBoundingClientRect();
  cv.width=rect.width||500; cv.height=200;
  const ctx=cv.getContext('2d'); ctx.lineWidth=2.4;ctx.lineCap='round';ctx.strokeStyle='#1a2240';
  let drawing=false,last=null;
  function pos(e){const r=cv.getBoundingClientRect();const t=e.touches?e.touches[0]:e;return{x:t.clientX-r.left,y:t.clientY-r.top};}
  function start(e){drawing=true;last=pos(e);e.preventDefault();}
  function move(e){if(!drawing)return;const p=pos(e);ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;el('sigImage').value='';e.preventDefault();}
  function end(){drawing=false;}
  cv.onmousedown=start;cv.onmousemove=move;window.addEventListener('mouseup',end);
  cv.ontouchstart=start;cv.ontouchmove=move;cv.ontouchend=end;
  SIGPAD={cv,ctx};
}
function clearSig(){if(SIGPAD){SIGPAD.ctx.clearRect(0,0,SIGPAD.cv.width,SIGPAD.cv.height);}el('sigImage').value='';el('sigPreview').classList.add('d-none');el('sigFile').value='';}
function sigFileChange(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{el('sigImage').value=r.result;const p=el('sigPreview');p.src=r.result;p.classList.remove('d-none');};r.readAsDataURL(f);}
function padHasInk(){const c=SIGPAD&&SIGPAD.cv;if(!c)return false;const d=SIGPAD.ctx.getImageData(0,0,c.width,c.height).data;for(let i=3;i<d.length;i+=4)if(d[i]!==0)return true;return false;}
function openSig(s){el('sigId').value=s.id;el('sigName').value=s.name;el('sigPos').value=s.position;el('sigType').value=s.type;el('sigImage').value=s.image||'';
  el('sigPvName').textContent=s.name;el('sigPvPos').textContent=s.position;
  if(s.image){const p=el('sigPreview');p.src=s.image;p.classList.remove('d-none');}window.scrollTo({top:0,behavior:'smooth'});}
async function saveSig(){
  const u=Session.get();
  if(!el('sigName').value.trim()){toast('กรอกชื่อผู้ลงนาม',false);return;}
  let image=el('sigImage').value;
  if(!image && padHasInk()) image=SIGPAD.cv.toDataURL('image/png');
  const btn=el('sigSaveBtn');btn.disabled=true;btn.innerHTML='กำลังบันทึก...';
  let url=image;
  if(image && image.startsWith('data:')){ const up=await uploadToDrive(image,'sign_'+Date.now()+'.png'); if(up&&up.ok)url=up.url; }
  const r=await apiPost('saveSignature',{token:u.token,id:el('sigId').value,name:el('sigName').value,position:el('sigPos').value,type:el('sigType').value,image:url});
  btn.disabled=false;btn.innerHTML='<i class="bi bi-save"></i> บันทึกลายเซ็น';
  if(r&&r.ok){toast('บันทึกลายเซ็นแล้ว');renderAdmin('step1');}else toast(r.error||'บันทึกไม่สำเร็จ',false);
}
async function delSig(id){if(!confirm('ลบลายเซ็นนี้?'))return;const u=Session.get();const r=await apiPost('deleteSignature',{token:u.token,id});if(r&&r.ok){toast('ลบแล้ว');renderAdmin('step1');}else toast(r.error||'ลบไม่สำเร็จ',false);}

/* ---------- STEP 2 : ACTIVITY BUILDER ---------- */
let A2={bg:'',sub:'info'};
function adminStep2(){
  const d=ADMIN.data;
  const sigOpts=['<option value="">-- ไม่เลือก --</option>'].concat(d.signatures.map(s=>`<option value="${esc(s.name)}">${esc(s.name)} (${esc(s.position)})</option>`)).join('');
  const actRows=d.activities.length?d.activities.map(a=>`<tr>
    <td><span class="remix-code">${esc(a.prefix)}</span></td><td><strong>${esc(a.title)}</strong><small>${esc(a.course)}</small></td>
    <td>${esc(a.sign1||'-')}</td>
    <td class="text-end remix-actions"><button class="btn btn-sm btn-light" onclick='editAct(${JSON.stringify(a)})'><i class="bi bi-pencil"></i></button>
      <button class="btn btn-sm btn-outline-danger" onclick="delAct('${a.id}')"><i class="bi bi-trash"></i></button></td></tr>`).join('')
    :`<tr><td colspan="4" class="empty-row">ยังไม่มีกิจกรรม</td></tr>`;
  A2={bg:'',sub:'info'};
  el('adminMain').innerHTML=`
  <div class="admin-head"><h1>ตั้งค่าเลขและสร้างกิจกรรม</h1>
    <button class="btn btn-light" onclick="resetAct()"><i class="bi bi-plus-lg"></i> กิจกรรมใหม่</button></div>
  <div class="alert alert-primary" style="border-radius:14px"><i class="bi bi-info-circle"></i> กรอกข้อมูลด้านซ้าย ระบบจะอัปเดตตัวอย่าง A4 ด้านขวาแบบสด เมื่อบันทึกแล้วจะตั้งเป็นแบบใช้งานทันที</div>
  <div class="subtabs">
    <button class="active" data-sub="info" onclick="a2tab('info')"><span class="n">1</span> ข้อมูลกิจกรรม</button>
    <button data-sub="bg" onclick="a2tab('bg')"><span class="n">2</span> พื้นหลัง/ลายเซ็น</button>
    <button data-sub="code" onclick="a2tab('code')"><span class="n">3</span> เลขเกียรติบัตร</button>
    <button data-sub="font" onclick="a2tab('font')"><span class="n">4</span> ฟอนต์/ตำแหน่ง</button>
  </div>
  <div class="two-col">
    <div>
      <input type="hidden" id="actId"><input type="hidden" id="actBg">
      <div class="admin-card sub-info">
        <label class="form-label">หัวข้อเกียรติบัตร</label><input id="actTitle" class="form-control mb-3" value="เกียรติบัตร" oninput="updatePreview()">
        <label class="form-label">ชื่อหลักสูตร/กิจกรรม</label><input id="actCourse" class="form-control mb-3" placeholder="เช่น อบรมการสร้างใบลาออนไลน์" oninput="updatePreview()">
        <label class="form-label">หน่วยงานผู้จัด</label><input id="actOrg" class="form-control mb-3" value="${esc(d.me.organization||'')}" oninput="updatePreview()">
        <label class="form-label">ข้อความรายละเอียดเริ่มต้น</label><textarea id="actDetail" class="form-control mb-3" rows="2" oninput="updatePreview()">ได้ผ่านการอบรมตามหลักสูตรที่กำหนด</textarea>
        <label class="form-label">สถานที่ออกเกียรติบัตร</label><input id="actPlace" class="form-control" placeholder="เช่น ห้องประชุม สพป.พะเยา เขต 2" oninput="updatePreview()">
      </div>
      <div class="admin-card sub-bg hidden">
        <label class="form-label">พื้นหลังเกียรติบัตร (A4 แนวนอน)</label>
        <input type="file" id="actBgFile" accept="image/*" class="form-control mb-1" onchange="actBgChange(event)">
        <div class="text-muted small mb-3">แนะนำ 3508×2480 px หรือ 1920×1357 px • หากไม่อัปโหลด ระบบใช้กรอบสีกรม-ทองอัตโนมัติ</div>
        <button class="btn btn-light btn-sm mb-3" onclick="clearBg()"><i class="bi bi-x-circle"></i> ใช้กรอบเริ่มต้น</button>
        <div class="row"><div class="col-6"><label class="form-label">ลายเซ็นที่ 1</label><select id="actSign1" class="form-select" onchange="updatePreview()">${sigOpts}</select></div>
          <div class="col-6"><label class="form-label">ลายเซ็นที่ 2</label><select id="actSign2" class="form-select" onchange="updatePreview()">${sigOpts}</select></div></div>
      </div>
      <div class="admin-card sub-code hidden">
        <label class="form-label">Prefix (รหัสนำหน้าเลขเกียรติบัตร)</label>
        <input id="actPrefix" class="form-control mb-2" value="กจ" oninput="updatePreview()">
        <div class="text-muted small">ระบบจะรันเลขอัตโนมัติเป็นรูปแบบ <b>Prefix-ปีพ.ศ.-เลขลำดับ</b> เช่น กจ-2569-0001</div>
      </div>
      <div class="admin-card sub-font hidden">
        <label class="form-label">สีชื่อผู้รับเกียรติบัตร</label>
        <input type="color" id="actColor" class="form-control form-control-color mb-3" value="#3b2f8c" oninput="updatePreview()">
        <div class="text-muted small">ตำแหน่งข้อความถูกจัดวางกึ่งกลางอัตโนมัติให้พอดีกับกระดาษ A4</div>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-brand flex-fill" id="actSaveBtn" onclick="saveAct()"><i class="bi bi-save"></i> บันทึกและใช้แบบนี้</button>
      </div>
      <div class="admin-card mt-3 p-0"><div class="card-h" style="padding:14px 16px 0"><span class="ic"><i class="bi bi-list"></i></span> รายการแบบเกียรติบัตร</div>
        <div class="table-responsive"><table class="table remix-table align-middle mb-0">
          <thead><tr><th>รหัส</th><th>รายละเอียด</th><th>ลายเซ็น</th><th class="text-end">จัดการ</th></tr></thead><tbody>${actRows}</tbody></table></div></div>
    </div>
    <div>
      <div class="admin-card"><div class="card-h"><span class="ic"><i class="bi bi-eye"></i></span> ตัวอย่าง A4 แบบสด</div>
        <div class="certificate" id="certPreview"></div>
        <div class="text-muted small mt-2"><i class="bi bi-info-circle"></i> ตัวอย่างใช้ชื่อ “${esc(SAMPLE_NAME)}” แล้วค่อยอัปเดตให้เหมือนจริงเมื่อพิมพ์</div>
      </div>
    </div>
  </div>`;
  updatePreview();
}
function a2tab(t){A2.sub=t;document.querySelectorAll('.subtabs button').forEach(b=>b.classList.toggle('active',b.dataset.sub===t));
  ['info','bg','code','font'].forEach(s=>document.querySelectorAll('.sub-'+s).forEach(x=>x.classList.toggle('hidden',s!==t)));}
function resolveSig(name){if(!name)return null;const s=(ADMIN.data.signatures||[]).find(x=>x.name===name);return s?{name:s.name,position:s.position,image:s.image}:{name,position:'',image:''};}
function previewObj(){return{title:el('actTitle').value,course:el('actCourse').value,organizer:el('actOrg').value,
  detail:el('actDetail').value,place:el('actPlace').value,background:A2.bg||el('actBg').value,
  name_color:el('actColor')?el('actColor').value:'#3b2f8c',
  sign1:resolveSig(el('actSign1')?el('actSign1').value:''),sign2:resolveSig(el('actSign2')?el('actSign2').value:''),
  code:(el('actPrefix')?el('actPrefix').value:'กจ')+'-'+(new Date().getFullYear()+543)+'-0001',
  issue_date:todayThaiInput(),logo:(ADMIN.data.settings||{}).logo_url||'',_sampleName:SAMPLE_NAME};}
function updatePreview(){const pv=el('certPreview');if(pv)pv.innerHTML=renderCertInner(previewObj());}
function actBgChange(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{A2.bg=r.result;el('actBg').value=r.result;updatePreview();};r.readAsDataURL(f);}
function clearBg(){A2.bg='';el('actBg').value='';if(el('actBgFile'))el('actBgFile').value='';updatePreview();}
function resetAct(){adminStep2();}
function editAct(a){
  el('actId').value=a.id;el('actTitle').value=a.title;el('actCourse').value=a.course;el('actOrg').value=a.organizer;
  el('actDetail').value=a.detail;el('actPlace').value=a.place;el('actPrefix').value=a.prefix;
  if(el('actColor'))el('actColor').value=a.name_color||'#3b2f8c';
  el('actBg').value=a.background||'';A2.bg=a.background||'';
  if(el('actSign1'))el('actSign1').value=a.sign1||'';if(el('actSign2'))el('actSign2').value=a.sign2||'';
  updatePreview();window.scrollTo({top:0,behavior:'smooth'});
}
async function saveAct(){
  const u=Session.get();
  const btn=el('actSaveBtn');btn.disabled=true;btn.innerHTML='กำลังบันทึก...';
  let bg=el('actBg').value;
  if(bg && bg.startsWith('data:')){const up=await uploadToDrive(bg,'bg_'+Date.now()+'.png');if(up&&up.ok)bg=up.url;}
  const r=await apiPost('saveActivity',{token:u.token,id:el('actId').value,title:el('actTitle').value,course:el('actCourse').value,
    organizer:el('actOrg').value,detail:el('actDetail').value,place:el('actPlace').value,background:bg,
    sign1:el('actSign1')?el('actSign1').value:'',sign2:el('actSign2')?el('actSign2').value:'',
    prefix:el('actPrefix').value,name_color:el('actColor')?el('actColor').value:'#3b2f8c'});
  btn.disabled=false;btn.innerHTML='<i class="bi bi-save"></i> บันทึกและใช้แบบนี้';
  if(r&&r.ok){toast('บันทึกกิจกรรมแล้ว');renderAdmin('step2');}else toast(r.error||'บันทึกไม่สำเร็จ',false);
}
async function delAct(id){if(!confirm('ลบกิจกรรมนี้?'))return;const u=Session.get();const r=await apiPost('deleteActivity',{token:u.token,id});if(r&&r.ok){toast('ลบแล้ว');renderAdmin('step2');}else toast(r.error||'ลบไม่สำเร็จ',false);}

/* ---------- STEP 3 : NAMES / CSV ---------- */
function adminStep3(){
  const d=ADMIN.data;
  if(!d.activities.length){el('adminMain').innerHTML=`<div class="admin-head"><h1>เพิ่มรายชื่อ / นำเข้า CSV</h1></div>
    <div class="admin-card text-muted">กรุณาสร้างกิจกรรมในขั้นที่ 2 ก่อนเพิ่มรายชื่อ <a href="#/admin/step2">ไปขั้นที่ 2</a></div>`;return;}
  const actOpts=d.activities.map(a=>`<option value="${a.id}">${esc(a.title)} - ${esc(a.course)} (${esc(a.prefix)})</option>`).join('');
  const certRows=d.certificates.length?d.certificates.map(c=>`<tr>
    <td><span class="remix-code">${esc(c.code)}</span></td><td><strong>${esc(c.name)}</strong><small>${esc(c.organization)}</small></td>
    <td>${esc(thaiDate(c.issue_date))}</td>
    <td class="text-end remix-actions"><a class="btn btn-sm btn-primary" href="#/cert/${c.id}" target="_blank"><i class="bi bi-eye"></i></a>
      <button class="btn btn-sm btn-outline-danger" onclick="delCert('${c.id}')"><i class="bi bi-trash"></i></button></td></tr>`).join('')
    :`<tr><td colspan="4" class="empty-row">ยังไม่มีรายชื่อ</td></tr>`;
  el('adminMain').innerHTML=`
  <div class="admin-head"><h1>เพิ่มรายชื่อ / นำเข้า CSV</h1></div>
  <div class="two-col">
    <div class="admin-card">
      <div class="card-h"><span class="ic"><i class="bi bi-person-plus"></i></span> เพิ่มรายชื่อรายคน</div>
      <label class="form-label">กิจกรรม</label><select id="c3Act" class="form-select mb-3">${actOpts}</select>
      <label class="form-label">ชื่อ-นามสกุล ผู้รับ</label><input id="c3Name" class="form-control mb-3" placeholder="เช่น ${esc(SAMPLE_NAME)}">
      <label class="form-label">หน่วยงาน/โรงเรียน</label><input id="c3Org" class="form-control mb-3" value="${esc(d.me.organization||'')}">
      <label class="form-label">วันที่ออก (พ.ศ.)</label><input id="c3Date" class="form-control mb-3" value="${todayThaiInput()}">
      <button class="btn btn-brand w-100" id="c3SaveBtn" onclick="addOneCert()"><i class="bi bi-plus-lg"></i> เพิ่มและออกเลขอัตโนมัติ</button>
    </div>
    <div class="admin-card">
      <div class="card-h"><span class="ic"><i class="bi bi-filetype-csv"></i></span> นำเข้าหลายรายชื่อ (CSV / วาง)</div>
      <input type="file" id="csvFile" accept=".csv,text/csv" class="form-control mb-2" onchange="csvFileChange(event)">
      <label class="form-label">หรือวางรายชื่อ (บรรทัดละ 1 คน รูปแบบ: ชื่อ,หน่วยงาน)</label>
      <textarea id="csvText" class="form-control mb-3" rows="6" placeholder="${esc(SAMPLE_NAME)},โรงเรียนราชประชานุเคราะห์ 24&#10;นางสาวสมหญิง ตั้งใจ,โรงเรียน..."></textarea>
      <button class="btn btn-success w-100" id="csvBtn" onclick="importCSV()"><i class="bi bi-upload"></i> นำเข้าทั้งหมด</button>
    </div>
  </div>
  <div class="admin-card p-0"><div class="card-h" style="padding:16px 18px 0"><span class="ic"><i class="bi bi-list-check"></i></span> รายชื่อที่ออกเกียรติบัตรแล้ว</div>
    <div class="table-responsive"><table class="table remix-table align-middle mb-0">
      <thead><tr><th>เลขที่</th><th>ผู้รับ</th><th>วันที่</th><th class="text-end">จัดการ</th></tr></thead><tbody>${certRows}</tbody></table></div></div>`;
}
async function addOneCert(){
  const u=Session.get();if(!el('c3Name').value.trim()){toast('กรอกชื่อผู้รับ',false);return;}
  const btn=el('c3SaveBtn');btn.disabled=true;btn.innerHTML='กำลังบันทึก...';
  const r=await apiPost('saveCertificate',{token:u.token,activity_id:el('c3Act').value,name:el('c3Name').value,organization:el('c3Org').value,issue_date:el('c3Date').value});
  btn.disabled=false;btn.innerHTML='<i class="bi bi-plus-lg"></i> เพิ่มและออกเลขอัตโนมัติ';
  if(r&&r.ok){toast('ออกเกียรติบัตร '+(r.code||''));renderAdmin('step3');}else toast(r.error||'บันทึกไม่สำเร็จ',false);
}
function csvFileChange(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{el('csvText').value=r.result.replace(/^\uFEFF/,'');};r.readAsText(f,'UTF-8');}
function parseCSV(text){return text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean).map(l=>{const p=l.split(',');return{name:(p[0]||'').trim(),organization:(p[1]||'').trim()};}).filter(r=>r.name && !/^(ชื่อ|name)$/i.test(r.name));}
async function importCSV(){
  const u=Session.get();const rows=parseCSV(el('csvText').value);
  if(!rows.length){toast('ไม่พบรายชื่อ',false);return;}
  const btn=el('csvBtn');btn.disabled=true;btn.innerHTML='กำลังนำเข้า...';
  const r=await apiPost('importCertificates',{token:u.token,activity_id:el('c3Act').value,rows,organization:el('c3Org')?el('c3Org').value:''});
  btn.disabled=false;btn.innerHTML='<i class="bi bi-upload"></i> นำเข้าทั้งหมด';
  if(r&&r.ok){toast('นำเข้า '+r.count+' รายชื่อ');renderAdmin('step3');}else toast(r.error||'นำเข้าไม่สำเร็จ',false);
}
async function delCert(id){if(!confirm('ลบรายชื่อนี้?'))return;const u=Session.get();const r=await apiPost('deleteCertificate',{token:u.token,id});if(r&&r.ok){toast('ลบแล้ว');renderAdmin(ADMIN.tab);}else toast(r.error||'ลบไม่สำเร็จ',false);}

/* ---------- STEP 4 : PRINT ---------- */
function adminStep4(){
  const d=ADMIN.data;
  el('adminMain').innerHTML=`<div class="admin-head"><h1>พิมพ์เกียรติบัตร</h1>
    <div class="d-flex gap-2"><a href="#/bulk" target="_blank" class="btn btn-light"><i class="bi bi-files"></i> เปิดไฟล์รวม</a>
      <a href="#/bulk?print=1" target="_blank" class="btn btn-brand"><i class="bi bi-printer"></i> พิมพ์ทั้งหมด</a></div></div>
    <div class="admin-card"><div class="card-h"><span class="ic"><i class="bi bi-printer"></i></span> เลือกพิมพ์รายบุคคล (${d.certificates.length} ใบ)</div>
      <div class="table-responsive"><table class="table remix-table align-middle mb-0">
        <thead><tr><th>เลขที่</th><th>ผู้รับ</th><th>กิจกรรม</th><th class="text-end">พิมพ์</th></tr></thead>
        <tbody>${d.certificates.length?d.certificates.map(c=>`<tr><td><span class="remix-code">${esc(c.code)}</span></td>
          <td><strong>${esc(c.name)}</strong></td><td>${esc((d.activities.find(a=>String(a.id)===String(c.activity_id))||{}).course||'')}</td>
          <td class="text-end remix-actions"><a class="btn btn-sm btn-primary" href="#/cert/${c.id}" target="_blank"><i class="bi bi-eye"></i> ดู</a>
            <a class="btn btn-sm btn-success" href="#/cert/${c.id}?print=1" target="_blank"><i class="bi bi-printer"></i> พิมพ์</a></td></tr>`).join('')
          :`<tr><td colspan="4" class="empty-row">ยังไม่มีเกียรติบัตร</td></tr>`}</tbody></table></div></div>`;
}

/* ---------- USERS ---------- */
function adminUsers(){
  const d=ADMIN.data;
  const rows=d.users.map(u=>`<tr><td><strong>${esc(u.name)}</strong><small>@${esc(u.username)}</small></td>
    <td>${esc(u.organization)}</td><td>${u.role==='admin'?'<span class="remix-owner">ผู้ดูแลระบบ</span>':'ครู'}</td>
    <td class="text-end remix-actions"><button class="btn btn-sm btn-light" onclick='openUser(${JSON.stringify(u)})'><i class="bi bi-pencil"></i></button>
      <button class="btn btn-sm btn-outline-danger" onclick="delUser('${u.id}')"><i class="bi bi-trash"></i></button></td></tr>`).join('');
  el('adminMain').innerHTML=`<div class="admin-head"><h1>จัดการบัญชีครู</h1>
    <button class="btn btn-brand" onclick="openUser()"><i class="bi bi-plus-lg"></i> เพิ่มผู้ใช้</button></div>
    <div class="admin-card p-0"><div class="table-responsive"><table class="table remix-table align-middle mb-0">
      <thead><tr><th>ชื่อ</th><th>หน่วยงาน</th><th>สิทธิ์</th><th class="text-end">จัดการ</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <div class="modal fade" id="userModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered">
      <div class="modal-content" style="border-radius:18px;border:0"><div class="modal-header"><h5 class="modal-title fw-bold" id="userModalLabel">ผู้ใช้งาน</h5>
        <button class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body">
        <input type="hidden" id="uId"><label class="form-label">ชื่อ-นามสกุล</label><input id="uName" class="form-control mb-3">
        <div class="row"><div class="col-6 mb-3"><label class="form-label">ชื่อผู้ใช้</label><input id="uUsername" class="form-control"></div>
          <div class="col-6 mb-3"><label class="form-label">รหัสผ่าน</label><input id="uPass" class="form-control" placeholder="เว้นว่าง=คงเดิม"></div></div>
        <label class="form-label">หน่วยงาน</label><input id="uOrg" class="form-control mb-3">
        <label class="form-label">สิทธิ์</label><select id="uRole" class="form-select"><option value="teacher">ครู</option><option value="admin">ผู้ดูแลระบบ</option></select>
        </div><div class="modal-footer"><button class="btn btn-light" data-bs-dismiss="modal">ยกเลิก</button>
        <button class="btn btn-brand px-4" onclick="saveUserForm()">บันทึก</button></div></div></div></div>`;
}
function openUser(u){
  const m=bootstrap.Modal.getOrCreateInstance(el('userModal'));m.show();
  setTimeout(()=>{el('uId').value=u?u.id:'';el('uName').value=u?u.name:'';el('uUsername').value=u?u.username:'';el('uPass').value='';
    el('uOrg').value=u?u.organization:'';el('uRole').value=u?u.role:'teacher';
    el('userModalLabel').textContent=u?'แก้ไขผู้ใช้':'เพิ่มผู้ใช้';},150);
}
async function saveUserForm(){
  const u=Session.get();
  const r=await apiPost('saveUser',{token:u.token,id:el('uId').value,name:el('uName').value,username:el('uUsername').value,
    password:el('uPass').value,organization:el('uOrg').value,role:el('uRole').value});
  if(r&&r.ok){bootstrap.Modal.getInstance(el('userModal')).hide();toast('บันทึกผู้ใช้แล้ว');renderAdmin('users');}else toast(r.error||'บันทึกไม่สำเร็จ',false);
}
async function delUser(id){if(!confirm('ลบผู้ใช้นี้?'))return;const u=Session.get();const r=await apiPost('deleteUser',{token:u.token,id});if(r&&r.ok){toast('ลบแล้ว');renderAdmin('users');}else toast(r.error||'ลบไม่สำเร็จ',false);}

/* ---------- SETTINGS : LOGO / HEADER ---------- */
let SET_IMG={logo:'',banner:''};
function adminSettings(){
  const s=ADMIN.data.settings||{};
  SET_IMG={logo:s.logo_url||'',banner:s.banner_url||''};
  el('adminMain').innerHTML=`
  <div class="admin-head"><h1>โลโก้ / หัวเว็บ</h1></div>
  <div class="two-col">
    <div class="admin-card">
      <div class="card-h"><span class="ic"><i class="bi bi-type"></i></span> ชื่อระบบ/หน่วยงาน</div>
      <label class="form-label">ชื่อโรงเรียน/หน่วยงาน (แสดงบนแบนเนอร์)</label>
      <input id="setSchool" class="form-control mb-3" value="${esc(s.school_name||'')}">
      <label class="form-label">คำอธิบายระบบ (subtitle)</label>
      <input id="setSub" class="form-control mb-3" value="${esc(s.subtitle||'')}">
      <button class="btn btn-brand w-100" id="setSaveBtn" onclick="saveSettingsForm()"><i class="bi bi-save"></i> บันทึกการตั้งค่า</button>
    </div>
    <div class="admin-card">
      <div class="card-h"><span class="ic"><i class="bi bi-image"></i></span> โลโก้ และปกหน้าเว็บ</div>
      <label class="form-label">โลโก้ (ตราโรงเรียน) — แนะนำ PNG พื้นใส</label>
      <input type="file" id="logoFile" accept="image/*" class="form-control mb-2" onchange="setImgChange(event,'logo')">
      <div class="mb-3" style="text-align:center;background:#f7f8ff;border-radius:12px;padding:10px">
        <img id="logoPreview" src="${esc(s.logo_url||'')}" style="height:70px;object-fit:contain;${s.logo_url?'':'display:none'}">
        <div class="text-muted small ${s.logo_url?'d-none':''}" id="logoEmpty">ยังไม่มีโลโก้</div>
      </div>
      <label class="form-label">ปกหน้าเว็บ / แบนเนอร์ (ภาพแนวนอน)</label>
      <input type="file" id="bannerFile" accept="image/*" class="form-control mb-2" onchange="setImgChange(event,'banner')">
      <div style="text-align:center;background:#f7f8ff;border-radius:12px;padding:10px">
        <img id="bannerPreview" src="${esc(s.banner_url||'')}" style="width:100%;max-height:130px;object-fit:cover;border-radius:8px;${s.banner_url?'':'display:none'}">
        <div class="text-muted small ${s.banner_url?'d-none':''}" id="bannerEmpty">ยังไม่มีปกหน้าเว็บ</div>
      </div>
      <div class="text-muted small mt-2"><i class="bi bi-info-circle"></i> รูปจะถูกอัปโหลดเข้า Google Drive ของคุณ แล้วบันทึกลิงก์ให้อัตโนมัติเมื่อกด “บันทึกการตั้งค่า”</div>
    </div>
  </div>`;
}
function setImgChange(e,kind){
  const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{SET_IMG[kind]=r.result;
    const pv=el(kind+'Preview'),em=el(kind+'Empty');
    pv.src=r.result;pv.style.display='';if(em)em.classList.add('d-none');};
  r.readAsDataURL(f);
}
async function saveSettingsForm(){
  const u=Session.get();
  const btn=el('setSaveBtn');btn.disabled=true;btn.innerHTML='กำลังบันทึก...';
  let logo=SET_IMG.logo, banner=SET_IMG.banner;
  if(logo && logo.startsWith('data:')){const up=await uploadToDrive(logo,'logo_'+Date.now()+'.png');if(up&&up.ok)logo=up.url;}
  if(banner && banner.startsWith('data:')){const up=await uploadToDrive(banner,'banner_'+Date.now()+'.png');if(up&&up.ok)banner=up.url;}
  const r=await apiPost('saveSettings',{token:u.token,school_name:el('setSchool').value,subtitle:el('setSub').value,logo_url:logo,banner_url:banner});
  btn.disabled=false;btn.innerHTML='<i class="bi bi-save"></i> บันทึกการตั้งค่า';
  if(r&&r.ok){toast('บันทึกการตั้งค่าแล้ว');renderAdmin('settings');}else toast(r.error||'บันทึกไม่สำเร็จ',false);
}

/* =================== เริ่มทำงาน (ไม่รอ CDN) =================== */
// app.js ถูกโหลดท้าย <body> อยู่แล้ว DOM จึงพร้อมใช้งาน เรียก router ได้ทันที
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', router);
else router();
