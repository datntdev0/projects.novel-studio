// Prototype runtime: hash-based screens inside one persistent studio shell,
// resizable/collapsible panels, theme + UI language, command palette, shortcuts,
// and a fake background job so progress can be seen without blocking the UI.
(function () {
  const root = document.documentElement;
  const app = document.querySelector(".app");
  const screens = Array.from(document.querySelectorAll(".screen"));
  const defaultScreen = "home";
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem("ns." + key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set(key, value) { try { localStorage.setItem("ns." + key, JSON.stringify(value)); } catch (e) { /* storage may be blocked */ } }
  };
  const state = { theme: store.get("theme", "dark"), lang: store.get("lang", "en"), layout: store.get("layout", {}), novel: store.get("novel", null), screen: defaultScreen, job: { done: 37, failed: 1, total: 100, running: true } };
  window.proto = { state, go: show, toast };

  // Theme ------------------------------------------------------------
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  function resolvedTheme() { return state.theme === "system" ? (media.matches ? "dark" : "light") : state.theme; }
  function applyTheme() {
    root.setAttribute("data-theme", resolvedTheme());
    document.querySelectorAll("[data-set-theme]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.setTheme === state.theme)));
    document.querySelectorAll("[data-effective-theme]").forEach((el) => { el.textContent = resolvedTheme(); });
    document.querySelectorAll("[data-theme-icon]").forEach((el) => { el.querySelector("use").setAttribute("href", resolvedTheme() === "dark" ? "#i-moon" : "#i-sun"); });
  }
  function setTheme(theme) { state.theme = theme; store.set("theme", theme); applyTheme(); }
  media.addEventListener("change", applyTheme);

  // Language ---------------------------------------------------------
  function applyLang() {
    root.setAttribute("data-lang", state.lang);
    root.setAttribute("lang", state.lang);
    document.querySelectorAll("[data-set-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.setLang === state.lang)));
    document.querySelectorAll("[data-lang-label]").forEach((el) => { el.textContent = state.lang.toUpperCase(); });
    document.querySelectorAll("[data-ph-en]").forEach((el) => { el.placeholder = el.dataset[state.lang === "vi" ? "phVi" : "phEn"] || el.dataset.phEn; });
    document.querySelectorAll("[data-opt-en]").forEach((el) => { el.textContent = el.dataset[state.lang === "vi" ? "optVi" : "optEn"] || el.dataset.optEn; });
    document.querySelectorAll(".rail a, .rail button").forEach((el) => { el.title = [nameOf(el, state.lang), el.dataset.keys].filter(Boolean).join(" · "); });
  }
  function nameOf(el, lang) { const label = el.querySelector(`.label [lang="${lang}"], .name [lang="${lang}"]`); return label ? label.textContent.trim() : ""; }

  function setLang(lang) { state.lang = lang; store.set("lang", lang); applyLang(); renderContext(); }

  // Novel context: crumbs, novel chip and the novel-scoped rail groups
  const novels = {
    "凡人修仙传": { name: "Phàm Nhân Tu Tiên", chapters: 2446 },
    "斗破苍穹": { name: "Đấu Phá Thương Khung", chapters: 1648 },
    "全职高手": { name: "Toàn Chức Cao Thủ", chapters: 1728 },
    "나 혼자만 레벨업": { name: "Solo Leveling", chapters: 270 },
    "転生したらスライムだった件": { name: "Tensei Slime", chapters: 304 },
    "庆余年": { name: "Khánh Dư Niên", chapters: 746 },
    "Mother of Learning": { name: "Mother of Learning", chapters: 108 }
  };
  const defaultNovel = "凡人修仙传";
  const novelScreens = ["reader", "storyworld", "translation", "storychat", "audiobook", "film", "videoeditor"];
  const moduleNames = { home: ["Home", "Trang chủ"], library: ["Library", "Thư viện"], import: ["Import novel", "Nhập truyện"], reader: ["Content", "Nội dung"], storyworld: ["Omniscient", "Toàn tri"], translation: ["Translation", "Dịch"], storychat: ["Story chat", "Hỏi đáp truyện"], voicelab: ["Voice Lab", "Phòng giọng nói"], pronunciation: ["Pronunciation", "Từ điển phát âm"], assets: ["Media Assets", "Kho tài nguyên"], sound: ["Sound and Music", "Âm thanh & nhạc"], audiobook: ["Audiobook", "Sách nói"], film: ["Film Series", "Phim bộ"], videoeditor: ["Video editor", "Dựng video"], inbox: ["Media inbox", "Hộp thư media"], publishing: ["Publishing", "Xuất bản & kênh"], tasks: ["Task Center", "Trung tâm tác vụ"], settings: ["Settings", "Cài đặt"], components: ["Components", "Thành phần"] };
  const bi = (en, vi) => `<span lang="en">${en}</span><span lang="vi">${vi}</span>`;
  const sep = '<span class="sep">·</span>';
  function novelLabel(key) { const n = novels[key]; return n.name === key ? key : `${key} · ${n.name}`; }
  function setNovel(key) { state.novel = key; store.set("novel", key); }
  function novelFrom(el) {
    const own = el.closest("[data-select-novel]");
    if (own) return own.dataset.selectNovel;
    const inScreen = el.closest(".screen");
    const scope = el.closest(".novel-card, tr, .cmd") || (inScreen && inScreen.querySelector(".novel-card.selected, tr.selected"));
    const text = scope ? scope.textContent : "";
    return Object.keys(novels).find((key) => text.includes(key));
  }
  const local = (en, vi) => (state.lang === "vi" ? vi : en);
  function novelChip(key) {
    const n = novels[key].chapters;
    const count = bi(n.toLocaleString("en-US") + " chapters", n.toLocaleString("vi-VN") + " chương");
    return `<span class="novel-chip" data-testid="topbar-novel-chip"><button type="button" class="novel-chip-main" data-action="switch-novel" data-testid="topbar-novel-switch" title="${novelLabel(key)} · ${local("switch novel", "đổi truyện")}"><svg class="icon sm"><use href="#i-book"/></svg><b>${novelLabel(key)}</b><span class="count">${count}</span><svg class="icon sm caret"><use href="#i-chevron-down"/></svg></button><button type="button" class="novel-chip-clear" data-action="clear-novel" data-testid="topbar-novel-clear" title="${local("Close novel", "Đóng truyện")}" aria-label="${local("Close novel", "Đóng truyện")}"><svg class="icon sm"><use href="#i-x"/></svg></button></span>`;
  }
  function renderContext() {
    const key = novels[state.novel] ? state.novel : null;
    const [en, vi] = moduleNames[state.screen] || [state.screen, state.screen];
    const module = `<b>${bi(en, vi)}</b>`;
    document.querySelector("[data-crumbs]").innerHTML = key ? module + sep + novelChip(key) : module;
    document.querySelectorAll('[data-rail-scope="novel"]').forEach((g) => g.classList.toggle("hidden", !key));
  }

  // Screens ----------------------------------------------------------
  function show(id) {
    const section = document.getElementById(id);
    if (!section || !section.classList.contains("screen")) return show(defaultScreen);
    state.screen = id;
    if (id === "home") setNovel(null);
    else if (novelScreens.includes(id) && !novels[state.novel]) setNovel(defaultNovel);
    screens.forEach((s) => s.classList.toggle("active", s === section));
    document.querySelectorAll("[data-screen]").forEach((a) => a.classList.toggle("active", a.dataset.screen === id));
    const layout = (section.dataset.layout || "").split(/\s+/).filter(Boolean);
    ["left", "right", "bottom"].forEach((side) => app.classList.toggle("no-" + side, layout.includes("no-" + side) || !section.querySelector(`:scope > .panel.${side}`)));
    app.classList.remove("zen");
    document.title = `${section.dataset.title || id} · Novel Studio prototype`;
    if (location.hash !== `#${id}`) history.replaceState(null, "", `#${id}`);
    renderNotes(section);
    renderContext();
    renderWaves(section);
    section.querySelectorAll("[data-thread]").forEach((thread) => { const box = thread.closest(".ws-body"); if (box) box.scrollTop = box.scrollHeight; });
    closeOverlays();
  }

  // Panels: collapse / resize / remember -----------------------------
  const sides = { left: ["--user-left-w", "--cur-left-w", 180, 480], right: ["--user-right-w", "--cur-right-w", 220, 520], bottom: ["--user-bottom-h", "--cur-bottom-h", 120, 480] };
  function applyLayout() {
    Object.entries(sides).forEach(([side, [prop]]) => {
      const size = state.layout[side];
      const collapsed = Boolean(state.layout["collapsed-" + side]);
      if (size) app.style.setProperty(prop, size + "px"); else app.style.removeProperty(prop);
      app.classList.toggle("collapsed-" + side, collapsed);
      document.querySelectorAll(`.panel-toggles [data-toggle-panel="${side}"]`).forEach((b) => b.setAttribute("aria-pressed", String(!collapsed)));
    });
    const expanded = Boolean(state.layout["rail-expanded"]);
    app.classList.toggle("rail-expanded", expanded);
    document.querySelectorAll("[data-action='toggle-rail']").forEach((b) => b.setAttribute("aria-pressed", String(expanded)));
  }
  function toggleLayout(key, force) {
    state.layout[key] = typeof force === "boolean" ? force : !state.layout[key];
    store.set("layout", state.layout); applyLayout();
  }
  function togglePanel(side, force) { toggleLayout("collapsed-" + side, force); }
  function resetLayout() { state.layout = {}; store.set("layout", state.layout); applyLayout(); toast("Layout reset to default", "Đã khôi phục bố cục mặc định", "success"); }
  document.querySelectorAll(".resizer").forEach((handle) => {
    const side = ["left", "right", "bottom"].find((s) => handle.classList.contains(s));
    const [prop, current, min, max] = sides[side];
    handle.addEventListener("pointerdown", (e) => {
      e.preventDefault(); handle.setPointerCapture(e.pointerId); handle.classList.add("dragging"); app.classList.add("resizing");
      const start = side === "bottom" ? e.clientY : e.clientX;
      const base = parseFloat(getComputedStyle(app).getPropertyValue(current));
      const move = (ev) => {
        const delta = side === "bottom" ? start - ev.clientY : side === "left" ? ev.clientX - start : start - ev.clientX;
        state.layout[side] = Math.round(Math.min(max, Math.max(min, base + delta)));
        app.style.setProperty(prop, state.layout[side] + "px");
      };
      const up = () => { handle.classList.remove("dragging"); app.classList.remove("resizing"); handle.removeEventListener("pointermove", move); store.set("layout", state.layout); };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", up, { once: true });
    });
    handle.addEventListener("dblclick", () => { delete state.layout[side]; store.set("layout", state.layout); applyLayout(); });
  });

  // Overlays: dialogs, palette, shortcut sheet, prototype drawer -----
  function openOverlay(id, scope) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add("open");
    renderWaves(el);
    const focus = el.querySelector("[autofocus], .input");
    if (focus) setTimeout(() => focus.focus(), 0);
    if (id === "palette") resetPalette(scope);
  }
  function closeOverlays() { document.querySelectorAll(".scrim.open").forEach((el) => el.classList.remove("open")); }

  // Command palette --------------------------------------------------
  const paletteInput = document.querySelector("#palette .input");
  let paletteScope = null;
  function resetPalette(scope) {
    paletteScope = scope || null;
    paletteInput.value = "";
    paletteInput.placeholder = scope ? local("Switch to another novel…", "Chuyển sang truyện khác…") : local("Type a command, screen or novel…", "Gõ lệnh, màn hình hoặc tên truyện…");
    filterPalette("");
  }
  function filterPalette(query) {
    const q = query.trim().toLowerCase();
    let first = null;
    document.querySelectorAll("#palette .cmd").forEach((cmd) => {
      const inScope = !paletteScope || cmd.matches(paletteScope);
      const hit = inScope && (!q || (cmd.textContent + " " + (cmd.dataset.keywords || "")).toLowerCase().includes(q));
      cmd.classList.toggle("hidden", !hit); cmd.classList.remove("focus");
      if (hit && !first) first = cmd;
    });
    document.querySelectorAll("#palette .group").forEach((g) => {
      let next = g.nextElementSibling, any = false;
      while (next && !next.classList.contains("group")) { if (!next.classList.contains("hidden")) any = true; next = next.nextElementSibling; }
      g.classList.toggle("hidden", !any);
    });
    if (first) first.classList.add("focus");
  }
  function moveFocus(dir) {
    const visible = Array.from(document.querySelectorAll("#palette .cmd:not(.hidden)"));
    const i = visible.findIndex((c) => c.classList.contains("focus"));
    visible.forEach((c) => c.classList.remove("focus"));
    const next = visible[(i + dir + visible.length) % visible.length];
    if (next) { next.classList.add("focus"); next.scrollIntoView({ block: "nearest" }); }
  }
  if (paletteInput) {
    paletteInput.addEventListener("input", () => filterPalette(paletteInput.value));
    paletteInput.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); moveFocus(1); }
      if (e.key === "ArrowUp") { e.preventDefault(); moveFocus(-1); }
      if (e.key === "Enter") { const f = document.querySelector("#palette .cmd.focus"); if (f) f.click(); }
    });
  }

  // Actions ----------------------------------------------------------
  const actions = {
    "toggle-theme": () => setTheme(resolvedTheme() === "dark" ? "light" : "dark"),
    "toggle-lang": () => setLang(state.lang === "vi" ? "en" : "vi"),
    "toggle-left": () => togglePanel("left"),
    "toggle-right": () => togglePanel("right"),
    "toggle-bottom": () => togglePanel("bottom"),
    "toggle-rail": () => toggleLayout("rail-expanded"),
    "reset-layout": resetLayout,
    "zen": () => { app.classList.toggle("zen"); toast("Focus mode — press Esc to leave", "Chế độ tập trung — nhấn Esc để thoát"); },
    "palette": () => openOverlay("palette"),
    "switch-novel": () => openOverlay("palette", "[data-select-novel]"),
    "clear-novel": () => { setNovel(null); show("library"); },
    "open-novel": () => show(novelScreens.includes(state.screen) ? state.screen : "reader"),
    "shortcuts": () => openOverlay("shortcuts"),
    "save": () => { markSaved(); toast("Chapter 12 saved", "Đã lưu chương 12", "success"); },
    "undo": () => toast("Undo", "Hoàn tác"),
    "redo": () => toast("Redo", "Làm lại"),
    "edit-mode": () => toggleEdit(),
    "prev-chapter": () => toast("Opening chapter 11 …", "Đang mở chương 11 …"),
    "next-chapter": () => toast("Opening chapter 13 …", "Đang mở chương 13 …"),
    "job-pause": () => setJob(false),
    "job-resume": () => setJob(true),
    "job-cancel": () => { setJob(false); state.job.cancelled = true; renderJob(); toast("Job cancelled — 37 items kept, resume continues the same job", "Đã huỷ job — giữ 37 mục, chạy tiếp sẽ dùng cùng job", "warning"); },
    "retry-failed": () => { state.job.failed = 0; state.job.running = true; renderJob(); toast("1 failed item re-queued", "Đã xếp lại 1 mục lỗi", "success"); },
    "test-cli": (btn) => testCli(btn),
    "rescan": (btn) => { btn.classList.add("loading"); setTimeout(() => { btn.classList.remove("loading"); toast("Rescan finished — 2 CLIs found", "Quét lại xong — tìm thấy 2 CLI", "success"); }, 900); },
    "import-start": () => { closeOverlays(); show("library"); toast("Import started in the background", "Đã bắt đầu nhập nền", "success"); },
    "delete-novel": () => { closeOverlays(); toast("Novel deleted — 1,648 chapters, translations and Omniscient data removed", "Đã xoá truyện — gỡ 1.648 chương, bản dịch và dữ liệu Toàn tri", "danger"); },
    "export-done": () => { closeOverlays(); toast("Exported 100 chapters to exports/vi/", "Đã xuất 100 chương vào exports/vi/", "success"); },
    "toast-demo": () => toast("This is a toast", "Đây là một thông báo toast", "success"),
    "choose-folder": () => toast("Folder picker opens here (OS dialog)", "Hộp thoại chọn thư mục của hệ điều hành mở ở đây"),
    "pin-note": () => toast("Pinned", "Đã ghim"),
    "run-analysis": () => toast("Analysis job added to the Task Center", "Đã thêm job phân tích vào Trung tâm tác vụ", "success"),
    "chat-send": (btn) => sendChat(btn)
  };
  document.addEventListener("click", (e) => {
    const t = e.target;
    const note = t.closest("[data-toast]");
    if (note) toast(note.dataset.toast, note.dataset.toastVi || note.dataset.toast, note.dataset.toastKind);
    const go = t.closest("[data-go]");
    if (t.closest("[data-select-novel]") || (go && novelScreens.includes(go.dataset.go))) { const key = novelFrom(t); if (novels[key]) { setNovel(key); renderContext(); } }
    if (go) { e.preventDefault(); show(go.dataset.go); return; }
    const open = t.closest("[data-open]"); if (open) { e.preventDefault(); openOverlay(open.dataset.open); return; }
    if (t.closest("[data-close]") || (t.classList.contains("scrim") && t.classList.contains("open"))) { closeOverlays(); return; }
    const theme = t.closest("[data-set-theme]"); if (theme) { setTheme(theme.dataset.setTheme); return; }
    const lang = t.closest("[data-set-lang]"); if (lang) { setLang(lang.dataset.setLang); return; }
    const toggle = t.closest("[data-toggle-panel]"); if (toggle) { togglePanel(toggle.dataset.togglePanel); return; }
    const play = t.closest("[data-play]"); if (play) { togglePlay(play); return; }
    const view = t.closest("[data-view]"); if (view) { setView(view); return; }
    const mode = t.closest("[data-mode]"); if (mode) { setMode(mode); return; }
    const pressed = t.closest("[data-toggle]"); if (pressed) { pressed.setAttribute("aria-pressed", String(pressed.getAttribute("aria-pressed") !== "true")); return; }
    const act = t.closest("[data-action]"); if (act) { const fn = actions[act.dataset.action]; if (fn) fn(act); return; }
    const tab = t.closest("[data-tab]"); if (tab) { switchTab(tab); return; }
    const select = t.closest("[data-select]"); if (select) { selectIn(select); return; }
    const fab = t.closest(".proto-fab"); if (fab) { document.querySelector(".proto-drawer").classList.toggle("open"); return; }
    if (t.closest("[data-drawer-close]")) { document.querySelector(".proto-drawer").classList.remove("open"); }
  });

  function switchTab(tab) {
    const group = tab.closest("[data-tabs]") || tab.parentElement;
    group.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b === tab)));
    const scope = group.closest("[data-tab-scope]") || document;
    scope.querySelectorAll("[data-pane]").forEach((p) => { if (p.closest("[data-tab-scope]") === scope) p.classList.toggle("active", p.dataset.pane === tab.dataset.tab); });
    renderWaves(scope);
  }
  function selectIn(el) {
    const group = el.closest("[data-select-group]") || el.parentElement;
    group.querySelectorAll("[data-select]").forEach((s) => { s.classList.toggle("selected", s === el); if (s.hasAttribute("aria-pressed")) s.setAttribute("aria-pressed", String(s === el)); });
    const screen = el.closest(".screen") || document;
    if (el.dataset.show) showDetail(screen.querySelector(`[data-detail="${el.dataset.show}"]`));
    const filter = el.closest("[data-filter-target]");
    if (filter && el.dataset.filter) document.querySelectorAll(`${filter.dataset.filterTarget} [data-kind]`).forEach((row) => row.classList.toggle("hidden", el.dataset.filter !== "all" && !row.dataset.kind.split(" ").includes(el.dataset.filter)));
  }
  function showDetail(target) {
    if (!target) return;
    const scope = target.closest("[data-detail-scope]") || target.parentElement;
    scope.querySelectorAll("[data-detail]").forEach((d) => d.classList.toggle("hidden", d !== target));
  }
  function setMode(btn) {
    const group = btn.closest("[data-mode-for]");
    group.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    document.querySelectorAll(group.dataset.modeFor).forEach((scope) => scope.querySelectorAll("[data-mode-only]").forEach((el) => {
      const on = el.dataset.modeOnly === btn.dataset.mode;
      el.classList.toggle("hidden", !on);
      if (on && el.querySelector("[data-detail]") && !el.querySelector("[data-detail]:not(.hidden)")) showDetail(el.querySelector("[data-detail-default]") || el.querySelector("[data-detail]"));
    }));
  }
  function setView(btn) {
    const group = btn.closest("[data-view-for]");
    group.querySelectorAll("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    document.querySelectorAll(group.dataset.viewFor).forEach((target) => target.classList.toggle("list", btn.dataset.view === "list"));
  }

  // Audio: play / pause toggles and generated waveforms ---------------
  function setPlaying(btn, on) {
    btn.setAttribute("aria-pressed", String(on));
    const use = btn.querySelector("use"); if (use) use.setAttribute("href", on ? "#i-pause" : "#i-play");
    (btn.closest("[data-player]") || btn).classList.toggle("playing", on);
  }
  function togglePlay(btn) {
    const on = btn.getAttribute("aria-pressed") !== "true";
    document.querySelectorAll('[data-play][aria-pressed="true"]').forEach((b) => setPlaying(b, false));
    setPlaying(btn, on);
  }
  function renderWaves(scope) {
    scope.querySelectorAll("[data-wave]").forEach((el) => {
      if (!el.dataset.bars && !el.clientWidth) return;
      const bars = Number(el.dataset.bars) || Math.max(16, Math.round(el.clientWidth / 4));
      const played = Number(el.dataset.played || 0) * bars / 100;
      let seed = Number(el.dataset.wave) || 1;
      const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      el.innerHTML = Array.from({ length: bars }, (_, i) => `<i${i < played ? ' class="on"' : ""} style="height:${Math.round(12 + 88 * rand() * (0.55 + 0.45 * Math.sin(i / 5 + seed)))}%"></i>`).join("");
    });
  }

  // Story chat: send from the composer --------------------------------
  function sendChat(el) {
    const chat = el.closest("[data-chat]"); if (!chat) return;
    const input = chat.querySelector("textarea"), thread = chat.querySelector("[data-thread]");
    const text = input.value.trim(); if (!text) return;
    const user = document.createElement("div"); user.className = "msg user";
    const bubble = document.createElement("div"); bubble.className = "bubble"; bubble.textContent = text; user.appendChild(bubble);
    const reply = document.createElement("div"); reply.className = "msg assistant";
    reply.innerHTML = '<span class="avatar sm"><svg class="icon sm"><use href="#i-sparkles"/></svg></span><div class="bubble"><span class="typing"><i></i><i></i><i></i></span></div>';
    thread.append(user, reply); input.value = ""; reply.scrollIntoView({ block: "end" });
    setTimeout(() => { reply.querySelector(".bubble").innerHTML = bi("Searching the chapters inside the spoiler boundary… the grounded answer streams here with its source chapters.", "Đang tìm trong các chương thuộc ranh giới spoiler… câu trả lời có dẫn nguồn sẽ hiện dần ở đây kèm chương nguồn."); }, 1400);
  }

  // Reader edit mode -------------------------------------------------
  function toggleEdit(force) {
    const reader = document.querySelector("#reader .reader");
    if (!reader) return;
    const on = typeof force === "boolean" ? force : !reader.classList.contains("editing");
    reader.classList.toggle("editing", on);
    reader.querySelector(".ms").contentEditable = on ? "true" : "false";
    document.querySelectorAll("[data-edit-only]").forEach((el) => el.classList.toggle("hidden", !on));
    document.querySelectorAll("[data-read-only]").forEach((el) => el.classList.toggle("hidden", on));
    document.querySelectorAll("[data-action='edit-mode']").forEach((b) => b.setAttribute("aria-pressed", String(on)));
    if (on) markDirty(); else markSaved();
  }
  function markDirty() { document.querySelectorAll("[data-dirty]").forEach((el) => el.classList.remove("hidden")); }
  function markSaved() { document.querySelectorAll("[data-dirty]").forEach((el) => el.classList.add("hidden")); }
  document.addEventListener("input", (e) => {
    if (e.target.closest("#reader .ms")) markDirty();
    const out = e.target.dataset.output; if (out) { document.querySelectorAll(`[data-value="${out}"]`).forEach((el) => { const d = e.target.dataset; el.textContent = (d.decimals ? Number(e.target.value).toFixed(Number(d.decimals)) : e.target.value) + (d.unit || ""); }); }
    const cssVar = e.target.dataset.cssVar; if (cssVar) { const target = e.target.dataset.cssTarget ? document.querySelector(e.target.dataset.cssTarget) : root; target.style.setProperty(cssVar, e.target.value + (e.target.dataset.unit || "")); }
    if (e.target.dataset.asof) updateAsOf(Number(e.target.value));
  });

  // Omniscient: spoiler boundary "as of chapter N" --------------------
  function updateAsOf(n) {
    document.querySelectorAll("[data-asof-value]").forEach((el) => { el.textContent = n; });
    document.querySelectorAll("[data-from]").forEach((el) => {
      const hidden = Number(el.dataset.from) > n;
      el.classList.toggle("hidden-after", hidden); el.classList.toggle("spoiler", hidden);
    });
  }

  // Fake background job ----------------------------------------------
  function setJob(running) { state.job.running = running; state.job.cancelled = false; renderJob(); }
  function renderJob() {
    const j = state.job, pct = Math.round((j.done / j.total) * 100), fpct = Math.round((j.failed / j.total) * 100);
    document.querySelectorAll("[data-job-progress]").forEach((p) => { p.style.setProperty("--p", pct + "%"); p.style.setProperty("--f", fpct + "%"); });
    document.querySelectorAll("[data-job-done]").forEach((el) => { el.textContent = j.done; });
    document.querySelectorAll("[data-job-failed]").forEach((el) => { el.textContent = j.failed; });
    document.querySelectorAll("[data-job-pct]").forEach((el) => { el.textContent = pct + "%"; });
    document.querySelectorAll("[data-job-current]").forEach((el) => { el.textContent = String(j.done + 1).padStart(4, "0"); });
    document.querySelectorAll("[data-job-state]").forEach((el) => {
      const key = j.cancelled ? "cancelled" : j.done >= j.total ? (j.failed ? "errors" : "completed") : j.running ? "running" : "paused";
      el.querySelectorAll("[data-state]").forEach((s) => s.classList.toggle("hidden", s.dataset.state !== key));
    });
    document.querySelectorAll("[data-when-running]").forEach((el) => el.classList.toggle("hidden", !j.running || j.done >= j.total));
    document.querySelectorAll("[data-when-paused]").forEach((el) => el.classList.toggle("hidden", j.running || j.done >= j.total));
  }
  setInterval(() => {
    if (!state.job.running || state.job.done >= state.job.total) return;
    state.job.done += 1;
    if (state.job.done === 64 && state.job.failed === 1) state.job.failed = 2;
    renderJob();
    if (state.job.done === state.job.total) toast("Translation finished — 100 chapters, 2 with errors", "Dịch xong — 100 chương, 2 chương lỗi", "warning");
  }, 2600);

  function testCli(btn) {
    btn.classList.add("loading");
    setTimeout(() => {
      btn.classList.remove("loading");
      const ok = btn.dataset.result !== "fail";
      toast(ok ? "claude --version → 2.1.288 · OK" : "codex exec → error: not logged in (run `codex login`)", ok ? "claude --version → 2.1.288 · OK" : "codex exec → lỗi: chưa đăng nhập (chạy `codex login`)", ok ? "success" : "danger");
    }, 1200);
  }

  // Toasts -----------------------------------------------------------
  function toast(en, vi, kind) {
    const host = document.querySelector(".toasts");
    const el = document.createElement("div");
    el.className = "toast " + (kind || "");
    const icon = kind === "success" ? "#i-check" : kind === "danger" ? "#i-alert-circle" : kind === "warning" ? "#i-alert-triangle" : "#i-info";
    el.innerHTML = `<svg class="icon"><use href="${icon}"/></svg><div class="body"><span lang="en">${en}</span><span lang="vi">${vi}</span></div><button class="btn ghost icon" data-dismiss aria-label="Dismiss"><svg class="icon sm"><use href="#i-x"/></svg></button>`;
    el.querySelector("[data-dismiss]").addEventListener("click", () => el.remove());
    host.appendChild(el);
    setTimeout(() => el.remove(), 5200);
  }

  // Prototype drawer notes -------------------------------------------
  function renderNotes(section) {
    const notes = document.querySelector(".proto-drawer .notes");
    const src = section.querySelector(".annotations");
    notes.innerHTML = src ? src.innerHTML : "";
    document.querySelectorAll(".proto-drawer .screens a").forEach((a) => a.classList.toggle("active", a.dataset.screen === section.id));
  }

  // Keyboard shortcuts -----------------------------------------------
  function needsNovel(id) {
    if (!novelScreens.includes(id) || novels[state.novel]) return false;
    toast("Open a novel first", "Hãy mở một truyện trước", "warning");
    return true;
  }
  const moduleKeys = { 1: "home", 2: "library", 3: "reader", 4: "storyworld", 5: "translation", 6: "tasks", 7: "settings" };
  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key === "Enter" && e.target.closest("[data-chat]")) { e.preventDefault(); sendChat(e.target); return; }
    if (e.key === "Escape") { if (app.classList.contains("zen")) app.classList.remove("zen"); closeOverlays(); document.querySelector(".proto-drawer").classList.remove("open"); return; }
    if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); openOverlay("palette"); return; }
    if (mod && e.key === "/") { e.preventDefault(); openOverlay("shortcuts"); return; }
    if (mod && e.key.toLowerCase() === "b" && !e.altKey) { e.preventDefault(); togglePanel("left"); return; }
    if (mod && e.altKey && e.key.toLowerCase() === "b") { e.preventDefault(); togglePanel("right"); return; }
    if (mod && e.key.toLowerCase() === "j") { e.preventDefault(); togglePanel("bottom"); return; }
    if (mod && e.key === ",") { e.preventDefault(); show("settings"); return; }
    if (mod && e.shiftKey && e.key.toLowerCase() === "l") { e.preventDefault(); actions["toggle-theme"](); return; }
    if (mod && e.shiftKey && e.key.toLowerCase() === "u") { e.preventDefault(); actions["toggle-lang"](); return; }
    if (mod && e.shiftKey && e.key.toLowerCase() === "t") { e.preventDefault(); show("tasks"); return; }
    if (mod && e.shiftKey && e.key.toLowerCase() === "f") { e.preventDefault(); if (needsNovel("reader")) return; show("reader"); togglePanel("right", false); switchTab(document.querySelector("#reader [data-tab='search']")); return; }
    if (mod && e.key.toLowerCase() === "o") { e.preventDefault(); show("import"); return; }
    if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); actions.save(); return; }
    if (mod && e.key.toLowerCase() === "e" && state.screen === "reader") { e.preventDefault(); toggleEdit(); return; }
    if (mod && moduleKeys[e.key]) { e.preventDefault(); if (!needsNovel(moduleKeys[e.key])) show(moduleKeys[e.key]); return; }
    if (e.altKey && e.key === "ArrowLeft") { e.preventDefault(); actions["prev-chapter"](); return; }
    if (e.altKey && e.key === "ArrowRight") { e.preventDefault(); actions["next-chapter"](); return; }
    if (!typing && !mod && e.key === "?") { openOverlay("shortcuts"); return; }
    if (!typing && !mod && e.key.toLowerCase() === "f" && e.shiftKey) { e.preventDefault(); actions.zen(); }
  });

  window.addEventListener("hashchange", () => show(location.hash.slice(1)));
  window.addEventListener("resize", () => { const active = document.querySelector(".screen.active"); if (active) renderWaves(active); });
  applyTheme(); applyLang(); applyLayout(); renderJob(); toggleEdit(false);
  show(location.hash.slice(1) || defaultScreen);
})();
