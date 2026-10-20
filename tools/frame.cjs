// Render the new outer frame layers for each chapter with Playwright.
// Outputs per chapter i: base-i.png (opaque), tip-i.png (+ tip.json pos), hero-i.png (source 0 only), rail.json; plus top.png
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');
const OUT = path.join(__dirname, 'layers'); fs.mkdirSync(OUT, { recursive: true });
const segs = JSON.parse(fs.readFileSync(path.join(__dirname, 'narration-th.json'), 'utf8'));
const FONT = path.join(__dirname, 'node_modules/@fontsource/ibm-plex-sans-thai/files');
const face = w => `@font-face{font-family:Plex;font-weight:${w};src:url(file://${FONT}/ibm-plex-sans-thai-thai-${w}-normal.woff2)}@font-face{font-family:Plex;font-weight:${w};src:url(file://${FONT}/ibm-plex-sans-thai-latin-${w}-normal.woff2);unicode-range:U+0000-00FF}`;
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// Video window geometry (must match compose.py)
const VX = 48, VY = 148, VW = 1440, VH = 810;
const tips = [
  ['ส่งคำเชิญ', 'กรอกข้อมูล', 'ตรวจเอกสาร', 'ติดตามผล'],
  ['ระบุชื่อผู้ยื่นคำขอและแผนกให้ครบ'],
  ['อีเมลผู้รับต้องถูกต้อง', 'ตรวจตัวสะกดก่อนส่ง'],
  ['กดส่งครั้งเดียว แล้วรอข้อความยืนยัน'],
  ['ดาวน์โหลดแบบเอกสารก่อน', 'เปิดฟอร์มจากปุ่มหรือ QR'],
  ['เลือกประเภทกิจการให้ถูก', 'ใช้ชื่อและเลขอ้างอิงตามเอกสาร'],
  ['ชื่อบัญชี เลขบัญชี และสกุลเงินต้องตรงหลักฐาน'],
  ['เอกสารต้องตรงช่อง', 'ไฟล์ชัดเจน', 'กรอกและลงนามครบ'],
  ['ทบทวนข้อมูลและไฟล์แนบก่อนกดส่ง'],
  ['ส่งสำเร็จ ยังไม่ใช่อนุมัติ', 'รอผลตรวจจากระบบและจัดซื้อ'],
  ['ส่งฉบับแก้ไขในเคสเดิม', 'แอดมินตรวจหลักฐานก่อนปิดเคส'],
];
const role = s => s.source === 1 ? 'มุมมองผู้ขอภายใน' : s.source === 2 ? 'มุมมองคู่ค้า' : 'ภาพรวมขั้นตอน';
const scene = s => (s.tag.split('·')[1] || s.tag).trim();

