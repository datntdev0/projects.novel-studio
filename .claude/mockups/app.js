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
  const state = { theme: store.get("theme", "dark"), lang: store.get("lang", "en"), layout: store.get("layout", {}), novel: store.get("novel", null), screen: defaultScreen, job: { done: 37, failed: 0, total: 100, item: 38, attempt: 2 } };
  window.proto = { state, go: show, toast };

  // Theme ------------------------------------------------------------
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  function resolvedTheme() { return state.theme === "system" ? (media.matches ? "dark" : "light") : state.theme; }
  function applyTheme() {
    root.setAttribute("data-theme", resolvedTheme());
    document.querySelectorAll("[data-set-theme]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.setTheme === state.theme)));
    document.querySelectorAll("[data-effective-theme]").forEach((el) => { el.innerHTML = resolvedTheme() === "dark" ? bi("dark", "tối") : bi("light", "sáng"); });
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
    document.querySelectorAll('[data-rail-scope="novel"], [data-when-novel]').forEach((g) => g.classList.toggle("hidden", !key));
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
  const overlays = [];
  function openOverlay(id, scope) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!overlays.includes(el)) overlays.push(el);
    el.style.zIndex = 50 + overlays.length;
    el.classList.add("open");
    renderWaves(el);
    const focus = el.querySelector("[autofocus], .input");
    if (focus) setTimeout(() => focus.focus(), 0);
    if (id === "palette") resetPalette(scope);
    if (id === "shortcuts") el.querySelectorAll("[data-sheet-scope]").forEach((g) => g.querySelector("[data-sheet-here]").classList.toggle("hidden", g.dataset.sheetScope !== state.screen));
  }
  function closeOverlays() { overlays.length = 0; document.querySelectorAll(".scrim.open").forEach((el) => el.classList.remove("open")); }
  function closeOverlay(el) { if (!el) return; el.classList.remove("open"); const i = overlays.indexOf(el); if (i >= 0) overlays.splice(i, 1); }
  function closeTopOverlay() { closeOverlay(overlays[overlays.length - 1] || document.querySelector(".scrim.open")); }

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
      while (next && !next.classList.contains("group")) { if (next.matches(".cmd:not(.hidden)")) any = true; next = next.nextElementSibling; }
      g.classList.toggle("hidden", !any);
    });
    if (first) first.classList.add("focus");
    document.querySelectorAll("[data-palette-empty]").forEach((el) => el.classList.toggle("hidden", Boolean(first)));
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
    "job-pause": (btn) => pauseJob(jobOf(btn)),
    "job-resume": (btn) => resumeJob(jobOf(btn)),
    "jobs-pause-all": () => eachJob(["running", "queued"], pauseJob),
    "jobs-resume-all": () => { eachJob(["paused", "interrupted"], resumeJob); refreshAttention(); },
    "job-cancel-confirm": () => cancelJob(),
    "job-fail-demo": () => failLiveEarly(),
    "job-start": () => { closeOverlays(); toast("Job queued — it appears in the Task Center as queued", "Đã xếp hàng job — job hiện trong Trung tâm tác vụ ở trạng thái chờ", "success"); },
    "open-job": (btn) => openJob(btn.dataset.job),
    "tasks-view": (btn) => selectIn(document.querySelector(`#tasks [data-show="${btn.dataset.target}"]`)),
    "app-close": () => askCloseApp(),
    "app-close-confirm": () => closeApp(),
    "job-cancel": (btn) => askCancelJob(jobOf(btn)),
    "retry-failed": () => toast("1 failed item re-queued", "Đã xếp lại 1 mục lỗi", "success"),
    "test-cli": (btn) => testCli(btn),
    "rescan": (btn) => { btn.classList.add("loading"); setTimeout(() => { btn.classList.remove("loading"); toast("Rescan finished — 3 CLIs found", "Quét lại xong — tìm thấy 3 CLI", "success"); }, 900); },
    "import-start": () => { closeOverlays(); show("library"); toast("Import started in the background", "Đã bắt đầu nhập nền", "success"); },
    "delete-novel": () => { closeOverlays(); toast("Novel deleted — 1,648 chapters, translations and Omniscient data removed", "Đã xoá truyện — gỡ 1.648 chương, bản dịch và dữ liệu Toàn tri", "danger"); },
    "export-done": () => { closeOverlays(); toast("Exported 100 chapters to exports/vi/", "Đã xuất 100 chương vào exports/vi/", "success"); },
    "toast-demo": () => toast("This is a toast", "Đây là một thông báo toast", "success"),
    "choose-folder": () => toast("Folder picker opens here (OS dialog)", "Hộp thoại chọn thư mục của hệ điều hành mở ở đây"),
    "pin-note": () => toast("Pinned", "Đã ghim"),
    "run-analysis": () => toast("Analysis job added to the Task Center", "Đã thêm job phân tích vào Trung tâm tác vụ", "success"),
    "chat-send": (btn) => sendChat(btn),
    "job-open-log": (btn) => openJobLog(btn),
    "history-rerun": (btn) => rerunJob(btn),
    "history-delete": (btn) => askDeleteJobs(btn.closest("[data-job-id]")),
    "history-delete-all": () => askDeleteJobs(null),
    "history-delete-confirm": () => deleteJobs()
  };
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("#palette .cmd")) closeOverlay(document.getElementById("palette"));
    if (t.closest(".proto-drawer [data-action], .proto-drawer [data-open]")) document.querySelector(".proto-drawer").classList.remove("open");
    const note = t.closest("[data-toast]");
    if (note) toast(note.dataset.toast, note.dataset.toastVi || note.dataset.toast, note.dataset.toastKind, { sticky: note.hasAttribute("data-toast-sticky"), job: note.dataset.toastJob, details: note.dataset.toastDetails });
    const go = t.closest("[data-go]");
    if (t.closest("[data-select-novel]") || (go && novelScreens.includes(go.dataset.go))) { const key = novelFrom(t); if (novels[key]) { setNovel(key); renderContext(); } }
    if (go) { e.preventDefault(); show(go.dataset.go); return; }
    const open = t.closest("[data-open]"); if (open) { e.preventDefault(); openOverlay(open.dataset.open); return; }
    if (t.closest("[data-close]") || (t.classList.contains("scrim") && t.classList.contains("open"))) { closeOverlay(t.closest(".scrim")); return; }
    const theme = t.closest("[data-set-theme]"); if (theme) { setTheme(theme.dataset.setTheme); return; }
    const lang = t.closest("[data-set-lang]"); if (lang) { setLang(lang.dataset.setLang); return; }
    const toggle = t.closest("[data-toggle-panel]"); if (toggle) { togglePanel(toggle.dataset.togglePanel); return; }
    const play = t.closest("[data-play]"); if (play) { togglePlay(play); return; }
    const view = t.closest("[data-view]"); if (view) { setView(view); return; }
    const mode = t.closest("[data-mode]"); if (mode) { setMode(mode); return; }
    const toggleTarget = t.closest("[data-toggle-target]");
    if (toggleTarget) { const target = document.querySelector(toggleTarget.dataset.toggleTarget); if (target) { target.classList.toggle("hidden"); toggleTarget.setAttribute("aria-expanded", String(!target.classList.contains("hidden"))); } return; }
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
    if (el.dataset.jobId) showJob(el);
    if (el.dataset.show === "attention") refreshAttention();
    const filter = el.closest("[data-filter-target]");
    if (filter && el.dataset.filter) document.querySelectorAll(`${filter.dataset.filterTarget} [data-kind]`).forEach((row) => row.classList.toggle("filtered-out", el.dataset.filter !== "all" && !row.dataset.kind.split(" ").includes(el.dataset.filter)));
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
      const on = el.dataset.modeOnly.split(" ").includes(btn.dataset.mode);
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

  // Jobs (M03) -------------------------------------------------------
  // Model states: queued · running · paused · completed · cancelled. Display keys add "interrupted"
  // (paused because the app closed) and "early" (completed early by a fast-complete error such as quota exhausted).
  // Rows declare their job with data-job-id + data-job-status; data-job-problem marks failed items or an early stop,
  // data-job-seen marks a finished job already opened. Only the live job (LIVE) animates in the prototype.
  const LIVE = "j-2026-10-04-0017";
  const ACTIVE = ["queued", "running", "paused", "interrupted"];
  const ENDED = ["completed", "early", "cancelled"];
  const jobs = {};
  document.querySelectorAll("[data-job-status]").forEach((row) => {
    const id = row.dataset.jobId;
    if (!jobs[id]) jobs[id] = { status: row.dataset.jobStatus, problem: row.hasAttribute("data-job-problem"), seen: row.hasAttribute("data-job-seen") };
  });
  if (!jobs[LIVE]) jobs[LIVE] = { status: "running", problem: false, seen: true };
  const historyJobs = { count: 38, target: null };
  const pending = { cancel: null };
  const shown = { id: null };
  const pad = (n) => String(n).padStart(4, "0");
  const live = () => jobs[LIVE];
  const isAttention = (j) => j.status === "interrupted" || (["completed", "early"].includes(j.status) && j.problem && !j.seen);
  const countGroups = { active: ACTIVE, running: ["running"], queued: ["queued"], paused: ["paused"], interrupted: ["interrupted"], pausable: ["running", "queued"], resumable: ["paused", "interrupted"] };
  function countOf(key) {
    const list = Object.values(jobs);
    if (key === "attention") return list.filter(isAttention).length;
    if (key === "problem") return list.filter((j) => isAttention(j) && j.status !== "interrupted").length;
    return list.filter((j) => (countGroups[key] || []).includes(j.status)).length;
  }
  function jobOf(el) {
    const row = el.closest("[data-job-id]");
    if (row) return row.dataset.jobId;
    return el.closest("[data-job-view]") && shown.id ? shown.id : LIVE;
  }
  function setText(selector, value) { document.querySelectorAll(selector).forEach((el) => { el.textContent = value; }); }
  function setStatus(id, status) {
    const job = jobs[id];
    if (ACTIVE.includes(job.status) && ENDED.includes(status)) historyJobs.count += 1;
    job.status = status;
    renderJob(); refreshAttention();
  }
  function renderJob() {
    const j = state.job, key = live().status, running = key === "running";
    const pct = Math.round((j.done / j.total) * 100), fpct = Math.round((j.failed / j.total) * 100);
    document.querySelectorAll("[data-job-id] .progress").forEach((p) => { const job = jobs[jobOf(p)]; if (job) p.classList.toggle("paused", job.status === "paused" || job.status === "interrupted"); });
    document.querySelectorAll("[data-job-progress]").forEach((p) => { p.style.setProperty("--p", pct + "%"); p.style.setProperty("--f", fpct + "%"); p.classList.toggle("paused", key === "paused" || key === "interrupted"); });
    setText("[data-job-done]", j.done); setText("[data-job-failed]", j.failed); setText("[data-job-pct]", pct + "%");
    setText("[data-job-current]", pad(j.item)); setText("[data-job-attempt]", j.attempt); setText("[data-job-pending]", j.total - j.done - j.failed);
    document.querySelectorAll("[data-when-failed]").forEach((el) => el.classList.toggle("hidden", !j.failed));
    document.querySelectorAll("[data-job-state]").forEach((el) => { const job = jobs[jobOf(el)]; el.querySelectorAll("[data-state]").forEach((s) => s.classList.toggle("hidden", !job || s.dataset.state !== job.status)); });
    document.querySelectorAll("[data-when-state]").forEach((el) => { const job = jobs[jobOf(el)]; el.classList.toggle("hidden", !job || !el.dataset.whenState.split(" ").includes(job.status)); });
    document.querySelectorAll("[data-when-running]").forEach((el) => el.classList.toggle("hidden", !running));
    document.querySelectorAll("[data-when-idle]").forEach((el) => el.classList.toggle("hidden", running));
    document.querySelectorAll("[data-when-paused]").forEach((el) => el.classList.toggle("hidden", key !== "paused" && key !== "interrupted"));
    document.querySelectorAll("[data-count-of]").forEach((el) => { el.textContent = countOf(el.dataset.countOf); });
    document.querySelectorAll("[data-zero-of]").forEach((el) => el.classList.toggle("hidden", countOf(el.dataset.zeroOf) > 0));
    const attention = countOf("attention");
    setText("[data-job-attention]", attention);
    document.querySelectorAll("[data-attention-label]").forEach((el) => { el.innerHTML = bi(attention === 1 ? "needs attention" : "need attention", "cần xử lý"); });
    document.querySelectorAll("[data-when-attention]").forEach((el) => el.classList.toggle("hidden", !attention));
    document.querySelectorAll("[data-job-dot]").forEach((el) => { el.className = "dot" + (attention ? " warn" : running ? " run" : ""); });
    setText("[data-history-count]", historyJobs.count);
    document.querySelectorAll("[data-history-list]").forEach((el) => el.classList.toggle("hidden", !historyJobs.count));
    document.querySelectorAll("[data-history-empty]").forEach((el) => el.classList.toggle("hidden", Boolean(historyJobs.count)));
    document.querySelectorAll("[data-history-note]").forEach((el) => el.classList.toggle("hidden", !historyJobs.count));
    document.querySelectorAll("[data-action='history-delete-all']").forEach((b) => { b.disabled = !historyJobs.count; });
    document.querySelectorAll("[data-action='jobs-pause-all']").forEach((b) => { b.disabled = !countOf("pausable"); });
    document.querySelectorAll("[data-action='jobs-resume-all']").forEach((b) => { b.disabled = !countOf("resumable"); });
    renderLiveBadge();
  }
  function refreshAttention() { document.querySelectorAll("[data-attention-row]").forEach((row) => row.classList.toggle("hidden", !jobs[row.dataset.jobId] || !isAttention(jobs[row.dataset.jobId]))); }

  // Live job: one item at a time, up to 3 attempts per item; item 0045 fails once, item 0052 fails 3 times and the job moves on
  const liveErrors = { 38: ["timeout after 300 s"], 45: ["exit 1 · stream closed before final message"], 52: ["QA: paragraph count 27 → 25", "QA: paragraph count 27 → 25", "QA: paragraph count 27 → 25"] };
  const liveName = ["Translate 0001–0100 · 凡人修仙传", "Dịch 0001–0100 · 凡人修仙传"];
  setInterval(() => {
    const j = state.job;
    if (live().status !== "running") return;
    const errors = liveErrors[j.item] || [];
    if (j.attempt <= errors.length) {
      const last = j.attempt === 3;
      logLive(`item ${pad(j.item)} attempt ${j.attempt}/3 <span class="err">failed</span> · ${errors[j.attempt - 1]}${last ? " · item failed · job moves on" : " · retrying"}`);
      if (last) { j.failed += 1; nextItem(); } else { j.attempt += 1; logLive(`item ${pad(j.item)} → running · attempt ${j.attempt}/3`); }
    } else {
      j.done += 1;
      logLive(`item ${pad(j.item)} → <span class="ok">completed</span> · exit 0 · attempt ${j.attempt}/3`);
      nextItem();
    }
    renderJob();
  }, 2600);
  function nextItem() {
    const j = state.job;
    if (j.done + j.failed >= j.total) { endLive("completed"); return; }
    j.item += 1; j.attempt = 1;
    logLive(`item ${pad(j.item)} → running · attempt 1/3 (codex exec --json --output-schema translation.schema.json)`);
  }
  function endLive(status, reason) {
    const j = state.job, rest = j.total - j.done - j.failed;
    live().problem = status === "early" || j.failed > 0;
    live().seen = false;
    setStatus(LIVE, status);
    const [en, vi] = liveName;
    if (status === "early") {
      logLive(`job <span class="wrn">completed early</span> · ${reason[0]} · ${j.done} completed · ${j.failed} failed · ${rest} pending`);
      toast(`${en} completed early — ${reason[0]} · ${rest} pending`, `${vi} hoàn tất sớm — ${reason[1]} · ${rest} chờ`, "danger", { job: LIVE, details: reason[2] });
    } else if (j.failed) {
      logLive(`job <span class="ok">completed</span> · ${j.done} completed · <span class="err">${j.failed} failed</span>`);
      toast(`${en} completed — ${j.done} done · ${j.failed} failed`, `${vi} hoàn tất — ${j.done} xong · ${j.failed} lỗi`, "warning", { job: LIVE, sticky: true });
    } else {
      logLive(`job <span class="ok">completed</span> · ${j.done} completed`);
      toast(`${en} completed — ${j.done} done`, `${vi} hoàn tất — ${j.done} xong`, "success", { job: LIVE });
    }
  }
  function failLiveEarly() {
    const j = state.job, error = "codex: 429 rate limit — retry after 00:41:12";
    if (live().status !== "running") { toast("Resume the translation job first", "Hãy chạy tiếp job dịch trước"); return; }
    for (let a = j.attempt; a <= 3; a += 1) logLive(`item ${pad(j.item)} attempt ${a}/3 <span class="err">failed</span> · E_QUOTA · ${error}${a < 3 ? " · retrying" : ""}`);
    j.attempt = 3; j.failed += 1;
    endLive("early", ["quota exhausted", "hết hạn mức", error]);
    renderJob();
  }
  function pauseJob(id) {
    if (!["running", "queued"].includes(jobs[id].status)) return;
    if (id === LIVE && live().status === "running") logLive(`pause · item ${pad(state.job.item)} finished first · job <span class="wrn">paused</span> · ${state.job.done} completed · ${state.job.total - state.job.done - state.job.failed} pending`);
    setStatus(id, "paused");
  }
  function resumeJob(id) {
    if (!["paused", "interrupted"].includes(jobs[id].status)) return;
    const next = id === LIVE ? "running" : "queued";
    if (id === LIVE) logLive(`resume · same job id · ${state.job.done} completed · ${state.job.total - state.job.done - state.job.failed} pending`);
    setStatus(id, next);
  }
  function eachJob(statuses, fn) { [LIVE].concat(Object.keys(jobs).filter((id) => id !== LIVE)).forEach((id) => { if (statuses.includes(jobs[id].status)) fn(id); }); }
  function rowName(id) { const name = Array.from(document.querySelectorAll(`[data-job-id="${id}"] [data-job-name]`)).find((el) => !el.closest("template")); return name ? name.innerHTML : id; }
  function askCancelJob(id) {
    if (!ACTIVE.includes(jobs[id].status)) return;
    pending.cancel = id;
    setText("[data-cancel-job-id]", id);
    document.querySelectorAll("[data-cancel-job-name]").forEach((el) => { el.innerHTML = rowName(id); });
    openOverlay("dlg-cancel-job");
  }
  function cancelJob() {
    const id = pending.cancel || LIVE, j = state.job;
    if (id === LIVE) logLive(`job <span class="wrn">cancelled by user</span> · item ${pad(j.item)} stopped → pending · ${j.done} completed · ${j.total - j.done - j.failed} pending`);
    setStatus(id, "cancelled");
    closeOverlays();
    toast("Job cancelled — finished items are kept. Use Rerun in History to run it again", "Đã huỷ job — giữ các mục đã xong. Dùng Chạy lại trong Lịch sử để chạy lại", "", { job: id });
  }
  function askCloseApp() {
    const n = countOf("running");
    if (!n) { toast("No job is running, so the app closes without asking", "Không có job đang chạy nên ứng dụng đóng mà không hỏi"); return; }
    document.querySelectorAll("[data-close-message]").forEach((el) => { el.innerHTML = n === 1 ? bi("1 job is running. It will pause and can be resumed next time.", "1 job đang chạy. Job sẽ tạm dừng và có thể chạy tiếp lần sau.") : bi(`${n} jobs are running. They will pause and can be resumed next time.`, `${n} job đang chạy. Các job sẽ tạm dừng và có thể chạy tiếp lần sau.`); });
    openOverlay("dlg-close-app");
  }
  function closeApp() {
    let n = 0;
    if (["running", "queued"].includes(live().status)) logLive(`<span class="wrn">app closed</span> · item ${pad(state.job.item)} running → pending · job paused · interrupted · waits for Resume`);
    eachJob(["running", "queued"], (id) => { jobs[id].status = "interrupted"; n += 1; });
    closeOverlays();
    renderJob(); refreshAttention();
    toast(`Prototype: the app closed and opened again — ${n} jobs are paused · interrupted and wait for Resume`, `Bản mẫu: ứng dụng đã đóng rồi mở lại — ${n} job tạm dừng · bị gián đoạn và chờ Chạy tiếp`);
  }
  function openJob(id) {
    show("tasks");
    const rows = Array.from(document.querySelectorAll(`#tasks [data-job-id="${id}"]:not(.hidden)`));
    const row = rows.find((r) => r.offsetParent) || rows[0];
    if (!row) return;
    const view = row.closest("[data-detail]");
    if (view && view.classList.contains("hidden")) selectIn(document.querySelector(`#tasks [data-show="${view.dataset.detail}"]`));
    selectIn(row);
  }

  // Task Center: the selected job fills the Items, Config and Log views from <template data-job-template data-for>
  const logClock = { t: 14 * 3600 + 47 * 60 + 31 };
  const logPath = (id) => `logs\\${id}\\`;
  const jobTemplate = (kind, id) => document.querySelector(`template[data-job-template="${kind}"][data-for="${id}"]`);
  function showJob(row) {
    const id = row.dataset.jobId;
    document.querySelectorAll("[data-job-view]").forEach((view) => {
      const kind = view.dataset.jobView, from = shown.id && jobTemplate(kind, shown.id), to = jobTemplate(kind, id);
      if (from) from.innerHTML = view.innerHTML;
      view.innerHTML = to ? to.innerHTML : "";
      if (kind === "log") view.scrollTop = view.scrollHeight;
    });
    shown.id = id;
    if (jobs[id]) jobs[id].seen = true;
    const name = row.querySelector("[data-job-name]");
    document.querySelectorAll("[data-log-title]").forEach((el) => { el.innerHTML = `${id} · ${name ? name.innerHTML : ""} · ${logPath(id)}`; });
    renderJob();
  }
  function isLive() { return shown.id === LIVE && live().status === "running"; }
  function renderLiveBadge() { document.querySelectorAll("[data-log-live]").forEach((el) => el.classList.toggle("hidden", !isLive())); }
  function logLive(line) {
    logClock.t += 6 + Math.floor(Math.random() * 30);
    const html = `\n<span class="t">${new Date(logClock.t * 1000).toISOString().slice(11, 19)}</span> ${line}`;
    const pre = shown.id === LIVE && document.querySelector('[data-job-view="log"]');
    if (!pre) { const tpl = jobTemplate("log", LIVE); if (tpl) tpl.innerHTML += html; return; }
    const atEnd = pre.scrollTop + pre.clientHeight >= pre.scrollHeight - 4;
    pre.insertAdjacentHTML("beforeend", html);
    if (atEnd) pre.scrollTop = pre.scrollHeight;
  }
  function openJobLog(btn) {
    const id = btn.closest("[data-job-id]") ? btn.closest("[data-job-id]").dataset.jobId : shown.id || LIVE;
    toast(`Opening ${logPath(id)} in the default editor`, `Đang mở ${logPath(id)} bằng trình soạn thảo mặc định`);
  }
  function rerunJob(btn) {
    const id = jobOf(btn);
    toast(`Rerun queued as a new job — same type, novel, range and backend as ${id}`, `Đã xếp hàng Chạy lại thành job mới — cùng loại, truyện, phạm vi và backend với ${id}`, "success");
  }

  // Task Center: delete one finished job or the whole history (records and logs only, never results or active jobs)
  function askDeleteJobs(row) {
    historyJobs.target = row;
    const dialog = document.getElementById("dlg-delete-jobs");
    dialog.querySelectorAll("[data-delete-one]").forEach((el) => el.classList.toggle("hidden", !row));
    dialog.querySelectorAll("[data-delete-all]").forEach((el) => el.classList.toggle("hidden", Boolean(row)));
    if (row) dialog.querySelectorAll("[data-delete-job]").forEach((el) => { el.textContent = row.dataset.jobId; });
    openOverlay("dlg-delete-jobs");
  }
  function deleteJobs() {
    const target = historyJobs.target;
    const ids = target ? [target.dataset.jobId] : Object.keys(jobs).filter((id) => ENDED.includes(jobs[id].status));
    const rows = Array.from(document.querySelectorAll("#tasks [data-history-row]")).filter((r) => (target ? ids.includes(r.dataset.jobId) : !ACTIVE.includes((jobs[r.dataset.jobId] || {}).status)));
    if (rows.some((r) => r.classList.contains("selected"))) { const first = document.querySelector('#tasks [data-detail="active"] .job:not(.hidden)'); if (first) selectIn(first); }
    rows.forEach((r) => r.remove());
    ids.forEach((id) => { if (jobs[id]) jobs[id].status = "deleted"; });
    const deleted = target ? 1 : historyJobs.count;
    historyJobs.count -= deleted;
    renderJob(); refreshAttention();
    closeOverlays();
    if (target) toast(`Job ${ids[0]} deleted — its results are kept`, `Đã xoá job ${ids[0]} — kết quả vẫn được giữ`, "success");
    else toast(`${deleted} jobs deleted from history — results and active jobs are kept`, `Đã xoá ${deleted} job khỏi lịch sử — kết quả và job đang hoạt động vẫn được giữ`, "success");
  }
  const firstJob = document.querySelector("#tasks [data-job-id].selected");
  if (firstJob) showJob(firstJob);
  refreshAttention();

  function testCli(btn) {
    btn.classList.add("loading");
    setTimeout(() => {
      btn.classList.remove("loading");
      const ok = btn.dataset.result !== "fail";
      const name = btn.dataset.testName || "Claude CLI";
      toast(ok ? `${name} check passed` : "codex exec → error: not logged in (run `codex login`)", ok ? `Kiểm tra ${name} đạt` : "codex exec → lỗi: chưa đăng nhập (chạy `codex login`)", ok ? "success" : "danger");
    }, 1200);
  }

  // Toasts -----------------------------------------------------------
  function toast(en, vi, kind, opts) {
    const o = opts || {};
    const host = document.querySelector(".toasts");
    const el = document.createElement("div");
    el.className = "toast " + (kind || "");
    const icon = kind === "success" ? "#i-check" : kind === "danger" ? "#i-alert-circle" : kind === "warning" ? "#i-alert-triangle" : "#i-info";
    const details = o.details ? `<details class="error-details"><summary>${bi("Details", "Chi tiết")}</summary><pre class="log">${o.details}</pre></details>` : "";
    const action = o.job ? `<div class="toast-actions"><button class="btn ghost sm" data-action="open-job" data-job="${o.job}">${bi("Open job", "Mở job")}</button></div>` : "";
    el.innerHTML = `<svg class="icon"><use href="${icon}"/></svg><div class="body"><span lang="en">${en}</span><span lang="vi">${vi}</span>${details}${action}</div><button class="btn ghost icon" data-dismiss aria-label="Dismiss"><svg class="icon sm"><use href="#i-x"/></svg></button>`;
    el.querySelector("[data-dismiss]").addEventListener("click", () => el.remove());
    host.prepend(el);
    while (host.children.length > 3) host.lastElementChild.remove();
    if (kind !== "danger" && !o.sticky) setTimeout(() => el.remove(), 5000);
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
    toast("Open a novel first", "Hãy mở một truyện trước");
    return true;
  }
  const moduleKeys = { 1: "home", 2: "library", 3: "reader", 4: "storyworld", 5: "translation", 6: "tasks", 7: "settings" };
  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key === "Enter" && e.target.closest("[data-chat]")) { e.preventDefault(); sendChat(e.target); return; }
    if (e.key === "Escape") { const drawer = document.querySelector(".proto-drawer.open"); const overlay = document.querySelector(".scrim.open"); if (overlay) closeTopOverlay(); else if (drawer) drawer.classList.remove("open"); else app.classList.remove("zen"); return; }
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
  document.querySelectorAll("[data-indeterminate]").forEach((box) => { box.indeterminate = true; });
  applyTheme(); applyLang(); applyLayout(); renderJob(); toggleEdit(false);
  show(location.hash.slice(1) || defaultScreen);
})();
