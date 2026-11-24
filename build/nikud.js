/* הדגשת ניקוד: שוא נע, קמץ קטן, דגש חזק.
   קמץ קטן: מזוהה לפי הקידוד בנוסח (U+05C7) - ודאי.
   שוא נע ודגש חזק: זיהוי לפי כללי הדקדוק (אלגוריתם), על סמך הניקוד והטעמים. אינו מחליף בדיקה של מדקדק.
   מוצא: NK.html(טקסט, האם_להציג_טעמים) - מחזיר HTML; אותיות עם שוא נע / קמץ קטן / דגש חזק עטופות ב-<i class="nk-s|nk-d|nk-sd|nk-q|nk-dq"> */
(function (root) {
  "use strict";
  const WORD = /(?:[א-ת][֑-ׇֽֿׁׂׅׄ]*)+/g;
  const CL = /([א-ת])([֑-ׇֽֿׁׂׅׄ]*)/g;
  const BEGAD = "בגדכפת";
  const NOSTRESS = new Set([0x59A, 0x59D, 0x5A0, 0x5AD, 0x599, 0x5A9]);   // טעמים שאינם מסמנים את הברת הטעם: יתיב, גרש מוקדם, תלישא גדולה, דחי, פשטא, תלישא קטנה
  const hasStress = s => { for (const ch of s) { const c = ch.codePointAt(0); if (c >= 0x591 && c <= 0x5AF && !NOSTRESS.has(c)) return true; } return false; };

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
    const out = L.map(() => ({ sn: false, dc: false }));
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
    // שוא נע
    for (let i = 0; i < n; i++) {
      const x = L[i]; if (!x.shva || x.hataf) continue;
      let na;
      if (i === 0) na = true;                                                          // בתחילת מילה
      else if (i === n - 1) na = false;                                                // בסוף מילה
      else if (L[i - 1].shva) na = true;                                               // השני משני שואים רצופים
      else if (i === 1 && L[0].shuruk) na = true;                                      // ו החיבור בשורוק: הברה פתוחה (וּלְ, וּבְ...)
      else if (out[i].dc) na = true;                                                   // תחת אות דגושה בדגש חזק
      else if (L[i + 1].shva && i + 1 !== n - 1) na = false;                           // הראשון משני שואים רצופים
      else if (L[i + 1].c === x.c && !L[i + 1].shva) na = true;                        // תחת הראשונה מבין שתי אותיות זהות
      else {
        const k = kind(i - 1);
        na = k === "long";                                                              // אחרי תנועה גדולה: נע; אחרי קצרה: נח
      }
      out[i].sn = na;
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
