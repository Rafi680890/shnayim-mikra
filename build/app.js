"use strict";
/* ---------- נתונים ---------- */
const B = window.META, P = window.PARASHOT, SCH = window.SCHED;   // META: שמות וכמות פסוקים; PARASHOT: 54 פרשות; SCHED: שבת -> פרשת השבוע ו-7 עליות
if (!Array.isArray(B) || !Array.isArray(P) || !SCH) {
  document.getElementById("app").innerHTML = '<div style="text-align:center;padding:60px 20px;font-size:18px"><b>לא ניתן לטעון את הנתונים</b><div style="margin:8px 0 16px;opacity:.75">בדוק את החיבור לאינטרנט, או אם חוסם פרסומות מופעל, ורענן את הדף.</div><button onclick="location.reload()" style="padding:10px 22px;border-radius:12px;border:0;background:#14305a;color:#fff;font-size:17px">רענן</button></div>';
  throw new Error("data missing");
}
const DATA_V = "20261027b";            // לשנות בכל עדכון של קבצי tx/ או rashi/ (וגם ב-sw.js), כדי שלא יוצג נוסח ישן ממטמון
const WKS = Object.keys(SCH).sort(), MINW = WKS[0], MAXW = WKS[WKS.length - 1];
const DAYN = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const ALN = ["ראשונה", "שנייה", "שלישית", "רביעית", "חמישית", "שישית", "שביעית"];
const BCOL = ["--c1", "--c2", "--c3", "--gold", "--hero2"];

/* ---------- מצב ---------- */
const KEY = "shnayimMikra.v1";
function validateBm() {
  const b = S.bm, srcOk = b && typeof b.k === "string" && (b.k.startsWith("w:") ? b.k.slice(2) in SCH : P[+b.k.slice(2)] && b.k.startsWith("p:"));
  const rr = srcOk && Number.isInteger(b.a) && b.a >= 0 && b.a <= 6 ? (b.k[0] === "w" ? SCH[b.k.slice(2)] : P[+b.k.slice(2)]).r[b.a] : null;
  if (!(rr && Number.isInteger(b.c) && Number.isInteger(b.v) && (b.c > rr[1] || b.v >= rr[2]) && (b.c < rr[3] || b.v <= rr[4]) && b.c >= rr[1] && b.c <= rr[3] && b.v >= 1)) S.bm = null;
}
let S = { v: 1, done: {}, pd: {}, pdAuto: {}, cups: 0, autonext: true, bm: null, hintBm: false, nk: true, rashi: true, twice: true, explain: true, rate: 1, fs: 26, taamim: true, targum: true, theme: "light", sunset: true };
try {
  const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw 0;
  Object.assign(S, raw);
} catch (e) {}
{
  const ok = /^\d{4}-\d\d-\d\d:[0-6]$/;
  S.pd = Object.fromEntries(Object.keys(S.pd && typeof S.pd === "object" && !Array.isArray(S.pd) ? S.pd : {}).filter(k => /^\d+$/.test(k) && P[+k]).map(k => [k, 1]));
  S.done = Object.fromEntries(Object.keys(S.done && typeof S.done === "object" && !Array.isArray(S.done) ? S.done : {}).filter(k => ok.test(k) && k.slice(0, 10) in SCH).map(k => [k, 1]));
  S.pdAuto = Object.fromEntries(Object.entries(S.pdAuto && typeof S.pdAuto === "object" && !Array.isArray(S.pdAuto) ? S.pdAuto : {}).filter(([k, w]) => /^\d+$/.test(k) && P[+k] && S.pd[k] && w in SCH));
  S.cups = Number.isInteger(S.cups) && S.cups >= 0 && S.cups < 1000 ? S.cups : 0;
  S.autonext = S.autonext !== false;
  validateBm();
  S.hintBm = !!S.hintBm;
  if (!(Number.isFinite(S.fs) && S.fs >= 16 && S.fs <= 48)) S.fs = 26;
  if (!["light", "sepia", "dark", "auto"].includes(S.theme)) S.theme = "light";
  S.nk = S.nk !== false; S.sunset = S.sunset !== false; S.taamim = S.taamim !== false; S.rashi = S.rashi !== false; S.twice = S.twice !== false; S.explain = S.explain !== false; if (![0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].includes(S.rate)) S.rate = 1; S.targum = S.targum !== false;
}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const dk = (w, a) => w + ":" + a;
const BMI = '<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z"/></svg>';
const bmKey = rt => rt.w ? "w:" + rt.w : "p:" + rt.p;
const bmAt = (rt, c, v) => !!S.bm && S.bm.k === bmKey(rt) && S.bm.a === rt.a && (c === undefined || (S.bm.c === c && S.bm.v === v));
const isDone = (w, a) => !!S.done[dk(w, a)];
const weekDone = w => { let n = 0; for (let a = 0; a < 7; a++) if (isDone(w, a)) n++; return n; };
/* שבוע שסומנו בו כל 7 העליות => הפרשות שהוא מכסה במלואן מסומנות כנלמדו (ובביטול סימון - רק אם הסימון בא מהשבוע הזה) */
const cmp3 = (x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
function weekParashot(w) {
  const s = SCH[w]; if (!s) return [];
  const a = [s.r[0][0], s.r[0][1], s.r[0][2]], z = [s.r[6][0], s.r[6][3], s.r[6][4]];
  return P.map((p, i) => i).filter(i => cmp3([P[i].r[0][0], P[i].r[0][1], P[i].r[0][2]], a) >= 0 && cmp3([P[i].r[6][0], P[i].r[6][3], P[i].r[6][4]], z) <= 0);
}
function syncWeek(w) {
  const full = weekDone(w) === 7;
  weekParashot(w).forEach(i => {
    if (full) { if (!S.pd[i]) { S.pd[i] = 1; S.pdAuto[i] = w; } }
    else if (S.pdAuto[i] === w) { delete S.pd[i]; delete S.pdAuto[i]; }
  });
}
{ const ws = new Set(Object.keys(S.done).map(k => k.slice(0, 10))); ws.forEach(syncWeek); }   // שבועות שהושלמו לפני העדכון
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
const darkMQ = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : null;
function applyTheme() { document.documentElement.dataset.theme = S.theme === "auto" ? (darkMQ && darkMQ.matches ? "dark" : "light") : S.theme; }
applyTheme();
const applyNk = () => document.documentElement.classList.toggle("nk-off", !S.nk);
applyNk();
if (darkMQ) (darkMQ.addEventListener ? darkMQ.addEventListener("change", applyTheme) : darkMQ.addListener(applyTheme));

/* ---------- עזרים ---------- */
function heb(n) {
  const L = [[400, "ת"], [300, "ש"], [200, "ר"], [100, "ק"], [90, "צ"], [80, "פ"], [70, "ע"], [60, "ס"], [50, "נ"], [40, "מ"], [30, "ל"], [20, "כ"], [10, "י"], [9, "ט"], [8, "ח"], [7, "ז"], [6, "ו"], [5, "ה"], [4, "ד"], [3, "ג"], [2, "ב"], [1, "א"]];
  let s = ""; for (const [v, l] of L) { if (n === 15 || n === 16) { s += n === 15 ? "טו" : "טז"; n = 0; break; } while (n >= v) { s += l; n -= v; } }
  return s;
}
const gem = n => { const h = heb(n); return h.length > 1 ? h.slice(0, -1) + "״" + h.slice(-1) : h + "׳"; };
const hebParts = new Intl.DateTimeFormat("he-u-ca-hebrew", { day: "numeric", month: "long", year: "numeric" });
const hebOf = d => { const p = {}; hebParts.formatToParts(d).forEach(x => p[x.type] = x.value); const num = v => /^\d+$/.test(v); return { m: p.month, yt: num(p.year) ? gem(+p.year % 1000) : p.year, dt: num(p.day) ? gem(+p.day) : p.day }; };
const hebFmt = d => { const h = hebOf(d); return `${h.dt} ב${h.m} ${h.yt}`; };
const wdFmt = new Intl.DateTimeFormat("he-IL", { weekday: "long" });
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d, 12); };
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);
const shabOf = d => iso(addDays(d, 6 - d.getDay()));
const dateOf = (w, a) => addDays(parseISO(w), a - 6);              // יום ראשון = עלייה 1 ... שבת = עלייה 7
/* היום העברי מתחיל בשקיעה: אחרי השקיעה בירושלים "היום" הוא התאריך הבא. מחושב לפי שעון ירושלים, בלי תלות באזור הזמן של המכשיר. */
const JER = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit" });
function sunsetMs(y, m, d, lat = 31.778, lon = 35.235) {          // m מ-0; אלגוריתם NOAA, מחזיר זמן UTC במילישניות
  const R = Math.PI / 180, JD = Date.UTC(y, m, d, 12) / 864e5 + 2440587.5, T = (JD - 2451545) / 36525;
  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360, M = 357.52911 + T * (35999.05029 - 0.0001537 * T), e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C = Math.sin(M * R) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * M * R) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * R) * 0.000289;
  const om = 125.04 - 1934.136 * T, lam = L0 + C - 0.00569 - 0.00478 * Math.sin(om * R);
  const e0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60, eps = e0 + 0.00256 * Math.cos(om * R);
  const dec = Math.asin(Math.sin(eps * R) * Math.sin(lam * R)), y2 = Math.tan(eps * R / 2) ** 2;
  const eq = 4 * (y2 * Math.sin(2 * L0 * R) - 2 * e * Math.sin(M * R) + 4 * e * y2 * Math.sin(M * R) * Math.cos(2 * L0 * R) - 0.5 * y2 * y2 * Math.sin(4 * L0 * R) - 1.25 * e * e * Math.sin(2 * M * R)) / R;
  const ha = Math.acos(Math.cos(90.833 * R) / (Math.cos(lat * R) * Math.cos(dec)) - Math.tan(lat * R) * Math.tan(dec)) / R;
  return Date.UTC(y, m, d) + (720 - 4 * (lon - ha) - eq) * 60000;
}
let todayShifted = false;
const today = () => {
  const [y, m, d] = JER.format(new Date()).split("-").map(Number);
  todayShifted = S.sunset !== false && Date.now() >= sunsetMs(y, m - 1, d);
  return new Date(y, m - 1, d + (todayShifted ? 1 : 0), 12);
};
const $ = s => document.querySelector(s);
function toast(t, act) {
  const e = $("#toast"); e.textContent = t; e.style.pointerEvents = act ? "auto" : "none";
  if (act) { const b = document.createElement("button"); b.textContent = act; b.setAttribute("data-undo", ""); e.appendChild(b); }
  e.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => { e.classList.remove("show"); e.style.pointerEvents = "none"; }, act ? 7000 : 1800);
}
let lastBm = null;
const I = {
  home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/></svg>',
  cal: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
  openbook: '<svg viewBox="0 0 24 24"><path d="M12 6.5C9.8 5 7 4.5 3.5 4.5v13c3.5 0 6.3.5 8.5 2 2.2-1.5 5-2 8.5-2v-13C17 4.5 14.2 5 12 6.5z"/><path d="M12 6.5v13"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>'
};