const CSS = `${[400, 500, 600, 700].map(face).join('')}
:root{--porcelain:#ECEFF2;--grid:#DCE2E8;--ink:#13233A;--ink2:#1D3150;--blue:#2251C9;--copper:#B5652B;--copper2:#E0A06A;--slate:#5F6F84;--mute:#9AA6B5;--white:#FFFFFF}
*{box-sizing:border-box;margin:0}
html,body{width:1920px;height:1080px;overflow:hidden;font-family:Plex,sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased}
body.base{background:var(--porcelain);background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:48px 48px;background-position:-1px -1px}
body.clear{background:transparent}
.head{position:absolute;left:36px;right:40px;top:30px;height:52px;display:flex;align-items:center;gap:16px}
.mark{width:52px;height:52px;border-radius:12px;background:var(--blue);color:#fff;font-weight:700;font-size:19px;letter-spacing:.5px;display:grid;place-items:center}
.brand b{display:block;font-size:24px;font-weight:600;line-height:1.2}
.brand span{font-size:16px;color:var(--slate)}
.role{margin-left:auto;font-size:18px;font-weight:500;color:var(--blue);background:#fff;border:1.5px solid #C9D4EE;padding:8px 18px;border-radius:999px}
.win{position:absolute;left:${VX - 12}px;top:${VY - 44}px;width:${VW + 24}px;height:${VH + 56}px;background:var(--ink);border-radius:20px;box-shadow:0 30px 60px -28px rgba(19,35,58,.55),0 2px 0 rgba(19,35,58,.08)}
.chrome{height:44px;display:flex;align-items:center;padding:0 20px;gap:8px}
.chrome i{width:11px;height:11px;border-radius:50%;background:#33486A}
.chrome em{font-style:normal;margin-left:14px;font-size:16px;color:#AFC0D6}
.chrome small{margin-left:auto;font-size:15px;color:#7488A6}
.rail{position:absolute;left:1532px;top:112px;width:352px}
.rail h3{font-size:16px;font-weight:500;color:var(--slate);margin:0 0 14px 34px}
.line{position:absolute;left:11px;width:4px;border-radius:2px;background:#CBD3DC}
.line.on{background:var(--copper)}
.step{position:relative;display:flex;gap:18px;align-items:flex-start;min-height:48px}
.node{flex:none;width:26px;height:26px;border-radius:50%;background:var(--porcelain);border:3px solid #C3CCD6;position:relative;z-index:2;margin-top:2px}
.step.done .node{background:var(--copper);border-color:var(--copper)}
.step.done .node::after{content:'';position:absolute;left:6px;top:3px;width:5px;height:10px;border:solid #fff;border-width:0 2.5px 2.5px 0;transform:rotate(45deg)}
.step .t{font-size:18px;line-height:1.45;color:var(--mute);padding-top:2px}
.step.done .t{color:var(--slate)}
.step.cur{min-height:0;margin:6px 0 16px}
.step.cur .node{width:26px;height:26px;background:#fff;border:7px solid var(--copper);box-shadow:0 0 0 7px rgba(181,101,43,.18)}
.step.cur .num{font-size:46px;font-weight:600;line-height:1;color:var(--copper);font-variant-numeric:tabular-nums}
.step.cur .num span{font-size:20px;color:var(--mute);font-weight:500;margin-left:6px}
.step.cur h2{font-size:27px;line-height:1.38;font-weight:600;margin:8px 0 0;color:var(--ink)}
.tip{position:absolute;left:${VX - 12}px;top:990px;height:66px;display:flex;align-items:center;gap:16px;padding:0 28px 0 14px;background:#fff;border-radius:14px;border:1.5px solid #D3DAE2;font-size:26px;font-weight:500;color:var(--ink);white-space:nowrap}
.bolt{width:40px;height:40px;border-radius:10px;background:var(--copper);display:grid;place-items:center}
.tip .sep{width:7px;height:7px;border-radius:50%;background:var(--copper2);margin:0 4px}
.hole{position:absolute;left:${VX}px;top:${VY}px;width:${VW}px;height:${VH}px;border-radius:12px;box-shadow:0 0 0 12px var(--ink)}
.hero{width:${VW}px;height:${VH}px;background:radial-gradient(1200px 700px at 85% 110%,#24406A 0%,transparent 60%),var(--ink);color:#fff;position:relative;overflow:hidden;padding:120px 110px}
.hero h1{font-size:84px;line-height:1.3;font-weight:600;letter-spacing:-1px}
.hero p{font-size:30px;color:#B7C6DA;margin-top:22px}
.circuit{position:absolute;left:110px;right:110px;bottom:150px;display:flex;justify-content:space-between}
.circuit::before{content:'';position:absolute;left:30px;right:30px;top:28px;height:4px;background:linear-gradient(90deg,var(--copper),var(--copper2));border-radius:2px}
.term{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:16px;width:300px}
.term:last-child{align-items:flex-end;text-align:right}
.term:nth-child(2){align-items:center;text-align:center}
.term b{width:60px;height:60px;border-radius:50%;background:var(--ink);border:4px solid var(--copper2);display:grid;place-items:center;font-size:22px;font-weight:600;color:var(--copper2)}
.term span{font-size:28px;font-weight:500}
.note{position:absolute;left:110px;bottom:56px;font-size:19px;color:#7F93AF}
`;
const bolt = `<svg width="20" height="22" viewBox="0 0 20 22"><path d="M11.5 1 2 13h7l-1.5 8L18 9h-7l.5-8z" fill="#fff"/></svg>`;

