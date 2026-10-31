(function () {
  const USER = "Grepleon";
  const NS = "http://www.w3.org/2000/svg";
  const MONTHS = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

  const yearSvg = document.getElementById("activity-year-svg");
  const sourceEl = document.getElementById("activity-source");
  const allSection = document.getElementById("activity-all");
  const allSvg = document.getElementById("activity-all-svg");
  const statsEl = document.getElementById("activity-stats");
  const msgEl = document.getElementById("activity-msg");

  if (!yearSvg || !allSvg) return;

  const pad2 = n => String(n).padStart(2, "0");
  const isoDate = d => d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  const parseDate = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const mondayIndex = d => (d.getDay() + 6) % 7;
  const fmtNum = n => n.toLocaleString("ru-RU");

  function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }
  const contribWord = n => plural(n, "вклад", "вклада", "вкладов");
  const dayWord = n => plural(n, "день", "дня", "дней");

  const longDate = s => parseDate(s).toLocaleDateString("ru-RU", {
    weekday: "short", day: "numeric", month: "long", year: "numeric"
  });
  const shortDate = s => parseDate(s).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

  function el(name, attrs, text) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }

  function makeLevelFn(days) {
    const nz = days.map(d => d.count).filter(c => c > 0).sort((a, b) => a - b);
    if (!nz.length) return () => 0;
    const q = p => nz[Math.min(nz.length - 1, Math.floor(p * nz.length))];
    const q1 = q(0.25), q2 = q(0.5), q3 = q(0.75);
    return c => (c === 0 ? 0 : c <= q1 ? 1 : c <= q2 ? 2 : c <= q3 ? 3 : 4);
  }

  async function loadAll() {
    const r = await fetch("https://github-contributions-api.jogruber.de/v4/" + USER + "?y=all");
    if (!r.ok) throw new Error("history " + r.status);
    const j = await r.json();
    const today = isoDate(new Date());
    const days = j.contributions
      .map(c => ({ date: c.date, count: c.count }))
      .filter(c => c.date <= today)
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    if (!days.length) throw new Error("no data");
    return { days, full: true, note: "GitHub, публичный календарь профиля" };
  }

  async function loadEvents() {
    const perDay = {};
    for (let page = 1; page <= 3; page++) {
      const r = await fetch("https://api.github.com/users/" + USER + "/events/public?per_page=100&page=" + page);
      if (!r.ok) throw new Error("events " + r.status);
      const events = await r.json();
      if (!events.length) break;
      for (const e of events) {
        if (e.type !== "PushEvent") continue;
        const day = isoDate(new Date(e.created_at));
        const n = (e.payload && (e.payload.distinct_size ?? e.payload.size)) || 1;
        perDay[day] = (perDay[day] || 0) + n;
      }
    }
    const days = [];
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    for (let i = 364; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(end.getDate() - i);
      const k = isoDate(d);
      days.push({ date: k, count: perDay[k] || 0 });
    }
    return { days, full: false, note: "GitHub, только коммиты из публичных событий (около 90 дней)" };
  }

  function sectorPath(cx, cy, r1, r2, a1, a2) {
    const pt = (r, a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
    const [x1, y1] = pt(r2, a1), [x2, y2] = pt(r2, a2);
    const [x3, y3] = pt(r1, a2), [x4, y4] = pt(r1, a1);
    const large = a2 - a1 > Math.PI ? 1 : 0;
    return "M" + x1 + " " + y1 +
           "A" + r2 + " " + r2 + " 0 " + large + " 1 " + x2 + " " + y2 +
           "L" + x3 + " " + y3 +
           "A" + r1 + " " + r1 + " 0 " + large + " 0 " + x4 + " " + y4 + "Z";
  }

  function drawRing(svg, days, o) {
    svg.textContent = "";
    const first = parseDate(days[0].date);
    const offset = mondayIndex(first);
    const cols = Math.floor((days.length - 1 + offset) / 7) + 1;
    const colW = (Math.PI * 2 - o.seam) / cols;

    const marks = [];
    days.forEach((d, idx) => {
      const dt = parseDate(d.date);
      if (dt.getDate() === 1) {
        marks.push({ col: Math.floor((idx + offset) / 7), m: dt.getMonth(), y: dt.getFullYear() });
      }
    });
    if (marks.length && marks[0].col > 3) {
      marks.unshift({ col: 0, m: first.getMonth(), y: first.getFullYear() });
    }
    const labelR = o.r0 + 7 * o.th + 18;
    marks.forEach(mk => {
      if (o.yearsOnly && mk.m !== 0 && mk.col !== 0) return;
      const isYear = mk.m === 0 || o.yearsOnly;
      const a = o.seam / 2 + (mk.col + 0.5) * colW;
      svg.appendChild(el("text", {
        class: "ring-month" + (mk.m === 0 ? " ring-year" : ""),
        x: o.cx + labelR * Math.sin(a),
        y: o.cy - labelR * Math.cos(a)
      }, isYear ? String(mk.y) : MONTHS[mk.m]));
    });

    const frag = document.createDocumentFragment();
    days.forEach((d, idx) => {
      const col = Math.floor((idx + offset) / 7);
      const row = (idx + offset) % 7;
      const r1 = o.r0 + row * o.th + o.gap / 2;
      const r2 = o.r0 + (row + 1) * o.th - o.gap / 2;
      const pa = (o.gap / 2) / ((r1 + r2) / 2);
      const a1 = o.seam / 2 + col * colW + pa;
      const a2 = o.seam / 2 + (col + 1) * colW - pa;
      const cls = "ring-cell l" + o.level(d.count) + (d.date === o.todayKey ? " today" : "");
      const p = el("path", { d: sectorPath(o.cx, o.cy, r1, r2, a1, a2), class: cls, "data-i": idx });
      p.style.setProperty("--d", col * 8 + "ms");
      frag.appendChild(p);
    });
    svg.appendChild(frag);

    const t = [0, 1, 2].map(k => {
      const e = el("text", { class: "ring-t" + (k + 1), x: o.cx, y: o.cy + o.dy[k] });
      e.style.fontSize = o.fs[k] + "px";
      svg.appendChild(e);
      return e;
    });
    const show = lines => lines.forEach((s, k) => { t[k].textContent = s; });
    show(o.idle());

    svg.onpointerover = svg.onpointerdown = e => {
      const i = e.target.getAttribute && e.target.getAttribute("data-i");
      if (i !== null && i !== undefined) show(o.day(days[+i]));
    };
    svg.onpointerleave = () => show(o.idle());
  }

  function currentStreak(days) {
    let i = days.length - 1, n = 0;
    if (i >= 0 && days[i].count === 0) i--;
    for (; i >= 0 && days[i].count > 0; i--) n++;
    return n;
  }

  function computeStats(days) {
    let total = 0, active = 0, best = days[0], run = 0, longest = 0;
    const perYear = {};
    for (const d of days) {
      total += d.count;
      const y = d.date.slice(0, 4);
      perYear[y] = (perYear[y] || 0) + d.count;
      if (d.count > 0) {
        active++;
        run++;
        if (run > longest) longest = run;
      } else {
        run = 0;
      }
      if (d.count > best.count) best = d;
    }
    let bestYear = null;
    for (const y in perYear) {
      if (!bestYear || perYear[y] > perYear[bestYear]) bestYear = y;
    }
    return { total, active, best, longest, bestYear, bestYearTotal: bestYear ? perYear[bestYear] : 0 };
  }

  function tile(label, value, extra) {
    const box = document.createElement("div");
    box.className = "github-stat";
    const lab = document.createElement("span");
    lab.className = "github-stat-label";
    lab.textContent = label;
    box.appendChild(lab);
    const strong = document.createElement("strong");
    strong.textContent = value;
    if (extra) {
      const wrap = document.createElement("span");
      wrap.className = "github-stat-value";
      const ex = document.createElement("span");
      ex.className = "github-stat-extra";
      ex.textContent = extra;
      wrap.append(strong, ex);
      box.appendChild(wrap);
    } else {
      box.appendChild(strong);
    }
    return box;
  }

  function renderYear(data, level) {
    const days = data.days.slice(-365);
    const total = days.reduce((s, d) => s + d.count, 0);
    const streak = currentStreak(days);
    yearSvg.setAttribute("aria-label",
      "Круговой календарь активности на GitHub: " + fmtNum(total) + " " + contribWord(total) + " за 12 месяцев");
    drawRing(yearSvg, days, {
      cx: 330, cy: 330, r0: 118, th: 25, gap: 2.5, seam: 0.07,
      fs: [44, 13, 13], dy: [-4, 20, 44],
      level, todayKey: isoDate(new Date()),
      idle: () => [fmtNum(total), contribWord(total),
                   streak ? "серия: " + streak + " " + dayWord(streak) : ""],
      day: d => [fmtNum(d.count), contribWord(d.count), longDate(d.date)]
    });
    sourceEl.textContent = "Источник: " + data.note + ".";
  }

  function renderAll(days, level) {
    const st = computeStats(days);
    const streak = currentStreak(days);

    statsEl.textContent = "";
    statsEl.append(
      tile("Всего вкладов", fmtNum(st.total)),
      tile("Активных дней", fmtNum(st.active)),
      tile("Лучшая серия", st.longest + " " + dayWord(st.longest)),
      tile("Текущая серия", streak + " " + dayWord(streak)),
      tile("Рекорд за день", fmtNum(st.best.count), " (" + shortDate(st.best.date) + ")"),
      tile("Лучший год", st.bestYear, " (" + fmtNum(st.bestYearTotal) + ")")
    );

    const firstActive = days.findIndex(d => d.count > 0);
    const hist = days.slice(Math.max(0, firstActive));
    const years = new Set(hist.map(d => d.date.slice(0, 4))).size;

    allSvg.setAttribute("aria-label",
      "Активность за всё время: " + fmtNum(st.total) + " " + contribWord(st.total));
    drawRing(allSvg, hist, {
      cx: 340, cy: 340, r0: 150, th: 22, gap: 1.6, seam: 0.07,
      yearsOnly: years > 3,
      fs: [48, 14, 12], dy: [-4, 22, 46],
      level, todayKey: isoDate(new Date()),
      idle: () => [fmtNum(st.total), contribWord(st.total), "за всё время"],
      day: d => [fmtNum(d.count), contribWord(d.count), longDate(d.date)]
    });
    msgEl.classList.add("activity-hidden");
    allSection.classList.remove("activity-hidden");
  }

  function renderAllFailed() {
    statsEl.textContent = "";
    allSvg.style.display = "none";
    const legend = allSection.querySelector(".activity-legend");
    if (legend) legend.style.display = "none";
    msgEl.textContent = "Не удалось загрузить историю за всё время: сервис github-contributions-api недоступен. Обнови страницу позже.";
    msgEl.classList.remove("activity-hidden");
    allSection.classList.remove("activity-hidden");
  }

  async function init() {
    let data;
    try {
      data = await loadAll();
    } catch (e1) {
      try {
        data = await loadEvents();
      } catch (e2) {
        sourceEl.textContent = "Не удалось загрузить данные GitHub. Обнови страницу позже.";
        yearSvg.style.display = "none";
        const legend = yearSvg.parentElement.querySelector(".activity-legend");
        if (legend) legend.style.display = "none";
        renderAllFailed();
        return;
      }
    }
    const level = makeLevelFn(data.days);
    renderYear(data, level);
    if (data.full) renderAll(data.days, level);
    else renderAllFailed();
  }

  init();
})();