/* ---------- טווחים ופסוקים ---------- */
// טווח r = [ספר, פרק התחלה, פסוק התחלה, פרק סוף, פסוק סוף]
const refText = (r, withBook) => {
  const [b, c1, v1, c2, v2] = r;
  return (withBook ? B[b].n + " " : "") + (c1 === c2 ? `${gem(c1)}:${gem(v1)}–${gem(v2)}` : `${gem(c1)}:${gem(v1)}–${gem(c2)}:${gem(v2)}`);
};
const vcount = r => { let n = 0; for (let c = r[1]; c <= r[3]; c++) n += (c === r[3] ? r[4] : B[r[0]].c[c - 1]) - (c === r[1] ? r[2] : 1) + 1; return n; };
function srcOf(rt) {
  if (rt.w) { const s = SCH[rt.w]; return s ? { name: s.n, hol: s.h, r: s.r, w: rt.w } : null; }
  const p = P[rt.p]; return p ? { name: p.n, hol: false, r: p.r, p: rt.p } : null;
}
/* שמע: קישור חיפוש ביוטיוב לפרשה, בנוסח ספרדי ירושלמי (אין אישור להטמעת הקלטות באפליקציה) */
const cmpT = (x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
function pidOf(r) {                                                // הפרשה שמכילה את תחילת העלייה
  const st = [r[0], r[1], r[2]];
  return P.findIndex(p => cmpT([p.r[0][0], p.r[0][1], p.r[0][2]], st) <= 0 && cmpT(st, [p.r[6][0], p.r[6][3], p.r[6][4]]) <= 0);
}
const AUDIO_SLUG = { 5: "toldot", 6: "vayetze", 7: "vayishlach", 8: "vayeshev", 9: "miketz", 10: "vayigash", 11: "vayechi" };   // אינדקס פרשה -> שם קבצי השמע
const AUDIO = Object.fromEntries(Object.entries(AUDIO_SLUG).map(([i, sl]) => [i, k => `audio/${sl}-${k + 1}.mp3`]));
function audioFor(r) {                                             // הקלטה מובנית לעלייה, אם יש
  const i = pidOf(r); if (!AUDIO[i]) return null;
  const k = P[i].r.findIndex(x => x.every((v, j) => v === r[j]));    // רק עלייה שזהה לחלוקה הרגילה של הפרשה
  return k < 0 ? null : { src: AUDIO[i](k), title: "פרשת " + P[i].n + " · עלייה " + ALN[k] };
}
function audioLink(r) {
  const au = audioFor(r);
  if (au) return `<button class="wla sp" data-play="${au.src}" data-ttl="${au.title}" aria-label="האזנה לקריאה: ${au.title}">🎧<span>שמע</span></button>`;
  const i = pidOf(r); if (i < 0) return "";
  const q = "קריאה בתורה פרשת " + P[i].n.replace(/־/g, " ") + " נוסח ספרדי ירושלמי";
  return `<a class="wla" href="https://www.youtube.com/results?search_query=${encodeURIComponent(q)}" target="_blank" rel="noopener" aria-label="שמיעת הקריאה בנוסח ספרדי ירושלמי - פרשת ${P[i].n}">🎧<span>שמע</span></a>`;
}
const ttl = s => { const n = s.name !== undefined ? s.name : s.n, h = s.hol !== undefined ? s.hol : s.h; return h ? n : "פרשת " + n; };

/* ---------- ניתוב ---------- */
let route = { v: "day", date: iso(today()) };
let lastDay = null, lastHash = null;
const urlOf = r => "#" + r.v + (r.date ? "/" + r.date : "") + (r.w ? "/w/" + r.w + "/" + r.a : "") + (r.v === "read" && r.p != null ? "/p/" + r.p + "/" + r.a : "") + (r.v === "par" ? "/" + r.p : "");
function go(r, replace) { route = r; history[replace ? "replaceState" : "pushState"](null, "", urlOf(r)); lastHash = location.hash; closeSheet(); render(); }
function fromHash() {
  if (location.hash === lastHash) return; const first = lastHash === null; lastHash = location.hash;
  const parts = location.hash.slice(1).split("/"), v = parts[0];
  if (v === "read" && parts[1] === "w" && SCH[parts[2]] && /^[0-6]$/.test(parts[3])) route = { v, w: parts[2], a: +parts[3] };
  else if (v === "read" && parts[1] === "p" && /^\d+$/.test(parts[2]) && P[+parts[2]] && /^[0-6]$/.test(parts[3])) route = { v, p: +parts[2], a: +parts[3] };
  else if (v === "par" && /^\d+$/.test(parts[1]) && P[+parts[1]]) route = { v, p: +parts[1] };
  else if (v === "books" || v === "progress" || v === "search") route = { v };
  else route = { v: "day", date: !first && /^\d{4}-\d\d-\d\d$/.test(parts[1] || "") ? parts[1] : iso(today()) };
  closeSheet(); render();
}
window.addEventListener("popstate", fromHash);
window.addEventListener("hashchange", fromHash);

/* ---------- טעינת הטקסט ---------- */
const TX = {}, txLoading = {}, txFail = {};
function loadText(b) {
  if (TX[b] || txLoading[b] || txFail[b]) return; txLoading[b] = 1;
  const ac = typeof AbortController === "function" ? new AbortController() : null, to = setTimeout(() => ac && ac.abort(), 15000);   // בלי תשובה - מציגים הודעת שגיאה עם "נסה שוב"
  fetch("tx/" + b + ".json?v=" + DATA_V, ac ? { signal: ac.signal } : undefined).then(r => { if (!r.ok) throw 0; return r.json(); }).then(j => { TX[b] = j; })
    .catch(() => { txFail[b] = 1; })
    .finally(() => { clearTimeout(to); delete txLoading[b]; if (route.v === "read" && srcOf(route) && srcOf(route).r[route.a][0] === b) render(); });
}
window.addEventListener("online", () => { for (const k in txFail) delete txFail[k]; if (route.v === "read") render(); });
const RS = {}, rsLoading = {}, rsFail = {}; let rsToasted = false;
function loadRashi(b) {
  if (RS[b] || rsLoading[b] || (rsFail[b] && Date.now() - rsFail[b] < 20000)) return; delete rsFail[b]; rsLoading[b] = 1;
  fetch("rashi/" + b + ".json?v=" + DATA_V).then(r => { if (!r.ok) throw 0; return r.json(); }).then(j => { RS[b] = j; })
    .catch(() => { rsFail[b] = Date.now(); if (!rsToasted) { rsToasted = true; toast("פירוש רש״י לא נטען - נדרש חיבור לאינטרנט"); } })
    .finally(() => { delete rsLoading[b]; const sr = route.v === "read" ? srcOf(route) : null; if (sr && sr.r[route.a][0] === b && RS[b]) { route.keep = true; render(); } });
}
const NIK = /[\u0591-\u05C7\u034f]/g;
const norm = x => x.replace(NIK, "").replace(/[^א-ת]/g, "");
const strip1 = x => x.replace(/^[ובהכלמש]{1,2}/, "");
const zsk = x => strip1(x).replace(/[וי]/g, "");           // שלד עיצורי, ללא אותיות קריאה
function sim(a, b) {                                         // התאמה מחמירה: אותה מילה, עד כדי תחילית וכתיב מלא/חסר
  if (!a || !b) return false; if (a === b) return true;
  if ((a === "ה" && /^[ובהכלמש]?יהוה$/.test(b)) || (b === "ה" && /^[ובהכלמש]?יהוה$/.test(a))) return true;
  const x = strip1(a), y = strip1(b); if (x.length >= 2 && x === y) return true;
  const p = zsk(a), q = zsk(b); return p.length >= 2 && p === q;
}
function parseC(x) {
  const m = /^\s*<(?:b|strong)[^>]*>([\s\S]*?)<\/(?:b|strong)>\s*([\s\S]*)$/i.exec(x);
  const h = m ? m[1].replace(/<[^>]+>/g, "").replace(/[.:\s]+$/, "") : "", b = (m ? m[2] : x).replace(/<[^>]+>/g, "");
  const hw = h.replace(/(וגו|וכו|וגומר|וכולי)[׳'’"]?.*$/, "").split(/[\s־-]+/).map(norm).filter(Boolean);
  return { h, b, hw };
}
function annotate(words, cs) {                               // מצמיד כל פירוש למילים של דיבור המתחיל שלו
  const map = {}, loose = [], n = words.length; let cur = 0;
  for (const c of cs) {
    let best = -1, run = 0;
    if (c.hw.length && n) {
      const idx = [...Array(n).keys()], from = cur % n, starts = idx.slice(from).concat(idx.slice(0, from));
      for (const i of starts) {
        if (!sim(words[i].n, c.hw[0])) continue;
        let r = 1; while (r < c.hw.length && i + r < n && sim(words[i + r].n, c.hw[r])) r++;
        if (r > run) { run = r; best = i; if (r === c.hw.length) break; }
      }
    }
    if (best < 0) { loose.push(c); continue; }
    for (let k = best; k < best + run; k++) (map[k] = map[k] || []).push(c);
    cur = best + run;
  }
  return { map, loose };
}
let POP = [];
function verseHTML(text, rc) {
  const toks = []; (text.match(/[^־\s]+־?/g) || []).forEach(t => { if (t === "׀" && !S.taamim) return; if (t === "׀" && toks.length) toks[toks.length - 1].t += " ׀"; else toks.push({ t, n: norm(t) }); });
  toks.forEach(w => { w.h = NK.html(w.t, S.taamim); });   // הדגשת שוא נע ודגש חזק (והסרת הטעמים אם כבויים)
  if (!rc || !rc.length) return toks.map(w => w.h).join(" ").replace(/־ /g, "־");
  const { map, loose } = annotate(toks, rc.map(parseC));
  const ids = new Map(), idOf = c => { if (!ids.has(c)) { ids.set(c, POP.length); POP.push(c); } return ids.get(c); };
  const key = k => map[k] ? map[k].map(idOf).join(",") : "";
  let out = "", k = 0;
  while (k < toks.length) {
    const ky = key(k);
    if (!ky) { out += toks[k].h + (toks[k].t.endsWith("־") ? "" : " "); k++; continue; }
    let e = k; while (e + 1 < toks.length && key(e + 1) === ky) e++;
    let inner = ""; for (let q = k; q <= e; q++) inner += toks[q].h + (q < e && !toks[q].t.endsWith("־") ? " " : "");
    out += `<span class="hl" role="button" tabindex="0" aria-label="פירוש רש״י" data-p="${ky}">${inner}</span>${toks[e].t.endsWith("־") ? "" : " "}`;
    k = e + 1;
  }
  loose.forEach(c => { out += `<button class="lo" aria-label="רש״י - פירוש לפסוק" data-p="${idOf(c)}">רש״י</button> `; });
  return out;
}
const stripT = s => s.replace(/[֑-֯׀]/g, "");

/* ---------- תצוגות ---------- */
const SHARE_URL = "https://rafi680890.github.io/shnayim-mikra/";
const SHARE_TEXT = "📖 שניים מקרא ואחד תרגום: כל התורה בשבע עליות לפי ימות השבוע, עם טעמי מקרא, תרגום אונקלוס ופירוש רש״י.";
async function shareApp(kind) {
  const full = SHARE_TEXT + " " + SHARE_URL, e = encodeURIComponent;
  if (kind === "wa") { window.open("https://wa.me/?text=" + e(full), "_blank", "noopener"); return; }
  if (kind === "fb") { window.open("https://www.facebook.com/sharer/sharer.php?u=" + e(SHARE_URL), "_blank", "noopener"); return; }
  if (kind === "tg") { window.open("https://t.me/share/url?url=" + e(SHARE_URL) + "&text=" + e(SHARE_TEXT), "_blank", "noopener"); return; }
  const copy = async () => {
    try { await navigator.clipboard.writeText(full); }
    catch (er) { const t = document.createElement("textarea"); t.value = full; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (e2) {} t.remove(); }
    toast("הקישור הועתק ✓");
  };
  if (kind === "copy") { await copy(); return; }
  try { if (navigator.share) { await navigator.share({ title: "שניים מקרא ואחד תרגום", text: SHARE_TEXT, url: SHARE_URL }); return; } }
  catch (er) { if (er && er.name === "AbortError") return; }
  await copy();
}
const shareCard = () => `<div class="card sharecard"><div class="shh"><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/></svg>שתפו עם חברים ומשפחה</div><p class="shs">הקישור יישלח עם הסבר קצר על האפליקציה</p><div class="sgrid">
<button class="sb wa" data-share="wa"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.4.1.6-.1l.8-1c.2-.2.3-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.8-.1 1.3z"/></svg>ווטסאפ</button>
<button class="sb fb" data-share="fb"><svg viewBox="0 0 24 24"><path d="M13.5 22v-8.2h2.8l.5-3.3h-3.3V8.4c0-1 .4-1.7 1.8-1.7H17V3.800C16.700 3.700 15.700 3.600 14.600 3.600c-2.500 0-4.100 1.500-4.100 4.200v2.700H7.700v3.300h2.800V22z"/></svg>פייסבוק</button>
<button class="sb tg" data-share="tg"><svg viewBox="0 0 24 24"><path d="M21.500 3.500 2.700 10.800c-.9.300-.9 1.200 0 1.500l4.800 1.500 1.800 5.700c.2.600.9.800 1.400.4l2.600-2.200 4.700 3.500c.6.400 1.300.1 1.500-.6l3.200-15.200c.2-.9-.6-1.600-1.200-1.400zM9.700 14.300l8.200-5.100-6.500 6.200-.3 3.100z"/></svg>טלגרם</button>
<button class="sb cp" data-share="copy"><svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1"/><path d="M14 10a4 4 0 0 0-5.700 0l-3 3A4 4 0 0 0 11 18.700l1-1"/></svg>העתקת קישור</button></div>
<button class="more" data-share="more"><svg viewBox="0 0 24 24"><path d="M12 15V3M7.500 7.500 12 3l4.500 4.500"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>שתפו באפשרויות נוספות</button>
<button class="help" data-installhelp>מופיעה אזהרה בהתקנה באנדרואיד? לחצו כאן</button></div>`;
const installHelpHTML = () => `<button class="x" data-close aria-label="סגור">✕</button><h3 class="sh" style="margin-top:4px">בעיה בהתקנה באנדרואיד</h3>
<p style="margin:0 0 10px">אם מופיעה הודעה <b>״Google Play Protect: אפליקציה לא בטוחה נחסמה״</b> - זו אזהרה כללית של אנדרואיד על אפליקציות אינטרנט, והאפליקציה עצמה בטוחה (היא אתר, בלי קבצים מסוכנים). אפשר להמשיך כך:</p>
<ol class="help-steps"><li>בהודעה לחצו על <b>״פרטים נוספים״</b> ואז על <b>״התקן בכל זאת״</b>.</li>
<li>אם אין כפתור כזה: ב-Chrome פתחו את התפריט ⋮ ובחרו <b>״הוסף למסך הבית״</b>, ואז <b>״צור קיצור דרך״</b> (לא ״התקן״). האייקון יופיע במסך הבית ויעבוד כרגיל.</li>
<li>או פשוט המשיכו להשתמש באתר דרך הדפדפן, בלי להתקין.</li></ol>`;
const APP_VERSION = "2026.11.25 (v18)";
async function hardRefresh() {                                      // מוחק רק את קבצי האפליקציה השמורים (מטמון), לא את ההתקדמות
  toast("בודק חיבור…");
  try { const r = await fetch(location.pathname + "?r=" + Date.now(), { cache: "no-store" }); if (!r.ok) throw 0; }   // בדיקה אמיתית: onLine מחזיר true גם ב-Wi-Fi בלי אינטרנט
  catch (e) { toast("אין חיבור לאינטרנט - הריענון בוטל, האפליקציה נשארת כמו שהיא"); return; }
  toast("מרענן לגרסה החדשה…");
  try {
    if (navigator.serviceWorker) { const regs = await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r => r.unregister())); }
    if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); }
  } catch (e) {}
  location.replace(location.pathname + "?r=" + Date.now() + location.hash);
}
/* ---------- הודעת "יש גרסה חדשה" ---------- */
let verDismissed = "", verChecked = 0;
async function checkNewVersion(force) {
  if (!force && Date.now() - verChecked < 60000) return; verChecked = Date.now();
  if (!navigator.onLine) return;
  try {
    const r = await fetch("app.js", { cache: "no-store" }); if (!r.ok) return;
    const m = /APP_VERSION\s*=\s*"([^"]+)"/.exec(await r.text());
    if (m && m[1] !== APP_VERSION && m[1] !== verDismissed) showNewVer(m[1]);
  } catch (e) {}
}
function showNewVer(v) {
  if ($("#newver")) return;
  const d = document.createElement("div"); d.id = "newver"; d.className = "newver"; d.setAttribute("role", "status"); d.dataset.v = v;
  d.innerHTML = '<span>יש גרסה חדשה של האפליקציה</span><button class="nvu" data-newver-update>עדכנו עכשיו</button><button class="nvx" data-newver-later aria-label="סגירה">✕</button>';
  document.body.appendChild(d);
}