function railHTML(i) {
  return `<div class="rail"><h3>ขั้นตอนทั้งหมด</h3><div id="steps" style="position:relative">${segs.map((s, k) => k === i
    ? `<div class="step cur"><div class="node"></div><div><div class="num">${String(k + 1).padStart(2, '0')}<span>/ ${segs.length}</span></div><h2>${esc(s.title)}</h2></div></div>`
    : `<div class="step ${k < i ? 'done' : ''}"><div class="node"></div><div class="t">${esc(s.title)}</div></div>`).join('')}</div></div>`;
}
const page = (cls, body) => `<!doctype html><html lang="th"><meta charset="utf-8"><style>${CSS}</style><body class="${cls}">${body}</body></html>`;
const heroHTML = i => i === 0
  ? `<div class="hero"><h1>คู่ค้าใหม่<br>เริ่มต้นได้ในระบบเดียว</h1><p>จากคำเชิญถึงการส่งเอกสาร ทำครบในที่เดียว</p><div class="circuit"><div class="term"><b>1</b><span>ส่งคำเชิญ</span></div><div class="term"><b>2</b><span>กรอกข้อมูล</span></div><div class="term"><b>3</b><span>ตรวจและติดตาม</span></div></div><div class="note">ภาพสาธิตประกอบคู่มือ ไม่ใช่การอนุมัติคำขอจริง</div></div>`
  : `<div class="hero"><h1>เอกสารครบ<br>ติดตามต่อในเคสเดิม</h1><p>AI ช่วยตรวจเอกสาร จัดซื้อเป็นผู้ทบทวนก่อนปิดเคส</p><div class="circuit"><div class="term"><b>1</b><span>เปิดเคสเดิม</span></div><div class="term"><b>2</b><span>ส่งฉบับแก้ไข</span></div><div class="term"><b>3</b><span>แอดมินตรวจ</span></div></div><div class="note">ภาพสาธิตประกอบคู่มือ ไม่ใช่การอนุมัติคำขอจริง</div></div>`;

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
  const p = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const tmp = path.join(OUT, '_p.html');
  const load = async html => { fs.writeFileSync(tmp, html); await p.goto('file://' + tmp); await p.evaluate(() => document.fonts.ready); };
  const meta = [];
  await load(page('clear', '<div class="hole"></div>'));
  await p.screenshot({ path: path.join(OUT, 'top.png'), omitBackground: true });
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const body = `<div class="head"><div class="mark">QTC</div><div class="brand"><b>คู่มือระบบขึ้นทะเบียนคู่ค้า</b><span>QTC Energy</span></div><div class="role">${role(s)}</div></div>
<div class="win"><div class="chrome"><i></i><i></i><i></i><em>${esc(scene(s))}</em><small>${s.source ? 'ฉากที่ ' + s.source : 'ภาพรวม'}</small></div></div>${railHTML(i)}`;
    await load(page('base', body));
    // copper bus line: grey full, copper up to current node; measure nodes for the animated segment
    const g = await p.evaluate(() => {
      const st = document.getElementById('steps'), r0 = st.getBoundingClientRect();
      const n = [...st.querySelectorAll('.node')].map(e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 - r0.top, ay: r.top + r.height / 2 }; });
      return { n, top: r0.top };
    });
    await p.evaluate(([n, i]) => {
      const st = document.getElementById('steps');
      const add = (cls, y1, y2) => { const d = document.createElement('div'); d.className = 'line ' + cls; d.style.top = y1 + 'px'; d.style.height = (y2 - y1) + 'px'; st.prepend(d); };
      add('', n[0].y, n[n.length - 1].y);
      if (i > 0) add('on', n[0].y, n[i].y);
    }, [g.n, i]);
    await p.screenshot({ path: path.join(OUT, `base-${i}.png`) });
    const cur = g.n[i], next = g.n[i + 1];
    meta.push({ lineX: Math.round(cur.x - 2), fillY: Math.round(cur.ay), fillH: next ? Math.round(next.ay - cur.ay) : 0 });
    // tip layer
    await load(page('clear', `<div class="tip" id="tip"><div class="bolt">${bolt}</div>${tips[i].map(esc).join('<i class="sep"></i>')}</div>`));
    const box = await p.evaluate(() => { const r = document.getElementById('tip').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    await p.screenshot({ path: path.join(OUT, `tip-${i}.png`), omitBackground: true, clip: { x: box.x - 2, y: box.y - 2, width: box.w + 4, height: box.h + 4 } });
    meta[i].tipX = Math.round(box.x - 2); meta[i].tipY = Math.round(box.y - 2);
    if (!s.source) {
      await p.setViewportSize({ width: VW, height: VH });
      await load(page('clear', heroHTML(i)));
      await p.screenshot({ path: path.join(OUT, `hero-${i}.png`) });
      await p.setViewportSize({ width: 1920, height: 1080 });
    }
    console.log('layers', i);
  }
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 1));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
