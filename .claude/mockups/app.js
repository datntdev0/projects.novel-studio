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
    "凡人修仙传": { name: "Phàm Nhân Tu Tiên", chapters: 2446, id: "n-0001" },
    "斗破苍穹": { name: "Đấu Phá Thương Khung", chapters: 1648, id: "n-0002" },
    "全职高手": { name: "Toàn Chức Cao Thủ", chapters: 1728, id: "n-0003" },
    "나 혼자만 레벨업": { name: "Solo Leveling", chapters: 270, id: "n-0004" },
    "転生したらスライムだった件": { name: "Tensei Slime", chapters: 304, id: "n-0005" },
    "庆余年": { name: "Khánh Dư Niên", chapters: 746, id: "n-0006" },
    "Mother of Learning": { name: "Mother of Learning", chapters: 108, id: "n-0007" }
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
    const tagged = el.closest("[data-novel]");
    if (tagged) return tagged.dataset.novel;
    const inScreen = el.closest(".screen");
    const scope = el.closest(".novel-card, tr, .cmd") || (inScreen && inScreen.querySelector(".novel-card.selected, tr.selected"));
    const text = scope ? scope.textContent : "";
    return Object.keys(novels).find((key) => text.includes(key));
  }
  const local = (en, vi) => (state.lang === "vi" ? vi : en);
  const numEn = (n) => n.toLocaleString("en-US"), numVi = (n) => n.toLocaleString("vi-VN");
  const numIn = (el, n) => (el.closest('[lang="vi"]') ? numVi(n) : numEn(n));
  function novelChip(key) {
    const n = novels[key].chapters;
    const count = bi(numEn(n) + " chapters", numVi(n) + " chương");
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
    if (state.screen === "import" && id !== "import" && state.importDirty) { askDiscardImport(id); return; }
    state.screen = id;
    if (id === "home") setNovel(null);
    else if (novelScreens.includes(id) && !novels[state.novel]) setNovel(defaultNovel);
    screens.forEach((s) => s.classList.toggle("active", s === section));
    document.querySelectorAll("[data-screen]").forEach((a) => a.classList.toggle("active", a.dataset.screen === id));
    const layout = (section.dataset.layout || "").split(/\s+/).filter(Boolean);
    ["left", "right", "bottom"].forEach((side) => app.classList.toggle("no-" + side, layout.includes("no-" + side) || !section.querySelector(`:scope > .panel.${side}`)));
    app.classList.remove("zen");
    document.title = `${section.dataset.title || id} · Dreamer Studio prototype`;
    if (location.hash !== `#${id}`) history.replaceState(null, "", `#${id}`);
    renderDrawer(section);
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
  function closeOverlays() { document.querySelectorAll(".scrim.open").forEach(closeOverlay); overlays.length = 0; }
  function closeOverlay(el) { if (!el) return; el.classList.remove("open"); const i = overlays.indexOf(el); if (i >= 0) overlays.splice(i, 1); if (el.id === "dlg-job-preflight") importSteps(false); }
  const isImportPreflight = () => ["import", "import-more"].includes(state.preflight);
  function importSteps(atImport) {
    const step = (k) => document.querySelector(`#import .steps:has(> [data-step="source"].done) [data-step="${k}"]`);
    const preview = step("preview"), importStep = step("import");
    if (!preview || !importStep) return;
    preview.classList.toggle("done", atImport); preview.classList.toggle("current", !atImport);
    importStep.classList.toggle("current", atImport);
  }
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
    "save": () => { if (state.screen === "reader") saveChapter(); },
    "undo": () => stepHistory("undo", "redo"),
    "redo": () => stepHistory("redo", "undo"),
    "find-next": () => stepFind(1),
    "find-prev": () => stepFind(-1),
    "find-close": () => closeFind(),
    "replace-one": () => replaceInChapter(false),
    "replace-all-chapter": () => replaceInChapter(true),
    "search-replace-all": () => guardChapter(() => { applyMode("#dlg-replace-all", "", "confirm"); openOverlay("dlg-replace-all"); }),
    "replace-all-confirm": () => replaceAllInNovel(),
    "search-replace-chapter": (btn) => replaceInNovel(btn.closest(".hit-block"), btn.dataset.count),
    "search-replace-hit": (btn) => replaceInNovel(btn.closest(".hit"), 1),
    "search-dismiss": (btn) => btn.closest(".hit, .hit-block").classList.add("hidden"),
    "edit-mode": () => toggleEdit(),
    "prev-chapter": () => openChapter("0011"),
    "next-chapter": () => openChapter("0013"),
    "open-chapter": (row) => openChapter(row.dataset.chapter, row),
    "open-hit": (hit) => openHit(hit),
    "chapter-discard": () => leaveChapter(false),
    "chapter-save-continue": () => leaveChapter(true),
    "job-pause": (btn) => pauseJob(jobOf(btn)),
    "job-resume": (btn) => resumeJob(jobOf(btn)),
    "jobs-pause-all": () => eachJob(["running", "queued"], pauseJob),
    "jobs-resume-all": () => { eachJob(["paused", "interrupted"], resumeJob); refreshAttention(); },
    "job-cancel-confirm": () => cancelJob(),
    "job-fail-demo": () => failLiveEarly(),
    "job-start": () => { if (isImportPreflight()) { importStart(); return; } closeOverlays(); toast("Job queued — it appears in the Task Center as queued", "Đã xếp hàng job — job hiện trong Trung tâm tác vụ ở trạng thái chờ", "success"); },
    "open-job": (btn) => openJob(btn.dataset.job),
    "tasks-view": (btn) => selectIn(document.querySelector(`#tasks [data-show="${btn.dataset.target}"]`)),
    "app-close": () => askCloseApp(),
    "app-close-confirm": () => closeApp(),
    "job-cancel": (btn) => askCancelJob(jobOf(btn)),
    "retry-failed": () => toast("1 failed item re-queued", "Đã xếp lại 1 mục lỗi", "success"),
    "test-cli": (btn) => testCli(btn),
    "rescan": (btn) => busy(btn, "Rescan finished — 2 of 3 CLIs found", "Quét lại xong — tìm thấy 2 trên 3 CLI", "success"),
    "check-library": (btn) => busy(btn, "Library check finished — 1 novel needs attention", "Kiểm tra thư viện xong — 1 truyện cần chú ý", "warning"),
    "self-check": (btn) => busy(btn, "Self-check finished — 4 passed, 1 failed", "Tự kiểm tra xong — 4 đạt, 1 lỗi", "warning"),
    "import-choose": () => { applyMode("#import", "import", "loading"); setTimeout(() => applyMode("#import", "import", "new"), 1200); },
    "import-cancel": () => show("library"),
    "import-discard": () => { state.importDirty = false; closeOverlays(); if (pendingScreen.id === "app-close") askCloseApp(); else show(pendingScreen.id || "library"); },
    "rerun-choose-package": () => { toast("File picker opens here: choose the ZIP package again", "Hộp thoại chọn tệp mở ở đây: chọn lại gói ZIP"); applyMode("#dlg-job-preflight", "", "ready"); },
    "delete-novel": () => deleteNovel(),
    "edit-start": (btn) => setEditing(btn.closest("[data-edit-scope]"), true),
    "edit-cancel": (btn) => setEditing(btn.closest("[data-edit-scope]"), false),
    "edit-save": (btn) => saveEdit(btn.closest("[data-edit-scope]")),
    "tag-remove": (btn) => { markImportDirty(btn); btn.closest(".chip").remove(); },
    "cover-change": () => toast("Image picker opens here: PNG, JPG or WebP up to 10 MB", "Hộp thoại chọn ảnh mở ở đây: PNG, JPG hoặc WebP tối đa 10 MB"),
    "cover-remove": () => toast("Cover removed — a generated cover with the original title is shown", "Đã gỡ bìa — hiện bìa tự sinh với tên gốc", "success"),
    "open-folder": (btn) => { const key = novelFrom(btn); toast(`Opening novels\\${novels[key] ? novels[key].id : "n-0006"}\\ in Windows Explorer`, `Đang mở novels\\${novels[key] ? novels[key].id : "n-0006"}\\ trong Windows Explorer`); },
    "export-start": () => exportStart(),
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
    if (go && state.screen === "reader" && readerDirty() && go.dataset.go !== "reader") { e.preventDefault(); guardChapter(() => show(go.dataset.go)); return; }
    if (go) { e.preventDefault(); if (go.disabled) return; show(go.dataset.go); if (go.dataset.goMode && state.screen === go.dataset.go) screenMode(go.dataset.go, go.dataset.goMode); if (go.dataset.goTab) goTab(go.dataset.go, go.dataset.goTab); return; }
    const open = t.closest("[data-open]"); if (open) { e.preventDefault(); if (open.disabled) return; prepareOverlay(open); openOverlay(open.dataset.open); return; }
    if (t.closest("[data-close]") || (t.classList.contains("scrim") && t.classList.contains("open"))) { closeOverlay(t.closest(".scrim")); return; }
    const theme = t.closest("[data-set-theme]"); if (theme) { setTheme(theme.dataset.setTheme); return; }
    const lang = t.closest("[data-set-lang]"); if (lang) { setLang(lang.dataset.setLang); return; }
    const toggle = t.closest("[data-toggle-panel]"); if (toggle) { togglePanel(toggle.dataset.togglePanel); return; }
    const play = t.closest("[data-play]"); if (play) { togglePlay(play); return; }
    const view = t.closest("[data-view]"); if (view) { setView(view); return; }
    const mode = t.closest("[data-mode]"); if (mode) { setMode(mode); return; }
    const toggleTarget = t.closest("[data-toggle-target]");
    if (toggleTarget) { const targets = document.querySelectorAll(toggleTarget.dataset.toggleTarget); targets.forEach((target) => target.classList.toggle("hidden")); if (targets[0]) toggleTarget.setAttribute("aria-expanded", String(!targets[0].classList.contains("hidden"))); return; }
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
    if (el.dataset.novel && el.closest("#library")) fillInspector(el.dataset.novel);
    if (el.dataset.show === "attention") refreshAttention();
    const filter = el.closest("[data-filter-target]");
    if (filter && el.dataset.filter) document.querySelectorAll(`${filter.dataset.filterTarget} [data-kind]`).forEach((row) => row.classList.toggle("filtered-out", el.dataset.filter !== "all" && !row.dataset.kind.split(" ").includes(el.dataset.filter)));
  }
  function showDetail(target) {
    if (!target) return;
    const scope = target.closest("[data-detail-scope]") || target.parentElement;
    scope.querySelectorAll("[data-detail]").forEach((d) => d.classList.toggle("hidden", d !== target));
  }
  // State previews: data-mode-for="<scope>" (+ optional data-mode-key) toggles [data-mode-only] with the same key inside the scope
  const modes = {};
  function setMode(btn) {
    const group = btn.closest("[data-mode-for]");
    const scope = group.dataset.modeFor, key = group.dataset.modeKey || "";
    applyMode(scope, key, btn.dataset.mode);
    if (scope === "#library" && key === "import") previewImport(btn.dataset.mode);
  }
  function applyMode(scopeSel, key, mode) {
    modes[scopeSel + "|" + key] = mode;
    document.querySelectorAll(`[data-mode-for="${scopeSel}"]`).forEach((g) => { if ((g.dataset.modeKey || "") === key) g.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode))); });
    document.querySelectorAll(`${scopeSel}, [data-for-screen="${scopeSel.slice(1)}"]`).forEach((scope) => scope.querySelectorAll("[data-mode-only]").forEach((el) => {
      if ((el.dataset.modeKey || "") !== key) return;
      const on = modeOn(el, mode);
      el.classList.toggle("hidden", !on);
      if (on && el.querySelector("[data-detail]") && !el.querySelector("[data-detail]:not(.hidden)")) showDetail(el.querySelector("[data-detail-default]") || el.querySelector("[data-detail]"));
    }));
    if (scopeSel === "#library" && key === "import") { state.importMode = mode; renderImport(); }
    if (scopeSel === "#library" && key === "library") { state.libraryEmpty = mode === "empty"; renderJob(); }
    if (scopeSel === "#home" && key === "") { state.noLibrary = mode.startsWith("first"); renderJob(); }
    if (scopeSel === READER && key === "reader") syncReader(mode);
    if (scopeSel === READER && key === "find") syncFindState(mode);
  }
  // Only 庆余年 shows the import demo in the inspector; every other novel is fully imported
  function modeOn(el, mode) {
    const insp = el.dataset.modeKey === "import" && libInspector();
    const settled = insp && insp.dataset.novel !== "庆余年" && insp.contains(el);
    return el.dataset.modeOnly.split(" ").includes(settled ? "done" : mode);
  }
  function screenMode(screen, mode) {
    const btn = document.querySelector(`[data-mode-for="#${screen}"] [data-mode="${mode}"]`);
    if (btn) setMode(btn);
    if (screen === "import") state.importDirty = false;
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

  // Reader modes (#reader, key "reader"): read · edit (clean) · dirty · invalid (title empty) · refused (Save refused, chapter busy) · error
  // Busy flag (key "busy": off · on): with "on", a job is processing the chapters in BUSY, so writing them is refused
  const READER = "#reader";
  const READ_ONLY = ["read", "error"];
  const BUSY = ["0012", "0018"];
  const BUSY_JOB = { id: "j-2026-10-04-0017", en: "Translate 0001–0100 · 凡人修仙传", vi: "Dịch 0001–0100 · 凡人修仙传" };
  function isBusy(chapter) { return modes[READER + "|busy"] === "on" && BUSY.includes(chapter); }
  const editHistory = { undo: 0, redo: 0 };
  let pendingChapter = null;
  function readerMode() { return modes[READER + "|reader"] || "read"; }
  function readerDirty() { return ["dirty", "invalid", "refused"].includes(readerMode()); }
  function setReader(mode) { applyMode(READER, "reader", mode); }
  function syncReader(mode) {
    document.querySelectorAll("[data-action='edit-mode']").forEach((b) => { b.setAttribute("aria-pressed", String(!READ_ONLY.includes(mode))); });
    if (READ_ONLY.includes(mode)) { editHistory.undo = 0; editHistory.redo = 0; }
    if (readerDirty() && !editHistory.undo) editHistory.undo = 1;
    syncHistory();
    const field = document.querySelector("#reader [data-title-field]"); if (!field) return;
    const input = field.querySelector("input");
    if (mode === "invalid" && document.activeElement !== input) input.value = "";
    if (mode !== "invalid" && !input.value.trim()) input.value = input.defaultValue;
    field.classList.toggle("error", mode === "invalid");
    field.querySelectorAll("[data-title-count]").forEach((el) => { el.textContent = `${input.value.length} / 200`; });
  }
  function guardChapter(next) {
    if (!readerDirty()) { next(); return; }
    pendingChapter = next;
    openOverlay("dlg-unsaved-chapter");
  }
  function toggleEdit(force) {
    const on = typeof force === "boolean" ? force : READ_ONLY.includes(readerMode());
    if (on) setReader("edit"); else guardChapter(() => setReader("read"));
  }
  function saveChapter() {
    const mode = readerMode();
    if (mode === "invalid") { toast("Enter a chapter title before saving", "Hãy nhập tiêu đề chương trước khi lưu", "danger"); return false; }
    if (mode !== "dirty" && mode !== "refused") { toast("No changes to save", "Không có thay đổi để lưu"); return false; }
    if (isBusy("0012")) { setReader("refused"); return false; }
    document.querySelectorAll("#reader [data-source-field]").forEach((f) => { f.defaultValue = f.value; });
    setReader("edit"); clearHistory();
    toast("Chapter 0012 saved", "Đã lưu chương 0012", "success");
    return true;
  }
  function resetChapter() {
    document.querySelectorAll("#reader [data-source-field]").forEach((f) => { f.value = f.defaultValue; });
    setReader("edit");
  }
  function leaveChapter(save) {
    closeOverlays();
    if (save && !saveChapter()) { pendingChapter = null; return; }
    if (!save) { resetChapter(); clearHistory(); toast("Changes to chapter 0012 discarded", "Đã bỏ thay đổi ở chương 0012"); }
    const next = pendingChapter; pendingChapter = null;
    if (next) next();
  }
  // Undo / redo: one history per chapter for title and content, cleared by Save
  function syncHistory() {
    ["undo", "redo"].forEach((k) => document.querySelectorAll(`#reader [data-action='${k}']`).forEach((b) => { b.disabled = !editHistory[k]; }));
  }
  function clearHistory() { editHistory.undo = 0; editHistory.redo = 0; syncHistory(); }
  function pushHistory() { editHistory.undo++; editHistory.redo = 0; syncHistory(); }
  function stepHistory(from, to) {
    if (!editHistory[from]) return;
    editHistory[from]--; editHistory[to]++;
    if (editHistory.undo) setReader("dirty"); else resetChapter();
    syncHistory();
  }
  function openChapter(n, row) {
    guardChapter(() => {
      if (row) selectIn(row);
      toast(`Opening chapter ${n} …`, `Đang mở chương ${n} …`);
    });
  }
  function openHit(hit) {
    guardChapter(() => {
      document.querySelectorAll("#reader .search-hits .hit").forEach((h) => h.classList.toggle("selected", h === hit));
      const mark = hit.dataset.hit && document.querySelector(`#reader .reader mark[data-hit="${hit.dataset.hit}"]`);
      if (!mark) { toast(`Opening chapter ${hit.dataset.chapter} at the match …`, `Đang mở chương ${hit.dataset.chapter} tại vị trí khớp …`); return; }
      if (findMode() === "off") applyMode(READER, "find", "replace");
      setCurrentMark(readerMarks().indexOf(mark));
    });
  }
  function openNovelSearch() {
    if (needsNovel("reader")) return;
    show("reader"); togglePanel("right", false);
    switchTab(document.querySelector("#reader [data-tab='search']"));
    const input = document.querySelector("#reader [data-novel-search]"); if (input) input.focus();
  }
  function markChapterDirty(field) {
    const titleEmpty = field.dataset.sourceField === "title" ? !field.value.trim() : readerMode() === "invalid";
    setReader(titleEmpty ? "invalid" : readerMode() === "refused" ? "refused" : "dirty");
    pushHistory();
  }

  // Find widget in the chapter (key "find": off · replace · none) and replace in the novel (Search tab)
  const find = { index: 0 };
  function findMode() { return modes[READER + "|find"] || "off"; }
  function readerMarks() { return Array.from(document.querySelectorAll("#reader article mark[data-hit]")); }
  function findTerm() { const input = document.querySelector("#reader [data-find-input]"); return input ? input.value : ""; }
  function contentField() { return document.querySelector("#reader [data-source-field='content']"); }
  function findTotal() {
    const term = findTerm(); if (!term) return 0;
    if (!READ_ONLY.includes(readerMode())) return contentField().value.split(term).length - 1;
    const input = document.querySelector("#reader [data-find-input]");
    return term === input.defaultValue ? readerMarks().length : document.querySelector("#reader article").textContent.split(term).length - 1;
  }
  function syncFind() {
    const total = findTotal();
    if (findMode() === "replace" && !total) { applyMode(READER, "find", "none"); return; }
    find.index = Math.min(find.index, Math.max(total - 1, 0));
    document.querySelectorAll("#reader [data-find-index]").forEach((el) => { el.textContent = total ? find.index + 1 : 0; });
    document.querySelectorAll("#reader [data-find-total]").forEach((el) => { el.textContent = total; });
  }
  function syncFindState(mode) {
    const input = document.querySelector("#reader [data-find-input]"); if (!input) return;
    if (mode === "none" && findTotal()) input.value = "血魔剑";
    if (mode !== "none" && !findTotal()) input.value = input.defaultValue;
    document.querySelector(READER).dataset.findState = mode;
    document.querySelectorAll("#reader [data-find-field]").forEach((f) => f.classList.toggle("no-match", mode === "none"));
    syncFind();
  }
  function setCurrentMark(i) {
    const marks = readerMarks(); if (i < 0 || !marks[i]) return;
    find.index = i;
    marks.forEach((m, n) => m.classList.toggle("current", n === i));
    marks[i].scrollIntoView({ block: "center", behavior: "smooth" });
    syncFind();
  }
  function openFind() {
    if (needsNovel("reader") || state.screen !== "reader") return;
    applyMode(READER, "find", "replace");
    const input = document.querySelector("#reader [data-find-input]"); if (input) { input.focus(); input.select(); }
  }
  function closeFind() { applyMode(READER, "find", "off"); }
  function stepFind(dir) {
    const total = findTotal(); if (!total) return;
    const i = (find.index + dir + total) % total;
    if (READ_ONLY.includes(readerMode())) setCurrentMark(i); else { find.index = i; syncFind(); }
  }
  function replaceInChapter(all) {
    if (READ_ONLY.includes(readerMode())) setReader("edit");
    const field = contentField(), term = findTerm(), input = document.querySelector("#reader [data-replace-input]");
    const count = field.value.split(term).length - 1; if (!term || !count) return;
    field.value = all ? field.value.split(term).join(input.value) : field.value.replace(term, input.value);
    markChapterDirty(field); syncFind();
    if (all) toast(`Replaced ${count} matches in chapter 0012 — not saved yet`, `Đã thay ${count} kết quả trong chương 0012 — chưa lưu`);
  }
  function replaceInNovel(item, count) {
    const n = Number(count) === 1 ? "1 match" : `${count} matches`;
    const ch = item.dataset.chapter;
    guardChapter(() => {
      if (isBusy(ch)) { toast(`Not replaced: chapter ${ch} is being processed by “${BUSY_JOB.en}”`, `Chưa thay: chương ${ch} đang được job “${BUSY_JOB.vi}” xử lý`, "danger", { job: BUSY_JOB.id }); return; }
      item.classList.add("hidden"); toast(`Replaced ${n} in chapter ${ch}`, `Đã thay ${count} kết quả trong chương ${ch}`, "success");
    });
  }
  function replaceAllInNovel() {
    const blocks = Array.from(document.querySelectorAll("#reader .search-hits .hit-block"));
    if (!blocks.some((b) => isBusy(b.dataset.chapter))) { closeOverlays(); applyMode(READER, "results", "none"); toast("Replaced 37 matches in 12 chapters", "Đã thay 37 kết quả trong 12 chương", "success"); return; }
    applyMode(READER, "results", "results");
    blocks.forEach((b) => b.classList.toggle("hidden", !isBusy(b.dataset.chapter)));
    document.querySelectorAll("#reader .search-hits .virtual-note").forEach((el) => el.classList.add("hidden"));
    applyMode("#dlg-replace-all", "", "done");
  }
  document.addEventListener("input", (e) => {
    if (e.target.closest("#reader [data-source-field]")) markChapterDirty(e.target);
    if (e.target.matches("#reader [data-find-input]")) { find.index = 0; syncFind(); }
    markImportDirty(e.target);
    if (e.target.matches("[data-confirm-title]")) document.querySelectorAll("[data-confirm-target]").forEach((b) => { b.disabled = !titleConfirmed(e.target.value); });
    const out = e.target.dataset.output; if (out) { document.querySelectorAll(`[data-value="${out}"]`).forEach((el) => { const d = e.target.dataset; el.textContent = (d.decimals ? Number(e.target.value).toFixed(Number(d.decimals)) : e.target.value) + (d.unit || ""); }); }
    const cssVar = e.target.dataset.cssVar; if (cssVar) { const target = e.target.dataset.cssTarget ? document.querySelector(e.target.dataset.cssTarget) : root; target.style.setProperty(cssVar, e.target.value + (e.target.dataset.unit || "")); }
    if (e.target.dataset.asof) updateAsOf(Number(e.target.value));
    if (e.target.closest("#dlg-export")) renderExport();
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
  // Import job (M04): no AI backend; paused at 312/746 in the sample, restarted from 0 by Start in the import preflight
  const IMPORT = "j-2026-10-06-0019";
  if (!jobs[IMPORT]) jobs[IMPORT] = { status: "paused", problem: false, seen: true };
  const imp = { done: 312, total: 746, more: false };
  // Export job (M04-F05): source ZIP in the import layout, one item per chapter; created by Start export in dlg-export
  const EXPORT = "j-2026-10-06-0020";
  const exp = { key: null, count: 0, from: 1, to: 0, done: 0, total: 0, file: "" };
  const novelJobs = { "凡人修仙传": [LIVE, "j-2026-10-04-0018"], "나 혼자만 레벨업": ["j-2026-10-04-0015"], "庆余年": [IMPORT] };
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
    if (id === IMPORT) syncImportCard();
    renderJob(); refreshAttention();
    if (status !== "running") startQueued();
  }
  // One job slot (M04 PO1): a job started or resumed while another runs waits as queued; the live and import jobs start when the slot frees
  const statusOf = (id) => (jobs[id] ? jobs[id].status : null);
  const otherRunning = (id) => Object.keys(jobs).some((other) => other !== id && jobs[other].status === "running");
  const slotStatus = (id) => (otherRunning(id) ? "queued" : "running");
  function startQueued() {
    if (otherRunning(null)) return;
    const next = [IMPORT, LIVE, EXPORT].find((id) => statusOf(id) === "queued");
    if (next) setStatus(next, "running");
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
    const importing = jobs[IMPORT].status === "running";
    document.querySelectorAll("[data-when-import-queued]").forEach((el) => el.classList.toggle("hidden", jobs[IMPORT].status !== "queued"));
    document.querySelectorAll("[data-when-running]").forEach((el) => el.classList.toggle("hidden", !running));
    document.querySelectorAll("[data-hide-importing]").forEach((el) => el.classList.toggle("hidden", importing));
    document.querySelectorAll("[data-when-importing]").forEach((el) => el.classList.toggle("hidden", !importing));
    const exporting = statusOf(EXPORT) === "running";
    document.querySelectorAll("[data-when-exporting]").forEach((el) => el.classList.toggle("hidden", !exporting));
    document.querySelectorAll("[data-when-export-queued]").forEach((el) => el.classList.toggle("hidden", statusOf(EXPORT) !== "queued"));
    const expPct = Math.round((exp.done / (exp.total || 1)) * 100) + "%";
    document.querySelectorAll("[data-export-done]").forEach((el) => { el.textContent = numIn(el, exp.done); }); document.querySelectorAll("[data-export-total]").forEach((el) => { el.textContent = numIn(el, exp.total); }); setText("[data-export-pct]", expPct);
    document.querySelectorAll("[data-export-progress]").forEach((p) => p.style.setProperty("--p", expPct));
    document.querySelectorAll("[data-when-idle]").forEach((el) => el.classList.toggle("hidden", running || importing || exporting));
    renderImport();
    document.querySelectorAll("[data-when-paused]").forEach((el) => el.classList.toggle("hidden", key !== "paused" && key !== "interrupted"));
    document.querySelectorAll("[data-count-of]").forEach((el) => { el.textContent = countOf(el.dataset.countOf); });
    document.querySelectorAll("[data-zero-of]").forEach((el) => el.classList.toggle("hidden", countOf(el.dataset.zeroOf) > 0));
    const noJobs = Boolean(state.libraryEmpty || state.noLibrary);
    const attention = noJobs ? 0 : countOf("attention");
    document.querySelectorAll("[data-hide-library-empty]").forEach((el) => el.classList.toggle("hidden", noJobs));
    document.querySelectorAll("[data-hide-no-library]").forEach((el) => el.classList.toggle("hidden", Boolean(state.noLibrary)));
    setText("[data-job-attention]", attention);
    document.querySelectorAll("[data-attention-label]").forEach((el) => { el.innerHTML = bi(attention === 1 ? "needs attention" : "need attention", "cần xử lý"); });
    document.querySelectorAll("[data-when-attention]").forEach((el) => el.classList.toggle("hidden", !attention));
    document.querySelectorAll("[data-job-dot]").forEach((el) => { el.className = "dot" + (attention ? " warn" : running || importing || exporting ? " run" : ""); });
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
    const next = [LIVE, IMPORT, EXPORT].includes(id) ? slotStatus(id) : "queued";
    if (id === LIVE) logLive(`resume · same job id · ${state.job.done} completed · ${state.job.total - state.job.done - state.job.failed} pending`);
    setStatus(id, next);
  }
  function eachJob(statuses, fn) { [LIVE].concat(Object.keys(jobs).filter((id) => id !== LIVE)).forEach((id) => { if (statuses.includes(jobs[id].status)) fn(id); }); }
  function rowName(id) { const name = Array.from(document.querySelectorAll(`[data-job-id="${id}"] [data-job-name]`)).find((el) => !el.closest("template")); if (name) return name.innerHTML; if (id === IMPORT) return bi(`Import ${imp.total} chapters · 庆余年`, `Nhập ${imp.total} chương · 庆余年`); return id === EXPORT ? exportName() : id; }
  function askCancelJob(id) {
    if (!ACTIVE.includes(jobs[id].status)) return;
    pending.cancel = id;
    setText("[data-cancel-job-id]", id);
    document.querySelectorAll("[data-cancel-job-name]").forEach((el) => { el.innerHTML = rowName(id); });
    document.querySelectorAll("[data-cancel-kind]").forEach((el) => el.classList.toggle("hidden", el.dataset.cancelKind !== (id === IMPORT ? "import" : "job")));
    openOverlay("dlg-cancel-job");
  }
  function cancelJob() {
    const id = pending.cancel || LIVE, j = state.job;
    if (id === LIVE) logLive(`job <span class="wrn">cancelled by user</span> · item ${pad(j.item)} stopped → pending · ${j.done} completed · ${j.total - j.done - j.failed} pending`);
    setStatus(id, "cancelled");
    closeOverlays();
    if (id === IMPORT) toast(`Import cancelled — ${imp.done} of ${imp.total} chapters kept. 庆余年 is marked “Import incomplete”; add the rest with Import more chapters`, `Đã huỷ nhập — giữ ${imp.done} / ${imp.total} chương. 庆余年 được đánh dấu “Nhập chưa xong”; nhập phần còn lại bằng Nhập thêm chương`, "", { job: id });
    else toast("Job cancelled — finished items are kept. Use Rerun in History to run it again", "Đã huỷ job — giữ các mục đã xong. Dùng Chạy lại trong Lịch sử để chạy lại", "", { job: id });
  }

  // Import job: live progress on the Library card, inspector, Task Center row and status bar
  function renderImport() {
    const pct = Math.round((imp.done / imp.total) * 100);
    const insp = libInspector(), other = insp && insp.dataset.novel !== "庆余年";
    const targets = (sel) => Array.from(document.querySelectorAll(sel)).filter((el) => !(other && insp.contains(el)));
    const put = (sel, value) => targets(sel).forEach((el) => { el.textContent = value; });
    put("[data-import-done]", imp.done.toLocaleString("en-US")); put("[data-import-total]", imp.total.toLocaleString("en-US")); put("[data-import-pct]", pct + "%");
    const paused = state.importMode === "paused";
    targets("[data-import-progress]").forEach((p) => { p.style.setProperty("--p", pct + "%"); p.classList.toggle("paused", paused); });
  }
  function syncImportCard() {
    const status = jobs[IMPORT].status;
    const map = { running: "importing", queued: "queued", paused: "paused", interrupted: "paused", cancelled: "incomplete", completed: "done" };
    const mode = imp.more && ACTIVE.includes(status) ? "more" : map[status];
    if (mode) applyMode("#library", "import", mode);
  }
  // Drawer previews of the library import modes keep the one job slot (PO1) consistent and stay static
  const IMPORT_PREVIEW = { importing: "running", more: "running", paused: "paused", queued: "queued", incomplete: "cancelled", done: "completed" };
  function previewImport(mode) {
    const status = IMPORT_PREVIEW[mode];
    if (!status) return;
    imp.preview = true;
    imp.more = mode === "more"; imp.total = imp.more ? 11 : 746; imp.done = imp.more ? 3 : 312;
    if (status === "running") { setStatus(IMPORT, "running"); setStatus(LIVE, "queued"); return; }
    setStatus(LIVE, "running");
    setStatus(IMPORT, status);
  }
  function importStart() {
    imp.preview = false;
    imp.more = state.preflight === "import-more";
    closeOverlays();
    state.importDirty = false;
    imp.done = 0; imp.total = imp.more ? 11 : 746;
    if (ENDED.includes(jobs[IMPORT].status)) historyJobs.count -= 1;
    setStatus(IMPORT, slotStatus(IMPORT));
    show("library");
    const card = document.querySelector('#library .novel-card[data-novel="庆余年"]');
    if (card) selectIn(card);
    toast(`Job queued — Import ${imp.total} chapters · 庆余年 appears in the Task Center`, `Đã xếp hàng job — Nhập ${imp.total} chương · 庆余年 hiện trong Trung tâm tác vụ`, "success", { job: IMPORT });
  }
  function tickJob(id, progress, step, onDone) {
    if (statusOf(id) !== "running" || !progress.total) return;
    progress.done = Math.min(progress.total, progress.done + step);
    if (progress.done < progress.total) { renderJob(); return; }
    setStatus(id, "completed");
    onDone();
  }
  setInterval(() => {
    if (!imp.preview) tickJob(IMPORT, imp, imp.total > 100 ? 9 : 1, () => toast(`Import ${imp.total} chapters · 庆余年 completed — ${imp.total} done`, `Nhập ${imp.total} chương · 庆余年 hoàn tất — ${imp.total} xong`, "success", { job: IMPORT }));
    tickJob(EXPORT, exp, Math.ceil(exp.total / 40), () => toast(`Export ${numEn(exp.total)} chapters · ${exp.key} completed — ${exp.file} saved`, `Xuất ${numVi(exp.total)} chương · ${exp.key} hoàn tất — đã lưu ${exp.file}`, "success", { job: EXPORT }));
  }, 400);

  // Export dialog (M04-F05): follows the novel of the trigger; blocked during the first import; an incomplete novel exports its imported chapters
  const exportedFiles = ["凡人修仙传.zip"];
  const expEl = (sel) => document.querySelector(`#dlg-export ${sel}`);
  const exportName = () => bi(`Export ${numEn(exp.total)} chapters · ${exp.key}`, `Xuất ${numVi(exp.total)} chương · ${exp.key}`);
  function prepareExport(key, preview) {
    const n = novels[key], partial = key === "庆余年" && state.importMode === "incomplete", invalid = preview === "invalid";
    exp.key = key; exp.count = partial ? imp.done : n.chapters;
    setText("[data-exp-title]", key); setText("[data-exp-count]", exp.count.toLocaleString("en-US"));
    expEl(`[data-exp-scope][value="${invalid ? "range" : "all"}"]`).checked = true;
    expEl("[data-exp-from]").value = invalid ? exp.count - 99 : 1;
    expEl("[data-exp-to]").value = invalid ? exp.count + 100 : exp.count;
    expEl("[data-exp-folder]").value = `D:\\DreamerStudio\\Library\\novels\\${n.id}\\exports\\`;
    expEl("[data-exp-file]").value = `${key}.zip`;
    expEl('[data-exp-conflict][value="keep"]').checked = true;
    expEl("[data-exp-partial]").classList.toggle("hidden", !partial);
    expEl("[data-exp-blocked]").classList.toggle("hidden", !(key === "庆余年" && FIRST_IMPORT_MODES.includes(state.importMode)));
    renderExport();
  }
  function renderExport() {
    const all = expEl('[data-exp-scope][value="all"]').checked, from = expEl("[data-exp-from]"), to = expEl("[data-exp-to]");
    exp.from = all ? 1 : Number(from.value); exp.to = all ? exp.count : Number(to.value);
    const valid = Number.isInteger(exp.from) && Number.isInteger(exp.to) && exp.from >= 1 && exp.from <= exp.to && exp.to <= exp.count;
    from.disabled = all; to.disabled = all;
    expEl("[data-exp-range-field]").classList.toggle("error", !valid);
    setText("[data-exp-n]", valid ? (exp.to - exp.from + 1).toLocaleString("en-US") : "—");
    const file = expEl("[data-exp-file]").value.trim();
    expEl("[data-exp-exists]").classList.toggle("hidden", !exportedFiles.includes(file));
    setText("[data-exp-file-name]", file); setText("[data-exp-file-alt]", file.replace(/\.zip$/i, "") + "-2.zip");
    expEl("[data-exp-start]").disabled = !valid || !file || !expEl("[data-exp-blocked]").classList.contains("hidden");
  }
  function exportStart() {
    const file = expEl("[data-exp-file]").value.trim(), keepBoth = exportedFiles.includes(file) && expEl('[data-exp-conflict][value="keep"]').checked;
    exp.file = keepBoth ? expEl("[data-exp-file-alt]").textContent : file;
    if (!exportedFiles.includes(exp.file)) exportedFiles.push(exp.file);
    exp.done = 0; exp.total = exp.to - exp.from + 1;
    const exportHooks = (sel) => [document, ...Array.from(document.querySelectorAll(`template[data-for="${EXPORT}"]`), (t) => t.content)].flatMap((root) => Array.from(root.querySelectorAll(sel)));
    const putExport = (sel, value) => exportHooks(sel).forEach((el) => { el.textContent = value; });
    putExport("[data-export-novel]", exp.key); putExport("[data-export-alias]", novels[exp.key].name); putExport("[data-export-file]", `novels\\${novels[exp.key].id}\\exports\\${exp.file}`);
    putExport("[data-export-range]", `${pad(exp.from)}–${pad(exp.to)}`); exportHooks("[data-export-total]").forEach((el) => { el.textContent = numIn(el, exp.total); });
    closeOverlays();
    if (ENDED.includes(statusOf(EXPORT))) historyJobs.count -= 1;
    if (!jobs[EXPORT]) jobs[EXPORT] = { status: "queued", problem: false, seen: true };
    Object.keys(novelJobs).forEach((k) => { novelJobs[k] = novelJobs[k].filter((id) => id !== EXPORT); });
    novelJobs[exp.key] = (novelJobs[exp.key] || []).concat(EXPORT);
    setStatus(EXPORT, slotStatus(EXPORT));
    toast(`Job queued — Export ${numEn(exp.total)} chapters · ${exp.key} appears in the Task Center`, `Đã xếp hàng job — Xuất ${numVi(exp.total)} chương · ${exp.key} hiện trong Trung tâm tác vụ`, "success", { job: EXPORT });
  }

  // Library: open, delete, metadata edit -------------------------------
  // Library import modes: the first import blocks Open; "more" (Import more chapters) keeps the novel openable. Delete is refused in all of them.
  const FIRST_IMPORT_MODES = ["importing", "paused", "queued"];
  function activeJobFor(key) {
    return (novelJobs[key] || []).find((id) => (id === IMPORT ? FIRST_IMPORT_MODES.concat("more").includes(state.importMode) : jobs[id] && ACTIVE.includes(jobs[id].status)));
  }
  function openNovel(el) {
    const key = novelFrom(el);
    if (!novels[key]) return;
    if (key === "庆余年" && FIRST_IMPORT_MODES.includes(state.importMode)) { toast("庆余年 is still importing — it opens when the import is done", "庆余年 vẫn đang nhập — truyện mở được khi nhập xong"); return; }
    setNovel(key); show("reader");
  }
  const pendingDelete = { key: null };
  function prepareOverlay(trigger) {
    const id = trigger.dataset.open;
    if (id === "dlg-job-preflight") { state.preflight = trigger.dataset.preflight || "translate"; applyMode("#dlg-job-preflight", "type", state.preflight); applyMode("#dlg-job-preflight", "", "ready"); importSteps(isImportPreflight()); }
    if (id === "dlg-delete") prepareDelete(novelFrom(trigger) || "斗破苍穹");
    if (trigger.closest(".proto-drawer") && novels[trigger.dataset.novel]) fillInspector(trigger.dataset.novel);
    if (id === "dlg-export") prepareExport(novelFrom(trigger) || state.novel || defaultNovel, trigger.dataset.preview);
    if (trigger.dataset.rerun) fillRerun(trigger.dataset.rerun);
    if (trigger.dataset.preview) applyMode(`#${id}`, "", trigger.dataset.preview);
  }
  function prepareDelete(key) {
    const n = novels[key], job = activeJobFor(key);
    pendingDelete.key = key;
    setText("[data-del-title]", key); setText("[data-del-folder]", `novels\\${n.id}\\`); setText("[data-del-chapters]", n.chapters.toLocaleString("en-US"));
    document.querySelectorAll("[data-del-names]").forEach((el) => { el.textContent = n.name === key ? key : `${key} · ${n.name}`; });
    document.querySelectorAll("[data-confirm-title]").forEach((input) => { input.value = ""; input.placeholder = key; });
    document.querySelectorAll("[data-confirm-target]").forEach((b) => { b.disabled = true; });
    if (job) { document.querySelectorAll("[data-del-job]").forEach((el) => { el.innerHTML = rowName(job); }); setText("[data-del-job-id]", job); document.querySelectorAll("[data-del-open-job]").forEach((b) => { b.dataset.job = job; }); }
    applyMode("#dlg-delete", "", job ? "refused" : "confirm");
  }
  function titleConfirmed(value) {
    const n = novels[pendingDelete.key], v = value.trim().toLowerCase();
    return Boolean(n && v && (v === pendingDelete.key.toLowerCase() || v === n.name.toLowerCase()));
  }
  function deleteNovel() {
    const key = pendingDelete.key;
    closeOverlays();
    if (!key) return;
    document.querySelectorAll(`#library [data-novel="${key}"]`).forEach((el) => { if (el.matches(".novel-card, tr")) el.classList.add("hidden"); });
    toast(`Deleted ${key} for good — exports\\ kept, finished jobs stay in History as (deleted)`, `Đã xoá hẳn ${key} — giữ exports\\, job đã xong vẫn ở Lịch sử với nhãn (đã xoá)`, "success");
  }
  function setEditing(scope, on) {
    if (!scope) return;
    scope.querySelectorAll("[data-edit-view]").forEach((el) => el.classList.toggle("hidden", on));
    scope.querySelectorAll("[data-edit-form]").forEach((el) => el.classList.toggle("hidden", !on));
    scope.querySelectorAll(".field.error").forEach((f) => f.classList.remove("error"));
    if (!on) scope.querySelectorAll("input, textarea").forEach((i) => { i.value = i.defaultValue; });
  }
  function saveEdit(scope) {
    if (!scope) return;
    const empty = Array.from(scope.querySelectorAll("[data-required]")).filter((i) => !i.value.trim());
    scope.querySelectorAll("[data-required]").forEach((i) => i.closest(".field").classList.toggle("error", !i.value.trim()));
    if (empty.length) { empty[0].focus(); return; }
    scope.querySelectorAll("input, textarea").forEach((i) => { i.defaultValue = i.value; });
    setEditing(scope, false);
    toast("Saved — the card, the list and the inspector show the new values", "Đã lưu — thẻ, danh sách và inspector hiện giá trị mới", "success");
  }

  // Library inspector: shows the novel selected in the grid or the list
  let libNovels = null;
  function libInspector() { return document.querySelector("#library .panel.right"); }
  function plainText(value, lang) {
    if (Array.isArray(value)) return value.map((v) => plainText(v, lang)).join(", ");
    return value && typeof value === "object" ? value[lang] || value.en : String(value);
  }
  function fillBilingual(el, value) {
    if (value && typeof value === "object" && el.lang && !el.querySelector("[lang]")) { el.textContent = value[el.lang] || value.en; return; }
    if (value && typeof value === "object") { ["en", "vi"].forEach((lang) => { el.querySelectorAll(`[lang="${lang}"]`).forEach((c) => { c.textContent = value[lang]; }); }); return; }
    el.textContent = value;
  }
  function makeChip(item, removable) {
    const chip = Object.assign(document.createElement("span"), { className: "chip" });
    if (typeof item === "object") chip.innerHTML = bi(item.en, item.vi); else chip.textContent = item;
    if (removable) chip.insertAdjacentHTML("beforeend", '<button type="button" class="btn ghost sm icon" data-action="tag-remove" aria-label="Remove"><svg class="icon sm"><use href="#i-x"/></svg></button>');
    return chip;
  }
  function fillChips(el, items) {
    const entry = el.querySelector("[data-tag-entry]"), empty = el.querySelector(":scope > .meta");
    Array.from(el.childNodes).filter((n) => (n.nodeType === 3 && !n.textContent.trim()) || (n.classList && n.classList.contains("chip"))).forEach((n) => n.remove());
    const chips = items.flatMap((item) => [makeChip(item, Boolean(entry)), " "]);
    if (entry) entry.before(...chips); else el.append(...chips);
    if (empty) empty.classList.toggle("hidden", items.length > 0);
  }
  function fillSelect(el, value) {
    const text = plainText(value, "en");
    const opt = Array.from(el.options).find((o) => (o.dataset.optEn || o.text) === text || o.text.endsWith(` · ${text.toLowerCase()}`));
    Array.from(el.options).forEach((o) => { o.defaultSelected = o === opt; o.selected = o === opt; });
  }
  function fillField(el, value, key) {
    const field = el.dataset.novelField;
    if (el.matches("select")) { fillSelect(el, value); return; }
    if (el.matches("input, textarea")) { el.value = plainText(value, state.lang); el.defaultValue = el.value; return; }
    if (field === "cover") { const src = document.querySelector(`#library tr[data-novel="${key}"] .cover`); if (src) { el.className = src.className; el.style.cssText = src.style.cssText; } return; }
    if (Array.isArray(value)) { fillChips(el, value); return; }
    fillBilingual(el, value);
  }
  function fillInspector(key) {
    const insp = libInspector();
    if (!libNovels) { const src = document.getElementById("lib-novels"); libNovels = src ? JSON.parse(src.textContent) : {}; }
    const data = libNovels[key];
    if (!insp || !data) return;
    document.querySelectorAll("#library [data-select][data-novel]").forEach((s) => s.classList.toggle("selected", s.dataset.novel === key));
    insp.querySelectorAll("[data-edit-scope]").forEach((scope) => setEditing(scope, false));
    insp.dataset.novel = key;
    insp.querySelectorAll("[data-novel-field]").forEach((el) => { const field = el.dataset.novelField; if (field === "cover" || field in data) fillField(el, data[field], key); });
    const pill = data.latestJobPill || "";
    if (pill) insp.querySelectorAll("[data-novel-field=latestJob]").forEach((el) => { el.className = /\bpill\b/.test(pill) ? pill : `pill ${pill}`; });
    insp.querySelectorAll("[data-novel-only]").forEach((el) => el.classList.toggle("hidden", el.dataset.novelOnly !== key));
    insp.querySelectorAll("[data-novel-generic]").forEach((el) => el.classList.toggle("hidden", key === "庆余年"));
    insp.querySelectorAll('[data-mode-key="import"][data-mode-only]').forEach((el) => el.classList.toggle("hidden", !modeOn(el, state.importMode)));
    if (key === "庆余年") renderImport();
  }

  // Import screen: leaving a preview with edits asks first (dlg-discard-import)
  const pendingScreen = { id: null };
  function markImportDirty(el) { if (el.closest("#import [data-import-edit]")) state.importDirty = true; }
  function askDiscardImport(id) {
    pendingScreen.id = id;
    document.querySelectorAll("[data-discard-for]").forEach((el) => el.classList.toggle("hidden", (el.dataset.discardFor === "app-close") !== (id === "app-close")));
    history.replaceState(null, "", "#import");
    openOverlay("dlg-discard-import");
  }
  function addTag(input) {
    const value = input.value.trim();
    if (!value) return;
    input.before(makeChip(value, true));
    input.value = "";
    markImportDirty(input);
  }
  function askCloseApp() {
    if (state.screen === "import" && state.importDirty) { askDiscardImport("app-close"); return; }
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
  // Rerun of an import job (M04 PO6): the novel still exists, so it becomes an Import more into it; duplicates are unticked
  const importConfigs = {
    "j-2026-10-06-0019": { novel: "庆余年", package: "庆余年.zip · 5.4 MB", range: "0001–0746", count: 746 },
    "j-2026-10-04-0016": { novel: "全职高手", package: "quanzhi.zip · 21.4 MB", range: "0001–1728", count: 1728 },
    "j-2026-09-30-0003": { novel: "凡人修仙传", package: "fanren.zip", range: "0001–2446", count: 2446 }
  };
  function fillRerun(id) {
    const c = importConfigs[id], n = novels[c.novel];
    state.preflight = "import-rerun";
    setText("[data-rerun-id]", id); setText("[data-rerun-novel]", novelLabel(c.novel)); setText("[data-rerun-now]", n.chapters.toLocaleString("en-US"));
    setText("[data-rerun-package]", c.package); setText("[data-rerun-range]", `${c.range} · ${c.count.toLocaleString("en-US")}`); setText("[data-rerun-target]", `novels\\${n.id}\\`);
    applyMode("#dlg-job-preflight", "type", "import-rerun"); applyMode("#dlg-job-preflight", "", "ready");
  }
  function openRerunImport(id) {
    fillRerun(id);
    openOverlay("dlg-job-preflight");
  }
  function rerunJob(btn) {
    const id = jobOf(btn);
    if (importConfigs[id]) { openRerunImport(id); return; }
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

  function busy(btn, en, vi, kind) {
    btn.classList.add("loading");
    setTimeout(() => { btn.classList.remove("loading"); toast(en, vi, kind); }, 900);
  }
  function goTab(screen, tab) {
    closeOverlays();
    const btn = document.querySelector(`#${screen} [data-tab="${tab}"]`);
    if (btn) switchTab(btn);
  }
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

  // Prototype drawer: screen states (moved out of each screen), notes ----
  const protoStates = document.querySelector("[data-proto-states]");
  screens.forEach((s) => { const block = s.querySelector(":scope > .proto-states"); if (block) { block.dataset.forScreen = s.id; protoStates.append(block); } });
  function renderDrawer(section) {
    const notes = document.querySelector(".proto-drawer .notes");
    const src = section.querySelector(".annotations");
    notes.innerHTML = src ? src.innerHTML : "";
    const blocks = protoStates.querySelectorAll(".proto-states");
    blocks.forEach((b) => { b.hidden = b.dataset.forScreen !== section.id; });
    protoStates.querySelector("[data-proto-empty]").hidden = Array.from(blocks).some((b) => !b.hidden);
    const dialogs = document.querySelectorAll(".proto-dialogs .proto-dlg");
    dialogs.forEach((d) => { d.hidden = section.id !== "components" && Boolean(d.dataset.screens) && !d.dataset.screens.split(" ").includes(section.id); });
    document.querySelector("[data-proto-dlg-empty]").hidden = Array.from(dialogs).some((d) => !d.hidden);
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
    if (e.key === "Enter" && e.target.matches("[data-tag-entry]")) { e.preventDefault(); addTag(e.target); return; }
    if (!typing && !mod && e.key === "/") { const field = document.querySelector(".screen.active [data-search-slash]"); if (field) { e.preventDefault(); field.focus(); return; } }
    if (!typing && !mod && e.key === "Enter" && state.screen === "library" && !document.querySelector(".scrim.open")) { const sel = document.querySelector("#library .novel-card.selected:not(.hidden), #library tbody tr.selected:not(.hidden)"); if (sel) { e.preventDefault(); openNovel(sel); return; } }
    if (e.key === "Enter" && e.target.matches("#reader [data-find-input]")) { e.preventDefault(); stepFind(e.shiftKey ? -1 : 1); return; }
    if (e.key === "Enter" && e.target.matches("#reader [data-replace-input]")) { e.preventDefault(); replaceInChapter(false); return; }
    if (e.key === "Escape") { const drawer = document.querySelector(".proto-drawer.open"); const overlay = document.querySelector(".scrim.open"); if (overlay) closeTopOverlay(); else if (drawer) drawer.classList.remove("open"); else if (state.screen === "reader" && findMode() !== "off") closeFind(); else app.classList.remove("zen"); return; }
    if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); openOverlay("palette"); return; }
    if (mod && e.key === "/") { e.preventDefault(); openOverlay("shortcuts"); return; }
    if (mod && e.key.toLowerCase() === "b" && !e.altKey) { e.preventDefault(); togglePanel("left"); return; }
    if (mod && e.altKey && e.key.toLowerCase() === "b") { e.preventDefault(); togglePanel("right"); return; }
    if (mod && e.key.toLowerCase() === "j") { e.preventDefault(); togglePanel("bottom"); return; }
    if (mod && e.key === ",") { e.preventDefault(); show("settings"); return; }
    if (mod && e.shiftKey && e.key.toLowerCase() === "l") { e.preventDefault(); actions["toggle-theme"](); return; }
    if (mod && e.shiftKey && e.key.toLowerCase() === "u") { e.preventDefault(); actions["toggle-lang"](); return; }
    if (mod && e.shiftKey && e.key.toLowerCase() === "t") { e.preventDefault(); show("tasks"); return; }
    if (mod && e.shiftKey && e.key.toLowerCase() === "f") { e.preventDefault(); openNovelSearch(); return; }
    if (mod && state.screen === "reader" && (e.key.toLowerCase() === "h" || (!e.shiftKey && e.key.toLowerCase() === "f"))) { e.preventDefault(); openFind(); return; }
    if (mod && e.key.toLowerCase() === "o") { e.preventDefault(); show("import"); if (state.screen === "import") screenMode("import", "start"); return; }
    if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); actions.save(); return; }
    if (mod && e.key.toLowerCase() === "e" && state.screen === "reader") { e.preventDefault(); toggleEdit(); return; }
    if (mod && moduleKeys[e.key]) { e.preventDefault(); if (!needsNovel(moduleKeys[e.key])) show(moduleKeys[e.key]); return; }
    if (e.altKey && e.key === "ArrowLeft") { e.preventDefault(); actions["prev-chapter"](); return; }
    if (e.altKey && e.key === "ArrowRight") { e.preventDefault(); actions["next-chapter"](); return; }
    if (!typing && !mod && e.key === "?") { openOverlay("shortcuts"); return; }
    if (!typing && !mod && e.key.toLowerCase() === "f" && e.shiftKey) { e.preventDefault(); actions.zen(); }
  });

  document.addEventListener("dblclick", (e) => { const item = e.target.closest("#library .novel-card, #library tbody tr"); if (item) openNovel(item); });
  window.addEventListener("hashchange", () => show(location.hash.slice(1)));
  window.addEventListener("resize", () => { const active = document.querySelector(".screen.active"); if (active) renderWaves(active); });
  document.querySelectorAll("[data-indeterminate]").forEach((box) => { box.indeterminate = true; });
  applyTheme(); applyLang(); applyLayout(); renderJob(); syncImportCard(); toggleEdit(false);
  show(location.hash.slice(1) || defaultScreen);
})();
