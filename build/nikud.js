/* הדגשת ניקוד: שוא נע, קמץ קטן, דגש חזק.
   קמץ קטן: מזוהה לפי הקידוד בנוסח (U+05C7) - ודאי.
   שוא נע ודגש חזק: זיהוי לפי כללי הדקדוק (אלגוריתם), על סמך הניקוד והטעמים. אינו מחליף בדיקה של מדקדק.
   מוצא: NK.html(טקסט, האם_להציג_טעמים) - מחזיר HTML; אותיות עם שוא נע / קמץ קטן / דגש חזק עטופות ב-<i class="nk-s|nk-d|nk-sd|nk-q|nk-dq"> */
(function (root) {
  "use strict";
  const WORD = /(?:[א-ת][֑-ׇֽֿׁׂׅׄ]*)+/g;
  const CL = /([א-ת])([֑-ׇֽֿׁׂׅׄ]*)/g;
  const BEGAD = "בגדכפתךף";
  const NOSTRESS = new Set([0x59A, 0x59D, 0x5A0, 0x5AD, 0x599, 0x5A9]);   // טעמים שאינם מסמנים את הברת הטעם: יתיב, גרש מוקדם, תלישא גדולה, דחי, פשטא, תלישא קטנה
  const hasStress = s => { for (const ch of s) { const c = ch.codePointAt(0); if (c >= 0x591 && c <= 0x5AF && !NOSTRESS.has(c)) return true; } return false; };


  /* ---- מילון חריגים וכללים (הרב מאיר מזוז - סולת נקיה / תנ"ך איש מצליח) ---- */
  const canonL = (c, m) => c + [...m].map(ch => ch.codePointAt(0)).filter(cp => !(cp >= 0x591 && cp <= 0x5AF) && cp !== 0x5BD).map(cp => cp === 0x5C7 ? 0x5B8 : cp).sort((a, b) => a - b).map(cp => String.fromCodePoint(cp)).join("");
  const canonWord = w => { const r = []; let m; CL.lastIndex = 0; while ((m = CL.exec(w))) r.push(canonL(m[1], m[2])); return r; };
  const mk = (forms, idx, extra) => ({ set: new Set(forms.map(f => canonWord(f).join("|"))), idx, ...extra });
  const SHVA_EXC = [
    mk(["שְׁתַּיִם", "שְׁתֵּי", "שְׁתֵּיהֶם", "שְׁתֵּיהֶן", "שְׁתֵּינוּ", "שְׁתֵּיכֶם", "שְׁתֵּיכֶן"], 0, { why: "חריג: שְׁתַּיִם" }),
    mk(["הִנְנִי", "הִנְנִי־נָא"], 1, { why: "חריג: הִנְנִי" }),
    mk(["יִהְיֶה", "תִּהְיֶה", "אֶהְיֶה", "נִהְיֶה", "יִחְיֶה", "תִּחְיֶה", "אֶחְיֶה", "נִחְיֶה"], 1, { why: "חריג: יִהְיֶה / יִחְיֶה (געיה קלה)" }),
    mk(["וַיִּשְׁתַּחוּ", "וַתִּשְׁתַּחוּ"], 1, { why: "חריג: וַיִּשְׁתַּחוּ" }),
  ];
  const KAM_GADOL = [
    mk(["בָּתִּים", "בָּתֵּי", "בָּתֵּינוּ", "בָּתֵּיכֶם", "בָּתֵּיהֶם", "בָּתֵּיהֶן", "הַבָּתִּים", "וּבָתִּים", "לְבָתֵּיכֶם", "מִבָּתֵּיכֶם"], 0, {}),
    mk(["אָנָּא", "אָנָּה"], 0, {}),
    mk(["הָלְאָה"], 0, { shvaNa: "חריג: הָלְאָה (הלמ״ד בשוא נע)" }),
    mk(["שָׁתּוּ", "זָרּוּ"], 0, {}),
  ];
  const KAM_KATAN = [
    mk(["קָדָשִׁים", "הַקָּדָשִׁים", "קָדָשָׁיו", "קָדָשֶׁיךָ", "קָדָשֵׁינוּ", "קָדָשֵׁיכֶם", "קָדָשֵׁיהֶם", "לְקָדָשִׁים", "בַּקָּדָשִׁים"], 0, {}),
    mk(["שָׁרָשִׁים", "שָׁרָשָׁיו", "שָׁרָשֶׁיהָ", "שָׁרָשֵׁינוּ", "שָׁרָשֵׁיכֶם", "שָׁרָשֵׁיהֶם"], 0, {}),
    mk(["מָחֳרָת", "לְמָחֳרָת", "מִמָּחֳרָת"], 0, {}),
    mk(["בָּאֳנִי", "בָּאֳנִיּוֹת", "וָאֳנִי"], 0, {}),
  ];
  /* ינמלו"י: שוא נע גם כשהדגש נשמט. תבנית: רשימת אותיות (עיצור + סימנים נדרשים), start = רק בתחילת מילה */
  const YIT = [
    { p: ["וַ", "יְ"], start: true, why: 'ינמלו"י: וַיְ' }, { p: ["הַ", "מְ"], start: true, why: 'ינמלו"י: הַמְ' },
    { p: ["בַ", "מְ"], start: true, why: 'ינמלו"י: בַּמְ' }, { p: ["לַ", "מְ"], start: true, why: 'ינמלו"י: לַמְ' }, { p: ["כַ", "מְ"], start: true, why: 'ינמלו"י: כַּמְ' },
    { p: ["לְ", "לוּ"], start: false, why: 'ינמלו"י: לְלוּ' },
    { p: ["עִ", "וְ", "ר"], start: false, why: 'ינמלו"י: עִוְר' }, { p: ["צִ", "וְ", "ח"], start: false, why: 'ינמלו"י: צִוְח' },
  ].map(e => ({ ...e, p: e.p.map(t => canonWord(t)[0] || (() => { const q = [...t]; return q[0] + q.slice(1).sort().join(""); })()) }));
  const letterHas = (lc, pc) => lc[0] === pc[0] && [...pc].slice(1).every(ch => lc.includes(ch));

  function analyze(word, silluq) {
    const L = []; let m; CL.lastIndex = 0;
    while ((m = CL.exec(word))) L.push({ c: m[1], m: m[2] });
    const n = L.length;
    for (const x of L) {
      const s = x.m;
      x.shva = s.includes("ְ");
      x.hataf = /[ֱ-ֳ]/.test(s);
      x.dag = s.includes("ּ");
      x.qq = s.includes("ׇ");
      x.hiriq = s.includes("ִ"); x.tsere = s.includes("ֵ"); x.segol = s.includes("ֶ");
      x.longV = /[ֵָֹֺ]/.test(s);
      x.shortV = /[ִֶַׇֻ]/.test(s);
      x.stress = hasStress(s);
      x.meteg = s.includes("ֽ");
      if (x.c === "ו" && x.dag && !x.longV && !x.shortV && !x.shva && !x.hataf) { x.shuruk = true; x.dag = false; x.longV = true; }   // ו עם דגש = שורוק
    }
    const quiet = x => !x.longV && !x.shortV && !x.shva && !x.hataf && !x.dag;       // אות שאינה נושאת תנועה (אמות קריאה וכד')
    const maleYod = j => !!L[j + 1] && L[j + 1].c === "י" && quiet(L[j + 1]);         // חיריק/צירי/סגול מלא
    const kind = j => {                                                                // סוג התנועה שבה מסתיימת האות j
      const x = L[j];
      if (x.longV) return "long";
      if (x.hiriq || x.segol) return maleYod(j) ? "long" : "short";
      if (x.shortV) return "short";
      if (x.hataf) return "hataf";
      if (x.shva) return "shva";
      if (j === 0) return "none";
      return kind(j - 1);                                                              // אם קריאה: ממשיכה את התנועה שלפניה
    };
    const vowelIdx = j => { while (j > 0 && quiet(L[j]) && !L[j].shuruk) j--; return j; };
    // תבנית מילה מנורמלת (ללא טעמים ומתג) לחיפוש במילון החריגים
    const canon = L.map(x => canonL(x.c, x.m));
    const key = canon.join("|");
    const firstKamatz = from => { for (let i = from; i < n; i++) if (L[i].m.includes("ָ") || L[i].qq) return i; return -1; };
    // קמץ: קודם מילון חריגים (גדול/קטן), אחר כך קידוד הנוסח (U+05C7), קמץ לפני חטף-קמץ וקָדָשִׁים/שָׁרָשִׁים
    for (const e of KAM_GADOL) if (e.set.has(key)) { const k = firstKamatz(e.idx); if (k >= 0) { L[k].qq = false; L[k].shortV = false; L[k].longV = true; L[k].forcedGadol = true; } }
    L.forEach((x, i) => {
      if (x.qq || x.forcedGadol || !x.m.includes("ָ")) return;
      const nx = L[i + 1];
      if (nx && nx.m.includes("ֳ") && !x.meteg) { x.qq = true; x.shortV = true; x.longV = false; }
    });
    for (const e of KAM_KATAN) if (e.set.has(key)) { const k = firstKamatz(e.idx); if (k >= 0) { L[k].qq = true; L[k].shortV = true; L[k].longV = false; } }
    // שוא: חריגים לפי מילון (קודם) ואחר כך ינמלו"י
    const forced = new Array(n).fill(null);
    for (const e of SHVA_EXC) if (e.set.has(key)) { for (let i = e.idx; i < n; i++) if (L[i].shva && !L[i].hataf) { forced[i] = { na: false, why: e.why }; break; } }
    for (const e of KAM_GADOL) if (e.shvaNa && e.set.has(key)) { for (let i = 0; i < n; i++) if (L[i].shva && !L[i].hataf) { forced[i] = { na: true, why: e.shvaNa }; break; } }
    for (const e of YIT) {
      for (let st = 0; st + e.p.length <= n; st++) {
        if (e.start && st > 0) break;
        if (e.p.every((pc, j) => letterHas(canon[st + j], pc))) {
          for (let j = 0; j < e.p.length; j++) { const L2 = L[st + j]; if (L2.shva && !L2.hataf && !forced[st + j]) forced[st + j] = { na: true, why: e.why }; }
        }
      }
    }
    const out = L.map(() => ({ sn: false, dc: false, why: "" }));
    // דגש חזק
    for (let i = 0; i < n; i++) {
      const x = L[i]; if (!x.dag) continue;
      if (x.c === "ה" && i === n - 1) continue;                                        // מפיק
      if (BEGAD.includes(x.c)) {
        if (i === 0) continue;                                                         // תחילת מילה: דגש קל
        const k = kind(i - 1);
        out[i].dc = k === "long" || k === "short" || k === "hataf";                    // אחרי תנועה: חזק; אחרי שוא: קל
      } else out[i].dc = true;
    }
    // שוא נע - חמשת הכללים + חריגים (הרב מזוז)
    for (let i = 0; i < n; i++) {
      const x = L[i]; if (!x.shva || x.hataf) continue;
      const prv = L[i - 1], nxt = L[i + 1];
      let na, why;
      const shtayim = x.c === "ש" && i <= 1 && nxt && nxt.c === "ת" && nxt.dag && L[i + 2] && L[i + 2].c === "י";
      const hineni = x.c === "נ" && prv && prv.c === "ה" && prv.hiriq && nxt && (nxt.c === "נ" || x.dag);
      if (forced[i]) { na = forced[i].na; why = forced[i].why; }
      else if (shtayim) { na = false; why = "חריג: שְׁתַּיִם / שְׁתֵּי"; }
      else if (hineni) { na = false; why = "חריג: הִנְנִי / הִנְּךָ"; }
      else if (i === 0) { na = true; why = "תחילת מילה"; }
      else if (i === n - 1) { na = false; why = "סוף מילה"; }
      else if (prv.shva && !prv.hataf) { na = true; why = "השני משני שואים רצופים"; }
      else if (i === 1 && L[0].shuruk) { na = true; why = "אחרי ו החיבור בשורוק"; }
      else if (out[i].dc) { na = true; why = "תחת דגש חזק"; }
      else if (nxt.shva && !nxt.hataf) { na = false; why = i + 1 === n - 1 ? "שני שואים בסוף מילה" : "הראשון משני שואים רצופים"; }
      else if (nxt.c === x.c && !nxt.shva) {
        const pv = L[vowelIdx(i - 1)], k0 = kind(i - 1);
        if (k0 === "short" && pv.stress) { na = false; why = "שתי אותיות זהות, אך לפניו תנועה קטנה מוטעמת"; }
        else { na = true; why = "תחת הראשונה משתי אותיות זהות"; }
      }
      else {
        const k = kind(i - 1);
        if (k === "long") {
          const v = L[vowelIdx(i - 1)];
          const gaya = v.meteg && !silluq, stressed = v.stress || (silluq && v.meteg);
          na = gaya ? true : !stressed;
          why = gaya ? "אחרי תנועה גדולה עם געיה" : stressed ? "אחרי תנועה גדולה מוטעמת: נח" : "אחרי תנועה גדולה ללא טעם";
        } else { na = false; why = "אחרי תנועה קצרה"; }
      }
      out[i].sn = na; out[i].why = why;
    }
    return { L, out };
  }

  /* הדגשה בצורת הגליף: אות שנושאת שוא נע / דגש חזק עטופה ב-<i> שמציג אותה בגרסת גופן מיוחדת
     (nk-s = שוא נע, nk-d = דגש חזק, nk-q = קמץ קטן, ושילובים nk-sd, nk-dq). */
  function word(w, taamim, silluq) {
    const { L, out } = analyze(w, silluq);
    let h = "";
    L.forEach((x, i) => {
      let c = x.c;
      for (const ch of x.m) {
        const cp = ch.codePointAt(0);
        if (!taamim && cp >= 0x591 && cp <= 0x5AF) continue;
        c += ch;
      }
      const sn = out[i].sn, dc = out[i].dc, q = x.qq;
      const cls = q && dc ? "nk-dq" : q ? "nk-q" : sn && dc ? "nk-sd" : sn ? "nk-s" : dc ? "nk-d" : "";
      h += cls ? `<i class="${cls}">${c}</i>` : c;
    });
    return h;
  }
  /* text: פסוק או חלק ממנו. taamim=false מסיר את הטעמים (כמו stripT) אך הזיהוי נעשה עם הטעמים */
  function html(text, taamim) {
    const t = String(text);
    let res = "", last = 0, m; WORD.lastIndex = 0;
    const plain = s => taamim ? s : s.replace(/[֑-֯׀]/g, "");
    while ((m = WORD.exec(t))) {
      const after = t.slice(m.index + m[0].length, m.index + m[0].length + 3).replace(/[\sֽ]/g, "");
      const silluq = after.startsWith("׃");
      res += plain(t.slice(last, m.index)) + word(m[0], taamim, silluq);
      last = m.index + m[0].length;
    }
    return res + plain(t.slice(last));
  }
  const api = { html, analyze };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.NK = api;
})(typeof window !== "undefined" ? window : globalThis);