/* ---------- קריאה אופליין בלחיצה אחת ---------- */
const OFF_KEY = "shnayimMikra.offline";
const offStatus = () => { try { const d = localStorage.getItem(OFF_KEY); return d ? "✓ הורד בתאריך " + d + ". אפשר ללמוד בלי אינטרנט." : "מוריד את כל התורה והפירוש למכשיר, כדי ללמוד גם בלי קליטה (נסיעה, שבת)."; } catch (e) { return ""; } };
async function offlineDownload() {
  if (!window.caches) { toast("הדפדפן לא תומך בשמירה לקריאה אופליין"); return; }
  const btn = $("[data-offline]"); if (btn) btn.disabled = true;
  const files = B.map((_, i) => ["tx/" + i + ".json?v=" + DATA_V, "rashi/" + i + ".json?v=" + DATA_V]).flat(); let done = 0, fail = 0;
  const say = t => { const e = $("#offst"); if (e) e.textContent = t; };
  const cacheName = async () => { const ks = (await caches.keys()).filter(k => k.startsWith("shnayim-mikra-")).sort((a, b) => (parseInt(b.split("-v")[1]) || 0) - (parseInt(a.split("-v")[1]) || 0)); return ks[0] || "shnayim-mikra-offline"; };
  say("מוריד… 0 מתוך " + files.length);
  const q = files.slice();
  const worker = async () => {
    while (q.length) {
      const u = q.shift();
      try {
        if (!(await caches.match(u))) {
          const r = await fetch(u, { cache: "no-store" });
          if (!r.ok) throw 0;
          if (!(await caches.match(u))) { const c = await caches.open(await cacheName()); await c.put(u, r.clone()); }
        }
      } catch (e) { fail++; }
      done++; say("מוריד… " + done + " מתוך " + files.length);
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  if (btn) btn.disabled = false;
  if (fail) { say("ההורדה לא הושלמה (" + fail + " קבצים נכשלו). בדקו חיבור ונסו שוב."); toast("ההורדה לא הושלמה, נסו שוב"); return; }
  try { localStorage.setItem(OFF_KEY, new Date().toLocaleDateString("he-IL")); } catch (e) {}
  say(offStatus()); toast("✓ הכול הורד, אפשר ללמוד בלי אינטרנט");
}

/* ---------- חיפוש חופשי ---------- */
const SQ = { q: "", scope: "t", full: false, part: false, bk: "", shown: 100, scroll: 0 };
const NWD = {}, PRE = "ובהכלמש";
const nw = s => s.replace(/[־\-]/g, " ").replace(NIK, "").replace(/[^א-ת\s]/g, "").replace(/\s+/g, " ").trim();
const sk = s => s.replace(/[וי]/g, "");
const escH = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const TAAM = /[֑-֯]/g;
const rsText = x => (Array.isArray(x) ? x.join(" ") : x || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const srcStr = (b, c, v, scope) => scope === "t" ? TX[b][c][v][0].replace(/\n/g, " ") : scope === "g" ? TX[b][c][v][1] : rsText(RS[b][c][v]);
async function loadAllData(scope, onProg) {
  const jobs = [];
  B.forEach((_, i) => { if (!TX[i]) jobs.push(["tx", i]); if (scope === "r" && !RS[i]) jobs.push(["rashi", i]); });
  const total = jobs.length; let n = 0, fail = 0;
  const w = async () => { while (jobs.length) { const [k, i] = jobs.shift(); try { const r = await fetch(k + "/" + i + ".json?v=" + DATA_V); if (!r.ok) throw 0; const j = await r.json(); if (k === "tx") TX[i] = j; else RS[i] = j; } catch (e) { fail++; } n++; if (onProg) onProg(n, total); } };
  await Promise.all([w(), w(), w(), w()]);
  return fail === 0;
}
const wordsOf = (b, scope) => { const k = b + scope; return NWD[k] || (NWD[k] = (scope === "r" ? RS[b] : TX[b]).map((ch, c) => ch.map((_, v) => nw(srcStr(b, c, v, scope)).split(" ")))); };
function variants(q) {                                    // כתיב מלא/חסר: הוספה או הסרה של ו/י אחת
  const s = new Set([q]);
  for (let i = 0; i < q.length; i++) if ("וי".includes(q[i])) { const r = q.slice(0, i) + q.slice(i + 1); if (r.length >= 3) s.add(r); }
  for (let i = 1; i < q.length; i++) { s.add(q.slice(0, i) + "ו" + q.slice(i)); s.add(q.slice(0, i) + "י" + q.slice(i)); }
  return s;
}
function seqOK(ws, ms) {                                  // כמה מילים בחיפוש: לפי הסדר, ולא יותר משתי מילים ביניהן (אשרי האיש, משה ואהרן)
  const rec = (k, from) => { if (k === ms.length) return true; const to = k === 0 ? ws.length : Math.min(ws.length, from + 3); for (let j = from; j < to; j++) if (ms[k](ws[j]) && rec(k + 1, j + 1)) return true; return false; };
  return rec(0, 0);
}
function mkMatch(q, full) {
  const set = new Set(), bare = new Set(), mk = x => full ? variants(x) : [x];
  mk(q).forEach(y => set.add(y));                         // המילה כפי שנכתבה, עם אותיות שימוש אפשריות לפניה
  if ("ובהכלמ".includes(q[0]) && q.length >= 5 || ("וה".includes(q[0]) && q.length >= 4)) mk(q.slice(1)).forEach(y => bare.add(y));   // בהיותם -> גם היותם (רק חשופה, בלי אות שימוש נוספת)
  const nd = [...set, ...bare];
  if (SQ.part) return w => nd.some(n => w.includes(n));
  return w => { if (bare.has(w)) return true; for (let i = 0; i <= 2; i++) { if (i > 0 && !PRE.includes(w[i - 1])) break; const x = w.slice(i); if (x.length < 2) break; if (set.has(x)) return true; } return false; };
}
function locate(b, c, v) {                                // באיזו פרשה ובאיזו עלייה נמצא הפסוק
  const st = [b, c, v];
  for (let i = 0; i < P.length; i++) for (let k = 0; k < 7; k++) { const r = P[i].r[k]; if (cmpT(st, [r[0], r[1], r[2]]) >= 0 && cmpT(st, [r[0], r[3], r[4]]) <= 0) return { p: i, a: k }; }
  return null;
}
function searchView() {
  const bopts = '<option value="">כל התורה</option>' + B.map((x, i) => `<option value="${i}" ${String(SQ.bk) === String(i) ? "selected" : ""}>${x.n}</option>`).join("");
  const sopts = [["t", "במקרא"], ["g", "בתרגום אונקלוס"], ["r", "בפירוש רש״י"]].map(([k, n]) => `<option value="${k}" ${SQ.scope === k ? "selected" : ""}>${n}</option>`).join("");
  return `<header class="rh" style="margin-bottom:12px"><button class="home" data-go="day">${I.home}<span>חזרה לדף הבית</span></button><div class="rt">חיפוש</div></header>
  <input id="sq" class="sq" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" placeholder="חפשו מילה או ביטוי (בלי ניקוד)" aria-label="חיפוש" value="${escH(SQ.q)}">
  <div class="sopts"><select id="ssc" aria-label="איפה לחפש">${sopts}</select><select id="sbk" aria-label="היקף החיפוש">${bopts}</select></div>
  <div class="sopts"><label><input type="checkbox" id="sfull" ${SQ.full ? "checked" : ""}> כולל כתיב מלא/חסר (דוד ↔ דויד)</label><label><input type="checkbox" id="spart" ${SQ.part ? "checked" : ""}> גם חלק ממילה</label></div>
  <div id="sres" aria-live="polite"></div>${footer(false)}${tabs()}`;
}
function searchInit() {
  window.scrollTo(0, 0);
  if (SQ.q) { runSearch(); if (SQ.scroll) { const y = SQ.scroll; SQ.scroll = 0; setTimeout(() => window.scrollTo(0, y), 30); } }
  else { const i = $("#sq"); if (i && !/iphone|ipad|ipod/i.test(navigator.userAgent)) i.focus(); $("#sres").innerHTML = `<div class="ssum" style="font-weight:600">מחפשים בכל חמשת חומשי התורה. אפשר לחפש מילה או כמה מילים, בלי ניקוד וטעמים, במקרא, בתרגום אונקלוס או בפירוש רש״י.</div>`; }
}
let sTimer = 0;
function runSearch() {
  const box = $("#sres"); if (!box) return;
  const qn = nw(SQ.q), words = qn.split(" ").filter(Boolean);
  if (qn.replace(/ /g, "").length < 2) { box.innerHTML = `<div class="ssum" style="font-weight:600">${SQ.q ? "כתבו לפחות שתי אותיות." : ""}</div>`; return; }
  const scope = SQ.scope;
  if (B.some((_, i) => !TX[i] || (scope === "r" && !RS[i]))) {
    box.innerHTML = `<div class="ssum" id="sload">טוען את הטקסט לחיפוש…</div>`;
    const my = SQ.q + scope;
    loadAllData(scope, (n, t) => { const e = $("#sload"); if (e) e.textContent = `טוען את הטקסט לחיפוש… ${n} מתוך ${t}`; }).then(ok => {
      if (route.v !== "search" || SQ.q + SQ.scope !== my) return;
      if (!ok) { const e = $("#sres"); if (e) e.innerHTML = `<div class="ssum">לא כל הטקסט נטען. בדקו חיבור (או הורידו לקריאה אופליין מתחתית הדף) ונסו שוב.</div>`; return; }
      runSearch();
    });
    return;
  }
  const bks = SQ.bk === "" ? B.map((_, i) => i) : [+SQ.bk];
  const find = full => {
    const ms = words.map(w => mkMatch(w, full)), out = [];
    for (const b of bks) {
      const W = wordsOf(b, scope);
      for (let c = 0; c < W.length; c++) for (let v = 0; v < W[c].length; v++) {
        const ws = W[c][v]; let ok = true;
        ok = seqOK(ws, ms);
        if (ok) out.push([b, c, v]);
      }
    }
    return { out, ms };
  };
  const r = find(SQ.full); SQ.hits = r.out; SQ.words = words; SQ.ms = r.ms;
  SQ.extra = SQ.full ? 0 : Math.max(0, find(true).out.length - r.out.length);   // כמה תוצאות נוספות יש בכתיב מלא/חסר
  drawResults();
}
function hiText(raw, scope) {
  const ms = SQ.ms; let toks = raw.split(/(\s+)/);
  if (scope === "r") {                                    // פירוש רש״י ארוך: מציגים רק חלון סביב המילה שנמצאה
    const ws = toks.filter(x => x.trim()); let at = ws.findIndex(t => nw(t).split(" ").some(w => ms.some(m => m(w))));
    if (at < 0) at = 0; const from = Math.max(0, at - 12), to = Math.min(ws.length, at + 28);
    toks = (from > 0 ? ["… "] : []).concat(ws.slice(from, to).flatMap(t => [t, " "])).concat(to < ws.length ? ["…"] : []);
  }
  return toks.map(tok => {
    if (!tok.trim() || tok === "…" || tok === "… ") return escH(tok);
    const ws = nw(tok).split(" ").filter(Boolean);
    return ms.some(m => ws.some(m)) ? `<mark class="hit">${escH(tok)}</mark>` : escH(tok);
  }).join("");
}
function drawResults() {
  const box = $("#sres"); if (!box) return; const hits = SQ.hits || [], scope = SQ.scope;
  const more = SQ.extra ? `<button class="smore" data-sfull style="margin:6px 0 10px">הצג גם ${SQ.extra} תוצאות בכתיב מלא/חסר</button>` : "";
  if (!hits.length) { box.innerHTML = `<div class="ssum">לא נמצאו תוצאות ל״${escH(SQ.q.trim())}״ בכתיב הזה.</div>${more}<div class="ssum" style="font-weight:600">אפשר לנסות פחות מילים או לסמן ״גם חלק ממילה״.</div>`; return; }
  const show = hits.slice(0, SQ.shown);
  box.innerHTML = `<div class="ssum">${hits.length} תוצאות${SQ.bk === "" ? "" : " ב" + B[+SQ.bk].n}${hits.length > show.length ? " (מוצגות " + show.length + ")" : ""}</div>` + more +
    show.map(([b, c, v]) => `<button class="sres" data-sr="${b}:${c}:${v}"><div class="sref">${B[b].n} ${gem(c + 1)} · פסוק ${gem(v + 1)}</div><div class="stx ${scope === "g" ? "sg" : scope === "r" ? "sr" : ""}">${hiText(scope === "t" ? srcStr(b, c, v, "t").replace(TAAM, "") : srcStr(b, c, v, scope), scope)}</div></button>`).join("") +
    (hits.length > show.length ? `<button class="smore" data-smore>הצג עוד</button>` : "");
}
document.addEventListener("input", e => {
  if (e.target.id === "sq") { SQ.q = e.target.value; SQ.shown = 100; clearTimeout(sTimer); sTimer = setTimeout(runSearch, 250); }
});
document.addEventListener("change", e => {
  if (e.target.id === "sbk") { SQ.bk = e.target.value; SQ.shown = 100; runSearch(); }
  else if (e.target.id === "ssc") { SQ.scope = e.target.value; SQ.shown = 100; runSearch(); }
  else if (e.target.id === "sfull") { SQ.full = e.target.checked; SQ.shown = 100; runSearch(); }
  else if (e.target.id === "spart") { SQ.part = e.target.checked; SQ.shown = 100; runSearch(); }
});
const MAM_SRC = "https://he.wikisource.org/wiki/%D7%9E%D7%A9%D7%AA%D7%9E%D7%A9:Dovi/%D7%9E%D7%A7%D7%A8%D7%90_%D7%A2%D7%9C_%D7%A4%D7%99_%D7%94%D7%9E%D7%A1%D7%95%D7%A8%D7%94";
function footer(src) {
  return `<footer class="ft"><div class="cp">© רפאל בטיט · כל הזכויות שמורות על עיצוב ופיתוח האפליקציה</div><div class="ver">גרסה ${APP_VERSION}</div><button class="refbtn" data-refresh>🔄 ריענון לגירסה חדשה</button><div class="vernote">הריענון מוריד את הגרסה העדכנית. ההתקדמות והסימניות שלך נשמרות.</div><button class="offbtn" data-offline>📥 הורדה ללימוד אופליין</button><div class="vernote" id="offst">${offStatus()}</div>${src ? `<div class="src">פירוש רש״י (נוסח מנוקד, Rosenbaum-Silbermann 1929–1934, נחלת הכלל) באמצעות ספריא. שמע: קישורי חיפוש ביוטיוב (נוסח ספרדי ירושלמי). נוסח המקרא: <a href="${MAM_SRC}" target="_blank" rel="noopener">מקרא על פי המסורה (MAM)</a>, ברישיון CC-BY-SA, באמצעות ספריא. בתצוגה זו הוצג הקרי בלבד במקום כתיב וקרי, והוסרו סימוני פתוחות וסתומות. תרגום אונקלוס מנוקד, מתוך חומש שפתי חכמים (הוצאת מצודה, 2009), ברישיון CC-BY-NC, באמצעות ספריא. המילים הצבועות בתרגום מסומנות במהדורה זו כמקומות שבהם אונקלוס מפרש ולא מתרגם. בתצוגה זו הוסרו נוסחאות חלופיות והסוגריים. חלוקת העליות ולוח הפרשיות (לפי מנהג ארץ ישראל): <a href="https://www.hebcal.com/" target="_blank" rel="noopener">Hebcal</a>.</div>` : ""}</footer>`;
}
function coverage() {                                              // פסוקים שנלמדו (איחוד כל העליות שסומנו), לפי ספר
  const seen = B.map(() => new Set());
  const add = r => { const set = seen[r[0]]; for (let c = r[1]; c <= r[3]; c++) for (let v = c === r[1] ? r[2] : 1, e = c === r[3] ? r[4] : B[r[0]].c[c - 1]; v <= e; v++) set.add(c * 1000 + v); };
  for (const k of Object.keys(S.done)) add(SCH[k.slice(0, 10)].r[+k[11]]);
  for (const i of Object.keys(S.pd)) P[+i].r.forEach(add);
  const tot = B.map(b => b.c.reduce((x, n) => x + n, 0)), got = seen.map(x => x.size), all = tot.reduce((x, n) => x + n, 0), g = got.reduce((x, n) => x + n, 0);
  return { tot, got, all, g, pct: Math.round(g / all * 100) };
}
function tabs() {
  const on = route.v === "progress" ? "p" : route.v === "books" || route.v === "par" ? "b" : route.v === "search" ? "s" : "d", pct = coverage().pct;
  return `<nav class="tabs"><button class="hl" data-go="progress" ${on === "p" ? 'aria-current="page"' : ""}><i>${pct}%</i>${I.chart}<span>התקדמות שלי</span></button><button class="${on === "d" ? "on" : ""}" data-go="day">${I.home}<span>השבוע</span></button><button class="${on === "b" ? "on" : ""}" data-go="books">${I.book}<span>חלוקה לספרים</span></button><button class="${on === "s" ? "on" : ""}" data-go="search" ${on === "s" ? 'aria-current="page"' : ""}>${I.search}<span>חיפוש</span></button></nav>`;
}
function weekStrip(d, w, isToday) {
  const td = iso(today()); let cells = "";
  for (let a = 0; a < 7; a++) {
    const x = dateOf(w, a), id = iso(x), ok = !!SCH[w];
    cells += `<button class="dy ${id === route.date ? "sel" : ""} ${id === td ? "today" : ""}" ${ok ? `data-day="${id}"` : "disabled"} aria-label="יום ${DAYN[a]} ${hebOf(x).dt}">${["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"][a]}<b>${hebOf(x).dt}</b>${ok && isDone(w, a) ? '<i class="ck">✓</i>' : ""}</button>`;
  }
  return `<div class="strip">${cells}</div><div class="weeknav"><button data-week="-1">› שבוע קודם</button><button class="td ${isToday ? "on" : ""}" data-today ${isToday ? 'aria-current="date"' : ""}>היום</button><button data-week="1">שבוע הבא ‹</button></div><div class="swrow"><span>היום מתחלף:</span><button class="sg ${S.sunset !== false ? "on" : ""}" data-sunset="1">🌙 בשקיעה</button><button class="sg ${S.sunset === false ? "on" : ""}" data-sunset="0">🕛 בחצות</button></div>`;
}
function totals() {
  let al = 7 * Object.keys(S.pd).length;                            // כל פרשה מסומנת = 7 עליות
  for (const k of Object.keys(S.done)) { const i = pidOf(SCH[k.slice(0, 10)].r[+k[11]]); if (!S.pd[i]) al++; }   // עליה בודדת שפרשתה עוד לא מסומנת
  return { al, full: Object.keys(S.pd).length, cups: S.cups };
}
const modeOf = () => S.twice && S.targum ? "full" : !S.twice && !S.targum && S.rashi ? "rashi" : "";
function modeCard() {
  const m = modeOf();
  return `<div class="card modes"><h3 class="sh">${I.book} אופן הלימוד</h3><div class="mrow">
    <button class="mb ${m === "full" ? "on" : ""}" data-mode="full" aria-pressed="${m === "full"}"><b>שניים מקרא ואחד תרגום</b><span>כל פסוק פעמיים, ומתחתיו התרגום</span></button>
    <button class="mb ${m === "rashi" ? "on" : ""}" data-mode="rashi" aria-pressed="${m === "rashi"}"><b>פסוק ורש״י</b><span>הפסוק פעם אחת עם פירוש רש״י, בלי תרגום</span></button></div></div>`;
}
let navBook = "";
function navCard() {
  const bo = B.map((b, i) => `<option value="${i}" ${String(i) === navBook ? "selected" : ""}>${b.n}</option>`).join("");
  const po = navBook !== "" ? `<select data-nav="par" aria-label="פרשה"><option value="">בחר פרשה</option>${P.map((p, i) => p.b === +navBook ? `<option value="${i}">${p.n}</option>` : "").join("")}</select>` : "";
  return `<div class="card"><h3 class="sh">${I.book} ניווט לפי ספרים</h3><div class="sels2"><select data-nav="book" aria-label="ספר"><option value="">בחר ספר</option>${bo}</select>${po}</div></div>`;
}
function dayView() {
  const d = parseISO(route.date), w = shabOf(d), a = d.getDay(), isToday = route.date === iso(today());
  lastDay = route.date;
  const s = SCH[w];
  let body = "";
  if (!s) body = `<div class="card" style="text-align:center">אין נתוני לוח לתאריך הזה (הלוח כולל את התקופה ${hebFmt(parseISO(MINW))} עד ${hebFmt(parseISO(MAXW))}).<div class="nav"><button class="p" data-today>חזרה להיום</button></div></div>`;
  else {
    const r = s.r[a], done = isDone(w, a), bmH = S.bm && S.bm.k === "w:" + w && S.bm.a === a;
    body = `<div class="card al ${done ? "done" : ""}"><div class="t"><small>עלייה ${ALN[a]} · יום ${DAYN[a]}</small><b>${B[r[0]].n}, ${s.n} ${refText(r)}</b><span>${bmH ? `🔖 ממשיכים מפסוק ${gem(S.bm.v)}` : `${vcount(r)} פסוקים`}</span>${audioLink(r).replace('class="wla', 'class="wla big')}</div>
      <div class="btns"><button class="btn read" data-r="w:${w}:${a}"${bmH ? " data-resume" : ""}><span class="ic">${I.openbook}</span>${bmH ? "המשך מפסוק " + gem(S.bm.v) : "לקריאה"}</button><button class="btn chk ${done ? "on" : ""}" data-toggle="${w}:${a}">${I.check} ${done ? "למדתי" : "סמן כנלמד"}</button></div></div>`;
    const wd = weekDone(w), pct = Math.round(wd / 7 * 100), t = totals();
    body += `<div class="card"><h3 class="sh">${I.cal} ${ttl(s)} · כל העליות</h3>` +
      s.r.map((r, i) => `<div class="wlw"><button class="wl ${i === a ? "sel" : ""} ${isDone(w, i) ? "done" : ""}" data-day="${iso(dateOf(w, i))}"><span class="n">${isDone(w, i) ? "✓" : i + 1}</span><span class="x1"><b>יום ${DAYN[i]} · עלייה ${ALN[i]}</b><span>${refText(r, true)} · ${vcount(r)} פסוקים</span></span></button>${audioLink(r)}<button class="wlc ${isDone(w, i) ? "on" : ""}" data-toggle="${w}:${i}" aria-pressed="${isDone(w, i)}" aria-label="${isDone(w, i) ? "בטל סימון" : "סמן כנלמד"}: יום ${DAYN[i]}">${isDone(w, i) ? "✓ למדתי" : "☐ סמן"}</button></div>`).join("") + `</div>
    <div class="card prog"><div class="ring" style="--p:${pct}"><i>${wd}/7</i></div><div style="flex:1"><b style="font-size:18px">התקדמות השבוע</b><div style="color:var(--mute);margin:2px 0 8px">${wd} מתוך 7 עליות נלמדו</div><div class="bar"><i style="width:${pct}%"></i></div></div></div>
    <div class="tot"><div><b>${t.al}</b>עליות נלמדו</div><div><b>${t.full}</b>פרשות שלמות</div><div><b>🏆 ${t.cups}</b>סיומי תורה</div></div>`;
  }
  const mn = iso(addDays(parseISO(MINW), -6));
  let bmc = "";
  if (S.bm) {
    const k = S.bm.k, rt = k[0] === "w" ? { w: k.slice(2), a: S.bm.a } : { p: +k.slice(2), a: S.bm.a }, bs = srcOf(rt);
    bmc = `<div class="card bmcard"><div class="ico">${BMI}</div><div class="tx"><small>המשך מהמקום שעצרת</small><b>${ttl(bs)} · עלייה ${ALN[S.bm.a]}</b><span>${B[bs.r[S.bm.a][0]].n} ${gem(S.bm.c)}:${gem(S.bm.v)}</span></div><button class="go" data-r="${k[0]}:${k.slice(2)}:${S.bm.a}" data-resume>המשך ללמוד ‹</button></div>`;
  }
  return `<div class="hero"><div class="htop"><div class="logo"><img src="logo.png" alt="קהילת אבני החושן"></div><div class="hded"><div><small>לעילוי נשמת</small><b>ר׳ אברהם בן ברכה</b></div><i></i><div><small>ולעילוי נשמת</small><b>חנה בת חג׳ילה</b></div><i></i><div><small>ולעילוי נשמת</small><b>שלום שלומי בן חנה</b></div></div></div><h1>שניים מקרא <b>ואחד תרגום</b></h1><p>כל התורה · שבע עליות · מקרא עם טעמים ותרגום אונקלוס אחרי כל פסוק</p><div class="orn">✦</div></div>
  <div class="card datecard"><div class="he">${hebFmt(d)}</div><div class="gr">${wdFmt.format(d)} · ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}</div>
  ${s ? `<span class="chip ${s.h ? "hol" : ""}">${ttl(s)}</span>` : ""}${isToday && todayShifted ? `<div class="gr" style="margin-top:6px;font-size:14px">🌙 היום העברי החל בשקיעה</div>` : ""}
  ${weekStrip(d, w, isToday)}</div>
  ${modeCard()}${bmc}${body}
  ${navCard()}
  <div class="card"><h3 class="sh">${I.cal} קפיצה לתאריך</h3><div class="jump"><input type="date" id="jd" value="${route.date}" min="${mn}" max="${MAXW}" aria-label="תאריך לועזי"></div></div>
  ${shareCard()}${footer(true)}${tabs()}`;
}
function progressView() {
  const cv = coverage(), t = totals();
  let h = `<header class="rh" style="margin-bottom:12px"><button class="home" data-go="day">${I.home}<span>חזרה לדף הבית</span></button><div class="rt">התקדמות</div></header>
  <div class="card prog stick"><div class="ring" style="--p:${cv.pct}"><i>${cv.pct}%</i></div><div style="flex:1"><b style="font-size:18px">התורה כולה</b><div style="color:var(--mute);margin:2px 0 8px">${cv.g} מתוך ${cv.all} פסוקים נלמדו</div><div class="bar"><i style="width:${cv.pct}%"></i></div></div></div>
  <div class="tot"><div><b>${t.al}</b>עליות נלמדו</div><div><b>${t.full}</b>פרשות שלמות</div><div><b>🏆 ${t.cups}</b>סיומי תורה</div></div>`;
  B.forEach((bk, b) => {
    const p = cv.got[b] / cv.tot[b] * 100;
    const full = P.every((q, i) => q.b !== b || S.pd[i]);
    h += `<div class="bookrow"><div class="book"><div class="r"><b>${bk.n}</b><span>${cv.got[b]} / ${cv.tot[b]} פסוקים</span></div><div class="bar"><i style="width:${p}%;background:var(${BCOL[b]})"></i></div></div><button class="bk-all ${full ? "full" : ""}" data-bookall="${b}" aria-pressed="${full}" aria-label="${full ? "בטל סימון של כל ספר " : "סמן כנלמד את כל ספר "}${bk.n}">${full ? "✓" : "☐"}</button></div>`;
  });
  h += `<div class="card"><h3 class="sh">💾 גיבוי ושחזור</h3><div style="color:var(--mute);font-size:14px;margin-bottom:8px">ההתקדמות והסימניה נשמרות רק במכשיר הזה. כדאי לשמור גיבוי, כדי לא לאבד אותן אם נתוני הדפדפן יימחקו או כשעוברים למכשיר אחר.</div><div class="nav" style="justify-content:flex-start"><button data-bk="copy">העתק קוד גיבוי</button><button data-bk="file">שמור גיבוי לקובץ</button><button data-bk="restore">שחזר מקוד</button><button data-bk="load">שחזר מקובץ</button></div><input type="file" id="bkf" accept=".json,application/json" hidden></div>` + shareCard();
  return h + footer(false) + tabs();
}
function booksView() {
  const cw = SCH[shabOf(today())], cn = cw && !cw.h ? cw.n.split("־") : [];
  let h = `<header class="rh" style="margin-bottom:12px"><button class="home" data-go="day">${I.home}<span>חזרה לדף הבית</span></button><div class="rt">חלוקה לספרים</div></header>`;
  B.forEach((bk, b) => {
    h += `<div class="sec" style="--cc:var(${BCOL[b]})">ספר ${bk.n}</div><div class="pg">`;
    P.forEach((p, i) => {
      if (p.b !== b) return;
      const n = p.r.reduce((x, r) => x + vcount(r), 0);
      h += `<button class="${cn.includes(p.n) ? "cur" : ""}" data-par="${i}">${p.n}<small>${S.pd[i] ? "✓ נלמדה · " : ""}${cn.includes(p.n) ? "השבוע · " : ""}${n} פסוקים</small></button>`;
    });
    h += `</div>`;
  });
  return h + `<div style="text-align:center;color:var(--mute);font-size:13px;margin-top:14px">לחיצה על פרשה מציגה את שבע העליות שלה</div>` + footer(false) + tabs();
}
function parView() {
  const p = P[route.p], n = p.r.reduce((x, r) => x + vcount(r), 0);
  let h = `<header class="rh" style="margin-bottom:12px"><button class="home" data-go="books">${I.book}<span>חזרה לספרים</span></button><div class="rt">פרשת ${p.n}</div></header>
  <div class="card"><div style="text-align:center;color:var(--mute);margin-bottom:8px">ספר ${B[p.b].n} · ${n} פסוקים</div><button class="btn chk ${S.pd[route.p] ? "on" : ""}" style="width:100%;margin-bottom:6px" data-pd="${route.p}">${I.check} ${S.pd[route.p] ? "הפרשה סומנה כנלמדה" : "סמן את כל הפרשה כנלמדה"}</button>`;
  p.r.forEach((r, i) => {
    h += `<div class="wlw"><button class="wl" data-r="p:${route.p}:${i}"><span class="n">${i + 1}</span><span class="x1"><b>עלייה ${ALN[i]} · יום ${DAYN[i]}</b><span>${refText(r, true)} · ${vcount(r)} פסוקים</span></span><span class="go">‹</span></button>${audioLink(r)}</div>`;
  });
  return h + `</div><div style="text-align:center;color:var(--mute);font-size:13px">יום ראשון בשבוע = עלייה ראשונה ... שבת = עלייה שביעית</div>` + footer(false) + tabs();
}
function readView() {
  const s = srcOf(route), a = route.a;
  if (!s) return `<div class="card" style="margin-top:30px;text-align:center">הקריאה לא נמצאה.<div class="nav"><button class="p" data-go="day">לדף הבית</button></div></div>`;
  const r = s.r[a], bi = r[0], homeBtn = s.w ? `<button class="home" data-home>${I.home}<span>חזרה לדף הבית</span></button>` : `<button class="home" data-go-par="${s.p}">${I.book}<span>חזרה לפרשה</span></button>`;
  const head = `<header class="rh">${homeBtn}<div class="rt">${ttl(s)}<small>עלייה ${ALN[a]}</small></div><button class="gear" data-set aria-label="הגדרות תצוגה">Aa</button></header>`;
  loadText(bi); if (S.rashi) loadRashi(bi);
  POP = [];
  if (!TX[bi]) {
    return head + (txFail[bi] ? `<div class="card" style="text-align:center;margin-top:24px"><div style="font-size:18px;font-weight:700">לא הצלחנו לטעון את הטקסט</div><div style="color:var(--mute);margin:6px 0 12px">בדוק את החיבור לאינטרנט ונסה שוב.</div><button class="btn read" style="margin:auto" data-retry>נסה שוב</button></div>` : `<div class="cmn" style="margin-top:40px;font-size:18px;text-align:center">טוען…</div>`) + footer(true);
  }
  let t = "";
  for (let c = r[1]; c <= r[3]; c++) {
    const from = c === r[1] ? r[2] : 1, to = c === r[3] ? r[4] : B[bi].c[c - 1];
    for (let v = from; v <= to; v++) {
      const [m, g] = TX[bi][c - 1][v - 1], rc = S.rashi && RS[bi] ? RS[bi][c - 1][v - 1] : null, pb = m.endsWith("\n"), mt = m.trim();
      const on = bmAt(route, c, v), rm = !on && route.resume && route.resume.k === bmKey(route) && route.resume.a === route.a && route.resume.c === c && route.resume.v === v;
      if (on) t += `<div class="bmline" id="bmline"><span>🔖 עד כאן למדתי</span><button data-bmclear>הסר</button></div>`;
      else if (rm) t += `<div class="bmline" id="bmline"><span>🔖 כאן עצרת בפעם הקודמת</span></div>`;
      if (v === 1 || (c === r[1] && v === from)) t += `<div class="chh">פרק ${gem(c)}</div>`;
      t += `<div class="vs ${on || rm ? "bm" : ""}" id="v${c}_${v}"><div class="mk"><button class="vnum ${on ? "on" : ""}" data-bm="${c}:${v}" aria-pressed="${on}" aria-label="סימניה: ממשיכים מפסוק ${gem(v)}">${gem(v)}${BMI}</button>${verseHTML(mt, rc)}</div>${S.twice ? `<div class="mk"><span class="vnum x2" aria-label="קריאה שנייה">×2</span>${verseHTML(mt, null)}</div>` : ""}${S.targum ? `<div class="tg"><i>תרגום</i>${g}</div>` : ""}</div>${pb ? '<div class="pbr"></div>' : ""}`;
    }
  }
  const dayNm = s.w ? `יום ${DAYN[a]} · ` : "";
  const done = s.w && isDone(s.w, a);
  const bar = `<div class="rbar"><button data-prev ${a === 0 ? "disabled" : ""}>› ${a > 0 ? "עלייה " + ALN[a - 1] : "הקודמת"}</button>${s.w ? `<button class="learn ${done ? "on" : ""}" data-toggle="${s.w}:${a}">${done ? "✓ למדתי" : "סמן כנלמד"}</button>` : ""}<button class="next" data-next ${a === 6 ? "disabled" : ""}>${a < 6 ? "עלייה " + ALN[a + 1] : "הבאה"} ‹</button></div>`;
  const hint = !S.hintBm && !S.bm ? `<div class="hint"><div>💡 <b>עוצרים באמצע?</b> לחצו על מספר הפסוק הבא שעוד לא קראתם (עם סימן הסימניה). יסומן קו מעליו, ובפעם הבאה תמשיכו בדיוק משם.</div><button data-hint>הבנתי</button></div>` : "";
  return `${head}<div class="rsub">${dayNm}עלייה ${ALN[a]}<b>${refText(r, true)}</b>${audioLink(r).replace('class="wla"', 'class="wla big"')}</div>${S.rashi ? '<div class="legend"><span><i style="background:var(--hld)"></i>פירוש רש״י</span><span>· לחצו על מילה מסומנת לפירוש</span></div>' : ""}${S.rashi && rsFail[bi] ? '<div class="legend"><button class="lo" data-rsretry>רש״י לא נטען · נסה שוב</button></div>' : ""}${S.targum && S.explain ? '<div class="legend"><span><b class="exs">מילה צבועה</b> בתרגום = אונקלוס מפרש ולא מתרגם</span></div>' : ""}${hint}<div class="text ${S.explain ? "" : "noex"}" style="--fs:${S.fs}px">${t}</div>${footer(true)}${bar}`;
}
function render() {
  const sy = window.scrollY, app = $("#app");
  app.innerHTML = route.v === "read" ? readView() : route.v === "books" ? booksView() : route.v === "progress" ? progressView() : route.v === "par" ? parView() : route.v === "search" ? searchView() : dayView();
  const el = route.v === "read" && !route.keep && !route.scrollTo ? $("#bmline") : null;
  if (route.v === "search") { searchInit(); route.keep = false; return; }
  if (route.v === "read" && route.scrollTo) {                      // הגעה מתוצאת חיפוש: גוללים לפסוק (אחרי שהטקסט נטען)
    const t = $("#v" + route.scrollTo.c + "_" + route.scrollTo.v);
    if (t) { t.scrollIntoView({ block: "center" }); t.classList.remove("pulse"); void t.offsetWidth; t.classList.add("pulse"); route.scrollTo = null; route.keep = false; return; }
  }
  if (el) { const vs = $(".vs.bm"); (vs || el).scrollIntoView({ block: "center" }); if (vs) { vs.classList.remove("pulse"); void vs.offsetWidth; vs.classList.add("pulse"); } }
  else if (route.keep) window.scrollTo(0, sy); else window.scrollTo(0, 0);
  route.keep = false;
}

/* ---------- חלונות קופצים ---------- */
let prevFocus = null;
function closeSheet() {
  const ov = $("#ov"), was = ov.classList.contains("show");
  ov.classList.remove("show"); document.body.style.overflow = ""; $("#app").removeAttribute("aria-hidden");
  if (was && prevFocus && document.contains(prevFocus)) prevFocus.focus();
  prevFocus = null;
}
function openSheet(html) {
  const ov = $("#ov"); if (!ov.classList.contains("show")) prevFocus = document.activeElement;
  $("#sheet").innerHTML = html; ov.classList.add("show"); document.body.style.overflow = "hidden"; $("#app").setAttribute("aria-hidden", "true");
  ($("#sheet .x") || $("#sheet")).focus();
}
function openPop(ids) {
  const cs = ids.split(",").map(x => POP[+x]).filter(Boolean);
  openSheet(`<button class="x" data-close aria-label="סגור">✕</button>` + cs.map(c => `<div class="cmt"><span class="src">רש״י</span>${c.h ? `<h4>${c.h}</h4>` : ""}<div>${c.b}</div></div>`).join(""));
}
function settingsHTML() {
  const th = [["auto", "אוטומטי", "linear-gradient(90deg,#f4efe4 50%,#12161c 50%)"], ["light", "יום", "#f4efe4"], ["sepia", "קלף", "#efe2c3"], ["dark", "לילה", "#12161c"]];
  const sw = (k, on) => `<button class="sw ${on ? "on" : ""}" data-sw="${k}" role="switch" aria-checked="${on}"></button>`;
  return `<button class="x" data-close aria-label="סגור">✕</button><h3 class="sh" style="margin-top:4px">הגדרות תצוגה</h3>
  <div class="row"><span>גודל הכתב</span><div class="seg"><button data-fs="-2">א−</button><button class="on" disabled>${S.fs}</button><button data-fs="2">א+</button></div></div>
  <div class="row"><span>טעמי המקרא</span>${sw("taamim", S.taamim)}</div>
  <div class="row"><span>סימון מיוחד לשוא נע, לקמץ קטן ולדגש חזק</span>${sw("nk", S.nk)}</div>
  <div class="nklg"><span><i class="nk-s">בְ</i><small>שוא נע</small></span><span><i class="nk-q">מׇ</i><small>קמץ קטן</small></span><span><i class="nk-d">נּ</i><small>דגש חזק</small></span></div>
  <div style="font-size:13px;color:var(--mute);margin:0 0 6px;line-height:1.5">שוא נע מוצג כשוא מודגש, קמץ קטן כ-T מודגש, ודגש חזק כמעוין. קמץ קטן מזוהה לפי הנוסח; שוא נע ודגש חזק – אוטומטית לפי כללי הדקדוק, והוא חל על נוסח המקרא בלבד (לא על התרגום).</div>
  <div class="row"><span>פירוש רש״י <i style="display:inline-block;width:14px;height:14px;border-radius:4px;background:var(--hld);vertical-align:middle"></i></span>${sw("rashi", S.rashi)}</div>
  <div class="row"><span>כל פסוק פעמיים <small style="color:var(--mute)">(שניים מקרא)</small></span>${sw("twice", S.twice)}</div>
  <div class="row"><span>תרגום אונקלוס אחרי כל פסוק</span>${sw("targum", S.targum)}</div>
  <div class="row"><span>שמע: מעבר אוטומטי לעלייה הבאה</span>${sw("autonext", S.autonext)}</div>
  <div class="row"><span>צביעת מקומות שאונקלוס מפרש <small style="color:var(--mute)">(ולא מתרגם)</small></span>${sw("explain", S.explain)}</div>
  <div class="row"><span>היום מתחלף בשקיעה <small style="color:var(--mute)">(כמו התאריך העברי)</small></span>${sw("sunset", S.sunset)}</div>
  <div style="margin-top:12px;font-weight:700">מצב תצוגה</div>
  <div style="font-size:13px;color:var(--mute)">"אוטומטי" עוקב אחרי ההגדרה של המכשיר (בהיר או כהה)</div>
  <div class="themes" style="margin-top:8px">${th.map(([k, n, c]) => `<button class="${S.theme === k ? "on" : ""}" data-th="${k}"><i style="background:${c}"></i>${n}</button>`).join("")}</div>`;
}

/* ---------- נגן שמע ---------- */
const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const rateLabel = r => (r === 1 ? "רגילה" : "×" + r);
function setRate(r) {
  S.rate = r; save();
  const au = $("#player audio"); if (au) au.playbackRate = r;
  const sp = $("#player .pspeeds"); if (sp) { sp.hidden = true; sp.querySelectorAll("button").forEach(b => b.classList.toggle("on", +b.dataset.rate === r)); }
  const b = $("#player .pspd"); if (b) b.textContent = "⏱ מהירות: " + rateLabel(r);
}
function playAudio(src, title) {
  const box = $("#player"), cur = box.querySelector("audio");
  if (cur && cur.getAttribute("src") === src) { cur.paused ? cur.play().catch(() => {}) : cur.pause(); return; }   // לחיצה חוזרת: עצירה/המשך
  box.innerHTML = `<div class="pt"><b>🎧 ${title}</b><button data-pclose aria-label="סגור את הנגן">✕</button></div><audio controls autoplay preload="auto" src="${src}"></audio>
    <button class="pspd" data-pspd aria-label="מהירות השמעה">⏱ מהירות: ${rateLabel(S.rate)}</button>
    <div class="pspeeds" hidden>${RATES.map(r => `<button data-rate="${r}" class="${r === S.rate ? "on" : ""}">${r === 1 ? "רגילה" : r + "×"}</button>`).join("")}</div>`;
  box.hidden = false; document.body.classList.add("hasplayer");
  const au = box.querySelector("audio");
  au.playbackRate = S.rate;
  au.addEventListener("loadedmetadata", () => { au.playbackRate = S.rate; });
  au.addEventListener("ended", () => {                               // סוף הקלטה: ממשיכים לעלייה הבאה של אותה פרשה
    const m = /^(.*-)(\d)\.mp3$/.exec(src); if (!S.autonext || !m || +m[2] >= 7) return;
    const n = +m[2] + 1; playAudio(m[1] + n + ".mp3", title.replace(ALN[n - 2], ALN[n - 1])); toast("ממשיך לעלייה " + ALN[n - 1]);
  });
  au.addEventListener("error", () => { toast("לא הצלחנו לנגן את ההקלטה - בדוק חיבור לאינטרנט"); });
  au.play().catch(() => {});
}
function closePlayer() { const box = $("#player"); const au = box.querySelector("audio"); if (au) au.pause(); box.innerHTML = ""; box.hidden = true; document.body.classList.remove("hasplayer"); }
/* ---------- אירועים ---------- */
let lastCycle = null;
function checkCycle() {                                              // כל 54 הפרשות מסומנות: גביע אחד, ואיפוס להתחלה חדשה (עם ביטול)
  if (Object.keys(S.pd).length < P.length) return false;
  lastCycle = JSON.parse(JSON.stringify({ done: S.done, pd: S.pd, pdAuto: S.pdAuto, bm: S.bm, cups: S.cups }));
  S.cups++; S.done = {}; S.pd = {}; S.pdAuto = {}; S.bm = null; save();
  openSheet(`<button class="x" data-close aria-label="סגור">✕</button><div style="text-align:center;clear:both"><div style="font-size:72px;line-height:1.1">🏆</div><h3 class="sh" style="justify-content:center;margin-top:6px">חזק וברוך! סיימת את כל התורה</h3><p style="margin:4px 0 14px">זה סיום מספר <b>${S.cups}</b>. נרשם לך גביע, וההתקדמות אופסה כדי להתחיל לימוד חדש.</p><div class="nav"><button class="p" data-close>המשך ללמוד</button><button data-cycleundo>ביטול - החזר את ההתקדמות</button></div></div>`);
  return true;
}
function toggleDone(w, a) {
  const k = dk(w, a); if (S.done[k]) delete S.done[k]; else { S.done[k] = 1; toast("סומן כנלמד ✓"); }
  syncWeek(w); save(); checkCycle(); route.keep = true; render();
}
document.addEventListener("click", e => {
  if (e.target.id === "ov") return closeSheet();
  const t = e.target.closest("[data-go],[data-go-par],[data-r],[data-par],[data-toggle],[data-day],[data-week],[data-sunset],[data-today],[data-fs],[data-set],[data-sw],[data-th],[data-close],[data-next],[data-prev],[data-home],[data-retry],[data-rsretry],[data-cycleundo],[data-play],[data-pclose],[data-pspd],[data-rate],[data-mode],[data-share],[data-installhelp],[data-refresh],[data-offline],[data-newver-update],[data-newver-later],[data-bkdo],[data-sr],[data-smore],[data-sfull],[data-pd],[data-bookall],[data-bk],[data-p],[data-undo],[data-bm],[data-bmclear],[data-hint]");
  if (!t) return;
  const D = t.dataset;
  if (t.hasAttribute("data-close")) closeSheet();
  else if (D.p) openPop(D.p);
  else if (t.hasAttribute("data-set")) openSheet(settingsHTML());
  else if (D.sw) { S[D.sw] = !S[D.sw]; save(); if (D.sw === "sunset") checkDayRoll(); if (D.sw === "nk") applyNk(); t.classList.toggle("on", S[D.sw]); t.setAttribute("aria-checked", S[D.sw]); route.keep = true; render(); }
  else if (D.th) { S.theme = D.th; applyTheme(); save(); document.querySelectorAll("#sheet [data-th]").forEach(b => b.classList.toggle("on", b.dataset.th === S.theme)); }
  else if (D.fs && t.closest("#sheet")) { S.fs = Math.min(48, Math.max(16, S.fs + +D.fs)); save(); const tx = $(".text"); if (tx) tx.style.setProperty("--fs", S.fs + "px"); const lb = t.parentElement.querySelector(".on"); if (lb) lb.textContent = S.fs; }
  else if (t.hasAttribute("data-home")) go({ v: "day", date: route.w ? iso(dateOf(route.w, route.a)) : (lastDay || iso(today())) });
  else if (D.bm) { const [c, v] = D.bm.split(":").map(Number); if (bmAt(route, c, v)) { S.bm = null; toast("הסימניה הוסרה"); } else { S.bm = { k: bmKey(route), a: route.a, c, v }; route.resume = null; S.hintBm = true; toast(`🔖 סומן: עד כאן למדתי · פסוק ${gem(v)}`); } save(); route.keep = true; render(); }
  else if (t.hasAttribute("data-bmclear")) { S.bm = null; save(); toast("הסימניה הוסרה"); route.keep = true; render(); }
  else if (t.hasAttribute("data-hint")) { S.hintBm = true; save(); route.keep = true; render(); }
  else if (t.hasAttribute("data-rsretry")) { const sr = srcOf(route); if (sr) { delete rsFail[sr.r[route.a][0]]; rsToasted = false; route.keep = true; render(); } }
  else if (t.hasAttribute("data-retry")) { const s = srcOf(route); if (s) { delete txFail[s.r[route.a][0]]; render(); } }
  else if (D.goPar != null) go({ v: "par", p: +D.goPar });
  else if (D.mode) { S.twice = D.mode === "full"; S.targum = D.mode === "full"; S.rashi = true; save(); toast(D.mode === "full" ? "שניים מקרא ואחד תרגום" : "פסוק ורש״י בלבד"); route.keep = true; render(); }
  else if (D.play) playAudio(D.play, D.ttl);
  else if (t.hasAttribute("data-pclose")) closePlayer();
  else if (t.hasAttribute("data-pspd")) { const sp = $("#player .pspeeds"); sp.hidden = !sp.hidden; }
  else if (D.rate && t.closest("#player")) setRate(+D.rate);
  else if (D.share) shareApp(D.share);
  else if (t.hasAttribute("data-installhelp")) openSheet(installHelpHTML());
  else if (t.hasAttribute("data-refresh")) hardRefresh();
  else if (t.hasAttribute("data-offline")) offlineDownload();
  else if (t.hasAttribute("data-newver-update")) hardRefresh();
  else if (t.hasAttribute("data-newver-later")) { const b = $("#newver"); if (b) { verDismissed = b.dataset.v; b.remove(); } }
  else if (t.hasAttribute("data-bkdo")) { const c = ($("#bkcode").value || "").trim(); if (!c) return; closeSheet(); try { applyBackup(fromCode(c)); } catch (er) { toast("הקוד לא תקין"); } }
  else if (t.hasAttribute("data-smore")) { SQ.shown += 100; drawResults(); }
  else if (t.hasAttribute("data-sfull")) { SQ.full = true; SQ.shown = 100; const cb = $("#sfull"); if (cb) cb.checked = true; runSearch(); }
  else if (D.sr) { const [b, c, v] = D.sr.split(":").map(Number), loc = locate(b, c + 1, v + 1); if (!loc) return toast("לא נמצאה עלייה לפסוק הזה"); SQ.scroll = window.scrollY; go({ v: "read", p: loc.p, a: loc.a, scrollTo: { c: c + 1, v: v + 1 } }); }
  else if (D.pd != null) { const i = +D.pd; delete S.pdAuto[i]; if (S.pd[i]) delete S.pd[i]; else { S.pd[i] = 1; toast("הפרשה סומנה כנלמדה ✓"); } save(); checkCycle(); route.keep = true; render(); }
  else if (t.hasAttribute("data-cycleundo")) { if (lastCycle) { Object.assign(S, lastCycle); lastCycle = null; save(); closeSheet(); toast("ההתקדמות הוחזרה"); route.keep = true; render(); } }
  else if (D.bookall != null) {
    const b = +D.bookall, full = P.every((q, i) => q.b !== b || S.pd[i]);
    P.forEach((q, i) => { if (q.b === b) { delete S.pdAuto[i]; if (full) delete S.pd[i]; else S.pd[i] = 1; } });
    save(); checkCycle(); toast(full ? "הסימון של " + B[b].n + " בוטל" : B[b].n + " סומן כנלמד ✓"); route.keep = true; render();
  }
  else if (D.bk) backup(D.bk);
  else if (D.go) go(D.go === "day" ? { v: "day", date: iso(today()) } : D.go === "books" ? { v: "books" } : D.go === "progress" ? { v: "progress" } : D.go === "search" ? { v: "search" } : { v: "day", date: iso(today()) });
  else if (D.par != null) go({ v: "par", p: +D.par });
  else if (t.hasAttribute("data-undo")) { if (lastBm) { S.bm = lastBm; lastBm = null; save(); $("#toast").classList.remove("show"); if (route.v === "read") route.resume = null; route.keep = true; render(); } }
  else if (D.r) {
    const [k, x, a] = D.r.split(":"), r = k === "w" ? { v: "read", w: x, a: +a } : { v: "read", p: +x, a: +a };
    if (t.hasAttribute("data-resume") && S.bm) {                       // ממשיכים ללמוד - הסימניה הישנה כבר לא נחוצה
      lastBm = S.bm; r.resume = S.bm; S.bm = null; save(); toast("הסימניה הוסרה - מתקדמים הלאה", "ביטול");
    }
    go(r);
  }
  else if (D.toggle) { const [w, a] = D.toggle.split(":"); toggleDone(w, +a); }
  else if (D.sunset != null) { S.sunset = D.sunset === "1"; save(); checkDayRoll(); toast(S.sunset ? "היום מתחלף בשקיעה" : "היום מתחלף בחצות"); route.keep = true; render(); }
  else if (D.day) go({ v: "day", date: D.day });
  else if (D.week) {
    const nd = addDays(parseISO(route.date), 7 * +D.week);
    if (!SCH[shabOf(nd)]) return toast("אין נתוני לוח לשבוע הזה");
    go({ v: "day", date: iso(nd) });
  }
  else if (t.hasAttribute("data-today")) go({ v: "day", date: iso(today()) });
  else if (t.hasAttribute("data-next") || t.hasAttribute("data-prev")) {
    const a = route.a + (t.hasAttribute("data-next") ? 1 : -1); if (a < 0 || a > 6) return;
    go(Object.assign({}, route, { a, keep: false, resume: null }), true);
  }
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeSheet();
  if (e.key === "Tab" && $("#ov").classList.contains("show")) {   // מלכודת פוקוס: Tab לא יוצא מהחלונית לשורת הכתובת של הדפדפן
    const sh = $("#sheet"), fs = [...sh.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(x => x.offsetParent !== null || x === document.activeElement);
    if (!fs.length) { e.preventDefault(); sh.focus(); }
    else {
      const first = fs[0], last = fs[fs.length - 1], ae = document.activeElement;
      if (!sh.contains(ae) || ae === sh) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
      else if (e.shiftKey && ae === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && ae === last) { e.preventDefault(); first.focus(); }
    }
  }
  if ((e.key === "Enter" || e.key === " ") && e.target.getAttribute && e.target.getAttribute("role") === "button") { e.preventDefault(); e.target.click(); }
});
window.addEventListener("online", () => { for (const k in rsFail) delete rsFail[k]; rsToasted = false; if (route.v === "read") { route.keep = true; render(); } });
/* ---------- גיבוי ושחזור ---------- */
const bkData = () => ({ app: "shnayim-mikra", v: 1, done: S.done, pd: S.pd, cups: S.cups, bm: S.bm });
const toCode = o => { const b = new TextEncoder().encode(JSON.stringify(o)); let s = ""; for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192)); return btoa(s); };
const fromCode = c => { if (c.length > 200000) throw 0; return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(c), ch => ch.charCodeAt(0)))); };
function applyBackup(o) {
  if (!o || o.app !== "shnayim-mikra" || !o.done || typeof o.done !== "object" || Array.isArray(o.done)) throw 0;
  if (!confirm("השחזור יחליף את ההתקדמות, הסימניה וסיומי התורה שבמכשיר בנתוני הגיבוי. להמשיך?")) return;
  S.done = Object.fromEntries(Object.keys(o.done).filter(k => /^\d{4}-\d\d-\d\d:[0-6]$/.test(k) && k.slice(0, 10) in SCH).map(k => [k, 1]));
  S.pd = o.pd && typeof o.pd === "object" && !Array.isArray(o.pd) ? Object.fromEntries(Object.keys(o.pd).filter(k => /^\d+$/.test(k) && P[+k]).map(k => [k, 1])) : {};
  S.pdAuto = {};
  S.cups = Number.isInteger(o.cups) && o.cups >= 0 && o.cups < 1000 ? o.cups : 0;
  S.bm = o.bm && typeof o.bm === "object" ? o.bm : null; validateBm();
  save(); toast("הגיבוי שוחזר ✓"); route.keep = true; render();
}
function backup(kind) {
  if (kind === "copy") {
    const c = toCode(bkData());
    (navigator.clipboard ? navigator.clipboard.writeText(c).then(() => toast("הקוד הועתק - שמור אותו במקום בטוח")) : Promise.reject()).catch(() => prompt("העתק את הקוד ושמור אותו:", c));
  } else if (kind === "file") {
    const json = JSON.stringify(bkData()), name = "shnayim-mikra-backup-" + iso(today()) + ".json";
    const f = typeof File === "function" ? new File([json], name, { type: "application/json" }) : null;
    if (f && navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f] }).catch(() => {}); return; }
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } else if (kind === "restore") {
    openSheet(`<button class="x" data-close aria-label="סגור">✕</button><h3 class="sh" style="margin-top:4px">שחזור מקוד</h3><p style="margin:0 0 8px;color:var(--mute);font-size:14px">הדביקו כאן את קוד הגיבוי ולחצו ״שחזר״.</p><textarea id="bkcode" dir="ltr" rows="5" style="width:100%;box-sizing:border-box;border:1px solid var(--line);border-radius:10px;padding:10px;font-size:14px;background:var(--bg);color:var(--ink)"></textarea><div class="nav"><button class="p" data-bkdo>שחזר</button></div>`);
    setTimeout(() => { const t = $("#bkcode"); if (t) t.focus(); }, 50);
  } else if (kind === "load") $("#bkf").click();
}
document.addEventListener("change", e => {
  const nv = e.target.dataset && e.target.dataset.nav;
  if (nv === "book") { navBook = e.target.value; route.keep = true; render(); return; }
  if (nv === "par") { if (e.target.value !== "") go({ v: "par", p: +e.target.value }); return; }
  if (e.target.id === "bkf" && e.target.files[0]) { const r = new FileReader(); r.onload = () => { try { if (r.result.length > 400000) throw 0; applyBackup(JSON.parse(r.result)); } catch (x) { toast("הקובץ לא תקין"); } }; r.readAsText(e.target.files[0]); e.target.value = ""; return; }
  if (e.target.id === "jd") {
    const v = e.target.value; if (!/^\d{4}-\d\d-\d\d$/.test(v)) return;
    if (!SCH[shabOf(parseISO(v))]) return toast("אין נתוני לוח לתאריך הזה");
    go({ v: "day", date: v });
  }
});
let shownToday = iso(today());
function checkDayRoll() {                                            // עבר יום (או שקיעה) בזמן שהאפליקציה פתוחה
  const t = iso(today()); if (t === shownToday) return;
  const wasToday = route.v === "day" && route.date === shownToday; shownToday = t;
  if (wasToday) go({ v: "day", date: t }, true); else if (route.v === "day") { route.keep = true; render(); }
}
let hiddenAt = 0;
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") { hiddenAt = Date.now(); return; }
  if (hiddenAt && Date.now() - hiddenAt > 3 * 3600e3 && route.v === "day" && route.date !== iso(today())) go({ v: "day", date: iso(today()) }, true);
  checkDayRoll(); checkNewVersion();
});
window.addEventListener("pageshow", checkDayRoll); window.addEventListener("focus", checkDayRoll);
setInterval(checkDayRoll, 30000);
setInterval(checkNewVersion, 30 * 60000); setTimeout(checkNewVersion, 5000);
fromHash();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(err => console.error("SW registration failed:", err));
